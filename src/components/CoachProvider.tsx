import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Sparkles, ChevronDown, ChevronUp, ThumbsUp, Lightbulb, HelpCircle, Target, AlertCircle, Star, Zap, Gift, Heart, X, Send, User, RefreshCw, Bot, Loader } from 'lucide-react';
import { generateChatResponse, checkOpenAIConnectionStatus } from '../lib/openai';
import AIErrorHandler from '../utils/errorHandling';
import { promptConfig } from '../config/prompts';
import { eventBus } from '../lib/eventBus';

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isTyping?: boolean;
}

interface AIStatus {
  connected: boolean;
  loading: boolean;
  lastChecked: Date | null;
}

export function CoachProvider() {
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

  // Refs
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check AI connection status on mount
  useEffect(() => {
    checkAIConnection();
  }, []);

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

  const coachTip = async (paragraph: string) => {
    try {
      const response = await generateChatResponse(
        `Please provide a brief, encouraging writing tip for this paragraph: "${paragraph}". Keep it under 50 words and focus on one specific improvement.`,
        'coach'
      );
      return { tip: response };
    } catch (error) {
      console.error('Coach tip error:', error);
      throw error;
    }
  };

  // Enhanced useEffect for paragraph completion with improved feedback handling
  useEffect(() => {
    const handler = async (p: { 
      paragraph: string; 
      index: number; 
      wordCount?: number; 
      trigger?: string;
    }) => {
      try {
        if (!p.paragraph || typeof p.paragraph !== 'string' || p.paragraph.trim().length === 0) {
          return;
        }

        // More responsive feedback - trigger for shorter content too
        const wordCount = p.paragraph.trim().split(/\s+/).length;
        if (wordCount < 10) return;

        console.log("Coach received paragraph event:", p);

        setIsAITyping(true);

        // Add typing indicator with context-aware message
        const getTypingMessage = (trigger?: string) => {
          switch (trigger) {
            case 'dialogue_detected':
              return 'Writing Buddy noticed your dialogue...';
            case 'transition_detected':
              return 'Writing Buddy is analyzing your transitions...';
            case 'typing_pause':
              return 'Writing Buddy is reviewing your recent writing...';
            default:
              return 'Writing Buddy is analyzing your paragraph...';
          }
        };

        const typingMessage: ChatMessage = {
          id: 'typing-' + Date.now(),
          text: getTypingMessage(p.trigger),
          isUser: false,
          timestamp: new Date(),
          isTyping: true
        };
        setMessages(prev => [...prev, typingMessage]);

        try {
          const res = await coachTip(p.paragraph);
          
          // Remove typing indicator and add real response
          setMessages(prev => {
            const withoutTyping = prev.filter(msg => !msg.isTyping);
            return [...withoutTyping, {
              id: 'coach-' + Date.now(),
              text: res.tip || getContextualFallbackTip(p.paragraph, p.trigger),
              isUser: false,
              timestamp: new Date()
            }];
          });

          // Hide quick questions after first interaction
          setShowQuickQuestions(false);

        } catch (error) {
          console.error("Coach tip failed:", error);
          
          // Remove typing indicator and add fallback response
          setMessages(prev => {
            const withoutTyping = prev.filter(msg => !msg.isTyping);
            return [...withoutTyping, {
              id: 'coach-' + Date.now(),
              text: getContextualFallbackTip(p.paragraph, p.trigger),
              isUser: false,
              timestamp: new Date()
            }];
          });
        }

      } catch (error) {
        console.error("Paragraph handler error:", error);
      } finally {
        setIsAITyping(false);
      }
    };
    
    eventBus.on("paragraph.ready", handler);
    return () => eventBus.off("paragraph.ready", handler);
  }, []);

  // Contextual fallback tip function
  const getContextualFallbackTip = (paragraph: string, trigger?: string): string => {
    const text = paragraph.toLowerCase();
    
    // Context-specific tips based on trigger
    if (trigger === 'dialogue_detected') {
      return "Great dialogue! 💬 Try using different dialogue tags like 'whispered', 'exclaimed', or 'declared' instead of 'said'. This makes your characters more expressive!";
    }
    
    if (trigger === 'transition_detected') {
      return "Nice use of transition words! ⭐ They help your story flow smoothly. Try adding more sensory details to make the scene come alive!";
    }
    
    if (trigger === 'typing_pause') {
      return "You're making great progress! ✨ Consider adding more descriptive details about what your characters see, hear, or feel to paint a vivid picture!";
    }
    
    // Existing fallback logic
    if (text.includes('said') && text.split('said').length > 2) {
      return "Great dialogue! Try using different words instead of 'said' - like whispered, exclaimed, or declared. This makes your characters more expressive! 💬";
    } else if (text.includes('"') || text.includes("'")) {
      return "I love that you're using dialogue! It brings your characters to life. Remember to start a new paragraph when a different character speaks. 🎭";
    } else if (text.includes('then') || text.includes('next') || text.includes('after')) {
      return "Nice use of transition words! They help your story flow smoothly from one event to the next. Keep building that narrative! ⭐";
    } else if (paragraph.split(/[.!?]+/).length >= 3) {
      return "Good paragraph structure! You're using multiple sentences to develop your ideas. Try adding more descriptive details to paint a vivid picture! 🎨";
    } else {
      return "Keep writing! You're doing great. Try adding more details about what your characters see, hear, or feel to make your story come alive! ✨";
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isAITyping) return;

    const userMessage: ChatMessage = {
      id: 'user-' + Date.now(),
      text: inputMessage,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsAITyping(true);

    // Add typing indicator
    const typingMessage: ChatMessage = {
      id: 'typing-' + Date.now(),
      text: 'Writing Buddy is thinking...',
      isUser: false,
      timestamp: new Date(),
      isTyping: true
    };
    setMessages(prev => [...prev, typingMessage]);

    try {
      const response = await generateChatResponse(inputMessage, 'coach');
      
      // Remove typing indicator and add response
      setMessages(prev => {
        const withoutTyping = prev.filter(msg => !msg.isTyping);
        return [...withoutTyping, {
          id: 'coach-' + Date.now(),
          text: response,
          isUser: false,
          timestamp: new Date()
        }];
      });

    } catch (error) {
      console.error('Chat error:', error);
      
      // Remove typing indicator and add error message
      setMessages(prev => {
        const withoutTyping = prev.filter(msg => !msg.isTyping);
        return [...withoutTyping, {
          id: 'coach-' + Date.now(),
          text: "I'm having trouble connecting right now. Please try again in a moment!",
          isUser: false,
          timestamp: new Date()
        }];
      });
    } finally {
      setIsAITyping(false);
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="coach-provider bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Writing Buddy</h3>
          <div className={`w-2 h-2 rounded-full ${aiStatus.connected ? 'bg-green-500' : 'bg-red-500'}`} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <Bot className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Start writing and I'll provide helpful tips!</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.isUser
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              {message.isTyping && (
                <div className="flex items-center gap-2">
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>{message.text}</span>
                </div>
              )}
              {!message.isTyping && <p>{message.text}</p>}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask me anything about your writing..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isAITyping}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isAITyping}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
