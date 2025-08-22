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
  initialPrompt?: string; // Add initialPrompt prop
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
  selectedText = '',
  initialPrompt = '' // Default to empty string
}: EnhancedWritingLayoutProps) {
  const [showPlanningTool, setShowPlanningTool] = useState(false);
  const [plan, setPlan] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');

  // Initialize with a default prompt for narrative text type
  useEffect(() => {
    if (initialPrompt) {
      setGeneratedPrompt(initialPrompt);
    } else if (textType && !generatedPrompt) {
      // Set a default prompt based on text type
      const defaultPrompts = {
        narrative: "Write an engaging story about a character who discovers something unexpected that changes their life forever. Include vivid descriptions, realistic dialogue, and show the character's emotional journey. Make sure your story has a clear beginning, middle, and end with a satisfying conclusion. Focus on showing rather than telling, and use sensory details to bring your story to life.",
        persuasive: "Write a persuasive essay arguing for or against a topic you feel strongly about. Use compelling evidence, logical reasoning, and persuasive language to convince your audience. Include counterarguments and address them effectively. Structure your essay with a clear introduction, body paragraphs with strong arguments, and a powerful conclusion.",
        expository: "Write an informative essay explaining a complex topic or process that interests you. Use clear explanations, relevant examples, and logical organization to help your readers understand the subject. Include factual information and present it in an engaging way that makes the topic accessible to your audience.",
        descriptive: "Write a detailed description of a place, person, or object that has special meaning to you. Use vivid sensory details (sight, sound, smell, taste, touch) to paint a picture with words. Help your readers feel as if they are experiencing what you're describing through your carefully chosen language and imagery."
      };
      
      const defaultPrompt = defaultPrompts[textType.toLowerCase() as keyof typeof defaultPrompts] || 
        "Write a creative piece that showcases your writing skills. Choose a topic that interests you and develop it with clear structure, engaging content, and appropriate language for your audience. Focus on expressing your ideas clearly and creatively.";
      
      setGeneratedPrompt(defaultPrompt);
    }
  }, [initialPrompt, textType, generatedPrompt]);

  const handleTogglePlanning = () => {
    setShowPlanningTool(!showPlanningTool);
  };

  const handlePromptGenerated = (prompt: string) => {
    setGeneratedPrompt(prompt);
  };

  return (
    <div className="h-full bg-gray-50 overflow-hidden">
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
