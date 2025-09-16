import React, { useState, useCallback, useRef, useEffect } from "react";
import { InteractiveTextEditor } from "./InteractiveTextEditor";
import { TabbedCoachPanel } from "./TabbedCoachPanel";
import { evaluateEssay, saveDraft } from "../lib/api";
import { detectNewParagraphs, detectWordThreshold } from "../lib/paragraphDetection";
import { eventBus } from "../lib/eventBus";
import type { DetailedFeedback, LintFix } from "../types/feedback";
import { Save, Download, Upload, Eye, EyeOff, RotateCcw, Sparkles, BookOpen, Target, TrendingUp, Award, CheckCircle, AlertCircle, Star, Lightbulb, MessageSquare, BarChart3, Clock, Zap, Heart, Wand2, PenTool, FileText, Settings, RefreshCw, Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, Copy, Check, X, Plus, Minus, ChevronDown, ChevronUp, Info, HelpCircle, Calendar, Users, Globe, Mic, Camera, Image, Link, Hash, Type, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline, List, ListOrdered, Quote, Code, Scissors, Clipboard, Search, Filter, SortAsc, SortDesc, Grid, Layout, Sidebar, Menu, MoreHorizontal, MoreVertical, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Timer, Send, Bot, StopCircle, MapPin, Users2, Smile } from 'lucide-react';

type TextType = "narrative" | "persuasive" | "informative";

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
  assistanceLevel?: string;
  onPlanningPhase?: () => void;
  onStartExamMode?: () => void;
  onStructureGuide?: () => void;
  onTips?: () => void;
  onFocus?: () => void;
  onWordSelect?: (word: string) => void;
}

