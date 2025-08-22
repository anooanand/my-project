// Real-time Grammar and Spell Checker Hook for NSW Selective Test Preparation

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  GrammarError, 
  VocabularyEnhancement, 
  SentenceStructureIssue, 
  CohesionIssue,
  NSWWritingAnalysis,
  WritingMetrics,
  TextHighlight
} from './grammarTypes';

import { languageToolService } from '../services/languageToolService';
import { vocabularyService } from '../services/vocabularyService';

interface UseGrammarSpellCheckerOptions {
  debounceMs?: number;
  enableVocabularyEnhancement?: boolean;
  enableStructureAnalysis?: boolean;
  enableCohesionCheck?: boolean;
  textType?: string;
  language?: string;
}

interface UseGrammarSpellCheckerReturn {
  analysis: NSWWritingAnalysis;
  highlights: TextHighlight[];
  metrics: WritingMetrics;
  isChecking: boolean;
  error: string | null;
  checkText: (text: string) => Promise<void>;
  clearAnalysis: () => void;
  applySuggestion: (errorId: string, suggestion: string) => void;
  getErrorById: (id: string) => GrammarError | VocabularyEnhancement | SentenceStructureIssue | CohesionIssue | null;
}

export function useGrammarSpellChecker(
  options: UseGrammarSpellCheckerOptions = {}
): UseGrammarSpellCheckerReturn {
  const {
    debounceMs = 500,
    enableVocabularyEnhancement = true,
    enableStructureAnalysis = true,
    enableCohesionCheck = true,
    textType,
    language = 'en-US'
  } = options;

  const [analysis, setAnalysis] = useState<NSWWritingAnalysis>({
    grammarErrors: [],
    vocabularyEnhancements: [],
    sentenceStructureIssues: [],
    cohesionIssues: [],
    overallScore: {
      ideas: 0,
      structure: 0,
      language: 0,
      accuracy: 0,
      total: 0
    },
    strengths: [],
    improvements: []
  });

  const [highlights, setHighlights] = useState<TextHighlight[]>([]);
  const [metrics, setMetrics] = useState<WritingMetrics>({
    wordCount: 0,
    sentenceCount: 0,
    paragraphCount: 0,
    averageWordsPerSentence: 0,
    readabilityScore: 0,
    vocabularyDiversity: 0,
    sophisticationScore: 0
  });

  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const lastTextRef = useRef<string>('');

  // Debounced text checking
  const checkText = useCallback(async (text: string) => {
    if (text === lastTextRef.current) {
      return; // No change, skip analysis
    }

    lastTextRef.current = text;

    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new timeout
    debounceTimeoutRef.current = setTimeout(async () => {
      await performAnalysis(text);
    }, debounceMs);
  }, [debounceMs]);

  const performAnalysis = async (text: string) => {
    if (!text.trim()) {
      clearAnalysis();
      return;
    }

    setIsChecking(true);
    setError(null);

    try {
      // Parallel analysis for better performance
      const [grammarErrors, vocabularyEnhancements, structureIssues, cohesionIssues] = await Promise.all([
        languageToolService.checkTextWithRetry(text),
        enableVocabularyEnhancement ? vocabularyService.analyzeVocabulary(text, textType) : Promise.resolve([]),
        enableStructureAnalysis ? analyzeSentenceStructure(text) : Promise.resolve([]),
        enableCohesionCheck ? analyzeCohesion(text) : Promise.resolve([])
      ]);

      const newMetrics = calculateMetrics(text);
      const overallScore = calculateOverallScore(grammarErrors, vocabularyEnhancements, structureIssues, newMetrics);
      const { strengths, improvements } = generateFeedback(grammarErrors, vocabularyEnhancements, structureIssues, newMetrics);

      const newAnalysis: NSWWritingAnalysis = {
        grammarErrors,
        vocabularyEnhancements,
        sentenceStructureIssues: structureIssues,
        cohesionIssues,
        overallScore,
        strengths,
        improvements
      };

      setAnalysis(newAnalysis);
      setHighlights(generateHighlights(newAnalysis));
      setMetrics(newMetrics);

    } catch (err) {
      console.error('Analysis failed:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsChecking(false);
    }
  };

  const analyzeSentenceStructure = async (text: string): Promise<SentenceStructureIssue[]> => {
    const issues: SentenceStructureIssue[] = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    let currentPosition = 0;
    
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i].trim();
      const sentenceStart = text.indexOf(sentence, currentPosition);
      const sentenceEnd = sentenceStart + sentence.length;
      
      // Check for overly long sentences (>30 words)
      const wordCount = sentence.split(/\s+/).length;
      if (wordCount > 30) {
        issues.push({
          id: `structure_long_${sentenceStart}`,
          start: sentenceStart,
          end: sentenceEnd,
          type: 'too_long',
          message: 'This sentence is quite long. Consider breaking it into shorter sentences for better readability.',
          suggestions: ['Break into multiple sentences', 'Use semicolons or commas', 'Simplify complex clauses'],
          severity: 'warning'
        });
      }
      
      // Check for very short sentences (< 5 words) that might be fragments
      if (wordCount < 5 && !sentence.match(/^(Yes|No|Indeed|Certainly|Obviously)\.?$/i)) {
        issues.push({
          id: `structure_short_${sentenceStart}`,
          start: sentenceStart,
          end: sentenceEnd,
          type: 'too_short',
          message: 'This sentence seems quite short. Consider expanding it with more detail.',
          suggestions: ['Add descriptive details', 'Combine with adjacent sentence', 'Provide more context'],
          severity: 'suggestion'
        });
      }
      
      // Check for repetitive sentence starters
      if (i > 0) {
        const currentStarter = sentence.split(' ')[0].toLowerCase();
        const previousStarter = sentences[i - 1].trim().split(' ')[0].toLowerCase();
        
        if (currentStarter === previousStarter && currentStarter.length > 3) {
          issues.push({
            id: `structure_repetitive_${sentenceStart}`,
            start: sentenceStart,
            end: sentenceStart + currentStarter.length,
            type: 'repetitive',
            message: 'Consider varying your sentence starters to improve flow.',
            suggestions: ['Use different opening words', 'Try transitional phrases', 'Rearrange sentence structure'],
            severity: 'suggestion'
          });
        }
      }
      
      currentPosition = sentenceEnd;
    }
    
    return issues;
  };

  const analyzeCohesion = async (text: string): Promise<CohesionIssue[]> => {
    const issues: CohesionIssue[] = [];
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    for (let i = 1; i < paragraphs.length; i++) {
      const currentParagraph = paragraphs[i].trim();
      const paragraphStart = text.indexOf(currentParagraph);
      
      // Check for missing transition words between paragraphs
      const firstSentence = currentParagraph.split(/[.!?]/)[0];
      const hasTransition = /^(however|furthermore|moreover|additionally|consequently|therefore|thus|meanwhile|subsequently|in contrast|similarly|likewise|on the other hand|for instance|for example|in conclusion|finally)/i.test(firstSentence);
      
      if (!hasTransition && i > 1) {
        const suggestions = vocabularyService.suggestTransitionWords(paragraphs[i - 1], currentParagraph);
        
        issues.push({
          id: `cohesion_transition_${paragraphStart}`,
          start: paragraphStart,
          end: paragraphStart + firstSentence.length,
          type: 'missing_transition',
          message: 'Consider adding a transition word or phrase to improve flow between paragraphs.',
          suggestions: suggestions.slice(0, 3),
          transitionWords: suggestions
        });
      }
    }
    
    return issues;
  };

  const calculateMetrics = (text: string): WritingMetrics => {
    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    const wordCount = words.length;
    const sentenceCount = sentences.length;
    const paragraphCount = paragraphs.length;
    const averageWordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : 0;
    
    // Simple readability score (Flesch-like)
    const averageSentenceLength = averageWordsPerSentence;
    const averageSyllables = words.reduce((sum, word) => sum + countSyllables(word), 0) / wordCount;
    const readabilityScore = Math.max(0, 206.835 - (1.015 * averageSentenceLength) - (84.6 * averageSyllables));
    
    // Vocabulary diversity (unique words / total words)
    const uniqueWords = new Set(words.map(w => w.toLowerCase().replace(/[^\w]/g, '')));
    const vocabularyDiversity = wordCount > 0 ? (uniqueWords.size / wordCount) * 100 : 0;
    
    // Sophistication score
    const sophisticationScore = vocabularyService.calculateSophisticationScore(text);
    
    return {
      wordCount,
      sentenceCount,
      paragraphCount,
      averageWordsPerSentence: Math.round(averageWordsPerSentence * 10) / 10,
      readabilityScore: Math.round(readabilityScore * 10) / 10,
      vocabularyDiversity: Math.round(vocabularyDiversity * 10) / 10,
      sophisticationScore: Math.round(sophisticationScore * 10) / 10
    };
  };

  const countSyllables = (word: string): number => {
    // Simple syllable counting algorithm
    const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
    if (cleanWord.length <= 3) return 1;
    
    const vowels = cleanWord.match(/[aeiouy]+/g);
    let syllables = vowels ? vowels.length : 1;
    
    if (cleanWord.endsWith('e')) syllables--;
    if (syllables === 0) syllables = 1;
    
    return syllables;
  };

  const calculateOverallScore = (
    grammarErrors: GrammarError[],
    vocabularyEnhancements: VocabularyEnhancement[],
    structureIssues: SentenceStructureIssue[],
    metrics: WritingMetrics
  ) => {
    // NSW Selective Test scoring criteria
    const maxErrors = Math.max(1, metrics.wordCount / 20); // Expected error rate
    
    // Accuracy score (20 points) - based on grammar and spelling errors
    const errorCount = grammarErrors.filter(e => e.severity === 'error').length;
    const accuracy = Math.max(0, 20 - (errorCount / maxErrors) * 20);
    
    // Language score (25 points) - based on vocabulary and style
    const vocabularyScore = Math.min(25, metrics.sophisticationScore / 4);
    const language = vocabularyScore;
    
    // Structure score (25 points) - based on sentence variety and organization
    const structureErrorCount = structureIssues.length;
    const structure = Math.max(0, 25 - (structureErrorCount / 3) * 5);
    
    // Ideas score (30 points) - placeholder, would need content analysis
    const ideas = Math.min(30, metrics.wordCount > 200 ? 25 : (metrics.wordCount / 200) * 25);
    
    const total = accuracy + language + structure + ideas;
    
    return {
      ideas: Math.round(ideas),
      structure: Math.round(structure),
      language: Math.round(language),
      accuracy: Math.round(accuracy),
      total: Math.round(total)
    };
  };

  const generateFeedback = (
    grammarErrors: GrammarError[],
    vocabularyEnhancements: VocabularyEnhancement[],
    structureIssues: SentenceStructureIssue[],
    metrics: WritingMetrics
  ) => {
    const strengths: string[] = [];
    const improvements: string[] = [];
    
    // Analyze strengths
    if (grammarErrors.filter(e => e.severity === 'error').length === 0) {
      strengths.push('Excellent grammar and spelling accuracy');
    }
    
    if (metrics.sophisticationScore > 15) {
      strengths.push('Good use of sophisticated vocabulary');
    }
    
    if (metrics.averageWordsPerSentence >= 12 && metrics.averageWordsPerSentence <= 20) {
      strengths.push('Well-balanced sentence length');
    }
    
    if (structureIssues.length <= 2) {
      strengths.push('Good sentence structure variety');
    }
    
    // Analyze improvements
    if (grammarErrors.length > 3) {
      improvements.push('Focus on reducing grammar and spelling errors');
    }
    
    if (vocabularyEnhancements.length > 5) {
      improvements.push('Consider using more sophisticated vocabulary');
    }
    
    if (metrics.averageWordsPerSentence < 10) {
      improvements.push('Try to write more detailed sentences');
    }
    
    if (metrics.averageWordsPerSentence > 25) {
      improvements.push('Consider breaking long sentences into shorter ones');
    }
    
    if (structureIssues.length > 3) {
      improvements.push('Work on varying your sentence structures');
    }
    
    return { strengths, improvements };
  };

  const generateHighlights = (analysis: NSWWritingAnalysis): TextHighlight[] => {
    const highlights: TextHighlight[] = [];
    
    // Grammar and spelling errors
    analysis.grammarErrors.forEach(error => {
      highlights.push({
        id: error.id,
        start: error.start,
        end: error.end,
        type: error.severity === 'error' ? 'error' : error.severity === 'warning' ? 'warning' : 'suggestion',
        category: error.type,
        color: getErrorColor(error.type, error.severity),
        underlineStyle: 'wavy'
      });
    });
    
    // Vocabulary enhancements
    analysis.vocabularyEnhancements.forEach(enhancement => {
      highlights.push({
        id: enhancement.id,
        start: enhancement.start,
        end: enhancement.end,
        type: 'enhancement',
        category: 'vocabulary',
        color: '#8B5CF6', // Purple
        underlineStyle: 'wavy'
      });
    });
    
    // Structure issues
    analysis.sentenceStructureIssues.forEach(issue => {
      highlights.push({
        id: issue.id,
        start: issue.start,
        end: issue.end,
        type: issue.severity === 'warning' ? 'warning' : 'suggestion',
        category: 'structure',
        color: '#F59E0B', // Orange
        underlineStyle: 'wavy'
      });
    });
    
    // Cohesion issues
    analysis.cohesionIssues.forEach(issue => {
      highlights.push({
        id: issue.id,
        start: issue.start,
        end: issue.end,
        type: 'suggestion',
        category: 'cohesion',
        color: '#10B981', // Green
        underlineStyle: 'dashed'
      });
    });
    
    return highlights;
  };

  const getErrorColor = (type: string, severity: string): string => {
    if (severity === 'error') {
      return type === 'spelling' ? '#EF4444' : '#DC2626'; // Red variants
    }
    if (severity === 'warning') {
      return '#F59E0B'; // Orange
    }
    return '#6B7280'; // Gray for suggestions
  };

  const clearAnalysis = useCallback(() => {
    setAnalysis({
      grammarErrors: [],
      vocabularyEnhancements: [],
      sentenceStructureIssues: [],
      cohesionIssues: [],
      overallScore: { ideas: 0, structure: 0, language: 0, accuracy: 0, total: 0 },
      strengths: [],
      improvements: []
    });
    setHighlights([]);
    setMetrics({
      wordCount: 0,
      sentenceCount: 0,
      paragraphCount: 0,
      averageWordsPerSentence: 0,
      readabilityScore: 0,
      vocabularyDiversity: 0,
      sophisticationScore: 0
    });
    setError(null);
  }, []);

  const applySuggestion = useCallback((errorId: string, suggestion: string) => {
    // This would be implemented by the parent component
    // as it needs access to the text content and cursor position
    console.log('Apply suggestion:', errorId, suggestion);
  }, []);

  const getErrorById = useCallback((id: string) => {
    const allErrors = [
      ...analysis.grammarErrors,
      ...analysis.vocabularyEnhancements,
      ...analysis.sentenceStructureIssues,
      ...analysis.cohesionIssues
    ];
    
    return allErrors.find(error => error.id === id) || null;
  }, [analysis]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return {
    analysis,
    highlights,
    metrics,
    isChecking,
    error,
    checkText,
    clearAnalysis,
    applySuggestion,
    getErrorById
  };
}
