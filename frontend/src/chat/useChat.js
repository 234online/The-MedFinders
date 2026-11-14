import { useEffect, useRef, useState } from "react";
import { getLanguage } from "../config/texts.js";
import { searchClinics } from "./chatTools.js";
import { localAnswer } from "./localAssistant.js";

// =============================================================
//  CHAT LOGIC
//  AI mode: sends the conversation to /api/chat (server/chatProxy.js).
//  When the AI asks to search, the search runs here and the result
//  goes back to the AI, until it writes its answer.
//  Simple mode: localAnswer() when there's no API key or an error.
//
//  Each shown message: { role: "user" | "assistant", text,
//    placeIds?, filters?, query?, total?, emergency?, local? }
// =============================================================

const MAX_TOOL_ROUNDS = 4;
const MAX_HISTORY = 24;

// Keep the history short, starting at a real user message
// (never at a tool result, which needs the call before it)
function trimHistory(history) {
  if (history.length <= MAX_HISTORY) return history;
  let start = history.length - MAX_HISTORY;
  while (start < history.length && typeof history[start].content !== "string") start++;
  return history.slice(start);
}

async function callApi(messages) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, lang: getLanguage() }),
  });
  if (!response.ok) throw new Error(`chat api ${response.status}`);
  return response.json();
}

export function useChat(places) {
  const [messages, setMessages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [aiAvailable, setAiAvailable] = useState(null); // null = checking
  const history = useRef([]); // conversation in the Claude API format

  // Is the AI set up on the server?
  useEffect(() => {
    fetch("/api/chat")
      .then((r) => (r.ok ? r.json() : { ai: false }))
      .then((d) => setAiAvailable(Boolean(d.ai)))
      .catch(() => setAiAvailable(false));
  }, []);

  function answerLocally(text) {
    const answer = localAnswer(text, places);
    return {
      role: "assistant",
      text: answer.text,
      local: true,
      emergency: answer.emergency,
      placeIds: answer.search?.placeIds,
      filters: answer.search?.filters,
      query: answer.search?.text,
      total: answer.search?.total,
    };
  }

  async function answerWithAi(text) {
    let convo = trimHistory([...history.current, { role: "user", content: text }]);
    let lastSearch = null;

    for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
      const result = await callApi(convo);
      convo = [...convo, { role: "assistant", content: result.content }];

      const calls = (result.content ?? []).filter((b) => b.type === "tool_use");
      if (result.stop_reason !== "tool_use" || calls.length === 0 || round === MAX_TOOL_ROUNDS) {
        history.current = convo;
        const reply = (result.content ?? [])
          .filter((b) => b.type === "text")
          .map((b) => b.text)
          .join("\n")
          .trim();
        return {
          role: "assistant",
          text: reply,
          placeIds: lastSearch?.placeIds,
          filters: lastSearch?.filters,
          query: lastSearch?.text,
          total: lastSearch?.total,
        };
      }

      // Run every search the AI asked for, send the results back
      const results = calls.map((call) => {
        if (call.name !== "search_clinics") {
          return { type: "tool_result", tool_use_id: call.id, content: "Unknown tool", is_error: true };
        }
        lastSearch = searchClinics(places, call.input);
        return { type: "tool_result", tool_use_id: call.id, content: JSON.stringify(lastSearch.forModel) };
      });
      convo = [...convo, { role: "user", content: results }];
    }
  }

  async function send(text) {
    const clean = text.trim();
    if (!clean || busy) return;
    setMessages((m) => [...m, { role: "user", text: clean }]);
    setBusy(true);

    let reply;
    if (aiAvailable) {
      try {
        reply = await answerWithAi(clean);
        if (!reply.text) throw new Error("empty answer");
      } catch (error) {
        console.warn("AI chat failed, using simple mode:", error);
        reply = { ...answerLocally(clean), aiFailed: true };
      }
    } else {
      reply = answerLocally(clean);
    }

    setMessages((m) => [...m, reply]);
    setBusy(false);
  }

  function reset() {
    history.current = [];
    setMessages([]);
  }

  return { messages, send, busy, aiAvailable, reset };
}
