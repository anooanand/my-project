// src/components/NSWEvaluationReportGenerator.tsx

import { DetailedFeedback } from "../types/feedback";

interface NSWEvaluationReportParams {
  essayContent: string;
  textType: string;
  prompt: string;
  wordCount: number;
  targetWordCountMin: number;
  targetWordCountMax: number;
}

export class NSWEvaluationReportGenerator {
  private static maxScorePerCriterion = 10; // Changed from 5 to 10

  static generateReport(params: NSWEvaluationReportParams): any {
    const { essayContent, textType, prompt, wordCount, targetWordCountMin, targetWordCountMax } = params;

    // CHECK FOR PROMPT COPYING
    if (this.detectPromptCopying(essayContent, prompt)) {
      throw new Error("Your submission appears to be the prompt itself or contains insufficient original content. Please write your own creative response to the prompt (minimum 50 original words required).");
    }

    // Placeholder for actual AI evaluation logic
    // In a real scenario, this would involve calling an AI model
    // For this demo, we'll use deterministic scoring based on content length and some keywords

    const contentAndIdeasScore = this.scoreContentAndIdeas(essayContent, prompt);
    const textStructureScore = this.scoreTextStructure(essayContent);
    const languageFeaturesScore = this.scoreLanguageFeatures(essayContent);
    const spellingAndGrammarScore = this.scoreSpellingAndGrammar(essayContent);

    const domains = {
      contentAndIdeas: {
        score: contentAndIdeasScore,
        maxScore: 10,
        percentage: (contentAndIdeasScore / 10) * 100,
        band: this.getScoreBand(contentAndIdeasScore),
        weight: 40,
        weightedScore: (contentAndIdeasScore / 10) * 40,
        feedback: this.getFeedbackForContentAndIdeas(contentAndIdeasScore),
        specificExamples: this.getSpecificExamplesForContentAndIdeas(essayContent, contentAndIdeasScore),
        childFriendlyExplanation: this.getChildFriendlyExplanation('contentAndIdeas', contentAndIdeasScore)
      },
      textStructure: {
        score: textStructureScore,
        maxScore: 10,
        percentage: (textStructureScore / 10) * 100,
        band: this.getScoreBand(textStructureScore),
        weight: 20,
        weightedScore: (textStructureScore / 10) * 20,
        feedback: this.getFeedbackForTextStructure(textStructureScore),
        specificExamples: this.getSpecificExamplesForTextStructure(essayContent, textStructureScore),
        childFriendlyExplanation: this.getChildFriendlyExplanation('textStructure', textStructureScore)
      },
      languageFeatures: {
        score: languageFeaturesScore,
        maxScore: 10,
        percentage: (languageFeaturesScore / 10) * 100,
        band: this.getScoreBand(languageFeaturesScore),
        weight: 25,
        weightedScore: (languageFeaturesScore / 10) * 25,
        feedback: this.getFeedbackForLanguageFeatures(languageFeaturesScore),
        specificExamples: this.getSpecificExamplesForLanguageFeatures(essayContent, languageFeaturesScore),
        childFriendlyExplanation: this.getChildFriendlyExplanation('languageFeatures', languageFeaturesScore)
      },
      spellingAndGrammar: {
        score: spellingAndGrammarScore,
        maxScore: 10,
        percentage: (spellingAndGrammarScore / 10) * 100,
        band: this.getScoreBand(spellingAndGrammarScore),
        weight: 15,
        weightedScore: (spellingAndGrammarScore / 10) * 15,
        feedback: this.getFeedbackForSpellingAndGrammar(spellingAndGrammarScore),
        specificExamples: this.getSpecificExamplesForSpellingAndGrammar(essayContent, spellingAndGrammarScore),
        childFriendlyExplanation: this.getChildFriendlyExplanation('spellingAndGrammar', spellingAndGrammarScore)
      },
    };

    const overallScore = this.calculateOverallScore(domains);
    const overallGrade = this.getOverallGrade(overallScore);

    const strengths = this.getOverallStrengths(domains);
    const areasForImprovement = this.getOverallAreasForImprovement(domains);
    const recommendations = this.getOverallRecommendations(overallScore);

    return {
      overallScore,
      overallGrade,
      domains,
      detailedFeedback: {
        wordCount,
        sentenceVariety: this.analyzeSentenceVariety(essayContent),
        vocabularyAnalysis: this.analyzeVocabulary(essayContent),
        literaryDevices: this.identifyLiteraryDevices(essayContent),
        structuralElements: this.analyzeStructure(essayContent),
        technicalAccuracy: this.analyzeTechnicalAccuracy(essayContent)
      },
      strengths,
      areasForImprovement,
      recommendations,
      essayContent, // Include original essay content
      reportId: `nsw-${Date.now()}`,
      date: new Date().toLocaleDateString("en-AU"),
      originalityReport: { score: 95, feedback: "Your essay shows strong originality." }, // Placeholder
    };
  }

