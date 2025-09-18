import React, { useState, useRef, useEffect } from 'react';

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

// Import icons for inline buttons
import { 
  PenTool, 
  Play, 
  BookOpen, 
  Lightbulb, 
  Target,
  FileText,
  Timer,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  Eye,
  EyeOff,
  Pause,
  X
} from 'lucide-react';

type TextType = "narrative" | "persuasive" | "informative";

interface Props {
  content?: string;
  onChange?: (content: string) => void;
  textType?: string;
  onTextTypeChange?: (textType: string) => void;
  onPopupCompleted?: () => void;
  onPromptGenerated?: (prompt: string) => void;
  onPlanningPhase?: () => void;
  onStartExamMode?: () => void;
  onStructureGuide?: () => void;
  onTips?: () => void;
  onFocus?: () => void;
  onWordSelect?: (word: string) => void;
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
  } catch {}
  return defaultPrompt;
}

function WritingAreaImpl(props: Props) {
  // -------- Content state --------
  const [content, setContent] = useState(props.content || "");
  const [textType, setTextType] = useState<TextType>((props.textType as TextType) || "narrative");
  const [displayPrompt, setDisplayPrompt] = useState(() => fallbackPrompt(props.textType));

  // -------- UI state --------
  const [examMode, setExamMode] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [showHighlights, setShowHighlights] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Modal states
  const [showPlanningModal, setShowPlanningModal] = useState(false);
  const [showStructureModal, setShowStructureModal] = useState(false);
  const [showTipsModal, setShowTipsModal] = useState(false);
  const [planningStep, setPlanningStep] = useState(1);

  // -------- Refs --------
  const prevTextRef = useRef(content);
  const [version, setVersion] = useState(0);
  const draftId = useRef(
    `draft-${(
      globalThis.crypto?.randomUUID?.() ??
      Date.now().toString(36) + Math.random().toString(36).slice(2))
    }`
  );

  // Sync props
  useEffect(() => { if (typeof props.content === "string") setContent(props.content); }, [props.content]);
  useEffect(() => { if (typeof props.textType === "string") setTextType(props.textType as TextType); }, [props.textType]);
  useEffect(() => { prevTextRef.current = content; }, [content]);

  // -------- Analysis state --------
  const [analysis, setAnalysis] = useState<DetailedFeedback | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [err, setErr] = useState("");

  // -------- Event handlers --------
  const onEditorChange = (newContent: string) => {
    setContent(newContent);
    props.onChange?.(newContent);
    
    // Trigger real-time coaching
    const newParagraphs = detectNewParagraphs(prevTextRef.current, newContent);
    if (newParagraphs.length > 0) {
      eventBus.emit('newParagraph', { paragraphs: newParagraphs, textType });
    }
  };

  const onApplyFix = (fix: LintFix) => {
    const newContent = content.replace(fix.original, fix.suggestion);
    onEditorChange(newContent);
  };

  const onSubmitForEvaluation = async () => {
    if (!content?.trim()) {
      setErr("Please write some text before submitting for evaluation");
      setStatus("error");
      return;
    }
    
    setStatus("loading");
    setErr("");
    
    try {
      const result = await evaluateEssay(content, textType);
      
      if (validateDetailedFeedback(result)) {
        setAnalysis(result);
        setStatus("success");
      } else {
        throw new Error("Invalid feedback format received");
      }
    } catch (error) {
      console.error("Evaluation error:", error);
      setErr(error instanceof Error ? error.message : "Analysis failed");
      setStatus("error");
    }
  };

  // Button handlers
  const handlePlanningPhase = () => {
    setShowPlanningModal(true);
    props.onPlanningPhase?.();
  };

  const handleStartExamMode = () => {
    setExamMode(!examMode);
    props.onStartExamMode?.();
  };

  const handleStructureGuide = () => {
    setShowStructureModal(true);
    props.onStructureGuide?.();
  };

  const handleTips = () => {
    setShowTipsModal(true);
    props.onTips?.();
  };

  const handleFocus = () => {
    setFocusMode(!focusMode);
    props.onFocus?.();
  };

  // -------- Computed values --------
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  // -------- Auto-save --------
  useEffect(() => {
    const t = setInterval(async () => {
      try {
        if (content?.trim()) {
          setIsSaving(true);
          localStorage.setItem(draftId.current, JSON.stringify({ text: content, version }));
          await saveDraft(draftId.current, content, version);
          setVersion(v => v + 1);
          setLastSaved(new Date());
          setIsSaving(false);
        }
      } catch {
        setIsSaving(false);
      }
    }, 1500);
    return () => clearInterval(t);
  }, [content, version]);

  // Planning modal steps
  const planningSteps = [
    {
      title: "🎭 Who is your main character?",
      description: "Think about your hero! What do they look like? How old are they? What makes them special?",
      placeholder: "My main character is..."
    },
    {
      title: "🌍 Where does your story happen?",
      description: "Paint a picture of your setting! Is it a magical forest, a busy city, or somewhere completely different?",
      placeholder: "My story takes place in..."
    },
    {
      title: "⚡ What's the big problem?",
      description: "Every great story has a problem to solve! What challenge will your character face?",
      placeholder: "The main problem is..."
    },
    {
      title: "🚀 What exciting things happen?",
      description: "This is where the adventure really begins! What obstacles will your character face? How will they try to solve the problem?",
      placeholder: "The exciting events are..."
    },
    {
      title: "🎯 How does it end?",
      description: "Time for a satisfying ending! How does your character solve the problem? What do they learn? How do they feel at the end?",
      placeholder: "The story ends when..."
    },
    {
      title: "✨ What's your story's message?",
      description: "What important lesson or feeling do you want readers to take away from your story?",
      placeholder: "The message of my story is..."
    }
  ];

  return (
    <div className={`flex h-[calc(100vh-3rem)] bg-gray-50 transition-all duration-300 ${focusMode ? 'bg-gray-900' : ''}`}>
      {/* Left side - Writing Area - ADJUSTED FOR WIDER RIGHT PANEL */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${focusMode ? 'mr-0' : 'mr-4'} max-w-[calc(100%-32rem)]`}>
        
        {/* Writing Prompt Section */}
        <div className={`bg-white rounded-lg shadow-sm p-6 mb-4 focus-hide ${focusMode ? 'opacity-30' : ''}`}>
          <div className="flex items-start space-x-3">
            <div className="bg-yellow-100 p-2 rounded-lg">
              <Lightbulb className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-gray-800">Your Writing Prompt</h2>
                <div className="text-xs opacity-70">Text Type:&nbsp;
                  <select
                    className="rounded-md border px-2 py-1"
                    value={textType}
                    onChange={(e) => {
                      const v = e.target.value as TextType;
                      setTextType(v);
                      props.onTextTypeChange?.(v);
                      setDisplayPrompt(fallbackPrompt(v));
                    }}
                  >
                    <option value="narrative">Narrative</option>
                    <option value="persuasive">Persuasive</option>
                    <option value="informative">Informative</option>
                  </select>
                </div>
              </div>
              <div className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                {displayPrompt || "Loading prompt…"}
              </div>
            </div>
          </div>
        </div>

        {/* Inline Writing Mode Buttons */}
        <div className={`bg-white rounded-lg shadow-sm p-4 mb-4 focus-hide ${focusMode ? 'opacity-30' : ''}`}>
          <div className="flex flex-wrap gap-3">
            {/* Planning Phase Button */}
            <button
              onClick={handlePlanningPhase}
              disabled={status === "loading"}
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 shadow-sm"
              title="Planning Phase - Organize your ideas before writing"
            >
              <PenTool className="h-4 w-4 mr-2" />
              Planning Phase
            </button>

            {/* Start Exam Mode Button */}
            <button
              onClick={handleStartExamMode}
              disabled={status === "loading"}
              className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg ${examMode ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 shadow-sm`}
              title="Start Exam Mode - Practice under timed conditions"
            >
              {examMode ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              {examMode ? 'Stop Exam Mode' : 'Start Exam Mode'}
            </button>

            {/* Structure Guide Button */}
            <button
              onClick={handleStructureGuide}
              disabled={status === "loading"}
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-purple-500 text-white hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 shadow-sm"
              title="Structure Guide - Learn how to organize your writing"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Structure Guide
            </button>

            {/* Tips Button */}
            <button
              onClick={handleTips}
              disabled={status === "loading"}
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-yellow-500 text-white hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 shadow-sm"
              title="Tips - Get helpful writing advice"
            >
              <Lightbulb className="h-4 w-4 mr-2" />
              Tips
            </button>

            {/* Focus Button */}
            <button
              onClick={handleFocus}
              disabled={status === "loading"}
              className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg ${focusMode ? 'bg-orange-500 hover:bg-orange-600' : 'bg-gray-600 hover:bg-gray-700'} text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 shadow-sm`}
              title="Focus Mode - Minimize distractions while writing"
            >
              {focusMode ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {focusMode ? 'Exit Focus' : 'Focus'}
            </button>
          </div>
        </div>

        {/* Writing Area */}
        <div className="flex-1 bg-white rounded-lg shadow-sm mb-4">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Writing</h3>
            <textarea
              className={`w-full h-full p-3 rounded-lg border resize-none outline-none transition-all duration-300 ${
                focusMode ? 'bg-gray-800 text-white text-lg border-gray-600' : 'bg-white text-gray-700'
              }`}
              placeholder="Start writing your amazing story here! Let your creativity flow and bring your ideas to life…"
              value={content}
              onChange={(e) => onEditorChange(e.target.value)}
              style={{ minHeight: '400px' }}
            />
          </div>
        </div>

        {/* Status Bar */}
        <div className={`bg-white rounded-lg shadow-sm p-4 focus-hide ${focusMode ? 'opacity-30' : ''}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>{wordCount} words</span>
              </div>
              <div className="flex items-center space-x-2">
                <Timer className="w-4 h-4" />
                <span>0 WPM</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>{readingTime} min read</span>
              </div>
              {status === "success" && (
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-green-600">Analysis complete</span>
                </div>
              )}
              {status === "error" && (
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-red-600">Analysis failed</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                onClick={onSubmitForEvaluation}
                disabled={status === "loading" || !content?.trim()}
                aria-label="Submit for Evaluation Report"
              >
                <Send className="w-4 h-4" />
                <span>{status === "loading" ? "Analyzing…" : "Submit for Evaluation Report"}</span>
              </button>
              {status === "error" && <span className="text-red-600 text-sm">{err}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Writing Buddy Panel - MADE MUCH WIDER */}
      {!focusMode && (
        <div className="w-[30rem] min-w-[30rem] flex-shrink-0">
          <TabbedCoachPanel 
            analysis={analysis} 
            onApplyFix={onApplyFix}
            content={content}
            textType={textType}
            onWordSelect={props.onWordSelect}
          />
        </div>
      )}

      {/* Planning Modal */}
      {showPlanningModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Planning Your Story</h2>
              <button onClick={() => setShowPlanningModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${(planningStep / planningSteps.length) * 100}%` }}></div>
            </div>

            {/* Step Content */}
            <div>
              <h3 className="text-xl font-semibold mb-2">{planningSteps[planningStep - 1].title}</h3>
              <p className="text-gray-600 mb-4">{planningSteps[planningStep - 1].description}</p>
              <textarea
                className="w-full p-3 rounded-lg border resize-y"
                rows={5}
                placeholder={planningSteps[planning-1].placeholder}
              ></textarea>
            </div>

            {/* Navigation */}
            <div className="flex justify-between mt-6">
              <button 
                onClick={() => setPlanningStep(prev => Math.max(1, prev - 1))}
                disabled={planningStep === 1}
                className="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 disabled:opacity-50"
              >
                Back
              </button>
              <button 
                onClick={() => setPlanningStep(prev => Math.min(planningSteps.length, prev + 1))}
                disabled={planningStep === planningSteps.length}
                className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function WritingArea(props: Props) {
  return <WritingAreaImpl {...props} />;
}
