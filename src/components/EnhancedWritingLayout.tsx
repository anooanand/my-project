import React, { useState, useEffect, useCallback } from 'react';
import { WritingArea } from './WritingArea';
import { PlanningToolModal } from './PlanningToolModal';
import { 
  PenTool,
  ToggleRight
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
  const [showPlanningTool, setShowPlanningTool] = useState(false);
  const [plan, setPlan] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');

  const handleTogglePlanning = () => {
    setShowPlanningTool(!showPlanningTool);
  };

  const handlePromptGenerated = (prompt: string) => {
    setGeneratedPrompt(prompt);
  };

  return (
    <div className="enhanced-writing-layout h-full bg-gray-50 overflow-hidden">
      {/* Main Writing Area - Full height */}
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
    </div>
  );
}
