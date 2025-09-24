'''import React, { useState, useEffect, useRef } from 'react';
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

// Enhanced feedback interfaces for coach panel integration
export interface IdeasFeedback {
  feedback: string[];
  promptAnalysis: {
    elements: string[];
    covered: string[];
    missing: string[];
  };
}

export interface StructureFeedback {
  narrativeArc: string;
  paragraphTransitions: string[];
  pacingAdvice: string;
}

export interface LanguageFeedback {
  figurativeLanguage: string[];
  showDontTell: string[];
  sentenceVariety: string;
}

export interface GrammarFeedback {
  contextualErrors: Array<{error: string, explanation: string, suggestion: string}>;
  punctuationTips: string[];
  commonErrors: string[];
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
  const [isCoachWide, setIsCoachWide] = useState(false);
  
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

  // Enhanced feedback states for coach panel integration
  const [ideasFeedback, setIdeasFeedback] = useState<IdeasFeedback>({
    feedback: [],
    promptAnalysis: { elements: [], covered: [], missing: [] }
  });
  const [structureFeedback, setStructureFeedback] = useState<StructureFeedback>({
    narrativeArc: '',
    paragraphTransitions: [],
    pacingAdvice: ''
  });
  const [languageFeedback, setLanguageFeedback] = useState<LanguageFeedback>({
    figurativeLanguage: [],
    showDontTell: [],
    sentenceVariety: ''
  });
  const [grammarFeedback, setGrammarFeedback] = useState<GrammarFeedback>({
    contextualErrors: [],
    punctuationTips: [],
    commonErrors: []
  });

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

  // Analyze prompt elements for Ideas & Content feedback (Recommendation 1)
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

  // Check which prompt elements are covered in the content (Recommendation 1)
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

  // Generate Ideas & Content feedback (Recommendation 1)
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

  // Analyze narrative structure (Recommendation 2)
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

  // Analyze Language Features & Vocabulary (Recommendation 3)
  const analyzeLanguageFeatures = (content: string) => {
    const figurativeLanguage = [];
    const showDontTell = [];
    let sentenceVariety = '';

    // Check for figurative language opportunities
    const lowerContent = content.toLowerCase();
    const figurativeWords = ['like', 'as', 'seemed', 'appeared', 'sounded'];
    const hasFigurative = figurativeWords.some(word => lowerContent.includes(word));
    
    if (!hasFigurative && content.length > 100) {
      figurativeLanguage.push("🎨 Try adding a simile! Compare your magical creature to something familiar. Example: 'The dragon's scales shimmered like emeralds in sunlight.'");
    }
    
    if (!lowerContent.includes('whisper') && !lowerContent.includes('roar') && !lowerContent.includes('crash')) {
      figurativeLanguage.push("🔊 Add some onomatopoeia! Words like 'whoosh,' 'crash,' or 'whisper' make your story come alive.");
    }

    // Check for "show don't tell" opportunities
    const tellingWords = ['was scared', 'was happy', 'was sad', 'was angry', 'was excited'];
    tellingWords.forEach(telling => {
      if (lowerContent.includes(telling)) {
        const emotion = telling.split(' ')[1];
        showDontTell.push(`Instead of "was ${emotion}," show the emotion! Example: "Her hands trembled" instead of "she was scared."`);
      }
    });

    // Analyze sentence variety
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length > 3) {
      const lengths = sentences.map(s => s.trim().split(' ').length);
      const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
      const hasVariety = Math.max(...lengths) - Math.min(...lengths) > 5;
      
      if (!hasVariety) {
        sentenceVariety = "Mix up your sentence lengths! Try combining short, punchy sentences with longer, descriptive ones.";
      } else {
        sentenceVariety = "Great sentence variety! This keeps your writing engaging.";
      }
    }

    return { figurativeLanguage, showDontTell, sentenceVariety };
  };

  // Analyze Spelling & Grammar (Recommendation 4)
  const analyzeGrammarSpelling = (content: string) => {
    const contextualErrors = [];
    const punctuationTips = [];
    const commonErrors = [];

    // Check for common 10-12 year old errors
    const lowerContent = content.toLowerCase();
    
    // Subject-verb agreement
    if (lowerContent.includes('they was') || lowerContent.includes('we was')) {
      contextualErrors.push({
        error: "Subject-verb disagreement",
        explanation: "When the subject is plural (they, we), use 'were' not 'was'",
        suggestion: "Change 'they was' to 'they were'"
      });
    }

    // Run-on sentences (very basic check)
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const longSentences = sentences.filter(s => s.split(' ').length > 25);
    if (longSentences.length > 0) {
      commonErrors.push("Some sentences are quite long. Try breaking them into shorter sentences for better flow.");
    }

    // Punctuation for effect opportunities
    if (!content.includes('...') && content.length > 100) {
      punctuationTips.push("💫 Try using ellipses (...) to create suspense: 'As I opened the door...'");
    }
    
    if (!content.includes('—') && !content.includes(' - ')) {
      punctuationTips.push("✨ Use dashes for emphasis: 'The creature was enormous—bigger than a house!'");
    }

    // Check for dialogue punctuation
    if (content.includes('"') && !content.includes('," ') && !content.includes('." ')) {
      commonErrors.push("Remember to put commas and periods inside quotation marks when writing dialogue.");
    }

    return { contextualErrors, punctuationTips, commonErrors };
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
      
      console.log("📝 getCurrentPrompt: Using fallback prompt.");
      return fallbackPrompt;
    } catch (error) {
      console.error("Error getting prompt from localStorage:", error);
      return "Error retrieving prompt. Please refresh the page.";
    }
  };

  // Update the current prompt when the component mounts or textType changes
  useEffect(() => {
    const prompt = getCurrentPrompt();
    setCurrentPrompt(prompt);
    console.log("Current prompt set to:", prompt);
  }, [textType]);

  // Handle content changes and update word count
  const handleContentChange = (newContent: string) => {
    setLocalContent(newContent);
    onChange(newContent);
    const words = newContent.trim().split(/\s+/);
    setWordCount(words.length === 1 && words[0] === '' ? 0 : words.length);
  };

  // Debounced feedback generation
  useEffect(() => {
    const handler = setTimeout(() => {
      if (localContent.trim().length > 10) {
        const prompt = getCurrentPrompt();
        const promptElements = analyzePromptElements(prompt);
        const coverage = checkPromptCoverage(localContent, promptElements);
        
        setIdeasFeedback({
          feedback: generateIdeasFeedback(localContent, prompt),
          promptAnalysis: { elements: promptElements, ...coverage }
        });
        setStructureFeedback(analyzeNarrativeStructure(localContent));
        setLanguageFeedback(analyzeLanguageFeatures(localContent));
        setGrammarFeedback(analyzeGrammarSpelling(localContent));
      }
    }, 1500); // 1.5 second debounce

    return () => {
      clearTimeout(handler);
    };
  }, [localContent]);

  // Handle paragraph detection for linting
  useEffect(() => {
    if (localContent.length > prevTextRef.current.length + 20) {
      const newParagraphs = detectNewParagraphs(prevTextRef.current, localContent);
      if (newParagraphs.length > 0) {
        eventBus.publish('newParagraphs', newParagraphs);
      }
    }
    prevTextRef.current = localContent;
  }, [localContent]);

  // Handle exam mode toggle
  const handleExamModeToggle = () => {
    setExamMode(!examMode);
    onTimerStart(!examMode);
  };

  // Handle focus mode toggle
  const handleFocusModeToggle = () => {
    setFocusMode(!focusMode);
  };

  // Handle font size change
  const handleFontSizeChange = (increment: boolean) => {
    const currentIndex = fontSizes.findIndex(f => f.value === fontSize);
    let newIndex = currentIndex + (increment ? 1 : -1);
    if (newIndex < 0) newIndex = 0;
    if (newIndex >= fontSizes.length) newIndex = fontSizes.length - 1;
    setFontSize(fontSizes[newIndex].value);
  };

  // Handle font family change
  const handleFontFamilyChange = (family: string) => {
    setFontFamily(family);
  };

  // Handle dark mode toggle
  const handleDarkModeToggle = () => {
    setDarkMode(!darkMode);
  };

  // Handle fullscreen toggle
  const handleFullscreenToggle = () => {
    setFullscreen(!fullscreen);
  };

  // Handle submission for NSW evaluation
  const handleNswSubmit = async () => {
    setEvaluationStatus('loading');
    setShowNSWEvaluation(true);
    setEvaluationProgress("Starting evaluation...");

    try {
      const response = await fetch('https://enterprise-api.writer.com/llm/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_WRITER_API_KEY}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          "model": "palmyra-x-v2-32k",
          "max_tokens": 4096,
          "temperature": 0.2,
          "messages": [
            {
              "role": "system",
              "content": "You are an expert writing coach for 10-12 year old students preparing for the NSW Selective School Writing Test. Your task is to provide a detailed evaluation of a student's narrative writing piece based on a given prompt. Your evaluation must be structured according to the official NSW Selective School Writing marking criteria: Ideas & Content, Structure & Organisation, Language & Vocabulary, and Spelling, Punctuation & Grammar. For each criterion, provide a score out of 5, specific feedback with examples from the text, and actionable suggestions for improvement. The feedback should be encouraging, clear, and easy for a young student to understand. The final output must be a JSON object with the structure: { \"ideas\": { \"score\": number, \"feedback\": string, \"suggestions\": string[] }, \"structure\": { \"score\": number, \"feedback\": string, \"suggestions\": string[] }, \"language\": { \"score\": number, \"feedback\": string, \"suggestions\": string[] }, \"grammar\": { \"score\": number, \"feedback\": string, \"suggestions\": string[] }, \"overallScore\": number, \"overallFeedback\": string }"
            },
            {
              "role": "user",
              "content": `Please evaluate the following story written for the prompt: "${currentPrompt}".\n\nStory:\n${localContent}`
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const result = await response.json();
      const reportContent = JSON.parse(result.choices[0].message.content);
      setNswReport(reportContent);
      setEvaluationStatus('success');
      setShowReportModal(true);
      onPopupCompleted();

    } catch (error) {
      console.error("Error during NSW evaluation:", error);
      setEvaluationStatus('error');
      setEvaluationProgress("An error occurred. Please try again.");
    }
  };

  // Main component render
  return (
    <div className={`flex h-screen ${darkMode ? 'bg-gray-900 text-gray-200' : 'bg-gray-100'} font-${fontFamily}`}>
      {/* Left Sidebar for Navigation and Main Actions */}
      {!fullscreen && (
        <div className="w-16 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col items-center py-4 space-y-6">
          <button onClick={() => onNavigate('dashboard')} className="p-2 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-800 transition-colors">
            <ArrowLeft className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </button>
          <div className="flex flex-col items-center space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
            <button onClick={() => setShowPlanningTool(true)} className="p-2 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-800 transition-colors" title="Planning Tool">
              <PenTool className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            </button>
            <button onClick={() => setShowStructureGuide(true)} className="p-2 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-800 transition-colors" title="Structure Guide">
              <BookOpen className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            </button>
            <button onClick={() => setShowTips(true)} className="p-2 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-800 transition-colors" title="Tips">
              <LightbulbIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 overflow-hidden">
        {/* Top Bar */}
        <div className="flex-shrink-0 mb-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-purple-700 dark:text-purple-400">Your Writing Space</h1>
            <div className="relative">
              <select 
                value={textType} 
                onChange={(e) => onTextTypeChange(e.target.value)}
                className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md py-1 px-3 appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="narrative">Narrative</option>
                <option value="persuasive">Persuasive</option>
                <option value="creative">Creative</option>
              </select>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Word Count: {wordCount}</span>
            <button onClick={handleExamModeToggle} className={`px-3 py-1 text-sm rounded-full flex items-center space-x-1 ${examMode ? 'bg-red-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
              <Clock className="w-4 h-4" />
              <span>{examMode ? 'Exam Mode On' : 'Exam Mode Off'}</span>
            </button>
          </div>
        </div>

        {/* Writing Prompt */}
        <div className="flex-shrink-0 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm mb-4">
          <h2 className="font-bold text-lg mb-2 flex items-center"><Target className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" /> Your Writing Prompt</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{currentPrompt}</p>
        </div>

        {/* Writing Area and Coach Panel */}
        <div className="flex-1 flex overflow-hidden space-x-4">
          {/* Writing Area */}
          <div className={`flex-1 flex flex-col transition-all duration-300 ${isCoachWide ? 'max-w-1/2' : 'max-w-2/3'}`}>
            <WritingArea
              content={localContent}
              onChange={handleContentChange}
              fontSize={fontSize}
              fontFamily={fontFamilies.find(f => f.value === fontFamily)?.css || ''}
              darkMode={darkMode}
              placeholder="Start your story here..."
            />
          </div>

          {/* Coach Panel */}
          {!focusMode && (
            <div className={`transition-all duration-300 ${isCoachWide ? 'w-1/2' : 'w-1/3'}`}>
              <TabbedCoachPanel
                ideasFeedback={ideasFeedback}
                structureFeedback={structureFeedback}
                languageFeedback={languageFeedback}
                grammarFeedback={grammarFeedback}
              />
            </div>
          )}
        </div>

        {/* Bottom Toolbar */}
        <div className="flex-shrink-0 mt-4 flex justify-between items-center bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm">
          <div className="flex items-center space-x-2">
            {/* Font Size Controls */}
            <button onClick={() => handleFontSizeChange(false)} className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700" title="Decrease font size"><Minus className="w-4 h-4" /></button>
            <span className="w-16 text-center text-sm">{fontSizes.find(f => f.value === fontSize)?.name || ''}</span>
            <button onClick={() => handleFontSizeChange(true)} className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700" title="Increase font size"><Plus className="w-4 h-4" /></button>
            
            {/* Font Family Selector */}
            <select 
              value={fontFamily} 
              onChange={(e) => handleFontFamilyChange(e.target.value)}
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md py-1 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {fontFamilies.map(font => (
                <option key={font.value} value={font.value}>{font.name}</option>
              ))}
            </select>

            {/* Dark Mode Toggle */}
            <button onClick={handleDarkModeToggle} className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700" title="Toggle dark mode">
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Focus Mode Toggle */}
            <button onClick={handleFocusModeToggle} className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700" title={focusMode ? 'Show Coach' : 'Focus Mode'}>
              {focusMode ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>

            {/* Fullscreen Toggle */}
            <button onClick={handleFullscreenToggle} className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700" title={fullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}>
              {fullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>

            {/* Coach Width Toggle */}
            <button onClick={() => setIsCoachWide(!isCoachWide)} className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700" title={isCoachWide ? 'Narrow Coach' : 'Widen Coach'}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          <button 
            onClick={handleNswSubmit}
            disabled={evaluationStatus === 'loading'}
            className="bg-purple-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-purple-300 disabled:cursor-not-allowed flex items-center"
          >
            {evaluationStatus === 'loading' ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {evaluationProgress || 'Evaluating...'}
              </>
            ) : (
              <>
                <Award className="w-5 h-5 mr-2" />
                Submit for Evaluation
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modals */}
      {showPlanningTool && <PlanningToolModal onClose={() => setShowPlanningTool(false)} onSave={setPlan} />}
      {showStructureGuide && <StructureGuideModal onClose={() => setShowStructureGuide(false)} textType={textType} />}
      {showTips && <TipsModal onClose={() => setShowTips(false)} />}
      {showReportModal && nswReport && (
        <ReportModal 
          report={nswReport} 
          onClose={() => setShowReportModal(false)} 
        />
      )}
    </div>
  );
}
'''
