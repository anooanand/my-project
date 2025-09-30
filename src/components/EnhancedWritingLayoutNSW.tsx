// CORRECT: EnhancedWritingLayoutNSW Component (Fixed Loading and Prompt Display)
// This is the correct component code without circular imports

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StructureGuideModal } from './StructureGuideModal';
import { TipsModal } from './TipsModal';
import { EnhancedCoachPanel } from './EnhancedCoachPanel';
import { NSWStandaloneSubmitSystem } from './NSWStandaloneSubmitSystem';
import { ReportModal } from './ReportModal';
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
  Zap
} from 'lucide-react';

interface EnhancedWritingLayoutNSWProps {
  content: string;
  onChange: (content: string) => void;
  textType: string;
  prompt: string;
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
  // Additional props that might be passed from AppContent
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

export function EnhancedWritingLayoutNSW({
  content,
  onChange,
  textType,
  prompt: currentPrompt,
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
  // Additional props
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
  panelVisible,
  setPanelVisible
}: EnhancedWritingLayoutNSWProps) {
  // Local state for content management
  const [localContent, setLocalContent] = useState(content || '');
  const [showSettings, setShowSettings] = useState(false);
  const [showNSWEvaluation, setShowNSWEvaluation] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [nswReport, setNswReport] = useState<any>(null);
  const [evaluationStatus, setEvaluationStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [evaluationProgress, setEvaluationProgress] = useState("");
  const [isComponentReady, setIsComponentReady] = useState(false);

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Font families
  const fontFamilies = [
    { name: 'Inter', value: 'Inter', css: 'font-family: Inter, sans-serif;' },
    { name: 'Georgia', value: 'Georgia', css: 'font-family: Georgia, serif;' },
    { name: 'Times New Roman', value: 'Times New Roman', css: 'font-family: "Times New Roman", serif;' },
    { name: 'Arial', value: 'Arial', css: 'font-family: Arial, sans-serif;' },
    { name: 'Helvetica', value: 'Helvetica', css: 'font-family: Helvetica, sans-serif;' },
    { name: 'Courier New', value: 'Courier New', css: 'font-family: "Courier New", monospace;' }
  ];

  // Component initialization with error boundary
  useEffect(() => {
    try {
      setIsComponentReady(true);
      console.log('EnhancedWritingLayoutNSW: Component initialized successfully');
    } catch (error) {
      console.error('EnhancedWritingLayoutNSW: Initialization error:', error);
    }
  }, []);

  // Sync local content with prop
  useEffect(() => {
    if (content !== undefined && content !== localContent) {
      setLocalContent(content);
    }
  }, [content]);

  // Auto-save functionality with error handling
  useEffect(() => {
    if (!isComponentReady) return;
    
    const timer = setTimeout(() => {
      try {
        if (localContent !== content && onChange) {
          onChange(localContent);
        }
      } catch (error) {
        console.error('EnhancedWritingLayoutNSW: Auto-save error:', error);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [localContent, content, onChange, isComponentReady]);

  // Word count calculation with error handling
  useEffect(() => {
    if (!isComponentReady) return;
    
    try {
      const words = localContent.trim().split(/\s+/).filter(word => word.length > 0);
      const newWordCount = words.length;
      if (newWordCount !== wordCount && onWordCountChange) {
        onWordCountChange(newWordCount);
      }
    } catch (error) {
      console.error('EnhancedWritingLayoutNSW: Word count error:', error);
    }
  }, [localContent, wordCount, onWordCountChange, isComponentReady]);

  // Format elapsed time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle content change with auto-timer start and error handling
  const handleContentChange = useCallback((newContent: string) => {
    try {
      setLocalContent(newContent);
      
      // AUTO-START TIMER: Start timer when user begins typing
      if (newContent.trim().length > 0 && !isTimerRunning && elapsedTime === 0 && onStartTimer) {
        onStartTimer();
      }
      
      // Detect new paragraphs and emit events
      if (eventBus && detectNewParagraphs) {
        const newParagraphs = detectNewParagraphs(content, newContent);
        if (newParagraphs.length > 0) {
          eventBus.emit('newParagraphsDetected', { paragraphs: newParagraphs, textType });
        }
      }
    } catch (error) {
      console.error('EnhancedWritingLayoutNSW: Content change error:', error);
    }
  }, [content, isTimerRunning, elapsedTime, onStartTimer, textType]);

  // NSW Submit Handler with comprehensive error handling
  const handleNSWSubmit = useCallback(async (contentToSubmit: string, typeToSubmit: string) => {
    if (!contentToSubmit.trim()) {
      alert("Please write something before submitting for evaluation.");
      return;
    }

    setEvaluationStatus("loading");
    setShowNSWEvaluation(true);
    setEvaluationProgress("Analyzing your writing...");

    try {
      // Simulate evaluation progress
      setTimeout(() => setEvaluationProgress("Checking grammar and structure..."), 1000);
      setTimeout(() => setEvaluationProgress("Evaluating content and ideas..."), 2000);
      setTimeout(() => setEvaluationProgress("Generating detailed feedback..."), 3000);

      // Ensure NSWEvaluationReportGenerator is available
      if (!NSWEvaluationReportGenerator) {
        throw new Error("NSW Evaluation system is not available");
      }

      const report = await NSWEvaluationReportGenerator.generateReport({
        essayContent: contentToSubmit,
        textType: typeToSubmit,
        prompt: currentPrompt || '',
        wordCount: wordCount || 0,
        targetWordCountMin: 200,
        targetWordCountMax: 300,
      });
      
      setNswReport(report);
      convertReportToAnalysis(report);
      setShowNSWEvaluation(false);
      setShowReportModal(true);
      setEvaluationStatus("success");
    } catch (error) {
      console.error("NSW evaluation error:", error);
      setEvaluationStatus("error");
      setShowNSWEvaluation(false);
      alert(`There was an error evaluating your writing: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    }
  }, [currentPrompt, wordCount]);

  // Convert report to analysis with comprehensive error handling
  const convertReportToAnalysis = useCallback((report: any) => {
    try {
      if (!report) {
        throw new Error("Report is null or undefined");
      }

      // Create a properly typed DetailedFeedback object
      const convertedAnalysis: DetailedFeedback = {
        id: report.id || `nsw-${Date.now()}`,
        overallScore: report.overallScore || 0,
        criteria: {
          ideasContent: {
            score: report.domains?.contentAndIdeas?.score || 0,
            weight: report.domains?.contentAndIdeas?.weight || 40,
            strengths: (report.domains?.contentAndIdeas?.feedback || []).map((s: string) => ({ 
              text: s, 
              start: 0, 
              end: 0 
            })),
            improvements: (Array.isArray(report.areasForImprovement) ? report.areasForImprovement : [])
              .filter((i: string) => i.includes("Ideas") || i.includes("Content"))
              .map((i: string) => ({
                issue: i,
                suggestion: "Continue developing this area",
                evidence: { text: "Based on your writing", start: 0, end: 0 }
              }))
          },
          structureOrganization: {
            score: report.domains?.textStructure?.score || 0,
            weight: report.domains?.textStructure?.weight || 20,
            strengths: (report.domains?.textStructure?.feedback || []).map((s: string) => ({ 
              text: s, 
              start: 0, 
              end: 0 
            })),
            improvements: (Array.isArray(report.areasForImprovement) ? report.areasForImprovement : [])
              .filter((i: string) => i.includes("Structure") || i.includes("Organization"))
              .map((i: string) => ({
                issue: i,
                suggestion: "Continue developing this area",
                evidence: { text: "Based on your writing", start: 0, end: 0 }
              }))
          },
          languageVocab: {
            score: report.domains?.languageFeatures?.score || 0,
            weight: report.domains?.languageFeatures?.weight || 25,
            strengths: (report.domains?.languageFeatures?.feedback || []).map((s: string) => ({ 
              text: s, 
              start: 0, 
              end: 0 
            })),
            improvements: (Array.isArray(report.areasForImprovement) ? report.areasForImprovement : [])
              .filter((i: string) => i.includes("Language") || i.includes("Vocabulary"))
              .map((i: string) => ({
                issue: i,
                suggestion: "Continue developing this area",
                evidence: { text: "Based on your writing", start: 0, end: 0 }
              }))
          },
          spellingPunctuationGrammar: {
            score: report.domains?.spellingAndGrammar?.score || 0,
            weight: report.domains?.spellingAndGrammar?.weight || 15,
            strengths: (report.domains?.spellingAndGrammar?.feedback || []).map((s: string) => ({ 
              text: s, 
              start: 0, 
              end: 0 
            })),
            improvements: (Array.isArray(report.areasForImprovement) ? report.areasForImprovement : [])
              .filter((i: string) => i.includes("Grammar") || i.includes("Spelling"))
              .map((i: string) => ({
                issue: i,
                suggestion: "Continue developing this area",
                evidence: { text: "Based on your writing", start: 0, end: 0 }
              }))
          }
        },
        grammarCorrections: [],
        vocabularyEnhancements: [],
        modelVersion: "NSW-Enhanced-v1.0"
      };
      
      console.log("Converted analysis:", convertedAnalysis);
      if (onAnalysisChange) {
        onAnalysisChange(convertedAnalysis);
      }
    } catch (conversionError) {
      console.error("Error converting report:", conversionError);
      alert("There was an error processing the evaluation report. Please try again.");
    }
  }, [onAnalysisChange]);

  const handleSubmitForEvaluation = useCallback(async (contentToSubmit: string, typeToSubmit: string) => {
    console.log("handleSubmitForEvaluation called");
    await handleNSWSubmit(contentToSubmit, typeToSubmit);
  }, [handleNSWSubmit]);

  const handleApplyFix = useCallback((fix: LintFix) => {
    console.log('Applying fix:', fix);
  }, []);

  const handleCloseReportModal = useCallback(() => {
    setShowReportModal(false);
    setNswReport(null);
    setEvaluationStatus("idle");
  }, []);

  const handleCloseNSWEvaluation = useCallback(() => {
    setShowNSWEvaluation(false);
    setEvaluationStatus("idle");
    setEvaluationProgress("");
  }, []);

  // Get current font family CSS
  const getCurrentFontFamily = () => {
    const family = fontFamilies.find(f => f.value === fontFamily);
    return family ? family.css : fontFamilies[0].css;
  };

  // Check if word count exceeds target
  const showWordCountWarning = wordCount > 300;

  // Check if we have content for submit button
  const currentContent = localContent || content || '';
  const hasContent = currentContent.trim().length > 0;

  // Show loading state while component initializes
  if (!isComponentReady) {
    return (
      <div className={`flex h-screen items-center justify-center transition-colors duration-300 ${
        darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
      }`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium">Loading Writing Area...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen transition-colors duration-300 ${
      darkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      {/* Left side - Writing Area */}
      <div className="flex-1 flex flex-col">
        {/* Header with prompt and controls */}
        <div className={`p-4 border-b transition-colors duration-300 ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <PenTool className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Your Writing Prompt
              </h2>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                darkMode ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-800'
              }`}>
                {textType}
              </span>
            </div>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg transition-colors ${
                darkMode
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              title="Hide Prompt"
            >
              {showSettings ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {!showSettings && currentPrompt && (
            <div className={`p-3 rounded-lg text-sm leading-relaxed ${
              darkMode ? 'bg-gray-700 text-gray-200' : 'bg-blue-50 text-blue-900'
            }`}>
              <strong>Prompt:</strong> {currentPrompt}
            </div>
          )}
        </div>

        {/* Toolbar */}
        <div className={`px-4 py-3 border-b flex items-center justify-between transition-colors duration-300 ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <button
              onClick={onToggleStructureGuide}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                showStructureGuide
                  ? darkMode
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-600 text-white'
                  : darkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Structure</span>
            </button>

            <button
              onClick={onToggleTips}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                showTips
                  ? darkMode
                    ? 'bg-yellow-600 text-white'
                    : 'bg-yellow-500 text-white'
                  : darkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <LightbulbIcon className="w-4 h-4" />
              <span>Tips</span>
            </button>

            <button
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                darkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Exam Mode</span>
            </button>

            <button
              onClick={onToggleFocus}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                focusMode
                  ? darkMode
                    ? 'bg-green-600 text-white'
                    : 'bg-green-600 text-white'
                  : darkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>Focus</span>
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
                  darkMode
                    ? 'text-gray-400 hover:text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button
                onClick={onResetTimer}
                className={`p-1 rounded transition-colors ${
                  darkMode
                    ? 'text-gray-400 hover:text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Word Count */}
            <div className="flex items-center space-x-2">
              <FileText className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              <span className={`text-sm font-medium ${
                showWordCountWarning
                  ? 'text-red-600'
                  : darkMode
                    ? 'text-gray-300'
                    : 'text-gray-700'
              }`}>
                {wordCount} words
              </span>
            </div>

            {/* Settings */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg transition-colors ${
                darkMode
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Writing Area */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={localContent}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Start writing your amazing story here! Let your creativity flow and bring your ideas to life..."
            className={`w-full h-full p-6 resize-none border-none outline-none transition-colors duration-300 ${
              darkMode
                ? 'bg-gray-900 text-gray-100 placeholder-gray-500'
                : 'bg-white text-gray-900 placeholder-gray-400'
            }`}
            style={{
              fontFamily: fontFamily,
              fontSize: `${fontSize}px`,
              lineHeight: lineHeight,
            }}
          />

          {/* Focus Mode Indicator */}
          {focusMode && (
            <div className={`absolute bottom-4 right-4 px-3 py-1 rounded-full text-sm font-medium ${
              darkMode ? 'bg-blue-800 text-blue-200' : 'bg-blue-100 text-blue-800'
            }`}>
              Focus Mode
            </div>
          )}
        </div>

        {/* Enhanced Submit Button */}
        <div className={`p-4 border-t transition-colors duration-300 ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleSubmitForEvaluation(currentContent, textType)}
              disabled={evaluationStatus === "loading" || !hasContent}
              className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 disabled:cursor-not-allowed shadow-lg"
            >
              {evaluationStatus === "loading" ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Evaluating...</span>
                </>
              ) : (
                <>
                  <Target className="w-5 h-5" />
                  <span>Submit for NSW Evaluation</span>
                </>
              )}
            </button>
            
            {/* Quick Info Button */}
            <button
              className={`p-3 rounded-lg transition-colors ${
                darkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title="NSW Evaluation Info"
            >
              <Info className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Right side - Enhanced Coach Panel */}
      <div className="w-96 border-l border-gray-200 dark:border-gray-700">
        <EnhancedCoachPanel
          content={currentContent}
          textType={textType}
          analysis={analysis}
          onApplyFix={handleApplyFix}
          darkMode={darkMode}
        />
      </div>

      {/* Modals */}
      {showStructureGuide && onToggleStructureGuide && (
        <StructureGuideModal
          textType={textType}
          onClose={onToggleStructureGuide}
          darkMode={darkMode}
        />
      )}

      {showTips && onToggleTips && (
        <TipsModal
          textType={textType}
          onClose={onToggleTips}
          darkMode={darkMode}
        />
      )}

      {/* NSW Evaluation Modal */}
      {showNSWEvaluation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-lg max-w-md w-full mx-4 ${
            darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
          }`}>
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold mb-2">Evaluating Your Writing</h3>
              <p className="text-sm opacity-75">{evaluationProgress}</p>
              <button
                onClick={handleCloseNSWEvaluation}
                className="mt-4 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && nswReport && (
        <ReportModal
          report={nswReport}
          onClose={handleCloseReportModal}
          darkMode={darkMode}
        />
      )}
    </div>
  );
}