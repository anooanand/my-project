// netlify/functions/chat-response.js
// Handles AI chat responses for the writing coach

const { OpenAI } = require("openai");

// Initialize OpenAI client
let client = null;
try {
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey && apiKey.startsWith("sk-")) {
    client = new OpenAI({ apiKey });
  }
} catch (error) {
  console.error("Failed to initialize OpenAI client:", error);
}

// Fallback responses for when OpenAI is unavailable
const fallbackResponses = {
  greeting: "Hi there! I'm your AI Writing Buddy! 😊 I'm here to help you with your writing. What would you like to work on today?",
  introduction: "Great question about introductions! Try starting with an interesting question, a surprising fact, or jump right into the action. What's your story about?",
  vocabulary: "For better vocabulary, try replacing simple words with more descriptive ones. Instead of 'big', try 'enormous' or 'massive'. What word are you looking to improve?",
  conclusion: "For a strong conclusion, try to tie back to your opening or show how your character has changed. What's the main message of your story?",
  characters: "To make characters interesting, give them unique traits, fears, or goals. Show their personality through their actions and dialogue. Tell me about your character!",
  hook: "A good story hook grabs attention immediately! Try starting with dialogue, action, or an intriguing situation. What's the most exciting part of your story?",
  general: "That's a great question! I'm here to help with your writing. Can you tell me more about what you're working on? 😊"
};

function getFallbackResponse(userMessage) {
  const message = userMessage.toLowerCase();
  
  if (message.includes("introduction") || message.includes("opening") || message.includes("start")) {
    return fallbackResponses.introduction;
  } else if (message.includes("vocabulary") || message.includes("word") || message.includes("synonym")) {
    return fallbackResponses.vocabulary;
  } else if (message.includes("conclusion") || message.includes("ending") || message.includes("finish")) {
    return fallbackResponses.conclusion;
  } else if (message.includes("character") || message.includes("people")) {
    return fallbackResponses.characters;
  } else if (message.includes("hook") || message.includes("beginning")) {
    return fallbackResponses.hook;
  } else if (message.includes("hello") || message.includes("hi") || message.includes("hey")) {
    return fallbackResponses.greeting;
  } else {
    return fallbackResponses.general;
  }
}

exports.handler = async (event) => {
  // Handle CORS
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method Not Allowed" })
    };
  }

  try {
    // Parse request body
    let body;
    try {
      body = JSON.parse(event.body || "{}");
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Invalid JSON in request body" })
      };
    }

    const { userMessage, textType, currentContent, wordCount, context } = body;

    // Validate required fields
    if (!userMessage || typeof userMessage !== "string" || userMessage.trim().length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "User message is required" })
      };
    }

    console.log("Chat request received:", {
      messageLength: userMessage.length,
      textType: textType || "unknown",
      contentLength: currentContent?.length || 0,
      wordCount: wordCount || 0
    });

    // If OpenAI is not available, use fallback
    if (!client) {
      console.log("OpenAI not available, using fallback response");
      const fallbackResponse = getFallbackResponse(userMessage);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ response: fallbackResponse })
      };
    }

    // Create system prompt for the AI coach
    const systemPrompt = `You are an AI Writing Buddy for NSW Selective School exam preparation. You're helping a student aged 10-12 with their ${textType || "narrative"} writing.

PERSONALITY:
- Friendly, encouraging, and supportive
- Use emojis occasionally to be engaging (but not too many)
- Speak like a helpful friend, not a formal teacher
- Keep responses concise but helpful (2-3 sentences max)
- Always be positive and encouraging

FOCUS AREAS:
- NSW Selective writing criteria
- Story structure and plot development
- Character development and emotions
- Descriptive language and vocabulary
- Grammar and sentence structure
- Creative ideas and inspiration

CURRENT CONTEXT:
- Student is writing a ${textType || "narrative"} story
- Current word count: ${wordCount || 0}
- Writing stage: ${wordCount < 50 ? "just starting" : wordCount < 150 ? "developing ideas" : "refining and expanding"}

CURRENT CONTENT PREVIEW:
${(currentContent || "").slice(0, 200)}${(currentContent || "").length > 200 ? "..." : ""}

GUIDELINES:
- If they ask about specific words, suggest 2-3 alternatives
- If they ask about story structure, reference their current content
- If they ask for ideas, build on what they've already written
- Always encourage them and acknowledge their effort
- Give specific, actionable advice they can use right away

Respond to the student's question in a helpful, encouraging way.`;

    const userPrompt = `Student question: "${userMessage}"

Please provide a helpful, encouraging response that addresses their specific question.`;

    try {
      console.log("Making OpenAI API call...");
      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 200,
        temperature: 0.7
      });

      const response = completion.choices?.[0]?.message?.content?.trim();
      
      if (!response) {
        throw new Error("Empty response from OpenAI");
      }

      console.log("OpenAI response generated successfully");
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ response })
      };

    } catch (apiError) {
      console.error("OpenAI API call failed:", apiError);
      
      // Use fallback response on API error
      const fallbackResponse = getFallbackResponse(userMessage);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ response: fallbackResponse })
      };
    }

  } catch (error) {
    console.error("Chat response function error:", error);
    
    // Return a generic fallback response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        response: "I'm having trouble right now, but I'm here to help! Can you try asking your question again? 😊" 
      })
    };
  }
};