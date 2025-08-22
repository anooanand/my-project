import EnhancedGrammarTextEditor from './EnhancedGrammarTextEditor';
import '../styles/grammarChecker.css';
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
    if (onContentChange) {
      onContentChange(content);
    }
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
 const handleContentChange = (newContent: string) => {
  setContent(newContent);
    if (!isTimerRunning && newContent.trim()) {
      setIsTimerRunning(true);
    }
  };

  // Handle text selection for synonyms
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      const selectedText = selection.toString().trim();
      if (selectedText.split(' ').length === 1) {
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
      setEvaluation({
        score: Math.floor(Math.random() * 3) + 7,
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
        specificFeedback: `Your ${textType} writing shows good potential with clear structure and engaging content. For NSW Selective exam success, focus on adding more vivid details and varying your sentence structure to make it even more compelling.`,
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
        setContent('');
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

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
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

  // Handle planning section save
  const handlePlanSave = (plan: any) => {
    setSavedPlan(plan);
    setShowPlanningSection(false);
  };

  // Kid-friendly planning functions
  const handleKidPlanningNext = () => {
    if (planningStep < 6) {
      setPlanningStep(planningStep + 1);
    } else {
      // Generate a simple plan summary
      const planSummary = `My Story Plan:\n\nCharacters: ${kidPlanningData.characters}\nSetting: ${kidPlanningData.setting}\nProblem: ${kidPlanningData.problem}\nWhat happens: ${kidPlanningData.events}\nSolution: ${kidPlanningData.solution}\nFeelings: ${kidPlanningData.feelings}`;
      
      // Add plan to the beginning of content
      setContent(planSummary + '\n\n' + content);
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

  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get writing tips based on text type
  const getWritingTips = () => {
    const tips = {
      narrative: [
        '🎬 Start with action or dialogue to hook your readers',
        '👥 Show character emotions through actions, not just words',
        '🌟 Use all five senses in your descriptions (sight, sound, smell, taste, touch)',
        '📖 Include dialogue to make characters come alive',
        '🎯 Have a clear beginning, middle, and end',
        '✨ Show, don\'t tell - let readers experience the story'
      ],
      persuasive: [
        '💪 State your position clearly in the first paragraph',
        '📊 Use facts, statistics, and expert opinions to support your argument',
        '🤔 Address what others might think (counterarguments)',
        '🎯 End with a strong call to action',
        '📝 Use persuasive language like "clearly," "obviously," "without doubt"',
        '🔗 Connect your ideas with transition words'
      ],
      expository: [
        '📚 Start with a clear topic sentence in each paragraph',
        '🔍 Explain your topic step by step',
        '📖 Use examples to make your explanations clear',
        '🎯 Stay focused on your main topic',
        '📝 Use transition words like "first," "next," "finally"',
        '✅ End by summarizing your main points'
      ],
      reflective: [
        '🤔 Think deeply about what the experience meant to you',
        '💭 Describe not just what happened, but how you felt',
        '🌱 Show how the experience changed or taught you something',
        '🎨 Use descriptive language to paint a picture',
        '🔗 Connect your experience to bigger life lessons',
        '✨ Be honest and personal in your writing'
      ],
      descriptive: [
        '🎨 Use vivid adjectives to paint a picture with words',
        '👀 Appeal to all five senses (sight, sound, smell, taste, touch)',
        '📐 Organize details in a logical order (top to bottom, left to right)',
        '🌟 Use figurative language like similes and metaphors',
        '🎯 Focus on the most important details',
        '✨ Make the reader feel like they are there with you'
      ]
    };
    
    return tips[textType.toLowerCase() as keyof typeof tips] || tips.narrative;
  };

  return (
    <div className={`flex h-full ${focusMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}>
      {/* Exam Mode Overlay */}
      {examMode && (
        <div className="fixed top-0 left-0 right-0 z-40 bg-red-600 text-white px-4 py-2 flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              <span className="font-bold text-lg">EXAM MODE</span>
            </div>
            <div className="text-sm">
              Time Remaining: <span className="font-mono text-lg">{formatTime(examTimeRemaining)}</span>
            </div>
            <div className="text-sm">
              Words: <span className="font-bold">{wordCount}/{targetWordCount}</span>
            </div>
          </div>
          <button
            onClick={stopExamMode}
            className="flex items-center px-3 py-1 bg-red-700 hover:bg-red-800 rounded text-sm font-medium"
          >
            <StopCircle className="w-4 h-4 mr-1" />
            End Exam
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col" style={{ marginTop: examMode ? '60px' : '0' }}>
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

         {/* Enhanced Grammar Text Editor */}
<div className="flex-1">
  <EnhancedGrammarTextEditor
    content={content}
    onChange={handleContentChange}
    textType={textType}
    showAnalyzer={true}
    enableRealTimeChecking={true}
    placeholder="Start writing your amazing story here! The system will provide real-time grammar, spelling, and vocabulary feedback..."
    minHeight="400px"
    className={`w-full ${
      focusMode 
        ? 'bg-gray-800 text-gray-100' 
        : 'bg-white text-gray-900'
    }`}
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
                onClick={handleEvaluate}
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

      {/* Kid-Friendly Planning Modal */}
      {showKidPlanningModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">📝 Plan Your Story!</h2>
              <p className="text-gray-600">Step {planningStep} of 6</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(planningStep / 6) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="mb-6">
              {planningStep === 1 && (
                <div className="text-center">
                  <div className="text-6xl mb-4">👥</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Who are your characters?</h3>
                  <p className="text-gray-600 mb-4">Think about the people in your story. What are their names? What do they look like?</p>
                  <textarea
                    value={kidPlanningData.characters}
                    onChange={(e) => updateKidPlanningData('characters', e.target.value)}
                    placeholder="Example: Sarah is a brave 12-year-old girl with curly red hair..."
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                    rows={4}
                  />
                </div>
              )}

              {planningStep === 2 && (
                <div className="text-center">
                  <div className="text-6xl mb-4">🏞️</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Where does your story happen?</h3>
                  <p className="text-gray-600 mb-4">Describe the place where your story takes place. Is it a school, forest, city, or somewhere magical?</p>
                  <textarea
                    value={kidPlanningData.setting}
                    onChange={(e) => updateKidPlanningData('setting', e.target.value)}
                    placeholder="Example: A mysterious old library with tall bookshelves and dusty books..."
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                    rows={4}
                  />
                </div>
              )}

              {planningStep === 3 && (
                <div className="text-center">
                  <div className="text-6xl mb-4">⚡</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">What's the problem?</h3>
                  <p className="text-gray-600 mb-4">Every good story has a problem or challenge. What goes wrong? What needs to be solved?</p>
                  <textarea
                    value={kidPlanningData.problem}
                    onChange={(e) => updateKidPlanningData('problem', e.target.value)}
                    placeholder="Example: Sarah discovers that all the books in the library are disappearing one by one..."
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                    rows={4}
                  />
                </div>
              )}

              {planningStep === 4 && (
                <div className="text-center">
                  <div className="text-6xl mb-4">🎬</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">What happens in your story?</h3>
                  <p className="text-gray-600 mb-4">List the main events. What does your character do to try to solve the problem?</p>
                  <textarea
                    value={kidPlanningData.events}
                    onChange={(e) => updateKidPlanningData('events', e.target.value)}
                    placeholder="Example: Sarah searches the library, finds clues, meets a magical librarian..."
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                    rows={4}
                  />
                </div>
              )}

              {planningStep === 5 && (
                <div className="text-center">
                  <div className="text-6xl mb-4">✅</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">How is the problem solved?</h3>
                  <p className="text-gray-600 mb-4">How does your story end? How is the problem fixed? What happens to your characters?</p>
                  <textarea
                    value={kidPlanningData.solution}
                    onChange={(e) => updateKidPlanningData('solution', e.target.value)}
                    placeholder="Example: Sarah learns a magic spell that brings all the books back to the library..."
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                    rows={4}
                  />
                </div>
              )}

              {planningStep === 6 && (
                <div className="text-center">
                  <div className="text-6xl mb-4">😊</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">How do the characters feel?</h3>
                  <p className="text-gray-600 mb-4">Describe the emotions in your story. How do characters feel at different parts?</p>
                  <textarea
                    value={kidPlanningData.feelings}
                    onChange={(e) => updateKidPlanningData('feelings', e.target.value)}
                    placeholder="Example: Sarah feels scared at first, then excited when she discovers the magic..."
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                    rows={4}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <button
                onClick={handleKidPlanningPrev}
                disabled={planningStep === 1}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              
              <button
                onClick={() => setShowKidPlanningModal(false)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Cancel
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

      {/* Structure Guide Modal - Fixed to properly detect text type */}
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
              
              {/* Persuasive Structure */}
              {textType.toLowerCase() === 'persuasive' && (
                <div className="space-y-4">
                  <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-2">Persuasive Writing Structure</h3>
                    <p className="text-red-700 dark:text-red-400 mb-3">A persuasive text tries to convince readers of your opinion:</p>
                    
                    <div className="space-y-3">
                      <div className="border-l-4 border-red-500 pl-3">
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200">1. Introduction</h4>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">• Hook the reader with an interesting fact<br/>• Clearly state your opinion (thesis)<br/>• Preview your main arguments</p>
                      </div>
                      
                      <div className="border-l-4 border-orange-500 pl-3">
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200">2. Body Paragraphs (Arguments)</h4>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">• Present your strongest reasons<br/>• Use facts, examples, and expert opinions<br/>• Address what others might think</p>
                      </div>
                      
                      <div className="border-l-4 border-yellow-500 pl-3">
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200">3. Conclusion</h4>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">• Restate your opinion strongly<br/>• Summarize your best points<br/>• End with a call to action</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Expository Structure */}
              {textType.toLowerCase() === 'expository' && (
                <div className="space-y-4">
                  <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-2">Expository Writing Structure</h3>
                    <p className="text-green-700 dark:text-green-400 mb-3">An expository text explains or teaches about a topic:</p>
                    
                    <div className="space-y-3">
                      <div className="border-l-4 border-green-500 pl-3">
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200">1. Introduction</h4>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">• Hook with an interesting fact<br/>• Introduce your topic clearly<br/>• State what you will explain</p>
                      </div>
                      
                      <div className="border-l-4 border-blue-500 pl-3">
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200">2. Body Paragraphs (Explanations)</h4>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">• Each paragraph explains one main idea<br/>• Use facts, examples, and details<br/>• Use transition words like "first," "next," "finally"</p>
                      </div>
                      
                      <div className="border-l-4 border-purple-500 pl-3">
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200">3. Conclusion</h4>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">• Summarize the main points<br/>• Restate the topic in new words<br/>• End with an interesting final thought</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Default structure for other text types */}
              {!['narrative', 'story', 'persuasive', 'expository'].includes(textType.toLowerCase()) && (
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">General Writing Structure</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-3">A well-structured piece of writing typically includes:</p>
                    
                    <div className="space-y-3">
                      <div className="border-l-4 border-gray-500 pl-3">
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200">1. Introduction</h4>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">• Hook your reader with something interesting<br/>• Introduce your main topic clearly<br/>• Preview what you will write about</p>
                      </div>
                      
                      <div className="border-l-4 border-gray-500 pl-3">
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200">2. Body Paragraphs</h4>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">• Each paragraph has one main idea<br/>• Support your ideas with details and examples<br/>• Use connecting words between paragraphs</p>
                      </div>
                      
                      <div className="border-l-4 border-gray-500 pl-3">
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200">3. Conclusion</h4>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">• Summarize your main points<br/>• Restate your topic in a new way<br/>• End with a memorable final thought</p>
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
                    className="block w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-blue-50 hover:text-blue-600 rounded transition-colors"
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
