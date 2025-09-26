import React, { useState } from 'react';
import { X, BookOpen, MessageSquare, FileText, Heart, Eye, Clock, Star, HelpCircle, Sparkles, PenTool, Search } from 'lucide-react';

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
  bgGradient: string;
}

export function WritingTypeSelectionModal({ isOpen, onClose, onSelect }: WritingTypeSelectionModalProps) {
  const [showHelp, setShowHelp] = useState<string | null>(null);

  const writingTypes: WritingType[] = [
    {
      id: 'narrative',
      name: 'Narrative Writing',
      description: 'Tell stories with characters, settings, and exciting events',
      icon: <BookOpen className="h-6 w-6" />,
      difficulty: 'Medium',
      isPopular: true,
      examples: ['Adventure stories', 'Fantasy tales', 'Mystery stories', 'Personal experiences'],
      color: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-blue-100'
    },
    {
      id: 'reflective',
      name: 'Reflective Writing',
      description: 'Think deeply about your experiences and what you learned',
      icon: <Heart className="h-6 w-6" />,
      difficulty: 'Easy',
      isPopular: true,
      examples: ['My best day ever', 'When I learned something new', 'A time I was brave'],
      color: 'from-pink-500 to-pink-600',
      bgGradient: 'from-pink-50 to-pink-100'
    },
    {
      id: 'descriptive',
      name: 'Descriptive Writing',
      description: 'Paint pictures with words using lots of details',
      icon: <Eye className="h-6 w-6" />,
      difficulty: 'Easy',
      examples: ['My favorite place', 'A person I admire', 'The perfect day'],
      color: 'from-purple-500 to-purple-600',
      bgGradient: 'from-purple-50 to-purple-100'
    },
    {
      id: 'recount',
      name: 'Recount Writing',
      description: 'Tell about events in the order they happened',
      icon: <Clock className="h-6 w-6" />,
      difficulty: 'Easy',
      examples: ['My school trip', 'A special celebration', 'What I did on the weekend'],
      color: 'from-orange-500 to-orange-600',
      bgGradient: 'from-orange-50 to-orange-100'
    },
    {
      id: 'creative',
      name: 'Creative Writing',
      description: 'Express thoughts and feelings in an imaginative way',
      icon: <Sparkles className="h-6 w-6" />,
      difficulty: 'Medium',
      examples: ['Poems', 'Song lyrics', 'Short stories'],
      color: 'from-yellow-500 to-yellow-600',
      bgGradient: 'from-yellow-50 to-yellow-100'
    },
    {
      id: 'diary-entry',
      name: 'Diary Entry',
      description: 'Write about personal experiences, thoughts, and feelings in chronological order',
      icon: <PenTool className="h-6 w-6" />,
      difficulty: 'Easy',
      examples: ['A day in my life', 'My thoughts on a new experience', 'A special event'],
      color: 'from-indigo-500 to-indigo-600',
      bgGradient: 'from-indigo-50 to-indigo-100'
    },
    {
      id: 'expository',
      name: 'Expository Writing',
      description: 'Explain or inform readers about a topic',
      icon: <FileText className="h-6 w-6" />,
      difficulty: 'Medium',
      examples: ['How to make your favorite snack', 'All about dinosaurs', 'How plants grow'],
      color: 'from-green-500 to-green-600',
      bgGradient: 'from-green-50 to-green-100'
    },
    {
      id: 'newspaper-report',
      name: 'Newspaper Report',
      description: 'Report factual information about an event or topic in a clear and objective manner',
      icon: <FileText className="h-6 w-6" />,
      difficulty: 'Medium',
      examples: ['School sports day report', 'Local community event', 'Science fair results'],
      color: 'from-slate-500 to-slate-600',
      bgGradient: 'from-slate-50 to-slate-100'
    },
    {
      id: 'persuasive',
      name: 'Persuasive Writing',
      description: 'Convince readers to agree with your point of view',
      icon: <MessageSquare className="h-6 w-6" />,
      difficulty: 'Hard',
      examples: ['Should kids have more recess?', 'Why we need to protect animals', 'Best pet to have'],
      color: 'from-red-500 to-red-600',
      bgGradient: 'from-red-50 to-red-100'
    },
    {
      id: 'technical',
      name: 'Technical Writing',
      description: 'Provide clear, concise, and accurate information about a specific subject',
      icon: <FileText className="h-6 w-6" />,
      difficulty: 'Hard',
      examples: ['Instruction manuals', 'User guides', 'Scientific reports'],
      color: 'from-gray-600 to-gray-700',
      bgGradient: 'from-gray-50 to-gray-100'
    },
    {
      id: 'analytical',
      name: 'Analytical Writing',
      description: 'Examine and evaluate information, presenting a reasoned argument or interpretation',
      icon: <Search className="h-6 w-6" />,
      difficulty: 'Hard',
      examples: ['Literary analysis', 'Argumentative essays', 'Research papers'],
      color: 'from-teal-500 to-teal-600',
      bgGradient: 'from-teal-50 to-teal-100'
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Hard': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getDifficultyStars = (difficulty: string) => {
    const count = difficulty === 'Easy' ? 1 : difficulty === 'Medium' ? 2 : 3;
    return Array.from({ length: 3 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-4 w-4 ${i < count ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} 
      />
    ));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden border border-gray-100">
        
        {/* Header */}
        <div className="relative p-8 bg-gradient-to-r from-slate-50 via-blue-50 to-purple-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                Choose Your Writing Type
              </h2>
              <p className="text-gray-600 text-lg font-medium">
                What kind of writing do you want to do today?
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-3 hover:bg-white/80 rounded-xl transition-all duration-200 group"
            >
              <X className="h-6 w-6 text-gray-500 group-hover:text-gray-700" />
            </button>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-4 right-20 w-20 h-20 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-xl"></div>
          <div className="absolute bottom-4 left-20 w-16 h-16 bg-gradient-to-br from-pink-200/30 to-orange-200/30 rounded-full blur-xl"></div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(95vh-200px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {writingTypes.map((type) => (
              <div
                key={type.id}
                onClick={() => onSelect(type.id)}
                className={`group relative p-6 cursor-pointer rounded-2xl border-2 border-transparent hover:border-blue-200 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl bg-gradient-to-br ${type.bgGradient} hover:shadow-blue-100/50`}
              >
                {/* Popular Badge */}
                {type.isPopular && (
                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-400 to-orange-400 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1 z-10">
                    <Star className="h-3 w-3 fill-white" />
                    Popular
                  </div>
                )}

                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${type.color} text-white shadow-lg group-hover:shadow-xl transition-shadow duration-300`}>
                      {type.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-700 transition-colors">
                        {type.name}
                      </h3>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          {getDifficultyStars(type.difficulty)}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getDifficultyColor(type.difficulty)}`}>
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
                    className="p-2 hover:bg-white/80 rounded-lg transition-colors group/help"
                  >
                    <HelpCircle className="h-5 w-5 text-gray-400 group-hover/help:text-blue-500" />
                  </button>
                </div>

                {/* Description */}
                <p className="text-gray-700 text-sm leading-relaxed mb-4 font-medium">
                  {type.description}
                </p>

                {/* Examples */}
                {showHelp === type.id && (
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 mb-4 border border-white/50">
                    <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-blue-500" />
                      Example topics:
                    </h4>
                    <ul className="space-y-2">
                      {type.examples.map((example, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-center font-medium">
                          <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mr-3 flex-shrink-0"></div>
                          {example}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action Button */}
                <button className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-300 transform group-hover:scale-105 shadow-lg hover:shadow-xl text-sm">
                  Choose This Type
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-600 font-medium">
              <HelpCircle className="h-4 w-4 mr-2 text-blue-500" />
              Click the help icon for examples and tips
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold text-sm transition-colors duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