function WritingArea({
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
  onPromptChange,
  assistanceLevel = "intermediate",
  onPlanningPhase,
  onStartExamMode,
  onStructureGuide,
  onTips,
  onFocus,
  onWordSelect
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
  
  // Writing metrics state
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [totalWritingTime, setTotalWritingTime] = useState(0); // in seconds
  const [lastTypingTime, setLastTypingTime] = useState<Date | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  
  // Refs for automatic feedback
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevTextRef = useRef(currentContent);
  const lastFeedbackWordCountRef = useRef<number>(0);

  // -------- Analysis state --------
  const [analysis, setAnalysis] = useState<DetailedFeedback | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [err, setErr] = useState<string>();

  // Calculate writing metrics
  const wordCount = currentContent.trim() ? currentContent.trim().split(/\s+/).length : 0;
  const charCount = currentContent.length;
  const readingTime = Math.ceil(wordCount / 200); // Average reading speed
  
  // Calculate WPM (Words Per Minute)
  const calculateWPM = useCallback(() => {
    if (totalWritingTime === 0 || wordCount === 0) return 0;
    const minutes = totalWritingTime / 60;
    return Math.round(wordCount / minutes);
  }, [wordCount, totalWritingTime]);

  // SIMPLIFIED automatic feedback that actually works
  const handleContentChange = (newContent: string) => {
    setCurrentContent(newContent);
    onChange?.(newContent);
    onContentChange?.(newContent);
    
    const now = new Date();
    
    // Start timing if this is the first character
    if (!startTime && newContent.length > 0) {
      setStartTime(now);
    }
    
    // Track typing activity
    if (!isTyping) {
      setIsTyping(true);
      setLastTypingTime(now);
    }
    
    // Reset typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (lastTypingTime && startTime) {
        const sessionTime = (now.getTime() - lastTypingTime.getTime()) / 1000;
        setTotalWritingTime(prev => prev + sessionTime);
      }
    }, 2000); // 2 seconds of inactivity

    // SIMPLE AUTOMATIC FEEDBACK LOGIC
    const currentWordCount = newContent.trim() ? newContent.trim().split(/\s+/).length : 0;
    const lastFeedbackWordCount = lastFeedbackWordCountRef.current;
    
    console.log("Content changed:", {
      currentWordCount,
      lastFeedbackWordCount,
      difference: currentWordCount - lastFeedbackWordCount
    });

    // Trigger feedback every 20 words
    if (currentWordCount >= 20 && currentWordCount - lastFeedbackWordCount >= 20) {
      console.log("Triggering automatic feedback at", currentWordCount, "words");
      
      // Get the last paragraph or recent text
      const paragraphs = newContent.split('\n\n').filter(p => p.trim());
      const recentText = paragraphs[paragraphs.length - 1] || newContent.slice(-200);
      
      // Emit the event
      eventBus.emit("paragraph.ready", {
        paragraph: recentText,
        index: 0,
        wordCount: currentWordCount
      });
      
      // Update the last feedback word count
      lastFeedbackWordCountRef.current = currentWordCount;
    }

    // Also emit new paragraph events
    const newParagraphs = detectNewParagraphs(prevTextRef.current, newContent);
    if (newParagraphs.length > 0) {
      console.log("New paragraphs detected:", newParagraphs);
      eventBus.emit("newParagraph", { paragraphs: newParagraphs });
    }

    // Update previous text reference
    prevTextRef.current = newContent;
  };

  // Button handlers
  const handlePlanningPhase = () => {
    setShowPlanningModal(true);
    onPlanningPhase?.();
  };

  const handleStartExamMode = () => {
    setIsExamMode(!isExamMode);
    onStartExamMode?.();
  };

  const handleStructureGuide = () => {
    setShowStructureModal(true);
    onStructureGuide?.();
  };

  const handleTips = () => {
    setShowTipsModal(true);
    onTips?.();
  };

  const handleFocus = () => {
    setShowFocusMode(!showFocusMode);
    onFocus?.();
  };

  const handleSubmit = () => {
    onSubmitForEvaluation();
  };

  const handlePromptChange = (newPrompt: string) => {
    setCurrentPrompt(newPrompt);
    onPromptChange?.(newPrompt);
  };

  // Evaluation function
  const onSubmitForEvaluation = useCallback(async () => {
    if (!currentContent.trim()) {
      setErr("Please write some text before submitting for evaluation");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setErr(undefined);
    
    try {
      console.log("Starting evaluation...");
      const res = await evaluateEssay({ essayText: currentContent, textType });
      console.log("Evaluation response:", res);
      
      // Accept any response that has the basic structure
      if (res && typeof res === 'object' && res.overallScore !== undefined) {
        setAnalysis(res);
        setStatus("success");
        console.log("Analysis successful!");
      } else {
        throw new Error("Invalid response format");
      }
    } catch (e: any) {
      console.error("Evaluation failed:", e);
      setStatus("error");
      setErr(e?.message || "Failed to analyze essay. Please try again.");
    }
  }, [currentContent, textType]);

  const onApplyFix = useCallback((fix: LintFix) => {
    const before = currentContent.slice(0, fix.start);
    const after = currentContent.slice(fix.end);
    const newContent = before + fix.replacement + after;
    handleContentChange(newContent);
  }, [currentContent]);

  // Planning modal steps
  const planningSteps = [
    {
      title: "🎭 Who is your main character?",
      description: "Think about your hero! What do they look like? How old are they? What makes them special?",
      placeholder: "My main character is..."
    },
    {
      title: "🌍 Where does your story happen?",
      description: "Paint a picture of your setting! Is it a magical forest, a busy city, or somewhere completely different?",
      placeholder: "My story takes place in..."
    },
    {
      title: "⚡ What's the big problem?",
      description: "Every great story has a problem to solve! What challenge will your character face?",
      placeholder: "The main problem is..."
    },
    {
      title: "🚀 What exciting things happen?",
      description: "This is where the adventure really begins! What obstacles will your character face? How will they try to solve the problem?",
      placeholder: "The exciting events are..."
    },
    {
      title: "🎯 How does it end?",
      description: "Time for a satisfying ending! How does your character solve the problem? What do they learn? How do they feel at the end?",
      placeholder: "The story ends when..."
    },
    {
      title: "✨ What's your story's message?",
      description: "What important lesson or feeling do you want readers to take away from your story?",
      placeholder: "The message of my story is..."
    }
  ];

  return (
    <div className={`flex h-screen bg-gray-50 transition-all duration-300 ${showFocusMode ? 'bg-gray-900' : ''}`}>
      {/* Left side - Writing Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${showFocusMode ? 'mr-0' : 'mr-4'} max-w-[calc(100%-25rem)]`}>
        {/* Writing Prompt Section */}
        <div className={`bg-white rounded-lg shadow-sm p-6 mb-4 focus-hide ${showFocusMode ? 'opacity-30' : ''}`}>
          <div className="flex items-start space-x-3">
            <div className="bg-yellow-100 p-2 rounded-lg">
              <Lightbulb className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Your Writing Prompt</h2>
              <p className="text-gray-600 leading-relaxed">
                <strong>**Prompt: The Secret Doorway**</strong>
              </p>
              <p className="text-gray-600 leading-relaxed mt-2">
                One rainy afternoon, while exploring your grandmother's old attic, you stumble upon a dusty, ornate door that you've never seen before. Curiosity piqued, you push it open and step through. On the other side, you find yourself in a vibrant world where animals talk, the trees glow with a soft light, and magic is a part of everyday life.
              </p>
              <p className="text-gray-600 leading-relaxed mt-2">
                Write a story about your adventure in this enchanting world. What challenges do you face? Who do you meet along the way? How do you find your way back home, and what do you learn from your journey?
              </p>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className={`bg-white rounded-lg shadow-sm p-4 mb-4 focus-hide ${showFocusMode ? 'opacity-30' : ''}`}>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handlePlanningPhase}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Target className="w-4 h-4" />
              <span>Planning Phase</span>
            </button>
            <button
              onClick={handleStartExamMode}
              className={`${isExamMode ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200 shadow-md hover:shadow-lg`}
            >
              {isExamMode ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isExamMode ? 'Stop Exam Mode' : 'Start Exam Mode'}</span>
            </button>
            <button
              onClick={handleStructureGuide}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200 shadow-md hover:shadow-lg"
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
              className={`${showFocusMode ? 'bg-orange-500 hover:bg-orange-600' : 'bg-gray-500 hover:bg-gray-600'} text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200 shadow-md hover:shadow-lg`}
            >
              {showFocusMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{showFocusMode ? 'Exit Focus' : 'Focus'}</span>
            </button>
          </div>
        </div>

        {/* Writing Area */}
        <div className="flex-1 bg-white rounded-lg shadow-sm p-6 mb-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Writing</h3>
          <textarea
            ref={textareaRef}
            value={currentContent}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Start writing your amazing story here! Let your creativity flow and bring your ideas to life..."
            className={`w-full h-full resize-none border-none outline-none text-gray-700 leading-relaxed transition-all duration-300 ${
              showFocusMode ? 'bg-gray-800 text-white text-lg' : 'bg-transparent'
            }`}
            style={{ minHeight: '400px' }}
          />
        </div>

        {/* Status Bar */}
        <div className={`bg-white rounded-lg shadow-sm p-4 focus-hide ${showFocusMode ? 'opacity-30' : ''}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>{wordCount} words</span>
              </div>
              <div className="flex items-center space-x-2">
                <Timer className="w-4 h-4" />
                <span>{calculateWPM()} WPM</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>{readingTime} min read</span>
              </div>
              {status === "success" && (
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-green-600">Analysis complete</span>
                </div>
              )}
              {status === "error" && (
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-red-600">Analysis failed</span>
                </div>
              )}
            </div>
            <button
              onClick={handleSubmit}
              disabled={status === "loading" || !currentContent.trim()}
              className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                status === "loading"
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-green-500 hover:bg-green-600 text-white shadow-md hover:shadow-lg'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>{status === "loading" ? "Analyzing..." : "Submit for Evaluation Report"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right side - Writing Buddy Panel - RESTORED PROPER WIDTH */}
      {!showFocusMode && (
        <div className="w-96 min-w-96 flex-shrink-0">
          <TabbedCoachPanel
            analysis={analysis}
            onApplyFix={onApplyFix}
            content={currentContent}
            textType={textType}
            onWordSelect={onWordSelect}
          />
        </div>
      )}

      {/* Planning Modal */}
      {showPlanningModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">📝 Story Planning Workshop</h2>
              <button
                onClick={() => setShowPlanningModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-600">Step {planningStep} of {planningSteps.length}</span>
                <div className="flex space-x-1">
                  {planningSteps.map((_, index) => (
                    <span
                      key={index}
                      className={`h-2 w-2 rounded-full ${index + 1 === planningStep ? 'bg-blue-500' : 'bg-gray-300'}`}
                    ></span>
                  ))}
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-3">{planningSteps[planningStep - 1].title}</h3>
              <p className="text-gray-600 mb-4">{planningSteps[planningStep - 1].description}</p>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[100px]"
                placeholder={planningSteps[planningStep - 1].placeholder}
              ></textarea>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setPlanningStep(prev => Math.max(1, prev - 1))}
                disabled={planningStep === 1}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50"
              >
                Previous
              </button>
              {planningStep < planningSteps.length ? (
                <button
                  onClick={() => setPlanningStep(prev => prev + 1)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={() => {
                    setShowPlanningModal(false);
                    onPopupCompleted?.();
                  }}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  Finish Planning
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Structure Guide Modal */}
      {showStructureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">📚 Structure Guide</h2>
              <button
                onClick={() => setShowStructureModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="prose max-w-none text-gray-700">
              <h3 className="text-xl font-semibold mb-2">Narrative Writing Structure</h3>
              <p>A typical narrative follows a story arc:</p>
              <ol className="list-decimal list-inside space-y-2">
                <li><strong>Exposition:</strong> Introduce characters, setting, and initial situation.</li>
                <li><strong>Rising Action:</strong> Develop the conflict, build suspense, and introduce complications.</li>
                <li><strong>Climax:</strong> The turning point, the most intense moment of the story.</li>
                <li><strong>Falling Action:</strong> Events that happen after the climax, leading to the resolution.</li>
                <li><strong>Resolution:</strong> The conclusion of the story, where conflicts are resolved.</li>
              </ol>
              <h3 className="text-xl font-semibold mt-6 mb-2">Tips for Each Section:</h3>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Exposition:</strong> "Hook" your reader with an interesting opening.</li>
                <li><strong>Rising Action:</strong> Use vivid descriptions and strong verbs.</li>
                <li><strong>Climax:</strong> Make it dramatic and impactful.</li>
                <li><strong>Falling Action:</strong> Tie up loose ends.</li>
                <li><strong>Resolution:</strong> Leave the reader with a sense of closure.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tips Modal */}
      {showTipsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">💡 Writing Tips</h2>
              <button
                onClick={() => setShowTipsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="prose max-w-none text-gray-700">
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Show, Don't Tell:</strong> Instead of saying a character is sad, describe their slumped shoulders and tear-filled eyes.</li>
                <li><strong>Vary Sentence Structure:</strong> Mix short, punchy sentences with longer, more descriptive ones to keep your writing engaging.</li>
                <li><strong>Use Sensory Details:</strong> Engage all five senses (sight, sound, smell, touch, taste) to make your descriptions come alive.</li>
                <li><strong>Strong Verbs and Adjectives:</strong> Choose powerful words that convey meaning precisely and vividly.</li>
                <li><strong>Realistic Dialogue:</strong> Make your characters' conversations sound natural and authentic.</li>
                <li><strong>Pacing:</strong> Control the speed at which your story unfolds. Speed up for action, slow down for reflection.</li>
                <li><strong>Revise and Edit:</strong> Always review your work for clarity, coherence, grammar, and spelling.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Export as default to maintain compatibility
export default WritingArea;
