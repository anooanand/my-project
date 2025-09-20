/**
 * FIXED EnhancedWritingLayout Component - Resolves tool button functionality and layout issues
 * Key fixes: Planning button functionality, loading states, proper error handling, better UX
 */
import React, { useState, useEffect, useRef } from 'react';
import { WritingArea } from './WritingArea';
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
  Lightbulb as LightbulbIcon,
  Target,
  Eye,
  EyeOff,
  ArrowLeft,
  FileText,
  Clock,
  AlertCircle,
  Loader2,
  CheckCircle,
  Settings,
  Maximize2,
  Minimize2
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

interface ToolState {
  loading: boolean;
  error: string | null;
  success: boolean;
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
  const [showSidebar, setShowSidebar] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Tool states for better UX
  const [toolStates, setToolStates] = useState<Record<string, ToolState>>({
    planning: { loading: false, error: null, success: false },
    exam: { loading: false, error: null, success: false },
    structure: { loading: false, error: null, success: false },
    tips: { loading: false, error: null, success: false },
    focus: { loading: false, error: null, success: false }
  });
  
  // NSW Evaluation States
  const [showNSWEvaluation, setShowNSWEvaluation] = useState<boolean>(false);
  const [nswReport, setNswReport] = useState<any>(null);
  const [analysis, setAnalysis] = useState<DetailedFeedback | null>(null);
  const [wordCount, setWordCount] = useState<number>(0);
  const prevTextRef = useRef<string>("");

