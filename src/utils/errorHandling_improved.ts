// Enhanced error handling utilities for the writing application

export interface ErrorDetails {
  code: string;
  message: string;
  userMessage: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'network' | 'validation' | 'auth' | 'api' | 'ui' | 'system';
  timestamp: string;
  context?: Record<string, any>;
  stack?: string;
}

export interface ErrorHandlerOptions {
  showToUser?: boolean;
  logToConsole?: boolean;
  logToService?: boolean;
  fallbackMessage?: string;
  retryable?: boolean;
  onRetry?: () => void;
}

class ErrorHandler {
  private errorLog: ErrorDetails[] = [];
  private maxLogSize = 100;

  // Predefined error mappings
  private errorMappings: Record<string, Partial<ErrorDetails>> = {
    // Network errors
    'NETWORK_ERROR': {
      code: 'NETWORK_ERROR',
      message: 'Network request failed',
      userMessage: 'Unable to connect to the server. Please check your internet connection and try again.',
      severity: 'medium',
      category: 'network'
    },
    'TIMEOUT_ERROR': {
      code: 'TIMEOUT_ERROR',
      message: 'Request timed out',
      userMessage: 'The request is taking longer than expected. Please try again.',
      severity: 'medium',
      category: 'network'
    },
    'SERVER_ERROR': {
      code: 'SERVER_ERROR',
      message: 'Server error occurred',
      userMessage: 'Our servers are experiencing issues. Please try again in a few moments.',
      severity: 'high',
      category: 'api'
    },

    // Authentication errors
    'AUTH_EXPIRED': {
      code: 'AUTH_EXPIRED',
      message: 'Authentication token expired',
      userMessage: 'Your session has expired. Please sign in again.',
      severity: 'medium',
      category: 'auth'
    },
    'AUTH_INVALID': {
      code: 'AUTH_INVALID',
      message: 'Invalid authentication credentials',
      userMessage: 'Invalid email or password. Please try again.',
      severity: 'medium',
      category: 'auth'
    },
    'AUTH_REQUIRED': {
      code: 'AUTH_REQUIRED',
      message: 'Authentication required',
      userMessage: 'Please sign in to access this feature.',
      severity: 'medium',
      category: 'auth'
    },

    // Validation errors
    'VALIDATION_ERROR': {
      code: 'VALIDATION_ERROR',
      message: 'Input validation failed',
      userMessage: 'Please check your input and try again.',
      severity: 'low',
      category: 'validation'
    },
    'REQUIRED_FIELD': {
      code: 'REQUIRED_FIELD',
      message: 'Required field missing',
      userMessage: 'Please fill in all required fields.',
      severity: 'low',
      category: 'validation'
    },

    // API errors
    'API_RATE_LIMIT': {
      code: 'API_RATE_LIMIT',
      message: 'API rate limit exceeded',
      userMessage: 'Too many requests. Please wait a moment before trying again.',
      severity: 'medium',
      category: 'api'
    },
    'API_QUOTA_EXCEEDED': {
      code: 'API_QUOTA_EXCEEDED',
      message: 'API quota exceeded',
      userMessage: 'You have reached your usage limit. Please upgrade your plan or try again later.',
      severity: 'high',
      category: 'api'
    },

    // UI errors
    'COMPONENT_ERROR': {
      code: 'COMPONENT_ERROR',
      message: 'Component rendering error',
      userMessage: 'Something went wrong with the page display. Please refresh and try again.',
      severity: 'medium',
      category: 'ui'
    },
    'FEATURE_UNAVAILABLE': {
      code: 'FEATURE_UNAVAILABLE',
      message: 'Feature temporarily unavailable',
      userMessage: 'This feature is temporarily unavailable. Please try again later.',
      severity: 'medium',
      category: 'ui'
    }
  };

