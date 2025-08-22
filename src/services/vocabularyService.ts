// NSW Selective Test Vocabulary Enhancement Service

import { VocabularyEnhancement, VocabularySuggestion } from './grammarTypes';

interface VocabularyEntry {
  basic: string;
  sophisticated: VocabularySuggestion[];
  context: string[];
  textTypes: string[];
}

class VocabularyService {
  private vocabularyDatabase: Map<string, VocabularyEntry> = new Map();
  private transitionWords: Map<string, string[]> = new Map();
  private sophisticatedAlternatives: Map<string, VocabularySuggestion[]> = new Map();

  constructor() {
    this.initializeVocabularyDatabase();
    this.initializeTransitionWords();
  }

  private initializeVocabularyDatabase(): void {
    // Common words with sophisticated alternatives for NSW selective test
    const vocabularyData: VocabularyEntry[] = [
      {
        basic: 'good',
        sophisticated: [
          {
            word: 'exceptional',
            definition: 'unusually good; outstanding',
            example: 'The student demonstrated exceptional writing skills.',
            sophisticationLevel: 4,
            contextAppropriate: true
          },
          {
            word: 'exemplary',
            definition: 'serving as a desirable model; very good',
            example: 'Her exemplary behavior inspired others.',
            sophisticationLevel: 4,
            contextAppropriate: true
          },
          {
            word: 'commendable',
            definition: 'deserving praise',
            example: 'His commendable effort was recognized by all.',
            sophisticationLevel: 3,
            contextAppropriate: true
          }
        ],
        context: ['descriptive', 'persuasive', 'expository'],
        textTypes: ['narrative', 'persuasive', 'expository']
      },
      {
        basic: 'bad',
        sophisticated: [
          {
            word: 'detrimental',
            definition: 'tending to cause harm',
            example: 'The pollution had a detrimental effect on wildlife.',
            sophisticationLevel: 4,
            contextAppropriate: true
          },
          {
            word: 'deplorable',
            definition: 'deserving strong condemnation',
            example: 'The deplorable conditions needed immediate attention.',
            sophisticationLevel: 4,
            contextAppropriate: true
          },
          {
            word: 'inadequate',
            definition: 'lacking the quality or quantity required',
            example: 'The inadequate funding affected the program.',
            sophisticationLevel: 3,
            contextAppropriate: true
          }
        ],
        context: ['persuasive', 'expository', 'argumentative'],
        textTypes: ['persuasive', 'expository', 'speech']
      },
      {
        basic: 'big',
        sophisticated: [
          {
            word: 'colossal',
            definition: 'extremely large or great',
            example: 'The colossal statue dominated the landscape.',
            sophisticationLevel: 4,
            contextAppropriate: true
          },
          {
            word: 'immense',
            definition: 'extremely large or great',
            example: 'The immense responsibility weighed heavily on her.',
            sophisticationLevel: 3,
            contextAppropriate: true
          },
          {
            word: 'substantial',
            definition: 'of considerable importance, size, or worth',
            example: 'There was substantial evidence to support the claim.',
            sophisticationLevel: 3,
            contextAppropriate: true
          }
        ],
        context: ['descriptive', 'narrative', 'expository'],
        textTypes: ['narrative', 'descriptive', 'expository']
      },
      {
        basic: 'small',
        sophisticated: [
          {
            word: 'minuscule',
            definition: 'extremely small',
            example: 'The minuscule details were barely visible.',
            sophisticationLevel: 4,
            contextAppropriate: true
          },
          {
            word: 'negligible',
            definition: 'so small or unimportant as to be not worth considering',
            example: 'The cost increase was negligible.',
            sophisticationLevel: 4,
            contextAppropriate: true
          },
          {
            word: 'modest',
            definition: 'relatively moderate, limited, or small in amount',
            example: 'She made a modest contribution to the project.',
            sophisticationLevel: 2,
            contextAppropriate: true
          }
        ],
        context: ['descriptive', 'expository', 'persuasive'],
        textTypes: ['descriptive', 'expository', 'persuasive']
      },
      {
        basic: 'said',
        sophisticated: [
          {
            word: 'articulated',
            definition: 'expressed clearly and effectively',
            example: 'She articulated her concerns with precision.',
            sophisticationLevel: 4,
            contextAppropriate: true
          },
          {
            word: 'proclaimed',
            definition: 'announced officially or publicly',
            example: 'The leader proclaimed the new policy.',
            sophisticationLevel: 3,
            contextAppropriate: true
          },
          {
            word: 'asserted',
            definition: 'stated with confidence',
            example: 'He asserted his position on the matter.',
            sophisticationLevel: 3,
            contextAppropriate: true
          }
        ],
        context: ['narrative', 'speech', 'dialogue'],
        textTypes: ['narrative', 'speech', 'recount']
      },
      {
        basic: 'important',
        sophisticated: [
          {
            word: 'paramount',
            definition: 'of the highest importance',
            example: 'Safety is of paramount importance.',
            sophisticationLevel: 4,
            contextAppropriate: true
          },
          {
            word: 'crucial',
            definition: 'extremely important',
            example: 'This decision is crucial for our future.',
            sophisticationLevel: 3,
            contextAppropriate: true
          },
          {
            word: 'significant',
            definition: 'sufficiently great or important to be worthy of attention',
            example: 'There was a significant improvement in results.',
            sophisticationLevel: 2,
            contextAppropriate: true
          }
        ],
        context: ['persuasive', 'expository', 'argumentative'],
        textTypes: ['persuasive', 'expository', 'speech']
      }
    ];

    vocabularyData.forEach(entry => {
      this.vocabularyDatabase.set(entry.basic.toLowerCase(), entry);
      this.sophisticatedAlternatives.set(entry.basic.toLowerCase(), entry.sophisticated);
    });
  }

