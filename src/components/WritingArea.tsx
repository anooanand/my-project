import React, { useState, useEffect, useRef } from 'react';
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
  writingIssues: {
    spelling: WritingIssue[];
    punctuation: WritingIssue[];
    grammar: WritingIssue[];
    vocabulary: WritingIssue[];
    sentence: WritingIssue[];
    paragraph: WritingIssue[];
  };
  detailedFeedback: string;
  recommendations: string[];
}

// IMPROVED: Content analysis with better issue detection
function analyzeContentBasic(text: string): WritingIssue[] {
  const issues: WritingIssue[] = [];
  const words = text.trim().split(/\s+/).filter(word => word.length > 0);
  
  // If content is too short, provide feedback
  if (text.trim().length < 50) {
    issues.push({
      type: 'paragraph',
      word: text.substring(0, Math.min(20, text.length)),
      start: 0,
      end: Math.min(20, text.length),
      suggestions: ['Add more content to develop your ideas', 'Expand with more details and examples'],
      message: 'Content is too short for a complete analysis',
      severity: 'warning'
    });
  }
  
  // Check for basic punctuation issues
  if (!text.trim().endsWith('.') && !text.trim().endsWith('!') && !text.trim().endsWith('?') && text.trim().length > 10) {
    const lastFewChars = text.substring(Math.max(0, text.length - 5));
    issues.push({
      type: 'punctuation',
      word: lastFewChars,
      start: Math.max(0, text.length - 5),
      end: text.length,
      suggestions: [lastFewChars + '.', lastFewChars + '!', lastFewChars + '?'],
      message: 'Consider ending with proper punctuation',
      severity: 'suggestion'
    });
  }
  
  // Check for basic words and common misspellings
  const basicWords = ['good', 'bad', 'nice', 'big', 'small', 'said', 'went', 'got', 'very', 'really'];
  const commonMisspellings = {
    'wint': ['went', 'want', 'win'],
    'teh': ['the'],
    'adn': ['and'],
    'recieve': ['receive'],
    'seperate': ['separate'],
    'definately': ['definitely'],
    'occured': ['occurred'],
    'begining': ['beginning'],
    'writting': ['writing'],
    'grammer': ['grammar']
  };
  
  let currentPosition = 0;
  
  words.forEach((word) => {
    const wordStart = text.indexOf(word, currentPosition);
    if (wordStart !== -1) {
      const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
      
      // Check for misspellings
      if (commonMisspellings[cleanWord]) {
        issues.push({
          type: 'spelling',
          word: word,
          start: wordStart,
          end: wordStart + word.length,
          suggestions: commonMisspellings[cleanWord],
          message: 'Possible spelling error',
          severity: 'error'
        });
      }
      // Check for basic vocabulary
      else if (basicWords.includes(cleanWord)) {
        issues.push({
          type: 'vocabulary',
          word: word,
          start: wordStart,
          end: wordStart + word.length,
          suggestions: getBasicSynonyms(cleanWord),
          message: 'Consider using a more sophisticated word',
          severity: 'suggestion'
        });
      }
      
      currentPosition = wordStart + word.length;
    }
  });
  
  // Check for sentence structure issues
  if (words.length > 0 && words.length < 5) {
    issues.push({
      type: 'sentence',
      word: text.substring(0, Math.min(20, text.length)),
      start: 0,
      end: Math.min(20, text.length),
      suggestions: ['Expand this into a complete sentence', 'Add more details to develop your idea'],
      message: 'This appears to be a fragment rather than a complete sentence',
      severity: 'warning'
    });
  }
  
  return issues;
}

function getBasicSynonyms(word: string): string[] {
  const synonyms: { [key: string]: string[] } = {
    'good': ['excellent', 'wonderful', 'fantastic', 'outstanding'],
    'bad': ['terrible', 'awful', 'dreadful', 'horrible'],
    'nice': ['pleasant', 'delightful', 'charming', 'lovely'],
    'big': ['enormous', 'massive', 'gigantic', 'colossal'],
    'small': ['tiny', 'miniature', 'petite', 'compact'],
    'said': ['declared', 'announced', 'exclaimed', 'whispered'],
    'went': ['traveled', 'journeyed', 'ventured', 'proceeded'],
    'got': ['obtained', 'acquired', 'received', 'gained'],
    'very': ['extremely', 'incredibly', 'remarkably', 'exceptionally'],
    'really': ['truly', 'genuinely', 'absolutely', 'certainly']
  };
  
  return synonyms[word] || ['improved word', 'better alternative', 'more sophisticated term'];
}

// AI Writing Analysis Functions
async function checkSpellingAI(text: string): Promise<WritingIssue[]> {
  try {
    const content = await makeOpenAICall(
      'You are a spelling checker for NSW Selective School writing tests. Find misspelled words and return their exact positions in the text.',
      `Find spelling errors in this text: "${text}"\n\nReturn a JSON array with this format:\n[\n  {\n    "word": "exact_misspelled_word_from_text",\n    "suggestions": ["correction1", "correction2"],\n    "message": "Spelling error"\n  }\n]\n\nOnly return genuinely misspelled words. Return empty array [] if no errors.`,
      1000
    );
    const results = JSON.parse(content);
    return Array.isArray(results) ? results.map((item: any) => {
        const wordToFind = item.word || '';
        const wordStart = text.indexOf(wordToFind);
        
        return {
          type: 'spelling' as const,
          word: wordToFind,
          start: wordStart !== -1 ? wordStart : 0,
          end: wordStart !== -1 ? wordStart + wordToFind.length : wordToFind.length,
          suggestions: Array.isArray(item.suggestions) ? item.suggestions : [],
          message: item.message || 'Spelling error',
          severity: 'error' as const
        };
      }).filter(issue => issue.start !== -1) : [];
  } catch (error) {
    console.error('Spelling check error:', error);
    return [];
  }
}

