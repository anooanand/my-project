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
  X
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
    { label: 'S', value: 14, name: 'Small' },
    { label: 'M', value: 16, name: 'Medium' },
    { label: 'L', value: 18, name: 'Large' },
    { label: 'XL', value: 20, name: 'Extra Large' }
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
  const handleContentChange = (newContent: string) => {
    setLocalContent(newContent);
    onChange(newContent);
  };

  // Word count calculation
  const wordCount = localContent.trim() ? localContent.trim().split(/\s+/).length : 0;

  // NSW Submit handler - CORRECTED VERSION
  const handleNSWSubmit = async (contentToSubmit: string, typeToSubmit: string) => {
    if (!contentToSubmit.trim()) {
      alert("Please write something before submitting for evaluation.");
      return;
    }

    setEvaluationStatus("loading");
    // We are not using the standalone system anymore, so we don't need to show it.
    // setShowNSWEvaluation(true); 
    setEvaluationProgress("Analyzing your writing...");

    try {
      // Simulate evaluation progress
      setTimeout(() => setEvaluationProgress("Checking grammar and structure..."), 1000);
      setTimeout(() => setEvaluationProgress("Evaluating content and ideas..."), 2000);
      setTimeout(() => setEvaluationProgress("Generating detailed feedback..."), 3000);

      // CORRECTED: Call the static method with the correct object structure
      const report = await NSWEvaluationReportGenerator.generateReport({
        essayContent: contentToSubmit,
        textType: typeToSubmit,
        prompt: currentPrompt, // Assumes 'currentPrompt' is available in this scope
        wordCount: wordCount, // Assumes 'wordCount' is available in this scope
        targetWordCountMin: 100, // Example value, adjust as needed
        targetWordCountMax: 500, // Example value, adjust as needed
      });
      
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
          },
          structureOrganization: {
            score: report.domains?.textStructure?.score || 0,
            weight: report.domains?.textStructure?.weight || 20,
            strengths: report.domains?.textStructure?.feedback?.map((s: string) => ({ text: s })) || [],
            improvements: report.areasForImprovement?.filter((i: any) => i.area === "Structure & Organization").map((i: any) => ({
              issue: i.issue || "N/A",
              suggestion: i.suggestion || "Continue developing this area",
              evidence: i.evidence || { text: "Based on your writing" }
            })) || []
          },
          languageVocab: {
            score: report.domains?.languageFeatures?.score || 0,
            weight: report.domains?.languageFeatures?.weight || 25,
            strengths: report.domains?.languageFeatures?.feedback?.map((s: string) => ({ text: s })) || [],
            improvements: report.areasForImprovement?.filter((i: any) => i.area === "Language & Vocabulary").map((i: any) => ({
              issue: i.issue || "N/A",
              suggestion: i.suggestion || "Continue developing this area",
              evidence: i.evidence || { text: "Based on your writing" }
            })) || []
          },
          spellingPunctuationGrammar: {
            score: report.domains?.spellingAndGrammar?.score || 0,
            weight: report.domains?.spellingAndGrammar?.weight || 15,
            strengths: report.domains?.spellingAndGrammar?.feedback?.map((s: string) => ({ text: s })) || [],
            improvements: report.areasForImprovement?.filter((i: any) => i.area.includes("Grammar") || i.area.includes("Spelling")).map((i: any) => ({
              issue: i.issue || "N/A",
              suggestion: i.suggestion || "Continue developing this area",
              evidence: i.evidence || { text: "Based on your writing" }
            })) || []
          }
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

  // Set a default prompt for demonstration
  useEffect(() => {
    if (!currentPrompt) {
      setCurrentPrompt("**Prompt: The Mysterious Key** One sunny afternoon, while exploring your grandmother's attic, you stumble upon an old, dusty chest that has been locked for decades. Next to it lies a beautiful, ornate key that seems to shimmer in the light. As you pick up the key, a strange feeling washes over you, as if it holds a secret waiting to be discovered. What could be inside the chest? Is it filled with treasures, forgotten memories, or perhaps something magical? As you unlock the chest, you hear a faint whisper coming from within. What do you find inside, and how does it change your life? Consider the emotions you feel as you uncover the mystery. Who will you share this discovery with, and what adventure will follow? Let your imagination lead you into the unknown!");
    }
  }, [currentPrompt]);

  return (
    <div className={`flex h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Left side - Writing Area Content */}
      <div className="flex-1 flex flex-col"> 
        
        {/* Enhanced Writing Prompt Section - RESTORED FROM OLD VERSION */}
        <div className={`transition-all duration-300 border-b shadow-sm ${
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
          {!isPromptCollapsed && (
            <div className="px-4 pb-4">
              <div className={`p-4 rounded-lg border ${
                darkMode 
                  ? 'bg-blue-900/20 border-blue-800/30 text-blue-100' 
                  : 'bg-white border-blue-200 text-blue-900'
              }`}>
                <p className="text-sm leading-relaxed">
                  <strong>Prompt:</strong> {currentPrompt}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Writing Toolbar - RESTORED FROM OLD VERSION */}
        <div className={`px-4 py-3 border-b transition-colors duration-300 ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            {/* Left: Writing Tools */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowPlanningTool(true)}
                className="flex items-center space-x-1 px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm font-medium"
              >
                <PenTool className="w-4 h-4" />
                <span>Planning</span>
              </button>
              
              <button
                onClick={() => setShowStructureGuide(true)}
                className="flex items-center space-x-1 px-3 py-1.5 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm font-medium"
              >
                <BookOpen className="w-4 h-4" />
                <span>Structure</span>
              </button>
              
              <button
                onClick={() => setShowTips(true)}
                className="flex items-center space-x-1 px-3 py-1.5 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors text-sm font-medium"
              >
                <LightbulbIcon className="w-4 h-4" />
                <span>Tips</span>
              </button>
              
              <button
                onClick={() => setFocusMode(!focusMode)}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-md transition-colors text-sm font-medium ${
                  focusMode 
                    ? 'bg-gray-700 text-white hover:bg-gray-800' 
                    : 'bg-gray-600 text-white hover:bg-gray-700'
                }`}
              >
                {focusMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span>Focus</span>
              </button>
            </div>

            {/* Right: Enhanced Timer, Stats and Settings */}
            <div className="flex items-center space-x-3">
              {/* Enhanced Writing Timer */}
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border shadow-sm ${
                darkMode 
                  ? 'border-gray-600 bg-gray-700' 
                  : 'border-gray-300 bg-gray-50'
              }`}>
                <Clock className={`w-5 h-5 ${
                  isTimerRunning 
                    ? 'text-green-500' 
                    : darkMode ? 'text-blue-400' : 'text-blue-600'
                }`} />
                <span className={`text-lg font-bold font-mono ${
                  isTimerRunning 
                    ? 'text-green-500' 
                    : darkMode ? 'text-gray-100' : 'text-gray-800'
                }`}>
                  {formatTime(elapsedTime)}
                </span>
                
                {/* Timer Controls */}
                <div className="flex items-center space-x-1">
                  {!isTimerRunning ? (
                    <button
                      onClick={startTimer}
                      className={`p-1 rounded-full transition-colors ${
                        darkMode 
                          ? 'hover:bg-gray-600 text-gray-400' 
                          : 'hover:bg-gray-200 text-gray-600'
                      }`}
                      title="Start Timer"
                    >
                      <PlayCircle className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={pauseTimer}
                      className={`p-1 rounded-full transition-colors ${
                        darkMode 
                          ? 'hover:bg-gray-600 text-gray-400' 
                          : 'hover:bg-gray-200 text-gray-600'
                      }`}
                      title="Pause Timer"
                    >
                      <PauseCircle className="w-4 h-4" />
                    </button>
                  )}
                  
                  <button
                    onClick={resetTimer}
                    className={`p-1 rounded-full transition-colors ${
                      darkMode 
                        ? 'hover:bg-gray-600 text-gray-400' 
                        : 'hover:bg-gray-200 text-gray-600'
                    }`}
                    title="Reset Timer"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Word Count with Enhanced Styling */}
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border shadow-sm ${
                showWordCountWarning
                  ? 'border-orange-300 bg-orange-50'
                  : darkMode 
                  ? 'border-gray-600 bg-gray-700' 
                  : 'border-gray-300 bg-gray-50'
              }`}>
                <FileText className={`w-4 h-4 ${
                  showWordCountWarning 
                    ? 'text-orange-600' 
                    : darkMode ? 'text-blue-400' : 'text-blue-600'
                }`} />
                <span className={`text-sm font-semibold ${
                  showWordCountWarning 
                    ? 'text-orange-700' 
                    : darkMode ? 'text-gray-100' : 'text-gray-800'
                }`}>
                  {wordCount} words
                </span>
                {showWordCountWarning && (
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                )}
              </div>

              {/* Settings Toggle */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg border shadow-sm transition-colors text-sm font-medium ${
                  showSettings
                    ? 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600'
                    : darkMode
                    ? 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
                    : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                }`}
                title="Writing Settings"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>
            </div>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className={`border-t px-4 py-3 transition-colors duration-300 ${
              darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <h4 className={`font-medium text-base ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  ⚙️ Writing Settings
                </h4>
                <button
                  onClick={() => setShowSettings(false)}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-md transition-colors text-sm font-medium ${
                    darkMode
                      ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  <X className="w-4 h-4" />
                  <span>Close</span>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Font Size */}
                <div className="space-y-2">
                  <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    📝 Text Size
                  </label>
                  <div className="flex items-center space-x-1">
                    {fontSizes.map((size) => (
                      <button
                        key={size.value}
                        onClick={() => setFontSize(size.value)}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          fontSize === size.value
                            ? 'bg-blue-500 text-white'
                            : darkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                        title={size.name}
                      >
                        {size.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font Family */}
                <div className="space-y-2">
                  <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    🔤 Font Style
                  </label>
                  <select
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    className={`w-full px-3 py-2 rounded-md text-sm border transition-colors ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-gray-300'
                        : 'bg-white border-gray-300 text-gray-700'
                    }`}
                  >
                    {fontFamilies.map((family) => (
                      <option key={family.value} value={family.value}>
                        {family.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Theme Toggle */}
                <div className="space-y-2">
                  <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    🌙 Theme
                  </label>
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    className={`w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      darkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ORIGINAL SIMPLE WRITING AREA - RESTORED FROM OLD VERSION */}
        <div className={`flex-1 relative transition-colors duration-300 ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        } ${focusMode ? 'bg-opacity-95' : ''}`}>
          {/* Writing Area with Enhanced UX - ORIGINAL TEXTAREA */}
          <textarea
            className={`w-full h-full p-6 resize-none focus:outline-none transition-all duration-300 ${
              darkMode 
                ? 'bg-transparent text-white placeholder-gray-400' 
                : 'bg-transparent text-gray-900 placeholder-gray-500'
            } ${focusMode ? 'shadow-inner' : ''}`}
            placeholder={focusMode 
              ? "Focus on your writing. Let your thoughts flow freely..." 
              : "Start writing your amazing story here! Let your creativity flow and bring your ideas to life…"
            }
            value={localContent}
            onChange={(e) => handleContentChange(e.target.value)}
            style={{
              fontFamily: getCurrentFontFamily(),
              fontSize: `${fontSize}px`,
              lineHeight: focusMode ? '1.8' : '1.6',
              letterSpacing: '0.01em',
              textRendering: 'optimizeLegibility',
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale',
              scrollbarWidth: 'thin',
              scrollbarColor: darkMode ? '#4B5563 #374151' : '#CBD5E1 #F1F5F9'
            }}
          />

          {/* Focus Mode Indicator */}
          {focusMode && (
            <div className={`absolute bottom-4 right-4 px-3 py-1 rounded-full text-sm font-medium ${
              darkMode ? 'bg-blue-800 text-blue-200' : 'bg-blue-100 text-blue-800'
            }`}>
              Focus Mode
            </div>
          )}
        </div>

        {/* Enhanced Submit Button with Better UX - RESTORED ORIGINAL POSITION */}
        <div className={`p-4 border-t transition-colors duration-300 ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleSubmitForEvaluation(currentContent, textType)}
              disabled={evaluationStatus === "loading" || !hasContent}
              className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 disabled:cursor-not-allowed shadow-lg"
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
            
            {/* Quick Info Button */}
            <button
              className={`p-3 rounded-lg transition-colors ${
                darkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title="Evaluation Info"
            >
              <Info className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Right side - Coach Panel - RESTORED ORIGINAL WIDTH */}
      <div className={`w-96 flex-shrink-0 border-l transition-colors duration-300 ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <TabbedCoachPanel 
          analysis={analysis} 
          onApplyFix={handleApplyFix}
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
      {analysis && (
        <ReportModal
          isOpen={showReportModal}
          onClose={handleCloseReportModal}
          data={analysis}
          onApplyFix={handleApplyFix}
        />
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