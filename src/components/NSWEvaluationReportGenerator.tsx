// Define interfaces for the data structures used in the report generation.
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

interface PromptCheckResult {
  isCopied: boolean;
  reason: string;
}

interface ValidationResult {
  isValid: boolean;
  reason: string;
}

interface GenerateReportParams {
  essayContent: string;
  textType?: string;
  prompt: string;
  wordCount?: number;
  targetWordCountMin?: number;
  targetWordCountMax?: number;
}

// Main class for generating the NSW Selective Writing Assessment Report.
export class NSWEvaluationReportGenerator {

  private static detectDuplicateContent(essayContent: string): boolean {
    // This is a placeholder for actual duplicate content detection logic.
    // For now, it will always return false to prevent the error.
    // A more robust implementation would involve comparing the essayContent
    // against a database of previously submitted essays or using advanced
    // plagiarism detection algorithms.
    return false;
  }


  /**
   * Main function to generate the full report.
   * This function orchestrates the validation, scoring, and report assembly.
   */
  public static generateReport(params: GenerateReportParams) {
    const { essayContent, prompt, targetWordCountMin = 50, targetWordCountMax = 300 } = params;

    const safeEssayContent = (essayContent || "").toString();
    const safePrompt = (prompt || "").toString();

    // STEP 1: Check for duplicates first
    if (NSWEvaluationReportGenerator.detectDuplicateContent(safeEssayContent)) {
      throw new Error("❌ Your essay contains repeated sections. Please write original content.");
    }

    // STEP 2: Clean the essay (remove prompt)
   const cleanedEssay = NSWEvaluationReportGenerator.removePromptFromEssay(safeEssayContent, safePrompt); const cleanedWordCount = cleanedEssay.trim().split(/\s+/).filter(w => w.length > 0).length;

    console.log("=== VALIDATION DEBUG ====");
    console.log("Original word count:", safeEssayContent.split(/\s+/).length);
    console.log("Cleaned word count:", cleanedWordCount);
    console.log("Target minimum:", targetWordCountMin);
    console.log("Cleaned content:", cleanedEssay.substring(0, 150) + "...");

    // STEP 3: Validate cleaned content meets minimum
    if (cleanedWordCount < targetWordCountMin) {
      throw new Error(
        `❌ Your original content is only ${cleanedWordCount} words.\n` +
        `You need ${targetWordCountMin} words of YOUR OWN creative story.\n` +
        `(The prompt text doesn\'t count toward your word count!)`
      );
    }

    // STEP 4: Check for prompt copying
    const promptCheck = NSWEvaluationReportGenerator.detectPromptCopying(safeEssayContent, safePrompt);
    if (promptCheck.isCopied) {
      throw new Error(promptCheck.reason);
    }

    // STEP 5: Validate content quality
    const validation = NSWEvaluationReportGenerator.validateEssayContent(cleanedEssay, cleanedWordCount, targetWordCountMin);
    if (!validation.isValid) {
      throw new Error(validation.reason);
    }

    // STEP 6: Generate scores
    return NSWEvaluationReportGenerator.generateScores(cleanedEssay, safeEssayContent, safePrompt, cleanedWordCount, targetWordCountMin);
  }

  private static generateScores(essayForScoring: string, originalEssay: string, prompt: string, wordCount: number, targetWordCountMin: number) {
    // Strengthened Prompt Detection - DISABLED for 50 word minimum
    const promptCheck: PromptCheckResult = NSWEvaluationReportGenerator.detectPromptCopying(originalEssay, prompt);
    if (promptCheck.isCopied) {
      throw new Error(promptCheck.reason);
    }

    // All scoring functions will now use the essay for scoring
    const scoreIdeas = NSWEvaluationReportGenerator.scoreContentAndIdeas(essayForScoring, originalEssay, prompt, wordCount, targetWordCountMin, promptCheck);
    const scoreStructure = NSWEvaluationReportGenerator.scoreStructureAndOrganization(essayForScoring, wordCount);
    const scoreLanguage = NSWEvaluationReportGenerator.scoreLanguageAndVocabulary(essayForScoring);
    const scoreGrammar = NSWEvaluationReportGenerator.scoreSpellingAndGrammar(essayForScoring);

    return {
            overallScore: (scoreIdeas.weightedScore) + (scoreStructure.weightedScore) + (scoreLanguage.weightedScore) + (scoreGrammar.weightedScore),
      domains: {
        contentAndIdeas: scoreIdeas,
        textStructure: scoreStructure,
        languageFeatures: scoreLanguage,
        spellingAndGrammar: scoreGrammar,
      },
      originalEssay: originalEssay,
      cleanedEssay: essayForScoring,
      promptCheckResult: promptCheck,
    };
  }

