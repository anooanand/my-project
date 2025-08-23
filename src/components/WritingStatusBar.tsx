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
}: WritingStatusBarProps) {
  const [characterCount, setCharacterCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const [showWordCountWarning, setShowWordCountWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(examDurationMinutes * 60);
  const [timerActive, setTimerActive] = useState(false);

  // Calculate statistics
  useEffect(() => {
    const words = content && content.trim() ? content.trim().split(/\s+/).filter(Boolean) : [];
    setCharacterCount(content ? content.length : 0);
    setReadingTime(Math.ceil(words.length / 200));
    
    if (examMode) {
      setShowWordCountWarning(words.length < targetWordCountMin || words.length > targetWordCountMax);
    } else {
      setShowWordCountWarning(words.length < 100 || words.length > 500);
    }
  }, [content, examMode, targetWordCountMin, targetWordCountMax]);

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
          <Zap className="w-5 h-5 mr-2 text-purple-500" />
          <span className="font-bold">{characterCount} characters</span>
        </div>
        
        <div className="flex items-center bg-white bg-opacity-70 px-3 py-1.5 rounded-full shadow-sm">
          <Clock className="w-5 h-5 mr-2 text-green-500" />
          <span className="font-bold">{readingTime} min read</span>
          {readingTime >= 3 && (
            <div className="ml-2">
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold flex items-center">
                <Star className="w-3 h-3 mr-1" />
                Great job!
              </span>
            </div>
          )}
        </div>

        {/* Planning Button */}
        {onShowPlanning && (
          <button
            onClick={onShowPlanning}
            className="flex items-center bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-3 py-1.5 rounded-full shadow-sm font-bold transition-colors duration-200"
          >
            <PenTool className="w-5 h-5 mr-2" />
            Planning
          </button>
        )}

        {/* Toggle Highlights Button */}
        {onToggleHighlights && (
          <button
            onClick={onToggleHighlights}
            className={`flex items-center px-3 py-1.5 rounded-full shadow-sm font-bold transition-colors duration-200 ${
              showHighlights 
                ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <Sparkles className="w-5 h-5 mr-2" />
            {showHighlights ? 'Hide' : 'Show'} Highlights
          </button>
        )}

        {/* Evaluate Button */}
        {onEvaluate && (
          <button
            onClick={onEvaluate}
            className="flex items-center bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1.5 rounded-full shadow-sm font-bold transition-colors duration-200"
          >
            <Star className="w-5 h-5 mr-2" />
            Evaluate
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
