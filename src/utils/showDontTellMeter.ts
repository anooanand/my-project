const TELLING_WORDS = [
  'happy', 'sad', 'angry', 'scared', 'nervous', 'excited', 'beautiful', 'ugly',
  'good', 'bad', 'nice', 'mean', 'love', 'hate', 'like', 'dislike',
  'very', 'really', 'extremely', 'incredibly', 'so',
  'walked', 'ran', 'said', 'looked', 'thought', 'felt'
];

const SHOWING_VERBS = [
  'strolled', 'dashed', 'whispered', 'muttered', 'gazed', 'glanced', 'pondered', 'wondered', 'shivered', 'trembled'
];

export class ShowDontTellMeter {
  analyze(text: string): { score: number; tellingSentences: string[] } {
    const sentences = text.split(/[.!?]/);
    let tellingSentences: string[] = [];
    let tellingWordCount = 0;

    sentences.forEach(sentence => {
      const words = sentence.toLowerCase().split(/\s+/);
      let foundTellingWord = false;

      words.forEach(word => {
        if (TELLING_WORDS.includes(word)) {
          tellingWordCount++;
          foundTellingWord = true;
        }
      });

      if (foundTellingWord) {
        tellingSentences.push(sentence.trim());
      }
    });

    const totalWords = text.split(/\s+/).length;
    const score = totalWords > 0 ? 1 - (tellingWordCount / totalWords) : 1;

    return { score: Math.max(0, score), tellingSentences };
  }
}

