// =============================================================
//  VOICE PROXY (ElevenLabs), runs on the dev server, never in the browser
//
//  GET  /api/voice       -> { enabled: true | false }
//  POST /api/voice/tts   { text }        -> MP3 audio of the text
//  POST /api/voice/stt   raw audio body  -> { text } (transcript)
//
//  Settings in the .env file (next to package.json):
//    ELEVENLABS_API_KEY=...                     (required for voice)
//    ELEVENLABS_VOICE_ID=JBFqnCBsd6RMkjVDRZzb   (optional: which voice;
//                                                find IDs in the ElevenLabs Voice Library)
//    ELEVENLABS_TTS_MODEL=eleven_multilingual_v2 (optional)
//    ELEVENLABS_STT_MODEL=scribe_v2              (optional)
// =============================================================

const API_BASE = "https://api.elevenlabs.io";
const DEFAULT_VOICE_ID = "JBFqnCBsd6RMkjVDRZzb"; // a default ElevenLabs voice
const DEFAULT_TTS_MODEL = "eleven_multilingual_v2"; // speaks many languages, incl. Romanian
const DEFAULT_STT_MODEL = "scribe_v2";
const MAX_TTS_CHARS = 2500; // keeps each answer cheap
const MAX_AUDIO_BYTES = 10_000_000; // ~10 MB of recorded audio
const TIMEOUT_MS = 30_000;

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function readRaw(req, limit) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error("too_large"));
        req.destroy();
      } else chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

// The AI writes **bold**, lists and emoji; a voice should read plain sentences
function toSpeakableText(text) {
  return String(text)
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/^\s*([-*•]|\d+\.)\s+/gm, "")
    .replace(/[#_`>]/g, "")
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "")
    .replace(/\n{2,}/g, ". ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_TTS_CHARS);
}

async function textToSpeech(req, res, env) {
  let payload;
  try {
    payload = JSON.parse((await readRaw(req, 50_000)).toString("utf8"));
  } catch {
    return sendJson(res, 400, { error: "bad_request" });
  }
  const text = toSpeakableText(payload.text ?? "");
  if (!text) return sendJson(res, 400, { error: "no_text" });

  const voiceId = env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE_ID;
  const base = env.ELEVENLABS_API_URL || API_BASE;
  const response = await fetch(`${base}/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": env.ELEVENLABS_API_KEY, "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({ text, model_id: env.ELEVENLABS_TTS_MODEL || DEFAULT_TTS_MODEL }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    console.error(`[voice] ElevenLabs text-to-speech error ${response.status}: ${message.slice(0, 300)}`);
    return sendJson(res, 502, { error: "tts_failed", status: response.status });
  }
  const audio = Buffer.from(await response.arrayBuffer());
  res.statusCode = 200;
  res.setHeader("Content-Type", "audio/mpeg");
  res.setHeader("Cache-Control", "no-store");
  res.end(audio);
}

async function speechToText(req, res, env) {
  let audio;
  try {
    audio = await readRaw(req, MAX_AUDIO_BYTES);
  } catch (error) {
    return sendJson(res, error.message === "too_large" ? 413 : 400, { error: "bad_audio" });
  }
  if (audio.length < 1000) return sendJson(res, 400, { error: "audio_too_short" });

  const type = (req.headers["content-type"] || "audio/webm").split(";")[0];
  const extension = type.includes("mp4") ? "mp4" : type.includes("ogg") ? "ogg" : type.includes("wav") ? "wav" : "webm";
  const form = new FormData();
  form.append("model_id", env.ELEVENLABS_STT_MODEL || DEFAULT_STT_MODEL);
  form.append("file", new Blob([audio], { type }), `question.${extension}`);

  const base = env.ELEVENLABS_API_URL || API_BASE;
  const response = await fetch(`${base}/v1/speech-to-text`, {
    method: "POST",
    headers: { "xi-api-key": env.ELEVENLABS_API_KEY },
    body: form,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = result?.detail?.message ?? result?.detail ?? JSON.stringify(result);
    console.error(`[voice] ElevenLabs speech-to-text error ${response.status}: ${String(message).slice(0, 300)}`);
    return sendJson(res, 502, { error: "stt_failed", status: response.status });
  }
  return sendJson(res, 200, { text: String(result.text ?? "").trim() });
}

// Connect-style handler mounted at /api/voice
export async function voiceHandler(req, res, env = process.env) {
  const enabled = Boolean(env.ELEVENLABS_API_KEY);
  const path = (req.url || "/").split("?")[0];

  if (req.method === "GET" && (path === "/" || path === "")) return sendJson(res, 200, { enabled });
  if (!enabled) return sendJson(res, 503, { error: "no_api_key" });
  if (req.method !== "POST") return sendJson(res, 405, { error: "method_not_allowed" });

  try {
    if (path === "/tts") return await textToSpeech(req, res, env);
    if (path === "/stt") return await speechToText(req, res, env);
    return sendJson(res, 404, { error: "not_found" });
  } catch (error) {
    console.error("[voice] Could not reach ElevenLabs:", error.message);
    return sendJson(res, 502, { error: "unreachable" });
  }
}
