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
  Settings,
  MessageSquare,
  BarChart3,
  BookMarked,
  TrendingUp
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

  // Enhanced sidebar state management
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(350); // Increased default width
  const [isResizing, setIsResizing] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);
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

  // Enhanced sidebar resizing with constraints
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    const containerWidth = window.innerWidth;
    const newWidth = containerWidth - e.clientX;
    
    // Constrain sidebar width between 250px and 500px as requested
    const constrainedWidth = Math.max(250, Math.min(500, newWidth));
    setSidebarWidth(constrainedWidth);
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
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
        
        // Auto-show sidebar when analysis is complete
        if (focusMode) {
          setFocusMode(false);
        }
        setSidebarVisible(true);
        setSidebarCollapsed(false);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (e: any) {
      console.error("Evaluation failed:", e);
      setStatus("error");
      setErr(e?.message || "Failed to analyze essay. Please try again.");
    }
  }, [content, textType, focusMode]);

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
    const newFocusMode = !focusMode;
    setFocusMode(newFocusMode);
    
    // In focus mode, hide sidebar completely
    if (newFocusMode) {
      setSidebarVisible(false);
    } else {
      setSidebarVisible(true);
    }
    
    props.onFocus?.();
  };

  const handleToggleSidebar = () => {
    if (focusMode) {
      // Exit focus mode and show sidebar
      setFocusMode(false);
      setSidebarVisible(true);
      setSidebarCollapsed(false);
    } else {
      // Toggle collapse state
      setSidebarCollapsed(!sidebarCollapsed);
    }
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

  // Calculate dynamic layout dimensions
  const getLayoutDimensions = () => {
    if (focusMode || !sidebarVisible) {
      return {
        writingAreaWidth: '100%',
        sidebarWidth: '0px',
        sidebarDisplay: 'none'
      };
    }
    
    if (sidebarCollapsed) {
      return {
        writingAreaWidth: 'calc(100% - 60px)',
        sidebarWidth: '60px',
        sidebarDisplay: 'flex'
      };
    }
    
    return {
      writingAreaWidth: `calc(100% - ${sidebarWidth}px)`,
      sidebarWidth: `${sidebarWidth}px`,
      sidebarDisplay: 'flex'
    };
  };

  const layoutDimensions = getLayoutDimensions();

  return (
    <div className={`writing-area-optimized ${focusMode ? 'focus-mode' : ''} bg-gray-50`} style={{ display: 'flex', flexDirection: 'row', height: '100vh', overflow: 'hidden' }}>
      {/* LEFT: Main Writing Area */}
      <div 
        className="writing-main-area"
        style={{ 
          flex: '1',
          display: 'flex',
          flexDirection: 'column',
          minWidth: '0',
          overflow: 'hidden',
          transition: 'all 0.3s ease-in-out'
        }}
      >
        {/* Writing Prompt Section */}
        <div className="mb-4 px-4 pt-4">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="font-semibold text-gray-800 text-lg">Your Writing Prompt</div>
              <div className="text-sm text-gray-600 flex items-center space-x-2">
                <span>Text Type:</span>
                <select
                  className="rounded-md border border-gray-300 px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            <div className="p-6 text-base leading-relaxed text-gray-700 whitespace-pre-wrap">
              {displayPrompt || "Loading prompt…"}
            </div>
          </div>
        </div>

        {/* Enhanced Writing Mode Buttons */}
        <div className="flex flex-wrap gap-3 px-4 mb-4">
          <div className="flex flex-wrap gap-3 p-4 bg-white border border-gray-200 rounded-xl shadow-sm w-full">
            {/* Planning Phase Button */}
            <button
              onClick={handlePlanningPhase}
              disabled={status === "loading"}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-sm font-medium"
              title="Planning Phase - Organize your ideas before writing"
            >
              <PenTool className="h-4 w-4" />
              <span>Planning Phase</span>
            </button>

            {/* Start Exam Mode Button */}
            <button
              onClick={handleStartExamMode}
              disabled={status === "loading"}
              className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-sm font-medium"
              title="Start Exam Mode - Practice under timed conditions"
            >
              <Play className="h-4 w-4" />
              <span>Start Exam Mode</span>
            </button>

            {/* Structure Guide Button */}
            <button
              onClick={handleStructureGuide}
              disabled={status === "loading"}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-sm font-medium"
              title="Structure Guide - Learn how to organize your writing"
            >
              <BookOpen className="h-4 w-4" />
              <span>Structure Guide</span>
            </button>

            {/* Tips Button */}
            <button
              onClick={handleTips}
              disabled={status === "loading"}
              className="flex items-center space-x-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-sm font-medium"
              title="Tips - Get helpful writing advice"
            >
              <Lightbulb className="h-4 w-4" />
              <span>Tips</span>
            </button>

            {/* Focus Mode Button */}
            <button
              onClick={handleFocus}
              disabled={status === "loading"}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-sm font-medium ${
                focusMode 
                  ? 'bg-orange-500 text-white hover:bg-orange-600' 
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
              title="Focus Mode - Hide sidebar for distraction-free writing"
            >
              {focusMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              <span>{focusMode ? 'Exit Focus' : 'Focus Mode'}</span>
            </button>

            {/* Sidebar Toggle Button (only show when not in focus mode) */}
            {!focusMode && (
              <button
                onClick={handleToggleSidebar}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors duration-200 text-sm font-medium"
                title={sidebarCollapsed ? "Expand Writing Buddy" : "Collapse Writing Buddy"}
              >
                <MessageSquare className="h-4 w-4" />
                <span>{sidebarCollapsed ? 'Show Buddy' : 'Hide Buddy'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Enhanced Editor Container */}
        <div className="flex-1 px-4 pb-4">
          <div className="h-full rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="p-6 h-full">
              <InteractiveTextEditor
                ref={editorRef}
                content={content}
                onChange={onEditorChange}
                placeholder="Start writing your amazing story here! Let your creativity flow and bring your ideas to life…"
                className="w-full h-full resize-none border-0 outline-none text-lg leading-relaxed text-gray-800 placeholder-gray-400"
                style={{
                  fontSize: '18px',
                  lineHeight: '1.7',
                  fontFamily: 'system-ui, -apple-system, sans-serif'
                }}
              />
            </div>
          </div>
        </div>

        {/* Enhanced Submit Button */}
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>{wordCount} words</span>
              {lastSaved && (
                <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
              )}
              {isSaving && (
                <span className="text-blue-600">Saving...</span>
              )}
            </div>
            <button
              onClick={onSubmitForEvaluation}
              disabled={status === "loading" || !content.trim()}
              className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 font-medium"
            >
              {status === "loading" ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Target className="h-4 w-4" />
                  <span>Submit for Evaluation</span>
                </>
              )}
            </button>
          </div>
          
          {/* Status Messages */}
          {err && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {err}
            </div>
          )}
          {status === "success" && analysis && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
              Analysis complete! Overall score: {analysis.overallScore}/100
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Writing Buddy Sidebar - FIXED POSITIONING */}
      {sidebarVisible && !focusMode && (
        <div 
          ref={sidebarRef}
          className="writing-buddy-sidebar"
          style={{
            width: sidebarCollapsed ? '60px' : `${sidebarWidth}px`,
            minWidth: sidebarCollapsed ? '60px' : '250px',
            maxWidth: sidebarCollapsed ? '60px' : '500px',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderLeft: '1px solid #e5e7eb',
            boxShadow: '-4px 0 6px -1px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            flexShrink: 0
          }}
        >
          {/* Resize Handle */}
          {!sidebarCollapsed && (
            <div
              ref={resizeRef}
              onMouseDown={handleMouseDown}
              className="resize-handle"
              style={{
                position: 'absolute',
                left: '-2px',
                top: '0',
                bottom: '0',
                width: '4px',
                background: '#d1d5db',
                cursor: 'col-resize',
                transition: 'all 0.2s ease',
                zIndex: 10
              }}
            />
          )}

          {/* Enhanced Sidebar Header */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-gray-200">
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-purple-700">Writing Buddy</h3>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 text-purple-400 hover:text-purple-600 hover:bg-purple-100 transition-all duration-200 rounded-lg"
              title={sidebarCollapsed ? "Expand Writing Buddy" : "Collapse Writing Buddy"}
            >
              {sidebarCollapsed ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </button>
          </div>

          {/* Sidebar Content */}
          {!sidebarCollapsed && (
            <div className="flex-1 overflow-hidden">
              <TabbedCoachPanel 
                analysis={analysis} 
                onApplyFix={onApplyFix}
                content={content}
                textType={textType}
              />
            </div>
          )}

          {/* Enhanced Collapsed State */}
          {sidebarCollapsed && (
            <div className="flex-1 flex flex-col items-center justify-center p-3 space-y-4">
              {/* Score Badge */}
              <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center border-2 border-purple-200">
                <span className="text-purple-700 text-sm font-bold">
                  {analysis ? Math.round(analysis.overallScore) : '?'}
                </span>
              </div>
              
              {/* Status Indicators */}
              <div className="flex flex-col items-center space-y-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <BookMarked className="h-4 w-4 text-green-600" />
                </div>
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-orange-600" />
                </div>
              </div>
              
              {/* Collapsed Label */}
              <div className="text-xs text-purple-600 text-center leading-tight font-medium">
                Writing<br />Buddy
              </div>
            </div>
          )}
        </div>
      )}

      {/* Focus Mode Indicator */}
      {focusMode && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-orange-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
            <Maximize2 className="h-4 w-4" />
            <span className="text-sm font-medium">Focus Mode Active</span>
            <button
              onClick={handleFocus}
              className="ml-2 text-orange-200 hover:text-white transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export const WritingArea = WritingAreaImpl;
