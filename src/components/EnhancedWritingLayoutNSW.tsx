// src/components/EnhancedWritingLayoutNSW.tsx - CORRECTED VERSION WITH ORIGINAL LAYOUT AND SCORING FIX

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

  // Convert NSW report format to DetailedFeedback format - WITH SCORING FIX
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

    // If an onSubmit prop is provided, call it, but do not return immediately
    // This allows the fallback submission logic to always execute for NSW Evaluation
    if (onSubmit) {
      console.log('Calling onSubmit prop...');
      onSubmit(localContent);
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
            </div>
          )}
        </div>

        {/* Main Writing Area */}
        <div className="flex-1 flex flex-col p-4 overflow-y-auto">
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

        {/* Bottom Bar - Original Layout */}
        <div className={`flex-shrink-0 border-t p-2 flex items-center justify-between ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'}`}>
          <div className="flex items-center space-x-4">
            {/* Left-aligned buttons */}
            <button onClick={() => setShowPlanningTool(true)} className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition-colors text-sm font-medium ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200'}`}><PenTool className="w-4 h-4" /><span>Plan</span></button>
            <button onClick={onToggleStructureGuide} className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition-colors text-sm font-medium ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200'}`}><BookOpen className="w-4 h-4" /><span>Structure</span></button>
            <button onClick={onToggleTips} className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition-colors text-sm font-medium ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200'}`}><LightbulbIcon className="w-4 h-4" /><span>Tips</span></button>
            <button onClick={onToggleFocus} className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition-colors text-sm font-medium ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200'}`}><Target className="w-4 h-4" /><span>Focus</span></button>
          </div>

          {/* Right-aligned elements: Timer, Word Count, Settings, Submit Button */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Clock className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <span className={`text-sm font-mono ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{formatTime(elapsedTime)}</span>
              {isTimerRunning ? (
                <button onClick={onPauseTimer} title="Pause Timer">{darkMode ? <PauseCircle className="w-5 h-5 text-yellow-400" /> : <PauseCircle className="w-5 h-5 text-yellow-600" />}</button>
              ) : (
                <button onClick={onStartTimer} title="Start Timer">{darkMode ? <PlayCircle className="w-5 h-5 text-green-400" /> : <PlayCircle className="w-5 h-5 text-green-600" />}</button>
              )}
              <button onClick={onResetTimer} title="Reset Timer"><RotateCcw className={`w-4 h-4 ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'}`} /></button>
            </div>
            <div className={`h-6 w-px ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
            <div className="flex items-center space-x-2">
              <FileText className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{currentWordCount} words</span>
              {showWordCountWarning && <AlertCircle className="w-4 h-4 text-yellow-500" title="Word count exceeds recommended limit" />}
            </div>
            <div className={`h-6 w-px ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
            <button onClick={() => setShowSettings(true)} className={`p-2 rounded-full transition-colors ${darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-200'}`}><Settings className="w-5 h-5" /></button>
            
            {/* Submit for NSW Evaluation Button */}
            <button
              onClick={() => handleSubmitForEvaluation()}
              disabled={evaluationStatus === "loading" || !hasContent}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 flex items-center space-x-2 disabled:cursor-not-allowed shadow-lg"
            >
              {evaluationStatus === "loading" ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Evaluating...</span>
                </>
              ) : (
                <>
                  <Target className="w-4 h-4" />
                  <span>Submit for NSW Evaluation</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Right side - Coach Panel */}
      {panelVisible && (
        <div className="w-[380px] flex-shrink-0 border-l overflow-y-auto transition-all duration-300 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}">
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
          onClose={() => {
            setShowReportModal(false);
            setNswReport(null);
            if (onAnalysisChange) onAnalysisChange(null);
          }}
          reportData={nswReport}
          essayContent={localContent}
        />
      )}
      {showPromptOptionsModal && (
        <PromptOptionsModal
          isOpen={showPromptOptionsModal}
          onClose={() => setShowPromptOptionsModal(false)}
          onGeneratePrompt={handleGenerateNewPrompt}
          onCustomPrompt={handleCustomPromptInput}
          textType={textType}
        />
      )}
    </div>
  );
}

export default EnhancedWritingLayoutNSW;
