import React, { useState, useEffect, useRef } from 'react';
import { Save, Download, Upload, Eye, EyeOff, RotateCcw, Sparkles, BookOpen, Target, TrendingUp, Award, CheckCircle, AlertCircle, Star, Lightbulb, MessageSquare, BarChart3, Clock, Zap, Heart, Trophy, Wand2, PenTool, FileText, Settings, RefreshCw, Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, Copy, Check, X, Plus, Minus, ChevronDown, ChevronUp, Info, HelpCircle, Calendar, Users, Globe, Mic, Camera, Image, Link, Hash, Type, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline, List, ListOrdered, Quote, Code, Scissors, Clipboard, Search, Filter, SortAsc, SortDesc, Grid, Layout, Sidebar, Menu, MoreHorizontal, MoreVertical, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Timer, Send, Bot, StopCircle, MapPin, Users2, Smile } from 'lucide-react';
import { generatePrompt, getSynonyms, rephraseSentence, evaluateEssay, openai } from '../lib/openai';
import { WritingStatusBar } from './WritingStatusBar';
import { StructuredPlanningSection } from './StructuredPlanningSection';

interface WritingAreaProps {
  content: string;
  onChange: (content: string) => void;
  textType: string;
  onTimerStart: (shouldStart: boolean) => void;
  onSubmit: () => void;
  onTextTypeChange?: (textType: string) => void;
  onNavigate?: (page: string) => void;
  onStartNewEssay?: () => void;
  onShowHelpCenter?: () => void;
  onPopupCompleted?: () => void;
  assistanceLevel?: 'beginner' | 'intermediate' | 'advanced';
  selectedText?: string;
  prompt?: string;
  onPromptGenerated?: (prompt: string) => void;
}

// Enhanced Writing Issue Interface
interface WritingIssue {
  type: 'spelling' | 'punctuation' | 'grammar' | 'vocabulary' | 'sentence' | 'paragraph';
  word: string;
  start: number;
  end: number;
  suggestions: string[];
  message: string;
  severity: 'error' | 'warning' | 'suggestion';
}

