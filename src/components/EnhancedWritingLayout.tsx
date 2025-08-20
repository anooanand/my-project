import React, { useState, useEffect, useCallback } from 'react';
import WritingArea from './WritingArea';
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
      {/* Main Writing Area - Full height with no bottom spacing */}
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
