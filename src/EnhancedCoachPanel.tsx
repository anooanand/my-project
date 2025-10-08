import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  MessageCircle,
  Send,
  Loader2,
  Brain,
  BookOpen,
  Target,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Clock,
  User,
  Bot,
  Award,
  Zap,
  Eye
} from 'lucide-react';
import { getTextTypeStructure } from './lib/textTypeStructures';

// Types for enhanced coaching system
interface ConversationMessage {
  id: string;
  type: 'user' | 'ai' | 'system' | 'realtime';
  content: string;
  timestamp: Date;
  metadata?: {
    inputType?: 'prompt' | 'question' | 'writing' | 'feedback_request';
    writingStage?: 'initial' | 'planning' | 'writing' | 'revising' | 'complete';
    wordCount?: number;
    confidence?: number;
    operations?: string[];
    feedbackType?: 'encouragement' | 'guidance' | 'warning' | 'celebration' | 'tip';
    isRealtime?: boolean;
  };
}

interface AIOperation {
  type: 'grammar_check' | 'vocabulary_enhancement' | 'structure_analysis' | 'content_feedback' | 'question_analysis';
  priority: number;
  data?: any;
}

interface ContextSummary {
  writingType: string;
  currentStage: string;
  wordCount: number;
  keyTopics: string[];
  studentLevel: string;
  progressNotes: string[];
  lastFeedbackType: string;
}

interface EnhancedCoachPanelProps {
  content: string;
  textType: string;
  onContentChange?: (content: string) => void;
  onFeedbackReceived?: (feedback: any) => void;
  className?: string;
  startTime?: Date;
}

interface WritingAnalysis {
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  avgWordsPerSentence: number;
  phase: 'opening' | 'development' | 'conclusion' | 'complete';
  hasIntroduction: boolean;
  hasConclusion: boolean;
  recentAddition: string;
  vocabularyLevel: 'simple' | 'moderate' | 'advanced';
  sentenceVariety: 'limited' | 'moderate' | 'varied';
}

interface FeedbackHistory {
  timestamp: Date;
  type: string;
  wordCount: number;
}

// Advanced input type detection
class InputAnalyzer {
  static analyzeInput(input: string, context: {
    writingStage: string;
    wordCount: number;
    conversationHistory: ConversationMessage[];
  }): {
    type: 'prompt' | 'question' | 'writing' | 'feedback_request';
    confidence: number;
    suggestedOperations: AIOperation[];
  } {
    const trimmed = input.trim().toLowerCase();
    const words = input.trim().split(/\s+/).filter(w => w.length > 0);
    
    // Question indicators
    const questionWords = ['how', 'what', 'why', 'when', 'where', 'who', 'which', 'can', 'could', 'should', 'would', 'will'];
    const hasQuestionWord = questionWords.some(word => trimmed.includes(word));
    const hasQuestionMark = input.includes('?');
    const isShort = words.length < 10;
    
    // Writing indicators
    const writingIndicators = ['i think', 'in my opinion', 'firstly', 'secondly', 'in conclusion', 'however', 'therefore'];
    const hasWritingIndicators = writingIndicators.some(phrase => trimmed.includes(phrase));
    const isLong = words.length > 20;
    
    // Feedback request indicators
    const feedbackIndicators = ['feedback', 'check', 'review', 'help', 'improve', 'better', 'correct'];
    const hasFeedbackRequest = feedbackIndicators.some(word => trimmed.includes(word));
    
    // Prompt indicators
    const promptIndicators = ['write about', 'essay on', 'discuss', 'explain', 'describe', 'argue'];
    const hasPromptIndicators = promptIndicators.some(phrase => trimmed.includes(phrase));
    
    // Scoring system
    let scores = {
      prompt: 0,
      question: 0,
      writing: 0,
      feedback_request: 0
    };
    
    // Question scoring
    if (hasQuestionWord) scores.question += 30;
    if (hasQuestionMark) scores.question += 25;
    if (isShort) scores.question += 15;
    
    // Writing scoring
    if (hasWritingIndicators) scores.writing += 25;
    if (isLong) scores.writing += 20;
    if (context.writingStage === 'writing' || context.writingStage === 'revising') scores.writing += 15;
    
    // Feedback request scoring
    if (hasFeedbackRequest) scores.feedback_request += 30;
    if (context.wordCount > 50) scores.feedback_request += 15;
    
    // Prompt scoring
    if (hasPromptIndicators) scores.prompt += 25;
    if (context.writingStage === 'initial') scores.prompt += 20;
    if (words.length > 5 && words.length < 30) scores.prompt += 10;
    
    // Determine type and confidence
    const maxScore = Math.max(...Object.values(scores));
    const type = Object.keys(scores).find(key => scores[key as keyof typeof scores] === maxScore) as any;
    const confidence = Math.min(maxScore / 50, 1);
    
    // Suggest AI operations based on input type
    const suggestedOperations: AIOperation[] = [];
    
    switch (type) {
      case 'question':
        suggestedOperations.push(
          { type: 'question_analysis', priority: 1 },
          { type: 'content_feedback', priority: 2 }
        );
        break;
      case 'writing':
        suggestedOperations.push(
          { type: 'grammar_check', priority: 1 },
          { type: 'vocabulary_enhancement', priority: 2 },
          { type: 'structure_analysis', priority: 3 }
        );
        break;
      case 'feedback_request':
        suggestedOperations.push(
          { type: 'content_feedback', priority: 1 },
          { type: 'grammar_check', priority: 2 },
          { type: 'structure_analysis', priority: 3 }
        );
        break;
      case 'prompt':
        suggestedOperations.push(
          { type: 'question_analysis', priority: 1 },
          { type: 'structure_analysis', priority: 2 }
        );
        break;
    }
    
    return { type, confidence, suggestedOperations };
  }
}

