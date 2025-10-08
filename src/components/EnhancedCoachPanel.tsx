import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, MessageSquare, BarChart3, Lightbulb, Target, Star, TrendingUp, Award } from 'lucide-react';

// Helper function to calculate readability (Flesch-Kincaid Grade Level)
const calculateFleschKincaid = (text: string): number => {
  if (!text || text.trim().length === 0) return 0;
  const sentences = text.split(/[.!?]+/g).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/g).filter(w => w.trim().length > 0);
  const syllables = words.reduce((acc, word) => acc + countSyllables(word), 0);

  if (sentences.length === 0 || words.length === 0) return 0;

  const ASL = words.length / sentences.length;
  const ASW = syllables / words.length;

  return 0.39 * ASL + 11.8 * ASW - 15.59;
};

const countSyllables = (word: string): number => {
  word = word.toLowerCase();
  if (word.length === 0) return 0;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 0;
};

// NSW Criteria Analysis Engine
class NSWCriteriaAnalyzer {
  static analyzeContent(content: string, textType: string, wordCount: number, elapsedTime: number) {
    return {
      ideas: this.analyzeIdeasAndContent(content, textType, wordCount, elapsedTime),
      language: this.analyzeLanguageAndVocabulary(content, wordCount, elapsedTime),
      structure: this.analyzeStructureAndOrganization(content, wordCount, elapsedTime),
      grammar: this.analyzeGrammarAndSpelling(content, wordCount, elapsedTime)
    };
  }

  static analyzeIdeasAndContent(content: string, textType: string, wordCount: number, elapsedTime: number) {
    let score = 1;
    const feedback: string[] = [];
    const improvements: string[] = [];
    let strength = "";
    let improvementArea = "";

    if (wordCount === 0) {
      return {
        score: 1,
        feedback: ["Start writing to see your ideas assessment!"],
        improvements: ["Begin by addressing the prompt and developing your main ideas."],
        strength: "",
        improvementArea: ""
      };
    }

    // Prompt engagement (example: assuming a prompt about a mysterious key in an attic)
    const promptKeywords = ['key', 'chest', 'attic', 'grandmother', 'mystery'];
    const engagedKeywords = promptKeywords.filter(keyword => content.toLowerCase().includes(keyword));
    if (engagedKeywords.length >= 2) {
      score += 1;
      feedback.push(`You're engaging well with the prompt by mentioning key elements like '${engagedKeywords.join(", ")}'.`);
      strength = `Engaging with prompt elements like '${engagedKeywords[0]}'.`;
    } else if (engagedKeywords.length > 0) {
      improvements.push("Try to include more elements from the writing prompt to fully address it.");
      improvementArea = "Further prompt engagement.";
    } else {
      improvements.push("Ensure your writing directly addresses the prompt. What are the main ideas you need to cover?");
      improvementArea = "Directly addressing the prompt.";
    }

    // Originality/Creativity (basic check)
    const creativeIndicators = ['unexpected', 'suddenly', 'imagined', 'peculiar', 'unique'];
    if (creativeIndicators.some(word => content.toLowerCase().includes(word))) {
      score += 1;
      feedback.push("Your writing shows signs of originality and creative thinking!");
      if (!strength) strength = "Creative ideas.";
    } else {
      improvements.push("Think about adding a unique twist or an unexpected event to make your story more original.");
      if (!improvementArea) improvementArea = "Adding originality.";
    }

    // Development: Ideas explained with details/examples
    if (wordCount > 100 && content.split(/\n\n|\n/).filter(p => p.trim().length > 0).length >= 2) {
      score += 1;
      feedback.push("You're developing your ideas with some detail across paragraphs.");
      if (!strength) strength = "Developing ideas.";
    } else if (wordCount > 50) {
      improvements.push("Expand on your main ideas with more descriptive details and examples.");
      if (!improvementArea) improvementArea = "Expanding on ideas.";
    }

    // Relevance: Stays on topic throughout
    // This is harder to assess without NLP, but we can do a basic check for consistency
    if (wordCount > 150 && engagedKeywords.length > 0 && content.split(engagedKeywords[0]).length > 2) {
      score += 1;
      feedback.push("Your writing generally stays relevant to the prompt.");
      if (!strength) strength = "Maintaining relevance.";
    } else if (wordCount > 50) {
      improvements.push("Periodically check if your writing is still focused on the main topic and prompt.");
      if (!improvementArea) improvementArea = "Staying on topic.";
    }

    return {
      score: Math.min(score, 5),
      feedback,
      improvements,
      strength,
      improvementArea
    };
  }

  static analyzeLanguageAndVocabulary(content: string, wordCount: number, elapsedTime: number) {
    let score = 1;
    const feedback: string[] = [];
    const improvements: string[] = [];
    let strength = "";
    let improvementArea = "";

    if (wordCount === 0) {
      return {
        score: 1,
        feedback: ["Start writing to see your language assessment!"],
        improvements: ["Begin writing to analyze your vocabulary and language use."],
        strength: "",
        improvementArea: ""
      };
    }

    const words = content.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    const uniqueWords = new Set(words);
    const vocabularyVariety = uniqueWords.size / words.length;

    // Vocabulary variety
    if (vocabularyVariety > 0.6) {
      score += 1;
      feedback.push("Excellent vocabulary variety! You're using diverse words effectively.");
      strength = "Diverse vocabulary.";
    } else if (vocabularyVariety > 0.4) {
      improvements.push("Good vocabulary variety. Keep expanding your word choices and avoid repetition.");
      improvementArea = "Expanding word choices.";
    } else {
      improvements.push("Work on using more varied vocabulary to make your writing more interesting. Try a thesaurus!");
      improvementArea = "Using varied vocabulary.";
    }

    // Sophisticated words (example list)
    const sophisticatedWords = ['magnificent', 'extraordinary', 'mysterious', 'shimmering', 'ornate', 'ancient', 'whispered', 'discovered', 'pondered', 'enveloped', 'intricate', 'resplendent'];
    const foundSophisticatedWords = sophisticatedWords.filter(word => content.toLowerCase().includes(word));
    if (foundSophisticatedWords.length >= 2) {
      score += 1;
      feedback.push(`Great use of sophisticated vocabulary like '${foundSophisticatedWords.join(", ")}'!`);
      if (!strength) strength = "Sophisticated vocabulary.";
    } else if (foundSophisticatedWords.length > 0) {
      improvements.push("Try incorporating more advanced vocabulary words to enhance your writing.");
      if (!improvementArea) improvementArea = "Incorporating advanced vocabulary.";
    }

    // Figurative language (basic check for similes/metaphors)
    const figurativeIndicators = ['like a', 'as a', 'was a', 'is a', 'like the', 'as the'];
    if (figurativeIndicators.some(phrase => content.toLowerCase().includes(phrase))) {
      score += 1;
      feedback.push("Nice use of figurative language to create vivid imagery!");
      if (!strength) strength = "Figurative language.";
    } else {
      improvements.push("Consider adding similes or metaphors to make your descriptions more imaginative.");
      if (!improvementArea) improvementArea = "Adding figurative language.";
    }

    // Sensory details (basic check)
    const sensoryWords = ['smell', 'taste', 'feel', 'sound', 'sight', 'glowing', 'whispering', 'rough', 'sweet', 'dazzling'];
    if (sensoryWords.some(word => content.toLowerCase().includes(word))) {
      score += 1;
      feedback.push("You're appealing to the senses, bringing your writing to life!");
      if (!strength) strength = "Sensory details.";
    } else {
      improvements.push("Engage the reader's senses by describing what characters see, hear, smell, taste, and feel.");
      if (!improvementArea) improvementArea = "Adding sensory details.";
    }

    return {
      score: Math.min(score, 5),
      feedback,
      improvements,
      strength,
      improvementArea
    };
  }

