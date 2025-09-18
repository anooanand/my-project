import React from "react";
import { InteractiveTextEditor, EditorHandle } from "../components/InteractiveTextEditor";
import { RubricPanel } from "../components/RubricPanel";
import { CoachProvider } from "../components/CoachProvider";
import { WritingStatusBar } from "../components/WritingStatusBar";
import ProgressCoach from "../components/ProgressCoach";
import type { DetailedFeedback, LintFix } from "../types/feedback";
import { evaluateEssay, saveDraft } from "../lib/api";
import { validateDetailedFeedback } from "../types/feedback.validate";
import { eventBus } from "../lib/eventBus";
import { detectNewParagraphs } from "../lib/paragraphDetection";

export default function WritingWorkspaceFixed() {
  const editorRef = React.useRef<EditorHandle>(null);
  const [analysis, setAnalysis] = React.useState<DetailedFeedback | null>({
    overallScore: 0,
    criteria: {
      ideasContent: { score: 0, weight: 30, strengths: [], improvements: [] },
      structureOrganization: { score: 0, weight: 25, strengths: [], improvements: [] },
      languageVocab: { score: 0, weight: 25, strengths: [], improvements: [] },
      spellingPunctuationGrammar: { score: 0, weight: 20, strengths: [], improvements: [] },
    },
    grammarCorrections: [],
    vocabularyEnhancements: [],
    id: "initial-feedback",
  });
  const [status, setStatus] = React.useState<"idle"|"loading"|"success"|"error">("idle");
  const [err, setErr] = React.useState<string|undefined>(undefined);
  const [currentText, setCurrentText] = React.useState<string>("");
  const [textType, setTextType] = React.useState<'narrative' | 'persuasive' | 'informative'>('narrative');
  const [targetWordCount, setTargetWordCount] = React.useState<number>(300);
  const [wordCount, setWordCount] = React.useState<number>(0);
  const prevTextRef = React.useRef<string>("");

  // Replace your draftId line with this:
  const draftId = React.useRef<string>(
    `draft-${
      (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function")
        ? globalThis.crypto.randomUUID()
        : (Date.now().toString(36) + Math.random().toString(36).slice(2))
    }`
  );
  const [version, setVersion] = React.useState(0);

  // Track text changes for progress monitoring AND coach feedback
  React.useEffect(() => {
    const interval = setInterval(() => {
      const text = editorRef.current?.getText() || "";
      if (text !== currentText) {
        setCurrentText(text);
        
        // Update word count
        const words = text.trim().split(/\s+/).filter(word => word.length > 0);
        setWordCount(words.length);

        // Trigger coach feedback for new paragraphs
        const events = detectNewParagraphs(prevTextRef.current, text);
        if (events.length) {
          console.log("Emitting paragraph.ready event:", events[events.length - 1]);
          eventBus.emit("paragraph.ready", events[events.length - 1]);
        }
        prevTextRef.current = text;
      }
    }, 500); // Update every 500ms for responsive progress tracking

    return () => clearInterval(interval);
  }, [currentText]);

  async function onSubmit() {
    setStatus("loading");
    setErr(undefined);
    try {
      const text = editorRef.current?.getText() || "";
      const res = await evaluateEssay({ essayText: text, textType });
      if (!validateDetailedFeedback(res)) {
        throw new Error("Invalid feedback payload");
      }
      setAnalysis(res);
      setStatus("success");
    } catch (e: any) {
      setStatus("error");
      setErr(e?.message || "Failed to analyze essay");
    }
  }

  async function onApplyFix(fix: LintFix) {
    editorRef.current?.applyFix(fix.start, fix.end, fix.replacement);
  }

  function onProgressUpdate(metrics: any) {
    // Optional: Handle progress updates for additional features
    console.log('Progress updated:', metrics);
  }

  // Simple autosave: localStorage + server PUT (stub function)
  React.useEffect(() => {
    const int = setInterval(async () => {
      const text = editorRef.current?.getText() || "";
      localStorage.setItem(draftId.current, JSON.stringify({ text, version }));
      try {
        await saveDraft(draftId.current, text, version);
        setVersion(v => v + 1);
      } catch {
        // swallow for now
      }
    }, 1500);
    return () => clearInterval(int);
  }, [version]);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header with controls */}
      <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <h1 className="text-2xl font-bold text-gray-800">NSW Writing Buddy</h1>
          
          {/* Text Type Selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Text Type:</label>
            <select 
              value={textType}
              onChange={(e) => setTextType(e.target.value as 'narrative' | 'persuasive' | 'informative')}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="narrative">Narrative</option>
              <option value="persuasive">Persuasive</option>
              <option value="informative">Informative</option>
            </select>
          </div>

          {/* Target Word Count */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Target Words:</label>
            <input 
              type="number" 
              value={targetWordCount}
              onChange={(e) => setTargetWordCount(Number(e.target.value))}
              className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              min="50"
              max="1000"
            />
          </div>
        </div>

        {/* Status Messages */}
        <div className="flex gap-2">
          {status === "error" && <div className="text-red-600 flex items-center">{err}</div>}
          {status === "success" && <div className="text-green-600 flex items-center">Analysis complete!</div>}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Writing Area */}
        <div className="col-span-12 lg:col-span-6">
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Your Writing</h2>
            </div>
            
            {/* Text Editor */}
            <div className="p-4">
              <InteractiveTextEditor 
                ref={editorRef} 
                placeholder="Start writing your story here... Your Writing Buddy will automatically provide tips as you write! ✨"
                className="w-full h-96 p-4 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            
            {/* Bottom Status Bar with Words, WPM */}
            <WritingStatusBar
              wordCount={wordCount}
              content={currentText}
              textType={textType}
              targetWordCountMin={Math.floor(targetWordCount * 0.8)}
              targetWordCountMax={Math.ceil(targetWordCount * 1.2)}
            />
            
            {/* Main Submit Button for Evaluation Report */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={onSubmit}
                disabled={status === "loading" || wordCount < 10}
                className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
                  status === "loading" 
                    ? "bg-gray-400 text-white cursor-not-allowed" 
                    : wordCount < 10
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg"
                }`}
              >
                {status === "loading" ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Analyzing...
                  </div>
                ) : (
                  `Submit for Evaluation Report (${wordCount} words)`
                )}
              </button>
              {wordCount < 10 && (
                <p className="text-sm text-gray-500 text-center mt-2">
                  Write at least 10 words to submit for evaluation
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Progress Coach */}
        <div className="col-span-12 lg:col-span-3">
          <div className="sticky top-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Progress Coach</h2>
            <ProgressCoach 
              text={currentText}
              textType={textType}
              targetWordCount={targetWordCount}
              onProgressUpdate={onProgressUpdate}
            />
          </div>
        </div>

        {/* Analysis and Coach Panel */}
        <div className="col-span-12 lg:col-span-3">
          <div className="space-y-6">
            {/* Writing Coach - Make it more prominent */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-purple-800 flex items-center">
                  <span className="mr-2">🤖</span>
                  Writing Buddy
                </h2>
                <div className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                  Auto-feedback ON
                </div>
              </div>
              <div className="bg-white rounded-lg p-2 border border-purple-100">
                // FIXED: Pass content prop to CoachProvider for automatic feedback
               <CoachProvider content={currentText} />

              </div>
              <div className="mt-3 text-xs text-purple-600 text-center">
                💡 I'll automatically give you tips as you write!
              </div>
            </div>
            
            {/* Analysis Results */}
                          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Analysis Results</h2>
                <RubricPanel data={analysis} onApplyFix={onApplyFix} />
              </div>
          </div>
        </div>
      </div>

      {/* Mobile-friendly stacked layout for smaller screens */}
      <style jsx>{`
        @media (max-width: 1024px) {
          .grid-cols-12 {
            display: block;
          }
          .col-span-12,
          .col-span-6,
          .col-span-3 {
            width: 100%;
            margin-bottom: 1.5rem;
          }
          .sticky {
            position: static;
          }
        }
      `}</style>
    </div>
  );
}