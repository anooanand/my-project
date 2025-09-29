import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Clock, 
  Target, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle,
  Star,
  Award,
  BookOpen,
  Timer,
  Zap
} from 'lucide-react';

interface NSWProgressTrackerProps {
  content: string;
  textType: string;
  examMode?: boolean;
  timeRemaining?: number;
  onTimeWarning?: (warning: string) => void;
  darkMode?: boolean;
  className?: string;
}

interface ProgressMetrics {
  wordCount: number;
  targetWordCount: number;
  wordCountPercentage: number;
  timeElapsed: number;
  estimatedTimeRemaining: number;
  writingPace: number; // words per minute
  overallStars: number;
  performanceLevel: 'Excellent' | 'Good' | 'Fair' | 'Needs Improvement';
}

// Progress Analysis Engine
class NSWProgressAnalyzer {
  static analyzeProgress(
    content: string, 
    textType: string, 
    timeElapsed: number,
    examMode: boolean = false
  ): ProgressMetrics {
    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
    const targetWordCount = examMode ? 250 : 300; // NSW exam target vs practice target
    const wordCountPercentage = Math.min((wordCount / targetWordCount) * 100, 100);
    
    // Calculate writing pace (words per minute)
    const timeInMinutes = timeElapsed / 60;
    const writingPace = timeInMinutes > 0 ? wordCount / timeInMinutes : 0;
    
    // Estimate time remaining based on current pace
    const wordsRemaining = Math.max(0, targetWordCount - wordCount);
    const estimatedTimeRemaining = writingPace > 0 ? (wordsRemaining / writingPace) * 60 : 0;
    
    // Calculate overall performance
    const overallStars = this.calculateOverallStars(content, wordCount, targetWordCount, timeElapsed, examMode);
    const performanceLevel = this.getPerformanceLevel(overallStars);
    
    return {
      wordCount,
      targetWordCount,
      wordCountPercentage,
      timeElapsed,
      estimatedTimeRemaining,
      writingPace,
      overallStars,
      performanceLevel
    };
  }
  
  static calculateOverallStars(
    content: string, 
    wordCount: number, 
    targetWordCount: number, 
    timeElapsed: number,
    examMode: boolean
  ): number {
    let stars = 0;
    
    // Word count progress (0-2 stars)
    const wordProgress = wordCount / targetWordCount;
    if (wordProgress >= 0.8) stars += 2;
    else if (wordProgress >= 0.5) stars += 1;
    
    // Content quality indicators (0-2 stars)
    const qualityIndicators = [
      content.includes('.') || content.includes('!') || content.includes('?'), // Has sentences
      content.split('\n\n').length > 1, // Has paragraphs
      /[A-Z]/.test(content), // Has capital letters
      content.length > 100 // Substantial content
    ];
    const qualityScore = qualityIndicators.filter(Boolean).length;
    if (qualityScore >= 3) stars += 2;
    else if (qualityScore >= 2) stars += 1;
    
    // Time management (0-1 star)
    if (examMode) {
      const timeInMinutes = timeElapsed / 60;
      const expectedProgress = timeInMinutes / 30; // 30 minutes total
      const actualProgress = wordCount / targetWordCount;
      if (actualProgress >= expectedProgress * 0.8) stars += 1;
    } else {
      stars += 1; // No time pressure in practice mode
    }
    
    return Math.min(5, stars);
  }
  
  static getPerformanceLevel(stars: number): 'Excellent' | 'Good' | 'Fair' | 'Needs Improvement' {
    if (stars >= 4) return 'Excellent';
    if (stars >= 3) return 'Good';
    if (stars >= 2) return 'Fair';
    return 'Needs Improvement';
  }
  
  static getTimeWarningLevel(timeRemaining: number, examMode: boolean): 'none' | 'low' | 'medium' | 'high' {
    if (!examMode) return 'none';
    
    if (timeRemaining <= 300) return 'high'; // 5 minutes
    if (timeRemaining <= 600) return 'medium'; // 10 minutes
    if (timeRemaining <= 900) return 'low'; // 15 minutes
    return 'none';
  }
}

