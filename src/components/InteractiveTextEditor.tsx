/**
 * FIXED InteractiveTextEditor - Direct fix for ReferenceError issues
 * Replace your src/components/InteractiveTextEditor.tsx with this content
 */
import React from "react";

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
  const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useImperativeHandle(ref, () => ({
    getText: () => text,
    setText: (t: string) => {
      setText(t);
      if (onTextChange) {
        onTextChange(t);
      }
    },
    applyFix: (start: number, end: number, replacement: string) => {
      try {
        const before = text.slice(0, start);
        const after = text.slice(end);
        const newText = before + replacement + after;
        setText(newText);
        prevRef.current = newText;
        if (onTextChange) {
          onTextChange(newText);
        }
      } catch (error) {
        console.warn('applyFix error:', error);
      }
    }
  }), [text, onTextChange]);

  function onChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const next = e.target.value;
    
    try {
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Simple paragraph detection without external dependencies
      const paragraphs = next.split('\n\n').filter(p => p.trim());
      const prevParagraphs = prevRef.current.split('\n\n').filter(p => p.trim());
      
      // Basic word count
      const wordCount = next.trim() ? next.trim().split(/\s+/).length : 0;
      
      // Call progress update if provided
      if (onProgressUpdate) {
        try {
          onProgressUpdate({
            wordCount,
            characterCount: next.length,
            paragraphCount: paragraphs.length
          });
        } catch (error) {
          console.warn('Progress update error:', error);
        }
      }

      // Set up delayed feedback for when user pauses typing
      typingTimeoutRef.current = setTimeout(() => {
        try {
          // Simple feedback trigger without complex dependencies
          if (wordCount >= 15) {
            console.log("Typing pause detected, word count:", wordCount);
          }
        } catch (error) {
          console.warn('Typing timeout error:', error);
        }
      }, 3000);

      prevRef.current = next;
      setText(next);
      
      // Call text change callback if provided
      if (onTextChange) {
        onTextChange(next);
      }
      
    } catch (error) {
      console.warn('onChange error:', error);
      // Fallback: just update the text
      setText(next);
      if (onTextChange) {
        onTextChange(next);
      }
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

  // Safe word count calculation
  const wordCount = React.useMemo(() => {
    try {
      return text.trim() ? text.trim().split(/\s+/).length : 0;
    } catch (error) {
      return 0;
    }
  }, [text]);

  return (
    <div className="relative">
      <textarea
        className={className}
        value={text}
        onChange={onChange}
        placeholder={placeholder}
        style={{ minHeight: '200px' }}
      />
      <div className="absolute bottom-2 right-2 text-xs text-gray-400">
        {wordCount} words
      </div>
    </div>
  );
});

InteractiveTextEditor.displayName = 'InteractiveTextEditor';