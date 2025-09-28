import React, { useState, useEffect, useRef } from "react";
import { CoachProvider } from "./CoachProvider";
import { RubricPanel } from "./RubricPanel";
import { VocabCoach } from "./VocabCoach";
import { ReportModal } from "./ReportModal";
import { VocabSuggestionPanel } from "./VocabSuggestionPanel";
import { SentenceImprovementPanel } from "./SentenceImprovementPanel";
import { FeedbackChat } from "./FeedbackChat";
import type { DetailedFeedback, LintFix } from "../types/feedback";
import { generateChatResponse, checkOpenAIConnectionStatus } from '../lib/openai';
import { detectWordThreshold, splitParas } from '../lib/paragraphDetection';
import {
  ExternalLink, FileText, MessageSquare, BarChart3, BookOpen, TrendingUp, Bot, User, Lightbulb, Sparkles, ArrowRight, RefreshCcw, ChevronDown, ChevronUp, Loader,
  Zap, Layers, Palette, CheckCircle, AlertCircle
} from 'lucide-react';

// Import the new feedback interfaces from EnhancedWritingLayout
import type { IdeasFeedback, StructureFeedback, LanguageFeedback, GrammarFeedback } from './EnhancedWritingLayout';

type Props = {
  analysis: DetailedFeedback | null;
  onApplyFix: (fix: LintFix) => void;
  content?: string;
  textType?: string;
  onWordSelect?: (word: string) => void;
  // New props for enhanced feedback
  ideasFeedback?: IdeasFeedback;
  structureFeedback?: StructureFeedback;
  languageFeedback?: LanguageFeedback;
  grammarFeedback?: GrammarFeedback;
};

interface FeedbackMessage {
  id: string;
  text: string;
  timestamp: Date;
  isUser: boolean;
  isTyping?: boolean;
  isFeedback?: boolean;
}

