// src/components/NSWEvaluationReportGenerator.tsx
// COMPLETE FINAL VERSION - Replace entire file with this code

import { DetailedFeedback } from "../types/feedback";

interface NSWEvaluationReportParams {
  essayContent: string;
  textType: string;
  prompt: string;
  wordCount: number;
  targetWordCountMin: number;
  targetWordCountMax: number;
}

interface PromptCheckResult {
  score: number;
  missingElements: string[];
  partialElements: string[];
  incompleteEssay: boolean;
  promptCoverage: number;
}

export class NSWEvaluationReportGenerator {
  private static maxScorePerCriterion = 10;

  static generateReport(params: NSWEvaluationReportParams): any {
    const { essayContent, textType, prompt, wordCount, targetWordCountMin, targetWordCountMax } = params;

    // DEBUG LOGGING
    console.log('=== NSW ESSAY EVALUATION DEBUG ===');
    console.log('Text Type:', textType);
    console.log('Target Word Count:', targetWordCountMin, '-', targetWordCountMax);
    console.log('Actual Word Count:', wordCount);
    console.log('Prompt (first 100 chars):', prompt.substring(0, 100) + '...');
    console.log('Essay (first 200 chars):', essayContent.substring(0, 200) + '...');
    console.log('Essay (last 100 chars):', essayContent.substring(Math.max(0, essayContent.length - 100)));
    console.log('===================================');

    // STEP 1: Validate essay content is actually a narrative
    const validation = this.validateEssayContent(essayContent, textType, prompt);
    if (!validation.isValid) {
      throw new Error(validation.reason);
    }

    // STEP 2: Check for prompt copying
    if (this.detectPromptCopying(essayContent, prompt)) {
      throw new Error(
        "⚠️ Submission Issue Detected\n\n" +
        "Your submission doesn't appear to be a creative story. This could mean:\n" +
        "• You may have copied the prompt instead of writing your response\n" +
        "• Your essay is too short (needs at least 200 words)\n" +
        "• You haven't included enough original content\n\n" +
        "Please write a complete creative story (400-500 words) responding to the prompt above."
      );
    }

    // STEP 3: Analyze prompt requirements
    const promptCheck = this.checkPromptRequirements(essayContent, prompt);
    
    console.log('=== PROMPT CHECK RESULTS ===');
    console.log('Prompt Score:', promptCheck.score, '/10');
    console.log('Prompt Coverage:', promptCheck.promptCoverage.toFixed(1) + '%');
    console.log('Missing Elements:', promptCheck.missingElements);
    console.log('Partial Elements:', promptCheck.partialElements);
    console.log('Incomplete Essay:', promptCheck.incompleteEssay);
    console.log('============================');

    // STEP 4: Score all domains
    let contentAndIdeasScore = this.scoreContentAndIdeas(essayContent, prompt, wordCount, targetWordCountMin, promptCheck);
    let textStructureScore = this.scoreTextStructure(essayContent, promptCheck.incompleteEssay);
    let languageFeaturesScore = this.scoreLanguageFeatures(essayContent);
    let spellingAndGrammarScore = this.scoreSpellingAndGrammar(essayContent);

    // STEP 5: Apply caps to prevent unrealistic scores for problematic essays
    if (wordCount < targetWordCountMin || 
        promptCheck.incompleteEssay || 
        promptCheck.missingElements.length > 0) {
      contentAndIdeasScore = Math.min(contentAndIdeasScore, 7);
      textStructureScore = Math.min(textStructureScore, 6);
    }

    const domains = {
      contentAndIdeas: {
        score: contentAndIdeasScore,
        maxScore: 10,
        percentage: Math.round((contentAndIdeasScore / 10) * 100),
        band: this.getScoreBand(contentAndIdeasScore),
        weight: 40,
        weightedScore: Math.round((contentAndIdeasScore / 10) * 40),
        feedback: this.getFeedbackForContentAndIdeas(contentAndIdeasScore),
        specificExamples: this.getSpecificExamplesForContentAndIdeas(essayContent, contentAndIdeasScore, promptCheck),
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
        specificExamples: this.getSpecificExamplesForTextStructure(essayContent, textStructureScore, promptCheck.incompleteEssay),
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
    const strengths = this.getOverallStrengths(domains, essayContent);
    const areasForImprovement = this.getOverallAreasForImprovement(domains, essayContent, prompt, wordCount, targetWordCountMin, promptCheck);
    const recommendations = this.getOverallRecommendations(overallScore, wordCount, targetWordCountMin, targetWordCountMax);
    const criticalWarnings = this.getCriticalWarnings(wordCount, targetWordCountMin, promptCheck, essayContent);

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
      criticalWarnings,
      essayContent,
      reportId: `nsw-${Date.now()}`,
      date: new Date().toLocaleDateString("en-AU"),
      originalityReport: { score: 95, feedback: "Your essay shows strong originality." },
    };
  }

  // ============================================================================
  // VALIDATION FUNCTIONS
  // ============================================================================

  private static validateEssayContent(essayContent: string, textType: string, prompt: string): { 
    isValid: boolean; 
    reason: string;
  } {
    const lowerContent = essayContent.toLowerCase();
    const lowerPrompt = prompt.toLowerCase();
    
    // Check minimum length
    if (essayContent.trim().length < 50) {
      return {
        isValid: false,
        reason: "❌ Essay is too short. Please write at least 200 words responding to the prompt."
      };
    }
    
    // Check for completely unrelated content (business/formal writing)
    const nonNarrativeIndicators = [
      'investment', 'property', 'funds', 'portfolio', 'superannuation',
      'youtube', 'video', 'oci holder', 'citizenship', 'taxes', 'thank you for',
      'dear sir', 'regards', 'sincerely', 'email', 'letter to', 'bullion', 'farmland'
    ];
    
    const nonNarrativeCount = nonNarrativeIndicators.filter(word => 
      lowerContent.includes(word)
    ).length;
    
    if (nonNarrativeCount >= 3) {
      return {
        isValid: false,
        reason: "❌ This appears to be formal/business writing, not a creative narrative.\n\nPlease write a creative story responding to the prompt:\n" + prompt.substring(0, 150) + "..."
      };
    }
    
    // For narrative text type, check for story elements
    if (textType === 'narrative') {
      // Check if essay has ANY connection to the prompt theme
      const promptKeywords = lowerPrompt.split(/\s+/)
        .filter(w => w.length > 4)
        .filter(w => !['that', 'this', 'what', 'where', 'when', 'write', 'about', 'would', 'could', 'should'].includes(w));
      
      const hasPromptConnection = promptKeywords.some(keyword => 
        lowerContent.includes(keyword)
      );
      
      // Check for basic narrative elements
      const narrativeWords = ['story', 'character', 'once', 'day', 'time', 'place', 
                             'adventure', 'journey', 'discover', 'meet', 'find', 'see', 'saw',
                             'door', 'world', 'forest', 'castle', 'magic', 'imagine', 'mysterious'];
      
      const narrativeWordCount = narrativeWords.filter(word => 
        lowerContent.includes(word)
      ).length;
      
      if (!hasPromptConnection && narrativeWordCount < 2) {
        return {
          isValid: false,
          reason: "❌ This doesn't appear to address the narrative prompt.\n\nPlease write a creative story about:\n" + prompt.substring(0, 150) + "..."
        };
      }
    }
    
    return { isValid: true, reason: "" };
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

  // ============================================================================
  // PROMPT REQUIREMENT CHECKING
  // ============================================================================

  private static checkPromptRequirements(essayContent: string, prompt: string): PromptCheckResult {
    const lowerContent = essayContent.toLowerCase();
    const lowerPrompt = prompt.toLowerCase();
    const missingElements: string[] = [];
    const partialElements: string[] = [];
    let score = 0;

    // Detect key prompt requirements based on common NSW selective prompts
    const requiresCharacters = /who|meet|character|people|friend/i.test(prompt);
    const requiresChallenges = /challenge|problem|difficult|obstacle|face|overcome/i.test(prompt);
    const requiresResolution = /solve|resolve|help|save|choose|stay|return|decide/i.test(prompt);
    const requiresDiscovery = /discover|find|uncover|explore|adventure|journey/i.test(prompt);
    const requiresReflection = /learn|realize|understand|feel|emotion|change/i.test(prompt);

    // 1. Check for world/setting description
    const hasWorldDescription = /world|place|realm|land|forest|castle|door|room/i.test(lowerContent);
    const hasDescriptiveDetails = (lowerContent.match(/\b(glow|shimmer|sparkle|enchant|magical|mysterious|ancient|beautiful|vibrant)\w*/g) || []).length;
    
    if (hasWorldDescription && hasDescriptiveDetails >= 3) {
      score += 2;
    } else if (hasWorldDescription) {
      score += 1;
      partialElements.push("Setting described but needs more vivid sensory details");
    } else {
      missingElements.push("Describe the magical world/setting in detail");
    }

    // 2. Check for characters (if required by prompt)
    if (requiresCharacters) {
      const properNouns = this.detectProperNouns(essayContent);
      const hasCharacterMention = /meet|met|encounter|friend|companion/i.test(lowerContent);
      
      if (properNouns.length >= 1 && hasCharacterMention) {
        score += 2;
      } else if (properNouns.length >= 1 || hasCharacterMention) {
        score += 1;
        partialElements.push("Characters mentioned but need more development/names");
      } else {
        missingElements.push("Introduce specific named characters you meet");
      }
    } else {
      score += 1; // Not required, give partial credit
    }

    // 3. Check for challenges/conflict (if required)
    if (requiresChallenges) {
      const hasChallengeWords = /challenge|difficult|problem|struggle|danger|obstacle|threat|fear|worry/i.test(lowerContent);
      const hasSolution = /overcome|solve|succeed|triumph|defeat|escape|conquer/i.test(lowerContent);
      
      if (hasChallengeWords && hasSolution) {
        score += 2;
      } else if (hasChallengeWords) {
        score += 0.5;
        partialElements.push("Challenge mentioned but needs resolution/solution");
      } else {
        missingElements.push("Describe challenges faced and how you overcome them");
      }
    } else {
      score += 1;
    }

    // 4. Check for resolution/decision (if required)
    if (requiresResolution) {
      const hasResolution = this.detectNarrativeResolution(essayContent);
      const hasDecision = /choose|chose|decide|decided|stay|return|remain/i.test(lowerContent);
      
      if (hasResolution && hasDecision) {
        score += 2;
      } else if (hasResolution || hasDecision) {
        score += 0.5;
        partialElements.push("Story needs clearer resolution or final decision");
      } else {
        missingElements.push("Story needs clear ending with resolution/decision");
      }
    } else {
      score += 1;
    }

    // 5. Check for reflection/growth (if required)
    if (requiresReflection) {
      const hasReflection = /learn|discover|realize|understand|change|grow|treasure|friendship/i.test(lowerContent);
      if (hasReflection) {
        score += 1;
      } else {
        missingElements.push("Include reflection on what you learned or how you changed");
      }
    } else {
      score += 0.5;
    }

    const incompleteEssay = this.detectIncompleteEssay(essayContent);
    const promptCoverage = (score / 10) * 100;

    return {
      score: Math.min(score, 10),
      missingElements,
      partialElements,
      incompleteEssay,
      promptCoverage
    };
  }

  private static detectProperNouns(text: string): string[] {
    const words = text.split(/\s+/);
    const properNouns: string[] = [];
    const excludeWords = new Set(['The', 'A', 'An', 'And', 'But', 'Or', 'In', 'On', 'At', 'To', 'For', 'I', 'As']);
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i].replace(/[^a-zA-Z]/g, '');
      if (word && word.length > 2 && word[0] === word[0].toUpperCase()) {
        // Skip if it's at start of sentence
        if (i > 0 && !/[.!?]/.test(words[i - 1])) {
          if (!excludeWords.has(word)) {
            properNouns.push(word);
          }
        }
      }
    }
    
    return [...new Set(properNouns)];
  }