async function checkGrammarAI(text: string): Promise<WritingIssue[]> {
  try {
    
    try {
      const results = JSON.parse(content);
      return Array.isArray(results) ? results.map((item: any) => {
        const phraseToFind = item.word || '';
        const phraseStart = text.indexOf(phraseToFind);
        
        return {
          type: 'grammar' as const,
          word: phraseToFind,
          start: phraseStart !== -1 ? phraseStart : 0,
          end: phraseStart !== -1 ? phraseStart + phraseToFind.length : phraseToFind.length,
          suggestions: Array.isArray(item.suggestions) ? item.suggestions : [],
          message: item.message || 'Grammar issue',
          severity: 'error' as const
        };
      }).filter(issue => issue.start !== -1) : [];
    } catch (parseError) {
      return [];
    }
  } catch (error) {
    console.error('Grammar check error:', error);
    return [];
  }
}

async function checkVocabularyAI(text: string): Promise<WritingIssue[]> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a vocabulary enhancer for NSW Selective School writing. Find basic words that could be upgraded.'
        },
        {
          role: 'user',
          content: `Find basic words that could be improved in this text: "${text}"\n\nReturn a JSON array with this format:\n[\n  {\n    "word": "exact_basic_word_from_text",\n    "suggestions": ["sophisticated1", "sophisticated2", "sophisticated3"],\n    "message": "Consider a more sophisticated word"\n  }\n]\n\nFocus on words like "good", "bad", "said", "went", "big", "small". Return empty array [] if no improvements needed.`
        }
      ],
      max_tokens: 1000,
      temperature: 0.3
    });

    const content = response.choices[0]?.message?.content || '';
    
    try {
      const results = JSON.parse(content);
      return Array.isArray(results) ? results.map((item: any) => {
        const wordToFind = item.word || '';
        const wordStart = text.indexOf(wordToFind);
        
        return {
          type: 'vocabulary' as const,
          word: wordToFind,
          start: wordStart !== -1 ? wordStart : 0,
          end: wordStart !== -1 ? wordStart + wordToFind.length : wordToFind.length,
          suggestions: Array.isArray(item.suggestions) ? item.suggestions : [],
          message: item.message || 'Consider a more sophisticated word',
          severity: 'suggestion' as const
        };
      }).filter(issue => issue.start !== -1) : [];
    } catch (parseError) {
      return [];
    }
  } catch (error) {
    console.error('Vocabulary check error:', error);
    return [];
  }
}

async function checkPunctuationAI(text: string): Promise<WritingIssue[]> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a punctuation checker for NSW Selective School writing. Find punctuation errors.'
        },
        {
          role: 'user',
          content: `Find punctuation errors in this text: "${text}"\n\nReturn a JSON array with this format:\n[\n  {\n    "word": "text_around_punctuation_issue",\n    "suggestions": ["corrected_version"],\n    "message": "Punctuation issue description"\n  }\n]\n\nReturn empty array [] if no errors found.`
        }
      ],
      max_tokens: 1000,
      temperature: 0.1
    });

    const content = response.choices[0]?.message?.content || '';
    
    try {
      const results = JSON.parse(content);
      return Array.isArray(results) ? results.map((item: any) => {
        const phraseToFind = item.word || '';
        const phraseStart = text.indexOf(phraseToFind);
        
        return {
          type: 'punctuation' as const,
          word: phraseToFind,
          start: phraseStart !== -1 ? phraseStart : 0,
          end: phraseStart !== -1 ? phraseStart + phraseToFind.length : phraseToFind.length,
          suggestions: Array.isArray(item.suggestions) ? item.suggestions : [],
          message: item.message || 'Punctuation issue',
          severity: 'error' as const
        };
      }).filter(issue => issue.start !== -1) : [];
    } catch (parseError) {
      return [];
    }
  } catch (error) {
    console.error('Punctuation check error:', error);
    return [];
  }
}

async function checkSentenceStructureAI(text: string): Promise<WritingIssue[]> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a sentence structure analyzer for NSW Selective School writing. Find sentence structure issues.'
        },
        {
          role: 'user',
          content: `Analyze sentence structure in this text: "${text}"\n\nReturn a JSON array with this format:\n[\n  {\n    "word": "sentence_or_phrase_with_issue",\n    "suggestions": ["improvement1", "improvement2"],\n    "message": "Sentence structure suggestion"\n  }\n]\n\nReturn empty array [] if no issues found.`
        }
      ],
      max_tokens: 1000,
      temperature: 0.2
    });

    const content = response.choices[0]?.message?.content || '';
    
    try {
      const results = JSON.parse(content);
      return Array.isArray(results) ? results.map((item: any) => {
        const phraseToFind = item.word || '';
        const phraseStart = text.indexOf(phraseToFind);
        
        return {
          type: 'sentence' as const,
          word: phraseToFind,
          start: phraseStart !== -1 ? phraseStart : 0,
          end: phraseStart !== -1 ? phraseStart + phraseToFind.length : phraseToFind.length,
          suggestions: Array.isArray(item.suggestions) ? item.suggestions : [],
          message: item.message || 'Sentence structure suggestion',
          severity: 'suggestion' as const
        };
      }).filter(issue => issue.start !== -1) : [];
    } catch (parseError) {
      return [];
    }
  } catch (error) {
    console.error('Sentence structure check error:', error);
    return [];
  }
}

