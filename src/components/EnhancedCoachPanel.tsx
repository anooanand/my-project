import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  MessageSquare, Sparkles, ChevronDown, ChevronUp, ThumbsUp, Lightbulb, 
  HelpCircle, Target, AlertCircle, Star, Zap, Gift, Heart, X, Send, User, 
  RefreshCw, Bot, BookOpen, TrendingUp, Award, CheckCircle, Eye, Wand2,
  Clock, Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, Copy, Check,
  Plus, Minus, Info, Calendar, Users, Globe, Mic, Camera, Image, Link,
  Hash, Type, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline,
  List, ListOrdered, Quote, Code, Scissors, Clipboard, Search, Filter,
  SortAsc, SortDesc, Grid, Layout, Sidebar, Menu, MoreHorizontal, MoreVertical,
  ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Timer,
  StopCircle, MapPin, Users2, Smile, Brain, Compass, Rocket, Shield, Flame
} from 'lucide-react';
import { getWritingFeedback } from '../lib/openai';

interface EnhancedCoachPanelProps {
  content: string;
  textType: string;
  assistanceLevel: string;
  selectedText?: string;
  onContentChange?: (content: string) => void;
}

interface RealTimeFeedback {
  id: string;
  type: 'grammar' | 'style' | 'vocabulary' | 'structure' | 'content' | 'flow';
  severity: 'error' | 'warning' | 'suggestion' | 'praise';
  message: string;
  suggestion?: string;
  position: { start: number; end: number };
  replacement?: string;
  examples?: string[];
  timestamp: Date;
}

interface ProactiveGuidance {
  id: string;
  trigger: 'word_count' | 'time_spent' | 'repetition' | 'structure' | 'content_gap';
  message: string;
  actionable: boolean;
  priority: 'high' | 'medium' | 'low';
  category: 'structure' | 'vocabulary' | 'content' | 'style' | 'exam_strategy';
  timestamp: Date;
}

interface LearningModule {
  id: string;
  title: string;
  description: string;
  category: 'grammar' | 'vocabulary' | 'structure' | 'style' | 'nsw_specific';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // in minutes
  interactive: boolean;
  examples: string[];
  exercises?: Array<{
    question: string;
    options?: string[];
    correctAnswer: string;
    explanation: string;
  }>;
}

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  type?: 'feedback' | 'guidance' | 'learning' | 'general';
  metadata?: any;
}

interface WritingAnalysis {
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  averageWordsPerSentence: number;
  readabilityScore: number;
  vocabularyDiversity: number;
  repetitiveWords: string[];
  weakWords: string[];
  strongPoints: string[];
  improvementAreas: string[];
}

