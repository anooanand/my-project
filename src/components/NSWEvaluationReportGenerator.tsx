import React, { useState } from 'react';
import { FileText, Download, Award, BarChart3, CheckCircle, AlertCircle, Target, Lightbulb } from 'lucide-react';

interface EvaluationReport {
  overallScore: number;
  overallGrade: string;
  domains: {
    contentAndIdeas: DomainScore;
    textStructure: DomainScore;
    languageFeatures: DomainScore;
    spellingAndGrammar: DomainScore;
  };
  detailedFeedback: DetailedFeedback;
  recommendations: PersonalizedRecommendation[];
  strengths: SpecificStrength[];
  areasForImprovement: SpecificImprovement[];
  essayContent: string; // ENHANCED: Include the student's actual essay in the report
  childFriendlyExplanations: ChildFriendlyExplanations; // NEW: Child-friendly rubric explanations
  promptSimilarityWarning?: string; // NEW: Warning for prompt copying
  relevancyScore?: number; // NEW: Relevancy score
  relevancyFeedback?: string[]; // NEW: Relevancy feedback
}

interface DomainScore {
  score: number;
  maxScore: number;
  percentage: number;
  band: string;
  weight: number;
  weightedScore: number;
  feedback: string[];
  specificExamples: string[];
  childFriendlyExplanation: string; // ENHANCED: Child-friendly rubric explanations
  concreteExamples: string[]; // NEW: Specific examples from the student's text
  actionableSuggestions: string[]; // NEW: Specific, actionable improvement suggestions
}

interface DetailedFeedback {
  wordCount: number;
  sentenceVariety: {
    simple: number;
    compound: number;
    complex: number;
    analysis: string;
  };
  vocabularyAnalysis: {
    sophisticatedWords: string[];
    repetitiveWords: string[];
    suggestions: string[];
  };
  literaryDevices: {
    identified: string[];
    suggestions: string[];
  };
  structuralElements: {
    hasIntroduction: boolean;
    hasConclusion: boolean;
    paragraphCount: number;
    coherence: string;
  };
  technicalAccuracy: {
    spellingErrors: number;
    grammarIssues: string[];
    punctuationIssues: string[];
    specificErrors: SpecificError[]; // NEW: Detailed error analysis
  };
}

// NEW: Enhanced interfaces for better feedback
interface PersonalizedRecommendation {
  title: string;
  description: string;
  examples: string[];
  priority: 'high' | 'medium' | 'low';
}

interface SpecificStrength {
  area: string;
  description: string;
  textExample?: string;
  encouragement: string;
}

interface SpecificImprovement {
  area: string;
  issue: string;
  suggestion: string;
  concreteExample?: string;
  textReference?: string;
}

interface SpecificError {
  type: 'spelling' | 'grammar' | 'punctuation';
  location: string;
  error: string;
  correction: string;
  explanation: string;
}

interface ChildFriendlyExplanations {
  ideasContent: string;
  structure: string;
  language: string;
  grammar: string;
}

export class NSWEvaluationReportGenerator {
  
  static generateReport(params: {
    essayContent: string;
    textType: string;
    prompt: string;
    wordCount: number;
    targetWordCountMin: number;
    targetWordCountMax: number;
  }): EvaluationReport {
    console.log("NSWEvaluationReportGenerator.generateReport called with params:", params);
    const { essayContent, textType, prompt, wordCount, targetWordCountMin, targetWordCountMax } = params;
    
    // Basic validation
    if (!essayContent || essayContent.trim().length === 0) {
      throw new Error("Essay content cannot be empty");
    }
    
    // NEW: Check for prompt similarity/copying
    const promptSimilarity = this.calculatePromptSimilarity(essayContent, prompt);
    let promptSimilarityWarning: string | undefined;
    
    if (promptSimilarity.isHighlySimilar) {
      // If the essay is essentially the same as the prompt, return minimal scores
      return this.generateMinimalScoreReport(essayContent, promptSimilarity.explanation);
    } else if (promptSimilarity.isModeratelySimilar) {
      promptSimilarityWarning = promptSimilarity.explanation;
    }
    
    const analysis = this.analyzeEssay(essayContent);
    
    // Calculate relevancy score
    const relevancy = this.assessRelevancy(essayContent, prompt);
    
    // Score each domain according to NSW criteria with enhanced feedback
    const contentAndIdeas = this.scoreContentAndIdeas(essayContent, analysis, "Content & Ideas", relevancy.score);
    const textStructure = this.scoreTextStructure(essayContent, analysis, "Text Structure");
    const languageFeatures = this.scoreLanguageFeatures(essayContent, analysis, "Language Features");
    const spellingAndGrammar = this.scoreSpellingAndGrammar(essayContent, analysis, "Spelling & Grammar");
    
    // Calculate overall score
    const overallScore = Math.round(
      contentAndIdeas.weightedScore +
      textStructure.weightedScore +
      languageFeatures.weightedScore +
      spellingAndGrammar.weightedScore
    );
    
    const overallGrade = this.getOverallGrade(overallScore);
    
    // Generate enhanced feedback components
    const personalizedRecommendations = this.generatePersonalizedRecommendations(
      contentAndIdeas, textStructure, languageFeatures, spellingAndGrammar, essayContent
    );
    
    const specificStrengths = this.identifySpecificStrengths(
      contentAndIdeas, textStructure, languageFeatures, spellingAndGrammar, essayContent
    );
    
    const specificImprovements = this.identifySpecificImprovements(
      contentAndIdeas, textStructure, languageFeatures, spellingAndGrammar, essayContent
    );
    
    const childFriendlyExplanations = this.generateChildFriendlyExplanations(
      contentAndIdeas, textStructure, languageFeatures, spellingAndGrammar
    );
    
    return {
      overallScore,
      overallGrade,
      domains: {
        contentAndIdeas,
        textStructure,
        languageFeatures,
        spellingAndGrammar
      },
      detailedFeedback: analysis,
      recommendations: personalizedRecommendations,
      strengths: specificStrengths,
      areasForImprovement: specificImprovements,
      essayContent: essayContent,
      childFriendlyExplanations,
      promptSimilarityWarning,
      relevancyScore: relevancy.score,
      relevancyFeedback: relevancy.feedback
    };
  }
  
