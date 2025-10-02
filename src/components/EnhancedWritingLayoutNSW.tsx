// src/components/EnhancedWritingLayoutNSW.tsx - FINAL COMPLETE FIX

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
  const [evaluationStatus, setEvaluationStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [evaluationProgress, setEvaluationProgress] = useState("");
  const [showPromptOptionsModal, setShowPromptOptionsModal] = useState(false);
  const [hidePrompt, setHidePrompt] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
      setLocalContent(newPrompt); // Update local content immediately
      if (setPrompt) {
        setPrompt(newPrompt);
      }
      if (onChange) {
        onChange(newPrompt); // Also inform parent component
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
    setLocalContent(promptText); // Update local content immediately
    if (setPrompt) {
      setPrompt(promptText);
    }
    if (onChange) {
      onChange(promptText); // Also inform parent component
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

  const handleSubmitForEvaluation = useCallback(async () => {
    if (!localContent.trim()) {
      alert("Please write something before submitting for evaluation.");
      return;
    }

    if (onSubmit) {
      onSubmit(localContent);
      return;
    }

    // Fallback submission logic
    setEvaluationStatus("loading");
    setShowNSWEvaluation(true);
    setEvaluationProgress("Analyzing your writing...");

    try {
      setTimeout(() => setEvaluationProgress("Checking grammar and structure..."), 1000);
      setTimeout(() => setEvaluationProgress("Evaluating content and ideas..."), 2000);
      setTimeout(() => setEvaluationProgress("Generating detailed feedback..."), 3000);

      const report = await NSWEvaluationReportGenerator.generateReport({
        essayContent: localContent,
        textType: textType,
        prompt: effectivePrompt || '',
        wordCount: wordCount || 0,
        targetWordCountMin: 200,
        targetWordCountMax: 300,
      });
      
      setNswReport(report);
      setShowNSWEvaluation(false);
      setShowReportModal(true);
      setEvaluationStatus("success");
    } catch (error) {
      console.error("NSW evaluation error:", error);
      setEvaluationStatus("error");
      setShowNSWEvaluation(false);
      alert(`There was an error evaluating your writing. Please try again.`);
    }
  }, [localContent, textType, effectivePrompt, wordCount, onSubmit]);

  const handleApplyFix = useCallback((fix: LintFix) => {
    try {
      const { range, text } = fix;
      const newContent = localContent.substring(0, range[0]) + text + localContent.substring(range[1]);
      handleContentChange(newContent);
    } catch (error) {
      console.error("Error applying fix:", error);
    }
  }, [localContent, handleContentChange]);

  const hasContent = localContent.trim().length > 0;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <PenTool className="text-purple-500" size={24} />
          <h1 className="text-xl font-semibold text-gray-900">Writing Studio</h1>
          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
            {textType}
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-gray-600">
            <Clock size={18} />
            <span className="text-sm font-mono">{formatTime(elapsedTime)}</span>
          </div>
          {onStartTimer && !isTimerRunning && (
            <button 
              onClick={onStartTimer}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
              title="Start Timer"
            >
              <Play size={18} />
            </button>
          )}
          {onPauseTimer && isTimerRunning && (
            <button 
              onClick={onPauseTimer}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
              title="Pause Timer"
            >
              <Pause size={18} />
            </button>
          )}
          {onResetTimer && (
            <button 
              onClick={onResetTimer}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
              title="Reset Timer"
            >
              <RotateCcw size={18} />
            </button>
          )}
          <button
            onClick={onToggleFocus}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
            title="Toggle Focus Mode"
          >
            {focusMode ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
            title="Settings"
          >
            <Settings size={18} />
          </button>
        </div>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Font Family</label>
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
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Font Size</label>
              <input
                type="number"
                value={fontSize}
                onChange={(e) => onSettingsChange && onSettingsChange({ fontSize: parseInt(e.target.value) })}
                className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Line Height</label>
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

      {/* Main Content Area */}
      <div className="flex-1 flex min-h-0">
        {/* Left Side - Prompt and Writing Area */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Prompt Section */}
          {effectivePrompt && !hidePrompt && (
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex items-start flex-1">
                  <LightbulbIcon size={20} className="mr-3 mt-1 text-purple-500 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h2 className="text-lg font-semibold text-gray-900">Your Writing Prompt</h2>
                      <button
                        onClick={() => setHidePrompt(true)}
                        className="ml-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Hide Prompt
                      </button>
                    </div>
                    <div className="text-gray-700 leading-relaxed">
                      {effectivePrompt}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <button 
                  onClick={() => setShowPromptOptionsModal(true)} 
                  className="flex items-center text-sm text-purple-600 hover:text-purple-800 transition-colors px-3 py-1 rounded border border-purple-200 hover:border-purple-300"
                >
                  <Zap size={16} className="mr-2" />
                  Magical Prompt
                </button>
              </div>
            </div>
          )}

          {/* Show Prompt Button when hidden */}
          {hidePrompt && effectivePrompt && (
            <div className="p-3 border-b border-gray-200 bg-gray-50">
              <button
                onClick={() => setHidePrompt(false)}
                className="flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ChevronDown size={16} className="mr-1" />
                Show Prompt
              </button>
            </div>
          )}

          {/* Writing Area */}
          <div className="flex-1 p-6">
            <textarea
              ref={textareaRef}
              value={localContent}
              onChange={(e) => handleContentChange(e.target.value)}
              className="w-full h-full p-4 text-base leading-relaxed resize-none focus:outline-none border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              style={{ fontFamily, fontSize: `${fontSize}px`, lineHeight }}
              placeholder="Start writing here..."
            />
          </div>

          {/* Footer with Submit Button */}
          <footer className="p-4 border-t border-gray-200 bg-white">
            <div className="flex items-center justify-center">
              <button
                onClick={handleSubmitForEvaluation}
                disabled={!hasContent}
                className={`px-8 py-3 rounded-lg font-medium text-white transition-colors ${
                  hasContent 
                    ? 'bg-purple-600 hover:bg-purple-700' 
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                Submit for NSW Evaluation
              </button>
            </div>
          </footer>
        </div>

        {/* Right Sidebar - AI Coach Panel */}
        {!focusMode && (
          <div className="w-80 border-l border-gray-200">
            <EnhancedCoachPanel
              textType={textType}
              content={localContent}
              analysis={analysis}
              onApplyFix={handleApplyFix}
              darkMode={darkMode}
              panelVisible={panelVisible}
              setPanelVisible={setPanelVisible}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      {showStructureGuide && (
        <StructureGuideModal 
          textType={textType} 
          onClose={() => onToggleStructureGuide && onToggleStructureGuide()} 
        />
      )}
      {showTips && (
        <TipsModal 
          textType={textType} 
          onClose={() => onToggleTips && onToggleTips()} 
        />
      )}
      {showReportModal && nswReport && (
        <ReportModal
          report={nswReport}
          onClose={() => setShowReportModal(false)}
          onNewEvaluation={() => {
            setNswReport(null);
            if (onAnalysisChange) onAnalysisChange(null);
            setShowReportModal(false);
            setLocalContent('');
            if (onChange) onChange('');
            if (setPrompt) setPrompt('');
            setGeneratedPrompt(null);
            setCustomPromptInput(null);
            if (onPopupCompleted) onPopupCompleted();
          }}
        />
      )}
      {showNSWEvaluation && evaluationStatus === "loading" && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-lg font-semibold text-gray-800">Evaluating your writing...</p>
            <p className="text-sm text-gray-600 mt-2">{evaluationProgress}</p>
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