export default function EnhancedCoachPanel({  content, 
  textType, 
  assistanceLevel, 
  selectedText = '',
  onContentChange 
}: EnhancedCoachPanelProps) {
  // State management
  const [activeTab, setActiveTab] = useState<'realtime' | 'chat' | 'learning' | 'progress'>('realtime');
  const [realTimeFeedback, setRealTimeFeedback] = useState<RealTimeFeedback[]>([]);
  const [proactiveGuidance, setProactiveGuidance] = useState<ProactiveGuidance[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [writingAnalysis, setWritingAnalysis] = useState<WritingAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<RealTimeFeedback | null>(null);
  const [activeLearningModule, setActiveLearningModule] = useState<LearningModule | null>(null);
  const [showProactiveGuidance, setShowProactiveGuidance] = useState(true);
  const [autoAnalysisEnabled, setAutoAnalysisEnabled] = useState(true);
  const [lastAnalysisTime, setLastAnalysisTime] = useState<Date | null>(null);
  const [writingStartTime] = useState<Date>(new Date());
  const [feedbackHistory, setFeedbackHistory] = useState<RealTimeFeedback[]>([]);
  
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);
  const analysisTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Learning modules database
  const learningModules: LearningModule[] = [
    {
      id: 'sentence-variety',
      title: 'Sentence Variety & Flow',
      description: 'Learn to create engaging writing with varied sentence structures',
      category: 'structure',
      difficulty: 'intermediate',
      estimatedTime: 5,
      interactive: true,
      examples: [
        'Simple: The cat sat on the mat.',
        'Compound: The cat sat on the mat, and it purred contentedly.',
        'Complex: While the cat sat on the mat, it watched the birds outside.',
        'Compound-Complex: The cat, which was very tired, sat on the mat while it watched the birds, and it soon fell asleep.'
      ],
      exercises: [
        {
          question: 'Which sentence type adds the most sophistication to your writing?',
          options: ['Simple sentences', 'Compound sentences', 'Complex sentences', 'All types used together'],
          correctAnswer: 'All types used together',
          explanation: 'Using a variety of sentence types creates rhythm and keeps readers engaged. NSW Selective exams reward sophisticated sentence structures.'
        }
      ]
    },
    {
      id: 'vocabulary-enhancement',
      title: 'Advanced Vocabulary Techniques',
      description: 'Elevate your writing with sophisticated vocabulary choices',
      category: 'vocabulary',
      difficulty: 'intermediate',
      estimatedTime: 7,
      interactive: true,
      examples: [
        'Basic: The man was sad.',
        'Enhanced: The gentleman appeared melancholy.',
        'Advanced: The distinguished gentleman exuded an air of profound melancholy.',
        'Sophisticated: A veil of ineffable sadness shrouded the distinguished gentleman\'s countenance.'
      ],
      exercises: [
        {
          question: 'What\'s the best way to enhance vocabulary in your writing?',
          options: ['Use the longest words possible', 'Replace every simple word', 'Choose precise, contextually appropriate words', 'Use a thesaurus for every word'],
          correctAnswer: 'Choose precise, contextually appropriate words',
          explanation: 'The best vocabulary enhancement comes from choosing words that precisely convey your meaning and fit the context naturally.'
        }
      ]
    },
    {
      id: 'nsw-narrative-structure',
      title: 'NSW Narrative Structure Mastery',
      description: 'Master the narrative structure expected in NSW Selective exams',
      category: 'nsw_specific',
      difficulty: 'advanced',
      estimatedTime: 10,
      interactive: true,
      examples: [
        'Opening Hook: "The last thing I expected to find in my grandmother\'s attic was a letter addressed to me."',
        'Character Development: Show personality through actions and dialogue, not just description.',
        'Conflict Introduction: Present the main problem within the first few paragraphs.',
        'Climax & Resolution: Build tension to a peak, then provide a satisfying conclusion.'
      ],
      exercises: [
        {
          question: 'In NSW Selective narratives, when should you introduce the main conflict?',
          options: ['In the final paragraph', 'Halfway through the story', 'Within the first few paragraphs', 'It doesn\'t matter when'],
          correctAnswer: 'Within the first few paragraphs',
          explanation: 'NSW Selective narratives are typically 250-300 words, so the conflict must be introduced early to allow time for development and resolution.'
        }
      ]
    },
    {
      id: 'persuasive-techniques',
      title: 'Persuasive Writing Techniques',
      description: 'Learn powerful techniques to make your arguments compelling',
      category: 'style',
      difficulty: 'intermediate',
      estimatedTime: 8,
      interactive: true,
      examples: [
        'Rhetorical Questions: "How can we stand by while our environment suffers?"',
        'Statistics: "Studies show that 73% of students improve with regular practice."',
        'Emotional Appeals: "Imagine a world where every child has access to quality education."',
        'Expert Testimony: "As Dr. Smith, a leading researcher, explains..."'
      ],
      exercises: [
        {
          question: 'Which persuasive technique is most effective for NSW Selective writing?',
          options: ['Only emotional appeals', 'Only statistics', 'A combination of logical and emotional appeals', 'Only expert opinions'],
          correctAnswer: 'A combination of logical and emotional appeals',
          explanation: 'The most effective persuasive writing combines logical reasoning with emotional connection to create compelling arguments.'
        }
      ]
    }
  ];

  // Real-time analysis function
  const analyzeWritingRealTime = useCallback(async (text: string) => {
    if (!text.trim() || text.length < 10) {
      setRealTimeFeedback([]);
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // Basic text analysis
      const words = text.trim().split(/\s+/);
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
      
      const analysis: WritingAnalysis = {
        wordCount: words.length,
        sentenceCount: sentences.length,
        paragraphCount: paragraphs.length,
        averageWordsPerSentence: sentences.length > 0 ? words.length / sentences.length : 0,
        readabilityScore: calculateReadabilityScore(text),
        vocabularyDiversity: calculateVocabularyDiversity(words),
        repetitiveWords: findRepetitiveWords(words),
        weakWords: findWeakWords(words),
        strongPoints: [],
        improvementAreas: []
      };

      setWritingAnalysis(analysis);

      // Generate real-time feedback
      const feedback: RealTimeFeedback[] = [];
      
      // Check for repetitive words
      analysis.repetitiveWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        const matches = [...text.matchAll(regex)];
        if (matches.length > 2) {
          feedback.push({
            id: `repetitive-${word}-${Date.now()}`,
            type: 'vocabulary',
            severity: 'warning',
            message: `You've used "${word}" ${matches.length} times. Consider using synonyms for variety.`,
            suggestion: `Try alternatives like: ${getSynonymSuggestions(word).join(', ')}`,
            position: { start: matches[0].index || 0, end: (matches[0].index || 0) + word.length },
            replacement: getSynonymSuggestions(word)[0],
            timestamp: new Date()
          });
        }
      });

      // Check for weak words
      analysis.weakWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        const match = regex.exec(text);
        if (match) {
          feedback.push({
            id: `weak-word-${word}-${Date.now()}`,
            type: 'vocabulary',
            severity: 'suggestion',
            message: `"${word}" is a weak word. Consider a stronger alternative.`,
            suggestion: getStrongerAlternative(word),
            position: { start: match.index, end: match.index + word.length },
            replacement: getStrongerAlternative(word),
            timestamp: new Date()
          });
        }
      });

      // Check sentence length variety
      const sentenceLengths = sentences.map(s => s.trim().split(/\s+/).length);
      const avgLength = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
      const hasVariety = sentenceLengths.some(len => Math.abs(len - avgLength) > 5);
      
      if (!hasVariety && sentences.length > 3) {
        feedback.push({
          id: `sentence-variety-${Date.now()}`,
          type: 'structure',
          severity: 'suggestion',
          message: 'Your sentences are similar in length. Try varying sentence structure for better flow.',
          suggestion: 'Mix short, punchy sentences with longer, more complex ones.',
          position: { start: 0, end: text.length },
          examples: [
            'Short: The storm arrived.',
            'Medium: The storm arrived with unexpected fury.',
            'Long: The storm, which had been brewing on the horizon for hours, finally arrived with unexpected fury that caught everyone off guard.'
          ],
          timestamp: new Date()
        });
      }

      // Check for NSW Selective specific requirements
      if (textType === 'narrative') {
        checkNarrativeRequirements(text, feedback);
      } else if (textType === 'persuasive') {
        checkPersuasiveRequirements(text, feedback);
      }

      setRealTimeFeedback(feedback);
      setFeedbackHistory(prev => [...prev, ...feedback].slice(-50)); // Keep last 50 feedback items

      // Generate proactive guidance
      generateProactiveGuidance(analysis, text);

    } catch (error) {
      console.error('Error analyzing writing:', error);
    } finally {
      setIsAnalyzing(false);
      setLastAnalysisTime(new Date());
    }
  }, [textType]);

  // Proactive guidance generation
  const generateProactiveGuidance = useCallback((analysis: WritingAnalysis, text: string) => {
    const guidance: ProactiveGuidance[] = [];
    const timeSpent = Math.floor((new Date().getTime() - writingStartTime.getTime()) / 1000 / 60); // minutes

    // Word count guidance
    if (analysis.wordCount < 50 && timeSpent > 5) {
      guidance.push({
        id: `word-count-${Date.now()}`,
        trigger: 'word_count',
        message: 'You\'ve been writing for 5 minutes but only have ' + analysis.wordCount + ' words. Try brainstorming your main ideas first, then expand each one with specific details and examples.',
        actionable: true,
        priority: 'medium',
        category: 'content',
        timestamp: new Date()
      });
    }

    if (analysis.wordCount > 150 && analysis.wordCount < 200 && textType === 'narrative') {
      guidance.push({
        id: `narrative-development-${Date.now()}`,
        trigger: 'word_count',
        message: 'Great progress! You\'re at ' + analysis.wordCount + ' words. For NSW Selective, aim for 250-300 words. Consider adding dialogue or more sensory details to reach the target.',
        actionable: true,
        priority: 'low',
        category: 'exam_strategy',
        timestamp: new Date()
      });
    }

    // Structure guidance
    if (analysis.paragraphCount === 1 && analysis.wordCount > 100) {
      guidance.push({
        id: `paragraph-structure-${Date.now()}`,
        trigger: 'structure',
        message: 'Consider breaking your writing into paragraphs. Each new idea or scene should start a new paragraph for better organization.',
        actionable: true,
        priority: 'high',
        category: 'structure',
        timestamp: new Date()
      });
    }

    // Vocabulary guidance
    if (analysis.vocabularyDiversity < 0.7 && analysis.wordCount > 100) {
      guidance.push({
        id: `vocabulary-diversity-${Date.now()}`,
        trigger: 'repetition',
        message: 'Try using more varied vocabulary. You\'re repeating some words frequently. Click on any word to see synonym suggestions.',
        actionable: true,
        priority: 'medium',
        category: 'vocabulary',
        timestamp: new Date()
      });
    }

    // Content-specific guidance
    if (textType === 'narrative' && !text.toLowerCase().includes('said') && !text.includes('"') && analysis.wordCount > 100) {
      guidance.push({
        id: `dialogue-suggestion-${Date.now()}`,
        trigger: 'content_gap',
        message: 'Consider adding dialogue to bring your characters to life. Dialogue makes narratives more engaging and helps show character personality.',
        actionable: true,
        priority: 'medium',
        category: 'content',
        timestamp: new Date()
      });
    }

    if (textType === 'persuasive' && !text.includes('?') && analysis.wordCount > 50) {
      guidance.push({
        id: `rhetorical-question-${Date.now()}`,
        trigger: 'content_gap',
        message: 'Try adding a rhetorical question to engage your reader. Questions make your argument more compelling and interactive.',
        actionable: true,
        priority: 'low',
        category: 'style',
        timestamp: new Date()
      });
    }

    setProactiveGuidance(prev => [...guidance, ...prev].slice(0, 10)); // Keep only latest 10 guidance items
  }, [textType, writingStartTime]);

  // Helper functions
  const calculateReadabilityScore = (text: string): number => {
    const words = text.trim().split(/\s+/).length;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const syllables = text.split(/\s+/).reduce((count, word) => {
      return count + countSyllables(word);
    }, 0);

    if (sentences === 0 || words === 0) return 0;
    
    // Flesch Reading Ease Score
    const score = 206.835 - (1.015 * (words / sentences)) - (84.6 * (syllables / words));
    return Math.max(0, Math.min(100, score));
  };

  const countSyllables = (word: string): number => {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    const matches = word.match(/[aeiouy]{1,2}/g);
    return matches ? matches.length : 1;
  };

  const calculateVocabularyDiversity = (words: string[]): number => {
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    return words.length > 0 ? uniqueWords.size / words.length : 0;
  };

  const findRepetitiveWords = (words: string[]): string[] => {
    const wordCount: { [key: string]: number } = {};
    words.forEach(word => {
      const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
      if (cleanWord.length > 3) { // Only check words longer than 3 characters
        wordCount[cleanWord] = (wordCount[cleanWord] || 0) + 1;
      }
    });
    
    return Object.keys(wordCount).filter(word => wordCount[word] > 2);
  };

  const findWeakWords = (words: string[]): string[] => {
    const weakWords = ['very', 'really', 'quite', 'rather', 'pretty', 'somewhat', 'kind of', 'sort of', 'good', 'bad', 'nice', 'big', 'small'];
    return words.filter(word => weakWords.includes(word.toLowerCase())).slice(0, 5);
  };

  const getSynonymSuggestions = (word: string): string[] => {
    const synonyms: { [key: string]: string[] } = {
      'said': ['declared', 'announced', 'exclaimed', 'whispered', 'shouted', 'murmured'],
      'good': ['excellent', 'outstanding', 'remarkable', 'exceptional', 'superb'],
      'bad': ['terrible', 'awful', 'dreadful', 'appalling', 'atrocious'],
      'big': ['enormous', 'massive', 'gigantic', 'colossal', 'immense'],
      'small': ['tiny', 'minuscule', 'petite', 'compact', 'diminutive'],
      'very': ['extremely', 'incredibly', 'remarkably', 'exceptionally', 'extraordinarily'],
      'nice': ['delightful', 'pleasant', 'charming', 'lovely', 'wonderful']
    };
    
    return synonyms[word.toLowerCase()] || ['enhanced', 'improved', 'better'];
  };

  const getStrongerAlternative = (word: string): string => {
    const alternatives: { [key: string]: string } = {
      'very': 'extremely',
      'really': 'genuinely',
      'quite': 'remarkably',
      'good': 'excellent',
      'bad': 'terrible',
      'nice': 'delightful',
      'big': 'enormous',
      'small': 'tiny'
    };
    
    return alternatives[word.toLowerCase()] || word;
  };

  const checkNarrativeRequirements = (text: string, feedback: RealTimeFeedback[]) => {
    const hasDialogue = text.includes('"') || text.includes("'");
    const hasDescriptiveLanguage = /\b(gleaming|shimmering|mysterious|ancient|vibrant|serene)\b/i.test(text);
    const hasCharacterDevelopment = /\b(felt|thought|realized|wondered|remembered)\b/i.test(text);

    if (!hasDialogue && text.length > 200) {
      feedback.push({
        id: `narrative-dialogue-${Date.now()}`,
        type: 'content',
        severity: 'suggestion',
        message: 'Consider adding dialogue to make your narrative more engaging.',
        suggestion: 'Dialogue brings characters to life and makes stories more dynamic.',
        position: { start: text.length - 50, end: text.length },
        examples: ['"I can\'t believe this is happening!" she exclaimed.',
                  '"What do you think we should do?" he asked nervously.'],
        timestamp: new Date()
      });
    }

    if (!hasDescriptiveLanguage && text.length > 100) {
      feedback.push({
        id: `narrative-description-${Date.now()}`,
        type: 'style',
        severity: 'suggestion',
        message: 'Add more descriptive language to create vivid imagery.',
        suggestion: 'Use sensory details and strong adjectives to paint a picture for your reader.',
        position: { start: 0, end: 50 },
        examples: ['The ancient oak tree cast mysterious shadows.',
                  'Her eyes gleamed with determination.'],
        timestamp: new Date()
      });
    }
  };

  const checkPersuasiveRequirements = (text: string, feedback: RealTimeFeedback[]) => {
    const hasRhetoricalQuestion = text.includes('?');
    const hasStatistics = /\b\d+%|\b\d+\s*(percent|per cent)\b/i.test(text);
    const hasStrongOpinion = /\b(must|should|need to|essential|crucial|vital|important)\b/i.test(text);

    if (!hasRhetoricalQuestion && text.length > 100) {
      feedback.push({
        id: `persuasive-question-${Date.now()}`,
        type: 'content',
        severity: 'suggestion',
        message: 'Consider adding a rhetorical question to engage your reader.',
        suggestion: 'Rhetorical questions make your argument more compelling and interactive.',
        position: { start: 0, end: 50 },
        examples: ['How can we ignore this pressing issue?',
                  'Isn\'t it time we took action?'],
        timestamp: new Date()
      });
    }

    if (!hasStrongOpinion && text.length > 50) {
      feedback.push({
        id: `persuasive-opinion-${Date.now()}`,
        type: 'style',
        severity: 'suggestion',
        message: 'Use stronger language to make your position clear.',
        suggestion: 'Words like "must," "essential," and "crucial" strengthen your argument.',
        position: { start: 0, end: text.length },
        examples: ['We must take immediate action.',
                  'It is essential that we address this issue.'],
        timestamp: new Date()
      });
    }
  };

  // Chat functionality
  const handleChatSubmit = async () => {
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      text: chatInput,
      isUser: true,
      timestamp: new Date(),
      type: 'general'
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      // Analyze the question and provide contextual response
      const response = await getContextualResponse(chatInput, content, textType);
      
      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        text: response,
        isUser: false,
        timestamp: new Date(),
        type: 'feedback'
      };

      setChatMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        text: 'I\'m having trouble right now. Try asking about specific aspects of your writing like vocabulary, structure, or content.',
        isUser: false,
        timestamp: new Date(),
        type: 'general'
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const getContextualResponse = async (question: string, content: string, textType: string): Promise<string> => {
    // Simple contextual responses based on question analysis
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('vocabulary') || lowerQuestion.includes('word')) {
      const analysis = writingAnalysis;
      if (analysis && analysis.repetitiveWords.length > 0) {
        return `I notice you're using these words repeatedly: ${analysis.repetitiveWords.join(', ')}. Try using synonyms to add variety. For example, instead of "said," you could use "declared," "whispered," or "exclaimed."`;
      }
      return `To enhance your vocabulary, try replacing simple words with more sophisticated alternatives. For ${textType} writing, focus on precise, descriptive words that convey your exact meaning.`;
    }
    
    if (lowerQuestion.includes('structure') || lowerQuestion.includes('organize')) {
      const paragraphCount = content.split(/\n\s*\n/).length;
      if (paragraphCount === 1 && content.length > 100) {
        return `Your writing would benefit from better paragraph structure. Try breaking your ideas into separate paragraphs - each new idea or scene should start a new paragraph.`;
      }
      return `For ${textType} writing, structure is key. Start with a strong opening, develop your ideas in the middle, and end with a satisfying conclusion. Each paragraph should focus on one main idea.`;
    }
    
    if (lowerQuestion.includes('nsw') || lowerQuestion.includes('selective')) {
      return `For NSW Selective exams, aim for 250-300 words, use sophisticated vocabulary, vary your sentence structure, and ensure your ${textType} has a clear beginning, middle, and end. Show don't tell, and include specific details that bring your writing to life.`;
    }
    
    if (lowerQuestion.includes('improve') || lowerQuestion.includes('better')) {
      const suggestions = [];
      if (writingAnalysis) {
        if (writingAnalysis.repetitiveWords.length > 0) {
          suggestions.push('Use more varied vocabulary');
        }
        if (writingAnalysis.averageWordsPerSentence < 8) {
          suggestions.push('Try longer, more complex sentences');
        }
        if (writingAnalysis.paragraphCount === 1) {
          suggestions.push('Break your writing into paragraphs');
        }
      }
      
      if (suggestions.length > 0) {
        return `Here are specific ways to improve your writing: ${suggestions.join(', ')}. Focus on one area at a time for the best results.`;
      }
    }
    
    return `Great question! For ${textType} writing, focus on clear structure, varied vocabulary, and engaging content. What specific aspect would you like help with - vocabulary, structure, or content development?`;
  };

  // Auto-analysis effect
  useEffect(() => {
    if (autoAnalysisEnabled && content.length > 0) {
      // Debounce analysis to avoid too frequent calls
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
      
      analysisTimeoutRef.current = setTimeout(() => {
        analyzeWritingRealTime(content);
      }, 2000); // Wait 2 seconds after user stops typing
    }

    return () => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
    };
  }, [content, autoAnalysisEnabled, analyzeWritingRealTime]);

  // Scroll chat to bottom
  useEffect(() => {
    if (chatMessagesEndRef.current) {
      chatMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Apply feedback suggestion
  const applySuggestion = (feedback: RealTimeFeedback) => {
    if (feedback.replacement && onContentChange) {
      const newContent = content.substring(0, feedback.position.start) + 
                        feedback.replacement + 
                        content.substring(feedback.position.end);
      onContentChange(newContent);
      
      // Remove applied feedback
      setRealTimeFeedback(prev => prev.filter(f => f.id !== feedback.id));
    }
  };

  // Dismiss feedback
  const dismissFeedback = (feedbackId: string) => {
    setRealTimeFeedback(prev => prev.filter(f => f.id !== feedbackId));
  };

  // Dismiss guidance
  const dismissGuidance = (guidanceId: string) => {
    setProactiveGuidance(prev => prev.filter(g => g.id !== guidanceId));
  };

  // Start learning module
  const startLearningModule = (module: LearningModule) => {
    setActiveLearningModule(module);
    setActiveTab('learning');
  };

  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Bot className="h-5 w-5 mr-2 text-blue-600" />
            AI Writing Coach
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setAutoAnalysisEnabled(!autoAnalysisEnabled)}
              className={`p-2 rounded-lg transition-colors ${
                autoAnalysisEnabled 
                  ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              }`}
              title={autoAnalysisEnabled ? 'Auto-analysis enabled' : 'Auto-analysis disabled'}
            >
              <Zap className="h-4 w-4" />
            </button>
            <button
              onClick={() => analyzeWritingRealTime(content)}
              className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
              title="Analyze now"
              disabled={isAnalyzing}
            >
              <RefreshCw className={`h-4 w-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-white rounded-lg p-1">
          {[
            { id: 'realtime', label: 'Live Feedback', icon: Zap },
            { id: 'chat', label: 'Ask Coach', icon: MessageSquare },
            { id: 'learning', label: 'Learn', icon: BookOpen },
            { id: 'progress', label: 'Progress', icon: TrendingUp }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="h-4 w-4 mr-1" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {/* Real-time Feedback Tab */}
        {activeTab === 'realtime' && (
          <div className="h-full flex flex-col">
            {/* Proactive Guidance */}
            {showProactiveGuidance && proactiveGuidance.length > 0 && (
              <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-yellow-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-yellow-800 flex items-center">
                    <Lightbulb className="h-4 w-4 mr-1" />
                    Proactive Guidance
                  </h3>
                  <button
                    onClick={() => setShowProactiveGuidance(false)}
                    className="text-yellow-600 hover:text-yellow-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  {proactiveGuidance.slice(0, 2).map(guidance => (
                    <div key={guidance.id} className="bg-white rounded-lg p-3 border border-yellow-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm text-gray-700">{guidance.message}</p>
                          <div className="flex items-center mt-2 space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              guidance.priority === 'high' ? 'bg-red-100 text-red-700' :
                              guidance.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {guidance.priority} priority
                            </span>
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                              {guidance.category}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => dismissGuidance(guidance.id)}
                          className="ml-2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Real-time Feedback List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {isAnalyzing && (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center space-x-2 text-blue-600">
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    <span className="text-sm">Analyzing your writing...</span>
                  </div>
                </div>
              )}

              {realTimeFeedback.length === 0 && !isAnalyzing && (
                <div className="text-center py-8">
                  <Bot className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">
                    Start writing to get real-time feedback and suggestions!
                  </p>
                </div>
              )}

              {realTimeFeedback.map(feedback => (
                <div
                  key={feedback.id}
                  className={`rounded-lg border p-4 ${
                    feedback.severity === 'error' ? 'bg-red-50 border-red-200' :
                    feedback.severity === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                    feedback.severity === 'suggestion' ? 'bg-blue-50 border-blue-200' :
                    'bg-green-50 border-green-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {feedback.severity === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
                        {feedback.severity === 'warning' && <AlertCircle className="h-4 w-4 text-yellow-500" />}
                        {feedback.severity === 'suggestion' && <Lightbulb className="h-4 w-4 text-blue-500" />}
                        {feedback.severity === 'praise' && <Star className="h-4 w-4 text-green-500" />}
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          {feedback.type}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-700 mb-2">{feedback.message}</p>
                      
                      {feedback.suggestion && (
                        <p className="text-sm text-gray-600 italic mb-2">{feedback.suggestion}</p>
                      )}
                      
                      {feedback.examples && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-gray-500 mb-1">Examples:</p>
                          <ul className="text-xs text-gray-600 space-y-1">
                            {feedback.examples.map((example, index) => (
                              <li key={index} className="flex items-start">
                                <span className="text-gray-400 mr-1">•</span>
                                {example}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-2 mt-3">
                        {feedback.replacement && (
                          <button
                            onClick={() => applySuggestion(feedback)}
                            className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
                          >
                            Apply Fix
                          </button>
                        )}
                        <button
                          onClick={() => dismissFeedback(feedback.id)}
                          className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded-md hover:bg-gray-300 transition-colors"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="h-full flex flex-col">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.length === 0 && (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm mb-4">
                    Ask me anything about your writing!
                  </p>
                  <div className="grid grid-cols-1 gap-2 max-w-sm mx-auto">
                    {[
                      'How can I improve my vocabulary?',
                      'Is my structure clear?',
                      'What about my grammar?',
                      'NSW Selective tips?'
                    ].map(suggestion => (
                      <button
                        key={suggestion}
                        onClick={() => setChatInput(suggestion)}
                        className="px-3 py-2 bg-blue-50 text-blue-700 text-sm rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {chatMessages.map(message => (
                <div
                  key={message.id}
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.isUser
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}

              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg px-4 py-2">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={chatMessagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleChatSubmit()}
                  placeholder="Ask for help with your writing..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isChatLoading}
                />
                <button
                  onClick={handleChatSubmit}
                  disabled={!chatInput.trim() || isChatLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Learning Tab */}
        {activeTab === 'learning' && (
          <div className="h-full overflow-y-auto p-4">
            {!activeLearningModule ? (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Interactive Learning Modules</h3>
                <div className="grid grid-cols-1 gap-4">
                  {learningModules.map(module => (
                    <div
                      key={module.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => startLearningModule(module)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{module.title}</h4>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            module.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
                            module.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {module.difficulty}
                          </span>
                          <span className="text-xs text-gray-500">{module.estimatedTime}min</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{module.description}</p>
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          module.category === 'grammar' ? 'bg-blue-100 text-blue-700' :
                          module.category === 'vocabulary' ? 'bg-purple-100 text-purple-700' :
                          module.category === 'structure' ? 'bg-orange-100 text-orange-700' :
                          module.category === 'style' ? 'bg-pink-100 text-pink-700' :
                          'bg-indigo-100 text-indigo-700'
                        }`}>
                          {module.category}
                        </span>
                        {module.interactive && (
                          <span className="text-xs text-green-600 font-medium">Interactive</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{activeLearningModule.title}</h3>
                  <button
                    onClick={() => setActiveLearningModule(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="space-y-6">
                  <p className="text-gray-600">{activeLearningModule.description}</p>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Examples:</h4>
                    <div className="space-y-2">
                      {activeLearningModule.examples.map((example, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm text-gray-700">{example}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {activeLearningModule.exercises && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Quick Quiz:</h4>
                      {activeLearningModule.exercises.map((exercise, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <p className="font-medium text-gray-900 mb-3">{exercise.question}</p>
                          {exercise.options && (
                            <div className="space-y-2 mb-3">
                              {exercise.options.map((option, optionIndex) => (
                                <label key={optionIndex} className="flex items-center">
                                  <input
                                    type="radio"
                                    name={`exercise-${index}`}
                                    className="mr-2"
                                  />
                                  <span className="text-sm text-gray-700">{option}</span>
                                </label>
                              ))}
                            </div>
                          )}
                          <details className="mt-3">
                            <summary className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-700">
                              Show Answer & Explanation
                            </summary>
                            <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                              <p className="text-sm font-medium text-blue-900 mb-1">
                                Answer: {exercise.correctAnswer}
                              </p>
                              <p className="text-sm text-blue-800">{exercise.explanation}</p>
                            </div>
                          </details>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Progress Tab */}
        {activeTab === 'progress' && (
          <div className="h-full overflow-y-auto p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Writing Progress</h3>
            
            {writingAnalysis ? (
              <div className="space-y-6">
                {/* Current Session Stats */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Current Session</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{writingAnalysis.wordCount}</div>
                      <div className="text-sm text-gray-600">Words</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{writingAnalysis.sentenceCount}</div>
                      <div className="text-sm text-gray-600">Sentences</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{writingAnalysis.paragraphCount}</div>
                      <div className="text-sm text-gray-600">Paragraphs</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {Math.round(writingAnalysis.readabilityScore)}
                      </div>
                      <div className="text-sm text-gray-600">Readability</div>
                    </div>
                  </div>
                </div>

                {/* Writing Quality Metrics */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Quality Metrics</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Vocabulary Diversity</span>
                        <span>{Math.round(writingAnalysis.vocabularyDiversity * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${writingAnalysis.vocabularyDiversity * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Sentence Variety</span>
                        <span>{writingAnalysis.averageWordsPerSentence > 15 ? 'Good' : 'Needs Work'}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            writingAnalysis.averageWordsPerSentence > 15 ? 'bg-green-600' : 'bg-yellow-600'
                          }`}
                          style={{ width: `${Math.min(100, (writingAnalysis.averageWordsPerSentence / 20) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feedback Summary */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Feedback Summary</h4>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold text-red-600">
                        {feedbackHistory.filter(f => f.severity === 'error').length}
                      </div>
                      <div className="text-sm text-gray-600">Errors Fixed</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-blue-600">
                        {feedbackHistory.filter(f => f.severity === 'suggestion').length}
                      </div>
                      <div className="text-sm text-gray-600">Suggestions</div>
                    </div>
                  </div>
                </div>

                {/* Areas for Improvement */}
                {(writingAnalysis.repetitiveWords.length > 0 || writingAnalysis.weakWords.length > 0) && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Areas for Improvement</h4>
                    {writingAnalysis.repetitiveWords.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">Repetitive Words:</p>
                        <div className="flex flex-wrap gap-1">
                          {writingAnalysis.repetitiveWords.map(word => (
                            <span key={word} className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                              {word}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {writingAnalysis.weakWords.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Weak Words:</p>
                        <div className="flex flex-wrap gap-1">
                          {writingAnalysis.weakWords.map(word => (
                            <span key={word} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                              {word}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">
                  Start writing to see your progress metrics!
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}