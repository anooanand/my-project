import React, { useState, useEffect } from 'react';
import { Save, Clock, FileText, AlertCircle, Zap, Star, Sparkles, PenTool } from 'lucide-react';
import { AutoSave } from './AutoSave';

interface WritingStatusBarProps {

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
  const [typingStartTime, setTypingStartTime] = useState<number | null>(null);
  const [wordsPerMinute, setWordsPerMinute] = useState(0);
  const [showWordCountWarning, setShowWordCountWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(examDurationMinutes * 60);
  const [timerActive, setTimerActive] = useState(false);



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
    <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-wrap justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-t-4 border-blue-200 dark:border-blue-800 rounded-t-xl text-sm shadow-lg">
      <div className="flex items-center space-x-6 text-gray-700 dark:text-gray-300">
        {examMode && (
          <div className="flex items-center bg-red-100 text-red-700 px-3 py-1.5 rounded-full shadow-sm font-bold text-lg animate-pulse">
            <Clock className="w-6 h-6 mr-2" />
            <span>Time Left: {formatTime(timeLeft)}</span>
          </div>
        )}


        
        <div className="flex items-center bg-white bg-opacity-70 px-3 py-1.5 rounded-full shadow-sm">
          <Clock className="w-5 h-5 mr-2 text-orange-500" />
          <span className="font-bold">{wordsPerMinute} WPM</span>
        </div>


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
