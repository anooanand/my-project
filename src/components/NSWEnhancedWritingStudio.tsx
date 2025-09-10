import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Save, Download, Upload, Eye, EyeOff, RotateCcw, Sparkles, BookOpen, Target, TrendingUp, Award, CheckCircle, AlertCircle, Star, Lightbulb, MessageSquare, BarChart3, Clock, Zap, Heart, Wand2, PenTool, FileText, Settings, RefreshCw, Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, Copy, Check, X, Plus, Minus, ChevronDown, ChevronUp, Info, HelpCircle, Bot, Send, Timer, Brain } from 'lucide-react';
import { EnhancedInlineSuggestions } from './EnhancedInlineSuggestions';
import { ContextualAIPrompts } from './ContextualAIPrompts';
import { EnhancedFeedbackSystem } from './EnhancedFeedbackSystem';
import { EnhancedGrammarChecker } from './EnhancedGrammarChecker';
import { EnhancedVocabularyBuilder } from './EnhancedVocabularyBuilder';
import { EnhancedSentenceAnalyzer } from './EnhancedSentenceAnalyzer';
import { AdvancedAnalyticsDashboard } from './AdvancedAnalyticsDashboard';
import { generateChatResponse } from '../lib/openai';
import { DetailedFeedback } from './EnhancedFeedbackSystem'; // Added import

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
  const [detailedFeedback, setDetailedFeedback] = useState<DetailedFeedback | null>(null); // Added state
  
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

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      setLastTypingTime(null);
    }, 1500); // 1.5 seconds of inactivity to consider typing stopped
  };

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

    const newUserMessage: ChatMessage = {
      id: Date.now().toString(),
      text: chatInput,
      sender: 'user',
      timestamp: new Date(),
    };

    setChatMessages((prevMessages) => [...prevMessages, newUserMessage]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const aiResponse = await generateChatResponse({
        userMessage: chatInput,
        textType: textType,
        currentContent: currentContent,
        wordCount: wordCount,
        context: 'User is asking a question within the writing studio. Provide helpful, concise advice.',
      });

      const newAiMessage: ChatMessage = {
        id: Date.now().toString() + '-ai',
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date(),
      };
      setChatMessages((prevMessages) => [...prevMessages, newAiMessage]);
    } catch (error) {
      console.error('Error sending chat message:', error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString() + '-error',
        text: 'Sorry, I could not process your request. Please try again.',
        sender: 'ai',
        timestamp: new Date(),
      };
      setChatMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsChatLoading(false);
      if (chatEndRef.current) {
        chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Handle timer start/stop
  const handleTimerToggle = () => {
    if (onTimerStart) {
      onTimerStart(!isExamMode);
    }
    setIsExamMode(!isExamMode);
  };

  // Handle submit (e.g., for essay submission)
  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit();
    }
    alert('Essay submitted for review!');
  };

  return (
    <div className="flex flex-col lg:flex-row h-full bg-gray-50 font-sans antialiased">
      {/* Main Writing Area */}
      <div className="flex-1 flex flex-col p-6 bg-white shadow-lg rounded-lg m-4 lg:m-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-extrabold text-gray-900">Writing Studio</h1>
          <div className="flex items-center space-x-4">
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
              onApplySuggestion={(newText) => setCurrentContent(newText)}
            />
          )}
        </div>

        {/* Writing Metrics */}
        <div className="flex justify-between items-center text-gray-600 text-sm">
          <span>Words: {wordCount}</span>
          <span>Characters: {charCount}</span>
          <span>Reading Time: {readingTime} min</span>
          <span>WPM: {calculateWPM()}</span>
          <span>Time: {new Date(totalWritingTime * 1000).toISOString().substr(11, 8)}</span>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-full lg:w-96 bg-white shadow-lg rounded-lg m-4 lg:m-6 p-6 flex flex-col">
        <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
          <button onClick={() => setActivePanel('suggestions')} className={`panel-tab ${activePanel === 'suggestions' ? 'active' : ''}`}>Suggestions</button>
          <button onClick={() => setActivePanel('prompts')} className={`panel-tab ${activePanel === 'prompts' ? 'active' : ''}`}>Prompts</button>
          <button onClick={() => setActivePanel('feedback')} className={`panel-tab ${activePanel === 'feedback' ? 'active' : ''}`}>Feedback</button>
          <button onClick={() => setActivePanel('grammar')} className={`panel-tab ${activePanel === 'grammar' ? 'active' : ''}`}>Grammar</button>
          <button onClick={() => setActivePanel('vocabulary')} className={`panel-tab ${activePanel === 'vocabulary' ? 'active' : ''}`}>Vocabulary</button>
          <button onClick={() => setActivePanel('sentences')} className={`panel-tab ${activePanel === 'sentences' ? 'active' : ''}`}>Sentences</button>
          <button onClick={() => setActivePanel('analytics')} className={`panel-tab ${activePanel === 'analytics' ? 'active' : ''}`}>Analytics</button>
          <button onClick={() => setActivePanel('chat')} className={`panel-tab ${activePanel === 'chat' ? 'active' : ''}`}>AI Chat</button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 -mr-2">
          {activePanel === 'suggestions' && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800">Inline Suggestions</h3>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showInlineSuggestions}
                  onChange={() => setShowInlineSuggestions(!showInlineSuggestions)}
                  className="form-checkbox h-5 w-5 text-blue-600"
                />
                <span>Show inline writing suggestions</span>
              </label>
              <p className="text-gray-600 text-sm">Get real-time suggestions as you type to improve your writing flow and quality.</p>
            </div>
          )}

          {activePanel === 'prompts' && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800">Contextual AI Prompts</h3>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showContextualPrompts}
                  onChange={() => setShowContextualPrompts(!showContextualPrompts)}
                  className="form-checkbox h-5 w-5 text-blue-600"
                />
                <span>Enable contextual prompts</span>
              </label>
              <ContextualAIPrompts
                currentContent={currentContent}
                textType={textType}
                onPromptSelect={(selectedPrompt) => {
                  onPromptChange?.(selectedPrompt);
                  alert(`Prompt selected: ${selectedPrompt}`);
                }}
              />
              <p className="text-gray-600 text-sm">Receive AI-generated prompts tailored to your current writing context and goals.</p>
            </div>
          )}

          {activePanel === 'feedback' && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800">Detailed Feedback</h3>
              <EnhancedFeedbackSystem
                content={currentContent}
                textType={textType}
                assistanceLevel={assistanceLevel}
                onFeedbackGenerated={setDetailedFeedback} // Updated prop
              />
              <p className="text-gray-600 text-sm">Get comprehensive feedback on your writing, including scores and specific areas for improvement.</p>
            </div>
          )}

          {activePanel === 'grammar' && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800">Grammar & Spelling</h3>
              <EnhancedGrammarChecker content={currentContent} />
              <p className="text-gray-600 text-sm">Check your writing for grammar, spelling, and punctuation errors.</p>
            </div>
          )}

          {activePanel === 'vocabulary' && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800">Vocabulary Builder</h3>
              <EnhancedVocabularyBuilder content={currentContent} />
              <p className="text-gray-600 text-sm">Discover new words and phrases to enrich your vocabulary and make your writing more impactful.</p>
            </div>
          )}

          {activePanel === 'sentences' && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800">Sentence Analyzer</h3>
              <EnhancedSentenceAnalyzer content={currentContent} />
              <p className="text-gray-600 text-sm">Analyze your sentence structure, length, and complexity for improved readability.</p>
            </div>
          )}

          {activePanel === 'analytics' && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800">Writing Analytics</h3>
              <AdvancedAnalyticsDashboard
                content={currentContent}
                textType={textType}
                detailedFeedback={detailedFeedback} // Passed detailedFeedback
              />
              <p className="text-gray-600 text-sm">View detailed analytics and insights into your writing progress and performance.</p>
            </div>
          )}

          {activePanel === 'chat' && (
            <div className="flex flex-col h-full">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">AI Chat Assistant</h3>
              <div className="flex-1 overflow-y-auto p-2 border rounded-md bg-gray-50 mb-4">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className={`mb-3 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                    <span className={`inline-block p-2 rounded-lg ${msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                      {msg.text}
                    </span>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="flex">
                <input
                  type="text"
                  className="flex-1 p-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ask your writing assistant..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSendMessage();
                    }
                  }}
                  disabled={isChatLoading}
                />
                <button
                  onClick={handleSendMessage}
                  className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 disabled:bg-gray-300"
                  disabled={isChatLoading}
                >
                  {isChatLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Basic styling for panel tabs (you might have this in your CSS already)
// Add this to your App.css or a relevant CSS file
/*
.panel-tab {
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
  color: #4a5568; // gray-700
  transition: all 0.2s ease-in-out;
}

.panel-tab:hover {
  background-color: #edf2f7; // gray-100
}

.panel-tab.active {
  background-color: #2563eb; // blue-600
  color: white;
}
*/
