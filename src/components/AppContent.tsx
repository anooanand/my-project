// MINIMAL WORKING: AppContent Component to Fix Page Loading
// This is a simplified version that should load without errors

import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Import only essential components to avoid import errors
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

// Writing components - import with error handling
import { EnhancedWritingLayoutNSW } from './EnhancedWritingLayoutNSW';
import { LearningPage } from './LearningPage';
import { ExamSimulationMode } from './ExamSimulationMode';
import { EnhancedHeader } from './EnhancedHeader';
import { WritingAccessCheck } from './WritingAccessCheck';
import { EmailVerificationHandler } from './EmailVerificationHandler';
import { EvaluationPage } from './EvaluationPage';
import { AdminButton } from './AdminButton';

// Optional imports with fallbacks
let checkOpenAIConnectionStatus: any;
try {
  const openaiModule = require('../lib/openai');
  checkOpenAIConnectionStatus = openaiModule.checkOpenAIConnectionStatus;
} catch (error) {
  console.warn('OpenAI module not available:', error);
  checkOpenAIConnectionStatus = async () => false;
}

function AppContent() {
  const { user, loading: isLoading, paymentCompleted, emailVerified, authSignOut } = useAuth();
  const [activePage, setActivePage] = useState('home');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [pendingPaymentPlan, setPendingPaymentPlan] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Writing state with safe defaults
  const [content, setContent] = useState('');
  const [textType, setTextType] = useState('narrative');
  const [assistanceLevel, setAssistanceLevel] = useState('detailed');
  const [selectedText, setSelectedText] = useState('');
  const [showExamMode, setShowExamMode] = useState(false);
  
  // Enhanced writing states
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [showStructureGuide, setShowStructureGuide] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  
  // Additional states
  const [popupFlowCompleted, setPopupFlowCompleted] = useState(false); 
  const [hasSignedIn, setHasSignedIn] = useState(false);
  const [panelVisible, setPanelVisible] = useState(true);
  const [openAIConnected, setOpenAIConnected] = useState<boolean | null>(null);
  const [openAILoading, setOpenAILoading] = useState<boolean>(false);

  // Safe prompt loading with error handling
  useEffect(() => {
    const loadPromptFromStorage = () => {
      try {
        const generatedPrompt = localStorage.getItem("generatedPrompt");
        const customPrompt = localStorage.getItem("customPrompt");
        const storedTextType = localStorage.getItem('selectedWritingType');
        
        if (generatedPrompt) {
          console.log('📝 AppContent: Loading generated prompt from localStorage');
          setCurrentPrompt(generatedPrompt);
        } else if (customPrompt) {
          console.log('📝 AppContent: Loading custom prompt from localStorage');
          setCurrentPrompt(customPrompt);
        }
        
        if (storedTextType) {
          console.log('📝 AppContent: Loading text type from localStorage:', storedTextType);
          setTextType(storedTextType);
        }
      } catch (error) {
        console.error('AppContent: Error loading prompt from localStorage:', error);
        // Set fallback values
        setCurrentPrompt('Write a creative story based on your imagination.');
        setTextType('narrative');
      }
    };

    loadPromptFromStorage();

    // Safe event listeners with error handling
    const handlePromptGenerated = (event: any) => {
      try {
        console.log('📝 AppContent: Received promptGenerated event');
        if (event.detail && event.detail.prompt) {
          setCurrentPrompt(event.detail.prompt);
          setTextType(event.detail.textType || 'narrative');
        }
      } catch (error) {
        console.error('AppContent: Error handling prompt generated event:', error);
      }
    };

    const handleStorageChange = (event: StorageEvent) => {
      try {
        if (event.key === 'generatedPrompt' || event.key === 'customPrompt') {
          console.log('📝 AppContent: Storage changed, reloading prompt');
          loadPromptFromStorage();
        }
      } catch (error) {
        console.error('AppContent: Error handling storage change:', error);
      }
    };

    window.addEventListener('promptGenerated', handlePromptGenerated);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('promptGenerated', handlePromptGenerated);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Safe timer functions
  const startTimer = () => {
    try {
      setIsTimerRunning(true);
    } catch (error) {
      console.error('Error starting timer:', error);
    }
  };

  const pauseTimer = () => {
    try {
      setIsTimerRunning(false);
    } catch (error) {
      console.error('Error pausing timer:', error);
    }
  };

  const resetTimer = () => {
    try {
      setElapsedTime(0);
      setIsTimerRunning(false);
    } catch (error) {
      console.error('Error resetting timer:', error);
    }
  };

  // Safe timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    try {
      if (isTimerRunning) {
        interval = setInterval(() => {
          setElapsedTime(prev => prev + 1);
        }, 1000);
      }
    } catch (error) {
      console.error('Timer effect error:', error);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning]);

  // Safe OpenAI status check
  useEffect(() => {
    const fetchOpenAIStatus = async () => {
      try {
        setOpenAILoading(true);
        if (checkOpenAIConnectionStatus) {
          const connected = await checkOpenAIConnectionStatus();
          setOpenAIConnected(connected);
        } else {
          setOpenAIConnected(false);
        }
      } catch (error) {
        console.error('Failed to check OpenAI status:', error);
        setOpenAIConnected(false);
      } finally {
        setOpenAILoading(false);
      }
    };

    fetchOpenAIStatus();
  }, []);

  // Handle URL-based navigation
  useEffect(() => {
    try {
      const path = location.pathname;
      if (path === '/') {
        setActivePage('home');
      } else if (path === '/writing') {
        setActivePage('writing');
      } else if (path === '/dashboard') {
        setActivePage('dashboard');
      } else if (path === '/learning') {
        setActivePage('learning');
      } else if (path === '/pricing') {
        setActivePage('pricing');
      } else if (path === '/faq') {
        setActivePage('faq');
      } else if (path === '/about') {
        setActivePage('about');
      } else if (path === '/settings') {
        setActivePage('settings');
      } else if (path === '/evaluation') {
        setActivePage('evaluation');
      }
    } catch (error) {
      console.error('Navigation error:', error);
      setActivePage('home');
    }
  }, [location.pathname]);

  // Handle payment success from URL params
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(location.search);
      const paymentSuccess = urlParams.get('payment_success');
      const planType = urlParams.get('plan_type');
      
      if (paymentSuccess === 'true' && planType) {
        setShowPaymentSuccess(true);
        setPendingPaymentPlan(planType);
        navigate('/payment-success', { replace: true });
      }
    } catch (error) {
      console.error('Payment success handling error:', error);
    }
  }, [location.search, navigate]);

  // Safe handlers
  const handleNavigation = (page: string) => {
    try {
      setActivePage(page);
      navigate(`/${page === 'home' ? '' : page}`);
    } catch (error) {
      console.error('Navigation handler error:', error);
    }
  };

  const handleAuthSuccess = () => {
    try {
      setShowAuthModal(false);
    } catch (error) {
      console.error('Auth success handler error:', error);
    }
  };

  const handleSubmit = (submittedContent: string) => {
    try {
      console.log('Content submitted:', submittedContent);
    } catch (error) {
      console.error('Submit handler error:', error);
    }
  };

  const handleTextTypeChange = (newTextType: string) => {
    try {
      setTextType(newTextType);
      localStorage.setItem('selectedWritingType', newTextType);
    } catch (error) {
      console.error('Text type change error:', error);
    }
  };

  const handlePopupCompleted = () => {
    try {
      setPopupFlowCompleted(true);
    } catch (error) {
      console.error('Popup completed handler error:', error);
    }
  };

  // Show loading screen while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-white">
        <Routes>
          <Route path="/" element={
            <>
              <NavBar 
                onNavigate={handleNavigation}
                onAuthClick={() => setShowAuthModal(true)}
                user={user}
                onSignOut={authSignOut}
              />
              <HeroSection onNavigate={handleNavigation} />
              <FeaturesSection />
              <ToolsSection />
              <WritingTypesSection />
              <StudentSuccessSection />
              <HowItWorksSection />
              <EnhancedSuccessSection />
              <Footer onNavigate={handleNavigation} />
            </>
          } />
          
          <Route path="/pricing" element={
            <>
              <NavBar 
                onNavigate={handleNavigation}
                onAuthClick={() => setShowAuthModal(true)}
                user={user}
                onSignOut={authSignOut}
              />
              <PricingPage onNavigate={handleNavigation} />
              <Footer onNavigate={handleNavigation} />
            </>
          } />
          
          <Route path="/faq" element={
            <>
              <NavBar 
                onNavigate={handleNavigation}
                onAuthClick={() => setShowAuthModal(true)}
                user={user}
                onSignOut={authSignOut}
              />
              <FAQPage />
              <Footer onNavigate={handleNavigation} />
            </>
          } />
          
          <Route path="/about" element={
            <>
              <NavBar 
                onNavigate={handleNavigation}
                onAuthClick={() => setShowAuthModal(true)}
                user={user}
                onSignOut={authSignOut}
              />
              <AboutPage />
              <Footer onNavigate={handleNavigation} />
            </>
          } />

          <Route path="/settings" element={
            user ? (
              <>
                <NavBar 
                  onNavigate={handleNavigation}
                  onAuthClick={() => setShowAuthModal(true)}
                  user={user}
                  onSignOut={authSignOut}
                />
                <SettingsPage />
                <Footer onNavigate={handleNavigation} />
              </>
            ) : (
              <Navigate to="/" replace />
            )
          } />

          <Route path="/dashboard" element={
            user ? (
              emailVerified ? (
                paymentCompleted ? (
                  <>
                    <NavBar 
                      onNavigate={handleNavigation}
                      onAuthClick={() => setShowAuthModal(true)}
                      user={user}
                      onSignOut={authSignOut}
                    />
                    <Dashboard onNavigate={handleNavigation} />
                  </>
                ) : (
                  <Navigate to="/pricing" replace />
                )
              ) : (
                <EmailVerificationHandler />
              )
            ) : (
              <Navigate to="/" replace />
            )
          } />

          <Route path="/learning" element={
            user ? (
              emailVerified ? (
                paymentCompleted ? (
                  <>
                    <NavBar 
                      onNavigate={handleNavigation}
                      onAuthClick={() => setShowAuthModal(true)}
                      user={user}
                      onSignOut={authSignOut}
                    />
                    <LearningPage />
                  </>
                ) : (
                  <Navigate to="/pricing" replace />
                )
              ) : (
                <EmailVerificationHandler />
              )
            ) : (
              <Navigate to="/" replace />
            )
          } />

          <Route path="/evaluation" element={
            user ? (
              emailVerified ? (
                paymentCompleted ? (
                  <>
                    <NavBar 
                      onNavigate={handleNavigation}
                      onAuthClick={() => setShowAuthModal(true)}
                      user={user}
                      onSignOut={authSignOut}
                    />
                    <EvaluationPage />
                  </>
                ) : (
                  <Navigate to="/pricing" replace />
                )
              ) : (
                <EmailVerificationHandler />
              )
            ) : (
              <Navigate to="/" replace />
            )
          } />

          <Route path="/writing" element={
            <WritingAccessCheck user={user} emailVerified={emailVerified} paymentCompleted={paymentCompleted}>
              <div className="h-screen flex flex-col">
                <EnhancedHeader 
                  onNavigate={handleNavigation}
                  user={user}
                  onSignOut={authSignOut}
                  textType={textType}
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
                      prompt={currentPrompt || 'Write a creative story based on your imagination.'}
                      wordCount={wordCount}
                      onWordCountChange={setWordCount}
                      isTimerRunning={isTimerRunning}
                      elapsedTime={elapsedTime}
                      onStartTimer={startTimer}
                      onPauseTimer={pauseTimer}
                      onResetTimer={resetTimer}
                      focusMode={focusMode}
                      onToggleFocus={() => setFocusMode(!focusMode)}
                      showStructureGuide={showStructureGuide}
                      onToggleStructureGuide={() => setShowStructureGuide(!showStructureGuide)}
                      showTips={showTips}
                      onToggleTips={() => setShowTips(!showTips)}
                      analysis={analysis}
                      onAnalysisChange={setAnalysis}
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
        </Routes>

        {showAuthModal && (
          <AuthModal
            mode={authModalMode}
            onClose={() => setShowAuthModal(false)}
            onSuccess={handleAuthSuccess}
            onSwitchMode={(mode) => setAuthModalMode(mode)}
          />
        )}

        <AdminButton />
      </div>
    </ErrorBoundary>
  );
}

export default AppContent;