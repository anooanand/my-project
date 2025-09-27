import { 
  GrammarError, 
  GrammarCheckResult, 
  NSWWritingCriteria,
  GrammarCheckerSettings 
} from '../types/grammarChecker';
import { 
  COMMON_SPELLING_ERRORS,
  GRAMMAR_RULES,
  PUNCTUATION_RULES,
  NSW_VOCABULARY_LEVELS,
  NSW_NARRATIVE_ELEMENTS,
  STYLE_PATTERNS,
  ACHIEVEMENTS,
  ERROR_CATEGORIES,
  DEFAULT_SETTINGS
} from './grammarCheckerConfig';

export class GrammarCheckerEngine {
  private settings: GrammarCheckerSettings;
  private errorIdCounter = 0;

  constructor(settings: Partial<GrammarCheckerSettings> = {}) {
    this.settings = { ...DEFAULT_SETTINGS, ...settings };
  }

  public async checkText(text: string): Promise<GrammarCheckResult> {
    const errors: GrammarError[] = [];
    
    // Run all error detection modules
    if (this.settings.enabledCategories.includes('spelling')) {
      errors.push(...this.detectSpellingErrors(text));
    }
    
    if (this.settings.enabledCategories.includes('grammar')) {
      errors.push(...this.detectGrammarErrors(text));
    }
    
    if (this.settings.enabledCategories.includes('punctuation')) {
      errors.push(...this.detectPunctuationErrors(text));
    }
    
    if (this.settings.enabledCategories.includes('language-convention')) {
      errors.push(...this.detectLanguageConventionErrors(text));
    }
    
    if (this.settings.enabledCategories.includes('style-flow')) {
      errors.push(...this.detectStyleFlowErrors(text));
    }

    // NSW specific checks
    const nswCriteria = this.settings.nswMode ? this.evaluateNSWCriteria(text) : this.getDefaultNSWCriteria();
    
    // Calculate error counts
    const errorCounts = this.calculateErrorCounts(errors);
    
    // Calculate overall score
    const overallScore = this.calculateOverallScore(text, errors);
    
    // Generate suggestions
    const suggestions = this.generateSuggestions(text, errors, nswCriteria);
    
    // Check for achievements
    const achievements = this.checkAchievements(text, errors);

    return {
      errors,
      errorCounts,
      overallScore,
      nswCriteria,
      suggestions,
      achievements
    };
  }

  private detectSpellingErrors(text: string): GrammarError[] {
    const errors: GrammarError[] = [];
    const words = text.match(/\b\w+\b/g) || [];
    
    words.forEach((word, index) => {
      const lowerWord = word.toLowerCase();
      
      // Check against common spelling errors
      if (COMMON_SPELLING_ERRORS[lowerWord]) {
        const startPos = text.indexOf(word);
        if (startPos !== -1) {
          errors.push(this.createError({
            type: 'spelling',
            severity: 'high',
            message: `"${word}" is misspelled`,
            suggestions: [COMMON_SPELLING_ERRORS[lowerWord]],
            startPos,
            endPos: startPos + word.length,
            originalText: word,
            category: 'Common Misspelling',
            rule: 'spelling-common-errors'
          }));
        }
      }
      
      // Check for repeated letters (simple heuristic)
      if (this.hasExcessiveRepeatedLetters(word)) {
        const startPos = text.indexOf(word);
        if (startPos !== -1) {
          errors.push(this.createError({
            type: 'spelling',
            severity: 'medium',
            message: `"${word}" may have repeated letters`,
            suggestions: [this.suggestRepeatedLetterFix(word)],
            startPos,
            endPos: startPos + word.length,
            originalText: word,
            category: 'Repeated Letters',
            rule: 'spelling-repeated-letters'
          }));
        }
      }
    });

    return errors;
  }

