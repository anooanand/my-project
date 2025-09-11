// src/lib/api.ts
import type { DetailedFeedback } from "../types/feedback";

async function json(res: Response) {
  if (!res.ok) throw new Error(await res.text() || res.statusText);
  return res.json();
}

export async function evaluateEssay(payload: {
  essayText: string;
  textType: "narrative" | "persuasive" | "informative";
  assistanceLevel?: "minimal" | "standard" | "comprehensive";
  examMode?: boolean;
}): Promise<DetailedFeedback> {
  const res = await fetch("/.netlify/functions/ai-feedback", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return json(res);
}

export async function coachTip(paragraph: string): Promise<{ tip: string; exampleRewrite?: string }> {
  const res = await fetch("/.netlify/functions/coach-tip", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paragraph })
  });
  return json(res);
}

export async function saveDraft(id: string, text: string, version: number) {
  const res = await fetch(`/.netlify/functions/drafts?id=${encodeURIComponent(id)}`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, version, ts: Date.now() })
  });
  return json(res);
}