  // NEW: Calculate similarity between essay and prompt
  private static calculatePromptSimilarity(essay: string, prompt: string): {
    isHighlySimilar: boolean;
    isModeratelySimilar: boolean;
    explanation: string;
    similarityScore: number;
  } {
    // Clean and normalize both texts
    const cleanEssay = essay.toLowerCase().replace(/[^\w\s]/g, '').trim();
    const cleanPrompt = prompt.toLowerCase().replace(/[^\w\s]/g, '').replace('prompt', '').trim();
    
    // If essay is empty or very short, it's not similar
    if (cleanEssay.length < 10) {
      return {
        isHighlySimilar: false,
        isModeratelySimilar: false,
        explanation: "",
        similarityScore: 0
      };
    }
    
    // Check for exact or near-exact matches
    if (cleanEssay === cleanPrompt) {
      return {
        isHighlySimilar: true,
        isModeratelySimilar: false,
        explanation: "The essay content is identical to the prompt. This indicates the student copied the prompt instead of writing an original response.",
        similarityScore: 1.0
      };
    }
    
    // Calculate word overlap
    const essayWords = cleanEssay.split(/\s+/).filter(word => word.length > 2);
    const promptWords = cleanPrompt.split(/\s+/).filter(word => word.length > 2);
    
    if (essayWords.length === 0) {
      return {
        isHighlySimilar: false,
        isModeratelySimilar: false,
        explanation: "",
        similarityScore: 0
      };
    }
    
    // Count matching words
    const essayWordSet = new Set(essayWords);
    const promptWordSet = new Set(promptWords);
    const intersection = new Set([...essayWordSet].filter(word => promptWordSet.has(word)));
    
    const overlapRatio = intersection.size / essayWordSet.size;
    
    // Check for substring containment (essay contains most of the prompt)
    const promptInEssay = cleanPrompt.length > 20 && cleanEssay.includes(cleanPrompt.substring(0, Math.min(cleanPrompt.length, 100)));
    const essayInPrompt = cleanEssay.length > 20 && cleanPrompt.includes(cleanEssay.substring(0, Math.min(cleanEssay.length, 100)));
    
    // Calculate similarity score
    let similarityScore = overlapRatio;
    if (promptInEssay || essayInPrompt) {
      similarityScore = Math.max(similarityScore, 0.8);
    }
    
    // Determine similarity level
    if (similarityScore >= 0.9 || (promptInEssay && essayWords.length > 10)) { // Increased threshold and added length check
      return {
        isHighlySimilar: true,
        isModeratelySimilar: false,
        explanation: "The essay appears to be largely copied from the prompt with minimal original content. Students should write their own creative response to the prompt.",
        similarityScore
      };
    } else if (similarityScore >= 0.7 || (promptInEssay && essayWords.length > 5)) { // Increased threshold and added length check
      return {
        isHighlySimilar: false,
        isModeratelySimilar: true,
        explanation: "The essay contains a significant amount of text from the prompt. Students should focus on creating original content inspired by the prompt rather than copying it.",
        similarityScore
      };
    }
    
    return {
      isHighlySimilar: false,
      isModeratelySimilar: false,
      explanation: "",
      similarityScore
    };
  }
  
  // NEW: Generate minimal score report for prompt copying
  private static generateMinimalScoreReport(essayContent: string, explanation: string): EvaluationReport {
    const minimalDomainScore: DomainScore = {
      score: 0,
      maxScore: 10,
      percentage: 0,
      band: "No Response",
      weight: 0,
      weightedScore: 0,
      feedback: ["No original content provided - essay appears to be copied from the prompt"],
      specificExamples: ["Essay content matches the prompt text"],
      childFriendlyExplanation: "🚫 This doesn't look like your own writing. You need to write your own creative story based on the prompt, not copy the prompt itself!",
      concreteExamples: ["The text submitted is the same as the writing prompt"],
      actionableSuggestions: [
        "Read the prompt carefully to understand what story you should write",
        "Create your own characters, setting, and plot based on the prompt",
        "Write in your own words - don't copy the prompt text"
      ]
    };
    
    const contentAndIdeas = { ...minimalDomainScore, weight: 40 };
    const textStructure = { ...minimalDomainScore, weight: 20 };
    const languageFeatures = { ...minimalDomainScore, weight: 25 };
    const spellingAndGrammar = { ...minimalDomainScore, weight: 15 };
    
    return {
      overallScore: 0,
      overallGrade: "No Response",
      domains: {
        contentAndIdeas,
        textStructure,
        languageFeatures,
        spellingAndGrammar
      },
      detailedFeedback: {
        wordCount: essayContent.split(/\s+/).length,
        sentenceVariety: {
          simple: 0,
          compound: 0,
          complex: 0,
          analysis: "Cannot analyze - no original content provided"
        },
        vocabularyAnalysis: {
          sophisticatedWords: [],
          repetitiveWords: [],
          suggestions: ["Write your own original response to the prompt"]
        },
        literaryDevices: {
          identified: [],
          suggestions: ["Create your own story with interesting descriptions and dialogue"]
        },
        structuralElements: {
          hasIntroduction: false,
          hasConclusion: false,
          paragraphCount: 0,
          coherence: "No structure - prompt copied"
        },
        technicalAccuracy: {
          spellingErrors: 0,
          grammarIssues: [],
          punctuationIssues: [],
          specificErrors: []
        }
      },
      recommendations: [{
        title: "Write Your Own Story",
        description: "You need to create an original response to the writing prompt, not copy the prompt itself.",
        examples: [
          "Read the prompt carefully and think about what story you want to tell",
          "Create your own characters with names and personalities",
          "Describe what happens in your story using your own words",
          "Add dialogue, descriptions, and emotions to make your story interesting"
        ],
        priority: 'high' as const
      }],
      strengths: [],
      areasForImprovement: [{
        area: "Original Writing",
        issue: "The submitted text is copied from the prompt rather than being an original response.",
        suggestion: "Write your own creative story based on the prompt. Use the prompt as inspiration, not as text to copy.",
        concreteExample: "If the prompt asks about a mysterious door, write YOUR story about what YOU would do and what YOU would find behind the door."
      }],
      essayContent: essayContent,
      childFriendlyExplanations: {
        ideasContent: "🚫 This doesn't look like your own writing. You need to write your own creative story based on the prompt!",
        structure: "🚫 No story structure found because you copied the prompt instead of writing your own story.",
        language: "🚫 No original language use detected. Write your own story with your own words!",
        grammar: "🚫 Cannot evaluate grammar when no original writing is provided."
      },
      promptSimilarityWarning: explanation
    };
  }
  
