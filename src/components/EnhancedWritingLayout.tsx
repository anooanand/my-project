import React, { useState, useEffect, useCallback } from 'react';
import { WritingArea } from './WritingArea';
import { TabbedCoachPanel } from './TabbedCoachPanel';
import { PlanningToolModal } from './PlanningToolModal';
import { 
  Bot, 
  PanelRightClose, 
  Plus, 
  Save, 
  Download, 
  HelpCircle, 
  Type,
  PenTool,
  ToggleLeft,
  ToggleRight,
  Heart
} from 'lucide-react';

interface EnhancedWritingLayoutProps {
  content: string;
  onChange: (content: string) => void;
  textType: string;
  onTimerStart: (shouldStart: boolean) => void;
  onSubmit: () => void;
  onTextTypeChange?: (textType: string) => void;
  onNavigate?: (page: string) => void;
  onStartNewEssay?: () => void;
  onShowHelpCenter?: () => void;
  onPopupCompleted?: () => void;
  assistanceLevel?: 'beginner' | 'intermediate' | 'advanced';
  selectedText?: string;
}

export function EnhancedWritingLayout({
  content,
  onChange,
  textType,
  onTimerStart,
  onSubmit,
  onTextTypeChange,
  onNavigate,
  onStartNewEssay,
  onShowHelpCenter,
  onPopupCompleted,
  assistanceLevel = 'intermediate',
  selectedText = ''
}: EnhancedWritingLayoutProps) {
  const [showWritingBuddy, setShowWritingBuddy] = useState(true);
  const [showPlanningTool, setShowPlanningTool] = useState(false);
  const [plan, setPlan] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [timeSpent, setTimeSpent] = useState(0);
  const [writingStreak, setWritingStreak] = useState(1);

  const wordCount = content.trim().split(/\s+/).filter(word => word.length > 0).length;

  // Timer for tracking writing time
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (content.length > 0) {
      interval = setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [content]);

  const toggleWritingBuddy = () => {
    setShowWritingBuddy(!showWritingBuddy);
  };

  const handleTogglePlanning = () => {
    setShowPlanningTool(!showPlanningTool);
  };

  const handlePromptGenerated = (prompt: string) => {
    setGeneratedPrompt(prompt);
  };

  const handleNewStory = () => {
    if (onStartNewEssay) {
      onStartNewEssay();
    } else {
      onChange('');
      // Clear generated prompt when starting new story
      setGeneratedPrompt('');
      if (onNavigate) {
        onNavigate('dashboard');
      }
    }
  };

  const handleSave = () => {
    // Save functionality
    localStorage.setItem('writingContent', content);
  };

  const handleExport = () => {
    // Export functionality
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `writing-${textType}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleHelp = () => {
    if (onShowHelpCenter) {
      onShowHelpCenter();
    } else if (onNavigate) {
      onNavigate('help');
    }
  };

  return (
    <div className="enhanced-writing-layout space-optimized bg-gray-50 overflow-hidden min-h-0 h-full flex flex-row">
      {/* Left Side - Writing Area with Toolbar and Prompt - 70% width */}
      <div className="writing-left-section flex-1 flex flex-col min-h-0" style={{ flex: '0 0 70%' }}>
        {/* Writing Area - Full height */}
        <div className="writing-textarea-wrapper flex-1 min-h-0">
          <div className="h-full">
            <WritingArea
              content={content}
              onChange={onChange}
              textType={textType}
              onTimerStart={onTimerStart}
              onSubmit={onSubmit}
              onTextTypeChange={onTextTypeChange}
              onPopupCompleted={onPopupCompleted}
              onPromptGenerated={handlePromptGenerated}
              prompt={generatedPrompt}
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
      </div>

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

      {/* Right Sidebar - Writing Buddy Panel - 30% width */}
      {showWritingBuddy && (
        <div className="writing-buddy-panel bg-white border-l border-gray-200 flex flex-col min-h-0" style={{ flex: '0 0 30%', minWidth: '300px' }}>
          {/* Writing Buddy Header - FIXED AND VISIBLE */}
          <div className="writing-buddy-header bg-gradient-to-r from-purple-500 to-pink-500 text-white border-b border-gray-200 flex-shrink-0 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Heart className="w-5 h-5 text-white" />
                <h2 className="text-xl font-bold text-white">Writing Buddy</h2>
              </div>
              <button
                onClick={toggleWritingBuddy}
                className="p-1 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              >
                <PanelRightClose className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Chat Panel Content - Full height */}
          <div className="flex-1 overflow-hidden">
            <TabbedCoachPanel
              content={content}
              textType={textType}
              assistanceLevel={assistanceLevel}
              selectedText={selectedText}
              onNavigate={onNavigate}
              wordCount={wordCount}
            />
          </div>
        </div>
      )}
    </div>
  );
}