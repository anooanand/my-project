/**
 * Enhanced AI Feedback Service
 *
 * Provides context-specific, detailed feedback with literary techniques,
 * dialogue examples, and emotion vocabulary. Uses dynamic content from
 * configuration to avoid hardcoding.
 */

import {
  getLiteraryTechniquesByType,
  getRandomExamples,
  getEmotionAlternatives,
  getRandomSentenceStarters,
  dialogueTechniques,
  emotionVocabulary,
  type LiteraryTechnique
} from '../config/writingEnhancements';

export interface FeedbackSuggestion {
  type: 'literary_technique' | 'dialogue' | 'emotion_vocabulary' | 'sentence_starter' | 'structure';
  title: string;
  description: string;
  examples: string[];
  relevance: 'high' | 'medium' | 'low';
  actionable: string; // What the student should do
}

export interface EnhancedFeedback {
  overall: string;
  suggestions: FeedbackSuggestion[];
  strengths: string[];
  areasToImprove: string[];
  nextSteps: string[];
}

/**
 * Analyzes text to identify basic emotions that could be enhanced
 */
function identifyBasicEmotions(text: string): string[] {
  const basicEmotions = emotionVocabulary.map(e => e.basic);
  const found: string[] = [];

  const lowerText = text.toLowerCase();
  basicEmotions.forEach(emotion => {
    const regex = new RegExp(`\\b${emotion}\\b`, 'i');
    if (regex.test(lowerText)) {
      found.push(emotion);
    }
  });

  return found;
}

/**
 * Detects potential dialogue in text
 */
