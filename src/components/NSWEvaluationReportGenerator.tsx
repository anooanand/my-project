import React from 'react';
import { FileText, Download, Award, BarChart3, CheckCircle, AlertCircle, Target, Lightbulb } from 'lucide-react';

interface EvaluationReport {
  overallScore: number;
  overallGrade: string;
  domains: {
    contentAndIdeas: DomainScore;
    textStructure: DomainScore;
    languageFeatures: DomainScore;
    spellingAndGrammar: DomainScore;
  };
  detailedFeedback: DetailedFeedback;
  recommendations: string[];
  strengths: string[];
  areasForImprovement: string[];
  essayContent: string;
  originalityReport: OriginalityReport;
}

interface OriginalityReport {
  originalityScore: number;
  promptSimilarity: number;
  originalContentPercentage: number;
  copiedSections: string[];
  flags: string[];
}

interface DomainScore {
  score: number;
  maxScore: number;
  percentage: number;
  band: string;
  weight: number;
  weightedScore: number;
  feedback: string[];
  specificExamples: string[];
  childFriendlyExplanation: string;
}

interface DetailedFeedback {
  wordCount: number;
  sentenceVariety: {
    simple: number;
    compound: number;
    complex: number;
    analysis: string;
  };
  vocabularyAnalysis: {
    sophisticatedWords: string[];
    repetitiveWords: string[];
    suggestions: string[];
  };
  literaryDevices: {
    identified: string[];
    suggestions: string[];
  };
  structuralElements: {
    hasIntroduction: boolean;
    hasConclusion: boolean;
    paragraphCount: number;
    coherence: string;
  };
  technicalAccuracy: {
    spellingErrors: number;
    grammarIssues: string[];
    punctuationIssues: string[];
  };
}

export class NSWEvaluationReportGenerator {
  
  static generateReport(params: { 
    essayContent: string; 
    textType: string; 
    prompt: string; 
    wordCount: number; 
    targetWordCountMin: number; 
    targetWordCountMax: number; 
  }): EvaluationReport {
    console.log("NSWEvaluationReportGenerator.generateReport called with params:", params);
    const { essayContent, textType, prompt, wordCount, targetWordCountMin, targetWordCountMax } = params;
    
    // Basic validation
    if (!essayContent || essayContent.trim().length === 0) {
      throw new Error("Essay content cannot be empty");
    }
    
    // CRITICAL FIX: Check for originality first
    const originalityReport = this.assessOriginality(essayContent, prompt);
    
    // If content is mostly copied, apply severe penalties
    const originalityPenalty = this.calculateOriginalityPenalty(originalityReport);
    
    const analysis = this.analyzeEssay(essayContent);
    
    // Score each domain according to NSW criteria with originality penalties
    const contentAndIdeas = this.scoreContentAndIdeas(essayContent, analysis, "Content & Ideas", originalityPenalty);
    const textStructure = this.scoreTextStructure(essayContent, analysis, "Text Structure", originalityPenalty);
    const languageFeatures = this.scoreLanguageFeatures(essayContent, analysis, "Language Features", originalityPenalty);
    const spellingAndGrammar = this.scoreSpellingAndGrammar(essayContent, analysis, "Spelling & Grammar");
    
    // Calculate overall score with bounds checking
    const rawOverallScore = 
      contentAndIdeas.weightedScore + 
      textStructure.weightedScore + 
      languageFeatures.weightedScore + 
      spellingAndGrammar.weightedScore;
    
    // CRITICAL FIX: Enforce score bounds (0-100)
    const overallScore = Math.max(0, Math.min(100, Math.round(rawOverallScore)));
    
    const overallGrade = this.getOverallGrade(overallScore);
    
    return {
      overallScore,
      overallGrade,
      domains: {
        contentAndIdeas,
        textStructure,
        languageFeatures,
        spellingAndGrammar
      },
      detailedFeedback: analysis,
      recommendations: this.generatePersonalizedRecommendations(contentAndIdeas, textStructure, languageFeatures, spellingAndGrammar, originalityReport),
      strengths: this.identifyStrengths(contentAndIdeas, textStructure, languageFeatures, spellingAndGrammar),
      areasForImprovement: this.identifyImprovements(contentAndIdeas, textStructure, languageFeatures, spellingAndGrammar, originalityReport),
      essayContent: essayContent,
      originalityReport: originalityReport
    };
  }
  