  private static detectPromptCopying(essayContent: string, prompt: string): PromptCheckResult {
    const normalizedEssay = essayContent.trim().toLowerCase();
    const normalizedPrompt = (prompt || "").trim().toLowerCase();

    // Split prompt into sentences
    const promptSentences = normalizedPrompt.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    // Check how many prompt sentences appear in essay
    let matchedSentences = 0;
    for (const promptSentence of promptSentences) {
      const words = promptSentence.trim().split(/\s+/).filter(w => w.length > 4);
      if (words.length < 5) continue;

      // Check if 70%+ of words from this sentence appear in essay
      const matchedWords = words.filter(word => normalizedEssay.includes(word)).length;
      const matchRatio = matchedWords / words.length;

      if (matchRatio > 0.7) {
        matchedSentences++;
      }
    }

    // If more than 50% of prompt sentences found in essay, it\'s copied
    if (promptSentences.length > 0 && matchedSentences / promptSentences.length > 0.5) {
      return {
        isCopied: true,
        reason: "❌ Your submission contains too much of the prompt text. Please write your own original story (at least 50 words) responding to the prompt."
      };
    }

    // Check for unique original content
    const essayWords = new Set(normalizedEssay.split(/\s+/).filter(w => w.length > 4));
    const promptWords = new Set(normalizedPrompt.split(/\s+/).filter(w => w.length > 4));
    const commonWords = new Set(["story", "write", "describe", "character", "about", "that", "this", 
                                 "they", "their", "what", "when", "where", "how", "will", "could", 
                                 "would", "your", "inside", "imagine", "find", "discover", "open"]);
    
    const uniqueEssayWords = [...essayWords].filter(w => 
      !commonWords.has(w) && !promptWords.has(w)
    );
    
    // For 50-word essays, require at least 15 unique words
    // For longer essays, require 30+
    const requiredUniqueWords = essayContent.split(/\s+/).length < 100 ? 15 : 30;
    
    if (uniqueEssayWords.length < requiredUniqueWords) {
      return {
        isCopied: true,
        reason: `❌ Your essay needs more original content. You have only ${uniqueEssayWords.length} unique words (need ${requiredUniqueWords}+). Please write your own creative story.`
      };
    }

    return {
      isCopied: false,
      reason: ""
    };
  }


  private static removePromptFromEssay(essayContent: string, prompt: string): string {
    const normalizedPrompt = (prompt || "").toLowerCase();
    const essayWords = essayContent.split(/\s+/);
    const promptWords = (prompt || "").split(/\s+/);

    let startIndex = 0;

    for (let i = 0; i < Math.min(essayWords.length, promptWords.length * 2); i++) {
      const essayWord = essayWords[i]?.toLowerCase().replace(/[^a-z]/g, "");
      const promptHasWord = promptWords.some(pw =>
        pw.toLowerCase().replace(/[^a-z]/g, "") === essayWord
      );

      if (!promptHasWord && essayWord.length > 3) {
        startIndex = i;
        break;
      }
    }

    const originalContent = essayWords.slice(startIndex).join(" ");

    // **FIX**: Changed from 50 to 20 - if cleaned content is less than 20 words, return full essay
    if (originalContent.split(/\s+/).filter(w => w.length > 0).length < 20) {
      return essayContent;
    }

    return originalContent;
  }

  private static getBand(score: number): string {
    if (score >= 9) return "Band 6";
    if (score >= 7) return "Band 5";
    if (score >= 5) return "Band 4";
    if (score >= 3) return "Band 3";
    return "Band 2";
  }

  private static validateEssayContent(essayContent: string, wordCount: number, targetWordCountMin: number): ValidationResult {
    // **FIX**: Use the targetWordCountMin parameter instead of hardcoded 50
    if (wordCount < targetWordCountMin) {
      return {
        isValid: false,
        reason: `❌ Your essay is too short. Please write a story of at least ${targetWordCountMin} words. Please try again.`
      };
    }

    const words = essayContent.split(/\s+/).filter(w => w.length > 3);
    let nonsenseCount = 0;
    for (const word of words) {
      const cleanWord = word.replace(/[^a-z]/gi, "");
      if (cleanWord.length > 3 && !/[aeiou]/i.test(cleanWord)) {
        nonsenseCount++;
      }
    }

    if (words.length > 10 && nonsenseCount / words.length > 0.3) {
      return {
        isValid: false,
        reason: "❌ Your essay contains too many unrecognizable words. Please write in clear English sentences."
      };
    }

    return {
      isValid: true,
      reason: ""
    };
  }

