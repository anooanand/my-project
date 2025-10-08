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
  private static maxScorePerCriterion = 5; // Define max score here

  static generateReport(params: NSWEvaluationReportParams): any {
    const { essayContent, textType, prompt, wordCount, targetWordCountMin, targetWordCountMax } = params;

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
        weight: 40,
        feedback: this.getFeedbackForContentAndIdeas(contentAndIdeasScore),
      },
      textStructure: {
        score: textStructureScore,
        weight: 20,
        feedback: this.getFeedbackForTextStructure(textStructureScore),
      },
      languageFeatures: {
        score: languageFeaturesScore,
        weight: 25,
        feedback: this.getFeedbackForLanguageFeatures(languageFeaturesScore),
      },
      spellingAndGrammar: {
        score: spellingAndGrammarScore,
        weight: 15,
        feedback: this.getFeedbackForSpellingAndGrammar(spellingAndGrammarScore),
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
      strengths,
      areasForImprovement,
      recommendations,
      essayContent, // Include original essay content
      reportId: `nsw-${Date.now()}`,
      date: new Date().toLocaleDateString("en-AU"),
      originalityReport: { score: 95, feedback: "Your essay shows strong originality." }, // Placeholder
    };
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
    if (score >= 85) return "A+";
    if (score >= 75) return "A";
    if (score >= 65) return "B";
    if (score >= 50) return "C";
    return "D";
  }

  private static getScoreBand(score: number): string {
    if (score === this.maxScorePerCriterion) return "Excellent";
    if (score >= 4) return "Very Good";
    if (score >= 3) return "Good";
    return "Needs Improvement";
  }

  private static scoreContentAndIdeas(essayContent: string, prompt: string): number {
    let score = 3; // Base score
    const lowerContent = essayContent.toLowerCase();
    const lowerPrompt = prompt.toLowerCase();

    // Check for prompt adherence (simple keyword match for demo)
    if (lowerContent.includes(lowerPrompt.split(" ")[0])) {
      score += 1;
    }
    // Check for creativity (e.g., presence of vivid adjectives/adverbs)
    const creativeWords = ["enchanted", "magical", "whisper", "shimmering", "kaleidoscope", "bioluminescent", "crystalline", "starlight"];
    if (creativeWords.some(word => lowerContent.includes(word))) {
      score += 1;
    }
    return Math.min(score, this.maxScorePerCriterion);
  }

  private static scoreTextStructure(essayContent: string): number {
    let score = 3; // Base score
    const paragraphs = essayContent.split(/\n\s*\n/).filter(p => p.trim().length > 0);

    if (paragraphs.length >= 3) {
      score += 1; // Implies some structure
    }
    // Check for clear beginning, middle, end (very basic for demo)
    if (essayContent.length > 200 && paragraphs.length >= 4) {
      score += 1;
    }
    return Math.min(score, this.maxScorePerCriterion);
  }

  private static scoreLanguageFeatures(essayContent: string): number {
    let score = 3; // Base score
    const lowerContent = essayContent.toLowerCase();

    // Check for varied vocabulary (simple check for longer words)
    const words = lowerContent.split(/\s+/);
    const longWords = words.filter(word => word.length >= 7).length;
    if (longWords / words.length > 0.15) {
      score += 1;
    }
    // Check for figurative language (placeholder)
    const figurativeKeywords = ["like a", "as a", "as if", "heart hammered", "drumbeat"];
    if (figurativeKeywords.some(keyword => lowerContent.includes(keyword))) {
      score += 1;
    }
    return Math.min(score, this.maxScorePerCriterion);
  }

  private static scoreSpellingAndGrammar(essayContent: string): number {
    let score = 3; // Base score
    // Very basic error detection for demo purposes
    const commonErrors = ["teh", "adn", "wrok", "becuase"];
    const errorsFound = commonErrors.filter(error => essayContent.includes(error)).length;

    if (errorsFound === 0) {
      score += 2;
    } else if (errorsFound <= 1) {
      score += 1;
    }
    return Math.min(score, this.maxScorePerCriterion);
  }

  private static getFeedbackForContentAndIdeas(score: number): string[] {
    if (score === this.maxScorePerCriterion) return ["Wow! Your ideas are super creative and interesting, making your story really stand out! You have a wonderful imagination that brings your writing to life."];
    if (score >= 4) return ["Your ideas are engaging and show good imagination. Keep developing them!"];
    if (score >= 3) return ["You have some good ideas, but they could be developed further. Try adding more detail."];
    return ["Focus on generating more creative and detailed ideas for your story."];
  }

  private static getFeedbackForTextStructure(score: number): string[] {
    if (score === this.maxScorePerCriterion) return ["Your writing flows perfectly, like a well-told story, with a clear beginning, middle, and end! You've mastered the art of organization."];
    if (score >= 4) return ["Your story has a clear structure that is easy to follow. Good job!"];
    if (score >= 3) return ["Your story has a basic structure, but could benefit from clearer transitions between paragraphs."];
    return ["Work on organizing your ideas into a clear beginning, middle, and end."];
  }

  private static getFeedbackForLanguageFeatures(score: number): string[] {
    if (score === this.maxScorePerCriterion) return ["You use amazing words and clever writing tricks that make your writing shine like a diamond! Your vocabulary is impressive."];
    if (score >= 4) return ["You use a good range of vocabulary and some effective language features."];
    if (score >= 3) return ["Your vocabulary is adequate, but try to incorporate more descriptive words and figurative language."];
    return ["Focus on expanding your vocabulary and using more descriptive language."];
  }

  private static getFeedbackForSpellingAndGrammar(score: number): string[] {
    if (score === this.maxScorePerCriterion) return ["Your writing is almost perfect with spelling, punctuation, and grammar – fantastic work! You're a careful editor."];
    if (score >= 4) return ["You make very few mistakes in spelling, punctuation, and grammar. Great job being careful with your writing!"];
    if (score >= 3) return ["You have some errors in spelling, punctuation, or grammar. Proofread carefully."];
    return ["Review basic spelling and grammar rules. Proofreading is essential!"];
  }

  private static getOverallStrengths(domains: any): string[] {
    const strengths: string[] = [];
    if (domains.contentAndIdeas.score === this.maxScorePerCriterion) strengths.push("Creative Ideas");
    if (domains.textStructure.score === this.maxScorePerCriterion) strengths.push("Organization");
    if (domains.languageFeatures.score === this.maxScorePerCriterion) strengths.push("Vocabulary");
    if (domains.spellingAndGrammar.score === this.maxScorePerCriterion) strengths.push("Technical Skills");
    return strengths;
  }

  private static getOverallAreasForImprovement(domains: any): string[] {
    const improvements: string[] = [];
    if (domains.contentAndIdeas.score < 3) improvements.push("Idea Development");
    if (domains.textStructure.score < 3) improvements.push("Structural Clarity");
    if (domains.languageFeatures.score < 3) improvements.push("Language Sophistication");
    if (domains.spellingAndGrammar.score < 3) improvements.push("Grammar and Punctuation");
    return improvements;
  }

  private static getOverallRecommendations(overallScore: number): string[] {
    if (overallScore >= 75) return ["Keep Up the Great Work!", "Challenge Yourself"];
    if (overallScore >= 50) return ["Master Comma Usage", "Expand Vocabulary"];
    return ["Focus on Sentence Structure", "Basic Grammar Review"];
  }
}
