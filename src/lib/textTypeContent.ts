export const WRITING_MATE_SIDEBAR_CONTENT = {
  // ----------------------------------------------------------------------
  // Core Writing Types (8 identified from Prompts file)
  // ----------------------------------------------------------------------
  narrative: {
    suggestion: "Focus on developing your main character and building suspense.",
    example: "Start with an action scene or a compelling piece of dialogue.",
    nextStep: "Introduce the conflict that drives the story.",
  },
  persuasive: {
    suggestion: "Clearly state your position (thesis) in the introduction.",
    example: "Use a rhetorical question or a shocking statistic to hook the reader.",
    nextStep: "Present your strongest argument first.",
  },
  expository: {
    suggestion: "Organize your explanation into distinct, logically flowing sections.",
    example: "Begin by defining the topic or providing essential background information.",
    nextStep: "Elaborate on your first main point with supporting details.",
  },
  descriptive: {
    suggestion: "Use sensory details (sight, sound, smell, taste, touch) to bring your subject to life.",
    example: "Instead of 'The room was old,' try 'Dust motes danced in the single shaft of light, and the air smelled of forgotten leather.'",
    nextStep: "Review your writing for places to replace general adjectives with specific, evocative language.",
  },
  reflective: {
    suggestion: "Start by describing the event objectively. Focus on the facts before your feelings.",
    example: "Use the 'Description' phase of the Reflective Cycle to set the scene (What happened?).",
    nextStep: "Analyze the situation to understand the cause and effect of your actions (Why did it happen?).",
  },
  recount: {
    suggestion: "Maintain a strict chronological order. Think of it as a journalist's report.",
    example: "Start with a clear Orientation: Who, What, Where, and When.",
    nextStep: "Use strong time-order words (e.g., then, next, finally) to link events clearly.",
  },
  technical: {
    suggestion: "Keep your language clear, concise, and objective. Avoid flowery language.",
    example: "Use numbered or bulleted lists for steps or instructions.",
    nextStep: "Check to ensure every step is necessary and easy to follow for the intended audience.",
  },
  creative: {
    suggestion: "Don't be afraid to break traditional rules. Experiment with structure, voice, and style.",
    example: "Try writing from the perspective of an inanimate object or an animal.",
    nextStep: "Focus on creating a strong, unique voice that captures the reader's imagination.",
  },
  
  // ----------------------------------------------------------------------
  // Additional Writing Types (7 to reach 15 based on common types)
  // These are placeholders for types not explicitly listed in textTypePrompts.ts
  // ----------------------------------------------------------------------
  analytical: {
    suggestion: "Your main goal is to break down a subject and evaluate its parts.",
    example: "Start with a thesis that clearly states your evaluation of the subject.",
    nextStep: "Use evidence from the text/source to support each point of your analysis.",
  },
  critical: {
    suggestion: "Focus on evaluating the strengths and weaknesses of a work or idea.",
    example: "Begin with a summary of the work, followed by your critical judgment.",
    nextStep: "Ensure your criticism is supported by specific, well-cited evidence.",
  },
  comparecontrast: {
    suggestion: "Choose a structure (point-by-point or subject-by-subject) and stick to it.",
    example: "Use transition words like 'similarly,' 'in contrast,' and 'however' to link ideas.",
    nextStep: "Check that you have given equal weight and depth to both subjects being compared.",
  },
  summary: {
    suggestion: "Keep it brief and objective. Do not include your personal opinion or analysis.",
    example: "Start by stating the title, author, and main purpose of the original text.",
    nextStep: "Condense the main ideas of the source text into your own words, maintaining accuracy.",
  },
  review: {
    suggestion: "Combine objective description (what it is) with subjective evaluation (is it good?).",
    example: "Use vivid adjectives and specific examples to describe the product/work.",
    nextStep: "Conclude with a clear recommendation (or lack thereof) for the reader.",
  },
  argumentative: {
    suggestion: "This is a stronger form of persuasive writing. Research is key.",
    example: "Use a formal tone and rely heavily on empirical evidence and logical reasoning.",
    nextStep: "Address and systematically dismantle the strongest counter-arguments to your claim.",
  },
  journalistic: {
    suggestion: "Follow the inverted pyramid structure: most important information first.",
    example: "Ensure your lead paragraph answers the 5 W's: Who, What, Where, When, Why.",
    nextStep: "Use short, clear sentences and objective language throughout the report.",
  },
  
  // ----------------------------------------------------------------------
  // Default Fallback
  // ----------------------------------------------------------------------
  default: {
    suggestion: "Start by outlining your main ideas. A good plan is the key to great writing!",
    example: "Try writing a strong opening sentence to capture the reader's attention.",
    nextStep: "Write your first paragraph and I'll provide feedback.",
  }
};
