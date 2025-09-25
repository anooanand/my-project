import React, { useState, useEffect, useRef } from "react";
import { CoachProvider } from "./CoachProvider";
import { RubricPanel } from "./RubricPanel";
import { VocabCoach } from "./VocabCoach";
import { ReportModal } from "./ReportModal";
import { VocabSuggestionPanel } from "./VocabSuggestionPanel";
import { SentenceImprovementPanel } from "./SentenceImprovementPanel";
import { FeedbackChat } from "./FeedbackChat";
import type { DetailedFeedback, LintFix } from "../types/feedback";
import { generateChatResponse, checkOpenAIConnectionStatus } from "../lib/openai";
import { detectWordThreshold, splitParas } from "../lib/paragraphDetection";
import {
  ExternalLink, FileText, MessageSquare, BarChart3, BookOpen, TrendingUp, Bot, User, Lightbulb, Sparkles, ArrowRight, RefreshCcw, ChevronDown, ChevronUp, Loader,
  Zap, Layers, Palette, CheckCircle, AlertCircle
} from "lucide-react";

// Import the new feedback interfaces from EnhancedWritingLayout
import type { IdeasFeedback, StructureFeedback, LanguageFeedback, GrammarFeedback } from "./EnhancedWritingLayout";

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
  const [tab, setTab] = useState<"coach" | "ideas" | "structure" | "language" | "grammar" | "toolkit">("coach");
  const [showFullReport, setShowFullReport] = useState(false);
  const [expandedPhases, setExpandedPhases] = useState<{ [key: string]: boolean }>({});
  const [chatMessages, setChatMessages] = useState<FeedbackMessage[]>([
    {
      id: "1",
      text: "Hi I\"m your AI Writing Buddy! 🤖 I\"m here to help you write amazing stories. Ask me anything about writing, or just start typing and I\"ll give you feedback!",
      timestamp: new Date(),
      isUser: false
    }
  ]);
  const [newMessage, setNewMessage] = useState("");
  
  // Automatic feedback state
  const [isAITyping, setIsAITyping] = useState(false);
  const [lastFeedbackTime, setLastFeedbackTime] = useState<number>(0);
  const [feedbackCount, setFeedbackCount] = useState<number>(0);
  const [previousContent, setPreviousContent] = useState<string>("");
  
  // Refs for content monitoring
  const contentMonitorRef = useRef<string>("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleWordReplace = (oldWord: string, newWord: string, position: number) => {
    console.log(`Replace \"${oldWord}\" with \"${newWord}\" at position ${position}`);
    // In a real app, this would update the content state in the parent component
  };

  const handleAddToPersonalList = (word: string) => {
    console.log(`Added \"${word}\" to personal word list`);
    // In a real app, this would save to a personal word list
  };

  const handleSentenceImprovement = (original: string, improved: string) => {
    console.log(`Improve sentence: \"${original}\" -> \"${improved}\"");
    
    // Switch to Coach tab to show the feedback
    setTab("coach");
    
    // Add a chat message about the improvement
    const improvementMessage: FeedbackMessage = {
      id: Date.now().toString(),
      text: `💡 **Sentence Improvement Applied!**\n\n**Original:** \"${original}\"\n\n**Improved:** \"${improved}\"\n\nThis enhancement makes your writing more sophisticated and engaging! Keep up the great work! 🎯✨`,
      timestamp: new Date(),
      isUser: false,
      isFeedback: true
    };
    
    setChatMessages(prev => [...prev, improvementMessage]);
    
    // Scroll to bottom after a brief delay to ensure the message is rendered
    setTimeout(() => {
      if (chatEndRef.current) {
        chatEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  const handleContentChange = (newContent: string) => {
    console.log(`Content updated: ${newContent.length} characters`);
    // In a real app, this would update the content state in the parent component
  };

  // Content monitoring effect for automatic feedback
  useEffect(() => {
    const safeContent = content || "";
    const safePreviousContent = contentMonitorRef.current || "";
    
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
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  // Coach tip function
  const coachTip = async (paragraph: string) => {
    try {
      if (!paragraph || typeof paragraph !== "string" || paragraph.trim().length === 0) {
        throw new Error("Invalid paragraph provided");
      }

      const response = await generateChatResponse({
        userMessage: `Please provide a brief, encouraging writing tip for this paragraph: \"${paragraph}\". Keep it under 50 words and focus on one specific improvement.`,
        textType: textType,
        currentContent: paragraph,
        wordCount: paragraph.trim().split(/\s+/).length,
        context: JSON.stringify({ type: "coach_tip" })
      });
      
      return { tip: response };
    } catch (error) {
      console.error("Coach tip error:", error);
      throw error;
    }
  };

  // Analyze content changes for feedback triggers
  const analyzeFeedbackTrigger = async (prevContent: string, newContent: string) => {
    try {
      const safePrevContent = prevContent || "";
      const safeNewContent = newContent || "";
      
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
          await provideFeedback(completedParagraph, "paragraph_completed");
          return;
        }
      }

      // Check for significant content addition (every 30 words)
      const prevWords = safePrevContent.trim() ? safePrevContent.trim().split(/\s+/).length : 0;
      const newWords = safeNewContent.trim() ? safeNewContent.trim().split(/\s+/).length : 0;
      const wordDifference = newWords - prevWords;

      if (wordDifference >= 30 && newWords >= 50) {
        const currentParagraph = newParas[newParas.length - 1] || safeNewContent.slice(-200);
        await provideFeedback(currentParagraph, "progress_milestone");
      }

    } catch (error) {
      console.error("Content analysis error:", error);
    }
  };

  // Provide automatic feedback
  const provideFeedback = async (text: string, trigger: string) => {
    try {
      if (!text || typeof text !== "string" || text.trim().length === 0) {
        return;
      }

      setIsAITyping(true);
      setLastFeedbackTime(Date.now());

      const typingMessage: FeedbackMessage = {
        id: "typing-" + Date.now(),
        text: "🤖 Reading your writing...",
        timestamp: new Date(),
        isUser: false,
        isTyping: true
      };
      setChatMessages(prev => [...prev, typingMessage]);

      try {
        const res = await coachTip(text);
        
        // Remove typing indicator and add real response
        setChatMessages(prev => {
          const withoutTyping = prev.filter(msg => !msg.isTyping);
          return [...withoutTyping, {
            id: "coach-" + Date.now(),
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
            id: "fallback-" + Date.now(),
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
      "You\"re doing well! Think about using stronger verbs to make your action more exciting. ⚡",
      "Good writing! Try to show emotions through actions rather than just telling us how characters feel. 😊",
      "Keep going! Add some sensory details - what can your character see, hear, or smell? 👃",
      "Excellent! Consider varying your sentence lengths to create better rhythm in your writing. 🎵",
      "Well done! Think about adding a surprising detail that will hook your reader\"s attention. 🎣",
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
      id: "user-" + Date.now(),
      text: message,
      timestamp: new Date(),
      isUser: true
    };

    setChatMessages(prev => [...prev, userMessage]);
    setNewMessage("");
    setIsAITyping(true);

    // Add typing indicator
    const typingMessage: FeedbackMessage = {
      id: "typing-" + Date.now(),
      text: "🤖 Thinking...",
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
        wordCount: content.split(" ").filter(w => w.length > 0).length,
        context: JSON.stringify({ type: "user_question" })
      });

      // Remove typing indicator and add real response
      setChatMessages(prev => {
        const withoutTyping = prev.filter(msg => !msg.isTyping);
        return [...withoutTyping, {
          id: "ai-" + Date.now(),
          text: response || generateAIResponse(message),
          timestamp: new Date(),
          isUser: false
        }];
      });
    } catch (error) {
      console.error("AI response error:", error);
      
      // Remove typing indicator and add fallback response
      setChatMessages(prev => {
        const withoutTyping = prev.filter(msg => !msg.isTyping);
        return [...withoutTyping, {
          id: "fallback-" + Date.now(),
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
      "That\"s a great question! 🌟 To make your paragraph even more engaging, try adding a few descriptive words. For example, describe the sounds of the whispering or the colors of the flickering light. This will help readers feel more immersed in your magical forest! Keep it up!",
      "What a captivating start! 🎭 To make your paragraph even more engaging, try adding a few descriptive words. For example, describe the sounds of the whispering or the colors of the flickering light. This will help readers feel more immersed in your magical forest! Keep it up!",
      "I love your creativity! ✨ Try to identify sentences in your writing that could be improved using these techniques!",
      "Great work! 📝 Remember to vary your sentence length to keep readers engaged. Mix short, punchy sentences with longer, more descriptive ones.",
      "Excellent progress! 🚀 Don\"t forget to use the \"show, don\"t tell\" technique - instead of saying \"he was scared\", describe his trembling hands or racing heart."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };
  
  const Tab = ({ id, label, icon: Icon }:{ 
    id: "coach" | "ideas" | "structure" | "language" | "grammar" | "toolkit"; 
    label: string;
    icon: React.ComponentType<any>;
  }) => (
    <button
      className={`flex items-center space-x-2 px-4 py-3 rounded-lg text-sm font-bold transition-all duration-200 flex-1 ${
        tab === id 
          ? "bg-white text-purple-700 shadow-md border-2 border-purple-200" 
          : "bg-purple-500/20 text-white/90 hover:bg-purple-500/30 hover:text-white"
      }`}
      onClick={() => setTab(id)}
    >
      <Icon className="w-4 h-4" />
      <span className="text-center font-extrabold">{label}</span>
    </button>
  );

  return (
    <>
      <div className="h-full flex flex-col rounded-2xl bg-gradient-to-br from-purple-600 via-purple-700 to-fuchsia-600 text-white shadow-xl">
        {/* Tab Navigation - New 2-tab Layout */}
        <div className="p-3 border-b border-white/20">
          <div className="flex gap-1">
            <Tab id="coach" label="Coach" icon={MessageSquare} />
            <Tab id="ideas" label="Ideas" icon={Zap} />
            <Tab id="structure" label="Structure" icon={Layers} />
            <Tab id="language" label="Language" icon={Palette} />
            <Tab id="grammar" label="Grammar" icon={CheckCircle} />
            <Tab id="toolkit" label="Toolkit" icon={BookOpen} />
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-4 overflow-hidden">
          <div className="h-full rounded-xl bg-white text-gray-900 shadow-inner flex flex-col">
            {tab === "coach" && (
              <div className="h-full overflow-auto p-4 space-y-4 flex flex-col">
                {/* Writing Buddy Chat */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg flex-1 flex flex-col">
                  <div className="px-4 py-2 border-b border-blue-200">
                    <div className="flex items-center space-x-2">
                      <Bot className="h-4 w-4 text-blue-600" />
                      <h3 className="font-medium text-blue-800 text-sm">💬 Writing Buddy Chat</h3>
                    </div>
                  </div>
                  
                  <div className="flex-1 flex flex-col">
                    {/* Chat Messages - Expanded to fill available space */}
                    <div className="flex-1 overflow-y-auto space-y-3 mb-3 p-4">
                      {chatMessages.map((message) => (
                        <div key={message.id} className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                            message.isUser 
                              ? "bg-blue-600 text-white" 
                              : message.isFeedback
                                ? "bg-green-50 border border-green-200 text-green-800"
                                : "bg-white border border-gray-200 text-gray-800"
                          }`}>
                            <div className="flex items-start space-x-2">
                              {!message.isUser && (
                                message.isTyping ? 
                                  <Loader className="h-4 w-4 mt-0.5 text-blue-600 animate-spin" /> :
                                  <Bot className={`h-4 w-4 mt-0.5 ${message.isFeedback ? "text-green-600" : "text-blue-600"}`} />
                              )}
                              <p className="text-sm" dangerouslySetInnerHTML={{ __html: message.text.replace(/\n/g, ")" }} />
                            </div>
                            <span className={`block text-xs mt-1 ${message.isUser ? "text-blue-200" : "text-gray-500"}`}>
                              {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Chat Input */}
                    <div className="flex-shrink-0 border-t border-blue-200 p-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          className="flex-1 p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          placeholder="Ask me anything about writing..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              handleSendMessage();
                            }
                          }}
                          disabled={isAITyping}
                        />
                        <button
                          onClick={handleSendMessage}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                          disabled={isAITyping}
                        >
                          Send
                        </button>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Feedback given: {feedbackCount} • Words: {content.split(" ").filter(w => w.length > 0).length} • Last: {lastFeedbackTime ? new Date(lastFeedbackTime).toLocaleTimeString() : "N/A"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === "ideas" && ideasFeedback && (
              <div className="h-full overflow-auto p-4 space-y-4">
                <h3 className="text-lg font-bold text-purple-700 mb-3">💡 Ideas & Content (30% of score)</h3>
                
                {ideasFeedback.promptAnalysis.elements.length > 0 && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <h4 className="font-semibold text-purple-800 mb-2">Prompt Elements to Cover:</h4>
                    <ul className="list-disc list-inside text-sm text-purple-700 space-y-1">
                      {ideasFeedback.promptAnalysis.elements.map((element, index) => (
                        <li key={index} className={`flex items-center ${ideasFeedback.promptAnalysis.covered.includes(element) ? "text-green-600" : "text-red-600"}`}>
                          {ideasFeedback.promptAnalysis.covered.includes(element) ? <CheckCircle className="w-4 h-4 mr-2" /> : <AlertCircle className="w-4 h-4 mr-2" />}
                          {element}
                        </li>
                      ))}
                    </ul>
                    {ideasFeedback.promptAnalysis.missing.length > 0 && (
                      <p className="text-sm text-red-600 mt-2">Missing: {ideasFeedback.promptAnalysis.missing.join(", ")}</p>
                    )}
                  </div>
                )}

                {ideasFeedback.feedback.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <h4 className="font-semibold text-yellow-800 mb-2">Tips for Ideas & Content:</h4>
                    <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                      {ideasFeedback.feedback.map((tip, index) => (
                        <li key={index}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {tab === "structure" && structureFeedback && (
              <div className="h-full overflow-auto p-4 space-y-4">
                <h3 className="text-lg font-bold text-green-700 mb-3">📚 Structure & Organization (25% of score)</h3>
                
                {structureFeedback.narrativeArc && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <h4 className="font-semibold text-green-800 mb-2">Narrative Arc:</h4>
                    <p className="text-sm text-green-700">{structureFeedback.narrativeArc}</p>
                  </div>
                )}

                {structureFeedback.paragraphTransitions.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <h4 className="font-semibold text-yellow-800 mb-2">Paragraph Transitions:</h4>
                    <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                      {structureFeedback.paragraphTransitions.map((tip, index) => (
                        <li key={index}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {structureFeedback.pacingAdvice && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <h4 className="font-semibold text-blue-800 mb-2">Pacing Advice:</h4>
                    <p className="text-sm text-blue-700">{structureFeedback.pacingAdvice}</p>
                  </div>
                )}
              </div>
            )}

            {tab === "language" && languageFeedback && (
              <div className="h-full overflow-auto p-4 space-y-4">
                <h3 className="text-lg font-bold text-orange-700 mb-3">🎨 Language Features & Vocabulary (25% of score)</h3>
                
                {languageFeedback.figurativeLanguage.length > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <h4 className="font-semibold text-orange-800 mb-2">Figurative Language:</h4>
                    <ul className="list-disc list-inside text-sm text-orange-700 space-y-1">
                      {languageFeedback.figurativeLanguage.map((tip, index) => (
                        <li key={index}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {languageFeedback.showDontTell.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <h4 className="font-semibold text-red-800 mb-2">"Show, Don't Tell" Tips:</h4>
                    <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                      {languageFeedback.showDontTell.map((tip, index) => (
                        <li key={index}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {languageFeedback.sentenceVariety && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <h4 className="font-semibold text-blue-800 mb-2">Sentence Variety:</h4>
                    <p className="text-sm text-blue-700">{languageFeedback.sentenceVariety}</p>
                  </div>
                )}
              </div>
            )}

            {tab === "grammar" && grammarFeedback && (
              <div className="h-full overflow-auto p-4 space-y-4">
                <h3 className="text-lg font-bold text-red-700 mb-3">📝 Spelling & Grammar (20% of score)</h3>
                
                {grammarFeedback.contextualErrors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <h4 className="font-semibold text-red-800 mb-2">Contextual Errors:</h4>
                    <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                      {grammarFeedback.contextualErrors.map((error, index) => (
                        <li key={index}>
                          **Error:** {error.error} <br />
                          **Suggestion:** {error.suggestion} <br />
                          **Explanation:** {error.explanation}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {grammarFeedback.punctuationTips.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <h4 className="font-semibold text-blue-800 mb-2">Punctuation Tips:</h4>
                    <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
                      {grammarFeedback.punctuationTips.map((tip, index) => (
                        <li key={index}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {grammarFeedback.commonErrors.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <h4 className="font-semibold text-yellow-800 mb-2">Common Errors:</h4>
                    <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                      {grammarFeedback.commonErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {tab === "toolkit" && (
              <div className="h-full overflow-auto p-4 space-y-4">
                <h3 className="text-lg font-bold text-purple-700 mb-3">🛠️ Toolkit</h3>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Rubric Panel</h4>
                  <RubricPanel analysis={analysis} togglePhase={togglePhase} expandedPhases={expandedPhases} />
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 mt-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Vocabulary Coach</h4>
                  <VocabCoach content={content} onWordReplace={handleWordReplace} onAddToPersonalList={handleAddToPersonalList} />
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 mt-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Sentence Improvement Lab</h4>
                  <SentenceImprovementPanel content={content} onImproveSentence={handleSentenceImprovement} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}