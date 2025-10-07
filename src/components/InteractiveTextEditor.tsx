/**
 * Enhanced InteractiveTextEditor with improved paragraph detection and automatic feedback
 * Copy to: src/components/InteractiveTextEditor.tsx
 */
import React from "react";
import { detectNewParagraphs, detectWordThreshold } from "../lib/paragraphDetection";
import { eventBus } from "../lib/eventBus";

export interface EditorHandle {
  getText(): string;
  setText(text: string): void;
  applyFix(start: number, end: number, replacement: string): void;
}

interface InteractiveTextEditorProps {
  initial?: string;
  placeholder?: string;
  className?: string;
  onTextChange?: (text: string) => void;
  onProgressUpdate?: (metrics: any) => void;
}

export const InteractiveTextEditor = React.forwardRef<EditorHandle, InteractiveTextEditorProps>(({ 
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

  React.useImperativeHandle(ref, () => ({
    getText: () => text,
    setText: (t: string) => setText(t),
    applyFix: (start: number, end: number, replacement: string) => {
      const before = text.slice(0, start);
      const after = text.slice(end);
      const newText = before + replacement + after;
      setText(newText);
      prevRef.current = newText;
      if (onTextChange) onTextChange(newText);
    }
  }), [text, onTextChange]);

  function onChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const next = e.target.value;
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // 1. Check for completed paragraphs
    const paragraphEvents = detectNewParagraphs(prevRef.current, next);
    if (paragraphEvents.length > 0) {
      console.log("New paragraphs detected:", paragraphEvents);
      paragraphEvents.forEach(event => {
        eventBus.emit("paragraph.ready", event);
      });
    }

    // 2. Check for word threshold milestones
    const wordThresholdEvent = detectWordThreshold(prevRef.current, next, 20);
    if (wordThresholdEvent) {
      console.log("Word threshold reached:", wordThresholdEvent);
      eventBus.emit("paragraph.ready", {
        paragraph: wordThresholdEvent.text,
        index: 0,
        wordCount: wordThresholdEvent.wordCount,
        trigger: wordThresholdEvent.trigger
      });
    }

    // 3. Set up delayed feedback for when user pauses typing
    typingTimeoutRef.current = setTimeout(() => {
      const currentWordCount = next.trim() ? next.trim().split(/\s+/).length : 0;
      const lastFeedbackWordCount = lastFeedbackWordCountRef.current;
      
      // Provide feedback if user has written substantial content and paused
      if (currentWordCount >= 15 && currentWordCount > lastFeedbackWordCount + 10) {
        console.log("Typing pause detected, providing feedback");
        
        // Get the most recent content
        const paragraphs = next.split('\n\n').filter(p => p.trim());
        const recentText = paragraphs[paragraphs.length - 1] || next.slice(-200);
        
        eventBus.emit("paragraph.ready", {
          paragraph: recentText,
          index: 0,
          wordCount: currentWordCount,
          trigger: 'typing_pause'
        });
        
        lastFeedbackWordCountRef.current = currentWordCount;
      }
    }, 3000); // 3 second pause

    prevRef.current = next;
    setText(next);
    
    // Call the onTextChange callback
    if (onTextChange) {
      onTextChange(next);
    }
    
    // Call progress update callback
    if (onProgressUpdate) {
      const wordCount = next.trim() ? next.trim().split(/\s+/).length : 0;
      onProgressUpdate({ wordCount, text: next });
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
    <div className="relative">
      <textarea
        className={className}
        value={text}
        onChange={onChange}
        placeholder={placeholder}
      />
      <div className="absolute bottom-2 right-2 text-xs text-gray-400">
        {text.trim() ? text.trim().split(/\s+/).length : 0} words
      </div>
    </div>
  );
});

// Add display name for debugging
InteractiveTextEditor.displayName = 'InteractiveTextEditor';

// Default export for compatibility
export default InteractiveTextEditor;