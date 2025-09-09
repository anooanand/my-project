import React, { useState } from 'react';
import { CheckCircle, AlertCircle, TrendingUp, BookOpen, Edit3, Zap } from 'lucide-react';

interface NSWCriterion {
  name: string;
  weight: number;
  score: number;
  maxScore: number;
  strengths: string[];
  improvements: string[];
  specificExamples: string[];
  suggestions: string[];
}

interface NSWMarkingRubricProps {
  essay: string;
  feedbackData: {
    ideasAndContent: NSWCriterion;
    textStructure: NSWCriterion;
    languageFeatures: NSWCriterion;
    grammarAndPunctuation: NSWCriterion;
    overallScore: number;
    narrativeStructure: {
      orientation: boolean;
      complication: boolean;
      risingAction: boolean;
      climax: boolean;
      resolution: boolean;
      coda: boolean;
    };
    showDontTellAnalysis: {
      tellingInstances: Array<{text: string, suggestion: string}>;
      showingInstances: string[];
    };
    literaryDevices: {
      identified: string[];
      suggestions: string[];
    };
    sentenceVariety: {
      simple: number;
      compound: number;
      complex: number;
      suggestions: string[];
    };
  };
}

export function NSWMarkingRubric({ essay, feedbackData }: NSWMarkingRubricProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedCriterion, setExpandedCriterion] = useState<string | null>(null);

  const criteria = [
    { key: 'ideasAndContent', data: feedbackData.ideasAndContent, icon: BookOpen, color: 'blue' },
    { key: 'textStructure', data: feedbackData.textStructure, icon: Edit3, color: 'green' },
    { key: 'languageFeatures', data: feedbackData.languageFeatures, icon: Zap, color: 'purple' },
    { key: 'grammarAndPunctuation', data: feedbackData.grammarAndPunctuation, icon: CheckCircle, color: 'orange' }
  ];

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'text-green-600 bg-green-100';
    if (percentage >= 60) return 'text-blue-600 bg-blue-100';
    if (percentage >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getProgressColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-blue-500';
    if (percentage >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const CriterionCard = ({ criterion, data, icon: Icon, color }: any) => {
    const percentage = (data.score / data.maxScore) * 100;
    const isExpanded = expandedCriterion === criterion;

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 mb-4">
        <div 
          className="p-6 cursor-pointer"
          onClick={() => setExpandedCriterion(isExpanded ? null : criterion)}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Icon className={`w-6 h-6 text-${color}-600`} />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {data.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Weight: {data.weight}%
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(data.score, data.maxScore)}`}>
                {data.score}/{data.maxScore}
              </span>
              <svg 
                className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(data.score, data.maxScore)}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {percentage.toFixed(0)}% - {percentage >= 80 ? 'Excellent' : percentage >= 60 ? 'Good' : percentage >= 40 ? 'Satisfactory' : 'Needs Improvement'}
          </p>
        </div>

        {isExpanded && (
          <div className="px-6 pb-6 border-t border-gray-200 dark:border-gray-700">
            <div className="pt-4 space-y-4">
              {data.strengths.length > 0 && (
                <div>
                  <h4 className="flex items-center text-green-700 dark:text-green-400 font-medium mb-2">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Strengths
                  </h4>
                  <ul className="space-y-1">
                    {data.strengths.map((strength: string, index: number) => (
                      <li key={index} className="text-sm text-gray-700 dark:text-gray-300 pl-4 border-l-2 border-green-300">
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {data.improvements.length > 0 && (
                <div>
                  <h4 className="flex items-center text-orange-700 dark:text-orange-400 font-medium mb-2">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Areas for Improvement
                  </h4>
                  <ul className="space-y-1">
                    {data.improvements.map((improvement: string, index: number) => (
                      <li key={index} className="text-sm text-gray-700 dark:text-gray-300 pl-4 border-l-2 border-orange-300">
                        {improvement}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {data.specificExamples.length > 0 && (
                <div>
                  <h4 className="flex items-center text-blue-700 dark:text-blue-400 font-medium mb-2">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Specific Examples from Your Writing
                  </h4>
                  <ul className="space-y-2">
                    {data.specificExamples.map((example: string, index: number) => (
                      <li key={index} className="text-sm bg-blue-50 dark:bg-blue-900/20 p-3 rounded border-l-2 border-blue-300">
                        <code className="text-blue-800 dark:text-blue-300">{example}</code>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {data.suggestions.length > 0 && (
                <div>
                  <h4 className="flex items-center text-purple-700 dark:text-purple-400 font-medium mb-2">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Specific Suggestions
                  </h4>
                  <ul className="space-y-2">
                    {data.suggestions.map((suggestion: string, index: number) => (
                      <li key={index} className="text-sm text-gray-700 dark:text-gray-300 pl-4 border-l-2 border-purple-300 bg-purple-50 dark:bg-purple-900/20 p-3 rounded">
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const NarrativeStructureAnalysis = () => {
    const structure = feedbackData.narrativeStructure;
    const elements = [
      { key: 'orientation', label: 'Orientation (Setting the scene)', present: structure.orientation },
      { key: 'complication', label: 'Complication (Problem/conflict)', present: structure.complication },
      { key: 'risingAction', label: 'Rising Action (Building tension)', present: structure.risingAction },
      { key: 'climax', label: 'Climax (Turning point)', present: structure.climax },
      { key: 'resolution', label: 'Resolution (Problem solved)', present: structure.resolution },
      { key: 'coda', label: 'Coda (Reflection/ending)', present: structure.coda }
    ];

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Narrative Structure Analysis
        </h3>
        <div className="space-y-3">
          {elements.map((element) => (
            <div key={element.key} className="flex items-center space-x-3">
              {element.present ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <span className={`text-sm ${element.present ? 'text-gray-700 dark:text-gray-300' : 'text-red-600 dark:text-red-400'}`}>
                {element.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const ShowDontTellAnalysis = () => {
    const analysis = feedbackData.showDontTellAnalysis;

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          "Show, Don't Tell" Analysis
        </h3>
        
        {analysis.showingInstances.length > 0 && (
          <div className="mb-6">
            <h4 className="flex items-center text-green-700 dark:text-green-400 font-medium mb-3">
              <CheckCircle className="w-4 h-4 mr-2" />
              Great Examples of "Showing"
            </h4>
            <div className="space-y-2">
              {analysis.showingInstances.map((instance, index) => (
                <div key={index} className="bg-green-50 dark:bg-green-900/20 p-3 rounded border-l-4 border-green-400">
                  <code className="text-sm text-green-800 dark:text-green-300">{instance}</code>
                </div>
              ))}
            </div>
          </div>
        )}

        {analysis.tellingInstances.length > 0 && (
          <div>
            <h4 className="flex items-center text-orange-700 dark:text-orange-400 font-medium mb-3">
              <AlertCircle className="w-4 h-4 mr-2" />
              Opportunities to "Show" Instead of "Tell"
            </h4>
            <div className="space-y-4">
              {analysis.tellingInstances.map((instance, index) => (
                <div key={index} className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded border-l-4 border-orange-400">
                  <div className="mb-2">
                    <span className="text-sm font-medium text-orange-800 dark:text-orange-300">Current:</span>
                    <code className="block text-sm text-orange-700 dark:text-orange-300 mt-1">{instance.text}</code>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-green-800 dark:text-green-300">Suggestion:</span>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">{instance.suggestion}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const LiteraryDevicesAnalysis = () => {
    const devices = feedbackData.literaryDevices;

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Literary Devices Analysis
        </h3>
        
        {devices.identified.length > 0 && (
          <div className="mb-6">
            <h4 className="flex items-center text-green-700 dark:text-green-400 font-medium mb-3">
              <CheckCircle className="w-4 h-4 mr-2" />
              Literary Devices Found
            </h4>
            <div className="flex flex-wrap gap-2">
              {devices.identified.map((device, index) => (
                <span key={index} className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm">
                  {device}
                </span>
              ))}
            </div>
          </div>
        )}

        {devices.suggestions.length > 0 && (
          <div>
            <h4 className="flex items-center text-blue-700 dark:text-blue-400 font-medium mb-3">
              <TrendingUp className="w-4 h-4 mr-2" />
              Suggested Literary Devices to Try
            </h4>
            <div className="space-y-2">
              {devices.suggestions.map((suggestion, index) => (
                <div key={index} className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded border-l-4 border-blue-400">
                  <p className="text-sm text-blue-800 dark:text-blue-300">{suggestion}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const SentenceVarietyAnalysis = () => {
    const variety = feedbackData.sentenceVariety;
    const total = variety.simple + variety.compound + variety.complex;

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Sentence Variety Analysis
        </h3>
        
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{variety.simple}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Simple</div>
            <div className="text-xs text-gray-500">{((variety.simple / total) * 100).toFixed(0)}%</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{variety.compound}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Compound</div>
            <div className="text-xs text-gray-500">{((variety.compound / total) * 100).toFixed(0)}%</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{variety.complex}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Complex</div>
            <div className="text-xs text-gray-500">{((variety.complex / total) * 100).toFixed(0)}%</div>
          </div>
        </div>

        {variety.suggestions.length > 0 && (
          <div>
            <h4 className="flex items-center text-purple-700 dark:text-purple-400 font-medium mb-3">
              <TrendingUp className="w-4 h-4 mr-2" />
              Suggestions for Better Sentence Variety
            </h4>
            <div className="space-y-2">
              {variety.suggestions.map((suggestion, index) => (
                <div key={index} className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded border-l-4 border-purple-400">
                  <p className="text-sm text-purple-800 dark:text-purple-300">{suggestion}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6 mb-6">
        <h1 className="text-2xl font-bold mb-2">NSW Selective Writing Assessment</h1>
        <div className="flex items-center justify-between">
          <p className="text-blue-100">Detailed feedback based on official NSW marking criteria</p>
          <div className="text-right">
            <div className="text-3xl font-bold">{feedbackData.overallScore}%</div>
            <div className="text-sm text-blue-100">Overall Score</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mb-6">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'structure', label: 'Structure' },
          { id: 'techniques', label: 'Writing Techniques' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {criteria.map(({ key, data, icon, color }) => (
            <CriterionCard
              key={key}
              criterion={key}
              data={data}
              icon={icon}
              color={color}
            />
          ))}
        </div>
      )}

      {activeTab === 'structure' && (
        <div className="space-y-6">
          <NarrativeStructureAnalysis />
        </div>
      )}

      {activeTab === 'techniques' && (
        <div className="space-y-6">
          <ShowDontTellAnalysis />
          <LiteraryDevicesAnalysis />
          <SentenceVarietyAnalysis />
        </div>
      )}
    </div>
  );
}
