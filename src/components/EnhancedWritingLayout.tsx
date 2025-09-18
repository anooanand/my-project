import React, { useState, useEffect, useRef } from 'react';
import WritingArea from './WritingArea';
import { PlanningToolModal } from './PlanningToolModal';
import { StructureGuideModal } from './StructureGuideModal';
import { TipsModal } from './TipsModal';
import { TabbedCoachPanel } from './TabbedCoachPanel';
import { NSWStandaloneSubmitSystem } from './NSWStandaloneSubmitSystem';
import type { DetailedFeedback, LintFix } from '../types/feedback';
import { eventBus } from '../lib/eventBus';
import { detectNewParagraphs } from '../lib/paragraphDetection';
import {
  PenTool,
  Play,
  BookOpen,
  Lightbulb,
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
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [examMode, setExamMode] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [evaluationStatus, setEvaluationStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  
  // NSW Evaluation States
  const [showNSWEvaluation, setShowNSWEvaluation] = useState<boolean>(false);
  const [nswReport, setNswReport] = useState<any>(null);
  const [analysis, setAnalysis] = useState<DetailedFeedback | null>(null);
  const [wordCount, setWordCount] = useState<number>(0);
  const prevTextRef = useRef<string>("");

  // Listen for submit events from AppContent
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

  // Track content changes for word count and coach feedback
  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);

    // Trigger coach feedback for new paragraphs
    const events = detectNewParagraphs(prevTextRef.current, content);
    if (events.length) {
      console.log("Emitting paragraph.ready event:", events[events.length - 1]);
      eventBus.emit("paragraph.ready", events[events.length - 1]);
    }
    prevTextRef.current = content;
  }, [content]);

  // NSW Evaluation Submit Handler
  const handleNSWSubmit = async () => {
    console.log('🎯 NSW Submit triggered from EnhancedWritingLayout');
    setEvaluationStatus("loading");
    setShowNSWEvaluation(true);
    
    try {
      if (!content.trim()) {
        throw new Error("Please write some content before submitting for evaluation");
      }
      
      console.log("NSW Evaluation initiated for:", { 
        text: content.substring(0, 100) + "...", 
        textType, 
        wordCount 
      });
      
      // Call the original onSubmit for any additional handling
      await onSubmit();
      
    } catch (e: any) {
      console.error('NSW Submit error:', e);
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

  const handleSubmitForEvaluation = async () => {
    await handleNSWSubmit();
  };

  const handleApplyFix = (fix: LintFix) => {
    // Apply text fixes to content
    console.log('Applying fix:', fix);
  };

  // Check if word count exceeds target
  const showWordCountWarning = wordCount > 300; // Adjust target as needed

  const prompt = "The Secret Door in the Library: During a rainy afternoon, you decide to explore the dusty old library in your town that you've never visited before. As you wander through the aisles, you discover a hidden door behind a bookshelf. It's slightly ajar, and a faint, warm light spills out from the crack. What happens when you push the door open? Describe the world you enter and the adventures that await you inside. Who do you meet, and what challenges do you face? How does this experience change you by the time you return to the library? Let your imagination run wild as you take your reader on a journey through this mysterious door!";

  return (
    <div className="flex h-full bg-gray-50">
      {/* Left side - Writing Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Prompt Display */}
        {generatedPrompt && (
          <div className="bg-blue-50 border-l-4 border-blue-400 text-blue-800 p-4 mb-4 rounded-md" role="alert">
            <div className="flex items-center">
              <Lightbulb className="w-5 h-5 mr-2" />
              <p className="font-semibold">Your Writing Prompt:</p>
            </div>
            <p className="ml-7 text-sm">{generatedPrompt}</p>
          </div>
        )}

        {/* Your Writing Header with Tools and Stats */}
        <div className="flex justify-between items-center mb-4 px-4">
          <h2 className="text-xl font-bold text-gray-900">Your Writing</h2>
          
          {/* Right side tools and stats */}
          <div className="flex items-center space-x-4">
            {/* Writing Tools Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowPlanningTool(true)}
                className="flex items-center space-x-2 px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
              >
                <PenTool className="w-4 h-4" />
                <span>Planning Phase</span>
              </button>
              
              <button
                onClick={() => setExamMode(!examMode)}
                className="flex items-center space-x-2 px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
              >
                <Play className="w-4 h-4" />
                <span>Exam Tips</span>
              </button>
              
              <button
                onClick={() => setShowStructureGuide(true)}
                className="flex items-center space-x-2 px-3 py-1 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm font-medium"
              >
                <BookOpen className="w-4 h-4" />
                <span>Structure Guide</span>
              </button>
              
              <button
                onClick={() => setShowTips(true)}
                className="flex items-center space-x-2 px-3 py-1 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm font-medium"
              >
                <Lightbulb className="w-4 h-4" />
                <span>Tips</span>
              </button>
              
              <button
                onClick={() => setFocusMode(!focusMode)}
                className="flex items-center space-x-2 px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
              >
                {focusMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span>Focus</span>
              </button>
            </div>

            {/* Writing Statistics */}
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-blue-500" />
                <span className="font-medium">{wordCount} words</span>
                {showWordCountWarning && (
                  <div className="flex items-center space-x-1 text-orange-600">
                    <AlertCircle className="w-4 h-4" />
                    <span className="font-medium">Word count exceeded!</span>
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

        {/* Writing Area */}
        <div className="flex-1 p-4 pt-0">
          <WritingArea
            content={content}
            onChange={onChange}
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
          />
        </div>
      </div>

      {/* Right side - Coach Panel or NSW Evaluation */}
      {!focusMode && (
        <div className="w-[30rem] min-w-[30rem] flex-shrink-0 border-l border-gray-200 bg-white">
          {showNSWEvaluation ? (
            /* NSW Evaluation System */
            <div className="h-full flex flex-col">
              <div className="p-4 border-b border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-purple-800">NSW Assessment</h3>
                  <button
                    onClick={() => setShowNSWEvaluation(false)}
                    className="flex items-center space-x-2 text-purple-600 hover:text-purple-800 text-sm transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Coach</span>
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-auto bg-gradient-to-br from-purple-50 to-blue-50">
                <NSWStandaloneSubmitSystem
                  content={content}
                  wordCount={wordCount}
                  targetWordCountMin={100}
                  targetWordCountMax={400}
                  textType={textType}
                  prompt={prompt}
                  onSubmissionComplete={handleNSWEvaluationComplete}
                />
              </div>
            </div>
          ) : (
            /* Regular Coach Panel */
            <TabbedCoachPanel 
              analysis={analysis} 
              onApplyFix={handleApplyFix}
              content={content}
              textType={textType}
              onWordSelect={() => {}}
            />
          )}
        </div>
      )}

      {/* Planning Tool Modal */}
      <PlanningToolModal
        isOpen={showPlanningTool}
        onClose={() => setShowPlanningTool(false)}
        textType={textType}
        onPlanSaved={(savedPlan) => {
          setPlan(savedPlan);
          setShowPlanningTool(false);
        }}
        existingPlan={plan}
      />

      {/* Structure Guide Modal */}
      <StructureGuideModal
        isOpen={showStructureGuide}
        onClose={() => setShowStructureGuide(false)}
      />

      {/* Tips Modal */}
      <TipsModal
        isOpen={showTips}
        onClose={() => setShowTips(false)}
      />
    </div>
  );
}
