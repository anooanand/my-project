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
  Send,
  Bot,
  User,
  Loader
} from 'lucide-react';
import { generatePrompt, getSynonyms, rephraseSentence, evaluateEssay } from '../lib/openai';

interface WritingAreaProps {
  onContentChange?: (content: string) => void;
  initialContent?: string;
  textType?: string;
  prompt?: string;
  onPromptChange?: (prompt: string) => void;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
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

  // Chat functionality
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: `Hi! I'm your Writing Buddy. I'm here to help you with your ${textType} writing. You can ask me about:

• Text analysis and feedback
• Vocabulary suggestions
• Grammar and style tips
• Writing structure advice
• Planning and organization

What would you like help with today?`,
      timestamp: new Date()
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [showChatBuddy, setShowChatBuddy] = useState(true);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load prompt from multiple sources on component mount
  useEffect(() => {
    const loadPrompt = () => {
      console.log('🔍 WritingArea: Loading prompt...');
      
      // Priority order for prompt sources
      const sources = [
        propPrompt,
        localStorage.getItem('generatedPrompt'),
        localStorage.getItem(`${textType}_prompt`),
        localStorage.getItem('customPrompt'),
        localStorage.getItem('selectedPrompt')
      ];
      
      for (const source of sources) {
        if (source && source.trim()) {
          console.log('✅ WritingArea: Prompt loaded from source:', source.substring(0, 50) + '...');
          setPrompt(source);
          if (onPromptChange) {
            onPromptChange(source);
          }
          return;
        }
      }
      
      console.log('⚠️ WritingArea: No prompt found in any source');
    };

    loadPrompt();
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
      setSynonyms([]);
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
      setParaphraseOutput('Sorry, there was an error paraphrasing your text. Please try again.');
    } finally {
      setIsParaphrasing(false);
    }
  };

  // Handle chat message send
  const handleSendChatMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: chatInput,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      // Simulate AI response based on user input
      let response = '';
      const input = chatInput.toLowerCase();