  private static detectPromptCopying(essayContent: string, prompt: string): boolean {
    // Normalize text
    const normalizedEssay = essayContent.trim().toLowerCase();
    const normalizedPrompt = prompt.trim().toLowerCase();
    
    // If essay is empty or too short
    if (normalizedEssay.length < 100) {
      return true; // Too short to be a real essay
    }
    
    // Check if the ENTIRE prompt appears as a continuous block in the essay
    // (Some overlap is OK, but not the full prompt verbatim)
    if (normalizedPrompt.length > 50 && normalizedEssay.includes(normalizedPrompt)) {
      return true; // Exact copy of prompt found
    }
    
    // Calculate word overlap more intelligently
    const essayWords = new Set(normalizedEssay.split(/\s+/).filter(w => w.length > 4));
    const promptWords = new Set(normalizedPrompt.split(/\s+/).filter(w => w.length > 4));
    
    // Remove common words that naturally appear in both
    const commonWords = new Set(['story', 'write', 'describe', 'character', 'about', 'that', 'this', 'they', 'their', 'what', 'when', 'where', 'how']);
    
    const uniqueEssayWords = [...essayWords].filter(w => !commonWords.has(w) && !promptWords.has(w));
    
    // Must have at least 30 unique words not in the prompt (excluding common words)
    if (uniqueEssayWords.length < 30) {
      return true;
    }
    
    return false;
  }

  private static calculateSimilarity(str1: string, str2: string): number {
    const words1 = str1.split(/\s+/);
    const words2 = str2.split(/\s+/);
    const commonWords = words1.filter(word => words2.includes(word));
    return commonWords.length / Math.max(words1.length, words2.length);
  }

  private static calculateOverallScore(domains: any): number {
    let totalWeightedScore = 0;
    let totalWeight = 0;
    for (const key in domains) {
      const domain = domains[key];
      totalWeightedScore += (domain.score / this.maxScorePerCriterion) * domain.weight;
      totalWeight += domain.weight;
    }
    return Math.round((totalWeightedScore / totalWeight) * 100);
  }

  private static getOverallGrade(score: number): string {
    if (score >= 90) return "A+";  // Changed from 85
    if (score >= 80) return "A";   // Changed from 75
    if (score >= 70) return "B+";  // NEW
    if (score >= 60) return "B";   // Changed from 65
    if (score >= 50) return "C";
    if (score >= 40) return "D";   // NEW
    return "E";                     // Changed from D
  }

  private static getScoreBand(score: number): string {
    if (score >= 9) return "Outstanding";
    if (score >= 7) return "High";
    if (score >= 5) return "Sound";
    if (score >= 3) return "Basic";
    return "Limited";
  }

