import React, { useState, useEffect } from 'react';
import { Trophy, Star, Target, Award, Zap, BookOpen, TrendingUp, CheckCircle, Lock } from 'lucide-react';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  requirement: string;
  earned: boolean;
  progress?: number;
  maxProgress?: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  points: number;
  category: string;
  unlocked: boolean;
  dateEarned?: string;
}

interface GamificationSystemProps {
  userProgress: {
    totalPoints: number;
    level: number;
    essaysWritten: number;
    averageScore: number;
    badges: string[];
    achievements: string[];
    streakDays: number;
    wordsWritten: number;
    literaryDevicesUsed: number;
    showDontTellRatio: number;
  };
  onBadgeEarned?: (badge: Badge) => void;
  onAchievementUnlocked?: (achievement: Achievement) => void;
}

export function GamificationSystem({ userProgress, onBadgeEarned, onAchievementUnlocked }: GamificationSystemProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [newlyEarned, setNewlyEarned] = useState<string[]>([]);

  const badges: Badge[] = [
    {
      id: 'first-essay',
      name: 'First Steps',
      description: 'Write your first essay',
      icon: BookOpen,
      color: 'blue',
      requirement: 'Complete 1 essay',
      earned: userProgress.essaysWritten >= 1,
      progress: Math.min(userProgress.essaysWritten, 1),
      maxProgress: 1
    },
    {
      id: 'show-master',
      name: 'Show Master',
      description: 'Achieve 80%+ on Show, Don\'t Tell meter',
      icon: Star,
      color: 'yellow',
      requirement: '80%+ Show, Don\'t Tell ratio',
      earned: userProgress.showDontTellRatio >= 80,
      progress: userProgress.showDontTellRatio,
      maxProgress: 100
    },
    {
      id: 'word-wizard',
      name: 'Word Wizard',
      description: 'Write 1000+ words total',
      icon: Zap,
      color: 'purple',
      requirement: 'Write 1000+ words',
      earned: userProgress.wordsWritten >= 1000,
      progress: userProgress.wordsWritten,
      maxProgress: 1000
    },
    {
      id: 'literary-genius',
      name: 'Literary Genius',
      description: 'Use 5+ different literary devices',
      icon: Award,
      color: 'green',
      requirement: 'Use 5+ literary devices',
      earned: userProgress.literaryDevicesUsed >= 5,
      progress: userProgress.literaryDevicesUsed,
      maxProgress: 5
    },
    {
      id: 'consistent-writer',
      name: 'Consistent Writer',
      description: 'Write for 7 days in a row',
      icon: Target,
      color: 'orange',
      requirement: '7-day writing streak',
      earned: userProgress.streakDays >= 7,
      progress: userProgress.streakDays,
      maxProgress: 7
    },
    {
      id: 'excellence-seeker',
      name: 'Excellence Seeker',
      description: 'Achieve 85%+ average score',
      icon: Trophy,
      color: 'gold',
      requirement: '85%+ average score',
      earned: userProgress.averageScore >= 85,
      progress: userProgress.averageScore,
      maxProgress: 100
    }
  ];

  const achievements: Achievement[] = [
    {
      id: 'first-feedback',
      title: 'Feedback Explorer',
      description: 'Received your first detailed feedback',
      points: 50,
      category: 'Getting Started',
      unlocked: userProgress.essaysWritten >= 1
    },
    {
      id: 'narrative-master',
      title: 'Narrative Master',
      description: 'Scored 90%+ on Ideas and Content',
      points: 100,
      category: 'Writing Excellence',
      unlocked: userProgress.averageScore >= 90
    },
    {
      id: 'structure-architect',
      title: 'Structure Architect',
      description: 'Perfect narrative structure in an essay',
      points: 75,
      category: 'Technical Skills',
      unlocked: userProgress.essaysWritten >= 3
    },
    {
      id: 'language-artist',
      title: 'Language Artist',
      description: 'Used 3+ literary devices in one essay',
      points: 80,
      category: 'Creative Writing',
      unlocked: userProgress.literaryDevicesUsed >= 3
    },
    {
      id: 'dedicated-writer',
      title: 'Dedicated Writer',
      description: 'Completed 10 essays',
      points: 200,
      category: 'Persistence',
      unlocked: userProgress.essaysWritten >= 10
    },
    {
      id: 'perfectionist',
      title: 'Perfectionist',
      description: 'Achieved 95%+ score on an essay',
      points: 150,
      category: 'Writing Excellence',
      unlocked: userProgress.averageScore >= 95
    }
  ];

  const calculateLevel = (points: number) => {
    return Math.floor(points / 100) + 1;
  };

  const getPointsForNextLevel = (currentPoints: number) => {
    const currentLevel = calculateLevel(currentPoints);
    return currentLevel * 100 - currentPoints;
  };

  const getLevelProgress = (points: number) => {
    const level = calculateLevel(points);
    const pointsInCurrentLevel = points - ((level - 1) * 100);
    return (pointsInCurrentLevel / 100) * 100;
  };

  const BadgeCard = ({ badge }: { badge: Badge }) => {
    const Icon = badge.icon;
    const progressPercentage = badge.maxProgress ? (badge.progress! / badge.maxProgress) * 100 : 0;

    return (
      <div className={`relative bg-white dark:bg-gray-800 rounded-lg p-6 border-2 transition-all duration-300 ${
        badge.earned 
          ? `border-${badge.color}-400 shadow-lg` 
          : 'border-gray-200 dark:border-gray-700 opacity-75'
      }`}>
        {badge.earned && (
          <div className="absolute -top-2 -right-2">
            <CheckCircle className="w-6 h-6 text-green-500 bg-white rounded-full" />
          </div>
        )}
        
        <div className="text-center">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
            badge.earned 
              ? `bg-${badge.color}-100 text-${badge.color}-600` 
              : 'bg-gray-100 text-gray-400'
          }`}>
            {badge.earned ? <Icon className="w-8 h-8" /> : <Lock className="w-8 h-8" />}
          </div>
          
          <h3 className={`font-bold text-lg mb-2 ${
            badge.earned ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'
          }`}>
            {badge.name}
          </h3>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {badge.description}
          </p>
          
          <div className="text-xs text-gray-500 dark:text-gray-500 mb-2">
            {badge.requirement}
          </div>
          
          {badge.maxProgress && (
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  badge.earned ? `bg-${badge.color}-500` : 'bg-gray-400'
                }`}
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            </div>
          )}
          
          {badge.maxProgress && (
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {badge.progress}/{badge.maxProgress}
            </div>
          )}
        </div>
      </div>
    );
  };

  const AchievementCard = ({ achievement }: { achievement: Achievement }) => {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 transition-all duration-300 ${
        achievement.unlocked 
          ? 'border-green-400 shadow-md' 
          : 'border-gray-300 opacity-60'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              {achievement.unlocked ? (
                <Trophy className="w-6 h-6 text-yellow-500" />
              ) : (
                <Lock className="w-6 h-6 text-gray-400" />
              )}
              <div>
                <h3 className={`font-semibold ${
                  achievement.unlocked ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {achievement.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {achievement.description}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded">
                    {achievement.category}
                  </span>
                  <span className="text-xs text-gray-500">
                    {achievement.points} points
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {achievement.unlocked && (
            <div className="text-right">
              <div className="text-2xl font-bold text-yellow-500">+{achievement.points}</div>
              <div className="text-xs text-gray-500">points earned</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const ProgressOverview = () => {
    const level = calculateLevel(userProgress.totalPoints);
    const levelProgress = getLevelProgress(userProgress.totalPoints);
    const pointsToNext = getPointsForNextLevel(userProgress.totalPoints);
    const earnedBadges = badges.filter(b => b.earned);
    const unlockedAchievements = achievements.filter(a => a.unlocked);

    return (
      <div className="space-y-6">
        {/* Level Progress */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">Level {level}</h2>
              <p className="text-blue-100">Writing Apprentice</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{userProgress.totalPoints}</div>
              <div className="text-sm text-blue-100">total points</div>
            </div>
          </div>
          
          <div className="w-full bg-white/20 rounded-full h-4 mb-2">
            <div 
              className="bg-white h-4 rounded-full transition-all duration-1000"
              style={{ width: `${levelProgress}%` }}
            />
          </div>
          
          <div className="flex justify-between text-sm text-blue-100">
            <span>Level {level}</span>
            <span>{pointsToNext} points to Level {level + 1}</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-blue-600">{userProgress.essaysWritten}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Essays Written</div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-green-600">{userProgress.averageScore}%</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Average Score</div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-orange-600">{userProgress.streakDays}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Day Streak</div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-purple-600">{earnedBadges.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Badges Earned</div>
          </div>
        </div>

        {/* Recent Achievements */}
        {unlockedAchievements.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Recent Achievements
            </h3>
            <div className="space-y-3">
              {unlockedAchievements.slice(0, 3).map((achievement) => (
                <AchievementCard key={achievement.id} achievement={achievement} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const BadgesTab = () => {
    const earnedBadges = badges.filter(b => b.earned);
    const availableBadges = badges.filter(b => !b.earned);

    return (
      <div className="space-y-6">
        {earnedBadges.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Earned Badges ({earnedBadges.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {earnedBadges.map((badge) => (
                <BadgeCard key={badge.id} badge={badge} />
              ))}
            </div>
          </div>
        )}

        {availableBadges.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Available Badges ({availableBadges.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableBadges.map((badge) => (
                <BadgeCard key={badge.id} badge={badge} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const AchievementsTab = () => {
    const unlockedAchievements = achievements.filter(a => a.unlocked);
    const lockedAchievements = achievements.filter(a => !a.unlocked);

    return (
      <div className="space-y-6">
        {unlockedAchievements.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Unlocked Achievements ({unlockedAchievements.length})
            </h3>
            <div className="space-y-3">
              {unlockedAchievements.map((achievement) => (
                <AchievementCard key={achievement.id} achievement={achievement} />
              ))}
            </div>
          </div>
        )}

        {lockedAchievements.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Locked Achievements ({lockedAchievements.length})
            </h3>
            <div className="space-y-3">
              {lockedAchievements.map((achievement) => (
                <AchievementCard key={achievement.id} achievement={achievement} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg p-6 mb-6">
        <h1 className="text-2xl font-bold mb-2">Your Writing Journey</h1>
        <p className="text-yellow-100">Track your progress, earn badges, and unlock achievements!</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mb-6">
        {[
          { id: 'overview', label: 'Overview', icon: TrendingUp },
          { id: 'badges', label: 'Badges', icon: Award },
          { id: 'achievements', label: 'Achievements', icon: Trophy }
        ].map((tab) => {
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
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <ProgressOverview />}
      {activeTab === 'badges' && <BadgesTab />}
      {activeTab === 'achievements' && <AchievementsTab />}
    </div>
  );
}
