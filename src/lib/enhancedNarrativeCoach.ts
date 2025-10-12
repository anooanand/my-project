/**
 * Enhanced Narrative Writing Coach
 *
 * Provides contextual, rubric-aligned coaching for narrative writing
 * with dynamic examples based on student's current content and stage
 */

import { narrativeRubric } from './nswRubricCriteria';
import { analyzeShowDontTell, getSuggestionForTelling } from './showDontTellAnalyzer';

export interface NarrativeStage {
  id: string;
  name: string;
  detected: boolean;
  wordCount: number;
}

export interface ContextualExample {
  category: string;
  before: string;
  after: string;
  explanation: string;
  rubricConnection: string;
}

export interface NarrativeCoachingFeedback {
  currentStage: string;
  stageProgress: number;
  rubricAlignment: {
    contentAndIdeas: number;
    textStructure: number;
    languageFeatures: number;
    conventions: number;
  };
  contextualExamples: ContextualExample[];
  specificSuggestions: string[];
  strengths: string[];
  nextSteps: string[];
}

/**
 * Detect which narrative stage the student is currently writing
 */
export function detectNarrativeStage(content: string): NarrativeStage[] {
  const lowerContent = content.toLowerCase();
  const wordCount = content.trim().split(/\s+/).length;

  const stages: NarrativeStage[] = [
    { id: 'opening', name: 'Opening', detected: false, wordCount: 0 },
    { id: 'inciting_incident', name: 'Inciting Incident', detected: false, wordCount: 0 },
    { id: 'rising_action', name: 'Rising Action', detected: false, wordCount: 0 },
    { id: 'climax', name: 'Climax', detected: false, wordCount: 0 },
    { id: 'falling_action', name: 'Falling Action', detected: false, wordCount: 0 },
    { id: 'resolution', name: 'Resolution', detected: false, wordCount: 0 },
  ];

  // Opening detection (first 50-80 words)
  if (wordCount >= 20) {
    stages[0].detected = true;
    stages[0].wordCount = Math.min(wordCount, 80);
  }

  // Inciting incident markers
  const incitingMarkers = ['suddenly', 'without warning', 'then', 'that\'s when', 'all at once', 'unexpectedly'];
  const hasInciting = incitingMarkers.some(marker => lowerContent.includes(marker));
  if (hasInciting && wordCount >= 50) {
    stages[1].detected = true;
    stages[1].wordCount = 30;
  }

  // Rising action markers
  const risingMarkers = ['first', 'next', 'after', 'tried', 'attempted', 'struggled', 'faced'];
  const hasRising = risingMarkers.some(marker => lowerContent.includes(marker));
  if (hasRising && wordCount >= 100) {
    stages[2].detected = true;
    stages[2].wordCount = Math.min(wordCount - 80, 100);
  }

  // Climax markers
  const climaxMarkers = ['finally', 'at last', 'the moment', 'crucial', 'everything depended'];
  const hasClimax = climaxMarkers.some(marker => lowerContent.includes(marker));
  if (hasClimax && wordCount >= 180) {
    stages[3].detected = true;
    stages[3].wordCount = 40;
  }

  // Falling action markers
  const fallingMarkers = ['as the', 'aftermath', 'after the', 'once', 'when it was over'];
  const hasFalling = fallingMarkers.some(marker => lowerContent.includes(marker));
  if (hasFalling && wordCount >= 220) {
    stages[4].detected = true;
    stages[4].wordCount = 30;
  }

  // Resolution markers
  const resolutionMarkers = ['in the end', 'finally', 'learned', 'realized', 'never forget', 'from that day'];
  const hasResolution = resolutionMarkers.some(marker => lowerContent.includes(marker));
  if (hasResolution && wordCount >= 250) {
    stages[5].detected = true;
    stages[5].wordCount = Math.min(wordCount - 250, 50);
  }

  return stages;
}

/**
 * Analyze character development in the narrative
 */
