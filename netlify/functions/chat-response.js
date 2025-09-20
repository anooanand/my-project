// netlify/functions/chat-response.js
// Enhanced AI chat responses with contextual awareness and improved prompts

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

// Enhanced contextual analysis
function analyzeWritingContext(currentContent, textType, wordCount) {
  const analysis = {
    writingStage: 'initial',
    hasDialogue: false,
    hasDescription: false,
    hasCharacters: false,
    hasConflict: false,
    structureElements: [],
    vocabularyLevel: 'basic',
    sentenceVariety: 'simple',
    specificIssues: [],
    strengths: []
  };

  if (!currentContent || currentContent.trim().length === 0) {
    return analysis;
  }

  const text = currentContent.toLowerCase();
  
  // Determine writing stage
  if (wordCount < 30) {
    analysis.writingStage = 'beginning';
  } else if (wordCount < 100) {
    analysis.writingStage = 'developing';
  } else if (wordCount < 200) {
    analysis.writingStage = 'expanding';
  } else {
    analysis.writingStage = 'refining';
  }

  // Analyze content elements
  analysis.hasDialogue = /["']/.test(currentContent);
  analysis.hasDescription = /\b(beautiful|dark|bright|huge|tiny|mysterious|ancient|sparkling|glistening)\b/i.test(text);
  analysis.hasCharacters = /\b(he|she|they|character|person|boy|girl|man|woman)\b/i.test(text);
  analysis.hasConflict = /\b(problem|trouble|danger|scared|worried|conflict|challenge|difficult)\b/i.test(text);

  // Analyze structure elements for narrative
  if (textType === 'narrative') {
    if (/\b(once|long ago|one day|it was|there was)\b/i.test(text)) {
      analysis.structureElements.push('orientation');
    }
    if (/\b(but|however|suddenly|then|problem|trouble)\b/i.test(text)) {
      analysis.structureElements.push('complication');
    }
    if (/\b(finally|at last|in the end|resolved|solved)\b/i.test(text)) {
      analysis.structureElements.push('resolution');
    }
  }

  // Analyze vocabulary level
  const complexWords = currentContent.match(/\b\w{7,}\b/g) || [];
  if (complexWords.length > wordCount * 0.1) {
    analysis.vocabularyLevel = 'advanced';
  } else if (complexWords.length > wordCount * 0.05) {
    analysis.vocabularyLevel = 'intermediate';
  }

  // Analyze sentence variety
  const sentences = currentContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const hasComplexSentences = /\b(because|although|while|since|if|when|after|before)\b/i.test(text);
  const hasCompoundSentences = /\b(and|but|or|so|yet)\b/i.test(text);
  
  if (hasComplexSentences && hasCompoundSentences) {
    analysis.sentenceVariety = 'varied';
  } else if (hasComplexSentences || hasCompoundSentences) {
    analysis.sentenceVariety = 'developing';
  }

  // Identify specific issues
  if (wordCount > 50 && !analysis.hasDescription) {
    analysis.specificIssues.push('needs_more_description');
  }
  if (textType === 'narrative' && wordCount > 100 && !analysis.hasDialogue) {
    analysis.specificIssues.push('could_add_dialogue');
  }
  if (wordCount > 80 && !analysis.hasConflict && textType === 'narrative') {
    analysis.specificIssues.push('needs_conflict_or_problem');
  }

  // Identify strengths
  if (analysis.hasDialogue) analysis.strengths.push('good_dialogue_use');
  if (analysis.hasDescription) analysis.strengths.push('descriptive_language');
  if (analysis.vocabularyLevel !== 'basic') analysis.strengths.push('good_vocabulary');
  if (analysis.sentenceVariety !== 'simple') analysis.strengths.push('sentence_variety');

  return analysis;
}

// Enhanced prompt engineering
function createEnhancedSystemPrompt(textType, writingContext, userMessage) {
  const basePrompt = `You are an expert NSW Selective School writing coach helping a student aged 10-12. You provide specific, actionable feedback that directly references their writing.

STUDENT'S CURRENT WRITING ANALYSIS:
- Text Type: ${textType}
- Writing Stage: ${writingContext.writingStage}
- Word Count: ${writingContext.wordCount || 0}
- Has Dialogue: ${writingContext.hasDialogue ? 'Yes' : 'No'}
- Has Description: ${writingContext.hasDescription ? 'Yes' : 'No'}
- Has Characters: ${writingContext.hasCharacters ? 'Yes' : 'No'}
- Has Conflict/Problem: ${writingContext.hasConflict ? 'Yes' : 'No'}
- Vocabulary Level: ${writingContext.vocabularyLevel}
- Sentence Variety: ${writingContext.sentenceVariety}
- Structure Elements Present: ${writingContext.structureElements.join(', ') || 'None identified'}
- Strengths: ${writingContext.strengths.join(', ') || 'Building foundation'}
- Areas for Improvement: ${writingContext.specificIssues.join(', ') || 'Continue developing'}

COACHING GUIDELINES:
1. ALWAYS reference specific parts of their writing when giving advice
2. Be encouraging and acknowledge what they've done well first
3. Give ONE specific, actionable suggestion they can implement immediately
4. Use examples from their own text when possible
5. Keep responses to 2-3 sentences maximum
6. Use age-appropriate language and occasional emojis
7. Focus on NSW Selective criteria: Ideas & Content, Structure & Organization, Language & Vocabulary, Grammar & Mechanics

RESPONSE STRATEGY based on their question type:
- If asking about vocabulary: Suggest specific word replacements from their text
- If asking about structure: Reference their current story elements and suggest next steps
- If asking about characters: Build on characters they've already introduced
- If asking about plot: Suggest developments based on what they've written
- If asking general questions: Focus on their most immediate need based on analysis

Remember: Your goal is to help them improve their specific piece of writing, not give generic advice.`;

  return basePrompt;
}

function createContextualUserPrompt(userMessage, currentContent, writingContext) {
  let prompt = `STUDENT'S CURRENT WRITING:
"${currentContent || '[No content written yet]'}"

STUDENT'S QUESTION: "${userMessage}"

SPECIFIC CONTEXT FOR YOUR RESPONSE:`;

  // Add specific context based on writing analysis
  if (writingContext.writingStage === 'beginning' && currentContent) {
    prompt += `\n- The student has just started writing. Focus on encouraging them and helping them develop their opening.`;
  } else if (writingContext.writingStage === 'developing') {
    prompt += `\n- The student is developing their story. Help them expand on what they've already written.`;
  } else if (writingContext.writingStage === 'expanding') {
    prompt += `\n- The student has a good foundation. Help them add depth and detail to their existing content.`;
  } else if (writingContext.writingStage === 'refining') {
    prompt += `\n- The student has substantial content. Focus on improving specific elements and polishing their work.`;
  }

  // Add specific guidance based on what's missing
  if (writingContext.specificIssues.length > 0) {
    prompt += `\n- Consider addressing: ${writingContext.specificIssues.join(', ')}`;
  }

  // Add guidance based on strengths
  if (writingContext.strengths.length > 0) {
    prompt += `\n- Acknowledge these strengths: ${writingContext.strengths.join(', ')}`;
  }

  prompt += `\n\nProvide a specific, encouraging response that directly references their writing and gives them one clear action to take next.`;

  return prompt;
}

// Enhanced fallback responses with context awareness
function getContextualFallbackResponse(userMessage, writingContext, currentContent) {
  const message = userMessage.toLowerCase();
  const hasContent = currentContent && currentContent.trim().length > 0;
  
  if (message.includes("introduction") || message.includes("opening") || message.includes("start")) {
    if (hasContent) {
      return `I can see you've started with "${currentContent.slice(0, 30)}..." That's a good beginning! Try adding more specific details about the setting or character to hook your reader. What happens next in your story? 😊`;
    } else {
      return "Great question about openings! Try starting with dialogue, action, or an interesting detail. For example: 'The door creaked open, revealing...' What's your story going to be about?";
    }
  } else if (message.includes("vocabulary") || message.includes("word") || message.includes("synonym")) {
    if (hasContent) {
      // Try to find a simple word in their content to improve
      const simpleWords = ['said', 'big', 'small', 'good', 'bad', 'nice', 'went', 'got'];
      const foundWord = simpleWords.find(word => currentContent.toLowerCase().includes(word));
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
  } else if (message.includes("character") || message.includes("people")) {
    if (hasContent && writingContext.hasCharacters) {
      return "I can see you have characters in your story! To make them more interesting, show their personality through their actions and words. What does your main character want or fear?";
    } else {
      return "To create interesting characters, give them unique traits, goals, and problems. What kind of character is in your story? Tell me about them! 😊";
    }
  } else if (message.includes("conclusion") || message.includes("ending")) {
    if (hasContent && writingContext.wordCount > 100) {
      return "For your ending, think about how your character has changed from the beginning. Look back at how you started - can you connect your ending to that opening? What's the main message of your story?";
    } else {
      return "For a strong conclusion, show how your character has changed or learned something. What's the most important thing that happens in your story?";
    }
  } else {
    if (hasContent) {
      return `I can see you're working on your ${writingContext.writingStage} stage with ${writingContext.wordCount} words. That's great progress! What specific part would you like help with? 😊`;
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

    const { userMessage, textType = 'narrative', currentContent = '', wordCount = 0, context } = body;

    // Validate required fields
    if (!userMessage || typeof userMessage !== "string" || userMessage.trim().length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "User message is required" })
      };
    }

    console.log("Enhanced chat request received:", {
      messageLength: userMessage.length,
      textType,
      contentLength: currentContent.length,
      wordCount
    });

    // Analyze writing context
    const writingContext = analyzeWritingContext(currentContent, textType, wordCount);
    writingContext.wordCount = wordCount; // Ensure word count is included

    console.log("Writing context analysis:", writingContext);

    // If OpenAI is not available, use enhanced fallback
    if (!client) {
      console.log("OpenAI not available, using contextual fallback response");
      const fallbackResponse = getContextualFallbackResponse(userMessage, writingContext, currentContent);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ response: fallbackResponse })
      };
    }

    // Create enhanced prompts
    const systemPrompt = createEnhancedSystemPrompt(textType, writingContext, userMessage);
    const userPrompt = createContextualUserPrompt(userMessage, currentContent, writingContext);

    try {
      console.log("Making enhanced OpenAI API call...");
      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 250,
        temperature: 0.7
      });

      const response = completion.choices?.[0]?.message?.content?.trim();
      
      if (!response) {
        throw new Error("Empty response from OpenAI");
      }

      console.log("Enhanced OpenAI response generated successfully");
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          response,
          context: writingContext // Return context for frontend use
        })
      };

    } catch (apiError) {
      console.error("OpenAI API call failed:", apiError);
      
      // Use enhanced fallback response on API error
      const fallbackResponse = getContextualFallbackResponse(userMessage, writingContext, currentContent);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          response: fallbackResponse,
          context: writingContext
        })
      };
    }

  } catch (error) {
    console.error("Enhanced chat response function error:", error);
    
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
