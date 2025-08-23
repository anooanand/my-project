import React, { useState } from 'react';
import { X, BookOpen, Lightbulb, MessageSquare, Megaphone, ScrollText, Sparkles, Newspaper, Mail, Calendar, Rocket, Puzzle, Wand, Compass, MapPin, Target, Mic, Search, Filter, Star, Heart, Zap, Crown, Gem, Edit3, Brain } from 'lucide-react';

interface WritingTypeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: string, customPrompt?: string) => void; // UPDATED: Added customPrompt parameter
}

const writingTypes = [
  { 
    value: 'narrative', 
    label: 'Narrative', 
    icon: Rocket, 
    description: 'Create exciting tales with heroes and twists!',
    color: 'from-blue-400 to-purple-500',
    bgColor: 'from-blue-50 to-purple-50',
    borderColor: 'border-blue-300',
    difficulty: 'Medium',
    popular: true
  },
  { 
    value: 'persuasive', 
    label: 'Persuasive', 
    icon: Megaphone, 
    description: 'Share your strong ideas and get others to agree!',
    color: 'from-orange-400 to-red-500',
    bgColor: 'from-orange-50 to-red-50',
    borderColor: 'border-orange-300',
    difficulty: 'Hard',
    popular: false
  },
  { 
    value: 'expository', 
    label: 'Expository / Informative', 
    icon: Lightbulb, 
    description: 'Teach others about cool topics with clear facts!',
    color: 'from-yellow-400 to-orange-500',
    bgColor: 'from-yellow-50 to-orange-50',
    borderColor: 'border-yellow-300',
    difficulty: 'Medium',
    popular: true
  },
  { 
    value: 'reflective', 
    label: 'Reflective', 
    icon: Sparkles, 
    description: 'Explore your own experiences and what you learned!',
    color: 'from-purple-400 to-pink-500',
    bgColor: 'from-purple-50 to-pink-50',
    borderColor: 'border-purple-300',
    difficulty: 'Easy',
    popular: false
  },
  { 
    value: 'descriptive', 
    label: 'Descriptive', 
    icon: Wand, 
    description: 'Use amazing words to describe people, places, and things!',
    color: 'from-green-400 to-teal-500',
    bgColor: 'from-green-50 to-teal-50',
    borderColor: 'border-green-300',
    difficulty: 'Easy',
    popular: true
  },
  { 
    value: 'recount', 
    label: 'Recount', 
    icon: Calendar, 
    description: 'Tell about events in the order they happened!',
    color: 'from-indigo-400 to-blue-500',
    bgColor: 'from-indigo-50 to-blue-50',
    borderColor: 'border-indigo-300',
    difficulty: 'Easy',
    popular: false
  },
  { 
    value: 'discursive', 
    label: 'Discursive', 
    icon: MessageSquare, 
    description: 'Look at different ideas about a topic, then share your view!',
    color: 'from-pink-400 to-rose-500',
    bgColor: 'from-pink-50 to-rose-50',
    borderColor: 'border-pink-300',
    difficulty: 'Hard',
    popular: false
  },
  { 
    value: 'news report', 
    label: 'News Report', 
    icon: Newspaper, 
    description: 'Report the facts like a real journalist!',
    color: 'from-gray-400 to-slate-500',
    bgColor: 'from-gray-50 to-slate-50',
    borderColor: 'border-gray-300',
    difficulty: 'Medium',
    popular: false
  },
  { 
    value: 'letter', 
    label: 'Letter', 
    icon: Mail, 
    description: 'Write a friendly note or an important message!',
    color: 'from-cyan-400 to-blue-500',
    bgColor: 'from-cyan-50 to-blue-50',
    borderColor: 'border-cyan-300',
    difficulty: 'Easy',
    popular: false
  },
  { 
    value: 'diary entry', 
    label: 'Diary Entry', 
    icon: BookOpen, 
    description: 'Write down your daily adventures and feelings!',
    color: 'from-emerald-400 to-green-500',
    bgColor: 'from-emerald-50 to-green-50',
    borderColor: 'border-emerald-300',
    difficulty: 'Easy',
    popular: false
  },
  { 
    value: 'speech', 
    label: 'Speech', 
    icon: Mic, 
    description: 'Deliver a powerful speech to inspire and engage your audience!',
    color: 'from-violet-400 to-purple-500',
    bgColor: 'from-violet-50 to-purple-50',
    borderColor: 'border-violet-300',
    difficulty: 'Hard',
    popular: false
  }
];

