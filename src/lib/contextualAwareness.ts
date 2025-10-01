export interface ContextualState {
  currentLesson: string;
  previousFeedback: string[];
  userGoals: string[];
}

export function analyzeContext(content: string, analysis: any): ContextualState {
  return {
    currentLesson: 'writing',
    previousFeedback: [],
    userGoals: []
  };
}