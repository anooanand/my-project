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

export function ImprovedWritingTypeSelectionModal({ isOpen, onClose, onSelect }: WritingTypeSelectionModalProps) {
  const [selectedLevel, setSelectedLevel] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');
  const [showHelp, setShowHelp] = useState<string | null>(null);

  const writingTypes: WritingType[] = [
    {
      id: 'narrative',
      name: 'Story Writing',
      description: 'Write exciting stories with characters and adventures',
      icon: <BookOpen className="h-6 w-6" />,
      difficulty: 'Medium',
      isPopular: true,
      examples: ['Adventure stories', 'Fantasy tales', 'Mystery stories'],
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'persuasive',
      name: 'Convince & Persuade',
      description: 'Write to change someone\'s mind about something',
      icon: <MessageSquare className="h-6 w-6" />,
      difficulty: 'Hard',
      examples: ['Should kids have more recess?', 'Why we need to protect animals'],
      color: 'from-red-500 to-red-600'
    },
    {
      id: 'expository',
      name: 'Explain & Teach',
      description: 'Teach others about something you know well',
      icon: <FileText className="h-6 w-6" />,
      difficulty: 'Medium',
      examples: ['How to make your favorite snack', 'All about dinosaurs'],
      color: 'from-green-500 to-green-600'
    },
    {
      id: 'reflective',
      name: 'Personal Stories',
      description: 'Write about your own experiences and feelings',
      icon: <Heart className="h-6 w-6" />,
      difficulty: 'Easy',
      isPopular: true,
      examples: ['My best day ever', 'When I learned something new'],
      color: 'from-pink-500 to-pink-600'
    },
    {
      id: 'descriptive',
      name: 'Paint with Words',
      description: 'Describe places, people, or things in detail',
      icon: <Eye className="h-6 w-6" />,
      difficulty: 'Easy',
      examples: ['My favorite place', 'A person I admire'],
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: 'recount',
      name: 'Tell What Happened',
      description: 'Share events in the order they happened',
      icon: <Clock className="h-6 w-6" />,
      difficulty: 'Easy',
      examples: ['My school trip', 'A special celebration'],
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
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Choose Your Writing Type
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                What kind of writing do you want to do today?
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
            >
              <X className="h-6 w-6 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Filter Buttons - Improved visibility */}
          <div className="flex flex-wrap gap-2 mt-4">
            {['All', 'Easy', 'Medium', 'Hard'].map((level) => (
              <button
                key={level}
                onClick={() => setSelectedLevel(level as any)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  selectedLevel === level
                    ? 'bg-blue-500 text-white shadow-lg transform scale-105'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:scale-105'
                }`}
              >
                {level} Level
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTypes.map((type) => (
              <div
                key={type.id}
                onClick={() => onSelect(type.id)}
                className="kid-card kid-card-interactive relative p-5 cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:scale-102 border-2 border-transparent hover:border-blue-300"
              >
                {/* Popular Badge */}
                {type.isPopular && (
                  <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-900" />
                    Popular
                  </div>
                )}

                {/* Header with Icon and Title */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${type.color} text-white shadow-md mr-3`}>
                      {type.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {type.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        {/* Difficulty Stars */}
                        <div className="flex items-center gap-1">
                          {getDifficultyStars(type.difficulty)}
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getDifficultyColor(type.difficulty)}`}>
                          {type.difficulty}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Help Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowHelp(showHelp === type.id ? null : type.id);
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                  >
                    <HelpCircle className="h-4 w-4 text-gray-400" />
                  </button>
                </div>

                {/* Description */}
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 leading-relaxed">
                  {type.description}
                </p>

                {/* Examples - Show when help is clicked */}
                {showHelp === type.id && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-3">
                    <h4 className="text-sm font-semibold text-gray-800 dark:text-white mb-2">
                      Example topics:
                    </h4>
                    <ul className="space-y-1">
                      {type.examples.map((example, index) => (
                        <li key={index} className="text-sm text-gray-600 dark:text-gray-300 flex items-center">
                          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2"></span>
                          {example}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action Button */}
                <button className="w-full py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-600 transition-all transform hover:scale-105 shadow-md">
                  Choose This Type
                </button>
              </div>
            ))}
          </div>

          {/* No results message */}
          {filteredTypes.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No writing types found
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Try selecting a different difficulty level.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <HelpCircle className="h-4 w-4 mr-2" />
              Click the ? button for examples
            </div>
            <button
              onClick={onClose}
              className="kid-btn kid-btn-outline"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
