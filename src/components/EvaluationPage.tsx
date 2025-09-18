import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NSWStandaloneSubmitSystem } from './NSWStandaloneSubmitSystem';
import { ArrowLeft, FileText } from 'lucide-react';

export function EvaluationPage() {
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [textType, setTextType] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [prompt, setPrompt] = useState('');

  useEffect(() => {
    // Retrieve submitted essay data from localStorage
    const submittedEssay = localStorage.getItem('submittedEssay') || '';
    const submittedTextType = localStorage.getItem('submittedTextType') || 'narrative';
    const generatedPrompt = localStorage.getItem('generatedPrompt') || '';

    setContent(submittedEssay);
    setTextType(submittedTextType);
    setPrompt(generatedPrompt);

    // Calculate word count
    const words = submittedEssay.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, []);

  const handleEvaluationComplete = (report: any) => {
    console.log('Evaluation completed:', report);
    // Store the evaluation report for later access
    localStorage.setItem('lastEvaluationReport', JSON.stringify(report));
  };

  const handleBackToWriting = () => {
    navigate('/writing');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackToWriting}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Writing</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-2xl font-bold text-gray-900">Essay Evaluation</h1>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <FileText className="w-4 h-4" />
              <span>{textType.charAt(0).toUpperCase() + textType.slice(1)} Essay</span>
              <span>•</span>
              <span>{wordCount} words</span>
            </div>
          </div>
        </div>

        {/* Essay Preview */}
        {content && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Essay</h2>
            {prompt && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="font-medium text-blue-900 mb-2">Prompt:</h3>
                <p className="text-blue-800 text-sm">{prompt}</p>
              </div>
            )}
            <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
              <p className="text-gray-700 whitespace-pre-wrap">{content}</p>
            </div>
          </div>
        )}

        {/* Evaluation System */}
        <NSWStandaloneSubmitSystem
          content={content}
          wordCount={wordCount}
          targetWordCountMin={100}
          targetWordCountMax={500}
          textType={textType}
          prompt={prompt}
          onSubmissionComplete={handleEvaluationComplete}
        />
      </div>
    </div>
  );
}

