import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './layout-fix.css';

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
import { WritingArea } from './WritingArea';
import { TabbedCoachPanel } from './TabbedCoachPanel';
import { EnhancedWritingLayout } from './EnhancedWritingLayout';
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
import { FloatingChatWindow } from './FloatingChatWindow';
import { checkOpenAIConnectionStatus } from '../lib/openai';
import { AdminButton } from './AdminButton';
import { useState, useEffect, useCallback } from 'react';

function AppContent() {
  const { user, isLoading, paymentCompleted, emailVerified, authSignOut } = useAuth();
  const [activePage, setActivePage] = useState('home');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [pendingPaymentPlan, setPendingPaymentPlan] = useState<string | null>(null);
  const [openAIConnected, setOpenAIConnected] = useState(false);
  const [openAILoading, setOpenAILoading] = useState(true);
  const [content, setContent] = useState('');
  const [textType, setTextType] = useState('');
  const [popupFlowCompleted, setPopupFlowCompleted] = useState(false);
  const [selectedText, setSelectedText] = useState('');

  const location = useLocation();

  useEffect(() => {
    const fetchOpenAIStatus = async () => {
      const status = await checkOpenAIConnectionStatus();
      setOpenAIConnected(status.is_connected);
      setOpenAILoading(false);
    };
    fetchOpenAIStatus();
  }, []);

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
        setActivePage('payment-success');
        setShowPaymentSuccess(true);
      } else {
        // Navigate to appropriate page based on user state
        if (user && emailVerified && paymentCompleted) {
          setActivePage('writing');
        } else {
          setActivePage('dashboard');
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
      setContent('');
      setTextType('');
      setPopupFlowCompleted(false);
    }
  };

  const handleGetStartedClick = useCallback(async () => {
    try {
      if (!user) {
        setAuthModalMode('signup');
        setShowAuthModal(true);
      } else if (!emailVerified) {
        setActivePage('email-verification');
      } else if (!paymentCompleted) {
        setActivePage('pricing');
      } else {
        setActivePage('writing');
      }
    } catch (error) {
      console.error('Get started error:', error);
      // Fallback to showing auth modal
      setAuthModalMode('signup');
      setShowAuthModal(true);
    }
  }, [user, emailVerified, paymentCompleted]);

  // NAVIGATION FIX: Improved text type change handler
  const handleTextTypeChange = useCallback((newTextType: string) => {
    try {
      setTextType(newTextType);
      console.log('Text type changed to:', newTextType);
    } catch (error) {
      console.error('Text type change error:', error);
    }
  }, []);

  return (
    <div className="App">
      <EnhancedHeader
        activePage={activePage}
        setActivePage={setActivePage}
        onSignInClick={() => { setAuthModalMode('signin'); setShowAuthModal(true); }}
        onSignUpClick={() => { setAuthModalMode('signup'); setShowAuthModal(true); }}
        onSignOut={handleForceSignOut}
        user={user}
        isLoading={isLoading}
        emailVerified={emailVerified}
        paymentCompleted={paymentCompleted}
      />

      <AuthModal
        show={showAuthModal}
        mode={authModalMode}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
        onSwitchMode={(mode) => setAuthModalMode(mode)}
      />

      {showPaymentSuccess && (
        <div className="payment-success-banner">
          Payment successful! Your plan is now active.
          <button onClick={() => setShowPaymentSuccess(false)}>Dismiss</button>
        </div>
      )}

      <Routes>
        <Route path="/" element={
          <>
            <HeroSection onGetStartedClick={handleGetStartedClick} />
            <FeaturesSection />
            <ToolsSection />
            <WritingTypesSection />
            <StudentSuccessSection />
            <HowItWorksSection />
            <EnhancedSuccessSection />
          </>
        } />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/payment-success" element={<PaymentSuccessPage />} />
        <Route path="/learning" element={<LearningPage />} />
        <Route path="/exam-simulation" element={<ExamSimulationMode />} />
        <Route path="/supportive-features" element={<SupportiveFeatures />} />
        <Route path="/help-center" element={<HelpCenter />} />
        <Route path="/essay-feedback" element={<EssayFeedbackPage />} />
        <Route path="/specialized-coaching" element={<SpecializedCoaching />} />
        <Route path="/brainstorming-tools" element={<BrainstormingTools />} />
        <Route path="/email-verification" element={<EmailVerificationHandler />} />

        <Route path="/writing" element={
          <WritingAccessCheck>
            <EnhancedWritingLayout
              content={content}
              setContent={setContent}
              textType={textType}
              setTextType={setTextType}
              popupFlowCompleted={popupFlowCompleted}
              setPopupFlowCompleted={setPopupFlowCompleted}
              selectedText={selectedText}
              setSelectedText={setSelectedText}
              openAIConnected={openAIConnected}
              openAILoading={openAILoading}
            />
          </WritingAccessCheck>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Footer />
      <FloatingChatWindow />
      <AdminButton />
    </div>
  );
}

export default AppContent;
