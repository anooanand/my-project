import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Save, 
  Download, 
  Upload, 
  Eye, 
  EyeOff, 
  RotateCcw, 
  Sparkles, 
  BookOpen, 
  Target, 
  TrendingUp, 
  Award, 
  CheckCircle, 
  AlertCircle, 
  Star, 
  Lightbulb, 
  MessageSquare, 
  BarChart3, 
  Clock, 
  Zap, 
  Heart, 
  Trophy, 
  Wand2, 
  PenTool, 
  FileText, 
  Settings, 
  RefreshCw,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  X,
  Plus,
  Minus,
  ChevronDown,
  ChevronUp,
  Info,
  HelpCircle,
  Calendar,
  Users,
  Globe,
  Mic,
  Camera,
  Image,
  Link,
  Hash,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Code,
  Scissors,
  Clipboard,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Grid,
  Layout,
  Sidebar,
  Menu,
  MoreHorizontal,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Timer,
  Send
} from 'lucide-react';
import { generatePrompt, getSynonyms, rephraseSentence, evaluateEssay } from '../lib/openai';

interface WritingAreaProps {
  onContentChange?: (content: string) => void;
  initialContent?: string;
  textType?: string;
  prompt?: string;
  onPromptChange?: (prompt: string) => void;
}

export function WritingArea({ 
  onContentChange, 
  initialContent = '', 
  textType = 'narrative',
  prompt: propPrompt,
  onPromptChange 
}: WritingAreaProps) {
  // State management
  const [content, setContent] = useState(initialContent);
  const [prompt, setPrompt] = useState(propPrompt || '');
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const [showPlanningModal, setShowPlanningModal] = useState(false);
  const [activeTab, setActiveTab] = useState('text-type-analysis');
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
  const [progressData, setProgressData] = useState({
    wordsWritten: 0,
    timeSpent: 0,
    sessionsCompleted: 0,
    averageWordsPerMinute: 0
  });

  // NSW Selective Exam specific features
  const [examMode, setExamMode] = useState(false);
  const [examTimeLimit, setExamTimeLimit] = useState(30 * 60); // 30 minutes in seconds
  const [examTimeRemaining, setExamTimeRemaining] = useState(examTimeLimit);
  const [targetWordCount, setTargetWordCount] = useState(300); // Typical NSW exam target
  const [showStructureGuide, setShowStructureGuide] = useState(false);

  // Chat functionality for Writing Buddy
  const [chatMessages, setChatMessages] = useState<Array<{id: string, text: string, sender: 'user' | 'ai', timestamp: Date}>>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const examTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Generate prompt on component mount if not provided
  useEffect(() => {
    if (!prompt && textType) {
      generatePrompt(textType).then((generatedPrompt) => {
        setPrompt(generatedPrompt);
        if (onPromptChange) {
          onPromptChange(generatedPrompt);
        }
      }).catch((error) => {
        console.error('Failed to generate prompt:', error);
        setPrompt('Write an engaging story about a character who discovers something unexpected that changes their life forever. Include vivid descriptions, realistic dialogue, and show the character\'s emotional journey. Make sure your story has a clear beginning, middle, and end with a satisfying conclusion. Focus on showing rather than telling, and use sensory details to bring your story to life.');
      });
    }
  }, [textType, prompt, onPromptChange]);

  // Update content statistics
  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
    setCharacterCount(content.length);
    setReadingTime(Math.ceil(words.length / 200)); // Average reading speed: 200 words per minute

    if (onContentChange) {
      onContentChange(content);
    }
  }, [content, onContentChange]);

  // Timer management
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTimerRunning]);

  // Exam timer management
  useEffect(() => {
    if (examMode && examTimeRemaining > 0) {
      examTimerRef.current = setInterval(() => {
        setExamTimeRemaining(prev => {
          if (prev <= 1) {
            setExamMode(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (examTimerRef.current) {
        clearInterval(examTimerRef.current);
      }
    }

    return () => {
      if (examTimerRef.current) {
        clearInterval(examTimerRef.current);
      }
    };
  }, [examMode, examTimeRemaining]);

  // Auto-save functionality
  useEffect(() => {
    const autoSaveTimer = setTimeout(() => {
      if (content.trim()) {
        setIsAutoSaving(true);
        // Simulate auto-save
        setTimeout(() => {
          setIsAutoSaving(false);
          setLastSaved(new Date());
        }, 1000);
      }
    }, 2000);

    return () => clearTimeout(autoSaveTimer);
  }, [content]);

  // Start writing timer when user starts typing
  useEffect(() => {
    if (content.trim() && !isTimerRunning) {
      setIsTimerRunning(true);
    }
  }, [content, isTimerRunning]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  const handleTextSelection = () => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const selected = content.substring(start, end);
      if (selected.trim()) {
        setSelectedText(selected);
      }
    }
  };

  const handleSynonymLookup = async () => {
    if (!selectedText.trim()) return;
    
    setIsLoadingSynonyms(true);
    try {
      const synonymList = await getSynonyms(selectedText);
      setSynonyms(synonymList);
      setShowSynonyms(true);
    } catch (error) {
      console.error('Failed to get synonyms:', error);
    } finally {
      setIsLoadingSynonyms(false);
    }
  };

  const handleParaphrase = async () => {
    if (!paraphraseInput.trim()) return;
    
    setIsParaphrasing(true);
    try {
      const paraphrased = await rephraseSentence(paraphraseInput);
      setParaphraseOutput(paraphrased);
    } catch (error) {
      console.error('Failed to paraphrase:', error);
    } finally {
      setIsParaphrasing(false);
    }
  };

  const handleEvaluate = async () => {
    if (!content.trim()) return;
    
    setIsEvaluating(true);
    try {
      const result = await evaluateEssay(content, textType);
      setEvaluation(result);
    } catch (error) {
      console.error('Failed to evaluate essay:', error);
    } finally {
      setIsEvaluating(false);
    }
  };

  const startExamMode = () => {
    setExamMode(true);
    setExamTimeRemaining(examTimeLimit);
    setIsTimerRunning(true);
  };

  const stopExamMode = () => {
    setExamMode(false);
    if (examTimerRef.current) {
      clearInterval(examTimerRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getWordCountStatus = () => {
    const percentage = (wordCount / targetWordCount) * 100;
    if (percentage < 50) return { color: 'text-red-600', status: 'Too short' };
    if (percentage < 80) return { color: 'text-yellow-600', status: 'Getting there' };
    if (percentage <= 120) return { color: 'text-green-600', status: 'Perfect range' };
    return { color: 'text-orange-600', status: 'Too long' };
  };

  const sendChatMessage = async () => {
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
      // Simulate AI response - replace with actual AI integration
      setTimeout(() => {
        const aiResponse = {
          id: (Date.now() + 1).toString(),
          text: `Great question! For ${textType} writing, I'd suggest focusing on ${textType === 'narrative' ? 'character development and plot structure' : textType === 'persuasive' ? 'strong arguments and evidence' : 'clear explanations and examples'}. Keep writing!`,
          sender: 'ai' as const,
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, aiResponse]);
        setIsChatLoading(false);
      }, 1500);
    } catch (error) {
      console.error('Failed to get AI response:', error);
      setIsChatLoading(false);
    }
  };

  return (
    <div className={`flex flex-col h-screen bg-gray-50 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Main Writing Area */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col">
          {/* Compact Prompt Display - Fixed height and scrollable */}
          <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border-b-2 border-blue-200 p-2 shadow-sm">
            <div className="flex items-start space-x-2">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                <Sparkles className="h-3 w-3 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-blue-900 mb-1 flex items-center">
                  <span className="mr-1">✨</span>
                  Your Writing Prompt
                </h3>
                <div className="bg-white bg-opacity-90 p-2 rounded border border-blue-200 shadow-sm h-14 overflow-y-auto">
                  {prompt ? (
                    <p className="text-gray-800 leading-tight text-xs break-words">{prompt}</p>
                  ) : (
                    <div className="flex items-center space-x-1">
                      <RefreshCw className="h-3 w-3 text-blue-500 animate-spin" />
                      <p className="text-blue-700 text-xs">Loading your writing prompt...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* NSW Exam Status Bar */}
          <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">Words:</span>
                <span className={`font-semibold ${getWordCountStatus().color}`}>
                  {wordCount}/{targetWordCount}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">
                  {examMode ? `Exam: ${formatTime(examTimeRemaining)}` : `Time: ${formatTime(timeSpent)}`}
                </span>
              </div>
              {examMode && (
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${examTimeRemaining > 300 ? 'bg-green-500' : examTimeRemaining > 120 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                  <span className={`font-medium ${examTimeRemaining > 300 ? 'text-green-600' : examTimeRemaining > 120 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {examTimeRemaining > 300 ? 'Good time' : examTimeRemaining > 120 ? 'Hurry up!' : 'Time running out!'}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowPlanningModal(true)}
                className="px-3 py-1 bg-purple-500 text-white rounded text-xs hover:bg-purple-600 transition-colors flex items-center"
              >
                <Wand2 className="h-3 w-3 mr-1" />
                Planning Phase
              </button>
              {!examMode ? (
                <button
                  onClick={startExamMode}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
                >
                  Start Exam Mode
                </button>
              ) : (
                <button
                  onClick={stopExamMode}
                  className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
                >
                  Stop Exam
                </button>
              )}
              <button
                onClick={() => setShowStructureGuide(!showStructureGuide)}
                className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition-colors"
              >
                Structure Guide
              </button>
            </div>
          </div>

          {/* Structure Guide */}
          {showStructureGuide && (
            <div className="bg-green-50 border-b border-green-200 p-4">
              <h4 className="font-semibold text-green-900 mb-3 flex items-center">
                <BookOpen className="h-4 w-4 mr-2" />
                {textType.charAt(0).toUpperCase() + textType.slice(1)} Structure Guide:
              </h4>
              <div className="text-sm text-green-800">
                {textType === 'narrative' && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white p-3 rounded-lg border border-green-200">
                      <strong className="text-green-900">Opening:</strong>
                      <p className="text-xs mt-1">Hook, character, setting</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-green-200">
                      <strong className="text-green-900">Rising Action:</strong>
                      <p className="text-xs mt-1">Build tension, conflict</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-green-200">
                      <strong className="text-green-900">Climax:</strong>
                      <p className="text-xs mt-1">Peak moment</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-green-200">
                      <strong className="text-green-900">Resolution:</strong>
                      <p className="text-xs mt-1">Conclude, growth</p>
                    </div>
                  </div>
                )}
                {textType === 'persuasive' && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white p-3 rounded-lg border border-green-200">
                      <strong className="text-green-900">Introduction:</strong>
                      <p className="text-xs mt-1">State position clearly</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-green-200">
                      <strong className="text-green-900">Arguments:</strong>
                      <p className="text-xs mt-1">2-3 strong points with evidence</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-green-200">
                      <strong className="text-green-900">Counter-arguments:</strong>
                      <p className="text-xs mt-1">Address opposing views</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-green-200">
                      <strong className="text-green-900">Conclusion:</strong>
                      <p className="text-xs mt-1">Restate, call to action</p>
                    </div>
                  </div>
                )}
                {textType === 'expository' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-white p-3 rounded-lg border border-green-200">
                      <strong className="text-green-900">Introduction:</strong>
                      <p className="text-xs mt-1">Introduce topic clearly</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-green-200">
                      <strong className="text-green-900">Body:</strong>
                      <p className="text-xs mt-1">2-3 main points with examples</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-green-200">
                      <strong className="text-green-900">Conclusion:</strong>
                      <p className="text-xs mt-1">Summarize key points</p>
                    </div>
                  </div>
                )}
                {!['narrative', 'persuasive', 'expository'].includes(textType) && (
                  <div className="bg-white p-3 rounded-lg border border-green-200">
                    <p className="text-sm">Structure guide for <strong>{textType}</strong> writing:</p>
                    <ul className="text-xs mt-2 space-y-1">
                      <li>• Start with a clear introduction</li>
                      <li>• Develop your main ideas in the body</li>
                      <li>• End with a strong conclusion</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Writing Textarea - Maximized space */}
          <div className="flex-1 p-3">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              onSelect={handleTextSelection}
              placeholder="Start writing your amazing story here! Let your creativity flow and bring your ideas to life..."
              className="w-full h-full p-4 border-2 border-blue-200 rounded-lg focus:border-blue-400 focus:outline-none resize-none text-gray-800 leading-relaxed shadow-sm"
              style={{ fontSize: `${fontSize}px`, lineHeight }}
            />
          </div>

          {/* Submit Button - Prominently positioned */}
          <div className="bg-white border-t border-gray-200 p-3 flex justify-center">
            <button
              onClick={handleEvaluate}
              disabled={!content.trim() || isEvaluating}
              className="flex items-center px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {isEvaluating ? (
                <>
                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                  Evaluating...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5 mr-2" />
                  Submit for Evaluation
                </>
              )}
            </button>
          </div>
        </div>

        {/* Writing Buddy Sidebar - Moved up to touch header */}
        <div className="w-80 bg-gradient-to-b from-purple-500 to-pink-500 text-white flex flex-col shadow-xl">
          {/* Writing Buddy Header */}
          <div className="p-4 border-b border-white border-opacity-20">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <Heart className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Writing Buddy</h2>
                <p className="text-purple-100 text-sm">Your AI writing assistant</p>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-white border-opacity-20">
            {[
              { id: 'text-type-analysis', label: 'Analysis', icon: BarChart3 },
              { id: 'vocabulary-builder', label: 'Vocabulary', icon: BookOpen },
              { id: 'progress-tracker', label: 'Progress', icon: TrendingUp },
              { id: 'ai-coach', label: 'Coach', icon: MessageSquare }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center py-3 px-2 text-xs font-medium transition-colors ${
                  activeTab === tab.id 
                    ? 'bg-white bg-opacity-20 text-white' 
                    : 'text-purple-200 hover:text-white hover:bg-white hover:bg-opacity-10'
                }`}
              >
                <tab.icon className="h-4 w-4 mb-1" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 p-4 overflow-y-auto">
            {activeTab === 'text-type-analysis' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Analysis
                </h3>
                
                <div className="bg-white bg-opacity-10 rounded-lg p-3">
                  <h4 className="font-medium mb-2">Word Count</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Current: {wordCount}</span>
                    <span className="text-sm">Target: {targetWordCount} words</span>
                  </div>
                  <div className="w-full bg-white bg-opacity-20 rounded-full h-2 mt-2">
                    <div 
                      className="bg-white rounded-full h-2 transition-all duration-300"
                      style={{ width: `${Math.min((wordCount / targetWordCount) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="bg-white bg-opacity-10 rounded-lg p-3">
                  <h4 className="font-medium mb-2">Reading Time</h4>
                  <p className="text-sm">{readingTime} min</p>
                  <p className="text-xs text-purple-200 mt-1">Based on 200 words/minute</p>
                </div>

                <div className="bg-white bg-opacity-10 rounded-lg p-3">
                  <h4 className="font-medium mb-2">Writing Speed</h4>
                  <p className="text-sm">{timeSpent > 0 ? Math.round((wordCount / timeSpent) * 60) : 0} wpm</p>
                  <p className="text-xs text-purple-200 mt-1">Target: 12-15 words/minute</p>
                </div>

                <button
                  onClick={() => setActiveTab('ai-coach')}
                  className="w-full bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg py-2 px-3 text-sm font-medium transition-colors"
                >
                  <BarChart3 className="h-4 w-4 inline mr-2" />
                  Analyze Text Type
                </button>
              </div>
            )}

            {activeTab === 'vocabulary-builder' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Vocabulary
                </h3>

                <div className="bg-white bg-opacity-10 rounded-lg p-3">
                  <h4 className="font-medium mb-2">Selected Text</h4>
                  <p className="text-sm bg-white bg-opacity-20 rounded p-2 min-h-[2rem]">
                    {selectedText || 'Select text in your writing to get synonyms'}
                  </p>
                  <button
                    onClick={handleSynonymLookup}
                    disabled={!selectedText || isLoadingSynonyms}
                    className="mt-2 w-full bg-white bg-opacity-20 hover:bg-opacity-30 disabled:opacity-50 rounded py-2 px-3 text-sm font-medium transition-colors"
                  >
                    {isLoadingSynonyms ? 'Loading...' : 'Get Synonyms'}
                  </button>
                </div>

                {synonyms.length > 0 && (
                  <div className="bg-white bg-opacity-10 rounded-lg p-3">
                    <h4 className="font-medium mb-2">Synonyms</h4>
                    <div className="flex flex-wrap gap-2">
                      {synonyms.map((synonym, index) => (
                        <span
                          key={index}
                          className="bg-white bg-opacity-20 rounded-full px-2 py-1 text-xs cursor-pointer hover:bg-opacity-30 transition-colors"
                          onClick={() => {
                            // Replace selected text with synonym
                            if (textareaRef.current) {
                              const start = textareaRef.current.selectionStart;
                              const end = textareaRef.current.selectionEnd;
                              const newContent = content.substring(0, start) + synonym + content.substring(end);
                              setContent(newContent);
                            }
                          }}
                        >
                          {synonym}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-white bg-opacity-10 rounded-lg p-3">
                  <h4 className="font-medium mb-2">Paraphrase Tool</h4>
                  <textarea
                    value={paraphraseInput}
                    onChange={(e) => setParaphraseInput(e.target.value)}
                    placeholder="Enter text to paraphrase..."
                    className="w-full bg-white bg-opacity-20 rounded p-2 text-sm text-white placeholder-purple-200 resize-none"
                    rows={3}
                  />
                  <button
                    onClick={handleParaphrase}
                    disabled={!paraphraseInput.trim() || isParaphrasing}
                    className="mt-2 w-full bg-white bg-opacity-20 hover:bg-opacity-30 disabled:opacity-50 rounded py-2 px-3 text-sm font-medium transition-colors"
                  >
                    {isParaphrasing ? 'Paraphrasing...' : 'Paraphrase'}
                  </button>
                  {paraphraseOutput && (
                    <div className="mt-2 bg-white bg-opacity-20 rounded p-2">
                      <p className="text-sm">{paraphraseOutput}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'progress-tracker' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Progress
                </h3>

                <div className="bg-white bg-opacity-10 rounded-lg p-3">
                  <h4 className="font-medium mb-2">Session Stats</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Words Written:</span>
                      <span className="text-sm font-medium">{wordCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Time Spent:</span>
                      <span className="text-sm font-medium">{formatTime(timeSpent)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Writing Speed:</span>
                      <span className="text-sm font-medium">
                        {timeSpent > 0 ? Math.round((wordCount / timeSpent) * 60) : 0} wpm
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white bg-opacity-10 rounded-lg p-3">
                  <h4 className="font-medium mb-2">NSW Exam Progress</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Word Target:</span>
                      <span className="text-sm font-medium">{targetWordCount} words</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Progress:</span>
                      <span className="text-sm font-medium">
                        {Math.round((wordCount / targetWordCount) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
                      <div 
                        className="bg-white rounded-full h-2 transition-all duration-300"
                        style={{ width: `${Math.min((wordCount / targetWordCount) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {examMode && (
                  <div className="bg-white bg-opacity-10 rounded-lg p-3">
                    <h4 className="font-medium mb-2">Exam Mode</h4>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${examTimeRemaining > 300 ? 'text-green-300' : examTimeRemaining > 120 ? 'text-yellow-300' : 'text-red-300'}`}>
                        {formatTime(examTimeRemaining)}
                      </div>
                      <p className="text-sm text-purple-200">Time Remaining</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'ai-coach' && (
              <div className="space-y-4 h-full flex flex-col">
                <h3 className="text-lg font-semibold flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Coaching Tips
                </h3>

                <div className="bg-white bg-opacity-10 rounded-lg p-3">
                  <h4 className="font-medium mb-2">Write your text and submit it for detailed feedback and coaching tips!</h4>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 bg-white bg-opacity-10 rounded-lg p-3 overflow-y-auto">
                  <div className="space-y-3 mb-4">
                    {chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`p-2 rounded-lg text-sm ${
                          message.sender === 'user'
                            ? 'bg-white bg-opacity-20 ml-4'
                            : 'bg-white bg-opacity-30 mr-4'
                        }`}
                      >
                        <p>{message.text}</p>
                        <p className="text-xs text-purple-200 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    ))}
                    {isChatLoading && (
                      <div className="bg-white bg-opacity-30 mr-4 p-2 rounded-lg text-sm">
                        <div className="flex items-center space-x-2">
                          <RefreshCw className="h-3 w-3 animate-spin" />
                          <span>Writing Buddy is thinking...</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Chat Input */}
                <div className="bg-white bg-opacity-10 rounded-lg p-3">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                      placeholder="Ask me anything..."
                      className="flex-1 bg-white bg-opacity-20 rounded px-3 py-2 text-sm text-white placeholder-purple-200 focus:outline-none focus:bg-opacity-30"
                    />
                    <button
                      onClick={sendChatMessage}
                      disabled={!chatInput.trim() || isChatLoading}
                      className="bg-white bg-opacity-20 hover:bg-opacity-30 disabled:opacity-50 rounded px-3 py-2 transition-colors"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Planning Modal */}
      {showPlanningModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Planning Phase</h2>
              <button
                onClick={() => setShowPlanningModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Planning Notes
                </label>
                <textarea
                  value={planningNotes}
                  onChange={(e) => setPlanningNotes(e.target.value)}
                  placeholder="Brainstorm your ideas, outline your structure, plan your characters..."
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Writing Goals
                </label>
                <textarea
                  value={writingGoals}
                  onChange={(e) => setWritingGoals(e.target.value)}
                  placeholder="What do you want to achieve with this piece? What message do you want to convey?"
                  className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowPlanningModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowPlanningModal(false)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Save & Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WritingArea;