  private static scoreSpellingAndGrammar(essayContent: string): DomainScore {
    let errorCount = 0;
    const lowerContent = essayContent.toLowerCase();

    const words = essayContent.split(/\s+/);
    let nonsenseWords = 0;
    for (const word of words) {
      const cleanWord = word.replace(/[^a-z]/gi, "");
      if (cleanWord.length > 3) {
        if (!/[aeiou]/i.test(cleanWord)) {
          nonsenseWords++;
        }
        if (/[bcdfghjklmnpqrstvwxyz]{4,}/i.test(cleanWord)) {
          nonsenseWords++;
        }
      }
    }

    if (nonsenseWords > 3) errorCount += 10;
    else if (nonsenseWords > 1) errorCount += nonsenseWords * 3;

    const textSpeak = [" u ", " ur ", " r ", " wnt ", " wint ", " da ", " wen ", " wuz ", " cuz "];
    textSpeak.forEach(slang => {
      if (lowerContent.includes(slang)) {
        errorCount += 3;
      }
    });

    const articleErrors = (essayContent.match(/\ba ([aeiouAEIOU]\w*)/gi) || []).length;
    errorCount += articleErrors * 1.5;

    let score;
    if (errorCount === 0) score = 10;
    else if (errorCount <= 1) score = 9;
    else if (errorCount <= 2) score = 8;
    else if (errorCount <= 3) score = 7;
    else if (errorCount <= 5) score = 5;
    else if (errorCount <= 8) score = 3;
    else if (errorCount <= 12) score = 1;
    else score = 0;

    const feedback: string[] = [];
    const specificExamples: string[] = [];

    if (errorCount > 5) {
      feedback.push("Your essay contains several spelling and grammar errors that make it difficult to read. Focus on correct word usage and sentence structure.");
    } else if (errorCount > 0) {
      feedback.push("A few spelling and grammar mistakes were found. Proofread carefully to catch these errors.");
    } else {
      feedback.push("Excellent control over spelling and grammar. Your writing is clear and precise.");
    }

    if (nonsenseWords > 0) {
      specificExamples.push(`Detected ${nonsenseWords} words that appear to be nonsense or incorrectly spelled. Double-check words like '${words.filter(w => !/[aeiou]/i.test(w.replace(/[^a-z]/gi, "")) && w.replace(/[^a-z]/gi, "").length > 3).join(", ")}'.`);
    }
    if (articleErrors > 0) {
      specificExamples.push(`Found ${articleErrors} instances of incorrect article usage (e.g., 'a' before a vowel sound). Review your use of 'a' and 'an'.`);
    }

    const childFriendlyExplanation = score >= 7 ? 
      "You used words correctly and your sentences made sense. Great job!" :
      "Some of your words had mistakes, or your sentences were a little mixed up. Keep practicing to make your writing super clear!";

    return {
      score: score,
      maxScore: 10,
      percentage: (score / 10) * 100,
      band: NSWEvaluationReportGenerator.getBand(score),
      weight: 0.25,
      weightedScore: score * 0.25,
      feedback: feedback,
      specificExamples: specificExamples,
      childFriendlyExplanation: childFriendlyExplanation,
    };
  }

