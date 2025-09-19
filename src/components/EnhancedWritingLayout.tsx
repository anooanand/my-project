import React, { useState, useEffect, useRef } from 'react';
import { Lightbulb } from 'lucide-react';
import { WritingArea } from './WritingArea'; // Changed from import WritingArea from './WritingArea';
// ... other imports

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
  // ... existing state and functions

  const [currentPrompt, setCurrentPrompt] = useState('');

  // Function to get the current prompt from localStorage or fallback
  const getCurrentPrompt = () => {
    try {
      // First check for a generated prompt from Magical Prompt
      const magicalPrompt = localStorage.getItem("generatedPrompt");
      if (magicalPrompt && magicalPrompt.trim()) {
        console.log("📝 getCurrentPrompt: Using Magical Prompt from localStorage:", magicalPrompt.substring(0, 50) + "...");
        return magicalPrompt;
      }

      // Check for text-type specific prompt
      const textTypePrompt = localStorage.getItem(`${textType.toLowerCase()}_prompt`);
      if (textTypePrompt && textTypePrompt.trim()) {
        console.log("📝 getCurrentPrompt: Using text-type specific prompt:", textTypePrompt.substring(0, 50) + "...");
        return textTypePrompt;
      }

      // Fallback to default prompt
      const fallbackPrompt = "The Secret Door in the Library: During a rainy afternoon, you decide to explore the dusty old library in your town that you've never visited before. As you wander through the aisles, you discover a hidden door behind a bookshelf. It's slightly ajar, and a faint, warm light spills out from the crack. What happens when you push the door open? Describe the world you enter and the adventures that await you inside. Who do you meet, and what challenges do you face? How does this experience change you by the time you return to the library? Let your imagination run wild as you take your reader on a journey through this mysterious door!";
      console.log('📝 Using fallback prompt');
      return fallbackPrompt;
    } catch (error) {
      console.error('Error getting current prompt:', error);
      return "Write an engaging story that captures your reader's imagination.";
    }
  };

  // Initialize and sync prompt on component mount and when textType changes
  useEffect(() => {
    const prompt = getCurrentPrompt();
    console.log("🔄 useEffect[textType]: Initializing/Syncing prompt.");
    setCurrentPrompt(prompt);
    console.log("✅ useEffect[textType]: currentPrompt set to:", prompt.substring(0, 50) + "...");
  }, [textType]);

  // Listen for localStorage changes (from other tabs/components)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      console.log('📡 handleStorageChange: Storage event detected. Key:', e.key, 'New Value:', e.newValue?.substring(0, 50) + '...');
      if (e.key === 'generatedPrompt' || e.key === `${textType.toLowerCase()}_prompt`) {
        console.log('📡 handleStorageChange: Relevant storage key changed. Updating prompt.');
        const newPrompt = getCurrentPrompt();
        setCurrentPrompt(newPrompt);
        console.log('✅ handleStorageChange: currentPrompt set to:', newPrompt.substring(0, 50) + '...');
      }
    };

    // Listen for custom events from Magical Prompt generation
    const handlePromptGenerated = (event: CustomEvent) => {
      console.log("🎯 handlePromptGenerated: Custom event received. Detail:", event.detail);
      const newPrompt = getCurrentPrompt();
      setCurrentPrompt(newPrompt);
      console.log("✅ handlePromptGenerated: currentPrompt set to:", newPrompt.substring(0, 50) + "...");
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('promptGenerated', handlePromptGenerated as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('promptGenerated', handlePromptGenerated as EventListener);
    };
  }, [textType]);

  // ... rest of the component

  return (
    <div className="flex h-full bg-gray-50">
      {/* Left side - Writing Area Content */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Your Writing Prompt Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 mx-4 mt-4">
          <div className="flex items-center mb-2">
            <Lightbulb className="w-5 h-5 mr-2 text-blue-600" />
            <h3 className="font-semibold text-blue-800">Your Writing Prompt</h3>
          </div>
          <p className="text-blue-700 text-sm leading-relaxed">
            {currentPrompt}
          </p>
        </div>

        {/* Action Buttons and Stats Section */}
        {/* ... rest of the action buttons and stats */}

        {/* Text Editor Section */}
        <div className="flex-1 mx-4 mb-4">
          <div className="bg-white border border-gray-200 rounded-lg h-full">
            <WritingArea
              content={content}
              onChange={onChange}
              onSubmit={onSubmit}
              textType={textType}
              assistanceLevel={assistanceLevel}
              selectedText={selectedText}
              onTimerStart={onTimerStart}
              onTextTypeChange={onTextTypeChange}
              onPopupCompleted={onPopupCompleted}
              onNavigate={onNavigate}
              evaluationStatus={evaluationStatus}
              examMode={examMode}
              hidePromptAndSubmit={true}
              prompt={currentPrompt} // Pass currentPrompt to WritingArea
              onPromptGenerated={setCurrentPrompt} // Pass a handler to update prompt if WritingArea generates one
            />
          </div>
        </div>

        {/* Submit for Evaluation Button */}
        {/* ... rest of the submit button */}
      </div>
      {/* ... rest of the EnhancedWritingLayout component */}
    </div>
  );
}
