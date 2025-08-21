import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MessageSquare, Sparkles, ChevronDown, ChevronUp, ThumbsUp, Lightbulb, HelpCircle, Target, AlertCircle, Star, Zap, Gift, Heart, X, Send, User, RefreshCw, BookOpen, Users, Map, Palette, Clock, Award } from 'lucide-react';
import { getWritingFeedback } from '../lib/openai';
import AIErrorHandler from '../utils/errorHandling';
import { promptConfig } from '../config/prompts';
import './improved-layout.css';

interface CoachPanelProps {
  content: string;
  textType: string;
  assistanceLevel: string;
}

interface FeedbackItem {
  type: 'praise' | 'suggestion' | 'question' | 'challenge';
  area: string;
  text: string;
  exampleFromText?: string;
  suggestionForImprovement?: string;
}

interface StructuredFeedback {
  overallComment: string;
  feedbackItems: FeedbackItem[];
  focusForNextTime: string[];
}

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  questionType?: string;
  operation?: string;
  responseQuality?: 'high' | 'medium' | 'low' | 'fallback';
  nswSpecific?: boolean;
  conversationContext?: string;
}

interface CoachingSuggestion {
  id: string;
  category: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  prompt: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  textTypes: string[];
}

interface QuestionAnalysis {
  type: 'vocabulary' | 'structure' | 'grammar' | 'content' | 'plot' | 'character' | 'genre' | 'general';
  operation: string;
  confidence: number;
  keywords: string[];
}