  static analyzeStructureAndOrganization(content: string, wordCount: number, elapsedTime: number) {
    let score = 1;
    const feedback: string[] = [];
    const improvements: string[] = [];
    let strength = "";
    let improvementArea = "";

    if (wordCount === 0) {
      return {
        score: 1,
        feedback: ["Start writing to see your structure assessment!"],
        improvements: ["Begin writing to analyze your story structure."],
        strength: "",
        improvementArea: ""
      };
    }

    const paragraphs = content.split(/\n\n|\n/).filter(p => p.trim().length > 0);

    // Clear opening
    if (paragraphs.length > 0 && paragraphs[0].length > 30) {
      score += 1;
      feedback.push("You have a clear opening that sets the scene.");
      strength = "Clear opening.";
    } else {
      improvements.push("Start with a strong opening that hooks the reader and introduces the setting/characters.");
      improvementArea = "Strong opening.";
    }

    // Logical paragraph organization
    if (paragraphs.length >= 3 && wordCount > 100) {
      score += 1;
      feedback.push("Good use of paragraphs to organize different ideas.");
      if (!strength) strength = "Logical paragraphing.";
    } else if (paragraphs.length >= 2) {
      improvements.push("Ensure each paragraph focuses on a single main idea or event.");
      if (!improvementArea) improvementArea = "Paragraph focus.";
    } else {
      improvements.push("Break your writing into paragraphs to organize your thoughts and make it easier to read.");
      if (!improvementArea) improvementArea = "Using paragraphs.";
    }

    // Smooth transitions (basic check for transition words)
    const transitionWords = ['however', 'therefore', 'meanwhile', 'subsequently', 'in addition', 'furthermore', 'consequently'];
    if (transitionWords.some(word => content.toLowerCase().includes(word)) && paragraphs.length > 1) {
      score += 1;
      feedback.push("You're using some transition words to connect your ideas.");
      if (!strength) strength = "Transition words.";
    } else if (paragraphs.length > 1) {
      improvements.push("Use transition words and phrases to create a smoother flow between sentences and paragraphs.");
      if (!improvementArea) improvementArea = "Smooth transitions.";
    }

    // Satisfying conclusion (basic check for length and concluding phrases)
    if (wordCount >= 200 && paragraphs.length > 3 && (content.toLowerCase().includes('in the end') || content.toLowerCase().includes('finally') || content.toLowerCase().includes('and so')) && paragraphs[paragraphs.length - 1].length > 50) {
      score += 1;
      feedback.push("Your story is building towards a satisfying conclusion.");
      if (!strength) strength = "Developing conclusion.";
    } else if (wordCount >= 150) {
      improvements.push("Plan a clear and satisfying ending that wraps up your story.");
      if (!improvementArea) improvementArea = "Clear conclusion.";
    }

    // Appropriate text type structure (narrative, persuasive, expository - simplified)
    if (textType === 'narrative' && (content.toLowerCase().includes('story') || content.toLowerCase().includes('character'))) {
      score += 1;
      feedback.push("Your structure aligns with narrative writing.");
      if (!strength) strength = "Appropriate narrative structure.";
    } else if (textType === 'persuasive' && (content.toLowerCase().includes('should') || content.toLowerCase().includes('believe'))) {
      score += 1;
      feedback.push("Your structure aligns with persuasive writing.");
      if (!strength) strength = "Appropriate persuasive structure.";
    }

    return {
      score: Math.min(score, 5),
      feedback,
      improvements,
      strength,
      improvementArea
    };
  }