  private detectGrammarErrors(text: string): GrammarError[] {
    const errors: GrammarError[] = [];

    // Subject-verb agreement
    GRAMMAR_RULES.SUBJECT_VERB_AGREEMENT.patterns.forEach(pattern => {
      const matches = Array.from(text.matchAll(pattern.incorrect));
      matches.forEach(match => {
        if (match.index !== undefined) {
          errors.push(this.createError({
            type: 'grammar',
            severity: 'high',
            message: `Subject-verb disagreement: "${match[0]}"`,
            suggestions: [pattern.correct],
            startPos: match.index,
            endPos: match.index + match[0].length,
            originalText: match[0],
            category: 'Subject-Verb Agreement',
            rule: 'grammar-subject-verb'
          }));
        }
      });
    });

    // Sentence fragments
    GRAMMAR_RULES.SENTENCE_FRAGMENTS.patterns.forEach(pattern => {
      const matches = Array.from(text.matchAll(pattern.incorrect));
      matches.forEach(match => {
        if (match.index !== undefined) {
          errors.push(this.createError({
            type: 'grammar',
            severity: 'medium',
            message: pattern.message || 'Sentence fragment detected',
            suggestions: ['Consider combining with the previous sentence', 'Rewrite as a complete sentence'],
            startPos: match.index,
            endPos: match.index + match[0].length,
            originalText: match[0],
            category: 'Sentence Structure',
            rule: 'grammar-fragments'
          }));
        }
      });
    });

    // Run-on sentences (simple heuristic)
    const sentences = text.split(/[.!?]+/);
    sentences.forEach((sentence, index) => {
      const words = sentence.trim().split(/\s+/);
      if (words.length > 30) { // Arbitrary threshold for run-on sentences
        const startPos = text.indexOf(sentence.trim());
        if (startPos !== -1) {
          errors.push(this.createError({
            type: 'grammar',
            severity: 'medium',
            message: 'This sentence might be too long',
            suggestions: ['Consider breaking into shorter sentences', 'Use punctuation to separate ideas'],
            startPos,
            endPos: startPos + sentence.trim().length,
            originalText: sentence.trim(),
            category: 'Sentence Length',
            rule: 'grammar-run-on'
          }));
        }
      }
    });

    return errors;
  }

  private detectPunctuationErrors(text: string): GrammarError[] {
    const errors: GrammarError[] = [];

    // Dialogue punctuation
    PUNCTUATION_RULES.DIALOGUE.patterns.forEach(pattern => {
      const matches = Array.from(text.matchAll(pattern));
      matches.forEach(match => {
        if (match.index !== undefined) {
          errors.push(this.createError({
            type: 'punctuation',
            severity: 'medium',
            message: PUNCTUATION_RULES.DIALOGUE.message || 'Dialogue punctuation error',
            suggestions: ['Add punctuation inside quotes', 'Use proper dialogue formatting'],
            startPos: match.index,
            endPos: match.index + match[0].length,
            originalText: match[0],
            category: 'Dialogue Punctuation',
            rule: 'punctuation-dialogue'
          }));
        }
      });
    });

    // Apostrophe errors
    PUNCTUATION_RULES.APOSTROPHES.patterns.forEach(pattern => {
      const matches = Array.from(text.matchAll(pattern.incorrect));
      matches.forEach(match => {
        if (match.index !== undefined) {
          errors.push(this.createError({
            type: 'punctuation',
            severity: 'high',
            message: `Incorrect apostrophe usage: "${match[0]}"`,
            suggestions: [pattern.correct || 'Remove apostrophe'],
            startPos: match.index,
            endPos: match.index + match[0].length,
            originalText: match[0],
            category: 'Apostrophes',
            rule: 'punctuation-apostrophes'
          }));
        }
      });
    });

    // Missing periods at end of sentences
    const sentences = text.split('\n').filter(line => line.trim().length > 0);
    sentences.forEach(sentence => {
      const trimmed = sentence.trim();
      if (trimmed.length > 10 && !/[.!?]$/.test(trimmed)) {
        const startPos = text.indexOf(trimmed);
        if (startPos !== -1) {
          errors.push(this.createError({
            type: 'punctuation',
            severity: 'medium',
            message: 'Sentence may be missing ending punctuation',
            suggestions: ['Add a period', 'Add an exclamation mark', 'Add a question mark'],
            startPos: startPos + trimmed.length,
            endPos: startPos + trimmed.length,
            originalText: '',
            category: 'Missing Punctuation',
            rule: 'punctuation-missing-period'
          }));
        }
      }
    });

    return errors;
  }

