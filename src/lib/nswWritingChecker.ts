import { GrammarError, NSWWritingCriteria } from '../types/grammarChecker';
import { NSW_NARRATIVE_ELEMENTS, NSW_VOCABULARY_LEVELS } from './grammarCheckerConfig';

export class NSWWritingChecker {
  private errorIdCounter = 0;

  public checkNSWCriteria(text: string): {
    errors: GrammarError[];
    criteria: NSWWritingCriteria;
    nswScore: number;
    recommendations: string[];
  } {
    const errors: GrammarError[] = [];
    const criteria = this.evaluateNSWCriteria(text);
    const recommendations: string[] = [];

    // Check narrative elements
    const narrativeErrors = this.checkNarrativeElements(text, criteria);
    errors.push(...narrativeErrors);

    // Check vocabulary appropriateness
    const vocabErrors = this.checkVocabularyLevel(text);
    errors.push(...vocabErrors);

    // Check sentence complexity
    const complexityErrors = this.checkSentenceComplexity(text);
    errors.push(...complexityErrors);

    // Check story structure
    const structureErrors = this.checkStoryStructure(text);
    errors.push(...structureErrors);

    // Check creative writing conventions
    const conventionErrors = this.checkCreativeWritingConventions(text);
    errors.push(...conventionErrors);

    // Generate NSW-specific recommendations
    const nswRecommendations = this.generateNSWRecommendations(text, criteria);
    recommendations.push(...nswRecommendations);

    // Calculate NSW-specific score
    const nswScore = this.calculateNSWScore(text, criteria, errors);

    return {
      errors,
      criteria,
      nswScore,
      recommendations
    };
  }

  private evaluateNSWCriteria(text: string): NSWWritingCriteria {
    const words = text.split(/\s+/).filter(w => w.length > 0);
    
    return {
      narrativeElements: {
        setting: this.hasSettingDescription(text),
        characters: this.hasCharacterDevelopment(text),
        plot: this.hasPlotProgression(text),
        dialogue: this.hasDialogue(text)
      },
      vocabularyLevel: this.assessVocabularyLevel(text),
      sentenceComplexity: this.assessSentenceComplexity(text),
      storyLength: words.length,
      pacing: this.assessPacing(text),
      creativeElements: this.identifyCreativeElements(text)
    };
  }

  private checkNarrativeElements(text: string, criteria: NSWWritingCriteria): GrammarError[] {
    const errors: GrammarError[] = [];

    // Check for missing setting
    if (!criteria.narrativeElements.setting) {
      errors.push(this.createNSWError({
        type: 'language-convention',
        severity: 'medium',
        message: 'Your story needs a clear setting - describe where and when it takes place',
        suggestions: [
          'Add details about the location (e.g., "In the old library...")',
          'Describe the time of day or season',
          'Include sensory details about the environment'
        ],
        startPos: 0,
        endPos: 0,
        originalText: '',
        category: 'NSW Narrative Elements - Setting',
        rule: 'nsw-setting-required'
      }));
    }

    // Check for missing characters
    if (!criteria.narrativeElements.characters) {
      errors.push(this.createNSWError({
        type: 'language-convention',
        severity: 'medium',
        message: 'Develop your characters more - give them names, personalities, and emotions',
        suggestions: [
          'Give your main character a name',
          'Describe what your character looks like',
          'Show your character\'s personality through actions'
        ],
        startPos: 0,
        endPos: 0,
        originalText: '',
        category: 'NSW Narrative Elements - Characters',
        rule: 'nsw-characters-required'
      }));
    }

    // Check for missing plot development
    if (!criteria.narrativeElements.plot) {
      errors.push(this.createNSWError({
        type: 'language-convention',
        severity: 'high',
        message: 'Your story needs a clear beginning, middle, and end with a problem to solve',
        suggestions: [
          'Start with an interesting opening',
          'Introduce a problem or challenge',
          'Show how the problem is resolved'
        ],
        startPos: 0,
        endPos: 0,
        originalText: '',
        category: 'NSW Narrative Elements - Plot',
        rule: 'nsw-plot-required'
      }));
    }

    // Check for missing dialogue
    if (!criteria.narrativeElements.dialogue && text.length > 100) {
      errors.push(this.createNSWError({
        type: 'language-convention',
        severity: 'low',
        message: 'Consider adding dialogue to make your story more engaging',
        suggestions: [
          'Add conversation between characters',
          'Use speech marks correctly: "Hello," she said.',
          'Make dialogue sound natural and age-appropriate'
        ],
        startPos: 0,
        endPos: 0,
        originalText: '',
        category: 'NSW Narrative Elements - Dialogue',
        rule: 'nsw-dialogue-recommended'
      }));
    }

    return errors;
  }

