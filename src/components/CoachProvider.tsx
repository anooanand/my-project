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

  // Feedback tracking to prevent repetition
  const [feedbackHistory, setFeedbackHistory] = useState<Set<string>>(new Set());
  const [lastFeedbackTime, setLastFeedbackTime] = useState<number>(0);

  // Refs
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Quick question templates
  const quickQuestions = [
    "How can I improve my introduction?",
    "What's a good synonym for 'said'?",
    "Help me with my conclusion",
    "How do I make my characters more interesting?",
    "What makes a good story hook?"
  ];

  const handleQuickQuestion = (question: string) => {
    setInputMessage(question);
    handleSendMessage(question);
    setShowQuickQuestions(false);
  };

  // Enhanced paragraph feedback with variety and context awareness
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

        const wordCount = p.paragraph.trim().split(/\s+/).length;
        if (wordCount < 15) return; // Increased threshold for more substantial content

        // Prevent too frequent feedback
        const now = Date.now();
        if (now - lastFeedbackTime < 10000) { // 10 second cooldown
          return;
        }

        console.log("Coach received paragraph event:", p);

        // Generate a unique key for this content to prevent repetition
        const contentKey = p.paragraph.trim().toLowerCase().slice(0, 50);
        if (feedbackHistory.has(contentKey)) {
          console.log("Skipping duplicate feedback for similar content");
          return;
        }

        setIsAITyping(true);
        setLastFeedbackTime(now);

        const typingMessage: ChatMessage = {
          id: 'typing-' + Date.now(),
          text: 'Writing Buddy is reading your work...',
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
              text: res.tip || getVariedFallbackTip(p.paragraph, feedbackHistory.size),
              isUser: false,
              timestamp: new Date()
            }];
          });

          // Track this feedback to prevent repetition
          setFeedbackHistory(prev => new Set([...prev, contentKey]));

          // Hide quick questions after first interaction
          setShowQuickQuestions(false);

        } catch (error) {
          console.error("Coach tip failed:", error);
          
          // Remove typing indicator and add fallback response
          setMessages(prev => {
            const withoutTyping = prev.filter(msg => !msg.isTyping);
            return [...withoutTyping, {
              id: 'coach-' + Date.now(),
              text: getVariedFallbackTip(p.paragraph, feedbackHistory.size),
              isUser: false,
              timestamp: new Date()
            }];
          });

          setFeedbackHistory(prev => new Set([...prev, contentKey]));
        }

      } catch (error) {
        console.error("Paragraph handler error:", error);
      } finally {
        setIsAITyping(false);
      }
    };
    
    eventBus.on("paragraph.ready", handler);
    return () => eventBus.off("paragraph.ready", handler);
  }, [feedbackHistory, lastFeedbackTime]);

  // Varied fallback tips that change based on content and feedback count
  const getVariedFallbackTip = (paragraph: string, feedbackCount: number): string => {
    const text = paragraph.toLowerCase();
    const wordCount = paragraph.trim().split(/\s+/).length;
    
    // Analyze content for specific feedback
    const hasDialogue = text.includes('"') || text.includes("'");
    const hasAction = /\b(ran|jumped|walked|moved|grabbed|pushed|pulled)\b/.test(text);
    const hasEmotion = /\b(happy|sad|angry|excited|scared|worried|surprised)\b/.test(text);
    const hasDescription = /\b(beautiful|dark|bright|cold|warm|loud|quiet)\b/.test(text);
    
    // Rotate through different types of feedback
    const feedbackTypes = [
      // Dialogue feedback
      () => hasDialogue ? 
        "Great dialogue! 💬 Try varying your dialogue tags - instead of 'said', use 'whispered', 'exclaimed', or 'muttered' to show how characters speak." :
        "Consider adding some dialogue to bring your characters to life! 💬 What might they say in this moment?",
      
      // Action feedback  
      () => hasAction ?
        "I love the action in your writing! 🏃‍♂️ Try adding more specific details about how the character moves - are they stumbling, striding, or tiptoeing?" :
        "Try adding some action to make your scene more dynamic! What is your character doing with their hands, feet, or body?",
      
      // Emotion feedback
      () => hasEmotion ?
        "You're doing well showing emotions! 😊 Instead of just naming feelings, try showing them through actions - like 'her hands trembled' instead of 'she was nervous'." :
        "How is your character feeling right now? Try showing their emotions through their actions, expressions, or thoughts! 🎭",
      
      // Description feedback
      () => hasDescription ?
        "Nice descriptive language! 🎨 Try engaging more senses - what does your character hear, smell, or feel in this scene?" :
        "Paint a picture with your words! What does your character see, hear, or smell in this moment? 🌟",
      
      // Structure feedback
      () => wordCount > 30 ?
        "Good paragraph development! 📝 Try varying your sentence lengths - mix short, punchy sentences with longer, flowing ones." :
        "You're building your story well! Try expanding this section with more details about the setting or character's thoughts. ✨",
      
      // Vocabulary feedback
      () => "Great work! 📚 Challenge yourself to use more specific, vivid words. Instead of 'big', try 'enormous', 'massive', or 'towering'!",
      
      // Encouragement
      () => "You're doing fantastic! 🌟 Keep writing and let your imagination flow. Every word brings your story to life!",
      
      // Pacing feedback
      () => "Nice pacing! ⏰ Remember to balance action scenes with quieter moments where characters can reflect or develop."
    ];
    
    // Select feedback type based on count to ensure variety
    const selectedFeedback = feedbackTypes[feedbackCount % feedbackTypes.length];
    return selectedFeedback();
  };

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputMessage;
    if (!textToSend.trim() || isAITyping) return;

    const userMessage: ChatMessage = {
      id: 'user-' + Date.now(),
      text: textToSend,
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
      const response = await generateChatResponse(textToSend, 'coach');
      
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
          text: "I'm having trouble connecting right now. Please try again in a moment! 🔄",
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
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <MessageSquare className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Writing Buddy Chat</h3>
            <p className="text-sm text-gray-600">Ask me anything about writing!</p>
          </div>
          <div className={`w-3 h-3 rounded-full ${aiStatus.connected ? 'bg-green-500' : 'bg-red-500'}`} 
               title={aiStatus.connected ? 'Connected' : 'Disconnected'} />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] p-3 rounded-lg ${
                message.isUser
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-gray-100 text-gray-900 rounded-bl-sm'
              }`}
            >
              {message.isTyping && (
                <div className="flex items-center gap-2">
                  <Loader className="w-4 h-4 animate-spin" />
                  <span className="text-sm">{message.text}</span>
                </div>
              )}
              {!message.isTyping && (
                <p className="text-sm leading-relaxed">{message.text}</p>
              )}
              <div className={`text-xs mt-1 ${message.isUser ? 'text-blue-100' : 'text-gray-500'}`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Quick Questions */}
      {showQuickQuestions && (
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <p className="text-sm text-gray-600 mb-3">💡 Quick questions to get started:</p>
          <div className="space-y-2">
            {quickQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleQuickQuestion(question)}
                className="w-full text-left p-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
              >
                💬 {question}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3">
            💡 I'll also give you automatic feedback as you write!
          </p>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask me about writing..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isAITyping}
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || isAITyping}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
