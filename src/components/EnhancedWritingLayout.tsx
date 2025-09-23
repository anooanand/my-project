import React, { useState, useEffect, useRef } from 'react';

import { PlanningToolModal } from './PlanningToolModal';
import { StructureGuideModal } from './StructureGuideModal';
import { TipsModal } from './TipsModal';
import { TabbedCoachPanel } from './TabbedCoachPanel';
import { NSWStandaloneSubmitSystem } from './NSWStandaloneSubmitSystem';
import { ReportModal } from './ReportModal'; // Import enhanced ReportModal
import type { DetailedFeedback, LintFix } from '../types/feedback';
import { eventBus } from '../lib/eventBus';
import { detectNewParagraphs } from '../lib/paragraphDetection';
import { getRandomPromptForTextType, getDefaultPromptForTextType } from '../lib/textTypePrompts';
import {
  PenTool,
  Play,
  BookOpen,
  Lightbulb as LightbulbIcon,
  Target,
  Eye,
  EyeOff,
  ArrowLeft,
  FileText,
  Clock,
  AlertCircle,
  Award,
  TrendingUp
} from 'lucide-react';

interface EnhancedWritingLayoutProps {
  content: string;
  onChange: (content: string) => void;
  textType: string;
  assistanceLevel: string;
  selectedText: string;
  onTimerStart: (started: boolean) => void;
  onSubmit: (content: string, textType: string) => void;
  onTextTypeChange: (newTextType: string) => void;
  onPopupCompleted: () => void;
  onNavigate: (page: string) => void;
}

