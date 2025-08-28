// Save this as: src/lib/openai.ts (replace existing file)

interface OpenAIConfig {
  apiKey: string;
  apiBase: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

interface FeedbackRequest {
  paragraphContent: string;
  paragraphNumber: number;
  textType: string;
  previousParagraphs?: string[];
  studentLevel?: 'beginner' | 'intermediate' | 'advanced';
}

interface ChatRequest {
  userMessage: string;
  textType: string;
  currentContent: string;
  wordCount: number;
  context?: string;
}

class OpenAIService {
  private config: OpenAIConfig;

  constructor() {
    this.config = {
      apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
      apiBase: import.meta.env.VITE_OPENAI_API_BASE || 'https://api.openai.com/v1',
      model: 'gpt-4o-mini',
      maxTokens: 200,
      temperature: 0.7
    };

    if (!this.config.apiKey) {
      console.warn('OpenAI API key not found. Please set VITE_OPENAI_API_KEY environment variable.');
    }
  }

  private async callOpenAI(messages: any[], options?: Partial<OpenAIConfig>): Promise<string> {
    try {
      const response = await fetch(`${this.config.apiBase}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          model: options?.model || this.config.model,
          messages: messages,
          max_tokens: options?.maxTokens || this.config.maxTokens,
          temperature: options?.temperature || this.config.temperature,
          stream: false
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response format from OpenAI API');
      }

      return data.choices[0].message.content.trim();
    } catch (error) {
      console.error('OpenAI API call failed:', error);
      throw error;
    }
  }

  async generateParagraphFeedback(request: FeedbackRequest): Promise<string> {
    const { paragraphContent, paragraphNumber, textType, previousParagraphs, studentLevel = 'intermediate' } = request;

    const systemMessage = this.createFeedbackSystemMessage(textType, studentLevel);
    const userPrompt = this.createFeedbackPrompt(paragraphContent, paragraphNumber, previousParagraphs);

    const messages = [
      { role: 'system', content: systemMessage },
      { role: 'user', content: userPrompt }
    ];

    try {
      return await this.callOpenAI(messages, { maxTokens: 150 });
    } catch (error) {
      console.error('Failed to generate paragraph feedback:', error);
      return this.getFallbackFeedback(paragraphNumber);
    }
  }

  async generateChatResponse(request: ChatRequest): Promise<string> {
    const { userMessage, textType, currentContent, wordCount, context } = request;

    const systemMessage = this.createChatSystemMessage(textType, wordCount);
    const userPrompt = this.createChatPrompt(userMessage, currentContent, context);

    const messages = [
      { role: 'system', content: systemMessage },
      { role: 'user', content: userPrompt }
    ];

    try {
      return await this.callOpenAI(messages, { maxTokens: 200 });
    } catch (error) {
      console.error('Failed to generate chat response:', error);
      return "I'm having trouble responding right now. Please try again in a moment, or feel free to continue writing!";
    }
  }

  private createFeedbackSystemMessage(textType: string, studentLevel: string): string {
    const levelGuidance = {
      beginner: 'Use simple language and focus on basic writing elements like complete sentences and clear ideas.',
      intermediate: 'Provide balanced feedback on structure, vocabulary, and creative elements.',
      advanced: 'Offer sophisticated feedback on literary techniques, style, and advanced writing craft.'
    };

    return `You are an encouraging AI writing coach for students preparing for NSW Selective School exams. You specialize in ${textType.toLowerCase()} writing and provide supportive, constructive feedback.

Student Level: ${studentLevel}
Writing Type: ${textType}

Your feedback should:
- Be encouraging and positive while being constructive
- Focus on specific strengths in the paragraph
- Provide 1-2 actionable suggestions for improvement
- Be concise (2-3 sentences maximum)
- Use age-appropriate language for students aged 10-12
- ${levelGuidance[studentLevel as keyof typeof levelGuidance]}

For ${textType.toLowerCase()} writing, focus on:
- Character development and emotions
- Setting and atmosphere
- Plot progression and conflict
- Dialogue and voice
- Descriptive language and sensory details
- Story structure and pacing

Always start with something positive the student did well, then provide specific, actionable advice.`;
  }

  private createChatSystemMessage(textType: string, wordCount: number): string {
    return `You are a helpful AI writing coach for students preparing for NSW Selective School exams. You're currently helping with ${textType.toLowerCase()} writing.

Current Context:
- Writing Type: ${textType}
- Student has written ${wordCount} words so far
- Target audience: Students aged 10-12
- Purpose: NSW Selective School exam preparation

Your responses should:
- Be encouraging and supportive
- Provide specific, actionable writing advice
- Use age-appropriate language
- Focus on writing techniques, structure, vocabulary, and creativity
- Reference their current writing when relevant
- Keep responses concise but helpful (2-4 sentences)
- Encourage continued writing and creativity

You can help with:
- Writing techniques and structure
- Vocabulary and word choice
- Character and plot development
- Grammar and sentence structure
- Creative inspiration and ideas
- Exam-specific writing strategies`;
  }

  private createFeedbackPrompt(paragraphContent: string, paragraphNumber: number, previousParagraphs?: string[]): string {
    let prompt = `Please provide encouraging feedback for paragraph ${paragraphNumber} of this narrative story:\n\n"${paragraphContent}"\n\n`;

    if (previousParagraphs && previousParagraphs.length > 0) {
      prompt += `Previous paragraphs for context:\n${previousParagraphs.map((p, i) => `Paragraph ${i + 1}: "${p}"`).join('\n')}\n\n`;
    }

    prompt += `Focus on what the student did well and provide specific suggestions for improvement. Consider the paragraph's role in the overall story development.`;

    return prompt;
  }

  private createChatPrompt(userMessage: string, currentContent: string, context?: string): string {
    let prompt = `Student's question: "${userMessage}"\n\n`;

    if (currentContent && currentContent.trim().length > 0) {
      const contentPreview = currentContent.length > 300 
        ? currentContent.substring(0, 300) + '...' 
        : currentContent;
      prompt += `Here's what they've written so far:\n"${contentPreview}"\n\n`;
    }

    if (context) {
      prompt += `Additional context: ${context}\n\n`;
    }

    prompt += `Please provide helpful, encouraging advice that directly addresses their question.`;

    return prompt;
  }

  private getFallbackFeedback(paragraphNumber: number): string {
    const fallbacks = [
      `Great work on paragraph ${paragraphNumber}! You're building your story well. Keep focusing on showing your character's emotions through their actions and thoughts.`,
      `Nice progress in paragraph ${paragraphNumber}! I can see your story developing. Try adding more sensory details to help readers feel like they're right there with your character.`,
      `Excellent effort on paragraph ${paragraphNumber}! Your writing is improving. Consider varying your sentence lengths to create better rhythm and flow.`,
      `Well done with paragraph ${paragraphNumber}! You're creating an engaging story. Think about adding some dialogue to bring your characters to life.`,
      `Good job on paragraph ${paragraphNumber}! Your narrative is taking shape. Try to show more about your character's personality through their actions and decisions.`
    ];

    return fallbacks[paragraphNumber % fallbacks.length];
  }

  isConfigured(): boolean {
    return !!this.config.apiKey;
  }

  async testConnection(): Promise<boolean> {
    try {
      const testMessages = [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Say "Hello" if you can hear me.' }
      ];
      
      const response = await this.callOpenAI(testMessages, { maxTokens: 10 });
      return response.toLowerCase().includes('hello');
    } catch (error) {
      console.error('OpenAI connection test failed:', error);
      return false;
    }
  }
}

export const openAIService = new OpenAIService();
export type { FeedbackRequest, ChatRequest, OpenAIConfig };

// Backward compatibility functions for existing components
export const openai = openAIService;

// Helper function to make API calls using the service
async function makeOpenAICall(systemPrompt: string, userPrompt: string, maxTokens: number = 200): Promise<string> {
  try {
    // Use the chat request method as a workaround
    const request: ChatRequest = {
      userMessage: userPrompt,
      textType: 'General',
      currentContent: '',
      wordCount: 0,
      context: systemPrompt
    };
    
    return await openAIService.generateChatResponse(request);
  } catch (error) {
    console.error('OpenAI call failed:', error);
    throw error;
  }
}

export async function generatePrompt(textType: string, topic?: string): Promise<string> {
  try {
    const systemPrompt = `You are a creative writing prompt generator for NSW Selective School exam preparation. Generate engaging, age-appropriate prompts for ${textType.toLowerCase()} writing.`;
    const userPrompt = `Generate a creative writing prompt for ${textType.toLowerCase()} writing${topic ? ` about ${topic}` : ''}. Make it engaging for students aged 10-12.`;

    return await makeOpenAICall(systemPrompt, userPrompt, 150);
  } catch (error) {
    console.error('Error generating prompt:', error);
    return `Write an engaging ${textType.toLowerCase()} story about a character who discovers something unexpected that changes their life forever.`;
  }
}

export async function evaluateEssay(content: string, textType: string): Promise<string> {
  try {
    const systemPrompt = `You are an expert writing evaluator for NSW Selective School exams. Provide constructive feedback on ${textType.toLowerCase()} writing for students aged 10-12.`;
    const userPrompt = `Please evaluate this ${textType.toLowerCase()} writing and provide constructive feedback:\n\n${content}`;

    return await makeOpenAICall(systemPrompt, userPrompt, 300);
  } catch (error) {
    console.error('Error evaluating essay:', error);
    return 'Great effort on your writing! Keep practicing to improve your skills.';
  }
}

export async function getNSWSelectiveFeedback(content: string, textType: string): Promise<string> {
  try {
    const systemPrompt = `You are a NSW Selective School writing coach. Provide specific, actionable feedback for ${textType.toLowerCase()} writing that helps students improve their exam performance.`;
    const userPrompt = `Provide NSW Selective School exam feedback for this ${textType.toLowerCase()} writing:\n\n${content}`;

    return await makeOpenAICall(systemPrompt, userPrompt, 250);
  } catch (error) {
    console.error('Error getting NSW feedback:', error);
    return 'Your writing shows good potential. Focus on clear structure, vivid descriptions, and engaging characters.';
  }
}

export async function getWritingStructure(textType: string): Promise<string> {
  try {
    const systemPrompt = `You are a writing structure expert for NSW Selective School exams. Provide clear, actionable structure guidance for ${textType.toLowerCase()} writing.`;
    const userPrompt = `Provide a clear writing structure guide for ${textType.toLowerCase()} writing suitable for NSW Selective School exam preparation.`;

    return await makeOpenAICall(systemPrompt, userPrompt, 200);
  } catch (error) {
    console.error('Error getting writing structure:', error);
    return `For ${textType.toLowerCase()} writing, focus on: 1) Strong opening, 2) Clear development, 3) Engaging conclusion.`;
  }
}

export async function getWritingFeedback(content: string, textType: string): Promise<string> {
  try {
    const systemPrompt = `You are a supportive writing coach for students aged 10-12. Provide encouraging, specific feedback for ${textType.toLowerCase()} writing.`;
    const userPrompt = `Please provide encouraging feedback for this ${textType.toLowerCase()} writing:\n\n${content}`;

    return await makeOpenAICall(systemPrompt, userPrompt, 200);
  } catch (error) {
    console.error('Error getting writing feedback:', error);
    return 'Great work on your writing! Keep practicing and your skills will continue to improve.';
  }
}

export async function checkOpenAIConnectionStatus(): Promise<boolean> {
  try {
    return await openAIService.testConnection();
  } catch (error) {
    console.error('Error checking OpenAI connection:', error);
    return false;
  }
}

// Additional utility functions
export function getSynonyms(word: string): string[] {
  // Simple synonym suggestions - in a real app, you might use an API
  const synonymMap: { [key: string]: string[] } = {
    'said': ['whispered', 'shouted', 'exclaimed', 'murmured', 'declared', 'announced'],
    'happy': ['joyful', 'delighted', 'cheerful', 'elated', 'content', 'pleased'],
    'sad': ['sorrowful', 'melancholy', 'dejected', 'downhearted', 'gloomy', 'mournful'],
    'big': ['enormous', 'massive', 'gigantic', 'huge', 'immense', 'colossal'],
    'small': ['tiny', 'miniature', 'petite', 'compact', 'minute', 'diminutive']
  };
  
  return synonymMap[word.toLowerCase()] || [];
}

export async function rephraseSentence(sentence: string): Promise<string> {
  try {
    const systemPrompt = 'You are a writing assistant. Rephrase sentences to be more engaging and varied while maintaining the original meaning.';
    const userPrompt = `Please rephrase this sentence to make it more engaging: "${sentence}"`;

    return await makeOpenAICall(systemPrompt, userPrompt, 100);
  } catch (error) {
    console.error('Error rephrasing sentence:', error);
    return sentence; // Return original if rephrasing fails
  }
}


// Add the missing getTextTypeVocabulary function
export async function getTextTypeVocabulary(textType: string, content: string): Promise<{
  textType: string;
  categories: Array<{
    name: string;
    words: string[];
    examples: string[];
  }>;
  phrasesAndExpressions: string[];
  transitionWords: string[];
}> {
  try {
    const systemPrompt = `You are a vocabulary enhancement expert for NSW Selective School exam preparation. Generate vocabulary suggestions for ${textType.toLowerCase()} writing that will help students aged 10-12 improve their writing quality.

Analyze the provided text and suggest:
1. Vocabulary categories with relevant words and usage examples
2. Useful phrases and expressions for ${textType.toLowerCase()} writing
3. Transition words to improve flow

Return the response in this exact JSON format:
{
  "textType": "${textType}",
  "categories": [
    {
      "name": "Category Name",
      "words": ["word1", "word2", "word3"],
      "examples": ["Example usage 1", "Example usage 2"]
    }
  ],
  "phrasesAndExpressions": ["phrase1", "phrase2", "phrase3"],
  "transitionWords": ["word1", "word2", "word3"]
}`;

    const userPrompt = `Analyze this ${textType.toLowerCase()} writing and provide vocabulary enhancement suggestions:\n\n"${content}"\n\nProvide vocabulary that would enhance this specific piece of writing while being appropriate for NSW Selective School exam standards.`;

    const response = await makeOpenAICall(systemPrompt, userPrompt, 400);
    
    try {
      // Try to parse the JSON response
      const parsedResponse = JSON.parse(response);
      return parsedResponse;
    } catch (parseError) {
      console.warn('Failed to parse AI response as JSON, using fallback vocabulary');
      // Return fallback vocabulary if parsing fails
      return getFallbackVocabularyData(textType);
    }
  } catch (error) {
    console.error('Error getting text type vocabulary:', error);
    // Return fallback vocabulary on error
    return getFallbackVocabularyData(textType);
  }
}

// Helper function to provide fallback vocabulary data
function getFallbackVocabularyData(textType: string): {
  textType: string;
  categories: Array<{
    name: string;
    words: string[];
    examples: string[];
  }>;
  phrasesAndExpressions: string[];
  transitionWords: string[];
} {
  const vocabularyMap: { [key: string]: any } = {
    'narrative': {
      categories: [
        {
          name: 'Character Description',
          words: ['courageous', 'determined', 'mysterious', 'compassionate', 'resilient', 'adventurous'],
          examples: ['The courageous hero faced the challenge head-on.', 'Her mysterious smile hinted at secrets untold.']
        },
        {
          name: 'Setting and Atmosphere',
          words: ['enchanting', 'ominous', 'serene', 'bustling', 'desolate', 'magnificent'],
          examples: ['The enchanting forest whispered ancient secrets.', 'An ominous shadow crept across the valley.']
        },
        {
          name: 'Action and Movement',
          words: ['sprinted', 'crept', 'soared', 'plunged', 'wandered', 'dashed'],
          examples: ['She sprinted through the maze of corridors.', 'The eagle soared majestically above the mountains.']
        }
      ],
      phrasesAndExpressions: [
        'In the blink of an eye...',
        'Without warning...',
        'As fate would have it...',
        'Little did they know...',
        'Against all odds...',
        'In that moment of truth...'
      ]
    },
    'persuasive': {
      categories: [
        {
          name: 'Strong Arguments',
          words: ['compelling', 'undeniable', 'crucial', 'significant', 'essential', 'vital'],
          examples: ['This compelling evidence supports our position.', 'It is crucial that we act now.']
        },
        {
          name: 'Opinion Markers',
          words: ['undoubtedly', 'certainly', 'clearly', 'obviously', 'surely', 'definitely'],
          examples: ['Undoubtedly, this is the best solution.', 'Clearly, we must consider all options.']
        }
      ],
      phrasesAndExpressions: [
        'It is imperative that...',
        'We must consider...',
        'The evidence clearly shows...',
        'Without a doubt...',
        'It cannot be denied that...',
        'The facts speak for themselves...'
      ]
    },
    'descriptive': {
      categories: [
        {
          name: 'Sensory Details',
          words: ['glistening', 'aromatic', 'melodious', 'velvety', 'crisp', 'luminous'],
          examples: ['The glistening dewdrops caught the morning light.', 'A melodious tune drifted through the air.']
        },
        {
          name: 'Vivid Adjectives',
          words: ['spectacular', 'breathtaking', 'exquisite', 'magnificent', 'stunning', 'remarkable'],
          examples: ['The spectacular sunset painted the sky in brilliant colors.', 'Her exquisite artwork captured everyone\'s attention.']
        }
      ],
      phrasesAndExpressions: [
        'A sight to behold...',
        'As beautiful as...',
        'Like a work of art...',
        'Beyond description...',
        'A feast for the senses...',
        'Picture this...'
      ]
    }
  };

  const defaultVocab = vocabularyMap[textType.toLowerCase()] || vocabularyMap['narrative'];
  
  return {
    textType: textType,
    categories: defaultVocab.categories,
    phrasesAndExpressions: defaultVocab.phrasesAndExpressions || [
      'In addition to this...',
      'Furthermore...',
      'As a result...',
      'On the other hand...',
      'In conclusion...',
      'Most importantly...'
    ],
    transitionWords: [
      'However', 'Therefore', 'Moreover', 'Nevertheless', 'Consequently', 
      'Furthermore', 'Additionally', 'Meanwhile', 'Subsequently', 'Finally',
      'Initially', 'Eventually', 'Suddenly', 'Gradually', 'Immediately'
    ]
  };
}


// Add the missing identifyCommonMistakes function
export async function identifyCommonMistakes(content: string, textType: string): Promise<{
  overallAssessment: string;
  mistakesIdentified: Array<{
    category: string;
    issue: string;
    example: string;
    impact: string;
    correction: string;
    preventionTip: string;
  }>;
  patternAnalysis: string;
  priorityFixes: string[];
  positiveElements: string[];
}> {
  try {
    const systemPrompt = `You are an expert writing coach for NSW Selective School exam preparation. Analyze the provided ${textType.toLowerCase()} writing and identify common mistakes that students aged 10-12 typically make.

Focus on:
1. Grammar and punctuation errors
2. Sentence structure issues
3. Vocabulary usage problems
4. Text type specific issues (narrative structure, persuasive arguments, etc.)
5. Spelling and word choice errors

Return the response in this exact JSON format:
{
  "overallAssessment": "Brief overall assessment of the writing quality",
  "mistakesIdentified": [
    {
      "category": "Grammar/Punctuation/Structure/Vocabulary/Content",
      "issue": "Description of the specific mistake",
      "example": "Quote from the text showing the mistake",
      "impact": "How this affects the writing quality",
      "correction": "How to fix this specific instance",
      "preventionTip": "General advice to avoid this mistake in future"
    }
  ],
  "patternAnalysis": "Analysis of recurring patterns or themes in mistakes",
  "priorityFixes": ["Most important fixes to focus on"],
  "positiveElements": ["Things the student did well"]
}`;

    const userPrompt = `Analyze this ${textType.toLowerCase()} writing for common mistakes and areas for improvement:\n\n"${content}"\n\nProvide constructive feedback that helps the student improve their writing for NSW Selective School exam standards.`;

    const response = await makeOpenAICall(systemPrompt, userPrompt, 500);
    
    try {
      // Try to parse the JSON response
      const parsedResponse = JSON.parse(response);
      return parsedResponse;
    } catch (parseError) {
      console.warn('Failed to parse AI response as JSON, using fallback analysis');
      // Return fallback analysis if parsing fails
      return getFallbackMistakeAnalysis(textType, content);
    }
  } catch (error) {
    console.error('Error identifying common mistakes:', error);
    // Return fallback analysis on error
    return getFallbackMistakeAnalysis(textType, content);
  }
}

// Helper function to provide fallback mistake analysis
function getFallbackMistakeAnalysis(textType: string, content: string): {
  overallAssessment: string;
  mistakesIdentified: Array<{
    category: string;
    issue: string;
    example: string;
    impact: string;
    correction: string;
    preventionTip: string;
  }>;
  patternAnalysis: string;
  priorityFixes: string[];
  positiveElements: string[];
} {
  // Basic analysis based on common patterns
  const wordCount = content.split(/\s+/).length;
  const sentenceCount = content.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  const avgWordsPerSentence = wordCount / sentenceCount;
  
  const commonMistakes = [];
  
  // Check for common issues
  if (avgWordsPerSentence > 25) {
    commonMistakes.push({
      category: "Sentence Structure",
      issue: "Sentences may be too long and complex",
      example: "Some sentences in your writing are quite lengthy",
      impact: "Long sentences can be hard to follow and may lose the reader's attention",
      correction: "Try breaking longer sentences into shorter, clearer ones",
      preventionTip: "Aim for 15-20 words per sentence for better readability"
    });
  }
  
  if (avgWordsPerSentence < 8) {
    commonMistakes.push({
      category: "Sentence Structure",
      issue: "Sentences may be too short and choppy",
      example: "Your sentences tend to be quite brief",
      impact: "Very short sentences can make writing feel disconnected",
      correction: "Try combining some short sentences or adding more descriptive details",
      preventionTip: "Vary your sentence lengths for better flow and rhythm"
    });
  }
  
  // Check for repetitive words
  const words = content.toLowerCase().split(/\s+/);
  const wordFreq: { [key: string]: number } = {};
  words.forEach(word => {
    const cleanWord = word.replace(/[^\w]/g, '');
    if (cleanWord.length > 3) {
      wordFreq[cleanWord] = (wordFreq[cleanWord] || 0) + 1;
    }
  });
  
  const repeatedWords = Object.entries(wordFreq)
    .filter(([word, count]) => count > 3 && !['that', 'with', 'they', 'were', 'have', 'this', 'from'].includes(word))
    .map(([word]) => word);
  
  if (repeatedWords.length > 0) {
    commonMistakes.push({
      category: "Vocabulary",
      issue: "Some words are used repeatedly",
      example: `Words like "${repeatedWords[0]}" appear multiple times`,
      impact: "Repetitive vocabulary can make writing less engaging",
      correction: "Try using synonyms or alternative expressions",
      preventionTip: "Keep a list of synonyms handy when writing"
    });
  }
  
  return {
    overallAssessment: `Your ${textType.toLowerCase()} writing shows good effort with ${wordCount} words across ${sentenceCount} sentences. There are some areas where you can improve to meet NSW Selective School standards.`,
    mistakesIdentified: commonMistakes.length > 0 ? commonMistakes : [
      {
        category: "General",
        issue: "Continue developing your writing skills",
        example: "Your writing shows good foundation skills",
        impact: "Consistent practice will help you improve",
        correction: "Keep writing and focus on clear expression",
        preventionTip: "Read widely and practice writing regularly"
      }
    ],
    patternAnalysis: commonMistakes.length > 0 
      ? "The main areas for improvement focus on sentence structure and vocabulary variety."
      : "Your writing shows good basic structure. Continue practicing to develop more advanced techniques.",
    priorityFixes: commonMistakes.length > 0 
      ? commonMistakes.slice(0, 2).map(m => m.correction)
      : ["Focus on clear, engaging expression", "Practice varying sentence structure"],
    positiveElements: [
      "Shows good effort and engagement with the topic",
      "Demonstrates understanding of basic writing structure",
      "Uses appropriate length for the text type"
    ]
  };
}
