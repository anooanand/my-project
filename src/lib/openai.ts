// Fixed openai.ts with improved error handling and better API integration

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_BASE = import.meta.env.VITE_OPENAI_API_BASE || 'https://api.openai.com/v1';

// High-quality fallback prompts for when AI generation fails
const FALLBACK_PROMPTS = {
  narrative: "Write an engaging story about a character who discovers something unexpected that changes their life forever. Include vivid descriptions, realistic dialogue, and show the character's emotional journey. Make sure your story has a clear beginning, middle, and end with a satisfying conclusion. Focus on showing rather than telling, and use sensory details to bring your story to life.",
  
  persuasive: "Choose a topic you feel strongly about and write a persuasive essay to convince others of your viewpoint. Use strong evidence, logical reasoning, and persuasive techniques like rhetorical questions and emotional appeals. Structure your argument clearly with an introduction that states your position, body paragraphs that support your argument with evidence, and a conclusion that reinforces your main point.",
  
  expository: "Select a topic you know well and write an informative essay that teaches others about it. Use clear explanations, relevant examples, and organize your information in a logical sequence. Include an engaging introduction that hooks your reader, body paragraphs that explore different aspects of your topic, and a strong conclusion that summarizes your main points.",
  
  reflective: "Think about a meaningful experience in your life and write a reflective piece exploring what you learned from it. Show your thoughts and feelings, and explain how this experience changed or influenced you. Be honest and thoughtful in your reflection, using specific details to help your reader understand the significance of this experience.",
  
  descriptive: "Choose a place, person, or object that is special to you and write a descriptive piece that brings it to life for your reader. Use sensory details (sight, sound, smell, touch, taste) and figurative language like metaphors and similes to create vivid imagery. Paint a picture with words that allows your reader to experience what you're describing.",
  
  recount: "Write about an important event or experience in your life, telling what happened in the order it occurred. Include details about who was involved, where it happened, when it took place, and why it was significant to you. Use descriptive language to help your reader visualize the events and understand their importance."
};

// OpenAI client configuration (for components that expect it)
export const openai = {
  chat: {
    completions: {
      create: async (params: any) => {
        try {
          if (!OPENAI_API_KEY) {
            throw new Error("OpenAI API key not configured");
          }

          const response = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify(params),
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`);
          }

          return await response.json();
        } catch (error) {
          console.error('OpenAI API call failed:', error);
          throw error;
        }
      }
    }
  }
};

// FIXED: Enhanced essay evaluation with comprehensive error handling and user feedback
export const evaluateEssay = async (content: string, textType: string): Promise<any> => {
  console.log('🔄 OpenAI: Starting essay evaluation');
  
  // Input validation
  if (!content || !content.trim()) {
    throw new Error('No content provided for evaluation');
  }

  if (content.trim().length < 10) {
    throw new Error('Content too short for meaningful evaluation');
  }

  try {
    // Check if API key is available
    if (!OPENAI_API_KEY || OPENAI_API_KEY.trim() === '') {
      console.warn('⚠️ OpenAI API key not configured, using fallback evaluation');
      return getEnhancedFallbackEvaluation(content, textType);
    }

    // Validate API key format
    if (!OPENAI_API_KEY.startsWith('sk-')) {
      console.warn('⚠️ Invalid OpenAI API key format, using fallback evaluation');
      return getEnhancedFallbackEvaluation(content, textType);
    }

    console.log('🔑 OpenAI API key found, attempting API call...');

    const response = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4', // Using GPT-4 for better quality as per knowledge base
        messages: [
          {
            role: 'system',
            content: `You are an expert teacher evaluating ${textType} writing for NSW Selective School entrance exams. Provide constructive, encouraging feedback appropriate for Year 6 students. Focus on specific strengths and actionable improvements.`
          },
          {
            role: 'user',
            content: `Please evaluate this ${textType} writing piece and provide feedback in JSON format with the following structure:
            {
              "overallScore": (number 1-10),
              "strengths": ["strength1", "strength2", "strength3"],
              "improvements": ["improvement1", "improvement2", "improvement3"],
              "specificFeedback": "detailed encouraging feedback paragraph",
              "nextSteps": ["step1", "step2", "step3"]
            }
            
            Writing piece:
            "${content}"`
          }
        ],
        max_tokens: 800,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ OpenAI API error: ${response.status} ${response.statusText}`, errorText);
      
      // Provide specific error messages based on status codes
      if (response.status === 401) {
        throw new Error('Invalid API key. Please check your OpenAI API key configuration.');
      } else if (response.status === 429) {
        throw new Error('API rate limit exceeded. Please try again in a moment.');
      } else if (response.status === 500) {
        throw new Error('OpenAI service temporarily unavailable. Please try again later.');
      } else {
        throw new Error(`API request failed with status ${response.status}. Please try again.`);
      }
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('❌ Invalid response format from OpenAI API');
      throw new Error('Invalid response from AI service. Please try again.');
    }

    try {
      const evaluation = JSON.parse(data.choices[0].message.content);
      
      // Validate the evaluation structure
      if (!evaluation.overallScore || !evaluation.strengths || !evaluation.improvements) {
        console.warn('⚠️ Incomplete evaluation from API, enhancing with fallback data');
        return enhanceEvaluation(evaluation, content, textType);
      }
      
      console.log('✅ OpenAI: Essay evaluated successfully');
      return evaluation;
    } catch (parseError) {
      console.error('❌ Error parsing evaluation JSON:', parseError);
      throw new Error('Failed to process AI evaluation. Please try again.');
    }
    
  } catch (error) {
    console.error('❌ OpenAI: Error evaluating essay:', error);
    
    // If it's a network error or API error, provide fallback
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.log('🔄 Network error detected, using enhanced fallback evaluation');
      return getEnhancedFallbackEvaluation(content, textType);
    }
    
    // Re-throw the error with context for the UI to handle
    throw error;
  }
};

