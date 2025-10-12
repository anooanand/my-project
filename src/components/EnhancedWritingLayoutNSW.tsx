
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
import { NSWEvaluationReportGenerator } from './NSWEvaluationReportGenerator';
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
  openAILoaded?: boolean;
  panelVisible?: boolean;
  setPanelVisible?: (visible: boolean) => void;
}

export function EnhancedWritingLayoutNSW(props: EnhancedWritingLayoutNSWProps) {
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
    openAILoaded,
    panelVisible = true,
    setPanelVisible,
    setPrompt,
  } = props;

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
  const [showPlanningTool, setShowPlanningTool] = useState(false);
  const [examMode, setExamMode] = useState(false);
  const [showGrammarHighlights, setShowGrammarHighlights] = useState(true);
  const [expandedGrammarStats, setExpandedGrammarStats] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (content !== undefined) {
      setLocalContent(content);
    }
  }, [content]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localContent !== content && onChange) {
        onChange(localContent);
        setLastSaved(new Date());
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [localContent, content, onChange]);

  const currentWordCount = React.useMemo(() => {
    return localContent.trim() ? localContent.trim().split(/\s+/).length : 0;
  }, [localContent]);

  const grammarStats = React.useMemo(() => {
    const text = localContent;
    if (!text) return { weakVerbs: 0, overused: 0, passive: 0, weakAdjectives: 0 };

    const weakVerbs = (text.match(/\b(is|are|was|were|be|been|being)\b/gi) || []).length;
    const overused = (text.match(/\b(very|really|just|actually|basically|literally)\b/gi) || []).length;
    const passive = (text.match(/\b(was|were|been)\s+\w+ed\b/gi) || []).length;
    const weakAdjectives = (text.match(/\b(good|bad|nice|big|small)\b/gi) || []).length;

    return { weakVerbs, overused, passive, weakAdjectives };
  }, [localContent]);

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
    const readingTime = Math.ceil(currentWordCount / 200);
    const avgWordsPerSentence = sentences > 0 ? Math.round(currentWordCount / sentences) : 0;

    return { characters, charactersNoSpaces, sentences, paragraphs, readingTime, avgWordsPerSentence };
  }, [localContent, currentWordCount]);

  const qualityScore = React.useMemo(() => {
    if (currentWordCount === 0) return 0;

    let score = 100;

    score -= grammarStats.weakVerbs * 2;
    score -= grammarStats.overused * 3;
    score -= grammarStats.passive * 2;
    score -= grammarStats.weakAdjectives * 2;

    if (currentWordCount < 50) score -= 10;
    if (currentWordCount > 50) score -= 15;

    if (writingMetrics.avgWordsPerSentence < 8) score -= 5;
    if (writingMetrics.avgWordsPerSentence > 25) score -= 5;

    return Math.max(0, Math.min(100, score));
  }, [currentWordCount, grammarStats, writingMetrics]);

  const effectivePrompt = generatedPrompt || customPromptInput || initialPrompt;

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

  const hasContent = localContent.trim().length > 0;
  const showWordCountWarning = currentWordCount > 50;

  const handleSubmitForEvaluation = useCallback(async () => {
    if (!localContent.trim()) {
      alert("Please write something before submitting for evaluation.");
      return;
    }

    if (onSubmit) {
      onSubmit(localContent);
    }

    setEvaluationStatus("loading");
    setShowNSWEvaluation(true);
    setEvaluationProgress("Analyzing your writing with AI...");

    try {
      setTimeout(() => setEvaluationProgress("Checking grammar and structure..."), 1000);
      setTimeout(() => setEvaluationProgress("Evaluating content and ideas..."), 2000);
      setTimeout(() => setEvaluationProgress("Generating detailed feedback..."), 3000);

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

      setAiEvaluationReport(aiReport);
      setShowNSWEvaluation(false);
      setShowAIReport(true);
      setEvaluationStatus("success");

    } catch (error) {
      console.error("❌ NSW AI evaluation error:", error);
      setEvaluationStatus("error");
      setShowNSWEvaluation(false);
      alert(`There was an error during evaluation: ${error instanceof Error ? error.message : String(error)}. Please try again.`);
    }
  }, [localContent, onSubmit, textType, effectivePrompt]);

  const handleTogglePlanningTool = useCallback(() => {
    setShowPlanningTool(prev => !prev);
  }, []);

  const handleToggleExamMode = useCallback(() => {
    setExamMode(prev => !prev);
  }, []);

  return (
    <div className={`flex h-screen w-full ${darkMode ? 'bg-slate-900 text-gray-100' : 'bg-gray-100 text-gray-900'}`}>
      <div className="flex flex-col flex-1">
        {/* Prompt Section */}
        <div className={`flex-shrink-0 p-4 border-b ${darkMode ? 'bg-slate-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Info className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Your Writing Prompt</h3>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800'}`}>{textType}</span>
            </div>
            <button
              onClick={() => setHidePrompt(prev => !prev)}
              className={`text-sm font-medium ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'}`}
            >
              {hidePrompt ? 'Show Prompt' : 'Hide Prompt'}
            </button>
          </div>
          {!hidePrompt && (
            <div className={`p-3 rounded-lg ${darkMode ? 'bg-slate-700 text-gray-200' : 'bg-gray-50 text-gray-800'}`}>
              <p className="text-sm font-medium mb-2">Prompt: {effectivePrompt.split(':')[0]}</p>
              <p className="text-sm">{effectivePrompt.split(':').slice(1).join(':').trim()}</p>
            </div>
          )}
        </div>

        {/* Action Buttons Section */}
        <div className={`flex items-center px-4 py-2 border-b ${darkMode ? 'bg-slate-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleTogglePlanningTool}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-full transition-colors ${
                showPlanningTool
                  ? 'bg-blue-500 text-white' : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <PenTool className="w-4 h-4" />
              <span className="text-sm font-medium">Planning</span>
            </button>
            <button
              onClick={onToggleStructureGuide}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-full transition-colors ${
                showStructureGuide
                  ? 'bg-green-500 text-white' : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span className="text-sm font-medium">Structure</span>
            </button>
            <button
              onClick={onToggleTips}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-full transition-colors ${
                showTips
                  ? 'bg-orange-500 text-white' : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <LightbulbIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Tips</span>
            </button>
            <button
              onClick={onToggleFocus}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-full transition-colors ${
                focusMode
                  ? 'bg-purple-500 text-white' : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Target className="w-4 h-4" />
              <span className="text-sm font-medium">Focus</span>
            </button>
          </div>
        </div>

        {/* Timer and Word Count Section */}
        <div className={`flex items-center justify-between px-4 py-2 border-b ${darkMode ? 'bg-slate-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center space-x-4">
            <Clock className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
            <span className={`text-base font-mono ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {formatTime(elapsedTime)}
            </span>
            <button
              onClick={isTimerRunning ? onPauseTimer : onStartTimer}
              className={`p-1 rounded-full transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
              title={isTimerRunning ? "Pause Timer" : "Start Timer"}
            >
              {isTimerRunning ? (
                <PauseCircle className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              ) : (
                <PlayCircle className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              )}
            </button>
            <button
              onClick={onResetTimer}
              className={`p-1 rounded-full transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
              title="Reset Timer"
            >
              <RotateCcw className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <FileText className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
            <span className={`text-base font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {currentWordCount} words
            </span>
            <div className="w-32 bg-gray-200 rounded-full h-2 dark:bg-gray-700">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${Math.min((currentWordCount / 400) * 100, 100)}%` }}
              ></div>
            </div>
            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Progress to 400 words</span>
            {currentWordCount < 400 && (
              <span className="text-orange-500 text-sm font-semibold">Behind · Speed up a bit!</span>
            )}
            {currentWordCount >= 400 && (
              <span className="text-green-500 text-sm font-semibold">✓ Target reached</span>
            )}
          </div>
        </div>

        {/* Main Writing Area */}
        <div className="flex-1 flex flex-col relative">
          <textarea
            ref={textareaRef}
            value={localContent}
            onChange={(e) => handleContentChange(e.target.value)}
            className={`w-full flex-1 resize-none p-6 text-base leading-relaxed focus:outline-none ${
              darkMode
                ? 'bg-slate-900 text-gray-100 placeholder-gray-500' : 'bg-white text-gray-800 placeholder-gray-400'
            }`}
            style={{ fontFamily, fontSize: `${fontSize}px`, lineHeight }}
            placeholder="Start writing your amazing story here! Let your creativity flow and bring your ideas to life..."
          />

          {/* Submit for Evaluation Button - Always visible at the bottom */}
          <div className={`flex-shrink-0 p-4 ${darkMode ? 'bg-slate-900' : 'bg-white'} border-t border-gray-200 dark:border-slate-700`}>
            <NSWStandaloneSubmitSystem
              content={localContent}
              onSubmit={handleSubmitForEvaluation}
              wordCount={currentWordCount}
              isSubmitting={evaluationStatus === 'loading'}
            />
          </div>
        </div>
      </div>

      {/* AI Coach Panel */}
      {panelVisible && (
        <div className={`w-[380px] h-full flex-shrink-0 bg-white dark:bg-slate-800 shadow-2xl z-10 ${darkMode ? 'border-l border-slate-700' : ''}`}>
          <EnhancedCoachPanel
            textType={textType}
            content={localContent}
            wordCount={currentWordCount}
            user={user}
            darkMode={darkMode}
            openAIConnected={openAIConnected}
            openAILoaded={openAILoaded}
            onAnalysisUpdate={(newAnalysis) => onAnalysisChange && onAnalysisChange(newAnalysis)}
            onApplyFix={(fix: LintFix) => {
              // Implement fix application logic here
            }}
            selectedText={selectedText}
            isFocusMode={focusMode}
          />
        </div>
      )}

      {/* Modals */}
      <StructureGuideModal
        isOpen={showStructureGuide}
        onClose={onToggleStructureGuide}
        textType={textType}
        darkMode={darkMode}
      />
      <TipsModal isOpen={showTips} onClose={onToggleTips} darkMode={darkMode} />
      <PlanningToolModal isOpen={showPlanningTool} onClose={handleTogglePlanningTool} darkMode={darkMode} />

      {showAIReport && aiEvaluationReport && (
        <AIEvaluationReportDisplay
          report={aiEvaluationReport}
          onClose={() => setShowAIReport(false)}
          darkMode={darkMode}
        />
      )}

      {showNSWEvaluation && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-2xl text-center max-w-md">
            <h3 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Evaluating Your Writing...
            </h3>
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className={`mt-4 text-base ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {evaluationProgress}
            </p>
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