  private detectLanguageConventionErrors(text: string): GrammarError[] {
    const errors: GrammarError[] = [];
    const words = text.match(/\b\w+\b/g) || [];

    // Check vocabulary level
    words.forEach(word => {
      const lowerWord = word.toLowerCase();
      
      // Too simple vocabulary
      if (NSW_VOCABULARY_LEVELS.TOO_SIMPLE.includes(lowerWord)) {
        const startPos = text.indexOf(word);
        if (startPos !== -1) {
          errors.push(this.createError({
            type: 'language-convention',
            severity: 'low',
            message: `"${word}" could be replaced with a more descriptive word`,
            suggestions: this.getSynonyms(lowerWord),
            startPos,
            endPos: startPos + word.length,
            originalText: word,
            category: 'Vocabulary Enhancement',
            rule: 'vocab-too-simple',
            nswSpecific: true
          }));
        }
      }
      
      // Too complex vocabulary
      if (NSW_VOCABULARY_LEVELS.TOO_COMPLEX.includes(lowerWord)) {
        const startPos = text.indexOf(word);
        if (startPos !== -1) {
          errors.push(this.createError({
            type: 'language-convention',
            severity: 'medium',
            message: `"${word}" might be too complex for Year 6 level`,
            suggestions: this.getSimpleSynonyms(lowerWord),
            startPos,
            endPos: startPos + word.length,
            originalText: word,
            category: 'Age-Appropriate Vocabulary',
            rule: 'vocab-too-complex',
            nswSpecific: true
          }));
        }
      }
    });

    // Passive voice detection
    STYLE_PATTERNS.PASSIVE_VOICE.patterns.forEach(pattern => {
      const matches = Array.from(text.matchAll(pattern));
      matches.forEach(match => {
        if (match.index !== undefined) {
          errors.push(this.createError({
            type: 'language-convention',
            severity: 'low',
            message: 'Consider using active voice for stronger writing',
            suggestions: ['Rewrite in active voice', 'Make the subject perform the action'],
            startPos: match.index,
            endPos: match.index + match[0].length,
            originalText: match[0],
            category: 'Voice',
            rule: 'voice-passive'
          }));
        }
      });
    });

    return errors;
  }

