import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MessageSquare, Sparkles, ChevronDown, ChevronUp, ThumbsUp, Lightbulb, HelpCircle, Target, AlertCircle, Star, Zap, Gift, Heart, X, Send, Bot, RefreshCw } from 'lucide-react';
import { getWritingFeedback } from '../lib/openai';
import AIErrorHandler from '../utils/errorHandling';
import { promptConfig } from '../config/prompts';
import './improved-layout.css';

interface CoachPanelProps {
  content: string;
  textType: string;
  assistanceLevel: string;
}

interface FeedbackItem {
  type: 'praise' | 'suggestion' | 'question' | 'challenge';
  area: string;
  text: string;
  exampleFromText?: string;
  suggestionForImprovement?: string;
}

interface StructuredFeedback {
  overallComment: string;
  feedbackItems: FeedbackItem[];
  focusForNextTime: string[];
}

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  questionType?: string;
  operation?: string;
  responseQuality?: 'high' | 'medium' | 'low' | 'fallback';
  nswSpecific?: boolean;
  conversationContext?: string;
}

// Enhanced question analysis and routing
interface QuestionAnalysis {
  type: 'vocabulary' | 'structure' | 'grammar' | 'content' | 'general';
  operation: string;
  confidence: number;
  keywords: string[];
}

const extractResponseText = (response: any, questionType: string, userQuestion: string): string => {
  // Handle different response formats from the backend
  if (typeof response === 'string') {
    return response;
  }
  
  if (response && typeof response === 'object') {
    // Handle NSW Selective feedback format
    if (response.overallComment && response.criteriaFeedback) {
      let nswResponse = response.overallComment + '\n\n';
      
      // Add specific NSW criteria feedback based on question type
      if (questionType === 'structure' && response.criteriaFeedback.textStructureAndOrganization) {
        const structureFeedback = response.criteriaFeedback.textStructureAndOrganization;
        nswResponse += `**Structure Guidance (NSW Band ${structureFeedback.band || 'Assessment'}):**\n`;
        if (structureFeedback.suggestions && structureFeedback.suggestions.length > 0) {
          nswResponse += structureFeedback.suggestions.slice(0, 2).join('\n') + '\n\n';
        }
      }
      
      if (questionType === 'vocabulary' && response.criteriaFeedback.languageFeaturesAndVocabulary) {
        const vocabFeedback = response.criteriaFeedback.languageFeaturesAndVocabulary;
        nswResponse += `**Vocabulary Enhancement (NSW Band ${vocabFeedback.band || 'Assessment'}):**\n`;
        if (vocabFeedback.suggestions && vocabFeedback.suggestions.length > 0) {
          nswResponse += vocabFeedback.suggestions.slice(0, 2).join('\n') + '\n\n';
        }
      }
      
      if (questionType === 'content' && response.criteriaFeedback.ideasAndContent) {
        const contentFeedback = response.criteriaFeedback.ideasAndContent;
        nswResponse += `**Content Development (NSW Band ${contentFeedback.band || 'Assessment'}):**\n`;
        if (contentFeedback.suggestions && contentFeedback.suggestions.length > 0) {
          nswResponse += contentFeedback.suggestions.slice(0, 2).join('\n') + '\n\n';
        }
      }
      
      // Add NSW-specific exam strategies if available
      if (response.examStrategies && response.examStrategies.length > 0) {
        nswResponse += `**NSW Selective Exam Tips:**\n`;
        nswResponse += response.examStrategies.slice(0, 2).join('\n');
      }
      
      return nswResponse;
    }
    
    // Handle specific question types with contextual responses
    if (questionType === 'vocabulary' && response.suggestions) {
      if (Array.isArray(response.suggestions)) {
        return `Here are some vocabulary suggestions for your ${textType} writing:\n\n` + 
               response.suggestions.slice(0, 3).map((s: any) => {
                 if (typeof s === 'object' && s.word && s.suggestion) {
                   return `• Instead of "${s.word}", try: ${s.suggestion}`;
                 }
                 return `• ${s}`;
               }).join('\n');
      }
    }
    
    if (questionType === 'structure' && response.structure) {
      return `For ${textType} writing structure:\n\n${response.structure}`;
    }
    
    if (questionType === 'grammar' && response.corrections) {
      if (Array.isArray(response.corrections) && response.corrections.length > 0) {
        return `Here are some grammar suggestions:\n\n` + 
               response.corrections.slice(0, 3).map((c: any) => `• ${c.suggestion || c.message || c}`).join('\n');
      }
    }
    
    // Fallback for general feedback
    if (response.feedbackItems && Array.isArray(response.feedbackItems) && response.feedbackItems.length > 0) {
      return response.feedbackItems[0].text || 'I have some specific feedback for your writing!';
    }
    
    // If it's an object but we can't extract meaningful text, provide a contextual response
    return generateContextualResponse(questionType, userQuestion);
  }
  
  return generateContextualResponse(questionType, userQuestion);
};

