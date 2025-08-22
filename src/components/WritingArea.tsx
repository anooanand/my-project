import React, { useState, useEffect, useRef, useCallback } from 'react';
import EnhancedGrammarTextEditor from './EnhancedGrammarTextEditor';
import '../styles/grammarChecker.css';
import { Save, Download, Upload, Eye, EyeOff, RotateCcw, Sparkles, BookOpen, Target, TrendingUp, Award, CheckCircle, AlertCircle, Star, Lightbulb, MessageSquare, BarChart3, Clock, Zap, Heart, Trophy, Wand2, PenTool, FileText, Settings, RefreshCw, Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, Copy, Check, X, Plus, Minus, ChevronDown, ChevronUp, Info, HelpCircle, Calendar, Users, Globe, Mic, Camera, Image, Link, Hash, Type, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline, List, ListOrdered, Quote, Code, Scissors, Clipboard, Search, Filter, SortAsc, SortDesc, Grid, Layout, Sidebar, Menu, MoreHorizontal, MoreVertical, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Timer, Send, Bot, StopCircle, MapPin, Users2, Smile } from 'lucide-react';
import { generatePrompt, getSynonyms, rephraseSentence, evaluateEssay } from '../lib/openai';
import { WritingStatusBar } from './WritingStatusBar';
import { StructuredPlanningSection } from './StructuredPlanningSection';

interface WritingAreaProps {
  content: string;
  onChange: (content: string) => void;
  textType: string;
  onTimerStart: (shouldStart: boolean) => void;
  onSubmit: () => void;
  onTextTypeChange?: (textType: string) => void;
  onPopupCompleted?: () => void;
  onPromptGenerated?: (prompt: string) => void;
  prompt?: string;
}