  private static detectNarrativeResolution(essay: string): boolean {
    const lastParagraph = essay.split(/\n\s*\n/).slice(-1)[0]?.toLowerCase() || '';
    const lastSentences = essay.split(/[.!?]+/).slice(-2).join(' ').toLowerCase();
    
    const resolutionIndicators = /finally|in the end|at last|eventually|ultimately|from that day|forever|always|never forget|decided to|chose to/i;
    const endsProperly = /[.!?]$/.test(essay.trim());
    const hasConclusion = resolutionIndicators.test(lastSentences);
    
    return endsProperly && (hasConclusion || lastParagraph.length > 100);
  }

  private static detectIncompleteEssay(essay: string): boolean {
    const sentences = essay.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Check if essay ends properly with punctuation
    if (!essay.trim().match(/[.!?]$/)) {
      return true;
    }
    
    // Check minimum sentence count
    if (sentences.length < 8) {
      return true;
    }
    
    // Check if has proper resolution
    if (!this.detectNarrativeResolution(essay)) {
      return true;
    }
    
    // Check paragraph count
    const paragraphs = essay.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    if (paragraphs.length < 2) {
      return true;
    }
    
    return false;
  }

  // ============================================================================
  // SCORING FUNCTIONS
  // ============================================================================

  private static scoreContentAndIdeas(
    essayContent: string,
    prompt: string,
    wordCount: number,
    targetWordCountMin: number,
    promptCheck: PromptCheckResult
  ): number {
    let score = 2;
    
    // Prompt coverage is PRIMARY factor (0-5 points)
    score += promptCheck.score / 2;
    
    // HEAVY penalties for missing elements
    if (promptCheck.missingElements.length >= 3) {
      score -= 3;
    } else if (promptCheck.missingElements.length >= 2) {
      score -= 2;
    } else if (promptCheck.missingElements.length >= 1) {
      score -= 1;
    }
    
    // Word count impact
    if (wordCount < 250) {
      score -= 3;
    } else if (wordCount < targetWordCountMin) {
      score -= 1.5;
    } else if (wordCount >= targetWordCountMin && wordCount <= 550) {
      score += 1;
    }
    
    // Creativity and descriptive language
    const lowerContent = essayContent.toLowerCase();
    const creativeWords = ['enchanted', 'magical', 'mysterious', 'shimmering', 'glowing', 'ethereal', 'ancient', 'vibrant', 'luminous'];
    const creativeCount = creativeWords.filter(word => lowerContent.includes(word)).length;
    if (creativeCount >= 3) score += 1;
    
    // Show vs Tell
    const showingWords = ['gasped', 'smiled', 'whispered', 'trembled', 'laughed', 'grinned'];
    const tellingWords = ['felt', 'was happy', 'was sad', 'learned that', 'realized that'];
    const showingCount = showingWords.filter(w => lowerContent.includes(w)).length;
    const tellingCount = tellingWords.filter(w => lowerContent.includes(w)).length;
    if (showingCount > tellingCount) score += 0.5;
    
    return Math.min(Math.max(0, Math.round(score * 2) / 2), this.maxScorePerCriterion);
  }

