// =============================================================
//  CHAT PROXY (runs on the dev server, never in the browser)
//
//  The browser sends the conversation to /api/chat; this file adds
//  the secret API key, the assistant's instructions and two tools
//  ("search_clinics" and "get_clinic_details"), and forwards it to
//  the AI: Google Gemini or Anthropic Claude. The tools run in the
//  browser (src/chat/chatTools.js), on the same data the map uses.
//
//  The browser always uses one conversation format (Claude's); for
//  Gemini this file translates it both ways, so the rest of the site
//  doesn't care which AI is used.
//
//  Settings in the .env file (next to package.json), one key is enough:
//    GEMINI_API_KEY=...                  (Google AI Studio key)
//    GEMINI_MODEL=gemini-flash-latest    (optional)
//    ANTHROPIC_API_KEY=sk-ant-...        (Claude key)
//    CLAUDE_MODEL=claude-sonnet-5-5      (optional)
//    AI_PROVIDER=gemini | claude         (optional: which one to use if
//                                         both keys are set; default gemini)
//  Without a key, GET /api/chat answers { ai: false } and the chat
//  uses its simple built-in mode instead.
// =============================================================

import { readFileSync } from "node:fs";
import { SYMPTOMS } from "../src/config/symptoms.js";

const CLAUDE_URL = "https://api.anthropic.com/v1/messages";
const CLAUDE_DEFAULT_MODEL = "claude-sonnet-5-5";
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const GEMINI_DEFAULT_MODEL = "gemini-flash-latest"; // Google's alias for the current Flash model
const MAX_OUTPUT_TOKENS = 4000; // thinking models count their reasoning in this too
const MAX_BODY_BYTES = 400_000; // the browser also shortens old tool results
const MAX_MESSAGES = 80;
const MAX_RETRIES = 2; // for "rate limited" / "overloaded" answers
const TIMEOUT_MS = 60_000;

// Specialty names and place types, taken from the database export
const data = JSON.parse(readFileSync(new URL("../src/data/clinics.json", import.meta.url), "utf8"));
const SPECIALTY_NAMES = data.specialties.map((s) => s.name_ro);
const KINDS = [...new Set(data.clinics.map((c) => c.kind))];

const LANGUAGE_NAMES = { ro: "Romanian", en: "English", hu: "Hungarian" };

// The site's symptom guide (src/config/symptoms.js), so the AI and the
// "Ce te doare?" guide recommend the same specialties and red flags
const LEVEL_NOTE = {
  emergency: " [RED FLAG: tell them to call 112 first]",
  urgent: " [see a doctor today: use open_now]",
  normal: "",
};
const SYMPTOM_GUIDE = SYMPTOMS.map(
  (s) => `- ${s.labels.en} (${s.labels.ro}) → ${s.specialties.join(", ")}${LEVEL_NOTE[s.level] ?? ""}`
).join("\n");

