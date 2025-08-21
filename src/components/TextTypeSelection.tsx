import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Scroll, MessageSquare, FileText, Lightbulb, Target, ArrowLeft, Sparkles } from 'lucide-react';

interface TextType {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  prompts: string[];
}

const textTypes: TextType[] = [
  {
    id: 'narrative',
    title: 'Narrative',
    description: 'Tell engaging stories with characters, plot, and setting',
    icon: <BookOpen className="h-8 w-8" />,
    color: 'from-purple-500 to-pink-500',
    prompts: [
      'Magical Prompt',
      'Adventure Story',
      'Mystery Tale',
      'Friendship Story',
      'Time Travel Adventure',
      'Animal Story'
    ]
  },
  {
    id: 'persuasive',
    title: 'Persuasive',
    description: 'Convince readers with strong arguments and evidence',
    icon: <Target className="h-8 w-8" />,
    color: 'from-blue-500 to-teal-500',
    prompts: [
      'School Uniform Debate',
      'Technology in Schools',
      'Environmental Protection',
      'Sports vs Studies',
      'Healthy Eating',
      'Social Media Impact'
    ]
  },
  {
    id: 'informative',
    title: 'Informative',
    description: 'Share knowledge and explain topics clearly',
    icon: <Lightbulb className="h-8 w-8" />,
    color: 'from-green-500 to-emerald-500',
    prompts: [
      'How Things Work',
      'Historical Events',
      'Science Discoveries',
      'Cultural Traditions',
      'Amazing Animals',
      'Space Exploration'
    ]
  },
  {
    id: 'descriptive',
    title: 'Descriptive',
    description: 'Paint vivid pictures with detailed descriptions',
    icon: <Scroll className="h-8 w-8" />,
    color: 'from-orange-500 to-red-500',
    prompts: [
      'Dream Destination',
      'Perfect Day',
      'Favorite Place',
      'Seasonal Scene',
      'Character Portrait',
      'Memory Lane'
    ]
  },
  {
    id: 'creative',
    title: 'Creative Writing',
    description: 'Express imagination through poetry and creative forms',
    icon: <Sparkles className="h-8 w-8" />,
    color: 'from-indigo-500 to-purple-500',
    prompts: [
      'Poetry Corner',
      'Song Lyrics',
      'Creative Dialogue',
      'Flash Fiction',
      'Character Monologue',
      'Stream of Consciousness'
    ]
  },
  {
    id: 'review',
    title: 'Review',
    description: 'Evaluate and critique books, movies, or experiences',
    icon: <MessageSquare className="h-8 w-8" />,
    color: 'from-cyan-500 to-blue-500',
    prompts: [
      'Book Review',
      'Movie Review',
      'Game Review',
      'Restaurant Review',
      'App Review',
      'Experience Review'
    ]
  }
];

export default function TextTypeSelection() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<TextType | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<string>('');

  const handleTypeSelect = (textType: TextType) => {
    setSelectedType(textType);
    setSelectedPrompt('');
  };

  const handlePromptSelect = (prompt: string) => {
    setSelectedPrompt(prompt);
  };

  const handleStartWriting = () => {
    if (selectedType && selectedPrompt) {
      // Navigate to the writing interface with the selected type and prompt
      navigate('/write/editor', {
        state: {
          textType: selectedType.id,
          textTypeTitle: selectedType.title,
          prompt: selectedPrompt
        }
      });
    }
  };

  const handleBack = () => {
    if (selectedType) {
      setSelectedType(null);
      setSelectedPrompt('');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={handleBack}
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back</span>
          </button>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-green-600 bg-clip-text text-transparent mb-4">
            {selectedType ? `Choose Your ${selectedType.title} Prompt` : 'Choose Your Writing Style'}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            {selectedType 
              ? `Pick a ${selectedType.title.toLowerCase()} prompt that inspires you!`
              : 'What type of writing would you like to create today?'
            }
          </p>
        </div>

        {!selectedType ? (
          /* Text Type Selection */
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {textTypes.map((textType) => (
              <div
                key={textType.id}
                onClick={() => handleTypeSelect(textType)}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 border border-gray-200 dark:border-gray-700"
              >
                <div className={`w-16 h-16 bg-gradient-to-r ${textType.color} rounded-xl flex items-center justify-center text-white mb-4 mx-auto`}>
                  {textType.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">
                  {textType.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-center text-sm">
                  {textType.description}
                </p>
                <div className="mt-4 text-center">
                  <span className="text-xs text-gray-500 dark:text-gray-500">
                    {textType.prompts.length} prompts available
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Prompt Selection */
          <div className="max-w-4xl mx-auto">
            <div className={`bg-gradient-to-r ${selectedType.color} rounded-2xl p-6 text-white mb-8`}>
              <div className="flex items-center justify-center mb-4">
                {selectedType.icon}
                <h2 className="text-2xl font-bold ml-3">{selectedType.title}</h2>
              </div>
              <p className="text-center text-lg opacity-90">
                {selectedType.description}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {selectedType.prompts.map((prompt, index) => (
                <button
                  key={prompt}
                  onClick={() => handlePromptSelect(prompt)}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                    selectedPrompt === prompt
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-purple-300 dark:hover:border-purple-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                      selectedPrompt === prompt
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      {index + 1}
                    </div>
                    <span className="font-medium">{prompt}</span>
                  </div>
                  {prompt === 'Magical Prompt' && (
                    <div className="mt-2 text-sm opacity-75">
                      ✨ Perfect for NSW Selective practice!
                    </div>
                  )}
                </button>
              ))}
            </div>

            {selectedPrompt && (
              <div className="text-center">
                <button
                  onClick={handleStartWriting}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-4 px-8 rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  <div className="flex items-center space-x-2">
                    <Sparkles className="h-5 w-5" />
                    <span>Start Writing with "{selectedPrompt}"</span>
                  </div>
                </button>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                  You'll get AI assistance and real-time feedback as you write!
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
