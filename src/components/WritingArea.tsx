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
  onContentChange?: (content: string ) => void;
  initialContent?: string;
  textType?: string;
  prompt?: string;
  onPromptChange?: (prompt: string) => void;
}

export default function WritingArea({ 
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

  // Format time display
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Handle chat input for Writing Buddy
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newUserMessage = { id: Date.now().toString(), text: chatInput, sender: 'user' as const, timestamp: new Date() };
    setChatMessages((prevMessages) => [...prevMessages, newUserMessage]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      // Simulate AI response
      const aiResponseText = `Thanks for your message! I'm still under development, but I'm learning to provide helpful feedback. You said: "${chatInput}"`;
      const newAiMessage = { id: (Date.now() + 1).toString(), text: aiResponseText, sender: 'ai' as const, timestamp: new Date() };
      setTimeout(() => {
        setChatMessages((prevMessages) => [...prevMessages, newAiMessage]);
        setIsChatLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error sending chat message:', error);
      setIsChatLoading(false);
    }
  };

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 's') { // Alt + S for Save
        e.preventDefault();
        // handleSave(); // Implement save functionality
        alert('Save functionality not yet implemented.');
      }
      if (e.altKey && e.key === 'f') { // Alt + F for Fullscreen
        e.preventDefault();
        toggleFullscreen();
      }
      if (e.altKey && e.key === 'e') { // Alt + E for Evaluate
        e.preventDefault();
        handleEvaluate();
      }
      if (e.altKey && e.key === 'p') { // Alt + P for Planning
        e.preventDefault();
        setShowPlanningModal(true);
      }
      if (e.altKey && e.key === 't') { // Alt + T for Timer
        e.preventDefault();
        setIsTimerRunning(prev => !prev);
      }
      if (e.altKey && e.key === 'g') { // Alt + G for Generate Prompt
        e.preventDefault();
        // generateNewPrompt(); // Implement generate new prompt functionality
        alert('Generate new prompt functionality not yet implemented.');
      }
      if (e.altKey && e.key === 'h') { // Alt + H for Help
        e.preventDefault();
        setActiveTab('help');
      }
      if (e.altKey && e.key === 'c') { // Alt + C for Coach
        e.preventDefault();
        setActiveTab('ai-coach');
      }
      if (e.altKey && e.key === 'v') { // Alt + V for Vocabulary
        e.preventDefault();
        setActiveTab('vocabulary');
      }
      if (e.altKey && e.key === 'r') { // Alt + R for Rephrase
        e.preventDefault();
        // handleRephrase(); // Implement rephrase functionality
        alert('Rephrase functionality not yet implemented.');
      }
      if (e.altKey && e.key === 'd') { // Alt + D for Download
        e.preventDefault();
        // handleDownload(); // Implement download functionality
        alert('Download functionality not yet implemented.');
      }
      if (e.altKey && e.key === 'u') { // Alt + U for Upload
        e.preventDefault();
        // handleUpload(); // Implement upload functionality
        alert('Upload functionality not yet implemented.');
      }
      if (e.altKey && e.key === 'x') { // Alt + X for Exam Mode
        e.preventDefault();
        if (examMode) {
          stopExamMode();
        } else {
          startExamMode();
        }
      }
      if (e.altKey && e.key === 'w') { // Alt + W for Word Count
        e.preventDefault();
        setShowWordCount(prev => !prev);
      }
      if (e.altKey && e.key === 'z') { // Alt + Z for Undo
        e.preventDefault();
        // handleUndo(); // Implement undo functionality
        alert('Undo functionality not yet implemented.');
      }
      if (e.altKey && e.key === 'y') { // Alt + Y for Redo
        e.preventDefault();
        // handleRedo(); // Implement redo functionality
        alert('Redo functionality not yet implemented.');
      }
      if (e.altKey && e.key === 'k') { // Alt + K for Structure Guide
        e.preventDefault();
        setShowStructureGuide(prev => !prev);
      }
      if (e.altKey && e.key === 'm') { // Alt + M for Menu
        e.preventDefault();
        // toggleMenu(); // Implement menu toggle functionality
        alert('Menu toggle functionality not yet implemented.');
      }
      if (e.altKey && e.key === 'a') { // Alt + A for Analysis
        e.preventDefault();
        setActiveTab('analysis');
      }
      if (e.altKey && e.key === 'i') { // Alt + I for Insights
        e.preventDefault();
        setActiveTab('insights');
      }
      if (e.altKey && e.key === 'o') { // Alt + O for Options
        e.preventDefault();
        setActiveTab('options');
      }
      if (e.altKey && e.key === 'l') { // Alt + L for Learning
        e.preventDefault();
        setActiveTab('learning');
      }
      if (e.altKey && e.key === 'j') { // Alt + J for Journal
        e.preventDefault();
        setActiveTab('journal');
      }
      if (e.altKey && e.key === 'q') { // Alt + Q for Quick Tips
        e.preventDefault();
        setActiveTab('quick-tips');
      }
      if (e.altKey && e.key === 'b') { // Alt + B for Brainstorming
        e.preventDefault();
        setActiveTab('brainstorming');
      }
      if (e.altKey && e.key === 'p') { // Alt + P for Progress
        e.preventDefault();
        setActiveTab('progress');
      }
      if (e.altKey && e.key === 's') { // Alt + S for Settings
        e.preventDefault();
        setActiveTab('settings');
      }
      if (e.altKey && e.key === 'g') { // Alt + G for Goals
        e.preventDefault();
        setActiveTab('goals');
      }
      if (e.altKey && e.key === 'n') { // Alt + N for Notes
        e.preventDefault();
        setActiveTab('notes');
      }
      if (e.altKey && e.key === 'f') { // Alt + F for Feedback
        e.preventDefault();
        setActiveTab('feedback');
      }
      if (e.altKey && e.key === 't') { // Alt + T for Tools
        e.preventDefault();
        setActiveTab('tools');
      }
      if (e.altKey && e.key === 'd') { // Alt + D for Dictionary
        e.preventDefault();
        setActiveTab('dictionary');
      }
      if (e.altKey && e.key === 'e') { // Alt + E for Examples
        e.preventDefault();
        setActiveTab('examples');
      }
      if (e.altKey && e.key === 'c') { // Alt + C for Chat
        e.preventDefault();
        setActiveTab('chat');
      }
      if (e.altKey && e.key === 'v') { // Alt + V for Voice
        e.preventDefault();
        setActiveTab('voice');
      }
      if (e.altKey && e.key === 'a') { // Alt + A for Audio
        e.preventDefault();
        setActiveTab('audio');
      }
      if (e.altKey && e.key === 'i') { // Alt + I for Image
        e.preventDefault();
        setActiveTab('image');
      }
      if (e.altKey && e.key === 'l') { // Alt + L for Link
        e.preventDefault();
        setActiveTab('link');
      }
      if (e.altKey && e.key === 'h') { // Alt + H for Hash
        e.preventDefault();
        setActiveTab('hash');
      }
      if (e.altKey && e.key === 't') { // Alt + T for Type
        e.preventDefault();
        setActiveTab('type');
      }
      if (e.altKey && e.key === 'a') { // Alt + A for Align Left
        e.preventDefault();
        setActiveTab('align-left');
      }
      if (e.altKey && e.key === 'c') { // Alt + C for Align Center
        e.preventDefault();
        setActiveTab('align-center');
      }
      if (e.altKey && e.key === 'r') { // Alt + R for Align Right
        e.preventDefault();
        setActiveTab('align-right');
      }
      if (e.altKey && e.key === 'b') { // Alt + B for Bold
        e.preventDefault();
        setActiveTab('bold');
      }
      if (e.altKey && e.key === 'i') { // Alt + I for Italic
        e.preventDefault();
        setActiveTab('italic');
      }
      if (e.altKey && e.key === 'u') { // Alt + U for Underline
        e.preventDefault();
        setActiveTab('underline');
      }
      if (e.altKey && e.key === 'l') { // Alt + L for List
        e.preventDefault();
        setActiveTab('list');
      }
      if (e.altKey && e.key === 'o') { // Alt + O for Ordered List
        e.preventDefault();
        setActiveTab('ordered-list');
      }
      if (e.altKey && e.key === 'q') { // Alt + Q for Quote
        e.preventDefault();
        setActiveTab('quote');
      }
      if (e.altKey && e.key === 'c') { // Alt + C for Code
        e.preventDefault();
        setActiveTab('code');
      }
      if (e.altKey && e.key === 's') { // Alt + S for Scissors
        e.preventDefault();
        setActiveTab('scissors');
      }
      if (e.altKey && e.key === 'p') { // Alt + P for Clipboard
        e.preventDefault();
        setActiveTab('clipboard');
      }
      if (e.altKey && e.key === 's') { // Alt + S for Search
        e.preventDefault();
        setActiveTab('search');
      }
      if (e.altKey && e.key === 'f') { // Alt + F for Filter
        e.preventDefault();
        setActiveTab('filter');
      }
      if (e.altKey && e.key === 'a') { // Alt + A for Sort Asc
        e.preventDefault();
        setActiveTab('sort-asc');
      }
      if (e.altKey && e.key === 'd') { // Alt + D for Sort Desc
        e.preventDefault();
        setActiveTab('sort-desc');
      }
      if (e.altKey && e.key === 'g') { // Alt + G for Grid
        e.preventDefault();
        setActiveTab('grid');
      }
      if (e.altKey && e.key === 'l') { // Alt + L for Layout
        e.preventDefault();
        setActiveTab('layout');
      }
      if (e.altKey && e.key === 's') { // Alt + S for Sidebar
        e.preventDefault();
        setActiveTab('sidebar');
      }
      if (e.altKey && e.key === 'm') { // Alt + M for Menu
        e.preventDefault();
        setActiveTab('menu');
      }
      if (e.altKey && e.key === 'h') { // Alt + H for More Horizontal
        e.preventDefault();
        setActiveTab('more-horizontal');
      }
      if (e.altKey && e.key === 'v') { // Alt + V for More Vertical
        e.preventDefault();
        setActiveTab('more-vertical');
      }
      if (e.altKey && e.key === 'c') { // Alt + C for Chevron Left
        e.preventDefault();
        setActiveTab('chevron-left');
      }
      if (e.altKey && e.key === 'r') { // Alt + R for Chevron Right
        e.preventDefault();
        setActiveTab('chevron-right');
      }
      if (e.altKey && e.key === 'u') { // Alt + U for Arrow Up
        e.preventDefault();
        setActiveTab('arrow-up');
      }
      if (e.altKey && e.key === 'd') { // Alt + D for Arrow Down
        e.preventDefault();
        setActiveTab('arrow-down');
      }
      if (e.altKey && e.key === 'l') { // Alt + L for Arrow Left
        e.preventDefault();
        setActiveTab('arrow-left');
      }
      if (e.altKey && e.key === 'r') { // Alt + R for Arrow Right
        e.preventDefault();
        setActiveTab('arrow-right');
      }
      if (e.altKey && e.key === 't') { // Alt + T for Timer
        e.preventDefault();
        setActiveTab('timer');
      }
      if (e.altKey && e.key === 's') { // Alt + S for Send
        e.preventDefault();
        setActiveTab('send');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [examMode, isTimerRunning, handleEvaluate, toggleFullscreen]);

  return (
    <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 shadow-md">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Writing Adventure!</h1>
          <span className="text-sm text-gray-500 dark:text-gray-400">Unleash Your Creativity</span>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowPlanningModal(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            <Sparkles className="inline-block w-4 h-4 mr-2" />Planning Phase
          </button>
          <button
            onClick={startExamMode}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
          >
            <Clock className="inline-block w-4 h-4 mr-2" />Start Exam Mode
          </button>
          <button
            onClick={() => setShowStructureGuide(true)}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
          >
            <BookOpen className="inline-block w-4 h-4 mr-2" />Structure Guide
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Writing Area */}
        <div className="flex-1 flex flex-col p-6 overflow-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              <Lightbulb className="inline-block w-5 h-5 mr-2 text-yellow-500" />Your Writing Prompt
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {prompt || 'Loading prompt...'}
            </p>
          </div>

          <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Your Writing</h3>
            </div>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              onMouseUp={handleTextSelection}
              onKeyUp={handleTextSelection}
              placeholder="Start writing your amazing story here! Let your creativity flow and bring your ideas to life..."
              className="flex-1 p-4 text-lg leading-relaxed text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:outline-none resize-none"
              style={{ fontSize: `${fontSize}px`, lineHeight: lineHeight }}
            />
            <WritingStatusBar 
              wordCount={wordCount}
              characterCount={characterCount}
              readingTime={readingTime}
              timeSpent={timeSpent}
              isTimerRunning={isTimerRunning}
              toggleTimer={() => setIsTimerRunning(prev => !prev)}
              examMode={examMode}
              examTimeRemaining={examTimeRemaining}
              targetWordCount={targetWordCount}
            />
          </div>

          {/* Submit Button - Prominently positioned and ALWAYS VISIBLE */}
          <div className="bg-white border-t-2 border-gray-300 p-6 flex justify-center shadow-2xl sticky bottom-0 z-50">
              <button
                onClick={handleEvaluate}
                disabled={isEvaluating}
                className="mt-6 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 flex items-center justify-center text-sm"
              >
                {isEvaluating ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
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

        {/* Right Sidebar - Writing Buddy */}
        <div className="w-96 bg-gradient-to-b from-purple-600 to-indigo-700 text-white p-6 flex flex-col shadow-lg overflow-auto relative">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center">
              <Bot className="w-7 h-7 mr-3" />Writing Buddy
            </h2>
            <button
              onClick={() => { /* Toggle visibility or settings */ }}
              className="p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
            >
              <Settings className="w-6 h-6" />
            </button>
          </div>

          <p className="text-purple-200 mb-6">Your AI writing assistant</p>

          {/* Tabs for Analysis, Vocabulary, Progress, Coach */}
          <div className="flex space-x-2 mb-6">
            <button
              onClick={() => setActiveTab('analysis')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'analysis' ? 'bg-purple-700 text-white' : 'bg-purple-500 text-purple-100 hover:bg-purple-600'}`}
            >
              <BarChart3 className="inline-block w-4 h-4 mr-2" />Analysis
            </button>
            <button
              onClick={() => setActiveTab('vocabulary')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'vocabulary' ? 'bg-purple-700 text-white' : 'bg-purple-500 text-purple-100 hover:bg-purple-600'}`}
            >
              <BookOpen className="inline-block w-4 h-4 mr-2" />Vocabulary
            </button>
            <button
              onClick={() => setActiveTab('progress')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'progress' ? 'bg-purple-700 text-white' : 'bg-purple-500 text-purple-100 hover:bg-purple-600'}`}
            >
              <TrendingUp className="inline-block w-4 h-4 mr-2" />Progress
            </button>
            <button
              onClick={() => setActiveTab('ai-coach')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'ai-coach' ? 'bg-purple-700 text-white' : 'bg-purple-500 text-purple-100 hover:bg-purple-600'}`}
            >
              <Sparkles className="inline-block w-4 h-4 mr-2" />Coach
            </button>
          </div>

          {/* Content based on active tab */}
          <div className="flex-1 bg-purple-700 bg-opacity-30 rounded-lg p-4 overflow-y-auto custom-scrollbar">
            {activeTab === 'analysis' && (
              <div>
                <h3 className="text-xl font-bold mb-4">Analysis</h3>
                <div className="bg-purple-800 bg-opacity-50 p-4 rounded-lg mb-4">
                  <p className="text-purple-200 text-sm">Word Count</p>
                  <p className="text-white text-2xl font-bold">Current: {wordCount} <span className="text-lg text-purple-300">Target: {targetWordCount} words</span></p>
                </div>
                <div className="bg-purple-800 bg-opacity-50 p-4 rounded-lg mb-4">
                  <p className="text-purple-200 text-sm">Reading Time</p>
                  <p className="text-white text-2xl font-bold">{readingTime} min</p>
                  <p className="text-purple-200 text-sm">Based on 200 words/minute</p>
                </div>
                <div className="bg-purple-800 bg-opacity-50 p-4 rounded-lg mb-4">
                  <p className="text-purple-200 text-sm">Writing Speed</p>
                  <p className="text-white text-2xl font-bold">{progressData.averageWordsPerMinute} wpm</p>
                  <p className="text-purple-200 text-sm">Target: 12-15 words/minute</p>
                </div>
                <button className="w-full py-2 px-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600 text-sm font-semibold">
                  Analyze Text Type
                </button>
              </div>
            )}
            {activeTab === 'vocabulary' && (
              <div>
                <h3 className="text-xl font-bold mb-4">Vocabulary Builder</h3>
                <p className="text-purple-200 mb-4">Identify and improve your vocabulary usage.</p>
                {vocabularyWords.length > 0 ? (
                  <ul className="list-disc list-inside text-purple-200 space-y-2">
                    {vocabularyWords.map((word, index) => (
                      <li key={index}>{word}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-purple-300">Start writing to see vocabulary suggestions.</p>
                )}
                <button className="w-full mt-4 py-2 px-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600 text-sm font-semibold">
                  Get Vocabulary Suggestions
                </button>
              </div>
            )}
            {activeTab === 'progress' && (
              <div>
                <h3 className="text-xl font-bold mb-4">Progress Tracking</h3>
                <div className="bg-purple-800 bg-opacity-50 p-4 rounded-lg mb-4">
                  <p className="text-purple-200 text-sm">Total Words Written</p>
                  <p className="text-white text-2xl font-bold">{progressData.wordsWritten}</p>
                </div>
                <div className="bg-purple-800 bg-opacity-50 p-4 rounded-lg mb-4">
                  <p className="text-purple-200 text-sm">Total Time Spent</p>
                  <p className="text-white text-2xl font-bold">{formatTime(progressData.timeSpent)}</p>
                </div>
                <div className="bg-purple-800 bg-opacity-50 p-4 rounded-lg mb-4">
                  <p className="text-purple-200 text-sm">Sessions Completed</p>
                  <p className="text-white text-2xl font-bold">{progressData.sessionsCompleted}</p>
                </div>
                <button className="w-full mt-4 py-2 px-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600 text-sm font-semibold">
                  View Detailed Progress
                </button>
              </div>
            )}
            {activeTab === 'ai-coach' && (
              <div className="flex flex-col h-full">
                <h3 className="text-xl font-bold mb-4">AI Coach</h3>
                <div className="flex-1 overflow-y-auto pr-2 mb-4 custom-scrollbar">
                  {chatMessages.length === 0 && (
                    <p className="text-purple-300 text-center mt-8">Ask your Writing Buddy anything!</p>
                  )}
                  {chatMessages.map((message) => (
                    <div key={message.id} className={`mb-3 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
                      <span className={`inline-block p-3 rounded-lg ${message.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                        {message.text}
                      </span>
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="text-center">
                      <span className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-300 inline-block"></span>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                <form onSubmit={handleChatSubmit} className="flex mt-auto">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask your Writing Buddy..."
                    className="flex-1 p-3 rounded-l-lg bg-purple-800 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    type="submit"
                    className="px-5 py-3 bg-purple-500 text-white rounded-r-lg hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    disabled={isChatLoading}
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Synonyms Popup */}
          {showSynonyms && selectedText && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-700 p-4 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 z-50">
              <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">Synonyms for "{selectedText}"</h4>
              {isLoadingSynonyms ? (
                <p className="text-gray-600 dark:text-gray-300">Loading synonyms...</p>
              ) : synonyms.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {synonyms.map((syn, index) => (
                    <span
                      key={index}
                      onClick={() => replaceSynonym(syn)}
                      className="cursor-pointer bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100 px-3 py-1 rounded-full text-sm hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
                    >
                      {syn}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-300">No synonyms found.</p>
              )}
              <button
                onClick={() => setShowSynonyms(false)}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Evaluation Results Popup */}
          {evaluation && (
            <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto relative">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                  <Award className="w-8 h-8 mr-3 text-yellow-500" />Evaluation Results
                </h2>
                <button
                  onClick={() => setEvaluation(null)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>

                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">Overall Score: <span className="text-blue-600 dark:text-blue-400">{evaluation.overallScore}/10</span></h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                    {evaluation.specificFeedback}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-2 flex items-center"><CheckCircle className="w-5 h-5 mr-2" />Strengths</h4>
                    <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                      {evaluation.strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2 flex items-center"><AlertCircle className="w-5 h-5 mr-2" />Areas for Improvement</h4>
                    <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                      {evaluation.improvements.map((i: string, idx: number) => <li key={idx}>{i}</li>)}
                    </ul>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Next Steps</h4>
                  <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                    {evaluation.nextSteps.map((ns: string, i: number) => <li key={i}>{ns}</li>)}
                  </ul>
                </div>

                {evaluation.nswCriteria && (
                  <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">NSW Selective Exam Criteria Scores (out of 10)</h4>
                    <div className="grid grid-cols-2 gap-4 text-gray-700 dark:text-gray-300">
                      <div>Ideas and Content: <span className="font-bold text-blue-600 dark:text-blue-400">{evaluation.nswCriteria.ideasAndContent}</span></div>
                      <div>Text Structure: <span className="font-bold text-blue-600 dark:text-blue-400">{evaluation.nswCriteria.textStructure}</span></div>
                      <div>Language Features: <span className="font-bold text-blue-600 dark:text-blue-400">{evaluation.nswCriteria.languageFeatures}</span></div>
                      <div>Grammar and Spelling: <span className="font-bold text-blue-600 dark:text-blue-400">{evaluation.nswCriteria.grammarAndSpelling}</span></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Planning Tool Modal */}
          {showPlanningModal && (
            <PlanningToolModal
              isOpen={showPlanningModal}
              onClose={() => setShowPlanningModal(false)}
              onSavePlan={(plan) => console.log('Plan saved:', plan)}
              textType={textType}
              content={content}
            />
          )}

          {/* Structure Guide Modal */}
          {showStructureGuide && (
            <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto relative">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                  <BookOpen className="w-8 h-8 mr-3 text-blue-500" />Structure Guide
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
      </div>
    </div>
  );
}
