// src/components/EnhancedWritingLayoutNSW.tsx - MODIFIED VERSION WITH BOTTOM SUBMIT BUTTON

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PlanningToolModal } from './PlanningToolModal';
import { StructureGuideModal } from './StructureGuideModal';
import { TipsModal } from './TipsModal';
import { EnhancedCoachPanel } from './EnhancedCoachPanel';
import { NSWStandaloneSubmitSystem } from './NSWStandaloneSubmitSystem';
import { ReportModal } from './ReportModal';
import { AIEvaluationReportDisplay } from './AIEvaluationReportDisplay';
import { PromptOptionsModal } from './PromptOptionsModal';
import { InlineTextHighlighter } from './InlineTextHighlighter';
import { generatePrompt } from '../lib/openai';
import { promptConfig } from '../config/prompts';
import type { DetailedFeedback, LintFix } from '../types/feedback';
import { eventBus } from '../lib/eventBus';
import { detectNewParagraphs } from '../lib/paragraphDetection';
import { NSWEvaluationReportGenerator } from './NSWEvaluationReportGenerator'; // Ensure this path is correct
import {
  PenTool,
  Play,
  BookOpen,
  Lightbulb as LightbulbIcon,
  Settings,
  Pause,
  RotateCcw,
  Eye,
  EyeOff,
  Target,
  Info,
  Clock,
  FileText,
  Type,
  Zap,
  ChevronUp,
  ChevronDown,
  AlertCircle,
  PlayCircle,
  PauseCircle,
  X
} from 'lucide-react';

interface EnhancedWritingLayoutNSWProps {
  content: string;
  onChange: (content: string) => void;
  textType: string;
  initialPrompt: string;
  wordCount: number;
  onWordCountChange: (count: number) => void;
  darkMode?: boolean;
  fontFamily?: string;
  fontSize?: number;
  lineHeight?: number;
  onSettingsChange?: (settings: any) => void;
  isTimerRunning?: boolean;
  elapsedTime?: number;
  onStartTimer?: () => void;
  onPauseTimer?: () => void;
  onResetTimer?: () => void;
  focusMode?: boolean;
  onToggleFocus?: () => void;
  showStructureGuide?: boolean;
  onToggleStructureGuide?: () => void;
  showTips?: boolean;
  onToggleTips?: () => void;
  analysis?: DetailedFeedback | null;
  onAnalysisChange?: (analysis: DetailedFeedback | null) => void;
  setPrompt?: (prompt: string) => void;
  assistanceLevel?: string;
  onAssistanceLevelChange?: (level: string) => void;
  onSubmit?: (content: string) => void;
  selectedText?: string;
  onTextTypeChange?: (type: string) => void;
  onPopupCompleted?: () => void;
  popupFlowCompleted?: boolean;
  user?: any;
  openAIConnected?: boolean;
  openAILoading?: boolean;
  panelVisible?: boolean;
  setPanelVisible?: (visible: boolean) => void;
}

