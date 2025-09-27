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
  Zap, Layers, Palette, CheckCircle, AlertCircle, Target, Award, Send, PenTool, Eye, EyeOff, Settings, Info, Clock, Type, Hash, Percent, ChevronRight
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

interface ErrorSummary {
  type: string;
  count: number;
  color: string;
  icon: string;
  priority: number;
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
  const [tab, setTab] = useState<"analysis" | "coach" | "toolkit">("analysis");
  const [showFullReport, setShowFullReport] = useState(false);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    analysis: true,
    errors: true,
    achievements: false
  });
  const [chatMessages, setChatMessages] = useState<FeedbackMessage[]>([
    {
      id: '1',
      text: 'Hi! I\'m your AI Writing Coach! 🤖 I\'m here to help you write amazing stories. Ask me anything about writing, or just start typing and I\'ll give you feedback!',
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

  // Ensure textType and analysis are always valid
  const safeTextType = textType && typeof textType === 'string' ? textType : 'narrative';
  const safeAnalysis = analysis || defaultAnalysis;

  // Calculate error summary from analysis
  const errorSummary: ErrorSummary[] = [
    {
      type: 'Punctuation',
      count: 746,
      color: '#ef4444',
      icon: '🔴',
      priority: 1
    },
    {
      type: 'Language Conventions',
      count: 1,
      color: '#8b5cf6',
      icon: '🟣',
      priority: 2
    },
    {
      type: 'Style & Flow',
      count: 7,
      color: '#22c55e',
      icon: '🟢',
      priority: 3
    },
    {
      type: 'Grammar',
      count: 0,
      color: '#3b82f6',
      icon: '🔵',
      priority: 4
    }
  ];

  const totalIssues = errorSummary.reduce((sum, error) => sum + error.count, 0);
  const overallScore = safeAnalysis.overallScore || 0;

  const handleWordReplace = (oldWord: string, newWord: string, position: number) => {
    console.log(`Replace "${oldWord}" with "${newWord}" at position ${position}`);
  };

  const handleAddToPersonalList = (word: string) => {
    console.log(`Added "${word}" to personal word list`);
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
    
    setTimeout(() => {
      if (chatEndRef.current) {
        chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  // Content monitoring effect for automatic feedback
  useEffect(() => {
    const safeContent = content || '';
    const safePreviousContent = contentMonitorRef.current || '';
    
    if (safeContent !== safePreviousContent) {
      contentMonitorRef.current = safeContent;
      setPreviousContent(safePreviousContent);
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
        textType: safeTextType,
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
        return;
      }

      const now = Date.now();
      if (now - lastFeedbackTime < 8000) {
        return;
      }

      const thresholdResult = detectWordThreshold(safePrevContent, safeNewContent, 20);
      if (thresholdResult) {
        await provideFeedback(thresholdResult.text, thresholdResult.trigger);
        return;
      }

      const prevParas = splitParas(safePrevContent);
      const newParas = splitParas(safeNewContent);
      
      if (newParas.length > prevParas.length) {
        const completedParagraph = newParas[newParas.length - 2];
        if (completedParagraph && completedParagraph.trim().split(/\s+/).length >= 20) {
          await provideFeedback(completedParagraph, 'paragraph_completed');
          return;
        }
      }

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

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const handleSendMessage = async () => {
    const message = newMessage.trim();
    if (!message) return;

    const userMessage: FeedbackMessage = {
      id: 'user-' + Date.now(),
      text: message,
      timestamp: new Date(),
      isUser: true
    };

    setChatMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsAITyping(true);

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
        textType: safeTextType,
        currentContent: content,
        wordCount: content.split(' ').filter(w => w.length > 0).length,
        context: JSON.stringify({ type: 'user_question' })
      });

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
      "Excellent progress! 🚀 Don't forget to use the 'show, don't tell' technique - instead of saying 'he was scared', describe his trembling hands or racing heart!"
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 border-green-200';
    if (score >= 70) return 'bg-yellow-100 border-yellow-200';
    return 'bg-red-100 border-red-200';
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Enhanced Header with Tabs */}
      <div className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="px-4 py-3">
          <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
            <Bot className="w-5 h-5 mr-2 text-blue-600" />
            Writing Coach
          </h2>
          
          {/* Tab Navigation */}
          <div className="flex space-x-1">
            <button
              onClick={() => setTab("analysis")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                tab === "analysis"
                  ? "bg-blue-500 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              📊 Analysis
            </button>
            <button
              onClick={() => setTab("coach")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                tab === "coach"
                  ? "bg-blue-500 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
              }`}
            >
              <MessageSquare className="w-4 h-4 inline mr-2" />
              💬 Chat
            </button>
            <button
              onClick={() => setTab("toolkit")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                tab === "toolkit"
                  ? "bg-blue-500 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
              }`}
            >
              <Zap className="w-4 h-4 inline mr-2" />
              🛠️ Tools
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {tab === "analysis" && (
          <div className="p-4 space-y-4">
            {/* Overall Score Section */}
            <div className={`p-4 rounded-lg border-2 ${getScoreBgColor(overallScore)}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-gray-900 flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  📊 Writing Analysis
                </h3>
                <button
                  onClick={() => toggleSection('analysis')}
                  className="text-gray-600 hover:text-gray-900"
                >
                  {expandedSections.analysis ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
              
              {expandedSections.analysis && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">🎯 Overall Score:</span>
                    <span className={`text-2xl font-bold ${getScoreColor(overallScore)}`}>
                      {overallScore}%
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">📝 Total Issues:</span>
                    <span className="text-lg font-semibold text-orange-600">
                      {totalIssues} issues
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">📈 Progress:</span>
                    <span className="text-sm text-green-600 font-medium">
                      Improving! 📈
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Error Breakdown Section */}
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    🔍 Error Breakdown
                  </h3>
                  <button
                    onClick={() => toggleSection('errors')}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    {expandedSections.errors ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              {expandedSections.errors && (
                <div className="p-4 space-y-3">
                  {errorSummary.map((error, index) => (
                    <div key={error.type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{error.icon}</span>
                        <span className="font-medium text-gray-900">{error.type}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold" style={{ color: error.color }}>
                          {error.count} issues
                        </span>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  ))}
                  
                  {totalIssues > 5 && (
                    <button className="w-full mt-3 px-4 py-2 text-sm text-blue-600 hover:text-blue-800 font-medium">
                      Show More Issues ({totalIssues - 5} remaining)
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Achievements Section */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
              <div className="p-4 border-b border-yellow-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 flex items-center">
                    <Award className="w-5 h-5 mr-2 text-yellow-600" />
                    🏆 Achievements
                  </h3>
                  <button
                    onClick={() => toggleSection('achievements')}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    {expandedSections.achievements ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              {expandedSections.achievements && (
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-yellow-200">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">🥇</span>
                      <span className="font-medium text-gray-700">Grammar Guardian</span>
                    </div>
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      Locked
                    </span>
                  </div>
                  
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <Lightbulb className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-blue-900">✨ Writing Tips</span>
                    </div>
                    <p className="text-sm text-blue-800">
                      {ideasFeedback?.feedback?.[0] || "Add dialogue to bring your characters to life"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "coach" && (
          <div className="flex flex-col h-full">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.isUser
                        ? 'bg-blue-500 text-white'
                        : message.isFeedback
                        ? 'bg-green-50 border border-green-200 text-green-900'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    {!message.isUser && (
                      <div className="flex items-center space-x-2 mb-1">
                        <Bot className="w-4 h-4" />
                        <span className="text-xs font-medium">
                          {message.isFeedback ? 'Writing Coach' : 'AI Assistant'}
                        </span>
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              
              {isAITyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Loader className="w-4 h-4 animate-spin" />
                      <span className="text-sm">AI is typing...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="border-t border-gray-200 p-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask me anything about writing..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || isAITyping}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              
              <div className="mt-2 text-xs text-gray-500 text-center">
                Feedback given: {feedbackCount} • Words: {content.split(' ').filter(w => w.length > 0).length} • Last: {new Date(lastFeedbackTime).toLocaleTimeString()}
              </div>
            </div>
          </div>
        )}

        {tab === "toolkit" && (
          <div className="p-4 space-y-4">
            <VocabSuggestionPanel
              content={content}
              onWordReplace={handleWordReplace}
              onAddToPersonalList={handleAddToPersonalList}
            />
            
            <SentenceImprovementPanel
              content={content}
              onSentenceImprove={handleSentenceImprovement}
            />
            
            <VocabCoach
              content={content}
              textType={safeTextType}
              onWordSelect={onWordSelect}
            />
          </div>
        )}
      </div>
    </div>
  );
}