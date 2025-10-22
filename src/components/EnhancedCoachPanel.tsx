import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Send, MessageSquare, BarChart3, Lightbulb, Target, Star, TrendingUp, Award, List, BookOpen, AlertCircle, Loader2, FileCheck, Sparkles, AlignLeft } from 'lucide-react';
import { StepByStepWritingBuilder } from './StepByStepWritingBuilder';
import { ContextualAICoachPanel } from './ContextualAICoachPanel';
import { ComprehensiveFeedbackDisplay } from './ComprehensiveFeedbackDisplay';
import { GrammarCorrectionPanel } from './GrammarCorrectionPanel';
import { VocabularyEnhancementPanel } from './VocabularyEnhancementPanel';
import { SentenceStructurePanel } from './SentenceStructurePanel';
import { generateIntelligentResponse, type EnhancedCoachResponse } from '../lib/enhancedIntelligentResponseGenerator';
import { ComprehensiveFeedbackAnalyzer } from '../lib/comprehensiveFeedbackAnalyzer';
import { generateDynamicExamples, formatExamplesForDisplay } from '../lib/dynamicExampleGenerator';
import { ChatSessionService } from '../lib/chatSessionService';
import { NSW_MARKING_CRITERIA, generateScoringGuidance, mapToNSWScores, getImprovementExamples } from '../lib/nswMarkingCriteria';
import { NSWCriteriaCompact, NSWCriteriaDisplay } from './NSWCriteriaDisplay';

/**
 * Generates time-appropriate coaching messages for 40-minute writing test
 */
function getTimeAwareMessage(seconds: number, wordCount: number) {
  const minutes = Math.floor(seconds / 60);
  const timeRemaining = Math.max(0, 40 - minutes);

  // Calculate expected words (target: 250 words in 40 mins = 6.25 words/min)
  const expectedWords = Math.floor((250 / 40) * minutes);
  const wordsAheadBehind = wordCount - expectedWords;

  // Determine pace
  let paceEmoji = '✅';
  let paceMessage = "You're on track!";

  if (wordsAheadBehind > 50) {
    paceEmoji = '🚀';
    paceMessage = "Great pace! You're ahead of schedule.";
  } else if (wordsAheadBehind < -50 && minutes > 10) {
    paceEmoji = '⏰';
    paceMessage = "Let's pick up the pace a bit!";
  }

  // Time-based messages
  let timeMessage = '';
  let urgency = 'low';

  if (minutes < 10) {
    timeMessage = "Great start! Focus on getting your ideas flowing.";
  } else if (minutes < 20) {
    timeMessage = "Good progress! Keep developing your ideas.";
  } else if (minutes < 30) {
    timeMessage = "You're doing well! Start thinking about your conclusion.";
    urgency = 'medium';
  } else if (minutes < 35) {
    timeMessage = "Time to wrap up! Focus on a strong ending.";
    urgency = 'medium';
  } else if (minutes < 40) {
    timeMessage = "Final minutes! Review and polish your work.";
    urgency = 'high';
  } else {
    timeMessage = "Time's up! Great effort!";
    urgency = 'complete';
  }

  return {
    minutes,
    timeRemaining,
    timeMessage,
    paceEmoji,
    paceMessage,
    urgency
  };
}

/**
 * Determines the current writing phase based on word count
 * Helps students understand what they should focus on at each stage
 */
function getWritingPhase(wordCount: number) {
  if (wordCount === 0) {
    return {
      phase: 'not-started',
      name: 'Getting Started',
      emoji: '🚀',
      color: 'bg-gray-50 border-gray-200',
      darkColor: 'dark:bg-gray-800 dark:border-gray-700',
      textColor: 'text-gray-700',
      darkTextColor: 'dark:text-gray-300',
      focus: 'Begin writing your opening',
      guidance: 'Hook your reader and set the scene'
    };
  }

  if (wordCount < 50) {
    return {
      phase: 'opening',
      name: 'Opening',
      emoji: '📖',
      color: 'bg-blue-50 border-blue-200',
      darkColor: 'dark:bg-blue-900/20 dark:border-blue-800',
      textColor: 'text-blue-700',
      darkTextColor: 'dark:text-blue-300',
      focus: 'Hook the reader and introduce your topic',
      guidance: 'Set the scene, introduce character/topic, grab attention'
    };
  }

  if (wordCount < 150) {
    return {
      phase: 'development',
      name: 'Development',
      emoji: '🌱',
      color: 'bg-green-50 border-green-200',
      darkColor: 'dark:bg-green-900/20 dark:border-green-800',
      textColor: 'text-green-700',
      darkTextColor: 'dark:text-green-300',
      focus: 'Develop your ideas with details',
      guidance: 'Add descriptions, examples, dialogue, or evidence'
    };
  }

  if (wordCount < 250) {
    return {
      phase: 'rising-action',
      name: 'Rising Action',
      emoji: '⚡',
      color: 'bg-purple-50 border-purple-200',
      darkColor: 'dark:bg-purple-900/20 dark:border-purple-800',
      textColor: 'text-purple-700',
      darkTextColor: 'dark:text-purple-300',
      focus: 'Build tension and complexity',
      guidance: 'Deepen ideas, add complications, build to climax'
    };
  }

  return {
    phase: 'conclusion',
    name: 'Conclusion',
    emoji: '🎯',
    color: 'bg-orange-50 border-orange-200',
    darkColor: 'dark:bg-orange-900/20 dark:border-orange-800',
    textColor: 'text-orange-700',
    darkTextColor: 'dark:text-orange-300',
    focus: 'Wrap up your writing',
    guidance: 'Provide resolution, final thoughts, satisfying ending'
  };
}

// NSW Criteria Analysis Engine (preserved from original)
class NSWCriteriaAnalyzer {
  static analyzeContent(content: string, textType: string) {
    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
    
    return {
      ideas: this.analyzeIdeasAndContent(content, textType, wordCount),
      language: this.analyzeLanguageAndVocabulary(content, wordCount),
      structure: this.analyzeStructureAndOrganization(content, wordCount),
      grammar: this.analyzeGrammarAndSpelling(content)
    };
  }

