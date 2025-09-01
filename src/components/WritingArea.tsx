
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
  try {    const content = await makeOpenAICall(
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
    
    // Add basic analysis for short content even if AI checks are enabled
    const basicIssues = analyzeContentBasic(text);
    
    // Filter out duplicate issues if AI returns similar ones
    const combinedIssues = [...basicIssues];
    allIssues.forEach(aiIssue => {
      if (!basicIssues.some(basicIssue => 
        basicIssue.word === aiIssue.word && 
        basicIssue.type === aiIssue.type && 
        basicIssue.start === aiIssue.start
      )) {
        combinedIssues.push(aiIssue);
      }
    });

    return combinedIssues;
  } catch (error) {
    console.error('Error in checkAllWritingAI:', error);
    return [];
  }
}

interface FeedbackMessage {
  type: 'success' | 'error' | 'info';
  text: string;
}

interface AnalysisResult {
  score: number;
  strengths: string;
  improvements: string;
  detailedFeedback: string;
  recommendations: string[];
  writingIssues: {
    spelling: WritingIssue[];
    punctuation: WritingIssue[];
    grammar: WritingIssue[];
    vocabulary: WritingIssue[];
    sentence: WritingIssue[];
    paragraph: WritingIssue[];
  };
}

const WritingArea: React.FC<WritingAreaProps> = ({ onContentChange, initialContent = '', textType = 'narrative', prompt = '', onPromptChange }) => {
  const [content, setContent] = useState(initialContent);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [activeTab, setActiveTab] = useState<'planning' | 'writing' | 'analysis'>('writing');
  const [showIssues, setShowIssues] = useState(false);
  const [selectedIssueType, setSelectedIssueType] = useState<WritingIssue['type'] | 'all'>('all');
  const [planningContent, setPlanningContent] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState(prompt);
  const [showPromptGenerator, setShowPromptGenerator] = useState(false);
  const [promptGeneratorInput, setPromptGeneratorInput] = useState('');
  const [promptGeneratorLoading, setPromptGeneratorLoading] = useState(false);
  const [promptGeneratorError, setPromptGeneratorError] = useState<string | null>(null);
  const [showSynonymTool, setShowSynonymTool] = useState(false);
  const [synonymInput, setSynonymInput] = useState('');
  const [synonyms, setSynonyms] = useState<string[]>([]);
  const [synonymLoading, setSynonymLoading] = useState(false);
  const [synonymError, setSynonymError] = useState<string | null>(null);
  const [showRephraseTool, setShowRephraseTool] = useState(false);
  const [rephraseInput, setRephraseInput] = useState('');
  const [rephrasedSentences, setRephrasedSentences] = useState<string[]>([]);
  const [rephraseLoading, setRephraseLoading] = useState(false);
  const [rephraseError, setRephraseError] = useState<string | null>(null);
  const [aiCheckEnabled, setAiCheckEnabled] = useState(false);
  const [aiCheckSettings, setAiCheckSettings] = useState({
    spelling: true,
    punctuation: true,
    grammar: true,
    vocabulary: true,
    sentence: true,
    paragraph: true,
  });
  const [showAiCheckSettings, setShowAiCheckSettings] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initialContent) {
      setContent(initialContent);
      updateCounts(initialContent);
    }
  }, [initialContent]);

  useEffect(() => {
    if (onPromptChange) {
      onPromptChange(generatedPrompt);
    }
  }, [generatedPrompt, onPromptChange]);

  const updateCounts = (text: string) => {
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
    setCharCount(text.length);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    updateCounts(newContent);
    if (onContentChange) {
      onContentChange(newContent);
    }
  };

  const handleSubmit = async () => {
    if (content.trim() === '') {
      setFeedback({ type: 'error', text: 'Please write something before submitting.' });
      return;
    }

    setIsLoading(true);
    setFeedback(null);
    setAnalysisResult(null);
    setShowAnalysis(false);

    try {
      const evaluation = await evaluateEssay(content, textType);
      setAnalysisResult({
        score: evaluation.score,
        strengths: evaluation.strengths,
        improvements: evaluation.improvements,
        detailedFeedback: evaluation.detailedFeedback,
        recommendations: evaluation.recommendations,
        writingIssues: {
          spelling: evaluation.writingIssues.spelling || [],
          punctuation: evaluation.writingIssues.punctuation || [],
          grammar: evaluation.writingIssues.grammar || [],
          vocabulary: evaluation.writingIssues.vocabulary || [],
          sentence: evaluation.writingIssues.sentence || [],
          paragraph: evaluation.writingIssues.paragraph || [],
        },
      });
      setShowAnalysis(true);
      setActiveTab('analysis');
      setFeedback({ type: 'success', text: 'Writing analyzed successfully!' });
    } catch (error) {
      console.error('Error analyzing writing:', error);
      setFeedback({ type: 'error', text: 'Failed to analyze writing. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePrompt = async () => {
    if (promptGeneratorInput.trim() === '') {
      setPromptGeneratorError('Please enter a topic or keywords.');
      return;
    }
    setPromptGeneratorLoading(true);
    setPromptGeneratorError(null);
    try {
      const newPrompt = await generatePrompt(promptGeneratorInput, textType);
      setGeneratedPrompt(newPrompt);
      setFeedback({ type: 'success', text: 'New prompt generated!' });
      setShowPromptGenerator(false);
    } catch (error) {
      console.error('Error generating prompt:', error);
      setPromptGeneratorError('Failed to generate prompt. Please try again.');
    } finally {
      setPromptGeneratorLoading(false);
    }
  };

  const handleGetSynonyms = async () => {
    if (synonymInput.trim() === '') {
      setSynonymError('Please enter a word.');
      return;
    }
    setSynonymLoading(true);
    setSynonymError(null);
    try {
      const fetchedSynonyms = await getSynonyms(synonymInput);
      setSynonyms(fetchedSynonyms);
    } catch (error) {
      console.error('Error fetching synonyms:', error);
      setSynonymError('Failed to fetch synonyms. Please try again.');
    } finally {
      setSynonymLoading(false);
    }
  };

  const handleRephraseSentence = async () => {
    if (rephraseInput.trim() === '') {
      setRephraseError('Please enter a sentence to rephrase.');
      return;
    }
    setRephraseLoading(true);
    setRephraseError(null);
    try {
      const rephrased = await rephraseSentence(rephraseInput);
      setRephrasedSentences(rephrased);
    } catch (error) {
      console.error('Error rephrasing sentence:', error);
      setRephraseError('Failed to rephrase sentence. Please try again.');
    } finally {
      setRephraseLoading(false);
    }
  };

  const handleRunAIChecks = async () => {
    if (!aiCheckEnabled) return;

    setIsLoading(true);
    setFeedback(null);
    setAnalysisResult(null);
    setShowAnalysis(false);

    try {
      const issues = await checkAllWritingAI(content, aiCheckSettings);
      setAnalysisResult({
        score: 0, // AI checks don't provide a score directly
        strengths: 'AI-powered checks completed.',
        improvements: 'Review suggested improvements based on AI analysis.',
        detailedFeedback: 'Detailed AI analysis of your writing.',
        recommendations: [],
        writingIssues: {
          spelling: issues.filter(issue => issue.type === 'spelling'),
          punctuation: issues.filter(issue => issue.type === 'punctuation'),
          grammar: issues.filter(issue => issue.type === 'grammar'),
          vocabulary: issues.filter(issue => issue.type === 'vocabulary'),
          sentence: issues.filter(issue => issue.type === 'sentence'),
          paragraph: issues.filter(issue => issue.type === 'paragraph'),
        },
      });
      setShowAnalysis(true);
      setActiveTab('analysis');
      setFeedback({ type: 'success', text: 'AI checks completed!' });
    } catch (error) {
      console.error('Error running AI checks:', error);
      setFeedback({ type: 'error', text: 'Failed to run AI checks. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredIssues = analysisResult?.writingIssues ? 
    Object.values(analysisResult.writingIssues).flat().filter(issue => 
      selectedIssueType === 'all' || issue.type === selectedIssueType
    ) : [];

  const highlightTextWithIssues = (text: string, issues: WritingIssue[]) => {
    let highlightedText = text;
    const sortedIssues = [...issues].sort((a, b) => a.start - b.start);

    let offset = 0;
    sortedIssues.forEach(issue => {
      const start = issue.start + offset;
      const end = issue.end + offset;
      const originalWord = text.substring(issue.start, issue.end);
      const replacement = `<span class="text-red-500 font-bold cursor-pointer" data-issue-type="${issue.type}" data-issue-message="${issue.message}" data-issue-suggestions="${issue.suggestions.join(', ')}">${originalWord}</span>`;
      highlightedText = highlightedText.substring(0, start) + replacement + highlightedText.substring(end);
      offset += replacement.length - (end - start);
    });
    return <div dangerouslySetInnerHTML={{ __html: highlightedText }} />;
  };

  const handleIssueClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'SPAN' && target.dataset.issueType) {
      const type = target.dataset.issueType;
      const message = target.dataset.issueMessage;
      const suggestions = target.dataset.issueSuggestions;
      setFeedback({ type: 'info', text: `Issue Type: ${type.charAt(0).toUpperCase() + type.slice(1)}. Message: ${message}. Suggestions: ${suggestions || 'No specific suggestions.'}` });
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="flex-none p-4 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Writing Area</h1>
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('planning')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'planning' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              <BookOpen className="inline-block w-4 h-4 mr-2" /> Planning
            </button>
            <button
              onClick={() => setActiveTab('writing')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'writing' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              <PenTool className="inline-block w-4 h-4 mr-2" /> Writing
            </button>
            <button
              onClick={() => setActiveTab('analysis')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'analysis' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              <BarChart3 className="inline-block w-4 h-4 mr-2" /> Analysis
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Text Type: <span className="font-semibold text-gray-800">{textType.charAt(0).toUpperCase() + textType.slice(1)}</span></span>
            {prompt && (
              <span className="text-sm text-gray-600">Prompt: <span className="font-semibold text-gray-800">{prompt}</span></span>
            )}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowPromptGenerator(!showPromptGenerator)}
              className="p-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors duration-200"
              title="Generate New Prompt"
            >
              <Sparkles className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowSynonymTool(!showSynonymTool)}
              className="p-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors duration-200"
              title="Synonym Tool"
            >
              <Lightbulb className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowRephraseTool(!showRephraseTool)}
              className="p-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors duration-200"
              title="Rephrase Sentence"
            >
              <Wand2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowAiCheckSettings(!showAiCheckSettings)}
              className="p-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors duration-200"
              title="AI Check Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={handleRunAIChecks}
              disabled={isLoading || !aiCheckEnabled}
              className={`p-2 rounded-full ${aiCheckEnabled ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed'} transition-colors duration-200`}
              title="Run AI Checks"
            >
              <CheckCircle className="w-5 h-5" />
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200 flex items-center"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Submit
            </button>
          </div>
        </div>
      </div>

      {showPromptGenerator && (
        <div className="flex-none p-4 bg-blue-50 border-b border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Generate New Prompt</h3>
          <textarea
            className="w-full p-2 border border-blue-300 rounded-md mb-2 focus:ring-blue-500 focus:border-blue-500"
            rows={2}
            placeholder="Enter keywords or a topic for a new writing prompt..."
            value={promptGeneratorInput}
            onChange={(e) => setPromptGeneratorInput(e.target.value)}
          ></textarea>
          <button
            onClick={handleGeneratePrompt}
            disabled={promptGeneratorLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
          >
            {promptGeneratorLoading ? 'Generating...' : 'Generate Prompt'}
          </button>
          {promptGeneratorError && <p className="text-red-500 text-sm mt-2">{promptGeneratorError}</p>}
        </div>
      )}

      {showSynonymTool && (
        <div className="flex-none p-4 bg-purple-50 border-b border-purple-200">
          <h3 className="text-lg font-semibold text-purple-800 mb-2">Synonym Tool</h3>
          <div className="flex space-x-2 mb-2">
            <input
              type="text"
              className="flex-grow p-2 border border-purple-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
              placeholder="Enter word to find synonyms..."
              value={synonymInput}
              onChange={(e) => setSynonymInput(e.target.value)}
            />
            <button
              onClick={handleGetSynonyms}
              disabled={synonymLoading}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors duration-200"
            >
              {synonymLoading ? 'Searching...' : 'Find Synonyms'}
            </button>
          </div>
          {synonymError && <p className="text-red-500 text-sm mt-2">{synonymError}</p>}
          {synonyms.length > 0 && (
            <div className="mt-2">
              <p className="text-sm text-purple-700">Suggestions: {synonyms.join(', ')}</p>
            </div>
          )}
        </div>
      )}

      {showRephraseTool && (
        <div className="flex-none p-4 bg-orange-50 border-b border-orange-200">
          <h3 className="text-lg font-semibold text-orange-800 mb-2">Rephrase Sentence</h3>
          <textarea
            className="w-full p-2 border border-orange-300 rounded-md mb-2 focus:ring-orange-500 focus:border-orange-500"
            rows={2}
            placeholder="Enter sentence to rephrase..."
            value={rephraseInput}
            onChange={(e) => setRephraseInput(e.target.value)}
          ></textarea>
          <button
            onClick={handleRephraseSentence}
            disabled={rephraseLoading}
            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors duration-200"
          >
            {rephraseLoading ? 'Rephrasing...' : 'Rephrase'}
          </button>
          {rephraseError && <p className="text-red-500 text-sm mt-2">{rephraseError}</p>}
          {rephrasedSentences.length > 0 && (
            <div className="mt-2">
              <p className="text-sm text-orange-700">Rephrased: {rephrasedSentences.join(' | ')}</p>
            </div>
          )}
        </div>
      )}

      {showAiCheckSettings && (
        <div className="flex-none p-4 bg-green-50 border-b border-green-200">
          <h3 className="text-lg font-semibold text-green-800 mb-2">AI Check Settings</h3>
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              id="enableAIChecks"
              checked={aiCheckEnabled}
              onChange={(e) => setAiCheckEnabled(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="enableAIChecks" className="text-green-700">Enable AI Writing Checks</label>
          </div>
          {aiCheckEnabled && (
            <div className="grid grid-cols-2 gap-2 text-sm text-green-700">
              {Object.entries(aiCheckSettings).map(([key, value]) => (
                <div key={key} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`check-${key}`}
                    checked={value}
                    onChange={(e) => setAiCheckSettings({ ...aiCheckSettings, [key]: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor={`check-${key}`}>{key.charAt(0).toUpperCase() + key.slice(1)}</label>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {feedback && (
        <div className={`flex-none p-3 text-sm font-medium ${feedback.type === 'error' ? 'bg-red-100 text-red-800' : feedback.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'} border-b`}>
          {feedback.type === 'error' && <AlertCircle className="inline-block w-4 h-4 mr-2" />} 
          {feedback.type === 'success' && <CheckCircle className="inline-block w-4 h-4 mr-2" />} 
          {feedback.type === 'info' && <Info className="inline-block w-4 h-4 mr-2" />} 
          {feedback.text}
        </div>
      )}

      <div className="flex-grow p-4 overflow-y-auto">
        {activeTab === 'planning' && (
          <StructuredPlanningSection
            textType={textType}
            prompt={prompt}
            planningContent={planningContent}
            onPlanningContentChange={setPlanningContent}
          />
        )}

        {activeTab === 'writing' && (
          <div className="h-full flex flex-col">
            <textarea
              ref={textareaRef}
              className="flex-grow w-full p-4 text-lg font-serif leading-relaxed border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 resize-none"
              value={content}
              onChange={handleChange}
              placeholder="Start writing your essay here..."
            ></textarea>
            <WritingStatusBar wordCount={wordCount} charCount={charCount} className="mt-4" />
          </div>
        )}

        {activeTab === 'analysis' && analysisResult && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Writing Analysis</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2 flex items-center"><Award className="w-5 h-5 mr-2 text-yellow-500" /> Overall Score</h3>
                <p className="text-4xl font-bold text-blue-600">{analysisResult.score}/100</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2 flex items-center"><TrendingUp className="w-5 h-5 mr-2 text-green-500" /> Strengths</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{analysisResult.strengths}</p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-2 flex items-center"><Target className="w-5 h-5 mr-2 text-red-500" /> Areas for Improvement</h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{analysisResult.improvements}</p>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-2 flex items-center"><MessageSquare className="w-5 h-5 mr-2 text-blue-500" /> Detailed Feedback</h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{analysisResult.detailedFeedback}</p>
            </div>

            {analysisResult.recommendations && analysisResult.recommendations.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-2 flex items-center"><Lightbulb className="w-5 h-5 mr-2 text-yellow-500" /> Recommendations</h3>
                <ul className="list-disc list-inside text-gray-700">
                  {analysisResult.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-2 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-orange-500" /> Writing Issues
                <button 
                  onClick={() => setShowIssues(!showIssues)}
                  className="ml-2 p-1 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors duration-200"
                  title={showIssues ? "Hide Issues" : "Show Issues"}
                >
                  {showIssues ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </h3>
              {showIssues && (
                <div className="mt-2">
                  <div className="mb-4">
                    <label htmlFor="issueTypeFilter" className="block text-sm font-medium text-gray-700 mb-1">Filter by Issue Type:</label>
                    <select
                      id="issueTypeFilter"
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      value={selectedIssueType}
                      onChange={(e) => setSelectedIssueType(e.target.value as WritingIssue['type'] | 'all')}
                    >
                      <option value="all">All</option>
                      <option value="spelling">Spelling</option>
                      <option value="punctuation">Punctuation</option>
                      <option value="grammar">Grammar</option>
                      <option value="vocabulary">Vocabulary</option>
                      <option value="sentence">Sentence Structure</option>
                      <option value="paragraph">Paragraph Structure</option>
                    </select>
                  </div>
                  {filteredIssues.length > 0 ? (
                    <div className="space-y-3">
                      {filteredIssues.map((issue, index) => (
                        <div key={index} className="p-3 bg-gray-100 rounded-md border border-gray-200">
                          <p className="text-sm font-semibold text-gray-800">Type: {issue.type.charAt(0).toUpperCase() + issue.type.slice(1)}</p>
                          <p className="text-sm text-gray-700">Word/Phrase: <span className="font-mono bg-gray-200 px-1 rounded">{issue.word}</span></p>
                          <p className="text-sm text-gray-700">Message: {issue.message}</p>
                          {issue.suggestions && issue.suggestions.length > 0 && (
                            <p className="text-sm text-gray-700">Suggestions: {issue.suggestions.join(', ')}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600 text-sm">No issues found for the selected type.</p>
                  )}
                </div>
              )}
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-2 flex items-center"><FileText className="w-5 h-5 mr-2 text-gray-500" /> Original Text with Highlights</h3>
              <div 
                className="p-4 border border-gray-300 rounded-md bg-gray-50 text-gray-800 leading-relaxed whitespace-pre-wrap"
                onClick={handleIssueClick}
              >
                {highlightTextWithIssues(content, Object.values(analysisResult.writingIssues).flat())}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WritingArea;

