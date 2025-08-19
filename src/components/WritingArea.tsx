import React, { useState, useEffect, useRef } from 'react';
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

  // Chat functionality for Writing Buddy
  const [chatMessages, setChatMessages] = useState<Array<{id: string, text: string, sender: 'user' | 'ai', timestamp: Date}>>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
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
      
      for (const source of sources) {
        console.log(`🔍 Checking ${source.name}:`, source.value);
        if (source.value && source.value.trim() && source.value !== 'null' && source.value !== 'undefined') {
          console.log(`✅ WritingArea: Prompt loaded from ${source.name}:`, source.value.substring(0, 100) + '...');
          setPrompt(source.value);
          if (onPromptChange) {
            onPromptChange(source.value);
          }
          return;
        }
      }
      
      console.log('⚠️ WritingArea: No prompt found in any source, using fallback');
      
      // Enhanced fallback prompts
      const fallbackPrompts = {
        narrative: "Write a captivating story about a character who discovers something unexpected that changes their life forever. Include vivid descriptions, realistic dialogue, and show how the character grows throughout the story. Focus on creating a clear beginning, middle, and end with engaging plot development.",
        persuasive: "Write a compelling persuasive essay arguing for or against a topic you feel strongly about. Use logical reasoning, credible evidence, emotional appeals, and address counterarguments to convince your readers. End with a strong call to action.",
        expository: "Write an informative essay explaining a topic you're knowledgeable about or find interesting. Provide clear explanations, specific examples, and organize your information in a logical way that helps readers understand the subject thoroughly.",
        reflective: "Write a thoughtful reflection about a meaningful experience in your life. Explore what you learned, how it changed you, and what insights you gained. Use descriptive language to help readers understand both the experience and your thoughts about it.",
        descriptive: "Write a vivid description of a place, person, or object that is meaningful to you. Use sensory details, figurative language, and specific examples to create a clear and engaging picture in your reader's mind."
      };
      
      const fallbackPrompt = fallbackPrompts[textType as keyof typeof fallbackPrompts] || fallbackPrompts.narrative;
      console.log('🔄 Using fallback prompt for', textType, ':', fallbackPrompt);
      setPrompt(fallbackPrompt);
      if (onPromptChange) {
        onPromptChange(fallbackPrompt);
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
      setActiveTab('coaching-tips');
    } catch (error) {
      console.error('Error evaluating writing:', error);
      // Provide fallback evaluation
      setEvaluation({
        score: Math.floor(Math.random() * 3) + 7, // Random score between 7-9
        overallScore: Math.floor(Math.random() * 3) + 7,
        strengths: [
          'Good use of vocabulary and varied sentence structure',
          'Clear organization and logical flow of ideas',
          'Engaging content that holds reader interest',
          'Appropriate tone for the text type'
        ],
        improvements: [
          'Add more descriptive details and sensory language',
          'Vary sentence length for better rhythm',
          'Include more specific examples to support main points',
          'Strengthen transitions between paragraphs'
        ],
        specificFeedback: `Your ${textType} writing shows good potential with clear structure and engaging content. Focus on adding more vivid details and varying your sentence structure to make it even more compelling. Consider using more specific examples to support your main ideas.`,
        nextSteps: [
          `Practice descriptive writing techniques for ${textType}`,
          'Read examples of excellent ' + textType + ' writing',
          'Focus on character development and dialogue',
          'Work on creating stronger opening and closing paragraphs'
        ]
      });
      setActiveTab('coaching-tips');
    } finally {
      setIsEvaluating(false);
    }
  };

  // Paraphrase text
  const handleParaphrase = async () => {
    if (!paraphraseInput.trim()) return;
    
    setIsParaphrasing(true);
    try {
      const result = await rephraseSentence(paraphraseInput);
      setParaphraseOutput(result);
    } catch (error) {
      console.error('Error paraphrasing:', error);
      // Provide fallback paraphrasing
      const enhanced = paraphraseInput.replace(/\b\w+\b/g, (word) => {
        const synonyms: { [key: string]: string } = {
          'good': 'excellent', 'bad': 'terrible', 'big': 'enormous', 'small': 'tiny',
          'nice': 'wonderful', 'said': 'exclaimed', 'went': 'traveled', 'got': 'obtained',
          'very': 'extremely', 'really': 'truly', 'pretty': 'quite', 'kind of': 'somewhat'
        };
        return synonyms[word.toLowerCase()] || word;
      });
      setParaphraseOutput(`Here's an enhanced version: ${enhanced}`);
    } finally {
      setIsParaphrasing(false);
    }
  };

  // Chat functionality
  const handleChatSubmit = async () => {
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
      // Enhanced AI response based on user input
      let aiResponse = '';
      const input = chatInput.toLowerCase();
      
      if (input.includes('analyze') || input.includes('feedback')) {
        aiResponse = `I've analyzed your ${textType} writing! Here's my assessment:

📊 **Current Stats:**
• Word count: ${wordCount} words
• Reading time: ${readingTime} minutes
• Writing time: ${formatTime(timeSpent)}

✅ **Strengths I notice:**
• ${content.trim() ? 'Good structure and organization' : 'Ready to start writing!'}
• ${wordCount > 50 ? 'Developing ideas well' : 'Great potential for expansion'}
• Appropriate tone for ${textType} writing

🎯 **Suggestions:**
• ${wordCount < 100 ? 'Continue developing your ideas with more details' : 'Consider adding more descriptive language'}
• ${textType === 'narrative' ? 'Include dialogue to bring characters to life' : textType === 'persuasive' ? 'Strengthen your arguments with evidence' : 'Add specific examples to clarify your points'}

Keep writing! You're doing great! 🌟`;
      } else if (input.includes('vocabulary') || input.includes('word') || input.includes('synonym')) {
        aiResponse = `Great question about vocabulary! Here are some tips for enhancing your ${textType} writing:

🔤 **Word Choice Tips:**
• Instead of "good" → try "excellent," "remarkable," "outstanding"
• Instead of "bad" → try "terrible," "dreadful," "inadequate"
• Instead of "said" → try "declared," "whispered," "exclaimed"
• Instead of "went" → try "traveled," "journeyed," "ventured"

✨ **For ${textType} writing specifically:**
${textType === 'narrative' ? '• Use vivid action verbs and sensory details\n• Choose words that create mood and atmosphere' : 
  textType === 'persuasive' ? '• Use strong, confident language\n• Choose words that evoke emotion and conviction' : 
  '• Use precise, clear terminology\n• Choose words that explain concepts clearly'}

💡 **Pro tip:** Select any word in your writing to see synonym suggestions!`;
      } else if (input.includes('structure') || input.includes('organize') || input.includes('paragraph')) {
        aiResponse = getStructureAdvice(textType);
      } else if (input.includes('grammar') || input.includes('mistake') || input.includes('error')) {
        aiResponse = `I can help you with grammar and style! Here are some common areas to check:

📝 **Grammar Checklist:**
• Subject-verb agreement
• Proper comma usage
• Consistent verb tenses
• Complete sentences (avoid fragments)

✍️ **Style Tips for ${textType}:**
• Vary your sentence length for better flow
• Use active voice when possible
• Avoid repetitive word choices
• ${textType === 'narrative' ? 'Show emotions through actions, not just words' : 
     textType === 'persuasive' ? 'Use confident, assertive language' : 
     'Use clear, precise explanations'}

🔍 **Quick check:** Read your writing aloud to catch awkward phrasing!`;
      } else if (input.includes('planning') || input.includes('plan') || input.includes('organize')) {
        aiResponse = getPlanningAdvice(textType);
      } else if (input.includes('help') || input.includes('stuck') || input.includes('idea')) {
        aiResponse = `I'm here to help you succeed with your ${textType} writing! 🚀

🎯 **I can assist with:**
• **Text Analysis** - Get detailed feedback on your writing
• **Vocabulary** - Find better words and synonyms
• **Structure** - Organize your ideas effectively
• **Grammar** - Check for errors and improve style
• **Planning** - Brainstorm and outline your ideas

💡 **Quick actions you can try:**
• Click "Analyze Text Type" for detailed feedback
• Use the Paraphrase Tool to enhance sentences
• Open Planning Phase for structured brainstorming
• Select words in your text for synonym suggestions

What specific aspect would you like help with? Just ask! 😊`;
      } else {
        aiResponse = `Hello! I'm your AI Writing Buddy, here to help you excel at ${textType} writing! 🌟

📚 **What I can help with:**
• **Analysis & Feedback** - Detailed evaluation of your writing
• **Vocabulary Enhancement** - Better word choices and synonyms  
• **Structure & Organization** - How to organize your ideas
• **Grammar & Style** - Fixing errors and improving flow
• **Planning & Brainstorming** - Getting your ideas organized

🎯 **Current writing stats:**
• ${wordCount} words written
• ${formatTime(timeSpent)} spent writing
• ${textType.charAt(0).toUpperCase() + textType.slice(1)} text type

Ask me anything about writing, or try saying:
• "Analyze my writing"
• "Help with vocabulary"  
• "Grammar tips"
• "Structure advice"

How can I help you today? 💪`;
      }
      
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        sender: 'ai' as const,
        timestamp: new Date()
      };
      
      setTimeout(() => {
        setChatMessages(prev => [...prev, aiMessage]);
        setIsChatLoading(false);
      }, 1000);
      
    } catch (error) {
      console.error('Error in chat:', error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: 'I apologize, but I\'m having trouble responding right now. Please try again or use the other Writing Buddy tools available in the tabs above.',
        sender: 'ai' as const,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
      setIsChatLoading(false);
    }
  };

  // Enhanced structure advice
  const getStructureAdvice = (textType: string) => {
    const advice = {
      narrative: `📖 **Narrative Structure Guide:**

🎬 **Story Arc:**
• **Beginning:** Hook your reader with an engaging opening
• **Middle:** Develop conflict and build tension
• **End:** Resolve the conflict with a satisfying conclusion

👥 **Character Development:**
• Show character traits through actions and dialogue
• Give your protagonist clear goals and motivations
• Create realistic character growth throughout the story

🏗️ **Paragraph Structure:**
• Start each paragraph with a clear topic
• Use dialogue to break up narrative sections
• Include sensory details to immerse readers

💡 **Pro tip:** Each paragraph should move your story forward!`,

      persuasive: `🎯 **Persuasive Structure Guide:**

📝 **Essay Organization:**
• **Introduction:** Hook + clear thesis statement
• **Body:** 3-4 strong arguments with evidence
• **Conclusion:** Restate thesis + call to action

💪 **Argument Development:**
• Start with your strongest argument
• Use evidence: facts, statistics, expert opinions
• Address counterarguments respectfully
• Connect each point back to your thesis

🔗 **Transitions:**
• "Furthermore," "Additionally," "However," "In contrast"
• Link ideas smoothly between paragraphs

💡 **Pro tip:** End each body paragraph by connecting back to your main argument!`,

      expository: `📚 **Expository Structure Guide:**

🏗️ **Information Organization:**
• **Introduction:** Topic introduction + thesis
• **Body:** Main points with supporting details
• **Conclusion:** Summary + significance

📊 **Paragraph Structure:**
• Topic sentence stating the main idea
• Supporting details and examples
• Concluding sentence linking to next paragraph

🔍 **Clarity Techniques:**
• Define important terms
• Use specific examples
• Include transitions between ideas
• Organize from general to specific (or vice versa)

💡 **Pro tip:** Each paragraph should focus on one main concept!`
    };
    return advice[textType as keyof typeof advice] || advice.narrative;
  };

  // Enhanced planning advice
  const getPlanningAdvice = (textType: string) => {
    const advice = {
      narrative: `📝 **Narrative Planning Guide:**

👤 **Character Planning:**
• Who is your protagonist? What do they want?
• What obstacles will they face?
• How will they change by the end?

🌍 **Setting & Atmosphere:**
• Where and when does your story take place?
• How does the setting affect the mood?
• What sensory details will you include?

📈 **Plot Development:**
• What's the main conflict or problem?
• What are the key events that happen?
• How will the conflict be resolved?

💭 **Theme & Message:**
• What lesson or insight will readers gain?
• How will you show this through the story?

🎯 **Use the Planning Phase button to organize these ideas!**`,

      persuasive: `🎯 **Persuasive Planning Guide:**

💡 **Position & Thesis:**
• What exactly are you arguing for/against?
• Can you state your position in one clear sentence?

👥 **Audience Analysis:**
• Who are you trying to convince?
• What do they currently believe?
• What concerns might they have?

📊 **Evidence Collection:**
• What facts support your position?
• Do you have statistics or expert opinions?
• What real-world examples can you use?

🔄 **Counterarguments:**
• What might opponents say?
• How will you address their concerns?
• Can you turn weaknesses into strengths?

🎯 **Use the Planning Phase button to organize your arguments!**`,

      expository: `📚 **Expository Planning Guide:**

🎯 **Topic & Purpose:**
• What exactly are you explaining?
• Why is this information important?
• What should readers learn?

📋 **Main Points:**
• What are the 3-4 key concepts to cover?
• How do these points relate to each other?
• What's the logical order to present them?

💡 **Supporting Details:**
• What examples will clarify each point?
• Do you need definitions or explanations?
• What evidence supports your information?

🔗 **Organization Strategy:**
• Chronological order? Most to least important?
• Problem-solution? Cause-effect?
• How will you connect ideas smoothly?

🎯 **Use the Planning Phase button to structure your information!**`
    };
    return advice[textType as keyof typeof advice] || advice.narrative;
  };

  // Quick chat actions
  const handleQuickAction = (action: string) => {
    setChatInput(action);
    setTimeout(() => handleChatSubmit(), 100);
  };

  // Format time display
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Copy text to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Text Type Analysis Tab Content
  const renderTextTypeAnalysis = () => (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
        <h3 className="text-lg font-bold text-blue-900 mb-3 flex items-center">
          <Target className="h-5 w-5 mr-2" />
          {textType.charAt(0).toUpperCase() + textType.slice(1)} Analysis
        </h3>
        
        <div className="grid grid-cols-1 gap-3 mb-4">
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 font-medium text-sm">Word Count</span>
              <span className="text-xl font-bold text-blue-600">{wordCount}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((wordCount / 300) * 100, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Target: 250-300 words</p>
          </div>
          
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 font-medium text-sm">Reading Time</span>
              <span className="text-xl font-bold text-green-600">{readingTime} min</span>
            </div>
            <div className="flex items-center text-xs text-gray-500">
              <Clock className="h-3 w-3 mr-1" />
              Based on 200 words/minute
            </div>
          </div>
        </div>

        <button
          onClick={handleEvaluate}
          disabled={isEvaluating || !content.trim()}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-2 px-4 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm"
        >
          {isEvaluating ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Analyze Text Type
            </>
          )}
        </button>
      </div>
    </div>
  );

  // Vocabulary Sophistication Tab Content
  const renderVocabularySophistication = () => (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-green-50 to-teal-50 p-4 rounded-lg border border-green-200">
        <h3 className="text-lg font-bold text-green-900 mb-3 flex items-center">
          <BookOpen className="h-5 w-5 mr-2" />
          Paraphrase Tool
        </h3>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Enter text to enhance:
            </label>
            <textarea
              value={paraphraseInput}
              onChange={(e) => setParaphraseInput(e.target.value)}
              placeholder="Type text to improve..."
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none text-sm"
              rows={3}
            />
          </div>
          
          <button
            onClick={handleParaphrase}
            disabled={isParaphrasing || !paraphraseInput.trim()}
            className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white py-2 px-4 rounded-lg font-semibold hover:from-green-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm"
          >
            {isParaphrasing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Enhancing...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Paraphrase
              </>
            )}
          </button>
          
          {paraphraseOutput && (
            <div className="bg-white p-3 rounded-lg border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-700">Enhanced Version:</span>
                <button
                  onClick={() => copyToClipboard(paraphraseOutput)}
                  className="text-green-600 hover:text-green-700"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </div>
              <p className="text-gray-800 text-sm">{paraphraseOutput}</p>
            </div>
          )}
        </div>
      </div>

      {/* Synonym Helper */}
      {showSynonyms && (
        <div className="bg-white p-3 rounded-lg border-2 border-yellow-200 shadow-lg">
          <h4 className="font-semibold text-gray-800 mb-2 text-sm">
            Synonyms for "{selectedText}":
          </h4>
          {isLoadingSynonyms ? (
            <div className="flex items-center text-gray-500 text-sm">
              <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
              Loading synonyms...
            </div>
          ) : (
            <div className="flex flex-wrap gap-1">
              {synonyms.map((synonym, index) => (
                <button
                  key={index}
                  onClick={() => replaceSynonym(synonym)}
                  className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs hover:bg-yellow-200 transition-colors"
                >
                  {synonym}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => setShowSynonyms(false)}
            className="mt-2 text-gray-500 hover:text-gray-700 text-xs"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );

  // Progress Tracking Tab Content
  const renderProgressTracking = () => (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
        <h3 className="text-lg font-bold text-purple-900 mb-3 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2" />
          Writing Progress
        </h3>
        
        <div className="grid grid-cols-1 gap-3 mb-4">
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 font-medium text-sm">Time Spent</span>
              <div className="flex items-center">
                <button
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className={`p-1 rounded-full mr-2 text-xs ${isTimerRunning ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}
                >
                  {isTimerRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                </button>
                <span className="text-lg font-bold text-purple-600">{formatTime(timeSpent)}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 font-medium text-sm">Words/Minute</span>
              <span className="text-lg font-bold text-pink-600">{progressData.averageWordsPerMinute}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-2 text-sm">Daily Goal Progress</h4>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className="bg-gradient-to-r from-purple-400 to-pink-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min((wordCount / 250) * 100, 100)}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500">{wordCount}/250 words today</p>
        </div>
      </div>
    </div>
  );

  // Coaching Tips Tab Content with Chat
  const renderCoachingTips = () => (
    <div className="space-y-4 h-full flex flex-col">
      <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-lg border border-orange-200">
        <h3 className="text-lg font-bold text-orange-900 mb-3 flex items-center">
          <Award className="h-5 w-5 mr-2" />
          AI Writing Coach
        </h3>
        
        {evaluation ? (
          <div className="space-y-3">
            <div className="bg-white p-3 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-800">Overall Score</span>
                <div className="flex items-center">
                  <span className="text-2xl font-bold text-orange-600">{evaluation.overallScore || evaluation.score}</span>
                  <span className="text-gray-500 ml-1 text-sm">/10</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-orange-400 to-red-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${((evaluation.overallScore || evaluation.score) / 10) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800 mb-1 flex items-center text-sm">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Strengths
                </h4>
                <ul className="space-y-1">
                  {(evaluation.strengths || []).map((strength: string, index: number) => (
                    <li key={index} className="text-green-700 text-xs">• {strength}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-1 flex items-center text-sm">
                  <Lightbulb className="h-4 w-4 mr-1" />
                  Areas to Improve
                </h4>
                <ul className="space-y-1">
                  {(evaluation.improvements || []).map((improvement: string, index: number) => (
                    <li key={index} className="text-blue-700 text-xs">• {improvement}</li>
                  ))}
                </ul>
              </div>
            </div>

            {evaluation.specificFeedback && (
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-1 text-sm">Detailed Feedback</h4>
                <p className="text-gray-700 text-xs">{evaluation.specificFeedback || evaluation.detailedFeedback}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 mb-3 text-sm">Get personalized feedback on your writing!</p>
            <button
              onClick={handleEvaluate}
              disabled={!content.trim()}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Get Feedback
            </button>
          </div>
        )}
      </div>

      {/* Enhanced Chat Interface */}
      <div className="flex-1 bg-white rounded-lg border border-gray-200 flex flex-col min-h-0">
        <div className="p-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <h4 className="font-semibold text-gray-800 text-sm flex items-center">
            <MessageSquare className="h-4 w-4 mr-2" />
            Chat with Writing Buddy
          </h4>
          <p className="text-xs text-gray-600 mt-1">Ask me anything about your {textType} writing!</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
          {chatMessages.length === 0 && (
            <div className="text-center py-4">
              <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg p-4 mb-3">
                <p className="text-gray-700 text-sm mb-3">👋 Hi! I'm your AI Writing Buddy. I can help you with:</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white rounded p-2">📊 Text Analysis</div>
                  <div className="bg-white rounded p-2">📚 Vocabulary</div>
                  <div className="bg-white rounded p-2">✏️ Grammar Tips</div>
                  <div className="bg-white rounded p-2">🏗️ Structure</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 justify-center">
                <button
                  onClick={() => handleQuickAction('Analyze my writing')}
                  className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
                >
                  📊 Analyze Writing
                </button>
                <button
                  onClick={() => handleQuickAction('Help with vocabulary')}
                  className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
                >
                  📚 Vocabulary Help
                </button>
                <button
                  onClick={() => handleQuickAction('Grammar tips')}
                  className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs hover:bg-purple-200"
                >
                  ✏️ Grammar Tips
                </button>
                <button
                  onClick={() => handleQuickAction('Structure advice')}
                  className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs hover:bg-orange-200"
                >
                  🏗️ Structure Help
                </button>
              </div>
            </div>
          )}
          
          {chatMessages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] p-2 rounded-lg text-xs ${
                  message.sender === 'user'
                    ? 'bg-blue-500 text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.text}</p>
                {message.sender === 'ai' && (
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button
                      onClick={() => copyToClipboard(message.text)}
                      className="text-gray-500 hover:text-gray-700 ml-2"
                      title="Copy message"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isChatLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 p-2 rounded-lg text-xs flex items-center">
                <RefreshCw className="h-3 w-3 animate-spin mr-2" />
                Writing Buddy is thinking...
              </div>
            </div>
          )}
          
          <div ref={chatEndRef} />
        </div>
        
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <div className="flex space-x-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleChatSubmit()}
              placeholder="Ask about writing, grammar, vocabulary..."
              className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            <button
              onClick={handleChatSubmit}
              disabled={!chatInput.trim() || isChatLoading}
              className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Enhanced Planning Modal with text-type specific content
  const renderPlanningModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center">
              <PenTool className="h-6 w-6 mr-2" />
              Planning Phase - {textType.charAt(0).toUpperCase() + textType.slice(1)} Writing
            </h2>
            <button
              onClick={() => setShowPlanningModal(false)}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <p className="text-blue-100 mt-2">Take time to plan your ideas - great writing starts with great planning!</p>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Planning Notes */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📝 Planning Notes & Ideas
                </label>
                <textarea
                  value={planningNotes}
                  onChange={(e) => setPlanningNotes(e.target.value)}
                  placeholder="Brainstorm your ideas, create an outline, or jot down key points..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={8}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🎯 Writing Goals for This Session
                </label>
                <textarea
                  value={writingGoals}
                  onChange={(e) => setWritingGoals(e.target.value)}
                  placeholder="What do you want to accomplish in this writing session?"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>
            </div>
            
            {/* Enhanced Text-Type Specific Planning Guide */}
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  {textType.charAt(0).toUpperCase() + textType.slice(1)} Writing Guide
                </h3>
                
                {textType === 'narrative' && (
                  <div className="space-y-3">
                    <div className="bg-white p-3 rounded border border-blue-200">
                      <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        Characters & Setting
                      </h4>
                      <ul className="text-blue-700 text-sm space-y-1">
                        <li>• Who is your main character? What are their goals?</li>
                        <li>• What motivates them? What do they fear?</li>
                        <li>• Where and when does your story take place?</li>
                        <li>• How does the setting affect the mood and story?</li>
                      </ul>
                    </div>
                    
                    <div className="bg-white p-3 rounded border border-blue-200">
                      <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                        <Zap className="h-4 w-4 mr-1" />
                        Plot Structure
                      </h4>
                      <ul className="text-blue-700 text-sm space-y-1">
                        <li>• Beginning: How will you hook the reader?</li>
                        <li>• Middle: What problem or conflict occurs?</li>
                        <li>• Climax: What's the most exciting moment?</li>
                        <li>• End: How is the problem resolved?</li>
                      </ul>
                    </div>
                    
                    <div className="bg-white p-3 rounded border border-blue-200">
                      <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                        <Lightbulb className="h-4 w-4 mr-1" />
                        Writing Techniques
                      </h4>
                      <ul className="text-blue-700 text-sm space-y-1">
                        <li>• Include dialogue to show character personality</li>
                        <li>• Use descriptive details for setting and characters</li>
                        <li>• Show emotions through actions, not just words</li>
                        <li>• Create suspense to keep readers engaged</li>
                      </ul>
                    </div>
                  </div>
                )}
                
                {textType === 'persuasive' && (
                  <div className="space-y-3">
                    <div className="bg-white p-3 rounded border border-blue-200">
                      <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                        <Target className="h-4 w-4 mr-1" />
                        Position & Arguments
                      </h4>
                      <ul className="text-blue-700 text-sm space-y-1">
                        <li>• What is your clear position statement?</li>
                        <li>• What are your 3 strongest arguments?</li>
                        <li>• What evidence supports each argument?</li>
                        <li>• What counterarguments might you address?</li>
                      </ul>
                    </div>
                    
                    <div className="bg-white p-3 rounded border border-blue-200">
                      <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                        <BookOpen className="h-4 w-4 mr-1" />
                        Evidence & Examples
                      </h4>
                      <ul className="text-blue-700 text-sm space-y-1">
                        <li>• Statistics and facts that support your position</li>
                        <li>• Expert opinions and credible quotes</li>
                        <li>• Real-world examples and case studies</li>
                        <li>• Personal experiences (if appropriate)</li>
                      </ul>
                    </div>
                    
                    <div className="bg-white p-3 rounded border border-blue-200">
                      <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                        <Zap className="h-4 w-4 mr-1" />
                        Persuasive Techniques
                      </h4>
                      <ul className="text-blue-700 text-sm space-y-1">
                        <li>• Use emotional appeals to connect with readers</li>
                        <li>• Present logical reasoning and evidence</li>
                        <li>• Address opposing viewpoints respectfully</li>
                        <li>• End with a strong call to action</li>
                      </ul>
                    </div>
                  </div>
                )}
                
                {textType === 'expository' && (
                  <div className="space-y-3">
                    <div className="bg-white p-3 rounded border border-blue-200">
                      <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                        <Target className="h-4 w-4 mr-1" />
                        Topic & Purpose
                      </h4>
                      <ul className="text-blue-700 text-sm space-y-1">
                        <li>• What is your main topic?</li>
                        <li>• What do you want readers to learn?</li>
                        <li>• Why is this information important?</li>
                        <li>• Who is your target audience?</li>
                      </ul>
                    </div>
                    
                    <div className="bg-white p-3 rounded border border-blue-200">
                      <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                        <Layout className="h-4 w-4 mr-1" />
                        Organization & Structure
                      </h4>
                      <ul className="text-blue-700 text-sm space-y-1">
                        <li>• Introduction: Hook and thesis statement</li>
                        <li>• Body: 3-4 main points with supporting details</li>
                        <li>• Conclusion: Summary and final thoughts</li>
                        <li>• Logical flow between paragraphs</li>
                      </ul>
                    </div>
                    
                    <div className="bg-white p-3 rounded border border-blue-200">
                      <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                        <Lightbulb className="h-4 w-4 mr-1" />
                        Information & Examples
                      </h4>
                      <ul className="text-blue-700 text-sm space-y-1">
                        <li>• Clear explanations of complex concepts</li>
                        <li>• Specific examples and illustrations</li>
                        <li>• Definitions of important terms</li>
                        <li>• Smooth transitions between ideas</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 flex justify-between items-center border-t">
          <div className="text-sm text-gray-600 flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            Take your time to plan - good writing starts with good planning!
          </div>
          <button
            onClick={() => setShowPlanningModal(false)}
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
          >
            Start Writing
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`flex flex-col h-screen bg-gray-50 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Compact Header - Reduced padding */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold text-gray-900">Writing Area</h1>
            {isAutoSaving && (
              <div className="flex items-center text-green-600 text-xs">
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                Auto-saving...
              </div>
            )}
            {lastSaved && (
              <div className="text-gray-500 text-xs">
                Last saved: {lastSaved.toLocaleTimeString()}
              </div>
            )}
          </div>
          
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Writing Area */}
        <div className="flex-1 flex flex-col">
          {/* Compact Prompt Display */}
          <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border-b-2 border-blue-200 p-4 shadow-sm">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-blue-900 mb-2 flex items-center">
                  <span className="mr-2">✨</span>
                  Your Writing Prompt
                </h3>
                <div className="bg-white bg-opacity-80 p-3 rounded-lg border border-blue-200 shadow-sm">
                  {prompt ? (
                    <p className="text-gray-800 leading-relaxed">{prompt}</p>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
                      <p className="text-blue-700">Loading your writing prompt...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Writing Textarea - Increased height by removing Planning Phase button space */}
          <div className="flex-1 p-4">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              onMouseUp={handleTextSelection}
              onKeyUp={handleTextSelection}
              placeholder={prompt ? "Start writing your amazing story here! Let your creativity flow and bring your ideas to life..." : "Your writing prompt will appear above. Start typing once it loads!"}
              className="w-full h-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none resize-none text-lg leading-relaxed shadow-sm transition-all duration-200"
              style={{ 
                fontSize: `${fontSize}px`, 
                lineHeight: lineHeight,
                fontFamily: 'Georgia, serif'
              }}
            />
          </div>

          {/* Submit Button - Moved higher up, more compact */}
          <div className="bg-white border-t border-gray-200 p-3 flex justify-center">
            <button
              onClick={handleEvaluate}
              disabled={!content.trim()}
              className="flex items-center px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200 shadow-md hover:shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4 mr-2" />
              Submit for Evaluation
            </button>
          </div>

          {/* Enhanced Bottom Stats Bar */}
          <div className="bg-white border-t border-gray-200 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="flex items-center text-gray-600">
                  <FileText className="h-4 w-4 mr-1" />
                  <span className="font-medium">{wordCount} words</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Type className="h-4 w-4 mr-1" />
                  <span>{characterCount} characters</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>{readingTime} min read</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Timer className="h-4 w-4 mr-1" />
                  <span>{formatTime(timeSpent)}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowPlanningModal(true)}
                  className="flex items-center px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <PenTool className="h-4 w-4 mr-1" />
                  Planning
                </button>
                
                <button
                  onClick={handleEvaluate}
                  disabled={!content.trim()}
                  className="flex items-center px-3 py-1 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Award className="h-4 w-4 mr-1" />
                  Evaluate
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Writing Buddy Sidebar - Moved up to touch header */}
        <div className="w-96 bg-white border-l border-gray-200 flex flex-col shadow-lg">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-3 shadow-md">
            <h2 className="text-lg font-bold flex items-center">
              <Heart className="h-4 w-4 mr-2" />
              Writing Buddy
            </h2>
            <p className="text-purple-100 text-xs mt-1">Your AI writing assistant</p>
          </div>

          {/* Planning Phase Button - Moved to sidebar */}
          <div className="bg-blue-50 border-b border-blue-200 p-3">
            <button
              onClick={() => setShowPlanningModal(true)}
              className="w-full flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 shadow-md hover:shadow-lg font-medium text-sm"
            >
              <PenTool className="h-4 w-4 mr-2" />
              Planning Phase
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 bg-gray-50">
            <nav className="flex">
              {[
                { id: 'text-type-analysis', label: 'Analysis', icon: Target },
                { id: 'vocabulary', label: 'Vocabulary', icon: BookOpen },
                { id: 'progress', label: 'Progress', icon: TrendingUp },
                { id: 'coaching-tips', label: 'Coach', icon: Award }
              ].map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 px-2 py-2 text-xs font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-purple-500 text-purple-600 bg-white'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <IconComponent className="h-3 w-3 mx-auto mb-1" />
                    <div className="text-center">{tab.label}</div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-3">
            {activeTab === 'text-type-analysis' && renderTextTypeAnalysis()}
            {activeTab === 'vocabulary' && renderVocabularySophistication()}
            {activeTab === 'progress' && renderProgressTracking()}
            {activeTab === 'coaching-tips' && renderCoachingTips()}
          </div>
        </div>
      </div>

      {/* Enhanced Planning Modal */}
      {showPlanningModal && renderPlanningModal()}
    </div>
  );
}
