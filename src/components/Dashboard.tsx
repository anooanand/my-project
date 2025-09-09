import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isEmailVerified, hasAnyAccess, getUserAccessStatus } from '../lib/supabase';
import { ImprovedWritingTypeSelectionModal } from './WritingTypeSelectionModal';
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
  Gamepad2,
  HelpCircle,
  ArrowRight
} from 'lucide-react';

interface DashboardProps {
  user?: any;
  emailVerified?: boolean;
  paymentCompleted?: boolean;
  onNavigate?: (page: string) => void;
  onSignOut?: () => void;
}

export function ImprovedDashboard({ user: propUser, emailVerified: propEmailVerified, paymentCompleted: propPaymentCompleted, onNavigate, onSignOut }: DashboardProps) {
export function Dashboard({ user: propUser, emailVerified: propEmailVerified, paymentCompleted: propPaymentCompleted, onNavigate, onSignOut }: DashboardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isVerified, setIsVerified] = useState(false);
  const [accessType, setAccessType] = useState<'none' | 'temporary' | 'permanent'>('none');
  const [tempAccessUntil, setTempAccessUntil] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userAccessData, setUserAccessData] = useState<any>(null);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);
  const [showStartHereGuide, setShowStartHereGuide] = useState(false);

  // Modal states for proper sequence
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

              // Check if user needs the "Start Here" guide
              const hasSeenGuide = localStorage.getItem(`start_guide_shown_${currentUser.id}`);
              if (!hasSeenGuide) {
                setShowStartHereGuide(true);
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
                console.log('⏰ Dashboard: Temporary access confirmed until:', accessData.temp_access_until);
                setIsLoading(false);
                return;
              }
            }
          }

          // No valid access found
          setIsVerified(false);
          setAccessType('none');
          console.log('❌ Dashboard: No valid access found');

        } catch (error) {
          console.error('❌ Dashboard: Error checking verification status:', error);
          setIsVerified(false);
          setAccessType('none');
        } finally {
          setIsLoading(false);
        }
      }
    };

    checkVerificationStatus();
  }, [currentUser]);

  const getUserName = () => {
    if (currentUser?.user_metadata?.full_name) {
      return currentUser.user_metadata.full_name.split(' ')[0];
    }
    if (currentUser?.email) {
      return currentUser.email.split('@')[0];
    }
    return 'Writer';
  };

  const handleDismissWelcome = () => {
    setShowWelcomeMessage(false);
  };

  const handleDismissGuide = () => {
    setShowStartHereGuide(false);
    localStorage.setItem(`start_guide_shown_${currentUser.id}`, 'true');
  };

  const handleManualRefresh = async () => {
    setIsLoading(true);
    // Trigger a re-check of verification status
    const event = new Event('checkVerificationStatus');
    window.dispatchEvent(event);
    
    // Refresh the page data
    window.location.reload();
  };

  // FIXED: Step 1 - Clear any existing data and start the flow
  const handleStartWriting = () => {
    console.log('🚀 Dashboard: Starting writing flow...');
    
    // Clear any existing data to start fresh
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-200 rounded-full opacity-10 animate-pulse"></div>
      </div>

      {/* Welcome Message Modal - Improved for kids */}
      {showWelcomeMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full relative transform animate-bounce">
            <button
              onClick={handleDismissWelcome}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors bg-white dark:bg-gray-700 p-2 rounded-full shadow-md hover:shadow-lg transform hover:scale-110 transition-all duration-300"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Smile className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Welcome, {getUserName()}!</h2>
              <p className="text-gray-700 dark:text-gray-300 text-base mb-6">
                We're excited to help you become an amazing writer! Let's get started.
              </p>
              <button
                onClick={handleDismissWelcome}
                className="kid-btn kid-btn-success kid-btn-large"
              >
                Let's Write! <ArrowRight className="w-5 h-5 ml-2" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Start Here Guide - New feature for first-time users */}
      {showStartHereGuide && !showWelcomeMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-lg w-full relative">
            <button
              onClick={handleDismissGuide}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors bg-white dark:bg-gray-700 p-2 rounded-full shadow-md hover:shadow-lg transform hover:scale-110 transition-all duration-300"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <HelpCircle className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">New Here? Start Here!</h2>
              <div className="text-left space-y-3 mb-6">
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">1</div>
                  <span>Click "Start Writing" to begin</span>
                </div>
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">2</div>
                  <span>Choose what type of story you want to write</span>
                </div>
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">3</div>
                  <span>Get a fun writing prompt or use your own idea</span>
                </div>
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">4</div>
                  <span>Start writing and get help from your AI buddy!</span>
                </div>
              </div>
              <button
                onClick={handleDismissGuide}
                className="kid-btn kid-btn-primary kid-btn-large"
              >
                Got It! <ArrowRight className="w-5 h-5 ml-2" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Dashboard Content */}
      <div className="relative z-10 p-6">
        <div className="max-w-6xl mx-auto bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-6 md:p-8 border-4 border-blue-200 dark:border-blue-800">
          
          {/* Header Section - Simplified */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b-2 border-gray-200 dark:border-gray-700">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-3 shadow-lg">
                <Rocket className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 mb-1">
                  Your Writing Space
                </h1>
                <p className="text-gray-600 dark:text-gray-300 text-base">
                  Hi {getUserName()}! Ready to write something awesome?
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => onNavigate('settings')}
                className="kid-btn kid-btn-outline flex items-center justify-center gap-2"
              >
                <Settings className="h-4 w-4" /> Settings
              </button>
              <button
                onClick={onSignOut}
                className="kid-btn kid-btn-danger"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Access Status Section - Simplified */}
          <div className="mb-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-inner border border-blue-100 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500 fill-yellow-500" /> Your Access
            </h2>
            {isLoading ? (
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <Clock className="h-4 w-4 animate-spin mr-2" /> Checking...
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center text-base font-medium">
                  {isVerified ? (
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  ) : (
                    <X className="h-5 w-5 text-red-500 mr-2" />
                  )}
                  <span className="text-gray-700 dark:text-gray-300">
                    {isVerified ? (
                      accessType === 'permanent' ? (
                        'Full Access ✨'
                      ) : (
                        `Access Until: ${formatDateTime(tempAccessUntil || '')}`
                      )
                    ) : (
                      'No Access Yet'
                    )}
                  </span>
                </div>
                <div className="flex gap-2">
                  {!isVerified && (
                    <button
                      onClick={() => onNavigate('pricing')}
                      className="kid-btn kid-btn-primary"
                    >
                      Get Access
                    </button>
                  )}
                  {isVerified && accessType === 'temporary' && (
                    <button
                      onClick={() => onNavigate('pricing')}
                      className="kid-btn kid-btn-fun"
                    >
                      Keep Forever
                    </button>
                  )}
                  <button
                    onClick={handleManualRefresh}
                    className="kid-btn kid-btn-outline flex items-center justify-center gap-2"
                  >
                    <Mail className="h-4 w-4" /> Refresh
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Main Actions Grid - Improved sizing and spacing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            
            {/* Start Writing Card - Reduced size, clearer language */}
            <div
              onClick={handleStartWriting}
              className="kid-card kid-card-interactive relative bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer overflow-hidden group"
            >
              <div className="absolute inset-0 bg-black opacity-10 rounded-2xl"></div>
              <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 rounded-full bg-blue-400 opacity-20 group-hover:scale-125 transition-transform"></div>
              <div className="absolute bottom-0 left-0 -ml-6 -mb-6 w-20 h-20 rounded-full bg-purple-400 opacity-20 group-hover:scale-125 transition-transform"></div>
              
              <div className="flex items-center mb-4 relative z-10">
                <div className="p-3 bg-white/20 rounded-full mr-3 shadow-md">
                  <PenTool className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">Start Writing</h2>
              </div>
              
              <p className="text-blue-100 text-base mb-4 relative z-10">
                Ready to write? Pick a story type and get started!
              </p>
              
              <div className="flex items-center text-white font-semibold relative z-10">
                <span>Let's Go</span>
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Practice Exam Card - Reduced size, clearer language */}
            <div
              onClick={handlePracticeExam}
              className="kid-card kid-card-interactive relative bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer overflow-hidden group"
            >
              <div className="absolute inset-0 bg-black opacity-10 rounded-2xl"></div>
              <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 rounded-full bg-green-400 opacity-20 group-hover:scale-125 transition-transform"></div>
              <div className="absolute bottom-0 left-0 -ml-6 -mb-6 w-20 h-20 rounded-full bg-teal-400 opacity-20 group-hover:scale-125 transition-transform"></div>
              
              <div className="flex items-center mb-4 relative z-10">
                <div className="p-3 bg-white/20 rounded-full mr-3 shadow-md">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">Practice Test</h2>
              </div>
              
              <p className="text-green-100 text-base mb-4 relative z-10">
                Practice writing like it's a real test. Get ready to ace it!
              </p>
              
              <div className="flex items-center text-white font-semibold relative z-10">
                <span>Start Practice</span>
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* Quick Tools Section - Simplified with smaller icons */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" /> Quick Tools
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              
              <button
                onClick={() => onNavigate('progress')}
                className="kid-card kid-card-interactive p-4 text-center hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-800 dark:text-white text-sm">My Progress</h3>
                <p className="text-gray-600 dark:text-gray-400 text-xs">See how you're doing</p>
              </button>

              <button
                onClick={() => onNavigate('learning')}
                className="kid-card kid-card-interactive p-4 text-center hover:bg-green-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <BookOpen className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-800 dark:text-white text-sm">Learn</h3>
                <p className="text-gray-600 dark:text-gray-400 text-xs">Writing tips & tricks</p>
              </button>

              <button
                onClick={() => onNavigate('help')}
                className="kid-card kid-card-interactive p-4 text-center hover:bg-purple-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <HelpCircle className="h-5 w-5 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-800 dark:text-white text-sm">Help</h3>
                <p className="text-gray-600 dark:text-gray-400 text-xs">Need assistance?</p>
              </button>

              <button
                onClick={() => onNavigate('achievements')}
                className="kid-card kid-card-interactive p-4 text-center hover:bg-yellow-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Trophy className="h-5 w-5 text-yellow-600" />
                </div>
                <h3 className="font-semibold text-gray-800 dark:text-white text-sm">Achievements</h3>
                <p className="text-gray-600 dark:text-gray-400 text-xs">Your awards</p>
              </button>
            </div>
          </div>

          {/* Recent Activity - Simplified */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-600" /> What's New?
            </h2>
            <div className="space-y-3">
              <div className="flex items-center p-3 bg-white dark:bg-gray-700 rounded-xl shadow-sm">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <Star className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800 dark:text-white text-sm">New writing prompts added!</p>
                  <p className="text-gray-600 dark:text-gray-400 text-xs">Check out the latest story ideas</p>
                </div>
              </div>
              
              <div className="flex items-center p-3 bg-white dark:bg-gray-700 rounded-xl shadow-sm">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <Gift className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800 dark:text-white text-sm">Writing buddy got smarter!</p>
                  <p className="text-gray-600 dark:text-gray-400 text-xs">Better help with your stories</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showWritingTypeModal && (
        <ImprovedWritingTypeSelectionModal
          isOpen={showWritingTypeModal}
          onClose={() => setShowWritingTypeModal(false)}
          onSelect={handleWritingTypeSelect}
        />
      )}

      {showPromptOptionsModal && (
        <PromptOptionsModal
          isOpen={showPromptOptionsModal}
          onClose={() => setShowPromptOptionsModal(false)}
          onGeneratePrompt={handleGeneratePrompt}
          onCustomPrompt={handleCustomPrompt}
          writingType={selectedWritingType}
          isGenerating={isGeneratingPrompt}
        />
      )}
    </div>
  );
}
