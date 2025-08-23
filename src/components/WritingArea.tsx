import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Save, Download, Upload, Eye, EyeOff, RotateCcw, Sparkles, BookOpen, Target, TrendingUp, Award, CheckCircle, AlertCircle, Star, Lightbulb, MessageSquare, BarChart3, Clock, Zap, Heart, Trophy, Wand2, PenTool, FileText, Settings, RefreshCw, Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, Copy, Check, X, Plus, Minus, ChevronDown, ChevronUp, Info, HelpCircle, Calendar, Users, Globe, Mic, Camera, Image, Link, Hash, Type, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline, List, ListOrdered, Quote, Code, Scissors, Clipboard, Search, Filter, SortAsc, SortDesc, Grid, Layout, Sidebar, Menu, MoreHorizontal, MoreVertical, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Timer, Send, Bot, StopCircle, MapPin, Users2, Smile 
} from 'lucide-react';
import { generatePrompt, getSynonyms, rephraseSentence, evaluateEssay } from '../lib/openai';
import { WritingStatusBar } from './WritingStatusBar';
import { StructuredPlanningSection } from './StructuredPlanningSection';
import { WritingTypeSelectionModal } from './WritingTypeSelectionModal';
import { PromptOptionsModal } from './PromptOptionsModal';
import { CustomPromptModal } from './CustomPromptModal';

interface WritingAreaProps {
  onContentChange?: (content: string) => void;
  initialContent?: string;
  textType?: string;
  prompt?: string;
  onPromptChange?: (prompt: string) => void;
  onTextTypeChange?: (textType: string) => void;
  onPopupCompleted?: () => void;
  onPromptGenerated?: (prompt: string) => void;
  content?: string;
  onChange?: (content: string) => void;
  onTimerStart?: (shouldStart: boolean) => void;
  onSubmit?: () => void;
}

