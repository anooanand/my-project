import React from 'react';
import { Award, BarChart3, CheckCircle, AlertCircle, Target, Lightbulb, Download, FileText, TrendingUp, Star } from 'lucide-react';

interface EvaluationReport {
  overallScore: number;
  overallGrade: string;
  domains: {
    contentAndIdeas: DomainScore;
    textStructure: DomainScore;
    languageFeatures: DomainScore;
    spellingAndGrammar: DomainScore;
  };
  detailedFeedback: DetailedFeedback;
  recommendations: string[];
  strengths: string[];
  areasForImprovement: string[];
}

interface DomainScore {
  score: number;
  maxScore: number;
  percentage: number;
  band: string;
  weight: number;
  weightedScore: number;
  feedback: string[];
  specificExamples: string[];
}

interface DetailedFeedback {
  wordCount: number;
  sentenceVariety: {
    simple: number;
    compound: number;
    complex: number;
    analysis: string;
  };
  vocabularyAnalysis: {
    sophisticatedWords: string[];
    repetitiveWords: string[];
    suggestions: string[];
  };
  literaryDevices: {
    identified: string[];
    suggestions: string[];
  };
  structuralElements: {
    hasIntroduction: boolean;
    hasConclusion: boolean;
    paragraphCount: number;
    coherence: string;
  };
  technicalAccuracy: {
    spellingErrors: number;
    grammarIssues: string[];
    punctuationIssues: string[];
  };
}

interface NSWEvaluationReportDisplayProps {
  report: EvaluationReport;
  essayText: string;
  onClose?: () => void;
}

