import { SupportLevel } from './writingBuddyService';

export interface GrammarIssue {
  type: 'spelling' | 'grammar' | 'punctuation';
  original: string;
  correction: string;
  explanation: string;
  location: string;
  severity: 'high' | 'medium' | 'low';
}

export interface VocabularyEnhancement {
  original: string;
  suggestions: string[];
  context: string;
  reasoning: string;
  sophisticationLevel: 'basic' | 'intermediate' | 'advanced';
}

export interface SentenceStructureIssue {
  sentence: string;
  issue: string;
  suggestion: string;
  example: string;
  nswAlignment: string;
}

export interface ShowDontTellExample {
  telling: string;
  showing: string;
  explanation: string;
  technique: string;
}

export interface StoryArcFeedback {
  currentStage: 'exposition' | 'rising-action' | 'climax' | 'falling-action' | 'resolution';
  completeness: number; // 0-100
  strengths: string[];
  gaps: string[];
  nextSteps: string[];
}

export interface PacingFeedback {
  overall: 'too-slow' | 'good' | 'too-fast';
  sections: Array<{
    section: string;
    pace: string;
    recommendation: string;
  }>;
}

export interface NSWCriteriaFeedback {
  ideas: {
    score: number; // 0-5
    strengths: string[];
    improvements: string[];
    examples: string[];
  };
  structure: {
    score: number;
    strengths: string[];
    improvements: string[];
    examples: string[];
  };
  language: {
    score: number;
    strengths: string[];
    improvements: string[];
    examples: string[];
  };
  mechanics: {
    score: number;
    strengths: string[];
    improvements: string[];
    examples: string[];
  };
  overallScore: number;
  nswGuidance: string[];
}

export interface ComprehensiveFeedback {
  grammarIssues: GrammarIssue[];
  vocabularyEnhancements: VocabularyEnhancement[];
  sentenceStructureIssues: SentenceStructureIssue[];
  showDontTellExamples: ShowDontTellExample[];
  storyArc: StoryArcFeedback;
  pacing: PacingFeedback;
  nswCriteria: NSWCriteriaFeedback;
  supportLevel: SupportLevel;
}

export class ComprehensiveFeedbackAnalyzer {

  static analyzeGrammar(text: string): GrammarIssue[] {
    const issues: GrammarIssue[] = [];

    // Common spelling errors
    const spellingPatterns = [
      { pattern: /\brecieve\b/gi, correct: 'receive', explanation: 'Remember: "i before e except after c"' },
      { pattern: /\boccured\b/gi, correct: 'occurred', explanation: 'Double the "r" before adding -ed' },
      { pattern: /\bseperate\b/gi, correct: 'separate', explanation: 'Remember: "separate" has "a rat" in it' },
      { pattern: /\bdefinately\b/gi, correct: 'definitely', explanation: 'Remember: "finite" is in "definitely"' },
      { pattern: /\bthier\b/gi, correct: 'their', explanation: '"Their" shows possession' },
      { pattern: /\bits'\b/g, correct: "its", explanation: "Use 'its' for possession, not 'it's'" },
    ];

    spellingPatterns.forEach(({ pattern, correct, explanation }) => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        issues.push({
          type: 'spelling',
          original: match[0],
          correction: correct,
          explanation,
          location: this.getContext(text, match.index),
          severity: 'high'
        });
      }
    });

    // Common grammar errors
    const grammarPatterns = [
      {
        pattern: /\b(he|she|it) don't\b/gi,
        correct: "doesn't",
        explanation: 'Use "doesn\'t" with he, she, or it (singular subjects)'
      },
      {
        pattern: /\bcould of\b/gi,
        correct: 'could have',
        explanation: 'Use "could have" not "could of"'
      },
      {
        pattern: /\bshould of\b/gi,
        correct: 'should have',
        explanation: 'Use "should have" not "should of"'
      },
      {
        pattern: /\byour\s+(going|doing|running|being)\b/gi,
        correct: "you're",
        explanation: 'Use "you\'re" (you are) when describing actions'
      },
      {
        pattern: /\bme and [A-Z]\w+\s+(went|did|saw)\b/gi,
        correct: '[Name] and I',
        explanation: 'Use "[Name] and I" as the subject of a sentence'
      },
    ];

