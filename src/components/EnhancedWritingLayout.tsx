import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PlanningToolModal } from './PlanningToolModal';
import { StructureGuideModal } from './StructureGuideModal';
import { TipsModal } from './TipsModal';
import { TabbedCoachPanel } from './TabbedCoachPanel';
import { NSWStandaloneSubmitSystem } from './NSWStandaloneSubmitSystem';
import { ReportModal } from './ReportModal';
import type { DetailedFeedback, LintFix } from '../types/feedback';
import { eventBus } from '../lib/eventBus';
import { detectNewParagraphs } from '../lib/paragraphDetection';
import { NSWEvaluationReportGenerator } from './NSWEvaluationReportGenerator';
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
  TrendingUp,
  Type,
  Minus,
  Plus,
  Moon,
  Sun,
  Maximize2,
  Minimize2,
  Settings,
  ChevronDown,
  ChevronUp,
  Info,
  PlayCircle,
  PauseCircle,
  RotateCcw,
  X,
  Layers,
  Zap
} from 'lucide-react';

// Define feedback interfaces
export interface IdeasFeedback {
  promptAnalysis: {
    elements: string[];
    missing: string[];
  };
  feedback: string[];
}

export interface StructureFeedback {
  narrativeArc?: string;
  paragraphTransitions: string[];
  pacingAdvice?: string;
}

export interface LanguageFeedback {
  figurativeLanguage: string[];
  showDontTell: string[];
  sentenceVariety?: string;
}

