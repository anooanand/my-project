// NSW Selective Test Writing Analyzer Component

import React, { useMemo } from 'react';
import { AlertCircle, CheckCircle, Lightbulb, Target, TrendingUp, BookOpen } from 'lucide-react';
import { NSWWritingAnalysis, WritingMetrics } from './grammarTypes';

interface NSWWritingAnalyzerProps {
  analysis: NSWWritingAnalysis;
  metrics: WritingMetrics;
  textType?: string;
  className?: string;
}

interface CriteriaFeedback {
  criterion: string;
  score: number;
  maxScore: number;
  feedback: string;
  suggestions: string[];
  color: string;
}

export const NSWWritingAnalyzer: React.FC<NSWWritingAnalyzerProps> = ({
  analysis,
  metrics,
  textType = 'general',
  className = ''
}) => {
  const criteriaFeedback = useMemo(() => {
    const feedback: CriteriaFeedback[] = [
      {
        criterion: 'Ideas and Content',
        score: analysis.overallScore.ideas,
        maxScore: 30,
        feedback: generateIdeasFeedback(analysis.overallScore.ideas, metrics, textType),
        suggestions: generateIdeasSuggestions(analysis.overallScore.ideas, metrics, textType),
        color: getScoreColor(analysis.overallScore.ideas, 30)
      },
      {
        criterion: 'Text Structure and Organization',
        score: analysis.overallScore.structure,
        maxScore: 25,
        feedback: generateStructureFeedback(analysis.overallScore.structure, analysis.sentenceStructureIssues, metrics),
        suggestions: generateStructureSuggestions(analysis.overallScore.structure, analysis.sentenceStructureIssues),
        color: getScoreColor(analysis.overallScore.structure, 25)
      },
      {
        criterion: 'Language Features and Vocabulary',
        score: analysis.overallScore.language,
        maxScore: 25,
        feedback: generateLanguageFeedback(analysis.overallScore.language, analysis.vocabularyEnhancements, metrics),
        suggestions: generateLanguageSuggestions(analysis.vocabularyEnhancements, metrics),
        color: getScoreColor(analysis.overallScore.language, 25)
      },
      {
        criterion: 'Grammar, Punctuation, Spelling',
        score: analysis.overallScore.accuracy,
        maxScore: 20,
        feedback: generateAccuracyFeedback(analysis.overallScore.accuracy, analysis.grammarErrors),
        suggestions: generateAccuracySuggestions(analysis.grammarErrors),
        color: getScoreColor(analysis.overallScore.accuracy, 20)
      }
    ];

    return feedback;
  }, [analysis, metrics, textType]);

  const overallGrade = useMemo(() => {
    const percentage = (analysis.overallScore.total / 100) * 100;
    if (percentage >= 85) return { grade: 'A', description: 'Excellent' };
    if (percentage >= 75) return { grade: 'B', description: 'Good' };
    if (percentage >= 65) return { grade: 'C', description: 'Satisfactory' };
    if (percentage >= 50) return { grade: 'D', description: 'Needs Improvement' };
    return { grade: 'E', description: 'Requires Significant Work' };
  }, [analysis.overallScore.total]);

  const textTypeGuidance = useMemo(() => {
    return getTextTypeGuidance(textType);
  }, [textType]);

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      {/* Overall Score Header */}
      <div className="mb-6 text-center">
        <div className="flex items-center justify-center mb-2">
          <Target className="w-6 h-6 text-blue-600 mr-2" />
          <h2 className="text-2xl font-bold text-gray-800">NSW Selective Test Analysis</h2>
        </div>
        <div className="flex items-center justify-center space-x-4">
          <div className="text-4xl font-bold text-blue-600">
            {analysis.overallScore.total}/100
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${getGradeColor(overallGrade.grade)}`}>
              {overallGrade.grade}
            </div>
            <div className="text-sm text-gray-600">{overallGrade.description}</div>
          </div>
        </div>
      </div>

      {/* Criteria Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {criteriaFeedback.map((criteria, index) => (
          <div key={index} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-800">{criteria.criterion}</h3>
              <div className={`text-lg font-bold ${criteria.color}`}>
                {criteria.score}/{criteria.maxScore}
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${criteria.color.replace('text-', 'bg-')}`}
                style={{ width: `${(criteria.score / criteria.maxScore) * 100}%` }}
              />
            </div>
            
            <p className="text-sm text-gray-600 mb-2">{criteria.feedback}</p>
            
            {criteria.suggestions.length > 0 && (
              <div className="mt-2">
                <div className="flex items-center mb-1">
                  <Lightbulb className="w-4 h-4 text-yellow-500 mr-1" />
                  <span className="text-xs font-medium text-gray-700">Suggestions:</span>
                </div>
                <ul className="text-xs text-gray-600 space-y-1">
                  {criteria.suggestions.slice(0, 2).map((suggestion, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-yellow-500 mr-1">•</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Text Type Specific Guidance */}
      {textTypeGuidance && (
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <div className="flex items-center mb-2">
            <BookOpen className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="font-semibold text-blue-800">
              {textType.charAt(0).toUpperCase() + textType.slice(1)} Writing Tips
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-blue-700 mb-1">Key Elements:</h4>
              <ul className="text-blue-600 space-y-1">
                {textTypeGuidance.elements.map((element, idx) => (
                  <li key={idx} className="flex items-start">
                    <CheckCircle className="w-3 h-3 text-green-500 mr-1 mt-0.5 flex-shrink-0" />
                    {element}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-700 mb-1">Language Features:</h4>
              <ul className="text-blue-600 space-y-1">
                {textTypeGuidance.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    <TrendingUp className="w-3 h-3 text-blue-500 mr-1 mt-0.5 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Strengths and Improvements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strengths */}
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <h3 className="font-semibold text-green-800">Strengths</h3>
          </div>
          {analysis.strengths.length > 0 ? (
            <ul className="text-sm text-green-700 space-y-1">
              {analysis.strengths.map((strength, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="text-green-500 mr-1">✓</span>
                  {strength}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-green-600">Keep writing to identify your strengths!</p>
          )}
        </div>

        {/* Areas for Improvement */}
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <AlertCircle className="w-5 h-5 text-orange-600 mr-2" />
            <h3 className="font-semibold text-orange-800">Areas for Improvement</h3>
          </div>
          {analysis.improvements.length > 0 ? (
            <ul className="text-sm text-orange-700 space-y-1">
              {analysis.improvements.map((improvement, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="text-orange-500 mr-1">→</span>
                  {improvement}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-orange-600">Great work! No major areas for improvement identified.</p>
          )}
        </div>
      </div>

      {/* Writing Metrics Summary */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-800 mb-3">Writing Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">{metrics.wordCount}</div>
            <div className="text-gray-600">Words</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">{metrics.sophisticationScore}%</div>
            <div className="text-gray-600">Sophistication</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">{metrics.vocabularyDiversity}%</div>
            <div className="text-gray-600">Vocabulary Diversity</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-orange-600">{metrics.readabilityScore}</div>
            <div className="text-gray-600">Readability</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper functions
function generateIdeasFeedback(score: number, metrics: WritingMetrics, textType: string): string {
  if (score >= 25) return `Excellent content development with creative and original ideas appropriate for ${textType} writing.`;
  if (score >= 20) return `Good ideas with room for more creativity and depth in your ${textType} piece.`;
  if (score >= 15) return `Basic ideas present but need more development and originality for ${textType} writing.`;
  return `Ideas need significant development. Focus on creativity and relevance to the ${textType} format.`;
}

function generateIdeasSuggestions(score: number, metrics: WritingMetrics, textType: string): string[] {
  const suggestions = [];
  if (score < 25) suggestions.push('Add more creative and original ideas');
  if (score < 20) suggestions.push('Develop ideas with specific examples and details');
  if (metrics.wordCount < 200) suggestions.push('Expand your content with more substantial ideas');
  return suggestions;
}

function generateStructureFeedback(score: number, issues: any[], metrics: WritingMetrics): string {
  if (score >= 20) return 'Excellent organization with clear structure and logical flow.';
  if (score >= 15) return 'Good structure with minor issues in organization or flow.';
  if (score >= 10) return 'Basic structure present but needs improvement in logical organization.';
  return 'Structure needs significant work. Focus on clear paragraphing and logical flow.';
}

function generateStructureSuggestions(score: number, issues: any[]): string[] {
  const suggestions = [];
  if (score < 20) suggestions.push('Improve paragraph organization and transitions');
  if (issues.length > 2) suggestions.push('Vary sentence structures for better flow');
  if (score < 15) suggestions.push('Use clear topic sentences for each paragraph');
  return suggestions;
}

function generateLanguageFeedback(score: number, enhancements: any[], metrics: WritingMetrics): string {
  if (score >= 20) return 'Excellent use of sophisticated vocabulary and varied language features.';
  if (score >= 15) return 'Good language use with opportunities for more sophisticated vocabulary.';
  if (score >= 10) return 'Basic language use. Consider using more varied and sophisticated vocabulary.';
  return 'Language needs improvement. Focus on vocabulary variety and sophistication.';
}

function generateLanguageSuggestions(enhancements: any[], metrics: WritingMetrics): string[] {
  const suggestions = [];
  if (enhancements.length > 3) suggestions.push('Use more sophisticated vocabulary alternatives');
  if (metrics.vocabularyDiversity < 60) suggestions.push('Increase vocabulary variety');
  if (metrics.sophisticationScore < 15) suggestions.push('Include more advanced vocabulary');
  return suggestions;
}

function generateAccuracyFeedback(score: number, errors: any[]): string {
  if (score >= 18) return 'Excellent accuracy with minimal grammar, spelling, or punctuation errors.';
  if (score >= 15) return 'Good accuracy with few minor errors that don\'t impede understanding.';
  if (score >= 10) return 'Some errors present that may affect readability. Focus on proofreading.';
  return 'Multiple errors affecting readability. Careful proofreading needed.';
}

function generateAccuracySuggestions(errors: any[]): string[] {
  const suggestions = [];
  const spellingErrors = errors.filter(e => e.type === 'spelling').length;
  const grammarErrors = errors.filter(e => e.type === 'grammar').length;
  
  if (spellingErrors > 2) suggestions.push('Double-check spelling of key words');
  if (grammarErrors > 2) suggestions.push('Review grammar rules and sentence construction');
  if (errors.length > 5) suggestions.push('Proofread carefully before submitting');
  return suggestions;
}

function getScoreColor(score: number, maxScore: number): string {
  const percentage = (score / maxScore) * 100;
  if (percentage >= 85) return 'text-green-600';
  if (percentage >= 70) return 'text-blue-600';
  if (percentage >= 50) return 'text-yellow-600';
  return 'text-red-600';
}

function getGradeColor(grade: string): string {
  switch (grade) {
    case 'A': return 'text-green-600';
    case 'B': return 'text-blue-600';
    case 'C': return 'text-yellow-600';
    case 'D': return 'text-orange-600';
    default: return 'text-red-600';
  }
}

function getTextTypeGuidance(textType: string) {
  const guidance: Record<string, { elements: string[]; features: string[] }> = {
    narrative: {
      elements: ['Clear plot structure', 'Character development', 'Setting description', 'Conflict and resolution'],
      features: ['Descriptive language', 'Dialogue', 'Varied sentence types', 'Temporal connectives']
    },
    persuasive: {
      elements: ['Clear position/thesis', 'Supporting arguments', 'Counter-arguments', 'Strong conclusion'],
      features: ['Persuasive language', 'Evidence and examples', 'Logical connectives', 'Rhetorical questions']
    },
    expository: {
      elements: ['Clear topic introduction', 'Logical organization', 'Supporting details', 'Informative conclusion'],
      features: ['Formal language', 'Technical vocabulary', 'Explanatory phrases', 'Sequential connectives']
    },
    descriptive: {
      elements: ['Vivid imagery', 'Sensory details', 'Spatial organization', 'Focused description'],
      features: ['Adjectives and adverbs', 'Figurative language', 'Varied sentence beginnings', 'Spatial connectives']
    },
    recount: {
      elements: ['Chronological order', 'Personal experience', 'Specific details', 'Reflective conclusion'],
      features: ['Past tense', 'First person', 'Time connectives', 'Descriptive language']
    }
  };

  return guidance[textType] || null;
}

export default NSWWritingAnalyzer;