  static analyzeIdeasAndContent(content: string, textType: string, wordCount: number) {
    let score = 1;
    let feedback = [];
    let improvements = [];

    // Basic content check
    if (wordCount === 0) {
      return {
        score: 1,
        feedback: ["Start writing to see your ideas assessment!"],
        improvements: ["Begin by addressing the prompt and developing your main ideas."]
      };
    }

    // Check for prompt engagement
    const hasPromptElements = content.toLowerCase().includes('key') || 
                             content.toLowerCase().includes('chest') || 
                             content.toLowerCase().includes('grandmother') ||
                             content.toLowerCase().includes('attic');
    
    if (hasPromptElements) {
      score += 1;
      feedback.push("Great! You're engaging with the prompt elements.");
    } else {
      improvements.push("Try to include more elements from the writing prompt in your story.");
    }

    // Check for descriptive details
    const descriptiveWords = ['beautiful', 'mysterious', 'shimmering', 'dusty', 'ornate', 'magical'];
    const hasDescriptiveLanguage = descriptiveWords.some(word => 
      content.toLowerCase().includes(word.toLowerCase())
    );

    if (hasDescriptiveLanguage) {
      score += 1;
      feedback.push("Excellent use of descriptive language to bring your story to life!");
    } else {
      improvements.push("Add more descriptive words to help readers visualize your story.");
    }

    // Check for character development
    const hasCharacterEmotions = content.toLowerCase().includes('felt') || 
                                content.toLowerCase().includes('excited') ||
                                content.toLowerCase().includes('nervous') ||
                                content.toLowerCase().includes('curious');

    if (hasCharacterEmotions) {
      score += 1;
      feedback.push("Nice work showing character emotions and feelings!");
    } else {
      improvements.push("Include more about how your character feels to create emotional connection.");
    }

    // Word count assessment
    if (wordCount >= 200) {
      score += 1;
      feedback.push("Good length - you're developing your ideas well!");
    } else if (wordCount >= 100) {
      improvements.push("Try to expand your ideas with more details and examples.");
    } else {
      improvements.push("Your story needs more development. Aim for at least 200 words.");
    }

    return {
      score: Math.min(score, 5),
      feedback,
      improvements
    };
  }

  static analyzeLanguageAndVocabulary(content: string, wordCount: number) {
    let score = 1;
    let feedback = [];
    let improvements = [];

    if (wordCount === 0) {
      return {
        score: 1,
        feedback: ["Start writing to see your language assessment!"],
        improvements: ["Begin writing to analyze your vocabulary and language use."]
      };
    }

    // Check for varied vocabulary
    const words = content.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);
    const vocabularyVariety = uniqueWords.size / words.length;

    if (vocabularyVariety > 0.7) {
      score += 2;
      feedback.push("Excellent vocabulary variety! You're using diverse words effectively.");
    } else if (vocabularyVariety > 0.5) {
      score += 1;
      feedback.push("Good vocabulary variety. Keep expanding your word choices!");
      improvements.push("Try to avoid repeating the same words too often.");
    } else {
      improvements.push("Work on using more varied vocabulary to make your writing more interesting.");
    }

    // Check for sophisticated words
    const sophisticatedWords = ['magnificent', 'extraordinary', 'mysterious', 'shimmering', 'ornate', 'ancient', 'whispered', 'discovered'];
    const hasSophisticatedVocab = sophisticatedWords.some(word => 
      content.toLowerCase().includes(word.toLowerCase())
    );

    if (hasSophisticatedVocab) {
      score += 1;
      feedback.push("Great use of sophisticated vocabulary!");
    } else {
      improvements.push("Try using more advanced vocabulary words to enhance your writing.");
    }

    // Check for sentence variety (basic check)
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = words.length / sentences.length;

    if (avgSentenceLength > 8 && avgSentenceLength < 20) {
      score += 1;
      feedback.push("Nice sentence variety and length!");
    } else {
      improvements.push("Try varying your sentence lengths - mix short and longer sentences.");
    }

    return {
      score: Math.min(score, 5),
      feedback,
      improvements
    };
  }

  static analyzeStructureAndOrganization(content: string, wordCount: number) {
    let score = 1;
    let feedback = [];
    let improvements = [];

    if (wordCount === 0) {
      return {
        score: 1,
        feedback: ["Start writing to see your structure assessment!"],
        improvements: ["Begin writing to analyze your story structure."]
      };
    }

    // Check for clear beginning
    const hasGoodOpening = content.length > 50 && (
      content.toLowerCase().includes('one day') ||
      content.toLowerCase().includes('once') ||
      content.toLowerCase().includes('afternoon') ||
      content.toLowerCase().includes('while')
    );

    if (hasGoodOpening) {
      score += 1;
      feedback.push("Good story opening! You're setting the scene well.");
    } else {
      improvements.push("Start with a clear opening that sets the scene for your reader.");
    }

    // Check for paragraphs (basic structure)
    const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
    
    if (paragraphs.length >= 3) {
      score += 1;
      feedback.push("Good use of paragraphs to organize your ideas!");
    } else if (paragraphs.length >= 2) {
      improvements.push("Consider breaking your writing into more paragraphs for better organization.");
    } else {
      improvements.push("Use paragraphs to organize different parts of your story.");
    }

    // Check for story progression
    const hasMiddleDevelopment = content.length > 100 && wordCount > 50;
    if (hasMiddleDevelopment) {
      score += 1;
      feedback.push("You're developing your story well!");
    } else {
      improvements.push("Develop the middle of your story with more events and details.");
    }

    // Check for conclusion indicators
    const hasConclusion = content.toLowerCase().includes('finally') ||
                         content.toLowerCase().includes('in the end') ||
                         content.toLowerCase().includes('then') ||
                         content.length > 200;

    if (hasConclusion) {
      score += 1;
      feedback.push("Good story development towards a conclusion!");
    } else {
      improvements.push("Work towards a satisfying ending for your story.");
    }

    return {
      score: Math.min(score, 5),
      feedback,
      improvements
    };
  }

  static analyzeGrammarAndSpelling(content: string) {
    let score = 3; // Start with average score
    let feedback = [];
    let improvements = [];

    if (content.trim().length === 0) {
      return {
        score: 1,
        feedback: ["Start writing to see your grammar assessment!"],
        improvements: ["Begin writing to analyze your grammar and spelling."]
      };
    }

    // Check for basic punctuation
    const hasPunctuation = /[.!?]/.test(content);
    if (hasPunctuation) {
      feedback.push("Good use of punctuation to end sentences!");
    } else {
      score -= 1;
      improvements.push("Remember to use punctuation marks like periods, exclamation marks, or question marks.");
    }

    // Check for capital letters at sentence beginnings
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const properCapitalization = sentences.every(sentence => {
      const trimmed = sentence.trim();
      return trimmed.length === 0 || /^[A-Z]/.test(trimmed);
    });

    if (properCapitalization && sentences.length > 0) {
      feedback.push("Excellent capitalization at the start of sentences!");
    } else if (sentences.length > 0) {
      score -= 1;
      improvements.push("Remember to start each sentence with a capital letter.");
    }

    // Check for common spelling patterns (basic check)
    const commonErrors = ['teh', 'adn', 'hte', 'recieve', 'seperate'];
    const hasCommonErrors = commonErrors.some(error => 
      content.toLowerCase().includes(error)
    );

    if (!hasCommonErrors) {
      score += 1;
      feedback.push("Great spelling accuracy!");
    } else {
      improvements.push("Double-check your spelling, especially for common words.");
    }

    // Check for dialogue punctuation if present
    if (content.includes('"')) {
      const dialoguePattern = /"[^"]*"/g;
      const dialogues = content.match(dialoguePattern);
      if (dialogues) {
        score += 1;
        feedback.push("Nice use of dialogue in your story!");
      }
    }

    return {
      score: Math.max(1, Math.min(score, 5)),
      feedback,
      improvements
    };
  }
}

