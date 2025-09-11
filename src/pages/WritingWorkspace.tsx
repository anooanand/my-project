/**
 * Example composition of Editor + RubricPanel + CoachProvider + Autosave hooks.
 * Copy to: src/pages/WritingWorkspace.tsx
 */
import React from "react";
import { InteractiveTextEditor, EditorHandle } from "../components/InteractiveTextEditor";
import { RubricPanel } from "../components/RubricPanel";
import { CoachProvider } from "../components/CoachProvider";
import type { DetailedFeedback, LintFix } from "../types/feedback";
import { evaluateEssay, saveDraft } from "../lib/api";
import { validateDetailedFeedback } from "../types/feedback.validate";

export default function WritingWorkspace() {
  const editorRef = React.useRef<EditorHandle>(null);
  const [analysis, setAnalysis] = React.useState<DetailedFeedback | null>(null);
  const [status, setStatus] = React.useState<"idle"|"loading"|"success"|"error">("idle");
  const [err, setErr] = React.useState<string|undefined>(undefined);
  const draftId = React.useRef<string>(() => `draft-${crypto.randomUUID()}` as any);
  const [version, setVersion] = React.useState(0);

  async function onSubmit() {
    setStatus("loading");
    setErr(undefined);
    try {
      const text = editorRef.current?.getText() || "";
      const res = await evaluateEssay({ essayText: text, textType: "narrative" });
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
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-7">
        <InteractiveTextEditor ref={editorRef} />
        <div className="mt-3 flex gap-2">
          <button
            className="px-4 py-2 rounded-xl bg-blue-600 text-white"
            onClick={onSubmit}
            disabled={status === "loading"}
          >
            {status === "loading" ? "Analyzing…" : "Submit for Evaluation"}
          </button>
          {status === "error" && <div className="text-red-600">{err}</div>}
        </div>
      </div>
      <div className="col-span-3">
        {analysis && <RubricPanel data={analysis} onApplyFix={onApplyFix} />}
      </div>
      <div className="col-span-2">
        <CoachProvider />
      </div>
    </div>
  );
}
