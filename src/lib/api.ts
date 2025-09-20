// src/lib/api.ts - Enhanced with contextual awareness
import type { DetailedFeedback } from "../types/feedback";

// Enhanced interface for chat requests with better context
interface ChatRequest {
  userMessage: string;
  textType: string;
  currentContent: string;
  wordCount: number;
  context?: string;
}

// Enhanced interface for chat responses with context
interface ChatResponse {
  response: string;
  context?: {
    writingStage: string;
    hasDialogue: boolean;
    hasDescription: boolean;
    vocabularyLevel: string;
    specificIssues: string[];
    strengths: string[];
  };
}

async function json(res: Response) {
  if (!res.ok) throw new Error(await res.text() || res.statusText);
  return res.json();
}

// Enhanced function to handle chat responses with contextual awareness
export async function generateChatResponse(request: ChatRequest): Promise<string> {
  try {
    console.log("Sending enhanced chat request to backend:", {
      messageLength: request.userMessage.length,
      textType: request.textType,
      contentLength: request.currentContent?.length || 0,
      wordCount: request.wordCount,
      hasContent: !!request.currentContent?.trim()
    });

    const res = await fetch("/.netlify/functions/chat-response", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userMessage: request.userMessage,
        textType: request.textType,
        currentContent: request.currentContent || '',
        wordCount: request.wordCount || 0,
        context: request.context
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Chat response API error:", res.status, errorText);
      throw new Error(`HTTP ${res.status}: ${errorText}`);
    }

    const result: ChatResponse = await res.json();
    console.log("Enhanced chat response received successfully", {
      hasContext: !!result.context,
      responseLength: result.response.length
    });
    
    if (!result.response) {
      throw new Error("No response field in API result");
    }

    return result.response;

  } catch (error) {
    console.error("Chat response failed:", error);
    
    // Enhanced fallback responses with context awareness
    return getEnhancedFallbackResponse(request);
  }
}

