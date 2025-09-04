import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Save, Download, Upload, Eye, EyeOff, RotateCcw, Sparkles, BookOpen, Target, TrendingUp, Award, CheckCircle, AlertCircle, Star, Lightbulb, MessageSquare, BarChart3, Clock, Zap, Heart, Trophy, Wand2, PenTool, FileText, Settings, RefreshCw, Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, Copy, Check, X, Plus, Minus, ChevronDown, ChevronUp, Info, HelpCircle, Calendar, Users, Globe, Mic, Camera, Image, Link, Hash, Type, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline, List, ListOrdered, Quote, Code, Scissors, Clipboard, Search, Filter, SortAsc, SortDesc, Grid, Layout, Sidebar, Menu, MoreHorizontal, MoreVertical, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Timer, Send, Bot, StopCircle, MapPin, Users2, Smile } from 'lucide-react';
import { generatePrompt, getSynonyms, rephraseSentence, evaluateEssay, makeOpenAICall } from '../lib/openai';
import { WritingStatusBar } from './WritingStatusBar';
import { StructuredPlanningSection } from './StructuredPlanningSection';

interface WritingAreaProps {
  onContentChange?: (content: string) => void;
  initialContent?: string;
  textType?: string;
  prompt?: string;
  onPromptChange?: (prompt: string) => void;
}

// Enhanced Writing Issue Interface
interface WritingIssue {
  type: 'spelling' | 'punctuation' | 'grammar' | 'vocabulary' | 'sentence' | 'paragraph';
  word: string;
  start: number;
  end: number;
  suggestions: string[];
  message: string;
  severity: 'error' | 'warning' | 'suggestion';
}

// Enhanced Evaluation Interface
interface DetailedEvaluation {
  score: number;
  strengths: string;
  improvements: string;
  detailedFeedback: {
    structure: { score: number; feedback: string };
    vocabulary: { score: number; feedback: string };
    grammar: { score: number; feedback: string };
    creativity: { score: number; feedback: string };
    clarity: { score: number; feedback: string };
  };
}

// Basic content analysis function
function analyzeContentBasic(text: string): WritingIssue[] {
  const issues: WritingIssue[] = [];
  const words = text.trim().split(/\s+/).filter(word => word.length > 0);
  
  // Check for basic punctuation issues
  if (text.length > 0) {
    // Check if text ends with proper punctuation
    const lastChar = text.trim().slice(-1);
    if (!['.', '!', '?'].includes(lastChar)) {
      issues.push({
        type: 'punctuation',
        word: 'end of text',
        start: text.length - 1,
        end: text.length,
        suggestions: ['.', '!', '?'],
        message: 'Consider ending your text with proper punctuation.',
        severity: 'suggestion'
      });
    }
    
    // Check for double spaces
    const lastFewChars = text.substring(Math.max(0, text.length - 5));
    if (lastFewChars.includes('  ')) {
      issues.push({
        type: 'punctuation',
        word: 'double space',
        start: text.lastIndexOf('  '),
        end: text.lastIndexOf('  ') + 2,
        suggestions: [' '],
        message: 'Remove extra spaces.',
        severity: 'suggestion'
      });
    }
  }
  
  // Check for basic vocabulary improvements
  const basicWords = ['good', 'bad', 'nice', 'big', 'small', 'said', 'went', 'got', 'very', 'really'];
  const commonMisspellings = {
    'teh': 'the',
    'adn': 'and',
    'recieve': 'receive',
    'seperate': 'separate',
    'definately': 'definitely',
    'occured': 'occurred',
    'begining': 'beginning',
    'writting': 'writing',
    'grammer': 'grammar',
    'sentance': 'sentence'
  };
  
  let currentPosition = 0;
  words.forEach(word => {
    const wordStart = text.indexOf(word, currentPosition);
    if (wordStart !== -1) {
      const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
      
      // Check for common misspellings
      if (commonMisspellings[cleanWord]) {
        issues.push({
          type: 'spelling',
          word: word,
          start: wordStart,
          end: wordStart + word.length,
          suggestions: [commonMisspellings[cleanWord]],
          message: `Possible spelling error. Did you mean "${commonMisspellings[cleanWord]}"?`,
          severity: 'error'
        });
      }
      
      // Check for basic words that could be improved
      if (basicWords.includes(cleanWord) && cleanWord.length > 2) {
        const synonyms = getBasicSynonyms(cleanWord);
        if (synonyms.length > 0) {
          issues.push({
            type: 'vocabulary',
            word: word,
            start: wordStart,
            end: wordStart + word.length,
            suggestions: synonyms.slice(0, 3),
            message: `Consider using a more descriptive word instead of "${cleanWord}".`,
            severity: 'suggestion'
          });
        }
      }
      
      currentPosition = wordStart + word.length;
    }
  });
  
  // Check for sentence structure issues
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  sentences.forEach(sentence => {
    const trimmed = sentence.trim();
    if (trimmed.length > 0) {
      // Check for very short sentences
      if (trimmed.split(/\s+/).length < 3) {
        const sentenceStart = text.indexOf(trimmed);
        issues.push({
          type: 'sentence',
          word: trimmed,
          start: sentenceStart,
          end: sentenceStart + trimmed.length,
          suggestions: ['Consider expanding this sentence with more details.'],
          message: 'This sentence might be too short. Consider adding more detail.',
          severity: 'suggestion'
        });
      }
      
      // Check for very long sentences
      if (trimmed.split(/\s+/).length > 25) {
        const sentenceStart = text.indexOf(trimmed);
        issues.push({
          type: 'sentence',
          word: trimmed.substring(0, 50) + '...',
          start: sentenceStart,
          end: sentenceStart + trimmed.length,
          suggestions: ['Consider breaking this into shorter sentences.'],
          message: 'This sentence might be too long. Consider breaking it up.',
          severity: 'warning'
        });
      }
    }
  });
  
  return issues;
}

