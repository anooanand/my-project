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

    const prompt = `You are an expert NSW Selective School writing assessor specializing in text type analysis. Analyze this ${textType} writing sample and provide detailed feedback on how well it adheres to the specific requirements and conventions of this text type.\n\nSTUDENT\'S WRITING:\n"${content}"\n\nTEXT TYPE: ${textType}\n\nCONTENT ANALYSIS:\n- Word count: ${analysis.wordCount}\n- Sentence count: ${analysis.sentenceCount}\n- Paragraph count: ${analysis.paragraphCount}\n- Has dialogue: ${analysis.hasDialogue}\n- Potential characters: ${analysis.potentialCharacters.join(\", \") || \'None identified\'}\n\nTEXT TYPE SPECIFIC ANALYSIS FOR ${textType.toUpperCase()}:\n\n${getTextTypeRequirements(textType)}\n\nINSTRUCTIONS:\n1. Assess how well the writing meets the specific requirements of ${textType}\n2. Identify which text type features are present and which are missing\n3. Provide specific examples from the student\'s text\n4. Suggest improvements specific to this text type\n5. Rate adherence to text type conventions (1-10)\n\nFormat your response as a JSON object with this structure:\n{\n  \"textType\": \"${textType}\",\n  \"adherenceScore\": number (1-10),\n  \"textTypeFeatures\": {\n    \"present\": [\"features that are well demonstrated\"],\n    \"partial\": [\"features that are partially demonstrated\"],\n    \"missing\": [\"features that are missing or weak\"]\n  },\n  \"structuralAnalysis\": {\n    \"opening\": \"analysis of how well the opening meets text type requirements\",\n    \"body\": \"analysis of body paragraphs/development\",\n    \"conclusion\": \"analysis of conclusion effectiveness\"\n  },\n  \"languageFeatures\": {\n    \"appropriate\": [\"language features used well for this text type\"],\n    \"needsWork\": [\"language features that need improvement\"]\n  },\n  \"specificSuggestions\": [\"actionable suggestions specific to improving this text type\"],\n  \"textTypeExamples\": [\"examples of how to improve specific elements\"],\n  \"nextSteps\": [\"specific tasks to better meet text type requirements\"]\n}\
`;

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
    narrative: `\n    NARRATIVE REQUIREMENTS:\n    - Clear story structure (orientation, complication, resolution)\n    - Well-developed characters with clear motivations\n    - Engaging plot with conflict and resolution\n    - Descriptive language and imagery\n    - Dialogue that advances the story\n    - Consistent point of view and tense\n    - Engaging opening that hooks the reader\n    - Satisfying conclusion that resolves the conflict`,
    
    persuasive: `\n    PERSUASIVE REQUIREMENTS:\n    - Clear thesis/position statement\n    - Logical argument structure with supporting evidence\n    - Use of persuasive techniques (rhetorical questions, repetition, emotive language)\n    - Acknowledgment of counterarguments\n    - Strong conclusion that reinforces the position\n    - Appropriate tone for the intended audience\n    - Facts, statistics, or examples to support claims\n    - Call to action or clear recommendation`,
    
    expository: `\n    EXPOSITORY REQUIREMENTS:\n    - Clear topic introduction and thesis\n    - Logical organization of information\n    - Use of topic sentences and supporting details\n    - Objective, informative tone\n    - Clear explanations and definitions\n    - Use of examples and evidence\n    - Smooth transitions between ideas\n    - Conclusion that summarizes key points`,
    
    recount: `\n    RECOUNT REQUIREMENTS:\n    - Chronological sequence of events\n    - Clear orientation (who, what, when, where)\n    - Personal experience or factual events\n    - Past tense throughout\n    - First or third person perspective\n    - Descriptive details that bring events to life\n    - Clear sequence markers (first, then, next, finally)\n    - Reflection on the significance of events`,
    
    descriptive: `\n    DESCRIPTIVE REQUIREMENTS:\n    - Rich sensory details (sight, sound, smell, touch, taste)\n    - Vivid imagery and figurative language\n    - Clear focus on a person, place, object, or experience\n    - Organized spatial or logical structure\n    - Varied sentence structures for rhythm\n    - Precise vocabulary and word choice\n    - Creates a clear mental picture for the reader\n    - Engages the reader\'s senses and emotions`
  };
  
  return requirements[textType.toLowerCase()] || `\n  GENERAL TEXT TYPE REQUIREMENTS:\n  - Clear structure appropriate to the text type\n  - Consistent tone and style\n  - Appropriate language features\n  - Engaging content that meets the purpose\n  - Clear beginning, middle, and end`;
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

    const prompt = `You are an expert NSW Selective School writing assessor specializing in vocabulary sophistication analysis. Analyze this writing sample for vocabulary complexity, variety, and sophistication appropriate for NSW Selective standards.\n\nSTUDENT\'S WRITING:\n"${content}"\n\nBASIC VOCABULARY METRICS:\n- Total words: ${words.length}\n- Unique words: ${uniqueWords.length}\n- Vocabulary diversity ratio: ${(uniqueWords.length / words.length * 100).toFixed(1)}%\n- Words over 6 letters: ${longWords.length}\n- Potential academic words: ${academicWords.length}\n\nVOCABULARY SOPHISTICATION ANALYSIS:\n1. Assess vocabulary complexity and variety\n2. Identify sophisticated word choices\n3. Find opportunities for vocabulary enhancement\n4. Suggest specific word improvements\n5. Rate overall vocabulary sophistication (1-10)\n\nFormat your response as a JSON object:\n{\n  \"vocabularyScore\": number (1-10),\n  \"sophisticationLevel\": \"emerging|developing|proficient|advanced\",\n  \"vocabularyMetrics\": {\n    \"totalWords\": ${words.length},\n    \"uniqueWords\": ${uniqueWords.length},\n    \"diversityRatio\": ${(uniqueWords.length / words.length * 100).toFixed(1)},\n    \"averageWordLength\": number,\n    \"complexWords\": number\n  },\n  \"strengths\": {\n    \"sophisticatedWords\": [\"list of sophisticated words used well\"],\n    \"varietyExamples\": [\"examples of good vocabulary variety\"],\n    \"appropriateChoices\": [\"words that are well-chosen for context\"]\n  },\n  \"improvements\": {\n    \"basicWords\": [\"simple words that could be enhanced\"],\n    \"repetitiveWords\": [\"words that are overused\"],\n    \"missedOpportunities\": [\"places where more sophisticated words could be used\"]\n  },\n  \"suggestions\": {\n    \"wordReplacements\": [\n      {\n        \"original\": \"simple word\",\n        \"suggestions\": [\"sophisticated alternative 1\", \"sophisticated alternative 2\"],\n        \"context\": \"explanation of when to use\"\n      }\n    ],\n    \"vocabularyTechniques\": [\"specific techniques to improve vocabulary\"],\n    \"practiceActivities\": [\"activities to build vocabulary sophistication\"]\n  },\n  \"nextSteps\": [\"specific actions to improve vocabulary sophistication\"]\n}\
`;

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
  const academicWords = [
    'analyze', 'concept', 'constitute', 'context', 'create', 'data', 'define', 'derive',
    'distribute', 'economy', 'environment', 'establish', 'estimate', 'evident', 'export',
    'factor', 'finance', 'formula', 'function', 'identify', 'income', 'indicate',
    'individual', 'interpret', 'involve', 'issue', 'labor', 'legal', 'legislate',
    'major', 'method', 'occur', 'percent', 'period', 'policy', 'principle', 'proceed',
    'process', 'require', 'research', 'respond', 'role', 'section', 'significant',
    'similar', 'source', 'specific', 'structure', 'theory', 'vary', 'furthermore',
    'consequently', 'nevertheless', 'therefore', 'moreover', 'however', 'although',
    'demonstrate', 'illustrate', 'emphasize', 'examine', 'investigate', 'conclude'
  ];
  return academicWords.includes(word);
}