  // NEW: Assess relevancy of essay to prompt
  private static assessRelevancy(essay: string, prompt: string): {
    score: number;
    feedback: string[];
  } {
    const cleanEssay = essay.toLowerCase().replace(/[^\w\s]/g, '').trim();
    const cleanPrompt = prompt.toLowerCase().replace(/[^\w\s]/g, '').trim();

    if (cleanEssay.length === 0) {
      return { score: 0, feedback: ["Essay is empty, cannot assess relevancy to prompt."] };
    }

    // Extract keywords from prompt (simple approach)
    const promptKeywords = cleanPrompt.split(/\s+/)
      .filter(word => word.length > 3 && !["the", "a", "an", "is", "was", "and", "or", "but", "what", "do", "you", "your", "it", "its", "to", "in", "of", "for", "with", "behind", "upon", "as", "that", "this", "where", "how", "does", "will", "next", "describe", "feelings", "stand", "before", "open", "turn", "back", "discover", "other", "side", "change", "who", "when", "why", "how", "which", "where", "from", "then", "finally", "meanwhile", "consequently", "nevertheless", "moreover", "first", "then", "finally", "meanwhile", "consequently", "nevertheless", "moreover", "first", "then", "finally", "next"].includes(word))
      .filter((value, index, self) => self.indexOf(value) === index); // Unique keywords

    // Count how many prompt keywords appear in the essay
    let keywordMatches = 0;
    promptKeywords.forEach(keyword => {
      if (cleanEssay.includes(keyword)) {
        keywordMatches++;
      }
    });

    // Calculate a basic relevancy score
    let score = 0;
    const feedback: string[] = [];

    if (promptKeywords.length > 0) {
      score = (keywordMatches / promptKeywords.length) * 10; // Score out of 10
    }

    // Adjust score based on essay length relative to prompt length (to discourage very short, keyword-stuffed essays)
    const essayWordCount = cleanEssay.split(/\s+/).length;
    const promptWordCount = cleanPrompt.split(/\s+/).length;

    if (essayWordCount < promptWordCount * 0.5) { // Essay is too short compared to prompt
      score *= 0.5; // Halve the score
      feedback.push("Your essay is quite short compared to the prompt. Make sure to develop your ideas fully.");
    }

    score = Math.max(0, Math.min(10, Math.round(score))); // Ensure score is between 0 and 10

    if (score >= 8) {
      feedback.push("Your essay is highly relevant to the prompt, addressing all key aspects.");
    } else if (score >= 5) {
      feedback.push("Your essay shows good relevancy to the prompt, covering most key elements.");
    } else if (score >= 2) {
      feedback.push("Your essay has some relevant points, but could address the prompt more directly.");
    } else {
      feedback.push("Your essay shows minimal relevancy to the prompt. Please read the prompt carefully and ensure your writing directly responds to it.");
    }

    return { score, feedback };
  }

  private static analyzeEssay(essay: string): DetailedFeedback {
    const words = essay.trim().split(/\s+/).filter(word => word.length > 0);
    const sentences = essay.split(/[.!?]+/).filter(s => s.trim().length > 0);

    // Basic sentence variety analysis
    let simpleSentences = 0;
    let compoundSentences = 0;
    let complexSentences = 0;

    sentences.forEach(sentence => {
      const cleanSentence = sentence.toLowerCase();
      if (cleanSentence.includes('and') || cleanSentence.includes('but') || cleanSentence.includes('or')) {
        compoundSentences++;
      } else if (cleanSentence.includes('because') || cleanSentence.includes('although') || cleanSentence.includes('while') || cleanSentence.includes('if')) {
        complexSentences++;
      } else {
        simpleSentences++;
      }
    });

    let sentenceAnalysis = "";
    if (complexSentences > simpleSentences && complexSentences > compoundSentences) {
      sentenceAnalysis = "Great use of complex sentences to express detailed ideas!";
    } else if (compoundSentences > simpleSentences) {
      sentenceAnalysis = "Good variety with compound sentences, linking ideas effectively.";
    } else {
      sentenceAnalysis = "Mostly simple sentences. Try to combine ideas using conjunctions or dependent clauses for more flow.";
    }

    // Vocabulary analysis (simple: identify sophisticated words and repetitive words)
    const sophisticatedWords = this.identifySophisticatedWords(words);
    const repetitiveWords = this.identifyRepetitiveWords(words);
    const vocabSuggestions = this.generateVocabularySuggestions(repetitiveWords);

    // Literary devices (simple: identify some common ones)
    const identifiedLiteraryDevices = this.identifyLiteraryDevices(essay);
    const literaryDeviceSuggestions = this.generateLiteraryDeviceSuggestions(identifiedLiteraryDevices);

    // Structural elements
    const hasIntroduction = essay.trim().split(/\n\s*\n/)[0].length > 50; // Simple check for a first paragraph
    const paragraphs = essay.trim().split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const hasConclusion = paragraphs.length > 1 && paragraphs[paragraphs.length - 1].length > 50; // Simple check for a last paragraph
    const paragraphCount = paragraphs.length;
    let coherence = "Needs improvement";
    if (paragraphCount >= 3 && hasIntroduction && hasConclusion) {
      coherence = "Good";
    } else if (paragraphCount >= 2) {
      coherence = "Fair";
    }

    // Technical accuracy (placeholder for actual grammar/spelling checks)
    const spellingErrors = Math.floor(Math.random() * 3); // Simulate some errors
    const grammarIssues: string[] = [];
    const punctuationIssues: string[] = [];
    const specificErrors: SpecificError[] = [];

    if (spellingErrors > 0) {
      grammarIssues.push("Check your spelling carefully.");
      specificErrors.push({ type: 'spelling', location: 'various', error: 'misspelled words', correction: 'proofread', explanation: 'Some words are misspelled. Always double-check your writing.' });
    }
    if (words.length > 0 && words.length < 50) {
      grammarIssues.push("Ensure sentences are complete and well-formed.");
      specificErrors.push({ type: 'grammar', location: 'various', error: 'sentence fragments', correction: 'complete sentences', explanation: 'Make sure each sentence has a subject and a verb.' });
    }

    return {
      wordCount: words.length,
      sentenceVariety: {
        simple: simpleSentences,
        compound: compoundSentences,
        complex: complexSentences,
        analysis: sentenceAnalysis,
      },
      vocabularyAnalysis: {
        sophisticatedWords,
        repetitiveWords,
        suggestions: vocabSuggestions,
      },
      literaryDevices: {
        identified: identifiedLiteraryDevices,
        suggestions: literaryDeviceSuggestions,
      },
      structuralElements: {
        hasIntroduction,
        hasConclusion,
        paragraphCount,
        coherence,
      },
      technicalAccuracy: {
        spellingErrors,
        grammarIssues,
        punctuationIssues,
        specificErrors,
      },
    };
  }

