import React, { useState, useEffect } from 'react';
import { Clock, X, FileText, AlertCircle, CheckCircle, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { evaluateEssay } from '../lib/openai';

interface ExamSimulationModeProps {
  textType: string;
  prompt: string;
  onExit: () => void;
}

export function ExamSimulationMode({ onExit, textType, prompt }: ExamSimulationModeProps) {
  const navigate = useNavigate();
  const [timeRemaining, setTimeRemaining] = useState(30 * 60); // 30 minutes in seconds
  const [isActive, setIsActive] = useState(true); // Start timer automatically
  const [content, setContent] = useState('');
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [promptExpanded, setPromptExpanded] = useState(true);

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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = () => {
    setShowSubmitConfirm(true);
  };

  const confirmSubmit = async () => {
    if (!content.trim() || content.trim().length < 20) {
      alert("Please write at least 20 characters before submitting for evaluation.");
      setShowSubmitConfirm(false);
      return;
    }

    setIsSubmitted(true);
    setIsActive(false);
    setShowSubmitConfirm(false);
    
    // Store the essay for evaluation
    localStorage.setItem('examEssay', content);
    localStorage.setItem('examSubmissionTime', new Date().toISOString());
    localStorage.setItem("examTimeUsed", (30 * 60 - timeRemaining).toString());

    // Call evaluateEssay with isPractice flag
    try {
      const feedbackReport = await evaluateEssay(content, textType, true);
      console.log("Practice Exam Feedback Report:", feedbackReport);
      // Navigate to a feedback display page, passing the report
      navigate("/feedback", { state: { feedback: feedbackReport, essayContent: content, textType: textType } });
    } catch (error) {
      console.error("Error generating practice exam feedback:", error);
      // Handle error, maybe navigate to an error page or show a message
      alert("Failed to generate evaluation report. Please try again.");
    }
    
    console.log('Exam essay submitted:', {
      content,
      timeUsed: 30 * 60 - timeRemaining
    });
  };

  const handleAutoSubmit = async () => {
    setIsSubmitted(true);

    if (!content.trim() || content.trim().length < 20) {
      console.warn("Auto-submit with essay too short. Skipping evaluation.");
      return;
    }

    localStorage.setItem('examEssay', content);
    localStorage.setItem('examSubmissionTime', new Date().toISOString());
    localStorage.setItem("examTimeUsed", (30 * 60).toString());

    // Call evaluateEssay with isPractice flag for auto-submit
    try {
      const feedbackReport = await evaluateEssay(content, textType, true);
      console.log("Practice Exam Auto-Submit Feedback Report:", feedbackReport);
      navigate("/feedback", { state: { feedback: feedbackReport, essayContent: content, textType: textType } });
    } catch (error) {
      console.error("Error generating practice exam auto-submit feedback:", error);
      alert("Failed to generate evaluation report on auto-submit. Please try again.");
    }
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
            <div className="bg-purple-50 rounded-xl p-4 text-center mb-8">
              <p className="text-sm text-gray-600 mb-1">Time Used</p>
              <p className="text-3xl font-bold text-gray-900">{formatTime(30 * 60 - timeRemaining)}</p>
              <p className="text-xs text-gray-500">minutes</p>
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
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* NARROWER HEADER */}
      <div className="bg-white border-b border-gray-200 px-6 py-2 flex items-center justify-between h-16">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900">NSW Selective Writing Test</h1>
            <p className="text-xs text-gray-600">Practice Exam Mode</p>
          </div>
        </div>
        <button
          onClick={onExit}
          className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200"
          aria-label="Exit exam mode"
        >
          <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
        </button>
      </div>

      {/* MAIN LAYOUT: Left Prompt Panel + Right Content Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT PANEL - VERTICAL PROMPT */}
        <div className="w-72 flex flex-col bg-gradient-to-b from-blue-50 to-blue-25 border-r border-blue-200 overflow-hidden">
          {/* Prompt Header */}
          <div 
            onClick={() => setPromptExpanded(!promptExpanded)}
            className="px-4 py-3 bg-blue-100 border-b border-blue-200 cursor-pointer hover:bg-blue-150 transition-colors flex items-center justify-between"
          >
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-blue-700" />
              <h2 className="font-semibold text-sm text-blue-900">Writing Prompt</h2>
            </div>
            <ChevronDown 
              className={`w-4 h-4 text-blue-700 transition-transform ${promptExpanded ? 'rotate-180' : ''}`}
            />
          </div>

          {/* Prompt Content */}
          {promptExpanded && (
            <div className="flex-1 overflow-y-auto p-4">
              <p className="text-sm text-blue-800 leading-relaxed whitespace-pre-wrap">
                {prompt}
              </p>
              
              {/* Quick Stats */}
              <div className="mt-6 pt-4 border-t border-blue-200 space-y-3">
                <div className="bg-white bg-opacity-60 rounded p-3">
                  <p className="text-xs font-semibold text-blue-900 mb-1">Target Word Count</p>
                  <p className="text-sm text-blue-700">300-500 words</p>
                </div>
                <div className="bg-white bg-opacity-60 rounded p-3">
                  <p className="text-xs font-semibold text-blue-900 mb-1">Time Limit</p>
                  <p className="text-sm text-blue-700">30 minutes</p>
                </div>
              </div>
            </div>
          )}

          {/* Collapsed State - Show Icon Only */}
          {!promptExpanded && (
            <div className="flex-1 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-blue-300" />
            </div>
          )}
        </div>

        {/* RIGHT PANEL - WRITING AREA */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          
          {/* Timer Bar - Compact */}
          <div className="bg-white border-b border-gray-200 px-6 py-2 flex items-center justify-end">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-gray-600 font-medium">Time Remaining:</span>
              <span className={`text-sm font-bold ${getTimeColor()}`}>
                {formatTime(timeRemaining)}
              </span>
            </div>
          </div>

          {/* Writing Area */}
          <div className="flex-1 flex flex-col p-4 overflow-hidden">
            <textarea
              disabled={!isActive}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 p-4 bg-white rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none text-base leading-relaxed text-gray-800 placeholder-gray-400"
              placeholder={isActive ? "Start writing your response here..." : "Click Start Exam to begin"}
            />
          </div>

          {/* Submit Button */}
          <div className="px-4 pb-4">
            <button
              onClick={handleSubmit}
              disabled={!isActive || content.trim().length === 0}
              className={`w-full py-2.5 px-4 rounded-lg font-semibold text-white text-sm transition-all duration-200 ${
                !isActive || content.trim().length === 0
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md hover:shadow-lg'
              }`}
            >
              Submit Essay
            </button>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 text-center">
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Are you sure?</h2>
            <p className="text-sm text-gray-600 mb-6">You are about to submit your essay. This action cannot be undone.</p>
            <div className="flex justify-center space-x-3">
              <button
                onClick={cancelSubmit}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-all text-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmSubmit}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-md text-sm"
              >
                Confirm & Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
