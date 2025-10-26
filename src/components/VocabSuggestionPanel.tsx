import React, { useState, useEffect } from 'react';
import { Lightbulb, Star, PlusCircle, CheckCircle, XCircle, BookOpen } from 'lucide-react';

interface AIVocabularyEnhancement {
  original: string;
  suggestion: string;
  explanation: string;
  position: { start: number; end: number };
}

interface VocabSuggestion {
  word: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  definition: string;
  example: string;
  contextualMatch: boolean;
}

interface VocabSuggestionPanelProps {
  content: string;
  textType: string;
  aiEnhancements?: AIVocabularyEnhancement[];
  onWordReplace?: (oldWord: string, newWord: string, position: number) => void;
  onAddToPersonalList?: (word: string) => void;
  className?: string;
}

const SAMPLE_VOCAB_SUGGESTIONS: VocabSuggestion[] = [
  {
    word: 'vivid',
    difficulty: 'intermediate',
    definition: 'Producing powerful feelings or strong, clear images in the mind',
    example: 'The vivid description brought the scene to life.',
    contextualMatch: true,
  },
  {
    word: 'serene',
    difficulty: 'intermediate',
    definition: 'Calm, peaceful, and untroubled; tranquil.',
    example: 'The serene lake reflected the moonlight.',
    contextualMatch: true,
  },
  {
    word: 'meticulous',
    difficulty: 'advanced',
    definition: 'Showing great attention to detail; very careful and precise.',
    example: 'The artist was meticulous in her brushstrokes.',
    contextualMatch: false,
  },
  {
    word: 'ephemeral',
    difficulty: 'advanced',
    definition: 'Lasting for a very short time.',
    example: 'The beauty of the cherry blossoms is ephemeral.',
    contextualMatch: false
  },
  {
    word: 'jubilant',
    difficulty: 'intermediate',
    definition: 'Feeling or expressing great happiness and triumph.',
    example: 'The crowd was jubilant after the team won the championship.',
    contextualMatch: true
  },
  {
    word: 'resilient',
    difficulty: 'advanced',
    definition: 'Able to withstand or recover quickly from difficult conditions.',
    example: 'Despite setbacks, she remained resilient.',
    contextualMatch: false
  },
  {
    word: 'eloquent',
    difficulty: 'advanced',
    definition: 'Fluent or persuasive in speaking or writing.',
    example: 'His eloquent speech moved the audience.',
    contextualMatch: false
  },
  {
    word: 'benevolent',
    difficulty: 'intermediate',
    definition: 'Well meaning and kindly.',
    example: 'The benevolent king was loved by his people.',
    contextualMatch: false
  },
  {
    word: 'ubiquitous',
    difficulty: 'advanced',
    definition: 'Present, appearing, or found everywhere.',
    example: 'Smartphones have become ubiquitous in modern society.',
    contextualMatch: false
  },
  {
    word: 'cacophony',
    difficulty: 'advanced',
    definition: 'A harsh, discordant mixture of sounds.',
    example: 'A cacophony of car horns filled the street.',
    contextualMatch: false
  }
];

const getDifficultyColor = (difficulty: VocabSuggestion['difficulty']) => {
  switch (difficulty) {
    case 'beginner': return 'bg-green-200 text-green-800';
    case 'intermediate': return 'bg-yellow-200 text-yellow-800';
    case 'advanced': return 'bg-red-200 text-red-800';
    default: return 'bg-gray-200 text-gray-800';
  }
};

// Removed yearLevel filtering as per user's request

export const VocabSuggestionPanel: React.FC<VocabSuggestionPanelProps> = ({
  content,
  textType,
  aiEnhancements,
  onWordReplace,
  onAddToPersonalList,
  className = ""
}) => {
  const [suggestions, setSuggestions] = useState<VocabSuggestion[]>([]);
  const [overusedWords, setOverusedWords] = useState<string[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<AIVocabularyEnhancement[]>([]);

  useEffect(() => {
    // Prioritize AI enhancements if available
    if (aiEnhancements && aiEnhancements.length > 0) {
      setAiSuggestions(aiEnhancements);

      // Extract overused words from AI suggestions
      const overused = Array.from(new Set(aiEnhancements.map(e => e.original)));
      setOverusedWords(overused);

      // Clear generic suggestions when using AI
      setSuggestions([]);
    } else {
      // Fall back to hardcoded suggestions
      setSuggestions(SAMPLE_VOCAB_SUGGESTIONS);

      // Simulate detecting overused words
      const detectedOverused = detectOverusedWords(content);
      setOverusedWords(detectedOverused);

      setAiSuggestions([]);
    }

  }, [content, textType, aiEnhancements]);

  const detectOverusedWords = (text: string): string[] => {
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const wordCounts: { [key: string]: number } = {};
    words.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });

    const overused: string[] = [];
    for (const word in wordCounts) {
      if (wordCounts[word] > 3 && !['the', 'a', 'an', 'is', 'it', 'and', 'to', 'of', 'in', 'was', 'he', 'she', 'i', 'you'].includes(word)) { // Simple heuristic
        overused.push(word);
      }
    }
    return overused;
  };

  return (
    <div className={`bg-white rounded-lg border shadow-sm ${className}`}>
      <div className="p-4 border-b bg-gradient-to-r from-purple-50 to-fuchsia-50">
        <div className="flex items-center space-x-2">
          <BookOpen className="h-5 w-5 text-purple-600" />
          <h3 className={`font-semibold text-gray-800 text-xl`}>
            Vocab Coach
          </h3>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Overused Words */}
        <div className="border rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-2">
            <XCircle className="h-5 w-5 text-red-500" />
            <h4 className={`font-medium text-gray-700 text-base`}>Overused Words</h4>
          </div>
          {overusedWords.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {overusedWords.map((word, index) => (
                <span key={index} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                  {word}
                </span>
              ))}
            </div>
          ) : (
            <p className={`text-sm text-gray-500 text-sm`}>No overused words detected. Great job!</p>
          )}
        </div>

        {/* AI-Powered Vocabulary Enhancements */}
        {aiSuggestions.length > 0 && (
          <div className="border rounded-lg p-3 bg-gradient-to-br from-purple-50 to-blue-50">
            <div className="flex items-center space-x-2 mb-2">
              <Lightbulb className="h-5 w-5 text-purple-600" />
              <h4 className={`font-medium text-gray-700 text-base`}>AI-Powered Vocabulary Enhancements</h4>
              <span className="px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full">AI</span>
            </div>
            <div className="space-y-3">
              {aiSuggestions.map((enhancement, index) => (
                <div key={index} className="bg-white p-3 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-red-600 line-through font-medium">{enhancement.original}</span>
                      <span className="text-gray-400">→</span>
                      <span className="text-green-600 font-semibold">{enhancement.suggestion}</span>
                    </div>
                    {onAddToPersonalList && (
                      <button
                        onClick={() => onAddToPersonalList(enhancement.suggestion)}
                        className="text-gray-500 hover:text-purple-600 transition-colors"
                        title="Add to personal word list"
                      >
                        <PlusCircle className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>Why:</strong> {enhancement.explanation}
                  </p>
                  {onWordReplace && (
                    <div className="mt-2 flex justify-end">
                      <button
                        onClick={() => onWordReplace(enhancement.original, enhancement.suggestion, enhancement.position.start)}
                        className="px-3 py-1 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors"
                      >
                        Apply Suggestion
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contextual Suggestions */}
        {suggestions.length > 0 && (
        <div className="border rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-2">
            <Lightbulb className="h-5 w-5 text-blue-500" />
            <h4 className={`font-medium text-gray-700 text-base`}>General Vocabulary Suggestions</h4>
          </div>
          {suggestions.length > 0 ? (
            <div className="space-y-3">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className={`font-semibold text-base`}>{suggestion.word}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${getDifficultyColor(suggestion.difficulty)}`}>
                        {suggestion.difficulty}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {suggestion.contextualMatch && (
                        <span className="text-xs text-green-600 flex items-center space-x-1">
                          <CheckCircle className="h-3 w-3" />
                          <span>Context Match</span>
                        </span>
                      )}
                      {onAddToPersonalList && (
                        <button 
                          onClick={() => onAddToPersonalList(suggestion.word)}
                          className="text-gray-500 hover:text-purple-600 transition-colors"
                          title="Add to personal word list"
                        >
                          <PlusCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className={`text-gray-700 mb-1 text-sm`}>{suggestion.definition}</p>
                  <p className={`text-gray-500 italic text-xs`}>Example: "{suggestion.example}"</p>
                  {onWordReplace && (
                    <div className="mt-2 flex justify-end">
                      <button
                        onClick={() => onWordReplace('old_word_placeholder', suggestion.word, 0)} // Placeholder for actual word replacement
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                      >
                        Use This Word
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className={`text-sm text-gray-500 text-sm`}>Write more to get contextual vocabulary suggestions.</p>
          )}
        </div>
        )}

        {/* Personal Word List (Placeholder) */}
        <div className="border rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-2">
            <Star className="h-5 w-5 text-yellow-500" />
            <h4 className={`font-medium text-gray-700 text-base`}>Personal Word List</h4>
          </div>
          <p className={`text-sm text-gray-500 text-sm`}>Words you've saved will appear here.</p>
        </div>
      </div>
    </div>
  );
};
