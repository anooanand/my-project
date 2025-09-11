export interface SentenceVarietyAnalysis {
  totalSentences: number;
  averageSentenceLength: number;
  sentenceLengthDistribution: { [length: string]: number };
  sentenceTypeDistribution: { [type: string]: number };
}

export class SentenceVarietyAnalyzer {
  analyze(text: string): SentenceVarietyAnalysis {
    const sentences = text.split(/[.!?\n]+/);
    const cleanedSentences = sentences.filter(s => s.trim().length > 0).map(s => s.trim());

    let totalWords = 0;
    const sentenceLengths: number[] = [];
    const sentenceTypeCounts: { [key: string]: number } = {
      simple: 0,
      compound: 0,
      complex: 0,
      compoundComplex: 0,
    };

    cleanedSentences.forEach(sentence => {
      const words = sentence.split(/\s+/).filter(w => w.length > 0);
      sentenceLengths.push(words.length);
      totalWords += words.length;

      // Basic sentence type detection (can be expanded)
      if (/(and|but|or|nor|for|yet|so)/i.test(sentence) && /(who|whom|whose|which|that|where|when|why|how|if|although|because|since|unless|while)/i.test(sentence)) {
        sentenceTypeCounts.compoundComplex++;
      } else if (/(and|but|or|nor|for|yet|so)/i.test(sentence)) {
        sentenceTypeCounts.compound++;
      } else if (/(who|whom|whose|which|that|where|when|why|how|if|although|because|since|unless|while)/i.test(sentence)) {
        sentenceTypeCounts.complex++;
      } else {
        sentenceTypeCounts.simple++;
      }
    });

    const averageSentenceLength = cleanedSentences.length > 0 ? totalWords / cleanedSentences.length : 0;

    const sentenceLengthDistribution: { [length: string]: number } = {};
    sentenceLengths.forEach(length => {
      const category = this.getSentenceLengthCategory(length);
      sentenceLengthDistribution[category] = (sentenceLengthDistribution[category] || 0) + 1;
    });

    return {
      totalSentences: cleanedSentences.length,
      averageSentenceLength,
      sentenceLengthDistribution,
      sentenceTypeDistribution: sentenceTypeCounts,
    };
  }

  private getSentenceLengthCategory(length: number): string {
    if (length <= 10) return 'Short (<=10 words)';
    if (length <= 20) return 'Medium (11-20 words)';
    return 'Long (>20 words)';
  }
}