      if (input.includes('analyze') || input.includes('feedback')) {
        if (content.trim()) {
          const result = await evaluateEssay(content, textType);
          response = `I've analyzed your ${textType} writing! Here's my feedback:

**Overall Score:** ${result.overallScore || result.score}/10

**Strengths:**
${(result.strengths || []).map((s: string) => `• ${s}`).join('\n')}

**Areas to improve:**
${(result.improvements || []).map((i: string) => `• ${i}`).join('\n')}

${result.specificFeedback || result.detailedFeedback || ''}`;
        } else {
          response = "I'd love to analyze your writing! Please write some content first, then ask me to analyze it.";
        }
      } else if (input.includes('vocabulary') || input.includes('synonym')) {
        response = `Here are some vocabulary tips for ${textType} writing:

**For Narrative Writing:**
• Use vivid verbs: whispered, thundered, glided
• Descriptive adjectives: mysterious, gleaming, ancient
• Sensory words: fragrant, rough, melodic

**For Persuasive Writing:**
• Strong verbs: demonstrate, establish, convince
• Transition words: furthermore, consequently, undoubtedly
• Persuasive phrases: compelling evidence, clearly shows

Try selecting a word in your text to get specific synonyms!`;
      } else if (input.includes('structure') || input.includes('organize')) {
        response = getStructureAdvice(textType);
      } else if (input.includes('planning') || input.includes('plan')) {
        response = getPlanningAdvice(textType);
      } else if (input.includes('grammar') || input.includes('mistake')) {
        response = `Here are common grammar tips for ${textType} writing:

• Check subject-verb agreement
• Use consistent tense throughout
• Vary sentence length for better flow
• Use active voice when possible
• Check punctuation in dialogue (for narratives)

Would you like me to check a specific sentence for you?`;
      } else {
        response = `I'm here to help with your ${textType} writing! I can assist with:

• **Text Analysis** - Get feedback on your writing
• **Vocabulary** - Find better words and synonyms  
• **Structure** - Organize your ideas effectively
• **Planning** - Create outlines and brainstorm
• **Grammar** - Fix common mistakes

What specific help do you need?`;
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error generating chat response:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: "I'm sorry, I'm having trouble responding right now. Please try again in a moment.",
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Get structure advice based on text type
  const getStructureAdvice = (textType: string) => {
    switch (textType.toLowerCase()) {
      case 'narrative':
        return `**Narrative Structure Tips:**

**1. Orientation** - Introduce characters, setting, and time
**2. Complication** - Present the main problem or conflict
**3. Rising Action** - Build tension and develop the story
**4. Climax** - The turning point or most exciting moment
**5. Resolution** - Solve the problem and conclude

**Tips:**
• Start with an engaging hook
• Use dialogue to bring characters to life
• Include sensory details
• Show, don't tell emotions`;

      case 'persuasive':
        return `**Persuasive Structure Tips:**

**1. Introduction** - Hook + clear position statement
**2. Argument 1** - Strongest point with evidence
**3. Argument 2** - Second point with examples
**4. Argument 3** - Third point with data/facts
**5. Counter-argument** - Address opposing views
**6. Conclusion** - Restate position + call to action

**Tips:**
• Use facts, statistics, and expert opinions
• Appeal to logic and emotion
• Use persuasive language`;

      default:
        return `**General Writing Structure:**

**1. Introduction** - Introduce your topic clearly
**2. Body Paragraphs** - Develop your main points
**3. Conclusion** - Summarize and conclude

**Tips:**
• Each paragraph should have one main idea
• Use topic sentences
• Include supporting details
• Use transitions between paragraphs`;
    }
  };

  // Get planning advice based on text type
  const getPlanningAdvice = (textType: string) => {
    switch (textType.toLowerCase()) {
      case 'narrative':
        return `**Planning Your Narrative:**

**Character Planning:**
• Who is your main character?
• What do they want?
• What's stopping them?

**Plot Planning:**
• What's the main problem?
• How will it be solved?
• What's the climax?

**Setting Planning:**
• Where does it happen?
• When does it happen?
• How does setting affect the story?

Click the Planning button to use our interactive planning tool!`;

      case 'persuasive':
        return `**Planning Your Persuasive Essay:**

**Position Planning:**
• What's your clear stance?
• Why do you believe this?

**Argument Planning:**
• What are your 3 strongest points?
• What evidence supports each?
• What examples can you use?

**Audience Planning:**
• Who are you trying to convince?
• What might they disagree with?
• How can you address their concerns?

Use the Planning tool to organize your arguments!`;

      default:
        return `**General Planning Tips:**

**Before Writing:**
• Brainstorm your main ideas
• Create an outline
• Gather supporting details
• Set a writing goal

**During Planning:**
• Organize ideas logically
• Think about your audience
• Consider your purpose
• Plan your conclusion

Use our Planning tool to get started!`;
    }
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
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border-2 border-blue-200">
        <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center">
          <Target className="h-6 w-6 mr-2" />
          Writing Analysis
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 font-medium">Word Count</span>
              <span className="text-2xl font-bold text-blue-600">{wordCount}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((wordCount / 300) * 100, 100)}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 mt-1">Target: 250-300 words</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 font-medium">Reading Time</span>
              <span className="text-2xl font-bold text-green-600">{readingTime} min</span>
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <Clock className="h-4 w-4 mr-1" />
              Based on 200 words/minute
            </div>
          </div>
        </div>

        <button
          onClick={handleEvaluate}
          disabled={isEvaluating || !content.trim()}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isEvaluating ? (
            <>
              <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
              Analyzing Your Writing...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5 mr-2" />
              Analyze Text Type
            </>
          )}
        </button>
      </div>
    </div>
  );

  // Vocabulary Sophistication Tab Content
  const renderVocabularySophistication = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-50 to-teal-50 p-6 rounded-xl border-2 border-green-200">
        <h3 className="text-xl font-bold text-green-900 mb-4 flex items-center">
          <BookOpen className="h-6 w-6 mr-2" />
          Paraphrase Tool
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Original Text:
            </label>
            <textarea
              value={paraphraseInput}
              onChange={(e) => setParaphraseInput(e.target.value)}
              placeholder="Enter or paste text to paraphrase..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>
          
          <button
            onClick={handleParaphrase}
            disabled={isParaphrasing || !paraphraseInput.trim()}
            className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white py-3 px-6 rounded-lg font-semibold hover:from-green-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isParaphrasing ? (
              <>
                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                Paraphrasing...
              </>
            ) : (
              <>
                <Wand2 className="h-5 w-5 mr-2" />
                Paraphrase
              </>
            )}
          </button>
          
          {paraphraseOutput && (
            <div className="bg-white p-4 rounded-lg border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-700">Paraphrased Text:</span>
                <button
                  onClick={() => copyToClipboard(paraphraseOutput)}
                  className="text-green-600 hover:text-green-700"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              <p className="text-gray-800">{paraphraseOutput}</p>
            </div>
          )}
        </div>
      </div>

      {/* Synonym Helper */}
      {showSynonyms && (
        <div className="bg-white p-4 rounded-lg border-2 border-yellow-200 shadow-lg">
          <h4 className="font-semibold text-gray-800 mb-3">
            Synonyms for "{selectedText}":
          </h4>
          {isLoadingSynonyms ? (
            <div className="flex items-center text-gray-500">
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Loading synonyms...
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {synonyms.map((synonym, index) => (
                <button
                  key={index}
                  onClick={() => replaceSynonym(synonym)}
                  className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm hover:bg-yellow-200 transition-colors"
                >
                  {synonym}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => setShowSynonyms(false)}
            className="mt-3 text-gray-500 hover:text-gray-700 text-sm"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );

  // Progress Tracking Tab Content
  const renderProgressTracking = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border-2 border-purple-200">
        <h3 className="text-xl font-bold text-purple-900 mb-4 flex items-center">
          <TrendingUp className="h-6 w-6 mr-2" />
          Progress Tracking
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 font-medium">Time Spent</span>
              <div className="flex items-center">
                <button
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className={`p-2 rounded-full mr-2 ${isTimerRunning ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}
                >
                  {isTimerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
                <span className="text-2xl font-bold text-purple-600">{formatTime(timeSpent)}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 font-medium">Words/Minute</span>
              <span className="text-2xl font-bold text-pink-600">{progressData.averageWordsPerMinute}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-3">Writing Goals</h4>
          <textarea
            value={writingGoals}
            onChange={(e) => setWritingGoals(e.target.value)}
            placeholder="Set your writing goals for this session..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            rows={3}
          />
        </div>
      </div>
    </div>
  );

  // Coaching Tips Tab Content
  const renderCoachingTips = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-xl border-2 border-orange-200">
        <h3 className="text-xl font-bold text-orange-900 mb-4 flex items-center">
          <Award className="h-6 w-6 mr-2" />
          Coaching Tips
        </h3>
        
        {evaluation ? (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-semibold text-gray-800">Overall Score</span>
                <div className="flex items-center">
                  <span className="text-3xl font-bold text-orange-600">{evaluation.overallScore || evaluation.score}</span>
                  <span className="text-gray-500 ml-1">/10</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-orange-400 to-red-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${((evaluation.overallScore || evaluation.score) / 10) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2 flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Strengths
                </h4>
                <ul className="space-y-1">
                  {(evaluation.strengths || []).map((strength: string, index: number) => (
                    <li key={index} className="text-green-700 text-sm">• {strength}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                  <Lightbulb className="h-5 w-5 mr-2" />
                  Areas to Improve
                </h4>
                <ul className="space-y-1">
                  {(evaluation.improvements || []).map((improvement: string, index: number) => (
                    <li key={index} className="text-blue-700 text-sm">• {improvement}</li>
                  ))}
                </ul>
              </div>
            </div>

            {evaluation.specificFeedback && (
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-2">Detailed Feedback</h4>
                <p className="text-gray-700">{evaluation.specificFeedback || evaluation.detailedFeedback}</p>
              </div>
            )}

            {(evaluation.nextSteps || evaluation.suggestions) && (
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h4 className="font-semibold text-yellow-800 mb-2 flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Next Steps
                </h4>
                <ul className="space-y-1">
                  {(evaluation.nextSteps || evaluation.suggestions || []).map((step: string, index: number) => (
                    <li key={index} className="text-yellow-700 text-sm">• {step}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Write some content and click "Analyze Text Type" to get personalized feedback!</p>
            <button
              onClick={handleEvaluate}
              disabled={!content.trim()}
              className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Get Feedback
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // Planning Modal with text-type specific content
  const renderPlanningModal = () => {
    const getPlanningContent = () => {
      switch (textType.toLowerCase()) {
        case 'narrative':
          return {
            title: 'Narrative Planning',
            sections: [
              {
                title: 'Characters',
                placeholder: 'Who are your main characters? What are they like?',
                tips: ['Main character goals and motivations', 'Character relationships', 'Character development arc']
              },
              {
                title: 'Setting',
                placeholder: 'Where and when does your story take place?',
                tips: ['Time period', 'Location details', 'Atmosphere and mood']
              },
              {
                title: 'Plot Structure',
                placeholder: 'What happens in your story?',
                tips: ['Problem/conflict', 'Rising action events', 'Climax moment', 'Resolution']
              },
              {
                title: 'Theme & Message',
                placeholder: 'What is your story really about?',
                tips: ['Central theme', 'Life lesson', 'Emotional journey']
              }
            ]
          };
        case 'persuasive':
          return {
            title: 'Persuasive Planning',
            sections: [
              {
                title: 'Position Statement',
                placeholder: 'What is your clear stance on the issue?',
                tips: ['Strong, clear position', 'Why you believe this', 'What you want readers to do']
              },
              {
                title: 'Main Arguments',
                placeholder: 'What are your strongest points?',
                tips: ['Argument 1 with evidence', 'Argument 2 with examples', 'Argument 3 with facts']
              },
              {
                title: 'Evidence & Examples',
                placeholder: 'What proof supports your arguments?',
                tips: ['Statistics and data', 'Expert opinions', 'Real-world examples', 'Personal experiences']
              },
              {
                title: 'Counter-arguments',
                placeholder: 'What might opponents say? How will you respond?',
                tips: ['Opposing viewpoints', 'Your responses', 'Why your position is stronger']
              }
            ]
          };
        case 'expository':
          return {
            title: 'Expository Planning',
            sections: [
              {
                title: 'Topic & Purpose',
                placeholder: 'What will you explain and why?',
                tips: ['Clear topic focus', 'Purpose of explanation', 'Target audience']
              },
              {
                title: 'Main Points',
                placeholder: 'What are the key concepts to explain?',
                tips: ['Point 1 with details', 'Point 2 with examples', 'Point 3 with evidence']
              },
              {
                title: 'Supporting Information',
                placeholder: 'What facts, examples, and details will you include?',
                tips: ['Definitions', 'Examples', 'Comparisons', 'Process steps']
              },
              {
                title: 'Organization',
                placeholder: 'How will you structure your explanation?',
                tips: ['Logical order', 'Transitions', 'Clear connections']
              }
            ]
          };
        default:
          return {
            title: 'Writing Planning',
            sections: [
              {
                title: 'Main Ideas',
                placeholder: 'What are your key points?',
                tips: ['Central theme', 'Supporting ideas', 'Key messages']
              },
              {
                title: 'Structure',
                placeholder: 'How will you organize your writing?',
                tips: ['Introduction approach', 'Body organization', 'Conclusion strategy']
              },
              {
                title: 'Supporting Details',
                placeholder: 'What examples and evidence will you use?',
                tips: ['Specific examples', 'Supporting facts', 'Personal experiences']
              }
            ]
          };
      }
    };

    const planningContent = getPlanningContent();

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center">
                <PenTool className="h-6 w-6 mr-2" />
                {planningContent.title}
              </h2>
              <button
                onClick={() => setShowPlanningModal(false)}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            <div className="space-y-6">
              {planningContent.sections.map((section, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">{section.title}</h3>
                  <textarea
                    placeholder={section.placeholder}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={4}
                  />
                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-600 mb-1">Tips:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {section.tips.map((tip, tipIndex) => (
                        <li key={tipIndex}>• {tip}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 flex justify-end space-x-3">
            <button
              onClick={() => setShowPlanningModal(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => setShowPlanningModal(false)}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Save Plan
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`flex h-screen bg-gray-50 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Main Writing Area */}
      <div className="flex-1 flex flex-col">
        {/* Header - Removed "Choose your story type" dropdown */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Writing Area</h1>
              {isAutoSaving && (
                <div className="flex items-center text-green-600 text-sm">
                  <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                  Auto-saving...
                </div>
              )}
              {lastSaved && (
                <div className="text-gray-500 text-sm">
                  Last saved: {lastSaved.toLocaleTimeString()}
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowPlanningModal(true)}
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <PenTool className="h-4 w-4 mr-2" />
                Planning
              </button>
              
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Prompt Display */}
        {prompt && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-200 p-6">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Your Writing Prompt</h3>
                <p className="text-gray-700 leading-relaxed">{prompt}</p>
              </div>
            </div>
          </div>
        )}

        {/* Writing Textarea */}
        <div className="flex-1 p-6">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            onMouseUp={handleTextSelection}
            onKeyUp={handleTextSelection}
            placeholder="Start writing your amazing story here! Let your creativity flow and bring your ideas to life..."
            className="w-full h-full p-6 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none resize-none text-lg leading-relaxed"
            style={{ 
              fontSize: `${fontSize}px`, 
              lineHeight: lineHeight,
              fontFamily: 'Georgia, serif'
            }}
          />
        </div>

        {/* Bottom Stats Bar */}
        <div className="bg-white border-t border-gray-200 p-4">
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
                <Play className="h-4 w-4 mr-1" />
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

      {/* Writing Buddy Sidebar - Made fully visible */}
      <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4">
          <h2 className="text-xl font-bold flex items-center">
            <Heart className="h-5 w-5 mr-2" />
            Writing Buddy
          </h2>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex">
            {[
              { id: 'text-type-analysis', label: 'Text Type Analysis', icon: Target },
              { id: 'vocabulary', label: 'Vocabulary Sophistication', icon: BookOpen },
              { id: 'progress', label: 'Progress Tracking', icon: TrendingUp },
              { id: 'coaching-tips', label: 'Coaching Tips', icon: Award }
            ].map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-2 py-3 text-xs font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600 bg-purple-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <IconComponent className="h-4 w-4 mx-auto mb-1" />
                  <div className="text-center">{tab.label}</div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content - Made scrollable and fully visible */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'text-type-analysis' && renderTextTypeAnalysis()}
          {activeTab === 'vocabulary' && renderVocabularySophistication()}
          {activeTab === 'progress' && renderProgressTracking()}
          {activeTab === 'coaching-tips' && renderCoachingTips()}
        </div>
      </div>

      {/* Chat Buddy - Fixed Position */}
      {showChatBuddy && (
        <div className="fixed bottom-4 right-4 w-80 h-96 bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col z-40">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-3 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center">
              <Bot className="h-5 w-5 mr-2" />
              <span className="font-semibold">Writing Buddy Chat</span>
            </div>
            <button
              onClick={() => setShowChatBuddy(false)}
              className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {chatMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {message.type === 'assistant' && <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                    {message.type === 'user' && <User className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                    <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                  </div>
                </div>
              </div>
            ))}
            {isChatLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Bot className="h-4 w-4" />
                    <Loader className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <div className="border-t border-gray-200 p-3">
            <div className="flex space-x-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendChatMessage()}
                placeholder="Ask me about your writing..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <button
                onClick={handleSendChatMessage}
                disabled={!chatInput.trim() || isChatLoading}
                className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Toggle Button */}
      {!showChatBuddy && (
        <button
          onClick={() => setShowChatBuddy(true)}
          className="fixed bottom-4 right-4 w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-40"
        >
          <MessageSquare className="h-6 w-6" />
        </button>
      )}

      {/* Planning Modal */}
      {showPlanningModal && renderPlanningModal()}

      {/* Synonym Helper */}
      {showSynonyms && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-4 rounded-lg border-2 border-yellow-200 shadow-lg z-50">
          <h4 className="font-semibold text-gray-800 mb-3">
            Synonyms for "{selectedText}":
          </h4>
          {isLoadingSynonyms ? (
            <div className="flex items-center text-gray-500">
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Loading synonyms...
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {synonyms.map((synonym, index) => (
                <button
                  key={index}
                  onClick={() => replaceSynonym(synonym)}
                  className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm hover:bg-yellow-200 transition-colors"
                >
                  {synonym}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => setShowSynonyms(false)}
            className="mt-3 text-gray-500 hover:text-gray-700 text-sm"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
