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

export function analyzeText(content: string): TextAnalysis {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = content.split(/\s+/).filter(w => w.length > 0);
  const uniqueWords = new Set(words.map(w => w.toLowerCase()));

  return {
    sentenceCount: sentences.length,
    wordCount: words.length,
    averageSentenceLength: sentences.length > 0 ? words.length / sentences.length : 0,
    vocabularyDiversity: words.length > 0 ? uniqueWords.size / words.length : 0,
    grammarErrors: [],
    spellingErrors: [],
    literaryDevices: [],
    showDontTellScore: 0.5
  };
}