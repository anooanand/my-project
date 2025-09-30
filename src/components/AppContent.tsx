// CORRECT: AppContent Component with Prompt Handling
// This is the correct AppContent code that should replace src/components/AppContent.tsx

import React, { useState, useEffect } from 'react';
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
  
  // FIXED: Add prompt state and enhanced writing states
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [showStructureGuide, setShowStructureGuide] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  
  // New state for popup flow completion
  const [popupFlowCompleted, setPopupFlowCompleted] = useState(false); 
  const [hasSignedIn, setHasSignedIn] = useState(false);
  
  // Panel state for attached chat
  const [panelVisible, setPanelVisible] = useState(true);
  const [openAIConnected, setOpenAIConnected] = useState<boolean | null>(null);
  const [openAILoading, setOpenAILoading] = useState<boolean>(true);

  // FIXED: Load prompt from localStorage on component mount and listen for prompt generation
  useEffect(() => {
    const loadPromptFromStorage = () => {
      try {
        // Check for generated prompt first, then custom prompt
        const generatedPrompt = localStorage.getItem("generatedPrompt");
        const customPrompt = localStorage.getItem("customPrompt");
        const storedTextType = localStorage.getItem('selectedWritingType');
        
        if (generatedPrompt) {
          console.log('📝 AppContent: Loading generated prompt from localStorage:', generatedPrompt);
          setCurrentPrompt(generatedPrompt);
        } else if (customPrompt) {
          console.log('📝 AppContent: Loading custom prompt from localStorage:', customPrompt);
          setCurrentPrompt(customPrompt);
        }
        
        if (storedTextType) {
          console.log('📝 AppContent: Loading text type from localStorage:', storedTextType);
          setTextType(storedTextType);
        }
      } catch (error) {
        console.error('AppContent: Error loading prompt from localStorage:', error);
      }
    };

    // Load prompt on mount
    loadPromptFromStorage();

    // Listen for prompt generation events
    const handlePromptGenerated = (event: CustomEvent) => {
      console.log('📝 AppContent: Received promptGenerated event:', event.detail);
      if (event.detail.prompt) {
        setCurrentPrompt(event.detail.prompt);
        setTextType(event.detail.textType || 'narrative');
      }
    };

    // Listen for storage changes (in case prompt is updated in another tab/component)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'generatedPrompt' || event.key === 'customPrompt') {
        console.log('📝 AppContent: Storage changed, reloading prompt');
        loadPromptFromStorage();
      }
    };

    window.addEventListener('promptGenerated', handlePromptGenerated as EventListener);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('promptGenerated', handlePromptGenerated as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // FIXED: Timer functions
  const startTimer = () => {
    setIsTimerRunning(true);
  };

  const pauseTimer = () => {
    setIsTimerRunning(false);
  };

  const resetTimer = () => {
    setElapsedTime(0);
    setIsTimerRunning(false);
  };

  // FIXED: Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning]);

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
      try {
        const connected = await checkOpenAIConnectionStatus();
        setOpenAIConnected(connected);
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
  }, [location.pathname]);

  // Handle payment success from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const paymentSuccess = urlParams.get('payment_success');
    const planType = urlParams.get('plan_type');
    
    if (paymentSuccess === 'true' && planType) {
      setShowPaymentSuccess(true);
      setPendingPaymentPlan(planType);
      // Clean up URL
      navigate('/payment-success', { replace: true });
    }
  }, [location.search, navigate]);

  const handleNavigation = (page: string) => {
    setActivePage(page);
    navigate(`/${page === 'home' ? '' : page}`);
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    // Don't automatically navigate - let user choose where to go
  };

  const handleSubmit = (submittedContent: string) => {
    console.log('Content submitted:', submittedContent);
    // Handle submission logic here
  };

  const handleTextTypeChange = (newTextType: string) => {
    setTextType(newTextType);
    localStorage.setItem('selectedWritingType', newTextType);
  };

  const handlePopupCompleted = () => {
    setPopupFlowCompleted(true);
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
                      prompt={currentPrompt}
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

        {showHelpCenter && (
          <HelpCenter onClose={() => setShowHelpCenter(false)} />
        )}

        {showPlanningTool && (
          <PlanningToolModal onClose={() => setShowPlanningTool(false)} />
        )}

        <AdminButton />
      </div>
    </ErrorBoundary>
  );
}

export default AppContent;