export function EnhancedWritingLayout({
  content,
  onChange,
  textType,
  assistanceLevel,
  selectedText,
  onTimerStart,
  onSubmit,
  onTextTypeChange,
  onPopupCompleted,
  onNavigate
}: EnhancedWritingLayoutProps) {
  const [showPlanningTool, setShowPlanningTool] = useState(false);
  const [showStructureGuide, setShowStructureGuide] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [plan, setPlan] = useState('');
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [examMode, setExamMode] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [evaluationStatus, setEvaluationStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  
  // Enhanced NSW Evaluation States
  const [showNSWEvaluation, setShowNSWEvaluation] = useState<boolean>(false);
  const [nswReport, setNswReport] = useState<any>(null);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<DetailedFeedback | null>(null);
  const [wordCount, setWordCount] = useState<number>(0);
  const [evaluationProgress, setEvaluationProgress] = useState<string>("");
  const prevTextRef = useRef<string>("");

  // Typing + paragraph detection
  const onEditorChange = (next: string) => {
    const events = detectNewParagraphs(prevTextRef.current, next);
    if (events.length) eventBus.emit("paragraph.ready", events[events.length - 1]);
    prevTextRef.current = next;
    setLocalContent(next);
    onChange(next);
  };

  // Local content state to ensure we have the latest content
  const [localContent, setLocalContent] = useState<string>(content);

  // Function to get the current prompt from localStorage or fallback
  const getCurrentPrompt = () => {
    try {
      // First check for a custom prompt from "Use My Own Idea"
      const customPrompt = localStorage.getItem("customPrompt");
      if (customPrompt && customPrompt.trim()) {
        console.log("📝 getCurrentPrompt: Using Custom Prompt from localStorage:", customPrompt.substring(0, 50) + "...");
        return customPrompt;
      }

      // Then check for a generated prompt from Magical Prompt
      const magicalPrompt = localStorage.getItem("generatedPrompt");
      if (magicalPrompt && magicalPrompt.trim()) {
        console.log("📝 getCurrentPrompt: Using Magical Prompt from localStorage:", magicalPrompt.substring(0, 50) + "...");
        return magicalPrompt;
      }

      // Check for text-type specific prompt
      const textTypePrompt = localStorage.getItem(`${textType.toLowerCase()}_prompt`);
      if (textTypePrompt && textTypePrompt.trim()) {
        console.log("📝 getCurrentPrompt: Using text-type specific prompt:", textTypePrompt.substring(0, 50) + "...");
        return textTypePrompt;
      }

      // Fallback to text-type appropriate default prompt
      const fallbackPrompt = getDefaultPromptForTextType(textType);
      console.log('📝 Using text-type appropriate fallback prompt for:', textType);
      return fallbackPrompt;
    } catch (error) {
      console.error('Error getting current prompt:', error);
      return getDefaultPromptForTextType(textType);
    }
  };

  // Initialize and sync prompt on component mount and when textType changes
  useEffect(() => {
    const prompt = getCurrentPrompt();
    console.log("🔄 useEffect[textType]: Initializing/Syncing prompt.");
    setCurrentPrompt(prompt);
    console.log("✅ useEffect[textType]: currentPrompt set to:", prompt.substring(0, 50) + "...");
  }, [textType]);

  // Listen for localStorage changes (from other tabs/components)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      console.log('📡 handleStorageChange: Storage event detected. Key:', e.key, 'New Value:', e.newValue?.substring(0, 50) + '...');
      if (e.key === 'customPrompt' || e.key === 'generatedPrompt' || e.key === `${textType.toLowerCase()}_prompt`) {
        console.log('📡 handleStorageChange: Relevant storage key changed. Updating prompt.');
        const newPrompt = getCurrentPrompt();
        setCurrentPrompt(newPrompt);
        console.log('✅ handleStorageChange: currentPrompt set to:', newPrompt.substring(0, 50) + '...');
      }
    };

    // Listen for custom events from Magical Prompt generation
    const handlePromptGenerated = (event: CustomEvent) => {
      console.log("🎯 handlePromptGenerated: Custom event received. Detail:", event.detail);
      const newPrompt = getCurrentPrompt();
      setCurrentPrompt(newPrompt);
      console.log("✅ handlePromptGenerated: currentPrompt set to:", newPrompt.substring(0, 50) + "...");
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('promptGenerated', handlePromptGenerated as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('promptGenerated', handlePromptGenerated as EventListener);
    };
  }, [textType, evaluationStatus]);

  // Sync local content with prop content
  useEffect(() => {
    setLocalContent(content);
  }, [content]);

  // Track content changes for word count and coach feedback
  useEffect(() => {
    const currentContent = localContent || content;
    const words = currentContent.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);

    // Trigger coach feedback for new paragraphs
    const events = detectNewParagraphs(prevTextRef.current, currentContent);
    if (events.length) {
      console.log("Emitting paragraph.ready event:", events[events.length - 1]);
      eventBus.emit("paragraph.ready", events[events.length - 1]);
    }
    prevTextRef.current = currentContent;
  }, [localContent, content]);

  // Enhanced NSW Evaluation Submit Handler
  const handleNSWSubmit = async (submittedContent?: string, submittedTextType?: string) => {
    const contentToEvaluate = submittedContent || localContent;
    const typeToEvaluate = submittedTextType || textType;

    console.log("🎯 NSW Submit triggered from EnhancedWritingLayout");
    console.log("Content check:", {
      localContent: contentToEvaluate?.substring(0, 50) + "...",
      propContent: content?.substring(0, 50) + "...",
      hasContent: !!contentToEvaluate?.trim(),
      contentLength: contentToEvaluate?.length || 0
    });

    setEvaluationStatus("loading");
    setShowNSWEvaluation(true);
    setEvaluationProgress("Analyzing your writing...");

    try {
      if (!contentToEvaluate || contentToEvaluate.trim().length === 0) {
        throw new Error("Please write some content before submitting for evaluation");
      }

      console.log("NSW Evaluation initiated for:", {
        text: contentToEvaluate.substring(0, 100) + "...",
        textType: typeToEvaluate,
        wordCount
      });

      // Simulate progress updates for better user experience
      setTimeout(() => setEvaluationProgress("Evaluating ideas and creativity..."), 1000);
      setTimeout(() => setEvaluationProgress("Checking structure and organization..."), 2000);
      setTimeout(() => setEvaluationProgress("Analyzing language and vocabulary..."), 3000);
      setTimeout(() => setEvaluationProgress("Reviewing spelling and grammar..."), 4000);
      setTimeout(() => setEvaluationProgress("Generating your personalized report..."), 5000);

    } catch (e: any) {
      console.error("NSW Submit error:", e);
      setEvaluationStatus("error");
      setShowNSWEvaluation(false);
      setEvaluationProgress("");
    }
  };

  // Enhanced NSW evaluation completion handler
  const handleNSWEvaluationComplete = (report: any) => {
    console.log("NSW Evaluation completed:", report);
    setNswReport(report);
    setEvaluationStatus("success");
    setShowNSWEvaluation(false);
    setEvaluationProgress("");
    setShowReportModal(true);
    
    // Convert NSW report to DetailedFeedback format for compatibility with enhanced ReportModal
    const convertedAnalysis: DetailedFeedback = {
      overallScore: report.overallScore || 0,
      criteria: {
        ideasContent: {
          score: Math.round((report.domains?.contentAndIdeas?.score || 0) / 2), // Convert from 10-point to 5-point scale
          weight: report.domains?.contentAndIdeas?.weight || 40,
          strengths: report.strengths?.filter((s: any) => s.area === "Creative Ideas") || 
                    [{ text: report.domains?.contentAndIdeas?.feedback?.[0] || "Good content development" }],
          improvements: report.areasForImprovement?.filter((i: any) => i.area === "Ideas & Content") || []
        },
        structureOrganization: {
          score: Math.round((report.domains?.textStructure?.score || 0) / 2),
          weight: report.domains?.textStructure?.weight || 20,
          strengths: report.strengths?.filter((s: any) => s.area === "Story Organization") || 
                    [{ text: report.domains?.textStructure?.feedback?.[0] || "Clear structure" }],
          improvements: report.areasForImprovement?.filter((i: any) => i.area === "Structure & Organization") || []
        },
        languageVocab: {
          score: Math.round((report.domains?.languageFeatures?.score || 0) / 2),
          weight: report.domains?.languageFeatures?.weight || 25,
          strengths: report.strengths?.filter((s: any) => s.area === "Word Choice") || 
                    [{ text: report.domains?.languageFeatures?.feedback?.[0] || "Good language use" }],
          improvements: report.areasForImprovement?.filter((i: any) => i.area === "Language & Vocabulary") || []
        },
        spellingPunctuationGrammar: {
          score: Math.round((report.domains?.spellingAndGrammar?.score || 0) / 2),
          weight: report.domains?.spellingAndGrammar?.weight || 15,
          strengths: report.strengths?.filter((s: any) => s.area === "Writing Mechanics") || 
                    [{ text: report.domains?.spellingAndGrammar?.feedback?.[0] || "Accurate conventions" }],
          improvements: report.areasForImprovement?.filter((i: any) => i.area.includes("Grammar") || i.area.includes("Spelling")) || []
        }
      },
      grammarCorrections: report.grammarCorrections || [],
      vocabularyEnhancements: report.vocabularyEnhancements || [],
      id: report.id || `nsw-${Date.now()}`,
      assessmentId: report.assessmentId
    };
    
    setAnalysis(convertedAnalysis);
  };

  const handleSubmitForEvaluation = async (contentToSubmit: string, typeToSubmit: string) => {
    await handleNSWSubmit(contentToSubmit, typeToSubmit);
  };

  const handleApplyFix = (fix: LintFix) => {
    // Apply text fixes to content
    console.log('Applying fix:', fix);
  };

  const handleCloseReportModal = () => {
    setShowReportModal(false);
    setNswReport(null);
    setAnalysis(null);
    setEvaluationStatus("idle");
  };

  const handleCloseNSWEvaluation = () => {
    setShowNSWEvaluation(false);
    setEvaluationStatus("idle");
    setEvaluationProgress("");
  };

  // Check if word count exceeds target
  const showWordCountWarning = wordCount > 300;

  // Check if we have content for submit button
  const currentContent = localContent || content;
  const hasContent = currentContent && currentContent.trim().length > 0;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* OPTIMIZED LAYOUT - Full width utilization, no wasted space */}
      
      {/* Left side - Writing Area Content - Optimized for maximum space */}
      <div className="flex-1 flex flex-col min-w-0 max-w-none"> 
        {/* Enhanced Writing Prompt Section - Compact */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 p-3 shadow-sm">
          <div className="flex items-center mb-2">
            <LightbulbIcon className="w-5 h-5 mr-2 text-blue-600" />
            <h3 className="font-bold text-blue-800 text-base">Your Writing Prompt</h3>
            <div className="ml-auto flex items-center space-x-2">
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                {textType}
              </span>
            </div>
          </div>
          <p className="text-blue-700 leading-relaxed text-sm">
            {currentPrompt}
          </p>
        </div>

        {/* Enhanced Action Buttons and Stats Section - Compact */}
        <div className="bg-white border-b border-gray-200 p-3 shadow-sm">
          <div className="flex justify-between items-center">
            {/* Left side - Action Buttons - Compact */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowPlanningTool(true)}
                className="flex items-center space-x-1 px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium shadow-sm"
                title="Plan your writing structure and ideas"
              >
                <PenTool className="w-3 h-3" />
                <span>Plan</span>
              </button>
              
              <button
                onClick={() => setExamMode(!examMode)}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium shadow-sm ${
                  examMode 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
                title="Toggle exam simulation mode"
              >
                <Play className="w-3 h-3" />
                <span>{examMode ? 'Exit' : 'Exam'}</span>
              </button>
              
              <button
                onClick={() => setShowStructureGuide(true)}
                className="flex items-center space-x-1 px-3 py-1.5 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm font-medium shadow-sm"
                title="Learn about story structure and organization"
              >
                <BookOpen className="w-3 h-3" />
                <span>Guide</span>
              </button>
              
              <button
                onClick={() => setShowTips(true)}
                className="flex items-center space-x-1 px-3 py-1.5 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm font-medium shadow-sm"
                title="Get helpful writing tips and techniques"
              >
                <LightbulbIcon className="w-3 h-3" />
                <span>Tips</span>
              </button>
              
              <button
                onClick={() => setFocusMode(!focusMode)}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium shadow-sm ${
                  focusMode 
                    ? 'bg-gray-700 text-white hover:bg-gray-800' 
                    : 'bg-gray-600 text-white hover:bg-gray-700'
                }`}
                title="Toggle distraction-free writing mode"
              >
                {focusMode ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{focusMode ? 'Exit' : 'Focus'}</span>
              </button>
            </div>

            {/* Right side - Enhanced Writing Statistics - Compact */}
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <FileText className="w-4 h-4 text-gray-500" />
                <span className="font-medium">{wordCount} words</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="font-medium">0:00</span>
              </div>
              {showWordCountWarning && (
                <div className="flex items-center space-x-1 text-orange-500">
                  <AlertCircle className="w-3 h-3" />
                  <span className="text-xs font-medium">High!</span>
                </div>
              )}
              {evaluationStatus === "success" && (
                <div className="flex items-center space-x-1 text-green-600">
                  <Award className="w-4 h-4" />
                  <span className="text-xs font-medium">Evaluated</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Text Editor Section - Full height utilization */}
        <div className="flex-1 bg-white">
          <textarea
            className={`w-full h-full p-4 resize-none focus:outline-none transition-all duration-300 ${
              focusMode 
                ? 'text-lg leading-relaxed bg-gray-50 focus:bg-white' 
                : 'text-base leading-normal'
            }`}
            placeholder={focusMode 
              ? "Focus on your writing. Let your thoughts flow freely..." 
              : "Start writing your amazing story here! Let your creativity flow and bring your ideas to life…"
            }
            value={localContent}
            onChange={(e) => onEditorChange(e.target.value)}
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: focusMode ? '18px' : '16px',
              lineHeight: focusMode ? '1.7' : '1.6',
              letterSpacing: '0.01em'
            }}
          />
        </div>

        {/* Submit Button - Compact */}
        <div className="bg-white border-t border-gray-200 p-3">
          <button
            onClick={() => handleSubmitForEvaluation(localContent, textType)}
            disabled={!hasContent || evaluationStatus === "loading"}
            className={`w-full px-6 py-3 rounded-lg text-white font-semibold shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 ${
              hasContent && evaluationStatus !== "loading"
                ? "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            {evaluationStatus === "loading" ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Evaluating...</span>
              </>
            ) : (
              <>
                <Target className="w-5 h-5" />
                <span>Submit for Evaluation</span>
              </>
            )}
          </button>
        </div>

        {/* Evaluation Progress Overlay */}
        {showNSWEvaluation && evaluationStatus === "loading" && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
            <div className="text-center bg-white p-8 rounded-lg shadow-xl max-w-md">
              <div className="animate-spin mx-auto h-12 w-12 border-4 border-purple-600 border-t-transparent rounded-full mb-4"></div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Evaluating Your Writing</h3>
              <p className="text-lg font-medium text-gray-700 mb-4">{evaluationProgress}</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                  style={{ 
                    width: evaluationProgress.includes("Analyzing") ? "20%" :
                           evaluationProgress.includes("Evaluating") ? "40%" :
                           evaluationProgress.includes("Checking") ? "60%" :
                           evaluationProgress.includes("language") ? "80%" :
                           evaluationProgress.includes("Generating") ? "100%" : "0%"
                  }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                We're creating a detailed, personalized report just for you!
              </p>
              <button
                onClick={handleCloseNSWEvaluation}
                className="px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Enhanced Report Modal */}
        {showReportModal && analysis && (
          <ReportModal
            isOpen={showReportModal}
            onClose={handleCloseReportModal}
            data={analysis}
            onApplyFix={handleApplyFix}
            studentName="Student"
            essayText={currentContent}
          />
        )}

        {/* Modals */}
        {showPlanningTool && (
          <PlanningToolModal
            isOpen={showPlanningTool}
            onClose={() => setShowPlanningTool(false)}
            textType={textType}
            plan={plan}
            onPlanChange={setPlan}
          />
        )}

        {showStructureGuide && (
          <StructureGuideModal
            isOpen={showStructureGuide}
            onClose={() => setShowStructureGuide(false)}
            textType={textType}
          />
        )}

        {showTips && (
          <TipsModal
            isOpen={showTips}
            onClose={() => setShowTips(false)}
            textType={textType}
          />
        )}

        {/* NSW Standalone Submit System */}
        {showNSWEvaluation && (
          <NSWStandaloneSubmitSystem
            content={currentContent}
            textType={textType}
            onComplete={handleNSWEvaluationComplete}
            onClose={handleCloseNSWEvaluation}
          />
        )}
      </div>

      {/* Right side - Tabbed Coach Panel - Optimized fixed width */}
      <div className="w-96 border-l border-gray-200 flex-shrink-0">
        <TabbedCoachPanel
          content={localContent}
          textType={textType}
          assistanceLevel={assistanceLevel}
          selectedText={selectedText}
          onApplyFix={handleApplyFix}
        />
      </div>
    </div>
  );
}
