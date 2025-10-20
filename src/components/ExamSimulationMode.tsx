import React, { useState, useEffect } from 'react';
import { Clock, X, FileText, AlertCircle, CheckCircle } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200 sticky top-0 z-20">
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
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 p-6 mb-6 sticky top-20 z-10">
          <div className="flex justify-end items-center">
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
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6 flex-1 min-h-[400px]">
            <p className="text-gray-800 leading-relaxed">
              <strong className="text-lg text-blue-900">Persuasive Writing Task:</strong>  
  

              <span className="text-base font-medium">"Should schools replace traditional textbooks with digital devices like tablets and laptops?"</span>
                
  

              <strong className="text-gray-900">In your response, you should:</strong>
                
• Present a clear position on this issue
                
• Support your argument with relevant examples and evidence
                
• Consider and address opposing viewpoints
                
• Use persuasive language techniques effectively
                
• Organize your ideas in a logical structure
                
  

              <em className="text-sm text-gray-600">Target: 300-500 words | Time: 30 minutes</em>
            </p>
          </div>
        </div>

        {/* Writing Area */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 p-6">
          <textarea
            disabled={!isActive}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-[600px] p-6 bg-gray-50/50 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none text-lg leading-relaxed text-gray-800 placeholder-gray-400"
            placeholder={isActive ? "Start writing your response here..." : "Click Start Exam to begin"}
          />
        </div>
      </div>

      {content.trim().length > 0 && !isSubmitted && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md p-4 border-t border-gray-200 shadow-lg z-20">
          <div className="max-w-6xl mx-auto">
            <button
              onClick={handleSubmit}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
            >
              Submit Essay
            </button>
          </div>
        </div>
      )}

      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-gray-200 p-8 text-center">
            <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Are you sure?</h2>
            <p className="text-gray-600 mb-8">You are about to submit your essay. This action cannot be undone.</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={cancelSubmit}
                className="px-8 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmSubmit}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
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
