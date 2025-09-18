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

// Import icons for buttons
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

  // -------- Button states --------
  const [examMode, setExamMode] = useState(false);
  const [focusMode, setFocusMode] = useState(false);

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

  // -------- Button handlers --------
  const handlePlanningPhase = () => {
    console.log("Planning Phase clicked");
  };

  const handleStartExamMode = () => {
    setExamMode(!examMode);
    console.log("Exam Mode toggled:", !examMode);
  };

  const handleStructureGuide = () => {
    console.log("Structure Guide clicked");
  };

  const handleTips = () => {
    console.log("Tips clicked");
  };

  const handleFocus = () => {
    setFocusMode(!focusMode);
    console.log("Focus Mode toggled:", !focusMode);
  };

  // Calculate word count
  const wordCount = content.trim() ? content.trim().split(/\s+/).filter(Boolean).length : 0;

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
    <div className="h-full flex flex-col">
      {/* Main Content Grid */}
      <div className="flex-1 grid grid-cols-12 gap-4 p-4">
        {/* LEFT: Writing Area (8 columns) */}
        <div className="col-span-8 flex flex-col">
          {/* --- YOUR WRITING PROMPT --- */}
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

          {/* --- WRITING MODE BUTTONS (Between prompt and writing area) --- */}
          <div className="mb-4">
            <div className="flex justify-center">
              <div className="flex gap-3">
                <button
                  onClick={handlePlanningPhase}
                  disabled={status === "loading"}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 shadow-sm"
                  title="Planning Phase"
                >
                  <PenTool className="h-4 w-4 mr-2" />
                  Planning Phase
                </button>

                <button
                  onClick={handleStartExamMode}
                  disabled={status === "loading"}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 shadow-sm"
                  title="Start Exam Mode"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Exam Mode
                </button>

                <button
                  onClick={handleStructureGuide}
                  disabled={status === "loading"}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-purple-500 text-white hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 shadow-sm"
                  title="Structure Guide"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Structure Guide
                </button>

                <button
                  onClick={handleTips}
                  disabled={status === "loading"}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-yellow-500 text-white hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 shadow-sm"
                  title="Tips"
                >
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Tips
                </button>

                <button
                  onClick={handleFocus}
                  disabled={status === "loading"}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 shadow-sm"
                  title="Focus"
                >
                  <Target className="h-4 w-4 mr-2" />
                  Focus
                </button>
              </div>
            </div>
          </div>

          {/* --- YOUR WRITING SECTION --- */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Your Writing</h3>
          </div>

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

          {/* --- SUBMIT BUTTON --- */}
          <div className="mt-4">
            <button
              type="button"
              className="w-full px-4 py-3 rounded-xl bg-gray-400 text-white hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
              onClick={onSubmitForEvaluation}
              disabled={status === "loading" || !content?.trim()}
              aria-label="Submit for Evaluation"
            >
              <span className="mr-2">⚪</span>
              {status === "loading" ? "Analyzing…" : "Submit for Evaluation"}
            </button>
            {status === "error" && <div className="mt-2 text-red-600 text-sm text-center">{err}</div>}
            {status === "success" && <div className="mt-2 text-green-600 text-sm text-center">Analysis complete!</div>}
          </div>
        </div>

        {/* RIGHT: Coach Panel (4 columns) */}
        <div className="col-span-4">
          <TabbedCoachPanel analysis={analysis} onApplyFix={onApplyFix} />
        </div>
      </div>

      {/* --- STATUS BAR AT BOTTOM --- */}
      <div className="flex-shrink-0 px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center space-x-6">
          <div className="flex items-center">
            <span className="font-medium">{wordCount} words</span>
            {wordCount < 100 && (
              <span className="ml-2 text-orange-600 font-medium">Write more!</span>
            )}
          </div>
          <div className="flex items-center">
            <span className="font-medium">0 WPM</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WritingAreaImpl;
export const WritingArea = WritingAreaImpl;