// 3. Progress Tracking Endpoint
async function getNSWProgressTracking(userId, assessmentData) {
  try {
    // This would typically interact with a database to store and retrieve progress data
    // For now, we'll simulate progress tracking with the provided assessment data
    
    const currentAssessment = assessmentData;
    const timestamp = new Date().toISOString();

    // Calculate progress metrics
    const progressMetrics = calculateProgressMetrics(currentAssessment);

    const response = {
      success: true,
      userId: userId,
      timestamp: timestamp,
      currentAssessment: {
        totalScore: currentAssessment.totalScore || 0,
        overallBand: currentAssessment.overallBand || 1,
        criteriaScores: {
          ideas: currentAssessment.criteriaFeedback?.ideasAndContent?.score || 0,
          structure: currentAssessment.criteriaFeedback?.textStructureAndOrganization?.score || 0,
          language: currentAssessment.criteriaFeedback?.languageFeaturesAndVocabulary?.score || 0,
          grammar: currentAssessment.criteriaFeedback?.spellingPunctuationGrammar?.score || 0
        }
      },
      progressMetrics: progressMetrics,
      readinessIndicator: {
        level: getReadinessLevel(currentAssessment.totalScore || 0),
        percentage: Math.min(100, ((currentAssessment.totalScore || 0) / 30) * 100),
        nextMilestone: getNextMilestone(currentAssessment.totalScore || 0),
        strengthAreas: identifyStrengths(currentAssessment),
        improvementAreas: identifyImprovements(currentAssessment)
      },
      recommendations: {
        focusAreas: getFocusAreas(currentAssessment),
        practiceActivities: getPracticeActivities(currentAssessment),
        studyPlan: getStudyPlan(currentAssessment),
        timeToExam: "Estimated preparation time based on current level"
      },
      historicalTrends: {
        // This would be populated from database in a real implementation
        message: "Historical data will be available after multiple assessments"
      }
    };

    return response;

  } catch (error) {
    console.error("Error in NSW progress tracking:", error);
    return {
      success: false,
      error: error.message,
      message: "Unable to track progress at this time."
    };
  }
}