// Basic synonym function
function getBasicSynonyms(word: string): string[] {
  const synonyms: { [key: string]: string[] } = {
    'good': ['excellent', 'wonderful', 'fantastic', 'great', 'amazing'],
    'bad': ['terrible', 'awful', 'horrible', 'dreadful', 'poor'],
    'nice': ['pleasant', 'delightful', 'lovely', 'charming', 'enjoyable'],
    'big': ['large', 'huge', 'enormous', 'massive', 'gigantic'],
    'small': ['tiny', 'little', 'miniature', 'petite', 'compact'],
    'said': ['declared', 'stated', 'mentioned', 'expressed', 'remarked'],
    'went': ['traveled', 'journeyed', 'proceeded', 'moved', 'headed'],
    'got': ['received', 'obtained', 'acquired', 'gained', 'earned'],
    'very': ['extremely', 'incredibly', 'remarkably', 'exceptionally', 'tremendously'],
    'really': ['truly', 'genuinely', 'absolutely', 'certainly', 'definitely']
  };
  
  return synonyms[word.toLowerCase()] || [];
}

// Word count function
function getWordCount(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

// Character count function
function getCharacterCount(text: string): number {
  return text.length;
}

// Sentence count function
function getSentenceCount(text: string): number {
  return text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0).length;
}

// Paragraph count function
function getParagraphCount(text: string): number {
  return text.split(/\n\s*\n/).filter(paragraph => paragraph.trim().length > 0).length;
}

// Reading time estimation
function getReadingTime(text: string): number {
  const wordCount = getWordCount(text);
  const wordsPerMinute = 200; // Average reading speed
  return Math.ceil(wordCount / wordsPerMinute);
}

// Grade level estimation (simplified Flesch-Kincaid)
function getGradeLevel(text: string): number {
  const wordCount = getWordCount(text);
  const sentenceCount = getSentenceCount(text);
  const syllableCount = text.split(/\s+/).reduce((count, word) => {
    return count + Math.max(1, word.replace(/[^aeiouAEIOU]/g, '').length);
  }, 0);
  
  if (sentenceCount === 0 || wordCount === 0) return 0;
  
  const avgWordsPerSentence = wordCount / sentenceCount;
  const avgSyllablesPerWord = syllableCount / wordCount;
  
  const gradeLevel = 0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59;
  return Math.max(1, Math.round(gradeLevel));
}

