import React, { useState, useEffect, useCallback } from 'react';
import WritingArea from './WritingArea';
import { PlanningToolModal } from './PlanningToolModal';
import {
  PenTool,
  ToggleRight
} from 'lucide-react';

interface EnhancedWritingLayoutProps {
  content: string;
  setContent: (content: string) => void;
  textType: string;
  setTextType: (textType: string) => void;
  popupFlowCompleted: boolean;
  setPopupFlowCompleted: (completed: boolean) => void;
  selectedText: string;
  setSelectedText: (text: string) => void;
  openAIConnected: boolean;
  openAILoading: boolean;
}

export function EnhancedWritingLayout({
  content,
  setContent,
  textType,
  setTextType,
  popupFlowCompleted,
  setPopupFlowCompleted,
  selectedText,
  setSelectedText,
  openAIConnected,
  openAILoading
}: EnhancedWritingLayoutProps) {
  const [showPlanningTool, setShowPlanningTool] = useState(false);
  const [plan, setPlan] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');

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

  const handlePromptGenerated = (prompt: string) => {
    console.log("📝 EnhancedWritingLayout: Prompt generated:", prompt);
    setGeneratedPrompt(prompt);
  };

  const handleContentChange = (newContent: string) => {
    console.log("📝 EnhancedWritingLayout: Content changed to:", newContent);
    console.log("📝 EnhancedWritingLayout: Content length:", newContent.length);
    setContent(newContent);
  };

  const handleTextTypeChange = (newTextType: string) => {
    console.log("📋 EnhancedWritingLayout: Text type changed to:", newTextType);
    setTextType(newTextType);
  };

  const handlePopupCompleted = () => {
    console.log("✅ EnhancedWritingLayout: Popup flow completed");
    setPopupFlowCompleted(true);
  };

  // Debug logging for prop values
  useEffect(() => {
    console.log("🔍 EnhancedWritingLayout: Props debug:");
    console.log("  - content:", content);
    console.log("  - content length:", content?.length || 0);
    console.log("  - textType:", textType);
    console.log("  - openAIConnected:", openAIConnected);
    console.log("  - openAILoading:", openAILoading);
  }, [content, textType, openAIConnected, openAILoading]);

  return (
    <div className="enhanced-writing-layout h-full bg-gray-50 overflow-hidden">
      {/* Main Writing Area - Full height */}
      <div className="h-full">
        <WritingArea
          content={content}
          onChange={handleContentChange}
          textType={textType}
          onTextTypeChange={handleTextTypeChange}
          onPopupCompleted={handlePopupCompleted}
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