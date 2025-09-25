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
  Zap,
  Palette,
  CheckCircle
} from 'lucide-react';

// Interfaces for enhanced feedback
export interface IdeasFeedback {
  promptAnalysis: {
    elements: string[];
    covered: string[];
    missing: string[];
  };
  feedback: string[];
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
  contextualErrors: { error: string; suggestion: string; explanation: string }[];
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

  // NEW: Enhanced Feedback States (Recommendations 1-4)
  const [ideasFeedback, setIdeasFeedback] = useState<IdeasFeedback>({ promptAnalysis: { elements: [], covered: [], missing: [] }, feedback: [] });
  const [structureFeedback, setStructureFeedback] = useState<StructureFeedback>({ narrativeArc: '', paragraphTransitions: [], pacingAdvice: '' });
  const [languageFeedback, setLanguageFeedback] = useState<LanguageFeedback>({ figurativeLanguage: [], showDontTell: [], sentenceVariety: '' });
  const [grammarFeedback, setGrammarFeedback] = useState<GrammarFeedback>({ contextualErrors: [], punctuationTips: [], commonErrors: [] });

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

  // Recommendation 1: Ideas & Content
  const analyzePromptElements = (prompt: string) => {
    const elements = [];
    const lowerPrompt = prompt.toLowerCase();
    if (lowerPrompt.includes('creature') || lowerPrompt.includes('character')) elements.push('Main character/creature description');
    if (lowerPrompt.includes('world') || lowerPrompt.includes('place') || lowerPrompt.includes('setting')) elements.push('World/setting details');
    if (lowerPrompt.includes('adventure') || lowerPrompt.includes('journey')) elements.push('Adventure/journey elements');
    if (lowerPrompt.includes('challenge') || lowerPrompt.includes('problem')) elements.push('Challenges faced');
    if (lowerPrompt.includes('lesson') || lowerPrompt.includes('learn')) elements.push('Lessons learned');
    if (lowerPrompt.includes('friend') || lowerPrompt.includes('meet')) elements.push('New friendships/relationships');
    if (lowerPrompt.includes('change') || lowerPrompt.includes('transform')) elements.push('Character transformation');
    return elements;
  };

  const checkPromptCoverage = (content: string, elements: string[]) => {
    const lowerContent = content.toLowerCase();
    const covered = [];
    const missing = [];
    elements.forEach(element => {
      const keywords = element.toLowerCase().split('/');
      const isCovered = keywords.some(keyword => keyword.split(' ').some(word => lowerContent.includes(word)));
      if (isCovered) covered.push(element); else missing.push(element);
    });
    return { covered, missing };
  };

  const generateIdeasFeedback = (content: string, prompt: string, elements: string[]): IdeasFeedback => {
    const feedback: string[] = [];
    const wordCount = content.trim().split(/\s+/).length;
    if (content.length > 100) {
      const commonWords = ['went', 'saw', 'found', 'then', 'suddenly'];
      if (commonWords.some(word => content.toLowerCase().includes(word))) {
        feedback.push("💡 Try starting with a more unique angle! Instead of 'I went' or 'I saw', consider beginning with dialogue, a sound, or an unusual detail.");
      }
    }
    if (wordCount < 150) {
      feedback.push("🔍 Add more specific details! What does your magical creature look like? What sounds, smells, and textures are in this new world?");
    }
    const sensoryWords = ['heard', 'smelled', 'felt', 'tasted', 'saw', 'sound', 'smell', 'touch'];
    if (!sensoryWords.some(word => content.toLowerCase().includes(word)) && content.length > 50) {
      feedback.push("👂 Bring your story to life with sensory details! How does the magical world feel, smell, and sound?");
    }
    const promptAnalysis = checkPromptCoverage(content, elements);
    return { promptAnalysis, feedback };
  };

