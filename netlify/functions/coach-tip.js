// netlify/functions/coach-tip.js
// Returns one concise tip (+ optional example rewrite) for a paragraph (CommonJS)

const { OpenAI } = require("openai");
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }
    const { paragraph = "" } = JSON.parse(event.body || "{}");
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 300,
      messages: [{
        role: "user",
        content: [
          "You are a friendly NSW Year-6 writing coach. Return JSON with:",
          "{ tip: string, exampleRewrite?: string }",
          "Constraints:",
          "- One specific, actionable tip for this paragraph (<= 2 sentences).",
          "- Optional 1–2 sentence example rewrite, age-appropriate.",
          "",
          "Paragraph: ```" + paragraph + "```"
        ].join("\n")
      }]
    });
    const content = completion.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);
    if (!parsed || typeof parsed.tip !== "string") {
      return { statusCode: 502, body: "Invalid coach payload" };
    }
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed)
    };
  } catch (e) {
    return { statusCode: 500, body: e?.message || "Internal Error" };
  }
};
