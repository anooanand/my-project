// Enhanced OpenAI service for Phase 1: AI Chat Functionality
// Add these functions to your existing lib/openai.ts file

interface ChatRequest {
  userMessage: string;
  textType: string;
  currentContent: string;
  wordCount: number;
  context?: string;
}

interface ChatResponse {
  response: string;
  confidence: number;
  responseType: 'advice' | 'encouragement' | 'question' | 'suggestion';
}

// Enhanced chat response function for Writing Buddy
export async function generateChatResponse(request: ChatRequest): Promise<string> {
  const { userMessage, textType, currentContent, wordCount, context } = request;
  
  // Analyze the user's question to provide contextual responses
  const questionType = analyzeQuestion(userMessage);
  
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

Respond to the student's question in a helpful, encouraging way. If they're stuck, offer specific suggestions. If they're doing well, acknowledge their progress and offer ways to improve further.`;

  const userPrompt = `Student question: "${userMessage}"

Please provide a helpful, encouraging response that addresses their specific question while considering their current writing progress.`;

  try {
    const response = await makeOpenAICall(systemPrompt, userPrompt, 150);
    return response;
  } catch (error) {
    console.error('Chat response error:', error);
    return getFallbackResponse(questionType, textType);
  }
}

// Analyze the type of question to provide better responses
function analyzeQuestion(question: string): string {
  const lowerQuestion = question.toLowerCase();
  
  if (lowerQuestion.includes('introduction') || lowerQuestion.includes('start') || lowerQuestion.includes('beginning')) {
    return 'introduction';
  } else if (lowerQuestion.includes('conclusion') || lowerQuestion.includes('end') || lowerQuestion.includes('finish')) {
    return 'conclusion';
  } else if (lowerQuestion.includes('synonym') || lowerQuestion.includes('word') || lowerQuestion.includes('vocabulary')) {
    return 'vocabulary';
  } else if (lowerQuestion.includes('character') || lowerQuestion.includes('emotion') || lowerQuestion.includes('feeling')) {
    return 'character';
  } else if (lowerQuestion.includes('describe') || lowerQuestion.includes('descriptive') || lowerQuestion.includes('detail')) {
    return 'description';
  } else if (lowerQuestion.includes('next') || lowerQuestion.includes('happen') || lowerQuestion.includes('plot')) {
    return 'plot';
  } else if (lowerQuestion.includes('grammar') || lowerQuestion.includes('sentence') || lowerQuestion.includes('punctuation')) {
    return 'grammar';
  } else {
    return 'general';
  }
}

// Provide fallback responses when AI is unavailable
function getFallbackResponse(questionType: string, textType: string): string {
  const fallbackResponses = {
    introduction: `Great question! For a strong ${textType} introduction, try starting with an interesting scene or dialogue that hooks your reader. You could begin right in the middle of action! 🎬`,
    conclusion: `For your conclusion, think about how your character has changed or what they've learned. Tie back to your opening and give readers a satisfying ending! ✨`,
    vocabulary: `Try using more specific words! Instead of 'said', you could use 'whispered', 'exclaimed', or 'muttered'. Instead of 'big', try 'enormous', 'massive', or 'gigantic'! 📚`,
    character: `Show your character's emotions through their actions and thoughts! Instead of saying 'he was sad', show him 'staring at the ground with tears in his eyes'. 😊`,
    description: `Use your five senses! What does your character see, hear, smell, feel, or taste? Paint a picture with your words to help readers feel like they're there! 🎨`,
    plot: `Think about what challenge or problem your character needs to solve. What obstacles might they face? How will they overcome them? Keep your reader guessing! 🤔`,
    grammar: `Read your sentences out loud - if they sound awkward, try breaking them into shorter sentences or combining them differently. Don't forget your punctuation! ✏️`,
    general: `That's a great question! Keep writing and let your creativity flow. Remember, every great writer started with practice. You're doing amazing! 🌟`
  };

  return fallbackResponses[questionType] || fallbackResponses.general;
}

// Enhanced connection status check with better error handling
export async function checkOpenAIConnectionStatus(): Promise<boolean> {
  try {
    const testResponse = await makeOpenAICall(
      "You are a helpful assistant.",
      "Respond with just the word 'connected' if you can read this.",
      50
    );
    
    return testResponse.toLowerCase().includes('connected') || testResponse.length > 0;
  } catch (error) {
    console.error('OpenAI connection test failed:', error);
    return false;
  }
}

// Quick response for common writing questions
export async function getQuickWritingTip(textType: string, topic: string): Promise<string> {
  const systemPrompt = `You are a helpful writing coach for NSW Selective exam preparation. Provide a quick, encouraging tip about ${topic} for ${textType} writing. Keep it to 1-2 sentences and include an emoji.`;
  
  const userPrompt = `Give me a quick tip about ${topic} for ${textType} writing.`;
  
  try {
    const response = await makeOpenAICall(systemPrompt, userPrompt, 100);
    return response;
  } catch (error) {
    return getFallbackResponse(topic, textType);
  }
}

// Get contextual writing suggestions based on current content
export async function getContextualSuggestions(content: string, textType: string): Promise<string[]> {
  if (!content.trim()) {
    return [
      "Start with an engaging opening line that hooks your reader",
      "Introduce your main character in an interesting way",
      "Set the scene with descriptive details"
    ];
  }

  const systemPrompt = `Analyze this ${textType} writing and provide 3 specific, actionable suggestions for improvement. Focus on NSW Selective writing criteria.`;
  
  const userPrompt = `Content: ${content.slice(0, 500)}${content.length > 500 ? '...' : ''}`;
  
  try {
    const response = await makeOpenAICall(systemPrompt, userPrompt, 200);
    // Parse response into array (assuming AI returns numbered list)
    const suggestions = response.split('\n')
      .filter(line => line.trim())
      .map(line => line.replace(/^\d+\.?\s*/, '').trim())
      .filter(line => line.length > 0)
      .slice(0, 3);
    
    return suggestions.length > 0 ? suggestions : [
      "Keep developing your story with more descriptive details",
      "Consider adding dialogue to bring your characters to life",
      "Think about what conflict or challenge your character will face"
    ];
  } catch (error) {
    return [
      "Continue building your story with engaging details",
      "Add more sensory descriptions to help readers visualize the scene",
      "Develop your character's emotions and motivations"
    ];
  }
}

// Add this to your existing makeOpenAICall function or use it as is
async function makeOpenAICall(systemPrompt: string, userPrompt: string, maxTokens: number = 200): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  const apiBase = import.meta.env.VITE_OPENAI_API_BASE || 'https://api.openai.com/v1';
  
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch(`${apiBase}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('Invalid response format from OpenAI');
  }

  return data.choices[0].message.content.trim();
}