// Enhanced Coach Response Generator (preserved from original)
class EnhancedCoachResponseGenerator {
  static generateResponse(content: string, textType: string, analysis: any) {
    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
    
    // Find the lowest scoring criterion to focus on
    const scores = {
      ideas: analysis.ideas.score,
      language: analysis.language.score,
      structure: analysis.structure.score,
      grammar: analysis.grammar.score
    };
    
    const lowestCriterion = Object.entries(scores).reduce((a, b) => 
      scores[a[0]] <= scores[b[0]] ? a : b
    )[0];

    const responses = {
      ideas: this.generateIdeasResponse(content, analysis.ideas, wordCount),
      language: this.generateLanguageResponse(content, analysis.language, wordCount),
      structure: this.generateStructureResponse(content, analysis.structure, wordCount),
      grammar: this.generateGrammarResponse(content, analysis.grammar, wordCount)
    };

    return responses[lowestCriterion] || this.generateGeneralResponse(content, wordCount);
  }

  static generateIdeasResponse(content: string, ideasAnalysis: any, wordCount: number) {
    if (wordCount === 0) {
      return {
        encouragement: "Ready to start your creative journey? 🌟",
        nswFocus: "Ideas & Content",
        suggestion: "Begin by thinking about the mysterious key and chest from the prompt. What makes them special?",
        example: "Try starting with: 'The old key felt warm in my hand, as if it held ancient secrets...'",
        nextStep: "Write your opening sentence and describe what you see in the attic."
      };
    }

    if (ideasAnalysis.score <= 2) {
      return {
        encouragement: "Great start! Let's develop your ideas further. 💡",
        nswFocus: "Ideas & Content",
        suggestion: "Add more specific details about the key, chest, and your character's feelings.",
        example: "Instead of 'I found a key,' try 'I discovered an ornate silver key that seemed to glow in the dusty attic light.'",
        nextStep: "Describe what your character is thinking and feeling as they hold the key."
      };
    }

    if (ideasAnalysis.score <= 3) {
      return {
        encouragement: "Your ideas are developing nicely! 🎯",
        nswFocus: "Ideas & Content",
        suggestion: "Expand on the mystery - what might be inside the chest? What does your character hope to find?",
        example: "Add thoughts like: 'Could it contain grandmother's lost treasures, or something even more magical?'",
        nextStep: "Build suspense by describing the moment before opening the chest."
      };
    }

    return {
      encouragement: "Excellent creative ideas! Your story is captivating! ⭐",
      nswFocus: "Ideas & Content",
      suggestion: "Continue developing the consequences of the discovery - how does it change your character?",
      example: "Show the impact: 'As the chest opened, everything I thought I knew about my family changed forever.'",
      nextStep: "Develop the resolution and what your character learns from this experience."
    };
  }

  static generateLanguageResponse(content: string, languageAnalysis: any, wordCount: number) {
    if (wordCount === 0) {
      return {
        encouragement: "Let's focus on using amazing vocabulary! 📚",
        nswFocus: "Language & Vocabulary",
        suggestion: "Use descriptive words to paint a picture for your readers.",
        example: "Instead of 'old chest,' try 'ancient, weathered chest' or 'mysterious, ornate chest.'",
        nextStep: "Choose vivid adjectives to describe the attic setting."
      };
    }

    if (languageAnalysis.score <= 2) {
      return {
        encouragement: "Good start! Let's enhance your word choices. 🎨",
        nswFocus: "Language & Vocabulary",
        suggestion: "Replace simple words with more interesting alternatives.",
        example: "Change 'walked' to 'crept,' 'big' to 'enormous,' or 'nice' to 'magnificent.'",
        nextStep: "Look for one simple word in your writing and replace it with a more exciting one."
      };
    }

    if (languageAnalysis.score <= 3) {
      return {
        encouragement: "Your vocabulary is improving! 🌟",
        nswFocus: "Language & Vocabulary",
        suggestion: "Add more sensory details - what does your character see, hear, smell, or feel?",
        example: "Try: 'The musty smell of old books filled my nostrils as dust particles danced in the afternoon sunlight.'",
        nextStep: "Include at least one sentence that appeals to the senses."
      };
    }

    return {
      encouragement: "Outstanding vocabulary choices! 🏆",
      nswFocus: "Language & Vocabulary",
      suggestion: "Your word variety is excellent! Consider adding figurative language like similes or metaphors.",
      example: "Try: 'The key sparkled like a fallen star' or 'My heart pounded like thunder.'",
      nextStep: "Add one simile or metaphor to make your writing even more vivid."
    };
  }

  static generateStructureResponse(content: string, structureAnalysis: any, wordCount: number) {
    if (wordCount === 0) {
      return {
        encouragement: "Let's build a well-organized story! 🏗️",
        nswFocus: "Structure & Organization",
        suggestion: "Start with a clear beginning that sets the scene.",
        example: "Open with: 'One sunny afternoon, while exploring grandmother's dusty attic...'",
        nextStep: "Write an opening sentence that tells when and where your story takes place."
      };
    }

    if (structureAnalysis.score <= 2) {
      return {
        encouragement: "Good beginning! Let's organize your story better. 📋",
        nswFocus: "Structure & Organization",
        suggestion: "Use paragraphs to separate different parts of your story.",
        example: "Start a new paragraph when you move from finding the key to opening the chest.",
        nextStep: "Break your writing into at least 2-3 paragraphs with different ideas in each."
      };
    }

    if (structureAnalysis.score <= 3) {
      return {
        encouragement: "Your story structure is developing well! 🎯",
        nswFocus: "Structure & Organization",
        suggestion: "Make sure your story has a clear beginning, middle, and end.",
        example: "Beginning: Finding the key, Middle: Opening the chest, End: What happens next.",
        nextStep: "Work on developing the middle part of your story with more events."
      };
    }

    return {
      encouragement: "Excellent story organization! 🌟",
      nswFocus: "Structure & Organization",
      suggestion: "Your structure is strong! Focus on smooth transitions between ideas.",
      example: "Use connecting words like 'suddenly,' 'then,' 'meanwhile,' or 'finally.'",
      nextStep: "Add transition words to help your story flow smoothly from one idea to the next."
    };
  }

