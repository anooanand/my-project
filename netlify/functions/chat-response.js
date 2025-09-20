// netlify/functions/chat-response.js
// FIXED VERSION - Handles undefined values and provides better error handling

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

// Enhanced fallback responses
const fallbackResponses = {
  greeting: "Hi there! I'm your AI Writing Buddy! 😊 I'm here to help you with your writing. What would you like to work on today?",
  introduction: "Great question about introductions! Try starting with an interesting question, a surprising fact, or jump right into the action. What's your story about?",
  vocabulary: "For better vocabulary, try replacing simple words with more descriptive ones. Instead of 'big', try 'enormous' or 'massive'. What word are you looking to improve?",
  conclusion: "For a strong conclusion, try to tie back to your opening or show how your character has changed. What's the main message of your story?",
  characters: "To make characters interesting, give them unique traits, fears, or goals. Show their personality through their actions and dialogue. Tell me about your character!",
  hook: "A good story hook grabs attention immediately! Try starting with dialogue, action, or an intriguing situation. What's the most exciting part of your story?",
  general: "That's a great question! I'm here to help with your writing. Can you tell me more about what you're working on? 😊",
  progress: "You're making great progress! Keep writing and let your creativity flow. What happens next in your story?",
  encouragement: "Great work so far! Your writing is developing nicely. What would you like to focus on next?"
};

