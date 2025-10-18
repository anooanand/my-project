import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isEmailVerified, hasAnyAccess, getUserAccessStatus } from '../lib/supabase';
import { WritingTypeSelectionModal } from './WritingTypeSelectionModal';
import { PromptOptionsModal } from './PromptOptionsModal';
import { CustomPromptModal } from './CustomPromptModal';
import { generatePrompt } from '../lib/openai';
import { Mail, CheckCircle, Clock, FileText, PenTool, BarChart3, Settings, X, Star, BookOpen, Zap, Heart, Trophy, Sparkles, Smile, Target, Gift, Flame, TrendingUp, Award, Rocket, Crown, Gem, Wand2, Palette, Music, Camera, Gamepad2, HelpCircle, ArrowRight, Play, Calendar, Users, ChevronRight, Activity, BookMarked, CreditCard, Edit3, Timer, Brain, Lightbulb } from 'lucide-react';

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
        descriptive: "Describe a place, object, or person in vivid detail, using sensory language to create a strong impression on the reader. Focus on showing, not telling, and use figurative language to make your descriptions more engaging. Aim to transport your reader to the scene you are describing.",
        argumentative: "Take a clear stance on a controversial issue and construct a well-reasoned argument to support your position. Anticipate counterarguments and address them effectively. Use credible evidence and logical reasoning to persuade your audience.",
        analytical: "Choose a piece of literature, a historical event, or a scientific concept and analyze its various components. Break down the subject into smaller parts, examine their relationships, and explain their significance. Provide a clear thesis and support it with textual evidence or factual information.",
        informational: "Explain a complex process, concept, or event in a clear and concise manner. Assume your audience has little to no prior knowledge of the topic. Use headings, bullet points, and examples to make the information accessible and easy to understand.",
        comparecontrast: "Select two subjects and compare and contrast them based on specific criteria. Highlight both their similarities and differences, and provide a clear purpose for your comparison. Organize your essay using either a point-by-point or subject-by-subject approach.",
        causeeffect: "Analyze the causes and/or effects of a particular event, decision, or phenomenon. Clearly identify the causal relationships and support your claims with evidence. Consider both immediate and long-term consequences.",
        processanalysis: "Explain how to do something or how something works, step-by-step. Ensure each step is clear, logical, and easy to follow. Use transitional words and phrases to guide the reader through the process.",
        definition: "Provide a comprehensive definition of a complex term or concept. Go beyond a simple dictionary definition by exploring its nuances, historical context, and various interpretations. Use examples to illustrate your points.",
        literaryanalysis: "Analyze a specific literary element (e.g., theme, character, symbolism) in a given text. Develop a thesis statement and support it with textual evidence, explaining how the element contributes to the overall meaning or effect of the work.",
        research: "Formulate a research question on a topic of interest and conduct thorough research using credible sources. Present your findings in a clear, organized manner, citing all sources properly. Focus on synthesizing information and drawing informed conclusions.",
        journalistic: "Write a news report on a recent event, adhering to journalistic principles of objectivity, accuracy, and conciseness. Include a compelling headline, lead paragraph, and body paragraphs that provide essential details (who, what, when, where, why, how)."
      };

      const fallbackPrompt = fallbackPrompts[selectedWritingType as keyof typeof fallbackPrompts] || "Write a compelling piece on a topic of your choice.";
      localStorage.setItem("generatedPrompt", fallbackPrompt);
      localStorage.setItem("generatedPromptTimestamp", new Date().toISOString());
      localStorage.setItem('selectedWritingType', selectedWritingType);
      localStorage.setItem("promptType", "generated");
      navigate("/writing");
      setShowPromptOptionsModal(false);
      console.log('✅ Dashboard: Fallback prompt used and navigation to /writing initiated');
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  // FIXED: Step 3 - Handle custom prompt submission
  const handleCustomPromptSubmit = (customPromptText: string) => {
    console.log('✍️ Dashboard: Custom prompt submitted:', customPromptText);

    // CRITICAL: Clear generated prompt and save custom prompt with timestamp
    localStorage.removeItem("generatedPrompt");
    localStorage.removeItem("generatedPromptTimestamp");
    localStorage.setItem("customPrompt", customPromptText);
    localStorage.setItem("customPromptTimestamp", new Date().toISOString());
    localStorage.setItem('selectedWritingType', selectedWritingType); // Keep selected writing type
    localStorage.setItem("promptType", "custom");

    console.log('✅ Custom prompt saved to localStorage with timestamp');

    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('promptGenerated', {
      detail: { prompt: customPromptText, textType: selectedWritingType, timestamp: new Date().toISOString() }
    }));

    // Navigate to writing area
    navigate("/writing");
    setShowCustomPromptModal(false);
    setShowPromptOptionsModal(false);
    console.log('✅ Dashboard: Navigation to /writing initiated with custom prompt');
  };


  const handleOpenCustomPromptModal = () => {
    setShowPromptOptionsModal(false); // Close prompt options modal
    setShowCustomPromptModal(true); // Open custom prompt modal
  };

  const handleCloseCustomPromptModal = () => {
    setShowCustomPromptModal(false);
    setShowPromptOptionsModal(true); // Re-open prompt options modal if needed
  };

  const handleClosePromptOptionsModal = () => {
    setShowPromptOptionsModal(false);
    setShowWritingTypeModal(true); // Go back to writing type selection if user closes prompt options
  };

  const handleCloseWritingTypeModal = () => {
    setShowWritingTypeModal(false);
    // Optionally, navigate back to dashboard or do nothing if user cancels
  };

  // Check if user is logged in, if not, redirect to auth page
  useEffect(() => {
    if (!currentUser && !propUser) {
      console.log('🚫 Dashboard: No current user, redirecting to auth.');
      navigate('/auth');
    }
  }, [currentUser, propUser, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-slate-700 dark:text-slate-300 text-lg font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isVerified) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-8 max-w-md w-full text-center">
          <div className="flex justify-center mb-6">
            <Mail className="h-16 w-16 text-blue-500" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Verify Your Email</h2>
          <p className="text-lg mb-6">To unlock all features, please verify your email address. A verification link has been sent to <strong>{currentUser?.email}</strong>.</p>
          <p className="text-md mb-8">If you don't see it, please check your spam folder or click the button below to resend.</p>
          <button
            onClick={handleManualRefresh}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            Resend Verification Email / Refresh Status
          </button>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">Having trouble? Contact support.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col items-center p-4 sm:p-6 lg:p-8 relative">
      {showWelcomeMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-lg w-full text-center relative animate-fade-in-up">
            <button onClick={handleDismissWelcome} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"><X size={24} /></button>
            <Sparkles className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Welcome, {getUserName()}!</h2>
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">We're thrilled to have you join the AI Writing Coach community. Get ready to elevate your writing!</p>
            <button
              onClick={() => { handleDismissWelcome(); setShowStartHereGuide(true); }}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3 px-6 rounded-full text-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-lg"
            >
              Start Your First Writing Session <ArrowRight className="inline-block ml-2" size={20} />
            </button>
          </div>
        </div>
      )}

      {showStartHereGuide && !showWelcomeMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-lg w-full text-center relative animate-fade-in-up">
            <button onClick={handleDismissGuide} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"><X size={24} /></button>
            <BookOpen className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Ready to Begin?</h2>
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">Follow these simple steps to start your writing journey:</p>
            <ul className="text-left text-gray-700 dark:text-gray-300 mb-8 space-y-3 text-base mx-auto max-w-xs">
              <li className="flex items-center"><CheckCircle className="text-green-500 mr-2" size={20} /> Choose your writing type</li>
              <li className="flex items-center"><CheckCircle className="text-green-500 mr-2" size={20} /> Generate or create a prompt</li>
              <li className="flex items-center"><CheckCircle className="text-green-500 mr-2" size={20} /> Start writing and get instant feedback!</li>
            </ul>
            <button
              onClick={() => { handleDismissGuide(); handleStartWriting(); }}
              className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white font-bold py-3 px-6 rounded-full text-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-lg"
            >
              Let's Write! <Play className="inline-block ml-2" size={20} />
            </button>
          </div>
        </div>
      )}

      <div className="w-full max-w-6xl">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-8 text-center">Your Creative Hub</h1>

        {/* Quick Actions Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div
              onClick={handleStartWriting}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
                <PenTool className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Start New Writing</h3>
              <p className="text-gray-600 dark:text-gray-400">Begin a new essay or story with AI guidance.</p>
            </div>

            <div
              onClick={() => navigate('/writing-studio')}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">My Writing Studio</h3>
              <p className="text-gray-600 dark:text-gray-400">Access all your saved drafts and projects.</p>
            </div>

            <div
              onClick={() => navigate('/progress')}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center mb-4">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">View Progress</h3>
              <p className="text-gray-600 dark:text-gray-400">Track your improvement and skill development.</p>
            </div>
          </div>
        </section>

        {/* Features Overview Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">Unlock Your Potential</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
            {/* Feature 1 */}
            <div className="flex items-start p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
              <div className="flex-shrink-0 w-12 h-12 bg-purple-100 dark:bg-purple-800 rounded-full flex items-center justify-center mr-4">
                <Brain className="h-6 w-6 text-purple-600 dark:text-purple-300" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">AI-Powered Feedback</h3>
                <p className="text-gray-700 dark:text-gray-300">Receive instant, intelligent suggestions to refine your writing style, grammar, and structure.</p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-start p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mr-4">
                <Lightbulb className="h-6 w-6 text-blue-600 dark:text-blue-300" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Dynamic Prompt Generation</h3>
                <p className="text-gray-700 dark:text-gray-300">Never face writer's block again with prompts tailored to your chosen writing type.</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-start p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
              <div className="flex-shrink-0 w-12 h-12 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mr-4">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-300" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Progress Tracking</h3>
                <p className="text-gray-700 dark:text-gray-300">Monitor your improvement over time with detailed analytics and insights into your writing skills.</p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="flex items-start p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
              <div className="flex-shrink-0 w-12 h-12 bg-red-100 dark:bg-red-800 rounded-full flex items-center justify-center mr-4">
                <BookMarked className="h-6 w-6 text-red-600 dark:text-red-300" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Learning Hub</h3>
                <p className="text-gray-700 dark:text-gray-300">Access a rich library of writing guides, tutorials, and exercises to hone your craft.</p>
              </div>
            </div>
          </div>
        </section>

        {/* User Stats/Achievements (Placeholder) */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">Your Journey So Far</h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
            <p className="text-gray-700 dark:text-gray-300 text-lg">No stats available yet. Start writing to see your progress here!</p>
            {/* Future: Add charts, badges, and summaries here */}
          </div>
        </section>

        {/* Testimonials or Call to Action (Placeholder) */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">What Our Users Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 relative">
              <Quote className="absolute top-4 left-4 h-8 w-8 text-gray-200 dark:text-gray-700" />
              <p className="text-gray-700 dark:text-gray-300 italic mb-4">"The AI feedback is incredibly insightful. My writing has improved dramatically!"</p>
              <p className="font-semibold text-gray-900 dark:text-white">- Happy Writer</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 relative">
              <Quote className="absolute top-4 left-4 h-8 w-8 text-gray-200 dark:text-gray-700" />
              <p className="text-gray-700 dark:text-gray-300 italic mb-4">"No more writer's block! The prompts are fantastic and always spark my creativity."</p>
              <p className="font-semibold text-gray-900 dark:text-white">- Creative User</p>
            </div>
          </div>
        </section>

        {/* Call to Action for Advanced Features (Placeholder) */}
        {accessType === 'temporary' && (
          <section className="mb-12 text-center">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200 rounded-xl p-6 shadow-md">
              <h2 className="text-2xl font-bold mb-3">Temporary Access Active</h2>
              <p className="text-lg mb-4">You currently have temporary access until {tempAccessUntil ? new Date(tempAccessUntil).toLocaleDateString() : 'an unknown date'}.</p>
              <p className="mb-6">Upgrade to a permanent plan to unlock unlimited access and all premium features!</p>
              <button
                onClick={() => navigate('/pricing')}
                className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-6 rounded-full text-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-lg"
              >
                Upgrade Now <CreditCard className="inline-block ml-2" size={20} />
              </button>
            </div>
          </section>
        )}

        {/* Support Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">Need Help?</h2>
          <div className="flex flex-col md:flex-row justify-center gap-6">
            <div
              onClick={() => navigate('/help')}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col items-center text-center cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex-1"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center mb-4">
                <HelpCircle className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Visit Help Center</h3>
              <p className="text-gray-600 dark:text-gray-400">Find answers to common questions and tutorials.</p>
            </div>
            <div
              onClick={() => navigate('/settings')}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col items-center text-center cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex-1"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-pink-600 rounded-full flex items-center justify-center mb-4">
                <Settings className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Account Settings</h3>
              <p className="text-gray-600 dark:text-gray-400">Manage your profile, subscription, and preferences.</p>
            </div>
          </div>
        </section>

        {/* Modals */}
        <WritingTypeSelectionModal
          isOpen={showWritingTypeModal}
          onClose={handleCloseWritingTypeModal}
          onSelectWritingType={handleWritingTypeSelect}
        />

        <PromptOptionsModal
          isOpen={showPromptOptionsModal}
          onClose={handleClosePromptOptionsModal}
          onGeneratePrompt={handleGeneratePrompt}
          onOpenCustomPrompt={handleOpenCustomPromptModal}
          isGeneratingPrompt={isGeneratingPrompt}
        />

        <CustomPromptModal
          isOpen={showCustomPromptModal}
          onClose={handleCloseCustomPromptModal}
          onSubmitCustomPrompt={handleCustomPromptSubmit}
        />

      </div>
    </div>
  );
}
