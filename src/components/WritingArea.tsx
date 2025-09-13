import React, { useState, useEffect, useRef } from "react";

// Server-backed API (Netlify functions only)
import { evaluateEssay, saveDraft } from "../lib/api";

// Real-time coach triggers
import { eventBus } from "../lib/eventBus";
import { detectNewParagraphs } from "../lib/paragraphDetection";

// NSW rubric UI + types + guards
import type { DetailedFeedback, LintFix } from "../types/feedback";
import { validateDetailedFeedback } from "../types/feedback.validate";

// Tabs (Coach / Analysis / Vocab / Progress)
import { TabbedCoachPanel } from "./TabbedCoachPanel";

// Import the status bar component (this should exist)
import { WritingStatusBar } from "./WritingStatusBar";

// Import icons for inline buttons
import { 
  PenTool, 
  Play, 
  BookOpen, 
  Lightbulb, 
  Target
} from 'lucide-react';

type TextType = "narrative" | "persuasive" | "informative";

interface Props {
  content?: string;
  onChange?: (content: string) => void;
  textType?: string;
  onTextTypeChange?: (textType: string) => void;
  onPopupCompleted?: () => void;
  onPromptGenerated?: (prompt: string) => void;
  /** Prompt passed by EnhancedWritingLayout */
  prompt?: string;
}

function fallbackPrompt(textType?: string) {
  const defaultPrompt =
    "Write an engaging story about a character who discovers something unexpected that changes their life forever. Include vivid descriptions, realistic dialogue, and show the character's emotional journey.";
  try {
    const stored = localStorage.getItem("generatedPrompt");
    if (stored) return stored;
    const type = (textType || localStorage.getItem("selectedWritingType") || "narrative").toLowerCase();
    const byType = localStorage.getItem(`${type}_prompt`);
    if (byType) return byType;
  } catch { /* ignore */ }
  return defaultPrompt;
}

