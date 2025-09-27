/**
 * FIXED paragraphDetection.ts - Safe version without ReferenceError issues
 * Replace your src/lib/paragraphDetection.ts with this content
 */

export function splitParas(text: string): string[] {
  try {
    if (!text || typeof text !== 'string') {
      return [];
    }
    
    return text
      .replace(/\r\n/g, "\n")
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(Boolean);
  } catch (error) {
    console.warn('splitParas error:', error);
    return [];
  }
}

export function detectNewParagraphs(
  prev: string,
  next: string
): { paragraph: string; index: number }[] {
  try {
    if (!prev || !next || typeof prev !== 'string' || typeof next !== 'string') {
      return [];
    }

    const a = splitParas(prev);
    const b = splitParas(next);
    const out: { paragraph: string; index: number }[] = [];

    const max = Math.max(a.length, b.length);
    let pivot = -1;
    
    for (let i = 0; i < max; i++) {
      if (a[i] !== b[i]) { 
        pivot = i; 
        break; 
      }
    }
    
    if (pivot === -1) return out;

    const completedIndex = pivot - 1;
    if (completedIndex >= 0 && completedIndex < b.length && b[completedIndex]) {
      out.push({ paragraph: b[completedIndex], index: completedIndex });
    }
    
    return out;
  } catch (error) {
    console.warn('detectNewParagraphs error:', error);
    return [];
  }
}

export function detectWordThreshold(
  prev: string,
  next: string,
  wordThreshold: number = 20
): { text: string; wordCount: number; trigger: string } | null {
  try {
    if (!prev || !next || typeof prev !== 'string' || typeof next !== 'string') {
      return null;
    }

    const prevWords = prev.trim() ? prev.trim().split(/\s+/).length : 0;
    const nextWords = next.trim() ? next.trim().split(/\s+/).length : 0;
    
    // Get the current paragraph being written (last paragraph)
    const paragraphs = splitParas(next);
    const currentParagraph = paragraphs[paragraphs.length - 1] || '';
    const currentParaWords = currentParagraph.trim() ? currentParagraph.trim().split(/\s+/).length : 0;
    
    // 1. First time reaching word threshold
    if (prevWords < wordThreshold && nextWords >= wordThreshold) {
      return {
        text: next,
        wordCount: nextWords,
        trigger: 'initial_threshold'
      };
    }
    
    // 2. Every 30 words of new content (ongoing feedback)
    const wordDifference = nextWords - prevWords;
    if (wordDifference >= 30 && nextWords >= wordThreshold) {
      return {
        text: next,
        wordCount: nextWords,
        trigger: 'progress_milestone'
      };
    }
    
    // 3. When completing a substantial paragraph (25+ words)
    const prevParagraphs = splitParas(prev);
    const nextParagraphs = splitParas(next);
    
    if (nextParagraphs.length > prevParagraphs.length) {
      // New paragraph was created, check if the previous one was substantial
      const completedParagraph = nextParagraphs[nextParagraphs.length - 2];
      if (completedParagraph) {
        const completedWords = completedParagraph.trim().split(/\s+/).length;
        if (completedWords >= 25) {
          return {
            text: completedParagraph,
            wordCount: completedWords,
            trigger: 'paragraph_completed'
          };
        }
      }
    }
    
    // 4. When current paragraph reaches certain milestones
    if (currentParaWords >= 40 && currentParaWords % 20 === 0) {
      return {
        text: currentParagraph,
        wordCount: currentParaWords,
        trigger: 'paragraph_milestone'
      };
    }
    
    return null;
  } catch (error) {
    console.warn('detectWordThreshold error:', error);
    return null;
  }
}

export function detectWritingPause(
  lastChangeTime: number,
  pauseThreshold: number = 3000
): boolean {
  try {
    return Date.now() - lastChangeTime >= pauseThreshold;
  } catch (error) {
    console.warn('detectWritingPause error:', error);
    return false;
  }
}