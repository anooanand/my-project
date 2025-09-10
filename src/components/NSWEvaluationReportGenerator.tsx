import React, { useState } from 'react';
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
  
  static generateReport(essay: string, textType: string = 'narrative'): EvaluationReport {
    const analysis = this.analyzeEssay(essay);
    
    // Score each domain according to NSW criteria
    const contentAndIdeas = this.scoreContentAndIdeas(essay, analysis);
    const textStructure = this.scoreTextStructure(essay, analysis);
    const languageFeatures = this.scoreLanguageFeatures(essay, analysis);
    const spellingAndGrammar = this.scoreSpellingAndGrammar(essay, analysis);
    
    // Calculate overall score
    const overallScore = Math.round(
      contentAndIdeas.weightedScore + 
      textStructure.weightedScore + 
      languageFeatures.weightedScore + 
      spellingAndGrammar.weightedScore
    );
    
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
      recommendations: this.generateRecommendations(contentAndIdeas, textStructure, languageFeatures, spellingAndGrammar),
      strengths: this.identifyStrengths(contentAndIdeas, textStructure, languageFeatures, spellingAndGrammar),
      areasForImprovement: this.identifyImprovements(contentAndIdeas, textStructure, languageFeatures, spellingAndGrammar)
    };
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
  
  private static scoreContentAndIdeas(essay: string, analysis: DetailedFeedback): DomainScore {
    let score = 5; // Start with proficient
    const feedback: string[] = [];
    const specificExamples: string[] = [];
    
    // Assess originality and creativity
    const creativityScore = this.assessCreativity(essay);
    const ideaDevelopmentScore = this.assessIdeaDevelopment(essay);
    const engagementScore = this.assessEngagement(essay);
    
    // Calculate score based on multiple factors
    const avgScore = (creativityScore + ideaDevelopmentScore + engagementScore) / 3;
    score = Math.round(avgScore);
    
    // Generate specific feedback
    if (score >= 9) {
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
      feedback.push("Basic idea development");
      feedback.push("Some engaging elements but mostly predictable");
    } else {
      feedback.push("Minimal creativity or originality");
      feedback.push("Ideas lack development");
      feedback.push("Content lacks engagement");
    }
    
    // Add specific examples from the text
    specificExamples.push(...this.extractContentExamples(essay, score));
    
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
      specificExamples
    };
  }
  
  private static scoreTextStructure(essay: string, analysis: DetailedFeedback): DomainScore {
    let score = 5;
    const feedback: string[] = [];
    const specificExamples: string[] = [];
    
    // Assess structure elements
    const introScore = analysis.structuralElements.hasIntroduction ? 2 : 0;
    const conclusionScore = analysis.structuralElements.hasConclusion ? 2 : 0;
    const paragraphScore = this.assessParagraphOrganization(essay);
    const coherenceScore = this.assessCoherenceScore(analysis.structuralElements.coherence);
    const transitionScore = this.assessTransitions(essay);
    
    score = Math.round((introScore + conclusionScore + paragraphScore + coherenceScore + transitionScore) / 5 * 10);
    score = Math.max(1, Math.min(10, score));
    
    // Generate feedback based on score
    if (score >= 9) {
      feedback.push("Sophisticated and seamless structure");
      feedback.push("Excellent paragraph organization with compelling links");
      feedback.push("Masterful introduction and conclusion");
    } else if (score >= 7) {
      feedback.push("Well-crafted structure");
      feedback.push("Strong paragraph organization with clear links");
      feedback.push("Effective introduction and conclusion");
    } else if (score >= 5) {
      feedback.push("Clear structure overall");
      feedback.push("Adequate paragraph organization");
      feedback.push("Suitable introduction and conclusion");
    } else if (score >= 3) {
      feedback.push("Basic structure with some lapses");
      feedback.push("Inconsistent paragraph organization");
      feedback.push("Simple introduction and/or conclusion");
    } else {
      feedback.push("Minimal or confused structure");
      feedback.push("Limited paragraph organization");
      feedback.push("Missing or ineffective introduction/conclusion");
    }
    
    specificExamples.push(...this.extractStructureExamples(essay, analysis));
    
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
      specificExamples
    };
  }
  
  private static scoreLanguageFeatures(essay: string, analysis: DetailedFeedback): DomainScore {
    let score = 5;
    const feedback: string[] = [];
    const specificExamples: string[] = [];
    
    // Assess vocabulary sophistication
    const vocabScore = this.assessVocabularyScore(analysis.vocabularyAnalysis);
    const literaryDeviceScore = this.assessLiteraryDeviceScore(analysis.literaryDevices);
    const sentenceVarietyScore = this.assessSentenceVarietyScore(analysis.sentenceVariety);
    const voiceScore = this.assessVoice(essay);
    
    score = Math.round((vocabScore + literaryDeviceScore + sentenceVarietyScore + voiceScore) / 4);
    score = Math.max(1, Math.min(10, score));
    
    // Generate feedback
    if (score >= 9) {
      feedback.push("Sophisticated and precise vocabulary");
      feedback.push("Masterful use of literary devices");
      feedback.push("Excellent sentence variety and control");
      feedback.push("Engaging and authentic voice throughout");
    } else if (score >= 7) {
      feedback.push("Well-chosen and varied vocabulary");
      feedback.push("Effective use of literary devices");
      feedback.push("Good sentence variety and control");
      feedback.push("Clear and consistent voice");
    } else if (score >= 5) {
      feedback.push("Appropriate vocabulary with some variety");
      feedback.push("Adequate use of literary devices");
      feedback.push("Some sentence variety and generally good control");
      feedback.push("Developing voice");
    } else if (score >= 3) {
      feedback.push("Simple vocabulary with limited variety");
      feedback.push("Limited use of literary devices");
      feedback.push("Limited sentence variety");
      feedback.push("Inconsistent voice");
    } else {
      feedback.push("Basic, repetitive vocabulary");
      feedback.push("Few or no literary devices");
      feedback.push("Little to no sentence variety");
      feedback.push("Minimal voice development");
    }
    
    specificExamples.push(...this.extractLanguageExamples(essay, analysis));
    
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
      specificExamples
    };
  }
  
  private static scoreSpellingAndGrammar(essay: string, analysis: DetailedFeedback): DomainScore {
    let score = 5;
    const feedback: string[] = [];
    const specificExamples: string[] = [];
    
    const wordCount = analysis.wordCount;
    const spellingErrorRate = analysis.technicalAccuracy.spellingErrors / wordCount;
    const grammarIssueCount = analysis.technicalAccuracy.grammarIssues.length;
    const punctuationIssueCount = analysis.technicalAccuracy.punctuationIssues.length;
    
    // Calculate score based on error rates
    if (spellingErrorRate <= 0.01 && grammarIssueCount <= 1 && punctuationIssueCount <= 1) {
      score = 9; // Outstanding
    } else if (spellingErrorRate <= 0.03 && grammarIssueCount <= 2 && punctuationIssueCount <= 2) {
      score = 7; // Highly Proficient
    } else if (spellingErrorRate <= 0.05 && grammarIssueCount <= 4 && punctuationIssueCount <= 3) {
      score = 5; // Proficient
    } else if (spellingErrorRate <= 0.08 && grammarIssueCount <= 6 && punctuationIssueCount <= 5) {
      score = 3; // Basic
    } else {
      score = 1; // Limited
    }
    
    // Generate feedback
    if (score >= 9) {
      feedback.push("Virtually error-free spelling of sophisticated vocabulary");
      feedback.push("Excellent control of punctuation");
      feedback.push("Sophisticated grammatical structures used accurately");
    } else if (score >= 7) {
      feedback.push("Accurate spelling with occasional minor errors");
      feedback.push("Good control of punctuation");
      feedback.push("Complex grammatical structures generally used accurately");
    } else if (score >= 5) {
      feedback.push("Generally accurate spelling with some errors");
      feedback.push("Adequate control of punctuation");
      feedback.push("Simple and complex structures used with reasonable accuracy");
    } else if (score >= 3) {
      feedback.push("Some spelling errors that may interfere with meaning");
      feedback.push("Basic punctuation with some errors");
      feedback.push("Simple structures used with some accuracy");
    } else {
      feedback.push("Frequent spelling errors that interfere with meaning");
      feedback.push("Poor punctuation control");
      feedback.push("Frequent grammatical errors");
    }
    
    // Add specific examples of errors and corrections
    if (analysis.technicalAccuracy.spellingErrors > 0) {
      specificExamples.push(`Spelling accuracy: ${Math.round((1 - spellingErrorRate) * 100)}%`);
    }
    if (grammarIssueCount > 0) {
      specificExamples.push(`Grammar issues identified: ${grammarIssueCount}`);
    }
    if (punctuationIssueCount > 0) {
      specificExamples.push(`Punctuation issues: ${punctuationIssueCount}`);
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
      specificExamples
    };
  }
  
  // Helper methods for analysis
  private static getScoreBand(score: number): string {
    if (score >= 9) return "Outstanding";
    if (score >= 7) return "Highly Proficient";
    if (score >= 5) return "Proficient";
    if (score >= 3) return "Basic";
    return "Limited";
  }
  
  private static getOverallGrade(score: number): string {
    if (score >= 90) return "A+";
    if (score >= 85) return "A";
    if (score >= 80) return "A-";
    if (score >= 75) return "B+";
    if (score >= 70) return "B";
    if (score >= 65) return "B-";
    if (score >= 60) return "C+";
    if (score >= 55) return "C";
    if (score >= 50) return "C-";
    if (score >= 45) return "D+";
    if (score >= 40) return "D";
    return "F";
  }
  
  private static assessCreativity(essay: string): number {
    // Look for creative elements, original ideas, unique perspectives
    const creativityIndicators = [
      /metaphor|simile|personification/i,
      /imagine|picture|envision/i,
      /suddenly|unexpectedly|surprisingly/i,
      /magical|mysterious|enchanted/i,
      /unique|unusual|extraordinary/i
    ];
    
    let score = 5;
    creativityIndicators.forEach(indicator => {
      if (indicator.test(essay)) score += 0.5;
    });
    
    // Check for original plot elements or unique character development
    if (essay.includes('twist') || essay.includes('revelation')) score += 1;
    if (essay.length > 300 && essay.includes('character')) score += 0.5;
    
    return Math.min(10, Math.max(1, Math.round(score)));
  }
  
  private static assessIdeaDevelopment(essay: string): number {
    const paragraphs = essay.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const sentences = essay.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    let score = 5;
    
    // More paragraphs suggest better idea development
    if (paragraphs.length >= 4) score += 1;
    if (paragraphs.length >= 6) score += 1;
    
    // Longer sentences suggest more detailed elaboration
    const avgSentenceLength = essay.length / sentences.length;
    if (avgSentenceLength > 80) score += 1;
    if (avgSentenceLength > 120) score += 1;
    
    // Look for elaboration indicators
    const elaborationWords = ['because', 'since', 'therefore', 'however', 'furthermore', 'moreover', 'additionally'];
    elaborationWords.forEach(word => {
      if (essay.toLowerCase().includes(word)) score += 0.3;
    });
    
    return Math.min(10, Math.max(1, Math.round(score)));
  }
  
  private static assessEngagement(essay: string): number {
    let score = 5;
    
    // Look for engaging elements
    const engagingElements = [
      /dialogue|".*"/,
      /action|running|jumping|fighting/i,
      /emotion|felt|heart|tears|joy|fear/i,
      /sensory|saw|heard|smelled|tasted|touched/i,
      /suspense|tension|mystery/i
    ];
    
    engagingElements.forEach(element => {
      if (element.test(essay)) score += 0.7;
    });
    
    // Strong opening and closing
    const firstSentence = essay.split(/[.!?]/)[0];
    const lastSentence = essay.split(/[.!?]/).slice(-2)[0];
    
    if (firstSentence && firstSentence.length > 30) score += 0.5;
    if (lastSentence && lastSentence.length > 20) score += 0.5;
    
    return Math.min(10, Math.max(1, Math.round(score)));
  }
  
  private static identifySophisticatedVocabulary(essay: string): string[] {
    const sophisticatedWords = [
      'magnificent', 'extraordinary', 'exceptional', 'remarkable', 'phenomenal',
      'intricate', 'elaborate', 'sophisticated', 'compelling', 'captivating',
      'mesmerizing', 'enchanting', 'breathtaking', 'awe-inspiring', 'profound',
      'eloquent', 'articulate', 'perceptive', 'insightful', 'astute'
    ];
    
    const words = essay.toLowerCase().split(/\s+/);
    return sophisticatedWords.filter(word => words.includes(word));
  }
  
  private static identifyRepetitiveWords(words: string[]): string[] {
    const wordCount: { [key: string]: number } = {};
    words.forEach(word => {
      const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
      if (cleanWord.length > 3) {
        wordCount[cleanWord] = (wordCount[cleanWord] || 0) + 1;
      }
    });
    
    return Object.entries(wordCount)
      .filter(([word, count]) => count > 3)
      .map(([word]) => word);
  }
  
  private static identifyLiteraryDevices(essay: string): string[] {
    const devices: string[] = [];
    
    // Metaphor detection
    if (/is a|was a|are|were/.test(essay) && !/literally/.test(essay)) {
      devices.push("Metaphor");
    }
    
    // Simile detection
    if (/like|as.*as/.test(essay)) {
      devices.push("Simile");
    }
    
    // Personification detection
    if (/wind.*whispered|sun.*smiled|trees.*danced|shadows.*crept/i.test(essay)) {
      devices.push("Personification");
    }
    
    // Alliteration detection
    const words = essay.split(/\s+/);
    for (let i = 0; i < words.length - 1; i++) {
      if (words[i][0] && words[i][0].toLowerCase() === words[i + 1][0]?.toLowerCase()) {
        devices.push("Alliteration");
        break;
      }
    }
    
    // Dialogue detection
    if (/".*"/.test(essay)) {
      devices.push("Dialogue");
    }
    
    return [...new Set(devices)];
  }
  
  private static hasEffectiveIntroduction(essay: string): boolean {
    const firstParagraph = essay.split(/\n\s*\n/)[0];
    return firstParagraph && firstParagraph.length > 50;
  }
  
  private static hasEffectiveConclusion(essay: string): boolean {
    const paragraphs = essay.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const lastParagraph = paragraphs[paragraphs.length - 1];
    return lastParagraph && lastParagraph.length > 30;
  }
  
  private static countSpellingErrors(essay: string): number {
    // This is a simplified spelling check - in a real implementation,
    // you would use a proper spell-checking library
    const commonMisspellings = [
      'recieve', 'seperate', 'definately', 'occured', 'begining',
      'untill', 'wich', 'thier', 'freind', 'beleive'
    ];
    
    let errors = 0;
    const words = essay.toLowerCase().split(/\s+/);
    words.forEach(word => {
      const cleanWord = word.replace(/[^\w]/g, '');
      if (commonMisspellings.includes(cleanWord)) {
        errors++;
      }
    });
    
    return errors;
  }
  
  private static identifyGrammarIssues(essay: string): string[] {
    const issues: string[] = [];
    
    // Check for common grammar issues
    if (/\bi\s/g.test(essay)) {
      issues.push("Capitalization: 'I' should always be capitalized");
    }
    
    if (/its'/g.test(essay)) {
      issues.push("Possessive: 'its' doesn't need an apostrophe");
    }
    
    if (/your\s+(going|coming|doing)/i.test(essay)) {
      issues.push("Contraction: Should be 'you're' not 'your'");
    }
    
    return issues;
  }
  
  private static identifyPunctuationIssues(essay: string): string[] {
    const issues: string[] = [];
    
    // Check for missing periods
    const sentences = essay.split(/\n/).filter(line => line.trim().length > 0);
    sentences.forEach(sentence => {
      if (sentence.trim().length > 10 && !/[.!?]$/.test(sentence.trim())) {
        issues.push("Missing end punctuation");
      }
    });
    
    // Check for comma splices
    if (/,\s*[a-z]/g.test(essay)) {
      issues.push("Possible comma splice");
    }
    
    return [...new Set(issues)];
  }
  
  // Additional helper methods would continue here...
  // (Truncated for brevity - the full implementation would include all helper methods)
  
  private static generateRecommendations(content: DomainScore, structure: DomainScore, language: DomainScore, grammar: DomainScore): string[] {
    const recommendations: string[] = [];
    
    if (content.score < 7) {
      recommendations.push("Focus on developing more original and creative ideas");
      recommendations.push("Elaborate on your ideas with more specific details and examples");
    }
    
    if (structure.score < 7) {
      recommendations.push("Work on creating stronger paragraph organization with clear topic sentences");
      recommendations.push("Use more effective transitions between ideas and paragraphs");
    }
    
    if (language.score < 7) {
      recommendations.push("Expand your vocabulary by reading more sophisticated texts");
      recommendations.push("Practice using literary devices like metaphors, similes, and personification");
    }
    
    if (grammar.score < 7) {
      recommendations.push("Proofread your work carefully for spelling and grammar errors");
      recommendations.push("Practice using complex sentence structures correctly");
    }
    
    return recommendations;
  }
  
  private static identifyStrengths(content: DomainScore, structure: DomainScore, language: DomainScore, grammar: DomainScore): string[] {
    const strengths: string[] = [];
    
    if (content.score >= 7) strengths.push("Strong creative ideas and content development");
    if (structure.score >= 7) strengths.push("Well-organized structure with clear progression");
    if (language.score >= 7) strengths.push("Sophisticated vocabulary and language use");
    if (grammar.score >= 7) strengths.push("Good technical accuracy in spelling and grammar");
    
    return strengths;
  }
  
  private static identifyImprovements(content: DomainScore, structure: DomainScore, language: DomainScore, grammar: DomainScore): string[] {
    const improvements: string[] = [];
    
    if (content.score < 7) improvements.push("Content and Ideas development");
    if (structure.score < 7) improvements.push("Text structure and organization");
    if (language.score < 7) improvements.push("Language features and vocabulary");
    if (grammar.score < 7) improvements.push("Spelling and grammar accuracy");
    
    return improvements;
  }
  
  // Placeholder methods for additional analysis functions
  private static analyzeSentenceVariety(simple: number, compound: number, complex: number): string {
    const total = simple + compound + complex;
    if (total === 0) return "No sentences detected";
    
    const simplePercent = (simple / total) * 100;
    const compoundPercent = (compound / total) * 100;
    const complexPercent = (complex / total) * 100;
    
    if (complexPercent > 40) return "Excellent sentence variety with strong use of complex structures";
    if (compoundPercent + complexPercent > 60) return "Good sentence variety";
    if (simplePercent > 70) return "Limited sentence variety - try using more complex structures";
    return "Adequate sentence variety";
  }
  
  private static generateVocabularySuggestions(repetitiveWords: string[]): string[] {
    return repetitiveWords.map(word => `Consider using synonyms for '${word}' to add variety`);
  }
  
  private static suggestLiteraryDevices(essay: string, identified: string[]): string[] {
    const suggestions: string[] = [];
    
    if (!identified.includes("Metaphor")) {
      suggestions.push("Try adding a metaphor to create vivid imagery");
    }
    if (!identified.includes("Simile")) {
      suggestions.push("Consider using similes to make comparisons more engaging");
    }
    if (!identified.includes("Personification")) {
      suggestions.push("Use personification to bring inanimate objects to life");
    }
    
    return suggestions;
  }
  
  private static assessCoherence(essay: string, paragraphs: string[]): string {
    if (paragraphs.length < 2) return "Limited";
    if (paragraphs.length >= 4) return "Strong";
    return "Adequate";
  }
  
  private static assessParagraphOrganization(essay: string): number {
    const paragraphs = essay.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    if (paragraphs.length >= 4) return 8;
    if (paragraphs.length >= 3) return 6;
    if (paragraphs.length >= 2) return 4;
    return 2;
  }
  
  private static assessCoherenceScore(coherence: string): number {
    switch (coherence) {
      case "Strong": return 8;
      case "Adequate": return 6;
      case "Limited": return 3;
      default: return 5;
    }
  }
  
  private static assessTransitions(essay: string): number {
    const transitionWords = ['however', 'therefore', 'furthermore', 'meanwhile', 'consequently', 'nevertheless', 'moreover'];
    let score = 4;
    
    transitionWords.forEach(word => {
      if (essay.toLowerCase().includes(word)) score += 0.5;
    });
    
    return Math.min(8, score);
  }
  
  private static assessVocabularyScore(vocabAnalysis: any): number {
    const sophisticatedCount = vocabAnalysis.sophisticatedWords.length;
    const repetitiveCount = vocabAnalysis.repetitiveWords.length;
    
    let score = 5;
    score += sophisticatedCount * 0.5;
    score -= repetitiveCount * 0.3;
    
    return Math.min(10, Math.max(1, Math.round(score)));
  }
  
  private static assessLiteraryDeviceScore(literaryDevices: any): number {
    const deviceCount = literaryDevices.identified.length;
    return Math.min(10, Math.max(1, 3 + deviceCount));
  }
  
  private static assessSentenceVarietyScore(sentenceVariety: any): number {
    const total = sentenceVariety.simple + sentenceVariety.compound + sentenceVariety.complex;
    if (total === 0) return 1;
    
    const complexRatio = sentenceVariety.complex / total;
    const compoundRatio = sentenceVariety.compound / total;
    
    if (complexRatio > 0.3) return 9;
    if (complexRatio > 0.2 || compoundRatio > 0.3) return 7;
    if (complexRatio > 0.1 || compoundRatio > 0.2) return 5;
    return 3;
  }
  
  private static assessVoice(essay: string): number {
    // Look for consistent voice indicators
    const firstPerson = (essay.match(/\bI\b/g) || []).length;
    const thirdPerson = (essay.match(/\b(he|she|they)\b/gi) || []).length;
    const totalWords = essay.split(/\s+/).length;
    
    // Consistent voice usage
    if (firstPerson > totalWords * 0.02 || thirdPerson > totalWords * 0.05) {
      return 7;
    }
    
    return 5;
  }
  
  private static extractContentExamples(essay: string, score: number): string[] {
    const examples: string[] = [];
    const sentences = essay.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    if (sentences.length > 0) {
      examples.push(`Opening: "${sentences[0].trim()}..."`);
    }
    
    if (score >= 7) {
      examples.push("Demonstrates strong creative elements and original thinking");
    }
    
    return examples;
  }
  
  private static extractStructureExamples(essay: string, analysis: any): string[] {
    const examples: string[] = [];
    
    examples.push(`Paragraph count: ${analysis.structuralElements.paragraphCount}`);
    
    if (analysis.structuralElements.hasIntroduction) {
      examples.push("Effective introduction present");
    }
    
    if (analysis.structuralElements.hasConclusion) {
      examples.push("Clear conclusion present");
    }
    
    return examples;
  }
  
  private static extractLanguageExamples(essay: string, analysis: any): string[] {
    const examples: string[] = [];
    
    if (analysis.vocabularyAnalysis.sophisticatedWords.length > 0) {
      examples.push(`Sophisticated vocabulary: ${analysis.vocabularyAnalysis.sophisticatedWords.join(', ')}`);
    }
    
    if (analysis.literaryDevices.identified.length > 0) {
      examples.push(`Literary devices used: ${analysis.literaryDevices.identified.join(', ')}`);
    }
    
    return examples;
  }
}
