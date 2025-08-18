// OpenAI Integration with Enhanced Error Handling and Fallback Prompts
// src/lib/openai.ts

const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
const OPENAI_API_BASE = process.env.REACT_APP_OPENAI_API_BASE || 'https://api.openai.com/v1';

// High-quality fallback prompts for when AI generation fails
const FALLBACK_PROMPTS = {
  narrative: "Write an engaging story about a character who discovers something unexpected that changes their life forever. Include vivid descriptions, realistic dialogue, and show the character's emotional journey. Make sure your story has a clear beginning, middle, and end with a satisfying conclusion. Focus on showing rather than telling, and use sensory details to bring your story to life.",
  
  persuasive: "Choose a topic you feel strongly about and write a persuasive essay to convince others of your viewpoint. Use strong evidence, logical reasoning, and persuasive techniques like rhetorical questions and emotional appeals. Structure your argument clearly with an introduction that states your position, body paragraphs that support your argument with evidence, and a conclusion that reinforces your main point.",
  
  expository: "Select a topic you know well and write an informative essay that teaches others about it. Use clear explanations, relevant examples, and organize your information in a logical sequence. Include an engaging introduction that hooks your reader, body paragraphs that explore different aspects of your topic, and a strong conclusion that summarizes your main points.",
  
  reflective: "Think about a meaningful experience in your life and write a reflective piece exploring what you learned from it. Show your thoughts and feelings, and explain how this experience changed or influenced you. Be honest and thoughtful in your reflection, using specific details to help your reader understand the significance of this experience.",
  
  descriptive: "Choose a place, person, or object that is special to you and write a descriptive piece that brings it to life for your reader. Use sensory details (sight, sound, smell, touch, taste) and figurative language like metaphors and similes to create vivid imagery. Paint a picture with words that allows your reader to experience what you're describing.",
  
  recount: "Write about an important event or experience in your life, telling what happened in the order it occurred. Include details about who was involved, where it happened, when it took place, and why it was significant to you. Use descriptive language to help your reader visualize the events and understand their importance."
};

