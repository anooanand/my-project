import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isEmailVerified, hasAnyAccess, getUserAccessStatus } from '../lib/supabase';
import { WritingTypeSelectionModal } from './WritingTypeSelectionModal';
import { PromptOptionsModal } from './PromptOptionsModal';
import { CustomPromptModal } from './CustomPromptModal';
import { generatePrompt } from '../lib/openai';
import { Mail, CheckCircle, Clock, FileText, PenTool, BarChart3, Settings, X, Star, BookOpen, Zap, Heart, Trophy, Sparkles, Smile, Target, Gift, Flame, TrendingUp, Award, Rocket, Crown, Gem, Wand2, Palette, Music, Camera, Gamepad2, HelpCircle, ArrowRight, Play, Calendar, Users, ChevronRight, Activity, BookMarked, CreditCard as Edit3, Timer, Brain, Lightbulb } from 'lucide-react';

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

  // FIXED: Step 3 - Handle custom prompt with timestamp, then navigate to writing area
  const handleCustomPrompt = () => {
    console.log('✏️ Dashboard: Using custom prompt for:', selectedWritingType);

    // Store the prompt type
    localStorage.setItem('promptType', 'custom');
    localStorage.setItem('selectedWritingType', selectedWritingType);

    // Close prompt options modal and show custom prompt modal
    setShowPromptOptionsModal(false);
    setShowCustomPromptModal(true);
  };

  // Handle custom prompt submission and navigate to writing area
  const handleCustomPromptSubmit = async (prompt: string) => {
    setIsGeneratingPrompt(true);
    console.log("✏️ Dashboard: Custom prompt submitted:", prompt.substring(0, 50) + "...");

    try {
      // CRITICAL: Clear generated prompt and save custom prompt with timestamp
      localStorage.removeItem("generatedPrompt");
      localStorage.removeItem("generatedPromptTimestamp");
      localStorage.setItem("customPrompt", prompt);
      localStorage.setItem("customPromptTimestamp", new Date().toISOString());
      localStorage.setItem("promptType", "custom");
      localStorage.setItem("selectedWritingType", selectedWritingType);

      console.log("✅ Dashboard: Custom prompt saved to localStorage with timestamp");

      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent("promptGenerated", {
        detail: { prompt, textType: selectedWritingType, timestamp: new Date().toISOString() }
      }));

      // Small delay to ensure localStorage is written
      await new Promise(resolve => setTimeout(resolve, 200));

      // Navigate to writing area AFTER prompt is saved
      navigate("/writing");
      setShowCustomPromptModal(false);

    } catch (error) {
      console.error("❌ Error handling custom prompt:", error);
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const getFormattedDate = (dateString: string) => {
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-indigo-400 rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <div className="space-y-2">
            <p className="text-slate-700 text-lg font-medium">Loading your dashboard...</p>
            <p className="text-slate-500 text-sm">Preparing your writing journey</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative">

      {/* Welcome Message Modal - Modern Design */}
      {showWelcomeMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-lg w-full border-4 border-blue-300 dark:border-blue-700 animate-fade-in-up">
            <div className="bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 p-6 border-b-4 border-blue-300 dark:border-blue-700 rounded-t-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Zap className="w-8 h-8 text-blue-600 dark:text-blue-400 mr-3" />
                  <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                    Welcome, {getUserName()}!
                  </h2>
                </div>
                <button
                  onClick={handleDismissWelcome}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors bg-white dark:bg-gray-700 p-2 rounded-full shadow-md hover:shadow-lg transform hover:scale-110 transition-all duration-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-lg text-gray-700 dark:text-gray-300">
                We're thrilled to have you join the Writing Buddy community! Get ready to elevate your writing with our AI-powered tools.
              </p>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-800 dark:text-gray-200">
                To get started, we recommend exploring the features below. You can always find this guide again in the settings.
              </p>
              <button
                onClick={() => { handleDismissWelcome(); handleStartWriting(); }}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-xl text-lg font-semibold shadow-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300"
              >
                Start Your First Writing Session <ArrowRight className="inline-block ml-2 w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Start Here Guide Modal */}
      {showStartHereGuide && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-2xl w-full border-4 border-green-300 dark:border-green-700 animate-fade-in-up">
            <div className="bg-gradient-to-r from-green-100 to-teal-100 dark:from-green-900/30 dark:to-teal-900/30 p-6 border-b-4 border-green-300 dark:border-green-700 rounded-t-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <BookOpen className="w-8 h-8 text-green-600 dark:text-green-400 mr-3" />
                  <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-teal-600 dark:from-green-400 dark:to-teal-400">
                    Your Quick Start Guide
                  </h2>
                </div>
                <button
                  onClick={handleDismissGuide}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors bg-white dark:bg-gray-700 p-2 rounded-full shadow-md hover:shadow-lg transform hover:scale-110 transition-all duration-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-lg text-gray-700 dark:text-gray-300">
                New to Writing Buddy? Here's how to make the most of your experience!
              </p>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 p-3 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                  <PenTool className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">1. Start a New Writing Session</h3>
                  <p className="text-gray-700 dark:text-gray-300">Click the "Start Writing" button to choose your writing type and generate a prompt.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 p-3 bg-purple-100 dark:bg-purple-900/50 rounded-full">
                  <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">2. Get Instant Feedback</h3>
                  <p className="text-gray-700 dark:text-gray-300">As you write, our AI will provide real-time suggestions and improvements.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 p-3 bg-yellow-100 dark:bg-yellow-900/50 rounded-full">
                  <Trophy className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">3. Track Your Progress</h3>
                  <p className="text-gray-700 dark:text-gray-300">Monitor your writing growth and skill development in your personalized dashboard.</p>
                </div>
              </div>

              <button
                onClick={handleDismissGuide}
                className="w-full bg-gradient-to-r from-green-500 to-teal-600 text-white py-3 px-6 rounded-xl text-lg font-semibold shadow-lg hover:from-green-600 hover:to-teal-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300"
              >
                Got It! Let's Write! <Sparkles className="inline-block ml-2 w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Dashboard Content */}
      <header className="relative bg-gradient-to-r from-blue-600 to-purple-700 text-white py-16 px-4 sm:px-6 lg:px-8 shadow-xl overflow-hidden">
        <div className="absolute inset-0 w-full h-full" style={{ backgroundImage: 'url("https://assets.website-files.com/645b2067215383a887009e46/645b206721538340d0009e86_Group%201736.svg")' , backgroundPosition: 'center', backgroundSize: 'cover', opacity: 0.1 }}></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-4 leading-tight">
            Hello, {getUserName()}!
          </h1>
          <p className="text-xl sm:text-2xl font-light opacity-90 max-w-2xl">
            Your personalized hub for writing growth and creative exploration.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <button
              onClick={handleStartWriting}
              className="bg-white text-blue-600 px-8 py-3 rounded-full text-lg font-bold shadow-lg hover:bg-blue-50 hover:text-blue-700 transition duration-300 transform hover:scale-105 flex items-center justify-center"
            >
              <PenTool className="w-5 h-5 mr-2" /> Start New Writing
            </button>
            <button
              onClick={() => navigate('/progress')}
              className="bg-blue-500 text-white px-8 py-3 rounded-full text-lg font-bold shadow-lg hover:bg-blue-600 transition duration-300 transform hover:scale-105 flex items-center justify-center"
            >
              <BarChart3 className="w-5 h-5 mr-2" /> View Progress
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {/* Feature Card 1: AI Writing Coach */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 transform hover:scale-105 transition-transform duration-300 border-t-4 border-blue-500">
            <div className="flex items-center mb-4">
              <Lightbulb className="w-8 h-8 text-blue-500 mr-3" />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">AI Writing Coach</h3>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-5">
              Get instant, intelligent feedback on your grammar, style, and structure.
            </p>
            <button
              onClick={handleStartWriting}
              className="text-blue-600 dark:text-blue-400 font-semibold flex items-center group"
            >
              Start Coaching <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Feature Card 2: Progress Tracking */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 transform hover:scale-105 transition-transform duration-300 border-t-4 border-purple-500">
            <div className="flex items-center mb-4">
              <TrendingUp className="w-8 h-8 text-purple-500 mr-3" />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Progress Tracking</h3>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-5">
              Visualize your improvement over time with detailed analytics and insights.
            </p>
            <button
              onClick={() => navigate('/progress')}
              className="text-purple-600 dark:text-purple-400 font-semibold flex items-center group"
            >
              View Analytics <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Feature Card 3: Prompt Generator */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 transform hover:scale-105 transition-transform duration-300 border-t-4 border-green-500">
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
            <Edit3 className="w-7 h-7 mr-3 text-indigo-500" /> Your Access Status
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm">
              <CheckCircle className={`w-6 h-6 mr-3 ${isVerified ? 'text-green-500' : 'text-red-500'}`} />
              <div>
                <p className="text-lg font-medium text-gray-800 dark:text-gray-200">Email Verification:</p>
                <p className={`text-md ${isVerified ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {emailVerified ? 'Verified' : 'Not Verified'}
                </p>
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