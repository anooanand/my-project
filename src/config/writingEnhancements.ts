/**
 * Writing Enhancements Configuration
 * Dynamic content system for AI Coach feedback, literary techniques, and writing tools
 *
 * This file centralizes all dynamic content to avoid hardcoding in components.
 * Content can be easily updated, extended, or fetched from an API/database.
 */

// ============================================================================
// LITERARY TECHNIQUES
// ============================================================================

export interface LiteraryTechnique {
  id: string;
  name: string;
  description: string;
  examples: string[];
  writingTypes: string[];
  ageAppropriate: boolean;
}

export const literaryTechniques: LiteraryTechnique[] = [
  {
    id: 'metaphor',
    name: 'Metaphor',
    description: 'Comparing two things by saying one IS the other',
    examples: [
      'The classroom was a zoo',
      'Time is a thief',
      'Her smile was sunshine'
    ],
    writingTypes: ['narrative', 'descriptive', 'poetry'],
    ageAppropriate: true
  },
  {
    id: 'simile',
    name: 'Simile',
    description: 'Comparing two things using "like" or "as"',
    examples: [
      'As brave as a lion',
      'Sparkled like diamonds',
      'Moved like a shadow'
    ],
    writingTypes: ['narrative', 'descriptive', 'poetry'],
    ageAppropriate: true
  },
  {
    id: 'personification',
    name: 'Personification',
    description: 'Giving human qualities to non-human things',
    examples: [
      'The wind whispered secrets',
      'The sun smiled down',
      'Trees danced in the breeze'
    ],
    writingTypes: ['narrative', 'descriptive', 'poetry'],
    ageAppropriate: true
  },
  {
    id: 'alliteration',
    name: 'Alliteration',
    description: 'Repeating the same sound at the start of words',
    examples: [
      'Peter Piper picked',
      'Sneaky, slithering snake',
      'Big, bouncing ball'
    ],
    writingTypes: ['narrative', 'descriptive', 'poetry'],
    ageAppropriate: true
  },
  {
    id: 'onomatopoeia',
    name: 'Onomatopoeia',
    description: 'Words that sound like what they mean',
    examples: [
      'Buzz, hiss, pop',
      'Crash, bang, whoosh',
      'Sizzle, crackle, splash'
    ],
    writingTypes: ['narrative', 'descriptive'],
    ageAppropriate: true
  },
  {
    id: 'hyperbole',
    name: 'Exaggeration',
    description: 'Overstating something for effect',
    examples: [
      'I\'m so hungry I could eat a horse',
      'I\'ve told you a million times',
      'This bag weighs a ton'
    ],
    writingTypes: ['narrative', 'persuasive'],
    ageAppropriate: true
  },
  {
    id: 'sensory_imagery',
    name: 'Sensory Details',
    description: 'Describing using the five senses',
    examples: [
      'The velvety texture of the petals',
      'A sharp, tangy smell filled the air',
      'The bitter taste lingered'
    ],
    writingTypes: ['narrative', 'descriptive'],
    ageAppropriate: true
  }
];

// ============================================================================
// DIALOGUE TECHNIQUES
// ============================================================================

export interface DialogueTechnique {
  id: string;
  name: string;
  description: string;
  examples: {
    showing: string;
    telling: string;
  }[];
  tips: string[];
}

export const dialogueTechniques: DialogueTechnique[] = [
  {
    id: 'show_dont_tell',
    name: 'Show, Don\'t Tell',
    description: 'Use actions and dialogue instead of just stating feelings',
    examples: [
      {
        showing: '"Get out!" Sarah slammed the door, her hands trembling.',
        telling: 'Sarah was angry and told them to leave.'
      },
      {
        showing: 'Tom\'s eyes lit up. "Really? For me?" He clutched the gift to his chest.',
        telling: 'Tom was happy to receive the gift.'
      },
      {
        showing: 'Emma\'s voice dropped to a whisper. "What if they find us?"',
        telling: 'Emma was scared.'
      }
    ],
    tips: [
      'Use body language to show emotions',
      'Add facial expressions and gestures',
      'Include tone of voice and how characters speak',
      'Show reactions through actions'
    ]
  },
  {
    id: 'varied_dialogue_tags',
    name: 'Varied Dialogue Tags',
    description: 'Use different words instead of always saying "said"',
    examples: [
      {
        showing: '"Stop right there!" the guard commanded.',
        telling: '"Stop right there!" the guard said.'
      },
      {
        showing: '"I can\'t believe it," she whispered.',
        telling: '"I can\'t believe it," she said quietly.'
      },
      {
        showing: '"That\'s amazing!" he exclaimed.',
        telling: '"That\'s amazing!" he said.'
      }
    ],
    tips: [
      'Use: whispered, shouted, muttered, exclaimed',
      'Try: replied, responded, announced, declared',
      'Consider: mumbled, stammered, interrupted, continued',
      'Remember: Sometimes "said" is perfectly fine!'
    ]
  }
];

