import React, { useState } from 'react';
import { Award, CheckCircle, AlertTriangle, Lightbulb, Download, TrendingUp, Target, X } from 'lucide-react';
import { InteractiveHighlightedText } from './InteractiveHighlightedText';

interface AIEvaluationReport {
  overallBand: number;
  totalScore: number;
  bandDescription: string;
  criteriaScores: {
    ideasContent: { score: number; outOf: number; band: number };
    structureOrganization: { score: number; outOf: number; band: number };
    languageVocab: { score: number; outOf: number; band: number };
    spellingGrammar: { score: number; outOf: number; band: number };
  };
  highlights: Array<{
    type: 'strength' | 'improvement' | 'suggestion';
    color: 'green' | 'amber' | 'blue';
    text: string;
    startIndex: number;
    endIndex: number;
    title: string;
    explanation: string;
    beforeAfter?: {
      before: string;
      after: string;
    };
  }>;
  detailedFeedback: {
    strengths: string[];
    areasToImprove: string[];
    nextSteps: string[];
  };
  narrativeStructure?: {
    hasOrientation: boolean;
    hasComplication: boolean;
    hasClimax: boolean;
    hasResolution: boolean;
    structureNotes: string;
  };
  generatedAt?: string;
  modelVersion?: string;
}

interface AIEvaluationReportDisplayProps {
  report: AIEvaluationReport;
  essayText: string;
  onClose?: () => void;
}