// Expanded coaching suggestions database
const coachingSuggestions: CoachingSuggestion[] = [
  // Plot Development
  {
    id: 'plot-structure',
    category: 'Plot Development',
    title: 'Story Structure Analysis',
    description: 'Analyze and improve your story\'s structure and pacing',
    icon: <Map className="h-4 w-4" />,
    prompt: 'Help me analyze the structure of my story. What elements of plot development could be stronger?',
    difficulty: 'intermediate',
    textTypes: ['narrative', 'creative writing', 'short story']
  },
  {
    id: 'plot-tension',
    category: 'Plot Development',
    title: 'Building Tension',
    description: 'Learn techniques to create and maintain suspense',
    icon: <Zap className="h-4 w-4" />,
    prompt: 'How can I build more tension and suspense in my story?',
    difficulty: 'advanced',
    textTypes: ['narrative', 'creative writing', 'thriller']
  },
  {
    id: 'plot-conflict',
    category: 'Plot Development',
    title: 'Conflict Development',
    description: 'Develop compelling conflicts that drive your story',
    icon: <Target className="h-4 w-4" />,
    prompt: 'What types of conflict could I add to make my story more engaging?',
    difficulty: 'intermediate',
    textTypes: ['narrative', 'creative writing', 'drama']
  },
  
  // Character Development
  {
    id: 'character-depth',
    category: 'Character Development',
    title: 'Character Depth',
    description: 'Create multi-dimensional, believable characters',
    icon: <Users className="h-4 w-4" />,
    prompt: 'How can I make my characters more three-dimensional and relatable?',
    difficulty: 'intermediate',
    textTypes: ['narrative', 'creative writing', 'character study']
  },
  {
    id: 'character-dialogue',
    category: 'Character Development',
    title: 'Authentic Dialogue',
    description: 'Write dialogue that reveals character and advances plot',
    icon: <MessageSquare className="h-4 w-4" />,
    prompt: 'Help me improve my dialogue to better reveal character personalities.',
    difficulty: 'advanced',
    textTypes: ['narrative', 'creative writing', 'screenplay']
  },
  {
    id: 'character-motivation',
    category: 'Character Development',
    title: 'Character Motivation',
    description: 'Develop clear, compelling character motivations',
    icon: <Heart className="h-4 w-4" />,
    prompt: 'What motivations could drive my characters\' actions more effectively?',
    difficulty: 'intermediate',
    textTypes: ['narrative', 'creative writing', 'psychological']
  },
  
  // Genre-Specific Advice
  {
    id: 'genre-fantasy',
    category: 'Genre-Specific',
    title: 'Fantasy Writing',
    description: 'Master world-building and magic systems',
    icon: <Sparkles className="h-4 w-4" />,
    prompt: 'Give me fantasy-specific writing advice for world-building and magic systems.',
    difficulty: 'advanced',
    textTypes: ['fantasy', 'creative writing', 'world-building']
  },
  {
    id: 'genre-mystery',
    category: 'Genre-Specific',
    title: 'Mystery Writing',
    description: 'Craft compelling mysteries with fair clues',
    icon: <HelpCircle className="h-4 w-4" />,
    prompt: 'How can I write a mystery that\'s challenging but fair to readers?',
    difficulty: 'advanced',
    textTypes: ['mystery', 'detective', 'thriller']
  },
  {
    id: 'genre-romance',
    category: 'Genre-Specific',
    title: 'Romance Writing',
    description: 'Develop believable romantic relationships',
    icon: <Heart className="h-4 w-4" />,
    prompt: 'Help me write more authentic and engaging romantic relationships.',
    difficulty: 'intermediate',
    textTypes: ['romance', 'relationship', 'drama']
  },
  
  // Writing Craft
  {
    id: 'craft-pacing',
    category: 'Writing Craft',
    title: 'Pacing Control',
    description: 'Master the rhythm and flow of your narrative',
    icon: <Clock className="h-4 w-4" />,
    prompt: 'How can I improve the pacing of my story?',
    difficulty: 'intermediate',
    textTypes: ['narrative', 'creative writing', 'novel']
  },
  {
    id: 'craft-voice',
    category: 'Writing Craft',
    title: 'Finding Your Voice',
    description: 'Develop a unique and consistent writing voice',
    icon: <User className="h-4 w-4" />,
    prompt: 'Help me develop a stronger, more distinctive writing voice.',
    difficulty: 'advanced',
    textTypes: ['creative writing', 'personal essay', 'memoir']
  },
  {
    id: 'craft-description',
    category: 'Writing Craft',
    title: 'Vivid Descriptions',
    description: 'Create immersive, sensory-rich descriptions',
    icon: <Palette className="h-4 w-4" />,
    prompt: 'How can I write more vivid and engaging descriptions?',
    difficulty: 'beginner',
    textTypes: ['descriptive', 'narrative', 'travel writing']
  },
  
  // NSW Selective Specific
  {
    id: 'nsw-persuasive',
    category: 'NSW Selective',
    title: 'Persuasive Techniques',
    description: 'Master persuasive writing for NSW Selective exams',
    icon: <Award className="h-4 w-4" />,
    prompt: 'What persuasive techniques work best for NSW Selective writing tasks?',
    difficulty: 'intermediate',
    textTypes: ['persuasive', 'argumentative', 'opinion']
  },
  {
    id: 'nsw-narrative',
    category: 'NSW Selective',
    title: 'NSW Narrative Structure',
    description: 'Perfect narrative structure for selective school exams',
    icon: <BookOpen className="h-4 w-4" />,
    prompt: 'How should I structure my narrative for NSW Selective exam success?',
    difficulty: 'intermediate',
    textTypes: ['narrative', 'creative writing', 'exam preparation']
  },
  {
    id: 'nsw-time-management',
    category: 'NSW Selective',
    title: 'Exam Time Management',
    description: 'Strategies for writing under time pressure',
    icon: <Clock className="h-4 w-4" />,
    prompt: 'Give me strategies for managing time effectively during NSW Selective writing exams.',
    difficulty: 'beginner',
    textTypes: ['exam preparation', 'timed writing', 'test strategy']
  }
];