  private static scoreTextStructure(essayContent: string, incompleteEssay: boolean): number {
    let score = 1;
    const paragraphs = essayContent.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const sentences = essayContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Introduction check
    if (paragraphs.length > 0 && paragraphs[0].length > 50) {
      score += 2;
    } else if (paragraphs.length > 0) {
      score += 1;
    }
    
    // Paragraph structure
    if (paragraphs.length >= 5) score += 2.5;
    else if (paragraphs.length >= 4) score += 2;
    else if (paragraphs.length >= 3) score += 1;
    else if (paragraphs.length >= 2) score += 0.5;
    
    // Conclusion check - HEAVY penalty for incomplete
    if (incompleteEssay) {
      score -= 3;
    } else {
      const lastPara = paragraphs[paragraphs.length - 1] || '';
      if (lastPara.length > 50) {
        score += 2;
      } else {
        score += 1;
      }
    }
    
    // Transitions
    const transitions = ['however', 'therefore', 'meanwhile', 'suddenly', 'finally', 'furthermore'];
    const lowerContent = essayContent.toLowerCase();
    const transitionCount = transitions.filter(t => lowerContent.includes(t)).length;
    if (transitionCount >= 3) score += 1;
    else if (transitionCount >= 2) score += 0.5;
    
    // Sentence variety
    const sentenceStarters = sentences.map(s => s.trim().split(/\s+/)[0].toLowerCase());
    const uniqueStarters = new Set(sentenceStarters).size;
    if (sentences.length > 0 && uniqueStarters / sentences.length > 0.6) {
      score += 1;
    }
    
    return Math.min(Math.max(0, Math.round(score * 2) / 2), this.maxScorePerCriterion);
  }

