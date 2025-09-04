import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, MessageCircle, BarChart3, BookOpen, TrendingUp, Lightbulb, Play, Pause, Volume2, VolumeX, Settings, RefreshCw, Eye, EyeOff, Maximize2, Minimize2, Timer, Target, Award, Sparkles, Bot, User, CheckCircle, AlertTriangle, Info } from 'lucide-react';

// Enhanced interfaces for better type safety
interface WritingAreaProps {
  onContentChange?: (content: string) => void;
  initialContent?: string;
  textType?: string;
  prompt?: string;
  onPromptChange?: (prompt: string) => void;
  studentAge?: number;
  examMode?: boolean;
}

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isAutomatic?: boolean;
  paragraphNumber?: number;
  type?: 'feedback' | 'encouragement' | 'suggestion' | 'question';
}

interface WritingMetrics {
  wordCount: number;
  characterCount: number;
  paragraphCount: number;
  sentenceCount: number;
  readingTime: number;
  averageWordsPerSentence: number;
  vocabularyLevel: 'basic' | 'intermediate' | 'advanced';
}

interface AIFeedback {
  isGenerating: boolean;
  lastProcessedContent: string;
  feedbackHistory: Array<{
    id: string;
    content: string;
    feedback: string;
    timestamp: Date;
    paragraphNumber: number;
  }>;
  isConfigured: boolean;
}

// Embedded AI Service with improved error handling and kid-friendly responses
class KidFriendlyAIService {
  private apiKey: string;
  private apiBase: string;
  private studentAge: number;

  constructor(studentAge: number = 10) {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
    this.apiBase = import.meta.env.VITE_OPENAI_API_BASE || 'https://api.openai.com/v1';
    this.studentAge = studentAge;
  }

