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
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(false);
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
  const [isWritingBuddyHidden, setIsWritingBuddyHidden] = useState(false);
  const [isWordCountHidden, setIsWordCountHidden] = useState(false);
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
    if (newWordCount !== wordCount) {
      onWordCountChange(newWordCount);
    }
  }, [localContent, wordCount, onWordCountChange]);

  // Paragraph detection logic
  useEffect(() => {
    const cleanup = detectNewParagraphs(localContent, (paragraph) => {
      console.log('New paragraph detected:', paragraph);
      eventBus.publish('newParagraph', paragraph);
    });
    return cleanup;
  }, [localContent]);

  // Event bus subscription for applying fixes
  useEffect(() => {
    const applyFix = (fix: LintFix) => {
      const { startIndex, endIndex, replacement } = fix;
      setLocalContent(current => current.substring(0, startIndex) + replacement + current.substring(endIndex));
    };
    eventBus.subscribe('applyFix', applyFix);
    return () => eventBus.unsubscribe('applyFix', applyFix);
  }, []);

  // Handlers
  const handlePromptGeneration = async () => {
    setIsLoadingPrompt(true);
    try {
      const newPrompt = await generatePrompt(promptConfig.narrative.enhanced, { text_type: 'Narrative' });
      setGeneratedPrompt(newPrompt);
      setShowPromptOptionsModal(false);
      if (setPrompt) {
        setPrompt(newPrompt);
      }
    } catch (error) {
      console.error('Error generating prompt:', error);
    } finally {
      setIsLoadingPrompt(false);
    }
  };

  const handleCustomPromptSelection = () => {
    setGeneratedPrompt(null);
    setCustomPromptInput('');
    setShowPromptOptionsModal(false);
  };

  const handleUseCustomPrompt = () => {
    if (customPromptInput && setPrompt) {
      setPrompt(customPromptInput);
    }
    setCustomPromptInput(null);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalContent(e.target.value);
  };

  const handleNSWSubmit = async () => {
    if (onSubmit) {
      onSubmit(localContent);
    }
    setEvaluationStatus('loading');
    setEvaluationProgress("Starting evaluation...");
    try {
      const generator = new NSWEvaluationReportGenerator();
      const report = await generator.generateReport(localContent, effectivePrompt, (progress) => {
        setEvaluationProgress(progress);
      });
      setNswReport(report);
      setShowNSWEvaluation(true);
      setEvaluationStatus('success');
    } catch (error) {
      console.error("Error generating NSW evaluation report:", error);
      setEvaluationStatus('error');
    }
  };

  const handleOpenReport = () => {
    if (nswReport) {
      setShowReportModal(true);
    }
  };

  const handleGenerateAIReport = async () => {
    setShowAIReport(true);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleBuddy = () => {
    if (setPanelVisible) {
      setPanelVisible(!panelVisible);
    }
  };

  const renderWordCount = () => {
    if (isWordCountHidden) return null;
    return (
      <div className="flex items-center space-x-2">
        <FileText className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
        <span className={`text-sm tabular-nums font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          {currentWordCount} words
        </span>
      </div>
    );
  };

  const renderWritingBuddy = () => {
    if (isWritingBuddyHidden) return null;
    return (
      <EnhancedCoachPanel
        panelVisible={panelVisible}
        setPanelVisible={setPanelVisible}
        supportLevel={supportLevel}
        onSupportLevelChange={handleSupportLevelChange}
        supportLevelLoading={supportLevelLoading}
        user={user}
        openAIConnected={openAIConnected}
        openAILoading={openAILoading}
        currentText={localContent}
        onTextTypeChange={onTextTypeChange}
        textType={textType}
        onPopupCompleted={onPopupCompleted}
        popupFlowCompleted={popupFlowCompleted}
        isExamMode={examModeLocal}
      />
    );
  };


  // Main component render
  return (
    <div className={`enhanced-writing-layout-nsw ${darkMode ? 'dark' : ''} font-${fontFamily}`}>
      <div className="layout-container">
        <div className="writing-area">
          {/* Prompt Section */}
          {!hidePrompt && (
            <div className={`prompt-container ${isPromptCollapsed ? 'collapsed' : ''} ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="prompt-header" onClick={() => setIsPromptCollapsed(!isPromptCollapsed)}>
                <div className="prompt-title-container">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  <h2 className={`prompt-title ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Prompt</h2>
                  <span className={`prompt-type-badge ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>{textType}</span>
                </div>
                <div className="prompt-actions">
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setHidePrompt(true); 
                    }} 
                    className={`hide-prompt-button ${darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'}`}
                  >
                    Hide Prompt
                  </button>
                  <ChevronUp className={`w-5 h-5 transition-transform ${isPromptCollapsed ? 'transform rotate-180' : ''} ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                </div>
              </div>
              {!isPromptCollapsed && (
                <div className="prompt-content">
                  <p className={`text-base ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{effectivePrompt}</p>
                  <div className="prompt-buttons-container">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowPromptOptionsModal(true); }}
                      className={`regenerate-prompt-button ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'}`}
                      disabled={isLoadingPrompt}
                    >
                      {isLoadingPrompt ? 'Generating...' : 'New Prompt'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Main Content Area Below Prompt */}
          <div className="writing-main-content">
            {/* Toolbar */}
            <div className={`writing-toolbar ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
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
                    setIsWritingBuddyHidden(!isWritingBuddyHidden);
                    setIsWordCountHidden(!isWordCountHidden);
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
                {renderWordCount()}

                {/* Hide Buddy Button */}
                <button 
                  onClick={handleToggleBuddy}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  title={panelVisible ? "Hide Writing Buddy" : "Show Writing Buddy"}
                >
                  {panelVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  <span>{panelVisible ? 'Hide Buddy' : 'Show Buddy'}</span>
                </button>

                {/* Settings Button */}
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className={`p-2 rounded-full transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                  title="Settings"
                >
                  <Settings className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                </button>
              </div>
            </div>

            {/* Text Area */}
            <div className="text-editor-container">
              <InlineTextHighlighter
                text={localContent}
                setText={setLocalContent}
                getHighlights={() => []} // Placeholder
              />
            </div>

            {/* Bottom Submit Bar */}
            <div className={`bottom-submit-bar ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="writing-stats-container">
                {/* Expanded Grammar Stats */}
                <div className="grammar-stats-toggle" onClick={() => setExpandedGrammarStats(!expandedGrammarStats)}>
                  <span className="font-semibold">Writing Quality:</span>
                  <span className={`quality-score ${qualityScore > 80 ? 'text-green-500' : qualityScore > 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                    {qualityScore} / 100
                  </span>
                  {expandedGrammarStats ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
                {expandedGrammarStats && (
                  <div className="expanded-stats">
                    <p>Weak Verbs: {grammarStats.weakVerbs}</p>
                    <p>Overused Words: {grammarStats.overused}</p>
                    <p>Passive Voice: {grammarStats.passive}</p>
                    <p>Weak Adjectives: {grammarStats.weakAdjectives}</p>
                    <p>Avg Words/Sentence: {writingMetrics.avgWordsPerSentence}</p>
                  </div>
                )}
              </div>
              <NSWSubmitButton 
                onClick={handleNSWSubmit} 
                loading={evaluationStatus === 'loading'}
                disabled={evaluationStatus === 'loading'}
              />
            </div>
          </div>
        </div>

        {/* Right-side Coach Panel */}
        <div className={`coach-panel-container ${!panelVisible ? 'hidden' : ''}`}>
          {renderWritingBuddy()}
        </div>
      </div>

      {/* Modals */}
      <PlanningToolModal
        isOpen={showPlanningTool}
        onClose={() => setShowPlanningTool(false)}
        textType={textType}
        darkMode={darkMode}
      />
      <StructureGuideModal
        isOpen={showStructureModal}
        onClose={() => setShowStructureModal(false)}
        textType={textType}
        darkMode={darkMode}
      />
      <TipsModal
        isOpen={showTipsModalLocal}
        onClose={() => setShowTipsModalLocal(false)}
        textType={textType}
        darkMode={darkMode}
      />
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        report={nswReport}
        darkMode={darkMode}
      />
      <AIEvaluationReportDisplay
        isOpen={showAIReport}
        onClose={() => setShowAIReport(false)}
        content={localContent}
        prompt={effectivePrompt}
        textType={textType}
        user={user}
        openAIConnected={openAIConnected}
        darkMode={darkMode}
      />
      <PromptOptionsModal
        isOpen={showPromptOptionsModal}
        onClose={() => setShowPromptOptionsModal(false)}
        onGenerate={handlePromptGeneration}
        onCustom={handleCustomPromptSelection}
        isLoading={isLoadingPrompt}
        darkMode={darkMode}
      />
    </div>
  );
}





