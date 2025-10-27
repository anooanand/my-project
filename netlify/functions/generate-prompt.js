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

// Helper function for random selection
const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];

// --- NSW Selective Test Thematic Lists for High Randomization ---
// These lists ensure a wide variety of high-quality, relevant prompts across different types.

const narrativeThemes = [
  "A mysterious discovery in a familiar place (e.g., school, library, backyard)",
  "A time-traveling object or event that changes history",
  "A character with a secret or unusual ability (e.g., talking to animals, seeing the future)",
  "An unexpected encounter with a magical creature or talking animal",
  "A journey to a hidden or forgotten world (e.g., under the ocean, inside a computer)",
  "A challenge or competition with high stakes (e.g., a race, a survival test)",
  "A story about friendship and loyalty in a difficult situation",
  "An adventure that begins with a strange message or phone call",
  "The last person on Earth finds a sign of life",
  "A character who can step into any photograph and experience that moment"
];

const persuasiveThemes = [
  "Should school uniforms be compulsory?",
  "Should homework be banned on weekends?",
  "Should all students learn a second language?",
  "Should mobile phones be allowed in primary and high schools?",
  "Is it better to read books or watch movies based on them?",
  "Should pets be allowed in the classroom as learning aids?",
  "Should the school day start later?",
  "Convince your principal to introduce a new subject or club.",
  "Argue for or against the idea that artificial intelligence should be used in schools."
];

const expositoryThemes = [
  "Explain the impact of social media on teenage friendships.",
  "Describe the process of how a book becomes a bestseller, from writing to publication.",
  "Explain why some people are naturally good at sports while others excel in academics.",
  "How does climate change affect the Australian environment?",
  "Explain the importance of preserving historical landmarks in your community.",
  "Describe the life cycle of a star or a complex natural phenomenon.",
  "Explain how a democracy works and the importance of voting.",
  "Describe the process of making a video game, from concept to release."
];

// --- New Randomization Lists for NSW Alignment ---

const stimulusTypes = [
  "Visual Description (e.g., a strange object, a unique landscape)",
  "Thought-Provoking Quote (e.g., 'The only way to have a friend is to be one.')",
  "Scenario-Based Situation (e.g., 'Imagine you have been chosen to...')",
  "A Single, Intriguing Question"
];

const narrativeFormats = [
  "Short Story",
  "Diary Entry",
  "Fable/Allegory",
  "Recount (of an imagined event)"
];

const persuasiveFormats = [
  "Letter to the Editor",
  "Speech to the School Assembly",
  "Formal Essay",
  "Open Letter to a Local Council Member"
];

const literaryDevices = [
  "Foreshadowing",
  "Strong Metaphor and Simile",
  "Show, Don't Tell",
  "Flashback",
  "Personification"
];

// Fallback prompts for when AI is unavailable (using themes as fallback text)
const fallbackPrompts = {
  narrative: narrativeThemes,
  persuasive: persuasiveThemes,
  expository: expositoryThemes,
  informative: expositoryThemes, 
  creative: narrativeThemes 
};

function getFallbackPrompt(textType, topic) {
  const type = (textType || "narrative").toLowerCase();
  const prompts = fallbackPrompts[type] || fallbackPrompts.narrative;
  const randomPrompt = randomChoice(prompts);
  
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
      // --- Dynamic Theme Selection and System Prompt Construction ---
      let selectedTheme = "";
      let genreConstraint = "";
      let literarySuggestion = "";
      const type = textType.toLowerCase();
      
      // 1. Select Theme
      if (type === 'narrative' || type === 'creative') {
        selectedTheme = randomChoice(narrativeThemes);
        genreConstraint = randomChoice(narrativeFormats);
        literarySuggestion = randomChoice(literaryDevices);
      } else if (type === 'persuasive') {
        selectedTheme = randomChoice(persuasiveThemes);
        genreConstraint = randomChoice(persuasiveFormats);
      } else if (type === 'expository' || type === 'informative') {
        selectedTheme = randomChoice(expositoryThemes);
      }
      
      const themeInstruction = selectedTheme 
        ? `The prompt MUST be based on the following randomly selected theme/topic: "${selectedTheme}".`
        : `Generate a prompt that is highly original and engaging.`;

      const stimulusInstruction = `The prompt MUST start with a stimulus element of the type: **${randomChoice(stimulusTypes)}**.`;
      
      const constraintInstruction = genreConstraint 
        ? `The student must write a **${genreConstraint}** (a specific format constraint).`
        : `The student must write a piece suitable for a high-level selective school assessment.`;

      const techniqueInstruction = literarySuggestion 
        ? `The prompt should explicitly encourage the student to use the literary technique: **${literarySuggestion}** to enhance their writing quality.`
        : '';

      // Create system prompt for generating writing prompts
      const systemPrompt = `You are a creative writing prompt generator for NSW Selective School exam preparation. Generate engaging, age-appropriate prompts for students aged 10-12.

${themeInstruction}
${stimulusInstruction}
${constraintInstruction}
${techniqueInstruction}

REQUIREMENTS for ${textType.toUpperCase()} Writing:
- Create a prompt suitable for ${textType} writing.
- Ensure the prompt is highly original, imaginative, and appropriate for NSW Selective School level.
- Include specific details and constraints to guide the student's writing.
- Keep the final prompt text between 100-250 words for maximum detail.
- Make it challenging but achievable for a selective school candidate.

PROMPT STRUCTURE:
- Start with the randomized stimulus element.
- Clearly state the writing task and format (if applicable).
- Include 2-3 specific questions or instructions to guide the student's thinking and structure (e.g., "What happens next?", "How would you address the counter-argument?").
- The tone must be formal and align with official NSW test language.`;

      const userPrompt = topic && topic.trim() 
        ? `Generate a creative ${textType} writing prompt related to: ${topic.trim()}`
        : `Generate a creative ${textType} writing prompt`;

      console.log("Making OpenAI API call for prompt generation...");
      
      const completion = await client.chat.completions.create({
        model: "gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 400, 
        temperature: 0.9 
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
      console.log("Using fallback prompt due to API error.");
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