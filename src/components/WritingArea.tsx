// AI-Powered WritingArea Component with Automatic Feedback
// Fixed version with named export for compatibility

import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, BarChart3, BookOpen, TrendingUp, Lightbulb } from 'lucide-react';

// Embedded OpenAI Service
interface FeedbackRequest {
  paragraphContent: string;
  paragraphNumber: number;
  textType: string;
  previousParagraphs?: string[];
  studentLevel?: 'beginner' | 'intermediate' | 'advanced';
}

interface ChatRequest {
  userMessage: string;
  textType: string;
  currentContent: string;
  wordCount: number;
  context?: string;
}

class EmbeddedOpenAIService {
  private apiKey: string;
  private apiBase: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
    this.apiBase = import.meta.env.VITE_OPENAI_API_BASE || 'https://api.openai.com/v1';
  }

  private async callOpenAI(messages: any[]): Promise<string> {
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
          max_tokens: 200,
          temperature: 0.7,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content.trim();
    } catch (error) {
      console.error('OpenAI API call failed:', error);
      throw error;
    }
  }

  async generateParagraphFeedback(request: FeedbackRequest): Promise<string> {
    const systemMessage = `You are an encouraging AI writing coach for students preparing for NSW Selective School exams. Provide supportive, constructive feedback in 2-3 sentences maximum. Focus on what the student did well and provide 1-2 actionable suggestions.`;
    
    const userPrompt = `Please provide encouraging feedback for paragraph ${request.paragraphNumber} of this ${request.textType.toLowerCase()} story: "${request.paragraphContent}"`;

    const messages = [
      { role: 'system', content: systemMessage },
      { role: 'user', content: userPrompt }
    ];

    try {
      return await this.callOpenAI(messages);
    } catch (error) {
      return `Great work on paragraph ${request.paragraphNumber}! You're building your story well. Keep focusing on showing your character's emotions through their actions and thoughts.`;
    }
  }

  async generateChatResponse(request: ChatRequest): Promise<string> {
    const systemMessage = `You are a helpful AI writing coach for students aged 10-12 preparing for NSW Selective School exams. Provide encouraging, age-appropriate writing advice in 2-4 sentences.`;
    
    const userPrompt = `Student's question: "${request.userMessage}". They're working on ${request.textType.toLowerCase()} writing and have written ${request.wordCount} words so far.`;

    const messages = [
      { role: 'system', content: systemMessage },
      { role: 'user', content: userPrompt }
    ];

    try {
      return await this.callOpenAI(messages);
    } catch (error) {
      return "I'm having trouble responding right now. Please try again in a moment, or feel free to continue writing!";
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async testConnection(): Promise<boolean> {
    try {
      const testMessages = [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Say "Hello" if you can hear me.' }
      ];
      
      const response = await this.callOpenAI(testMessages);
      return response.toLowerCase().includes('hello');
    } catch (error) {
      return false;
    }
  }
}

// Create service instance
const embeddedOpenAIService = new EmbeddedOpenAIService();

// Component interfaces
interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isAutomatic?: boolean;
  paragraphNumber?: number;
  messageType?: 'manual' | 'automatic_feedback';
}

interface ParagraphFeedback {
  id: string;
  paragraphNumber: number;
  content: string;
  feedback: string;
  timestamp: Date;
  isAutomatic: boolean;
}

interface AutoFeedbackState {
  isGenerating: boolean;
  lastProcessedContent: string;
  paragraphCount: number;
  feedbackHistory: ParagraphFeedback[];
  debugMode: boolean;
  isApiConfigured: boolean;
}

