import React, { useState, useEffect } from 'react';
import { X, Sparkles, Edit3, Wand, Star, Zap, Clock, TrendingUp, Filter, Search, Award, Target, BookOpen, Lightbulb, ChevronRight, Timer, BarChart3 } from 'lucide-react';

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
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedTime: string;
  category: 'Quick Start' | 'Custom Prompts' | 'Practice by Topic';
  isPopular?: boolean;
  isRecentlyUsed?: boolean;
  preview?: string;
  successTip?: string;
}

export function PromptOptionsModal({
  isOpen,
  onClose,
  onGeneratePrompt,
  onCustomPrompt,
  textType
}: PromptOptionsModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);
  const [showSuccessTips, setShowSuccessTips] = useState(false);
  const [confidenceLevel, setConfidenceLevel] = useState(3);

  const promptOptions: PromptOption[] = [
    {
      id: 'magic-generator',
      title: 'Magic Prompt Generator',
      description: 'Let our AI create an awesome prompt just for you! Perfect for getting started quickly.',
      icon: <Sparkles className="h-6 w-6" />,
      difficulty: 'Beginner',
      estimatedTime: '2-3 mins',
      category: 'Quick Start',
      isPopular: true,
      preview: 'AI will generate a creative, engaging prompt tailored to your skill level and interests.',
      successTip: 'Great for overcoming writer\'s block and discovering new ideas!'
    },
    {
      id: 'custom-idea',
      title: 'Use My Own Idea',
      description: 'Type in your own writing prompt or topic. Great for when you have a specific idea!',
      icon: <Edit3 className="h-6 w-6" />,
      difficulty: 'Intermediate',
      estimatedTime: '1-2 mins',
      category: 'Custom Prompts',
      preview: 'Enter your own creative prompt and get structured guidance to develop it.',
      successTip: 'Perfect when you have inspiration and want to explore it deeply!'
    },
    {
      id: 'exam-practice',
      title: 'NSW Exam Practice',
      description: 'Practice with real exam-style prompts from previous years.',
      icon: <Target className="h-6 w-6" />,
      difficulty: 'Advanced',
      estimatedTime: '5-10 mins',
      category: 'Practice by Topic',
      isRecentlyUsed: true,
      preview: 'Authentic exam prompts with marking criteria and time constraints.',
      successTip: 'Build confidence with real exam conditions and feedback!'
    },
    {
      id: 'skill-builder',
      title: 'Skill Builder Prompts',
      description: 'Focus on specific writing techniques and skills.',
      icon: <TrendingUp className="h-6 w-6" />,
      difficulty: 'Intermediate',
      estimatedTime: '3-5 mins',
      category: 'Practice by Topic',
      preview: 'Targeted prompts to improve specific areas like character development or persuasive techniques.',
      successTip: 'Perfect for strengthening particular writing skills!'
    },
    {
      id: 'creative-challenge',
      title: 'Creative Challenge',
      description: 'Fun, imaginative prompts to spark creativity.',
      icon: <Lightbulb className="h-6 w-6" />,
      difficulty: 'Beginner',
      estimatedTime: '4-6 mins',
      category: 'Quick Start',
      isPopular: true,
      preview: 'Unique, engaging scenarios designed to inspire creative thinking.',
      successTip: 'Great for building confidence and enjoying the writing process!'
    },
    {
      id: 'guided-structure',
      title: 'Guided Structure',
      description: 'Step-by-step prompts with built-in planning support.',
      icon: <BookOpen className="h-6 w-6" />,
      difficulty: 'Beginner',
      estimatedTime: '6-8 mins',
      category: 'Quick Start',
      preview: 'Structured prompts with planning templates and writing scaffolds.',
      successTip: 'Excellent for learning proper essay structure and organization!'
    }
  ];

  const categories = ['all', 'Quick Start', 'Custom Prompts', 'Practice by Topic'];
  const difficultyColors = {
    'Beginner': 'bg-green-100 text-green-800 border-green-200',
    'Intermediate': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Advanced': 'bg-red-100 text-red-800 border-red-200'
  };

  const filteredOptions = promptOptions.filter(option => {
    const matchesCategory = selectedCategory === 'all' || option.category === selectedCategory;
    const matchesSearch = option.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         option.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleOptionClick = (optionId: string) => {
    if (optionId === 'magic-generator') {
      onGeneratePrompt();
    } else if (optionId === 'custom-idea') {
      onCustomPrompt();
    } else {
      // Handle other options
      onGeneratePrompt();
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
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700 animate-in slide-in-from-bottom-4 duration-500">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 p-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-indigo-600/20 backdrop-blur-sm"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <Wand className="h-6 w-6 text-white" />
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

        {/* Filters and Search */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    selectedCategory === category
                      ? 'bg-purple-600 text-white shadow-lg scale-105'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                  }`}
                >
                  {category === 'all' ? 'All Options' : category}
                </button>
              ))}
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search prompts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          {/* Confidence Meter */}
          <div className="mt-4 p-4 bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">How confident do you feel about {textType} writing?</span>
              <span className="text-sm text-purple-600 dark:text-purple-400 font-semibold">
                {confidenceLevel === 1 ? 'Just starting' : 
                 confidenceLevel === 2 ? 'Getting there' :
                 confidenceLevel === 3 ? 'Pretty good' :
                 confidenceLevel === 4 ? 'Very confident' : 'Expert level'}
              </span>
            </div>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  onClick={() => setConfidenceLevel(level)}
                  className={`flex-1 h-2 rounded-full transition-all duration-200 ${
                    level <= confidenceLevel 
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500' 
                      : 'bg-gray-200 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredOptions.map((option) => (
              <div
                key={option.id}
                onClick={() => handleOptionClick(option.id)}
                onMouseEnter={() => setHoveredOption(option.id)}
                onMouseLeave={() => setHoveredOption(null)}
                className="relative group cursor-pointer p-6 bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-300 hover:shadow-xl hover:scale-105 transform"
              >
                {/* Badges */}
                <div className="absolute top-3 right-3 flex flex-col gap-1">
                  {option.isPopular && (
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                      <Star className="h-3 w-3 fill-current" />
                      Popular
                    </div>
                  )}
                  {option.isRecentlyUsed && (
                    <div className="bg-gradient-to-r from-green-400 to-emerald-400 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                      <Clock className="h-3 w-3" />
                      Recent
                    </div>
                  )}
                </div>

                {/* Icon and Title */}
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

                {/* Metadata */}
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
                  <div className="flex items-center space-x-1 text-purple-600 dark:text-purple-400">
                    <BarChart3 className="h-4 w-4" />
                    <span className="text-xs font-medium">{option.category}</span>
                  </div>
                </div>

                {/* Preview on Hover */}
                {hoveredOption === option.id && option.preview && (
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600/95 to-blue-600/95 rounded-2xl p-6 flex flex-col justify-center text-white backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="text-center">
                      <h4 className="font-bold mb-2">Preview</h4>
                      <p className="text-sm mb-3 opacity-90">{option.preview}</p>
                      {option.successTip && (
                        <div className="bg-white/20 rounded-lg p-3 backdrop-blur-sm">
                          <div className="flex items-center space-x-2 mb-1">
                            <Lightbulb className="h-4 w-4" />
                            <span className="text-xs font-semibold">Success Tip</span>
                          </div>
                          <p className="text-xs opacity-90">{option.successTip}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <button className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2">
                  <span>Choose This Option</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Success Tips Section */}
          <div className="mt-8">
            <button
              onClick={() => setShowSuccessTips(!showSuccessTips)}
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-xl border border-amber-200 dark:border-amber-800 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center space-x-3">
                <Award className="h-5 w-5 text-amber-600" />
                <span className="font-semibold text-amber-800 dark:text-amber-200">Writing Success Tips</span>
              </div>
              <ChevronRight className={`h-5 w-5 text-amber-600 transition-transform duration-200 ${showSuccessTips ? 'rotate-90' : ''}`} />
            </button>
            
            {showSuccessTips && (
              <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 animate-in slide-in-from-top-2 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-start space-x-2">
                    <Target className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-gray-900 dark:text-white">Start with planning:</span>
                      <span className="text-gray-600 dark:text-gray-300"> Spend 2-3 minutes organizing your ideas before writing.</span>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Zap className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-gray-900 dark:text-white">Use strong openings:</span>
                      <span className="text-gray-600 dark:text-gray-300"> Hook your reader with an interesting first sentence.</span>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <BookOpen className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-gray-900 dark:text-white">Show, don't tell:</span>
                      <span className="text-gray-600 dark:text-gray-300"> Use specific details and examples to make your writing vivid.</span>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <TrendingUp className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-gray-900 dark:text-white">Practice regularly:</span>
                      <span className="text-gray-600 dark:text-gray-300"> Consistent practice leads to significant improvement.</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <Lightbulb className="h-4 w-4" />
                <span>Hover over options for previews</span>
              </div>
              <div className="flex items-center space-x-1">
                <Award className="h-4 w-4" />
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