  static analyzeGrammarAndSpelling(content: string, wordCount: number, elapsedTime: number) {
    let score = 1;
    const feedback: string[] = [];
    const improvements: string[] = [];
    let strength = "";
    let improvementArea = "";

    if (wordCount === 0) {
      return {
        score: 1,
        feedback: ["Start writing to see your grammar assessment!"],
        improvements: ["Begin writing to analyze your grammar and spelling."],
        strength: "",
        improvementArea: ""
      };
    }

    // Capital letters at sentence starts
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const properCapitalization = sentences.every(sentence => {
      const trimmed = sentence.trim();
      return trimmed.length === 0 || /^[A-Z]/.test(trimmed);
    });

    if (properCapitalization && sentences.length > 0) {
      score += 1;
      feedback.push("Excellent capitalization at the start of sentences!");
      strength = "Correct capitalization.";
    } else if (sentences.length > 0) {
      improvements.push("Remember to start each sentence with a capital letter.");
      improvementArea = "Capitalization.";
    }

    // Correct punctuation (periods, commas, quotes) - basic check
    const hasPeriods = content.includes('.');
    const hasCommas = content.includes(',');
    if (hasPeriods && hasCommas) {
      score += 1;
      feedback.push("Good use of periods and commas.");
      if (!strength) strength = "Punctuation.";
    } else if (hasPeriods || hasCommas) {
      improvements.push("Ensure you're using a variety of punctuation marks correctly.");
      if (!improvementArea) improvementArea = "Varied punctuation.";
    } else {
      improvements.push("Don't forget to use punctuation marks like periods, commas, and question marks.");
      if (!improvementArea) improvementArea = "Using punctuation.";
    }

    // Common spelling errors (example list)
    const commonErrors = ['teh', 'adn', 'hte', 'recieve', 'seperate', 'wierd', 'beleive'];
    const hasCommonErrors = commonErrors.some(error => content.toLowerCase().includes(error));

    if (!hasCommonErrors && wordCount > 10) {
      score += 1;
      feedback.push("Great spelling accuracy!");
      if (!strength) strength = "Accurate spelling.";
    } else if (wordCount > 10) {
      improvements.push("Double-check your spelling, especially for common words. A quick proofread helps!");
      if (!improvementArea) improvementArea = "Spelling accuracy.";
    }

    // Sentence variety (based on average sentence length and complexity)
    const avgSentenceLength = wordCount / sentences.length;
    const fleschKincaidGrade = calculateFleschKincaid(content);

    if (sentences.length > 3 && avgSentenceLength > 8 && avgSentenceLength < 25 && fleschKincaidGrade > 3 && fleschKincaidGrade < 9) {
      score += 1;
      feedback.push("You're using a good variety of sentence lengths and structures.");
      if (!strength) strength = "Sentence variety.";
    } else if (sentences.length > 1) {
      improvements.push("Try varying your sentence lengths and structures to make your writing more engaging.");
      if (!improvementArea) improvementArea = "Varying sentence structure.";
    }

    // Subject-verb agreement (very basic check, hard without full NLP)
    // This would require a more advanced NLP library. For now, we'll assume basic correctness if other grammar is good.
    if (score >= 3 && wordCount > 20) {
      feedback.push("Your subject-verb agreement seems generally correct.");
      if (!strength) strength = "Subject-verb agreement.";
    }

    return {
      score: Math.max(1, Math.min(score, 5)),
      feedback,
      improvements,
      strength,
      improvementArea
    };
  }
}

// Enhanced Coach Response Generator
class EnhancedCoachResponseGenerator {
  static generateResponse(content: string, textType: string, analysis: any, wordCount: number, elapsedTime: number, lastFeedbackType?: string, strugglingWriter: boolean = false, advancedWriter: boolean = false) {
    const writingPhase = this.getWritingPhase(wordCount);
    const timePhase = this.getTimePhase(elapsedTime);

    // Prioritize error handling feedback if critical issues are detected
    const criticalError = this.checkForCriticalErrors(content, wordCount, elapsedTime);
    if (criticalError) {
      return criticalError;
    }

    // Check for specific user questions if chat intelligence is active
    // This part would typically involve NLP on the user's chat input, but for auto-coach, we focus on writing state.

    // Find the lowest scoring criterion to focus on, but also consider phase and time
    const scores = {
      ideas: analysis.ideas.score * 0.4, // Apply weights
      language: analysis.language.score * 0.25,
      structure: analysis.structure.score * 0.2,
      grammar: analysis.grammar.score * 0.15
    };

    let focusCriterion = 'ideas'; // Default focus
    let minScore = scores.ideas;

    if (scores.language < minScore) { minScore = scores.language; focusCriterion = 'language'; }
    if (scores.structure < minScore) { minScore = scores.structure; focusCriterion = 'structure'; }
    if (scores.grammar < minScore) { minScore = scores.grammar; focusCriterion = 'grammar'; }

    // Adjust focus based on writing phase and time
    if (writingPhase === 'opening' && analysis.ideas.score < 3) focusCriterion = 'ideas';
    if (writingPhase === 'development' && analysis.structure.score < 3) focusCriterion = 'structure';
    if (writingPhase === 'conclusion' && analysis.structure.score < 3) focusCriterion = 'structure';

    // Time-aware coaching overrides
    if (timePhase === 'start' && wordCount < 20) {
      return this.generateTimeAwareResponse('start', wordCount, strugglingWriter);
    }
    if (timePhase === 'middle' && wordCount < 100) {
      return this.generateTimeAwareResponse('middle', wordCount, strugglingWriter);
    }
    if (timePhase === 'wrapUp' && wordCount < 200) {
      return this.generateTimeAwareResponse('wrapUp', wordCount, strugglingWriter);
    }
    if (timePhase === 'finalMinutes') {
      return this.generateTimeAwareResponse('finalMinutes', wordCount, strugglingWriter);
    }

    // Adaptive difficulty adjustment
    let encouragementPrefix = "";
    let suggestionModifier = "";
    if (strugglingWriter) {
      encouragementPrefix = "Keep going! ";
      suggestionModifier = "Let's focus on one simple thing: ";
    } else if (advancedWriter) {
      encouragementPrefix = "Fantastic work! ";
      suggestionModifier = "To elevate your writing even further, consider: ";
    }

    const responses = {
      ideas: this.generateIdeasResponse(content, analysis.ideas, wordCount, strugglingWriter, advancedWriter),
      language: this.generateLanguageResponse(content, analysis.language, wordCount, strugglingWriter, advancedWriter),
      structure: this.generateStructureResponse(content, analysis.structure, wordCount, strugglingWriter, advancedWriter),
      grammar: this.generateGrammarResponse(content, analysis.grammar, wordCount, strugglingWriter, advancedWriter)
    };

    const chosenResponse = responses[focusCriterion];
    chosenResponse.encouragement = encouragementPrefix + chosenResponse.encouragement;
    chosenResponse.suggestion = suggestionModifier + chosenResponse.suggestion;

    // Progress celebration
    if (wordCount === 50) chosenResponse.encouragement += " You've hit 50 words! Keep up the great work! 🌟";
    if (wordCount === 100) chosenResponse.encouragement += " Wow, 100 words already! You're on fire! 🔥";
    if (wordCount === 200) chosenResponse.encouragement += " Two hundred words! Amazing progress! ✨";

    return chosenResponse;
  }

  static getWritingPhase(wordCount: number): 'opening' | 'development' | 'risingAction' | 'conclusion' | 'start' {
    if (wordCount === 0) return 'start';
    if (wordCount <= 50) return 'opening';
    if (wordCount <= 150) return 'development';
    if (wordCount <= 250) return 'risingAction';
    return 'conclusion';
  }

  static getTimePhase(elapsedTime: number): 'start' | 'middle' | 'wrapUp' | 'finalMinutes' | 'over' {
    const totalTime = 40 * 60; // 40 minutes in seconds
    if (elapsedTime < 10 * 60) return 'start'; // First 10 mins
    if (elapsedTime < 20 * 60) return 'middle'; // 10-20 mins
    if (elapsedTime < 30 * 60) return 'wrapUp'; // 20-30 mins
    if (elapsedTime < 35 * 60) return 'finalMinutes'; // 30-35 mins
    if (elapsedTime < totalTime) return 'finalMinutes'; // 35-40 mins
    return 'over';
  }

