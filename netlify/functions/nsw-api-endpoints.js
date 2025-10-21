import OpenAI from "openai";

// Initialize OpenAI with server-side API key
const openai = new OpenAI({
  apiKey: process.env.VITE_OPENAI_API_KEY
});

// Helper function to analyze content structure (reused from existing code)
function analyzeContentStructure(content) {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = content.trim().split(/\s+/).filter(w => w.length > 0);
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);

  const potentialCharacters = words.filter((word, index) => {
    const isCapitalized = /^[A-Z][a-z]+$/.test(word);
    const isNotSentenceStart = index > 0 && !/[.!?]/.test(words[index - 1]);
    return isCapitalized && isNotSentenceStart;
  });

  const dialogueMatches = content.match(/"[^"]*"/g) || [];

  const descriptiveWords = words.filter(word =>
    /ly$/.test(word) ||
    /ing$/.test(word) ||
    /ed$/.test(word)
  );

  return {
    sentenceCount: sentences.length,
    wordCount: words.length,
    paragraphCount: paragraphs.length,
    averageSentenceLength: words.length / sentences.length,
    potentialCharacters: [...new Set(potentialCharacters)],
    hasDialogue: dialogueMatches.length > 0,
    dialogueCount: dialogueMatches.length,
    descriptiveWords: [...new Set(descriptiveWords)],
    firstSentence: sentences[0]?.trim() || "",
    lastSentence: sentences[sentences.length - 1]?.trim() || ""
  };
}

// 1. NSW Text Type Analysis Endpoint
async function getNSWTextTypeAnalysis(content, textType) {
  try {
    const analysis = analyzeContentStructure(content);

    const prompt = `You are an expert NSW Selective School writing assessor specializing in text type analysis. Analyze this ${textType} writing sample and provide detailed feedback on how well it adheres to the specific requirements and conventions of this text type.

STUDENT'S WRITING:
"${content}"

TEXT TYPE: ${textType}

CONTENT ANALYSIS:
- Word count: ${analysis.wordCount}
- Sentence count: ${analysis.sentenceCount}
- Paragraph count: ${analysis.paragraphCount}
- Has dialogue: ${analysis.hasDialogue}
- Potential characters: ${analysis.potentialCharacters.join(", ") || "None identified"}

TEXT TYPE SPECIFIC ANALYSIS FOR ${textType.toUpperCase()}:

${getTextTypeRequirements(textType)}

INSTRUCTIONS:
1. Assess how well the writing meets the specific requirements of ${textType}
2. Identify which text type features are present and which are missing
3. Provide specific examples from the student's text
4. Suggest improvements specific to this text type
5. Rate adherence to text type conventions (1-10)

Format your response as a JSON object with this structure:
{
  "textType": "${textType}",
  "adherenceScore": number (1-10),
  "textTypeFeatures": {
    "present": ["features that are well demonstrated"],
    "partial": ["features that are partially demonstrated"],
    "missing": ["features that are missing or weak"]
  },
  "structuralAnalysis": {
    "opening": "analysis of how well the opening meets text type requirements",
    "body": "analysis of body paragraphs/development",
    "conclusion": "analysis of conclusion effectiveness"
  },
  "languageFeatures": {
    "appropriate": ["language features used well for this text type"],
    "needsWork": ["language features that need improvement"]
  },
  "specificSuggestions": ["actionable suggestions specific to improving this text type"],
  "textTypeExamples": ["examples of how to improve specific elements"],
  "nextSteps": ["specific tasks to better meet text type requirements"]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert NSW Selective School writing assessor who specializes in analyzing how well student writing meets specific text type requirements and conventions."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    const feedbackText = response.choices[0].message.content;

    try {
      const feedbackJson = JSON.parse(feedbackText);
      return {
        success: true,
        ...feedbackJson,
        wordCount: analysis.wordCount,
        analysisTimestamp: new Date().toISOString()
      };
    } catch (parseError) {
      console.error("Failed to parse text type analysis as JSON:", parseError);
      return {
        success: false,
        error: "Failed to analyze text type",
        textType: textType,
        adherenceScore: 5,
        message: "Please try again to get detailed text type analysis."
      };
    }

  } catch (error) {
    console.error("Error in NSW text type analysis:", error);
    return {
      success: false,
      error: error.message,
      textType: textType,
      message: "Unable to analyze text type at this time."
    };
  }
}

// Helper function to get text type requirements
function getTextTypeRequirements(textType) {
  const requirements = {
    narrative: `
    NARRATIVE REQUIREMENTS:
    - Clear story structure (orientation, complication, resolution)
    - Well-developed characters with clear motivations
    - Engaging plot with conflict and resolution
    - Descriptive language and imagery
    - Dialogue that advances the story
    - Consistent point of view and tense
    - Engaging opening that hooks the reader
    - Satisfying conclusion that resolves the conflict`,

    persuasive: `
    PERSUASIVE REQUIREMENTS:
    - Clear thesis/position statement
    - Logical argument structure with supporting evidence
    - Use of persuasive techniques (rhetorical questions, repetition, emotive language)
    - Acknowledgment of counterarguments
    - Strong conclusion that reinforces the position
    - Appropriate tone for the intended audience
    - Facts, statistics, or examples to support claims
    - Call to action or clear recommendation`,

    expository: `
    EXPOSITORY REQUIREMENTS:
    - Clear topic introduction and thesis
    - Logical organization of information
    - Use of topic sentences and supporting details
    - Objective, informative tone
    - Clear explanations and definitions
    - Use of examples and evidence
    - Smooth transitions between ideas
    - Conclusion that summarizes key points`,

    recount: `
    RECOUNT REQUIREMENTS:
    - Chronological sequence of events
    - Clear orientation (who, what, when, where)
    - Personal experience or factual events
    - Past tense throughout
    - First or third person perspective
    - Descriptive details that bring events to life
    - Clear sequence markers (first, then, next, finally)
    - Reflection on the significance of events`,

    descriptive: `
    DESCRIPTIVE REQUIREMENTS:
    - Rich sensory details (sight, sound, smell, touch, taste)
    - Vivid imagery and figurative language
    - Clear focus on a person, place, object, or experience
    - Organized spatial or logical structure
    - Varied sentence structures for rhythm
    - Precise vocabulary and word choice
    - Creates a clear mental picture for the reader
    - Engages the reader's senses and emotions`
  };

  return requirements[textType.toLowerCase()] || `
  GENERAL TEXT TYPE REQUIREMENTS:
  - Clear structure appropriate to the text type
  - Consistent tone and style
  - Appropriate language features
  - Engaging content that meets the purpose
  - Clear beginning, middle, and end`;
}

