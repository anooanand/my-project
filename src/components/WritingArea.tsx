import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Save, Download, Upload, Eye, EyeOff, RotateCcw, Sparkles, BookOpen, Target, TrendingUp, Award, CheckCircle, AlertCircle, Star, Lightbulb, MessageSquare, BarChart3, Clock, Zap, Heart, Trophy, Wand2, PenTool, FileText, Settings, RefreshCw, Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, Copy, Check, X, Plus, Minus, ChevronDown, ChevronUp, Info, HelpCircle, Calendar, Users, Globe, Mic, Camera, Image, Link, Hash, Type, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline, List, ListOrdered, Quote, Code, Scissors, Clipboard, Search, Filter, SortAsc, SortDesc, Grid, Layout, Sidebar, Menu, MoreHorizontal, MoreVertical, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Timer, Send, Bot, StopCircle, MapPin, Users2, Smile, Home } from 'lucide-react';
import { generatePrompt, getSynonyms, rephraseSentence, evaluateEssay, openai } from '../lib/openai';
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

// Helper function to clean AI response and extract JSON
function cleanAIResponse(content: string): string {
  // Remove markdown code blocks
  let cleaned = content.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  
  // Remove any leading/trailing whitespace
  cleaned = cleaned.trim();
  
  // If the response starts with text before JSON, try to extract just the JSON part
  const jsonStart = cleaned.indexOf('[');
  const jsonEnd = cleaned.lastIndexOf(']');
  
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
  }
  
  return cleaned;
}

// AI Writing Analysis Functions using existing OpenAI integration
async function checkSpellingAI(text: string): Promise<WritingIssue[]> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a spelling checker for NSW Selective School writing tests. Identify ONLY genuinely misspelled words (not proper nouns, names, or creative terms). Be very conservative. Return ONLY a valid JSON array, no markdown formatting.'
        },
        {
          role: 'user',
          content: `Analyze this text and identify ONLY genuinely misspelled words. Return ONLY a JSON array with this exact format (no markdown, no code blocks):
[
  {
    "word": "misspelled_word",
    "start_index": number,
    "end_index": number,
    "suggestions": ["correction1", "correction2", "correction3"],
    "message": "Possible spelling error"
  }
]

Text: "${text}"

Be very conservative - only flag obvious spelling errors. Return empty array [] if no errors found. IMPORTANT: Return ONLY the JSON array, no other text or formatting.`
        }
      ],
      max_tokens: 1000,
      temperature: 0.1
    });

    const content = response.choices[0]?.message?.content || '';
    
    try {
      // Clean the response before parsing
      const cleanedContent = cleanAIResponse(content);
      console.log('Cleaned spelling response:', cleanedContent);
      
      const results = JSON.parse(cleanedContent);
      return Array.isArray(results) ? results.map((item: any) => ({
        type: 'spelling' as const,
        word: item.word || '',
        start: item.start_index || 0,
        end: item.end_index || 0,
        suggestions: Array.isArray(item.suggestions) ? item.suggestions : [],
        message: item.message || 'Possible spelling error',
        severity: 'error' as const
      })) : [];
    } catch (parseError) {
      console.error('Failed to parse spelling results:', parseError);
      console.error('Raw content:', content);
      return [];
    }
  } catch (error) {
    console.error('Spelling check error:', error);
    return [];
  }
}