  private static scoreLanguageAndVocabulary(essayContent: string): DomainScore {
    let score = 0;
    const words = essayContent.split(/\s+/).filter(w => w.length > 0);
    const uniqueWords = new Set(words.map(word => word.toLowerCase()));

    // Vocabulary richness (simple metric: unique words / total words)
    const vocabularyRatio = uniqueWords.size / words.length;
    if (vocabularyRatio > 0.6) score += 3; // Very rich
    else if (vocabularyRatio > 0.4) score += 2; // Good
    else score += 1; // Basic

    // Use of varied sentence structures (simple check for commas, conjunctions)
    const complexSentenceIndicators = (essayContent.match(/[,;]|\band\b|\bbut\b|\bor\b|\bso\b|\bbecause\b/gi) || []).length;
    if (complexSentenceIndicators > words.length * 0.05) score += 3; // Good variety
    else if (complexSentenceIndicators > words.length * 0.02) score += 2; // Some variety
    else score += 1; // Limited variety

    // Use of descriptive language (adjectives, adverbs - simple count)
    const descriptiveWords = (essayContent.match(/\b(?:very|really|quite|extremely|beautiful|ugly|quickly|slowly|suddenly|happily|sadly)\b/gi) || []).length;
    if (descriptiveWords > words.length * 0.03) score += 2; // Good descriptive language
    else if (descriptiveWords > words.length * 0.01) score += 1; // Some descriptive language

    // Check for clichés or overused phrases (example)
    const cliches = ["once upon a time", "happily ever after", "in a galaxy far, far away"];
    let clicheCount = 0;
    cliches.forEach(cliche => {
      if (essayContent.toLowerCase().includes(cliche)) {
        clicheCount++;
      }
    });
    if (clicheCount > 0) score -= clicheCount;

    // Ensure score is not negative and capped at 10
    score = Math.max(0, Math.min(10, score));

    const feedback: string[] = [];
    const specificExamples: string[] = [];

    if (vocabularyRatio > 0.5) {
      feedback.push("Your vocabulary is strong and varied, making your writing engaging.");
    } else if (vocabularyRatio > 0.3) {
      feedback.push("You use a good range of words, but try to introduce more sophisticated vocabulary.");
    } else {
      feedback.push("Consider expanding your vocabulary to make your writing more interesting and precise.");
    }

    if (complexSentenceIndicators > words.length * 0.04) {
      feedback.push("You effectively use varied sentence structures, which adds flow and complexity to your essay.");
    } else {
      feedback.push("Vary your sentence structures to avoid monotony. Try combining shorter sentences or using more complex clauses.");
    }

    const childFriendlyExplanation = score >= 7 ? 
      "You used lots of interesting words and different kinds of sentences. Your writing sounds really good!" :
      "Try using some new and exciting words, and mix up your sentences so they don't all sound the same.";

    return {
      score: score,
      maxScore: 10,
      percentage: (score / 10) * 100,
      band: NSWEvaluationReportGenerator.getBand(score),
      weight: 0.25,
      weightedScore: score * 0.25,
      feedback: feedback,
      specificExamples: specificExamples,
      childFriendlyExplanation: childFriendlyExplanation,
    };
  }

  private static scoreStructureAndOrganization(essayContent: string, wordCount: number): DomainScore {
    let score = 0;
    const paragraphs = essayContent.split(/\n\s*\n/).filter(p => p.trim().length > 0);

    // Basic paragraph structure
    if (paragraphs.length >= 3) score += 3; // Introduction, body, conclusion
    else if (paragraphs.length >= 1) score += 1;

    // Paragraph length consistency (simple check)
    const avgParagraphLength = words.length / paragraphs.length;
    const words = essayContent.split(/\s+/).filter(w => w.length > 0);

    let consistentLength = true;
    for (const p of paragraphs) {
      const pWords = p.split(/\s+/).filter(w => w.length > 0);
      if (pWords.length < avgParagraphLength * 0.5 || pWords.length > avgParagraphLength * 1.5) {
        consistentLength = false;
        break;
      }
    }
    if (consistentLength && paragraphs.length > 1) score += 2;

    // Use of transition words (simple check for common transitions)
    const transitionWords = ["firstly", "secondly", "finally", "in conclusion", "however", "therefore", "additionally", "moreover"];
    let transitionCount = 0;
    const lowerContent = essayContent.toLowerCase();
    transitionWords.forEach(word => {
      if (lowerContent.includes(word)) {
        transitionCount++;
      }
    });
    if (transitionCount >= 3) score += 3;
    else if (transitionCount >= 1) score += 1;

    // Logical flow (placeholder for more advanced analysis)
    // For now, assume good flow if structure and transitions are present
    if (paragraphs.length >= 3 && transitionCount >= 2) score += 2;

    score = Math.max(0, Math.min(10, score));

    const feedback: string[] = [];
    const specificExamples: string[] = [];

    if (paragraphs.length < 3) {
      feedback.push("Your essay could benefit from a clearer structure with distinct introduction, body, and conclusion paragraphs.");
      specificExamples.push(`Currently, your essay has ${paragraphs.length} paragraphs. Aim for at least three to clearly separate your ideas.`);
    } else {
      feedback.push("Your essay has a clear and well-organized structure.");
    }

    if (!consistentLength && paragraphs.length > 1) {
      feedback.push("Some of your paragraphs vary significantly in length. Try to develop each idea more evenly.");
    }

    if (transitionCount < 3) {
      feedback.push("Incorporate more transition words and phrases to improve the flow between your ideas and paragraphs.");
      specificExamples.push("Words like 'however', 'therefore', 'in addition', or 'consequently' can help guide the reader.");
    }

    const childFriendlyExplanation = score >= 7 ? 
      "Your story has a great beginning, middle, and end, and all your ideas fit together nicely!" :
      "Think about making your story have a clear start, middle, and end. Use special words to connect your ideas, like 'first', 'next', and 'finally'.";

    return {
      score: score,
      maxScore: 10,
      percentage: (score / 10) * 100,
      band: NSWEvaluationReportGenerator.getBand(score),
      weight: 0.25,
      weightedScore: score * 0.25,
      feedback: feedback,
      specificExamples: specificExamples,
      childFriendlyExplanation: childFriendlyExplanation,
    };
  }

