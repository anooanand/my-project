import React, { useState, useEffect, useRef } from 'react';
import { User, RefreshCw, Sparkles, Wand, Star, Bot, MessageSquare, BarChart3, BookOpen, TrendingUp, Wifi, WifiOff, Send, Loader, ChevronDown, ChevronUp, ThumbsUp, Lightbulb, HelpCircle, Target, AlertCircle, Zap, Gift, Heart, X } from 'lucide-react';
import { generateChatResponse, checkOpenAIConnectionStatus } from '../lib/openai';

interface TabbedCoachPanelProps {
  content: string;
  textType: string;
  assistanceLevel: string;
  selectedText: string;
  onNavigate?: (page: string) => void;
}

type TabType = 'coach' | 'analysis' | 'vocabulary' | 'progress';

interface AIConnectionStatus {
  connected: boolean;
  loading: boolean;
  lastChecked: Date | null;
}

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isTyping?: boolean;
}

export function TabbedCoachPanel({
  content,
  textType,
  assistanceLevel,
  selectedText,
  onNavigate
}: TabbedCoachPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('coach');
  const [localAssistanceLevel, setLocalAssistanceLevel] = useState<string>(assistanceLevel);
  const [aiStatus, setAIStatus] = useState<AIConnectionStatus>({
    connected: false,
    loading: true,
    lastChecked: null
  });

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isAITyping, setIsAITyping] = useState(false);
  const [showQuickQuestions, setShowQuickQuestions] = useState(true);

  // Refs
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update local assistance level when prop changes
  useEffect(() => {
    setLocalAssistanceLevel(assistanceLevel);
  }, [assistanceLevel]);

  // Check AI connection status on mount and periodically
  useEffect(() => {
    checkAIConnection();
    
    // Check connection every 30 seconds
    const interval = setInterval(checkAIConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  // Initialize welcome message
  useEffect(() => {
    if (chatMessages.length === 0) {
      setChatMessages([{
        id: '1',
        text: "Hi! I'm your AI Writing Buddy! 🤖 I'm here to help you write amazing stories. Ask me anything about writing!",
        isUser: false,
        timestamp: new Date()
      }]);
    }
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

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
      console.error('AI connection check failed:', error);
      setAIStatus({
        connected: false,
        loading: false,
        lastChecked: new Date()
      });
    }
  };

  const sendMessage = async () => {
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

  const handleQuickQuestion = (question: string) => {
    setInputMessage(question);
    setTimeout(() => {
      sendMessage();
    }, 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Calculate stats
  const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
  const charCount = content.length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));
  const qualityScore = Math.min(100, Math.max(0, (wordCount / 5) + (charCount / 20)));

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 text-white">
      {/* Header */}
      <div className="p-4 border-b border-white/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Bot className="w-6 h-6" />
            <h2 className="text-lg font-semibold">Writing Buddy</h2>
          </div>
          <div className="flex items-center space-x-2">
            {aiStatus.connected ? (
              <div className="flex items-center space-x-1 text-green-300">
                <Wifi className="w-4 h-4" />
                <span className="text-xs">AI Connected</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1 text-red-300">
                <WifiOff className="w-4 h-4" />
                <span className="text-xs">AI Offline</span>
              </div>
            )}
            <button
              onClick={checkAIConnection}
              disabled={aiStatus.loading}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${aiStatus.loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
        
        <p className="text-sm text-white/80">Your AI writing assistant</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/20">
        {[
          { id: 'coach', label: 'Coach', icon: MessageSquare },
          { id: 'analysis', label: 'Analysis', icon: BarChart3 },
          { id: 'vocabulary', label: 'Vocabulary', icon: BookOpen },
          { id: 'progress', label: 'Progress', icon: TrendingUp }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as TabType)}
            className={`flex-1 flex flex-col items-center py-3 px-2 text-xs transition-all duration-200 ${
              activeTab === id
                ? 'bg-white/20 text-white border-b-2 border-white'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <Icon className="w-4 h-4 mb-1" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'coach' && (
          <div className="h-full flex flex-col">
            {/* AI Coach Header */}
            <div className="p-4 bg-white/10 backdrop-blur-sm">
              <h3 className="font-semibold text-center mb-2">AI Coach</h3>
              <p className="text-xs text-center text-white/80">Ask your Writing Buddy anything!</p>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg text-sm ${
                      message.isUser
                        ? 'bg-white/20 text-white ml-4'
                        : message.isTyping
                        ? 'bg-white/10 text-white/70 italic'
                        : 'bg-white/30 text-white mr-4'
                    }`}
                  >
                    {message.isTyping ? (
                      <div className="flex items-center space-x-2">
                        <Loader className="w-3 h-3 animate-spin" />
                        <span>{message.text}</span>
                      </div>
                    ) : (
                      message.text
                    )}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Questions */}
            {showQuickQuestions && chatMessages.length <= 2 && (
              <div className="p-4 bg-white/5">
                <h4 className="text-sm font-medium mb-3">Quick Questions:</h4>
                <div className="space-y-2">
                  {[
                    "How can I improve my introduction?",
                    "What's a good synonym for 'said'?",
                    "Help me with my conclusion"
                  ].map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickQuestion(question)}
                      className="w-full text-left p-2 bg-white/10 hover:bg-white/20 rounded text-xs transition-colors"
                    >
                      • {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Input */}
            <div className="p-4 bg-white/10 backdrop-blur-sm">
              <div className="flex space-x-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask for help..."
                  className="flex-1 bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-white placeholder-white/70 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
                  disabled={isAITyping}
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isAITyping}
                  className="bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed border border-white/30 rounded-lg px-3 py-2 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="p-4 space-y-4">
            <h3 className="font-semibold text-center">Writing Analysis</h3>
            <div className="space-y-3">
              <div className="bg-white/10 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Quality Score</span>
                  <span className="text-sm font-semibold">{Math.round(qualityScore)}%</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${qualityScore}%` }}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white/10 rounded p-2 text-center">
                  <div className="font-semibold">{wordCount}</div>
                  <div className="text-white/70">Words</div>
                </div>
                <div className="bg-white/10 rounded p-2 text-center">
                  <div className="font-semibold">{charCount}</div>
                  <div className="text-white/70">Characters</div>
                </div>
                <div className="bg-white/10 rounded p-2 text-center">
                  <div className="font-semibold">{readingTime}</div>
                  <div className="text-white/70">Min Read</div>
                </div>
                <div className="bg-white/10 rounded p-2 text-center">
                  <div className="font-semibold">0</div>
                  <div className="text-white/70">Issues</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'vocabulary' && (
          <div className="p-4 space-y-4">
            <h3 className="font-semibold text-center">Vocabulary Builder</h3>
            <div className="space-y-3">
              <div className="bg-white/10 rounded-lg p-3">
                <h4 className="text-sm font-medium mb-2">Suggested Words</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-white/70">Instead of "big":</span>
                    <span>enormous, massive</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Instead of "said":</span>
                    <span>whispered, exclaimed</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Instead of "good":</span>
                    <span>excellent, wonderful</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/10 rounded-lg p-3">
                <h4 className="text-sm font-medium mb-2">Vocabulary Level</h4>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-white/20 rounded-full h-2">
                    <div className="bg-gradient-to-r from-yellow-400 to-green-500 h-2 rounded-full w-3/4" />
                  </div>
                  <span className="text-xs">Advanced</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="p-4 space-y-4">
            <h3 className="font-semibold text-center">Progress Tracking</h3>
            <div className="space-y-3">
              <div className="bg-white/10 rounded-lg p-3">
                <h4 className="text-sm font-medium mb-2">Writing Goals</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span>Word Count Goal</span>
                    <span>{wordCount}/300</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-1">
                    <div
                      className="bg-green-400 h-1 rounded-full"
                      style={{ width: `${Math.min(100, (wordCount / 300) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="bg-white/10 rounded-lg p-3">
                <h4 className="text-sm font-medium mb-2">Achievements</h4>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <Star className="w-6 h-6 mx-auto mb-1 text-yellow-400" />
                    <div className="text-xs">First Draft</div>
                  </div>
                  <div className="text-center opacity-50">
                    <Trophy className="w-6 h-6 mx-auto mb-1" />
                    <div className="text-xs">100 Words</div>
                  </div>
                  <div className="text-center opacity-50">
                    <Award className="w-6 h-6 mx-auto mb-1" />
                    <div className="text-xs">Perfect Score</div>
                  </div>
                </div>
              </div>
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
