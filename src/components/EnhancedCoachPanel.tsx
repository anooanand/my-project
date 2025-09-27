import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Bot
} from 'lucide-react';
import { safeMap, safeFilter, safeAccess, safeProp, setupGlobalErrorHandling } from './utils/safeOperations';

// Initialize global error handling
setupGlobalErrorHandling();

// Types for enhanced coaching system
interface ConversationMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    inputType?: 'prompt' | 'question' | 'writing' | 'feedback_request';
    writingStage?: 'initial' | 'planning' | 'writing' | 'revising' | 'complete';
    wordCount?: number;
    confidence?: number;
    operations?: string[];
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
}

// Advanced input type detection with safe operations
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
    const trimmed = safeAccess(() => input.trim().toLowerCase(), '');
    const words = safeAccess(() => input.trim().split(/\s+/).filter(w => w.length > 0), []);
    
    // Question indicators
    const questionWords = ['how', 'what', 'why', 'when', 'where', 'who', 'which', 'can', 'could', 'should', 'would', 'will'];
    const hasQuestionWord = safeAccess(() => questionWords.some(word => trimmed.includes(word)), false);
    const hasQuestionMark = safeAccess(() => input.includes('?'), false);
    const isShort = words.length < 10;
    
    // Writing indicators
    const writingIndicators = ['i think', 'in my opinion', 'firstly', 'secondly', 'in conclusion', 'however', 'therefore'];
    const hasWritingIndicators = safeAccess(() => writingIndicators.some(phrase => trimmed.includes(phrase)), false);
    const isLong = words.length > 20;
    
    // Feedback request indicators
    const feedbackIndicators = ['feedback', 'check', 'review', 'help', 'improve', 'better', 'correct'];
    const hasFeedbackRequest = safeAccess(() => feedbackIndicators.some(word => trimmed.includes(word)), false);
    
    // Prompt indicators
    const promptIndicators = ['write about', 'essay on', 'discuss', 'explain', 'describe', 'argue'];
    const hasPromptIndicators = safeAccess(() => promptIndicators.some(phrase => trimmed.includes(phrase)), false);
    
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
    if (hasWritingIndicators) scores.writing += 35;
    if (isLong) scores.writing += 20;
    
    // Feedback request scoring
    if (hasFeedbackRequest) scores.feedback_request += 40;
    
    // Prompt scoring
    if (hasPromptIndicators) scores.prompt += 30;
    
    // Context-based adjustments
    if (context.writingStage === 'initial' || context.writingStage === 'planning') {
      scores.prompt += 10;
      scores.question += 10;
    } else if (context.writingStage === 'writing') {
      scores.writing += 15;
      scores.feedback_request += 10;
    }
    
    // Find the highest scoring type
    const maxScore = Math.max(...Object.values(scores));
    const detectedType = Object.keys(scores).find(key => scores[key as keyof typeof scores] === maxScore) as keyof typeof scores;
    
    // Generate suggested operations
    const operations: AIOperation[] = [];
    
    switch (detectedType) {
      case 'question':
        operations.push({ type: 'question_analysis', priority: 1 });
        break;
      case 'writing':
        operations.push({ type: 'content_feedback', priority: 1 });
        operations.push({ type: 'grammar_check', priority: 2 });
        break;
      case 'feedback_request':
        operations.push({ type: 'structure_analysis', priority: 1 });
        operations.push({ type: 'vocabulary_enhancement', priority: 2 });
        break;
      case 'prompt':
        operations.push({ type: 'content_feedback', priority: 1 });
        break;
    }
    
    return {
      type: detectedType,
      confidence: maxScore / 100,
      suggestedOperations: operations
    };
  }
}

// Context management with safe operations
class ContextManager {
  static createSummary(messages: ConversationMessage[], content: string): ContextSummary {
    const wordCount = safeAccess(() => content.trim().split(/\s+/).filter(w => w.length > 0).length, 0);
    
    // Safe extraction of topics from messages
    const allText = safeMap(messages, msg => msg.content, []).join(' ').toLowerCase();
    const commonWords = safeAccess(() => {
      const words = allText.match(/\b\w{4,}\b/g) || [];
      const frequency: { [key: string]: number } = {};
      words.forEach(word => {
        if (!['this', 'that', 'with', 'have', 'will', 'from', 'they', 'been', 'were', 'said', 'each', 'which', 'their', 'time', 'about'].includes(word)) {
          frequency[word] = (frequency[word] || 0) + 1;
        }
      });
      return Object.keys(frequency)
        .filter(word => frequency[word] > 1)
        .sort((a, b) => frequency[b] - frequency[a])
        .slice(0, 5);
    }, []);
    
    // Determine current stage
    let currentStage = 'initial';
    if (wordCount > 200) currentStage = 'writing';
    else if (wordCount > 50) currentStage = 'planning';
    
    // Safe extraction of progress notes
    const progressNotes = safeFilter(messages, msg => 
      msg.type === 'ai' && safeProp(msg.metadata, 'operations', []).includes('feedback'), []
    ).slice(-3).map(msg => msg.content.substring(0, 100) + '...');
    
    return {
      writingType: 'narrative', // Default fallback
      currentStage,
      wordCount,
      keyTopics: commonWords,
      studentLevel: 'intermediate',
      progressNotes,
      lastFeedbackType: 'general'
    };
  }
  
