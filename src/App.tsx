import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import AppContent from './components/AppContent';
import SafeModeWrapper, { setupGlobalErrorHandling } from './components/SafeModeWrapper';

// Initialize global error handling
setupGlobalErrorHandling();

function App() {
  // Set up safe mode event listener
  React.useEffect(() => {
    const handleSafeModeEvent = (event: CustomEvent) => {
      console.warn('Safe mode requested:', event.detail);
      // The SafeModeWrapper will handle this automatically
    };

    window.addEventListener('enableSafeMode', handleSafeModeEvent as EventListener);
    
    return () => {
      window.removeEventListener('enableSafeMode', handleSafeModeEvent as EventListener);
    };
  }, []);

  return (
    <SafeModeWrapper>
      <ThemeProvider>
        <AuthProvider>
          <AppProvider>
            <Router>
              <AppContent />
            </Router>
          </AppProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeModeWrapper>
  );
}

export default App;