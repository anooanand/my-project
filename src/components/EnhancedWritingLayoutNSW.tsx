// src/components/EnhancedWritingLayoutNSW.tsx - LAYOUT RESTORED

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StructureGuideModal } from './StructureGuideModal';
import { TipsModal } from './TipsModal';
import { EnhancedCoachPanel } from './EnhancedCoachPanel';
import { NSWStandaloneSubmitSystem } from './NSWStandaloneSubmitSystem';
import { ReportModal } from './ReportModal';
import { PromptOptionsModal } from './PromptOptionsModal';
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
  ChevronDown
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
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [customPromptInput, setCustomPromptInput] = useState<string | null>(null);

  const effectivePrompt = generatedPrompt || customPromptInput || initialPrompt;

  const [localContent, setLocalContent] = useState(content || '');
  const [showSettings, setShowSettings] = useState(false);
  const [showNSWEvaluation, setShowNSWEvaluation] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [nswReport, setNswReport] = useState<any>(null);
  const [evaluationStatus, setEvaluationStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [evaluationProgress, setEvaluationProgress] = useState("");
  const [isComponentReady, setIsComponentReady] = useState(false);
  const [showPromptOptionsModal, setShowPromptOptionsModal] = useState(false);
  const [hidePrompt, setHidePrompt] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fontFamilies = [
    { name: 'Inter', value: 'Inter', css: 'font-family: Inter, sans-serif;' },
    { name: 'Georgia', value: 'Georgia', css: 'font-family: Georgia, serif;' },
    { name: 'Times New Roman', value: 'Times New Roman', css: 'font-family: "Times New Roman", serif;' },
    { name: 'Arial', value: 'Arial', css: 'font-family: Arial, sans-serif;' },
    { name: 'Helvetica', value: 'Helvetica', css: 'font-family: Helvetica, sans-serif;' },
    { name: 'Courier New', value: 'Courier New', css: 'font-family: "Courier New", monospace;' }
  ];

  useEffect(() => {
    try {
      setIsComponentReady(true);
    } catch (error) {
      console.error('EnhancedWritingLayoutNSW: Initialization error:', error);
    }
  }, []);

  useEffect(() => {
    if (content !== undefined && content !== localContent) {
      setLocalContent(content);
    }
  }, [content]);

  useEffect(() => {
    if (!initialPrompt && !generatedPrompt && !customPromptInput) {
      setShowPromptOptionsModal(true);
    }
  }, [initialPrompt, generatedPrompt, customPromptInput]);

  useEffect(() => {
    if (effectivePrompt && !localContent.includes(effectivePrompt)) {
      // Only set content to prompt if the writing area is empty
      if (!localContent.trim()) {
        setLocalContent(effectivePrompt);
        if (onChange) {
          onChange(effectivePrompt);
        }
      }
    }
  }, [effectivePrompt]);

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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleGenerateNewPrompt = useCallback(async () => {
    try {
      const newPrompt = await generatePrompt(textType, promptConfig.systemPrompts.promptGenerator);
      setGeneratedPrompt(newPrompt);
      if (setPrompt) {
        setPrompt(newPrompt);
      }
      setShowPromptOptionsModal(false);
    } catch (error) {
      console.error("Error generating prompt:", error);
      alert("Failed to generate a prompt. Please try again.");
    }
  }, [textType, setPrompt]);

  const handleCustomPromptInput = useCallback((promptText: string) => {
      setCustomPromptInput(promptText);
      if (setPrompt) {
        setPrompt(promptText);
      }
      setShowPromptOptionsModal(false);
  }, [setPrompt]);

  const handleContentChange = useCallback((newContent: string) => {
    try {
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
    } catch (error) {
      console.error('EnhancedWritingLayoutNSW: Content change error:', error);
    }
  }, [content, isTimerRunning, elapsedTime, onStartTimer, textType]);

  const handleNSWSubmit = useCallback(async (contentToSubmit: string, typeToSubmit: string) => {
    if (!contentToSubmit.trim()) {
      alert("Please write something before submitting for evaluation.");
      return;
    }

    setEvaluationStatus("loading");
    setShowNSWEvaluation(true);
    setEvaluationProgress("Analyzing your writing...");

    try {
      setTimeout(() => setEvaluationProgress("Checking grammar and structure..."), 1000);
      setTimeout(() => setEvaluationProgress("Evaluating content and ideas..."), 2000);
      setTimeout(() => setEvaluationProgress("Generating detailed feedback..."), 3000);

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

  const convertReportToAnalysis = useCallback((report: any) => {
    try {
      if (!report) {
        throw new Error("Report is null or undefined");
      }

      const convertedAnalysis: DetailedFeedback = {
        id: report.id || `nsw-${Date.now()}`,
        overallScore: report.overallScore || 0,
        criteriaScores: report.criteriaScores || {},
        feedbackItems: report.feedbackItems || [],
        strengths: report.strengths || [],
        areasForImprovement: report.areasForImprovement || [],
        detailedAnalysis: report.detailedAnalysis || '',
        band: report.band || { level: 0, description: '' },
        generatedAt: report.generatedAt || new Date().toISOString(),
      };

      if (onAnalysisChange) {
        onAnalysisChange(convertedAnalysis);
      }
    } catch (error) {
      console.error("Error converting report to analysis:", error);
    }
  }, [onAnalysisChange]);

  const handleApplyFix = useCallback((fix: LintFix) => {
    try {
      const { range, text } = fix;
      const newContent = localContent.substring(0, range[0]) + text + localContent.substring(range[1]);
      handleContentChange(newContent);
    } catch (error) {
      console.error("Error applying fix:", error);
    }
  }, [localContent, handleContentChange]);

  const handleCloseReportModal = () => {
    setShowReportModal(false);
    setNswReport(null);
  };

  const handleCloseNSWEvaluation = () => {
    setShowNSWEvaluation(false);
    setEvaluationStatus("idle");
    setEvaluationProgress("");
  };

  const handleSubmitForEvaluation = () => {
    if (onSubmit) {
      onSubmit(localContent);
    } else {
      handleNSWSubmit(localContent, textType);
    }
  };

  const hasContent = localContent.trim().length > 0;
  const showWordCountWarning = (wordCount || 0) < 200 || (wordCount || 0) > 300;

  if (!isComponentReady) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Prompt Section - Restored to original layout */}
      {effectivePrompt && !hidePrompt && (
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start flex-1">
              <LightbulbIcon size={20} className="mr-3 mt-1 text-blue-500 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <h2 className="text-sm font-medium text-gray-700">Your Writing Prompt</h2>
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {textType}
                  </span>
                </div>
                <div className="text-sm text-gray-900 leading-relaxed">
                  <strong>Prompt:</strong> {effectivePrompt}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 ml-4">
              <button 
                onClick={() => setShowPromptOptionsModal(true)} 
                className="flex items-center text-xs text-purple-600 hover:text-purple-800 transition-colors px-2 py-1 rounded border border-purple-200 hover:border-purple-300"
              >
                <Zap size={14} className="mr-1" />
                Magical Prompt
              </button>
              <button
                onClick={() => setHidePrompt(true)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                title="Hide Prompt"
              >
                <ChevronUp size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Show Prompt Button when hidden */}
      {hidePrompt && effectivePrompt && (
        <div className="bg-gray-50 border-b border-gray-200 p-2">
          <button
            onClick={() => setHidePrompt(false)}
            className="flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ChevronDown size={16} className="mr-1" />
            Show Prompt
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-4">
          <button
            onClick={onToggleStructureGuide}
            className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
          >
            <BookOpen size={16} className="mr-1" />
            Plan
          </button>
          <button
            onClick={onToggleStructureGuide}
            className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
          >
            <FileText size={16} className="mr-1" />
            Structure
          </button>
          <button
            onClick={onToggleTips}
            className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
          >
            <Info size={16} className="mr-1" />
            Tips
          </button>
          <button
            className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
          >
            <Target size={16} className="mr-1" />
            Exam Mode
          </button>
          <button
            onClick={onToggleFocus}
            className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
          >
            {focusMode ? <EyeOff size={16} className="mr-1" /> : <Eye size={16} className="mr-1" />}
            Focus
          </button>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center text-sm text-gray-600">
            <Clock size={16} className="mr-1" />
            {formatTime(elapsedTime)}
          </div>
          {onStartTimer && !isTimerRunning && (
            <button onClick={onStartTimer} className="text-gray-600 hover:text-gray-800">
              <Play size={16} />
            </button>
          )}
          {onPauseTimer && isTimerRunning && (
            <button onClick={onPauseTimer} className="text-gray-600 hover:text-gray-800">
              <Pause size={16} />
            </button>
          )}
          {onResetTimer && (
            <button onClick={onResetTimer} className="text-gray-600 hover:text-gray-800">
              <RotateCcw size={16} />
            </button>
          )}
          <div className="flex items-center text-sm">
            <FileText size={16} className="mr-1 text-gray-500" />
            <span className={`${showWordCountWarning ? 'text-red-500 font-medium' : 'text-gray-600'}`}>
              {wordCount} words
            </span>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="text-gray-600 hover:text-gray-800"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Font Family</label>
              <select
                value={fontFamily}
                onChange={(e) => onSettingsChange && onSettingsChange({ fontFamily: e.target.value })}
                className="w-full p-2 border rounded text-sm"
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
                className="w-full p-2 border rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Line Height</label>
              <input
                type="number"
                step="0.1"
                value={lineHeight}
                onChange={(e) => onSettingsChange && onSettingsChange({ lineHeight: parseFloat(e.target.value) })}
                className="w-full p-2 border rounded text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 min-h-0">
        {/* Writing Area */}
        <div className="flex-1 flex flex-col">
          <textarea
            ref={textareaRef}
            value={localContent}
            onChange={(e) => handleContentChange(e.target.value)}
            className="flex-1 w-full p-6 text-base leading-relaxed resize-none focus:outline-none border-none"
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

      {/* Footer with Submit Button */}
      <footer className="flex items-center justify-center p-4 border-t border-gray-200 bg-white">
        <NSWStandaloneSubmitSystem 
          content={localContent}
          textType={textType}
          onSubmit={handleSubmitForEvaluation}
          disabled={!hasContent}
        />
      </footer>

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
          <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-md mx-auto">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <h3 className="text-2xl font-bold mb-2 text-gray-900">Evaluating Your Writing</h3>
            <p className="text-gray-600">{evaluationProgress}</p>
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