export interface GrammarFeedback {
  contextualErrors: Array<{
    error: string;
    explanation: string;
    suggestion: string;
  }>;
  punctuationTips: string[];
  commonErrors: string[];
}

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
  
  // Timer states - Preserved from current implementation
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // UI states
  const [localContent, setLocalContent] = useState(content);
  const [isPromptCollapsed, setIsPromptCollapsed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState('system');
  const [darkMode, setDarkMode] = useState(false);

  // NSW Evaluation states
  const [showNSWEvaluation, setShowNSWEvaluation] = useState(false);
  const [evaluationProgress, setEvaluationProgress] = useState("");
  const [showReportModal, setShowReportModal] = useState(false);
  const [nswReport, setNswReport] = useState<any>(null);
  const [analysis, setAnalysis] = useState<DetailedFeedback | null>(null);

  // Enhanced feedback states
  const [ideasFeedback, setIdeasFeedback] = useState<IdeasFeedback>({
    promptAnalysis: { elements: [], missing: [] },
    feedback: []
  });
  const [structureFeedback, setStructureFeedback] = useState<StructureFeedback>({
    paragraphTransitions: []
  });
  const [languageFeedback, setLanguageFeedback] = useState<LanguageFeedback>({
    figurativeLanguage: [],
    showDontTell: []
  });
  const [grammarFeedback, setGrammarFeedback] = useState<GrammarFeedback>({
    contextualErrors: [],
    punctuationTips: [],
    commonErrors: []
  });

  // Font options
  const fontSizes = [
    { label: 'Small', value: 14 },
    { label: 'Medium', value: 16 },
    { label: 'Large', value: 18 },
    { label: 'Extra Large', value: 20 }
  ];

  const fontFamilies = [
    { name: 'System', value: 'system', css: 'system-ui, -apple-system, sans-serif' },
    { name: 'Serif', value: 'serif', css: 'Georgia, serif' },
    { name: 'Mono', value: 'mono', css: 'Monaco, monospace' }
  ];

  // Timer functions
  const startTimer = useCallback(() => {
    if (!isTimerRunning) {
      const now = Date.now();
      setStartTime(now - elapsedTime * 1000);
      setIsTimerRunning(true);
      onTimerStart(true);
    }
  }, [isTimerRunning, elapsedTime, onTimerStart]);

  const pauseTimer = useCallback(() => {
    setIsTimerRunning(false);
    onTimerStart(false);
  }, [onTimerStart]);

  const resetTimer = useCallback(() => {
    setIsTimerRunning(false);
    setElapsedTime(0);
    setStartTime(null);
    onTimerStart(false);
  }, [onTimerStart]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Timer effect
  useEffect(() => {
    if (isTimerRunning && startTime) {
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTimerRunning, startTime]);

  // Content handling
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setLocalContent(newContent);
    onChange(newContent);
  };

  // Word count calculation
  const wordCount = localContent.trim() ? localContent.trim().split(/\s+/).length : 0;

  // NSW Submit handler
  const handleNSWSubmit = async (contentToSubmit: string, typeToSubmit: string) => {
    if (!contentToSubmit.trim()) {
      alert("Please write something before submitting for evaluation.");
      return;
    }

    setEvaluationStatus("loading");
    setShowNSWEvaluation(true);
    setEvaluationProgress("Analyzing your writing...");

    try {
      // Simulate evaluation progress
      setTimeout(() => setEvaluationProgress("Checking grammar and structure..."), 1000);
      setTimeout(() => setEvaluationProgress("Evaluating content and ideas..."), 2000);
      setTimeout(() => setEvaluationProgress("Generating detailed feedback..."), 3000);

      // Generate NSW report
      const reportGenerator = new NSWEvaluationReportGenerator();
      const report = await reportGenerator.generateReport(contentToSubmit, typeToSubmit);
      
      setNswReport(report);
      convertReportToAnalysis(report);
      setShowNSWEvaluation(false);
      setShowReportModal(true);
      setEvaluationStatus("success");
    } catch (error) {
      console.error("NSW evaluation error:", error);
      setEvaluationStatus("error");
      setShowNSWEvaluation(false);
      alert("There was an error evaluating your writing. Please try again.");
    }
  };

  const convertReportToAnalysis = (report: any) => {
    try {
      const convertedAnalysis: DetailedFeedback = {
        id: report.id || `nsw-${Date.now()}`,
        assessmentId: report.assessmentId || `assessment-${Date.now()}`,
        overallScore: report.overallScore || 0,
        overallGrade: report.overallGrade || 'N/A',
        criteria: {
          ideasContent: {
            score: report.domains?.contentAndIdeas?.score || 0,
            weight: report.domains?.contentAndIdeas?.weight || 40,
            strengths: report.domains?.contentAndIdeas?.feedback?.map((s: string) => ({ text: s })) || [],
            improvements: report.areasForImprovement?.filter((i: any) => i.area === "Ideas & Content").map((i: any) => ({
              issue: i.issue || "N/A",
              suggestion: i.suggestion || "Continue developing this area",
              evidence: i.evidence || { text: "Based on your writing" }
            })) || []
          } || { score: 0, weight: 40, strengths: [], improvements: [] },
          structureOrganization: {
            score: report.domains?.textStructure?.score || 0,
            weight: report.domains?.textStructure?.weight || 20,
            strengths: report.domains?.textStructure?.feedback?.map((s: string) => ({ text: s })) || [],
            improvements: report.areasForImprovement?.filter((i: any) => i.area === "Structure & Organization").map((i: any) => ({
              issue: i.issue || "N/A",
              suggestion: i.suggestion || "Continue developing this area",
              evidence: i.evidence || { text: "Based on your writing" }
            })) || []
          } || { score: 0, weight: 20, strengths: [], improvements: [] },
          languageVocab: {
            score: report.domains?.languageFeatures?.score || 0,
            weight: report.domains?.languageFeatures?.weight || 25,
            strengths: report.domains?.languageFeatures?.feedback?.map((s: string) => ({ text: s })) || [],
            improvements: report.areasForImprovement?.filter((i: any) => i.area === "Language & Vocabulary").map((i: any) => ({
              issue: i.issue || "N/A",
              suggestion: i.suggestion || "Continue developing this area",
              evidence: i.evidence || { text: "Based on your writing" }
            })) || []
          } || { score: 0, weight: 25, strengths: [], improvements: [] },
          spellingPunctuationGrammar: {
            score: report.domains?.spellingAndGrammar?.score || 0,
            weight: report.domains?.spellingAndGrammar?.weight || 15,
            strengths: report.domains?.spellingAndGrammar?.feedback?.map((s: string) => ({ text: s })) || [],
            improvements: report.areasForImprovement?.filter((i: any) => i.area.includes("Grammar") || i.area.includes("Spelling")).map((i: any) => ({
              issue: i.issue || "N/A",
              suggestion: i.suggestion || "Continue developing this area",
              evidence: i.evidence || { text: "Based on your writing" }
            })) || []
          } || { score: 0, weight: 15, strengths: [], improvements: [] }
        },
        detailedFeedback: report.detailedFeedback || {
          wordCount: 0,
          sentenceVariety: { simple: 0, compound: 0, complex: 0, analysis: "" },
          vocabularyAnalysis: { sophisticatedWords: [], repetitiveWords: [], suggestions: [] },
          literaryDevices: { identified: [], suggestions: [] },
          structuralElements: { hasIntroduction: false, hasConclusion: false, paragraphCount: 0, coherence: "" },
          technicalAccuracy: { spellingErrors: 0, grammarIssues: [], punctuationIssues: [] }
        },
        recommendations: report.recommendations || [],
        strengths: report.strengths || [],
        areasForImprovement: report.areasForImprovement || [],
        essayContent: report.essayContent || ''
      };
      
      console.log("Converted analysis:", convertedAnalysis);
      setAnalysis(convertedAnalysis);
    } catch (conversionError) {
      console.error("Error converting report:", conversionError);
    }
  };

  const handleSubmitForEvaluation = async (contentToSubmit: string, typeToSubmit: string) => {
    console.log("handleSubmitForEvaluation called");
    await handleNSWSubmit(contentToSubmit, typeToSubmit);
  };

  const handleApplyFix = (fix: LintFix) => {
    console.log('Applying fix:', fix);
  };

  const handleCloseReportModal = () => {
    setShowReportModal(false);
    setNswReport(null);
    setEvaluationStatus("idle");
  };

  const handleCloseNSWEvaluation = () => {
    setShowNSWEvaluation(false);
    setEvaluationStatus("idle");
    setEvaluationProgress("");
  };

  // Get current font family CSS
  const getCurrentFontFamily = () => {
    const family = fontFamilies.find(f => f.value === fontFamily);
    return family ? family.css : fontFamilies[0].css;
  };

  // Check if word count exceeds target
  const showWordCountWarning = wordCount > 300;

  // Check if we have content for submit button
  const currentContent = localContent || content;
  const hasContent = currentContent && currentContent.trim().length > 0;

  return (
    <div className={`flex h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Left side - Writing Area Content */}
      <div className="flex-1 flex flex-col min-w-0 max-w-none"> 
        
        {/* Collapsible Writing Prompt Section */}
        <div className={`transition-all duration-300 border-b shadow-sm ${
          isPromptCollapsed ? 'h-12' : 'min-h-[120px]'
        } ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between p-3 cursor-pointer" onClick={() => setIsPromptCollapsed(!isPromptCollapsed)}>
            <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Writing Prompt</h2>
            <div className="flex items-center space-x-2">
              {showWordCountWarning && (
                <span className="text-sm text-yellow-500 flex items-center">
                  <AlertCircle size={16} className="mr-1" />
                  Word count over 300!
                </span>
              )}
              {isPromptCollapsed ? <ChevronDown size={20} className={darkMode ? 'text-gray-400' : 'text-gray-600'} /> : <ChevronUp size={20} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />}
            </div>
          </div>
          {!isPromptCollapsed && (
            <div className={`px-3 pb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <p className="text-sm whitespace-pre-wrap">{currentPrompt}</p>
            </div>
          )}
        </div>

        {/* Action Buttons Section - THIS WAS MISSING */}
        <div className={`p-3 border-b ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowPlanningTool(true)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                darkMode 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              <PenTool className="w-4 h-4" />
              <span>Planning</span>
            </button>
            
            <button
              onClick={() => setShowStructureGuide(true)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                darkMode 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Structure</span>
            </button>
            
            <button
              onClick={() => setShowTips(true)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                darkMode 
                  ? 'bg-yellow-600 text-white hover:bg-yellow-700' 
                  : 'bg-yellow-500 text-white hover:bg-yellow-600'
              }`}
            >
              <LightbulbIcon className="w-4 h-4" />
              <span>Tips</span>
            </button>
            
            <button
              onClick={() => setFocusMode(!focusMode)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                focusMode
                  ? (darkMode ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white')
                  : (darkMode ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' : 'bg-gray-300 text-gray-700 hover:bg-gray-400')
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Focus</span>
            </button>
          </div>
        </div>

        {/* Writing Area */}
        <div className="flex-1 relative">
          <textarea
            className={`w-full h-full p-4 resize-none focus:outline-none ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}
            style={{
              fontSize: `${fontSize}px`,
              fontFamily: getCurrentFontFamily(),
              lineHeight: 1.6,
            }}
            value={localContent}
            onChange={handleContentChange}
            placeholder="Start writing your story here..."
          />
          {examMode && (
            <div className={`absolute bottom-4 left-4 px-3 py-1 rounded-full text-sm font-medium ${
              darkMode ? 'bg-yellow-800 text-yellow-200' : 'bg-yellow-100 text-yellow-800'
            }`}>
              Exam Mode
            </div>
          )}
          {focusMode && (
            <div className={`absolute bottom-4 right-4 px-3 py-1 rounded-full text-sm font-medium ${
              darkMode ? 'bg-blue-800 text-blue-200' : 'bg-blue-100 text-blue-800'
            }`}>
              Focus Mode
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        <div className={`flex items-center justify-between p-3 border-t shadow-inner ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center space-x-4">
            <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Words: {wordCount}</span>
            <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Time: {formatTime(elapsedTime)}</span>
            <button
              onClick={isTimerRunning ? pauseTimer : startTimer}
              className={`p-1 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} ${isTimerRunning ? 'text-red-500' : 'text-green-500'}`}
              title={isTimerRunning ? "Pause Timer" : "Start Timer"}
            >
              {isTimerRunning ? <PauseCircle size={20} /> : <PlayCircle size={20} />}
            </button>
            <button
              onClick={resetTimer}
              className={`p-1 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} text-gray-500`}
              title="Reset Timer"
            >
              <RotateCcw size={20} />
            </button>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-full ${darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
              title="Settings"
            >
              <Settings size={20} />
            </button>
            <button
              onClick={() => onSubmit(localContent, textType)}
              disabled={!hasContent || evaluationStatus === "loading"}
              className={`px-4 py-2 rounded-lg font-semibold text-white transition-colors duration-200 ${
                !hasContent || evaluationStatus === "loading"
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {evaluationStatus === "loading" ? "Evaluating..." : "Submit for Evaluation"}
            </button>
          </div>
        </div>
      </div>

      {/* Right side - Coach Panel */}
      <div className={`w-96 border-l shadow-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <TabbedCoachPanel
          content={currentContent}
          textType={textType}
          timeElapsed={elapsedTime}
          ideasFeedback={ideasFeedback}
          structureFeedback={structureFeedback}
          languageFeedback={languageFeedback}
          grammarFeedback={grammarFeedback}
        />
      </div>

      {/* Modals */}
      <PlanningToolModal
        isOpen={showPlanningTool}
        onClose={() => setShowPlanningTool(false)}
        onSave={setPlan}
        initialPlan={plan}
        prompt={currentPrompt}
      />
      <StructureGuideModal
        isOpen={showStructureGuide}
        onClose={() => setShowStructureGuide(false)}
      />
      <TipsModal
        isOpen={showTips}
        onClose={() => setShowTips(false)}
      />
      <ReportModal
        isOpen={showReportModal}
        onClose={handleCloseReportModal}
        report={nswReport}
        analysis={analysis}
        onApplyFix={handleApplyFix}
      />

      {/* Settings Panel */}
      {showSettings && (
        <div className={`absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50`}>
          <div className={`p-6 rounded-lg shadow-xl w-full max-w-md ${
            darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
          }`}>
            <h3 className="text-xl font-bold mb-4">Settings</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Font Size:</label>
              <div className="flex space-x-2">
                {fontSizes.map((size) => (
                  <button
                    key={size.value}
                    onClick={() => setFontSize(size.value)}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                      fontSize === size.value
                        ? 'bg-blue-600 text-white'
                        : (darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
                    }`}
                  >
                    {size.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Font Family:</label>
              <div className="flex space-x-2">
                {fontFamilies.map((font) => (
                  <button
                    key={font.value}
                    onClick={() => setFontFamily(font.value)}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                      fontFamily === font.value
                        ? 'bg-blue-600 text-white'
                        : (darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
                    }`}
                    style={{ fontFamily: font.css }}
                  >
                    {font.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4 flex items-center justify-between">
              <label className="block text-sm font-medium">Dark Mode:</label>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  darkMode
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {darkMode ? <Moon size={16} /> : <Sun size={16} />}
              </button>
            </div>
            <button
              onClick={() => setShowSettings(false)}
              className={`mt-4 w-full px-4 py-2 rounded-md font-semibold ${
                darkMode
                  ? 'bg-gray-700 text-white hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
              }`}
            >
              Close Settings
            </button>
          </div>
        </div>
      )}

      {/* NSW Evaluation Loading Modal */}
      {showNSWEvaluation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-8 max-w-md w-full mx-4 ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <h3 className={`text-xl font-bold mb-2 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Evaluating Your Writing
              </h3>
              <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{evaluationProgress}</p>
              <div className={`w-full rounded-full h-2 mb-4 ${
                darkMode ? 'bg-gray-700' : 'bg-gray-200'
              }`}>
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: "90%" }}
                />
              </div>
              <button
                onClick={handleCloseNSWEvaluation}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  darkMode
                    ? 'bg-gray-700 text-white hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}