import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Award,
  BookOpen,
  MessageCircle,
  Target,
  BarChart2,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  WritingBuddyService,
  WritingBuddyPreferences,
  TieredFeedback,
  SupportLevel,
} from '../lib/writingBuddyService';

interface ProgressDashboardProps {
  className?: string;
}

export const WritingBuddyProgressDashboard: React.FC<ProgressDashboardProps> = ({
  className = '',
}) => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<WritingBuddyPreferences | null>(
    null
  );
  const [recentFeedback, setRecentFeedback] = useState<TieredFeedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const [prefs, feedback] = await Promise.all([
        WritingBuddyService.getUserPreferences(user.id),
        WritingBuddyService.getFeedbackHistory(user.id, 10),
      ]);

      setPreferences(prefs);
      setRecentFeedback(feedback);
    } catch (error) {
      console.error('Error loading progress data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSkillColor = (level: number): string => {
    if (level >= 4) return 'text-green-600 bg-green-100';
    if (level >= 3) return 'text-blue-600 bg-blue-100';
    if (level >= 2) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getSkillLabel = (level: number): string => {
    if (level >= 4) return 'Advanced';
    if (level >= 3) return 'Proficient';
    if (level >= 2) return 'Developing';
    return 'Beginning';
  };

  const getSupportLevelProgress = (level: SupportLevel): number => {
    switch (level) {
      case 'High Support':
        return 33;
      case 'Medium Support':
        return 66;
      case 'Low Support':
        return 100;
      default:
        return 50;
    }
  };

  if (isLoading) {
    return (
      <div className={`p-6 bg-white rounded-lg shadow-sm ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className={`p-6 bg-white rounded-lg shadow-sm ${className}`}>
        <p className="text-gray-600">No progress data available yet.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <TrendingUp className="w-6 h-6 mr-2 text-blue-600" />
          Your Writing Journey
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <span className="text-2xl font-bold text-blue-900">
                {preferences.total_essays_completed}
              </span>
            </div>
            <p className="text-xs text-blue-700">Essays Completed</p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Award className="w-5 h-5 text-green-600" />
              <span className="text-2xl font-bold text-green-900">
                {preferences.average_essay_score.toFixed(0)}%
              </span>
            </div>
            <p className="text-xs text-green-700">Average Score</p>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <MessageCircle className="w-5 h-5 text-purple-600" />
              <span className="text-2xl font-bold text-purple-900">
                {preferences.total_feedback_sessions}
              </span>
            </div>
            <p className="text-xs text-purple-700">Feedback Sessions</p>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-5 h-5 text-orange-600" />
              <span className="text-2xl font-bold text-orange-900">
                {preferences.support_level.replace(' Support', '')}
              </span>
            </div>
            <p className="text-xs text-orange-700">Support Level</p>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-700">
              Writing Independence Progress
            </h3>
            <span className="text-xs text-gray-600">
              {getSupportLevelProgress(preferences.support_level)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
              style={{
                width: `${getSupportLevelProgress(preferences.support_level)}%`,
              }}
            ></div>
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-500">
            <span>High Support</span>
            <span>Medium Support</span>
            <span>Low Support</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <BarChart2 className="w-5 h-5 mr-2 text-blue-600" />
          Skill Levels
        </h3>

        <div className="space-y-4">
          {[
            { label: 'Grammar', level: preferences.grammar_skill_level },
            { label: 'Vocabulary', level: preferences.vocabulary_skill_level },
            { label: 'Structure', level: preferences.structure_skill_level },
            { label: 'Creativity', level: preferences.creativity_skill_level },
          ].map(({ label, level }) => (
            <div key={label}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{label}</span>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded ${getSkillColor(
                    level
                  )}`}
                >
                  {getSkillLabel(level)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    level >= 4
                      ? 'bg-green-500'
                      : level >= 3
                      ? 'bg-blue-500'
                      : level >= 2
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${(level / 5) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Keep practicing!</strong> Your skills improve with each essay
            you write. Try different text types to challenge yourself in new ways.
          </p>
        </div>
      </div>

      {recentFeedback.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-blue-600" />
            Recent Feedback Sessions
          </h3>

          <div className="space-y-3">
            {recentFeedback.slice(0, 5).map((feedback) => (
              <div
                key={feedback.id}
                className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded ${
                          feedback.support_level === 'High Support'
                            ? 'bg-green-100 text-green-800'
                            : feedback.support_level === 'Medium Support'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {feedback.support_level}
                      </span>
                      <span className="text-xs text-gray-500">
                        {feedback.text_type}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(feedback.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {feedback.feedback_text}
                    </p>
                    {feedback.focus_area && (
                      <p className="text-xs text-gray-500 mt-1">
                        Focus: {feedback.focus_area}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
