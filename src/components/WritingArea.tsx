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
  try    const content = await makeOpenAICall(
      'You are a spelling checker for NSW Selective School writing tests. Find misspelled words and return their exact positions in the text.',
      `Find spelling errors in this text: "${text}"\n\nReturn a JSON array with this format:\n[\n  {\n    "word": "exact_misspelled_word_from_text",\n    "suggestions": ["correction1", "correction2"],\n    "message": "Spelling error"\n  }\n]\n\nOnly return genuinely misspelled words. Return empty array [] if no errors.`,
      1000
    );return Array.isArray(results) ? results.map((item: any) => {
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
    } catch (parseError) {
      console.error('Failed to parse spelling results:', parseError);
      return [];
    }
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
          content: `Find basic words that could be improved in this text: "${text}"

Return a JSON array with this format:
[
  {
    "word": "exact_basic_word_from_text",
    "suggestions": ["sophisticated1", "sophisticated2", "sophisticated3"],
    "message": "Consider a more sophisticated word"
  }
]

Focus on words like "good", "bad", "said", "went", "big", "small". Return empty array [] if no improvements needed.`
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
          content: `Find punctuation errors in this text: "${text}"

Return a JSON array with this format:
[
  {
    "word": "text_around_punctuation_issue",
    "suggestions": ["corrected_version"],
    "message": "Punctuation issue description"
  }
]

Return empty array [] if no errors found.`
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
          content: `Analyze sentence structure in this text: "${text}"

Return a JSON array with this format:
[
  {
    "word": "sentence_or_phrase_with_issue",
    "suggestions": ["improvement1", "improvement2"],
    "message": "Sentence structure suggestion"
  }
]

Return empty array [] if no issues found.`
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
          content: `Analyze paragraph structure in this text: "${text}"

Return a JSON array with this format:
[
  {
    "word": "paragraph_beginning_or_issue",
    "suggestions": ["improvement1", "improvement2"],
    "message": "Paragraph structure suggestion"
  }
]

Return empty array [] if no issues found.`
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
      allIssues.push(...basicIssues);
    }
    
    // Remove duplicates and sort by position
    const uniqueIssues = allIssues.filter((issue, index, self) => 
      index === self.findIndex(i => i.start === issue.start && i.end === issue.end && i.type === issue.type)
    );
    
    return uniqueIssues.sort((a, b) => a.start - b.start);
  } catch (error) {
    console.error('AI writing check failed:', error);
    // Fallback to basic analysis if AI fails
    return analyzeContentBasic(text);
  }
}

