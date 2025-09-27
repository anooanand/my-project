import React, { useState, useEffect } from 'react';
import { Award, Star, Zap, Trophy, Target, BookOpen, CheckCircle, X } from 'lucide-react';
import { GrammarCheckResult } from '../types/grammarChecker';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
  category: 'writing' | 'grammar' | 'creativity' | 'progress';
}

interface AchievementSystemProps {
  checkResult: GrammarCheckResult | null;
  wordCount: number;
  sessionTime: number; // in minutes
  darkMode?: boolean;
  onClose?: () => void;
}

export const AchievementSystem: React.FC<AchievementSystemProps> = ({
  checkResult,
  wordCount,
  sessionTime,
  darkMode = false,
  onClose
}) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement[]>([]);
  const [showNotification, setShowNotification] = useState(false);

  // Define all possible achievements
  const allAchievements: Achievement[] = [
    // Writing achievements
    {
      id: 'first-words',
      name: 'First Words',
      description: 'Write your first 10 words',
      icon: '✏️',
      color: '#10B981',
      unlocked: false,
      progress: wordCount,
      maxProgress: 10,
      category: 'writing'
    },
    {
      id: 'getting-started',
      name: 'Getting Started',
      description: 'Write 50 words',
      icon: '📝',
      color: '#3B82F6',
      unlocked: false,
      progress: wordCount,
      maxProgress: 50,
      category: 'writing'
    },
    {
      id: 'word-warrior',
      name: 'Word Warrior',
      description: 'Write 100 words',
      icon: '⚔️',
      color: '#8B5CF6',
      unlocked: false,
      progress: wordCount,
      maxProgress: 100,
      category: 'writing'
    },
    {
      id: 'story-teller',
      name: 'Story Teller',
      description: 'Write 200 words',
      icon: '📚',
      color: '#F59E0B',
      unlocked: false,
      progress: wordCount,
      maxProgress: 200,
      category: 'writing'
    },
    {
      id: 'author-in-training',
      name: 'Author in Training',
      description: 'Write 300 words',
      icon: '🏆',
      color: '#EF4444',
      unlocked: false,
      progress: wordCount,
      maxProgress: 300,
      category: 'writing'
    },

    // Grammar achievements
    {
      id: 'perfect-paragraph',
      name: 'Perfect Paragraph',
      description: 'Write a paragraph with no errors',
      icon: '✅',
      color: '#10B981',
      unlocked: false,
      category: 'grammar'
    },
    {
      id: 'grammar-guru',
      name: 'Grammar Guru',
      description: 'Maintain perfect grammar for 100+ words',
      icon: '📖',
      color: '#3B82F6',
      unlocked: false,
      category: 'grammar'
    },
    {
      id: 'spelling-star',
      name: 'Spelling Star',
      description: 'No spelling errors in your story',
      icon: '⭐',
      color: '#F59E0B',
      unlocked: false,
      category: 'grammar'
    },
    {
      id: 'punctuation-pro',
      name: 'Punctuation Pro',
      description: 'Perfect punctuation throughout',
      icon: '❗',
      color: '#FF8C00',
      unlocked: false,
      category: 'grammar'
    },

    // Creativity achievements
    {
      id: 'dialogue-master',
      name: 'Dialogue Master',
      description: 'Use dialogue correctly in your story',
      icon: '💬',
      color: '#8B5CF6',
      unlocked: false,
      category: 'creativity'
    },
    {
      id: 'description-artist',
      name: 'Description Artist',
      description: 'Use vivid descriptive language',
      icon: '🎨',
      color: '#EC4899',
      unlocked: false,
      category: 'creativity'
    },
    {
      id: 'story-architect',
      name: 'Story Architect',
      description: 'Create a well-structured narrative',
      icon: '🏗️',
      color: '#6B7280',
      unlocked: false,
      category: 'creativity'
    },
    {
      id: 'vocabulary-virtuoso',
      name: 'Vocabulary Virtuoso',
      description: 'Use advanced vocabulary appropriately',
      icon: '📚',
      color: '#7C3AED',
      unlocked: false,
      category: 'creativity'
    },

    // Progress achievements
    {
      id: 'dedicated-writer',
      name: 'Dedicated Writer',
      description: 'Write for 10 minutes straight',
      icon: '⏰',
      color: '#059669',
      unlocked: false,
      progress: sessionTime,
      maxProgress: 10,
      category: 'progress'
    },
    {
      id: 'marathon-writer',
      name: 'Marathon Writer',
      description: 'Write for 30 minutes straight',
      icon: '🏃',
      color: '#DC2626',
      unlocked: false,
      progress: sessionTime,
      maxProgress: 30,
      category: 'progress'
    },
    {
      id: 'improvement-champion',
      name: 'Improvement Champion',
      description: 'Fix 5 grammar errors',
      icon: '🔧',
      color: '#0891B2',
      unlocked: false,
      category: 'progress'
    }
  ];

  // Check for newly unlocked achievements
  useEffect(() => {
    const updatedAchievements = allAchievements.map(achievement => {
      let unlocked = false;

      switch (achievement.id) {
        case 'first-words':
          unlocked = wordCount >= 10;
          break;
        case 'getting-started':
          unlocked = wordCount >= 50;
          break;
        case 'word-warrior':
          unlocked = wordCount >= 100;
          break;
        case 'story-teller':
          unlocked = wordCount >= 200;
          break;
        case 'author-in-training':
          unlocked = wordCount >= 300;
          break;
        case 'perfect-paragraph':
          unlocked = checkResult ? checkResult.achievements.includes('Perfect Paragraph') : false;
          break;
        case 'grammar-guru':
          unlocked = checkResult ? 
            checkResult.achievements.includes('Grammar Guardian') && wordCount >= 100 : false;
          break;
        case 'spelling-star':
          unlocked = checkResult ? 
            checkResult.errorCounts.spelling === 0 && wordCount >= 50 : false;
          break;
        case 'punctuation-pro':
          unlocked = checkResult ? 
            checkResult.errorCounts.punctuation === 0 && wordCount >= 50 : false;
          break;
        case 'dialogue-master':
          unlocked = checkResult ? 
            checkResult.achievements.includes('Conversation King') : false;
          break;
        case 'description-artist':
          unlocked = checkResult ? 
            checkResult.nswCriteria.creativeElements.includes('Descriptive adjectives') : false;
          break;
        case 'story-architect':
          unlocked = checkResult ? 
            checkResult.achievements.includes('Story Architect') : false;
          break;
        case 'vocabulary-virtuoso':
          unlocked = checkResult ? 
            checkResult.achievements.includes('Word Wizard') : false;
          break;
        case 'dedicated-writer':
          unlocked = sessionTime >= 10;
          break;
        case 'marathon-writer':
          unlocked = sessionTime >= 30;
          break;
        case 'improvement-champion':
          // This would need to track fixes made
          unlocked = false;
          break;
      }

      return { ...achievement, unlocked };
    });

    // Find newly unlocked achievements
    const newUnlocked = updatedAchievements.filter((achievement, index) => 
      achievement.unlocked && !achievements[index]?.unlocked
    );

    if (newUnlocked.length > 0) {
      setNewlyUnlocked(newUnlocked);
      setShowNotification(true);
      
      // Auto-hide notification after 5 seconds
      setTimeout(() => setShowNotification(false), 5000);
    }

    setAchievements(updatedAchievements);
  }, [checkResult, wordCount, sessionTime]);

  const getProgressPercentage = (achievement: Achievement): number => {
    if (!achievement.maxProgress) return achievement.unlocked ? 100 : 0;
    return Math.min(100, (achievement.progress || 0) / achievement.maxProgress * 100);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'writing': return <BookOpen className="w-4 h-4" />;
      case 'grammar': return <CheckCircle className="w-4 h-4" />;
      case 'creativity': return <Star className="w-4 h-4" />;
      case 'progress': return <Target className="w-4 h-4" />;
      default: return <Award className="w-4 h-4" />;
    }
  };

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;

  return (
    <>
      {/* Achievement Notification */}
      {showNotification && newlyUnlocked.length > 0 && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-from-right">
          {newlyUnlocked.map(achievement => (
            <div
              key={achievement.id}
              className={`mb-2 p-4 rounded-lg shadow-lg border-l-4 ${
                darkMode 
                  ? 'bg-gray-800 text-white border-yellow-400' 
                  : 'bg-white text-gray-900 border-yellow-500'
              }`}
              style={{ borderLeftColor: achievement.color }}
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg"
                    style={{ backgroundColor: achievement.color }}
                  >
                    {achievement.icon}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <span className="font-semibold text-sm">Achievement Unlocked!</span>
                  </div>
                  <h4 className="font-bold">{achievement.name}</h4>
                  <p className="text-sm opacity-75">{achievement.description}</p>
                </div>
                <button
                  onClick={() => setShowNotification(false)}
                  className={`p-1 rounded-full hover:bg-opacity-20 ${
                    darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Achievement Panel */}
      <div className={`p-4 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <h3 className="text-lg font-semibold">Achievements</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
            }`}>
              {unlockedCount}/{totalCount}
            </span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className={`p-1 rounded-full hover:bg-opacity-20 ${
                darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className={`w-full h-2 rounded-full mb-6 ${
          darkMode ? 'bg-gray-700' : 'bg-gray-200'
        }`}>
          <div 
            className="h-2 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full transition-all duration-500"
            style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
          />
        </div>

        {/* Achievement Categories */}
        {['writing', 'grammar', 'creativity', 'progress'].map(category => {
          const categoryAchievements = achievements.filter(a => a.category === category);
          const categoryUnlocked = categoryAchievements.filter(a => a.unlocked).length;

          return (
            <div key={category} className="mb-6">
              <div className="flex items-center space-x-2 mb-3">
                {getCategoryIcon(category)}
                <h4 className="font-semibold capitalize">{category}</h4>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                }`}>
                  {categoryUnlocked}/{categoryAchievements.length}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {categoryAchievements.map(achievement => (
                  <div
                    key={achievement.id}
                    className={`p-3 rounded-lg border transition-all duration-200 ${
                      achievement.unlocked
                        ? darkMode
                          ? 'bg-gray-700 border-gray-600 shadow-md'
                          : 'bg-gray-50 border-gray-200 shadow-md'
                        : darkMode
                        ? 'bg-gray-800 border-gray-700 opacity-60'
                        : 'bg-gray-100 border-gray-300 opacity-60'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${
                          achievement.unlocked ? '' : 'grayscale'
                        }`}
                        style={{ 
                          backgroundColor: achievement.unlocked ? achievement.color : '#6B7280'
                        }}
                      >
                        {achievement.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h5 className="font-medium text-sm">{achievement.name}</h5>
                          {achievement.unlocked && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                        <p className="text-xs opacity-75">{achievement.description}</p>
                        
                        {/* Progress bar for achievements with progress */}
                        {achievement.maxProgress && !achievement.unlocked && (
                          <div className="mt-2">
                            <div className={`w-full h-1 rounded-full ${
                              darkMode ? 'bg-gray-600' : 'bg-gray-300'
                            }`}>
                              <div 
                                className="h-1 rounded-full transition-all duration-300"
                                style={{ 
                                  width: `${getProgressPercentage(achievement)}%`,
                                  backgroundColor: achievement.color
                                }}
                              />
                            </div>
                            <div className="flex justify-between text-xs mt-1 opacity-75">
                              <span>{achievement.progress || 0}</span>
                              <span>{achievement.maxProgress}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Motivational Message */}
        <div className={`mt-6 p-4 rounded-lg text-center ${
          darkMode ? 'bg-blue-900/20 text-blue-300' : 'bg-blue-50 text-blue-700'
        }`}>
          <Zap className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
          <p className="text-sm font-medium">
            {unlockedCount === 0 
              ? "Start writing to unlock your first achievement!"
              : unlockedCount < totalCount / 2
              ? "Great progress! Keep writing to unlock more achievements!"
              : unlockedCount < totalCount
              ? "Amazing work! You're almost there!"
              : "Congratulations! You've unlocked all achievements! 🎉"
            }
          </p>
        </div>
      </div>
    </>
  );
};