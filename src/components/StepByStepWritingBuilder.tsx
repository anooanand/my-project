/**
 * Step-by-Step Writing Builder
 *
 * Dynamic, adaptive writing builder that guides students through the entire
 * writing process for ANY selected writing type with context-specific prompts
 * and structural guidance at each stage.
 */

import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, CheckCircle, Circle, Lightbulb, Target, AlertCircle, ArrowRight } from 'lucide-react';
import { getWritingStructure, type WritingStage, type WritingTypeStructure } from '../config/writingStages';

interface StepByStepWritingBuilderProps {
  textType: string;
  content: string;
  onContentChange?: (content: string) => void;
  className?: string;
}

interface StageProgress {
  stageId: string;
  completed: boolean;
  wordCount: number;
  meetsMinimum: boolean;
}

export function StepByStepWritingBuilder({
  textType,
  content,
  onContentChange,
  className = ''
}: StepByStepWritingBuilderProps) {
  const [structure, setStructure] = useState<WritingTypeStructure | null>(null);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [stageProgress, setStageProgress] = useState<Record<string, StageProgress>>({});
  const [showAllStages, setShowAllStages] = useState(false);

  // Load structure when text type changes
  useEffect(() => {
    const loadedStructure = getWritingStructure(textType);
    setStructure(loadedStructure || null);

    if (loadedStructure) {
      // Initialize progress tracking
      const initialProgress: Record<string, StageProgress> = {};
      loadedStructure.stages.forEach((stage) => {
        initialProgress[stage.id] = {
          stageId: stage.id,
          completed: false,
          wordCount: 0,
          meetsMinimum: false
        };
      });
      setStageProgress(initialProgress);

      // Expand first stage by default
      setExpandedStage(loadedStructure.stages[0]?.id || null);
      setCurrentStageIndex(0);
    }
  }, [textType]);

  // Analyze content to estimate stage progress
  useEffect(() => {
    if (!structure || !content) return;

    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

    // Simple heuristic: distribute word count across stages
    const totalMinimumWords = structure.stages.reduce(
      (sum, stage) => sum + (stage.minimumWords || 0),
      0
    );

    let remainingWords = wordCount;
    const updatedProgress: Record<string, StageProgress> = {};

    structure.stages.forEach((stage, index) => {
      const stageMinWords = stage.minimumWords || 40;
      const proportion = totalMinimumWords > 0 ? stageMinWords / totalMinimumWords : 1 / structure.stages.length;
      const estimatedWords = Math.min(remainingWords, Math.floor(wordCount * proportion));

      updatedProgress[stage.id] = {
        stageId: stage.id,
        completed: estimatedWords >= stageMinWords,
        wordCount: estimatedWords,
        meetsMinimum: estimatedWords >= stageMinWords
      };

      remainingWords -= estimatedWords;
    });

    setStageProgress(updatedProgress);

    // Auto-advance to first incomplete stage
    const firstIncomplete = structure.stages.findIndex(
      (stage) => !updatedProgress[stage.id]?.completed
    );
    if (firstIncomplete !== -1 && firstIncomplete !== currentStageIndex) {
      setCurrentStageIndex(firstIncomplete);
    }
  }, [content, structure]);

  const toggleStage = (stageId: string) => {
    setExpandedStage(expandedStage === stageId ? null : stageId);
  };

  const goToStage = (index: number) => {
    setCurrentStageIndex(index);
    if (structure) {
      setExpandedStage(structure.stages[index].id);
    }
  };

  const handleNext = () => {
    if (structure && currentStageIndex < structure.stages.length - 1) {
      const nextIndex = currentStageIndex + 1;
      goToStage(nextIndex);
    }
  };

  const handlePrevious = () => {
    if (currentStageIndex > 0) {
      const prevIndex = currentStageIndex - 1;
      goToStage(prevIndex);
    }
  };

  const renderStageCard = (stage: WritingStage, index: number) => {
    const progress = stageProgress[stage.id] || {
      completed: false,
      wordCount: 0,
      meetsMinimum: false
    };

    const isExpanded = expandedStage === stage.id;
    const isCurrent = index === currentStageIndex;
    const isPast = index < currentStageIndex;

    return (
      <div
        key={stage.id}
        className={`border-2 rounded-lg overflow-hidden transition-all ${
          isCurrent
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : progress.completed
            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
            : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800'
        }`}
      >
        <button
          onClick={() => {
            toggleStage(stage.id);
            setCurrentStageIndex(index);
          }}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
          <div className="flex items-center gap-3 flex-1">
            {/* Status Icon */}
            <div className="flex-shrink-0">
              {progress.completed ? (
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              ) : isCurrent ? (
                <Circle className="w-6 h-6 text-blue-600 dark:text-blue-400 fill-current" />
              ) : (
                <Circle className="w-6 h-6 text-gray-400" />
              )}
            </div>

            {/* Stage Icon & Name */}
            <div className="text-left flex-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{stage.icon}</span>
                <div>
                  <div className="font-bold text-gray-900 dark:text-white text-sm">
                    Step {index + 1}: {stage.name}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {stage.description}
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Indicator */}
            <div className="flex-shrink-0 text-right">
              {stage.minimumWords && (
                <div className={`text-xs font-medium ${
                  progress.meetsMinimum
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {progress.wordCount}/{stage.minimumWords} words
                </div>
              )}
            </div>

            {/* Expand Icon */}
            <div className="flex-shrink-0">
              {isExpanded ? (
                <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              )}
            </div>
          </div>
        </button>

        {isExpanded && (
          <div className="px-4 pb-4 space-y-4 bg-white dark:bg-gray-900/50">
            {/* Objectives */}
            <div className="pt-3">
              <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-600" />
                Objectives for this stage:
              </h4>
              <ul className="space-y-1">
                {stage.objectives.map((objective, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-gray-700 dark:text-gray-300">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>{objective}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Active Prompts */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-lg border-2 border-blue-500">
              <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Answer these questions as you write:
              </h4>
              <ol className="space-y-2">
                {stage.prompts.map((prompt, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-white">
                    <span className="font-bold text-white flex-shrink-0">
                      {idx + 1}.
                    </span>
                    <span className="font-medium">{prompt}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Tips */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <h4 className="text-sm font-bold text-yellow-900 dark:text-yellow-200 mb-2 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                Writing Tips:
              </h4>
              <ul className="space-y-1">
                {stage.tips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-yellow-900 dark:text-yellow-200">
                    <span className="text-yellow-600 mt-0.5">✓</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Examples */}
            {stage.examples && stage.examples.length > 0 && (
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                <h4 className="text-sm font-bold text-green-900 dark:text-green-200 mb-2">
                  💡 Example Openings:
                </h4>
                <div className="space-y-1.5">
                  {stage.examples.map((example, idx) => (
                    <div key={idx} className="text-xs italic text-green-800 dark:text-green-300 bg-white/50 dark:bg-black/20 p-2 rounded">
                      "{example}"
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-2 pt-2">
              {index > 0 && (
                <button
                  onClick={handlePrevious}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                >
                  ← Previous Step
                </button>
              )}
              {index < (structure?.stages.length || 0) - 1 && (
                <button
                  onClick={handleNext}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                >
                  Next Step <ArrowRight className="w-4 h-4" />
                </button>
              )}
              {index === (structure?.stages.length || 0) - 1 && progress.completed && (
                <button
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Complete!
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!structure) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <Target className="w-12 h-12 mx-auto mb-3 text-gray-400" />
        <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-2">
          No Writing Structure Available
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Select a writing type to see step-by-step guidance
        </p>
      </div>
    );
  }

  const completedCount = Object.values(stageProgress).filter(p => p.completed).length;
  const totalStages = structure.stages.length;
  const progressPercentage = (completedCount / totalStages) * 100;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-lg">
        <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
          <Target className="w-5 h-5" />
          {structure.displayName} - Step-by-Step Builder
        </h2>
        <p className="text-sm opacity-90 mb-3">{structure.overallGuidance}</p>

        {/* Progress Bar */}
        <div className="bg-white/20 rounded-full h-3 overflow-hidden">
          <div
            className="bg-white h-full transition-all duration-500 rounded-full flex items-center justify-end pr-2"
            style={{ width: `${progressPercentage}%` }}
          >
            {progressPercentage > 10 && (
              <span className="text-xs font-bold text-blue-600">
                {completedCount}/{totalStages}
              </span>
            )}
          </div>
        </div>
        <div className="text-xs opacity-90 mt-1">
          {completedCount === totalStages
            ? '🎉 All stages complete!'
            : `${completedCount} of ${totalStages} stages completed`}
        </div>
      </div>

      {/* Toggle View Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowAllStages(!showAllStages)}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          {showAllStages ? 'Show Current Stage Only' : 'Show All Stages'}
        </button>
      </div>

      {/* Stages */}
      <div className="space-y-3">
        {showAllStages
          ? structure.stages.map((stage, index) => renderStageCard(stage, index))
          : renderStageCard(structure.stages[currentStageIndex], currentStageIndex)}
      </div>

      {/* Bottom Guidance */}
      {!showAllStages && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-900 dark:text-blue-200">
            <strong>💡 How to use:</strong> Follow each step in order. Answer the questions
            and use the tips as you write. Move to the next step when you've completed the
            current stage's objectives.
          </p>
        </div>
      )}
    </div>
  );
}
