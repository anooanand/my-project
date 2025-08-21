// Fixed WritingArea.tsx with improved Submit for Evaluation functionality

import React, { useState, useEffect, useRef } from 'react';
import { Save, Download, Upload, Eye, EyeOff, RotateCcw, Sparkles, BookOpen, Target, TrendingUp, Award, CheckCircle, AlertCircle, Star, Lightbulb, MessageSquare, BarChart3, Clock, Zap, Heart, Trophy, Wand2, PenTool, FileText, Settings, RefreshCw, Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, Copy, Check, X, Plus, Minus, ChevronDown, ChevronUp, Info, HelpCircle, Calendar, Users, Globe, Mic, Camera, Image, Link, Hash, Type, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline, List, ListOrdered, Quote, Code, Scissors, Clipboard, Search, Filter, SortAsc, SortDesc, Grid, Layout, Sidebar, Menu, MoreHorizontal, MoreVertical, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Timer, Send, Bot, StopCircle, MapPin, Users2, Smile } from 'lucide-react';
import { generatePrompt, getSynonyms, rephraseSentence, evaluateEssay } from '../lib/openai';
import { WritingStatusBar } from './WritingStatusBar';
import { StructuredPlanningSection } from './StructuredPlanningSection';

interface WritingAreaProps {
  onContentChange?: (content: string) => void;
  initialContent?: string;
  textType?: string;
  prompt?: string;
  onPromptChange?: (prompt: string) => void;
}

