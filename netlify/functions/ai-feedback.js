/**
 * Netlify function: strict JSON NSW rubric feedback.
 * Requires env: OPENAI_API_KEY
 * Copy to: netlify/functions/ai-feedback.js
 */
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are an AI writing tutor for 10–12 year olds preparing for the NSW Selective test.
Return STRICT JSON matching the given schema. Include 0-indexed 'start' and 'end' character offsets for all evidence and fixes.
Weights: ideas=30, structure=25, language=25, spag=20. Criterion scores are 0–5. OverallScore 0–100.
Tone: positive, specific, concise.`;

function buildUserPrompt(body) {
  const { essayText = "", textType = "narrative" } = body || {};
  return [
    "Essay text (triple backticks):",
    "```",
    essayText,
    "```",
    "",
    "Return JSON fields: overallScore, criteria (ideasContent, structureOrganization, languageVocab, spellingPunctuationGrammar),",
    "grammarCorrections[], vocabularyEnhancements[], narrativeStructure (if narrative), timings.modelLatencyMs, modelVersion, id.",
  ].join("\n");
}

// Minimal runtime guard (avoid external libs in the function)
function isObj(o) { return o && typeof o === "object"; }
function isNum(n) { return typeof n === "number" && !Number.isNaN(n); }
function isStr(s) { return typeof s === "string"; }
function isArr(a) { return Array.isArray(a); }

function validatePayload(x) {
  if (!isObj(x) || !isNum(x.overallScore) || !isStr(x.id)) return false;
  const cs = x.criteria;
  if (!isObj(cs)) return false;
  const req = ["ideasContent","structureOrganization","languageVocab","spellingPunctuationGrammar"];
  for (const k of req) {
    const c = cs[k];
    if (!isObj(c) || !isNum(c.score) || !isNum(c.weight)) return false;
    if (!isArr(c.strengths) || !isArr(c.improvements)) return false;
  }
  if (!isArr(x.grammarCorrections) || !isArr(x.vocabularyEnhancements)) return false;
  return true;
}

export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }
    const body = JSON.parse(event.body || "{}");
    const started = Date.now();
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 1800,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(body) }
      ]
    });
    const content = completion.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);
    parsed.timings = parsed.timings || {};
    parsed.timings.modelLatencyMs = Date.now() - started;
    parsed.modelVersion = completion.model;
    if (!validatePayload(parsed)) {
      return { statusCode: 502, body: "Invalid model payload" };
    }
    return { statusCode: 200, body: JSON.stringify(parsed) };
  } catch (e) {
    return { statusCode: 500, body: (e && e.message) || "Internal Error" };
  }
}
