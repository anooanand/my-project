import React, { useState, useEffect, useCallback } from 'react';
import WritingArea from './WritingArea';
import { PlanningToolModal } from './PlanningToolModal';
import { StructureGuideModal } from './StructureGuideModal'; // Import StructureGuideModal
import { TipsModal } from './TipsModal'; // Import TipsModal
import { TabbedCoachPanel } from './TabbedCoachPanel'; // Import TabbedCoachPanel
import { WritingStatusBar } from './WritingStatusBar'; // Import WritingStatusBar
import {
  PenTool,
  Play,
  BookOpen,
  Lightbulb,
  Target,
  Eye,
  EyeOff,
  Pause,
  ToggleRight
} from 'lucide-react';

interface EnhancedWritingLayoutProps {
  content: string;
  onChange: (content: string) => void;
  textType: string;
  assistanceLevel: string;
  selectedText: string;
  onTimerStart: (started: boolean) => void;
  onSubmit: () => void;
  onTextTypeChange: (newTextType: string) => void;
  onPopupCompleted: () => void;
  onNavigate: (page: string) => void;
}

export function EnhancedWritingLayout({
  content,
  onChange,
  textType,
  assistanceLevel,
  selectedText,
  onTimerStart,
  onSubmit,
  onTextTypeChange,
  onPopupCompleted,
  onNavigate
}: EnhancedWritingLayoutProps) {
  const [showPlanningTool, setShowPlanningTool] = useState(false);
  const [showStructureGuide, setShowStructureGuide] = useState(false); // State for Structure Guide
  const [showTips, setShowTips] = useState(false); // State for Tips
  const [plan, setPlan] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [examMode, setExamMode] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [evaluationStatus, setEvaluationStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  // FIXED: Retrieve prompt from localStorage on component mount
  useEffect(() => {
    const retrievePromptFromStorage = () => {
      console.log("🔍 EnhancedWritingLayout: Retrieving prompt from localStorage");
      
      // Try to get the prompt from localStorage
      const storedPrompt = localStorage.getItem('generatedPrompt');
      const selectedWritingType = localStorage.getItem('selectedWritingType');
      
      if (storedPrompt) {
        console.log("✅ Found stored prompt:", storedPrompt);
        setGeneratedPrompt(storedPrompt);
      } else if (selectedWritingType) {
        // Try to get prompt by writing type
        const typeSpecificPrompt = localStorage.getItem(`${selectedWritingType}_prompt`);
        if (typeSpecificPrompt) {
          console.log("✅ Found type-specific prompt:", typeSpecificPrompt);
          setGeneratedPrompt(typeSpecificPrompt);
        } else {
          console.log("⚠️ No prompt found in localStorage");
        }
      }
    };

    retrievePromptFromStorage();
  }, []);

  const handleTogglePlanning = () => {
    setShowPlanningTool(!showPlanningTool);
  };

  const handleStartExamMode = () => {
    setExamMode(!examMode);
    onTimerStart(!examMode); // Notify parent about timer start/stop
  };

  const handleStructureGuide = () => {
    setShowStructureGuide(true);
  };

  const handleTips = () => {
    setShowTips(true);
  };

  const handleFocus = () => {
    setFocusMode(!focusMode);
  };

  const handlePromptGenerated = (prompt: string) => {
    console.log("📝 EnhancedWritingLayout: Prompt generated:", prompt);
    setGeneratedPrompt(prompt);
  };

  const handleContentChange = (newContent: string) => {
    console.log("📝 EnhancedWritingLayout: Content changed to:", newContent);
    console.log("📝 EnhancedWritingLayout: Content length:", newContent.length);
    
    // Update word count
    const words = newContent.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
    
    onChange(newContent);
  };

  const handleSubmitForEvaluation = async () => {
    setEvaluationStatus("loading");
    try {
      await onSubmit();
      setEvaluationStatus("success");
    } catch (error) {
      setEvaluationStatus("error");
    }
  };

  // Debug logging for prop values
  useEffect(() => {
    console.log("🔍 EnhancedWritingLayout: Props debug:");
    console.log("  - content:", content);
    console.log("  - content length:", content?.length || 0);
    console.log("  - textType:", textType);
  }, [content, textType]);

  return (
    <div className={`flex h-[calc(100vh-3rem)] bg-gray-50 transition-all duration-300 ${focusMode ? 'bg-gray-900' : ''}`}>
      {/* Left side - Writing Area - ADJUSTED FOR WIDER RIGHT PANEL */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${focusMode ? 'mr-0' : 'mr-4'} max-w-[calc(100%-32rem)]`}>
        
        {/* Writing Prompt Section */}
        <div className={`bg-white rounded-lg shadow-sm p-6 mb-4 focus-hide ${focusMode ? 'opacity-30' : ''}`}>
          <div className="flex items-start space-x-3">
            <div className="bg-yellow-100 p-2 rounded-lg">
              <Lightbulb className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-gray-800">Your Writing Prompt</h2>
                <div className="text-xs opacity-70">Text Type:&nbsp;
                  <select
                    className="rounded-md border px-2 py-1"
                    value={textType}
                    onChange={(e) => {
                      const v = e.target.value;
                      onTextTypeChange(v);
                      setGeneratedPrompt(localStorage.getItem(`${v}_prompt`) || '');
                    }}
                  >
                    <option value="narrative">Narrative</option>
                    <option value="persuasive">Persuasive</option>
                    <option value="informative">Informative</option>
                  </select>
                </div>
              </div>
              <div className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                {generatedPrompt || "Loading prompt…"}
              </div>
            </div>
          </div>
        </div>

        {/* Writing Area and Buttons */}
        <div className="flex-1 bg-white rounded-lg shadow-sm mb-4">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Your Writing</h3>
              <div className="flex flex-wrap gap-3">
                {/* Planning Phase Button */}
                <button
                  onClick={handleTogglePlanning}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 shadow-sm"
                  title="Planning Phase - Organize your ideas before writing"
                >
                  <PenTool className="h-4 w-4 mr-2" />
                  Planning Phase
                </button>

                {/* Start Exam Mode Button */}
                <button
                  onClick={handleStartExamMode}
                  className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg ${examMode ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 shadow-sm`}
                  title="Start Exam Mode - Practice under timed conditions"
                >
                  {examMode ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                  {examMode ? 'Stop Exam Mode' : 'Start Exam Mode'}
                </button>

                {/* Structure Guide Button */}
                <button
                  onClick={handleStructureGuide}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-purple-500 text-white hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 shadow-sm"
                  title="Structure Guide - Learn how to organize your writing"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Structure Guide
                </button>

                {/* Tips Button */}
                <button
                  onClick={handleTips}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-yellow-500 text-white hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 shadow-sm"
                  title="Tips - Get helpful writing advice"
                >
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Tips
                </button>

                {/* Focus Button */}
                <button
                  onClick={handleFocus}
                  className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg ${focusMode ? 'bg-orange-500 hover:bg-orange-600' : 'bg-gray-600 hover:bg-gray-700'} text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 shadow-sm`}
                  title="Focus Mode - Minimize distractions while writing"
                >
                  {focusMode ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                  {focusMode ? 'Exit Focus' : 'Focus'}
                </button>


              </div>
            </div>
            <WritingArea
              content={content}
              onChange={handleContentChange}
              placeholder="Start writing your amazing story here! Let your creativity flow and bring your ideas to life…"
              focusMode={focusMode}
              onSubmit={handleSubmitForEvaluation}
              evaluationStatus={evaluationStatus}
              wordCount={wordCount}
            />
          </div>
        </div>

        {/* Plan Summary (if saved) */}
        {plan && (
          <div className="plan-summary bg-gradient-to-r from-indigo-50 to-purple-50 border-t border-indigo-200 p-3 flex-shrink-0">
            <div className="flex items-start space-x-2">
              <PenTool className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-indigo-800 mb-1">Your Writing Plan</h4>
                <p className="text-xs text-indigo-700 line-clamp-2">{plan}</p>
              </div>
              <button
                onClick={handleTogglePlanning}
                className="text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                <ToggleRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Writing Status Bar with Words, WPM */}
        <WritingStatusBar
          wordCount={wordCount}
          content={content}
          textType={textType}
          targetWordCountMin={100}
          targetWordCountMax={500}
          examMode={examMode}
        />
      </div>

      {/* Right side - Writing Buddy Panel - MADE MUCH WIDER */}
      {!focusMode && (
        <div className="w-[30rem] min-w-[30rem] flex-shrink-0">
          <TabbedCoachPanel 
            analysis={null} 
            onApplyFix={() => {}}
            content={content}
            textType={textType}
            onWordSelect={() => {}}
          />
        </div>
      )}

      {/* Planning Tool Modal */}
      <PlanningToolModal
        isOpen={showPlanningTool}
        onClose={() => setShowPlanningTool(false)}
        textType={textType}
        onPlanSaved={(savedPlan) => {
          setPlan(savedPlan);
          setShowPlanningTool(false);
        }}
        existingPlan={plan}
      />

      {/* Structure Guide Modal */}
      <StructureGuideModal
        isOpen={showStructureGuide}
        onClose={() => setShowStructureGuide(false)}
      />

      {/* Tips Modal */}
      <TipsModal
        isOpen={showTips}
        onClose={() => setShowTips(false)}
      />
    </div>
  );
}

