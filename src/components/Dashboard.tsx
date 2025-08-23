import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isEmailVerified, hasAnyAccess, getUserAccessStatus } from '../lib/supabase';
import { WritingTypeSelectionModal } from './WritingTypeSelectionModal';
import { PromptOptionsModal } from './PromptOptionsModal';
import { generatePrompt } from '../lib/openai';
import {
  Mail,
  CheckCircle,
  Clock,
  FileText,
  PenTool,
  BarChart3,
  Settings,
  X,
  Star,
  BookOpen,
  Zap,
  Heart,
  Trophy,
  Sparkles,
  Smile,
  Target,
  Gift,
  Flame,
  TrendingUp,
  Award,
  Rocket,
  Crown,
  Gem,
  Wand2,
  Palette,
  Music,
  Camera,
  Gamepad2
} from 'lucide-react';

interface DashboardProps {
  user?: any;
  emailVerified?: boolean;
  paymentCompleted?: boolean;
  onNavigate?: (page: string) => void;
  onSignOut?: () => void;
}

export function Dashboard({ user: propUser, emailVerified: propEmailVerified, paymentCompleted: propPaymentCompleted, onNavigate, onSignOut }: DashboardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isVerified, setIsVerified] = useState(false);
  const [accessType, setAccessType] = useState<'none' | 'temporary' | 'permanent'>('none');
  const [tempAccessUntil, setTempAccessUntil] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userAccessData, setUserAccessData] = useState<any>(null);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);

  // FIXED: Modal states for proper sequence
  const [showWritingTypeModal, setShowWritingTypeModal] = useState(false);
  const [showPromptOptionsModal, setShowPromptOptionsModal] = useState(false);
  const [selectedWritingType, setSelectedWritingType] = useState<string>('');
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);

  // Use prop user if provided, otherwise use context user
  const currentUser = propUser || user;

  useEffect(() => {
    const checkVerificationStatus = async () => {
      if (currentUser) {
        console.log('🔍 Dashboard: Checking verification status for user:', currentUser.id);
        setIsLoading(true);

        try {
          // Get detailed user access status from database
          const accessData = await getUserAccessStatus(currentUser.id);
          setUserAccessData(accessData);

          if (accessData) {
            console.log('📊 User access data:', accessData);

            // Check if user has permanent access (payment verified or manual override)
            if (accessData.payment_verified || accessData.manual_override || accessData.has_access) {
              setIsVerified(true);
              setAccessType('permanent');

              // Check if this is the first time showing the welcome message
              const hasSeenWelcome = localStorage.getItem(`welcome_shown_${currentUser.id}`);
              if (!hasSeenWelcome) {
                setShowWelcomeMessage(true);
                localStorage.setItem(`welcome_shown_${currentUser.id}`, 'true');
              }

              console.log('✅ Dashboard: Permanent access confirmed - payment verified:', accessData.payment_verified);
              setIsLoading(false);
              return;
            }

            // Check if user has valid temporary access
            if (accessData.temp_access_until) {
              const tempDate = new Date(accessData.temp_access_until);
              if (tempDate > new Date()) {
                setIsVerified(true);
                setAccessType('temporary');
                setTempAccessUntil(accessData.temp_access_until);
                console.log('✅ Dashboard: Temporary access valid until:', tempDate);
                setIsLoading(false);
                return;
              }
            }
          }

          // Fallback: Check for temporary access in localStorage
          const tempAccess = localStorage.getItem('temp_access_granted');
          const tempUntil = localStorage.getItem('temp_access_until');

          if (tempAccess === 'true' && tempUntil) {
            const tempDate = new Date(tempUntil);
            if (tempDate > new Date()) {
              setIsVerified(true);
              setAccessType('temporary');
              setTempAccessUntil(tempUntil);
              console.log('✅ Dashboard: Temporary access from localStorage valid until:', tempDate);
              setIsLoading(false);
              return;
            } else {
              // Clean up expired temporary access
              localStorage.removeItem('temp_access_granted');
              localStorage.removeItem('temp_access_until');
              localStorage.removeItem('temp_access_plan');
            }
          }

          // Check basic email verification
          const verified = isEmailVerified(currentUser);
          setIsVerified(verified);
          setAccessType('none');
          console.log('📊 Dashboard: Only email verification result:', verified);

        } catch (error) {
          console.error('❌ Error checking verification status:', error);
          setIsVerified(false);
          setAccessType('none');
        }

        setIsLoading(false);
      }
    };

    checkVerificationStatus();
  }, [currentUser]);

  const handleManualRefresh = async () => {
    if (currentUser) {
      setIsLoading(true);
      try {
        // Refresh user access status from database
        const accessData = await getUserAccessStatus(currentUser.id);
        setUserAccessData(accessData);

        if (accessData && (accessData.payment_verified || accessData.manual_override || accessData.has_access)) {
          setIsVerified(true);
          setAccessType('permanent');

          // Check if this is the first time showing the welcome message after manual refresh
          const hasSeenWelcome = localStorage.getItem(`welcome_shown_${currentUser.id}`);
          if (!hasSeenWelcome) {
            setShowWelcomeMessage(true);
            localStorage.setItem(`welcome_shown_${currentUser.id}`, 'true');
          }

          console.log('✅ Refresh: Permanent access confirmed');
        } else if (accessData && accessData.temp_access_until) {
          const tempDate = new Date(accessData.temp_access_until);
          if (tempDate > new Date()) {
            setIsVerified(true);
            setAccessType('temporary');
            setTempAccessUntil(accessData.temp_access_until);
            console.log('✅ Refresh: Temporary access confirmed');
          } else {
            setIsVerified(false);
            setAccessType('none');
          }
        } else {
          const verified = isEmailVerified(currentUser);
          setIsVerified(verified);
          setAccessType('none');
        }
      } catch (error) {
        console.error('❌ Error refreshing status:', error);
      }
      setIsLoading(false);
    }
  };

  // FIXED: Step 1 - "Write Story" button opens writing type selection modal
  const handleStartWriting = () => {
    console.log('🚀 Dashboard: Starting writing flow...');

    // Clear any existing navigation data to ensure fresh start
    localStorage.removeItem('selectedWritingType');
    localStorage.removeItem('promptType');
    localStorage.removeItem('navigationSource');
    localStorage.removeItem('writingContent');
    localStorage.removeItem('generatedPrompt');

    // Set navigation source to track the flow
    localStorage.setItem('navigationSource', 'dashboard');

    // Show the writing type selection modal (Step 2)
    setShowWritingTypeModal(true);
  };

  // FIXED: Step 2 - Handle writing type selection, then show prompt options
  const handleWritingTypeSelect = (type: string) => {
    console.log('📝 Dashboard: Writing type selected:', type);

    // Store the selected writing type
    setSelectedWritingType(type);
    localStorage.setItem('selectedWritingType', type);

    // Close writing type modal and open prompt options modal (Step 3)
    setShowWritingTypeModal(false);
    setShowPromptOptionsModal(true);
  };

  // FIXED: Step 3 - Handle prompt generation, then navigate to writing area
  const handleGeneratePrompt = async () => {
    console.log('🎯 Dashboard: Generating prompt for:', selectedWritingType);
    setIsGeneratingPrompt(true);

    try {
      // Call the OpenAI prompt generation function
      const prompt = await generatePrompt(selectedWritingType);

      if (prompt) {
        console.log('✅ Prompt generated successfully:', prompt);

        // CRITICAL: Save to localStorage so WritingArea can access it
        localStorage.setItem(`${selectedWritingType}_prompt`, prompt);
        localStorage.setItem('generatedPrompt', prompt);
        localStorage.setItem('selectedWritingType', selectedWritingType);
        localStorage.setItem('promptType', 'generated');

        console.log('✅ Prompt saved to localStorage');

        // Small delay to ensure localStorage is written
        await new Promise(resolve => setTimeout(resolve, 200));

        // Navigate to writing area AFTER prompt is generated
        navigate("/writing");
        setShowPromptOptionsModal(false);
        console.log('✅ Dashboard: Navigation to /writing initiated');

      } else {
        throw new Error('No prompt generated');
      }

    } catch (error) {
      console.error('❌ Error generating prompt:', error);

      // FALLBACK: Use high-quality static prompts if AI generation fails
      const fallbackPrompts = {
        narrative: "Write an engaging story about a character who discovers something unexpected that changes their life forever. Include vivid descriptions, realistic dialogue, and show the character's emotional journey. Make sure your story has a clear beginning, middle, and end with a satisfying conclusion. Focus on showing rather than telling, and use sensory details to bring your story to life.",
        persuasive: "Choose a topic you feel strongly about and write a persuasive essay to convince others of your viewpoint. Use strong evidence, logical reasoning, and persuasive techniques like rhetorical questions and emotional appeals. Structure your argument clearly with an introduction that states your position, body paragraphs that support your argument with evidence, and a conclusion that reinforces your main point.",
        expository: "Select a topic you know well and write an informative essay that teaches others about it. Use clear explanations, relevant examples, and organize your information in a logical sequence. Include an engaging introduction that hooks your reader, body paragraphs that explore different aspects of your topic, and a strong conclusion that summarizes your main points.",
        reflective: "Think about a meaningful experience in your life and write a reflective piece exploring what you learned from it. Show your thoughts and feelings, and explain how this experience changed or influenced you. Be honest and thoughtful in your reflection, using specific details to help your reader understand the significance of this experience.",
        descriptive: "Choose a place, person, or object that is special to you and write a descriptive piece that brings it to life for your reader. Use sensory details (sight, sound, smell, touch, taste) and figurative language like metaphors and similes to create vivid imagery. Paint a picture with words that allows your reader to experience what you're describing.",
        recount: "Write about an important event or experience in your life, telling what happened in the order it occurred. Include details about who was involved, where it happened, when it took place, and why it was significant to you. Use descriptive language to help your reader visualize the events and understand their importance."
      };

      const fallbackPrompt = fallbackPrompts[selectedWritingType as keyof typeof fallbackPrompts] || fallbackPrompts.narrative;

      console.log('🔄 Using fallback prompt:', fallbackPrompt);

      // Save fallback prompt
      localStorage.setItem(`${selectedWritingType}_prompt`, fallbackPrompt);
      localStorage.setItem('generatedPrompt', fallbackPrompt);
      localStorage.setItem('selectedWritingType', selectedWritingType);
      localStorage.setItem('promptType', 'generated');

      // Close prompt options modal
      setShowPromptOptionsModal(false);

      // Navigate to writing area with fallback prompt
      await new Promise(resolve => setTimeout(resolve, 200));
      navigate('/writing');

    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  // FIXED: Step 3 - Handle custom prompt, then navigate to writing area
  const handleCustomPrompt = () => {
    console.log('✏️ Dashboard: Using custom prompt for:', selectedWritingType);

    // Store the prompt type
    localStorage.setItem('promptType', 'custom');
    localStorage.setItem('selectedWritingType', selectedWritingType);

    // Close prompt options modal
    setShowPromptOptionsModal(false);

    // Navigate to writing page (Step 4 - Writing Area)
    console.log('📍 Dashboard: Navigating to writing area...');

    // FIXED: Use React Router navigate directly for consistent navigation
    try {
      navigate('/writing');
      setShowPromptOptionsModal(false);
    } catch (error) {
      console.error('❌ Dashboard: Navigation error:', error);
      // Fallback to onNavigate if available
      if (onNavigate) {
        console.log('📍 Dashboard: Using onNavigate fallback');
        onNavigate('writing');
      } else {
        console.log('📍 Dashboard: Using window.location fallback');
        window.location.href = '/writing';
      }
    }
  };

  const handlePracticeExam = () => {
    console.log('🚀 Dashboard: Navigating to practice exam...');
    try {
      navigate('/exam');
    } catch (error) {
      console.error('❌ Dashboard: Exam navigation error:', error);
      if (onNavigate) {
        onNavigate('exam');
      } else {
        window.location.href = '/exam';
      }
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getTimeRemaining = (dateString: string) => {
    const now = new Date();
    const target = new Date(dateString);
    const diff = target.getTime() - now.getTime();

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else {
      return `${minutes}m remaining`;
    }
  };

  const handleDismissWelcome = () => {
    setShowWelcomeMessage(false);
  };

  // Get user's first name from email
  const getUserName = () => {
    if (currentUser?.email) {
      const emailPart = currentUser.email.split('@')[0];
      // Capitalize first letter and handle dots
      const namePart = emailPart.split('.')[0];
      return namePart.charAt(0).toUpperCase() + namePart.slice(1);
    }
    return 'Friend';
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-3xl p-12 shadow-xl max-w-md mx-4">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="h-10 w-10 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Oops!</h2>
          <p className="text-gray-600 text-lg">You need to sign in first to start your writing adventure!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-yellow-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-pink-200 rounded-full opacity-30 animate-bounce"></div>
        <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-purple-200 rounded-full opacity-15 animate-pulse"></div>
        <div className="absolute bottom-10 right-1/3 w-36 h-36 bg-green-200 rounded-full opacity-25 animate-bounce"></div>
      </div>

      {/* Welcome Message Modal */}
      {showWelcomeMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full border-4 border-green-300 dark:border-green-700 relative">
            <button
              onClick={handleDismissWelcome}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors bg-white dark:bg-gray-700 p-2 rounded-full shadow-md hover:shadow-lg transform hover:scale-110 transition-all duration-300"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Smile className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Welcome, {getUserName()}!</h2>
              <p className="text-gray-700 dark:text-gray-300 text-lg mb-6">
                We're so excited to have you here. Let's start your writing journey!
              </p>
              <button
                onClick={handleDismissWelcome}
                className="bg-green-500 text-white px-8 py-3 rounded-full font-bold text-lg shadow-lg hover:bg-green-600 transition-colors transform hover:scale-105"
              >
                Let's Go!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Dashboard Content */}
      <div className="relative z-10 p-8">
        <div className="max-w-7xl mx-auto bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 md:p-12 border-4 border-blue-200 dark:border-blue-800">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-6 border-b-2 border-gray-200 dark:border-gray-700">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-4 shadow-lg">
                <Rocket className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 mb-1">
                  Your Creative Hub
                </h1>
                <p className="text-gray-600 dark:text-gray-300 text-lg">
                  Welcome back, {getUserName()}! What will you create today?
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={onSignOut}
                className="px-6 py-3 bg-red-500 text-white rounded-full font-bold text-lg shadow-lg hover:bg-red-600 transition-colors transform hover:scale-105"
              >
                Sign Out
              </button>
              <button
                onClick={() => onNavigate('settings')}
                className="px-6 py-3 bg-gray-200 text-gray-800 rounded-full font-bold text-lg shadow-lg hover:bg-gray-300 transition-colors transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <Settings className="h-5 w-5" /> Settings
              </button>
            </div>
          </div>

          {/* Access Status Section */}
          <div className="mb-10 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-inner border border-blue-100 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Zap className="h-6 w-6 text-yellow-500 fill-yellow-500" /> Your Access Status
            </h2>
            {isLoading ? (
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <Clock className="h-5 w-5 animate-spin mr-2" /> Checking access...
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                <div className="flex items-center text-lg font-medium">
                  {isVerified ? (
                    <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
                  ) : (
                    <X className="h-6 w-6 text-red-500 mr-2" />
                  )}
                  <span className="text-gray-700 dark:text-gray-300">
                    {isVerified ? (
                      accessType === 'permanent' ? (
                        'Full Access (Permanent)'
                      ) : (
                        `Temporary Access (Expires: ${formatDateTime(tempAccessUntil || '')})`
                      )
                    ) : (
                      'No Active Access'
                    )}
                  </span>
                </div>
                {!isVerified && (
                  <button
                    onClick={() => onNavigate('pricing')}
                    className="mt-4 sm:mt-0 px-6 py-3 bg-blue-500 text-white rounded-full font-bold text-lg shadow-lg hover:bg-blue-600 transition-colors transform hover:scale-105"
                  >
                    Unlock Full Access
                  </button>
                )}
                {isVerified && accessType === 'temporary' && (
                  <button
                    onClick={() => onNavigate('pricing')}
                    className="mt-4 sm:mt-0 px-6 py-3 bg-purple-500 text-white rounded-full font-bold text-lg shadow-lg hover:bg-purple-600 transition-colors transform hover:scale-105"
                  >
                    Upgrade to Permanent
                  </button>
                )}
                <button
                  onClick={handleManualRefresh}
                  className="mt-4 sm:mt-0 px-6 py-3 bg-gray-200 text-gray-800 rounded-full font-bold text-lg shadow-lg hover:bg-gray-300 transition-colors transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  <Mail className="h-5 w-5" /> Refresh Status
                </button>
              </div>
            )}
          </div>

          {/* Main Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
            {/* Start Writing Card */}
            <div
              onClick={handleStartWriting}
              className="relative bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer overflow-hidden group"
            >
              <div className="absolute inset-0 bg-black opacity-10 rounded-3xl"></div>
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-blue-400 opacity-20 group-hover:scale-125 transition-transform"></div>
              <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 rounded-full bg-purple-400 opacity-20 group-hover:scale-125 transition-transform"></div>
              <div className="flex items-center mb-4 relative z-10">
                <div className="p-4 bg-white/20 rounded-full mr-4 shadow-md">
                  <PenTool className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white">Start Writing</h2>
              </div>
              <p className="text-blue-100 text-lg mb-6 relative z-10">
                Dive into your next masterpiece. Choose your writing type and get a prompt!
              </p>
              <button className="px-6 py-3 bg-white text-blue-600 rounded-full font-bold text-lg shadow-lg group-hover:bg-blue-100 transition-colors transform group-hover:scale-105 relative z-10">
                Begin Your Story <span className="ml-2 text-blue-400 group-hover:text-blue-600">→</span>
              </button>
            </div>

            {/* Practice Exam Card */}
            <div
              onClick={handlePracticeExam}
              className="relative bg-gradient-to-br from-green-500 to-teal-600 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer overflow-hidden group"
            >
              <div className="absolute inset-0 bg-black opacity-10 rounded-3xl"></div>
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-green-400 opacity-20 group-hover:scale-125 transition-transform"></div>
              <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 rounded-full bg-teal-400 opacity-20 group-hover:scale-125 transition-transform"></div>
              <div className="flex items-center mb-4 relative z-10">
                <div className="p-4 bg-white/20 rounded-full mr-4 shadow-md">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white">Practice Exam</h2>
              </div>
              <p className="text-green-100 text-lg mb-6 relative z-10">
                Prepare for your selective school exam with timed practice sessions.
              </p>
              <button className="px-6 py-3 bg-white text-green-600 rounded-full font-bold text-lg shadow-lg group-hover:bg-green-100 transition-colors transform group-hover:scale-105 relative z-10">
                Start Exam Prep <span className="ml-2 text-green-400 group-hover:text-green-600">→</span>
              </button>
            </div>

            {/* Progress Tracking Card */}
            <div
              onClick={() => onNavigate('progress-tracking')}
              className="relative bg-gradient-to-br from-yellow-500 to-orange-600 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer overflow-hidden group"
            >
              <div className="absolute inset-0 bg-black opacity-10 rounded-3xl"></div>
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-yellow-400 opacity-20 group-hover:scale-125 transition-transform"></div>
              <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 rounded-full bg-orange-400 opacity-20 group-hover:scale-125 transition-transform"></div>
              <div className="flex items-center mb-4 relative z-10">
                <div className="p-4 bg-white/20 rounded-full mr-4 shadow-md">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white">Track Progress</h2>
              </div>
              <p className="text-yellow-100 text-lg mb-6 relative z-10">
                See how much you've grown and where you can improve.
              </p>
              <button className="px-6 py-3 bg-white text-yellow-600 rounded-full font-bold text-lg shadow-lg group-hover:bg-yellow-100 transition-colors transform group-hover:scale-105 relative z-10">
                View Analytics <span className="ml-2 text-yellow-400 group-hover:text-yellow-600">→</span>
              </button>
            </div>
          </div>

          {/* Additional Features Section */}
          <div className="mb-10 p-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-inner border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Star className="h-6 w-6 text-blue-500 fill-blue-500" /> Explore More Features
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <button
                onClick={() => onNavigate('learning')}
                className="flex items-center p-4 bg-white dark:bg-gray-700 rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 border border-gray-200 dark:border-gray-600"
              >
                <BookOpen className="h-6 w-6 text-blue-500 mr-3" />
                <span className="text-gray-800 dark:text-white font-medium">Learning Hub</span>
              </button>
              <button
                onClick={() => onNavigate('supportive-features')}
                className="flex items-center p-4 bg-white dark:bg-gray-700 rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 border border-gray-200 dark:border-gray-600"
              >
                <Heart className="h-6 w-6 text-pink-500 mr-3" />
                <span className="text-gray-800 dark:text-white font-medium">Supportive Features</span>
              </button>
              <button
                onClick={() => onNavigate('essay-feedback')}
                className="flex items-center p-4 bg-white dark:bg-gray-700 rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 border border-gray-200 dark:border-gray-600"
              >
                <Trophy className="h-6 w-6 text-yellow-500 mr-3" />
                <span className="text-gray-800 dark:text-white font-medium">Essay Feedback</span>
              </button>
              <button
                onClick={() => onNavigate('specialized-coaching')}
                className="flex items-center p-4 bg-white dark:bg-gray-700 rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 border border-gray-200 dark:border-gray-600"
              >
                <Sparkles className="h-6 w-6 text-purple-500 mr-3" />
                <span className="text-gray-800 dark:text-white font-medium">Specialized Coaching</span>
              </button>
              <button
                onClick={() => onNavigate('brainstorming-tools')}
                className="flex items-center p-4 bg-white dark:bg-gray-700 rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 border border-gray-200 dark:border-gray-600"
              >
                <Wand2 className="h-6 w-6 text-red-500 mr-3" />
                <span className="text-gray-800 dark:text-white font-medium">Brainstorming Tools</span>
              </button>
              <button
                onClick={() => onNavigate('help-center')}
                className="flex items-center p-4 bg-white dark:bg-gray-700 rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 border border-gray-200 dark:border-gray-600"
              >
                <Target className="h-6 w-6 text-cyan-500 mr-3" />
                <span className="text-gray-800 dark:text-white font-medium">Help Center</span>
              </button>
            </div>
          </div>

          {/* Writing Type Selection Modal */}
          <WritingTypeSelectionModal
            isOpen={showWritingTypeModal}
            onClose={() => setShowWritingTypeModal(false)}
            onSelect={handleWritingTypeSelect}
          />

          {/* Prompt Options Modal */}
          <PromptOptionsModal
            isOpen={showPromptOptionsModal}
            onClose={() => setShowPromptOptionsModal(false)}
            onGeneratePrompt={handleGeneratePrompt}
            onCustomPrompt={handleCustomPrompt}
            textType={selectedWritingType}
          />
        </div>
      </div>
    </div>
  );
}