// Helper functions for progress tracking
function calculateProgressMetrics(assessment) {
  const totalScore = assessment.totalScore || 0;
  const maxScore = 30;
  
  return {
    overallProgress: (totalScore / maxScore) * 100,
    bandLevel: assessment.overallBand || 1,
    criteriaProgress: {
      ideas: ((assessment.criteriaFeedback?.ideasAndContent?.score || 0) / 9) * 100,
      structure: ((assessment.criteriaFeedback?.textStructureAndOrganization?.score || 0) / 7.5) * 100,
      language: ((assessment.criteriaFeedback?.languageFeaturesAndVocabulary?.score || 0) / 7.5) * 100,
      grammar: ((assessment.criteriaFeedback?.spellingPunctuationGrammar?.score || 0) / 6) * 100
    }
  };
}

function getReadinessLevel(totalScore) {
  if (totalScore >= 25) return "Exam Ready";
  if (totalScore >= 20) return "Nearly Ready";
  if (totalScore >= 15) return "Developing Well";
  if (totalScore >= 10) return "Building Skills";
  return "Early Development";
}

function getNextMilestone(totalScore) {
  if (totalScore < 10) return "Reach 10 points - Building Skills";
  if (totalScore < 15) return "Reach 15 points - Developing Well";
  if (totalScore < 20) return "Reach 20 points - Nearly Ready";
  if (totalScore < 25) return "Reach 25 points - Exam Ready";
  return "Maintain Excellence";
}

function identifyStrengths(assessment) {
  const strengths = [];
  const criteria = assessment.criteriaFeedback || {};
  
  Object.entries(criteria).forEach(([key, value]) => {
    if (value.score && value.maxScore && (value.score / value.maxScore) > 0.7) {
      strengths.push(key.replace(/([A-Z])/g, ' $1').toLowerCase());
    }
  });
  
  return strengths.length > 0 ? strengths : ["Keep working on all areas"];
}

function identifyImprovements(assessment) {
  const improvements = [];
  const criteria = assessment.criteriaFeedback || {};

  Object.entries(criteria).forEach(([key, value]) => {
    if (value.score && value.maxScore && (value.score / value.maxScore) < 0.5) {
      improvements.push(key.replace(/([A-Z])/g, ' $1').toLowerCase());
    }
  });

  return improvements.length > 0 ? improvements : ["Continue to refine all areas"];
}

function getFocusAreas(assessment) {
  const focusAreas = [];
  const criteria = assessment.criteriaFeedback || {};

  // Prioritize areas with lower scores
  const sortedCriteria = Object.entries(criteria).sort(([, a], [, b]) => (a.score || 0) - (b.score || 0));

  sortedCriteria.forEach(([key, value]) => {
    if (value.score && value.maxScore && (value.score / value.maxScore) < 0.7) {
      focusAreas.push(key.replace(/([A-Z])/g, ' $1').toLowerCase());
    }
  });

  return focusAreas.length > 0 ? focusAreas : ["Maintain strong performance across all areas"];
}

function getPracticeActivities(assessment) {
  const activities = [
    "Practice writing different text types (narrative, persuasive, expository, recount, descriptive)",
    "Focus on expanding vocabulary and using sophisticated language",
    "Work on structuring arguments and ideas logically",
    "Refine grammar, spelling, and punctuation",
    "Read widely to understand different writing styles"
  ];

  // Tailor activities based on areas needing improvement
  const improvementAreas = identifyImprovements(assessment);
  if (improvementAreas.includes("ideas and content")) {
    activities.unshift("Brainstorming and planning exercises");
  }
  if (improvementAreas.includes("text structure and organization")) {
    activities.unshift("Outlining and paragraph structuring drills");
  }
  if (improvementAreas.includes("language features and vocabulary")) {
    activities.unshift("Vocabulary building and figurative language practice");
  }
  if (improvementAreas.includes("spelling punctuation grammar")) {
    activities.unshift("Grammar and punctuation exercises");
  }

  return activities;
}

function getStudyPlan(assessment) {
  const plan = [
    "Review feedback from previous assessments",
    "Set specific, measurable goals for each writing criteria",
    "Dedicate regular time to writing practice",
    "Seek feedback from teachers or mentors",
    "Analyze sample high-scoring responses"
  ];

  // Add more specific plan items based on readiness level
  const readinessLevel = getReadinessLevel(assessment.totalScore || 0);
  if (readinessLevel === "Early Development") {
    plan.unshift("Focus on understanding basic text type conventions");
  } else if (readinessLevel === "Building Skills") {
    plan.unshift("Practice applying specific writing techniques");
  } else if (readinessLevel === "Developing Well") {
    plan.unshift("Work on integrating advanced language features");
  } else if (readinessLevel === "Nearly Ready") {
    plan.unshift("Simulate exam conditions for practice");
  }

  return plan;
}