export function CoachPanel({ content, textType, assistanceLevel }: CoachPanelProps) {
  const [structuredFeedback, setStructuredFeedback] = useState<StructuredFeedback | null>(null);
  const [feedbackHistory, setFeedbackHistory] = useState<FeedbackItem[]>([]);
  const [localAssistanceLevel, setLocalAssistanceLevel] = useState<string>(assistanceLevel);
  const [hiddenFeedbackItems, setHiddenFeedbackItems] = useState<number[]>([]);
  const [isOverallCommentHidden, setIsOverallCommentHidden] = useState(false);
  const [isFocusForNextTimeHidden, setIsFocusForNextTimeHidden] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastProcessedContent, setLastProcessedContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Enhanced chat functionality state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [showPrompts, setShowPrompts] = useState(false);
  const [conversationContext, setConversationContext] = useState<ChatMessage[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedSuggestion, setSelectedSuggestion] = useState<CoachingSuggestion | null>(null);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

  // Get relevant coaching suggestions based on text type and content
  const getRelevantSuggestions = useCallback(() => {
    let filtered = coachingSuggestions;
    
    // Filter by category
    if (activeCategory !== 'all') {
      filtered = filtered.filter(s => s.category === activeCategory);
    }
    
    // Filter by text type relevance
    if (textType) {
      filtered = filtered.filter(s => 
        s.textTypes.some(type => 
          type.toLowerCase().includes(textType.toLowerCase()) ||
          textType.toLowerCase().includes(type.toLowerCase())
        )
      );
    }
    
    // If no text-type specific suggestions, show general ones
    if (filtered.length === 0) {
      filtered = coachingSuggestions.filter(s => 
        s.textTypes.includes('creative writing') || 
        s.textTypes.includes('narrative') ||
        s.category === 'Writing Craft'
      );
    }
    
    return filtered.slice(0, 6); // Limit to 6 suggestions
  }, [textType, activeCategory]);

  // Enhanced question analysis function
  const analyzeUserQuestion = useCallback((question: string): QuestionAnalysis => {
    const lowerQuestion = question.toLowerCase();
    
    // Plot-related keywords
    const plotKeywords = ['plot', 'story', 'structure', 'beginning', 'middle', 'end', 'climax', 'resolution', 'conflict', 'tension', 'pacing'];
    const plotScore = plotKeywords.filter(keyword => lowerQuestion.includes(keyword)).length;
    
    // Character-related keywords
    const characterKeywords = ['character', 'dialogue', 'personality', 'motivation', 'development', 'relationship', 'protagonist', 'antagonist'];
    const characterScore = characterKeywords.filter(keyword => lowerQuestion.includes(keyword)).length;
    
    // Genre-related keywords
    const genreKeywords = ['fantasy', 'mystery', 'romance', 'thriller', 'horror', 'science fiction', 'genre', 'world-building', 'magic'];
    const genreScore = genreKeywords.filter(keyword => lowerQuestion.includes(keyword)).length;
    
    // Vocabulary-related keywords
    const vocabularyKeywords = ['word', 'vocabulary', 'synonym', 'better word', 'stronger word', 'replace', 'enhance', 'improve word'];
    const vocabularyScore = vocabularyKeywords.filter(keyword => lowerQuestion.includes(keyword)).length;
    
    // Structure-related keywords
    const structureKeywords = ['structure', 'organize', 'paragraph', 'introduction', 'conclusion', 'flow', 'transition', 'order'];
    const structureScore = structureKeywords.filter(keyword => lowerQuestion.includes(keyword)).length;
    
    // Grammar-related keywords
    const grammarKeywords = ['grammar', 'spelling', 'punctuation', 'sentence', 'tense', 'correct'];
    const grammarScore = grammarKeywords.filter(keyword => lowerQuestion.includes(keyword)).length;
    
    // Content-related keywords
    const contentKeywords = ['idea', 'content', 'topic', 'theme', 'argument', 'evidence', 'example', 'detail'];
    const contentScore = contentKeywords.filter(keyword => lowerQuestion.includes(keyword)).length;
    
    // Determine the most likely question type
    const scores = {
      plot: plotScore,
      character: characterScore,
      genre: genreScore,
      vocabulary: vocabularyScore,
      structure: structureScore,
      grammar: grammarScore,
      content: contentScore
    };
    
    const maxScore = Math.max(...Object.values(scores));
    const questionType = Object.keys(scores).find(key => scores[key as keyof typeof scores] === maxScore) || 'general';
    
    // Map question types to operations
    const operationMap = {
      plot: 'getPlotDevelopmentAdvice',
      character: 'getCharacterDevelopmentAdvice',
      genre: 'getGenreSpecificAdvice',
      vocabulary: 'enhanceVocabulary',
      structure: 'getWritingStructure',
      grammar: 'checkGrammarAndSpelling',
      content: 'getSpecializedTextTypeFeedback',
      general: 'getWritingFeedback'
    };
    
    return {
      type: questionType as QuestionAnalysis['type'],
      operation: operationMap[questionType as keyof typeof operationMap],
      confidence: maxScore > 0 ? maxScore / Math.max(plotKeywords.length, characterKeywords.length) : 0.5,
      keywords: [plotKeywords, characterKeywords, genreKeywords, vocabularyKeywords, structureKeywords, grammarKeywords, contentKeywords].flat().filter(keyword => lowerQuestion.includes(keyword))
    };
  }, []);

  // Generate contextual responses based on question type and content
  const generateContextualResponse = (questionType: string, userQuestion: string): string => {
    const responses = {
      plot: [
        "Great plot question! For strong story structure, consider the three-act structure: Setup (introduce characters and conflict), Confrontation (develop conflict and obstacles), and Resolution (climax and conclusion). What specific aspect of your plot needs work?",
        "Plot development is crucial for engaging stories! Think about your main conflict - is it clear and compelling? Does each scene move the story forward? Consider adding obstacles that force your character to grow.",
        "Excellent question about plot! For NSW Selective success, ensure your story has: a clear beginning that hooks the reader, rising action with increasing tension, a satisfying climax, and a meaningful resolution. What's your story about?"
      ],
      character: [
        "Character development is key to great storytelling! Give your characters clear motivations, flaws, and growth arcs. What drives your main character? What do they want, and what's stopping them?",
        "Great character question! For believable characters, think about their backstory, personality traits, and how they speak. Each character should have a unique voice. Show their personality through actions and dialogue.",
        "Character work is essential for NSW Selective writing! Develop characters with depth - give them internal conflicts, clear goals, and realistic reactions. How does your character change throughout the story?"
      ],
      genre: [
        "Genre-specific advice can really elevate your writing! Each genre has its own conventions and reader expectations. What genre are you working in? I can provide specific techniques for that style.",
        "Excellent genre question! For fantasy, focus on consistent world-building and magic systems. For mystery, plant fair clues. For romance, develop believable relationship dynamics. What's your genre?",
        "Genre mastery is important for targeted writing! Understanding your genre's tropes and expectations helps you either fulfill or cleverly subvert them. Which genre conventions are you exploring?"
      ],
      vocabulary: [
        "Great question about vocabulary! For stronger word choices, try replacing simple words like 'good' with 'excellent' or 'outstanding'. What specific words would you like help improving?",
        "Vocabulary is key for NSW Selective success! Consider using more sophisticated words - instead of 'big', try 'enormous' or 'substantial'. Which part of your writing needs stronger vocabulary?",
        "Excellent vocabulary question! For narrative writing, use vivid action verbs and descriptive adjectives. For persuasive writing, use powerful words that convince your reader."
      ],
      structure: [
        "Structure is crucial for NSW Selective writing! For narratives, use: engaging opening → rising action → climax → resolution. For persuasive essays: introduction with thesis → 3 body paragraphs with evidence → strong conclusion.",
        "Great structure question! Make sure each paragraph has one main idea, and use connecting words like 'furthermore', 'however', and 'in conclusion' to link your ideas smoothly.",
        "NSW Selective examiners love clear structure! Start with a hook, develop your ideas logically, and end with impact. What type of writing are you working on?"
      ],
      grammar: [
        "Grammar accuracy is important for NSW Selective! Check your sentence variety - mix short and long sentences. Make sure you're using correct punctuation, especially commas and apostrophes.",
        "Good grammar question! For NSW Selective, focus on: subject-verb agreement, consistent tense, and varied sentence beginnings. Read your work aloud to catch errors.",
        "Grammar tip for NSW success: Use complex sentences with subordinate clauses, but make sure they're clear. Avoid run-on sentences and sentence fragments."
      ],
      content: [
        "Content development is key for NSW Selective! Add specific details, examples, and evidence to support your main ideas. Show, don't just tell - use sensory details and dialogue.",
        "Excellent content question! For narratives, develop your characters' emotions and motivations. For persuasive writing, include facts, statistics, or expert opinions to strengthen your arguments.",
        "NSW Selective values original thinking! Develop your ideas deeply rather than just listing them. Ask yourself 'why' and 'how' to add depth to your content."
      ],
      general: [
        "I'm here to help with your NSW Selective writing preparation! Ask me about specific aspects like vocabulary, structure, grammar, content development, plot, or character development.",
        "Great to see you working on your writing! For NSW Selective success, focus on clear structure, sophisticated vocabulary, well-developed ideas, and engaging storytelling. What specific area would you like help with?",
        "NSW Selective writing requires strong skills across all areas. I can help you with planning, drafting, vocabulary choices, grammar, plot development, character creation, and exam strategies. What's your main concern right now?"
      ]
    };
    
    const typeResponses = responses[questionType as keyof typeof responses] || responses.general;
    const randomIndex = Math.floor(Math.random() * typeResponses.length);
    return typeResponses[randomIndex];
  };

  // Handle sending chat messages
  const handleSendMessage = useCallback(async (message: string) => {
    if (!message.trim() || isChatLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: message.trim(),
      isUser: true,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      // Analyze the question
      const analysis = analyzeUserQuestion(message);
      
      // Generate response based on analysis
      const response = generateContextualResponse(analysis.type, message);
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date(),
        questionType: analysis.type,
        responseQuality: 'high',
        nswSpecific: true
      };

      setChatMessages(prev => [...prev, assistantMessage]);
      
    } catch (error) {
      console.error('Error generating response:', error);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "I'm having trouble responding right now, but I'm here to help! Try asking about specific aspects of your writing like plot, characters, vocabulary, or structure.",
        isUser: false,
        timestamp: new Date(),
        responseQuality: 'fallback'
      };

      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  }, [isChatLoading, analyzeUserQuestion]);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((suggestion: CoachingSuggestion) => {
    setSelectedSuggestion(suggestion);
    handleSendMessage(suggestion.prompt);
  }, [handleSendMessage]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(coachingSuggestions.map(s => s.category)))];

  const relevantSuggestions = getRelevantSuggestions();

  return (
    <div className="coach-panel bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Enhanced Writing Coach</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Advanced guidance for {textType} writing
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {chatMessages.length} messages
            </span>
          </div>
        </div>
      </div>

      {/* Coaching Suggestions */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">Quick Coaching Topics</h4>
          <select
            value={activeCategory}
            onChange={(e) => setActiveCategory(e.target.value)}
            className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Topics' : category}
              </option>
            ))}
          </select>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          {relevantSuggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              onClick={() => handleSuggestionSelect(suggestion)}
              className="p-3 text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-300 dark:hover:border-blue-500 transition-colors group"
            >
              <div className="flex items-start space-x-2">
                <div className="text-blue-500 dark:text-blue-400 mt-0.5">
                  {suggestion.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="text-xs font-medium text-gray-900 dark:text-white truncate">
                    {suggestion.title}
                  </h5>
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                    {suggestion.description}
                  </p>
                  <div className="flex items-center space-x-1 mt-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      suggestion.difficulty === 'beginner' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                      suggestion.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                      'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                    }`}>
                      {suggestion.difficulty}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatMessages.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Welcome to Enhanced Writing Coach!
            </h4>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              I'm here to help you with all aspects of writing, from plot development to character creation.
            </p>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Try asking about:
              <ul className="mt-2 space-y-1">
                <li>• Plot structure and story development</li>
                <li>• Character creation and dialogue</li>
                <li>• Genre-specific writing techniques</li>
                <li>• NSW Selective exam strategies</li>
              </ul>
            </div>
          </div>
        ) : (
          chatMessages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.isUser
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                }`}
              >
                <div className="text-sm whitespace-pre-wrap">{message.text}</div>
                <div className="flex items-center justify-between mt-2">
                  <div className="text-xs opacity-70">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                  {!message.isUser && message.questionType && (
                    <div className="text-xs opacity-70 flex items-center space-x-1">
                      <span>{message.questionType}</span>
                      {message.nswSpecific && (
                        <Award className="h-3 w-3" title="NSW Selective specific advice" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        
        {isChatLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Coach is thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={chatMessagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Ask about plot, characters, genre techniques, or any writing question..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(chatInput);
              }
            }}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
          />
          <button
            onClick={() => handleSendMessage(chatInput)}
            disabled={!chatInput.trim() || isChatLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Enhanced with plot development, character guidance, and genre-specific advice
        </div>
      </div>
    </div>
  );
}
