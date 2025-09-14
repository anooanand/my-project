/**
 * Updated WritingWorkspace with integrated ProgressCoach component
 * Copy to: src/pages/WritingWorkspace.tsx
 */
import React from "react";
import { InteractiveTextEditor, EditorHandle } from "../components/InteractiveTextEditor";
import { RubricPanel } from "../components/RubricPanel";
import { CoachProvider } from "../components/CoachProvider";
import ProgressCoach from "../components/ProgressCoach";
import type { DetailedFeedback, LintFix } from "../types/feedback";
import { evaluateEssay, saveDraft } from "../lib/api";
import { validateDetailedFeedback } from "../types/feedback.validate";

export default function WritingWorkspace() {
  const editorRef = React.useRef<EditorHandle>(null);
  const [analysis, setAnalysis] = React.useState<DetailedFeedback | null>(null);
  const [status, setStatus] = React.useState<"idle"|"loading"|"success"|"error">("idle");
  const [err, setErr] = React.useState<string|undefined>(undefined);
  const [currentText, setCurrentText] = React.useState<string>("");
  const [textType, setTextType] = React.useState<'narrative' | 'persuasive' | 'informative'>('narrative');
  const [targetWordCount, setTargetWordCount] = React.useState<number>(300);

  // Replace your draftId line with this:
  const draftId = React.useRef<string>(
    `draft-${
      (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function")
        ? globalThis.crypto.randomUUID()
        : (Date.now().toString(36) + Math.random().toString(36).slice(2))
    }`
  );
  const [version, setVersion] = React.useState(0);

  // Track text changes for progress monitoring
  React.useEffect(() => {
    const interval = setInterval(() => {
      const text = editorRef.current?.getText() || "";
      if (text !== currentText) {
        setCurrentText(text);
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
              onChange={(e) => setTextType(e.target.value as any)}
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

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
            onClick={onSubmit}
            disabled={status === "loading"}
          >
            {status === "loading" ? "Analyzing…" : "Submit for Evaluation"}
          </button>
          {status === "error" && <div className="text-red-600 flex items-center">{err}</div>}
          {status === "success" && <div className="text-green-600 flex items-center">Analysis complete!</div>}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Writing Area */}
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Your Writing</h2>
            <InteractiveTextEditor ref={editorRef} />
          </div>
        </div>

        {/* Right Side Panel - Writing Buddy and Other Tools */}
        <div className="col-span-12 lg:col-span-4">
          <div className="sticky top-4 space-y-6">
            {/* Writing Buddy Chat */}
            <div className="bg-white rounded-lg shadow-sm">
              <CoachProvider />
            </div>
            
            {/* Progress Coach */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Progress Coach</h2>
              <ProgressCoach 
                text={currentText}
                textType={textType}
                targetWordCount={targetWordCount}
                onProgressUpdate={onProgressUpdate}
              />
            </div>

            {/* Analysis Results */}
            {analysis && (
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Analysis Results</h2>
                <RubricPanel data={analysis} onApplyFix={onApplyFix} />
              </div>
            )}
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
          .col-span-8,
          .col-span-4 {
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