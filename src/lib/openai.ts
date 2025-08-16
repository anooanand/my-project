import OpenAI from 'openai';

// Create OpenAI client with enhanced error handling
let openai: OpenAI | null = null;

try {
  // Try multiple possible API key environment variables
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY || 
                 import.meta.env.OPENAI_API_KEY ||
                 process.env.OPENAI_API_KEY;
  
  if (apiKey && 
      apiKey !== 'your_openai_api_key_here' && 
      apiKey !== 'your-openai-api-key-here' && 
      apiKey !== 'sk-placeholder' &&
      apiKey.trim() !== '' &&
      apiKey.startsWith('sk-')) {
    openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true
    });
    console.log('[DEBUG] OpenAI client initialized successfully with GPT-4');
  } else {
    console.warn('[DEBUG] OpenAI API key not configured or invalid - AI features will be limited');
    console.warn('[DEBUG] Expected format: sk-... but got:', apiKey ? `${apiKey.substring(0, 10)}...` : 'undefined');
  }
} catch (error) {
  console.error('[DEBUG] Failed to initialize OpenAI client:', error);
  openai = null;
}

// Safe function to check if OpenAI is available
const isOpenAIAvailable = (): boolean => {
  return openai !== null;
};

// Helper function to make API calls to the enhanced backend
async function makeBackendCall(operation: string, data: any): Promise<any> {
  try {
    console.log(`[DEBUG] Making backend call for operation: ${operation}`);
    
    // Always try backend calls first, regardless of environment
    try {
      const response = await fetch('/.netlify/functions/ai-operations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation,
          ...data
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[DEBUG] Backend call failed: ${response.status} - ${errorText}`);
        throw new Error(`Backend call failed: ${response.status}`);
      }

      const result = await response.json();
      console.log(`[DEBUG] Backend call successful for ${operation}`);
      return result;
    } catch (fetchError) {
      console.error(`[DEBUG] Backend fetch failed for ${operation}:`, fetchError);
      return { error: 'BACKEND_NOT_AVAILABLE' };
    }
  } catch (error) {
    console.error('Backend call error:', error);
    return { error: 'BACKEND_NOT_AVAILABLE' };
  }
}

// Enhanced NSW Selective Writing Feedback Function
export async function getNSWSelectiveFeedback(
  content: string, 
  textType: string, 
  assistanceLevel: string = 'medium', 
  feedbackHistory: any[] = []
): Promise<any> {
  try {
    return await makeBackendCall('getNSWSelectiveFeedback', {
      content,
      textType,
      assistanceLevel,
      feedbackHistory
    });
  } catch (error) {
    console.error('Error getting NSW Selective feedback:', error);
    
    console.log('[DEBUG] Using enhanced NSW Selective fallback feedback');
    
    // Enhanced fallback response with detailed NSW criteria analysis
    const analysis = analyzeContentStructure(content);
    const estimatedScore = Math.min(30, Math.max(8, Math.round(analysis.wordCount / 15) + analysis.paragraphCount * 2));
    const bandLevel = estimatedScore >= 27 ? 6 : estimatedScore >= 22 ? 5 : estimatedScore >= 17 ? 4 : estimatedScore >= 12 ? 3 : estimatedScore >= 7 ? 2 : 1;
    
    return {
      overallComment: `Your ${analysis.wordCount}-word ${textType} demonstrates ${bandLevel >= 4 ? 'solid' : 'developing'} understanding of NSW Selective requirements. You're currently showing Band ${bandLevel} characteristics. Let's work on reaching Band 5-6 level.`,
      totalScore: estimatedScore,
      overallBand: bandLevel,
      bandDescription: bandLevel >= 5 ? "Proficient - Well-developed ideas" : bandLevel >= 4 ? "Sound - Adequate ideas" : "Developing - Simple ideas",
      estimatedExamScore: `${estimatedScore}/30`,
      criteriaFeedback: {
        ideasAndContent: {
          score: Math.round(estimatedScore * 0.3),
          maxScore: 9,
          band: Math.min(6, Math.max(1, Math.round(estimatedScore * 0.3 / 1.5))),
          strengths: analysis.wordCount > 100 ? [`You've developed a substantial ${textType} with ${analysis.wordCount} words`] : ["You've made a good start on your writing"],
          improvements: analysis.wordCount < 150 ? ["Develop your ideas with more specific details and examples"] : ["Deepen your analysis and add more sophisticated insights"],
          suggestions: [`Add more specific examples and evidence to support your ${textType} ideas`, "Show deeper thinking by explaining the 'why' behind your points"],
          nextSteps: [`Expand your ${textType} with at least 2 more specific examples or details`]
        },
        textStructureAndOrganization: {
          score: Math.round(estimatedScore * 0.25),
          maxScore: 7.5,
          band: Math.min(6, Math.max(1, Math.round(estimatedScore * 0.25 / 1.25))),
          strengths: analysis.paragraphCount > 1 ? [`Good paragraph organization with ${analysis.paragraphCount} paragraphs`] : ["You have a clear structure"],
          improvements: analysis.paragraphCount === 1 ? ["Break your writing into multiple paragraphs for better organization"] : ["Strengthen transitions between paragraphs"],
          suggestions: [`Use NSW Selective-appropriate structure for ${textType}: clear introduction, well-developed body, strong conclusion`, "Add transition words to connect your ideas smoothly"],
          nextSteps: [`Review NSW Selective ${textType} structure requirements and apply them to your writing`]
        },
        languageFeaturesAndVocabulary: {
          score: Math.round(estimatedScore * 0.25),
          maxScore: 7.5,
          band: Math.min(6, Math.max(1, Math.round(estimatedScore * 0.25 / 1.25))),
          strengths: analysis.descriptiveWords.length > 3 ? [`Good use of descriptive language: ${analysis.descriptiveWords.slice(0, 3).join(', ')}`] : ["You're developing your vocabulary"],
          improvements: ["Use more sophisticated vocabulary appropriate for NSW Selective Band 5-6 level", "Vary your sentence structures for more engaging writing"],
          suggestions: ["Replace simple words with more sophisticated alternatives (e.g., 'good' → 'exceptional')", "Use complex sentences with subordinate clauses"],
          nextSteps: ["Practice using 5 new sophisticated vocabulary words in your next draft"]
        },
        spellingPunctuationGrammar: {
          score: Math.round(estimatedScore * 0.2),
          maxScore: 6,
          band: Math.min(6, Math.max(1, Math.round(estimatedScore * 0.2 / 1))),
          strengths: ["Your basic grammar and spelling show good control"],
          improvements: ["Check for any minor errors and ensure consistent tense throughout"],
          suggestions: ["Proofread your work carefully, reading it aloud to catch errors", "Use varied punctuation to create more sophisticated sentences"],
          nextSteps: [`Maintain consistent ${textType === 'narrative' ? 'past' : 'present'} tense throughout your writing`]
        }
      },
      priorityFocus: [
        estimatedScore < 20 ? "Develop ideas with more specific details and examples" : "Add sophisticated insights and analysis",
        estimatedScore < 15 ? "Improve basic structure and organization" : "Enhance vocabulary and sentence variety"
      ],
      examStrategies: [
        `Plan your ${textType} structure before writing (5 minutes planning time)`,
        "Use sophisticated vocabulary appropriate for selective school entry",
        "Leave time to check and improve your work (5 minutes checking time)"
      ],
      interactiveQuestions: getTextTypeQuestions(textType),
      revisionSuggestions: [
        `Add 2-3 more specific examples to strengthen your ${textType}`,
        "Replace 3 simple words with more sophisticated alternatives",
        "Check that each paragraph has one clear main idea"
      ]
    };
  }
}