async function checkParagraphStructureAI(text: string): Promise<WritingIssue[]> {
  try {
    const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
    if (paragraphs.length < 2) return [];

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a paragraph structure analyzer for NSW Selective School writing. Find paragraph structure issues.'
        },
        {
          role: 'user',
          content: `Analyze paragraph structure in this text: "${text}"\n\nReturn a JSON array with this format:\n[\n  {\n    "word": "paragraph_beginning_or_issue",\n    "suggestions": ["improvement1", "improvement2"],\n    "message": "Paragraph structure suggestion"\n  }\n]\n\nReturn empty array [] if no issues found.`
        }
      ],
      max_tokens: 1000,
      temperature: 0.2
    });

    const content = response.choices[0]?.message?.content || '';
    
    try {
      const results = JSON.parse(content);
      return Array.isArray(results) ? results.map((item: any) => {
        const phraseToFind = item.word || '';
        const phraseStart = text.indexOf(phraseToFind);
        
        return {
          type: 'paragraph' as const,
          word: phraseToFind,
          start: phraseStart !== -1 ? phraseStart : 0,
          end: phraseStart !== -1 ? phraseStart + phraseToFind.length : phraseToFind.length,
          suggestions: Array.isArray(item.suggestions) ? item.suggestions : [],
          message: item.message || 'Paragraph structure suggestion',
          severity: 'suggestion' as const
        };
      }).filter(issue => issue.start !== -1) : [];
    } catch (parseError) {
      return [];
    }
  } catch (error) {
    console.error('Paragraph structure check error:', error);
    return [];
  }
}

// Main AI Writing Checker
async function checkAllWritingAI(text: string, enabledChecks: any): Promise<WritingIssue[]> {
  if (!text.trim()) {
    return [];
  }

  // For very short content, use basic analysis
  if (text.trim().length < 30) {
    return analyzeContentBasic(text);
  }

  try {
    const checks = [];
    
    if (enabledChecks.spelling) checks.push(checkSpellingAI(text));
    if (enabledChecks.punctuation) checks.push(checkPunctuationAI(text));
    if (enabledChecks.grammar) checks.push(checkGrammarAI(text));
    if (enabledChecks.vocabulary) checks.push(checkVocabularyAI(text));
    if (enabledChecks.sentence) checks.push(checkSentenceStructureAI(text));
    if (enabledChecks.paragraph) checks.push(checkParagraphStructureAI(text));

    const results = await Promise.all(checks);
    const allIssues = results.flat();
    
    // Add basic analysis for short content even with AI
    if (text.trim().length < 100) {
      const basicIssues = analyzeContentBasic(text);
      return [...allIssues, ...basicIssues];
    }
    
    return allIssues;
  } catch (error) {
    console.error('AI writing check failed:', error);
    return analyzeContentBasic(text);
  }
}

// ENHANCED: Detailed evaluation with all issues
async function evaluateEssayDetailed(text: string, textType: string, writingIssues: WritingIssue[]): Promise<DetailedEvaluation> {
  try {
    const organizedIssues = {
      spelling: writingIssues.filter(issue => issue.type === 'spelling'),
      punctuation: writingIssues.filter(issue => issue.type === 'punctuation'),
      grammar: writingIssues.filter(issue => issue.type === 'grammar'),
      vocabulary: writingIssues.filter(issue => issue.type === 'vocabulary'),
      sentence: writingIssues.filter(issue => issue.type === 'sentence'),
      paragraph: writingIssues.filter(issue => issue.type === 'paragraph')
    };

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content: `You are an expert NSW Selective School writing evaluator. Provide detailed feedback on ${textType} writing.`
        },
        {
          role: 'user',
          content: `Evaluate this ${textType} writing and provide detailed feedback:\n\nText: "${text}"\n\nWriting Issues Found:\n- Spelling errors: ${organizedIssues.spelling.length} (${organizedIssues.spelling.map(i => i.word).join(', ')})\n- Punctuation issues: ${organizedIssues.punctuation.length} (${organizedIssues.punctuation.map(i => i.word).join(', ')})\n- Grammar issues: ${organizedIssues.grammar.length} (${organizedIssues.grammar.map(i => i.word).join(', ')})\n- Vocabulary suggestions: ${organizedIssues.vocabulary.length} (${organizedIssues.vocabulary.map(i => i.word).join(', ')})\n- Sentence structure: ${organizedIssues.sentence.length} issues\n- Paragraph structure: ${organizedIssues.paragraph.length} issues\n\nProvide a comprehensive evaluation including:\n1. Overall score (0-100)\n2. Strengths of the writing\n3. Areas for improvement\n4. Detailed feedback addressing the specific issues found\n5. Specific recommendations for improvement\n\nFormat your response as JSON:\n{\n  "score": number,\n  "strengths": "string",\n  "improvements": "string", \n  "detailedFeedback": "string",\n  "recommendations": ["recommendation1", "recommendation2", "recommendation3"]\n}`
        }
      ],
      max_tokens: 1500,
      temperature: 0.3
    });

    const content = response.choices[0]?.message?.content || '';
    
    try {
      const evaluation = JSON.parse(content);
      return {
        score: evaluation.score || 50,
        strengths: evaluation.strengths || 'Good effort on your writing!',
        improvements: evaluation.improvements || 'Continue practicing to improve your skills.',
        writingIssues: organizedIssues,
        detailedFeedback: evaluation.detailedFeedback || 'Keep working on developing your writing skills.',
        recommendations: evaluation.recommendations || ['Practice writing regularly', 'Read more books', 'Ask for feedback']
      };
    } catch (parseError) {
      console.error('Failed to parse evaluation:', parseError);
      return {
        score: 50,
        strengths: 'Good effort on your writing!',
        improvements: 'Continue practicing to improve your skills.',
        writingIssues: organizedIssues,
        detailedFeedback: 'Keep working on developing your writing skills.',
        recommendations: ['Practice writing regularly', 'Read more books', 'Ask for feedback']
      };
    }
  } catch (error) {
    console.error('Evaluation error:', error);
    const organizedIssues = {
      spelling: writingIssues.filter(issue => issue.type === 'spelling'),
      punctuation: writingIssues.filter(issue => issue.type === 'punctuation'),
      grammar: writingIssues.filter(issue => issue.type === 'grammar'),
      vocabulary: writingIssues.filter(issue => issue.type === 'vocabulary'),
      sentence: writingIssues.filter(issue => issue.type === 'sentence'),
      paragraph: writingIssues.filter(issue => issue.type === 'paragraph')
    };
    
    return {
      score: 50,
      strengths: 'Good effort on your writing!',
      improvements: 'Continue practicing to improve your skills.',
      writingIssues: organizedIssues,
      detailedFeedback: 'Keep working on developing your writing skills.',
      recommendations: ['Practice writing regularly', 'Read more books', 'Ask for feedback']
    };
  }
}