// Time formatter utility
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Star display component
const StarDisplay: React.FC<{ stars: number; maxStars?: number; size?: 'sm' | 'md' | 'lg' }> = ({ 
  stars, 
  maxStars = 5, 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };
  
  return (
    <div className="flex items-center space-x-1">
      {Array.from({ length: maxStars }, (_, index) => (
        <Star
          key={index}
          className={`${sizeClasses[size]} ${
            index < stars 
              ? 'text-yellow-400 fill-yellow-400' 
              : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  );
};

// Progress bar component
const ProgressBar: React.FC<{ 
  percentage: number; 
  color?: string; 
  showLabel?: boolean;
  height?: 'sm' | 'md' | 'lg';
}> = ({ 
  percentage, 
  color = 'bg-gradient-to-r from-green-500 to-green-600', 
  showLabel = false,
  height = 'md'
}) => {
  const heightClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };
  
  return (
    <div className="relative">
      <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${heightClasses[height]}`}>
        <div 
          className={`${color} ${heightClasses[height]} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      {showLabel && (
        <span className="absolute right-0 top-0 transform translate-y-full text-xs text-gray-600 dark:text-gray-400 mt-1">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
};

// Main NSW Progress Tracker Component
export const NSWProgressTracker: React.FC<NSWProgressTrackerProps> = ({
  content,
  textType,
  examMode = false,
  timeRemaining = 0,
  onTimeWarning,
  darkMode = false,
  className = ""
}) => {
  const [metrics, setMetrics] = useState<ProgressMetrics | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [lastWarningLevel, setLastWarningLevel] = useState<string>('none');
  
  // Update metrics when content changes
  useEffect(() => {
    const newMetrics = NSWProgressAnalyzer.analyzeProgress(content, textType, timeElapsed, examMode);
    setMetrics(newMetrics);
  }, [content, textType, timeElapsed, examMode]);
  
  // Handle time warnings
  useEffect(() => {
    if (examMode && timeRemaining > 0) {
      const warningLevel = NSWProgressAnalyzer.getTimeWarningLevel(timeRemaining, examMode);
      
      if (warningLevel !== lastWarningLevel && warningLevel !== 'none') {
        const warnings = {
          low: "⏰ 15 minutes remaining - you're doing great!",
          medium: "⚠️ 10 minutes left - focus on completing your story",
          high: "🚨 5 minutes remaining - wrap up your conclusion!"
        };
        
        if (onTimeWarning && warnings[warningLevel as keyof typeof warnings]) {
          onTimeWarning(warnings[warningLevel as keyof typeof warnings]);
        }
        setLastWarningLevel(warningLevel);
      }
    }
  }, [timeRemaining, examMode, onTimeWarning, lastWarningLevel]);
  
  if (!metrics) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="animate-pulse">
          <div className={`h-4 rounded mb-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
        </div>
      </div>
    );
  }
  
  const getTimeWarningClass = () => {
    if (!examMode) return '';
    const warningLevel = NSWProgressAnalyzer.getTimeWarningLevel(timeRemaining, examMode);
    
    switch (warningLevel) {
      case 'high': return 'text-red-600 font-bold animate-pulse';
      case 'medium': return 'text-orange-600 font-semibold';
      case 'low': return 'text-yellow-600';
      default: return darkMode ? 'text-gray-300' : 'text-gray-700';
    }
  };
  
  const getWordCountColor = () => {
    if (metrics.wordCount > metrics.targetWordCount * 1.2) {
      return 'text-orange-600'; // Too many words
    } else if (metrics.wordCount >= metrics.targetWordCount * 0.8) {
      return 'text-green-600'; // Good range
    } else if (metrics.wordCount >= metrics.targetWordCount * 0.5) {
      return 'text-blue-600'; // Making progress
    } else {
      return darkMode ? 'text-gray-300' : 'text-gray-700'; // Just started
    }
  };
  
  const getPerformanceColor = () => {
    switch (metrics.performanceLevel) {
      case 'Excellent': return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      case 'Good': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
      case 'Fair': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
      default: return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30';
    }
  };
  
  return (
    <div className={`nsw-progress-tracker ${className}`}>
      <div className={`rounded-lg border p-4 transition-colors duration-300 ${
        darkMode 
          ? 'bg-gray-800/50 border-gray-700' 
          : 'bg-gray-50 border-gray-200'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h4 className={`font-semibold text-base flex items-center space-x-2 ${
            darkMode ? 'text-gray-200' : 'text-gray-800'
          }`}>
            <TrendingUp className="w-5 h-5" />
            <span>📊 Progress Tracker</span>
          </h4>
          
          {examMode && (
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              darkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-800'
            }`}>
              EXAM MODE
            </div>
          )}
        </div>
        
        {/* Progress Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Word Count Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className={`w-4 h-4 ${getWordCountColor()}`} />
                <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Word Count
                </span>
              </div>
              <span className={`text-sm font-bold ${getWordCountColor()}`}>
                {metrics.wordCount}/{metrics.targetWordCount}
              </span>
            </div>
            <ProgressBar 
              percentage={metrics.wordCountPercentage} 
              color={metrics.wordCount > metrics.targetWordCount * 1.2 ? 
                'bg-gradient-to-r from-orange-500 to-orange-600' : 
                'bg-gradient-to-r from-green-500 to-green-600'
              }
              showLabel={true}
            />
            {metrics.wordCount > metrics.targetWordCount && (
              <div className="flex items-center space-x-1 text-xs text-orange-600">
                <AlertCircle className="w-3 h-3" />
                <span>Consider staying closer to {metrics.targetWordCount} words</span>
              </div>
            )}
          </div>
          
          {/* Time Tracking */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className={`w-4 h-4 ${
                  examMode ? getTimeWarningClass().split(' ')[0] || (darkMode ? 'text-gray-400' : 'text-gray-600') 
                  : darkMode ? 'text-gray-400' : 'text-gray-600'
                }`} />
                <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {examMode ? 'Time Left' : 'Time Elapsed'}
                </span>
              </div>
              <span className={`text-sm font-bold ${getTimeWarningClass()}`}>
                {examMode ? formatTime(timeRemaining) : formatTime(timeElapsed)}
              </span>
            </div>
            
            {examMode && (
              <ProgressBar 
                percentage={((1800 - timeRemaining) / 1800) * 100} // 30 minutes = 1800 seconds
                color={timeRemaining <= 300 ? 
                  'bg-gradient-to-r from-red-500 to-red-600' :
                  timeRemaining <= 600 ?
                  'bg-gradient-to-r from-orange-500 to-orange-600' :
                  'bg-gradient-to-r from-blue-500 to-blue-600'
                }
              />
            )}
            
            {!examMode && metrics.writingPace > 0 && (
              <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Pace: {Math.round(metrics.writingPace)} words/min
              </div>
            )}
          </div>
          
          {/* Text Type */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <BookOpen className={`w-4 h-4 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
              <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Text Type
              </span>
            </div>
            <div className={`px-3 py-2 rounded-lg text-sm font-medium ${
              darkMode ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-800'
            }`}>
              {textType}
            </div>
          </div>
          
          {/* Performance Level */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Award className={`w-4 h-4 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
              <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Performance
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className={`px-3 py-2 rounded-lg text-sm font-medium ${getPerformanceColor()}`}>
                {metrics.performanceLevel}
              </div>
              <StarDisplay stars={metrics.overallStars} size="md" />
            </div>
          </div>
        </div>
        
        {/* Estimated Time Remaining (Practice Mode) */}
        {!examMode && metrics.estimatedTimeRemaining > 0 && metrics.wordCount < metrics.targetWordCount && (
          <div className={`mt-4 p-3 rounded-lg ${
            darkMode ? 'bg-blue-900/30' : 'bg-blue-50'
          }`}>
            <div className="flex items-center space-x-2">
              <Timer className={`w-4 h-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              <span className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                Estimated time to reach {metrics.targetWordCount} words: {formatTime(metrics.estimatedTimeRemaining)}
              </span>
            </div>
          </div>
        )}
        
        {/* Quick Tips */}
        {metrics.performanceLevel !== 'Excellent' && (
          <div className={`mt-4 p-3 rounded-lg ${
            darkMode ? 'bg-yellow-900/30' : 'bg-yellow-50'
          }`}>
            <div className="flex items-start space-x-2">
              <Zap className={`w-4 h-4 mt-0.5 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
              <div>
                <h5 className={`text-sm font-medium mb-1 ${darkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
                  💡 Quick Tip:
                </h5>
                <p className={`text-sm ${darkMode ? 'text-yellow-200' : 'text-yellow-700'}`}>
                  {metrics.wordCount < 50 ? 
                    "Start with a strong opening sentence to grab your reader's attention!" :
                    metrics.wordCount < metrics.targetWordCount * 0.5 ?
                    "You're off to a good start! Keep developing your ideas with more details." :
                    "Great progress! Focus on creating a strong conclusion to wrap up your writing."
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NSWProgressTracker;