  // Recommendation 2: Structure & Organization
  const analyzeNarrativeStructure = (content: string): StructureFeedback => {
    const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
    let narrativeArc = '';
    const transitions: string[] = [];
    let pacingAdvice = '';

    if (paragraphs.length === 1) narrativeArc = "Consider breaking your story into paragraphs. Try: Introduction → Rising Action → Climax → Resolution";
    else if (paragraphs.length === 2) narrativeArc = "Good start with paragraphs! Consider adding a middle section to build tension before your conclusion.";
    else if (paragraphs.length >= 3) narrativeArc = "Excellent paragraph structure! Make sure each paragraph moves your story forward.";

    for (let i = 1; i < paragraphs.length; i++) {
      const prevEnd = paragraphs[i-1].slice(-50).toLowerCase();
      const currentStart = paragraphs[i].slice(0, 50).toLowerCase();
      const transitionWords = ['then', 'next', 'after', 'meanwhile', 'suddenly', 'later', 'finally'];
      if (!transitionWords.some(word => currentStart.includes(word))) {
        transitions.push(`Consider adding a transition between paragraphs ${i} and ${i+1}. Try words like "Meanwhile," "After that," or "Suddenly,"`);
      }
    }

    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = content.length / sentences.length;
    if (avgSentenceLength > 100) pacingAdvice = "Try mixing in some shorter sentences to create better pacing and build tension.";
    else if (avgSentenceLength < 30) pacingAdvice = "Consider combining some short sentences with connecting words to improve flow.";
    else pacingAdvice = "Good sentence variety! This helps control the pace of your story.";

    return { narrativeArc, paragraphTransitions: transitions, pacingAdvice };
  };

  // Recommendation 3: Language Features & Vocabulary
  const analyzeLanguageFeatures = (content: string): LanguageFeedback => {
    const figurativeLanguage: string[] = [];
    const showDontTell: string[] = [];
    let sentenceVariety = '';

    if (!content.toLowerCase().includes('like') && !content.toLowerCase().includes('as ')) figurativeLanguage.push("Consider adding a simile to make your descriptions more vivid (e.g., 'as bright as a star').");
    if (!content.match(/\w+\s+is\s+a\s+\w+/i)) figurativeLanguage.push("Try using a metaphor to create a powerful image (e.g., 'The forest was a sea of green').");
    if (content.toLowerCase().includes(' was happy')) showDontTell.push("Instead of 'was happy', show it! 'A wide grin spread across their face.'");
    if (content.toLowerCase().includes(' was sad')) showDontTell.push("Instead of 'was sad', show it! 'Tears welled up in their eyes.'");

    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const sentenceLengths = sentences.map(s => s.split(' ').length);
    const uniqueLengths = [...new Set(sentenceLengths)];
    if (uniqueLengths.length < 3 && sentences.length > 5) sentenceVariety = "Your sentences are all about the same length. Try varying them to create a better rhythm.";
    else sentenceVariety = "Good sentence variety!";

    return { figurativeLanguage, showDontTell, sentenceVariety };
  };

