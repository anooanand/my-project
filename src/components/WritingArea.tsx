import React, { useState, useCallback, useRef, useEffect } from "react";

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
  const [err, setErr] = useState<string>();

  // ORIGINAL WORKING LOGIC: Typing + paragraph detection
  const onEditorChange = (next: string) => {
    const events = detectNewParagraphs(prevTextRef.current, next);
    if (events.length) {
      console.log("Emitting paragraph.ready event:", events[events.length - 1]);
      eventBus.emit("paragraph.ready", events[events.length - 1]);
    }
    prevTextRef.current = next;
    setContent(next);
    props.onChange?.(next);
  };

  // Submit → strict JSON rubric (server)
  const onSubmitForEvaluation = async () => {
    if (!content || !content.trim()) {
      setStatus("error");
      setErr("Please write some content before submitting for evaluation");
      return;
    }
    try {
      setStatus("loading"); setErr(undefined);
      const res = await evaluateEssay({
        essayText: content.trim(),
        textType,
        examMode: false,
      });
      if (!validateDetailedFeedback(res)) throw new Error("Invalid feedback payload");
      setAnalysis(res);
      setStatus("success");
    } catch (e: any) {
      setStatus("error");
      setErr(e?.message || "Failed to analyze");
    }
  };

  // Apply a server-proposed fix
  const onApplyFix = (fix: LintFix) => {
    const next = content.slice(0, fix.start) + fix.replacement + content.slice(fix.end);
    setContent(next);
    props.onChange?.(next);
  };

  // -------- Button handlers --------
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

  // Calculate word count
  const wordCount = content.trim() ? content.trim().split(/\s+/).filter(Boolean).length : 0;
  const readingTime = Math.ceil(wordCount / 200);

  // Autosave
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
    <div className={`flex h-screen bg-gray-50 transition-all duration-300 ${focusMode ? 'bg-gray-900' : ''}`}>
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
              <h2 className="text-2xl font-bold text-gray-800">📝 Story Planning Workshop</h2>
              <button
                onClick={() => setShowPlanningModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-600">Step {planningStep} of {planningSteps.length}</span>
                <div className="flex space-x-1">
                  {planningSteps.map((_, index) => (
                    <span
                      key={index}
                      className={`h-2 w-2 rounded-full ${index + 1 === planningStep ? 'bg-blue-500' : 'bg-gray-300'}`}
                    ></span>
                  ))}
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-3">{planningSteps[planningStep - 1].title}</h3>
              <p className="text-gray-600 mb-4">{planningSteps[planningStep - 1].description}</p>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[100px]"
                placeholder={planningSteps[planningStep - 1].placeholder}
              ></textarea>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setPlanningStep(prev => Math.max(1, prev - 1))}
                disabled={planningStep === 1}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50"
              >
                Previous
              </button>
              {planningStep < planningSteps.length ? (
                <button
                  onClick={() => setPlanningStep(prev => prev + 1)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={() => {
                    setShowPlanningModal(false);
                    props.onPopupCompleted?.();
                  }}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  Finish Planning
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Structure Guide Modal */}
      {showStructureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">📚 Structure Guide</h2>
              <button
                onClick={() => setShowStructureModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="prose max-w-none text-gray-700">
              <h3 className="text-xl font-semibold mb-2">Narrative Writing Structure</h3>
              <p>A typical narrative follows a story arc:</p>
              <ol className="list-decimal list-inside space-y-2">
                <li><strong>Exposition:</strong> Introduce characters, setting, and initial situation.</li>
                <li><strong>Rising Action:</strong> Develop the conflict, build suspense, and introduce complications.</li>
                <li><strong>Climax:</strong> The turning point, the most intense moment of the story.</li>
                <li><strong>Falling Action:</strong> Events that happen after the climax, leading to the resolution.</li>
                <li><strong>Resolution:</strong> The conclusion of the story, where conflicts are resolved.</li>
              </ol>
              <h3 className="text-xl font-semibold mt-6 mb-2">Tips for Each Section:</h3>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Exposition:</strong> "Hook" your reader with an interesting opening.</li>
                <li><strong>Rising Action:</strong> Use vivid descriptions and strong verbs.</li>
                <li><strong>Climax:</strong> Make it dramatic and impactful.</li>
                <li><strong>Falling Action:</strong> Tie up loose ends.</li>
                <li><strong>Resolution:</strong> Leave the reader with a sense of closure.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tips Modal */}
      {showTipsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">💡 Writing Tips</h2>
              <button
                onClick={() => setShowTipsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="prose max-w-none text-gray-700">
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Show, Don't Tell:</strong> Instead of saying a character is sad, describe their slumped shoulders and tear-filled eyes.</li>
                <li><strong>Vary Sentence Structure:</strong> Mix short, punchy sentences with longer, more descriptive ones to keep your writing engaging.</li>
                <li><strong>Use Sensory Details:</strong> Engage all five senses (sight, sound, smell, touch, taste) to make your descriptions come alive.</li>
                <li><strong>Strong Verbs and Adjectives:</strong> Choose powerful words that convey meaning precisely and vividly.</li>
                <li><strong>Realistic Dialogue:</strong> Make your characters' conversations sound natural and authentic.</li>
                <li><strong>Pacing:</strong> Control the speed at which your story unfolds. Speed up for action, slow down for reflection.</li>
                <li><strong>Revise and Edit:</strong> Always review your work for clarity, coherence, grammar, and spelling.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WritingAreaImpl;
export const WritingArea = WritingAreaImpl;
