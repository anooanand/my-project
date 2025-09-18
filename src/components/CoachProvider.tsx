import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Sparkles, ChevronDown, ChevronUp, ThumbsUp, Lightbulb, HelpCircle, Target, AlertCircle, Star, Zap, Gift, Heart, X, Send, User, RefreshCw, Bot, Loader } from 'lucide-react';
import { generateChatResponse, checkOpenAIConnectionStatus } from '../lib/openai';
import AIErrorHandler from '../utils/errorHandling';
import { promptConfig } from '../config/prompts';
import { eventBus } from '../lib/eventBus';
import { detectWordThreshold, splitParas } from '../lib/paragraphDetection';

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isTyping?: boolean;
  isFeedback?: boolean;
}

interface AIStatus {
  connected: boolean;
  loading: boolean;
  lastChecked: Date | null;
}

interface CoachProviderProps {
  content?: string; // Direct content prop for monitoring
  onContentChange?: (content: string) => void;
}

export function CoachProvider({ content = '', onContentChange }: CoachProviderProps = {}) {
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isAITyping, setIsAITyping] = useState(false);
  const [aiStatus, setAIStatus] = useState<AIStatus>({
    connected: false,
    loading: true,
    lastChecked: null
  });

  // UI state
  const [showQuickQuestions, setShowQuickQuestions] = useState(true);

  // Enhanced feedback tracking to prevent repetition
  const [feedbackHistory, setFeedbackHistory] = useState<Set<string>>(new Set());
  const [lastFeedbackTime, setLastFeedbackTime] = useState<number>(0);
  const [feedbackCount, setFeedbackCount] = useState<number>(0);

  // Direct content monitoring
  const [previousContent, setPreviousContent] = useState<string>('');
  const [lastChangeTime, setLastChangeTime] = useState<number>(Date.now());

  // Refs
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const contentMonitorRef = useRef<string>('');

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: ChatMessage = {
      id: 'welcome-' + Date.now(),
      text: "Hi! I'm your AI Writing Buddy! 🤖 I'm here to help you write amazing stories. Ask me anything about writing, or just start typing and I'll give you feedback!",
      isUser: false,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, []);

  // Check AI connection status on mount
  useEffect(() => {
    checkAIConnection();
  }, []);

  // Direct content monitoring effect
  useEffect(() => {
    if (content !== contentMonitorRef.current) {
      const prevContent = contentMonitorRef.current;
      contentMonitorRef.current = content;
      setPreviousContent(prevContent);
      setLastChangeTime(Date.now());

      // Trigger feedback analysis
      analyzeFeedbackTrigger(prevContent, content);
    }
  }, [content]);

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
      console.error('Failed to check AI connection:', error);
      setAIStatus({
        connected: false,
        loading: false,
        lastChecked: new Date()
      });
    }
  };

  const coachTip = async (paragraph: string) => {
    try {
      const response = await generateChatResponse(
        `Please provide a brief, encouraging writing tip for this paragraph: "${paragraph}". Keep it under 50 words and focus on one specific improvement.`,
        'coach'
      );
      return { tip: response };
    } catch (error) {
      console.error('Coach tip error:', error);
      throw error;
    }
  };

  // Analyze content changes for feedback triggers
  const analyzeFeedbackTrigger = async (prevContent: string, newContent: string) => {
    try {
      if (!newContent || newContent.trim().length === 0) return;

      const wordCount = newContent.trim().split(/\s+/).filter(word => word.length > 0).length;
      if (wordCount < 15) return; // Minimum threshold

      // Prevent too frequent feedback
      const now = Date.now();
      if (now - lastFeedbackTime < 8000) { // 8 second cooldown
        console.log("Skipping feedback due to cooldown");
        return;
      }

      // Check for word threshold triggers
      const thresholdResult = detectWordThreshold(prevContent, newContent, 20);
      if (thresholdResult) {
        console.log("Word threshold trigger detected:", thresholdResult);
        await provideFeedback(thresholdResult.text, thresholdResult.trigger);
        return;
      }

      // Check for new paragraphs
      const prevParas = splitParas(prevContent);
      const newParas = splitParas(newContent);
      
      if (newParas.length > prevParas.length) {
        // New paragraph created, provide feedback on the completed one
        const completedParagraph = newParas[newParas.length - 2];
        if (completedParagraph && completedParagraph.trim().split(/\s+/).length >= 20) {
          console.log("New paragraph detected:", completedParagraph);
          await provideFeedback(completedParagraph, 'paragraph_completed');
          return;
        }
      }

      // Check for significant content addition (every 30 words)
      const prevWords = prevContent.trim() ? prevContent.trim().split(/\s+/).length : 0;
      const newWords = newContent.trim() ? newContent.trim().split(/\s+/).length : 0;
      const wordDifference = newWords - prevWords;

      if (wordDifference >= 30 && newWords >= 50) {
        console.log("Significant content addition detected");
        const currentParagraph = newParas[newParas.length - 1] || newContent.slice(-200);
        await provideFeedback(currentParagraph, 'progress_milestone');
      }

    } catch (error) {
      console.error("Content analysis error:", error);
    }
  };

  // Provide feedback for given content
  const provideFeedback = async (text: string, trigger: string) => {
    try {
      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return;
      }

      // Generate a unique key for this content to prevent repetition
      const contentKey = text.trim().toLowerCase().slice(0, 50);
      if (feedbackHistory.has(contentKey)) {
        console.log("Skipping duplicate feedback for similar content");
        return;
      }

      setIsAITyping(true);
      setLastFeedbackTime(Date.now());

      const typingMessage: ChatMessage = {
        id: 'typing-' + Date.now(),
        text: '🤖 Reading your writing...',
        isUser: false,
        timestamp: new Date(),
        isTyping: true,
        isFeedback: true
      };
      setMessages(prev => [...prev, typingMessage]);

      try {
        const res = await coachTip(text);
        
        // Remove typing indicator and add real response
        setMessages(prev => {
          const withoutTyping = prev.filter(msg => !msg.isTyping);
          return [...withoutTyping, {
            id: 'coach-' + Date.now(),
            text: `✨ ${res.tip || getVariedFallbackTip(text, feedbackCount)}`,
            isUser: false,
            timestamp: new Date(),
            isFeedback: true
          }];
        });

        // Track this feedback to prevent repetition
        setFeedbackHistory(prev => new Set([...prev, contentKey]));
        setFeedbackCount(prev => prev + 1);

        // Hide quick questions after first interaction
        setShowQuickQuestions(false);

      } catch (error) {
        console.error("Coach tip failed:", error);
        
        // Remove typing indicator and add fallback response
        setMessages(prev => {
          const withoutTyping = prev.filter(msg => !msg.isTyping);
          return [...withoutTyping, {
            id: 'coach-' + Date.now(),
            text: `✨ ${getVariedFallbackTip(text, feedbackCount)}`,
            isUser: false,
            timestamp: new Date(),
            isFeedback: true
          }];
        });

        setFeedbackHistory(prev => new Set([...prev, contentKey]));
        setFeedbackCount(prev => prev + 1);
      }

    } catch (error) {
      console.error("Provide feedback error:", error);
    } finally {
      setIsAITyping(false);
    }
  };