  // CRITICAL FIX: Implement real originality detection
  private static assessOriginality(essay: string, prompt: string): OriginalityReport {
    const essayLower = essay.toLowerCase().trim();
    const promptLower = prompt.toLowerCase().trim();
    
    // Calculate prompt similarity using word overlap
    const essayWords = essayLower.split(/\s+/).filter(w => w.length > 3);
    const promptWords = promptLower.split(/\s+/).filter(w => w.length > 3);
    
    let matchingWords = 0;
    const copiedSections: string[] = [];
    
    // Check for exact phrase matches (5+ words)
    const essayPhrases = this.extractPhrases(essayLower, 5);
    const promptPhrases = this.extractPhrases(promptLower, 5);
    
    for (const essayPhrase of essayPhrases) {
      for (const promptPhrase of promptPhrases) {
        if (essayPhrase === promptPhrase) {
          copiedSections.push(essayPhrase);
        }
      }
    }
    
    // Calculate word-level similarity
    for (const essayWord of essayWords) {
      if (promptWords.includes(essayWord)) {
        matchingWords++;
      }
    }
    
    const promptSimilarity = essayWords.length > 0 ? (matchingWords / essayWords.length) * 100 : 0;
    
    // Calculate original content percentage
    const totalWords = essayWords.length;
    const copiedWordCount = copiedSections.reduce((sum, section) => sum + section.split(/\s+/).length, 0);
    const originalContentPercentage = totalWords > 0 ? Math.max(0, ((totalWords - copiedWordCount) / totalWords) * 100) : 0;
    
    // Generate flags
    const flags: string[] = [];
    if (promptSimilarity > 70) flags.push("HIGH_PROMPT_SIMILARITY");
    if (originalContentPercentage < 30) flags.push("LOW_ORIGINAL_CONTENT");
    if (copiedSections.length > 2) flags.push("MULTIPLE_COPIED_SECTIONS");
    if (totalWords < 20) flags.push("INSUFFICIENT_CONTENT");
    
    // Calculate originality score (1-10 scale)
    let originalityScore = 10;
    if (promptSimilarity > 80) originalityScore = 1;
    else if (promptSimilarity > 60) originalityScore = 2;
    else if (promptSimilarity > 40) originalityScore = 3;
    else if (promptSimilarity > 20) originalityScore = 5;
    else if (originalContentPercentage > 80) originalityScore = 9;
    else if (originalContentPercentage > 60) originalityScore = 7;
    
    return {
      originalityScore,
      promptSimilarity,
      originalContentPercentage,
      copiedSections,
      flags
    };
  }
  
  private static extractPhrases(text: string, minLength: number): string[] {
    const words = text.split(/\s+/);
    const phrases: string[] = [];
    
    for (let i = 0; i <= words.length - minLength; i++) {
      phrases.push(words.slice(i, i + minLength).join(' '));
    }
    
    return phrases;
  }
  
  private static calculateOriginalityPenalty(originalityReport: OriginalityReport): number {
    // Return penalty multiplier (0.1 = 90% penalty, 1.0 = no penalty)
    if (originalityReport.promptSimilarity > 80) return 0.1; // Severe penalty for copied content
    if (originalityReport.promptSimilarity > 60) return 0.3; // Major penalty
    if (originalityReport.promptSimilarity > 40) return 0.5; // Moderate penalty
    if (originalityReport.promptSimilarity > 20) return 0.7; // Minor penalty
    return 1.0; // No penalty
  }
  
  private static analyzeEssay(essay: string): DetailedFeedback {
    const words = essay.trim().split(/\s+/).filter(word => word.length > 0);
    const sentences = essay.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = essay.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    // Analyze sentence variety
    const simpleSentences = sentences.filter(s => !s.includes(',') && !s.includes(';') && !s.includes('and') && !s.includes('but')).length;
    const compoundSentences = sentences.filter(s => (s.includes(',') || s.includes(';')) && (s.includes('and') || s.includes('but') || s.includes('or'))).length;
    const complexSentences = sentences.filter(s => s.includes('that') || s.includes('which') || s.includes('when') || s.includes('because') || s.includes('although')).length;
    
    // Vocabulary analysis
    const sophisticatedWords = this.identifySophisticatedVocabulary(essay);
    const repetitiveWords = this.identifyRepetitiveWords(words);
    
    // Literary devices
    const literaryDevices = this.identifyLiteraryDevices(essay);
    
    // Structural analysis
    const hasIntroduction = this.hasEffectiveIntroduction(essay);
    const hasConclusion = this.hasEffectiveConclusion(essay);
    
    // Technical accuracy
    const spellingErrors = this.countSpellingErrors(essay);
    const grammarIssues = this.identifyGrammarIssues(essay);
    const punctuationIssues = this.identifyPunctuationIssues(essay);
    
    return {
      wordCount: words.length,
      sentenceVariety: {
        simple: simpleSentences,
        compound: compoundSentences,
        complex: complexSentences,
        analysis: this.analyzeSentenceVariety(simpleSentences, compoundSentences, complexSentences)
      },
      vocabularyAnalysis: {
        sophisticatedWords,
        repetitiveWords,
        suggestions: this.generateVocabularySuggestions(repetitiveWords)
      },
      literaryDevices: {
        identified: literaryDevices,
        suggestions: this.suggestLiteraryDevices(essay, literaryDevices)
      },
      structuralElements: {
        hasIntroduction,
        hasConclusion,
        paragraphCount: paragraphs.length,
        coherence: this.assessCoherence(essay, paragraphs)
      },
      technicalAccuracy: {
        spellingErrors,
        grammarIssues,
        punctuationIssues
      }
    };
  }
  
