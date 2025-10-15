// src/components/EnhancedWritingLayoutNSW.tsx - MODIFIED VERSION WITH BOTTOM SUBMIT BUTTON

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PlanningToolModal } from './PlanningToolModal';
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
  const [isPromptCollapsed, setIsPromptCollapsed] = useState(false);
  
  // New states for missing functionality
  const [showPlanningTool, setShowPlanningTool] = useState(false);
  const [examMode, setExamMode] = useState(false);

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
    const maxScore = 5;
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
            .filter((item: any) => item.toLowerCase().includes('spelling') || item.toLowerCase().includes('grammar') || item.toLowerCase().includes('punctuation'))
            .map((text: string) => ({
              issue: text,
              evidence: { text: '', start: 0, end: 0 },
              suggestion: 'Check your spelling, punctuation, and grammar'
            }))
        }
      },
      feedback: report.overallFeedback || 'No overall feedback provided.',
      suggestions: report.areasForImprovement || [],
      lint: [],
      timestamp: new Date().toISOString(),
    };
  };

  const handleSubmitForEvaluation = async () => {
    if (onSubmit) {
      onSubmit(localContent);
      return;
    }

    setEvaluationStatus("loading");
    setShowNSWEvaluation(true);
    setEvaluationProgress("Generating NSW Evaluation Report...");

    try {
      const generator = new NSWEvaluationReportGenerator();
      const report = await generator.generateReport(localContent, textType, (progress) => {
        setEvaluationProgress(progress);
      });
      
      setNswReport(report);
      setEvaluationStatus("success");
      setShowReportModal(true);
      
      if (onAnalysisChange) {
        const detailedFeedback = convertNSWReportToDetailedFeedback(report);
        onAnalysisChange(detailedFeedback);
      }

    } catch (error) {
      console.error("Error during NSW evaluation:", error);
      setEvaluationStatus("error");
      setEvaluationProgress("An error occurred during evaluation.");
    } finally {
      setShowNSWEvaluation(false);
    }
  };

  const handleApplyFix = (fix: LintFix) => {
    const { start, end, suggestion } = fix;
    const newContent = localContent.substring(0, start) + suggestion + localContent.substring(end);
    handleContentChange(newContent);
  };

  const currentWordCount = localContent.trim() ? localContent.trim().split(/\s+/).length : 0;
  const showWordCountWarning = currentWordCount > 800;
  const hasContent = currentWordCount > 0;

  return (
    <div className={`flex h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Left side - Writing Area Content */}
      <div className="flex-1 flex flex-col overflow-hidden"> 
        
        {/* Enhanced Header with Stunning Gradient and Professional Styling */}
        <div className={`h-16 flex items-center justify-between px-6 border-b shadow-lg ${
          darkMode 
            ? 'bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900 border-gray-700' 
            : 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 border-purple-700'
        }`}>
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-white font-semibold text-lg">Text Type:</span>
              <span className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium border border-white/30">
                {textType}
              </span>
            </div>
          </div>
          <button
            onClick={() => window.location.href = '/'}
            className="flex items-center space-x-2 px-6 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-all duration-200 text-white font-medium border border-white/20 hover:border-white/40"
          >
            <span>🏠 Home</span>
          </button>
        </div>

        {/* Enhanced Writing Prompt Section */}
        <div className={`transition-all duration-300 border-b shadow-sm flex-shrink-0 ${
          isPromptCollapsed ? 'h-16' : 'min-h-[140px]'
        } ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <Target className={`w-5 h-5 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                <h3 className={`font-semibold text-lg ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  Writing Prompt
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setHidePrompt(!hidePrompt)}
                  className={`p-2 rounded-lg transition-colors ${
                    hidePrompt
                      ? darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-700'
                      : darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200'
                  }`}
                  title={hidePrompt ? "Show Prompt" : "Hide Prompt"}
                >
                  {hidePrompt ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setIsPromptCollapsed(!isPromptCollapsed)}
                  className={`p-2 rounded-lg transition-colors ${
                    darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200'
                  }`}
                  title={isPromptCollapsed ? "Expand Prompt" : "Collapse Prompt"}
                >
                  {isPromptCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {!isPromptCollapsed && (
              <div className={`flex-1 overflow-y-auto pr-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <p className={hidePrompt ? 'blur-sm' : ''}>
                  {effectivePrompt || 'No prompt loaded. Generate or enter one.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Toolbar Section */}
        <div className={`flex-shrink-0 border-b p-2 flex items-center justify-between ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center space-x-4">
            {/* Planning & Structure Tools */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowPlanningTool(true)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-md transition-colors text-sm font-medium ${
                  darkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                title="Open Planning Tool"
              >
                <PenTool className="w-4 h-4" />
                <span>Plan</span>
              </button>
              <button
                onClick={onToggleStructureGuide}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-md transition-colors text-sm font-medium ${
                  darkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                title="Show Structure Guide"
              >
                <Type className="w-4 h-4" />
                <span>Structure</span>
              </button>
              <button
                onClick={onToggleTips}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-md transition-colors text-sm font-medium ${
                  darkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                title="Show Writing Tips"
              >
                <LightbulbIcon className="w-4 h-4" />
                <span>Tips</span>
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Timer */}
            <div className={`flex items-center space-x-2 p-1.5 rounded-lg ${
              darkMode ? 'bg-gray-700' : 'bg-gray-200'
            }`}>
              <Clock className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              <span className={`text-sm font-mono ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {formatTime(elapsedTime)}
              </span>
              <button
                onClick={onStartTimer}
                className={`p-1 rounded transition-colors ${
                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                }`}
                title="Start Timer"
              >
                <PlayCircle className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              </button>
              <button
                onClick={onPauseTimer}
                className={`p-1 rounded transition-colors ${
                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                }`}
                title="Pause Timer"
              >
                <PauseCircle className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
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

            {/* Word Count */}
            <div className="flex items-center space-x-2">
              <FileText className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {currentWordCount} words
              </span>
              {showWordCountWarning && (
                <AlertCircle className="w-4 h-4 text-red-500" title="Word count exceeds typical limits" />
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

        {/* Settings Panel */}
        {showSettings && (
          <div className={`p-4 border-b flex-shrink-0 ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
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

        {/* Writing Area - Takes remaining space */}
        <div className="flex-1 overflow-y-auto p-4">
          <textarea
            ref={textareaRef}
            value={localContent}
            onChange={(e) => handleContentChange(e.target.value)}
            className={`w-full h-full resize-none p-4 rounded-lg shadow-inner transition-colors duration-300 text-base leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              darkMode
                ? 'bg-gray-800 text-gray-200 placeholder-gray-500 border border-gray-700'
                : 'bg-white text-gray-800 placeholder-gray-400 border border-gray-300'
            }`}
            style={{ fontFamily, fontSize: `${fontSize}px`, lineHeight }}
            placeholder="Start writing here..."
          />
        </div>

        {/* Bottom Submit Button Section - NEW LOCATION */}
        <div className={`border-t flex-shrink-0 ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="p-4 flex items-center justify-center">
            {/* Submit Button - Increased Width */}
            <button
              onClick={handleSubmitForEvaluation}
              disabled={!hasContent}
              className={`flex items-center justify-center space-x-3 px-16 py-4 rounded-lg font-semibold text-lg text-white transition-all duration-200 shadow-lg min-w-[500px] ${
                hasContent
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 hover:shadow-xl transform hover:scale-105'
                  : 'bg-gray-400 cursor-not-allowed opacity-50'
              }`}
            >
              <Target className="w-6 h-6" />
              <span>Submit for NSW Evaluation</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right side - Coach Panel */}
      {!focusMode && (
        <div className={`w-[380px] flex-shrink-0 border-l overflow-y-auto transition-all duration-300 ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <EnhancedCoachPanel
            content={localContent}
            textType={textType}
            wordCount={currentWordCount}
            analysis={analysis}
            onAnalysisChange={onAnalysisChange}
            onApplyFix={handleApplyFix}
            assistanceLevel={assistanceLevel}
            onAssistanceLevelChange={onAssistanceLevelChange}
            user={user}
            openAIConnected={openAIConnected}
            openAILoading={openAILoading}
            onSubmitForEvaluation={handleSubmitForEvaluation}
            // Pass elapsedTime to EnhancedCoachPanel
            elapsedTime={elapsedTime}
          />
        </div>
      )}

      {/* Modals */}
      {showPlanningTool && <PlanningToolModal onClose={() => setShowPlanningTool(false)} textType={textType} />}
      {showStructureGuide && <StructureGuideModal onClose={onToggleStructureGuide} textType={textType} />}
      {showTips && <TipsModal onClose={onToggleTips} textType={textType} />}
      {showReportModal && nswReport && (
        <ReportModal
          isOpen={showReportModal}
          data={nswReport}
          onClose={() => {
            setShowReportModal(false);
            setNswReport(null);
            if (onAnalysisChange) onAnalysisChange(null);
          }}
          onApplyFix={handleApplyFix}
          studentName="Student"
          essayText={localContent}
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