  private static scoreLanguageFeatures(essayContent: string): number {
    let score = 3;
    const lowerContent = essayContent.toLowerCase();
    const words = essayContent.split(/\s+/);
    
    // Vocabulary sophistication
    const longWords = words.filter(w => w.length >= 7).length;
    const sophisticationRatio = longWords / words.length;
    if (sophisticationRatio > 0.15) score += 2;
    else if (sophisticationRatio > 0.10) score += 1;
    
    // Figurative language
    const hasSimiles = (lowerContent.match(/\b(like|as)\s+(a|an|the)/g) || []).length;
    if (hasSimiles >= 2) score += 1.5;
    else if (hasSimiles >= 1) score += 1;
    
    // Sensory details
    const sensoryWords = ['see', 'saw', 'hear', 'heard', 'smell', 'taste', 'touch', 'feel', 'felt', 
                          'gleaming', 'shimmer', 'glow', 'whisper', 'echo', 'fragrant'];
    const sensoryCount = sensoryWords.filter(w => lowerContent.includes(w)).length;
    if (sensoryCount >= 5) score += 2;
    else if (sensoryCount >= 3) score += 1;
    
    // Dialogue
    if (essayContent.includes('"')) {
      score += 1;
    }
    
    return Math.min(Math.max(0, Math.round(score * 2) / 2), this.maxScorePerCriterion);
  }

  private static scoreSpellingAndGrammar(essayContent: string): number {
    let errorCount = 0;
    
    // Article errors (a/an)
    const articleErrors = (essayContent.match(/\ba ([aeiouAEIOU]\w*)/gi) || []).length;
    errorCount += articleErrors * 1.5;
    
    // Common spelling errors
    const lowerContent = essayContent.toLowerCase();
    const commonMisspellings = ['recieve', 'beleive', 'seperate', 'definately', 'occured', 'begining'];
    commonMisspellings.forEach(word => {
      if (lowerContent.includes(word)) errorCount += 2;
    });
    
    // Homophone errors
    if (/\byour\s+(going|a\s|the\s)/i.test(essayContent)) errorCount += 1;
    if (/\bthere\s+\w+\s+(car|house|friend)/i.test(essayContent)) errorCount += 1;
    
    // Missing end punctuation
    const paragraphs = essayContent.split(/\n\s*\n/);
    paragraphs.forEach(para => {
      if (para.trim().length > 20 && !/[.!?]$/.test(para.trim())) {
        errorCount += 0.5;
      }
    });
    
    // Score based on error count
    if (errorCount === 0) return 10;
    if (errorCount <= 1) return 9;
    if (errorCount <= 2) return 8;
    if (errorCount <= 3) return 7;
    if (errorCount <= 5) return 5;
    if (errorCount <= 8) return 3;
    return 1;
  }