// 4. NSW Essay Scoring Endpoint
async function getNSWEssayScore(content, textType) {
  try {
    const analysis = analyzeContentStructure(content);

    const prompt = `You are an expert NSW Selective School writing assessor. Your task is to score the provided student writing sample based on the NSW Selective School marking criteria for ${textType} writing. Provide a score out of 30 and detailed feedback across the four key criteria:

1. Ideas and Content (9 marks)
2. Text Structure and Organization (7.5 marks)
3. Language Features and Vocabulary (7.5 marks)
4. Spelling, Punctuation, and Grammar (6 marks)

STUDENT\'S WRITING:\n"${content}"\n\nTEXT TYPE: ${textType}\n\nINSTRUCTIONS:\n1. Provide a score for each of the four criteria.
2. Provide specific, actionable feedback for each criterion, referencing the student\'s text where possible.
3. Suggest clear next steps for improvement for each criterion.
4. Calculate an overall score out of 30.
5. Assign an overall band level (1-6) based on the total score (e.g., 25-30 = Band 6, 20-24 = Band 5, 15-19 = Band 4, 10-14 = Band 3, 5-9 = Band 2, 0-4 = Band 1).

Format your response as a JSON object with this structure:\n{\n  \"overallScore\": number (out of 30),\n  \"overallBand\": number (1-6),\n  \"criteriaFeedback\": {\n    \"ideasAndContent\": {\n      \"score\": number (out of 9),\n      \"feedback\": \"detailed feedback\",\n      \"nextSteps\": [\"actionable next steps\"]\n    },\n    \"textStructureAndOrganization\": {\n      \"score\": number (out of 7.5),\n      \"feedback\": \"detailed feedback\",\n      \"nextSteps\": [\"actionable next steps\"]\n    },\n    \"languageFeaturesAndVocabulary\": {\n      \"score\": number (out of 7.5),\n      \"feedback\": \"detailed feedback\",\n      \"nextSteps\": [\"actionable next steps\"]\n    },\n    \"spellingPunctuationGrammar\": {\n      \"score\": number (out of 6),\n      \"feedback\": \"detailed feedback\",\n      \"nextSteps\": [\"actionable next steps\"]\n    }\n  },\n  \"overallRecommendations\": [\"general recommendations for overall improvement\"]\n}\
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert NSW Selective School writing assessor. Your task is to score student writing samples based on the NSW Selective School marking criteria and provide detailed, actionable feedback."
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
      console.error("Failed to parse essay score analysis as JSON:", parseError);
      return {
        success: false,
        error: "Failed to score essay",
        overallScore: 0,
        overallBand: 1,
        message: "Please try again to get detailed essay scoring."
      };
    }

  } catch (error) {
    console.error("Error in NSW essay scoring:", error);
    return {
      success: false,
      error: error.message,
      message: "Unable to score essay at this time."
    };
  }
}

// 5. NSW Writing Improvement Suggestions Endpoint
async function getNSWWritingImprovementSuggestions(content, textType, feedback) {
  try {
    const prompt = `You are an expert NSW Selective School writing coach. Based on the student\'s writing and the provided feedback, generate specific, actionable suggestions for improving the writing. Focus on practical advice that a student can immediately apply.\n\nSTUDENT\'S WRITING:\n"${content}"\n\nTEXT TYPE: ${textType}\n\nPREVIOUS FEEDBACK (if any):\n${JSON.stringify(feedback, null, 2)}\n\nINSTRUCTIONS:\n1. Identify 3-5 key areas for improvement based on the writing and feedback.\n2. For each area, provide 2-3 concrete, actionable suggestions.\n3. Suggestions should be easy for a student to understand and implement.\n4. Ensure suggestions are relevant to NSW Selective School writing standards.\n\nFormat your response as a JSON object with this structure:\n{\n  \"improvementAreas\": [\n    {\n      \"area\": \"e.g., Developing stronger topic sentences\",\n      \"suggestions\": [\"suggestion 1\", \"suggestion 2\"]\n    }\n  ],\n  \"generalTips\": [\"general advice for writing improvement\"]\n}\
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert NSW Selective School writing coach providing actionable advice for student improvement."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1500
    });

    const suggestionsText = response.choices[0].message.content;

    try {
      const suggestionsJson = JSON.parse(suggestionsText);
      return {
        success: true,
        ...suggestionsJson,
        analysisTimestamp: new Date().toISOString()
      };
    } catch (parseError) {
      console.error("Failed to parse improvement suggestions as JSON:", parseError);
      return {
        success: false,
        error: "Failed to generate improvement suggestions",
        message: "Please try again to get detailed improvement suggestions."
      };
    }

  } catch (error) {
    console.error("Error in NSW writing improvement suggestions:", error);
    return {
      success: false,
      error: error.message,
      message: "Unable to generate improvement suggestions at this time."
    };
  }
}

