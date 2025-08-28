// AI-Powered WritingArea Component with Automatic Feedback
// Save this as: src/components/WritingArea.tsx (replace existing file)

import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, BarChart3, BookOpen, TrendingUp, Lightbulb } from 'lucide-react';
import { openAIService, FeedbackRequest, ChatRequest } from '../lib/openai-service';

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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
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
      const isConfigured = openAIService.isConfigured();
      setAutoFeedback(prev => ({ ...prev, isApiConfigured: isConfigured }));
      
      if (isConfigured) {
        try {
          const connectionTest = await openAIService.testConnection();
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

  const debugLog = (message: string, data?: any) => {
    if (autoFeedback.debugMode) {
      console.log(`[AutoFeedback] ${message}`, data || '');
    }
  };

  const detectParagraphCompletion = (currentContent: string, previousContent: string) => {
    debugLog('Checking paragraph completion', { 
      currentLength: currentContent.length, 
      previousLength: previousContent.length 
    });

    const doubleBreakPattern = /\n\n/;
    const hasDoubleBreak = doubleBreakPattern.test(currentContent);
    
    const singleBreakPattern = /\n/;
    const hasSingleBreak = singleBreakPattern.test(currentContent);
    
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

    debugLog('Detection results', {
      hasDoubleBreak,
      hasSingleBreak,
      endsWithSentence,
      hasMinimumLength,
      isNewParagraph,
      hasContentChange,
      hasSignificantContent,
      hasProperSentence,
      lastParagraphLength: lastParagraph.length,
      currentParagraphCount,
      storedParagraphCount: autoFeedback.paragraphCount
    });

    const shouldTrigger = hasContentChange && hasMinimumLength && hasSignificantContent && hasProperSentence && (
      (hasDoubleBreak && isNewParagraph) ||
      (hasSingleBreak && endsWithSentence && lastParagraph.length > 50) ||
      (isNewParagraph && lastParagraph.length > 60)
    );

    if (shouldTrigger) {
      return {
        shouldTrigger: true,
        paragraphContent: lastParagraph,
        paragraphNumber: currentParagraphCount,
        allParagraphs: paragraphs,
        detectionMethod: hasDoubleBreak ? 'double_break' : hasSingleBreak ? 'single_break' : 'new_paragraph'
      };
    }

    return { shouldTrigger: false };
  };

  const generateAutomaticFeedback = async (
    paragraphContent: string, 
    paragraphNumber: number, 
    allParagraphs: string[],
    detectionMethod: string
  ) => {
    debugLog('Starting AI feedback generation', { 
      paragraphNumber, 
      contentLength: paragraphContent.length,
      detectionMethod 
    });

    if (!autoFeedback.isApiConfigured) {
      debugLog('OpenAI API not configured, skipping automatic feedback');
      return;
    }

    const existingFeedback = autoFeedback.feedbackHistory.find(
      f => f.content === paragraphContent && f.paragraphNumber === paragraphNumber
    );

    if (existingFeedback) {
      debugLog('Duplicate feedback detected, skipping');
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

      const feedbackResponse = await openAIService.generateParagraphFeedback(feedbackRequest);
      
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

      debugLog('AI feedback generated successfully', { 
        messageId: automaticMessage.id,
        paragraphNumber,
        feedbackLength: feedbackResponse.length
      });

    } catch (error) {
      debugLog('Error generating AI feedback', error);
      setAutoFeedback(prev => ({ ...prev, isGenerating: false }));
      
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        text: `I'm having trouble generating feedback right now. Please try asking me a question manually, and I'll be happy to help!`,
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
        context: `The student is working on paragraph ${autoFeedback.paragraphCount + 1} of their ${textType.toLowerCase()} story.`
      };

      const aiResponse = await openAIService.generateChatResponse(chatRequest);

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
          ? "I'm having trouble responding right now. Please try again in a moment!"
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
    debugLog('Content changed', { 
      newLength: content.length, 
      oldLength: lastContentRef.current.length 
    });

    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
      debugLog('Cleared existing timer');
    }

    const detection = detectParagraphCompletion(content, lastContentRef.current);
    
    if (detection.shouldTrigger && autoFeedback.isApiConfigured) {
      debugLog('Paragraph completion detected, setting timer', detection);
      
      feedbackTimerRef.current = setTimeout(() => {
        debugLog('Timer triggered, generating AI feedback');
        generateAutomaticFeedback(
          detection.paragraphContent!, 
          detection.paragraphNumber!,
          detection.allParagraphs!,
          detection.detectionMethod!
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
            Include vivid descriptions, realistic dialogue, and show the character's emotional journey. Make sure your story 
            has a clear beginning, middle, and end with a satisfying conclusion. Focus on showing rather than telling, 
            and use sensory details to bring your story to life.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center space-x-2 mb-4">
                <button className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">Planning Phase</button>
                <button className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm">Start Exam Mode</button>
                <button className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm">Structure Guide</button>
                <button className="px-3 py-1 bg-pink-100 text-pink-800 rounded text-sm">Tips</button>
                <button className="px-3 py-1 bg-purple-100 text-purple-800 rounded text-sm">Focus</button>
              </div>

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
                      <span>AI is analyzing your paragraph...</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`${autoFeedback.isApiConfigured ? 'text-green-600' : 'text-gray-400'}`}>
                    AI Analysis {autoFeedback.isApiConfigured ? 'Active' : 'Inactive'}
                  </span>
                  <span>{issues} issues</span>
                </div>
              </div>

              <button className="w-full mt-4 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
                Submit for Evaluation Report
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Writing Buddy</h3>
            <p className="text-gray-600 text-sm mb-4">Your AI writing assistant</p>

            <div className="flex space-x-1 mb-4">
              {[
                { id: 'coach', label: 'Coach', icon: MessageCircle },
                { id: 'analysis', label: 'Analysis', icon: BarChart3 },
                { id: 'vocabulary', label: 'Vocabulary', icon: BookOpen },
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
                <h4 className="font-medium text-gray-800 mb-3">AI Coach</h4>
                
                <div className="mb-4 p-3 bg-purple-50 rounded-lg text-xs">
                  {autoFeedback.isApiConfigured ? (
                    <>
                      <p className="text-purple-700 font-medium">✨ I'll automatically give you AI-powered feedback as you complete each paragraph!</p>
                      <p className="text-purple-600 mt-1">Powered by advanced AI to help improve your writing.</p>
                    </>
                  ) : (
                    <>
                      <p className="text-gray-600 font-medium">🤖 AI features are currently unavailable</p>
                      <p className="text-gray-500 mt-1">Configure OpenAI API to enable automatic feedback.</p>
                    </>
                  )}
                </div>

                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                  {chatMessages.map(message => (
                    <div key={message.id} className="space-y-1">
                      {message.isAutomatic && (
                        <div className="text-center">
                          <span className="text-xs text-purple-300 bg-purple-800 px-2 py-1 rounded-full">
                            ✨ AI Auto Feedback - Paragraph {message.paragraphNumber}
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

                <div className="space-y-2 mb-4">
                  <p className="text-xs text-gray-600">Ask your AI Writing Buddy anything!</p>
                  {[
                    "How can I improve my introduction?",
                    "What's a good synonym for 'said'?",
                    "Help me with my conclusion",
                    "How can I add more descriptive details?",
                    "What makes good dialogue?"
                  ].map(suggestion => (
                    <button
                      key={suggestion}
                      onClick={() => setChatInput(suggestion)}
                      className="block w-full text-left text-xs text-purple-600 hover:text-purple-800 p-1 disabled:text-gray-400"
                      disabled={!autoFeedback.isApiConfigured}
                    >
                      • "{suggestion}"
                    </button>
                  ))}
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
                    className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'progress' && (
              <div>
                <h4 className="font-medium text-gray-800 mb-3">Writing Progress</h4>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Words Written:</span>
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
                  
                  {autoFeedback.feedbackHistory.length > 0 && (
                    <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                      <h5 className="text-xs font-medium text-purple-800 mb-2">Recent AI Feedback</h5>
                      <div className="space-y-2">
                        {autoFeedback.feedbackHistory.slice(-3).map(feedback => (
                          <div key={feedback.id} className="text-xs text-purple-700">
                            <span className="font-medium">P{feedback.paragraphNumber}:</span> {feedback.feedback.substring(0, 50)}...
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'analysis' && (
              <div>
                <h4 className="font-medium text-gray-800 mb-3">AI Analysis</h4>
                <p className="text-xs text-gray-600">
                  {autoFeedback.isApiConfigured 
                    ? "Real-time AI writing analysis will appear here." 
                    : "AI analysis requires OpenAI API configuration."}
                </p>
              </div>
            )}

            {activeTab === 'vocabulary' && (
              <div>
                <h4 className="font-medium text-gray-800 mb-3">Vocabulary</h4>
                <p className="text-xs text-gray-600">
                  {autoFeedback.isApiConfigured 
                    ? "AI-powered vocabulary suggestions will appear here." 
                    : "Vocabulary suggestions require OpenAI API configuration."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WritingArea;