export function TabbedCoachPanel({
  analysis,
  onApplyFix,
  content = "",
  textType = "narrative",
  onWordSelect = () => {},
  // Destructure new feedback props
  ideasFeedback,
  structureFeedback,
  languageFeedback,
  grammarFeedback,
}: Props) {
  const [tab, setTab] = useState<"coach" | "toolkit" | "ideas" | "structure" | "language" | "grammar">("coach");
  const [showFullReport, setShowFullReport] = useState(false);
  const [expandedPhases, setExpandedPhases] = useState<{ [key: string]: boolean }>({});
  const [chatMessages, setChatMessages] = useState<FeedbackMessage[]>([
    {
      id: '1',
      text: 'Hi I\'m your AI Writing Buddy! 🤖 I\'m here to help you write amazing stories. Ask me anything about writing, or just start typing and I\'ll give you feedback!',
      timestamp: new Date(),
      isUser: false
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  
  // Automatic feedback state
  const [isAITyping, setIsAITyping] = useState(false);
  const [lastFeedbackTime, setLastFeedbackTime] = useState<number>(0);
  const [feedbackCount, setFeedbackCount] = useState<number>(0);
  const [previousContent, setPreviousContent] = useState<string>('');
  
  // Refs for content monitoring
  const contentMonitorRef = useRef<string>('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Create a default analysis object to prevent undefined errors
  const defaultAnalysis: DetailedFeedback = {
    overallScore: 75,
    criteria: {
      ideasContent: {
        score: 4,
        weight: 30,
        strengths: [
          { text: "Creative and engaging story concept" },
          { text: "Good character development potential" }
        ],
        improvements: [
          { 
            issue: "Add more descriptive details",
            suggestion: "Include sensory details to help readers visualize the scene",
            evidence: { text: "The room was dark" }
          }
        ]
      },
      structureOrganization: {
        score: 3,
        weight: 25,
        strengths: [
          { text: "Clear beginning established" },
          { text: "Logical sequence of events" }
        ],
        improvements: [
          {
            issue: "Develop the middle and ending",
            suggestion: "Add more conflict and resolution to create a complete story arc",
            evidence: { text: "Story needs more development" }
          }
        ]
      },
      languageVocab: {
        score: 4,
        weight: 25,
        strengths: [
          { text: "Good use of descriptive language" },
          { text: "Appropriate vocabulary for audience" }
        ],
        improvements: [
          {
            issue: "Vary sentence structure",
            suggestion: "Mix short and long sentences for better flow",
            evidence: { text: "All sentences are similar length" }
          }
        ]
      },
      spellingPunctuationGrammar: {
        score: 4,
        weight: 20,
        strengths: [
          { text: "Generally accurate spelling" },
          { text: "Correct punctuation usage" }
        ],
        improvements: [
          {
            issue: "Check for minor errors",
            suggestion: "Proofread carefully for small mistakes",
            evidence: { text: "Few minor errors detected" }
          }
        ]
      }
    },
    grammarCorrections: [
      {
        original: "The door was opened by me",
        replacement: "I opened the door",
        explanation: "Use active voice for stronger writing",
        position: 0,
        type: "grammar"
      }
    ],
    vocabularyEnhancements: [
      {
        original: "big",
        replacement: "enormous",
        explanation: "Use more specific adjectives",
        position: 0,
        type: "vocabulary"
      }
    ],
    id: `assessment-${Date.now()}`,
    assessmentId: `nsw-${Date.now()}`
  };

  // Use the provided analysis or fall back to default
  const safeAnalysis = analysis || defaultAnalysis;

  const handleWordReplace = (oldWord: string, newWord: string, position: number) => {
    console.log(`Replace "${oldWord}" with "${newWord}" at position ${position}`);
    // In a real app, this would update the content state in the parent component
  };

  const handleAddToPersonalList = (word: string) => {
    console.log(`Added "${word}" to personal word list`);
    // In a real app, this would save to a personal word list
  };

  const handleSentenceImprovement = (original: string, improved: string) => {
    console.log(`Improve sentence: "${original}" -> "${improved}"`);
    
    // Switch to Coach tab to show the feedback
    setTab('coach');
    
    // Add a chat message about the improvement
    const improvementMessage: FeedbackMessage = {
      id: Date.now().toString(),
      text: `💡 **Sentence Improvement Applied!**\n\n**Original:** "${original}"\n\n**Improved:** "${improved}"\n\nThis enhancement makes your writing more sophisticated and engaging! Keep up the great work! 🎯✨`,
      timestamp: new Date(),
      isUser: false,
      isFeedback: true
    };
    
    setChatMessages(prev => [...prev, improvementMessage]);
    
    // Scroll to bottom after a brief delay to ensure the message is rendered
    setTimeout(() => {
      if (chatEndRef.current) {
        chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleContentChange = (newContent: string) => {
    console.log(`Content updated: ${newContent.length} characters`);
    // In a real app, this would update the content state in the parent component
  };

  // Content monitoring effect for automatic feedback
  useEffect(() => {
    const safeContent = content || '';
    const safePreviousContent = contentMonitorRef.current || '';
    
    if (safeContent !== safePreviousContent) {
      contentMonitorRef.current = safeContent;
      setPreviousContent(safePreviousContent);

      // Trigger feedback analysis with safe values
      analyzeFeedbackTrigger(safePreviousContent, safeContent);
    }
  }, [content]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Coach tip function
  const coachTip = async (paragraph: string) => {
    try {
      if (!paragraph || typeof paragraph !== 'string' || paragraph.trim().length === 0) {
        throw new Error('Invalid paragraph provided');
      }

      const response = await generateChatResponse({
        userMessage: `Please provide a brief, encouraging writing tip for this paragraph: "${paragraph}". Keep it under 50 words and focus on one specific improvement.`,
        textType: textType,
        currentContent: paragraph,
        wordCount: paragraph.trim().split(/\s+/).length,
        context: JSON.stringify({ type: 'coach_tip' })
      });
      
      return { tip: response };
    } catch (error) {
      console.error('Coach tip error:', error);
      throw error;
    }
  };

  // Analyze content changes for feedback triggers
  const analyzeFeedbackTrigger = async (prevContent: string, newContent: string) => {
    try {
      const safePrevContent = prevContent || '';
      const safeNewContent = newContent || '';
      
      if (!safeNewContent || safeNewContent.trim().length === 0) {
        return;
      }

      const wordCount = safeNewContent.trim().split(/\s+/).filter(word => word.length > 0).length;
      if (wordCount < 15) {
        return; // Minimum threshold
      }

      // Prevent too frequent feedback
      const now = Date.now();
      if (now - lastFeedbackTime < 8000) { // 8 second cooldown
        return;
      }

      // Check for word threshold triggers
      const thresholdResult = detectWordThreshold(safePrevContent, safeNewContent, 20);
      if (thresholdResult) {
        await provideFeedback(thresholdResult.text, thresholdResult.trigger);
        return;
      }

      // Check for new paragraphs
      const prevParas = splitParas(safePrevContent);
      const newParas = splitParas(safeNewContent);
      
      if (newParas.length > prevParas.length) {
        const completedParagraph = newParas[newParas.length - 2];
        if (completedParagraph && completedParagraph.trim().split(/\s+/).length >= 20) {
          await provideFeedback(completedParagraph, 'paragraph_completed');
          return;
        }
      }

      // Check for significant content addition (every 30 words)
      const prevWords = safePrevContent.trim() ? safePrevContent.trim().split(/\s+/).length : 0;
      const newWords = safeNewContent.trim() ? safeNewContent.trim().split(/\s+/).length : 0;
      const wordDifference = newWords - prevWords;

      if (wordDifference >= 30 && newWords >= 50) {
        const currentParagraph = newParas[newParas.length - 1] || safeNewContent.slice(-200);
        await provideFeedback(currentParagraph, 'progress_milestone');
      }

    } catch (error) {
      console.error("Content analysis error:", error);
    }
  };

  // Provide automatic feedback
  const provideFeedback = async (text: string, trigger: string) => {
    try {
      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return;
      }

      setIsAITyping(true);
      setLastFeedbackTime(Date.now());

      const typingMessage: FeedbackMessage = {
        id: 'typing-' + Date.now(),
        text: '🤖 Reading your writing...',
        timestamp: new Date(),
        isUser: false,
        isTyping: true,
        isFeedback: true
      };
      setChatMessages(prev => [...prev, typingMessage]);

      try {
        const res = await coachTip(text);
        
        // Remove typing indicator and add real response
        setChatMessages(prev => {
          const withoutTyping = prev.filter(msg => !msg.isTyping);
          return [...withoutTyping, {
            id: 'coach-' + Date.now(),
            text: `✨ ${res.tip || getVariedFallbackTip(text, feedbackCount)}`,
            timestamp: new Date(),
            isUser: false,
            isFeedback: true
          }];
        });

        setFeedbackCount(prev => prev + 1);
      } catch (error) {
        // Remove typing indicator and add fallback response
        setChatMessages(prev => {
          const withoutTyping = prev.filter(msg => !msg.isTyping);
          return [...withoutTyping, {
            id: 'fallback-' + Date.now(),
            text: `✨ ${getVariedFallbackTip(text, feedbackCount)}`,
            timestamp: new Date(),
            isUser: false,
            isFeedback: true
          }];
        });

        setFeedbackCount(prev => prev + 1);
      }
    } catch (error) {
      console.error("Provide feedback error:", error);
    } finally {
      setIsAITyping(false);
    }
  };

  // Get varied fallback tips
  const getVariedFallbackTip = (text: string, count: number): string => {
    const tips = [
      "Great progress! Try adding more descriptive details to paint a picture for your readers. 🎨",
      "Nice work! Consider adding dialogue to bring your characters to life. What might they say? 💬",
      "You're doing well! Think about using stronger verbs to make your action more exciting. ⚡",
      "Good writing! Try to show emotions through actions rather than just telling us how characters feel. 😊",
      "Keep going! Add some sensory details - what can your character see, hear, or smell? 👃",
      "Excellent! Consider varying your sentence lengths to create better rhythm in your writing. 🎵",
      "Well done! Think about adding a surprising detail that will hook your reader's attention. 🎣",
      "Great job! Try using more specific nouns instead of general ones to be more precise. 🎯"
    ];
    
    return tips[count % tips.length];
  };

  const togglePhase = (phaseId: string) => {
    setExpandedPhases(prev => ({
      ...prev,
      [phaseId]: !prev[phaseId]
    }));
  };

  const handleSendMessage = async () => {
    const message = newMessage.trim();
    if (!message) return;

    // Add user message
    const userMessage: FeedbackMessage = {
      id: 'user-' + Date.now(),
      text: message,
      timestamp: new Date(),
      isUser: true
    };

    setChatMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsAITyping(true);

    // Add typing indicator
    const typingMessage: FeedbackMessage = {
      id: 'typing-' + Date.now(),
      text: '🤖 Thinking...',
      timestamp: new Date(),
      isUser: false,
      isTyping: true
    };
    setChatMessages(prev => [...prev, typingMessage]);

    try {
      const response = await generateChatResponse({
        userMessage: message,
        textType: textType,
        currentContent: content,
        wordCount: content.split(' ').filter(w => w.length > 0).length,
        context: JSON.stringify({ type: 'user_question' })
      });

      // Remove typing indicator and add real response
      setChatMessages(prev => {
        const withoutTyping = prev.filter(msg => !msg.isTyping);
        return [...withoutTyping, {
          id: 'ai-' + Date.now(),
          text: response || generateAIResponse(message),
          timestamp: new Date(),
          isUser: false
        }];
      });
    } catch (error) {
      console.error('AI response error:', error);
      
      // Remove typing indicator and add fallback response
      setChatMessages(prev => {
        const withoutTyping = prev.filter(msg => !msg.isTyping);
        return [...withoutTyping, {
          id: 'fallback-' + Date.now(),
          text: generateAIResponse(message),
          timestamp: new Date(),
          isUser: false
        }];
      });
    } finally {
      setIsAITyping(false);
    }
  };

  const generateAIResponse = (userMessage: string): string => {
    const responses = [
      "That's a great question! 🌟 To make your paragraph even more engaging, try adding a few descriptive words. For example, describe the sounds of the whispering or the colors of the flickering light. This will help readers feel more immersed in your magical forest! Keep it up!",
      "What a captivating start! 🎭 To make your paragraph even more engaging, try adding a few descriptive words. For example, describe the sounds of the whispering or the colors of the flickering light. This will help readers feel more immersed in your magical forest! Keep it up!",
      "I love your creativity! ✨ Try to identify sentences in your writing that could be improved using these techniques!",
      "Great work! 📝 Remember to vary your sentence length to keep readers engaged. Mix short, punchy sentences with longer, more descriptive ones.",
      "Excellent progress! 🚀 Don't forget to use the 'show, don't tell' technique - instead of saying 'he was scared', describe his trembling hands or racing heart."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };
  
  // Enhanced Tab Component with better styling and accessibility
  const Tab = ({ 
    id, 
    label, 
    icon: Icon,
    description 
  }: { 
    id: "coach" | "toolkit" | "ideas" | "structure" | "language" | "grammar"; 
    label: string;
    icon: React.ComponentType<any>;
    description?: string;
  }) => (
    <button
      className={`flex items-center justify-center space-x-2 px-3 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 flex-1 min-h-[44px] ${
        tab === id 
          ? "bg-white text-purple-700 shadow-lg border-2 border-purple-200 transform scale-105" 
          : "bg-purple-500/20 text-white/90 hover:bg-purple-500/30 hover:text-white hover:scale-102"
      }`}
      onClick={() => setTab(id)}
      title={description || label}
      aria-label={`${label} tab${description ? `: ${description}` : ''}`}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="text-center font-extrabold leading-tight">{label}</span>
    </button>
  );

  return (
    <>
      <div className="h-full flex flex-col rounded-2xl bg-gradient-to-br from-purple-600 via-purple-700 to-fuchsia-600 text-white shadow-xl">
        {/* Enhanced Tab Navigation - Two-Row Grouped Layout */}
        <div className="p-3 border-b border-white/20">
          {/* Primary Coaching Features - Row 1 */}
          <div className="grid grid-cols-3 gap-1 mb-2">
            <Tab 
              id="coach" 
              label="Coach" 
              icon={MessageSquare} 
              description="AI Writing Buddy chat and real-time feedback"
            />
            <Tab 
              id="ideas" 
              label="Ideas" 
              icon={Zap} 
              description="Creative inspiration and content development"
            />
            <Tab 
              id="structure" 
              label="Structure" 
              icon={Layers} 
              description="Story organization and flow guidance"
            />
          </div>
          
          {/* Technical Enhancement Features - Row 2 */}
          <div className="grid grid-cols-3 gap-1">
            <Tab 
              id="language" 
              label="Language" 
              icon={Palette} 
              description="Vocabulary and style improvements"
            />
            <Tab 
              id="grammar" 
              label="Grammar" 
              icon={CheckCircle} 
              description="Spelling, punctuation, and grammar check"
            />
            <Tab 
              id="toolkit" 
              label="Toolkit" 
              icon={BookOpen} 
              description="Assessment rubric and advanced writing tools"
            />
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-4 overflow-hidden">
          <div className="h-full rounded-xl bg-white text-gray-900 shadow-inner">
            {tab === "coach" && (
              <div className="h-full overflow-auto p-4 space-y-4">
                {/* Writing Buddy Chat */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg h-full flex flex-col">
                  <div className="px-4 py-2 border-b border-blue-200">
                    <div className="flex items-center space-x-2">
                      <Bot className="h-4 w-4 text-blue-600" />
                      <h3 className="font-medium text-blue-800 text-sm">💬 Writing Buddy Chat</h3>
                    </div>
                  </div>
                  
                  <div className="flex-1 flex flex-col">
                    {/* Chat Messages - Expanded to fill available space */}
                    <div className="flex-1 overflow-y-auto space-y-3 mb-3">
                      {chatMessages.map((message) => (
                        <div key={message.id} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] p-3 rounded-lg text-sm ${
                            message.isUser
                              ? 'bg-blue-500 text-white rounded-br-none'
                              : message.isTyping
                              ? 'bg-gray-100 text-gray-600 rounded-bl-none animate-pulse'
                              : message.isFeedback
                              ? 'bg-purple-100 text-purple-800 rounded-bl-none border border-purple-200'
                              : 'bg-gray-100 text-gray-800 rounded-bl-none'
                          }`}>
                            <div className="whitespace-pre-wrap">{message.text}</div>
                            <div className={`text-xs mt-1 opacity-70 ${
                              message.isUser ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Chat Input */}
                    <div className="p-3 border-t border-blue-200 bg-blue-50/50">
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                          placeholder="Ask me anything about writing, or just start typing and I'll give you feedback!"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={isAITyping}
                        />
                        <button
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim() || isAITyping}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Send
                        </button>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        Feedback given: {feedbackCount} • Words: {content.split(' ').filter(w => w.length > 0).length} • Last: {lastFeedbackTime ? new Date(lastFeedbackTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:00 AM'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Ideas Feedback Tab Content */}
            {tab === "ideas" && ideasFeedback && (
              <div className="h-full overflow-auto p-4 space-y-4">
                <h3 className="font-bold text-lg text-blue-800 flex items-center"><Zap className="w-5 h-5 mr-2" /> Ideas & Content (30% of score)</h3>
                
                {ideasFeedback.promptAnalysis && ideasFeedback.promptAnalysis.elements.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="font-semibold text-blue-700 mb-2">📝 Prompt Elements Addressed:</p>
                    <div className="grid grid-cols-1 gap-1">
                      {ideasFeedback.promptAnalysis.elements.map((element, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className={`text-sm ${
                            ideasFeedback.promptAnalysis.missing.includes(element) 
                              ? 'text-orange-600' 
                              : 'text-gray-600'
                          }`}>
                            {element}
                          </span>
                        </div>
                      ))}
                    </div>
                    {ideasFeedback.promptAnalysis.missing.length > 0 && (
                      <div className="mt-3 p-2 bg-orange-100 border border-orange-300 rounded text-sm text-orange-800">
                        <p className="font-semibold mb-1">💡 Consider adding:</p>
                        <ul className="list-disc list-inside">
                          {ideasFeedback.promptAnalysis.missing.map((element, index) => (
                            <li key={index}>{element}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {ideasFeedback.feedback.length > 0 && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 space-y-2">
                    <p className="font-semibold text-sm text-purple-700 mb-2">Tips for Ideas & Content:</p>
                    {ideasFeedback.feedback.map((tip, index) => (
                      <div key={index} className="text-sm p-2 bg-purple-100 border border-purple-300 rounded">
                        {tip}
                      </div>
                    ))}
                  </div>
                )}
                {!ideasFeedback.feedback.length && !ideasFeedback.promptAnalysis.elements.length && (
                  <p className="text-gray-600">Start writing to get real-time feedback on your ideas and content!</p>
                )}
              </div>
            )}

            {/* Structure Feedback Tab Content */}
            {tab === "structure" && structureFeedback && (
              <div className="h-full overflow-auto p-4 space-y-4">
                <h3 className="font-bold text-lg text-green-800 flex items-center"><Layers className="w-5 h-5 mr-2" /> Structure & Organization (25% of score)</h3>
                
                {structureFeedback.narrativeArc && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                    <p className="font-semibold text-green-700 mb-1">📖 Narrative Arc:</p>
                    <p>{structureFeedback.narrativeArc}</p>
                  </div>
                )}

                {structureFeedback.paragraphTransitions.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="font-semibold text-green-700 mb-1">🔗 Paragraph Transitions:</p>
                    <ul className="list-disc list-inside text-sm">
                      {structureFeedback.paragraphTransitions.map((tip, index) => (
                        <li key={index}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {structureFeedback.pacingAdvice && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                    <p className="font-semibold text-green-700 mb-1">⚡ Pacing Advice:</p>
                    <p>{structureFeedback.pacingAdvice}</p>
                  </div>
                )}
                {!structureFeedback.narrativeArc && !structureFeedback.paragraphTransitions.length && !structureFeedback.pacingAdvice && (
                  <p className="text-gray-600">Start writing to get real-time feedback on your story's structure and organization!</p>
                )}
              </div>
            )}

            {/* Language Feedback Tab Content */}
            {tab === "language" && languageFeedback && (
              <div className="h-full overflow-auto p-4 space-y-4">
                <h3 className="font-bold text-lg text-orange-800 flex items-center"><Palette className="w-5 h-5 mr-2" /> Language Features & Vocabulary (25% of score)</h3>
                
                {languageFeedback.figurativeLanguage.length > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <p className="font-semibold text-orange-700 mb-1">🎨 Figurative Language Tips:</p>
                    <ul className="list-disc list-inside text-sm">
                      {languageFeedback.figurativeLanguage.map((tip, index) => (
                        <li key={index}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {languageFeedback.showDontTell.length > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <p className="font-semibold text-orange-700 mb-1">✨ Show, Don't Tell:</p>
                    <ul className="list-disc list-inside text-sm">
                      {languageFeedback.showDontTell.map((tip, index) => (
                        <li key={index}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {languageFeedback.sentenceVariety && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm">
                    <p className="font-semibold text-orange-700 mb-1">📝 Sentence Variety:</p>
                    <p>{languageFeedback.sentenceVariety}</p>
                  </div>
                )}
                {!languageFeedback.figurativeLanguage.length && !languageFeedback.showDontTell.length && !languageFeedback.sentenceVariety && (
                  <p className="text-gray-600">Start writing to get real-time feedback on your language features and vocabulary!</p>
                )}
              </div>
            )}

            {/* Grammar Feedback Tab Content */}
            {tab === "grammar" && grammarFeedback && (
              <div className="h-full overflow-auto p-4 space-y-4">
                <h3 className="font-bold text-lg text-red-800 flex items-center"><CheckCircle className="w-5 h-5 mr-2" /> Spelling & Grammar (20% of score)</h3>
                
                {grammarFeedback.contextualErrors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="font-semibold text-red-700 mb-1">❌ Grammar Check:</p>
                    <ul className="list-disc list-inside text-sm">
                      {grammarFeedback.contextualErrors.map((error, index) => (
                        <li key={index}>
                          <strong>{error.error}:</strong> {error.explanation}<br />
                          <strong>✅ Try:</strong> {error.suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {grammarFeedback.punctuationTips.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="font-semibold text-red-700 mb-1">💫 Punctuation for Effect:</p>
                    <ul className="list-disc list-inside text-sm">
                      {grammarFeedback.punctuationTips.map((tip, index) => (
                        <li key={index}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {grammarFeedback.commonErrors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="font-semibold text-red-700 mb-1">💡 Writing Tips:</p>
                    <ul className="list-disc list-inside text-sm">
                      {grammarFeedback.commonErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {!grammarFeedback.contextualErrors.length && !grammarFeedback.punctuationTips.length && !grammarFeedback.commonErrors.length && (
                  <p className="text-gray-600">Start writing to get real-time feedback on your spelling and grammar!</p>
                )}
              </div>
            )}

            {/* Toolkit Tab Content - Fixed with Safe Analysis */}
            {tab === "toolkit" && (
              <div className="h-full overflow-auto p-4 space-y-4">
                <h3 className="font-bold text-lg text-gray-800 flex items-center"><BookOpen className="w-5 h-5 mr-2" /> Toolkit</h3>
                <RubricPanel data={safeAnalysis} onApplyFix={onApplyFix} />
                <VocabCoach content={content} onWordSelect={onWordSelect} />
                <VocabSuggestionPanel content={content} onWordReplace={handleWordReplace} onAddToPersonalList={handleAddToPersonalList} />
                <SentenceImprovementPanel content={content} onImproveSentence={handleSentenceImprovement} />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