// Enhanced fallback response function with context awareness
function getEnhancedFallbackResponse(request: ChatRequest): string {
  const { userMessage, currentContent, wordCount, textType } = request;
  const message = userMessage.toLowerCase();
  const hasContent = currentContent && currentContent.trim().length > 0;
  
  // Analyze current content for better fallback responses
  const contentAnalysis = hasContent ? analyzeContentForFallback(currentContent, wordCount) : null;
  
  if (message.includes("introduction") || message.includes("opening") || message.includes("start")) {
    if (hasContent && contentAnalysis) {
      return `I can see you've started with "${currentContent.slice(0, 30)}..." That's a ${contentAnalysis.openingQuality} beginning! ${contentAnalysis.openingSuggestion} What happens next in your story? 😊`;
    } else {
      return "Great question about openings! Try starting with dialogue, action, or an interesting detail. For example: 'The door creaked open, revealing...' What's your story going to be about?";
    }
  } else if (message.includes("vocabulary") || message.includes("word") || message.includes("synonym")) {
    if (hasContent && contentAnalysis?.simpleWordsFound.length > 0) {
      const word = contentAnalysis.simpleWordsFound[0];
      const suggestions = getWordSuggestions(word);
      return `I noticed you used "${word}" in your writing. Try replacing it with: ${suggestions.join(', ')}. Which one fits your story best?`;
    } else {
      return "For better vocabulary, try replacing simple words with more descriptive ones. Instead of 'big', try 'enormous' or 'massive'. What specific word would you like help with?";
    }
  } else if (message.includes("character") || message.includes("people")) {
    if (hasContent && contentAnalysis?.hasCharacters) {
      return "I can see you have characters in your story! To make them more interesting, show their personality through their actions and words. What does your main character want or fear?";
    } else {
      return "To create interesting characters, give them unique traits, goals, and problems. What kind of character is in your story? Tell me about them! 😊";
    }
  } else if (message.includes("dialogue") || message.includes("talking") || message.includes("conversation")) {
    if (hasContent && contentAnalysis?.hasDialogue) {
      return "I see you're already using dialogue - that's great! Remember to start a new line each time someone different speaks, and use action to show how they're feeling. What are your characters discussing?";
    } else if (hasContent) {
      return "Adding dialogue can make your story come alive! Try having your characters speak to each other. For example: 'Where are we going?' asked Sarah nervously. What might your characters say?";
    } else {
      return "Dialogue makes stories exciting! When characters talk, it shows their personality and moves the story forward. What conversation could happen in your story?";
    }
  } else if (message.includes("description") || message.includes("describe") || message.includes("details")) {
    if (hasContent && contentAnalysis?.hasDescription) {
      return "You're doing well with description! Try adding more sensory details - what can your character see, hear, smell, or feel? This helps readers imagine the scene.";
    } else if (hasContent) {
      return "Great question! Look at this part of your story and add more details. Instead of just saying what happened, describe how it looked, sounded, or felt. What details would help readers picture the scene?";
    } else {
      return "Description helps readers picture your story! Use your five senses - what does your character see, hear, smell, taste, or touch? Start with one scene and describe it in detail.";
    }
  } else if (message.includes("conclusion") || message.includes("ending") || message.includes("finish")) {
    if (hasContent && wordCount > 100) {
      return "For your ending, think about how your character has changed from the beginning. Look back at how you started - can you connect your ending to that opening? What's the main message of your story?";
    } else if (hasContent) {
      return "You're building a good story! For the ending, think about what your character learns or how they solve their problem. How do you want your reader to feel when they finish?";
    } else {
      return "For a strong conclusion, show how your character has changed or learned something. What's the most important thing that happens in your story?";
    }
  } else if (message.includes("structure") || message.includes("organize") || message.includes("paragraphs")) {
    if (hasContent) {
      const paragraphCount = currentContent.split('\n\n').length;
      if (paragraphCount === 1) {
        return "Try breaking your story into paragraphs! Start a new paragraph when you change to a new idea, place, or time. Where could you add paragraph breaks in your current writing?";
      } else {
        return "Your paragraph structure is developing well! Make sure each paragraph focuses on one main idea. Are there any paragraphs that could be split or combined?";
      }
    } else {
      return "Good story structure has a clear beginning (introduce characters and setting), middle (problem or adventure), and end (solution or conclusion). What part would you like to work on first?";
    }
  } else {
    if (hasContent && contentAnalysis) {
      const stage = wordCount < 50 ? "getting started" : wordCount < 150 ? "developing your ideas" : "expanding your story";
      return `I can see you're ${stage} with ${wordCount} words. ${contentAnalysis.encouragement} What specific part would you like help with? 😊`;
    } else {
      return "I'm here to help with your writing! Start by telling me what you want to write about, or ask me about any part of writing you'd like help with. 😊";
    }
  }
}

