import { GrammarCheckerEngine } from './grammarCheckerEngine';
import { NSWWritingChecker } from './nswWritingChecker';
import { 
  GrammarError, 
  GrammarCheckResult, 
  GrammarCheckerSettings 
} from '../types/grammarChecker';

interface CacheEntry {
  result: GrammarCheckResult;
  timestamp: number;
  textHash: string;
}

export class OptimizedGrammarChecker {
  private grammarEngine: GrammarCheckerEngine;
  private nswChecker: NSWWritingChecker;
  private cache: Map<string, CacheEntry> = new Map();
  private checkQueue: Map<string, NodeJS.Timeout> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 100;
  private readonly MIN_TEXT_LENGTH = 10;

  constructor(settings?: Partial<GrammarCheckerSettings>) {
    this.grammarEngine = new GrammarCheckerEngine(settings);
    this.nswChecker = new NSWWritingChecker();
  }

  public async checkTextOptimized(
    text: string, 
    options: {
      debounceMs?: number;
      forceCheck?: boolean;
      includeNSW?: boolean;
    } = {}
  ): Promise<GrammarCheckResult> {
    const { 
      debounceMs = 500, 
      forceCheck = false, 
      includeNSW = true 
    } = options;

    // Skip checking for very short text
    if (text.trim().length < this.MIN_TEXT_LENGTH) {
      return this.getEmptyResult();
    }

    // Generate text hash for caching
    const textHash = this.generateTextHash(text);
    
    // Check cache first (unless forced)
    if (!forceCheck) {
      const cached = this.getCachedResult(textHash);
      if (cached) {
        return cached;
      }
    }

    // Return promise that resolves after debounce
    return new Promise((resolve) => {
      // Clear existing timeout for this text
      const existingTimeout = this.checkQueue.get(textHash);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Set new timeout
      const timeout = setTimeout(async () => {
        try {
          const result = await this.performCheck(text, includeNSW);
          this.cacheResult(textHash, result);
          this.checkQueue.delete(textHash);
          resolve(result);
        } catch (error) {
          console.error('Grammar check failed:', error);
          this.checkQueue.delete(textHash);
          resolve(this.getEmptyResult());
        }
      }, debounceMs);

      this.checkQueue.set(textHash, timeout);
    });
  }

  private async performCheck(text: string, includeNSW: boolean): Promise<GrammarCheckResult> {
    // Start with basic grammar check
    const basicResult = await this.grammarEngine.checkText(text);
    
    if (!includeNSW) {
      return basicResult;
    }

    // Add NSW-specific checks
    const nswResult = this.nswChecker.checkNSWCriteria(text);
    
    // Merge results
    return this.mergeResults(basicResult, nswResult);
  }

  private mergeResults(
    basicResult: GrammarCheckResult, 
    nswResult: { errors: GrammarError[], criteria: any, nswScore: number, recommendations: string[] }
  ): GrammarCheckResult {
    // Combine errors, avoiding duplicates
    const allErrors = [...basicResult.errors];
    const existingRules = new Set(basicResult.errors.map(e => e.rule));
    
    nswResult.errors.forEach(error => {
      if (!existingRules.has(error.rule)) {
        allErrors.push(error);
      }
    });

    // Update error counts
    const errorCounts = this.calculateErrorCounts(allErrors);
    
    // Combine suggestions
    const allSuggestions = [
      ...basicResult.suggestions,
      ...nswResult.recommendations
    ];

    // Use NSW criteria
    const nswCriteria = nswResult.criteria;

    // Calculate combined score
    const combinedScore = Math.round((basicResult.overallScore + nswResult.nswScore) / 2);

    return {
      errors: allErrors,
      errorCounts,
      overallScore: combinedScore,
      nswCriteria,
      suggestions: allSuggestions,
      achievements: basicResult.achievements
    };
  }

  private calculateErrorCounts(errors: GrammarError[]): Record<string, number> {
    const counts: Record<string, number> = {
      spelling: 0,
      grammar: 0,
      punctuation: 0,
      'language-convention': 0,
      'style-flow': 0
    };

    errors.forEach(error => {
      counts[error.type] = (counts[error.type] || 0) + 1;
    });

    return counts;
  }

  private generateTextHash(text: string): string {
    // Simple hash function for caching
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  private getCachedResult(textHash: string): GrammarCheckResult | null {
    const cached = this.cache.get(textHash);
    if (!cached) return null;

    // Check if cache entry is still valid
    const now = Date.now();
    if (now - cached.timestamp > this.CACHE_DURATION) {
      this.cache.delete(textHash);
      return null;
    }

    return cached.result;
  }

  private cacheResult(textHash: string, result: GrammarCheckResult): void {
    // Clean old cache entries if we're at max size
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.cleanOldCacheEntries();
    }

    this.cache.set(textHash, {
      result,
      timestamp: Date.now(),
      textHash
    });
  }