// Context manager for conversation history
class ContextManager {
  static createSummary(messages: ConversationMessage[], currentContent: string): ContextSummary {
    const wordCount = currentContent.trim().split(/\s+/).filter(w => w.length > 0).length;
    
    // Determine writing stage based on word count and conversation
    let currentStage = 'initial';
    if (wordCount > 500) currentStage = 'complete';
    else if (wordCount > 300) currentStage = 'revising';
    else if (wordCount > 50) currentStage = 'writing';
    else if (wordCount > 0) currentStage = 'planning';
    
    // Extract key topics from conversation
    const allText = messages.map(m => m.content).join(' ').toLowerCase();
    const keyTopics = this.extractKeyTopics(allText);
    
    // Determine student level based on vocabulary and complexity
    const studentLevel = this.assessStudentLevel(messages);
    
    // Extract progress notes
    const progressNotes = messages
      .filter(m => m.type === 'ai' && m.content.includes('progress'))
      .map(m => m.content.substring(0, 100) + '...')
      .slice(-3);
    
    // Get last feedback type
    const lastAIMessage = messages.filter(m => m.type === 'ai').pop();
    const lastFeedbackType = lastAIMessage?.metadata?.operations?.[0] || 'general';
    
    return {
      writingType: 'narrative', // This should be passed from props
      currentStage,
      wordCount,
      keyTopics,
      studentLevel,
      progressNotes,
      lastFeedbackType
    };
  }
  
  static extractKeyTopics(text: string): string[] {
    // Simple keyword extraction - in production, use more sophisticated NLP
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they']);
    
    const words = text.split(/\s+/)
      .map(w => w.replace(/[^\w]/g, '').toLowerCase())
      .filter(w => w.length > 3 && !commonWords.has(w));
    
    const wordCounts = words.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(wordCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  }
  
  static assessStudentLevel(messages: ConversationMessage[]): string {
    // Simple assessment based on vocabulary complexity and sentence structure
    const userMessages = messages.filter(m => m.type === 'user');
    if (userMessages.length === 0) return 'beginner';
    
    const avgWordsPerMessage = userMessages.reduce((sum, m) => 
      sum + m.content.split(/\s+/).length, 0) / userMessages.length;
    
    if (avgWordsPerMessage > 50) return 'advanced';
    if (avgWordsPerMessage > 20) return 'intermediate';
    return 'beginner';
  }
  
  static shouldCreateSummary(messages: ConversationMessage[]): boolean {
    return messages.length > 10;
  }
  
  static createContextSummaryMessage(summary: ContextSummary): ConversationMessage {
    const summaryText = `Context Summary: Student is working on ${summary.writingType} writing, currently in ${summary.currentStage} stage with ${summary.wordCount} words. Key topics: ${summary.keyTopics.join(', ')}. Student level: ${summary.studentLevel}.`;
    
    return {
      id: `summary_${Date.now()}`,
      type: 'system',
      content: summaryText,
      timestamp: new Date(),
      metadata: {
        writingStage: summary.currentStage as any,
        wordCount: summary.wordCount
      }
    };
  }
}

// Enhanced AI service for multiple operations
class EnhancedAIService {
  static async processMultipleOperations(
    operations: AIOperation[],
    input: string,
    context: ContextSummary,
    textType: string
  ): Promise<{
    response: string;
    operations: string[];
    feedback?: any;
  }> {
    const results: any[] = [];
    const executedOperations: string[] = [];
    
    // Sort operations by priority
    const sortedOperations = operations.sort((a, b) => a.priority - b.priority);
    
    for (const operation of sortedOperations) {
      try {
        const result = await this.executeOperation(operation, input, context, textType);
        if (result) {
          results.push(result);
          executedOperations.push(operation.type);
        }
      } catch (error) {
        console.error(`Error executing operation ${operation.type}:`, error);
      }
    }
    
    // Combine results into structured response
    const response = this.combineResults(results, context);
    
    return {
      response,
      operations: executedOperations,
      feedback: results.find(r => r.type === 'feedback')?.data
    };
  }
  
