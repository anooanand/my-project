// src/components/EnhancedWritingLayoutNSW.tsx - FIXED VERSION WITH BUTTON AND MODAL FIXES

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
  const [examMode, setExamMode] = useState(false);
  const [showGrammarHighlights, setShowGrammarHighlights] = useState(true);
  const [expandedGrammarStats, setExpandedGrammarStats] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // ✅ FIX 2: Add missing state for modals if not controlled by parent
  const [localShowStructureGuide, setLocalShowStructureGuide] = useState(false);
  const [localShowTips, setLocalShowTips] = useState(false);
  const [localFocusMode, setLocalFocusMode] = useState(false);

  // Use local state as fallback
  const effectiveShowStructureGuide = showStructureGuide ?? localShowStructureGuide;
  const effectiveShowTips = showTips ?? localShowTips;
  const effectiveFocusMode = focusMode ?? localFocusMode;

  // Tiered support system states - Default to High Support
  const [supportLevel, setSupportLevel] = useState<SupportLevel>('High Support');
  const [showSupportLevelModal, setShowSupportLevelModal] = useState(false);
  const [supportLevelLoading, setSupportLevelLoading] = useState(true);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load user's support level preference
  useEffect(() => {
    const loadSupportLevel = async () => {
      if (!user?.id) {
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
  }, [user?.id]);

  const handleSupportLevelChange = async (newLevel: SupportLevel) => {
    setSupportLevel(newLevel);
    setShowSupportLevelModal(false);
  };

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
  }, [localContent, hasContent, onSubmit]);

  return (
    <div className={`flex flex-col h-screen ${darkMode ? 'bg-slate-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      {/* Prompt Section - Collapsible */}
      {!hidePrompt && effectivePrompt && (
        <div className={`border-b flex-shrink-0 ${darkMode ? 'bg-slate-800 border-gray-700' : 'bg-blue-50 border-blue-200'}`}>
          <div className="px-6 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className={`w-4 h-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              <h3 className={`text-sm font-semibold ${darkMode ? 'text-blue-300' : 'text-blue-900'}`}>
                Writing Prompt
              </h3>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsPromptCollapsed(!isPromptCollapsed)}
                className={`p-1.5 rounded-md transition-colors ${
                  darkMode 
                    ? 'hover:bg-slate-700 text-gray-400 hover:text-gray-200' 
                    : 'hover:bg-blue-100 text-blue-600 hover:text-blue-800'
                }`}
                title={isPromptCollapsed ? "Show prompt" : "Hide prompt"}
              >
                {isPromptCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setHidePrompt(true)}
                className={`p-1.5 rounded-md transition-colors ${
                  darkMode 
                    ? 'hover:bg-slate-700 text-gray-400 hover:text-gray-200' 
                    : 'hover:bg-blue-100 text-blue-600 hover:text-blue-800'
                }`}
                title="Permanently hide prompt"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          {!isPromptCollapsed && (
            <div className="px-6 pb-4">
              <div className={`p-4 rounded-lg border ${
                darkMode
                  ? 'bg-slate-900/50 border-slate-700 text-gray-100'
                  : 'bg-white border-blue-200 text-blue-900'
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{effectivePrompt}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ✅ FIX 1: Toolbar Section with Fixed Button Handlers */}
      <div className={`flex items-center justify-between px-6 py-3 border-b flex-shrink-0 ${darkMode ? 'bg-slate-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center space-x-3">
          {/* Plan Button */}
          <button
            onClick={() => {
              console.log('Plan button clicked');
              setShowPlanningTool(!showPlanningTool);
            }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all shadow-sm ${
              showPlanningTool
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                : darkMode
                ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
            }`}
            title="Planning Tool"
          >
            <PenTool className="w-4 h-4" />
            <span>Plan</span>
          </button>

          {/* Structure Button */}
          <button
            onClick={() => {
              console.log('Structure button clicked');
              if (onToggleStructureGuide) {
                onToggleStructureGuide();
              } else {
                // Fallback: toggle local state if prop not provided
                setLocalShowStructureGuide(!localShowStructureGuide);
              }
            }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all shadow-sm ${
              effectiveShowStructureGuide
                ? 'bg-green-600 text-white hover:bg-green-700 shadow-md'
                : darkMode
                ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
            }`}
            title="Structure Guide"
          >
            <BookOpen className="w-4 h-4" />
            <span>Structure</span>
          </button>

          {/* Tips Button */}
          <button
            onClick={() => {
              console.log('Tips button clicked');
              if (onToggleTips) {
                onToggleTips();
              } else {
                // Fallback: toggle local state if prop not provided
                setLocalShowTips(!localShowTips);
              }
            }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all shadow-sm ${
              effectiveShowTips
                ? 'bg-orange-600 text-white hover:bg-orange-700 shadow-md'
                : darkMode
                ? 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200'
                : 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200'
            }`}
            title="Writing Tips"
          >
            <LightbulbIcon className="w-4 h-4" />
            <span>Tips</span>
          </button>

          {/* Exam Mode Button */}
          <button
            onClick={() => {
              console.log('Exam button clicked');
              setExamMode(!examMode);
            }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all shadow-sm ${
              examMode
                ? 'bg-red-600 text-white hover:bg-red-700 shadow-md'
                : darkMode
                ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
            }`}
            title="Exam Mode"
          >
            <Target className="w-4 h-4" />
            <span>Exam</span>
          </button>

          {/* Focus Mode Button */}
          <button
            onClick={() => {
              console.log('Focus button clicked');
              if (onToggleFocus) {
                onToggleFocus();
              } else {
                // Fallback: toggle local state if prop not provided
                setLocalFocusMode(!localFocusMode);
              }
            }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all shadow-sm ${
              effectiveFocusMode
                ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-md'
                : darkMode
                ? 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
            }`}
            title="Focus Mode"
          >
            {effectiveFocusMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>Focus</span>
          </button>
        </div>
        
        <div className="flex items-center space-x-6">
          {/* Timer */}
          <div className="flex items-center space-x-2">
            <Clock className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            <span className={`text-sm tabular-nums ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {formatTime(elapsedTime)} / 40:00
            </span>
            <button
              onClick={() => isTimerRunning ? (onPauseTimer && onPauseTimer()) : (onStartTimer && onStartTimer())}
              className={`p-1 rounded transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              title={isTimerRunning ? "Pause Timer" : "Start Timer"}
            >
              {isTimerRunning ? (
                <PauseCircle className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              ) : (
                <PlayCircle className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              )}
            </button>
            <button
              onClick={() => onResetTimer && onResetTimer()}
              className={`p-1 rounded transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              title="Reset Timer"
            >
              <RotateCcw className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            </button>
          </div>

          {/* Word Count */}
          <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-md ${
            showWordCountWarning 
              ? 'bg-red-50 text-red-700 border border-red-200' 
              : darkMode 
              ? 'bg-slate-700 text-gray-300' 
              : 'bg-gray-100 text-gray-700'
          }`}>
            <Type className="w-4 h-4" />
            <span className="text-sm font-medium tabular-nums">
              {currentWordCount} / 50
            </span>
            {showWordCountWarning && (
              <AlertCircle className="w-4 h-4" />
            )}
          </div>

          {/* Settings Button */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-md transition-colors ${
              darkMode 
                ? 'hover:bg-slate-700 text-gray-400 hover:text-gray-200' 
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
            }`}
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Writing Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Grammar Stats Panel */}
          {showGrammarHighlights && (
            <div className={`border-b ${darkMode ? 'bg-slate-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="px-6 py-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Zap className={`w-4 h-4 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
                    <h3 className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      Writing Quality
                    </h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      qualityScore >= 80 
                        ? 'bg-green-100 text-green-700' 
                        : qualityScore >= 60 
                        ? 'bg-yellow-100 text-yellow-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {qualityScore}%
                    </span>
                  </div>
                  <button
                    onClick={() => setExpandedGrammarStats(!expandedGrammarStats)}
                    className={`text-xs ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
                  >
                    {expandedGrammarStats ? 'Show Less' : 'Show More'}
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div className={`p-2 rounded-md ${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                    <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Weak Verbs</div>
                    <div className={`text-lg font-semibold ${grammarStats.weakVerbs > 5 ? 'text-red-500' : darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      {grammarStats.weakVerbs}
                    </div>
                  </div>
                  <div className={`p-2 rounded-md ${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                    <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Overused Words</div>
                    <div className={`text-lg font-semibold ${grammarStats.overused > 3 ? 'text-orange-500' : darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      {grammarStats.overused}
                    </div>
                  </div>
                  <div className={`p-2 rounded-md ${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                    <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Passive Voice</div>
                    <div className={`text-lg font-semibold ${grammarStats.passive > 2 ? 'text-yellow-500' : darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      {grammarStats.passive}
                    </div>
                  </div>
                  <div className={`p-2 rounded-md ${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                    <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Weak Adjectives</div>
                    <div className={`text-lg font-semibold ${grammarStats.weakAdjectives > 3 ? 'text-red-500' : darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      {grammarStats.weakAdjectives}
                    </div>
                  </div>
                </div>

                {expandedGrammarStats && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Characters:</span>
                        <span className={`ml-2 font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{writingMetrics.characters}</span>
                      </div>
                      <div>
                        <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Sentences:</span>
                        <span className={`ml-2 font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{writingMetrics.sentences}</span>
                      </div>
                      <div>
                        <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Paragraphs:</span>
                        <span className={`ml-2 font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{writingMetrics.paragraphs}</span>
                      </div>
                      <div>
                        <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Avg Words/Sentence:</span>
                        <span className={`ml-2 font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{writingMetrics.avgWordsPerSentence}</span>
                      </div>
                      <div>
                        <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Reading Time:</span>
                        <span className={`ml-2 font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{writingMetrics.readingTime} min</span>
                      </div>
                      {lastSaved && (
                        <div>
                          <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Last Saved:</span>
                          <span className={`ml-2 font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                            {lastSaved.toLocaleTimeString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Text Editor */}
          <div className="flex-1 overflow-auto">
            <div className="h-full p-6">
              <InlineTextHighlighter
                content={localContent}
                onChange={handleContentChange}
                textType={textType}
                darkMode={darkMode}
                fontFamily={fontFamily}
                fontSize={fontSize}
                lineHeight={lineHeight}
                ref={textareaRef}
              />
            </div>
          </div>

          {/* Bottom Submit Button */}
          <div className={`border-t p-4 flex-shrink-0 ${darkMode ? 'bg-slate-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <NSWSubmitButton
              onClick={handleSubmitForEvaluation}
              disabled={!hasContent || evaluationStatus === "loading"}
              loading={evaluationStatus === "loading"}
              darkMode={darkMode}
            />
          </div>
        </div>

        {/* Coach Panel */}
        {panelVisible && (
        <div className={`w-96 border-l flex-shrink-0 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <EnhancedCoachPanel
          content={localContent}
          textType={textType}
          wordCount={currentWordCount}
          analysis={analysis}
          darkMode={darkMode}
          onClose={() => setPanelVisible && setPanelVisible(false)}
          selectedText={selectedText}
          isFocusMode={effectiveFocusMode}
          supportLevel={supportLevel}
          onSupportLevelChange={() => setShowSupportLevelModal(true)}
        />
        </div>
      )}
      </div>

      {/* ✅ FIX 3: Updated Modal Rendering with Proper State Handling */}
      {showPlanningTool && (
        <PlanningToolModal 
          onClose={() => {
            console.log('Closing Planning Tool');
            setShowPlanningTool(false);
          }} 
          textType={textType} 
        />
      )}

      {effectiveShowStructureGuide && (
        <StructureGuideModal 
          onClose={() => {
            console.log('Closing Structure Guide');
            if (onToggleStructureGuide) {
              onToggleStructureGuide();
            } else {
              setLocalShowStructureGuide(false);
            }
          }} 
          textType={textType} 
        />
      )}

      {effectiveShowTips && (
        <TipsModal 
          onClose={() => {
            console.log('Closing Tips Modal');
            if (onToggleTips) {
              onToggleTips();
            } else {
              setLocalShowTips(false);
            }
          }} 
          textType={textType} 
        />
      )}

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
          }}
        />
      )}

      {showNSWEvaluation && (
        <NSWEvaluationReportGenerator
          essayText={localContent}
          textType={textType}
          onClose={() => setShowNSWEvaluation(false)}
          onReportGenerated={(report) => {
            setNswReport(report);
            setShowReportModal(true);
            setShowNSWEvaluation(false);
            setEvaluationStatus("success");
            
            const detailedFeedback = convertNSWReportToDetailedFeedback(report);
            if (onAnalysisChange) {
              onAnalysisChange(detailedFeedback);
            }
          }}
          darkMode={darkMode}
        />
      )}

      {showPromptOptionsModal && (
        <PromptOptionsModal
          textType={textType}
          onGeneratePrompt={handleGenerateNewPrompt}
          onCustomPrompt={handleCustomPromptInput}
          onClose={() => {
            setShowPromptOptionsModal(false);
            if (onPopupCompleted) onPopupCompleted();
          }}
          darkMode={darkMode}
        />
      )}

      {showSupportLevelModal && (
        <SupportLevelSelector
          currentLevel={supportLevel}
          onSelect={handleSupportLevelChange}
          onClose={() => setShowSupportLevelModal(false)}
          darkMode={darkMode}
        />
      )}
    </div>
  );
}
