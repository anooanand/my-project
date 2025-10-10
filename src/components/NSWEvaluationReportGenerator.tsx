// Define interfaces for the data structures used in the report generation.
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
    const cleanedEssay = NSWEvalconst cleanedEssay = NSWconst cleanedEssay = NSWEvaluationReportGenerator.removePromptFromEssay(safeEssayContent, safePrompt); const cleanedWordCount = cleanedEssay.trim().split(/\s+/).filter(w => w.length > 0).length;

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
      overallScore: (scoreIdeas * 0.4) + (scoreStructure * 0.2) + (scoreLanguage * 0.25) + (scoreGrammar * 0.15),
      criteria: {
        ideas: scoreIdeas,
        structure: scoreStructure,
        language: scoreLanguage,
        grammar: scoreGrammar,
      },
      originalEssay: originalEssay,
      cleanedEssay: essayForScoring,
      promptCheckResult: promptCheck,
    };
  }

  private static detectPromptCopying(essayContent: string, prompt: string): PromptCheckResult {
    const normalizedEssay = essayContent.trim().toLowerCase();
    const normalizedPrompt = prompt.trim().toLowerCase();

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

    // **FIX**: Changed from 50 to 20 - if cleaned content is less than 20 words, return full essay
    if (originalContent.split(/\s+/).filter(w => w.length > 0).length < 20) {
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