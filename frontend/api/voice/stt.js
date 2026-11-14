// /api/voice/stt on Vercel: see _voice.js
import { handleVoice } from "./_voice.js";

export default function handler(req, res) {
  return handleVoice(req, res, "/stt");
}
