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
    overallScore: 0,
    overallGrade: "N/A",
    domains: {
      contentAndIdeas: {
        score: 0,
        maxScore: 10,
        percentage: 0,
        band: "N/A",
        weight: 0,
        weightedScore: 0,
        feedback: [],
        specificExamples: [],
        childFriendlyExplanation: ""
      },
      textStructure: {
        score: 0,
        maxScore: 10,
        percentage: 0,
        band: "N/A",
        weight: 0,
        weightedScore: 0,
        feedback: [],
        specificExamples: [],
        childFriendlyExplanation: ""
      },
      languageFeatures: {
        score: 0,
        maxScore: 10,
        percentage: 0,
        band: "N/A",
        weight: 0,
        weightedScore: 0,
        feedback: [],
        specificExamples: [],
        childFriendlyExplanation: ""
      },
      spellingAndGrammar: {
        score: 0,
        maxScore: 10,
        percentage: 0,
        band: "N/A",
        weight: 0,
        weightedScore: 0,
        feedback: [],
        specificExamples: [],
        childFriendlyExplanation: ""
      }
    },
    detailedFeedback: {
      wordCount: 0,
      sentenceVariety: {
        simple: 0,
        compound: 0,
        complex: 0,
        analysis: ""
      },
      vocabularyAnalysis: {
        sophisticatedWords: [],
        repetitiveWords: [],
        suggestions: []
      },
      literaryDevices: {
        identified: [],
        suggestions: []
      },
      structuralElements: {
        hasIntroduction: false,
        hasConclusion: false,
        paragraphCount: 0,
        coherence: ""
      },
      technicalAccuracy: {
        spellingErrors: 0,
        grammarIssues: [],
        punctuationIssues: []
      }
    },
    recommendations: [],
    strengths: [],
    areasForImprovement: [],
    essayContent: "",
    grammarCorrections: [],
    vocabularyEnhancements: [],
    id: `nsw-${Date.now()}`,
    assessmentId: `assessment-${Date.now()}`
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
    setAnalysis(prev => {
        const newDomains = { ...prev.domains };
        if (newDomains.contentAndIdeas) {
          newDomains.contentAndIdeas = { ...newDomains.contentAndIdeas, score: Math.min(5, Math.floor(wordCount / 20) + 2) };
        }
        if (newDomains.textStructure) {
          newDomains.textStructure = { ...newDomains.textStructure, score: Math.min(5, Math.floor(paragraphs.length) + 2) };
        }

        return {
          ...prev,
          overallScore: Math.min(95, 60 + Math.floor(wordCount / 10)),
          domains: newDomains
        };
      });
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

    eventBus.on('promptGenerated', handlePromptGenerated);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      eventBus.off('promptGenerated', handlePromptGenerated);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [textType]);

  // Effect to update localContent when content prop changes
  useEffect(() => {
    setLocalContent(content);
  }, [content]);

  // Handle content change from textarea
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setLocalContent(newContent);
    onChange(newContent);
  };

  // Handle NSW Evaluation Submission
  const handleNSWSubmit = async (essayContent: string, textType: string) => {
    console.log("handleSubmitForEvaluation called");
    setEvaluationStatus("loading");
    setShowNSWEvaluation(true);
    setEvaluationProgress("Generating report...");

    try {
      const report = await NSWEvaluationReportGenerator.generateReport({
        essayContent,
        textType,
        prompt: currentPrompt,
        wordCountMin: 100,
        // Add other parameters as needed by the generator
      });

      console.log("Generated report:", report);
      handleNSWEvaluationComplete(report);
    } catch (error) {
      console.error("Error during NSW evaluation:", error);
      setEvaluationStatus("error");
      setEvaluationProgress("Error generating report.");
    }
  };

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
        grammarCorrections: report.detailedFeedback?.technicalAccuracy?.grammarIssues?.map((issue: string) => ({ original: "", replacement: "", explanation: issue, position: 0, type: "grammar" })) || [],
        vocabularyEnhancements: report.detailedFeedback?.vocabularyAnalysis?.suggestions?.map((suggestion: string) => ({ original: "", replacement: suggestion, explanation: "", position: 0, type: "vocabulary" })) || [],
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
                darkMode ? 'bg-blue-700 hover:bg-blue-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* NSW Evaluation Progress Modal */}
      {showNSWEvaluation && (
        <div className={`absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50`}>
          <div className={`p-6 rounded-lg shadow-xl w-full max-w-md text-center ${
            darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
          }`}>
            <h3 className="text-xl font-bold mb-4">Evaluating Your Writing...</h3>
            <p className="text-lg mb-4">{evaluationProgress}</p>
            {evaluationStatus === "loading" && (
              <div className="flex justify-center items-center">
                <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </div>
            )}
            {evaluationStatus === "error" && (
              <div className="text-red-500 flex items-center justify-center">
                <AlertCircle size={20} className="mr-2" />
                Evaluation failed. Please try again.
              </div>
            )}
            <button
              onClick={handleCloseNSWEvaluation}
              className={`mt-4 px-4 py-2 rounded-md font-semibold ${
                darkMode ? 'bg-red-700 hover:bg-red-600 text-white' : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
