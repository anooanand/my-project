import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, FileText, Clock, Timer, Lightbulb, BookOpen, Target, Zap, Eye, Moon, Sun } from 'lucide-react';
import WritingArea from './WritingArea';
import TabbedCoachPanel from './TabbedCoachPanel';
import PlanningToolModal from './PlanningToolModal';
import StructureGuideModal from './StructureGuideModal';
import TipsModal from './TipsModal';
import EssayEvaluationModal from './EssayEvaluationModal';

interface EnhancedWritingLayoutProps {
  content: string;
  onContentChange: (content: string) => void;
  onBack: () => void;
  onNavigate: (page: string) => void;
  textType: string;
  wordCount: number;
  wpm: number;
  onTimerStart: (started: boolean) => void;
}

const EnhancedWritingLayout: React.FC<EnhancedWritingLayoutProps> = ({
  content,
  onContentChange,
  onBack,
  onNavigate,
  textType,
  wordCount,
  wpm,
  onTimerStart
}) => {
  const [localContent, setLocalContent] = useState(content);
  const [showPlanningModal, setShowPlanningModal] = useState(false);
  const [showStructureModal, setShowStructureModal] = useState(false);
  const [showTipsModal, setShowTipsModal] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [examMode, setExamMode] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState('M');
  const [fontFamily, setFontFamily] = useState('Serif (Georgia)');
  const [evaluationStatus, setEvaluationStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  
  // Timer state
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Enhanced Essay Evaluation States
  const [showEssayEvaluation, setShowEssayEvaluation] = useState<boolean>(false);

  // Get current prompt based on type and priority
  const getCurrentPrompt = () => {
    console.log('Getting current prompt...');
    
    // Check promptType to determine which prompt to use
    const promptType = localStorage.getItem("promptType");
    console.log('Prompt type:', promptType);

    // If promptType is 'generated', prioritize generatedPrompt
    if (promptType === 'generated') {
      const magicalPrompt = localStorage.getItem("generatedPrompt");
      console.log('Checking for magical prompt:', magicalPrompt);
      if (magicalPrompt && magicalPrompt.trim()) {
        console.log('Using magical prompt');
        return magicalPrompt;
      }
    }

    // If promptType is 'custom', prioritize customPrompt  
    if (promptType === 'custom') {
      const customPrompt = localStorage.getItem("customPrompt");
      console.log('Checking for custom prompt:', customPrompt);
      if (customPrompt && customPrompt.trim()) {
        console.log('Using custom prompt');
        return customPrompt;
      }
    }

    // Fallback: check for any available prompts
    const magicalPrompt = localStorage.getItem("generatedPrompt");
    if (magicalPrompt && magicalPrompt.trim()) {
      console.log('Using fallback magical prompt');
      return magicalPrompt;
    }

    const customPrompt = localStorage.getItem("customPrompt");
    if (customPrompt && customPrompt.trim()) {
      console.log('Using fallback custom prompt');
      return customPrompt;
    }

    // Final fallback based on text type
    const fallbackPrompts = {
      narrative: "**Prompt: The Secret Door in the Library** One rainy afternoon, while exploring the dusty corners of your school library, you stumble upon an old, forgotten door hidden behind a row of towering bookshelves. The door is slightly ajar, and a faint, glowing light escapes from the crack. Curiosity piqued, you decide to push it open. Inside, you find a magical realm filled with talking animals, enchanted trees, and swirling clouds of color. However, there's a catch: the magic of this world is fading, and only a brave adventurer can restore it. What challenges do you face in the new world, and what secrets do they reveal? What steps will you take to save the magical realm, and how will your own life change because of this adventure? Remember to weave in your feelings and thoughts as you navigate this extraordinary journey!",
      persuasive: "**Prompt: Should Schools Have Longer Lunch Breaks?** Many students feel rushed during their current lunch period and believe they need more time to eat, socialize, and recharge for afternoon classes. Write a persuasive essay arguing whether schools should extend lunch breaks from 30 minutes to 60 minutes. Consider the benefits and drawbacks for students, teachers, and the school schedule. Use specific examples and evidence to support your position.",
      informative: "**Prompt: The Impact of Social Media on Teenagers** Social media platforms have become an integral part of teenage life, influencing how young people communicate, learn, and view themselves. Write an informative essay explaining the various ways social media affects teenagers, including both positive and negative impacts. Discuss topics such as communication, education, mental health, and social relationships."
    };

    console.log('Using fallback prompt for text type:', textType);
    return fallbackPrompts[textType as keyof typeof fallbackPrompts] || fallbackPrompts.narrative;
  };

  // Initialize prompt
  useEffect(() => {
    const prompt = getCurrentPrompt();
    setCurrentPrompt(prompt);
    console.log('Set current prompt:', prompt);
  }, [textType]);

  // Listen for storage changes and custom prompt events
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'generatedPrompt' || e.key === 'customPrompt' || e.key === 'promptType') {
        console.log('Storage changed for key:', e.key, 'New value:', e.newValue);
        const newPrompt = getCurrentPrompt();
        setCurrentPrompt(newPrompt);
        console.log('Updated current prompt:', newPrompt);
      }
    };

    const handleCustomPromptCreated = (event: CustomEvent) => {
      console.log('Custom prompt created event received:', event.detail);
      const newPrompt = getCurrentPrompt();
      setCurrentPrompt(newPrompt);
      console.log('Updated current prompt after custom creation:', newPrompt);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('customPromptCreated', handleCustomPromptCreated as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('customPromptCreated', handleCustomPromptCreated as EventListener);
    };
  }, [textType]);

  // Sync local content with prop content
  useEffect(() => {
    setLocalContent(content);
  }, [content]);

  // Timer functionality
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTimerRunning]);

  // Start timer when user begins typing
  useEffect(() => {
    if (currentContent.trim().length > 0 && !isTimerRunning) {
      setIsTimerRunning(true);
      onTimerStart(true);
    }
  }, [currentContent, isTimerRunning, onTimerStart]);

  // Enhanced content change handler with real-time analysis
  const handleContentChange = (newContent: string) => {
    setLocalContent(newContent);
    onContentChange(newContent);
  };

  const handleSubmit = async () => {
    if (!hasContent) return;
    
    setEvaluationStatus("loading");
    
    try {
      // Stop the timer when submitting
      setIsTimerRunning(false);
      
      // Show Essay Evaluation Modal
      setShowEssayEvaluation(true);
      setEvaluationStatus("success");
    } catch (error) {
      console.error('Error during evaluation:', error);
      setEvaluationStatus("error");
    }
  };

  const handleCloseEssayEvaluation = () => {
    setShowEssayEvaluation(false);
    setEvaluationStatus("idle");
  };

  // Get current content
  const currentContent = localContent || content;
  const hasContent = currentContent.trim().length > 0;

  // Font size mapping
  const fontSizeClasses = {
    'S': 'text-sm',
    'M': 'text-base', 
    'L': 'text-lg',
    'XL': 'text-xl',
    'XXL': 'text-2xl'
  };

  // Format timer display
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Font family mapping
  const fontFamilyClasses = {
    'Serif (Georgia)': 'font-serif',
    'Sans-serif (Arial)': 'font-sans',
    'Monospace (Courier)': 'font-mono'
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode 
        ? 'bg-gray-900 text-white' 
        : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 text-gray-900'
    }`}>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
              <FileText className="w-4 h-4" />
              <span>{wordCount} words</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
              <Clock className="w-4 h-4" />
              <span>{wpm} WPM</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
              <Timer className="w-4 h-4" />
              <span>{formatTime(elapsedTime)}</span>
              {isTimerRunning && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>}
            </div>
          </div>
        </div>

        {/* Writing Prompt Section */}
        <div className={`rounded-lg p-6 mb-6 border ${
          darkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-blue-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Lightbulb className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-blue-700 dark:text-blue-300">Your Writing Prompt</h2>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Text Type: <span className="font-medium capitalize">{textType}</span>
            </div>
          </div>
          <div className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            {currentPrompt}
          </div>
        </div>

        {/* Toolbar Section */}
        <div className={`rounded-lg p-4 mb-6 border ${
          darkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200 shadow-sm'
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Left side - Action buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowPlanningModal(true)}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Target className="w-4 h-4" />
                <span>Planning</span>
              </button>
              
              <button
                onClick={() => setExamMode(!examMode)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  examMode 
                    ? 'bg-green-600 text-white' 
                    : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300'
                }`}
              >
                <Zap className="w-4 h-4" />
                <span>Exam Mode</span>
              </button>
              
              <button
                onClick={() => setShowStructureModal(true)}
                className="flex items-center space-x-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                <span>Structure</span>
              </button>
              
              <button
                onClick={() => setShowTipsModal(true)}
                className="flex items-center space-x-2 px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                <Lightbulb className="w-4 h-4" />
                <span>Tips</span>
              </button>
              
              <button
                onClick={() => setFocusMode(!focusMode)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  focusMode 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900 dark:text-indigo-300'
                }`}
              >
                <Eye className="w-4 h-4" />
                <span>Focus</span>
              </button>
              
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600' 
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                <span>Dark</span>
              </button>
            </div>

            {/* Right side - Font controls */}
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Font Size:</span>
                <div className="flex space-x-1">
                  {['S', 'M', 'L', 'XL', 'XXL'].map((size) => (
                    <button
                      key={size}
                      onClick={() => setFontSize(size)}
                      className={`px-2 py-1 text-sm rounded transition-colors ${
                        fontSize === size
                          ? 'bg-blue-600 text-white'
                          : darkMode
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Font Family:</span>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className={`px-3 py-1 text-sm rounded border transition-colors ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-gray-300'
                      : 'bg-white border-gray-300 text-gray-700'
                  }`}
                >
                  <option value="Serif (Georgia)">Serif (Georgia)</option>
                  <option value="Sans-serif (Arial)">Sans-serif (Arial)</option>
                  <option value="Monospace (Courier)">Monospace (Courier)</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Focus Mode:</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={focusMode}
                    onChange={() => setFocusMode(!focusMode)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex gap-6">
          {/* Writing Area */}
          <div className="flex-[7]">
            <div className={`rounded-lg border ${
              darkMode 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200 shadow-sm'
            }`}>
              <WritingArea
                content={currentContent}
                onContentChange={handleContentChange}
                placeholder="Start writing your amazing story here! Let your creativity flow and bring your ideas to life..."
                className={`w-full h-96 p-6 rounded-lg border-none resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  fontSizeClasses[fontSize as keyof typeof fontSizeClasses]
                } ${
                  fontFamilyClasses[fontFamily as keyof typeof fontFamilyClasses]
                } ${
                  darkMode 
                    ? 'bg-gray-800 text-gray-100 placeholder-gray-400' 
                    : 'bg-white text-gray-900 placeholder-gray-500'
                }`}
                hidePromptAndSubmit={true}
              />
            </div>
            
            {/* Submit Button */}
            <div className="mt-6">
              <button
                onClick={handleSubmit}
                disabled={!hasContent || evaluationStatus === "loading"}
                className={`w-full py-4 px-6 rounded-lg font-semibold text-white transition-all duration-300 ${
                  hasContent && evaluationStatus !== "loading"
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                {evaluationStatus === "loading" ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Generating Report...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <FileText className="w-5 h-5" />
                    <span>Get My Writing Report</span>
                  </div>
                )}
              </button>
              <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-2">
                Start writing to unlock your personalized assessment report
              </p>
            </div>
          </div>

          {/* Coach Panel */}
          {!focusMode && (
            <div className="flex-[3]">
              <TabbedCoachPanel
                content={currentContent}
                onContentChange={handleContentChange}
                textType={textType}
                wordCount={wordCount}
                wpm={wpm}
              />
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showPlanningModal && (
        <PlanningToolModal
          isOpen={showPlanningModal}
          onClose={() => setShowPlanningModal(false)}
          textType={textType}
        />
      )}

      {showStructureModal && (
        <StructureGuideModal
          isOpen={showStructureModal}
          onClose={() => setShowStructureModal(false)}
          textType={textType}
        />
      )}

      {showTipsModal && (
        <TipsModal
          isOpen={showTipsModal}
          onClose={() => setShowTipsModal(false)}
          textType={textType}
        />
      )}

      {showEssayEvaluation && (
        <EssayEvaluationModal
          isOpen={showEssayEvaluation}
          onClose={handleCloseEssayEvaluation}
          content={currentContent}
          textType={textType}
          wordCount={wordCount}
          timeSpent={elapsedTime}
        />
      )}
    </div>
  );
};

export default EnhancedWritingLayout;
