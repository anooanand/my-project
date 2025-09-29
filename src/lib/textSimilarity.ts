export function calculateSimilarity(text1: string, text2: string): number {
  const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();

  const normalizedText1 = normalize(text1);
  const normalizedText2 = normalize(text2);

  console.log("Normalized Text 1:", normalizedText1);
  console.log("Normalized Text 2:", normalizedText2);

  if (normalizedText1.length === 0 || normalizedText2.length === 0) {
    return 0;
  }

  const words1 = normalizedText1.split(" ");
  const words2 = normalizedText2.split(" ");

  const intersection = new Set(words1.filter(word => words2.includes(word)));
  const union = new Set([...words1, ...words2]);

  const similarity = (intersection.size / union.size) * 100;
  console.log("Calculated Similarity:", similarity);
  return similarity;
}

export function removePromptFromContent(content: string, prompt: string): string {
  const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();

  const normalizedContent = normalize(content);
  const normalizedPrompt = normalize(prompt);

  // Check if the normalized content starts with the normalized prompt
  if (normalizedContent.startsWith(normalizedPrompt)) {
    // Remove the prompt part from the content
    const remainingContent = content.substring(normalizedPrompt.length).trim();
    return remainingContent;
  }

  return content; // Return original content if prompt is not at the beginning
}