  private static scoreContentAndIdeas(essayContent: string, prompt: string): number {
    let score = 4; // Base score changed from 6 to 4
    const lowerContent = essayContent.toLowerCase();
    const words = essayContent.split(/\s+/);
    
    // Reward substantial content
    if (words.length > 150) score += 1;
    if (words.length > 250) score += 1;
    
    // Check for creativity (presence of vivid adjectives/adverbs)
    const creativeWords = ["enchanted", "magical", "whisper", "shimmering", "kaleidoscope", 
                           "bioluminescent", "crystalline", "starlight", "mysterious", "ancient",
                           "glowing", "sparkling", "twisted", "shadowy", "brilliant"];
    const creativeCount = creativeWords.filter(word => lowerContent.includes(word)).length;
    if (creativeCount >= 2) score += 1;
    if (creativeCount >= 4) score += 1;
    
    // Check for character development or plot progression
    if (lowerContent.includes("realized") || lowerContent.includes("discovered") || 
        lowerContent.includes("learned") || lowerContent.includes("understood")) {
      score += 1;
    }
    
    // Check for emotional depth
    const emotionWords = ["fear", "joy", "wonder", "surprise", "amazed", "worried", "excited", "nervous"];
    if (emotionWords.some(word => lowerContent.includes(word))) {
      score += 1;
    }
    
    return Math.min(score, this.maxScorePerCriterion);
  }

  private static scoreTextStructure(essayContent: string): number {
    let score = 4;
    const paragraphs = essayContent.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const sentences = essayContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Paragraph structure
    if (paragraphs.length >= 3) score += 1;
    if (paragraphs.length >= 5) score += 1;
    
    // Check for varied paragraph lengths (sign of good structure)
    if (paragraphs.length >= 3) {
      const avgLength = paragraphs.reduce((sum, p) => sum + p.length, 0) / paragraphs.length;
      const hasVariety = paragraphs.some(p => Math.abs(p.length - avgLength) > avgLength * 0.3);
      if (hasVariety) score += 1;
    }
    
    // Check for transition words (shows flow)
    const transitionWords = ['however', 'therefore', 'meanwhile', 'suddenly', 'finally', 
                             'furthermore', 'moreover', 'consequently', 'nevertheless'];
    const lowerContent = essayContent.toLowerCase();
    const transitionsFound = transitionWords.filter(word => lowerContent.includes(word)).length;
    if (transitionsFound >= 2) score += 1;
    
    // Check for narrative flow (beginning/middle/end indicators)
    const hasOpening = sentences.length > 0 && (
      lowerContent.startsWith('once') || lowerContent.startsWith('one day') || 
      lowerContent.startsWith('long ago') || lowerContent.startsWith('in a')
    );
    const hasClosing = lowerContent.includes('finally') || lowerContent.includes('in the end') ||
                       lowerContent.includes('from that day') || lowerContent.endsWith('home');
    
    if (hasOpening && hasClosing) score += 1;
    
    return Math.min(score, this.maxScorePerCriterion);
  }

  private static scoreLanguageFeatures(essayContent: string): number {
    let score = 4;
    const lowerContent = essayContent.toLowerCase();
    const words = lowerContent.split(/\s+/).filter(w => w.length > 0);
    
    // Vocabulary sophistication
    const longWords = words.filter(word => word.length >= 7).length;
    const sophisticationRatio = longWords / words.length;
    if (sophisticationRatio > 0.12) score += 1;
    if (sophisticationRatio > 0.20) score += 1;
    
    // Figurative language
    const figurativePatterns = [
      /like a [a-z]+/,  // simile
      /as [a-z]+ as/,   // simile
      /[a-z]+ is a [a-z]+/,  // metaphor pattern
    ];
    const figurativeCount = figurativePatterns.filter(pattern => pattern.test(lowerContent)).length;
    if (figurativeCount >= 1) score += 1;
    if (figurativeCount >= 2) score += 1;
    
    // Sensory details (show don't tell)
    const sensoryWords = ['saw', 'heard', 'felt', 'smelled', 'tasted', 'touched',
                          'gleaming', 'echoed', 'rough', 'sweet', 'bitter', 'soft',
                          'bright', 'dark', 'loud', 'quiet', 'warm', 'cold'];
    const sensoryCount = sensoryWords.filter(word => lowerContent.includes(word)).length;
    if (sensoryCount >= 3) score += 1;
    
    // Dialogue (if present)
    const hasDialogue = essayContent.includes('"') || essayContent.includes("'");
    if (hasDialogue) score += 1;
    
    return Math.min(score, this.maxScorePerCriterion);
  }

