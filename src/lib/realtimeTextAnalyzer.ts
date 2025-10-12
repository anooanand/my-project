// Real-time text analysis engine for color-coded highlighting

export interface TextHighlight {
  start: number;
  end: number;
  color: string;
  type: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface AnalysisStats {
  grammar: number;
  weakWords: number;
  passiveVoice: number;
  excessiveAdjectives: number;
  sentenceIssues: number;
  spelling: number;
}

// Weak words list
const WEAK_WORDS = [
  'very', 'really', 'quite', 'just', 'actually',
  'good', 'bad', 'nice', 'great',
  'things', 'stuff',
  'a lot', 'lots of',
  'got', 'get', 'gets', 'getting'
];

// Common spelling errors (basic list)
const COMMON_MISSPELLINGS: Record<string, string> = {
  'teh': 'the',
  'recieve': 'receive',
  'seperate': 'separate',
  'definately': 'definitely',
  'occured': 'occurred',
  'occuring': 'occurring',
  'untill': 'until',
  'thier': 'their',
  'wierd': 'weird',
  'beleive': 'believe'
};

// Detect weak words
export function detectWeakWords(text: string): TextHighlight[] {
  const highlights: TextHighlight[] = [];

  WEAK_WORDS.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
      highlights.push({
        start: match.index,
        end: match.index + match[0].length,
        color: '#ff8c00',
        type: 'weak-word',
        message: `Consider replacing "${match[0]}" with a more specific word`,
        severity: 'warning'
      });
    }
  });

  return highlights;
}

// Detect passive voice
export function detectPassiveVoice(text: string): TextHighlight[] {
  const highlights: TextHighlight[] = [];

  // Pattern: to be verb + past participle (ending in -ed, -en, -t, etc.)
  const passivePatterns = [
    /\b(am|is|are|was|were|be|been|being)\s+([\w]+ed)\b/gi,
    /\b(am|is|are|was|were|be|been|being)\s+(taken|written|given|seen|done|made|known|shown|found|told)\b/gi
  ];

  passivePatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      highlights.push({
        start: match.index,
        end: match.index + match[0].length,
        color: '#4169e1',
        type: 'passive-voice',
        message: 'Consider using active voice for stronger writing',
        severity: 'info'
      });
    }
  });

  return highlights;
}

// Detect excessive adjectives
export function detectExcessiveAdjectives(text: string): TextHighlight[] {
  const highlights: TextHighlight[] = [];

  // Pattern: multiple adjectives before a noun
  // Simplified: 3+ consecutive descriptive words before a noun
  const adjectivePattern = /\b([A-Z][a-z]+\s+)?([a-z]+,?\s+){3,}[a-z]+\b/g;

  let match;
  while ((match = adjectivePattern.exec(text)) !== null) {
    const phrase = match[0];
    const words = phrase.split(/[\s,]+/).filter(w => w.length > 0);

    // Check if we have multiple descriptive words
    if (words.length >= 4) {
      highlights.push({
        start: match.index,
        end: match.index + phrase.length,
        color: '#32cd32',
        type: 'excessive-adjectives',
        message: `Too many adjectives (${words.length}). Consider reducing to 1-2 strongest ones`,
        severity: 'warning'
      });
    }
  }

  return highlights;
}

// Detect sentence structure issues
export function detectSentenceIssues(text: string): TextHighlight[] {
  const highlights: TextHighlight[] = [];

  // Split into sentences
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];

  let position = 0;
  const sentenceStarts: { [key: string]: number[] } = {};

  sentences.forEach((sentence, index) => {
    const trimmed = sentence.trim();
    const wordCount = trimmed.split(/\s+/).length;

    // Find position in original text
    const sentenceStart = text.indexOf(trimmed, position);
    const sentenceEnd = sentenceStart + trimmed.length;
    position = sentenceEnd;

    // Check for too long (40+ words)
    if (wordCount > 40) {
      highlights.push({
        start: sentenceStart,
        end: sentenceEnd,
        color: '#9370db',
        type: 'sentence-too-long',
        message: `Sentence is too long (${wordCount} words). Consider breaking it into shorter sentences`,
        severity: 'warning'
      });
    }

    // Check for too short (less than 5 words, excluding dialogue)
    if (wordCount < 5 && !trimmed.includes('"') && !trimmed.includes("'")) {
      highlights.push({
        start: sentenceStart,
        end: sentenceEnd,
        color: '#9370db',
        type: 'sentence-too-short',
        message: `Sentence is very short (${wordCount} words). Consider expanding it`,
        severity: 'info'
      });
    }

    // Track sentence starts for repetition detection
    const firstWord = trimmed.split(/\s+/)[0].toLowerCase().replace(/[^a-z]/g, '');
    if (firstWord) {
      if (!sentenceStarts[firstWord]) {
        sentenceStarts[firstWord] = [];
      }
      sentenceStarts[firstWord].push(sentenceStart);
    }
  });

  // Check for repetitive sentence starts (3+ sentences starting with same word)
  Object.entries(sentenceStarts).forEach(([word, positions]) => {
    if (positions.length >= 3) {
      positions.forEach(pos => {
        const sentenceEnd = text.indexOf('.', pos);
        if (sentenceEnd !== -1) {
          highlights.push({
            start: pos,
            end: Math.min(pos + word.length + 1, sentenceEnd),
            color: '#9370db',
            type: 'repetitive-start',
            message: `Repetitive sentence start. ${positions.length} sentences start with "${word}"`,
            severity: 'info'
          });
        }
      });
    }
  });

  return highlights;
}

