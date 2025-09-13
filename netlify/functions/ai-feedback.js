// netlify/functions/ai-feedback.js
// Strict JSON NSW rubric feedback (CommonJS)
// Env: OPENAI_API_KEY

const { OpenAI } = require("openai");
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are an AI writing tutor for 10–12 year olds preparing for the NSW Selective test.\nReturn STRICT JSON matching the given schema. Include 0-indexed 'start' and 'end' offsets for all evidence and fixes.\nWeights: ideas=30, structure=25, language=25, spag=20. Criterion scores are 0–5. OverallScore 0–100.\nTone: positive, specific, concise.`;

function buildUserPrompt(body) {
  const essayText = (body && body.essayText) || "";
  const textType = (body && body.textType) || "narrative";
  return [
    `Text type: ${textType}`,
    "Essay text (triple backticks):",
    "```",
    essayText,
    "```",
    "",
    "Return JSON fields: overallScore, criteria (ideasContent, structureOrganization, languageVocab, spellingPunctuationGrammar),",
    "grammarCorrections[], vocabularyEnhancements[], narrativeStructure (if narrative), timings.modelLatencyMs, modelVersion, id.",
  ].join("\n");
}

// minimal validator to avoid UI crashes on drift
function isObj(o){return o && typeof o === "object";}
function isNum(n){return typeof n === "number" && !Number.isNaN(n);}
function isArr(a){return Array.isArray(a);}
function validatePayload(x){
  if (!isObj(x) || !isNum(x.overallScore) || !x.id) return false;
  const cs = x.criteria;
  if (!isObj(cs)) return false;
  for (const k of ["ideasContent","structureOrganization","languageVocab","spellingPunctuationGrammar"]) {
    const c = cs[k];
    if (!isObj(c) || !isNum(c.score) || !isNum(c.weight) || !isArr(c.strengths) || !isArr(c.improvements)) return false;
  }
  if (!isArr(x.grammarCorrections) || !isArr(x.vocabularyEnhancements)) return false;
  return true;
}

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST" ) {
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
    let parsed = {};
    try {
      parsed = JSON.parse(content);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", content, parseError);
      return { statusCode: 500, body: "AI response was not valid JSON" };
    }

    // Ensure all required fields are present, even if empty, to pass validation
    parsed.overallScore = parsed.overallScore || 0;
    parsed.criteria = parsed.criteria || {};
    parsed.criteria.ideasContent = parsed.criteria.ideasContent || { score: 0, weight: 0, strengths: [], improvements: [] };
    parsed.criteria.structureOrganization = parsed.criteria.structureOrganization || { score: 0, weight: 0, strengths: [], improvements: [] };
    parsed.criteria.languageVocab = parsed.criteria.languageVocab || { score: 0, weight: 0, strengths: [], improvements: [] };
    parsed.criteria.spellingPunctuationGrammar = parsed.criteria.spellingPunctuationGrammar || { score: 0, weight: 0, strengths: [], improvements: [] };
    parsed.grammarCorrections = parsed.grammarCorrections || [];
    parsed.vocabularyEnhancements = parsed.vocabularyEnhancements || [];
    parsed.id = parsed.id || `feedback-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    parsed.timings = parsed.timings || {};
    parsed.timings.modelLatencyMs = Date.now() - started;
    parsed.modelVersion = completion.model;
    

    if (!validatePayload(parsed)) {
      console.error("Validated payload failed:", parsed);
      return { statusCode: 502, body: "Invalid model payload after ensuring structure" };
    }
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed)
    };
  } catch (e) {
    console.error("Error in ai-feedback function:", e);
    return { statusCode: 500, body: e?.message || "Internal Error" };
  }
};