  private static scoreSpellingAndGrammar(essayContent: string): number {
    let score = 4; // Base score changed from 6 to 4
    // Very basic error detection for demo purposes
    const commonErrors = ["teh", "adn", "wrok", "becuase"];
    const errorsFound = commonErrors.filter(error => essayContent.includes(error)).length;

    if (errorsFound === 0) {
      score += 4; // Changed from 2 to 4
    } else if (errorsFound <= 1) {
      score += 2; // Changed from 1 to 2
    }
    return Math.min(score, this.maxScorePerCriterion);
  }

  private static getFeedbackForContentAndIdeas(score: number): string[] {
    if (score === this.maxScorePerCriterion) return ["Wow! Your ideas are super creative and interesting, making your story really stand out! You have a wonderful imagination that brings your writing to life."];
    if (score >= 8) return ["Your ideas are engaging and show good imagination. Keep developing them!"]; // Changed from 4 to 8
    if (score >= 6) return ["You have some good ideas, but they could be developed further. Try adding more detail."]; // Changed from 3 to 6
    return ["Focus on generating more creative and detailed ideas for your story."];
  }

  private static getFeedbackForTextStructure(score: number): string[] {
    if (score === this.maxScorePerCriterion) return ["Your writing flows perfectly, like a well-told story, with a clear beginning, middle, and end! You've mastered the art of organization."];
    if (score >= 8) return ["Your story has a clear structure that is easy to follow. Good job!"]; // Changed from 4 to 8
    if (score >= 6) return ["Your story has a basic structure, but could benefit from clearer transitions between paragraphs."]; // Changed from 3 to 6
    return ["Work on organizing your ideas into a clear beginning, middle, and end."];
  }

  private static getFeedbackForLanguageFeatures(score: number): string[] {
    if (score === this.maxScorePerCriterion) return ["You use amazing words and clever writing tricks that make your writing shine like a diamond! Your vocabulary is impressive."];
    if (score >= 8) return ["You use a good range of vocabulary and some effective language features."]; // Changed from 4 to 8
    if (score >= 6) return ["Your vocabulary is adequate, but try to incorporate more descriptive words and figurative language."]; // Changed from 3 to 6
    return ["Focus on expanding your vocabulary and using more descriptive language."];
  }

  private static getFeedbackForSpellingAndGrammar(score: number): string[] {
    if (score === this.maxScorePerCriterion) return ["Your writing is almost perfect with spelling, punctuation, and grammar – fantastic work! You're a careful editor."];
    if (score >= 8) return ["You make very few mistakes in spelling, punctuation, and grammar. Great job being careful with your writing!"]; // Changed from 4 to 8
    if (score >= 6) return ["You have some errors in spelling, punctuation, or grammar. Proofread carefully."]; // Changed from 3 to 6
    return ["Review basic spelling and grammar rules. Proofreading is essential!"];
  }

  private static getOverallStrengths(domains: any): string[] {
    const strengths: string[] = [];
    
    // Perfect scores
    if (domains.contentAndIdeas.score >= 9) strengths.push("Exceptional creativity and originality");
    else if (domains.contentAndIdeas.score >= 7) strengths.push("Strong ideas and imagination");
    
    if (domains.textStructure.score >= 9) strengths.push("Excellent organization and flow");
    else if (domains.textStructure.score >= 7) strengths.push("Clear and logical structure");
    
    if (domains.languageFeatures.score >= 9) strengths.push("Sophisticated vocabulary and language use");
    else if (domains.languageFeatures.score >= 7) strengths.push("Good variety in word choice");
    
    if (domains.spellingAndGrammar.score >= 9) strengths.push("Outstanding technical accuracy");
    else if (domains.spellingAndGrammar.score >= 7) strengths.push("Strong grasp of conventions");
    
    return strengths;
  }