  // Recommendation 4: Spelling & Grammar
  const analyzeGrammar = (content: string): GrammarFeedback => {
    const contextualErrors: { error: string; suggestion: string; explanation: string }[] = [];
    const punctuationTips: string[] = [];
    const commonErrors: string[] = [];

    if (content.match(/it's/gi)) contextualErrors.push({ error: "it's vs. its", suggestion: "its", explanation: "'It\'s' means 'it is'. 'Its' shows possession." });
    if (content.match(/they're/gi)) contextualErrors.push({ error: "they're vs. their vs. there", suggestion: "their/there", explanation: "'They\'re' means 'they are'. 'Their' is possessive. 'There' is a place." });
    if (!content.includes('...')) punctuationTips.push("Use an ellipsis (...) to create suspense or show a trailing thought.");
    if (!content.includes('—')) punctuationTips.push("Use a dash (—) to add emphasis or an abrupt change of thought.");
    if (content.match(/\s+and\s+then\s+/gi)) commonErrors.push("Avoid overusing 'and then'. Try other transition words like 'next', 'afterward', or start a new sentence.");

    return { contextualErrors, punctuationTips, commonErrors };
  };

  const getCurrentPrompt = () => {
    try {
      const customPrompt = localStorage.getItem("customPrompt");
      if (customPrompt && customPrompt.trim()) return customPrompt;
      const magicalPrompt = localStorage.getItem("generatedPrompt");
      if (magicalPrompt && magicalPrompt.trim()) return magicalPrompt;
      const textTypePrompt = localStorage.getItem(`${textType.toLowerCase()}_prompt`);
      if (textTypePrompt && textTypePrompt.trim()) return textTypePrompt;
      return "The Secret Door in the Library: During a rainy afternoon, you decide to explore the dusty old library in your town... Let your imagination run wild!";
    } catch (error) {
      console.error('Error getting current prompt:', error);
      return "Write an engaging story that captures your reader's imagination.";
    }
  };

  useEffect(() => {
    const prompt = getCurrentPrompt();
    setCurrentPrompt(prompt);
    const elements = analyzePromptElements(prompt);
    setIdeasFeedback(prev => ({ ...prev, promptAnalysis: { ...prev.promptAnalysis, elements } }));
  }, [textType]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'customPrompt' || e.key === 'generatedPrompt' || e.key === `${textType.toLowerCase()}_prompt`) {
        const newPrompt = getCurrentPrompt();
        setCurrentPrompt(newPrompt);
        const elements = analyzePromptElements(newPrompt);
        setIdeasFeedback(prev => ({ ...prev, promptAnalysis: { ...prev.promptAnalysis, elements } }));
      }
    };
    const handlePromptGenerated = (event: CustomEvent) => {
      const newPrompt = getCurrentPrompt();
      setCurrentPrompt(newPrompt);
      const elements = analyzePromptElements(newPrompt);
      setIdeasFeedback(prev => ({ ...prev, promptAnalysis: { ...prev.promptAnalysis, elements } }));
    };
    const handleCustomPromptCreated = (event: CustomEvent) => {
      const newPrompt = getCurrentPrompt();
      setCurrentPrompt(newPrompt);
      const elements = analyzePromptElements(newPrompt);
      setIdeasFeedback(prev => ({ ...prev, promptAnalysis: { ...prev.promptAnalysis, elements } }));
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

  useEffect(() => {
    setLocalContent(content);
  }, [content]);

  const handleContentChange = (newContent: string) => {
    setLocalContent(newContent);
    onChange(newContent);
  };

  useEffect(() => {
    const currentContent = localContent || content;
    const words = currentContent.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);

    if (currentContent.length > 20) {
      const elements = analyzePromptElements(currentPrompt);
      setIdeasFeedback(generateIdeasFeedback(currentContent, currentPrompt, elements));
      setStructureFeedback(analyzeNarrativeStructure(currentContent));
      setLanguageFeedback(analyzeLanguageFeatures(currentContent));
      setGrammarFeedback(analyzeGrammar(currentContent));
    }
  }, [localContent, currentPrompt]);

  const handleApplyFix = (fix: LintFix) => {
    const newContent = localContent.replace(fix.word, fix.suggestion);
    handleContentChange(newContent);
  };

  const handleTimerToggle = () => {
    onTimerStart(!examMode);
    setExamMode(!examMode);
  };

  const handleFocusToggle = () => setFocusMode(!focusMode);
  const handleFullscreenToggle = () => setFullscreen(!fullscreen);

  const currentFont = fontFamilies.find(f => f.value === fontFamily) || fontFamilies[0];

  return (
    <div className={`${darkMode ? 'dark' : ''} ${fullscreen ? 'fullscreen-writing' : ''}`}>
      <div className={`flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 ${focusMode ? 'focus-mode' : ''}`}>
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col p-4 overflow-hidden">
          {/* Top Bar */}
          <div className="flex-shrink-0 flex justify-between items-center mb-4">
            <button onClick={() => onNavigate('dashboard')} className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </button>
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium">{textType}</span>
              <select 
                value={textType} 
                onChange={(e) => onTextTypeChange(e.target.value)}
                className="p-2 border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
              >
                <option value="narrative">Narrative</option>
                <option value="persuasive">Persuasive</option>
                <option value="recount">Recount</option>
              </select>
            </div>
          </div>

          {/* Writing Prompt */}
          <div className="flex-shrink-0 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm mb-4">
            <h2 className="text-lg font-bold mb-2 flex items-center"><FileText className="w-5 h-5 mr-2" /> Your Writing Prompt</h2>
            <p className="text-sm leading-relaxed">{currentPrompt}</p>
          </div>

          {/* Toolbar */}
          <div className="flex-shrink-0 flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm mb-4">
            <div className="flex items-center space-x-2">
              <button onClick={() => setShowPlanningTool(true)} className="px-3 py-2 text-sm font-medium rounded-md bg-blue-500 text-white hover:bg-blue-600 flex items-center"><PenTool className="w-4 h-4 mr-2" /> Plan</button>
              <button onClick={handleTimerToggle} className={`px-3 py-2 text-sm font-medium rounded-md flex items-center ${examMode ? 'bg-red-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}><Play className="w-4 h-4 mr-2" /> Exam</button>
              <button onClick={() => setShowStructureGuide(true)} className="px-3 py-2 text-sm font-medium rounded-md bg-green-500 text-white hover:bg-green-600 flex items-center"><BookOpen className="w-4 h-4 mr-2" /> Guide</button>
              <button onClick={() => setShowTips(true)} className="px-3 py-2 text-sm font-medium rounded-md bg-yellow-500 text-white hover:bg-yellow-600 flex items-center"><LightbulbIcon className="w-4 h-4 mr-2" /> Tips</button>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1 p-1 bg-gray-200 dark:bg-gray-700 rounded-md">
                {fontSizes.map(size => (
                  <button 
                    key={size.value} 
                    onClick={() => setFontSize(size.value)} 
                    className={`px-3 py-1 text-sm rounded-md ${fontSize === size.value ? 'bg-white dark:bg-gray-900 shadow' : ''}`}
                    title={size.name}
                  >
                    {size.label}
                  </button>
                ))}
              </div>
              <select 
                value={fontFamily} 
                onChange={(e) => setFontFamily(e.target.value)} 
                className="p-2 border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
              >
                {fontFamilies.map(font => <option key={font.value} value={font.value}>{font.name}</option>)}
              </select>
              <button onClick={handleFocusToggle} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700" title="Focus Mode">
                {focusMode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
              <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700" title="Toggle Dark Mode">
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button onClick={handleFullscreenToggle} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700" title="Toggle Fullscreen">
                {fullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Writing Area - FIXED: Replaced WritingArea component with textarea */}
          <div className="flex-1 flex flex-col">
            <textarea
              value={localContent}
              onChange={(e) => handleContentChange(e.target.value)}
              style={{ 
                fontSize: `${fontSize}px`, 
                fontFamily: currentFont.css,
                lineHeight: '1.6'
              }}
              className="flex-1 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-inner border border-gray-200 dark:border-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              placeholder="Start writing your story here..."
            />
            <div className="flex-shrink-0 mt-4 flex justify-between items-center">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Words: {wordCount}
              </div>
              <button
                onClick={() => onSubmit(localContent, textType)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Submit for Evaluation
              </button>
            </div>
          </div>
        </div>

        {/* Coach Panel - Wider */}
        <div className="w-2/5 flex-shrink-0 border-l border-gray-200 dark:border-gray-700">
          <TabbedCoachPanel 
            analysis={analysis} 
            onApplyFix={handleApplyFix}
            content={localContent}
            textType={textType}
            ideasFeedback={ideasFeedback}
            structureFeedback={structureFeedback}
            languageFeedback={languageFeedback}
            grammarFeedback={grammarFeedback}
          />
        </div>

        {/* Modals */}
        {showPlanningTool && <PlanningToolModal onClose={() => setShowPlanningTool(false)} onSave={setPlan} />}
        {showStructureGuide && <StructureGuideModal onClose={() => setShowStructureGuide(false)} />}
        {showTips && <TipsModal onClose={() => setShowTips(false)} />}
        {showReportModal && nswReport && <ReportModal report={nswReport} onClose={() => setShowReportModal(false)} />}
      </div>
    </div>
  );
}