export function WritingTypeSelectionModal({ isOpen, onClose, onSelect }: WritingTypeSelectionModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [showPopularOnly, setShowPopularOnly] = useState(false);
  const [showCustomPrompt, setShowCustomPrompt] = useState(false); // NEW: State for custom prompt modal
  const [customPrompt, setCustomPrompt] = useState(''); // NEW: State for custom prompt text

  if (!isOpen) return null;

  const filteredTypes = writingTypes.filter(type => {
    const matchesSearch = type.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         type.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = selectedDifficulty === 'All' || type.difficulty === selectedDifficulty;
    const matchesPopular = !showPopularOnly || type.popular;
    
    return matchesSearch && matchesDifficulty && matchesPopular;
  });

  // FIXED: Proper click handler that calls onSelect
  const handleTypeSelect = (type: string) => {
    console.log('🎯 WritingTypeSelectionModal: Type selected:', type);
    
    // Store in localStorage for persistence
    localStorage.setItem('selectedWritingType', type);
    
    // Call the parent's onSelect callback
    onSelect(type);
    
    // Close the modal
    onClose();
  };

  // NEW: Handler for custom prompt option
  const handleCustomPromptSelect = () => {
    setShowCustomPrompt(true);
  };

  // NEW: Handler for submitting custom prompt
  const handleCustomPromptSubmit = () => {
    if (customPrompt.trim()) {
      console.log('🎯 WritingTypeSelectionModal: Custom prompt selected:', customPrompt);
      
      // Store in localStorage for persistence
      localStorage.setItem('selectedWritingType', 'custom');
      localStorage.setItem('customWritingPrompt', customPrompt);
      
      // Call the parent's onSelect callback with custom prompt
      onSelect('custom', customPrompt);
      
      // Close the modal
      onClose();
      setShowCustomPrompt(false);
      setCustomPrompt('');
    }
  };

  // NEW: Handler for canceling custom prompt
  const handleCustomPromptCancel = () => {
    setShowCustomPrompt(false);
    setCustomPrompt('');
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-600 bg-green-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'Hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // NEW: Custom Prompt Modal
  if (showCustomPrompt) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-2xl w-full border-4 border-teal-300 dark:border-teal-700 relative">
          
          {/* Custom Prompt Header */}
          <div className="bg-gradient-to-r from-teal-100 via-blue-100 to-purple-100 dark:from-teal-900/30 dark:via-blue-900/30 dark:to-purple-900/30 p-8 border-b-4 border-teal-300 dark:border-teal-700 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-16 h-16 bg-gradient-to-r from-teal-500 via-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-6 shadow-2xl animate-pulse">
                  <Edit3 className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-600 via-blue-600 to-purple-600 dark:from-teal-400 dark:via-blue-400 dark:to-purple-400 mb-2">
                    Use My Own Idea 🧠
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300 text-lg font-medium">
                    Type in your own narrative writing prompt or topic. Great for when you have a specific idea!
                  </p>
                </div>
              </div>
              <button
                onClick={handleCustomPromptCancel}
                className="p-3 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors shadow-lg hover:shadow-xl transform hover:scale-110"
              >
                <X className="h-8 w-8 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
          </div>

          {/* Custom Prompt Input */}
          <div className="p-8">
            <div className="mb-6">
              <label className="block text-lg font-bold text-gray-800 dark:text-white mb-3">
                Your Writing Prompt:
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Write your own creative writing prompt here... For example: 'Write a story about a magical library where books come to life at midnight' or 'Describe your perfect adventure day with your best friend'"
                className="w-full h-32 p-4 border-2 border-gray-300 rounded-2xl focus:border-teal-500 focus:outline-none text-lg font-medium shadow-lg resize-none"
                maxLength={500}
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-sm text-gray-500">
                  Be creative! This is your chance to write about exactly what interests you.
                </p>
                <span className="text-sm text-gray-400">
                  {customPrompt.length}/500
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-end">
              <button
                onClick={handleCustomPromptCancel}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-colors shadow-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCustomPromptSubmit}
                disabled={!customPrompt.trim()}
                className={`px-8 py-3 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2 ${
                  customPrompt.trim()
                    ? 'bg-gradient-to-r from-teal-500 to-blue-500 text-white hover:from-teal-600 hover:to-blue-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Brain className="h-5 w-5" />
                Start Writing!
              </button>
            </div>
          </div>

          {/* Tip Section */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-6 border-t-2 border-gray-200 dark:border-gray-600 rounded-b-3xl">
            <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
              <Star className="h-5 w-5 text-yellow-500" />
              <span className="font-medium text-base">
                <strong>Tip:</strong> A good prompt will help you write an amazing narrative story! Choose the option that sounds most exciting to you. Remember, there's no wrong choice - both will lead to great writing adventures!
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden border-4 border-blue-300 dark:border-blue-700 relative">
        
        {/* Floating Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-20 h-20 bg-yellow-200 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute top-20 right-20 w-16 h-16 bg-pink-200 rounded-full opacity-30 animate-bounce"></div>
          <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-purple-200 rounded-full opacity-15 animate-pulse"></div>
          <div className="absolute bottom-10 right-1/3 w-18 h-18 bg-green-200 rounded-full opacity-25 animate-bounce"></div>
        </div>

        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 dark:from-blue-900/30 dark:via-purple-900/30 dark:to-pink-900/30 p-8 border-b-4 border-blue-300 dark:border-blue-700 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-6 shadow-2xl animate-pulse">
                  <Rocket className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                  <Crown className="h-4 w-4 text-white" />
                </div>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 mb-2">
                  How would you like to get your narrative writing prompt?
                </h2>
                <p className="text-gray-700 dark:text-gray-300 text-lg font-medium">
                  Choose how you want to start your writing adventure today!
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-3 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors shadow-lg hover:shadow-xl transform hover:scale-110"
            >
              <X className="h-8 w-8 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        </div>

        {/* NEW: Prompt Selection Options */}
        <div className="p-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            
            {/* Magic Prompt Generator Option */}
            <button
              onClick={() => handleTypeSelect('narrative')}
              className="relative p-8 border-4 border-purple-300 rounded-3xl hover:border-purple-400 bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-2xl transition-all duration-300 text-left group transform hover:scale-105 overflow-hidden"
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500 rounded-full -mr-10 -mt-10"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-pink-500 rounded-full -ml-8 -mb-8"></div>
              </div>

              {/* Icon and Title */}
              <div className="flex items-center gap-4 mb-4 relative z-10">
                <div className="p-4 bg-gradient-to-r from-purple-400 to-pink-500 rounded-2xl group-hover:scale-110 transition-transform shadow-xl">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-2xl text-gray-900 dark:text-white mb-2">Magic Prompt Generator</h3>
                  <div className="inline-block px-3 py-1 rounded-full text-sm font-bold bg-purple-100 text-purple-600">
                    ✨
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-lg text-gray-700 dark:text-gray-300 font-medium leading-relaxed relative z-10">
                Let our AI create an awesome narrative prompt just for you! Perfect for getting started quickly.
              </p>

              {/* Hover Effect Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl"></div>
            </button>

            {/* Use My Own Idea Option */}
            <button
              onClick={handleCustomPromptSelect}
              className="relative p-8 border-4 border-teal-300 rounded-3xl hover:border-teal-400 bg-gradient-to-br from-teal-50 to-blue-50 hover:shadow-2xl transition-all duration-300 text-left group transform hover:scale-105 overflow-hidden border-blue-400"
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute top-0 right-0 w-20 h-20 bg-teal-500 rounded-full -mr-10 -mt-10"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-blue-500 rounded-full -ml-8 -mb-8"></div>
              </div>

              {/* Icon and Title */}
              <div className="flex items-center gap-4 mb-4 relative z-10">
                <div className="p-4 bg-gradient-to-r from-teal-400 to-blue-500 rounded-2xl group-hover:scale-110 transition-transform shadow-xl">
                  <Edit3 className="w-10 h-10 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-2xl text-gray-900 dark:text-white mb-2">Use My Own Idea 🧠</h3>
                  <div className="inline-block px-3 py-1 rounded-full text-sm font-bold bg-teal-100 text-teal-600">
                    Selected
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-lg text-gray-700 dark:text-gray-300 font-medium leading-relaxed relative z-10">
                Type in your own narrative writing prompt or topic. Great for when you have a specific idea!
              </p>

              {/* Hover Effect Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl"></div>
            </button>
          </div>
        </div>

        {/* Tip Section */}
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-6 border-t-2 border-gray-200 dark:border-gray-600 relative z-10">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
              <Star className="h-5 w-5 text-yellow-500 animate-pulse" />
              <span className="font-medium text-lg">
                <strong>A good prompt will help you write an amazing narrative story!</strong> Choose the option that sounds most exciting to you. Remember, there's no wrong choice - both will lead to great writing adventures!
              </span>
              <Gem className="h-5 w-5 text-purple-500 animate-pulse" />
            </div>
          </div>
          
          {/* Debug Info */}
          <div className="mt-4 p-4 bg-blue-100 dark:bg-blue-900/20 rounded-2xl border-2 border-blue-200 dark:border-blue-700">
            <div className="flex items-center gap-2 mb-2">
              <Search className="h-4 w-4 text-blue-600" />
              <span className="font-bold text-blue-800 dark:text-blue-300">Debug Info:</span>
            </div>
            <p className="text-blue-700 dark:text-blue-300 text-sm">
              <strong>Text Type:</strong> narrative
            </p>
            <p className="text-blue-700 dark:text-blue-300 text-sm">
              <strong>Mode:</strong> Prompt Selection Mode
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
