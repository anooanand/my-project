import React from 'react';
import { Award, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';
import { NSW_MARKING_CRITERIA, generateScoringGuidance, type ScoringGuidance } from '../lib/nswMarkingCriteria';

interface NSWCriteriaDisplayProps {
  scores: {
    IDEAS_CONTENT: number;
    STRUCTURE_ORGANIZATION: number;
    VOCABULARY_LANGUAGE: number;
    GRAMMAR_MECHANICS: number;
  };
  wordCount: number;
  showDetailed?: boolean;
}

/**
 * Display NSW Marking Criteria with explicit references and scoring guidance
 */
export function NSWCriteriaDisplay({ scores, wordCount, showDetailed = false }: NSWCriteriaDisplayProps) {
  const criteriaKeys = Object.keys(scores) as Array<keyof typeof scores>;

  const getLevelColor = (level: number) => {
    if (level >= 4) return 'bg-green-100 border-green-500 text-green-800';
    if (level >= 3) return 'bg-blue-100 border-blue-500 text-blue-800';
    if (level >= 2) return 'bg-yellow-100 border-yellow-500 text-yellow-800';
    return 'bg-red-100 border-red-500 text-red-800';
  };

  const getLevelIcon = (level: number) => {
    if (level >= 4) return <Award className="w-4 h-4" />;
    if (level >= 3) return <CheckCircle className="w-4 h-4" />;
    if (level >= 2) return <TrendingUp className="w-4 h-4" />;
    return <AlertCircle className="w-4 h-4" />;
  };

  const getLevelName = (level: number) => {
    if (level >= 4) return 'Extensive';
    if (level >= 3) return 'Sound';
    if (level >= 2) return 'Basic';
    return 'Limited';
  };

  return (
    <div className="space-y-3">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center space-x-2 mb-2">
          <Award className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-sm text-blue-900">NSW Selective Schools Marking Criteria</h3>
        </div>
        <p className="text-xs text-blue-800 mb-2">
          Your writing is assessed on 4 official NSW criteria. Each criterion is marked on a scale of 1-4.
        </p>
      </div>

      {criteriaKeys.map((key) => {
        const criterion = NSW_MARKING_CRITERIA[key];
        const score = scores[key];
        const levelData = criterion.levels.find(l => l.level === score);
        const guidance = generateScoringGuidance(key, score, `This shows your current performance level.`);

        return (
          <div key={key} className={`border-l-4 rounded-lg p-3 ${getLevelColor(score)}`}>
            {/* Header with Score */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                {getLevelIcon(score)}
                <div>
                  <h4 className="font-bold text-sm">
                    {criterion.name}
                  </h4>
                  <p className="text-xs opacity-75">NSW Code: {criterion.code}</p>
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{score}</div>
                <div className="text-xs font-medium">{getLevelName(score)}</div>
              </div>
            </div>

            {/* Current Level Description */}
            {levelData && (
              <div className="bg-white bg-opacity-50 rounded p-2 mb-2">
                <p className="text-xs font-semibold mb-1">📊 Level {score} Descriptor:</p>
                <p className="text-xs">{levelData.descriptor}</p>
              </div>
            )}

            {/* Scoring Guidance */}
            {guidance && showDetailed && (
              <div className="space-y-2 mt-2">
                <div className="bg-white bg-opacity-60 rounded p-2">
                  <p className="text-xs font-semibold mb-1">✅ What You're Doing:</p>
                  <p className="text-xs">{guidance.whatYouDid}</p>
                </div>

                {score < 4 && (
                  <>
                    <div className="bg-white bg-opacity-60 rounded p-2">
                      <p className="text-xs font-semibold mb-1">🎯 To Reach Level {guidance.targetLevel}:</p>
                      <p className="text-xs">{guidance.howToImprove}</p>
                    </div>

                    {/* Specific Examples */}
                    {levelData && levelData.examples && levelData.examples.length > 0 && (
                      <div className="bg-white bg-opacity-60 rounded p-2">
                        <p className="text-xs font-semibold mb-1">💡 Examples at Level {score}:</p>
                        <ul className="text-xs space-y-1 ml-3">
                          {levelData.examples.slice(0, 3).map((example, idx) => (
                            <li key={idx} className="list-disc">{example}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Quick Tips for Lower Scores */}
            {!showDetailed && score < 3 && (
              <div className="mt-2 bg-white bg-opacity-60 rounded p-2">
                <p className="text-xs font-semibold">💡 Quick Tip:</p>
                <p className="text-xs">{guidance?.howToImprove || 'Keep developing your writing skills!'}</p>
              </div>
            )}
          </div>
        );
      })}

      {/* Overall Score Summary */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-sm text-purple-900">Overall Writing Score</h4>
            <p className="text-xs text-purple-700">Average across all NSW criteria</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-900">
              {(Object.values(scores).reduce((a, b) => a + b, 0) / 4).toFixed(1)}
            </div>
            <div className="text-xs text-purple-700">out of 4.0</div>
          </div>
        </div>
      </div>

      {/* Help Text */}
      <div className="bg-gray-50 border border-gray-200 rounded p-2">
        <p className="text-xs text-gray-700">
          <strong>About NSW Marking:</strong> NSW markers use these exact criteria to assess your writing.
          Focus on improving your lowest-scoring areas first to boost your overall mark.
        </p>
      </div>
    </div>
  );
}

/**
 * Compact version for inline display
 */
export function NSWCriteriaCompact({ scores }: { scores: NSWCriteriaDisplayProps['scores'] }) {
  const averageScore = (Object.values(scores).reduce((a, b) => a + b, 0) / 4).toFixed(1);

  return (
    <div className="flex items-center space-x-3 bg-blue-50 border border-blue-200 rounded-lg p-2">
      <Award className="w-5 h-5 text-blue-600 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-xs font-semibold text-blue-900">NSW Criteria Score</p>
        <p className="text-xs text-blue-700">Based on official marking rubric</p>
      </div>
      <div className="text-center">
        <div className="text-xl font-bold text-blue-900">{averageScore}</div>
        <div className="text-xs text-blue-700">/ 4.0</div>
      </div>
    </div>
  );
}

/**
 * Individual criterion card with detailed guidance
 */
export function NSWCriterionCard({
  criterionKey,
  score,
  evidence
}: {
  criterionKey: string;
  score: number;
  evidence: string;
}) {
  const criterion = NSW_MARKING_CRITERIA[criterionKey];
  if (!criterion) return null;

  const levelData = criterion.levels.find(l => l.level === score);
  const guidance = generateScoringGuidance(criterionKey, score, evidence);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-base text-gray-900">{criterion.name}</h3>
          <p className="text-xs text-gray-600">NSW Code: {criterion.code} | {criterion.description}</p>
        </div>
        <div className="text-center bg-blue-100 rounded px-3 py-1">
          <div className="text-2xl font-bold text-blue-900">{score}</div>
          <div className="text-xs text-blue-700">/ 4</div>
        </div>
      </div>

      {levelData && (
        <div className="bg-gray-50 rounded p-3 mb-3">
          <p className="text-sm font-semibold text-gray-800 mb-2">Level {score}: {levelData.descriptor}</p>
          {evidence && (
            <p className="text-xs text-gray-700 mb-2">
              <strong>Evidence:</strong> {evidence}
            </p>
          )}
        </div>
      )}

      {guidance && score < 4 && (
        <div className="space-y-2">
          <div className="border-l-4 border-green-500 bg-green-50 p-2 rounded">
            <p className="text-xs font-semibold text-green-900 mb-1">🎯 Path to Level {guidance.targetLevel}</p>
            <p className="text-xs text-green-800">{guidance.howToImprove}</p>
          </div>

          {levelData && levelData.examples && levelData.examples.length > 0 && (
            <div className="border border-gray-200 rounded p-2">
              <p className="text-xs font-semibold text-gray-800 mb-1">💡 What Level {guidance.targetLevel} looks like:</p>
              <ul className="text-xs text-gray-700 space-y-1 ml-3">
                {criterion.levels.find(l => l.level === guidance.targetLevel)?.examples.slice(0, 3).map((example, idx) => (
                  <li key={idx} className="list-disc">{example}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
