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
            .map((text: string) => ({
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
      {/* Left side - Writing Area Content */}
      <div className="flex-1 flex flex-col overflow-hidden"> 
        
        {/* Enhanced Writing Prompt Section */}
        <div className={`transition-all duration-300 border-b shadow-sm flex-shrink-0 ${
          isPromptCollapsed ? 'h-16' : 'min-h-[140px]'
        } ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-blue-50 border-blue-200'}`}>
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center">
              <LightbulbIcon className={`w-5 h-5 mr-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              <h3 className={`font-semibold text-base ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>
                Your Writing Prompt
              </h3>
              <span className={`ml-3 text-xs px-2 py-1 rounded-full ${
                darkMode ? 'bg-blue-800/50 text-blue-200' : 'bg-blue-200 text-blue-800'
              }`}>
                {textType}
              </span>
            </div>
            
            <button
              onClick={() => setIsPromptCollapsed(!isPromptCollapsed)}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-md transition-colors text-sm font-medium ${
                darkMode
                  ? 'text-blue-300 hover:text-blue-100 hover:bg-blue-800/30'
                  : 'text-blue-700 hover:text-blue-900 hover:bg-blue-200'
              }`}
            >
              {isPromptCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              <span>{isPromptCollapsed ? 'Show Prompt' : 'Hide Prompt'}</span>
            </button>
          </div>

          {/* Prompt Content */}
          {!isPromptCollapsed && effectivePrompt && (
            <div className="px-4 pb-4">
              <div className={`p-4 rounded-lg border ${
                darkMode 
                  ? 'bg-blue-900/20 border-blue-800/30 text-blue-100' 
                  : 'bg-white border-blue-200 text-blue-900'
              }`}>
                <p className="text-sm leading-relaxed">
                  {effectivePrompt}
                </p>
              </div>
              <div className="mt-4">
                <button 
                  onClick={() => setShowPromptOptionsModal(true)} 
                  className="flex items-center text-sm text-purple-600 hover:text-purple-800 transition-colors duration-200"
                >
                  <PenTool className="w-4 h-4 mr-1" />
                  Change Prompt
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Writing Area */}
        <div className="flex-1 flex flex-col p-6 overflow-hidden">
          <div className="flex-1 bg-white rounded-lg border border-gray-200 shadow-sm relative">
            {/* Interactive Text Editor */}
            <InteractiveTextEditor
              value={localContent}
              onChange={handleContentChange}
              onAnalyze={() => { /* Implement analysis logic here if needed */ }}
              className="h-full"
            />
          </div>

          {/* Submission and Status Bar */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <WritingStatusBar 
                wordCount={currentWordCount}
                targetWordCount={300} // Assuming a default target word count
                status={evaluationStatus}
              />
              {isTimerRunning ? (
                <button 
                  onClick={onPauseTimer} 
                  className="flex items-center text-sm text-red-600 hover:text-red-800 transition-colors duration-200"
                >
                  <PauseCircle className="w-4 h-4 mr-1" />
                  Pause Timer ({formatTime(elapsedTime)})
                </button>
              ) : (
                <button 
                  onClick={onStartTimer} 
                  className="flex items-center text-sm text-green-600 hover:text-green-800 transition-colors duration-200"
                >
                  <PlayCircle className="w-4 h-4 mr-1" />
                  Start Timer ({formatTime(elapsedTime)})
                </button>
              )}
              <button 
                onClick={onResetTimer} 
                className="flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors duration-200"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Reset Timer
              </button>
            </div>
            
            <button
              onClick={handleSubmitForEvaluation}
              disabled={!hasContent || evaluationStatus === 'loading'}
              className={`px-6 py-3 text-white font-bold rounded-md transition-colors duration-300 ${
                !hasContent || evaluationStatus === 'loading' ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {evaluationStatus === 'loading' ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                  Generating NSW Assessment Report...
                </div>
              ) : (
                `Submit for NSW Evaluation (${currentWordCount} words)`
              )}
            </button>
          </div>
          {showWordCountWarning && (
            <p className="text-sm text-red-600 mt-2">
              Note: The NSW evaluation is optimized for responses around 300 words. Longer texts may result in a less accurate assessment.
            </p>
          )}
        </div>
      </div>

      {/* Right Panel - Coach */}
      {panelVisible && (
        <div className="w-1/3 border-l border-gray-200 overflow-y-auto p-4">
          <EnhancedCoachPanel 
            content={localContent}
            textType={textType}
            analysis={analysis}
          />
        </div>
      )}

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

      {/* NSW Evaluation Loading Overlay */}
      {showNSWEvaluation && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 shadow-xl w-full max-w-md text-center">
            <div className="animate-pulse mb-4">
              <Zap className="w-12 h-12 text-blue-500 mx-auto" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">NSW Evaluation in Progress</h2>
            <p className="text-gray-600 mb-6">{evaluationProgress}</p>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${evaluationProgress.length * 10}%` }}></div>
            </div>
          </div>
        </div>
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
}