export function analyzeCharacterDevelopment(content: string): {
  hasCharacter: boolean;
  characterName: string | null;
  hasPersonality: boolean;
  hasEmotions: boolean;
  hasDevelopment: boolean;
  suggestions: string[];
} {
  const lowerContent = content.toLowerCase();

  // Detect character names (capitalized words that repeat)
  const words = content.split(/\s+/);
  const capitalizedWords = words.filter(w => /^[A-Z][a-z]+$/.test(w));
  const characterName = capitalizedWords.length > 0 ? capitalizedWords[0] : null;
  const hasCharacter = capitalizedWords.length > 2;

  // Check for personality traits
  const personalityWords = ['brave', 'kind', 'curious', 'determined', 'shy', 'confident', 'clever', 'gentle'];
  const hasPersonality = personalityWords.some(trait => lowerContent.includes(trait));

  // Check for emotions
  const emotionWords = ['felt', 'thought', 'realized', 'wondered', 'hoped', 'feared', 'smiled', 'frowned'];
  const hasEmotions = emotionWords.some(emotion => lowerContent.includes(emotion));

  // Check for character development
  const developmentMarkers = ['learned', 'changed', 'grew', 'realized', 'discovered', 'understood'];
  const hasDevelopment = developmentMarkers.some(marker => lowerContent.includes(marker));

  const suggestions: string[] = [];

  if (!hasCharacter) {
    suggestions.push('Introduce your main character by name in the opening');
  }
  if (!hasPersonality) {
    suggestions.push('Show your character\'s personality through their actions and choices');
  }
  if (!hasEmotions) {
    suggestions.push('Include your character\'s thoughts and feelings to create emotional connection');
  }
  if (!hasDevelopment && content.split(/\s+/).length > 150) {
    suggestions.push('Show how your character changes or learns something by the end');
  }

  return { hasCharacter, characterName, hasPersonality, hasEmotions, hasDevelopment, suggestions };
}

/**
 * Generate contextual examples based on student's current writing
 */
export function generateContextualExamples(
  content: string,
  currentStage: string,
  characterName: string | null
): ContextualExample[] {
  const examples: ContextualExample[] = [];
  const name = characterName || 'the character';
  const showDontTellIssues = analyzeShowDontTell(content);

  // Character development examples
  if (currentStage === 'opening' || currentStage === 'inciting_incident') {
    examples.push({
      category: 'Character Introduction',
      before: `${name} was brave.`,
      after: `${name} took a deep breath and stepped forward, despite trembling hands.`,
      explanation: 'Show character traits through actions rather than simply stating them.',
      rubricConnection: 'Rubric: Complex, well-developed characters with clear motivations (Level 5)'
    });
  }

  // Setting description examples
  if (currentStage === 'opening') {
    examples.push({
      category: 'Vivid Setting',
      before: 'It was a nice day at the park.',
      after: 'Sunlight dappled through the oak trees, casting dancing shadows on the path where children\'s laughter echoed.',
      explanation: 'Use sensory details and figurative language to bring the setting alive.',
      rubricConnection: 'Rubric: Rich, vivid details that bring the story to life (Level 5)'
    });
  }

  // Show don't tell examples based on actual content
  if (showDontTellIssues.length > 0) {
    const firstIssue = showDontTellIssues[0];
    const suggestion = getSuggestionForTelling(firstIssue.original);
    if (suggestion) {
      examples.push({
        category: 'Show, Don\'t Tell',
        before: suggestion.example.before,
        after: suggestion.example.after,
        explanation: firstIssue.explanation,
        rubricConnection: 'Rubric: Strong emotional connection with reader through showing (Level 5)'
      });
    }
  }

  // Figurative language examples
  if (currentStage === 'rising_action' || currentStage === 'climax') {
    examples.push({
      category: 'Figurative Language',
      before: `${name} was very scared.`,
      after: `Fear wrapped around ${name} like an icy blanket, freezing every thought.`,
      explanation: 'Use similes, metaphors, and personification to create powerful imagery.',
      rubricConnection: 'Rubric: Sophisticated use of language features and literary devices (Level 5)'
    });
  }

  // Tension building examples
  if (currentStage === 'rising_action') {
    examples.push({
      category: 'Building Tension',
      before: `${name} heard a noise and went to check it out.`,
      after: `A faint scraping sound echoed from the hallway. ${name}'s pulse quickened. Against better judgment, they crept toward the door, each step deliberate and silent.`,
      explanation: 'Build tension by showing physical reactions, internal conflict, and pacing your reveals.',
      rubricConnection: 'Rubric: Strategic pacing that builds tension (Level 5)'
    });
  }

  // Dialogue examples
  if (content.includes('"') || content.includes("'")) {
    examples.push({
      category: 'Effective Dialogue',
      before: `"I'm scared," said ${name}.`,
      after: `"Did you hear that?" ${name} whispered, voice barely audible. Their eyes darted to the shadows. "We shouldn't be here."`,
      explanation: 'Use dialogue to reveal character, advance plot, and create tension. Add action tags for impact.',
      rubricConnection: 'Rubric: Dialogue that reveals character and moves story forward (Level 4-5)'
    });
  }

  return examples;
}

