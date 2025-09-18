import React, { useState, useEffect } from 'react';
import { NSWEvaluationReportGenerator } from './NSWEvaluationReportGenerator';
import { NSWEvaluationReportDisplay } from './NSWEvaluationReportDisplay';
import { FileText, Loader2, CheckCircle, XCircle, Download } from 'lucide-react';

interface NSWStandaloneSubmitSystemProps {
  content: string;
  wordCount: number;
  targetWordCountMin: number;
  targetWordCountMax: number;
  textType: string;
  prompt: string;
  onSubmissionComplete?: (report: any) => void;
}

export function NSWStandaloneSubmitSystem({
  content,
  wordCount,
  targetWordCountMin,
  targetWordCountMax,
  textType,
  prompt,
  onSubmissionComplete,
}: NSWStandaloneSubmitSystemProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analysisReport, setAnalysisReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const getWordCountStatus = () => {
    if (wordCount < targetWordCountMin) {
      return { color: 'text-red-600', message: `${targetWordCountMin - wordCount} words needed`, isValid: false };
    } else if (wordCount > targetWordCountMax) {
      return { color: 'text-orange-600', message: `${wordCount - targetWordCountMax} words over limit`, isValid: false };
    } else {
      return { color: 'text-green-600', message: 'Word count on target', isValid: true };
    }
  };

  const handleSubmit = async () => {
    if (!getWordCountStatus().isValid) {
      setError('Please meet the word count requirements before submitting.');
      return;
    }

    console.log("handleSubmit called");
    console.log("Content:", content);
    console.log("Text Type:", textType);
    console.log("Prompt:", prompt);
    console.log("Word Count:", wordCount);
    console.log("Target Word Count Min:", targetWordCountMin);
    console.log("Target Word Count Max:", targetWordCountMax);
    setIsSubmitting(true);
    setError(null);
    setAnalysisReport(null);

    try {
      // FIXED: Remove await since generateReport is synchronous
      // Wrap in setTimeout to simulate async behavior and allow UI to update
      setTimeout(() => {
        try {
          const report = NSWEvaluationReportGenerator.generateReport({
            essayContent: content,
            textType: textType,
            prompt: prompt,
            wordCount: wordCount,
            targetWordCountMin: targetWordCountMin,
            targetWordCountMax: targetWordCountMax,
          });
          console.log("Report generated successfully:", report);
          setAnalysisReport(report);
          onSubmissionComplete?.(report);
          setIsSubmitting(false);
          console.log("Submission process finished.");
        } catch (err) {
          console.error('Submission error:', err);
          setError('Failed to generate analysis report. Please try again.');
          setIsSubmitting(false);
        }
      }, 100); // Small delay to allow UI to show loading state
    } catch (err) {
      console.error('Submission error:', err);
      setError('Failed to generate analysis report. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleDownloadReport = () => {
    if (analysisReport) {
      const reportText = `NSW Selective Writing Evaluation Report\n\n` +
                         `Text Type: ${textType}\n` +
                         `Prompt: ${prompt}\n` +
                         `Word Count: ${wordCount}\n` +
                         `\n--- Detailed Report ---\n\n` +
                         `Overall Score: ${analysisReport.overallScore}/100\n` +
                         `Grade: ${analysisReport.grade}\n\n` +
                         `Content & Ideas: ${analysisReport.domains.contentAndIdeas.score}/25\n` +
                         `  Feedback: ${analysisReport.domains.contentAndIdeas.feedback}\n\n` +
                         `Text Structure: ${analysisReport.domains.textStructure.score}/25\n` +
                         `  Feedback: ${analysisReport.domains.textStructure.feedback}\n\n` +
                         `Language Features: ${analysisReport.domains.languageFeatures.score}/25\n` +
                         `  Feedback: ${analysisReport.domains.languageFeatures.feedback}\n\n` +
                         `Spelling & Grammar: ${analysisReport.domains.spellingAndGrammar.score}/25\n` +
                         `  Feedback: ${analysisReport.domains.spellingAndGrammar.feedback}\n\n` +
                         `Recommendations:\n${analysisReport.recommendations.map((rec: string) => `- ${rec}`).join('\n')}\n\n` +
                         `Specific Examples:\n${analysisReport.specificExamples.map((ex: { type: string; text: string; feedback: string }) => `  ${ex.type}: "${ex.text}" - ${ex.feedback}`).join('\n')}\n`;

      const blob = new Blob([reportText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `NSW_Writing_Report_${textType.replace(/\s/g, '_')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Submit for Evaluation</h2>

      <div className="flex items-center space-x-4 mb-6">
        <FileText className="w-6 h-6 text-gray-600 dark:text-gray-400" />
        <span className={`font-medium ${getWordCountStatus().color}`}>
          {wordCount} words
        </span>
        <span className="text-sm text-gray-500">
          ({getWordCountStatus().message})
        </span>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={isSubmitting || content.trim().length === 0 || !getWordCountStatus().isValid}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="animate-spin mr-2" size={20} />
            Analyzing...
          </>
        ) : (
          'Submit Essay for Evaluation'
        )}
      </button>

      {isSubmitting && (
        <div className="mt-4 text-center text-blue-600 dark:text-blue-400">
          <p>Please wait while we analyze your essay...</p>
        </div>
      )}

      {analysisReport && (
        <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-8">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Evaluation Report</h3>
          <NSWEvaluationReportDisplay report={analysisReport} />
          <button
            onClick={handleDownloadReport}
            className="mt-6 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
          >
            <Download className="mr-2" size={20} />
            Download Report
          </button>
        </div>
      )}
    </div>
  );
}
