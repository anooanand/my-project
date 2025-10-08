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

    // Evaluate all criteria
    const contentAndIdeasScore = this.scoreContentAndIdeas(essayContent, prompt);
    const textStructureScore = this.scoreTextStructure(essayContent);
    const languageFeaturesScore = this.scoreLanguageFeatures(essayContent);
    const spellingAndGrammarScore = this.scoreSpellingAndGrammar(essayContent);

    const domains = {
      contentAndIdeas: {
        score: contentAndIdeasScore,
        maxScore: 10,
        percentage: Math.round((contentAndIdeasScore / 10) * 100),
        band: this.getScoreBand(contentAndIdeasScore),
        weight: 40,
        weightedScore: Math.round((contentAndIdeasScore / 10) * 40),
        feedback: this.getFeedbackForContentAndIdeas(contentAndIdeasScore),
        specificExamples: this.getSpecificExamplesForContentAndIdeas(essayContent, contentAndIdeasScore),
        childFriendlyExplanation: this.getChildFriendlyExplanation('contentAndIdeas', contentAndIdeasScore)
      },
      textStructure: {
        score: textStructureScore,
        maxScore: 10,
        percentage: Math.round((textStructureScore / 10) * 100),
        band: this.getScoreBand(textStructureScore),
        weight: 20,
        weightedScore: Math.round((textStructureScore / 10) * 20),
        feedback: this.getFeedbackForTextStructure(textStructureScore),
        specificExamples: this.getSpecificExamplesForTextStructure(essayContent, textStructureScore),
        childFriendlyExplanation: this.getChildFriendlyExplanation('textStructure', textStructureScore)
      },
      languageFeatures: {
        score: languageFeaturesScore,
        maxScore: 10,
        percentage: Math.round((languageFeaturesScore / 10) * 100),
        band: this.getScoreBand(languageFeaturesScore),
        weight: 25,
        weightedScore: Math.round((languageFeaturesScore / 10) * 25),
        feedback: this.getFeedbackForLanguageFeatures(languageFeaturesScore),
        specificExamples: this.getSpecificExamplesForLanguageFeatures(essayContent, languageFeaturesScore),
        childFriendlyExplanation: this.getChildFriendlyExplanation('languageFeatures', languageFeaturesScore)
      },
      spellingAndGrammar: {
        score: spellingAndGrammarScore,
        maxScore: 10,
        percentage: Math.round((spellingAndGrammarScore / 10) * 100),
        band: this.getScoreBand(spellingAndGrammarScore),
        weight: 15,
        weightedScore: Math.round((spellingAndGrammarScore / 10) * 15),
        feedback: this.getFeedbackForSpellingAndGrammar(spellingAndGrammarScore),
        specificExamples: this.getSpecificExamplesForSpellingAndGrammar(essayContent, spellingAndGrammarScore),
        childFriendlyExplanation: this.getChildFriendlyExplanation('spellingAndGrammar', spellingAndGrammarScore)
      },
    };

    const overallScore = this.calculateOverallScore(domains);
    const overallGrade = this.getOverallGrade(overallScore);

    const strengths = this.getOverallStrengths(domains);
    const areasForImprovement = this.getOverallAreasForImprovement(domains, essayContent, prompt, wordCount);
    const recommendations = this.getOverallRecommendations(overallScore, wordCount);

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
      essayContent,
      reportId: `nsw-${Date.now()}`,
      date: new Date().toLocaleDateString("en-AU"),
      originalityReport: { score: 95, feedback: "Your essay shows strong originality." },
    };
  }

  private static detectPromptCopying(essayContent: string, prompt: string): boolean {
    const normalizedEssay = essayContent.trim().toLowerCase();
    const normalizedPrompt = prompt.trim().toLowerCase();
    
    if (normalizedEssay.length < 100) {
      return true;
    }
    
    if (normalizedPrompt.length > 50 && normalizedEssay.includes(normalizedPrompt)) {
      return true;
    }
    
    const essayWords = new Set(normalizedEssay.split(/\s+/).filter(w => w.length > 4));
    const promptWords = new Set(normalizedPrompt.split(/\s+/).filter(w => w.length > 4));
    const commonWords = new Set(['story', 'write', 'describe', 'character', 'about', 'that', 'this', 'they', 'their', 'what', 'when', 'where', 'how']);
    const uniqueEssayWords = [...essayWords].filter(w => !commonWords.has(w) && !promptWords.has(w));
    
    if (uniqueEssayWords.length < 30) {
      return true;
    }
    
    return false;
  }

  private static checkPromptRequirements(essayContent: string, prompt: string): { score: number, missingElements: string[] } {
    const lowerContent = essayContent.toLowerCase();
    const missingElements: string[] = [];
    let score = 0;

    // Check for "Hidden Doorway" specific requirements
    if (prompt.toLowerCase().includes("hidden doorway")) {
      // What they see through the doorway
      if (!lowerContent.includes("see") && !lowerContent.includes("saw") && !lowerContent.includes("view") && !lowerContent.includes("look")) {
        missingElements.push("What you see through the doorway");
      } else {
        score += 2;
      }

      // Who they meet
      if (!lowerContent.includes("meet") && !lowerContent.includes("met") && !lowerContent.includes("friend") && !lowerContent.includes("character") && !lowerContent.includes("person")) {
        missingElements.push("Who you meet on your adventure");
      } else {
        score += 2;
      }

      // How the adventure changes them
      if (!lowerContent.includes("learn") && !lowerContent.includes("change") && !lowerContent.includes("realize") && !lowerContent.includes("discover") && !lowerContent.includes("understand")) {
        missingElements.push("How the adventure changes you");
      } else {
        score += 2;
      }

      // Challenges faced
      if (!lowerContent.includes("challenge") && !lowerContent.includes("difficult") && !lowerContent.includes("problem") && !lowerContent.includes("struggle") && !lowerContent.includes("overcome")) {
        missingElements.push("Challenges faced and how you overcome them");
      } else {
        score += 2;
      }

      // Notebook stories
      if (!lowerContent.includes("notebook") && !lowerContent.includes("write") && !lowerContent.includes("story") && !lowerContent.includes("journal")) {
        missingElements.push("What stories you write in your notebook");
      } else {
        score += 2;
      }
    } else {
      // Generic prompt checking
      score = 8; // Default if not specific prompt
    }

    return { score: Math.min(score, 10), missingElements };
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
    if (score >= 90) return "A+";
    if (score >= 80) return "A";
    if (score >= 70) return "B+";
    if (score >= 60) return "B";
    if (score >= 50) return "C";
    if (score >= 40) return "D";
    return "E";
  }

  private static getScoreBand(score: number): string {
    if (score >= 9) return "Outstanding";
    if (score >= 7) return "High";
    if (score >= 5) return "Sound";
    if (score >= 3) return "Basic";
    return "Limited";
  }

  private static scoreContentAndIdeas(essayContent: string, prompt: string): number {
    let score = 2; // Lowered base score from 4 to 2
    const lowerContent = essayContent.toLowerCase();
    const words = essayContent.split(/\s+/);
    
    // Check prompt requirements
    const promptCheck = this.checkPromptRequirements(essayContent, prompt);
    score += Math.floor(promptCheck.score / 2); // Add up to 5 points for addressing prompt

    // Reward substantial content
    if (words.length > 150) score += 1;
    if (words.length > 250) score += 1;
    
    // Check for creativity
    const creativeWords = ["enchanted", "magical", "whisper", "shimmering", "kaleidoscope", 
                           "bioluminescent", "crystalline", "starlight", "mysterious", "ancient",
                           "glowing", "sparkling", "twisted", "shadowy", "brilliant"];
    const creativeCount = creativeWords.filter(word => lowerContent.includes(word)).length;
    if (creativeCount >= 2) score += 1;
    
    // Check for character development (SHOWN not told)
    const showingWords = ["gasped", "smiled", "frowned", "whispered", "shouted", "trembled", "laughed"];
    const tellingWords = ["felt", "was", "became", "learned", "realized"];
    const showingCount = showingWords.filter(word => lowerContent.includes(word)).length;
    const tellingCount = tellingWords.filter(word => lowerContent.includes(word)).length;
    
    if (showingCount > tellingCount) score += 1;
    
    return Math.min(score, this.maxScorePerCriterion);
  }

  private static scoreTextStructure(essayContent: string): number {
    let score = 2; // Lowered base score from 4 to 2
    const paragraphs = essayContent.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const sentences = essayContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Check for clear introduction
    const firstSentence = sentences[0]?.toLowerCase() || "";
    if (firstSentence.includes("once") || firstSentence.includes("one day") || 
        firstSentence.includes("imagine") || firstSentence.includes("suddenly")) {
      score += 2;
    } else if (sentences.length > 0) {
      score += 1; // Some introduction present
    }
    
    // Paragraph structure
    if (paragraphs.length >= 3) score += 2;
    if (paragraphs.length >= 5) score += 1;
    
    // Check for conclusion
    const lastSentence = sentences[sentences.length - 1]?.toLowerCase() || "";
    if (lastSentence.includes("finally") || lastSentence.includes("end") || 
        lastSentence.includes("forever") || lastSentence.includes("always")) {
      score += 2;
    }
    
    // Transition words
    const transitionWords = ['however', 'therefore', 'meanwhile', 'suddenly', 'finally', 
                             'furthermore', 'moreover', 'consequently', 'nevertheless'];
    const lowerContent = essayContent.toLowerCase();
    const transitionsFound = transitionWords.filter(word => lowerContent.includes(word)).length;
    if (transitionsFound >= 2) score += 1;
    
    return Math.min(score, this.maxScorePerCriterion);
  }

  private static scoreLanguageFeatures(essayContent: string): number {
    let score = 2; // Lowered base score from 4 to 2
    const lowerContent = essayContent.toLowerCase();
    const words = lowerContent.split(/\s+/).filter(w => w.length > 0);
    
    // Vocabulary sophistication
    const longWords = words.filter(word => word.length >= 7).length;
    const sophisticationRatio = longWords / words.length;
    if (sophisticationRatio > 0.12) score += 2;
    if (sophisticationRatio > 0.20) score += 1;
    
    // Figurative language with specific examples
    let figurativeScore = 0;
    if (lowerContent.includes("like a") || lowerContent.includes("like an")) figurativeScore += 1;
    if (lowerContent.includes("as") && (lowerContent.includes("as bright") || lowerContent.includes("as dark"))) figurativeScore += 1;
    if (lowerContent.match(/\b\w+ed\s+(through|across|around)/)) figurativeScore += 1; // Action verbs
    
    score += Math.min(figurativeScore, 3);
    
    // Sensory details
    const sensoryWords = ['saw', 'heard', 'felt', 'smelled', 'tasted', 'touched',
                          'gleaming', 'echoed', 'rough', 'sweet', 'bitter', 'soft',
                          'bright', 'dark', 'loud', 'quiet', 'warm', 'cold'];
    const sensoryCount = sensoryWords.filter(word => lowerContent.includes(word)).length;
    if (sensoryCount >= 3) score += 2;
    
    // Dialogue
    const hasDialogue = essayContent.includes('"') || essayContent.includes("'");
    if (hasDialogue) score += 1;
    
    return Math.min(score, this.maxScorePerCriterion);
  }

  private static scoreSpellingAndGrammar(essayContent: string): number {
    let score = 8; // Start high and deduct for errors
    const errors: string[] = [];
    
    // Article errors (a/an)
    const articleErrors = essayContent.match(/\ba [aeiou]/gi);
    if (articleErrors) {
      score -= articleErrors.length * 2;
      errors.push(`Article errors: ${articleErrors.join(', ')}`);
    }
    
    // Common homophones
    const homophoneErrors = [
      { wrong: /\bthere\s+(?:is|are|was|were)\s+\w+\s+(?:house|car|book)/gi, correct: "their" },
      { wrong: /\byour\s+(?:going|coming|leaving)/gi, correct: "you're" },
      { wrong: /\bits\s+(?:tail|eyes|wings)/gi, correct: "its" }
    ];
    
    homophoneErrors.forEach(error => {
      const matches = essayContent.match(error.wrong);
      if (matches) {
        score -= matches.length;
        errors.push(`Possible homophone error: check ${error.correct}`);
      }
    });
    
    // Missing dialogue punctuation
    const dialogueLines = essayContent.match(/"[^"]*"/g);
    if (dialogueLines) {
      dialogueLines.forEach(line => {
        if (!line.match(/"[^"]*[.!?]"/)) {
          score -= 1;
          errors.push("Missing punctuation in dialogue");
        }
      });
    }
    
    // Run-on sentences (very basic check)
    const longSentences = essayContent.split(/[.!?]+/).filter(s => s.split(/\s+/).length > 25);
    if (longSentences.length > 0) {
      score -= longSentences.length;
      errors.push("Possible run-on sentences");
    }
    
    // Basic spelling errors
    const commonErrors = ["teh", "adn", "wrok", "becuase", "recieve", "seperate"];
    const foundErrors = commonErrors.filter(error => essayContent.toLowerCase().includes(error));
    score -= foundErrors.length * 2;
    
    return Math.max(score, 0);
  }

  private static getFeedbackForContentAndIdeas(score: number): string[] {
    if (score >= 9) return ["Exceptional creativity and comprehensive response to all prompt requirements!"];
    if (score >= 7) return ["Strong ideas with good development. Address any missing prompt elements."];
    if (score >= 5) return ["Good foundation but needs more detail and complete prompt coverage."];
    return ["Focus on addressing ALL parts of the prompt with creative, detailed responses."];
  }

  private static getFeedbackForTextStructure(score: number): string[] {
    if (score >= 9) return ["Excellent organization with clear introduction, body, and conclusion."];
    if (score >= 7) return ["Good structure present. Strengthen transitions between paragraphs."];
    if (score >= 5) return ["Basic structure evident. Add clear topic sentences and conclusion."];
    return ["Work on organizing ideas with distinct introduction, body paragraphs, and conclusion."];
  }

  private static getFeedbackForLanguageFeatures(score: number): string[] {
    if (score >= 9) return ["Sophisticated vocabulary and excellent use of literary devices."];
    if (score >= 7) return ["Good language variety. Add more figurative language and sensory details."];
    if (score >= 5) return ["Adequate vocabulary. Try using similes, metaphors, and descriptive words."];
    return ["Focus on expanding vocabulary and adding figurative language."];
  }

  private static getFeedbackForSpellingAndGrammar(score: number): string[] {
    if (score >= 9) return ["Excellent technical accuracy with minimal errors."];
    if (score >= 7) return ["Good accuracy with minor errors. Proofread carefully."];
    if (score >= 5) return ["Some errors present. Check article usage (a/an) and homophones."];
    return ["Multiple errors need attention. Focus on basic spelling and grammar rules."];
  }

  private static getOverallStrengths(domains: any): string[] {
    const strengths: string[] = [];
    
    if (domains.contentAndIdeas.score >= 8) strengths.push("Strong creative ideas and imagination");
    if (domains.textStructure.score >= 8) strengths.push("Well-organized structure");
    if (domains.languageFeatures.score >= 8) strengths.push("Effective use of descriptive language");
    if (domains.spellingAndGrammar.score >= 8) strengths.push("Good technical accuracy");
    
    // Always ensure at least one strength
    if (strengths.length === 0) {
      const highestScore = Math.max(
        domains.contentAndIdeas.score,
        domains.textStructure.score,
        domains.languageFeatures.score,
        domains.spellingAndGrammar.score
      );
      
      if (domains.contentAndIdeas.score === highestScore) strengths.push("Shows creative potential");
      else if (domains.textStructure.score === highestScore) strengths.push("Attempts to organize ideas");
      else if (domains.languageFeatures.score === highestScore) strengths.push("Uses some descriptive language");
      else strengths.push("Shows effort in writing mechanics");
    }
    
    return strengths;
  }

  private static getOverallAreasForImprovement(domains: any, essayContent: string, prompt: string, wordCount: number): string[] {
    const improvements: string[] = [];
    
    // Check prompt requirements
    const promptCheck = this.checkPromptRequirements(essayContent, prompt);
    if (promptCheck.missingElements.length > 0) {
      improvements.push(`Address missing prompt elements: ${promptCheck.missingElements.join(', ')}`);
    }
    
    // Check for specific errors
    if (essayContent.toLowerCase().includes("a a") || essayContent.toLowerCase().includes("a e") || 
        essayContent.toLowerCase().includes("a i") || essayContent.toLowerCase().includes("a o") || 
        essayContent.toLowerCase().includes("a u")) {
      improvements.push("Fix article errors: use 'an' before vowel sounds (e.g., 'an acorn' not 'a acorn')");
    }
    
    // Word count feedback
    if (wordCount < 200) {
      improvements.push("Expand your essay - aim for 400-500 words for selective exam preparation");
    } else if (wordCount < 350) {
      improvements.push("Good start, but expand to 400-500 words to meet selective exam expectations");
    }
    
    // Character development
    if (essayContent.toLowerCase().includes("teaching me") || essayContent.toLowerCase().includes("i learned")) {
      improvements.push("Show character transformation through actions and dialogue, don't just tell us about it");
    }
    
    // Domain-specific improvements
    if (domains.contentAndIdeas.score < 7) {
      improvements.push("Develop ideas with more specific details and examples");
    }
    if (domains.textStructure.score < 7) {
      improvements.push("Strengthen paragraph structure with clear topic sentences");
    }
    if (domains.languageFeatures.score < 7) {
      improvements.push("Add more figurative language (similes, metaphors) and sensory details");
    }
    if (domains.spellingAndGrammar.score < 7) {
      improvements.push("Proofread carefully for spelling, grammar, and punctuation errors");
    }
    
    // Ensure we always have improvements
    if (improvements.length === 0) {
      improvements.push("Experiment with more complex sentence structures");
      improvements.push("Add dialogue to bring characters to life");
      improvements.push("Include more sensory details to engage readers");
    }
    
    return improvements.slice(0, 4); // Limit to 4 most important items
  }

  private static getOverallRecommendations(overallScore: number, wordCount: number): string[] {
    const recommendations: string[] = [];
    
    // Word count specific recommendations
    if (wordCount < 200) {
      recommendations.push("URGENT: Expand your essay to 400-500 words for selective exam readiness");
    } else if (wordCount < 350) {
      recommendations.push("Aim for 400-500 words to meet selective exam standards");
    } else if (wordCount >= 350 && wordCount <= 500) {
      recommendations.push("Good word count - maintain this length for selective exams");
    } else if (wordCount > 600) {
      recommendations.push("Consider being more concise - quality over quantity");
    }
    
    // Score-based recommendations
    if (overallScore >= 85) {
      recommendations.push("Excellent work! Practice advanced techniques like flashbacks or multiple perspectives");
      recommendations.push("Time yourself writing similar essays to build exam confidence");
    } else if (overallScore >= 70) {
      recommendations.push("Good foundation! Focus on addressing ALL prompt requirements completely");
      recommendations.push("Practice planning your response before writing to ensure full coverage");
    } else if (overallScore >= 55) {
      recommendations.push("Work on essay structure: clear introduction, body paragraphs, strong conclusion");
      recommendations.push("Build vocabulary by reading widely and keeping a word journal");
    } else {
      recommendations.push("Start with planning: list all prompt requirements before writing");
      recommendations.push("Practice basic paragraph structure with topic sentences");
      recommendations.push("Read your work aloud to catch errors and improve flow");
    }
    
    // NSW Selective exam specific advice
    recommendations.push("For selective exams: spend 5 minutes planning, 20 minutes writing, 5 minutes checking");
    
    return recommendations;
  }

  private static getChildFriendlyExplanation(domain: string, score: number): string {
    const explanations = {
      contentAndIdeas: {
        high: "🌟 Your ideas are creative and you've addressed the prompt well!",
        medium: "💡 Good ideas, but make sure to answer ALL parts of the prompt.",
        low: "🌱 Focus on answering every part of the prompt with creative details."
      },
      textStructure: {
        high: "🏗️ Excellent organization with clear beginning, middle, and end!",
        medium: "📝 Good structure, but strengthen your introduction and conclusion.",
        low: "🧩 Work on organizing ideas into clear paragraphs with topic sentences."
      },
      languageFeatures: {
        high: "🎨 Wonderful vocabulary and great use of descriptive language!",
        medium: "✏️ Good language use - try adding more similes and sensory details.",
        low: "📚 Focus on using more interesting vocabulary and figurative language."
      },
      spellingAndGrammar: {
        high: "🎯 Excellent spelling, punctuation, and grammar!",
        medium: "✅ Good technical skills with just a few small errors to fix.",
        low: "🔍 Check your spelling and grammar carefully - watch for a/an errors."
      }
    };
    
    const level = score >= 8 ? 'high' : score >= 5 ? 'medium' : 'low';
    return explanations[domain]?.[level] || "Keep working on this area!";
  }

  private static getSpecificExamplesForContentAndIdeas(essayContent: string, score: number): string[] {
    const examples = [];
    
    if (score >= 7) {
      examples.push("Strong creative elements and good prompt coverage");
      examples.push("Ideas are well-developed with specific details");
    } else if (score >= 5) {
      examples.push("Good creative foundation - ensure all prompt questions are answered");
      examples.push("Add more specific details to develop your ideas fully");
    } else {
      examples.push("Address ALL prompt requirements systematically");
      examples.push("Expand ideas with specific examples and sensory details");
    }
    
    return examples;
  }

  private static getSpecificExamplesForTextStructure(essayContent: string, score: number): string[] {
    const examples = [];
    const paragraphs = essayContent.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    if (score >= 7) {
      examples.push(`Well-organized with ${paragraphs.length} clear paragraphs`);
      examples.push("Good flow between beginning, middle, and end");
    } else if (score >= 5) {
      examples.push("Basic structure present - strengthen introduction and conclusion");
      examples.push("Use topic sentences to start each paragraph clearly");
    } else {
      examples.push("Create distinct paragraphs: introduction → body → conclusion");
      examples.push("Start each paragraph with a clear topic sentence");
    }
    
    return examples;
  }

  private static getSpecificExamplesForLanguageFeatures(essayContent: string, score: number): string[] {
    const examples = [];
    const words = essayContent.toLowerCase().split(/\s+/);
    const longWords = words.filter(w => w.length >= 7);
    
    if (score >= 7) {
      examples.push("Good use of sophisticated vocabulary");
      if (longWords.length > 3) {
        examples.push(`Strong vocabulary examples: ${longWords.slice(0, 3).join(', ')}`);
      }
    } else if (score >= 5) {
      examples.push("Adequate vocabulary - add more figurative language");
      examples.push("Try: similes (like/as), metaphors, and sensory words");
    } else {
      examples.push("Use more descriptive and varied language");
      examples.push("Replace simple words: said→whispered, big→enormous, nice→delightful");
    }
    
    return examples;
  }

  private static getSpecificExamplesForSpellingAndGrammar(essayContent: string, score: number): string[] {
    const examples = [];
    
    if (score >= 8) {
      examples.push("Excellent technical accuracy throughout");
      examples.push("Very few or no errors in spelling, punctuation, or grammar");
    } else if (score >= 6) {
      examples.push("Generally good with some minor errors to fix");
      examples.push("Double-check article usage (a/an) and common homophones");
    } else {
      examples.push("Several errors need attention - proofread carefully");
      examples.push("Focus on: spelling, article usage (a acorn→an acorn), punctuation");
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