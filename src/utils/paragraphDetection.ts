/**
 * Utility functions for detecting completed paragraphs in real-time writing
 */

export interface DetectedParagraph {
  content: string;
  startIndex: number;
  endIndex: number;
  paragraphNumber: number;
}

/**
 * Detects newly completed paragraphs by comparing old and new text content
 * @param oldContent - Previous text content
 * @param newContent - Current text content
 * @returns Array of newly completed paragraphs
 */
export function detectNewParagraphs(oldContent: string, newContent: string): DetectedParagraph[] {
  // If content is shorter than before, no new paragraphs
  if (newContent.length < oldContent.length) {
    return [];
  }

  // Split both texts into paragraphs
  const oldParagraphs = splitIntoParagraphs(oldContent);
  const newParagraphs = splitIntoParagraphs(newContent);

  // If no new paragraphs, return empty array
  if (newParagraphs.length <= oldParagraphs.length) {
    return [];
  }

  // Find newly completed paragraphs
  const newlyCompleted: DetectedParagraph[] = [];
  
  // Check if any existing paragraphs have been completed (ended with double newline)
  for (let i = 0; i < Math.min(oldParagraphs.length, newParagraphs.length); i++) {
    const oldPara = oldParagraphs[i];
    const newPara = newParagraphs[i];
    
    // If paragraph was incomplete before but is now complete
    if (!isParagraphComplete(oldPara.content, oldContent, oldPara.endIndex) && 
        isParagraphComplete(newPara.content, newContent, newPara.endIndex)) {
      newlyCompleted.push({
        content: newPara.content.trim(),
        startIndex: newPara.startIndex,
        endIndex: newPara.endIndex,
        paragraphNumber: i + 1
      });
    }
  }

  // Add any completely new paragraphs that are already complete
  for (let i = oldParagraphs.length; i < newParagraphs.length; i++) {
    const newPara = newParagraphs[i];
    if (isParagraphComplete(newPara.content, newContent, newPara.endIndex)) {
      newlyCompleted.push({
        content: newPara.content.trim(),
        startIndex: newPara.startIndex,
        endIndex: newPara.endIndex,
        paragraphNumber: i + 1
      });
    }
  }

  return newlyCompleted;
}

/**
 * Splits text content into paragraphs with position information
 * @param content - Text content to split
 * @returns Array of paragraph objects with content and position info
 */
function splitIntoParagraphs(content: string): Array<{
  content: string;
  startIndex: number;
  endIndex: number;
}> {
  if (!content.trim()) {
    return [];
  }

  const paragraphs: Array<{
    content: string;
    startIndex: number;
    endIndex: number;
  }> = [];

  // Split by double newlines or single newlines followed by significant content
  const parts = content.split(/\n\s*\n/);
  let currentIndex = 0;

  for (const part of parts) {
    const trimmedPart = part.trim();
    if (trimmedPart) {
      const startIndex = content.indexOf(part, currentIndex);
      const endIndex = startIndex + part.length;
      
      paragraphs.push({
        content: trimmedPart,
        startIndex,
        endIndex
      });
      
      currentIndex = endIndex;
    }
  }

  // If no double newlines found, treat as single paragraph if it has substantial content
  if (paragraphs.length === 0 && content.trim().length > 0) {
    paragraphs.push({
      content: content.trim(),
      startIndex: 0,
      endIndex: content.length
    });
  }

  return paragraphs;
}

/**
 * Determines if a paragraph is considered "complete" for feedback purposes
 * @param paragraphContent - The paragraph text
 * @param fullContent - The full document content
 * @param paragraphEndIndex - End index of the paragraph in full content
 * @returns True if paragraph is complete
 */
function isParagraphComplete(paragraphContent: string, fullContent: string, paragraphEndIndex: number): boolean {
  const trimmed = paragraphContent.trim();
  
  // Must have minimum length (at least 20 characters for meaningful feedback)
  if (trimmed.length < 20) {
    return false;
  }

  // Check if paragraph ends with proper punctuation
  const endsWithPunctuation = /[.!?]$/.test(trimmed);
  
  // Check if followed by double newline or end of document
  const followedByDoubleNewline = fullContent.substring(paragraphEndIndex).startsWith('\n\n') || 
                                  paragraphEndIndex >= fullContent.length - 2;

  // Paragraph is complete if it ends with punctuation AND is followed by double newline
  return endsWithPunctuation && followedByDoubleNewline;
}

/**
 * Debounced paragraph detection to avoid excessive calls
 * @param oldContent - Previous content
 * @param newContent - New content
 * @param delay - Delay in milliseconds (default 1000ms)
 * @returns Promise that resolves to detected paragraphs
 */
export function debouncedParagraphDetection(
  oldContent: string, 
  newContent: string, 
  delay: number = 1000
): Promise<DetectedParagraph[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(detectNewParagraphs(oldContent, newContent));
    }, delay);
  });
}

/**
 * Validates if content is suitable for paragraph-based feedback
 * @param content - Text content to validate
 * @returns True if content is suitable for feedback
 */
export function isContentSuitableForFeedback(content: string): boolean {
  const trimmed = content.trim();
  
  // Must have minimum length
  if (trimmed.length < 50) {
    return false;
  }

  // Must contain at least one sentence-ending punctuation
  if (!/[.!?]/.test(trimmed)) {
    return false;
  }

  // Must contain actual words (not just punctuation and spaces)
  const wordCount = trimmed.split(/\s+/).filter(word => /[a-zA-Z]/.test(word)).length;
  return wordCount >= 5;
}

