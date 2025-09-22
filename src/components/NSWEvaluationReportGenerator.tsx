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
  essayContent: string;
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
    
    const analysis = this.analyzeEssay(essayContent);
    
    // Score each domain according to NSW criteria
    const contentAndIdeas = this.scoreContentAndIdeas(essayContent, analysis, "Content & Ideas");
    const textStructure = this.scoreTextStructure(essayContent, analysis, "Text Structure");
    const languageFeatures = this.scoreLanguageFeatures(essayContent, analysis, "Language Features");
    const spellingAndGrammar = this.scoreSpellingAndGrammar(essayContent, analysis, "Spelling & Grammar");
    
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
      recommendations: this.generatePersonalizedRecommendations(contentAndIdeas, textStructure, languageFeatures, spellingAndGrammar),
      strengths: this.identifyStrengths(contentAndIdeas, textStructure, languageFeatures, spellingAndGrammar),
      areasForImprovement: this.identifyImprovements(contentAndIdeas, textStructure, languageFeatures, spellingAndGrammar),
      essayContent: essayContent
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
  
  private static scoreContentAndIdeas(essay: string, analysis: DetailedFeedback, domainName: string): DomainScore {
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
      specificExamples,
      childFriendlyExplanation: this.generateChildFriendlyExplanation(domainName, score)
    };
  }
  
  private static scoreTextStructure(essay: string, analysis: DetailedFeedback, domainName: string): DomainScore {
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
      specificExamples,
      childFriendlyExplanation: this.generateChildFriendlyExplanation(domainName, score)
    };
  }
  
  private static scoreLanguageFeatures(essay: string, analysis: DetailedFeedback, domainName: string): DomainScore {
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
      specificExamples,
      childFriendlyExplanation: this.generateChildFriendlyExplanation(domainName, score)
    };
  }
  
  private static scoreSpellingAndGrammar(essay: string, analysis: DetailedFeedback, domainName: string): DomainScore {
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
      specificExamples,
      childFriendlyExplanation: this.generateChildFriendlyExplanation(domainName, score)
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
    if (score >= 80) return "A";
    if (score >= 70) return "B";
    if (score >= 60) return "C";
    if (score >= 50) return "D";
    return "E";
  }

  private static generateChildFriendlyExplanation(domain: string, score: number): string {
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

  private static generatePersonalizedRecommendations(contentAndIdeas: DomainScore, textStructure: DomainScore, languageFeatures: DomainScore, spellingAndGrammar: DomainScore): string[] {
    const recommendations: string[] = [];

    const domains = [
      { name: "Content & Ideas", score: contentAndIdeas.score, suggestions: [
        "Brainstorm more creative and original ideas using mind maps or freewriting.",
        "Develop your ideas with more details and examples to make them engaging.",
        "Ensure your writing directly addresses all parts of the prompt."
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
      if (domain.score <= 5) { // Consider scores 5 and below as needing improvement
        recommendations.push(`For ${domain.name}: ${domain.suggestions[0]}`);
        if (domain.score <= 3) { // For very low scores, add more specific suggestions
          recommendations.push(`For ${domain.name}: ${domain.suggestions[1]}`);
          recommendations.push(`For ${domain.name}: ${domain.suggestions[2]}`);
        }
      }
    }

    // Ensure there are at least a few general recommendations if all scores are high
    if (recommendations.length === 0) {
      recommendations.push("Keep up the great work! Continue to read widely and practice writing regularly to further hone your skills.");
      recommendations.push("Challenge yourself by experimenting with new writing styles or more complex prompts.");
    }

    return recommendations;
  }

  // Placeholder implementations for other analysis methods
  private static identifySophisticatedVocabulary(essay: string): string[] { return []; }
  private static identifyRepetitiveWords(words: string[]): string[] { return []; }
  private static identifyLiteraryDevices(essay: string): string[] { return []; }
  private static hasEffectiveIntroduction(essay: string): boolean { return true; }
  private static hasEffectiveConclusion(essay: string): boolean { return true; }
  private static countSpellingErrors(essay: string): number { return 0; }
  private static identifyGrammarIssues(essay: string): string[] { return []; }
  private static identifyPunctuationIssues(essay: string): string[] { return []; }
  private static analyzeSentenceVariety(simple: number, compound: number, complex: number): string { return ""; }
  private static generateVocabularySuggestions(repetitiveWords: string[]): string[] { return []; }
  private static suggestLiteraryDevices(essay: string, identified: string[]): string[] { return []; }
  private static assessCoherence(essay: string, paragraphs: string[]): string { return ""; }
  private static extractContentExamples(essay: string, score: number): string[] { return []; }
  private static assessCreativity(essay: string): number { return 5; }
  private static assessIdeaDevelopment(essay: string): number { return 5; }
  private static assessEngagement(essay: string): number { return 5; }
  private static extractStructureExamples(essay: string, analysis: DetailedFeedback): string[] { return []; }
  private static assessParagraphOrganization(essay: string): number { return 5; }
  private static assessCoherenceScore(coherence: string): number { return 5; }
  private static assessTransitions(essay: string): number { return 5; }
  private static extractLanguageExamples(essay: string, analysis: DetailedFeedback): string[] { return []; }
  private static assessVocabularyScore(vocabAnalysis: any): number { return 5; }
  private static assessLiteraryDeviceScore(literaryDevices: any): number { return 5; }
  private static assessSentenceVarietyScore(sentenceVariety: any): number { return 5; }
  private static assessVoice(essay: string): number { return 5; }
  private static identifyStrengths(contentAndIdeas: DomainScore, textStructure: DomainScore, languageFeatures: DomainScore, spellingAndGrammar: DomainScore): string[] { return []; }
  private static identifyImprovements(contentAndIdeas: DomainScore, textStructure: DomainScore, languageFeatures: DomainScore, spellingAndGrammar: DomainScore): string[] { return []; }
}

const NSWEvaluationReport: React.FC<{ report: EvaluationReport | null }> = ({ report }) => {
  if (!report) {
    return (
      <div className="p-6 text-center">
        <p className="text-lg text-gray-500">Submit an essay for evaluation to see your report.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
        <div className="p-6 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-t-lg">
          <h1 className="text-3xl font-bold text-white">NSW Writing Assessment Report</h1>
          <p className="text-lg">Your Personal Writing Journey Report</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-purple-100 p-4 rounded-lg text-center">
              <h2 className="text-lg font-semibold text-purple-800">Overall Score</h2>
              <p className="text-4xl font-bold text-purple-600">{report.overallScore}</p>
            </div>
            <div className="bg-indigo-100 p-4 rounded-lg text-center">
              <h2 className="text-lg font-semibold text-indigo-800">Overall Grade</h2>
              <p className="text-4xl font-bold text-indigo-600">{report.overallGrade}</p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center"><BarChart3 className="mr-2" /> Domain Scores</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(report.domains).map(([key, domain]) => (
                <div key={key} className="bg-white p-4 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-700">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</h3>
                  <p className="text-2xl font-bold text-gray-800">{domain.score}/{domain.maxScore}</p>
                  <p className="text-sm text-gray-500">{domain.band}</p>
                  <p className="text-sm text-gray-500 mt-2"><em>{domain.childFriendlyExplanation}</em></p>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center"><CheckCircle className="mr-2" /> Strengths</h2>
            <ul className="list-disc list-inside space-y-2">
              {report.strengths.map((strength, index) => (
                <li key={index} className="text-gray-700">{strength}</li>
              ))}
            </ul>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center"><Target className="mr-2" /> Areas for Improvement</h2>
            <ul className="list-disc list-inside space-y-2">
              {report.areasForImprovement.map((improvement, index) => (
                <li key={index} className="text-gray-700">{improvement}</li>
              ))}
            </ul>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center"><Lightbulb className="mr-2" /> Recommendations</h2>
            <ul className="list-disc list-inside space-y-2">
              {report.recommendations.map((rec, index) => (
                <li key={index} className="text-gray-700">{rec}</li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center"><FileText className="mr-2" /> Your Essay</h2>
            <div className="bg-gray-100 p-4 rounded-lg border border-gray-200">
              <p className="text-gray-700 whitespace-pre-wrap">{report.essayContent}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NSWEvaluationReport;

