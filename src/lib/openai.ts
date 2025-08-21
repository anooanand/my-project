// OpenAI Integration with Enhanced Error Handling and Fallback Prompts
// src/lib/openai.ts

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_BASE = import.meta.env.VITE_OPENAI_API_BASE || 'https://api.openai.com/v1';

// High-quality fallback prompts for when AI generation fails
const FALLBACK_PROMPTS = {
  narrative: "Write an engaging story about a character who discovers something unexpected that changes their life forever. Include vivid descriptions, realistic dialogue, and show the character\'s emotional journey. Make sure your story has a clear beginning, middle, and end with a satisfying conclusion. Focus on showing rather than telling, and use sensory details to bring your story to life.",
  
  persuasive: "Choose a topic you feel strongly about and write a persuasive essay to convince others of your viewpoint. Use strong evidence, logical reasoning, and persuasive techniques like rhetorical questions and emotional appeals. Structure your argument clearly with an introduction that states your position, body paragraphs that support your argument with evidence, and a conclusion that reinforces your main point.",
  
  expository: "Select a topic you know well and write an informative essay that teaches others about it. Use clear explanations, relevant examples, and organize your information in a logical sequence. Include an engaging introduction that hooks your reader, body paragraphs that explore different aspects of your topic, and a strong conclusion that summarizes your main points.",
  
  reflective: "Think about a meaningful experience in your life and write a reflective piece exploring what you learned from it. Show your thoughts and feelings, and explain how this experience changed or influenced you. Be honest and thoughtful in your reflection, using specific details to help your reader understand the significance of this experience.",
  
  descriptive: "Choose a place, person, or object that is special to you and write a descriptive piece that brings it to life for your reader. Use sensory details (sight, sound, smell, touch, taste) and figurative language like metaphors and similes to create vivid imagery. Paint a picture with words that allows your reader to experience what you\'re describing.",
  
  recount: "Write about an important event or experience in your life, telling what happened in the order it occurred. Include details about who was involved, where it happened, when it took place, and why it was significant to you. Use descriptive language to help your reader visualize the events and understand their importance."
};

