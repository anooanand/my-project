// src/components/AppContent.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './layout-fix.css';

// Add this import at the top with other imports
import { EnhancedWritingLayoutNSW } from './EnhancedWritingLayoutNSW';
import { LearningPage } from './LearningPage';

import { NavBar } from './NavBar';
import { HomePage } from './HomePage';
import { HeroSection } from './HeroSection';
import { FeaturesSection } from './FeaturesSection';
import { ToolsSection } from './ToolsSection';
import { NewWritingTypesSection } from './NewWritingTypesSection'; // Corrected import
import { StudentSuccessSection } from './StudentSuccessSection';
import { HowItWorksSection } from './HowItWorksSection';
import { EnhancedSuccessSection } from './EnhancedSuccessSection';
import { Footer } from './Footer';
import { PaymentSuccessPage } from './PaymentSuccessPage';
import { PricingPage } from './PricingPage';
import { Dashboard } from './Dashboard';
import { AuthModal } from './AuthModal';
import { FAQPage } from './FAQPage';
import { AboutPage } from './AboutPage';
import { SettingsPage } from './SettingsPage';
import { ErrorBoundary } from './ErrorBoundary';
// Writing components
import { SplitScreen } from './SplitScreen';
import { TabbedCoachPanel } from './TabbedCoachPanel';
import { ExamSimulationMode } from './ExamSimulationMode';
import { SupportiveFeatures } from './SupportiveFeatures';
import { HelpCenter } from './HelpCenter';
import { EssayFeedbackPage } from './EssayFeedbackPage';
import { EnhancedHeader } from './EnhancedHeader';
import { SpecializedCoaching } from './text-type-templates/SpecializedCoaching';
import { BrainstormingTools } from './BrainstormingTools';
import { WritingAccessCheck } from './WritingAccessCheck';
import { WritingToolbar } from './WritingToolbar';
import { PlanningToolModal } from './PlanningToolModal';
import { EmailVerificationHandler } from './EmailVerificationHandler';
import { EvaluationPage } from './EvaluationPage';
import { checkOpenAIConnectionStatus } from '../lib/openai';
import { AdminButton } from './AdminButton';

