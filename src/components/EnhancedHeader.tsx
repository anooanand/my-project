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

  return (
    <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <PenTool className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Writing Adventure!</h1>
              <div className="flex items-center space-x-1 text-xs text-blue-100">
                <Sparkles className="w-3 h-3" />
                <span>Unleash Your Creativity</span>
              </div>
            </div>
          </div>

          {/* Center Content - Text Type Selector (conditionally rendered) */}
          <div className="flex-1 flex justify-center">
            {!hideTextTypeSelector && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4 text-blue-100" />
                  <span className="text-sm font-medium">Text Type:</span>
                </div>
                <select
                  value={textType}
                  onChange={handleTextTypeChange}
                  className="bg-white bg-opacity-20 backdrop-blur-sm border border-white border-opacity-30 rounded-lg px-3 py-1 text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 hover:bg-opacity-30 transition-all duration-200"
                >
                  <option value="narrative" className="text-gray-800">Narrative</option>
                  <option value="persuasive" className="text-gray-800">Persuasive</option>
                  <option value="expository" className="text-gray-800">Expository</option>
                  <option value="descriptive" className="text-gray-800">Descriptive</option>
                  <option value="creative" className="text-gray-800">Creative</option>
                </select>
              </div>
            )}
          </div>

          {/* Right Side - Home Button */}
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-yellow-300 rounded-full animate-pulse">
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
    </div>
  );
}
