import React from "react";
import type { DetailedFeedback, LintFix } from "../types/feedback";
import { Star, BarChart3, CheckCircle, AlertCircle, Target, TrendingUp } from 'lucide-react';

interface Props {
  data: DetailedFeedback;
  onApplyFix: (fix: LintFix) => void;
}

function ScoreBar({ label, score, maxScore = 5, weight }: { label: string; score: number; maxScore?: number; weight: number }) {
  const percentage = (score / maxScore) * 100;
  const getColor = (score: number, max: number) => {
    const ratio = score / max;
    if (ratio >= 0.8) return 'bg-green-500';
    if (ratio >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="font-medium text-sm">{label}</span>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-semibold">{score}/{maxScore}</span>
          <span className="text-xs text-gray-600">({weight}%)</span>
        </div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className={`h-3 rounded-full transition-all duration-500 ${getColor(score, maxScore)}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function CriterionDetail({ title, criterion, onApplyFix }: { 
  title: string; 
  criterion: any; 
  onApplyFix: (fix: LintFix) => void;
}) {
  return (
    <div className="border rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-lg">{title}</h4>
        <div className="flex items-center space-x-2">
          <span className="text-2xl font-bold text-blue-600">{criterion.score}</span>
          <span className="text-gray-500">/5</span>
        </div>
      </div>

      {/* Strengths */}
      {criterion.strengths && criterion.strengths.length > 0 && (
        <div className="mb-3">
          <h5 className="font-medium text-green-700 mb-2 flex items-center">
            <CheckCircle className="w-4 h-4 mr-1" />
            Strengths
          </h5>
          <ul className="space-y-1">
            {criterion.strengths.map((strength: any, index: number) => (
              <li key={index} className="text-sm text-green-800 bg-green-50 p-2 rounded">
                • {strength.text}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Areas for Improvement */}
      {criterion.improvements && criterion.improvements.length > 0 && (
        <div className="mb-3">
          <h5 className="font-medium text-orange-700 mb-2 flex items-center">
            <Target className="w-4 h-4 mr-1" />
            Areas for Improvement
          </h5>
          <div className="space-y-2">
            {criterion.improvements.map((improvement: any, index: number) => (
              <div key={index} className="bg-orange-50 p-3 rounded">
                <p className="text-sm font-medium text-orange-800 mb-1">{improvement.issue}</p>
                <p className="text-sm text-orange-700 mb-2">{improvement.suggestion}</p>
                {improvement.evidence && (
                  <p className="text-xs text-gray-600 italic">
                    Example: "{improvement.evidence.text}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function RubricPanel({ data, onApplyFix }: Props) {
  const c = data.criteria;
  
  // Calculate grade based on overall score
  const getGrade = (score: number) => {
    if (score >= 90) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 80) return 'A-';
    if (score >= 75) return 'B+';
    if (score >= 70) return 'B';
    if (score >= 65) return 'B-';
    if (score >= 60) return 'C+';
    if (score >= 55) return 'C';
    if (score >= 50) return 'C-';
    return 'D';
  };

  const getGradeColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 65) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto">
      {/* Header - NSW Selective Writing Assessment */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-lg">
        <h2 className="text-xl font-bold mb-2">NSW Selective Writing Assessment</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100">Overall Score</p>
            <div className="flex items-center space-x-2">
              <span className="text-3xl font-bold">{data.overallScore}</span>
              <span className="text-blue-200">/100</span>
              <span className={`text-2xl font-bold ${getGradeColor(data.overallScore)}`}>
                {getGrade(data.overallScore)}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-blue-100 text-sm">Assessment ID</p>
            <p className="text-xs text-blue-200">{data.id}</p>
            {data.modelVersion && (
              <p className="text-xs text-blue-200 mt-1">Model: {data.modelVersion}</p>
            )}
          </div>
        </div>
      </div>

      {/* Criteria Scores Overview */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-4 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2" />
          Assessment Criteria
        </h3>
        <ScoreBar 
          label="Ideas & Content" 
          score={c.ideasContent.score} 
          weight={c.ideasContent.weight}
        />
        <ScoreBar 
          label="Structure & Organization" 
          score={c.structureOrganization.score} 
          weight={c.structureOrganization.weight}
        />
        <ScoreBar 
          label="Language & Vocabulary" 
          score={c.languageVocab.score} 
          weight={c.languageVocab.weight}
        />
        <ScoreBar 
          label="Spelling, Punctuation & Grammar" 
          score={c.spellingPunctuationGrammar.score} 
          weight={c.spellingPunctuationGrammar.weight}
        />
      </div>

      {/* Detailed Criterion Feedback */}
      <div>
        <h3 className="font-semibold mb-4 flex items-center">
          <Star className="w-5 h-5 mr-2" />
          Detailed Feedback
        </h3>
        
        <CriterionDetail 
          title="Ideas & Content" 
          criterion={c.ideasContent} 
          onApplyFix={onApplyFix}
        />
        
        <CriterionDetail 
          title="Structure & Organization" 
          criterion={c.structureOrganization} 
          onApplyFix={onApplyFix}
        />
        
        <CriterionDetail 
          title="Language & Vocabulary" 
          criterion={c.languageVocab} 
          onApplyFix={onApplyFix}
        />
        
        <CriterionDetail 
          title="Spelling, Punctuation & Grammar" 
          criterion={c.spellingPunctuationGrammar} 
          onApplyFix={onApplyFix}
        />
      </div>

      {/* Narrative Structure (if applicable) */}
      {data.narrativeStructure && (
        <div className="border rounded-lg p-4">
          <h4 className="font-semibold mb-3 flex items-center">
            <TrendingUp className="w-4 h-4 mr-2" />
            Narrative Structure Analysis
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className={`p-2 rounded ${data.narrativeStructure.orientationPresent ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              <span className="font-medium">Orientation:</span> {data.narrativeStructure.orientationPresent ? '✓ Present' : '✗ Missing'}
            </div>
            <div className={`p-2 rounded ${data.narrativeStructure.complicationPresent ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              <span className="font-medium">Complication:</span> {data.narrativeStructure.complicationPresent ? '✓ Present' : '✗ Missing'}
            </div>
            <div className={`p-2 rounded ${data.narrativeStructure.climaxPresent ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              <span className="font-medium">Climax:</span> {data.narrativeStructure.climaxPresent ? '✓ Present' : '✗ Missing'}
            </div>
            <div className={`p-2 rounded ${data.narrativeStructure.resolutionPresent ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              <span className="font-medium">Resolution:</span> {data.narrativeStructure.resolutionPresent ? '✓ Present' : '✗ Missing'}
            </div>
          </div>
          {data.narrativeStructure.notes && (
            <p className="mt-3 text-sm text-gray-700 bg-gray-50 p-2 rounded">
              <strong>Notes:</strong> {data.narrativeStructure.notes}
            </p>
          )}
        </div>
      )}

      {/* Grammar & Vocabulary Fixes */}
      {(data.grammarCorrections.length > 0 || data.vocabularyEnhancements.length > 0) && (
        <div className="border rounded-lg p-4">
          <h4 className="font-semibold mb-3 flex items-center">
            <AlertCircle className="w-4 h-4 mr-2" />
            Suggested Improvements
          </h4>
          <div className="space-y-3">
            {[...data.grammarCorrections, ...data.vocabularyEnhancements].map((fix, index) => (
              <div key={index} className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <p className="font-medium text-blue-900">"{fix.original}" → "{fix.replacement}"</p>
                    <p className="text-sm text-blue-700 mt-1">{fix.explanation}</p>
                  </div>
                  <button
                    className="ml-3 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                    onClick={() => onApplyFix(fix)}
                  >
                    Apply Fix
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Summary */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border">
        <h4 className="font-semibold mb-2">Assessment Summary</h4>
        <p className="text-sm text-gray-700 mb-2">
          This assessment evaluates your writing against NSW Selective School criteria. 
          Focus on the improvement areas highlighted above to enhance your writing skills.
        </p>
        {data.timings?.modelLatencyMs && (
          <p className="text-xs text-gray-500">
            Analysis completed in {data.timings.modelLatencyMs}ms
          </p>
        )}
      </div>
    </div>
  );
}