  static async executeOperation(
    operation: AIOperation,
    input: string,
    context: ContextSummary,
    textType: string
  ): Promise<any> {
    const baseUrl = '/netlify/functions/ai-operations';
    
    switch (operation.type) {
      case 'question_analysis':
        return await this.makeAPICall(baseUrl, {
          action: 'analyzeQuestion',
          question: input,
          textType,
          context
        });
        
      case 'grammar_check':
        return await this.makeAPICall(baseUrl, {
          action: 'checkGrammarForEditor',
          text: input,
          includePositions: true
        });
        
      case 'vocabulary_enhancement':
        return await this.makeAPICall(baseUrl, {
          action: 'enhanceVocabulary',
          text: input,
          level: context.studentLevel
        });
        
      case 'structure_analysis':
        return await this.makeAPICall(baseUrl, {
          action: 'analyzeStructure',
          text: input,
          textType,
          stage: context.currentStage
        });
        
      case 'content_feedback':
        return await this.makeAPICall(baseUrl, {
          action: 'getNSWSelectiveFeedback',
          content: input,
          textType,
          assistanceLevel: 'detailed',
          context
        });
        
      default:
        return null;
    }
  }
  
  static async makeAPICall(url: string, data: any): Promise<any> {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (response.ok) {
      const result = await response.json();
      return { type: data.action, data: result };
    }
    
    throw new Error(`API call failed: ${response.statusText}`);
  }
  
  static combineResults(results: any[], context: ContextSummary): string {
    if (results.length === 0) {
      return "I'm here to help! Could you tell me more about what you're working on?";
    }
    
    let response = "";
    
    // Add stage-appropriate greeting
    if (context.currentStage === 'initial') {
      response += "Great! Let's get started with your writing. ";
    } else if (context.currentStage === 'planning') {
      response += "I can see you're planning your writing. ";
    } else if (context.currentStage === 'writing') {
      response += `You're making good progress with ${context.wordCount} words! `;
    } else if (context.currentStage === 'revising') {
      response += "Excellent work! Let's polish your writing. ";
    }
    
    // Process each result type
    for (const result of results) {
      switch (result.type) {
        case 'analyzeQuestion':
          if (result.data.guidance) {
            response += `\n\n📝 **Writing Guidance:**\n${result.data.guidance}`;
          }
          if (result.data.structure) {
            response += `\n\n🏗️ **Suggested Structure:**\n${result.data.structure}`;
          }
          break;
          
        case 'checkGrammarForEditor':
          if (result.data.errors && result.data.errors.length > 0) {
            response += `\n\n✏️ **Grammar & Spelling:**\nI found ${result.data.errors.length} areas to improve. Check the highlights in your text!`;
          }
          break;
          
        case 'enhanceVocabulary':
          if (result.data.suggestions && result.data.suggestions.length > 0) {
            response += `\n\n💡 **Vocabulary Enhancement:**\nI have some word suggestions to make your writing stronger!`;
          }
          break;
          
        case 'analyzeStructure':
          if (result.data.feedback) {
            response += `\n\n📊 **Structure Analysis:**\n${result.data.feedback}`;
          }
          break;
          
        case 'getNSWSelectiveFeedback':
          if (result.data.feedbackItems) {
            const strengths = result.data.feedbackItems.filter((item: any) => item.type === 'praise');
            const improvements = result.data.feedbackItems.filter((item: any) => item.type === 'improvement');
            
            if (strengths.length > 0) {
              response += `\n\n🌟 **Strengths:**\n${strengths.map((s: any) => `• ${s.text}`).join('\n')}`;
            }
            
            if (improvements.length > 0) {
              response += `\n\n🎯 **Areas to Improve:**\n${improvements.map((i: any) => `• ${i.text}`).join('\n')}`;
            }
          }
          break;
      }
    }
    
    // Add encouraging closing
    if (context.currentStage !== 'complete') {
      response += `\n\nKeep up the great work! What would you like to focus on next?`;
    } else {
      response += `\n\nFantastic job completing your writing! 🎉`;
    }
    
    return response.trim();
  }
}

// Real-time Writing Analyzer
class RealTimeWritingAnalyzer {
  static analyzeWriting(content: string, textType: string): WritingAnalysis {
    const words = content.trim().split(/\s+/).filter(w => w.length > 0);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 0);