// Generate contextual responses based on question type and content
const generateContextualResponse = (questionType: string, userQuestion: string): string => {
  const responses = {
    vocabulary: [
      "Great question about vocabulary! For stronger word choices, try replacing simple words like 'good' with 'excellent' or 'outstanding'. What specific words would you like help improving?",
      "Vocabulary is key for NSW Selective success! Consider using more sophisticated words - instead of 'big', try 'enormous' or 'substantial'. Which part of your writing needs stronger vocabulary?",
      "Excellent vocabulary question! For narrative writing, use vivid action verbs and descriptive adjectives. For persuasive writing, use powerful words that convince your reader."
    ],
    structure: [
      "Structure is crucial for NSW Selective writing! For narratives, use: engaging opening → rising action → climax → resolution. For persuasive essays: introduction with thesis → 3 body paragraphs with evidence → strong conclusion.",
      "Great structure question! Make sure each paragraph has one main idea, and use connecting words like 'furthermore', 'however', and 'in conclusion' to link your ideas smoothly.",
      "NSW Selective examiners love clear structure! Start with a hook, develop your ideas logically, and end with impact. What type of writing are you working on?"
    ],
    grammar: [
      "Grammar accuracy is important for NSW Selective! Check your sentence variety - mix short and long sentences. Make sure you're using correct punctuation, especially commas and apostrophes.",
      "Good grammar question! For NSW Selective, focus on: subject-verb agreement, consistent tense, and varied sentence beginnings. Read your work aloud to catch errors.",
      "Grammar tip for NSW success: Use complex sentences with subordinate clauses, but make sure they're clear. Avoid run-on sentences and sentence fragments."
    ],
    content: [
      "Content development is key for NSW Selective! Add specific details, examples, and evidence to support your main ideas. Show, don't just tell - use sensory details and dialogue.",
      "Excellent content question! For narratives, develop your characters' emotions and motivations. For persuasive writing, include facts, statistics, or expert opinions to strengthen your arguments.",
      "NSW Selective values original thinking! Develop your ideas deeply rather than just listing them. Ask yourself 'why' and 'how' to add depth to your content."
    ],
    general: [
      "I'm here to help with your NSW Selective writing preparation! Ask me about specific aspects like vocabulary, structure, grammar, or content development.",
      "Great to see you working on your writing! For NSW Selective success, focus on clear structure, sophisticated vocabulary, and well-developed ideas. What specific area would you like help with?",
      "NSW Selective writing requires strong skills across all areas. I can help you with planning, drafting, vocabulary choices, grammar, and exam strategies. What's your main concern right now?"
    ]
  };
  
  const typeResponses = responses[questionType as keyof typeof responses] || responses.general;
  const randomIndex = Math.floor(Math.random() * typeResponses.length);
  return typeResponses[randomIndex];
};

