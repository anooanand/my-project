// netlify/functions/drafts.js
// Autosave stub with in-memory store (CommonJS). Replace with DB later.

const mem = new Map();

exports.handler = async (event) => {
  try {
    const id = event.queryStringParameters?.id || "default";
    if (event.httpMethod === "PUT") {
      const body = JSON.parse(event.body || "{}");
      mem.set(id, { ...body });
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ok: true, version: body.version })
      };
    }
    if (event.httpMethod === "GET") {
      const val = mem.get(id) || null;
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(val)
      };
    }
    return { statusCode: 405, body: "Method Not Allowed" };
  } catch (e) {
    return { statusCode: 500, body: e?.message || "Internal Error" };
  }
};
