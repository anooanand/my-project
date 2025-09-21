// Text Type Vocabulary Library
// Text-type specific vocabulary and improvement suggestions

export interface VocabularySet {
  powerWords: string[];
  transitionWords: string[];
  replacements: { [key: string]: string[] };
  sentenceStarters: string[];
}

export interface TextTypeVocabulary {
  narrative: VocabularySet;
  persuasive: VocabularySet;
  expository: VocabularySet;
  descriptive: VocabularySet;
  reflective: VocabularySet;
  recount: VocabularySet;
  technical: VocabularySet;
  creative: VocabularySet;
}

export const TEXT_TYPE_VOCABULARY: TextTypeVocabulary = {
  narrative: {
    powerWords: ['suddenly', 'mysteriously', 'dramatically', 'unexpectedly', 'courageously', 'desperately', 'triumphantly'],
    transitionWords: ['meanwhile', 'suddenly', 'then', 'next', 'finally', 'afterwards', 'eventually', 'immediately'],
    replacements: {
      'said': ['whispered', 'exclaimed', 'declared', 'murmured', 'shouted', 'announced'],
      'went': ['rushed', 'wandered', 'strolled', 'hurried', 'ventured', 'journeyed'],
      'big': ['enormous', 'massive', 'gigantic', 'colossal', 'immense', 'towering'],
      'good': ['excellent', 'wonderful', 'magnificent', 'outstanding', 'remarkable', 'exceptional'],
      'bad': ['terrible', 'dreadful', 'awful', 'horrible', 'disastrous', 'catastrophic'],
      'happy': ['ecstatic', 'delighted', 'overjoyed', 'thrilled', 'elated', 'jubilant'],
      'sad': ['devastated', 'heartbroken', 'sorrowful', 'melancholy', 'despondent', 'grief-stricken']
    },
    sentenceStarters: ['Once upon a time', 'In a distant land', 'Long ago', 'Suddenly', 'Without warning', 'As the sun set']
  },

  persuasive: {
    powerWords: ['crucial', 'essential', 'undeniable', 'compelling', 'overwhelming', 'decisive', 'irrefutable', 'vital'],
    transitionWords: ['furthermore', 'moreover', 'however', 'nevertheless', 'consequently', 'therefore', 'in contrast', 'similarly'],
    replacements: {
      'said': ['argued', 'claimed', 'asserted', 'contended', 'maintained', 'declared'],
      'good': ['beneficial', 'advantageous', 'valuable', 'effective', 'superior', 'optimal'],
      'bad': ['detrimental', 'harmful', 'disadvantageous', 'counterproductive', 'ineffective', 'problematic'],
      'big': ['significant', 'substantial', 'considerable', 'major', 'extensive', 'comprehensive'],
      'important': ['crucial', 'vital', 'essential', 'critical', 'fundamental', 'paramount'],
      'think': ['believe', 'contend', 'argue', 'maintain', 'assert', 'propose']
    },
    sentenceStarters: ['It is evident that', 'Research clearly shows', 'One must consider', 'The evidence suggests', 'Critics argue that', 'Furthermore']
  },

  expository: {
    powerWords: ['specifically', 'particularly', 'notably', 'significantly', 'consequently', 'furthermore', 'moreover', 'additionally'],
    transitionWords: ['first', 'second', 'next', 'then', 'finally', 'in addition', 'furthermore', 'consequently', 'as a result'],
    replacements: {
      'said': ['explained', 'stated', 'described', 'outlined', 'detailed', 'clarified'],
      'show': ['demonstrate', 'illustrate', 'reveal', 'indicate', 'display', 'exhibit'],
      'tell': ['explain', 'describe', 'outline', 'detail', 'clarify', 'elucidate'],
      'big': ['significant', 'substantial', 'considerable', 'extensive', 'comprehensive', 'major'],
      'good': ['effective', 'beneficial', 'valuable', 'useful', 'advantageous', 'positive'],
      'because': ['due to', 'as a result of', 'owing to', 'since', 'given that', 'considering that']
    },
    sentenceStarters: ['To understand this', 'It is important to note', 'Research indicates', 'Studies have shown', 'For example', 'In particular']
  },

  descriptive: {
    powerWords: ['vivid', 'striking', 'remarkable', 'extraordinary', 'captivating', 'mesmerizing', 'breathtaking', 'stunning'],
    transitionWords: ['nearby', 'above', 'below', 'beside', 'beyond', 'within', 'throughout', 'surrounding'],
    replacements: {
      'big': ['towering', 'massive', 'colossal', 'immense', 'gigantic', 'enormous'],
      'small': ['tiny', 'miniature', 'petite', 'delicate', 'minuscule', 'compact'],
      'good': ['beautiful', 'stunning', 'magnificent', 'gorgeous', 'splendid', 'exquisite'],
      'bad': ['hideous', 'repulsive', 'ghastly', 'revolting', 'appalling', 'dreadful'],
      'bright': ['brilliant', 'radiant', 'luminous', 'gleaming', 'dazzling', 'glowing'],
      'dark': ['shadowy', 'murky', 'gloomy', 'dim', 'obscure', 'somber'],
      'loud': ['thunderous', 'deafening', 'booming', 'roaring', 'resounding', 'ear-splitting']
    },
    sentenceStarters: ['Picture this', 'Imagine', 'Visualize', 'Before you stands', 'In the distance', 'Close your eyes and see']
  },

  reflective: {
    powerWords: ['profound', 'meaningful', 'significant', 'transformative', 'enlightening', 'insightful', 'valuable', 'impactful'],
    transitionWords: ['initially', 'gradually', 'eventually', 'in retrospect', 'looking back', 'upon reflection', 'consequently', 'as a result'],
    replacements: {
      'think': ['reflect', 'contemplate', 'ponder', 'consider', 'realize', 'understand'],
      'feel': ['experience', 'sense', 'perceive', 'recognize', 'acknowledge', 'appreciate'],
      'learn': ['discover', 'realize', 'understand', 'comprehend', 'grasp', 'gain insight'],
      'change': ['transform', 'evolve', 'develop', 'grow', 'mature', 'progress'],
      'important': ['significant', 'meaningful', 'valuable', 'crucial', 'essential', 'vital'],
      'good': ['positive', 'beneficial', 'valuable', 'meaningful', 'enriching', 'rewarding']
    },
    sentenceStarters: ['Looking back', 'Upon reflection', 'I now realize', 'This experience taught me', 'I have come to understand', 'In hindsight']
  },

  recount: {
    powerWords: ['memorable', 'exciting', 'unexpected', 'remarkable', 'unforgettable', 'extraordinary', 'significant', 'notable'],
    transitionWords: ['first', 'then', 'next', 'after that', 'later', 'meanwhile', 'during', 'finally', 'eventually'],
    replacements: {
      'went': ['traveled', 'journeyed', 'headed', 'proceeded', 'ventured', 'departed'],
      'did': ['accomplished', 'completed', 'performed', 'executed', 'carried out', 'undertook'],
      'saw': ['observed', 'witnessed', 'noticed', 'spotted', 'discovered', 'encountered'],
      'got': ['received', 'obtained', 'acquired', 'gained', 'secured', 'achieved'],
      'fun': ['enjoyable', 'entertaining', 'delightful', 'amusing', 'exciting', 'thrilling'],
      'good': ['excellent', 'wonderful', 'fantastic', 'amazing', 'outstanding', 'remarkable']
    },
    sentenceStarters: ['Last week', 'Yesterday', 'During the holidays', 'On that memorable day', 'It all began when', 'The adventure started']
  },

  technical: {
    powerWords: ['precisely', 'systematically', 'methodically', 'carefully', 'thoroughly', 'accurately', 'efficiently', 'effectively'],
    transitionWords: ['first', 'second', 'next', 'then', 'subsequently', 'finally', 'meanwhile', 'simultaneously'],
    replacements: {
      'do': ['execute', 'perform', 'implement', 'carry out', 'complete', 'accomplish'],
      'make': ['create', 'construct', 'build', 'assemble', 'fabricate', 'produce'],
      'use': ['utilize', 'employ', 'apply', 'implement', 'operate', 'manipulate'],
      'put': ['place', 'position', 'install', 'insert', 'attach', 'mount'],
      'get': ['obtain', 'acquire', 'retrieve', 'secure', 'procure', 'access'],
      'check': ['verify', 'confirm', 'validate', 'inspect', 'examine', 'test']
    },
    sentenceStarters: ['To begin', 'First, ensure that', 'Next, carefully', 'It is important to', 'Before proceeding', 'Follow these steps']
  },

  creative: {
    powerWords: ['imaginative', 'innovative', 'original', 'unique', 'extraordinary', 'fantastical', 'surreal', 'whimsical'],
    transitionWords: ['meanwhile', 'elsewhere', 'simultaneously', 'in another dimension', 'beyond reality', 'transcending'],
    replacements: {
      'said': ['whispered into existence', 'proclaimed to the universe', 'sang melodiously', 'breathed softly', 'declared boldly'],
      'went': ['floated', 'danced', 'spiraled', 'glided', 'soared', 'drifted'],
      'big': ['infinite', 'boundless', 'cosmic', 'universal', 'limitless', 'immeasurable'],
      'beautiful': ['ethereal', 'celestial', 'divine', 'transcendent', 'luminous', 'radiant'],
      'strange': ['surreal', 'otherworldly', 'mystical', 'enigmatic', 'fantastical', 'magical'],
      'think': ['imagine', 'dream', 'envision', 'conceive', 'fantasize', 'visualize']
    },
    sentenceStarters: ['In a realm where', 'Beyond the boundaries of reality', 'Imagine if', 'In this impossible world', 'What if', 'Picture a universe where']
  }
};

/**
 * Get vocabulary set for a specific text type
 */
export function getVocabularyForTextType(textType: string): VocabularySet {
  const normalizedType = textType.toLowerCase() as keyof TextTypeVocabulary;
  return TEXT_TYPE_VOCABULARY[normalizedType] || TEXT_TYPE_VOCABULARY.narrative;
}

/**
 * Get replacement suggestions for a word based on text type
 */
export function getReplacementSuggestions(word: string, textType: string): string[] {
  const vocabulary = getVocabularyForTextType(textType);
  const lowerWord = word.toLowerCase();
  return vocabulary.replacements[lowerWord] || [];
}

/**
 * Get transition words for a specific text type
 */
export function getTransitionWords(textType: string): string[] {
  const vocabulary = getVocabularyForTextType(textType);
  return vocabulary.transitionWords;
}

/**
 * Get power words for a specific text type
 */
export function getPowerWords(textType: string): string[] {
  const vocabulary = getVocabularyForTextType(textType);
  return vocabulary.powerWords;
}