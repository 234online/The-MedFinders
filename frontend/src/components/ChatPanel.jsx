import { useEffect, useRef, useState } from "react";
import { TEXT } from "../config/texts.js";
import { getCategory } from "../config/placeTypes.js";
import { isOpenAt } from "../services/hoursLogic.js";
import { useChat } from "../chat/useChat.js";
import { useVoice, voiceText } from "../chat/useVoice.js";
import { ScoreBadge } from "./Stars.jsx";
import "./ChatPanel.css";
import "./VoiceControls.css";

// Turns the assistant's text into safe React elements:
// paragraphs, "- " bullet lists and **bold**. (No HTML is injected.)
function FormattedText({ text }) {
  const blocks = [];
  let list = null;
  text.split("\n").forEach((raw, i) => {
    const line = raw.trim();
    const bullet = line.match(/^([-*•]|\d+\.)\s+(.*)$/);
    if (bullet) {
      if (!list) {
        list = [];
        blocks.push({ type: "list", items: list, key: i });
      }
      list.push(bullet[2]);
    } else {
      list = null;
      if (line) blocks.push({ type: "p", text: line, key: i });
    }
  });

  const inline = (s) =>
    s.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : part
    );

  return blocks.map((b) =>
    b.type === "list" ? (
      <ul key={b.key}>
        {b.items.map((item, i) => (
          <li key={i}>{inline(item)}</li>
        ))}
      </ul>
    ) : (
      <p key={b.key}>{inline(b.text)}</p>
    )
  );
}