  static checkForCriticalErrors(content: string, wordCount: number, elapsedTime: number) {
    if (wordCount > 0 && content.split(/\s+/).length < 10 && elapsedTime > 5 * 60) {
      return {
        encouragement: "It looks like you're a bit stuck. Don't worry, it happens!",
        nswFocus: "Getting Started",
        suggestion: "If you're finding it hard to start, try writing down any ideas that come to mind, even if they're not perfect.",
        example: "Try these sentence starters: 'The old key...', 'In the dusty attic...', 'Grandmother always said...', 'I never expected to find...'
        nextStep: "Pick one sentence starter and just keep writing for a minute or two."
      };
    }
    if (wordCount > 300 && elapsedTime < 15 * 60) {
      return {
        encouragement: "You're writing very quickly! That's great energy!",
        nswFocus: "Pacing",
        suggestion: "Remember, quality over speed. Take a moment to review what you've written. Are your ideas clear and well-developed?",
        example: "Read your last paragraph aloud. Does it make sense? Can you add more details?",
        nextStep: "Slow down a little and focus on adding more descriptive words or expanding on an idea."
      };
    }
    // Basic off-topic check (very rudimentary)
    const promptKeywords = ['key', 'chest', 'attic', 'grandmother', 'mystery'];
    const engagedKeywords = promptKeywords.filter(keyword => content.toLowerCase().includes(keyword));
    if (wordCount > 50 && engagedKeywords.length === 0) {
      return {
        encouragement: "Your writing is flowing well!",
        nswFocus: "Prompt Engagement",
        suggestion: "Just a friendly reminder to check if your story is still connected to the original prompt. Are you including the key elements?",
        example: "If the prompt was about a 'mysterious key', make sure the key plays an important role.",
        nextStep: "Try to weave in one of the prompt's main ideas into your next sentence."
      };
    }
    return null;
  }

  static generateTimeAwareResponse(phase: 'start' | 'middle' | 'wrapUp' | 'finalMinutes' | 'over', wordCount: number, strugglingWriter: boolean) {
    switch (phase) {
      case 'start':
        return {
          encouragement: "Great start! Focus on getting your ideas flowing. 🚀",
          nswFocus: "Ideas & Content",
          suggestion: strugglingWriter ? "Just get some words down, any ideas are good ideas!" : "Brainstorm a few key events for your story.",
          example: "Try to describe the setting or introduce your main character.",
          nextStep: "Aim for your first 50 words."
        };
      case 'middle':
        return {
          encouragement: "You're making good progress. Let's make sure each paragraph is well-developed. 📝",
          nswFocus: "Structure & Organization",
          suggestion: strugglingWriter ? "Focus on adding one more detail to your current paragraph." : "Expand on your ideas with more descriptive language and examples.",
          example: "If you're describing a character, what do they look like, sound like, or feel like?",
          nextStep: "Try to reach 150 words."
        };
      case 'wrapUp':
        return {
          encouragement: "Excellent pace! Start thinking about your conclusion. 🎯",
          nswFocus: "Structure & Organization",
          suggestion: strugglingWriter ? "How can you bring your story to a simple close?" : "Plan a satisfying ending that resolves the main conflict or idea.",
          example: "Think about what your character learns or how things change by the end.",
          nextStep: "Aim to start your concluding paragraph soon."
        };
      case 'finalMinutes':
        return {
          encouragement: "Final minutes! Review and polish your work. ✨",
          nswFocus: "Spelling & Grammar",
          suggestion: strugglingWriter ? "Read through your story for any obvious mistakes." : "Check for strong opening and closing sentences, and varied vocabulary.",
          example: "Look for capital letters at the start of sentences and periods at the end.",
          nextStep: "Proofread carefully for any errors."
        };
      default:
        return this.generateGeneralResponse(content, wordCount);
    }
  }

  static generateIdeasResponse(content: string, ideasAnalysis: any, wordCount: number, strugglingWriter: boolean, advancedWriter: boolean) {
    if (wordCount === 0) {
      return {
        encouragement: "Ready to start your creative journey? 🌟",
        nswFocus: "Ideas & Content",
        suggestion: "Begin by thinking about the mysterious key and chest from the prompt. What makes them special?",
        example: "Try starting with: 'The old key felt warm in my hand, as if it held ancient secrets...'",
        nextStep: "Write your opening sentence and describe what you see in the attic."
      };
    }

    if (ideasAnalysis.score <= 2) {
      return {
        encouragement: strugglingWriter ? "You're doing great! Let's get more ideas down." : "Great start! Let's develop your ideas further. 💡",
        nswFocus: "Ideas & Content",
        suggestion: strugglingWriter ? "Add one more detail about the key or the attic." : "Add more specific details about the key, chest, and your character's feelings.",
        example: "Instead of 'I found a key,' try 'I discovered an ornate silver key that seemed to glow in the dusty attic light.'",
        nextStep: "Describe what your character is thinking and feeling as they hold the key."
      };
    }

    if (ideasAnalysis.score <= 3) {
      return {
        encouragement: "Your ideas are developing nicely! 🎯",
        nswFocus: "Ideas & Content",
        suggestion: advancedWriter ? "Can you introduce a subplot or a deeper meaning to your discovery?" : "Expand on the mystery - what might be inside the chest? What does your character hope to find?",
        example: "Add thoughts like: 'Could it contain grandmother's lost treasures, or something even more magical?'",
        nextStep: "Build suspense by describing the moment before opening the chest."
      };
    }

    return {
      encouragement: "Excellent creative ideas! Your story is captivating! ⭐",
      nswFocus: "Ideas & Content",
      suggestion: advancedWriter ? "Consider exploring the thematic implications of your story. What message are you conveying?" : "Continue developing the consequences of the discovery - how does it change your character?",
      example: "Show the impact: 'As the chest opened, everything I thought I knew about my family changed forever.'",
      nextStep: "Develop the resolution and what your character learns from this experience."
    };
  }