async function checkGrammarAI(text: string): Promise<WritingIssue[]> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a grammar checker for NSW Selective School writing. Identify grammar errors like subject-verb disagreement, sentence fragments, run-on sentences, incorrect tense usage. Return ONLY a valid JSON array, no markdown formatting.'
        },
        {
          role: 'user',
          content: `Identify grammar errors in this text. Return ONLY a JSON array with this format (no markdown, no code blocks):
[
  {
    "word": "problematic_phrase",
    "start_index": number,
    "end_index": number,
    "suggestions": ["correction1", "correction2"],
    "message": "Grammar issue description",
    "severity": "error"
  }
]

Text: "${text}"

Return empty array [] if no errors found. IMPORTANT: Return ONLY the JSON array, no other text or formatting.`
        }
      ],
      max_tokens: 1000,
      temperature: 0.1
    });

    const content = response.choices[0]?.message?.content || '';
    
    try {
      const cleanedContent = cleanAIResponse(content);
      console.log('Cleaned grammar response:', cleanedContent);
      
      const results = JSON.parse(cleanedContent);
      return Array.isArray(results) ? results.map((item: any) => ({
        type: 'grammar' as const,
        word: item.word || '',
        start: item.start_index || 0,
        end: item.end_index || 0,
        suggestions: Array.isArray(item.suggestions) ? item.suggestions : [],
        message: item.message || 'Grammar issue',
        severity: (item.severity as 'error' | 'warning' | 'suggestion') || 'error'
      })) : [];
    } catch (parseError) {
      console.error('Failed to parse grammar results:', parseError);
      console.error('Raw content:', content);
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
          content: 'You are a vocabulary enhancer for NSW Selective School writing. Identify basic words that could be upgraded to more sophisticated alternatives. Focus on overused words like "good", "bad", "said", "went", "big", "small". Return ONLY a valid JSON array, no markdown formatting.'
        },
        {
          role: 'user',
          content: `Identify basic words that could be upgraded to more sophisticated alternatives. Return ONLY a JSON array with this format (no markdown, no code blocks):
[
  {
    "word": "basic_word",
    "start_index": number,
    "end_index": number,
    "suggestions": ["sophisticated1", "sophisticated2", "sophisticated3"],
    "message": "Consider a more sophisticated word",
    "severity": "suggestion"
  }
]

Text: "${text}"

Return empty array [] if no improvements needed. IMPORTANT: Return ONLY the JSON array, no other text or formatting.`
        }
      ],
      max_tokens: 1000,
      temperature: 0.3
    });

    const content = response.choices[0]?.message?.content || '';
    
    try {
      const cleanedContent = cleanAIResponse(content);
      console.log('Cleaned vocabulary response:', cleanedContent);
      
      const results = JSON.parse(cleanedContent);
      return Array.isArray(results) ? results.map((item: any) => ({
        type: 'vocabulary' as const,
        word: item.word || '',
        start: item.start_index || 0,
        end: item.end_index || 0,
        suggestions: Array.isArray(item.suggestions) ? item.suggestions : [],
        message: item.message || 'Consider a more sophisticated word',
        severity: 'suggestion' as const
      })) : [];
    } catch (parseError) {
      console.error('Failed to parse vocabulary results:', parseError);
      console.error('Raw content:', content);
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
          content: 'You are a punctuation checker for NSW Selective School writing. Identify missing or incorrect punctuation: missing periods, commas, apostrophes, quotation marks. Return ONLY a valid JSON array, no markdown formatting.'
        },
        {
          role: 'user',
          content: `Identify punctuation errors in this text. Return ONLY a JSON array with this format (no markdown, no code blocks):
[
  {
    "word": "text_around_issue",
    "start_index": number,
    "end_index": number,
    "suggestions": ["corrected_punctuation"],
    "message": "Punctuation issue description",
    "severity": "error"
  }
]

Text: "${text}"

Return empty array [] if no errors found. IMPORTANT: Return ONLY the JSON array, no other text or formatting.`
        }
      ],
      max_tokens: 1000,
      temperature: 0.1
    });

    const content = response.choices[0]?.message?.content || '';
    
    try {
      const cleanedContent = cleanAIResponse(content);
      console.log('Cleaned punctuation response:', cleanedContent);
      
      const results = JSON.parse(cleanedContent);
      return Array.isArray(results) ? results.map((item: any) => ({
        type: 'punctuation' as const,
        word: item.word || '',
        start: item.start_index || 0,
        end: item.end_index || 0,
        suggestions: Array.isArray(item.suggestions) ? item.suggestions : [],
        message: item.message || 'Punctuation issue',
        severity: (item.severity as 'error' | 'warning' | 'suggestion') || 'error'
      })) : [];
    } catch (parseError) {
      console.error('Failed to parse punctuation results:', parseError);
      console.error('Raw content:', content);
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
          content: 'You are a sentence structure analyzer for NSW Selective School writing. Identify issues: repetitive sentence beginnings, lack of sentence variety, overly simple sentences. Return ONLY a valid JSON array, no markdown formatting.'
        },
        {
          role: 'user',
          content: `Analyze sentence structure in this text. Return ONLY a JSON array with this format (no markdown, no code blocks):
[
  {
    "word": "sentence_beginning",
    "start_index": number,
    "end_index": number,
    "suggestions": ["improvement1", "improvement2"],
    "message": "Sentence structure suggestion",
    "severity": "suggestion"
  }
]

Text: "${text}"

Return empty array [] if no issues found. IMPORTANT: Return ONLY the JSON array, no other text or formatting.`
        }
      ],
      max_tokens: 1000,
      temperature: 0.2
    });

    const content = response.choices[0]?.message?.content || '';
    
    try {
      const cleanedContent = cleanAIResponse(content);
      console.log('Cleaned sentence response:', cleanedContent);
      
      const results = JSON.parse(cleanedContent);
      return Array.isArray(results) ? results.map((item: any) => ({
        type: 'sentence' as const,
        word: item.word || '',
        start: item.start_index || 0,
        end: item.end_index || 0,
        suggestions: Array.isArray(item.suggestions) ? item.suggestions : [],
        message: item.message || 'Sentence structure suggestion',
        severity: 'suggestion' as const
      })) : [];
    } catch (parseError) {
      console.error('Failed to parse sentence results:', parseError);
      console.error('Raw content:', content);
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
          content: 'You are a paragraph structure analyzer for NSW Selective School writing. Identify issues: lack of topic sentences, poor transitions, paragraphs too short/long. Return ONLY a valid JSON array, no markdown formatting.'
        },
        {
          role: 'user',
          content: `Analyze paragraph structure in this text. Return ONLY a JSON array with this format (no markdown, no code blocks):
[
  {
    "word": "paragraph_beginning",
    "start_index": number,
    "end_index": number,
    "suggestions": ["improvement1", "improvement2"],
    "message": "Paragraph structure suggestion",
    "severity": "suggestion"
  }
]

Text: "${text}"

Return empty array [] if no issues found. IMPORTANT: Return ONLY the JSON array, no other text or formatting.`
        }
      ],
      max_tokens: 1000,
      temperature: 0.2
    });

    const content = response.choices[0]?.message?.content || '';
    
    try {
      const cleanedContent = cleanAIResponse(content);
      console.log('Cleaned paragraph response:', cleanedContent);
      
      const results = JSON.parse(cleanedContent);
      return Array.isArray(results) ? results.map((item: any) => ({
        type: 'paragraph' as const,
        word: item.word || '',
        start: item.start_index || 0,
        end: item.end_index || 0,
        suggestions: Array.isArray(item.suggestions) ? item.suggestions : [],
        message: item.message || 'Paragraph structure suggestion',
        severity: 'suggestion' as const
      })) : [];
    } catch (parseError) {
      console.error('Failed to parse paragraph results:', parseError);
      console.error('Raw content:', content);
      return [];
    }
  } catch (error) {
    console.error('Paragraph structure check error:', error);
    return [];
  }
}