  private detectStyleFlowErrors(text: string): GrammarError[] {
    const errors: GrammarError[] = [];

    // Repetitive sentence starters
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const starters = sentences.map(s => s.trim().split(/\s+/)[0]).filter(Boolean);
    
    const starterCounts: Record<string, number> = {};
    starters.forEach(starter => {
      starterCounts[starter] = (starterCounts[starter] || 0) + 1;
    });

    Object.entries(starterCounts).forEach(([starter, count]) => {
      if (count >= 3) {
        const pattern = new RegExp(`\\b${starter}\\s+`, 'gi');
        const matches = Array.from(text.matchAll(pattern));
        matches.slice(2).forEach(match => { // Flag from 3rd occurrence onwards
          if (match.index !== undefined) {
            errors.push(this.createError({
              type: 'style-flow',
              severity: 'low',
              message: `Repetitive sentence starter: "${starter}"`,
              suggestions: ['Try different sentence beginnings', 'Vary your sentence structure'],
              startPos: match.index,
              endPos: match.index + match[0].length,
              originalText: match[0],
              category: 'Sentence Variety',
              rule: 'style-repetitive-starters'
            }));
          }
        });
      }
    });

    // Word repetition
    const wordCounts: Record<string, { count: number; positions: number[] }> = {};
    const wordMatches = Array.from(text.matchAll(/\b\w{4,}\b/g)); // Words 4+ letters
    
    wordMatches.forEach(match => {
      if (match.index !== undefined) {
        const word = match[0].toLowerCase();
        if (!wordCounts[word]) {
          wordCounts[word] = { count: 0, positions: [] };
        }
        wordCounts[word].count++;
        wordCounts[word].positions.push(match.index);
      }
    });

    Object.entries(wordCounts).forEach(([word, data]) => {
      if (data.count > STYLE_PATTERNS.WORD_REPETITION.threshold) {
        data.positions.slice(STYLE_PATTERNS.WORD_REPETITION.threshold).forEach(pos => {
          errors.push(this.createError({
            type: 'style-flow',
            severity: 'low',
            message: `Word "${word}" is repeated frequently`,
            suggestions: this.getSynonyms(word),
            startPos: pos,
            endPos: pos + word.length,
            originalText: word,
            category: 'Word Repetition',
            rule: 'style-word-repetition'
          }));
        });
      }
    });

    // Missing transitions
    const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
    if (paragraphs.length > 1) {
      const transitionWords = ['however', 'therefore', 'meanwhile', 'furthermore', 'consequently', 'nevertheless', 'moreover', 'additionally', 'finally', 'firstly', 'secondly', 'then', 'next', 'after', 'before', 'during', 'while'];
      const hasTransitions = transitionWords.some(word => text.toLowerCase().includes(word));
      
      if (!hasTransitions) {
        errors.push(this.createError({
          type: 'style-flow',
          severity: 'medium',
          message: 'Consider adding transition words to improve flow',
          suggestions: ['Use words like "however", "therefore", "meanwhile"', 'Add connecting phrases between paragraphs'],
          startPos: 0,
          endPos: 0,
          originalText: '',
          category: 'Transitions',
          rule: 'style-missing-transitions'
        }));
      }
    }

    return errors;
  }

  private evaluateNSWCriteria(text: string): NSWWritingCriteria {
    const words = text.split(/\s+/).filter(w => w.length > 0);
    
    return {
      narrativeElements: {
        setting: this.hasNarrativeElement(text, 'setting'),
        characters: this.hasNarrativeElement(text, 'characters'),
        plot: this.hasNarrativeElement(text, 'plot'),
        dialogue: this.hasNarrativeElement(text, 'dialogue')
      },
      vocabularyLevel: this.assessVocabularyLevel(text),
      sentenceComplexity: this.assessSentenceComplexity(text),
      storyLength: words.length,
      pacing: this.assessPacing(text),
      creativeElements: this.identifyCreativeElements(text)
    };
  }

  private createError(params: {
    type: 'spelling' | 'grammar' | 'punctuation' | 'language-convention' | 'style-flow';
    severity: 'low' | 'medium' | 'high';
    message: string;
    suggestions: string[];
    startPos: number;
    endPos: number;
    originalText: string;
    category: string;
    rule: string;
    nswSpecific?: boolean;
  }): GrammarError {
    const category = ERROR_CATEGORIES.find(c => c.type === params.type)!;
    
    return {
      id: `error-${++this.errorIdCounter}`,
      type: params.type,
      severity: params.severity,
      message: params.message,
      suggestions: params.suggestions,
      startPos: params.startPos,
      endPos: params.endPos,
      originalText: params.originalText,
      category: params.category,
      icon: category.icon,
      color: category.color,
      underlineStyle: category.underlineStyle,
      nswSpecific: params.nswSpecific || false,
      rule: params.rule
    };
  }