/**
 * Assess rubric alignment for narrative writing
 */
export function assessRubricAlignment(content: string): {
  contentAndIdeas: number;
  textStructure: number;
  languageFeatures: number;
  conventions: number;
  overall: number;
} {
  const wordCount = content.trim().split(/\s+/).length;
  const stages = detectNarrativeStage(content);
  const charDev = analyzeCharacterDevelopment(content);
  const showDontTell = analyzeShowDontTell(content);

  // Content and Ideas (0-10)
  let contentScore = 5;
  if (charDev.hasCharacter) contentScore += 1;
  if (charDev.hasPersonality) contentScore += 1;
  if (charDev.hasEmotions) contentScore += 1;
  if (charDev.hasDevelopment) contentScore += 1;
  if (showDontTell.length < 3) contentScore += 1; // Good showing

  // Text Structure (0-10)
  let structureScore = 5;
  const detectedStages = stages.filter(s => s.detected).length;
  structureScore += Math.min(detectedStages - 1, 3); // Up to 3 points for structure
  if (wordCount >= 250) structureScore += 1;
  if (wordCount >= 300) structureScore += 1;

  // Language Features (0-10)
  let languageScore = 5;
  const hasSimile = /like|as/.test(content);
  const hasMetaphor = /(was|were|is|are) (a|an)/.test(content);
  const hasSensory = /(saw|heard|felt|smelled|tasted)/i.test(content);
  if (hasSimile) languageScore += 1;
  if (hasMetaphor) languageScore += 1;
  if (hasSensory) languageScore += 2;
  if (content.includes('"')) languageScore += 1;

  // Conventions (0-10) - Basic check
  let conventionsScore = 6;
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length > 5) conventionsScore += 1;
  const hasParagraphs = content.includes('\n\n');
  if (hasParagraphs) conventionsScore += 1;
  const hasCapitalization = /^[A-Z]/.test(content);
  if (hasCapitalization) conventionsScore += 1;

  const overall = Math.round(
    (contentScore * 0.3 + structureScore * 0.25 + languageScore * 0.25 + conventionsScore * 0.2)
  );

  return {
    contentAndIdeas: Math.min(contentScore, 10),
    textStructure: Math.min(structureScore, 10),
    languageFeatures: Math.min(languageScore, 10),
    conventions: Math.min(conventionsScore, 10),
    overall: Math.min(overall, 10)
  };
}

/**
 * Generate comprehensive narrative coaching feedback
 */