  // Local content state to ensure we have the latest content
  const [localContent, setLocalContent] = useState<string>(content);
  const [currentContent, setCurrentContent] = useState<string>(content);

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
  }, [textType]);

  // Sync content changes
  useEffect(() => {
    setLocalContent(content);
    setCurrentContent(content);
    
    // Update word count
    const words = content.trim() ? content.trim().split(/\s+/).filter(w => w.length > 0).length : 0;
    setWordCount(words);
  }, [content]);

  // Generic tool handler with loading states and error handling
  const handleToolClick = async (
    toolName: string, 
    handler: () => void | Promise<void>
  ) => {
    if (toolStates[toolName].loading) return;

    // Set loading state
    setToolStates(prev => ({
      ...prev,
      [toolName]: { loading: true, error: null, success: false }
    }));

    try {
      // Add a small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Execute the handler
      await handler();

      // Set success state
      setToolStates(prev => ({
        ...prev,
        [toolName]: { loading: false, error: null, success: true }
      }));

      // Clear success state after 2 seconds
      setTimeout(() => {
        setToolStates(prev => ({
          ...prev,
          [toolName]: { loading: false, error: null, success: false }
        }));
      }, 2000);

    } catch (error) {
      console.error(`Error in ${toolName} tool:`, error);
      
      // Set error state
      setToolStates(prev => ({
        ...prev,
        [toolName]: { 
          loading: false, 
          error: error instanceof Error ? error.message : 'An error occurred',
          success: false 
        }
      }));

      // Clear error state after 5 seconds
      setTimeout(() => {
        setToolStates(prev => ({
          ...prev,
          [toolName]: { loading: false, error: null, success: false }
        }));
      }, 5000);
    }
  };

  // Enhanced tool handlers
  const handlePlanningClick = () => {
    handleToolClick('planning', () => {
      console.log('Planning tool clicked - opening modal');
      setShowPlanningTool(true);
    });
  };

  const handleExamModeClick = () => {
    handleToolClick('exam', () => {
      console.log('Exam mode clicked');
      setExamMode(!examMode);
      if (!examMode) {
        onTimerStart(true);
      }
    });
  };

  const handleStructureClick = () => {
    handleToolClick('structure', () => {
      console.log('Structure tool clicked - opening modal');
      setShowStructureGuide(true);
    });
  };

  const handleTipsClick = () => {
    handleToolClick('tips', () => {
      console.log('Tips tool clicked - opening modal');
      setShowTips(true);
    });
  };

  const handleFocusClick = () => {
    handleToolClick('focus', () => {
      console.log('Focus mode clicked');
      setFocusMode(!focusMode);
      if (!focusMode) {
        setShowSidebar(false);
      } else {
        setShowSidebar(true);
      }
    });
  };

  // Content change handler
  const handleContentChange = (newContent: string) => {
    setCurrentContent(newContent);
    setLocalContent(newContent);
    onChange(newContent);

    // Update word count
    const words = newContent.trim() ? newContent.trim().split(/\s+/).filter(w => w.length > 0).length : 0;
    setWordCount(words);

    // Trigger coach feedback for new paragraphs
    const events = detectNewParagraphs(prevTextRef.current, newContent);
    if (events.length) {
      console.log("Emitting paragraph.ready event:", events[events.length - 1]);
      eventBus.emit("paragraph.ready", events[events.length - 1]);
    }
    prevTextRef.current = newContent;
  };

  // Submit for evaluation handler
  const handleSubmitForEvaluation = () => {
    console.log('🎯 Submit for evaluation clicked');
    setEvaluationStatus("loading");
    setShowNSWEvaluation(true);
    onSubmit();
  };

  // NSW evaluation completion handler
  const handleNSWEvaluationComplete = (report: any) => {
    console.log("NSW Evaluation completed:", report);
    setNswReport(report);
    setEvaluationStatus("success");
    
    // Convert to DetailedFeedback format
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

  // Apply fix handler
  const handleApplyFix = (fix: LintFix) => {
    const newContent = 
      currentContent.substring(0, fix.start) + 
      fix.replacement + 
      currentContent.substring(fix.end);
    handleContentChange(newContent);
  };

  // Check if content exists
  const hasContent = currentContent && currentContent.trim().length > 0;
  const showWordCountWarning = wordCount > 400; // NSW word limit warning

  // Render tool button with state
  const renderToolButton = (
    key: string,
    icon: React.ReactNode,
    label: string,
    onClick: () => void,
    className: string = ""
  ) => {
    const state = toolStates[key];
    const isDisabled = state.loading;

    return (
      <button
        key={key}
        onClick={onClick}
        disabled={isDisabled}
        className={`enhanced-tool-button ${className} ${state.success ? 'success' : ''} ${state.error ? 'error' : ''} ${isDisabled ? 'loading' : ''}`}
        title={state.error || label}
      >
        <div className="tool-button-content">
          {state.loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : state.success ? (
            <CheckCircle className="w-4 h-4" />
          ) : state.error ? (
            <AlertCircle className="w-4 h-4" />
          ) : (
            icon
          )}
          <span>{label}</span>
        </div>
        
        {state.error && (
          <div className="tool-error-tooltip">
            {state.error}
          </div>
        )}
      </button>
    );
  };

  return (
    <div className={`enhanced-writing-layout ${focusMode ? 'focus-mode' : ''} ${isFullscreen ? 'fullscreen' : ''}`}>
      {/* Header with Navigation */}
      <div className="writing-header bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => onNavigate('dashboard')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
            <div className="h-6 w-px bg-gray-300"></div>
            <h1 className="text-xl font-semibold text-gray-900">Writing Studio</h1>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
              title="Toggle sidebar"
            >
              {showSidebar ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left side - Writing Area */}
        <div className="flex-[3] flex flex-col min-w-0">
          {/* Toolbar */}
          {!focusMode && (
            <div className="writing-toolbar bg-gray-50 border-b border-gray-200 px-6 py-3">
              <div className="flex items-center justify-between">
                {/* Left side - Tool buttons */}
                <div className="flex items-center space-x-2">
                  {renderToolButton(
                    'planning',
                    <BookOpen className="w-4 h-4" />,
                    'Planning',
                    handlePlanningClick,
                    'bg-blue-500 hover:bg-blue-600'
                  )}
                  
                  {renderToolButton(
                    'exam',
                    <Play className="w-4 h-4" />,
                    'Exam',
                    handleExamModeClick,
                    'bg-green-500 hover:bg-green-600'
                  )}
                  
                  {renderToolButton(
                    'structure',
                    <BookOpen className="w-4 h-4" />,
                    'Structure',
                    handleStructureClick,
                    'bg-purple-500 hover:bg-purple-600'
                  )}
                  
                  {renderToolButton(
                    'tips',
                    <LightbulbIcon className="w-4 h-4" />,
                    'Tips',
                    handleTipsClick,
                    'bg-yellow-500 hover:bg-yellow-600'
                  )}
                  
                  {renderToolButton(
                    'focus',
                    focusMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />,
                    'Focus',
                    handleFocusClick,
                    'bg-gray-600 hover:bg-gray-700'
                  )}
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
          )}

          {/* Text Editor Section */}
          <div className="flex-1 mx-4 mb-4 mt-4">
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
              onClick={handleSubmitForEvaluation}
              disabled={evaluationStatus === "loading" || !hasContent}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl"
            >
              {evaluationStatus === "loading" ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  <span>Evaluating...</span>
                </>
              ) : (
                <>
                  <Target className="w-5 h-5 mr-2" />
                  <span>Submit for Evaluation ({wordCount} words)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right side - Coach Panel */}
        {showSidebar && !focusMode && (
          <div className="flex-[2] flex flex-col min-w-0 border-l border-gray-200">
            <TabbedCoachPanel
              analysis={analysis}
              onApplyFix={handleApplyFix}
              evaluationStatus={evaluationStatus}
              textType={textType}
              assistanceLevel={assistanceLevel}
              selectedText={selectedText}
              wordCount={wordCount}
              examMode={examMode}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      {showPlanningTool && (
        <PlanningToolModal
          isOpen={showPlanningTool}
          onClose={() => setShowPlanningTool(false)}
          onSavePlan={setPlan}
          initialPlan={plan}
          currentPrompt={currentPrompt}
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
      
      {showNSWEvaluation && (
        <NSWStandaloneSubmitSystem
          isOpen={showNSWEvaluation}
          onClose={() => setShowNSWEvaluation(false)}
          content={currentContent}
          textType={textType}
          onEvaluationComplete={handleNSWEvaluationComplete}
          evaluationStatus={evaluationStatus}
        />
      )}

      <style jsx>{`
        .enhanced-writing-layout {
          height: 100vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .enhanced-writing-layout.focus-mode {
          background: #f8fafc;
        }

        .enhanced-writing-layout.focus-mode .flex-[3] {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
        }

        .writing-header {
          flex-shrink: 0;
        }

        .writing-toolbar {
          flex-shrink: 0;
        }

        .enhanced-tool-button {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 6px;
          border: none;
          color: white;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          min-width: 80px;
          justify-content: center;
        }

        .enhanced-tool-button:hover:not(.loading) {
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .enhanced-tool-button:active:not(.loading) {
          transform: translateY(0);
        }

        .enhanced-tool-button.success {
          background: #10b981 !important;
        }

        .enhanced-tool-button.error {
          background: #ef4444 !important;
        }

        .enhanced-tool-button.loading {
          opacity: 0.8;
          cursor: not-allowed;
          transform: none;
        }

        .tool-button-content {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .tool-error-tooltip {
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          margin-top: 4px;
          padding: 4px 8px;
          background: #1f2937;
          color: white;
          font-size: 12px;
          border-radius: 4px;
          white-space: nowrap;
          z-index: 10;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }

        .tool-error-tooltip::before {
          content: '';
          position: absolute;
          top: -4px;
          left: 50%;
          transform: translateX(-50%);
          border-left: 4px solid transparent;
          border-right: 4px solid transparent;
          border-bottom: 4px solid #1f2937;
        }

        /* Mobile responsiveness */
        @media (max-width: 768px) {
          .enhanced-writing-layout {
            height: 100vh;
            height: 100dvh;
          }

          .writing-toolbar {
            padding: 0.5rem 1rem;
          }

          .enhanced-tool-button {
            padding: 6px 12px;
            font-size: 12px;
            min-width: 70px;
          }

          .flex-[2] {
            display: none;
          }

          .flex-[3] {
            flex: 1;
          }
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
          .enhanced-tool-button {
            border: 2px solid currentColor;
          }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .enhanced-tool-button {
            transition: none;
          }
          
          .enhanced-tool-button:hover:not(.loading) {
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}