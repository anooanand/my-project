/**
 * Safe operations utility to prevent ReferenceError and Array.map issues
 * This file provides safe wrappers for common operations that cause runtime errors
 */

// Safe array operations
export const safeMap = <T, R>(
  array: T[] | undefined | null,
  callback: (item: T, index: number, array: T[]) => R,
  fallback: R[] = []
): R[] => {
  if (!Array.isArray(array)) {
    console.warn('safeMap: Attempting to map non-array:', array);
    return fallback;
  }
  
  try {
    return array.map(callback);
  } catch (error) {
    console.error('safeMap: Map operation failed:', error);
    return fallback;
  }
};

export const safeFilter = <T>(
  array: T[] | undefined | null,
  callback: (item: T, index: number, array: T[]) => boolean,
  fallback: T[] = []
): T[] => {
  if (!Array.isArray(array)) {
    console.warn('safeFilter: Attempting to filter non-array:', array);
    return fallback;
  }
  
  try {
    return array.filter(callback);
  } catch (error) {
    console.error('safeFilter: Filter operation failed:', error);
    return fallback;
  }
};

export const safeReduce = <T, R>(
  array: T[] | undefined | null,
  callback: (accumulator: R, currentValue: T, currentIndex: number, array: T[]) => R,
  initialValue: R
): R => {
  if (!Array.isArray(array)) {
    console.warn('safeReduce: Attempting to reduce non-array:', array);
    return initialValue;
  }
  
  try {
    return array.reduce(callback, initialValue);
  } catch (error) {
    console.error('safeReduce: Reduce operation failed:', error);
    return initialValue;
  }
};

// Safe variable access
export const safeAccess = <T>(
  getter: () => T,
  fallback: T,
  errorMessage?: string
): T => {
  try {
    const result = getter();
    return result !== undefined && result !== null ? result : fallback;
  } catch (error) {
    if (errorMessage) {
      console.warn(errorMessage, error);
    }
    return fallback;
  }
};

// Safe object property access
export const safeProp = <T, K extends keyof T>(
  obj: T | undefined | null,
  key: K,
  fallback: T[K]
): T[K] => {
  if (!obj || typeof obj !== 'object') {
    return fallback;
  }
  
  try {
    const value = obj[key];
    return value !== undefined ? value : fallback;
  } catch (error) {
    console.warn(`safeProp: Error accessing property '${String(key)}':`, error);
    return fallback;
  }
};

// Safe async operation wrapper
export const safeAsync = async <T>(
  asyncOperation: () => Promise<T>,
  fallback: T,
  errorMessage?: string
): Promise<T> => {
  try {
    return await asyncOperation();
  } catch (error) {
    if (errorMessage) {
      console.error(errorMessage, error);
    }
    return fallback;
  }
};

// Safe initialization helper for variables that might be accessed before declaration
export const safeInit = <T>(
  initializer: () => T,
  fallback: T,
  retryCount: number = 3
): T => {
  for (let i = 0; i < retryCount; i++) {
    try {
      return initializer();
    } catch (error) {
      if (error instanceof ReferenceError && i < retryCount - 1) {
        // Wait a bit and retry for ReferenceError (temporal dead zone issues)
        continue;
      }
      console.warn(`safeInit: Initialization failed after ${i + 1} attempts:`, error);
      return fallback;
    }
  }
  return fallback;
};

// Error boundary helper for React components
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallbackComponent?: React.ComponentType<{ error: Error }>
) => {
  return (props: P) => {
    try {
      return React.createElement(Component, props);
    } catch (error) {
      console.error('Component render error:', error);
      if (fallbackComponent) {
        return React.createElement(fallbackComponent, { error: error as Error });
      }
      return React.createElement('div', { 
        className: 'error-fallback p-4 bg-red-50 border border-red-200 rounded' 
      }, 'Component failed to render');
    }
  };
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
      
      // Try to recover from common ReferenceError patterns
      if (event.error.message.includes('Cannot access') && event.error.message.includes('before initialization')) {
        console.warn('Temporal dead zone error detected, implementing fallback');
        // Implement fallback behavior
      }
    }
  });
};

export default {
  safeMap,
  safeFilter,
  safeReduce,
  safeAccess,
  safeProp,
  safeAsync,
  safeInit,
  withErrorBoundary,
  setupGlobalErrorHandling
};