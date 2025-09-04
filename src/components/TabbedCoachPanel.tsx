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

  // Enhanced fallback chat responses
  const getFallbackChatResponse = (userMessage: string, textType: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('introduction') || lowerMessage.includes('start') || lowerMessage.includes('beginning')) {
      return `Great question about introductions! Start with a hook - maybe an intriguing question, exciting action, or mysterious statement. For ${textType} writing, try to grab your reader's attention right from the first sentence! 🎣`;
    } else if (lowerMessage.includes('conclusion') || lowerMessage.includes('end') || lowerMessage.includes('finish')) {
      return `For a strong conclusion, circle back to your opening theme and show how your character has grown or changed. Leave readers satisfied but thoughtful! ✨`;
    } else if (lowerMessage.includes('synonym') || lowerMessage.includes('word') || lowerMessage.includes('vocabulary')) {
      return `Try these powerful alternatives: Instead of 'said' → whispered, exclaimed, declared. Instead of 'big' → enormous, massive, gigantic. Specific words make writing shine! 📚`;
    } else if (lowerMessage.includes('character') || lowerMessage.includes('personality')) {
      return `Show character emotions through actions and thoughts! Instead of 'he was sad', try 'his shoulders slumped as he stared at the ground.' Show, don't tell! 😊`;
    } else if (lowerMessage.includes('dialogue') || lowerMessage.includes('conversation')) {
      return `Make dialogue sound natural! Read it aloud - does it sound like how people really talk? Add action beats between speech to show what characters are doing. 💬`;
    } else if (lowerMessage.includes('description') || lowerMessage.includes('setting')) {
      return `Use your five senses! Don't just tell us what things look like - what do they sound, smell, feel, or taste like? This brings your world to life! 🌟`;
    } else {
      return `That's a thoughtful question! Keep writing and let your creativity flow. Remember: every sentence should either advance the plot or develop character. You're doing great! 🌟`;
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
        return [...withoutTyping, {
          id: 'ai-' + Date.now(),
          text: aiResponse,
          isUser: false,
          timestamp: new Date()
        }];
      });

    } catch (error) {
      console.error('Chat error:', error);
      
      // Remove typing indicator and add fallback response
      setChatMessages(prev => {
        const withoutTyping = prev.filter(msg => !msg.isTyping);
        return [...withoutTyping, {
          id: 'ai-' + Date.now(),
          text: getFallbackChatResponse(userMessage.text, textType),
          isUser: false,
          timestamp: new Date()
        }];
      });
    } finally {
      setIsAITyping(false);
    }
  };

  const handleQuickQuestion = async (question: string) => {
    setInputMessage(question);
    // Trigger send after setting the message
    setTimeout(() => sendMessage(), 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const refreshConnection = () => {
    checkAIConnection();
  };

  // Calculate writing statistics
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;
  const sentenceCount = content.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  const paragraphCount = content.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
  const readingTime = Math.ceil(wordCount / 200);
  const gradeLevel = Math.min(12, Math.max(1, Math.round(wordCount / 100 + sentenceCount / 10)));

  const qualityScore = Math.min(100, Math.max(0, 
    (wordCount > 50 ? 25 : wordCount / 2) +
    (sentenceCount > 3 ? 25 : sentenceCount * 8) +
    (paragraphCount > 1 ? 25 : paragraphCount * 25) +
    (content.includes('"') ? 25 : 0)
  ));

  return (
    <div className="h-full bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm p-4 border-b border-white/20">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-white font-semibold">Writing Buddy</h2>
          <div className="flex items-center space-x-2">
            {aiStatus.loading ? (
              <Loader className="w-4 h-4 text-white animate-spin" />
            ) : (
              <div className="flex items-center space-x-1">
                {aiStatus.connected ? (
                  <Wifi className="w-4 h-4 text-green-300" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-300" />
                )}
                <span className={`text-xs ${aiStatus.connected ? 'text-green-300' : 'text-red-300'}`}>
                  {aiStatus.connected ? 'AI Connected' : 'AI Offline'}
                </span>
                <button
                  onClick={refreshConnection}
                  className="text-white/70 hover:text-white transition-colors"
                  title="Refresh connection"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
        <p className="text-white/80 text-sm">Ask your Writing Buddy anything!</p>
      </div>

      {/* Tabs */}
      <div className="bg-white/10 backdrop-blur-sm">
        <div className="flex">
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
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'coach' && (
          <div className="h-full flex flex-col">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.isUser
                        ? 'bg-white text-gray-800'
                        : message.isTyping
                        ? 'bg-white/20 text-white/70 animate-pulse'
                        : 'bg-white/20 text-white'
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Questions */}
            {showQuickQuestions && chatMessages.length <= 2 && (
              <div className="p-4 border-t border-white/20">
                <p className="text-white/80 text-xs mb-3">Quick questions to get started:</p>
                <div className="space-y-2">
                  {[
                    "How can I improve my introduction?",
                    "What's a good synonym for 'said'?",
                    "Help me with my conclusion"
                  ].map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickQuestion(question)}
                      className="w-full text-left p-2 bg-white/10 hover:bg-white/20 rounded text-white/90 text-xs transition-colors"
                    >
                      • {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Input */}
            <div className="p-4 border-t border-white/20">
              <div className="flex space-x-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask for help..."
                  className="flex-1 bg-white/20 text-white placeholder-white/60 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
                  disabled={isAITyping}
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isAITyping}
                  className="bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="p-4 space-y-4 overflow-y-auto h-full">
            <div className="bg-white/10 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3 flex items-center">
                <BarChart3 className="w-4 h-4 mr-2" />
                Writing Statistics
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-white/90">
                  <span>Words:</span>
                  <span>{wordCount}</span>
                </div>
                <div className="flex justify-between text-white/90">
                  <span>Sentences:</span>
                  <span>{sentenceCount}</span>
                </div>
                <div className="flex justify-between text-white/90">
                  <span>Paragraphs:</span>
                  <span>{paragraphCount}</span>
                </div>
                <div className="flex justify-between text-white/90">
                  <span>Reading Time:</span>
                  <span>{readingTime} min</span>
                </div>
                <div className="flex justify-between text-white/90">
                  <span>Grade Level:</span>
                  <span>{gradeLevel}</span>
                </div>
              </div>
            </div>

            <div className="bg-white/10 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3 flex items-center">
                <Star className="w-4 h-4 mr-2" />
                Quality Score
              </h3>
              <div className="flex items-center space-x-3">
                <div className="flex-1 bg-white/20 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-yellow-400 to-green-400 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${qualityScore}%` }}
                  />
                </div>
                <span className="text-white font-semibold">{Math.round(qualityScore)}%</span>
              </div>
              <p className="text-white/80 text-xs mt-2">
                {qualityScore >= 80 ? 'Excellent work!' : 
                 qualityScore >= 60 ? 'Good progress!' : 
                 qualityScore >= 40 ? 'Keep writing!' : 
                 'Just getting started!'}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'vocabulary' && (
          <div className="p-4 space-y-4 overflow-y-auto h-full">
            <div className="bg-white/10 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3 flex items-center">
                <BookOpen className="w-4 h-4 mr-2" />
                Word Suggestions
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-white/90 text-sm font-medium">Instead of "said":</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {['whispered', 'exclaimed', 'declared', 'muttered', 'shouted'].map(word => (
                      <span key={word} className="bg-white/20 text-white/90 px-2 py-1 rounded text-xs">
                        {word}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-white/90 text-sm font-medium">Instead of "big":</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {['enormous', 'massive', 'gigantic', 'colossal', 'immense'].map(word => (
                      <span key={word} className="bg-white/20 text-white/90 px-2 py-1 rounded text-xs">
                        {word}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-white/90 text-sm font-medium">Instead of "good":</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {['excellent', 'outstanding', 'remarkable', 'superb', 'fantastic'].map(word => (
                      <span key={word} className="bg-white/20 text-white/90 px-2 py-1 rounded text-xs">
                        {word}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3 flex items-center">
                <Sparkles className="w-4 h-4 mr-2" />
                Writing Techniques
              </h3>
              <div className="space-y-2 text-sm text-white/90">
                <p>• Use sensory details (sight, sound, smell, touch, taste)</p>
                <p>• Show emotions through actions, not just words</p>
                <p>• Vary your sentence lengths for better flow</p>
                <p>• Use dialogue to reveal character personality</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="p-4 space-y-4 overflow-y-auto h-full">
            <div className="bg-white/10 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                Writing Progress
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-white/90 text-sm mb-1">
                    <span>Story Length</span>
                    <span>{wordCount}/500 words</span>
                  </div>
                  <div className="bg-white/20 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-400 to-purple-400 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (wordCount / 500) * 100)}%` }}
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-white/90 text-sm mb-1">
                    <span>Structure</span>
                    <span>{paragraphCount >= 3 ? 'Complete' : 'In Progress'}</span>
                  </div>
                  <div className="bg-white/20 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-green-400 to-blue-400 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (paragraphCount / 3) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3 flex items-center">
                <Target className="w-4 h-4 mr-2" />
                Next Steps
              </h3>
              <div className="space-y-2 text-sm text-white/90">
                {wordCount < 100 && <p>• Keep writing to develop your story</p>}
                {paragraphCount < 3 && <p>• Add more paragraphs for better structure</p>}
                {!content.includes('"') && <p>• Try adding some dialogue</p>}
                {sentenceCount < 5 && <p>• Expand with more detailed sentences</p>}
                {wordCount >= 100 && paragraphCount >= 3 && content.includes('"') && (
                  <p>• Great work! Consider adding more descriptive details</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