  // Helper methods
  private hasExcessiveRepeatedLetters(word: string): boolean {
    return /(.)\1{2,}/.test(word) && word.length > 3;
  }

  private suggestRepeatedLetterFix(word: string): string {
    return word.replace(/(.)\1{2,}/g, '$1$1');
  }

  private getSynonyms(word: string): string[] {
    const synonymMap: Record<string, string[]> = {
      'big': ['large', 'enormous', 'huge', 'massive', 'gigantic'],
      'small': ['tiny', 'miniature', 'petite', 'compact', 'little'],
      'good': ['excellent', 'wonderful', 'fantastic', 'amazing', 'brilliant'],
      'bad': ['terrible', 'awful', 'dreadful', 'horrible', 'atrocious'],
      'nice': ['pleasant', 'delightful', 'lovely', 'charming', 'agreeable'],
      'fun': ['enjoyable', 'entertaining', 'amusing', 'exciting', 'thrilling'],
      'said': ['exclaimed', 'whispered', 'declared', 'announced', 'replied']
    };
    
    return synonymMap[word.toLowerCase()] || ['[synonym]'];
  }

  private getSimpleSynonyms(word: string): string[] {
    // Simplified versions of complex words
    const simpleMap: Record<string, string[]> = {
      'perspicacious': ['wise', 'smart', 'clever'],
      'ubiquitous': ['everywhere', 'common', 'widespread'],
      'serendipitous': ['lucky', 'fortunate', 'unexpected'],
      'ephemeral': ['brief', 'short', 'temporary'],
      'quintessential': ['perfect', 'ideal', 'typical']
    };
    
    return simpleMap[word.toLowerCase()] || ['[simpler word]'];
  }

  private hasNarrativeElement(text: string, element: keyof typeof NSW_NARRATIVE_ELEMENTS): boolean {
    const elementData = NSW_NARRATIVE_ELEMENTS[element.toUpperCase() as keyof typeof NSW_NARRATIVE_ELEMENTS];
    if (!elementData) return false;

    if ('keywords' in elementData) {
      return elementData.keywords.some(keyword => 
        text.toLowerCase().includes(keyword.toLowerCase())
      );
    }
    
    if ('patterns' in elementData) {
      return elementData.patterns.some(pattern => pattern.test(text));
    }
    
    return false;
  }

  private assessVocabularyLevel(text: string): 'too-simple' | 'appropriate' | 'too-complex' {
    const words = text.match(/\b\w+\b/g) || [];
    const simpleCount = words.filter(w => NSW_VOCABULARY_LEVELS.TOO_SIMPLE.includes(w.toLowerCase())).length;
    const complexCount = words.filter(w => NSW_VOCABULARY_LEVELS.TOO_COMPLEX.includes(w.toLowerCase())).length;
    
    const simpleRatio = simpleCount / words.length;
    const complexRatio = complexCount / words.length;
    
    if (simpleRatio > 0.3) return 'too-simple';
    if (complexRatio > 0.1) return 'too-complex';
    return 'appropriate';
  }

  private assessSentenceComplexity(text: string): 'too-simple' | 'appropriate' | 'too-complex' {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgLength = sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length;
    
    if (avgLength < 8) return 'too-simple';
    if (avgLength > 25) return 'too-complex';
    return 'appropriate';
  }

  private assessPacing(text: string): 'too-fast' | 'appropriate' | 'too-slow' {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const shortSentences = sentences.filter(s => s.split(/\s+/).length < 6).length;
    const longSentences = sentences.filter(s => s.split(/\s+/).length > 20).length;
    
    const shortRatio = shortSentences / sentences.length;
    const longRatio = longSentences / sentences.length;
    
    if (shortRatio > 0.7) return 'too-fast';
    if (longRatio > 0.5) return 'too-slow';
    return 'appropriate';
  }