  private initializeTransitionWords(): void {
    this.transitionWords.set('addition', [
      'furthermore', 'moreover', 'additionally', 'consequently', 'in addition',
      'similarly', 'likewise', 'equally important', 'not only... but also'
    ]);

    this.transitionWords.set('contrast', [
      'however', 'nevertheless', 'nonetheless', 'conversely', 'on the contrary',
      'in contrast', 'alternatively', 'whereas', 'although', 'despite'
    ]);

    this.transitionWords.set('cause_effect', [
      'therefore', 'consequently', 'as a result', 'thus', 'hence',
      'accordingly', 'for this reason', 'due to', 'because of'
    ]);

    this.transitionWords.set('sequence', [
      'initially', 'subsequently', 'eventually', 'ultimately', 'meanwhile',
      'simultaneously', 'previously', 'following this', 'in the meantime'
    ]);

    this.transitionWords.set('emphasis', [
      'indeed', 'certainly', 'undoubtedly', 'without question', 'clearly',
      'obviously', 'in fact', 'particularly', 'especially', 'notably'
    ]);

    this.transitionWords.set('conclusion', [
      'in conclusion', 'ultimately', 'in summary', 'to summarize', 'finally',
      'in essence', 'overall', 'to conclude', 'in the final analysis'
    ]);
  }

  public analyzeVocabulary(text: string, textType?: string): VocabularyEnhancement[] {
    const enhancements: VocabularyEnhancement[] = [];
    const words = this.tokenizeText(text);
    let currentPosition = 0;

    for (const word of words) {
      const cleanWord = word.text.toLowerCase().replace(/[^\w]/g, '');
      const enhancement = this.getVocabularyEnhancement(cleanWord, word.start, word.end, textType);
      
      if (enhancement) {
        enhancements.push(enhancement);
      }
    }

    return enhancements;
  }

  private tokenizeText(text: string): Array<{ text: string; start: number; end: number }> {
    const words: Array<{ text: string; start: number; end: number }> = [];
    const wordRegex = /\b\w+\b/g;
    let match;

    while ((match = wordRegex.exec(text)) !== null) {
      words.push({
        text: match[0],
        start: match.index,
        end: match.index + match[0].length
      });
    }

    return words;
  }

  private getVocabularyEnhancement(
    word: string, 
    start: number, 
    end: number, 
    textType?: string
  ): VocabularyEnhancement | null {
    const entry = this.vocabularyDatabase.get(word);
    
    if (!entry) {
      return null;
    }

    // Filter suggestions based on text type if provided
    let suggestions = entry.sophisticated;
    if (textType) {
      suggestions = suggestions.filter(s => 
        entry.textTypes.includes(textType) || s.contextAppropriate
      );
    }

    if (suggestions.length === 0) {
      return null;
    }

    return {
      id: `vocab_${start}_${end}_${Date.now()}`,
      start,
      end,
      original: word,
      suggestions,
      reason: `Consider using a more sophisticated alternative to enhance your writing`,
      sophisticationLevel: Math.max(...suggestions.map(s => s.sophisticationLevel)) as 1 | 2 | 3 | 4 | 5
    };
  }

  public getTransitionWords(category: string): string[] {
    return this.transitionWords.get(category) || [];
  }

  public getAllTransitionCategories(): string[] {
    return Array.from(this.transitionWords.keys());
  }

  public suggestTransitionWords(previousSentence: string, currentSentence: string): string[] {
    // Simple heuristic to suggest appropriate transition words
    const prevLower = previousSentence.toLowerCase();
    const currLower = currentSentence.toLowerCase();

    if (currLower.includes('however') || currLower.includes('but')) {
      return this.getTransitionWords('contrast');
    }
    
    if (currLower.includes('because') || currLower.includes('therefore')) {
      return this.getTransitionWords('cause_effect');
    }
    
    if (currLower.includes('also') || currLower.includes('and')) {
      return this.getTransitionWords('addition');
    }
    
    if (currLower.includes('first') || currLower.includes('then')) {
      return this.getTransitionWords('sequence');
    }

    // Default to addition transitions
    return this.getTransitionWords('addition').slice(0, 3);
  }

  public calculateSophisticationScore(text: string): number {
    const words = this.tokenizeText(text);
    let sophisticatedWords = 0;
    let totalWords = words.length;

    for (const word of words) {
      const cleanWord = word.text.toLowerCase().replace(/[^\w]/g, '');
      
      // Check if word is in our sophisticated vocabulary
      const isBasicWord = this.vocabularyDatabase.has(cleanWord);
      const isSophisticated = Array.from(this.sophisticatedAlternatives.values())
        .flat()
        .some(alt => alt.word.toLowerCase() === cleanWord);

      if (isSophisticated) {
        sophisticatedWords++;
      }
    }

    return totalWords > 0 ? (sophisticatedWords / totalWords) * 100 : 0;
  }

  public getWordComplexity(word: string): number {
    const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
    
    // Check if it's a sophisticated word
    const sophisticatedWord = Array.from(this.sophisticatedAlternatives.values())
      .flat()
      .find(alt => alt.word.toLowerCase() === cleanWord);

    if (sophisticatedWord) {
      return sophisticatedWord.sophisticationLevel;
    }

    // Basic complexity based on word length and syllables (simplified)
    if (cleanWord.length <= 4) return 1;
    if (cleanWord.length <= 6) return 2;
    if (cleanWord.length <= 8) return 3;
    return 4;
  }
}

// Singleton instance
export const vocabularyService = new VocabularyService();

// Export for custom usage
export { VocabularyService };
