/**
 * NSW Selective Writing Test Rubric Criteria
 *
 * Comprehensive rubric definitions for all writing types aligned with
 * NSW Department of Education marking guidelines.
 */

export interface RubricCriterion {
  name: string;
  weight: number;
  indicators: {
    level5: string[]; // Excellent (9-10)
    level4: string[]; // Good (7-8)
    level3: string[]; // Satisfactory (5-6)
    level2: string[]; // Basic (3-4)
    level1: string[]; // Limited (1-2)
  };
}

export interface GenreRubric {
  textType: string;
  criteria: {
    contentAndIdeas: RubricCriterion;
    textStructure: RubricCriterion;
    languageFeatures: RubricCriterion;
    conventions: RubricCriterion;
  };
}

// ============================================================================
// NARRATIVE RUBRIC
// ============================================================================

export const narrativeRubric: GenreRubric = {
  textType: 'narrative',
  criteria: {
    contentAndIdeas: {
      name: 'Content and Ideas',
      weight: 30,
      indicators: {
        level5: [
          'Highly engaging and original storyline with unexpected twists',
          'Complex, well-developed characters with clear motivations',
          'Rich, vivid details that bring the story to life',
          'Strong emotional connection with reader',
          'Sophisticated exploration of themes or messages'
        ],
        level4: [
          'Engaging storyline with interesting developments',
          'Well-developed characters with personality',
          'Good use of descriptive details',
          'Creates emotional engagement',
          'Clear theme or message'
        ],
        level3: [
          'Coherent storyline with some development',
          'Characters have basic personality traits',
          'Some descriptive details included',
          'Some emotional elements present',
          'Theme is identifiable'
        ],
        level2: [
          'Simple storyline with limited development',
          'Characters lack depth',
          'Few descriptive details',
          'Limited emotional engagement',
          'Theme unclear or simplistic'
        ],
        level1: [
          'Confused or incomplete storyline',
          'Characters poorly defined',
          'Minimal details',
          'No emotional connection',
          'No clear theme'
        ]
      }
    },
    textStructure: {
      name: 'Text Structure',
      weight: 25,
      indicators: {
        level5: [
          'Sophisticated narrative structure (exposition, rising action, climax, resolution)',
          'Seamless transitions between scenes',
          'Strategic pacing that builds tension',
          'Cohesive and satisfying conclusion',
          'Effective use of narrative techniques (flashback, foreshadowing)'
        ],
        level4: [
          'Clear narrative structure with all key elements',
          'Smooth transitions between parts',
          'Good pacing throughout',
          'Satisfying conclusion',
          'Some narrative techniques used effectively'
        ],
        level3: [
          'Basic narrative structure present',
          'Adequate transitions',
          'Consistent pacing',
          'Appropriate conclusion',
          'Limited use of narrative techniques'
        ],
        level2: [
          'Incomplete narrative structure',
          'Abrupt or unclear transitions',
          'Uneven pacing',
          'Weak or rushed conclusion',
          'Few narrative techniques'
        ],
        level1: [
          'No clear structure',
          'Disconnected events',
          'Poor pacing',
          'No proper conclusion',
          'No narrative techniques'
        ]
      }
    },
    languageFeatures: {
      name: 'Language Features',
      weight: 25,
      indicators: {
        level5: [
          'Sophisticated and varied vocabulary',
          'Effective use of figurative language (metaphors, similes, personification)',
          'Strong "show, don\'t tell" writing',
          'Varied sentence structures for effect',
          'Distinctive narrative voice'
        ],
        level4: [
          'Good vocabulary choices',
          'Some figurative language used well',
          'Good balance of showing and telling',
          'Sentence variety present',
          'Clear narrative voice'
        ],
        level3: [
          'Appropriate vocabulary',
          'Basic figurative language',
          'Some showing, mostly telling',
          'Some sentence variety',
          'Developing narrative voice'
        ],
        level2: [
          'Limited vocabulary',
          'Little figurative language',
          'Mostly telling, little showing',
          'Repetitive sentence structures',
          'Weak narrative voice'
        ],
        level1: [
          'Very basic vocabulary',
          'No figurative language',
          'All telling, no showing',
          'Simple sentences only',
          'No narrative voice'
        ]
      }
    },
    conventions: {
      name: 'Spelling, Punctuation, and Grammar',
      weight: 20,
      indicators: {
        level5: [
          'Virtually error-free',
          'Sophisticated punctuation used correctly',
          'Perfect grammar and syntax',
          'Consistent tense throughout',
          'Dialogue punctuated perfectly'
        ],
        level4: [
          'Few minor errors',
          'Good use of punctuation',
          'Strong grammar overall',
          'Consistent tense',
          'Dialogue mostly correct'
        ],
        level3: [
          'Some errors that don\'t impede meaning',
          'Basic punctuation correct',
          'Generally correct grammar',
          'Mostly consistent tense',
          'Dialogue adequately punctuated'
        ],
        level2: [
          'Frequent errors affecting clarity',
          'Inconsistent punctuation',
          'Grammar errors present',
          'Tense shifts',
          'Dialogue poorly punctuated'
        ],
        level1: [
          'Many errors impeding comprehension',
          'Incorrect or missing punctuation',
          'Poor grammar',
          'Confusing tense usage',
          'No dialogue punctuation'
        ]
      }
    }
  }
};