  static generateLanguageResponse(content: string, languageAnalysis: any, wordCount: number, strugglingWriter: boolean, advancedWriter: boolean) {
    if (wordCount === 0) {
      return {
        encouragement: "Let's focus on using amazing vocabulary! 📚",
        nswFocus: "Language & Vocabulary",
        suggestion: "Use descriptive words to paint a picture for your readers.",
        example: "Instead of 'old chest,' try 'ancient, weathered chest' or 'mysterious, ornate chest.'",
        nextStep: "Choose vivid adjectives to describe the attic setting."
      };
    }

    if (languageAnalysis.score <= 2) {
      return {
        encouragement: strugglingWriter ? "Good start! Let's find one stronger word." : "Good start! Let's enhance your word choices. 🎨",
        nswFocus: "Language & Vocabulary",
        suggestion: strugglingWriter ? "Replace a simple word like 'walked' with 'crept' or 'strolled'." : "Replace simple words with more interesting alternatives.",
        example: "Change 'walked' to 'crept,' 'big' to 'enormous,' or 'nice' to 'magnificent.'",
        nextStep: "Look for one simple word in your writing and replace it with a more exciting one."
      };
    }

    if (languageAnalysis.score <= 3) {
      return {
        encouragement: "Your vocabulary is improving! 🌟",
        nswFocus: "Language & Vocabulary",
        suggestion: advancedWriter ? "Can you use a metaphor or personification to describe an object or feeling?" : "Add more sensory details - what does your character see, hear, smell, or feel?",
        example: "Try: 'The musty smell of old books filled my nostrils as dust particles danced in the afternoon sunlight.'",
        nextStep: "Include at least one sentence that appeals to the senses."
      };
    }

    return {
      encouragement: "Outstanding vocabulary choices! 🏆",
      nswFocus: "Language & Vocabulary",
      suggestion: advancedWriter ? "Challenge yourself to use more complex sentence structures, like starting with a subordinate clause." : "Your word variety is excellent! Consider adding figurative language like similes or metaphors.",
      example: "Try: 'The key sparkled like a fallen star' or 'My heart pounded like thunder.'",
      nextStep: "Add one simile or metaphor to make your writing even more vivid."
    };
  }

  static generateStructureResponse(content: string, structureAnalysis: any, wordCount: number, strugglingWriter: boolean, advancedWriter: boolean) {
    if (wordCount === 0) {
      return {
        encouragement: "Let's build a well-organized story! 🏗️",
        nswFocus: "Structure & Organization",
        suggestion: "Start with a clear beginning that sets the scene.",
        example: "Open with: 'One sunny afternoon, while exploring grandmother's dusty attic...'",
        nextStep: "Write an opening sentence that tells when and where your story takes place."
      };
    }

    if (structureAnalysis.score <= 2) {
      return {
        encouragement: strugglingWriter ? "Good beginning! Let's try to make a new paragraph." : "Good beginning! Let's organize your story better. 📋",
        nswFocus: "Structure & Organization",
        suggestion: strugglingWriter ? "When you change to a new idea, start a new paragraph." : "Use paragraphs to separate different parts of your story.",
        example: "Start a new paragraph when you move from finding the key to opening the chest.",
        nextStep: "Break your writing into at least 2-3 paragraphs with different ideas in each."
      };
    }

    if (structureAnalysis.score <= 3) {
      return {
        encouragement: "Your story structure is developing well! 🎯",
        nswFocus: "Structure & Organization",
        suggestion: advancedWriter ? "How can you build tension or suspense more effectively through your paragraph breaks?" : "Make sure your story has a clear beginning, middle, and end.",
        example: "Beginning: Finding the key, Middle: Opening the chest, End: What happens next.",
        nextStep: "Work on developing the middle part of your story with more events."
      };
    }

    return {
      encouragement: "Fantastic organization! Your story flows beautifully! 🌟",
      nswFocus: "Structure & Organization",
      suggestion: advancedWriter ? "Experiment with non-linear storytelling or foreshadowing to add complexity." : "Ensure smooth transitions between paragraphs to guide the reader.",
      example: "Use words like 'meanwhile,' 'suddenly,' or 'later that day' to connect ideas.",
      nextStep: "Review your transitions to make sure your story flows seamlessly."
    };
  }

  static generateGrammarResponse(content: string, grammarAnalysis: any, wordCount: number, strugglingWriter: boolean, advancedWriter: boolean) {
    if (wordCount === 0) {
      return {
        encouragement: "Let's make your writing super clear and correct! ✏️",
        nswFocus: "Spelling & Grammar",
        suggestion: "Remember to use capital letters at the start of sentences and periods at the end.",
        example: "'the dog ran.' should be 'The dog ran.'",
        nextStep: "Write your first sentence, focusing on correct capitalization and punctuation."
      };
    }

    if (grammarAnalysis.score <= 2) {
      return {
        encouragement: strugglingWriter ? "You're doing great! Let's fix one thing." : "Good effort! Let's polish your grammar and spelling. 🛠️",
        nswFocus: "Spelling & Grammar",
        suggestion: strugglingWriter ? "Check your last sentence: does it start with a capital and end with a period?" : "Focus on correct capitalization and basic punctuation (periods, commas).",
        example: "'i went to the park' should be 'I went to the park.'",
        nextStep: "Review your last few sentences for capital letters and end punctuation."
      };
    }

    if (grammarAnalysis.score <= 3) {
      return {
        encouragement: "Your grammar is improving! Keep it up! ✅",
        nswFocus: "Spelling & Grammar",
        suggestion: advancedWriter ? "Can you vary your sentence structures more? Try combining short sentences with conjunctions." : "Look out for common spelling errors and ensure subject-verb agreement.",
        example: "Instead of 'He run fast,' try 'He runs fast.'",
        nextStep: "Read your writing aloud to catch any awkward sentences or missing words."
      };
    }

    return {
      encouragement: "Excellent grammar and spelling! Your writing is clear and precise! 🏆",
      nswFocus: "Spelling & Grammar",
      suggestion: advancedWriter ? "Experiment with more complex sentence structures, like using semicolons or colons effectively." : "Continue to proofread carefully for any minor errors and sentence variety.",
      example: "Consider using a semicolon to join two closely related independent clauses.",
      nextStep: "Give your writing one final read-through for perfection."
    };
  }