  // CRITICAL FIX: Implement real content assessment
  private static scoreContentAndIdeas(essay: string, analysis: DetailedFeedback, domainName: string, originalityPenalty: number): DomainScore {
    const feedback: string[] = [];
    const specificExamples: string[] = [];
    
    // Real assessment instead of hardcoded return 5
    const creativityScore = this.assessCreativity(essay);
    const ideaDevelopmentScore = this.assessIdeaDevelopment(essay);
    const engagementScore = this.assessEngagement(essay);
    
    // Calculate base score
    const baseScore = (creativityScore + ideaDevelopmentScore + engagementScore) / 3;
    
    // Apply originality penalty
    const penalizedScore = baseScore * originalityPenalty;
    
    // CRITICAL FIX: Enforce 1-10 bounds
    const score = Math.max(1, Math.min(10, Math.round(penalizedScore)));
    
    // Generate feedback based on actual score
    if (originalityPenalty < 0.5) {
      feedback.push("⚠️ This writing appears to copy heavily from the prompt");
      feedback.push("Original ideas and creativity are essential for NSW tests");
      feedback.push("Try to develop your own unique story elements");
    } else if (score >= 9) {
      feedback.push("Demonstrates exceptional creativity and originality");
      feedback.push("Ideas are highly sophisticated and insightful");
      feedback.push("Content is compelling and engaging throughout");
    } else if (score >= 7) {
      feedback.push("Shows notable creativity and original thinking");
      feedback.push("Ideas are well-developed and thoughtful");
      feedback.push("Content is engaging with compelling elements");
    } else if (score >= 5) {
      feedback.push("Demonstrates some creativity and original ideas");
      feedback.push("Ideas are adequately developed");
      feedback.push("Content is mostly engaging");
    } else if (score >= 3) {
      feedback.push("Limited creativity and mostly conventional ideas");
      feedback.push("Ideas need more development and detail");
      feedback.push("Content lacks engagement");
    } else {
      feedback.push("Very limited or unclear ideas");
      feedback.push("Needs significant development of creative content");
      feedback.push("Focus on original storytelling");
    }
    
    const weight = 40;
    const percentage = (score / 10) * 100;
    const weightedScore = (score / 10) * weight;
    
    return {
      score,
      maxScore: 10,
      percentage,
      band: this.getScoreBand(score),
      weight,
      weightedScore,
      feedback,
      specificExamples,
      childFriendlyExplanation: this.generateChildFriendlyExplanation(domainName, score, originalityPenalty < 0.5)
    };
  }
  
  // CRITICAL FIX: Implement real structure assessment
  private static scoreTextStructure(essay: string, analysis: DetailedFeedback, domainName: string, originalityPenalty: number): DomainScore {
    const feedback: string[] = [];
    const specificExamples: string[] = [];
    
    // Real assessment instead of hardcoded return 5
    const organizationScore = this.assessParagraphOrganization(essay);
    const coherenceScore = this.assessCoherenceScore(analysis.structuralElements.coherence);
    const transitionScore = this.assessTransitions(essay);
    
    const baseScore = (organizationScore + coherenceScore + transitionScore) / 3;
    const penalizedScore = baseScore * originalityPenalty;
    
    // CRITICAL FIX: Enforce 1-10 bounds
    const score = Math.max(1, Math.min(10, Math.round(penalizedScore)));
    
    // Generate feedback based on actual score
    if (originalityPenalty < 0.5) {
      feedback.push("⚠️ Cannot assess structure of copied content");
      feedback.push("Original narrative structure is required");
      feedback.push("Develop your own beginning, middle, and end");
    } else if (score >= 9) {
      feedback.push("Exceptional organization with perfect narrative flow");
      feedback.push("Clear and sophisticated structure throughout");
      feedback.push("Excellent use of transitions and coherence");
    } else if (score >= 7) {
      feedback.push("Well-organized with clear narrative structure");
      feedback.push("Good use of paragraphs and transitions");
      feedback.push("Story flows logically from beginning to end");
    } else if (score >= 5) {
      feedback.push("Adequate organization with basic structure");
      feedback.push("Some effective use of paragraphs");
      feedback.push("Generally coherent flow");
    } else if (score >= 3) {
      feedback.push("Limited organization and unclear structure");
      feedback.push("Paragraphs need better development");
      feedback.push("Story flow needs improvement");
    } else {
      feedback.push("Poor organization with confusing structure");
      feedback.push("Lacks clear beginning, middle, or end");
      feedback.push("Needs significant work on story organization");
    }
    
    const weight = 20;
    const percentage = (score / 10) * 100;
    const weightedScore = (score / 10) * weight;
    
    return {
      score,
      maxScore: 10,
      percentage,
      band: this.getScoreBand(score),
      weight,
      weightedScore,
      feedback,
      specificExamples,
      childFriendlyExplanation: this.generateChildFriendlyExplanation(domainName, score, originalityPenalty < 0.5)
    };
  }
  