// ============================================================================
// PERSUASIVE RUBRIC
// ============================================================================

export const persuasiveRubric: GenreRubric = {
  textType: 'persuasive',
  criteria: {
    contentAndIdeas: {
      name: 'Content and Ideas',
      weight: 30,
      indicators: {
        level5: [
          'Compelling and clear position on the issue',
          'Multiple strong, well-developed arguments',
          'Sophisticated evidence and examples',
          'Effective counter-argument addressed and refuted',
          'Appeals to logic, emotion, and credibility'
        ],
        level4: [
          'Clear position stated',
          'Several strong arguments',
          'Good evidence and examples',
          'Counter-argument addressed',
          'Uses persuasive appeals effectively'
        ],
        level3: [
          'Position stated',
          'Some arguments presented',
          'Basic evidence provided',
          'Counter-argument mentioned',
          'Some persuasive techniques'
        ],
        level2: [
          'Unclear position',
          'Weak arguments',
          'Limited evidence',
          'No counter-argument',
          'Few persuasive techniques'
        ],
        level1: [
          'No clear position',
          'No real arguments',
          'No evidence',
          'No counter-argument',
          'No persuasive techniques'
        ]
      }
    },
    textStructure: {
      name: 'Text Structure',
      weight: 25,
      indicators: {
        level5: [
          'Strong introduction with clear thesis',
          'Logical progression of arguments',
          'Each paragraph focused on one main idea',
          'Effective transitions between points',
          'Powerful, memorable conclusion'
        ],
        level4: [
          'Clear introduction and thesis',
          'Arguments well-organized',
          'Paragraphs have clear focus',
          'Good transitions',
          'Strong conclusion'
        ],
        level3: [
          'Basic introduction present',
          'Arguments organized',
          'Paragraphs mostly focused',
          'Some transitions',
          'Adequate conclusion'
        ],
        level2: [
          'Weak introduction',
          'Poor organization',
          'Unfocused paragraphs',
          'Few transitions',
          'Weak conclusion'
        ],
        level1: [
          'No clear introduction',
          'Disorganized',
          'No paragraph structure',
          'No transitions',
          'No conclusion'
        ]
      }
    },
    languageFeatures: {
      name: 'Language Features',
      weight: 25,
      indicators: {
        level5: [
          'Powerful persuasive language',
          'Rhetorical questions used effectively',
          'Emotive language that engages',
          'Strong, confident tone',
          'Varied sentence structures for emphasis'
        ],
        level4: [
          'Good persuasive language',
          'Rhetorical questions used',
          'Appropriate emotive language',
          'Clear, confident tone',
          'Good sentence variety'
        ],
        level3: [
          'Some persuasive language',
          'Basic rhetorical questions',
          'Some emotive language',
          'Mostly appropriate tone',
          'Some sentence variety'
        ],
        level2: [
          'Limited persuasive language',
          'Few rhetorical devices',
          'Little emotive language',
          'Inconsistent tone',
          'Limited sentence variety'
        ],
        level1: [
          'No persuasive language',
          'No rhetorical devices',
          'No emotive language',
          'Inappropriate tone',
          'Simple sentences only'
        ]
      }
    },
    conventions: {
      name: 'Spelling, Punctuation, and Grammar',
      weight: 20,
      indicators: {
        level5: [
          'Virtually error-free',
          'Sophisticated punctuation',
          'Perfect grammar',
          'Formal register maintained',
          'Complex sentences correctly structured'
        ],
        level4: [
          'Few minor errors',
          'Good punctuation',
          'Strong grammar',
          'Appropriate formality',
          'Complex sentences used'
        ],
        level3: [
          'Some errors present',
          'Basic punctuation correct',
          'Generally correct grammar',
          'Mostly formal',
          'Some complex sentences'
        ],
        level2: [
          'Frequent errors',
          'Inconsistent punctuation',
          'Grammar issues',
          'Informal tone',
          'Mostly simple sentences'
        ],
        level1: [
          'Many errors',
          'Poor punctuation',
          'Poor grammar',
          'Very informal',
          'Only simple sentences'
        ]
      }
    }
  }
};

