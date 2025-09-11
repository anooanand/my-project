export interface LiteraryDevice {
  type: string;
  example: string;
  explanation: string;
}

export class LiteraryDevicesDetector {
  detect(text: string): LiteraryDevice[] {
    const detectedDevices: LiteraryDevice[] = [];

    // Alliteration
    const alliterationPattern = /\b([b-df-hj-np-tv-z])\w*\s+\1\w*\b/gi;
    let match;
    while ((match = alliterationPattern.exec(text)) !== null) {
      detectedDevices.push({
        type: "Alliteration",
        example: match[0],
        explanation: "Repetition of the same sound or letter at the beginning of adjacent or closely connected words."
      });
    }

    // Metaphor (simple detection for now)
    const metaphorPattern = /\b(is|are|was|were)\s+(a|an|the)\s+([a-zA-Z]+)\b/gi;
    while ((match = metaphorPattern.exec(text)) !== null) {
      // This is a very basic metaphor detection and might have false positives
      // More advanced NLP would be needed for accurate detection
      detectedDevices.push({
        type: "Metaphor",
        example: match[0],
        explanation: "A figure of speech in which a word or phrase is applied to an object or action to which it is not literally applicable."
      });
    }

    // Simile (simple detection for now)
    const similePattern = /\b(like|as)\s+a\s+([a-zA-Z]+)\b/gi;
    while ((match = similePattern.exec(text)) !== null) {
      detectedDevices.push({
        type: "Simile",
        example: match[0],
        explanation: "A figure of speech involving the comparison of one thing with another thing of a different kind, used to make a description more emphatic or vivid (e.g., as brave as a lion, crazy like a fox)."
      });
    }

    // Personification (simple detection for now)
    const personificationPattern = /\b(the\s+[a-zA-Z]+\s+(sings|dances|whispers|cries|laughs|smiles|weeps|roars|sleeps|walks|runs|talks|thinks))\b/gi;
    while ((match = personificationPattern.exec(text)) !== null) {
      detectedDevices.push({
        type: "Personification",
        example: match[0],
        explanation: "The attribution of a personal nature or human characteristics to something non-human, or the representation of an abstract quality in human form."
      });
    }

    // Hyperbole (simple detection for now)
    const hyperbolePattern = /\b(never|always|forever|everyone|no one|all|none)\s+([a-zA-Z]+)\b/gi;
    while ((match = hyperbolePattern.exec(text)) !== null) {
      detectedDevices.push({
        type: "Hyperbole",
        example: match[0],
        explanation: "Exaggerated statements or claims not meant to be taken literally."
      });
    }

    return detectedDevices;
  }
}