  // CRITICAL FIX: Implement real language assessment
  private static scoreLanguageFeatures(essay: string, analysis: DetailedFeedback, domainName: string, originalityPenalty: number): DomainScore {
    const feedback: string[] = [];
    const specificExamples: string[] = [];
    
    // Real assessment instead of hardcoded return 5
    const vocabularyScore = this.assessVocabularyScore(analysis.vocabularyAnalysis);
    const literaryDeviceScore = this.assessLiteraryDeviceScore(analysis.literaryDevices);
    const sentenceVarietyScore = this.assessSentenceVarietyScore(analysis.sentenceVariety);
    const voiceScore = this.assessVoice(essay);
    
    const baseScore = (vocabularyScore + literaryDeviceScore + sentenceVarietyScore + voiceScore) / 4;
    const penalizedScore = baseScore * originalityPenalty;
    
    // CRITICAL FIX: Enforce 1-10 bounds
    const score = Math.max(1, Math.min(10, Math.round(penalizedScore)));
    
    // Generate feedback based on actual score
    if (originalityPenalty < 0.5) {
      feedback.push("⚠️ Cannot assess language features of copied content");
      feedback.push("Original vocabulary and expression needed");
      feedback.push("Use your own words to tell the story");
    } else if (score >= 9) {
      feedback.push("Exceptional vocabulary and sophisticated language use");
      feedback.push("Excellent use of literary devices");
      feedback.push("Varied and engaging sentence structures");
    } else if (score >= 7) {
      feedback.push("Good vocabulary with some sophisticated words");
      feedback.push("Effective use of some literary devices");
      feedback.push("Generally varied sentence structures");
    } else if (score >= 5) {
      feedback.push("Adequate vocabulary for the task");
      feedback.push("Some attempt at literary devices");
      feedback.push("Basic sentence variety");
    } else if (score >= 3) {
      feedback.push("Limited vocabulary and simple language");
      feedback.push("Few or no literary devices used");
      feedback.push("Repetitive sentence structures");
    } else {
      feedback.push("Very basic vocabulary");
      feedback.push("No evidence of literary devices");
      feedback.push("Simple, repetitive sentences");
    }
    
    const weight = 25;
    const percentage = (score / 10) * 100;
    const weightedScore = (score / 10) * weight;
    
    return {
      score,
      maxScore: 10,
      percentage,
      band: this.getScoreBand(score),
      weight,
      weightedScore,
      feedback,
      specificExamples,
      childFriendlyExplanation: this.generateChildFriendlyExplanation(domainName, score, originalityPenalty < 0.5)
    };
  }
  
  // CRITICAL FIX: Implement real grammar assessment
  private static scoreSpellingAndGrammar(essay: string, analysis: DetailedFeedback, domainName: string): DomainScore {
    const feedback: string[] = [];
    const specificExamples: string[] = [];
    
    // Real assessment based on actual errors
    const totalWords = analysis.wordCount;
    const spellingErrors = analysis.technicalAccuracy.spellingErrors;
    const grammarIssues = analysis.technicalAccuracy.grammarIssues.length;
    const punctuationIssues = analysis.technicalAccuracy.punctuationIssues.length;
    
    // Calculate score based on error rates
    let score = 10; // Start with perfect
    
    // Deduct for spelling errors
    const spellingErrorRate = totalWords > 0 ? (spellingErrors / totalWords) * 100 : 0;
    if (spellingErrorRate > 10) score -= 4;
    else if (spellingErrorRate > 5) score -= 3;
    else if (spellingErrorRate > 2) score -= 2;
    else if (spellingErrorRate > 0) score -= 1;
    
    // Deduct for grammar issues
    if (grammarIssues > 5) score -= 3;
    else if (grammarIssues > 3) score -= 2;
    else if (grammarIssues > 1) score -= 1;
    
    // Deduct for punctuation issues
    if (punctuationIssues > 5) score -= 2;
    else if (punctuationIssues > 2) score -= 1;
    
    // CRITICAL FIX: Enforce 1-10 bounds
    score = Math.max(1, Math.min(10, score));
    
    // Generate feedback based on actual errors
    if (score >= 9) {
      feedback.push("Excellent spelling, grammar, and punctuation");
      feedback.push("Very few or no technical errors");
      feedback.push("Writing is clear and easy to read");
    } else if (score >= 7) {
      feedback.push("Good technical accuracy with minor errors");
      feedback.push("Most spelling and grammar is correct");
      feedback.push("Generally clear writing");
    } else if (score >= 5) {
      feedback.push("Adequate technical accuracy");
      feedback.push("Some spelling or grammar errors present");
      feedback.push("Errors don't significantly impact understanding");
    } else if (score >= 3) {
      feedback.push("Several technical errors affecting clarity");
      feedback.push("Spelling and grammar need attention");
      feedback.push("Errors make reading more difficult");
    } else {
      feedback.push("Many technical errors throughout");
      feedback.push("Spelling and grammar significantly impact understanding");
      feedback.push("Needs focused work on basic writing mechanics");
    }
    
    // Add specific error information
    if (spellingErrors > 0) {
      specificExamples.push(`Spelling errors found: ${spellingErrors}`);
    }
    if (grammarIssues > 0) {
      specificExamples.push(`Grammar issues: ${grammarIssues}`);
    }
    if (punctuationIssues > 0) {
      specificExamples.push(`Punctuation issues: ${punctuationIssues}`);
    }
    
    const weight = 15;
    const percentage = (score / 10) * 100;
    const weightedScore = (score / 10) * weight;
    
    return {
      score,
      maxScore: 10,
      percentage,
      band: this.getScoreBand(score),
      weight,
      weightedScore,
      feedback,
      specificExamples,
      childFriendlyExplanation: this.generateChildFriendlyExplanation(domainName, score, false)
    };
  }
  
