export interface GrammarError {
  id: string;
  type: 'spelling' | 'grammar' | 'punctuation' | 'language-convention' | 'style-flow';
  severity: 'low' | 'medium' | 'high';
  message: string;
  suggestions: string[];
  startPos: number;
  endPos: number;
  originalText: string;
  category: string;
  icon: string;
  color: string;
  underlineStyle: 'dotted' | 'wavy' | 'solid';
  nswSpecific?: boolean;
  rule?: string;
}

export interface ErrorCategory {
  type: 'spelling' | 'grammar' | 'punctuation' | 'language-convention' | 'style-flow';
  name: string;
  description: string;
  color: string;
  icon: string;
  underlineStyle: 'dotted' | 'wavy' | 'solid';
}

export interface NSWWritingCriteria {
  narrativeElements: {
    setting: boolean;
    characters: boolean;
    plot: boolean;
    dialogue: boolean;
  };
  vocabularyLevel: 'too-simple' | 'appropriate' | 'too-complex';
  sentenceComplexity: 'too-simple' | 'appropriate' | 'too-complex';
  storyLength: number;
  pacing: 'too-fast' | 'appropriate' | 'too-slow';
  creativeElements: string[];
}

export interface GrammarCheckResult {
  errors: GrammarError[];
  errorCounts: Record<string, number>;
  overallScore: number;
  nswCriteria: NSWWritingCriteria;
  suggestions: string[];
  achievements: string[];
}

export interface ErrorLegendItem {
  type: 'spelling' | 'grammar' | 'punctuation' | 'language-convention' | 'style-flow';
  color: string;
  icon: string;
  name: string;
  description: string;
}

export interface GrammarCheckerSettings {
  sensitivity: 'low' | 'medium' | 'high';
  enabledCategories: string[];
  realTimeDelay: number;
  showAchievements: boolean;
  nswMode: boolean;
}

export interface ContextMenuAction {
  id: string;
  label: string;
  icon?: string;
  action: 'fix' | 'ignore' | 'learn-more';
  data?: any;
}

export interface ErrorHighlight {
  errorId: string;
  startPos: number;
  endPos: number;
  type: string;
  color: string;
  underlineStyle: string;
}