  private identifyCreativeElements(text: string): string[] {
    const elements: string[] = [];
    
    if (/"[^"]*"/.test(text)) elements.push('Dialogue');
    if (/\b(like|as)\s+\w+/.test(text)) elements.push('Similes');
    if (/\b(suddenly|meanwhile|however)\b/i.test(text)) elements.push('Transition words');
    if (/[.!?]{2,}/.test(text)) elements.push('Emphasis punctuation');
    if (text.split('\n\n').length > 1) elements.push('Paragraph structure');
    
    return elements;
  }

  private calculateErrorCounts(errors: GrammarError[]): Record<string, number> {
    const counts: Record<string, number> = {};
    ERROR_CATEGORIES.forEach(category => {
      counts[category.type] = errors.filter(e => e.type === category.type).length;
    });
    return counts;
  }

  private calculateOverallScore(text: string, errors: GrammarError[]): number {
    const words = text.split(/\s+/).filter(w => w.length > 0);
    if (words.length === 0) return 0;
    
    const errorWeight = {
      'spelling': 3,
      'grammar': 4,
      'punctuation': 2,
      'language-convention': 1,
      'style-flow': 1
    };
    
    const totalDeductions = errors.reduce((sum, error) => {
      return sum + (errorWeight[error.type] * (error.severity === 'high' ? 3 : error.severity === 'medium' ? 2 : 1));
    }, 0);
    
    const baseScore = Math.max(0, 100 - (totalDeductions / words.length) * 100);
    return Math.round(Math.min(100, Math.max(0, baseScore)));
  }

  private generateSuggestions(text: string, errors: GrammarError[], nswCriteria: NSWWritingCriteria): string[] {
    const suggestions: string[] = [];
    
    if (errors.filter(e => e.type === 'spelling').length > 2) {
      suggestions.push('Focus on spelling accuracy - use spell check and proofread carefully');
    }
    
    if (!nswCriteria.narrativeElements.dialogue) {
      suggestions.push('Add dialogue to bring your characters to life');
    }
    
    if (!nswCriteria.narrativeElements.setting) {
      suggestions.push('Describe the setting to help readers visualize your story');
    }
    
    if (nswCriteria.vocabularyLevel === 'too-simple') {
      suggestions.push('Try using more descriptive and interesting vocabulary');
    }
    
    if (nswCriteria.sentenceComplexity === 'too-simple') {
      suggestions.push('Vary your sentence length and structure for better flow');
    }
    
    return suggestions;
  }

  private checkAchievements(text: string, errors: GrammarError[]): string[] {
    const achievements: string[] = [];
    
    // Check for error-free paragraphs
    const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
    const errorFreeParagraphs = paragraphs.filter(para => {
      return !errors.some(error => {
        const errorText = text.substring(error.startPos, error.endPos);
        return para.includes(errorText);
      });
    });
    
    if (errorFreeParagraphs.length > 0) {
      achievements.push(ACHIEVEMENTS.ERROR_FREE_PARAGRAPH.name);
    }
    
    if (/"[^"]*"/.test(text) && errors.filter(e => e.category === 'Dialogue Punctuation').length === 0) {
      achievements.push(ACHIEVEMENTS.DIALOGUE_EXPERT.name);
    }
    
    if (errors.filter(e => e.type === 'grammar').length === 0 && text.split(/\s+/).length > 50) {
      achievements.push(ACHIEVEMENTS.GRAMMAR_GURU.name);
    }
    
    return achievements;
  }

  private getDefaultNSWCriteria(): NSWWritingCriteria {
    return {
      narrativeElements: {
        setting: false,
        characters: false,
        plot: false,
        dialogue: false
      },
      vocabularyLevel: 'appropriate',
      sentenceComplexity: 'appropriate',
      storyLength: 0,
      pacing: 'appropriate',
      creativeElements: []
    };
  }

  public updateSettings(newSettings: Partial<GrammarCheckerSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  public getSettings(): GrammarCheckerSettings {
    return { ...this.settings };
  }
}
