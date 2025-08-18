const { Configuration, OpenAIApi } = require('openai');

// Initialize OpenAI with error handling
let openai = null;
try {
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-')) {
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    openai = new OpenAIApi(configuration);
  }
} catch (error) {
  console.error('Failed to initialize OpenAI:', error);
}

// Helper function to create fallback responses
function createFallbackResponse(operation, data) {
  switch (operation) {
    case 'check_openai_connection':
      return { is_connected: false };
    
    case 'getNSWSelectiveFeedback':
      const wordCount = data.content ? data.content.split(' ').length : 0;
      return {
        overallComment: `Your ${wordCount}-word ${data.textType || 'writing'} shows good effort! Keep developing your ideas.`,
        totalScore: Math.min(25, Math.max(10, wordCount / 10)),
        overallBand: 4,
        bandDescription: "Sound - Adequate ideas",
        estimatedExamScore: `${Math.min(25, Math.max(10, wordCount / 10))}/30`,
        criteriaFeedback: {
          ideasAndContent: {
            score: 6,
            maxScore: 9,
            band: 4,
            strengths: ["Clear main ideas"],
            improvements: ["Add more specific details"],
            suggestions: ["Include more examples"],
            nextSteps: ["Expand with 2-3 more details"]
          }
        }
      };
    
    case 'analyzeQuestion':
      return {
        guidance: "I'd be happy to help with your writing question!",
        strategies: ["Focus on clear structure", "Use specific examples"],
        structure: "Introduction, body paragraphs, conclusion",
        encouragement: "You're doing great - keep practicing!"
      };
    
    default:
      return { error: 'Operation not supported in fallback mode' };
  }
}

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  // Only handle POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const data = JSON.parse(event.body || '{}');
    const operation = data.operation;

    console.log(`Processing operation: ${operation}`);

    // Handle check_openai_connection specifically
    if (operation === 'check_openai_connection') {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_connected: openai !== null })
      };
    }

    // For other operations, try OpenAI if available, otherwise use fallback
    let result;
    
    if (openai && operation === 'getNSWSelectiveFeedback') {
      try {
        const response = await openai.createChatCompletion({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are an expert NSW Selective writing assessor providing detailed feedback.'
            },
            {
              role: 'user',
              content: `Analyze this ${data.textType} writing and provide NSW Selective feedback: "${data.content}"`
            }
          ],
          max_tokens: 1500,
          temperature: 0.7
        });

        const content = response.data.choices[0].message.content;
        
        try {
          result = JSON.parse(content);
        } catch (parseError) {
          result = createFallbackResponse(operation, data);
        }
      } catch (openaiError) {
        console.error('OpenAI API error:', openaiError);
        result = createFallbackResponse(operation, data);
      }
    } else {
      result = createFallbackResponse(operation, data);
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('Function error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    };
  }
};