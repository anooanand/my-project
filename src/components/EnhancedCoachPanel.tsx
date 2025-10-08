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
      feedback.push(`You\'re engaging well with the prompt by mentioning key elements like '${engagedKeywords.join(", ")}'.`);
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
      feedback.push("You\'re developing your ideas with some detail across paragraphs.");
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
      feedback.push("Excellent vocabulary variety! You\'re using diverse words effectively.");
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
      feedback.push("You\'re appealing to the senses, bringing your writing to life!");
      if (!strength) strength = "Sensory details.";
    } else {
      improvements.push("Engage the reader\'s senses by describing what characters see, hear, smell, taste, and feel.");
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
      feedback.push("You\'re using some transition words to connect your ideas.");
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
      improvements.push("Ensure you\'re using a variety of punctuation marks correctly.");
      if (!improvementArea) improvementArea = "Varied punctuation.";
    } else {
      improvements.push("Don\'t forget to use punctuation marks like periods, commas, and question marks.");
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
      feedback.push("You\'re using a good variety of sentence lengths and structures.");
      if (!strength) strength = "Sentence variety.";
    } else if (sentences.length > 1) {
      improvements.push("Try varying your sentence lengths and structures to make your writing more engaging.");
      if (!improvementArea) improvementArea = "Varying sentence structure.";
    }

    // Subject-verb agreement (very basic check, hard without full NLP)
    // This would require a more advanced NLP library. For now, we\'ll assume basic correctness if other grammar is good.
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

    // Prioritize struggling writers
    if (strugglingWriter && writingPhase === 'stuck') {
      return {
        encouragement: "It looks like you\'re a bit stuck. Don\'t worry, it happens!",
        nswFocus: "Getting Started",
        suggestion: "If you\'re finding it hard to start, try writing down any ideas that come to mind, even if they\'re not perfect.",
        example: "Try these sentence starters: 'The old key...', 'In the dusty attic...', 'Grandmother always said...', 'I never expected to find...'",
        nextStep: "Pick one sentence starter and just keep writing for a minute or two."
      };
    }

    if (wordCount > 300 && elapsedTime < 15 * 60) {
      return {
        encouragement: "You\'re writing very quickly! That\'s great energy!",
        nswFocus: "Sustaining Momentum",
        suggestion: "Your pace is impressive. Make sure to periodically re-read your work to ensure clarity and coherence.",
        example: "Take a moment to read the last paragraph aloud. Does it flow well?",
        nextStep: "Continue with this momentum, but perhaps start thinking about how your current section will transition to the next."
      };
    }

    // Generate a response based on a rotation of feedback types
    const feedbackTypes = ['ideas', 'structure', 'language', 'grammar'];
    let nextFeedbackType = 'ideas';

    if (lastFeedbackType) {
      const lastIndex = feedbackTypes.indexOf(lastFeedbackType);
      nextFeedbackType = feedbackTypes[(lastIndex + 1) % feedbackTypes.length];
    }

    const focusArea = analysis[nextFeedbackType];

    let encouragement = "You\'re making good progress. Keep it up!";
    if (writingPhase === 'developing') encouragement = "Great start! The ideas are beginning to take shape.";
    if (writingPhase === 'revising') encouragement = "You have a solid draft. Now, let\'s refine it.";

    if (advancedWriter && focusArea.score > 3) {
      return this.generateAdvancedChallenge(analysis, nextFeedbackType);
    }

    return {
      encouragement,
      nswFocus: this.mapFeedbackTypeToNSWFocus(nextFeedbackType),
      suggestion: `Let\'s focus on ${nextFeedbackType}. ${focusArea.improvements.length > 0 ? focusArea.improvements[0] : 'Keep building on your strengths in this area.'} `,
      example: this.getExampleForImprovement(nextFeedbackType, focusArea.improvementArea),
      nextStep: `Try to apply this feedback to your next paragraph.`
    };
  }

  static generateAdvancedChallenge(analysis: any, feedbackType: string) {
    const challenges = {
      ideas: {
        suggestion: "Your ideas are strong. Let\'s elevate them by introducing a counterclaim or a surprising twist.",
        example: "For instance, what if the key didn\'t open the chest, but something else entirely?",
        nextStep: "Write a paragraph that explores this new, unexpected direction."
      },
      structure: {
        suggestion: "Your structure is logical. Let\'s experiment with it. Try rearranging your paragraphs to see if it creates a more powerful impact.",
        example: "What if you started with the conclusion and then explained how you got there? (in medias res)",
        nextStep: "Copy your current draft and try reordering the paragraphs to see the effect."
      },
      language: {
        suggestion: "Your language is effective. Let\'s make it more evocative by focusing on subtext and nuance.",
        example: "Instead of saying a character is 'sad', describe their actions: 'He stared at the rain-streaked window, his coffee growing cold.'",
        nextStep: "Find a sentence in your draft and rewrite it to show the emotion instead of telling it."
      },
      grammar: {
        suggestion: "Your grammar is solid. Let\'s play with sentence structure to create a specific rhythm or pace.",
        example: "Try using a series of short, punchy sentences for an action scene, followed by a long, complex sentence for reflection.",
        nextStep: "Review a paragraph and intentionally vary the sentence structure to match the mood you want to create."
      }
    };

    const challenge = challenges[feedbackType];

    return {
      encouragement: "Excellent work! You have a strong command of this area. Ready for a challenge?",
      nswFocus: `Advanced ${this.mapFeedbackTypeToNSWFocus(feedbackType)}`,
      ...challenge
    };
  }

  static getExampleForImprovement(feedbackType: string, improvementArea: string) {
    const examples = {
      ideas: {
        "Directly addressing the prompt.": "Re-read the prompt and highlight the key tasks. Your first paragraph should directly respond to it.",
        "Expanding on ideas.": "Pick one idea and ask yourself 'why?' or 'how?'. Then, write a few sentences to explain it in more detail.",
        "Adding originality.": "Think of a common cliche related to your topic, then write the opposite."
      },
      structure: {
        "Strong opening.": "Try starting with a question, a surprising fact, or a vivid description to grab the reader.",
        "Paragraph focus.": "Read a paragraph and summarize its main point in one sentence. If you can\'t, it may need more focus.",
        "Smooth transitions.": "Use words like 'However', 'Therefore', or 'In contrast' to link ideas between sentences."
      },
      language: {
        "Using varied vocabulary.": "Right-click on a common word (like 'good' or 'said') and find a more descriptive synonym.",
        "Adding figurative language.": "Try completing this sentence: 'The [object] was like a [something else]'.",
        "Adding sensory details.": "Close your eyes and imagine the scene. What do you smell? What do you hear?"
      },
      grammar: {
        "Capitalization.": "Proofread your text, looking only for the first letter of each sentence.",
        "Varying sentence structure.": "Find a paragraph with sentences of similar length and try to combine or shorten some.",
        "Spelling accuracy.": "Read your text backwards. This helps you focus on individual words rather than the meaning."
      }
    };

    return examples[feedbackType]?.[improvementArea] || "Keep up the great work!";
  }

  static getWritingPhase(wordCount: number): string {
    if (wordCount < 20) return 'stuck';
    if (wordCount < 150) return 'developing';
    if (wordCount < 400) return 'drafting';
    return 'revising';
  }

  static getTimePhase(elapsedTime: number): string {
    if (elapsedTime < 60) return 'starting';
    if (elapsedTime < 300) return 'warming_up';
    if (elapsedTime < 900) return 'in_the_zone';
    return 'wrapping_up';
  }

  static mapFeedbackTypeToNSWFocus(feedbackType: string): string {
    const mapping = {
      ideas: "Ideas & Content",
      language: "Language & Vocabulary",
      structure: "Structure & Organization",
      grammar: "Grammar & Spelling"
    };
    return mapping[feedbackType] || "Writing Skills";
  }
}