  private checkVocabularyLevel(text: string): GrammarError[] {
    const errors: GrammarError[] = [];
    const words = text.match(/\b\w+\b/g) || [];

    // Check for overuse of simple words
    const simpleWords = words.filter(word => 
      NSW_VOCABULARY_LEVELS.TOO_SIMPLE.includes(word.toLowerCase())
    );

    if (simpleWords.length > words.length * 0.2) { // More than 20% simple words
      const uniqueSimpleWords = [...new Set(simpleWords.map(w => w.toLowerCase()))];
      
      uniqueSimpleWords.forEach(word => {
        const firstOccurrence = text.toLowerCase().indexOf(word);
        if (firstOccurrence !== -1) {
          errors.push(this.createNSWError({
            type: 'language-convention',
            severity: 'low',
            message: `"${word}" is too simple for Year 6 level - try a more descriptive word`,
            suggestions: this.getYear6Synonyms(word),
            startPos: firstOccurrence,
            endPos: firstOccurrence + word.length,
            originalText: word,
            category: 'NSW Vocabulary Level',
            rule: 'nsw-vocab-too-simple'
          }));
        }
      });
    }

    // Check for overly complex words
    words.forEach(word => {
      if (NSW_VOCABULARY_LEVELS.TOO_COMPLEX.includes(word.toLowerCase())) {
        const startPos = text.indexOf(word);
        if (startPos !== -1) {
          errors.push(this.createNSWError({
            type: 'language-convention',
            severity: 'medium',
            message: `"${word}" might be too complex for Year 6 level`,
            suggestions: this.getSimplifiedSynonyms(word.toLowerCase()),
            startPos,
            endPos: startPos + word.length,
            originalText: word,
            category: 'NSW Vocabulary Level',
            rule: 'nsw-vocab-too-complex'
          }));
        }
      }
    });

    return errors;
  }

  private checkSentenceComplexity(text: string): GrammarError[] {
    const errors: GrammarError[] = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

    if (sentences.length === 0) return errors;

    const avgWordsPerSentence = text.split(/\s+/).length / sentences.length;
    const shortSentences = sentences.filter(s => s.split(/\s+/).length < 6);
    const longSentences = sentences.filter(s => s.split(/\s+/).length > 25);

    // Too many short sentences
    if (shortSentences.length > sentences.length * 0.7) {
      errors.push(this.createNSWError({
        type: 'style-flow',
        severity: 'medium',
        message: 'Your sentences are too short and simple for Year 6 level',
        suggestions: [
          'Combine some short sentences using connecting words',
          'Add more descriptive details to your sentences',
          'Use words like "because", "although", "when" to make complex sentences'
        ],
        startPos: 0,
        endPos: 0,
        originalText: '',
        category: 'NSW Sentence Complexity',
        rule: 'nsw-sentences-too-simple'
      }));
    }

    // Too many long sentences
    if (longSentences.length > sentences.length * 0.3) {
      longSentences.forEach(sentence => {
        const startPos = text.indexOf(sentence.trim());
        if (startPos !== -1) {
          errors.push(this.createNSWError({
            type: 'style-flow',
            severity: 'medium',
            message: 'This sentence is too long and complex',
            suggestions: [
              'Break this into 2-3 shorter sentences',
              'Use periods to separate different ideas',
              'Keep your main idea clear and simple'
            ],
            startPos,
            endPos: startPos + sentence.trim().length,
            originalText: sentence.trim(),
            category: 'NSW Sentence Complexity',
            rule: 'nsw-sentences-too-complex'
          }));
        }
      });
    }

    return errors;
  }

