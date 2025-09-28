export interface TextAnalysis {
  sentenceCount: number;
  wordCount: number;
  averageSentenceLength: number;
  vocabularyDiversity: number;
  grammarErrors: string[];
  spellingErrors: string[];
  literaryDevices: string[];
  showDontTellScore: number;
}
