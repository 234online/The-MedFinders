// =============================================================
//  CHAT on Vercel (serverless function, served at /api/chat)
//
//  On your computer, `npm run dev` serves /api/chat through the Vite
//  plugin in server/chatProxy.js. Vercel only hosts the built files,
//  so this function does the same job there, with the same code.
//
//  Vercel -> Project -> Settings -> Environment Variables:
//    ANTHROPIC_API_KEY=sk-ant-...   (no VITE_ prefix: it must stay secret)
//    CLAUDE_MODEL=claude-haiku-5-5  (optional)
//  Redeploy after adding or changing them.
// =============================================================

import { chatHandler } from "../server/chatProxy.js";

export default function handler(req, res) {
  return chatHandler(req, res, process.env);
}