  private async callOpenAI(messages: any[], maxTokens: number = 200): Promise<string> {
    try {
      const response = await fetch(`${this.apiBase}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: messages,
          max_tokens: maxTokens,
          temperature: 0.7,
          stream: false
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API error: ${response.status} - ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content.trim();
    } catch (error) {
      console.error('OpenAI API call failed:', error);
      throw error;
    }
  }

  async generateInitialWelcome(): Promise<string> {
    const systemMessage = `You are a friendly AI writing coach for students aged ${this.studentAge} preparing for NSW Selective School exams. Welcome them warmly and ask them to share their writing prompt. Be encouraging and age-appropriate.`;
    
    const userPrompt = `Welcome a student to the writing session and ask them to share their writing prompt. Keep it friendly and encouraging.`;

    const messages = [
      { role: 'system', content: systemMessage },
      { role: 'user', content: userPrompt }
    ];

    try {
      return await this.callOpenAI(messages);
    } catch (error) {
      return `Hi there! 👋 I'm your AI writing buddy, and I'm so excited to help you write an amazing story today! Can you tell me what your writing prompt is? I can't wait to see what creative ideas you have! ✨`;
    }
  }

  async generateParagraphFeedback(content: string, paragraphNumber: number, textType: string): Promise<string> {
    const systemMessage = `You are an encouraging AI writing coach for students aged ${this.studentAge} preparing for NSW Selective School exams. Provide supportive, constructive feedback in 2-3 sentences maximum. Focus on what the student did well and provide 1-2 actionable suggestions. Use encouraging language and emojis appropriately.`;
    
    const userPrompt = `Please provide encouraging feedback for paragraph ${paragraphNumber} of this ${textType.toLowerCase()} writing: "${content}"`;

    const messages = [
      { role: 'system', content: systemMessage },
      { role: 'user', content: userPrompt }
    ];

    try {
      return await this.callOpenAI(messages);
    } catch (error) {
      const encouragements = [
        `Great work on paragraph ${paragraphNumber}! 🌟 You're building your story really well. Try adding more descriptive words to help readers picture what's happening.`,
        `Fantastic effort! 👏 I love how you're developing your ideas in paragraph ${paragraphNumber}. Consider adding some dialogue to make your characters come alive!`,
        `You're doing amazing! ✨ Paragraph ${paragraphNumber} shows great creativity. Maybe try showing your character's feelings through their actions and thoughts.`
      ];
      return encouragements[Math.floor(Math.random() * encouragements.length)];
    }
  }

  async generateChatResponse(userMessage: string, context: { textType: string; wordCount: number; currentContent: string }): Promise<string> {
    const systemMessage = `You are a helpful AI writing coach for students aged ${this.studentAge} preparing for NSW Selective School exams. Provide encouraging, age-appropriate writing advice in 2-4 sentences. Use emojis sparingly and focus on practical, actionable advice.`;
    
    const userPrompt = `Student's question: "${userMessage}". They're working on ${context.textType.toLowerCase()} writing and have written ${context.wordCount} words so far. Context: "${context.currentContent.substring(0, 200)}..."`;

    const messages = [
      { role: 'system', content: systemMessage },
      { role: 'user', content: userPrompt }
    ];

    try {
      return await this.callOpenAI(messages, 300);
    } catch (error) {
      return "I'm having trouble responding right now, but I believe in you! 💪 Keep writing and let your creativity flow. You're doing great!";
    }
  }

  async analyzePrompt(prompt: string): Promise<string> {
    const systemMessage = `You are a helpful AI writing coach for students aged ${this.studentAge}. Break down the writing prompt into simple, understandable parts and provide 2-3 helpful starting suggestions.`;
    
    const userPrompt = `Help me understand this writing prompt and give me some ideas to get started: "${prompt}"`;

    const messages = [
      { role: 'system', content: systemMessage },
      { role: 'user', content: userPrompt }
    ];

    try {
      return await this.callOpenAI(messages, 400);
    } catch (error) {
      return `Great prompt! 🎯 Think about who your main character is, where your story takes place, and what exciting thing happens to them. Start by describing your character or setting the scene!`;
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey !== 'YOUR_OPENAI_API_KEY'; // Check for placeholder
  }

  async testConnection(): Promise<boolean> {
    if (!this.isConfigured()) {
      console.warn('OpenAI API key is not configured.');
      return false;
    }
    try {
      const testMessages = [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Say "Hello" if you can hear me.' }
      ];
      
      const response = await this.callOpenAI(testMessages);
      return response.toLowerCase().includes('hello');
    } catch (error) {
      console.error('Failed to test OpenAI connection:', error);
      return false;
    }
  }
}

// Utility functions for content analysis
const analyzeContent = (content: string): WritingMetrics => {
  const words = content.trim().split(/\s+/).filter(word => word.length > 0);
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  
  const wordCount = words.length;
  const characterCount = content.length;
  const paragraphCount = Math.max(1, paragraphs.length);
  const sentenceCount = Math.max(1, sentences.length);
  const readingTime = Math.ceil(wordCount / 200);
  const averageWordsPerSentence = Math.round(wordCount / sentenceCount);
  
  // Simple vocabulary level assessment
  const complexWords = words.filter(word => word.length > 6).length;
  const vocabularyRatio = complexWords / wordCount;
  let vocabularyLevel: 'basic' | 'intermediate' | 'advanced' = 'basic';
  
  if (vocabularyRatio > 0.3) vocabularyLevel = 'advanced';
  else if (vocabularyRatio > 0.15) vocabularyLevel = 'intermediate';
  
  return {
    wordCount,
    characterCount,
    paragraphCount,
    sentenceCount,
    readingTime,
    averageWordsPerSentence,
    vocabularyLevel
  };
};

const detectParagraphCompletion = (currentContent: string, previousContent: string) => {
  const paragraphs = currentContent.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const previousParagraphs = previousContent.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  
  // Check if a new paragraph was completed
  if (paragraphs.length > previousParagraphs.length) {
    const lastParagraph = paragraphs[paragraphs.length - 1]?.trim() || '';
    const hasMinimumLength = lastParagraph.length >= 50;
    const hasProperEnding = /[.!?]\s*$/.test(lastParagraph);
    const hasSignificantContent = lastParagraph.split(' ').length >= 10;
    
    if (hasMinimumLength && hasProperEnding && hasSignificantContent) {
      return {
        shouldTrigger: true,
        paragraphContent: lastParagraph,
        paragraphNumber: paragraphs.length
      };
    }
  }
  
  return { shouldTrigger: false };
};

// Main ImprovedWritingArea Component
export const ImprovedWritingArea: React.FC<WritingAreaProps> = ({
  onContentChange,
  initialContent = '',
  textType = 'narrative',
  prompt: propPrompt,
  onPromptChange,
  studentAge = 10,
  examMode = false
}) => {
  // Core state
  const [content, setContent] = useState(initialContent);
  const [prompt, setPrompt] = useState(propPrompt || '');
  const [metrics, setMetrics] = useState<WritingMetrics>(analyzeContent(initialContent));
  
  // UI state
  const [activeTab, setActiveTab] = useState<'coach' | 'progress' | 'tips'>('coach');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showWordCount, setShowWordCount] = useState(true);
  const [fontSize, setFontSize] = useState(16);
  const [darkMode, setDarkMode] = useState(false);
  
  // AI and chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [aiService] = useState(() => new KidFriendlyAIService(studentAge));
  const [aiFeedback, setAiFeedback] = useState<AIFeedback>({
    isGenerating: false,
    lastProcessedContent: '',
    feedbackHistory: [],
    isConfigured: false
  });
  
  // Timer and session state
  const [timeSpent, setTimeSpent] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null);
  
  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const feedbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastContentRef = useRef('');
  