// ============================================================================
// EMOTION VOCABULARY
// ============================================================================

export interface EmotionWord {
  basic: string;
  alternatives: string[];
  intensity: 'mild' | 'moderate' | 'strong';
  context: string;
}

export const emotionVocabulary: EmotionWord[] = [
  {
    basic: 'happy',
    alternatives: ['delighted', 'joyful', 'cheerful', 'thrilled', 'ecstatic', 'content', 'pleased'],
    intensity: 'moderate',
    context: 'Use when describing positive feelings'
  },
  {
    basic: 'sad',
    alternatives: ['miserable', 'sorrowful', 'gloomy', 'heartbroken', 'dejected', 'melancholy'],
    intensity: 'moderate',
    context: 'Use when describing negative feelings'
  },
  {
    basic: 'angry',
    alternatives: ['furious', 'enraged', 'irritated', 'frustrated', 'livid', 'incensed'],
    intensity: 'strong',
    context: 'Use when describing anger or annoyance'
  },
  {
    basic: 'scared',
    alternatives: ['terrified', 'frightened', 'anxious', 'nervous', 'petrified', 'alarmed'],
    intensity: 'moderate',
    context: 'Use when describing fear'
  },
  {
    basic: 'tired',
    alternatives: ['exhausted', 'weary', 'drained', 'fatigued', 'worn out'],
    intensity: 'moderate',
    context: 'Use when describing low energy'
  },
  {
    basic: 'surprised',
    alternatives: ['astonished', 'amazed', 'shocked', 'stunned', 'astounded', 'flabbergasted'],
    intensity: 'strong',
    context: 'Use when describing unexpected events'
  },
  {
    basic: 'excited',
    alternatives: ['enthusiastic', 'eager', 'thrilled', 'animated', 'energized'],
    intensity: 'strong',
    context: 'Use when describing high energy and anticipation'
  }
];

// ============================================================================
// SENTENCE STARTERS
// ============================================================================

export interface SentenceStarters {
  category: string;
  starters: string[];
  writingTypes: string[];
}

export const sentenceStarters: SentenceStarters[] = [
  {
    category: 'Time Connectives',
    starters: [
      'Suddenly,', 'Meanwhile,', 'Later that day,', 'At that moment,',
      'Shortly after,', 'In the beginning,', 'Eventually,', 'Before long,'
    ],
    writingTypes: ['narrative', 'recount']
  },
  {
    category: 'Adding Information',
    starters: [
      'Furthermore,', 'In addition,', 'Moreover,', 'Additionally,',
      'Also,', 'Besides that,', 'What\'s more,'
    ],
    writingTypes: ['persuasive', 'expository', 'informative']
  },
  {
    category: 'Showing Contrast',
    starters: [
      'However,', 'On the other hand,', 'In contrast,', 'Nevertheless,',
      'Despite this,', 'Although,', 'Whereas,'
    ],
    writingTypes: ['persuasive', 'expository', 'discursive']
  },
  {
    category: 'Descriptive Beginnings',
    starters: [
      'In the distance,', 'Surrounding me,', 'Towering above,',
      'Deep within,', 'Across the landscape,', 'Beyond the horizon,'
    ],
    writingTypes: ['descriptive', 'narrative']
  },
  {
    category: 'Engaging Openings',
    starters: [
      'What if I told you...',  'Imagine a world where...',
      'Have you ever wondered...', 'Picture this:', 'It all started when...'
    ],
    writingTypes: ['narrative', 'persuasive']
  }
];

