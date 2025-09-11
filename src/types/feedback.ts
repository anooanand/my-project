/**
 * Detailed NSW rubric-aligned feedback types.
 * Copy to: src/types/feedback.ts
 */
export interface Evidence { text: string; start: number; end: number; }

export interface LintFix {
  original: string;
  replacement: string;
  explanation: string;
  start: number;
  end: number;
}

export interface CriterionImprovement {
  issue: string;
  evidence: Evidence;
  suggestion: string; // actionable rewrite
}

export interface CriterionBlock {
  score: number; // 0-5 rubric score
  weight: number; // e.g., 30 (ideas), 25 (structure), etc.
  strengths: Evidence[];
  improvements: CriterionImprovement[];
}

export interface NarrativeSignals {
  orientationPresent?: boolean;
  complicationPresent?: boolean;
  climaxPresent?: boolean;
  resolutionPresent?: boolean;
  notes?: string;
}

export interface DetailedFeedback {
  overallScore: number; // 0-100
  criteria: {
    ideasContent: CriterionBlock;
    structureOrganization: CriterionBlock;
    languageVocab: CriterionBlock;
    spellingPunctuationGrammar: CriterionBlock;
  };
  grammarCorrections: LintFix[];
  vocabularyEnhancements: LintFix[];
  narrativeStructure?: NarrativeSignals;
  timings?: { modelLatencyMs?: number };
  modelVersion?: string;
  id: string;
}