  private cleanOldCacheEntries(): void {
    const now = Date.now();
    const entriesToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > this.CACHE_DURATION) {
        entriesToDelete.push(key);
      }
    });

    // Delete expired entries
    entriesToDelete.forEach(key => this.cache.delete(key));

    // If still too many entries, delete oldest ones
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toDelete = entries.slice(0, Math.floor(this.MAX_CACHE_SIZE / 2));
      toDelete.forEach(([key]) => this.cache.delete(key));
    }
  }

  private getEmptyResult(): GrammarCheckResult {
    return {
      errors: [],
      errorCounts: {
        spelling: 0,
        grammar: 0,
        punctuation: 0,
        'language-convention': 0,
        'style-flow': 0
      },
      overallScore: 100,
      nswCriteria: {
        narrativeElements: {
          setting: false,
          characters: false,
          plot: false,
          dialogue: false
        },
        vocabularyLevel: 'appropriate',
        sentenceComplexity: 'appropriate',
        storyLength: 0,
        pacing: 'appropriate',
        creativeElements: []
      },
      suggestions: [],
      achievements: []
    };
  }

  // Performance monitoring
  public getPerformanceStats(): {
    cacheSize: number;
    cacheHitRate: number;
    queueSize: number;
  } {
    return {
      cacheSize: this.cache.size,
      cacheHitRate: 0, // Would need to track hits/misses
      queueSize: this.checkQueue.size
    };
  }

  // Settings management
  public updateSettings(settings: Partial<GrammarCheckerSettings>): void {
    this.grammarEngine.updateSettings(settings);
    // Clear cache when settings change
    this.cache.clear();
  }

  public getSettings(): GrammarCheckerSettings {
    return this.grammarEngine.getSettings();
  }

  // Cleanup
  public cleanup(): void {
    // Clear all timeouts
    this.checkQueue.forEach(timeout => clearTimeout(timeout));
    this.checkQueue.clear();
    
    // Clear cache
    this.cache.clear();
  }
}

// Worker-based grammar checking for heavy operations
export class WorkerGrammarChecker {
  private worker: Worker | null = null;
  private pendingChecks: Map<string, {
    resolve: (result: GrammarCheckResult) => void;
    reject: (error: Error) => void;
  }> = new Map();

  constructor() {
    if (typeof Worker !== 'undefined') {
      this.initializeWorker();
    }
  }

  private initializeWorker(): void {
    // Create worker from blob to avoid external file dependency
    const workerCode = `
      // Import grammar checker logic here
      // This would contain the grammar checking logic
      // running in a separate thread
      
      self.onmessage = function(e) {
        const { id, text, settings } = e.data;
        
        try {
          // Perform grammar check
          const result = performGrammarCheck(text, settings);
          
          self.postMessage({
            id,
            result,
            error: null
          });
        } catch (error) {
          self.postMessage({
            id,
            result: null,
            error: error.message
          });
        }
      };
      
      function performGrammarCheck(text, settings) {
        // Simplified grammar check for worker
        return {
          errors: [],
          errorCounts: { spelling: 0, grammar: 0, punctuation: 0, 'language-convention': 0, 'style-flow': 0 },
          overallScore: 100,
          nswCriteria: {
            narrativeElements: { setting: false, characters: false, plot: false, dialogue: false },
            vocabularyLevel: 'appropriate',
            sentenceComplexity: 'appropriate',
            storyLength: text.split(/\\s+/).length,
            pacing: 'appropriate',
            creativeElements: []
          },
          suggestions: [],
          achievements: []
        };
      }
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    this.worker = new Worker(URL.createObjectURL(blob));

    this.worker.onmessage = (e) => {
      const { id, result, error } = e.data;
      const pending = this.pendingChecks.get(id);
      
      if (pending) {
        if (error) {
          pending.reject(new Error(error));
        } else {
          pending.resolve(result);
        }
        this.pendingChecks.delete(id);
      }
    };

    this.worker.onerror = (error) => {
      console.error('Grammar checker worker error:', error);
      // Fallback to main thread checking
      this.worker = null;
    };
  }

  public async checkText(
    text: string, 
    settings?: Partial<GrammarCheckerSettings>
  ): Promise<GrammarCheckResult> {
    if (!this.worker) {
      // Fallback to main thread
      const checker = new OptimizedGrammarChecker(settings);
      return checker.checkTextOptimized(text, { forceCheck: true });
    }

    return new Promise((resolve, reject) => {
      const id = Math.random().toString(36).substr(2, 9);
      
      this.pendingChecks.set(id, { resolve, reject });
      
      this.worker!.postMessage({
        id,
        text,
        settings
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        if (this.pendingChecks.has(id)) {
          this.pendingChecks.delete(id);
          reject(new Error('Grammar check timeout'));
        }
      }, 10000);
    });
  }

  public cleanup(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.pendingChecks.clear();
  }
}

// Utility functions for performance optimization
export const GrammarCheckUtils = {
  // Batch process multiple texts
  batchCheck: async (
    texts: string[], 
    checker: OptimizedGrammarChecker
  ): Promise<GrammarCheckResult[]> => {
    const promises = texts.map(text => 
      checker.checkTextOptimized(text, { debounceMs: 0 })
    );
    return Promise.all(promises);
  },

  // Check only changed portions of text
  incrementalCheck: async (
    oldText: string,
    newText: string,
    oldResult: GrammarCheckResult,
    checker: OptimizedGrammarChecker
  ): Promise<GrammarCheckResult> => {
    // Simple implementation - in practice, this would be more sophisticated
    const changeRatio = Math.abs(newText.length - oldText.length) / Math.max(oldText.length, 1);
    
    if (changeRatio < 0.1) {
      // Small change, use cached result with minor updates
      return oldResult;
    }
    
    // Significant change, perform full check
    return checker.checkTextOptimized(newText, { forceCheck: true });
  },

  // Measure performance
  measurePerformance: async <T>(
    operation: () => Promise<T>,
    label: string
  ): Promise<T> => {
    const start = performance.now();
    const result = await operation();
    const end = performance.now();
    
    console.log(`${label} took ${end - start} milliseconds`);
    return result;
  }
};