// ============================================================================
// EXPOSITORY RUBRIC
// ============================================================================

export const expositoryRubric: GenreRubric = {
  textType: 'expository',
  criteria: {
    contentAndIdeas: {
      name: 'Content and Ideas',
      weight: 30,
      indicators: {
        level5: [
          'Comprehensive and accurate information',
          'Sophisticated explanations of complex ideas',
          'Multiple relevant examples and details',
          'Insightful analysis or interpretation',
          'Demonstrates deep understanding of topic'
        ],
        level4: [
          'Accurate and relevant information',
          'Clear explanations provided',
          'Good use of examples',
          'Some analysis included',
          'Good understanding shown'
        ],
        level3: [
          'Basic information provided',
          'Adequate explanations',
          'Some examples included',
          'Limited analysis',
          'Basic understanding'
        ],
        level2: [
          'Limited information',
          'Unclear explanations',
          'Few examples',
          'No analysis',
          'Superficial understanding'
        ],
        level1: [
          'Minimal information',
          'Confused explanations',
          'No examples',
          'No analysis',
          'Poor understanding'
        ]
      }
    },
    textStructure: {
      name: 'Text Structure',
      weight: 25,
      indicators: {
        level5: [
          'Clear introduction defining topic and scope',
          'Logical, coherent organization of information',
          'Each paragraph develops one main idea',
          'Smooth transitions between ideas',
          'Effective conclusion that synthesizes information'
        ],
        level4: [
          'Clear introduction',
          'Well-organized information',
          'Focused paragraphs',
          'Good transitions',
          'Appropriate conclusion'
        ],
        level3: [
          'Basic introduction',
          'Information organized',
          'Paragraphs mostly focused',
          'Some transitions',
          'Adequate conclusion'
        ],
        level2: [
          'Weak introduction',
          'Poor organization',
          'Unfocused paragraphs',
          'Few transitions',
          'Weak conclusion'
        ],
        level1: [
          'No clear introduction',
          'Disorganized',
          'No paragraph structure',
          'No transitions',
          'No conclusion'
        ]
      }
    },
    languageFeatures: {
      name: 'Language Features',
      weight: 25,
      indicators: {
        level5: [
          'Precise, subject-specific vocabulary',
          'Clear, objective language',
          'Effective use of definitions and explanations',
          'Varied sentence structures for clarity',
          'Formal, informative tone maintained'
        ],
        level4: [
          'Good vocabulary choices',
          'Mostly objective language',
          'Definitions provided when needed',
          'Good sentence variety',
          'Appropriate formal tone'
        ],
        level3: [
          'Appropriate vocabulary',
          'Generally objective',
          'Some definitions',
          'Some sentence variety',
          'Mostly formal tone'
        ],
        level2: [
          'Limited vocabulary',
          'Sometimes subjective',
          'Few definitions',
          'Limited sentence variety',
          'Informal tone'
        ],
        level1: [
          'Basic vocabulary',
          'Subjective language',
          'No definitions',
          'Simple sentences only',
          'Very informal'
        ]
      }
    },
    conventions: {
      name: 'Spelling, Punctuation, and Grammar',
      weight: 20,
      indicators: {
        level5: [
          'Virtually error-free',
          'Sophisticated punctuation',
          'Perfect grammar',
          'Technical terms spelled correctly',
          'Complex sentences used effectively'
        ],
        level4: [
          'Few minor errors',
          'Good punctuation',
          'Strong grammar',
          'Most technical terms correct',
          'Complex sentences used'
        ],
        level3: [
          'Some errors present',
          'Basic punctuation correct',
          'Generally correct grammar',
          'Some technical terms correct',
          'Some complex sentences'
        ],
        level2: [
          'Frequent errors',
          'Inconsistent punctuation',
          'Grammar issues',
          'Technical terms often wrong',
          'Mostly simple sentences'
        ],
        level1: [
          'Many errors',
          'Poor punctuation',
          'Poor grammar',
          'Technical terms wrong',
          'Only simple sentences'
        ]
      }
    }
  }
};