function AppContent() {
  const { user, loading: isLoading, paymentCompleted, emailVerified, authSignOut } = useAuth();
  const [activePage, setActivePage] = useState('home');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [pendingPaymentPlan, setPendingPaymentPlan] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Writing state
  const [content, setContent] = useState('');
  const [textType, setTextType] = useState('');
  const [assistanceLevel, setAssistanceLevel] = useState('detailed');
  const [timerStarted, setTimerStarted] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [selectedText, setSelectedText] = useState('');
  const [showExamMode, setShowExamMode] = useState(false);
  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const [showPlanningTool, setShowPlanningTool] = useState(false);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [popupFlowCompleted, setPopupFlowCompleted] = useState(false); 
  const [hasSignedIn, setHasSignedIn] = useState(false);
  
  // Panel state for attached chat
  const [panelVisible, setPanelVisible] = useState(true);
  const [openAIConnected, setOpenAIConnected] = useState<boolean | null>(null);
  const [openAILoading, setOpenAILoading] = useState<boolean>(true);

  // New states for button functionality
  const [showStructureGuide, setShowStructureGuide] = useState(false);
  const [showTips, setShowTips] = useState(false);

  // Timer logic - increment elapsed time every second when timer is running
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (timerStarted) {
      intervalId = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [timerStarted]);
  const [focusMode, setFocusMode] = useState(false);

  // CRITICAL FIX: Load prompt from localStorage AND database when component mounts
  useEffect(() => {
    const loadPromptFromStorage = async () => {
      try {
        // First try localStorage
        const generatedPrompt = localStorage.getItem('generatedPrompt');
        const customPrompt = localStorage.getItem('customPrompt');
        const storedTextType = localStorage.getItem('selectedWritingType');

        console.log('🔍 Loading prompt from localStorage:', {
          generatedPrompt: generatedPrompt ? generatedPrompt.substring(0, 50) + '...' : null,
          customPrompt: customPrompt ? customPrompt.substring(0, 50) + '...' : null,
          storedTextType
        });

        // Set the prompt (prioritize generated over custom)
        if (generatedPrompt) {
          setPrompt(generatedPrompt);
          console.log('✅ Loaded generated prompt from localStorage');
        } else if (customPrompt) {
          setPrompt(customPrompt);
          console.log('✅ Loaded custom prompt from localStorage');
        } else if (user?.id) {
          // If no localStorage prompt, try loading from database
          console.log('🔍 No localStorage prompt found, checking database...');
          const { supabase } = await import('../lib/supabase');
          const { data: sessions } = await supabase
            .from('chat_sessions')
            .select('prompt, text_type')
            .eq('user_id', user.id)
            .order('last_accessed_at', { ascending: false })
            .limit(1);

          if (sessions && sessions.length > 0 && sessions[0].prompt) {
            setPrompt(sessions[0].prompt);
            setTextType(sessions[0].text_type || 'narrative');
            console.log('✅ Loaded prompt from database');

            // Also update localStorage for faster future access
            localStorage.setItem('generatedPrompt', sessions[0].prompt);
            localStorage.setItem('selectedWritingType', sessions[0].text_type || 'narrative');
          }
        }

        // Set the text type if available
        if (storedTextType) {
          setTextType(storedTextType);
          console.log('✅ Loaded text type:', storedTextType);
        }

        // Mark popup flow as completed if we have a prompt
        if (generatedPrompt || customPrompt) {
          setPopupFlowCompleted(true);
          console.log('✅ Popup flow marked as completed');
        }

      } catch (error) {
        console.error('❌ Error loading prompt:', error);
      }
    };

    // Load prompt when component mounts
    loadPromptFromStorage();

    // Listen for prompt generation events from Dashboard
    const handlePromptGenerated = (event: CustomEvent) => {
      console.log('🎯 Received promptGenerated event:', event.detail);
      const { prompt: newPrompt, textType: newTextType } = event.detail;
      
      if (newPrompt) {
        setPrompt(newPrompt);
        console.log('✅ Prompt updated from event');
      }
      
      if (newTextType && newTextType !== 'custom') {
        setTextType(newTextType);
        console.log('✅ Text type updated from event');
      }
      
      setPopupFlowCompleted(true);
    };

    // Add event listener
    window.addEventListener('promptGenerated', handlePromptGenerated as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('promptGenerated', handlePromptGenerated as EventListener);
    };
  }, []);

  // ADDITIONAL FIX: Reload prompt when navigating to writing page
  useEffect(() => {
    if (location.pathname === '/writing') {
      const generatedPrompt = localStorage.getItem('generatedPrompt');
      const customPrompt = localStorage.getItem('customPrompt');
      const storedTextType = localStorage.getItem('selectedWritingType');
      
      console.log('📍 Navigated to writing page, checking localStorage:', {
        generatedPrompt: generatedPrompt ? 'Found' : 'Not found',
        customPrompt: customPrompt ? 'Found' : 'Not found',
        storedTextType
      });

      // Update prompt if we find one in localStorage
      if (generatedPrompt && generatedPrompt !== prompt) {
        setPrompt(generatedPrompt);
        console.log('✅ Updated prompt from localStorage on navigation');
      } else if (customPrompt && customPrompt !== prompt) {
        setPrompt(customPrompt);
        console.log('✅ Updated custom prompt from localStorage on navigation');
      }

      // Update text type if available
      if (storedTextType && storedTextType !== textType) {
        setTextType(storedTextType);
        console.log('✅ Updated text type from localStorage on navigation');
      }

      // Mark popup flow as completed if we have a prompt
      if ((generatedPrompt || customPrompt) && !popupFlowCompleted) {
        setPopupFlowCompleted(true);
        console.log('✅ Popup flow marked as completed on navigation');
      }
    }
  }, [location.pathname, prompt, textType, popupFlowCompleted]);

  // Handle sign-in behavior - clear content and show modal when user signs in
  useEffect(() => {
    if (user && !hasSignedIn) {
      // User just signed in
      setHasSignedIn(true);
      
      // Clear content and reset state
      setContent('');
      setTextType('');
      setPopupFlowCompleted(false);
      
      // If we're on the writing page, this will trigger the writing type modal
      if (activePage === 'writing') {
        // The WritingArea component will handle showing the modal
      }
    } else if (!user && hasSignedIn) {
      // User signed out
      setHasSignedIn(false);
    }
  }, [user, hasSignedIn, activePage]);

  useEffect(() => {
    const fetchOpenAIStatus = async () => {
      setOpenAILoading(true);
      const status = await checkOpenAIConnectionStatus();
      setOpenAIConnected(status.is_connected);
      setOpenAILoading(false);
    };

    fetchOpenAIStatus();
  }, []);

  // Check for payment success in URL on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment_success') === 'true') {
      setShowPaymentSuccess(true);
    }
  }, []);

  const handleClosePaymentSuccess = () => {
    setShowPaymentSuccess(false);
    navigate(location.pathname, { replace: true });
  };

  const handleSignInClick = () => {
    setAuthModalMode('signin');
    setShowAuthModal(true);
  };

  const handleSignUpClick = () => {
    setAuthModalMode('signup');
    setShowAuthModal(true);
  };

  const handleCloseAuthModal = () => {
    setShowAuthModal(false);
  };

  const handlePageChange = (page: string) => {
    setActivePage(page);
    navigate(`/${page}`);
  };

  const handleSignOut = async () => {
    try {
      await authSignOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleStartTimer = () => setTimerStarted(true);
  const handleStopTimer = () => setTimerStarted(false);
  const handleResetTimer = () => {
    setTimerStarted(false);
    setElapsedTime(0);
  };

  const handleTextSelection = () => {
    const text = window.getSelection()?.toString() || '';
    setSelectedText(text);
  };

  const handleFeatureClick = (feature: string) => {
    if (feature === 'examMode') {
      setShowExamMode(true);
    } else if (feature === 'help') {
      setShowHelpCenter(true);
    } else if (feature === 'planning') {
      setShowPlanningTool(true);
    }
  };

  const handleCloseHelpCenter = () => {
    setShowHelpCenter(false);
  };

  const handleClosePlanningTool = () => {
    setShowPlanningTool(false);
  };

  const handleSelectPlan = (plan: string) => {
    if (user) {
      navigate(`/pricing?plan=${plan}`);
    } else {
      setPendingPaymentPlan(plan);
      handleSignUpClick();
    }
  };

  useEffect(() => {
    if (user && pendingPaymentPlan) {
      navigate(`/pricing?plan=${pendingPaymentPlan}`);
      setPendingPaymentPlan(null);
    }
  }, [user, pendingPaymentPlan, navigate]);

  const handleGetStarted = (plan: string) => {
    if (user) {
      navigate(`/pricing?plan=${plan}`);
    } else {
      setPendingPaymentPlan(plan);
      handleSignUpClick();
    }
  };

  const handleTryForFree = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      handleSignUpClick();
    }
  };

  const handleViewPricing = () => {
    navigate('/pricing');
  };

  const handleUpdateContent = (newContent: string) => {
    setContent(newContent);
  };

  const handleUpdateTextType = (newTextType: string) => {
    setTextType(newTextType);
    localStorage.setItem('selectedWritingType', newTextType);
  };

  const handleUpdateAssistanceLevel = (newAssistanceLevel: string) => {
    setAssistanceLevel(newAssistanceLevel);
  };

  const handleToggleFocusMode = () => {
    setFocusMode(!focusMode);
  };

  const handleTogglePanel = () => {
    setPanelVisible(!panelVisible);
  };

  const handleLogout = async () => {
    try {
      await authSignOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handlePromptUpdate = useCallback((newPrompt: string, newTextType: string) => {
    console.log('handlePromptUpdate called with:', { newPrompt, newTextType });
    setPrompt(newPrompt);
    setTextType(newTextType);
    setPopupFlowCompleted(true);
    localStorage.setItem(newTextType === 'custom' ? 'customPrompt' : 'generatedPrompt', newPrompt);
    localStorage.setItem('selectedWritingType', newTextType);
  }, []);

  const handleViewAllFeatures = () => {
    const featuresElement = document.getElementById('features');
    if (featuresElement) {
      featuresElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleShowHowItWorks = () => {
    const howItWorksElement = document.getElementById('how-it-works');
    if (howItWorksElement) {
      howItWorksElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleStartFreeTrial = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      handleSignUpClick();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className={`App dark:bg-gray-900 ${focusMode ? 'focus-mode' : ''}`}>
        <EmailVerificationHandler />
        {!location.pathname.includes('/writing') && (
          <NavBar 
            onSignInClick={handleSignInClick} 
            onSignUpClick={handleSignUpClick} 
            onPageChange={handlePageChange} 
            user={user} 
            onSignOut={handleSignOut} 
          />
        )}

        <Routes>
          <Route path="/" element={<HomePage onGetStarted={handleGetStarted} onViewPricing={handleViewPricing} />} />
          <Route path="/features" element={<FeaturesSection />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/pricing" element={<PricingPage onSelectPlan={handleSelectPlan} />} />
          <Route path="/payment-success" element={<PaymentSuccessPage onClose={handleClosePaymentSuccess} />} />
          <Route path="/dashboard" element={user ? <Dashboard onPromptGenerated={handlePromptUpdate} /> : <Navigate to="/" />} />
          <Route path="/settings" element={user ? <SettingsPage /> : <Navigate to="/" />} />
          <Route path="/help-center" element={<HelpCenter />} />
          <Route path="/evaluation" element={<EvaluationPage />} />

          <Route 
            path="/writing-nsw" 
            element={
              <WritingAccessCheck>
                <EnhancedWritingLayoutNSW />
              </WritingAccessCheck>
            }
          />

          <Route 
            path="/learning" 
            element={<LearningPage />} 
          />

          <Route 
            path="/writing" 
            element={
              <WritingAccessCheck>
                <SplitScreen
                  isPanelVisible={panelVisible}
                  onTogglePanel={handleTogglePanel}
                  editorComponent={
                    <>
                      <EnhancedHeader 
                        textType={textType}
                        onBack={() => navigate('/dashboard')}
                        wordCount={content.split(/\s+/).filter(Boolean).length}
                        showStructureGuide={() => setShowStructureGuide(true)}
                        showTips={() => setShowTips(true)}
                        isPanelVisible={panelVisible}
                        onTogglePanel={handleTogglePanel}
                      />
                      <WritingToolbar 
                        onStartTimer={handleStartTimer}
                        onStopTimer={handleStopTimer}
                        onResetTimer={handleResetTimer}
                        elapsedTime={elapsedTime}
                        onFeatureClick={handleFeatureClick}
                        onFocusModeToggle={handleToggleFocusMode}
                        focusMode={focusMode}
                      />
                      <div onMouseUp={handleTextSelection} style={{ height: '100%', overflowY: 'auto' }}>
                        {/* Writing area content goes here */}
                      </div>
                    </>
                  }
                  panelComponent={
                    <TabbedCoachPanel 
                      content={content}
                      textType={textType}
                      assistanceLevel={assistanceLevel}
                      selectedText={selectedText}
                      prompt={prompt || ''}
                      showStructureGuide={showStructureGuide}
                      setShowStructureGuide={setShowStructureGuide}
                      showTips={showTips}
                      setShowTips={setShowTips}
                    />
                  }
                />
              </WritingAccessCheck>
            }
          />

          <Route path="/essay-feedback" element={<EssayFeedbackPage />} />
        </Routes>

        {showAuthModal && <AuthModal mode={authModalMode} onClose={handleCloseAuthModal} onSwitchMode={() => setAuthModalMode(authModalMode === 'signin' ? 'signup' : 'signin')} />}
        {showExamMode && <ExamSimulationMode onClose={() => setShowExamMode(false)} />}
        {showHelpCenter && <HelpCenter onClose={handleCloseHelpCenter} />}
        {showPlanningTool && <PlanningToolModal onClose={handleClosePlanningTool} />}
        
        <AdminButton />

        {!location.pathname.includes('/writing') && <Footer />}
      </div>
    </ErrorBoundary>
  );
}

export default AppContent;