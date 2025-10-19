/**
 * NSW Selective Schools Writing Test - Marking Criteria
 * Based on the official 4-point marking scale
 */

export interface NSWCriterion {
  name: string;
  code: string;
  description: string;
  levels: {
    level: number;
    descriptor: string;
    examples: string[];
    keywords: string[];
  }[];
}

export interface ScoringGuidance {
  currentLevel: number;
  targetLevel: number;
  criterionCode: string;
  criterionName: string;
  whatYouDid: string;
  whyItMatters: string;
  howToImprove: string;
  exampleImprovement?: string;
  nswReference: string;
}

/**
 * Official NSW Marking Criteria for Selective Schools Writing
 */
export const NSW_MARKING_CRITERIA: Record<string, NSWCriterion> = {
  IDEAS_CONTENT: {
    name: "Ideas and Content",
    code: "IC",
    description: "Quality and development of ideas, relevance to topic, depth of thinking",
    levels: [
      {
        level: 4,
        descriptor: "Extensive development of sophisticated and complex ideas with exceptional depth",
        examples: [
          "Multi-layered plot with interconnected subplots",
          "Deep character development showing growth and change",
          "Original and creative interpretation of the prompt",
          "Rich details that enhance meaning and engagement"
        ],
        keywords: ["sophisticated", "complex", "exceptional", "extensive", "original", "creative"]
      },
      {
        level: 3,
        descriptor: "Well-developed ideas that are appropriate and show clear thinking",
        examples: [
          "Clear story structure with developed plot points",
          "Characters with defined personalities and motivations",
          "Good interpretation of the prompt with some creativity",
          "Relevant details that support the main ideas"
        ],
        keywords: ["well-developed", "appropriate", "clear", "relevant", "defined"]
      },
      {
        level: 2,
        descriptor: "Some development of ideas but may be simple or predictable",
        examples: [
          "Basic story structure that follows expected patterns",
          "Characters with limited development",
          "Literal interpretation of the prompt",
          "Some details but may be general or obvious"
        ],
        keywords: ["basic", "simple", "predictable", "limited", "general"]
      },
      {
        level: 1,
        descriptor: "Limited or unclear ideas with little development",
        examples: [
          "Incomplete or confusing story structure",
          "Minimal character development",
          "Unclear connection to the prompt",
          "Few details or irrelevant information"
        ],
        keywords: ["limited", "unclear", "minimal", "incomplete", "confusing"]
      }
    ]
  },

  STRUCTURE_ORGANIZATION: {
    name: "Structure and Organization",
    code: "SO",
    description: "Text structure, paragraph organization, logical flow, cohesion",
    levels: [
      {
        level: 4,
        descriptor: "Highly effective structure with sophisticated organization and seamless cohesion",
        examples: [
          "Compelling opening that hooks the reader",
          "Logical progression with smooth transitions",
          "Well-structured paragraphs with clear purpose",
          "Satisfying conclusion that completes the piece",
          "Sophisticated use of linking words and phrases"
        ],
        keywords: ["highly effective", "sophisticated", "seamless", "compelling", "logical"]
      },
      {
        level: 3,
        descriptor: "Clear structure with effective organization and good cohesion",
        examples: [
          "Engaging opening that introduces the topic",
          "Organized sequence of events or ideas",
          "Paragraphs with main ideas and supporting details",
          "Appropriate conclusion",
          "Good use of connecting words"
        ],
        keywords: ["clear", "effective", "organized", "engaging", "appropriate"]
      },
      {
        level: 2,
        descriptor: "Basic structure that may be predictable or uneven",
        examples: [
          "Simple opening",
          "Some organization but may jump around",
          "Paragraphs present but may be uneven",
          "Simple conclusion",
          "Limited use of connecting words"
        ],
        keywords: ["basic", "simple", "predictable", "uneven", "limited"]
      },
      {
        level: 1,
        descriptor: "Unclear structure with poor organization",
        examples: [
          "Unclear or missing opening",
          "Disorganized or confusing sequence",
          "Lack of clear paragraphing",
          "Abrupt or missing conclusion",
          "Minimal or no connecting words"
        ],
        keywords: ["unclear", "poor", "disorganized", "confusing", "missing"]
      }
    ]
  },

  VOCABULARY_LANGUAGE: {
    name: "Vocabulary and Language Use",
    code: "VL",
    description: "Word choice, language techniques, vocabulary sophistication, expression",
    levels: [
      {
        level: 4,
        descriptor: "Precise and sophisticated vocabulary with highly effective language techniques",
        examples: [
          "Varied and sophisticated word choices",
          "Effective use of figurative language (metaphors, similes, personification)",
          "Strong verbs and descriptive adjectives",
          "Language appropriate to text type and audience",
          "Creative and original expression"
        ],
        keywords: ["precise", "sophisticated", "varied", "effective", "creative", "original"]
      },
      {
        level: 3,
        descriptor: "Appropriate and varied vocabulary with some effective language techniques",
        examples: [
          "Good range of vocabulary",
          "Some use of figurative language",
          "Descriptive words that enhance meaning",
          "Language mostly appropriate to purpose",
          "Clear expression"
        ],
        keywords: ["appropriate", "varied", "good", "descriptive", "clear"]
      },
      {
        level: 2,
        descriptor: "Simple vocabulary with limited language techniques",
        examples: [
          "Basic word choices, some repetition",
          "Minimal use of descriptive language",
          "Simple expression",
          "Language mostly correct but plain",
          "Limited figurative language"
        ],
        keywords: ["simple", "basic", "limited", "plain", "repetitive"]
      },
      {
        level: 1,
        descriptor: "Very basic vocabulary with little variety or inappropriate choices",
        examples: [
          "Repetitive or very simple words",
          "No figurative language",
          "Unclear expression",
          "Vocabulary may be inappropriate",
          "Interferes with meaning"
        ],
        keywords: ["very basic", "repetitive", "unclear", "inappropriate", "interferes"]
      }
    ]
  },

  GRAMMAR_MECHANICS: {
    name: "Grammar, Punctuation and Spelling",
    code: "GPS",
    description: "Sentence structure, grammar accuracy, punctuation, spelling, conventions",
    levels: [
      {
        level: 4,
        descriptor: "Highly accurate with sophisticated sentence structures and excellent control",
        examples: [
          "Varied sentence structures for effect",
          "Consistent accuracy in grammar",
          "Accurate and effective punctuation",
          "Excellent spelling, including complex words",
          "Strong control of conventions"
        ],
        keywords: ["highly accurate", "sophisticated", "excellent", "consistent", "varied"]
      },
      {
        level: 3,
        descriptor: "Generally accurate with good control and some variety in sentences",
        examples: [
          "Mostly correct sentence structures",
          "Minor errors don't interfere with meaning",
          "Generally correct punctuation",
          "Good spelling accuracy",
          "Good control of conventions"
        ],
        keywords: ["generally accurate", "mostly correct", "good control", "minor errors"]
      },
      {
        level: 2,
        descriptor: "Some accuracy but errors may distract from meaning",
        examples: [
          "Simple sentences, some errors",
          "Grammar errors present",
          "Basic punctuation with some errors",
          "Spelling errors in common words",
          "Conventions may be inconsistent"
        ],
        keywords: ["some accuracy", "errors present", "basic", "inconsistent"]
      },
      {
        level: 1,
        descriptor: "Frequent errors that interfere with understanding",
        examples: [
          "Sentence structure problems",
          "Numerous grammar errors",
          "Punctuation frequently incorrect",
          "Many spelling errors",
          "Poor control of conventions"
        ],
        keywords: ["frequent errors", "numerous", "incorrect", "poor control", "interferes"]
      }
    ]
  }
};