    grammarPatterns.forEach(({ pattern, correct, explanation }) => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        issues.push({
          type: 'grammar',
          original: match[0],
          correction: correct,
          explanation,
          location: this.getContext(text, match.index),
          severity: 'high'
        });
      }
    });

    // Punctuation issues
    const punctuationPatterns = [
      {
        pattern: /[a-z]\.[A-Z]/g,
        correct: '. [Space]',
        explanation: 'Add a space after periods'
      },
      {
        pattern: /\s+,/g,
        correct: ',',
        explanation: 'Remove space before commas'
      },
      {
        pattern: /\s+\./g,
        correct: '.',
        explanation: 'Remove space before periods'
      },
      {
        pattern: /"\w/g,
        correct: '" [Space]',
        explanation: 'Add space after opening quotation marks in dialogue'
      },
    ];

    punctuationPatterns.forEach(({ pattern, correct, explanation }) => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        issues.push({
          type: 'punctuation',
          original: match[0],
          correction: correct,
          explanation,
          location: this.getContext(text, match.index),
          severity: 'medium'
        });
      }
    });

    return issues;
  }

  static analyzeVocabulary(text: string, supportLevel: SupportLevel): VocabularyEnhancement[] {
    const enhancements: VocabularyEnhancement[] = [];

    const vocabularyReplacements = {
      'High Support': [
        { word: 'said', suggestions: ['asked', 'shouted', 'whispered', 'replied'], context: 'dialogue tags' },
        { word: 'went', suggestions: ['walked', 'ran', 'rushed', 'strolled'], context: 'movement verbs' },
        { word: 'big', suggestions: ['huge', 'large', 'enormous', 'giant'], context: 'size descriptions' },
        { word: 'good', suggestions: ['great', 'wonderful', 'excellent', 'fantastic'], context: 'positive adjectives' },
        { word: 'bad', suggestions: ['terrible', 'awful', 'horrible', 'dreadful'], context: 'negative adjectives' },
      ],
      'Medium Support': [
        { word: 'said', suggestions: ['exclaimed', 'murmured', 'proclaimed', 'retorted'], context: 'expressive dialogue tags' },
        { word: 'went', suggestions: ['ventured', 'journeyed', 'traversed', 'proceeded'], context: 'advanced movement' },
        { word: 'big', suggestions: ['colossal', 'immense', 'substantial', 'monumental'], context: 'sophisticated size words' },
        { word: 'looked', suggestions: ['gazed', 'peered', 'observed', 'examined'], context: 'seeing verbs' },
        { word: 'very', suggestions: ['extremely', 'remarkably', 'exceptionally', 'particularly'], context: 'intensifiers' },
      ],
      'Low Support': [
        { word: 'said', suggestions: ['articulated', 'enunciated', 'vocalized', 'intimated'], context: 'sophisticated dialogue' },
        { word: 'showed', suggestions: ['demonstrated', 'illustrated', 'manifested', 'exhibited'], context: 'advanced showing' },
        { word: 'felt', suggestions: ['experienced', 'perceived', 'sensed', 'discerned'], context: 'nuanced emotions' },
        { word: 'made', suggestions: ['crafted', 'constructed', 'fashioned', 'engineered'], context: 'creation verbs' },
      ],
    };

    const levelReplacements = vocabularyReplacements[supportLevel] || vocabularyReplacements['Medium Support'];

    levelReplacements.forEach(({ word, suggestions, context }) => {
      const pattern = new RegExp(`\\b${word}\\b`, 'gi');
      let match;
      while ((match = pattern.exec(text)) !== null) {
        enhancements.push({
          original: match[0],
          suggestions,
          context: this.getContext(text, match.index),
          reasoning: `Consider using more ${context === 'dialogue tags' ? 'expressive' : 'descriptive'} words for ${context}`,
          sophisticationLevel: supportLevel === 'High Support' ? 'basic' : supportLevel === 'Medium Support' ? 'intermediate' : 'advanced'
        });
      }
    });

    return enhancements.slice(0, 5); // Limit to top 5
  }

  static analyzeSentenceStructure(text: string): SentenceStructureIssue[] {
    const issues: SentenceStructureIssue[] = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

    // Check for repetitive sentence starts
    const starts = sentences.map(s => s.trim().split(/\s+/)[0]?.toLowerCase());
    const startCounts: Record<string, number> = {};
    starts.forEach(start => {
      if (start) startCounts[start] = (startCounts[start] || 0) + 1;
    });

    Object.entries(startCounts).forEach(([start, count]) => {
      if (count >= 3) {
        issues.push({
          sentence: `Multiple sentences start with "${start}"`,
          issue: 'Repetitive sentence beginnings',
          suggestion: 'Vary your sentence starts to improve flow',
          example: `Instead of: "${start.charAt(0).toUpperCase() + start.slice(1)} walked... ${start.charAt(0).toUpperCase() + start.slice(1)} saw..." Try: "Walking along... As he looked..."`,
          nswAlignment: 'Demonstrates variety in sentence structure (NSW Language criterion)'
        });
      }
    });

    // Check for short, choppy sentences
    const shortSentences = sentences.filter(s => s.trim().split(/\s+/).length < 5);
    if (shortSentences.length > sentences.length * 0.5) {
      issues.push({
        sentence: 'Many short sentences detected',
        issue: 'Choppy writing with too many short sentences',
        suggestion: 'Combine related short sentences using conjunctions',
        example: 'Instead of: "The dog ran. It was fast. It chased the ball." Try: "The dog ran fast as it chased the ball."',
        nswAlignment: 'Improves sentence fluency and complexity (NSW Language criterion)'
      });
    }

    // Check for long, run-on sentences
    const longSentences = sentences.filter(s => s.trim().split(/\s+/).length > 25);
    longSentences.forEach(sentence => {
      if (sentence.split(',').length < 2) {
        issues.push({
          sentence: sentence.trim().substring(0, 50) + '...',
          issue: 'Very long sentence without proper punctuation',
          suggestion: 'Break this into smaller sentences or add commas',
          example: 'Consider splitting at natural pause points or adding commas for clarity',
          nswAlignment: 'Ensures clarity and readability (NSW Structure criterion)'
        });
      }
    });

    return issues;
  }

  static analyzeShowDontTell(text: string): ShowDontTellExample[] {
    const examples: ShowDontTellExample[] = [];

    // Common "telling" patterns
    const tellingPatterns = [
      {
        pattern: /\b(was|were|is|am|are)\s+(scared|afraid|frightened|nervous|worried)\b/gi,
        telling: 'telling about fear',
        showing: 'show physical signs of fear',
        technique: 'Use sensory details and body language',
      },
      {
        pattern: /\b(was|were|is|am|are)\s+(happy|excited|joyful|glad|pleased)\b/gi,
        telling: 'telling about happiness',
        showing: 'show actions and expressions of joy',
        technique: 'Describe facial expressions, actions, or physical responses',
      },
      {
        pattern: /\b(was|were|is|am|are)\s+(angry|mad|furious|annoyed)\b/gi,
        telling: 'telling about anger',
        showing: 'show physical signs of anger',
        technique: 'Show clenched fists, raised voice, or sharp movements',
      },
      {
        pattern: /\b(was|were|is|am|are)\s+(sad|upset|depressed|miserable)\b/gi,
        telling: 'telling about sadness',
        showing: 'show expressions or actions of sadness',
        technique: 'Describe tears, slumped shoulders, or quiet voice',
      },
    ];

    tellingPatterns.forEach(({ pattern, telling, showing, technique }) => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const emotion = match[2];
        examples.push({
          telling: match[0],
          showing: this.generateShowingExample(emotion),
          explanation: `Instead of ${telling}, ${showing}`,
          technique
        });
      }
    });

    // Check for weather/setting telling
    if (/\bthe weather was\b/gi.test(text)) {
      examples.push({
        telling: 'The weather was cold',
        showing: 'Her breath misted in the air as she pulled her coat tighter',
        explanation: 'Show the effect of weather on characters rather than stating it',
        technique: 'Use sensory details to convey setting'
      });
    }

    return examples.slice(0, 4); // Limit to top 4 examples
  }

  static analyzeStoryArc(text: string, wordCount: number): StoryArcFeedback {
    const hasOpening = /\b(once|suddenly|one day|it was|long ago)\b/i.test(text.substring(0, Math.min(100, text.length)));
    const hasConflict = /\b(but|however|suddenly|problem|worried|scared|discovered)\b/i.test(text);
    const hasClimax = /\b(finally|at last|suddenly|realized|decided)\b/i.test(text);
    const hasResolution = /\b(finally|eventually|in the end|now|today)\b/i.test(text.substring(Math.max(0, text.length - 150)));

    const stages = [hasOpening, hasConflict, hasClimax, hasResolution];
    const completeness = (stages.filter(Boolean).length / stages.length) * 100;

    let currentStage: StoryArcFeedback['currentStage'] = 'exposition';
    if (wordCount < 50) currentStage = 'exposition';
    else if (wordCount < 150) currentStage = 'rising-action';
    else if (wordCount < 200) currentStage = 'climax';
    else currentStage = 'resolution';

    const strengths: string[] = [];
    const gaps: string[] = [];
    const nextSteps: string[] = [];

    if (hasOpening) strengths.push('Strong opening that sets the scene');
    else gaps.push('Story needs a clearer opening or hook');

    if (hasConflict) strengths.push('Introduces tension or conflict');
    else gaps.push('Story needs a problem or conflict for the character');

    if (hasClimax) strengths.push('Contains a turning point or important moment');
    else gaps.push('Story needs a climax or key decision point');

    if (hasResolution) strengths.push('Provides closure or resolution');
    else gaps.push('Story needs a clearer ending or resolution');

    // Generate next steps
    if (!hasConflict && wordCount < 100) {
      nextSteps.push('Introduce a problem or challenge for your character');
    }
    if (hasConflict && !hasClimax && wordCount > 100) {
      nextSteps.push('Build toward a climax - the most exciting or important moment');
    }
    if (hasClimax && !hasResolution) {
      nextSteps.push('Wrap up your story with a satisfying resolution');
    }

    return {
      currentStage,
      completeness,
      strengths,
      gaps,
      nextSteps
    };
  }

  static analyzePacing(text: string, wordCount: number): PacingFeedback {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgWordsPerSentence = wordCount / sentences.length;

    let overall: PacingFeedback['overall'] = 'good';
    if (avgWordsPerSentence < 8) overall = 'too-fast';
    if (avgWordsPerSentence > 20) overall = 'too-slow';

    const sections: PacingFeedback['sections'] = [];

    // Analyze opening
    const openingSentences = sentences.slice(0, 3);
    const openingAvg = openingSentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / openingSentences.length;
    if (openingAvg < 10) {
      sections.push({
        section: 'Opening',
        pace: 'Fast-paced with short sentences',
        recommendation: 'Consider adding more descriptive details to hook the reader'
      });
    }

    // Analyze middle
    if (sentences.length > 10) {
      const middleSentences = sentences.slice(Math.floor(sentences.length / 3), Math.floor(sentences.length * 2 / 3));
      const middleAvg = middleSentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / middleSentences.length;
      if (middleAvg > 18) {
        sections.push({
          section: 'Middle',
          pace: 'Slow-paced with long sentences',
          recommendation: 'Vary sentence length to maintain reader engagement'
        });
      }
    }

    return { overall, sections };
  }

  static analyzeNSWCriteria(text: string, wordCount: number): NSWCriteriaFeedback {
    // Ideas & Content (Originality, development, creativity)
    const hasCreativeElements = /\b(suddenly|wondered|imagined|realized|mysterious|unexpected)\b/i.test(text);
    const hasDetailedDescription = text.split('.').some(s => s.split(',').length > 2);
    const ideasScore = Math.min(5, Math.floor(
      (hasCreativeElements ? 2 : 0) +
      (hasDetailedDescription ? 2 : 0) +
      (wordCount > 150 ? 1 : 0)
    ));

    // Structure & Organization
    const paragraphs = text.split(/\n\n+/).length;
    const hasLogicalFlow = wordCount > 100;
    const structureScore = Math.min(5, Math.floor(
      (paragraphs > 1 ? 2 : 0) +
      (hasLogicalFlow ? 2 : 0) +
      (wordCount > 200 ? 1 : 0)
    ));

    // Language & Vocabulary
    const advancedWords = (text.match(/\b\w{8,}\b/g) || []).length;
    const varietyInVerbs = new Set(text.match(/\b(walked|ran|said|looked|felt|saw|heard)\b/gi) || []).size;
    const languageScore = Math.min(5, Math.floor(
      (advancedWords > 5 ? 2 : 0) +
      (varietyInVerbs > 3 ? 2 : 0) +
      (wordCount > 180 ? 1 : 0)
    ));

    // Mechanics (Spelling, Grammar, Punctuation)
    const grammarIssues = this.analyzeGrammar(text);
    const mechanicsScore = Math.max(1, 5 - Math.floor(grammarIssues.length / 2));

    const overallScore = Math.round((ideasScore + structureScore + languageScore + mechanicsScore) / 4);

    return {
      ideas: {
        score: ideasScore,
        strengths: ideasScore >= 3 ? ['Shows creativity and imagination', 'Develops ideas with details'] : [],
        improvements: ideasScore < 3 ? ['Add more creative or unexpected elements', 'Develop ideas with more detail'] : [],
        examples: ['Use "show, don\'t tell" to make ideas vivid', 'Include sensory details (sight, sound, touch, smell, taste)']
      },
      structure: {
        score: structureScore,
        strengths: structureScore >= 3 ? ['Organized writing with clear progression', 'Uses paragraphs effectively'] : [],
        improvements: structureScore < 3 ? ['Organize into clear paragraphs', 'Create a stronger beginning, middle, and end'] : [],
        examples: ['Start with a hook', 'Build tension in the middle', 'End with resolution']
      },
      language: {
        score: languageScore,
        strengths: languageScore >= 3 ? ['Uses descriptive vocabulary', 'Varies word choice'] : [],
        improvements: languageScore < 3 ? ['Use more descriptive adjectives and verbs', 'Replace simple words with stronger alternatives'] : [],
        examples: ['Instead of "said", try "whispered", "exclaimed", or "murmured"', 'Instead of "big", try "enormous", "colossal", or "immense"']
      },
      mechanics: {
        score: mechanicsScore,
        strengths: mechanicsScore >= 4 ? ['Strong control of grammar and spelling', 'Correct punctuation usage'] : [],
        improvements: mechanicsScore < 4 ? ['Check for spelling errors', 'Review grammar rules', 'Add missing punctuation'] : [],
        examples: grammarIssues.slice(0, 2).map(issue => `${issue.explanation}`)
      },
      overallScore,
      nswGuidance: [
        'NSW Selective Test values originality and imagination in Ideas',
        'Clear structure with introduction, development, and conclusion is essential',
        'Advanced vocabulary demonstrates language sophistication',
        'Accuracy in mechanics shows attention to detail',
        `Aim for 250+ words for best scores (currently ${wordCount} words)`
      ]
    };
  }

  private static getContext(text: string, position: number, radius: number = 30): string {
    const start = Math.max(0, position - radius);
    const end = Math.min(text.length, position + radius);
    const before = text.substring(start, position);
    const after = text.substring(position, end);
    return `...${before}[HERE]${after}...`;
  }

  private static generateShowingExample(emotion: string): string {
    const examples: Record<string, string> = {
      'scared': 'Her hands trembled as she gripped the doorknob, heart pounding in her chest',
      'afraid': 'Cold sweat trickled down his back as shadows danced on the wall',
      'frightened': 'She froze, breath caught in her throat, eyes wide as saucers',
      'happy': 'A grin spread across his face as he bounced on his toes',
      'excited': 'Her eyes sparkled and she clapped her hands together',
      'angry': 'His jaw clenched, fists tight at his sides, voice sharp as broken glass',
      'mad': 'She slammed the door, footsteps heavy against the floor',
      'sad': 'Tears blurred her vision as she sank onto the bench, shoulders slumped',
      'upset': 'He stared at the ground, jaw tight, refusing to meet anyone\'s eyes',
    };
    return examples[emotion.toLowerCase()] || 'Show physical reactions and body language';
  }

  static generateComprehensiveFeedback(
    text: string,
    wordCount: number,
    textType: string,
    supportLevel: SupportLevel
  ): ComprehensiveFeedback {
    return {
      grammarIssues: this.analyzeGrammar(text),
      vocabularyEnhancements: this.analyzeVocabulary(text, supportLevel),
      sentenceStructureIssues: this.analyzeSentenceStructure(text),
      showDontTellExamples: this.analyzeShowDontTell(text),
      storyArc: this.analyzeStoryArc(text, wordCount),
      pacing: this.analyzePacing(text, wordCount),
      nswCriteria: this.analyzeNSWCriteria(text, wordCount),
      supportLevel
    };
  }
}