    const wordCount = words.length;
    const sentenceCount = sentences.length || 1;
    const paragraphCount = paragraphs.length;
    const avgWordsPerSentence = wordCount / sentenceCount;

    // Determine writing phase based on word count
    let phase: 'opening' | 'development' | 'conclusion' | 'complete';
    if (wordCount < 50) {
      phase = 'opening';
    } else if (wordCount < 200) {
      phase = 'development';
    } else if (wordCount < 300) {
      phase = 'conclusion';
    } else {
      phase = 'complete';
    }

    // Check for introduction and conclusion markers
    const lowerContent = content.toLowerCase();
    const hasIntroduction = paragraphCount > 0 && wordCount > 20;
    const conclusionWords = ['in conclusion', 'finally', 'to sum up', 'overall', 'in summary', 'therefore'];
    const hasConclusion = conclusionWords.some(word => lowerContent.includes(word)) ||
                          (wordCount > 250 && paragraphs.length > 2);

    // Get recent addition (last 50 words)
    const recentAddition = words.slice(-50).join(' ');

    // Assess vocabulary level
    const advancedWords = ['however', 'furthermore', 'consequently', 'nevertheless', 'substantial',
                          'significant', 'demonstrate', 'illustrate', 'emphasize', 'extraordinary'];
    const advancedWordCount = words.filter(w =>
      advancedWords.includes(w.toLowerCase())
    ).length;
    const vocabularyLevel: 'simple' | 'moderate' | 'advanced' =
      advancedWordCount > 5 ? 'advanced' : advancedWordCount > 2 ? 'moderate' : 'simple';

    // Assess sentence variety
    const sentenceLengths = sentences.map(s => s.trim().split(/\s+/).length);
    const lengthVariance = this.calculateVariance(sentenceLengths);
    const sentenceVariety: 'limited' | 'moderate' | 'varied' =
      lengthVariance > 20 ? 'varied' : lengthVariance > 10 ? 'moderate' : 'limited';

    return {
      wordCount,
      sentenceCount,
      paragraphCount,
      avgWordsPerSentence,
      phase,
      hasIntroduction,
      hasConclusion,
      recentAddition,
      vocabularyLevel,
      sentenceVariety
    };
  }

  static calculateVariance(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
    const squareDiffs = numbers.map(n => Math.pow(n - mean, 2));
    return squareDiffs.reduce((sum, n) => sum + n, 0) / numbers.length;
  }
}