export function WritingArea({ onContentChange, initialContent = '', textType = 'narrative', prompt: propPrompt, onPromptChange }: WritingAreaProps) {
  // State management
  const [content, setContent] = useState(initialContent);
  const [prompt, setPrompt] = useState(propPrompt || '');
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const [showPlanningModal, setShowPlanningModal] = useState(false);
  const [activeTab, setActiveTab] = useState('ai-coach');
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showWordCount, setShowWordCount] = useState(true);
  const [fontSize, setFontSize] = useState(16);
  const [lineHeight, setLineHeight] = useState(1.6);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [showSynonyms, setShowSynonyms] = useState(false);
  const [synonyms, setSynonyms] = useState<string[]>([]);
  const [isLoadingSynonyms, setIsLoadingSynonyms] = useState(false);
  const [evaluation, setEvaluation] = useState<DetailedEvaluation | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [planningNotes, setPlanningNotes] = useState('');
  const [writingGoals, setWritingGoals] = useState('');
  const [timeSpent, setTimeSpent] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [paraphraseInput, setParaphraseInput] = useState('');
  const [paraphraseOutput, setParaphraseOutput] = useState('');
  const [isParaphrasing, setIsParaphrasing] = useState(false);
  const [vocabularyWords, setVocabularyWords] = useState<string[]>([]);
  const [progressData, setProgressData] = useState({ wordsWritten: 0, timeSpent: 0, sessionsCompleted: 0, averageWordsPerMinute: 0 });
  
  // NSW Selective Exam specific features
  const [examMode, setExamMode] = useState(false);
  const [examTimeLimit, setExamTimeLimit] = useState(30 * 60);
  const [examTimeRemaining, setExamTimeRemaining] = useState(examTimeLimit);
  const [targetWordCount, setTargetWordCount] = useState(300);
  const [showStructureGuide, setShowStructureGuide] = useState(false);
  const [examStartTime, setExamStartTime] = useState<Date | null>(null);
  
  // Chat functionality for Writing Buddy
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
  }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  // Planning section state
  const [showPlanningSection, setShowPlanningSection] = useState(false);
  const [savedPlan, setSavedPlan] = useState<any>(null);
  
  // New features
  const [showWritingTips, setShowWritingTips] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  
  // Kid-friendly Planning Phase state
  const [showKidPlanningModal, setShowKidPlanningModal] = useState(false);
  const [planningStep, setPlanningStep] = useState(1);
  const [kidPlanningData, setKidPlanningData] = useState({
    characters: '',
    setting: '',
    problem: '',
    events: '',
    solution: '',
    feelings: ''
  });

  // AI-Enhanced writing checking state (NO HIGHLIGHTING)
  const [writingIssues, setWritingIssues] = useState<WritingIssue[]>([]);
  const [enabledChecks, setEnabledChecks] = useState({
    spelling: true,
    punctuation: true,
    grammar: true,
    vocabulary: true,
    sentence: true,
    paragraph: true
  });
  const [isCheckingWriting, setIsCheckingWriting] = useState(false);
  const [showAnalysisDetails, setShowAnalysisDetails] = useState(false);

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimeSpent(prev => prev + 1);
        if (examMode && examTimeRemaining > 0) {
          setExamTimeRemaining(prev => prev - 1);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, examMode, examTimeRemaining]);

  // Auto-save effect
  useEffect(() => {
    const saveTimer = setTimeout(() => {
      if (content.trim()) {
        setIsAutoSaving(true);
        setTimeout(() => {
          setIsAutoSaving(false);
          setLastSaved(new Date());
        }, 500);
      }
    }, 2000);
    return () => clearTimeout(saveTimer);
  }, [content]);

  // Update word count and other metrics
  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;
    const characterCount = content.length;
    const readingTime = Math.ceil(wordCount / 200);
    setWordCount(wordCount);
    setCharacterCount(characterCount);
    setReadingTime(readingTime);
    if (onContentChange) {
      onContentChange(content);
    }
    setProgressData(prev => ({
      ...prev,
      wordsWritten: wordCount,
      averageWordsPerMinute: timeSpent > 0 ? Math.round((wordCount / timeSpent) * 60) : 0
    }));
  }, [content, onContentChange, timeSpent]);

  // AI-Enhanced writing checking effect - Background analysis only
  useEffect(() => {
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }

    checkTimeoutRef.current = setTimeout(async () => {
      if (content.trim()) {
        setIsCheckingWriting(true);
        try {
          const issues = await checkAllWritingAI(content, enabledChecks);
          setWritingIssues(issues);
        } catch (error) {
          console.error('AI writing check failed:', error);
          const basicIssues = analyzeContentBasic(content);
          setWritingIssues(basicIssues);
        } finally {
          setIsCheckingWriting(false);
        }
      } else {
        setWritingIssues([]);
        setIsCheckingWriting(false);
      }
    }, 2000);

    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, [content, enabledChecks]);

  // Handle content change
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  // Handle text selection for synonyms
  const handleTextSelection = () => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const selected = content.substring(start, end).trim();
      
      if (selected && selected.split(' ').length === 1) {
        setSelectedText(selected);
      } else {
        setSelectedText('');
        setShowSynonyms(false);
      }
    }
  };

  // Get issue counts by type
  const getIssueCounts = () => {
    const counts = {
      spelling: 0,
      punctuation: 0,
      grammar: 0,
      vocabulary: 0,
      sentence: 0,
      paragraph: 0,
      total: writingIssues.length
    };

    writingIssues.forEach(issue => {
      counts[issue.type]++;
    });

    return counts;
  };

  // Calculate realistic quality score based on content and issues
  const getQualityScore = () => {
    const wordCount = content.trim().split(/\s+/).filter(word => word.length > 0).length;
    const issueCount = writingIssues.length;
    
    // Base score starts lower for very short content
    let baseScore = 60;
    if (wordCount < 5) baseScore = 30;
    else if (wordCount < 20) baseScore = 50;
    else if (wordCount < 50) baseScore = 70;
    else baseScore = 80;
    
    // Deduct points for issues
    const deduction = Math.min(issueCount * 8, 50); // Max 50 point deduction
    
    return Math.max(10, baseScore - deduction);
  };

  // Start exam mode
  const startExamMode = () => {
    setExamMode(true);
    setExamStartTime(new Date());
    setExamTimeRemaining(examTimeLimit);
    setIsTimerRunning(true);
  };

  // Stop exam mode
  const stopExamMode = () => {
    setExamMode(false);
    setIsTimerRunning(false);
    setExamStartTime(null);
  };

  // Format time display
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // ENHANCED: Handle evaluation with detailed report including all issues
  const handleEvaluate = async () => {
    if (!content.trim()) return;
    
    setIsEvaluating(true);
    try {
      // First ensure we have the latest writing issues
      let currentIssues = writingIssues;
      if (content.trim()) {
        currentIssues = await checkAllWritingAI(content, enabledChecks);
        setWritingIssues(currentIssues);
      }
      
      // Get detailed evaluation including all issues
      const result = await evaluateEssayDetailed(content, textType, currentIssues);
      setEvaluation(result);
    } catch (error) {
      console.error('Evaluation error:', error);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Get synonyms for selected text
  const handleGetSynonyms = async () => {
    if (!selectedText) return;
    
    setIsLoadingSynonyms(true);
    try {
      const result = await getSynonyms(selectedText);
      setSynonyms(result);
      setShowSynonyms(true);
    } catch (error) {
      console.error('Synonyms error:', error);
    } finally {
      setIsLoadingSynonyms(false);
    }
  };

  // Chat submission handler using existing OpenAI integration
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      text: chatInput,
      sender: 'user' as const,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      // Use existing OpenAI integration
const content = await makeOpenAICall(
      'You are a spelling checker for NSW Selective School writing tests. Find misspelled words and return their exact positions in the text.',
      `Find spelling errors in this text: "${text}"\n\nReturn a JSON array with this format:\n[\n  {\n    "word": "exact_misspelled_word_from_text",\n    "suggestions": ["correction1", "correction2"],\n    "message": "Spelling error"\n  }\n]\n\nOnly return genuinely misspelled words. Return empty array [] if no errors.`,
      1000
    );
      
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        text: response.choices[0]?.message?.content || "I'd be happy to help you with your writing! Can you tell me more about what specific aspect you'd like assistance with?",
        sender: 'ai' as const,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorResponse = {
        id: (Date.now() + 1).toString(),
        text: "I'm having trouble connecting right now, but I'm here to help! Try asking your question again.",
        sender: 'ai' as const,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Kid planning modal handlers
  const handleKidPlanningNext = () => {
    if (planningStep < 6) {
      setPlanningStep(planningStep + 1);
    } else {
      // Finish planning
      const planSummary = `Characters: ${kidPlanningData.characters}\nSetting: ${kidPlanningData.setting}\nProblem: ${kidPlanningData.problem}\nEvents: ${kidPlanningData.events}\nSolution: ${kidPlanningData.solution}\nFeelings: ${kidPlanningData.feelings}`;
      setPlanningNotes(planSummary);
      setShowKidPlanningModal(false);
      setPlanningStep(1);
    }
  };

  const handleKidPlanningPrev = () => {
    if (planningStep > 1) {
      setPlanningStep(planningStep - 1);
    }
  };

  const updateKidPlanningData = (field: string, value: string) => {
    setKidPlanningData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Get writing tips based on text type
  const getWritingTips = () => {
    const tips = {
      narrative: [
        '📖 Start with an exciting hook to grab your reader\\'s attention',
        '👥 Create interesting characters that readers can connect with',
        '🎬 Show, don\\'t tell - use actions and dialogue instead of just describing',
        '🌟 Use vivid descriptions to help readers picture the scene',
        '🎯 Make sure your story has a clear beginning, middle, and end',
        '💭 Include the character\\'s thoughts and feelings'
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
           {prompt || 'Write an engaging story about a character who discovers something unexpected that changes their life forever. Include vivid descriptions, realistic dialogue, and show the character\\'s emotional journey. Make sure your story has a clear beginning, middle, and end with a satisfying conclusion. Focus on showing rather than telling, and use sensory details to bring your story to life.'}
          </p>
        </div>

        {/* CONSOLIDATED ANALYSIS SECTION - Unified AI Writing Analysis */}
        <div className={`${focusMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-lg shadow-sm p-3 mb-3 mx-3 transition-colors duration-300`}>
          <div className="flex items-center justify-between mb-2">
            <h4 className={`text-sm font-semibold ${focusMode ? 'text-gray-200' : 'text-gray-800'} flex items-center`}>
              <BarChart3 className="w-4 h-4 mr-2" />
              AI Writing Analysis
              {isCheckingWriting && (
                <div className="ml-2 animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
              )}
            </h4>
            <div className="flex items-center space-x-2">
              <div className={`text-xs ${focusMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {isCheckingWriting ? 'AI analyzing...' : `${issueCounts.total} issues found`}
              </div>
              <button
                onClick={() => setShowAnalysisDetails(!showAnalysisDetails)}
                className={`text-xs px-2 py-1 rounded ${focusMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {showAnalysisDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>
          </div>
          
          {/* Compact Color-Coded Check Indicators */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {Object.entries(enabledChecks).map(([type, enabled]) => {
              const colors = {
                spelling: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
                punctuation: { bg: '#fecaca', border: '#ef4444', text: '#991b1b' },
                grammar: { bg: '#ddd6fe', border: '#8b5cf6', text: '#5b21b6' },
                vocabulary: { bg: '#bbf7d0', border: '#10b981', text: '#065f46' },
                sentence: { bg: '#fed7aa', border: '#f97316', text: '#9a3412' },
                paragraph: { bg: '#bfdbfe', border: '#3b82f6', text: '#1e40af' }
              };
              
              const typeColors = colors[type as keyof typeof colors];
              const count = issueCounts[type as keyof typeof issueCounts];
              
              return (
                <div
                  key={type}
                  className="flex items-center space-x-1 px-2 py-1 rounded-full border"
                  style={{
                    backgroundColor: enabled ? typeColors.bg : '#f3f4f6',
                    borderColor: enabled ? typeColors.border : '#d1d5db',
                    color: enabled ? typeColors.text : '#6b7280'
                  }}
                >
                  <button
                    onClick={() => setEnabledChecks(prev => ({ ...prev, [type]: !enabled }))}
                    className="w-3 h-3 rounded-full border flex items-center justify-center"
                    style={{
                      backgroundColor: enabled ? typeColors.border : 'transparent',
                      borderColor: typeColors.border
                    }}
                  >
                    {enabled && <Check className="w-2 h-2 text-white" />}
                  </button>
                  <span className="capitalize font-medium">{type}</span>
                  <span className="font-bold">{count}</span>
                </div>
              );
            })}
          </div>

          {/* Detailed Analysis (Expandable) */}
          {showAnalysisDetails && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
              <div className="grid grid-cols-2 gap-3 text-xs">
                {Object.entries(issueCounts).filter(([key]) => key !== 'total').map(([type, count]) => (
                  <div key={type} className={`flex justify-between items-center p-2 rounded ${focusMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <span className={`capitalize ${focusMode ? 'text-gray-300' : 'text-gray-700'}`}>{type}</span>
                    <span className={`font-bold ${count > 0 ? 'text-red-500' : 'text-green-500'}`}>
                      {count === 0 ? '✓' : count}
                    </span>
                  </div>
                ))}
              </div>
              
              {writingIssues.length > 0 && (
                <div className="mt-3">
                  <h5 className={`text-xs font-medium mb-2 ${focusMode ? 'text-gray-300' : 'text-gray-700'}`}>Recent Issues:</h5>
                  <div className="space-y-1">
                    {writingIssues.slice(0, 3).map((issue, index) => (
                      <div key={index} className={`text-xs p-2 rounded ${focusMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <span className="font-medium capitalize">{issue.type}:</span> {issue.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Writing Tips Section */}
        {showWritingTips && (
          <div className={`${focusMode ? 'bg-gray-800 border-gray-700' : 'bg-blue-50 border-blue-200'} border rounded-lg p-4 mx-3 mb-3`}>
            <div className="flex items-center justify-between mb-3">
              <h4 className={`text-sm font-semibold ${focusMode ? 'text-blue-300' : 'text-blue-800'}`}>
                💡 {textType.charAt(0).toUpperCase() + textType.slice(1)} Writing Tips
              </h4>
              <button
                onClick={() => setShowWritingTips(false)}
                className={`text-xs ${focusMode ? 'text-gray-400 hover:text-gray-300' : 'text-blue-600 hover:text-blue-800'}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className={`text-sm ${focusMode ? 'text-gray-300' : 'text-blue-700'} space-y-2`}>
              {getWritingTips().map((tip, index) => (
                <p key={index} className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>{tip}</span>
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Writing Area */}
        <div className="flex-1 flex flex-col px-3 pb-3">
          <div className={`${focusMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-lg shadow-sm flex-1 flex flex-col overflow-hidden transition-colors duration-300`}>
            {/* Writing Area Header */}
            <div className={`px-3 py-2 ${focusMode ? 'border-gray-700' : 'border-gray-200'} border-b flex items-center justify-between`}>
              <h3 className={`text-sm font-medium ${focusMode ? 'text-gray-200' : 'text-gray-900'}`}>Your Writing</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowKidPlanningModal(true)}
                  className="flex items-center px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  Planning Phase
                </button>
                <button
                  onClick={startExamMode}
                  disabled={examMode}
                  className="flex items-center px-2 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 transition-colors disabled:opacity-50"
                >
                  <Clock className="w-3 h-3 mr-1" />
                  {examMode ? 'Exam Active' : 'Start Exam Mode'}
                </button>
                <button
                  onClick={() => setShowStructureGuide(true)}
                  className="flex items-center px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors"
                >
                  <BookOpen className="w-3 h-3 mr-1" />
                  Structure Guide
                </button>
                <button
                  onClick={() => setShowWritingTips(!showWritingTips)}
                  className="flex items-center px-2 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600 transition-colors"
                >
                  <Lightbulb className="w-3 h-3 mr-1" />
                  Tips
                </button>
                <button
                  onClick={() => setFocusMode(!focusMode)}
                  className="flex items-center px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition-colors"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  Focus
                </button>
              </div>
            </div>

            {/* SIMPLIFIED Text Area - NO HIGHLIGHTING OVERLAY */}
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={handleContentChange}
                onMouseUp={handleTextSelection}
                onKeyUp={handleTextSelection}
                placeholder="Start writing your amazing story here! Let your creativity flow and bring your ideas to life..."
                className={`w-full h-full p-4 text-sm leading-relaxed ${
                  focusMode 
                    ? 'text-gray-100 bg-gray-800 placeholder-gray-500' 
                    : 'text-gray-900 bg-white placeholder-gray-400'
                } focus:outline-none resize-none transition-colors duration-300`}
                style={{ 
                  fontSize: `${fontSize}px`, 
                  lineHeight: lineHeight,
                  fontFamily: 'Georgia, serif'
                }}
                spellCheck={false}
              />
            </div>
            
            {/* Enhanced Status Bar */}
            <div className={`px-3 py-2 ${focusMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} border-t flex items-center justify-between transition-colors duration-300`}>
              <div className={`flex items-center space-x-4 text-xs ${focusMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <div className="flex items-center space-x-1">
                  <FileText className="w-3 h-3" />
                  <span>{wordCount} words</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{characterCount} characters</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Eye className="w-3 h-3" />
                  <span>{readingTime} min read</span>
                </div>
                {isAutoSaving && (
                  <div className="flex items-center space-x-1 text-blue-500">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
                    <span>Saving...</span>
                  </div>
                )}
                <div className="flex items-center space-x-1 text-green-600">
                  <CheckCircle className="w-3 h-3" />
                  <span>AI Analysis Active</span>
                </div>
                <div className="flex items-center space-x-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{issueCounts.total} issues</span>
                </div>
              </div>
              
              {/* CHANGED BUTTON TEXT TO "Submit for Evaluation Report" */}
              <button
                onClick={handleEvaluate}
                disabled={isEvaluating}
                className="flex items-center px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 focus:outline-none focus:ring-1 focus:ring-green-500 focus:ring-opacity-50 disabled:opacity-50"
              >
                {isEvaluating ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                    Generating Report...
                  </>
                ) : (
                  <>
                    <FileText className="w-3 h-3 mr-1" />
                    Submit for Evaluation Report
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Writing Buddy */}
      <div className="w-80 bg-gradient-to-b from-indigo-600 to-purple-700 text-white flex flex-col shadow-lg">
        {/* Header */}
        <div className="p-3 border-b border-indigo-500 bg-indigo-700">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-bold flex items-center text-white">
              <Bot className="w-4 h-4 mr-2" />
              Writing Buddy
            </h2>
            <button className="p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors">
              <Settings className="w-3 h-3 text-indigo-200" />
            </button>
          </div>
          <p className="text-indigo-200 text-xs">Your AI writing assistant</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-indigo-500 bg-indigo-600">
          {[
            { id: 'ai-coach', label: 'Coach', icon: Bot },
            { id: 'analysis', label: 'Analysis', icon: BarChart3 },
            { id: 'vocabulary', label: 'Vocabulary', icon: BookOpen },
            { id: 'progress', label: 'Progress', icon: TrendingUp }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-1 text-xs font-medium transition-colors flex flex-col items-center ${
                activeTab === tab.id 
                  ? 'bg-indigo-800 text-white border-b-2 border-yellow-400' 
                  : 'text-indigo-200 hover:bg-indigo-700 hover:text-white'
              }`}
            >
              <tab.icon className="w-3 h-3 mb-1" />
              <span className="text-xs leading-tight">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-3 overflow-y-auto bg-indigo-600">
          {activeTab === 'ai-coach' && (
            <div className="flex flex-col h-full">
              <h3 className="text-xs font-semibold mb-3 text-indigo-100 text-center">AI Coach</h3>
              <div className="flex-1 overflow-y-auto mb-3 bg-indigo-700 rounded-lg p-3">
                {chatMessages.length === 0 && (
                  <div className="text-center text-indigo-300 text-xs">
                    <p>Ask your Writing Buddy anything!</p>
                    <ul className="mt-2 space-y-1 text-left">
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>"How can I improve my introduction?"</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>"What's a good synonym for 'said'?"</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>"Help me with my conclusion"</span>
                      </li>
                    </ul>
                  </div>
                )}
                {chatMessages.map((message) => (
                  <div key={message.id} className={`mb-3 flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-2 rounded-lg max-w-xs text-sm ${
                      message.sender === 'user' 
                        ? 'bg-blue-500 text-white'
                        : 'bg-indigo-500 text-indigo-100'
                    }`}>
                      {message.text}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <form onSubmit={handleChatSubmit} className="flex space-x-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask for help..."
                  className="flex-grow p-2 bg-indigo-700 border border-indigo-500 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-yellow-400"
                />
                <button
                  type="submit"
                  disabled={isChatLoading}
                  className="p-2 bg-indigo-500 rounded-lg hover:bg-indigo-400 transition-colors disabled:opacity-50"
                >
                  {isChatLoading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Send className="w-4 h-4" />}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'analysis' && (
            <div>
              <h3 className="text-xs font-semibold mb-3 text-indigo-100 text-center">Detailed Analysis</h3>
              {evaluation ? (
                <div className="space-y-3 text-xs">
                  <div className="p-2 bg-indigo-700 rounded-lg">
                    <h4 className="font-bold mb-1">Overall Score: {evaluation.score}/100</h4>
                    <div className="w-full bg-indigo-500 rounded-full h-2">
                      <div className="bg-yellow-400 h-2 rounded-full" style={{ width: `${evaluation.score}%` }}></div>
                    </div>
                  </div>
                  <div className="p-2 bg-indigo-700 rounded-lg">
                    <h4 className="font-bold mb-1">Strengths</h4>
                    <p className="text-indigo-200">{evaluation.strengths}</p>
                  </div>
                  <div className="p-2 bg-indigo-700 rounded-lg">
                    <h4 className="font-bold mb-1">Areas for Improvement</h4>
                    <p className="text-indigo-200">{evaluation.improvements}</p>
                  </div>
                  <div className="p-2 bg-indigo-700 rounded-lg">
                    <h4 className="font-bold mb-1">Recommendations</h4>
                    <ul className="list-disc list-inside text-indigo-200 space-y-1">
                      {evaluation.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-center text-indigo-300 text-xs">
                  <p>Submit your writing for a detailed evaluation report.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'vocabulary' && (
            <div>
              <h3 className="text-xs font-semibold mb-3 text-indigo-100 text-center">Vocabulary Builder</h3>
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Enter a word..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setSelectedText(e.currentTarget.value);
                        handleGetSynonyms();
                      }
                    }}
                    className="flex-grow p-2 bg-indigo-700 border border-indigo-500 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-yellow-400"
                  />
                  <button
                    onClick={handleGetSynonyms}
                    disabled={isLoadingSynonyms}
                    className="p-2 bg-indigo-500 rounded-lg hover:bg-indigo-400 transition-colors disabled:opacity-50"
                  >
                    {isLoadingSynonyms ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Search className="w-4 h-4" />}
                  </button>
                </div>
                {showSynonyms && (
                  <div className="p-2 bg-indigo-700 rounded-lg">
                    <h4 className="font-bold text-xs mb-1">Synonyms for "{selectedText}"</h4>
                    <ul className="list-disc list-inside text-indigo-200 text-xs space-y-1">
                      {synonyms.map((syn, i) => <li key={i}>{syn}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'progress' && (
            <div>
              <h3 className="text-xs font-semibold mb-3 text-indigo-100 text-center">Your Progress</h3>
              <div className="space-y-2 text-xs">
                <div className="p-2 bg-indigo-700 rounded-lg flex justify-between">
                  <span>Words Written:</span>
                  <span className="font-bold">{progressData.wordsWritten}</span>
                </div>
                <div className="p-2 bg-indigo-700 rounded-lg flex justify-between">
                  <span>Time Spent:</span>
                  <span className="font-bold">{formatTime(progressData.timeSpent)}</span>
                </div>
                <div className="p-2 bg-indigo-700 rounded-lg flex justify-between">
                  <span>Words per Minute:</span>
                  <span className="font-bold">{progressData.averageWordsPerMinute}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Kid-friendly Planning Modal */}
      {showKidPlanningModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Let's Plan Your Story!</h3>
              <button onClick={() => setShowKidPlanningModal(false)} className="text-gray-500 hover:text-gray-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${(planningStep / 6) * 100}%` }}></div>
            </div>

            {planningStep === 1 && (
              <div>
                <h4 className="font-semibold mb-2">Who are your characters?</h4>
                <textarea value={kidPlanningData.characters} onChange={(e) => updateKidPlanningData('characters', e.target.value)} className="w-full p-2 border rounded" placeholder="e.g., a brave knight, a talking squirrel..."></textarea>
              </div>
            )}
            {planningStep === 2 && (
              <div>
                <h4 className="font-semibold mb-2">Where does your story happen?</h4>
                <textarea value={kidPlanningData.setting} onChange={(e) => updateKidPlanningData('setting', e.target.value)} className="w-full p-2 border rounded" placeholder="e.g., a magical forest, a futuristic city..."></textarea>
              </div>
            )}
            {planningStep === 3 && (
              <div>
                <h4 className="font-semibold mb-2">What is the problem?</h4>
                <textarea value={kidPlanningData.problem} onChange={(e) => updateKidPlanningData('problem', e.target.value)} className="w-full p-2 border rounded" placeholder="e.g., a dragon has stolen the king's crown..."></textarea>
              </div>
            )}
            {planningStep === 4 && (
              <div>
                <h4 className="font-semibold mb-2">What happens next?</h4>
                <textarea value={kidPlanningData.events} onChange={(e) => updateKidPlanningData('events', e.target.value)} className="w-full p-2 border rounded" placeholder="e.g., the knight and squirrel team up..."></textarea>
              </div>
            )}
            {planningStep === 5 && (
              <div>
                <h4 className="font-semibold mb-2">How is the problem solved?</h4>
                <textarea value={kidPlanningData.solution} onChange={(e) => updateKidPlanningData('solution', e.target.value)} className="w-full p-2 border rounded" placeholder="e.g., they trick the dragon with a shiny rock..."></textarea>
              </div>
            )}
            {planningStep === 6 && (
              <div>
                <h4 className="font-semibold mb-2">How do the characters feel at the end?</h4>
                <textarea value={kidPlanningData.feelings} onChange={(e) => updateKidPlanningData('feelings', e.target.value)} className="w-full p-2 border rounded" placeholder="e.g., happy, relieved, proud..."></textarea>
              </div>
            )}

            <div className="flex justify-between mt-4">
              <button onClick={handleKidPlanningPrev} disabled={planningStep === 1} className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50">Back</button>
              <button onClick={handleKidPlanningNext} className="px-4 py-2 bg-blue-500 text-white rounded">
                {planningStep === 6 ? 'Finish' : 'Next'}
              </button>
            </div>
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
