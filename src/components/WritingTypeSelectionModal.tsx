import React, { useState } from 'react';
import { X, BookOpen, MessageSquare, FileText, Heart, Eye, Clock, Star, HelpCircle } from 'lucide-react';

interface WritingTypeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: string) => void;
}

interface WritingType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  isPopular?: boolean;
  examples: string[];
  color: string;
}

export function WritingTypeSelectionModal({ isOpen, onClose, onSelect }: WritingTypeSelectionModalProps) {
  const [selectedLevel, setSelectedLevel] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');
  const [showHelp, setShowHelp] = useState<string | null>(null);

  const writingTypes: WritingType[] = [
    {
      id: 'narrative',
      name: 'Narrative Writing',
      description: 'Tell stories with characters, settings, and exciting events',
      icon: <BookOpen className="h-5 w-5" />,
      difficulty: 'Medium',
      isPopular: true,
      examples: ['Adventure stories', 'Fantasy tales', 'Mystery stories', 'Personal experiences'],
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'persuasive',
      name: 'Persuasive Writing',
      description: 'Convince readers to agree with your point of view',
      icon: <MessageSquare className="h-5 w-5" />,
      difficulty: 'Hard',
      examples: ['Should kids have more recess?', 'Why we need to protect animals', 'Best pet to have'],
      color: 'from-red-500 to-red-600'
    },
    {
      id: 'expository',
      name: 'Expository Writing',
      description: 'Explain or inform readers about a topic',
      icon: <FileText className="h-5 w-5" />,
      difficulty: 'Medium',
      examples: ['How to make your favorite snack', 'All about dinosaurs', 'How plants grow'],
      color: 'from-green-500 to-green-600'
    },
    {
      id: 'reflective',
      name: 'Reflective Writing',
      description: 'Think deeply about your experiences and what you learned',
      icon: <Heart className="h-5 w-5" />,
      difficulty: 'Easy',
      isPopular: true,
      examples: ['My best day ever', 'When I learned something new', 'A time I was brave'],
      color: 'from-pink-500 to-pink-600'
    },
    {
      id: 'descriptive',
      name: 'Descriptive Writing',
      description: 'Paint pictures with words using lots of details',
      icon: <Eye className="h-5 w-5" />,
      difficulty: 'Easy',
      examples: ['My favorite place', 'A person I admire', 'The perfect day'],
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: 'recount',
      name: 'Recount Writing',
      description: 'Tell about events in the order they happened',
      icon: <Clock className="h-5 w-5" />,
      difficulty: 'Easy',
      examples: ['My school trip', 'A special celebration', 'What I did on the weekend'],
      color: 'from-orange-500 to-orange-600'
    }
  ];

  const filteredTypes = selectedLevel === 'All' 
    ? writingTypes 
    : writingTypes.filter(type => type.difficulty === selectedLevel);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800 border-green-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Hard': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDifficultyStars = (difficulty: string) => {
    const count = difficulty === 'Easy' ? 1 : difficulty === 'Medium' ? 2 : 3;
    return Array.from({ length: 3 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-3 w-3 ${i < count ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
      />
    ));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        
        {/* Header - Improved for kids */}
        <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Choose Your Writing Type
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                What kind of writing do you want to do today?
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Filter Buttons - Smaller and cleaner */}
          <div className="flex flex-wrap gap-2 mt-4">
            {['All', 'Easy', 'Medium', 'Hard'].map((level) => (
              <button
                key={level}
                onClick={() => setSelectedLevel(level as any)}
                className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${
                  selectedLevel === level
                    ? 'bg-blue-500 text-white shadow-md transform scale-105'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:scale-105'
                }`}
              >
                {level} Level
              </button>
            ))}
          </div>
        </div>

        {/* Content - Improved spacing and sizing */}
        <div className="p-5 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTypes.map((type) => (
              <div
                key={type.id}
                onClick={() => onSelect(type.id)}
                className="relative p-4 cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:scale-102 border-2 border-transparent hover:border-blue-300 bg-white dark:bg-gray-800 rounded-xl shadow-sm"
              >
                {/* Popular Badge - Smaller and better positioned */}
                {type.isPopular && (
                  <div className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full text-xs font-bold shadow-md flex items-center gap-1">
                    <Star className="h-2.5 w-2.5 fill-yellow-900" />
                    Popular
                  </div>
                )}

                {/* Header with Icon and Title - Reduced sizes */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <div className={`p-2.5 rounded-lg bg-gradient-to-r ${type.color} text-white shadow-sm mr-3`}>
                      {type.icon}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900 dark:text-white">
                        {type.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        {/* Difficulty Stars - Smaller */}
                        <div className="flex items-center gap-0.5">
                          {getDifficultyStars(type.difficulty)}
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getDifficultyColor(type.difficulty)}`}>
                          {type.difficulty}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Help Button - Smaller */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowHelp(showHelp === type.id ? null : type.id);
                    }}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                  >
                    <HelpCircle className="h-3.5 w-3.5 text-gray-400" />
                  </button>
                </div>

                {/* Description - Smaller text */}
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 leading-relaxed">
                  {type.description}
                </p>

                {/* Examples - Show when help is clicked */}
                {showHelp === type.id && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-3">
                    <h4 className="text-xs font-semibold text-gray-800 dark:text-white mb-2">
                      Example topics:
                    </h4>
                    <ul className="space-y-1">
                      {type.examples.map((example, index) => (
                        <li key={index} className="text-xs text-gray-600 dark:text-gray-300 flex items-center">
                          <span className="w-1 h-1 bg-blue-400 rounded-full mr-2"></span>
                          {example}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action Button - Smaller */}
                <button className="w-full py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-600 transition-all transform hover:scale-105 shadow-sm text-sm">
                  Choose This Type
                </button>
              </div>
            ))}
          </div>

          {/* No results message */}
          {filteredTypes.length === 0 && (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                No writing types found
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Try selecting a different difficulty level.
              </p>
            </div>
          )}
        </div>

        {/* Footer - Smaller */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
              <HelpCircle className="h-3 w-3 mr-1" />
              Click the ? button for examples
            </div>
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-gray-200 text-gray-800 rounded-full font-semibold text-sm shadow-sm hover:bg-gray-300 transition-colors transform hover:scale-105"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