  private static identifySophisticatedWords(words: string[]): string[] {
    const sophisticatedList = ['magnificent', 'extraordinary', 'captivating', 'serene', 'vibrant', 'eloquent', 'profound', 'resplendent', 'ephemeral', 'ubiquitous'];
    return words.filter(word => sophisticatedList.includes(word.toLowerCase()));
  }

  private static identifyRepetitiveWords(words: string[]): string[] {
    const wordCounts: { [key: string]: number } = {};
    words.forEach(word => {
      const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
      if (cleanWord.length > 2) {
        wordCounts[cleanWord] = (wordCounts[cleanWord] || 0) + 1;
      }
    });
    return Object.keys(wordCounts).filter(word => wordCounts[word] > 3);
  }

  private static generateVocabularySuggestions(repetitiveWords: string[]): string[] {
    if (repetitiveWords.length === 0) {
      return ["Keep using a variety of interesting words!"];
    }
    return repetitiveWords.map(word => `Try using synonyms for '${word}' to make your writing more interesting.`);
  }

  private static identifyLiteraryDevices(essay: string): string[] {
    const devices: string[] = [];
    if (/(like|as) a \w+/i.test(essay)) devices.push("Simile");
    if (/\w+ is a \w+/i.test(essay) && !/\w+ is a (good|bad|great) \w+/i.test(essay)) devices.push("Metaphor");
    if (/\w+ed, \w+ed, and \w+ed/i.test(essay)) devices.push("Rule of Three");
    return devices;
  }

  private static generateLiteraryDeviceSuggestions(identifiedDevices: string[]): string[] {
    const suggestions: string[] = [
      "Try to use similes and metaphors to make your descriptions more vivid.",
      "Think about using personification to give human qualities to objects.",
      "Experiment with alliteration to create a musical effect with words."
    ];
    return suggestions.filter(s => !identifiedDevices.some(device => s.toLowerCase().includes(device.toLowerCase())));
  }

  private static scoreContentAndIdeas(essay: string, analysis: DetailedFeedback, domainName: string, relevancyScore: number): DomainScore {
    let score = 0;
    const feedback: string[] = [];
    const specificExamples: string[] = [];
    const concreteExamples: string[] = [];
    const actionableSuggestions: string[] = [];
    const wordCount = analysis.wordCount;
    const sentenceCount = essay.split(/[.!?]+/).filter(s => s.trim().length > 0).length;

    // Stricter scoring for minimal content
    if (wordCount < 30 || sentenceCount < 3) {
      feedback.push("Your essay is too short to fully develop ideas. Aim for more words and sentences.");
      actionableSuggestions.push("Expand on your ideas with more details and explanations.");
      return this.createDomainScore(domainName, 0, feedback, specificExamples, "Your writing needs more ideas! Try to think of more things to say about your topic.", concreteExamples, actionableSuggestions);
    }

    // Incorporate relevancy score directly
    score += relevancyScore * 0.3; // Reduced impact of relevancy score to allow other factors more weight

    // Ideas and originality (simple check based on word count and complexity)
    if (wordCount > 150 && analysis.sentenceVariety.complex > 1 && relevancyScore > 7) {
      score += 4; // Max 4 points for developed ideas
      feedback.push("You have some great, thoughtful ideas that make your writing engaging.");
      specificExamples.push("Developed ideas with some complexity.");
      concreteExamples.push("The way you described [specific example from essay] showed great imagination.");
      actionableSuggestions.push("Keep exploring different perspectives and unique angles in your stories.");
    } else if (wordCount > 80 && relevancyScore > 5) {
      score += 2; // Max 2 points for some ideas
      feedback.push("Your writing shows some good ideas. Try to develop them further.");
      specificExamples.push("Some good ideas present.");
      concreteExamples.push("Your idea about [specific example from essay] was interesting.");
      actionableSuggestions.push("Add more descriptive details and expand on your main points.");
    } else {
      score += 1; // Minimal points for basic ideas
      feedback.push("Your essay has a basic idea. Try to add more details and make it more interesting.");
      specificExamples.push("Basic ideas.");
      concreteExamples.push("Think about what else could happen in your story.");
      actionableSuggestions.push("Brainstorm more ideas before you start writing.");
    }

    // Engagement and creativity (simple check)
    if (analysis.literaryDevices.identified.length >= 1 || analysis.vocabularyAnalysis.sophisticatedWords.length >= 1) {
      score += 3; // Max 3 points for creativity
      feedback.push("Your creativity is shining through with interesting language choices!");
      specificExamples.push("Creative language and engaging descriptions.");
      concreteExamples.push("Using words like '[sophisticated word]' or phrases like '[literary device example]' made your writing exciting.");
      actionableSuggestions.push("Continue to experiment with different literary devices to make your writing even more imaginative.");
    } else {
      score += 1; // Minimal points for basic engagement
      feedback.push("Try to make your writing more engaging with creative words and descriptions.");
      specificExamples.push("Needs more engaging language.");
      concreteExamples.push("Can you think of a more exciting way to describe [something in essay]?");
      actionableSuggestions.push("Read more books to discover new words and ways to describe things.");
    }

    // Overall content development (simple check)
    if (wordCount > 200 && analysis.structuralElements.paragraphCount >= 4 && relevancyScore > 8) {
      score += 3; // Max 3 points for well-developed content
      feedback.push("Your content is well-developed and easy to follow.");
      specificExamples.push("Well-developed content.");
      concreteExamples.push("You explained [specific idea] very clearly.");
      actionableSuggestions.push("Ensure all your paragraphs connect smoothly to your main idea.");
    } else if (wordCount > 100 && analysis.structuralElements.paragraphCount >= 2) {
      score += 2; // Max 2 points for some development
      feedback.push("Your content is developing well. Try to add more supporting details.");
      specificExamples.push("Some content development.");
      concreteExamples.push("Could you add more details about [specific event in essay]?");
      actionableSuggestions.push("Think about the 'who, what, where, when, why, and how' for each part of your story.");
    } else {
      score += 1; // Minimal points for basic development
      feedback.push("Your content needs more development. Add more information and details.");
      specificExamples.push("Limited content development.");
      concreteExamples.push("What else can you tell me about [topic in essay]?");
      actionableSuggestions.push("Plan your story before you start writing to make sure you have enough ideas.");
    }

    score = Math.max(0, Math.min(10, Math.round(score))); // Ensure score is between 0 and 10

    return this.createDomainScore(domainName, score, feedback, specificExamples, "Your writing needs more ideas! Try to think of more things to say about your topic.", concreteExamples, actionableSuggestions);
  }