// OpenAI client configuration (for components that expect it)
export const openai = {
  chat: {
    completions: {
      create: async (params: any) => {
        try {
          if (!OPENAI_API_KEY) {
            throw new Error(\'OpenAI API key not configured\');
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
            throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
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

// Enhanced prompt generation with proper error handling
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
export const getNSWSelectiveFeedback = async (content: string, textType: string, feedbackType: string = 'comprehensive', focusAreas: string[] = []): Promise<any> => {
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
            content: `Evaluate this ${textType} writing for NSW Selective School standards. Provide a comprehensive assessment in JSON format, including an overall band score (1-6), total score out of 30, a brief description of the band level, and detailed band-level descriptions for each criterion. Also include specific strengths, areas for improvement, suggestions, priority focus areas, exam strategies, interactive questions, and revision tasks.
            
            JSON format:
            {
              "overallBand": (number 1-6),
              "totalScore": (number 0-30),
              "bandDescription": "brief description of this band level",
              "bandDetails": "detailed explanation of performance at this band level",
              "criteriaFeedback": {
                "ideasAndContent": {
                  "band": (number 1-6),
                  "score": (number 0-10),
                  "maxScore": 10,
                  "strengths": ["strength1"],
                  "improvements": ["improvement1"],
                  "suggestions": ["suggestion1"]
                },
                "structureAndOrganization": {
                  "band": (number 1-6),
                  "score": (number 0-10),
                  "maxScore": 10,
                  "strengths": ["strength1"],
                  "improvements": ["improvement1"],
                  "suggestions": ["suggestion1"]
                },
                "languageAndVocabulary": {
                  "band": (number 1-6),
                  "score": (number 0-5),
                  "maxScore": 5,
                  "strengths": ["strength1"],
                  "improvements": ["improvement1"],
                  "suggestions": ["suggestion1"]
                },
                "grammarAndSpelling": {
                  "band": (number 1-6),
                  "score": (number 0-5),
                  "maxScore": 5,
                  "strengths": ["strength1"],
                  "improvements": ["improvement1"],
                  "suggestions": ["suggestion1"]
                }
              },
              "overallComment": "A general comment on the essay's performance.",
              "priorityFocus": ["focus1", "focus2"],
              "examStrategies": ["strategy1", "strategy2"],
              "interactiveQuestions": ["question1", "question2"],
              "revisionSuggestions": ["task1", "task2"]
            }
            
            Writing: "${content}"`
          }
        ],
        max_tokens: 1200,
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

// Basic NSW feedback fallback (simplified for demonstration)
const getBasicNSWFeedback = (content: string, textType: string) => {
  const wordCount = content.trim().split(/\s+/).length;
  const overallBand = wordCount > 150 ? 4 : 3; // Example logic
  const totalScore = overallBand * 5; // Example logic

  return {
    overallBand: overallBand,
    totalScore: totalScore,
    bandDescription: `Your ${textType} writing is at Band ${overallBand}. This means you are developing good skills but have areas for improvement.`,
    bandDetails: `You demonstrate a ${overallBand >= 4 ? 'sound' : 'basic'} understanding of ${textType} writing. Focus on enhancing your vocabulary and sentence structure.`,
    criteriaFeedback: {
      ideasAndContent: {
        band: overallBand,
        score: Math.min(10, Math.floor(totalScore / 3)),
        maxScore: 10,
        strengths: ["Clear main idea"],
        improvements: ["Expand on ideas with more details"],
        suggestions: ["Brainstorm more before writing"]
      },
      structureAndOrganization: {
        band: overallBand,
        score: Math.min(10, Math.floor(totalScore / 3)),
        maxScore: 10,
        strengths: ["Logical flow"],
        improvements: ["Vary sentence beginnings"],
        suggestions: ["Use transition words"]
      },
      languageAndVocabulary: {
        band: overallBand,
        score: Math.min(5, Math.floor(totalScore / 6)),
        maxScore: 5,
        strengths: ["Appropriate word choice"],
        improvements: ["Use more sophisticated vocabulary"],
        suggestions: ["Look up synonyms for common words"]
      },
      grammarAndSpelling: {
        band: overallBand,
        score: Math.min(5, Math.floor(totalScore / 6)),
        maxScore: 5,
        strengths: ["Mostly accurate grammar"],
        improvements: ["Proofread carefully for errors"],
        suggestions: ["Read your essay aloud to catch mistakes"]
      }
    },
    overallComment: `Overall, your ${textType} writing is progressing well. Keep practicing to reach higher bands!`,
    priorityFocus: ["Developing ideas", "Using varied sentence structures"],
    examStrategies: ["Plan your essay before writing", "Manage your time effectively"],
    interactiveQuestions: ["What is one new vocabulary word you can add to your next essay?", "How can you make your introduction more engaging?"],
    revisionSuggestions: ["Revise your introduction to hook the reader", "Add three descriptive adjectives to your body paragraphs"]
  };
};

// Enhanced text type vocabulary with fallback
export const getTextTypeVocabulary = async (textType: string): Promise<string[]> => {
  console.log('🔄 OpenAI: Getting text type vocabulary for:', textType);
  
  try {
    if (!OPENAI_API_KEY) {
      return getBasicTextTypeVocabulary(textType);
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
            content: `You are a helpful writing assistant. Provide age-appropriate vocabulary for Year 6 students (ages 11-12) for ${textType} writing.`
          },
          {
            role: 'user',
            content: `Provide 10 age-appropriate and relevant vocabulary words for ${textType} writing. Return only the words separated by commas, no additional text.`
          }
        ],
        max_tokens: 100,
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      const vocabulary = data.choices[0].message.content
        .trim()
        .split(',')
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0);
      
      console.log('✅ OpenAI: Text type vocabulary generated successfully');
      return vocabulary;
    } else {
      throw new Error('Invalid response format');
    }
    
  } catch (error) {
    console.error('❌ OpenAI: Error getting text type vocabulary:', error);
    return getBasicTextTypeVocabulary(textType);
  }
};

const getBasicTextTypeVocabulary = (textType: string): string[] => {
  const vocabularyMap: { [key: string]: string[] } = {
    narrative: ['captivating', 'mysterious', 'adventurous', 'dramatic', 'suspenseful', 'vivid', 'enchanting', 'thrilling', 'compelling', 'extraordinary'],
    persuasive: ['convincing', 'compelling', 'essential', 'crucial', 'significant', 'beneficial', 'advantageous', 'important', 'necessary', 'valuable'],
    expository: ['informative', 'comprehensive', 'detailed', 'thorough', 'systematic', 'analytical', 'factual', 'precise', 'accurate', 'educational'],
    reflective: ['thoughtful', 'meaningful', 'insightful', 'contemplative', 'introspective', 'profound', 'significant', 'transformative', 'enlightening', 'personal'],
    descriptive: ['vivid', 'picturesque', 'stunning', 'magnificent', 'breathtaking', 'spectacular', 'gorgeous', 'beautiful', 'striking', 'impressive'],
    recount: ['memorable', 'significant', 'eventful', 'remarkable', 'unforgettable', 'important', 'notable', 'meaningful', 'impactful', 'consequential']
  };
  
  return vocabularyMap[textType] || vocabularyMap.narrative;
};

export const getWritingFeedback = async (content: string, textType: string): Promise<any> => {
  return await getNSWSelectiveFeedback(content, textType);
};

export const getWritingStructure = async (textType: string): Promise<any> => {
  console.log('🔄 OpenAI: Getting writing structure for:', textType);
  
  const structures = {
    narrative: {
      introduction: "Hook the reader with an engaging opening",
      body: "Develop the plot with rising action, climax, and falling action",
      conclusion: "Provide a satisfying resolution"
    },
    persuasive: {
      introduction: "State your position clearly",
      body: "Present arguments with evidence and examples",
      conclusion: "Reinforce your position and call to action"
    },
    expository: {
      introduction: "Introduce the topic and main idea",
      body: "Explain with facts, examples, and details",
      conclusion: "Summarize the main points"
    }
  };
  
  return structures[textType as keyof typeof structures] || structures.narrative;
};

export const identifyCommonMistakes = async (content: string): Promise<any[]> => {
  console.log('🔄 OpenAI: Identifying common mistakes');
  
  const mistakes = [];
  
  // Basic mistake detection
  if (content.includes('i ')) {
    mistakes.push({
      type: 'capitalization',
      message: 'Remember to capitalize "I"',
      suggestion: 'Always capitalize the pronoun "I"'
    });
  }
  
  if (content.includes('its a')) {
    mistakes.push({
      type: 'grammar',
      message: 'Check your contractions',
      suggestion: 'Use "it\'s" for "it is"'
    });
  }
  
  return mistakes;
};

export const checkOpenAIConnectionStatus = async (): Promise<boolean> => {
  try {
    if (!OPENAI_API_KEY) {
      return false;
    }
    
    // Simple test request
    const response = await fetch(`${OPENAI_API_BASE}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
    });
    
    return response.ok;
  } catch (error) {
    console.error('OpenAI connection check failed:', error);
    return false;
  }
};

// Additional exports that might be expected by other components
export const getEnhancedFeedback = getNSWSelectiveFeedback;
export const analyzeText = evaluateEssay;
export const improveWriting = rephraseSentence;

// Default export with all functions
export default {
  openai,
  generatePrompt,
  getSynonyms,
  rephraseSentence,
  evaluateEssay,
  getNSWSelectiveFeedback,
  getEnhancedFeedback,
  analyzeText,
  improveWriting,
  getTextTypeVocabulary,
  getWritingFeedback,
  getWritingStructure,
  identifyCommonMistakes,
  checkOpenAIConnectionStatus
};