// Detect basic spelling errors
export function detectSpellingErrors(text: string): TextHighlight[] {
  const highlights: TextHighlight[] = [];

  Object.entries(COMMON_MISSPELLINGS).forEach(([wrong, correct]) => {
    const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
      highlights.push({
        start: match.index,
        end: match.index + match[0].length,
        color: '#ffd700',
        type: 'spelling',
        message: `Possible spelling error. Did you mean "${correct}"?`,
        severity: 'error'
      });
    }
  });

  return highlights;
}

// Detect basic grammar errors
export function detectGrammarErrors(text: string): TextHighlight[] {
  const highlights: TextHighlight[] = [];

  // Common grammar patterns
  const grammarPatterns = [
    // Double negatives
    { pattern: /\b(don't|doesn't|didn't|won't|wouldn't|can't|couldn't)\s+(no|nothing|nobody|never)\b/gi, message: 'Double negative detected' },
    // Subject-verb agreement: "He don't" instead of "He doesn't"
    { pattern: /\b(he|she|it)\s+don't\b/gi, message: 'Subject-verb agreement error. Use "doesn\'t" instead of "don\'t"' },
    // "Could of" instead of "could have"
    { pattern: /\b(could|would|should|might|must)\s+of\b/gi, message: 'Use "have" instead of "of"' },
    // Run-on with comma splice
    { pattern: /[a-z]+,\s*[a-z]+\s+(and|but|or)\s+[a-z]+,\s*[a-z]+/gi, message: 'Possible run-on sentence or comma splice' },
    // Their/There/They're confusion
    { pattern: /\btheir\s+(going|coming|doing|running|walking)\b/gi, message: 'Did you mean "they\'re" (they are)?' },
    { pattern: /\bthere\s+(going|coming|doing|running|walking)\b/gi, message: 'Did you mean "they\'re" (they are)?' },
    // Your/You're confusion
    { pattern: /\byour\s+(going|coming|doing|running|walking)\b/gi, message: 'Did you mean "you\'re" (you are)?' },
    // Its/It's confusion
    { pattern: /\bits\s+(going|coming|doing|running|walking)\b/gi, message: 'Did you mean "it\'s" (it is)?' }
  ];

  grammarPatterns.forEach(({ pattern, message }) => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      highlights.push({
        start: match.index,
        end: match.index + match[0].length,
        color: '#ff4444',
        type: 'grammar',
        message,
        severity: 'error'
      });
    }
  });

  return highlights;
}

// Main analysis function
export function analyzeText(text: string): { highlights: TextHighlight[], stats: AnalysisStats } {
  const highlights: TextHighlight[] = [];

  // Run all detection algorithms
  highlights.push(...detectGrammarErrors(text));
  highlights.push(...detectWeakWords(text));
  highlights.push(...detectPassiveVoice(text));
  highlights.push(...detectExcessiveAdjectives(text));
  highlights.push(...detectSentenceIssues(text));
  highlights.push(...detectSpellingErrors(text));

  // Sort by position
  highlights.sort((a, b) => a.start - b.start);

  // Calculate statistics
  const stats: AnalysisStats = {
    grammar: highlights.filter(h => h.type.includes('grammar')).length,
    weakWords: highlights.filter(h => h.type === 'weak-word').length,
    passiveVoice: highlights.filter(h => h.type === 'passive-voice').length,
    excessiveAdjectives: highlights.filter(h => h.type === 'excessive-adjectives').length,
    sentenceIssues: highlights.filter(h => h.type.includes('sentence') || h.type === 'repetitive-start').length,
    spelling: highlights.filter(h => h.type === 'spelling').length
  };

  return { highlights, stats };
}