// Helper function to analyze content structure and extract key elements
function analyzeContentStructure(content: string) {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = content.trim().split(/\s+/).filter(w => w.length > 0);
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  
  // Extract potential character names (capitalized words that aren't sentence starters)
  const potentialCharacters = words.filter((word, index) => {
    const isCapitalized = /^[A-Z][a-z]+$/.test(word);
    const isNotSentenceStart = index > 0 && !/[.!?]/.test(words[index - 1]);
    return isCapitalized && isNotSentenceStart;
  });

  // Identify dialogue (text in quotes)
  const dialogueMatches = content.match(/"[^"]*"/g) || [];
  
  // Identify descriptive language (adjectives and adverbs)
  const descriptiveWords = words.filter(word => 
    /ly$/.test(word) || // adverbs ending in -ly
    /ing$/.test(word) || // present participles
    /ed$/.test(word) // past participles
  );

  return {
    sentenceCount: sentences.length,
    wordCount: words.length,
    paragraphCount: paragraphs.length,
    averageSentenceLength: words.length / sentences.length,
    potentialCharacters: [...new Set(potentialCharacters)],
    hasDialogue: dialogueMatches.length > 0,
    dialogueCount: dialogueMatches.length,
    descriptiveWords: [...new Set(descriptiveWords)],
    firstSentence: sentences[0]?.trim() || '',
    lastSentence: sentences[sentences.length - 1]?.trim() || ''
  };
}