// Floating chat button + panel.
//   places         all places (with score)
//   onSelectPlace  (placeId) => fly to it on the map
//   onShowResults  ({ filters, text }) => open the map with this search
export default function ChatPanel({ places, onSelectPlace, onShowResults }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const { messages, send, busy, aiAvailable, reset } = useChat(places);
  const voice = useVoice();
  const [autoRead, setAutoRead] = useState(false); // read every answer aloud
  const askedByVoice = useRef(false); // last question was spoken -> read the answer
  const lastSpoken = useRef(-1);
  const endRef = useRef(null);
  const inputRef = useRef(null);
  const byId = (id) => places.find((p) => p.id === id);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
    if (!open) voice.stopSpeaking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Read a new answer aloud if the question was spoken, or if auto-read is on
  useEffect(() => {
    const i = messages.length - 1;
    const last = messages[i];
    if (!voice.enabled || !last || last.role !== "assistant" || i === lastSpoken.current) return;
    lastSpoken.current = i;
    if (askedByVoice.current || autoRead) voice.speak(last.text, i);
    askedByVoice.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  async function toggleMic() {
    if (voice.recording) {
      const text = await voice.stopRecording();
      if (text) {
        askedByVoice.current = true;
        send(text);
      }
    } else {
      voice.startRecording();
    }
  }

  function submit(e) {
    e?.preventDefault();
    if (!draft.trim()) return;
    send(draft);
    setDraft("");
  }

  return (
    <>
      <button
        type="button"
        className={"chat-fab" + (open ? " open" : "")}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={TEXT.chatButton}
      >
        {open ? "✕" : "💬"}
        {!open && <span className="chat-fab-label">{TEXT.chatButton}</span>}
      </button>

      {open && (
        <section className="chat-panel" aria-label={TEXT.chatTitle}>
          <header className="chat-header">
            <div>
              <strong>{TEXT.chatTitle}</strong>
              <small>{aiAvailable ? TEXT.chatAiNote : TEXT.chatLocalNote}</small>
            </div>
            <div className="chat-header-actions">
              {voice.enabled && (
                <button
                  type="button"
                  className={"chat-reset voice-auto" + (autoRead ? " on" : "")}
                  onClick={() => {
                    if (autoRead) voice.stopSpeaking();
                    setAutoRead((a) => !a);
                  }}
                  title={autoRead ? voiceText("autoOn") : voiceText("autoOff")}
                  aria-pressed={autoRead}
                >
                  {autoRead ? "🔊" : "🔈"}
                </button>
              )}
              {messages.length > 0 && (
                <button type="button" className="chat-reset" onClick={reset} title={TEXT.chatClear}>
                  ↺
                </button>
              )}
            </div>
          </header>

          <div className="chat-messages">
            <div className="chat-msg assistant">
              <p>{TEXT.chatWelcome}</p>
            </div>

            {messages.length === 0 && (
              <div className="chat-suggestions">
                {TEXT.chatSuggestions.map((s) => (
                  <button key={s} type="button" onClick={() => send(s)} disabled={busy}>
                    {s}
                  </button>
                ))}
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`chat-msg ${m.role}${m.emergency ? " emergency" : ""}`}>
                {m.role === "assistant" ? <FormattedText text={m.text} /> : <p>{m.text}</p>}

                {m.role === "assistant" && voice.enabled && (
                  <button
                    type="button"
                    className={"voice-play" + (voice.speakingId === i ? " playing" : "")}
                    onClick={() => (voice.speakingId === i ? voice.stopSpeaking() : voice.speak(m.text, i))}
                  >
                    {voice.speakingId === i ? `⏹ ${voiceText("stopPlay")}` : `🔊 ${voiceText("play")}`}
                  </button>
                )}

                {m.emergency && (
                  <a className="chat-112" href="tel:112">
                    📞 112
                  </a>
                )}

                {m.placeIds?.length > 0 && (
                  <div className="chat-cards">
                    {m.placeIds.map(byId).filter(Boolean).map((p) => {
                      const category = getCategory(p.category);
                      const openNow = isOpenAt(p.hours);
                      return (
                        <button key={p.id} type="button" className="chat-card" onClick={() => onSelectPlace(p.id)}>
                          <span className="chat-card-icon" style={{ background: category.color }}>
                            {category.icon}
                          </span>
                          <span className="chat-card-text">
                            <strong>{p.name}</strong>
                            <small>
                              {category.singular}
                              {openNow === true && <em className="chat-open"> · {TEXT.openNow}</em>}
                              {openNow === false && <em className="chat-closed"> · {TEXT.closedNow}</em>}
                            </small>
                          </span>
                          <ScoreBadge score={p.score} />
                        </button>
                      );
                    })}
                  </div>
                )}

                {m.total > 0 && (
                  <button
                    type="button"
                    className="chat-show-all"
                    onClick={() => onShowResults({ filters: m.filters ?? {}, text: m.query ?? "" })}
                  >
                    🗺️ {TEXT.chatShowAll(m.total)}
                  </button>
                )}

                {m.aiFailed && <small className="chat-note">{TEXT.chatError}</small>}
              </div>
            ))}

            {busy && (
              <div className="chat-msg assistant chat-typing">
                <span />
                <span />
                <span />
              </div>
            )}
            <div ref={endRef} />
          </div>

          {(voice.recording || voice.transcribing || voice.error) && (
            <p className={"voice-status" + (voice.error ? " error" : "")}>
              {voice.recording ? `🔴 ${voiceText("listening")}` : voice.transcribing ? voiceText("transcribing") : voice.error}
            </p>
          )}

          <form className="chat-input" onSubmit={submit}>
            {voice.enabled && (
              <button
                type="button"
                className={"voice-mic" + (voice.recording ? " recording" : "")}
                onClick={toggleMic}
                disabled={busy || voice.transcribing}
                aria-label={voice.recording ? voiceText("stopMic") : voiceText("mic")}
                title={voice.recording ? voiceText("stopMic") : voiceText("mic")}
              >
                {voice.recording ? "■" : "🎤"}
              </button>
            )}
            <input
              ref={inputRef}
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={TEXT.chatPlaceholder}
              maxLength={500}
            />
            <button type="submit" disabled={busy || !draft.trim()} aria-label={TEXT.chatSend}>
              ➤
            </button>
          </form>
          <p className="chat-disclaimer">{TEXT.chatDisclaimer}</p>
        </section>
      )}
    </>
  );
}
