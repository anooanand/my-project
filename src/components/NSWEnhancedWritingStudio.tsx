import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Save, Download, Upload, Eye, EyeOff, RotateCcw, Sparkles, BookOpen, Target, TrendingUp, Award, CheckCircle, AlertCircle, Star, Lightbulb, MessageSquare, BarChart3, Clock, Zap, Heart, Wand2, PenTool, FileText, Settings, RefreshCw, Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, Copy, Check, X, Plus, Minus, ChevronDown, ChevronUp, Info, HelpCircle, Bot, Send, Timer, Brain } from 'lucide-react';
import { EnhancedInlineSuggestions } from './EnhancedInlineSuggestions';
import { ContextualAIPrompts } from './ContextualAIPrompts';
import { EnhancedFeedbackSystem } from './EnhancedFeedbackSystem';
import { EnhancedGrammarChecker } from './EnhancedGrammarChecker';
import { EnhancedVocabularyBuilder } from './EnhancedVocabularyBuilder';
import { EnhancedSentenceAnalyzer } from './EnhancedSentenceAnalyzer';
import { AdvancedAnalyticsDashboard } from './AdvancedAnalyticsDashboard';
import { generateChatResponse, getNSWSelectiveFeedback } from '../lib/openai';
import { DetailedFeedback } from './EnhancedFeedbackSystem';