// Intelligent Feedback Generator
class IntelligentFeedbackGenerator {
  static generateRealtimeFeedback(
    analysis: WritingAnalysis,
    textType: string,
    timeElapsed: number,
    feedbackHistory: FeedbackHistory[],
    previousContent: string
  ): ConversationMessage | null {
    const { wordCount, phase, paragraphCount, sentenceVariety, vocabularyLevel } = analysis;
    const structure = getTextTypeStructure(textType);
    const minutesElapsed = Math.floor(timeElapsed / 60000);

    // Don't give feedback if content hasn't changed much
    if (previousContent && this.contentSimilarity(previousContent, analysis.recentAddition) > 0.9) {
      return null;
    }

    // Avoid repeating similar feedback too soon
    const recentFeedback = feedbackHistory.filter(f =>
      Date.now() - f.timestamp.getTime() < 60000
    );
    if (recentFeedback.length > 2) return null;

    let content = '';
    let feedbackType: 'encouragement' | 'guidance' | 'warning' | 'celebration' | 'tip' = 'guidance';

    // Phase-specific feedback
    if (phase === 'opening') {
      content = this.getOpeningFeedback(analysis, structure, minutesElapsed);
      feedbackType = 'guidance';
    } else if (phase === 'development') {
      content = this.getDevelopmentFeedback(analysis, structure, minutesElapsed);
      feedbackType = 'encouragement';
    } else if (phase === 'conclusion') {
      content = this.getConclusionFeedback(analysis, structure, minutesElapsed);
      feedbackType = 'tip';
    } else {
      content = this.getCompleteFeedback(analysis, minutesElapsed);
      feedbackType = 'celebration';
    }

    // Time-based warnings (40-minute test simulation)
    if (minutesElapsed >= 30 && wordCount < 150) {
      content = `⏰ Time check! You have about 10 minutes left. Aim to reach at least 200 words. Focus on completing your main ideas and adding a strong conclusion.`;
      feedbackType = 'warning';
    } else if (minutesElapsed >= 35 && !analysis.hasConclusion) {
      content = `⏰ Last 5 minutes! Make sure to write a conclusion that wraps up your ${textType} writing. A strong ending is important!`;
      feedbackType = 'warning';
    }

    if (!content) return null;

    return {
      id: `realtime_${Date.now()}`,
      type: 'realtime',
      content,
      timestamp: new Date(),
      metadata: {
        wordCount,
        writingStage: this.phaseToStage(phase),
        feedbackType,
        isRealtime: true
      }
    };
  }

  static getOpeningFeedback(analysis: WritingAnalysis, structure: any, minutesElapsed: number): string {
    const { wordCount, paragraphCount, sentenceCount } = analysis;
    const currentPhase = structure.phases[0];

    if (wordCount < 10) {
      return `Great start! ${currentPhase.title} - Try using one of these sentence starters: "${currentPhase.sentenceStarters[0]}" to hook your reader's attention.`;
    }

    if (wordCount >= 10 && wordCount < 30) {
      return `Nice beginning! You're setting the scene. Try adding sensory details - what does it look like, sound like, or feel like? For example: "${currentPhase.powerWords.slice(0, 3).join(', ')}..."`;
    }

    if (wordCount >= 30 && wordCount < 50) {
      return `Excellent opening! You've written ${wordCount} words. Now start developing your main ideas. Move into the next section: ${structure.phases[1].title}.`;
    }

    return '';
  }

  static getDevelopmentFeedback(analysis: WritingAnalysis, structure: any, minutesElapsed: number): string {
    const { wordCount, paragraphCount, sentenceVariety, vocabularyLevel, avgWordsPerSentence } = analysis;
    const developmentPhase = structure.phases[1];

    if (wordCount >= 50 && wordCount < 80) {
      return `You're making great progress! (${wordCount} words) ${developmentPhase.title} - Remember to build your ideas with specific examples and details. Keep going!`;
    }

    if (wordCount >= 80 && wordCount < 120) {
      if (paragraphCount < 2) {
        return `Nice work! Quick tip: Break your writing into paragraphs - each new idea should start a new paragraph. This makes your writing easier to read.`;
      }
      if (sentenceVariety === 'limited') {
        return `Good development! Try varying your sentence lengths - mix short, punchy sentences with longer, detailed ones. This keeps readers engaged!`;
      }
      return `Fantastic! ${wordCount} words so far. Your ideas are developing well. Keep adding specific details and examples to support your points.`;
    }

    if (wordCount >= 120 && wordCount < 180) {
      if (vocabularyLevel === 'simple') {
        const powerWords = developmentPhase.powerWords?.slice(0, 3) || [];
        return `You're doing well! Try using stronger vocabulary like: ${powerWords.join(', ')}. These words will make your writing more impressive!`;
      }
      return `Excellent progress! (${wordCount} words) You're in the sweet spot. Continue developing your ideas, and start thinking about your conclusion soon.`;
    }

    if (wordCount >= 180 && wordCount < 200) {
      return `Almost at 200 words - well done! Start transitioning to your conclusion. Wrap up your main ideas and leave your reader with a strong final thought.`;
    }

    return '';
  }