// FIXED: Enhanced prompt generation with proper error handling
export const generatePrompt = async (textType: string): Promise<string> => {
  console.log('🔄 OpenAI: Generating prompt for text type:', textType);
  
  try {
    // Check if OpenAI API key is configured
    if (!OPENAI_API_KEY) {
      console.warn('⚠️ OpenAI API key not found, using fallback prompt');
      return getFallbackPrompt(textType);
    }

    // Create the API request
    const response = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an expert writing teacher for NSW Selective School entrance exams. Generate engaging, age-appropriate writing prompts for Year 6 students (ages 11-12).`
          },
          {
            role: 'user',
            content: `Create a creative and engaging ${textType} writing prompt for a Year 6 student preparing for NSW Selective School entrance exams. The prompt should:
            
            1. Be age-appropriate and interesting for 11-12 year olds
            2. Encourage creativity and critical thinking
            3. Be clear and specific enough to guide their writing
            4. Allow for personal expression and unique perspectives
            5. Be suitable for a 40-minute writing task
            
            Make the prompt inspiring and fun while maintaining educational value. Return only the prompt text, no additional formatting or explanations.`
          }
        ],
        max_tokens: 200,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
      const generatedPrompt = data.choices[0].message.content.trim();
      console.log('✅ OpenAI: Prompt generated successfully');
      return generatedPrompt;
    } else {
      throw new Error('Invalid response format from OpenAI API');
    }
    
  } catch (error) {
    console.error('❌ OpenAI: Error generating prompt:', error);
    
    // Return fallback prompt instead of failing completely
    console.log('🔄 OpenAI: Using fallback prompt');
    return getFallbackPrompt(textType);
  }
};

// Get fallback prompt for the specified text type
const getFallbackPrompt = (textType: string): string => {
  return FALLBACK_PROMPTS[textType as keyof typeof FALLBACK_PROMPTS] || FALLBACK_PROMPTS.narrative;
};

// Enhanced synonym generation with fallback
export const getSynonyms = async (word: string): Promise<string[]> => {
  console.log('🔄 OpenAI: Getting synonyms for:', word);
  
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
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful writing assistant. Provide synonyms that are appropriate for Year 6 students (ages 11-12).'
          },
          {
            role: 'user',
            content: `Provide 5 age-appropriate synonyms for the word "${word}". Return only the synonyms separated by commas, no additional text.`
          }
        ],
        max_tokens: 100,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      const synonyms = data.choices[0].message.content
        .trim()
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
    'big': ['large', 'huge', 'enormous', 'massive', 'giant'],
    'small': ['tiny', 'little', 'miniature', 'petite', 'compact'],
    'happy': ['joyful', 'cheerful', 'delighted', 'pleased', 'content'],
    'sad': ['unhappy', 'sorrowful', 'gloomy', 'dejected', 'melancholy'],
    'fast': ['quick', 'rapid', 'swift', 'speedy', 'hasty'],
    'slow': ['sluggish', 'gradual', 'leisurely', 'unhurried', 'delayed']
  };
  
  return synonymMap[word.toLowerCase()] || [word];
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
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a writing assistant helping Year 6 students improve their writing. Rephrase sentences to be more engaging and age-appropriate.'
          },
          {
            role: 'user',
            content: `Rephrase this sentence to make it more engaging and varied while keeping the same meaning: "${sentence}". Return only the rephrased sentence.`
          }
        ],
        max_tokens: 150,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      const rephrased = data.choices[0].message.content.trim();
      console.log('✅ OpenAI: Sentence rephrased successfully');
      return rephrased;
    } else {
      throw new Error('Invalid response format');
    }
    
  } catch (error) {
    console.error('❌ OpenAI: Error rephrasing sentence:', error);
    return sentence; // Return original sentence on error
  }
};

// Enhanced essay evaluation with fallback
export const evaluateEssay = async (content: string, textType: string): Promise<any> => {
  console.log('🔄 OpenAI: Evaluating essay');
  
  try {
    if (!OPENAI_API_KEY) {
      return getBasicEvaluation(content, textType);
    }

    const response = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an expert teacher evaluating ${textType} writing for NSW Selective School entrance exams. Provide constructive feedback appropriate for Year 6 students.`
          },
          {
            role: 'user',
            content: `Please evaluate this ${textType} writing piece and provide feedback in JSON format with the following structure:
            {
              "overallScore": (number 1-10),
              "strengths": ["strength1", "strength2"],
              "improvements": ["improvement1", "improvement2"],
              "specificFeedback": "detailed feedback paragraph",
              "nextSteps": ["step1", "step2"]
            }
            
            Writing piece:
            "${content}"`
          }
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      try {
        const evaluation = JSON.parse(data.choices[0].message.content);
        console.log('✅ OpenAI: Essay evaluated successfully');
        return evaluation;
      } catch (parseError) {
        console.error('Error parsing evaluation JSON:', parseError);
        return getBasicEvaluation(content, textType);
      }
    } else {
      throw new Error('Invalid response format');
    }
    
  } catch (error) {
    console.error('❌ OpenAI: Error evaluating essay:', error);
    return getBasicEvaluation(content, textType);
  }
};

// Basic evaluation fallback
const getBasicEvaluation = (content: string, textType: string) => {
  const wordCount = content.trim().split(/\s+/).length;
  const hasGoodLength = wordCount >= 150;
  const hasVariedSentences = content.includes('.') && content.includes(',');
  
  return {
    overallScore: hasGoodLength && hasVariedSentences ? 7 : 5,
    strengths: [
      hasGoodLength ? "Good length and development" : "Shows effort in writing",
      hasVariedSentences ? "Uses varied punctuation" : "Clear communication"
    ],
    improvements: [
      !hasGoodLength ? "Try to develop your ideas more fully" : "Consider adding more descriptive details",
      !hasVariedSentences ? "Use more varied sentence structures" : "Check for spelling and grammar"
    ],
    specificFeedback: `Your ${textType} writing shows good effort. ${hasGoodLength ? 'You have developed your ideas well with a good length.' : 'Try to expand your ideas with more details and examples.'} ${hasVariedSentences ? 'Your use of punctuation helps make your writing clear.' : 'Consider using more varied sentence structures to make your writing more engaging.'}`,
    nextSteps: [
      "Read your work aloud to check for flow",
      "Add more descriptive words to paint a clearer picture"
    ]
  };
};

