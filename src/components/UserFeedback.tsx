import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X, Loader } from 'lucide-react';

// Types
type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface LoadingState {
  id: string;
  message: string;
  progress?: number;
}

interface FeedbackContextType {
  notifications: Notification[];
  loadingStates: LoadingState[];
  showNotification: (notification: Omit<Notification, 'id'>) => string;
  hideNotification: (id: string) => void;
  showLoading: (message: string, id?: string) => string;
  hideLoading: (id: string) => void;
  updateLoadingProgress: (id: string, progress: number) => void;
  clearAll: () => void;
}

// Context
const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

// Provider Component
export const FeedbackProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingStates, setLoadingStates] = useState<LoadingState[]>([]);

  const showNotification = (notification: Omit<Notification, 'id'>): string => {
    const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration ?? 5000
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-hide notification if not persistent
    if (!notification.persistent && newNotification.duration) {
      setTimeout(() => {
        hideNotification(id);
      }, newNotification.duration);
    }

    return id;
  };

  const hideNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const showLoading = (message: string, id?: string): string => {
    const loadingId = id || `loading_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newLoading: LoadingState = {
      id: loadingId,
      message
    };

    setLoadingStates(prev => {
      const existing = prev.find(l => l.id === loadingId);
      if (existing) {
        return prev.map(l => l.id === loadingId ? newLoading : l);
      }
      return [...prev, newLoading];
    });

    return loadingId;
  };

  const hideLoading = (id: string) => {
    setLoadingStates(prev => prev.filter(l => l.id !== id));
  };

  const updateLoadingProgress = (id: string, progress: number) => {
    setLoadingStates(prev => 
      prev.map(l => l.id === id ? { ...l, progress } : l)
    );
  };

  const clearAll = () => {
    setNotifications([]);
    setLoadingStates([]);
  };

  const value: FeedbackContextType = {
    notifications,
    loadingStates,
    showNotification,
    hideNotification,
    showLoading,
    hideLoading,
    updateLoadingProgress,
    clearAll
  };

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <NotificationContainer />
      <LoadingOverlay />
    </FeedbackContext.Provider>
  );
};

// Hook to use feedback context
export const useFeedback = (): FeedbackContextType => {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
};

// Notification Container Component
const NotificationContainer: React.FC = () => {
  const { notifications, hideNotification } = useFeedback();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClose={() => hideNotification(notification.id)}
        />
      ))}
    </div>
  );
};

// Individual Notification Component
const NotificationItem: React.FC<{
  notification: Notification;
  onClose: () => void;
}> = ({ notification, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for animation
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700';
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700';
    }
  };

  return (
    <div
      className={`transform transition-all duration-300 ease-in-out ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className={`p-4 rounded-lg border shadow-lg ${getBackgroundColor()}`}>
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              {notification.title}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {notification.message}
            </p>
            {notification.action && (
              <button
                onClick={notification.action.onClick}
                className="mt-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
              >
                {notification.action.label}
              </button>
            )}
          </div>
          <button
            onClick={handleClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Loading Overlay Component
const LoadingOverlay: React.FC = () => {
  const { loadingStates } = useFeedback();

  if (loadingStates.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
        {loadingStates.map((loading, index) => (
          <div key={loading.id} className={index > 0 ? 'mt-4 pt-4 border-t border-gray-200 dark:border-gray-600' : ''}>
            <div className="flex items-center space-x-3">
              <Loader className="h-6 w-6 text-blue-500 animate-spin" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {loading.message}
                </p>
                {loading.progress !== undefined && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                      <span>Progress</span>
                      <span>{Math.round(loading.progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${loading.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Utility functions for common feedback patterns
export const feedbackUtils = {
  // Success notifications
  success: (title: string, message: string, action?: Notification['action']) => {
    const { showNotification } = useFeedback();
    return showNotification({
      type: 'success',
      title,
      message,
      action
    });
  },

  // Error notifications
  error: (title: string, message: string, persistent = false) => {
    const { showNotification } = useFeedback();
    return showNotification({
      type: 'error',
      title,
      message,
      persistent,
      duration: persistent ? undefined : 8000
    });
  },

  // Warning notifications
  warning: (title: string, message: string) => {
    const { showNotification } = useFeedback();
    return showNotification({
      type: 'warning',
      title,
      message,
      duration: 6000
    });
  },

  // Info notifications
  info: (title: string, message: string) => {
    const { showNotification } = useFeedback();
    return showNotification({
      type: 'info',
      title,
      message
    });
  },

  // Loading with progress
  loadingWithProgress: (message: string) => {
    const { showLoading, updateLoadingProgress, hideLoading } = useFeedback();
    const id = showLoading(message);
    
    return {
      updateProgress: (progress: number) => updateLoadingProgress(id, progress),
      finish: () => hideLoading(id)
    };
  },

  // Simple loading
  loading: (message: string) => {
    const { showLoading, hideLoading } = useFeedback();
    const id = showLoading(message);
    
    return {
      finish: () => hideLoading(id)
    };
  }
};

// Higher-order component for error handling
export const withErrorHandling = <P extends object>(
  Component: React.ComponentType<P>,
  errorMessage = 'An error occurred'
) => {
  return React.forwardRef<any, P>((props, ref) => {
    const { showNotification } = useFeedback();

    const handleError = (error: Error) => {
      console.error('Component error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: errorMessage,
        persistent: false
      });
    };

    return (
      <ErrorBoundary onError={handleError}>
        <Component {...props} ref={ref} />
      </ErrorBoundary>
    );
  });
};

// Input validation feedback hook
export const useInputValidation = () => {
  const { showNotification } = useFeedback();

  const validateAndNotify = (
    value: string,
    rules: {
      required?: boolean;
      minLength?: number;
      maxLength?: number;
      pattern?: RegExp;
      custom?: (value: string) => string | null;
    },
    fieldName = 'Field'
  ): boolean => {
    if (rules.required && !value.trim()) {
      showNotification({
        type: 'warning',
        title: 'Validation Error',
        message: `${fieldName} is required`,
        duration: 3000
      });
      return false;
    }

    if (rules.minLength && value.length < rules.minLength) {
      showNotification({
        type: 'warning',
        title: 'Validation Error',
        message: `${fieldName} must be at least ${rules.minLength} characters`,
        duration: 3000
      });
      return false;
    }

    if (rules.maxLength && value.length > rules.maxLength) {
      showNotification({
        type: 'warning',
        title: 'Validation Error',
        message: `${fieldName} must be no more than ${rules.maxLength} characters`,
        duration: 3000
      });
      return false;
    }

    if (rules.pattern && !rules.pattern.test(value)) {
      showNotification({
        type: 'warning',
        title: 'Validation Error',
        message: `${fieldName} format is invalid`,
        duration: 3000
      });
      return false;
    }

    if (rules.custom) {
      const customError = rules.custom(value);
      if (customError) {
        showNotification({
          type: 'warning',
          title: 'Validation Error',
          message: customError,
          duration: 3000
        });
        return false;
      }
    }

    return true;
  };

  return { validateAndNotify };
};
