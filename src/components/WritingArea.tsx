import React, { useState, useRef, useEffect, useCallback } from "react";
import { evaluateEssay, saveDraft } from "../lib/api";
import { eventBus } from "../lib/eventBus";
import { detectNewParagraphs } from "../lib/paragraphDetection";
import type { DetailedFeedback, LintFix } from "../types/feedback";
import { TabbedCoachPanel } from "./TabbedCoachPanel";
import { WritingStatusBar } from "./WritingStatusBar";
import { InteractiveTextEditor, EditorHandle } from "./InteractiveTextEditor";
import {
  PenTool,
  Play,
  BookOpen,
  Lightbulb,
  Target,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Settings
} from 'lucide-react';

type TextType = "narrative" | "persuasive" | "informative";

interface Props {
  content?: string;
  onChange?: (content: string) => void;
  textType?: string;
  onTextTypeChange?: (textType: string) => void;
  onPopupCompleted?: () => void;
  onPromptGenerated?: (prompt: string) => void;
  prompt?: string;
  onPlanningPhase?: () => void;
  onStartExamMode?: () => void;
  onStructureGuide?: () => void;
  onTips?: () => void;
  onFocus?: () => void;
}

function fallbackPrompt(textType?: string) {
  const defaultPrompt =
    "Write an engaging story about a character who discovers something unexpected that changes their life forever. Include vivid descriptions, realistic dialogue, and show the character's emotional journey.";
  try {
    const stored = localStorage.getItem("generatedPrompt");
    if (stored) return stored;
    const type = (textType || localStorage.getItem("selectedWritingType") || "narrative").toLowerCase();
    if (type === "narrative") {
      const byType = localStorage.getItem(`${type}_prompt`);
      if (byType) return byType;
    }
  } catch { /* ignore */ }
  return defaultPrompt;
}