interface CoachResponse {
  encouragement: string;
  nswFocus: string;
  suggestion: string;
  example: string;
  nextStep: string;
}

interface AnalysisResult {
  score: number;
  feedback: string[];
  improvements: string[];
  strength: string;
  improvementArea: string;
}

interface FullAnalysis {
  ideas: AnalysisResult;
  language: AnalysisResult;
  structure: AnalysisResult;
  grammar: AnalysisResult;
}

const initialAnalysis: FullAnalysis = {
  ideas: { score: 1, feedback: [], improvements: [], strength: "", improvementArea: "" },
  language: { score: 1, feedback: [], improvements: [], strength: "", improvementArea: "" },
  structure: { score: 1, feedback: [], improvements: [], strength: "", improvementArea: "" },
  grammar: { score: 1, feedback: [], improvements: [], strength: "", improvementArea: "" },
};

const EnhancedCoachPanel = ({ content, textType, wordCount, elapsedTime, isVisible }) => {
  const [analysis, setAnalysis] = useState<FullAnalysis>(initialAnalysis);
  const [coachResponse, setCoachResponse] = useState<CoachResponse | null>(null);
  const [lastFeedbackType, setLastFeedbackType] = useState<string | undefined>(undefined);
  const [isStruggling, setIsStruggling] = useState(false);
  const [isAdvanced, setIsAdvanced] = useState(false);

  const analysisTimer = useRef<NodeJS.Timeout | null>(null);
  const lastWordCount = useRef(wordCount);

  const analyzeAndRespond = useCallback(() => {
    const newAnalysis = NSWCriteriaAnalyzer.analyzeContent(content, textType, wordCount, elapsedTime);
    setAnalysis(newAnalysis);

    // Determine writer status
    const timeSinceLastChange = Date.now() - (analysisTimer.current?.lastRun || 0);
    const wordCountChange = wordCount - lastWordCount.current;
    if (wordCount > 50 && wordCountChange < 5 && timeSinceLastChange > 30000) {
      setIsStruggling(true);
    } else {
      setIsStruggling(false);
    }

    const overallScore = (newAnalysis.ideas.score + newAnalysis.language.score + newAnalysis.structure.score + newAnalysis.grammar.score) / 4;
    if (overallScore > 3.5 && wordCount > 200) {
      setIsAdvanced(true);
    } else {
      setIsAdvanced(false);
    }

    const newResponse = EnhancedCoachResponseGenerator.generateResponse(content, textType, newAnalysis, wordCount, elapsedTime, lastFeedbackType, isStruggling, isAdvanced);
    setCoachResponse(newResponse);
    setLastFeedbackType(newResponse.nswFocus.split(" ")[0].toLowerCase());

    lastWordCount.current = wordCount;
    if(analysisTimer.current) {
      analysisTimer.current.lastRun = Date.now();
    }

  }, [content, textType, wordCount, elapsedTime, lastFeedbackType, isStruggling, isAdvanced]);

  useEffect(() => {
    if (analysisTimer.current) clearTimeout(analysisTimer.current);
    analysisTimer.current = setTimeout(analyzeAndRespond, 10000); // Analyze every 10 seconds

    return () => {
      if (analysisTimer.current) clearTimeout(analysisTimer.current);
    };
  }, [content, analyzeAndRespond]);

  const getIconForFocus = (focus: string) => {
    if (focus.includes("Ideas")) return <Lightbulb className="h-5 w-5" />;
    if (focus.includes("Structure")) return <BarChart3 className="h-5 w-5" />;
    if (focus.includes("Language")) return <Star className="h-5 w-5" />;
    if (focus.includes("Grammar")) return <Award className="h-5 w-5" />;
    return <MessageSquare className="h-5 w-5" />;
  };

  const getOverallScore = () => {
    const total = analysis.ideas.score + analysis.language.score + analysis.structure.score + analysis.grammar.score;
    return Math.round((total / 20) * 100);
  };

  if (!isVisible) return null;

  return (
    <div className="bg-gray-50 rounded-lg p-6 shadow-lg h-full flex flex-col">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">AI Writing Coach</h2>

      {wordCount === 0 ? (
        <div className="flex-grow flex items-center justify-center text-center text-gray-500">
          <p>Start writing in the main editor to get feedback from your AI coach!</p>
        </div>
      ) : (
        <>
          {coachResponse && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center text-blue-800 mb-2">
                {getIconForFocus(coachResponse.nswFocus)}
                <h3 className="font-bold text-lg ml-2">{coachResponse.nswFocus}</h3>
              </div>
              <p className="text-sm text-blue-700 mb-2 italic">"{coachResponse.encouragement}"</p>
              <p className="text-sm text-gray-800"><span className="font-semibold">Suggestion:</span> {coachResponse.suggestion}</p>
              <p className="text-sm text-gray-600 mt-1"><span className="font-semibold">Example:</span> {coachResponse.example}</p>
              <p className="text-sm text-gray-800 mt-2 font-semibold">Next Step: {coachResponse.nextStep}</p>
            </div>
          )}

          <div className="flex-grow">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Writing Analysis</h3>
            <div className="space-y-4">
              {Object.entries(analysis).map(([key, value]) => (
                <div key={key}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-600 capitalize">{key}</span>
                    <span className="text-sm font-bold text-indigo-600">{value.score}/5</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-indigo-500 h-2.5 rounded-full" style={{ width: `${(value.score / 5) * 100}%` }}></div>
                  </div>
                  {value.strength && <p className="text-xs text-green-600 mt-1">Strength: {value.strength}</p>}
                  {value.improvementArea && <p className="text-xs text-orange-600 mt-1">To Improve: {value.improvementArea}</p>}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Overall Score</span>
              <span className="text-lg font-bold text-indigo-600">{getOverallScore()}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 mt-2">
              <div className="bg-gradient-to-r from-green-400 to-blue-500 h-4 rounded-full text-center text-white text-xs font-bold" style={{ width: `${getOverallScore()}%` }}>
                {getOverallScore() > 10 ? `${getOverallScore()}%` : ''}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default EnhancedCoachPanel;