// Helper function to analyze content for better fallback responses
function analyzeContentForFallback(content: string, wordCount: number) {
  const text = content.toLowerCase();
  
  const analysis = {
    hasDialogue: /["']/.test(content),
    hasDescription: /\b(beautiful|dark|bright|huge|tiny|mysterious|ancient|sparkling|glistening|enormous|massive)\b/i.test(text),
    hasCharacters: /\b(he|she|they|character|person|boy|girl|man|woman|i)\b/i.test(text),
    hasAction: /\b(ran|jumped|walked|moved|grabbed|threw|caught|fell|climbed)\b/i.test(text),
    openingQuality: 'good',
    openingSuggestion: 'Try adding more specific details to hook your reader.',
    simpleWordsFound: [] as string[],
    encouragement: "That's great progress!"
  };

  // Check for simple words that could be improved
  const simpleWords = ['said', 'big', 'small', 'good', 'bad', 'nice', 'went', 'got', 'very', 'really'];
  analysis.simpleWordsFound = simpleWords.filter(word => text.includes(word));

  // Determine opening quality
  if (content.startsWith('"') || /^[A-Z][a-z]+ (ran|jumped|screamed|whispered)/.test(content)) {
    analysis.openingQuality = 'strong';
    analysis.openingSuggestion = 'You have an engaging opening!';
  } else if (/^(Once|One day|Long ago|It was|There was)/.test(content)) {
    analysis.openingQuality = 'traditional';
    analysis.openingSuggestion = 'Consider starting with action or dialogue to grab attention immediately.';
  }

  // Customize encouragement based on content
  if (wordCount > 200) {
    analysis.encouragement = "You've written a substantial story!";
  } else if (wordCount > 100) {
    analysis.encouragement = "Your story is developing nicely!";
  } else if (wordCount > 50) {
    analysis.encouragement = "You're building a good foundation!";
  }

  return analysis;
}

// Helper function to get word suggestions
function getWordSuggestions(word: string): string[] {
  const suggestions: Record<string, string[]> = {
    'said': ['whispered', 'exclaimed', 'muttered', 'declared'],
    'big': ['enormous', 'massive', 'gigantic', 'colossal'],
    'small': ['tiny', 'miniature', 'petite', 'minuscule'],
    'good': ['excellent', 'wonderful', 'fantastic', 'remarkable'],
    'bad': ['terrible', 'awful', 'dreadful', 'horrible'],
    'nice': ['delightful', 'pleasant', 'charming', 'lovely'],
    'went': ['rushed', 'strolled', 'wandered', 'hurried'],
    'got': ['received', 'obtained', 'discovered', 'acquired'],
    'very': ['extremely', 'incredibly', 'remarkably', 'exceptionally'],
    'really': ['truly', 'genuinely', 'absolutely', 'completely']
  };
  
  return suggestions[word.toLowerCase()] || ['more descriptive', 'more specific', 'more interesting'];
}

// NSW Selective School Writing Assessment Rubric
function evaluateWithNSWRubric(essayText: string, textType: string): DetailedFeedback {
  const text = essayText.trim();
  const words = text.split(/\s+/).filter(word => word.length > 0);
  const wordCount = words.length;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  
  // NSW Selective Rubric Scoring (1-5 scale)
  let ideasScore = evaluateIdeasContent(text, wordCount, textType);
  let structureScore = evaluateStructureOrganization(text, paragraphs, sentences, textType);
  let languageScore = evaluateLanguageVocabulary(text, words, wordCount);
  let spagScore = evaluateSpellingPunctuationGrammar(text, words);
  
  // Calculate weighted overall score (out of 100)
  const overallScore = Math.round(
    (ideasScore * 30 + structureScore * 25 + languageScore * 25 + spagScore * 20) / 5
  );
  
  const safeEnd = Math.min(text.length, 50);
  const sampleText = text.slice(0, safeEnd) || "your writing";
  
  return {
    overallScore,
    criteria: {
      ideasContent: {
        score: ideasScore,
        weight: 30,
        strengths: generateStrengths(ideasScore, 'ideas'),
        improvements: generateImprovements(ideasScore, 'ideas', sampleText, safeEnd)
      },
      structureOrganization: {
        score: structureScore,
        weight: 25,
        strengths: generateStrengths(structureScore, 'structure'),
        improvements: generateImprovements(structureScore, 'structure', sampleText, safeEnd)
      },
      languageVocab: {
        score: languageScore,
        weight: 25,
        strengths: generateStrengths(languageScore, 'language'),
        improvements: generateImprovements(languageScore, 'language', sampleText, safeEnd)
      },
      spellingPunctuationGrammar: {
        score: spagScore,
        weight: 20,
        strengths: generateStrengths(spagScore, 'spag'),
        improvements: generateImprovements(spagScore, 'spag', sampleText, safeEnd)
      }
    },
    grammarCorrections: generateGrammarCorrections(text),
    vocabularyEnhancements: generateVocabularyEnhancements(text, words),
    narrativeStructure: textType === "narrative" ? evaluateNarrativeStructure(text, paragraphs, wordCount) : undefined,
    timings: { modelLatencyMs: 1200 },
    modelVersion: "nsw-rubric-v2.0",
    id: `feedback-${Date.now()}-${Math.random().toString(36).slice(2)}`
  };
}

// NSW Rubric: Ideas & Content (30%)
function evaluateIdeasContent(text: string, wordCount: number, textType: string): number {
  let score = 1;
  
  // Basic content presence
  if (wordCount >= 30) score = 2;
  if (wordCount >= 80) score = 3;
  
  // Content quality indicators
  const hasDialogue = text.includes('"') || text.includes("'");
  const hasDescriptiveWords = /\b(beautiful|amazing|incredible|magnificent|terrifying|mysterious|enormous|tiny|brilliant|sparkling)\b/i.test(text);
  const hasEmotionalContent = /\b(felt|excited|scared|happy|sad|worried|surprised|amazed)\b/i.test(text);
  const hasSpecificDetails = /\b(suddenly|carefully|quietly|loudly|slowly|quickly)\b/i.test(text);
  
  if (textType === 'narrative') {
    if (hasDialogue) score++;
    if (hasDescriptiveWords) score++;
    if (hasEmotionalContent) score++;
    if (hasSpecificDetails && wordCount >= 150) score++;
  } else if (textType === 'persuasive') {
    const hasArguments = /\b(because|therefore|however|although|firstly|secondly|finally)\b/i.test(text);
    const hasExamples = /\b(for example|such as|like|including)\b/i.test(text);
    if (hasArguments) score++;
    if (hasExamples) score++;
    if (wordCount >= 120) score++;
  } else if (textType === 'informative') {
    const hasFacts = /\b(research|studies|scientists|experts|data|statistics)\b/i.test(text);
    const hasExplanations = /\b(this means|in other words|as a result|consequently)\b/i.test(text);
    if (hasFacts) score++;
    if (hasExplanations) score++;
    if (wordCount >= 100) score++;
  }
  
  return Math.min(5, score);
}

// NSW Rubric: Structure & Organization (25%)
function evaluateStructureOrganization(text: string, paragraphs: any[], sentences: any[], textType: string): number {
  let score = 1;
  
  // Basic structure
  if (sentences.length >= 3) score = 2;
  if (paragraphs.length >= 2) score = 3;
  
  // Advanced structure indicators
  const hasTransitions = /\b(first|then|next|after|finally|meanwhile|suddenly|later|before|during)\b/i.test(text);
  const hasConnectives = /\b(and|but|so|because|although|however|therefore|moreover)\b/i.test(text);
  const hasTimeSequence = /\b(morning|afternoon|evening|yesterday|today|tomorrow|once|when)\b/i.test(text);
  
  if (hasTransitions) score++;
  if (hasConnectives && paragraphs.length >= 2) score++;
  
  // Text-type specific structure
  if (textType === 'narrative') {
    const hasOpening = /\b(once|one day|long ago|it was|there was)\b/i.test(text.slice(0, 100));
    const hasEnding = /\b(the end|finally|at last|from then on|ever since)\b/i.test(text.slice(-100));
    if (hasOpening || hasEnding) score++;
  }
  
  return Math.min(5, score);
}

// NSW Rubric: Language & Vocabulary (25%)
function evaluateLanguageVocabulary(text: string, words: string[], wordCount: number): number {
  let score = 1;
  
  // Vocabulary diversity
  const uniqueWords = new Set(words.map(w => w.toLowerCase()));
  const vocabularyRatio = uniqueWords.size / wordCount;
  
  if (vocabularyRatio > 0.6) score = 2;
  if (vocabularyRatio > 0.7) score = 3;
  
  // Advanced vocabulary indicators
  const hasLongWords = words.some(word => word.length > 7);
  const hasVariedSentences = /[,;:]/.test(text);
  const hasDescriptiveLanguage = /\b(adjective|adverb)\b/i.test(text) || 
    /\b(shimmering|glistening|towering|whispering|thunderous|delicate|massive|ancient)\b/i.test(text);
  
  if (hasLongWords) score++;
  if (hasVariedSentences) score++;
  if (hasDescriptiveLanguage) score++;
  
  return Math.min(5, score);
}

// NSW Rubric: Spelling, Punctuation & Grammar (20%)
function evaluateSpellingPunctuationGrammar(text: string, words: string[]): number {
  let score = 1;
  
  // Basic mechanics
  const hasCapitalization = /^[A-Z]/.test(text);
  const hasPunctuation = /[.!?]$/.test(text.trim());
  const hasInternalPunctuation = /[,.!?;:]/.test(text);
  
  if (hasCapitalization) score++;
  if (hasPunctuation) score++;
  if (hasInternalPunctuation) score++;
  
  // Advanced mechanics
  const hasQuotationMarks = /["']/.test(text);
  const hasApostrophes = /\b\w+'\w+\b/.test(text); // contractions or possessives
  const hasVariedPunctuation = /[;:,]/.test(text);
  
  if (hasQuotationMarks) score++;
  if (hasApostrophes || hasVariedPunctuation) score++;
  
  return Math.min(5, score);
}

// Generate strengths based on score
function generateStrengths(score: number, criterion: string): any[] {
  const strengths = [];
  
  if (score >= 3) {
    switch (criterion) {
      case 'ideas':
        strengths.push({ text: "Shows creative thinking and imagination", start: 0, end: 30 });
        if (score >= 4) strengths.push({ text: "Engaging and well-developed content", start: 0, end: 30 });
        break;
      case 'structure':
        strengths.push({ text: "Clear organization with logical flow", start: 0, end: 30 });
        if (score >= 4) strengths.push({ text: "Effective use of paragraphs and transitions", start: 0, end: 30 });
        break;
      case 'language':
        strengths.push({ text: "Good vocabulary choices for age level", start: 0, end: 30 });
        if (score >= 4) strengths.push({ text: "Varied and sophisticated language use", start: 0, end: 30 });
        break;
      case 'spag':
        strengths.push({ text: "Generally accurate spelling and punctuation", start: 0, end: 30 });
        if (score >= 4) strengths.push({ text: "Excellent control of grammar and mechanics", start: 0, end: 30 });
        break;
    }
  }
  
  return strengths;
}

// Generate improvements based on score
function generateImprovements(score: number, criterion: string, sampleText: string, safeEnd: number): any[] {
  const improvements = [];
  
  if (score < 4) {
    switch (criterion) {
      case 'ideas':
        if (score < 3) {
          improvements.push({
            issue: "Needs more creative and detailed ideas",
            evidence: { text: sampleText, start: 0, end: safeEnd },
            suggestion: "Add more specific details, examples, and creative elements to engage your reader"
          });
        }
        improvements.push({
          issue: "Could develop ideas more fully",
          evidence: { text: sampleText, start: 0, end: safeEnd },
          suggestion: "Expand your main ideas with more description and character development"
        });
        break;
      case 'structure':
        if (score < 3) {
          improvements.push({
            issue: "Needs clearer organization and structure",
            evidence: { text: sampleText, start: 0, end: safeEnd },
            suggestion: "Organize your writing into clear paragraphs with a beginning, middle, and end"
          });
        }
        improvements.push({
          issue: "Could use more connecting words",
          evidence: { text: sampleText, start: 0, end: safeEnd },
          suggestion: "Use transition words like 'first', 'then', 'finally' to link your ideas"
        });
        break;
      case 'language':
        if (score < 3) {
          improvements.push({
            issue: "Needs more varied vocabulary",
            evidence: { text: sampleText, start: 0, end: safeEnd },
            suggestion: "Try using more interesting and descriptive words instead of simple ones"
          });
        }
        improvements.push({
          issue: "Could use more sophisticated language",
          evidence: { text: sampleText, start: 0, end: safeEnd },
          suggestion: "Include more advanced vocabulary and varied sentence structures"
        });
        break;
      case 'spag':
        if (score < 3) {
          improvements.push({
            issue: "Needs attention to spelling and punctuation",
            evidence: { text: sampleText, start: 0, end: safeEnd },
            suggestion: "Check your spelling and use proper punctuation marks"
          });
        }
        improvements.push({
          issue: "Could improve grammar and mechanics",
          evidence: { text: sampleText, start: 0, end: safeEnd },
          suggestion: "Review your sentences for correct grammar and punctuation"
        });
        break;
    }
  }
  
  return improvements;
}

// Generate grammar corrections
function generateGrammarCorrections(text: string): any[] {
  const corrections = [];
  
  // Simple grammar checks
  if (text.includes(' i ')) {
    corrections.push({
      original: " i ",
      replacement: " I ",
      explanation: "The pronoun 'I' should always be capitalized",
      start: text.indexOf(' i '),
      end: text.indexOf(' i ') + 3
    });
  }
  
  return corrections;
}

// Generate vocabulary enhancements
function generateVocabularyEnhancements(text: string, words: string[]): any[] {
  const enhancements = [];
  
  // Simple vocabulary suggestions
  const simpleWords = ['big', 'small', 'good', 'bad', 'nice', 'said'];
  const betterWords = ['enormous', 'tiny', 'excellent', 'terrible', 'wonderful', 'exclaimed'];
  
  simpleWords.forEach((word, index) => {
    if (text.toLowerCase().includes(word)) {
      enhancements.push({
        original: word,
        replacement: betterWords[index],
        explanation: `Consider using '${betterWords[index]}' for more impact`,
        start: text.toLowerCase().indexOf(word),
        end: text.toLowerCase().indexOf(word) + word.length
      });
    }
  });
  
  return enhancements.slice(0, 3); // Limit to 3 suggestions
}

// Evaluate narrative structure
function evaluateNarrativeStructure(text: string, paragraphs: any[], wordCount: number): any {
  const hasOrientation = /\b(once|one day|long ago|it was|there was|in a|at the)\b/i.test(text.slice(0, 100));
  const hasComplication = wordCount >= 80 && /\b(but|however|suddenly|then|problem|trouble|danger)\b/i.test(text);
  const hasClimax = wordCount >= 120 && /\b(finally|at last|suddenly|crash|bang|scream|realized)\b/i.test(text);
  const hasResolution = /\b(the end|finally|at last|from then on|ever since|happily|safely)\b/i.test(text.slice(-100));
  
  return {
    orientationPresent: hasOrientation,
    complicationPresent: hasComplication,
    climaxPresent: hasClimax,
    resolutionPresent: hasResolution,
    notes: wordCount < 50 ? "Story needs significant development to show all narrative elements" : 
           wordCount < 100 ? "Story shows some narrative elements but needs more development" :
           "Good narrative structure with clear story elements"
  };
}

export async function evaluateEssay(payload: {
  essayText: string;
  textType: "narrative" | "persuasive" | "informative";
  assistanceLevel?: "minimal" | "standard" | "comprehensive";
  examMode?: boolean;
}): Promise<DetailedFeedback> {
  // If no text, return early error
  if (!payload.essayText || payload.essayText.trim().length === 0) {
    throw new Error("Please write some text before submitting for evaluation");
  }

  try {
    console.log("Attempting to call Netlify function...");
    const res = await fetch("/.netlify/functions/ai-feedback", {
      method: "POST", 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errorText}`);
    }
    
    const result = await res.json();
    console.log("Netlify function succeeded:", result);
    return result;
    
  } catch (error) {
    console.warn("Netlify function failed, using NSW rubric analysis:", error);
    
    // Return NSW Selective rubric-based analysis
    return evaluateWithNSWRubric(payload.essayText, payload.textType);
  }
}

export async function coachTip(paragraph: string): Promise<{ tip: string; exampleRewrite?: string }> {
  try {
    const res = await fetch("/.netlify/functions/coach-tip", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paragraph })
    });
    return json(res);
  } catch (error) {
    return {
      tip: "Keep writing! Focus on clear, descriptive language and good sentence structure.",
      exampleRewrite: undefined
    };
  }
}

export async function saveDraft(id: string, text: string, version: number) {
  try {
    const res = await fetch(`/.netlify/functions/drafts?id=${encodeURIComponent(id)}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, version, ts: Date.now() })
    });
    return json(res);
  } catch (error) {
    console.warn("Draft save failed:", error);
    return { success: false };
  }
}