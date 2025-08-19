import React from 'react';
import { PenTool, BookOpen, Clock, Settings, HelpCircle, Lightbulb, Award, Sparkles, Rocket, Home } from 'lucide-react';

interface EnhancedHeaderProps {
  textType: string;
  assistanceLevel: string;
  onTextTypeChange: (textType: string) => void;
  onAssistanceLevelChange: (level: string) => void;
  onTimerStart: () => void;
  hideTextTypeSelector?: boolean;
  onHomeClick?: () => void;
}

export function EnhancedHeader({
  textType,
  assistanceLevel,
  onTextTypeChange,
  onAssistanceLevelChange,
  onTimerStart,
  hideTextTypeSelector,
  onHomeClick
}: EnhancedHeaderProps) {
  // Handle text type change
  const handleTextTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTextType = e.target.value;
    onTextTypeChange(newTextType);
    
    // Save to localStorage for persistence
    localStorage.setItem('selectedWritingType', newTextType);
  };

  // Get display name for text type
  const getTextTypeDisplayName = (type: string) => {
    const displayNames = {
      'narrative': '🚀 Adventure Story',
      'persuasive': '🔊 Convince Others',
      'expository': '📚 Explain & Teach',
      'reflective': '✨ My Thoughts & Feelings',
      'descriptive': '🎨 Describe with Details',
      'recount': '📆 Tell What Happened',
      'discursive': '🤔 Explore Different Ideas',
      'news report': '📰 News Reporter',
      'letter': '✉️ Write a Letter',
      'diary entry': '📔 Dear Diary',
      'speech': '🎤 Give a Speech'
    };
    return displayNames[type as keyof typeof displayNames] || type;
  };

  return (
    <div className="enhanced-header space-optimized mb-4 px-4 py-3 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 border-b-4 border-blue-300 dark:border-blue-700 rounded-t-xl shadow-md">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0 relative">
        <div className="flex items-center relative">
          <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full shadow-md mr-2">
            <Rocket className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
            Writing Adventure! <span className="text-base">✨</span>
          </h1>
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse hidden sm:flex">
            <Sparkles className="w-2 h-2 text-white" />
          </div>
        </div>

        {/* Home Button */}
        {onHomeClick && (
          <button
            onClick={onHomeClick}
            className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg transition-all duration-200 font-medium shadow-md text-sm"
          >
            <Home className="h-4 w-4" />
            <span>Home</span>
          </button>
        )}
      </div>
    </div>
  );
}

