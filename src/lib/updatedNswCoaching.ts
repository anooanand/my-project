import { TextAnalysis } from './textAnalyzer';
import { ContextualState } from './contextualAwareness';

export interface NSWCoachingResponse {
  message: string;
  encouragement: string;
  tips: string[];
  nextSteps: string[];
  timeAdvice: string;
  wordCountFeedback: string;
  priority: 'high' | 'medium' | 'low';
}

export async function generateNSWResponse(
  userMessage: string,
  currentContent: string,
  analysis: TextAnalysis,
  contextualState: ContextualState,
  timeElapsed: number,
  wordCount: number,
  textType: 'narrative' | 'persuasive' | 'expository' | 'descriptive' | 'creative' = 'narrative'
): Promise<NSWCoachingResponse> {
  
  // Generate genre-specific response based on text type
  const genreResponse = getGenreSpecificResponse(textType, userMessage, analysis, wordCount);
  
  // Generate time management advice
  const timeAdvice = getTimeManagementAdvice(timeElapsed, wordCount);
  
  // Generate word count feedback
  const wordCountFeedback = getWordCountFeedback(wordCount, timeElapsed);
  
  // Generate encouragement based on progress
  const encouragement = getEncouragement(wordCount, timeElapsed, textType);
  
  // Determine priority based on time and progress
  const priority = getPriority(timeElapsed, wordCount);

  return {
    message: genreResponse.message,
    encouragement,
    tips: genreResponse.tips,
    nextSteps: genreResponse.nextSteps,
    timeAdvice,
    wordCountFeedback,
    priority
  };
}

function getGenreSpecificResponse(
  textType: string,
  userMessage: string,
  analysis: TextAnalysis,
  wordCount: number
) {
  switch (textType) {
    case 'narrative':
      return getNarrativeResponse(userMessage, analysis, wordCount);
    case 'persuasive':
      return getPersuasiveResponse(userMessage, analysis, wordCount);
    case 'descriptive':
      return getDescriptiveResponse(userMessage, analysis, wordCount);
    case 'expository':
      return getExpositoryResponse(userMessage, analysis, wordCount);
    case 'creative':
      return getCreativeResponse(userMessage, analysis, wordCount);
    default:
      return getNarrativeResponse(userMessage, analysis, wordCount);
  }
}

function getNarrativeResponse(userMessage: string, analysis: TextAnalysis, wordCount: number) {
  const message = wordCount < 50 
    ? "Great start! In the NSW test, aim to hook your reader in the first sentence. You've got this!"
    : "Your story is developing nicely. Consider adding dialogue here to show character relationships.";
    
  return {
    message,
    tips: [
      "Start with an action or dialogue",
      "Set the scene with sensory details", 
      "Introduce your main character immediately"
    ],
    nextSteps: [
      "Write your opening sentence",
      "Establish the setting", 
      "Introduce the main character"
    ]
  };
}

function getPersuasiveResponse(userMessage: string, analysis: TextAnalysis, wordCount: number) {
  const message = wordCount < 50
    ? "Strong opening! For persuasive writing, make your position crystal clear from the start."
    : "Good argument development! Now strengthen it with specific examples and evidence.";
    
  return {
    message,
    tips: [
      "State your opinion clearly and confidently",
      "Use persuasive language like 'clearly', 'obviously', 'undoubtedly'",
      "Support each point with specific examples"
    ],
    nextSteps: [
      "State your main opinion",
      "Present your strongest reason",
      "Add supporting evidence"
    ]
  };
}

function getDescriptiveResponse(userMessage: string, analysis: TextAnalysis, wordCount: number) {
  const message = wordCount < 50
    ? "Excellent start! Descriptive writing should paint a picture in the reader's mind."
    : "Great descriptive details! Try engaging more of the five senses to make it even more vivid.";
    
  return {
    message,
    tips: [
      "Use all five senses in your descriptions",
      "Choose specific, vivid adjectives",
      "Create clear mental images with your words"
    ],
    nextSteps: [
      "Describe what you can see",
      "Add sounds and smells",
      "Include textures and feelings"
    ]
  };
}