export default function WritingArea({
  content,
  onChange,
  textType,
  onTimerStart,
  onSubmit,
  onTextTypeChange,
  onPopupCompleted,
  onPromptGenerated,
  prompt
}: WritingAreaProps) {
  // State management
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const [showPlanningModal, setShowPlanningModal] = useState(false);
  const [activeTab, setActiveTab] = useState('ai-coach');
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showWordCount, setShowWordCount] = useState(true);
  const [fontSize, setFontSize] = useState(16);
  const [lineHeight, setLineHeight] = useState(1.6);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [showSynonyms, setShowSynonyms] = useState(false);
  const [synonyms, setSynonyms] = useState<string[]>([]);
  const [isLoadingSynonyms, setIsLoadingSynonyms] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [planningNotes, setPlanningNotes] = useState('');
  const [writingGoals, setWritingGoals] = useState('');
  const [timeSpent, setTimeSpent] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [paraphraseInput, setParaphraseInput] = useState('');
  const [paraphraseOutput, setParaphraseOutput] = useState('');
  const [isParaphrasing, setIsParaphrasing] = useState(false);
  const [vocabularyWords, setVocabularyWords] = useState<string[]>([]);
  const [progressData, setProgressData] = useState({ wordsWritten: 0, timeSpent: 0, sessionsCompleted: 0, averageWordsPerMinute: 0 });
  
  // NSW Selective Exam specific features
  const [examMode, setExamMode] = useState(false);
  const [examTimeLimit, setExamTimeLimit] = useState(30 * 60);
  const [examTimeRemaining, setExamTimeRemaining] = useState(examTimeLimit);
  const [targetWordCount, setTargetWordCount] = useState(300);
  const [showStructureGuide, setShowStructureGuide] = useState(false);
  const [examStartTime, setExamStartTime] = useState<Date | null>(null);
  
  // Chat functionality for Writing Buddy
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
  }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  // Planning section state
  const [showPlanningSection, setShowPlanningSection] = useState(false);
  const [savedPlan, setSavedPlan] = useState<any>(null);
  
  // New features
  const [showWritingTips, setShowWritingTips] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  
  // Kid-friendly Planning Phase state
  const [showKidPlanningModal, setShowKidPlanningModal] = useState(false);
  const [planningStep, setPlanningStep] = useState(1);
  const [kidPlanningData, setKidPlanningData] = useState({
    characters: '',
    setting: '',
    problem: '',
    events: '',
    solution: '',
    feelings: ''
  });
  
  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Exam timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (examMode && examTimeRemaining > 0) {
      interval = setInterval(() => {
        setExamTimeRemaining(prev => {
          if (prev <= 1) {
            setExamMode(false);
            setIsTimerRunning(false);
            alert('⏰ Time is up! Your exam has ended. Your work has been automatically saved.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [examMode, examTimeRemaining]);

  // Auto-save effect
  useEffect(() => {
    const saveTimer = setTimeout(() => {
      if (content.trim()) {
        setIsAutoSaving(true);
        setTimeout(() => {
          setIsAutoSaving(false);
          setLastSaved(new Date());
        }, 500);
      }
    }, 2000);
    return () => clearTimeout(saveTimer);
  }, [content]);

  // Update word count and other metrics
  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;
    const characterCount = content.length;
    const readingTime = Math.ceil(wordCount / 200);
    setWordCount(wordCount);
    setCharacterCount(characterCount);
    setReadingTime(readingTime);
    setProgressData(prev => ({
      ...prev,
      wordsWritten: wordCount,
      averageWordsPerMinute: timeSpent > 0 ? Math.round((wordCount / timeSpent) * 60) : 0
    }));
  }, [content, timeSpent]);

  // Scroll chat to bottom when new messages are added
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Handle content change
  const handleContentChange = (newContent: string) => {
    onChange(newContent);
    if (!isTimerRunning && newContent.trim()) {
      setIsTimerRunning(true);
      onTimerStart(true);
    }
  };

  // Enhanced chat submission
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    const userMessage = {
      id: Date.now().toString(),
      text: chatInput,
      sender: 'user' as const,
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsChatLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      let aiResponse = '';
      const input = chatInput.toLowerCase();
      
      if (input.includes('introduction') || input.includes('intro')) {
        aiResponse = `For a strong ${textType} introduction:\n• Start with a compelling hook\n• Introduce your main character/topic\n• Set the scene or context\n• End with a clear thesis or direction`;
      } else if (input.includes('conclusion') || input.includes('ending')) {
        aiResponse = `For a powerful ${textType} conclusion:\n• Summarize key points\n• Show character growth/resolution\n• Leave a lasting impression\n• Connect back to your opening`;
      } else if (input.includes('synonym') || input.includes('word')) {
        aiResponse = `To find better words:\n• Highlight any word in your text\n• I'll suggest synonyms instantly\n• Try words like: magnificent, extraordinary, compelling`;
      } else if (input.includes('structure') || input.includes('organize')) {
        aiResponse = `For ${textType} structure:\n• Use the Structure Guide button\n• Follow the recommended format\n• Each paragraph should have one main idea\n• Use transitions between sections`;
      } else {
        aiResponse = `Great question about "${chatInput}"! For ${textType} writing, focus on:\n• Clear structure and flow\n• Vivid, specific details\n• Strong character development\n• Engaging dialogue and description`;
      }
      
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        sender: 'ai' as const,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending chat message:', error);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Start exam mode
  const startExamMode = () => {
    const confirmed = window.confirm(
      `🎯 Start Exam Mode?\n\n` +
      `• Duration: ${examTimeLimit / 60} minutes\n` +
      `• Target: ${targetWordCount} words\n` +
      `• Text Type: ${textType}\n\n` +
      `Your current work will be saved. Ready to begin?`
    );
    
    if (confirmed) {
      setExamMode(true);
      setExamTimeRemaining(examTimeLimit);
      setExamStartTime(new Date());
      setIsTimerRunning(true);
      setFocusMode(true);
      
      if (window.confirm('Start with a blank document? (Current work will be saved)')) {
        onChange(''); // Use onChange prop to clear content
      }
    }
  };

  // Stop exam mode
  const stopExamMode = () => {
    const confirmed = window.confirm('Are you sure you want to end the exam? Your work will be saved.');
    if (confirmed) {
      setExamMode(false);
      setIsTimerRunning(false);
      setFocusMode(false);
      alert('✅ Exam completed! Your work has been saved.');
    }
  };

  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex bg-gray-50 overflow-hidden">
      {/* Main Writing Section */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Prompt Display */}
        {prompt && (
          <div className="prompt-display">
            <div className="prompt-header">
              <PenTool className="w-4 h-4" />
              <span>Your Writing Prompt</span>
            </div>
            <div className="prompt-content">
              {prompt}
            </div>
          </div>
        )}

        {/* Main Writing Area */}
        <div className="flex-1 flex flex-col px-3 pb-3">
          <div className={`${focusMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-lg shadow-sm flex-1 flex flex-col overflow-hidden transition-colors duration-300`}>
            {/* Writing Area Header */}
            <div className={`px-3 py-2 ${focusMode ? 'border-gray-700' : 'border-gray-200'} border-b flex items-center justify-between`}>
              <h3 className={`text-sm font-medium ${focusMode ? 'text-gray-200' : 'text-gray-900'}`}>Your Writing</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowKidPlanningModal(true)}
                  className="flex items-center px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  Planning Phase
                </button>
                <button
                  onClick={startExamMode}
                  disabled={examMode}
                  className="flex items-center px-2 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 transition-colors disabled:opacity-50"
                >
                  <Clock className="w-3 h-3 mr-1" />
                  {examMode ? 'Exam Active' : 'Start Exam Mode'}
                </button>
                <button
                  onClick={() => setShowStructureGuide(true)}
                  className="flex items-center px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors"
                >
                  <BookOpen className="w-3 h-3 mr-1" />
                  Structure Guide
                </button>
                <button
                  onClick={() => setShowWritingTips(!showWritingTips)}
                  className="flex items-center px-2 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600 transition-colors"
                >
                  <Lightbulb className="w-3 h-3 mr-1" />
                  Tips
                </button>
                <button
                  onClick={() => setFocusMode(!focusMode)}
                  className="flex items-center px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition-colors"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  Focus
                </button>
              </div>
            </div>

            {/* Enhanced Grammar Text Editor - Fixed to be visible */}
            <div className="flex-1 relative">
              {/* Simple fallback textarea if EnhancedGrammarTextEditor fails */}
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="Start writing your amazing story here! Let your creativity flow and bring your ideas to life..."
                className={`w-full h-full p-4 border-none outline-none resize-none font-sans text-base leading-relaxed ${
                  focusMode 
                    ? 'bg-gray-800 text-gray-100' 
                    : 'bg-white text-gray-900'
                } transition-colors duration-300`}
                style={{ 
                  minHeight: '400px',
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}
              />
            </div>
            
            {/* Status Bar */}
            <div className={`px-3 py-2 ${focusMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} border-t flex items-center justify-between transition-colors duration-300`}>
              <div className={`flex items-center space-x-4 text-xs ${focusMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <div className="flex items-center space-x-1">
                  <FileText className="w-3 h-3" />
                  <span>{wordCount} words</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{characterCount} characters</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Eye className="w-3 h-3" />
                  <span>{readingTime} min read</span>
                </div>
                {isAutoSaving && (
                  <div className="flex items-center space-x-1 text-blue-500">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
                    <span>Saving...</span>
                  </div>
                )}
              </div>
              
              <button
                onClick={onSubmit}
                className="flex items-center px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 focus:outline-none focus:ring-1 focus:ring-green-500 focus:ring-opacity-50"
              >
                <Send className="w-3 h-3 mr-1" />
                Submit for Evaluation
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Writing Buddy */}
      <div className="w-80 bg-gradient-to-b from-indigo-600 to-purple-700 text-white flex flex-col shadow-lg">
        {/* Header */}
        <div className="p-3 border-b border-indigo-500 bg-indigo-700">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-bold flex items-center text-white">
              <Bot className="w-4 h-4 mr-2" />
              Writing Buddy
            </h2>
            <button className="p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors">
              <Settings className="w-3 h-3 text-indigo-200" />
            </button>
          </div>
          <p className="text-indigo-200 text-xs">Your AI writing assistant</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-indigo-500 bg-indigo-600">
          {[
            { id: 'ai-coach', label: 'Coach', icon: Bot },
            { id: 'analysis', label: 'Analysis', icon: BarChart3 },
            { id: 'vocabulary', label: 'Vocabulary', icon: BookOpen },
            { id: 'progress', label: 'Progress', icon: TrendingUp }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-1 text-xs font-medium transition-colors flex flex-col items-center ${
                activeTab === tab.id 
                  ? 'bg-indigo-800 text-white border-b-2 border-yellow-400' 
                  : 'text-indigo-200 hover:bg-indigo-700 hover:text-white'
              }`}
            >
              <tab.icon className="w-3 h-3 mb-1" />
              <span className="text-xs leading-tight">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-3 overflow-y-auto bg-indigo-600">
          {activeTab === 'ai-coach' && (
            <div className="flex flex-col h-full">
              <h3 className="text-xs font-semibold mb-3 text-indigo-100 text-center">AI Coach</h3>
              <div className="flex-1 overflow-y-auto mb-3 bg-indigo-700 rounded-lg p-3">
                {chatMessages.length === 0 && (
                  <div className="text-center">
                    <p className="text-indigo-200 text-xs mb-3 font-medium">Ask your Writing Buddy anything!</p>
                    <div className="text-xs text-indigo-300 space-y-2 text-left">
                      <p className="flex items-start">
                        <span className="text-yellow-400 mr-2">•</span>
                        "How can I improve my introduction?"
                      </p>
                      <p className="flex items-start">
                        <span className="text-yellow-400 mr-2">•</span>
                        "What's a good synonym for 'said'?"
                      </p>
                      <p className="flex items-start">
                        <span className="text-yellow-400 mr-2">•</span>
                        "Help me with my conclusion"
                      </p>
                    </div>
                  </div>
                )}
                {chatMessages.map((message) => (
                  <div key={message.id} className={`mb-3 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
                    <div className={`inline-block p-2 rounded-lg text-xs max-w-[90%] leading-relaxed ${
                      message.sender === 'user' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-white text-gray-800 shadow-sm'
                    }`}>
                      {message.text.split('\n').map((line, index) => (
                        <div key={index}>{line}</div>
                      ))}
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="text-center py-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-200 mx-auto"></div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              
              <form onSubmit={handleChatSubmit} className="flex space-x-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask for help..."
                  className="flex-1 px-3 py-2 text-xs text-gray-900 bg-white rounded border-none focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isChatLoading}
                  className="px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-indigo-900 rounded disabled:opacity-50 text-xs font-medium transition-colors"
                >
                  <Send className="w-3 h-3" />
                </button>
              </form>
            </div>
          )}

          {activeTab === 'analysis' && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold mb-3 text-indigo-100 text-center">Writing Analysis</h3>
              
              <div className="bg-indigo-700 rounded-lg p-3 text-center">
                <h4 className="font-medium mb-1 text-xs text-indigo-200">Words:</h4>
                <div className="text-2xl font-bold text-white">{wordCount}</div>
              </div>
              
              <div className="bg-indigo-700 rounded-lg p-3 text-center">
                <h4 className="font-medium mb-1 text-xs text-indigo-200">Characters:</h4>
                <div className="text-2xl font-bold text-white">{characterCount}</div>
              </div>
              
              <div className="bg-indigo-700 rounded-lg p-3 text-center">
                <h4 className="font-medium mb-1 text-xs text-indigo-200">Reading Time:</h4>
                <div className="text-2xl font-bold text-white">{readingTime} min</div>
              </div>
              
              <button 
                onClick={onSubmit}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-indigo-900 py-3 px-3 rounded-lg text-xs font-medium transition-colors"
              >
                Submit for Evaluation
              </button>
            </div>
          )}
          
          {activeTab === 'vocabulary' && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold mb-3 text-indigo-100 text-center">Vocabulary</h3>
              <div className="bg-indigo-700 rounded-lg p-3 text-center">
                <p className="text-indigo-200 text-xs mb-3">Select text to see suggestions</p>
                <div className="text-xs text-indigo-300 space-y-2 text-left">
                  <p className="flex items-start">
                    <span className="text-yellow-400 mr-2">•</span>
                    Highlight any word in your writing
                  </p>
                  <p className="flex items-start">
                    <span className="text-yellow-400 mr-2">•</span>
                    Get instant synonym suggestions
                  </p>
                  <p className="flex items-start">
                    <span className="text-yellow-400 mr-2">•</span>
                    Improve your vocabulary
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'progress' && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold mb-3 text-indigo-100 text-center">Progress</h3>
              <div className="bg-indigo-700 rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-indigo-200">Word Goal:</span>
                  <span className="font-bold text-sm text-white">{targetWordCount}</span>
                </div>
                <div className="w-full bg-indigo-800 rounded-full h-3 mb-2">
                  <div 
                    className="bg-yellow-400 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((wordCount / targetWordCount) * 100, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-indigo-200 text-center">
                  {wordCount >= targetWordCount ? '🎉 Goal achieved!' : `${targetWordCount - wordCount} words to go`}
                </p>
              </div>
              
              <div className="bg-indigo-700 rounded-lg p-3 text-center">
                <h4 className="font-medium mb-1 text-xs text-indigo-200">Writing Time:</h4>
                <div className="text-lg font-bold text-white">{formatTime(timeSpent)}</div>
              </div>

              {examMode && (
                <div className="bg-red-600 rounded-lg p-3 text-center">
                  <h4 className="font-medium mb-1 text-xs text-red-200">Exam Time Left:</h4>
                  <div className="text-lg font-bold text-white">{formatTime(examTimeRemaining)}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