// 2. NSW Vocabulary Sophistication Analysis Endpoint
async function getNSWVocabularySophistication(content) {
  try {
    const analysis = analyzeContentStructure(content);
    const words = content.trim().split(/\s+/).filter(w => w.length > 0);

    // Basic vocabulary analysis
    const uniqueWords = [...new Set(words.map(w => w.toLowerCase()))];
    const longWords = words.filter(w => w.length > 6);
    const academicWords = words.filter(w => isAcademicWord(w.toLowerCase()));

    const prompt = `You are an expert NSW Selective School writing assessor specializing in vocabulary sophistication analysis. Analyze this writing sample for vocabulary complexity, variety, and sophistication appropriate for NSW Selective standards.

STUDENT'S WRITING:
"${content}"

BASIC VOCABULARY METRICS:
- Total words: ${words.length}
- Unique words: ${uniqueWords.length}
- Vocabulary diversity ratio: ${(uniqueWords.length / words.length * 100).toFixed(1)}%
- Words over 6 letters: ${longWords.length}
- Potential academic words: ${academicWords.length}

VOCABULARY SOPHISTICATION ANALYSIS:
1. Assess vocabulary complexity and variety
2. Identify sophisticated word choices
3. Find opportunities for vocabulary enhancement
4. Suggest specific word improvements
5. Rate overall vocabulary sophistication (1-10)

Format your response as a JSON object:
{
  "vocabularyScore": number (1-10),
  "sophisticationLevel": "emerging|developing|proficient|advanced",
  "vocabularyMetrics": {
    "totalWords": ${words.length},
    "uniqueWords": ${uniqueWords.length},
    "diversityRatio": ${(uniqueWords.length / words.length * 100).toFixed(1)},
    "averageWordLength": number,
    "complexWords": number
  },
  "strengths": {
    "sophisticatedWords": ["list of sophisticated words used well"],
    "varietyExamples": ["examples of good vocabulary variety"],
    "appropriateChoices": ["words that are well-chosen for context"]
  },
  "improvements": {
    "basicWords": ["simple words that could be enhanced"],
    "repetitiveWords": ["words that are overused"],
    "missedOpportunities": ["places where more sophisticated words could be used"]
  },
  "suggestions": {
    "wordReplacements": [
      {
        "original": "simple word",
        "suggestions": ["sophisticated alternative 1", "sophisticated alternative 2"],
        "context": "explanation of when to use"
      }
    ],
    "vocabularyTechniques": ["specific techniques to improve vocabulary"],
    "practiceActivities": ["activities to build vocabulary sophistication"]
  },
  "nextSteps": ["specific actions to improve vocabulary sophistication"]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert NSW Selective School writing assessor who specializes in vocabulary sophistication analysis and helping students enhance their word choice and language complexity."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    const feedbackText = response.choices[0].message.content;

    try {
      const feedbackJson = JSON.parse(feedbackText);
      return {
        success: true,
        ...feedbackJson,
        analysisTimestamp: new Date().toISOString()
      };
    } catch (parseError) {
      console.error("Failed to parse vocabulary analysis as JSON:", parseError);
      return {
        success: false,
        error: "Failed to analyze vocabulary sophistication",
        vocabularyScore: 5,
        message: "Please try again to get detailed vocabulary analysis."
      };
    }

  } catch (error) {
    console.error("Error in NSW vocabulary sophistication analysis:", error);
    return {
      success: false,
      error: error.message,
      message: "Unable to analyze vocabulary sophistication at this time."
    };
  }
}

// Helper function to identify academic words (basic implementation)
function isAcademicWord(word) {
  const academicWordsList = ["analyze", "evaluate", "synthesize", "articulate", "demonstrate", "comprehend", "critique", "elucidate", "explicate", "postulate", "corroborate", "delineate", "epistemology", "paradigm", "heuristic", "ubiquitous", "nefarious", "benevolent", "cacophony", "euphoria", "plethora", "myriad", "ephemeral", "transient", "eloquence", "perspicacious", "sagacious", "veracity", "fallacy", "ambiguous", "unequivocal", "ostentatious", "gregarious", "capricious", "fastidious", "vociferous", "alacrity", "proclivity", "esoteric", "obfuscate", "mitigate", "ameliorate", "perfunctory", "superfluous", "deleterious", "salient", "efficacious", "propensity"];
  return academicWordsList.includes(word);
}

// 3. NSW Coaching Tips Endpoint
async function getNSWCoachingTips(content) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  try {
    const analysis = analyzeContentStructure(content);

    const prompt = `You are an expert NSW Selective School writing coach. Provide actionable coaching tips for the following writing sample to help a student aged 8-11 prepare for their selective school exam. Focus on improving clarity, structure, vocabulary, and adherence to common text types (narrative, persuasive, expository, recount, descriptive).

STUDENT'S WRITING:
"${content}"

CONTENT ANALYSIS:
- Word count: ${analysis.wordCount}
- Sentence count: ${analysis.sentenceCount}
- Paragraph count: ${analysis.paragraphCount}
- Has dialogue: ${analysis.hasDialogue}
- Potential characters: ${analysis.potentialCharacters.join(", ") || "None identified"}

INSTRUCTIONS:
1. Identify 3-5 key areas for improvement.
2. For each area, provide a clear, concise tip.
3. Include a specific example from the student's text (if applicable) and a suggested improvement.
4. Use encouraging and age-appropriate language.
5. Format your response as a JSON object:
{
  "coachingTips": [
    {
      "area": "Clarity and Conciseness",
      "tip": "Make sure each sentence has one clear idea. Try to remove extra words.",
      "example": "Original: 'In the early morning, the sun was shining brightly and it was a very beautiful day.'",
      "improvement": "Suggested: 'The early morning sun shone brightly, making it a beautiful day.'"
    },
    {
      "area": "Vocabulary Variety",
      "tip": "Use different words to make your writing more interesting. Think of synonyms!",
      "example": "Original: 'The boy was very sad. He felt sad all day.'",
      "improvement": "Suggested: 'The boy felt miserable all day.'"
    }
  ],
  "nextSteps": ["Practice writing short descriptions using new vocabulary.", "Read more books to see how authors use words."]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert NSW Selective School writing coach, providing actionable and encouraging feedback to students aged 8-11."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });

    const coachingTips = JSON.parse(response.choices[0].message.content);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(coachingTips),
    };

  } catch (error) {
    console.error("Error in NSW coaching tips:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to generate coaching tips", details: error.message }),
    };
  }
}

