export function splitParas(text: string): string[] {
  return text
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(Boolean);
}

export function detectNewParagraphs(
  prev: string,
  next: string
): { paragraph: string; index: number }[] {
  const a = splitParas(prev);
  const b = splitParas(next);
  const out: { paragraph: string; index: number }[] = [];

  const max = Math.max(a.length, b.length);
  let pivot = -1;
  for (let i = 0; i < max; i++) {
    if (a[i] !== b[i]) { pivot = i; break; }
  }
  if (pivot === -1) return out;

  const completedIndex = pivot - 1;
  if (completedIndex >= 0 && completedIndex < b.length && b[completedIndex]) {
    out.push({ paragraph: b[completedIndex], index: completedIndex });
  }
  return out;
}
