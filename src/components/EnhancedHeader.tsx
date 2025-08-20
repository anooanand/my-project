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
        <div className="flex items-center justify-between h-12">
          {/* Left Side - Minimal Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <PenTool className="h-4 w-4 text-white" />
            </div>
          </div>

          {/* Center Content - Text Type Selector (conditionally rendered) */}
          <div className="flex-1 flex justify-center">
            {!hideTextTypeSelector && (
              <div className="flex items-center space-x-4 bg-white bg-opacity-10 backdrop-blur-sm rounded-lg px-4 py-2">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4 text-white" />
                  <span className="text-sm font-medium text-white drop-shadow">Text Type:</span>
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
            {/* Home Button - ALWAYS VISIBLE */}
            <button
              onClick={onHomeClick || (() => window.location.href = '/')}
              className="flex items-center space-x-2 px-3 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg transition-all duration-200 font-medium shadow-lg text-sm backdrop-blur-sm border border-white border-opacity-20"
            >
              <Home className="h-4 w-4" />
              <span className="drop-shadow">Home</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
