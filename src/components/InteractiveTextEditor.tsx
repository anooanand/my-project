/**
 * Minimal example editor integrating paragraph detection and apply-fix logic.
 * If you already have an editor, port the key bits:
 *  - emit paragraph.ready via eventBus when a paragraph is completed
 *  - expose applyFix(start, end, replacement)
 * Copy to: src/components/InteractiveTextEditor.tsx
 */
import React from "react";
import { detectNewParagraphs } from "../lib/paragraphDetection";
import { eventBus } from "../lib/eventBus";

export interface EditorHandle {
  getText(): string;
  setText(text: string): void;
  applyFix(start: number, end: number, replacement: string): void;
}

export const InteractiveTextEditor = React.forwardRef<EditorHandle, { initial?: string }>(
  ({ initial = "" }, ref) => {
    const [text, setText] = React.useState(initial);
    const prevRef = React.useRef(initial);

    React.useImperativeHandle(ref, () => ({
      getText: () => text,
      setText: (t: string) => setText(t),
      applyFix: (start: number, end: number, replacement: string) => {
        const before = text.slice(0, start);
        const after = text.slice(end);
        setText(before + replacement + after);
      }
    }), [text]);

    function onChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
      const next = e.target.value;
      const events = detectNewParagraphs(prevRef.current, next);
      if (events.length > 0) {
        // Emit only the last completed paragraph for brevity
        eventBus.emit("paragraph.ready", events[events.length - 1]);
      }
      prevRef.current = next;
      setText(next);
    }

    return (
      <textarea
        className="w-full h-96 p-3 rounded-xl border"
        value={text}
        onChange={onChange}
        placeholder="Start your draft here…"
      />
    );
  }
);
