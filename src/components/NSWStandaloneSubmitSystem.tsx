import React, { useState } from 'react';
import { Clock, FileText, Loader2, Award, BarChart3, CheckCircle, AlertCircle } from 'lucide-react';
import { NSWEvaluationReportGenerator } from './NSWEvaluationReportGenerator';
import { NSWEvaluationReportDisplay } from './NSWEvaluationReportDisplay';

interface NSWStandaloneSubmitSystemProps {
  content: string;
  wordCount: number;
  targetWordCountMin?: number;
  targetWordCountMax?: number;
  textType?: string;
  prompt?: string;
  onSubmissionComplete?: (report: any) => void;
}

export function NSWStandaloneSubmitSystem({
  content,
  wordCount,
  targetWordCountMin = 100,
  targetWordCountMax = 500,
  textType = 'narrative',
  prompt = '',
  onSubmissionComplete
}: NSWStandaloneSubmitSystemProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluationReport, setEvaluationReport] = useState<any>(null);
  const [showReport, setShowReport] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'analyzing' | 'generating' | 'complete'>('idle');

  const handleSubmitForEvaluation = async () => {
    if (isSubmitting || wordCount < targetWordCountMin) return;

    setIsSubmitting(true);
    setSubmissionStatus('analyzing');

    try {
      // Simulate analysis time for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSubmissionStatus('generating');
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Generate the comprehensive evaluation report
      const report = NSWEvaluationReportGenerator.generateReport(content, textType);
      
      setEvaluationReport(report);
      setSubmissionStatus('complete');
      setShowReport(true);

      // Call the completion callback if provided
      if (onSubmissionComplete) {
        onSubmissionComplete(report);
      }

    } catch (error) {
      console.error('Error generating evaluation report:', error);
      setSubmissionStatus('idle');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSubmitButtonState = () => {
    if (isSubmitting) {
      return {
        disabled: true,
        text: submissionStatus === 'analyzing' ? 'Analyzing Essay...' : 'Generating Report...',
        className: 'bg-blue-400 cursor-not-allowed'
      };
    }
    
    if (wordCount < targetWordCountMin) {
      return {
        disabled: true,
        text: `Submit for Evaluation Report (${targetWordCountMin - wordCount} more words needed)`,
        className: 'bg-gray-400 cursor-not-allowed'
      };
    }
    
    if (wordCount > targetWordCountMax) {
      return {
        disabled: false,
        text: `Submit for Evaluation Report (${wordCount - targetWordCountMax} words over limit)`,
        className: 'bg-orange-600 hover:bg-orange-700'
      };
    }
    
    return {
      disabled: false,
      text: 'Submit for Evaluation Report',
      className: 'bg-blue-600 hover:bg-blue-700'
    };
  };

  const getWordCountStatus = () => {
    if (wordCount < targetWordCountMin) {
      return { 
        color: 'text-red-600', 
        message: `${targetWordCountMin - wordCount} words needed`,
        icon: AlertCircle
      };
    } else if (wordCount > targetWordCountMax) {
      return { 
        color: 'text-orange-600', 
        message: `${wordCount - targetWordCountMax} words over limit`,
        icon: AlertCircle
      };
    } else {
      return { 
        color: 'text-green-600', 
        message: 'Word count on target',
        icon: CheckCircle
      };
    }
  };

  const buttonState = getSubmitButtonState();
  const wordStatus = getWordCountStatus();
  const StatusIcon = wordStatus.icon;

  // If showing the report, render the full report display
  if (showReport && evaluationReport) {
    return (
      <NSWEvaluationReportDisplay
        report={evaluationReport}
        essayText={content}
        onClose={() => setShowReport(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Submit Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <Award className="w-6 h-6 mr-2 text-blue-600" />
          NSW Selective Writing Evaluation
        </h2>
        
        <div className="mb-6">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Submit your essay for a comprehensive evaluation based on official NSW Selective Writing assessment criteria. 
            Your essay will be analyzed across four key domains:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">Content & Ideas (40%)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-600 rounded-full"></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">Text Structure (20%)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">Language Features (25%)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-orange-600 rounded-full"></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">Spelling & Grammar (15%)</span>
            </div>
          </div>
        </div>

        {/* Word Count Status */}
        <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {wordCount} words
            </span>
          </div>
          
          <div className={`flex items-center space-x-2 ${wordStatus.color}`}>
            <StatusIcon className="w-4 h-4" />
            <span className="text-sm font-medium">
              {wordStatus.message}
            </span>
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmitForEvaluation}
          disabled={buttonState.disabled}
          className={`w-full ${buttonState.className} text-white px-6 py-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 text-lg`}
        >
          {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
          <Award className="w-5 h-5" />
          <span>{buttonState.text}</span>
        </button>

        {/* Submission Progress */}
        {isSubmitting && (
          <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center space-x-3 mb-3">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <div>
                <p className="text-blue-900 dark:text-blue-100 font-medium">
                  {submissionStatus === 'analyzing' ? 'Analyzing Your Essay...' : 'Generating Evaluation Report...'}
                </p>
                <p className="text-blue-700 dark:text-blue-300 text-sm">
                  {submissionStatus === 'analyzing' 
                    ? 'Examining content, structure, language features, and technical accuracy...'
                    : 'Creating comprehensive feedback and recommendations...'
                  }
                </p>
              </div>
            </div>
            
            {/* Progress Steps */}
            <div className="flex items-center space-x-4 text-sm">
              <div className={`flex items-center space-x-1 ${submissionStatus === 'analyzing' ? 'text-blue-600' : 'text-green-600'}`}>
                <div className={`w-2 h-2 rounded-full ${submissionStatus === 'analyzing' ? 'bg-blue-600 animate-pulse' : 'bg-green-600'}`}></div>
                <span>Analysis</span>
              </div>
              <div className={`flex items-center space-x-1 ${submissionStatus === 'generating' ? 'text-blue-600' : submissionStatus === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-2 h-2 rounded-full ${submissionStatus === 'generating' ? 'bg-blue-600 animate-pulse' : submissionStatus === 'complete' ? 'bg-green-600' : 'bg-gray-400'}`}></div>
                <span>Report Generation</span>
              </div>
              <div className={`flex items-center space-x-1 ${submissionStatus === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-2 h-2 rounded-full ${submissionStatus === 'complete' ? 'bg-green-600' : 'bg-gray-400'}`}></div>
                <span>Complete</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Information Panel */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800 p-6">
        <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100 mb-3 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2" />
          What You'll Receive
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-indigo-800 dark:text-indigo-200 text-sm">
                Overall grade and score based on NSW criteria
              </span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-indigo-800 dark:text-indigo-200 text-sm">
                Detailed feedback for each assessment domain
              </span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-indigo-800 dark:text-indigo-200 text-sm">
                Specific examples from your writing
              </span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-indigo-800 dark:text-indigo-200 text-sm">
                Personalized improvement recommendations
              </span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-indigo-800 dark:text-indigo-200 text-sm">
                Technical analysis of language features
              </span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-indigo-800 dark:text-indigo-200 text-sm">
                Downloadable report for future reference
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Previous Report Access */}
      {evaluationReport && !showReport && (
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-green-800 dark:text-green-200 font-medium">
                Evaluation Complete - Grade: {evaluationReport.overallGrade}
              </span>
            </div>
            <button
              onClick={() => setShowReport(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
            >
              View Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
}