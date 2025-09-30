import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './layout-fix.css';

// Add this import at the top with other imports
import WritingWorkspaceFixed from '../pages/WritingWorkspace';
import { NavBar } from './NavBar';
import { HeroSection } from './HeroSection';
import { FeaturesSection } from './FeaturesSection';
import { ToolsSection } from './ToolsSection';
import { WritingTypesSection } from './WritingTypesSection';
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
// import { WritingArea } from './WritingArea';
import { TabbedCoachPanel } from './TabbedCoachPanel';
import { EnhancedWritingLayoutNSW } from './EnhancedWritingLayoutNSW';
import { LearningPage } from './LearningPage';
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
// REMOVED: import { FloatingChatWindow } from './FloatingChatWindow';
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
  const [selectedText, setSelectedText] = useState('');
  const [showExamMode, setShowExamMode] = useState(false);
  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const [showPlanningTool, setShowPlanningTool] = useState(false);
  const [prompt, setPrompt] = useState('');

  useEffect(() => {
    // Set a default prompt for demonstration purposes
    setPrompt("One rainy afternoon, while exploring your grandmother's attic, you stumble upon an old, dusty mirror. As you wipe away the grime, you notice that your reflection begins to change-it shows a vibrant, magical world behind you instead of the attic. Curious, you touch the mirror and suddenly find yourself pulled into this enchanting land, where the sky is a brilliant shade of purple, and creatures of all shapes and sizes roam freely. In this new world, you meet a talking animal who claims to be your guide, but they have a problem that only you can help solve. What adventure awaits you in this realm? What challenges will you face, and what choices will you have to make? Describe the characters you meet, the landscapes you explore, and the lesson you learn along the way. How will you find your way back home, and what will you bring back with you?");
  }, []);
  
  // New state for popup flow completion
  const [popupFlowCompleted, setPopupFlowCompleted] = useState(false); 
  const [hasSignedIn, setHasSignedIn] = useState(false);
  
  // Panel state for attached chat
  const [panelVisible, setPanelVisible] = useState(true);
  const [openAIConnected, setOpenAIConnected] = useState<boolean | null>(null);
  const [openAILoading, setOpenAILoading] = useState<boolean>(true);

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
    const paymentSuccess = urlParams.get('paymentSuccess') === 'true' || urlParams.get('payment_success') === 'true';
    const planType = urlParams.get('planType') || urlParams.get('plan');
    const userEmail = urlParams.get('email');
    
    if (paymentSuccess && planType) {
      console.log('[DEBUG] Payment success detected for plan:', planType);
      
      // Store payment info
      if (userEmail) {
        localStorage.setItem('userEmail', userEmail);
      }
      localStorage.setItem('payment_plan', planType);
      localStorage.setItem('payment_date', new Date().toISOString());
      
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      
      setShowPaymentSuccess(true);
      setPendingPaymentPlan(planType);
      setActivePage('payment-success');
    }
  }, []);

  // Set active page based on current path
  useEffect(() => {
    const path = location.pathname.substring(1) || 'home';
    if (path !== 'auth/callback') { // Don't change active page during auth callback
      setActivePage(path);
    }
  }, [location.pathname]);

  // Text selection logic for writing area
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim().length > 0) {
        setSelectedText(selection.toString());
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  // NAVIGATION FIX: Improved auth success handler
  const handleAuthSuccess = useCallback(() => {
    try {
      setShowAuthModal(false);
      
      if (pendingPaymentPlan) {
        setActivePage("payment-success");
        setShowPaymentSuccess(true);
      } else {
        // Navigate to appropriate page based on user state
        if (user && emailVerified && paymentCompleted) {
          setActivePage("writing");
        } else {
          setActivePage("dashboard");
        }
      }
    } catch (error) {
      console.error('Auth success navigation error:', error);
      // Fallback to dashboard
      setActivePage('dashboard');
      setShowAuthModal(false);
    }
  }, [pendingPaymentPlan, user, emailVerified, paymentCompleted]);

  const handleForceSignOut = async () => {
    try {
      console.log('🔄 AppContent: Starting force sign out...');
      
      // Reset all local state first
      setActivePage('home');
      setShowAuthModal(false);
      setShowPaymentSuccess(false);
      setPendingPaymentPlan(null);
      setContent('');
      setTextType('');
      setPopupFlowCompleted(false);
      
      console.log('✅ AppContent: Local state reset completed');
      
      // Then attempt auth sign out
      await authSignOut();
      console.log('✅ AppContent: Auth sign out completed');
      
    } catch (error) {
      console.error('AppContent: Error during sign out:', error);
      
      // Force reset even if sign out fails
      setActivePage('home');
      setShowAuthModal(false);
      setShowPaymentSuccess(false);
      setPendingPaymentPlan(null);
      
      // Clear localStorage as fallback
      localStorage.clear();
      
      console.log('⚠️ AppContent: Forced local state reset due to sign out error');
    }
  };

  // NAVIGATION FIX: Improved navigation handler with proper state management
  const handleNavigation = useCallback(async (page: string) => {
    try {
      // Prevent navigation during loading states
      if (isLoading) return;
      
      // Use React Router's navigate function for proper routing
      navigate(`/${page === 'home' ? '' : page}`);
      
      // Update local state for UI consistency
      setActivePage(page);
      
      // Always close auth modal on navigation
      setShowAuthModal(false);
      
      // Clear any temporary states that might interfere
      setSelectedText('');
      
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback to home page on navigation errors
      navigate('/');
      setActivePage('home');
    }
  }, [navigate, isLoading]);

  // NAVIGATION FIX: Improved get started handler with consistent flow
  const handleGetStarted = useCallback(async () => {
    try {
      if (user) {
        if (!emailVerified) {
          setActivePage('dashboard'); // Show email verification reminder
        } else if (paymentCompleted) {
          setActivePage('writing'); // Full access
        } else {
          setActivePage('pricing'); // Need to complete payment
        }
      } else {
        setAuthModalMode('signup');
        setShowAuthModal(true);
      }
    } catch (error) {
      console.error('Get started error:', error);
      // Fallback to showing auth modal
      setAuthModalMode('signup');
      setShowAuthModal(true);
    }
  }, [user, emailVerified, paymentCompleted]);

  // FIXED: Dynamic textType handling with proper fallback
  const handleSubmit = () => {
    // Use the actual textType from state, with fallback only if truly empty
    const submissionTextType = textType || 'narrative';
    
    console.log("Writing submitted:", { 
      content, 
      textType: submissionTextType,
      originalTextType: textType,
      contentLength: content.length 
    });
    
    // Store the essay content and metadata for evaluation
    localStorage.setItem("submittedEssay", content);
    localStorage.setItem("submittedTextType", submissionTextType);
    localStorage.setItem("submissionTimestamp", new Date().toISOString());
    
    console.log('✅ Essay data stored for NSW evaluation system');
    
    // Trigger a custom event that WritingWorkspace can listen to
    window.dispatchEvent(new CustomEvent('submitForEvaluation', {
      detail: { content, textType: submissionTextType }
    }));
  };

  // NAVIGATION FIX: Improved text type change handler
  const handleTextTypeChange = useCallback((newTextType: string) => {
    try {
      setTextType(newTextType || ''); // Ensure we don't set undefined
      console.log('Text type changed to:', newTextType);
    } catch (error) {
      console.error('Text type change error:', error);
    }
  }, []);

  // NAVIGATION FIX: Improved popup completion handler
  const handlePopupCompleted = useCallback(() => {
    try {
      setPopupFlowCompleted(true);
    } catch (error) {
      console.error('Popup completion error:', error);
    }
  }, []);

  // NAVIGATION FIX: Improved footer visibility logic
  const shouldShowFooter = useCallback(() => {
    // Don't show footer on writing page or other specific pages
    const noFooterPages = ['writing', 'exam', 'dashboard', 'settings'];
    return !noFooterPages.includes(activePage);
  }, [activePage]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-content-wrapper bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="route-with-footer">
        <Routes>
          <Route path="/" element={
            <>
              <NavBar 
                activePage={activePage}
                onNavigate={handleNavigation}
                user={user}
                onSignInClick={() => {
                  setAuthModalMode('signin');
                  setShowAuthModal(true);
                }}
                onSignUpClick={() => {
                  setAuthModalMode('signup');
                  setShowAuthModal(true);
                }}
                onForceSignOut={handleForceSignOut}
              />
              <div className="main-route-content">
                <HeroSection onGetStarted={handleGetStarted} />
                <FeaturesSection />
                <EnhancedSuccessSection />
              </div>
            </>
          } />
          <Route path="/home" element={
            <>
              <NavBar 
                activePage={activePage}
                onNavigate={handleNavigation}
                user={user}
                onSignInClick={() => {
                  setAuthModalMode('signin');
                  setShowAuthModal(true);
                }}
                onSignUpClick={() => {
                  setAuthModalMode('signup');
                  setShowAuthModal(true);
                }}
                onForceSignOut={handleForceSignOut}
              />
              <div className="main-route-content">
                <HeroSection onGetStarted={handleGetStarted} />
                <FeaturesSection />
                <EnhancedSuccessSection />
              </div>
            </>
          } />
          <Route path="/features" element={
            <>
              <NavBar 
                activePage={activePage}
                onNavigate={handleNavigation}
                user={user}
                onSignInClick={() => {
                  setAuthModalMode('signin');
                  setShowAuthModal(true);
                }}
                onSignUpClick={() => {
                  setAuthModalMode('signup');
                  setShowAuthModal(true);
                }}
                onForceSignOut={handleForceSignOut}
              />
              <div className="main-route-content">
                <FeaturesSection />
              </div>
            </>
          } />
          <Route path="/pricing" element={<PricingPage onNavigate={handleNavigation} />} />
          <Route path="/faq" element={<FAQPage onNavigate={handleNavigation} />} />
          <Route path="/about" element={<AboutPage onNavigate={handleNavigation} />} />
          <Route path="/dashboard" element={
            user ? (
              <Dashboard 
                onNavigate={handleNavigation}
                onSignOut={handleForceSignOut}
              />
            ) : (
              <Navigate to="/" />
            )
          } />
          <Route path="/settings" element={
            user ? <SettingsPage onBack={() => setActivePage('dashboard')} /> : <Navigate to="/" />
          } />
          <Route path="/exam" element={
            <WritingAccessCheck onNavigate={handleNavigation}>
              <ExamSimulationMode onExit={() => navigate("/dashboard")}/>
            </WritingAccessCheck>
          } />
          <Route path="/writing" element={
            <WritingAccessCheck onNavigate={handleNavigation}>
              <div className="writing-route h-screen flex flex-col">
                <EnhancedHeader 
                  textType={textType || 'narrative'}
                  assistanceLevel={assistanceLevel}
                  onTextTypeChange={setTextType}
                  onTimerStart={() => setTimerStarted(true)}
                  hideTextTypeSelector={popupFlowCompleted}
                />
                
                {showExamMode ? (
                  <ExamSimulationMode 
                    onExit={() => setShowExamMode(false)}
                  />
                ) : (
                  <div className="writing-layout-content flex-1 min-h-0">
                    <EnhancedWritingLayoutNSW
                      content={content}
                      onChange={setContent}
                      textType={textType || 'narrative'}
                      prompt={prompt} // Pass the prompt here
                      assistanceLevel={assistanceLevel}
                      onAssistanceLevelChange={setAssistanceLevel}
                      onSubmit={handleSubmit}
                      selectedText={selectedText}
                      onTextTypeChange={handleTextTypeChange}
                      onPopupCompleted={handlePopupCompleted}
                      popupFlowCompleted={popupFlowCompleted}
                      user={user}
                      openAIConnected={openAIConnected}
                      openAILoading={openAILoading}
                      panelVisible={panelVisible}
                      setPanelVisible={setPanelVisible}
                    />
                  </div>
                )}
              </div>
            </WritingAccessCheck>
          } />
          <Route path="/payment-success" element={
            <PaymentSuccessPage 
              planType={pendingPaymentPlan}
              onNavigate={handleNavigation}
            />
          } />
          <Route path="/learning" element={
            <WritingAccessCheck onNavigate={handleNavigation}>
              <LearningPage />
            </WritingAccessCheck>
          } />
          <Route path="/support" element={
            <HelpCenter />
          } />
          <Route path="/essay-feedback/:id" element={
            <WritingAccessCheck onNavigate={handleNavigation}>
              <EssayFeedbackPage />
            </WritingAccessCheck>
          } />
          <Route path="/auth/callback" element={null} /> {/* Handled by AuthContext */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        {shouldShowFooter() && <Footer />}
        {showAuthModal && (
          <AuthModal
            mode={authModalMode}
            onClose={() => setShowAuthModal(false)}
            onAuthSuccess={handleAuthSuccess}
            onSwitchMode={(mode) => setAuthModalMode(mode)}
          />
        )}
      </div>
    </div>
  );
}

export default AppContent;
