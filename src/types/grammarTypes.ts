// Grammar and Spelling Checker Types for NSW Selective Test Preparation

export interface GrammarError {
  id: string;
  start: number;
  end: number;
  message: string;
  type: 'grammar' | 'spelling' | 'style' | 'punctuation' | 'vocabulary' | 'structure';
  severity: 'error' | 'warning' | 'suggestion';
  suggestions: string[];
  context?: string;
  explanation?: string;
  rule?: string;
  category?: string;
}

export interface VocabularyEnhancement {
  id: string;
  start: number;
  end: number;
  original: string;
  suggestions: VocabularySuggestion[];
  reason: string;
  sophisticationLevel: 1 | 2 | 3 | 4 | 5; // 1 = basic, 5 = advanced
}

export interface VocabularySuggestion {
  word: string;
  definition: string;
  example: string;
  sophisticationLevel: number;
  contextAppropriate: boolean;
}

export interface SentenceStructureIssue {
  id: string;
  start: number;
  end: number;
  type: 'repetitive' | 'too_long' | 'too_short' | 'fragment' | 'run_on';
  message: string;
  suggestions: string[];
  severity: 'warning' | 'suggestion';
}

export interface CohesionIssue {
  id: string;
  start: number;
  end: number;
  type: 'missing_transition' | 'weak_connection' | 'unclear_reference';
  message: string;
  suggestions: string[];
  transitionWords?: string[];
}

export interface NSWWritingAnalysis {
  grammarErrors: GrammarError[];
  vocabularyEnhancements: VocabularyEnhancement[];
  sentenceStructureIssues: SentenceStructureIssue[];
  cohesionIssues: CohesionIssue[];
  overallScore: {
    ideas: number; // 0-30
    structure: number; // 0-25
    language: number; // 0-25
    accuracy: number; // 0-20
    total: number; // 0-100
  };
  strengths: string[];
  improvements: string[];
}

export interface LanguageToolResponse {
  matches: LanguageToolMatch[];
}

export interface LanguageToolMatch {
  message: string;
  shortMessage: string;
  offset: number;
  length: number;
  replacements: Array<{ value: string }>;
  context: {
    text: string;
    offset: number;
    length: number;
  };
  sentence: string;
  type: {
    typeName: string;
  };
  rule: {
    id: string;
    description: string;
    issueType: string;
    category: {
      id: string;
      name: string;
    };
  };
}

export interface TextHighlight {
  id: string;
  start: number;
  end: number;
  type: 'error' | 'warning' | 'suggestion' | 'enhancement';
  category: 'grammar' | 'spelling' | 'style' | 'vocabulary' | 'structure' | 'cohesion';
  color: string;
  underlineStyle: 'wavy' | 'solid' | 'dashed' | 'dotted';
}

export interface SuggestionTooltip {
  id: string;
  x: number;
  y: number;
  visible: boolean;
  error: GrammarError | VocabularyEnhancement | SentenceStructureIssue | CohesionIssue;
  suggestions: string[];
  explanation?: string;
}

export interface WritingMetrics {
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  averageWordsPerSentence: number;
  readabilityScore: number;
  vocabularyDiversity: number;
  sophisticationScore: number;
}

export interface NSWCriteria {
  textType: 'narrative' | 'persuasive' | 'expository' | 'descriptive' | 'recount' | 'letter' | 'speech';
  requiredElements: string[];
  vocabularyExpectations: string[];
  structureRequirements: string[];
  languageFeatures: string[];
}

export interface WritingSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  textType: string;
  content: string;
  analysis: NSWWritingAnalysis;
  metrics: WritingMetrics;
  improvements: string[];
  goals: string[];
}