  // CRITICAL FIX: Implement real assessment methods instead of stubs
  private static assessCreativity(essay: string): number {
    const words = essay.toLowerCase().split(/\s+/);
    let score = 5; // Start with average
    
    // Check for creative elements
    const creativeWords = ['magical', 'mysterious', 'extraordinary', 'amazing', 'wonderful', 'incredible', 'fantastic', 'magnificent'];
    const creativeWordCount = words.filter(word => creativeWords.includes(word)).length;
    
    // Check for imaginative content
    const imaginativeElements = ['dragon', 'fairy', 'magic', 'adventure', 'treasure', 'secret', 'mystery', 'journey'];
    const imaginativeCount = words.filter(word => imaginativeElements.includes(word)).length;
    
    // Adjust score based on creative content
    if (creativeWordCount > 3 || imaginativeCount > 2) score += 2;
    else if (creativeWordCount > 1 || imaginativeCount > 0) score += 1;
    
    // Check for unique story elements
    if (essay.includes('suddenly') || essay.includes('unexpectedly')) score += 1;
    if (essay.length > 200) score += 1; // Longer stories show more development
    
    return Math.max(1, Math.min(10, score));
  }
  
  private static assessIdeaDevelopment(essay: string): number {
    const sentences = essay.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = essay.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    let score = 3; // Start low
    
    // Check for idea development
    if (sentences.length > 5) score += 2;
    if (paragraphs.length > 1) score += 2;
    if (essay.length > 150) score += 2;
    if (essay.includes('because') || essay.includes('therefore') || essay.includes('however')) score += 1;
    
    return Math.max(1, Math.min(10, score));
  }
  
  private static assessEngagement(essay: string): number {
    let score = 4; // Start with below average
    
    // Check for engaging elements
    if (essay.includes('!')) score += 1; // Excitement
    if (essay.includes('?')) score += 1; // Questions engage readers
    if (essay.includes('"')) score += 2; // Dialogue is engaging
    
    // Check for descriptive language
    const descriptiveWords = ['beautiful', 'scary', 'bright', 'dark', 'loud', 'quiet', 'soft', 'rough'];
    const descriptiveCount = descriptiveWords.filter(word => essay.toLowerCase().includes(word)).length;
    if (descriptiveCount > 2) score += 2;
    else if (descriptiveCount > 0) score += 1;
    
    return Math.max(1, Math.min(10, score));
  }
  
  private static assessParagraphOrganization(essay: string): number {
    const paragraphs = essay.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    let score = 3;
    if (paragraphs.length >= 3) score += 3; // Good paragraph structure
    else if (paragraphs.length >= 2) score += 2;
    else if (paragraphs.length >= 1) score += 1;
    
    // Check for topic sentences
    const hasTopicSentences = paragraphs.some(p => p.trim().split(/[.!?]+/)[0].length > 20);
    if (hasTopicSentences) score += 2;
    
    return Math.max(1, Math.min(10, score));
  }
  
  private static assessCoherenceScore(coherence: string): number {
    // This would normally analyze the coherence string, but for now return based on length
    if (coherence.length > 100) return 8;
    if (coherence.length > 50) return 6;
    if (coherence.length > 20) return 4;
    return 2;
  }
  
  private static assessTransitions(essay: string): number {
    const transitionWords = ['first', 'then', 'next', 'finally', 'meanwhile', 'however', 'therefore', 'suddenly'];
    const transitionCount = transitionWords.filter(word => essay.toLowerCase().includes(word)).length;
    
    let score = 3;
    if (transitionCount > 3) score += 4;
    else if (transitionCount > 1) score += 2;
    else if (transitionCount > 0) score += 1;
    
    return Math.max(1, Math.min(10, score));
  }
  
  private static assessVocabularyScore(vocabAnalysis: any): number {
    const sophisticatedCount = vocabAnalysis.sophisticatedWords.length;
    const repetitiveCount = vocabAnalysis.repetitiveWords.length;
    
    let score = 5;
    if (sophisticatedCount > 5) score += 3;
    else if (sophisticatedCount > 2) score += 2;
    else if (sophisticatedCount > 0) score += 1;
    
    if (repetitiveCount > 3) score -= 2;
    else if (repetitiveCount > 1) score -= 1;
    
    return Math.max(1, Math.min(10, score));
  }
  
