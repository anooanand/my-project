export function splitParas(text: string): string[] {
  return text
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(Boolean);
}

export function detectNewParagraphs(
  prev: string,
  next: string
): { paragraph: string; index: number }[] {
  const a = splitParas(prev);
  const b = splitParas(next);
  const out: { paragraph: string; index: number }[] = [];

  const max = Math.max(a.length, b.length);
  let pivot = -1;
  for (let i = 0; i < max; i++) {
    if (a[i] !== b[i]) { pivot = i; break; }
  }
  if (pivot === -1) return out;

  const completedIndex = pivot - 1;
  if (completedIndex >= 0 && completedIndex < b.length && b[completedIndex]) {
    out.push({ paragraph: b[completedIndex], index: completedIndex });
  }
  return out;
}

// Enhanced function to detect ongoing writing progress and provide feedback
export function detectWordThreshold(
  prev: string,
  next: string,
  wordThreshold: number = 20
): { text: string; wordCount: number; trigger: string } | null {
  const prevWords = prev.trim() ? prev.trim().split(/\s+/).length : 0;
  const nextWords = next.trim() ? next.trim().split(/\s+/).length : 0;
  
  // Get the current paragraph being written (last paragraph)
  const paragraphs = splitParas(next);
  const currentParagraph = paragraphs[paragraphs.length - 1] || '';
  const currentParaWords = currentParagraph.trim() ? currentParagraph.trim().split(/\s+/).length : 0;
  
  // Trigger feedback in multiple scenarios:
  
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
  
  // 5. Detect specific writing patterns that deserve feedback
  const recentText = next.slice(Math.max(0, next.length - 100)); // Last 100 characters
  
  // Check for dialogue
  if (recentText.includes('"') && !prev.slice(Math.max(0, prev.length - 100)).includes('"')) {
    return {
      text: currentParagraph || recentText,
      wordCount: nextWords,
      trigger: 'dialogue_detected'
    };
  }
  
  // Check for transition words
  const transitionWords = ['then', 'next', 'after', 'finally', 'meanwhile', 'suddenly', 'however'];
  const hasNewTransition = transitionWords.some(word => 
    recentText.toLowerCase().includes(word) && 
    !prev.slice(Math.max(0, prev.length - 100)).toLowerCase().includes(word)
  );
  
  if (hasNewTransition && nextWords >= 20) {
    return {
      text: currentParagraph || recentText,
      wordCount: nextWords,
      trigger: 'transition_detected'
    };
  }
  
  return null;
}

// New function to detect when user pauses writing (for delayed feedback)
export function detectWritingPause(
  lastChangeTime: number,
  pauseThreshold: number = 3000 // 3 seconds
): boolean {
  return Date.now() - lastChangeTime >= pauseThreshold;
}
