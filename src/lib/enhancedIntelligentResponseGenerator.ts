// Enhanced Intelligent Response Generator for NSW Selective School Writing Coach
import { generateChatResponse } from './openai';

export interface EnhancedCoachingContext {
  textType: 'narrative' | 'persuasive' | 'expository' | 'descriptive' | 'creative';
  currentContent: string;
  analysis: any;
  contextualState: any;
  timeElapsed: number;
  wordCount: number;
}

export interface EnhancedResponse {
  message: string;
  priority: 'high' | 'medium' | 'low';
  genreSpecificTips?: string[];
  structureGuidance?: string;
}

class EnhancedIntelligentResponseGenerator {
  private currentTextType: string = 'narrative';

  setTextType(textType: string): void {
    this.currentTextType = textType;
  }

  async generateResponse(
    userMessage: string,
    context: EnhancedCoachingContext
  ): Promise<EnhancedResponse> {
    try {
      // Call the OpenAI backend to generate response
      const response = await generateChatResponse({
        userMessage,
        textType: context.textType,
        currentContent: context.currentContent,
        wordCount: context.wordCount,
        context: JSON.stringify({
          timeElapsed: context.timeElapsed,
          analysis: context.analysis,
          contextualState: context.contextualState
        })
      });

      // Determine priority based on context
      const priority = this.determinePriority(context, userMessage);

      // Generate genre-specific tips
      const genreSpecificTips = this.getGenreSpecificTips(context);

      // Generate structure guidance
      const structureGuidance = this.getStructureGuidance(context);

      return {
        message: response,
        priority,
        genreSpecificTips,
        structureGuidance
      };
    } catch (error) {
      console.error('Error generating enhanced response:', error);
      
      // Fallback response
      return {
        message: "I'm here to help! Keep writing and I'll guide you through the process.",
        priority: 'low'
      };
    }
  }

  private determinePriority(
    context: EnhancedCoachingContext,
    userMessage: string
  ): 'high' | 'medium' | 'low' {
    const { timeElapsed, wordCount } = context;
    const timeRemaining = 40 * 60 - timeElapsed;
    
    // High priority if time is running out or word count is low
    if (timeRemaining < 10 * 60 && wordCount < 200) {
      return 'high';
    }
    
    // Medium priority for specific writing questions
    if (userMessage.toLowerCase().includes('how') || 
        userMessage.toLowerCase().includes('help') ||
        userMessage.toLowerCase().includes('improve')) {
      return 'medium';
    }
    
    return 'low';
  }

  private getGenreSpecificTips(context: EnhancedCoachingContext): string[] {
    const { textType, wordCount } = context;
    const tips: string[] = [];

    switch (textType) {
      case 'narrative':
        if (wordCount < 100) {
          tips.push('Start with a strong hook to grab the reader\'s attention');
          tips.push('Introduce your main character and setting early');
        } else if (wordCount < 250) {
          tips.push('Build tension and develop your plot');
          tips.push('Use dialogue to show character personality');
        } else {
          tips.push('Work towards your climax and resolution');
          tips.push('Show character growth or change');
        }
        break;

      case 'persuasive':
        if (wordCount < 100) {
          tips.push('State your position clearly in the introduction');
          tips.push('Preview your main arguments');
        } else if (wordCount < 250) {
          tips.push('Support each argument with strong evidence');
          tips.push('Use persuasive language and rhetorical devices');
        } else {
          tips.push('Address counter-arguments to strengthen your position');
          tips.push('End with a powerful call to action');
        }
        break;

      case 'expository':
        if (wordCount < 100) {
          tips.push('Introduce your topic clearly');
          tips.push('Outline the main points you\'ll explain');
        } else if (wordCount < 250) {
          tips.push('Provide clear explanations with examples');
          tips.push('Use transitions between ideas');
        } else {
          tips.push('Summarize key information');
          tips.push('Ensure all points are well-explained');
        }
        break;

      case 'descriptive':
        if (wordCount < 100) {
          tips.push('Set the scene with vivid details');
          tips.push('Use sensory language (sight, sound, smell, touch, taste)');
        } else if (wordCount < 250) {
          tips.push('Layer your descriptions with figurative language');
          tips.push('Create a mood or atmosphere');
        } else {
          tips.push('Leave a lasting impression');
          tips.push('Ensure your descriptions paint a complete picture');
        }
        break;

      case 'creative':
        if (wordCount < 100) {
          tips.push('Start with something unexpected or intriguing');
          tips.push('Establish your unique creative concept');
        } else if (wordCount < 250) {
          tips.push('Develop your creative idea fully');
          tips.push('Experiment with language and style');
        } else {
          tips.push('Bring your creative piece to a satisfying conclusion');
          tips.push('Ensure your creative concept is fully realized');
        }
        break;
    }

    return tips;
  }

  private getStructureGuidance(context: EnhancedCoachingContext): string | undefined {
    const { wordCount, timeElapsed } = context;
    const timeRemaining = 40 * 60 - timeElapsed;

    if (wordCount < 50) {
      return 'Focus on your opening. Make it engaging and set up your main idea.';
    } else if (wordCount < 150) {
      return 'You\'re in the development phase. Build on your opening with details and examples.';
    } else if (wordCount < 300) {
      return 'You\'re making great progress! Start thinking about how to wrap up your ideas.';
    } else if (wordCount < 400) {
      return 'Nearly there! Focus on crafting a strong conclusion that ties everything together.';
    } else if (timeRemaining < 5 * 60) {
      return 'Time is running short! Make sure you have a clear conclusion.';
    }

    return undefined;
  }
}

// Export a singleton instance
export const enhancedIntelligentResponseGenerator = new EnhancedIntelligentResponseGenerator();