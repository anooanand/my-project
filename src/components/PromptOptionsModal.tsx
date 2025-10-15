import React from 'react';
import { X, Sparkles, Edit3, Wand, Star, Zap, RotateCw, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PromptOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGeneratePrompt: () => void;
  onCustomPrompt: () => void;
  isLoading: boolean;
  textType: string;
}

export function PromptOptionsModal({
  isOpen,
  onClose,
  onGeneratePrompt,
  onCustomPrompt,
  textType,
  isLoading
}: PromptOptionsModalProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  // FIXED: Let parent component handle the flow instead of navigating directly
  const handleGeneratePrompt = () => {
    console.log('🎯 PromptOptionsModal: Generate prompt clicked for:', textType);

    // Store the choice for the parent component to handle
    localStorage.setItem('promptType', 'generated');
    localStorage.setItem('selectedWritingType', textType);

    // Call the parent's callback to handle prompt generation
    onGeneratePrompt();
  };

  const handleCustomPrompt = () => {
    console.log('✏️ PromptOptionsModal: Custom prompt clicked for:', textType);

    // Store the choice for the parent component to handle
    localStorage.setItem('promptType', 'custom');
    localStorage.setItem('selectedWritingType', textType);

    // Call the parent's callback to handle custom prompt
    onCustomPrompt();
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full relative border border-slate-200 dark:border-gray-700">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:text-gray-400 dark:hover:text-gray-200 transition-colors bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-600 p-2 rounded-full z-10"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-8">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Wand className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              How would you like to get your {textType} writing prompt?
            </h2>
            <p className="text-slate-600 dark:text-gray-400 mt-2">
              Choose how you want to start your writing adventure today!
            </p>
          </div>

          <div className="space-y-4">
            {/* Magic Prompt Generator Button */}
            <button
              onClick={handleGeneratePrompt}
              disabled={isLoading}
              className={`w-full flex items-center p-4 rounded-xl transition-all duration-200 text-left group border-2 ${
                isLoading
                  ? 'bg-purple-100 dark:bg-purple-900/50 border-purple-400 dark:border-purple-600 cursor-not-allowed'
                  : 'bg-white dark:bg-gray-700 border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:shadow-lg'
              }`}
            >
              <div className="flex-shrink-0 mr-4">
                <div className={`p-3 rounded-lg transition-colors shadow-md ${
                  isLoading
                    ? 'bg-purple-500'
                    : 'bg-gradient-to-r from-purple-400 to-pink-400 group-hover:from-purple-500 group-hover:to-pink-500'
                }`}>
                  {isLoading ? (
                    <RotateCw className="w-6 h-6 text-white animate-spin" />
                  ) : (
                    <Sparkles className="w-6 h-6 text-white" />
                  )}
                </div>
              </div>
              <div className="flex-1">
                {isLoading ? (
                  <div className="flex items-center">
                    <h3 className="text-lg font-bold text-purple-600 dark:text-purple-400">
                      Generating prompt...
                    </h3>
                  </div>
                ) : (
                  <>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      Magic Prompt Generator
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-gray-400 mt-0.5">
                      Let our AI create an awesome {textType} prompt just for you!
                    </p>
                  </>
                )}
              </div>
              {!isLoading && (
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-purple-500 transition-colors ml-2" />
              )}
            </button>

            {/* Use My Own Idea Button */}
            <button
              onClick={handleCustomPrompt}
              disabled={isLoading}
              className={`w-full flex items-center p-4 rounded-xl transition-all duration-200 text-left group border-2 ${
                isLoading
                  ? 'bg-slate-100 dark:bg-gray-700/50 border-slate-300 dark:border-gray-600 cursor-not-allowed opacity-70'
                  : 'bg-white dark:bg-gray-700 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:shadow-lg'
              }`}
            >
              <div className="flex-shrink-0 mr-4">
                <div className="p-3 bg-gradient-to-r from-blue-400 to-teal-400 rounded-lg group-hover:from-blue-500 group-hover:to-teal-500 transition-colors shadow-md">
                  <Edit3 className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Use My Own Idea
                </h3>
                <p className="text-sm text-slate-600 dark:text-gray-400 mt-0.5">
                  Type in your own {textType} writing prompt or topic.
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors ml-2" />
            </button>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-start">
              <Star className="w-4 h-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                A good prompt will help you write an amazing {textType} story! Choose the option that sounds most exciting to you. Remember, there's no wrong choice - both will lead to great writing adventures!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
