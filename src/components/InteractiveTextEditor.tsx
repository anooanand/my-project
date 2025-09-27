/**
 * WORKING InteractiveTextEditor - Based on the old working version
 * Replace your src/components/InteractiveTextEditor.tsx with this content
 */
import React from "react";

// Safe versions of the utility functions
const safeDetectNewParagraphs = (prev: string, next: string): { paragraph: string; index: number }[] => {
  try {
    if (!prev || !next || typeof prev !== 'string' || typeof next !== 'string') {
      return [];
    }

    const splitParas = (text: string): string[] => {
      try {
        return text
          .replace(/\r\n/g, "\n")
          .split(/\n\s*\n/)
          .map(p => p.trim())
          .filter(Boolean);
      } catch (error) {
        return [];
      }
    };

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
    console.warn('safeDetectNewParagraphs error:', error);
    return [];
  }
};

const safeDetectWordThreshold = (
  prev: string,
  next: string,
  wordThreshold: number = 20
): { text: string; wordCount: number; trigger: string } | null => {
  try {
    if (!prev || !next || typeof prev !== 'string' || typeof next !== 'string') {
      return null;
    }

    const prevWords = prev.trim() ? prev.trim().split(/\s+/).length : 0;
    const nextWords = next.trim() ? next.trim().split(/\s+/).length : 0;
    
    // First time reaching word threshold
    if (prevWords < wordThreshold && nextWords >= wordThreshold) {
      return {
        text: next,
        wordCount: nextWords,
        trigger: 'initial_threshold'
      };
    }
    
    return null;
  } catch (error) {
    console.warn('safeDetectWordThreshold error:', error);
    return null;
  }
};

// Safe event bus
const safeEventBus = {
  emit: (event: string, data: any) => {
    try {
      // Simple console log instead of complex event system
      console.log(`Event: ${event}`, data);
    } catch (error) {
      console.warn('Event bus error:', error);
    }
  }
};

export interface EditorHandle {
  getText(): string;
  setText(text: string): void;
  applyFix(start: number, end: number, replacement: string): void;
}

export const InteractiveTextEditor = React.forwardRef<EditorHandle, { 
  initial?: string;
  placeholder?: string;
  className?: string;
}>(({ 
  initial = "", 
  placeholder = "Start your draft here…",
  className = "w-full h-96 p-3 rounded-xl border"
}, ref) => {
  const [text, setText] = React.useState(initial);
  const prevRef = React.useRef(initial);
  const lastFeedbackWordCountRef = React.useRef(0);
  const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useImperativeHandle(ref, () => ({
    getText: () => text,
    setText: (t: string) => setText(t),
    applyFix: (start: number, end: number, replacement: string) => {
      try {
        const before = text.slice(0, start);
        const after = text.slice(end);
        const newText = before + replacement + after;
        setText(newText);
        prevRef.current = newText;
      } catch (error) {
        console.warn('applyFix error:', error);
      }
    }
  }), [text]);

  function onChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    try {
      const next = e.target.value;
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // 1. Check for completed paragraphs (safe version)
      const paragraphEvents = safeDetectNewParagraphs(prevRef.current, next);
      paragraphEvents.forEach(event => {
        safeEventBus.emit('paragraph.ready', event);
      });

      // 2. Check for word threshold milestones (safe version)
      const wordThresholdEvent = safeDetectWordThreshold(prevRef.current, next, 20);
      if (wordThresholdEvent && wordThresholdEvent.wordCount > lastFeedbackWordCountRef.current + 15) {
        safeEventBus.emit('word.threshold', wordThresholdEvent);
        lastFeedbackWordCountRef.current = wordThresholdEvent.wordCount;
      }

      // 3. Set up delayed feedback for when user pauses typing
      typingTimeoutRef.current = setTimeout(() => {
        try {
          const currentWordCount = next.trim() ? next.trim().split(/\s+/).length : 0;
          if (currentWordCount >= 15) {
            safeEventBus.emit('typing.pause', {
              text: next,
              wordCount: currentWordCount,
              trigger: 'pause_feedback'
            });
          }
        } catch (error) {
          console.warn('Typing timeout error:', error);
        }
      }, 3000);

      prevRef.current = next;
      setText(next);
    } catch (error) {
      console.warn('onChange error:', error);
      // Fallback: just update the text
      setText(e.target.value);
    }
  }

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <textarea
      className={className}
      value={text}
      onChange={onChange}
      placeholder={placeholder}
    />
  );
});

InteractiveTextEditor.displayName = 'InteractiveTextEditor';