  // Handle different types of errors
  handleError(
    error: Error | string | ErrorDetails,
    options: ErrorHandlerOptions = {}
  ): ErrorDetails {
    const {
      showToUser = true,
      logToConsole = true,
      logToService = false,
      fallbackMessage = 'An unexpected error occurred',
      retryable = false,
      onRetry
    } = options;

    let errorDetails: ErrorDetails;

    if (typeof error === 'string') {
      // Handle string errors
      const predefined = this.errorMappings[error];
      errorDetails = {
        code: error,
        message: predefined?.message || error,
        userMessage: predefined?.userMessage || fallbackMessage,
        severity: predefined?.severity || 'medium',
        category: predefined?.category || 'system',
        timestamp: new Date().toISOString(),
        ...predefined
      };
    } else if (error instanceof Error) {
      // Handle Error objects
      errorDetails = this.parseError(error, fallbackMessage);
    } else {
      // Handle ErrorDetails objects
      errorDetails = {
        timestamp: new Date().toISOString(),
        ...error
      };
    }

    // Log error
    this.logError(errorDetails, { logToConsole, logToService });

    // Show to user if requested
    if (showToUser && typeof window !== 'undefined') {
      this.showUserNotification(errorDetails, retryable, onRetry);
    }

    return errorDetails;
  }

  // Parse Error objects into ErrorDetails
  private parseError(error: Error, fallbackMessage: string): ErrorDetails {
    const message = error.message || 'Unknown error';
    let code = 'UNKNOWN_ERROR';
    let category: ErrorDetails['category'] = 'system';
    let severity: ErrorDetails['severity'] = 'medium';
    let userMessage = fallbackMessage;

    // Detect error types based on message patterns
    if (message.includes('fetch') || message.includes('network')) {
      code = 'NETWORK_ERROR';
      category = 'network';
      userMessage = this.errorMappings.NETWORK_ERROR.userMessage!;
    } else if (message.includes('timeout')) {
      code = 'TIMEOUT_ERROR';
      category = 'network';
      userMessage = this.errorMappings.TIMEOUT_ERROR.userMessage!;
    } else if (message.includes('401') || message.includes('unauthorized')) {
      code = 'AUTH_INVALID';
      category = 'auth';
      userMessage = this.errorMappings.AUTH_INVALID.userMessage!;
    } else if (message.includes('403') || message.includes('forbidden')) {
      code = 'AUTH_REQUIRED';
      category = 'auth';
      userMessage = this.errorMappings.AUTH_REQUIRED.userMessage!;
    } else if (message.includes('500') || message.includes('server')) {
      code = 'SERVER_ERROR';
      category = 'api';
      severity = 'high';
      userMessage = this.errorMappings.SERVER_ERROR.userMessage!;
    } else if (message.includes('validation') || message.includes('invalid')) {
      code = 'VALIDATION_ERROR';
      category = 'validation';
      severity = 'low';
      userMessage = this.errorMappings.VALIDATION_ERROR.userMessage!;
    }

    return {
      code,
      message,
      userMessage,
      severity,
      category,
      timestamp: new Date().toISOString(),
      stack: error.stack,
      context: {
        name: error.name,
        constructor: error.constructor.name
      }
    };
  }

  // Log error to various destinations
  private logError(
    errorDetails: ErrorDetails,
    options: { logToConsole: boolean; logToService: boolean }
  ) {
    // Add to internal log
    this.errorLog.unshift(errorDetails);
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }

    // Console logging
    if (options.logToConsole) {
      const logMethod = this.getConsoleMethod(errorDetails.severity);
      logMethod(`[${errorDetails.category.toUpperCase()}] ${errorDetails.code}:`, {
        message: errorDetails.message,
        userMessage: errorDetails.userMessage,
        timestamp: errorDetails.timestamp,
        context: errorDetails.context,
        stack: errorDetails.stack
      });
    }

    // Service logging (in production, this would send to an error tracking service)
    if (options.logToService) {
      this.logToExternalService(errorDetails);
    }

