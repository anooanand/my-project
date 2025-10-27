// src/components/EnhancedWritingLayoutNSW.tsx - FINAL CORRECTED VERSION

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
import { generatePrompt } from '../lib/openai';
import { promptConfig } from '../config/prompts';
import type { DetailedFeedback, LintFix } from '../types/feedback';
import { eventBus } from '../lib/eventBus';
import { detectNewParagraphs } from '../lib/paragraphDetection';
import { NSWEvaluationReportGenerator } from './NSWEvaluationReportGenerator';
import { useTheme } from '../contexts/ThemeContext';
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
  Sparkles,
  Moon,
  Sun
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
  const { theme, toggleTheme } = useTheme();
  const darkMode = theme === 'dark';

  const {
    content,
    onChange,
    textType,
    initialPrompt,
    wordCount,
    onWordCountChange,
    darkMode: darkModeProp = false,
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
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [showPromptOptionsModal, setShowPromptOptionsModal] = useState(false);
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(false);
  const [hidePrompt, setHidePrompt] = useState(false);
  const [isPromptCollapsed, setIsPromptCollapsed] = useState(false);

  // New states for missing functionality
  const [showPlanningTool, setShowPlanningTool] = useState(false);
  const [showStructureModal, setShowStructureModal] = useState(false);
  const [showTipsModalLocal, setShowTipsModalLocal] = useState(false);
  const [examModeLocal, setExamModeLocal] = useState(false);
  const [showGrammarHighlights, setShowGrammarHighlights] = useState(true);
  const [expandedGrammarStats, setExpandedGrammarStats] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);


  const textareaRef = useRef<HTMLTextAreaElement>(null);


  // Auto-hide prompt after 5 minutes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isPromptCollapsed) {
        setIsPromptCollapsed(true);
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearTimeout(timer);
  }, [isPromptCollapsed]);
  
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

  // Auto-fetch AI analysis for Grammar/Vocabulary tabs (debounced)
  useEffect(() => {
    // Only fetch if content is substantial (50+ words)
    const wordCount = localContent.trim().split(/\s+/).filter(w => w.length > 0).length;
    if (wordCount < 50) {
      return;
    }

    // Debounce: wait 3 seconds after user stops typing
    const timeoutId = setTimeout(async () => {
      console.log('🔄 Auto-fetching AI analysis for Writing Mate tabs...');
      try {
        const feedbackResponse = await fetch("/.netlify/functions/ai-feedback", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: localContent,
            textType: textType,
            prompt: effectivePrompt,
          }),
        });
        const feedback = await feedbackResponse.json();
        setAiAnalysis(feedback);
        if (onAnalysisChange) onAnalysisChange(feedback);
      } catch (error) {
        console.error("Error fetching AI feedback:", error);
      }
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [localContent, textType, effectivePrompt, onAnalysisChange]);


  // Handle prompt generation
  const handleGeneratePrompt = useCallback(async (type: string) => {
    setIsLoadingPrompt(true);
    try {
      const newPrompt = await generatePrompt(type);
      setGeneratedPrompt(newPrompt);
      if (setPrompt) setPrompt(newPrompt);
      setShowPromptOptionsModal(false);
      if (onPopupCompleted) onPopupCompleted();
    } catch (error) {
      console.error("Error generating prompt:", error);
      alert("Failed to generate prompt. Please try again.");
    } finally {
      setIsLoadingPrompt(false);
    }
  }, [setPrompt, onPopupCompleted]);

  // Handle custom prompt submission
  const handleCustomPromptSubmit = useCallback(() => {
    if (customPromptInput) {
      setGeneratedPrompt(customPromptInput);
      if (setPrompt) setPrompt(customPromptInput);
      setShowPromptOptionsModal(false);
      if (onPopupCompleted) onPopupCompleted();
    }
  }, [customPromptInput, setPrompt, onPopupCompleted]);

  // Handle NSW Evaluation
  const handleNSWEvaluation = useCallback(async () => {
    setShowNSWEvaluation(true);
    setEvaluationStatus("loading");
    setEvaluationProgress("Starting evaluation...");
    try {
      const generator = new NSWEvaluationReportGenerator(
        localContent,
        textType,
        effectivePrompt,
        user,
        (progress) => setEvaluationProgress(progress)
      );
      const report = await generator.generateReport();
      setNswReport(report);
      setEvaluationStatus("success");
      setShowReportModal(true);
    } catch (error) {
      console.error("NSW Evaluation failed:", error);
      setEvaluationStatus("error");
      setEvaluationProgress("Evaluation failed. Please try again.");
    } finally {
      setShowNSWEvaluation(false);
    }
  }, [localContent, textType, effectivePrompt, user]);

  // Handle Full AI Analysis (for the main panel)
  const handleFullAIAnalysis = useCallback(async () => {
    if (!openAIConnected) {
      alert("OpenAI is not connected. Please check your settings.");
      return;
    }
    if (openAILoading) return;

    try {
      // This is a placeholder for the full analysis call
      // In a real app, this would call a more comprehensive AI function
      // For now, we'll use the existing aiAnalysis state
      if (aiAnalysis) {
        setAiEvaluationReport(aiAnalysis);
        setShowAIReport(true);
      } else {
        alert("Please write some content first to generate a full analysis.");
      }
    } catch (error) {
      console.error("Error running full AI analysis:", error);
      alert("Failed to run full AI analysis.");
    }
  }, [openAIConnected, openAILoading, aiAnalysis]);


  // Helper function to render timer
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Render buttons for the toolbar
  const ToolbarButton = ({ icon: Icon, label, onClick, isActive = false }: { icon: React.ElementType, label: string, onClick: () => void, isActive?: boolean }) => (
    <button
      onClick={onClick}
      className={`flex items-center space-x-1 p-2 rounded-lg text-sm transition-colors ${
        isActive
          ? 'bg-blue-500 text-white hover:bg-blue-600'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );

  // Render grammar stat
  const GrammarStat = ({ label, value, icon: Icon }: { label: string, value: number, icon: React.ElementType }) => (
    <div className="flex items-center space-x-2 text-sm">
      <Icon className="w-4 h-4 text-red-500" />
      <span className="font-semibold">{value}</span>
      <span>{label}</span>
    </div>
  );

  // Render the main component
  return (
    <div className={`flex h-screen overflow-hidden ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Main Writing Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${panelVisible ? 'w-2/3' : 'w-full'}`}>
        {/* Header/Toolbar */}
        <header className={`flex items-center justify-between p-4 border-b ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Type className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-semibold capitalize">{textType}</span>
            </div>
            <ToolbarButton icon={BookOpen} label="Plan" onClick={() => setShowPlanningTool(true)} isActive={showPlanningTool} />
            <ToolbarButton icon={Target} label="Structure" onClick={() => setShowStructureModal(true)} isActive={showStructureModal} />
            <ToolbarButton icon={LightbulbIcon} label="Tips" onClick={() => setShowTipsModalLocal(true)} isActive={showTipsModalLocal} />
            <ToolbarButton icon={FileText} label="Exam" onClick={() => setExamModeLocal(!examModeLocal)} isActive={examModeLocal} />
          </div>

          <div className="flex items-center space-x-4">
            {/* Timer */}
            <div className={`flex items-center space-x-2 p-2 rounded-lg ${examModeLocal ? 'bg-red-500 text-white' : 'text-gray-700 dark:text-gray-300'}`}>
              <Clock className="w-4 h-4" />
              <span className="font-mono">{formatTime(elapsedTime)}</span>
              {examModeLocal && (
                <>
                  <button onClick={isTimerRunning ? onPauseTimer : onStartTimer} title={isTimerRunning ? "Pause Timer" : "Start Timer"}>
                    {isTimerRunning ? <PauseCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                  </button>
                  <button onClick={onResetTimer} title="Reset Timer">
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            {/* Word Count */}
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <span className="font-semibold">{currentWordCount}</span>
              <span>words</span>
            </div>

            {/* Settings and Theme */}
            <button onClick={toggleTheme} title="Toggle Theme" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
              {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
            </button>
            <button onClick={() => setShowSettings(!showSettings)} title="Settings" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
              <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>

            {/* Toggle Coach Panel */}
            {setPanelVisible && (
              <button onClick={() => setPanelVisible(!panelVisible)} title={panelVisible ? "Hide Coach Panel" : "Show Coach Panel"} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                {panelVisible ? <EyeOff className="w-5 h-5 text-gray-600 dark:text-gray-400" /> : <Eye className="w-5 h-5 text-gray-600 dark:text-gray-400" />}
              </button>
            )}
          </div>
        </header>

        {/* Prompt Area */}
        {effectivePrompt && (
          <div className={`p-4 transition-all duration-300 ${darkMode ? 'bg-gray-800' : 'bg-white'} ${isPromptCollapsed ? 'h-12 overflow-hidden' : 'h-auto'}`}>
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                <h3 className="font-semibold text-lg">Prompt: <span className="text-sm font-normal capitalize">{textType}</span></h3>
              </div>
              <button
                onClick={() => setIsPromptCollapsed(!isPromptCollapsed)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-transform"
                title={isPromptCollapsed ? "Expand Prompt" : "Collapse Prompt"}
              >
                {isPromptCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
              </button>
            </div>
            <div className={`mt-2 text-gray-700 dark:text-gray-300 transition-opacity duration-300 ${isPromptCollapsed ? 'opacity-0 h-0' : 'opacity-100 h-auto'}`}>
              <p className="whitespace-pre-wrap">{effectivePrompt}</p>
            </div>
          </div>
        )}

        {/* Writing Editor */}
        <div className="flex-1 overflow-y-auto p-8 relative">
          <div className="max-w-3xl mx-auto">
            <div
              className="relative"
              style={{
                fontFamily: fontFamily,
                fontSize: `${fontSize}px`,
                lineHeight: lineHeight,
              }}
            >
              {/* Textarea for writing */}
              <textarea
                ref={textareaRef}
                value={localContent}
                onChange={(e) => setLocalContent(e.target.value)}
                placeholder="Start writing your amazing story here! Let your creativity flow and bring your ideas to life..."
                className={`w-full resize-none focus:outline-none ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} p-0 border-none`}
                rows={20}
                style={{
                  fontFamily: fontFamily,
                  fontSize: `${fontSize}px`,
                  lineHeight: lineHeight,
                  minHeight: '60vh',
                }}
              />

              {/* Inline Highlighter (if needed) */}
              {/* <InlineTextHighlighter text={localContent} analysis={aiAnalysis} /> */}
            </div>
          </div>
        </div>

        {/* Bottom Bar/Submit */}
        <div className={`flex justify-between items-center p-4 border-t ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
            <span>Last saved: {lastSaved ? lastSaved.toLocaleTimeString() : 'Never'}</span>
            <button
              onClick={() => setExpandedGrammarStats(!expandedGrammarStats)}
              className="flex items-center space-x-1 hover:text-blue-500"
            >
              <AlertCircle className="w-4 h-4" />
              <span>{grammarStats.weakVerbs + grammarStats.overused + grammarStats.passive + grammarStats.weakAdjectives} Potential Issues</span>
              {expandedGrammarStats ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
            </button>
            {expandedGrammarStats && (
              <div className="flex space-x-4 ml-4">
                <GrammarStat label="Weak Verbs" value={grammarStats.weakVerbs} icon={PenTool} />
                <GrammarStat label="Overused Words" value={grammarStats.overused} icon={Zap} />
                <GrammarStat label="Passive Voice" value={grammarStats.passive} icon={Info} />
                <GrammarStat label="Weak Adjectives" value={grammarStats.weakAdjectives} icon={LightbulbIcon} />
              </div>
            )}
          </div>
          <NSWSubmitButton
            onClick={handleNSWEvaluation}
            isLoading={evaluationStatus === "loading"}
            progress={evaluationProgress}
          />
        </div>
      </div>

      {/* Right Panel (Coach) */}
      {panelVisible && (
        <div className={`w-1/3 border-l ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} flex-shrink-0`}>
          <EnhancedCoachPanel
            content={localContent}
            textType={textType}
            prompt={effectivePrompt}
            analysis={aiAnalysis}
            wordCount={currentWordCount}
            writingMetrics={writingMetrics}
            grammarStats={grammarStats}
            qualityScore={qualityScore}
            user={user}
            darkMode={darkMode}
            openAIConnected={openAIConnected}
            openAILoading={openAILoading}
            onAnalysisUpdate={(newAnalysis) => onAnalysisChange && onAnalysisChange(newAnalysis)}
            onApplyFix={(fix: LintFix) => {
              // Implement fix application logic here
            }}
            selectedText={selectedText}
            isFocusMode={false}
          />
        </div>
      )}

      {/* Modals */}
      <PromptOptionsModal
        isOpen={showPromptOptionsModal}
        onClose={() => setShowPromptOptionsModal(false)}
        textType={textType}
        onGeneratePrompt={handleGeneratePrompt}
        onCustomPromptSubmit={handleCustomPromptSubmit}
        onSkip={() => {
          setShowPromptOptionsModal(false);
          if (onPopupCompleted) onPopupCompleted();
        }}
        isLoading={isLoadingPrompt}
        customPromptInput={customPromptInput}
        setCustomPromptInput={setCustomPromptInput}
      />
      <PlanningToolModal
        isOpen={showPlanningTool}
        onClose={() => setShowPlanningTool(false)}
        textType={textType}
        onSavePlan={(plan) => {
          console.log('Plan saved:', plan);
          setShowPlanningTool(false);
        }}
      />
      <StructureGuideModal
        isOpen={showStructureModal}
        onClose={() => setShowStructureModal(false)}
        textType={textType} // THIS IS THE CRITICAL LINE
      />
      <TipsModal
        isOpen={showTipsModalLocal}
        onClose={() => setShowTipsModalLocal(false)}
        textType={textType}
      />
      {showAIReport && aiEvaluationReport && (
        <AIEvaluationReportDisplay
          report={aiEvaluationReport}
          essayText={localContent}
          textType={textType} // Pass the writing type
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
      {/* Settings Modal (Placeholder) */}
      {showSettings && (
        <div className="fixed inset-0 bg-gray-600 dark:bg-gray-900 bg-opacity-50 dark:bg-opacity-80 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border border-gray-200 dark:border-gray-700 w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="flex justify-between items-center pb-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Settings (WIP)</h3>
              <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none font-semibold">&times;</button>
            </div>
            <div className="mt-2 text-gray-600 dark:text-gray-300">
              <p>Font Family: {fontFamily}</p>
              <p>Font Size: {fontSize}px</p>
              <p>Line Height: {lineHeight}</p>
              <p>More settings coming soon...</p>
            </div>
            <div className="items-center px-4 py-3">
              <button
                className="px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
                onClick={() => setShowSettings(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