  private static scoreTextStructure(essay: string, analysis: DetailedFeedback, domainName: string): DomainScore {
    let score = 0;
    const feedback: string[] = [];
    const specificExamples: string[] = [];
    const concreteExamples: string[] = [];
    const actionableSuggestions: string[] = [];
    const wordCount = analysis.wordCount;
    const sentenceCount = essay.split(/[.!?]+/).filter(s => s.trim().length > 0).length;

    // Stricter scoring for minimal content
    if (wordCount < 50 || sentenceCount < 5) {
      feedback.push("Your essay is too short to demonstrate clear structure. Aim for more content.");
      actionableSuggestions.push("Write more to show how your story begins, develops, and ends.");
      return this.createDomainScore(domainName, 0, feedback, specificExamples, "Your story needs a clear beginning, middle, and end. Think about how to organize your ideas.", concreteExamples, actionableSuggestions);
    }

    // Introduction and Conclusion
    if (analysis.structuralElements.hasIntroduction && analysis.structuralElements.hasConclusion && analysis.structuralElements.paragraphCount >= 3) {
      score += 4; // Max 4 points for clear intro/conclusion
      feedback.push("Your writing has a clear beginning and end, guiding the reader through your story.");
      specificExamples.push("Clear introduction and conclusion.");
      concreteExamples.push("Your introduction set the scene well, and your conclusion wrapped up the story nicely.");
      actionableSuggestions.push("Ensure your introduction hooks the reader and your conclusion provides a satisfying end.");
    } else if (analysis.structuralElements.hasIntroduction || analysis.structuralElements.hasConclusion) {
      score += 2; // Max 2 points for one present
      feedback.push("Your essay has either a clear beginning or end, but try to include both.");
      specificExamples.push("Missing either an introduction or conclusion.");
      concreteExamples.push("Remember to add a strong ending to your story.");
      actionableSuggestions.push("Plan out your story's beginning, middle, and end before you start writing.");
    } else {
      score += 1; // Minimal points
      feedback.push("Your essay needs a clearer beginning and end.");
      specificExamples.push("Lacks clear introduction and conclusion.");
      concreteExamples.push("How does your story start? How does it finish?");
      actionableSuggestions.push("Use an opening sentence to grab attention and a closing sentence to leave a lasting impression.");
    }

    // Paragraphing and Coherence
    if (analysis.structuralElements.paragraphCount >= 4 && analysis.structuralElements.coherence === "Good") {
      score += 4; // Max 4 points for good paragraphing and coherence
      feedback.push("Your writing flows perfectly, like a well-told story, with clear paragraphs.");
      specificExamples.push("Effective paragraphing and coherence.");
      concreteExamples.push("Each paragraph focused on a different part of your story, which made it easy to read.");
      actionableSuggestions.push("Continue to use paragraphs to separate different ideas or events in your writing.");
    } else if (analysis.structuralElements.paragraphCount >= 2 && analysis.structuralElements.coherence === "Fair") {
      score += 2; // Max 2 points for some paragraphing
      feedback.push("You've started to use paragraphs, which helps organize your ideas. Keep practicing!");
      specificExamples.push("Some paragraphing, but coherence could improve.");
      concreteExamples.push("Try to make sure your paragraphs connect smoothly.");
      actionableSuggestions.push("Start a new paragraph when you introduce a new idea, time, or character.");
    } else {
      score += 1; // Minimal points
      feedback.push("Your essay needs more paragraphing to organize your ideas.");
      specificExamples.push("Limited paragraphing and coherence.");
      concreteExamples.push("Your story would be easier to read if you used paragraphs.");
      actionableSuggestions.push("Break your writing into smaller chunks, with each chunk talking about one main thing.");
    }

    // Sequencing (simple check based on word count and paragraphs)
    if (wordCount > 120 && analysis.structuralElements.paragraphCount >= 3) {
      score += 2; // Max 2 points for good sequencing
      feedback.push("The events in your story are in a logical order, making it easy to follow.");
      specificExamples.push("Logical sequencing of events.");
      concreteExamples.push("The way you told the story, from [event 1] to [event 2], made perfect sense.");
      actionableSuggestions.push("Use transition words like 'first', 'next', 'then', and 'finally' to help your story flow.");
    } else {
      score += 1; // Minimal points
      feedback.push("Think about the order of events in your story to make it clearer.");
      specificExamples.push("Sequencing could be improved.");
      concreteExamples.push("What happened first, second, and third in your story?");
      actionableSuggestions.push("Create a simple plan or timeline for your story before you write.");
    }

    score = Math.max(0, Math.min(10, Math.round(score))); // Ensure score is between 0 and 10

    return this.createDomainScore(domainName, score, feedback, specificExamples, "Your story needs a clear beginning, middle, and end. Think about how to organize your ideas.", concreteExamples, actionableSuggestions);
  }

