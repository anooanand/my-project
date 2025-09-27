/**
 * Safe Mode Wrapper - Emergency fallback for critical errors
 * This component provides a safe fallback when the main application encounters ReferenceErrors
 */
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackComponent?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  safeMode: boolean;
}

class SafeModeWrapper extends Component<Props, State> {
  private errorCount = 0;
  private maxErrors = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      safeMode: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.errorCount++;
    
    console.error('SafeModeWrapper caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
      safeMode: this.errorCount >= this.maxErrors
    });

    // Check for specific ReferenceError patterns
    if (error instanceof ReferenceError) {
      console.error('ReferenceError detected:', error.message);
      
      if (error.message.includes('Cannot access') && error.message.includes('before initialization')) {
        console.warn('Temporal dead zone error detected, enabling safe mode');
        this.setState({ safeMode: true });
      }
    }

    // Report error to monitoring service if available
    if (typeof window !== 'undefined' && (window as any).errorReporting) {
      (window as any).errorReporting.captureException(error, {
        extra: errorInfo,
        tags: {
          component: 'SafeModeWrapper',
          errorCount: this.errorCount
        }
      });
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      safeMode: false
    });
    this.errorCount = 0;
  };

  enableSafeMode = () => {
    this.setState({ safeMode: true });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallbackComponent) {
        return React.createElement(this.props.fallbackComponent, {
          error: this.state.error!,
          resetError: this.resetError
        });
      }

      if (this.state.safeMode) {
        return <SafeModeInterface error={this.state.error!} resetError={this.resetError} />;
      }

      return <ErrorFallback error={this.state.error!} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

// Error fallback component
const ErrorFallback: React.FC<{ error: Error; resetError: () => void }> = ({ error, resetError }) => {
  return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <AlertTriangle className="h-8 w-8 text-red-500" />
          <h1 className="text-xl font-bold text-gray-900">Something went wrong</h1>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-3">
            The application encountered an unexpected error. This might be due to a temporary issue.
          </p>
          
          <details className="mb-4">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
              Technical details
            </summary>
            <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-gray-700 overflow-auto max-h-32">
              {error.message}
            </div>
          </details>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={resetError}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Try Again</span>
          </button>
          
          <button
            onClick={() => window.location.href = '/'}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            <Home className="h-4 w-4" />
            <span>Go Home</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Safe mode interface - minimal functionality
const SafeModeInterface: React.FC<{ error: Error; resetError: () => void }> = ({ error, resetError }) => {
  const [text, setText] = React.useState('');
  const [wordCount, setWordCount] = React.useState(0);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    
    // Safe word count calculation
    try {
      const words = newText.trim() ? newText.trim().split(/\s+/).length : 0;
      setWordCount(words);
    } catch (err) {
      setWordCount(0);
    }
  };

  return (
    <div className="min-h-screen bg-yellow-50">
      {/* Safe mode header */}
      <div className="bg-yellow-100 border-b border-yellow-200 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-6 w-6 text-yellow-600" />
            <div>
              <h1 className="text-lg font-semibold text-yellow-800">Safe Mode</h1>
              <p className="text-sm text-yellow-700">
                Basic writing functionality only. Advanced features disabled.
              </p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={resetError}
              className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 transition-colors"
            >
              Exit Safe Mode
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>

      {/* Safe mode content */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Basic Text Editor</h2>
            <p className="text-sm text-gray-600">
              Write your content here. Word count: {wordCount}
            </p>
          </div>
          
          <div className="p-4">
            <textarea
              value={text}
              onChange={handleTextChange}
              placeholder="Start writing here..."
              className="w-full h-96 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Words: {wordCount} | Characters: {text.length}
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    try {
                      navigator.clipboard.writeText(text);
                      alert('Text copied to clipboard!');
                    } catch (err) {
                      console.error('Copy failed:', err);
                    }
                  }}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                >
                  Copy Text
                </button>
                
                <button
                  onClick={() => {
                    if (confirm('Clear all text?')) {
                      setText('');
                      setWordCount(0);
                    }
                  }}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Error details */}
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Error Information</h3>
          <div className="text-xs font-mono text-gray-600 bg-gray-100 p-3 rounded overflow-auto max-h-32">
            {error.message}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Safe mode was activated to prevent further errors. You can continue writing with basic functionality.
          </p>
        </div>
      </div>
    </div>
  );
};

// Global error handler setup
export const setupGlobalErrorHandling = () => {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    event.preventDefault();
  });

  // Handle general errors
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    
    // Check for specific ReferenceError patterns
    if (event.error instanceof ReferenceError) {
      console.error('ReferenceError detected:', event.error.message);
      
      if (event.error.message.includes('Cannot access') && event.error.message.includes('before initialization')) {
        console.warn('Temporal dead zone error detected');
        
        // Try to trigger safe mode if available
        const safeModeEvent = new CustomEvent('enableSafeMode', {
          detail: { error: event.error }
        });
        window.dispatchEvent(safeModeEvent);
      }
    }
  });
};

export default SafeModeWrapper;