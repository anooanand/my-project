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

  // FIXED: Direct navigation to writing interface - NO MORE BROKEN MODALS!
  const handleStartWriting = () => {
    console.log('🚀 Dashboard: Starting writing flow...');
    
    try {
      // Clear any existing navigation data to ensure fresh start
      localStorage.removeItem('selectedWritingType');
      localStorage.removeItem('promptType');
      localStorage.removeItem('navigationSource');
      localStorage.removeItem('writingContent');
      localStorage.removeItem('generatedPrompt');
      
      // Set navigation source to track the flow
      localStorage.setItem('navigationSource', 'dashboard');
      
      // SIMPLE FIX: Navigate directly to writing page - NO MORE MODALS!
      if (onNavigate) {
        console.log('✅ Dashboard: Navigating to writing page via onNavigate');
        onNavigate('writing');
      } else if (navigate) {
        console.log('✅ Dashboard: Navigating to writing page via navigate');
        navigate('/writing');
      } else {
        console.log('✅ Dashboard: Navigating to writing page via window.location');
        window.location.href = '/writing';
      }
    } catch (error) {
      console.error('❌ Dashboard: Navigation error:', error);
      // Fallback navigation
      window.location.href = '/writing';
    }
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
        
        // Close prompt options modal
        setShowPromptOptionsModal(false);
        
        // Small delay to ensure localStorage is written
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Navigate to writing area AFTER prompt is generated
        navigate('/writing');
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
      console.log('✅ Dashboard: Navigation to /writing initiated');
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
        <div className="absolute top-20 left-10 w-32 h-32 bg-yellow-200 rounded-full opacity-20 animate-bounce"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-pink-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute bottom-40 left-20 w-28 h-28 bg-blue-200 rounded-full opacity-20 animate-bounce"></div>
        <div className="absolute bottom-20 right-10 w-36 h-36 bg-purple-200 rounded-full opacity-20 animate-pulse"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header with Welcome Message */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-orange-400 to-pink-500 rounded-full flex items-center justify-center shadow-xl">
              <Smile className="h-10 w-10 text-white" />
            </div>
            <div className="ml-6 text-left">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Hi there, {getUserName()}! 🌟
              </h1>
              <p className="text-2xl text-orange-500 font-semibold mt-2">
                Let's write something awesome today!
              </p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-8"></div>
            <p className="text-gray-600 text-xl">Loading your dashboard...</p>
          </div>
        ) : (
          <>
            {/* Welcome Message for First-Time Users */}
            {showWelcomeMessage && (
              <div className="bg-gradient-to-r from-green-100 to-blue-100 rounded-3xl p-8 mb-12 shadow-xl relative">
                <button
                  onClick={handleDismissWelcome}
                  className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
                
                <div className="flex items-start">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mr-6 shadow-xl">
                    <Trophy className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                      🎉 Hooray! You're All Set! 💎
                    </h2>
                    <p className="text-gray-700 text-lg mb-6">
                      Welcome to your writing adventure! You now have access to all the cool features:
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="flex items-center">
                        <Sparkles className="h-6 w-6 text-yellow-500 mr-3" />
                        <span className="text-gray-700">✨ AI Writing Assistant</span>
                      </div>
                      <div className="flex items-center">
                        <BarChart3 className="h-6 w-6 text-green-500 mr-3" />
                        <span className="text-gray-700">📊 Progress Tracking</span>
                      </div>
                      <div className="flex items-center">
                        <Target className="h-6 w-6 text-red-500 mr-3" />
                        <span className="text-gray-700">🎯 Practice Exams</span>
                      </div>
                      <div className="flex items-center">
                        <Award className="h-6 w-6 text-purple-500 mr-3" />
                        <span className="text-gray-700">🏆 NSW Selective Prep</span>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 text-lg font-semibold">
                      Ready to become an amazing writer? Let's start your first story! 🚀
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Access Status Display */}
            {accessType === 'temporary' && tempAccessUntil && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-8 rounded-r-xl shadow-lg">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-yellow-600 mr-4" />
                  <div>
                    <h3 className="text-xl font-semibold text-yellow-800 mb-2">Temporary Access Active</h3>
                    <p className="text-yellow-700 mb-2">
                      You have temporary access until: <strong>{formatDateTime(tempAccessUntil)}</strong>
                    </p>
                    <p className="text-yellow-600 text-sm">
                      {getTimeRemaining(tempAccessUntil)}
                    </p>
                  </div>
                  <button
                    onClick={handleManualRefresh}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                  >
                    Refresh Status
                  </button>
                </div>
              </div>
            )}

            {/* Main Action Cards */}
            {(isVerified && (accessType === 'permanent' || accessType === 'temporary')) ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                {/* FIXED: Write Story Card with direct navigation */}
                <div className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl p-8 text-white shadow-2xl transform hover:scale-105 transition-all duration-300 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-12 -mb-12"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center mb-6">
                      <div className="w-16 h-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center mr-4 shadow-xl">
                        <PenTool className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-3xl font-bold mb-2">Write Story</h3>
                        <p className="text-blue-100 text-lg">Create amazing stories with AI help!</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3 mb-8">
                      <div className="flex items-center text-blue-100">
                        <Sparkles className="h-5 w-5 mr-3" />
                        <span>AI-powered writing prompts</span>
                      </div>
                      <div className="flex items-center text-blue-100">
                        <Target className="h-5 w-5 mr-3" />
                        <span>NSW Selective School prep</span>
                      </div>
                      <div className="flex items-center text-blue-100">
                        <Award className="h-5 w-5 mr-3" />
                        <span>Real-time feedback & tips</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={handleStartWriting}
                      className="w-full bg-white text-purple-600 py-4 px-6 rounded-2xl font-bold text-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center"
                    >
                      <Rocket className="h-6 w-6 mr-3" />
                      Start Writing Now!
                    </button>
                  </div>
                </div>

                {/* Practice Exam Card */}
                <div className="bg-gradient-to-br from-green-500 via-teal-500 to-blue-500 rounded-3xl p-8 text-white shadow-2xl transform hover:scale-105 transition-all duration-300 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-12 -mb-12"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center mb-6">
                      <div className="w-16 h-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center mr-4 shadow-xl">
                        <BarChart3 className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-3xl font-bold mb-2">Practice Exam</h3>
                        <p className="text-green-100 text-lg">Test your skills with real exams!</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3 mb-8">
                      <div className="flex items-center text-green-100">
                        <Clock className="h-5 w-5 mr-3" />
                        <span>Timed practice sessions</span>
                      </div>
                      <div className="flex items-center text-green-100">
                        <Trophy className="h-5 w-5 mr-3" />
                        <span>Detailed performance analysis</span>
                      </div>
                      <div className="flex items-center text-green-100">
                        <TrendingUp className="h-5 w-5 mr-3" />
                        <span>Track your improvement</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={handlePracticeExam}
                      className="w-full bg-white text-green-600 py-4 px-6 rounded-2xl font-bold text-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center"
                    >
                      <Zap className="h-6 w-6 mr-3" />
                      Take Practice Exam
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* No Access State */
              <div className="text-center py-16">
                <div className="w-32 h-32 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-8">
                  <Mail className="h-16 w-16 text-red-600" />
                </div>
                <h2 className="text-4xl font-bold text-gray-900 mb-4">Almost There!</h2>
                <p className="text-gray-600 text-xl mb-8 max-w-2xl mx-auto">
                  Please verify your email or complete your subscription to access all the amazing writing features.
                </p>
                <button
                  onClick={handleManualRefresh}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                >
                  Check Status Again
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* FIXED: Writing Type Selection Modal */}
      {showWritingTypeModal && (
        <WritingTypeSelectionModal
          isOpen={showWritingTypeModal}
          onClose={() => setShowWritingTypeModal(false)}
          onSelect={handleWritingTypeSelect}
        />
      )}

      {/* FIXED: Prompt Options Modal */}
      {showPromptOptionsModal && (
        <PromptOptionsModal
          isOpen={showPromptOptionsModal}
          onClose={() => setShowPromptOptionsModal(false)}
          onGeneratePrompt={handleGeneratePrompt}
          onCustomPrompt={handleCustomPrompt}
          isGenerating={isGeneratingPrompt}
          writingType={selectedWritingType}
        />
      )}
    </div>
  );
}