// FIXED: Enhanced fallback evaluation with more detailed analysis
const getEnhancedFallbackEvaluation = (content: string, textType: string) => {
  const wordCount = content.trim().split(/\s+/).length;
  const sentenceCount = content.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  const avgWordsPerSentence = Math.round(wordCount / sentenceCount);
  
  // Calculate a more sophisticated score based on content analysis
  let baseScore = 6; // Start with a reasonable base score
  
  // Word count scoring
  if (wordCount >= 200) baseScore += 1;
  if (wordCount >= 300) baseScore += 0.5;
  
  // Sentence variety scoring
  if (avgWordsPerSentence >= 8 && avgWordsPerSentence <= 20) baseScore += 0.5;
  
  // Content quality indicators
  const hasGoodVocabulary = /\b(magnificent|extraordinary|fascinating|incredible|remarkable|outstanding|exceptional|brilliant|wonderful|amazing)\b/i.test(content);
  const hasVariedSentenceStarts = checkSentenceVariety(content);
  const hasDescriptiveLanguage = /\b(shimmering|glistening|towering|whispered|thundered|gracefully|swiftly|gently)\b/i.test(content);
  
  if (hasGoodVocabulary) baseScore += 0.5;
  if (hasVariedSentenceStarts) baseScore += 0.5;
  if (hasDescriptiveLanguage) baseScore += 0.5;
  
  const finalScore = Math.min(Math.max(Math.round(baseScore * 10) / 10, 5), 9); // Keep between 5-9
  
  // Generate contextual feedback based on text type
  const textTypeSpecificFeedback = getTextTypeSpecificFeedback(textType, content, wordCount);
  
  return {
    overallScore: finalScore,
    strengths: [
      wordCount >= 150 ? `Great effort with ${wordCount} words - you've written a substantial piece!` : "Good start on your writing!",
      hasGoodVocabulary ? "Excellent use of sophisticated vocabulary words" : "Clear and understandable language throughout",
      hasVariedSentenceStarts ? "Nice variety in how you start your sentences" : "Good sentence structure and flow",
      textTypeSpecificFeedback.strength
    ].filter(Boolean),
    improvements: [
      wordCount < 200 ? "Try to expand your ideas with more details and examples" : "Consider adding even more descriptive details",
      !hasDescriptiveLanguage ? "Add more sensory details (what you see, hear, feel, smell, taste)" : "Continue using descriptive language effectively",
      avgWordsPerSentence < 8 ? "Try combining some short sentences for better flow" : avgWordsPerSentence > 25 ? "Break up some longer sentences for clarity" : "Experiment with different sentence lengths",
      textTypeSpecificFeedback.improvement
    ].filter(Boolean),
    specificFeedback: `Great work on your ${textType} writing! You've written ${wordCount} words with an average of ${avgWordsPerSentence} words per sentence. ${textTypeSpecificFeedback.specific} Keep practicing and experimenting with different techniques to make your writing even more engaging. Remember, every great writer started exactly where you are now!`,
    nextSteps: [
      "Read your work aloud to check how it sounds",
      "Try adding one more descriptive detail to each paragraph",
      "Practice writing a little bit every day",
      textTypeSpecificFeedback.nextStep
    ].filter(Boolean)
  };
};

