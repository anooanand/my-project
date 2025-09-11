// src/components/CoachProvider.tsx
import React from "react";
import { eventBus } from "../lib/eventBus";
import { coachTip } from "../lib/api";
import { FeedbackChat, FeedbackMsg } from "./FeedbackChat";

export function CoachProvider() {
  const [messages, setMessages] = React.useState<FeedbackMsg[]>([]);

  React.useEffect(() => {
    const handler = async (p: { paragraph: string; index: number }) => {
      try {
        const res = await coachTip(p.paragraph);
        setMessages(prev => [
          ...prev,
          {
            id: (globalThis.crypto?.randomUUID?.() ?? String(Date.now())),
            paragraph: p.paragraph,
            feedback: res.exampleRewrite
              ? `${res.tip}\n\nExample: ${res.exampleRewrite}`
              : res.tip,
            ts: Date.now()
          }
        ]);
      } catch (e: any) {
        console.error("coachTip failed:", e?.message || e);
      }
    };
    eventBus.on("paragraph.ready", handler);
    return () => eventBus.off("paragraph.ready", handler);
  }, []);

  return <FeedbackChat messages={messages} />;
}