// Comprehensive AI writing check function
async function checkAllWritingAI(text: string, enabledChecks: any): Promise<WritingIssue[]> {
  if (!text || text.trim().length === 0) {
    return [];
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
    
    return allIssues.sort((a, b) => a.start - b.start);
  } catch (error) {
    console.error('AI writing check failed:', error);
    return [];
  }
}

// Rest of the component remains the same...
export const WritingArea: React.FC<WritingAreaProps> = ({
  onContentChange,
  initialContent = '',
  textType = 'narrative',
  prompt: externalPrompt,
  onPromptChange
}) => {
  // State management
  const [content, setContent] = useState(initialContent);
  const [prompt, setPrompt] = useState(externalPrompt || "Write an engaging story about a character who discovers something unexpected that changes their life forever. Include vivid descriptions, realistic dialogue, and show the character's emotional journey. Make sure your story has a clear beginning, middle, and end with a satisfying conclusion. Focus on showing rather than telling, and use sensory details to bring your story to life.");
  const [writingIssues, setWritingIssues] = useState<WritingIssue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<WritingIssue | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionPosition, setSuggestionPosition] = useState({ x: 0, y: 0 });
  const [enabledChecks, setEnabledChecks] = useState({
    spelling: true,
    punctuation: true,
    grammar: true,
    vocabulary: true,
    sentence: true,
    paragraph: true
  });

  // Other state variables
  const [isCheckingWriting, setIsCheckingWriting] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [lineHeight, setLineHeight] = useState(1.6);
  const [showPlanning, setShowPlanning] = useState(false);
  const [showExamMode, setShowExamMode] = useState(false);
  const [showStructureGuide, setShowStructureGuide] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [showCoachPanel, setShowCoachPanel] = useState(true);
  const [coachInput, setCoachInput] = useState('');
  const [coachResponse, setCoachResponse] = useState('');
  const [isCoachLoading, setIsCoachLoading] = useState(false);
  const [activeCoachTab, setActiveCoachTab] = useState('coach');
  const [showWordMagic, setShowWordMagic] = useState(false);
  const [selectedWord, setSelectedWord] = useState('');
  const [wordSuggestions, setWordSuggestions] = useState<string[]>([]);
  const [isWordMagicLoading, setIsWordMagicLoading] = useState(false);

  // Planning state for kid-friendly interface
  const [kidPlanningData, setKidPlanningData] = useState({
    character: '',
    setting: '',
    problem: '',
    solution: ''
  });

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const checkTimeoutRef = useRef<NodeJS.Timeout>();

  // Debounced writing check
  const checkWriting = useCallback((content: string) => {
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }

    checkTimeoutRef.current = setTimeout(async () => {
      if (content.trim() && content.length > 20) {
        setIsCheckingWriting(true);
        try {
          const issues = await checkAllWritingAI(content, enabledChecks);
          setWritingIssues(issues);
        } catch (error) {
          console.error('AI writing check failed:', error);
          setWritingIssues([]);
        } finally {
          setIsCheckingWriting(false);
        }
      } else {
        setWritingIssues([]);
        setIsCheckingWriting(false);
      }
    }, 3000); // 3 second delay to reduce API calls

    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, [enabledChecks]);

  // Effect for content changes
  useEffect(() => {
    if (content.trim()) {
      checkWriting(content);
    } else {
      setWritingIssues([]);
    }
    
    if (onContentChange) {
      onContentChange(content);
    }
  }, [content, checkWriting, onContentChange]);

  // Effect for external prompt changes
  useEffect(() => {
    if (externalPrompt && externalPrompt !== prompt) {
      setPrompt(externalPrompt);
    }
  }, [externalPrompt, prompt]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, []);

  // Get issue background color
  const getIssueBackgroundColor = (issue: WritingIssue) => {
    const colors = {
      spelling: { error: '#fef3c7', warning: '#fef3c7', suggestion: '#fffbeb' }, // yellow
      punctuation: { error: '#fecaca', warning: '#fed7d7', suggestion: '#fef2f2' }, // red
      grammar: { error: '#ddd6fe', warning: '#e0e7ff', suggestion: '#eef2ff' }, // purple
      vocabulary: { error: '#bbf7d0', warning: '#c6f6d5', suggestion: '#d1fae5' }, // green
      sentence: { error: '#fed7aa', warning: '#fde68a', suggestion: '#fef3c7' }, // orange
      paragraph: { error: '#bfdbfe', warning: '#dbeafe', suggestion: '#eff6ff' } // blue
    };

    return colors[issue.type][issue.severity];
  };

  // Get issue border color
  const getIssueBorderColor = (issue: WritingIssue) => {
    const colors = {
      spelling: '#f59e0b', // yellow-500
      punctuation: '#ef4444', // red-500
      grammar: '#8b5cf6', // purple-500
      vocabulary: '#10b981', // green-500
      sentence: '#f97316', // orange-500
      paragraph: '#3b82f6' // blue-500
    };

    return colors[issue.type];
  };

  // Create highlighted text with issue overlays
  const createHighlightedText = () => {
    if (writingIssues.length === 0) {
      return <span style={{ whiteSpace: 'pre-wrap' }}>{content}</span>;
    }

    const parts = [];
    let lastIndex = 0;

    writingIssues.forEach((issue, index) => {
      // Add text before issue
      if (issue.start > lastIndex) {
        parts.push(
          <span key={`text-${index}`} style={{ whiteSpace: 'pre-wrap' }}>
            {content.substring(lastIndex, issue.start)}
          </span>
        );
      }

      // Add highlighted issue
      parts.push(
        <span
          key={`issue-${index}`}
          style={{
            backgroundColor: getIssueBackgroundColor(issue),
            borderBottom: `2px wavy ${getIssueBorderColor(issue)}`,
            cursor: 'pointer',
            whiteSpace: 'pre-wrap'
          }}
          onClick={(e) => handleIssueClick(issue, e)}
          title={`${issue.type}: ${issue.message}. Click for suggestions.`}
        >
          {issue.word}
        </span>
      );

      lastIndex = issue.end;
    });

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(
        <span key="text-end" style={{ whiteSpace: 'pre-wrap' }}>
          {content.substring(lastIndex)}
        </span>
      );
    }

    return parts;
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

  // Handle issue click
  const handleIssueClick = (issue: WritingIssue, event: React.MouseEvent) => {
    event.preventDefault();
    setSelectedIssue(issue);
    setShowSuggestions(true);
    
    // Position suggestions popup
    const rect = textareaRef.current?.getBoundingClientRect();
    if (rect) {
      setSuggestionPosition({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top + 25
      });
    }
  };

  // Apply suggestion
  const applySuggestion = (suggestion: string) => {
    if (selectedIssue) {
      const newContent = content.substring(0, selectedIssue.start) + 
                        suggestion + 
                        content.substring(selectedIssue.end);
      setContent(newContent);
    }
    setShowSuggestions(false);
    setSelectedIssue(null);
  };

  // Ignore issue
  const ignoreIssue = () => {
    if (selectedIssue) {
      // Remove this specific issue from the list
      setWritingIssues(prev => prev.filter(issue => 
        !(issue.start === selectedIssue.start && 
          issue.end === selectedIssue.end && 
          issue.word === selectedIssue.word)
      ));
    }
    setShowSuggestions(false);
    setSelectedIssue(null);
  };

  // Handle content change
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setShowSuggestions(false);
  };

  // Sync scroll between textarea and overlay
  const handleScroll = useCallback(() => {
    if (textareaRef.current && overlayRef.current) {
      overlayRef.current.scrollTop = textareaRef.current.scrollTop;
      overlayRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  // Toggle check type
  const toggleCheck = (checkType: keyof typeof enabledChecks) => {
    setEnabledChecks(prev => ({
      ...prev,
      [checkType]: !prev[checkType]
    }));
  };

  // Handle coach interaction
  const handleCoachSubmit = async () => {
    if (!coachInput.trim()) return;

    setIsCoachLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a friendly writing coach for NSW Selective School students. Provide helpful, encouraging advice about writing. Keep responses concise and age-appropriate.'
          },
          {
            role: 'user',
            content: `Context: The student is writing: "${content.substring(0, 200)}..."

Question: ${coachInput}`
          }
        ],
        max_tokens: 300,
        temperature: 0.7
      });

      setCoachResponse(response.choices[0]?.message?.content || 'Sorry, I couldn\'t help with that right now.');
    } catch (error) {
      console.error('Coach error:', error);
      setCoachResponse('Sorry, I\'m having trouble right now. Please try again later.');
    } finally {
      setIsCoachLoading(false);
      setCoachInput('');
    }
  };

  // Handle word magic
  const handleWordMagic = async (word: string) => {
    setSelectedWord(word);
    setIsWordMagicLoading(true);
    setShowWordMagic(true);

    try {
      const suggestions = await getSynonyms(word);
      setWordSuggestions(suggestions);
    } catch (error) {
      console.error('Word magic error:', error);
      setWordSuggestions(['Unable to get suggestions']);
    } finally {
      setIsWordMagicLoading(false);
    }
  };

  // Replace word with suggestion
  const replaceWord = (oldWord: string, newWord: string) => {
    const newContent = content.replace(new RegExp(`\\b${oldWord}\\b`, 'g'), newWord);
    setContent(newContent);
    setShowWordMagic(false);
  };

  // Update kid planning data
  const updateKidPlanningData = (field: keyof typeof kidPlanningData, value: string) => {
    setKidPlanningData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Get issue counts for display
  const issueCounts = getIssueCounts();

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Main Writing Area */}
      <div className={`flex-1 flex flex-col ${focusMode ? 'mx-auto max-w-4xl' : ''}`}>
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.location.href = '/'}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
              >
                <Home size={20} />
                <span className="font-medium">Home</span>
              </button>
              
              <div className="flex items-center space-x-2">
                <button className="flex items-center space-x-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors">
                  <FileText size={16} />
                  <span>New Story</span>
                </button>
                <button className="flex items-center space-x-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
                  <Save size={16} />
                  <span>Save</span>
                </button>
                <button className="flex items-center space-x-1 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors">
                  <Download size={16} />
                  <span>Export</span>
                </button>
                <button className="flex items-center space-x-1 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors">
                  <HelpCircle size={16} />
                  <span>Help</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Writing Prompt */}
        <div className="bg-white/60 backdrop-blur-sm border-b border-gray-200 p-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <Lightbulb size={16} className="text-yellow-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 mb-2">Your Writing Prompt</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{prompt}</p>
            </div>
          </div>
        </div>

        {/* Writing Checks Panel */}
        <div className="bg-white/60 backdrop-blur-sm border-b border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-800">NSW Selective Writing Checks</h4>
            <div className="text-sm text-gray-600">
              {isCheckingWriting ? (
                <span className="text-blue-600">AI analyzing...</span>
              ) : (
                <span>{issueCounts.total} issues found</span>
              )}
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
                <label key={type} className="flex items-center space-x-2 cursor-pointer">
                  <span 
                    className="px-2 py-1 rounded-full border-2 font-medium"
                    style={{
                      backgroundColor: enabled ? typeColors.bg : '#f3f4f6',
                      borderColor: enabled ? typeColors.border : '#d1d5db',
                      color: enabled ? typeColors.text : '#6b7280'
                    }}
                  >
                    {type}({count})
                  </span>
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={() => toggleCheck(type as keyof typeof enabledChecks)}
                    className="sr-only"
                  />
                </label>
              );
            })}
          </div>
        </div>

        {/* Writing Area */}
        <div className="flex-1 p-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm h-full flex flex-col">
            {/* Writing Toolbar */}
            <div className="border-b border-gray-200 p-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-800">Your Writing</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowPlanning(!showPlanning)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      showPlanning 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <PenTool size={14} className="inline mr-1" />
                    Planning Phase
                  </button>
                  <button
                    onClick={() => setShowExamMode(!showExamMode)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      showExamMode 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Timer size={14} className="inline mr-1" />
                    Start Exam Mode
                  </button>
                  <button
                    onClick={() => setShowStructureGuide(!showStructureGuide)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      showStructureGuide 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Layout size={14} className="inline mr-1" />
                    Structure Guide
                  </button>
                  <button
                    onClick={() => setShowTips(!showTips)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      showTips 
                        ? 'bg-yellow-100 text-yellow-700' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Lightbulb size={14} className="inline mr-1" />
                    Tips
                  </button>
                  <button
                    onClick={() => setFocusMode(!focusMode)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      focusMode 
                        ? 'bg-indigo-100 text-indigo-700' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Eye size={14} className="inline mr-1" />
                    Focus
                  </button>
                </div>
              </div>
            </div>

            {/* Writing Input Area */}
            <div className="flex-1 relative">
              {/* Overlay for highlighting issues */}
              <div
                ref={overlayRef}
                className="absolute inset-0 pointer-events-none overflow-hidden p-4"
                style={{
                  color: 'transparent',
                  backgroundColor: 'transparent',
                  border: 'none',
                  resize: 'none',
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word',
                  zIndex: 1,
                  pointerEvents: writingIssues.length > 0 ? 'auto' : 'none'
                }}
              >
                <div
                  style={{
                    padding: '1rem',
                    fontSize: `${fontSize}px`,
                    fontFamily: 'Georgia, serif',
                    lineHeight: lineHeight,
                    minHeight: '100%',
                    pointerEvents: writingIssues.length > 0 ? 'auto' : 'none'
                  }}
                >
                  {createHighlightedText()}
                </div>
              </div>

              {/* Actual textarea */}
              <textarea
                ref={textareaRef}
                value={content}
                onChange={handleContentChange}
                onScroll={handleScroll}
                placeholder="Start writing your amazing story here! Let your creativity flow and bring your ideas to life..."
                className={`w-full h-full p-4 border-none outline-none resize-none bg-transparent ${
                  writingIssues.length > 0 ? 'text-transparent' : 'text-gray-800'
                } focus:outline-none resize-none transition-colors duration-300 relative z-2`}
                style={{ 
                  fontSize: `${fontSize}px`, 
                  lineHeight: lineHeight,
                  fontFamily: 'Georgia, serif',
                  backgroundColor: writingIssues.length > 0 ? 'transparent' : undefined,
                  position: 'relative',
                  zIndex: 2
                }}
                spellCheck={false}
              />

              {/* Enhanced suggestions popup */}
              {showSuggestions && selectedIssue && (
                <div
                  className="absolute bg-white border border-gray-300 rounded-lg shadow-lg p-3 z-50 min-w-48"
                  style={{
                    left: suggestionPosition.x,
                    top: suggestionPosition.y,
                    maxWidth: '300px'
                  }}
                >
                  <div className="mb-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-500 uppercase">
                        {selectedIssue.type}
                      </span>
                      <button
                        onClick={() => setShowSuggestions(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{selectedIssue.message}</p>
                    <div className="text-xs text-gray-500 mb-2">
                      Word: <span className="font-mono bg-gray-100 px-1 rounded">{selectedIssue.word}</span>
                    </div>
                  </div>
                  
                  {selectedIssue.suggestions.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-gray-600 mb-1">Suggestions:</p>
                      <div className="space-y-1">
                        {selectedIssue.suggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => applySuggestion(suggestion)}
                            className="block w-full text-left px-2 py-1 text-sm bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={ignoreIssue}
                      className="flex-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                    >
                      Ignore
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Writing Stats */}
            <div className="border-t border-gray-200 p-3">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center space-x-1">
                    <FileText size={14} />
                    <span>{content.trim().split(/\s+/).filter(word => word.length > 0).length} words</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Type size={14} />
                    <span>{content.length} characters</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Clock size={14} />
                    <span>{Math.ceil(content.trim().split(/\s+/).filter(word => word.length > 0).length / 200)} min read</span>
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="flex items-center space-x-1">
                    <Zap size={14} className="text-green-500" />
                    <span className="text-green-600 font-medium">AI Checks Active</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <AlertCircle size={14} className="text-orange-500" />
                    <span className="text-orange-600 font-medium">{issueCounts.total} issues</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="border-t border-gray-200 p-3">
              <button className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-2 px-4 rounded-lg font-medium hover:from-green-600 hover:to-blue-600 transition-all duration-200 flex items-center justify-center space-x-2">
                <Send size={16} />
                <span>Submit for Evaluation</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Writing Buddy */}
      {showCoachPanel && (
        <div className="w-80 bg-white/80 backdrop-blur-sm border-l border-gray-200 flex flex-col">
          {/* Header */}
          <div className="border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Writing Buddy</h3>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setShowCoachPanel(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                  title="Collapse Panel"
                >
                  <ChevronRight size={16} />
                </button>
                <button
                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                  title="Minimize"
                >
                  <Minus size={16} />
                </button>
                <button
                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-1">Your AI writing assistant</p>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex">
              {[
                { id: 'coach', label: 'Coach', icon: MessageSquare },
                { id: 'analysis', label: 'Analysis', icon: BarChart3 },
                { id: 'vocabulary', label: 'Vocabulary', icon: BookOpen },
                { id: 'progress', label: 'Progress', icon: TrendingUp }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveCoachTab(tab.id)}
                  className={`flex-1 flex items-center justify-center space-x-1 py-2 px-3 text-sm font-medium border-b-2 transition-colors ${
                    activeCoachTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <tab.icon size={14} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {activeCoachTab === 'coach' && (
              <div className="p-4 space-y-4">
                <div className="bg-indigo-700 rounded-lg p-3">
                  <h4 className="font-medium mb-2 text-xs text-indigo-200 text-center">AI Writing Issues:</h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-indigo-300">Spelling:</span>
                      <span className="text-white font-bold">{issueCounts.spelling}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-indigo-300">Punctuation:</span>
                      <span className="text-white font-bold">{issueCounts.punctuation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-indigo-300">Grammar:</span>
                      <span className="text-white font-bold">{issueCounts.grammar}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-indigo-300">Vocabulary:</span>
                      <span className="text-white font-bold">{issueCounts.vocabulary}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-indigo-300">Sentence:</span>
                      <span className="text-white font-bold">{issueCounts.sentence}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-indigo-300">Paragraph:</span>
                      <span className="text-white font-bold">{issueCounts.paragraph}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-800 mb-2">AI Coach</h4>
                  <p className="text-sm text-gray-600 mb-3">Ask your Writing Buddy anything!</p>
                  
                  <div className="space-y-2 mb-3">
                    <button
                      onClick={() => setCoachInput("How can I improve my introduction?")}
                      className="w-full text-left p-2 text-sm bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      • "How can I improve my introduction?"
                    </button>
                    <button
                      onClick={() => setCoachInput("What's a good synonym for 'said'?")}
                      className="w-full text-left p-2 text-sm bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      • "What's a good synonym for 'said'?"
                    </button>
                    <button
                      onClick={() => setCoachInput("Help me with my conclusion")}
                      className="w-full text-left p-2 text-sm bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      • "Help me with my conclusion"
                    </button>
                  </div>

                  <div className="flex space-x-2 mb-3">
                    <input
                      type="text"
                      value={coachInput}
                      onChange={(e) => setCoachInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleCoachSubmit()}
                      placeholder="Ask for help..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleCoachSubmit}
                      disabled={isCoachLoading || !coachInput.trim()}
                      className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isCoachLoading ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
                    </button>
                  </div>

                  {coachResponse && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-sm text-green-800">{coachResponse}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeCoachTab === 'analysis' && (
              <div className="p-4">
                <h4 className="font-medium text-gray-800 mb-3">Writing Analysis</h4>
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h5 className="font-medium text-gray-700 mb-2">Issue Breakdown</h5>
                    <div className="space-y-2">
                      {Object.entries(issueCounts).filter(([key]) => key !== 'total').map(([type, count]) => (
                        <div key={type} className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 capitalize">{type}:</span>
                          <span className={`text-sm font-medium ${count > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeCoachTab === 'vocabulary' && (
              <div className="p-4">
                <h4 className="font-medium text-gray-800 mb-3">Vocabulary Enhancement</h4>
                <p className="text-sm text-gray-600 mb-3">Select a word in your text to get better alternatives!</p>
                
                {showWordMagic && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-3">
                    <h5 className="font-medium text-purple-800 mb-2">Word: "{selectedWord}"</h5>
                    {isWordMagicLoading ? (
                      <div className="flex items-center space-x-2 text-purple-600">
                        <RefreshCw size={16} className="animate-spin" />
                        <span className="text-sm">Finding alternatives...</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {wordSuggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => replaceWord(selectedWord, suggestion)}
                            className="block w-full text-left px-2 py-1 text-sm bg-purple-100 hover:bg-purple-200 rounded transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeCoachTab === 'progress' && (
              <div className="p-4">
                <h4 className="font-medium text-gray-800 mb-3">Writing Progress</h4>
                <div className="space-y-3">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <h5 className="font-medium text-blue-800 mb-2">Current Session</h5>
                    <div className="space-y-1 text-sm text-blue-700">
                      <div>Words written: {content.trim().split(/\s+/).filter(word => word.length > 0).length}</div>
                      <div>Issues found: {issueCounts.total}</div>
                      <div>Time spent: Active</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-3">
            <div className="flex space-x-2">
              <button
                onClick={() => setShowWordMagic(!showWordMagic)}
                className="flex-1 bg-purple-100 text-purple-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors"
              >
                Writing Buddy
              </button>
              <button
                onClick={() => handleWordMagic(selectedWord || 'word')}
                className="flex-1 bg-orange-100 text-orange-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-orange-200 transition-colors"
              >
                Word Magic
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Collapsed Coach Panel Button */}
      {!showCoachPanel && (
        <button
          onClick={() => setShowCoachPanel(true)}
          className="fixed right-4 top-1/2 transform -translate-y-1/2 bg-blue-500 text-white p-3 rounded-l-lg shadow-lg hover:bg-blue-600 transition-colors z-40"
        >
          <MessageSquare size={20} />
        </button>
      )}

      {/* Planning Modal */}
      {showPlanning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">Story Planning Helper</h3>
                <button
                  onClick={() => setShowPlanning(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Who is your main character?</h3>
                  <p className="text-gray-600 mb-4">Tell us about the person in your story. What are they like? How old are they?</p>
                  <textarea
                    value={kidPlanningData.character}
                    onChange={(e) => updateKidPlanningData('character', e.target.value)}
                    placeholder="Example: Emma is a 12-year-old girl who loves reading books and is very curious about everything..."
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                    rows={4}
                  />
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Where does your story happen?</h3>
                  <p className="text-gray-600 mb-4">Describe the place where your story takes place. Is it at school, home, or somewhere magical?</p>
                  <textarea
                    value={kidPlanningData.setting}
                    onChange={(e) => updateKidPlanningData('setting', e.target.value)}
                    placeholder="Example: The story happens in an old library with tall bookshelves that reach the ceiling..."
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                    rows={4}
                  />
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">What problem does your character face?</h3>
                  <p className="text-gray-600 mb-4">Every good story has a problem or challenge. What goes wrong in your story?</p>
                  <textarea
                    value={kidPlanningData.problem}
                    onChange={(e) => updateKidPlanningData('problem', e.target.value)}
                    placeholder="Example: All the books in the library start disappearing one by one, and Emma needs to find out why..."
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                    rows={4}
                  />
                </div>

                <div>
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
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowPlanning(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const planningText = `Character: ${kidPlanningData.character}\n\nSetting: ${kidPlanningData.setting}\n\nProblem: ${kidPlanningData.problem}\n\nSolution: ${kidPlanningData.solution}\n\n---\n\n`;
                    setContent(planningText + content);
                    setShowPlanning(false);
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Add to Story
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Input */}
      <div className="fixed bottom-4 right-4 z-30">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 max-w-sm">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Ask me a question about your writing..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WritingArea;