export function EnhancedWritingLayoutNSW(props: EnhancedWritingLayoutNSWProps) {
  console.log("EnhancedWritingLayoutNSW Props:", props);
  const {
    content,
    onChange,
    textType,
    initialPrompt,
    wordCount,
    onWordCountChange,
    darkMode = false,
    fontFamily = 'Inter',
    fontSize = 16,
    lineHeight = 1.6,
    onSettingsChange,
    isTimerRunning = false,
    elapsedTime = 0,
    onStartTimer,
    onPauseTimer,
    onResetTimer,
    focusMode = false,
    onToggleFocus,
    showStructureGuide = false,
    onToggleStructureGuide,
    showTips = false,
    onToggleTips,
    analysis,
    onAnalysisChange,
    assistanceLevel,
    onAssistanceLevelChange,
    onSubmit,
    selectedText,
    onTextTypeChange,
    onPopupCompleted,
    popupFlowCompleted,
    user,
    openAIConnected,
    openAILoading,
    panelVisible = true,
    setPanelVisible,
    setPrompt,
  } = props;

  // State management
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [customPromptInput, setCustomPromptInput] = useState<string | null>(null);
  const [localContent, setLocalContent] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showNSWEvaluation, setShowNSWEvaluation] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [nswReport, setNswReport] = useState<any>(null);
  const [aiEvaluationReport, setAiEvaluationReport] = useState<any>(null);
  const [showAIReport, setShowAIReport] = useState(false);
  const [evaluationStatus, setEvaluationStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [evaluationProgress, setEvaluationProgress] = useState("");
  const [showPromptOptionsModal, setShowPromptOptionsModal] = useState(false);
  const [hidePrompt, setHidePrompt] = useState(false);
  const [isPromptCollapsed, setIsPromptCollapsed] = useState(false);
  
  // New states for missing functionality
  const [showPlanningTool, setShowPlanningTool] = useState(false);
  const [examMode, setExamMode] = useState(false);
  const [showGrammarHighlights, setShowGrammarHighlights] = useState(true);
  const [expandedGrammarStats, setExpandedGrammarStats] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Start with prompt collapsed to maximize writing space
  useEffect(() => {
    setIsPromptCollapsed(true);
  }, []);

  // Calculate word count first (needed by other metrics)
  const currentWordCount = React.useMemo(() => {
    return localContent.trim() ? localContent.trim().split(/\s+/).length : 0;
  }, [localContent]);

  // Calculate grammar stats
  const grammarStats = React.useMemo(() => {
    const text = localContent;
    if (!text) return { weakVerbs: 0, overused: 0, passive: 0, weakAdjectives: 0 };

    const weakVerbs = (text.match(/\b(is|are|was|were|be|been|being)\b/gi) || []).length;
    const overused = (text.match(/\b(very|really|just|actually|basically|literally)\b/gi) || []).length;
    const passive = (text.match(/\b(was|were|been)\s+\w+ed\b/gi) || []).length;
    const weakAdjectives = (text.match(/\b(good|bad|nice|big|small)\b/gi) || []).length;

    return { weakVerbs, overused, passive, weakAdjectives };
  }, [localContent]);

  // Calculate additional writing metrics
  const writingMetrics = React.useMemo(() => {
    const text = localContent.trim();
    if (!text) return {
      characters: 0,
      charactersNoSpaces: 0,
      sentences: 0,
      paragraphs: 0,
      readingTime: 0,
      avgWordsPerSentence: 0
    };

    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, '').length;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0).length;
    const readingTime = Math.ceil(currentWordCount / 200); // 200 words per minute
    const avgWordsPerSentence = sentences > 0 ? Math.round(currentWordCount / sentences) : 0;

    return { characters, charactersNoSpaces, sentences, paragraphs, readingTime, avgWordsPerSentence };
  }, [localContent, currentWordCount]);

  // Calculate writing quality score
  const qualityScore = React.useMemo(() => {
    if (currentWordCount === 0) return 0;

    let score = 100;

    // Deduct points for issues
    score -= grammarStats.weakVerbs * 2;
    score -= grammarStats.overused * 3;
    score -= grammarStats.passive * 2;
    score -= grammarStats.weakAdjectives * 2;

    // Deduct if outside word count range
    if (currentWordCount < 50) score -= 10;
    if (currentWordCount > 50) score -= 15;

    // Deduct for short sentences (less than 8 words avg)
    if (writingMetrics.avgWordsPerSentence < 8) score -= 5;

    // Deduct for very long sentences (more than 25 words avg)
    if (writingMetrics.avgWordsPerSentence > 25) score -= 5;

    return Math.max(0, Math.min(100, score));
  }, [currentWordCount, grammarStats, writingMetrics]);

  // Get effective prompt
  const effectivePrompt = generatedPrompt || customPromptInput || initialPrompt;
  console.log("EnhancedWritingLayoutNSW State:", { generatedPrompt, customPromptInput, localContent, effectivePrompt, showPromptOptionsModal, hidePrompt, popupFlowCompleted });

  // Initialize content
  useEffect(() => {
    if (content !== undefined) {
      setLocalContent(content);
    }
  }, [content]);

  // Auto-save content changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localContent !== content && onChange) {
        onChange(localContent);
        setLastSaved(new Date());
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [localContent, content, onChange]);

  // Update word count
  useEffect(() => {
    const words = localContent.trim().split(/\s+/).filter(word => word.length > 0);
    const newWordCount = words.length;
    if (newWordCount !== wordCount && onWordCountChange) {
      onWordCountChange(newWordCount);
    }
  }, [localContent, wordCount, onWordCountChange]);

  // Show prompt modal if no prompt exists
  useEffect(() => {
    if (!effectivePrompt && !popupFlowCompleted) {
      setShowPromptOptionsModal(true);
    }
  }, [effectivePrompt, popupFlowCompleted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleGenerateNewPrompt = useCallback(async () => {
    try {
      const newPrompt = await generatePrompt(textType, promptConfig.systemPrompts.promptGenerator);
      setGeneratedPrompt(newPrompt);
      setLocalContent(newPrompt);
      if (setPrompt) {
        setPrompt(newPrompt);
      }
      if (onChange) {
        onChange(newPrompt);
      }
      setShowPromptOptionsModal(false);
      if (onPopupCompleted) onPopupCompleted();
    } catch (error) {
      console.error("Error generating prompt:", error);
      alert("Failed to generate a prompt. Please try again.");
    }
  }, [textType, setPrompt, onChange, onPopupCompleted]);

  const handleCustomPromptInput = useCallback((promptText: string) => {
    setCustomPromptInput(promptText);
    setLocalContent(promptText);
    if (setPrompt) {
      setPrompt(promptText);
    }
    if (onChange) {
      onChange(promptText);
    }
    setShowPromptOptionsModal(false);
    if (onPopupCompleted) onPopupCompleted();
  }, [setPrompt, onChange, onPopupCompleted]);

  const handleContentChange = useCallback((newContent: string) => {
    setLocalContent(newContent);
    
    if (newContent.trim().length > 0 && !isTimerRunning && elapsedTime === 0 && onStartTimer) {
      onStartTimer();
    }
    
    if (eventBus && detectNewParagraphs) {
      const newParagraphs = detectNewParagraphs(content, newContent);
      if (newParagraphs.length > 0) {
        eventBus.emit('newParagraphsDetected', { paragraphs: newParagraphs, textType });
      }
    }
  }, [content, isTimerRunning, elapsedTime, onStartTimer, textType]);

  // Convert NSW report format to DetailedFeedback format
  const convertNSWReportToDetailedFeedback = (report: any): any => {
    const maxScore = 10;
    return {
      id: `nsw-${Date.now()}`,
      overallScore: report.overallScore || 0,
      criteria: {
        ideasContent: {
          score: Math.min(report.domains?.contentAndIdeas?.score || 0, maxScore),
          weight: report.domains?.contentAndIdeas?.weight || 40,
          strengths: (report.domains?.contentAndIdeas?.feedback || []).map((text: string) => ({ 
            text, 
            start: 0, 
            end: 0 
          })),
          improvements: (report.areasForImprovement || [])
            .filter((item: any) => item.toLowerCase().includes('idea') || item.toLowerCase().includes('content'))
            .map((text: string) => ({
              issue: text,
              evidence: { text: '', start: 0, end: 0 },
              suggestion: 'Consider developing this area further'
            }))
        },
        structureOrganization: {
          score: Math.min(report.domains?.textStructure?.score || 0, maxScore),
          weight: report.domains?.textStructure?.weight || 20,
          strengths: (report.domains?.textStructure?.feedback || []).map((text: string) => ({ 
            text, 
            start: 0, 
            end: 0 
          })),
          improvements: (report.areasForImprovement || [])
            .filter((item: any) => item.toLowerCase().includes('structure') || item.toLowerCase().includes('organization'))
            .map((text: any) => ({
              issue: text,
              evidence: { text: '', start: 0, end: 0 },
              suggestion: 'Work on improving your structure'
            }))
        },
        languageVocab: {
          score: Math.min(report.domains?.languageFeatures?.score || 0, maxScore),
          weight: report.domains?.languageFeatures?.weight || 25,
          strengths: (report.domains?.languageFeatures?.feedback || []).map((text: string) => ({ 
            text, 
            start: 0, 
            end: 0 
          })),
          improvements: (report.areasForImprovement || [])
            .filter((item: any) => item.toLowerCase().includes('language') || item.toLowerCase().includes('vocabulary'))
            .map((text: string) => ({
              issue: text,
              evidence: { text: '', start: 0, end: 0 },
              suggestion: 'Enhance your vocabulary'
            }))
        },
        spellingPunctuationGrammar: {
          score: Math.min(report.domains?.spellingAndGrammar?.score || 0, maxScore),
          weight: report.domains?.spellingAndGrammar?.weight || 15,
          strengths: (report.domains?.spellingAndGrammar?.feedback || []).map((text: string) => ({ 
            text, 
            start: 0, 
            end: 0 
          })),
          improvements: (report.areasForImprovement || [])
            .filter((item: any) => item.toLowerCase().includes('spelling') || item.toLowerCase().includes('grammar'))
            .map((text: string) => ({
              issue: text,
              evidence: { text: '', start: 0, end: 0 },
              suggestion: 'Review spelling and grammar rules'
            }))
        }
      },
      grammarCorrections: [],
      vocabularyEnhancements: [],
      overallGrade: report.overallGrade,
      domains: report.domains,
      detailedFeedback: report.detailedFeedback,
      recommendations: report.recommendations,
      strengths: report.strengths,
      areasForImprovement: report.areasForImprovement,
      essayContent: report.essayContent,
      originalityReport: report.originalityReport
    };
  };

  // Calculate content status
  const hasContent = localContent.trim().length > 0;
    const showWordCountWarning = currentWordCount > 50;

  const handleSubmitForEvaluation = useCallback(async () => {
    console.log('🎯 Submit button clicked!');
    console.log('Content length:', localContent.length);
    console.log('Has content:', hasContent);
    
    if (!localContent.trim()) {
      alert("Please write something before submitting for evaluation.");
      return;
    }

    if (onSubmit) {
      console.log('Calling onSubmit prop...');
      onSubmit(localContent);
    }

    console.log('Starting NSW evaluation...');
    setEvaluationStatus("loading");
    setShowNSWEvaluation(true);
    setEvaluationProgress("Analyzing your writing with AI...");

    try {
      setTimeout(() => setEvaluationProgress("Checking grammar and structure..."), 1000);
      setTimeout(() => setEvaluationProgress("Evaluating content and ideas..."), 2000);
      setTimeout(() => setEvaluationProgress("Generating detailed feedback..."), 3000);

      console.log('Calling AI NSW evaluation API...');

      // Call AI evaluation backend
      const response = await fetch("/.netlify/functions/nsw-ai-evaluation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          essayContent: localContent,
          textType: textType,
          prompt: effectivePrompt || ''
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to evaluate essay");
      }

      const aiReport = await response.json();
      console.log('AI Report received:', aiReport);

      setAiEvaluationReport(aiReport);
      setShowNSWEvaluation(false);
      setShowAIReport(true);
      setEvaluationStatus("success");

      console.log('✅ AI Evaluation complete!');
    } catch (error) {
      console.error("❌ NSW AI evaluation error:", error);
      setEvaluationStatus("error");
      setShowNSWEvaluation(false);
      alert(`There was an error evaluating your writing: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [localContent, textType, effectivePrompt, onSubmit, onAnalysisChange]);

  const handleApplyFix = useCallback((fix: LintFix) => {
    setLocalContent((prevContent) => {
      const start = fix.evidence.start;
      const end = fix.evidence.end;
      const newContent = prevContent.substring(0, start) + fix.replacement + prevContent.substring(end);
      return newContent;
    });
  }, []);

  const handleTogglePlanningTool = useCallback(() => {
    setShowPlanningTool(prev => !prev);
  }, []);

  const handleToggleExamMode = useCallback(() => {
    setExamMode(prev => !prev);
  }, []);

  return (
    <div className={`flex flex-col h-full w-full overflow-hidden ${darkMode ? 'bg-slate-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      {/* Prompt Display Section */}
      <div className={`flex flex-col flex-shrink-0 ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
        <div className={`flex items-center justify-between px-4 py-2 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center space-x-2 flex-grow">
            <div className="flex items-center space-x-2 flex-grow">
              <LightbulbIcon className={`w-4 h-4 flex-shrink-0 ${darkMode ? 'text-cyan-400' : 'text-blue-600'}`} />
              <h3 className={`font-medium text-sm flex-shrink-0 ${darkMode ? 'text-gray-100' : 'text-blue-800'}`}>
                Prompt
              </h3>
              <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                darkMode ? 'bg-cyan-900/50 text-cyan-200 border border-cyan-700' : 'bg-blue-200 text-blue-800'
              }`}>
                {textType}
              </span>
              {isPromptCollapsed && effectivePrompt && (
                <span className={`text-xs italic truncate ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {effectivePrompt.substring(0, 80)}...
                </span>
              )}
            </div>

            <button
              onClick={() => setIsPromptCollapsed(!isPromptCollapsed)}
              className={`flex items-center space-x-1 px-2 py-1 rounded-md transition-colors text-xs font-medium flex-shrink-0 ${
                darkMode
                  ? 'text-cyan-300 hover:text-cyan-100 hover:bg-slate-700'
                  : 'text-blue-700 hover:text-blue-900 hover:bg-blue-100'
              }`}
            >
              {isPromptCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
              <span>{isPromptCollapsed ? 'Show' : 'Hide'}</span>
            </button>
          </div>

          {/* Prompt Content */}
          {!isPromptCollapsed && effectivePrompt && (
            <div className="px-4 pb-3">
              <div className={`p-3 rounded-lg border text-sm ${
                darkMode
                  ? 'bg-slate-900/50 border-slate-700 text-gray-100'
                  : 'bg-white border-blue-200 text-blue-900'
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{effectivePrompt}</p>
              </div>
            </div>
          )}
        </div>

        {/* Toolbar Section - Compact */}
        <div className={`flex items-center justify-between px-4 py-1.5 border-b flex-shrink-0 ${
          darkMode ? 'bg-slate-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center space-x-2">
            {/* Plan Button */}
            <button
              onClick={handleTogglePlanningTool}
              className={`flex items-center space-x-1 px-2 py-1 rounded transition-colors ${
                showPlanningTool
                  ? darkMode
                    ? 'bg-blue-700 text-white hover:bg-blue-600'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                  : darkMode
                  ? 'text-gray-300 hover:bg-gray-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              title="Planning Tool"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Plan</span>
            </button>

            {/* Structure Button */}
            <button
              onClick={onToggleStructureGuide}
              className={`flex items-center space-x-1 px-2 py-1 rounded transition-colors ${
                showStructureGuide
                  ? darkMode
                    ? 'bg-green-700 text-white hover:bg-green-600'
                    : 'bg-green-500 text-white hover:bg-green-600'
                  : darkMode
                  ? 'text-gray-300 hover:bg-gray-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              title="Structure Guide"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Structure</span>
            </button>

            {/* Tips Button */}
            <button
              onClick={onToggleTips}
              className={`flex items-center space-x-1 px-2 py-1 rounded transition-colors ${
                showTips
                  ? darkMode
                    ? 'bg-orange-700 text-white hover:bg-orange-600'
                    : 'bg-orange-500 text-white hover:bg-orange-600'
                  : darkMode
                  ? 'text-gray-300 hover:bg-gray-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              title="Writing Tips"
            >
              <LightbulbIcon className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Tips</span>
            </button>

            {/* Exam Mode Button */}
            <button
              onClick={handleToggleExamMode}
              className={`flex items-center space-x-1 px-2 py-1 rounded transition-colors ${
                examMode
                  ? darkMode
                    ? 'bg-purple-900 text-purple-200'
                    : 'bg-purple-600 text-white'
                  : darkMode
                  ? 'text-gray-300 hover:bg-gray-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              title="Exam Mode"
            >
              <Target className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Exam</span>
            </button>

            {/* Focus Mode Button */}
            <button
              onClick={onToggleFocus}
              className={`flex items-center space-x-1 px-2 py-1 rounded transition-colors ${
                focusMode
                  ? darkMode
                    ? 'bg-orange-700 text-white hover:bg-orange-600'
                    : 'bg-orange-500 text-white hover:bg-orange-600'
                  : darkMode
                  ? 'text-gray-300 hover:bg-gray-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              title="Focus Mode"
            >
              {focusMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span className="text-xs font-medium">Focus</span>
            </button>
          </div>

          <div className="flex items-center space-x-4">
            {/* Timer */}
            <div className="flex items-center space-x-2">
              <Clock className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              <span className={`text-sm font-mono ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {formatTime(elapsedTime)}
              </span>
              <button
                onClick={isTimerRunning ? onPauseTimer : onStartTimer}
                className={`p-1 rounded transition-colors ${
                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                }`}
                title={isTimerRunning ? "Pause Timer" : "Start Timer"}
              >
                {isTimerRunning ? (
                  <PauseCircle className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                ) : (
                  <PlayCircle className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                )}
              </button>
              <button
                onClick={onResetTimer}
                className={`p-1 rounded transition-colors ${
                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                }`}
                title="Reset Timer"
              >
                <RotateCcw className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              </button>
            </div>

            {/* Enhanced Word Count with Progress */}
            <div className="flex items-center space-x-4">
              <FileText className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                                         <div className="flex flex-col">
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-medium ${
                    currentWordCount >= 300
                      ? 'text-green-500'
                      : darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {currentWordCount} / 300 words
                  </span>
                  {currentWordCount >= 300 && (
                    <span className="text-xs text-green-500">✓ Target reached</span>
                  )}
                </div>
                <div className="w-32 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-1">
                  <div
                    className={`h-full transition-all duration-300 ${
                      currentWordCount >= 300
                        ? 'bg-green-500'
                        : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min((currentWordCount / 300) * 100, 100) }%` }}
                  />
                </div>
              </div>

              {/* Additional Metrics */}
              {currentWordCount > 0 && (
                <>
                  <div className={`h-6 w-px ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`} />
                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <span>{writingMetrics.sentences} sentences</span>
                  </div>
                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <span>{writingMetrics.readingTime} min read</span>
                  </div>
                  {lastSaved && (
                    <>
                      <div className={`h-6 w-px ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`} />
                      <div className={`flex items-center space-x-1 text-xs ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                        <span className="animate-pulse">●</span>
                        <span>Saved ${new Date().getTime() - lastSaved.getTime() < 2000 ? 'just now' : 'recently'}</span>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Settings Button */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg transition-colors ${
                showSettings
                  ? darkMode
                    ? 'bg-gray-700 text-gray-200'
                    : 'bg-gray-200 text-gray-700'
                  : darkMode
                  ? 'text-gray-400 hover:bg-gray-700'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className={`p-4 border-b flex-shrink-0 ${
            darkMode ? 'bg-slate-800 border-gray-700' : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h4 className={`font-medium text-base ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                ⚙️ Writing Settings
              </h4>
              <button
                onClick={() => setShowSettings(false)}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-md transition-colors text-sm font-medium ${
                  darkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                title="Close Settings"
              >
                <X className="w-4 h-4" />
                <span>Close</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Font Family */}
              <div className="space-y-2">
                <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  📝 Font Family
                </label>
                <select
                  value={fontFamily}
                  onChange={(e) => onSettingsChange && onSettingsChange({ fontFamily: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="Inter">Inter</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Arial">Arial</option>
                  <option value="Helvetica">Helvetica</option>
                  <option value="Courier New">Courier New</option>
                </select>
              </div>
              
              {/* Font Size */}
              <div className="space-y-2">
                <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  📏 Font Size
                </label>
                <input
                  type="number"
                  value={fontSize}
                  onChange={(e) => onSettingsChange && onSettingsChange({ fontSize: parseInt(e.target.value) })}
                  className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              {/* Line Height */}
              <div className="space-y-2">
                <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  📐 Line Height
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={lineHeight}
                  onChange={(e) => onSettingsChange && onSettingsChange({ lineHeight: parseFloat(e.target.value) })}
                  className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )}

        {/* Writing Area - Takes remaining space */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="relative h-full">
            <textarea
              ref={textareaRef}
              value={localContent}
              onChange={(e) => handleContentChange(e.target.value)}
              className={`w-full h-full resize-none p-6 rounded-xl shadow-lg transition-all duration-300 text-base leading-relaxed focus:outline-none ${
                darkMode
                  ? 'bg-slate-900 text-gray-100 placeholder-gray-500 border-2 border-slate-700 focus:border-cyan-500 focus:shadow-cyan-500/20'
                  : 'bg-white text-gray-800 placeholder-gray-400 border-2 border-gray-200 focus:border-blue-500 focus:shadow-blue-500/20'
              }`}
              style={{ fontFamily, fontSize: `${fontSize}px`, lineHeight }}
              placeholder="Start writing your amazing story here! Let your creativity flow and bring your ideas to life..."
            />

            {/* Writing Quality Score Badge */}
            {currentWordCount > 20 && (
              <div className={`absolute top-4 right-4 px-3 py-2 rounded-lg shadow-lg border backdrop-blur-sm ${
                darkMode ? 'bg-slate-800/90 border-slate-700' : 'bg-white/90 border-gray-200'
              }`}>
                <div className="flex items-center space-x-2">
                  <div className="flex flex-col items-end">
                    <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Quality Score
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className={`text-2xl font-bold ${
                        qualityScore >= 90 ? 'text-green-500' :
                        qualityScore >= 70 ? 'text-blue-500' :
                        qualityScore >= 50 ? 'text-yellow-500' :
                        'text-red-500'
                      }`}>
                        {qualityScore}
                      </span>
                      <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>/ 100</span>
                    </div>
                  </div>
                  <div className={`w-12 h-12 rounded-full border-4 flex items-center justify-center ${
                    qualityScore >= 90 ? 'border-green-500 bg-green-500/10' :
                    qualityScore >= 70 ? 'border-blue-500 bg-blue-500/10' :
                    qualityScore >= 50 ? 'border-yellow-500 bg-yellow-500/10' :
                    'border-red-500 bg-red-500/10'
                  }`}>
                    <Zap className={`w-6 h-6 ${
                      qualityScore >= 90 ? 'text-green-500' :
                      qualityScore >= 70 ? 'text-blue-500' :
                      qualityScore >= 50 ? 'text-yellow-500' :
                      'text-red-500'
                    }`} />
                  </div>
                </div>
              </div>
            )}

            {/* Grammar Stats Overlay */}
            {showGrammarHighlights && currentWordCount > 0 && (
              <div className={`absolute bottom-4 left-4 px-3 py-2 rounded-lg shadow-lg border backdrop-blur-sm ${
                darkMode ? 'bg-slate-800/90 border-slate-700' : 'bg-white/90 border-gray-200'
              }`}>
                <div className="flex items-center justify-between">
                  <h5 className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Grammar Insights</h5>
                  <button
                    onClick={() => setExpandedGrammarStats(!expandedGrammarStats)}
                    className={`p-1 rounded transition-colors ${
                      darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                    }`}
                  >
                    {expandedGrammarStats ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                  </button>
                </div>
                {expandedGrammarStats && (
                  <div className="mt-2 text-xs space-y-1">
                    <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Weak Verbs: {grammarStats.weakVerbs}</p>
                    <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Overused Words: {grammarStats.overused}</p>
                    <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Passive Voice: {grammarStats.passive}</p>
                    <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Weak Adjectives: {grammarStats.weakAdjectives}</p>
                  </div>
                )}
              </div>
            )}

            {/* Submit for Evaluation Button */}
            <div className="absolute bottom-4 right-4">
              <button
                onClick={handleSubmitForEvaluation}
                disabled={!hasContent || evaluationStatus === "loading"}
                className={`px-6 py-3 rounded-full text-lg font-semibold shadow-lg transition-all duration-300
                  ${!hasContent || evaluationStatus === "loading"
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-purple-300'
                  }`}
              >
                {evaluationStatus === "loading" ? (
                  <span className="flex items-center">
                    <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></span>
                    Evaluating...
                  </span>
                ) : (
                  "Submit for Evaluation"
                )}
              </button>
            </div>

            {/* Inline Text Highlighter for Feedback */}
            {analysis && analysis.grammarCorrections && (
              <InlineTextHighlighter
                text={localContent}
                highlights={analysis.grammarCorrections.map(correction => ({
                  start: correction.evidence.start,
                  end: correction.evidence.end,
                  color: 'yellow',
                  tooltip: `Correction: ${correction.suggestion}`
                }))}
              />
            )}
            {analysis && analysis.vocabularyEnhancements && (
              <InlineTextHighlighter
                text={localContent}
                highlights={analysis.vocabularyEnhancements.map(enhancement => ({
                  start: enhancement.evidence.start,
                  end: enhancement.evidence.end,
                  color: 'orange',
                  tooltip: `Enhancement: ${enhancement.suggestion}`
                }))}
              />
            )}
          </div>
        </div>
      </div>

      {/* Right side - Coach Panel */}
      {!focusMode && (
        <div className={`w-[380px] flex-shrink-0 border-l overflow-y-auto transition-all duration-300 ${
          darkMode ? 'bg-slate-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <EnhancedCoachPanel
            content={localContent}
            textType={textType}
            timeElapsed={elapsedTime}
            wordCount={currentWordCount}
            analysis={analysis}
            onAnalysisChange={onAnalysisChange}
            onApplyFix={handleApplyFix}
            assistanceLevel={assistanceLevel}
            onAssistanceLevelChange={onAssistanceLevelChange}
            user={user}
            openAIConnected={openAIConnected}
            openAILoading={openAILoading}
            onSubmitForEvaluation={handleSubmitForEvaluation}
          />
        </div>
      )}

      {/* Modals */}
      {showPlanningTool && <PlanningToolModal onClose={handleTogglePlanningTool} textType={textType} />}
      {showStructureGuide && <StructureGuideModal onClose={onToggleStructureGuide} textType={textType} />}
      {showTips && <TipsModal onClose={onToggleTips} textType={textType} />}
      {showAIReport && aiEvaluationReport && (
        <AIEvaluationReportDisplay
          report={aiEvaluationReport}
          essayText={localContent}
          onClose={() => {
            setShowAIReport(false);
            setAiEvaluationReport(null);
            if (onAnalysisChange) onAnalysisChange(null);
          }}
        />
      )}
      {showReportModal && nswReport && (
        <ReportModal
          isOpen={showReportModal}
          data={nswReport}
          onClose={() => {
            setShowReportModal(false);
            setNswReport(null);
            if (onAnalysisChange) onAnalysisChange(null);
          }}
          onApplyFix={handleApplyFix}
          studentName="Student"
          essayText={localContent}
        />
      )}
      {showNSWEvaluation && evaluationStatus === "loading" && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className={`p-8 rounded-xl shadow-2xl text-center max-w-md ${
            darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white'
          }`}>
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-cyan-500 mx-auto mb-4"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Zap className="w-6 h-6 text-cyan-500 animate-pulse" />
              </div>
            </div>
            <p className={`text-lg font-semibold mb-2 ${
              darkMode ? 'text-gray-100' : 'text-gray-800'
            }`}>Evaluating your writing...</p>
            <p className={`text-sm mt-2 ${
              darkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>{evaluationProgress}</p>
            <div className="mt-4 flex justify-center space-x-1">
              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            {evaluationStatus === "error" && (
              <button
                onClick={() => {
                  setShowNSWEvaluation(false);
                  setEvaluationStatus("idle");
                }}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Close
              </button>
            )}
          </div>
        </div>
      )}
      {showPromptOptionsModal && (
        <PromptOptionsModal
          isOpen={showPromptOptionsModal}
          onClose={() => setShowPromptOptionsModal(false)}
          onGeneratePrompt={handleGenerateNewPrompt}
          onCustomPrompt={handleCustomPromptInput}
          textType={textType}
          darkMode={darkMode}
        />
      )}
    </div>
  );
}

export default EnhancedWritingLayoutNSW;