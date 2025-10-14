/**
 * Dynamic Example Generator
 *
 * Generates contextually relevant writing examples based on the user's
 * active prompt and selected writing type.
 */

export interface DynamicExample {
  text: string;
  description?: string;
}

/**
 * Extracts key elements from a writing prompt
 */
function extractPromptElements(prompt: string): {
  subject: string;
  keywords: string[];
  setting?: string;
  character?: string;
  action?: string;
} {
  const lowerPrompt = prompt.toLowerCase();

  // Common narrative keywords
  const narrativeKeywords = ['story', 'key', 'chest', 'attic', 'grandmother', 'mysterious', 'secret', 'door', 'adventure', 'discovery'];
  const persuasiveKeywords = ['should', 'must', 'argue', 'convince', 'believe', 'important', 'better'];
  const expositoryKeywords = ['explain', 'describe', 'how', 'what', 'why', 'inform', 'teach'];
  const reflectiveKeywords = ['think', 'feel', 'remember', 'learned', 'experience', 'changed'];

  // Extract keywords found in prompt
  const foundKeywords: string[] = [];
  [...narrativeKeywords, ...persuasiveKeywords, ...expositoryKeywords, ...reflectiveKeywords].forEach(keyword => {
    if (lowerPrompt.includes(keyword)) {
      foundKeywords.push(keyword);
    }
  });

  return {
    subject: prompt.slice(0, 100),
    keywords: foundKeywords,
    setting: lowerPrompt.includes('attic') ? 'attic' :
             lowerPrompt.includes('school') ? 'school' :
             lowerPrompt.includes('library') ? 'library' : undefined,
    character: lowerPrompt.includes('grandmother') ? 'grandmother' : undefined,
    action: lowerPrompt.includes('found') || lowerPrompt.includes('discover') ? 'discovery' : undefined
  };
}

/**
 * Generate narrative examples
 */
function generateNarrativeExamples(prompt: string, wordCount: number): DynamicExample[] {
  const elements = extractPromptElements(prompt);
  const examples: DynamicExample[] = [];

  if (wordCount === 0) {
    // Opening sentence examples
    if (elements.keywords.includes('key') || elements.keywords.includes('attic')) {
      examples.push({
        text: "Dust motes danced in the single shaft of light that pierced the attic's gloom, illuminating something metallic beneath the old trunk.",
        description: "Set the atmosphere with sensory details"
      });
      examples.push({
        text: "The key felt surprisingly warm in my hand, as if it held secrets waiting to be discovered.",
        description: "Begin with character interaction"
      });
    } else if (elements.keywords.includes('door') || elements.keywords.includes('library')) {
      examples.push({
        text: "The library had always been my favorite place, but I'd never noticed the strange symbol carved into the oak door.",
        description: "Establish setting and introduce mystery"
      });
    } else {
      // Generic narrative opening
      examples.push({
        text: "Everything changed the moment I stepped through that doorway.",
        description: "Create intrigue with a compelling hook"
      });
    }
  } else if (wordCount < 100) {
    // Development examples
    examples.push({
      text: "Show emotions through action: 'My hands trembled as I reached for the lock, heart pounding against my ribs.'",
      description: "Add physical reactions to build tension"
    });
    examples.push({
      text: "Use vivid descriptions: 'The chest's surface was covered in intricate carvings that seemed to shimmer in the dim light.'",
      description: "Enhance imagery with specific details"
    });
  } else {
    // Conclusion examples
    examples.push({
      text: "As I closed the chest, I realized this discovery had changed everything I thought I knew about my family's past.",
      description: "Reflect on the significance of events"
    });
  }

  return examples;
}

/**
 * Generate persuasive examples
 */
function generatePersuasiveExamples(prompt: string, wordCount: number): DynamicExample[] {
  const elements = extractPromptElements(prompt);
  const examples: DynamicExample[] = [];

  if (wordCount === 0) {
    examples.push({
      text: "Imagine a world where every student has the opportunity to reach their full potential—this is why we must act now.",
      description: "Open with a powerful statement"
    });
  } else if (wordCount < 100) {
    examples.push({
      text: "Studies show that students who engage with creative activities demonstrate 30% higher problem-solving abilities.",
      description: "Support your argument with evidence"
    });
  } else {
    examples.push({
      text: "The choice is clear: we can either embrace this change and thrive, or resist and fall behind.",
      description: "Close with a compelling call to action"
    });
  }

  return examples;
}

