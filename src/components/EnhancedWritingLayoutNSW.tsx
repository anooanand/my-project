// src/components/EnhancedWritingLayoutNSW.tsx - MODIFIED VERSION WITH BOTTOM SUBMIT BUTTON

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

  // Prompt starts expanded - will auto-collapse after 5 minutes (handled by timer above)
  // Removed auto-collapse on mount to show prompt initially

  // Calculate word count first (needed by other metrics)
  const currentWordCount = React.useMemo(() => {
    return typeof localContent === 'string' && localContent.trim() ? localContent.trim().split(/\s+/).length : 0;
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
    const text = typeof localContent === 'string' ? localContent.trim() : '';
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
    const sentences = text.split(/[.!?]+/).filter(s => typeof s === 'string' && s.trim().length > 0).length;
    const paragraphs = text.split(/\n\n+/).filter(p => typeof p === 'string' && p.trim().length > 0).length;
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
    const words = typeof localContent === 'string' ? localContent.trim().split(/\s+/).filter(word => word.length > 0) : [];
    const newWordCount = words.length;
    if (newWordCount !== wordCount && onWordCountChange) {
      onWordCountChange(newWordCount);
    }
  }, [localContent, wordCount, onWordCountChange]);

  // Handle prompt generation
  useEffect(() => {
    const fetchPrompt = async () => {
      if (initialPrompt && !generatedPrompt && !customPromptInput && !popupFlowCompleted) {
        // If initialPrompt is provided, use it directly as the generatedPrompt
        setGeneratedPrompt(initialPrompt);
        if (setPrompt) {
          setPrompt(initialPrompt);
        }
      } else if (!initialPrompt && !generatedPrompt && !customPromptInput && !popupFlowCompleted) {
        // Only generate a prompt if no initialPrompt, generatedPrompt, customPrompt, or popup flow is completed
        setShowPromptOptionsModal(true);
      }
    };

    fetchPrompt();
  }, [initialPrompt, generatedPrompt, customPromptInput, popupFlowCompleted, setPrompt]);

  // Handle content changes
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalContent(e.target.value);
  };

  // Handle prompt generation from modal
  const handleGeneratePrompt = async (type: string, custom?: string) => {
    if (custom) {
      setCustomPromptInput(custom);
      setGeneratedPrompt(null);
      if (setPrompt) setPrompt(custom);
    } else {
      const newPrompt = await generatePrompt(promptConfig[type]);
      setGeneratedPrompt(newPrompt);
      setCustomPromptInput(null);
      if (setPrompt) setPrompt(newPrompt);
    }
    setShowPromptOptionsModal(false);
    if (onPopupCompleted) onPopupCompleted();
  };

  // Format time utility
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  // Handle evaluation
  const handleEvaluate = async () => {
    setEvaluationStatus("loading");
    setEvaluationProgress("Starting evaluation...");

    try {
      const generator = new NSWEvaluationReportGenerator();
      const report = await generator.generate(localContent, effectivePrompt, (update) => {
        setEvaluationProgress(update);
      });

      setNswReport(report);
      setShowNSWEvaluation(true);
      setEvaluationStatus("success");
    } catch (error) {
      console.error("Evaluation failed:", error);
      setEvaluationStatus("error");
    }
  };

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
                setShowStructureModal(!showStructureModal);
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all shadow-sm ${
                showStructureModal
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
                setShowTipsModalLocal(!showTipsModalLocal);
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all shadow-sm ${
                showTipsModalLocal
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
                setExamModeLocal(!examModeLocal);
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all shadow-sm ${
                examModeLocal
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
          </div>

          <div className="flex items-center space-x-6">
            {/* Timer */}
            <div className="flex items-center space-x-2">
              <Clock className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <span className={`text-sm tabular-nums font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {formatTime(elapsedTime)}
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
            <div className="flex items-center space-x-2">
              <FileText className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <span className={`text-sm font-bold tabular-nums ${
                currentWordCount >= 400 ? 'text-green-600' :
                currentWordCount >= 250 ? 'text-blue-600' :
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {currentWordCount} {currentWordCount === 1 ? 'word' : 'words'}
              </span>
            </div>

            {/* Pacing Indicator */}
            {currentWordCount > 0 && elapsedTime > 0 && (
              <div className={`text-sm ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                {currentWordCount < (elapsedTime / 60) * 6.25 ? (
                  <span>Behind • Speed up a bit!</span>
                ) : (
                  <span>On track</span>
                )}
              </div>
            )}


            {/* Toggle AI Coach Button */}
            <button
              onClick={() => setPanelVisible && setPanelVisible(!panelVisible)}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                panelVisible
                  ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'
                  : darkMode ? 'text-gray-300 hover:text-gray-100 hover:bg-slate-700 border border-gray-700' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              {panelVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              <span>AI Coach {panelVisible ? 'Off' : 'On'}</span>
            </button>

            {/* Settings Button */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-1.5 rounded-md transition-colors ${
                darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'
              }`}
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
        )}

        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Text Editor */}
          <div className="relative flex-1 flex flex-col p-6 overflow-y-auto" style={{ fontFamily: fontFamily, fontSize: `${fontSize}px`, lineHeight: lineHeight }}>
            {focusMode && (
              <div className={`absolute inset-0 bg-opacity-75 flex items-center justify-center z-10 ${
                darkMode ? 'bg-slate-900' : 'bg-gray-100'
              }`}>
                <span className={`text-xl font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Focus Mode Active</span>
              </div>
            )}
            <textarea
              ref={textareaRef}
              value={localContent}
              onChange={handleContentChange}
              className={`flex-1 w-full resize-none focus:outline-none p-4 rounded-lg leading-relaxed transition-colors duration-300 ${
                darkMode ? 'bg-slate-800 text-gray-100 placeholder-gray-500' : 'bg-white text-gray-900 placeholder-gray-400'
              }`}
              placeholder="Start writing here..."
              disabled={focusMode}
            />
            <div className="flex-shrink-0 pt-4">
              <NSWSubmitButton content={localContent} prompt={effectivePrompt} textType={textType} />
            </div>
          </div>

          {/* AI Coach Panel */}
          {panelVisible && !examModeLocal && (
            <EnhancedCoachPanel
              content={localContent}
              wordCount={currentWordCount}
              grammarStats={grammarStats}
              writingMetrics={writingMetrics}
              qualityScore={qualityScore}
              supportLevel={supportLevel}
              onSupportLevelChange={handleSupportLevelChange}
              lastSaved={lastSaved}
              onFix={handleApplyFix}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      {showPlanningTool && <PlanningToolModal textType={textType} onClose={() => setShowPlanningTool(false)} />}
      {showStructureModal && <StructureGuideModal textType={textType} onClose={() => setShowStructureModal(false)} />}
      {showTipsModalLocal && <TipsModal textType={textType} onClose={() => setShowTipsModalLocal(false)} />}
      {showPromptOptionsModal && (
        <PromptOptionsModal
          onClose={() => setShowPromptOptionsModal(false)}
          onGenerate={handleGeneratePrompt}
          textType={textType}
          openAIConnected={openAIConnected}
          loading={openAILoading}
        />
      )}
      {showNSWEvaluation && nswReport && (
        <ReportModal onClose={() => setShowNSWEvaluation(false)}>
          <AIEvaluationReportDisplay report={nswReport} />
        </ReportModal>
      )}
    </div>
  );
}

// Helper function to apply fixes from the coach panel
function applyFix(content: string, fix: LintFix): string {
  // This is a simplified implementation. A more robust solution would handle
  // overlapping fixes and more complex transformations.
  const lines = content.split('\n');
  if (fix.line > lines.length) return content;

  const line = lines[fix.line - 1];
  const before = line.substring(0, fix.column - 1);
  const after = line.substring(fix.column - 1 + fix.text.length);

  lines[fix.line - 1] = before + fix.fix + after;
  return lines.join('\n');
}
