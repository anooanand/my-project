/**
 * Sidebar chat for paragraph-level tips.
 * Copy to: src/components/FeedbackChat.tsx
 */
import React from "react";

export interface FeedbackMsg {
  id: string;
  paragraph: string;
  feedback: string;
  ts: number;
}

export function FeedbackChat({ messages }: { messages: FeedbackMsg[] }) {
  return (
    <div className="space-y-3">
      {messages.map(m => (
        <div key={m.id} className="rounded-2xl p-3 shadow">
          <div className="text-xs opacity-70">From your paragraph:</div>
          <blockquote className="mt-1 italic leading-snug">“{m.paragraph}”</blockquote>
          <div className="mt-2 text-sm">{m.feedback}</div>
          <div className="text-[10px] opacity-60 mt-1">{new Date(m.ts).toLocaleTimeString()}</div>
        </div>
      ))}
    </div>
  );
}