/**
 * Get the level descriptor for a specific criterion and score
 */
export function getCriterionLevel(criterionCode: string, level: number): string {
  const criterion = NSW_MARKING_CRITERIA[criterionCode];
  if (!criterion) return "";

  const levelData = criterion.levels.find(l => l.level === level);
  return levelData?.descriptor || "";
}

/**
 * Generate scoring guidance based on current performance
 */
export function generateScoringGuidance(
  criterionCode: string,
  currentLevel: number,
  evidence: string
): ScoringGuidance | null {
  const criterion = NSW_MARKING_CRITERIA[criterionCode];
  if (!criterion) return null;

  const currentLevelData = criterion.levels.find(l => l.level === currentLevel);
  const targetLevel = Math.min(currentLevel + 1, 4);
  const targetLevelData = criterion.levels.find(l => l.level === targetLevel);

  if (!currentLevelData || !targetLevelData) return null;

  return {
    currentLevel,
    targetLevel,
    criterionCode,
    criterionName: criterion.name,
    whatYouDid: `Your ${criterion.name.toLowerCase()} is at Level ${currentLevel}: ${currentLevelData.descriptor}`,
    whyItMatters: `NSW markers assess ${criterion.name} as one of the four key criteria. ${evidence}`,
    howToImprove: `To reach Level ${targetLevel}, focus on: ${targetLevelData.descriptor}`,
    nswReference: `NSW Criterion: ${criterion.code} (${criterion.name}) - Currently Level ${currentLevel}/4`
  };
}

