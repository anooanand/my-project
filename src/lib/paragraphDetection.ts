/**
 * Paragraph detection: detects newly completed paragraphs based on double newlines
 * or sentence ending followed by newline. Customize as needed.
 * Copy to: src/lib/paragraphDetection.ts
 */
export function splitParas(text: string): string[] {
  return text
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(Boolean);
}

export function detectNewParagraphs(prev: string, next: string): { paragraph: string; index: number }[] {
  const a = splitParas(prev);
  const b = splitParas(next);
  const out: { paragraph: string; index: number }[] = [];
  for (let i = 0; i < b.length; i++) {
    if (i >= a.length || a[i] !== b[i]) {
      // Emit only the last stable paragraph (avoid noise while typing)
      if (i - 1 >= 0 && b[i-1] && (i-1) < b.length) {
        out.push({ paragraph: b[i-1], index: i-1 });
      }
      break;
    }
  }
  return out;
}
