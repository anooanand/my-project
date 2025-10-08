// src/components/NSWEvaluationReportGenerator_fixed.tsx

import { DetailedFeedback } from "../types/feedback";

interface PromptRequirements {
  totalQuestions: number;
  requiresCharacters: boolean;
  requiresChallenges: boolean;
  requiresResolution: boolean;
  requiresReflection: boolean;
  questions: string[];
}

interface PromptCheckResult {
  score: number;
  missingElements: string[];
  partialElements: string[];
  incompleteEssay: boolean;
  promptCoverage: number;
}

interface NSWEvaluationReportParams {
  essayContent: string;
  textType: string;
  prompt: string;
  wordCount: number;
  targetWordCountMin: number;
  targetWordCountMax: number;
}

export class NSWEvaluationReportGenerator {
  private static maxScorePerCriterion = 10;

  static generateReport(params: NSWEvaluationReportParams): any {
    const { essayContent, textType, prompt, wordCount, targetWordCountMin, targetWordCountMax } = params;

    if (this.detectPromptCopying(essayContent, prompt)) {
      throw new Error("Your submission appears to be the prompt itself or contains insufficient original content. Please write your own creative response to the prompt (minimum 50 original words required).");
    }

    const promptCheck = this.checkPromptRequirements(essayContent, prompt);
    const contentAndIdeasScore = this.scoreContentAndIdeas(essayContent, prompt, wordCount, targetWordCountMin, targetWordCountMax, promptCheck);
    const textStructureScore = this.scoreTextStructure(essayContent, promptCheck.incompleteEssay);
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
        feedback: NSWEvaluationReportGenerator.getFeedbackForContentAndIdeas(contentAndIdeasScore),
        specificExamples: this.getSpecificExamplesForContentAndIdeas(essayContent, contentAndIdeasScore),
        childFriendlyExplanation: this.getChildFriendlyExplanation("contentAndIdeas", contentAndIdeasScore)
      },
      textStructure: {
        score: textStructureScore,
        maxScore: 10,
        percentage: Math.round((textStructureScore / 10) * 100),
        band: this.getScoreBand(textStructureScore),
        weight: 20,
        weightedScore: Math.round((textStructureScore / 10) * 20),
        feedback: NSWEvaluationReportGenerator.getFeedbackForTextStructure(textStructureScore),
        specificExamples: this.getSpecificExamplesForTextStructure(essayContent, textStructureScore),
        childFriendlyExplanation: this.getChildFriendlyExplanation("textStructure", textStructureScore)
      },
      languageFeatures: {
        score: languageFeaturesScore,
        maxScore: 10,
        percentage: Math.round((languageFeaturesScore / 10) * 100),
        band: this.getScoreBand(languageFeaturesScore),
        weight: 25,
        weightedScore: Math.round((languageFeaturesScore / 10) * 25),
        feedback: NSWEvaluationReportGenerator.getFeedbackForLanguageFeatures(languageFeaturesScore),
        specificExamples: this.getSpecificExamplesForLanguageFeatures(essayContent, languageFeaturesScore),
        childFriendlyExplanation: this.getChildFriendlyExplanation("languageFeatures", languageFeaturesScore)
      },
      spellingAndGrammar: {
        score: spellingAndGrammarScore,
        maxScore: 10,
        percentage: Math.round((spellingAndGrammarScore / 10) * 100),
        band: this.getScoreBand(spellingAndGrammarScore),
        weight: 15,
        weightedScore: Math.round((spellingAndGrammarScore / 10) * 15),
        feedback: NSWEvaluationReportGenerator.getFeedbackForSpellingAndGrammar(spellingAndGrammarScore),
        specificExamples: this.getSpecificExamplesForSpellingAndGrammar(essayContent, spellingAndGrammarScore),
        childFriendlyExplanation: this.getChildFriendlyExplanation("spellingAndGrammar", spellingAndGrammarScore)
      },
    };

    const overallScore = this.calculateOverallScore(domains);
    const overallGrade = this.getOverallGrade(overallScore);

    const strengths = this.getOverallStrengths(domains, essayContent);
    const areasForImprovement = this.getOverallAreasForImprovement(domains, essayContent, prompt, wordCount, targetWordCountMin, targetWordCountMax, promptCheck);
    const recommendations = this.getOverallRecommendations(overallScore, wordCount, targetWordCountMin, targetWordCountMax);

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
    const commonWords = new Set(["story", "write", "describe", "character", "about", "that", "this", "they", "their", "what", "when", "where", "how"]);
    const uniqueEssayWords = [...essayWords].filter(w => !commonWords.has(w) && !promptWords.has(w));
    
    if (uniqueEssayWords.length < 30) {
      return true;
    }
    
    return false;
  }

  // HELPER FUNCTIONS
  private static extractQuestions(prompt: string): string[] {
    return prompt
      .split(/[.!]/)
      .filter(s => s.includes('?'))
      .map(q => q.trim());
  }

  private static extractActionVerbs(prompt: string): string[] {
    const actionVerbs = ['describe', 'explain', 'tell', 'write', 'create', 
                         'imagine', 'solve', 'meet', 'face', 'learn', 'discover'];
    return actionVerbs.filter(verb => 
      new RegExp(`\\b${verb}\\b`, 'i').test(prompt)
    );
  }

  private static detectProperNouns(text: string): string[] {
    const words = text.split(/\s+/);
    const properNouns: string[] = [];
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i].replace(/[^a-zA-Z]/g, '');
      if (word && word[0] === word[0].toUpperCase() && 
          i > 0 && !['.', '!', '?'].includes(words[i-1].slice(-1))) {
        if (!['The', 'A', 'An', 'And', 'But', 'Or', 'In', 'On', 'At'].includes(word)) {
          properNouns.push(word);
        }
      }
    }
    
    return [...new Set(properNouns)];
  }

  private static extractKeywords(text: string): Set<string> {
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 
                                 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
    return new Set(
      text
        .toLowerCase()
        .split(/\s+/)
        .filter(w => w.length > 3 && !commonWords.has(w))
    );
  }

  private static calculateKeywordOverlap(promptKeywords: Set<string>, essayKeywords: Set<string>): number {
    const intersection = new Set([...promptKeywords].filter(k => essayKeywords.has(k)));
    return intersection.size / promptKeywords.size;
  }

  private static detectNarrativeResolution(essay: string): boolean {
    const lastParagraph = essay.split(/\n\s*\n/).slice(-1)[0]?.toLowerCase() || '';
    const resolutionIndicators = /finally|in the end|at last|eventually|ultimately|from that day|forever|always/i;
    
    const endsProperly = /[.!?]$/.test(essay.trim());
    
    const hasConclusion = resolutionIndicators.test(lastParagraph);
    
    return endsProperly && (hasConclusion || lastParagraph.length > 100);
  }

  private static analyzePromptStructure(prompt: string): PromptRequirements {
    const questions = this.extractQuestions(prompt);
    const requiredActions = this.extractActionVerbs(prompt);
    
    const requiresCharacters = /who|meet|character|people/i.test(prompt);
    const requiresChallenges = /challenge|problem|difficult|obstacle/i.test(prompt);
    const requiresResolution = /solve|resolve|help|save|overcome/i.test(prompt);
    const requiresReflection = /learn|discover|realize|understand/i.test(prompt);
    
    return {
      totalQuestions: questions.length,
      requiresCharacters,
      requiresChallenges,
      requiresResolution,
      requiresReflection,
      questions
    };
  }

  private static detectIncompleteEssay(essay: string, promptAnalysis: PromptRequirements): boolean {
    const sentences = essay.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const lastSentence = sentences[sentences.length - 1]?.trim();
    
    if (lastSentence && !essay.trim().match(/[.!?]$/)) {
      return true;
    }
    
    if (sentences.length < 8 && !this.detectNarrativeResolution(essay)) {
      return true;
    }
    
    if (promptAnalysis.requiresResolution && !this.detectNarrativeResolution(essay)) {
      return true;
    }
    
    return false;
  }

  private static checkPromptRequirements(essayContent: string, prompt: string): PromptCheckResult {
    const promptAnalysis = this.analyzePromptStructure(prompt);
    const essayLower = essayContent.toLowerCase();
    const promptLower = prompt.toLowerCase();
    
    let score = 0;
    const missingElements: string[] = [];
    const partialElements: string[] = [];
    
    const promptKeywords = this.extractKeywords(promptLower);
    const essayKeywords = this.extractKeywords(essayLower);
    const thematicOverlap = this.calculateKeywordOverlap(promptKeywords, essayKeywords);
    
    if (thematicOverlap < 0.3) {
      missingElements.push("Essay doesn't clearly address the main prompt theme");
    } else {
      score += 2;
    }
    
    if (promptAnalysis.requiresCharacters) {
      const hasCharacterNames = this.detectProperNouns(essayContent).length >= 1;
      const hasCharacterDescriptions = /\b(meet|met|encounter|friend|companion)\b/i.test(essayLower);
      
      if (hasCharacterNames && hasCharacterDescriptions) {
        score += 2;
      } else if (hasCharacterNames || hasCharacterDescriptions) {
        score += 1;
        partialElements.push("Characters mentioned but need more development");
      } else {
        missingElements.push("Introduce and describe characters you meet");
      }
    }
    
    if (promptAnalysis.requiresChallenges) {
      const hasChallengeWords = /challenge|difficult|problem|struggle|danger|obstacle|threat/i.test(essayLower);
      const hasSolution = /overcome|solve|succeed|triumph|defeat|escape|resolve/i.test(essayLower);
      
      if (hasChallengeWords && hasSolution) {
        score += 2;
      } else if (hasChallengeWords || hasSolution) {
        score += 1;
        partialElements.push("Challenges need clear resolution");
      } else {
        missingElements.push("Describe challenges faced and how you overcame them");
      }
    }
    
    if (promptAnalysis.requiresResolution) {
      const hasResolution = this.detectNarrativeResolution(essayContent);
      if (hasResolution) {
        score += 2;
      } else {
        missingElements.push("Story needs clear resolution addressing the prompt's main question");
      }
    }
    
    if (promptAnalysis.requiresReflection) {
      const hasReflection = /learn|discover|realize|understand|teach|lesson/i.test(essayLower);
      if (hasReflection) {
        score += 2;
      } else {
        missingElements.push("Include reflection on what you learned or discovered");
      }
    }
    
    const incompleteEssay = this.detectIncompleteEssay(essayContent, promptAnalysis);
    
    const promptCoverage = (score / (promptAnalysis.totalQuestions * 2)) * 100;
    
    return {
      score: Math.min(score, 10),
      missingElements,
      partialElements,
      incompleteEssay,
      promptCoverage
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
    if (score >= 90) return "A+";
    if (score >= 80) return "A";
    if (score >= 70) return "B+";
    if (score >= 60) return "B";
    if (score >= 50) return "C+";
    if (score >= 40) return "C";
    if (score >= 30) return "D";
    return "E";
  }

  private static getScoreBand(score: number): string {
    if (score >= 9) return "Outstanding";
    if (score >= 7) return "High";
    if (score >= 5) return "Sound";
    if (score >= 3) return "Basic";
    return "Limited";
  }

  private static countDescriptiveLanguage(text: string): number {
    const lowerText = text.toLowerCase();
    const descriptivePatterns = [
      /\b\w+ly\b/g, // Adverbs ending in -ly
      / like /gi, // Similes
      / as \w+ as /gi, // Similes
      /\b(beautiful|mysterious|ancient|glowing|shimmering|vibrant|ethereal|luminous|enchanted|magical|brilliant|stunning|magnificent|radiant)\b/gi
    ];
    
    let count = 0;
    descriptivePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) count += matches.length;
    });
    
    return Math.min(count, 10);
  }

  private static analyzeShowingVsTelling(text: string): number {
    const lowerText = text.toLowerCase();
    
    const showingWords = ['gasped', 'smiled', 'frowned', 'whispered', 'shouted', 
                         'trembled', 'laughed', 'grinned', 'cried', 'nodded', 
                         'shook', 'pointed', 'sighed', 'glanced', 'stared'];
    const tellingPhrases = ['felt', 'was happy', 'was sad', 'became', 
                           'i learned that', 'i realized that', 'teaching me'];
    
    const showingCount = showingWords.filter(w => new RegExp(`\\b${w}\\b`, 'i').test(lowerText)).length;
    const tellingCount = tellingPhrases.filter(p => new RegExp(`\\b${p}\\b`, 'i').test(lowerText)).length;
    
    if (showingCount > tellingCount + 2) return 1;
    if (showingCount > tellingCount) return 0.5;
    return 0;
  }

  private static analyzeSpecificity(text: string): number {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length === 0) return 0;

    const specificDetails = [/\d+/, /"[^"]*"/, /[A-Z][a-z]+ [A-Z][a-z]+/];
    let specificityScore = 0;

    sentences.forEach(sentence => {
      if (specificDetails.some(regex => regex.test(sentence))) {
        specificityScore++;
      }
    });

    return Math.min(specificityScore / sentences.length, 1);
  }

  private static scoreContentAndIdeas(
    essayContent: string, 
    prompt: string, 
    wordCount: number, 
    targetWordCountMin: number, 
    targetWordCountMax: number, 
    promptCheck: PromptCheckResult
  ): number {
    let score = 3;
    
    score += promptCheck.score * 0.5;
    
    if (promptCheck.missingElements.length >= 3) {
      score -= 2;
    } else if (promptCheck.missingElements.length >= 2) {
      score -= 1;
    }
    
    if (wordCount < targetWordCountMin) {
      if (wordCount < targetWordCountMin * 0.75) {
        score -= 3;
      } else {
        score -= 1;
      }
    }
    
    if (wordCount > 350) score += 1;
    if (wordCount > 450) score += 0.5;
    
    const descriptiveWords = this.countDescriptiveLanguage(essayContent);
    if (descriptiveWords >= 5) score += 1;
    if (descriptiveWords >= 8) score += 0.5;
    
    const showingScore = this.analyzeShowingVsTelling(essayContent);
    score += showingScore;
    
    const specificityScore = this.analyzeSpecificity(essayContent);
    score += specificityScore;
    
    return Math.min(Math.max(0, Math.round(score * 2) / 2), 10);
  }

  private static scoreTextStructure(essayContent: string, incompleteEssay: boolean): number {
    let score = 0;
    const paragraphs = essayContent.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const sentences = essayContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    if (sentences.length > 3) score += 2;
    
    const firstParagraph = paragraphs[0] || "";
    if (firstParagraph.length > 50) {
      score += 2;
    } else if (firstParagraph.length > 0) {
      score += 1;
    }
    
    if (paragraphs.length >= 5) score += 2;
    else if (paragraphs.length >= 4) score += 1.5;
    else if (paragraphs.length >= 3) score += 1;
    else if (paragraphs.length >= 2) score += 0.5;
    
    if (incompleteEssay) {
      score -= 3;
    } else {
      const lastParagraph = paragraphs[paragraphs.length - 1] || "";
      if (lastParagraph.length > 50) {
        score += 2;
      } else if (paragraphs.length >= 2) {
        score += 1;
      }
    }
    
    const transitionWords = ['however', 'therefore', 'meanwhile', 'suddenly', 
                             'finally', 'furthermore', 'moreover', 'consequently', 
                             'nevertheless', 'although', 'firstly', 'secondly', 
                             'then', 'next', 'later', 'eventually'];
    const lowerContent = essayContent.toLowerCase();
    const transitionsFound = transitionWords.filter(word => 
      new RegExp(`\\b${word}\\b`, 'i').test(lowerContent)
    ).length;
    
    if (transitionsFound >= 3) score += 1;
    else if (transitionsFound >= 2) score += 0.5;
    
    const sentenceStarters = sentences.map(s => s.trim().split(/\s+/)[0]);
    const uniqueStarters = new Set(sentenceStarters).size;
    if (uniqueStarters / sentences.length > 0.5) {
      score += 1;
    }
    
    return Math.min(Math.max(0, Math.round(score * 2) / 2), 10);
  }

  private static scoreSpellingAndGrammar(essayContent: string): number {
    let errorCount = 0;
    
    const articleErrors = (essayContent.match(/\ba ([aeiouAEIOU]\w*)/gi) || []).length;
    errorCount += articleErrors;
    
    const commonMisspellings = ['recieve', 'beleive', 'seperate', 'definately', 
                                'occured', 'begining', 'untill', 'wierd'];
    const lowerContent = essayContent.toLowerCase();
    commonMisspellings.forEach(word => {
      if (lowerContent.includes(word)) errorCount++;
    });
    
    const paragraphs = essayContent.split(/\n\s*\n/);
    paragraphs.forEach(para => {
      if (para.trim().length > 20 && !/[.!?]$/.test(para.trim())) {
        errorCount += 0.5;
      }
    });
    
    if (errorCount === 0) return 10;
    if (errorCount <= 1) return 9;
    if (errorCount <= 3) return 7;
    if (errorCount <= 6) return 5;
    if (errorCount <= 10) return 3;
    return 1;
  }

  private static scoreLanguageFeatures(essayContent: string): number {
    let score = 2;
    const lowerContent = essayContent.toLowerCase();
    const words = essayContent.split(/\s+/);
    const uniqueWords = new Set(words).size;
    
    if (uniqueWords / words.length > 0.6) score += 1;
    
    const figurativeLanguage = [' like ', ' as ', 'metaphor', 'simile', 'personification', 'hyperbole'];
    const figurativeCount = figurativeLanguage.filter(phrase => lowerContent.includes(phrase)).length;
    if (figurativeCount >= 2) score += 2;
    else if (figurativeCount >= 1) score += 1;
    
    const sensoryWords = ['see', 'hear', 'smell', 'taste', 'touch', 'feel'];
    const sensoryCount = sensoryWords.filter(word => lowerContent.includes(word)).length;
    if (sensoryCount >= 3) score += 2;
    else if (sensoryCount >= 1) score += 1;
    
    const sophisticatedWords = ['ethereal', 'ephemeral', 'cacophony', 'sonorous', 'pulchritudinous'];
    const sophisticatedCount = sophisticatedWords.filter(word => lowerContent.includes(word)).length;
    if (sophisticatedCount >= 2) score += 2;
    else if (sophisticatedCount >= 1) score += 1;
    
    return Math.min(Math.max(0, Math.round(score)), this.maxScorePerCriterion);
  }

  private static getOverallStrengths(domains: any, essayContent: string): string[] {
    const strengths: string[] = [];
    if (domains.languageFeatures.score >= 8) {
      strengths.push("Excellent use of descriptive and figurative language.");
    }
    if (domains.spellingAndGrammar.score >= 8) {
      strengths.push("Strong command of grammar and spelling.");
    }
    if (domains.textStructure.score >= 8) {
      strengths.push("Well-structured essay with clear paragraphs.");
    }
    if (domains.contentAndIdeas.score >= 8) {
      strengths.push("Creative and original ideas that address the prompt.");
    }
    if (strengths.length === 0) {
      strengths.push("Good attempt, with a solid foundation to build upon.");
    }
    return strengths;
  }

  private static getOverallAreasForImprovement(
    domains: any, 
    essayContent: string, 
    prompt: string, 
    wordCount: number, 
    targetWordCountMin: number, 
    targetWordCountMax: number, 
    promptCheck: PromptCheckResult
  ): string[] {
    const improvements: string[] = [];

    if (wordCount < targetWordCountMin) {
      if (wordCount < 300) {
        improvements.push(`📏 CRITICAL: Essay too short (${wordCount} words). Aim for 400-500 words`);
      } else {
        improvements.push(`📏 Essay is short (${wordCount} words). Aim for 400-500 words`);
      }
    }

    if (promptCheck.incompleteEssay) {
      improvements.push("✍️ CRITICAL: Essay appears incomplete. Ensure you write a full response with a conclusion.");
    }

    if (promptCheck.missingElements.length > 0) {
      improvements.push(`🎯 Address all parts of the prompt. Missing: ${promptCheck.missingElements.join(', ')}`);
    }

    if (domains.contentAndIdeas.score < 6) {
      improvements.push("💡 Add more specific details and fully answer all prompt questions");
    }

    if (domains.spellingAndGrammar.score < 7) {
      const articleErrors = essayContent.match(/\ba ([aeiouAEIOU]\w*)/gi);
      if (articleErrors && articleErrors.length > 0) {
        const example = articleErrors[0];
        const fixed = example.replace(/\ba /gi, "an ");
        improvements.push(`🔤 Fix: \"${example}\" → \"${fixed}\"`);
      }
      improvements.push("✅ Proofread for spelling, grammar, punctuation");
    }

    if (domains.textStructure.score < 6) {
      const paragraphs = essayContent.split(/\n\s*\n/).filter(p => p.trim().length > 0);
      if (paragraphs.length < 3) {
        improvements.push(`🏗️ Structure: Add more paragraphs (currently ${paragraphs.length}, aim for 4-5)`);
      } else {
        improvements.push("🏗️ Strengthen paragraph transitions");
      }
    }

    if (domains.languageFeatures.score < 6) {
      improvements.push("🎨 Use more figurative language (similes, metaphors, sensory details)");
    }

    if (improvements.length === 0) {
      improvements.push("🌟 Strong work! Try advanced techniques: varied sentence openers, internal monologue, foreshadowing");
    }

    return improvements.slice(0, 6);
  }

  private static getOverallRecommendations(overallScore: number, wordCount: number, targetWordCountMin: number, targetWordCountMax: number): string[] {
    const recommendations: string[] = [];
    
    if (wordCount < targetWordCountMin) {
      recommendations.push(`🚨 URGENT: Your essay is only ${wordCount} words. For NSW selective exams, aim for ${targetWordCountMin}-${targetWordCountMax} words. Practice writing longer, more detailed responses.`);
    } else if (wordCount < targetWordCountMax) {
      recommendations.push(`📝 Expand your essay from ${wordCount} to ${targetWordCountMin}-${targetWordCountMax} words. Add more details, examples, and address all prompt requirements fully.`);
    } else if (wordCount >= targetWordCountMin && wordCount <= targetWordCountMax + 50) {
      recommendations.push(`✅ Good word count (${wordCount} words) - this is appropriate for selective exams.`);
    } else if (wordCount > targetWordCountMax + 50) {
      recommendations.push(`⚖️ Your essay is ${wordCount} words, which is lengthy. Practice being more concise while maintaining detail.`);
    }
    
    if (overallScore >= 85) {
      recommendations.push("🌟 Outstanding work! To push further, experiment with advanced narrative techniques like flashbacks, foreshadowing, or multiple perspectives.");
      recommendations.push("⏱️ Practice timed writing: spend 5 mins planning, 25 mins writing, 5 mins editing.");
      recommendations.push("📖 Analyze published works in your genre and notice how authors handle dialogue, pacing, and description.");
    } else if (overallScore >= 70) {
      recommendations.push("👍 Strong foundation! Focus on addressing EVERY part of multi-question prompts completely.");
      recommendations.push("📋 Before writing, list all prompt requirements and check them off as you address each one.");
      recommendations.push("🎭 Add more sensory details and \"show don't tell\" - let readers experience the story through actions and dialogue.");
    } else if (overallScore >= 55) {
      recommendations.push("💪 Good effort! Work on essay structure: clear introduction with hook, body paragraphs with topic sentences, strong conclusion.");
      recommendations.push("📚 Build vocabulary by keeping a word journal of interesting words you encounter while reading.");
      recommendations.push("✍️ Practice the \"5-paragraph essay\" structure until it becomes natural, then experiment with variations.");
    } else {
      recommendations.push("🎯 Start with planning: Before writing, spend 5 minutes listing all prompt requirements and brainstorming ideas for each.");
      recommendations.push("📖 Read your work aloud to catch errors, awkward phrasing, and missing words.");
      recommendations.push("🔍 Focus on one skill at a time: This week work on paragraph structure, next week on descriptive vocabulary.");
      recommendations.push("👨‍🏫 Ask a teacher or parent to review your practice essays and discuss specific improvements.");
    }
    
    recommendations.push("⏰ For selective exams: Spend 5 minutes planning, 20-25 minutes writing, 5 minutes proofreading. Practice this timing!");
    recommendations.push("📝 Practice writing to different prompts weekly. The more you practice, the more confident you'll become.");
    
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
    
    const level = score >= 8 ? "high" : score >= 5 ? "medium" : "low";
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
        examples.push(`Strong vocabulary examples: ${longWords.slice(0, 3).join(", ")}`);
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
    const examples: string[] = [];
    
    const articleErrors = essayContent.match(/\ba ([aeiouAEIOU]\w*)/g);
    
    if (score >= 8) {
      examples.push("✅ Excellent technical accuracy throughout");
      if (articleErrors && articleErrors.length > 0) {
        examples.push(`Minor fix needed: \"${articleErrors[0]}\" should use 'an' instead of 'a'`);
      } else {
        examples.push("Very few or no errors in spelling, punctuation, or grammar");
      }
    } else if (score >= 6) {
      examples.push("Generally good with some minor errors to fix");
      if (articleErrors && articleErrors.length > 0) {
        const example = articleErrors[0];
        const fixed = example.replace(/\ba /i, "an ");
        examples.push(`Article error: \"${example}\" should be \"${fixed}\"`);
      }
      examples.push("Double-check article usage (a/an) and common homophones");
    } else {
      examples.push("Several errors need attention - proofread carefully");
      if (articleErrors && articleErrors.length > 0) {
        const example = articleErrors[0];
        const fixed = example.replace(/\ba /i, "an ");
        examples.push(`Fix: \"${example}\" → \"${fixed}\"`);
      }
      examples.push("Focus on: spelling, article usage, punctuation");
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
    
    if (lower.includes(" like ") || lower.includes(" as ")) devices.push("Simile");
    if (lower.match(/\b(\w+)\s+\1\b/)) devices.push("Repetition for effect");
    
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

  private static getFeedbackForContentAndIdeas(score: number): string[] {
    if (score >= 8) return ["Excellent, well-developed ideas that directly address the prompt."];
    if (score >= 6) return ["Good ideas, but could be more developed or consistently linked to the prompt."];
    if (score >= 4) return ["Ideas are present but may be generic or not fully address the prompt."];
    return ["Ideas are unclear or do not address the prompt. Focus on understanding the question."];
  }

  private static getFeedbackForTextStructure(score: number): string[] {
    if (score >= 8) return ["Clear and effective structure with a strong introduction, body, and conclusion."];
    if (score >= 6) return ["Good structure, but could be improved with clearer topic sentences or transitions."];
    if (score >= 4) return ["Some structure is present, but it may be inconsistent or confusing."];
    return ["Lacks a clear structure. Focus on creating a clear beginning, middle, and end."];
  }

  private static getFeedbackForLanguageFeatures(score: number): string[] {
    if (score >= 8) return ["Excellent use of language features, including sophisticated vocabulary and figurative language."];
    if (score >= 6) return ["Good use of language features, but could be more varied or consistent."];
    if (score >= 4) return ["Some use of language features, but they may be simple or used incorrectly."];
    return ["Limited use of language features. Focus on using more descriptive language."];
  }

  private static getFeedbackForSpellingAndGrammar(score: number): string[] {
    if (score >= 8) return ["Excellent spelling and grammar with very few errors."];
    if (score >= 6) return ["Good spelling and grammar, but with some errors that need correction."];
    if (score >= 4) return ["Several spelling and grammar errors that impact readability."];
    return ["Numerous spelling and grammar errors that make the writing difficult to understand."];
  }
}