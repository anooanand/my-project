import React from 'react';
import { Award, BarChart3, CheckCircle, AlertCircle, Target, Lightbulb, Download, FileText, TrendingUp, Star, Heart } from 'lucide-react';

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
  essayContent: string; // ADDED: Include the student's actual essay in the report
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
  childFriendlyExplanation: string; // ADDED: Child-friendly rubric explanations
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
    a.download = `NSW_Writing_Assessment_Student_${new Date().toISOString().split('T')[0]}.txt`;
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
            <h1 className="text-3xl font-bold mb-2">NSW Writing Assessment Report</h1>
            <p className="text-blue-100">Comprehensive evaluation based on NSW curriculum standards</p>
          </div>
          <div className="text-right">
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-bold ${getGradeColor(report.overallGrade)}`}>
              <Award className="w-6 h-6 mr-2" />
              Grade: {report.overallGrade}
            </div>
            <div className="text-2xl font-bold mt-2">
              {report.overallScore}/100
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-3">
          <button
            onClick={downloadReport}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Report
          </button>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        )}
      </div>

      {/* Domain Scores Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
          {/* ADDED: Child-friendly explanation */}
          <div className="bg-white/50 rounded-lg p-3 mb-3">
            <div className="flex items-start">
              <Heart className="w-4 h-4 mr-2 mt-0.5 text-pink-500" />
              <p className="text-sm font-medium text-gray-700">
                {report.domains.contentAndIdeas.childFriendlyExplanation}
              </p>
            </div>
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
          {/* ADDED: Child-friendly explanation */}
          <div className="bg-white/50 rounded-lg p-3 mb-3">
            <div className="flex items-start">
              <Heart className="w-4 h-4 mr-2 mt-0.5 text-pink-500" />
              <p className="text-sm font-medium text-gray-700">
                {report.domains.textStructure.childFriendlyExplanation}
              </p>
            </div>
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
          {/* ADDED: Child-friendly explanation */}
          <div className="bg-white/50 rounded-lg p-3 mb-3">
            <div className="flex items-start">
              <Heart className="w-4 h-4 mr-2 mt-0.5 text-pink-500" />
              <p className="text-sm font-medium text-gray-700">
                {report.domains.languageFeatures.childFriendlyExplanation}
              </p>
            </div>
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
          {/* ADDED: Child-friendly explanation */}
          <div className="bg-white/50 rounded-lg p-3 mb-3">
            <div className="flex items-start">
              <Heart className="w-4 h-4 mr-2 mt-0.5 text-pink-500" />
              <p className="text-sm font-medium text-gray-700">
                {report.domains.spellingAndGrammar.childFriendlyExplanation}
              </p>
            </div>
          </div>
          <div className="text-sm space-y-1">
            {report.domains.spellingAndGrammar.feedback.slice(0, 2).map((feedback, index) => (
              <div key={index}>• {feedback}</div>
            ))}
          </div>
        </div>
      </div>

      {/* ADDED: Student's Original Essay Section */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6 mb-8">
        <h3 className="text-xl font-bold text-blue-800 dark:text-blue-200 mb-4 flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          Your Original Essay
        </h3>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border">
          <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 font-mono leading-relaxed">
            {report.essayContent || essayText}
          </pre>
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
          <div className="space-y-3">
            {report.strengths.length > 0 ? (
              report.strengths.map((strength, index) => (
                <div key={index} className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-green-700 dark:text-green-300">{strength}</span>
                </div>
              ))
            ) : (
              <p className="text-green-600 dark:text-green-400">Keep working hard! Every piece of writing has potential for growth.</p>
            )}
          </div>
        </div>

        {/* Areas for Improvement */}
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800 p-6">
          <h3 className="text-xl font-bold text-orange-800 dark:text-orange-200 mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Areas for Growth
          </h3>
          <div className="space-y-3">
            {report.areasForImprovement.length > 0 ? (
              report.areasForImprovement.map((area, index) => (
                <div key={index} className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-orange-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-orange-700 dark:text-orange-300">{area}</span>
                </div>
              ))
            ) : (
              <p className="text-orange-600 dark:text-orange-400">Excellent work! Continue to challenge yourself with new writing techniques.</p>
            )}
          </div>
        </div>
      </div>

      {/* UPDATED: Personalized Learning Recommendations */}
      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800 p-6 mb-8">
        <h3 className="text-xl font-bold text-purple-800 dark:text-purple-200 mb-4 flex items-center">
          <Lightbulb className="w-5 h-5 mr-2" />
          Personalized Learning Recommendations
        </h3>
        <div className="space-y-4">
          {report.recommendations.length > 0 ? (
            report.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start bg-white dark:bg-gray-800 rounded-lg p-4 border border-purple-100 dark:border-purple-700">
                <div className="bg-purple-100 dark:bg-purple-800 rounded-full p-2 mr-4 flex-shrink-0">
                  <span className="text-purple-600 dark:text-purple-300 font-bold text-sm">
                    {index + 1}
                  </span>
                </div>
                <span className="text-purple-700 dark:text-purple-300 leading-relaxed">{recommendation}</span>
              </div>
            ))
          ) : (
            <p className="text-purple-600 dark:text-purple-400">Keep up the excellent work! Continue practicing to maintain your high standards.</p>
          )}
        </div>
      </div>

      {/* Technical Analysis */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2" />
          Technical Analysis
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Word Count Analysis */}
          <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Word Count</h4>
            <div className="text-2xl font-bold text-blue-600 mb-2">{report.detailedFeedback.wordCount}</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total words in essay</p>
          </div>

          {/* Sentence Variety */}
          <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Sentence Variety</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Simple:</span>
                <span className="font-medium">{report.detailedFeedback.sentenceVariety.simple}</span>
              </div>
              <div className="flex justify-between">
                <span>Compound:</span>
                <span className="font-medium">{report.detailedFeedback.sentenceVariety.compound}</span>
              </div>
              <div className="flex justify-between">
                <span>Complex:</span>
                <span className="font-medium">{report.detailedFeedback.sentenceVariety.complex}</span>
              </div>
            </div>
          </div>

          {/* Literary Devices */}
          <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Literary Devices</h4>
            <div className="space-y-2">
              {report.detailedFeedback.literaryDevices.identified.length > 0 ? (
                report.detailedFeedback.literaryDevices.identified.map((device, index) => (
                  <div key={index} className="text-sm bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                    {device}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">None identified</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function generateReportText(report: EvaluationReport, essayText: string): string {
  const currentDate = new Date().toLocaleDateString();
  const currentTime = new Date().toLocaleTimeString();
  
  return `