  private static assessLiteraryDeviceScore(literaryDevices: any): number {
    const deviceCount = literaryDevices.identified.length;
    
    let score = 3;
    if (deviceCount > 3) score += 4;
    else if (deviceCount > 1) score += 2;
    else if (deviceCount > 0) score += 1;
    
    return Math.max(1, Math.min(10, score));
  }
  
  private static assessSentenceVarietyScore(sentenceVariety: any): number {
    const { simple, compound, complex } = sentenceVariety;
    const total = simple + compound + complex;
    
    if (total === 0) return 1;
    
    let score = 3;
    
    // Good variety means not too many of any one type
    const simpleRatio = simple / total;
    const compoundRatio = compound / total;
    const complexRatio = complex / total;
    
    if (simpleRatio < 0.7 && compoundRatio > 0.1 && complexRatio > 0.1) score += 4;
    else if (simpleRatio < 0.8 && (compoundRatio > 0.1 || complexRatio > 0.1)) score += 2;
    
    return Math.max(1, Math.min(10, score));
  }
  
  private static assessVoice(essay: string): number {
    let score = 4;
    
    // Check for personal voice indicators
    if (essay.includes('I ')) score += 2; // First person narrative
    if (essay.includes('!')) score += 1; // Emotional expression
    if (essay.includes('?')) score += 1; // Questioning/wondering
    
    // Check for unique expressions
    const uniquePhrases = ['I wondered', 'I felt', 'I realized', 'I discovered'];
    const uniqueCount = uniquePhrases.filter(phrase => essay.includes(phrase)).length;
    if (uniqueCount > 0) score += 2;
    
    return Math.max(1, Math.min(10, score));
  }
  
  // Helper methods for analysis (implement real logic instead of empty returns)
  private static getScoreBand(score: number): string {
    if (score >= 9) return "Outstanding";
    if (score >= 7) return "Highly Proficient";
    if (score >= 5) return "Proficient";
    if (score >= 3) return "Basic";
    return "Limited";
  }
  
  private static getOverallGrade(score: number): string {
    if (score >= 90) return "A+";
    if (score >= 80) return "A";
    if (score >= 70) return "B";
    if (score >= 60) return "C";
    if (score >= 50) return "D";
    return "E";
  }

  private static generateChildFriendlyExplanation(domain: string, score: number, isCopied: boolean): string {
    if (isCopied) {
      return "Your writing copied too much from the prompt. Try to use your own words and ideas to tell an original story!";
    }
    
    switch (domain) {
      case "Content & Ideas":
        if (score >= 9) return "Your ideas are super creative and interesting, making your story really stand out!";
        if (score >= 7) return "You have some great, thoughtful ideas that make your writing engaging.";
        if (score >= 5) return "Your ideas are good, but you could add more unique thoughts to make them even better.";
        if (score >= 3) return "Your ideas are a bit simple and could use more imagination to make them exciting.";
        return "Your ideas are hard to find or don't quite fit the topic. Let's work on making them clearer and more imaginative!";
      case "Text Structure":
        if (score >= 9) return "Your writing flows perfectly, like a well-told story, with a clear beginning, middle, and end!";
        if (score >= 7) return "Your writing is well-organized, making it easy for the reader to follow your ideas.";
        if (score >= 5) return "Your writing has a clear plan, but sometimes the parts don't connect smoothly.";
        if (score >= 3) return "Your writing is a bit jumbled, and it's hard to see how your ideas fit together.";
        return "Your writing is hard to follow because it doesn't have a clear order. Let's practice organizing your thoughts!";
      case "Language Features":
        if (score >= 9) return "You use amazing words and clever writing tricks that make your writing shine!";
        if (score >= 7) return "You use good words and some literary devices to make your writing interesting.";
        if (score >= 5) return "You use appropriate words, but trying out new words and phrases could make your writing even better.";
        if (score >= 3) return "Your words are simple, and you could try using more exciting language to express yourself.";
        return "Your vocabulary is very basic, and you don't use many literary devices. Let's discover new words and ways to write!";
      case "Spelling & Grammar":
        if (score >= 9) return "Your writing is almost perfect with spelling, punctuation, and grammar – fantastic!";
        if (score >= 7) return "You make very few mistakes in spelling, punctuation, and grammar. Great job!";
        if (score >= 5) return "You have some mistakes in spelling, punctuation, or grammar, but your writing is still easy to understand.";
        if (score >= 3) return "You make several mistakes in spelling, punctuation, and grammar, which sometimes makes your writing hard to read.";
        return "You have many mistakes in spelling, punctuation, and grammar, making your writing difficult to understand. Let's focus on the basics!";
      default:
        return "No specific explanation available for this domain.";
    }
  }

