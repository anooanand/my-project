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
import { ExternalLink, FileText, MessageSquare, BarChart3, BookOpen, TrendingUp, Bot, User, Lightbulb, Sparkles, ArrowRight, RefreshCcw, ChevronDown, ChevronUp, Loader } from 'lucide-react';

type Props = { 
  analysis: DetailedFeedback | null; 
  onApplyFix: (fix: LintFix) => void;
  content?: string;
  textType?: string;
  onWordSelect?: (word: string) => void;
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
  onWordSelect = () => {}
}: Props) {
  const [tab, setTab] = useState<"coach" | "toolkit">("coach");
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
  
  const Tab = ({ id, label, icon: Icon }:{ 
    id: "coach" | "toolkit"; 
    label: string;
    icon: React.ComponentType<any>;
  }) => (
    <button
      className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex-1 ${
        tab === id 
          ? "bg-white text-purple-600 shadow-sm" 
          : "bg-purple-500/20 text-white/90 hover:bg-purple-500/30"
      }`}
      onClick={() => setTab(id)}
    >
      <Icon className="w-3 h-3" />
      <span className="text-center">{label}</span>
    </button>
  );

  return (
    <>
      <div className="h-full flex flex-col rounded-2xl bg-gradient-to-br from-purple-600 via-purple-700 to-fuchsia-600 text-white shadow-xl">
        {/* Tab Navigation - New 2-tab Layout */}
        <div className="p-3 border-b border-white/20">
          <div className="flex gap-1">
            <Tab id="coach" label="Coach - Interactive AI chat and real-time feedback" icon={MessageSquare} />
            <Tab id="toolkit" label="Toolkit - Narrative structure guide + sentence improvement lab" icon={BookOpen} />
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-4 overflow-hidden">
          <div className="h-full rounded-xl bg-white text-gray-900 shadow-inner">
            {tab === "coach" && (
              <div className="h-full overflow-auto p-4 space-y-4">
                {/* Writing Buddy Chat */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                  <div className="p-4 border-b border-blue-200">
                    <div className="flex items-center space-x-2">
                      <Bot className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold text-blue-800">💬 Writing Buddy Chat</h3>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    {/* Chat Messages */}
                    <div className="h-64 overflow-y-auto mb-4 space-y-3">
                      {chatMessages.map((message) => (
                        <div key={message.id} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                            message.isUser 
                              ? 'bg-blue-600 text-white' 
                              : message.isFeedback
                                ? 'bg-green-50 border border-green-200 text-green-800'
                                : 'bg-white border border-gray-200 text-gray-800'
                          }`}>
                            <div className="flex items-start space-x-2">
                              {!message.isUser && (
                                message.isTyping ? 
                                  <Loader className="h-4 w-4 mt-0.5 text-blue-600 animate-spin" /> :
                                  <Bot className={`h-4 w-4 mt-0.5 ${message.isFeedback ? 'text-green-600' : 'text-blue-600'}`} />
                              )}
                              <div className="flex-1">
                                <p className="text-sm">{message.text}</p>
                                <p className={`text-xs mt-1 ${
                                  message.isUser ? 'text-blue-100' : 
                                  message.isFeedback ? 'text-green-600' : 'text-gray-500'
                                }`}>
                                  {message.timestamp.toLocaleTimeString()}
                                  {message.isFeedback && ' • Auto feedback'}
                                </p>
                              </div>
                              {message.isUser && <User className="h-4 w-4 mt-0.5 text-blue-100" />}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>
                    
                    {/* Quick Questions */}
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2">Quick questions to get started:</p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          "How can I improve my introduction?",
                          "What's a good synonym for 'said'?",
                          "Help me with my conclusion",
                          "How do I make my characters more interesting?",
                          "What makes a good story hook?"
                        ].map((question, index) => (
                          <button
                            key={index}
                            onClick={() => setNewMessage(question)}
                            className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full hover:bg-blue-200 transition-colors"
                          >
                            {question}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Message Input */}
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Ask me anything about writing..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                      <button
                        onClick={handleSendMessage}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        Send
                      </button>
                    </div>
                    
                    <p className="text-xs text-gray-500 mt-2">
                      💡 Feedback given: {feedbackCount} • Words: {content.split(' ').filter(w => w.length > 0).length} • Last: {lastFeedbackTime > 0 ? new Date(lastFeedbackTime).toLocaleTimeString() : 'None'}
                      {isAITyping && ' • AI is typing...'}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {tab === "toolkit" && (
              <div className="h-full overflow-auto p-4 space-y-6">
                {/* Sentence Improvement Lab */}
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
                  <div className="p-4 border-b border-yellow-200">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="h-5 w-5 text-orange-600" />
                      <h3 className="font-semibold text-orange-800">🔬 Sentence Improvement Lab</h3>
                    </div>
                  </div>

                  <div className="p-4">
                    {/* Use the existing SentenceImprovementPanel component */}
                    <SentenceImprovementPanel
                      content={content}
                      textType={textType}
                      onApplyImprovement={handleSentenceImprovement}
                      className="border-0 shadow-none bg-transparent"
                    />
                  </div>
                </div>

                {/* Pro Tip */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Lightbulb className="h-4 w-4 text-purple-600" />
                    <span className="font-medium text-purple-800">💡 Pro Tip</span>
                  </div>
                  <p className="text-sm text-purple-700">
                    Try to identify sentences in your writing that could be improved using these techniques!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full Report Modal */}
      {analysis && (
        <ReportModal
          isOpen={showFullReport}
          onClose={() => setShowFullReport(false)}
          data={analysis}
          onApplyFix={onApplyFix}
          studentName="Student"
          essayText={content}
        />
      )}
    </>
  );
}