// 6. NSW Writing Prompt Generation Endpoint
async function getNSWWritingPrompt(textType, difficulty, theme) {
  try {
    const prompt = `You are an expert NSW Selective School writing prompt generator. Create a unique and engaging writing prompt for a ${textType} piece, suitable for a student preparing for the NSW Selective School Test. The difficulty should be ${difficulty} and the theme should be related to ${theme}.\n\nINSTRUCTIONS:\n1. The prompt should clearly specify the text type.\n2. It should be challenging but achievable for a selective school candidate.\n3. Incorporate the theme naturally.\n4. Provide a word count guideline (e.g., 300-500 words).\n5. Include a brief context or scenario.\n\nFormat your response as a JSON object with this structure:\n{\n  \"textType\": \"${textType}\",\n  \"difficulty\": \"${difficulty}\",\n  \"theme\": \"${theme}\",\n  \"promptTitle\": \"A creative title for the prompt\",\n  \"promptText\": \"The full writing prompt text\",\n  \"wordCountGuideline\": \"e.g., 300-500 words\",\n  \"markingCriteriaOverview\": [\"brief overview of what will be assessed\"]\n}\
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert NSW Selective School writing prompt generator."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const promptText = response.choices[0].message.content;

    try {
      const promptJson = JSON.parse(promptText);
      return {
        success: true,
        ...promptJson,
        generationTimestamp: new Date().toISOString()
      };
    } catch (parseError) {
      console.error("Failed to parse prompt generation as JSON:", parseError);
      return {
        success: false,
        error: "Failed to generate writing prompt",
        message: "Please try again to generate a writing prompt."
      };
    }

  } catch (error) {
    console.error("Error in NSW writing prompt generation:", error);
    return {
      success: false,
      error: error.message,
      message: "Unable to generate writing prompt at this time."
    };
  }
}

// 7. NSW Model Response Generation Endpoint
async function getNSWModelResponse(prompt, textType, difficulty) {
  try {
    const modelPrompt = `You are an expert NSW Selective School writer. Write a high-quality model response to the following writing prompt. The response should be a ${textType} piece, suitable for a student aiming for a top score in the NSW Selective School Test. The difficulty level is ${difficulty}.\n\nWRITING PROMPT:\n"${prompt}"\n\nTEXT TYPE: ${textType}\nDIFFICULTY: ${difficulty}\n\nINSTRUCTIONS:\n1. Write a complete, well-structured response that perfectly adheres to the ${textType} conventions.\n2. Demonstrate sophisticated vocabulary, complex sentence structures, and advanced language features.\n3. Ensure the content is engaging, insightful, and directly addresses the prompt.\n4. Aim for a length appropriate for a top-scoring selective school response (e.g., 400-600 words).\n\nFormat your response as a JSON object with this structure:\n{\n  \"textType\": \"${textType}\",\n  \"difficulty\": \"${difficulty}\",\n  \"prompt\": \"${prompt}\",\n  \"modelResponseTitle\": \"A suitable title for the model response\",\n  \"modelResponseText\": \"The full model response text\",\n  \"wordCount\": number,\n  \"keyFeaturesDemonstrated\": [\"list key features demonstrated in this model response\"]\n}\
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert NSW Selective School writer, capable of producing high-quality model responses."
        },
        {
          role: "user",
          content: modelPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2500
    });

    const modelResponseText = response.choices[0].message.content;

    try {
      const modelResponseJson = JSON.parse(modelResponseText);
      return {
        success: true,
        ...modelResponseJson,
        generationTimestamp: new Date().toISOString()
      };
    } catch (parseError) {
      console.error("Failed to parse model response generation as JSON:", parseError);
      return {
        success: false,
        error: "Failed to generate model response",
        message: "Please try again to generate a model response."
      };
    }

  } catch (error) {
    console.error("Error in NSW model response generation:", error);
    return {
      success: false,
      error: error.message,
      message: "Unable to generate model response at this time."
    };
  }
}