// Enhanced function to get contextual writing feedback
export async function getWritingFeedback(content: string, textType: string, assistanceLevel: string, feedbackHistory: any[]): Promise<any> {
  try {
    return await makeBackendCall('getWritingFeedback', {
      content,
      textType,
      assistanceLevel,
      feedbackHistory
    });
  } catch (error) {
    console.error('Error getting writing feedback:', error);
    
    console.log('[DEBUG] Using enhanced fallback feedback for local development');
    
    // Enhanced contextual fallback based on content analysis
    const analysis = analyzeContentStructure(content);
    const qualityScore = Math.min(10, Math.max(3, Math.round(analysis.wordCount / 20) + (analysis.paragraphCount > 1 ? 2 : 0)));
    
    return {
      overallComment: `Your ${analysis.wordCount}-word ${textType} shows ${qualityScore >= 7 ? 'strong' : qualityScore >= 5 ? 'good' : 'developing'} effort for NSW Selective preparation! You're building important writing skills.`,
      feedbackItems: [
        {
          type: "praise",
          area: "NSW Selective Preparation",
          text: `Excellent effort writing ${analysis.wordCount} words! This shows dedication to your NSW Selective preparation.`,
          exampleFromText: analysis.firstSentence,
          suggestionForImprovement: "For NSW Selective success, continue building sophisticated vocabulary and varied sentence structures."
        },
        {
          type: "suggestion",
          area: "NSW Text Structure",
          text: analysis.paragraphCount === 1 ? `Your ${textType} is currently in one paragraph.` : `You've organized your ${textType} into ${analysis.paragraphCount} paragraphs - good structure!`,
          suggestionForImprovement: analysis.paragraphCount === 1 ? `For NSW Selective ${textType}, break your writing into 3-4 well-developed paragraphs.` : "Excellent paragraph organization for NSW Selective standards!"
        },
        {
          type: "challenge",
          area: "Vocabulary Enhancement",
          text: `Your vocabulary shows ${analysis.descriptiveWords.length > 5 ? 'good variety' : 'room for growth'}.`,
          suggestionForImprovement: "For Band 5-6 NSW Selective writing, use more sophisticated vocabulary that demonstrates language maturity."
        }
      ],
      focusForNextTime: [
        analysis.averageSentenceLength < 10 ? "Write longer, more complex sentences for NSW Selective standards" : "Excellent sentence complexity!",
        analysis.descriptiveWords.length < 5 ? "Add more sophisticated vocabulary and descriptive language" : "Great use of descriptive language!",
        `Ensure your ${textType} follows NSW Selective text type conventions`,
        "Practice using literary devices appropriate for your age level"
      ]
    };
  }
}