  private static generatePersonalizedRecommendations(contentAndIdeas: DomainScore, textStructure: DomainScore, languageFeatures: DomainScore, spellingAndGrammar: DomainScore, originalityReport: OriginalityReport): string[] {
    const recommendations: string[] = [];

    // Priority recommendations for originality issues
    if (originalityReport.promptSimilarity > 50) {
      recommendations.push("🚨 CRITICAL: Avoid copying from the prompt. Create your own original story using the prompt as inspiration only.");
      recommendations.push("💡 Brainstorm your own unique characters, settings, and plot twists that go beyond what's suggested in the prompt.");
      recommendations.push("✍️ Practice writing original opening sentences that capture the prompt's theme in your own words.");
    }

    const domains = [
      { name: "Content & Ideas", score: contentAndIdeas.score, suggestions: [
        "Brainstorm more creative and original ideas using mind maps or freewriting.",
        "Develop your ideas with more details and examples to make them engaging.",
        "Ensure your writing directly addresses all parts of the prompt with original content."
      ]},
      { name: "Text Structure", score: textStructure.score, suggestions: [
        "Practice organizing your thoughts with a clear introduction, body, and conclusion.",
        "Use topic sentences and transition words to improve paragraph flow.",
        "Plan your essay structure before you start writing."
      ]},
      { name: "Language Features", score: languageFeatures.score, suggestions: [
        "Expand your vocabulary by learning new words and their synonyms.",
        "Experiment with different literary devices like metaphors, similes, and personification.",
        "Vary your sentence structures to make your writing more interesting to read."
      ]},
      { name: "Spelling & Grammar", score: spellingAndGrammar.score, suggestions: [
        "Review basic grammar rules, especially subject-verb agreement and tense consistency.",
        "Pay close attention to punctuation, particularly commas and apostrophes.",
        "Proofread your work carefully for spelling errors, perhaps reading it aloud."
      ]}
    ];

    // Sort domains by score to prioritize the lowest scoring areas
    domains.sort((a, b) => a.score - b.score);

    // Add personalized recommendations based on the lowest scoring domains
    for (const domain of domains) {
      if (domain.score < 7) { // Only add recommendations for areas needing improvement
        recommendations.push(`📚 ${domain.name}: ${domain.suggestions[0]}`);
      }
    }

    return recommendations.slice(0, 6); // Limit to 6 recommendations
  }

  private static identifyStrengths(contentAndIdeas: DomainScore, textStructure: DomainScore, languageFeatures: DomainScore, spellingAndGrammar: DomainScore): string[] {
    const strengths: string[] = [];
    
    if (contentAndIdeas.score >= 7) strengths.push("Strong creative ideas and original thinking");
    if (textStructure.score >= 7) strengths.push("Well-organized narrative structure");
    if (languageFeatures.score >= 7) strengths.push("Effective use of vocabulary and language features");
    if (spellingAndGrammar.score >= 7) strengths.push("Good technical accuracy in spelling and grammar");
    
    return strengths;
  }

  private static identifyImprovements(contentAndIdeas: DomainScore, textStructure: DomainScore, languageFeatures: DomainScore, spellingAndGrammar: DomainScore, originalityReport: OriginalityReport): string[] {
    const improvements: string[] = [];
    
    if (originalityReport.promptSimilarity > 50) {
      improvements.push({ area: "Originality", issue: "Content copied from prompt", suggestion: "Create original story elements", evidence: "High similarity to prompt detected" });
    }
    
    if (contentAndIdeas.score < 5) improvements.push({ area: "Ideas & Content", issue: "Limited creativity", suggestion: "Develop more original and engaging ideas", evidence: "Low creativity score" });
    if (textStructure.score < 5) improvements.push({ area: "Structure & Organization", issue: "Poor organization", suggestion: "Improve narrative structure and flow", evidence: "Low structure score" });
    if (languageFeatures.score < 5) improvements.push({ area: "Language & Vocabulary", issue: "Basic language use", suggestion: "Enhance vocabulary and use literary devices", evidence: "Low language score" });
    if (spellingAndGrammar.score < 5) improvements.push({ area: "Spelling & Grammar", issue: "Technical errors", suggestion: "Focus on spelling, grammar, and punctuation accuracy", evidence: "Multiple technical errors found" });
    
    return improvements;
  }

  // Implement remaining helper methods with real logic
  private static identifySophisticatedVocabulary(essay: string): string[] {
    const sophisticatedWords = ['magnificent', 'extraordinary', 'mysterious', 'shimmering', 'ornate', 'ancient', 'whispered', 'discovered', 'magnificent', 'extraordinary'];
    return sophisticatedWords.filter(word => essay.toLowerCase().includes(word.toLowerCase()));
  }

  private static identifyRepetitiveWords(words: string[]): string[] {
    const wordCount: { [key: string]: number } = {};
    words.forEach(word => {
      const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
      if (cleanWord.length > 3) {
        wordCount[cleanWord] = (wordCount[cleanWord] || 0) + 1;
      }
    });
    
    return Object.keys(wordCount).filter(word => wordCount[word] > 3);
  }

