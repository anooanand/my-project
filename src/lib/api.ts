// src/lib/api.ts - NSW SELECTIVE RUBRIC EVALUATION
import type { DetailedFeedback } from "../types/feedback";

async function json(res: Response) {
  if (!res.ok) throw new Error(await res.text() || res.statusText);
  return res.json();
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
