// src/lib/paragraphDetection.ts
export function splitParas(text: string): string[] {
  return text.replace(/\r\n/g, "\n").split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
}
export function detectNewParagraphs(prev: string, next: string): { paragraph: string; index: number }[] {
  const a = splitParas(prev);
  const b = splitParas(next);
  const out: { paragraph: string; index: number }[] = [];
  for (let i = 0; i < b.length; i++) {
    if (i >= a.length || a[i] !== b[i])
