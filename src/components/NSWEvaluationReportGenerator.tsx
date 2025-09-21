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
    const cleanPrompt = prompt.toLowerCase().replace(/[^\w\s]/g, '').trim();
    
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
    if (similarityScore >= 0.8 || promptInEssay || essayInPrompt) {
      return {
        isHighlySimilar: true,
        isModeratelySimilar: false,
        explanation: "The essay appears to be largely copied from the prompt with minimal original content. Students should write their own creative response to the prompt.",
        similarityScore
      };
    } else if (similarityScore >= 0.6) {
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
      .filter(word => word.length > 3 && !['the', 'a', 'an', 'is', 'was', 'and', 'or', 'but', 'what', 'do', 'you', 'your', 'it', 'its', 'to', 'in', 'of', 'for', 'with', 'behind', 'upon', 'as', 'that', 'this', 'where', 'how', 'does', 'will', 'next', 'describe', 'feelings', 'stand', 'before', 'open', 'turn', 'back', 'discover', 'other', 'side', 'change', 'who', 'when', 'why', 'how', 'which', 'where', 'from', 'then', 'finally', 'meanwhile', 'consequently', 'nevertheless', 'moreover', 'first', 'then', 'finally', 'next'])
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
    const paragraphs = essay.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    // Analyze sentence variety
    const simpleSentences = sentences.filter(s => !s.includes(',') && !s.includes(';') && !s.includes('and') && !s.includes('but')).length;
    const compoundSentences = sentences.filter(s => (s.includes(',') || s.includes(';')) && (s.includes('and') || s.includes('but') || s.includes('or'))).length;
    const complexSentences = sentences.filter(s => s.includes('that') || s.includes('which') || s.includes('when') || s.includes('because') || s.includes('although')).length;
    
    // Vocabulary analysis
    const sophisticatedWords = this.identifySophisticatedVocabulary(essay);
    const repetitiveWords = this.identifyRepetitiveWords(words);
    
    // Literary devices
    const literaryDevices = this.identifyLiteraryDevices(essay);
    
    // Structural analysis
    const hasIntroduction = this.hasEffectiveIntroduction(essay);
    const hasConclusion = this.hasEffectiveConclusion(essay);
    
    // Enhanced technical accuracy analysis
    const spellingErrors = this.countSpellingErrors(essay);
    const grammarIssues = this.identifyGrammarIssues(essay);
    const punctuationIssues = this.identifyPunctuationIssues(essay);
    const specificErrors = this.identifySpecificErrors(essay); // NEW: Detailed error analysis
    
    return {
      wordCount: words.length,
      sentenceVariety: {
        simple: simpleSentences,
        compound: compoundSentences,
        complex: complexSentences,
        analysis: this.analyzeSentenceVariety(simpleSentences, compoundSentences, complexSentences)
      },
      vocabularyAnalysis: {
        sophisticatedWords,
        repetitiveWords,
        suggestions: this.generateVocabularySuggestions(repetitiveWords)
      },
      literaryDevices: {
        identified: literaryDevices,
        suggestions: this.suggestLiteraryDevices(essay, literaryDevices)
      },
      structuralElements: {
        hasIntroduction,
        hasConclusion,
        paragraphCount: paragraphs.length,
        coherence: this.assessCoherence(essay, paragraphs)
      },
      technicalAccuracy: {
        spellingErrors,
        grammarIssues,
        punctuationIssues,
        specificErrors
      }
    };
  }
  
  // ENHANCED: Improved scoring with concrete examples and actionable suggestions
  private static scoreContentAndIdeas(essay: string, analysis: DetailedFeedback, domainName: string, relevancyScore: number): DomainScore {
    let score = 5; // Start with proficient
    const feedback: string[] = [];
    const specificExamples: string[] = [];
    const concreteExamples: string[] = [];
    const actionableSuggestions: string[] = [];
    
    // Assess originality and creativity
    const creativityScore = this.assessCreativity(essay);
    const ideaDevelopmentScore = this.assessIdeaDevelopment(essay);
    const engagementScore = this.assessEngagement(essay);
    
    // Calculate score based on multiple factors, including relevancy
    const avgScore = (creativityScore + ideaDevelopmentScore + engagementScore + relevancyScore) / 4;
    score = Math.round(avgScore);
    
    // Generate specific feedback with concrete examples
    const firstSentence = essay.split(/[.!?]+/)[0]?.trim();
    const hasDialogue = /"/.test(essay);
    const hasSensoryDetails = /see|hear|smell|taste|feel|touch|sound|sight|color|bright|dark/i.test(essay);
    
    if (score >= 9) {
      feedback.push("Demonstrates exceptional creativity and originality");
      feedback.push("Ideas are highly sophisticated and insightful");
      feedback.push("Content is compelling and engaging throughout");
      if (firstSentence) {
        concreteExamples.push(`Your opening "${firstSentence}..." immediately captures the reader's attention with its creative approach.`);
      }
    } else if (score >= 7) {
      feedback.push("Shows notable creativity and original thinking");
      feedback.push("Ideas are well-developed and thoughtful");
      feedback.push("Content is engaging with compelling elements");
      if (hasDialogue) {
        concreteExamples.push("Your use of dialogue brings characters to life and makes the story more engaging.");
      }
    } else if (score >= 5) {
      feedback.push("Demonstrates some creativity and original ideas");
      feedback.push("Ideas are adequately developed");
      feedback.push("Content is mostly engaging");
      if (hasSensoryDetails) {
        concreteExamples.push("You include some sensory details that help readers picture the scene.");
      }
      actionableSuggestions.push("Try adding more specific details about what characters see, hear, and feel to make your story more vivid.");
    } else if (score >= 3) {
      feedback.push("Limited creativity and mostly conventional ideas");
      feedback.push("Basic idea development");
      feedback.push("Some engaging elements but mostly predictable");
      actionableSuggestions.push("Challenge yourself to think of unexpected plot twists or unique character traits.");
      actionableSuggestions.push("Add more descriptive details to help readers visualize your story world.");
    } else {
      feedback.push("Minimal creativity or originality");
      feedback.push("Ideas lack development");
      feedback.push("Content lacks engagement");
      actionableSuggestions.push("Start by brainstorming three different ways your story could begin, then choose the most interesting one.");
      actionableSuggestions.push("Ask yourself: What would surprise the reader? What details would help them picture this scene?");
    }
    
    // Add specific examples from the text
    specificExamples.push(...this.extractContentExamples(essay, score));
    
    const weight = 40;
    const percentage = (score / 10) * 100;
    const weightedScore = (score / 10) * weight;
    
    return {
      score,
      maxScore: 10,
      percentage,
      band: this.getScoreBand(score),
      weight,
      weightedScore,
      feedback,
      specificExamples,
      childFriendlyExplanation: this.generateChildFriendlyExplanation(domainName, score),
      concreteExamples,
      actionableSuggestions
    };
  }
  
  // ENHANCED: Improved structure scoring with specific feedback
  private static scoreTextStructure(essay: string, analysis: DetailedFeedback, domainName: string): DomainScore {
    let score = 5;
    const feedback: string[] = [];
    const specificExamples: string[] = [];
    const concreteExamples: string[] = [];
    const actionableSuggestions: string[] = [];
    
    // Assess structure elements
    const introScore = analysis.structuralElements.hasIntroduction ? 2 : 0;
    const conclusionScore = analysis.structuralElements.hasConclusion ? 2 : 0;
    const paragraphScore = this.assessParagraphOrganization(essay);
    const coherenceScore = this.assessCoherenceScore(analysis.structuralElements.coherence);
    const transitionScore = this.assessTransitions(essay);
    
    score = Math.round((introScore + conclusionScore + paragraphScore + coherenceScore + transitionScore) / 5 * 10);
    score = Math.max(1, Math.min(10, score));
    
    // Generate specific feedback with concrete examples
    const paragraphCount = analysis.structuralElements.paragraphCount;
    const hasTransitions = /however|therefore|furthermore|meanwhile|consequently|nevertheless|moreover|first|then|finally|next/i.test(essay);
    
    if (score >= 9) {
      feedback.push("Sophisticated and seamless structure");
      feedback.push("Excellent paragraph organization with compelling links");
      feedback.push("Masterful introduction and conclusion");
      if (hasTransitions) {
        concreteExamples.push("Your use of transition words creates smooth connections between ideas.");
      }
    } else if (score >= 7) {
      feedback.push("Well-crafted structure");
      feedback.push("Strong paragraph organization with clear links");
      feedback.push("Effective introduction and conclusion");
      concreteExamples.push(`Your ${paragraphCount} paragraphs are well-organized and easy to follow.`);
    } else if (score >= 5) {
      feedback.push("Clear structure overall");
      feedback.push("Adequate paragraph organization");
      feedback.push("Suitable introduction and conclusion");
      if (!hasTransitions) {
        actionableSuggestions.push("Try using connecting words like 'First,' 'Then,' 'Meanwhile,' and 'Finally' to link your ideas together.");
      }
    } else if (score >= 3) {
      feedback.push("Basic structure with some lapses");
      feedback.push("Inconsistent paragraph organization");
      feedback.push("Simple introduction and/or conclusion");
      actionableSuggestions.push("Plan your story with a clear beginning (introduce characters/setting), middle (main events), and end (resolution).");
      if (paragraphCount < 3) {
        actionableSuggestions.push("Try breaking your story into at least 3 paragraphs to make it easier to follow.");
      }
    } else {
      feedback.push("Minimal or confused structure");
      feedback.push("Limited paragraph organization");
      feedback.push("Missing or ineffective introduction/conclusion");
      actionableSuggestions.push("Start with a simple outline: What happens first? What happens next? How does it end?");
      actionableSuggestions.push("Make sure each paragraph focuses on one main idea or event.");
    }
    
    // Add structural analysis
    if (!analysis.structuralElements.hasIntroduction) {
      actionableSuggestions.push("Create a strong opening that grabs the reader's attention and introduces your story.");
    }
    if (!analysis.structuralElements.hasConclusion) {
      actionableSuggestions.push("End with a satisfying conclusion that wraps up your story and shows what the character learned.");
    }
    
    specificExamples.push(...this.extractStructureExamples(essay, analysis));
    
    const weight = 20;
    const percentage = (score / 10) * 100;
    const weightedScore = (score / 10) * weight;
    
    return {
      score,
      maxScore: 10,
      percentage,
      band: this.getScoreBand(score),
      weight,
      weightedScore,
      feedback,
      specificExamples,
      childFriendlyExplanation: this.generateChildFriendlyExplanation(domainName, score),
      concreteExamples,
      actionableSuggestions
    };
  }
  
  // ENHANCED: Improved language scoring with specific vocabulary feedback
  private static scoreLanguageFeatures(essay: string, analysis: DetailedFeedback, domainName: string): DomainScore {
    let score = 5;
    const feedback: string[] = [];
    const specificExamples: string[] = [];
    const concreteExamples: string[] = [];
    const actionableSuggestions: string[] = [];
    
    // Assess vocabulary sophistication
    const vocabScore = this.assessVocabularyScore(analysis.vocabularyAnalysis);
    const literaryDeviceScore = this.assessLiteraryDeviceScore(analysis.literaryDevices);
    const sentenceVarietyScore = this.assessSentenceVarietyScore(analysis.sentenceVariety);
    const voiceScore = this.assessVoice(essay);
    
    // Calculate weighted average
    score = Math.round((vocabScore * 0.4 + literaryDeviceScore * 0.3 + sentenceVarietyScore * 0.2 + voiceScore * 0.1));
    score = Math.max(1, Math.min(10, score));
    
    // Generate specific feedback with concrete examples
    const sophisticatedWords = analysis.vocabularyAnalysis.sophisticatedWords;
    const literaryDevices = analysis.literaryDevices.identified;
    
    if (score >= 9) {
      feedback.push("Exceptional vocabulary with sophisticated word choices");
      feedback.push("Masterful use of literary devices and techniques");
      feedback.push("Varied and engaging sentence structures");
      if (sophisticatedWords.length > 0) {
        concreteExamples.push(`Sophisticated vocabulary used: ${sophisticatedWords.slice(0, 3).join(', ')}`);
      }
    } else if (score >= 7) {
      feedback.push("Strong vocabulary with good word choices");
      feedback.push("Effective use of some literary devices");
      feedback.push("Good sentence variety");
      if (literaryDevices.length > 0) {
        concreteExamples.push(`Literary devices used: ${literaryDevices.join(', ')}`);
      }
    } else if (score >= 5) {
      feedback.push("Adequate vocabulary for the task");
      feedback.push("Some attempt at literary devices");
      feedback.push("Basic sentence structures with some variety");
      actionableSuggestions.push("Try using more descriptive adjectives and interesting verbs to make your writing more engaging.");
      if (literaryDevices.length === 0) {
        actionableSuggestions.push("Add similes (comparisons using 'like' or 'as') to make your descriptions more vivid.");
      }
    } else if (score >= 3) {
      feedback.push("Simple vocabulary with limited range");
      feedback.push("Minimal use of literary techniques");
      feedback.push("Mostly simple sentence structures");
      actionableSuggestions.push("Replace simple words with more interesting ones: instead of 'big,' try 'enormous' or 'gigantic.'");
      actionableSuggestions.push("Vary your sentence beginnings - don't start every sentence the same way.");
    } else {
      feedback.push("Very basic vocabulary");
      feedback.push("No evidence of literary devices");
      feedback.push("Repetitive sentence patterns");
      actionableSuggestions.push("Build your vocabulary by learning one new descriptive word each day.");
      actionableSuggestions.push("Practice writing sentences that start with different words.");
    }
    
    // Add specific examples from analysis
    specificExamples.push(...this.extractLanguageExamples(essay, analysis));
    
    const weight = 25;
    const percentage = (score / 10) * 100;
    const weightedScore = (score / 10) * weight;
    
    return {
      score,
      maxScore: 10,
      percentage,
      band: this.getScoreBand(score),
      weight,
      weightedScore,
      feedback,
      specificExamples,
      childFriendlyExplanation: this.generateChildFriendlyExplanation(domainName, score),
      concreteExamples,
      actionableSuggestions
    };
  }
  
  // ENHANCED: Improved grammar scoring with specific error feedback
  private static scoreSpellingAndGrammar(essay: string, analysis: DetailedFeedback, domainName: string): DomainScore {
    let score = 5;
    const feedback: string[] = [];
    const specificExamples: string[] = [];
    const concreteExamples: string[] = [];
    const actionableSuggestions: string[] = [];
    
    // Calculate error rates
    const wordCount = analysis.wordCount;
    const spellingErrorRate = wordCount > 0 ? analysis.technicalAccuracy.spellingErrors / wordCount : 0;
    const grammarIssueCount = analysis.technicalAccuracy.grammarIssues.length;
    const punctuationIssueCount = analysis.technicalAccuracy.punctuationIssues.length;
    const specificErrors = analysis.technicalAccuracy.specificErrors || [];
    
    // Score based on error frequency
    if (spellingErrorRate === 0 && grammarIssueCount === 0 && punctuationIssueCount === 0) {
      score = 10; // Outstanding
    } else if (spellingErrorRate <= 0.01 && grammarIssueCount <= 1 && punctuationIssueCount <= 1) {
      score = 9; // Excellent
    } else if (spellingErrorRate <= 0.03 && grammarIssueCount <= 2 && punctuationIssueCount <= 2) {
      score = 7; // Highly Proficient
    } else if (spellingErrorRate <= 0.05 && grammarIssueCount <= 4 && punctuationIssueCount <= 3) {
      score = 5; // Proficient
    } else if (spellingErrorRate <= 0.08 && grammarIssueCount <= 6 && punctuationIssueCount <= 5) {
      score = 3; // Basic
    } else {
      score = 1; // Limited
    }
    
    // Generate specific feedback with concrete examples
    if (score >= 9) {
      feedback.push("Virtually error-free spelling of sophisticated vocabulary");
      feedback.push("Excellent control of punctuation");
      feedback.push("Sophisticated grammatical structures used accurately");
      concreteExamples.push("Your careful proofreading shows in your accurate spelling and punctuation.");
    } else if (score >= 7) {
      feedback.push("Accurate spelling with occasional minor errors");
      feedback.push("Good control of punctuation");
      feedback.push("Complex grammatical structures generally used accurately");
      if (specificErrors.length > 0) {
        concreteExamples.push(`Minor errors found: ${specificErrors.slice(0, 2).map(e => e.type).join(', ')}`);
      }
    } else if (score >= 5) {
      feedback.push("Generally accurate spelling with some errors");
      feedback.push("Adequate control of punctuation");
      feedback.push("Simple and complex structures used with reasonable accuracy");
      // Provide specific examples of errors found
      specificErrors.forEach(error => {
        if (error.type === 'punctuation') {
          concreteExamples.push(`Punctuation: "${error.error}" should be "${error.correction}"`);
          actionableSuggestions.push(error.explanation);
        }
      });
    } else if (score >= 3) {
      feedback.push("Some spelling errors that may interfere with meaning");
      feedback.push("Basic punctuation with some errors");
      feedback.push("Simple structures used with some accuracy");
      // Provide specific guidance for common errors
      if (analysis.technicalAccuracy.grammarIssues.includes("Capitalization: 'I' should always be capitalized")) {
        concreteExamples.push("Remember to always capitalize the word 'I' in your writing.");
        actionableSuggestions.push("Check every use of 'I' in your writing to make sure it's capitalized.");
      }
    } else {
      feedback.push("Frequent spelling errors that interfere with meaning");
      feedback.push("Poor punctuation control");
      feedback.push("Frequent grammatical errors");
      actionableSuggestions.push("Focus on one type of error at a time - start with capitalizing 'I' and ending sentences with periods.");
      actionableSuggestions.push("Read your work aloud to catch errors your eyes might miss.");
    }
    
    // Add specific examples of errors and corrections
    if (analysis.technicalAccuracy.spellingErrors > 0) {
      specificExamples.push(`Spelling accuracy: ${Math.round((1 - spellingErrorRate) * 100)}%`);
    }
    if (grammarIssueCount > 0) {
      specificExamples.push(`Grammar issues identified: ${grammarIssueCount}`);
    }
    if (punctuationIssueCount > 0) {
      specificExamples.push(`Punctuation issues: ${punctuationIssueCount}`);
    }
    
    const weight = 15;
    const percentage = (score / 10) * 100;
    const weightedScore = (score / 10) * weight;
    
    return {
      score,
      maxScore: 10,
      percentage,
      band: this.getScoreBand(score),
      weight,
      weightedScore,
      feedback,
      specificExamples,
      childFriendlyExplanation: this.generateChildFriendlyExplanation(domainName, score),
      concreteExamples,
      actionableSuggestions
    };
  }
  
  // Helper methods (keeping existing implementations)
  private static getScoreBand(score: number): string {
    if (score >= 9) return "Outstanding";
    if (score >= 7) return "Highly Proficient";
    if (score >= 5) return "Proficient";
    if (score >= 3) return "Basic";
    if (score >= 1) return "Limited";
    return "No Response";
  }
  
  private static getOverallGrade(score: number): string {
    if (score >= 90) return "A+";
    if (score >= 85) return "A";
    if (score >= 80) return "A-";
    if (score >= 75) return "B+";
    if (score >= 70) return "B";
    if (score >= 65) return "B-";
    if (score >= 60) return "C+";
    if (score >= 55) return "C";
    if (score >= 50) return "C-";
    if (score >= 45) return "D+";
    if (score >= 40) return "D";
    if (score >= 35) return "D-";
    return "F";
  }
  
  private static assessCreativity(essay: string): number {
    let score = 5;
    
    // Check for creative elements
    if (/"/.test(essay)) score += 1; // Dialogue
    if (/metaphor|simile|like.*as|is.*like/i.test(essay)) score += 1; // Figurative language
    if (/suddenly|unexpectedly|amazingly|mysteriously/i.test(essay)) score += 0.5; // Surprise elements
    if (/whispered|shouted|gasped|exclaimed/i.test(essay)) score += 0.5; // Varied dialogue tags
    
    return Math.min(10, Math.max(1, Math.round(score)));
  }
  
  private static assessIdeaDevelopment(essay: string): number {
    const sentences = essay.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = essay.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    let score = 3;
    
    if (sentences.length >= 8) score += 2;
    else if (sentences.length >= 5) score += 1;
    
    if (paragraphs.length >= 3) score += 2;
    else if (paragraphs.length >= 2) score += 1;
    
    // Check for detailed descriptions
    if (/color|sound|smell|texture|feeling/i.test(essay)) score += 1;
    
    return Math.min(10, Math.max(1, Math.round(score)));
  }
  
  private static assessEngagement(essay: string): number {
    let score = 5;
    
    // Check for engaging elements
    const firstSentence = essay.split(/[.!?]+/)[0]?.trim();
    if (firstSentence && (firstSentence.includes('?') || firstSentence.length > 20)) {
      score += 1; // Engaging opening
    }
    
    if (/!/.test(essay)) score += 0.5; // Exclamation for emphasis
    if (/\?/.test(essay)) score += 0.5; // Questions for engagement
    
    return Math.min(10, Math.max(1, Math.round(score)));
  }
  
  private static identifySpecificErrors(essay: string): SpecificError[] {
    const errors: SpecificError[] = [];
    
    // Check for common capitalization errors
    const iErrors = essay.match(/\bi\s/g);
    if (iErrors) {
      errors.push({
        type: 'grammar',
        location: 'Throughout text',
        error: 'i',
        correction: 'I',
        explanation: 'The word "I" should always be capitalized.'
      });
    }
    
    // Check for missing punctuation at end of sentences
    const lines = essay.split('\n').filter(line => line.trim().length > 0);
    lines.forEach((line, index) => {
      if (line.trim().length > 10 && !/[.!?]$/.test(line.trim())) {
        errors.push({
          type: 'punctuation',
          location: `Line ${index + 1}`,
          error: line.trim(),
          correction: line.trim() + '.',
          explanation: 'Sentences should end with appropriate punctuation (. ! or ?).'
        });
      }
    });
    
    return errors;
  }
  
  private static identifySophisticatedVocabulary(essay: string): string[] {
    const sophisticatedWords = [
      'magnificent', 'extraordinary', 'mysterious', 'fascinating', 'incredible',
      'enormous', 'gigantic', 'minuscule', 'ancient', 'modern',
      'whispered', 'exclaimed', 'declared', 'announced', 'murmured',
      'brilliant', 'dazzling', 'shimmering', 'glistening', 'sparkling',
      'treacherous', 'perilous', 'adventurous', 'courageous', 'determined'
    ];
    
    const found: string[] = [];
    const words = essay.toLowerCase().split(/\s+/);
    
    sophisticatedWords.forEach(word => {
      if (words.includes(word.toLowerCase())) {
        found.push(word);
      }
    });
    
    return [...new Set(found)];
  }
  
  private static identifyRepetitiveWords(words: string[]): string[] {
    const wordCount: { [key: string]: number } = {};
    const repetitive: string[] = [];
    
    words.forEach(word => {
      const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
      if (cleanWord.length > 3) {
        wordCount[cleanWord] = (wordCount[cleanWord] || 0) + 1;
      }
    });
    
    Object.entries(wordCount).forEach(([word, count]) => {
      if (count > 3 && !['that', 'with', 'they', 'were', 'have', 'this', 'from'].includes(word)) {
        repetitive.push(word);
      }
    });
    
    return repetitive;
  }
  
  private static identifyLiteraryDevices(essay: string): string[] {
    const devices: string[] = [];
    
    // Metaphor detection
    if (/is a|was a|are|were/.test(essay) && !/literally/.test(essay)) {
      devices.push("Metaphor");
    }
    
    // Simile detection
    if (/like|as.*as/.test(essay)) {
      devices.push("Simile");
    }
    
    // Personification detection
    if (/wind.*whispered|sun.*smiled|trees.*danced|shadows.*crept/i.test(essay)) {
      devices.push("Personification");
    }
    
    // Alliteration detection
    const words = essay.split(/\s+/);
    for (let i = 0; i < words.length - 1; i++) {
      if (words[i][0] && words[i][0].toLowerCase() === words[i + 1][0]?.toLowerCase()) {
        devices.push("Alliteration");
        break;
      }
    }
    
    // Dialogue detection
    if (/"/.test(essay)) {
      devices.push("Dialogue");
    }
    
    return [...new Set(devices)];
  }
  
  private static hasEffectiveIntroduction(essay: string): boolean {
    const firstParagraph = essay.split(/\n\s*\n/)[0];
    return firstParagraph && firstParagraph.length > 50;
  }
  
  private static hasEffectiveConclusion(essay: string): boolean {
    const paragraphs = essay.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const lastParagraph = paragraphs[paragraphs.length - 1];
    return lastParagraph && lastParagraph.length > 30;
  }
  
  private static countSpellingErrors(essay: string): number {
    const commonMisspellings = [
      'recieve', 'seperate', 'definately', 'occured', 'begining',
      'untill', 'wich', 'thier', 'freind', 'beleive'
    ];
    
    let errors = 0;
    const words = essay.toLowerCase().split(/\s+/);
    words.forEach(word => {
      const cleanWord = word.replace(/[^\w]/g, '');
      if (commonMisspellings.includes(cleanWord)) {
        errors++;
      }
    });
    
    return errors;
  }
  
  private static identifyGrammarIssues(essay: string): string[] {
    const issues: string[] = [];
    
    if (/\bi\s/g.test(essay)) {
      issues.push("Capitalization: 'I' should always be capitalized");
    }
    
    if (/its'/g.test(essay)) {
      issues.push("Possessive: 'its' doesn't need an apostrophe");
    }
    
    if (/your\s+(going|coming|doing)/i.test(essay)) {
      issues.push("Contraction: Should be 'you're' not 'your'");
    }
    
    return issues;
  }
  
  private static identifyPunctuationIssues(essay: string): string[] {
    const issues: string[] = [];
    
    const sentences = essay.split(/\n/).filter(line => line.trim().length > 0);
    sentences.forEach(sentence => {
      if (sentence.trim().length > 10 && !/[.!?]$/.test(sentence.trim())) {
        issues.push("Missing end punctuation");
      }
    });
    
    if (/,\s*[a-z]/g.test(essay)) {
      issues.push("Possible comma splice");
    }
    
    return [...new Set(issues)];
  }
  
  private static analyzeSentenceVariety(simple: number, compound: number, complex: number): string {
    const total = simple + compound + complex;
    if (total === 0) return "No sentences detected";
    
    const simplePercent = (simple / total) * 100;
    const compoundPercent = (compound / total) * 100;
    const complexPercent = (complex / total) * 100;
    
    if (complexPercent > 40) return "Excellent sentence variety with strong use of complex structures";
    if (compoundPercent + complexPercent > 60) return "Good sentence variety";
    if (simplePercent > 70) return "Limited sentence variety - try using more complex structures";
    return "Adequate sentence variety";
  }
  
  private static generateVocabularySuggestions(repetitiveWords: string[]): string[] {
    return repetitiveWords.map(word => `Consider using synonyms for '${word}' to add variety`);
  }
  
  private static suggestLiteraryDevices(essay: string, identified: string[]): string[] {
    const suggestions: string[] = [];
    
    if (!identified.includes("Metaphor")) {
      suggestions.push("Try adding a metaphor to create vivid imagery");
    }
    if (!identified.includes("Simile")) {
      suggestions.push("Consider using similes to make comparisons more engaging");
    }
    if (!identified.includes("Personification")) {
      suggestions.push("Use personification to bring inanimate objects to life");
    }
    
    return suggestions;
  }
  
  private static assessCoherence(essay: string, paragraphs: string[]): string {
    if (paragraphs.length < 2) return "Limited";
    if (paragraphs.length >= 4) return "Strong";
    return "Adequate";
  }
  
  private static assessParagraphOrganization(essay: string): number {
    const paragraphs = essay.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    if (paragraphs.length >= 4) return 8;
    if (paragraphs.length >= 3) return 6;
    if (paragraphs.length >= 2) return 4;
    return 2;
  }
  
  private static assessCoherenceScore(coherence: string): number {
    switch (coherence) {
      case "Strong": return 8;
      case "Adequate": return 6;
      case "Limited": return 3;
      default: return 5;
    }
  }
  
  private static assessTransitions(essay: string): number {
    const transitionWords = ['however', 'therefore', 'furthermore', 'meanwhile', 'consequently', 'nevertheless', 'moreover'];
    let score = 4;
    
    transitionWords.forEach(word => {
      if (essay.toLowerCase().includes(word)) score += 0.5;
    });
    
    return Math.min(8, score);
  }
  
  private static assessVocabularyScore(vocabAnalysis: any): number {
    const sophisticatedCount = vocabAnalysis.sophisticatedWords.length;
    const repetitiveCount = vocabAnalysis.repetitiveWords.length;
    
    let score = 5;
    score += sophisticatedCount * 0.5;
    score -= repetitiveCount * 0.3;
    
    return Math.min(10, Math.max(1, Math.round(score)));
  }
  
  private static assessLiteraryDeviceScore(literaryDevices: any): number {
    const deviceCount = literaryDevices.identified.length;
    return Math.min(10, Math.max(1, 3 + deviceCount));
  }
  
  private static assessSentenceVarietyScore(sentenceVariety: any): number {
    const total = sentenceVariety.simple + sentenceVariety.compound + sentenceVariety.complex;
    if (total === 0) return 1;
    
    const complexRatio = sentenceVariety.complex / total;
    const compoundRatio = sentenceVariety.compound / total;
    
    if (complexRatio > 0.3) return 9;
    if (complexRatio > 0.2 || compoundRatio > 0.3) return 7;
    if (complexRatio > 0.1 || compoundRatio > 0.2) return 5;
    return 3;
  }
  
  private static assessVoice(essay: string): number {
    const firstPerson = (essay.match(/\bI\b/g) || []).length;
    const thirdPerson = (essay.match(/\b(he|she|they)\b/gi) || []).length;
    const totalWords = essay.split(/\s+/).length;
    
    if (firstPerson > totalWords * 0.02 || thirdPerson > totalWords * 0.05) {
      return 7;
    }
    
    return 5;
  }
  
  private static extractContentExamples(essay: string, score: number): string[] {
    const examples: string[] = [];
    const sentences = essay.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    if (sentences.length > 0) {
      examples.push(`Opening: "${sentences[0].trim()}..."`);
    }
    
    if (score >= 7) {
      examples.push("Demonstrates strong creative elements and original thinking");
    }
    
    return examples;
  }
  
  private static extractStructureExamples(essay: string, analysis: any): string[] {
    const examples: string[] = [];
    
    examples.push(`Paragraph count: ${analysis.structuralElements.paragraphCount}`);
    
    if (analysis.structuralElements.hasIntroduction) {
      examples.push("Effective introduction present");
    }
    
    if (analysis.structuralElements.hasConclusion) {
      examples.push("Clear conclusion present");
    }
    
    return examples;
  }
  
  private static extractLanguageExamples(essay: string, analysis: any): string[] {
    const examples: string[] = [];
    
    if (analysis.vocabularyAnalysis.sophisticatedWords.length > 0) {
      examples.push(`Sophisticated vocabulary: ${analysis.vocabularyAnalysis.sophisticatedWords.join(', ')}`);
    }
    
    if (analysis.literaryDevices.identified.length > 0) {
      examples.push(`Literary devices used: ${analysis.literaryDevices.identified.join(', ')}`);
    }
    
    return examples;
  }
  
  // NEW: Enhanced child-friendly explanation generator
  private static generateChildFriendlyExplanation(domain: string, score: number): string {
    switch (domain) {
      case "Content & Ideas":
        if (score >= 9) return "🌟 Wow! Your ideas are absolutely amazing and super creative! You have a wonderful imagination that makes your story really special and exciting to read.";
        if (score >= 7) return "✨ You have some really great and thoughtful ideas that make your writing interesting and fun to read. Your creativity is definitely shining through!";
        if (score >= 5) return "💡 Your ideas are good and show some creativity. With a bit more imagination and detail, you can make them even more exciting and engaging.";
        if (score >= 3) return "🌱 Your ideas are starting to form, but they need more imagination and specific details to truly come alive. Think about adding more descriptions or unexpected twists!";
        return "🎯 Your ideas need more development and creativity. Let's work together on brainstorming more imaginative and detailed ideas that will captivate your readers!";
      case "Text Structure":
        if (score >= 9) return "🏗️ Your writing flows perfectly like a well-told story! You have mastered organizing your ideas with a clear beginning, middle, and end.";
        if (score >= 7) return "📚 Your writing is well-organized and easy to follow. You've done a great job structuring your story so readers can enjoy it from start to finish.";
        if (score >= 5) return "🔗 Your writing has a clear plan, but sometimes the parts don't connect as smoothly as they could. Try using more connecting words to link your ideas!";
        if (score >= 3) return "🧩 Your writing is a bit jumbled, and it's hard to see how your ideas fit together. Let's practice organizing your thoughts step by step.";
        return "🗺️ Your writing is hard to follow because it doesn't have a clear order. Let's practice organizing your thoughts with a simple plan: beginning, middle, and end!";
      case "Language Features":
        if (score >= 9) return "🎨 You use amazing words and clever writing tricks that make your writing shine like a diamond! Your vocabulary and style are truly impressive.";
        if (score >= 7) return "📖 You use good words and some interesting writing techniques that make your story engaging and fun to read.";
        if (score >= 5) return "🔤 You use appropriate words, but trying out some new vocabulary and writing techniques could make your writing even more colorful and exciting.";
        if (score >= 3) return "📝 Your words are quite simple. Let's explore some more exciting vocabulary and fun writing techniques to make your stories more interesting.";
        return "🌈 Your vocabulary is very basic right now. Let's discover new words and fun ways to write that will make your stories much more exciting and engaging!";
      case "Spelling & Grammar":
        if (score >= 9) return "🎯 Your spelling, punctuation, and grammar are almost perfect! You're clearly a careful writer who pays attention to details.";
        if (score >= 7) return "✅ You make very few mistakes in spelling, punctuation, and grammar. Great job being careful with your writing mechanics!";
        if (score >= 5) return "⚠️ You have some mistakes in spelling, punctuation, or grammar, but your writing is still easy to understand. A little more proofreading will help!";
        if (score >= 3) return "🔍 You make several mistakes in spelling, punctuation, and grammar. Let's focus on one area at a time to improve your writing mechanics.";
        return "📚 You have quite a few mistakes in spelling, punctuation, and grammar. Let's start with the basics and build up your skills step by step!";
      default:
        return "Keep working on this area - every great writer started as a beginner!";
    }
  }
  
  // NEW: Generate personalized recommendations with concrete examples
  private static generatePersonalizedRecommendations(
    content: DomainScore, 
    structure: DomainScore, 
    language: DomainScore, 
    grammar: DomainScore,
    essayText: string
  ): PersonalizedRecommendation[] {
    const recommendations: PersonalizedRecommendation[] = [];
    const domains = [
      { name: "Ideas & Content", score: content.score, domain: content },
      { name: "Structure & Organization", score: structure.score, domain: structure },
      { name: "Language & Vocabulary", score: language.score, domain: language },
      { name: "Spelling & Grammar", score: grammar.score, domain: grammar }
    ];

    // Sort by score to prioritize lowest areas
    domains.sort((a, b) => a.score - b.score);

    // Generate recommendations for the lowest scoring areas
    for (const domainInfo of domains) {
      if (domainInfo.score <= 6 && recommendations.length < 3) { // Focus on areas that need improvement
        switch (domainInfo.name) {
          case "Ideas & Content":
            recommendations.push({
              title: "Develop Your Creative Ideas",
              description: "Make your ideas more interesting and detailed to captivate your readers.",
              examples: [
                "Instead of 'The door was old,' try 'The wooden door creaked and groaned, its rusty hinges protesting with every movement.'",
                "Add sensory details: What do you see, hear, smell, feel, and taste in your story?",
                "Create unexpected plot twists or unique character traits to surprise your readers."
              ],
              priority: 'high'
            });
            break;
          case "Structure & Organization":
            recommendations.push({
              title: "Improve Your Story Organization",
              description: "Help your readers follow your story by organizing your ideas in a logical, clear order.",
              examples: [
                "Plan with a simple outline: Beginning (introduce characters/setting) → Middle (main events/problem) → End (resolution)",
                "Use connecting words like 'First,' 'Then,' 'Meanwhile,' 'Finally' to link your ideas together",
                "Make sure each paragraph focuses on one main idea or event"
              ],
              priority: 'high'
            });
            break;
          case "Language & Vocabulary":
            recommendations.push({
              title: "Enhance Your Word Choice",
              description: "Use more exciting and varied vocabulary to make your writing more engaging.",
              examples: [
                "Replace simple words: instead of 'big,' try 'enormous,' 'gigantic,' or 'massive'",
                "Vary how you start sentences - not every sentence needs to begin the same way",
                "Try using similes: 'The cat moved like a shadow in the night'"
              ],
              priority: 'medium'
            });
            break;
          case "Spelling & Grammar":
            recommendations.push({
              title: "Master Writing Mechanics",
              description: "Focus on spelling, punctuation, and grammar to make your writing clear and easy to read.",
              examples: [
                "Always capitalize the word 'I' and the first word of each sentence",
                "Use commas after introductory phrases: 'After the storm passed, the sun came out'",
                "Read your work aloud to catch mistakes your eyes might miss"
              ],
              priority: 'high'
            });
            break;
        }
      }
    }

    // If all scores are good, provide growth recommendations
    if (recommendations.length === 0) {
      recommendations.push({
        title: "Challenge Yourself Further",
        description: "Your writing is already strong! Try these advanced techniques to make it even better.",
        examples: [
          "Experiment with different narrative perspectives (first person vs. third person)",
          "Try writing in different genres like mystery, fantasy, or science fiction",
          "Practice writing dialogue that reveals character personality"
        ],
        priority: 'low'
      });
    }

    return recommendations;
  }
  
  // NEW: Identify specific strengths with text examples
  private static identifySpecificStrengths(
    content: DomainScore, 
    structure: DomainScore, 
    language: DomainScore, 
    grammar: DomainScore,
    essayText: string
  ): SpecificStrength[] {
    const strengths: SpecificStrength[] = [];
    
    if (content.score >= 6) {
      const firstSentence = essayText.split(/[.!?]+/)[0]?.trim();
      strengths.push({
        area: "Creative Ideas",
        description: "You show great imagination and creativity in your writing.",
        textExample: firstSentence ? `Your opening: "${firstSentence}..."` : undefined,
        encouragement: "Your creative thinking makes your story unique and interesting to read!"
      });
    }
    
    if (structure.score >= 6) {
      const paragraphCount = essayText.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
      strengths.push({
        area: "Story Organization",
        description: "Your writing has a clear structure that's easy to follow.",
        textExample: paragraphCount > 1 ? `You organized your ideas into ${paragraphCount} clear paragraphs` : undefined,
        encouragement: "Good organization helps readers enjoy your story from beginning to end!"
      });
    }
    
    if (language.score >= 6) {
      strengths.push({
        area: "Word Choice",
        description: "You use interesting and appropriate words to express your ideas.",
        encouragement: "Your vocabulary choices help create vivid pictures in the reader's mind!"
      });
    }
    
    if (grammar.score >= 6) {
      strengths.push({
        area: "Writing Mechanics",
        description: "You show good control of spelling, punctuation, and grammar.",
        encouragement: "Your attention to detail makes your writing clear and easy to understand!"
      });
    }

    return strengths;
  }
  
  // NEW: Identify specific improvements with concrete examples
  private static identifySpecificImprovements(
    content: DomainScore, 
    structure: DomainScore, 
    language: DomainScore, 
    grammar: DomainScore,
    essayText: string
  ): SpecificImprovement[] {
    const improvements: SpecificImprovement[] = [];
    
    if (content.score < 6) {
      improvements.push({
        area: "Ideas & Content",
        issue: "Your ideas need more development and creative details.",
        suggestion: "Add specific descriptions and examples to bring your ideas to life.",
        concreteExample: "Instead of saying 'The place was nice,' describe what made it special: the colors, sounds, or feelings it gave you."
      });
    }
    
    if (structure.score < 6) {
      improvements.push({
        area: "Structure & Organization",
        issue: "Your writing could be better organized to help readers follow your story.",
        suggestion: "Plan your writing with a clear beginning, middle, and end before you start.",
        concreteExample: "Try making an outline: Introduction (hook the reader) → Body (main events) → Conclusion (wrap up the story)."
      });
    }
    
    if (language.score < 6) {
      improvements.push({
        area: "Language & Vocabulary",
        issue: "Your vocabulary could be more varied and interesting.",
        suggestion: "Try using more descriptive and exciting words instead of simple ones.",
        concreteExample: "Instead of 'walked,' try 'strolled,' 'marched,' 'tiptoed,' or 'wandered' depending on how the character moved."
      });
    }
    
    if (grammar.score < 6) {
      // Check for specific issues in the text
      const hasCommaIssues = /afternoon you|However you|Finally you/.test(essayText);
      const hasCapitalizationIssues = /\bi\s/.test(essayText);
      
      if (hasCommaIssues) {
        improvements.push({
          area: "Punctuation",
          issue: "Missing commas after introductory phrases.",
          suggestion: "Remember to use a comma after introductory words or phrases.",
          concreteExample: "Change 'One rainy afternoon you stumble upon...' to 'One rainy afternoon, you stumble upon...'",
          textReference: "Found in your essay: missing comma after introductory phrase"
        });
      } else if (hasCapitalizationIssues) {
        improvements.push({
          area: "Capitalization",
          issue: "The word 'I' should always be capitalized.",
          suggestion: "Always write 'I' as a capital letter, even in the middle of sentences.",
          concreteExample: "Change 'i went to the store' to 'I went to the store'",
          textReference: "Found in your essay: lowercase 'i'"
        });
      } else {
        improvements.push({
          area: "Spelling & Grammar",
          issue: "Some spelling, punctuation, or grammar errors need attention.",
          suggestion: "Proofread your work carefully, focusing on one type of error at a time.",
          concreteExample: "Read your work aloud to catch mistakes your eyes might miss."
        });
      }
    }

    return improvements;
  }
  
  // NEW: Generate child-friendly explanations for all domains
  private static generateChildFriendlyExplanations(
    content: DomainScore, 
    structure: DomainScore, 
    language: DomainScore, 
    grammar: DomainScore
  ): ChildFriendlyExplanations {
    return {
      ideasContent: content.childFriendlyExplanation,
      structure: structure.childFriendlyExplanation,
      language: language.childFriendlyExplanation,
      grammar: grammar.childFriendlyExplanation
    };
  }
}
