import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Save, Download, Upload, Eye, EyeOff, RotateCcw, Sparkles, BookOpen, Target, TrendingUp, Award, CheckCircle, AlertCircle, Star, Lightbulb, MessageSquare, BarChart3, Clock, Zap, Heart, Wand2, PenTool, FileText, Settings, RefreshCw, Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, Copy, Check, X, Plus, Minus, ChevronDown, ChevronUp, Info, HelpCircle, Bot, Send, Timer } from 'lucide-react';
import { EnhancedInlineSuggestions } from './EnhancedInlineSuggestions';
import { ContextualAIPrompts } from './ContextualAIPrompts';
import { EnhancedFeedbackSystem } from './EnhancedFeedbackSystem';
import { generateChatResponse } from '../lib/openai';

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
  const [activePanel, setActivePanel] = useState<'suggestions' | 'prompts' | 'feedback' | 'chat'>('suggestions');
  const [showInlineSuggestions, setShowInlineSuggestions] = useState(true);
  const [showContextualPrompts, setShowContextualPrompts] = useState(true);
  const [assistanceLevel, setAssistanceLevel] = useState<'minimal' | 'moderate' | 'comprehensive'>('moderate');
  const [isExamMode, setIsExamMode] = useState(false);
  const [showFocusMode, setShowFocusMode] = useState(false);
  
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
    const minutes = totalWritingTime / 60;
    return Math.round(wordCount / minutes);
  }, [wordCount, totalWritingTime]);

  // Handle content changes with typing tracking
  const handleContentChange = (newContent: string) => {
    setCurrentContent(newContent);
    onChange?.(newContent);
    onContentChange?.(newContent);
    
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
    
    // Reset typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (lastTypingTime) {
        const typingDuration = (now.getTime() - lastTypingTime.getTime()) / 1000;
        setTotalWritingTime(prev => prev + typingDuration);
      }
    }, 2000);
  };

  // Handle contextual prompt selection
  const handlePromptSelected = async (promptText: string) => {
    setChatInput(promptText);
    setActivePanel('chat');
    
    // Auto-send the prompt
    setTimeout(() => {
      handleChatSend(promptText);
    }, 100);
  };

  // Handle chat functionality
  const handleChatSend = async (messageText?: string) => {
    const message = messageText || chatInput.trim();
    if (!message || isChatLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: message,
      sender: 'user',
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const response = await generateChatResponse({
        userMessage: message,
        textType,
        currentContent,
        wordCount,
        context: `Student is writing a ${textType} story. Current assistance level: ${assistanceLevel}. This is for NSW Selective School test preparation for ages 10-12.`
      });

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'ai',
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "I'm having a small hiccup, but I'm still here to help! 😊 Try asking your question again, or I can give you some general writing tips!",
        sender: 'ai',
        timestamp: new Date()
      };
      
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Initialize welcome message
  useEffect(() => {
    if (chatMessages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        text: `Hi! I'm your AI Writing Buddy! 🤖 I'm here to help you with your ${textType} writing for the NSW Selective test. I can help you with ideas, vocabulary, structure, and making your writing more creative and engaging. What would you like to work on?`,
        sender: 'ai',
        timestamp: new Date()
      };
      setChatMessages([welcomeMessage]);
    }
  }, [textType]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Toggle exam mode
  const handleExamMode = () => {
    setIsExamMode(!isExamMode);
    onTimerStart?.(!isExamMode);
    
    if (!isExamMode) {
      // Entering exam mode - hide AI assistance
      setShowInlineSuggestions(false);
      setShowContextualPrompts(false);
      setActivePanel('chat'); // Keep chat available but limited
    } else {
      // Exiting exam mode - restore AI assistance
      setShowInlineSuggestions(true);
      setShowContextualPrompts(true);
    }
  };

  // Toggle focus mode
  const handleFocusMode = () => {
    setShowFocusMode(!showFocusMode);
    
    if (!showFocusMode) {
      // Entering focus mode
      document.body.style.backgroundColor = '#1a1a1a';
      textareaRef.current?.focus();
    } else {
      // Exiting focus mode
      document.body.style.backgroundColor = '';
    }
  };

  const panelTabs = [
    { id: 'suggestions', label: 'Smart Help', icon: <Sparkles className="w-4 h-4" />, disabled: isExamMode },
    { id: 'prompts', label: 'Questions', icon: <Lightbulb className="w-4 h-4" />, disabled: isExamMode },
    { id: 'feedback', label: 'Feedback', icon: <Star className="w-4 h-4" />, disabled: false },
    { id: 'chat', label: 'AI Buddy', icon: <Bot className="w-4 h-4" />, disabled: false }
  ];

  return (
    <div className={`h-full flex flex-col ${showFocusMode ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
      {/* Header with controls */}
      <div className={`p-4 border-b ${showFocusMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <h2 className={`text-xl font-semibold ${showFocusMode ? 'text-white' : 'text-gray-800'}`}>
              NSW Writing Studio
            </h2>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>{wordCount} words</span>
              <span>•</span>
              <span>{readingTime} min read</span>
              {totalWritingTime > 0 && (
                <>
                  <span>•</span>
                  <span>{calculateWPM()} WPM</span>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Assistance Level */}
            <select
              value={assistanceLevel}
              onChange={(e) => setAssistanceLevel(e.target.value as any)}
              className={`px-3 py-1 rounded border text-sm ${
                showFocusMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300'
              }`}
              disabled={isExamMode}
            >
              <option value="minimal">Minimal Help</option>
              <option value="moderate">Moderate Help</option>
              <option value="comprehensive">Full Support</option>
            </select>
            
            {/* Mode toggles */}
            <button
              onClick={handleExamMode}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                isExamMode
                  ? 'bg-red-100 text-red-700 border border-red-300'
                  : 'bg-blue-100 text-blue-700 border border-blue-300 hover:bg-blue-200'
              }`}
            >
              {isExamMode ? 'Exit Exam Mode' : 'Exam Mode'}
            </button>
            
            <button
              onClick={handleFocusMode}
              className={`p-2 rounded transition-colors ${
                showFocusMode
                  ? 'bg-gray-700 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="Focus Mode"
            >
              {showFocusMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Panel tabs */}
        <div className="flex space-x-1">
          {panelTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && setActivePanel(tab.id as any)}
              disabled={tab.disabled}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activePanel === tab.id
                  ? showFocusMode
                    ? 'bg-gray-700 text-white'
                    : 'bg-blue-100 text-blue-700'
                  : tab.disabled
                    ? 'text-gray-400 cursor-not-allowed'
                    : showFocusMode
                      ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.disabled && <X className="w-3 h-3" />}
            </button>
          ))}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Writing area */}
        <div className="flex-1 flex flex-col">
          {/* Prompt display */}
          {currentPrompt && (
            <div className={`p-4 border-b ${showFocusMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-blue-50'}`}>
              <div className="flex items-start space-x-2">
                <Target className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className={`font-medium ${showFocusMode ? 'text-white' : 'text-blue-800'}`}>
                    Writing Prompt
                  </h4>
                  <p className={`text-sm ${showFocusMode ? 'text-gray-300' : 'text-blue-700'}`}>
                    {currentPrompt}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Text area with inline suggestions */}
          <div className="flex-1 relative">
            {showInlineSuggestions && !isExamMode && (
              <div className="absolute inset-0 pointer-events-none z-10">
                <EnhancedInlineSuggestions
                  content={currentContent}
                  textType={textType}
                  onContentChange={handleContentChange}
                  isEnabled={showInlineSuggestions}
                  assistanceLevel={assistanceLevel}
                />
              </div>
            )}
            
            <div className="h-full p-4">
              <textarea
                ref={textareaRef}
                value={currentContent}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder={`Start writing your ${textType} here... ${isExamMode ? '(Exam Mode - Limited AI assistance)' : '(AI assistance available)'}`}
                className={`w-full h-full resize-none border-none outline-none text-lg leading-relaxed relative z-20 ${
                  showFocusMode 
                    ? 'bg-gray-900 text-white placeholder-gray-500' 
                    : 'bg-transparent text-gray-800 placeholder-gray-400'
                }`}
                style={{ fontFamily: 'Georgia, serif' }}
              />
            </div>
          </div>

          {/* Writing status bar */}
          <div className={`p-3 border-t ${showFocusMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                <span className={showFocusMode ? 'text-gray-300' : 'text-gray-600'}>
                  {wordCount} words • {charCount} characters
                </span>
                {isTyping && (
                  <div className="flex items-center space-x-1 text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs">Writing...</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                {startTime && (
                  <span className={`text-xs ${showFocusMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Started: {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
                <button
                  onClick={onSubmit}
                  disabled={wordCount < 50}
                  className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* AI assistance panel */}
        <div className={`w-96 border-l ${showFocusMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} flex flex-col`}>
          <div className="flex-1 overflow-hidden">
            {activePanel === 'suggestions' && !isExamMode && (
              <div className="h-full overflow-y-auto p-4">
                <h3 className={`font-semibold mb-4 ${showFocusMode ? 'text-white' : 'text-gray-800'}`}>
                  Smart Writing Help
                </h3>
                <div className="space-y-4">
                  <div className={`p-3 rounded-lg ${showFocusMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
                    <div className="flex items-center space-x-2 mb-2">
                      <Sparkles className="w-5 h-5 text-blue-600" />
                      <span className={`font-medium ${showFocusMode ? 'text-white' : 'text-blue-800'}`}>
                        AI Writing Assistant
                      </span>
                    </div>
                    <p className={`text-sm ${showFocusMode ? 'text-gray-300' : 'text-blue-700'}`}>
                      I'm analyzing your writing and will suggest improvements as you type. 
                      Look for the colored underlines in your text!
                    </p>
                  </div>
                  
                  {wordCount > 20 && (
                    <div className={`p-3 rounded-lg ${showFocusMode ? 'bg-gray-700' : 'bg-green-50'}`}>
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className={`font-medium ${showFocusMode ? 'text-white' : 'text-green-800'}`}>
                          Great Progress!
                        </span>
                      </div>
                      <p className={`text-sm ${showFocusMode ? 'text-gray-300' : 'text-green-700'}`}>
                        You're off to a good start. Keep writing and I'll help you make it even better!
                      </p>
                    </div>
                  )}

                  {wordCount > 100 && (
                    <div className={`p-3 rounded-lg ${showFocusMode ? 'bg-gray-700' : 'bg-purple-50'}`}>
                      <div className="flex items-center space-x-2 mb-2">
                        <Award className="w-4 h-4 text-purple-600" />
                        <span className={`font-medium ${showFocusMode ? 'text-white' : 'text-purple-800'}`}>
                          NSW Selective Ready!
                        </span>
                      </div>
                      <p className={`text-sm ${showFocusMode ? 'text-gray-300' : 'text-purple-700'}`}>
                        Your writing is developing well for the selective test. Focus on creative ideas and sophisticated vocabulary.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activePanel === 'prompts' && !isExamMode && (
              <div className="h-full overflow-y-auto">
                <ContextualAIPrompts
                  content={currentContent}
                  textType={textType}
                  wordCount={wordCount}
                  onPromptSelected={handlePromptSelected}
                  assistanceLevel={assistanceLevel}
                  isVisible={true}
                />
              </div>
            )}

            {activePanel === 'feedback' && (
              <div className="h-full overflow-y-auto p-4">
                <EnhancedFeedbackSystem
                  content={currentContent}
                  textType={textType}
                  onFeedbackGenerated={(feedback) => console.log('Feedback generated:', feedback)}
                  assistanceLevel={assistanceLevel}
                />
              </div>
            )}

            {activePanel === 'chat' && (
              <div className="h-full flex flex-col">
                {/* Chat messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          message.sender === 'user'
                            ? 'bg-blue-600 text-white'
                            : showFocusMode
                              ? 'bg-gray-700 text-gray-200'
                              : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                        <p className={`text-xs mt-1 ${
                          message.sender === 'user' 
                            ? 'text-blue-100' 
                            : showFocusMode 
                              ? 'text-gray-400' 
                              : 'text-gray-500'
                        }`}>
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="flex justify-start">
                      <div className={`p-3 rounded-lg ${showFocusMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
                          <span className={`text-sm ${showFocusMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            AI is thinking...
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat input */}
                <div className={`p-4 border-t ${showFocusMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleChatSend()}
                      placeholder={isExamMode ? "Limited help available in exam mode..." : "Ask your AI Writing Buddy anything..."}
                      className={`flex-1 p-2 border rounded-lg text-sm ${
                        showFocusMode
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 placeholder-gray-500'
                      }`}
                      disabled={isChatLoading}
                    />
                    <button
                      onClick={() => handleChatSend()}
                      disabled={!chatInput.trim() || isChatLoading}
                      className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                  {isExamMode && (
                    <p className={`text-xs mt-1 ${showFocusMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      💡 In exam mode, I can still answer questions but won't provide direct writing suggestions.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