function hasDialogue(text: string): boolean {
  return /["']/.test(text);
}

/**
 * Counts sentence variety (simple heuristic)
 */
function analyzeSentenceVariety(text: string): {
  variety: 'low' | 'medium' | 'high';
  averageLength: number;
  sentenceCount: number;
} {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const sentenceCount = sentences.length;

  if (sentenceCount === 0) {
    return { variety: 'low', averageLength: 0, sentenceCount: 0 };
  }

  const lengths = sentences.map(s => s.trim().split(/\s+/).length);
  const averageLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;

  // Calculate variance
  const variance = lengths.reduce((sum, len) => sum + Math.pow(len - averageLength, 2), 0) / lengths.length;
  const stdDev = Math.sqrt(variance);

  // High variety = high standard deviation in sentence length
  const variety = stdDev > 5 ? 'high' : stdDev > 2 ? 'medium' : 'low';

  return { variety, averageLength, sentenceCount };
}

/**
 * Detects use of literary techniques in text
 */
function detectLiteraryTechniques(text: string, writingType: string): LiteraryTechnique[] {
  const techniques = getLiteraryTechniquesByType(writingType);
  const detected: LiteraryTechnique[] = [];

  const lowerText = text.toLowerCase();

  // Check for similes
  if ((/\bas\b.*\bas\b|\blike\b/).test(lowerText)) {
    const simile = techniques.find(t => t.id === 'simile');
    if (simile) detected.push(simile);
  }

  // Check for alliteration (basic detection)
  const words = text.split(/\s+/);
  for (let i = 0; i < words.length - 2; i++) {
    const firstLetters = words.slice(i, i + 3).map(w => w[0]?.toLowerCase());
    if (firstLetters[0] === firstLetters[1] && firstLetters[1] === firstLetters[2]) {
      const alliteration = techniques.find(t => t.id === 'alliteration');
      if (alliteration && !detected.includes(alliteration)) {
        detected.push(alliteration);
      }
      break;
    }
  }

  // Check for onomatopoeia
  const onomatopoeiaWords = ['bang', 'crash', 'whoosh', 'buzz', 'hiss', 'splash', 'pop', 'sizzle'];
  if (onomatopoeiaWords.some(word => lowerText.includes(word))) {
    const onomatopoeia = techniques.find(t => t.id === 'onomatopoeia');
    if (onomatopoeia) detected.push(onomatopoeia);
  }

  return detected;
}

/**
 * Generate enhanced, context-specific feedback
 */
export function generateEnhancedFeedback(
  text: string,
  writingType: string,
  wordCount: number
): EnhancedFeedback {
  const suggestions: FeedbackSuggestion[] = [];
  const strengths: string[] = [];
  const areasToImprove: string[] = [];
  const nextSteps: string[] = [];

  // Analyze text
  const basicEmotions = identifyBasicEmotions(text);
  const hasDialogueContent = hasDialogue(text);
  const sentenceAnalysis = analyzeSentenceVariety(text);
  const detectedTechniques = detectLiteraryTechniques(text, writingType);
  const availableTechniques = getLiteraryTechniquesByType(writingType);

  // Word count feedback
  let overall = '';
  if (wordCount < 50) {
    overall = "Great start! Let's develop your ideas further with more details and descriptions.";
    areasToImprove.push('Add more details to develop your ideas');
  } else if (wordCount < 150) {
    overall = "Good progress! Your writing is developing nicely. Let's make it even more vivid and engaging.";
    strengths.push('You\'re building your content well');
  } else if (wordCount < 300) {
    overall = "Excellent work! Your writing is well-developed. Let's add some finishing touches.";
    strengths.push('Strong content development');
  } else {
    overall = "Fantastic! You've written a substantial piece. Let's polish and enhance it.";
    strengths.push('Comprehensive content');
  }

  // Literary Techniques Suggestions
  if (detectedTechniques.length > 0) {
    strengths.push(`Great use of ${detectedTechniques.map(t => t.name.toLowerCase()).join(' and ')}!`);
  }

  // Suggest techniques they haven't used
  const unusedTechniques = availableTechniques.filter(
    t => !detectedTechniques.includes(t)
  ).slice(0, 2);

  unusedTechniques.forEach(technique => {
    suggestions.push({
      type: 'literary_technique',
      title: `Try using ${technique.name}`,
      description: technique.description,
      examples: getRandomExamples(technique, 2),
      relevance: 'high',
      actionable: `Look for a place in your writing where you could add ${technique.name.toLowerCase()}. For example, you could try: "${getRandomExamples(technique, 1)[0]}"`
    });
  });

  // Dialogue suggestions (for narrative/descriptive writing)
  if ((writingType === 'narrative' || writingType === 'descriptive') && hasDialogueContent) {
    const showDontTell = dialogueTechniques.find(d => d.id === 'show_dont_tell');
    if (showDontTell) {
      strengths.push('You\'re using dialogue in your writing');

      suggestions.push({
        type: 'dialogue',
        title: showDontTell.name,
        description: showDontTell.description,
        examples: showDontTell.examples.map(ex =>
          `Instead of: "${ex.telling}"\nTry: "${ex.showing}"`
        ).slice(0, 2),
        relevance: 'high',
        actionable: 'Review your dialogue and add actions or body language to show emotions instead of just telling us.'
      });
    }
  } else if ((writingType === 'narrative' || writingType === 'descriptive') && !hasDialogueContent && wordCount > 100) {
    areasToImprove.push('Consider adding dialogue to bring your story to life');
    nextSteps.push('Try adding a conversation between characters');
  }

  // Emotion vocabulary suggestions
  if (basicEmotions.length > 0) {
    const emotion = basicEmotions[0];
    const alternatives = getEmotionAlternatives(emotion);

    if (alternatives) {
      suggestions.push({
        type: 'emotion_vocabulary',
        title: `Enhance emotion words: "${emotion}"`,
        description: `Instead of "${emotion}", try these more powerful words`,
        examples: alternatives.alternatives.slice(0, 4),
        relevance: 'medium',
        actionable: `Replace "${emotion}" with a more specific emotion word. ${alternatives.context}`
      });
    }
  }

  // Sentence starters suggestion
  const starters = getRandomSentenceStarters(writingType, 4);
  if (starters.length > 0 && sentenceAnalysis.variety === 'low') {
    suggestions.push({
      type: 'sentence_starter',
      title: 'Vary your sentence beginnings',
      description: 'Using different sentence starters makes your writing more interesting',
      examples: starters,
      relevance: 'medium',
      actionable: 'Try starting some of your sentences with these phrases to add variety.'
    });

    areasToImprove.push('Add more variety to sentence beginnings');
  } else if (sentenceAnalysis.variety === 'high') {
    strengths.push('Great sentence variety!');
  }

  // Sentence length feedback
  if (sentenceAnalysis.averageLength < 8 && sentenceAnalysis.sentenceCount > 3) {
    areasToImprove.push('Try combining some short sentences for better flow');
    nextSteps.push('Use connectives like "and", "but", or "because" to join related ideas');
  } else if (sentenceAnalysis.averageLength > 20) {
    areasToImprove.push('Some sentences might be too long - try breaking them into shorter ones');
  } else if (sentenceAnalysis.sentenceCount > 5) {
    strengths.push('Good sentence length balance');
  }

  // Writing type-specific suggestions
  if (writingType === 'narrative') {
    nextSteps.push('Make sure your story has a clear beginning, middle, and end');
    nextSteps.push('Use the Story Mountain tool to plan your narrative arc');
  } else if (writingType === 'persuasive') {
    nextSteps.push('State your opinion clearly and support it with reasons');
    nextSteps.push('Use the Argument Flow Checklist to structure your points');
  } else if (writingType === 'descriptive') {
    nextSteps.push('Engage all five senses in your descriptions');
    nextSteps.push('Try the Sensory Explorer tool for vivid vocabulary');
  }

  // Ensure we have at least some content
  if (suggestions.length === 0 && wordCount > 50) {
    const technique = availableTechniques[Math.floor(Math.random() * availableTechniques.length)];
    suggestions.push({
      type: 'literary_technique',
      title: `Try ${technique.name}`,
      description: technique.description,
      examples: getRandomExamples(technique, 2),
      relevance: 'medium',
      actionable: `Add ${technique.name.toLowerCase()} to make your writing more engaging.`
    });
  }

  if (areasToImprove.length === 0 && wordCount > 100) {
    areasToImprove.push('Keep refining and polishing your work');
  }

  if (nextSteps.length === 0) {
    nextSteps.push('Keep writing and developing your ideas!');
  }

  return {
    overall,
    suggestions: suggestions.slice(0, 4), // Limit to 4 most relevant
    strengths: strengths.slice(0, 3),
    areasToImprove: areasToImprove.slice(0, 3),
    nextSteps: nextSteps.slice(0, 3)
  };
}

/**
 * Get technique examples by ID (for on-demand access)
 */
export function getTechniqueExamples(techniqueId: string): string[] {
  const allTechniques = [
    ...getLiteraryTechniquesByType('narrative'),
    ...getLiteraryTechniquesByType('descriptive'),
    ...getLiteraryTechniquesByType('persuasive')
  ];

  const technique = allTechniques.find(t => t.id === techniqueId);
  return technique ? technique.examples : [];
}

/**
 * Get dialogue tips
 */
export function getDialogueTips(): string[] {
  return dialogueTechniques.flatMap(d => d.tips);
}
