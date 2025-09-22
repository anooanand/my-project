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
      // Check promptType to determine which prompt to use
      const promptType = localStorage.getItem("promptType");
      console.log("📝 getCurrentPrompt: promptType from localStorage:", promptType);

      // If promptType is 'generated', prioritize generatedPrompt
      if (promptType === 'generated') {
        const magicalPrompt = localStorage.getItem("generatedPrompt");
        if (magicalPrompt && magicalPrompt.trim()) {
          console.log("📝 getCurrentPrompt: Using Magical Prompt (prioritized by promptType):", magicalPrompt.substring(0, 50) + "...");
          return magicalPrompt;
        }
      }

      // If promptType is 'custom', prioritize customPrompt
      if (promptType === 'custom') {
        const customPrompt = localStorage.getItem("customPrompt");
        if (customPrompt && customPrompt.trim()) {
          console.log("📝 getCurrentPrompt: Using Custom Prompt (prioritized by promptType):", customPrompt.substring(0, 50) + "...");
          return customPrompt;
        }
      }

      // Fallback order when no specific promptType or prompts are missing
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
    setCurrentPrompt(prompt);
    console.log("✅ useEffect[textType]: currentPrompt set to:", prompt.substring(0, 50) + "...");
  }, [textType]);

  // Listen for localStorage changes (from other tabs/components)
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
  }, [textType]);

  // Sync local content with prop content
  useEffect(() => {
    setLocalContent(content);
  }, [content]);

  // Enhanced content change handler with real-time analysis
  const handleContentChange = (newContent: string) => {
    setLocalContent(newContent);
    onChange(newContent);

    // Update word count
    const words = newContent.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);

    // Detect new paragraphs for coaching
    const newParagraphs = detectNewParagraphs(prevTextRef.current, newContent);
    if (newParagraphs.length > 0) {
      eventBus.emit('newParagraphsDetected', { paragraphs: newParagraphs, textType });
    }
    prevTextRef.current = newContent;
  };

  // Enhanced submission handler with NSW evaluation
  const handleSubmitForEvaluation = async (submissionContent: string, submissionTextType: string) => {
    console.log('🎯 handleSubmitForEvaluation called with:', {
      contentLength: submissionContent.length,
      textType: submissionTextType,
      currentStatus: evaluationStatus
    });

    if (evaluationStatus === "loading") {
      console.log('⚠️ Already evaluating, skipping...');
      return;
    }

    if (!submissionContent.trim()) {
      console.log('⚠️ No content to evaluate');
      return;
    }

    setEvaluationStatus("loading");
    setShowNSWEvaluation(true);
    setEvaluationProgress("Analyzing your writing structure...");

    try {
      // Simulate evaluation progress
      const progressSteps = [
        "Analyzing your writing structure...",
        "Evaluating content quality...",
        "Checking grammar and style...",
        "Assessing language techniques...",
        "Generating personalized feedback..."
      ];

      for (let i = 0; i < progressSteps.length; i++) {
        setEvaluationProgress(progressSteps[i]);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Call the original onSubmit function
      await onSubmit(submissionContent, submissionTextType);
      
      setEvaluationStatus("success");
      console.log('✅ Evaluation completed successfully');
      
    } catch (error) {
      console.error('❌ Evaluation failed:', error);
      setEvaluationStatus("error");
    } finally {
      setShowNSWEvaluation(false);
    }
  };

  // Handle NSW evaluation completion
  const handleNSWEvaluationComplete = (report: any) => {
    console.log('📊 NSW Evaluation completed:', report);
    setNswReport(report);
    setAnalysis(report);
    setShowNSWEvaluation(false);
    setShowReportModal(true);
    setEvaluationStatus("success");
  };

  // Handle closing NSW evaluation
  const handleCloseNSWEvaluation = () => {
    setShowNSWEvaluation(false);
    setEvaluationStatus("idle");
  };

  // Handle closing report modal
  const handleCloseReportModal = () => {
    setShowReportModal(false);
  };

  // Handle applying fixes from analysis
  const handleApplyFix = (fix: LintFix) => {
    console.log('🔧 Applying fix:', fix);
    const newContent = localContent.slice(0, fix.start) + fix.replacement + localContent.slice(fix.end);
    handleContentChange(newContent);
  };

  // Calculate current content for operations
  const currentContent = localContent || content;
  const hasContent = currentContent.trim().length > 0;
  const showWordCountWarning = wordCount > 300; // Adjust threshold as needed

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Left side - Enhanced Writing Interface */}
      <div className="flex-1 flex flex-col">
        {/* Compact Header with Tools */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left side - Navigation and Tools */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => onNavigate('dashboard')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="font-medium">Back</span>
              </button>

              <div className="h-6 w-px bg-gray-300"></div>

              {/* Enhanced Tool Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowPlanningTool(true)}
                  className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <PenTool className="w-4 h-4" />
                  <span>Planning</span>
                </button>

                <button
                  onClick={() => setShowStructureGuide(true)}
                  className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Structure</span>
                </button>

                <button
                  onClick={() => setShowTips(true)}
                  className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-yellow-600 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors"
                >
                  <LightbulbIcon className="w-4 h-4" />
                  <span>Tips</span>
                </button>

                <button
                  onClick={() => setFocusMode(!focusMode)}
                  className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                >
                  {focusMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  <span>{focusMode ? 'Exit Focus' : 'Focus Mode'}</span>
                </button>
              </div>
            </div>

            {/* Right side - Enhanced Writing Statistics */}
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-blue-500" />
                <span className="font-medium">{wordCount} words</span>
                {showWordCountWarning && (
                  <div className="flex items-center space-x-1 text-orange-600">
                    <AlertCircle className="w-4 h-4" />
                    <span className="font-medium text-xs">Over target!</span>
                  </div>
                )}
              </div>

              {evaluationStatus === "success" && (
                <div className="flex items-center space-x-1 text-green-600">
                  <Award className="w-4 h-4" />
                  <span className="font-medium text-xs">Evaluated</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Writing Area - Full height utilization */}
        <div className="flex-1 bg-white">
          <WritingArea
            content={currentContent}
            onChange={handleContentChange}
            onSubmit={handleSubmitForEvaluation}
            textType={textType}
            assistanceLevel={assistanceLevel}
            selectedText={selectedText}
            onTimerStart={onTimerStart}
            onTextTypeChange={onTextTypeChange}
            onPopupCompleted={onPopupCompleted}
            onNavigate={onNavigate}
            evaluationStatus={evaluationStatus}
            examMode={examMode}
            focusMode={focusMode}
            hidePromptAndSubmit={true}
            prompt={currentPrompt}
            onPromptGenerated={setCurrentPrompt}
          />
        </div>

        {/* Enhanced Submit Button - Compact */}
        <div className="bg-white border-t border-gray-200 p-3">
          <button
            onClick={() => handleSubmitForEvaluation(currentContent, textType)}
            disabled={evaluationStatus === "loading" || !hasContent}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 disabled:cursor-not-allowed shadow-lg"
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
          
          {!hasContent && (
            <p className="text-center text-gray-500 text-sm mt-2">
              Start writing to unlock your personalized assessment report
            </p>
          )}
        </div>
      </div>

      {/* Right side - Coach Panel - Optimized width (hidden in focus mode) */}
      {!focusMode && (
        <div className="w-96 border-l border-gray-200 bg-white flex flex-col">
          <TabbedCoachPanel 
            analysis={analysis} 
            onApplyFix={handleApplyFix}
            content={currentContent}
            textType={textType}
          />
        </div>
      )}

      {/* NSW Evaluation Loading Modal */}
      {showNSWEvaluation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Evaluating Your Writing
              </h3>
              <p className="text-gray-600 mb-4">{evaluationProgress}</p>
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
              <p className="text-sm text-gray-500">
                We're creating a detailed, personalized report just for you!
              </p>
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