  private static getOverallAreasForImprovement(domains: any): string[] {
    const improvements: string[] = [];
    if (domains.contentAndIdeas.score < 6) improvements.push("Idea Development"); // Changed from 3 to 6
    if (domains.textStructure.score < 6) improvements.push("Structural Clarity"); // Changed from 3 to 6
    if (domains.languageFeatures.score < 6) improvements.push("Language Sophistication"); // Changed from 3 to 6
    if (domains.spellingAndGrammar.score < 6) improvements.push("Grammar and Punctuation"); // Changed from 3 to 6
    return improvements;
  }

  private static getOverallRecommendations(overallScore: number): string[] {
    const recommendations: string[] = [];
    
    if (overallScore >= 85) {
      recommendations.push("Outstanding work! To push yourself further, try experimenting with more complex narrative techniques like flashbacks or multiple perspectives.");
      recommendations.push("Read published works in your genre and analyze how professional authors structure their stories.");
    } else if (overallScore >= 70) {
      recommendations.push("Great job! Focus on adding more sensory details to help readers visualize your story.");
      recommendations.push("Practice using varied sentence structures - mix short, punchy sentences with longer, flowing ones.");
    } else if (overallScore >= 55) {
      recommendations.push("Good effort! Work on organizing your ideas into clear paragraphs with topic sentences.");
      recommendations.push("Expand your vocabulary by keeping a word journal of interesting words you encounter.");
    } else {
      recommendations.push("Keep practicing! Start by planning your story with a beginning, middle, and end before you write.");
      recommendations.push("Read your work aloud to catch errors and awkward phrasing.");
      recommendations.push("Focus on one skill at a time - this week work on paragraph structure, next week on descriptive words.");
    }
    
    return recommendations;
  }

  private static getChildFriendlyExplanation(domain: string, score: number): string {
    const explanations = {
      contentAndIdeas: {
        high: "🌟 This means your ideas are creative, interesting, and really engage the reader!",
        medium: "💡 This means you have good ideas, but they could be developed more with extra details.",
        low: "🌱 This means you need to add more creative and detailed ideas to your writing."
      },
      textStructure: {
        high: "🏗️ This means your writing is well-organized with a clear beginning, middle, and end!",
        medium: "📝 This means your writing has structure, but the organization could be clearer.",
        low: "🧩 This means you need to organize your ideas better with clear paragraphs."
      },
      languageFeatures: {
        high: "🎨 This means you use wonderful vocabulary and writing techniques that make your work shine!",
        medium: "✏️ This means you use good language, but could add more descriptive words.",
        low: "📚 This means you should try using more interesting vocabulary and descriptive language."
      },
      spellingAndGrammar: {
        high: "🎯 This means your spelling, punctuation, and grammar are excellent!",
        medium: "✅ This means you have good technical skills with just a few small errors.",
        low: "🔍 This means you need to check your spelling, punctuation, and grammar more carefully."
      }
    };
    
    const level = score >= 8 ? 'high' : score >= 5 ? 'medium' : 'low';
    return explanations[domain]?.[level] || "Keep working on this area!";
  }

  private static getSpecificExamplesForContentAndIdeas(essayContent: string, score: number): string[] {
    const examples = [];
    const sentences = essayContent.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    if (score >= 7 && sentences.length > 0) {
      examples.push(`Strong opening that engages the reader`);
      examples.push(`Ideas are well-developed with good detail`);
    } else if (score >= 5) {
      examples.push("Good start, but add more specific details to develop your ideas");
      examples.push("Consider: What makes your story unique and interesting?");
    } else {
      examples.push("Try adding more descriptive details to paint a vivid picture");
      examples.push("Think about: What can you see, hear, smell, taste, or feel?");
    }
    
    return examples;
  }