  private static scoreLanguageFeatures(essay: string, analysis: DetailedFeedback, domainName: string): DomainScore {
    let score = 0;
    const feedback: string[] = [];
    const specificExamples: string[] = [];
    const concreteExamples: string[] = [];
    const actionableSuggestions: string[] = [];
    const wordCount = analysis.wordCount;
    const sentenceCount = essay.split(/[.!?]+/).filter(s => s.trim().length > 0).length;

    // Stricter scoring for minimal content
    if (wordCount < 40 || sentenceCount < 4) {
      feedback.push("Your essay is too short to fully assess language features. Add more detail.");
      actionableSuggestions.push("Write more to show off your amazing vocabulary and sentence skills!");
      return this.createDomainScore(domainName, 0, feedback, specificExamples, "Use exciting words and different kinds of sentences to make your writing sparkle!", concreteExamples, actionableSuggestions);
    }

    // Vocabulary (based on sophisticated words and repetitive words)
    if (analysis.vocabularyAnalysis.sophisticatedWords.length >= 2 && analysis.vocabularyAnalysis.repetitiveWords.length === 0) {
      score += 4; // Max 4 points for rich vocabulary
      feedback.push("You use a wide range of interesting and precise words!");
      specificExamples.push("Rich and varied vocabulary.");
      concreteExamples.push("Words like '[sophisticated word example]' make your writing really stand out.");
      actionableSuggestions.push("Keep learning new words and finding the perfect ones for your stories.");
    } else if (analysis.vocabularyAnalysis.sophisticatedWords.length >= 1 || analysis.vocabularyAnalysis.repetitiveWords.length < 2) {
      score += 2; // Max 2 points for some good vocabulary
      feedback.push("You use good words. Try to find even more exciting ones and avoid repeating words too often.");
      specificExamples.push("Good vocabulary, but some repetition.");
      concreteExamples.push("Can you think of a different word for '[repetitive word example]'?");
      actionableSuggestions.push("Use a thesaurus to find new and interesting words.");
    } else {
      score += 1; // Minimal points
      feedback.push("Your vocabulary could be more varied. Try to use different words.");
      specificExamples.push("Limited vocabulary.");
      concreteExamples.push("What other words could you use instead of '[common word example]'?");
      actionableSuggestions.push("Read more books to discover new and exciting words.");
    }

    // Sentence Variety (based on analysis.sentenceVariety)
    if (analysis.sentenceVariety.complex >= 1 && analysis.sentenceVariety.compound >= 1) {
      score += 3; // Max 3 points for excellent variety
      feedback.push("You use a fantastic mix of sentence types, making your writing flow beautifully!");
      specificExamples.push("Excellent sentence variety.");
      concreteExamples.push("Your sentences are long and short, making your writing interesting to read.");
      actionableSuggestions.push("Continue to mix up your sentence beginnings and lengths to keep readers engaged.");
    } else if (analysis.sentenceVariety.compound >= 1 || analysis.sentenceVariety.complex >= 1) {
      score += 2; // Max 2 points for some variety
      feedback.push("You use some different sentence types. Try to add even more variety.");
      specificExamples.push("Some sentence variety.");
      concreteExamples.push("Try to join some of your shorter sentences together.");
      actionableSuggestions.push("Experiment with starting sentences in different ways.");
    } else {
      score += 1; // Minimal points
      feedback.push("Your sentences are mostly simple. Try to make them more interesting by combining ideas.");
      specificExamples.push("Limited sentence variety.");
      concreteExamples.push("Can you make this sentence longer by adding more information: '[simple sentence example]'?");
      actionableSuggestions.push("Use words like 'and', 'but', 'because' to make your sentences longer and more interesting.");
    }

    // Literary Devices (based on identified devices)
    if (analysis.literaryDevices.identified.length >= 2) {
      score += 3; // Max 3 points for good use of devices
      feedback.push("You skillfully use literary devices to make your writing vivid and imaginative!");
      specificExamples.push("Effective use of literary devices.");
      concreteExamples.push("Your use of '[literary device example]' really brought your descriptions to life.");
      actionableSuggestions.push("Keep practicing with similes, metaphors, and personification to add magic to your writing.");
    } else if (analysis.literaryDevices.identified.length === 1) {
      score += 2; // Max 2 points for some use
      feedback.push("You've started to use literary devices. Try to include more to make your writing even better.");
      specificExamples.push("Some use of literary devices.");
      concreteExamples.push("Can you add another simile or metaphor to your story?");
      actionableSuggestions.push("Look for opportunities to compare things using 'like' or 'as' (simile) or by saying one thing IS another (metaphor).");
    } else {
      score += 1; // Minimal points
      feedback.push("Your writing could be more descriptive. Try using literary devices.");
      specificExamples.push("Limited use of literary devices.");
      concreteExamples.push("How can you describe [object in essay] in a more imaginative way?");
      actionableSuggestions.push("Think about how things look, sound, smell, taste, and feel, and use those details in your writing.");
    }

    score = Math.max(0, Math.min(10, Math.round(score))); // Ensure score is between 0 and 10

    return this.createDomainScore(domainName, score, feedback, specificExamples, "Use exciting words and different kinds of sentences to make your writing sparkle!", concreteExamples, actionableSuggestions);
  }