/**
 * Map analysis to NSW criteria scores
 */
export function mapToNSWScores(analysis: {
  ideas: { score: number };
  structure: { score: number };
  language: { score: number };
  grammar: { score: number };
}): Record<string, number> {
  return {
    IDEAS_CONTENT: analysis.ideas.score,
    STRUCTURE_ORGANIZATION: analysis.structure.score,
    VOCABULARY_LANGUAGE: analysis.language.score,
    GRAMMAR_MECHANICS: analysis.grammar.score
  };
}

/**
 * Get specific improvement examples for moving to next level
 */
export function getImprovementExamples(criterionCode: string, currentLevel: number): string[] {
  const criterion = NSW_MARKING_CRITERIA[criterionCode];
  if (!criterion) return [];

  const targetLevel = Math.min(currentLevel + 1, 4);
  const targetLevelData = criterion.levels.find(l => l.level === targetLevel);

  return targetLevelData?.examples || [];
}

/**
 * Check if specific text demonstrates a criterion level
 */
export function assessCriterionLevel(
  criterionCode: string,
  content: string,
  wordCount: number
): number {
  const criterion = NSW_MARKING_CRITERIA[criterionCode];
  if (!criterion) return 1;

  const lowerContent = content.toLowerCase();
  let score = 1;

  // Check for keywords associated with each level (from highest to lowest)
  for (let level = 4; level >= 1; level--) {
    const levelData = criterion.levels.find(l => l.level === level);
    if (levelData) {
      const keywordMatches = levelData.keywords.filter(keyword =>
        lowerContent.includes(keyword.toLowerCase())
      ).length;

      if (keywordMatches >= 2) {
        score = Math.max(score, level);
        break;
      }
    }
  }

  // Adjust based on word count and content length
  if (wordCount < 50 && score > 2) score = 2;
  if (wordCount < 100 && score > 3) score = 3;

  return score;
}

/**
 * Generate NSW-aligned feedback message
 */
export function generateNSWAlignedFeedback(
  criterionCode: string,
  currentLevel: number,
  specificEvidence: string
): string {
  const guidance = generateScoringGuidance(criterionCode, currentLevel, specificEvidence);
  if (!guidance) return "";

  return `
📊 ${guidance.nswReference}

✅ ${guidance.whatYouDid}

💡 ${guidance.whyItMatters}

🎯 ${guidance.howToImprove}

${guidance.exampleImprovement ? `📝 Example: ${guidance.exampleImprovement}` : ''}
  `.trim();
}