function getExpositoryResponse(userMessage: string, analysis: TextAnalysis, wordCount: number) {
  const message = wordCount < 50
    ? "Good informative start! Make sure to clearly introduce your topic and why it matters."
    : "Nice information presentation! Use linking words to connect your ideas smoothly.";
    
  return {
    message,
    tips: [
      "Start with a clear topic sentence",
      "Use facts, examples, and explanations",
      "Connect ideas with linking words"
    ],
    nextSteps: [
      "Introduce your topic clearly",
      "Present your main points",
      "Add supporting details"
    ]
  };
}

function getCreativeResponse(userMessage: string, analysis: TextAnalysis, wordCount: number) {
  const message = wordCount < 50
    ? "Fantastic creative start! Let your imagination run wild and surprise your reader."
    : "Love the creativity! Push the boundaries even further - what unexpected twist could you add?";
    
  return {
    message,
    tips: [
      "Think outside the box",
      "Create unique, memorable characters",
      "Use unexpected plot twists"
    ],
    nextSteps: [
      "Establish your unique world",
      "Introduce unusual characters",
      "Add surprising elements"
    ]
  };
}

function getTimeManagementAdvice(timeElapsed: number, wordCount: number): string {
  const minutesElapsed = Math.floor(timeElapsed / 60);
  const targetWordsPerMinute = 10; // Rough target for NSW test
  const expectedWords = minutesElapsed * targetWordsPerMinute;
  
  if (wordCount > expectedWords * 1.2) {
    return `You're ahead of pace! ${minutesElapsed} minutes in with ${wordCount} words - excellent progress!`;
  } else if (wordCount < expectedWords * 0.8) {
    return `Pick up the pace slightly. Aim for about ${targetWordsPerMinute} words per minute to finish comfortably.`;
  } else {
    return `Perfect pacing! You're right on track for the 40-minute test.`;
  }
}

function getWordCountFeedback(wordCount: number, timeElapsed: number): string {
  if (wordCount < 100) {
    return `${wordCount} words - keep building your ideas!`;
  } else if (wordCount < 200) {
    return `${wordCount} words - you're making good progress!`;
  } else if (wordCount < 300) {
    return `${wordCount} words - excellent progress, you're in the sweet spot!`;
  } else if (wordCount < 400) {
    return `${wordCount} words - fantastic! You're approaching the ideal length.`;
  } else {
    return `${wordCount} words - perfect length! Focus on polishing your conclusion.`;
  }
}

function getEncouragement(wordCount: number, timeElapsed: number, textType: string): string {
  const genreNames = {
    narrative: 'story',
    persuasive: 'argument', 
    descriptive: 'description',
    expository: 'explanation',
    creative: 'creative piece'
  };
  
  const genreName = genreNames[textType as keyof typeof genreNames] || 'writing';
  
  if (wordCount < 50) {
    return `🌟 Great start on your ${genreName}! Every expert writer started with a single word.`;
  } else if (wordCount < 200) {
    return `💪 Your ${genreName} is taking shape beautifully! Keep up this momentum.`;
  } else {
    return `🎉 Excellent work! Your ${genreName} is really coming together nicely.`;
  }
}

function getPriority(timeElapsed: number, wordCount: number): 'high' | 'medium' | 'low' {
  const minutesElapsed = Math.floor(timeElapsed / 60);
  
  // High priority if running out of time or way behind
  if (minutesElapsed > 30 && wordCount < 200) {
    return 'high';
  }
  
  // Medium priority for normal guidance
  if (minutesElapsed > 20 || wordCount > 100) {
    return 'medium';
  }
  
  // Low priority for early stages
  return 'low';
}