// 4. NSW Progress Tracking Endpoint
async function getNSWProgressTracking(studentId) {
  // This is a placeholder. In a real application, you would fetch this from a database.
  // For now, we'll simulate some progress data.
  const simulatedProgress = {
    studentId: studentId,
    overallScore: 75,
    lastAssessmentDate: "2025-10-20",
    areasOfImprovement: ["Vocabulary Sophistication", "Narrative Structure"],
    recentScores: [
      { date: "2025-09-01", score: 68, type: "Narrative" },
      { date: "2025-09-15", score: 72, type: "Persuasive" },
      { date: "2025-10-01", score: 70, type: "Expository" },
      { date: "2025-10-15", score: 80, type: "Narrative" },
    ],
    milestones: [
      { date: "2025-09-20", description: "Improved sentence variety" },
      { date: "2025-10-10", description: "Started using more descriptive adjectives" },
    ],
    nextLearningGoals: ["Focus on strong conclusions", "Incorporate more figurative language"],
  };

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(simulatedProgress),
  };
}

// 5. NSW Text Type Analysis Endpoint
async function getNSWTextTypeAnalysisEndpoint(event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Allow': 'POST' },
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  try {
    const { content, textType } = JSON.parse(event.body);
    if (!content || !textType) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Missing content or textType in request body' }),
      };
    }

    const result = await getNSWTextTypeAnalysis(content, textType);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error("Error in getNSWTextTypeAnalysisEndpoint:", error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Internal Server Error', error: error.message }),
    };
  }
}

