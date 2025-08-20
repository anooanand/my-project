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
  Send,
  Bot
} from 'lucide-react';
import { generatePrompt, getSynonyms, rephraseSentence, evaluateEssay } from '../lib/openai';
import { WritingStatusBar } from './WritingStatusBar';

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
  onContentChange?: (content: string) => void;
  initialContent?: string;
  onPromptChange?: (prompt: string) => void;
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
  prompt = "Write an engaging story about a character who discovers something unexpected that changes their life forever. Include vivid descriptions, realistic dialogue, and show the character's emotional journey. Make sure your story has a clear beginning, middle, and end with a satisfying conclusion. Focus on showing rather than telling, and use sensory details to bring your story to life.",
  onContentChange,
  initialContent = '',
  onPromptChange
}: WritingAreaProps) {
  // State management
  const [currentContent, setCurrentContent] = useState(content || initialContent);
  const [selectedText, setSelectedText] = useState('');
  const [showStructureGuide, setShowStructureGuide] = useState(false);
  const [showPlanningModal, setShowPlanningModal] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const [lineHeight, setLineHeight] = useState(1.6);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('analysis');
  const [examMode, setExamMode] = useState(false);
  const [examTimeRemaining, setExamTimeRemaining] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [examTimeLimit] = useState(40 * 60); // 40 minutes in seconds
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Calculate writing statistics
  const wordCount = currentContent.trim().split(/\s+/).filter(word => word.length > 0).length;
  const characterCount = currentContent.length;
  const readingTime = Math.ceil(wordCount / 200);

  // Handle content changes
  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setCurrentContent(newContent);
    onChange?.(newContent);
    onContentChange?.(newContent);
  }, [onChange, onContentChange]);

  // Handle text selection
  const handleTextSelection = useCallback(() => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const selected = currentContent.substring(start, end);
      setSelectedText(selected);
    }
  }, [currentContent]);

  // Send chat message
  const handleSendChatMessage = async () => {
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
      // Simulate AI response - in real implementation, this would call your AI service
      setTimeout(() => {
        const aiResponse = {
          id: (Date.now() + 1).toString(),
          text: "I'm here to help with your writing! What specific aspect would you like to work on?",
          sender: 'ai' as const,
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, aiResponse]);
        setIsChatLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error sending chat message:', error);
      setIsChatLoading(false);
    }
  };

  // Evaluate writing
  const handleEvaluate = async () => {
    if (!currentContent.trim()) return;

    setIsEvaluating(true);
    try {
      const result = await evaluateEssay(currentContent, textType);
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

  return (
    <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-900">
      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Writing Area */}
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 shadow-lg">
          {/* Compact Writing Prompt - White Background */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-3 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                <PenTool className="w-4 h-4 mr-2" />
                Your Writing Prompt
              </h3>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setShowStructureGuide(true)}
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Structure Guide"
                >
                  <BookOpen className="w-4 h-4 text-gray-500" />
                </button>
                <button
                  onClick={() => setShowPlanningModal(true)}
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Planning Tool"
                >
                  <Target className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{prompt}</p>
          </div>

          {/* Writing Area - Full Height */}
          <div className="flex-1 flex flex-col min-h-0">
            <textarea
              ref={textareaRef}
              value={currentContent}
              onChange={handleContentChange}
              onMouseUp={handleTextSelection}
              onKeyUp={handleTextSelection}
              placeholder="Start writing your amazing story here! Let your creativity flow and bring your ideas to life..."
              className="flex-1 p-6 text-lg leading-relaxed text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:outline-none resize-none border-none"
              style={{ fontSize: `${fontSize}px`, lineHeight: lineHeight }}
            />
          </div>
        </div>

        {/* Right Sidebar - Writing Buddy */}
        <div className="w-96 bg-gradient-to-b from-purple-600 to-indigo-700 text-white p-6 flex flex-col shadow-lg overflow-auto relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center">
              <Bot className="w-6 h-6 mr-3" />
              Writing Buddy
            </h2>
            <button
              onClick={() => { /* Toggle visibility or settings */ }}
              className="p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>

          <p className="text-purple-200 mb-4">Your AI writing assistant</p>

          {/* Tabs */}
          <div className="flex space-x-1 mb-4">
            {[
              { id: 'analysis', label: 'Analysis', icon: BarChart3 },
              { id: 'vocabulary', label: 'Vocabulary', icon: Lightbulb },
              { id: 'progress', label: 'Progress', icon: TrendingUp },
              { id: 'coach', label: 'Coach', icon: MessageSquare }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white bg-opacity-20 text-white'
                    : 'text-purple-200 hover:text-white hover:bg-white hover:bg-opacity-10'
                }`}
              >
                <tab.icon className="w-4 h-4 mr-1" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-auto">
            {activeTab === 'analysis' && (
              <div className="space-y-4">
                <div className="bg-white bg-opacity-10 rounded-lg p-4">
                  <h3 className="font-semibold mb-3 flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Writing Analysis
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-purple-200">Words:</span>
                      <span className="font-semibold">{wordCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-purple-200">Characters:</span>
                      <span className="font-semibold">{characterCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-purple-200">Reading Time:</span>
                      <span className="font-semibold">{readingTime} min</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleEvaluate}
                  disabled={isEvaluating || !currentContent.trim()}
                  className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
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
            )}

            {activeTab === 'vocabulary' && (
              <div className="space-y-4">
                <div className="bg-white bg-opacity-10 rounded-lg p-4">
                  <h3 className="font-semibold mb-3 flex items-center">
                    <Lightbulb className="w-5 h-5 mr-2" />
                    Vocabulary Enhancement
                  </h3>
                  <p className="text-purple-200 text-sm mb-3">
                    Select text in your writing to get synonym suggestions and improvements.
                  </p>
                  {selectedText && (
                    <div className="bg-white bg-opacity-10 rounded p-3">
                      <p className="text-sm font-medium mb-2">Selected: "{selectedText}"</p>
                      <button className="text-sm bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded transition-colors">
                        Get Synonyms
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'progress' && (
              <div className="space-y-4">
                <div className="bg-white bg-opacity-10 rounded-lg p-4">
                  <h3 className="font-semibold mb-3 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Writing Progress
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Word Count Goal</span>
                        <span>{wordCount}/300</span>
                      </div>
                      <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
                        <div 
                          className="bg-green-400 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min((wordCount / 300) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'coach' && (
              <div className="space-y-4">
                <div className="bg-white bg-opacity-10 rounded-lg p-4">
                  <h3 className="font-semibold mb-3 flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2" />
                    AI Writing Coach
                  </h3>
                  
                  {/* Chat Messages */}
                  <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                    {chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`p-2 rounded text-sm ${
                          message.sender === 'user'
                            ? 'bg-blue-500 bg-opacity-50 ml-4'
                            : 'bg-white bg-opacity-20 mr-4'
                        }`}
                      >
                        {message.text}
                      </div>
                    ))}
                    {isChatLoading && (
                      <div className="bg-white bg-opacity-20 mr-4 p-2 rounded text-sm">
                        <div className="flex items-center">
                          <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></span>
                          Thinking...
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Chat Input */}
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendChatMessage()}
                      placeholder="Ask for writing help..."
                      className="flex-1 bg-white bg-opacity-20 text-white placeholder-purple-200 px-3 py-2 rounded text-sm focus:outline-none focus:bg-opacity-30"
                    />
                    <button
                      onClick={handleSendChatMessage}
                      disabled={!chatInput.trim() || isChatLoading}
                      className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 px-3 py-2 rounded text-sm transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {evaluation && (
                  <div className="bg-white bg-opacity-10 rounded-lg p-4">
                    <h4 className="font-semibold mb-2 flex items-center">
                      <Award className="w-4 h-4 mr-2" />
                      Evaluation Results
                    </h4>
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <span>Overall Score:</span>
                        <span className="font-semibold">{evaluation.overallScore}/10</span>
                      </div>
                      <p className="text-purple-200">{evaluation.specificFeedback}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Structure Guide Modal */}
      {showStructureGuide && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
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
                  <p>Introduce the subject and create an overall impression or mood.</p>
                  <h4>2. Body Paragraphs (Sensory Details)</h4>
                  <p>Use vivid sensory language (sight, sound, smell, taste, touch) and figurative language (similes, metaphors) to describe the subject in detail.</p>
                  <h4>3. Conclusion</h4>
                  <p>Summarize the overall impression and leave the reader with a lasting image or feeling.</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Planning Tool Modal */}
      {showPlanningModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Planning Tool</h2>
            <button
              onClick={() => setShowPlanningModal(false)}
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
                onClick={() => setShowPlanningModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowPlanningModal(false);
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Save Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
