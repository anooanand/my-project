import React, { useEffect, useRef, useState, useCallback } from "react";
import { Clock, FileText, Save, Settings, BarChart3, Award, Zap, BookOpen, Target, Sparkles, Lightbulb, MessageSquare, CheckCircle, PenTool, TrendingUp, Bot, Send, Timer, Brain } from 'lucide-react';

// Server-backed API (Netlify functions)
import { evaluateEssay, saveDraft } from "../lib/api";
import { generateChatResponse, getNSWSelectiveFeedback } from '../lib/openai';

// Paragraph detection → real-time coach
import { eventBus } from "../lib/eventBus";
import { detectNewParagraphs } from "../lib/paragraphDetection";

// NSW rubric UI + types + guards
import { RubricPanel } from "./RubricPanel";
import type { DetailedFeedback, LintFix } from "../types/feedback";
import { validateDetailedFeedback } from "../types/feedback.validate";

// Tabs panel (Coach / Analysis / Vocab / Progress)
import { TabbedCoachPanel } from "./TabbedCoachPanel";

// Components from NSWEnhancedWritingInterface and NSWEnhancedWritingStudio
import { NSWMarkingRubric } from './NSWMarkingRubric';
import { WritingTechniqueModules } from './WritingTechniqueModules';
import { GamificationSystem } from './GamificationSystem';
import { NSWStandaloneSubmitSystem } from './NSWStandaloneSubmitSystem';
import { EnhancedInlineSuggestions } from './EnhancedInlineSuggestions';
import { ContextualAIPrompts } from './ContextualAIPrompts';
import { EnhancedFeedbackSystem } from './EnhancedFeedbackSystem';
import { EnhancedGrammarChecker } from './EnhancedGrammarChecker';
import { EnhancedVocabularyBuilder } from './EnhancedVocabularyBuilder';
import { EnhancedSentenceAnalyzer } from './EnhancedSentenceAnalyzer';
import { AdvancedAnalyticsDashboard } from './AdvancedAnalyticsDashboard';

type TextType = "narrative" | "persuasive" | "informative";

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface Props {
  content?: string;
  onChange?: (content: string) => void;
  textType?: string;
  onTimerStart?: (shouldStart: boolean) => void;
  onSubmit?: () => void;
  onTextTypeChange?: (textType: string) => void;
  onPopupCompleted?: () => void;
  onPromptGenerated?: (prompt: string) => void;
  prompt?: string;
  initialContent?: string;
  onContentChange?: (content: string) => void;
  onPromptChange?: (prompt: string) => void;
  examDurationMinutes?: number;
  targetWordCountMin?: number;
  targetWordCountMax?: number;
  promptImage?: string;
}

