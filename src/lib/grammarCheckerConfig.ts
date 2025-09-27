import { ErrorCategory, ErrorLegendItem } from '../types/grammarChecker';

export const ERROR_CATEGORIES: ErrorCategory[] = [
  {
    type: 'spelling',
    name: 'Spelling Errors',
    description: 'Misspelled words and typos',
    color: '#FF4444',
    icon: '📝',
    underlineStyle: 'wavy'
  },
  {
    type: 'grammar',
    name: 'Grammar Errors',
    description: 'Subject-verb agreement, tense consistency, sentence structure',
    color: '#4A90E2',
    icon: '📖',
    underlineStyle: 'wavy'
  },
  {
    type: 'punctuation',
    name: 'Punctuation Errors',
    description: 'Missing or incorrect punctuation marks',
    color: '#FF8C00',
    icon: '❗',
    underlineStyle: 'dotted'
  },
  {
    type: 'language-convention',
    name: 'Language Conventions',
    description: 'Word choice, vocabulary level, passive voice',
    color: '#8A2BE2',
    icon: '🎯',
    underlineStyle: 'wavy'
  },
  {
    type: 'style-flow',
    name: 'Style & Flow',
    description: 'Sentence variety, transitions, cohesion',
    color: '#32CD32',
    icon: '🔗',
    underlineStyle: 'dotted'
  }
];

export const ERROR_LEGEND: ErrorLegendItem[] = ERROR_CATEGORIES.map(category => ({
  type: category.type,
  color: category.color,
  icon: category.icon,
  name: category.name,
  description: category.description
}));

// NSW Selective Test Specific Vocabulary Lists
export const NSW_VOCABULARY_LEVELS = {
  YEAR_6_APPROPRIATE: [
    'adventure', 'mysterious', 'enormous', 'brilliant', 'fascinating', 'incredible',
    'magnificent', 'spectacular', 'extraordinary', 'remarkable', 'astonishing',
    'breathtaking', 'captivating', 'enchanting', 'mesmerizing', 'thrilling'
  ],
  TOO_SIMPLE: [
    'big', 'small', 'good', 'bad', 'nice', 'fun', 'cool', 'awesome', 'great', 'ok'
  ],
  TOO_COMPLEX: [
    'perspicacious', 'ubiquitous', 'serendipitous', 'ephemeral', 'quintessential',
    'magnanimous', 'ostentatious', 'pretentious', 'superfluous', 'obsequious'
  ]
};

// Common spelling errors for Year 6 students
export const COMMON_SPELLING_ERRORS = {
  'recieve': 'receive',
  'seperate': 'separate',
  'definately': 'definitely',
  'occured': 'occurred',
  'begining': 'beginning',
  'wierd': 'weird',
  'freind': 'friend',
  'beleive': 'believe',
  'acheive': 'achieve',
  'neccessary': 'necessary',
  'embarass': 'embarrass',
  'accomodate': 'accommodate',
  'recomend': 'recommend',
  'dissapoint': 'disappoint',
  'occassion': 'occasion'
};

// Grammar rules for NSW selective test
export const GRAMMAR_RULES = {
  SUBJECT_VERB_AGREEMENT: {
    patterns: [
      { incorrect: /\b(he|she|it)\s+(are|were)\b/gi, correct: 'is/was' },
      { incorrect: /\b(they|we|you)\s+(is|was)\b/gi, correct: 'are/were' },
      { incorrect: /\bthere\s+is\s+\w+\s+and\b/gi, correct: 'there are' }
    ]
  },
  TENSE_CONSISTENCY: {
    patterns: [
      { incorrect: /\bwent\s+.*\s+go\b/gi, message: 'Keep consistent past tense' },
      { incorrect: /\bwill\s+.*\s+went\b/gi, message: 'Keep consistent future tense' }
    ]
  },
  SENTENCE_FRAGMENTS: {
    patterns: [
      { incorrect: /^[A-Z][^.!?]*\.\s*Because\s+/gm, message: 'Avoid starting sentences with "Because"' },
      { incorrect: /^[A-Z][^.!?]*\.\s*And\s+/gm, message: 'Avoid starting sentences with "And"' }
    ]
  }
};

