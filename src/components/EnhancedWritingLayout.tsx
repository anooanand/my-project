import React, { useState, useEffect, useRef } from 'react';
import { WritingArea } from './WritingArea';
import { PlanningToolModal } from './PlanningToolModal';
import { StructureGuideModal } from './StructureGuideModal';
import { TipsModal } from './TipsModal';
import { TabbedCoachPanel } from './TabbedCoachPanel';
import { NSWStandaloneSubmitSystem } from './NSWStandaloneSubmitSystem';
import { ReportModal } from './ReportModal';
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
  TrendingUp,
  Type,
  Minus,
  Plus,
  Moon,
  Sun,
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
  
  // Enhanced Writing Features
  const [fontSize, setFontSize] = useState(() => {
    return parseInt(localStorage.getItem('writingFontSize') || '16');
  });
  const [fontFamily, setFontFamily] = useState(() => {
    return localStorage.getItem('writingFontFamily') || 'serif';
  });
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('writingDarkMode') === 'true';
  });
  const [fullscreen, setFullscreen] = useState(false);
  
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

  // Font size options
  const fontSizes = [
    { label: 'S', value: 14, name: 'Small' },
    { label: 'M', value: 16, name: 'Medium' },
    { label: 'L', value: 18, name: 'Large' },
    { label: 'XL', value: 20, name: 'Extra Large' },
    { label: 'XXL', value: 24, name: 'Extra Extra Large' }
  ];

  // Font family options
  const fontFamilies = [
    { value: 'serif', name: 'Serif (Georgia)', css: "'Georgia', 'Times New Roman', serif" },
    { value: 'sans', name: 'Sans-serif (Inter)', css: "'Inter', 'Helvetica Neue', 'Arial', sans-serif" },
    { value: 'mono', name: 'Monospace (Fira Code)', css: "'Fira Code', 'Monaco', 'Consolas', monospace" }
  ];

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('writingFontSize', fontSize.toString());
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('writingFontFamily', fontFamily);
  }, [fontFamily]);

  useEffect(() => {
    localStorage.setItem('writingDarkMode', darkMode.toString());
  }, [darkMode]);

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
      {/* OPTIMIZED LAYOUT - Full width utilization */}
      
      {/* Left side - Writing Area Content - Optimized spacing */}
      <div className="flex-1 flex flex-col min-w-0 max-w-none"> 
        {/* Enhanced Writing Prompt Section - Compact */}
        <div className={`border-b p-3 shadow-sm transition-colors duration-300 ${
          darkMode 
            ? 'bg-gradient-to-r from-blue-900/20 to-indigo-900/20 border-blue-800' 
            : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
        }`}>
          <div className="flex items-center mb-2">
            <LightbulbIcon className={`w-5 h-5 mr-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <h3 className={`font-bold text-base ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>Your Writing Prompt</h3>
            <div className="ml-auto flex items-center space-x-2">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                darkMode 
                  ? 'bg-blue-800 text-blue-200' 
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {textType}
              </span>
            </div>
          </div>
          <p className={`leading-relaxed text-sm ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
            {currentPrompt}
          </p>
        </div>

        {/* Enhanced Action Buttons and Stats Section - Compact */}
        <div className={`border-b p-3 shadow-sm transition-colors duration-300 ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
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
                <span>Exam</span>
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
                title="Get helpful writing tips"
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
                title="Toggle distraction-free focus mode"
              >
                {focusMode ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>Focus</span>
              </button>
            </div>

            {/* Right side - Stats and Metrics - Compact */}
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <FileText className={`w-4 h-4 ${darkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                <span className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{wordCount} words</span>
                {showWordCountWarning && (
                  <div className="flex items-center space-x-1 text-orange-600">
                    <AlertCircle className="w-3 h-3" />
                    <span className="font-medium text-xs">Over limit!</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-1">
                <Clock className={`w-4 h-4 ${darkMode ? 'text-orange-400' : 'text-orange-500'}`} />
                <span className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>0 WPM</span>
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

        {/* Enhanced Writing Controls Section */}
        <div className={`border-b p-2 shadow-sm transition-colors duration-300 ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            {/* Font Size Controls */}
            <div className="flex items-center space-x-2">
              <Type className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              <span className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Font Size:</span>
              {fontSizes.map((size) => (
                <button
                  key={size.value}
                  onClick={() => setFontSize(size.value)}
                  className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                    fontSize === size.value
                      ? 'bg-blue-500 text-white'
                      : darkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  title={`${size.name} (${size.value}px)`}
                >
                  {size.label}
                </button>
              ))}
            </div>

            {/* Font Family and Theme Controls */}
            <div className="flex items-center space-x-3">
              {/* Font Family Selector */}
              <div className="flex items-center space-x-2">
                <span className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Font:</span>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className={`text-xs px-2 py-1 rounded border transition-colors ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-gray-200'
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

              {/* Focus Mode Toggle */}
              <div className="flex items-center space-x-1">
                <span className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Focus:</span>
                <button
                  onClick={() => setFocusMode(!focusMode)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    focusMode ? 'bg-blue-600' : darkMode ? 'bg-gray-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      focusMode ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`flex items-center space-x-1 px-2 py-1 rounded transition-colors text-xs ${
                  darkMode
                    ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {darkMode ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
                <span>{darkMode ? 'Light' : 'Dark'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Writing Area - Full height utilization */}
        <div className={`flex-1 transition-colors duration-300 ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        } ${focusMode ? 'bg-opacity-95' : ''}`}>
          <textarea
            className={`w-full h-full p-4 resize-none focus:outline-none transition-all duration-300 ${
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
              MozOsxFontSmoothing: 'grayscale'
            }}
          />
        </div>

        {/* Enhanced Submit Button - Compact */}
        <div className={`border-t p-3 transition-colors duration-300 ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
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
        </div>
      </div>

      {/* Right side - Coach Panel - Optimized width */}
      <div className={`w-96 border-l flex flex-col transition-colors duration-300 ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <TabbedCoachPanel 
          analysis={analysis} 
          onApplyFix={handleApplyFix}
          content={currentContent}
          textType={textType}
        />
      </div>

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
                  style={{ 
                    width: evaluationProgress.includes("Analyzing") ? "20%" :
                           evaluationProgress.includes("Evaluating") ? "40%" :
                           evaluationProgress.includes("Checking") ? "60%" :
                           evaluationProgress.includes("language") ? "80%" :
                           evaluationProgress.includes("Generating") ? "100%" : "0%"
                  }}
                ></div>
              </div>
              <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                We're creating a detailed, personalized report just for you!
              </p>
              <button
                onClick={handleCloseNSWEvaluation}
                className={`mt-4 px-4 py-2 transition-colors ${
                  darkMode 
                    ? 'text-gray-400 hover:text-gray-200' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
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