  static getConclusionFeedback(analysis: WritingAnalysis, structure: any, minutesElapsed: number): string {
    const { wordCount, hasConclusion, paragraphCount } = analysis;
    const conclusionPhase = structure.phases[structure.phases.length - 1];

    if (wordCount >= 200 && wordCount < 220 && !hasConclusion) {
      return `You've reached 200 words! Time to write your conclusion. Start with: "${conclusionPhase.sentenceStarters[0]}" to signal you're wrapping up.`;
    }

    if (wordCount >= 220 && wordCount < 260 && !hasConclusion) {
      return `Strong writing so far! Make sure to add a conclusion that summarizes your main points and gives your reader something to think about.`;
    }

    if (hasConclusion && wordCount >= 250) {
      return `Excellent! You've written ${wordCount} words with a complete structure. Review your work for any spelling or grammar errors, and make your writing shine!`;
    }

    return '';
  }

  static getCompleteFeedback(analysis: WritingAnalysis, minutesElapsed: number): string {
    const { wordCount, paragraphCount, sentenceVariety, vocabularyLevel } = analysis;

    if (wordCount >= 300) {
      let feedback = `Amazing work! You've written ${wordCount} words - that's excellent for a test response! `;

      if (minutesElapsed < 40) {
        feedback += `You have time to review and polish your writing. Check for:`;
        feedback += `\n\n• Spelling and punctuation`;
        feedback += `\n• Varied sentence lengths`;
        feedback += `\n• Strong vocabulary choices`;
        feedback += `\n• Clear paragraphs with topic sentences`;
      }

      return feedback;
    }

    return '';
  }

  static contentSimilarity(str1: string, str2: string): number {
    const words1 = new Set(str1.toLowerCase().split(/\s+/));
    const words2 = new Set(str2.toLowerCase().split(/\s+/));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    return intersection.size / Math.max(words1.size, words2.size);
  }

  static phaseToStage(phase: string): 'initial' | 'planning' | 'writing' | 'revising' | 'complete' {
    if (phase === 'opening') return 'planning';
    if (phase === 'development') return 'writing';
    if (phase === 'conclusion') return 'revising';
    return 'complete';
  }
}

