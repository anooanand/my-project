import React, { useState, useEffect, useRef } from 'react';
import { WritingArea } from './WritingArea';
import { PlanningToolModal } from './PlanningToolModal';
import { StructureGuideModal } from './StructureGuideModal';
import { TipsModal } from './TipsModal';
import { TabbedCoachPanel } from './TabbedCoachPanel';
import { NSWStandaloneSubmitSystem } from './NSWStandaloneSubmitSystem';
import { ReportModal } from './ReportModal'; // Import ReportModal
import type { DetailedFeedback, LintFix } from '../types/feedback';
import { eventBus } from '../lib/eventBus';
import { detectNewParagraphs } from '../lib/paragraphDetection';
import {
  PenTool,
  Play,
  BookOpen,
  Lightbulb as LightbulbIcon, // Changed Lightbulb to LightbulbIcon
  Target,
  Eye,
  EyeOff,
  ArrowLeft,
  FileText,
  Clock,
  AlertCircle
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
  
  // NSW Evaluation States
  const [showNSWEvaluation, setShowNSWEvaluation] = useState<boolean>(false);
  const [nswReport, setNswReport] = useState<any>(null);
  const [analysis, setAnalysis] = useState<DetailedFeedback | null>(null);
  const [wordCount, setWordCount] = useState<number>(0);
  const prevTextRef = useRef<string>("");

  // Local content state to ensure we have the latest content
  const [localContent, setLocalContent] = useState<string>(content);

  // Function to get the current prompt from localStorage or fallback
  const getCurrentPrompt = () => {
    try {
      // First check for a generated prompt from Magical Prompt
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
      if (e.key === 'generatedPrompt' || e.key === `${textType.toLowerCase()}_prompt`) {
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
  }, [textType, evaluationStatus]); // Added evaluationStatus to dependency array

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

  // NSW Evaluation Submit Handler
  const handleNSWSubmit = async (submittedContent?: string, submittedTextType?: string) => {
    // Ensure localContent is up-to-date before evaluation
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

    try {
      if (!contentToEvaluate || contentToEvaluate.trim().length === 0) {
        throw new Error("Please write some content before submitting for evaluation");
      }

      console.log("NSW Evaluation initiated for:", {
        text: contentToEvaluate.substring(0, 100) + "...",
        textType: typeToEvaluate,
        wordCount
      });

    } catch (e: any) {
      console.error("NSW Submit error:", e);
      setEvaluationStatus("error");
      setShowNSWEvaluation(false);
    }
  };

  // Handle NSW evaluation completion
  const handleNSWEvaluationComplete = (report: any) => {
    console.log("NSW Evaluation completed:", report);
    setNswReport(report);
    setEvaluationStatus("success");
    
    // Convert NSW report to DetailedFeedback format for compatibility
    const convertedAnalysis: DetailedFeedback = {
      overallScore: report.overallScore || 0,
      criteria: {
        ideasContent: {
          score: Math.round((report.domains?.contentAndIdeas?.score || 0) / 5),
          weight: 30,
          strengths: [report.domains?.contentAndIdeas?.feedback || "Good content development"],
          improvements: report.domains?.contentAndIdeas?.improvements || []
        },
        structureOrganization: {
          score: Math.round((report.domains?.textStructure?.score || 0) / 5),
          weight: 25,
          strengths: [report.domains?.textStructure?.feedback || "Clear structure"],
          improvements: report.domains?.textStructure?.improvements || []
        },
        languageVocab: {
          score: Math.round((report.domains?.languageFeatures?.score || 0) / 5),
          weight: 25,
          strengths: [report.domains?.languageFeatures?.feedback || "Good language use"],
          improvements: report.domains?.languageFeatures?.improvements || []
        },
        spellingPunctuationGrammar: {
          score: Math.round((report.domains?.conventions?.score || 0) / 5),
          weight: 20,
          strengths: [report.domains?.conventions?.feedback || "Accurate conventions"],
          improvements: report.domains?.conventions?.improvements || []
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

  // Check if word count exceeds target
  const showWordCountWarning = wordCount > 300; // Adjust target as needed

  // Check if we have content for submit button
  const currentContent = localContent || content;
  const hasContent = currentContent && currentContent.trim().length > 0;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left side - Writing Area Content */}
             <div className="flex-[7] flex flex-col min-w-0"> 
        {/* Your Writing Prompt Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 mx-4 mt-4">
          <div className="flex items-center mb-2">
            <LightbulbIcon className="w-5 h-5 mr-2 text-blue-600" /> {/* Changed Lightbulb to LightbulbIcon */}
            <h3 className="font-semibold text-blue-800">Your Writing Prompt</h3>
          </div>
          <p className="text-blue-700 text-sm leading-relaxed">
            {currentPrompt}
          </p>
        </div>

        {/* Action Buttons and Stats Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 mx-4">
          <div className="flex justify-between items-center">
            {/* Left side - Action Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowPlanningTool(true)}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
              >
                <PenTool className="w-4 h-4" />
                <span>Planning</span>
              </button>
              
              <button
                onClick={() => setExamMode(!examMode)}
                className="flex items-center space-x-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
              >
                <Play className="w-4 h-4" />
                <span>Exam</span>
              </button>
              
              <button
                onClick={() => setShowStructureGuide(true)}
                className="flex items-center space-x-2 px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm font-medium"
              >
                <BookOpen className="w-4 h-4" />
                <span>Structure</span>
              </button>
              
              <button
                onClick={() => setShowTips(true)}
                className="flex items-center space-x-2 px-3 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm font-medium"
              >
                <LightbulbIcon className="w-4 h-4" /> {/* Changed Lightbulb to LightbulbIcon */}
                <span>Tips</span>
              </button>
              
              <button
                onClick={() => setFocusMode(!focusMode)}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
              >
                {focusMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span>Focus</span>
              </button>
            </div>

            {/* Right side - Writing Statistics */}
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-blue-500" />
                <span className="font-medium">{wordCount} words</span>
                {showWordCountWarning && (
                  <div className="flex items-center space-x-1 text-orange-600">
                    <AlertCircle className="w-4 h-4" />
                    <span className="font-medium">Exceeded!</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-orange-500" />
                <span className="font-medium">0 WPM</span>
              </div>
            </div>
          </div>
        </div>

        {/* Text Editor Section */}
        <div className="flex-1 mx-4 mb-4">
          <div className="bg-white border border-gray-200 rounded-lg h-full">
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
              hidePromptAndSubmit={true}
              prompt={currentPrompt}
              onPromptGenerated={setCurrentPrompt}
            />
          </div>
        </div>

        {/* Submit for Evaluation Button */}
        <div className="px-4 pb-4">
          <button
            onClick={() => handleSubmitForEvaluation(localContent, textType)}
            disabled={evaluationStatus === "loading" || !hasContent}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
          >
            {evaluationStatus === "loading" ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Analyzing your writing...
              </>
            ) : (
              <>
                <Target className="w-5 h-5 mr-2" />
                Submit for Evaluation
              </>
            )}
          </button>
        </div>
      </div>

      {showNSWEvaluation && (
        <NSWStandaloneSubmitSystem
          content={localContent}
          textType={textType}
          onComplete={handleNSWEvaluationComplete}
          onClose={() => setShowNSWEvaluation(false)}
        />
      )}

      {nswReport && (
        <ReportModal
          report={nswReport}
          onClose={() => setNswReport(null)}
        />
      )}

      {/* Right side - Coach Panel */}
      {!focusMode && (
        <div className="flex-[3] border-l border-gray-200 bg-white">
          <TabbedCoachPanel
            content={localContent || content}
            analysis={analysis}
            onApplyFix={handleApplyFix}
            assistanceLevel={assistanceLevel}
            textType={textType}
            selectedText={selectedText}
          />
        </div>
      )}
    </div>
  );
}
