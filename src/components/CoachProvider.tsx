import React, { useState, useEffect, useRef } from "react";
import { eventBus } from "../lib/eventBus";
import { coachTip } from "../lib/api";
import { Bot, User, Send, Lightbulb, MessageCircle, Sparkles, HelpCircle } from 'lucide-react';

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isTyping?: boolean;
}

interface FeedbackMsg {
  id: string;
  paragraph: string;
  feedback: string;
  ts: number;
}

export function CoachProvider() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isAITyping, setIsAITyping] = useState(false);
  const [showQuickQuestions, setShowQuickQuestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: '1',
        text: "Hi! I'm your AI Writing Buddy! 🤖 I'm here to help you write amazing stories. Ask me anything about writing, or just start typing and I'll give you feedback!",
        isUser: false,
        timestamp: new Date()
      }]);
    }
  }, []);

  // Listen for paragraph completion events
  useEffect(() => {
    const handler = async (p: { paragraph: string; index: number; wordCount?: number }) => {
      try {
        if (!p.paragraph || typeof p.paragraph !== 'string' || p.paragraph.trim().length === 0) {
          return;
        }

        // Only provide automatic feedback for substantial content (20+ words)
        const wordCount = p.paragraph.trim().split(/\s+/).length;
        if (wordCount < 20) return;

        setIsAITyping(true);

        // Add typing indicator
        const typingMessage: ChatMessage = {
          id: 'typing-' + Date.now(),
          text: 'Writing Buddy is analyzing your paragraph...',
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
              text: res.tip || "Great work! Keep writing and developing your ideas.",
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
              text: getFallbackTip(p.paragraph),
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

  // Fallback tips for when API fails
  const getFallbackTip = (paragraph: string): string => {
    const text = paragraph.toLowerCase();
    
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

  // Enhanced fallback chat responses
  const getFallbackChatResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('introduction') || lowerMessage.includes('start') || lowerMessage.includes('beginning')) {
      return "Great question about introductions! Start with a hook - maybe an intriguing question, exciting action, or mysterious statement. For narrative writing, try to grab your reader's attention right from the first sentence! 🎣";
    } else if (lowerMessage.includes('conclusion') || lowerMessage.includes('end') || lowerMessage.includes('finish')) {
      return "For a strong conclusion, circle back to your opening theme and show how your character has grown or changed. Leave readers satisfied but thoughtful! ✨";
    } else if (lowerMessage.includes('synonym') || lowerMessage.includes('word') || lowerMessage.includes('vocabulary')) {
      return "Try these powerful alternatives: Instead of 'said' → whispered, exclaimed, declared. Instead of 'big' → enormous, massive, gigantic. Specific words make writing shine! 📚";
    } else if (lowerMessage.includes('character') || lowerMessage.includes('personality')) {
      return "Show character emotions through actions and thoughts! Instead of 'he was sad', try 'his shoulders slumped as he stared at the ground.' Show, don't tell! 😊";
    } else if (lowerMessage.includes('dialogue') || lowerMessage.includes('conversation')) {
      return "Make dialogue sound natural! Read it aloud - does it sound like how people really talk? Add action beats between speech to show what characters are doing. 💬";
    } else if (lowerMessage.includes('description') || lowerMessage.includes('setting')) {
      return "Use your five senses! Don't just tell us what things look like - what do they sound, smell, feel, or taste like? This brings your world to life! 🌟";
    } else if (lowerMessage.includes('help') || lowerMessage.includes('stuck') || lowerMessage.includes('ideas')) {
      return "When you're stuck, try asking yourself: What if something unexpected happened? What would your character do in a difficult situation? Sometimes the best stories come from challenges! 💡";
    } else {
      return "That's a thoughtful question! Keep writing and let your creativity flow. Remember: every sentence should either advance the plot or develop character. You're doing great! 🌟";
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

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsAITyping(true);
    setShowQuickQuestions(false);

    try {
      // Add typing indicator
      const typingMessage: ChatMessage = {
        id: 'typing-' + Date.now(),
        text: 'Writing Buddy is thinking...',
        isUser: false,
        timestamp: new Date(),
        isTyping: true
      };
      setMessages(prev => [...prev, typingMessage]);

      // Try to get AI response
      let aiResponse;
      try {
        // For chat, we can use the coachTip function with the user's question
        const response = await coachTip(userMessage.text);
        aiResponse = response.tip || getFallbackChatResponse(userMessage.text);
      } catch (apiError) {
        console.error('Chat API Error:', apiError);
        aiResponse = getFallbackChatResponse(userMessage.text);
      }

      // Remove typing indicator and add real response
      setMessages(prev => {
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
      setMessages(prev => {
        const withoutTyping = prev.filter(msg => !msg.isTyping);
        return [...withoutTyping, {
          id: 'ai-' + Date.now(),
          text: getFallbackChatResponse(userMessage.text),
          isUser: false,
          timestamp: new Date()
        }];
      });
    } finally {
      setIsAITyping(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
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

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-800">Writing Buddy Chat</h3>
          <Sparkles className="w-4 h-4 text-purple-500" />
        </div>
        <p className="text-xs text-gray-600 mt-1">Ask me anything about writing!</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div className="flex items-start space-x-2 max-w-[85%]">
              {!message.isUser && (
                <div className="flex-shrink-0">
                  <Bot className="w-6 h-6 text-blue-500 bg-blue-100 rounded-full p-1" />
                </div>
              )}
              <div
                className={`p-3 rounded-lg ${
                  message.isUser
                    ? 'bg-blue-600 text-white'
                    : message.isTyping
                    ? 'bg-white border animate-pulse'
                    : 'bg-white border shadow-sm'
                }`}
              >
                <p className={`text-sm ${message.isUser ? 'text-white' : 'text-gray-800'}`}>
                  {message.text}
                </p>
                <p className={`text-xs mt-1 ${message.isUser ? 'text-blue-100' : 'text-gray-500'}`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {message.isUser && (
                <div className="flex-shrink-0">
                  <User className="w-6 h-6 text-gray-500 bg-gray-100 rounded-full p-1" />
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions */}
      {showQuickQuestions && messages.length <= 2 && (
        <div className="p-3 border-t border-gray-200 bg-white">
          <p className="text-xs text-gray-600 mb-2 flex items-center">
            <HelpCircle className="w-3 h-3 mr-1" />
            Quick questions to get started:
          </p>
          <div className="space-y-1">
            {[
              "How can I improve my introduction?",
              "What's a good synonym for 'said'?",
              "Help me with my conclusion",
              "How do I make my characters more interesting?",
              "What makes a good story hook?"
            ].map((question, index) => (
              <button
                key={index}
                onClick={() => handleQuickQuestion(question)}
                className="w-full text-left p-2 bg-gray-50 hover:bg-gray-100 rounded text-xs transition-colors border"
              >
                <Lightbulb className="w-3 h-3 inline mr-1 text-yellow-500" />
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Input */}
      <div className="p-3 border-t border-gray-200 bg-white">
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me about writing..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isAITyping}
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isAITyping}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          💡 I'll also give you automatic feedback as you write!
        </p>
      </div>
    </div>
  );
}