  static generateGeneralResponse(content: string, wordCount: number) {
    if (wordCount === 0) {
      return {
        encouragement: "Hello! I'm your AI Writing Buddy! 🤖",
        nswFocus: "Getting Started",
        suggestion: "I'm here to help you write amazing stories. Start typing and I'll give you feedback!",
        example: "Try beginning with the prompt about the mysterious key in grandmother's attic.",
        nextStep: "Write your first sentence and I'll help you improve it!"
      };
    } else if (wordCount < 50) {
      return {
        encouragement: "You're off to a great start! Keep those ideas flowing. 💡",
        nswFocus: "Ideas & Content",
        suggestion: "What happens next in your story? Describe the next event or feeling.",
        example: "'The old key felt warm in my hand, as if it held ancient secrets...' What did you do with it?",
        nextStep: "Add more details to your opening."
      };
    } else if (wordCount < 150) {
      return {
        encouragement: "Making good progress! Let's build on what you have. 🏗️",
        nswFocus: "Structure & Organization",
        suggestion: "Ensure your paragraphs are well-organized and each has a main idea.",
        example: "If you're describing a new event, start a new paragraph.",
        nextStep: "Develop your middle paragraphs with more descriptive language."
      };
    } else if (wordCount < 250) {
      return {
        encouragement: "Your story is really taking shape! Think about how you want it to end. 🎯",
        nswFocus: "Structure & Organization",
        suggestion: "Start planning your conclusion. How will your story resolve?",
        example: "'Finally, with a deep breath, I turned the key...'",
        nextStep: "Work towards a satisfying ending."
      };
    } else {
      return {
        encouragement: "You've written a fantastic amount! Now, let's polish it up. ✨",
        nswFocus: "Spelling & Grammar",
        suggestion: "Read through your entire piece. Can you spot any small errors or places to improve a word choice?",
        example: "Check for repeated words or sentences that could be combined.",
        nextStep: "Proofread for any final adjustments."
      };
    }
  }

  // Chat Intelligence - This would be called when a user explicitly asks a question
  static handleUserQuestion(question: string, content: string, textType: string, analysis: any, wordCount: number) {
    const lowerQuestion = question.toLowerCase();

    if (lowerQuestion.includes("how do i start")) {
      return {
        encouragement: "Great question! Let's get you started. 🚀",
        nswFocus: "Ideas & Content",
        suggestion: `For a ${textType} piece, you want to hook your reader immediately. Think about the prompt's main elements.`, 
        example: "Try describing the setting or introducing a mysterious object related to the prompt.",
        nextStep: "Write an engaging opening sentence."
      };
    }
    if (lowerQuestion.includes("what should i write next")) {
      const phase = this.getWritingPhase(wordCount);
      if (phase === 'opening' || phase === 'start') {
        return {
          encouragement: "Good thinking ahead!",
          nswFocus: "Ideas & Content",
          suggestion: "After your opening, you'll want to develop your main idea or introduce the conflict.",
          example: "If you found a key, what did you do with it? Did you try to open something?",
          nextStep: "Describe the next event in your story."
        };
      } else if (phase === 'development' || phase === 'risingAction') {
        return {
          encouragement: "Excellent! Let's keep the story moving.",
          nswFocus: "Structure & Organization",
          suggestion: "Expand on the events you've already introduced. Add more details, dialogue, or character reactions.",
          example: "If your character is exploring, describe what they see, hear, and feel.",
          nextStep: "Add more descriptive sentences to your current paragraph or start a new one for a new event."
        };
      } else if (phase === 'conclusion') {
        return {
          encouragement: "You're nearing the end!",
          nswFocus: "Structure & Organization",
          suggestion: "It's time to wrap up your story. How does everything resolve? What does your character learn?",
          example: "'Finally, with a sigh of relief...' or 'In the end, the mystery was solved, and I learned...'",
          nextStep: "Write a satisfying conclusion."
        };
      }
    }
    if (lowerQuestion.includes("is this good")) {
      const overallScore = (analysis.ideas.score + analysis.language.score + analysis.structure.score + analysis.grammar.score) / 4;
      let praise = "";
      let improvement = "";

      if (overallScore >= 4) praise = "This is looking really strong! ";
      else if (overallScore >= 3) praise = "You're doing well! ";
      else praise = "Keep up the effort! ";

      const lowestCriterion = Object.entries(analysis).reduce((a, b) => a[1].score <= b[1].score ? a : b)[0];
      improvement = `One area to focus on next is your ${lowestCriterion}. ${analysis[lowestCriterion].improvements[0] || ""}`;

      return {
        encouragement: `${praise}I love how you've been working on your writing!`, 
        nswFocus: "Overall Feedback",
        suggestion: improvement,
        example: "For example, if it's 'ideas', think about adding more unique details.",
        nextStep: "Focus on that one area for improvement in your next few sentences."
      };
    }
    if (lowerQuestion.includes("how do i make it longer")) {
      return {
        encouragement: "Want to expand your writing? Great idea! 📈",
        nswFocus: "Ideas & Content / Structure & Organization",
        suggestion: "You can make your writing longer by adding more descriptive details, expanding on events, or including dialogue.",
        example: "Instead of just saying 'He walked into the room', describe the room, what he saw, heard, and felt.",
        nextStep: "Pick a sentence and add 2-3 more descriptive sentences to it."
      };
    }
    if (lowerQuestion.includes("help with vocabulary")) {
      return {
        encouragement: "Let's boost your vocabulary! 📚",
        nswFocus: "Language & Vocabulary",
        suggestion: "Look for simple words you've used and try to replace them with more sophisticated synonyms.",
        example: "Instead of 'happy', try 'joyful', 'elated', or 'content'.",
        nextStep: "Find one word in your writing and replace it with a stronger synonym."
      };
    }
    if (lowerQuestion.includes("am i on track")) {
      const targetWordCount = 250; // Example target
      const targetTime = 40 * 60; // 40 minutes
      const wordCountProgress = (wordCount / targetWordCount) * 100;
      const timeProgress = (elapsedTime / targetTime) * 100;

      let status = "";
      if (wordCountProgress < timeProgress - 10) {
        status = "You're a bit behind on word count compared to the time. Try to speed up your writing a little.";
      } else if (wordCountProgress > timeProgress + 10) {
        status = "You're writing quite quickly! Great energy, but remember to focus on quality too.";
      } else {
        status = "You're on a good track with your word count and time! Keep up the balanced effort.";
      }

      return {
        encouragement: "Let's check your progress! 📊",
        nswFocus: "Pacing & Progress",
        suggestion: status,
        example: `You have ${wordCount} words and ${Math.floor(elapsedTime / 60)} minutes have passed. Aim for around ${targetWordCount} words in ${Math.floor(targetTime / 60)} minutes.`, 
        nextStep: "Adjust your pace if needed, focusing on both quantity and quality."
      };
    }

    // Default general response for other questions
    return {
      encouragement: "That's an interesting question! 🤔",
      nswFocus: "General Guidance",
      suggestion: "I'm here to help you improve your writing. Is there something specific in your story you'd like feedback on?",
      example: "You could ask 'How can I make this sentence better?' or 'What do you think of my opening?'",
      nextStep: "Ask me a more specific question about your writing."
    };
  }
}

