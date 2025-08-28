// OpenAI Service Module for Automatic Feedback System
// Save this as: src/lib/openai-service.ts

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