// 8. NSW Grammar and Spelling Checker Endpoint
async function getNSWGrammarSpellingCheck(content) {
  try {
    const prompt = `You are an expert NSW Selective School writing assessor specializing in grammar, spelling, and punctuation. Analyze the following student writing sample and identify all errors. Provide corrections and explanations for each error.\n\nSTUDENT\'S WRITING:\n"${content}"\n\nINSTRUCTIONS:\n1. Identify all grammar, spelling, and punctuation errors.\n2. For each error, provide the original sentence, the corrected sentence, and a brief explanation of the rule violated.\n3. Categorize errors (e.g., spelling, punctuation, subject-verb agreement, tense, etc.).\n4. Provide an overall summary of the student\'s grammar and spelling proficiency.\n\nFormat your response as a JSON object with this structure:\n{\n  \"overallProficiency\": \"e.g., Needs significant improvement|Developing|Proficient|Strong\",\n  \"errorCount\": number,\n  \"errors\": [\n    {\n      \"type\": \"e.g., Spelling|Grammar|Punctuation\",\n      \"original\": \"Original sentence with error\",\n      \"corrected\": \"Corrected sentence\",\n      \"explanation\": \"Explanation of the rule and why it was an error\"\n    }\n  ],\n  \"summary\": \"Overall summary of grammar and spelling proficiency\",\n  \"nextSteps\": [\"actionable next steps for improvement\"]\n}\
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert NSW Selective School writing assessor specializing in grammar, spelling, and punctuation."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    const checkText = response.choices[0].message.content;

    try {
      const checkJson = JSON.parse(checkText);
      return {
        success: true,
        ...checkJson,
        analysisTimestamp: new Date().toISOString()
      };
    } catch (parseError) {
      console.error("Failed to parse grammar/spelling check as JSON:", parseError);
      return {
        success: false,
        error: "Failed to perform grammar and spelling check",
        message: "Please try again to get detailed grammar and spelling check."
      };
    }

  } catch (error) {
    console.error("Error in NSW grammar and spelling check:", error);
    return {
      success: false,
      error: error.message,
      message: "Unable to perform grammar and spelling check at this time."
    };
  }
}

// 9. NSW Writing Style and Tone Analysis Endpoint
async function getNSWWritingStyleToneAnalysis(content, textType) {
  try {
    const prompt = `You are an expert NSW Selective School writing assessor specializing in writing style and tone. Analyze the following student writing sample for its overall style, tone, and effectiveness in conveying its message for a ${textType} piece.\n\nSTUDENT\'S WRITING:\n"${content}"\n\nTEXT TYPE: ${textType}\n\nINSTRUCTIONS:\n1. Assess the overall writing style (e.g., formal, informal, academic, creative).\n2. Analyze the tone (e.g., objective, persuasive, reflective, engaging).\n3. Comment on the effectiveness of the style and tone for the given text type and purpose.\n4. Provide specific examples from the text to support your analysis.\n5. Suggest improvements to enhance style and tone.\n\nFormat your response as a JSON object with this structure:\n{\n  \"overallStyle\": \"e.g., Formal and descriptive\",\n  \"overallTone\": \"e.g., Reflective and engaging\",\n  \"effectivenessRating\": number (1-10),\n  \"styleAnalysis\": {\n    \"strengths\": [\"aspects of style done well\"],\n    \"improvements\": [\"aspects of style needing improvement\"]\n  },\n  \"toneAnalysis\": {\n    \"strengths\": [\"aspects of tone done well\"],\n    \"improvements\": [\"aspects of tone needing improvement\"]\n  },\n  \"specificExamples\": [\n    {\n      \"excerpt\": \"Text excerpt\",\n      \"comment\": \"Analysis of style/tone in this excerpt\"\n    }\n  ],\n  \"suggestions\": [\"actionable suggestions to improve style and tone\"]\n}\
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert NSW Selective School writing assessor specializing in writing style and tone."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    const styleToneText = response.choices[0].message.content;

    try {
      const styleToneJson = JSON.parse(styleToneText);
      return {
        success: true,
        ...styleToneJson,
        analysisTimestamp: new Date().toISOString()
      };
    } catch (parseError) {
      console.error("Failed to parse style/tone analysis as JSON:", parseError);
      return {
        success: false,
        error: "Failed to analyze writing style and tone",
        message: "Please try again to get detailed style and tone analysis."
      };
    }

  } catch (error) {
    console.error("Error in NSW writing style and tone analysis:", error);
    return {
      success: false,
      error: error.message,
      message: "Unable to analyze writing style and tone at this time."
    };
  }
}