// Main Enhanced Coach Panel Component
export const EnhancedCoachPanel: React.FC<EnhancedCoachPanelProps> = ({
  content,
  textType,
  onContentChange,
  onFeedbackReceived,
  className = "",
  startTime = new Date()
}) => {
  // State management
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [contextSummary, setContextSummary] = useState<ContextSummary | null>(null);
  const [previousContent, setPreviousContent] = useState('');
  const [feedbackHistory, setFeedbackHistory] = useState<FeedbackHistory[]>([]);
  const [lastAnalysis, setLastAnalysis] = useState<WritingAnalysis | null>(null);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const realtimeFeedbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);
  
  // Update context summary when content or messages change
  useEffect(() => {
    const summary = ContextManager.createSummary(messages, content);
    setContextSummary(summary);
    
    // Add summary message if conversation is getting long
    if (ContextManager.shouldCreateSummary(messages) && 
        !messages.some(m => m.type === 'system' && m.content.includes('Context Summary'))) {
      const summaryMessage = ContextManager.createContextSummaryMessage(summary);
      setMessages(prev => [...prev, summaryMessage]);
    }
  }, [messages, content]);
  
  // Real-time feedback system - analyzes writing every 10 seconds
  useEffect(() => {
    // Clear existing timer
    if (realtimeFeedbackTimerRef.current) {
      clearInterval(realtimeFeedbackTimerRef.current);
    }

    // Only provide real-time feedback if student is actively writing
    if (content.trim().length === 0) {
      return;
    }

    // Set up 10-second interval for intelligent feedback
    realtimeFeedbackTimerRef.current = setInterval(() => {
      const analysis = RealTimeWritingAnalyzer.analyzeWriting(content, textType);
      setLastAnalysis(analysis);

      const timeElapsed = Date.now() - startTime.getTime();
      const feedbackMessage = IntelligentFeedbackGenerator.generateRealtimeFeedback(
        analysis,
        textType,
        timeElapsed,
        feedbackHistory,
        previousContent
      );

      if (feedbackMessage) {
        setMessages(prev => {
          // Remove old realtime messages if we have too many
          const filtered = prev.filter(m =>
            m.type !== 'realtime' ||
            Date.now() - m.timestamp.getTime() < 120000
          );
          return [...filtered, feedbackMessage];
        });

        setFeedbackHistory(prev => [
          ...prev,
          {
            timestamp: new Date(),
            type: feedbackMessage.metadata?.feedbackType || 'guidance',
            wordCount: analysis.wordCount
          }
        ]);
      }

      setPreviousContent(content);
    }, 10000); // Every 10 seconds

    return () => {
      if (realtimeFeedbackTimerRef.current) {
        clearInterval(realtimeFeedbackTimerRef.current);
      }
    };
  }, [content, textType, startTime, feedbackHistory, previousContent]);

  // Send initial greeting
  useEffect(() => {
    if (messages.length === 0) {
      const greetingMessage: ConversationMessage = {
        id: `greeting_${Date.now()}`,
        type: 'ai',
        content: `Hi! I'm your writing coach, and I'm excited to help you with your ${textType} writing today! \n\nI'll be watching your progress and giving you helpful tips as you write. You're aiming for 200-300 words in about 40 minutes. Ready to start? Just begin writing, and I'll guide you along the way!`,
        timestamp: new Date(),
        metadata: {
          writingStage: 'initial',
          operations: ['greeting'],
          feedbackType: 'encouragement'
        }
      };
      setMessages([greetingMessage]);
    }
  }, [textType, messages.length]);
  
  // Handle sending message
  const handleSendMessage = useCallback(async () => {
    if (!currentInput.trim() || isProcessing) return;
    
    const userMessage: ConversationMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: currentInput,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setCurrentInput('');
    setIsProcessing(true);
    
    try {
      // Analyze input
      const analysis = InputAnalyzer.analyzeInput(currentInput, {
        writingStage: contextSummary?.currentStage || 'initial',
        wordCount: contextSummary?.wordCount || 0,
        conversationHistory: messages
      });
      
      // Update user message with metadata
      userMessage.metadata = {
        inputType: analysis.type,
        confidence: analysis.confidence,
        writingStage: contextSummary?.currentStage as any,
        wordCount: contextSummary?.wordCount
      };
      
      // Process with AI service
      const result = await EnhancedAIService.processMultipleOperations(
        analysis.suggestedOperations,
        currentInput,
        contextSummary!,
        textType
      );
      
      // Create AI response message
      const aiMessage: ConversationMessage = {
        id: `ai_${Date.now()}`,
        type: 'ai',
        content: result.response,
        timestamp: new Date(),
        metadata: {
          operations: result.operations,
          writingStage: contextSummary?.currentStage as any
        }
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Pass feedback to parent component
      if (result.feedback && onFeedbackReceived) {
        onFeedbackReceived(result.feedback);
      }
      
    } catch (error) {
      console.error('Error processing message:', error);
      
      const errorMessage: ConversationMessage = {
        id: `error_${Date.now()}`,
        type: 'ai',
        content: "I'm sorry, I encountered an error. Could you try rephrasing your question?",
        timestamp: new Date(),
        metadata: {
          operations: ['error']
        }
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  }, [currentInput, isProcessing, contextSummary, messages, textType, onFeedbackReceived]);
  
  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Format message content
  const formatMessageContent = (content: string) => {
    // Convert markdown-like formatting to JSX
    return content.split('\n').map((line, index) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <div key={index} className="font-semibold text-gray-800 mt-3 mb-1">{line.slice(2, -2)}</div>;
      }
      if (line.startsWith('• ')) {
        return <div key={index} className="ml-4 text-gray-700">{line}</div>;
      }
      if (line.trim() === '') {
        return <div key={index} className="h-2"></div>;
      }
      return <div key={index} className="text-gray-700">{line}</div>;
    });
  };
  
  // Get message icon based on type and feedback
  const getMessageIcon = (message: ConversationMessage) => {
    if (message.type === 'user') return <User className="h-4 w-4" />;
    if (message.type === 'system') return <Brain className="h-4 w-4" />;

    // Real-time feedback gets special icons
    if (message.type === 'realtime') {
      const feedbackType = message.metadata?.feedbackType;
      if (feedbackType === 'celebration') return <Award className="h-4 w-4" />;
      if (feedbackType === 'warning') return <Clock className="h-4 w-4" />;
      if (feedbackType === 'tip') return <Lightbulb className="h-4 w-4" />;
      if (feedbackType === 'encouragement') return <TrendingUp className="h-4 w-4" />;
      return <Eye className="h-4 w-4" />;
    }

    const operations = message.metadata?.operations || [];
    if (operations.includes('analyzeQuestion')) return <BookOpen className="h-4 w-4" />;
    if (operations.includes('checkGrammarForEditor')) return <CheckCircle className="h-4 w-4" />;
    if (operations.includes('getNSWSelectiveFeedback')) return <Target className="h-4 w-4" />;

    return <Bot className="h-4 w-4" />;
  };

  // Get message styling based on feedback type
  const getMessageStyle = (message: ConversationMessage) => {
    if (message.type === 'user') return 'bg-blue-600 text-white';
    if (message.type === 'system') return 'bg-gray-100 text-gray-700 text-sm';

    if (message.type === 'realtime') {
      const feedbackType = message.metadata?.feedbackType;
      if (feedbackType === 'celebration') return 'bg-green-50 text-green-800 border border-green-200';
      if (feedbackType === 'warning') return 'bg-orange-50 text-orange-800 border border-orange-200';
      if (feedbackType === 'tip') return 'bg-blue-50 text-blue-800 border border-blue-200';
      if (feedbackType === 'encouragement') return 'bg-purple-50 text-purple-800 border border-purple-200';
      return 'bg-gray-50 text-gray-800 border border-gray-200';
    }

    return 'bg-gray-100 text-gray-800';
  };
  
  return (
    <div className={`flex flex-col h-full bg-white rounded-lg border shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-lg">
        <div className="flex items-center space-x-2">
          <MessageCircle className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-gray-800">Writing Coach</h3>
        </div>
        
        {contextSummary && (
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{contextSummary.currentStage}</span>
            </div>
            <div className="flex items-center space-x-1">
              <TrendingUp className="h-4 w-4" />
              <span>{contextSummary.wordCount} words</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-3 ${
              message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}
          >
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              message.type === 'user' 
                ? 'bg-blue-100 text-blue-600' 
                : message.type === 'system'
                ? 'bg-gray-100 text-gray-600'
                : 'bg-green-100 text-green-600'
            }`}>
              {getMessageIcon(message)}
            </div>
            
            <div className={`flex-1 max-w-xs lg:max-w-md ${
              message.type === 'user' ? 'text-right' : ''
            }`}>
              <div className={`p-3 rounded-lg shadow-sm ${
                getMessageStyle(message)
              }`}>
                {message.type === 'user' ? (
                  <div>{message.content}</div>
                ) : (
                  <div className="space-y-1">
                    {formatMessageContent(message.content)}
                  </div>
                )}
              </div>
              
              <div className={`text-xs text-gray-500 mt-1 ${
                message.type === 'user' ? 'text-right' : ''
              }`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {message.metadata?.operations && (
                  <span className="ml-2">
                    • {message.metadata.operations.join(', ')}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {isProcessing && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
            <div className="bg-gray-100 text-gray-600 p-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <span>Analyzing your input...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <div className="p-4 border-t bg-gray-50 rounded-b-lg">
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your writing..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              disabled={isProcessing}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!currentInput.trim() || isProcessing}
            className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        
        {lastAnalysis && (
          <div className="mt-2 flex items-center justify-between text-xs">
            <div className="text-gray-500">
              <span className="font-semibold">{lastAnalysis.wordCount}</span> words •
              <span className="capitalize">{lastAnalysis.phase}</span> phase
            </div>
            {lastAnalysis.wordCount < 200 && (
              <div className="text-blue-600 font-medium">
                Target: 200-300 words
              </div>
            )}
            {lastAnalysis.wordCount >= 200 && lastAnalysis.wordCount < 300 && (
              <div className="text-green-600 font-medium flex items-center gap-1">
                <CheckCircle className="h-3 w-3" /> On track!
              </div>
            )}
            {lastAnalysis.wordCount >= 300 && (
              <div className="text-green-600 font-medium flex items-center gap-1">
                <Award className="h-3 w-3" /> Excellent!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedCoachPanel;
