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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden border border-gray-200 dark:border-slate-700">

        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-700 dark:to-slate-800">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-2">
                Choose Your Writing Type
              </h2>
              <p className="text-gray-600 dark:text-slate-300 text-base">
                Select the type of writing you'd like to practice today
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-all duration-200 group"
              aria-label="Close modal"
            >
              <X className="h-6 w-6 text-gray-400 dark:text-slate-400 group-hover:text-gray-600 dark:group-hover:text-slate-200" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {writingTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => onSelect(type.id)}
                className="group relative p-6 text-left cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-2 border-gray-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 bg-white dark:bg-slate-700 rounded-xl"
              >
                {/* Popular Badge */}
                {type.isPopular && (
                  <div className="absolute -top-2 -right-2 bg-amber-400 text-amber-900 px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                    <Star className="h-3 w-3 fill-amber-900" />
                    Popular
                  </div>
                )}

                {/* Icon */}
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${type.color} text-white shadow-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  {React.cloneElement(type.icon as React.ReactElement, { className: "h-7 w-7" })}
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {type.name}
                </h3>

                {/* Description */}
                <p className="text-gray-600 dark:text-slate-300 text-sm leading-relaxed">
                  {type.description}
                </p>

                {/* Hover Arrow */}
                <div className="mt-4 flex items-center text-blue-600 dark:text-blue-400 font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Select</span>
                  <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Need help deciding? Try one of the popular options!
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
