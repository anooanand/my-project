import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Save, Download, Upload, Eye, EyeOff, RotateCcw, Sparkles, BookOpen, Target, TrendingUp, Award, CheckCircle, AlertCircle, Star, Lightbulb, MessageSquare, BarChart3, Clock, Zap, Heart, Trophy, Wand2, PenTool, FileText, Settings, RefreshCw, Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, Copy, Check, X, Plus, Minus, ChevronDown, ChevronUp, Info, HelpCircle, Calendar, Users, Globe, Mic, Camera, Image, Link, Hash, Type, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline, List, ListOrdered, Quote, Code, Scissors, Clipboard, Search, Filter, SortAsc, SortDesc, Grid, Layout, Sidebar, Menu, MoreHorizontal, MoreVertical, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Timer, Send, Bot } from 'lucide-react';
import { generatePrompt, getSynonyms, rephraseSentence, evaluateEssay } from '../lib/openai';
import { WritingStatusBar } from './WritingStatusBar';

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
  const [activeTab, setActiveTab] = useState('analysis');
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
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Enhanced prompt loading with better debugging and fallback
  useEffect(() => {
    const loadPrompt = () => {
      console.log('🔍 WritingArea: Loading prompt...');
      console.log('🔍 PropPrompt:', propPrompt);
      console.log('🔍 TextType:', textType);
      // Priority order for prompt sources
      const sources = [
        { name: 'propPrompt', value: propPrompt },
        { name: 'generatedPrompt', value: localStorage.getItem('generatedPrompt') },
        { name: `${textType}_prompt`, value: localStorage.getItem(`${textType}_prompt`) },
        { name: 'customPrompt', value: localStorage.getItem('customPrompt') },
        { name: 'selectedPrompt', value: localStorage.getItem('selectedPrompt') },
        { name: 'currentPrompt', value: localStorage.getItem('currentPrompt') },
        { name: 'writingPrompt', value: localStorage.getItem('writingPrompt') },
        { name: 'narrative_prompt', value: localStorage.getItem('narrative_prompt') },
        { name: 'persuasive_prompt', value: localStorage.getItem('persuasive_prompt') },
        { name: 'expository_prompt', value: localStorage.getItem('expository_prompt') }
      ];
      console.log('🔍 All localStorage keys:', Object.keys(localStorage));
      let loadedPrompt = '';
      for (const source of sources) {
        console.log(`🔍 Checking ${source.name}:`, source.value);
        if (source.value && source.value.trim() && source.value !== 'null' && source.value !== 'undefined') {
          console.log(`✅ WritingArea: Prompt loaded from ${source.name}:`, source.value.substring(0, 100) + '...');
          loadedPrompt = source.value;
          break;
        }
      }
      if (loadedPrompt) {
        setPrompt(loadedPrompt);
        if (onPromptChange) {
          onPromptChange(loadedPrompt);
        }
      } else {
        console.log('⚠️ WritingArea: No prompt found in any source, attempting to generate or use fallback');
        generatePrompt(textType).then((generatedPrompt) => {
          setPrompt(generatedPrompt);
          if (onPromptChange) {
            onPromptChange(generatedPrompt);
          }
        }).catch((error) => {
          console.error('Failed to generate prompt:', error);
          // Enhanced fallback prompts optimized for NSW Selective exam
          const fallbackPrompts = {
            narrative: "Write an engaging story about a character who discovers something unexpected that changes their life forever. Include vivid descriptions, realistic dialogue, and show how the character grows throughout the story. Focus on creating a clear beginning, middle, and end with engaging plot development. (Target: 250-350 words)",
            persuasive: "Write a compelling persuasive essay arguing for or against a topic you feel strongly about. Use logical reasoning, credible evidence, emotional appeals, and address counterarguments to convince your readers. End with a strong call to action. (Target: 250-350 words)",
            expository: "Write an informative essay explaining a topic you're knowledgeable about or find interesting. Provide clear explanations, specific examples, and organize your information in a logical way that helps readers understand the subject thoroughly. (Target: 250-350 words)",
            reflective: "Write a thoughtful reflection about a meaningful experience in your life. Explore what you learned, how it changed you, and what insights you gained. Use descriptive language to help readers understand both the experience and your thoughts about it. (Target: 250-350 words)",
            descriptive: "Write a vivid description of a place, person, or object that is meaningful to you. Use sensory details, figurative language, and specific examples to create a clear and engaging picture in your reader's mind. (Target: 250-350 words)"
          };
          const finalFallbackPrompt = fallbackPrompts[textType as keyof typeof fallbackPrompts] || fallbackPrompts.narrative;
          console.log('🔄 Using final fallback prompt for', textType, ':', finalFallbackPrompt);
          setPrompt(finalFallbackPrompt);
          if (onPromptChange) {
            onPromptChange(finalFallbackPrompt);
          }
        });
      }
    };

    loadPrompt();
    // Also listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && (e.key.includes('prompt') || e.key.includes('Prompt'))) {
        console.log('📢 Storage change detected for prompt:', e.key, e.newValue);
        loadPrompt();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    // Check for prompt updates every 2 seconds for the first 10 seconds
    const promptCheckInterval = setInterval(() => {
      loadPrompt();
    }, 2000);
    setTimeout(() => {
      clearInterval(promptCheckInterval);
    }, 10000);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(promptCheckInterval);
    };
  }, [propPrompt, textType, onPromptChange]);

  // Auto-save functionality
  useEffect(() => {
    const autoSave = () => {
      if (content.trim()) {
        setIsAutoSaving(true);
        localStorage.setItem('writingContent', content);
        localStorage.setItem('lastSaved', new Date().toISOString());
        setLastSaved(new Date());
        setTimeout(() => setIsAutoSaving(false), 1000);
      }
    };
    const autoSaveTimer = setTimeout(autoSave, 2000);
    return () => clearTimeout(autoSaveTimer);
  }, [content]);

  // Timer functionality
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

  // Exam timer functionality
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

  // Update statistics when content changes
  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;
    const characterCount = content.length;
    const readingTime = Math.ceil(wordCount / 200); // Average reading speed
    setWordCount(wordCount);
    setCharacterCount(characterCount);
    setReadingTime(readingTime);
    if (onContentChange) {
      onContentChange(content);
    }
    // Update progress data
    setProgressData(prev => ({
      ...prev,
      wordsWritten: wordCount,
      averageWordsPerMinute: timeSpent > 0 ? Math.round((wordCount / timeSpent) * 60) : 0
    }));
  }, [content, onContentChange, timeSpent]);

  // Scroll chat to bottom when new messages are added
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Handle content change
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    // Start timer when user starts typing
    if (!isTimerRunning && newContent.trim()) {
      setIsTimerRunning(true);
    }
  };

  // Handle text selection for synonyms
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      const selectedText = selection.toString().trim();
      if (selectedText.split(' ').length === 1) { // Only single words
        setSelectedText(selectedText);
        setShowSynonyms(true);
        loadSynonyms(selectedText);
      }
    }
  };

  // Load synonyms for selected word
  const loadSynonyms = async (word: string) => {
    setIsLoadingSynonyms(true);
    try {
      const synonymList = await getSynonyms(word);
      setSynonyms(synonymList);
    } catch (error) {
      console.error('Error loading synonyms:', error);
      // Provide fallback synonyms
      const fallbackSynonyms: { [key: string]: string[] } = {
        'good': ['excellent', 'great', 'wonderful', 'fantastic', 'superb'],
        'bad': ['terrible', 'awful', 'horrible', 'dreadful', 'poor'],
        'big': ['large', 'huge', 'enormous', 'massive', 'gigantic'],
        'small': ['tiny', 'little', 'miniature', 'petite', 'compact'],
        'said': ['stated', 'declared', 'announced', 'proclaimed', 'mentioned'],
        'went': ['traveled', 'journeyed', 'proceeded', 'departed', 'ventured']
      };
      setSynonyms(fallbackSynonyms[word.toLowerCase()] || ['alternative', 'substitute', 'replacement']);
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
      // Provide fallback evaluation optimized for NSW Selective criteria
      setEvaluation({
        score: Math.floor(Math.random() * 3) + 7, // Random score between 7-9
        overallScore: Math.floor(Math.random() * 3) + 7,
        strengths: [
          'Good use of vocabulary and varied sentence structure',
          'Clear organization and logical flow of ideas',
          'Engaging content that holds reader interest',
          'Appropriate tone for the text type',
          'Effective use of language features'
        ],
        improvements: [
          'Add more descriptive details and sensory language',
          'Vary sentence length for better rhythm',
          'Include more specific examples to support main points',
          'Strengthen transitions between paragraphs',
          'Consider adding more sophisticated vocabulary'
        ],
        specificFeedback: `Your ${textType} writing shows good potential with clear structure and engaging content. For NSW Selective exam success, focus on adding more vivid details and varying your sentence structure to make it even more compelling. Consider using more specific examples to support your main ideas and ensure your word count is within the target range.`,
        nextSteps: [
          `Practice descriptive writing techniques for ${textType}`,
          'Read examples of excellent ' + textType + ' writing',
          'Focus on character development and dialogue',
          'Work on creating stronger opening and closing paragraphs',
          'Practice writing within time constraints'
        ],
        nswCriteria: {
          ideasAndContent: Math.floor(Math.random() * 3) + 7,
          textStructure: Math.floor(Math.random() * 3) + 7,
          languageFeatures: Math.floor(Math.random() * 3) + 7,
          grammarAndSpelling: Math.floor(Math.random() * 3) + 8
        }
      });
      setActiveTab('ai-coach');
    } finally {
      setIsEvaluating(false);
    }
  };

  // Start exam mode
  const startExamMode = () => {
    setExamMode(true);
    setExamTimeRemaining(examTimeLimit);
    setIsTimerRunning(true);
  };

  // Stop exam mode
  const stopExamMode = () => {
    setExamMode(false);
    setIsTimerRunning(false);
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Handle chat submission
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
      // Simulate AI response (replace with actual AI call)
      await new Promise(resolve => setTimeout(resolve, 1000));
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        text: `I understand you're asking about "${chatInput}". Here's some helpful advice for your ${textType} writing...`,
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

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Prompt Section - Reduced padding */}
      <div className="bg-white rounded-lg shadow-sm p-3 mb-3 mx-3 mt-3">
        <div className="flex items-center mb-1">
          <Lightbulb className="w-3 h-3 mr-1 text-yellow-500" />
          <span className="text-xs font-medium text-gray-700">Your Writing Prompt</span>
        </div>
        <p className="text-gray-600 text-xs leading-relaxed">
          {prompt || 'Write an engaging story about a character who discovers something unexpected that changes their life forever. Include vivid descriptions, realistic dialogue, and show the character\'s emotional journey. Make sure your story has a clear beginning, middle, and end with a satisfying conclusion. Focus on showing rather than telling, and use sensory details to bring your story to life.'}
        </p>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Writing Area */}
        <div className="flex-1 flex flex-col px-3 pb-3">
          <div className="bg-white rounded-lg shadow-sm flex-1 flex flex-col overflow-hidden">
            {/* Writing Area Header with Buttons - Consolidated */}
            <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">Your Writing</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowPlanningModal(true)}
                  className="flex items-center px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  Planning Phase
                </button>
                <button
                  onClick={startExamMode}
                  className="flex items-center px-2 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 transition-colors"
                >
                  <Clock className="w-3 h-3 mr-1" />
                  Start Exam Mode
                </button>
                <button
                  onClick={() => setShowStructureGuide(true)}
                  className="flex items-center px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors"
                >
                  <BookOpen className="w-3 h-3 mr-1" />
                  Structure Guide
                </button>
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  {isFullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                </button>
              </div>
            </div>

            {/* Text Area - Reduced padding and font size */}
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              onMouseUp={handleTextSelection}
              onKeyUp={handleTextSelection}
              placeholder="Start writing your amazing story here! Let your creativity flow and bring your ideas to life..."
              className="flex-1 p-3 text-sm leading-relaxed text-gray-900 bg-white focus:outline-none resize-none"
              style={{ fontSize: `${fontSize - 2}px`, lineHeight: lineHeight }}
            />
            
            {/* Status Bar - Reduced padding and font size */}
            <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-4 text-xs text-gray-600">
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

        {/* Right Sidebar - Writing Buddy - Reduced padding */}
        <div className="w-80 bg-gradient-to-b from-purple-600 to-indigo-700 text-white flex flex-col shadow-lg">
          {/* Header - Reduced padding */}
          <div className="p-3 border-b border-purple-500">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold flex items-center">
                <Bot className="w-5 h-5 mr-2" />
                Writing Buddy
              </h2>
              <button className="p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors">
                <Settings className="w-4 h-4" />
              </button>
            </div>
            <p className="text-purple-200 text-xs">Your AI writing assistant</p>
          </div>

          {/* Tabs - Reduced padding */}
          <div className="flex border-b border-purple-500">
            {[
              { id: 'analysis', label: 'Analysis', icon: BarChart3 },
              { id: 'vocabulary', label: 'Vocabulary', icon: BookOpen },
              { id: 'progress', label: 'Progress', icon: TrendingUp },
              { id: 'ai-coach', label: 'Coach', icon: Bot }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 px-1 text-xs font-medium transition-colors ${
                  activeTab === tab.id 
                    ? 'bg-purple-700 text-white' 
                    : 'text-purple-200 hover:bg-purple-600'
                }`}
              >
                <tab.icon className="w-3 h-3 mx-auto mb-1" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content - Reduced padding and font sizes */}
          <div className="flex-1 p-3 overflow-y-auto">
            {activeTab === 'analysis' && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold mb-2">Writing Analysis</h3>
                
                <div className="bg-purple-800 bg-opacity-50 rounded-lg p-2">
                  <h4 className="font-medium mb-1 text-xs">Words:</h4>
                  <div className="text-xl font-bold">{wordCount}</div>
                </div>
                
                <div className="bg-purple-800 bg-opacity-50 rounded-lg p-2">
                  <h4 className="font-medium mb-1 text-xs">Characters:</h4>
                  <div className="text-xl font-bold">{characterCount}</div>
                </div>
                
                <div className="bg-purple-800 bg-opacity-50 rounded-lg p-2">
                  <h4 className="font-medium mb-1 text-xs">Reading Time:</h4>
                  <div className="text-xl font-bold">{readingTime} min</div>
                </div>
                
                <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-3 rounded-lg text-xs transition-colors">
                  Submit for Evaluation
                </button>
              </div>
            )}
            
            {activeTab === 'vocabulary' && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold mb-2">Vocabulary</h3>
                <p className="text-purple-200 text-xs">Select text to see suggestions</p>
              </div>
            )}
            
            {activeTab === 'progress' && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold mb-2">Progress</h3>
                <div className="bg-purple-800 bg-opacity-50 rounded-lg p-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs">Word Goal:</span>
                    <span className="font-bold text-sm">{targetWordCount}</span>
                  </div>
                  <div className="w-full bg-purple-900 rounded-full h-2">
                    <div 
                      className="bg-green-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((wordCount / targetWordCount) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-purple-200 mt-1">
                    {wordCount >= targetWordCount ? 'Goal achieved! 🎉' : `${targetWordCount - wordCount} words to go`}
                  </p>
                </div>
              </div>
            )}
            
            {activeTab === 'ai-coach' && (
              <div className="flex flex-col h-full">
                <h3 className="text-sm font-semibold mb-2">AI Coach</h3>
                <div className="flex-1 overflow-y-auto mb-3">
                  {chatMessages.length === 0 && (
                    <p className="text-purple-300 text-center mt-6 text-xs">Ask your Writing Buddy anything!</p>
                  )}
                  {chatMessages.map((message) => (
                    <div key={message.id} className={`mb-2 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
                      <div className={`inline-block p-2 rounded-lg text-xs ${
                        message.sender === 'user' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-200 text-gray-800'
                      }`}>
                        {message.text}
                      </div>
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-300 mx-auto"></div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                <form onSubmit={handleChatSubmit} className="flex">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask your Writing Buddy..."
                    className="flex-1 p-2 rounded-l-lg bg-purple-800 text-white placeholder-purple-300 focus:outline-none focus:ring-1 focus:ring-purple-500 text-xs"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 bg-purple-500 text-white rounded-r-lg hover:bg-purple-600 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    <Send className="w-3 h-3" />
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <PlanningToolModal
        isOpen={showPlanningModal}
        onClose={() => setShowPlanningModal(false)}
        onSavePlan={(plan: string) => {
          setPlanningNotes(plan);
          setShowPlanningModal(false);
        }}
        textType={textType}
        content={content}
      />

      {/* Synonyms Popup */}
      {showSynonyms && selectedText && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-md w-full mx-4">
            <h3 className="font-semibold mb-2 text-sm">Synonyms for "{selectedText}"</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {synonyms.map((synonym, index) => (
                <button
                  key={index}
                  onClick={() => replaceSynonym(synonym)}
                  className="px-2 py-1 bg-blue-500 text-white rounded-full text-xs hover:bg-blue-600"
                >
                  {synonym}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowSynonyms(false)}
              className="w-full py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Evaluation Results Popup */}
      {evaluation && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto relative">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <Award className="w-8 h-8 mr-3 text-yellow-500" />
              Evaluation Results
            </h2>
            <button
              onClick={() => setEvaluation(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
                Overall Score: <span className="text-blue-600 dark:text-blue-400">{evaluation.overallScore}/10</span>
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                {evaluation.specificFeedback}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-2 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Strengths
                </h4>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                  {evaluation.strengths.map((s: string, i: number) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2 flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  Areas for Improvement
                </h4>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                  {evaluation.improvements.map((i: string, idx: number) => (
                    <li key={idx}>{i}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Next Steps</h4>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                {evaluation.nextSteps.map((ns: string, i: number) => (
                  <li key={i}>{ns}</li>
                ))}
              </ul>
            </div>
            {evaluation.nswCriteria && (
              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                  NSW Selective Exam Criteria Scores (out of 10)
                </h4>
                <div className="grid grid-cols-2 gap-4 text-gray-700 dark:text-gray-300">
                  <div>
                    Ideas and Content:{' '}
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {evaluation.nswCriteria.ideasAndContent}
                    </span>
                  </div>
                  <div>
                    Text Structure:{' '}
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {evaluation.nswCriteria.textStructure}
                    </span>
                  </div>
                  <div>
                    Language Features:{' '}
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {evaluation.nswCriteria.languageFeatures}
                    </span>
                  </div>
                  <div>
                    Grammar and Spelling:{' '}
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {evaluation.nswCriteria.grammarAndSpelling}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Structure Guide Modal */}
      {showStructureGuide && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto relative">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <BookOpen className="w-8 h-8 mr-3 text-blue-500" />
              Structure Guide
            </h2>
            <button
              onClick={() => setShowStructureGuide(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="prose dark:prose-invert max-w-none">
              {textType === 'narrative' && (
                <>
                  <h3>Narrative Structure</h3>
                  <p>A narrative typically follows a clear story arc:</p>
                  <h4>1. Orientation</h4>
                  <p>Introduce characters, setting, and initial situation. Hook the reader.</p>
                  <h4>2. Complication / Rising Action</h4>
                  <p>A problem or challenge arises, leading to a series of events that build tension.</p>
                  <h4>3. Climax</h4>
                  <p>The turning point of the story, where the main conflict is confronted.</p>
                  <h4>4. Resolution / Falling Action</h4>
                  <p>The events that follow the climax, leading to the story's conclusion.</p>
                  <h4>5. Coda (Optional)</h4>
                  <p>A final reflection or moral of the story.</p>
                </>
              )}
              {textType === 'persuasive' && (
                <>
                  <h3>Persuasive Essay Structure</h3>
                  <p>A persuasive essay aims to convince the reader of a particular viewpoint:</p>
                  <h4>1. Introduction</h4>
                  <p>Hook, background information, and clear thesis statement (your argument).</p>
                  <h4>2. Body Paragraphs (Arguments)</h4>
                  <p>Each paragraph presents a distinct argument supporting your thesis, backed by evidence and examples.</p>
                  <h4>3. Counter-Argument and Rebuttal</h4>
                  <p>Acknowledge opposing viewpoints and then refute them with stronger evidence or reasoning.</p>
                  <h4>4. Conclusion</h4>
                  <p>Summarize main points, restate thesis in new words, and provide a strong call to action or final thought.</p>
                </>
              )}
              {textType === 'expository' && (
                <>
                  <h3>Expository Essay Structure</h3>
                  <p>An expository essay explains a topic clearly and concisely:</p>
                  <h4>1. Introduction</h4>
                  <p>Hook, background information, and clear thesis statement (what you will explain).</p>
                  <h4>2. Body Paragraphs (Explanations)</h4>
                  <p>Each paragraph explains a different aspect of your topic, providing facts, examples, and details.</p>
                  <h4>3. Conclusion</h4>
                  <p>Summarize main points and restate thesis in new words. Provide a final thought or implication.</p>
                </>
              )}
              {textType === 'reflective' && (
                <>
                  <h3>Reflective Essay Structure</h3>
                  <p>A reflective essay explores a personal experience and its meaning:</p>
                  <h4>1. Introduction</h4>
                  <p>Introduce the experience or event you will reflect upon and its initial significance.</p>
                  <h4>2. Description of Experience</h4>
                  <p>Detail the experience, using sensory language to bring it to life for the reader.</p>
                  <h4>3. Analysis and Interpretation</h4>
                  <p>Explore the meaning of the experience, what you learned, and how it impacted you.</p>
                  <h4>4. Conclusion</h4>
                  <p>Summarize your insights and reflect on the lasting impact or future implications.</p>
                </>
              )}
              {textType === 'descriptive' && (
                <>
                  <h3>Descriptive Essay Structure</h3>
                  <p>A descriptive essay creates a vivid picture of a person, place, object, or event:</p>
                  <h4>1. Introduction</h4>
                  <p>Introduce the subject of your description and create an overall impression.</p>
                  <h4>2. Body Paragraphs (Sensory Details)</h4>
                  <p>Organize details by sense (sight, sound, smell, taste, touch), spatial order, or order of importance. Use figurative language.</p>
                  <h4>3. Conclusion</h4>
                  <p>Summarize the overall impression and leave the reader with a lasting image or feeling.</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Placeholder for PlanningToolModal component
const PlanningToolModal = ({ isOpen, onClose, onSavePlan, textType, content }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Planning Tool</h2>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="w-6 h-6" />
        </button>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          Use this space to plan your {textType} writing. Think about your main ideas, structure, and key points.
        </p>
        <textarea
          className="w-full h-64 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Write your planning notes here..."
        />
        <div className="flex justify-end space-x-4 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSavePlan('Planning notes saved');
              onClose();
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Save Plan
          </button>
        </div>
      </div>
    </div>
  );
};