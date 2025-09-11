import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User, RefreshCw, Sparkles, Wand, Star, Bot, MessageSquare, BarChart3, BookOpen, TrendingUp, Wifi, WifiOff, Send, Loader, ChevronDown, ChevronUp, ThumbsUp, Lightbulb, HelpCircle, Target, AlertCircle, Zap, Gift, Heart, X, Award, CheckCircle } from 'lucide-react';
import { generateChatResponse, checkOpenAIConnectionStatus } from '../lib/openai';

interface TabbedCoachPanelProps {
  content: string;
  textType: string;
  assistanceLevel: string;
  selectedText: string;
  onNavigate?: (page: string) => void;
}

type TabType = 'coach' | 'analysis' | 'vocabulary' | 'progress';

interface AIConnectionStatus {
  connected: boolean;
  loading: boolean;
  lastChecked: Date | null;
}

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isTyping?: boolean;
}

// NSW Feedback interfaces
interface TextPosition {
  start: number;
  end: number;
}

interface FeedbackItem {
  exampleFromText: string;
  position: TextPosition;
  comment?: string;
  suggestionForImprovement?: string;
}

interface GrammarCorrection {
  original: string;
  suggestion: string;
  explanation: string;
  position: TextPosition;
}

interface VocabularyEnhancement {
  original: string;
  suggestion: string;
  explanation: string;
  position: TextPosition;
}

interface CriteriaFeedback {
  category: string;
  score: number;
  strengths: FeedbackItem[];
  areasForImprovement: FeedbackItem[];
}

interface DetailedFeedback {
  overallScore: number;
  criteriaScores: {
    ideasAndContent: number;
    textStructureAndOrganization: number;
    languageFeaturesAndVocabulary: number;
    spellingPunctuationAndGrammar: number;
  };
  feedbackCategories: CriteriaFeedback[];
  grammarCorrections: GrammarCorrection[];
  vocabularyEnhancements: VocabularyEnhancement[];
}

