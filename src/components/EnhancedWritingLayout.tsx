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

  // Function to get the current prompt from localStorage or fallback
  const getCurrentPrompt = () => {
    try {
      const promptType = localStorage.getItem("promptType");

      // If promptType is 'generated', prioritize generatedPrompt
      if (promptType === 'generated') {
        const magicalPrompt = localStorage.getItem("generatedPrompt");
        if (magicalPrompt && magicalPrompt.trim()) {
          console.log("📝 getCurrentPrompt: Using Magical Prompt from localStorage:", magicalPrompt.substring(0, 50) + "...");
          return magicalPrompt; // Magical prompt gets priority!
        }
      }

      // If promptType is 'custom', prioritize customPrompt  
      if (promptType === 'custom') {
        const customPrompt = localStorage.getItem("customPrompt");
        if (customPrompt && customPrompt.trim()) {
          console.log("📝 getCurrentPrompt: Using Custom Prompt from localStorage:", customPrompt.substring(0, 50) + "...");
          return customPrompt; // Custom prompt gets priority!
        }
      }

      // Check for text-type specific prompt
      const textTypePrompt = localStorage.getItem(`${textType.toLowerCase()}_prompt`);
      if (textTypePrompt && textTypePrompt.trim()) {
        console.log("📝 getCurrentPrompt: Using text-type specific prompt:", textTypePrompt.substring(0, 50) + "...");
        return textTypePrompt;
      }

      // Fallback to default prompt
      const fallbackPrompt = "The Secret Door in the Library: During a rainy afternoon, you decide to explore the dusty old library in your town that you've never visited before. As you wander through the aisles, you discover a hidden door behind a bookshelf. It's slightly ajar, and a faint, warm light spills out from the crack. What happens when you push the door open? Describe the world you enter and the adventures that await you inside. Who do you meet, and what challenges do you face? How does this experience change you by the time you return to the library? Let your imagination run wild as you take your reader on a journey through this mysterious door!";
      console.log('📝 Using fallback prompt');
      return fallbackPrompt;
    } catch (error) {
      console.error('Error getting current prompt:', error);
      return "Write an engaging story that captures your reader's imagination.";
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

    // Listen for custom prompt creation events
    const handleCustomPromptCreated = (event: CustomEvent) => {
      console.log("✏️ handleCustomPromptCreated: Custom prompt event received. Detail:", event.detail);
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
                title="Get writing tips and advice"
              >
                <LightbulbIcon className="w-4 h-4" />
                <span>Tips</span>
              </button>
            </div>

            {/* Right side - Stats and Focus Mode */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1 text-gray-600">
                <FileText className="w-4 h-4" />
                <span className="text-sm font-medium">Words: {wordCount}</span>
              </div>
              <div className="flex items-center space-x-1 text-gray-600">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">Time: 00:00</span> {/* Placeholder for timer */}
              </div>
              <button
                onClick={() => setFocusMode(!focusMode)}
                className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                title={focusMode ? "Exit Focus Mode" : "Enter Focus Mode"}
              >
                {focusMode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          {showWordCountWarning && (
            <div className="mt-3 flex items-center text-orange-600 text-sm font-medium">
              <AlertCircle className="w-4 h-4 mr-2" />
              <span>Warning: Your word count ({wordCount}) is getting high. Consider editing for conciseness.</span>
            </div>
          )}
        </div>

        {/* Writing Area */}
        <div className="flex-1 mx-4 mb-4 overflow-hidden rounded-lg shadow-lg">
          <WritingArea
            content={localContent}
            onChange={handleContentChange}
            assistanceLevel={assistanceLevel}
            selectedText={selectedText}
            examMode={examMode}
            focusMode={focusMode}
          />
        </div>

        {/* Submit Button and Evaluation Status */}
        <div className="bg-white border-t border-gray-200 p-4 flex justify-between items-center shadow-inner">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>

          <div className="flex items-center space-x-3">
            {evaluationStatus === "loading" && (
              <div className="flex items-center text-blue-600 text-sm font-medium">
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{evaluationProgress}</span>
              </div>
             )}
            {evaluationStatus === "success" && (
              <div className="flex items-center text-green-600 text-sm font-medium">
                <Award className="w-4 h-4 mr-2" />
                <span>Evaluation Complete!</span>
              </div>
            )}
            {evaluationStatus === "error" && (
              <div className="flex items-center text-red-600 text-sm font-medium">
                <AlertCircle className="w-4 h-4 mr-2" />
                <span>Evaluation Failed. Please try again.</span>
              </div>
            )}
            <button
              onClick={() => handleSubmitForEvaluation(localContent, textType)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg text-white font-bold text-lg transition-colors shadow-md ${
                hasContent && evaluationStatus !== "loading"
                  ? 'bg-indigo-600 hover:bg-indigo-700'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
              disabled={!hasContent || evaluationStatus === "loading"}
            >
              <TrendingUp className="w-5 h-5" />
              <span>Submit for Evaluation</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right side - Coach Panel */}
      <div className="flex-[3] min-w-[300px] max-w-[400px] border-l border-gray-200 bg-white flex flex-col">
        <TabbedCoachPanel
          content={localContent}
          textType={textType}
          assistanceLevel={assistanceLevel}
          selectedText={selectedText}
          onApplyFix={handleApplyFix}
          onNSWEvaluationComplete={handleNSWEvaluationComplete}
          evaluationStatus={evaluationStatus}
          evaluationProgress={evaluationProgress}
        />
      </div>

      {/* Modals */}
      <PlanningToolModal
        isOpen={showPlanningTool}
        onClose={() => setShowPlanningTool(false)}
        onSavePlan={setPlan}
        initialPlan={plan}
        currentPrompt={currentPrompt}
      />
      <StructureGuideModal
        isOpen={showStructureGuide}
        onClose={() => setShowStructureGuide(false)}
        textType={textType}
      />
      <TipsModal
        isOpen={showTips}
        onClose={() => setShowTips(false)}
      />
      <NSWStandaloneSubmitSystem
        isOpen={showNSWEvaluation}
        onClose={handleCloseNSWEvaluation}
        content={localContent}
        textType={textType}
        onEvaluationComplete={handleNSWEvaluationComplete}
        evaluationStatus={evaluationStatus}
        evaluationProgress={evaluationProgress}
      />
      <ReportModal
        isOpen={showReportModal}
        onClose={handleCloseReportModal}
        analysis={analysis}
        nswReport={nswReport}
      />
    </div>
  );
}