// Generate intelligent local responses based on content analysis
const generateIntelligentLocalResponse = (question: string, analysis: QuestionAnalysis, content: string, textType: string): any => {
  const wordCount = content.trim().split(/\s+/).filter(w => w.length > 0).length;
  const lowerQuestion = question.toLowerCase();
  
  // Analyze the content to provide specific feedback
  const hasDialogue = content.includes('"') || content.includes("'");
  const hasGoodOpening = content.length > 50 && !content.toLowerCase().startsWith('once upon a time');
  const paragraphCount = content.split('\n\n').filter(p => p.trim().length > 0).length;
  
  // Provide specific responses based on question type and content analysis
  switch (analysis.type) {
    case 'vocabulary':
      if (lowerQuestion.includes('better word') || lowerQuestion.includes('synonym')) {
        return {
          suggestions: [
            { word: 'good', suggestion: 'excellent, outstanding, remarkable' },
            { word: 'said', suggestion: 'exclaimed, declared, whispered' },
            { word: 'went', suggestion: 'traveled, journeyed, ventured' },
            { word: 'big', suggestion: 'enormous, massive, gigantic' },
            { word: 'nice', suggestion: 'delightful, pleasant, wonderful' }
          ]
        };
      }
      return `For your ${textType} writing, try using more sophisticated vocabulary! Instead of simple words like 'good', 'big', or 'nice', use words like 'excellent', 'enormous', or 'delightful'. This will make your writing more engaging for NSW Selective assessors.`;
      
    case 'structure':
      if (paragraphCount === 1) {
        return `I notice your ${textType} is currently in one paragraph. For NSW Selective success, break it into 3-4 paragraphs: 1) Engaging introduction, 2-3) Body paragraphs developing your story/argument, 4) Strong conclusion. This will make your writing much clearer!`;
      }
      return `Your ${textType} structure looks good with ${paragraphCount} paragraphs! For NSW Selective, make sure each paragraph has one main idea and flows smoothly to the next. Use transition words like 'furthermore', 'however', and 'in conclusion'.`;
      
    case 'grammar':
      return `For NSW Selective grammar success: 1) Vary your sentence beginnings, 2) Mix short and long sentences, 3) Use correct punctuation, 4) Keep consistent tense throughout. Read your work aloud to catch any errors!`;
      
    case 'content':
      if (wordCount < 100) {
        return `Your ${textType} is off to a good start with ${wordCount} words! For NSW Selective, aim for 250-300 words. Add more specific details, examples, and descriptions to develop your ideas fully.`;
      }
      if (textType === 'narrative' && !hasDialogue) {
        return `Great ${textType} development with ${wordCount} words! Consider adding some dialogue to bring your characters to life. For example: "I can't believe this is happening!" she exclaimed.`;
      }
      return `Excellent content development with ${wordCount} words! Your ${textType} shows good understanding. Keep developing your ideas with specific examples and vivid details.`;
      
    default:
      if (wordCount === 0) {
        return `Ready to start your ${textType}? Begin with an engaging opening that hooks your reader. For narratives, try starting in the middle of action. For persuasive writing, start with a thought-provoking question or statistic.`;
      }
      if (wordCount < 50) {
        return `Good start on your ${textType}! You have ${wordCount} words so far. Keep developing your ideas - aim for at least 250 words for NSW Selective standards.`;
      }
      return `Your ${textType} is developing well with ${wordCount} words! ${hasGoodOpening ? 'Great opening!' : 'Consider strengthening your opening.'} ${hasDialogue && textType === 'narrative' ? 'Nice use of dialogue!' : ''} Keep building your ideas with specific details and examples.`;
  }
};
export function CoachPanel({ content, textType, assistanceLevel }: CoachPanelProps) {
  const [structuredFeedback, setStructuredFeedback] = useState<StructuredFeedback | null>(null);
  const [feedbackHistory, setFeedbackHistory] = useState<FeedbackItem[]>([]);
  const [localAssistanceLevel, setLocalAssistanceLevel] = useState<string>(assistanceLevel);
  const [hiddenFeedbackItems, setHiddenFeedbackItems] = useState<number[]>([]);
  const [isOverallCommentHidden, setIsOverallCommentHidden] = useState(false);
  const [isFocusForNextTimeHidden, setIsFocusForNextTimeHidden] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastProcessedContent, setLastProcessedContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Enhanced chat functionality state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [showPrompts, setShowPrompts] = useState(false);
  const [conversationContext, setConversationContext] = useState<ChatMessage[]>([]);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

  // Enhanced question analysis function
  const analyzeUserQuestion = useCallback((question: string): QuestionAnalysis => {
    const lowerQuestion = question.toLowerCase();
    
    // Vocabulary-related keywords
    const vocabularyKeywords = ['word', 'vocabulary', 'synonym', 'better word', 'stronger word', 'replace', 'enhance', 'improve word'];
    const vocabularyScore = vocabularyKeywords.filter(keyword => lowerQuestion.includes(keyword)).length;
    
    // Structure-related keywords
    const structureKeywords = ['structure', 'organize', 'paragraph', 'introduction', 'conclusion', 'flow', 'transition', 'order'];
    const structureScore = structureKeywords.filter(keyword => lowerQuestion.includes(keyword)).length;
    
    // Grammar-related keywords
    const grammarKeywords = ['grammar', 'spelling', 'punctuation', 'sentence', 'tense', 'correct'];
    const grammarScore = grammarKeywords.filter(keyword => lowerQuestion.includes(keyword)).length;
    
    // Content-related keywords
    const contentKeywords = ['idea', 'content', 'topic', 'theme', 'argument', 'evidence', 'example', 'detail'];
    const contentScore = contentKeywords.filter(keyword => lowerQuestion.includes(keyword)).length;
    
    // Determine the most likely question type
    const scores = {
      vocabulary: vocabularyScore,
      structure: structureScore,
      grammar: grammarScore,
      content: contentScore
    };
    
    const maxScore = Math.max(...Object.values(scores));
    const questionType = Object.keys(scores).find(key => scores[key] === maxScore) || 'general';
    
    // Map question types to operations
    const operationMap = {
      vocabulary: 'enhanceVocabulary',
      structure: 'getWritingStructure',
      grammar: 'checkGrammarAndSpelling',
      content: 'getSpecializedTextTypeFeedback',
      general: 'getWritingFeedback'
    };
    
    return {
      type: questionType as QuestionAnalysis['type'],
      operation: operationMap[questionType],
      confidence: maxScore > 0 ? maxScore / vocabularyKeywords.length : 0.5,
      keywords: [vocabularyKeywords, structureKeywords, grammarKeywords, contentKeywords].flat().filter(keyword => lowerQuestion.includes(keyword))
    };
  }, []);

  // Enhanced API call routing function
  const routeQuestionToOperation = useCallback(async (question: string, analysis: QuestionAnalysis) => {
    try {
      console.log(`[DEBUG] Routing question: "${question}" (type: ${analysis.type})`);
      
      // Try to get real AI response first
      const response = await fetch('/.netlify/functions/ai-operations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: analysis.operation,
          text: content,
          textType: textType,
          question: question,
          conversationContext: conversationContext.map(msg => ({ role: msg.isUser ? 'user' : 'assistant', content: msg.text }))
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('AI operation failed:', errorData);
        throw new Error(errorData.message || 'Failed to get AI response');
      }

      const data = await response.json();
      console.log('[DEBUG] AI response data:', data);
      return { data, responseQuality: 'high' };

    } catch (apiError) {
      console.error('API call failed, falling back to local response:', apiError);
      // Fallback to local intelligent response if API fails
      return { data: generateIntelligentLocalResponse(question, analysis, content, textType), responseQuality: 'fallback' };
    }
  }, [content, textType, conversationContext]);

  const handleSendMessage = useCallback(async (question: string, operation?: string, questionType?: string) => {
    if (!question.trim() && !operation) return;

    const newUserMessage: ChatMessage = {
      id: Date.now().toString(),
      text: question,
      isUser: true,
      timestamp: new Date(),
      questionType: questionType,
      operation: operation,
    };

    setChatMessages((prevMessages) => [...prevMessages, newUserMessage]);
    setChatInput('');
    setIsChatLoading(true);
    setShowPrompts(false); // Hide prompts after sending a message

    try {
      const analysis = analyzeUserQuestion(question);
      const { data: aiResponse, responseQuality } = await routeQuestionToOperation(question, analysis);

      const assistantMessageText = extractResponseText(aiResponse, analysis.type, question);

      setChatMessages((prevMessages) => [
        ...prevMessages,
        {
          id: Date.now().toString() + '-ai',
          text: assistantMessageText,
          isUser: false,
          timestamp: new Date(),
          questionType: analysis.type,
          operation: analysis.operation,
          responseQuality: responseQuality,
          nswSpecific: aiResponse.criteriaFeedback ? true : false,
          conversationContext: aiResponse.conversationContext || undefined,
        },
      ]);

      // Update conversation context for future turns
      setConversationContext((prevContext) => [
        ...prevContext,
        { role: 'user', content: question },
        { role: 'assistant', content: assistantMessageText }
      ]);

    } catch (err) {
      console.error('Error sending message:', err);
      setChatMessages((prevMessages) => [
        ...prevMessages,
        {
          id: Date.now().toString() + '-error',
          text: 'Oops! I encountered an error. Please try again or rephrase your question.',
          isUser: false,
          timestamp: new Date(),
          responseQuality: 'fallback',
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  }, [content, textType, analyzeUserQuestion, routeQuestionToOperation, conversationContext]);

  const handleQuickPrompt = useCallback((promptText: string, operation?: string, questionType?: string) => {
    handleSendMessage(promptText, operation, questionType);
  }, [handleSendMessage]);

  useEffect(() => {
    if (chatMessagesEndRef.current) {
      chatMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Initial feedback generation (if content changes or on first load)
  useEffect(() => {
    const generateFeedback = async () => {
      if (content && content !== lastProcessedContent && !isLoading) {
        setIsLoading(true);
        setError(null);
        try {
          const response = await fetch('/.netlify/functions/ai-operations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              operation: 'getWritingFeedback',
              text: content,
              textType: textType,
              assistanceLevel: localAssistanceLevel,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to get initial feedback');
          }

          const data: StructuredFeedback = await response.json();
          setStructuredFeedback(data);
          setFeedbackHistory(data.feedbackItems);
          setLastProcessedContent(content);
        } catch (err: any) {
          console.error('Error fetching initial feedback:', err);
          setError(err.message || 'Failed to load initial feedback. Please try again.');
          // Fallback to a generic message if API fails
          setStructuredFeedback({
            overallComment: 'I am ready to help you improve your writing! Please ask me a question or use one of the prompts below.',
            feedbackItems: [],
            focusForNextTime: [],
          });
        } finally {
          setIsLoading(false);
        }
      }
    };

    generateFeedback();
  }, [content, textType, localAssistanceLevel, lastProcessedContent, isLoading]);

  const toggleFeedbackItem = (index: number) => {
    setHiddenFeedbackItems((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const toggleOverallComment = () => {
    setIsOverallCommentHidden((prev) => !prev);
  };

  const toggleFocusForNextTime = () => {
    setIsFocusForNextTimeHidden((prev) => !prev);
  };

  const getIconForFeedbackType = (type: FeedbackItem['type']) => {
    switch (type) {
      case 'praise':
        return <ThumbsUp size={18} className="text-green-500" />;
      case 'suggestion':
        return <Lightbulb size={18} className="text-blue-500" />;
      case 'question':
        return <HelpCircle size={18} className="text-yellow-500" />;
      case 'challenge':
        return <Target size={18} className="text-red-500" />;
      default:
        return <Sparkles size={18} className="text-gray-500" />;
    }
  };

  const getIconForQuestionType = (type: QuestionAnalysis['type']) => {
    switch (type) {
      case 'vocabulary':
        return <Zap size={18} className="text-purple-500" />;
      case 'structure':
        return <Target size={18} className="text-orange-500" />;
      case 'grammar':
        return <Star size={18} className="text-green-500" />;
      case 'content':
        return <Gift size={18} className="text-pink-500" />;
      default:
        return <Sparkles size={18} className="text-gray-500" />;
    }
  };

  const getMessageIcon = (isUser: boolean, responseQuality?: ChatMessage['responseQuality']) => {
    if (isUser) return null; // No icon for user messages
    if (responseQuality === 'fallback') return <AlertCircle size={18} className="text-red-500 mr-2" />;
    if (responseQuality === 'high') return <Sparkles size={18} className="text-blue-500 mr-2" />;
    return <Bot size={18} className="text-gray-500 mr-2" />;
  };

  const getMessageClass = (isUser: boolean, responseQuality?: ChatMessage['responseQuality']) => {
    let baseClass = "p-3 rounded-lg max-w-[80%]";
    if (isUser) {
      baseClass += " bg-blue-500 text-white self-end";
    } else {
      baseClass += " bg-gray-200 text-gray-800 self-start";
      if (responseQuality === 'fallback') {
        baseClass += " border border-red-400";
      }
    }
    return baseClass;
  };

  return (
    <div className="coach-panel-container">
      <div className="coach-panel-header">
        <Sparkles size={24} className="header-icon" />
        <h2>AI Writing Coach</h2>
      </div>

      {isLoading && (
        <div className="loading-indicator">
          <RefreshCw size={20} className="animate-spin mr-2" /> Generating feedback...
        </div>
      )}

      {error && (
        <div className="error-message">
          <AlertCircle size={20} className="text-red-500 mr-2" /> {error}
        </div>
      )}

      {structuredFeedback && (
        <div className="feedback-section">
          <div className="feedback-toggle" onClick={toggleOverallComment}>
            <h3>Overall Feedback</h3>
            {isOverallCommentHidden ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </div>
          {!isOverallCommentHidden && (
            <p className="overall-comment">{structuredFeedback.overallComment}</p>
          )}

          {structuredFeedback.feedbackItems.length > 0 && (
            <> 
              <div className="feedback-items-list">
                {structuredFeedback.feedbackItems.map((item, index) => (
                  <div key={index} className="feedback-item">
                    <div className="feedback-item-header" onClick={() => toggleFeedbackItem(index)}>
                      {getIconForFeedbackType(item.type)}
                      <h4>{item.area}</h4>
                      {hiddenFeedbackItems.includes(index) ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                    </div>
                    {!hiddenFeedbackItems.includes(index) && (
                      <div className="feedback-item-content">
                        <p>{item.text}</p>
                        {item.exampleFromText && (
                          <p className="example-text">Example from your text: "{item.exampleFromText}"</p>
                        )}
                        {item.suggestionForImprovement && (
                          <p className="suggestion-text">Suggestion: {item.suggestionForImprovement}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {structuredFeedback.focusForNextTime.length > 0 && (
            <div className="feedback-toggle" onClick={toggleFocusForNextTime}>
              <h3>Focus for Next Time</h3>
              {isFocusForNextTimeHidden ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
            </div>
          )}
          {!isFocusForNextTimeHidden && structuredFeedback.focusForNextTime.length > 0 && (
            <ul className="focus-list">
              {structuredFeedback.focusForNextTime.map((focus, index) => (
                <li key={index}>{focus}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="chat-section">
        <div className="chat-messages">
          {chatMessages.map((message) => (
            <div key={message.id} className={`chat-message ${getMessageClass(message.isUser, message.responseQuality)}`}>
              <div className="flex items-center">
                {!message.isUser && getMessageIcon(message.isUser, message.responseQuality)}
                <span>{message.text}</span>
              </div>
              <span className="timestamp">{message.timestamp.toLocaleTimeString()}</span>
            </div>
          ))}
          {isChatLoading && (
            <div className="chat-message bg-gray-200 text-gray-800 self-start p-3 rounded-lg max-w-[80%]">
              <div className="flex items-center">
                <Bot size={18} className="text-gray-500 mr-2" />
                <span>Typing...</span>
              </div>
            </div>
          )}
          <div ref={chatMessagesEndRef} />
        </div>

        <div className="chat-input-area">
          {showPrompts && (
            <div className="quick-prompts">
              {promptConfig.map((prompt, index) => (
                <button
                  key={index}
                  className="quick-prompt-button"
                  onClick={() => handleQuickPrompt(prompt.text, prompt.operation, prompt.questionType)}
                >
                  {getIconForQuestionType(prompt.questionType as QuestionAnalysis['type'])}
                  {prompt.label}
                </button>
              ))}
            </div>
          )}
          <div className="input-container">
            <button className="toggle-prompts-button" onClick={() => setShowPrompts(!showPrompts)}>
              {showPrompts ? <X size={20} /> : <Sparkles size={20} />}
            </button>
            <input
              type="text"
              placeholder="Ask me a question about your writing..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSendMessage(chatInput);
                }
              }}
              className="chat-input"
            />
            <button
              className="send-button"
              onClick={() => handleSendMessage(chatInput)}
              disabled={!chatInput.trim() || isChatLoading}
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