// Enhanced function for specialized text type feedback with contextual analysis
async function getSpecializedTextTypeFeedback(content: string, textType: string): Promise<any> {
  try {
    return await makeBackendCall('getSpecializedTextTypeFeedback', {
      content,
      textType
    });
  } catch (error) {
    console.error('Error getting specialized text type feedback:', error);
    return {
      overallComment: "Unable to provide specialized feedback at this time. Your writing shows good understanding of the task.",
      textTypeSpecificFeedback: {
        structure: "Your writing has a clear structure appropriate for this text type.",
        language: "You've used suitable language for this writing style.",
        purpose: "Your writing addresses the main purpose effectively.",
        audience: "Consider your audience when refining your writing."
      },
      strengthsInTextType: [
        "Good understanding of the text type requirements",
        "Appropriate structure and organization",
        "Clear attempt at the required style"
      ],
      improvementAreas: [
        "Continue developing text type knowledge",
        "Practice specific language features",
        "Strengthen understanding of conventions"
      ],
      nextSteps: [
        "Review examples of this text type",
        "Practice with guided exercises",
        "Seek additional feedback and support"
      ]
    };
  }
}

// Enhanced function to identify specific mistakes in context
export async function identifyCommonMistakes(content: string, textType: string) {
  try {
    return await makeBackendCall('identifyCommonMistakes', {
      content,
      textType
    });
  } catch (error) {
    console.error('Error identifying common mistakes:', error);
    const analysis = analyzeContentStructure(content);
    return {
      overallAssessment: `Your ${analysis.wordCount}-word piece shows good effort. I can see you're developing your writing skills.`,
      mistakesIdentified: [],
      patternAnalysis: `Your writing shows ${analysis.sentenceCount} sentences with an average length of ${Math.round(analysis.averageSentenceLength)} words. Continue focusing on clear expression.`,
      priorityFixes: [
        analysis.averageSentenceLength < 6 ? "Try writing some longer, more detailed sentences" : "Good sentence length variety",
        "Proofread carefully for spelling and grammar",
        "Read your work aloud to check if it flows well"
      ],
      positiveElements: [
        `Strong opening: "${analysis.firstSentence.substring(0, 40)}..."`,
        `Good effort with ${analysis.wordCount} words written`
      ]
    };
  }
}

// Keep all other existing functions unchanged but route through backend
export async function generatePrompt(textType: string): Promise<string> {
  try {
    const result = await makeBackendCall('generatePrompt', { textType });
    if (result.error === 'BACKEND_NOT_AVAILABLE') {
      console.log('[DEBUG] Using fallback prompts for local development');
      
      // Enhanced NSW Selective fallback prompts
      const nswSelectiveFallbackPrompts: { [key: string]: string } = {
        narrative: "Write a narrative about a time when you had to make a difficult decision. Show how this experience changed you as a person. Include dialogue, descriptive language, and a clear structure with beginning, middle, and end.",
        persuasive: "Should students be allowed to use technology during class time? Write a persuasive essay arguing your position. Use specific examples, address counterarguments, and include a strong conclusion that calls your reader to action.",
        creative: "Write a creative piece that begins with this line: 'The old photograph revealed a secret that changed everything.' Use sophisticated vocabulary, varied sentence structures, and engaging literary techniques.",
        descriptive: "Describe your ideal learning environment using all five senses. Paint a vivid picture that helps the reader experience this space as if it were real. Focus on sensory details and figurative language.",
        recount: "Recount a significant event from your life. Describe what happened, your feelings, and the outcome. Ensure a clear chronological order and personal reflection.",
        discursive: "Discuss the pros and cons of social media for teenagers. Present a balanced argument, considering various viewpoints, and conclude with your own reasoned perspective.",
        news_report: "Write a news report about a recent local event. Include a catchy headline, lead paragraph (who, what, when, where, why, how), and factual details from reliable sources.",
        letter: "Write a formal letter to your local council proposing a new community initiative. Clearly state your purpose, provide supporting reasons, and suggest next steps.",
        diary: "Write a diary entry from the perspective of a historical figure on a pivotal day in their life. Express their thoughts, feelings, and observations.",
        speech: "Prepare a speech for your school assembly on the importance of environmental conservation. Engage your audience with rhetorical devices and a clear call to action.",
        default: "Write a short story about a magical object found in an unexpected place. Focus on character development and a surprising plot twist."
      };
      return nswSelectiveFallbackPrompts[textType] || nswSelectiveFallbackPrompts.default;
    }
    return result.prompt;
  } catch (error) {
    console.error('Error generating prompt:', error);
    return "An error occurred while generating the prompt. Please try again.";
  }
}

