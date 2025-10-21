// src/components/CoachProvider.tsx - ENHANCED VERSION WITH FEEDBACK ROTATION AND MEMORY
// Implements contextual memory and varied feedback to prevent repetition

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Sparkles, ChevronDown, ChevronUp, ThumbsUp, Lightbulb, HelpCircle, Target, AlertCircle, Star, Zap, Gift, Heart, X, Send, User, RefreshCw, Bot, Loader } from 'lucide-react';
import { generateChatResponse, checkOpenAIConnectionStatus } from '../lib/openai';
import AIErrorHandler from '../utils/errorHandling';
import { promptConfig } from '../config/prompts';
import { eventBus } from '../lib/eventBus';
import { detectWordThreshold, splitParas } from '../lib/paragraphDetection';

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isTyping?: boolean;
  isFeedback?: boolean;
}

interface AIStatus {
  connected: boolean;
  loading: boolean;
  lastChecked: Date | null;
}

interface FeedbackMemory {
  givenFeedback: string[];
  focusAreas: string[];
  lastFeedbackType: string;
  contentAnalysis: {
    hasDialogue: boolean;
    hasDescription: boolean;
    hasCharacterDevelopment: boolean;
    hasConflict: boolean;
    sentenceVariety: 'simple' | 'mixed' | 'complex';
    vocabularyLevel: 'basic' | 'intermediate' | 'advanced';
  };
}

interface CoachProviderProps {
  content?: string;
  onContentChange?: (content: string) => void;
}