interface NSWEnhancedWritingStudioProps {
  content?: string;
  onChange?: (content: string) => void;
  textType?: string;
  onTimerStart?: (shouldStart: boolean) => void;
  onSubmit?: () => void;
  onTextTypeChange?: (textType: string) => void;
  prompt?: string;
  initialContent?: string;
  onContentChange?: (content: string) => void;
  onPromptChange?: (prompt: string) => void;
}

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export function NSWEnhancedWritingStudio({
  content = '',
  onChange,
  textType = 'narrative',
  onTimerStart,
  onSubmit,
  onTextTypeChange,
  prompt = '',
  initialContent = '',
  onContentChange,
  onPromptChange
}: NSWEnhancedWritingStudioProps) {
  // Content state
  const [currentContent, setCurrentContent] = useState(content || initialContent || '');
  const [currentPrompt, setCurrentPrompt] = useState(prompt || '');
  
  // UI state
  const [activePanel, setActivePanel] = useState<'suggestions' | 'prompts' | 'feedback' | 'grammar' | 'vocabulary' | 'sentences' | 'analytics' | 'chat'>('suggestions');
  const [showInlineSuggestions, setShowInlineSuggestions] = useState(true);
  const [showContextualPrompts, setShowContextualPrompts] = useState(true);
  const [assistanceLevel, setAssistanceLevel] = useState<'minimal' | 'moderate' | 'comprehensive'>('moderate');
  const [isExamMode, setIsExamMode] = useState(false);
  const [showFocusMode, setShowFocusMode] = useState(false);
  const [detailedFeedback, setDetailedFeedback] = useState<DetailedFeedback | null>(null);
  
  // Auto-analysis state
  const [autoAnalysisTimeout, setAutoAnalysisTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalyzedContent, setLastAnalyzedContent] = useState('');
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  // Writing metrics
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [totalWritingTime, setTotalWritingTime] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [lastTypingTime, setLastTypingTime] = useState<Date | null>(null);
  
  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Calculate writing metrics
  const wordCount = currentContent.trim() ? currentContent.trim().split(/\s+/).length : 0;
  const charCount = currentContent.length;
  const readingTime = Math.ceil(wordCount / 200);
  
  const calculateWPM = useCallback(() => {
    if (totalWritingTime === 0 || wordCount === 0) return 0;
    return Math.round((wordCount / totalWritingTime) * 60);
  }, [totalWritingTime, wordCount]);

  // Auto-analysis function
  const triggerAutoAnalysis = useCallback(async (content: string) => {
    // Only analyze if content is substantial and different from last analysis
    if (content.length < 50 || content === lastAnalyzedContent || isAnalyzing) {
      return;
    }

    setIsAnalyzing(true);
    try {
      const feedback = await getNSWSelectiveFeedback(content, textType, assistanceLevel);
      setDetailedFeedback(feedback);
      setLastAnalyzedContent(content);
      
      // Auto-switch to feedback panel if not already there
      if (activePanel !== 'feedback') {
        setActivePanel('feedback');
      }
    } catch (error) {
      console.error('Auto-analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [textType, assistanceLevel, lastAnalyzedContent, isAnalyzing, activePanel]);

  // Handle content changes with auto-analysis
  const handleContentChange = (newContent: string) => {
    setCurrentContent(newContent);
    
    if (onChange) {
      onChange(newContent);
    }
    
    if (onContentChange) {
      onContentChange(newContent);
    }

    const now = new Date();
    
    // Start timing if this is the first character
    if (!startTime && newContent.length > 0) {
      setStartTime(now);
    }
    
    // Track typing activity
    if (!isTyping) {
      setIsTyping(true);
      setLastTypingTime(now);
    }

    // Clear existing timeouts
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (autoAnalysisTimeout) {
      clearTimeout(autoAnalysisTimeout);
    }

    // Set typing timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      setLastTypingTime(null);
    }, 1500);

    // Set auto-analysis timeout (trigger analysis 3 seconds after user stops typing)
    const analysisTimeout = setTimeout(() => {
      triggerAutoAnalysis(newContent);
    }, 3000);
    
    setAutoAnalysisTimeout(analysisTimeout);
  };

  // Clean up timeouts
  useEffect(() => {
    return () => {
      if (autoAnalysisTimeout) {
        clearTimeout(autoAnalysisTimeout);
      }
    };
  }, [autoAnalysisTimeout]);

  // Effect for tracking total writing time
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTyping && startTime) {
      interval = setInterval(() => {
        setTotalWritingTime(Math.floor((new Date().getTime() - startTime.getTime()) / 1000));
      }, 1000);
    } else if (!isTyping && startTime && lastTypingTime) {
      // Add any remaining time if typing stopped
      setTotalWritingTime(prev => prev + Math.floor((new Date().getTime() - lastTypingTime.getTime()) / 1000));
    }
    return () => clearInterval(interval);
  }, [isTyping, startTime, lastTypingTime]);

  // Handle chat message sending
  const handleSendMessage = async () => {
    if (chatInput.trim() === '') return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: chatInput,
      sender: 'user',
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const response = await generateChatResponse({
        userMessage: chatInput,
        textType,
        currentContent,
        wordCount,
        context: `User is currently writing a ${textType} piece with ${wordCount} words.`
      });

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'ai',
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I'm having trouble connecting right now. Please try again in a moment! 😊",
        sender: 'ai',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Handle timer start/stop
  const handleTimerToggle = () => {
    if (onTimerStart) {
      onTimerStart(!isExamMode);
    }
    setIsExamMode(!isExamMode);
  };

  // Handle submit (e.g., for essay submission)
  const handleSubmit = async () => {
    if (onSubmit) {
      onSubmit();
    }

    // Trigger the feedback generation
    setIsAnalyzing(true);
    try {
      const feedback = await getNSWSelectiveFeedback(currentContent, textType, assistanceLevel);
      setDetailedFeedback(feedback);
      setActivePanel("feedback");
    } catch (error) {
      console.error('Manual analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  return (
    <div className="flex flex-col lg:flex-row h-full bg-gray-50 font-sans antialiased">
      {/* Main Writing Area */}
      <div className="flex-1 flex flex-col p-6 bg-white shadow-lg rounded-lg m-4 lg:m-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-extrabold text-gray-900">Writing Studio</h1>
          <div className="flex items-center space-x-4">
            {isAnalyzing && (
              <div className="flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-md text-sm">
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </div>
            )}
            <button
              onClick={handleTimerToggle}
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              {isExamMode ? <Pause className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
              {isExamMode ? 'Pause Exam' : 'Start Exam'}
            </button>
            <button
              onClick={handleSubmit}
              className="flex items-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
            >
              <Check className="w-5 h-5 mr-2" />
              Submit Essay
            </button>
          </div>
        </div>

        {/* Prompt Display */}
        {currentPrompt && (
          <div className="bg-blue-50 border-l-4 border-blue-400 text-blue-800 p-4 mb-4 rounded-md" role="alert">
            <div className="flex items-center">
              <Info className="w-5 h-5 mr-2" />
              <p className="font-semibold">Writing Prompt:</p>
            </div>
            <p className="ml-7 text-sm">{currentPrompt}</p>
          </div>
        )}

        {/* Textarea */}
        <div className="relative flex-1 mb-4">
          <textarea
            ref={textareaRef}
            className={`w-full h-full p-4 text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none
              ${showFocusMode ? 'font-mono' : ''}`}
            value={currentContent}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Start writing your essay here..."
          />
          {showInlineSuggestions && (
            <EnhancedInlineSuggestions
              text={currentContent}
              textType={textType}
              onSuggestionApply={(suggestion) => {
                // Handle suggestion application
                console.log('Applying suggestion:', suggestion);
              }}
            />
          )}
        </div>

        {/* Writing Statistics */}
        <div className="flex justify-between items-center text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
          <div className="flex space-x-6">
            <span>Words: <strong>{wordCount}</strong></span>
            <span>Characters: <strong>{charCount}</strong></span>
            <span>Reading Time: <strong>{readingTime} min</strong></span>
            <span>WPM: <strong>{calculateWPM()}</strong></span>
          </div>
          <div className="flex items-center space-x-2">
            {isTyping && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>}
            <span>Writing Time: <strong>{Math.floor(totalWritingTime / 60)}:{(totalWritingTime % 60).toString().padStart(2, '0')}</strong></span>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-96 bg-white shadow-lg rounded-lg m-4 lg:m-6 flex flex-col">
        {/* Panel Navigation */}
        <div className="flex flex-wrap border-b border-gray-200 p-2">
          {[
            { key: 'suggestions', icon: Sparkles, label: 'Suggestions' },
            { key: 'prompts', icon: Lightbulb, label: 'Prompts' },
            { key: 'feedback', icon: MessageSquare, label: 'Analysis' },
            { key: 'grammar', icon: CheckCircle, label: 'Grammar' },
            { key: 'vocabulary', icon: BookOpen, label: 'Vocab' },
            { key: 'sentences', icon: PenTool, label: 'Sentences' },
            { key: 'analytics', icon: BarChart3, label: 'Analytics' },
            { key: 'chat', icon: Bot, label: 'Chat' }
          ].map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setActivePanel(key as any)}
              className={`flex items-center px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                activePanel === key
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4 mr-1" />
              {label}
            </button>
          ))}
        </div>

        {/* Panel Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activePanel === 'suggestions' && (
            <EnhancedInlineSuggestions
              text={currentContent}
              textType={textType}
              onSuggestionApply={(suggestion) => {
                console.log('Applying suggestion:', suggestion);
              }}
            />
          )}

          {activePanel === 'prompts' && showContextualPrompts && (
            <ContextualAIPrompts
              textType={textType}
              currentContent={currentContent}
              onPromptSelect={(prompt) => {
                setCurrentPrompt(prompt);
                if (onPromptChange) {
                  onPromptChange(prompt);
                }
              }}
            />
          )}

          {activePanel === 'feedback' && (
            <EnhancedFeedbackSystem
              feedback={detailedFeedback}
              isLoading={isAnalyzing}
              onRefresh={() => handleSubmit()}
            />
          )}

          {activePanel === 'grammar' && (
            <EnhancedGrammarChecker
              text={currentContent}
              onCorrection={(correction) => {
                console.log('Applying grammar correction:', correction);
              }}
            />
          )}

          {activePanel === 'vocabulary' && (
            <EnhancedVocabularyBuilder
              text={currentContent}
              textType={textType}
              onWordReplace={(original, replacement) => {
                const newContent = currentContent.replace(original, replacement);
                handleContentChange(newContent);
              }}
            />
          )}

          {activePanel === 'sentences' && (
            <EnhancedSentenceAnalyzer
              text={currentContent}
              onSentenceImprove={(original, improved) => {
                const newContent = currentContent.replace(original, improved);
                handleContentChange(newContent);
              }}
            />
          )}

          {activePanel === 'analytics' && (
            <AdvancedAnalyticsDashboard
              content={currentContent}
              textType={textType}
              writingTime={totalWritingTime}
              wordCount={wordCount}
            />
          )}

          {activePanel === 'chat' && (
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto mb-4 space-y-3">
                {chatMessages.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <Bot className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-sm">Ask your Writing Buddy anything!</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Into the unknown? Be sure to include the emotions you feel and any challenges you face along the way!
                    </p>
                  </div>
                )}
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                        message.sender === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {message.text}
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-800 max-w-xs px-3 py-2 rounded-lg text-sm">
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask your Writing Buddy..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isChatLoading || chatInput.trim() === ''}
                  className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