function WritingAreaImpl(props: Props) {
  // -------- Prompt header (visible) --------
  const [displayPrompt, setDisplayPrompt] = useState<string>("");

  useEffect(() => {
    const next =
      (typeof props.prompt === "string" && props.prompt.trim()) ||
      fallbackPrompt(props.textType);
    setDisplayPrompt(next);
  }, [props.prompt, props.textType]);

  // Allow other tabs to update localStorage → refresh card
  useEffect(() => {
    const onStorage = () => setDisplayPrompt(fallbackPrompt(props.textType));
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------- Editor state --------
  const [content, setContent] = useState<string>(props.content ?? "");
  const [textType, setTextType] = useState<TextType>((props.textType as TextType) || "narrative");
  const prevTextRef = useRef<string>(content);

  // -------- New state for buttons and status bar --------
  const [examMode, setExamMode] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [showHighlights, setShowHighlights] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Sync with parent if controlled
  useEffect(() => { if (typeof props.content === "string") setContent(props.content); }, [props.content]);
  useEffect(() => { if (typeof props.textType === "string") setTextType(props.textType as TextType); }, [props.textType]);
  useEffect(() => { prevTextRef.current = content; }, [content]);

  // -------- Analysis state --------
  const [analysis, setAnalysis] = useState<DetailedFeedback | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [err, setErr] = useState<string>();

  // -------- Autosave --------
  const [version, setVersion] = useState(0);
  const draftId = useRef(
    `draft-${
      (globalThis.crypto?.randomUUID?.() ??
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15))
    }`
  ).current;

  // -------- Word count --------
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  // -------- Event handlers --------
  const onEditorChange = (newContent: string) => {
    setContent(newContent);
    props.onChange?.(newContent);

    // Trigger paragraph detection for real-time coaching
    const newParagraphs = detectNewParagraphs(prevTextRef.current, newContent);
    if (newParagraphs.length > 0) {
      eventBus.emit("newParagraphs", { paragraphs: newParagraphs, textType });
    }

    // Auto-save logic
    setVersion(v => v + 1);
  };

  // Handle word selection from vocab coach
  const handleWordSelect = (word: string) => {
    // Insert the selected word at the cursor position or append to content
    const textarea = document.querySelector('textarea');
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.substring(0, start) + word + content.substring(end);
      setContent(newContent);
      props.onChange?.(newContent);
      
      // Focus back to textarea and set cursor position
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + word.length, start + word.length);
      }, 0);
    } else {
      // Fallback: append to content
      const newContent = content + (content.endsWith(' ') ? '' : ' ') + word;
      setContent(newContent);
      props.onChange?.(newContent);
    }
  };

  // Auto-save effect
  useEffect(() => {
    if (version === 0) return;
    const timer = setTimeout(async () => {
      if (!content.trim()) return;
      setIsSaving(true);
      try {
        await saveDraft(draftId, { content, textType, version });
        setLastSaved(new Date());
      } catch (error) {
        console.warn("Auto-save failed:", error);
      } finally {
        setIsSaving(false);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [version, content, textType, draftId]);

  // -------- Submit for evaluation --------
  const onSubmitForEvaluation = async () => {
    if (!content.trim()) return;
    setStatus("loading");
    setErr(undefined);
    try {
      const result = await evaluateEssay(content, textType);
      if (validateDetailedFeedback(result)) {
        setAnalysis(result);
        setStatus("success");
      } else {
        throw new Error("Invalid feedback format received");
      }
    } catch (error) {
      console.error("Evaluation failed:", error);
      setErr(error instanceof Error ? error.message : "Evaluation failed");
      setStatus("error");
    }
  };

  // -------- Apply lint fixes --------
  const onApplyFix = (fix: LintFix) => {
    const newContent = content.substring(0, fix.start) + fix.replacement + content.substring(fix.end);
    setContent(newContent);
    props.onChange?.(newContent);
  };

  // -------- Status bar handlers --------
  const handleToggleHighlights = () => setShowHighlights(!showHighlights);
  const handleEvaluate = () => onSubmitForEvaluation();
  const handleShowPlanning = () => {
    // Implementation for showing planning tools
    console.log("Show planning tools");
  };
  const handleRestore = () => {
    // Implementation for restoring from draft
    console.log("Restore from draft");
  };

  return (
    <div className="space-y-4">
      {/* Prompt Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start space-x-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
            <PenTool className="h-6 w-6 text-blue-600 dark:text-blue-300" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Your Writing Prompt
            </h3>
            <p className="text-blue-800 dark:text-blue-200 leading-relaxed">
              {displayPrompt}
            </p>
          </div>
        </div>
      </div>

      {/* Main Writing Interface */}
      <div className="grid grid-cols-12 gap-6">
        {/* LEFT: Editor */}
        <div className="col-span-8 space-y-4">
          {/* Toolbar */}
          <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {textType.charAt(0).toUpperCase() + textType.slice(1)} Writing
                </span>
              </div>
              <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {wordCount} words
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setExamMode(!examMode)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  examMode 
                    ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' 
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                {examMode ? 'Exam Mode' : 'Practice Mode'}
              </button>
            </div>
          </div>

          {/* --- Editor --- */}
          <div className="flex-1 rounded-xl border bg-white">
            <div className="p-3 h-full">
              <textarea
                className="w-full h-full p-3 rounded-lg border resize-none"
                placeholder="Start writing your amazing story here! Let your creativity flow and bring your ideas to life…"
                value={content}
                onChange={(e) => onEditorChange(e.target.value)}
                style={{ minHeight: '400px' }}
              />
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              className="px-4 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              onClickCapture={(e) => { e.stopPropagation(); onSubmitForEvaluation(); }}
              onClick={(e) => e.stopPropagation()}
              disabled={status === "loading" || !content?.trim()}
              aria-label="Submit for Evaluation Report"
            >
              {status === "loading" ? "Analyzing…" : "Submit for Evaluation Report"}
            </button>
            {status === "error" && <span className="text-red-600 text-sm">{err}</span>}
            {status === "success" && <span className="text-green-600 text-sm">Analysis complete!</span>}
          </div>

          {/* Optional helper text */}
          {analysis && status === "success" && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Analysis complete</h3>
              <p className="text-sm text-blue-800">
                Open the <strong>Analysis</strong> tab on the right to see rubric scores and apply suggested fixes.
              </p>
            </div>
          )}
        </div>

        {/* RIGHT: Tabs (Coach / Analysis / Vocab / Progress) */}
        <div className="col-span-4">
          <TabbedCoachPanel 
            analysis={analysis} 
            onApplyFix={onApplyFix}
            content={content}
            textType={textType}
            onWordSelect={handleWordSelect}
          />
        </div>
      </div>

      {/* Writing Status Bar */}
      <WritingStatusBar
        wordCount={wordCount}
        lastSaved={lastSaved}
        isSaving={isSaving}
        showHighlights={showHighlights}
        onToggleHighlights={handleToggleHighlights}
        onEvaluate={handleEvaluate}
        onShowPlanning={handleShowPlanning}
        content={content}
        textType={textType}
        onRestore={handleRestore}
        examMode={examMode}
        examDurationMinutes={30}
        targetWordCountMin={100}
        targetWordCountMax={500}
      />
    </div>
  );
}

export default WritingAreaImpl;
export const WritingArea = WritingAreaImpl;