  private static getSpecificExamplesForTextStructure(essayContent: string, score: number): string[] {
    const examples = [];
    const paragraphs = essayContent.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    if (score >= 7) {
      examples.push(`Well-organized with ${paragraphs.length} clear paragraphs`);
      examples.push(`Good flow between beginning, middle, and end`);
    } else if (score >= 5) {
      examples.push("Structure is present but could be more developed");
      examples.push("Try: Use topic sentences to start each paragraph");
    } else {
      examples.push("Work on organizing ideas into distinct paragraphs");
      examples.push("Remember: Introduction → Body → Conclusion");
    }
    
    return examples;
  }

  private static getSpecificExamplesForLanguageFeatures(essayContent: string, score: number): string[] {
    const examples = [];
    const words = essayContent.toLowerCase().split(/\s+/);
    const longWords = words.filter(w => w.length >= 7);
    
    if (score >= 7) {
      examples.push(`Good use of sophisticated vocabulary`);
      if (longWords.length > 5) {
        examples.push(`Examples: ${longWords.slice(0, 3).join(', ')}`);
      }
    } else if (score >= 5) {
      examples.push("Vocabulary is adequate but could be more varied");
      examples.push("Try: Use a thesaurus to find more interesting words");
    } else {
      examples.push("Focus on using more descriptive and varied language");
      examples.push("Instead of 'said', try: whispered, exclaimed, muttered");
    }
    
    return examples;
  }

  private static getSpecificExamplesForSpellingAndGrammar(essayContent: string, score: number): string[] {
    const examples = [];
    
    if (score >= 7) {
      examples.push("Excellent technical accuracy throughout");
      examples.push("Very few or no errors in spelling, punctuation, or grammar");
    } else if (score >= 5) {
      examples.push("Generally good with some minor errors");
      examples.push("Tip: Read your work aloud to catch mistakes");
    } else {
      examples.push("Several spelling or grammar errors need attention");
      examples.push("Try: Use spell-check and proofread carefully before submitting");
    }
    
    return examples;
  }

  private static analyzeSentenceVariety(essayContent: string): any {
    const sentences = essayContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
    return {
      simple: Math.floor(sentences.length * 0.4),
      compound: Math.floor(sentences.length * 0.3),
      complex: Math.floor(sentences.length * 0.3),
      analysis: sentences.length > 5 ? "Good variety" : "Try varying sentence structures"
    };
  }

  private static analyzeVocabulary(essayContent: string): any {
    const words = essayContent.toLowerCase().split(/\s+/);
    const sophisticatedWords = words.filter(w => w.length > 7).slice(0, 5);
    
    return {
      sophisticatedWords,
      repetitiveWords: [],
      suggestions: ["Consider using a thesaurus to find more varied vocabulary"]
    };
  }

  private static identifyLiteraryDevices(essayContent: string): any {
    const devices = [];
    const lower = essayContent.toLowerCase();
    
    if (lower.includes(' like ') || lower.includes(' as ')) devices.push('Simile');
    if (lower.match(/\b(\w+)\s+\1\b/)) devices.push('Repetition for effect');
    
    return {
      identified: devices,
      suggestions: devices.length < 2 ? ["Try adding metaphors or similes"] : []
    };
  }

  private static analyzeStructure(essayContent: string): any {
    const paragraphs = essayContent.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    return {
      hasIntroduction: paragraphs.length > 0,
      hasConclusion: paragraphs.length >= 3,
      paragraphCount: paragraphs.length,
      coherence: paragraphs.length >= 3 ? "Good" : "Needs development"
    };
  }

  private static analyzeTechnicalAccuracy(essayContent: string): any {
    return {
      spellingErrors: 0,
      grammarIssues: [],
      punctuationIssues: []
    };
  }
}