/**
 * Generate expository examples
 */
function generateExpositoryExamples(prompt: string, wordCount: number): DynamicExample[] {
  const examples: DynamicExample[] = [];

  if (wordCount === 0) {
    examples.push({
      text: "Understanding this process requires examining three key components: the cause, the mechanism, and the effect.",
      description: "Introduce your topic with clear structure"
    });
  } else if (wordCount < 100) {
    examples.push({
      text: "For example, when water freezes, its molecules slow down and arrange themselves into a crystalline structure.",
      description: "Use concrete examples to explain concepts"
    });
  } else {
    examples.push({
      text: "In conclusion, these interconnected factors work together to create the phenomenon we observe.",
      description: "Summarize key points clearly"
    });
  }

  return examples;
}

/**
 * Generate reflective examples
 */
function generateReflectiveExamples(prompt: string, wordCount: number): DynamicExample[] {
  const examples: DynamicExample[] = [];

  if (wordCount === 0) {
    examples.push({
      text: "Looking back on that day, I realize how much that single moment shaped who I am today.",
      description: "Begin with personal reflection"
    });
  } else if (wordCount < 100) {
    examples.push({
      text: "I felt a mixture of excitement and fear—emotions that would become familiar companions on my journey.",
      description: "Explore your feelings and reactions"
    });
  } else {
    examples.push({
      text: "This experience taught me that growth often comes from the most unexpected challenges.",
      description: "Share the lesson learned"
    });
  }

  return examples;
}

/**
 * Generate recount examples
 */
function generateRecountExamples(prompt: string, wordCount: number): DynamicExample[] {
  const examples: DynamicExample[] = [];

  if (wordCount === 0) {
    examples.push({
      text: "Last Tuesday morning, our class embarked on an adventure that none of us would forget.",
      description: "Orient the reader with when and where"
    });
  } else if (wordCount < 100) {
    examples.push({
      text: "After that, we moved to the next exhibit, where an ancient artifact caught everyone's attention.",
      description: "Use time connectives to sequence events"
    });
  } else {
    examples.push({
      text: "By the end of the day, we had learned more than we ever expected and created memories to last a lifetime.",
      description: "Conclude by reflecting on the experience"
    });
  }

  return examples;
}

/**
 * Main function to generate dynamic examples
 */
export function generateDynamicExamples(
  prompt: string,
  writingType: string,
  currentWordCount: number
): DynamicExample[] {
  const normalizedType = writingType.toLowerCase();

  if (normalizedType.includes('narrative')) {
    return generateNarrativeExamples(prompt, currentWordCount);
  } else if (normalizedType.includes('persuasive')) {
    return generatePersuasiveExamples(prompt, currentWordCount);
  } else if (normalizedType.includes('expository') || normalizedType.includes('exposition')) {
    return generateExpositoryExamples(prompt, currentWordCount);
  } else if (normalizedType.includes('reflective')) {
    return generateReflectiveExamples(prompt, currentWordCount);
  } else if (normalizedType.includes('recount')) {
    return generateRecountExamples(prompt, currentWordCount);
  } else {
    // Default to narrative
    return generateNarrativeExamples(prompt, currentWordCount);
  }
}

/**
 * Format examples for display
 */
export function formatExamplesForDisplay(examples: DynamicExample[]): string {
  if (examples.length === 0) {
    return "Start writing to receive personalized examples!";
  }

  if (examples.length === 1) {
    return examples[0].text;
  }

  return examples.map((ex, idx) => {
    if (ex.description) {
      return `${idx + 1}. "${ex.text}"\n   💡 ${ex.description}`;
    }
    return `${idx + 1}. "${ex.text}"`;
  }).join('\n\n');
}