// 6. NSW Vocabulary Sophistication Endpoint
async function getNSWVocabularySophisticationEndpoint(event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Allow': 'POST' },
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  try {
    const { content } = JSON.parse(event.body);
    if (!content) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Missing content in request body' }),
      };
    }

    const result = await getNSWVocabularySophistication(content);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error("Error in getNSWVocabularySophisticationEndpoint:", error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Internal Server Error', error: error.message }),
    };
  }
}

// 7. NSW Coaching Tips Endpoint
async function getNSWCoachingTipsEndpoint(event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Allow': 'POST' },
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  try {
    const { content } = JSON.parse(event.body);
    if (!content) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Missing content in request body' }),
      };
    }

    const result = await getNSWCoachingTips(content);
    return result;
  } catch (error) {
    console.error("Error in getNSWCoachingTipsEndpoint:", error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Internal Server Error', error: error.message }),
    };
  }
}

// 8. NSW Progress Tracking Endpoint
async function getNSWProgressTrackingEndpoint(event) {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 'Allow': 'GET' },
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  try {
    const { studentId } = event.queryStringParameters;
    if (!studentId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Missing studentId in query parameters' }),
      };
    }

    const result = await getNSWProgressTracking(studentId);
    return result;
  } catch (error) {
    console.error("Error in getNSWProgressTrackingEndpoint:", error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Internal Server Error', error: error.message }),
    };
  }
}

// Main handler for all NSW API endpoints
exports.handler = async (event, context) => {
  const path = event.path;

  if (path.includes('/.netlify/functions/nsw-api-endpoints/text-type-analysis')) {
    return getNSWTextTypeAnalysisEndpoint(event);
  } else if (path.includes('/.netlify/functions/nsw-api-endpoints/vocabulary-sophistication')) {
    return getNSWVocabularySophisticationEndpoint(event);
  } else if (path.includes('/.netlify/functions/nsw-api-endpoints/coaching-tips')) {
    return getNSWCoachingTipsEndpoint(event);
  } else if (path.includes('/.netlify/functions/nsw-api-endpoints/progress-tracking')) {
    return getNSWProgressTrackingEndpoint(event);
  } else {
    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Endpoint not found' }),
    };
  }
};
