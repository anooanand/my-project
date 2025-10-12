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

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const success = await WritingBuddyService.updateSupportLevel(
        user.id,
        level
      );

      if (success) {
        setSelectedLevel(level);
        setSuccess(`Support level changed to ${level}!`);
        if (onLevelChange) {
          onLevelChange(level);
        }
        await loadPreferences();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('Failed to update support level. Please try again.');
      }
    } catch (err) {
      console.error('Error updating support level:', err);
      setError('An error occurred. Please try again.');
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
    <div className={`p-6 bg-white rounded-lg shadow-sm ${className}`}>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center">
          <Info className="w-5 h-5 mr-2 text-blue-600" />
          Choose Your Support Level
        </h2>
        <p className="text-sm text-gray-600">
          Select the level of guidance that works best for you. You can change
          this anytime!
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <X className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start">
          <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {showRecommendations && recommendations.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
            <Sparkles className="w-4 h-4 mr-2" />
            Recommendation for You
          </h3>
          {recommendations.map((rec) => (
            <div key={rec.id} className="mb-3 last:mb-0">
              <p className="text-sm text-blue-800 mb-2">{rec.recommendation_reason}</p>
              <p className="text-xs text-blue-700 mb-3">
                Based on {rec.based_on_essay_count} essays with an average score of{' '}
                {rec.based_on_average_score.toFixed(1)}%
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleAcceptRecommendation(rec)}
                  disabled={isSaving}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Switch to {rec.recommended_level}
                </button>
                <button
                  onClick={() => handleRejectRecommendation(rec.id)}
                  disabled={isSaving}
                  className="px-3 py-1 bg-white text-blue-600 text-sm rounded border border-blue-300 hover:bg-blue-50 disabled:opacity-50 flex items-center"
                >
                  <X className="w-4 h-4 mr-1" />
                  Keep Current Level
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {supportLevels.map(({ level, icon: Icon, title, description, color, features }) => {
          const isSelected = selectedLevel === level;
          const colorClasses = {
            green: {
              border: 'border-green-500',
              bg: 'bg-green-50',
              text: 'text-green-900',
              button: 'bg-green-600 hover:bg-green-700',
              icon: 'text-green-600',
            },
            blue: {
              border: 'border-blue-500',
              bg: 'bg-blue-50',
              text: 'text-blue-900',
              button: 'bg-blue-600 hover:bg-blue-700',
              icon: 'text-blue-600',
            },
            purple: {
              border: 'border-purple-500',
              bg: 'bg-purple-50',
              text: 'text-purple-900',
              button: 'bg-purple-600 hover:bg-purple-700',
              icon: 'text-purple-600',
            },
          }[color];

          return (
            <div
              key={level}
              className={`border-2 rounded-lg p-4 transition-all ${
                isSelected
                  ? `${colorClasses.border} ${colorClasses.bg}`
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <Icon
                      className={`w-5 h-5 mr-2 ${
                        isSelected ? colorClasses.icon : 'text-gray-400'
                      }`}
                    />
                    <h3
                      className={`font-semibold ${
                        isSelected ? colorClasses.text : 'text-gray-900'
                      }`}
                    >
                      {title}
                    </h3>
                    {isSelected && (
                      <Check className={`w-5 h-5 ml-2 ${colorClasses.icon}`} />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{description}</p>

                  {showDetails && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-gray-700 mb-1">
                        Features:
                      </p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {features.map((feature, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {!isSelected && (
                  <button
                    onClick={() => handleLevelChange(level)}
                    disabled={isSaving}
                    className={`ml-4 px-4 py-2 ${colorClasses.button} text-white text-sm rounded transition-colors disabled:opacity-50`}
                  >
                    Select
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => setShowDetails(!showDetails)}
        className="mt-4 text-sm text-blue-600 hover:text-blue-700 flex items-center mx-auto"
      >
        {showDetails ? (
          <>
            <ChevronUp className="w-4 h-4 mr-1" />
            Hide Details
          </>
        ) : (
          <>
            <ChevronDown className="w-4 h-4 mr-1" />
            Show More Details
          </>
        )}
      </button>

      {preferences && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            You've completed {preferences.total_essays_completed} essays with an
            average score of {preferences.average_essay_score.toFixed(1)}%
          </p>
        </div>
      )}
    </div>
  );
};
