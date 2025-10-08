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
            className="bg-current h-2 rounded-full" 
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
      <div className="text-sm space-y-1">
        {domain.feedback.slice(0, 2).map((feedback, index) => (
          <div key={index}>• {feedback}</div>
        ))}
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

      {/* Domain Scores Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <DomainScoreCard
          domain={correctedReport.domains.contentAndIdeas}
          title="Content & Ideas"
          icon="💡"
        />
        <DomainScoreCard
          domain={correctedReport.domains.textStructure}
          title="Text Structure"
          icon="📝"
        />
        <DomainScoreCard
          domain={correctedReport.domains.languageFeatures}
          title="Language Features"
          icon="✨"
        />
        <DomainScoreCard
          domain={correctedReport.domains.spellingAndGrammar}
          title="Spelling & Grammar"
          icon="✅"
        />
      </div>

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
      </div>

      {/* Personalized Learning Recommendations */}
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
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2" />
          Detailed Technical Analysis
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Word Count */}
          <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm">
            <h4 className="font-semibold text-lg mb-2">Word Count</h4>
            <p className="text-gray-700 dark:text-gray-300">Total words: <span className="font-bold">{report.detailedFeedback.wordCount}</span></p>
            {report.detailedFeedback.wordCount < 400 && (
              <p className="text-red-500 text-sm mt-1">Consider expanding your essay to meet the 400-500 word requirement.</p>
            )}
          </div>

          {/* Sentence Variety */}
          <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm">
            <h4 className="font-semibold text-lg mb-2">Sentence Variety</h4>
            <p className="text-gray-700 dark:text-gray-300">Simple: {report.detailedFeedback.sentenceVariety.simple}, Compound: {report.detailedFeedback.sentenceVariety.compound}, Complex: {report.detailedFeedback.sentenceVariety.complex}</p>
            <p className="text-gray-700 dark:text-gray-300 mt-1">Analysis: {report.detailedFeedback.sentenceVariety.analysis}</p>
          </div>

          {/* Vocabulary Analysis */}
          <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm">
            <h4 className="font-semibold text-lg mb-2">Vocabulary Analysis</h4>
            <p className="text-gray-700 dark:text-gray-300">Sophisticated words: {report.detailedFeedback.vocabularyAnalysis.sophisticatedWords.join(', ') || 'N/A'}</p>
            <p className="text-gray-700 dark:text-gray-300 mt-1">Repetitive words: {report.detailedFeedback.vocabularyAnalysis.repetitiveWords.join(', ') || 'N/A'}</p>
            <p className="text-gray-700 dark:text-gray-300 mt-1">Suggestions: {report.detailedFeedback.vocabularyAnalysis.suggestions.join(', ') || 'N/A'}</p>
          </div>

          {/* Literary Devices */}
          <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm">
            <h4 className="font-semibold text-lg mb-2">Literary Devices</h4>
            <p className="text-gray-700 dark:text-gray-300">Identified: {report.detailedFeedback.literaryDevices.identified.join(', ') || 'None'}</p>
            <p className="text-gray-700 dark:text-gray-300 mt-1">Suggestions: {report.detailedFeedback.literaryDevices.suggestions.join(', ') || 'N/A'}</p>
          </div>

          {/* Structural Elements */}
          <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm">
            <h4 className="font-semibold text-lg mb-2">Structural Elements</h4>
            <p className="text-gray-700 dark:text-gray-300">Introduction: {report.detailedFeedback.structuralElements.hasIntroduction ? 'Yes' : 'No'}</p>
            <p className="text-gray-700 dark:text-gray-300">Conclusion: {report.detailedFeedback.structuralElements.hasConclusion ? 'Yes' : 'No'}</p>
            <p className="text-gray-700 dark:text-gray-300">Paragraphs: {report.detailedFeedback.structuralElements.paragraphCount}</p>
            <p className="text-gray-700 dark:text-gray-300 mt-1">Coherence: {report.detailedFeedback.structuralElements.coherence}</p>
          </div>

          {/* Technical Accuracy */}
          <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm">
            <h4 className="font-semibold text-lg mb-2">Technical Accuracy</h4>
            <p className="text-gray-700 dark:text-gray-300">Spelling errors: {report.detailedFeedback.technicalAccuracy.spellingErrors}</p>
            <p className="text-gray-700 dark:text-gray-300 mt-1">Grammar issues: {report.detailedFeedback.technicalAccuracy.grammarIssues.join(', ') || 'None'}</p>
            <p className="text-gray-700 dark:text-gray-300 mt-1">Punctuation issues: {report.detailedFeedback.technicalAccuracy.punctuationIssues.join(', ') || 'None'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}