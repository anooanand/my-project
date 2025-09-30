// CORRECT: EnhancedWritingLayoutNSW Component (Fixed Loading and Prompt Display)
// This is the correct component code without circular imports

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StructureGuideModal } from './StructureGuideModal';
import { TipsModal } from './TipsModal';
import { EnhancedCoachPanel } from './EnhancedCoachPanel';
import { NSWStandaloneSubmitSystem } from './NSWStandaloneSubmitSystem';
import { ReportModal } from './ReportModal';
import { PromptOptionsModal } from './PromptOptionsModal';
import { generatePrompt } from '../lib/openai'; // Assuming openai.ts has a generatePrompt function
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
  Zap
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
  setPanelVisible,
  setPrompt,
}: EnhancedWritingLayoutNSWProps) {
  // Local state for content management
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [customPromptInput, setCustomPromptInput] = useState<string | null>(null);

  // Define effectivePrompt after its dependencies are declared
  const effectivePrompt = generatedPrompt || customPromptInput || initialPrompt;

  // Initialize localContent using effectivePrompt
  const [localContent, setLocalContent] = useState(content || effectivePrompt || '');
  const [showSettings, setShowSettings] = useState(false);
  const [showNSWEvaluation, setShowNSWEvaluation] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [nswReport, setNswReport] = useState<any>(null);
  const [evaluationStatus, setEvaluationStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [evaluationProgress, setEvaluationProgress] = useState("");
  const [isComponentReady, setIsComponentReady] = useState(false);
  const [showPromptOptionsModal, setShowPromptOptionsModal] = useState(false);

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

  // Manage prompt display and open PromptOptionsModal if no prompt is provided
  useEffect(() => {
    if (!initialPrompt && !generatedPrompt && !customPromptInput) {
      setShowPromptOptionsModal(true);
    }
  }, [initialPrompt, generatedPrompt, customPromptInput]);

  // Effect to update localContent when a new prompt is generated or selected
  useEffect(() => {
    if (effectivePrompt && localContent !== effectivePrompt) {
      setLocalContent(effectivePrompt);
      if (onChange) {
        onChange(effectivePrompt);
      }
    }
  }, [effectivePrompt, localContent, onChange]);

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
  const handleGenerateNewPrompt = useCallback(async () => {
    try {
      const newPrompt = await generatePrompt(textType, promptConfig.systemPrompts.promptGenerator);
      setGeneratedPrompt(newPrompt);
      if (setPrompt) {
        setPrompt(newPrompt);
      }
      // Immediately update localContent with the new prompt
      setLocalContent(newPrompt);
      if (onChange) {
        onChange(newPrompt);
      }
      setShowPromptOptionsModal(false);
    } catch (error) {
      console.error("Error generating prompt:", error);
      alert("Failed to generate a prompt. Please try again.");
    }
  }, [textType, setPrompt, onChange]);

  const handleCustomPromptInput = useCallback((promptText: string) => {
      setCustomPromptInput(promptText);
      if (setPrompt) {
        setPrompt(promptText);
      }
      // Immediately update localContent with the custom prompt
      setLocalContent(promptText);
      if (onChange) {
        onChange(promptText);
      }
      setShowPromptOptionsModal(false);
  }, [setPrompt, onChange]);

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
        prompt: effectivePrompt || '',
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
  }, [effectivePrompt, wordCount]);

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
    <div className={`flex h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="flex-1 flex flex-col relative">
        {/* Header Bar */}
        <header className={`flex items-center justify-between p-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-purple-600">Writing Studio</h1>
            <div className="flex items-center space-x-2 text-sm bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
              <Type size={16} />
              <span>{textType}</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Clock size={18} />
              <span className="font-mono text-lg">{formatTime(elapsedTime)}</span>
            </div>
            <button onClick={isTimerRunning ? onPauseTimer : onStartTimer} className={`p-2 rounded-full transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}>
              {isTimerRunning ? <Pause size={20} /> : <Play size={20} />}
            </button>
            <button onClick={onResetTimer} className={`p-2 rounded-full transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}>
              <RotateCcw size={20} />
            </button>
            <button onClick={() => setShowSettings(!showSettings)} className={`p-2 rounded-full transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}>
              <Settings size={20} />
            </button>
            <button onClick={onToggleFocus} className={`p-2 rounded-full transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}>
              {focusMode ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </header>

        {/* Settings Panel */}
        {showSettings && (
          <div className={`p-4 border-b ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-100'}`}>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Font Family</label>
                <select
                  value={fontFamily}
                  onChange={(e) => onSettingsChange && onSettingsChange({ fontFamily: e.target.value })}
                  className={`w-full p-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                >
                  {fontFamilies.map(font => (
                    <option key={font.value} value={font.value}>{font.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Font Size</label>
                <input
                  type="number"
                  value={fontSize}
                  onChange={(e) => onSettingsChange && onSettingsChange({ fontSize: parseInt(e.target.value) })}
                  className={`w-full p-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Line Height</label>
                <input
                  type="number"
                  step="0.1"
                  value={lineHeight}
                  onChange={(e) => onSettingsChange && onSettingsChange({ lineHeight: parseFloat(e.target.value) })}
                  className={`w-full p-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                />
              </div>
            </div>
          </div>
        )}

        {/* Writing Area */}
        <div className="flex-1 flex">
          <div className="flex-1 p-6 flex flex-col">
            <div className={`mb-4 p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <div className="flex items-start">
                <Target size={24} className="mr-3 mt-1 text-purple-500 flex-shrink-0" />
                <div>
                  <h2 className="font-semibold text-lg">Your Prompt:</h2>
                  <p className="text-base">{effectivePrompt}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowPromptOptionsModal(true)} 
                className="mt-3 flex items-center text-sm text-purple-600 hover:text-purple-800 transition-colors"
              >
                <Zap size={16} className="mr-1" />
                Magical Prompt
              </button>
            </div>
            <textarea
              ref={textareaRef}
              value={localContent}
              onChange={(e) => handleContentChange(e.target.value)}
              className={`flex-1 w-full p-4 text-lg leading-relaxed resize-none focus:outline-none transition-colors duration-300 ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'}`}
              style={{ fontFamily, fontSize: `${fontSize}px`, lineHeight }}
              placeholder="Start writing here..."
            />
          </div>

          {/* Right Sidebar (Coach Panel) */}
          {!focusMode && (
            <EnhancedCoachPanel
              textType={textType}
              content={localContent}
              analysis={analysis}
              onApplyFix={handleApplyFix}
              darkMode={darkMode}
              panelVisible={panelVisible}
              setPanelVisible={setPanelVisible}
            />
          )}
        </div>

        {/* Footer with Word Count and Submit Button */}
        <footer className={`flex items-center justify-between p-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className={`text-sm ${showWordCountWarning ? 'text-red-500 font-bold' : ''}`}>
            Word Count: {wordCount}
          </div>
          <NSWStandaloneSubmitSystem 
            content={localContent}
            textType={textType}
            onSubmit={handleSubmitForEvaluation}
            disabled={!hasContent}
          />
        </footer>
      </div>

      {/* Modals */}
      {showStructureGuide && <StructureGuideModal textType={textType} onClose={onToggleStructureGuide} darkMode={darkMode} />}
      {showTips && <TipsModal textType={textType} onClose={onToggleTips} darkMode={darkMode} />}
      {showReportModal && nswReport && (
        <ReportModal 
          report={nswReport} 
          onClose={handleCloseReportModal} 
          darkMode={darkMode} 
        />
      )}
      {showNSWEvaluation && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl text-center max-w-md mx-auto">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Evaluating Your Writing</h3>
            <p className="text-gray-600 dark:text-gray-300">{evaluationProgress}</p>
            {evaluationStatus === 'error' && (
              <button 
                onClick={handleCloseNSWEvaluation}
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