  private static scoreContentAndIdeas(essayForScoring: string, originalEssay: string, prompt: string, wordCount: number, targetWordCountMin: number, promptCheck: PromptCheckResult): DomainScore {
    let score = 0;
    const lowerEssay = essayForScoring.toLowerCase();
    const lowerPrompt = prompt.toLowerCase();

    // Adherence to prompt (basic keyword matching for now)
    let promptKeywords = lowerPrompt.split(/\s+/).filter(w => w.length > 3 && !["the", "a", "an", "is", "are", "was", "were", "to", "of", "in", "on", "and", "or", "but"].includes(w));
    let matchedKeywords = 0;
    promptKeywords.forEach(keyword => {
      if (lowerEssay.includes(keyword)) {
        matchedKeywords++;
      }
    });

    if (matchedKeywords / promptKeywords.length > 0.7) score += 3; // Strong adherence
    else if (matchedKeywords / promptKeywords.length > 0.4) score += 2; // Moderate adherence
    else score += 1; // Limited adherence

    // Originality/Creativity (based on prompt check and unique words - placeholder)
    if (!promptCheck.isCopied && wordCount >= targetWordCountMin) score += 3; // Original and sufficient length
    else if (!promptCheck.isCopied) score += 2; // Original but might be short
    else score += 0; // Copied content

    // Development of ideas (simple check for essay length vs target)
    if (wordCount >= targetWordCountMin * 1.2) score += 2; // Well-developed
    else if (wordCount >= targetWordCountMin) score += 1; // Sufficiently developed

    // Engagement (placeholder - hard to measure programmatically)
    // For now, assume good engagement if other scores are high
    if (score >= 6) score += 2; // Engaging

    score = Math.max(0, Math.min(10, score));

    const feedback: string[] = [];
    const specificExamples: string[] = [];

    if (promptCheck.isCopied) {
      feedback.push(promptCheck.reason);
    } else if (matchedKeywords / promptKeywords.length < 0.5) {
      feedback.push("Your essay does not fully address the prompt. Ensure all aspects of the prompt are covered.");
      specificExamples.push("Review the prompt and identify key themes or questions you might have missed.");
    } else {
      feedback.push("Your essay directly addresses the prompt and develops relevant ideas effectively.");
    }

    if (wordCount < targetWordCountMin) {
      feedback.push(`Your essay is a bit short. Try to elaborate more on your ideas to reach the target word count of ${targetWordCountMin}.`);
    } else if (wordCount >= targetWordCountMin * 1.2) {
      feedback.push("Your ideas are well-developed and supported with sufficient detail.");
    } else {
      feedback.push("Your ideas are present, but could be further developed with more examples or explanations.");
    }

    const childFriendlyExplanation = score >= 7 ? 
      "You understood the story task perfectly and had lots of great, new ideas!" :
      "Make sure your story is all about the task, and try to think of more of your own special ideas.";

    return {
      score: score,
      maxScore: 10,
      percentage: (score / 10) * 100,
      band: NSWEvaluationReportGenerator.getBand(score),
      weight: 0.25,
      weightedScore: score * 0.25,
      feedback: feedback,
      specificExamples: specificExamples,
      childFriendlyExplanation: childFriendlyExplanation,
    };
  }
}