export async function getSynonyms(word: string): Promise<string[]> {
  try {
    const result = await makeBackendCall('getSynonyms', { word });
    if (result.error === 'BACKEND_NOT_AVAILABLE') {
      console.log('[DEBUG] Using fallback synonyms for local development');
      const fallbackSynonyms: { [key: string]: string[] } = {
        good: ['excellent', 'great', 'fine', 'superior', 'pleasant'],
        bad: ['poor', 'terrible', 'awful', 'inferior', 'unpleasant'],
        happy: ['joyful', 'cheerful', 'merry', 'glad', 'delighted'],
        sad: ['unhappy', 'sorrowful', 'depressed', 'gloomy', 'miserable'],
        big: ['large', 'huge', 'gigantic', 'enormous', 'massive'],
        small: ['tiny', 'little', 'miniature', 'petite', 'minuscule']
      };
      return fallbackSynonyms[word.toLowerCase()] || [];
    }
    return result.synonyms;
  } catch (error) {
    console.error('Error getting synonyms:', error);
    return [];
  }
}

export async function rephraseSentence(sentence: string): Promise<string> {
  try {
    const result = await makeBackendCall('rephraseSentence', { sentence });
    if (result.error === 'BACKEND_NOT_AVAILABLE') {
      console.log('[DEBUG] Using fallback rephrased sentence for local development');
      return `"${sentence}" rephrased: This is a rephrased version of your sentence.`;
    }
    return result.rephrasedSentence;
  } catch (error) {
    console.error('Error rephrasing sentence:', error);
    return "An error occurred while rephrasing the sentence.";
  }
}

export async function evaluateEssay(content: string, textType: string): Promise<any> {
  try {
    const result = await makeBackendCall('evaluateEssay', { content, textType });
    if (result.error === 'BACKEND_NOT_AVAILABLE') {
      console.log('[DEBUG] Using fallback essay evaluation for local development');
      return {
        overallFeedback: "This is a fallback evaluation. Your essay shows good effort.",
        score: 75,
        areasForImprovement: ["Expand on your ideas", "Improve sentence structure"],
        strengths: ["Clear topic", "Good vocabulary"]
      };
    }
    return result;
  } catch (error) {
    console.error('Error evaluating essay:', error);
    return { overallFeedback: "An error occurred during essay evaluation.", score: 0, areasForImprovement: [], strengths: [] };
  }
}

export function getTextTypeQuestions(textType: string): string[] {
  const questions: { [key: string]: string[] } = {
    narrative: [
      "What is the main conflict in your story, and how is it resolved?",
      "Have you shown, rather than told, your characters' emotions and motivations?",
      "Is the pacing effective? Are there moments of tension and release?",
      "How does your story's ending leave the reader feeling?"
    ],
    persuasive: [
      "Is your thesis statement clear and compelling?",
      "Have you used strong evidence and logical reasoning to support each argument?",
      "How effectively do you address and refute counterarguments?",
      "Does your conclusion leave a lasting impression and call to action?"
    ],
    expository: [
      "Is your explanation clear and easy for the reader to understand?",
      "Have you provided sufficient details and examples to illustrate your points?",
      "Is the information organized logically, with clear topic sentences for each paragraph?",
      "How do you ensure your writing remains objective and factual?"
    ],
    reflective: [
      "Have you clearly articulated the experience you are reflecting on?",
      "Do you delve deeply into your thoughts and feelings about the experience?",
      "What insights or lessons have you gained from this experience?",
      "How does your reflection connect to broader themes or ideas?"
    ],
    descriptive: [
      "Have you used vivid sensory details (sight, sound, smell, taste, touch) to bring your subject to life?",
      "Are your adjectives and adverbs precise and impactful?",
      "Have you used figurative language (similes, metaphors) effectively?",
      "Does your description create a clear and unified impression for the reader?"
    ],
    recount: [
      "Is the sequence of events clear and easy to follow?",
      "Have you included enough specific details to make the event come alive?",
      "What was the most significant moment, and have you highlighted it?",
      "How did you feel during the event, and have you conveyed that?"
    ],
    discursive: [
      "Have you presented a balanced view of the issue, considering multiple perspectives?",
      "Are your arguments well-supported with evidence or examples?",
      "Is your conclusion thoughtful and does it offer a clear stance or summary?",
      "How do you maintain an objective tone while discussing complex ideas?"
    ],
    news_report: [
      "Have you included all the key information (who, what, when, where, why, how)?",
      "Is your language objective and factual?",
      "Is the most important information presented first?",
      "Have you quoted sources appropriately?"
    ],
    letter: [
      "Is the purpose of your letter clear?",
      "Have you used the appropriate tone and formality for your audience?",
      "Is the structure of your letter correct (address, salutation, body, closing)?",
      "Have you clearly stated any actions you expect from the recipient?"
    ],
    diary: [
      "Does your diary entry sound authentic and personal?",
      "Have you expressed your feelings and thoughts clearly?",
      "Are there enough details to make the events vivid?",
      "What insights or reflections have you included about your day?"
    ],
    speech: [
      "Is your main message clear and compelling?",
      "Have you considered your audience and tailored your language to them?",
      "Does your speech have a strong opening and a memorable closing?",
      "Have you used rhetorical devices effectively to engage your audience?"
    ],
    default: [
      "What is the main purpose of your writing?",
      "Who is your intended audience?",
      "What is one area you'd like to improve in this piece?",
      "What new vocabulary can you incorporate?"
    ]
  };
  return questions[textType.toLowerCase()] || questions.default;
}

