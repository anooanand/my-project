import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';

interface AnalysisCache {
  [key: string]: {
    result: any;
    timestamp: number;
    contentHash: string;
  };
}

interface PerformanceMetrics {
  analysisTime: number;
  cacheHits: number;
  cacheMisses: number;
  totalAnalyses: number;
}

interface UseOptimizedWritingAnalysisOptions {
  debounceDelay?: number;
  cacheTimeout?: number;
  enableVirtualScrolling?: boolean;
  maxCacheSize?: number;
  enablePerformanceMetrics?: boolean;
}

interface AnalysisResult {
  grammarErrors: any[];
  overallScore: number;
  suggestions: string[];
  achievements: string[];
  nswAnalysis?: any;
  performanceMetrics?: PerformanceMetrics;
}

export const useOptimizedWritingAnalysis = (
  content: string,
  textType: string,
  options: UseOptimizedWritingAnalysisOptions = {}
) => {
  const {
    debounceDelay = 1000,
    cacheTimeout = 300000, // 5 minutes
    enableVirtualScrolling = true,
    maxCacheSize = 50,
    enablePerformanceMetrics = false
  } = options;

  // State management
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    analysisTime: 0,
    cacheHits: 0,
    cacheMisses: 0,
    totalAnalyses: 0
  });

  // Refs for performance optimization
  const cacheRef = useRef<AnalysisCache>({});
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastAnalysisRef = useRef<string>('');
  const analysisTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Generate content hash for caching
  const generateContentHash = useCallback((text: string, type: string): string => {
    const combined = `${text}_${type}`;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }, []);

  // Cache management
  const getCachedResult = useCallback((contentHash: string): any | null => {
    const cached = cacheRef.current[contentHash];
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > cacheTimeout;
    if (isExpired) {
      delete cacheRef.current[contentHash];
      return null;
    }

    return cached.result;
  }, [cacheTimeout]);

  const setCachedResult = useCallback((contentHash: string, result: any) => {
    // Implement LRU cache eviction
    const cacheKeys = Object.keys(cacheRef.current);
    if (cacheKeys.length >= maxCacheSize) {
      // Remove oldest entries
      const sortedEntries = cacheKeys
        .map(key => ({ key, timestamp: cacheRef.current[key].timestamp }))
        .sort((a, b) => a.timestamp - b.timestamp);
      
      const toRemove = sortedEntries.slice(0, Math.floor(maxCacheSize * 0.3));
      toRemove.forEach(entry => delete cacheRef.current[entry.key]);
    }

    cacheRef.current[contentHash] = {
      result,
      timestamp: Date.now(),
      contentHash
    };
  }, [maxCacheSize]);

  // Optimized grammar checking function
  const performGrammarCheck = useCallback(async (text: string): Promise<any> => {
    const startTime = performance.now();
    
    try {
      // Simulate grammar checking with realistic processing time
      await new Promise(resolve => setTimeout(resolve, Math.min(text.length * 2, 1000)));
      
      const words = text.trim().split(/\s+/).filter(word => word.length > 0);
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
      
      // Simulate error detection
      const errors = [];
      const errorPatterns = [
        { pattern: /\bteh\b/gi, type: 'spelling', message: 'Spelling error: "teh" should be "the"' },
        { pattern: /\bi\b/g, type: 'capitalization', message: 'Capitalize "I"' },
        { pattern: /\.\s*[a-z]/g, type: 'capitalization', message: 'Capitalize after period' },
        { pattern: /\s{2,}/g, type: 'spacing', message: 'Multiple spaces detected' },
        { pattern: /[.]{2,}/g, type: 'punctuation', message: 'Multiple periods detected' }
      ];

      errorPatterns.forEach((pattern, index) => {
        const matches = Array.from(text.matchAll(pattern.pattern));
        matches.forEach((match, matchIndex) => {
          if (match.index !== undefined) {
            errors.push({
              id: `error_${index}_${matchIndex}`,
              type: pattern.type,
              message: pattern.message,
              startPos: match.index,
              endPos: match.index + match[0].length,
              originalText: match[0],
              suggestions: getSuggestions(pattern.type, match[0]),
              color: getErrorColor(pattern.type),
              underlineStyle: getUnderlineStyle(pattern.type)
            });
          }
        });
      });

      // Calculate overall score
      const errorCount = errors.length;
      const wordCount = words.length;
      const errorRate = wordCount > 0 ? errorCount / wordCount : 0;
      const overallScore = Math.max(0, Math.round(100 - (errorRate * 100)));

      // Generate suggestions
      const suggestions = generateSuggestions(text, errors);
      
      // Generate achievements
      const achievements = generateAchievements(overallScore, errorCount, wordCount);

      const endTime = performance.now();
      const analysisTime = endTime - startTime;

      return {
        grammarErrors: errors,
        overallScore,
        suggestions,
        achievements,
        analysisTime,
        wordCount,
        errorCount
      };
    } catch (error) {
      console.error('Grammar check failed:', error);
      throw error;
    }
  }, []);

  // Helper functions for error processing
  const getSuggestions = (type: string, text: string): string[] => {
    const suggestionMap: Record<string, string[]> = {
      spelling: ['the'],
      capitalization: [text.toUpperCase()],
      spacing: [text.replace(/\s+/g, ' ')],
      punctuation: ['.']
    };
    return suggestionMap[type] || [];
  };

  const getErrorColor = (type: string): string => {
    const colorMap: Record<string, string> = {
      spelling: '#ef4444',
      grammar: '#3b82f6',
      punctuation: '#f59e0b',
      capitalization: '#8b5cf6',
      spacing: '#10b981'
    };
    return colorMap[type] || '#6b7280';
  };

  const getUnderlineStyle = (type: string): string => {
    const styleMap: Record<string, string> = {
      spelling: 'wavy',
      grammar: 'solid',
      punctuation: 'dashed',
      capitalization: 'dotted',
      spacing: 'double'
    };
    return styleMap[type] || 'solid';
  };

  const generateSuggestions = (text: string, errors: any[]): string[] => {
    const suggestions = [];
    
    if (errors.length === 0) {
      suggestions.push("Excellent! No errors detected. Keep up the great writing!");
    } else if (errors.length <= 3) {
      suggestions.push("Good work! Just a few minor issues to fix.");
    } else {
      suggestions.push("Consider proofreading your work to catch more errors.");
    }

    if (text.length < 100) {
      suggestions.push("Try expanding your writing with more details and descriptions.");
    }

    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length < 3) {
      suggestions.push("Consider adding more sentences to develop your ideas further.");
    }

    return suggestions;
  };

  const generateAchievements = (score: number, errorCount: number, wordCount: number): string[] => {
    const achievements = [];
    
    if (score >= 95) achievements.push("Perfect Score! 🏆");
    if (score >= 90) achievements.push("Excellent Writer! ⭐");
    if (errorCount === 0) achievements.push("Error-Free Writing! ✨");
    if (wordCount >= 100) achievements.push("Prolific Writer! 📝");
    if (wordCount >= 200) achievements.push("Story Master! 📚");
    
    return achievements;
  };

  // NSW-specific analysis
  const performNSWAnalysis = useCallback(async (text: string, type: string): Promise<any> => {
    if (text.length < 50) return null;

    // Simulate NSW analysis
    await new Promise(resolve => setTimeout(resolve, 500));

    const words = text.trim().split(/\s+/);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);

    return {
      narrativeStructure: {
        score: Math.min(5, paragraphs.length + 2),
        feedback: "Good story structure with clear paragraphs"
      },
      creativity: {
        score: 4,
        feedback: "Shows creative thinking and imagination"
      },
      vocabulary: {
        score: Math.min(5, Math.floor(words.filter(w => w.length > 6).length / 5) + 3),
        feedback: "Good use of varied vocabulary"
      },
      coherence: {
        score: 4,
        feedback: "Ideas flow logically from one to the next"
      }
    };
  }, []);

  // Main analysis function with optimization
  const performAnalysis = useCallback(async (text: string, type: string) => {
    if (!text || text.trim().length === 0) {
      setAnalysisResult(null);
      return;
    }

    const contentHash = generateContentHash(text, type);
    
    // Check cache first
    const cachedResult = getCachedResult(contentHash);
    if (cachedResult) {
      setAnalysisResult(cachedResult);
      if (enablePerformanceMetrics) {
        setPerformanceMetrics(prev => ({
          ...prev,
          cacheHits: prev.cacheHits + 1
        }));
      }
      return;
    }

    // Cancel previous analysis
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsAnalyzing(true);
    setError(null);

    try {
      const startTime = performance.now();
      
      // Perform grammar check and NSW analysis in parallel
      const [grammarResult, nswResult] = await Promise.all([
        performGrammarCheck(text),
        performNSWAnalysis(text, type)
      ]);

      const endTime = performance.now();
      const totalAnalysisTime = endTime - startTime;

      const result: AnalysisResult = {
        ...grammarResult,
        nswAnalysis: nswResult,
        performanceMetrics: enablePerformanceMetrics ? {
          analysisTime: totalAnalysisTime,
          cacheHits: performanceMetrics.cacheHits,
          cacheMisses: performanceMetrics.cacheMisses + 1,
          totalAnalyses: performanceMetrics.totalAnalyses + 1
        } : undefined
      };

      // Cache the result
      setCachedResult(contentHash, result);
      setAnalysisResult(result);

      if (enablePerformanceMetrics) {
        setPerformanceMetrics(prev => ({
          ...prev,
          analysisTime: totalAnalysisTime,
          cacheMisses: prev.cacheMisses + 1,
          totalAnalyses: prev.totalAnalyses + 1
        }));
      }

    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Analysis failed');
        console.error('Analysis error:', err);
      }
    } finally {
      setIsAnalyzing(false);
    }
  }, [
    generateContentHash,
    getCachedResult,
    setCachedResult,
    performGrammarCheck,
    performNSWAnalysis,
    enablePerformanceMetrics,
    performanceMetrics.cacheHits,
    performanceMetrics.cacheMisses,
    performanceMetrics.totalAnalyses
  ]);

  // Debounced analysis function
  const debouncedAnalysis = useMemo(
    () => debounce(performAnalysis, debounceDelay),
    [performAnalysis, debounceDelay]
  );

  // Effect to trigger analysis when content changes
  useEffect(() => {
    if (content !== lastAnalysisRef.current) {
      lastAnalysisRef.current = content;
      debouncedAnalysis(content, textType);
    }

    return () => {
      debouncedAnalysis.cancel();
    };
  }, [content, textType, debouncedAnalysis]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
      debouncedAnalysis.cancel();
    };
  }, [debouncedAnalysis]);

  // Cache management utilities
  const clearCache = useCallback(() => {
    cacheRef.current = {};
  }, []);

  const getCacheStats = useCallback(() => {
    const cache = cacheRef.current;
    const entries = Object.keys(cache).length;
    const totalSize = JSON.stringify(cache).length;
    const oldestEntry = Math.min(...Object.values(cache).map(entry => entry.timestamp));
    const newestEntry = Math.max(...Object.values(cache).map(entry => entry.timestamp));

    return {
      entries,
      totalSize,
      oldestEntry: new Date(oldestEntry),
      newestEntry: new Date(newestEntry)
    };
  }, []);

  // Virtual scrolling for large error lists
  const getVisibleErrors = useCallback((errors: any[], startIndex: number, endIndex: number) => {
    if (!enableVirtualScrolling) return errors;
    return errors.slice(startIndex, endIndex);
  }, [enableVirtualScrolling]);

  return {
    analysisResult,
    isAnalyzing,
    error,
    performanceMetrics: enablePerformanceMetrics ? performanceMetrics : undefined,
    
    // Utility functions
    clearCache,
    getCacheStats,
    getVisibleErrors,
    
    // Manual trigger for immediate analysis
    triggerAnalysis: () => performAnalysis(content, textType),
    
    // Performance optimization controls
    setDebounceDelay: (delay: number) => {
      debouncedAnalysis.cancel();
      // Would need to recreate debounced function with new delay
    }
  };
};