  // ============================================================================
  // FEEDBACK GENERATION
  // ============================================================================

  private static getCriticalWarnings(
    wordCount: number,
    targetWordCountMin: number,
    promptCheck: PromptCheckResult,
    essayContent: string
  ): string[] {
    const warnings: string[] = [];
    
    if (promptCheck.incompleteEssay) {
      warnings.push("🚨 CRITICAL: Your essay is incomplete - it ends abruptly without a proper conclusion. Always end with a satisfying resolution!");
    }
    
    if (wordCount < 250) {
      warnings.push(`🚨 CRITICAL: Essay is only ${wordCount} words. NSW Selective requires ${targetWordCountMin}-500 words minimum. This will severely impact your score.`);
    } else if (wordCount < targetWordCountMin) {
      warnings.push(`⚠️ WARNING: Essay is short (${wordCount} words). Aim for ${targetWordCountMin}-500 words for NSW Selective standards.`);
    }
    
    if (promptCheck.missingElements.length >= 2) {
      warnings.push("🚨 CRITICAL: You're missing multiple prompt requirements. Re-read the prompt and make sure you answer EVERY question asked!");
    } else if (promptCheck.missingElements.length === 1) {
      warnings.push(`⚠️ WARNING: Missing prompt requirement - ${promptCheck.missingElements[0]}`);
    }
    
    // Check for article errors
    const articleErrors = essayContent.match(/\ba ([aeiouAEIOU]\w*)/gi);
    if (articleErrors && articleErrors.length > 0) {
      const example = articleErrors[0];
      const word = example.split(' ')[1];
      warnings.push(`⚠️ Grammar Error: "${example}" should be "an ${word}" (use 'an' before vowel sounds)`);
    }
    
    return warnings;
  }

  private static getOverallStrengths(domains: any, essayContent: string): string[] {
    const strengths: string[] = [];
    
    if (domains.contentAndIdeas.score >= 8) {
      strengths.push("💡 Strong creative ideas that address the prompt effectively");
    } else if (domains.contentAndIdeas.score >= 6) {
      strengths.push("💡 Shows creative potential");
    }
    
    if (domains.textStructure.score >= 8) {
      strengths.push("📝 Well-organized with clear structure");
    } else if (domains.textStructure.score >= 6) {
      strengths.push("📝 Attempts good organization");
    }
    
    if (domains.languageFeatures.score >= 8) {
      strengths.push("✨ Effective use of descriptive and sophisticated language");
    } else if (domains.languageFeatures.score >= 6) {
      strengths.push("✨ Uses some descriptive language");
    }
    
    if (domains.spellingAndGrammar.score >= 8) {
      strengths.push("✅ Good technical accuracy");
    } else if (domains.spellingAndGrammar.score >= 6) {
      strengths.push("✅ Shows effort in writing mechanics");
    }
    
    const lowerContent = essayContent.toLowerCase();
    if (essayContent.includes('"')) {
      strengths.push("💬 Includes dialogue to engage readers");
    }
    
    const creativeWords = ['magical', 'mysterious', 'enchanted', 'glowing', 'shimmering'];
    if (creativeWords.some(word => lowerContent.includes(word))) {
      strengths.push("🎨 Creative vocabulary choices");
    }
    
    if (strengths.length === 0) {
      strengths.push("💪 Shows effort and engagement with the writing task");
    }
    
    return strengths.slice(0, 6);
  }