// 10. NSW Writing Cohesion and Coherence Analysis Endpoint
async function getNSWWritingCohesionCoherenceAnalysis(content, textType) {
  try {
    const prompt = `You are an expert NSW Selective School writing assessor specializing in cohesion and coherence. Analyze the following student writing sample for its overall flow, logical progression of ideas, and effective use of cohesive devices for a ${textType} piece.\n\nSTUDENT\'S WRITING:\n"${content}"\n\nTEXT TYPE: ${textType}\n\nINSTRUCTIONS:\n1. Assess the overall cohesion (how well parts of the text stick together) and coherence (how easily the text is understood).\n2. Comment on the logical progression of ideas and arguments.\n3. Identify effective and ineffective use of cohesive devices (e.g., transition words, pronouns, repetition, conjunctions).\n4. Provide specific examples from the text to support your analysis.\n5. Suggest improvements to enhance cohesion and coherence.\n\nFormat your response as a JSON object with this structure:\n{\n  \"overallCohesion\": \"e.g., Strong and fluid\",\n  \"overallCoherence\": \"e.g., Clear and logical\",\n  \"effectivenessRating\": number (1-10),\n  \"cohesionAnalysis\": {\n    \"strengths\": [\"aspects of cohesion done well\"],\n    \"improvements\": [\"aspects of cohesion needing improvement\"]\n  },\n  \"coherenceAnalysis\": {\n    \"strengths\": [\"aspects of coherence done well\"],\n    \"improvements\": [\"aspects of coherence needing improvement\"]\n  },\n  \"cohesiveDevicesAnalysis\": {\n    \"effectiveExamples\": [\"examples of well-used cohesive devices\"],\n    \"ineffectiveExamples\": [\"examples of poorly used cohesive devices\"],\n    \"suggestions\": [\"suggestions for improving cohesive device usage\"]\n  },\n  \"suggestions\": [\"actionable suggestions to improve cohesion and coherence\"]\n}\
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert NSW Selective School writing assessor specializing in cohesion and coherence."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    const cohesionCoherenceText = response.choices[0].message.content;

    try {
      const cohesionCoherenceJson = JSON.parse(cohesionCoherenceText);
      return {
        success: true,
        ...cohesionCoherenceJson,
        analysisTimestamp: new Date().toISOString()
      };
    } catch (parseError) {
      console.error("Failed to parse cohesion/coherence analysis as JSON:", parseError);
      return {
        success: false,
        error: "Failed to analyze writing cohesion and coherence",
        message: "Please try again to get detailed cohesion and coherence analysis."
      };
    }

  } catch (error) {
    console.error("Error in NSW writing cohesion and coherence analysis:", error);
    return {
      success: false,
      error: error.message,
      message: "Unable to analyze writing cohesion and coherence at this time."
    };
  }
}

// 11. NSW Critical Thinking and Argumentation Analysis Endpoint (for persuasive/expository)
async function getNSWCriticalThinkingArgumentationAnalysis(content, textType) {
  try {
    const prompt = `You are an expert NSW Selective School writing assessor specializing in critical thinking and argumentation. Analyze the following student writing sample for its logical reasoning, depth of thought, and effectiveness of arguments for a ${textType} piece.\n\nSTUDENT\'S WRITING:\n"${content}"\n\nTEXT TYPE: ${textType}\n\nINSTRUCTIONS:\n1. Assess the clarity and strength of the thesis statement/main argument.\n2. Evaluate the logical flow and coherence of arguments.\n3. Comment on the use of evidence, examples, and reasoning to support claims.\n4. Identify any fallacies, inconsistencies, or weaknesses in argumentation.\n5. Suggest improvements to enhance critical thinking and argumentation.\n\nFormat your response as a JSON object with this structure:\n{\n  \"overallCriticalThinking\": \"e.g., Strong and insightful\",\n  \"argumentStrengthRating\": number (1-10),\n  \"thesisAnalysis\": {\n    \"clarity\": \"analysis of thesis clarity\",\n    \"strength\": \"analysis of thesis strength\"\n  },\n  \"argumentationAnalysis\": {\n    \"strengths\": [\"aspects of argumentation done well\"],\n    \"improvements\": [\"aspects of argumentation needing improvement\"]\n  },\n  \"evidenceAnalysis\": {\n    \"effectiveExamples\": [\"examples of well-used evidence\"],\n    \"ineffectiveExamples\": [\"examples of poorly used evidence\"],\n    \"suggestions\": [\"suggestions for improving evidence usage\"]\n  },\n  \"suggestions\": [\"actionable suggestions to improve critical thinking and argumentation\"]\n}\
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert NSW Selective School writing assessor specializing in critical thinking and argumentation."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    const criticalThinkingText = response.choices[0].message.content;

    try {
      const criticalThinkingJson = JSON.parse(criticalThinkingText);
      return {
        success: true,
        ...criticalThinkingJson,
        analysisTimestamp: new Date().toISOString()
      };
    } catch (parseError) {
      console.error("Failed to parse critical thinking analysis as JSON:", parseError);
      return {
        success: false,
        error: "Failed to analyze critical thinking and argumentation",
        message: "Please try again to get detailed critical thinking and argumentation analysis."
      };
    }

  } catch (error) {
    console.error("Error in NSW critical thinking and argumentation analysis:", error);
    return {
      success: false,
      error: error.message,
      message: "Unable to analyze critical thinking and argumentation at this time."
    };
  }
}

