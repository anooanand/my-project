// Fixed OpenAI service with proper connectivity

interface ChatRequest {
  userMessage: string;
  textType: string;
  currentContent: string;
  wordCount: number;
  context?: string;
}

// Main function to make OpenAI API calls - FIXED VERSION
export async function makeOpenAICall(systemPrompt: string, userPrompt: string, maxTokens: number = 200): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  const apiBase = import.meta.env.VITE_OPENAI_API_BASE || 'https://api.openai.com/v1';
  
  // Remove excessive logging that might cause issues
  console.log('Making OpenAI API call...');
  
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  // Validate API key format
  if (!apiKey.startsWith('sk-')) {
    throw new Error('Invalid OpenAI API key format');
  }

  try {
    const requestBody = {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: maxTokens,
      temperature: 0.7
    };

    console.log('Request body prepared');

    const response = await fetch(`${apiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    console.log('Response received:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', response.status, errorText);
      
      // Handle specific error cases
      if (response.status === 401) {
        throw new Error('Invalid API key - please check your OpenAI API key');
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded - please try again later');
      } else if (response.status === 500) {
        throw new Error('OpenAI server error - please try again');
      } else {
        throw new Error(`OpenAI API error: ${response.status}`);
      }
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from OpenAI');
    }

    console.log('API call successful');
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('OpenAI API call failed:', error);
    throw error;
  }
}

// Simplified connection test - FIXED VERSION
export async function checkOpenAIConnectionStatus(): Promise<boolean> {
  try {
    console.log('Testing OpenAI connection...');
    
    // Simple test with minimal token usage
    const response = await makeOpenAICall(
      "You are a test assistant.",
      "Say 'OK' if you can read this.",
      10
    );
    
    console.log('Connection test successful:', response);
    return true;
  } catch (error) {
    console.error('Connection test failed:', error);
    return false;
  }
}

// Enhanced chat response function - FIXED VERSION
export async function generateChatResponse(request: ChatRequest): Promise<string> {
  const { userMessage, textType, currentContent, wordCount, context } = request;
  
  console.log('Generating chat response...');
  
  const systemPrompt = `You are an AI Writing Buddy for NSW Selective School exam preparation. You're helping a student with their ${textType} writing.

CONTEXT:
- Student is writing a ${textType} story
- Current word count: ${wordCount}
- ${context || ''}

PERSONALITY:
- Friendly, encouraging, and supportive
- Use emojis occasionally to be engaging
- Speak like a helpful friend, not a formal teacher
- Keep responses concise but helpful (2-3 sentences max)

FOCUS AREAS:
- NSW Selective writing criteria
- Story structure and plot development
- Character development and emotions
- Descriptive language and vocabulary
- Grammar and sentence structure
- Creative ideas and inspiration

CURRENT CONTENT PREVIEW:
${currentContent.slice(0, 200)}${currentContent.length > 200 ? '...' : ''}

Respond to the student's question in a helpful, encouraging way.`;

  const userPrompt = `Student question: "${userMessage}"

Please provide a helpful, encouraging response.`;

  try {
    const response = await makeOpenAICall(systemPrompt, userPrompt, 150);
    return response;
  } catch (error) {
    console.error('Chat response error:', error);
    throw error; // Let the calling function handle the fallback
  }
}

// Get synonyms for words
export async function getSynonyms(word: string): Promise<string[]> {
  const systemPrompt = `You are a vocabulary assistant. Provide 5 sophisticated synonyms for the given word that would be appropriate for NSW Selective level writing.`;
  const userPrompt = `Provide synonyms for: ${word}`;

  try {
    const response = await makeOpenAICall(systemPrompt, userPrompt, 100);
    const synonyms = response.split(/[,\n]/)
      .map(s => s.trim().replace(/^\d+\.?\s*/, ''))
      .filter(s => s.length > 0 && s !== word)
      .slice(0, 5);
    
    return synonyms.length > 0 ? synonyms : getFallbackSynonyms(word);
  } catch (error) {
    console.error('Error getting synonyms:', error);
    return getFallbackSynonyms(word);
  }
}

// Fallback synonyms for common words
function getFallbackSynonyms(word: string): string[] {
  const synonymMap = {
    'said': ['whispered', 'exclaimed', 'muttered', 'declared', 'announced'],
    'big': ['enormous', 'massive', 'gigantic', 'colossal', 'immense'],
    'small': ['tiny', 'miniature', 'petite', 'minuscule', 'compact'],
    'good': ['excellent', 'outstanding', 'remarkable', 'exceptional', 'superb'],
    'bad': ['terrible', 'awful', 'dreadful', 'horrible', 'atrocious'],
    'happy': ['delighted', 'ecstatic', 'joyful', 'elated', 'cheerful'],
    'sad': ['melancholy', 'sorrowful', 'dejected', 'despondent', 'mournful'],
    'fast': ['swift', 'rapid', 'speedy', 'quick', 'hasty'],
    'slow': ['sluggish', 'leisurely', 'gradual', 'unhurried', 'deliberate'],
    'beautiful': ['gorgeous', 'stunning', 'magnificent', 'breathtaking', 'exquisite']
  };
  return synonymMap[word.toLowerCase()] || ['sophisticated', 'enhanced', 'improved', 'refined', 'elevated'];
}

// Rephrase sentences for better vocabulary
export async function rephraseSentence(sentence: string): Promise<string> {
  const systemPrompt = `You are a vocabulary enhancement assistant. Rephrase the given sentence to make it more sophisticated and engaging while maintaining the original meaning.`;
  const userPrompt = `Please rephrase this sentence: "${sentence}"`;

  try {
    const response = await makeOpenAICall(systemPrompt, userPrompt, 100);
    return response;
  } catch (error) {
    console.error('Error rephrasing sentence:', error);
    return `Try using more specific verbs and descriptive adjectives in: "${sentence}"`;
  }
}

// Generate writing prompts for different text types
export async function generatePrompt(textType: string, topic?: string): Promise<string> {
  const systemPrompt = `You are a creative writing prompt generator for NSW Selective School exam preparation. Generate engaging, age-appropriate prompts for ${textType} writing.`;
  const userPrompt = topic 
    ? `Generate a creative ${textType} writing prompt related to: ${topic}`
    : `Generate a creative ${textType} writing prompt`;

  try {
    const response = await makeOpenAICall(systemPrompt, userPrompt, 150);
    return response;
  } catch (error) {
    console.error('Error generating prompt:', error);
    return getFallbackPrompt(textType, topic);
  }
}

// Fallback prompts when AI is unavailable
function getFallbackPrompt(textType: string, topic?: string): string {
  const fallbackPrompts = {
    narrative: [
      "Write a story about a character who discovers a mysterious door in their school that leads to an unexpected place.",
      "Tell the story of a day when everything that could go wrong, did go wrong, but it led to something wonderful.",
      "Write about a character who finds an old diary and discovers it belongs to someone from 100 years ago."
    ],
    persuasive: [
      "Should students be allowed to choose their own school subjects? Write a persuasive piece arguing your position.",
      "Convince your school principal to introduce a new subject that you think would benefit all students.",
      "Should mobile phones be allowed in schools? Present your argument with strong evidence."
    ],
    expository: [
      "Explain how social media has changed the way young people communicate and form friendships.",
      "Describe the process of how a book becomes a bestseller, from writing to publication.",
      "Explain why some people are naturally good at sports while others excel in academics."
    ],
    descriptive: [
      "Describe your perfect day from morning to night, using all five senses to bring it to life.",
      "Paint a picture with words of the most beautiful place you've ever seen or imagined.",
      "Describe the feeling of achieving something you've worked really hard for."
    ],
    creative: [
      "Write a piece that begins with: 'The last person on Earth sat alone in a room. There was a knock on the door...'",
      "Create a story told entirely through text messages between two characters.",
      "Write about a world where colors have personalities and can talk to humans."
    ]
  };

  const typePrompts = fallbackPrompts[textType.toLowerCase()] || fallbackPrompts.narrative;
  const randomPrompt = typePrompts[Math.floor(Math.random() * typePrompts.length)];
  return topic ? `${randomPrompt} (Focus on: ${topic})` : randomPrompt;
}

// Evaluate essay content and provide feedback
export async function evaluateEssay(content: string, textType: string): Promise<string> {
  if (!content.trim()) {
    return "Please write some content first, then I can provide you with detailed feedback!";
  }

  const systemPrompt = `You are an expert writing teacher specializing in NSW Selective School exam preparation. Evaluate this ${textType} writing sample and provide constructive feedback.`;
  const userPrompt = `Please evaluate this ${textType} writing sample:\n\n${content}\n\nProvide detailed feedback with specific suggestions for improvement.`;

  try {
    const response = await makeOpenAICall(systemPrompt, userPrompt, 300);
    return response;
  } catch (error) {
    console.error('Error evaluating essay:', error);
    return getFallbackEvaluation(content, textType);
  }
}

// Fallback evaluation when AI is unavailable
function getFallbackEvaluation(content: string, textType: string): string {
  const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
  
  let feedback = `Great work on your ${textType} writing! Here's some feedback:\n\n`;
  
  if (wordCount < 50) {
    feedback += "• Try to develop your ideas more fully with additional details and examples.\n";
  } else if (wordCount > 300) {
    feedback += "• Excellent length! You've developed your ideas well.\n";
  } else {
    feedback += "• Good length for your piece. Consider adding more descriptive details.\n";
  }
  
  feedback += "• Focus on using varied sentence structures to make your writing more engaging.\n";
  feedback += "• Remember to show rather than tell - use actions and dialogue to convey emotions.\n";
  feedback += "• Check your spelling and punctuation before submitting.\n\n";
  feedback += "Keep up the great work! Writing improves with practice. 🌟";
  
  return feedback;
}

// Get NSW Selective specific feedback
export async function getNSWSelectiveFeedback(content: string, textType: string): Promise<string> {
  const systemPrompt = `You are an NSW Selective School writing examiner. Evaluate this ${textType} writing against NSW Selective criteria.`;
  const userPrompt = `Evaluate this ${textType} writing sample against NSW Selective criteria:\n\n${content}`;

  try {
    const response = await makeOpenAICall(systemPrompt, userPrompt, 250);
    return response;
  } catch (error) {
    console.error('Error getting NSW feedback:', error);
    return `NSW Selective Feedback for your ${textType} writing:\n\n• Focus on developing clear, engaging ideas\n• Ensure strong structure with clear beginning, middle, and end\n• Use sophisticated vocabulary and varied sentence structures\n• Check grammar, spelling, and punctuation carefully\n\nKeep practicing! 🎯`;
  }
}

// Get writing structure guidance
export async function getWritingStructure(textType: string): Promise<string> {
  const systemPrompt = `You are a writing teacher specializing in ${textType} writing structure. Provide clear, practical guidance.`;
  const userPrompt = `Explain the ideal structure for ${textType} writing.`;

  try {
    const response = await makeOpenAICall(systemPrompt, userPrompt, 200);
    return response;
  } catch (error) {
    console.error('Error getting structure guidance:', error);
    return getFallbackStructure(textType);
  }
}

// Fallback structure guidance
function getFallbackStructure(textType: string): string {
  const structures = {
    narrative: `Narrative Structure:\n• Opening: Hook the reader\n• Rising Action: Build tension\n• Climax: Turning point\n• Falling Action: Resolve conflict\n• Resolution: Satisfying conclusion`,
    persuasive: `Persuasive Structure:\n• Introduction: State your position\n• Body: Arguments with evidence\n• Counter-argument: Address opposing views\n• Conclusion: Reinforce position`,
    expository: `Expository Structure:\n• Introduction: Introduce topic\n• Body: Main points with examples\n• Conclusion: Summarize key points`,
    descriptive: `Descriptive Structure:\n• Introduction: Set the scene\n• Body: Sensory details\n• Conclusion: Lasting impression`,
    creative: `Creative Structure:\n• Hook: Intriguing start\n• Development: Build concept\n• Climax: Key moment\n• Resolution: Satisfying end`
  };
  return structures[textType.toLowerCase()] || structures.narrative;
}

// Get general writing feedback
export async function getWritingFeedback(content: string, textType: string): Promise<string> {
  if (!content.trim()) {
    return "Start writing and I'll provide helpful feedback as you go! 📝";
  }

  const systemPrompt = `You are a supportive writing coach for NSW Selective exam preparation. Provide encouraging, specific feedback.`;
  const userPrompt = `Please provide constructive feedback on this ${textType} writing:\n\n${content}`;

  try {
    const response = await makeOpenAICall(systemPrompt, userPrompt, 200);
    return response;
  } catch (error) {
    console.error('Error getting writing feedback:', error);
    return `Great start on your ${textType} writing! Keep developing your ideas with specific details. You're on the right track! 🌟`;
  }
}

// Get vocabulary suggestions for specific text types
export async function getTextTypeVocabulary(textType: string): Promise<string[]> {
  const systemPrompt = `You are a vocabulary assistant. Provide 10 sophisticated vocabulary words for ${textType} writing.`;
  const userPrompt = `Provide 10 advanced vocabulary words for ${textType} writing.`;
  
  try {
    const response = await makeOpenAICall(systemPrompt, userPrompt, 200);
    const words = response.split(/[,\n]/)
      .map(word => word.trim().replace(/^\d+\.?\s*/, ''))
      .filter(word => word.length > 0)
      .slice(0, 10);
    
    return words.length > 0 ? words : getFallbackVocabulary(textType);
  } catch (error) {
    console.error('Error getting text type vocabulary:', error);
    return getFallbackVocabulary(textType);
  }
}

// Fallback vocabulary for different text types
function getFallbackVocabulary(textType: string): string[] {
  const vocabularyMap = {
    narrative: ['captivating', 'mesmerizing', 'extraordinary', 'bewildering', 'exhilarating', 'profound', 'mysterious', 'enchanting', 'compelling', 'remarkable'],
    persuasive: ['compelling', 'convincing', 'substantial', 'irrefutable', 'paramount', 'crucial', 'imperative', 'undeniable', 'significant', 'essential'],
    expository: ['comprehensive', 'systematic', 'analytical', 'methodical', 'thorough', 'precise', 'detailed', 'extensive', 'fundamental', 'intricate'],
    descriptive: ['vivid', 'picturesque', 'breathtaking', 'magnificent', 'splendid', 'radiant', 'serene', 'majestic', 'pristine', 'luminous'],
    creative: ['innovative', 'imaginative', 'ingenious', 'inventive', 'original', 'visionary', 'artistic', 'inspired', 'unique', 'brilliant']
  };
  return vocabularyMap[textType.toLowerCase()] || vocabularyMap.narrative;
}

// Identify common mistakes in writing
export async function identifyCommonMistakes(content: string, textType: string): Promise<any[]> {
  if (!content.trim()) {
    return [];
  }

  const systemPrompt = `You are a writing teacher. Analyze this ${textType} writing and identify specific errors.`;
  const userPrompt = `Analyze this writing and identify mistakes:\n\n${content}\n\nReturn JSON format: [{"type": "error_type", "issue": "description", "suggestion": "fix", "location": "snippet"}]`;
  
  try {
    const response = await makeOpenAICall(systemPrompt, userPrompt, 300);
    const mistakes = JSON.parse(response);
    return Array.isArray(mistakes) ? mistakes : [];
  } catch (error) {
    console.error('Error identifying mistakes:', error);
    return getFallbackMistakes(content);
  }
}

// Fallback mistake identification
function getFallbackMistakes(content: string): any[] {
  const mistakes = [];
  
  if (content.length < 50) {
    mistakes.push({
      type: 'structure',
      issue: 'Content is too short',
      suggestion: 'Develop your ideas with more details',
      location: 'Overall content'
    });
  }
  
  if (!content.trim().match(/[.!?]$/)) {
    mistakes.push({
      type: 'punctuation',
      issue: 'Missing ending punctuation',
      suggestion: 'End with appropriate punctuation',
      location: 'End of text'
    });
  }
  
  return mistakes.slice(0, 3);
}

// Add this helper function for fallback responses
export function getFallbackChatResponse(userMessage: string, textType: string): string {
  const lowerMessage = userMessage.toLowerCase();
  
  if (lowerMessage.includes('introduction') || lowerMessage.includes('start')) {
    return `Great question about introductions! For ${textType} writing, try starting with dialogue, action, or an intriguing question. Hook your reader from the first sentence! 🎣`;
  } else if (lowerMessage.includes('conclusion') || lowerMessage.includes('end')) {
    return `For a strong conclusion, circle back to your opening theme and show how your character has grown or changed. Leave readers satisfied but thoughtful! ✨`;
  } else if (lowerMessage.includes('synonym') || lowerMessage.includes('word')) {
    return `Try these powerful alternatives: Instead of 'said' → whispered, exclaimed, declared. Instead of 'big' → enormous, massive, gigantic. Specific words make writing shine! 📚`;
  } else if (lowerMessage.includes('character')) {
    return `Show character emotions through actions and thoughts! Instead of 'he was sad', try 'his shoulders slumped as he stared at the ground.' Show, don't tell! 😊`;
  } else {
    return `That's a thoughtful question! Keep writing and let your creativity flow. Remember: every sentence should either advance the plot or develop character. You're doing great! 🌟`;
  }
}

// OpenAI client export for compatibility
export const openai = {
  chat: {
    completions: {
      create: async (params: any) => {
        const { messages, model, max_tokens } = params;
        const systemMessage = messages.find((m: any) => m.role === 'system');
        const userMessage = messages.find((m: any) => m.role === 'user');
        
        const response = await makeOpenAICall(
          systemMessage?.content || 'You are a helpful assistant.',
          userMessage?.content || '',
          max_tokens || 200
        );
        
        return {
          choices: [{
            message: {
              content: response
            }
          }]
        };
      }
    }
  }
};