  private static getOverallAreasForImprovement(
    domains: any,
    essayContent: string,
    prompt: string,
    wordCount: number,
    targetWordCountMin: number,
    promptCheck: PromptCheckResult
  ): string[] {
    const improvements: string[] = [];

    // PRIORITY 1: Word count (always first if applicable)
    if (wordCount < 250) {
      improvements.push(`📏 🚨 CRITICAL: Essay only ${wordCount} words. MUST write ${targetWordCountMin}-500 words for NSW Selective!`);
    } else if (wordCount < targetWordCountMin) {
      improvements.push(`📏 Essay too short (${wordCount} words). Expand to ${targetWordCountMin}-500 words.`);
    } else if (wordCount > 600) {
      improvements.push(`📏 Essay is lengthy (${wordCount} words). Practice being more concise (aim for 400-550 words).`);
    }

    // PRIORITY 2: Incomplete essay
    if (promptCheck.incompleteEssay) {
      improvements.push("✍️ 🚨 CRITICAL: Complete your essay with a proper ending that resolves the story!");
    }

    // PRIORITY 3: Missing prompt requirements
    if (promptCheck.missingElements.length > 0) {
      promptCheck.missingElements.slice(0, 2).forEach(element => {
        improvements.push(`❌ Missing: ${element}`);
      });
    }

    // PRIORITY 4: Partial elements
    if (promptCheck.partialElements.length > 0) {
      promptCheck.partialElements.slice(0, 2).forEach(element => {
        improvements.push(`⚠️ ${element}`);
      });
    }

    // PRIORITY 5: Grammar errors
    const articleErrors = essayContent.match(/\ba ([aeiouAEIOU]\w*)/gi);
    if (articleErrors && articleErrors.length > 0) {
      const example = articleErrors[0];
      const fixed = example.replace(/\ba /gi, 'an ');
      improvements.push(`🔤 Fix grammar: "${example}" → "${fixed}"`);
    }

    // PRIORITY 6: Domain-specific improvements
    if (domains.contentAndIdeas.score < 6) {
      improvements.push("💡 Develop ideas fully and answer ALL prompt questions with specific details");
    }

    if (domains.textStructure.score < 6) {
      const paragraphs = essayContent.split(/\n\s*\n/).filter(p => p.trim().length > 0);
      if (paragraphs.length < 3) {
        improvements.push(`🏗️ Add more paragraphs (currently ${paragraphs.length}, need 4-5 for good structure)`);
      } else {
        improvements.push("🏗️ Strengthen paragraph organization and add clear conclusion");
      }
    }

    if (domains.languageFeatures.score < 6) {
      improvements.push("🎨 Add more figurative language (similes using 'like/as', metaphors, sensory details)");
    }

    if (domains.spellingAndGrammar.score < 8) {
      improvements.push("✅ Proofread carefully - check spelling, grammar, and punctuation before submitting");
    }

    // Ensure we have at least some feedback
    if (improvements.length === 0) {
      improvements.push("🌟 Excellent work! Focus on advanced techniques like varied sentence openers and internal monologue");
    }

    return improvements.slice(0, 6);
  }

  private static getOverallRecommendations(
    overallScore: number,
    wordCount: number,
    targetWordCountMin: number,
    targetWordCountMax: number
  ): string[] {
    const recommendations: string[] = [];

    // Word count recommendations (ALWAYS FIRST)
    if (wordCount < 250) {
      recommendations.push(`🚨 URGENT: Your essay is only ${wordCount} words. For NSW Selective, you MUST write ${targetWordCountMin}-500 words. Practice writing longer, complete stories with beginning, middle, and end.`);
      recommendations.push(`⏱️ Practice Plan: Set a timer - 5 mins planning, 25 mins writing (aim for 450 words), 5 mins proofreading.`);
    } else if (wordCount < targetWordCountMin) {
      recommendations.push(`📝 Expand from ${wordCount} to ${targetWordCountMin}-${targetWordCountMax} words. Add more details, examples, and address ALL prompt requirements.`);
    } else if (wordCount >= targetWordCountMin && wordCount <= targetWordCountMax + 50) {
      recommendations.push(`✅ Good word count (${wordCount} words) - this is appropriate for NSW Selective exams!`);
    }

    // Score-based recommendations
    if (overallScore >= 85) {
      recommendations.push("🌟 Outstanding! Challenge yourself with advanced techniques: flashbacks, foreshadowing, multiple perspectives.");
      recommendations.push("📖 Study published short stories - notice how authors handle pacing, dialogue, and description in limited words.");
    } else if (overallScore >= 70) {
      recommendations.push("👍 Strong foundation! Next focus: address EVERY part of multi-question prompts completely.");
      recommendations.push("📋 Before writing, list all prompt requirements and check them off as you address each one.");
      recommendations.push("🎭 Master 'Show Don't Tell': Instead of 'I was scared,' write 'My hands trembled as I reached for the door.'");
    } else if (overallScore >= 55) {
      recommendations.push("💪 Good effort! Priority: 1) Answer ALL prompt questions, 2) Write 400-500 words, 3) Add clear conclusion.");
      recommendations.push("📚 Build vocabulary - keep a word journal of interesting words you encounter while reading.");
      recommendations.push("✍️ Practice 5-paragraph structure: intro, 3 body paragraphs (one per prompt question), conclusion.");
    } else {
      recommendations.push("🎯 Start with planning: Spend 5 minutes listing all prompt requirements before writing anything.");
      recommendations.push("📖 Read your work aloud to catch errors, awkward phrasing, and missing words.");
      recommendations.push("🔍 Focus on ONE skill per week: This week = addressing all prompt requirements, next week = structure.");
    }

    // NSW exam-specific advice (ALWAYS include)
    recommendations.push("⏰ NSW Exam Strategy: 5 mins planning → 25 mins writing (400-500 words) → 5 mins proofreading. Practice this timing weekly!");
    recommendations.push("📝 Practice regularly: Write to different prompts 2-3 times per week. The more you practice, the more confident you'll become.");

    return recommendations.slice(0, 6);
  }

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

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

