import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  TrendingUp,
  Sparkles,
  Check,
  X,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  WritingBuddyService,
  SupportLevel,
  WritingBuddyPreferences,
  SupportLevelRecommendation,
} from '../lib/writingBuddyService';
import { useAuth } from '../contexts/AuthContext';

interface SupportLevelSelectorProps {
  currentLevel?: SupportLevel;
  onLevelChange?: (level: SupportLevel) => void;
  showRecommendations?: boolean;
  className?: string;
}

export const SupportLevelSelector: React.FC<SupportLevelSelectorProps> = ({
  currentLevel: propLevel,
  onLevelChange,
  showRecommendations = true,
  className = '',
}) => {
  const { user } = useAuth();
  const [selectedLevel, setSelectedLevel] = useState<SupportLevel>(
    propLevel || 'Medium Support'
  );
  const [preferences, setPreferences] = useState<WritingBuddyPreferences | null>(
    null
  );
  const [recommendations, setRecommendations] = useState<
    SupportLevelRecommendation[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadPreferences();
      if (showRecommendations) {
        loadRecommendations();
      }
    }
  }, [user, showRecommendations]);

  const loadPreferences = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const prefs = await WritingBuddyService.getUserPreferences(user.id);
      if (prefs) {
        setPreferences(prefs);
        setSelectedLevel(prefs.support_level);
      }
    } catch (err) {
      console.error('Error loading preferences:', err);
      setError('Failed to load your preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecommendations = async () => {
    if (!user) return;

    try {
      const recs = await WritingBuddyService.getRecommendations(user.id);
      setRecommendations(recs);
    } catch (err) {
      console.error('Error loading recommendations:', err);
    }
  };

  const handleLevelChange = async (level: SupportLevel) => {
    if (!user) {
      setError('Please sign in to change your support level');
      return;
    }

    console.log('[SupportLevelSelector] Attempting to change level:', { userId: user.id, level });

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const success = await WritingBuddyService.updateSupportLevel(
        user.id,
        level
      );

      console.log('[SupportLevelSelector] Update result:', success);

      if (success) {
        setSelectedLevel(level);
        setSuccess(`Support level changed to ${level}!`);
        if (onLevelChange) {
          onLevelChange(level);
        }
        await loadPreferences();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('Failed to update support level. Check browser console for details.');
      }
    } catch (err) {
      console.error('[SupportLevelSelector] Error updating support level:', err);
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAcceptRecommendation = async (recommendation: SupportLevelRecommendation) => {
    if (!user) return;

    setIsSaving(true);
    try {
      const success = await WritingBuddyService.acceptRecommendation(
        recommendation.id,
        user.id
      );

      if (success) {
        setSelectedLevel(recommendation.recommended_level);
        setSuccess(
          `Switched to ${recommendation.recommended_level} as recommended!`
        );
        await loadPreferences();
        await loadRecommendations();
        if (onLevelChange) {
          onLevelChange(recommendation.recommended_level);
        }
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('Failed to accept recommendation');
      }
    } catch (err) {
      console.error('Error accepting recommendation:', err);
      setError('An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRejectRecommendation = async (recommendationId: string) => {
    try {
      await WritingBuddyService.rejectRecommendation(recommendationId);
      await loadRecommendations();
    } catch (err) {
      console.error('Error rejecting recommendation:', err);
    }
  };

  const supportLevels: Array<{
    level: SupportLevel;
    icon: React.ElementType;
    title: string;
    description: string;
    color: string;
    features: string[];
  }> = [
    {
      level: 'High Support',
      icon: GraduationCap,
      title: 'High Support',
      description:
        'Maximum guidance with templates, direct corrections, and step-by-step help.',
      color: 'green',
      features: [
        'Sentence starters and templates',
        'Direct grammar corrections',
        'Frequent encouragement',
        'Simple explanations',
        'Step-by-step guidance',
      ],
    },
    {
      level: 'Medium Support',
      icon: TrendingUp,
      title: 'Medium Support',
      description:
        'Balanced guidance with targeted suggestions and clear examples.',
      color: 'blue',
      features: [
        'Targeted improvement tips',
        'Before/after examples',
        'Detailed explanations',
        'Critical thinking prompts',
        'NSW criteria alignment',
      ],
    },
    {
      level: 'Low Support',
      icon: Sparkles,
      title: 'Low Support',
      description:
        'Advanced prompts and subtle suggestions for confident writers.',
      color: 'purple',
      features: [
        'Higher-order thinking prompts',
        'Literary analysis',
        'Advanced vocabulary',
        'Self-reflection questions',
        'Exam strategy tips',
      ],
    },
  ];

  if (isLoading) {
    return (
      <div className={`p-6 bg-white rounded-lg shadow-sm ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl ${className}`}>
      {/* Header */}
      <div className="mb-8 text-center">
        <h2 className="heading-3 text-gray-900 dark:text-white mb-3 flex items-center justify-center">
          <Info className="w-6 h-6 mr-2 text-blue-600 dark:text-blue-400" />
          Choose Your Support Level
        </h2>
        <p className="text-body-sm text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Select the level of guidance that works best for you. You can change this anytime!
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl flex items-start">
          <X className="w-5 h-5 text-red-600 dark:text-red-400 mr-3 flex-shrink-0 mt-0.5" />
          <p className="text-body-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl flex items-start animate-in fade-in duration-300">
          <Check className="w-5 h-5 text-green-600 dark:text-green-400 mr-3 flex-shrink-0 mt-0.5" />
          <p className="text-body-sm text-green-800 dark:text-green-200">{success}</p>
        </div>
      )}

      {/* AI Recommendations */}
      {showRecommendations && recommendations.length > 0 && (
        <div className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-2xl shadow-sm">
          <h3 className="heading-5 text-blue-900 dark:text-blue-100 mb-4 flex items-center">
            <Sparkles className="w-5 h-5 mr-2" />
            AI Recommendation for You
          </h3>
          {recommendations.map((rec) => (
            <div key={rec.id} className="space-y-4">
              <p className="text-body-sm text-blue-800 dark:text-blue-200 font-medium">{rec.recommendation_reason}</p>
              <p className="text-caption text-blue-700 dark:text-blue-300">
                Based on {rec.based_on_essay_count} essays with an average score of{' '}
                {rec.based_on_average_score.toFixed(1)}%
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => handleAcceptRecommendation(rec)}
                  disabled={isSaving}
                  className="btn-primary-sm btn-with-icon"
                >
                  <Check className="w-4 h-4" />
                  Switch to {rec.recommended_level}
                </button>
                <button
                  onClick={() => handleRejectRecommendation(rec.id)}
                  disabled={isSaving}
                  className="btn-secondary-sm btn-with-icon"
                >
                  <X className="w-4 h-4" />
                  Keep Current Level
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Support Level Options */}
      <div className="space-y-4">
        {supportLevels.map(({ level, icon: Icon, title, description, color, features }) => {
          const isSelected = selectedLevel === level;
          const colorClasses = {
            green: {
              border: 'border-green-500 dark:border-green-400',
              bg: 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30',
              text: 'text-green-900 dark:text-green-100',
              button: 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700',
              icon: 'text-green-600 dark:text-green-400',
              shadow: 'shadow-green-100 dark:shadow-green-900/50',
            },
            blue: {
              border: 'border-blue-500 dark:border-blue-400',
              bg: 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30',
              text: 'text-blue-900 dark:text-blue-100',
              button: 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700',
              icon: 'text-blue-600 dark:text-blue-400',
              shadow: 'shadow-blue-100 dark:shadow-blue-900/50',
            },
            purple: {
              border: 'border-purple-500 dark:border-purple-400',
              bg: 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30',
              text: 'text-purple-900 dark:text-purple-100',
              button: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700',
              icon: 'text-purple-600 dark:text-purple-400',
              shadow: 'shadow-purple-100 dark:shadow-purple-900/50',
            },
          }[color];

          return (
            <button
              key={level}
              onClick={() => !isSelected && handleLevelChange(level)}
              disabled={isSaving || isSelected}
              className={`w-full border-3 rounded-2xl p-6 transition-all duration-200 text-left ${
                isSelected
                  ? `${colorClasses.border} ${colorClasses.bg} shadow-lg ${colorClasses.shadow} scale-[1.02]`
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md bg-white dark:bg-gray-800'
              } ${!isSelected && !isSaving ? 'cursor-pointer' : ''}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center mb-3">
                    <div className={`p-2 rounded-xl ${
                      isSelected ? colorClasses.bg : 'bg-gray-100 dark:bg-gray-700'
                    }`}>
                      <Icon
                        className={`w-6 h-6 ${
                          isSelected ? colorClasses.icon : 'text-gray-400 dark:text-gray-500'
                        }`}
                      />
                    </div>
                    <h3
                      className={`heading-5 ml-3 mb-0 ${
                        isSelected ? colorClasses.text : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      {title}
                    </h3>
                    {isSelected && (
                      <div className={`ml-auto p-2 rounded-full ${colorClasses.bg}`}>
                        <Check className={`w-5 h-5 ${colorClasses.icon}`} />
                      </div>
                    )}
                  </div>
                  <p className={`text-body-sm mb-4 ${
                    isSelected
                      ? 'text-gray-700 dark:text-gray-300 font-medium'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>{description}</p>

                  {showDetails && (
                    <div className="mt-4 pt-4 border-t ${
                      isSelected
                        ? 'border-gray-300 dark:border-gray-600'
                        : 'border-gray-200 dark:border-gray-700'
                    }">
                      <p className="text-label-sm text-gray-700 dark:text-gray-300 mb-3">
                        Features:
                      </p>
                      <ul className="space-y-2">
                        {features.map((feature, idx) => (
                          <li key={idx} className="flex items-start text-caption">
                            <Check className={`w-4 h-4 mr-2 mt-0.5 flex-shrink-0 ${
                              isSelected ? colorClasses.icon : 'text-gray-400 dark:text-gray-500'
                            }`} />
                            <span className={isSelected ? colorClasses.text : 'text-gray-600 dark:text-gray-400'}>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {!isSelected && (
                  <div className="flex-shrink-0">
                    <div className={`px-6 py-3 ${colorClasses.button} text-white rounded-xl font-semibold shadow-lg transition-all hover:shadow-xl transform hover:-translate-y-0.5`}>
                      Select
                    </div>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Toggle Details Button */}
      <div className="mt-6 text-center">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="btn-ghost-sm btn-with-icon-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
        >
          {showDetails ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Hide Details
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Show More Details
            </>
          )}
        </button>
      </div>

      {/* User Stats */}
      {preferences && (
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-center gap-8 text-center">
            <div>
              <p className="heading-4 text-gray-900 dark:text-white mb-1">{preferences.total_essays_completed}</p>
              <p className="text-caption text-gray-600 dark:text-gray-400">Essays Completed</p>
            </div>
            <div className="w-px h-12 bg-gray-200 dark:bg-gray-700"></div>
            <div>
              <p className="heading-4 text-gray-900 dark:text-white mb-1">{preferences.average_essay_score.toFixed(1)}%</p>
              <p className="text-caption text-gray-600 dark:text-gray-400">Average Score</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
