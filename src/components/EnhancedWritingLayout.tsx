import React, { useState, useEffect, useRef } from 'react';
import { WritingArea } from './WritingArea';
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

  // Local content state to ensure we have the latest content
  const [localContent, setLocalContent] = useState<string>(content);

  // FIXED: Function to get the current prompt based on user's selection
  const getCurrentPrompt = () => {
    try {
      // First check what type of prompt the user last selected
      const promptType = localStorage.getItem("promptType");
      console.log("📝 getCurrentPrompt: Checking promptType:", promptType);

      // If user selected "generated" (Magical Prompt), prioritize generatedPrompt
      if (promptType === "generated") {
        const magicalPrompt = localStorage.getItem("generatedPrompt");
        if (magicalPrompt && magicalPrompt.trim()) {
          console.log("📝 getCurrentPrompt: Using Magical Prompt from localStorage:", magicalPrompt.substring(0, 50) + "...");
          return magicalPrompt;
        }
      }

      // If user selected "custom" (Use My Own Idea), prioritize customPrompt
      if (promptType === "custom") {
        const customPrompt = localStorage.getItem("customPrompt");
        if (customPrompt && customPrompt.trim()) {
          console.log("📝 getCurrentPrompt: Using Custom Prompt from localStorage:", customPrompt.substring(0, 50) + "...");
          return customPrompt;
        }
      }

      // Fallback logic: check for any available prompt
      // First check for a generated prompt from Magical Prompt
      const magicalPrompt = localStorage.getItem("generatedPrompt");
      if (magicalPrompt && magicalPrompt.trim()) {
        console.log("📝 getCurrentPrompt: Using Magical Prompt from localStorage (fallback):", magicalPrompt.substring(0, 50) + "...");
        return magicalPrompt;
      }

      // Then check for a custom prompt from "Use My Own Idea"
      const customPrompt = localStorage.getItem("customPrompt");
      if (customPrompt && customPrompt.trim()) {
        console.log("📝 getCurrentPrompt: Using Custom Prompt from localStorage (fallback):", customPrompt.substring(0, 50) + "...");
        return customPrompt;
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

  // FIXED: Enhanced event listeners for prompt updates
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      console.log('📡 handleStorageChange: Storage event detected. Key:', e.key, 'New Value:', e.newValue?.substring(0, 50) + '...');
      if (e.key === 'customPrompt' || e.key === 'generatedPrompt' || e.key === 'promptType' || e.key === `${textType.toLowerCase()}_prompt`) {
        console.log('📡 handleStorageChange: Relevant storage key changed. Updating prompt.');
        const newPrompt = getCurrentPrompt();
        setCurrentPrompt(newPrompt);
        console.log('✅ handleStorageChange: currentPrompt set to:', newPrompt.substring(0, 50) + '...');
      }
    };

    // Listen for custom events from Magical Prompt generation
    const handlePromptGenerated = (event: CustomEvent) => {
      console.log("🎯 handlePromptGenerated: Custom event received. Detail:", event.detail);
      // When a magical prompt is generated, clear any existing custom prompt to avoid conflicts
      localStorage.removeItem("customPrompt");
      localStorage.setItem("promptType", "generated");
      const newPrompt = getCurrentPrompt();
      setCurrentPrompt(newPrompt);
      console.log("✅ handlePromptGenerated: currentPrompt set to:", newPrompt.substring(0, 50) + "...");
    };

    // FIXED: Listen for custom prompt creation events
    const handleCustomPromptCreated = (event: CustomEvent) => {
      console.log("✏️ handleCustomPromptCreated: Custom event received. Detail:", event.detail);
      // When a custom prompt is created, clear any existing generated prompt to avoid conflicts
      localStorage.removeItem("generatedPrompt");
      localStorage.setItem("promptType", "custom");
      const newPrompt = getCurrentPrompt();
      setCurrentPrompt(newPrompt);
      console.log("✅ handleCustomPromptCreated: currentPrompt set to:", newPrompt.substring(0, 50) + "...");
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('promptGenerated', handlePromptGenerated as EventListener);
    window.addEventListener('customPromptCreated', handleCustomPromptCreated as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('promptGenerated', handlePromptGenerated as EventListener);
      window.removeEventListener('customPromptCreated', handleCustomPromptCreated as EventListener);
    };
  }, [textType, evaluationStatus]);

  // Sync local content with prop content
  useEffect(() => {
    setLocalContent(content);
  }, [content]);

  // Handle content changes from WritingArea
  const handleContentChange = (newContent: string) => {
    setLocalContent(newContent);
    onChange(newContent);
  };

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
      {/* Left side - Writing Area Content */}
      <div className="flex-[7] flex flex-col min-w-0"> 
        {/* Enhanced Writing Prompt Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-5 mb-4 mx-4 mt-4 shadow-sm">
          <div className="flex items-center mb-3">
            <LightbulbIcon className="w-6 h-6 mr-3 text-blue-600" />
            <h3 className="font-bold text-blue-800 text-lg">Your Writing Prompt</h3>
            <div className="ml-auto flex items-center space-x-2">
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                {textType}
              </span>
            </div>
          </div>
          <p className="text-blue-700 leading-relaxed">
            {currentPrompt}
          </p>
        </div>

        {/* Enhanced Action Buttons and Stats Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 mx-4 shadow-sm">
          <div className="flex justify-between items-center">
            {/* Left side - Action Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowPlanningTool(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium shadow-sm"
                title="Plan your writing structure and ideas"
              >
                <PenTool className="w-4 h-4" />
                <span>Planning</span>
              </button>
              
              <button
                onClick={() => setExamMode(!examMode)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium shadow-sm ${
                  examMode 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
                title="Toggle exam simulation mode"
              >
                <Play className="w-4 h-4" />
                <span>{examMode ? 'Exit Exam' : 'Exam Mode'}</span>
              </button>
              
              <button
                onClick={() => setShowStructureGuide(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm font-medium shadow-sm"
                title="Learn about story structure and organization"
              >
                <BookOpen className="w-4 h-4" />
                <span>Structure</span>
              </button>
              
              <button
                onClick={() => setShowTips(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm font-medium shadow-sm"
                title="Get helpful writing tips and techniques"
              >
                <LightbulbIcon className="w-4 h-4" />
                <span>Tips</span>
              </button>
              
              <button
                onClick={() => setFocusMode(!focusMode)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium shadow-sm ${
                  focusMode 
                    ? 'bg-gray-700 text-white hover:bg-gray-800' 
                    : 'bg-gray-600 text-white hover:bg-gray-700'
                }`}
                title="Toggle distraction-free writing mode"
              >
                {focusMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span>{focusMode ? 'Exit Focus' : 'Focus Mode'}</span>
              </button>
            </div>

            {/* Right side - Enhanced Stats and Submit */}
            <div className="flex items-center space-x-4">
              {/* Word Count with Warning */}
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium ${
                showWordCountWarning 
                  ? 'bg-red-100 text-red-700 border border-red-200' 
                  : 'bg-gray-100 text-gray-700 border border-gray-200'
              }`}>
                <FileText className="w-4 h-4" />
                <span>{wordCount} words</span>
                {showWordCountWarning && (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
              </div>

              {/* Submit Button */}
              <button
                onClick={() => handleSubmitForEvaluation(currentContent, textType)}
                disabled={!hasContent || evaluationStatus === "loading"}
                className={`flex items-center space-x-2 px-6 py-2 rounded-lg text-sm font-medium shadow-sm transition-all ${
                  hasContent && evaluationStatus !== "loading"
                    ? 'bg-green-600 text-white hover:bg-green-700 transform hover:scale-105'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                title={hasContent ? "Submit your writing for NSW evaluation" : "Write some content first"}
              >
                {evaluationStatus === "loading" ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Evaluating...</span>
                  </>
                ) : (
                  <>
                    <Award className="w-4 h-4" />
                    <span>Submit for Evaluation</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Writing Area */}
        <div className="flex-1 mx-4 mb-4">
          <WritingArea
            content={currentContent}
            onChange={handleContentChange}
            textType={textType}
            assistanceLevel={assistanceLevel}
            selectedText={selectedText}
            onTimerStart={onTimerStart}
            examMode={examMode}
            focusMode={focusMode}
            showWordCount={true}
            wordCount={wordCount}
            showWordCountWarning={showWordCountWarning}
          />
        </div>
      </div>

      {/* Right side - Coach Panel */}
      {!focusMode && (
        <div className="flex-[3] min-w-[300px] max-w-[400px] border-l border-gray-200 bg-white">
          <TabbedCoachPanel
            content={currentContent}
            textType={textType}
            assistanceLevel={assistanceLevel}
            selectedText={selectedText}
            onNavigate={onNavigate}
          />
        </div>
      )}

      {/* NSW Evaluation Loading Modal */}
      {showNSWEvaluation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-white animate-pulse" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">NSW Evaluation in Progress</h3>
              <p className="text-gray-600 mb-4">{evaluationProgress}</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
              </div>
            </div>
            <div className="flex justify-center">
              <button
                onClick={handleCloseNSWEvaluation}
                className="mt-4 px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
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
  );
}
