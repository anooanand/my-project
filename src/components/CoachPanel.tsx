import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Sparkles, ChevronDown, ChevronUp, ThumbsUp, Lightbulb, HelpCircle, Target, AlertCircle, Star, Zap, Gift, Heart, X, Send, User, RefreshCw, Bot, Loader } from 'lucide-react';
import { generateChatResponse, checkOpenAIConnectionStatus } from '../lib/openai';
import AIErrorHandler from '../utils/errorHandling';
import { promptConfig } from '../config/prompts';
import './improved-layout.css';

interface CoachPanelProps {
  content: string;
  textType: string;
  assistanceLevel: string;
}

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

export function CoachPanel({ content, textType, assistanceLevel }: CoachPanelProps) {
  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isAITyping, setIsAITyping] = useState(false);
  const [aiStatus, setAIStatus] = useState<AIStatus>({
    connected: false,
    loading: true,
    lastChecked: null
  });

  // UI state
  const [activeSection, setActiveSection] = useState<'chat' | 'suggestions' | 'feedback'>('chat');
  const [showQuickQuestions, setShowQuickQuestions] = useState(true);

  // Refs
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check AI connection status on mount
  useEffect(() => {
    checkAIConnection();
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Initialize with welcome message
  useEffect(() => {
    if (chatMessages.length === 0 && aiStatus.connected) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome-' + Date.now(),
        text: `Hi! I'm your AI Writing Buddy! 🤖 I'm here to help you with your ${textType} writing. Ask me anything about your story, or click one of the quick questions below to get started!`,
        isUser: false,
        timestamp: new Date()
      };
      setChatMessages([welcomeMessage]);
    }
  }, [aiStatus.connected, textType]);

  const checkAIConnection = async () => {
    setAIStatus(prev => ({ ...prev, loading: true }));
    try {
      const connected = await checkOpenAIConnectionStatus();
      setAIStatus({
        connected,
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

  const sendMessage = async () => {
    // ✅ REMOVED !aiStatus.connected check - this was blocking messages
    if (!inputMessage.trim() || isAITyping) return;

    const userMessage: ChatMessage = {
      id: 'user-' + Date.now(),
      text: inputMessage.trim(),
      isUser: true,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsAITyping(true);

    try {
      // Add typing indicator
      const typingMessage: ChatMessage = {
        id: 'typing-' + Date.now(),
        text: 'AI is thinking...',
        isUser: false,
        timestamp: new Date(),
        isTyping: true
      };
      setChatMessages(prev => [...prev, typingMessage]);

      // Get AI response with enhanced error handling
      let aiResponse;
      try {
        aiResponse = await generateChatResponse({
          userMessage: userMessage.text,
          textType,
          currentContent: content,
          wordCount: content.split(/\s+/).filter(word => word.length > 0).length,
          context: `Student is writing a ${textType} story. Current assistance level: ${assistanceLevel}.`
        });
      } catch (apiError) {
        console.error('OpenAI API Error:', apiError);
        // Use fallback response instead of failing
        aiResponse = getFallbackChatResponse(userMessage.text, textType);
      }

      // Remove typing indicator and add real response
      setChatMessages(prev => {
        const withoutTyping = prev.filter(msg => !msg.isTyping);
        const aiMessage: ChatMessage = {
          id: 'ai-' + Date.now(),
          text: aiResponse,
          isUser: false,
          timestamp: new Date()
        };
        return [...withoutTyping, aiMessage];
      });

    } catch (error) {
      console.error('Chat error:', error);
      
      // Remove typing indicator and show helpful error message
      setChatMessages(prev => {
        const withoutTyping = prev.filter(msg => !msg.isTyping);
        const errorMessage: ChatMessage = {
          id: 'error-' + Date.now(),
          text: "I'm having a small hiccup, but I'm still here to help! 😊 Try asking your question again, or I can give you some general writing tips!",
          isUser: false,
          timestamp: new Date()
        };
        return [...withoutTyping, errorMessage];
      });
    } finally {
      setIsAITyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const sendQuickQuestion = (question: string) => {
    setInputMessage(question);
    // Auto-send after a brief delay
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        sendMessage();
      }
    }, 100);
  };

  const quickQuestions = [
    "How can I improve my introduction?",
    "What's a good synonym for 'said'?",
    "Help me with my conclusion",
    "How can I make my writing more descriptive?",
    "What should happen next in my story?",
    "How can I show emotions better?"
  ];

  const getStatusColor = () => {
    if (aiStatus.loading) return 'text-yellow-500';
    return aiStatus.connected ? 'text-green-500' : 'text-red-500';
  };

  const getStatusText = () => {
    if (aiStatus.loading) return 'Connecting...';
    return aiStatus.connected ? 'AI Connected' : 'AI Disconnected';
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow-sm">
      {/* Header with AI Status */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <Bot className="w-5 h-5 mr-2 text-blue-600" />
            AI Writing Buddy
          </h3>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${aiStatus.connected ? 'bg-green-500' : 'bg-red-500'} ${aiStatus.loading ? 'animate-pulse' : ''}`}></div>
            <span className={`text-xs font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </span>
            <button
              onClick={checkAIConnection}
              className="p-1 hover:bg-gray-100 rounded"
              disabled={aiStatus.loading}
            >
              <RefreshCw className={`w-3 h-3 text-gray-500 ${aiStatus.loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveSection('chat')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeSection === 'chat'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <MessageSquare className="w-4 h-4 inline mr-1" />
            Chat
          </button>
          <button
            onClick={() => setActiveSection('suggestions')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeSection === 'suggestions'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Lightbulb className="w-4 h-4 inline mr-1" />
            Tips
          </button>
          <button
            onClick={() => setActiveSection('feedback')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeSection === 'feedback'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Star className="w-4 h-4 inline mr-1" />
            Feedback
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeSection === 'chat' && (
          <div className="h-full flex flex-col">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.isUser
                        ? 'bg-blue-600 text-white'
                        : message.isTyping
                        ? 'bg-gray-100 text-gray-600 animate-pulse'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {message.isTyping ? (
                      <div className="flex items-center space-x-1">
                        <Loader className="w-4 h-4 animate-spin" />
                        <span>{message.text}</span>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                    )}
                    <p className={`text-xs mt-1 ${message.isUser ? 'text-blue-100' : 'text-gray-500'}`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Questions */}
            {showQuickQuestions && chatMessages.length <= 1 && (
              <div className="p-4 border-t border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-700">Quick Questions:</h4>
                  <button
                    onClick={() => setShowQuickQuestions(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {quickQuestions.slice(0, 3).map((question, index) => (
                    <button
                      key={index}
                      onClick={() => sendQuickQuestion(question)}
                      className="text-left p-2 text-sm text-blue-600 hover:bg-blue-50 rounded border border-blue-200 transition-colors"
                      disabled={!aiStatus.connected}
                    >
                      💡 {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={aiStatus.connected ? "Ask your Writing Buddy anything..." : "AI is disconnected"}
                  className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={!aiStatus.connected || isAITyping}
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || !aiStatus.connected || isAITyping}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {isAITyping ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
              {!aiStatus.connected && (
                <p className="text-xs text-red-500 mt-1">
                  AI is currently unavailable. Please check your connection and try again.
                </p>
              )}
            </div>
          </div>
        )}

        {activeSection === 'suggestions' && (
          <div className="p-4">
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-800">Writing Tip</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Use descriptive language to paint a picture in your reader's mind. Instead of "The dog ran," try "The golden retriever bounded across the meadow."
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Target className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-800">Structure Focus</h4>
                    <p className="text-sm text-green-700 mt-1">
                      For {textType} writing, make sure you have a clear beginning, middle, and end. Your story should have a problem that gets resolved.
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Star className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-purple-800">NSW Selective Tip</h4>
                    <p className="text-sm text-purple-700 mt-1">
                      Show character emotions through actions and dialogue rather than just telling us how they feel.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'feedback' && (
          <div className="p-4">
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h4 className="font-medium text-gray-600 mb-2">Start Writing for Feedback</h4>
              <p className="text-sm text-gray-500 mb-4">
                Begin writing your story and I'll provide personalized feedback to help you improve!
              </p>
              <button
                onClick={() => setActiveSection('chat')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Chat with AI Buddy
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Add this helper function for fallback responses
function getFallbackChatResponse(userMessage: string, textType: string): string {
  const lowerMessage = userMessage.toLowerCase();
  
  if (lowerMessage.includes('introduction') || lowerMessage.includes('start')) {
    return `Great question about introductions! For ${textType} writing, try starting with dialogue, action, or an intriguing question. Hook your reader from the first sentence! 🎣`;
  } else if (lowerMessage.includes('conclusion') || lowerMessage.includes('end')) {
    return `For a strong conclusion, circle back to your opening theme and show how your character has grown or changed. Leave readers satisfied but thoughtful! ✨`;
  } else if (lowerMessage.includes('synonym') || lowerMessage.includes('word')) {
    return `Try these powerful alternatives: Instead of 'said' → whispered, exclaimed, declared. Instead of 'big' → enormous, massive, gigantic. Specific words make writing shine! 📚`;
  } else if (lowerMessage.includes('character')) {
    return `Show character emotions through actions and thoughts! Instead of 'he was sad', try 'his shoulders slumped as he stared at the ground.' Show, don't tell! 😊`;
  } else {
    return `That's a thoughtful question! Keep writing and let your creativity flow. Remember: every sentence should either advance the plot or develop character. You're doing great! 🌟`;
  }
}