export function CoachProvider({ content = '', onContentChange }: CoachProviderProps = {}) {
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isAITyping, setIsAITyping] = useState(false);
  const [aiStatus, setAIStatus] = useState<AIStatus>({
    connected: false,
    loading: true,
    lastChecked: null
  });

  // UI state
  const [showQuickQuestions, setShowQuickQuestions] = useState(true);

  const [lastFeedbackTime, setLastFeedbackTime] = useState<number>(0);
  const [feedbackCount, setFeedbackCount] = useState<number>(0);

  // ENHANCED: Feedback memory system
  const [feedbackMemory, setFeedbackMemory] = useState<FeedbackMemory>({
    givenFeedback: [],
    focusAreas: [],
    lastFeedbackType: '',
    contentAnalysis: {
      hasDialogue: false,
      hasDescription: false,
      hasCharacterDevelopment: false,
      hasConflict: false,
      sentenceVariety: 'simple',
      vocabularyLevel: 'basic'
    }
  });

  // Direct content monitoring
  const [previousContent, setPreviousContent] = useState<string>('');
  const [lastChangeTime, setLastChangeTime] = useState<number>(Date.now());

  // Refs
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const contentMonitorRef = useRef<string>('');

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: ChatMessage = {
      id: 'welcome-' + Date.now(),
      text: "Hi! I'm your AI Writing Mate! 🤖 I'm here to help you write amazing stories. Ask me anything about writing, or just start typing and I'll give you feedback!",
      isUser: false,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, []);

  // Check AI connection status on mount
  useEffect(() => {
    checkAIConnection();
  }, []);

  // ENHANCED: Content monitoring with memory updates
  useEffect(() => {
    const safeContent = content || '';
    const safePreviousContent = contentMonitorRef.current || '';
    
    if (safeContent !== safePreviousContent) {
      contentMonitorRef.current = safeContent;
      setPreviousContent(safePreviousContent);
      setLastChangeTime(Date.now());

      // Update content analysis
      updateContentAnalysis(safeContent);

      // Trigger feedback analysis with memory
      analyzeFeedbackTrigger(safePreviousContent, safeContent);
    }
  }, [content]);

  const checkAIConnection = async () => {
    setAIStatus(prev => ({ ...prev, loading: true }));
    try {
      const isConnected = await checkOpenAIConnectionStatus();
      setAIStatus({
        connected: isConnected,
        loading: false,
        lastChecked: new Date()
      });
    } catch (error) {
      console.error('Failed to check AI connection:', error);
      setAIStatus({
        connected: false,
        loading: false,
        lastChecked: new Date()
      });
    }
  };

  // ENHANCED: Analyze content for various elements
  const updateContentAnalysis = (text: string) => {
    const safeText = text || '';
    
    setFeedbackMemory(prev => ({
      ...prev,
      contentAnalysis: {
        hasDialogue: /["'].*?["']|".*?"|'.*?'/.test(safeText),
        hasDescription: /\b(beautiful|dark|bright|cold|warm|soft|rough|smooth|loud|quiet|sweet|bitter)\b/i.test(safeText),
        hasCharacterDevelopment: /\b(felt|thought|realized|wondered|decided|remembered)\b/i.test(safeText),
        hasConflict: /\b(but|however|suddenly|unfortunately|problem|trouble|danger|afraid|worried)\b/i.test(safeText),
        sentenceVariety: analyzeSentenceVariety(safeText),
        vocabularyLevel: analyzeVocabularyLevel(safeText)
      }
    }));
  };

  const analyzeSentenceVariety = (text: string): 'simple' | 'mixed' | 'complex' => {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length < 3) return 'simple';
    
    const complexSentences = sentences.filter(s => 
      s.includes(',') || s.includes(';') || /\b(because|although|while|when|if|since)\b/i.test(s)
    );
    
    const ratio = complexSentences.length / sentences.length;
    if (ratio > 0.6) return 'complex';
    if (ratio > 0.3) return 'mixed';
    return 'simple';
  };

  const analyzeVocabularyLevel = (text: string): 'basic' | 'intermediate' | 'advanced' => {
    const words = text.toLowerCase().split(/\s+/);
    const advancedWords = words.filter(word => 
      word.length > 7 || /\b(magnificent|extraordinary|mysterious|fascinating|tremendous)\b/.test(word)
    );
    
    const ratio = advancedWords.length / words.length;
    if (ratio > 0.15) return 'advanced';
    if (ratio > 0.08) return 'intermediate';
    return 'basic';
  };

  // ENHANCED: Contextual coach tip with memory
  const coachTip = async (paragraph: string, feedbackType: string) => {
    try {
      if (!paragraph || typeof paragraph !== 'string' || paragraph.trim().length === 0) {
        throw new Error('Invalid paragraph provided');
      }

      // Get contextual feedback based on memory and analysis
      const contextualFeedback = getContextualFeedback(paragraph, feedbackType);
      
      const response = await generateChatResponse({
        userMessage: `${contextualFeedback.prompt}: "${paragraph}". ${contextualFeedback.instruction}`,
        textType: 'narrative',
        currentContent: paragraph,
        wordCount: paragraph.trim().split(/\s+/).length,
        context: JSON.stringify({ 
          type: 'coach_tip',
          feedbackType: feedbackType,
          previousFeedback: feedbackMemory.givenFeedback.slice(-3),
          contentAnalysis: feedbackMemory.contentAnalysis
        })
      });
      
      // Update memory
      setFeedbackMemory(prev => ({
        ...prev,
        givenFeedback: [...prev.givenFeedback, contextualFeedback.type].slice(-10), // Keep last 10
        lastFeedbackType: contextualFeedback.type,
        focusAreas: [...new Set([...prev.focusAreas, contextualFeedback.type])].slice(-5) // Keep last 5 unique areas
      }));
      
      return { tip: response };
    } catch (error) {
      console.error('Coach tip error:', error);
      throw error;
    }
  };

  // ENHANCED: Get contextual feedback based on content analysis and memory
  const getContextualFeedback = (text: string, trigger: string) => {
    const { contentAnalysis, givenFeedback, lastFeedbackType } = feedbackMemory;
    
    // Avoid repeating the same type of feedback
    const availableFeedbackTypes = [
      {
        type: 'sensory_details',
        prompt: 'Analyze this paragraph for sensory details',
        instruction: 'Suggest specific sensory details (sight, sound, smell, touch, taste) that could be added. Keep it under 50 words and be encouraging.',
        condition: () => !contentAnalysis.hasDescription && !givenFeedback.includes('sensory_details')
      },
      {
        type: 'dialogue',
        prompt: 'Analyze this paragraph for dialogue opportunities',
        instruction: 'Suggest where dialogue could be added to bring characters to life. Keep it under 50 words and be encouraging.',
        condition: () => !contentAnalysis.hasDialogue && !givenFeedback.includes('dialogue')
      },
      {
        type: 'character_emotions',
        prompt: 'Analyze this paragraph for character development',
        instruction: 'Suggest how to show character emotions or thoughts more effectively. Keep it under 50 words and be encouraging.',
        condition: () => !contentAnalysis.hasCharacterDevelopment && !givenFeedback.includes('character_emotions')
      },
      {
        type: 'sentence_variety',
        prompt: 'Analyze this paragraph for sentence structure',
        instruction: 'Suggest ways to vary sentence length and structure for better flow. Keep it under 50 words and be encouraging.',
        condition: () => contentAnalysis.sentenceVariety === 'simple' && !givenFeedback.includes('sentence_variety')
      },
      {
        type: 'vocabulary_enhancement',
        prompt: 'Analyze this paragraph for vocabulary improvements',
        instruction: 'Suggest more vivid or specific words to replace common ones. Keep it under 50 words and be encouraging.',
        condition: () => contentAnalysis.vocabularyLevel === 'basic' && !givenFeedback.includes('vocabulary_enhancement')
      },
      {
        type: 'conflict_tension',
        prompt: 'Analyze this paragraph for story tension',
        instruction: 'Suggest ways to add tension, conflict, or suspense to make the story more engaging. Keep it under 50 words and be encouraging.',
        condition: () => !contentAnalysis.hasConflict && !givenFeedback.includes('conflict_tension')
      },
      {
        type: 'pacing',
        prompt: 'Analyze this paragraph for pacing',
        instruction: 'Suggest how to improve the pacing - whether to slow down for important moments or speed up action. Keep it under 50 words and be encouraging.',
        condition: () => !givenFeedback.includes('pacing')
      },
      {
        type: 'setting_details',
        prompt: 'Analyze this paragraph for setting description',
        instruction: 'Suggest specific details about the setting that would help readers visualize the scene better. Keep it under 50 words and be encouraging.',
        condition: () => !givenFeedback.includes('setting_details')
      }
    ];

    // Filter available feedback types based on conditions
    const validFeedbackTypes = availableFeedbackTypes.filter(fb => fb.condition());
    
    // If we have valid options, use them; otherwise, use a general feedback
    if (validFeedbackTypes.length > 0) {
      // Rotate through different types, avoiding the last one used
      const filteredTypes = validFeedbackTypes.filter(fb => fb.type !== lastFeedbackType);
      const selectedType = filteredTypes.length > 0 ? filteredTypes[0] : validFeedbackTypes[0];
      return selectedType;
    }

    // Fallback to general feedback
    return {
      type: 'general_encouragement',
      prompt: 'Provide encouraging feedback on this paragraph',
      instruction: 'Give specific, positive feedback about what the student is doing well and one small suggestion for improvement. Keep it under 50 words and be encouraging.'
    };
  };

  // ENHANCED: Analyze content changes with memory-aware feedback
  const analyzeFeedbackTrigger = async (prevContent: string, newContent: string) => {
    try {
      const safePrevContent = prevContent || '';
      const safeNewContent = newContent || '';
      
      if (!safeNewContent || safeNewContent.trim().length === 0) {
        return;
      }

      const wordCount = safeNewContent.trim().split(/\s+/).filter(word => word.length > 0).length;
      if (wordCount < 15) {
        return;
      }

      // Prevent too frequent feedback
      const now = Date.now();
      if (now - lastFeedbackTime < 8000) {
        return;
      }

      // Check for word threshold triggers
      const thresholdResult = detectWordThreshold(safePrevContent, safeNewContent, 20);
      if (thresholdResult) {
        await provideFeedback(thresholdResult.text, 'word_threshold');
        return;
      }

      // Check for new paragraphs
      const prevParas = splitParas(safePrevContent);
      const newParas = splitParas(safeNewContent);
      
      if (newParas.length > prevParas.length) {
        const completedParagraph = newParas[newParas.length - 2];
        if (completedParagraph && completedParagraph.trim().split(/\s+/).length >= 20) {
          await provideFeedback(completedParagraph, 'paragraph_completed');
          return;
        }
      }

      // Check for significant content addition
      const prevWords = safePrevContent.trim() ? safePrevContent.trim().split(/\s+/).length : 0;
      const newWords = safeNewContent.trim() ? safeNewContent.trim().split(/\s+/).length : 0;
      const wordDifference = newWords - prevWords;

      if (wordDifference >= 30 && newWords >= 50) {
        const currentParagraph = newParas[newParas.length - 1] || safeNewContent.slice(-200);
        await provideFeedback(currentParagraph, 'progress_milestone');
      }

    } catch (error) {
      console.error("Content analysis error:", error);
    }
  };

  // ENHANCED: Provide contextual feedback with memory
  const provideFeedback = async (text: string, trigger: string) => {
    try {
      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return;
      }

      setIsAITyping(true);
      setLastFeedbackTime(Date.now());

      const typingMessage: ChatMessage = {
        id: 'typing-' + Date.now(),
        text: '🤖 Reading your writing...',
        isUser: false,
        timestamp: new Date(),
        isTyping: true,
        isFeedback: true
      };
      setMessages(prev => [...prev, typingMessage]);

      try {
        const res = await coachTip(text, trigger);
        
        setMessages(prev => {
          const withoutTyping = prev.filter(msg => !msg.isTyping);
          return [...withoutTyping, {
            id: 'coach-' + Date.now(),
            text: `✨ ${res.tip || getVariedFallbackTip(text, feedbackCount)}`,
            isUser: false,
            timestamp: new Date(),
            isFeedback: true
          }];
        });

        setFeedbackCount(prev => prev + 1);
      } catch (error) {
        setMessages(prev => {
          const withoutTyping = prev.filter(msg => !msg.isTyping);
          return [...withoutTyping, {
            id: 'fallback-' + Date.now(),
            text: `✨ ${getVariedFallbackTip(text, feedbackCount)}`,
            isUser: false,
            timestamp: new Date(),
            isFeedback: true
          }];
        });

        setFeedbackCount(prev => prev + 1);
      }
    } catch (error) {
      console.error("Provide feedback error:", error);
    } finally {
      setIsAITyping(false);
    }
  };

  // ENHANCED: Varied fallback tips with memory awareness
  const getVariedFallbackTip = (text: string, count: number): string => {
    const { contentAnalysis, givenFeedback } = feedbackMemory;
    
    // Context-aware fallback tips
    const contextualTips = [];
    
    if (!contentAnalysis.hasDialogue && !givenFeedback.includes('dialogue')) {
      contextualTips.push("Great progress! Try adding some dialogue to bring your characters to life. What might they say in this moment? 💬");
    }
    
    if (!contentAnalysis.hasDescription && !givenFeedback.includes('sensory_details')) {
      contextualTips.push("Nice work! Consider adding sensory details - what can your character see, hear, or smell? This helps readers feel like they're there! 👃");
    }
    
    if (contentAnalysis.sentenceVariety === 'simple' && !givenFeedback.includes('sentence_variety')) {
      contextualTips.push("You're doing well! Try mixing short and long sentences to create better rhythm in your writing. 🎵");
    }
    
    if (!contentAnalysis.hasCharacterDevelopment && !givenFeedback.includes('character_emotions')) {
      contextualTips.push("Good writing! Show us how your character feels through their actions and thoughts, not just by telling us. 😊");
    }
    
    if (contentAnalysis.vocabularyLevel === 'basic' && !givenFeedback.includes('vocabulary_enhancement')) {
      contextualTips.push("Keep going! Try using more specific words instead of general ones - like 'whispered' instead of 'said'. 🎯");
    }
    
    if (!contentAnalysis.hasConflict && !givenFeedback.includes('conflict_tension')) {
      contextualTips.push("Excellent! Consider adding a small challenge or surprise to keep your readers curious about what happens next. 🎣");
    }

    // If we have contextual tips, use them
    if (contextualTips.length > 0) {
      return contextualTips[count % contextualTips.length];
    }

    // General fallback tips
    const generalTips = [
      "Great progress! Your story is developing nicely. Keep building on what you've written! 🌟",
      "Well done! Each sentence adds to your story. What exciting thing will happen next? ⚡",
      "Nice work! Your writing is getting stronger with each paragraph. Keep it up! 💪",
      "Excellent! You're creating a vivid world for your readers. Continue painting that picture! 🎨"
    ];
    
    return generalTips[count % generalTips.length];
  };

  // Handle sending messages (unchanged from original)
  const handleSendMessage = async () => {
    const message = inputMessage.trim();
    if (!message) return;

    const userMessage: ChatMessage = {
      id: 'user-' + Date.now(),
      text: message,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsAITyping(true);

    const typingMessage: ChatMessage = {
      id: 'typing-' + Date.now(),
      text: '🤖 Thinking...',
      isUser: false,
      timestamp: new Date(),
      isTyping: true
    };
    setMessages(prev => [...prev, typingMessage]);

    try {
      const safeContent = content || '';
      const wordCount = safeContent.trim() ? safeContent.trim().split(/\s+/).filter(word => word.length > 0).length : 0;
      
      const response = await generateChatResponse({
        userMessage: message,
        textType: 'narrative',
        currentContent: safeContent,
        wordCount: wordCount,
        context: JSON.stringify({ 
          conversationHistory: messages.slice(-4).map(m => ({ text: m.text, isUser: m.isUser })),
          writingStage: wordCount < 50 ? 'beginning' : wordCount < 150 ? 'developing' : 'expanding',
          contentAnalysis: feedbackMemory.contentAnalysis,
          previousFeedback: feedbackMemory.givenFeedback.slice(-3)
        })
      });

      setMessages(prev => {
        const withoutTyping = prev.filter(msg => !msg.isTyping);
        return [...withoutTyping, {
          id: 'ai-' + Date.now(),
          text: response,
          isUser: false,
          timestamp: new Date()
        }];
      });

    } catch (error) {
      console.error('Failed to get AI response:', error);
      
      setMessages(prev => {
        const withoutTyping = prev.filter(msg => !msg.isTyping);
        return [...withoutTyping, {
          id: 'error-' + Date.now(),
          text: "I'm having trouble right now, but I'm here to help! Can you try asking your question again? 😊",
          isUser: false,
          timestamp: new Date()
        }];
      });
    } finally {
      setIsAITyping(false);
    }
  };

  // Event bus listener (unchanged from original)
  useEffect(() => {
    const handleParagraphReady = (event: any) => {
      if (event && event.text && typeof event.text === 'string') {
        provideFeedback(event.text, event.trigger || 'paragraph_ready');
      }
    };

    eventBus.on('paragraph.ready', handleParagraphReady);
    return () => eventBus.off('paragraph.ready', handleParagraphReady);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const quickQuestions = [
    "How can I improve my introduction?",
    "What's a good synonym for 'said'?",
    "Help me with my conclusion",
    "How do I make my characters more interesting?",
    "What makes a good story hook?"
  ];

  return (
    <div className="h-full flex flex-col bg-white rounded-lg">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 flex items-center">
            <MessageSquare className="w-4 h-4 mr-2 text-purple-600" />
            Writing Mate Chat
          </h3>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${aiStatus.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-xs text-gray-500">
              {aiStatus.loading ? 'Checking...' : aiStatus.connected ? 'Online' : 'Offline'}
            </span>
            <button
              onClick={checkAIConnection}
              className="p-1 hover:bg-gray-100 rounded"
              disabled={aiStatus.loading}
            >
              <RefreshCw className={`w-3 h-3 text-gray-400 ${aiStatus.loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
        {/* ENHANCED: Memory status indicator */}
        <div className="mt-2 text-xs text-gray-500">
          Focus areas: {feedbackMemory.focusAreas.join(', ') || 'Getting to know your writing...'}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.isUser
                  ? 'bg-purple-600 text-white'
                  : message.isFeedback
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <div className="flex items-start space-x-2">
                {!message.isUser && (
                  <div className="flex-shrink-0">
                    {message.isTyping ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : message.isFeedback ? (
                      <Sparkles className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Quick Questions */}
      {showQuickQuestions && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-600">Quick questions to get started:</span>
            <button
              onClick={() => setShowQuickQuestions(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => setInputMessage(question)}
                className="text-xs px-3 py-1 bg-white border border-gray-200 rounded-full hover:bg-purple-50 hover:border-purple-200 transition-colors"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask me anything about writing..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            disabled={isAITyping}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isAITyping}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Feedback given: {feedbackCount} • Words: {content ? content.trim().split(/\s+/).filter(word => word.length > 0).length : 0} • Last: {lastChangeTime ? new Date(lastChangeTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
        </div>
      </div>
    </div>
  );
}