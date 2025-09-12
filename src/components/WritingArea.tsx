import React, { useEffect, useRef, useState } from "react";

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

  // Sync with parent if controlled
  useEffect(() => { if (typeof props.content === "string") setContent(props.content); }, [props.content]);
  useEffect(() => { if (typeof props.textType === "string") setTextType(props.textType as TextType); }, [props.textType]);
  useEffect(() => { prevTextRef.current = content; }, [content]);

  // If editor is empty and we have a prompt, show it in the prompt card (not in the text area),
  // but also allow a one-click insert if you want later. If you DO want it inserted automatically,
  // uncomment the next block.
  useEffect(() => {
    // If you prefer the prompt to be inserted into the editor when empty, uncomment:
    // if (!content?.trim() && displayPrompt?.trim() && props.onChange) {
    //   props.onChange(displayPrompt);
    // }
  }, [displayPrompt]); // eslint-disable-line

  // -------- Analysis state --------
  const [analysis, setAnalysis] = useState<DetailedFeedback | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [err, setErr] = useState<string>();

  // -------- Autosave --------
  const [version, setVersion] = useState(0);
  const draftId = useRef(
    `draft-${
      (globalThis.crypto?.randomUUID?.() ??
        Date.now().toString(36) + Math.random().toString(36).slice(2))
    }`
  );

  // Typing + paragraph detection
  const onEditorChange = (next: string) => {
    const events = detectNewParagraphs(prevTextRef.current, next);
    if (events.length) eventBus.emit("paragraph.ready", events[events.length - 1]);
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

  // Autosave
  useEffect(() => {
    const t = setInterval(async () => {
      try {
        if (content?.trim()) {
          localStorage.setItem(draftId.current, JSON.stringify({ text: content, version }));
          await saveDraft(draftId.current, content, version);
          setVersion(v => v + 1);
        }
      } catch {}
    }, 1500);
    return () => clearInterval(t);
  }, [content, version]);

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* LEFT: header + editor */}
      <div className="col-span-8">
        {/* --- YOUR WRITING PROMPT (visible, matches generated) --- */}
        <div className="mb-3">
          <div className="rounded-xl border bg-white">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <div className="font-semibold">Your Writing Prompt</div>
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
            <div className="p-4 text-sm leading-relaxed whitespace-pre-wrap">
              {displayPrompt || "Loading prompt…"}
            </div>
          </div>
        </div>

        {/* --- Editor --- */}
        <div className="rounded-xl border bg-white">
          <div className="p-3">
            <textarea
              className="w-full h-[28rem] p-3 rounded-lg border"
              placeholder="Start writing your amazing story here! Let your creativity flow and bring your ideas to life…"
              value={content}
              onChange={(e) => onEditorChange(e.target.value)}
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
        <TabbedCoachPanel analysis={analysis} onApplyFix={onApplyFix} />
      </div>
    </div>
  );
}

export default WritingAreaImpl;
export const WritingArea = WritingAreaImpl;
