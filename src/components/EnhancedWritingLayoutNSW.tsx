import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PlanningToolModal } from './PlanningToolModal';
import { StructureGuideModal } from './StructureGuideModal';
import { TipsModal } from './TipsModal';
import { EnhancedCoachPanel } from './EnhancedCoachPanel';
import { NSWStandaloneSubmitSystem } from './NSWStandaloneSubmitSystem';
import { ReportModal } from './ReportModal';
import { AIEvaluationReportDisplay } from './AIEvaluationReportDisplay';
import { NSWSubmitButton } from './NSWSubmitButton';
import { PromptOptionsModal } from './PromptOptionsModal';
import { InlineTextHighlighter } from './InlineTextHighlighter';
import { SupportLevelSelector } from './SupportLevelSelector';
import { generatePrompt } from '../lib/openai';
import { promptConfig } from '../config/prompts';
import type { DetailedFeedback, LintFix } from '../types/feedback';
import { eventBus } from '../lib/eventBus';
import { detectNewParagraphs } from '../lib/paragraphDetection';
import { NSWEvaluationReportGenerator } from './NSWEvaluationReportGenerator';
import { WritingBuddyService, SupportLevel } from '../lib/writingBuddyService';
import { useAuth } from '../contexts/AuthContext'; // <-- ADDED

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
  X,
  Sparkles
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
  // user?: any; // <-- REMOVED
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
    // user, // <-- REMOVED
    openAIConnected,
    openAILoading,
    panelVisible = true,
    setPanelVisible,
    setPrompt,
  } = props;

  const { user } = useAuth(); // <-- ADDED

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

  // Auto-hide prompt after 5 minutes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isPromptCollapsed) {
        setIsPromptCollapsed(true);
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearTimeout(timer);
  }, [isPromptCollapsed]);
  
  // New states for missing functionality
  const [showPlanningTool, setShowPlanningTool] = useState(false);
  const [showStructureModal, setShowStructureModal] = useState(false);
  const [showTipsModalLocal, setShowTipsModalLocal] = useState(false);
  const [examModeLocal, setExamModeLocal] = useState(false);
  const [showGrammarHighlights, setShowGrammarHighlights] = useState(true);
  const [expandedGrammarStats, setExpandedGrammarStats] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Tiered support system states - Default to High Support
  const [supportLevel, setSupportLevel] = useState<SupportLevel>('High Support');
  const [showSupportLevelModal, setShowSupportLevelModal] = useState(false);
  const [supportLevelLoading, setSupportLevelLoading] = useState(true);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load user's support level preference
  useEffect(() => {
    const loadSupportLevel = async () => {
      if (!user?.id) { // <-- USES AUTH CONTEXT USER
        setSupportLevelLoading(false);
        return;
      }

      try {
        const prefs = await WritingBuddyService.getUserPreferences(user.id);
        if (prefs) {
          setSupportLevel(prefs.support_level);
        }
      } catch (error) {
        console.error('Error loading support level:', error);
      } finally {
        setSupportLevelLoading(false);
      }
    };

    loadSupportLevel();
  }, [user?.id]); // <-- DEPENDENCY ON AUTH CONTEXT USER ID

  const handleSupportLevelChange = async (newLevel: SupportLevel) => {
    setSupportLevel(newLevel);
    setShowSupportLevelModal(false);
  };

  // Prompt starts expanded - will auto-collapse after 5 minutes (handled by timer above)
  // Removed auto-collapse on mount to show prompt initially

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
      alert(`There was an error during evaluation: ${error instanceof Error ? error.message : String(error)}. Please try again.`);
    }
  }, [localContent, onSubmit, textType, effectivePrompt]);

  const handleApplyFix = useCallback((fix: LintFix) => {
    if (textareaRef.current) {
      const start = fix.evidence.start;
      const end = fix.evidence.end;
      const newContent = localContent.substring(0, start) + fix.replacement + localContent.substring(end);
      setLocalContent(newContent);
      if (onChange) {
        onChange(newContent);
      }
    }
  }, [localContent, onChange]);

  return (
    <div className={`flex h-screen w-full ${darkMode ? 'bg-slate-900 text-gray-100' : 'bg-gray-100 text-gray-900'}`}>
      <div className="flex flex-col flex-1">
        {/* Prompt Section */}
        <div className={`flex-shrink-0 border-b ${darkMode ? 'bg-slate-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          {/* Prompt Header */}
          <div className="flex items-center justify-between px-4 py-2">
            <div className="flex items-center space-x-2">
              <LightbulbIcon className={`w-4 h-4 flex-shrink-0 ${
                examModeLocal ? 'text-gray-600' : darkMode ? 'text-cyan-400' : 'text-blue-600'
              }`} />
              <h3 className={`font-medium text-sm flex-shrink-0 ${
                examModeLocal ? 'text-gray-800' : darkMode ? 'text-gray-100' : 'text-blue-800'
              }`}>
                {examModeLocal ? 'NSW Selective Writing Exam' : 'Prompt'}
              </h3>
              <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                examModeLocal
                  ? 'bg-gray-200 text-gray-700'
                  : darkMode ? 'bg-cyan-900/50 text-cyan-200 border border-cyan-700' : 'bg-blue-200 text-blue-800'
              }`}>
                {textType}
              </span>
              {!examModeLocal && isPromptCollapsed && effectivePrompt && (
                <span className={`text-xs italic truncate ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {effectivePrompt.substring(0, 80)}...
                </span>
              )}
            </div>

            {!examModeLocal && (
            <button
              onClick={() => setIsPromptCollapsed(!isPromptCollapsed)}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-md transition-colors text-xs font-medium flex-shrink-0 border ${
                darkMode
                  ? 'text-cyan-300 hover:text-cyan-100 hover:bg-slate-700 border-cyan-700'
                  : 'text-blue-700 hover:text-blue-900 hover:bg-blue-50 border-blue-300'
              }`}
            >
              {isPromptCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
              <span>{isPromptCollapsed ? 'Show Prompt' : 'Hide Prompt'}</span>
            </button>
            )}
            {examModeLocal && (
              <button
                onClick={() => setExamModeLocal(false)}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 border border-red-300 transition-colors"
              >
                <X className="w-3 h-3" />
                <span>Exit Exam Mode</span>
              </button>
            )}
          </div>

          {/* Prompt Content - Always visible in exam mode */}
          {(examModeLocal || !isPromptCollapsed) && effectivePrompt && (
            <div className="px-3 pb-2">
              <div className={`p-2 rounded-lg border text-sm ${
                examModeLocal
                  ? 'bg-white border-gray-300 text-gray-800'
                  : darkMode
                  ? 'bg-slate-900/50 border-slate-700 text-gray-100'
                  : 'bg-white border-blue-200 text-blue-900'
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{effectivePrompt}</p>
              </div>
            </div>
          )}
        </div>

        {/* Toolbar Section - Clean & Minimal (hidden in exam mode) */}
        {!examModeLocal && (
        <div className={`flex items-center justify-between px-6 py-3 border-b flex-shrink-0 ${darkMode ? 'bg-slate-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center space-x-3">
            {/* Plan Button */}
            <button
              onClick={() => {
                console.log('Plan button clicked');
                setShowPlanningTool(true);
              }}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                darkMode ? 'text-gray-300 hover:bg-slate-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <PenTool className="w-4 h-4" />
              <span>Plan</span>
            </button>

            {/* Structure Guide Button */}
            <button
              onClick={() => {
                console.log('Structure Guide button clicked');
                setShowStructureModal(true);
              }}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                darkMode ? 'text-gray-300 hover:bg-slate-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Structure</span>
            </button>

            {/* Tips Button */}
            <button
              onClick={() => {
                console.log('Tips button clicked');
                setShowTipsModalLocal(true);
              }}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                darkMode ? 'text-gray-300 hover:bg-slate-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <LightbulbIcon className="w-4 h-4" />
              <span>Tips</span>
            </button>

            {/* Timer Controls */}
            <div className="flex items-center space-x-2 border-l border-gray-300 pl-3">
              <Clock className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <span className={`font-mono text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {formatTime(elapsedTime)}
              </span>
              <button
                onClick={isTimerRunning ? onPauseTimer : onStartTimer}
                className={`p-1 rounded-full transition-colors ${
                  isTimerRunning
                    ? 'bg-red-100 text-red-600 hover:bg-red-200'
                    : 'bg-green-100 text-green-600 hover:bg-green-200'
                }`}
                title={isTimerRunning ? 'Pause Timer' : 'Start Timer'}
              >
                {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button
                onClick={onResetTimer}
                className={`p-1 rounded-full transition-colors ${darkMode ? 'text-gray-400 hover:bg-slate-700' : 'text-gray-500 hover:bg-gray-100'}`}
                title="Reset Timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Focus Mode */}
            <div className="flex items-center space-x-2 border-l border-gray-300 pl-3">
              <button
                onClick={onToggleFocus}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  focusMode
                    ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                    : darkMode ? 'text-gray-300 hover:bg-slate-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {focusMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span>{focusMode ? 'Exit Focus' : 'Focus Mode'}</span>
              </button>
            </div>

            {/* Settings Button */}
            <div className="flex items-center space-x-2 border-l border-gray-300 pl-3">
              <button
                onClick={() => setShowSettings(true)}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  darkMode ? 'text-gray-300 hover:bg-slate-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Word Count */}
            <div className="flex items-center space-x-1">
              <Type className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {currentWordCount} words
              </span>
              {showWordCountWarning && (
                <AlertCircle className="w-4 h-4 text-red-500" title="Word count is over 50, this is just a demo limit" />
              )}
            </div>

            {/* Last Saved */}
            <div className="flex items-center space-x-1">
              <Info className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : 'Not saved'}
              </span>
            </div>

            {/* Submit Button */}
            <NSWSubmitButton
              onClick={handleSubmitForEvaluation}
              isLoading={evaluationStatus === 'loading'}
              darkMode={darkMode}
            />
          </div>
        </div>
        )}

        {/* Writing Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Text Editor */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className={`max-w-4xl mx-auto ${focusMode ? 'py-16' : ''}`}>
              <InlineTextHighlighter
                content={localContent}
                analysis={analysis}
                showGrammarHighlights={showGrammarHighlights}
                fontFamily={fontFamily}
                fontSize={fontSize}
                lineHeight={lineHeight}
                darkMode={darkMode}
              >
                <textarea
                  ref={textareaRef}
                  className={`w-full h-full resize-none p-4 focus:outline-none ${
                    darkMode ? 'bg-slate-900 text-gray-100' : 'bg-white text-gray-900'
                  }`}
                  style={{
                    fontFamily: fontFamily,
                    fontSize: `${fontSize}px`,
                    lineHeight: lineHeight,
                  }}
                  value={localContent}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="Start writing your essay here..."
                />
              </InlineTextHighlighter>
            </div>
          </div>

          {/* Right Panel - Coach */}
          <div className={`flex-shrink-0 w-80 border-l overflow-y-auto ${
            darkMode ? 'bg-slate-800 border-gray-700' : 'bg-white border-gray-200'
          } ${panelVisible ? 'block' : 'hidden'}`}>
            <EnhancedCoachPanel
              analysis={analysis}
              grammarStats={grammarStats}
              writingMetrics={writingMetrics}
              qualityScore={qualityScore}
              onApplyFix={handleApplyFix}
              showGrammarHighlights={showGrammarHighlights}
              onToggleGrammarHighlights={setShowGrammarHighlights}
              expandedGrammarStats={expandedGrammarStats}
              onToggleExpandedGrammarStats={setExpandedGrammarStats}
              darkMode={darkMode}
              supportLevel={supportLevel}
              onSupportLevelChange={handleSupportLevelChange}
              showSupportLevelModal={showSupportLevelModal}
              onShowSupportLevelModal={setShowSupportLevelModal}
              supportLevelLoading={supportLevelLoading}
              onTogglePanel={() => setPanelVisible && setPanelVisible(!panelVisible)}
            />
          </div>
        </div>

        {/* Modals */}
        <PlanningToolModal
          isOpen={showPlanningTool}
          onClose={() => setShowPlanningTool(false)}
          darkMode={darkMode}
        />
        <StructureGuideModal
          isOpen={showStructureModal}
          onClose={() => setShowStructureModal(false)}
          darkMode={darkMode}
        />
        <TipsModal
          isOpen={showTipsModalLocal}
          onClose={() => setShowTipsModalLocal(false)}
          darkMode={darkMode}
        />
        <PromptOptionsModal
          isOpen={showPromptOptionsModal}
          onClose={() => setShowPromptOptionsModal(false)}
          onGeneratePrompt={handleGenerateNewPrompt}
          onUseCustomPrompt={handleCustomPromptInput}
          darkMode={darkMode}
          textType={textType}
        />
        
        {/* AI Evaluation Modal */}
        {showNSWEvaluation && (
          <NSWEvaluationReportGenerator
            isOpen={showNSWEvaluation}
            onClose={() => setShowNSWEvaluation(false)}
            onComplete={(report) => {
              setNswReport(report);
              setShowNSWEvaluation(false);
              setShowReportModal(true); // Assuming this is the next step
            }}
            essayContent={localContent}
            textType={textType}
            prompt={effectivePrompt || ''}
            evaluationProgress={evaluationProgress}
            darkMode={darkMode}
          />
        )}

        {/* Report Display Modals */}
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          report={nswReport}
          darkMode={darkMode}
        />
        <AIEvaluationReportDisplay
          isOpen={showAIReport}
          onClose={() => setShowAIReport(false)}
          report={aiEvaluationReport}
          darkMode={darkMode}
        />
      </div>
    </div>
  );
}
