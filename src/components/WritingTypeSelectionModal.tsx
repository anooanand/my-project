import React, { useState } from 'react';
import { X, BookOpen, MessageSquare, FileText, Heart, Eye, Clock, Star, HelpCircle, Megaphone, Lightbulb, Book, Speech, Newspaper, ThumbsUp, Map, Mail } from 'lucide-react';

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
  isPopular?: boolean;
  color: string;
}

export function WritingTypeSelectionModal({ isOpen, onClose, onSelect }: WritingTypeSelectionModalProps) {
  const [showHelp, setShowHelp] = useState<string | null>(null);

  const writingTypes: WritingType[] = [
    {
      id: 'narrative',
      name: 'Narrative Writing',
      description: 'Tell stories with characters, settings, and exciting events',
      icon: <BookOpen className="h-5 w-5" />,
      isPopular: true,
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'persuasive',
      name: 'Persuasive Writing',
      description: 'Convince readers to agree with your point of view',
      icon: <MessageSquare className="h-5 w-5" />,
      color: 'from-red-500 to-red-600'
    },
    {
      id: 'expository',
      name: 'Expository Writing',
      description: 'Explain or inform readers about a topic',
      icon: <FileText className="h-5 w-5" />,
      color: 'from-green-500 to-green-600'
    },
    {
      id: 'reflective',
      name: 'Reflective Writing',
      description: 'Think deeply about your experiences and what you learned',
      icon: <Heart className="h-5 w-5" />,
      isPopular: true,
      color: 'from-pink-500 to-pink-600'
    },
    {
      id: 'descriptive',
      name: 'Descriptive Writing',
      description: 'Paint pictures with words using lots of details',
      icon: <Eye className="h-5 w-5" />,
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: 'recount',
      name: 'Recount Writing',
      description: 'Tell about events in the order they happened',
      icon: <Clock className="h-5 w-5" />,
      color: 'from-orange-500 to-orange-600'
    },
    {
      id: 'advertisement',
      name: 'Advertisement',
      description: 'Create compelling promotional content to market products or services',
      icon: <Megaphone className="h-5 w-5" />,
      color: 'from-yellow-500 to-yellow-600'
    },
    {
      id: 'advice-sheet',
      name: 'Advice Sheet',
      description: 'Provide helpful guidance and practical recommendations',
      icon: <Lightbulb className="h-5 w-5" />,
      color: 'from-teal-500 to-teal-600'
    },
    {
      id: 'diary-entry',
      name: 'Diary Entry',
      description: 'Write about personal experiences, thoughts, and feelings in a chronological order',
      icon: <Book className="h-5 w-5" />,
      color: 'from-indigo-500 to-indigo-600'
    },
    {
      id: 'discussion',
      name: 'Discussion Writing',
      description: 'Present balanced viewpoints and explore different perspectives',
      icon: <Speech className="h-5 w-5" />,
      color: 'from-cyan-500 to-cyan-600'
    },
    {
      id: 'guide',
      name: 'Guide',
      description: 'Create step-by-step instructions and how-to content',
      icon: <Map className="h-5 w-5" />,
      color: 'from-lime-500 to-lime-600'
    },
    {
      id: 'letter',
      name: 'Letter Writing',
      description: 'Write formal or informal correspondence for various purposes',
      icon: <Mail className="h-5 w-5" />,
      color: 'from-emerald-500 to-emerald-600'
    },
    {
      id: 'news-report',
      name: 'News Report',
      description: 'Report factual information about an event or topic in a clear and objective manner',
      icon: <Newspaper className="h-5 w-5" />,
      color: 'from-gray-500 to-gray-600'
    },
    {
      id: 'review',
      name: 'Review Writing',
      description: 'Provide critical evaluation and analysis of products or experiences',
      icon: <ThumbsUp className="h-5 w-5" />,
      color: 'from-fuchsia-500 to-fuchsia-600'
    },
    {
      id: 'speech',
      name: 'Speech Writing',
      description: 'Craft compelling oral presentations designed to engage audiences',
      icon: <Speech className="h-5 w-5" />,
      color: 'from-violet-500 to-violet-600'
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                Choose Your Writing Type
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-xs">
                What kind of writing do you want to do today?
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
            >
              <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(85vh-110px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {writingTypes.map((type) => (
              <div
                key={type.id}
                onClick={() => onSelect(type.id)}
                className="relative p-3 cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:scale-102 border-2 border-transparent hover:border-blue-300 bg-white dark:bg-gray-800 rounded-lg shadow-sm"
              >
                {/* Popular Badge */}
                {type.isPopular && (
                  <div className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 px-1.5 py-0.5 rounded-full text-xs font-bold shadow-md flex items-center gap-0.5">
                    <Star className="h-2 w-2 fill-yellow-900" />
                    Popular
                  </div>
                )}

                {/* Header with Icon and Title */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center flex-1">
                    <div className={`p-1.5 rounded-lg bg-gradient-to-r ${type.color} text-white shadow-sm mr-2`}>
                      {type.icon}
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                      {type.name}
                    </h3>
                  </div>

                  {/* Help Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowHelp(showHelp === type.id ? null : type.id);
                    }}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors flex-shrink-0"
                  >
                    <HelpCircle className="h-3 w-3 text-gray-400" />
                  </button>
                </div>

                {/* Description */}
                <p className="text-gray-600 dark:text-gray-300 text-xs mb-2 leading-snug">
                  {type.description}
                </p>

                {/* Action Button */}
                <button className="w-full py-1.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-md font-semibold hover:from-blue-600 hover:to-purple-600 transition-all transform hover:scale-105 shadow-sm text-xs">
                  Choose This Type
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
              <HelpCircle className="h-3 w-3 mr-1" />
              Click ? for details
            </div>
            <button
              onClick={onClose}
              className="px-3 py-1 bg-gray-200 text-gray-800 rounded-full font-semibold text-xs shadow-sm hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