  static shouldCreateSummary(messages: ConversationMessage[]): boolean {
    return messages.length > 10;
  }
  
  static createContextSummaryMessage(summary: ContextSummary): ConversationMessage {
    return {
      id: `context_summary_${Date.now()}`,
      type: 'system',
      content: `Context Summary: ${summary.currentStage} stage, ${summary.wordCount} words written. Key topics: ${summary.keyTopics.join(', ')}.`,
      timestamp: new Date(),
      metadata: {
        operations: ['context_summary']
      }
    };
  }
}

// Response formatter with safe operations
class ResponseFormatter {
  static formatResponse(operations: AIOperation[], results: any[], context: ContextSummary): string {
    let response = `Great! I've analyzed your input. Here's what I found:\n\n`;
    
    // Safe processing of results
    safeMap(results, (result, index) => {
      const operation = operations[index];
      if (!operation || !result) return null;
      
      switch (operation.type) {
        case 'grammar_check':
          if (safeProp(result, 'corrections', []).length > 0) {
            const corrections = safeMap(result.corrections, (c: any) => `• ${c.message}`, []);
            response += `\n\n✏️ **Grammar Suggestions:**\n${corrections.join('\n')}`;
          }
          break;
          
        case 'vocabulary_enhancement':
          if (safeProp(result, 'suggestions', []).length > 0) {
            const suggestions = safeMap(result.suggestions, (s: any) => `• ${s.original} → ${s.improved}`, []);
            response += `\n\n📚 **Vocabulary Enhancements:**\n${suggestions.join('\n')}`;
          }
          break;
          
        case 'structure_analysis':
          if (safeProp(result, 'feedback', '')) {
            response += `\n\n📊 **Structure Analysis:**\n${result.feedback}`;
          }
          break;
          
        case 'content_feedback':
          if (safeProp(result, 'feedbackItems', []).length > 0) {
            const strengths = safeFilter(result.feedbackItems, (item: any) => item.type === 'praise', []);
            const improvements = safeFilter(result.feedbackItems, (item: any) => item.type === 'improvement', []);
            
            if (strengths.length > 0) {
              const strengthTexts = safeMap(strengths, (s: any) => `• ${s.text}`, []);
              response += `\n\n🌟 **Strengths:**\n${strengthTexts.join('\n')}`;
            }
            
            if (improvements.length > 0) {
              const improvementTexts = safeMap(improvements, (i: any) => `• ${i.text}`, []);
              response += `\n\n🎯 **Areas to Improve:**\n${improvementTexts.join('\n')}`;
            }
          }
          break;
      }
      return null;
    }, []);
    
    // Add encouraging closing
    if (context.currentStage !== 'complete') {
      response += `\n\nKeep up the great work! What would you like to focus on next?`;
    } else {
      response += `\n\nFantastic job completing your writing! 🎉`;
    }
    
    return response.trim();
  }
}

