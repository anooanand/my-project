import React, { useState, useCallback, useRef, useEffect } from "react";
import { InteractiveTextEditor } from "./InteractiveTextEditor";
import { TabbedCoachPanel } from "./TabbedCoachPanel";
import { evaluateEssay, saveDraft } from "../lib/api";
import { detectNewParagraphs, detectWordThreshold, detectWritingPause } from "../lib/paragraphDetection";
import { eventBus } from "../lib/eventBus";
import type { DetailedFeedback, LintFix } from "../types/feedback";

type TextType = "narrative" | "persuasive" | "informative";

interface WritingAreaProps {
  content: string;
  onChange: (content: string) => void;
  textType?: string;
  assistanceLevel?: string;
  onPlanningPhase?: () => void;
  onStartExamMode?: () => void;
  onStructureGuide?: () => void;
  onTips?: () => void;
  onFocus?: () => void;
  onWordSelect?: (word: string) => void;
}

export function WritingArea(props: WritingAreaProps) {
  // -------- Content state --------
  const [content, setContent] = useState(props.content || "");
  const [textType, setTextType] = useState<TextType>("narrative");
  const [examMode, setExamMode] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [showHighlights, setShowHighlights] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Reference to track previous content for paragraph detection
  const prevTextRef = useRef(content);
  const lastChangeTimeRef = useRef(Date.now());
  const feedbackCooldownRef = useRef<Set<string>>(new Set()); // Prevent duplicate feedback

  // -------- Theme toggle --------
  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
  };

  // -------- Effects --------
  useEffect(() => { setContent(props.content || ""); }, [props.content]);
  useEffect(() => { if (typeof props.textType === "string") setTextType(props.textType as TextType); }, [props.textType]);
  useEffect(() => { prevTextRef.current = content; }, [content]);

  // -------- Analysis state --------
  const [analysis, setAnalysis] = useState<DetailedFeedback | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [err, setErr] = useState<string>();

  // -------- Autosave --------
  const [version, setVersion] = useState(0);
  const draftId = useRef(
    `draft-${(
      globalThis.crypto?.randomUUID?.() ??
      Date.now().toString(36) + Math.random().toString(36).slice(2))
    }`
  );

  // Enhanced editor change handler with better feedback triggers
  const onEditorChange = useCallback((newText: string) => {
    setContent(newText);
    props.onChange?.(newText);
    lastChangeTimeRef.current = Date.now();

    // Real-time paragraph detection
    const newParagraphs = detectNewParagraphs(prevTextRef.current, newText);
    if (newParagraphs.length > 0) {
      eventBus.emit("newParagraph", { paragraphs: newParagraphs });
    }

    // Enhanced word threshold detection for coaching
    const wordThresholdResult = detectWordThreshold(prevTextRef.current, newText, 20);
    if (wordThresholdResult) {
      // Create a unique key for this feedback to prevent duplicates
      const feedbackKey = `${wordThresholdResult.trigger}-${wordThresholdResult.wordCount}`;
      
      if (!feedbackCooldownRef.current.has(feedbackKey)) {
        feedbackCooldownRef.current.add(feedbackKey);
        
        // Emit coaching event with enhanced context
        eventBus.emit("paragraph.ready", {
          paragraph: wordThresholdResult.text,
          index: 0,
          wordCount: wordThresholdResult.wordCount,
          trigger: wordThresholdResult.trigger,
          textType: textType
        });

        // Clear old feedback keys to prevent memory buildup
        if (feedbackCooldownRef.current.size > 10) {
          const keys = Array.from(feedbackCooldownRef.current);
          keys.slice(0, 5).forEach(key => feedbackCooldownRef.current.delete(key));
        }
      }
    }
  }, [setContent, props.onChange, textType]);

  // Add pause detection for delayed feedback
  useEffect(() => {
    const pauseCheckInterval = setInterval(() => {
      if (content.trim() && detectWritingPause(lastChangeTimeRef.current, 5000)) {
        const wordCount = content.trim().split(/\s+/).length;
        
        // Provide feedback on pause if user has written substantial content
        if (wordCount >= 30) {
          const pauseKey = `pause-${Math.floor(wordCount / 50) * 50}`;
          
          if (!feedbackCooldownRef.current.has(pauseKey)) {
            feedbackCooldownRef.current.add(pauseKey);
            
            // Get the last paragraph or recent content
            const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim());
            const lastParagraph = paragraphs[paragraphs.length - 1] || content.slice(-200);
            
            eventBus.emit("paragraph.ready", {
              paragraph: lastParagraph,
              index: paragraphs.length - 1,
              wordCount: wordCount,
              trigger: 'writing_pause',
              textType: textType
            });
          }
        }
      }
    }, 2000); // Check every 2 seconds

    return () => clearInterval(pauseCheckInterval);
  }, [content, textType]);

  // SIMPLIFIED: Remove strict validation that was causing issues
  const onSubmitForEvaluation = useCallback(async () => {
    if (!content.trim()) {
      setErr("Please write some text before submitting for evaluation");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setErr(undefined);
    
    try {
      console.log("Starting evaluation...");
      const res = await evaluateEssay({ essayText: content, textType });
      console.log("Evaluation response:", res);
      
      // Accept any response that has the basic structure
      if (res && typeof res === 'object' && res.overallScore !== undefined) {
        setAnalysis(res);
        setStatus("success");
        console.log("Analysis successful!");
      } else {
        throw new Error("Invalid response format");
      }
    } catch (e: any) {
      console.error("Evaluation failed:", e);
      setStatus("error");
      setErr(e?.message || "Failed to analyze essay. Please try again.");
    }
  }, [content, textType]);

  const onApplyFix = useCallback((fix: LintFix) => {
    const before = content.slice(0, fix.start);
    const after = content.slice(fix.end);
    const newContent = before + fix.replacement + after;
    onEditorChange(newContent);
  }, [content, onEditorChange]);

  // -------- Button handlers --------
  const handlePlanningPhase = () => {
    console.log("Planning Phase clicked");
    props.onPlanningPhase?.();
  };

  const handleStartExamMode = () => {
    console.log("Start Exam Mode clicked");
    setExamMode(!examMode);
    props.onStartExamMode?.();
  };

  const handleStructureGuide = () => {
    console.log("Structure Guide clicked");
    props.onStructureGuide?.();
  };

  const handleTips = () => {
    console.log("Tips clicked");
    props.onTips?.();
  };

  const handleFocus = () => {
    console.log("Focus clicked - toggling dark mode");
    setFocusMode(!focusMode);
    toggleTheme(); // Toggle the theme when Focus is clicked
    props.onFocus?.();
  };

  const handleToggleHighlights = () => {
    setShowHighlights(!showHighlights);
  };

  const handleEvaluate = () => {
    onSubmitForEvaluation();
  };

  const handleShowPlanning = () => {
    handlePlanningPhase();
  };

  const handleRestore = () => {
    // Add restore logic here
    console.log("Restore clicked");
  };

  // -------- Word count --------
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  // -------- Autosave effect --------
  useEffect(() => {
    const autoSaveInterval = setInterval(async () => {
      if (!content.trim()) return;
      try {
        setIsSaving(true);
        localStorage.setItem(draftId.current, JSON.stringify({ text: content, version }));
        try {
          await saveDraft(draftId.current, content, version);
          setVersion(v => v + 1);
          setLastSaved(new Date());
        } catch {
          // Server save failed, but localStorage succeeded
        } finally {
          setIsSaving(false);
        }
      } catch {
        setIsSaving(false);
      }
    }, 1500);
    return () => clearInterval(autoSaveInterval);
  }, [content, version]);

  return (
    <div className="flex h-full bg-gray-50">
      {/* Left side - Writing area */}
      <div className="flex-1 flex flex-col">
        {/* Action buttons */}
        <div className="p-4 bg-white border-b border-gray-200">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleShowPlanning}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
            >
              📋 Planning Phase
            </button>
            <button
              onClick={handleStartExamMode}
              className={`px-4 py-2 rounded-lg transition-colors text-sm ${
                examMode 
                  ? 'bg-green-500 text-white hover:bg-green-600' 
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              ▶️ Start Exam Mode
            </button>
            <button
              onClick={handleStructureGuide}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm"
            >
              📖 Structure Guide
            </button>
            <button
              onClick={handleTips}
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm"
            >
              💡 Tips
            </button>
            <button
              onClick={handleFocus}
              className={`px-4 py-2 rounded-lg transition-colors text-sm ${
                focusMode 
                  ? 'bg-gray-700 text-white hover:bg-gray-800' 
                  : 'bg-gray-500 text-white hover:bg-gray-600'
              }`}
            >
              🎯 Focus
            </button>
          </div>
        </div>

        {/* Text editor */}
        <div className="flex-1 p-4">
          <InteractiveTextEditor
            content={content}
            onChange={onEditorChange}
            placeholder="Start writing your story here..."
            className="w-full h-full border border-gray-300 rounded-lg p-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Bottom status bar */}
        <div className="p-4 bg-white border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>📝 {wordCount} words</span>
              {isSaving && <span className="text-blue-600">💾 Saving...</span>}
              {lastSaved && (
                <span>✅ Saved at: {lastSaved.toLocaleTimeString()}</span>
              )}
            </div>
            
            <button
              onClick={handleEvaluate}
              disabled={status === "loading" || !content.trim()}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                status === "loading"
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {status === "loading" ? "Analyzing..." : "Submit for Evaluation Report"}
            </button>
          </div>
          
          {status === "success" && (
            <div className="mt-2 text-green-600 text-sm">
              ✅ Analysis complete
            </div>
          )}
          
          {status === "error" && err && (
            <div className="mt-2 text-red-600 text-sm">
              ❌ {err}
            </div>
          )}
        </div>
      </div>

      {/* Right side - Coach panel */}
      <div className="w-96 border-l border-gray-200">
        <TabbedCoachPanel
          analysis={analysis}
          onApplyFix={onApplyFix}
          content={content}
          textType={textType}
          onWordSelect={props.onWordSelect}
        />
      </div>
    </div>
  );
}