// 12. NSW Creative Writing Elements Analysis Endpoint (for narrative/descriptive)
async function getNSWCreativeWritingElementsAnalysis(content, textType) {
  try {
    const prompt = `You are an expert NSW Selective School writing assessor specializing in creative writing elements. Analyze the following student writing sample for its use of literary devices, originality, character development, and imaginative qualities for a ${textType} piece.\n\nSTUDENT\'S WRITING:\n"${content}"\n\nTEXT TYPE: ${textType}\n\nINSTRUCTIONS:\n1. Assess the effectiveness of literary devices (e.g., metaphors, similes, personification, imagery).\n2. Comment on the originality and creativity of the ideas.\n3. Evaluate character development and emotional depth.\n4. Analyze the use of setting and atmosphere.\n5. Suggest improvements to enhance creative writing elements.\n\nFormat your response as a JSON object with this structure:\n{\n  \"overallCreativity\": \"e.g., Highly imaginative and original\",\n  \"literaryDevicesAnalysis\": {\n    \"effectiveExamples\": [\"examples of well-used literary devices\"],\n    \"ineffectiveExamples\": [\"examples of poorly used literary devices\"],\n    \""suggestions\": [\"suggestions for improving literary device usage\"]\n  },\n  \"originalityAnalysis\": {\n    \"strengths\": [\"aspects of originality done well\"],\n    \"improvements\": [\"aspects of originality needing improvement\"]\n  },\n  \"characterDevelopmentAnalysis\": {\n    \"strengths\": [\"aspects of character development done well\"],\n    \"improvements\": [\"aspects of character development needing improvement\"]\n  },\n  \"settingAtmosphereAnalysis\": {\n    \"strengths\": [\"aspects of setting/atmosphere done well\"],\n    \"improvements\": [\"aspects of setting/atmosphere needing improvement\"]\n  },\n  \"suggestions\": [\"actionable suggestions to improve creative writing elements\"]\n}\
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert NSW Selective School writing assessor specializing in creative writing elements."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    const creativeWritingText = response.choices[0].message.content;

    try {
      const creativeWritingJson = JSON.parse(creativeWritingText);
      return {
        success: true,
        ...creativeWritingJson,
        analysisTimestamp: new Date().toISOString()
      };
    } catch (parseError) {
      console.error("Failed to parse creative writing analysis as JSON:", parseError);
      return {
        success: false,
        error: "Failed to analyze creative writing elements",
        message: "Please try again to get detailed creative writing elements analysis."
      };
    }

  } catch (error) {
    console.error("Error in NSW creative writing elements analysis:", error);
    return {
      success: false,
      error: error.message,
      message: "Unable to analyze creative writing elements at this time."
    };
  }
}

// Main handler for Netlify Function
export async function handler(event, context) {
  const { path, httpMethod, body } = event;

  // Only allow POST requests
  if (httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed"
    };
  }

  // Parse the request body
  let requestBody;
  try {
    requestBody = JSON.parse(body);
  } catch (error) {
    return {
      statusCode: 400,
      body: "Invalid JSON in request body"
    };
  }

  const { endpoint, content, textType, userId, assessmentData, feedback, difficulty, theme, prompt } = requestBody;

  let result;

  switch (endpoint) {
    case "getNSWTextTypeAnalysis":
      result = await getNSWTextTypeAnalysis(content, textType);
      break;
    case "getNSWVocabularySophistication":
      result = await getNSWVocabularySophistication(content);
      break;
    case "getNSWProgressTracking":
      result = await getNSWProgressTracking(userId, assessmentData);
      break;
    case "getNSWEssayScore":
      result = await getNSWEssayScore(content, textType);
      break;
    case "getNSWWritingImprovementSuggestions":
      result = await getNSWWritingImprovementSuggestions(content, textType, feedback);
      break;
    case "getNSWWritingPrompt":
      result = await getNSWWritingPrompt(textType, difficulty, theme);
      break;
    case "getNSWModelResponse":
      result = await getNSWModelResponse(prompt, textType, difficulty);
      break;
    case "getNSWGrammarSpellingCheck":
      result = await getNSWGrammarSpellingCheck(content);
      break;
    case "getNSWWritingStyleToneAnalysis":
      result = await getNSWWritingStyleToneAnalysis(content, textType);
      break;
    case "getNSWWritingCohesionCoherenceAnalysis":
      result = await getNSWWritingCohesionCoherenceAnalysis(content, textType);
      break;
    case "getNSWCriticalThinkingArgumentationAnalysis":
      result = await getNSWCriticalThinkingArgumentationAnalysis(content, textType);
      break;
    case "getNSWCreativeWritingElementsAnalysis":
      result = await getNSWCreativeWritingElementsAnalysis(content, textType);
      break;
    default:
      result = {
        success: false,
        error: "Invalid endpoint",
        message: "The requested API endpoint does not exist."
      };
  }

  return {
    statusCode: result.success ? 200 : 500,
    body: JSON.stringify(result)
  };
}