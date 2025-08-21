import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Target, Clock, Award, Zap, X } from 'lucide-react';

interface DashboardProps {}

export default function Dashboard({}: DashboardProps) {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const [showWelcome, setShowWelcome] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Handle Start Writing Now button click
  const handleStartWriting = async () => {
    setIsLoading(true);
    try {
      // Navigate to text type selection
      navigate('/write/select-type');
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback: navigate to a basic writing interface
      navigate('/write');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Practice Exam button click
  const handlePracticeExam = async () => {
    setIsLoading(true);
    try {
      navigate('/practice');
    } catch (error) {
      console.error('Navigation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Message */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-400 to-pink-500 rounded-full flex items-center justify-center">
              <span className="text-2xl">✨</span>
            </div>
            <div className="ml-4">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Hi there, {userProfile?.full_name || user?.email?.split('@')[0] || 'Writer'}! 🌟
              </h1>
              <p className="text-lg text-orange-500 font-medium">
                Let's write something awesome today!
              </p>
            </div>
          </div>
        </div>

        {/* Welcome Card */}
        {showWelcome && (
          <div className="bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900/20 dark:to-blue-900/20 rounded-2xl p-6 mb-8 border border-green-200 dark:border-green-700 relative">
            <button
              onClick={() => setShowWelcome(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-teal-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Award className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  🎉 Hooray! You're All Set! 💎
                </h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Welcome to your writing adventure! You now have access to all the cool features:
                </p>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">AI Writing Assistant</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Target className="h-5 w-5 text-green-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Progress Tracking</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <BookOpen className="h-5 w-5 text-blue-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Practice Exams</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Award className="h-5 w-5 text-purple-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">NSW Selective Prep</span>
                  </div>
                </div>
                
                <p className="text-gray-700 dark:text-gray-300 font-medium">
                  Ready to become an amazing writer? Let's start your first story! 🚀
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Action Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Write Story Card */}
          <div className="bg-gradient-to-br from-purple-500 via-blue-500 to-purple-600 rounded-2xl p-8 text-white shadow-xl">
            <div className="flex items-center mb-6">
              <BookOpen className="h-8 w-8 mr-3" />
              <h2 className="text-2xl font-bold">Write Story</h2>
            </div>
            
            <p className="text-purple-100 mb-6 text-lg">
              Create amazing stories with AI help!
            </p>
            
            <div className="space-y-3 mb-8">
              <div className="flex items-center space-x-3">
                <Zap className="h-5 w-5 text-yellow-300" />
                <span className="text-purple-100">AI-powered writing prompts</span>
              </div>
              <div className="flex items-center space-x-3">
                <Target className="h-5 w-5 text-green-300" />
                <span className="text-purple-100">NSW Selective School prep</span>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-blue-300" />
                <span className="text-purple-100">Real-time feedback & tips</span>
              </div>
            </div>
            
            <button
              onClick={handleStartWriting}
              disabled={isLoading}
              className="w-full bg-white text-purple-600 font-bold py-4 px-6 rounded-xl hover:bg-purple-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5" />
                  <span>Start Writing Now!</span>
                </>
              )}
            </button>
          </div>

          {/* Practice Exam Card */}
          <div className="bg-gradient-to-br from-green-500 via-teal-500 to-blue-500 rounded-2xl p-8 text-white shadow-xl">
            <div className="flex items-center mb-6">
              <Target className="h-8 w-8 mr-3" />
              <h2 className="text-2xl font-bold">Practice Exam</h2>
            </div>
            
            <p className="text-green-100 mb-6 text-lg">
              Test your skills with real exams!
            </p>
            
            <div className="space-y-3 mb-8">
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-yellow-300" />
                <span className="text-green-100">Timed practice sessions</span>
              </div>
              <div className="flex items-center space-x-3">
                <Award className="h-5 w-5 text-purple-300" />
                <span className="text-green-100">Detailed performance analysis</span>
              </div>
              <div className="flex items-center space-x-3">
                <BookOpen className="h-5 w-5 text-blue-300" />
                <span className="text-green-100">Track your improvement</span>
              </div>
            </div>
            
            <button
              onClick={handlePracticeExam}
              disabled={isLoading}
              className="w-full bg-white text-green-600 font-bold py-4 px-6 rounded-xl hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5" />
                  <span>Take Practice Exam</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-12 max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center shadow-lg">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">0</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Stories Written</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center shadow-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">0</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Exams Taken</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center shadow-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">0</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Words Written</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center shadow-lg">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">0</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Achievements</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}