const WritingArea: React.FC = () => {
  const [content, setContent] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [activeTab, setActiveTab] = useState('coach');
  const [textType, setTextType] = useState('Narrative');
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [readTime, setReadTime] = useState(0);
  const [issues, setIssues] = useState(0);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const [autoFeedback, setAutoFeedback] = useState<AutoFeedbackState>({
    isGenerating: false,
    lastProcessedContent: '',
    paragraphCount: 0,
    feedbackHistory: [],
    debugMode: false,
    isApiConfigured: false
  });

  const feedbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastContentRef = useRef('');

  useEffect(() => {
    const checkApiConfig = async () => {
      const isConfigured = embeddedOpenAIService.isConfigured();
      setAutoFeedback(prev => ({ ...prev, isApiConfigured: isConfigured }));
      
      if (isConfigured) {
        try {
          const connectionTest = await embeddedOpenAIService.testConnection();
          if (!connectionTest) {
            console.warn('OpenAI API connection test failed');
          }
        } catch (error) {
          console.error('Failed to test OpenAI connection:', error);
        }
      }
    };

    checkApiConfig();
  }, []);

  const detectParagraphCompletion = (currentContent: string, previousContent: string) => {
    const doubleBreakPattern = /\n\n/;
    const hasDoubleBreak = doubleBreakPattern.test(currentContent);
    
    const sentenceEndPattern = /[.!?]\s*$/;
    const endsWithSentence = sentenceEndPattern.test(currentContent.trim());

    const paragraphs = currentContent.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const currentParagraphCount = paragraphs.length;
    
    const lastParagraph = paragraphs[paragraphs.length - 1]?.trim() || '';
    
    const hasMinimumLength = lastParagraph.length >= 30;
    const isNewParagraph = currentParagraphCount > autoFeedback.paragraphCount;
    const hasContentChange = currentContent !== previousContent;
    const hasSignificantContent = lastParagraph.split(' ').length >= 8;
    const hasProperSentence = /[.!?]/.test(lastParagraph);

    const shouldTrigger = hasContentChange && hasMinimumLength && hasSignificantContent && hasProperSentence && (
      (hasDoubleBreak && isNewParagraph) ||
      (endsWithSentence && lastParagraph.length > 50) ||
      (isNewParagraph && lastParagraph.length > 60)
    );

    if (shouldTrigger) {
      return {
        shouldTrigger: true,
        paragraphContent: lastParagraph,
        paragraphNumber: currentParagraphCount,
        allParagraphs: paragraphs
      };
    }

    return { shouldTrigger: false };
  };

  const generateAutomaticFeedback = async (
    paragraphContent: string, 
    paragraphNumber: number, 
    allParagraphs: string[]
  ) => {
    if (!autoFeedback.isApiConfigured) {
      return;
    }

    const existingFeedback = autoFeedback.feedbackHistory.find(
      f => f.content === paragraphContent && f.paragraphNumber === paragraphNumber
    );

    if (existingFeedback) {
      return;
    }

    setAutoFeedback(prev => ({ ...prev, isGenerating: true }));

    try {
      const feedbackRequest: FeedbackRequest = {
        paragraphContent,
        paragraphNumber,
        textType,
        previousParagraphs: allParagraphs.slice(0, -1),
        studentLevel: 'intermediate'
      };

      const feedbackResponse = await embeddedOpenAIService.generateParagraphFeedback(feedbackRequest);
      
      const automaticMessage: ChatMessage = {
        id: `auto_${Date.now()}_${paragraphNumber}`,
        text: feedbackResponse,
        sender: 'ai',
        timestamp: new Date(),
        isAutomatic: true,
        paragraphNumber: paragraphNumber,
        messageType: 'automatic_feedback'
      };

      setChatMessages(prev => [...prev, automaticMessage]);

      const feedbackRecord: ParagraphFeedback = {
        id: automaticMessage.id,
        paragraphNumber,
        content: paragraphContent,
        feedback: feedbackResponse,
        timestamp: new Date(),
        isAutomatic: true
      };

      setAutoFeedback(prev => ({
        ...prev,
        isGenerating: false,
        paragraphCount: paragraphNumber,
        feedbackHistory: [...prev.feedbackHistory, feedbackRecord]
      }));

    } catch (error) {
      console.error('Error generating AI feedback:', error);
      setAutoFeedback(prev => ({ ...prev, isGenerating: false }));
      
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        text: `I'm having trouble generating feedback right now. Please try asking me a question manually!`,
        sender: 'ai',
        timestamp: new Date(),
        isAutomatic: true,
        paragraphNumber: paragraphNumber,
        messageType: 'automatic_feedback'
      };
      setChatMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      text: chatInput,
      sender: 'user',
      timestamp: new Date(),
      messageType: 'manual'
    };

    setChatMessages(prev => [...prev, userMessage]);
    const currentInput = chatInput;
    setChatInput('');
    setIsChatLoading(true);

    try {
      if (!autoFeedback.isApiConfigured) {
        throw new Error('OpenAI API not configured');
      }

      const chatRequest: ChatRequest = {
        userMessage: currentInput,
        textType,
        currentContent: content,
        wordCount,
        context: `Working on paragraph ${autoFeedback.paragraphCount + 1}`
      };

      const aiResponse = await embeddedOpenAIService.generateChatResponse(chatRequest);

      const aiMessage: ChatMessage = {
        id: `ai_${Date.now()}`,
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date(),
        messageType: 'manual'
      };

      setChatMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error('Error generating AI response:', error);
      
      const errorMessage: ChatMessage = {
        id: `ai_error_${Date.now()}`,
        text: autoFeedback.isApiConfigured 
          ? "I'm having trouble responding right now. Please try again!"
          : "AI features are not configured. Please check your OpenAI API settings.",
        sender: 'ai',
        timestamp: new Date(),
        messageType: 'manual'
      };
      
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  useEffect(() => {
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }

    const detection = detectParagraphCompletion(content, lastContentRef.current);
    
    if (detection.shouldTrigger && autoFeedback.isApiConfigured) {
      feedbackTimerRef.current = setTimeout(() => {
        generateAutomaticFeedback(
          detection.paragraphContent!, 
          detection.paragraphNumber!,
          detection.allParagraphs!
        );
      }, 3000);
    }

    lastContentRef.current = content;
    
    const words = content.trim().split(/\s+/).filter(word => word.length > 0).length;
    setWordCount(words);
    setCharCount(content.length);
    setReadTime(Math.ceil(words / 200));

    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
    };
  }, [content, autoFeedback.paragraphCount, autoFeedback.isApiConfigured, textType]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <select 
              value={textType} 
              onChange={(e) => setTextType(e.target.value)}
              className="px-4 py-2 rounded-lg border border-purple-200 bg-white"
            >
              <option>Narrative</option>
              <option>Persuasive</option>
              <option>Expository</option>
              <option>Descriptive</option>
              <option>Creative</option>
            </select>
            <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              Home
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${autoFeedback.isApiConfigured ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-xs text-gray-600">
              AI {autoFeedback.isApiConfigured ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {!autoFeedback.isApiConfigured && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <Lightbulb className="w-5 h-5 text-yellow-600 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">AI Features Not Available</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  To enable automatic feedback and AI chat, please configure your OpenAI API key in the environment variables (VITE_OPENAI_API_KEY).
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-3">Your Writing Prompt</h2>
          <p className="text-gray-600">
            Write an engaging story about a character who discovers something unexpected that changes their life forever. 
            Include vivid descriptions, realistic dialogue, and show the character's emotional journey.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Start writing your amazing story here! Let your creativity flow and bring your ideas to life..."
                className="w-full h-96 p-4 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
              />

              <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
                <div className="flex items-center space-x-4">
                  <span>{wordCount} words</span>
                  <span>{charCount} characters</span>
                  <span>{readTime} min read</span>
                  {autoFeedback.isGenerating && (
                    <div className="flex items-center space-x-1 text-purple-500">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-500"></div>
                      <span>AI is analyzing...</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`${autoFeedback.isApiConfigured ? 'text-green-600' : 'text-gray-400'}`}>
                    AI {autoFeedback.isApiConfigured ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">AI Writing Coach</h3>

            <div className="flex space-x-1 mb-4">
              {[
                { id: 'coach', label: 'Coach', icon: MessageCircle },
                { id: 'progress', label: 'Progress', icon: TrendingUp }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-2 py-2 text-xs rounded ${
                    activeTab === tab.id 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <tab.icon className="w-3 h-3 mx-auto mb-1" />
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'coach' && (
              <div>
                <div className="mb-4 p-3 bg-purple-50 rounded-lg text-xs">
                  {autoFeedback.isApiConfigured ? (
                    <p className="text-purple-700 font-medium">✨ I'll automatically give you AI feedback as you complete paragraphs!</p>
                  ) : (
                    <p className="text-gray-600 font-medium">🤖 Add your OpenAI API key to enable AI features</p>
                  )}
                </div>

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
                      
                      <div className={`p-2 rounded text-xs ${
                        message.sender === 'user' 
                          ? 'bg-blue-100 text-blue-800 ml-4' 
                          : message.isAutomatic
                            ? 'bg-purple-100 text-purple-800 mr-4 border-l-4 border-purple-500'
                            : 'bg-gray-100 text-gray-800 mr-4'
                      }`}>
                        {message.text}
                      </div>
                    </div>
                  ))}
                  
                  {isChatLoading && (
                    <div className="flex items-center space-x-2 text-purple-500 text-xs">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-500"></div>
                      <span>AI is thinking...</span>
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !isChatLoading && autoFeedback.isApiConfigured && handleSendMessage()}
                    placeholder={autoFeedback.isApiConfigured ? "Ask your AI coach anything..." : "AI chat unavailable"}
                    className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:bg-gray-100"
                    disabled={!autoFeedback.isApiConfigured || isChatLoading}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!autoFeedback.isApiConfigured || isChatLoading || !chatInput.trim()}
                    className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400"
                  >
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'progress' && (
              <div>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Words:</span>
                    <span className="font-medium">{wordCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">AI Feedback:</span>
                    <span className="text-purple-600 font-medium">{autoFeedback.feedbackHistory.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Paragraphs:</span>
                    <span className="font-medium">{autoFeedback.paragraphCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">AI Status:</span>
                    <span className={`font-medium ${autoFeedback.isApiConfigured ? 'text-green-600' : 'text-red-600'}`}>
                      {autoFeedback.isApiConfigured ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export { WritingArea };