// Punctuation rules
export const PUNCTUATION_RULES = {
  DIALOGUE: {
    patterns: [
      { incorrect: /"[^"]*[^.!?]"/g, message: 'End dialogue with punctuation inside quotes' },
      { incorrect: /"\s*[a-z]/g, message: 'Capitalize first word in dialogue' }
    ]
  },
  APOSTROPHES: {
    patterns: [
      { incorrect: /\bits\'/g, correct: "its" },
      { incorrect: /\byour\'s\b/g, correct: "yours" },
      { incorrect: /\bwont\b/g, correct: "won't" },
      { incorrect: /\bdont\b/g, correct: "don't" },
      { incorrect: /\bcant\b/g, correct: "can't" }
    ]
  },
  COMMAS: {
    patterns: [
      { incorrect: /\b(and|but|or|so)\s+[a-z]/g, message: 'Consider comma before coordinating conjunction' },
      { incorrect: /\w+\s+\w+\s+and\s+\w+(?!\s*,)/g, message: 'Use commas in lists of three or more' }
    ]
  }
};

// NSW narrative elements checklist
export const NSW_NARRATIVE_ELEMENTS = {
  SETTING: {
    keywords: ['where', 'when', 'place', 'time', 'location', 'scene', 'environment'],
    descriptors: ['dark', 'bright', 'cold', 'warm', 'quiet', 'noisy', 'peaceful', 'chaotic']
  },
  CHARACTERS: {
    keywords: ['character', 'person', 'he', 'she', 'they', 'protagonist', 'hero', 'villain'],
    emotions: ['happy', 'sad', 'angry', 'excited', 'nervous', 'scared', 'confident', 'worried']
  },
  PLOT: {
    structure: ['beginning', 'middle', 'end', 'problem', 'solution', 'conflict', 'resolution'],
    transitions: ['first', 'then', 'next', 'after', 'finally', 'meanwhile', 'suddenly', 'later']
  },
  DIALOGUE: {
    patterns: [/"[^"]*"/g],
    tags: ['said', 'asked', 'replied', 'whispered', 'shouted', 'exclaimed', 'muttered']
  }
};

// Style and flow patterns
export const STYLE_PATTERNS = {
  SENTENCE_STARTERS: {
    repetitive: /^(The|I|It|There|They)\s+/gm,
    message: 'Vary your sentence beginnings'
  },
  WORD_REPETITION: {
    threshold: 3, // Same word used more than 3 times in close proximity
    message: 'Consider using synonyms to avoid repetition'
  },
  PASSIVE_VOICE: {
    patterns: [
      /\b(was|were|is|are|been|being)\s+\w+ed\b/g,
      /\b(was|were|is|are|been|being)\s+\w+en\b/g
    ],
    message: 'Consider using active voice for stronger writing'
  },
  TRANSITION_WORDS: {
    required: ['however', 'therefore', 'meanwhile', 'furthermore', 'consequently', 'nevertheless'],
    message: 'Add transition words to improve flow between ideas'
  }
};

// Achievement system for motivation
export const ACHIEVEMENTS = {
  ERROR_FREE_PARAGRAPH: {
    name: 'Perfect Paragraph',
    description: 'Wrote a paragraph with no errors!',
    icon: '🏆'
  },
  VOCABULARY_MASTER: {
    name: 'Word Wizard',
    description: 'Used advanced vocabulary appropriately',
    icon: '📚'
  },
  DIALOGUE_EXPERT: {
    name: 'Conversation King',
    description: 'Formatted dialogue correctly',
    icon: '💬'
  },
  STRUCTURE_STAR: {
    name: 'Story Architect',
    description: 'Created well-structured narrative',
    icon: '🏗️'
  },
  GRAMMAR_GURU: {
    name: 'Grammar Guardian',
    description: 'Maintained consistent grammar throughout',
    icon: '✅'
  }
};

export const DEFAULT_SETTINGS = {
  sensitivity: 'medium' as const,
  enabledCategories: ['spelling', 'grammar', 'punctuation', 'language-convention', 'style-flow'],
  realTimeDelay: 500,
  showAchievements: true,
  nswMode: true
};
