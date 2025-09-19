import React, { useState, useEffect, useRef } from "react";

// Server-backed API (Netlify functions only)
import { evaluateEssay, saveDraft } from "../lib/api";

// Real-time coach triggers
import { eventBus } from "../lib/eventBus";
import { detectNewParagraphs } from "../lib/paragraphDetection";

// NSW rubric UI + types + guards
import type { DetailedFeedback, LintFix } from "../types/feedback";
import { validateDetailedFeedback } from "../types/feedback.validate";

type TextType = "narrative" | "persuasive" | "informative";

interface Props {
  content?: string;
  onChange?: (content: string) => void;
  textType?: string;
  onTextTypeChange?: (textType: string) => void;
  onPopupCompleted?: () => void;
  onPromptGenerated?: (prompt: string) => void;
  onSubmit?: () => void;
  assistanceLevel?: string;
  selectedText?: string;
  onTimerStart?: (started: boolean) => void;
  onNavigate?: (page: string) => void;
  evaluationStatus?: "idle" | "loading" | "success" | "error";
  examMode?: boolean;
  /** Prompt passed by EnhancedWritingLayout */
  prompt?: string;
  /** Hide prompt and submit button when used within EnhancedWritingLayout */
  hidePromptAndSubmit?: boolean;
}

function fallbackPrompt(textType?: string) {
  const defaultPrompt =
    "Write an engaging story about a character who discovers something unexpected that changes their life forever. Include vivid descriptions, realistic dialogue, and show the character's emotional journey.";
  try {
    const stored = localStorage.getItem("generatedPrompt");
    if (stored) {
      console.log("📝 fallbackPrompt: Using stored 'generatedPrompt':", stored.substring(0, 50) + "...");
      return stored;
    }
    const type = (textType || localStorage.getItem("selectedWritingType") || "narrative").toLowerCase();
    const byType = localStorage.getItem(`${type}_prompt`);
    if (byType) {
      console.log("📝 fallbackPrompt: Using text-type specific prompt:", byType.substring(0, 50) + "...");
      return byType;
    }
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
    console.log('📝 WritingArea: Prompt updated:', { 
      hasPromptProp: !!(props.prompt && props.prompt.trim()),
      promptPreview: next.substring(0, 50) + '...', 
      source: props.prompt && props.prompt.trim() ? 'prop' : 'fallback'
    });
  }, [props.prompt, props.textType]);

  // Allow other tabs to update localStorage → refresh card
  useEffect(() => {
    const onStorage = () => {
      // Only update from localStorage if no prompt prop is provided
      if (!props.prompt || !props.prompt.trim()) {
        const newPrompt = fallbackPrompt(props.textType);
        setDisplayPrompt(newPrompt);
        console.log('📡 WritingArea: Storage change detected, updated prompt from localStorage');
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.prompt, props.textType]);
  

  // -------- Editor state --------
  const [content, setContent] = useState<string>(props.content ?? "");
  const [textType, setTextType] = useState<TextType>((props.textType as TextType) || "narrative");
  const prevTextRef = useRef<string>(content);

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
    `draft-${(
        globalThis.crypto?.randomUUID?.() ??
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
    if (props.onSubmit) {
      props.onSubmit();
      return;
    }

       if (!content || content.trim().length === 0) {
      setErr("Please write some content before submitting.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setErr(undefined);
    setAnalysis(null);

    try {
      const data = await evaluateEssay(content, textType);
      if (!validateDetailedFeedback(data)) {
        throw new Error("Server returned invalid feedback format");
      }
      setAnalysis(data);
      setStatus("success");
    } catch (e: any) {
      console.error("Evaluation failed:", e);
      setErr(e.message || "Evaluation failed. Please try again.");
      setStatus("error");
    }
  };

  // Autosave every few seconds
  useEffect(() => {
    if (!content?.trim()) return;
    const timer = setTimeout(async () => {
      try {
        await saveDraft(draftId.current, { content, textType, version });
        setVersion((v) => v + 1);
      } catch (e) {
        console.warn("Draft save failed:", e);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [content, textType, version]);

  // Use evaluationStatus from props if available, otherwise use local status
  const currentStatus = props.evaluationStatus || status;

  return (
    <div className="flex flex-col h-full">
      {/* --- PROMPT SECTION (conditionally rendered) --- */}
      {!props.hidePromptAndSubmit && (
        <div className="mb-4">
          <div className="rounded-xl border bg-white shadow-sm">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <div className="font-semibold text-gray-800">Your Writing Prompt</div>
              <div className="text-xs text-gray-500">Text Type:&nbsp;
                <select
                  className="rounded-md border border-gray-300 px-2 py-1 text-sm"
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
            <div className="p-4 text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
              {displayPrompt || "Loading prompt…"}
            </div>
          </div>
        </div>
      )}

      {/* --- YOUR WRITING SECTION (conditionally rendered) --- */}
      {!props.hidePromptAndSubmit && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Your Writing</h3>
        </div>
      )}

      {/* --- WRITING EDITOR --- */}
      <div className="flex-1 rounded-xl border bg-white shadow-sm">
        <div className="p-4 h-full">
          <textarea
            className="w-full h-full p-3 rounded-lg border border-gray-200 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Start writing your amazing story here! Let your creativity flow and bring your ideas to life…"
            value={content}
            onChange={(e) => onEditorChange(e.target.value)}
          />
        </div>
      </div>

      {/* --- SUBMIT BUTTON (conditionally rendered) --- */}
      {!props.hidePromptAndSubmit && (
        <div className="mt-4">
          <button
            type="button"
            className="w-full px-4 py-3 rounded-xl bg-gray-400 text-white hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
            onClick={onSubmitForEvaluation}
            disabled={currentStatus === "loading" || !content?.trim()}
            aria-label="Submit for Evaluation"
          >
            <span className="mr-2">⚪</span>
            {currentStatus === "loading" ? "Analyzing…" : "Submit for Evaluation"}
          </button>
          {currentStatus === "error" && <div className="mt-2 text-red-600 text-sm text-center">{err}</div>}
          {currentStatus === "success" && <div className="mt-2 text-green-600 text-sm text-center">Analysis complete!</div>}
        </div>
      )}
    </div>
  );
}

export default WritingAreaImpl;
export const WritingArea = WritingAreaImpl;
