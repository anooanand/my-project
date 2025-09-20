import React, { useState, useEffect, useRef } from 'react';
import { WritingArea } from './WritingArea';
import { PlanningToolModal } from './PlanningToolModal';
import { StructureGuideModal } from './StructureGuideModal';
import { TipsModal } from './TipsModal';
import { TabbedCoachPanel } from './TabbedCoachPanel';
import { NSWEvaluationReportGenerator } from './NSWEvaluationReportGenerator'; // Import the generator directly
import { NSWEvaluationReportDisplay } from './NSWEvaluationReportDisplay'; // Import the display component

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
  Loader2, // Import Loader2 for loading animation
  XCircle // Import XCircle for error icon
} from 'lucide-react';

interface EnhancedWritingLayoutProps {
  content: string;
  onChange: (content: string) => void;
  textType: string;
  assistanceLevel: string;
  selectedText: string;
  onTimerStart: (started: boolean) => void;
  onSubmit: () => void;
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
  
  const [showNSWEvaluationModal, setShowNSWEvaluationModal] = useState<boolean>(false); // State to control modal visibility
  const [nswReport, setNswReport] = useState<any>(null);
  const [analysis, setAnalysis] = useState<DetailedFeedback | null>(null);
  const [wordCount, setWordCount] = useState<number>(0);
  const prevTextRef = useRef<string>("");

  const [localContent, setLocalContent] = useState<string>(content);

  const getCurrentPrompt = () => {
    try {
      const magicalPrompt = localStorage.getItem("generatedPrompt");
      if (magicalPrompt && magicalPrompt.trim()) {
        console.log("📝 getCurrentPrompt: Using Magical Prompt from localStorage:", magicalPrompt.substring(0, 50) + "...");
        return magicalPrompt;
      }

      const textTypePrompt = localStorage.getItem(`${textType.toLowerCase()}_prompt`);
      if (textTypePrompt && textTypePrompt.trim()) {
        console.log("📝 getCurrentPrompt: Using text-type specific prompt:", textTypePrompt.substring(0, 50) + "...");
        return textTypePrompt;
      }

      const fallbackPrompt = "The Secret Door in the Library: During a rainy afternoon, you decide to explore the dusty old library in your town that you've never visited before. As you wander through the aisles, you discover a hidden door behind a bookshelf. It's slightly ajar, and a faint, warm light spills out from the crack. What happens when you push the door open? Describe the world you enter and the adventures that await you inside. Who do you meet, and what challenges do you face? How does this experience change you by the time you return to the library? Let your imagination run wild as you take your reader on a journey through this mysterious door!";
      console.log('📝 Using fallback prompt');
      return fallbackPrompt;
    } catch (error) {
      console.error('Error getting current prompt:', error);
      return "Write an engaging story that captures your reader's imagination.";
    }
  };

  useEffect(() => {
    const prompt = getCurrentPrompt();
    console.log("🔄 useEffect[textType]: Initializing/Syncing prompt.");
    setCurrentPrompt(prompt);
    console.log("✅ useEffect[textType]: currentPrompt set to:", prompt.substring(0, 50) + "...");
  }, [textType]);

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

  useEffect(() => {
    console.log('🔄 Syncing content from props:', { 
      propContent: content?.substring(0, 50) + '...', 
      propContentLength: content?.length || 0 
    });
    setLocalContent(content);
  }, [content]);

  const handleContentChange = (newContent: string) => {
    console.log('📝 Content changed in WritingArea:', { 
      newContentLength: newContent?.length || 0,
      newContentPreview: newContent?.substring(0, 50) + '...'
    });
    setLocalContent(newContent);
    onChange(newContent);
  };

  useEffect(() => {
    const handleSubmitEvent = (event: CustomEvent) => {
      console.log('📨 EnhancedWritingLayout: Received submit event:', event.detail);
      handleNSWSubmit();
    };

    window.addEventListener('submitForEvaluation', handleSubmitEvent as EventListener);
    
    return () => {
      window.removeEventListener('submitForEvaluation', handleSubmitEvent as EventListener);
    };
  }, []);