export function generateNarrativeCoaching(content: string): NarrativeCoachingFeedback {
  const stages = detectNarrativeStage(content);
  const charDev = analyzeCharacterDevelopment(content);
  const rubricScores = assessRubricAlignment(content);
  const wordCount = content.trim().split(/\s+/).length;

  // Determine current stage
  const currentStageObj = stages.find(s => !s.detected) || stages[stages.length - 1];
  const currentStage = currentStageObj.id;
  const completedStages = stages.filter(s => s.detected).length;
  const stageProgress = (completedStages / stages.length) * 100;

  // Generate contextual examples
  const contextualExamples = generateContextualExamples(content, currentStage, charDev.characterName);

  // Generate specific suggestions
  const specificSuggestions: string[] = [];

  if (currentStage === 'opening' && wordCount < 40) {
    specificSuggestions.push('Set the scene: Where and when does your story take place?');
    specificSuggestions.push('Hook your reader with an intriguing opening line');
  }

  if (currentStage === 'inciting_incident') {
    specificSuggestions.push('What event disrupts the normal world and sets the story in motion?');
    specificSuggestions.push('Show your character\'s immediate reaction to this surprising event');
  }

  if (currentStage === 'rising_action') {
    specificSuggestions.push('Add 2-3 obstacles that your character must overcome');
    specificSuggestions.push('Show your character making choices and facing consequences');
    specificSuggestions.push('Build tension gradually - each challenge should be harder than the last');
  }

  if (currentStage === 'climax') {
    specificSuggestions.push('This is your story\'s most intense moment - make it vivid and emotional');
    specificSuggestions.push('Show the crucial decision your character makes');
    specificSuggestions.push('Use powerful verbs and sensory details to maximize impact');
  }

  if (currentStage === 'falling_action') {
    specificSuggestions.push('Show the immediate consequences of the climax');
    specificSuggestions.push('Begin to resolve remaining questions');
  }

  if (currentStage === 'resolution') {
    specificSuggestions.push('Show how your character has changed since the beginning');
    specificSuggestions.push('What lesson did your character learn?');
    specificSuggestions.push('Leave your reader with a satisfying sense of closure');
  }

  // Add character development suggestions
  specificSuggestions.push(...charDev.suggestions);

  // Identify strengths
  const strengths: string[] = [];
  if (charDev.hasCharacter) strengths.push('You\'ve introduced a character - great start!');
  if (charDev.hasEmotions) strengths.push('You\'re showing character emotions - this creates connection');
  if (rubricScores.languageFeatures >= 7) strengths.push('Strong use of descriptive language');
  if (wordCount >= 150) strengths.push('Good length - you\'re developing your story well');
  if (completedStages >= 3) strengths.push('Excellent story structure progression');

  // Determine next steps based on stage
  const nextSteps: string[] = [];
  const nextStage = stages[completedStages];
  if (nextStage) {
    nextSteps.push(`Next stage: ${nextStage.name}`);
    nextSteps.push(`Focus on: ${getStageGuidance(nextStage.id)}`);
  }

  return {
    currentStage,
    stageProgress,
    rubricAlignment: rubricScores,
    contextualExamples,
    specificSuggestions: specificSuggestions.slice(0, 5), // Top 5 most relevant
    strengths: strengths.slice(0, 3), // Top 3 strengths
    nextSteps
  };
}

/**
 * Get specific guidance for each narrative stage
 */
function getStageGuidance(stageId: string): string {
  const guidance: Record<string, string> = {
    opening: 'Introduce your character, set the scene, and hook your reader with an engaging start',
    inciting_incident: 'Present the event that disrupts the normal world and sets your story in motion',
    rising_action: 'Build tension with obstacles and challenges your character must face',
    climax: 'Create the most intense, crucial moment where everything comes to a head',
    falling_action: 'Show the immediate aftermath and consequences of the climax',
    resolution: 'Provide closure by showing how your character has changed and what they learned'
  };
  return guidance[stageId] || 'Continue developing your narrative';
}

/**
 * Generate vocabulary suggestions based on narrative context
 */
export function generateNarrativeVocabulary(content: string, context: string): {
  category: string;
  words: { word: string; meaning: string; example: string }[];
}[] {
  const suggestions = [];

  if (context.includes('emotion') || context.includes('feeling')) {
    suggestions.push({
      category: 'Emotion Words',
      words: [
        { word: 'apprehensive', meaning: 'anxious or fearful about the future', example: 'She felt apprehensive as she approached the door.' },
        { word: 'elated', meaning: 'extremely happy and excited', example: 'He was elated when he heard the news.' },
        { word: 'dismayed', meaning: 'disappointed and distressed', example: 'They were dismayed by the unexpected result.' }
      ]
    });
  }

  if (context.includes('action') || context.includes('movement')) {
    suggestions.push({
      category: 'Strong Action Verbs',
      words: [
        { word: 'lunged', meaning: 'made a sudden forward movement', example: 'She lunged for the falling book.' },
        { word: 'staggered', meaning: 'walked unsteadily', example: 'He staggered through the doorway.' },
        { word: 'scrutinized', meaning: 'examined closely and carefully', example: 'She scrutinized every detail of the map.' }
      ]
    });
  }

  if (context.includes('setting') || context.includes('description')) {
    suggestions.push({
      category: 'Descriptive Words',
      words: [
        { word: 'desolate', meaning: 'empty, lonely, and abandoned', example: 'The desolate landscape stretched endlessly.' },
        { word: 'luminous', meaning: 'giving off light; bright', example: 'The luminous moon lit their path.' },
        { word: 'ominous', meaning: 'giving the impression that something bad will happen', example: 'Dark, ominous clouds gathered overhead.' }
      ]
    });
  }

  return suggestions;
}
