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
  onPopupCompleted?: () => void;
  onPromptGenerated?: (prompt: string) => void;
  prompt?: string;
  onSubmitForEvaluation?: () => void;
}

function WritingAreaImpl(props: Props) {
  // --- editor state - USE PROPS DIRECTLY ---
  const [textType, setTextType] = useState<TextType>((props.textType as TextType) || "narrative");
  
  // CRITICAL FIX: Use props.content directly, don't maintain separate state
  const content = props.content || "";
  const prevTextRef = useRef<string>(props.content || "");

  // Sync textType with props
  useEffect(() => { 
    if (typeof props.textType === "string") {
      setTextType(props.textType as TextType);
    }
  }, [props.textType]);

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
    console.log("📝 WritingArea: Content changed to:", next);
    const events = detectNewParagraphs(prevTextRef.current, next);
    if (events.length) eventBus.emit("paragraph.ready", events[events.length - 1]);
    prevTextRef.current = next;
    
    // CRITICAL FIX: Always call onChange to sync with parent
    if (props.onChange) {
      props.onChange(next);
    }
  };

  // Submit → strict JSON rubric (server)
  const onSubmitForEvaluation = async () => {
    console.log("🚀 WritingArea: onSubmitForEvaluation called");
    console.log("📝 Content being submitted:", content);
    console.log("📋 Text Type:", textType);
    console.log("📊 Content Length:", content.length);
    
    // CRITICAL FIX: Validate content before submission
    if (!content || content.trim().length === 0) {
      console.error("❌ No content to submit");
      setStatus("error");
      setErr("Please write some content before submitting for evaluation");
      return;
    }
    
    try {
      setStatus("loading"); 
      setErr(undefined);
      
      console.log("🔄 Making API call to evaluateEssay...");
      
      const res = await evaluateEssay({
        essayText: content.trim(), // Use the actual content from props
        textType,
        examMode: false,
      });
      
      console.log("✅ API Response received:", res);
      
      if (!validateDetailedFeedback(res)) {
        console.error("❌ Invalid feedback payload");
        throw new Error("Invalid feedback payload");
      }
      
      setAnalysis(res);
      setStatus("success");
      console.log("🎉 Analysis completed successfully");
      
    } catch (e: any) {
      console.error("💥 Error in onSubmitForEvaluation:", e);
      setStatus("error");
      setErr(e?.message || "Failed to analyze");
    }
  };

  // Apply a server-proposed fix
  const onApplyFix = (fix: LintFix) => {
    const next = content.slice(0, fix.start) + fix.replacement + content.slice(fix.end);
    if (props.onChange) {
      props.onChange(next);
    }
  };

  // Light autosave (localStorage + drafts function)
  useEffect(() => {
    const t = setInterval(async () => {
      try {
        if (content && content.trim().length > 0) {
          localStorage.setItem(draftId.current, JSON.stringify({ text: content, version }));
          await saveDraft(draftId.current, content, version);
          setVersion(v => v + 1);
        }
      } catch {/* no-op */}
    }, 1500);
    return () => clearInterval(t);
  }, [content, version]);

  // Handle button click with proper event handling
  const handleSubmitClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log("🖱️ Submit button clicked");
    console.log("📝 Current content:", content);
    
    // CRITICAL FIX: Always use internal function, ignore props
    onSubmitForEvaluation();
  };

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
            type="button"
            className="px-4 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSubmitClick}
            disabled={status === "loading" || content.trim().length === 0}
            aria-label="Submit for Evaluation Report"
          >
            {status === "loading" ? "Analyzing…" : "Submit for Evaluation Report"}
          </button>
          {status === "error" && <span className="text-red-600 text-sm">{err}</span>}
        </div>

        {/* Show analysis results */}
        {analysis && status === "success" && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Analysis Complete!</h3>
            <p className="text-blue-800">Your essay has been analyzed. Check the Coach panel on the right for detailed feedback.</p>
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

// Export both names so existing imports keep working
export default WritingAreaImpl;
export const WritingArea = WritingAreaImpl;