export function TabbedCoachPanel({
  content,
  textType,
  assistanceLevel,
  selectedText,
  onNavigate
}: TabbedCoachPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('coach');
  const [localAssistanceLevel, setLocalAssistanceLevel] = useState<string>(assistanceLevel);
  const [aiStatus, setAIStatus] = useState<AIConnectionStatus>({
    connected: false,
    loading: true,
    lastChecked: null
  });

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isAITyping, setIsAITyping] = useState(false);
  const [showQuickQuestions, setShowQuickQuestions] = useState(true);

  // NSW Feedback state
  const [nswFeedback, setNswFeedback] = useState<DetailedFeedback | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalyzedContent, setLastAnalyzedContent] = useState('');
  const [autoAnalysisTimeout, setAutoAnalysisTimeout] = useState<NodeJS.Timeout | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Refs
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Calculate writing metrics
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const sentenceCount = content.trim() ? content.split(/[.!?]+/).filter(s => s.trim().length > 0).length : 0;
  const paragraphCount = content.trim() ? content.split(/\n\s*\n/).filter(p => p.trim().length > 0).length : 0;
  const readingTime = Math.ceil(wordCount / 200);
  const gradeLevel = Math.min(12, Math.max(1, Math.round(wordCount / 50) + 3));

  // Update local assistance level when prop changes
  useEffect(() => {
    setLocalAssistanceLevel(assistanceLevel);
  }, [assistanceLevel]);

  // Check AI connection status on mount and periodically
  useEffect(() => {
    checkAIConnection();
    
    // Check connection every 30 seconds
    const interval = setInterval(checkAIConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  // Initialize welcome message
  useEffect(() => {
    if (chatMessages.length === 0) {
      setChatMessages([{
        id: '1',
        text: "Hi! I'm your AI Writing Buddy! 🤖 I'm here to help you write amazing stories. Ask me anything about writing!",
        isUser: false,
        timestamp: new Date()
      }]);
    }
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Auto-analysis functionality
  const triggerNSWAnalysis = useCallback(async (contentToAnalyze: string) => {
    // Only analyze if content is substantial and different from last analysis
    if (contentToAnalyze.length < 50 || contentToAnalyze === lastAnalyzedContent || isAnalyzing) {
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch("/.netlify/functions/ai-feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: contentToAnalyze,
          textType,
          assistanceLevel,
        }),
      });

      if (!response.ok) {
        throw new Error(`Backend API error: ${response.status}`);
      }

      const feedback: DetailedFeedback = await response.json();
      setNswFeedback(feedback);
      setLastAnalyzedContent(contentToAnalyze);
      
      // Auto-switch to analysis tab if not already there
      if (activeTab !== 'analysis') {
        setActiveTab('analysis');
      }
    } catch (error) {
      console.error("Error fetching NSW feedback:", error);
      // Fallback feedback
      setNswFeedback({
        overallScore: Math.min(25, Math.max(10, wordCount / 10)),
        criteriaScores: {
          ideasAndContent: Math.min(9, Math.max(3, Math.floor(wordCount / 20))),
          textStructureAndOrganization: Math.min(9, Math.max(3, Math.floor(wordCount / 25))),
          languageFeaturesAndVocabulary: Math.min(9, Math.max(3, Math.floor(wordCount / 30))),
          spellingPunctuationAndGrammar: Math.min(9, Math.max(3, Math.floor(wordCount / 15)))
        },
        feedbackCategories: [],
        grammarCorrections: [],
        vocabularyEnhancements: []
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [textType, assistanceLevel, lastAnalyzedContent, isAnalyzing, activeTab, wordCount]);

  // Auto-analysis trigger when content changes
  useEffect(() => {
    // Clear existing timeout
    if (autoAnalysisTimeout) {
      clearTimeout(autoAnalysisTimeout);
    }

    // Set new timeout for auto-analysis (3 seconds after content stops changing)
    if (content.length >= 50) {
      const timeout = setTimeout(() => {
        triggerNSWAnalysis(content);
      }, 3000);
      
      setAutoAnalysisTimeout(timeout);
    }

    // Cleanup
    return () => {
      if (autoAnalysisTimeout) {
        clearTimeout(autoAnalysisTimeout);
      }
    };
  }, [content, triggerNSWAnalysis]);

  const checkAIConnection = async () => {
    setAIStatus(prev => ({ ...prev, loading: true }));
    
    try {
      const isConnected = await checkOpenAIConnectionStatus();
      setAIStatus({
        connected: isConnected,
        loading: false,
        lastChecked: new Date()
      });
    } catch (error) {
      console.error('AI connection check failed:', error);
      setAIStatus({
        connected: false,
        loading: false,
        lastChecked: new Date()
      });
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isAITyping) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputMessage.trim(),
      isUser: true,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsAITyping(true);
    setShowQuickQuestions(false);

    try {
      const response = await generateChatResponse({
        userMessage: inputMessage.trim(),
        textType,
        currentContent: content,
        wordCount,
        context: `User is currently writing a ${textType} piece with ${wordCount} words.`
      });

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I'm having trouble connecting right now. Please try again in a moment! 😊",
        isUser: false,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsAITyping(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    setInputMessage(question);
    handleSendMessage();
  };

  const getScoreColor = (score: number, maxScore: number = 9) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'text-green-400';
    if (percentage >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBadge = (score: number, maxScore: number = 9) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'Excellent';
    if (percentage >= 60) return 'Good';
    if (percentage >= 40) return 'Fair';
    return 'Needs Work';
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const quickQuestions = [
    "How can I improve my introduction?",
    "What's a good synonym for 'said'?",
    "Help me with my conclusion",
    "How do I show emotions better?",
    "What makes good dialogue?",
    "How can I add more details?"
  ];

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700">
      {/* Header */}
      <div className="flex-shrink-0 p-3 border-b border-white/20">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-bold text-lg flex items-center">
            <Bot className="w-5 h-5 mr-2" />
            Writing Buddy
          </h2>
          <div className="flex items-center space-x-2">
            {isAnalyzing && (
              <div className="flex items-center text-white/80 text-xs">
                <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                Analyzing...
              </div>
            )}
            <div className={`w-2 h-2 rounded-full ${aiStatus.connected ? 'bg-green-400' : 'bg-red-400'}`} />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-white/10 rounded-lg p-1">
          {[
            { key: 'coach', icon: Bot, label: 'Coach' },
            { key: 'analysis', icon: BarChart3, label: 'Analysis' },
            { key: 'vocabulary', icon: BookOpen, label: 'Vocab' },
            { key: 'progress', icon: TrendingUp, label: 'Progress' }
          ].map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as TabType)}
              className={`flex-1 flex items-center justify-center px-2 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeTab === key
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon className="w-3 h-3 mr-1" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {/* Coach Tab */}
        {activeTab === 'coach' && (
          <div className="h-full flex flex-col">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${
                      message.isUser
                        ? 'bg-white text-purple-600 ml-4'
                        : 'bg-white/10 text-white mr-4'
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}

              {isAITyping && (
                <div className="flex justify-start">
                  <div className="bg-white/10 text-white max-w-[85%] px-3 py-2 rounded-lg text-sm mr-4">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Questions */}
              {showQuickQuestions && chatMessages.length <= 1 && (
                <div className="space-y-2">
                  <p className="text-white/80 text-xs text-center">Quick questions to get started:</p>
                  <div className="grid grid-cols-1 gap-2">
                    {quickQuestions.slice(0, 3).map((question, index) => (
                      <button
                        key={index}
                        onClick={() => handleQuickQuestion(question)}
                        className="text-left text-xs bg-white/10 hover:bg-white/20 text-white/90 px-3 py-2 rounded-lg transition-colors"
                      >
                        • {question}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="flex-shrink-0 p-3 border-t border-white/20">
              <div className="flex space-x-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask your Writing Buddy..."
                  className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
                  disabled={isAITyping}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isAITyping}
                  className="px-3 py-2 bg-white text-purple-600 rounded-lg hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Analysis Tab - NSW Feedback */}
        {activeTab === 'analysis' && (
          <div className="h-full overflow-y-auto p-3 space-y-4">
            {isAnalyzing ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin text-white" />
                <div className="text-center">
                  <h3 className="text-white font-semibold mb-1">Analyzing Your Writing</h3>
                  <p className="text-white/70 text-sm">
                    Reviewing against NSW Selective criteria...
                  </p>
                </div>
              </div>
            ) : nswFeedback ? (
              <div className="space-y-4">
                {/* Overall Score */}
                <div className="bg-white/10 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white font-semibold flex items-center">
                      <Award className="w-4 h-4 mr-2" />
                      NSW Selective Analysis
                    </h3>
                    <button
                      onClick={() => triggerNSWAnalysis(content)}
                      className="p-1 text-white/70 hover:text-white rounded"
                      title="Refresh Analysis"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="text-2xl font-bold text-white">{nswFeedback.overallScore}/36</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium bg-white/20 ${getScoreColor(nswFeedback.overallScore, 36)}`}>
                      {getScoreBadge(nswFeedback.overallScore, 36)}
                    </span>
                  </div>
                  
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-400 to-purple-400 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(nswFeedback.overallScore / 36) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Criteria Scores */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'ideasAndContent', label: 'Ideas & Content', icon: Lightbulb },
                    { key: 'textStructureAndOrganization', label: 'Structure', icon: Target },
                    { key: 'languageFeaturesAndVocabulary', label: 'Language', icon: BookOpen },
                    { key: 'spellingPunctuationAndGrammar', label: 'Grammar', icon: CheckCircle }
                  ].map(({ key, label, icon: Icon }) => {
                    const score = nswFeedback.criteriaScores[key as keyof typeof nswFeedback.criteriaScores];
                    return (
                      <div key={key} className="bg-white/10 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-1">
                            <Icon className="w-3 h-3 text-white" />
                            <span className="text-white text-xs font-medium">{label}</span>
                          </div>
                          <span className={`text-xs font-medium ${getScoreColor(score)}`}>
                            {score}/9
                          </span>
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-1">
                          <div 
                            className="bg-white h-1 rounded-full transition-all duration-500"
                            style={{ width: `${(score / 9) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Detailed Feedback Categories */}
                {nswFeedback.feedbackCategories && nswFeedback.feedbackCategories.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-white font-semibold text-sm flex items-center">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Detailed Feedback
                    </h4>
                    
                    {nswFeedback.feedbackCategories.map((category, index) => (
                      <div key={index} className="bg-white/10 rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleCategory(category.category)}
                          className="w-full px-3 py-2 text-left hover:bg-white/5 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="text-white text-sm font-medium">{category.category}</span>
                              <span className={`text-xs font-medium ${getScoreColor(category.score)}`}>
                                {category.score}/9
                              </span>
                            </div>
                            {expandedCategories.has(category.category) ? 
                              <ChevronUp className="w-4 h-4 text-white/70" /> : 
                              <ChevronDown className="w-4 h-4 text-white/70" />
                            }
                          </div>
                        </button>
                        
                        {expandedCategories.has(category.category) && (
                          <div className="px-3 pb-3 space-y-2">
                            {/* Strengths */}
                            {category.strengths && category.strengths.length > 0 && (
                              <div>
                                <h5 className="text-green-400 text-xs font-medium mb-1 flex items-center">
                                  <ThumbsUp className="w-3 h-3 mr-1" />
                                  Strengths
                                </h5>
                                {category.strengths.map((strength, idx) => (
                                  <div key={idx} className="bg-green-500/20 border border-green-500/30 rounded p-2">
                                    <div className="text-green-300 text-xs font-medium mb-1">
                                      "{strength.exampleFromText}"
                                    </div>
                                    {strength.comment && (
                                      <div className="text-green-200 text-xs">{strength.comment}</div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {/* Areas for Improvement */}
                            {category.areasForImprovement && category.areasForImprovement.length > 0 && (
                              <div>
                                <h5 className="text-orange-400 text-xs font-medium mb-1 flex items-center">
                                  <TrendingUp className="w-3 h-3 mr-1" />
                                  Improvements
                                </h5>
                                {category.areasForImprovement.map((improvement, idx) => (
                                  <div key={idx} className="bg-orange-500/20 border border-orange-500/30 rounded p-2">
                                    <div className="text-orange-300 text-xs font-medium mb-1">
                                      "{improvement.exampleFromText}"
                                    </div>
                                    {improvement.suggestionForImprovement && (
                                      <div className="text-orange-200 text-xs">
                                        💡 {improvement.suggestionForImprovement}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Grammar Corrections */}
                {nswFeedback.grammarCorrections && nswFeedback.grammarCorrections.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-white font-semibold text-sm flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Grammar Corrections
                    </h4>
                    {nswFeedback.grammarCorrections.map((correction, index) => (
                      <div key={index} className="bg-red-500/20 border border-red-500/30 rounded p-2">
                        <div className="text-sm">
                          <span className="line-through text-red-300">{correction.original}</span>
                          <span className="mx-2 text-white">→</span>
                          <span className="text-green-300">{correction.suggestion}</span>
                        </div>
                        <div className="text-white/70 text-xs mt-1">{correction.explanation}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Vocabulary Enhancements */}
                {nswFeedback.vocabularyEnhancements && nswFeedback.vocabularyEnhancements.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-white font-semibold text-sm flex items-center">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Vocabulary Enhancements
                    </h4>
                    {nswFeedback.vocabularyEnhancements.map((enhancement, index) => (
                      <div key={index} className="bg-purple-500/20 border border-purple-500/30 rounded p-2">
                        <div className="text-sm">
                          <span className="text-white/70">{enhancement.original}</span>
                          <span className="mx-2 text-white">→</span>
                          <span className="text-purple-300">{enhancement.suggestion}</span>
                        </div>
                        <div className="text-white/70 text-xs mt-1">{enhancement.explanation}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 space-y-3">
                <BarChart3 className="w-8 h-8 text-white/50" />
                <div className="text-center">
                  <h3 className="text-white font-semibold mb-1">Ready for Analysis</h3>
                  <p className="text-white/70 text-sm mb-3">
                    Write 50+ characters and I'll analyze your work automatically!
                  </p>
                  <button
                    onClick={() => triggerNSWAnalysis(content)}
                    className="px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-white/90 transition-colors text-sm"
                  >
                    Analyze Now
                  </button>
                </div>
                
                {/* Basic Stats */}
                <div className="w-full bg-white/10 rounded-lg p-3 mt-4">
                  <h4 className="text-white font-semibold mb-2 text-sm">Writing Statistics</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between text-white/90">
                      <span>Words:</span>
                      <span>{wordCount}</span>
                    </div>
                    <div className="flex justify-between text-white/90">
                      <span>Sentences:</span>
                      <span>{sentenceCount}</span>
                    </div>
                    <div className="flex justify-between text-white/90">
                      <span>Paragraphs:</span>
                      <span>{paragraphCount}</span>
                    </div>
                    <div className="flex justify-between text-white/90">
                      <span>Reading Time:</span>
                      <span>{readingTime} min</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Vocabulary Tab */}
        {activeTab === 'vocabulary' && (
          <div className="p-3 space-y-3 overflow-y-auto h-full">
            <div className="bg-white/10 rounded-lg p-3">
              <h3 className="text-white font-semibold mb-2 flex items-center text-sm">
                <BookOpen className="w-3 h-3 mr-2" />
                Vocabulary Builder
              </h3>
              <p className="text-white/80 text-xs mb-3">
                Select text in your writing to get vocabulary suggestions!
              </p>
              
              {selectedText ? (
                <div className="space-y-2">
                  <div className="bg-white/20 rounded p-2">
                    <p className="text-white text-xs font-medium">Selected: "{selectedText}"</p>
                  </div>
                  <button className="w-full bg-white text-purple-600 rounded py-2 text-xs font-medium hover:bg-white/90 transition-colors">
                    Get Synonyms
                  </button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <BookOpen className="w-8 h-8 text-white/30 mx-auto mb-2" />
                  <p className="text-white/60 text-xs">Select text to enhance vocabulary</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Progress Tab */}
        {activeTab === 'progress' && (
          <div className="p-3 space-y-3 overflow-y-auto h-full">
            <div className="bg-white/10 rounded-lg p-3">
              <h3 className="text-white font-semibold mb-2 flex items-center text-sm">
                <TrendingUp className="w-3 h-3 mr-2" />
                Writing Progress
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-white/90">
                  <span>Current Score:</span>
                  <span>{nswFeedback?.overallScore || 0}/36</span>
                </div>
                <div className="flex justify-between text-white/90">
                  <span>Grade Level:</span>
                  <span>{gradeLevel}</span>
                </div>
                <div className="flex justify-between text-white/90">
                  <span>Text Type:</span>
                  <span className="capitalize">{textType}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