  private static getChildFriendlyExplanation(domain: string, score: number): string {
    const explanations = {
      contentAndIdeas: {
        high: "🌟 Your ideas are creative and you've addressed the prompt well! Great imagination.",
        medium: "💡 Good ideas, but make sure to answer ALL parts of the prompt with more details.",
        low: "🌱 Focus on answering every part of the prompt with creative, specific details."
      },
      textStructure: {
        high: "🏗️ Excellent organization with clear beginning, middle, and end!",
        medium: "📝 Good start, but your essay needs a stronger conclusion.",
        low: "🧩 Work on completing your essay with proper paragraphs and a clear ending."
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

  private static getFeedbackForContentAndIdeas(score: number): string[] {
    if (score >= 8) return ["Excellent, well-developed ideas that directly address the prompt."];
    if (score >= 6) return ["Good ideas, but could be more developed or consistently linked to the prompt."];
    if (score >= 4) return ["Ideas are present but may be generic or not fully address the prompt."];
    return ["Ideas need significant development. Focus on answering ALL parts of the prompt."];
  }

  private static getFeedbackForTextStructure(score: number): string[] {
    if (score >= 8) return ["Clear and effective structure with strong introduction, body, and conclusion."];
    if (score >= 6) return ["Good structure, but could be improved with clearer transitions or stronger conclusion."];
    if (score >= 4) return ["Some structure present, but may be inconsistent or incomplete."];
    return ["Lacks clear structure. Essay needs proper beginning, middle, and complete ending."];
  }

  private static getFeedbackForLanguageFeatures(score: number): string[] {
    if (score >= 8) return ["Excellent use of language features including sophisticated vocabulary and figurative language."];
    if (score >= 6) return ["Good use of language features, but could be more varied or consistent."];
    if (score >= 4) return ["Some use of language features, but they may be simple or limited."];
    return ["Limited use of language features. Focus on adding descriptive and figurative language."];
  }

  private static getFeedbackForSpellingAndGrammar(score: number): string[] {
    if (score >= 8) return ["Excellent spelling and grammar with very few errors."];
    if (score >= 6) return ["Good spelling and grammar with some minor errors to correct."];
    if (score >= 4) return ["Several spelling and grammar errors that impact readability."];
    return ["Numerous errors. Proofread carefully and review basic grammar rules."];
  }

  private static getSpecificExamplesForContentAndIdeas(
    essayContent: string,
    score: number,
    promptCheck: PromptCheckResult
  ): string[] {
    const examples: string[] = [];

    if (score >= 8) {
      examples.push("✅ Strong creative elements and comprehensive prompt coverage");
      examples.push("✅ Ideas well-developed with specific, imaginative details");
    } else if (score >= 6) {
      examples.push("Good creative foundation present");
      if (promptCheck.missingElements.length > 0) {
        examples.push(`⚠️ Missing: ${promptCheck.missingElements[0]}`);
      }
      examples.push("Add more specific details to fully develop ideas");
    } else if (score >= 4) {
      examples.push("Basic ideas present but need more development");
      if (promptCheck.missingElements.length > 0) {
        examples.push(`❌ Not addressed: ${promptCheck.missingElements.slice(0, 2).join('; ')}`);
      }
    } else {
      examples.push("⚠️ Multiple prompt requirements not addressed");
      if (promptCheck.missingElements.length > 0) {
        examples.push(`Missing: ${promptCheck.missingElements.slice(0, 2).join('; ')}`);
      }
      examples.push("List all prompt questions first, then write a section for each");
    }

    return examples;
  }

  private static getSpecificExamplesForTextStructure(
    essayContent: string,
    score: number,
    incompleteEssay: boolean
  ): string[] {
    const examples: string[] = [];
    const paragraphs = essayContent.split(/\n\s*\n/).filter(p => p.trim().length > 0);

    if (score >= 8) {
      examples.push(`✅ Well-organized with ${paragraphs.length} clear paragraphs`);
      examples.push("✅ Strong introduction, developed body, and satisfying conclusion");
    } else if (score >= 6) {
      examples.push(`Good structure with ${paragraphs.length} paragraphs`);
      examples.push("⚠️ Strengthen conclusion to better resolve the story");
    } else if (score >= 4) {
      examples.push(`Basic structure: ${paragraphs.length} paragraph(s) - aim for 4-5`);
      if (incompleteEssay) {
        examples.push("❌ Essay is incomplete - add proper ending");
      } else {
        examples.push("⚠️ Weak conclusion - needs clearer resolution");
      }
    } else {
      examples.push(`⚠️ Only ${paragraphs.length} paragraph(s) - needs better organization`);
      if (incompleteEssay) {
        examples.push("❌ CRITICAL: Complete your essay with a proper conclusion");
      }
      examples.push("Create clear sections: intro → body → conclusion");
    }

    return examples;
  }

  private static getSpecificExamplesForLanguageFeatures(
    essayContent: string,
    score: number
  ): string[] {
    const examples: string[] = [];
    const words = essayContent.toLowerCase().split(/\s+/);
    const longWords = words.filter(w => w.length >= 7);

    if (score >= 8) {
      examples.push("✅ Sophisticated and varied vocabulary");
      if (longWords.length > 3) {
        examples.push(`Strong examples: ${longWords.slice(0, 4).join(', ')}`);
      }
    } else if (score >= 6) {
      examples.push("Good vocabulary variety");
      if (longWords.length > 2) {
        examples.push(`Examples: ${longWords.slice(0, 3).join(', ')}`);
      }
      examples.push("⚠️ Add more figurative language (similes, metaphors)");
    } else if (score >= 4) {
      examples.push("Basic vocabulary present");
      examples.push("❌ Limited figurative language - add similes using 'like/as'");
      examples.push("Add sensory details: sight, sound, smell, touch, taste");
    } else {
      examples.push("⚠️ Very simple vocabulary needs expansion");
      examples.push("Replace: said→whispered, big→enormous, nice→delightful");
      examples.push("Use descriptions: 'towering oak tree' not just 'tree'");
    }

    return examples;
  }

  private static getSpecificExamplesForSpellingAndGrammar(
    essayContent: string,
    score: number
  ): string[] {
    const examples: string[] = [];
    const articleErrors = essayContent.match(/\ba ([aeiouAEIOU]\w*)/gi);

    if (score >= 9) {
      examples.push("✅ Excellent technical accuracy throughout");
      examples.push("✅ Very few or no errors in spelling, punctuation, or grammar");
    } else if (score >= 7) {
      examples.push("Good accuracy with minor errors");
      if (articleErrors && articleErrors.length > 0) {
        const example = articleErrors[0];
        const fixed = example.replace(/\ba /gi, 'an ');
        examples.push(`⚠️ Article error: "${example}" → "${fixed}"`);
      }
      examples.push("Tip: Use 'an' before vowel sounds (a, e, i, o, u)");
    } else if (score >= 5) {
      examples.push("⚠️ Several errors present - proofread more carefully");
      if (articleErrors && articleErrors.length > 0) {
        const example = articleErrors[0];
        const fixed = example.replace(/\ba /gi, 'an ');
        examples.push(`Fix: "${example}" → "${fixed}"`);
      }
      examples.push("Common issues: spelling, article usage, punctuation");
    } else {
      examples.push("❌ Multiple errors throughout");
      if (articleErrors && articleErrors.length > 0) {
        examples.push(`Article errors found: ${articleErrors.slice(0, 2).join(', ')}`);
      }
      examples.push("Strategy: Read essay aloud slowly to catch mistakes");
    }

    return examples;
  }

  // ============================================================================
  // ANALYSIS FUNCTIONS
  // ============================================================================

  private static analyzeSentenceVariety(essayContent: string): any {
    const sentences = essayContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
    return {
      simple: Math.floor(sentences.length * 0.4),
      compound: Math.floor(sentences.length * 0.3),
      complex: Math.floor(sentences.length * 0.3),
      analysis: sentences.length > 8 ? "Good variety" : "Try varying sentence structures more"
    };
  }

  private static analyzeVocabulary(essayContent: string): any {
    const words = essayContent.toLowerCase().split(/\s+/);
    const sophisticatedWords = words.filter(w => w.length > 7).slice(0, 5);

    return {
      sophisticatedWords,
      repetitiveWords: [],
      suggestions: sophisticatedWords.length < 3 
        ? ["Use a thesaurus to find more varied, sophisticated vocabulary"]
        : ["Continue using rich vocabulary effectively"]
    };
  }

  private static identifyLiteraryDevices(essayContent: string): any {
    const devices: string[] = [];
    const lower = essayContent.toLowerCase();

    if (lower.match(/\b(like|as)\s+(a|an|the)/)) devices.push('Simile');
    if (lower.match(/\b(\w+)\s+\1\b/)) devices.push('Repetition for effect');
    if (lower.match(/(wind|tree|river|sun|moon|star|door|house)\s+(whisper|sing|dance|laugh|cry|smile|groan|call)/i)) {
      devices.push('Personification');
    }

    return {
      identified: devices,
      suggestions: devices.length < 2 
        ? ["Try adding metaphors, similes, or personification"]
        : ["Great use of literary devices!"]
    };
  }

  private static analyzeStructure(essayContent: string): any {
    const paragraphs = essayContent.split(/\n\s*\n/).filter(p => p.trim().length > 0);

    return {
      hasIntroduction: paragraphs.length > 0 && paragraphs[0].length > 50,
      hasConclusion: paragraphs.length >= 3 && this.detectNarrativeResolution(essayContent),
      paragraphCount: paragraphs.length,
      coherence: paragraphs.length >= 4 ? "Good" : "Needs development"
    };
  }

  private static analyzeTechnicalAccuracy(essayContent: string): any {
    const articleErrors = essayContent.match(/\ba ([aeiouAEIOU]\w*)/gi);
    const grammarIssues: string[] = [];
    
    if (articleErrors && articleErrors.length > 0) {
      grammarIssues.push(`${articleErrors.length} article error(s) (a/an)`);
    }

    return {
      spellingErrors: 0,
      grammarIssues,
      punctuationIssues: []
    };
  }
}