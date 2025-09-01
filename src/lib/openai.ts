// MISSING OPENAI FUNCTIONS - Add these to your src/lib/openai.ts file

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
  const systemPrompt = `You are an NSW Selective School writing examiner. Evaluate this ${textType} writing against NSW Selective criteria:\n\nCRITERIA:\n- Ideas and Content (25%)\n- Structure and Organization (25%) \n- Language Use and Style (25%)\n- Grammar and Mechanics (25%)\n\nProvide specific feedback aligned with NSW Selective standards and expectations.`;

  const userPrompt = `Evaluate this ${textType} writing sample against NSW Selective criteria:\n\n${content}\n\nProvide detailed feedback with a focus on meeting NSW Selective standards.`;

  try {
    const response = await makeOpenAICall(systemPrompt, userPrompt, 250);
    return response;
  } catch (error) {
    console.error('Error getting NSW feedback:', error);
    return `NSW Selective Feedback for your ${textType} writing:\n\n• Focus on developing clear, engaging ideas that capture the reader's attention\n• Ensure your writing has a strong structure with clear beginning, middle, and end\n• Use sophisticated vocabulary and varied sentence structures\n• Check grammar, spelling, and punctuation carefully\n\nYour writing shows promise! Keep practicing to meet NSW Selective standards. 🎯`;
  }
}

// Get writing structure guidance
export async function getWritingStructure(textType: string): Promise<string> {
  const systemPrompt = `You are a writing teacher specializing in ${textType} writing structure. Provide clear, practical guidance on how to structure a ${textType} piece for NSW Selective exam success.`;

  const userPrompt = `Explain the ideal structure for ${textType} writing, including what should be in each section and how to organize ideas effectively.`;

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
    narrative: `Narrative Structure:\n• Opening: Hook the reader with an engaging start\n• Rising Action: Build tension and develop characters\n• Climax: The turning point or main conflict\n• Falling Action: Resolve the conflict\n• Resolution: Satisfying conclusion that ties everything together`,
    
    persuasive: `Persuasive Structure:\n• Introduction: State your position clearly\n• Body Paragraph 1: Strongest argument with evidence\n• Body Paragraph 2: Additional supporting argument\n• Counter-argument: Address opposing views\n• Conclusion: Reinforce your position and call to action`,
    
    expository: `Expository Structure:\n• Introduction: Introduce the topic and main idea\n• Body Paragraph 1: First main point with examples\n• Body Paragraph 2: Second main point with examples\n• Body Paragraph 3: Third main point with examples\n• Conclusion: Summarize key points and significance`,
    
    descriptive: `Descriptive Structure:\n• Introduction: Set the scene or introduce what you're describing\n• Body: Use spatial, chronological, or importance order\n• Sensory Details: Include sight, sound, smell, touch, taste\n• Conclusion: Leave the reader with a lasting impression`,
    
    creative: `Creative Structure:\n• Hook: Start with something intriguing\n• Development: Build your creative concept\n• Climax/Turning Point: Key moment or revelation\n• Resolution: Bring your creative piece to a satisfying end`
  };

  return structures[textType.toLowerCase()] || structures.narrative;
}

// Get general writing feedback
export async function getWritingFeedback(content: string, textType: string): Promise<string> {
  if (!content.trim()) {
    return "Start writing and I'll provide helpful feedback as you go! 📝";
  }

  const systemPrompt = `You are a supportive writing coach for NSW Selective exam preparation. Provide encouraging, specific feedback on this ${textType} writing that helps the student improve.`;

  const userPrompt = `Please provide constructive feedback on this ${textType} writing:\n\n${content}\n\nFocus on what's working well and specific suggestions for improvement.`;

  try {
    const response = await makeOpenAICall(systemPrompt, userPrompt, 200);
    return response;
  } catch (error) {
    console.error('Error getting writing feedback:', error);
    return `Great start on your ${textType} writing! Here are some tips:\n• Keep developing your ideas with more specific details\n• Use varied sentence lengths to create rhythm\n• Show emotions through actions and dialogue\n• Check your spelling and grammar\n\nYou're on the right track! Keep writing! 🌟`;
  }
}

// Check OpenAI connection status
export async function checkOpenAIConnectionStatus(): Promise<boolean> {
  try {
    const response = await makeOpenAICall(
      "You are a helpful assistant.",
      "Respond with just the word 'connected' if you can read this.",
      50
    );
    
    return response.toLowerCase().includes('connected') || response.length > 0;
  } catch (error) {
    console.error('OpenAI connection test failed:', error);
    return false;
  }
}

// Rephrase sentences for better vocabulary
export async function rephraseSentence(sentence: string): Promise<string> {
  const systemPrompt = `You are a vocabulary enhancement assistant. Rephrase the given sentence to make it more sophisticated and engaging while maintaining the original meaning. Focus on improving word choice and sentence structure.`;

  const userPrompt = `Please rephrase this sentence to make it more sophisticated: "${sentence}"`;

  try {
    const response = await makeOpenAICall(systemPrompt, userPrompt, 100);
    return response;
  } catch (error) {
    console.error('Error rephrasing sentence:', error);
    return `Try using more specific verbs and descriptive adjectives in: "${sentence}"`;
  }
}

// Get synonyms for words
export async function getSynonyms(word: string): Promise<string[]> {
  const systemPrompt = `You are a vocabulary assistant. Provide 5 sophisticated synonyms for the given word that would be appropriate for NSW Selective level writing.`;

  const userPrompt = `Provide synonyms for: ${word}`;

  try {
    const response = await makeOpenAICall(systemPrompt, userPrompt, 100);
    // Parse the response to extract synonyms
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

// Make sure you have the makeOpenAICall function - add this if it doesn't exist
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
  
  const systemPrompt = `You are an AI Writing Buddy for NSW Selective School exam preparation. You're helping a student with their ${textType} writing.\n\nCONTEXT:\n- Student is writing a ${textType} story\n- Current word count: ${wordCount}\n- ${context || ''}\n\nPERSONALITY:\n- Friendly, encouraging, and supportive\n- Use emojis occasionally to be engaging\n- Speak like a helpful friend, not a formal teacher\n- Keep responses concise but helpful (2-3 sentences max)\n\nFOCUS AREAS:\n- NSW Selective writing criteria\n- Story structure and plot development\n- Character development and emotions\n- Descriptive language and vocabulary\n- Grammar and sentence structure\n- Creative ideas and inspiration\n\nCURRENT CONTENT PREVIEW:\n${currentContent.slice(0, 200)}${currentContent.length > 200 ? '...' : ''}\n\nRespond to the student's question in a helpful, encouraging way. If they're stuck, offer specific suggestions. If they're doing well, acknowledge their progress and offer ways to improve further.`;

  const userPrompt = `Student question: "${userMessage}"\n\nPlease provide a helpful, encouraging response that addresses their specific question while considering their current writing progress.`;

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
      "Keep developing your story with engaging details",
      "Add more sensory descriptions to help readers visualize the scene",
      "Develop your character's emotions and motivations"
    ];
  } catch (error) {
    return [
      "Continue building your story with engaging details",
      "Add more sensory descriptions to help readers visualize the scene",
      "Develop your character's emotions and motivations"
    ];
  }
}
