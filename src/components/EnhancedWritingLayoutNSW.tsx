// src/components/EnhancedWritingLayoutNSW.tsx - COMPLETE FIX WITH TOOLBAR

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
import { InteractiveTextEditor, EditorHandle } from './InteractiveTextEditor';
import { WritingStatusBar } from './WritingStatusBar';

interface EnhancedWritingLayoutNSWProps {
  content: string;
  onChange: (content: string) => void;
  textType: string;
  onTextTypeChange: (type: string) => void;
  initialPrompt: string;
  setPrompt: (prompt: string) => void;
  wordCount: number;
  onWordCountChange: (count: number) => void;
  onSubmit: (content: string) => void;
  analysis: DetailedFeedback | null;
  onAnalysisChange: (analysis: DetailedFeedback | null) => void;
  nswReport: any;
  onNSWEvaluationComplete: (report: any) => void;
  showNSWEvaluation: boolean;
  setShowNSWEvaluation: (show: boolean) => void;
  evaluationStatus: "idle" | "loading" | "success" | "error";
  setEvaluationStatus: (status: "idle" | "loading" | "success" | "error") => void;
  error?: string;
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
  assistanceLevel?: string;
  onAssistanceLevelChange?: (level: string) => void;
  selectedText?: string;
  onPopupCompleted?: () => void;
  popupFlowCompleted?: boolean;
  user?: any;
  openAIConnected?: boolean;
  openAILoading?: boolean;
  panelVisible?: boolean;
  setPanelVisible?: (visible: boolean) => void;
}