// NSW Selective feedback function
export const getNSWSelectiveFeedback = async (content: string, textType: string, feedbackType: string, focusAreas: string[]): Promise<any> => {
  console.log('🔄 OpenAI: Getting NSW Selective feedback');
  
  try {
    if (!OPENAI_API_KEY) {
      return getBasicNSWFeedback(content, textType);
    }

    const response = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert NSW Selective School entrance exam evaluator. Provide detailed, constructive feedback for Year 6 students.'
          },
          {
            role: 'user',
            content: `Evaluate this ${textType} writing for NSW Selective School standards. Focus on: ${focusAreas.join(', ') || 'overall quality'}. 
            
            Provide feedback in JSON format:
            {
              "score": (number 1-10),
              "criteria": {
                "ideas": (number 1-10),
                "organization": (number 1-10),
                "voice": (number 1-10),
                "wordChoice": (number 1-10),
                "sentenceFluency": (number 1-10),
                "conventions": (number 1-10)
              },
              "strengths": ["strength1", "strength2"],
              "improvements": ["improvement1", "improvement2"],
              "detailedFeedback": "comprehensive feedback paragraph",
              "suggestions": ["suggestion1", "suggestion2"]
            }
            
            Writing: "${content}"`
          }
        ],
        max_tokens: 600,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      try {
        const feedback = JSON.parse(data.choices[0].message.content);
        console.log('✅ OpenAI: NSW Selective feedback generated successfully');
        return feedback;
      } catch (parseError) {
        console.error('Error parsing NSW feedback JSON:', parseError);
        return getBasicNSWFeedback(content, textType);
      }
    } else {
      throw new Error('Invalid response format');
    }
    
  } catch (error) {
    console.error('❌ OpenAI: Error getting NSW Selective feedback:', error);
    return getBasicNSWFeedback(content, textType);
  }
};

// Basic NSW feedback fallback
const getBasicNSWFeedback = (content: string, textType: string) => {
  const wordCount = content.trim().split(/\s+/).length;
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgSentenceLength = sentences.length > 0 ? wordCount / sentences.length : 0;
  
  const baseScore = Math.min(10, Math.max(1, Math.round(wordCount / 30)));
  
  return {
    score: baseScore,
    criteria: {
      ideas: Math.min(10, baseScore + 1),
      organization: baseScore,
      voice: Math.max(1, baseScore - 1),
      wordChoice: baseScore,
      sentenceFluency: avgSentenceLength > 8 ? Math.min(10, baseScore + 1) : Math.max(1, baseScore - 1),
      conventions: baseScore
    },
    strengths: [
      wordCount >= 100 ? "Good development of ideas" : "Clear communication",
      sentences.length > 3 ? "Uses varied sentence structures" : "Shows understanding of the task"
    ],
    improvements: [
      wordCount < 150 ? "Expand your ideas with more details" : "Consider adding more sophisticated vocabulary",
      avgSentenceLength < 8 ? "Try using longer, more complex sentences" : "Check for spelling and punctuation"
    ],
    detailedFeedback: `Your ${textType} writing demonstrates ${wordCount >= 150 ? 'good' : 'developing'} understanding of the task requirements. ${wordCount >= 100 ? 'You have provided sufficient detail to support your ideas.' : 'Consider expanding your ideas with more specific examples and details.'} Your sentence structure ${avgSentenceLength > 8 ? 'shows good variety' : 'could benefit from more complexity'}.`,
    suggestions: [
      "Use more descriptive adjectives and adverbs",
      "Include specific examples to support your main points",
      "Read your work aloud to check for flow and clarity"
    ]
  };
};

export default {
  generatePrompt,
  getSynonyms,
  rephraseSentence,
  evaluateEssay,
  getNSWSelectiveFeedback
};