export function NSWEvaluationReportDisplay({ report, essayText, onClose }: NSWEvaluationReportDisplayProps) {
  const getScoreColor = (score: number) => {
    if (score >= 9) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 7) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 5) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (score >= 3) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-green-600 bg-green-100';
    if (grade.startsWith('B')) return 'text-blue-600 bg-blue-100';
    if (grade.startsWith('C')) return 'text-yellow-600 bg-yellow-100';
    if (grade.startsWith('D')) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const downloadReport = () => {
    const reportContent = generateReportText(report, essayText);
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NSW_Writing_Evaluation_Report_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">NSW Selective Writing Evaluation Report</h1>
            <p className="text-blue-100">Comprehensive assessment based on official NSW criteria</p>
          </div>
          <div className="text-right">
            <div className={`inline-flex items-center px-4 py-2 rounded-lg font-bold text-2xl ${getGradeColor(report.overallGrade)}`}>
              <Award className="w-6 h-6 mr-2" />
              {report.overallGrade}
            </div>
            <div className="text-blue-100 mt-1">
              {report.overallScore}/100
            </div>
          </div>
        </div>
      </div>

      {/* Overall Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center mb-4">
            <Target className="w-6 h-6 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Overall Performance</h3>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {report.overallScore}%
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            Grade: <span className="font-semibold">{report.overallGrade}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center mb-4">
            <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Strengths</h3>
          </div>
          <div className="text-2xl font-bold text-green-600 mb-2">
            {report.strengths.length}
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            Key strengths identified
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center mb-4">
            <TrendingUp className="w-6 h-6 text-orange-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Growth Areas</h3>
          </div>
          <div className="text-2xl font-bold text-orange-600 mb-2">
            {report.areasForImprovement.length}
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            Areas for improvement
          </div>
        </div>
      </div>

      {/* Domain Scores */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
          <BarChart3 className="w-6 h-6 mr-2" />
          Assessment Domains
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Content & Ideas */}
          <div className={`border rounded-lg p-4 ${getScoreColor(report.domains.contentAndIdeas.score)}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg">Content & Ideas</h3>
              <div className="flex items-center">
                <span className="text-2xl font-bold mr-2">{report.domains.contentAndIdeas.score}/10</span>
                <span className="text-sm">({report.domains.contentAndIdeas.weight}%)</span>
              </div>
            </div>
            <div className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span>Performance</span>
                <span>{report.domains.contentAndIdeas.percentage.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-current h-2 rounded-full" 
                  style={{ width: `${report.domains.contentAndIdeas.percentage}%` }}
                ></div>
              </div>
            </div>
            <div className="text-sm font-medium mb-2">
              Band: {report.domains.contentAndIdeas.band}
            </div>
            <div className="text-sm space-y-1">
              {report.domains.contentAndIdeas.feedback.slice(0, 2).map((feedback, index) => (
                <div key={index}>• {feedback}</div>
              ))}
            </div>
          </div>

          {/* Text Structure */}
          <div className={`border rounded-lg p-4 ${getScoreColor(report.domains.textStructure.score)}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg">Text Structure</h3>
              <div className="flex items-center">
                <span className="text-2xl font-bold mr-2">{report.domains.textStructure.score}/10</span>
                <span className="text-sm">({report.domains.textStructure.weight}%)</span>
              </div>
            </div>
            <div className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span>Performance</span>
                <span>{report.domains.textStructure.percentage.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-current h-2 rounded-full" 
                  style={{ width: `${report.domains.textStructure.percentage}%` }}
                ></div>
              </div>
            </div>
            <div className="text-sm font-medium mb-2">
              Band: {report.domains.textStructure.band}
            </div>
            <div className="text-sm space-y-1">
              {report.domains.textStructure.feedback.slice(0, 2).map((feedback, index) => (
                <div key={index}>• {feedback}</div>
              ))}
            </div>
          </div>

          {/* Language Features */}
          <div className={`border rounded-lg p-4 ${getScoreColor(report.domains.languageFeatures.score)}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg">Language Features</h3>
              <div className="flex items-center">
                <span className="text-2xl font-bold mr-2">{report.domains.languageFeatures.score}/10</span>
                <span className="text-sm">({report.domains.languageFeatures.weight}%)</span>
              </div>
            </div>
            <div className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span>Performance</span>
                <span>{report.domains.languageFeatures.percentage.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-current h-2 rounded-full" 
                  style={{ width: `${report.domains.languageFeatures.percentage}%` }}
                ></div>
              </div>
            </div>
            <div className="text-sm font-medium mb-2">
              Band: {report.domains.languageFeatures.band}
            </div>
            <div className="text-sm space-y-1">
              {report.domains.languageFeatures.feedback.slice(0, 2).map((feedback, index) => (
                <div key={index}>• {feedback}</div>
              ))}
            </div>
          </div>

          {/* Spelling & Grammar */}
          <div className={`border rounded-lg p-4 ${getScoreColor(report.domains.spellingAndGrammar.score)}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg">Spelling & Grammar</h3>
              <div className="flex items-center">
                <span className="text-2xl font-bold mr-2">{report.domains.spellingAndGrammar.score}/10</span>
                <span className="text-sm">({report.domains.spellingAndGrammar.weight}%)</span>
              </div>
            </div>
            <div className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span>Performance</span>
                <span>{report.domains.spellingAndGrammar.percentage.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-current h-2 rounded-full" 
                  style={{ width: `${report.domains.spellingAndGrammar.percentage}%` }}
                ></div>
              </div>
            </div>
            <div className="text-sm font-medium mb-2">
              Band: {report.domains.spellingAndGrammar.band}
            </div>
            <div className="text-sm space-y-1">
              {report.domains.spellingAndGrammar.feedback.slice(0, 2).map((feedback, index) => (
                <div key={index}>• {feedback}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Strengths */}
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 p-6">
          <h3 className="text-xl font-bold text-green-800 dark:text-green-200 mb-4 flex items-center">
            <Star className="w-5 h-5 mr-2" />
            Key Strengths
          </h3>
          <div className="space-y-2">
            {report.strengths.map((strength, index) => (
              <div key={index} className="flex items-start">
                <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-green-800 dark:text-green-200">{strength}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Areas for Improvement */}
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800 p-6">
          <h3 className="text-xl font-bold text-orange-800 dark:text-orange-200 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Areas for Growth
          </h3>
          <div className="space-y-2">
            {report.areasForImprovement.map((area, index) => (
              <div key={index} className="flex items-start">
                <AlertCircle className="w-4 h-4 text-orange-600 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-orange-800 dark:text-orange-200">{area}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6 mb-8">
        <h3 className="text-xl font-bold text-blue-800 dark:text-blue-200 mb-4 flex items-center">
          <Lightbulb className="w-5 h-5 mr-2" />
          Recommendations for Improvement
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {report.recommendations.map((recommendation, index) => (
            <div key={index} className="flex items-start">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">
                {index + 1}
              </div>
              <span className="text-blue-800 dark:text-blue-200">{recommendation}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Technical Details */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          Technical Analysis
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Writing Statistics</h4>
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <div>Word Count: {report.detailedFeedback.wordCount}</div>
              <div>Paragraphs: {report.detailedFeedback.structuralElements.paragraphCount}</div>
              <div>Introduction: {report.detailedFeedback.structuralElements.hasIntroduction ? 'Yes' : 'No'}</div>
              <div>Conclusion: {report.detailedFeedback.structuralElements.hasConclusion ? 'Yes' : 'No'}</div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Sentence Variety</h4>
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <div>Simple: {report.detailedFeedback.sentenceVariety.simple}</div>
              <div>Compound: {report.detailedFeedback.sentenceVariety.compound}</div>
              <div>Complex: {report.detailedFeedback.sentenceVariety.complex}</div>
              <div className="text-xs mt-2">{report.detailedFeedback.sentenceVariety.analysis}</div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Language Features</h4>
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <div>Literary Devices: {report.detailedFeedback.literaryDevices.identified.length}</div>
              <div>Sophisticated Words: {report.detailedFeedback.vocabularyAnalysis.sophisticatedWords.length}</div>
              <div>Spelling Errors: {report.detailedFeedback.technicalAccuracy.spellingErrors}</div>
              <div>Grammar Issues: {report.detailedFeedback.technicalAccuracy.grammarIssues.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={downloadReport}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center"
        >
          <Download className="w-5 h-5 mr-2" />
          Download Report
        </button>
        
        {onClose && (
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Close Report
          </button>
        )}
      </div>
    </div>
  );
}

function generateReportText(report: EvaluationReport, essayText: string): string {
  return `NSW SELECTIVE WRITING EVALUATION REPORT
Generated on: ${new Date().toLocaleDateString()}

OVERALL ASSESSMENT
==================
Grade: ${report.overallGrade}
Score: ${report.overallScore}/100

DOMAIN SCORES
=============
Content & Ideas (40%): ${report.domains.contentAndIdeas.score}/10 (${report.domains.contentAndIdeas.band})
Text Structure (20%): ${report.domains.textStructure.score}/10 (${report.domains.textStructure.band})
Language Features (25%): ${report.domains.languageFeatures.score}/10 (${report.domains.languageFeatures.band})
Spelling & Grammar (15%): ${report.domains.spellingAndGrammar.score}/10 (${report.domains.spellingAndGrammar.band})

STRENGTHS
=========
${report.strengths.map(s => `• ${s}`).join('\n')}

AREAS FOR IMPROVEMENT
====================
${report.areasForImprovement.map(a => `• ${a}`).join('\n')}

RECOMMENDATIONS
===============
${report.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}

TECHNICAL ANALYSIS
==================
Word Count: ${report.detailedFeedback.wordCount}
Paragraphs: ${report.detailedFeedback.structuralElements.paragraphCount}
Sentence Variety: ${report.detailedFeedback.sentenceVariety.analysis}
Literary Devices: ${report.detailedFeedback.literaryDevices.identified.join(', ') || 'None identified'}
Spelling Errors: ${report.detailedFeedback.technicalAccuracy.spellingErrors}

SUBMITTED ESSAY
===============
${essayText}

---
This report was generated using official NSW Selective Writing assessment criteria.
`;
}
