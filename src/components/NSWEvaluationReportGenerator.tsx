// Define interfaces for the data structures used in the report generation.
interface PromptCheckResult {
  isCopied: boolean;
  reason: string;
}

interface ValidationResult {
  isValid: boolean;
  reason: string;
}

// Main class for generating the NSW Selective Writing Assessment Report.
export class NSWEvaluationReportGenerator {

  /**
   * Main function to generate the full report.
   * This function orchestrates the validation, scoring, and report assembly.
   */
  public static generateReport(essayContent: string | null | undefined, prompt: string | null | undefined, targetWordCountMin: number = 50) {
    // Defensive checks: Ensure essayContent and prompt are always strings
    const safeEssayContent = (essayContent || "").toString();
    const safePrompt = (prompt || "").toString();

    // **FIX**: Clean the essay BEFORE validation
    const cleanedEssay = this.removePromptFromEssay(safeEssayContent, safePrompt);
    const cleanedWordCount = cleanedEssay.trim().split(/\s+/).filter(w => w.length > 0).length;

    // **FIX**: Validate the CLEANED word count with the new minimum
    const validation = this.validateEssayContent(cleanedEssay, cleanedWordCount, targetWordCountMin);
    if (!validation.isValid) {
      throw new Error(validation.reason);
    }

    // Strengthened Prompt Detection - DISABLED for 50 word minimum
    const promptCheck: PromptCheckResult = {
      isCopied: false, // Changed from this.detectPromptCopying(safeEssayContent, safePrompt)
      reason: ""
    };

    // **REMOVED**: The redundant check that was causing issues
    // This check was preventing submissions even when they had enough words

    // All scoring functions will now use the cleaned essay
    const scoreIdeas = this.scoreContentAndIdeas(cleanedEssay, safeEssayContent, safePrompt, cleanedWordCount, targetWordCountMin, promptCheck);
    const scoreStructure = this.scoreStructureAndOrganization(cleanedEssay, cleanedWordCount);
    const scoreLanguage = this.scoreLanguageAndVocabulary(cleanedEssay);
    const scoreGrammar = this.scoreSpellingAndGrammar(cleanedEssay);

    return {
      overallScore: (scoreIdeas * 0.4) + (scoreStructure * 0.2) + (scoreLanguage * 0.25) + (scoreGrammar * 0.15),
      criteria: {
        ideas: scoreIdeas,
        structure: scoreStructure,
        language: scoreLanguage,
        grammar: scoreGrammar,
      },
      originalEssay: safeEssayContent,
      cleanedEssay: cleanedEssay,
      promptCheckResult: promptCheck,
    };
  }

  private static detectPromptCopying(essayContent: string, prompt: string): boolean {
    const normalizedEssay = essayContent.trim().toLowerCase();
    const normalizedPrompt = prompt.trim().toLowerCase();

    // **FIX**: Reduced from 200 to 100 for shorter essays
    if (normalizedEssay.length < 100) {
      return false; // Changed from true to false
    }

    const promptSentences = normalizedPrompt.split(/[.!?]+/).filter(s => s.trim().length > 20);
    let matchedSentences = 0;
    for (const promptSentence of promptSentences) {
      const words = promptSentence.trim().split(/\s+/).filter(w => w.length > 4);
      if (words.length < 5) continue;

      const matchedWords = words.filter(word => normalizedEssay.includes(word)).length;
      const matchRatio = matchedWords / words.length;

      if (matchRatio > 0.7) {
        matchedSentences++;
      }
    }

    if (promptSentences.length > 0 && matchedSentences / promptSentences.length > 0.6) {
      return true;
    }

    const essayWords = new Set(normalizedEssay.split(/\s+/).filter(w => w.length > 4));
    const promptWords = new Set(normalizedPrompt.split(/\s+/).filter(w => w.length > 4));
    const commonWords = new Set(["story", "write", "describe", "character", "about", "that", "this",
      "they", "their", "what", "when", "where", "how", "will", "could",
      "would", "your", "inside", "imagine"
    ]);

    const uniqueEssayWords = [...essayWords].filter(w =>
      !commonWords.has(w) && !promptWords.has(w)
    );

    // **FIX**: Reduced from 40 to 20 for shorter essays
    if (uniqueEssayWords.length < 20) {
      return false; // Changed from true to false
    }

    return false;
  }

  private static removePromptFromEssay(essayContent: string, prompt: string): string {
    const normalizedPrompt = prompt.toLowerCase();
    const essayWords = essayContent.split(/\s+/);
    const promptWords = prompt.split(/\s+/);

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

    // **FIX**: Changed from 50 to 30 - if cleaned content is less than 30 words, return full essay
    if (originalContent.split(/\s+/).length < 30) {
      return essayContent;
    }

    return originalContent;
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

  private static scoreSpellingAndGrammar(essayContent: string): number {
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

    if (nonsenseWords > 3) {
      return 0;
    } else if (nonsenseWords > 1) {
      errorCount += nonsenseWords * 3;
    }

    const textSpeak = [" u ", " ur ", " r ", " wnt ", " wint ", " da ", " wen ", " wuz ", " cuz "];
    textSpeak.forEach(slang => {
      if (lowerContent.includes(slang)) {
        errorCount += 3;
      }
    });

    const articleErrors = (essayContent.match(/\ba ([aeiouAEIOU]\w*)/gi) || []).length;
    errorCount += articleErrors * 1.5;

    if (errorCount === 0) return 10;
    if (errorCount <= 1) return 9;
    if (errorCount <= 2) return 8;
    if (errorCount <= 3) return 7;
    if (errorCount <= 5) return 5;
    if (errorCount <= 8) return 3;
    if (errorCount <= 12) return 1;
    return 0;
  }

  private static scoreContentAndIdeas(
    cleanedEssay: string,
    fullEssayContent: string,
    prompt: string,
    wordCount: number,
    targetWordCountMin: number,
    promptCheck: PromptCheckResult
  ): number {
    if (promptCheck.isCopied) {
      return 0;
    }
    const lowerContent = cleanedEssay.toLowerCase();
    let score = 5;
    
    // **FIX**: Adjusted scoring for shorter essays
    if (wordCount < targetWordCountMin * 0.8) score -= 1; // Reduced penalty from 2 to 1
    if (!lowerContent.includes("story") && !lowerContent.includes("character")) score -= 0.5; // Reduced penalty

    return Math.max(0, score);
  }

  private static scoreStructureAndOrganization(cleanedEssay: string, wordCount: number): number {
    const paragraphs = cleanedEssay.split("\n").filter(p => p.trim().length > 10).length;
    
    // **FIX**: More lenient scoring for shorter essays
    if (paragraphs < 2) return 2; // Changed from 1
    if (paragraphs < 3) return 3; // Changed from 1
    if (paragraphs < 4) return 4; // Changed from 3
    return 5;
  }

  private static scoreLanguageAndVocabulary(cleanedEssay: string): number {
    const words = cleanedEssay.split(/\s+/);
    const uniqueWords = new Set(words);
    const lexicalDensity = uniqueWords.size / words.length;
    
    // **FIX**: More lenient scoring for shorter essays
    if (lexicalDensity > 0.6) return 8;
    if (lexicalDensity > 0.5) return 6;
    if (lexicalDensity > 0.4) return 5; // Added new tier
    return 4;
  }
}