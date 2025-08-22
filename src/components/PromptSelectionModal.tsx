import React, { useState } from 'react';
import { X, Wand2, PenTool, Sparkles, Lightbulb, Clock } from 'lucide-react';

interface PromptSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  textType: string;
  onMagicalPrompt: () => void;
  onCustomPrompt: () => void;
  isGeneratingPrompt?: boolean;
}

export function PromptSelectionModal({
  isOpen,
  onClose,
  textType,
  onMagicalPrompt,
  onCustomPrompt,
  isGeneratingPrompt = false
}: PromptSelectionModalProps) {
  if (!isOpen) return null;

  const getTextTypeDescription = (type: string) => {
    const descriptions = {
      narrative: "Tell an engaging story with characters, setting, and plot",
      persuasive: "Convince your audience with strong arguments and evidence",
      expository: "Explain or inform about a topic clearly and logically",
      descriptive: "Paint a vivid picture with detailed sensory descriptions",
      reflective: "Share personal thoughts and insights about an experience",
      recount: "Tell about events that happened in chronological order"
    };
    return descriptions[type.toLowerCase() as keyof typeof descriptions] || "Express your ideas creatively";
  };

  const getTextTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'narrative':
        return '📚';
      case 'persuasive':
        return '🎯';
      case 'expository':
        return '📖';
      case 'descriptive':
        return '🎨';
      case 'reflective':
        return '🤔';
      case 'recount':
        return '📝';
      default:
        return '✍️';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-3xl">{getTextTypeIcon(textType)}</div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 capitalize">
                  {textType} Writing
                </h2>
                <p className="text-gray-600 text-sm mt-1">
                  {getTextTypeDescription(textType)}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              How would you like to get started?
            </h3>
            <p className="text-gray-600">
              Choose how you'd like to begin your {textType.toLowerCase()} writing
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Magical Prompt Option */}
            <div className="group">
              <button
                onClick={onMagicalPrompt}
                disabled={isGeneratingPrompt}
                className="w-full p-6 border-2 border-purple-200 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-all duration-200 group-hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    {isGeneratingPrompt ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    ) : (
                      <Wand2 className="w-8 h-8 text-white" />
                    )}
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    {isGeneratingPrompt ? 'Generating...' : 'Magical Prompt'}
                  </h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Let our AI create an inspiring, personalized writing prompt just for you. Perfect for sparking creativity!
                  </p>
                  <div className="mt-4 flex items-center justify-center space-x-2 text-purple-600">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-xs font-medium">AI-Powered</span>
                  </div>
                </div>
              </button>
            </div>

            {/* Custom Prompt Option */}
            <div className="group">
              <button
                onClick={onCustomPrompt}
                disabled={isGeneratingPrompt}
                className="w-full p-6 border-2 border-blue-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 group-hover:shadow-lg disabled:opacity-50"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <PenTool className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    I Have My Own Prompt
                  </h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Start writing with your own topic or prompt. Great if you already know what you want to write about!
                  </p>
                  <div className="mt-4 flex items-center justify-center space-x-2 text-blue-600">
                    <Lightbulb className="w-4 h-4" />
                    <span className="text-xs font-medium">Your Choice</span>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Tips Section */}
          <div className="mt-8 bg-gray-50 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Lightbulb className="w-4 h-4 text-yellow-600" />
              </div>
              <div>
                <h5 className="font-medium text-gray-900 mb-1">Quick Tip</h5>
                <p className="text-gray-600 text-sm">
                  {textType.toLowerCase() === 'narrative' && "For narrative writing, think about interesting characters and exciting events that could happen to them."}
                  {textType.toLowerCase() === 'persuasive' && "For persuasive writing, choose a topic you feel strongly about and think of convincing reasons to support your view."}
                  {textType.toLowerCase() === 'expository' && "For expository writing, pick a topic you know well and can explain clearly to others."}
                  {textType.toLowerCase() === 'descriptive' && "For descriptive writing, think of a place, person, or object you can describe in vivid detail."}
                  {textType.toLowerCase() === 'reflective' && "For reflective writing, consider a meaningful experience and what you learned from it."}
                  {textType.toLowerCase() === 'recount' && "For recount writing, think of an interesting event or experience you can share in detail."}
                  {!['narrative', 'persuasive', 'expository', 'descriptive', 'reflective', 'recount'].includes(textType.toLowerCase()) && "Think about what you want to express and how you can engage your readers."}
                </p>
              </div>
            </div>
          </div>

          {/* Estimated Time */}
          <div className="mt-4 flex items-center justify-center space-x-2 text-gray-500">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Estimated writing time: 20-30 minutes</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-2xl">
          <div className="flex justify-between items-center">
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-gray-800 transition-colors text-sm"
            >
              ← Back to text type selection
            </button>
            <div className="text-xs text-gray-500">
              Step 2 of 3: Choose your prompt
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
