/**
 * FIXED WritingArea Component - Resolves text display and functionality issues
 * Key fixes: Text truncation, proper sizing, loading states, tool functionality
 */
import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  Save, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  FileText,
  Clock
} from 'lucide-react';

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
  }, [props.prompt, props.textType]);

  // -------- Editor state --------
  const [content, setContent] = useState<string>(props.content ?? "");
  const [textType, setTextType] = useState<TextType>((props.textType as TextType) || "narrative");
  const [wordCount, setWordCount] = useState<number>(0);
  const [charCount, setCharCount] = useState<number>(0);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevTextRef = useRef<string>(content);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  // Sync with parent if controlled
  useEffect(() => { 
    if (typeof props.content === "string") {
      setContent(props.content);
      updateCounts(props.content);
    }
  }, [props.content]);
  
  useEffect(() => { 
    if (typeof props.textType === "string") setTextType(props.textType as TextType); 
  }, [props.textType]);
  
  useEffect(() => { 
    prevTextRef.current = content; 
  }, [content]);

  // -------- Analysis state --------
  const [analysis, setAnalysis] = useState<DetailedFeedback | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [err, setErr] = useState<string>();

  // Draft management
  const draftId = useRef<string>(
    `draft-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  );
  const [version, setVersion] = useState<number>(0);

  // Update word and character counts
  const updateCounts = useCallback((text: string) => {
    const words = text.trim() ? text.trim().split(/\s+/).filter(w => w.length > 0).length : 0;
    const chars = text.length;
    setWordCount(words);
    setCharCount(chars);
  }, []);

  // Auto-resize textarea
  const autoResize = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, []);

  // Auto-save functionality
  const performAutoSave = useCallback(async (text: string) => {
    if (!text.trim() || text === prevTextRef.current) return;

    setAutoSaveStatus('saving');
    
    try {
      await saveDraft(draftId.current, { 
        content: text, 
        textType, 
        version: version + 1,
        timestamp: new Date().toISOString()
      });
      
      setAutoSaveStatus('saved');
      setLastSaved(new Date());
      setVersion(prev => prev + 1);
      
      // Clear saved status after 3 seconds
      setTimeout(() => {
        setAutoSaveStatus('idle');
      }, 3000);
      
    } catch (error) {
      console.error('Auto-save failed:', error);
      setAutoSaveStatus('error');
      
      // Clear error status after 5 seconds
      setTimeout(() => {
        setAutoSaveStatus('idle');
      }, 5000);
    }
  }, [textType, version]);

  // Handle content changes
  const onEditorChange = useCallback((newContent: string) => {
    setContent(newContent);
    updateCounts(newContent);
    props.onChange?.(newContent);

    // Auto-resize
    setTimeout(autoResize, 0);

    // Setup auto-save
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    autoSaveTimeoutRef.current = setTimeout(() => {
      performAutoSave(newContent);
    }, 2000); // Auto-save after 2 seconds of inactivity

    // Trigger coach feedback for new paragraphs
    const events = detectNewParagraphs(prevTextRef.current, newContent);
    if (events.length) {
      console.log("Emitting paragraph.ready event:", events[events.length - 1]);
      eventBus.emit("paragraph.ready", events[events.length - 1]);
    }
    
    prevTextRef.current = newContent;
  }, [props, updateCounts, autoResize, performAutoSave]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+S to save (prevent default browser save)
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      performAutoSave(content);
    }
    
    // Tab key for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.substring(0, start) + '    ' + content.substring(end);
      onEditorChange(newContent);
      
      // Set cursor position after the inserted tab
      setTimeout(() => {
        textarea.setSelectionRange(start + 4, start + 4);
      }, 0);
    }
  }, [content, onEditorChange, performAutoSave]);

  // Manual save
  const handleManualSave = useCallback(() => {
    performAutoSave(content);
  }, [content, performAutoSave]);

  // Submit for evaluation
  const onSubmitForEvaluation = useCallback(async () => {
    if (!content?.trim()) {
      setErr("Please write some content before submitting for evaluation.");
      return;
    }

    setStatus("loading");
    setErr(undefined);

    try {
      const result = await evaluateEssay({
        content,
        textType,
        assistanceLevel: props.assistanceLevel || "detailed",
        feedbackHistory: []
      });

      if (validateDetailedFeedback(result)) {
        setAnalysis(result);
        setStatus("success");
        console.log("✅ Evaluation successful:", result);
      } else {
        throw new Error("Invalid feedback format received");
      }
    } catch (error: any) {
      console.error("❌ Evaluation failed:", error);
      setErr(error?.message || "Failed to evaluate essay. Please try again.");
      setStatus("error");
    }

    // Notify parent
    props.onSubmit?.();
  }, [content, textType, props]);

  // Auto-resize on mount and content changes
  useEffect(() => {
    autoResize();
  }, [content, autoResize]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Use evaluationStatus from props if available, otherwise use local status
  const currentStatus = props.evaluationStatus || status;

  return (
    <div className="enhanced-writing-area flex flex-col h-full">
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

      {/* --- WRITING STATS BAR --- */}
      <div className="writing-stats-bar bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center justify-between text-sm text-gray-600 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <FileText className="w-4 h-4" />
            <span className="font-medium">{wordCount} words</span>
          </div>
          <span>{charCount} characters</span>
          
          {/* Auto-save status */}
          {autoSaveStatus === 'saving' && (
            <div className="flex items-center space-x-1 text-blue-600">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Saving...</span>
            </div>
          )}
          {autoSaveStatus === 'saved' && (
            <div className="flex items-center space-x-1 text-green-600">
              <CheckCircle className="w-3 h-3" />
              <span>Saved {lastSaved?.toLocaleTimeString()}</span>
            </div>
          )}
          {autoSaveStatus === 'error' && (
            <div className="flex items-center space-x-1 text-red-600">
              <AlertCircle className="w-3 h-3" />
              <span>Save failed</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={handleManualSave}
            className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-900 border border-gray-300 rounded hover:bg-gray-50"
            title="Manual save (Ctrl+S)"
          >
            <Save className="w-3 h-3" />
            <span>Save</span>
          </button>
          <div className="text-xs text-gray-500">
            Ctrl+S to save • Tab to indent
          </div>
        </div>
      </div>

      {/* --- WRITING EDITOR --- */}
      <div className="flex-1 rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="h-full relative">
          <textarea
            ref={textareaRef}
            className="enhanced-writing-textarea w-full h-full p-6 border-0 resize-none focus:outline-none focus:ring-0 text-gray-900 placeholder-gray-400 leading-relaxed"
            placeholder="Start writing your amazing story here! Let your creativity flow and bring your ideas to life… ✨"
            value={content}
            onChange={(e) => onEditorChange(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              fontSize: '16px',
              lineHeight: '1.6',
              fontFamily: 'Georgia, "Times New Roman", serif',
              backgroundColor: 'transparent',
              overflow: 'auto',
              scrollBehavior: 'smooth',
              minHeight: '400px'
            }}
            spellCheck={true}
            autoComplete="off"
            autoCorrect="on"
            autoCapitalize="sentences"
          />
        </div>
      </div>

      {/* --- SUBMIT BUTTON (conditionally rendered) --- */}
      {!props.hidePromptAndSubmit && (
        <div className="mt-4 flex-shrink-0">
          <button
            type="button"
            className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl"
            onClick={onSubmitForEvaluation}
            disabled={currentStatus === "loading" || !content?.trim()}
            aria-label="Submit for Evaluation"
          >
            {currentStatus === "loading" ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                <span>Analyzing…</span>
              </>
            ) : (
              <>
                <span className="mr-2">🎯</span>
                <span>Submit for Evaluation ({wordCount} words)</span>
              </>
            )}
          </button>
          {currentStatus === "error" && (
            <div className="mt-2 text-red-600 text-sm text-center flex items-center justify-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {err}
            </div>
          )}
          {currentStatus === "success" && (
            <div className="mt-2 text-green-600 text-sm text-center flex items-center justify-center">
              <CheckCircle className="w-4 h-4 mr-1" />
              Analysis complete!
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .enhanced-writing-area {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .writing-stats-bar {
          flex-shrink: 0;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }

        .enhanced-writing-textarea {
          transition: all 0.2s ease;
          font-family: Georgia, "Times New Roman", serif !important;
        }

        .enhanced-writing-textarea:focus {
          background-color: #fefefe !important;
        }

        .enhanced-writing-textarea::placeholder {
          font-style: italic;
          opacity: 0.6;
        }

        /* Custom scrollbar */
        .enhanced-writing-textarea::-webkit-scrollbar {
          width: 8px;
        }

        .enhanced-writing-textarea::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }

        .enhanced-writing-textarea::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
          transition: background-color 0.2s ease;
        }

        .enhanced-writing-textarea::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        /* Mobile responsiveness */
        @media (max-width: 768px) {
          .enhanced-writing-textarea {
            font-size: 16px !important; /* Prevent zoom on iOS */
            padding: 1rem !important;
          }
          
          .writing-stats-bar {
            padding: 0.5rem 1rem;
            flex-direction: column;
            gap: 0.5rem;
          }
        }

        /* High DPI Display Support */
        @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
          .enhanced-writing-textarea {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
        }

        /* Accessibility */
        .enhanced-writing-textarea:focus-visible {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .enhanced-writing-textarea {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}

export default WritingAreaImpl;
export const WritingArea = WritingAreaImpl;