// src/components/CoachProvider.tsx - FIXED VERSION
// Handles undefined values and provides better error handling

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

interface CoachProviderProps {
  content?: string; // Direct content prop for monitoring
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
      text: "Hi! I'm your AI Writing Buddy! 🤖 I'm here to help you write amazing stories. Ask me anything about writing, or just start typing and I'll give you feedback!",
      isUser: false,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, []);

  // Check AI connection status on mount
  useEffect(() => {
    checkAIConnection();
  }, []);

  // FIXED: Direct content monitoring effect with proper null checks
  useEffect(() => {
    const safeContent = content || '';
    const safePreviousContent = contentMonitorRef.current || '';
    
    if (safeContent !== safePreviousContent) {
      contentMonitorRef.current = safeContent;
      setPreviousContent(safePreviousContent);
      setLastChangeTime(Date.now());

      // Trigger feedback analysis with safe values
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

  // FIXED: Coach tip function with proper error handling
  const coachTip = async (paragraph: string) => {
    try {
      // Validate input
      if (!paragraph || typeof paragraph !== 'string' || paragraph.trim().length === 0) {
        throw new Error('Invalid paragraph provided');
      }

      const response = await generateChatResponse({
        userMessage: `Please provide a brief, encouraging writing tip for this paragraph: "${paragraph}". Keep it under 50 words and focus on one specific improvement.`,
        textType: 'narrative',
        currentContent: paragraph,
        wordCount: paragraph.trim().split(/\s+/).length,
        context: JSON.stringify({ type: 'coach_tip' })
      });
      
      return { tip: response };
    } catch (error) {
      console.error('Coach tip error:', error);
      throw error;
    }
  };

  // FIXED: Analyze content changes for feedback triggers with proper validation
  const analyzeFeedbackTrigger = async (prevContent: string, newContent: string) => {
    try {
      // Safely handle undefined/null values
      const safePrevContent = prevContent || '';
      const safeNewContent = newContent || '';
      
      if (!safeNewContent || safeNewContent.trim().length === 0) {
        console.log("No content to analyze");
        return;
      }

      const wordCount = safeNewContent.trim().split(/\s+/).filter(word => word.length > 0).length;
      if (wordCount < 15) {
        console.log("Content too short for feedback");
        return; // Minimum threshold
      }

      // Prevent too frequent feedback
      const now = Date.now();
      if (now - lastFeedbackTime < 8000) { // 8 second cooldown
        console.log("Skipping feedback due to cooldown");
        return;
      }

      // Check for word threshold triggers
      const thresholdResult = detectWordThreshold(safePrevContent, safeNewContent, 20);
      if (thresholdResult) {
        console.log("Word threshold trigger detected:", thresholdResult);
        await provideFeedback(thresholdResult.text, thresholdResult.trigger);
        return;
      }

      // Check for new paragraphs
      const prevParas = splitParas(safePrevContent);
      const newParas = splitParas(safeNewContent);
      
      if (newParas.length > prevParas.length) {
        // New paragraph created, provide feedback on the completed one
        const completedParagraph = newParas[newParas.length - 2];
        if (completedParagraph && completedParagraph.trim().split(/\s+/).length >= 20) {
          console.log("New paragraph detected:", completedParagraph);
          await provideFeedback(completedParagraph, 'paragraph_completed');
          return;
        }
      }

      // Check for significant content addition (every 30 words)
      const prevWords = safePrevContent.trim() ? safePrevContent.trim().split(/\s+/).length : 0;
      const newWords = safeNewContent.trim() ? safeNewContent.trim().split(/\s+/).length : 0;
      const wordDifference = newWords - prevWords;

      if (wordDifference >= 30 && newWords >= 50) {
        console.log("Significant content addition detected");
        const currentParagraph = newParas[newParas.length - 1] || safeNewContent.slice(-200);
        await provideFeedback(currentParagraph, 'progress_milestone');
      }

    } catch (error) {
      console.error("Content analysis error:", error);
    }
  };

  // FIXED: Provide feedback with proper validation
  const provideFeedback = async (text: string, trigger: string) => {
    try {
      // Validate input
      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        console.log("Invalid text provided for feedback");
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
        const res = await coachTip(text);
        
        // Remove typing indicator and add real response
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
        console.log("Coach tip failed:", error);
        
        // Remove typing indicator and add fallback response
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

  // FIXED: Get varied fallback tips with proper validation
  const getVariedFallbackTip = (text: string, count: number): string => {
    const safeText = text || '';
    const tips = [
      "Great progress! Try adding more descriptive details to paint a picture for your readers. 🎨",
      "Nice work! Consider adding dialogue to bring your characters to life. What might they say? 💬",
      "You're doing well! Think about using stronger verbs to make your action more exciting. ⚡",
      "Good writing! Try to show emotions through actions rather than just telling us how characters feel. 😊",
      "Keep going! Add some sensory details - what can your character see, hear, or smell? 👃",
      "Excellent! Consider varying your sentence lengths to create better rhythm in your writing. 🎵",
      "Well done! Think about adding a surprising detail that will hook your reader's attention. 🎣",
      "Great job! Try using more specific nouns instead of general ones to be more precise. 🎯"
    ];
    
    return tips[count % tips.length];
  };

  // FIXED: Handle sending messages with proper validation
  const handleSendMessage = async () => {
    const message = inputMessage.trim();
    if (!message) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: 'user-' + Date.now(),
      text: message,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsAITyping(true);

    // Add typing indicator
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
          writingStage: wordCount < 50 ? 'beginning' : wordCount < 150 ? 'developing' : 'expanding'
        })
      });

      // Remove typing indicator and add AI response
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
      
      // Remove typing indicator and add error message
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

  // FIXED: Event bus listener with proper validation
  useEffect(() => {
    const handleParagraphReady = (event: any) => {
      console.log("Event bus paragraph received:", event);
      
      // Safely handle the event
      if (event && event.text && typeof event.text === 'string') {
        provideFeedback(event.text, event.trigger || 'paragraph_ready');
      } else {
        console.log("Invalid paragraph event received:", event);
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
            Writing Buddy Chat
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