export function AIEvaluationReportDisplay({ report, essayText, onClose }: AIEvaluationReportDisplayProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'highlighted' | 'detailed'>('highlighted');

  const getBandColor = (band: number) => {
    const colors: { [key: number]: string } = {
      6: 'bg-emerald-500 text-white',
      5: 'bg-blue-500 text-white',
      4: 'bg-green-500 text-white',
      3: 'bg-yellow-500 text-white',
      2: 'bg-orange-500 text-white',
      1: 'bg-red-500 text-white'
    };
    return colors[band] || colors[1];
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (percentage >= 60) return 'text-blue-600 dark:text-blue-400';
    if (percentage >= 40) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-orange-600 dark:text-orange-400';
  };

  const downloadReport = () => {
    let text = `NSW Selective School Writing Assessment - AI Analysis\n`;
    text += `Generated: ${new Date().toLocaleString()}\n`;
    text += `Model: ${report.modelVersion || 'GPT-4o-mini'}\n\n`;
    text += `═══════════════════════════════════════════\n\n`;
    text += `OVERALL ASSESSMENT\n`;
    text += `Band Level: ${report.overallBand}/6\n`;
    text += `Total Score: ${report.totalScore}/30\n`;
    text += `${report.bandDescription}\n\n`;
    text += `CRITERIA BREAKDOWN\n`;
    text += `Ideas & Content: ${report.criteriaScores.ideasContent.score}/${report.criteriaScores.ideasContent.outOf} (Band ${report.criteriaScores.ideasContent.band})\n`;
    text += `Structure & Organization: ${report.criteriaScores.structureOrganization.score}/${report.criteriaScores.structureOrganization.outOf} (Band ${report.criteriaScores.structureOrganization.band})\n`;
    text += `Language & Vocabulary: ${report.criteriaScores.languageVocab.score}/${report.criteriaScores.languageVocab.outOf} (Band ${report.criteriaScores.languageVocab.band})\n`;
    text += `Spelling & Grammar: ${report.criteriaScores.spellingGrammar.score}/${report.criteriaScores.spellingGrammar.outOf} (Band ${report.criteriaScores.spellingGrammar.band})\n\n`;
    text += `STRENGTHS\n`;
    report.detailedFeedback.strengths.forEach((s, i) => text += `${i + 1}. ${s}\n`);
    text += `\nAREAS TO IMPROVE\n`;
    report.detailedFeedback.areasToImprove.forEach((a, i) => text += `${i + 1}. ${a}\n`);
    text += `\nNEXT STEPS\n`;
    report.detailedFeedback.nextSteps.forEach((n, i) => text += `${i + 1}. ${n}\n`);

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NSW_AI_Assessment_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2 text-white">AI-Powered NSW Writing Assessment</h2>
              <p className="text-white opacity-90 text-sm">Sophisticated analysis based on NSW Selective criteria</p>
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
        <div className="p-6 bg-gray-50 dark:bg-slate-900 border-b dark:border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full text-3xl font-bold ${getBandColor(report.overallBand)} shadow-lg`}>
                Band {report.overallBand}
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-3">Overall Band</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{report.bandDescription}</p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 text-2xl font-bold border-4 border-blue-200 dark:border-blue-700 shadow-lg">
                {report.totalScore}/30
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-3">Total Score</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">NSW Standard</p>
            </div>

            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${getScoreColor((report.totalScore / 30) * 100)} bg-gray-100 dark:bg-slate-700 text-2xl font-bold border-4 border-gray-200 dark:border-slate-600 shadow-lg`}>
                {Math.round((report.totalScore / 30) * 100)}%
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-3">Percentage</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Achievement Level</p>
            </div>
          </div>
        </div>

        {/* Criteria Scores */}
        <div className="p-6 border-b dark:border-slate-700">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Criteria Breakdown
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(report.criteriaScores).map(([key, value]) => {
              const titles: { [key: string]: string } = {
                ideasContent: 'Ideas & Content',
                structureOrganization: 'Structure & Organization',
                languageVocab: 'Language & Vocabulary',
                spellingGrammar: 'Spelling & Grammar'
              };
              const percentage = (value.score / value.outOf) * 100;
              return (
                <div key={key} className="border dark:border-slate-700 rounded-lg p-4 bg-white dark:bg-slate-900 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200">{titles[key]}</h4>
                    <span className={`text-xl font-bold ${getScoreColor(percentage)}`}>
                      {value.score}/{value.outOf}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${percentage >= 80 ? 'bg-emerald-500' : percentage >= 60 ? 'bg-blue-500' : percentage >= 40 ? 'bg-yellow-500' : 'bg-orange-500'}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{Math.round(percentage)}%</span>
                  </div>
                  <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${getBandColor(value.band)}`}>
                    Band {value.band}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b dark:border-slate-700">
          <div className="flex">
            <button
              onClick={() => setActiveTab('highlighted')}
              className={`flex-1 py-3 px-4 font-semibold transition-colors ${activeTab === 'highlighted' ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
            >
              Interactive Highlights
            </button>
            <button
              onClick={() => setActiveTab('detailed')}
              className={`flex-1 py-3 px-4 font-semibold transition-colors ${activeTab === 'detailed' ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
            >
              Detailed Feedback
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'highlighted' && (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Click on any highlighted text to see detailed explanations and improvement suggestions.
              </p>
              <InteractiveHighlightedText originalText={essayText} highlights={report.highlights} />
            </div>
          )}

          {activeTab === 'detailed' && (
            <div className="space-y-6">
              {/* Strengths */}
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 dark:text-green-300 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Key Strengths
                </h4>
                <ul className="space-y-2">
                  {report.detailedFeedback.strengths.map((strength, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                      <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
                      <span className="dark:text-gray-300">{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Areas to Improve */}
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
                <h4 className="font-semibold text-amber-800 dark:text-amber-300 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Areas to Improve
                </h4>
                <ul className="space-y-2">
                  {report.detailedFeedback.areasToImprove.map((area, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                      <span className="text-amber-600 dark:text-amber-400 mt-1">→</span>
                      <span className="dark:text-gray-300">{area}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Next Steps */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  Next Steps
                </h4>
                <ol className="space-y-2">
                  {report.detailedFeedback.nextSteps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                      <span className="text-blue-600 dark:text-blue-400 font-semibold mt-1">{i + 1}.</span>
                      <span className="dark:text-gray-300">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Narrative Structure (if applicable) */}
              {report.narrativeStructure && (
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-800 dark:text-purple-300 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Narrative Structure Analysis
                  </h4>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      {report.narrativeStructure.hasOrientation ? <CheckCircle className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-red-600" />}
                      <span className="text-sm text-gray-700 dark:text-gray-300">Orientation</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {report.narrativeStructure.hasComplication ? <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" /> : <X className="w-4 h-4 text-red-600 dark:text-red-400" />}
                      <span className="text-sm text-gray-700 dark:text-gray-300">Complication</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {report.narrativeStructure.hasClimax ? <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" /> : <X className="w-4 h-4 text-red-600 dark:text-red-400" />}
                      <span className="text-sm text-gray-700 dark:text-gray-300">Climax</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {report.narrativeStructure.hasResolution ? <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" /> : <X className="w-4 h-4 text-red-600 dark:text-red-400" />}
                      <span className="text-sm text-gray-700 dark:text-gray-300">Resolution</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{report.narrativeStructure.structureNotes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