  private checkStoryStructure(text: string): GrammarError[] {
    const errors: GrammarError[] = [];
    const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);

    // Check story length for NSW selective test (should be 300-500 words ideally)
    if (words.length < 150 && text.trim().length > 0) {
      errors.push(this.createNSWError({
        type: 'language-convention',
        severity: 'medium',
        message: 'Your story is quite short - try to develop it more fully',
        suggestions: [
          'Add more descriptive details',
          'Develop your characters and setting',
          'Expand on the problem and solution'
        ],
        startPos: 0,
        endPos: 0,
        originalText: '',
        category: 'NSW Story Length',
        rule: 'nsw-story-too-short'
      }));
    }

    if (words.length > 600) {
      errors.push(this.createNSWError({
        type: 'language-convention',
        severity: 'low',
        message: 'Your story is getting quite long - make sure every part is necessary',
        suggestions: [
          'Focus on the most important parts of your story',
          'Remove any unnecessary details',
          'Keep your story focused on the main plot'
        ],
        startPos: 0,
        endPos: 0,
        originalText: '',
        category: 'NSW Story Length',
        rule: 'nsw-story-too-long'
      }));
    }

    // Check paragraph structure
    if (paragraphs.length === 1 && words.length > 100) {
      errors.push(this.createNSWError({
        type: 'style-flow',
        severity: 'medium',
        message: 'Break your story into paragraphs to make it easier to read',
        suggestions: [
          'Start a new paragraph when the scene changes',
          'Start a new paragraph when a different character speaks',
          'Use paragraphs to organize different parts of your story'
        ],
        startPos: 0,
        endPos: 0,
        originalText: '',
        category: 'NSW Story Structure',
        rule: 'nsw-needs-paragraphs'
      }));
    }

