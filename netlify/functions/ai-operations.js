const { OpenAI } = require('openai');

// Initialize OpenAI with error handling
let openai = null;
try {
  const apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
  if (apiKey && apiKey.startsWith("sk-")) {
    openai = new OpenAI({
      apiKey: apiKey,
    });
  }
} catch (error) {
  console.error('Failed to initialize OpenAI:', error);
}

// Helper function to create fallback response with NSW structure
function createFallbackResponse(content, textType) {
  const wordCount = content ? content.split(' ').length : 0;
  const sentences = content ? content.split(/[.!?]+/).filter(s => s.trim().length > 0) : [];
  
  return {
    ideasAndContent: {
      name: "Ideas and Content",
      weight: 25,
      score: Math.min(9, Math.max(3, Math.floor(wordCount / 20))),
      maxScore: 9,
      strengths: [
        "Your story has a clear beginning",
        "You've included some interesting details"
      ],
      improvements: [
        "Add more descriptive details to make your story more engaging",
        "Develop your characters more fully"
      ],
      specificExamples: [
        content.substring(0, Math.min(50, content.length)) + "..."
      ],
      suggestions: [
        "Try using the five senses to describe scenes",
        "Show character emotions through actions rather than just telling"
      ]
    },
    textStructure: {
      name: "Text Structure and Organization",
      weight: 25,
      score: Math.min(9, Math.max(3, Math.floor(wordCount / 25))),
      maxScore: 9,
      strengths: [
        "Your story follows a logical sequence"
      ],
      improvements: [
        "Use more varied sentence starters",
        "Add transition words to connect ideas better"
      ],
      specificExamples: [],
      suggestions: [
        "Try starting sentences with different words (Instead of 'I', try 'Suddenly', 'Meanwhile', etc.)",
        "Use paragraphs to organize different parts of your story"
      ]
    },
    languageFeatures: {
      name: "Language Features and Vocabulary",
      weight: 25,
      score: Math.min(9, Math.max(3, Math.floor(wordCount / 30))),
      maxScore: 9,
      strengths: [
        "You've used some descriptive words"
      ],
      improvements: [
        "Use more sophisticated vocabulary",
        "Include literary devices like metaphors or similes"
      ],
      specificExamples: [],
      suggestions: [
        "Replace simple words with more interesting alternatives",
        "Try using similes (like/as comparisons) to make descriptions more vivid"
      ]
    },
    grammarAndPunctuation: {
      name: "Spelling, Punctuation and Grammar",
      weight: 25,
      score: Math.min(9, Math.max(3, Math.floor(wordCount / 15))),
      maxScore: 9,
      strengths: [
        "Most sentences are complete"
      ],
      improvements: [
        "Check spelling of longer words",
        "Use more varied punctuation"
      ],
      specificExamples: [],
      suggestions: [
        "Read your work aloud to catch missing words",
        "Try using exclamation marks for exciting moments"
      ]
    },
    overallScore: Math.min(36, Math.max(12, Math.floor(wordCount / 15))),
    narrativeStructure: {
      orientation: wordCount > 20,
      complication: wordCount > 50,
      risingAction: wordCount > 80,
      climax: wordCount > 100,
      resolution: wordCount > 120,
      coda: wordCount > 150
    },
    showDontTellAnalysis: {
      tellingInstances: [
        {
          text: "I was scared",
          suggestion: "Instead of saying 'I was scared', describe what fear feels like: 'My heart pounded and my hands trembled'"
        }
      ],
      showingInstances: []
    },
    literaryDevices: {
      identified: [],
      suggestions: [
        "Try using a simile: 'The wind howled like a wild animal'",
        "Use personification: 'The trees danced in the breeze'"
      ]
    },
    sentenceVariety: {
      simple: Math.floor(sentences.length * 0.6),
      compound: Math.floor(sentences.length * 0.3),
      complex: Math.floor(sentences.length * 0.1),
      suggestions: [
        "Try combining short sentences with words like 'and', 'but', 'because'",
        "Start some sentences with describing words or phrases"
      ]
    }
  };
}