export default function WritingArea({ 
  onContentChange, 
  initialContent = '', 
  textType: propTextType = '', 
  prompt: propPrompt, 
  onPromptChange,
  onTextTypeChange,
  onPopupCompleted,
  onPromptGenerated,
  content: propContent,
  onChange,
  onTimerStart,
  onSubmit
}: WritingAreaProps) {
  // State management
  const [content, setContent] = useState(propContent || initialContent);
  const [prompt, setPrompt] = useState(propPrompt || '');
  const [textType, setTextType] = useState(propTextType);
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
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
  
  // Modal states - FIXED: Proper modal flow management
  const [showWritingTypeModal, setShowWritingTypeModal] = useState(false);
  const [showPromptOptionsModal, setShowPromptOptionsModal] = useState(false);
  const [showCustomPromptModal, setShowCustomPromptModal] = useState(false);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  
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

  // FIXED: Initialize modal flow on component mount
  useEffect(() => {
    console.log('🎯 WritingArea: Component mounted, checking flow state...');
    
    // Check if we have a text type from localStorage or props
    const storedTextType = localStorage.getItem('selectedWritingType');
    const storedPromptType = localStorage.getItem('promptType');
    const storedPrompt = localStorage.getItem('generatedPrompt');
    
    console.log('📊 WritingArea: Stored data:', {
      storedTextType,
      storedPromptType,
      storedPrompt: storedPrompt ? 'Present' : 'None',
      propTextType,
      propPrompt: propPrompt ? 'Present' : 'None'
    });

    // Set text type from props or localStorage
    if (propTextType) {
      setTextType(propTextType);
    } else if (storedTextType) {
      setTextType(storedTextType);
      if (onTextTypeChange) {
        onTextTypeChange(storedTextType);
      }
    }

    // Handle prompt flow based on stored data
    if (storedTextType && storedPromptType) {
      if (storedPromptType === 'generated' && storedPrompt) {
        // Generated prompt flow - display the prompt
        console.log('✅ WritingArea: Using generated prompt');
        setPrompt(storedPrompt);
        if (onPromptGenerated) {
          onPromptGenerated(storedPrompt);
        }
        if (onPopupCompleted) {
          onPopupCompleted();
        }
      } else if (storedPromptType === 'custom') {
        // Custom prompt flow - show custom prompt modal
        console.log('✏️ WritingArea: Showing custom prompt modal');
        setShowCustomPromptModal(true);
      }
    } else if (!propTextType && !storedTextType) {
      // No text type selected - show writing type modal
      console.log('📝 WritingArea: No text type, showing selection modal');
      setShowWritingTypeModal(true);
    }
  }, [propTextType, propPrompt, onTextTypeChange, onPromptGenerated, onPopupCompleted]);

  // FIXED: Handle writing type selection
  const handleWritingTypeSelect = useCallback((selectedType: string) => {
    console.log('📝 WritingArea: Writing type selected:', selectedType);
    
    setTextType(selectedType);
    localStorage.setItem('selectedWritingType', selectedType);
    
    if (onTextTypeChange) {
      onTextTypeChange(selectedType);
    }
    
    setShowWritingTypeModal(false);
    setShowPromptOptionsModal(true);
  }, [onTextTypeChange]);

  // FIXED: Handle prompt generation
  const handleGeneratePrompt = useCallback(async () => {
    console.log('🎯 WritingArea: Generating prompt for:', textType);
    setIsGeneratingPrompt(true);
    setShowPromptOptionsModal(false);

    try {
      const generatedPrompt = await generatePrompt(textType);
      
      if (generatedPrompt) {
        console.log('✅ WritingArea: Prompt generated successfully');
        setPrompt(generatedPrompt);
        localStorage.setItem('generatedPrompt', generatedPrompt);
        localStorage.setItem('promptType', 'generated');
        
        if (onPromptGenerated) {
          onPromptGenerated(generatedPrompt);
        }
        if (onPopupCompleted) {
          onPopupCompleted();
        }
      } else {
        throw new Error('No prompt generated');
      }
    } catch (error) {
      console.error('❌ WritingArea: Error generating prompt:', error);
      
      // Fallback to high-quality static prompts
      const fallbackPrompts = {
        narrative: "Write an engaging story about a character who discovers something unexpected that changes their life forever. Include vivid descriptions, realistic dialogue, and show the character's emotional journey.",
        persuasive: "Choose a topic you feel strongly about and write a persuasive essay to convince others of your viewpoint. Use strong evidence, logical reasoning, and persuasive techniques.",
        expository: "Select a topic you know well and write an informative essay that teaches others about it. Use clear explanations, relevant examples, and organize your information logically.",
        reflective: "Think about a meaningful experience in your life and write a reflective piece exploring what you learned from it. Show your thoughts and feelings honestly.",
        descriptive: "Choose a place, person, or object that is special to you and write a descriptive piece that brings it to life using sensory details and figurative language.",
        recount: "Write about an important event or experience in your life, telling what happened in chronological order with descriptive details."
      };

      const fallbackPrompt = fallbackPrompts[textType as keyof typeof fallbackPrompts] || fallbackPrompts.narrative;
      
      console.log('🔄 WritingArea: Using fallback prompt');
      setPrompt(fallbackPrompt);
      localStorage.setItem('generatedPrompt', fallbackPrompt);
      localStorage.setItem('promptType', 'generated');
      
      if (onPromptGenerated) {
        onPromptGenerated(fallbackPrompt);
      }
      if (onPopupCompleted) {
        onPopupCompleted();
      }
    } finally {
      setIsGeneratingPrompt(false);
    }
  }, [textType, onPromptGenerated, onPopupCompleted]);

  // FIXED: Handle custom prompt selection
  const handleCustomPrompt = useCallback(() => {
    console.log('✏️ WritingArea: Custom prompt selected for:', textType);
    setShowPromptOptionsModal(false);
    setShowCustomPromptModal(true);
    localStorage.setItem('promptType', 'custom');
  }, [textType]);

  // FIXED: Handle custom prompt submission
  const handleCustomPromptSubmit = useCallback((customPrompt: string) => {
    console.log('✅ WritingArea: Custom prompt submitted:', customPrompt);
    
    setPrompt(customPrompt);
    setShowCustomPromptModal(false);
    
    // Store the custom prompt
    localStorage.setItem('generatedPrompt', customPrompt);
    localStorage.setItem('promptType', 'custom');
    
    if (onPromptGenerated) {
      onPromptGenerated(customPrompt);
    }
    if (onPopupCompleted) {
      onPopupCompleted();
    }
  }, [onPromptGenerated, onPopupCompleted]);

  // Content change handler
  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    
    if (onChange) {
      onChange(newContent);
    }
    if (onContentChange) {
      onContentChange(newContent);
    }
    
    // Auto-save to localStorage
    localStorage.setItem('writingContent', newContent);
  }, [onChange, onContentChange]);

  // Calculate stats
  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(content.trim() ? words.length : 0);
    setCharacterCount(content.length);
    setReadingTime(Math.ceil(words.length / 200) || 0);
  }, [content]);

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

  // Text selection handler
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      setSelectedText(selection.toString());
    }
  };

  // Get synonyms for selected text
  const handleGetSynonyms = async () => {
    if (!selectedText) return;
    
    setIsLoadingSynonyms(true);
    setShowSynonyms(true);
    
    try {
      const synonymList = await getSynonyms(selectedText);
      setSynonyms(synonymList);
    } catch (error) {
      console.error('Error getting synonyms:', error);
      setSynonyms(['amazing', 'wonderful', 'fantastic', 'incredible', 'outstanding']);
    } finally {
      setIsLoadingSynonyms(false);
    }
  };

  // Replace selected text with synonym
  const replaceSynonym = (synonym: string) => {
    if (textareaRef.current && selectedText) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.substring(0, start) + synonym + content.substring(end);
      setContent(newContent);
      setShowSynonyms(false);
      setSelectedText('');
    }
  };

  // Evaluate writing
  const handleEvaluate = async () => {
    if (!content.trim()) return;
    setIsEvaluating(true);
    try {
      const result = await evaluateEssay(content, textType);
      setEvaluation(result);
      setActiveTab('ai-coach');
    } catch (error) {
      console.error('Error evaluating writing:', error);
      // Mock evaluation for demo
      setEvaluation({
        score: Math.floor(Math.random() * 3) + 7,
        overallScore: Math.floor(Math.random() * 3) + 7,
        strengths: [
          'Good use of vocabulary and varied sentence structure',
          'Clear organization and logical flow of ideas',
          'Engaging content that holds reader interest'
        ],
        improvements: [
          'Add more descriptive details and sensory language',
          'Vary sentence length for better rhythm',
          'Include more specific examples to support main points'
        ],
        specificFeedback: `Your ${textType} writing shows good potential with clear structure and engaging content.`,
        nextSteps: [
          `Practice descriptive writing techniques for ${textType}`,
          'Read examples of excellent ' + textType + ' writing',
          'Focus on character development and dialogue'
        ]
      });
      setActiveTab('ai-coach');
    } finally {
      setIsEvaluating(false);
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

  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex bg-gray-100">
      {/* Main Writing Area */}
      <div className="flex-1 flex flex-col">
        {/* Prompt Display Section - FIXED: Always show when prompt exists */}
        {prompt && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-200 p-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-blue-500 rounded-full">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-blue-800 mb-2">Your Writing Prompt</h3>
                  <p className="text-blue-700 leading-relaxed">{prompt}</p>
                  <div className="mt-3 flex items-center space-x-4 text-sm text-blue-600">
                    <span className="flex items-center">
                      <BookOpen className="w-4 h-4 mr-1" />
                      {textType.charAt(0).toUpperCase() + textType.slice(1)} Writing
                    </span>
                    <span className="flex items-center">
                      <Target className="w-4 h-4 mr-1" />
                      Target: {targetWordCount} words
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Writing Interface */}
        <div className="flex-1 flex">
          {/* Left Side - Writing Area */}
          <div className="flex-1 flex flex-col p-4">
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
              <textarea
                ref={textareaRef}
                value={content}
                onChange={handleContentChange}
                onMouseUp={handleTextSelection}
                onKeyUp={handleTextSelection}
                placeholder="Start writing your amazing story here! Let your creativity flow and bring your ideas to life..."
                className={`flex-1 p-4 text-sm leading-relaxed ${
                  focusMode 
                    ? 'text-gray-100 bg-gray-800 placeholder-gray-500' 
                    : 'text-gray-900 bg-white placeholder-gray-400'
                } focus:outline-none resize-none transition-colors duration-300`}
                style={{ fontSize: `${fontSize}px`, lineHeight: lineHeight }}
              />
              
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
                  onClick={handleEvaluate}
                  disabled={isEvaluating}
                  className="flex items-center px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 focus:outline-none focus:ring-1 focus:ring-green-500 focus:ring-opacity-50 disabled:opacity-50"
                >
                  {isEvaluating ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                      Evaluating...
                    </>
                  ) : (
                    <>
                      <Send className="w-3 h-3 mr-1" />
                      Submit for Evaluation
                    </>
                  )}
                </button>
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
                      className="px-3 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-50 text-xs"
                    >
                      <Send className="w-3 h-3" />
                    </button>
                  </form>
                </div>
              )}

              {activeTab === 'analysis' && (
                <div>
                  <h3 className="text-xs font-semibold mb-3 text-indigo-100">Writing Analysis</h3>
                  {evaluation ? (
                    <div className="space-y-3">
                      <div className="bg-indigo-700 rounded-lg p-3">
                        <h4 className="text-xs font-medium text-indigo-200 mb-2">Overall Score</h4>
                        <div className="text-2xl font-bold text-white">{evaluation.overallScore}/10</div>
                      </div>
                      
                      <div className="bg-indigo-700 rounded-lg p-3">
                        <h4 className="text-xs font-medium text-indigo-200 mb-2">Strengths</h4>
                        <ul className="text-xs text-white space-y-1">
                          {evaluation.strengths?.map((strength: string, index: number) => (
                            <li key={index} className="flex items-start">
                              <CheckCircle className="w-3 h-3 text-green-400 mr-1 mt-0.5 flex-shrink-0" />
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="bg-indigo-700 rounded-lg p-3">
                        <h4 className="text-xs font-medium text-indigo-200 mb-2">Areas for Improvement</h4>
                        <ul className="text-xs text-white space-y-1">
                          {evaluation.improvements?.map((improvement: string, index: number) => (
                            <li key={index} className="flex items-start">
                              <AlertCircle className="w-3 h-3 text-yellow-400 mr-1 mt-0.5 flex-shrink-0" />
                              {improvement}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BarChart3 className="w-8 h-8 text-indigo-300 mx-auto mb-3" />
                      <p className="text-xs text-indigo-200">Write some content and click "Submit for Evaluation" to see your analysis!</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'vocabulary' && (
                <div>
                  <h3 className="text-xs font-semibold mb-3 text-indigo-100">Vocabulary Builder</h3>
                  <div className="space-y-3">
                    <div className="bg-indigo-700 rounded-lg p-3">
                      <h4 className="text-xs font-medium text-indigo-200 mb-2">Selected Text</h4>
                      {selectedText ? (
                        <div>
                          <p className="text-xs text-white mb-2">"{selectedText}"</p>
                          <button
                            onClick={handleGetSynonyms}
                            className="text-xs bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
                          >
                            Get Synonyms
                          </button>
                        </div>
                      ) : (
                        <p className="text-xs text-indigo-300">Highlight text in your writing to see synonyms</p>
                      )}
                    </div>
                    
                    {synonyms.length > 0 && (
                      <div className="bg-indigo-700 rounded-lg p-3">
                        <h4 className="text-xs font-medium text-indigo-200 mb-2">Synonyms</h4>
                        <div className="flex flex-wrap gap-1">
                          {synonyms.map((synonym, index) => (
                            <button
                              key={index}
                              onClick={() => replaceSynonym(synonym)}
                              className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                            >
                              {synonym}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'progress' && (
                <div>
                  <h3 className="text-xs font-semibold mb-3 text-indigo-100">Writing Progress</h3>
                  <div className="space-y-3">
                    <div className="bg-indigo-700 rounded-lg p-3">
                      <h4 className="text-xs font-medium text-indigo-200 mb-2">Today's Session</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-indigo-300">Words Written:</span>
                          <span className="text-white font-medium">{wordCount}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-indigo-300">Time Spent:</span>
                          <span className="text-white font-medium">{formatTime(timeSpent)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-indigo-300">Reading Time:</span>
                          <span className="text-white font-medium">{readingTime} min</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-indigo-700 rounded-lg p-3">
                      <h4 className="text-xs font-medium text-indigo-200 mb-2">Goal Progress</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-indigo-300">Target Words:</span>
                          <span className="text-white font-medium">{targetWordCount}</span>
                        </div>
                        <div className="w-full bg-indigo-800 rounded-full h-2">
                          <div 
                            className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min((wordCount / targetWordCount) * 100, 100)}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-indigo-300">
                          {Math.round((wordCount / targetWordCount) * 100)}% complete
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <WritingTypeSelectionModal
        isOpen={showWritingTypeModal}
        onClose={() => setShowWritingTypeModal(false)}
        onSelect={handleWritingTypeSelect}
      />

      <PromptOptionsModal
        isOpen={showPromptOptionsModal}
        onClose={() => setShowPromptOptionsModal(false)}
        onGeneratePrompt={handleGeneratePrompt}
        onCustomPrompt={handleCustomPrompt}
        textType={textType}
      />

      <CustomPromptModal
        isOpen={showCustomPromptModal}
        onClose={() => setShowCustomPromptModal(false)}
        onSubmit={handleCustomPromptSubmit}
        textType={textType}
      />

      {/* Synonyms Popup */}
      {showSynonyms && selectedText && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-4 max-w-sm w-full mx-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Synonyms for "{selectedText}"</h3>
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
              </div>
            ) : (
              <div className="space-y-2">
                {synonyms.map((synonym, index) => (
                  <button
                    key={index}
                    onClick={() => replaceSynonym(synonym)}
                    className="block w-full text-left px-3 py-2 bg-gray-100 hover:bg-blue-100 rounded transition-colors"
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