// Enhanced Evaluation Interface
interface DetailedEvaluation {
  score: number;
  strengths: string;
  improvements: string;
  writingIssues: {
    spelling: WritingIssue[];
    punctuation: WritingIssue[];
    grammar: WritingIssue[];
    vocabulary: WritingIssue[];
    sentence: WritingIssue[];
    paragraph: WritingIssue[];
  };
  detailedFeedback: string;
  recommendations: string[];
}

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export function WritingArea({ 
  content,
  onChange,
  textType,
  onTimerStart,
  onSubmit,
  onTextTypeChange,
  onNavigate,
  onStartNewEssay,
  onShowHelpCenter,
  onPopupCompleted,
  assistanceLevel = 'intermediate',
  selectedText = '',
  prompt = '',
  onPromptGenerated
}: WritingAreaProps) {
  // Core state
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [lineHeight, setLineHeight] = useState(1.6);
  
  // Analysis state
  const [writingIssues, setWritingIssues] = useState<WritingIssue[]>([]);
  const [isCheckingWriting, setIsCheckingWriting] = useState(false);
  const [qualityScore, setQualityScore] = useState(85);
  const [showAnalysisDetails, setShowAnalysisDetails] = useState(false);
  
  // Evaluation state
  const [evaluation, setEvaluation] = useState<DetailedEvaluation | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  
  // UI state
  const [activeTab, setActiveTab] = useState('ai-coach');
  const [showWritingTips, setShowWritingTips] = useState(false);
  const [showKidPlanningModal, setShowKidPlanningModal] = useState(false);
  const [showStructureGuide, setShowStructureGuide] = useState(false);
  const [examMode, setExamMode] = useState(false);
  const [examTimeLeft, setExamTimeLeft] = useState(30 * 60); // 30 minutes
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  // Synonyms state
  const [showSynonyms, setShowSynonyms] = useState(false);
  const [synonyms, setSynonyms] = useState<string[]>([]);
  const [isLoadingSynonyms, setIsLoadingSynonyms] = useState(false);
  
  // Planning state
  const [planningStep, setPlanningStep] = useState(1);
  const [kidPlanningData, setKidPlanningData] = useState({
    character: '',
    setting: '',
    problem: '',
    events: '',
    solution: '',
    feelings: ''
  });
  
  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Calculate issue counts
  const issueCounts = {
    spelling: writingIssues.filter(issue => issue.type === 'spelling').length,
    punctuation: writingIssues.filter(issue => issue.type === 'punctuation').length,
    grammar: writingIssues.filter(issue => issue.type === 'grammar').length,
    vocabulary: writingIssues.filter(issue => issue.type === 'vocabulary').length,
    sentence: writingIssues.filter(issue => issue.type === 'sentence').length,
    paragraph: writingIssues.filter(issue => issue.type === 'paragraph').length,
    total: writingIssues.length
  };

  // Auto-save functionality
  useEffect(() => {
    if (content !== '') {
      setIsAutoSaving(true);
      const timer = setTimeout(() => {
        setIsAutoSaving(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [content]);

  // Update stats when content changes
  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
    setCharacterCount(content.length);
    setReadingTime(Math.ceil(words.length / 200)); // Average reading speed
    
    if (onChange) {
      onChange(content);
    }
  }, [content, onChange]);

  // Exam mode timer
  useEffect(() => {
    if (examMode && examTimeLeft > 0) {
      const timer = setTimeout(() => {
        setExamTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (examMode && examTimeLeft === 0) {
      alert('Time\'s up! Your exam session has ended.');
      setExamMode(false);
    }
  }, [examMode, examTimeLeft]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const handleTextSelection = () => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      if (start !== end) {
        const selected = content.substring(start, end).trim();
        if (selected.length > 0 && selected.split(' ').length <= 3) {
          // setSelectedText(selected);
        }
      }
    }
  };

  const handleGetSynonyms = async () => {
    if (!selectedText) return;
    
    setIsLoadingSynonyms(true);
    setShowSynonyms(true);
    
    try {
      const result = await getSynonyms(selectedText);
      setSynonyms(result);
    } catch (error) {
      console.error('Error getting synonyms:', error);
      setSynonyms(['Error loading synonyms']);
    } finally {
      setIsLoadingSynonyms(false);
    }
  };

  const handleEvaluate = async () => {
    if (content.trim().length < 50) {
      alert('Please write at least 50 characters before requesting an evaluation.');
      return;
    }

    setIsEvaluating(true);
    
    try {
      const result = await evaluateEssay(content, textType);
      
      // Create detailed evaluation object
      const detailedEval: DetailedEvaluation = {
        score: result.score || 75,
        strengths: result.strengths || 'Good effort on your writing!',
        improvements: result.improvements || 'Keep practicing to improve further.',
        writingIssues: {
          spelling: writingIssues.filter(issue => issue.type === 'spelling'),
          punctuation: writingIssues.filter(issue => issue.type === 'punctuation'),
          grammar: writingIssues.filter(issue => issue.type === 'grammar'),
          vocabulary: writingIssues.filter(issue => issue.type === 'vocabulary'),
          sentence: writingIssues.filter(issue => issue.type === 'sentence'),
          paragraph: writingIssues.filter(issue => issue.type === 'paragraph')
        },
        detailedFeedback: result.feedback || 'Your writing shows good potential. Keep working on developing your ideas and improving your expression.',
        recommendations: result.recommendations || ['Practice writing regularly', 'Read more books to improve vocabulary', 'Focus on sentence structure']
      };
      
      setEvaluation(detailedEval);
      setActiveTab('analysis');
      
    } catch (error) {
      console.error('Evaluation error:', error);
      alert('Sorry, there was an error generating your evaluation. Please try again.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: chatInput.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a friendly writing coach for NSW Selective School students aged 9-11. Help with writing questions about ${textType} writing. Be encouraging, use simple language, and provide specific, actionable advice. Keep responses under 100 words.`
          },
          {
            role: 'user',
            content: `Student's question: "${userMessage.text}"

Current writing content: "${content.substring(0, 200)}${content.length > 200 ? '...' : ''}"

Please provide helpful, age-appropriate advice.`
          }
        ],
        max_tokens: 150,
        temperature: 0.7
      });

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: response.choices[0]?.message?.content || 'Sorry, I couldn\'t understand that. Can you try asking in a different way?',
        sender: 'ai',
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I\'m having trouble right now. Please try again in a moment!',
        sender: 'ai',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const startExamMode = () => {
    setExamMode(true);
    setExamTimeLeft(30 * 60); // Reset to 30 minutes
    setFocusMode(true);
    setShowWritingTips(false);
    setShowAnalysisDetails(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getWritingTips = () => {
    const tips = {
      narrative: [
        'Start with an exciting hook to grab your reader\'s attention',
        'Use descriptive words to paint a picture in the reader\'s mind',
        'Include dialogue to make your characters come alive',
        'Show emotions through actions and expressions, not just words',
        'End with a satisfying conclusion that wraps up your story'
      ],
      persuasive: [
        'State your opinion clearly in the first paragraph',
        'Use strong reasons and examples to support your argument',
        'Consider what the other side might say and respond to it',
        'Use connecting words like "furthermore" and "however"',
        'End with a powerful conclusion that restates your main point'
      ],
      expository: [
        'Start with a clear topic sentence that tells what you\'ll explain',
        'Organize your information in a logical order',
        'Use facts, examples, and details to support your points',
        'Include transition words to connect your ideas',
        'Summarize the main points in your conclusion'
      ]
    };
    
    return tips[textType as keyof typeof tips] || tips.narrative;
  };

  // Kid Planning Modal Functions
  const handleKidPlanningNext = () => {
    if (planningStep < 6) {
      setPlanningStep(planningStep + 1);
    } else {
      // Finished planning - generate content suggestion
      const planSummary = `Character: ${kidPlanningData.character}\nSetting: ${kidPlanningData.setting}\nProblem: ${kidPlanningData.problem}\nEvents: ${kidPlanningData.events}\nSolution: ${kidPlanningData.solution}\nFeelings: ${kidPlanningData.feelings}`;
      
      const suggestion = `Great planning! Here's a story starter based on your plan:\n\n"${kidPlanningData.character} was in ${kidPlanningData.setting} when suddenly ${kidPlanningData.problem}..."\n\nNow you can use your plan to write your full story!`;
      
      onChange(content + '\n\n' + suggestion);
      setShowKidPlanningModal(false);
      setPlanningStep(1);
    }
  };

  const handleKidPlanningPrev = () => {
    if (planningStep > 1) {
      setPlanningStep(planningStep - 1);
    }
  };

  const updateKidPlanningData = (field: string, value: string) => {
    setKidPlanningData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Main Writing Area - Full width */}
      <div className="flex-1 bg-white shadow-lg flex flex-col">
        {/* Prompt Section */}
        <div className={`${focusMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-lg shadow-sm p-4 mb-3 mx-3 mt-3 transition-colors duration-300`}>
          <div className="flex items-center mb-2">
            <Lightbulb className="w-4 h-4 mr-2 text-yellow-500" />
            <span className={`text-base font-bold ${focusMode ? 'text-gray-200' : 'text-gray-800'}`}>Your Writing Prompt</span>
          </div>
          <p className={`${focusMode ? 'text-gray-300' : 'text-gray-600'} text-sm leading-relaxed`}>
            {prompt || 'Write an engaging story about a character who discovers something unexpected that changes their life forever. Include vivid descriptions, realistic dialogue, and show the character\'s emotional journey. Make sure your story has a clear beginning, middle, and end with a satisfying conclusion. Focus on showing rather than telling, and use sensory details to bring your story to life.'}
          </p>
        </div>

        {/* Writing Tips Section */}
        {showWritingTips && (
          <div className={`${focusMode ? 'bg-gray-800 border-gray-700' : 'bg-blue-50 border-blue-200'} border rounded-lg p-4 mx-3 mb-3`}>
            <div className="flex items-center justify-between mb-3">
              <h4 className={`text-sm font-semibold ${focusMode ? 'text-blue-300' : 'text-blue-800'}`}>
                💡 {textType.charAt(0).toUpperCase() + textType.slice(1)} Writing Tips
              </h4>
              <button
                onClick={() => setShowWritingTips(false)}
                className={`text-xs ${focusMode ? 'text-gray-400 hover:text-gray-300' : 'text-blue-600 hover:text-blue-800'}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className={`text-sm ${focusMode ? 'text-gray-300' : 'text-blue-700'} space-y-2`}>
              {getWritingTips().map((tip, index) => (
                <p key={index} className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>{tip}</span>
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Writing Area */}
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

            {/* Text Area */}
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={handleContentChange}
                onMouseUp={handleTextSelection}
                onKeyUp={handleTextSelection}
                placeholder="Start writing your amazing story here! Let your creativity flow and bring your ideas to life..."
                className={`w-full h-full p-4 text-sm leading-relaxed ${
                  focusMode 
                    ? 'text-gray-100 bg-gray-800 placeholder-gray-500' 
                    : 'text-gray-900 bg-white placeholder-gray-400'
                } focus:outline-none resize-none transition-colors duration-300`}
                style={{ 
                  fontSize: `${fontSize}px`, 
                  lineHeight: lineHeight,
                  fontFamily: 'Georgia, serif'
                }}
                spellCheck={false}
              />
            </div>
            
            {/* Enhanced Status Bar */}
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
                onClick={handleEvaluate}
                disabled={isEvaluating}
                className="flex items-center px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 focus:outline-none focus:ring-1 focus:ring-green-500 focus:ring-opacity-50 disabled:opacity-50"
              >
                {isEvaluating ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                    Generating Report...
                  </>
                ) : (
                  <>
                    <FileText className="w-3 h-3 mr-1" />
                    Submit for Evaluation Report
                  </>
                )}
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
              
              <div className="bg-indigo-700 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-indigo-200">Overall Score</span>
                  <span className={`text-lg font-bold ${qualityScore >= 70 ? 'text-green-400' : qualityScore >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {qualityScore}%
                  </span>
                </div>
                
                {content.trim().length < 50 && (
                  <div className="mt-2 p-2 bg-indigo-800 rounded text-xs">
                    <p className="text-yellow-300">💡 Tip: Add more content to get a complete analysis!</p>
                  </div>
                )}
              </div>

              {evaluation && (
                <div className="bg-indigo-700 rounded-lg p-3 max-h-96 overflow-y-auto">
                  <h4 className="text-xs font-medium text-indigo-200 mb-2">📊 Detailed Evaluation Report</h4>
                  <div className="text-xs text-indigo-100 space-y-2">
                    <div className="border-b border-indigo-600 pb-2">
                      <p><strong>Overall Score:</strong> <span className={`${evaluation.score >= 70 ? 'text-green-400' : evaluation.score >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>{evaluation.score}/100</span></p>
                    </div>
                    
                    <div className="border-b border-indigo-600 pb-2">
                      <p><strong>✅ Strengths:</strong></p>
                      <p className="text-green-300">{evaluation.strengths}</p>
                    </div>
                    
                    <div className="border-b border-indigo-600 pb-2">
                      <p><strong>🎯 Areas for Improvement:</strong></p>
                      <p className="text-yellow-300">{evaluation.improvements}</p>
                    </div>
                    
                    <div>
                      <p><strong>💡 Recommendations:</strong></p>
                      {evaluation.recommendations.map((rec, index) => (
                        <p key={index} className="text-blue-300">• {rec}</p>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'vocabulary' && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold mb-3 text-indigo-100 text-center">Vocabulary Helper</h3>
              
              <div className="bg-indigo-700 rounded-lg p-3">
                <h4 className="text-xs font-medium text-indigo-200 mb-2">Word Enhancer</h4>
                <p className="text-xs text-indigo-300 mb-3">Select a word in your writing to get better alternatives!</p>
                
                <div className="space-y-2">
                  <h5 className="text-xs font-medium text-indigo-200">Quick Vocabulary Tips:</h5>
                  <div className="text-xs text-indigo-300 space-y-1">
                    <p>• Instead of "said" try: declared, whispered, exclaimed</p>
                    <p>• Instead of "good" try: excellent, wonderful, fantastic</p>
                    <p>• Instead of "big" try: enormous, massive, gigantic</p>
                    <p>• Instead of "went" try: traveled, journeyed, ventured</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'progress' && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold mb-3 text-indigo-100 text-center">Writing Progress</h3>
              
              <div className="bg-indigo-700 rounded-lg p-3">
                <h4 className="text-xs font-medium text-indigo-200 mb-2">Today's Session</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-indigo-300">Words Written:</span>
                    <span className="text-white font-medium">{wordCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-indigo-300">Quality Score:</span>
                    <span className={`font-medium ${qualityScore >= 70 ? 'text-green-400' : qualityScore >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {qualityScore}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Kid Planning Modal */}
      {showKidPlanningModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Story Planning</h2>
              <button
                onClick={() => setShowKidPlanningModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Step {planningStep} of 6</span>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5, 6].map((step) => (
                    <div
                      key={step}
                      className={`w-2 h-2 rounded-full ${
                        step <= planningStep ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {planningStep === 1 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Who is your main character?</h3>
                  <input
                    type="text"
                    value={kidPlanningData.character}
                    onChange={(e) => updateKidPlanningData('character', e.target.value)}
                    placeholder="e.g., A brave young girl named Sarah"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {planningStep === 2 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Where does your story take place?</h3>
                  <input
                    type="text"
                    value={kidPlanningData.setting}
                    onChange={(e) => updateKidPlanningData('setting', e.target.value)}
                    placeholder="e.g., A magical forest, a busy city, a school"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {planningStep === 3 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">What problem does your character face?</h3>
                  <input
                    type="text"
                    value={kidPlanningData.problem}
                    onChange={(e) => updateKidPlanningData('problem', e.target.value)}
                    placeholder="e.g., Gets lost, loses something important, faces a challenge"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {planningStep === 4 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">What exciting things happen?</h3>
                  <textarea
                    value={kidPlanningData.events}
                    onChange={(e) => updateKidPlanningData('events', e.target.value)}
                    placeholder="e.g., Meets helpful friends, discovers clues, faces obstacles"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-20"
                  />
                </div>
              )}

              {planningStep === 5 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">How is the problem solved?</h3>
                  <input
                    type="text"
                    value={kidPlanningData.solution}
                    onChange={(e) => updateKidPlanningData('solution', e.target.value)}
                    placeholder="e.g., Uses creativity, gets help from friends, learns something new"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {planningStep === 6 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">How does your character feel at the end?</h3>
                  <input
                    type="text"
                    value={kidPlanningData.feelings}
                    onChange={(e) => updateKidPlanningData('feelings', e.target.value)}
                    placeholder="e.g., Happy, proud, excited, relieved"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-between mt-6">
              <button
                onClick={handleKidPlanningPrev}
                disabled={planningStep === 1}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50"
              >
                ← Back
              </button>
              
              <button
                onClick={handleKidPlanningNext}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                {planningStep === 6 ? 'Finish Plan! 🎉' : 'Next →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Structure Guide Modal */}
      {showStructureGuide && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setShowStructureGuide(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="pr-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {textType.charAt(0).toUpperCase() + textType.slice(1)} Writing Structure
              </h2>
              
              {/* Narrative Structure */}
              {(textType.toLowerCase() === 'narrative' || textType.toLowerCase() === 'story') && (
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-2">Narrative Story Structure</h3>
                    <p className="text-blue-700 dark:text-blue-400 mb-3">A narrative tells a story with characters, setting, and events:</p>
                    
                    <div className="space-y-3">
                      <div className="border-l-4 border-blue-500 pl-3">
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200">1. Beginning (Introduction)</h4>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">• Introduce your main character<br/>• Describe the setting (where and when)<br/>• Start with an exciting hook to grab attention</p>
                      </div>
                      
                      <div className="border-l-4 border-green-500 pl-3">
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200">2. Middle (Problem & Events)</h4>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">• Present the main problem or challenge<br/>• Show what the character does to solve it<br/>• Include exciting events and dialogue</p>
                      </div>
                      
                      <div className="border-l-4 border-purple-500 pl-3">
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200">3. End (Solution)</h4>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">• Show how the problem is solved<br/>• Describe how characters feel<br/>• End with a satisfying conclusion</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Synonyms Popup */}
      {showSynonyms && selectedText && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-4 max-w-sm w-full mx-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">AI Synonyms for "{selectedText}"</h3>
              <button
                onClick={() => setShowSynonyms(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {isLoadingSynonyms ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-sm text-gray-600 mt-2">AI generating synonyms...</p>
              </div>
            ) : (
              <div className="space-y-2">
                {synonyms.map((synonym, index) => (
                  <button
                    key={index}
                    className="block w-full text-left px-3 py-2 hover:bg-gray-100 rounded"
                    onClick={() => {
                      // Replace selected text with synonym
                      const textarea = textareaRef.current;
                      if (textarea) {
                        const start = textarea.selectionStart;
                        const end = textarea.selectionEnd;
                        const newContent = content.substring(0, start) + synonym + content.substring(end);
                        onChange(newContent);
                        setShowSynonyms(false);
                      }
                    }}
                  >
                    {synonym}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