    return errors;
  }

  private checkCreativeWritingConventions(text: string): GrammarError[] {
    const errors: GrammarError[] = [];

    // Check dialogue formatting
    const dialogueMatches = text.match(/"[^"]*"/g);
    if (dialogueMatches) {
      dialogueMatches.forEach(dialogue => {
        const startPos = text.indexOf(dialogue);
        
        // Check if dialogue ends with punctuation inside quotes
        if (!/[.!?]"$/.test(dialogue) && !/[.!?]," \w+ said/.test(text.substring(startPos))) {
          errors.push(this.createNSWError({
            type: 'punctuation',
            severity: 'medium',
            message: 'Dialogue should end with punctuation inside the speech marks',
            suggestions: [
              'Put the full stop inside the speech marks: "Hello."',
              'Use exclamation marks for excitement: "Wow!"',
              'Use question marks for questions: "Are you okay?"'
            ],
            startPos,
            endPos: startPos + dialogue.length,
            originalText: dialogue,
            category: 'NSW Dialogue Conventions',
            rule: 'nsw-dialogue-punctuation'
          }));
        }

        // Check for dialogue tags
        const beforeDialogue = text.substring(Math.max(0, startPos - 20), startPos);
        const afterDialogue = text.substring(startPos + dialogue.length, startPos + dialogue.length + 20);
        
        if (!/\b(said|asked|replied|whispered|shouted|exclaimed)\b/i.test(beforeDialogue + afterDialogue)) {
          errors.push(this.createNSWError({
            type: 'language-convention',
            severity: 'low',
            message: 'Consider adding dialogue tags to show who is speaking',
            suggestions: [
              'Add "she said" or "he asked" after dialogue',
              'Use interesting dialogue tags like "whispered" or "exclaimed"',
              'Make it clear who is speaking'
            ],
            startPos,
            endPos: startPos + dialogue.length,
            originalText: dialogue,
            category: 'NSW Dialogue Conventions',
            rule: 'nsw-dialogue-tags'
          }));
        }
      });
    }

    // Check for descriptive language
    const descriptiveWords = ['beautiful', 'amazing', 'incredible', 'magnificent', 'spectacular', 'enormous', 'tiny', 'brilliant', 'dazzling', 'mysterious'];
    const hasDescriptive = descriptiveWords.some(word => text.toLowerCase().includes(word));
    
    if (!hasDescriptive && text.length > 100) {
      errors.push(this.createNSWError({
        type: 'language-convention',
        severity: 'low',
        message: 'Add more descriptive language to make your story vivid and engaging',
        suggestions: [
          'Use adjectives to describe people, places, and things',
          'Include sensory details (what you see, hear, smell, feel)',
          'Paint a picture with your words'
        ],
        startPos: 0,
        endPos: 0,
        originalText: '',
        category: 'NSW Descriptive Language',
        rule: 'nsw-needs-description'
      }));
    }

    return errors;
  }

  private generateNSWRecommendations(text: string, criteria: NSWWritingCriteria): string[] {
    const recommendations: string[] = [];

    // Narrative elements recommendations
    if (!criteria.narrativeElements.setting) {
      recommendations.push('🏞️ Add a clear setting - describe where and when your story takes place');
    }

    if (!criteria.narrativeElements.characters) {
      recommendations.push('👥 Develop your characters - give them names, personalities, and emotions');
    }

    if (!criteria.narrativeElements.plot) {
      recommendations.push('📚 Create a clear story structure with beginning, middle, and end');
    }

    if (!criteria.narrativeElements.dialogue) {
      recommendations.push('💬 Add dialogue to bring your characters to life');
    }

    // Vocabulary recommendations
    if (criteria.vocabularyLevel === 'too-simple') {
      recommendations.push('📖 Use more sophisticated vocabulary appropriate for Year 6 level');
    } else if (criteria.vocabularyLevel === 'too-complex') {
      recommendations.push('✏️ Simplify some complex words to ensure clarity');
    }

    // Sentence complexity recommendations
    if (criteria.sentenceComplexity === 'too-simple') {
      recommendations.push('🔗 Combine simple sentences to create more complex, interesting structures');
    } else if (criteria.sentenceComplexity === 'too-complex') {
      recommendations.push('✂️ Break down long sentences for better readability');
    }

    // Length recommendations
    if (criteria.storyLength < 150) {
      recommendations.push('📏 Expand your story with more details and development');
    } else if (criteria.storyLength > 500) {
      recommendations.push('🎯 Focus your story - ensure every part serves the main plot');
    }

    // Creative elements recommendations
    if (criteria.creativeElements.length < 3) {
      recommendations.push('🎨 Add more creative elements like similes, metaphors, or interesting descriptions');
    }

    return recommendations;
  }

  private calculateNSWScore(text: string, criteria: NSWWritingCriteria, errors: GrammarError[]): number {
    let score = 100;

    // Deduct points for missing narrative elements
    const narrativeElementsCount = Object.values(criteria.narrativeElements).filter(Boolean).length;
    score -= (4 - narrativeElementsCount) * 10; // 10 points per missing element

    // Deduct points for inappropriate vocabulary level
    if (criteria.vocabularyLevel === 'too-simple') score -= 15;
    if (criteria.vocabularyLevel === 'too-complex') score -= 10;

    // Deduct points for inappropriate sentence complexity
    if (criteria.sentenceComplexity === 'too-simple') score -= 15;
    if (criteria.sentenceComplexity === 'too-complex') score -= 10;

    // Deduct points for inappropriate length
    if (criteria.storyLength < 100) score -= 20;
    if (criteria.storyLength < 150) score -= 10;
    if (criteria.storyLength > 600) score -= 5;

    // Deduct points for NSW-specific errors
    const nswErrors = errors.filter(e => e.nswSpecific);
    score -= nswErrors.length * 5;

    // Bonus points for creative elements
    score += Math.min(criteria.creativeElements.length * 2, 10);

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  // Helper methods
  private hasSettingDescription(text: string): boolean {
    const settingKeywords = ['where', 'place', 'location', 'room', 'house', 'school', 'park', 'forest', 'beach', 'city', 'town', 'village'];
    const timeKeywords = ['when', 'time', 'day', 'night', 'morning', 'afternoon', 'evening', 'yesterday', 'today', 'tomorrow'];
    const descriptiveWords = ['dark', 'bright', 'cold', 'warm', 'quiet', 'noisy', 'peaceful', 'busy', 'old', 'new'];
    
    const hasLocation = settingKeywords.some(keyword => text.toLowerCase().includes(keyword));
    const hasTime = timeKeywords.some(keyword => text.toLowerCase().includes(keyword));
    const hasDescription = descriptiveWords.some(word => text.toLowerCase().includes(word));
    
    return hasLocation || hasTime || hasDescription;
  }

  private hasCharacterDevelopment(text: string): boolean {
    const characterKeywords = ['he', 'she', 'they', 'character', 'person', 'boy', 'girl', 'man', 'woman', 'friend'];
    const emotionWords = ['happy', 'sad', 'angry', 'excited', 'nervous', 'scared', 'confident', 'worried', 'surprised'];
    const actionWords = ['ran', 'walked', 'jumped', 'smiled', 'laughed', 'cried', 'shouted', 'whispered'];
    
    const hasCharacters = characterKeywords.some(keyword => text.toLowerCase().includes(keyword));
    const hasEmotions = emotionWords.some(word => text.toLowerCase().includes(word));
    const hasActions = actionWords.some(word => text.toLowerCase().includes(word));
    
    return hasCharacters && (hasEmotions || hasActions);
  }

  private hasPlotProgression(text: string): boolean {
    const structureWords = ['first', 'then', 'next', 'after', 'finally', 'beginning', 'middle', 'end'];
    const problemWords = ['problem', 'trouble', 'difficulty', 'challenge', 'conflict', 'issue'];
    const solutionWords = ['solved', 'fixed', 'resolved', 'answered', 'helped', 'saved'];
    
    const hasStructure = structureWords.some(word => text.toLowerCase().includes(word));
    const hasProblem = problemWords.some(word => text.toLowerCase().includes(word));
    const hasSolution = solutionWords.some(word => text.toLowerCase().includes(word));
    
    return hasStructure || (hasProblem && hasSolution);
  }

  private hasDialogue(text: string): boolean {
    return /"[^"]*"/.test(text);
  }

  private assessVocabularyLevel(text: string): 'too-simple' | 'appropriate' | 'too-complex' {
    const words = text.match(/\b\w+\b/g) || [];
    if (words.length === 0) return 'appropriate';

    const simpleCount = words.filter(w => NSW_VOCABULARY_LEVELS.TOO_SIMPLE.includes(w.toLowerCase())).length;
    const complexCount = words.filter(w => NSW_VOCABULARY_LEVELS.TOO_COMPLEX.includes(w.toLowerCase())).length;
    
    const simpleRatio = simpleCount / words.length;
    const complexRatio = complexCount / words.length;
    
    if (simpleRatio > 0.25) return 'too-simple';
    if (complexRatio > 0.05) return 'too-complex';
    return 'appropriate';
  }

  private assessSentenceComplexity(text: string): 'too-simple' | 'appropriate' | 'too-complex' {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length === 0) return 'appropriate';

    const avgLength = sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length;
    
    if (avgLength < 7) return 'too-simple';
    if (avgLength > 20) return 'too-complex';
    return 'appropriate';
  }

  private assessPacing(text: string): 'too-fast' | 'appropriate' | 'too-slow' {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length === 0) return 'appropriate';

    const shortSentences = sentences.filter(s => s.split(/\s+/).length < 6).length;
    const longSentences = sentences.filter(s => s.split(/\s+/).length > 15).length;
    
    const shortRatio = shortSentences / sentences.length;
    const longRatio = longSentences / sentences.length;
    
    if (shortRatio > 0.8) return 'too-fast';
    if (longRatio > 0.6) return 'too-slow';
    return 'appropriate';
  }

  private identifyCreativeElements(text: string): string[] {
    const elements: string[] = [];
    
    if (/"[^"]*"/.test(text)) elements.push('Dialogue');
    if (/\b(like|as)\s+\w+/.test(text)) elements.push('Similes');
    if (/\b(suddenly|meanwhile|however|therefore)\b/i.test(text)) elements.push('Transition words');
    if (/[.!?]{2,}/.test(text)) elements.push('Emphasis punctuation');
    if (text.split('\n\n').length > 1) elements.push('Paragraph structure');
    if (/\b(whispered|shouted|exclaimed|muttered)\b/i.test(text)) elements.push('Varied dialogue tags');
    if (/\b(enormous|tiny|magnificent|brilliant|mysterious)\b/i.test(text)) elements.push('Descriptive adjectives');
    
    return elements;
  }

  private getYear6Synonyms(word: string): string[] {
    const synonymMap: Record<string, string[]> = {
      'big': ['enormous', 'huge', 'massive', 'gigantic', 'tremendous'],
      'small': ['tiny', 'miniature', 'petite', 'compact', 'minuscule'],
      'good': ['excellent', 'wonderful', 'fantastic', 'brilliant', 'magnificent'],
      'bad': ['terrible', 'awful', 'dreadful', 'horrible', 'atrocious'],
      'nice': ['pleasant', 'delightful', 'lovely', 'charming', 'wonderful'],
      'fun': ['enjoyable', 'entertaining', 'exciting', 'thrilling', 'amusing'],
      'cool': ['amazing', 'awesome', 'incredible', 'fantastic', 'remarkable'],
      'ok': ['fine', 'acceptable', 'adequate', 'satisfactory', 'reasonable']
    };
    
    return synonymMap[word.toLowerCase()] || ['[better word]'];
  }

  private getSimplifiedSynonyms(word: string): string[] {
    const simpleMap: Record<string, string[]> = {
      'perspicacious': ['wise', 'smart', 'clever', 'insightful'],
      'ubiquitous': ['everywhere', 'common', 'widespread', 'frequent'],
      'serendipitous': ['lucky', 'fortunate', 'unexpected', 'surprising'],
      'ephemeral': ['brief', 'short', 'temporary', 'fleeting'],
      'quintessential': ['perfect', 'ideal', 'typical', 'classic'],
      'magnanimous': ['generous', 'kind', 'forgiving', 'noble'],
      'ostentatious': ['showy', 'flashy', 'fancy', 'elaborate'],
      'pretentious': ['fake', 'artificial', 'affected', 'pompous'],
      'superfluous': ['extra', 'unnecessary', 'excessive', 'surplus'],
      'obsequious': ['overly polite', 'fawning', 'servile', 'submissive']
    };
    
    return simpleMap[word] || ['[simpler word]'];
  }

  private createNSWError(params: {
    type: 'spelling' | 'grammar' | 'punctuation' | 'language-convention' | 'style-flow';
    severity: 'low' | 'medium' | 'high';
    message: string;
    suggestions: string[];
    startPos: number;
    endPos: number;
    originalText: string;
    category: string;
    rule: string;
  }): GrammarError {
    const categoryColors = {
      'spelling': '#FF4444',
      'grammar': '#4A90E2',
      'punctuation': '#FF8C00',
      'language-convention': '#8A2BE2',
      'style-flow': '#32CD32'
    };

    const categoryIcons = {
      'spelling': '📝',
      'grammar': '📖',
      'punctuation': '❗',
      'language-convention': '🎯',
      'style-flow': '🔗'
    };
    
    return {
      id: `nsw-error-${++this.errorIdCounter}`,
      type: params.type,
      severity: params.severity,
      message: params.message,
      suggestions: params.suggestions,
      startPos: params.startPos,
      endPos: params.endPos,
      originalText: params.originalText,
      category: params.category,
      icon: categoryIcons[params.type],
      color: categoryColors[params.type],
      underlineStyle: 'wavy',
      nswSpecific: true,
      rule: params.rule
    };
  }
}