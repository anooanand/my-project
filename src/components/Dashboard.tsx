import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isEmailVerified, hasAnyAccess, getUserAccessStatus } from '../lib/supabase';
import { WritingTypeSelectionModal } from './WritingTypeSelectionModal';
import { PromptOptionsModal } from './PromptOptionsModal';
import { CustomPromptModal } from './CustomPromptModal';
import { generatePrompt } from '../lib/openai';
import { Mail, CheckCircle, Clock, FileText, PenTool, BarChart3, Settings, X, Star, BookOpen, Zap, Heart, Trophy, Sparkles, Smile, Target, Gift, Flame, TrendingUp, Award, Rocket, Crown, Gem, Wand2, Palette, Music, Camera, Gamepad2, HelpCircle, ArrowRight, Play, Calendar, Users, ChevronRight, Activity, BookMarked, CreditCard, Timer, Brain, Lightbulb } from 'lucide-react';

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
  const [showStartHereGuide, setShowStartHereGuide] = useState(false);

  // Modal states for proper sequence
  const [showWritingTypeModal, setShowWritingTypeModal] = useState(false);
  const [showPromptOptionsModal, setShowPromptOptionsModal] = useState(false);
  const [showCustomPromptModal, setShowCustomPromptModal] = useState(false);
  const [selectedWritingType, setSelectedWritingType] = useState<string>('');
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);

  // Use prop user if provided, otherwise use context user
  const currentUser = propUser || user;
  
  // FIXED: Define paymentCompleted based on userAccessData
  const paymentCompleted = userAccessData?.payment_verified || userAccessData?.manual_override || userAccessData?.has_access || propPaymentCompleted || false;

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

  // FIXED: Step 3 - Handle prompt generation with timestamp, then navigate to writing area
  const handleGeneratePrompt = async () => {
    console.log('🎯 Dashboard: Generating prompt for:', selectedWritingType);
    setIsGeneratingPrompt(true);

    try {
      // Call the OpenAI prompt generation function
      const prompt = await generatePrompt(selectedWritingType);

      if (prompt) {
        console.log('✅ Prompt generated successfully:', prompt);

        // CRITICAL: Clear custom prompt and save generated prompt with timestamp
        localStorage.removeItem("customPrompt");
        localStorage.removeItem("customPromptTimestamp");
        localStorage.setItem("generatedPrompt", prompt);
        localStorage.setItem("generatedPromptTimestamp", new Date().toISOString());
        localStorage.setItem('selectedWritingType', selectedWritingType);
        localStorage.setItem("promptType", "generated");

        console.log('✅ Prompt saved to localStorage with timestamp');

        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('promptGenerated', {
          detail: { prompt, textType: selectedWritingType, timestamp: new Date().toISOString() }
        }));

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
        // Add more fallback prompts for other text types as needed
      };

      const fallbackPrompt = fallbackPrompts[selectedWritingType as keyof typeof fallbackPrompts] || fallbackPrompts.narrative;

      console.log('⚠️ Using fallback prompt:', fallbackPrompt);

      // Save fallback prompt with timestamp
      localStorage.removeItem("customPrompt");
      localStorage.removeItem("customPromptTimestamp");
      localStorage.setItem("generatedPrompt", fallbackPrompt);
      localStorage.setItem("generatedPromptTimestamp", new Date().toISOString());
      localStorage.setItem('selectedWritingType', selectedWritingType);
      localStorage.setItem("promptType", "generated");

      // Dispatch event with fallback prompt
      window.dispatchEvent(new CustomEvent('promptGenerated', {
        detail: { prompt: fallbackPrompt, textType: selectedWritingType, timestamp: new Date().toISOString() }
      }));

      // Small delay to ensure localStorage is written
      await new Promise(resolve => setTimeout(resolve, 200));

      // Navigate to writing area
      navigate("/writing");
      setShowPromptOptionsModal(false);
      console.log('✅ Dashboard: Navigation to /writing initiated with fallback prompt');

    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  // FIXED: Step 4 - Handle custom prompt selection
  const handleCustomPrompt = () => {
    console.log('✏️ Dashboard: User selected custom prompt option');
    setShowPromptOptionsModal(false);
    setShowCustomPromptModal(true);
  };

  // FIXED: Step 5 - Handle custom prompt submission
  const handleCustomPromptSubmit = (customPrompt: string) => {
    console.log('📝 Dashboard: Custom prompt submitted:', customPrompt);

    // CRITICAL: Clear generated prompt and save custom prompt with timestamp
    localStorage.removeItem("generatedPrompt");
    localStorage.removeItem("generatedPromptTimestamp");
    localStorage.setItem("customPrompt", customPrompt);
    localStorage.setItem("customPromptTimestamp", new Date().toISOString());
    localStorage.setItem('selectedWritingType', selectedWritingType);
    localStorage.setItem("promptType", "custom");

    console.log('✅ Custom prompt saved to localStorage with timestamp');

    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('customPromptSubmitted', {
      detail: { prompt: customPrompt, textType: selectedWritingType, timestamp: new Date().toISOString() }
    }));

    // Close modal and navigate to writing area
    setShowCustomPromptModal(false);
    navigate("/writing");
    console.log('✅ Dashboard: Navigation to /writing initiated with custom prompt');
  };

  const getFormattedDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeRemaining = (dateString: string) => {
    const now = new Date();
    const target = new Date(dateString);
    const diff = target.getTime() - now.getTime();

    if (diff <= 0) return 'Expired';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
      return `${days} day${days !== 1 ? 's' : ''} ${hours} hour${hours !== 1 ? 's' : ''} remaining`;
    } else {
      return `${hours} hour${hours !== 1 ? 's' : ''} remaining`;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 dark:border-indigo-400 mb-4"></div>
          <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Welcome Message */}
      {showWelcomeMessage && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full p-8 relative animate-scale-in">
            <button
              onClick={handleDismissWelcome}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-full mb-4">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                🎉 Welcome to Writing Buddy!
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                You're all set, {getUserName()}! Your account is verified and ready to go.
              </p>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <Sparkles className="w-6 h-6 mr-2 text-yellow-500" />
                What You Can Do Now:
              </h3>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Start writing with AI-powered assistance</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Track your progress and achievements</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Access writing guides and resources</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Generate creative writing prompts</span>
                </li>
              </ul>
            </div>

            <button
              onClick={handleDismissWelcome}
              className="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-green-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Let's Get Started! 🚀
            </button>
          </div>
        </div>
      )}

      {/* Start Here Guide */}
      {showStartHereGuide && !showWelcomeMessage && (
        <div className="fixed bottom-8 right-8 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md p-6 z-40 animate-slide-in-right border-2 border-indigo-500">
          <button
            onClick={handleDismissGuide}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-start mb-4">
            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mr-4">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                👋 Start Here!
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                Click the <strong>"Start Writing"</strong> button below to begin your first writing session!
              </p>
              <div className="flex items-center text-indigo-600 dark:text-indigo-400 text-sm font-medium">
                <ArrowRight className="w-4 h-4 mr-1 animate-bounce-horizontal" />
                Look for the purple button
              </div>
            </div>
          </div>
          
          <button
            onClick={handleDismissGuide}
            className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium py-2 px-4 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
          >
            Got it!
          </button>
        </div>
      )}

      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-lg sticky top-0 z-30 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <PenTool className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                    Writing Buddy
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Your AI Writing Assistant</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-full">
                <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{getUserName().charAt(0).toUpperCase()}</span>
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {getUserName()}
                </span>
              </div>
              <button
                onClick={onSignOut}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <Settings className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <h2 className="text-5xl font-extrabold text-gray-900 dark:text-white mb-4">
            Welcome Back, <span className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">{getUserName()}</span>! 👋
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Ready to create something amazing today?
          </p>
          <button
            onClick={handleStartWriting}
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105"
          >
            <Play className="w-6 h-6 mr-2" />
            Start Writing
          </button>
        </section>

        {/* Quick Stats */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl font-bold text-gray-900 dark:text-white">0</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Essays Written</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Start your first essay today!</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl font-bold text-gray-900 dark:text-white">0</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Achievements</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Unlock badges as you write!</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl font-bold text-gray-900 dark:text-white">0</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Day Streak</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Write daily to build your streak!</p>
          </div>
        </section>

        {/* Features Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-200 hover:-translate-y-1">
            <div className="flex items-center mb-4">
              <Brain className="w-8 h-8 text-purple-500 mr-3" />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">AI Writing Coach</h3>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-5">
              Get real-time feedback and suggestions to improve your writing skills.
            </p>
            <button
              onClick={handleStartWriting}
              className="text-purple-600 dark:text-purple-400 font-semibold flex items-center group"
            >
              Start Writing <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-200 hover:-translate-y-1">
            <div className="flex items-center mb-4">
              <BarChart3 className="w-8 h-8 text-blue-500 mr-3" />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Progress Tracking</h3>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-5">
              Monitor your improvement and celebrate your achievements along the way.
            </p>
            <button
              onClick={() => navigate('/progress')}
              className="text-blue-600 dark:text-blue-400 font-semibold flex items-center group"
            >
              View Progress <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-200 hover:-translate-y-1">
            <div className="flex items-center mb-4">
              <Wand2 className="w-8 h-8 text-green-500 mr-3" />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Prompt Generator</h3>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-5">
              Spark your creativity with unique and engaging writing prompts tailored to your needs.
            </p>
            <button
              onClick={handleStartWriting}
              className="text-green-600 dark:text-green-400 font-semibold flex items-center group"
            >
              Generate Prompt <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </section>

        {/* Access Status Section */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-12 border border-gray-200 dark:border-gray-700">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <CreditCard className="w-7 h-7 mr-3 text-indigo-500" /> Your Access Status
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm">
              <CheckCircle className={`w-6 h-6 mr-3 ${isVerified ? 'text-green-500' : 'text-red-500'}`} />
              <div>
                <p className="text-lg font-medium text-gray-800 dark:text-gray-200">Email Verification:</p>
                <p className={`text-md ${isVerified ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {isVerified ? 'Verified' : 'Not Verified'}              </p>
              </div>
            </div>
            <div className="flex items-center bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm">
              <Zap className={`w-6 h-6 mr-3 ${paymentCompleted ? 'text-green-500' : 'text-yellow-500'}`} />
              <div>
                <p className="text-lg font-medium text-gray-800 dark:text-gray-200">Subscription Status:</p>
                <p className={`text-md ${paymentCompleted ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                  {paymentCompleted ? 'Active' : 'Free Tier / Expired'}
                </p>
              </div>
            </div>
            {accessType === 'temporary' && tempAccessUntil && (
              <div className="flex items-center bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-lg shadow-sm col-span-full">
                <Clock className="w-6 h-6 mr-3 text-yellow-600 dark:text-yellow-400" />
                <div>
                  <p className="text-lg font-medium text-yellow-800 dark:text-yellow-200">Temporary Access:</p>
                  <p className="text-md text-yellow-700 dark:text-yellow-300">
                    You have temporary access until {getFormattedDate(tempAccessUntil)} ({getTimeRemaining(tempAccessUntil)}).
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="mt-6 text-center">
            <button
              onClick={handleManualRefresh}
              className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center justify-center mx-auto"
            >
              <Activity className="w-5 h-5 mr-2" /> Refresh Status
            </button>
          </div>
        </section>

        {/* Quick Links / Resources */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <BookMarked className="w-7 h-7 mr-3 text-teal-500" /> Quick Links & Resources
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <a href="#" className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition duration-200 group">
              <FileText className="w-6 h-6 mr-3 text-teal-500 group-hover:text-teal-600" />
              <span className="text-lg font-medium text-gray-800 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white">Writing Guides</span>
            </a>
            <a href="#" className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition duration-200 group">
              <Users className="w-6 h-6 mr-3 text-teal-500 group-hover:text-teal-600" />
              <span className="text-lg font-medium text-gray-800 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white">Community Forum</span>
            </a>
            <a href="#" className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition duration-200 group">
              <HelpCircle className="w-6 h-6 mr-3 text-teal-500 group-hover:text-teal-600" />
              <span className="text-lg font-medium text-gray-800 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white">Support & FAQ</span>
            </a>
          </div>
        </section>
      </main>

      {/* Modals */}
      {showWritingTypeModal && (
        <WritingTypeSelectionModal
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
          selectedWritingType={selectedWritingType}
          loading={isGeneratingPrompt}
        />
      )}

      {showCustomPromptModal && (
        <CustomPromptModal
          isOpen={showCustomPromptModal}
          onClose={() => setShowCustomPromptModal(false)}
          onSubmit={handleCustomPromptSubmit}
          writingType={selectedWritingType}
        />
      )}
    </div>
  );
}