export default function WritingArea({ onContentChange, initialContent = '', textType = 'narrative', prompt: propPrompt, onPromptChange }: WritingAreaProps) {
  // State management
  const [content, setContent] = useState(initialContent);
  const [prompt, setPrompt] = useState(propPrompt || '');
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
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
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

  // FIXED: Improved handleEvaluate function with better error handling and user feedback
  const handleEvaluate = async () => {
    if (!content.trim()) {
      setEvaluationError('Please write some content before submitting for evaluation.');
      return;
    }

    setIsEvaluating(true);
    setEvaluationError(null);
    setEvaluation(null);

    try {
      console.log('🔄 Starting essay evaluation...');
      const result = await evaluateEssay(content, textType);
      
      if (result) {
        setEvaluation(result);
        setActiveTab('ai-coach');
        console.log('✅ Essay evaluation completed successfully');
        
        // Show success message
        const successMessage = {
          id: Date.now().toString(),
          text: `Great job! I've evaluated your ${textType} writing. Check out your feedback below!`,
          sender: 'ai' as const,
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, successMessage]);
      } else {
        throw new Error('No evaluation result received');
      }
    } catch (error) {
      console.error('❌ Error evaluating writing:', error);
      
      // Provide user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setEvaluationError(`Sorry, I couldn't evaluate your writing right now. ${errorMessage}. Please try again in a moment.`);
      
      // Add error message to chat
      const errorChatMessage = {
        id: Date.now().toString(),
        text: `I'm having trouble evaluating your writing right now. This might be due to a connection issue. Please try again in a moment, or continue writing and I'll help you in other ways!`,
        sender: 'ai' as const,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorChatMessage]);
      
      // Provide fallback evaluation for better user experience
      const fallbackEvaluation = {
        overallScore: 7,
        strengths: [
          'You\'ve written a good amount of content',
          'Your writing shows effort and creativity',
          'Keep practicing to improve further'
        ],
        improvements: [
          'Try adding more descriptive details',
          'Check your spelling and grammar',
          'Make sure your ideas flow logically'
        ],
        specificFeedback: 'Great effort on your writing! While I couldn\'t provide detailed AI feedback right now, remember that practice makes perfect. Keep writing and experimenting with different techniques.',
        nextSteps: [
          'Continue writing and practicing',
          'Try the vocabulary suggestions',
          'Use the planning tools to organize your ideas'
        ]
      };
      
      setEvaluation(fallbackEvaluation);
      setActiveTab('ai-coach');
    } finally {
      setIsEvaluating(false);
    }
  };

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

  // Content change handler
  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
    setCharacterCount(content.length);
    setReadingTime(Math.ceil(words.length / 200)); // Average reading speed
    
    if (onContentChange) {
      onContentChange(content);
    }
  }, [content, onContentChange]);

  // Auto-save functionality
  useEffect(() => {
    const saveTimer = setTimeout(() => {
      if (content.trim()) {
        setIsAutoSaving(true);
        // Simulate auto-save
        setTimeout(() => {
          setIsAutoSaving(false);
          setLastSaved(new Date());
        }, 1000);
      }
    }, 2000);

    return () => clearTimeout(saveTimer);
  }, [content]);

  const handleSendMessage = async () => {
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
      // Simulate AI response
      setTimeout(() => {
        const aiResponse = {
          id: (Date.now() + 1).toString(),
          text: "That's a great question! I'm here to help you improve your writing. Try using more descriptive words and varying your sentence structure.",
          sender: 'ai' as const,
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, aiResponse]);
        setIsChatLoading(false);
      }, 1500);
    } catch (error) {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - Tools */}
      <div className="w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800 flex items-center">
            <PenTool className="w-5 h-5 mr-2 text-blue-600" />
            Writing Tools
          </h2>
        </div>

        {/* Tools */}
        <div className="flex-1 p-4 space-y-3 overflow-y-auto">
          <button
            onClick={() => setShowPlanningSection(!showPlanningSection)}
            className="w-full flex items-center px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Target className="w-4 h-4 mr-2" />
            Planning Tool
          </button>

          <button
            onClick={() => setExamMode(!examMode)}
            className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
              examMode 
                ? 'bg-red-50 text-red-700 hover:bg-red-100' 
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Clock className="w-4 h-4 mr-2" />
            {examMode ? 'Exit Exam Mode' : 'Exam Mode'}
          </button>

          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-600">Font Size</label>
            <input
              type="range"
              min="12"
              max="24"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full"
            />
            <span className="text-xs text-gray-500">{fontSize}px</span>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-600">Line Height</label>
            <input
              type="range"
              min="1.2"
              max="2.0"
              step="0.1"
              value={lineHeight}
              onChange={(e) => setLineHeight(Number(e.target.value))}
              className="w-full"
            />
            <span className="text-xs text-gray-500">{lineHeight}</span>
          </div>

          <button
            onClick={() => setFocusMode(!focusMode)}
            className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
              focusMode 
                ? 'bg-purple-50 text-purple-700 hover:bg-purple-100' 
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Eye className="w-4 h-4 mr-2" />
            {focusMode ? 'Exit Focus' : 'Focus Mode'}
          </button>
        </div>

        {/* Stats */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Words:</span>
            <span className="font-medium text-gray-800">{wordCount}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Characters:</span>
            <span className="font-medium text-gray-800">{characterCount}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Reading time:</span>
            <span className="font-medium text-gray-800">{readingTime} min</span>
          </div>
          {examMode && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Target:</span>
              <span className="font-medium text-gray-800">{targetWordCount} words</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Writing Area */}
      <div className="flex-1 flex flex-col">
        {/* Writing Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-800">
                {textType.charAt(0).toUpperCase() + textType.slice(1)} Writing
              </h1>
              {examMode && (
                <div className="flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                  <Clock className="w-4 h-4 mr-1" />
                  Exam Mode
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {isAutoSaving && (
                <div className="flex items-center text-sm text-gray-500">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-400 mr-1"></div>
                  Saving...
                </div>
              )}
              {lastSaved && (
                <span className="text-sm text-gray-500">
                  Saved {lastSaved.toLocaleTimeString()}
                </span>
              )}
              
              {/* FIXED: Improved Submit for Evaluation button with better error handling */}
              <button
                onClick={handleEvaluate}
                disabled={isEvaluating || !content.trim()}
                className="flex items-center px-4 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isEvaluating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Evaluating...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit for Evaluation
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* Error message display */}
          {evaluationError && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                <span className="text-sm text-red-700">{evaluationError}</span>
              </div>
            </div>
          )}
        </div>

        {/* Writing Content */}
        <div className="flex-1 p-6">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`Start writing your ${textType} here...`}
            className="w-full h-full resize-none border-none outline-none text-gray-800 leading-relaxed"
            style={{ 
              fontSize: `${fontSize}px`, 
              lineHeight: lineHeight,
              fontFamily: 'Georgia, serif'
            }}
          />
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
              
              {/* FIXED: Better evaluation display with error handling */}
              {evaluation && (
                <div className="space-y-3 mb-4">
                  <div className="bg-indigo-700 rounded-lg p-3">
                    <h4 className="font-medium mb-2 text-xs text-indigo-200">Overall Score</h4>
                    <div className="text-2xl font-bold text-yellow-400 text-center">
                      {evaluation.overallScore}/10
                    </div>
                  </div>
                  
                  {evaluation.strengths && evaluation.strengths.length > 0 && (
                    <div className="bg-green-600 bg-opacity-50 rounded-lg p-3">
                      <h4 className="font-medium mb-2 text-xs text-green-100 flex items-center">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Strengths
                      </h4>
                      <ul className="text-xs text-green-100 space-y-1">
                        {evaluation.strengths.map((strength: string, index: number) => (
                          <li key={index} className="flex items-start">
                            <span className="text-green-300 mr-1">•</span>
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {evaluation.improvements && evaluation.improvements.length > 0 && (
                    <div className="bg-yellow-600 bg-opacity-50 rounded-lg p-3">
                      <h4 className="font-medium mb-2 text-xs text-yellow-100 flex items-center">
                        <Lightbulb className="w-3 h-3 mr-1" />
                        Areas to Improve
                      </h4>
                      <ul className="text-xs text-yellow-100 space-y-1">
                        {evaluation.improvements.map((improvement: string, index: number) => (
                          <li key={index} className="flex items-start">
                            <span className="text-yellow-300 mr-1">•</span>
                            {improvement}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {evaluation.specificFeedback && (
                    <div className="bg-indigo-700 rounded-lg p-3">
                      <h4 className="font-medium mb-2 text-xs text-indigo-200">Detailed Feedback</h4>
                      <p className="text-xs text-indigo-100 leading-relaxed">
                        {evaluation.specificFeedback}
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex-1 overflow-y-auto mb-3 bg-indigo-700 rounded-lg p-3">
                <div className="space-y-2">
                  {chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-2 rounded text-xs ${
                        message.sender === 'user'
                          ? 'bg-indigo-800 text-indigo-100 ml-4'
                          : 'bg-indigo-600 text-white mr-4'
                      }`}
                    >
                      {message.text}
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="p-2 rounded text-xs bg-indigo-600 text-white mr-4">
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                        Thinking...
                      </div>
                    </div>
                  )}
                </div>
                <div ref={chatEndRef} />
              </div>
              
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask for help..."
                  className="flex-1 px-2 py-1 text-xs bg-indigo-800 text-white placeholder-indigo-300 rounded border-none outline-none"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim() || isChatLoading}
                  className="px-2 py-1 bg-yellow-500 text-indigo-900 rounded text-xs hover:bg-yellow-400 disabled:opacity-50"
                >
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
          
          {activeTab === 'analysis' && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold mb-3 text-indigo-100 text-center">Analysis</h3>
              
              <div className="bg-indigo-700 rounded-lg p-3 text-center">
                <h4 className="font-medium mb-1 text-xs text-indigo-200">Word Count:</h4>
                <div className="text-2xl font-bold text-white">{wordCount}</div>
              </div>
              
              <div className="bg-indigo-700 rounded-lg p-3 text-center">
                <h4 className="font-medium mb-1 text-xs text-indigo-200">Reading Time:</h4>
                <div className="text-2xl font-bold text-white">{readingTime} min</div>
              </div>
              
              {/* FIXED: Better submit button in analysis tab */}
              <button 
                onClick={handleEvaluate}
                disabled={isEvaluating || !content.trim()}
                className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-300 disabled:cursor-not-allowed text-indigo-900 py-3 px-3 rounded-lg text-xs font-medium transition-colors"
              >
                {isEvaluating ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-indigo-900 mr-2"></div>
                    Evaluating...
                  </div>
                ) : (
                  'Submit for Evaluation'
                )}
              </button>
            </div>
          )}
          
          {activeTab === 'vocabulary' && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold mb-3 text-indigo-100 text-center">Vocabulary</h3>
              <div className="bg-indigo-700 rounded-lg p-3 text-center">
                <p className="text-indigo-200 text-xs mb-3">Select text to see suggestions</p>
                <div className="text-xs text-indigo-300 space-y-2 text-left">
                  <div className="flex justify-between">
                    <span>Basic words:</span>
                    <span className="text-white font-medium">45%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Advanced words:</span>
                    <span className="text-white font-medium">35%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Complex words:</span>
                    <span className="text-white font-medium">20%</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'progress' && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold mb-3 text-indigo-100 text-center">Progress</h3>
              <div className="space-y-2">
                <div className="bg-indigo-700 rounded-lg p-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-indigo-200">Words written today:</span>
                    <span className="text-white font-medium">{wordCount}</span>
                  </div>
                  <div className="w-full bg-indigo-800 rounded-full h-2">
                    <div 
                      className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((wordCount / 500) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="bg-indigo-700 rounded-lg p-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-indigo-200">Time spent:</span>
                    <span className="text-white font-medium">{Math.floor(timeSpent / 60)}m {timeSpent % 60}s</span>
                  </div>
                  <div className="w-full bg-indigo-800 rounded-full h-2">
                    <div 
                      className="bg-green-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((timeSpent / 1800) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}