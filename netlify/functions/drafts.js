/**
 * Netlify function: stub drafts endpoint (PUT to save).
 * Wire to your DB (e.g., Supabase) later; preserves API contract now.
 * Copy to: netlify/functions/drafts.js
 */
const mem = new Map(); // ephemeral — restarts will clear!

export async function handler(event) {
  try {
    const { httpMethod, queryStringParameters } = event;
    const id = queryStringParameters?.id || "default";
    if (httpMethod === "PUT") {
      const body = JSON.parse(event.body || "{}");
      mem.set(id, { ...body });
      return { statusCode: 200, body: JSON.stringify({ ok: true, version: body.version }) };
    }
    if (httpMethod === "GET") {
      const val = mem.get(id);
      return { statusCode: 200, body: JSON.stringify(val || null) };
    }
    return { statusCode: 405, body: "Method Not Allowed" };
  } catch (e) {
    return { statusCode: 500, body: (e && e.message) || "Internal Error" };
  }
}
