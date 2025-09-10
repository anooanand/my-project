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

// Helper function to create fallback response
function createFallbackResponse(content, textType) {
  const wordCount = content ? content.split(' ').length : 0;
  return {
    overallScore: Math.min(25, Math.max(10, wordCount / 10)),
    criteriaScores: {
      ideasAndContent: Math.min(9, Math.max(3, Math.floor(wordCount / 20))),
      textStructureAndOrganization: Math.min(9, Math.max(3, Math.floor(wordCount / 25))),
      languageFeaturesAndVocabulary: Math.min(9, Math.max(3, Math.floor(wordCount / 30))),
      spellingPunctuationAndGrammar: Math.min(9, Math.max(3, Math.floor(wordCount / 15)))
    },
    feedbackCategories: [
      {
        category: "Ideas and Content",
        score: Math.min(9, Math.max(3, Math.floor(wordCount / 20))),
        strengths: [
          {
            exampleFromText: content.substring(0, 50) + "...",
            position: { start: 0, end: 50 },
            comment: "Good start to your story"
          }
        ],
        areasForImprovement: [
          {
            exampleFromText: "Consider adding more details",
            position: { start: 0, end: 0 },
            suggestionForImprovement: "Add more descriptive details to engage the reader"
          }
        ]
      }
    ],
    grammarCorrections: [],
    vocabularyEnhancements: []
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

ASSESSMENT CRITERIA:
1. Ideas and Content (0-9 points)
2. Text Structure and Organization (0-9 points) 
3. Language Features and Vocabulary (0-9 points)
4. Spelling, Punctuation and Grammar (0-9 points)

For each criterion, provide:
- A score out of 9
- Specific examples from the text with character positions
- Strengths with examples
- Areas for improvement with specific suggestions

Return your response as a JSON object with this exact structure:
{
  "overallScore": number,
  "criteriaScores": {
    "ideasAndContent": number,
    "textStructureAndOrganization": number,
    "languageFeaturesAndVocabulary": number,
    "spellingPunctuationAndGrammar": number
  },
  "feedbackCategories": [
    {
      "category": "Ideas and Content",
      "score": number,
      "strengths": [
        {
          "exampleFromText": "exact text excerpt",
          "position": {"start": number, "end": number},
          "comment": "positive feedback"
        }
      ],
      "areasForImprovement": [
        {
          "exampleFromText": "exact text excerpt",
          "position": {"start": number, "end": number},
          "suggestionForImprovement": "specific suggestion"
        }
      ]
    }
  ],
  "grammarCorrections": [
    {
      "original": "incorrect text",
      "suggestion": "corrected text",
      "explanation": "why this is better",
      "position": {"start": number, "end": number}
    }
  ],
  "vocabularyEnhancements": [
    {
      "original": "simple word",
      "suggestion": "sophisticated word",
      "explanation": "why this is better",
      "position": {"start": number, "end": number}
    }
  ]
}`;

    const userPrompt = `Please analyze this ${textType} writing sample:\n\n${content}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 2000,
      temperature: 0.3
    });

    let feedbackData;
    try {
      feedbackData = JSON.parse(response.choices[0].message.content);
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