// Enhanced OpenAI service with better error handling and connection management

interface ChatRequest {
  userMessage: string;
  textType: string;
  currentContent: string;
  wordCount: number;
  context?: string;
}

// Main function to make OpenAI API calls
export async function makeOpenAICall(systemPrompt: string, userPrompt: string, maxTokens: number = 200): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  const apiBase = import.meta.env.VITE_OPENAI_API_BASE || 'https://api.openai.com/v1';
  
  console.log('API Key exists:', !!apiKey);
  console.log('API Base:', apiBase);
  
  if (!apiKey) {
    throw new Error('OpenAI API key not configured. Please check your environment variables.');
  }

  try {
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

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('API Response data:', data);
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from OpenAI');
    }

    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('OpenAI API call failed:', error);
    throw error;
  }
}

// Check OpenAI connection status with better error handling
export async function checkOpenAIConnectionStatus(): Promise<boolean> {
  try {
    console.log('Testing OpenAI connection...');
    
    const response = await makeOpenAICall(
      "You are a helpful assistant.",
      "Respond with just the word 'connected' if you can read this.",
      50
    );
    
    console.log('Connection test response:', response);
    const isConnected = response.toLowerCase().includes('connected') || response.length > 0;
    console.log('Connection status:', isConnected);
    
    return isConnected;
  } catch (error) {
    console.error('OpenAI connection test failed:', error);
    return false;
  }
}

// Enhanced chat response function for Writing Buddy
export async function generateChatResponse(request: ChatRequest): Promise<string> {
  const { userMessage, textType, currentContent, wordCount, context } = request;
  
  console.log('Generating chat response for:', userMessage);
  
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
    console.log('Generated response:', response);
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

// Generate writing prompts for different text types
export async function generatePrompt(textType: string, topic?: string): Promise<string> {
  const systemPrompt = `You are a creative writing prompt generator for NSW Selective School exam preparation. Generate engaging, age-appropriate prompts for ${textType} writing that will inspire students and align with NSW curriculum standards.`;
  
  const userPrompt = topic 
    ? `Generate a creative ${textType} writing prompt related to: ${topic}`
    : `Generate a creative ${textType} writing prompt that will engage and challenge students`;

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
      "Write about a character who finds an old diary and discovers it belongs to someone from 100 years ago.",
      "Create a story about a character who can hear what animals are thinking for one day."
    ],
    persuasive: [
      "Should students be allowed to choose their own school subjects? Write a persuasive piece arguing your position.",
      "Convince your school principal to introduce a new subject that you think would benefit all students.",
      "Should mobile phones be allowed in schools? Present your argument with strong evidence.",
      "Write a persuasive piece about why protecting the environment should be everyone's responsibility."
    ],
    expository: [
      "Explain how social media has changed the way young people communicate and form friendships.",
      "Describe the process of how a book becomes a bestseller, from writing to publication.",
      "Explain why some people are naturally good at sports while others excel in academics.",
      "Describe how climate change is affecting Australia and what can be done about it."
    ],
    descriptive: [
      "Describe your perfect day from morning to night, using all five senses to bring it to life.",
      "Paint a picture with words of the most beautiful place you've ever seen or imagined.",
      "Describe the feeling of achieving something you've worked really hard for.",
      "Create a detailed description of a bustling marketplace in a foreign country."
    ],
    creative: [
      "Write a piece that begins with: 'The last person on Earth sat alone in a room. There was a knock on the door...'",
      "Create a story told entirely through text messages between two characters.",
      "Write about a world where colors have personalities and can talk to humans.",
      "Imagine you could spend a day with any historical figure. Write about your experience."
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

  const systemPrompt = `You are an expert writing teacher specializing in NSW Selective School exam preparation. Evaluate this ${textType} writing sample and provide constructive feedback focusing on:

1. Content and Ideas
2. Structure and Organization  
3. Language Use and Vocabulary
4. Grammar and Mechanics
5. NSW Selective Criteria Alignment

Provide specific, actionable feedback that will help the student improve. Be encouraging but honest about areas for improvement.`;

  const userPrompt = `Please evaluate this ${textType} writing sample:

${content}

Provide detailed feedback with specific suggestions for improvement.`;

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
  
  let feedback = `Great work on your ${textType} writing! Here's some feedback:

`;
  
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
