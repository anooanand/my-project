import React, { useState, useEffect } from 'react';
import { Clock, FileText, Save, Settings, BarChart3, Award, Zap, BookOpen, Target } from 'lucide-react';
import { NSWMarkingRubric } from './NSWMarkingRubric';
import { WritingTechniqueModules } from './WritingTechniqueModules';
import { GamificationSystem } from './GamificationSystem';
import { WritingStatusBar } from './WritingStatusBar';
import { NSWStandaloneSubmitSystem } from './NSWStandaloneSubmitSystem';

interface NSWEnhancedWritingInterfaceProps {
  examDurationMinutes?: number;
  targetWordCountMin?: number;
  targetWordCountMax?: number;
  textType: string;
  prompt: string;
  promptImage?: string;
  onSubmit?: (content: string, analysis: any) => void;
}

export function NSWEnhancedWritingInterface({
  examDurationMinutes = 30,
  targetWordCountMin = 100,
  targetWordCountMax = 500,
  textType,
  prompt,
  promptImage,
  onSubmit
}: NSWEnhancedWritingInterfaceProps) {
  const [content, setContent] = useState('');
  const [activeTab, setActiveTab] = useState('write');
  const [examStarted, setExamStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(examDurationMinutes * 60);
  const [evaluationReport, setEvaluationReport] = useState<any>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [userProgress, setUserProgress] = useState({
    totalPoints: 450,
    level: 5,
    essaysWritten: 8,
    averageScore: 78,
    badges: ['first-essay', 'show-master'],
    achievements: ['first-feedback', 'structure-architect'],
    streakDays: 5,
    wordsWritten: 2340,
    literaryDevicesUsed: 4,
    showDontTellRatio: 72
  });

  // Timer logic
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (examStarted && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            setExamStarted(false);
            handleAutoSubmit();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [examStarted, timeLeft]);

  // Word count tracking
  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [content]);

  const handleAutoSubmit = () => {
    if (content.trim()) {
      // Auto-submit will be handled by the standalone system
      setActiveTab('evaluation');
    }
  };

  // Handle evaluation completion from the standalone system
  const handleEvaluationComplete = (report: any) => {
    setEvaluationReport(report);
    setShowAnalysis(true);
    setActiveTab('feedback');
    
    // Call the original onSubmit callback if provided
    if (onSubmit) {
      onSubmit(content, report);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getWordCountStatus = () => {
    if (wordCount < targetWordCountMin) {
      return { color: 'text-red-600', message: `${targetWordCountMin - wordCount} words needed` };
    } else if (wordCount > targetWordCountMax) {
      return { color: 'text-orange-600', message: `${wordCount - targetWordCountMax} words over limit` };
    } else {
      return { color: 'text-green-600', message: 'Word count on target' };
    }
  };

  const WritingArea = () => (
    <div className="space-y-6">
      {/* Prompt Display */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
          Writing Prompt - {textType}
        </h3>
        <p className="text-blue-800 dark:text-blue-200 leading-relaxed">
          {prompt}
        </p>
        {promptImage && (
          <img 
            src={promptImage} 
            alt="Writing prompt visual" 
            className="mt-4 rounded-lg max-w-full h-auto"
          />
        )}
      </div>

      {/* Writing Controls */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className={`font-mono text-lg ${timeLeft < 300 ? 'text-red-600' : 'text-gray-900 dark:text-gray-100'}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className={`font-medium ${getWordCountStatus().color}`}>
              {wordCount} words
            </span>
            <span className="text-sm text-gray-500">
              ({getWordCountStatus().message})
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {!examStarted ? (
            <button
              onClick={() => setExamStarted(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Start Writing
            </button>
          ) : (
            <button
              onClick={() => setExamStarted(false)}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Pause
            </button>
          )}
          
          {/* Enhanced Submit Button - directly connects to evaluation system */}
          <button
            onClick={() => setActiveTab('evaluation')}
            disabled={wordCount < targetWordCountMin}
            className={`inline-flex items-center px-6 py-3 text-base font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 ${
              wordCount < targetWordCountMin
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
            }`}
            title={wordCount < targetWordCountMin ? `Need ${targetWordCountMin - wordCount} more words` : 'Submit your essay for detailed NSW evaluation'}
          >
            <Award className="h-5 w-5 mr-2" />
            Submit for Evaluation
            {wordCount >= targetWordCountMin && (
              <div className="ml-2 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            )}
          </button>
        </div>
      </div>

      {/* Writing Textarea */}
      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start writing your essay here..."
          className="w-full h-96 p-6 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          disabled={!examStarted}
        />
        
        {!examStarted && content.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="text-center">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-2">Ready to start writing?</p>
              <p className="text-sm text-gray-500 dark:text-gray-500">Click "Start Writing" to begin your timed essay</p>
            </div>
          </div>
        )}
      </div>
      <WritingStatusBar
        wordCount={wordCount}
        content={content}
        examMode={examStarted}
        targetWordCountMin={targetWordCountMin}
        targetWordCountMax={targetWordCountMax}
      />
    </div>
  );

  // Standalone Evaluation Area - NEW!
  const EvaluationArea = () => (
    <NSWStandaloneSubmitSystem
      content={content}
      wordCount={wordCount}
      targetWordCountMin={targetWordCountMin}
      targetWordCountMax={targetWordCountMax}
      textType={textType}
      prompt={prompt}
      onSubmissionComplete={handleEvaluationComplete}
    />
  );

  const tabs = [
    { id: 'write', label: 'Write', icon: FileText, component: WritingArea },
    { 
      id: 'evaluation', 
      label: 'Submit & Evaluate', 
      icon: Award, 
      component: EvaluationArea 
    },
    { 
      id: 'feedback', 
      label: 'NSW Feedback', 
      icon: BarChart3, 
      component: () => evaluationReport ? (
        <NSWMarkingRubric essay={content} feedbackData={evaluationReport} />
      ) : (
        <div className="text-center py-12">
          <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No Evaluation Yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Submit your essay for evaluation to see detailed NSW criteria feedback
          </p>
          <button
            onClick={() => setActiveTab('evaluation')}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Go to Evaluation
          </button>
        </div>
      )
    },
    { 
      id: 'techniques', 
      label: 'Writing Tools', 
      icon: Zap, 
      component: () => content.length > 50 ? (
        <WritingTechniqueModules essay={content} />
      ) : (
        <div className="text-center py-12">
          <Zap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Writing Tools Ready
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Start writing to access advanced technique analysis tools
          </p>
        </div>
      )
    },
    { 
      id: 'progress', 
      label: 'Progress', 
      icon: Award, 
      component: () => (
        <GamificationSystem 
          userProgress={userProgress}
          onBadgeEarned={(badge) => console.log('Badge earned:', badge)}
          onAchievementUnlocked={(achievement) => console.log('Achievement unlocked:', achievement)}
        />
      )
    }
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg p-6 mb-6">
        <h1 className="text-2xl font-bold mb-2">NSW Selective Writing Practice</h1>
        <p className="text-indigo-100">
          Enhanced with detailed feedback, writing tools, and progress tracking
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.id === 'evaluation' && (
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-screen">
        {tabs.find(tab => tab.id === activeTab)?.component()}
      </div>
    </div>
  );
}