export function EnhancedWritingLayoutNSW(props: EnhancedWritingLayoutNSWProps) {
  const {
    content,
    onChange,
    textType,
    onTextTypeChange,
    initialPrompt,
    setPrompt,
    wordCount,
    onWordCountChange,
    onSubmit,
    analysis,
    onAnalysisChange,
    nswReport,
    onNSWEvaluationComplete,
    showNSWEvaluation,
    setShowNSWEvaluation,
    evaluationStatus,
    setEvaluationStatus,
    error,
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
    assistanceLevel,
    onAssistanceLevelChange,
    selectedText,
    onPopupCompleted,
    popupFlowCompleted,
    user,
    openAIConnected,
    openAILoading,
    panelVisible = true,
    setPanelVisible,
  } = props;

  // State management
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [customPromptInput, setCustomPromptInput] = useState<string | null>(null);
  const [localContent, setLocalContent] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [evaluationProgress, setEvaluationProgress] = useState("");
  const [showPromptOptionsModal, setShowPromptOptionsModal] = useState(false);
  const [hidePrompt, setHidePrompt] = useState(false);
  
  // New states for missing functionality
  const [showPlanningTool, setShowPlanningTool] = useState(false);
  const [examMode, setExamMode] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  // Convert NSW report format to DetailedFeedback format
  const convertNSWReportToDetailedFeedback = (report: any): any => {
    return {
      id: `nsw-${Date.now()}`,
      overallScore: report.overallScore || 0,
      criteria: {
        ideasContent: {
          score: report.domains?.contentAndIdeas?.score || 0,
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
          score: report.domains?.textStructure?.score || 0,
          weight: report.domains?.textStructure?.weight || 20,
          strengths: (report.domains?.textStructure?.feedback || []).map((text: string) => ({ 
            text, 
            start: 0, 
            end: 0 
          })),
          improvements: (report.areasForImprovement || [])
            .filter((item: any) => item.toLowerCase().includes('structure') || item.toLowerCase().includes('organization'))
            .map((text: string) => ({
              issue: text,
              evidence: { text: '', start: 0, end: 0 },
              suggestion: 'Work on improving your structure'
            }))
        },
        languageVocab: {
          score: report.domains?.languageFeatures?.score || 0,
          weight: report.domains?.languageFeatures?.weight || 25,
          strengths: (report.domains?.languageFeatures?.feedback || []).map((text: string) => ({ 
            text, 
            start: 0, 
            end: 0 
          })),
          improvements: (report.areasForImprovement || [])
            .filter((item: any) => item.toLowerCase().includes('language') || item.toLowerCase().includes('vocabulary'))
            .map((text: any) => ({
              issue: text,
              evidence: { text: '', start: 0, end: 0 },
              suggestion: 'Enhance your vocabulary'
            }))
        },
        spellingPunctuationGrammar: {
          score: report.domains?.spellingAndGrammar?.score || 0,
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
      // Pass through additional NSW-specific data
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

  // Calculate word count and content status - MUST be defined before handleSubmitForEvaluation
  const hasContent = localContent.trim().length > 0;
  const currentWordCount = localContent.trim() ? localContent.trim().split(/\s+/).length : 0;
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
      return;
    }

    // Fallback submission logic
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
      
      // Convert to DetailedFeedback format
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
      handleContentChange(newContent);
    } catch (error) {
      console.error("Error applying fix:", error);
    }
  }, [localContent, handleContentChange]);

  return (
    <div className={`flex h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-gray-900">Your Writing Prompt</h1>
          <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">{textType}</span>
        </div>
        <div className="flex items-center space-x-4">
          <select 
            value={textType} 
            onChange={(e) => onTextTypeChange && onTextTypeChange(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="narrative">Narrative</option>
            <option value="persuasive">Persuasive</option>
            <option value="informative">Informative</option>
          </select>
          <button onClick={() => setHidePrompt(!hidePrompt)} className="text-sm text-gray-600 hover:text-gray-900">{hidePrompt ? 'Show Prompt' : 'Hide Prompt'}</button>
          <div className="flex items-center space-x-4">
            <WritingStatusBar 
              wordCount={currentWordCount}
              targetWordCount={300} // Assuming a default target word count
              status={evaluationStatus}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Writing Area */}
        <div className="flex-1 flex flex-col">
          {/* Prompt */}
          {!hidePrompt && effectivePrompt && (
            <div className="bg-blue-50 border-b border-blue-200 p-3">
              <p className="text-sm text-blue-800 leading-relaxed">{effectivePrompt}</p>
            </div>
          )}

          {/* Writing Area */}
          <div className="flex-1 flex flex-col p-6">
            <div className="flex-1 bg-white rounded-lg border border-gray-200 shadow-sm relative mb-4">
              <InteractiveTextEditor
                value={localContent}
                onChange={handleContentChange}
                onAnalyze={() => { /* Implement analysis logic here if needed */ }}
                className="h-full"
              />
            </div>
            {/* Submit Button */}
            <div className="w-full">
              <button
                onClick={handleSubmitForEvaluation}
                disabled={evaluationStatus === "loading" || currentWordCount < 50}
                className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all duration-200 ${
                  evaluationStatus === "loading" 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : currentWordCount < 50
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl'
                }`}
              >
                {evaluationStatus === "loading" ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                    Generating NSW Assessment Report...
                  </div>
                ) : (
                  `Submit for NSW Evaluation (${currentWordCount} words)`
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel - Coach & Analysis */}
        <div className="w-96 border-l border-gray-200 bg-white flex flex-col">
          {showNSWEvaluation ? (
            /* NSW Evaluation System */
            <div className="h-full p-4">
              <div className="h-full bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                <div className="p-4 border-b border-purple-200">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-purple-800">NSW Assessment</h3>
                    <button
                      onClick={() => setShowNSWEvaluation(false)}
                      className="text-purple-600 hover:text-purple-800 text-sm"
                    >
                      ← Back to Coach
                    </button>
                  </div>
                </div>
                <div className="h-full overflow-auto">
                  <NSWStandaloneSubmitSystem
                    content={localContent}
                    wordCount={currentWordCount}
                    targetWordCountMin={100}
                    targetWordCountMax={400}
                    textType={textType}
                    prompt={effectivePrompt || ''}
                    onSubmissionComplete={(report) => {
                      const convertedReport = convertNSWReportToDetailedFeedback(report);
                      setNswReport(convertedReport);
                      setShowNSWEvaluation(false);
                      setShowReportModal(true);
                      setEvaluationStatus("success");
                      if (onAnalysisChange) onAnalysisChange(convertedReport);
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Coach Panel */
            <div className="h-full">
              <EnhancedCoachPanel 
                content={localContent}
                textType={textType}
                analysis={analysis}
              />
            </div>
          )}
        </div>
      </div>

      {/* Modals and other components */}
      <PlanningToolModal
        isOpen={showPlanningTool}
        onClose={() => setShowPlanningTool(false)}
        textType={textType}
        prompt={effectivePrompt}
      />
      <StructureGuideModal
        isOpen={showStructureGuide}
        onClose={() => onToggleStructureGuide && onToggleStructureGuide()}
        textType={textType}
      />
      <TipsModal
        isOpen={showTips}
        onClose={() => onToggleTips && onToggleTips()}
        textType={textType}
      />
      <PromptOptionsModal
        isOpen={showPromptOptionsModal}
        onClose={() => setShowPromptOptionsModal(false)}
        onGeneratePrompt={handleGenerateNewPrompt}
        onCustomPrompt={handleCustomPromptInput}
        onPopupCompleted={onPopupCompleted}
      />
      {showReportModal && nswReport && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          report={nswReport}
          onApplyFix={handleApplyFix}
        />
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-t border-red-200 px-6 py-3">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );