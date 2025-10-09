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
export class NSWEvaluationReportGenerator { // Renamed and exported

  /**
   * Main function to generate the full report.
   * This function orchestrates the validation, scoring, and report assembly.
   */
  public static generateReport(essayContent: string | null | undefined, prompt: string | null | undefined, targetWordCountMin: number = 400) {
    // Defensive checks: Ensure essayContent and prompt are always strings
    const safeEssayContent = (essayContent || "").toString();
    const safePrompt = (prompt || "").toString();

    const wordCount = safeEssayContent.trim().split(/\s+/).filter(w => w.length > 0).length;

    // 1. Initial Validation
    const validation = this.validateEssayContent(safeEssayContent, wordCount, targetWordCountMin);
    if (!validation.isValid) {
      throw new Error(validation.reason);
    }

    // 2. Strengthened Prompt Detection
    const promptCheck: PromptCheckResult = {
      isCopied: this.detectPromptCopying(safeEssayContent, safePrompt),
      reason: "Submission appears to substantially copy the prompt."
    };

    // 3. SEPARATE PROMPT FROM ESSAY BEFORE SCORING
    const cleanedEssay = this.removePromptFromEssay(safeEssayContent, safePrompt);
    const cleanedWordCount = cleanedEssay.trim().split(/\s+/).filter(w => w.length > 0).length;

    console.log("Original essay length:", wordCount);
    console.log("Cleaned essay length:", cleanedWordCount);
    console.log("Cleaned essay (first 200 chars):", cleanedEssay.substring(0, 200));

    // If cleaned essay is too short, it indicates the student likely just copied the prompt.
    if (cleanedWordCount < 100) {
      throw new Error(
        "⚠️ Your submission contains mostly the prompt text.\n\n" +
        "Please write your own original creative story (400-500 words) responding to the prompt."
      );
    }

    // 4. UPDATE ALL SCORING FUNCTIONS to use cleanedEssay
    // The scores are calculated based on the cleaned content.
    const scoreIdeas = this.scoreContentAndIdeas(cleanedEssay, safeEssayContent, safePrompt, cleanedWordCount, targetWordCountMin, promptCheck);
    const scoreStructure = this.scoreStructureAndOrganization(cleanedEssay, cleanedWordCount);
    const scoreLanguage = this.scoreLanguageAndVocabulary(cleanedEssay);
    const scoreGrammar = this.scoreSpellingAndGrammar(cleanedEssay); // Use the fixed grammar scoring

    // Construct and return the final report object
    // (This part would connect to your existing report formatting logic)
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

  /**
   * FIX 1: STRENGTHEN PROMPT DETECTION
   * This new implementation is more robust at detecting prompt copying.
   */
  private static detectPromptCopying(essayContent: string, prompt: string): boolean {
    const normalizedEssay = essayContent.trim().toLowerCase();
    const normalizedPrompt = prompt.trim().toLowerCase();

    // Minimum length check
    if (normalizedEssay.length < 200) {
      return true;
    }

    // Split prompt into sentences
    const promptSentences = normalizedPrompt.split(/[.!?]+/).filter(s => s.trim().length > 20);

    // Check how many prompt sentences appear in the essay
    let matchedSentences = 0;
    for (const promptSentence of promptSentences) {
      const words = promptSentence.trim().split(/\s+/).filter(w => w.length > 4);
      if (words.length < 5) continue;

      // Check if 70%+ of words from this sentence appear in the essay
      const matchedWords = words.filter(word => normalizedEssay.includes(word)).length;
      const matchRatio = matchedWords / words.length;

      if (matchRatio > 0.7) {
        matchedSentences++;
      }
    }

    // If more than 60% of prompt sentences are found, it\'s likely copied.
    if (promptSentences.length > 0 && matchedSentences / promptSentences.length > 0.6) {
      return true;
    }

    // Check for unique original content
    const essayWords = new Set(normalizedEssay.split(/\s+/).filter(w => w.length > 4));
    const promptWords = new Set(normalizedPrompt.split(/\s+/).filter(w => w.length > 4));
    const commonWords = new Set(["story", "write", "describe", "character", "about", "that", "this",
      "they", "their", "what", "when", "where", "how", "will", "could",
      "would", "your", "inside", "imagine"
    ]);

    const uniqueEssayWords = [...essayWords].filter(w =>
      !commonWords.has(w) && !promptWords.has(w)
    );

    // Must have at least 40 unique words (increased from 30)
    if (uniqueEssayWords.length < 40) {
      return true;
    }

    return false;
  }

  /**
   * FIX 2: SEPARATE PROMPT FROM ESSAY BEFORE SCORING
   * This new helper function removes the initial prompt part from the essay.
   */
  private static removePromptFromEssay(essayContent: string, prompt: string): string {
    const normalizedPrompt = prompt.toLowerCase();
    const essayWords = essayContent.split(/\s+/);
    const promptWords = prompt.split(/\s+/);

    let startIndex = 0;

    // Find where original content starts (after prompt ends)
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

    // Return only the original content that comes after the prompt
    const originalContent = essayWords.slice(startIndex).join(" ");

    // If the extracted original content is too short, it implies the student didn\'t copy the prompt at the beginning.
    // In this case, return the full essay to avoid penalizing them.
    if (originalContent.split(/\s+/).length < 50) {
      return essayContent;
    }

    return originalContent;
  }

  /**
   * FIX 3: UPDATE validateEssayContent to catch nonsense earlier.
   */
  private static validateEssayContent(essayContent: string, wordCount: number, targetWordCountMin: number): ValidationResult {
    if (wordCount < 50) {
      return {
        isValid: false,
        reason: "❌ Your essay is too short. Please write a story of 400-500 words."
      };
    }

    // Check for excessive nonsense/gibberish
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

  /**
   * FIX 4: FIX GRAMMAR SCORING
   * This updated function heavily penalizes gibberish and text-speak.
   */
  private static scoreSpellingAndGrammar(essayContent: string): number {
    let errorCount = 0;
    const lowerContent = essayContent.toLowerCase();

    // Check for obvious nonsense/random letters
    const words = essayContent.split(/\s+/);
    let nonsenseWords = 0;
    for (const word of words) {
      const cleanWord = word.replace(/[^a-z]/gi, "");
      if (cleanWord.length > 3) {
        // Check if word has no vowels (likely nonsense)
        if (!/[aeiou]/i.test(cleanWord)) {
          nonsenseWords++;
        }
        // Check for excessive consonant clusters
        if (/[bcdfghjklmnpqrstvwxyz]{4,}/i.test(cleanWord)) {
          nonsenseWords++;
        }
      }
    }

    // Heavily penalize nonsense
    if (nonsenseWords > 3) {
      return 0;
    } else if (nonsenseWords > 1) {
      errorCount += nonsenseWords * 3;
    }

    // Common internet/text speak that should be penalized
    const textSpeak = [" u ", " ur ", " r ", " wnt ", " wint ", " da ", " wen ", " wuz ", " cuz "];
    textSpeak.forEach(slang => {
      if (lowerContent.includes(slang)) {
        errorCount += 3;
      }
    });

    // Rest of original error detection...
    const articleErrors = (essayContent.match(/\ba ([aeiouAEIOU]\w*)/gi) || []).length;
    errorCount += articleErrors * 1.5;

    // Scoring
    if (errorCount === 0) return 10;
    if (errorCount <= 1) return 9;
    if (errorCount <= 2) return 8;
    if (errorCount <= 3) return 7;
    if (errorCount <= 5) return 5;
    if (errorCount <= 8) return 3;
    if (errorCount <= 12) return 1;
    return 0;
  }

  /**
   * FIX 5: UPDATE ALL SCORING FUNCTIONS to use cleanedEssay
   * The signature is updated to accept the cleaned essay.
   */
  private static scoreContentAndIdeas(
    cleanedEssay: string,
    fullEssayContent: string, // Keep full essay for specific checks if needed
    prompt: string,
    wordCount: number,
    targetWordCountMin: number,
    promptCheck: PromptCheckResult
  ): number {
    if (promptCheck.isCopied) {
      return 0;
    }
    const lowerContent = cleanedEssay.toLowerCase();
    // ... rest of your original scoring logic for content and ideas would go here
    // For now, returning a placeholder score.
    let score = 5;
    if (wordCount < targetWordCountMin * 0.8) score -= 2;
    if (!lowerContent.includes("story") && !lowerContent.includes("character")) score -=1;


    return Math.max(0, score);
  }

  // Placeholder for other scoring functions - ensure they also use cleanedEssay
  private static scoreStructureAndOrganization(cleanedEssay: string, wordCount: number): number {
    // ... your logic here ...
    const paragraphs = cleanedEssay.split("\n").filter(p => p.trim().length > 10).length;
    if (paragraphs < 3) return 1;
    if (paragraphs < 4) return 3;
    return 5; // Placeholder
  }

  private static scoreLanguageAndVocabulary(cleanedEssay: string): number {
    // ... your logic here ...
    const words = cleanedEssay.split(/\s+/);
    const uniqueWords = new Set(words);
    const lexicalDensity = uniqueWords.size / words.length;
    if (lexicalDensity > 0.6) return 8;
    if (lexicalDensity > 0.5) return 6;
    return 4; // Placeholder
  }
}