  static generateGrammarResponse(content: string, grammarAnalysis: any, wordCount: number) {
    if (wordCount === 0) {
      return {
        encouragement: "Let's focus on clear, correct writing! ✏️",
        nswFocus: "Spelling & Grammar",
        suggestion: "Remember to start sentences with capital letters and end with punctuation.",
        example: "Every sentence should look like: 'The mysterious key was beautiful.'",
        nextStep: "Write your first sentence with proper capitalization and punctuation."
      };
    }

    if (grammarAnalysis.score <= 2) {
      return {
        encouragement: "Good effort! Let's polish your writing mechanics. 🔧",
        nswFocus: "Spelling & Grammar",
        suggestion: "Check that each sentence starts with a capital letter and ends with punctuation.",
        example: "Make sure you have: 'I found the key. It was shining brightly!'",
        nextStep: "Read through your writing and add any missing capitals or punctuation marks."
      };
    }

    if (grammarAnalysis.score <= 3) {
      return {
        encouragement: "Your grammar is improving! 📝",
        nswFocus: "Spelling & Grammar",
        suggestion: "Double-check your spelling, especially for longer words.",
        example: "Common words to check: 'beautiful,' 'mysterious,' 'grandmother,' 'discovered.'",
        nextStep: "Read your writing aloud to catch any spelling or grammar mistakes."
      };
    }

    return {
      encouragement: "Excellent grammar and spelling! 🏆",
      nswFocus: "Spelling & Grammar",
      suggestion: "Your technical accuracy is great! Try using more complex sentence structures.",
      example: "Combine sentences: 'I found the key, and it was glowing brightly in my hand.'",
      nextStep: "Experiment with joining two related sentences using 'and,' 'but,' or 'because.'"
    };
  }

  static generateGeneralResponse(content: string, wordCount: number) {
    return {
      encouragement: "Keep up the great writing! 🌟",
      nswFocus: "Overall Writing",
      suggestion: "Continue developing your story with rich details and clear organization.",
      example: "Focus on showing what happens rather than just telling.",
      nextStep: "Keep writing and let your creativity flow!"
    };
  }
}

interface EnhancedCoachPanelProps {
  content: string;
  textType: string;
  writingPrompt?: string;
  onContentChange?: (content: string) => void;
  timeElapsed?: number;
  wordCount?: number;
  analysis?: any;
  onAnalysisChange?: (analysis: any) => void;
  onApplyFix?: (fix: any) => void;
  assistanceLevel?: string;
  onAssistanceLevelChange?: (level: string) => void;
  user?: any;
  openAIConnected?: boolean;
  openAILoading?: boolean;
  onSubmitForEvaluation?: () => void;
}