  // Initialize AI service and welcome message
  useEffect(() => {
    const initializeAI = async () => {
      const isConfigured = aiService.isConfigured();
      setAiFeedback(prev => ({ ...prev, isConfigured }));
      
      if (isConfigured) {
        try {
          const connectionTest = await aiService.testConnection();
          if (connectionTest) {
            // Add initial welcome message
            const welcomeMessage = await aiService.generateInitialWelcome();
            const initialMessage: ChatMessage = {
              id: 'welcome_' + Date.now(),
              text: welcomeMessage,
              sender: 'ai',
              timestamp: new Date(),
              type: 'question'
            };
            setChatMessages([initialMessage]);
          } else {
            console.warn('OpenAI API connection test failed. AI features will be disabled.');
            setAiFeedback(prev => ({ ...prev, isConfigured: false }));
            const fallbackMessage: ChatMessage = {
              id: 'welcome_fallback_connection_failed',
              text: "Hi there! 👋 I'm your writing buddy! It looks like I'm having trouble connecting to my AI brain right now, but I'm still here to help. What would you like to write about today?",
              sender: 'ai',
              timestamp: new Date(),
              type: 'question'
            };
            setChatMessages([fallbackMessage]);
          }
        } catch (error) {
          console.error('Failed to initialize AI:', error);
          setAiFeedback(prev => ({ ...prev, isConfigured: false }));
          const fallbackMessage: ChatMessage = {
            id: 'welcome_fallback_error',
            text: "Hi there! 👋 I'm your writing buddy! I encountered an error trying to connect to my AI brain, but I'm still here to help. What would you like to write about today?",
            sender: 'ai',
            timestamp: new Date(),
            type: 'question'
          };
          setChatMessages([fallbackMessage]);
        }
      } else {
        // Add fallback welcome message if not configured (e.g., missing API key)
        const fallbackMessage: ChatMessage = {
          id: 'welcome_fallback_not_configured',
          text: "Hi there! 👋 I'm your writing buddy! While I can't use AI features right now, I'm still here to help. What would you like to write about today?",
          sender: 'ai',
          timestamp: new Date(),
          type: 'question'
        };
        setChatMessages([fallbackMessage]);
      }
    };
    
    initializeAI();
    
    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
      setSpeechSynthesis(window.speechSynthesis);
    }
  }, [aiService]);
  
  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);
  
  // Auto-save effect
  useEffect(() => {
    const saveTimer = setTimeout(() => {
      if (content.trim() && content !== initialContent) {
        setIsAutoSaving(true);
        // Simulate save operation
        setTimeout(() => {
          setIsAutoSaving(false);
          setLastSaved(new Date());
        }, 500);
      }
    }, 2000);
    return () => clearTimeout(saveTimer);
  }, [content, initialContent]);
  
  // Content analysis and feedback effect (only for metrics and auto-feedback, not AI analysis issues)
  useEffect(() => {
    // Update metrics
    const newMetrics = analyzeContent(content);
    setMetrics(newMetrics);
    
    // Notify parent of content change
    if (onContentChange) {
      onContentChange(content);
    }
    
    // Clear existing feedback timer
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }
    
    // Check for paragraph completion and trigger feedback
    if (aiFeedback.isConfigured && content.trim()) {
      const detection = detectParagraphCompletion(content, lastContentRef.current);
      
      if (detection.shouldTrigger) {
        feedbackTimerRef.current = setTimeout(async () => {
          await generateAutomaticFeedback(
            detection.paragraphContent!,
            detection.paragraphNumber!
          );
        }, 3000); // 3 second delay for automatic feedback
      }
    }
    
    lastContentRef.current = content;
    
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
    };
  }, [content, onContentChange, aiFeedback.isConfigured]);
  
  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);
  
  // Generate automatic feedback for completed paragraphs
  const generateAutomaticFeedback = async (paragraphContent: string, paragraphNumber: number) => {
    if (!aiFeedback.isConfigured || aiFeedback.isGenerating) return;
    
    // Check if we already have feedback for this exact content
    const existingFeedback = aiFeedback.feedbackHistory.find(
      f => f.content === paragraphContent && f.paragraphNumber === paragraphNumber
    );
    
    if (existingFeedback) return;
    
    setAiFeedback(prev => ({ ...prev, isGenerating: true }));
    
    try {
      const feedbackText = await aiService.generateParagraphFeedback(
        paragraphContent,
        paragraphNumber,
        textType
      );
      
      const feedbackMessage: ChatMessage = {
        id: `auto_feedback_${Date.now()}_${paragraphNumber}`,
        text: feedbackText,
        sender: 'ai',
        timestamp: new Date(),
        isAutomatic: true,
        paragraphNumber: paragraphNumber,
        type: 'feedback'
      };
      
      setChatMessages(prev => [...prev, feedbackMessage]);
      
      const feedbackRecord = {
        id: feedbackMessage.id,
        content: paragraphContent,
        feedback: feedbackText,
        timestamp: new Date(),
        paragraphNumber
      };
      
      setAiFeedback(prev => ({
        ...prev,
        isGenerating: false,
        feedbackHistory: [...prev.feedbackHistory, feedbackRecord]
      }));
      
    } catch (error) {
      console.error('Error generating automatic feedback:', error);
      setAiFeedback(prev => ({ ...prev, isGenerating: false }));
    }
  };
  
  // Handle content change
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    
    // Start timer if not running and content is being added
    if (!isTimerRunning && e.target.value.trim() && !sessionStartTime) {
      setIsTimerRunning(true);
      setSessionStartTime(new Date());
    }
  };
  
  // Handle chat submission
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;
    
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      text: chatInput,
      sender: 'user',
      timestamp: new Date(),
      type: 'question'
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    const currentInput = chatInput;
    setChatInput('');
    setIsChatLoading(true);
    
    try {
      let aiResponse: string;
      
      if (aiFeedback.isConfigured) {
        // Check if user is providing a prompt
        if (!prompt && (currentInput.toLowerCase().includes('write') || currentInput.length > 20)) {
          setPrompt(currentInput);
          if (onPromptChange) onPromptChange(currentInput);
          aiResponse = await aiService.analyzePrompt(currentInput);
        } else {
          aiResponse = await aiService.generateChatResponse(currentInput, {
            textType,
            wordCount: metrics.wordCount,
            currentContent: content
          });
        }
      } else {
        // Fallback responses when AI is not configured
        const fallbackResponses = [
          "That's a great question! 🤔 Try thinking about what your main character wants and what's stopping them from getting it.",
          "I love your curiosity! 💡 Remember to use descriptive words that help readers picture what's happening in your story.",
          "Keep going - you're doing amazing! ✨ Try adding some dialogue to make your characters come alive.",
          "Great thinking! 🌟 Consider showing your character's emotions through their actions and thoughts."
        ];
        aiResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
      }
      
      const aiMessage: ChatMessage = {
        id: `ai_${Date.now()}`,
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date(),
        type: 'suggestion'
      };
      
      setChatMessages(prev => [...prev, aiMessage]);
      
    } catch (error) {
      console.error('Chat error:', error);
      
      const errorMessage: ChatMessage = {
        id: `ai_error_${Date.now()}`,
        text: "I'm having a little trouble right now, but I believe in you! 💪 Keep writing and let your creativity shine!",
        sender: 'ai',
        timestamp: new Date(),
        type: 'encouragement'
      };
      
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };
  
  // Text-to-speech functionality
  const handleTextToSpeech = () => {
    if (!speechSynthesis) return;
    
    if (isPlaying) {
      speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      const textToRead = content.trim() || "Start writing your amazing story here!";
      const utterance = new SpeechSynthesisUtterance(textToRead);
      
      // Use female voice if available
      const voices = speechSynthesis.getVoices();
      const femaleVoice = voices.find(voice => 
        voice.name.toLowerCase().includes('female') || 
        voice.name.toLowerCase().includes('woman') ||
        voice.name.toLowerCase().includes('samantha') ||
        voice.name.toLowerCase().includes('karen')
      );
      
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }
      
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      
      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      
      speechSynthesis.speak(utterance);
    }
  };
  
  // Format time display
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Get writing tips based on text type
  const getWritingTips = () => {
    const tips = {
      narrative: [
        "🎬 Start with an exciting hook to grab your reader's attention",
        "👥 Create interesting characters that readers can connect with",
        "🌟 Use vivid descriptions to help readers picture the scene",
        "💭 Show your character's thoughts and feelings",
        "🎯 Make sure your story has a clear beginning, middle, and end"
      ],
      persuasive: [
        "💪 Start with a strong opinion statement",
        "📊 Use facts and examples to support your argument",
        "🎯 Think about what your reader might disagree with",
        "🔗 Connect your ideas with linking words",
        "✨ End with a powerful conclusion"
      ],
      descriptive: [
        "👁️ Use your five senses to describe things",
        "🎨 Choose specific, colorful adjectives",
        "📸 Help readers create a picture in their mind",
        "🌈 Compare things using similes and metaphors",
        "📝 Organize your description from general to specific"
      ],
      expository: [
        "📚 Start by introducing your topic clearly",
        "🔢 Organize your information in logical order",
        "💡 Use examples to explain difficult concepts",
        "🔗 Connect your paragraphs with transition words",
        "📋 Summarize your main points at the end"
      ]
    };
    
    return tips[textType as keyof typeof tips] || tips.narrative;
  };
  
  // Component styles based on theme
  const containerClass = `min-h-screen transition-colors duration-300 ${
    darkMode 
      ? 'bg-gray-900 text-white' 
      : 'bg-gradient-to-br from-purple-50 to-indigo-100'
  }`;
  
  const cardClass = `rounded-lg shadow-lg p-6 transition-colors duration-300 ${
    darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'
  }`;
  
  return (
    <div className={containerClass}>
      <div className={`container mx-auto px-4 py-6 ${isFullscreen ? 'max-w-none' : 'max-w-7xl'}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <select 
              value={textType} 
              onChange={(e) => setTextType(e.target.value)}
              className={`px-4 py-2 rounded-lg border ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'border-purple-200 bg-white'
              }`}
            >
              <option value="narrative">Narrative</option>
              <option value="persuasive">Persuasive</option>
              <option value="descriptive">Descriptive</option>
              <option value="expository">Expository</option>
            </select>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                  isTimerRunning 
                    ? 'bg-green-500 hover:bg-green-600' 
                    : 'bg-blue-500 hover:bg-blue-600'
                } text-white transition-colors`}
              >
                {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{formatTime(timeSpent)}</span>
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* AI Status Indicator */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                aiFeedback.isConfigured ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                AI {aiFeedback.isConfigured ? 'Connected' : 'Offline'}
              </span>
            </div>
            
            {/* Settings */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="Toggle dark mode"
            >
              {darkMode ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
            
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="Toggle fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
        
        {/* AI Status Warning */}
        {!aiFeedback.isConfigured && (
          <div className={`rounded-lg p-4 mb-6 ${
            darkMode 
              ? 'bg-yellow-900 border border-yellow-700' 
              : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <div className="flex items-center">
              <Lightbulb className="w-5 h-5 text-yellow-600 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  AI Features Not Available
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  To enable automatic feedback and AI coaching, please configure your OpenAI API key in your environment variables (VITE_OPENAI_API_KEY).
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Writing Prompt */}
        {prompt && (
          <div className={`${cardClass} mb-6`}>
            <h2 className="text-xl font-bold mb-3 flex items-center">
              <Target className="w-5 h-5 mr-2 text-purple-600" />
              Your Writing Prompt
            </h2>
            <p className="text-gray-600 dark:text-gray-300">{prompt}</p>
          </div>
        )}
        
        {/* Main Content Grid */}
        <div className={`grid gap-6 ${isFullscreen ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'}`}>
          {/* Writing Area */}
          <div className={isFullscreen ? 'col-span-1' : 'lg:col-span-2'}>
            <div className={cardClass}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-purple-600" />
                  Your Writing Space
                </h2>
                
                <div className="flex items-center space-x-2">
                  {/* Text-to-Speech */}
                  <button
                    onClick={handleTextToSpeech}
                    className={`p-2 rounded-lg transition-colors ${
                      isPlaying 
                        ? 'bg-red-500 hover:bg-red-600 text-white' 
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                    title={isPlaying ? 'Stop reading' : 'Read aloud'}
                  >
                    {isPlaying ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  
                  {/* Font Size Controls */}
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setFontSize(Math.max(12, fontSize - 2))}
                      className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                      title="Decrease font size"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs px-2">{fontSize}px</span>
                    <button
                      onClick={() => setFontSize(Math.min(24, fontSize + 2))}
                      className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                      title="Increase font size"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
              
              <textarea
                ref={textareaRef}
                value={content}
                onChange={handleContentChange}
                placeholder="Start writing your amazing story here! Let your creativity flow and bring your ideas to life... ✨"
                className={`w-full h-96 p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'border-gray-200 bg-white'
                }`}
                style={{ fontSize: `${fontSize}px`, lineHeight: 1.6 }}
              />
              
              {/* Writing Statistics */}
              <div className="flex items-center justify-between mt-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center">
                    <BarChart3 className="w-4 h-4 mr-1" />
                    {metrics.wordCount} words
                  </span>
                  <span>{metrics.characterCount} characters</span>
                  <span>{metrics.paragraphCount} paragraphs</span>
                  <span>{metrics.readingTime} min read</span>
                  {aiFeedback.isGenerating && (
                    <div className="flex items-center space-x-1 text-purple-500">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>AI analyzing...</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-4">
                  <span className={`flex items-center ${
                    metrics.vocabularyLevel === 'advanced' ? 'text-green-600' :
                    metrics.vocabularyLevel === 'intermediate' ? 'text-yellow-600' : 'text-blue-600'
                  }`}>
                    <Award className="w-4 h-4 mr-1" />
                    {metrics.vocabularyLevel} vocabulary
                  </span>
                  
                  {isAutoSaving && (
                    <span className="text-blue-500 flex items-center">
                      <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                      Saving...
                    </span>
                  )}
                  
                  {lastSaved && !isAutoSaving && (
                    <span className="text-green-600 flex items-center">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Saved {lastSaved.toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Sidebar */}
          {!isFullscreen && (
            <div className="space-y-6">
              {/* AI Writing Coach */}
              <div className={cardClass}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold flex items-center">
                    <Bot className="w-5 h-5 mr-2 text-purple-600" />
                    AI Writing Coach
                  </h3>
                  
                  <div className="flex space-x-1">
                    <button
                      onClick={() => setActiveTab('coach')}
                      className={`px-3 py-1 rounded text-xs ${
                        activeTab === 'coach' 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      Chat
                    </button>
                    <button
                      onClick={() => setActiveTab('progress')}
                      className={`px-3 py-1 rounded text-xs ${
                        activeTab === 'progress' 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      Progress
                    </button>
                    <button
                      onClick={() => setActiveTab('tips')}
                      className={`px-3 py-1 rounded text-xs ${
                        activeTab === 'tips' 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      Tips
                    </button>
                  </div>
                </div>
                
                {/* Chat Tab */}
                {activeTab === 'coach' && (
                  <div>
                    <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                      {chatMessages.map(message => (
                        <div key={message.id} className="space-y-1">
                          {message.isAutomatic && (
                            <div className="text-center">
                              <span className="text-xs text-purple-300 bg-purple-800 px-2 py-1 rounded-full">
                                ✨ Auto Feedback - Paragraph {message.paragraphNumber}
                              </span>
                            </div>
                          )}
                          
                          <div className={`p-3 rounded-lg text-sm ${
                            message.sender === 'user' 
                              ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 ml-4' 
                              : message.isAutomatic
                                ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 mr-4 border-l-4 border-purple-500'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 mr-4'
                          }`}>
                            <div className="flex items-start space-x-2">
                              {message.sender === 'ai' && (
                                <Bot className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              )}
                              {message.sender === 'user' && (
                                <User className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              )}
                              <span>{message.text}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {isChatLoading && (
                        <div className="flex items-center space-x-2 text-purple-500 text-sm">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>AI is thinking...</span>
                        </div>
                      )}
                      
                      <div ref={chatEndRef} />
                    </div>
                    
                    <form onSubmit={handleChatSubmit} className="flex space-x-2">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder={aiFeedback.isConfigured ? "Ask your AI coach anything..." : "AI chat unavailable"}
                        className={`flex-1 px-3 py-2 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-purple-500 ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'border-gray-200 bg-white'
                        } disabled:opacity-50`}
                        disabled={!aiFeedback.isConfigured || isChatLoading}
                      />
                      <button
                        type="submit"
                        disabled={!aiFeedback.isConfigured || isChatLoading || !chatInput.trim()}
                        className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                )}
                
                {/* Progress Tab */}
                {activeTab === 'progress' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {metrics.wordCount}
                        </div>
                        <div className="text-blue-600 dark:text-blue-400">Words</div>
                      </div>
                      
                      <div className="text-center p-3 bg-green-50 dark:bg-green-900 rounded-lg">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {formatTime(timeSpent)}
                        </div>
                        <div className="text-green-600 dark:text-green-400">Time</div>
                      </div>
                      
                      <div className="text-center p-3 bg-purple-50 dark:bg-purple-900 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {aiFeedback.feedbackHistory.length}
                        </div>
                        <div className="text-purple-600 dark:text-purple-400">AI Tips</div>
                      </div>
                      
                      <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                          {metrics.paragraphCount}
                        </div>
                        <div className="text-yellow-600 dark:text-yellow-400">Paragraphs</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Average words per sentence:</span>
                        <span className="font-medium">{metrics.averageWordsPerSentence}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Vocabulary level:</span>
                        <span className={`font-medium capitalize ${
                          metrics.vocabularyLevel === 'advanced' ? 'text-green-600' :
                          metrics.vocabularyLevel === 'intermediate' ? 'text-yellow-600' : 'text-blue-600'
                        }`}>
                          {metrics.vocabularyLevel}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Reading time:</span>
                        <span className="font-medium">{metrics.readingTime} minutes</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Tips Tab */}
                {activeTab === 'tips' && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-purple-600 dark:text-purple-400 mb-3">
                      {textType.charAt(0).toUpperCase() + textType.slice(1)} Writing Tips
                    </h4>
                    {getWritingTips().map((tip, index) => (
                      <div key={index} className="flex items-start space-x-2 text-sm">
                        <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImprovedWritingArea;
