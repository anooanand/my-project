/**
 * Contextual AI Coach Panel
 *
 * Enhanced AI coaching with genre-specific examples, rubric-aligned feedback,
 * and show-don't-tell analysis
 */

import React, { useState, useEffect } from 'react';
import { Lightbulb, BookOpen, Target, TrendingUp, AlertCircle, CheckCircle, Eye, Sparkles, X } from 'lucide-react';
import { generateCoachFeedback, type ContextualExample } from '../lib/contextualAICoach';
import { generateShowDontTellFeedback } from '../lib/showDontTellAnalyzer';
import { getRubricForType } from '../lib/nswRubricCriteria';
import { generateDynamicExamples, type DynamicExample } from '../lib/dynamicExampleGenerator';

interface ContextualAICoachPanelProps {
  content: string;
  textType: string;
  prompt?: string;
}

export function ContextualAICoachPanel({ content, textType, prompt }: ContextualAICoachPanelProps) {
  const [feedback, setFeedback] = useState<any>(null);
  const [showDontTellAnalysis, setShowDontTellAnalysis] = useState<any>(null);
  const [selectedExample, setSelectedExample] = useState<ContextualExample | null>(null);
  const [activeTab, setActiveTab] = useState<'examples' | 'rubric' | 'show-tell'>('examples');
  const [dynamicExamples, setDynamicExamples] = useState<DynamicExample[]>([]);

  // Generate feedback when content changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (content.trim().length > 20) {
        const newFeedback = generateCoachFeedback(content, textType, prompt);
        setFeedback(newFeedback);

        // Generate show-don't-tell analysis for narrative and descriptive
        if (textType === 'narrative' || textType === 'descriptive') {
          const showTellFeedback = generateShowDontTellFeedback(content);
          setShowDontTellAnalysis(showTellFeedback);
        }
      }

      // Generate dynamic examples based on prompt and progress
      if (prompt) {
        const wordCount = content.trim().split(/\s+/).filter(w => w.length > 0).length;
        const examples = generateDynamicExamples(prompt, textType, wordCount);
        setDynamicExamples(examples);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [content, textType, prompt]);

  if (!feedback && dynamicExamples.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>Start writing to receive contextual feedback and examples!</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-green-600 to-teal-600 text-white">
        <h3 className="font-bold text-lg">Contextual AI Coach</h3>
        <p className="text-sm opacity-90">Genre-specific guidance & examples</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b bg-white dark:bg-gray-800">
        <button
          onClick={() => setActiveTab('examples')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'examples'
              ? 'border-b-2 border-green-500 text-green-600 dark:text-green-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-green-600'
          }`}
        >
          <BookOpen className="w-4 h-4 inline mr-2" />
          Examples
        </button>
        <button
          onClick={() => setActiveTab('rubric')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'rubric'
              ? 'border-b-2 border-green-500 text-green-600 dark:text-green-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-green-600'
          }`}
        >
          <Target className="w-4 h-4 inline mr-2" />
          Rubric
        </button>
        {(textType === 'narrative' || textType === 'descriptive') && (
          <button
            onClick={() => setActiveTab('show-tell')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'show-tell'
                ? 'border-b-2 border-green-500 text-green-600 dark:text-green-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-green-600'
            }`}
          >
            <Eye className="w-4 h-4 inline mr-2" />
            Show/Tell
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Overall Feedback */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start">
            <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Overall Progress</h4>
              <p className="text-sm text-blue-800 dark:text-blue-200">{feedback.overallFeedback}</p>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'examples' && (
          <div className="space-y-3">
            {/* Dynamic Examples Based on Prompt */}
            {dynamicExamples.length > 0 && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-4">
                <div className="flex items-start mb-3">
                  <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-1">
                      {content.trim().length === 0 ? 'Ideas to Get Started' : 'Build on Your Progress'}
                    </h4>
                    <p className="text-xs text-purple-700 dark:text-purple-300 mb-3">
                      Here are some ideas inspired by your prompt!
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {dynamicExamples.map((example, index) => (
                    <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-purple-200 dark:border-purple-700">
                      <p className="text-xs text-gray-800 dark:text-gray-200 italic mb-2">
                        "{example.text}"
                      </p>
                      {example.description && (
                        <p className="text-xs text-purple-600 dark:text-purple-400 flex items-center">
                          <Lightbulb className="w-3 h-3 mr-1" />
                          {example.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center">
              <BookOpen className="w-4 h-4 mr-2" />
              Contextual Examples for Your Writing
            </h4>

            {feedback && feedback.contextualExamples.length === 0 ? (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 inline mr-2" />
                <span className="text-sm text-green-800 dark:text-green-200">
                  Great! Your writing includes all key {textType} elements.
                </span>
              </div>
            ) : feedback && feedback.contextualExamples ? (
              feedback.contextualExamples.map((example: ContextualExample, index: number) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 cursor-pointer" onClick={() => setSelectedExample(selectedExample?.suggestion === example.suggestion ? null : example)}>
                      <div className="flex items-center mb-2">
                        <Lightbulb className="w-4 h-4 text-yellow-500 mr-2" />
                        <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{example.category}</h5>
                      </div>
                      <p className="text-xs text-gray-700 dark:text-gray-300 mb-2">{example.suggestion}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 italic">{example.relevanceToPrompt}</p>
                    </div>
                    <div className="ml-3 flex items-start space-x-1">
                      {selectedExample?.suggestion === example.suggestion && (
                        <button
                          onClick={() => setSelectedExample(null)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          title="Close"
                        >
                          <X className="w-4 h-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" />
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedExample(selectedExample?.suggestion === example.suggestion ? null : example)}
                        className="p-1"
                      >
                        {selectedExample?.suggestion === example.suggestion ? (
                          <span className="text-green-600 dark:text-green-400 text-xs">▼</span>
                        ) : (
                          <span className="text-gray-400 text-xs">▶</span>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Example */}
                  {selectedExample?.suggestion === example.suggestion && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">❌ Before (Weak):</p>
                        <p className="text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 p-2 rounded italic">
                          {example.beforeExample}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">✅ After (Strong):</p>
                        <p className="text-sm text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 p-2 rounded">
                          {example.afterExample}
                        </p>
                      </div>

                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                        <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-1">💡 Why This Works:</p>
                        <p className="text-sm text-blue-800 dark:text-blue-200">{example.explanation}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : null}
          </div>
        )}

        {activeTab === 'rubric' && (
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center">
              <Target className="w-4 h-4 mr-2" />
              NSW Rubric Alignment
            </h4>

            {feedback.rubricAlignment.map((alignment: any, index: number) => (
              <div key={index} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h5 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{alignment.criterion}</h5>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Current Level</p>
                    <p className="text-sm font-medium text-orange-600 dark:text-orange-400">{alignment.currentLevel}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Target Level</p>
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">{alignment.targetLevel}</p>
                  </div>
                </div>

                {alignment.gaps.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Missing Elements:</p>
                    <ul className="space-y-1">
                      {alignment.gaps.map((gap: string, i: number) => (
                        <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start">
                          <AlertCircle className="w-3 h-3 text-orange-500 mr-2 flex-shrink-0 mt-0.5" />
                          {gap}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {alignment.actionItems.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Action Items:</p>
                    <ul className="space-y-1">
                      {alignment.actionItems.map((item: string, i: number) => (
                        <li key={i} className="text-sm text-green-700 dark:text-green-300 flex items-start">
                          <CheckCircle className="w-3 h-3 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}

            {/* Genre-Specific Feedback */}
            {feedback.genreSpecificFeedback.length > 0 && (
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                <h5 className="font-semibold text-purple-900 dark:text-purple-100 mb-3">
                  {textType.charAt(0).toUpperCase() + textType.slice(1)} Writing Focus
                </h5>
                <ul className="space-y-2">
                  {feedback.genreSpecificFeedback.map((item: string, i: number) => (
                    <li key={i} className="text-sm text-purple-800 dark:text-purple-200 flex items-start">
                      <span className="mr-2">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === 'show-tell' && showDontTellAnalysis && (
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center">
              <Eye className="w-4 h-4 mr-2" />
              Show Don't Tell Analysis
            </h4>

            {/* Ratio Assessment */}
            <div className={`border rounded-lg p-4 ${
              showDontTellAnalysis.ratio.assessment === 'excellent'
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                : showDontTellAnalysis.ratio.assessment === 'good'
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                : showDontTellAnalysis.ratio.assessment === 'needs_improvement'
                ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}>
              <h5 className="font-semibold mb-2">Assessment: {showDontTellAnalysis.ratio.assessment.replace('_', ' ').toUpperCase()}</h5>
              <p className="text-sm mb-3">{showDontTellAnalysis.summary}</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs opacity-75">Showing instances:</p>
                  <p className="font-bold text-lg">{showDontTellAnalysis.ratio.showingCount}</p>
                </div>
                <div>
                  <p className="text-xs opacity-75">Telling instances:</p>
                  <p className="font-bold text-lg">{showDontTellAnalysis.ratio.tellingCount}</p>
                </div>
              </div>
            </div>

            {/* Issues Found */}
            {showDontTellAnalysis.issues.length > 0 && (
              <div>
                <h5 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Found {showDontTellAnalysis.issues.length} opportunities to show instead of tell:
                </h5>
                {showDontTellAnalysis.issues.slice(0, 5).map((issue: any, index: number) => (
                  <div key={index} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-3">
                    <div className="flex items-start mb-3">
                      <AlertCircle className="w-4 h-4 text-orange-500 mr-2 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Found: "<span className="text-orange-600 dark:text-orange-400">{issue.original}</span>"
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{issue.explanation}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Try these alternatives:</p>
                      {issue.showingSuggestions.slice(0, 3).map((suggestion: string, i: number) => (
                        <p key={i} className="text-sm text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 p-2 rounded">
                          ✓ {suggestion}
                        </p>
                      ))}
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Example:</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Before: {issue.example.before}</p>
                      <p className="text-xs text-green-700 dark:text-green-300">After: {issue.example.after}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tips */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h5 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">Tips for Showing:</h5>
              <ul className="space-y-2">
                {showDontTellAnalysis.tips.map((tip: string, i: number) => (
                  <li key={i} className="text-sm text-blue-800 dark:text-blue-200 flex items-start">
                    <span className="mr-2">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Next Steps */}
        {feedback.nextSteps.length > 0 && (
          <div className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h5 className="font-semibold text-green-900 dark:text-green-100 mb-3 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Recommended Next Steps
            </h5>
            <ol className="space-y-2">
              {feedback.nextSteps.map((step: string, i: number) => (
                <li key={i} className="text-sm text-green-800 dark:text-green-200 flex items-start">
                  <span className="font-bold mr-2">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
