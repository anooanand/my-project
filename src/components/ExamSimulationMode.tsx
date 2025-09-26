import React, { useState, useEffect } from 'react';
import { Clock, X, FileText, AlertCircle, CheckCircle } from 'lucide-react';

interface ExamSimulationModeProps {
  onExit: () => void;
}

export function ExamSimulationMode({ onExit }: ExamSimulationModeProps) {
  const [timeRemaining, setTimeRemaining] = useState(30 * 60); // 30 minutes in seconds
  const [isActive, setIsActive] = useState(false);
  const [content, setContent] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(time => {
          if (time <= 1) {
            setIsActive(false);
            handleAutoSubmit();
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    } else if (timeRemaining === 0) {
      setIsActive(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeRemaining]);

  // Update word count when content changes
  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [content]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartExam = () => {
    setIsActive(true);
  };

  const handlePauseExam = () => {
    setIsActive(false);
  };

  const handleSubmit = () => {
    setShowSubmitConfirm(true);
  };

  const confirmSubmit = () => {
    setIsSubmitted(true);
    setIsActive(false);
    setShowSubmitConfirm(false);
    
    // Store the essay for evaluation
    localStorage.setItem('examEssay', content);
    localStorage.setItem('examSubmissionTime', new Date().toISOString());
    localStorage.setItem('examTimeUsed', (30 * 60 - timeRemaining).toString());
    
    console.log('Exam essay submitted:', {
      content,
      wordCount,
      timeUsed: 30 * 60 - timeRemaining
    });
  };

  const handleAutoSubmit = () => {
    setIsSubmitted(true);
    localStorage.setItem('examEssay', content);
    localStorage.setItem('examSubmissionTime', new Date().toISOString());
    localStorage.setItem('examTimeUsed', (30 * 60).toString());
  };

  const cancelSubmit = () => {
    setShowSubmitConfirm(false);
  };

  const getTimeColor = () => {
    if (timeRemaining > 600) return 'text-green-600'; // > 10 minutes
    if (timeRemaining > 300) return 'text-yellow-600'; // > 5 minutes
    return 'text-red-600'; // < 5 minutes
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Exam Submitted Successfully!</h1>
          <p className="text-gray-600 mb-2">Word count: {wordCount} words</p>
          <p className="text-gray-600 mb-6">Time used: {formatTime(30 * 60 - timeRemaining)}</p>
          <button
            onClick={onExit}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <FileText className="w-6 h-6 text-blue-600 mr-2" />
              <h1 className="text-xl font-bold text-gray-900">NSW Selective Writing Test - Practice Exam</h1>
            </div>
            <button
              onClick={onExit}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Exit exam mode"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        {/* Timer and Controls */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-gray-500 mr-2" />
                <span className="text-gray-700 font-medium">Time Remaining:</span>
                <span className={`text-2xl font-bold ml-2 ${getTimeColor()}`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                Words: {wordCount}
              </div>
            </div>
            <div className="flex space-x-2">
              {!isActive && timeRemaining > 0 && !isSubmitted && (
                <button
                  onClick={handleStartExam}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  {timeRemaining === 30 * 60 ? 'Start Exam' : 'Resume'}
                </button>
              )}
              {isActive && (
                <button
                  onClick={handlePauseExam}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
                >
                  Pause
                </button>
              )}
              {content.trim().length > 0 && !isSubmitted && (
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Submit Essay
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Writing Prompt */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
            <AlertCircle className="w-5 h-5 text-blue-600 mr-2" />
            Writing Prompt
          </h2>
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <p className="text-gray-800 leading-relaxed">
              <strong>Persuasive Writing Task:</strong><br />
              "Should schools replace traditional textbooks with digital devices like tablets and laptops?"
              <br /><br />
              In your response, you should:
              <br />• Present a clear position on this issue
              <br />• Support your argument with relevant examples and evidence
              <br />• Consider and address opposing viewpoints
              <br />• Use persuasive language techniques effectively
              <br />• Organize your ideas in a logical structure
              <br /><br />
              <em>Aim for 300-500 words. You have 30 minutes to complete this task.</em>
            </p>
          </div>
        </div>

        {/* Writing Area */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Your Response</h3>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-96 p-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            placeholder="Start writing your persuasive essay here..."
            disabled={!isActive && timeRemaining > 0}
          />
          <div className="mt-2 text-sm text-gray-500">
            {!isActive && timeRemaining > 0 && "Click 'Start Exam' to begin writing"}
            {isActive && "Exam in progress - keep writing!"}
            {timeRemaining === 0 && "Time's up! Your essay has been automatically submitted."}
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Submission</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to submit your essay? You have {formatTime(timeRemaining)} remaining.
              <br /><br />
              Word count: {wordCount} words
            </p>
            <div className="flex space-x-3">
              <button
                onClick={cancelSubmit}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Continue Writing
              </button>
              <button
                onClick={confirmSubmit}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Submit Essay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}