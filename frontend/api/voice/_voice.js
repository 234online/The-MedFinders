// =============================================================
//  VOICE on Vercel (ElevenLabs)
//
//  On your computer, `npm run dev` serves /api/voice through the Vite
//  plugin (server/chatProxy.js -> server/voiceProxy.js). Vercel only
//  hosts the built files, so these functions do the same job there:
//    api/voice/index.js -> GET  /api/voice      { enabled }
//    api/voice/tts.js   -> POST /api/voice/tts  text  -> MP3
//    api/voice/stt.js   -> POST /api/voice/stt  audio -> { text }
//  (This file starts with "_", so Vercel doesn't publish it on its own.)
//
//  Vercel -> Project -> Settings -> Environment Variables:
//    ELEVENLABS_API_KEY=...   (no VITE_ prefix: it must stay secret)
//    ELEVENLABS_VOICE_ID=...  (optional)
//  Redeploy after adding or changing them.
// =============================================================

import { voiceHandler } from "../../server/voiceProxy.js";

// voiceHandler expects the path after /api/voice ("/", "/tts", "/stt"),
// like it gets from the Vite dev server.
export function handleVoice(req, res, subPath) {
  const query = (req.url || "").includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
  req.url = subPath + query;
  return voiceHandler(req, res, process.env);
}
