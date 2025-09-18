import React, { useState, useEffect } from 'react';
import { Save, Clock, FileText, AlertCircle, Zap, Star, Sparkles, PenTool } from 'lucide-react';
import { AutoSave } from './AutoSave';

interface WritingStatusBarProps {
  wordCount?: number;
  lastSaved?: Date | null;
  isSaving?: boolean;
  showHighlights?: boolean;
  onToggleHighlights?: () => void;
  onEvaluate?: () => void;
  onShowPlanning?: () => void;
  content?: string;
  textType?: string;
  onRestore?: (content: string, textType: string) => void;
  examMode?: boolean;
  examDurationMinutes?: number;
  targetWordCountMin?: number;
  targetWordCountMax?: number;
  onSubmitForEvaluation?: () => void;
  evaluationStatus?: "idle" | "loading" | "success" | "error";
}

export function WritingStatusBar({
  wordCount = 0,
  lastSaved,
  isSaving = false,
  showHighlights = true,
  onToggleHighlights,
  onEvaluate,
  onShowPlanning,
  content = '',
  textType = '',
  onRestore,
  examMode = false,
  examDurationMinutes = 30,
  targetWordCountMin = 100,
  targetWordCountMax = 500,
  onSubmitForEvaluation,
  evaluationStatus = "idle",
}: WritingStatusBarProps) {
  const [typingStartTime, setTypingStartTime] = useState<number | null>(null);
  const [wordsPerMinute, setWordsPerMinute] = useState(0);
  const [showWordCountWarning, setShowWordCountWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(examDurationMinutes * 60);
  const [timerActive, setTimerActive] = useState(false);

  // Calculate statistics
  useEffect(() => {
    const words = content && content.trim() ? content.trim().split(/\s+/).filter(Boolean) : [];

    if (content && content.length > 0 && typingStartTime === null) {
      setTypingStartTime(Date.now());
    } else if (!content || content.length === 0) {
      setTypingStartTime(null);
      setWordsPerMinute(0);
    }

    if (typingStartTime !== null && words.length > 0) {
      const timeElapsedSeconds = (Date.now() - typingStartTime) / 1000;
      if (timeElapsedSeconds > 5) { // Only calculate WPM after 5 seconds of typing
        const minutes = timeElapsedSeconds / 60;
        setWordsPerMinute(Math.round(words.length / minutes));
      }
    }
    
    if (examMode) {
      setShowWordCountWarning(words.length < targetWordCountMin || words.length > targetWordCountMax);
    } else {
      setShowWordCountWarning(words.length < 100 || words.length > 500);
    }
  }, [content, examMode, targetWordCountMin, targetWordCountMax, typingStartTime]);

  // Timer logic
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (examMode && timerActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setTimerActive(false);
    }
    return () => clearInterval(timer);
  }, [examMode, timerActive, timeLeft]);

  useEffect(() => {
    if (examMode) {
      setTimerActive(true);
    }
  }, [examMode]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-wrap justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-t-4 border-blue-200 dark:border-blue-800 rounded-b-xl text-sm">
      <div className="flex items-center space-x-6 text-gray-700 dark:text-gray-300">
        {examMode && (
          <div className="flex items-center bg-red-100 text-red-700 px-3 py-1.5 rounded-full shadow-sm font-bold text-lg animate-pulse">
            <Clock className="w-6 h-6 mr-2" />
            <span>Time Left: {formatTime(timeLeft)}</span>
          </div>
        )}

        <div className="flex items-center bg-white bg-opacity-70 px-3 py-1.5 rounded-full shadow-sm">
          <FileText className="w-5 h-5 mr-2 text-blue-500" />
          <span className="font-bold">{wordCount} words</span>
          {examMode && (
            <span className="ml-2 text-gray-500 dark:text-gray-400">({targetWordCountMin}-{targetWordCountMax} words)</span>
          )}
          
          {showWordCountWarning && (
            <div className="ml-2 flex items-center">
              <div className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-bold flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {wordCount < targetWordCountMin ? 'Write more!' : 'Word count exceeded!'}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center bg-white bg-opacity-70 px-3 py-1.5 rounded-full shadow-sm">
          <Clock className="w-5 h-5 mr-2 text-orange-500" />
          <span className="font-bold">{wordsPerMinute} WPM</span>
        </div>

        {/* Submit for Evaluation Report Button - moved here and updated color */}
        {onSubmitForEvaluation && (
          <button
            type="button"
            className="px-4 py-2 rounded-xl bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 shadow-sm font-bold"
            onClick={onSubmitForEvaluation}
            disabled={evaluationStatus === "loading"}
            aria-label="Submit for Evaluation Report"
          >
            {evaluationStatus === "loading" ? "Analyzing…" : "Submit for Evaluation"}
          </button>
        )}
      </div>
      
      <div className="flex items-center">
        {content && textType && onRestore && (
          <AutoSave 
            content={content} 
            textType={textType}
            onRestore={onRestore}
          />
        )}
        
        {isSaving && (
          <div className="flex items-center bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full shadow-sm ml-4">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2"></div>
            <span className="font-bold">Saving...</span>
          </div>
        )}
        
        {lastSaved && !isSaving && (
          <div className="flex items-center bg-white bg-opacity-70 px-3 py-1.5 rounded-full shadow-sm ml-4">
            <Save className="w-5 h-5 mr-2 text-blue-500" />
            <span className="font-bold text-gray-700">Saved at: {lastSaved.toLocaleTimeString()}</span>
            <Sparkles className="w-4 h-4 ml-2 text-yellow-500" />
          </div>
        )}
      </div>
    </div>
  );
}