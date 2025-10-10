import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Lightbulb, AlertCircle } from 'lucide-react';
import { persuasiveArgumentFlow } from '../../config/writingEnhancements';

interface PersuasiveFlowToolProps {
  onInsertText?: (text: string) => void;
}

export function PersuasiveFlowTool({ onInsertText }: PersuasiveFlowToolProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>('introduction');
  const [showCounterarguments, setShowCounterarguments] = useState(false);

  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  const counterarguments = [
    'Some people might think that...',
    'Critics could argue that...',
    'It might be said that...',
    'Others believe that...',
    'One concern could be...'
  ];

  const rebuttalStarters = [
    'However, research shows...',
    'While this is true, we must also consider...',
    'Although this viewpoint exists, the evidence suggests...',
    'This argument fails to account for...',
    'On closer examination, we find...'
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span>📊</span>
          <span>Argument Flow Checklist</span>
        </h3>
      </div>

      <div className="space-y-2">
        {persuasiveArgumentFlow.map((section, index) => (
          <div
            key={section.id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800"
          >
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-400">
                  {index + 1}
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-900 dark:text-white text-sm">
                    {section.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {section.description}
                  </div>
                </div>
              </div>
              {expandedSection === section.id ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>

            {expandedSection === section.id && (
              <div className="px-4 pb-4 space-y-3 bg-gray-50 dark:bg-gray-900/50">
                <div className="pt-3 space-y-2">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-500" />
                    Key Elements:
                  </h4>
                  <ul className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
                    {section.elements.map((element, eIndex) => (
                      <li key={eIndex} className="flex items-start gap-2 bg-white dark:bg-gray-800 p-2 rounded">
                        <span className="text-green-500 mt-0.5 font-bold">✓</span>
                        <span>{element}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    💬 Example Phrases:
                  </h4>
                  <div className="space-y-1.5">
                    {section.examples.map((example, exIndex) => (
                      <div
                        key={exIndex}
                        className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-200 p-2 rounded border-l-2 border-blue-400 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                        onClick={() => onInsertText && onInsertText(example + ' ')}
                      >
                        "{example}"
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Challenge Me - Counterarguments */}
      <div className="mt-4 border-2 border-purple-200 dark:border-purple-800 rounded-lg overflow-hidden bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
        <button
          onClick={() => setShowCounterarguments(!showCounterarguments)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/50 dark:hover:bg-black/20 transition-colors"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <div className="text-left">
              <div className="font-bold text-purple-900 dark:text-purple-200 text-sm">
                Challenge Me! 🎯
              </div>
              <div className="text-xs text-purple-700 dark:text-purple-300">
                Practice handling counterarguments
              </div>
            </div>
          </div>
          {showCounterarguments ? (
            <ChevronUp className="w-4 h-4 text-purple-600" />
          ) : (
            <ChevronDown className="w-4 h-4 text-purple-600" />
          )}
        </button>

        {showCounterarguments && (
          <div className="px-4 pb-4 space-y-3">
            <div className="pt-3 space-y-2">
              <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-200">
                Counterargument Starters:
              </h4>
              <div className="space-y-1.5">
                {counterarguments.map((starter, index) => (
                  <div
                    key={index}
                    className="text-xs bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 p-2 rounded border border-purple-200 dark:border-purple-700 cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors"
                    onClick={() => onInsertText && onInsertText(starter + ' ')}
                  >
                    "{starter}"
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-200">
                Rebuttal Phrases:
              </h4>
              <div className="space-y-1.5">
                {rebuttalStarters.map((rebuttal, index) => (
                  <div
                    key={index}
                    className="text-xs bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 p-2 rounded border border-purple-200 dark:border-purple-700 cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors"
                    onClick={() => onInsertText && onInsertText(rebuttal + ' ')}
                  >
                    "{rebuttal}"
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <p className="text-xs text-purple-900 dark:text-purple-200">
                <strong>💡 Tip:</strong> Acknowledging other viewpoints makes your argument stronger!
                Always be respectful when discussing opposing views.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-xs text-blue-800 dark:text-blue-300">
          <strong>💡 How to use:</strong> Follow each step to build a strong argument.
          Click example phrases to insert them into your writing!
        </p>
      </div>
    </div>
  );
}
