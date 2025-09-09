import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Save, Download, Upload, Eye, EyeOff, RotateCcw, Sparkles, BookOpen, Target, TrendingUp, Award, CheckCircle, AlertCircle, Star, Lightbulb, MessageSquare, BarChart3, Clock, Zap, Heart, Wand2, PenTool, FileText, Settings, RefreshCw, Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, Copy, Check, X, Plus, Minus, ChevronDown, ChevronUp, Info, HelpCircle, Calendar, Users, Globe, Mic, Camera, Image, Link, Hash, Type, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline, List, ListOrdered, Quote, Code, Scissors, Clipboard, Search, Filter, SortAsc, SortDesc, Grid, Layout, Sidebar, Menu, MoreHorizontal, MoreVertical, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Timer, Send, Bot, StopCircle, MapPin, Users2, Smile } from 'lucide-react';
import { generatePrompt, getSynonyms, rephraseSentence, evaluateEssay, makeOpenAICall, generateChatResponse } from '../lib/openai';
import { WritingStatusBar } from './WritingStatusBar';
import { StructuredPlanningSection } from './StructuredPlanningSection';
import { TabbedCoachPanel } from './TabbedCoachPanel';

interface WritingAreaProps {
  content?: string;
  onChange?: (content: string) => void;
  textType?: string;
  onTimerStart?: (shouldStart: boolean) => void;
  onSubmit?: () => void;
  onTextTypeChange?: (textType: string) => void;
  onPopupCompleted?: () => void;
  onPromptGenerated?: (prompt: string) => void;
  prompt?: string;
  initialContent?: string;
  onContentChange?: (content: string) => void;
  onPromptChange?: (prompt: string) => void;
}

