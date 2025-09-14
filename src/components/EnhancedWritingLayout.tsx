import React, { useState, useEffect, useCallback } from 'react';
import { WritingArea } from './WritingArea';
import { PlanningToolModal } from './PlanningToolModal';
import { StructureGuideModal } from './StructureGuideModal';
import { TipsModal } from './TipsModal';
import './enhanced-writing-layout.css';

interface EnhancedWritingLayoutProps {
  content: string;
  onChange: (content: string) => void;
  textType: string;
  assistanceLevel: string;
  selectedText: string;
  onTimerStart: () => void;
  onSubmit: () => void;
  onTextTypeChange: (textType: string) => void;
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
  const [showStructureGuide, setShowStructureGuide] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [plan, setPlan] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');

  // Retrieve prompt from localStorage on component mount
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

  const handleTogglePlanning = useCallback(() => {
    setShowPlanningTool(!showPlanningTool);
  }, [showPlanningTool]);

  const handleShowStructureGuide = useCallback(() => {
    setShowStructureGuide(true);
  }, []);

  const handleShowTips = useCallback(() => {
    setShowTips(true);
  }, []);

  const handleStartExamMode = useCallback(() => {
    console.log("Starting exam mode...");
    onNavigate('exam');
  }, [onNavigate]);

  const handleFocus = useCallback(() => {
    console.log("Focus mode toggled");
    // Focus mode is handled internally by WritingArea
  }, []);

  const handlePromptGenerated = useCallback((prompt: string) => {
    console.log("📝 EnhancedWritingLayout: Prompt generated:", prompt);
    setGeneratedPrompt(prompt);
  }, []);

  const handleContentChange = useCallback((newContent: string) => {
    console.log("📝 EnhancedWritingLayout: Content changed, length:", newContent.length);
    onChange(newContent);
  }, [onChange]);

  const handleTextTypeChange = useCallback((newTextType: string) => {
    console.log("📋 EnhancedWritingLayout: Text type changed to:", newTextType);
    onTextTypeChange(newTextType);
  }, [onTextTypeChange]);

  const handlePopupCompleted = useCallback(() => {
    console.log("✅ EnhancedWritingLayout: Popup flow completed");
    onPopupCompleted();
  }, [onPopupCompleted]);

  // Debug logging for prop values
  useEffect(() => {
    console.log("🔍 EnhancedWritingLayout: Props debug:");
    console.log("  - content length:", content?.length || 0);
    console.log("  - textType:", textType);
    console.log("  - assistanceLevel:", assistanceLevel);
  }, [content, textType, assistanceLevel]);

  return (
    <div className="enhanced-writing-layout h-full overflow-hidden">
      {/* Main Writing Area - Full height with enhanced features */}
      <div className="h-full">
        <WritingArea
          content={content}
          onChange={handleContentChange}
          textType={textType}
          onTextTypeChange={handleTextTypeChange}
          onPopupCompleted={handlePopupCompleted}
          onPromptGenerated={handlePromptGenerated}
          prompt={generatedPrompt}
          onPlanningPhase={handleTogglePlanning}
          onStartExamMode={handleStartExamMode}
          onStructureGuide={handleShowStructureGuide}
          onTips={handleShowTips}
          onFocus={handleFocus}
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