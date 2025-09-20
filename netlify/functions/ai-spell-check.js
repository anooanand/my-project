/**
 * AI-powered spell and grammar checking using OpenAI
 * Netlify Function: /api/ai-spell-check
 */

const { Configuration, OpenAIAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIAIApi(configuration);

exports.handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS' ) {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST' ) {
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

    // Limit text length to avoid excessive API costs
    if (text.length > 2000) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Text too long. Maximum 2000 characters allowed.' }),
      };
    }

    const systemPrompt = `You are an expert writing assistant specializing in grammar, spelling, and style correction for students preparing for NSW selective school exams. \n\nYour task is to analyze the provided text and identify errors in:\n1. Spelling mistakes\n2. Grammar errors\n3. Style improvements (clarity, conciseness, word choice)\n\nFor each error found, provide:\n- The exact word or phrase that needs correction\n- The start and end position in the text\n- 1-3 specific suggestions for improvement\n- The type of error (spelling, grammar, or style)\n- Severity level (low, medium, high)\n- A brief explanation of why it\'s an error\n\nReturn your response as a JSON object with this exact structure:\n{\n  \