// Enhanced evaluation function
async function getDetailedEvaluation(text: string, textType: string): Promise<DetailedEvaluation> {
  if (!text.trim()) {
    return {
      score: 0,
      strengths: "No content to evaluate yet.",
      improvements: "Start writing to receive feedback!",
      detailedFeedback: {
        structure: { score: 0, feedback: "No structure to analyze yet." },
        vocabulary: { score: 0, feedback: "No vocabulary to analyze yet." },
        grammar: { score: 0, feedback: "No grammar to analyze yet." },
        creativity: { score: 0, feedback: "No creativity to analyze yet." },
        clarity: { score: 0, feedback: "No clarity to analyze yet." }
      }
    };
  }

  try {
    const evaluation = await evaluateEssay(text, textType);
    return evaluation;
  } catch (error) {
    console.error('Error getting detailed evaluation:', error);
    
    // Fallback to basic evaluation
    const wordCount = getWordCount(text);
    const sentenceCount = getSentenceCount(text);
    const issues = analyzeContentBasic(text);
    
    let score = 70; // Base score
    
    // Adjust score based on length
    if (wordCount < 50) score -= 20;
    else if (wordCount > 200) score += 10;
    
    // Adjust score based on issues
    const errorCount = issues.filter(i => i.severity === 'error').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;
    
    score -= errorCount * 5;
    score -= warningCount * 2;
    
    score = Math.max(0, Math.min(100, score));
    
    return {
      score,
      strengths: wordCount > 100 ? "Good length and content development." : "Getting started with your writing.",
      improvements: issues.length > 0 ? "Check for spelling and grammar issues." : "Keep developing your ideas.",
      detailedFeedback: {
        structure: { 
          score: sentenceCount > 3 ? 75 : 50, 
          feedback: sentenceCount > 3 ? "Good sentence variety." : "Try adding more sentences." 
        },
        vocabulary: { 
          score: wordCount > 50 ? 70 : 50, 
          feedback: wordCount > 50 ? "Developing vocabulary usage." : "Try using more descriptive words." 
        },
        grammar: { 
          score: errorCount === 0 ? 80 : 60, 
          feedback: errorCount === 0 ? "Good grammar usage." : "Check for grammar errors." 
        },
        creativity: { 
          score: 70, 
          feedback: "Keep developing your creative ideas." 
        },
        clarity: { 
          score: 70, 
          feedback: "Work on making your ideas clear and easy to follow." 
        }
      }
    };
  }
}

