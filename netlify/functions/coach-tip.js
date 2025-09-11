/**
 * Netlify function: returns a single concise tip and example rewrite for a paragraph.
 * Copy to: netlify/functions/coach-tip.js
 */
import OpenAI from "openai";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }
    const { paragraph = "" } = JSON.parse(event.body || "{}");
    const started = Date.now();
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
          "- Optional 1-2 sentence example rewrite, age-appropriate.",
          "",
          "Paragraph: ```" + paragraph + "```"
        ].join("\n")
      }]
    });
    const content = completion.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);
    parsed.latencyMs = Date.now() - started;
    if (!parsed || typeof parsed.tip !== "string") {
      return { statusCode: 502, body: "Invalid coach payload" };
    }
    return { statusCode: 200, body: JSON.stringify(parsed) };
  } catch (e) {
    return { statusCode: 500, body: (e && e.message) || "Internal Error" };
  }
}