function WritingAreaImpl(props: Props) {
  const editorRef = useRef<EditorHandle>(null);
  const [displayPrompt, setDisplayPrompt] = useState<string>("");
  const [content, setContent] = useState<string>(props.content ?? "");
  const [textType, setTextType] = useState<TextType>((props.textType as TextType) || "narrative");
  const prevTextRef = useRef<string>(content);

  const [examMode, setExamMode] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [showHighlights, setShowHighlights] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [analysis, setAnalysis] = useState<DetailedFeedback | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [err, setErr] = useState<string>();

  const draftId = useRef(
    `draft-${(
      globalThis.crypto?.randomUUID?.() ??
      Date.now().toString(36) + Math.random().toString(36).slice(2))
    }`
  );
  const [version, setVersion] = useState(0);

  // New state for sidebar control
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);

  // Sync with parent if controlled
  useEffect(() => { if (typeof props.content === "string") setContent(props.content); }, [props.content]);
  useEffect(() => { if (typeof props.textType === "string") setTextType(props.textType as TextType); }, [props.textType]);
  useEffect(() => { prevTextRef.current = content; }, [content]);

  useEffect(() => {
    const next =
      (typeof props.prompt === "string" && props.prompt.trim()) ||
      fallbackPrompt(props.textType);
    setDisplayPrompt(next);
  }, [props.prompt, props.textType]);

  useEffect(() => {
    const onStorage = () => setDisplayPrompt(fallbackPrompt(props.textType));
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [props.textType]);

  // Handle sidebar resizing
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    const containerWidth = window.innerWidth;
    const newWidth = containerWidth - e.clientX;
    
    // Constrain sidebar width between 250px and 500px
    const constrainedWidth = Math.max(250, Math.min(500, newWidth));
    setSidebarWidth(constrainedWidth);
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const onEditorChange = useCallback((newText: string) => {
    setContent(newText);
    props.onChange?.(newText);

    const newParagraphs = detectNewParagraphs(prevTextRef.current, newText);
    if (newParagraphs.length > 0) {
      eventBus.emit("newParagraph", { paragraphs: newParagraphs });
    }
  }, [setContent, props.onChange]);

  const onSubmitForEvaluation = useCallback(async () => {
    if (!content.trim()) {
      setErr("Please write some text before submitting for evaluation");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setErr(undefined);
    
    try {
      console.log("Starting evaluation...");
      const res = await evaluateEssay({ essayText: content, textType });
      console.log("Evaluation response:", res);
      
      if (res && typeof res === 'object' && res.overallScore !== undefined) {
        setAnalysis(res);
        setStatus("success");
        console.log("Analysis successful!");
      } else {
        throw new Error("Invalid response format");
      }
    } catch (e: any) {
      console.error("Evaluation failed:", e);
      setStatus("error");
      setErr(e?.message || "Failed to analyze essay. Please try again.");
    }
  }, [content, textType]);

  const onApplyFix = useCallback((fix: LintFix) => {
    editorRef.current?.applyFix(fix.start, fix.end, fix.replacement);
  }, []);

  const handlePlanningPhase = () => {
    console.log("Planning Phase clicked");
    props.onPlanningPhase?.();
  };

  const handleStartExamMode = () => {
    console.log("Start Exam Mode clicked");
    setExamMode(!examMode);
    props.onStartExamMode?.();
  };

  const handleStructureGuide = () => {
    console.log("Structure Guide clicked");
    props.onStructureGuide?.();
  };

  const handleTips = () => {
    console.log("Tips clicked");
    props.onTips?.();
  };

  const handleFocus = () => {
    console.log("Focus clicked");
    setFocusMode(!focusMode);
    props.onFocus?.();
  };

  const handleToggleHighlights = () => {
    setShowHighlights(!showHighlights);
  };

  const handleEvaluate = () => {
    onSubmitForEvaluation();
  };

  const handleShowPlanning = () => {
    handlePlanningPhase();
  };

  const handleRestore = () => {
    console.log("Restore clicked");
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  useEffect(() => {
    const t = setInterval(async () => {
      if (!content.trim()) return;
      try {
        setIsSaving(true);
        localStorage.setItem(draftId.current, JSON.stringify({ text: content, version }));
        try {
          await saveDraft(draftId.current, content, version);
          setVersion(v => v + 1);
          setLastSaved(new Date());
        } catch {
        } finally {
          setIsSaving(false);
        }
      } catch {
        setIsSaving(false);
      }
    }, 1500);
    return () => clearInterval(t);
  }, [content, version]);

  // Calculate writing area width based on sidebar state
  const writingAreaStyle = {
    width: focusMode ? '100%' : sidebarCollapsed ? 'calc(100% - 60px)' : `calc(100% - ${sidebarWidth}px)`,
    transition: 'width 0.3s ease-in-out'
  };

  const sidebarStyle = {
    width: focusMode ? '0px' : sidebarCollapsed ? '60px' : `${sidebarWidth}px`,
    transition: 'width 0.3s ease-in-out'
  };

  return (
    <div className="flex h-full writing-area-optimized">
      {/* LEFT: header + editor */}
      <div className="flex flex-col" style={writingAreaStyle}>
        {/* --- YOUR WRITING PROMPT (visible, matches generated) --- */}
        <div className="mb-3 writing-prompt-container">
          <div className="rounded-xl border bg-white">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <div className="font-semibold">Your Writing Prompt</div>
              <div className="text-xs opacity-70">
                Text Type:&nbsp;
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

        {/* Writing Mode Buttons - MOVED HERE between prompt and editor */}
        <div className="flex flex-wrap gap-3 p-4 bg-white border border-gray-200 rounded-lg mb-3 toolbar-container">
          {/* Planning Phase Button */}
          <button
            onClick={handlePlanningPhase}
            disabled={status === "loading"}
            className="toolbar-button bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Planning Phase - Organize your ideas before writing"
          >
            <PenTool className="h-4 w-4" />
            Planning Phase
          </button>

          {/* Start Exam Mode Button */}
          <button
            onClick={handleStartExamMode}
            disabled={status === "loading"}
            className="toolbar-button bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Start Exam Mode - Practice under timed conditions"
          >
            <Play className="h-4 w-4" />
            Start Exam Mode
          </button>

          {/* Structure Guide Button */}
          <button
            onClick={handleStructureGuide}
            disabled={status === "loading"}
            className="toolbar-button bg-purple-500 text-white hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Structure Guide - Learn how to organize your writing"
          >
            <BookOpen className="h-4 w-4" />
            Structure Guide
          </button>

          {/* Tips Button */}
          <button
            onClick={handleTips}
            disabled={status === "loading"}
            className="toolbar-button bg-yellow-500 text-white hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Tips - Get helpful writing advice"
          >
            <Lightbulb className="h-4 w-4" />
            Tips
          </button>

          {/* Focus Button */}
          <button
            onClick={handleFocus}
            disabled={status === "loading"}
            className="toolbar-button bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Focus Mode - Minimize distractions while writing"
          >
            {focusMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            Focus
          </button>
        </div>

        {/* --- Editor --- */}
        <div className={`flex-1 rounded-xl border bg-white writing-container ${focusMode ? 'focus-mode' : ''}`}>
          <div className="p-3 h-full writing-input-container">
            <InteractiveTextEditor
              ref={editorRef}
              content={content}
              onChange={onEditorChange}
              placeholder="Start writing your amazing story here! Let your creativity flow and bring your ideas to life…"
              className="writing-textarea"
            />
          </div>
        </div>

        {/* SIMPLIFIED: Submit for Evaluation Button */}
        <div className="mt-3 flex items-center gap-2 writing-actions">
          <button
            type="button"
            className="submit-button bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onSubmitForEvaluation}
            disabled={status === "loading"}
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

      {/* Resizable Feedback Chat Sidebar */}
      {!focusMode && (
        <>
          {/* Resize Handle */}
          {!sidebarCollapsed && (
            <div
              ref={resizeRef}
              className="resize-handle w-1 bg-gray-200 hover:bg-blue-400 cursor-col-resize transition-colors relative group"
              onMouseDown={handleMouseDown}
            >
              <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-blue-400 group-hover:opacity-20"></div>
            </div>
          )}

          {/* Sidebar */}
          <div 
            ref={sidebarRef}
            className="sidebar-resizable border-l border-gray-200 bg-white flex flex-col overflow-hidden"
            style={sidebarStyle}
          >
            {/* Sidebar Header with Collapse Button */}
            <div className="sidebar-header flex items-center justify-between p-3 bg-purple-50 border-b border-gray-200">
              {!sidebarCollapsed && (
                <h3 className="text-sm font-medium text-purple-700">Writing Buddy</h3>
              )}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="collapse-button p-1 text-purple-400 hover:text-purple-600 transition-colors rounded"
                title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                {sidebarCollapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            </div>

            {/* Feedback Chat Content */}
            {!sidebarCollapsed && (
              <div className="flex-1 overflow-hidden feedback-content">
                <TabbedCoachPanel analysis={analysis} onApplyFix={onApplyFix} />
              </div>
            )}

            {/* Collapsed State Indicator */}
            {sidebarCollapsed && (
              <div className="collapsed-indicator flex-1 flex flex-col items-center justify-center p-2 space-y-2">
                <div className="feedback-count-badge w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="feedback-count-text text-purple-600 text-xs font-bold">{analysis ? analysis.overallScore : 0}</span>
                </div>
                <div className="collapsed-label text-xs text-purple-600 text-center leading-tight">
                  Feedback
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Writing StatusBar - Always visible at the bottom */}
      <WritingStatusBar
        wordCount={wordCount}
        isSaving={isSaving}
        lastSaved={lastSaved}
        onToggleHighlights={handleToggleHighlights}
        showHighlights={showHighlights}
        onEvaluate={handleEvaluate}
        onShowPlanning={handleShowPlanning}
        onRestore={handleRestore}
      />
    </div>
  );
}

export const WritingArea = React.memo(WritingAreaImpl);