export function EnhancedCoachPanel({
  content,
  textType,
  writingPrompt,
  onContentChange,
  timeElapsed = 0,
  wordCount,
  analysis,
  onAnalysisChange,
  onApplyFix,
  assistanceLevel,
  onAssistanceLevelChange,
  user,
  openAIConnected,
  openAILoading,
  onSubmitForEvaluation,
}: EnhancedCoachPanelProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentView, setCurrentView] = useState<'coach' | 'examples' | 'builder' | 'detailed' | 'nsw' | 'grammar' | 'vocabulary' | 'sentences'>('coach');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [showQuestions, setShowQuestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const responseStartTime = useRef<number>(0);

  // Generate comprehensive feedback
  const comprehensiveFeedback = useMemo(() => {
    if (!content || content.trim().length < 20) return null;

    const currentWordCount = content.trim().split(/\s+/).length;
    return ComprehensiveFeedbackAnalyzer.generateComprehensiveFeedback(
      content,
      currentWordCount,
      textType || 'narrative'
    );
  }, [content, textType]);

  // Session restoration and initialization
  useEffect(() => {
    const initializeSession = async () => {
      if (!user?.id) {
        setIsLoadingSession(false);
        return;
      }

      try {
        const latestSession = await ChatSessionService.getLatestSession(user.id);

        if (latestSession && Date.now() - new Date(latestSession.last_accessed_at).getTime() < 24 * 60 * 60 * 1000) {
          const savedMessages = await ChatSessionService.getMessages(latestSession.session_id);

          if (savedMessages.length > 0) {
            console.log('✅ Restored', savedMessages.length, 'messages from previous session');
            setMessages(savedMessages);
            setSessionId(latestSession.session_id);
          } else {
            const newSessionId = await ChatSessionService.createSession(
              user.id,
              textType,
              writingPrompt || '',
              content
            );
            setSessionId(newSessionId);
          }
        } else {
          const newSessionId = await ChatSessionService.createSession(
            user.id,
            textType,
            writingPrompt || '',
            content
          );
          setSessionId(newSessionId);
        }
      } catch (error) {
        console.error('Error initializing session:', error);
      } finally {
        setIsLoadingSession(false);
      }
    };

    initializeSession();
  }, [user?.id]);

  // Update session when content changes
  useEffect(() => {
    if (sessionId && user?.id && content) {
      const debounceTimer = setTimeout(() => {
        ChatSessionService.updateSession(sessionId, {
          userText: content,
          textType: textType,
          prompt: writingPrompt || ''
        });
      }, 2000);

      return () => clearTimeout(debounceTimer);
    }
  }, [content, sessionId, user?.id, textType, writingPrompt]);

  // Analyze content and generate coaching response
  useEffect(() => {
    if (content.trim().length > 0) {
      setIsAnalyzing(true);

      // Debounce the analysis
      const timer = setTimeout(() => {
        const currentWordCount = content.trim().split(/\s+/).length;
        const timeInfo = getTimeAwareMessage(timeElapsed, currentWordCount);
        const phaseInfo = getWritingPhase(currentWordCount);

        // Use enhanced intelligent response generator
        const enhancedResponse = generateIntelligentResponse(content, textType);

        // Also get legacy analysis for compatibility
        const analysis = NSWCriteriaAnalyzer.analyzeContent(content, textType);

        // Map to NSW scoring system
        const nswScores = mapToNSWScores(analysis);

        // Add or update the latest coaching message
        setMessages(prev => {
          const filtered = prev.filter(msg => msg.type !== 'auto-coach');
          return [...filtered, {
            type: 'auto-coach',
            content: enhancedResponse,
            timestamp: new Date(),
            analysis: analysis,
            nswScores: nswScores,
            timeInfo: timeInfo,
            phaseInfo: phaseInfo,
            enhanced: true
          }];
        });

        setIsAnalyzing(false);
      }, 1000);

      return () => clearTimeout(timer);
    } else {
      // Show welcome message when no content
      setMessages([{
        type: 'auto-coach',
        content: {
          encouragement: "Hello! I'm your AI Writing Mate! 🤖",
          nswFocus: "Getting Started",
          suggestion: "I'm here to help you write amazing stories. Start typing and I'll give you feedback!",
          example: "Try beginning with the prompt about the mysterious key in grandmother's attic.",
          nextStep: "Write your first sentence and I'll help you improve it!"
        },
        timestamp: new Date(),
        analysis: null
      }]);
    }
  }, [content, textType, timeElapsed]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessageContent = inputValue.trim();
    setInputValue('');

    responseStartTime.current = Date.now();
    setIsLoadingResponse(true);
    setLoadingProgress(0);

    const messageCount = messages.length;

    // Add user message
    const userMessage = {
      type: 'user',
      content: userMessageContent,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    if (sessionId && user?.id) {
      await ChatSessionService.saveMessage(
        sessionId,
        user.id,
        'user',
        userMessageContent,
        messageCount
      );
    }

    // Add loading message with progress simulation
    setMessages(prev => [...prev, {
      type: 'loading',
      content: 'Thinking...',
      timestamp: new Date()
    }]);

    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => Math.min(prev + 10, 90));
    }, 200);

    // Skip API call in development - use local feedback instead
    const isDevelopment = window.location.hostname === 'localhost' ||
                          window.location.hostname.includes('webcontainer');

    if (isDevelopment) {
      // Remove loading and add local response
      setTimeout(async () => {
        clearInterval(progressInterval);
        setLoadingProgress(100);

        const responseTime = Date.now() - responseStartTime.current;
        console.log(`✅ Response generated in ${responseTime}ms`);

        const assistantMessage = {
          type: 'response',
          content: {
            encouragement: "Great question!",
            nswFocus: "Writing Tip",
            suggestion: "I see you're asking: '" + userMessageContent + "'. Use the automatic feedback above for real-time tips!",
            example: "",
            nextStep: "Keep writing and watch for suggestions in the panels"
          },
          timestamp: new Date()
        };

        setMessages(prev => {
          const filtered = prev.filter(m => m.type !== 'loading');
          return [...filtered, assistantMessage];
        });

        if (sessionId && user?.id) {
          await ChatSessionService.saveMessage(
            sessionId,
            user.id,
            'assistant',
            assistantMessage.content,
            messageCount + 1
          );
        }

        setIsLoadingResponse(false);
        setLoadingProgress(0);
      }, 500);
      return;
    }

    try {
      const stage = (wordCount || 0) < 50 ? 'just starting' :
                    (wordCount || 0) < 150 ? 'developing ideas' :
                    'refining and expanding';

      const response = await fetch('/.netlify/functions/chat-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: userMessageContent,
          textType: textType || 'narrative',
          currentContent: content || '',
          wordCount: wordCount || 0,
          stage: stage,
          sessionId: `session-${Date.now()}`
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      clearInterval(progressInterval);
      setLoadingProgress(100);

      const responseTime = Date.now() - responseStartTime.current;
      console.log(`✅ Response received in ${responseTime}ms`);

      const assistantMessage = {
        type: 'response',
        content: {
          encouragement: "",
          nswFocus: "AI Writing Mate",
          suggestion: data.response || "I'm here to help with your writing!",
          example: "",
          nextStep: ""
        },
        timestamp: new Date()
      };

      // Remove loading message and add AI response
      setMessages(prev => {
        const filtered = prev.filter(m => m.type !== 'loading');
        return [...filtered, assistantMessage];
      });

      if (sessionId && user?.id) {
        await ChatSessionService.saveMessage(
          sessionId,
          user.id,
          'assistant',
          assistantMessage.content,
          messageCount + 1
        );
      }

      setIsLoadingResponse(false);
      setLoadingProgress(0);

    } catch (error) {
      clearInterval(progressInterval);
      setLoadingProgress(0);
      setIsLoadingResponse(false);

      // Silently handle the error - chat function not available in dev mode
      // Remove loading message and add fallback response
      setMessages(prev => {
        const filtered = prev.filter(m => m.type !== 'loading');
        return [...filtered, {
          type: 'response',
          content: {
            encouragement: "I'm here to help!",
            nswFocus: "Connection Issue",
            suggestion: "I'm having trouble right now, but I'm here to help! Can you try asking your question again?",
            example: "",
            nextStep: "Try asking again in a moment"
          },
          timestamp: new Date()
        }];
      });
    }
  };


  return (
    <div className="flex flex-col h-full">
      {/* OPTIMIZED: Single Header with Compact Toggle */}
      <div className="p-3 border-b bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="flex flex-col space-y-2">
          {/* Top Row: Title and Word Count */}
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">✨ Writing Mate</h2>
            <div className="text-xs text-white opacity-90 font-medium">
              {content.trim() ? `${content.trim().split(/\s+/).length} words` : '0 words'}
            </div>
          </div>

        </div>

        {/* Tab Buttons Row */}
        <div className="flex space-x-1 overflow-x-auto mt-3 pb-1">
          <button
            onClick={() => setCurrentView('coach')}
            className={`flex items-center justify-center space-x-1 px-2.5 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
              currentView === 'coach'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            <MessageSquare className="w-3 h-3" />
            <span>Chat</span>
          </button>

          <button
            onClick={() => setCurrentView('examples')}
            className={`flex items-center justify-center space-x-1 px-2.5 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
              currentView === 'examples'
                ? 'bg-white text-green-600 shadow-sm'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            <BookOpen className="w-3 h-3" />
            <span>Examples</span>
          </button>

          <button
            onClick={() => setCurrentView('builder')}
            className={`flex items-center justify-center space-x-1 px-2.5 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
              currentView === 'builder'
                ? 'bg-white text-teal-600 shadow-sm'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            <List className="w-3 h-3" />
            <span>Steps</span>
          </button>

          <button
            onClick={() => setCurrentView('detailed')}
            className={`flex items-center justify-center space-x-1 px-2.5 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0 relative ${
              currentView === 'detailed'
                ? 'bg-white text-red-600 shadow-sm'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            <Target className="w-3 h-3" />
            <span>Detail</span>
            {/* Grammar issues badge */}
            {comprehensiveFeedback && comprehensiveFeedback.grammarIssues && comprehensiveFeedback.grammarIssues.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {comprehensiveFeedback.grammarIssues.length}
              </span>
            )}
          </button>


          <button
            onClick={() => setCurrentView('grammar')}
            className={`flex items-center justify-center space-x-1 px-2.5 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
              currentView === 'grammar'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            <FileCheck className="w-3 h-3" />
            <span>Grammar</span>
          </button>

          <button
            onClick={() => setCurrentView('vocabulary')}
            className={`flex items-center justify-center space-x-1 px-2.5 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
              currentView === 'vocabulary'
                ? 'bg-white text-pink-600 shadow-sm'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Vocabulary</span>
          </button>

          <button
            onClick={() => setCurrentView('sentences')}
            className={`flex items-center justify-center space-x-1 px-2.5 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
              currentView === 'sentences'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            <AlignLeft className="w-3 h-3" />
            <span>Sentences</span>
          </button>
        </div>
      </div>

      {/* OPTIMIZED: Content Area with More Vertical Space */}
      <div className="flex-1 overflow-hidden">
        {currentView === 'coach' ? (
          <>
            {/* Messages Area - OPTIMIZED: More space, less padding */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ height: 'calc(100% - 70px)' }}>
              {/* Grammar Issues Summary - Always visible if there are issues */}
              {comprehensiveFeedback && comprehensiveFeedback.grammarIssues && comprehensiveFeedback.grammarIssues.length > 0 && (
                <div className="sticky top-0 z-10 mb-3">
                  <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <span className="font-semibold text-red-800">
                          {comprehensiveFeedback.grammarIssues.length} Grammar/Spelling Issue{comprehensiveFeedback.grammarIssues.length > 1 ? 's' : ''} Found
                        </span>
                      </div>
                      <button
                        onClick={() => setCurrentView('detailed')}
                        className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors font-medium"
                      >
                        View Details
                      </button>
                    </div>

                    {/* Show first 2 grammar issues as preview */}
                    <div className="space-y-2">
                      {comprehensiveFeedback.grammarIssues.slice(0, 2).map((issue, idx) => (
                        <div key={idx} className="bg-white p-2 rounded border border-red-200">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-red-700 uppercase">{issue.type}</span>
                            <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700">{issue.severity}</span>
                          </div>
                          <div className="text-xs mb-1">
                            <span className="text-red-600 font-medium">Found:</span> <span className="line-through">{issue.original}</span>
                          </div>
                          <div className="text-xs mb-1">
                            <span className="text-green-600 font-medium">Correct:</span> <span className="font-semibold text-green-700">{issue.correction}</span>
                          </div>
                          <div className="text-xs text-gray-600">
                            <strong>Why:</strong> {issue.explanation}
                          </div>
                        </div>
                      ))}

                      {comprehensiveFeedback.grammarIssues.length > 2 && (
                        <div className="text-xs text-center text-red-700 font-medium">
                          + {comprehensiveFeedback.grammarIssues.length - 2} more issue{comprehensiveFeedback.grammarIssues.length - 2 > 1 ? 's' : ''}
                          {' '}(click "View Details" above)
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Show, Don't Tell Teaching - Explicit guidance */}
              {comprehensiveFeedback && comprehensiveFeedback.showDontTellExamples && comprehensiveFeedback.showDontTellExamples.length > 0 && (
                <div className="mb-3">
                  <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Lightbulb className="w-5 h-5 text-yellow-600" />
                        <span className="font-semibold text-yellow-800">
                          Show, Don't Tell Opportunities
                        </span>
                      </div>
                      <button
                        onClick={() => setCurrentView('detailed')}
                        className="text-xs bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700 transition-colors font-medium"
                      >
                        Learn More
                      </button>
                    </div>

                    {/* Explicit Teaching */}
                    <div className="bg-yellow-100 border border-yellow-300 p-2 rounded mb-2">
                      <p className="text-xs font-semibold text-yellow-900 mb-1">💡 What is "Show, Don't Tell"?</p>
                      <p className="text-xs text-yellow-800">
                        Instead of telling readers how a character feels, show it through their actions, body language, and sensory details.
                        This makes your writing more vivid and engaging.
                      </p>
                    </div>

                    {/* First example */}
                    <div className="bg-white p-2 rounded border border-yellow-200">
                      <div className="text-xs mb-1">
                        <span className="text-red-600 font-medium">❌ Telling:</span> <span className="italic line-through">{comprehensiveFeedback.showDontTellExamples[0].telling}</span>
                      </div>
                      <div className="text-xs mb-1">
                        <span className="text-green-600 font-medium">✅ Showing:</span> <span className="font-semibold text-green-700">{comprehensiveFeedback.showDontTellExamples[0].showing}</span>
                      </div>
                      <div className="text-xs text-gray-600">
                        <strong>Technique:</strong> {comprehensiveFeedback.showDontTellExamples[0].technique}
                      </div>
                    </div>

                    {comprehensiveFeedback.showDontTellExamples.length > 1 && (
                      <div className="text-xs text-center text-yellow-700 font-medium mt-2">
                        + {comprehensiveFeedback.showDontTellExamples.length - 1} more example{comprehensiveFeedback.showDontTellExamples.length - 1 > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Story Arc/Plot Development Feedback */}
              {comprehensiveFeedback && comprehensiveFeedback.storyArc && wordCount >= 50 && (
                <div className="mb-3">
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                        <span className="font-semibold text-blue-800">
                          Story Structure Progress
                        </span>
                      </div>
                      <div className="text-xs bg-blue-600 text-white px-2 py-1 rounded font-medium">
                        {comprehensiveFeedback.storyArc.completeness}% Complete
                      </div>
                    </div>

                    {/* Current Stage */}
                    <div className="bg-blue-100 border border-blue-300 p-2 rounded mb-2">
                      <p className="text-xs font-semibold text-blue-900 mb-1">
                        📍 Current Stage: <span className="capitalize">{comprehensiveFeedback.storyArc.currentStage.replace('-', ' ')}</span>
                      </p>
                    </div>

                    {/* Strengths */}
                    {comprehensiveFeedback.storyArc.strengths && comprehensiveFeedback.storyArc.strengths.length > 0 && (
                      <div className="bg-white p-2 rounded border border-green-200 mb-2">
                        <p className="text-xs font-semibold text-green-700 mb-1">✅ Strengths:</p>
                        {comprehensiveFeedback.storyArc.strengths.slice(0, 2).map((strength, idx) => (
                          <p key={idx} className="text-xs text-gray-700">• {strength}</p>
                        ))}
                      </div>
                    )}

                    {/* Next Steps */}
                    {comprehensiveFeedback.storyArc.nextSteps && comprehensiveFeedback.storyArc.nextSteps.length > 0 && (
                      <div className="bg-white p-2 rounded border border-blue-200">
                        <p className="text-xs font-semibold text-blue-700 mb-1">🎯 Next Steps:</p>
                        {comprehensiveFeedback.storyArc.nextSteps.slice(0, 2).map((step, idx) => (
                          <p key={idx} className="text-xs text-gray-700">• {step}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Engagement and Pacing Feedback */}
              {comprehensiveFeedback && comprehensiveFeedback.pacing && wordCount >= 30 && (
                <div className="mb-3">
                  <div className="bg-purple-50 border-l-4 border-purple-500 p-3 rounded shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <BarChart3 className="w-5 h-5 text-purple-600" />
                        <span className="font-semibold text-purple-800">
                          Pacing & Engagement
                        </span>
                      </div>
                      <div className={`text-xs px-2 py-1 rounded font-medium ${
                        comprehensiveFeedback.pacing.overall === 'good'
                          ? 'bg-green-600 text-white'
                          : comprehensiveFeedback.pacing.overall === 'too-fast'
                          ? 'bg-orange-600 text-white'
                          : 'bg-yellow-600 text-white'
                      }`}>
                        {comprehensiveFeedback.pacing.overall === 'good' ? '✓ Good Pace' :
                         comprehensiveFeedback.pacing.overall === 'too-fast' ? '⚡ Fast Pace' : '🐌 Slow Pace'}
                      </div>
                    </div>

                    {/* Pacing Sections */}
                    {comprehensiveFeedback.pacing.sections && comprehensiveFeedback.pacing.sections.length > 0 && (
                      <div className="space-y-2">
                        {comprehensiveFeedback.pacing.sections.slice(0, 2).map((section, idx) => (
                          <div key={idx} className="bg-white p-2 rounded border border-purple-200">
                            <p className="text-xs font-semibold text-purple-700 mb-1">
                              {section.section}: <span className="font-normal text-purple-600">{section.pace}</span>
                            </p>
                            <p className="text-xs text-gray-700">
                              💡 {section.recommendation}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {comprehensiveFeedback.pacing.sections.length === 0 && (
                      <div className="bg-white p-2 rounded border border-purple-200">
                        <p className="text-xs text-gray-700">
                          ✓ Your pacing is well-balanced! Keep varying your sentence lengths to maintain reader engagement.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {messages.map((message, index) => (
                <div key={index} className={`${message.type === 'user' ? 'ml-6' : 'mr-6'}`}>
                  {message.type === 'user' ? (
                    <div className="bg-blue-500 text-white p-2 rounded-lg rounded-br-none text-sm">
                      {message.content}
                    </div>
                  ) : message.type === 'loading' ? (
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg rounded-bl-none border border-blue-200">
                      <div className="flex items-center space-x-3">
                        <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-700 mb-1">Thinking...</p>
                          {isLoadingResponse && (
                            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${loadingProgress}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-100 p-3 rounded-lg rounded-bl-none">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-5 h-5 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">🤖</span>
                        </div>
                        <span className="font-semibold text-xs text-gray-800">{message.content.encouragement}</span>
                      </div>

                      {/* TIME AND PHASE AWARENESS SECTION */}
                      {(message.timeInfo || message.phaseInfo) && (
                        <div className="mb-2 space-y-1.5">
                          {/* Time Info */}
                          {message.timeInfo && (
                            <div className={`p-2 rounded text-xs ${
                              message.timeInfo.urgency === 'high'
                                ? 'bg-red-50 border border-red-200'
                                : message.timeInfo.urgency === 'medium'
                                ? 'bg-yellow-50 border border-yellow-200'
                                : 'bg-blue-50 border border-blue-200'
                            }`}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-gray-700">
                                  ⏱️ {message.timeInfo.timeRemaining} mins left
                                </span>
                                <span className="font-medium">
                                  {message.timeInfo.paceEmoji} Pace
                                </span>
                              </div>
                              <div className={`text-xs ${
                                message.timeInfo.urgency === 'high' ? 'text-red-700 font-medium' : 'text-gray-600'
                              }`}>
                                {message.timeInfo.timeMessage}
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                {message.timeInfo.paceMessage}
                              </div>
                            </div>
                          )}

                          {/* PHASE INFO */}
                          {message.phaseInfo && (
                            <div className={`p-2 rounded text-xs border ${message.phaseInfo.color} ${message.phaseInfo.darkColor}`}>
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-base">{message.phaseInfo.emoji}</span>
                                <span className={`font-semibold ${message.phaseInfo.textColor} ${message.phaseInfo.darkTextColor}`}>
                                  {message.phaseInfo.name} Phase
                                </span>
                              </div>
                              <div className={`text-xs ${message.phaseInfo.textColor} ${message.phaseInfo.darkTextColor} font-medium mb-0.5`}>
                                🎯 Focus: {message.phaseInfo.focus}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                {message.phaseInfo.guidance}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* OPTIMIZED: Compact feedback sections */}
                      <div className="space-y-1 text-xs">
                        <div className="bg-blue-50 p-2 rounded border-l-2 border-blue-400">
                          <div className="font-medium text-blue-800">🎯 {message.content.nswFocus}</div>
                        </div>

                        <div className="bg-green-50 p-2 rounded border-l-2 border-green-400">
                          <div className="font-medium text-green-800 mb-1">💡 Suggestion:</div>
                          <div className="text-green-700 whitespace-pre-line">{message.content.suggestion}</div>
                        </div>

                        <div className="bg-yellow-50 p-2 rounded border-l-2 border-yellow-400">
                          <div className="font-medium text-yellow-800 mb-1">📝 Example:</div>
                          <div className="text-yellow-700 whitespace-pre-line">{message.content.example}</div>
                        </div>

                        {/* Quick Links to Tools based on NSW Focus */}
                        {message.content.nswFocus && (
                          <div className="bg-purple-50 p-2 rounded border border-purple-200">
                            <div className="font-medium text-purple-800 text-xs mb-1.5">🔧 Quick Tools:</div>
                            <div className="flex flex-wrap gap-1.5">
                              {(message.content.nswFocus.includes('Grammar') || message.content.nswFocus.includes('Spelling')) && (
                                <button
                                  onClick={() => setCurrentView('grammar')}
                                  className="px-2 py-1 bg-orange-100 hover:bg-orange-200 border border-orange-300 rounded text-xs font-medium text-orange-800 transition-colors flex items-center gap-1"
                                >
                                  <FileCheck className="w-3 h-3" />
                                  Fix Grammar & Spelling
                                </button>
                              )}
                              {(message.content.nswFocus.includes('Language') || message.content.nswFocus.includes('Vocabulary')) && (
                                <button
                                  onClick={() => setCurrentView('vocabulary')}
                                  className="px-2 py-1 bg-pink-100 hover:bg-pink-200 border border-pink-300 rounded text-xs font-medium text-pink-800 transition-colors flex items-center gap-1"
                                >
                                  <Sparkles className="w-3 h-3" />
                                  Enhance Vocabulary
                                </button>
                              )}
                              {message.content.nswFocus.includes('Structure') && (
                                <button
                                  onClick={() => setCurrentView('sentences')}
                                  className="px-2 py-1 bg-indigo-100 hover:bg-indigo-200 border border-indigo-300 rounded text-xs font-medium text-indigo-800 transition-colors flex items-center gap-1"
                                >
                                  <AlignLeft className="w-3 h-3" />
                                  Check Sentences
                                </button>
                              )}
                              <button
                                onClick={() => setCurrentView('detailed')}
                                className="px-2 py-1 bg-blue-100 hover:bg-blue-200 border border-blue-300 rounded text-xs font-medium text-blue-800 transition-colors flex items-center gap-1"
                              >
                                <BarChart3 className="w-3 h-3" />
                                Full Analysis
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Contextual Examples (Enhanced) */}
                        {message.content.contextualExamples && message.content.contextualExamples.length > 0 && (
                          <div className="bg-teal-50 p-2 rounded border-l-2 border-teal-400">
                            <div className="font-medium text-teal-800 mb-1">✨ {message.content.contextualExamples[0].title}</div>
                            <div className="space-y-1">
                              <div className="text-xs">
                                <span className="font-semibold text-red-600">❌ Before: </span>
                                <span className="text-red-700">{message.content.contextualExamples[0].before}</span>
                              </div>
                              <div className="text-xs">
                                <span className="font-semibold text-green-600">✅ After: </span>
                                <span className="text-green-700">{message.content.contextualExamples[0].after}</span>
                              </div>
                              <div className="text-xs text-teal-700 italic mt-1">
                                💡 {message.content.contextualExamples[0].explanation}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Show Don't Tell (Enhanced) */}
                        {message.content.showDontTell && (
                          <div className="bg-orange-50 p-2 rounded border-l-2 border-orange-400">
                            <div className="font-medium text-orange-800 mb-1">👁️ Show Don't Tell</div>
                            <div className="text-xs text-orange-700 mb-1">{message.content.showDontTell.issue}</div>
                            <div className="space-y-0.5">
                              {message.content.showDontTell.alternatives.map((alt: string, idx: number) => (
                                <div key={idx} className="text-xs text-orange-600">✓ {alt}</div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Rubric Guidance (Enhanced) */}
                        {message.content.rubricGuidance && (
                          <div className="bg-indigo-50 p-2 rounded border-l-2 border-indigo-400">
                            <div className="font-medium text-indigo-800 mb-1">📊 {message.content.rubricGuidance.criterion}</div>
                            <div className="text-xs text-indigo-700 mb-1">
                              Current: <span className="font-semibold">{message.content.rubricGuidance.currentLevel}</span>
                            </div>
                            <div className="text-xs text-indigo-600">
                              <div className="font-medium mb-0.5">Target Indicators:</div>
                              {message.content.rubricGuidance.targetIndicators.slice(0, 3).map((indicator: string, idx: number) => (
                                <div key={idx}>• {indicator}</div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="bg-purple-50 p-2 rounded border-l-2 border-purple-400">
                          <div className="font-medium text-purple-800 mb-1">⭐ Next Step:</div>
                          <div className="text-purple-700">{message.content.nextStep}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {isAnalyzing && (
                <div className="mr-6">
                  <div className="bg-gray-100 p-3 rounded-lg rounded-bl-none">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
                      <span className="text-xs text-gray-600">Analyzing your writing...</span>
                    </div>
                  </div>
                </div>
              )}


              <div ref={messagesEndRef} />
            </div>

            {/* OPTIMIZED: Compact Input Area */}
            <div className="border-t bg-gray-50">
              {/* Prepopulated Questions - Collapsible */}
              <div className="border-b border-gray-200">
                <button
                  onClick={() => setShowQuestions(!showQuestions)}
                  className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-100 transition-colors"
                >
                  <span className="text-xs font-medium text-gray-700">Quick Questions</span>
                  {showQuestions ? (
                    <ChevronUp className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  )}
                </button>

                {showQuestions && (
                  <div className="px-3 pb-3 space-y-1">
                    {[
                      "How can I make my opening more engaging?",
                      "What words can I use instead of 'said'?",
                      "How do I show, not tell, emotions?",
                      "Can you help me improve this sentence?",
                      "What's a good way to end my story?",
                      "How can I add more description?"
                    ].map((question, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setInputValue(question);
                          setShowQuestions(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs bg-white border border-gray-200 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors text-gray-700"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Input Box */}
              <div className="p-3">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask me anything about your writing..."
                    className="flex-1 px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim()}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : currentView === 'examples' ? (
          <div className="h-full overflow-hidden">
            <ContextualAICoachPanel
              content={content}
              textType={textType}
              prompt={writingPrompt}
            />
          </div>
        ) : currentView === 'builder' ? (
          <div className="h-full overflow-y-auto p-4">
            <StepByStepWritingBuilder
              textType={textType}
              content={content}
            />
          </div>
        ) : currentView === 'detailed' ? (
          <div className="h-full overflow-y-auto p-4">
            {comprehensiveFeedback ? (
              <ComprehensiveFeedbackDisplay
                feedback={comprehensiveFeedback}
                darkMode={false}
              />
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Write at least 20 words to see detailed feedback</p>
              </div>
            )}
          </div>
        ) : currentView === 'grammar' ? (
          <div className="h-full overflow-y-auto p-4">
            <GrammarCorrectionPanel
              text={content || ''}
              onApplyCorrection={(start, end, correction) => {
                if (onContentChange) {
                  const newContent = content.substring(0, start) + correction + content.substring(end);
                  onContentChange(newContent);
                }
              }}
            />
          </div>
        ) : currentView === 'vocabulary' ? (
          <div className="h-full overflow-y-auto p-4">
            <VocabularyEnhancementPanel
              text={content || ''}
              onReplaceWord={(position, originalWord, newWord) => {
                if (onContentChange) {
                  const lowerContent = content.toLowerCase();
                  const actualPosition = lowerContent.indexOf(originalWord.toLowerCase(), position);
                  if (actualPosition !== -1) {
                    const newContent = content.substring(0, actualPosition) + newWord + content.substring(actualPosition + originalWord.length);
                    onContentChange(newContent);
                  }
                }
              }}
            />
          </div>
        ) : currentView === 'sentences' ? (
          <div className="h-full overflow-y-auto p-4">
            <SentenceStructurePanel text={content || ''} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default EnhancedCoachPanel;