// ============================================================================
// DESCRIPTIVE RUBRIC
// ============================================================================

export const descriptiveRubric: GenreRubric = {
  textType: 'descriptive',
  criteria: {
    contentAndIdeas: {
      name: 'Content and Ideas',
      weight: 30,
      indicators: {
        level5: [
          'Rich, multi-sensory descriptions (sight, sound, smell, touch, taste)',
          'Creates vivid, memorable images in reader\'s mind',
          'Sophisticated use of specific details',
          'Evokes strong atmosphere or mood',
          'Original and creative observations'
        ],
        level4: [
          'Good use of multiple senses',
          'Creates clear images',
          'Specific details included',
          'Establishes atmosphere',
          'Creative descriptions'
        ],
        level3: [
          'Some sensory details',
          'Basic images created',
          'Some specific details',
          'Some atmosphere',
          'Adequate descriptions'
        ],
        level2: [
          'Few sensory details',
          'Vague images',
          'General rather than specific',
          'Little atmosphere',
          'Basic descriptions'
        ],
        level1: [
          'No sensory details',
          'No clear images',
          'Very general',
          'No atmosphere',
          'Minimal description'
        ]
      }
    },
    textStructure: {
      name: 'Text Structure',
      weight: 25,
      indicators: {
        level5: [
          'Clear organizational pattern (spatial, chronological, importance)',
          'Smooth flow between descriptions',
          'Effective opening that engages',
          'Cohesive paragraph structure',
          'Satisfying conclusion that completes the picture'
        ],
        level4: [
          'Clear organization',
          'Good flow',
          'Engaging opening',
          'Well-structured paragraphs',
          'Appropriate conclusion'
        ],
        level3: [
          'Basic organization',
          'Adequate flow',
          'Acceptable opening',
          'Paragraphs present',
          'Basic conclusion'
        ],
        level2: [
          'Weak organization',
          'Choppy flow',
          'Weak opening',
          'Poorly structured paragraphs',
          'Weak conclusion'
        ],
        level1: [
          'No organization',
          'No flow',
          'No opening',
          'No paragraphs',
          'No conclusion'
        ]
      }
    },
    languageFeatures: {
      name: 'Language Features',
      weight: 25,
      indicators: {
        level5: [
          'Sophisticated figurative language (metaphors, similes, personification)',
          'Precise, evocative adjectives and adverbs',
          'Strong imagery throughout',
          'Varied sentence structures create rhythm',
          'Distinctive descriptive voice'
        ],
        level4: [
          'Good figurative language',
          'Effective adjectives and adverbs',
          'Good imagery',
          'Sentence variety present',
          'Clear descriptive voice'
        ],
        level3: [
          'Some figurative language',
          'Appropriate word choices',
          'Some imagery',
          'Some sentence variety',
          'Developing voice'
        ],
        level2: [
          'Little figurative language',
          'Basic word choices',
          'Limited imagery',
          'Repetitive sentences',
          'Weak voice'
        ],
        level1: [
          'No figurative language',
          'Very basic vocabulary',
          'No imagery',
          'Simple sentences only',
          'No voice'
        ]
      }
    },
    conventions: {
      name: 'Spelling, Punctuation, and Grammar',
      weight: 20,
      indicators: {
        level5: [
          'Virtually error-free',
          'Sophisticated punctuation for effect',
          'Perfect grammar',
          'Descriptive words spelled correctly',
          'Complex sentences used skillfully'
        ],
        level4: [
          'Few minor errors',
          'Good punctuation',
          'Strong grammar',
          'Most words spelled correctly',
          'Complex sentences used'
        ],
        level3: [
          'Some errors present',
          'Basic punctuation correct',
          'Generally correct grammar',
          'Common words correct',
          'Some complex sentences'
        ],
        level2: [
          'Frequent errors',
          'Inconsistent punctuation',
          'Grammar issues',
          'Spelling errors',
          'Mostly simple sentences'
        ],
        level1: [
          'Many errors',
          'Poor punctuation',
          'Poor grammar',
          'Many spelling errors',
          'Only simple sentences'
        ]
      }
    }
  }
};