// Format time function
function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function WritingArea({ onContentChange, initialContent = '', textType = 'narrative', prompt: propPrompt, onPromptChange }: WritingAreaProps) {
  // State management
  const [content, setContent] = useState(initialContent);
  const [issues, setIssues] = useState<WritingIssue[]>([]);
  const [evaluation, setEvaluation] = useState<DetailedEvaluation | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(true);
  const [showTips, setShowTips] = useState(true);
  const [showStats, setShowStats] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSynonyms, setShowSynonyms] = useState(false);
  const [selectedWord, setSelectedWord] = useState('');
  const [synonyms, setSynonyms] = useState<string[]>([]);
  const [showRephrase, setShowRephrase] = useState(false);
  const [selectedSentence, setSelectedSentence] = useState('');
  const [rephrasedSentences, setRephrasedSentences] = useState<string[]>([]);
  const [prompt, setPrompt] = useState(propPrompt || '');
  const [showPromptGenerator, setShowPromptGenerator] = useState(false);
  const [promptParams, setPromptParams] = useState({
    topic: '',
    style: 'creative',
    length: 'medium',
    audience: 'general'
  });
  
  // Exam mode states
  const [examMode, setExamMode] = useState(false);
  const [examTimeRemaining, setExamTimeRemaining] = useState(3600); // 60 minutes in seconds
  const [targetWordCount, setTargetWordCount] = useState(500);
  const [examStartTime, setExamStartTime] = useState<Date | null>(null);
  
  // Planning states
  const [showPlanning, setShowPlanning] = useState(false);
  const [planningData, setPlanningData] = useState({
    brainstorm: '',
    outline: '',
    research: '',
    goals: ''
  });
  
  // Structure guide state
  const [showStructureGuide, setShowStructureGuide] = useState(false);
  
  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const analysisTimeoutRef = useRef<NodeJS.Timeout>();
  const examTimerRef = useRef<NodeJS.Timeout>();

  // Word count and statistics
  const wordCount = getWordCount(content);
  const characterCount = getCharacterCount(content);
  const sentenceCount = getSentenceCount(content);
  const paragraphCount = getParagraphCount(content);
  const readingTime = getReadingTime(content);
  const gradeLevel = getGradeLevel(content);

  // Auto-analysis effect
  useEffect(() => {
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
    }

    analysisTimeoutRef.current = setTimeout(() => {
      if (content.trim()) {
        setIsAnalyzing(true);
        const basicIssues = analyzeContentBasic(content);
        setIssues(basicIssues);
        
        // Get detailed evaluation
        getDetailedEvaluation(content, textType).then(evalResult => {

          setEvaluation(eval);
          setIsAnalyzing(false);
        });
      } else {
        setIssues([]);
        setEvaluation(null);
        setIsAnalyzing(false);
      }
    }, 1000);

    return () => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
    };
  }, [content, textType]);

  // Auto-save effect
  useEffect(() => {
    if (autoSave && content !== initialContent) {
      const saveTimeout = setTimeout(() => {
        localStorage.setItem('writingArea_content', content);
        localStorage.setItem('writingArea_prompt', prompt);
        setLastSaved(new Date());
      }, 2000);

      return () => clearTimeout(saveTimeout);
    }
  }, [content, prompt, autoSave, initialContent]);

  // Load saved content on mount
  useEffect(() => {
    const savedContent = localStorage.getItem('writingArea_content');
    const savedPrompt = localStorage.getItem('writingArea_prompt');
    
    if (savedContent && !initialContent) {
      setContent(savedContent);
    }
    
    if (savedPrompt && !propPrompt) {
      setPrompt(savedPrompt);
    }
  }, [initialContent, propPrompt]);

  // Exam timer effect
  useEffect(() => {
    if (examMode && examTimeRemaining > 0) {
      examTimerRef.current = setTimeout(() => {
        setExamTimeRemaining(prev => {
          if (prev <= 1) {
            setExamMode(false);
            alert('Time is up! Your exam session has ended.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (examTimerRef.current) {
        clearTimeout(examTimerRef.current);
      }
    };
  }, [examMode, examTimeRemaining]);

  // Content change handler
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    onContentChange?.(newContent);
  }, [onContentChange]);

  // Prompt change handler
  const handlePromptChange = useCallback((newPrompt: string) => {
    setPrompt(newPrompt);
    onPromptChange?.(newPrompt);
  }, [onPromptChange]);

  // File operations
  const handleSave = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `writing-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setLastSaved(new Date());
  };

  const handleLoad = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        handleContentChange(text);
      };
      reader.readAsText(file);
    }
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear all content?')) {
      handleContentChange('');
      setPrompt('');
      localStorage.removeItem('writingArea_content');
      localStorage.removeItem('writingArea_prompt');
    }
  };

  // Word selection and synonym functionality
  const handleTextSelection = async () => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    if (start !== end) {
      const selectedText = content.substring(start, end).trim();
      
      // Check if it's a single word
      if (selectedText && !selectedText.includes(' ') && selectedText.length > 2) {
        setSelectedWord(selectedText);
        setIsLoading(true);
        
        try {
          const synonymList = await getSynonyms(selectedText);
          setSynonyms(synonymList);
          setShowSynonyms(true);
        } catch (error) {
          console.error('Error getting synonyms:', error);
          const basicSynonyms = getBasicSynonyms(selectedText);
          setSynonyms(basicSynonyms);
          setShowSynonyms(basicSynonyms.length > 0);
        }
        
        setIsLoading(false);
      }
      
      // Check if it's a sentence for rephrasing
      if (selectedText && (selectedText.includes(' ') || selectedText.length > 10)) {
        setSelectedSentence(selectedText);
        setIsLoading(true);
        
        try {
          const rephrased = await rephraseSentence(selectedText);
          setRephrasedSentences(rephrased);
          setShowRephrase(true);
        } catch (error) {
          console.error('Error rephrasing sentence:', error);
        }
        
        setIsLoading(false);
      }
    }
  };

  // Replace word with synonym
  const replaceSynonym = (synonym: string) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    const newContent = content.substring(0, start) + synonym + content.substring(end);
    handleContentChange(newContent);
    setShowSynonyms(false);
    
    // Restore focus and cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + synonym.length, start + synonym.length);
    }, 0);
  };

  // Replace sentence with rephrase
  const replaceRephrase = (rephrase: string) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    const newContent = content.substring(0, start) + rephrase + content.substring(end);
    handleContentChange(newContent);
    setShowRephrase(false);
    
    // Restore focus and cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + rephrase.length, start + rephrase.length);
    }, 0);
  };

  // Prompt generation
  const generateNewPrompt = async () => {
    setIsLoading(true);
    try {
      const newPrompt = await generatePrompt(promptParams.topic, promptParams.style, promptParams.length, promptParams.audience);
      setPrompt(newPrompt);
      setShowPromptGenerator(false);
    } catch (error) {
      console.error('Error generating prompt:', error);
      alert('Failed to generate prompt. Please try again.');
    }
    setIsLoading(false);
  };

  // Exam mode functions
  const startExamMode = () => {
    if (window.confirm(`Start exam mode with ${Math.floor(examTimeRemaining / 60)} minutes and ${targetWordCount} word target?`)) {
      setExamMode(true);
      setExamStartTime(new Date());
      setFocusMode(true);
      setShowAnalysis(false);
      setShowTips(false);
    }
  };

  const stopExamMode = () => {
    if (window.confirm('Are you sure you want to end the exam session?')) {
      setExamMode(false);
      setExamStartTime(null);
      setFocusMode(false);
      setShowAnalysis(true);
      setShowTips(true);
    }
  };

  // Planning functions
  const updatePlanningData = (field: keyof typeof planningData, value: string) => {
    setPlanningData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Get writing tips based on text type
  const getWritingTips = () => {
    const tips = {
      narrative: [
        "📖 Start with an exciting hook to grab your reader's attention",
        "👥 Create interesting characters that readers can connect with",
        "🎬 Show, don't tell - use actions and dialogue instead of just describing",
        "🌟 Use vivid descriptions to help readers picture the scene",
        "🎯 Make sure your story has a clear beginning, middle, and end",
        "💭 Include the character's thoughts and feelings"
      ],
      persuasive: [
        '💪 Start with a strong opinion statement',
        '📊 Use facts and examples to support your argument',
        '🎯 Think about what your reader might disagree with',
        '🔗 Connect your ideas with linking words',
        '✨ End with a powerful conclusion'
      ],
      descriptive: [
        '👁️ Use your five senses to describe things',
        '🎨 Choose specific, colorful adjectives',
        '📸 Help readers create a picture in their mind',
        '🌈 Compare things using similes and metaphors',
        '📝 Organize your description from general to specific'
      ],
      expository: [
        '📚 Start by introducing your topic clearly',
        '🔢 Organize your information in logical order',
        '💡 Use examples to explain difficult concepts',
        '🔗 Connect your paragraphs with transition words',
        '📋 Summarize your main points at the end'
      ]
    };
    
    return tips[textType as keyof typeof tips] || tips.narrative;
  };

  const issueCounts = getIssueCounts();

  return (
    <div className={`flex h-screen font-sans antialiased ${darkMode ? 'dark' : ''} ${focusMode ? 'focus-mode' : ''}`}>
      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${focusMode ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
        {/* Exam Mode Header */}
        {examMode && (
          <div className="fixed top-0 left-0 right-0 bg-red-600 text-white p-2 flex items-center justify-between shadow-lg z-50">
            <div className="flex items-center space-x-4">
              <Clock className="w-5 h-5 mr-2" />
              <span className="font-bold text-lg">EXAM MODE</span>
            </div>
            <div className="text-sm">
              Time Remaining: <span className="font-mono text-lg">{formatTime(examTimeRemaining)}</span>
            </div>
            <div className="text-sm">
              Words: <span className="font-bold">{wordCount}/{targetWordCount}</span>
            </div>
            <button
              onClick={stopExamMode}
              className="flex items-center px-3 py-1 bg-red-700 hover:bg-red-800 rounded text-sm font-medium"
            >
              <StopCircle className="w-4 h-4 mr-1" />
              End Exam
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col" style={{ marginTop: examMode ? '60px' : '0' }}>
          {/* Prompt Section */}
          <div className={`${focusMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-lg shadow-sm p-4 mb-3 mx-3 mt-3 transition-colors duration-300`}>
            <div className="flex items-center mb-2">
              <Lightbulb className="w-4 h-4 mr-2 text-yellow-500" />
              <span className={`text-base font-bold ${focusMode ? 'text-gray-200' : 'text-gray-800'}`}>Your Writing Prompt</span>
            </div>
            <p className={`${focusMode ? 'text-gray-300' : 'text-gray-600'} text-sm leading-relaxed`}>
             {prompt || "Write an engaging story about a character who discovers something unexpected that changes their life forever. Include vivid descriptions, realistic dialogue, and show the character's emotional journey. Make sure your story has a clear beginning, middle, and end with a satisfying conclusion. Focus on showing rather than telling, and use sensory details to bring your story to life."}
            </p>
          </div>

          {/* CONSOLIDATED ANALYSIS SECTION - Unified AI Writing Analysis */}
          <div className={`${focusMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-lg shadow-sm p-3 mb-3 mx-3 transition-colors duration-300`}>
            <div className="flex items-center justify-between mb-2">
              <h4 className={`text-sm font-semibold ${focusMode ? 'text-gray-200' : 'text-gray-800'} flex items-center`}>
                <BarChart3 className="w-4 h-4 mr-2" />
                AI Writing Analysis
              </h4>
              <button
                onClick={() => setShowAnalysis(!showAnalysis)}
                className={`p-1 rounded ${focusMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                {showAnalysis ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
            
            {showAnalysis && (
              <div className="space-y-3">
                {/* Overall Score */}
                {evaluation && (
                  <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium text-blue-800">Overall Score</span>
                    <div className="flex items-center">
                      <div className="w-16 h-2 bg-blue-200 rounded-full mr-2">
                        <div 
                          className="h-2 bg-blue-600 rounded-full transition-all duration-300"
                          style={{ width: `${evaluation.score}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold text-blue-800">{evaluation.score}/100</span>
                    </div>
                  </div>
                )}

                {/* Detailed Feedback */}
                {evaluation?.detailedFeedback && (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(evaluation.detailedFeedback).map(([category, data]) => (
                      <div key={category} className={`p-2 rounded ${focusMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`font-medium capitalize ${focusMode ? 'text-gray-200' : 'text-gray-700'}`}>
                            {category}
                          </span>
                          <span className={`text-xs ${focusMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {data.score}/100
                          </span>
                        </div>
                        <div className={`w-full h-1 ${focusMode ? 'bg-gray-600' : 'bg-gray-200'} rounded-full`}>
                          <div 
                            className="h-1 bg-blue-500 rounded-full transition-all duration-300"
                            style={{ width: `${data.score}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Strengths and Improvements */}
                {evaluation && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className={`p-2 rounded ${focusMode ? 'bg-green-900/20' : 'bg-green-50'}`}>
                      <div className="flex items-center mb-1">
                        <CheckCircle className="w-3 h-3 mr-1 text-green-600" />
                        <span className={`font-medium ${focusMode ? 'text-green-400' : 'text-green-800'}`}>Strengths</span>
                      </div>
                      <p className={`${focusMode ? 'text-green-300' : 'text-green-700'}`}>{evaluation.strengths}</p>
                    </div>
                    <div className={`p-2 rounded ${focusMode ? 'bg-orange-900/20' : 'bg-orange-50'}`}>
                      <div className="flex items-center mb-1">
                        <Target className="w-3 h-3 mr-1 text-orange-600" />
                        <span className={`font-medium ${focusMode ? 'text-orange-400' : 'text-orange-800'}`}>Improvements</span>
                      </div>
                      <p className={`${focusMode ? 'text-orange-300' : 'text-orange-700'}`}>{evaluation.improvements}</p>
                    </div>
                  </div>
                )}

                {/* Issues Summary */}
                {issues.length > 0 && (
                  <div className="flex flex-wrap gap-2 text-xs">
                    {issueCounts.errors > 0 && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {issueCounts.errors} errors
                      </span>
                    )}
                    {issueCounts.warnings > 0 && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {issueCounts.warnings} warnings
                      </span>
                    )}
                    {issueCounts.suggestions > 0 && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full flex items-center">
                        <Lightbulb className="w-3 h-3 mr-1" />
                        {issueCounts.suggestions} suggestions
                      </span>
                    )}
                  </div>
                )}

                {isAnalyzing && (
                  <div className="flex items-center justify-center py-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    <span className={`text-xs ${focusMode ? 'text-gray-300' : 'text-gray-600'}`}>Analyzing your writing...</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Writing Area */}
          <div className="flex-1 mx-3 mb-3">
            <div className={`${focusMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-lg shadow-sm h-full flex flex-col transition-colors duration-300`}>
              {/* Toolbar */}
              <div className={`flex items-center justify-between p-3 border-b ${focusMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleSave}
                    className={`p-2 rounded ${focusMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'} transition-colors`}
                    title="Save"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  <label className={`p-2 rounded cursor-pointer ${focusMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'} transition-colors`} title="Load">
                    <Upload className="w-4 h-4" />
                    <input type="file" accept=".txt" onChange={handleLoad} className="hidden" />
                  </label>
                  <button
                    onClick={handleClear}
                    className={`p-2 rounded ${focusMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'} transition-colors`}
                    title="Clear"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <div className={`h-4 w-px ${focusMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
                  <button
                    onClick={() => setFocusMode(!focusMode)}
                    className={`p-2 rounded ${focusMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'} transition-colors`}
                    title={focusMode ? "Exit Focus Mode" : "Enter Focus Mode"}
                  >
                    {focusMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    className={`p-2 rounded ${focusMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'} transition-colors`}
                    title={darkMode ? "Light Mode" : "Dark Mode"}
                  >
                    {darkMode ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
                
                <div className="flex items-center space-x-2">
                  {!examMode && (
                    <button
                      onClick={startExamMode}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium flex items-center"
                    >
                      <Timer className="w-4 h-4 mr-1" />
                      Exam Mode
                    </button>
                  )}
                  <button
                    onClick={() => setShowPlanning(!showPlanning)}
                    className={`p-2 rounded ${focusMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'} transition-colors`}
                    title="Planning Tools"
                  >
                    <BookOpen className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowStructureGuide(true)}
                    className={`p-2 rounded ${focusMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'} transition-colors`}
                    title="Structure Guide"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Text Area */}
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  onMouseUp={handleTextSelection}
                  onKeyUp={handleTextSelection}
                  placeholder="Start writing your story here..."
                  className={`w-full h-full p-4 resize-none border-none outline-none text-base leading-relaxed ${
                    focusMode 
                      ? 'bg-gray-800 text-white placeholder-gray-400' 
                      : 'bg-white text-gray-900 placeholder-gray-500'
                  } transition-colors duration-300`}
                  style={{ 
                    fontFamily: 'Georgia, serif',
                    lineHeight: '1.8'
                  }}
                />
                
                {/* Synonym Popup */}
                {showSynonyms && (
                  <div className="absolute top-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-10 max-w-xs">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-gray-800">Synonyms for "{selectedWord}"</h4>
                      <button
                        onClick={() => setShowSynonyms(false)}
                        className="text-gray-500 hover:text-gray-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-1">
                      {synonyms.map((synonym, index) => (
                        <button
                          key={index}
                          onClick={() => replaceSynonym(synonym)}
                          className="block w-full text-left px-2 py-1 text-sm text-gray-700 hover:bg-blue-50 rounded"
                        >
                          {synonym}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rephrase Popup */}
                {showRephrase && (
                  <div className="absolute top-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-10 max-w-md">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-gray-800">Rephrase Options</h4>
                      <button
                        onClick={() => setShowRephrase(false)}
                        className="text-gray-500 hover:text-gray-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      {rephrasedSentences.map((rephrase, index) => (
                        <button
                          key={index}
                          onClick={() => replaceRephrase(rephrase)}
                          className="block w-full text-left px-2 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded border border-gray-100"
                        >
                          {rephrase}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Status Bar */}
              <WritingStatusBar
                wordCount={wordCount}
                characterCount={characterCount}
                sentenceCount={sentenceCount}
                paragraphCount={paragraphCount}
                readingTime={readingTime}
                gradeLevel={gradeLevel}
                lastSaved={lastSaved}
                darkMode={focusMode}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Planning Panel */}
      {showPlanning && (
        <StructuredPlanningSection
          planningData={planningData}
          onUpdatePlanningData={updatePlanningData}
          onClose={() => setShowPlanning(false)}
          darkMode={focusMode}
        />
      )}

      {/* Writing Tips Panel */}
      {showTips && !focusMode && (
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
                Writing Tips
              </h3>
              <button
                onClick={() => setShowTips(false)}
                className="text-gray-500 hover:text-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-2 capitalize">{textType} Writing Tips</h4>
              <ul className="space-y-2">
                {getWritingTips().map((tip, index) => (
                  <li key={index} className="text-sm text-gray-600 leading-relaxed">
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            {/* Quick Stats */}
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Quick Stats</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Words:</span>
                  <span className="font-medium">{wordCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Characters:</span>
                  <span className="font-medium">{characterCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sentences:</span>
                  <span className="font-medium">{sentenceCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Paragraphs:</span>
                  <span className="font-medium">{paragraphCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Reading Time:</span>
                  <span className="font-medium">{readingTime} min</span>
                </div>
                <div className="flex justify-between">
                  <span>Grade Level:</span>
                  <span className="font-medium">{gradeLevel}</span>
                </div>
              </div>
            </div>

            {/* Writing Issues */}
            {issues.length > 0 && (
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-2">Writing Issues</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {issues.slice(0, 5).map((issue, index) => (
                    <div key={index} className={`p-2 rounded text-xs ${
                      issue.severity === 'error' ? 'bg-red-50 border border-red-200' :
                      issue.severity === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                      'bg-blue-50 border border-blue-200'
                    }`}>
                      <div className="flex items-center mb-1">
                        <span className={`font-medium capitalize ${
                          issue.severity === 'error' ? 'text-red-800' :
                          issue.severity === 'warning' ? 'text-yellow-800' :
                          'text-blue-800'
                        }`}>
                          {issue.type}
                        </span>
                        <span className={`ml-2 px-1 py-0.5 rounded text-xs ${
                          issue.severity === 'error' ? 'bg-red-200 text-red-800' :
                          issue.severity === 'warning' ? 'bg-yellow-200 text-yellow-800' :
                          'bg-blue-200 text-blue-800'
                        }`}>
                          {issue.severity}
                        </span>
                      </div>
                      <p className={`${
                        issue.severity === 'error' ? 'text-red-700' :
                        issue.severity === 'warning' ? 'text-yellow-700' :
                        'text-blue-700'
                      }`}>
                        {issue.message}
                      </p>
                      {issue.suggestions.length > 0 && (
                        <div className="mt-1">
                          <span className={`text-xs font-medium ${
                            issue.severity === 'error' ? 'text-red-800' :
                            issue.severity === 'warning' ? 'text-yellow-800' :
                            'text-blue-800'
                          }`}>
                            Suggestions: 
                          </span>
                          <span className={`text-xs ml-1 ${
                            issue.severity === 'error' ? 'text-red-700' :
                            issue.severity === 'warning' ? 'text-yellow-700' :
                            'text-blue-700'
                          }`}>
                            {issue.suggestions.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                  {issues.length > 5 && (
                    <p className="text-xs text-gray-500 text-center">
                      +{issues.length - 5} more issues
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Structure Guide Modal */}
      {showStructureGuide && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-lg mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Writing Structure Guide</h3>
              <button onClick={() => setShowStructureGuide(false)} className="text-gray-500 hover:text-gray-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-sm text-gray-700 space-y-3">
              <p><strong>Introduction:</strong> Hook the reader, introduce characters, and set the scene.</p>
              <p><strong>Rising Action:</strong> Build suspense, introduce conflicts, and develop characters.</p>
              <p><strong>Climax:</strong> The most exciting part of the story, where the main conflict is faced.</p>
              <p><strong>Falling Action:</strong> The events after the climax, leading to the resolution.</p>
              <p><strong>Conclusion:</strong> Wrap up the story and provide a satisfying ending.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getIssueCounts() {
  // This function should be implemented to count issues by severity
  // For now, returning a placeholder
  return {
    errors: 0,
    warnings: 0,
    suggestions: 0
  };
}
