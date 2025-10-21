// Add the DomainScore interface at the top of the file, after the existing interfaces
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

// Add the getBand function within the NSWEvaluationReportGenerator class, before validateEssayContent
  private static getBand(score: number): string {
    if (score >= 9) return "Band 6";
    if (score >= 7) return "Band 5";
    if (score >= 5) return "Band 4";
    if (score >= 3) return "Band 3";
    return "Band 2";
  }

// Modify the generateScores function to return DomainScore objects and calculate overallScore using weightedScore
  private static generateScores(essayForScoring: string, originalEssay: string, prompt: string, wordCount: number, targetWordCountMin: number) {
    // ... (existing code)

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

// Modify the scoreContentAndIdeas function to return a DomainScore object
  private static scoreContentAndIdeas(
    cleanedEssay: string,
    fullEssayContent: string,
    prompt: string,
    wordCount: number,
    targetWordCountMin: number,
    promptCheck: PromptCheckResult
  ): DomainScore {
    if (promptCheck.isCopied) {
      // Return a default DomainScore object for copied content
      return {
        score: 0,
        maxScore: 10,
        percentage: 0,
        band: "Band 1",
        weight: 40,
        weightedScore: 0,
        feedback: ["Content copied from prompt."],
        specificExamples: [],
        childFriendlyExplanation: "Your essay contains too much of the prompt text. Please write your own original story.",
      };
    }
    const lowerContent = cleanedEssay.toLowerCase();
    let score = 10;
    
    // **FIX**: Adjusted scoring for shorter essays
    if (wordCount < targetWordCountMin * 0.8) score -= 2; // Scaled penalty
    if (!lowerContent.includes("story") && !lowerContent.includes("character")) score -= 1; // Scaled penalty
    const finalScore = Math.max(0, score);
    const maxScore = 10;
    const weight = 40; // As per overallScore calculation (0.4)
    const percentage = (finalScore / maxScore) * 100;
    const band = NSWEvaluationReportGenerator.getBand(finalScore);
    const feedback: string[] = []; // Populate with actual feedback
    const specificExamples: string[] = []; // Populate with actual examples
    const childFriendlyExplanation = "This score shows how well your ideas match the prompt and how interesting your story is.";

    return {
      score: finalScore,
      maxScore: maxScore,
      percentage: percentage,
      band: band,
      weight: weight,
      weightedScore: finalScore * (weight / 100),
      feedback: feedback,
      specificExamples: specificExamples,
      childFriendlyExplanation: childFriendlyExplanation,
    };
  }

// Modify the scoreStructureAndOrganization function to return a DomainScore object
  private static scoreStructureAndOrganization(cleanedEssay: string, wordCount: number): DomainScore {
    const paragraphs = cleanedEssay.split("\n").filter(p => p.trim().length > 10).length;
    
    // **FIX**: More lenient scoring for shorter essays
    let score;
    if (paragraphs < 2) score = 4;
    else if (paragraphs < 3) score = 6;
    else if (paragraphs < 4) score = 8;
    else score = 10;

    const maxScore = 10;
    const weight = 20; // As per overallScore calculation (0.2)
    const percentage = (score / maxScore) * 100;
    const band = NSWEvaluationReportGenerator.getBand(score);
    const feedback: string[] = []; // Populate with actual feedback
    const specificExamples: string[] = []; // Populate with actual examples
    const childFriendlyExplanation = "This score shows how well your essay is organized with clear paragraphs and a good flow.";

    return {
      score: score,
      maxScore: maxScore,
      percentage: percentage,
      band: band,
      weight: weight,
      weightedScore: score * (weight / 100),
      feedback: feedback,
      specificExamples: specificExamples,
      childFriendlyExplanation: childFriendlyExplanation,
    };
  }

// Modify the scoreLanguageAndVocabulary function to return a DomainScore object
  private static scoreLanguageAndVocabulary(cleanedEssay: string): DomainScore {
    const words = cleanedEssay.split(/\s+/);
    const uniqueWords = new Set(words);
    const lexicalDensity = uniqueWords.size / words.length;
    
    // **FIX**: More lenient scoring for shorter essays
    let score;
    if (lexicalDensity > 0.6) score = 10;
    else if (lexicalDensity > 0.5) score = 8;
    else if (lexicalDensity > 0.4) score = 6;
    else score = 4;

    const maxScore = 10;
    const weight = 25; // As per overallScore calculation (0.25)
    const percentage = (score / maxScore) * 100;
    const band = NSWEvaluationReportGenerator.getBand(score);
    const feedback: string[] = []; // Populate with actual feedback
    const specificExamples: string[] = []; // Populate with actual examples
    const childFriendlyExplanation = "This score looks at how many different and interesting words you use, and how well you put them together.";

    return {
      score: score,
      maxScore: maxScore,
      percentage: percentage,
      band: band,
      weight: weight,
      weightedScore: score * (weight / 100),
      feedback: feedback,
      specificExamples: specificExamples,
      childFriendlyExplanation: childFriendlyExplanation,
    };
  }

// Modify the scoreSpellingAndGrammar function to return a DomainScore object
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

    const finalScore = score;
    const maxScore = 10;
    const weight = 15; // As per overallScore calculation (0.15)
    const percentage = (finalScore / maxScore) * 100;
    const band = NSWEvaluationReportGenerator.getBand(finalScore);
    const feedback: string[] = []; // Populate with actual feedback
    const specificExamples: string[] = []; // Populate with actual examples
    const childFriendlyExplanation = "This score checks your spelling and grammar to make sure your writing is clear and easy to read.";

    return {
      score: finalScore,
      maxScore: maxScore,
      percentage: percentage,
      band: band,
      weight: weight,
      weightedScore: finalScore * (weight / 100),
      feedback: feedback,
      specificExamples: specificExamples,
      childFriendlyExplanation: childFriendlyExplanation,
    };
  }