  private static scoreSpellingAndGrammar(essay: string, analysis: DetailedFeedback, domainName: string): DomainScore {
    let score = 0;
    const feedback: string[] = [];
    const specificExamples: string[] = [];
    const concreteExamples: string[] = [];
    const actionableSuggestions: string[] = [];
    const wordCount = analysis.wordCount;
    const sentenceCount = essay.split(/[.!?]+/).filter(s => s.trim().length > 0).length;

    // Stricter scoring for minimal content
    if (wordCount < 20 || sentenceCount < 2) {
      feedback.push("Your essay is too short to fully assess spelling and grammar. Add more content.");
      actionableSuggestions.push("Write more sentences so we can see your amazing spelling and grammar skills!");
      return this.createDomainScore(domainName, 0, feedback, specificExamples, "Make sure your spelling is correct and your sentences make sense!", concreteExamples, actionableSuggestions);
    }

    // Spelling
    if (analysis.technicalAccuracy.spellingErrors === 0 && wordCount > 50) {
      score += 4; // Max 4 points for perfect spelling
      feedback.push("Your spelling is perfect - fantastic work!");
      specificExamples.push("Accurate spelling.");
      concreteExamples.push("Every word is spelled correctly, like '[correctly spelled word example]'.");
      actionableSuggestions.push("Keep proofreading your work carefully.");
    } else if (analysis.technicalAccuracy.spellingErrors <= Math.floor(wordCount / 50) + 1) { // Allow some errors based on length
      score += 2; // Max 2 points for minor errors
      feedback.push("You have very few spelling mistakes. Keep practicing!");
      specificExamples.push("Minor spelling errors.");
      concreteExamples.push("Double-check words like '[misspelled word example]'.");
      actionableSuggestions.push("Use a dictionary or spell checker to help you.");
    } else {
      score += 1; // Minimal points
      feedback.push("You have several spelling mistakes. Remember to proofread.");
      specificExamples.push("Frequent spelling errors.");
      concreteExamples.push("Words like '[misspelled word example]' need to be corrected.");
      actionableSuggestions.push("Read your writing aloud to catch mistakes, or ask a friend to help you proofread.");
    }

    // Grammar
    if (analysis.technicalAccuracy.grammarIssues.length === 0 && sentenceCount > 5) {
      score += 3; // Max 3 points for perfect grammar
      feedback.push("Your grammar is excellent - your sentences are clear and correct!");
      specificExamples.push("Accurate grammar.");
      concreteExamples.push("Your sentences are well-formed, like '[grammatically correct sentence example]'.");
      actionableSuggestions.push("Continue to write clear and complete sentences.");
    } else if (analysis.technicalAccuracy.grammarIssues.length <= Math.floor(sentenceCount / 5) + 1) { // Allow some errors based on length
      score += 2; // Max 2 points for minor errors
      feedback.push("You have very few grammar mistakes. Keep practicing!");
      specificExamples.push("Minor grammar errors.");
      concreteExamples.push("Check sentences like '[sentence with minor grammar error example]'.");
      actionableSuggestions.push("Read your sentences carefully to make sure they make sense.");
    } else {
      score += 1; // Minimal points
      feedback.push("You have several grammar mistakes. Remember to check your sentences.");
      specificExamples.push("Frequent grammar errors.");
      concreteExamples.push("Sentences like '[sentence with frequent grammar error example]' need to be fixed.");
      actionableSuggestions.push("Make sure each sentence has a subject and a verb, and that they agree.");
    }

    // Punctuation
    if (analysis.technicalAccuracy.punctuationIssues.length === 0 && sentenceCount > 5) {
      score += 3; // Max 3 points for perfect punctuation
      feedback.push("Your punctuation is spot on - great job!");
      specificExamples.push("Accurate punctuation.");
      concreteExamples.push("You used commas and periods correctly, like in '[sentence with correct punctuation example]'.");
      actionableSuggestions.push("Keep up the great work with your punctuation.");
    } else if (analysis.technicalAccuracy.punctuationIssues.length <= Math.floor(sentenceCount / 5) + 1) { // Allow some errors based on length
      score += 2; // Max 2 points for minor errors
      feedback.push("You have very few punctuation mistakes. Keep practicing!");
      specificExamples.push("Minor punctuation errors.");
      concreteExamples.push("Check punctuation in sentences like '[sentence with minor punctuation error example]'.");
      actionableSuggestions.push("Remember to use capital letters at the start of sentences and periods at the end.");
    } else {
      score += 1; // Minimal points
      feedback.push("You have several punctuation mistakes. Remember to check your punctuation.");
      specificExamples.push("Frequent punctuation errors.");
      concreteExamples.push("Sentences like '[sentence with frequent punctuation error example]' need to be fixed.");
      actionableSuggestions.push("Pay attention to where you use commas, periods, and capital letters.");
    }

    score = Math.max(0, Math.min(10, Math.round(score))); // Ensure score is between 0 and 10

    return this.createDomainScore(domainName, score, feedback, specificExamples, "Make sure your spelling is correct and your sentences make sense!", concreteExamples, actionableSuggestions);
  }

  private static createDomainScore(domainName: string, score: number, feedback: string[], specificExamples: string[], childFriendlyExplanation: string, concreteExamples: string[], actionableSuggestions: string[]): DomainScore {
    const maxScore = 10; // All domains are scored out of 10
    const percentage = (score / maxScore) * 100;
    let band = "";
    if (score >= 8) band = "Excellent";
    else if (score >= 6) band = "Good";
    else if (score >= 4) band = "Developing";
    else if (score >= 2) band = "Emerging";
    else band = "Beginning";

    let weight = 0;
    switch (domainName) {
      case "Content & Ideas": weight = 40; break;
      case "Text Structure": weight = 20; break;
      case "Language Features": weight = 25; break;
      case "Spelling & Grammar": weight = 15; break;
    }

    const weightedScore = (score / maxScore) * weight;

    return {
      score,
      maxScore,
      percentage,
      band,
      weight,
      weightedScore,
      feedback,
      specificExamples,
      childFriendlyExplanation,
      concreteExamples,
      actionableSuggestions,
    };
  }

  private static getOverallGrade(overallScore: number): string {
    if (overallScore >= 90) return "A+";
    if (overallScore >= 85) return "A";
    if (overallScore >= 80) return "A-";
    if (overallScore >= 75) return "B+";
    if (overallScore >= 70) return "B";
    if (overallScore >= 65) return "B-";
    if (overallScore >= 60) return "C+";
    if (overallScore >= 55) return "C";
    if (overallScore >= 50) return "C-";
    if (overallScore >= 40) return "D";
    return "E";
  }

  private static generatePersonalizedRecommendations(
    contentAndIdeas: DomainScore,
    textStructure: DomainScore,
    languageFeatures: DomainScore,
    spellingAndGrammar: DomainScore,
    essayContent: string
  ): PersonalizedRecommendation[] {
    const recommendations: PersonalizedRecommendation[] = [];

    // Prioritize areas with lower scores
    const domains = [
      { ...contentAndIdeas, name: "Content & Ideas" },
      { ...textStructure, name: "Text Structure" },
      { ...languageFeatures, name: "Language Features" },
      { ...spellingAndGrammar, name: "Spelling & Grammar" },
    ].sort((a, b) => a.score - b.score);

    domains.forEach(domain => {
      if (domain.score < 7) { // Focus on domains where score is less than 'Good'
        recommendations.push({
          title: `Improve ${domain.name}`,
          description: `Focus on ${domain.name.toLowerCase()} to boost your writing. ${domain.childFriendlyExplanation}`,
          examples: domain.actionableSuggestions.slice(0, 2),
          priority: domain.score < 4 ? 'high' : 'medium',
        });
      }
    });

    // Add general recommendations if essay is very short
    if (essayContent.split(/\s+/).length < 75) { // Increased threshold for 'very short'
      recommendations.push({
        title: "Write More!",
        description: "To get a better score, you need to write more! The more you write, the more you can show off your skills.",
        examples: [
          "Try to write at least 75-150 words for each essay.",
          "Expand on your ideas with more details and examples.",
          "Don't be afraid to write a longer story!"
        ],
        priority: 'high',
      });
    }

    // Ensure unique recommendations and limit to top 3-5
    const uniqueRecommendations = Array.from(new Map(recommendations.map(item => [item.title, item])).values());
    return uniqueRecommendations.slice(0, 5);
  }

