import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';

// Import existing components
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import AuthModal from './components/AuthModal';
import PricingPage from './components/PricingPage';

// Import the new fixed components
import Dashboard from './components/Dashboard';
import TextTypeSelection from './components/TextTypeSelection';
import WritingInterface from './components/WritingInterface';

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

// App Content Component
function AppContent() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navbar />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/write/select-type" element={
          <ProtectedRoute>
            <TextTypeSelection />
          </ProtectedRoute>
        } />
        
        <Route path="/write/editor" element={
          <ProtectedRoute>
            <WritingInterface />
          </ProtectedRoute>
        } />
        
        {/* Legacy route for backward compatibility */}
        <Route path="/write" element={
          <ProtectedRoute>
            <TextTypeSelection />
          </ProtectedRoute>
        } />
        
        {/* Practice routes (placeholder for now) */}
        <Route path="/practice" element={
          <ProtectedRoute>
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Practice Exams Coming Soon!
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  This feature is under development.
                </p>
                <button
                  onClick={() => window.history.back()}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Go Back
                </button>
              </div>
            </div>
          </ProtectedRoute>
        } />
        
        {/* Redirect authenticated users from home to dashboard */}
        <Route path="/" element={
          user ? <Navigate to="/dashboard" replace /> : <LandingPage />
        } />
        
        {/* Catch all route */}
        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Page Not Found
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                The page you're looking for doesn't exist.
              </p>
              <button
                onClick={() => window.location.href = user ? '/dashboard' : '/'}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {user ? 'Go to Dashboard' : 'Go Home'}
              </button>
            </div>
          </div>
        } />
      </Routes>
      
      <AuthModal />
    </div>
  );
}

// Main App Component
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppProvider>
          <Router>
            <AppContent />
          </Router>
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
