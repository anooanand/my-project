import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PlanningToolModal } from './PlanningToolModal';
import { StructureGuideModal } from './StructureGuideModal';
import { TipsModal } from './TipsModal';
import { EnhancedCoachPanel } from './EnhancedCoachPanel';
import { NSWStandaloneSubmitSystem } from './NSWStandaloneSubmitSystem';
import { ReportModal } from './ReportModal';
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
  onToggleStructureGuide?: (show: boolean) => void;
  showTips?: boolean;
  onToggleTips?: (show: boolean) => void;
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
    showStructureGuide: propShowStructureGuide = false,
    onToggleStructureGuide,
    showTips: propShowTips = false,
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
  const [evaluationStatus, setEvaluationStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [evaluationProgress, setEvaluationProgress] = useState("");
  const [showPromptOptionsModal, setShowPromptOptionsModal] = useState(false);
  const [hidePrompt, setHidePrompt] = useState(false);
  const [isPromptCollapsed, setIsPromptCollapsed] = useState(false);
  
  // New states for missing functionality
  const [showPlanningTool, setShowPlanningTool] = useState(false);
  const [localShowStructureGuide, setLocalShowStructureGuide] = useState(propShowStructureGuide);
  const [localShowTips, setLocalShowTips] = useState(propShowTips);
  const [examMode, setExamMode] = useState(false);
  const [showGrammarHighlights, setShowGrammarHighlights] = useState(true);
  const [expandedGrammarStats, setExpandedGrammarStats] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasStartedTyping, setHasStartedTyping] = useState(false); // **FIX 1**: Track typing for timer

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync props with local state for controlled toggling
  useEffect(() => {
    setLocalShowStructureGuide(propShowStructureGuide);
  }, [propShowStructureGuide]);

  useEffect(() => {
    setLocalShowTips(propShowTips);
  }, [propShowTips]);

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
    if (currentWordCount < 200) score -= 10;
    if (currentWordCount > 300) score -= 15;

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
    
    // **FIX 1**: Improved timer auto-start logic
    if (newContent.trim().length > 0 && !hasStartedTyping) {
      setHasStartedTyping(true);
      if (!isTimerRunning && onStartTimer) {
        onStartTimer();
      }
    }
    
    if (eventBus && detectNewParagraphs) {
      const newParagraphs = detectNewParagraphs(content, newContent);
      if (newParagraphs.length > 0) {
        eventBus.emit('newParagraphsDetected', { paragraphs: newParagraphs, textType });
      }
    }
  }, [content, isTimerRunning, onStartTimer, textType, hasStartedTyping]);

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
  const showWordCountWarning = currentWordCount > 300;

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
    setEvaluationProgress("Analyzing your writing...");

    try {
      setTimeout(() => setEvaluationProgress("Checking grammar and structure..."), 1000);
      setTimeout(() => setEvaluationProgress("Evaluating content and ideas..."), 2000);
      setTimeout(() => setEvaluationProgress("Generating detailed feedback..."), 3000);

      console.log('Calling NSWEvaluationReportGenerator.generateReport...');
      const report = NSWEvaluationReportGenerator.generateReport({
        essayContent: localContent,
        textType: textType,
        prompt: effectivePrompt || '',
        wordCount: currentWordCount,
        targetWordCountMin: 200,
        targetWordCountMax: 300,
      });
      
      console.log('Report generated:', report);
      
      const convertedReport = convertNSWReportToDetailedFeedback(report);
      console.log('Converted report:', convertedReport);
      
      setNswReport(convertedReport);
      setShowNSWEvaluation(false);
      setShowReportModal(true);
      setEvaluationStatus("success");
      
      console.log('✅ Evaluation complete!');
    } catch (error) {
      console.error("❌ NSW evaluation error:", error);
      setEvaluationStatus("error");
      setShowNSWEvaluation(false);
      alert(`There was an error evaluating your writing: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    }
  }, [localContent, textType, effectivePrompt, currentWordCount, onSubmit, hasContent]);

  const handleApplyFix = useCallback((fix: LintFix) => {
    try {
      const { range, text } = fix;
      const newContent = localContent.substring(0, range[0]) + text + localContent.substring(range[1]);
      setLocalContent(newContent);
      if (onChange) {
        onChange(newContent);
      }
    } catch (error) {
      console.error('Error applying fix:', error);
    }
  }, [localContent, onChange]);

  const handleTogglePlanningTool = useCallback(() => {
    setShowPlanningTool(!showPlanningTool);
  }, [showPlanningTool]);

  const handleToggleStructureGuide = useCallback(() => {
    const newValue = !localShowStructureGuide;
    setLocalShowStructureGuide(newValue);
    if (onToggleStructureGuide) {
      onToggleStructureGuide(newValue);
    }
  }, [localShowStructureGuide, onToggleStructureGuide]);

  const handleToggleTips = useCallback(() => {
    const newValue = !localShowTips;
    setLocalShowTips(newValue);
    if (onToggleTips) {
      onToggleTips(newValue);
    }
  }, [localShowTips, onToggleTips]);

  return (
    <div className={`flex flex-col h-screen ${darkMode ? 'bg-slate-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className={`flex-shrink-0 border-b ${darkMode ? 'bg-slate-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        {/* Prompt Section */}
        {effectivePrompt && !hidePrompt && (
          <div className={`p-4 border-b ${darkMode ? 'bg-slate-800 border-gray-700' : 'bg-blue-50 border-blue-200'}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <Info className={`w-4 h-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  <span className={`text-sm font-medium ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    Prompt: {textType}
                  </span>
                  <button
                    onClick={() => setIsPromptCollapsed(!isPromptCollapsed)}
                    className={`p-1 rounded transition-colors ${
                      darkMode ? 'hover:bg-gray-700' : 'hover:bg-blue-100'
                    }`}
                    title={isPromptCollapsed ? "Expand Prompt" : "Collapse Prompt"}
                  >
                    {isPromptCollapsed ? (
                      <ChevronDown className={`w-4 h-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                    ) : (
                      <ChevronUp className={`w-4 h-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                    )}
                  </button>
                </div>
                {!isPromptCollapsed && (
                  <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {effectivePrompt}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => setShowPromptOptionsModal(true)}
                  className={`px-3 py-1.5 rounded-md transition-colors text-sm font-medium ${
                    darkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  title="Change Prompt"
                >
                  Change
                </button>
                <button
                  onClick={() => setHidePrompt(true)}
                  className={`p-1.5 rounded-md transition-colors ${
                    darkMode
                      ? 'text-gray-400 hover:bg-gray-700'
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                  title="Hide Prompt"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {/* **FIX 3**: Improved button styling - only changed padding and text size */}
              {/* Plan Button */}
              <button
                onClick={handleTogglePlanningTool}
                className={`flex items-center space-x-1 px-3 py-2 rounded transition-colors ${
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
                <span className="text-sm font-medium">Plan</span>
              </button>

              {/* Structure Button */}
              <button
                onClick={handleToggleStructureGuide}
                className={`flex items-center space-x-1 px-3 py-2 rounded transition-colors ${
                  localShowStructureGuide
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
                <span className="text-sm font-medium">Structure</span>
              </button>

              {/* Tips Button */}
              <button
                onClick={handleToggleTips}
                className={`flex items-center space-x-1 px-3 py-2 rounded transition-colors ${
                  localShowTips
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
                <span className="text-sm font-medium">Tips</span>
              </button>

              {/* Exam Mode Button */}
              <button
                onClick={() => setExamMode(!examMode)}
                className={`flex items-center space-x-1 px-3 py-2 rounded transition-colors ${
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
                <span className="text-sm font-medium">Exam</span>
              </button>

              {/* Focus Mode Button */}
              <button
                onClick={onToggleFocus}
                className={`flex items-center space-x-1 px-3 py-2 rounded transition-colors ${
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
                <span className="text-sm font-medium">Focus</span>
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
                      currentWordCount >= 200 && currentWordCount <= 300
                        ? 'text-green-500'
                        : currentWordCount > 300
                        ? 'text-red-500'
                        : darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {currentWordCount} / 300 words
                    </span>
                    {currentWordCount >= 200 && currentWordCount <= 300 && (
                      <span className="text-xs text-green-500">✓ Target reached</span>
                    )}
                  </div>
                  <div className="w-32 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-1">
                    <div
                      className={`h-full transition-all duration-300 ${
                        currentWordCount >= 200 && currentWordCount <= 300
                          ? 'bg-green-500'
                          : currentWordCount > 300
                          ? 'bg-red-500'
                          : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min((currentWordCount / 300) * 100, 100)}%` }}
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
                          <span>Saved {new Date().getTime() - lastSaved.getTime() < 2000 ? 'just now' : 'recently'}</span>
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
      </div>

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
            placeholder="Start writing here..."
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
                  <span className="text-xl">
                    {qualityScore >= 90 ? '🌟' :
                     qualityScore >= 70 ? '👍' :
                     qualityScore >= 50 ? '🤔' :
                     '🔥'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* **FIX 2**: Grammar Stats repositioned to bottom-left to avoid blocking text */}
          {showGrammarHighlights && currentWordCount > 0 && (
            <div className={`absolute bottom-4 left-4 px-3 py-2 rounded-lg shadow-lg border backdrop-blur-sm ${
              darkMode ? 'bg-slate-800/90 border-slate-700' : 'bg-white/90 border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <h4 className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Grammar Stats
                </h4>
                <button onClick={() => setExpandedGrammarStats(!expandedGrammarStats)}>
                  {expandedGrammarStats ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
              {expandedGrammarStats && (
                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <span className={`${darkMode ? 'text-red-400' : 'text-red-600'}`}>Weak Verbs: {grammarStats.weakVerbs}</span>
                  <span className={`${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>Overused: {grammarStats.overused}</span>
                  <span className={`${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>Passive Voice: {grammarStats.passive}</span>
                  <span className={`${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>Weak Adjectives: {grammarStats.weakAdjectives}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Bar with Submit Button */}
      <div className={`flex-shrink-0 border-t p-2 ${darkMode ? 'bg-slate-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex justify-end">
          <button
            onClick={handleSubmitForEvaluation}
            disabled={!hasContent || evaluationStatus === 'loading'}
            className={`px-6 py-3 rounded-lg font-semibold text-white transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none ${
              evaluationStatus === 'loading'
                ? 'bg-gray-500'
                : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
            }`}
          >
            {evaluationStatus === 'loading' ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Evaluating...</span>
              </div>
            ) : (
              'Submit for Evaluation'
            )}
          </button>
        </div>
      </div>

      {/* Modals */}
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

      {showPlanningTool && (
        <PlanningToolModal
          isOpen={showPlanningTool}
          onClose={() => setShowPlanningTool(false)}
          textType={textType}
          darkMode={darkMode}
        />
      )}

      {localShowStructureGuide && (
        <StructureGuideModal
          isOpen={localShowStructureGuide}
          onClose={() => handleToggleStructureGuide()}
          textType={textType}
          darkMode={darkMode}
        />
      )}

      {localShowTips && (
        <TipsModal
          isOpen={localShowTips}
          onClose={() => handleToggleTips()}
          textType={textType}
          darkMode={darkMode}
        />
      )}

      {showReportModal && nswReport && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          report={nswReport}
          darkMode={darkMode}
          onApplyFix={handleApplyFix}
        />
      )}

      {showNSWEvaluation && (
        <NSWStandaloneSubmitSystem
          onSubmitForEvaluation={handleSubmitForEvaluation}
          evaluationStatus={evaluationStatus}
          evaluationProgress={evaluationProgress}
          darkMode={darkMode}
        />
      )}

      {panelVisible && (
        <EnhancedCoachPanel
          content={localContent}
          textType={textType}
          analysis={analysis}
          onAnalysisChange={onAnalysisChange}
          darkMode={darkMode}
          assistanceLevel={assistanceLevel}
          onAssistanceLevelChange={onAssistanceLevelChange}
          selectedText={selectedText}
          user={user}
          openAIConnected={openAIConnected}
          openAILoading={openAILoading}
          onClose={() => setPanelVisible && setPanelVisible(false)}
        />
      )}
    </div>
  );
}