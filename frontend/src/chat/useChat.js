import { useEffect, useRef, useState } from "react";
import { getLanguage } from "../config/texts.js";
import { searchClinics, getClinicDetails } from "./chatTools.js";
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

const MAX_TOOL_ROUNDS = 6;
const MAX_HISTORY = 30;
const OLD_RESULT_CHARS = 600; // tool results from earlier questions are shortened to this

// Shown if the AI found clinics but wrote no text (rare)
const RESULTS_ONLY = {
  ro: "Iată locațiile potrivite pe care le-am găsit:",
  en: "Here are the matching places I found:",
  hu: "Ezeket a megfelelő helyeket találtam:",
};

// After a question is answered, shorten its tool results: the AI already
// used them, and re-sending the full clinic data every time makes
// requests big, slow and expensive.
function shortenToolResults(history) {
  return history.map((m) =>
    Array.isArray(m.content) && m.content.some((b) => b.type === "tool_result")
      ? {
          ...m,
          content: m.content.map((b) =>
            b.type === "tool_result" && typeof b.content === "string" && b.content.length > OLD_RESULT_CHARS
              ? { ...b, content: b.content.slice(0, OLD_RESULT_CHARS) + "…(shortened)" }
              : b
          ),
        }
      : m
  );
}

// After a question is answered, drop the model's reasoning ("thinking") blocks.
// They're only needed while it's still working on that question, the API ignores
// old ones, and keeping them can make the API reject later requests.
function dropThinking(history) {
  return history.map((m) =>
    m.role === "assistant" && Array.isArray(m.content)
      ? { ...m, content: m.content.filter((b) => b.type !== "thinking" && b.type !== "redacted_thinking") }
      : m
  );
}

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
  if (!response.ok) {
    const info = await response.json().catch(() => ({}));
    throw new Error(`chat api ${response.status} ${info.error ?? ""} ${info.message ?? ""}`.trim());
  }
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
    let lastSearch = null; // the last search_clinics result (for "show on map")
    let detailIds = []; // clinics opened with get_clinic_details

    for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
      const result = await callApi(convo);
      convo = [...convo, { role: "assistant", content: result.content }];

      const calls = (result.content ?? []).filter((b) => b.type === "tool_use");
      if (result.stop_reason !== "tool_use" || calls.length === 0 || round === MAX_TOOL_ROUNDS) {
        history.current = dropThinking(shortenToolResults(convo));
        const reply = (result.content ?? [])
          .filter((b) => b.type === "text")
          .map((b) => b.text)
          .join("\n")
          .trim();
        // Cards: clinics it looked at in detail first, then the search results
        const placeIds = [...new Set([...detailIds, ...(lastSearch?.placeIds ?? [])])].slice(0, 8);
        if (!reply && placeIds.length === 0) throw new Error("empty answer");
        return {
          role: "assistant",
          // Found clinics but wrote no text (rare): still show the results
          text: reply || RESULTS_ONLY[getLanguage()] || RESULTS_ONLY.ro,
          placeIds,
          filters: lastSearch?.filters,
          query: lastSearch?.text,
          total: lastSearch?.total,
        };
      }

      // Run every search the AI asked for, send the results back
      const results = calls.map((call) => {
        if (call.name === "search_clinics") {
          lastSearch = searchClinics(places, call.input);
          return { type: "tool_result", tool_use_id: call.id, content: JSON.stringify(lastSearch.forModel) };
        }
        if (call.name === "get_clinic_details") {
          const details = getClinicDetails(places, call.input);
          detailIds = [...details.placeIds, ...detailIds];
          return { type: "tool_result", tool_use_id: call.id, content: JSON.stringify(details.forModel) };
        }
        return { type: "tool_result", tool_use_id: call.id, content: "Unknown tool", is_error: true };
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
