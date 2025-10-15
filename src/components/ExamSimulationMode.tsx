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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Essay Submitted Successfully!</h1>
            <p className="text-green-100 text-lg">Your practice exam has been completed</p>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">Word Count</p>
                <p className="text-3xl font-bold text-gray-900">{wordCount}</p>
                <p className="text-xs text-gray-500">words</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">Time Used</p>
                <p className="text-3xl font-bold text-gray-900">{formatTime(30 * 60 - timeRemaining)}</p>
                <p className="text-xs text-gray-500">minutes</p>
              </div>
            </div>
            <button
              onClick={onExit}
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">NSW Selective Writing Test</h1>
                <p className="text-sm text-gray-600">Practice Exam Mode</p>
              </div>
            </div>
            <button
              onClick={onExit}
              className="p-2.5 hover:bg-gray-100 rounded-xl transition-all duration-200 group"
              aria-label="Exit exam mode"
            >
              <X className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Timer and Controls */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Time Remaining</p>
                  <p className={`text-3xl font-bold ${getTimeColor()}`}>
                    {formatTime(timeRemaining)}
                  </p>
                </div>
              </div>
              <div className="h-12 w-px bg-gray-300"></div>
              <div>
                <p className="text-sm text-gray-600">Word Count</p>
                <p className="text-3xl font-bold text-gray-900">{wordCount}</p>
              </div>
            </div>
            <div className="flex space-x-3">
              {!isActive && timeRemaining > 0 && !isSubmitted && (
                <button
                  onClick={handleStartExam}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all transform hover:scale-105 shadow-lg"
                >
                  {timeRemaining === 30 * 60 ? 'Start Exam' : 'Resume'}
                </button>
              )}
              {isActive && (
                <button
                  onClick={handlePauseExam}
                  className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold hover:from-amber-600 hover:to-orange-600 transition-all transform hover:scale-105 shadow-lg"
                >
                  Pause
                </button>
              )}
              {content.trim().length > 0 && !isSubmitted && (
                <button
                  onClick={handleSubmit}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
                >
                  Submit Essay
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Writing Prompt */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Writing Prompt</h2>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6">
            <p className="text-gray-800 leading-relaxed">
              <strong className="text-lg text-blue-900">Persuasive Writing Task:</strong><br /><br />
              <span className="text-base font-medium">"Should schools replace traditional textbooks with digital devices like tablets and laptops?"</span>
              <br /><br />
              <strong className="text-gray-900">In your response, you should:</strong>
              <br />• Present a clear position on this issue
              <br />• Support your argument with relevant examples and evidence
              <br />• Consider and address opposing viewpoints
              <br />• Use persuasive language techniques effectively
              <br />• Organize your ideas in a logical structure
              <br /><br />
              <em className="text-sm text-gray-600">Target: 300-500 words | Time: 30 minutes</em>
            </p>
          </div>
        </div>

        {/* Writing Area */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Your Response</h3>
            <span className="text-sm text-gray-500">{!isActive && timeRemaining > 0 ? "Ready to start" : isActive ? "Writing in progress" : "Completed"}</span>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-96 p-6 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-base leading-relaxed transition-all"
            placeholder="Click 'Start Exam' above to begin writing your persuasive essay..."
            disabled={!isActive && timeRemaining > 0}
          />
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {!isActive && timeRemaining > 0 && (
                <div className="flex items-center space-x-2 text-blue-600">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span className="text-sm font-medium">Click 'Start Exam' to begin</span>
                </div>
              )}
              {isActive && (
                <div className="flex items-center space-x-2 text-green-600">
                  <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Exam in progress</span>
                </div>
              )}
              {timeRemaining === 0 && (
                <div className="flex items-center space-x-2 text-orange-600">
                  <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                  <span className="text-sm font-medium">Time's up - submitted automatically</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
              <h3 className="text-2xl font-bold text-white mb-2">Confirm Submission</h3>
              <p className="text-blue-100">Ready to submit your essay?</p>
            </div>
            <div className="p-6">
              <div className="bg-blue-50 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Time Remaining</span>
                  <span className="text-lg font-bold text-gray-900">{formatTime(timeRemaining)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Word Count</span>
                  <span className="text-lg font-bold text-gray-900">{wordCount} words</span>
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-6">
                Once submitted, you won't be able to make any changes. Make sure you're happy with your essay before proceeding.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={cancelSubmit}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  Keep Writing
                </button>
                <button
                  onClick={confirmSubmit}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}