// Helper function to check sentence variety
const checkSentenceVariety = (content: string): boolean => {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length < 3) return false;
  
  const firstWords = sentences.map(s => s.trim().split(/\s+/)[0]?.toLowerCase()).filter(Boolean);
  const uniqueFirstWords = new Set(firstWords);
  
  return uniqueFirstWords.size / firstWords.length > 0.6; // At least 60% variety
};

// Helper function to provide text-type specific feedback
const getTextTypeSpecificFeedback = (textType: string, content: string, wordCount: number) => {
  switch (textType.toLowerCase()) {
    case 'narrative':
      const hasDialogue = content.includes('"') || content.includes("'");
      const hasCharacterDevelopment = /\b(felt|thought|realized|discovered|learned|changed)\b/i.test(content);
      return {
        strength: hasDialogue ? "Great use of dialogue to bring characters to life" : "Good storytelling structure",
        improvement: !hasCharacterDevelopment ? "Show how your characters think and feel" : "Add more sensory details to your scenes",
        specific: hasDialogue ? "Your dialogue helps readers connect with the characters." : "Consider adding some dialogue to make your story more engaging.",
        nextStep: "Try writing from different characters' perspectives"
      };
      
    case 'persuasive':
      const hasEvidence = /\b(because|since|for example|research shows|studies indicate|according to)\b/i.test(content);
      const hasCounterargument = /\b(however|although|while|some might say|critics argue)\b/i.test(content);
      return {
        strength: hasEvidence ? "Strong use of evidence to support your arguments" : "Clear position on the topic",
        improvement: !hasCounterargument ? "Consider addressing opposing viewpoints" : "Add more specific examples",
        specific: hasEvidence ? "Your evidence makes your argument convincing." : "Try adding specific examples or statistics to strengthen your points.",
        nextStep: "Research one more fact to support your main argument"
      };
      
    case 'expository':
      const hasExamples = /\b(for example|such as|including|like|instance)\b/i.test(content);
      const hasSequence = /\b(first|second|next|then|finally|in conclusion)\b/i.test(content);
      return {
        strength: hasSequence ? "Excellent organization with clear sequence words" : "Good explanation of the topic",
        improvement: !hasExamples ? "Add specific examples to illustrate your points" : "Include more detailed explanations",
        specific: hasExamples ? "Your examples help readers understand the topic clearly." : "Consider adding real-world examples to make your explanation more concrete.",
        nextStep: "Add one more example to clarify a complex point"
      };
      
    default:
      return {
        strength: "Good understanding of the writing task",
        improvement: "Continue developing your ideas with more detail",
        specific: "You've shown good effort in your writing.",
        nextStep: "Keep practicing different writing techniques"
      };
  }
};

// Helper function to enhance incomplete evaluations
const enhanceEvaluation = (evaluation: any, content: string, textType: string) => {
  const fallback = getEnhancedFallbackEvaluation(content, textType);
  
  return {
    overallScore: evaluation.overallScore || fallback.overallScore,
    strengths: evaluation.strengths || fallback.strengths,
    improvements: evaluation.improvements || fallback.improvements,
    specificFeedback: evaluation.specificFeedback || fallback.specificFeedback,
    nextSteps: evaluation.nextSteps || fallback.nextSteps
  };
};

