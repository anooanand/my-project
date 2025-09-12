import React, { useEffect, useRef, useState } from "react";

// Server-backed API (Netlify functions only)
import { evaluateEssay, saveDraft } from "../lib/api";

// Real-time coach triggers
import { eventBus } from "../lib/eventBus";
import { detectNewParagraphs } from "../lib/paragraphDetection";

// NSW rubric UI + types + guards
import { RubricPanel } from "./RubricPanel";
import type { DetailedFeedback, LintFix } from "../types/feedback";
import { validateDetailedFeedback } from "../types/feedback.validate";

// Tabs (Coach / Analysis / Vocab / Progress)
import { TabbedCoachPanel } from "./TabbedCoachPanel";

type TextType = "narrative" | "persuasive" | "informative";

interface Props {
  content?: string;
  onChange?: (content: string) => void;
  textType?: string;
  onTextTypeChange?: (textType: string) => void;
  // NOTE: we intentionally do NOT use props.onSubmit here anymore
  // to avoid the legacy client-OpenAI flow.
  onPopupCompleted?: () => void;
  onPromptGenerated?: (prompt: string) => void;
  prompt?: string;
}

function WritingAreaImpl(props: Props) {
  // --- editor state ---
  const [textType, setTextType] = useState<TextType>((props.textType as TextType) || "narrative");
  const [content, setContent] = useState<string>(props.content ?? "");
  const prevTextRef = useRef<string>(props.content ?? "");

  useEffect(() => { if (typeof props.content === "string") setContent(props.content); }, [props.content]);
  useEffect(() => { if (typeof props.textType === "string") setTextType(props.textType as TextType); }, [props.textType]);

  // --- analysis state ---
  const [analysis, setAnalysis] = useState<DetailedFeedback | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [err, setErr] = useState<string>();

  // --- autosave (simple versioning) ---
  const [version, setVersion] = useState(0);
  const draftId = useRef(
    `draft-${
      (globalThis.crypto?.randomUUID?.() ??
        Date.now().toString(36) + Math.random().toString(36).slice(2))
    }`
  );

  // Handle typing + paragraph detection (triggers coach tips)
  const onEditorChange = (next: string) => {
    const events = detectNewParagraphs(prevTextRef.current, next);
    if (events.length) eventBus.emit("paragraph.ready", events[events.length - 1]);
    prevTextRef.current = next;
    setContent(next);
    props.onChange?.(next);
  };

  // Submit → strict JSON rubric (server)
  const onSubmitForEvaluation = async () => {
    try {
      setStatus("loading"); setErr(undefined);
      const res = await evaluateEssay({
        essayText: content,
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

  // Light autosave (localStorage + drafts function)
  useEffect(() => {
    const t = setInterval(async () => {
      try {
        localStorage.setItem(draftId.current, JSON.stringify({ text: content, version }));
        await saveDraft(draftId.current, content, version);
        setVersion(v => v + 1);
      } catch {/* no-op */}
    }, 1500);
    return () => clearInterval(t);
  }, [content, version]);

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* LEFT: header-ish + editor */}
      <div className="col-span-8">
        <div className="mb-3 flex items-center gap-2">
          <label className="text-sm opacity-70">Text Type:</label>
          <select
            className="rounded-lg border px-2 py-1"
            value={textType}
            onChange={(e) => {
              const v = e.target.value as TextType;
              setTextType(v);
              props.onTextTypeChange?.(v);
            }}
          >
            <option value="narrative">Narrative</option>
            <option value="persuasive">Persuasive</option>
            <option value="informative">Informative</option>
          </select>
        </div>

        <div className="rounded-xl border bg-white">
          <div className="p-3">
            <textarea
              className="w-full h-[28rem] p-3 rounded-lg border"
              placeholder="Start your draft here…"
              value={content}
              onChange={(e) => onEditorChange(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button
            className="px-4 py-2 rounded-xl bg-green-600 text-white"
            onClick={onSubmitForEvaluation}
            disabled={status === "loading"}
            aria-label="Submit for Evaluation Report"
          >
            {status === "loading" ? "Analyzing…" : "Submit for Evaluation Report"}
          </button>
          {status === "error" && <span className="text-red-600 text-sm">{err}</span>}
        </div>
      </div>

      {/* RIGHT: Tabs (Coach / Analysis / Vocab / Progress) */}
      <div className="col-span-4">
        <TabbedCoachPanel analysis={analysis} onApplyFix={onApplyFix} />
      </div>
    </div>
  );
}

// Export both names so existing imports keep working
export default WritingAreaImpl;
export const WritingArea = WritingAreaImpl;