NSW SELECTIVE WRITING ASSESSMENT REPORT
=====================================

Student: Student
Date: ${currentDate}
Assessment ID: nsw-${Date.now()}

OVERALL SCORE: ${report.overallScore}/100 (Grade: ${report.overallGrade})

CRITERIA BREAKDOWN:
- Ideas & Content: ${report.domains.contentAndIdeas.score}/10 (${report.domains.contentAndIdeas.weight}%)
- Structure & Organization: ${report.domains.textStructure.score}/10 (${report.domains.textStructure.weight}%)
- Language & Vocabulary: ${report.domains.languageFeatures.score}/10 (${report.domains.languageFeatures.weight}%)
- Spelling, Punctuation & Grammar: ${report.domains.spellingAndGrammar.score}/10 (${report.domains.spellingAndGrammar.weight}%)

DETAILED FEEDBACK:

IDEAS & CONTENT:
Child-Friendly Explanation:
${report.domains.contentAndIdeas.childFriendlyExplanation}

Strengths:
${report.domains.contentAndIdeas.feedback.map(f => `- ${f}`).join('\n')}

Areas for Improvement:
${report.domains.contentAndIdeas.specificExamples.map(e => `- ${e}`).join('\n')}

STRUCTURE & ORGANIZATION:
Child-Friendly Explanation:
${report.domains.textStructure.childFriendlyExplanation}

Strengths:
${report.domains.textStructure.feedback.map(f => `- ${f}`).join('\n')}

Areas for Improvement:
${report.domains.textStructure.specificExamples.map(e => `- ${e}`).join('\n')}

LANGUAGE & VOCABULARY:
Child-Friendly Explanation:
${report.domains.languageFeatures.childFriendlyExplanation}

Strengths:
${report.domains.languageFeatures.feedback.map(f => `- ${f}`).join('\n')}

Areas for Improvement:
${report.domains.languageFeatures.specificExamples.map(e => `- ${e}`).join('\n')}

SPELLING, PUNCTUATION & GRAMMAR:
Child-Friendly Explanation:
${report.domains.spellingAndGrammar.childFriendlyExplanation}

Strengths:
${report.domains.spellingAndGrammar.feedback.map(f => `- ${f}`).join('\n')}

Areas for Improvement:
${report.domains.spellingAndGrammar.specificExamples.map(e => `- ${e}`).join('\n')}

PERSONALIZED LEARNING RECOMMENDATIONS:
${report.recommendations.map((rec, index) => `${index + 1}. ${rec}`).join('\n')}

KEY STRENGTHS:
${report.strengths.map(s => `- ${s}`).join('\n')}

AREAS FOR GROWTH:
${report.areasForImprovement.map(a => `- ${a}`).join('\n')}

ORIGINAL ESSAY:
${report.essayContent || essayText}

Report generated on ${currentDate}, ${currentTime}
    `.trim();
}