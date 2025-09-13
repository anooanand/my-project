import React, { useState, useEffect } from 'react';
import { Clock, BookOpen, FileText, BarChart3, Target, TrendingUp, Award } from 'lucide-react';

interface ProgressMetrics {
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  readingTime: number;
  writingTime: number;
  targetWords: number;
  completionPercentage: number;
}

interface ProgressCoachProps {
  text: string;
  textType: 'narrative' | 'persuasive' | 'informative';
  targetWordCount?: number;
  onProgressUpdate?: (metrics: ProgressMetrics) => void;
}

const ProgressCoach: React.FC<ProgressCoachProps> = ({
  text,
  textType,
  targetWordCount = 300,
  onProgressUpdate
}) => {
  const [activeTab, setActiveTab] = useState<'coach' | 'analysis' | 'vocab' | 'progress'>('progress');
  const [metrics, setMetrics] = useState<ProgressMetrics>({
    wordCount: 0,
    sentenceCount: 0,
    paragraphCount: 0,
    readingTime: 0,
    writingTime: 0,
    targetWords: targetWordCount,
    completionPercentage: 0
  });
  const [startTime] = useState(Date.now());

  // Calculate metrics from text
  useEffect(() => {
    const calculateMetrics = () => {
      const words = text.trim().split(/\s+/).filter(word => word.length > 0);
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
      
      const wordCount = words.length;
      const sentenceCount = sentences.length;
      const paragraphCount = Math.max(paragraphs.length, wordCount > 0 ? 1 : 0);
      const readingTime = Math.ceil(wordCount / 200); // Average reading speed
      const writingTime = Math.floor((Date.now() - startTime) / 60000); // Minutes
      const completionPercentage = Math.min((wordCount / targetWordCount) * 100, 100);

      const newMetrics = {
        wordCount,
        sentenceCount,
        paragraphCount,
        readingTime,
        writingTime,
        targetWords: targetWordCount,
        completionPercentage
      };

      setMetrics(newMetrics);
      onProgressUpdate?.(newMetrics);
    };

    calculateMetrics();
  }, [text, targetWordCount, startTime, onProgressUpdate]);

  const getProgressColor = (percentage: number) => {
    if (percentage < 30) return 'bg-red-500';
    if (percentage < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getProgressMessage = () => {
    const { completionPercentage, wordCount } = metrics;
    
    if (completionPercentage < 25) {
      return "Great start! Keep writing to build your story.";
    } else if (completionPercentage < 50) {
      return "You're making good progress! Develop your ideas further.";
    } else if (completionPercentage < 75) {
      return "Excellent work! You're more than halfway there.";
    } else if (completionPercentage < 100) {
      return "Almost finished! Add some final details to complete your story.";
    } else {
      return "Congratulations! You've reached your target word count.";
    }
  };

  const renderProgressTab = () => (
    <div className="space-y-4">
      {/* Progress Header */}
      <div className="text-center">
        <div className="text-2xl font-bold text-purple-600 mb-2">
          {metrics.wordCount} / {metrics.targetWords} words
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
          <div 
            className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(metrics.completionPercentage)}`}
            style={{ width: `${Math.min(metrics.completionPercentage, 100)}%` }}
          ></div>
        </div>
        <div className="text-sm text-gray-600">
          {metrics.completionPercentage.toFixed(1)}% complete
        </div>
      </div>

      {/* Progress Message */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-4 h-4 text-purple-600" />
          <span className="font-medium text-purple-800">Progress Update</span>
        </div>
        <p className="text-purple-700 text-sm">{getProgressMessage()}</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-medium text-blue-800">Sentences</span>
          </div>
          <div className="text-lg font-bold text-blue-600">{metrics.sentenceCount}</div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-4 h-4 text-green-600" />
            <span className="text-xs font-medium text-green-800">Paragraphs</span>
          </div>
          <div className="text-lg font-bold text-green-600">{metrics.paragraphCount}</div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-orange-600" />
            <span className="text-xs font-medium text-orange-800">Read Time</span>
          </div>
          <div className="text-lg font-bold text-orange-600">{metrics.readingTime}m</div>
        </div>

        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-medium text-indigo-800">Writing Time</span>
          </div>
          <div className="text-lg font-bold text-indigo-600">{metrics.writingTime}m</div>
        </div>
      </div>

      {/* Achievement Badges */}
      {metrics.completionPercentage >= 100 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-yellow-600" />
            <span className="font-medium text-yellow-800">Achievement Unlocked!</span>
          </div>
          <p className="text-yellow-700 text-sm">Target word count reached! 🎉</p>
        </div>
      )}

      {/* Writing Tips Based on Progress */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="w-4 h-4 text-gray-600" />
          <span className="font-medium text-gray-800">Writing Tips</span>
        </div>
        <div className="space-y-2 text-sm text-gray-700">
          {metrics.completionPercentage < 50 && (
            <div>• Focus on developing your main character and setting</div>
          )}
          {metrics.completionPercentage >= 50 && metrics.completionPercentage < 80 && (
            <div>• Add dialogue and action to make your story exciting</div>
          )}
          {metrics.completionPercentage >= 80 && (
            <div>• Work towards a satisfying conclusion for your story</div>
          )}
          {metrics.sentenceCount > 0 && metrics.wordCount / metrics.sentenceCount < 8 && (
            <div>• Try using longer, more descriptive sentences</div>
          )}
          {metrics.paragraphCount === 1 && metrics.wordCount > 50 && (
            <div>• Consider breaking your writing into paragraphs</div>
          )}
        </div>
      </div>
    </div>
  );

  const renderCoachTab = () => (
    <div className="space-y-4">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h3 className="font-medium text-purple-800 mb-2">Vocab Coach (placeholder)</h3>
        <ul className="text-sm text-purple-700 space-y-1">
          <li>• Highlight overused words</li>
          <li>• Suggest context-appropriate synonyms</li>
          <li>• Build a personal word list</li>
        </ul>
      </div>
    </div>
  );

  const renderAnalysisTab = () => (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-800 mb-2">Analysis (placeholder)</h3>
        <p className="text-sm text-blue-700">
          Detailed writing analysis will appear here when you submit your work for evaluation.
        </p>
      </div>
    </div>
  );

  const renderVocabTab = () => (
    <div className="space-y-4">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-medium text-green-800 mb-2">Vocabulary Builder (placeholder)</h3>
        <p className="text-sm text-green-700">
          Vocabulary suggestions and word building exercises will appear here.
        </p>
      </div>
    </div>
  );

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-1 p-1">
          {[
            { id: 'coach', label: 'Coach', color: 'purple' },
            { id: 'analysis', label: 'Analysis', color: 'blue' },
            { id: 'vocab', label: 'Vocab', color: 'green' },
            { id: 'progress', label: 'Progress', color: 'orange' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.id
                  ? `bg-${tab.color}-100 text-${tab.color}-700 border border-${tab.color}-200`
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === 'progress' && renderProgressTab()}
        {activeTab === 'coach' && renderCoachTab()}
        {activeTab === 'analysis' && renderAnalysisTab()}
        {activeTab === 'vocab' && renderVocabTab()}
      </div>
    </div>
  );
};

export default ProgressCoach;
