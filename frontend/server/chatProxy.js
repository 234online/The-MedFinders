// =============================================================
//  CHAT PROXY (runs on the dev server, never in the browser)
//
//  The browser sends the conversation to /api/chat; this file adds
//  the secret API key, the assistant's instructions and the
//  "search_clinics" tool, and forwards it to the Claude API.
//  The search itself runs in the browser (src/chat/chatTools.js),
//  on the same data the map uses.
//
//  Settings in the .env file (next to package.json):
//    ANTHROPIC_API_KEY=sk-ant-...        (required for the AI)
//    CLAUDE_MODEL=claude-haiku-5-5       (optional)
//  Without a key, GET /api/chat answers { ai: false } and the chat
//  uses its simple built-in mode instead.
// =============================================================

import { readFileSync } from "node:fs";

const API_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = "claude-haiku-5-5";
const MAX_BODY_BYTES = 100_000;
const MAX_MESSAGES = 40;

// Specialty names and place types, taken from the database export
const data = JSON.parse(readFileSync(new URL("../src/data/clinics.json", import.meta.url), "utf8"));
const SPECIALTY_NAMES = data.specialties.map((s) => s.name_ro);
const KINDS = [...new Set(data.clinics.map((c) => c.kind))];

const LANGUAGE_NAMES = { ro: "Romanian", en: "English", hu: "Hungarian" };

function systemPrompt(lang) {
  const now = new Date().toLocaleString("en-GB", {
    timeZone: "Europe/Bucharest",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return `You are the assistant of TimiCareNow, a website with a map of ${data.clinics.length} medical facilities (hospitals, clinics, laboratories, dental clinics, private practices) in Timișoara, Romania.

Your job: help people find the right medical facility in Timișoara.
- Always use the search_clinics tool to find facilities. Never invent clinics, phone numbers, addresses, doctors or opening hours: only mention what the tool returned.
- If someone describes symptoms, say which specialty usually handles that problem, then search for it. Do not diagnose, do not suggest medication or doses.
- Red-flag symptoms (chest pain or pressure, trouble breathing, signs of stroke, fainting, heavy bleeding, severe allergic reaction, thoughts of self-harm or suicide): tell them clearly to call 112 now, before anything else. You can then show emergency hospitals (emergency: true).
- For a sick child, search with for_children or the Pediatrie specialty.
- If they need care today, use open_now: true.
- Keep answers short and practical: 2–5 sentences, then the best 2–4 options (name, why it fits, open now or not, phone). The website shows clickable cards for every clinic the tool returned, so you don't need to list all of them.
- Remind people to confirm opening hours by phone when it matters.
- Only help with healthcare in Timișoara. Politely decline unrelated requests.
- Reply in ${LANGUAGE_NAMES[lang] ?? "the language the user writes in"}, unless the user clearly writes in another language; then use theirs.

Current date and time in Timișoara: ${now}.`;
}

const TOOLS = [
  {
    name: "search_clinics",
    description:
      "Search the TimiCareNow database of medical facilities in Timișoara. All filters are optional and combined with AND (specialties and types match ANY of the listed values). Returns up to 8 matching facilities, best rated first, plus the total number of matches.",
    input_schema: {
      type: "object",
      properties: {
        specialties: {
          type: "array",
          items: { type: "string", enum: SPECIALTY_NAMES },
          description: "Specialties (Romanian names, exactly as listed). A facility matches if it offers at least one.",
        },
        types: {
          type: "array",
          items: { type: "string", enum: KINDS },
          description: "Types of facility.",
        },
        open_now: { type: "boolean", description: "Only facilities open right now." },
        open_24h: { type: "boolean", description: "Only facilities open 24/7." },
        open_weekend: { type: "boolean", description: "Only facilities open on Saturday or Sunday." },
        emergency: { type: "boolean", description: "Only emergency hospitals." },
        for_children: { type: "boolean", description: "Only facilities with pediatric specialties." },
        text: {
          type: "string",
          description: "Free text matched against names, networks (e.g. MedLife, Regina Maria), doctors' names, addresses.",
        },
      },
    },
  },
];

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error("too_large"));
        req.destroy();
      } else chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

// Only text, tool_use and tool_result blocks are passed on
function cleanMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) return null;
  const allowed = new Set(["text", "tool_use", "tool_result"]);
  for (const m of messages) {
    if (m?.role !== "user" && m?.role !== "assistant") return null;
    if (typeof m.content === "string") continue;
    if (!Array.isArray(m.content) || !m.content.every((b) => allowed.has(b?.type))) return null;
  }
  return messages;
}

// Express/Connect-style handler: (req, res, env)
export async function chatHandler(req, res, env = process.env) {
  const apiKey = env.ANTHROPIC_API_KEY;

  if (req.method === "GET") return send(res, 200, { ai: Boolean(apiKey) });
  if (req.method !== "POST") return send(res, 405, { error: "method_not_allowed" });
  if (!apiKey) return send(res, 503, { error: "no_api_key" });

  let payload;
  try {
    payload = JSON.parse(await readBody(req));
  } catch {
    return send(res, 400, { error: "bad_request" });
  }

  const messages = cleanMessages(payload.messages);
  if (!messages) return send(res, 400, { error: "bad_messages" });

  try {
    const response = await fetch(env.ANTHROPIC_API_URL || API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: env.CLAUDE_MODEL || DEFAULT_MODEL,
        max_tokens: 1024,
        system: systemPrompt(payload.lang),
        tools: TOOLS,
        messages,
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      console.error("[chat] Claude API error:", response.status, result?.error?.message ?? result);
      return send(res, 502, { error: "api_error", status: response.status });
    }
    return send(res, 200, { content: result.content, stop_reason: result.stop_reason });
  } catch (error) {
    console.error("[chat] Could not reach the Claude API:", error.message);
    return send(res, 502, { error: "unreachable" });
  }
}

// Vite plugin: serves /api/chat during `npm run dev` and `npm run preview`
export function chatApiPlugin(env) {
    const mount = (server) => {
    server.middlewares.use("/api/chat", (req, res) => chatHandler(req, res, env));
  };
  return { name: "timicarenow-chat-api", configureServer: mount, configurePreviewServer: mount };
}
