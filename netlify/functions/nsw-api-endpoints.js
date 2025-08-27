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

    const prompt = `You are an expert NSW Selective School writing assessor specializing in text type analysis. Analyze this ${textType} writing sample and provide detailed feedback on how well it adheres to the specific requirements and conventions of this text type.\n\nSTUDENT\"S WRITING:\n\"${content}\"\n\nTEXT TYPE: ${textType}\n\nCONTENT ANALYSIS:\n- Word count: ${analysis.wordCount}\n- Sentence count: ${analysis.sentenceCount}\n- Paragraph count: ${analysis.paragraphCount}\n- Has dialogue: ${analysis.hasDialogue}\n- Potential characters: ${analysis.potentialCharacters.join(\", \") || \"None identified\"}\n\nTEXT TYPE SPECIFIC ANALYSIS FOR ${textType.toUpperCase()}:\n\n${getTextTypeRequirements(textType)}\n\nINSTRUCTIONS:\n1. Assess how well the writing meets the specific requirements of ${textType}\n2. Identify which text type features are present and which are missing\n3. Provide specific examples from the student\"s text\n4. Suggest improvements specific to this text type\n5. Rate adherence to text type conventions (1-10)\n\nFormat your response as a JSON object with this structure:\n{\n  \"textType\": \"${textType}\",\n  \"adherenceScore\": number (1-10),\n  \"textTypeFeatures\": {\n    \"present\": [\"features that are well demonstrated\"],\n    \"partial\": [\"features that are partially demonstrated\"],\n    \"missing\": [\"features that are missing or weak\"]\n  },\n  \"structuralAnalysis\": {\n    \"opening\": \"analysis of how well the opening meets text type requirements\",\n    \"body\": \"analysis of body paragraphs/development\",\n    \"conclusion\": \"analysis of conclusion effectiveness\"\n  },\n  \"languageFeatures\": {\n    \"appropriate\": [\"language features used well for this text type\"],\n    \"needsWork\": [\"language features that need improvement\"]\n  },\n  \"specificSuggestions\": [\"actionable suggestions specific to improving this text type\"],\n  \"textTypeExamples\": [\"examples of how to improve specific elements\"],\n  \"nextSteps\": [\"specific tasks to better meet text type requirements\"]\n}\
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
    
    descriptive: `\n    DESCRIPTIVE REQUIREMENTS:\n    - Rich sensory details (sight, sound, smell, touch, taste)\n    - Vivid imagery and figurative language\n    - Clear focus on a person, place, object, or experience\n    - Organized spatial or logical structure\n    - Varied sentence structures for rhythm\n    - Precise vocabulary and word choice\n    - Creates a clear mental picture for the reader\n    - Engages the reader\"s senses and emotions`
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

    const prompt = `You are an expert NSW Selective School writing assessor specializing in vocabulary sophistication analysis. Analyze this writing sample for vocabulary complexity, variety, and sophistication appropriate for NSW Selective standards.\n\nSTUDENT\"S WRITING:\n\"${content}\"\n\nBASIC VOCABULARY METRICS:\n- Total words: ${words.length}\n- Unique words: ${uniqueWords.length}\n- Vocabulary diversity ratio: ${(uniqueWords.length / words.length * 100).toFixed(1)}%\n- Words over 6 letters: ${longWords.length}\n- Potential academic words: ${academicWords.length}\n\nVOCABULARY SOPHISTICATION ANALYSIS:\n1. Assess vocabulary complexity and variety\n2. Identify sophisticated word choices\n3. Find opportunities for vocabulary enhancement\n4. Suggest specific word improvements\n5. Rate overall vocabulary sophistication (1-10)\n\nFormat your response as a JSON object:\n{\n  \"vocabularyScore\": number (1-10),\n  \"sophisticationLevel\": \"emerging|developing|proficient|advanced\",\n  \"vocabularyMetrics\": {\n    \"totalWords\": ${words.length},\n    \"uniqueWords\": ${uniqueWords.length},\n    \"diversityRatio\": ${(uniqueWords.length / words.length * 100).toFixed(1)},\n    \"averageWordLength\": number,\n    \"complexWords\": number\n  },\n  \"strengths\": {\n    \"sophisticatedWords\": [\"list of sophisticated words used well\"],\n    \"varietyExamples\": [\"examples of good vocabulary variety\"],\n    \"appropriateChoices\": [\"words that are well-chosen for context\"]\n  },\n  \"improvements\": {\n    \"basicWords\": [\"simple words that could be enhanced\"],\n    \"repetitiveWords\": [\"words that are overused\"],\n    \"missedOpportunities\": [\"places where more sophisticated words could be used\"]\n  },\n  \"suggestions\": {\n    \"wordReplacements\": [\n      {\n        \"original\": \"simple word\",\n        \"suggestions\": [\"sophisticated alternative 1\", \"sophisticated alternative 2\"],\n        \"context\": \"explanation of when to use\"\n      }\n    ],\n    \"vocabularyTechniques\": [\"specific techniques to improve vocabulary\"],\n    \"practiceActivities\": [\"activities to build vocabulary sophistication\"]\n  },\n  \"nextSteps\": [\"specific actions to improve vocabulary sophistication\"]\n}\
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
    \'analyze\', \'concept\', \'constitute\', \'context\', \'create\', \'data\', \'define\', \'derive\',
    \'distribute\', \'economy\', \'environment\', \'establish\', \'estimate\', \''evident\', \'export\',
    \'factor\', \'finance\', \'formula\', \'function\', \'identify\', \'income\', \'indicate\',
    \'individual\', \'interpret\', \'involve\', \'issue\', \'labor\', \'legal\', \'legislate\',
    \'major\', \'method\', \'occur\', \'percent\', \'period\', \'policy\', \'principle\', \'proceed\',
    \'process\', \'require\', \'research\', \'respond\', \'role\', \'section\', \'significant\',
    \'similar\', \'source\', \'specific\', \'structure\', \'theory\', \'vary\', \'furthermore\',
    \'consequently\', \'nevertheless\', \'therefore\', \'moreover\', \'however\', \'although\',
    \'demonstrate\', \'illustrate\', \'emphasize\', \'examine\', \'investigate\', \'conclude\'
  ];
  return academicWords.includes(word);
}

// 3. Progress Tracking Endpoint
async function getNSWProgressTracking(userId, assessmentData) {
  try {
    // This would typically interact with a database to store and retrieve progress data
    // For now, we\'ll simulate progress tracking with the provided assessment data
    
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
      strengths.push(key.replace(/([A-Z])/g, \' $1\').toLowerCase());
    }
  });
  
  return strengths.length > 0 ? strengths : ["Keep working on all areas"];
}

function identifyImprovements(assessment) {
  const improvements = [];
  const criteria = assessment.criteriaFeedback || {};

  Object.entries(criteria).forEach(([key, value]) => {
    if (value.score && value.maxScore && (value.score / value.maxScore) < 0.5) {
      improvements.push(key.replace(/([A-Z])/g, \' $1\').toLowerCase());
    }
  });

  return improvements.length > 0 ? improvements : ["Continue to refine all areas"];
}

function getFocusAreas(assessment) {
  const focusAreas = [];
  const criteria = assessment.criteriaFeedback || {};

  Object.entries(criteria).forEach(([key, value]) => {
    if (value.score && value.maxScore && (value.score / value.maxScore) < 0.7) {
      focusAreas.push(key.replace(/([A-Z])/g, \' $1\').toLowerCase());
    }
  });

  return focusAreas.length > 0 ? focusAreas : ["Maintain current strengths"];
}

function getPracticeActivities(assessment) {
  const activities = [];
  const focusAreas = getFocusAreas(assessment);

  if (focusAreas.includes("ideas and content")) {
    activities.push("Brainstorming new ideas for different text types");
  }
  if (focusAreas.includes("text structure and organization")) {
    activities.push("Outlining essays and stories before writing");
  }
  if (focusAreas.includes("language features and vocabulary")) {
    activities.push("Practicing using new vocabulary words in sentences");
  }
  if (focusAreas.includes("spelling punctuation grammar")) {
    activities.push("Proofreading your work carefully and reading it aloud");
  }

  return activities.length > 0 ? activities : ["Continue regular writing practice"];
}

function getStudyPlan(assessment) {
  const studyPlan = [];
  const focusAreas = getFocusAreas(assessment);

  if (focusAreas.includes("ideas and content")) {
    studyPlan.push("Week 1: Focus on generating diverse ideas and developing them fully");
  }
  if (focusAreas.includes("text structure and organization")) {
    studyPlan.push("Week 2: Practice structuring different text types (narrative, persuasive, etc.)");
  }
  if (focusAreas.includes("language features and vocabulary")) {
    studyPlan.push("Week 3: Expand vocabulary and experiment with figurative language");
  }
  if (focusAreas.includes("spelling punctuation grammar")) {
    studyPlan.push("Week 4: Intensive grammar and punctuation review");
  }

  return studyPlan.length > 0 ? studyPlan : ["Maintain a balanced study routine"];
}

// 4. NSW Coaching Tips Endpoint
async function getNSWCoachingTips(content, textType, currentScore, focusArea) {
  try {
    const prompt = `You are an expert NSW Selective School writing coach. Provide specific, actionable coaching tips for a student based on their writing, current score, and a specific focus area. The tips should be encouraging and directly applicable to improving their writing for the NSW Selective Test.\n\nSTUDENT\"S WRITING:\n\"${content}\"\n\nTEXT TYPE: ${textType}\nCURRENT SCORE: ${currentScore}/30\nFOCUS AREA: ${focusArea}\n\nCOACHING TIPS:\n1. Provide 3-5 specific, actionable tips related to the focus area.\n2. Include an encouraging opening and closing statement.\n3. Suggest a concrete next step or practice activity.\n\nFormat your response as a JSON object:\n{\n  \"openingStatement\": \"Encouraging opening statement\",\n  \"tips\": [\"Tip 1\", \"Tip 2\", \"Tip 3\"],\n  \"nextStep\": \"Concrete practice activity\",\n  \"closingStatement\": \"Encouraging closing statement\"\n}\
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert NSW Selective School writing coach providing actionable advice."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const coachingTipsText = response.choices[0].message.content;

    try {
      const coachingTipsJson = JSON.parse(coachingTipsText);
      return {
        success: true,
        ...coachingTipsJson,
        analysisTimestamp: new Date().toISOString()
      };
    } catch (parseError) {
      console.error("Failed to parse coaching tips as JSON:", parseError);
      return {
        success: false,
        error: "Failed to generate coaching tips",
        message: "Please try again to get detailed coaching tips."
      };
    }

  } catch (error) {
    console.error("Error in NSW coaching tips:", error);
    return {
      success: false,
      error: error.message,
      message: "Unable to generate coaching tips at this time."
    };
  }
}

export { getNSWTextTypeAnalysis, getNSWVocabularySophistication, getNSWProgressTracking, getNSWCoachingTips };