import React, { useState, useEffect, useRef } from 'react';
import { Save, Download, Upload, Eye, EyeOff, RotateCcw, Sparkles, BookOpen, Target, TrendingUp, Award, CheckCircle, AlertCircle, Star, Lightbulb, MessageSquare, BarChart3, Clock, Zap, Heart, Trophy, Wand2, PenTool, FileText, Settings, RefreshCw, Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, Copy, Check, X, Plus, Minus, ChevronDown, ChevronUp, Info, HelpCircle, Calendar, Users, Globe, Mic, Camera, Image, Link, Hash, Type, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline, List, ListOrdered, Quote, Code, Scissors, Clipboard, Search, Filter, SortAsc, SortDesc, Grid, Layout, Sidebar, Menu, MoreHorizontal, MoreVertical, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Timer, Send, Bot, StopCircle, MapPin, Users2, Smile } from 'lucide-react';
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
  
  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize welcome message
  useEffect(() => {
    if (chatMessages.length === 0) {
      setChatMessages([{
        id: '1',
        text: "Hi! I'm your AI Writing Buddy! 🤖 I'm here to help you write amazing stories. Ask me anything about writing!",
        sender: 'ai',
        timestamp: new Date()
      }]);
    }
  }, []);

  // Handle content changes
  const handleContentChange = (newContent: string) => {
    setCurrentContent(newContent);
    onChange?.(newContent);
    onContentChange?.(newContent);
  };

  // Handle prompt changes
  const handlePromptChange = (newPrompt: string) => {
    setCurrentPrompt(newPrompt);
    onPromptChange?.(newPrompt);
  };

  // Text selection handler
  const handleTextSelection = () => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const selected = currentContent.substring(start, end);
      setSelectedText(selected);
    }
  };

  // Planning modal handlers
  const handlePlanningPhase = () => {
    setShowPlanningModal(true);
    setPlanningStep(1);
  };

  const handleStartExamMode = () => {
    setIsExamMode(true);
    onTimerStart?.(true);
  };

  const handleStructureGuide = () => {
    setShowStructureModal(true);
  };

  const handleTips = () => {
    setShowTipsModal(true);
  };

  const handleFocus = () => {
    setShowFocusMode(!showFocusMode);
  };

  // Chat functionality
  const handleChatMessage = async (message: string) => {
    if (!message.trim() || isChatLoading) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: message,
      sender: 'user',
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, userMessage]);
    setIsChatLoading(true);

    try {
      // Get AI response
      const aiResponse = await generateChatResponse({
        userMessage: message,
        textType,
        currentContent,
        wordCount: currentContent.split(/\s+/).filter(word => word.length > 0).length,
        context: `Student is writing a ${textType} story.`
      });

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "I'm having trouble connecting right now, but I'm here to help! Try asking your question again.",
        sender: 'ai',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Kid planning modal handlers
  const handleKidPlanningNext = () => {
    if (planningStep < 6) {
      setPlanningStep(planningStep + 1);
    } else {
      setShowPlanningModal(false);
      setPlanningStep(1);
    }
  };

  const handleKidPlanningPrev = () => {
    if (planningStep > 1) {
      setPlanningStep(planningStep - 1);
    }
  };

  // Calculate stats
  const wordCount = currentContent.split(/\s+/).filter(word => word.length > 0).length;
  const charCount = currentContent.length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white px-6 py-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-6 h-6" />
              <span className="text-lg font-semibold">Text Type:</span>
            </div>
            <select
              value={textType}
              onChange={(e) => onTextTypeChange?.(e.target.value)}
              className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg px-3 py-2 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              <option value="narrative">Narrative</option>
              <option value="persuasive">Persuasive</option>
              <option value="expository">Expository</option>
              <option value="descriptive">Descriptive</option>
              <option value="creative">Creative</option>
            </select>
          </div>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg px-4 py-2 text-white hover:bg-white/30 transition-all duration-200 flex items-center space-x-2"
          >
            <span>Home</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side - Writing Area */}
        <div className="flex-1 flex flex-col bg-white/80 backdrop-blur-sm">
          {/* Writing Prompt */}
          <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200 p-6">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Lightbulb className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Your Writing Prompt</h3>
                <p className="text-gray-700 leading-relaxed">
                  {currentPrompt || "Write an engaging story about a character who discovers something unexpected that changes their life forever. Include vivid descriptions, realistic dialogue, and show the character's emotional journey."}
                </p>
              </div>
            </div>
          </div>

          {/* Writing Analysis Section - REMOVED as requested */}
          
          {/* Toolbar */}
          <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Your Writing</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePlanningPhase}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <Target className="w-4 h-4" />
                  <span>Planning Phase</span>
                </button>
                <button
                  onClick={handleStartExamMode}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <Play className="w-4 h-4" />
                  <span>Start Exam Mode</span>
                </button>
                <button
                  onClick={handleStructureGuide}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200 shadow-md hover:shadow-lg"
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
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <Eye className="w-4 h-4" />
                  <span>Focus</span>
                </button>
              </div>
            </div>
          </div>

          {/* Writing Textarea */}
          <div className="flex-1 p-6">
            <textarea
              ref={textareaRef}
              value={currentContent}
              onChange={(e) => handleContentChange(e.target.value)}
              onSelect={handleTextSelection}
              placeholder="Start writing your amazing story here! Let your creativity flow and bring your ideas to life..."
              className="w-full h-full resize-none border-none outline-none text-gray-800 text-lg leading-relaxed bg-transparent placeholder-gray-400"
              style={{ minHeight: '400px' }}
            />
          </div>

          {/* Status Bar */}
          <div className="bg-white/90 backdrop-blur-sm border-t border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>{wordCount} words</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Type className="w-4 h-4" />
                  <span>{charCount} characters</span>
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
                onClick={onSubmit}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <Award className="w-4 h-4" />
                <span>Submit for Evaluation Report</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side - Writing Buddy Panel */}
        <div className="w-96 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 text-white flex flex-col">
          <TabbedCoachPanel
            content={currentContent}
            textType={textType}
            assistanceLevel="intermediate"
            selectedText={selectedText}
            onNavigate={() => {}}
          />
        </div>
      </div>

      {/* Modals */}
      {showPlanningModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Story Planning - Step {planningStep} of 6</h2>
                <button
                  onClick={() => setShowPlanningModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                {planningStep === 1 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">🎭 Who is your main character?</h3>
                    <p className="text-gray-600 mb-4">Think about your hero! What's their name? How old are they? What do they look like?</p>
                    <textarea
                      placeholder="My main character is..."
                      className="w-full h-32 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
                
                {planningStep === 2 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">🌍 Where does your story happen?</h3>
                    <p className="text-gray-600 mb-4">Describe the place where your story takes place. Is it a school, a magical forest, or somewhere else exciting?</p>
                    <textarea
                      placeholder="My story takes place in..."
                      className="w-full h-32 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
                
                {planningStep === 3 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">⚡ What's the big problem or challenge?</h3>
                    <p className="text-gray-600 mb-4">Every great story has a problem to solve! What challenge will your character face?</p>
                    <textarea
                      placeholder="The main problem is..."
                      className="w-full h-32 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
                
                {planningStep === 4 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">🚀 How does your story begin?</h3>
                    <p className="text-gray-600 mb-4">Plan an exciting opening! How will you grab your reader's attention from the very first sentence?</p>
                    <textarea
                      placeholder="My story starts when..."
                      className="w-full h-32 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
                
                {planningStep === 5 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">🎢 What exciting things happen in the middle?</h3>
                    <p className="text-gray-600 mb-4">This is where the adventure really begins! What obstacles will your character face? How will they try to solve the problem?</p>
                    <textarea
                      placeholder="In the middle of my story..."
                      className="w-full h-32 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
                
                {planningStep === 6 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">🎉 How does everything end?</h3>
                    <p className="text-gray-600 mb-4">Time for a satisfying ending! How does your character solve the problem? What do they learn? How do they feel at the end?</p>
                    <textarea
                      placeholder="My story ends when..."
                      className="w-full h-32 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between mt-8">
                <button
                  onClick={handleKidPlanningPrev}
                  disabled={planningStep === 1}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5, 6].map((step) => (
                    <div
                      key={step}
                      className={`w-3 h-3 rounded-full ${
                        step === planningStep ? 'bg-blue-500' : step < planningStep ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <button
                  onClick={handleKidPlanningNext}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  {planningStep === 6 ? 'Finish Planning' : 'Next'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showStructureModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Structure Guide - {textType.charAt(0).toUpperCase() + textType.slice(1)} Writing</h2>
                <button
                  onClick={() => setShowStructureModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">📖 Introduction (Beginning)</h3>
                  <p className="text-blue-700">Start with a hook to grab attention. Introduce your main character and setting. Set up the problem or situation.</p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">🎢 Body (Middle)</h3>
                  <p className="text-green-700">Develop the story with exciting events. Show how your character tries to solve the problem. Include dialogue and action.</p>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-purple-800 mb-2">🎯 Conclusion (End)</h3>
                  <p className="text-purple-700">Resolve the problem. Show how your character has changed or what they learned. End with a satisfying conclusion.</p>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowStructureModal(false)}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Got it!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
