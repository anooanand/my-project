import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './darkmode.css';
import './styles/kid-theme.css';
import './components/layout-fix-enhanced.css'; // Import the enhanced layout fix
import { AuthProvider } from './contexts/AuthContext';
import { LearningProvider } from './contexts/LearningContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <LearningProvider>
        <App />
      </LearningProvider>
    </AuthProvider>
  </React.StrictMode>
);