// ENHANCED: Detailed evaluation function that includes all writing issues
async function evaluateEssayDetailed(text: string, textType: string, writingIssues: WritingIssue[]): Promise<DetailedEvaluation> {
  try {
    // Organize issues by type
    const organizedIssues = {
      spelling: writingIssues.filter(issue => issue.type === 'spelling'),
      punctuation: writingIssues.filter(issue => issue.type === 'punctuation'),
      grammar: writingIssues.filter(issue => issue.type === 'grammar'),
      vocabulary: writingIssues.filter(issue => issue.type === 'vocabulary'),
      sentence: writingIssues.filter(issue => issue.type === 'sentence'),
      paragraph: writingIssues.filter(issue => issue.type === 'paragraph')
    };

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are an expert NSW Selective School writing evaluator. Provide detailed feedback on ${textType} writing.`
        },
        {
          role: 'user',
          content: `Evaluate this ${textType} writing and provide detailed feedback:

Text: "${text}"

Writing Issues Found:
- Spelling errors: ${organizedIssues.spelling.length} (${organizedIssues.spelling.map(i => i.word).join(', ')})
- Punctuation issues: ${organizedIssues.punctuation.length} (${organizedIssues.punctuation.map(i => i.word).join(', ')})
- Grammar issues: ${organizedIssues.grammar.length} (${organizedIssues.grammar.map(i => i.word).join(', ')})
- Vocabulary suggestions: ${organizedIssues.vocabulary.length} (${organizedIssues.vocabulary.map(i => i.word).join(', ')})
- Sentence structure: ${organizedIssues.sentence.length} issues
- Paragraph structure: ${organizedIssues.paragraph.length} issues

Provide a comprehensive evaluation including:
1. Overall score (0-100)
2. Strengths of the writing
3. Areas for improvement
4. Detailed feedback addressing the specific issues found
5. Specific recommendations for improvement

Format your response as JSON:
{
  "score": number,
  "strengths": "string",
  "improvements": "string", 
  "detailedFeedback": "string",
  "recommendations": ["recommendation1", "recommendation2", "recommendation3"]
}`
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

export default function WritingArea({ onContentChange, initialContent = '', textType = 'narrative', prompt: propPrompt, onPromptChange }: WritingAreaProps) {
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
        '📖 Start with an exciting hook to grab your reader\'s attention',
        '👥 Create interesting characters that readers can connect with',
        '🎬 Show, don\'t tell - use actions and dialogue instead of just describing',
        '🌟 Use vivid descriptions to help readers picture the scene',
        '🎯 Make sure your story has a clear beginning, middle, and end',
        '💭 Include the character\'s thoughts and feelings to show their journey'
      ],
      persuasive: [
        '🎯 Start with a strong opinion statement (your thesis)',
        '📊 Use facts, statistics, and expert opinions to support your arguments',
        '🤔 Think about what others might say and address their concerns',
        '📝 Use persuasive words like "clearly," "obviously," "without doubt"',
        '🔗 Connect your ideas with transition words like "furthermore," "however"',
        '🎯 End with a strong call to action'
      ],
      expository: [
        '📚 Start with a clear topic sentence in each paragraph',
        '🔍 Explain your topic step by step',
        '📖 Use examples to make your explanations clear',
        '🎯 Stay focused on your main topic',
        '📝 Use transition words like "first," "next," "finally"',
        '✅ End by summarizing your main points'
      ],
      reflective: [
        '🤔 Think deeply about what the experience meant to you',
        '💭 Describe not just what happened, but how you felt',
        '🌱 Show how the experience changed or taught you something',
        '🎨 Use descriptive language to paint a picture',
        '🔗 Connect your experience to bigger life lessons',
        '✨ Be honest and personal in your writing'
      ],
      descriptive: [
        '🎨 Use vivid adjectives to paint a picture with words',
        '👀 Appeal to all five senses (sight, sound, smell, taste, touch)',
        '📐 Organize details in a logical order (top to bottom, left to right)',
        '🌟 Use figurative language like similes and metaphors',
        '🎯 Focus on the most important details',
        '✨ Make the reader feel like they are there with you'
      ]
    };
    
    return tips[textType.toLowerCase() as keyof typeof tips] || tips.narrative;
  };

  const issueCounts = getIssueCounts();
  const qualityScore = getQualityScore();

  return (
    <div className={`flex h-full ${focusMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}>
      {/* Exam Mode Overlay */}
      {examMode && (
        <div className="fixed top-0 left-0 right-0 z-40 bg-red-600 text-white px-4 py-2 flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
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
            {prompt || 'Write an engaging story about a character who discovers something unexpected that changes their life forever. Include vivid descriptions, realistic dialogue, and show the character\'s emotional journey. Make sure your story has a clear beginning, middle, and end with a satisfying conclusion. Focus on showing rather than telling, and use sensory details to bring your story to life.'}
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
                  <div className="text-center">
                    <p className="text-indigo-200 text-xs mb-3 font-medium">Ask your Writing Buddy anything!</p>
                    <div className="text-xs text-indigo-300 space-y-2 text-left">
                      <p className="flex items-start">
                        <span className="text-yellow-400 mr-2">•</span>
                        "How can I improve my introduction?"
                      </p>
                      <p className="flex items-start">
                        <span className="text-yellow-400 mr-2">•</span>
                        "What's a good synonym for 'said'?"
                      </p>
                      <p className="flex items-start">
                        <span className="text-yellow-400 mr-2">•</span>
                        "Help me with my conclusion"
                      </p>
                    </div>
                  </div>
                )}
                {chatMessages.map((message) => (
                  <div key={message.id} className={`mb-3 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
                    <div className={`inline-block p-2 rounded-lg text-xs max-w-[90%] leading-relaxed ${
                      message.sender === 'user' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-white text-gray-800 shadow-sm'
                    }`}>
                      {message.text.split('\n').map((line, index) => (
                        <div key={index}>{line}</div>
                      ))}
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="text-center py-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-200 mx-auto"></div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              
              <form onSubmit={handleChatSubmit} className="flex space-x-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask for help..."
                  className="flex-1 px-3 py-2 text-xs text-gray-900 bg-white rounded border-none focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isChatLoading}
                  className="px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-indigo-900 rounded disabled:opacity-50 text-xs font-medium transition-colors"
                >
                  <Send className="w-3 h-3" />
                </button>
              </form>
            </div>
          )}

          {activeTab === 'analysis' && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold mb-3 text-indigo-100 text-center">Writing Analysis</h3>
              
              <div className="bg-indigo-700 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-indigo-200">Overall Score</span>
                  <span className={`text-lg font-bold ${qualityScore >= 70 ? 'text-green-400' : qualityScore >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {qualityScore}%
                  </span>
                </div>
                
                <div className="space-y-2">
                  {Object.entries(issueCounts).filter(([key]) => key !== 'total').map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center">
                      <span className="text-xs text-indigo-200 capitalize">{type}</span>
                      <span className={`text-xs font-medium ${count === 0 ? 'text-green-400' : count <= 2 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {count === 0 ? '✓ Good' : count === 1 ? '1 issue' : `${count} issues`}
                      </span>
                    </div>
                  ))}
                </div>
                
                {isCheckingWriting && (
                  <div className="mt-2 text-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-200 mx-auto"></div>
                    <p className="text-xs text-indigo-300 mt-1">AI analyzing your writing...</p>
                  </div>
                )}
                
                {content.trim().length < 50 && (
                  <div className="mt-2 p-2 bg-indigo-800 rounded text-xs">
                    <p className="text-yellow-300">💡 Tip: Add more content to get a complete analysis!</p>
                  </div>
                )}
              </div>

              {/* ENHANCED: Show detailed evaluation with all issues */}
              {evaluation && (
                <div className="bg-indigo-700 rounded-lg p-3 max-h-96 overflow-y-auto">
                  <h4 className="text-xs font-medium text-indigo-200 mb-2">📊 Detailed Evaluation Report</h4>
                  <div className="text-xs text-indigo-100 space-y-2">
                    <div className="border-b border-indigo-600 pb-2">
                      <p><strong>Overall Score:</strong> <span className={`${evaluation.score >= 70 ? 'text-green-400' : evaluation.score >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>{evaluation.score}/100</span></p>
                    </div>
                    
                    <div className="border-b border-indigo-600 pb-2">
                      <p><strong>✅ Strengths:</strong></p>
                      <p className="text-green-300">{evaluation.strengths}</p>
                    </div>
                    
                    <div className="border-b border-indigo-600 pb-2">
                      <p><strong>🎯 Areas for Improvement:</strong></p>
                      <p className="text-yellow-300">{evaluation.improvements}</p>
                    </div>

                    {/* Show all writing issues found */}
                    <div className="border-b border-indigo-600 pb-2">
                      <p><strong>🔍 Issues Found:</strong></p>
                      {Object.entries(evaluation.writingIssues).map(([type, issues]) => (
                        issues.length > 0 && (
                          <div key={type} className="mt-1">
                            <p className="text-red-300 capitalize font-medium">{type} ({issues.length}):</p>
                            {issues.slice(0, 3).map((issue, index) => (
                              <div key={index} className="ml-2 text-xs">
                                • "{issue.word}" - {issue.message}
                                {issue.suggestions.length > 0 && (
                                  <span className="text-green-300"> → {issue.suggestions.slice(0, 2).join(', ')}</span>
                                )}
                              </div>
                            ))}
                            {issues.length > 3 && (
                              <p className="ml-2 text-xs text-indigo-300">...and {issues.length - 3} more</p>
                            )}
                          </div>
                        )
                      ))}
                    </div>

                    <div className="border-b border-indigo-600 pb-2">
                      <p><strong>💡 Detailed Feedback:</strong></p>
                      <p className="text-indigo-200">{evaluation.detailedFeedback}</p>
                    </div>

                    <div>
                      <p><strong>📝 Recommendations:</strong></p>
                      {evaluation.recommendations.map((rec, index) => (
                        <p key={index} className="text-blue-300">• {rec}</p>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'vocabulary' && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold mb-3 text-indigo-100 text-center">Vocabulary Helper</h3>
              
              {selectedText && (
                <div className="bg-indigo-700 rounded-lg p-3">
                  <h4 className="text-xs font-medium text-indigo-200 mb-2">Selected: "{selectedText}"</h4>
                  <button
                    onClick={handleGetSynonyms}
                    disabled={isLoadingSynonyms}
                    className="w-full px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-indigo-900 rounded text-xs font-medium disabled:opacity-50"
                  >
                    {isLoadingSynonyms ? 'Getting synonyms...' : 'Get AI Synonyms'}
                  </button>
                </div>
              )}

              <div className="bg-indigo-700 rounded-lg p-3">
                <h4 className="text-xs font-medium text-indigo-200 mb-2">Vocabulary Suggestions</h4>
                <div className="text-xs text-indigo-100 space-y-1">
                  {writingIssues.filter(issue => issue.type === 'vocabulary').slice(0, 5).map((issue, index) => (
                    <div key={index} className="border-b border-indigo-600 pb-1">
                      <p><strong>Replace:</strong> {issue.word}</p>
                      <p><strong>With:</strong> {issue.suggestions.join(', ')}</p>
                    </div>
                  ))}
                  {writingIssues.filter(issue => issue.type === 'vocabulary').length === 0 && (
                    <p className="text-indigo-300 italic">No vocabulary suggestions yet. Keep writing!</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'progress' && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold mb-3 text-indigo-100 text-center">Writing Progress</h3>
              
              <div className="bg-indigo-700 rounded-lg p-3">
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-indigo-200">Words Written:</span>
                    <span className="text-white font-medium">{wordCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-indigo-200">Time Spent:</span>
                    <span className="text-white font-medium">{formatTime(timeSpent)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-indigo-200">Words/Minute:</span>
                    <span className="text-white font-medium">{progressData.averageWordsPerMinute}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-indigo-200">Issues Found:</span>
                    <span className="text-white font-medium">{issueCounts.total}</span>
                  </div>
                </div>
              </div>

              <div className="bg-indigo-700 rounded-lg p-3">
                <h4 className="text-xs font-medium text-indigo-200 mb-2">Writing Quality</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-indigo-200">Overall Quality:</span>
                    <span className={`font-medium ${qualityScore >= 70 ? 'text-green-400' : qualityScore >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {qualityScore}%
                    </span>
                  </div>
                  <div className="w-full bg-indigo-800 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${qualityScore >= 70 ? 'bg-green-400' : qualityScore >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`}
                      style={{ width: `${qualityScore}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Kid Planning Modal */}
      {showKidPlanningModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setShowKidPlanningModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Story Planning Helper</h2>
              <p className="text-gray-600">Let's plan your amazing story step by step!</p>
              <div className="flex justify-center mt-4">
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5, 6].map((step) => (
                    <div
                      key={step}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        step <= planningStep 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mb-6">
              {planningStep === 1 && (
                <div className="text-center">
                  <div className="text-6xl mb-4">👥</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Who are your characters?</h3>
                  <p className="text-gray-600 mb-4">Tell us about the main character in your story. What do they look like? What are they like?</p>
                  <textarea
                    value={kidPlanningData.characters}
                    onChange={(e) => updateKidPlanningData('characters', e.target.value)}
                    placeholder="Example: Sarah is a brave 12-year-old girl with curly red hair..."
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                    rows={4}
                  />
                </div>
              )}

              {planningStep === 2 && (
                <div className="text-center">
                  <div className="text-6xl mb-4">🏞️</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Where does your story happen?</h3>
                  <p className="text-gray-600 mb-4">Describe the place where your story takes place. Is it a school, forest, city, or somewhere magical?</p>
                  <textarea
                    value={kidPlanningData.setting}
                    onChange={(e) => updateKidPlanningData('setting', e.target.value)}
                    placeholder="Example: A mysterious old library with tall bookshelves and dusty books..."
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                    rows={4}
                  />
                </div>
              )}

              {planningStep === 3 && (
                <div className="text-center">
                  <div className="text-6xl mb-4">⚡</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">What's the problem?</h3>
                  <p className="text-gray-600 mb-4">Every good story has a problem or challenge. What goes wrong? What needs to be solved?</p>
                  <textarea
                    value={kidPlanningData.problem}
                    onChange={(e) => updateKidPlanningData('problem', e.target.value)}
                    placeholder="Example: Sarah discovers that all the books in the library are disappearing one by one..."
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                    rows={4}
                  />
                </div>
              )}

              {planningStep === 4 && (
                <div className="text-center">
                  <div className="text-6xl mb-4">🎬</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">What happens in your story?</h3>
                  <p className="text-gray-600 mb-4">List the main events. What does your character do to try to solve the problem?</p>
                  <textarea
                    value={kidPlanningData.events}
                    onChange={(e) => updateKidPlanningData('events', e.target.value)}
                    placeholder="Example: Sarah searches the library, finds clues, meets a magical librarian..."
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                    rows={4}
                  />
                </div>
              )}

              {planningStep === 5 && (
                <div className="text-center">
                  <div className="text-6xl mb-4">✅</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">How is the problem solved?</h3>
                  <p className="text-gray-600 mb-4">How does your story end? How is the problem fixed? What happens to your characters?</p>
                  <textarea
                    value={kidPlanningData.solution}
                    onChange={(e) => updateKidPlanningData('solution', e.target.value)}
                    placeholder="Example: Sarah learns a magic spell that brings all the books back to the library..."
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                    rows={4}
                  />
                </div>
              )}

              {planningStep === 6 && (
                <div className="text-center">
                  <div className="text-6xl mb-4">😊</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">How do the characters feel?</h3>
                  <p className="text-gray-600 mb-4">Describe the emotions in your story. How do characters feel at different parts?</p>
                  <textarea
                    value={kidPlanningData.feelings}
                    onChange={(e) => updateKidPlanningData('feelings', e.target.value)}
                    placeholder="Example: Sarah feels scared at first, then excited when she discovers the magic..."
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                    rows={4}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <button
                onClick={handleKidPlanningPrev}
                disabled={planningStep === 1}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              
              <button
                onClick={() => setShowKidPlanningModal(false)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Cancel
              </button>
              
              <button
                onClick={handleKidPlanningNext}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                {planningStep === 6 ? 'Finish Plan! 🎉' : 'Next →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Structure Guide Modal */}
      {showStructureGuide && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setShowStructureGuide(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="pr-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {textType.charAt(0).toUpperCase() + textType.slice(1)} Writing Structure
              </h2>
              
              {/* Narrative Structure */}
              {(textType.toLowerCase() === 'narrative' || textType.toLowerCase() === 'story') && (
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-2">Narrative Story Structure</h3>
                    <p className="text-blue-700 dark:text-blue-400 mb-3">A narrative tells a story with characters, setting, and events:</p>
                    
                    <div className="space-y-3">
                      <div className="border-l-4 border-blue-500 pl-3">
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200">1. Beginning (Introduction)</h4>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">• Introduce your main character<br/>• Describe the setting (where and when)<br/>• Start with an exciting hook to grab attention</p>
                      </div>
                      
                      <div className="border-l-4 border-green-500 pl-3">
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200">2. Middle (Problem & Events)</h4>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">• Present the main problem or challenge<br/>• Show what the character does to solve it<br/>• Include exciting events and dialogue</p>
                      </div>
                      
                      <div className="border-l-4 border-purple-500 pl-3">
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200">3. End (Solution)</h4>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">• Show how the problem is solved<br/>• Describe how characters feel<br/>• End with a satisfying conclusion</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Add other text type structures as needed */}
            </div>
          </div>
        </div>
      )}

      {/* Synonyms Popup */}
      {showSynonyms && selectedText && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-4 max-w-sm w-full mx-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">AI Synonyms for "{selectedText}"</h3>
              <button
                onClick={() => setShowSynonyms(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {isLoadingSynonyms ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-sm text-gray-600 mt-2">AI generating synonyms...</p>
              </div>
            ) : (
              <div className="space-y-2">
                {synonyms.map((synonym, index) => (
                  <button
                    key={index}
                    className="block w-full text-left px-3 py-2 hover:bg-gray-100 rounded"
                    onClick={() => {
                      // Replace selected text with synonym
                      const textarea = textareaRef.current;
                      if (textarea) {
                        const start = textarea.selectionStart;
                        const end = textarea.selectionEnd;
                        const newContent = content.substring(0, start) + synonym + content.substring(end);
                        setContent(newContent);
                        setShowSynonyms(false);
                      }
                    }}
                  >
                    {synonym}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}