// ============================================================================
// WRITING TYPE-SPECIFIC TOOLS
// ============================================================================

export interface StoryMountainPhase {
  id: string;
  name: string;
  description: string;
  questions: string[];
  tips: string[];
  icon: string;
}

export const storyMountainTemplate: StoryMountainPhase[] = [
  {
    id: 'exposition',
    name: 'Opening (Exposition)',
    description: 'Introduce characters, setting, and the normal world',
    questions: [
      'Who is your main character?',
      'Where and when does the story take place?',
      'What is normal life like for your character?'
    ],
    tips: [
      'Hook your reader with an interesting opening',
      'Set the scene clearly',
      'Introduce your character in an engaging way'
    ],
    icon: '🏠'
  },
  {
    id: 'rising_action',
    name: 'Build-Up (Rising Action)',
    description: 'The problem begins and tension builds',
    questions: [
      'What problem or challenge appears?',
      'How does your character react?',
      'What obstacles do they face?'
    ],
    tips: [
      'Introduce the main problem or conflict',
      'Build tension gradually',
      'Show how the character feels about the problem'
    ],
    icon: '📈'
  },
  {
    id: 'climax',
    name: 'Climax (Turning Point)',
    description: 'The most exciting part - the big moment!',
    questions: [
      'What is the most exciting moment?',
      'What big decision does your character make?',
      'What is at stake?'
    ],
    tips: [
      'This is your story\'s most exciting moment',
      'Make the reader feel the tension',
      'Use strong action words and emotions'
    ],
    icon: '⚡'
  },
  {
    id: 'falling_action',
    name: 'Resolution',
    description: 'After the climax - wrapping things up',
    questions: [
      'What happens after the big moment?',
      'How is the problem solved?',
      'What changes for your character?'
    ],
    tips: [
      'Show the immediate results of the climax',
      'Start to calm the action down',
      'Answer lingering questions'
    ],
    icon: '📉'
  },
  {
    id: 'conclusion',
    name: 'Ending',
    description: 'A satisfying conclusion',
    questions: [
      'How has your character changed?',
      'What did they learn?',
      'How do you want readers to feel?'
    ],
    tips: [
      'Give your reader a satisfying ending',
      'Show how things have changed',
      'Leave the reader with a final thought or feeling'
    ],
    icon: '✨'
  }
];

export interface PersuasiveStructure {
  id: string;
  name: string;
  description: string;
  elements: string[];
  examples: string[];
}

export const persuasiveArgumentFlow: PersuasiveStructure[] = [
  {
    id: 'introduction',
    name: 'Introduction',
    description: 'State your position clearly',
    elements: [
      'Hook your reader with a question or fact',
      'State what you believe (your thesis)',
      'Preview your main arguments'
    ],
    examples: [
      'Did you know that...?',
      'I strongly believe that...',
      'This essay will explain why...'
    ]
  },
  {
    id: 'arguments',
    name: 'Main Arguments',
    description: 'Present your strongest reasons',
    elements: [
      'Start with your strongest argument',
      'Provide evidence or examples',
      'Explain why this matters',
      'Use persuasive language'
    ],
    examples: [
      'Firstly, research shows that...',
      'Furthermore, experts agree that...',
      'This is important because...'
    ]
  },
  {
    id: 'counterargument',
    name: 'Address the Other Side',
    description: 'Show you understand different views',
    elements: [
      'Acknowledge opposing views',
      'Explain why your view is stronger',
      'Use respectful language'
    ],
    examples: [
      'Some people might argue that..., however...',
      'While it\'s true that..., we must also consider...',
      'Although others believe..., the evidence shows...'
    ]
  },
  {
    id: 'conclusion',
    name: 'Conclusion',
    description: 'Reinforce your position',
    elements: [
      'Restate your main belief',
      'Summarize key arguments',
      'Call to action or final thought'
    ],
    examples: [
      'In conclusion, it is clear that...',
      'For all these reasons...',
      'Therefore, we must...'
    ]
  }
];

export interface SensoryPrompt {
  sense: string;
  icon: string;
  prompts: string[];
  descriptiveWords: string[];
}