  private static identifySpecificStrengths(
    contentAndIdeas: DomainScore,
    textStructure: DomainScore,
    languageFeatures: DomainScore,
    spellingAndGrammar: DomainScore,
    essayContent: string
  ): SpecificStrength[] {
    const strengths: SpecificStrength[] = [];
    const wordCount = essayContent.split(/\s+/).length;

    if (wordCount < 50) return []; // No strengths for very short essays

    if (contentAndIdeas.score >= 7) {
      strengths.push({
        area: "Ideas & Content",
        description: "You have some great, thoughtful ideas that make your writing engaging.",
        encouragement: "Keep exploring different perspectives and unique angles in your stories."
      });
    }
    if (textStructure.score >= 7) {
      strengths.push({
        area: "Text Structure",
        description: "Your writing flows perfectly, like a well-told story, with a clear beginning, middle, and end!",
        encouragement: "Continue to use paragraphs to separate different ideas or events in your writing."
      });
    }
    if (languageFeatures.score >= 7) {
      strengths.push({
        area: "Language Features",
        description: "You use a fantastic mix of sentence types and interesting words, making your writing sparkle!",
        encouragement: "Keep learning new words and finding the perfect ones for your stories."
      });
    }
    if (spellingAndGrammar.score >= 7) {
      strengths.push({
        area: "Spelling & Grammar",
        description: "Your spelling, grammar, and punctuation are almost perfect - fantastic work!",
        encouragement: "Keep proofreading your work carefully."
      });
    }
    return strengths;
  }

  private static identifySpecificImprovements(
    contentAndIdeas: DomainScore,
    textStructure: DomainScore,
    languageFeatures: DomainScore,
    spellingAndGrammar: DomainScore,
    essayContent: string
  ): SpecificImprovement[] {
    const improvements: SpecificImprovement[] = [];
    const wordCount = essayContent.split(/\s+/).length;

    if (wordCount < 50) {
      improvements.push({
        area: "Length & Detail",
        issue: "Your essay is too short to fully demonstrate your writing skills.",
        suggestion: "Try to write more! Expand on your ideas with more details and explanations. Aim for at least 75-150 words.",
        concreteExample: "If you wrote 'I went to the beach.', try adding 'I went to the sunny beach with my family, and the sand felt warm between my toes.'"
      });
      return improvements;
    }

    if (contentAndIdeas.score < 7) {
      improvements.push({
        area: "Ideas & Content",
        issue: "Your ideas could be more developed or creative.",
        suggestion: contentAndIdeas.actionableSuggestions[0] || "Brainstorm more ideas before you start writing.",
        concreteExample: contentAndIdeas.concreteExamples[0] || "Think about the 'who, what, where, when, why, and how' for each part of your story."
      });
    }
    if (textStructure.score < 7) {
      improvements.push({
        area: "Text Structure",
        issue: "Your essay could have a clearer beginning, middle, and end, or better paragraphing.",
        suggestion: textStructure.actionableSuggestions[0] || "Plan out your story's beginning, middle, and end before you start writing.",
        concreteExample: textStructure.concreteExamples[0] || "Use an opening sentence to grab attention and a closing sentence to leave a lasting impression."
      });
    }
    if (languageFeatures.score < 7) {
      improvements.push({
        area: "Language Features",
        issue: "Your vocabulary or sentence variety could be improved.",
        suggestion: languageFeatures.actionableSuggestions[0] || "Use a thesaurus to find new and interesting words.",
        concreteExample: languageFeatures.concreteExamples[0] || "Experiment with starting sentences in different ways."
      });
    }
    if (spellingAndGrammar.score < 7) {
      improvements.push({
        area: "Spelling & Grammar",
        issue: "You have some spelling, grammar, or punctuation mistakes.",
        suggestion: spellingAndGrammar.actionableSuggestions[0] || "Read your writing aloud to catch mistakes, or ask a friend to help you proofread.",
        concreteExample: spellingAndGrammar.concreteExamples[0] || "Make sure each sentence has a subject and a verb, and that they agree."
      });
    }
    return improvements;
  }

  private static generateChildFriendlyExplanations(
    contentAndIdeas: DomainScore,
    textStructure: DomainScore,
    languageFeatures: DomainScore,
    spellingAndGrammar: DomainScore
  ): ChildFriendlyExplanations {
    return {
      ideasContent: contentAndIdeas.childFriendlyExplanation,
      structure: textStructure.childFriendlyExplanation,
      language: languageFeatures.childFriendlyExplanation,
      grammar: spellingAndGrammar.childFriendlyExplanation,
    };
  }

  // Helper to remove HTML tags and normalize whitespace
  private static cleanText(text: string): string {
    return text.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();
  }

  // Helper to count words more accurately
  private static countWords(text: string): number {
    const clean = this.cleanText(text);
    if (clean === '') return 0;
    return clean.split(/\s+/).length;
  }

  // Helper to count sentences more accurately
  private static countSentences(text: string): number {
    const clean = this.cleanText(text);
    if (clean === '') return 0;
    return clean.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  }
}

// NSWEvaluationReportDisplay.tsx (for the color fix)
/*
import React from 'react';
import { EvaluationReport } from './NSWEvaluationReportGenerator';

const NSWEvaluationReportDisplay: React.FC<{ report: EvaluationReport }> = ({ report }) => {
  return (
    <div className="bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
        <div className="p-6 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-t-lg">
          <h1 className="text-3xl font-bold text-white">NSW Writing Assessment Report</h1>
          <p className="text-lg">Your Personal Writing Journey Report</p>
        </div>
        {/* ... rest of the component */}
      </div>
    </div>
  );
};

export default NSWEvaluationReportDisplay;
*/