function WritingAreaImpl(props: Props) {
  // --- editor state ---
  const [textType, setTextType] = useState<TextType>((props.textType as TextType) || "narrative");
  const [content, setContent] = useState<string>(props.content ?? props.initialContent ?? "");
  const prevTextRef = useRef<string>(props.content ?? props.initialContent ?? "");
  const [currentPrompt, setCurrentPrompt] = useState(props.prompt || '');

  useEffect(() => { if (typeof props.content === "string") setContent(props.content); }, [props.content]);
  useEffect(() => { if (typeof props.textType === "string") setTextType(props.textType as TextType); }, [props.textType]);
  useEffect(() => { if (typeof props.prompt === "string") setCurrentPrompt(props.prompt); }, [props.prompt]);

  // --- analysis state ---
  const [analysis, setAnalysis] = useState<DetailedFeedback | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [err, setErr] = useState<string>();
  const [detailedFeedback, setDetailedFeedback] = useState<DetailedFeedback | null>(null);
  const [autoAnalysisTimeout, setAutoAnalysisTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalyzedContent, setLastAnalyzedContent] = useState('');

  // --- autosave (simple versioning) ---
  const [version, setVersion] = useState(0);
  const draftId = useRef(
    `draft-${
      (globalThis.crypto?.randomUUID?.() ??
        Date.now().toString(36) + Math.random().toString(36).slice(2))
    }`
  );

  // --- NSWEnhancedWritingInterface state ---
  const [activeTab, setActiveTab] = useState('write');
  const [examStarted, setExamStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState((props.examDurationMinutes || 30) * 60);
  const [evaluationReport, setEvaluationReport] = useState<any>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [userProgress, setUserProgress] = useState({
    totalPoints: 450,
    level: 5,
    essaysWritten: 8,
    averageScore: 78,
    badges: ['first-essay', 'show-master'],
    achievements: ['first-feedback', 'structure-architect'],
    streakDays: 5,
    wordsWritten: 2340,
    literaryDevicesUsed: 4,
    showDontTellRatio: 72
  });

  // --- NSWEnhancedWritingStudio state ---
  const [currentContent, setCurrentContent] = useState(content);
  const [activePanel, setActivePanel] = useState<'suggestions' | 'prompts' | 'feedback' | 'grammar' | 'vocabulary' | 'sentences' | 'analytics' | 'chat'>('suggestions');
  const [showInlineSuggestions, setShowInlineSuggestions] = useState(true);
  const [showContextualPrompts, setShowContextualPrompts] = useState(true);
  const [assistanceLevel, setAssistanceLevel] = useState<'minimal' | 'moderate' | 'comprehensive'>('moderate');
  const [isExamMode, setIsExamMode] = useState(false);
  const [showFocusMode, setShowFocusMode] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [totalWritingTime, setTotalWritingTime] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [lastTypingTime, setLastTypingTime] = useState<Date | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Handle typing + paragraph detection (triggers coach tips)
  const onEditorChange = (next: string) => {
    const events = detectNewParagraphs(prevTextRef.current, next);
    if (events.length) eventBus.emit("paragraph.ready", events[events.length - 1]);
    prevTextRef.current = next;
    setContent(next);
    props.onChange?.(next);
    props.onContentChange?.(next);
  };

  // Submit → strict JSON rubric (server)
  const onSubmitForEvaluation = async () => {
    try {
      setStatus("loading"); setErr(undefined);
      
      // Call parent onSubmit first to ensure it executes
      props.onSubmit?.();
      
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
    props.onContentChange?.(next);
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

  // --- NSWEnhancedWritingInterface functions ---
  const handleAutoSubmit = () => {
    if (content.trim()) {
      setActiveTab('evaluation');
    }
  };

  const handleEvaluationComplete = (report: any) => {
    setEvaluationReport(report);
    setShowAnalysis(true);
    setActiveTab('feedback');
    if (props.onSubmit) {
      props.onSubmit(content, report);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getWordCountStatus = () => {
    const targetWordCountMin = props.targetWordCountMin || 100;
    const targetWordCountMax = props.targetWordCountMax || 500;
    if (wordCount < targetWordCountMin) {
      return { color: 'text-red-600', message: `${targetWordCountMin - wordCount} words needed` };
    } else if (wordCount > targetWordCountMax) {
      return { color: 'text-orange-600', message: `${wordCount - targetWordCountMax} words over limit` };
    } else {
      return { color: 'text-green-600', message: 'Word count on target' };
    }
  };

  // --- NSWEnhancedWritingStudio functions ---
  const calculateWPM = useCallback(() => {
    if (totalWritingTime === 0 || wordCount === 0) return 0;
    return Math.round((wordCount / totalWritingTime) * 60);
  }, [totalWritingTime, wordCount]);

  const triggerAutoAnalysis = useCallback(async (content: string) => {
    if (content.length < 50 || content === lastAnalyzedContent || isAnalyzing) {
      return;
    }

    setIsAnalyzing(true);
    try {
      const feedback = await getNSWSelectiveFeedback(content, textType, assistanceLevel);
      setDetailedFeedback(feedback);
      setLastAnalyzedContent(content);
      if (activePanel !== 'feedback') {
        setActivePanel('feedback');
      }
    } catch (error) {
      console.error('Auto-analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [textType, assistanceLevel, lastAnalyzedContent, isAnalyzing, activePanel]);

  const handleContentChange = (newContent: string) => {
    setCurrentContent(newContent);
    onEditorChange(newContent); // Keep existing paragraph detection

    const now = new Date();
    if (!startTime && newContent.length > 0) {
      setStartTime(now);
    }
    if (!isTyping) {
      setIsTyping(true);
      setLastTypingTime(now);
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (autoAnalysisTimeout) {
      clearTimeout(autoAnalysisTimeout);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      setLastTypingTime(null);
    }, 1500);

    const analysisTimeout = setTimeout(() => {
      triggerAutoAnalysis(newContent);
    }, 3000);
    setAutoAnalysisTimeout(analysisTimeout);
  };

  const handleSendMessage = async () => {
    if (chatInput.trim() === '') return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: chatInput,
      sender: 'user',
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const response = await generateChatResponse({
        userMessage: chatInput,
        textType,
        currentContent: content,
        wordCount,
        context: `User is currently writing a ${textType} piece with ${wordCount} words.`
      });

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'ai',
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I'm having trouble connecting right now. Please try again in a moment! 😊",
        sender: 'ai',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleTimerToggle = () => {
    if (props.onTimerStart) {
      props.onTimerStart(!isExamMode);
    }
    setIsExamMode(!isExamMode);
  };

  const handleSubmit = async () => {
    if (props.onSubmit) {
      props.onSubmit();
    }

    setIsAnalyzing(true);
    try {
      const feedback = await getNSWSelectiveFeedback(content, textType, assistanceLevel);
      setDetailedFeedback(feedback);
      setActivePanel("feedback");
    } catch (error) {
      console.error('Manual analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (examStarted && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            setExamStarted(false);
            handleAutoSubmit();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [examStarted, timeLeft, handleAutoSubmit]);

  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [content]);

  useEffect(() => {
    return () => {
      if (autoAnalysisTimeout) {
        clearTimeout(autoAnalysisTimeout);
      }
    };
  }, [autoAnalysisTimeout]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTyping && startTime) {
      interval = setInterval(() => {
        setTotalWritingTime(Math.floor((new Date().getTime() - startTime.getTime()) / 1000));
      }, 1000);
    } else if (!isTyping && startTime && lastTypingTime) {
      setTotalWritingTime(prev => prev + Math.floor((new Date().getTime() - lastTypingTime.getTime()) / 1000));
    }
    return () => clearInterval(interval);
  }, [isTyping, startTime, lastTypingTime]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

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
              onChange={(e) => handleContentChange(e.target.value)}
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

// export both (default + named) so imports in your app keep working
export default WritingAreaImpl;
export const WritingArea = WritingAreaImpl;
