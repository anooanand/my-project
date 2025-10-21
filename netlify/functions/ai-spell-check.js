const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.VITE_OPENAI_API_KEY,
});

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { text, checkType = 'comprehensive' } = JSON.parse(event.body);

    if (!text || text.trim().length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Text is required' }),
      };
    }

    if (text.length > 2000) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Text too long. Maximum 2000 characters allowed.' }),
      };
    }

    const systemPrompt = `You are an expert writing assistant specializing in grammar, spelling, and style correction for students preparing for NSW selective school exams.

Your task is to analyze the provided text and identify errors in:
1. Spelling mistakes
2. Grammar errors
3. Style improvements (clarity, conciseness, word choice)

For each error found, provide:
- The exact word or phrase that needs correction
- The start and end position in the text
- 1-3 specific suggestions for improvement
- The type of error (spelling, grammar, or style)
- Severity level (low, medium, high)
- A brief explanation of why it's an error

Return your response as a JSON object with this exact structure:
{
  "errors": [
    {
      "word": "example",
      "start": 0,
      "end": 7,
      "suggestions": ["suggestion1", "suggestion2"],
      "type": "spelling",
      "severity": "high",
      "explanation": "explanation"
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const suggestions = JSON.parse(response.choices[0].message.content);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(suggestions),
    };
  } catch (error) {
    console.error('Error during AI spell check:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to process spell check request', details: error.message }),
    };
  }
};