// Function to get text type specific vocabulary
export async function getTextTypeVocabulary(textType: string): Promise<any> {
  try {
    return await makeBackendCall('getTextTypeVocabulary', { textType });
  } catch (error) {
    console.error('Error getting text type vocabulary:', error);
    
    // Fallback vocabulary suggestions based on text type
    const vocabularyMap: { [key: string]: any } = {
      narrative: {
        descriptive: ['vivid', 'captivating', 'mesmerizing', 'enchanting', 'breathtaking'],
        emotions: ['elated', 'devastated', 'bewildered', 'triumphant', 'apprehensive'],
        actions: ['sprinted', 'whispered', 'contemplated', 'discovered', 'transformed']
      },
      persuasive: {
        strong_verbs: ['advocate', 'emphasize', 'demonstrate', 'establish', 'convince'],
        connectives: ['furthermore', 'consequently', 'nevertheless', 'undoubtedly', 'ultimately'],
        adjectives: ['compelling', 'crucial', 'significant', 'essential', 'imperative']
      },
      expository: {
        academic: ['analyze', 'examine', 'investigate', 'demonstrate', 'illustrate'],
        connectives: ['therefore', 'however', 'moreover', 'subsequently', 'specifically'],
        precise: ['accurate', 'comprehensive', 'systematic', 'methodical', 'thorough']
      }
    };
    
    return vocabularyMap[textType] || vocabularyMap.narrative;
  }
}

// Function to get writing structure guidance
export async function getWritingStructure(textType: string): Promise<any> {
  try {
    return await makeBackendCall('getWritingStructure', { textType });
  } catch (error) {
    console.error('Error getting writing structure:', error);
    
    // Fallback structure guidance
    const structureMap: { [key: string]: any } = {
      narrative: {
        introduction: "Set the scene with engaging opening",
        body: "Develop plot with rising action, climax, and resolution",
        conclusion: "Reflect on the experience and its significance"
      },
      persuasive: {
        introduction: "Present your position clearly",
        body: "Support arguments with evidence and address counterpoints",
        conclusion: "Reinforce your position with a call to action"
      },
      expository: {
        introduction: "Introduce the topic and thesis",
        body: "Present information logically with supporting details",
        conclusion: "Summarize key points and implications"
      }
    };
    
    return structureMap[textType] || structureMap.narrative;
  }
}


export { openai };

export async function checkOpenAIConnectionStatus(): Promise<{ is_connected: boolean }> {
  try {
    const result = await makeBackendCall("check_openai_connection", {});
    return result;
  } catch (error) {
    console.error("Error checking OpenAI connection status:", error);
    return { is_connected: false };
  }
}