// Chat message interface
interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export default function WritingArea({
  content = '',
  onChange,
  textType = 'narrative',
  onTimerStart,
  onSubmit,
  onTextTypeChange,
  onPopupCompleted,
  onPromptGenerated,
  prompt = '',
  initialContent = '',
  onContentChange,
  onPromptChange
}: WritingAreaProps) {
  // Content state
  const [currentContent, setCurrentContent] = useState(content || initialContent || '');
  const [currentPrompt, setCurrentPrompt] = useState(prompt || '');
  const [selectedText, setSelectedText] = useState('');
  
  // UI state
  const [showPlanningModal, setShowPlanningModal] = useState(false);
  const [showStructureModal, setShowStructureModal] = useState(false);
  const [showTipsModal, setShowTipsModal] = useState(false);
  const [showFocusMode, setShowFocusMode] = useState(false);
  const [isExamMode, setIsExamMode] = useState(false);
  const [planningStep, setPlanningStep] = useState(1);
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  // Writing metrics state
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [totalWritingTime, setTotalWritingTime] = useState(0); // in seconds
  const [lastTypingTime, setLastTypingTime] = useState<Date | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  
  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate writing metrics
  const wordCount = currentContent.trim() ? currentContent.trim().split(/\s+/).length : 0;
  const charCount = currentContent.length;
  const readingTime = Math.ceil(wordCount / 200); // Average reading speed
  
  // Calculate WPM (Words Per Minute)
  const calculateWPM = useCallback(() => {
    if (totalWritingTime === 0 || wordCount === 0) return 0;
    const minutes = totalWritingTime / 60;
    return Math.round(wordCount / minutes);
  }, [wordCount, totalWritingTime]);

  // Handle content changes and track typing time
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

  // Update total writing time when component unmounts or typing stops
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTyping && lastTypingTime) {
        const now = new Date();
        const typingDuration = (now.getTime() - lastTypingTime.getTime()) / 1000;
        setTotalWritingTime(prev => prev + typingDuration);
      }
    };
  }, [isTyping, lastTypingTime]);

  const handlePlanningPhase = () => {
    setShowPlanningModal(true);
  };

  const handleStartExamMode = () => {
    setIsExamMode(!isExamMode);
    onTimerStart?.(!isExamMode);
  };

  const handleStructureGuide = () => {
    setShowStructureModal(true);
  };

  const handleTips = () => {
    setShowTipsModal(true);
  };

  const handleFocus = () => {
    setShowFocusMode(!showFocusMode);
    
    // Apply focus mode styling
    if (!showFocusMode) {
      // Entering focus mode
      document.body.style.backgroundColor = '#1a1a1a';
      document.body.style.color = '#ffffff';
      
      // Hide distracting elements
      const elementsToHide = document.querySelectorAll('.focus-hide');
      elementsToHide.forEach(el => {
        (el as HTMLElement).style.opacity = '0.3';
      });
      
      // Focus on textarea
      textareaRef.current?.focus();
    } else {
      // Exiting focus mode
      document.body.style.backgroundColor = '';
      document.body.style.color = '';
      
      // Show elements again
      const elementsToShow = document.querySelectorAll('.focus-hide');
      elementsToShow.forEach(el => {
        (el as HTMLElement).style.opacity = '1';
      });
    }
  };

  // Chat functionality
  const handleChatMessage = async (message: string) => {
    if (!message.trim() || isChatLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: message,
      sender: 'user',
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setIsChatLoading(true);

    try {
      const response = await generateChatResponse({
        userMessage: message,
        textType,
        currentContent,
        wordCount,
        context: `Student is writing a ${textType} story.`
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
        text: "I'm having trouble connecting right now, but I'm still here to help! Try asking your question again, or keep writing - you're doing great! 🌟",
        sender: 'ai',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleSubmit = () => {
    onSubmit?.();
  };

  const handlePromptChange = (newPrompt: string) => {
    setCurrentPrompt(newPrompt);
    onPromptChange?.(newPrompt);
  };

  // Planning modal steps
  const planningSteps = [
    {
      title: "🎭 Who is your main character?",
      description: "Think about your hero! What do they look like? How old are they? What makes them special?",
      placeholder: "My main character is..."
    },
    {
      title: "🌍 Where does your story happen?",
      description: "Paint a picture of your setting! Is it a magical forest, a busy city, or somewhere completely different?",
      placeholder: "My story takes place in..."
    },
    {
      title: "⚡ What's the big problem?",
      description: "Every great story has a problem to solve! What challenge will your character face?",
      placeholder: "The main problem is..."
    },
    {
      title: "🚀 What exciting things happen?",
      description: "This is where the adventure really begins! What obstacles will your character face? How will they try to solve the problem?",
      placeholder: "The exciting events are..."
    },
    {
      title: "🎯 How does it end?",
      description: "Time for a satisfying ending! How does your character solve the problem? What do they learn? How do they feel at the end?",
      placeholder: "The story ends when..."
    },
    {
      title: "✨ What's your story's message?",
      description: "What important lesson or feeling do you want readers to take away from your story?",
      placeholder: "The message of my story is..."
    }
  ];

  return (
    <div className={`flex h-screen bg-gray-50 transition-all duration-300 ${showFocusMode ? 'bg-gray-900' : ''}`}>
      {/* Left side - Writing Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${showFocusMode ? 'mr-0' : 'mr-4'} max-w-[calc(100%-21rem)]`}>
        {/* Writing Prompt Section */}
        <div className={`bg-white rounded-lg shadow-sm p-6 mb-4 focus-hide ${showFocusMode ? 'opacity-30' : ''}`}>
          <div className="flex items-start space-x-3">
            <div className="bg-yellow-100 p-2 rounded-lg">
              <Lightbulb className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Your Writing Prompt</h2>
              <p className="text-gray-600 leading-relaxed">
                {currentPrompt || "Write an engaging story about a character who discovers something unexpected that changes their life forever. Include vivid descriptions, realistic dialogue, and show the character's emotional journey."}
              </p>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className={`bg-white rounded-lg shadow-sm p-4 mb-4 focus-hide ${showFocusMode ? 'opacity-30' : ''}`}>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handlePlanningPhase}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Target className="w-4 h-4" />
              <span>Planning Phase</span>
            </button>
            <button
              onClick={handleStartExamMode}
              className={`${isExamMode ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200 shadow-md hover:shadow-lg`}
            >
              {isExamMode ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isExamMode ? 'Stop Exam Mode' : 'Start Exam Mode'}</span>
            </button>
            <button
              onClick={handleStructureGuide}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <BookOpen className="w-4 h-4" />
              <span>Structure Guide</span>
            </button>
            <button
              onClick={handleTips}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Lightbulb className="w-4 h-4" />
              <span>Tips</span>
            </button>
            <button
              onClick={handleFocus}
              className={`${showFocusMode ? 'bg-orange-500 hover:bg-orange-600' : 'bg-gray-500 hover:bg-gray-600'} text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200 shadow-md hover:shadow-lg`}
            >
              {showFocusMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{showFocusMode ? 'Exit Focus' : 'Focus'}</span>
            </button>
          </div>
        </div>

        {/* Writing Area */}
        <div className="flex-1 bg-white rounded-lg shadow-sm p-6 mb-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Writing</h3>
          <textarea
            ref={textareaRef}
            value={currentContent}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Start writing your amazing story here! Let your creativity flow and bring your ideas to life..."
            className={`w-full h-full resize-none border-none outline-none text-gray-700 leading-relaxed transition-all duration-300 ${
              showFocusMode ? 'bg-gray-800 text-white text-lg' : 'bg-transparent'
            }`}
            style={{ minHeight: '400px' }}
          />
        </div>

        {/* Status Bar */}
        <div className={`bg-white rounded-lg shadow-sm p-4 focus-hide ${showFocusMode ? 'opacity-30' : ''}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>{wordCount} words</span>
              </div>
              <div className="flex items-center space-x-2">
                <Timer className="w-4 h-4" />
                <span>{calculateWPM()} WPM</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>{readingTime} min read</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-green-600">AI Analysis Active</span>
              </div>
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4" />
                <span>0 issues</span>
              </div>
            </div>
            <button
              onClick={handleSubmit}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Send className="w-4 h-4" />
              <span>Submit for Evaluation Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right side - Writing Buddy Panel */}
      {!showFocusMode && (
        <div className="w-80 min-w-80 flex-shrink-0">
          <TabbedCoachPanel
            content={currentContent}
            textType={textType}
            assistanceLevel="intermediate"
            selectedText={selectedText}
          />
        </div>
      )}

      {/* Planning Modal */}
      {showPlanningModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">📝 Story Planning Workshop</h2>
              <button
                onClick={() => setShowPlanningModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-600">Step {planningStep} of {planningSteps.length}</span>
                <div className="flex space-x-1">
                  {planningSteps.map((_, index) => (
                    <span
                      key={index}
                      className={`h-2 w-2 rounded-full ${index + 1 === planningStep ? 'bg-blue-500' : 'bg-gray-300'}`}
                    ></span>
                  ))}
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-3">{planningSteps[planningStep - 1].title}</h3>
              <p className="text-gray-600 mb-4">{planningSteps[planningStep - 1].description}</p>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[100px]"
                placeholder={planningSteps[planningStep - 1].placeholder}
              ></textarea>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setPlanningStep(prev => Math.max(1, prev - 1))}
                disabled={planningStep === 1}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50"
              >
                Previous
              </button>
              {planningStep < planningSteps.length ? (
                <button
                  onClick={() => setPlanningStep(prev => prev + 1)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={() => {
                    setShowPlanningModal(false);
                    onPopupCompleted?.();
                  }}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  Finish Planning
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Structure Guide Modal */}
      {showStructureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">📚 Structure Guide</h2>
              <button
                onClick={() => setShowStructureModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="prose max-w-none text-gray-700">
              <h3 className="text-xl font-semibold mb-2">Narrative Writing Structure</h3>
              <p>A typical narrative follows a story arc:</p>
              <ol className="list-decimal list-inside space-y-2">
                <li><strong>Exposition:</strong> Introduce characters, setting, and initial situation.</li>
                <li><strong>Rising Action:</strong> Develop the conflict, build suspense, and introduce complications.</li>
                <li><strong>Climax:</strong> The turning point, the most intense moment of the story.</li>
                <li><strong>Falling Action:</strong> Events that happen after the climax, leading to the resolution.</li>
                <li><strong>Resolution:</strong> The conclusion of the story, where conflicts are resolved.</li>
              </ol>
              <h3 className="text-xl font-semibold mt-6 mb-2">Tips for Each Section:</h3>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Exposition:</strong> "Hook" your reader with an interesting opening.</li>
                <li><strong>Rising Action:</strong> Use vivid descriptions and strong verbs.</li>
                <li><strong>Climax:</strong> Make it dramatic and impactful.</li>
                <li><strong>Falling Action:</strong> Tie up loose ends.</li>
                <li><strong>Resolution:</strong> Leave the reader with a sense of closure.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tips Modal */}
      {showTipsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">💡 Writing Tips</h2>
              <button
                onClick={() => setShowTipsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="prose max-w-none text-gray-700">
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Show, Don't Tell:</strong> Instead of saying a character is sad, describe their slumped shoulders and tear-filled eyes.</li>
                <li><strong>Vary Sentence Structure:</strong> Mix short, punchy sentences with longer, more descriptive ones to keep your writing engaging.</li>
                <li><strong>Use Sensory Details:</strong> Engage all five senses (sight, sound, smell, touch, taste) to make your descriptions come alive.</li>
                <li><strong>Strong Verbs and Adjectives:</strong> Choose powerful words that convey meaning precisely and vividly.</li>
                <li><strong>Realistic Dialogue:</strong> Make your characters' conversations sound natural and authentic.</li>
                <li><strong>Pacing:</strong> Control the speed at which your story unfolds. Speed up for action, slow down for reflection.</li>
                <li><strong>Revise and Edit:</strong> Always review your work for clarity, coherence, grammar, and spelling.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