// Main Enhanced Coach Panel Component with safe operations
export const EnhancedCoachPanel: React.FC<EnhancedCoachPanelProps> = ({
  content,
  textType,
  onContentChange,
  onFeedbackReceived,
  className = ""
}) => {
  // State management with safe initialization
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [contextSummary, setContextSummary] = useState<ContextSummary | null>(null);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Auto-scroll to bottom with safe operation
  const scrollToBottom = useCallback(() => {
    safeAccess(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, undefined, 'Failed to scroll to bottom');
  }, []);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);
  
  // Update context summary when content or messages change
  useEffect(() => {
    const summary = safeAccess(() => ContextManager.createSummary(messages, content), null);
    setContextSummary(summary);
    
    // Add summary message if conversation is getting long
    if (ContextManager.shouldCreateSummary(messages) && 
        !safeAccess(() => messages.some(m => m.type === 'system' && m.content.includes('Context Summary')), false)) {
      if (summary) {
        const summaryMessage = ContextManager.createContextSummaryMessage(summary);
        setMessages(prev => [...prev, summaryMessage]);
      }
    }
  }, [messages, content]);
  
  // Send initial greeting with safe operation
  useEffect(() => {
    if (messages.length === 0) {
      const greetingMessage: ConversationMessage = {
        id: `greeting_${Date.now()}`,
        type: 'ai',
        content: `Hello! I'm your writing coach. I'm here to help you with your ${textType} writing. What would you like to work on today?`,
        timestamp: new Date(),
        metadata: {
          writingStage: 'initial',
          operations: ['greeting']
        }
      };
      setMessages([greetingMessage]);
    }
  }, [textType, messages.length]);
  
  // Handle sending message with safe operations
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
      // Analyze input safely
      const analysis = safeAccess(() => InputAnalyzer.analyzeInput(currentInput, {
        writingStage: contextSummary?.currentStage || 'initial',
        wordCount: contextSummary?.wordCount || 0,
        conversationHistory: messages
      }), {
        type: 'question' as const,
        confidence: 0.5,
        suggestedOperations: []
      });
      
      // Simulate AI response processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const aiResponse: ConversationMessage = {
        id: `ai_${Date.now()}`,
        type: 'ai',
        content: `I understand you're asking about ${analysis.type}. Let me help you with that! Based on your input, I suggest focusing on improving your writing structure and vocabulary.`,
        timestamp: new Date(),
        metadata: {
          inputType: analysis.type,
          confidence: analysis.confidence,
          operations: safeMap(analysis.suggestedOperations, op => op.type, [])
        }
      };
      
      setMessages(prev => [...prev, aiResponse]);
      
      if (onFeedbackReceived) {
        onFeedbackReceived({ type: analysis.type, confidence: analysis.confidence });
      }
      
    } catch (error) {
      console.error('Error processing message:', error);
      
      const errorMessage: ConversationMessage = {
        id: `error_${Date.now()}`,
        type: 'ai',
        content: 'I apologize, but I encountered an issue processing your request. Please try again or rephrase your question.',
        timestamp: new Date(),
        metadata: {
          operations: ['error_recovery']
        }
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  }, [currentInput, isProcessing, messages, contextSummary, onFeedbackReceived]);
  
  // Handle key press with safe operation
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);
  
  // Format message content safely
  const formatMessageContent = (content: string) => {
    const lines = safeAccess(() => content.split('\n'), []);
    return safeMap(lines, (line, index) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <div key={index} className="font-semibold text-gray-800 mt-3 mb-1">{line.slice(2, -2)}</div>;
      } else if (line.startsWith('• ')) {
        return <div key={index} className="ml-4 text-gray-700">{line}</div>;
      } else if (line.trim() === '') {
        return <div key={index} className="h-2"></div>;
      }
      return <div key={index} className="text-gray-700">{line}</div>;
    }, []);
  };
  
  // Get message icon safely
  const getMessageIcon = (message: ConversationMessage) => {
    if (message.type === 'user') return <User className="h-4 w-4" />;
    if (message.type === 'system') return <Brain className="h-4 w-4" />;
    
    const operations = safeProp(message.metadata, 'operations', []);
    if (operations.includes('analyzeQuestion')) return <BookOpen className="h-4 w-4" />;
    if (operations.includes('checkGrammarForEditor')) return <CheckCircle className="h-4 w-4" />;
    if (operations.includes('getNSWSelectiveFeedback')) return <Target className="h-4 w-4" />;
    
    return <Bot className="h-4 w-4" />;
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
        {safeMap(messages, (message) => (
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
              <div className={`p-3 rounded-lg ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : message.type === 'system'
                  ? 'bg-gray-100 text-gray-700 text-sm'
                  : 'bg-gray-100 text-gray-800'
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
                {safeAccess(() => message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), '')}
                {safeProp(message.metadata, 'operations', []).length > 0 && (
                  <span className="ml-2">
                    • {safeProp(message.metadata, 'operations', []).join(', ')}
                  </span>
                )}
              </div>
            </div>
          </div>
        ), [])}
        
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
        
        {contextSummary && (
          <div className="mt-2 text-xs text-gray-500">
            Stage: {contextSummary.currentStage} • Level: {contextSummary.studentLevel} • 
            {contextSummary.keyTopics.length > 0 && ` Topics: ${contextSummary.keyTopics.slice(0, 3).join(', ')}`}
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedCoachPanel;