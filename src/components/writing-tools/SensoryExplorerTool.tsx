import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { sensoryExplorationPrompts, type SensoryPrompt } from '../../config/writingEnhancements';

interface SensoryExplorerToolProps {
  onInsertText?: (text: string) => void;
}

export function SensoryExplorerTool({ onInsertText }: SensoryExplorerToolProps) {
  const [expandedSense, setExpandedSense] = useState<string | null>('Sight');
  const [selectedWords, setSelectedWords] = useState<Record<string, string[]>>({});

  const toggleSense = (sense: string) => {
    setExpandedSense(expandedSense === sense ? null : sense);
  };

  const toggleWord = (sense: string, word: string) => {
    setSelectedWords(prev => {
      const senseWords = prev[sense] || [];
      const newWords = senseWords.includes(word)
        ? senseWords.filter(w => w !== word)
        : [...senseWords, word];
      return { ...prev, [sense]: newWords };
    });
  };

  const insertSelectedWords = (sense: string) => {
    if (onInsertText && selectedWords[sense]?.length > 0) {
      const words = selectedWords[sense].join(', ');
      onInsertText(words + ' ');
    }
  };

  const getSenseColor = (sense: string) => {
    const colors: Record<string, string> = {
      'Sight': 'blue',
      'Sound': 'green',
      'Touch': 'purple',
      'Smell': 'yellow',
      'Taste': 'red'
    };
    return colors[sense] || 'gray';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          <span>Sensory Explorer</span>
        </h3>
      </div>

      <div className="space-y-2">
        {sensoryExplorationPrompts.map((sensePrompt) => {
          const color = getSenseColor(sensePrompt.sense);
          const isExpanded = expandedSense === sensePrompt.sense;
          const selectedCount = selectedWords[sensePrompt.sense]?.length || 0;

          return (
            <div
              key={sensePrompt.sense}
              className={`border border-${color}-200 dark:border-${color}-800 rounded-lg overflow-hidden bg-white dark:bg-gray-800`}
            >
              <button
                onClick={() => toggleSense(sensePrompt.sense)}
                className={`w-full px-4 py-3 flex items-center justify-between hover:bg-${color}-50 dark:hover:bg-${color}-900/20 transition-colors`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{sensePrompt.icon}</span>
                  <div className="text-left">
                    <div className="font-semibold text-gray-900 dark:text-white text-sm">
                      {sensePrompt.sense}
                    </div>
                    {selectedCount > 0 && (
                      <div className={`text-xs text-${color}-600 dark:text-${color}-400`}>
                        {selectedCount} word{selectedCount !== 1 ? 's' : ''} selected
                      </div>
                    )}
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>

              {isExpanded && (
                <div className={`px-4 pb-4 space-y-3 bg-${color}-50 dark:bg-${color}-900/10`}>
                  <div className="pt-3 space-y-2">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Think about:
                    </h4>
                    <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                      {sensePrompt.prompts.map((prompt, pIndex) => (
                        <li key={pIndex} className="flex items-start gap-2">
                          <span className={`text-${color}-500 mt-0.5`}>•</span>
                          <span>{prompt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Descriptive Words:
                      </h4>
                      {selectedCount > 0 && (
                        <button
                          onClick={() => insertSelectedWords(sensePrompt.sense)}
                          className={`text-xs px-2 py-1 bg-${color}-500 text-white rounded hover:bg-${color}-600 transition-colors`}
                        >
                          Insert Selected
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {sensePrompt.descriptiveWords.map((word, wIndex) => {
                        const isSelected = selectedWords[sensePrompt.sense]?.includes(word);
                        return (
                          <button
                            key={wIndex}
                            onClick={() => toggleWord(sensePrompt.sense, word)}
                            className={`text-xs px-2 py-1 rounded-full border transition-all ${
                              isSelected
                                ? `bg-${color}-500 text-white border-${color}-600`
                                : `bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-${color}-300 dark:border-${color}-700 hover:bg-${color}-100 dark:hover:bg-${color}-900/30`
                            }`}
                          >
                            {word}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Simile & Metaphor Builder */}
      <div className="mt-4 border-2 border-orange-200 dark:border-orange-800 rounded-lg overflow-hidden bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 p-4">
        <h4 className="font-bold text-orange-900 dark:text-orange-200 text-sm mb-3 flex items-center gap-2">
          <span>✨</span>
          <span>Simile & Metaphor Builder</span>
        </h4>

        <div className="space-y-3">
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-orange-200 dark:border-orange-700">
            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Simile Examples (using "like" or "as"):
            </div>
            <div className="space-y-1.5">
              {[
                'The stars sparkled like diamonds',
                'As quiet as a whisper',
                'Moved like a shadow in the night',
                'Her smile was as bright as the sun'
              ].map((example, index) => (
                <div
                  key={index}
                  className="text-xs bg-orange-50 dark:bg-orange-900/20 text-orange-900 dark:text-orange-200 p-2 rounded cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                  onClick={() => onInsertText && onInsertText(example)}
                >
                  {example}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-orange-200 dark:border-orange-700">
            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Metaphor Examples (saying one thing IS another):
            </div>
            <div className="space-y-1.5">
              {[
                'The classroom was a zoo',
                'Time is a thief',
                'Her words were music to my ears',
                'The world is your oyster'
              ].map((example, index) => (
                <div
                  key={index}
                  className="text-xs bg-orange-50 dark:bg-orange-900/20 text-orange-900 dark:text-orange-200 p-2 rounded cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                  onClick={() => onInsertText && onInsertText(example)}
                >
                  {example}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-xs text-blue-800 dark:text-blue-300">
          <strong>💡 How to use:</strong> Explore each sense, select descriptive words,
          and click "Insert Selected" to add them to your writing. Try creating similes and metaphors!
        </p>
      </div>
    </div>
  );
}
