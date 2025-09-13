import React from "react";
import { eventBus } from "../lib/eventBus";
import { coachTip } from "../lib/api";
import { FeedbackChat, FeedbackMsg } from "./FeedbackChat.tsx";

export function CoachProvider() {
  const [messages, setMessages] = React.useState<FeedbackMsg[]>([]);

  React.useEffect(() => {
    const handler = async (p: { paragraph: string; index: number }) => {
      try {
        // Validate paragraph content before processing
        if (!p.paragraph || typeof p.paragraph !== 'string' || p.paragraph.trim().length === 0) {
          console.warn("Invalid paragraph content received:", p);
          return;
        }

        const res = await coachTip(p.paragraph);
        
        // Ensure we have valid feedback before adding to messages
        if (res && (res.tip || res.exampleRewrite)) {
          setMessages(prev => [
            ...prev,
            {
              id: (globalThis.crypto?.randomUUID?.() ?? String(Date.now())),
              paragraph: p.paragraph,
              feedback: res.exampleRewrite ? `${res.tip}\n\nExample: ${res.exampleRewrite}` : res.tip,
              ts: Date.now()
            }
          ]);
        }
      } catch (e: any) {
        console.error("coachTip failed:", e?.message || e);
        
        // Add a fallback message to show something went wrong
        setMessages(prev => [
          ...prev,
          {
            id: (globalThis.crypto?.randomUUID?.() ?? String(Date.now())),
            paragraph: p.paragraph || "Unknown content",
            feedback: "Sorry, I couldn't provide feedback for this paragraph. Please try again!",
            ts: Date.now()
          }
        ]);
      }
    };
    
    eventBus.on("paragraph.ready", handler);
    return () => eventBus.off("paragraph.ready", handler);
  }, []);

  return <FeedbackChat messages={messages} />;
}