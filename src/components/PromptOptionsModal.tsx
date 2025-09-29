import React, { useEffect } from 'react';
import { X, Sparkles, Edit3, Wand, Star, ChevronRight, Timer } from 'lucide-react';

interface PromptOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGeneratePrompt: () => void;
  onCustomPrompt: () => void;
  textType: string;
}

interface PromptOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;

  category: 'Quick Start' | 'Custom Prompts';
  isPopular?: boolean;
}

export function PromptOptionsModal({
  isOpen,
  onClose,
  onGeneratePrompt,
  onCustomPrompt,
  textType
}: PromptOptionsModalProps) {
  const promptOptions: PromptOption[] = [
    {
      id: 'magic-generator',
      title: 'Magic Prompt Generator',
      description: 'Let our AI create an awesome prompt just for you! Perfect for getting started quickly.',
      icon: <Sparkles className="h-6 w-6" />,

      category: 'Quick Start',
      isPopular: true,
    },
    {
      id: 'custom-idea',
      title: 'Use My Own Idea',
      description: 'Type in your own writing prompt or topic. Great for when you have a specific idea!',
      icon: <Edit3 className="h-6 w-6" />,

      category: 'Custom Prompts',
    },
  ];

  const difficultyColors = {
    'Beginner': 'bg-green-100 text-green-800 border-green-200',
    'Intermediate': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Advanced': 'bg-red-100 text-red-800 border-red-200'
  };

  const handleOptionClick = (optionId: string) => {
    if (optionId === 'magic-generator') {
      onGeneratePrompt();
    } else if (optionId === 'custom-idea') {
      onCustomPrompt();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700 animate-in slide-in-from-bottom-4 duration-500">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 p-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-indigo-600/20 backdrop-blur-sm"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <Wand className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Choose Your Writing Adventure</h2>
                  <p className="text-white/90 text-sm">Select how you'd like to start your {textType} writing journey</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200 hover:scale-110"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Progress Indicator */}
            <div className="flex items-center space-x-2 text-sm">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>Choose Prompt</span>
              </div>
              <ChevronRight className="w-4 h-4 text-white/60" />
              <div className="flex items-center space-x-1 text-white/60">
                <div className="w-2 h-2 bg-white/40 rounded-full"></div>
                <span>Start Writing</span>
              </div>
              <ChevronRight className="w-4 h-4 text-white/60" />
              <div className="flex items-center space-x-1 text-white/60">
                <div className="w-2 h-2 bg-white/40 rounded-full"></div>
                <span>Get Feedback</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          <div className="grid grid-cols-1 gap-4">
            {promptOptions.map((option) => (
              <div
                key={option.id}
                onClick={() => handleOptionClick(option.id)}
                className="relative group cursor-pointer p-6 bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-300 hover:shadow-xl hover:scale-105 transform"
              >
                {option.isPopular && (
                  <div className="absolute top-3 right-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                    <Star className="h-3 w-3 fill-current" />
                    Popular
                  </div>
                )}

                <div className="flex items-start space-x-4 mb-4">
                  <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl text-white shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                    {option.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      {option.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                      {option.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${difficultyColors[option.difficulty]}`}>
                      {option.difficulty}
                    </span>
                    <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
                      <Timer className="h-3 w-3" />
                      <span className="text-xs">{option.estimatedTime}</span>
                    </div>
                  </div>
                </div>

                <button className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2">
                  <span>Choose This Option</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4" />
                <span>All prompts are NSW exam aligned</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 hover:scale-105"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