    // Store in localStorage for debugging
    try {
      const storedErrors = JSON.parse(localStorage.getItem('app_error_log') || '[]');
      storedErrors.unshift(errorDetails);
      // Keep only last 50 errors in localStorage
      if (storedErrors.length > 50) {
        storedErrors.splice(50);
      }
      localStorage.setItem('app_error_log', JSON.stringify(storedErrors));
    } catch (e) {
      console.warn('Could not store error in localStorage:', e);
    }
  }

  // Get appropriate console method based on severity
  private getConsoleMethod(severity: ErrorDetails['severity']) {
    switch (severity) {
      case 'low':
        return console.info;
      case 'medium':
        return console.warn;
      case 'high':
      case 'critical':
        return console.error;
      default:
        return console.log;
    }
  }

  // Show user notification (this would integrate with your notification system)
  private showUserNotification(
    errorDetails: ErrorDetails,
    retryable: boolean,
    onRetry?: () => void
  ) {
    // This is a placeholder - in a real app, you'd integrate with your notification system
    if (typeof window !== 'undefined' && (window as any).showNotification) {
      (window as any).showNotification({
        type: this.getNotificationType(errorDetails.severity),
        title: this.getErrorTitle(errorDetails.category),
        message: errorDetails.userMessage,
        action: retryable && onRetry ? {
          label: 'Retry',
          onClick: onRetry
        } : undefined
      });
    } else {
      // Fallback to console for development
      console.warn('User notification:', errorDetails.userMessage);
    }
  }

  // Map severity to notification type
  private getNotificationType(severity: ErrorDetails['severity']): string {
    switch (severity) {
      case 'low':
        return 'info';
      case 'medium':
        return 'warning';
      case 'high':
      case 'critical':
        return 'error';
      default:
        return 'info';
    }
  }

  // Get user-friendly error title
  private getErrorTitle(category: ErrorDetails['category']): string {
    switch (category) {
      case 'network':
        return 'Connection Issue';
      case 'auth':
        return 'Authentication Required';
      case 'validation':
        return 'Input Error';
      case 'api':
        return 'Service Issue';
      case 'ui':
        return 'Display Issue';
      case 'system':
        return 'System Error';
      default:
        return 'Error';
    }
  }

  // Log to external service (placeholder)
  private logToExternalService(errorDetails: ErrorDetails) {
    // In a real application, you would send this to services like:
    // - Sentry
    // - LogRocket
    // - Bugsnag
    // - Custom logging endpoint
    
    console.log('Would log to external service:', errorDetails);
  }

  // Utility methods
  getErrorLog(): ErrorDetails[] {
    return [...this.errorLog];
  }

  clearErrorLog(): void {
    this.errorLog = [];
    try {
      localStorage.removeItem('app_error_log');
    } catch (e) {
      console.warn('Could not clear error log from localStorage:', e);
    }
  }

  getErrorsByCategory(category: ErrorDetails['category']): ErrorDetails[] {
    return this.errorLog.filter(error => error.category === category);
  }

  getErrorsBySeverity(severity: ErrorDetails['severity']): ErrorDetails[] {
    return this.errorLog.filter(error => error.severity === severity);
  }

  // Async error handler for promises
  async handleAsyncOperation<T>(
    operation: () => Promise<T>,
    options: ErrorHandlerOptions = {}
  ): Promise<T | null> {
    try {
      return await operation();
    } catch (error) {
      this.handleError(error as Error, options);
      return null;
    }
  }

  // Retry mechanism
  async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    delay = 1000,
    options: ErrorHandlerOptions = {}
  ): Promise<T | null> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          this.handleError(lastError, {
            ...options,
            showToUser: true
          });
          break;
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }

    return null;
  }
}

// Create singleton instance
const errorHandler = new ErrorHandler();

// Export convenience functions
export const handleError = (error: Error | string | ErrorDetails, options?: ErrorHandlerOptions) =>
  errorHandler.handleError(error, options);

export const handleAsyncError = <T>(operation: () => Promise<T>, options?: ErrorHandlerOptions) =>
  errorHandler.handleAsyncOperation(operation, options);

export const retryOperation = <T>(
  operation: () => Promise<T>,
  maxRetries?: number,
  delay?: number,
  options?: ErrorHandlerOptions
) => errorHandler.retryOperation(operation, maxRetries, delay, options);

export const getErrorLog = () => errorHandler.getErrorLog();
export const clearErrorLog = () => errorHandler.clearErrorLog();
export const getErrorsByCategory = (category: ErrorDetails['category']) =>
  errorHandler.getErrorsByCategory(category);
export const getErrorsBySeverity = (severity: ErrorDetails['severity']) =>
  errorHandler.getErrorsBySeverity(severity);

// React hook for error handling
export const useErrorHandler = () => {
  return {
    handleError: (error: Error | string | ErrorDetails, options?: ErrorHandlerOptions) =>
      errorHandler.handleError(error, options),
    handleAsyncError: <T>(operation: () => Promise<T>, options?: ErrorHandlerOptions) =>
      errorHandler.handleAsyncOperation(operation, options),
    retryOperation: <T>(
      operation: () => Promise<T>,
      maxRetries?: number,
      delay?: number,
      options?: ErrorHandlerOptions
    ) => errorHandler.retryOperation(operation, maxRetries, delay, options),
    getErrorLog: () => errorHandler.getErrorLog(),
    clearErrorLog: () => errorHandler.clearErrorLog()
  };
};

export default errorHandler;