// IMPORTANT: the instructions must stay identical between the requests of one
// question. The model's "thinking" blocks are tied to them, and the API rejects
// a block if the instructions changed (e.g. a clock that ticks every minute).
// So only the DATE is here; the current TIME comes with every tool result.
function systemPrompt(lang) {
  const today = new Date().toLocaleDateString("en-GB", {
    timeZone: "Europe/Bucharest",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return `You are the assistant of TimiCareNow, a website with a map of ${data.clinics.length} medical facilities (hospitals, polyclinics, clinics, laboratories, imaging centres, dental clinics, private practices) in Timișoara, Romania.

Your job: help people find the right medical facility in Timișoara, quickly and safely.

## Tone
- Calm, friendly and to the point, like a helpful receptionist: polite and clear, but brief.
- Do NOT use sympathy or filler phrases such as "îmi pare rău", "ce neplăcut", "that's unfortunate", "I'm sorry to hear that", "sper să te simți mai bine", and no compliments. Go straight to useful information.
- Only if the person is clearly scared or panicking, you may add a few calm, neutral words (e.g. "Hai să găsim repede un loc potrivit.").
- Simple, everyday words; explain a medical term in a few words if you use one. No lists of possible diseases, nothing alarming without reason.
- For red flags stay calm and direct about calling 112, without dramatic language.
- Use the informal "tu" in Romanian (unless the user writes formally with "dumneavoastră"; then do the same).

## Rules
- Facts only from the tools. Use search_clinics to find facilities and get_clinic_details for full opening hours, doctors and their consultation days, ratings, email and website. Never invent clinics, phone numbers, addresses, doctors, prices or opening hours.
- Symptoms: say which specialty usually handles the problem (use the symptom guide and the combinations below), then search for it. When more than one specialty is reasonable, mention each one with a few words on when it fits, and include all of them in the search. Do not diagnose, do not name diseases as certain, do not suggest medication or doses.
- RED FLAGS (chest pain or pressure, trouble breathing, signs of stroke, fainting or seizures, heavy bleeding, severe allergic reaction, thoughts of self-harm or suicide, a baby or child who is very unwell, back pain with sudden leg weakness or loss of bladder/bowel control or numbness around the groin, a sudden "worst ever" headache): first sentence must calmly tell them to call 112 now. Then you may show emergency hospitals (emergency: true).
- Children: search with for_children or the Pediatrie specialty. At night, the children's emergency hospital is usually the right place.
- The current time in Timișoara is in every tool result ("current_time"); never guess the time.
- "Today", "now", "tonight", "right now": use open_now: true. Weekend questions: use open_weekend: true or check the full hours with get_clinic_details.
- Narrowing down (very important): unless it's a red flag, help in two steps.
  1. If you can already tell the likely specialties, give that first direction and a few options right away (don't make people wait).
  2. Then ask 1–2 short, specific follow-up questions that would change the recommendation, and refine your answer when they reply. Useful questions: where exactly it hurts and whether the pain spreads; since when; how strong it is (1–10); what makes it worse; numbness, tingling or weakness; fever; a recent fall or injury; adult or child; whether they need someone today.
  Ask at most 2 questions per message, short and plain (e.g. "Ca să te îndrum mai precis: durerea coboară pe picior? Simți amorțeli sau furnicături?").
  If a message is too vague to give any direction (e.g. just "mă doare" or "I feel sick"), skip step 1 and only ask. If they still don't know after answering, suggest a family doctor (Medicina familiei) or internal medicine.
- If a search returns nothing, relax one condition (e.g. drop open_now) and say so.
- Use at most 3 tool calls per answer, then write your answer.
- Answer once: don't restart, revise or correct your answer in the same message.
- Format: 2–5 short sentences, then the best 2–4 options as a short list: **name**, why it fits, open now or not, phone. The website shows clickable cards for every clinic you found, so don't list all of them.
- Remind people to confirm hours by phone when it matters (opening hours can change).
- Only help with healthcare in Timișoara. Politely decline anything else.
- Language: write your whole answer in the language of the user's LATEST message (Romanian, English or Hungarian). If you can't tell (e.g. only a name or a number), use ${LANGUAGE_NAMES[lang] ?? "Romanian"}, the language the website is set to. Use one language per answer, from the first word. Never comment on which language you use, and never repeat an answer in another language. The examples below are in Romanian only to show the behaviour: translate them.
- Never talk about the tools, the data or how you work: don't mention "listings", fields (like open_24h), "the database says", data inconsistencies, or your own reasoning. Just give the useful facts in plain words (e.g. "deschis 24 de ore astăzi").

## Symptom guide (specialty names exactly as in the database)
${SYMPTOM_GUIDE}

## Symptom combinations (check these, they change the advice)
- Back pain together with leg pain, pain that spreads down the leg, or numbness/tingling/weakness in a leg → Neurologie AND Ortopedie-Traumatologie (it can come from a nerve in the spine), plus Recuperare medicală / Kinetoterapie once the cause is known. Ask whether the pain spreads, and about numbness or weakness.
- Neck pain with arm pain, numbness or tingling in the arm or fingers → Neurologie AND Ortopedie-Traumatologie.
- Pain or swelling in several joints, morning stiffness → Reumatologie (plus Ortopedie-Traumatologie).
- A joint that hurts after a fall, twist or sports injury → Ortopedie-Traumatologie (today if it's swollen or can't bear weight).
- Headache with numbness, weakness, vision changes or confusion → red flag, 112. Repeated headaches without those → Neurologie.
- Dizziness with ear ringing or hearing loss → ORL AND Neurologie.
- Palpitations or shortness of breath on effort → Cardiologie (and Pneumologie if they also cough).
- Stomach pain with burning urination or back/side pain → also Urologie / Nefrologie.
- Tiredness, weight change, always thirsty → Endocrinologie / Diabet, nutriție și boli metabolice, after a blood test (Laborator analize medicale) and the family doctor.

## Examples of good behaviour
User: "Mă doare piciorul și spatele"
→ search_clinics({specialties: ["Neurologie", "Ortopedie-Traumatologie"]}) → answer, calm and kind:
"Când spatele și piciorul dor împreună, merită văzut atât un **neurolog** (uneori durerea vine de la un nerv din coloană), cât și un **ortoped**. Câteva variante: … Ca să te îndrum mai precis: durerea coboară pe picior, ca un „curent”? Simți amorțeli sau furnicături?"
(If they then mention sudden leg weakness or problems controlling the bladder: calmly tell them to call 112.)

User: "Mă doare genunchiul de o săptămână"
→ search_clinics({specialties: ["Ortopedie-Traumatologie", "Reumatologie"]}) → explain that an orthopaedist usually sees this (a rheumatologist if several joints hurt), give 2–3 options, then ask: "Te-ai lovit sau ai căzut? Genunchiul e umflat?"

User: "Copilul meu are 39 de grade și e 11 noaptea"
→ search_clinics({for_children: true, open_now: true}) → say that at night the children's emergency hospital is the right place, and that they should call 112 if the child is very drowsy, struggles to breathe, has a stiff neck or a rash that doesn't fade under pressure. Ask: "Câți ani are copilul?"

User: "Când consultă dr. Otiman?"
→ search_clinics({text: "Otiman"}) → get_clinic_details({ids: ["<id from the search>"]}) → answer with the clinic, consultation days and hours, and the phone number to book.

User: "Mă doare"
→ no tools yet; ask: "Unde te doare și de când? E vorba de tine sau de un copil?"

User: "Am o durere puternică în piept"
→ answer starts calmly and clearly: "Te rog sună acum la 112, durerea în piept trebuie verificată imediat." Then search_clinics({emergency: true}).

Today's date in Timișoara: ${today}.`;
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
  {
    name: "get_clinic_details",
    description:
      "Full details of up to 3 facilities found with search_clinics: opening hours for every day of the week (with notes such as lunch breaks), whether it is open now, all specialties, all doctors with their specialty and consultation schedule, public ratings, phone, email, website and a short description. Use it for questions about specific days, doctors, or when comparing a few clinics.",
    input_schema: {
      type: "object",
      properties: {
        ids: {
          type: "array",
          items: { type: "string" },
          maxItems: 3,
          description: "Facility ids, exactly as returned by search_clinics (the \"id\" field).",
        },
      },
      required: ["ids"],
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

// Checks the conversation sent by the browser.
// Returns { messages } or { problem: "why it was rejected" }.
// "thinking" / "redacted_thinking" are the model's own reasoning blocks:
// the API sends them and requires them back unchanged, so they're allowed.
const ALLOWED_BLOCKS = new Set(["text", "tool_use", "tool_result", "thinking", "redacted_thinking"]);

// Removes the model's reasoning blocks (used only for a retry, see below)
function withoutThinking(messages) {
  return messages.map((m) =>
    Array.isArray(m.content)
      ? { ...m, content: m.content.filter((b) => b.type !== "thinking" && b.type !== "redacted_thinking") }
      : m
  );
}

function checkMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0) return { problem: "no messages" };
  if (messages.length > MAX_MESSAGES) return { problem: `too many messages (${messages.length})` };
  for (const [i, m] of messages.entries()) {
    if (m?.role !== "user" && m?.role !== "assistant") return { problem: `message ${i} has role "${m?.role}"` };
    if (typeof m.content === "string") continue;
    if (!Array.isArray(m.content)) return { problem: `message ${i} has no content` };
    const bad = m.content.find((b) => !ALLOWED_BLOCKS.has(b?.type));
    if (bad) return { problem: `message ${i} contains a "${bad?.type}" block` };
  }
  return { messages };
}

// Which AI to use, from the .env settings
function pickProvider(env) {
  const wanted = (env.AI_PROVIDER || "").toLowerCase();
  if (wanted === "claude" && env.ANTHROPIC_API_KEY) return "claude";
  if (wanted === "gemini" && env.GEMINI_API_KEY) return "gemini";
  if (env.GEMINI_API_KEY) return "gemini";
  if (env.ANTHROPIC_API_KEY) return "claude";
  return null;
}

// ======================= CLAUDE =======================
// Returns { ok, content, stop_reason } or { ok: false, status, message }
async function callClaude(messages, system, env) {
  const response = await fetch(env.ANTHROPIC_API_URL || CLAUDE_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: env.CLAUDE_MODEL || CLAUDE_DEFAULT_MODEL,
      max_tokens: MAX_OUTPUT_TOKENS,
      system,
      tools: TOOLS,
      messages,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const result = await response.json().catch(() => ({}));
  if (response.ok) return { ok: true, content: result.content, stop_reason: result.stop_reason };
  return { ok: false, status: response.status, message: result?.error?.message ?? JSON.stringify(result) };
}

// ======================= GEMINI =======================
// Conversation (Claude format) -> Gemini "contents".
// Gemini's "thought signatures" are kept on our blocks as gemini_signature
// and must be sent back on the exact same part, or Gemini answers 400.
function toGeminiContents(messages) {
  const nameOfCall = {}; // tool_use id -> function name (Gemini wants the name back)
  for (const m of messages) {
    if (m.role === "assistant" && Array.isArray(m.content)) {
      for (const b of m.content) if (b.type === "tool_use") nameOfCall[b.id] = b.name;
    }
  }

  return messages
    .map((m) => {
      const role = m.role === "assistant" ? "model" : "user";
      if (typeof m.content === "string") return { role, parts: [{ text: m.content }] };

      const parts = [];
      for (const b of m.content) {
        const signature = b.gemini_signature ? { thoughtSignature: b.gemini_signature } : {};
        if (b.type === "text" && b.text) {
          parts.push({ text: b.text, ...signature });
        } else if (b.type === "tool_use") {
          const call = { name: b.name, args: b.input ?? {} };
          if (b.gemini_id) call.id = b.gemini_id;
          parts.push({ functionCall: call, ...signature });
        } else if (b.type === "tool_result") {
          let response;
          try {
            response = JSON.parse(b.content);
          } catch {
            response = { result: String(b.content) };
          }
          if (typeof response !== "object" || response === null || Array.isArray(response)) response = { result: response };
          const reply = { name: nameOfCall[b.tool_use_id] ?? "search_clinics", response };
          if (b.tool_use_id?.startsWith("gemini:")) reply.id = b.tool_use_id.slice("gemini:".length);
          parts.push({ functionResponse: reply });
        }
        // "thinking" blocks are Claude-only: skipped
      }
      return parts.length ? { role, parts } : null;
    })
    .filter(Boolean);
}

// Gemini answer -> blocks in the conversation format the browser uses
function fromGeminiParts(parts = []) {
  const content = [];
  let calls = 0;
  for (const part of parts) {
    if (part.thought) continue; // Gemini's visible thinking summary, not part of the answer
    const signature = part.thoughtSignature ? { gemini_signature: part.thoughtSignature } : {};
    if (part.functionCall) {
      calls++;
      const fc = part.functionCall;
      content.push({
        type: "tool_use",
        // keep Gemini's own call id if it gave one, so the reply can refer to it
        id: fc.id ? `gemini:${fc.id}` : `call_${Date.now()}_${calls}`,
        ...(fc.id ? { gemini_id: fc.id } : {}),
        name: fc.name,
        input: fc.args ?? {},
        ...signature,
      });
    } else if (typeof part.text === "string") {
      content.push({ type: "text", text: part.text, ...signature });
    }
  }
  return { content, stop_reason: calls > 0 ? "tool_use" : "end_turn" };
}

// Tool definitions in Gemini's format
const GEMINI_TOOLS = [
  {
    functionDeclarations: TOOLS.map((t) => ({
      name: t.name,
      description: t.description,
      parameters: t.input_schema,
    })),
  },
];

async function callGemini(messages, system, env) {
  const model = env.GEMINI_MODEL || GEMINI_DEFAULT_MODEL;
  const base = env.GEMINI_API_URL || GEMINI_BASE_URL;
  const response = await fetch(`${base}/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: toGeminiContents(messages),
      tools: GEMINI_TOOLS,
      generationConfig: { maxOutputTokens: MAX_OUTPUT_TOKENS },
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    return { ok: false, status: response.status, message: result?.error?.message ?? JSON.stringify(result) };
  }
  const candidate = result.candidates?.[0];
  if (!candidate?.content?.parts?.length) {
    // e.g. blocked by Google's safety filter, or an empty answer
    const reason = candidate?.finishReason || result.promptFeedback?.blockReason || "empty answer";
    return { ok: false, status: 200, message: `Gemini returned no answer (${reason})` };
  }
  return { ok: true, ...fromGeminiParts(candidate.content.parts) };
}

// ======================= HANDLER =======================
// Express/Connect-style handler: (req, res, env)
export async function chatHandler(req, res, env = process.env) {
  const provider = pickProvider(env);

  if (req.method === "GET") return send(res, 200, { ai: Boolean(provider), provider });
  if (req.method !== "POST") return send(res, 405, { error: "method_not_allowed" });
  if (!provider) return send(res, 503, { error: "no_api_key" });

  let payload;
  try {
    payload = JSON.parse(await readBody(req));
  } catch (error) {
    console.error(`[chat] Rejected request: ${error.message === "too_large" ? "conversation too long" : "invalid JSON"}`);
    return send(res, error.message === "too_large" ? 413 : 400, { error: error.message || "bad_request" });
  }

  const checked = checkMessages(payload.messages);
  if (checked.problem) {
    console.error(`[chat] Rejected request: ${checked.problem}`);
    return send(res, 400, { error: "bad_messages", message: checked.problem });
  }

  const system = systemPrompt(payload.lang);
  const call = provider === "gemini" ? callGemini : callClaude;
  const label = provider === "gemini" ? "Gemini" : "Claude";
  let messages = checked.messages;
  let thinkingRetried = false;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await call(messages, system, env);
      if (result.ok) return send(res, 200, { content: result.content, stop_reason: result.stop_reason });

      // Claude: a reasoning block it no longer accepts -> try once more without them
      if (provider === "claude" && result.status === 400 && !thinkingRetried && /thinking|signature/i.test(result.message)) {
        console.warn("[chat] The API refused an old reasoning block; retrying without reasoning blocks.");
        thinkingRetried = true;
        messages = withoutThinking(messages);
        attempt--; // doesn't count as one of the normal retries
        continue;
      }

      // 429 = too many requests, 5xx/529 = overloaded or temporary: wait and try again
      const retryable = result.status === 429 || result.status >= 500;
      if (retryable && attempt < MAX_RETRIES) {
        const waitSeconds = 2 * (attempt + 1);
        console.warn(`[chat] ${label} API ${result.status} (${result.message}). Retrying in ${waitSeconds}s…`);
        await new Promise((r) => setTimeout(r, waitSeconds * 1000));
        continue;
      }
      console.error(`[chat] ${label} API error ${result.status}: ${result.message}`);
      return send(res, 502, { error: "api_error", status: result.status, message: result.message });
    } catch (error) {
      if (attempt < MAX_RETRIES) {
        console.warn(`[chat] Could not reach the ${label} API (${error.message}). Retrying…`);
        continue;
      }
      console.error(`[chat] Could not reach the ${label} API:`, error.message);
      return send(res, 502, { error: "unreachable" });
    }
  }
}

// Vite plugin: serves /api/chat during `npm run dev` and `npm run preview`
export function chatApiPlugin(env) {
  // Must not return anything: Vite would treat a returned function as a "post" hook
  const mount = (server) => {
    server.middlewares.use("/api/chat", (req, res) => chatHandler(req, res, env));
  };
  return { name: "timicarenow-chat-api", configureServer: mount, configurePreviewServer: mount };
}
