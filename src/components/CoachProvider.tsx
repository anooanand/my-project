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

  // Direct content monitoring effect
  useEffect(() => {
    if (content !== contentMonitorRef.current) {
      const prevContent = contentMonitorRef.current;
      contentMonitorRef.current = content;
      setPreviousContent(prevContent);
      setLastChangeTime(Date.now());

      // Trigger feedback analysis
      analyzeFeedbackTrigger(prevContent, content);
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

  // Analyze content changes for feedback triggers
  const analyzeFeedbackTrigger = async (prevContent: string, newContent: string) => {
    try {
      if (!newContent || newContent.trim().length === 0) return;

      const wordCount = newContent.trim().split(/\s+/).filter(word => word.length > 0).length;
      if (wordCount < 15) return; // Minimum threshold

      // Prevent too frequent feedback
      const now = Date.now();
      if (now - lastFeedbackTime < 8000) { // 8 second cooldown
        console.log("Skipping feedback due to cooldown");
        return;
      }

      // Check for word threshold triggers
      const thresholdResult = detectWordThreshold(prevContent, newContent, 20);
      if (thresholdResult) {
        console.log("Word threshold trigger detected:", thresholdResult);
        await provideFeedback(thresholdResult.text, thresholdResult.trigger);
        return;
      }

      // Check for new paragraphs
      const prevParas = splitParas(prevContent);
      const newParas = splitParas(newContent);
      
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
      const prevWords = prevContent.trim() ? prevContent.trim().split(/\s+/).length : 0;
      const newWords = newContent.trim() ? newContent.trim().split(/\s+/).length : 0;
      const wordDifference = newWords - prevWords;

      if (wordDifference >= 30 && newWords >= 50) {
        console.log("Significant content addition detected");
        const currentParagraph = newParas[newParas.length - 1] || newContent.slice(-200);
        await provideFeedback(currentParagraph, 'progress_milestone');
      }

    } catch (error) {
      console.error("Content analysis error:", error);
    }
  };

  // Provide feedback for given content
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

        // Hide quick questions after first interaction
        setShowQuickQuestions(false);

      } catch (error) {
        console.error("Coach tip failed:", error);
        
        // Remove typing indicator and add fallback response
        setMessages(prev => {
          const withoutTyping = prev.filter(msg => !msg.isTyping);
          return [...withoutTyping, {
            id: 'coach-' + Date.now(),
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

  // Event bus listener (backup method)
  useEffect(() => {
    const handler = async (p: { 
      paragraph: string; 
      index: number; 
      wordCount?: number; 
      trigger?: string;
    }) => {
      console.log("Event bus paragraph received:", p);
      await provideFeedback(p.paragraph, p.trigger || 'event_bus');
    };
    
    eventBus.on("paragraph.ready", handler);
    return () => eventBus.off("paragraph.ready", handler);
  }, [lastFeedbackTime, feedbackCount]);

  // Varied fallback tips that change based on content and feedback count
  const getVariedFallbackTip = (paragraph: string, feedbackCount: number): string => {
    const text = paragraph.toLowerCase();
    const wordCount = paragraph.trim().split(/\s+/).length;
    
    // Analyze content for specific feedback
    const hasDialogue = text.includes('\"') || text.includes("\'");
    const hasAction = /\b(ran|jumped|walked|moved|grabbed|pushed|pulled|went|came|looked|saw)\b/.test(text);
    const hasEmotion = /\b(happy|sad|angry|excited|scared|worried|surprised|felt|feeling)\b/.test(text);
    const hasDescription = /\b(beautiful|dark|bright|cold|warm|loud|quiet|big|small|old|new)\b/.test(text);
    
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
      text: '🤖 Thinking...',
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
      <div className="p-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-blue-100 rounded-lg">
            <MessageSquare className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm text-gray-900">Writing Buddy Chat</h3>
            <p className="text-xs text-gray-600">Ask me anything about writing!</p>
          </div>
          <div className={`w-2 h-2 rounded-full ${aiStatus.connected ? 'bg-green-500' : 'bg-red-500'}`} 
               title={aiStatus.connected ? 'Connected' : 'Disconnected'} />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] p-2 rounded-lg text-sm ${
                message.isUser
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : message.isFeedback
                  ? 'bg-green-50 text-green-800 border border-green-200 rounded-bl-sm'
                  : 'bg-gray-100 text-gray-900 rounded-bl-sm'
              }`}
            >
              {message.isTyping && (
                <div className="flex items-center gap-2">
                  <Loader className="w-3 h-3 animate-spin" />
                  <span>{message.text}</span>
                </div>
              )}
              {!message.isTyping && (
                <p className="leading-relaxed">{message.text}</p>
              )}
              <div className={`text-xs mt-1 ${
                message.isUser ? 'text-blue-100' : 
                message.isFeedback ? 'text-green-600' : 'text-gray-500'
              }`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Quick Questions */}
      {showQuickQuestions && (
        <div className="p-3 border-t border-gray-100 bg-gray-50">
          <p className="text-xs font-medium text-gray-700 mb-2">💡 Quick questions to get started:</p>
          <div className="space-y-1">
            {quickQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleQuickQuestion(question)}
                className="w-full text-left p-1.5 text-xs text-gray-600 hover:bg-gray-200 rounded-md transition-colors duration-150"
              >
                {question}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">✨ I'll also give you automatic feedback as you write!</p>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-gray-200 bg-white">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask me about writing..."
            className="w-full p-2 pr-10 text-sm text-gray-800 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow duration-200"
            disabled={isAITyping}
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={isAITyping || !inputMessage.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-blue-600 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
          <span>Feedback given: {feedbackCount}</span>
          <span>Words: {content.trim().split(/\s+/).filter(Boolean).length}</span>
          <span>Last: {messages[messages.length - 1]?.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
        </div>
      </div>
    </div>
  );
}
