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

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-green-600 bg-green-100';
    if (grade.startsWith('B')) return 'text-blue-600 bg-blue-100';
    if (grade.startsWith('C')) return 'text-yellow-600 bg-yellow-100';
    if (grade.startsWith('D')) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

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
    let text = `NSW Selective Writing Assessment Report\n\n`;
    text += `Overall Grade: ${report.overallGrade} (Score: ${report.overallScore}/100)\n\n`;

    text += `--- Domain Scores ---\n`;
    for (const domainKey in report.domains) {
      const domain = report.domains[domainKey as keyof typeof report.domains];
      text += `${domainKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: ${domain.score}/${domain.maxScore} (${domain.percentage.toFixed(0)}%) - Band: ${domain.band}\n`;
      domain.feedback.forEach(f => text += `  - ${f}\n`);
    }
    text += `\n`;

    text += `--- Key Strengths ---\n`;
    if (report.strengths.length > 0) {
      report.strengths.forEach(s => text += `- ${s}\n`);
    } else {
      text += `- No specific strengths identified. Keep working hard!\n`;
    }
    text += `\n`;

    text += `--- Areas for Growth ---\n`;
    if (report.areasForImprovement.length > 0) {
      report.areasForImprovement.forEach(a => text += `- ${a}\n`);
    } else {
      text += `- Excellent work! Continue to challenge yourself with new writing techniques.\n`;
    }
    text += `\n`;

    text += `--- Personalized Learning Recommendations ---\n`;
    if (report.recommendations.length > 0) {
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

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">NSW Writing Assessment Report</h1>
            <p className="text-blue-100">Your Personal Writing Journey Report</p>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-4">
              <div>
                <p className="text-blue-100 text-sm">Student: Student</p>
                <p className="text-blue-100 text-sm">Date: 10/9/2025</p>
                <p className="text-blue-100 text-xs">Report ID: nsw-1760000950368</p>
              </div>
              <div className="text-center">
                <div className="text-6xl font-bold mb-2">{report.overallScore}</div>
                <div className="text-sm text-blue-100">/100</div>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold mt-2 ${getGradeColor(report.overallGrade)}`}>
                  {report.overallGrade}
                </div>
                <div className="flex items-center justify-center mt-2">
                  <span className="text-yellow-300 text-2xl">⭐</span>
                  <span className="text-white ml-2">Great Job!</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Your Writing Skills Breakdown Section */}
      <div className="mb-8">
        <div className="flex items-center mb-6">
          <BarChart3 className="w-6 h-6 text-purple-600 mr-3" />
          <h2 className="text-2xl font-bold text-purple-600">Your Writing Skills Breakdown</h2>
        </div>

        {/* Domain Scores with Individual Progress Bars */}
        <div className="space-y-4">
          <DomainScoreCard
            domain={correctedReport.domains.contentAndIdeas}
            title="Ideas & Content"
            icon="💡"
          />
          <DomainScoreCard
            domain={{ ...correctedReport.domains.textStructure, maxScore: 10 }}
            title="Structure & Organization"
            icon="📝"
          />
          <DomainScoreCard
            domain={{ ...correctedReport.domains.languageFeatures, maxScore: 10 }}
            title="Language & Vocabulary"
            icon="✍️"
          />
          <DomainScoreCard
            domain={{ ...correctedReport.domains.spellingAndGrammar, maxScore: 10 }}
            title="Spelling & Grammar"
            icon="✅"
          />
        </div>
      </div>

      {/* Overall Strengths, Areas for Growth, and Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 p-6">
          <h3 className="text-xl font-bold text-green-800 dark:text-green-200 mb-4 flex items-center">
            <Star className="w-5 h-5 mr-2" />
            Key Strengths
          </h3>
          <div className="space-y-3">
            {correctedReport.strengths.length > 0 ? (
              correctedReport.strengths.map((strength, index) => (
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

        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800 p-6">
          <h3 className="text-xl font-bold text-orange-800 dark:text-orange-200 mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Areas for Growth
          </h3>
          <div className="space-y-3">
            {correctedReport.areasForImprovement.length > 0 ? (
              correctedReport.areasForImprovement.map((area, index) => (
                <div key={index} className="flex items-start">
                  {area.startsWith('❌') ? <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" /> : 
                   area.startsWith('⚠️') ? <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" /> : 
                   area.startsWith('📏 CRITICAL') ? <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" /> : 
                   area.startsWith('📏') ? <AlertCircle className="w-5 h-5 text-orange-600 mr-3 mt-0.5 flex-shrink-0" /> : 
                   area.startsWith('🔤') ? <AlertCircle className="w-5 h-5 text-orange-600 mr-3 mt-0.5 flex-shrink-0" /> : 
                   area.startsWith('✍️') ? <AlertCircle className="w-5 h-5 text-orange-600 mr-3 mt-0.5 flex-shrink-0" /> : 
                   <AlertCircle className="w-5 h-5 text-orange-600 mr-3 mt-0.5 flex-shrink-0" />}
                  <span className="text-orange-700 dark:text-orange-300">{area}</span>
                </div>
              ))
            ) : (
              <p className="text-orange-600 dark:text-orange-400">Excellent work! Continue to challenge yourself with new writing techniques.</p>
            )}
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
          <h3 className="text-xl font-bold text-blue-800 dark:text-blue-200 mb-4 flex items-center">
            <Lightbulb className="w-5 h-5 mr-2" />
            Personalized Recommendations
          </h3>
          <div className="space-y-3">
            {correctedReport.recommendations.length > 0 ? (
              correctedReport.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start">
                  <TrendingUp className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-blue-700 dark:text-blue-300">{rec}</span>
                </div>
              ))
            ) : (
              <p className="text-blue-600 dark:text-blue-400">Keep up the excellent work! Continue practicing to maintain your high standards.</p>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Feedback Section */}
      <div className="mb-8">
        <div className="flex items-center mb-6">
          <FileText className="w-6 h-6 text-purple-600 mr-3" />
          <h2 className="text-2xl font-bold text-purple-600">Detailed Analysis</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Word Count */}
          <div className="bg-gray-50 dark:bg-gray-800 p-5 rounded-lg shadow-sm mb-4">
            <h3 className="font-semibold text-xl text-gray-800 dark:text-gray-200 mb-3">Word Count</h3>
            <p className="text-gray-700 dark:text-gray-300">Your essay has <strong>{correctedReport.detailedFeedback.wordCount} words</strong>.</p>
            {correctedReport.criticalWarnings && correctedReport.criticalWarnings.length > 0 && (
              <div className="mt-3 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                <p className="font-semibold">Critical Warnings:</p>
                <ul className="list-disc list-inside">
                  {correctedReport.criticalWarnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Sentence Variety */}
          <div className="bg-gray-50 dark:bg-gray-800 p-5 rounded-lg shadow-sm mb-4">
            <h3 className="font-semibold text-xl text-gray-800 dark:text-gray-200 mb-3">Sentence Variety</h3>
            <div className="grid grid-cols-3 gap-4 text-center mb-3">
              <div className="p-3 bg-white dark:bg-gray-700 rounded-md shadow-sm">
                <p className="text-lg font-bold text-blue-600">{correctedReport.detailedFeedback.sentenceVariety.simple}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Simple Sentences</p>
              </div>
              <div className="p-3 bg-white dark:bg-gray-700 rounded-md shadow-sm">
                <p className="text-lg font-bold text-green-600">{correctedReport.detailedFeedback.sentenceVariety.compound}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Compound Sentences</p>
              </div>
              <div className="p-3 bg-white dark:bg-gray-700 rounded-md shadow-sm">
                <p className="text-lg font-bold text-purple-600">{correctedReport.detailedFeedback.sentenceVariety.complex}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Complex Sentences</p>
              </div>
            </div>
            <p className="text-gray-700 dark:text-gray-300"><strong>Analysis:</strong> {correctedReport.detailedFeedback.sentenceVariety.analysis}</p>
          </div>

          {/* Vocabulary Analysis */}
          <div className="bg-gray-50 dark:bg-gray-800 p-5 rounded-lg shadow-sm mb-4">
            <h3 className="font-semibold text-xl text-gray-800 dark:text-gray-200 mb-3">Vocabulary Analysis</h3>
            {correctedReport.detailedFeedback.vocabularyAnalysis.sophisticatedWords.length > 0 && (
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                <strong>Sophisticated Words Used:</strong> {correctedReport.detailedFeedback.vocabularyAnalysis.sophisticatedWords.join(", ")}
              </p>
            )}
            {correctedReport.detailedFeedback.vocabularyAnalysis.repetitiveWords.length > 0 && (
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                <strong>Repetitive Words:</strong> {correctedReport.detailedFeedback.vocabularyAnalysis.repetitiveWords.join(", ")}
              </p>
            )}
            {correctedReport.detailedFeedback.vocabularyAnalysis.suggestions.length > 0 && (
              <div className="mt-3">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200">Suggestions:</h4>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300">
                  {correctedReport.detailedFeedback.vocabularyAnalysis.suggestions.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Literary Devices */}
          <div className="bg-gray-50 dark:bg-gray-800 p-5 rounded-lg shadow-sm mb-4">
            <h3 className="font-semibold text-xl text-gray-800 dark:text-gray-200 mb-3">Literary Devices</h3>
            {correctedReport.detailedFeedback.literaryDevices.identified.length > 0 ? (
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                <strong>Identified:</strong> {correctedReport.detailedFeedback.literaryDevices.identified.join(", ")}
              </p>
            ) : (
              <p className="text-gray-700 dark:text-gray-300 mb-2">No specific literary devices were prominently identified.</p>
            )}
            {correctedReport.detailedFeedback.literaryDevices.suggestions.length > 0 && (
              <div className="mt-3">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200">Suggestions:</h4>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300">
                  {correctedReport.detailedFeedback.literaryDevices.suggestions.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Structural Elements */}
          <div className="bg-gray-50 dark:bg-gray-800 p-5 rounded-lg shadow-sm mb-4">
            <h3 className="font-semibold text-xl text-gray-800 dark:text-gray-200 mb-3">Structural Elements</h3>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-2">
              <li>Introduction: <strong>{correctedReport.detailedFeedback.structuralElements.hasIntroduction ? "Present" : "Missing"}</strong></li>
              <li>Conclusion: <strong>{correctedReport.detailedFeedback.structuralElements.hasConclusion ? "Present" : "Missing"}</strong></li>
              <li>Paragraphs: <strong>{correctedReport.detailedFeedback.structuralElements.paragraphCount}</strong></li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300"><strong>Coherence:</strong> {correctedReport.detailedFeedback.structuralElements.coherence}</p>
          </div>

          {/* Technical Accuracy */}
          <div className="bg-gray-50 dark:bg-gray-800 p-5 rounded-lg shadow-sm mb-4">
            <h3 className="font-semibold text-xl text-gray-800 dark:text-gray-200 mb-3">Technical Accuracy</h3>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-2">
              <li>Spelling Errors: <strong>{correctedReport.detailedFeedback.technicalAccuracy.spellingErrors}</strong></li>
              {correctedReport.detailedFeedback.technicalAccuracy.grammarIssues.length > 0 && (
                <li>Grammar Issues: {correctedReport.detailedFeedback.technicalAccuracy.grammarIssues.join(", ")}</li>
              )}
              {correctedReport.detailedFeedback.technicalAccuracy.punctuationIssues.length > 0 && (
                <li>Punctuation Issues: {correctedReport.detailedFeedback.technicalAccuracy.punctuationIssues.join(", ")}</li>
              )}
            </ul>
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

      {/* Critical Warnings Section */}
      {report.criticalWarnings && report.criticalWarnings.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg border-2 border-red-400 dark:border-red-600 p-6 mb-8">
          <h3 className="text-xl font-bold text-red-800 dark:text-red-200 mb-4 flex items-center">
            <AlertCircle className="w-6 h-6 mr-2" />
            🚨 Critical Issues Requiring Immediate Attention
          </h3>
          <div className="space-y-3">
            {report.criticalWarnings.map((warning, index) => (
              <div key={index} className="flex items-start bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-red-300 dark:border-red-700 shadow-lg">
                <div className="bg-red-500 dark:bg-red-700 rounded-full p-2 mr-4 flex-shrink-0">
                  <span className="text-white font-bold text-lg">!</span>
                </div>
                <span className="text-red-800 dark:text-red-200 font-semibold leading-relaxed text-base">
                  {warning}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-600 rounded-lg p-3">
            <p className="text-yellow-800 dark:text-yellow-200 text-sm font-medium">
              💡 <strong>Action Required:</strong> Please address these critical issues before your next practice essay.
              These are the most important areas that will significantly impact your exam performance.
            </p>
          </div>
        </div>
      )}

      {/* Student's Original Essay Section */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-blue-800 dark:text-blue-200 flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Your Original Essay
          </h3>
          <div className={`px-4 py-2 rounded-full font-bold text-sm ${
            report.detailedFeedback.wordCount < 300 ? 'bg-red-100 text-red-700 border-2 border-red-400' :
            report.detailedFeedback.wordCount < 400 ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-400' :
            report.detailedFeedback.wordCount <= 550 ? 'bg-green-100 text-green-700 border-2 border-green-400' :
            'bg-orange-100 text-orange-700 border-2 border-orange-400'
          }`}>
            {report.detailedFeedback.wordCount} words
            {report.detailedFeedback.wordCount < 400 && ' ⚠️ Too Short'}
            {report.detailedFeedback.wordCount >= 400 && report.detailedFeedback.wordCount <= 550 && ' ✅ Good Length'}
            {report.detailedFeedback.wordCount > 550 && ' ⚠️ Too Long'}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border">
          <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 font-sans leading-relaxed">
            {report.essayContent || essayText}
          </pre>
        </div>
      </div>
    </div>
  );
}
