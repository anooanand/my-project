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
  Minimize2,
  HelpCircle,
  Layers,
  Zap
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

  // NEW: Enhanced Ideas & Content Feedback States (Recommendation 1)
  const [showIdeasHelper, setShowIdeasHelper] = useState(false);
  const [ideasFeedback, setIdeasFeedback] = useState<string[]>([]);
  const [promptAnalysis, setPromptAnalysis] = useState<{
    elements: string[];
    covered: string[];
    missing: string[];
  }>({ elements: [], covered: [], missing: [] });

  // NEW: Enhanced Structure & Organization Feedback States (Recommendation 2)
  const [showStructureHelper, setShowStructureHelper] = useState(false);
  const [structureFeedback, setStructureFeedback] = useState<{
    narrativeArc: string;
    paragraphTransitions: string[];
    pacingAdvice: string;
  }>({ narrativeArc: '', paragraphTransitions: [], pacingAdvice: '' });

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

  // NEW: Analyze prompt elements for Ideas & Content feedback (Recommendation 1)
  const analyzePromptElements = (prompt: string) => {
    const elements = [];
    const lowerPrompt = prompt.toLowerCase();
    
    // Extract key elements from the prompt
    if (lowerPrompt.includes('creature') || lowerPrompt.includes('character')) {
      elements.push('Main character/creature description');
    }
    if (lowerPrompt.includes('world') || lowerPrompt.includes('place') || lowerPrompt.includes('setting')) {
      elements.push('World/setting details');
    }
    if (lowerPrompt.includes('adventure') || lowerPrompt.includes('journey')) {
      elements.push('Adventure/journey elements');
    }
    if (lowerPrompt.includes('challenge') || lowerPrompt.includes('problem')) {
      elements.push('Challenges faced');
    }
    if (lowerPrompt.includes('lesson') || lowerPrompt.includes('learn')) {
      elements.push('Lessons learned');
    }
    if (lowerPrompt.includes('friend') || lowerPrompt.includes('meet')) {
      elements.push('New friendships/relationships');
    }
    if (lowerPrompt.includes('change') || lowerPrompt.includes('transform')) {
      elements.push('Character transformation');
    }

    return elements;
  };

  // NEW: Check which prompt elements are covered in the content (Recommendation 1)
  const checkPromptCoverage = (content: string, elements: string[]) => {
    const lowerContent = content.toLowerCase();
    const covered = [];
    const missing = [];

    elements.forEach(element => {
      const keywords = element.toLowerCase().split('/');
      const isCovered = keywords.some(keyword => 
        keyword.split(' ').some(word => lowerContent.includes(word))
      );
      
      if (isCovered) {
        covered.push(element);
      } else {
        missing.push(element);
      }
    });

    return { covered, missing };
  };

  // NEW: Generate Ideas & Content feedback (Recommendation 1)
  const generateIdeasFeedback = (content: string, prompt: string) => {
    const feedback = [];
    const wordCount = content.trim().split(/\s+/).length;
    
    // Check for unique angles
    if (content.length > 100) {
      const commonWords = ['went', 'saw', 'found', 'then', 'suddenly'];
      const hasCommonStarters = commonWords.some(word => 
        content.toLowerCase().includes(word)
      );
      
      if (hasCommonStarters) {
        feedback.push("💡 Try starting with a more unique angle! Instead of 'I went' or 'I saw', consider beginning with dialogue, a sound, or an unusual detail.");
      }
    }

    // Check for elaboration opportunities
    if (wordCount < 150) {
      feedback.push("🔍 Add more specific details! What does your magical creature look like? What sounds, smells, and textures are in this new world?");
    }

    // Check for sensory details
    const sensoryWords = ['heard', 'smelled', 'felt', 'tasted', 'saw', 'sound', 'smell', 'touch'];
    const hasSensoryDetails = sensoryWords.some(word => 
      content.toLowerCase().includes(word)
    );
    
    if (!hasSensoryDetails && content.length > 50) {
      feedback.push("👂 Bring your story to life with sensory details! How does the magical world feel, smell, and sound?");
    }

    return feedback;
  };

  // NEW: Analyze narrative structure (Recommendation 2)
  const analyzeNarrativeStructure = (content: string) => {
    const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
    let narrativeArc = '';
    const transitions = [];
    let pacingAdvice = '';

    // Analyze narrative arc
    if (paragraphs.length === 1) {
      narrativeArc = "Consider breaking your story into paragraphs. Try: Introduction → Rising Action → Climax → Resolution";
    } else if (paragraphs.length === 2) {
      narrativeArc = "Good start with paragraphs! Consider adding a middle section to build tension before your conclusion.";
    } else if (paragraphs.length >= 3) {
      narrativeArc = "Excellent paragraph structure! Make sure each paragraph moves your story forward.";
    }

    // Check transitions between paragraphs
    for (let i = 1; i < paragraphs.length; i++) {
      const prevEnd = paragraphs[i-1].slice(-50).toLowerCase();
      const currentStart = paragraphs[i].slice(0, 50).toLowerCase();
      
      const transitionWords = ['then', 'next', 'after', 'meanwhile', 'suddenly', 'later', 'finally'];
      const hasTransition = transitionWords.some(word => currentStart.includes(word));
      
      if (!hasTransition) {
        transitions.push(`Consider adding a transition between paragraphs ${i} and ${i+1}. Try words like "Meanwhile," "After that," or "Suddenly,"`);
      }
    }

    // Analyze pacing
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = content.length / sentences.length;
    
    if (avgSentenceLength > 100) {
      pacingAdvice = "Try mixing in some shorter sentences to create better pacing and build tension.";
    } else if (avgSentenceLength < 30) {
      pacingAdvice = "Consider combining some short sentences with connecting words to improve flow.";
    } else {
      pacingAdvice = "Good sentence variety! This helps control the pace of your story.";
    }

    return { narrativeArc, paragraphTransitions: transitions, pacingAdvice };
  };

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
    
    // NEW: Analyze prompt elements for Ideas & Content feedback
    const elements = analyzePromptElements(prompt);
    setPromptAnalysis(prev => ({ ...prev, elements }));
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
        
        // NEW: Update prompt analysis
        const elements = analyzePromptElements(newPrompt);
        setPromptAnalysis(prev => ({ ...prev, elements }));
      }
    };

    // Listen for custom events from Magical Prompt generation
    const handlePromptGenerated = (event: CustomEvent) => {
      console.log("🎯 handlePromptGenerated: Custom event received. Detail:", event.detail);
      const newPrompt = getCurrentPrompt();
      setCurrentPrompt(newPrompt);
      console.log("✅ handlePromptGenerated: currentPrompt set to:", newPrompt.substring(0, 50) + "...");
      
      // NEW: Update prompt analysis
      const elements = analyzePromptElements(newPrompt);
      setPromptAnalysis(prev => ({ ...prev, elements }));
    };

    // Listen for custom prompt creation events
    const handleCustomPromptCreated = (event: CustomEvent) => {
      console.log("✏️ handleCustomPromptCreated: Custom prompt event received. Detail:", event.detail);
      const newPrompt = getCurrentPrompt();
      setCurrentPrompt(newPrompt);
      console.log("✅ handleCustomPromptCreated: currentPrompt set to:", newPrompt.substring(0, 50) + "...");
      
      // NEW: Update prompt analysis
      const elements = analyzePromptElements(newPrompt);
      setPromptAnalysis(prev => ({ ...prev, elements }));
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

    // NEW: Generate enhanced feedback based on recommendations 1 & 2
    if (currentContent.length > 50) {
      // Ideas & Content feedback (Recommendation 1)
      const newIdeasFeedback = generateIdeasFeedback(currentContent, currentPrompt);
      setIdeasFeedback(newIdeasFeedback);
      
      // Check prompt coverage
      const coverage = checkPromptCoverage(currentContent, promptAnalysis.elements);
      setPromptAnalysis(prev => ({ ...prev, ...coverage }));
      
      // Structure & Organization feedback (Recommendation 2)
      const newStructureFeedback = analyzeNarrativeStructure(currentContent);
      setStructureFeedback(newStructureFeedback);
    }

    // Trigger coach feedback for new paragraphs
    const events = detectNewParagraphs(prevTextRef.current, currentContent);
    if (events.length) {
      console.log("Emitting paragraph.ready event:", events[events.length - 1]);
      eventBus.emit("paragraph.ready", events[events.length - 1]);
    }
    prevTextRef.current = currentContent;
  }, [localContent, content, currentPrompt, promptAnalysis.elements]);

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
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {textType}
              </span>
              
              {/* NEW: Ideas Helper Button (Recommendation 1) */}
              <button
                onClick={() => setShowIdeasHelper(!showIdeasHelper)}
                className={`flex items-center space-x-1 px-2 py-1 rounded text-xs transition-colors ${
                  showIdeasHelper
                    ? darkMode ? 'bg-purple-700 text-purple-200' : 'bg-purple-100 text-purple-800'
                    : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-purple-700' : 'bg-gray-100 text-gray-600 hover:bg-purple-100'
                }`}
                title="Ideas & Content Helper"
              >
                <Zap className="w-3 h-3" />
                <span>Ideas</span>
              </button>

              {/* NEW: Structure Helper Button (Recommendation 2) */}
              <button
                onClick={() => setShowStructureHelper(!showStructureHelper)}
                className={`flex items-center space-x-1 px-2 py-1 rounded text-xs transition-colors ${
                  showStructureHelper
                    ? darkMode ? 'bg-green-700 text-green-200' : 'bg-green-100 text-green-800'
                    : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-green-700' : 'bg-gray-100 text-gray-600 hover:bg-green-100'
                }`}
                title="Structure & Organization Helper"
              >
                <Layers className="w-3 h-3" />
                <span>Structure</span>
              </button>
            </div>
          </div>
          
          <div className={`text-sm leading-relaxed ${darkMode ? 'text-blue-100' : 'text-blue-900'}`}>
            {currentPrompt}
          </div>

          {/* NEW: Ideas & Content Helper Panel (Recommendation 1) */}
          {showIdeasHelper && (
            <div className={`mt-3 p-3 rounded-lg border ${
              darkMode ? 'bg-purple-900/20 border-purple-700' : 'bg-purple-50 border-purple-200'
            }`}>
              <h4 className={`font-semibold text-sm mb-2 flex items-center ${
                darkMode ? 'text-purple-200' : 'text-purple-800'
              }`}>
                <Zap className="w-4 h-4 mr-1" />
                Ideas & Content Helper (30% of your score)
              </h4>
              
              {/* Prompt Coverage Tracker */}
              {promptAnalysis.elements.length > 0 && (
                <div className="mb-3">
                  <p className={`text-xs font-medium mb-1 ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                    Prompt Elements to Cover:
                  </p>
                  <div className="space-y-1">
                    {promptAnalysis.elements.map((element, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                          promptAnalysis.covered.includes(element)
                            ? 'bg-green-500'
                            : 'bg-gray-400'
                        }`} />
                        <span className={`text-xs ${
                          promptAnalysis.covered.includes(element)
                            ? darkMode ? 'text-green-300' : 'text-green-700'
                            : darkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {element}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ideas Feedback */}
              {ideasFeedback.length > 0 && (
                <div className="space-y-2">
                  {ideasFeedback.map((feedback, index) => (
                    <div key={index} className={`text-xs p-2 rounded ${
                      darkMode ? 'bg-purple-800/30 text-purple-200' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {feedback}
                    </div>
                  ))}
                </div>
              )}

              {/* Missing Elements Prompts */}
              {promptAnalysis.missing.length > 0 && (
                <div className="mt-2">
                  <p className={`text-xs font-medium mb-1 ${darkMode ? 'text-orange-300' : 'text-orange-700'}`}>
                    Consider adding:
                  </p>
                  <div className="space-y-1">
                    {promptAnalysis.missing.slice(0, 2).map((element, index) => (
                      <div key={index} className={`text-xs p-2 rounded ${
                        darkMode ? 'bg-orange-900/30 text-orange-200' : 'bg-orange-100 text-orange-800'
                      }`}>
                        💡 {element}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* NEW: Structure & Organization Helper Panel (Recommendation 2) */}
          {showStructureHelper && (
            <div className={`mt-3 p-3 rounded-lg border ${
              darkMode ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200'
            }`}>
              <h4 className={`font-semibold text-sm mb-2 flex items-center ${
                darkMode ? 'text-green-200' : 'text-green-800'
              }`}>
                <Layers className="w-4 h-4 mr-1" />
                Structure & Organization Helper (25% of your score)
              </h4>
              
              {/* Narrative Arc Feedback */}
              {structureFeedback.narrativeArc && (
                <div className={`mb-3 p-2 rounded text-xs ${
                  darkMode ? 'bg-green-800/30 text-green-200' : 'bg-green-100 text-green-800'
                }`}>
                  <strong>📖 Story Structure:</strong> {structureFeedback.narrativeArc}
                </div>
              )}

              {/* Paragraph Transitions */}
              {structureFeedback.paragraphTransitions.length > 0 && (
                <div className="mb-3">
                  <p className={`text-xs font-medium mb-1 ${darkMode ? 'text-green-300' : 'text-green-700'}`}>
                    Transition Tips:
                  </p>
                  {structureFeedback.paragraphTransitions.slice(0, 2).map((tip, index) => (
                    <div key={index} className={`text-xs p-2 rounded mb-1 ${
                      darkMode ? 'bg-blue-900/30 text-blue-200' : 'bg-blue-100 text-blue-800'
                    }`}>
                      🔗 {tip}
                    </div>
                  ))}
                </div>
              )}

              {/* Pacing Advice */}
              {structureFeedback.pacingAdvice && (
                <div className={`p-2 rounded text-xs ${
                  darkMode ? 'bg-yellow-900/30 text-yellow-200' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  <strong>⚡ Pacing:</strong> {structureFeedback.pacingAdvice}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Original Buttons Section */}
        <div className={`border-b px-3 py-2 transition-colors duration-300 ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {/* Plan Button */}
              <button
                onClick={() => setShowPlanningTool(true)}
                className="flex items-center space-x-1 px-3 py-1 rounded-md text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                title="Planning Tool"
              >
                <PenTool className="w-4 h-4" />
                <span>Plan</span>
              </button>

              {/* Exam Button */}
              <button
                onClick={() => setExamMode(!examMode)}
                className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm font-medium ${
                  examMode
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                } transition-colors`}
                title="Toggle Exam Mode"
              >
                <Play className="w-4 h-4" />
                <span>Exam</span>
              </button>

              {/* Guide Button */}
              <button
                onClick={() => setShowStructureGuide(true)}
                className="flex items-center space-x-1 px-3 py-1 rounded-md text-sm font-medium bg-green-500 text-white hover:bg-green-600 transition-colors"
                title="Structure Guide"
              >
                <BookOpen className="w-4 h-4" />
                <span>Guide</span>
              </button>

              {/* Tips Button */}
              <button
                onClick={() => setShowTips(true)}
                className="flex items-center space-x-1 px-3 py-1 rounded-md text-sm font-medium bg-yellow-500 text-white hover:bg-yellow-600 transition-colors"
                title="Writing Tips"
              >
                <LightbulbIcon className="w-4 h-4" />
                <span>Tips</span>
              </button>
            </div>

            {/* Word Count and Status */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Type className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
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
              
              {examMode && (
                <div className="flex items-center space-x-1 text-red-600">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">Exam Mode</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Writing Controls - Compact */}
        <div className={`border-b px-3 py-2 transition-colors duration-300 ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            {/* Font Size Controls */}
            <div className="flex items-center space-x-2">
              {fontSizes.map((size) => (
                <button
                  key={size.value}
                  onClick={() => setFontSize(size.value)}
                  className={`w-8 h-8 rounded text-xs font-medium transition-colors ${
                    fontSize === size.value
                      ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                      : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  title={size.name}
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
