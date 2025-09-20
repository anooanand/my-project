// netlify/functions/generate-prompt.js
// Function to generate writing prompts

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

// Fallback prompts for when AI is unavailable
const fallbackPrompts = {
  narrative: [
    "Write a story about a character who discovers a mysterious door in their school that leads to an unexpected place.",
    "Tell the story of a day when everything that could go wrong, did go wrong, but it led to something wonderful.",
    "Write about a character who finds an old diary and discovers it belongs to someone from 100 years ago.",
    "Create a story about a character who can hear what animals are thinking for one day.",
    "Write about a character who discovers they have a superpower, but it only works when they're helping others."
  ],
  persuasive: [
    "Should students be allowed to choose their own school subjects? Write a persuasive piece arguing your position.",
    "Convince your school principal to introduce a new subject that you think would benefit all students.",
    "Should mobile phones be allowed in schools? Present your argument with strong evidence.",
    "Persuade your community to adopt a new environmental initiative.",
    "Argue for or against the idea that homework should be banned on weekends."
  ],
  expository: [
    "Explain how social media has changed the way young people communicate and form friendships.",
    "Describe the process of how a book becomes a bestseller, from writing to publication.",
    "Explain why some people are naturally good at sports while others excel in academics.",
    "Describe how climate change affects different parts of the world.",
    "Explain the importance of preserving historical landmarks in your community."
  ],
  informative: [
    "Inform readers about an important historical event and its impact on today's world.",
    "Explain how renewable energy sources work and why they're important for the future.",
    "Describe the process of how movies are made, from script to screen.",
    "Inform your audience about a scientific discovery that changed the world.",
    "Explain how different cultures celebrate the same holiday in unique ways."
  ],
  creative: [
    "Write a piece that begins with: 'The last person on Earth sat alone in a room. There was a knock on the door...'",
    "Create a story told entirely through text messages between two characters.",
    "Write about a world where colors have personalities and can talk to humans.",
    "Imagine a day when gravity stops working for exactly one hour.",
    "Write about a character who can step into any photograph and experience that moment."
  ]
};

function getFallbackPrompt(textType, topic) {
  const type = (textType || "narrative").toLowerCase();
  const prompts = fallbackPrompts[type] || fallbackPrompts.narrative;
  const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
  
  if (topic && topic.trim()) {
    return `${randomPrompt} (Focus on: ${topic.trim()})`;
  }
  
  return randomPrompt;
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

    const textType = body.textType || "narrative";
    const topic = body.topic || "";

    console.log("Generate prompt request:", { textType, topic });

    // If OpenAI is not available, use fallback
    if (!client) {
      console.log("OpenAI not available, using fallback prompt");
      const prompt = getFallbackPrompt(textType, topic);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ prompt })
      };
    }

    try {
      // Create system prompt for generating writing prompts
      const systemPrompt = `You are a creative writing prompt generator for NSW Selective School exam preparation. Generate engaging, age-appropriate prompts for students aged 10-12.

REQUIREMENTS:
- Create prompts suitable for ${textType} writing
- Make them engaging and imaginative
- Ensure they're appropriate for NSW Selective School level
- Include specific details to spark creativity
- Keep prompts between 50-150 words
- Make them challenging but achievable

PROMPT STRUCTURE:
- Start with an engaging scenario
- Include specific details or constraints
- End with questions to guide thinking
- Encourage creativity and personal expression`;

      const userPrompt = topic && topic.trim() 
        ? `Generate a creative ${textType} writing prompt related to: ${topic.trim()}`
        : `Generate a creative ${textType} writing prompt`;

      console.log("Making OpenAI API call for prompt generation...");
      
      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 300,
        temperature: 0.8
      });

      const prompt = completion.choices?.[0]?.message?.content?.trim();
      
      if (!prompt) {
        throw new Error("Empty response from OpenAI");
      }

      console.log("Prompt generated successfully");
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ prompt })
      };

    } catch (apiError) {
      console.error("OpenAI API call failed:", apiError);
      
      // Use fallback prompt on API error
      const prompt = getFallbackPrompt(textType, topic);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ prompt })
      };
    }

  } catch (error) {
    console.error("Generate prompt function error:", error);
    
    // Return a safe fallback
    const prompt = getFallbackPrompt("narrative", "");
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ prompt })
    };
  }
};