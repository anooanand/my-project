import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import { storyMountainTemplate, type StoryMountainPhase } from '../../config/writingEnhancements';

interface StoryMountainToolProps {
  onInsertText?: (text: string) => void;
}

export function StoryMountainTool({ onInsertText }: StoryMountainToolProps) {
  const [expandedPhase, setExpandedPhase] = useState<string | null>('exposition');
  const [completedPhases, setCompletedPhases] = useState<Set<string>>(new Set());
  const [phaseNotes, setPhaseNotes] = useState<Record<string, string>>({});

  const togglePhase = (phaseId: string) => {
    setExpandedPhase(expandedPhase === phaseId ? null : phaseId);
  };

  const markComplete = (phaseId: string) => {
    const newCompleted = new Set(completedPhases);
    if (newCompleted.has(phaseId)) {
      newCompleted.delete(phaseId);
    } else {
      newCompleted.add(phaseId);
    }
    setCompletedPhases(newCompleted);
  };

  const updateNotes = (phaseId: string, notes: string) => {
    setPhaseNotes(prev => ({ ...prev, [phaseId]: notes }));
  };

  const insertPlanningNotes = () => {
    if (onInsertText) {
      const notesText = storyMountainTemplate
        .map(phase => {
          const notes = phaseNotes[phase.id];
          if (notes) {
            return `${phase.icon} ${phase.name}:\n${notes}\n`;
          }
          return '';
        })
        .filter(text => text)
        .join('\n');

      if (notesText) {
        onInsertText(`\n--- Story Plan ---\n${notesText}\n--- End Plan ---\n`);
      }
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span>⛰️</span>
          <span>Story Mountain Planner</span>
        </h3>
        {Object.keys(phaseNotes).length > 0 && (
          <button
            onClick={insertPlanningNotes}
            className="text-xs px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Insert Plan
          </button>
        )}
      </div>

      <div className="space-y-2">
        {storyMountainTemplate.map((phase, index) => (
          <div
            key={phase.id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800"
          >
            <button
              onClick={() => togglePhase(phase.id)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{phase.icon}</span>
                <div className="text-left">
                  <div className="font-semibold text-gray-900 dark:text-white text-sm">
                    {phase.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {phase.description}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    markComplete(phase.id);
                  }}
                  className={`p-1 rounded transition-colors ${
                    completedPhases.has(phase.id)
                      ? 'text-green-600 bg-green-100 dark:bg-green-900/30'
                      : 'text-gray-400 hover:text-green-600'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
                {expandedPhase === phase.id ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </button>

            {expandedPhase === phase.id && (
              <div className="px-4 pb-4 space-y-3 bg-gray-50 dark:bg-gray-900/50">
                <div className="pt-3 space-y-2">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Questions to think about:
                  </h4>
                  <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                    {phase.questions.map((question, qIndex) => (
                      <li key={qIndex} className="flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5">•</span>
                        <span>{question}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    💡 Tips:
                  </h4>
                  <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                    {phase.tips.map((tip, tIndex) => (
                      <li key={tIndex} className="flex items-start gap-2">
                        <span className="text-yellow-500 mt-0.5">✓</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Your notes:
                  </label>
                  <textarea
                    value={phaseNotes[phase.id] || ''}
                    onChange={(e) => updateNotes(phase.id, e.target.value)}
                    placeholder="Write your ideas here..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-xs text-blue-800 dark:text-blue-300">
          <strong>💡 How to use:</strong> Work through each phase of your story from top to bottom.
          Click to expand, answer the questions, take notes, and mark complete when done!
        </p>
      </div>
    </div>
  );
}