// ============================================================================
// REFLECTIVE RUBRIC
// ============================================================================

export const reflectiveRubric: GenreRubric = {
  textType: 'reflective',
  criteria: {
    contentAndIdeas: {
      name: 'Content and Ideas',
      weight: 30,
      indicators: {
        level5: [
          'Deep, insightful reflection on experience',
          'Clear connection between experience and learning',
          'Sophisticated analysis of personal growth',
          'Multiple perspectives considered',
          'Genuine emotional honesty'
        ],
        level4: [
          'Thoughtful reflection',
          'Good connection to learning',
          'Analysis of growth present',
          'Different viewpoints mentioned',
          'Honest emotional content'
        ],
        level3: [
          'Basic reflection',
          'Some connection to learning',
          'Some self-analysis',
          'Single perspective',
          'Some emotional content'
        ],
        level2: [
          'Superficial reflection',
          'Weak learning connection',
          'Little self-analysis',
          'No multiple perspectives',
          'Limited emotional content'
        ],
        level1: [
          'No real reflection',
          'No learning identified',
          'No self-analysis',
          'Single view only',
          'No emotional depth'
        ]
      }
    },
    textStructure: {
      name: 'Text Structure',
      weight: 25,
      indicators: {
        level5: [
          'Clear introduction of experience',
          'Logical development of reflection',
          'Effective description of events',
          'Analysis woven throughout',
          'Insightful conclusion about growth'
        ],
        level4: [
          'Good introduction',
          'Well-organized reflection',
          'Clear event description',
          'Analysis included',
          'Appropriate conclusion'
        ],
        level3: [
          'Basic introduction',
          'Organized adequately',
          'Events described',
          'Some analysis',
          'Basic conclusion'
        ],
        level2: [
          'Weak introduction',
          'Poor organization',
          'Unclear events',
          'Little analysis',
          'Weak conclusion'
        ],
        level1: [
          'No introduction',
          'Disorganized',
          'Events confused',
          'No analysis',
          'No conclusion'
        ]
      }
    },
    languageFeatures: {
      name: 'Language Features',
      weight: 25,
      indicators: {
        level5: [
          'First-person perspective effectively used',
          'Reflective language (realized, discovered, learned)',
          'Emotional vocabulary that engages',
          'Past and present tense used appropriately',
          'Personal, authentic voice'
        ],
        level4: [
          'Good use of first-person',
          'Reflective language present',
          'Appropriate emotional vocabulary',
          'Tense mostly correct',
          'Clear personal voice'
        ],
        level3: [
          'First-person used',
          'Some reflective language',
          'Basic emotional vocabulary',
          'Generally correct tense',
          'Developing voice'
        ],
        level2: [
          'Inconsistent first-person',
          'Little reflective language',
          'Limited emotional vocabulary',
          'Tense errors',
          'Weak voice'
        ],
        level1: [
          'Wrong perspective',
          'No reflective language',
          'No emotional vocabulary',
          'Confused tense',
          'No voice'
        ]
      }
    },
    conventions: {
      name: 'Spelling, Punctuation, and Grammar',
      weight: 20,
      indicators: {
        level5: [
          'Virtually error-free',
          'Sophisticated punctuation',
          'Perfect grammar',
          'Reflective terms used correctly',
          'Complex sentences used effectively'
        ],
        level4: [
          'Few minor errors',
          'Good punctuation',
          'Strong grammar',
          'Reflective language correct',
          'Complex sentences used'
        ],
        level3: [
          'Some errors present',
          'Basic punctuation correct',
          'Generally correct grammar',
          'Basic reflective language',
          'Some complex sentences'
        ],
        level2: [
          'Frequent errors',
          'Inconsistent punctuation',
          'Grammar issues',
          'Language often incorrect',
          'Mostly simple sentences'
        ],
        level1: [
          'Many errors',
          'Poor punctuation',
          'Poor grammar',
          'Language incorrect',
          'Only simple sentences'
        ]
      }
    }
  }
};