  private static identifyLiteraryDevices(essay: string): string[] {
    const devices: string[] = [];
    
    if (essay.includes(' like ') || essay.includes(' as ')) devices.push('Simile');
    if (essay.includes(' was ') && (essay.includes(' a ') || essay.includes(' an '))) devices.push('Metaphor');
    if (/[A-Z][a-z]+ [a-z]+ed/.test(essay)) devices.push('Personification');
    if (essay.includes('"')) devices.push('Dialogue');
    
    return devices;
  }

  private static hasEffectiveIntroduction(essay: string): boolean {
    const firstSentence = essay.split(/[.!?]+/)[0];
    return firstSentence && firstSentence.length > 20;
  }

  private static hasEffectiveConclusion(essay: string): boolean {
    const sentences = essay.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const lastSentence = sentences[sentences.length - 1];
    return lastSentence && (lastSentence.includes('finally') || lastSentence.includes('end') || lastSentence.length > 20);
  }

  private static countSpellingErrors(essay: string): number {
    // Simple spelling error detection - in real implementation, use a spell checker
    const commonErrors = ['teh', 'adn', 'hte', 'recieve', 'seperate', 'definately', 'occured', 'begining'];
    let errorCount = 0;
    
    commonErrors.forEach(error => {
      const regex = new RegExp(error, 'gi');
      const matches = essay.match(regex);
      if (matches) errorCount += matches.length;
    });
    
    // Also check for obvious typos like "immeditalouly" from the example
    const words = essay.split(/\s+/);
    words.forEach(word => {
      const cleanWord = word.replace(/[^a-zA-Z]/g, '');
      if (cleanWord.length > 8 && /[a-z]{3,}[a-z]{3,}/.test(cleanWord) && !this.isValidWord(cleanWord)) {
        errorCount++;
      }
    });
    
    return errorCount;
  }

  private static isValidWord(word: string): boolean {
    // Simple word validation - in real implementation, use a dictionary
    const commonWords = ['immediately', 'definitely', 'beautiful', 'mysterious', 'grandmother', 'afternoon', 'discovered'];
    return commonWords.includes(word.toLowerCase());
  }

  private static identifyGrammarIssues(essay: string): string[] {
    const issues: string[] = [];
    
    // Check for basic grammar issues
    if (essay.includes(' i ') && !essay.includes(' I ')) issues.push('Capitalization of "I"');
    if (/\s[a-z]/.test(essay.substring(0, 50))) issues.push('Sentence capitalization');
    if (!essay.includes('.') && !essay.includes('!') && !essay.includes('?')) issues.push('Missing punctuation');
    
    return issues;
  }

  private static identifyPunctuationIssues(essay: string): string[] {
    const issues: string[] = [];
    
    if (essay.includes(',,')) issues.push('Double commas');
    if (essay.includes('..')) issues.push('Double periods');
    if (/[a-z][A-Z]/.test(essay)) issues.push('Missing punctuation between sentences');
    
    return issues;
  }

  private static analyzeSentenceVariety(simple: number, compound: number, complex: number): string {
    const total = simple + compound + complex;
    if (total === 0) return "No sentences found";
    
    const simplePercent = Math.round((simple / total) * 100);
    const compoundPercent = Math.round((compound / total) * 100);
    const complexPercent = Math.round((complex / total) * 100);
    
    return `Simple: ${simplePercent}%, Compound: ${compoundPercent}%, Complex: ${complexPercent}%`;
  }

  private static generateVocabularySuggestions(repetitiveWords: string[]): string[] {
    const suggestions: string[] = [];
    
    repetitiveWords.forEach(word => {
      switch (word) {
        case 'said':
          suggestions.push('Try: whispered, exclaimed, declared, announced');
          break;
        case 'went':
          suggestions.push('Try: walked, ran, hurried, strolled');
          break;
        case 'big':
          suggestions.push('Try: enormous, massive, gigantic, huge');
          break;
        default:
          suggestions.push(`Consider synonyms for "${word}"`);
      }
    });
    
    return suggestions;
  }

  private static suggestLiteraryDevices(essay: string, identified: string[]): string[] {
    const suggestions: string[] = [];
    
    if (!identified.includes('Simile')) {
      suggestions.push('Try adding a simile (comparison using "like" or "as")');
    }
    if (!identified.includes('Metaphor')) {
      suggestions.push('Consider using a metaphor to make your description more vivid');
    }
    if (!identified.includes('Dialogue')) {
      suggestions.push('Add dialogue to make your characters come alive');
    }
    
    return suggestions;
  }

  private static assessCoherence(essay: string, paragraphs: string[]): string {
    if (paragraphs.length < 2) return "Single paragraph - consider breaking into multiple paragraphs";
    if (paragraphs.length > 5) return "Good paragraph structure with clear organization";
    return "Adequate paragraph organization";
  }
}

export default NSWEvaluationReportGenerator;