  useEffect(() => {
    const currentContent = localContent || content || '';
    const words = currentContent.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);

    const events = detectNewParagraphs(prevTextRef.current, currentContent);
    if (events.length) {
      console.log("Emitting paragraph.ready event:", events[events.length - 1]);
      eventBus.emit("paragraph.ready", events[events.length - 1]);
    }
    prevTextRef.current = currentContent;
  }, [localContent, content]);

  const handleNSWSubmit = async () => {
    const currentContent = localContent || content || '';
    
    console.log('🎯 NSW Submit triggered from EnhancedWritingLayout');
    console.log('Content check:', { 
      localContent: localContent?.substring(0, 50) + '...', 
      propContent: content?.substring(0, 50) + '...', 
      currentContent: currentContent?.substring(0, 50) + '...',
      hasContent: !!currentContent?.trim(),
      contentLength: currentContent?.length || 0
    });
    
    setEvaluationStatus("loading");
    setShowNSWEvaluationModal(true); // Show the modal when submission starts
    setNswReport(null); // Clear previous report

    try {
      if (!currentContent || currentContent.trim().length === 0) {
        console.error('❌ No content found for submission');
        throw new Error("Please write some content before submitting for evaluation");
      }
      
      console.log("NSW Evaluation initiated for:", { 
        text: currentContent.substring(0, 100) + "...", 
        textType, 
        wordCount 
      });
      
      const essayData = {
        content: currentContent,
        textType: textType,
        wordCount: wordCount,
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem('currentEssayData', JSON.stringify(essayData));
      console.log('✅ Essay data stored for NSW evaluation system');
      
      const submitEvent = new CustomEvent('writingSubmitted', {
        detail: { content: currentContent, textType }
      });
      window.dispatchEvent(submitEvent);
      console.log('Writing submitted:', { content: currentContent.substring(0, 50) + '...', textType });
      
      // Directly call the report generator
      const prompt = getCurrentPrompt();
      const targetWordCountMin = 100; // Example value, adjust as needed
      const targetWordCountMax = 500; // Example value, adjust as needed

      const report = NSWEvaluationReportGenerator.generateReport({
        essayContent: currentContent,
        textType: textType,
        prompt: prompt,
        wordCount: wordCount,
        targetWordCountMin: targetWordCountMin,
        targetWordCountMax: targetWordCountMax,
      });
      
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
      await onSubmit(); // Call the original onSubmit for any additional handling
      
    } catch (e: any) {
      console.error('NSW Submit error:', e);
      setEvaluationStatus("error");
      setNswReport(null); // Ensure no report is shown on error

    }
  };

  const handleSubmitForEvaluation = async () => {
    await handleNSWSubmit();
  };

  const handleApplyFix = (fix: LintFix) => {
    console.log('Applying fix:', fix);
  };

  const showWordCountWarning = wordCount > 300;

  const currentContent = localContent || content || '';
  const hasContent = currentContent && currentContent.trim().length > 0;

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-[7] flex flex-col min-w-0"> 
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 mx-4 mt-4">
          <div className="flex items-center mb-2">
            <LightbulbIcon className="w-5 h-5 mr-2 text-blue-600" />
            <h3 className="font-semibold text-blue-800">Your Writing Prompt</h3>
          </div>
          <p className="text-blue-700 text-sm leading-relaxed">
            {currentPrompt}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 mx-4">
          <div className="flex justify-between items-center">
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
                <LightbulbIcon className="w-4 h-4" />
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

        <div className="px-4 pb-4">
          <button
            onClick={handleSubmitForEvaluation}
            disabled={evaluationStatus === "loading" || !hasContent}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            {evaluationStatus === "loading" ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Evaluating...</span>
              </>
            ) : (
              <>
                <Target className="w-5 h-5" />
                <span>Submit for Evaluation</span>
              </>
            )}
          </button>
          
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-2 text-xs text-gray-500 text-center">
              Content Length: {currentContent?.length || 0} | Has Content: {hasContent ? 'Yes' : 'No'}
            </div>
          )}
        </div>
      </div>

      {!focusMode && (
        <div className="flex-[2] border-l border-gray-200 bg-white">
          <TabbedCoachPanel
            content={currentContent}
            textType={textType}
            analysis={analysis}
            onApplyFix={handleApplyFix}
            selectedText={selectedText}
          />
        </div>
      )}

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

      {/* NSW Evaluation System Modal */}
      {showNSWEvaluationModal && evaluationStatus !== "idle" && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
          <div className="relative p-5 border w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2 shadow-lg rounded-md bg-white dark:bg-gray-800 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Evaluation in Progress...</h3>
            {evaluationStatus === "loading" && (
              <div className="flex flex-col items-center justify-center p-10">
                <Loader2 className="animate-spin text-blue-500" size={48} />
                <p className="mt-4 text-lg text-gray-700 dark:text-gray-300">Analyzing your essay, please wait...</p>
              </div>
            )}
            {evaluationStatus === "success" && nswReport && (
              <NSWEvaluationReportDisplay
                report={nswReport}
                essayText={currentContent}
                onClose={() => setShowNSWEvaluationModal(false)} // Close modal function
              />
            )}
            {evaluationStatus === "error" && (
              <div className="flex flex-col items-center justify-center p-10 text-red-600">
                <XCircle size={48} />
                <p className="mt-4 text-lg">Failed to generate evaluation report. Please try again.</p>
                <button
                  onClick={() => setShowNSWEvaluationModal(false)} // Close modal function
                  className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
