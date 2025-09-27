import React, { useState, useEffect, useRef } from 'react';
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
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
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
  
  // UX Enhancement States
  const [showSettings, setShowSettings] = useState(false);
  const [isPromptCollapsed, setIsPromptCollapsed] = useState(false);
  
  // Enhanced NSW Evaluation States
  const [showNSWEvaluation, setShowNSWEvaluation] = useState<boolean>(false);
  const [nswReport, setNswReport] = useState<any>(null);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  
  // Initialize analysis with default values to prevent undefined errors
  const [analysis, setAnalysis] = useState<DetailedFeedback>({
    overallScore: 75,
    criteria: {
      ideasContent: {
        score: 4,
        weight: 30,
        strengths: [
          { text: "Creative and engaging story concept" },
          { text: "Good character development potential" }
        ],
        improvements: [
          { 
            issue: "Add more descriptive details",
            suggestion: "Include sensory details to help readers visualize the scene",
            evidence: { text: "The room was dark" }
          }
        ]
      },
      structureOrganization: {
        score: 3,
        weight: 25,
        strengths: [
          { text: "Clear beginning established" },
          { text: "Logical sequence of events" }
        ],
        improvements: [
          {
            issue: "Develop the middle and ending",
            suggestion: "Add more conflict and resolution to create a complete story arc",
            evidence: { text: "Story needs more development" }
          }
        ]
      },
      languageVocab: {
        score: 4,
        weight: 25,
        strengths: [
          { text: "Good use of descriptive language" },
          { text: "Appropriate vocabulary for audience" }
        ],
        improvements: [
          {
            issue: "Vary sentence structure",
            suggestion: "Mix short and long sentences for better flow",
            evidence: { text: "All sentences are similar length" }
          }
        ]
      },
      spellingPunctuationGrammar: {
        score: 4,
        weight: 20,
        strengths: [
          { text: "Generally accurate spelling" },
          { text: "Correct punctuation usage" }
        ],
        improvements: [
          {
            issue: "Check for minor errors",
            suggestion: "Proofread carefully for small mistakes",
            evidence: { text: "Few minor errors detected" }
          }
        ]
      }
    },
    grammarCorrections: [
      {
        original: "The door was opened by me",
        replacement: "I opened the door",
        explanation: "Use active voice for stronger writing",
        position: 0,
        type: "grammar"
      }
    ],
    vocabularyEnhancements: [
      {
        original: "big",
        replacement: "enormous",
        explanation: "Use more specific adjectives",
        position: 0,
        type: "vocabulary"
      }
    ],
    id: `assessment-${Date.now()}`,
    assessmentId: `nsw-${Date.now()}`
  });
  
  const [wordCount, setWordCount] = useState<number>(0);
  const [evaluationProgress, setEvaluationProgress] = useState<string>("");
  const prevTextRef = useRef<string>("");

  // Local content state to ensure we have the latest content
  const [localContent, setLocalContent] = useState<string>(content);

  // Feedback states for TabbedCoachPanel
  const [ideasFeedback, setIdeasFeedback] = useState<IdeasFeedback>({
    promptAnalysis: {
      elements: [
        "Setting description",
        "Character development", 
        "Plot progression",
        "Dialogue usage",
        "Descriptive language"
      ],
      missing: []
    },
    feedback: [
      "Great start! Try adding more sensory details to help readers visualize your story world.",
      "Consider developing your characters' emotions and motivations more deeply.",
      "Your plot has good potential - think about adding some unexpected twists!"
    ]
  });

  const [structureFeedback, setStructureFeedback] = useState<StructureFeedback>({
    narrativeArc: "Your story has a clear beginning. Consider developing the middle conflict and resolution more fully.",
    paragraphTransitions: [
      "Use transition words like 'Meanwhile', 'Suddenly', or 'Later' to connect your paragraphs",
      "Try starting new paragraphs when the scene, time, or speaker changes",
      "Consider using bridge sentences that link one idea to the next"
    ],
    pacingAdvice: "Vary your sentence lengths to create rhythm - mix short, punchy sentences with longer descriptive ones."
  });

  const [languageFeedback, setLanguageFeedback] = useState<LanguageFeedback>({
    figurativeLanguage: [
      "Try using similes: 'The wind howled like a wild animal'",
      "Add metaphors: 'Her voice was music to his ears'",
      "Use personification: 'The trees danced in the breeze'"
    ],
    showDontTell: [
      "Instead of 'He was scared', try 'His hands trembled and his heart raced'",
      "Rather than 'It was beautiful', describe what makes it beautiful",
      "Show emotions through actions and dialogue rather than stating them directly"
    ],
    sentenceVariety: "Great job mixing different sentence types! Try adding more complex sentences with clauses."
  });

  const [grammarFeedback, setGrammarFeedback] = useState<GrammarFeedback>({
    contextualErrors: [
      {
        error: "Subject-verb agreement",
        explanation: "Make sure singular subjects have singular verbs",
        suggestion: "The dog runs (not 'run') in the park"
      }
    ],
    punctuationTips: [
      "Use commas to separate items in a list",
      "Put periods inside quotation marks in dialogue",
      "Use exclamation points sparingly for maximum impact"
    ],
    commonErrors: [
      "Check for run-on sentences - break them into shorter ones",
      "Make sure each sentence has a subject and verb",
      "Watch out for commonly confused words like 'there/their/they're'"
    ]
  });

  // Update feedback based on content changes
  useEffect(() => {
    const currentContent = localContent || content;
    const words = currentContent.trim().split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;
    
    // Update ideas feedback based on content
    if (wordCount > 0) {
      const hasDialogue = currentContent.includes('"') || currentContent.includes("'");
      const hasDescriptiveWords = /\b(beautiful|amazing|wonderful|terrible|huge|tiny|bright|dark)\b/i.test(currentContent);
      
      setIdeasFeedback(prev => ({
        ...prev,
        promptAnalysis: {
          ...prev.promptAnalysis,
          missing: [
            ...(!hasDialogue ? ["Add dialogue to bring characters to life"] : []),
            ...(!hasDescriptiveWords ? ["Include more descriptive adjectives"] : [])
          ]
        }
      }));
    }

    // Update structure feedback
    const paragraphs = currentContent.split('\n\n').filter(p => p.trim().length > 0);
    if (paragraphs.length > 1) {
      setStructureFeedback(prev => ({
        ...prev,
        narrativeArc: `Good progress! You have ${paragraphs.length} paragraphs. Consider how each one builds your story.`
      }));
    }

    // Update language feedback
    const sentences = currentContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = sentences.length > 0 ? wordCount / sentences.length : 0;
    
    if (avgSentenceLength > 0) {
      setLanguageFeedback(prev => ({
        ...prev,
        sentenceVariety: avgSentenceLength > 15 
          ? "Try mixing in some shorter sentences for better flow"
          : avgSentenceLength < 8
          ? "Consider combining some short sentences for variety"
          : "Great sentence variety! Keep it up!"
      }));
    }

    // Update analysis scores based on content
    if (wordCount > 50) {
      setAnalysis(prev => ({
        ...prev,
        overallScore: Math.min(95, 60 + Math.floor(wordCount / 10)),
        criteria: {
          ...prev.criteria,
          ideasContent: {
            ...prev.criteria.ideasContent,
            score: Math.min(5, Math.floor(wordCount / 20) + 2)
          },
          structureOrganization: {
            ...prev.criteria.structureOrganization,
            score: Math.min(5, Math.floor(paragraphs.length) + 2)
          }
        }
      }));
    }

  }, [localContent, content]);

  // Timer functions - Preserved from current implementation
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const startTimer = () => {
    if (!isTimerRunning) {
      const now = Date.now();
      setStartTime(now);
      setIsTimerRunning(true);
      onTimerStart(true);
      
      timerIntervalRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
  };

  const pauseTimer = () => {
    if (isTimerRunning && timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      setIsTimerRunning(false);
      onTimerStart(false);
    }
  };

  const resetTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    setIsTimerRunning(false);
    setElapsedTime(0);
    setStartTime(null);
    onTimerStart(false);
  };

  // Auto-start timer when user starts typing
  useEffect(() => {
    if (localContent && localContent.trim().length > 0 && !isTimerRunning && elapsedTime === 0) {
      startTimer();
    }
  }, [localContent, isTimerRunning, elapsedTime]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

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
        return customPrompt;
      }

      // Then check for a generated prompt from Magical Prompt
      const magicalPrompt = localStorage.getItem("generatedPrompt");
      if (magicalPrompt && magicalPrompt.trim()) {
        return magicalPrompt;
      }

      // Check for text-type specific prompt
      const textTypePrompt = localStorage.getItem(`${textType.toLowerCase()}_prompt`);
      if (textTypePrompt && textTypePrompt.trim()) {
        return textTypePrompt;
      }

      // Fallback to default prompt
      return "The Secret Door in the Library: During a rainy afternoon, you decide to explore the dusty old library in your town that you've never visited before. As you wander through the aisles, you discover a hidden door behind a bookshelf. It's slightly ajar, and a faint, warm light spills out from the crack. What happens when you push the door open? Describe the world you enter and the adventures that await you inside. Who do you meet, and what challenges do you face? How does this experience change you by the time you return to the library? Let your imagination run wild as you take your reader on a journey through this mysterious door!";
    } catch (error) {
      console.error('Error getting current prompt:', error);
      return "Write an engaging story that captures your reader's imagination.";
    }
  };

  // Initialize and sync prompt on component mount and when textType changes
  useEffect(() => {
    const prompt = getCurrentPrompt();
    setCurrentPrompt(prompt);
  }, [textType]);

  // Listen for localStorage changes (from other tabs/components)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'generatedPrompt' || e.key === 'customPrompt' || e.key === `${textType.toLowerCase()}_prompt`) {
        const prompt = getCurrentPrompt();
        setCurrentPrompt(prompt);
      }
    };

    const handlePromptGenerated = (e: CustomEvent) => {
      if (e.detail && e.detail.prompt) {
        setCurrentPrompt(e.detail.prompt);
      }
    };

    const handleCustomPromptCreated = (e: CustomEvent) => {
      if (e.detail && e.detail.prompt) {
        setCurrentPrompt(e.detail.prompt);
      }
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

  // Handle content changes
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
      eventBus.emit("paragraph.ready", events[events.length - 1]);
    }
    prevTextRef.current = currentContent;
  }, [localContent, content]);

  // FIXED NSW Evaluation Submit Handler - Proper error handling
  const handleNSWSubmit = async (submittedContent?: string, submittedTextType?: string) => {
    const contentToEvaluate = submittedContent || localContent;
    const typeToEvaluate = submittedTextType || textType;

    console.log("handleNSWSubmit called with:", { contentToEvaluate, typeToEvaluate });

    setEvaluationStatus("loading");
    setShowNSWEvaluation(true);
    setEvaluationProgress("Generating your personalized report...");

    try {
      if (!contentToEvaluate || contentToEvaluate.trim().length === 0) {
        throw new Error("Please write some content before submitting for evaluation");
      }

      // Generate report immediately without artificial delays
      const prompt = localStorage.getItem("generatedPrompt") || localStorage.getItem(`${typeToEvaluate.toLowerCase()}_prompt`) || getCurrentPrompt();
      const wordCount = contentToEvaluate.trim().split(/\s+/).filter(word => word.length > 0).length;

      console.log("Calling NSWEvaluationReportGenerator.generateReport with:", {
        essayContent: contentToEvaluate,
        textType: typeToEvaluate,
        prompt: prompt,
        wordCount: wordCount,
        targetWordCountMin: 100,
        targetWordCountMax: 500,
      });

      const report = NSWEvaluationReportGenerator.generateReport({
        essayContent: contentToEvaluate,
        textType: typeToEvaluate,
        prompt: prompt,
        wordCount: wordCount,
        targetWordCountMin: 100,
        targetWordCountMax: 500,
      });

      console.log("Generated report:", report);

      // Complete evaluation immediately
      handleNSWEvaluationComplete(report);

    } catch (e: any) {
      console.error("NSW Submit error:", e);
      setEvaluationStatus("error");
      setShowNSWEvaluation(false);
      setEvaluationProgress("");
      
      // Show error to user
      alert(`Error generating report: ${e.message}`);
    }
  };

  // FIXED NSW evaluation completion handler - Proper report conversion
  const handleNSWEvaluationComplete = (report: any) => {
    console.log("handleNSWEvaluationComplete called with report:", report);
    
    setNswReport(report);
    setEvaluationStatus("success");
    setShowNSWEvaluation(false);
    setEvaluationProgress("");
    setShowReportModal(true);
    
    // FIXED: Convert NSW report to DetailedFeedback format properly
    try {
      const convertedAnalysis: DetailedFeedback = {
        overallScore: report.overallScore || 0,
        criteria: {
          ideasContent: {
            score: Math.round((report.domains?.contentAndIdeas?.score || 0) / 2),
            weight: report.domains?.contentAndIdeas?.weight || 40,
            strengths: report.strengths?.map((s: string) => ({ text: s })) || 
                      [{ text: "Good content development" }],
            improvements: report.areasForImprovement?.map((i: string) => ({
              issue: i,
              suggestion: "Continue developing this area",
              evidence: { text: "Based on your writing" }
            })) || []
          },
          structureOrganization: {
            score: Math.round((report.domains?.textStructure?.score || 0) / 2),
            weight: report.domains?.textStructure?.weight || 20,
            strengths: [{ text: report.domains?.textStructure?.feedback?.[0] || "Clear structure" }],
            improvements: []
          },
          languageVocab: {
            score: Math.round((report.domains?.languageFeatures?.score || 0) / 2),
            weight: report.domains?.languageFeatures?.weight || 25,
            strengths: [{ text: report.domains?.languageFeatures?.feedback?.[0] || "Good language use" }],
            improvements: []
          },
          spellingPunctuationGrammar: {
            score: Math.round((report.domains?.spellingAndGrammar?.score || 0) / 2),
            weight: report.domains?.spellingAndGrammar?.weight || 15,
            strengths: [{ text: report.domains?.spellingAndGrammar?.feedback?.[0] || "Accurate conventions" }],
            improvements: []
          }
        },
        grammarCorrections: report.grammarCorrections || [],
        vocabularyEnhancements: report.vocabularyEnhancements || [],
        id: report.id || `nsw-${Date.now()}`,
        assessmentId: report.assessmentId || `assessment-${Date.now()}`
      };
      
      console.log("Converted analysis:", convertedAnalysis);
      setAnalysis(convertedAnalysis);
    } catch (conversionError) {
      console.error("Error converting report:", conversionError);
      // Keep the default analysis if conversion fails
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
      {/* Left side - Writing Area Content - Kid-Friendly Layout */}
      <div className="flex-1 flex flex-col min-w-0 max-w-none"> 
        
        {/* Kid-Friendly Collapsible Writing Prompt Section */}
        <div className={`transition-all duration-300 border-b shadow-sm ${
          isPromptCollapsed ? 'h-12' : 'min-h-[120px]'
        } ${
          darkMode 
            ? 'bg-gradient-to-r from-blue-900/10 to-indigo-900/10 border-blue-800/20' 
            : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100'
        }`}>
          {/* Prompt Header - Kid-Friendly Controls */}
          <div className="flex items-center justify-between p-3">
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

        {/* Enhanced Writing Toolbar - Kid-Friendly Design */}
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

              {/* Word Count */}
              <div className="flex items-center space-x-1">
                <FileText className={`w-4 h-4 ${darkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                <span className={`text-sm font-medium ${
                  showWordCountWarning 
                    ? 'text-orange-600' 
                    : darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {wordCount} words
                </span>
                {showWordCountWarning && (
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                )}
              </div>

              {/* Kid-Friendly Settings Button */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-md transition-colors text-sm font-medium ${
                  showSettings
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : darkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                title="Writing Settings"
              >
                <Settings className="w-4 h-4" />
                <span>{showSettings ? 'Close Settings' : 'Settings'}</span>
              </button>
            </div>
          </div>

          {/* Kid-Friendly Settings Panel */}
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

        {/* ORIGINAL SIMPLE WRITING AREA - NO WritingArea COMPONENT */}
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

          {/* Kid-Friendly Floating Settings Button */}
          {!showSettings && (
            <button
              onClick={() => setShowSettings(true)}
              className={`absolute bottom-6 right-6 flex items-center space-x-2 px-4 py-3 rounded-full shadow-lg transition-all duration-300 hover:scale-105 ${
                darkMode 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
              title="Open Writing Settings"
            >
              <Settings className="w-5 h-5" />
              <span className="text-sm font-medium">Settings</span>
            </button>
          )}
        </div>

        {/* Enhanced Submit Button with Better UX */}
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

      {/* Right side - Coach Panel - Enhanced UX with ALL FEEDBACK PROPS */}
      <div className={`w-96 flex-shrink-0 border-l transition-colors duration-300 ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <TabbedCoachPanel 
          analysis={analysis} 
          onApplyFix={handleApplyFix}
          content={currentContent}
          textType={textType}
          ideasFeedback={ideasFeedback}
          structureFeedback={structureFeedback}
          languageFeedback={languageFeedback}
          grammarFeedback={grammarFeedback}
        />
      </div>

      {/* NSW Evaluation Loading Modal - OPTIMIZED */}
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
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showPlanningTool && (
        <PlanningToolModal
          isOpen={showPlanningTool}
          onClose={() => setShowPlanningTool(false)}
          plan={plan}
          onPlanChange={setPlan}
          textType={textType}
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

      {showReportModal && nswReport && (
        <ReportModal
          isOpen={showReportModal}
          onClose={handleCloseReportModal}
          report={nswReport}
          analysis={analysis}
        />
      )}
    </div>
  );
}