interface CoachMessage {
  type: 'user' | 'auto-coach' | 'response';
  content: any; // Can be string for user, or CoachResponse for auto-coach/response
  timestamp: Date;
  analysis?: any; // Only for auto-coach messages
}

interface CoachResponse {
  encouragement: string;
  nswFocus: string;
  suggestion: string;
  example: string;
  nextStep: string;
}

interface EnhancedCoachPanelProps {
  content: string;
  textType: string;
  wordCount: number;
  analysis?: any; // DetailedFeedback type from parent
  onAnalysisChange?: (analysis: any) => void;
  onApplyFix?: (fix: any) => void;
  assistanceLevel?: string;
  onAssistanceLevelChange?: (level: string) => void;
  user?: any;
  openAIConnected?: boolean;
  openAILoading?: boolean;
  onSubmitForEvaluation?: () => void;
}

export function EnhancedCoachPanel({
  content,
  textType,
  wordCount,
  analysis: parentAnalysis,
  onAnalysisChange,
  onApplyFix,
  assistanceLevel,
  onAssistanceLevelChange,
  user,
  openAIConnected,
  openAILoading,
  onSubmitForEvaluation,
}: EnhancedCoachPanelProps) {
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [currentView, setCurrentView] = useState<'coach' | 'nsw'>('coach');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastAnalysisRef = useRef<any>(null);
  const lastContentRef = useRef<string>('');

  // Simulate elapsed time for time-aware coaching
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Start timer when content is first typed
    if (content.trim().length > 0 && timerIntervalRef.current === null) {
      timerIntervalRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }

    // Clear timer if content is empty or component unmounts
    if (content.trim().length === 0 && timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
      setElapsedTime(0);
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [content]);

  // Debounced analysis and response generation
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (content.trim().length > 0) {
      setIsAnalyzing(true);
      debounceTimerRef.current = setTimeout(() => {
        // Determine struggling/advanced writer based on initial performance or settings
        const strugglingWriter = wordCount < 50 && elapsedTime > 5 * 60; // Example logic
        const advancedWriter = wordCount > 150 && elapsedTime < 10 * 60; // Example logic

        const newAnalysis = NSWCriteriaAnalyzer.analyzeContent(content, textType, wordCount, elapsedTime);
        lastAnalysisRef.current = newAnalysis;
        if (onAnalysisChange) {
          onAnalysisChange(newAnalysis);
        }

        const coachResponse = EnhancedCoachResponseGenerator.generateResponse(
          content, 
          textType, 
          newAnalysis, 
          wordCount, 
          elapsedTime,
          messages.length > 0 ? messages[messages.length - 1].type : undefined,
          strugglingWriter,
          advancedWriter
        );
        
        // Only add a new auto-coach message if the content has significantly changed
        // or if the last message was not an auto-coach message for the same content
        const lastMessage = messages[messages.length - 1];
        const isLastMessageAutoCoach = lastMessage && lastMessage.type === 'auto-coach';
        const hasContentChanged = lastContentRef.current !== content;

        if (!isLastMessageAutoCoach || hasContentChanged) {
          setMessages(prev => {
            const filtered = prev.filter(msg => msg.type !== 'auto-coach');
            return [...filtered, {
              type: 'auto-coach',
              content: coachResponse,
              timestamp: new Date(),
              analysis: newAnalysis
            }];
          });
          lastContentRef.current = content;
        }
        
        setIsAnalyzing(false);
      }, 1000); // 10-second debounce as per requirement

      return () => clearTimeout(debounceTimerRef.current as NodeJS.Timeout);
    } else {
      // Show welcome message when no content
      setMessages([{
        type: 'auto-coach',
        content: {
          encouragement: "Hello! I'm your AI Writing Buddy! 🤖",
          nswFocus: "Getting Started",
          suggestion: "I'm here to help you write amazing stories. Start typing and I'll give you feedback!",
          example: "Try beginning with the prompt about the mysterious key in grandmother's attic.",
          nextStep: "Write your first sentence and I'll help you improve it!"
        },
        timestamp: new Date(),
        analysis: null
      }]);
      if (onAnalysisChange) {
        onAnalysisChange(null);
      }
      lastContentRef.current = '';
    }
  }, [content, textType, wordCount, elapsedTime]); // Added elapsedTime to dependencies

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      const userQuestion = inputValue.trim();
      setMessages(prev => [...prev, {
        type: 'user',
        content: userQuestion,
        timestamp: new Date()
      }]);
      
      setInputValue('');

      // Generate a response based on the user's question using chat intelligence
      setTimeout(() => {
        const currentAnalysis = lastAnalysisRef.current || NSWCriteriaAnalyzer.analyzeContent(content, textType, wordCount, elapsedTime);
        const chatResponse = EnhancedCoachResponseGenerator.handleUserQuestion(userQuestion, content, textType, currentAnalysis, wordCount);
        setMessages(prev => [...prev, {
          type: 'response',
          content: chatResponse,
          timestamp: new Date()
        }]);
      }, 500);
    }
  };

  const renderNSWCriteria = () => {
    if (!lastAnalysisRef.current) {
      return (
        <div className="p-4 text-center text-gray-500">
          <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Start writing to see your NSW criteria scores!</p>
        </div>
      );
    }

    const analysis = lastAnalysisRef.current;
    const criteria = [
      { name: 'Ideas & Content', key: 'ideas', icon: '💡', color: 'from-yellow-400 to-orange-500', weight: 0.4 },
      { name: 'Language & Vocabulary', key: 'language', icon: '📚', color: 'from-blue-400 to-blue-600', weight: 0.25 },
      { name: 'Structure & Organization', key: 'structure', icon: '🏗️', color: 'from-green-400 to-green-600', weight: 0.2 },
      { name: 'Spelling & Grammar', key: 'grammar', icon: '✏️', color: 'from-purple-400 to-purple-600', weight: 0.15 }
    ];

    // Calculate overall score with weights
    const weightedScore = criteria.reduce((acc, criterion) => {
      const criterionData = analysis[criterion.key];
      return acc + (criterionData.score * criterion.weight);
    }, 0);
    const overallScorePercentage = Math.round((weightedScore / 5) * 100);

    const getGrade = (score: number) => {
      if (score >= 90) return 'A';
      if (score >= 80) return 'B';
      if (score >= 70) return 'C';
      if (score >= 60) return 'D';
      return 'E';
    };

    return (
      <div className="p-4 space-y-4">
        {/* Overall Score */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4 rounded-lg text-center">
          <h3 className="font-bold text-lg">Overall NSW Score</h3>
          <div className="text-3xl font-bold">{overallScorePercentage}%</div>
          <div className="text-sm opacity-90">
            Grade: {getGrade(overallScorePercentage)} - {overallScorePercentage >= 80 ? 'Excellent!' : overallScorePercentage >= 60 ? 'Good Progress!' : 'Keep Improving!'}
          </div>
        </div>

        {/* Individual Criteria */}
        <div className="space-y-3">
          {criteria.map(criterion => {
            const criterionData = analysis[criterion.key];
            const score = criterionData.score;
            
            return (
              <div key={criterion.key} className={`bg-gradient-to-r ${criterion.color} text-white p-3 rounded-lg`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{criterion.icon}</span>
                    <span className="font-semibold text-sm">{criterion.name}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${star <= score ? 'fill-current' : 'fill-current opacity-30'}`}
                      />
                    ))}
                  </div>
                </div>
                
                {criterionData.strength && (
                  <div className="text-xs opacity-90 mb-1">
                    ✅ Strength: "{criterionData.strength}"
                  </div>
                )}
                
                {criterionData.improvementArea && (
                  <div className="text-xs opacity-90">
                    💡 Improvement: {criterionData.improvementArea}
                  </div>
                )}
                {/* Quick Fixes, Example Bank, Vocabulary Booster, Structure Checker - Placeholder for future interactive features */}
                <div className="mt-2 flex flex-wrap gap-2">
                  {criterion.key === 'grammar' && ( // Example for grammar quick fix
                    <button className="bg-white/20 text-white text-xs px-2 py-1 rounded-full hover:bg-white/30">Quick Fixes</button>
                  )}
                  {criterion.key === 'language' && ( // Example for vocab booster
                    <button className="bg-white/20 text-white text-xs px-2 py-1 rounded-full hover:bg-white/30">Vocabulary Booster</button>
                  )}
                  {criterion.key === 'structure' && ( // Example for structure checker
                    <button className="bg-white/20 text-white text-xs px-2 py-1 rounded-full hover:bg-white/30">Structure Checker</button>
                  )}
                  <button className="bg-white/20 text-white text-xs px-2 py-1 rounded-full hover:bg-white/30">Focus Here Next</button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress Tracking & Comparison - Placeholder */}
        <div className="bg-gray-100 p-3 rounded-lg text-sm text-gray-700">
          <h4 className="font-semibold mb-1">Progress Insights:</h4>
          <p>"You're improving in vocabulary! +1 star since you started." (Placeholder)</p>
          <p>"Your ideas are becoming more detailed over time." (Placeholder)</p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* OPTIMIZED: Single Header with Compact Toggle */}
      <div className="p-3 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold">Writing Coach</h2>
          <div className="text-sm opacity-90">
            {wordCount} words | {Math.floor(elapsedTime / 60)}:{('0' + (elapsedTime % 60)).slice(-2)} mins
          </div>
        </div>
        
        {/* OPTIMIZED: Compact Toggle Buttons */}
        <div className="flex space-x-1">
          <button
            onClick={() => setCurrentView('coach')}
            className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
              currentView === 'coach'
                ? 'bg-white text-blue-600' : 'bg-blue-500 text-white hover:bg-blue-400'
            }`}
          >
            <MessageSquare className="w-3 h-3" />
            <span>AI Coach</span>
          </button>
          
          <button
            onClick={() => setCurrentView('nsw')}
            className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
              currentView === 'nsw'
                ? 'bg-white text-purple-600' : 'bg-purple-500 text-white hover:bg-purple-400'
            }`}
          >
            <BarChart3 className="w-3 h-3" />
            <span>NSW Criteria</span>
          </button>
        </div>
      </div>

      {/* OPTIMIZED: Content Area with More Vertical Space */}
      <div className="flex-1 overflow-hidden">
        {currentView === 'coach' ? (
          <>
            {/* Messages Area - OPTIMIZED: More space, less padding */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ height: 'calc(100% - 70px)' }}>
              {messages.map((message, index) => (
                <div key={index} className={`${message.type === 'user' ? 'ml-6' : 'mr-6'}`}>
                  {message.type === 'user' ? (
                    <div className="bg-blue-500 text-white p-2 rounded-lg rounded-br-none text-sm">
                      {message.content}
                    </div>
                  ) : (
                    <div className="bg-gray-100 p-3 rounded-lg rounded-bl-none">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-5 h-5 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">🤖</span>
                        </div>
                        <span className="font-semibold text-xs text-gray-800">{message.content.encouragement}</span>
                      </div>
                      
                      {/* OPTIMIZED: Compact feedback sections */}
                      <div className="space-y-1 text-xs">
                        <div className="bg-blue-50 p-2 rounded border-l-2 border-blue-400">
                          <div className="font-medium text-blue-800">🎯 {message.content.nswFocus}</div>
                        </div>
                        
                        <div className="bg-green-50 p-2 rounded border-l-2 border-green-400">
                          <div className="font-medium text-green-800 mb-1">💡 Suggestion:</div>
                          <div className="text-green-700">{message.content.suggestion}</div>
                        </div>
                        
                        <div className="bg-yellow-50 p-2 rounded border-l-2 border-yellow-400">
                          <div className="font-medium text-yellow-800 mb-1">📝 Example:</div>
                          <div className="text-yellow-700 italic">{message.content.example}</div>
                        </div>
                        
                        <div className="bg-purple-50 p-2 rounded border-l-2 border-purple-400">
                          <div className="font-medium text-purple-800 mb-1">⭐ Next Step:</div>
                          <div className="text-purple-700">{message.content.nextStep}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {isAnalyzing && (
                <div className="mr-6">
                  <div className="bg-gray-100 p-3 rounded-lg rounded-bl-none">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
                      <span className="text-xs text-gray-600">Analyzing your writing...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* OPTIMIZED: Compact Input Area */}
            <div className="p-3 border-t bg-gray-50">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask me anything about your writing..."
                  className="flex-1 px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim()}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="h-full overflow-y-auto">
            {renderNSWCriteria()}
          </div>
        )}
      </div>
    </div>
  );
}

export default EnhancedCoachPanel;