// Map of all rubrics by text type
export const allRubrics: Record<string, GenreRubric> = {
  narrative: narrativeRubric,
  persuasive: persuasiveRubric,
  expository: expositoryRubric,
  descriptive: descriptiveRubric,
  reflective: reflectiveRubric,
  // Add more as needed
};

/**
 * Get rubric for a specific text type
 */
export function getRubricForType(textType: string): GenreRubric | null {
  return allRubrics[textType.toLowerCase()] || null;
}

/**
 * Assess a criterion level based on indicators
 */
export function assessCriterionLevel(
  criterion: RubricCriterion,
  indicators: string[]
): { level: number; score: number; matched: string[] } {
  // Count how many indicators match at each level
  const matches = {
    level5: 0,
    level4: 0,
    level3: 0,
    level2: 0,
    level1: 0
  };

  const matchedIndicators: string[] = [];

  // Simple matching logic - can be enhanced with NLP
  Object.entries(criterion.indicators).forEach(([level, levelIndicators]) => {
    levelIndicators.forEach(indicator => {
      if (indicators.some(i => i.includes(indicator) || indicator.includes(i))) {
        matches[level as keyof typeof matches]++;
        matchedIndicators.push(indicator);
      }
    });
  });

  // Determine level based on matches
  if (matches.level5 >= 3) return { level: 5, score: 9, matched: matchedIndicators };
  if (matches.level4 >= 3) return { level: 4, score: 7, matched: matchedIndicators };
  if (matches.level3 >= 2) return { level: 3, score: 5, matched: matchedIndicators };
  if (matches.level2 >= 2) return { level: 2, score: 3, matched: matchedIndicators };
  return { level: 1, score: 1, matched: matchedIndicators };
}
