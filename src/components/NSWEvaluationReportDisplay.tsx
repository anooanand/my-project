import React, { useState } from 'react';
import { Award, BarChart3, CheckCircle, AlertCircle, Target, Lightbulb, Download, FileText, TrendingUp, Star, Heart, X } from 'lucide-react';

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
  essayContent: string;
  criticalWarnings?: string[];
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
  childFriendlyExplanation: string;
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

const DomainScoreCard: React.FC<{ domain: DomainScore; title: string; icon: string }> = ({ domain, title, icon }) => {
  const getScoreColor = (score: number) => {
    if (score >= 9) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 7) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 5) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (score >= 3) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  // FIXED: Get proper bar color based on score instead of using bg-current
  const getBarColor = (score: number) => {
    if (score >= 9) return 'bg-green-500';
    if (score >= 7) return 'bg-blue-500';
    if (score >= 5) return 'bg-yellow-500';
    if (score >= 3) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className={`border rounded-lg p-4 ${getScoreColor(domain.score)}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-lg">{title}</h3>
        <div className="flex items-center">
          <span className="text-2xl font-bold mr-2">{domain.score}/{domain.maxScore}</span>
          <span className="text-sm">({domain.weight}%)</span>
        </div>
      </div>
      <div className="mb-2">
        <div className="flex justify-between text-sm mb-1">
          <span>Performance</span>
          <span>{domain.percentage.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`${getBarColor(domain.score)} h-2 rounded-full transition-all duration-300`}
            style={{ width: `${domain.percentage}%` }}
          ></div>
        </div>
      </div>
      <div className="text-sm font-medium mb-2">
        Band: {domain.band}
      </div>
      <div className="bg-white/50 rounded-lg p-3 mb-3">
        <div className="flex items-start">
          <Heart className="w-4 h-4 mr-2 mt-0.5 text-pink-500" />
          <p className="text-sm font-medium text-gray-700">
            {domain.childFriendlyExplanation}
          </p>
        </div>
      </div>
      <div className="text-sm space-y-2">
        {domain.feedback.map((feedback, index) => (
          <div key={index} className="flex items-start">
            <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
            <span>{feedback}</span>
          </div>
        ))}
        {domain.specificExamples && domain.specificExamples.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <h4 className="font-semibold text-xs text-gray-600 mb-1">Examples:</h4>
            {domain.specificExamples.map((example, index) => (
              <p key={index} className="text-xs text-gray-500 italic">"...{example}..."</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export function NSWEvaluationReportDisplay({ report, essayText, onClose }: NSWEvaluationReportDisplayProps) {
  // CRITICAL FIX: Ensure maxScore is always 10, not 5
  // This fixes a bug where generator might return maxScore=5
  const correctedReport: EvaluationReport = {
    ...report,
    domains: {
      contentAndIdeas: { ...report.domains.contentAndIdeas, maxScore: 10 },
      textStructure: { ...report.domains.textStructure, maxScore: 10 },
      languageFeatures: { ...report.domains.languageFeatures, maxScore: 10 },
      spellingAndGrammar: { ...report.domains.spellingAndGrammar, maxScore: 10 }
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 9) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 7) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 5) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (score >= 3) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getGradeColor = (grade?: string) => {
    if (!grade) return 'text-blue-600 bg-blue-100';
    if (grade.startsWith('A')) return 'text-green-600 bg-green-100';
    if (grade.startsWith('B')) return 'text-blue-600 bg-blue-100';
    if (grade.startsWith('C')) return 'text-yellow-600 bg-yellow-100';
    if (grade.startsWith('D')) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const calculateGrade = (score: number): string => {
    if (score >= 9) return 'A+';
    if (score >= 8.5) return 'A';
    if (score >= 8) return 'A-';
    if (score >= 7.5) return 'B+';
    if (score >= 7) return 'B';
    if (score >= 6.5) return 'B-';
    if (score >= 6) return 'C+';
    if (score >= 5.5) return 'C';
    if (score >= 5) return 'C-';
    if (score >= 4) return 'D';
    return 'E';
  };

  const overallGrade = report.overallGrade || calculateGrade(report.overallScore / 10);

  const downloadReport = () => {
    const reportContent = generateReportText(correctedReport, essayText);
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

  const generateReportText = (report: EvaluationReport, essayText: string): string => {
    const grade = report.overallGrade || calculateGrade(report.overallScore / 10);
    let text = `NSW Selective Writing Assessment Report\n\n`;
    text += `Overall Grade: ${grade} (Score: ${report.overallScore.toFixed(1)}/10)\n\n`;

    text += `--- Domain Scores ---\n`;
    for (const domainKey in report.domains) {
      const domain = report.domains[domainKey as keyof typeof report.domains];
      text += `${domainKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: ${domain.score}/${domain.maxScore} (${domain.percentage.toFixed(0)}%) - Band: ${domain.band}\n`;
      domain.feedback.forEach(f => text += `  - ${f}\n`);
    }
    text += `\n`;

    text += `--- Key Strengths ---\n`;
    if (report.strengths && report.strengths.length > 0) {
      report.strengths.forEach(s => text += `- ${s}\n`);
    } else {
      text += `- No specific strengths identified. Keep working hard!\n`;
    }
    text += `\n`;

    text += `--- Areas for Growth ---\n`;
    if (report.areasForImprovement && report.areasForImprovement.length > 0) {
      report.areasForImprovement.forEach(a => text += `- ${a}\n`);
    } else {
      text += `- Excellent work! Continue to challenge yourself with new writing techniques.\n`;
    }
    text += `\n`;

    text += `--- Personalized Learning Recommendations ---\n`;
    if (report.recommendations && report.recommendations.length > 0) {
      report.recommendations.forEach((r, i) => text += `${i + 1}. ${r}\n`);
    } else {
      text += `- Keep up the excellent work! Continue practicing to maintain your high standards.\n`;
    }
    text += `\n`;

    text += `--- Your Original Essay (${report.detailedFeedback.wordCount} words) ---\n`;
    text += essayText;
    text += `\n\n`;

    return text;
  };

  const [activeTab, setActiveTab] = useState<'overview' | 'detailed'>('overview');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2 text-white">NSW Writing Assessment Report</h1>
              <p className="text-white opacity-90 text-sm">Your Personal Writing Journey Report</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={downloadReport}
                className="flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors font-semibold"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="text-white hover:bg-white hover:bg-opacity-20 transition-all p-2 rounded-lg"
                  aria-label="Close report"
                >
                  <X className="w-6 h-6" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Overall Score Section */}
        <div className="p-6 bg-gray-50 border-b">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full text-3xl font-bold ${getGradeColor(overallGrade)} shadow-lg`}>
                {overallGrade}
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mt-3">Overall Grade</h3>
              <p className="text-sm text-gray-600 mt-1">Achievement Level</p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-blue-100 text-blue-800 text-2xl font-bold border-4 border-blue-200 shadow-lg">
                {report.overallScore.toFixed(1)}/10
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mt-3">Total Score</h3>
              <p className="text-sm text-gray-600 mt-1">NSW Standard</p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gray-100 text-purple-600 text-2xl font-bold border-4 border-gray-200 shadow-lg">
                {Math.round((report.overallScore / 10) * 100)}%
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mt-3">Percentage</h3>
              <p className="text-sm text-gray-600 mt-1">Achievement Level</p>
            </div>
          </div>
        </div>

        {/* Criteria Breakdown */}
        <div className="p-6 border-b">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            Criteria Breakdown
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(correctedReport.domains).map(([key, domain]) => {
              const titles: { [key: string]: string } = {
                contentAndIdeas: 'Ideas & Content',
                textStructure: 'Structure & Organization',
                languageFeatures: 'Language & Vocabulary',
                spellingAndGrammar: 'Spelling & Grammar'
              };
              const percentage = (domain.score / domain.maxScore) * 100;
              return (
                <div key={key} className="border rounded-lg p-4 bg-white shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-800">{titles[key]}</h4>
                    <span className="text-xl font-bold text-blue-600">
                      {domain.score.toFixed(1)}/{domain.maxScore}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${percentage >= 80 ? 'bg-emerald-500' : percentage >= 60 ? 'bg-blue-500' : percentage >= 40 ? 'bg-yellow-500' : 'bg-orange-500'}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600">{Math.round(percentage)}%</span>
                  </div>
                  <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">
                    Band {domain.band}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <div className="flex">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 py-3 px-4 font-semibold transition-colors ${activeTab === 'overview' ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('detailed')}
              className={`flex-1 py-3 px-4 font-semibold transition-colors ${activeTab === 'detailed' ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Detailed Analysis
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Strengths */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Key Strengths
                </h4>
                <ul className="space-y-2">
                  {correctedReport.strengths && correctedReport.strengths.length > 0 ? (
                    correctedReport.strengths.map((strength, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-700">
                        <span className="text-green-600 mt-1">✓</span>
                        <span>{strength}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-green-600">Keep working hard! Every piece of writing has potential for growth.</li>
                  )}
                </ul>
              </div>

              {/* Areas to Improve */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Areas for Growth
                </h4>
                <ul className="space-y-2">
                  {correctedReport.areasForImprovement && correctedReport.areasForImprovement.length > 0 ? (
                    correctedReport.areasForImprovement.map((area, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-700">
                        <span className="text-amber-600 mt-1">→</span>
                        <span>{area}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-amber-600">Excellent work! Continue to challenge yourself.</li>
                  )}
                </ul>
              </div>

              {/* Recommendations */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  Next Steps
                </h4>
                <ul className="space-y-2">
                  {correctedReport.recommendations && correctedReport.recommendations.length > 0 ? (
                    correctedReport.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-700">
                        <span className="text-blue-600 mt-1">{i + 1}.</span>
                        <span>{rec}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-blue-600">Keep up the excellent work!</li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'detailed' && (
            <div className="space-y-6">
              {/* Domain-specific Feedback */}
              {Object.entries(correctedReport.domains).map(([key, domain]) => {
                const titles: { [key: string]: string } = {
                  contentAndIdeas: 'Ideas & Content',
                  textStructure: 'Structure & Organization',
                  languageFeatures: 'Language & Vocabulary',
                  spellingAndGrammar: 'Spelling & Grammar'
                };
                return (
                  <div key={key} className="border border-gray-200 rounded-lg p-4 bg-white">
                    <h4 className="font-semibold text-gray-800 mb-3">{titles[key]}</h4>
                    {domain.childFriendlyExplanation && (
                      <div className="bg-blue-50 p-3 rounded-lg mb-3 flex items-start gap-2">
                        <Heart className="w-4 h-4 text-pink-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-700">{domain.childFriendlyExplanation}</p>
                      </div>
                    )}
                    <ul className="space-y-2">
                      {domain.feedback.map((feedback, i) => (
                        <li key={i} className="flex items-start gap-2 text-gray-700 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{feedback}</span>
                        </li>
                      ))}
                    </ul>
                    {domain.specificExamples && domain.specificExamples.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs font-semibold text-gray-600 mb-2">Examples from your writing:</p>
                        {domain.specificExamples.map((example, i) => (
                          <p key={i} className="text-xs text-gray-500 italic mb-1">&quot;...{example}...&quot;</p>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Writing Metrics */}
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h4 className="font-semibold text-gray-800 mb-3">Writing Metrics</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Word Count</p>
                    <p className="text-lg font-bold text-gray-800">{correctedReport.detailedFeedback.wordCount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Paragraphs</p>
                    <p className="text-lg font-bold text-gray-800">{correctedReport.detailedFeedback.structuralElements.paragraphCount}</p>
                  </div>
                </div>

                {/* Sentence Variety */}
                <div className="mt-4 pt-4 border-t border-gray-300">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Sentence Variety</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2 bg-white rounded">
                      <p className="text-lg font-bold text-blue-600">{correctedReport.detailedFeedback.sentenceVariety.simple}</p>
                      <p className="text-xs text-gray-500">Simple</p>
                    </div>
                    <div className="text-center p-2 bg-white rounded">
                      <p className="text-lg font-bold text-green-600">{correctedReport.detailedFeedback.sentenceVariety.compound}</p>
                      <p className="text-xs text-gray-500">Compound</p>
                    </div>
                    <div className="text-center p-2 bg-white rounded">
                      <p className="text-lg font-bold text-purple-600">{correctedReport.detailedFeedback.sentenceVariety.complex}</p>
                      <p className="text-xs text-gray-500">Complex</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{correctedReport.detailedFeedback.sentenceVariety.analysis}</p>
                </div>

                {/* Vocabulary */}
                {correctedReport.detailedFeedback.vocabularyAnalysis.sophisticatedWords.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-300">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Sophisticated Vocabulary</p>
                    <p className="text-sm text-gray-600">{correctedReport.detailedFeedback.vocabularyAnalysis.sophisticatedWords.join(', ')}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