exports.handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { content, textType, assistanceLevel } = JSON.parse(event.body);

    if (!content || content.trim().length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Content is required' })
      };
    }

    // If OpenAI is not available, return fallback response
    if (!openai) {
      console.log('OpenAI not available, returning fallback response');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(createFallbackResponse(content, textType))
      };
    }

    // Create NSW-specific feedback using OpenAI
    const systemPrompt = `You are an expert NSW Selective School writing assessor. Analyze the following ${textType} writing sample and provide detailed feedback according to NSW Selective writing criteria.

ASSESSMENT CRITERIA (each scored 0-9):
1. Ideas and Content (25% weight) - Creativity, relevance, development of ideas
2. Text Structure and Organization (25% weight) - Logical flow, paragraphing, narrative structure
3. Language Features and Vocabulary (25% weight) - Word choice, literary devices, sophistication
4. Spelling, Punctuation and Grammar (25% weight) - Technical accuracy

For each criterion, provide:
- A score out of 9 (be realistic - most students score 4-7)
- 2-3 specific strengths with examples from the text
- 2-3 areas for improvement
- Specific examples from their writing (exact quotes)
- 2-3 actionable suggestions for improvement

Also analyze:
- Narrative structure elements (orientation, complication, rising action, climax, resolution, coda)
- "Show don't tell" instances
- Literary devices used and suggestions for more
- Sentence variety (simple, compound, complex)

Return your response as a JSON object with this exact structure:
{
  "ideasAndContent": {
    "name": "Ideas and Content",
    "weight": 25,
    "score": number,
    "maxScore": 9,
    "strengths": ["strength 1", "strength 2"],
    "improvements": ["improvement 1", "improvement 2"],
    "specificExamples": ["exact quote 1", "exact quote 2"],
    "suggestions": ["suggestion 1", "suggestion 2"]
  },
  "textStructure": {
    "name": "Text Structure and Organization", 
    "weight": 25,
    "score": number,
    "maxScore": 9,
    "strengths": ["strength 1", "strength 2"],
    "improvements": ["improvement 1", "improvement 2"],
    "specificExamples": ["exact quote 1", "exact quote 2"],
    "suggestions": ["suggestion 1", "suggestion 2"]
  },
  "languageFeatures": {
    "name": "Language Features and Vocabulary",
    "weight": 25,
    "score": number,
    "maxScore": 9,
    "strengths": ["strength 1", "strength 2"],
    "improvements": ["improvement 1", "improvement 2"],
    "specificExamples": ["exact quote 1", "exact quote 2"],
    "suggestions": ["suggestion 1", "suggestion 2"]
  },
  "grammarAndPunctuation": {
    "name": "Spelling, Punctuation and Grammar",
    "weight": 25,
    "score": number,
    "maxScore": 9,
    "strengths": ["strength 1", "strength 2"],
    "improvements": ["improvement 1", "improvement 2"],
    "specificExamples": ["exact quote 1", "exact quote 2"],
    "suggestions": ["suggestion 1", "suggestion 2"]
  },
  "overallScore": number,
  "narrativeStructure": {
    "orientation": boolean,
    "complication": boolean,
    "risingAction": boolean,
    "climax": boolean,
    "resolution": boolean,
    "coda": boolean
  },
  "showDontTellAnalysis": {
    "tellingInstances": [{"text": "exact quote", "suggestion": "how to show instead"}],
    "showingInstances": ["good example 1", "good example 2"]
  },
  "literaryDevices": {
    "identified": ["device 1", "device 2"],
    "suggestions": ["try this device", "try that device"]
  },
  "sentenceVariety": {
    "simple": number,
    "compound": number,
    "complex": number,
    "suggestions": ["variety tip 1", "variety tip 2"]
  }
}

Be encouraging but honest. Focus on specific, actionable feedback that helps students improve.`;

    const userPrompt = `Please analyze this ${textType} writing sample:\n\n${content}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 3000,
      temperature: 0.3
    });

    let feedbackData;
    try {
      feedbackData = JSON.parse(response.choices[0].message.content);
      
      // Ensure all required fields are present
      if (!feedbackData.ideasAndContent || !feedbackData.textStructure || 
          !feedbackData.languageFeatures || !feedbackData.grammarAndPunctuation) {
        throw new Error('Missing required feedback fields');
      }
      
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError);
      feedbackData = createFallbackResponse(content, textType);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(feedbackData)
    };

  } catch (error) {
    console.error('Error in ai-feedback function:', error);
    
    // Return fallback response on error
    const fallbackData = createFallbackResponse(
      event.body ? JSON.parse(event.body).content || '' : '',
      event.body ? JSON.parse(event.body).textType || 'narrative' : 'narrative'
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(fallbackData)
    };
  }
};