// FIXED: Enhanced connection status check
export const checkOpenAIConnectionStatus = async (): Promise<{ is_connected: boolean; error?: string }> => {
  try {
    if (!OPENAI_API_KEY || OPENAI_API_KEY.trim() === '') {
      return { is_connected: false, error: 'API key not configured' };
    }

    if (!OPENAI_API_KEY.startsWith('sk-')) {
      return { is_connected: false, error: 'Invalid API key format' };
    }

    // Test with a minimal API call
    const response = await fetch(`${OPENAI_API_BASE}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
    });

    if (response.ok) {
      console.log('✅ OpenAI connection verified');
      return { is_connected: true };
    } else {
      console.warn('⚠️ OpenAI connection failed:', response.status);
      return { is_connected: false, error: `API error: ${response.status}` };
    }
  } catch (error) {
    console.error('❌ OpenAI connection check failed:', error);
    return { is_connected: false, error: 'Connection failed' };
  }
};

// Enhanced prompt generation with fallback
export const generatePrompt = async (textType: string): Promise<string> => {
  console.log('🔄 OpenAI: Generating prompt for', textType);
  
  try {
    if (!OPENAI_API_KEY) {
      return FALLBACK_PROMPTS[textType as keyof typeof FALLBACK_PROMPTS] || FALLBACK_PROMPTS.narrative;
    }

    const response = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a creative writing teacher creating engaging prompts for Year 6 students preparing for NSW Selective School exams.'
          },
          {
            role: 'user',
            content: `Create an engaging ${textType} writing prompt suitable for Year 6 students. Make it interesting, age-appropriate, and inspiring.`
          }
        ],
        max_tokens: 200,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      console.log('✅ OpenAI: Prompt generated successfully');
      return data.choices[0].message.content;
    } else {
      throw new Error('Invalid response format');
    }
    
  } catch (error) {
    console.error('❌ OpenAI: Error generating prompt:', error);
    return FALLBACK_PROMPTS[textType as keyof typeof FALLBACK_PROMPTS] || FALLBACK_PROMPTS.narrative;
  }
};

// Enhanced synonym generation with fallback
export const getSynonyms = async (word: string): Promise<string[]> => {
  console.log('🔄 OpenAI: Getting synonyms for', word);
  
  try {
    if (!OPENAI_API_KEY) {
      return getBasicSynonyms(word);
    }

    const response = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a vocabulary expert helping Year 6 students improve their writing with age-appropriate synonyms.'
          },
          {
            role: 'user',
            content: `Provide 5 age-appropriate synonyms for the word "${word}". Return only the synonyms separated by commas, no explanations.`
          }
        ],
        max_tokens: 50,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      const synonyms = data.choices[0].message.content
        .split(',')
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0);
      
      console.log('✅ OpenAI: Synonyms generated successfully');
      return synonyms;
    } else {
      throw new Error('Invalid response format');
    }
    
  } catch (error) {
    console.error('❌ OpenAI: Error getting synonyms:', error);
    return getBasicSynonyms(word);
  }
};

// Basic synonym fallback
const getBasicSynonyms = (word: string): string[] => {
  const synonymMap: { [key: string]: string[] } = {
    'good': ['great', 'excellent', 'wonderful', 'fantastic', 'amazing'],
    'bad': ['terrible', 'awful', 'horrible', 'dreadful', 'poor'],
    'big': ['large', 'huge', 'enormous', 'massive', 'gigantic'],
    'small': ['tiny', 'little', 'miniature', 'petite', 'compact'],
    'happy': ['joyful', 'cheerful', 'delighted', 'pleased', 'content'],
    'sad': ['unhappy', 'sorrowful', 'gloomy', 'dejected', 'melancholy'],
    'fast': ['quick', 'rapid', 'swift', 'speedy', 'hasty'],
    'slow': ['gradual', 'leisurely', 'sluggish', 'unhurried', 'delayed']
  };
  
  return synonymMap[word.toLowerCase()] || ['No synonyms found'];
};

// Enhanced sentence rephrasing with fallback
export const rephraseSentence = async (sentence: string): Promise<string> => {
  console.log('🔄 OpenAI: Rephrasing sentence');
  
  try {
    if (!OPENAI_API_KEY) {
      return sentence; // Return original if no API key
    }

    const response = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a writing assistant helping Year 6 students improve their sentences. Rephrase sentences to be more engaging while keeping them age-appropriate.'
          },
          {
            role: 'user',
            content: `Please rephrase this sentence to make it more engaging: "${sentence}"`
          }
        ],
        max_tokens: 100,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      console.log('✅ OpenAI: Sentence rephrased successfully');
      return data.choices[0].message.content;
    } else {
      throw new Error('Invalid response format');
    }
    
  } catch (error) {
    console.error('❌ OpenAI: Error rephrasing sentence:', error);
    return sentence; // Return original sentence on error
  }
};

// Additional exports that might be expected by other components
export const getEnhancedFeedback = evaluateEssay;
export const analyzeText = evaluateEssay;
export const improveWriting = rephraseSentence;

// Default export with all functions
export default {
  openai,
  generatePrompt,
  getSynonyms,
  rephraseSentence,
  evaluateEssay,
  getEnhancedFeedback,
  analyzeText,
  improveWriting,
  checkOpenAIConnectionStatus
};
