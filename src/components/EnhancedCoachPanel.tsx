/**
 * Enhanced InteractiveTextEditor with improved error handling and safe operations
 * Fixed version to prevent ReferenceError and Array.map issues
 */
import React from "react";
import { detectNewParagraphs, detectWordThreshold } from "../lib/paragraphDetection";
import { eventBus } from "../lib/eventBus";
import { safeAccess, safeProp } from "../utils/safeOperations";

export interface EditorHandle {
  getText(): string;
  setText(text: string): void;
  applyFix(start: number, end: number, replacement: string): void;
}

export const InteractiveTextEditor = React.forwardRef<EditorHandle, { 
  initial?: string;
  placeholder?: string;
  className?: string;
  onTextChange?: (text: string) => void;
  onProgressUpdate?: (metrics: any) => void;
}>(({ 
  initial = "", 
  placeholder = "Start your draft here…",
  className = "w-full h-96 p-3 rounded-xl border",
  onTextChange,
  onProgressUpdate
}, ref) => {
  const [text, setText] = React.useState(initial);
  const prevRef = React.useRef(initial);
  const lastFeedbackWordCountRef = React.useRef(0);
  const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const [isInitialized, setIsInitialized] = React.useState(false);

  // Safe initialization
  React.useEffect(() => {
    try {
      setIsInitialized(true);
    } catch (error) {
      console.error('Editor initialization error:', error);
    }
  }, []);

  React.useImperativeHandle(ref, () => ({
    getText: () => safeAccess(() => text, ''),
    setText: (t: string) => {
      try {
        setText(t);
        if (onTextChange) {
          onTextChange(t);
        }
      } catch (error) {
        console.error('setText error:', error);
      }
    },
    applyFix: (start: number, end: number, replacement: string) => {
      try {
        const before = safeAccess(() => text.slice(0, start), '');
        const after = safeAccess(() => text.slice(end), '');
        const newText = before + replacement + after;
        setText(newText);
        prevRef.current = newText;
        if (onTextChange) {
          onTextChange(newText);
        }
      } catch (error) {
        console.error('applyFix error:', error);
      }
    }
  }), [text, onTextChange]);

  function onChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    if (!isInitialized) return;
    
    const next = safeAccess(() => e.target.value, '');
    
    try {
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // 1. Check for completed paragraphs with safe operations
      const paragraphEvents = safeAccess(() => {
        try {
          return detectNewParagraphs(prevRef.current, next);
        } catch (error) {
          console.warn('Paragraph detection error:', error);
          return [];
        }
      }, []);

      if (paragraphEvents && paragraphEvents.length > 0) {
        console.log("New paragraphs detected:", paragraphEvents);
        paragraphEvents.forEach(event => {
          try {
            eventBus.emit("paragraph.ready", event);
          } catch (error) {
            console.warn('Event emission error:', error);
          }
        });
      }

      // 2. Check for word threshold milestones with safe operations
      const wordThresholdEvent = safeAccess(() => {
        try {
          return detectWordThreshold(prevRef.current, next, 20);
        } catch (error) {
          console.warn('Word threshold detection error:', error);
          return null;
        }
      }, null);

      if (wordThresholdEvent) {
        console.log("Word threshold reached:", wordThresholdEvent);
        try {
          eventBus.emit("paragraph.ready", {
            paragraph: safeProp(wordThresholdEvent, 'text', ''),
            index: 0,
            wordCount: safeProp(wordThresholdEvent, 'wordCount', 0),
            trigger: safeProp(wordThresholdEvent, 'trigger', 'word_threshold')
          });
        } catch (error) {
          console.warn('Word threshold event emission error:', error);
        }
      }

      // 3. Set up delayed feedback for when user pauses typing
      typingTimeoutRef.current = setTimeout(() => {
        try {
          const currentWordCount = safeAccess(() => {
            return next.trim() ? next.trim().split(/\s+/).length : 0;
          }, 0);
          
          const lastFeedbackWordCount = lastFeedbackWordCountRef.current;
          
          // Provide feedback if user has written substantial content and paused
          if (currentWordCount >= 15 && currentWordCount > lastFeedbackWordCount + 10) {
            console.log("Typing pause detected, providing feedback");
            
            // Get the most recent content safely
            const paragraphs = safeAccess(() => {
              return next.split('\n\n').filter(p => p.trim());
            }, []);
            
            const recentText = safeAccess(() => {
              return paragraphs.length > 0 ? paragraphs[paragraphs.length - 1] : next.slice(-200);
            }, next.slice(-200) || '');
            
            try {
              eventBus.emit("paragraph.ready", {
                paragraph: recentText,
                index: 0,
                wordCount: currentWordCount,
                trigger: 'typing_pause'
              });
            } catch (error) {
              console.warn('Typing pause event emission error:', error);
            }
            
            lastFeedbackWordCountRef.current = currentWordCount;
          }

          // Call progress update callback if provided
          if (onProgressUpdate) {
            try {
              onProgressUpdate({
                wordCount: currentWordCount,
                characterCount: next.length,
                paragraphCount: paragraphs.length
              });
            } catch (error) {
              console.warn('Progress update error:', error);
            }
          }
        } catch (error) {
          console.error('Typing timeout handler error:', error);
        }
      }, 3000); // 3 second pause

      prevRef.current = next;
      setText(next);
      
      // Call text change callback if provided
      if (onTextChange) {
        try {
          onTextChange(next);
        } catch (error) {
          console.warn('Text change callback error:', error);
        }
      }
      
    } catch (error) {
      console.error('onChange error:', error);
      // Fallback: just update the text without advanced features
      setText(next);
      if (onTextChange) {
        try {
          onTextChange(next);
        } catch (callbackError) {
          console.error('Fallback text change callback error:', callbackError);
        }
      }
    }
  }

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      try {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      } catch (error) {
        console.warn('Cleanup error:', error);
      }
    };
  }, []);

  // Safe word count calculation
  const wordCount = safeAccess(() => {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  }, 0);

  return (
    <div className="relative">
      <textarea
        className={className}
        value={text}
        onChange={onChange}
        placeholder={placeholder}
        style={{ minHeight: '200px' }} // Ensure minimum height
      />
      <div className="absolute bottom-2 right-2 text-xs text-gray-400">
        {wordCount} words
      </div>
    </div>
  );
});

InteractiveTextEditor.displayName = 'InteractiveTextEditor';