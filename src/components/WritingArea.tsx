import React, { useState, useEffect, useRef, useCallback } from 'react';
import EnhancedGrammarTextEditor from './EnhancedGrammarTextEditor';
import '../styles/grammarChecker.css';
import { Save, Download, Upload, Eye, EyeOff, RotateCcw, Sparkles, BookOpen, Target, TrendingUp, Award, CheckCircle, AlertCircle, Star, Lightbulb, MessageSquare, BarChart3, Clock, Zap, Heart, Trophy, PenTool, FileText, Settings, RefreshCw, Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, Copy, Check, X, Plus, Minus, ChevronDown, ChevronUp, Info, HelpCircle, Calendar, Users, Globe, Mic, Camera, Image, Link, Hash, Type, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline, List, ListOrdered, Quote, Code, Scissors, Clipboard, Search, Filter, SortAsc, SortDesc, Grid, Layout, Sidebar, Menu, MoreHorizontal, MoreVertical, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Timer, Send, Bot, StopCircle, MapPin, Users2, Smile } from 'lucide-react';
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
  
  // Prompt state - removed magical prompt generation functionality
  const [generatedPrompt, setGeneratedPrompt] = useState(prompt || '');
  
  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Update generatedPrompt when prompt prop changes
  useEffect(() => {
    if (prompt) {
      setGeneratedPrompt(prompt);
    }
  }, [prompt]);

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
        {/* Prompt Display - Only show if prompt exists */}
        {generatedPrompt && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg mx-3 mt-3 overflow-hidden shadow-sm">
            <div className="flex items-center gap-2 px-4 py-3 bg-blue-100 border-b border-blue-200">
              <PenTool className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-800">Your Writing Prompt</span>
            </div>
            <div className="px-4 py-3 text-sm text-gray-800 leading-relaxed bg-white">
              {generatedPrompt}
            </div>
          </div>
        )}

        {/* Main Writing Area */}
        <div className="flex-1 flex flex-col px-3 pb-3 pt-3">
          <div className={`${focusMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-lg shadow-sm flex-1 flex flex-col overflow-hidden transition-colors duration-300`}>
            {/* Writing Area Header - Removed Magical Prompt button */}
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
                  Start Exam Mode
                </button>
                <button
                  onClick={() => setShowStructureGuide(!showStructureGuide)}
                  className="flex items-center px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors"
                >
                  <BookOpen className="w-3 h-3 mr-1" />
                  Structure Guide
                </button>
                <button
                  onClick={() => setFocusMode(!focusMode)}
                  className="flex items-center px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition-colors"
                >
                  <Target className="w-3 h-3 mr-1" />
                  Focus Mode
                </button>
              </div>
            </div>

            {/* Structure Guide */}
            {showStructureGuide && (
              <div className="bg-green-50 border-b border-green-200 p-3">
                <div className="text-sm text-green-800">
                  <h4 className="font-semibold mb-2">{textType} Structure Guide:</h4>
                  {textType.toLowerCase() === 'narrative' && (
                    <ul className="space-y-1 text-xs">
                      <li>• <strong>Opening:</strong> Hook your reader and introduce your character</li>
                      <li>• <strong>Rising Action:</strong> Build tension and develop the conflict</li>
                      <li>• <strong>Climax:</strong> The turning point of your story</li>
                      <li>• <strong>Resolution:</strong> Wrap up the story and show character growth</li>
                    </ul>
                  )}
                  {textType.toLowerCase() === 'persuasive' && (
                    <ul className="space-y-1 text-xs">
                      <li>• <strong>Introduction:</strong> State your position clearly</li>
                      <li>• <strong>Arguments:</strong> Present evidence and reasoning</li>
                      <li>• <strong>Counter-arguments:</strong> Address opposing views</li>
                      <li>• <strong>Conclusion:</strong> Reinforce your main argument</li>
                    </ul>
                  )}
                  {textType.toLowerCase() === 'expository' && (
                    <ul className="space-y-1 text-xs">
                      <li>• <strong>Introduction:</strong> Introduce your topic</li>
                      <li>• <strong>Body:</strong> Explain with facts and examples</li>
                      <li>• <strong>Organization:</strong> Use clear topic sentences</li>
                      <li>• <strong>Conclusion:</strong> Summarize key points</li>
                    </ul>
                  )}
                </div>
              </div>
            )}

            {/* Exam Mode Banner */}
            {examMode && (
              <div className="bg-red-500 text-white px-3 py-2 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">EXAM MODE</span>
                  <span className="text-sm">Time: {formatTime(examTimeRemaining)}</span>
                  <span className="text-sm">Target: {targetWordCount} words</span>
                </div>
                <button
                  onClick={stopExamMode}
                  className="text-sm bg-red-600 hover:bg-red-700 px-2 py-1 rounded transition-colors"
                >
                  End Exam
                </button>
              </div>
            )}

            {/* Enhanced Grammar Text Editor */}
            <div className="flex-1 overflow-hidden">
              <EnhancedGrammarTextEditor
                content={content}
                onChange={handleContentChange}
                placeholder={generatedPrompt ? "Start writing your amazing story here! Let your creativity flow and bring your ideas to life..." : "Start writing here..."}
                className={`w-full h-full resize-none border-0 outline-none p-4 ${
                  focusMode 
                    ? 'bg-gray-800 text-gray-100 placeholder-gray-400' 
                    : 'bg-white text-gray-900 placeholder-gray-500'
                }`}
                style={{
                  fontSize: `${fontSize}px`,
                  lineHeight: lineHeight,
                  fontFamily: 'Inter, system-ui, sans-serif'
                }}
                ref={textareaRef}
              />
            </div>

            {/* Writing Status Bar */}
            <WritingStatusBar
              wordCount={wordCount}
              characterCount={characterCount}
              readingTime={readingTime}
              timeSpent={timeSpent}
              isAutoSaving={isAutoSaving}
              lastSaved={lastSaved}
              targetWordCount={targetWordCount}
              showWordCount={showWordCount}
              examMode={examMode}
            />
          </div>
        </div>
      </div>

      {/* Kid Planning Modal */}
      {showKidPlanningModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Sparkles className="w-6 h-6 mr-2 text-purple-500" />
                  Story Planning Helper
                </h2>
                <button
                  onClick={() => setShowKidPlanningModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Let's plan your amazing story!</h3>
                  <p className="text-blue-800 text-sm">Answer these questions to help organize your thoughts before writing.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Who are the main characters in your story?
                    </label>
                    <textarea
                      value={kidPlanningData.characters}
                      onChange={(e) => setKidPlanningData(prev => ({ ...prev, characters: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={2}
                      placeholder="Describe your main characters..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Where and when does your story take place?
                    </label>
                    <textarea
                      value={kidPlanningData.setting}
                      onChange={(e) => setKidPlanningData(prev => ({ ...prev, setting: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={2}
                      placeholder="Describe the setting..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What problem or challenge will your character face?
                    </label>
                    <textarea
                      value={kidPlanningData.problem}
                      onChange={(e) => setKidPlanningData(prev => ({ ...prev, problem: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={2}
                      placeholder="What conflict or problem happens?"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What important events will happen in your story?
                    </label>
                    <textarea
                      value={kidPlanningData.events}
                      onChange={(e) => setKidPlanningData(prev => ({ ...prev, events: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="List the main events..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      How will the problem be solved?
                    </label>
                    <textarea
                      value={kidPlanningData.solution}
                      onChange={(e) => setKidPlanningData(prev => ({ ...prev, solution: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={2}
                      placeholder="How does it end?"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What feelings or emotions will be important in your story?
                    </label>
                    <textarea
                      value={kidPlanningData.feelings}
                      onChange={(e) => setKidPlanningData(prev => ({ ...prev, feelings: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={2}
                      placeholder="What emotions will your characters feel?"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowKidPlanningModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowKidPlanningModal(false);
                      // You could save the planning data here
                      console.log('Planning data:', kidPlanningData);
                    }}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Save Plan & Start Writing
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