// FIXED: Enhanced fallback function with proper null/undefined checks
function getEnhancedFallbackResponse(userMessage, currentContent, wordCount, textType) {
  // Safely handle undefined/null values
  const safeMessage = (userMessage || "").toLowerCase();
  const safeContent = currentContent || "";
  const safeWordCount = wordCount || 0;
  const safeTextType = textType || "narrative";
  const hasContent = safeContent.trim().length > 0;
  
  console.log("Generating fallback response for:", {
    messageLength: safeMessage.length,
    hasContent,
    wordCount: safeWordCount,
    textType: safeTextType
  });
  
  if (safeMessage.includes("introduction") || safeMessage.includes("opening") || safeMessage.includes("start")) {
    if (hasContent) {
      const preview = safeContent.slice(0, 30);
      return `I can see you've started with "${preview}..." That's a good beginning! Try adding more specific details to hook your reader. What happens next in your story? 😊`;
    } else {
      return "Great question about openings! Try starting with dialogue, action, or an interesting detail. For example: 'The door creaked open, revealing...' What's your story going to be about?";
    }
  } else if (safeMessage.includes("vocabulary") || safeMessage.includes("word") || safeMessage.includes("synonym")) {
    if (hasContent) {
      // Safely check for simple words
      const simpleWords = ['said', 'big', 'small', 'good', 'bad', 'nice', 'went', 'got'];
      const foundWord = simpleWords.find(word => safeContent.toLowerCase().includes(word));
      if (foundWord) {
        const suggestions = {
          'said': 'whispered, exclaimed, muttered',
          'big': 'enormous, massive, gigantic',
          'small': 'tiny, miniature, petite',
          'good': 'excellent, wonderful, fantastic',
          'bad': 'terrible, awful, dreadful',
          'nice': 'delightful, pleasant, charming',
          'went': 'rushed, strolled, wandered',
          'got': 'received, obtained, discovered'
        };
        return `I noticed you used "${foundWord}" in your writing. Try replacing it with: ${suggestions[foundWord]}. Which one fits your story best?`;
      }
    }
    return "For better vocabulary, try replacing simple words with more descriptive ones. Instead of 'big', try 'enormous' or 'massive'. What specific word would you like help with?";
  } else if (safeMessage.includes("character") || safeMessage.includes("people")) {
    if (hasContent && /\b(he|she|they|character|person|boy|girl|man|woman|i)\b/i.test(safeContent)) {
      return "I can see you have characters in your story! To make them more interesting, show their personality through their actions and words. What does your main character want or fear?";
    } else {
      return "To create interesting characters, give them unique traits, goals, and problems. What kind of character is in your story? Tell me about them! 😊";
    }
  } else if (safeMessage.includes("dialogue") || safeMessage.includes("talking") || safeMessage.includes("conversation")) {
    if (hasContent && /["']/.test(safeContent)) {
      return "I see you're already using dialogue - that's great! Remember to start a new line each time someone different speaks, and use action to show how they're feeling. What are your characters discussing?";
    } else if (hasContent) {
      return "Adding dialogue can make your story come alive! Try having your characters speak to each other. For example: 'Where are we going?' asked Sarah nervously. What might your characters say?";
    } else {
      return "Dialogue makes stories exciting! When characters talk, it shows their personality and moves the story forward. What conversation could happen in your story?";
    }
  } else if (safeMessage.includes("description") || safeMessage.includes("describe") || safeMessage.includes("details")) {
    if (hasContent) {
      return "Great question! Look at this part of your story and add more details. Instead of just saying what happened, describe how it looked, sounded, or felt. What details would help readers picture the scene?";
    } else {
      return "Description helps readers picture your story! Use your five senses - what does your character see, hear, smell, taste, or touch? Start with one scene and describe it in detail.";
    }
  } else if (safeMessage.includes("conclusion") || safeMessage.includes("ending") || safeMessage.includes("finish")) {
    if (hasContent && safeWordCount > 100) {
      return "For your ending, think about how your character has changed from the beginning. Look back at how you started - can you connect your ending to that opening? What's the main message of your story?";
    } else if (hasContent) {
      return "You're building a good story! For the ending, think about what your character learns or how they solve their problem. How do you want your reader to feel when they finish?";
    } else {
      return "For a strong conclusion, show how your character has changed or learned something. What's the most important thing that happens in your story?";
    }
  } else {
    if (hasContent) {
      const stage = safeWordCount < 50 ? "getting started" : safeWordCount < 150 ? "developing your ideas" : "expanding your story";
      return `I can see you're ${stage} with ${safeWordCount} words. That's great progress! What specific part would you like help with? 😊`;
    } else {
      return "I'm here to help with your writing! Start by telling me what you want to write about, or ask me about any part of writing you'd like help with. 😊";
    }
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
    // Parse request body with error handling
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

    // FIXED: Safely extract and validate parameters
    const userMessage = body.userMessage || "";
    const textType = body.textType || "narrative";
    const currentContent = body.currentContent || "";
    const wordCount = parseInt(body.wordCount) || 0;
    const context = body.context || "";

    console.log("Chat request received:", {
      hasUserMessage: !!userMessage,
      messageLength: userMessage.length,
      textType,
      contentLength: currentContent.length,
      wordCount,
      hasContext: !!context
    });

    // Validate required fields
    if (!userMessage || typeof userMessage !== "string" || userMessage.trim().length === 0) {
      console.log("No user message provided, using fallback");
      const fallbackResponse = getEnhancedFallbackResponse("", currentContent, wordCount, textType);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ response: fallbackResponse })
      };
    }

    // If OpenAI is not available, use enhanced fallback
    if (!client) {
      console.log("OpenAI not available, using enhanced fallback response");
      const fallbackResponse = getEnhancedFallbackResponse(userMessage, currentContent, wordCount, textType);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ response: fallbackResponse })
      };
    }

    // Create enhanced system prompt
    const systemPrompt = `You are an AI Writing Buddy for NSW Selective School exam preparation. You're helping a student aged 10-12 with their ${textType} writing.

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
- Student is writing a ${textType} story
- Current word count: ${wordCount}
- Writing stage: ${wordCount < 50 ? "just starting" : wordCount < 150 ? "developing ideas" : "refining and expanding"}

CURRENT CONTENT PREVIEW:
${currentContent.slice(0, 200)}${currentContent.length > 200 ? "..." : ""}

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
      
      // Use enhanced fallback response on API error
      const fallbackResponse = getEnhancedFallbackResponse(userMessage, currentContent, wordCount, textType);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ response: fallbackResponse })
      };
    }

  } catch (error) {
    console.error("Chat response function error:", error);
    
    // Return a safe fallback response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        response: "I'm having trouble right now, but I'm here to help! Can you try asking your question again? 😊" 
      })
    };
  }
};