export const sensoryExplorationPrompts: SensoryPrompt[] = [
  {
    sense: 'Sight',
    icon: '👁️',
    prompts: [
      'What colors do you see?',
      'What shapes and patterns are there?',
      'How does the light look?',
      'What movements catch your eye?'
    ],
    descriptiveWords: [
      'shimmering', 'gleaming', 'shadowy', 'vibrant', 'dull',
      'sparkling', 'glowing', 'hazy', 'crystal-clear'
    ]
  },
  {
    sense: 'Sound',
    icon: '👂',
    prompts: [
      'What sounds can you hear?',
      'Are they loud or quiet?',
      'Are they high or low pitched?',
      'Do sounds repeat or change?'
    ],
    descriptiveWords: [
      'thunderous', 'whisper-quiet', 'melodic', 'harsh',
      'rhythmic', 'echoing', 'piercing', 'soothing'
    ]
  },
  {
    sense: 'Touch',
    icon: '✋',
    prompts: [
      'How does it feel?',
      'Is it rough or smooth?',
      'What is the temperature?',
      'Is it hard or soft?'
    ],
    descriptiveWords: [
      'silky', 'rough', 'velvety', 'prickly', 'icy',
      'warm', 'sticky', 'slippery', 'grainy'
    ]
  },
  {
    sense: 'Smell',
    icon: '👃',
    prompts: [
      'What can you smell?',
      'Is it pleasant or unpleasant?',
      'Is it strong or faint?',
      'Does it remind you of anything?'
    ],
    descriptiveWords: [
      'fragrant', 'musty', 'fresh', 'pungent', 'sweet',
      'acrid', 'earthy', 'aromatic', 'stale'
    ]
  },
  {
    sense: 'Taste',
    icon: '👅',
    prompts: [
      'What taste is in the air or your mouth?',
      'Is it sweet, sour, salty, or bitter?',
      'How intense is the flavor?'
    ],
    descriptiveWords: [
      'tangy', 'bitter', 'savory', 'zesty', 'bland',
      'rich', 'tart', 'mild', 'spicy'
    ]
  }
];

// ============================================================================
// CHARACTER CREATION PROMPTS
// ============================================================================

export interface CharacterPrompt {
  category: string;
  questions: string[];
}

export const characterCreationPrompts: CharacterPrompt[] = [
  {
    category: 'Physical Appearance',
    questions: [
      'How old is your character?',
      'What do they look like?',
      'What do they usually wear?',
      'Do they have any special features?'
    ]
  },
  {
    category: 'Personality',
    questions: [
      'What are three words to describe them?',
      'What makes them happy?',
      'What are they afraid of?',
      'What do they care about most?'
    ]
  },
  {
    category: 'Background',
    questions: [
      'Where do they live?',
      'Who is important to them?',
      'What is their favorite thing to do?',
      'What problem or challenge do they face?'
    ]
  },
  {
    category: 'Goals & Motivation',
    questions: [
      'What does your character want?',
      'Why do they want this?',
      'What might stop them?',
      'How determined are they?'
    ]
  }
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get literary techniques relevant to a specific writing type
 */
export function getLiteraryTechniquesByType(writingType: string): LiteraryTechnique[] {
  return literaryTechniques.filter(tech =>
    tech.writingTypes.includes(writingType) && tech.ageAppropriate
  );
}

/**
 * Get random examples from a technique
 */
export function getRandomExamples(technique: LiteraryTechnique, count: number = 2): string[] {
  const shuffled = [...technique.examples].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Get emotion alternatives based on context
 */
export function getEmotionAlternatives(basicEmotion: string): EmotionWord | undefined {
  return emotionVocabulary.find(
    emotion => emotion.basic.toLowerCase() === basicEmotion.toLowerCase()
  );
}

/**
 * Get sentence starters for a specific writing type
 */
export function getSentenceStartersByType(writingType: string): string[] {
  const relevant = sentenceStarters.filter(group =>
    group.writingTypes.includes(writingType)
  );

  return relevant.flatMap(group => group.starters);
}

/**
 * Get random sentence starters
 */
export function getRandomSentenceStarters(writingType: string, count: number = 5): string[] {
  const starters = getSentenceStartersByType(writingType);
  const shuffled = [...starters].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
