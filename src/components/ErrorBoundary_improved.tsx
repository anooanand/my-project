import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, Mail } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to external service (in a real app, you'd send this to your error tracking service)
    this.logErrorToService(error, errorInfo);
  }

  logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // In a real application, you would send this to an error tracking service
    // like Sentry, LogRocket, or Bugsnag
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      errorId: this.state.errorId
    };

    // For now, just log to console
    console.log('Error logged:', errorData);
    
    // Store in localStorage for debugging
    try {
      const existingErrors = JSON.parse(localStorage.getItem('app_errors') || '[]');
      existingErrors.push(errorData);
      // Keep only last 10 errors
      if (existingErrors.length > 10) {
        existingErrors.splice(0, existingErrors.length - 10);
      }
      localStorage.setItem('app_errors', JSON.stringify(existingErrors));
    } catch (e) {
      console.warn('Could not store error in localStorage:', e);
    }
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  copyErrorDetails = () => {
    const errorDetails = `
Error ID: ${this.state.errorId}
Error: ${this.state.error?.message}
Stack: ${this.state.error?.stack}
Component Stack: ${this.state.errorInfo?.componentStack}
Timestamp: ${new Date().toISOString()}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}
    `.trim();

    navigator.clipboard.writeText(errorDetails).then(() => {
      alert('Error details copied to clipboard');
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = errorDetails;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Error details copied to clipboard');
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="p-6 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-700">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-red-900 dark:text-red-200">
                    Oops! Something went wrong
                  </h1>
                  <p className="text-red-700 dark:text-red-300">
                    We encountered an unexpected error while loading this page.
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    What happened?
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    The application encountered an error and couldn't continue. This might be due to:
                  </p>
                  <ul className="mt-2 text-sm text-gray-600 dark:text-gray-300 list-disc list-inside space-y-1">
                    <li>A temporary network issue</li>
                    <li>An unexpected data format</li>
                    <li>A browser compatibility issue</li>
                    <li>A temporary server problem</li>
                  </ul>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                  <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
                    What can you do?
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button
                      onClick={this.handleRetry}
                      className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <RefreshCw className="h-4 w-4" />
                      <span>Try Again</span>
                    </button>
                    
                    <button
                      onClick={this.handleReload}
                      className="flex items-center justify-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <RefreshCw className="h-4 w-4" />
                      <span>Reload Page</span>
                    </button>
                    
                    <button
                      onClick={this.handleGoHome}
                      className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Home className="h-4 w-4" />
                      <span>Go Home</span>
                    </button>
                  </div>
                </div>

                {/* Error Details (for debugging) */}
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <summary className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
                      Error Details (Development Mode)
                    </summary>
                    <div className="mt-3 space-y-2">
                      <div>
                        <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300">Error ID:</h4>
                        <code className="text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-600 p-1 rounded">
                          {this.state.errorId}
                        </code>
                      </div>
                      <div>
                        <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300">Message:</h4>
                        <code className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-1 rounded">
                          {this.state.error.message}
                        </code>
                      </div>
                      <div>
                        <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300">Stack Trace:</h4>
                        <pre className="text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-600 p-2 rounded overflow-x-auto max-h-32">
                          {this.state.error.stack}
                        </pre>
                      </div>
                      <button
                        onClick={this.copyErrorDetails}
                        className="flex items-center space-x-2 px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-xs hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                      >
                        <Bug className="h-3 w-3" />
                        <span>Copy Error Details</span>
                      </button>
                    </div>
                  </details>
                )}

                {/* Support Information */}
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-700">
                  <h3 className="text-sm font-medium text-yellow-900 dark:text-yellow-200 mb-2">
                    Still having trouble?
                  </h3>
                  <p className="text-sm text-yellow-800 dark:text-yellow-300 mb-3">
                    If the error persists, please contact our support team with the error ID: 
                    <code className="ml-1 px-1 bg-yellow-100 dark:bg-yellow-800 rounded text-xs">
                      {this.state.errorId}
                    </code>
                  </p>
                  <a
                    href="mailto:support@aiinstachat.com?subject=Error Report&body=Error ID: ${this.state.errorId}"
                    className="inline-flex items-center space-x-2 px-3 py-1 bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 rounded text-sm hover:bg-yellow-300 dark:hover:bg-yellow-700 transition-colors"
                  >
                    <Mail className="h-3 w-3" />
                    <span>Contact Support</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}