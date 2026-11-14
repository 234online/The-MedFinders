import { useEffect, useRef, useState } from "react";
import { getLanguage } from "../config/texts.js";

// =============================================================
//  VOICE (ElevenLabs, through server/voiceProxy.js)
//  - speak(text):   reads an answer aloud
//  - startRecording() / stopRecording(): records the microphone and
//    returns the transcript of what was said
// =============================================================

// Texts for the voice buttons (kept here so texts.js doesn't need changes)
const VOICE_TEXTS = {
  ro: {
    mic: "Vorbește",
    stopMic: "Oprește înregistrarea",
    listening: "Te ascult… apasă din nou când ai terminat.",
    transcribing: "Transcriu…",
    play: "Ascultă răspunsul",
    stopPlay: "Oprește",
    autoOn: "Răspunsurile sunt citite cu voce tare",
    autoOff: "Citește răspunsurile cu voce tare",
    micDenied: "Nu am acces la microfon. Permite-l din bara browserului.",
    voiceError: "Vocea nu funcționează acum. Poți scrie mesajul.",
    nothingHeard: "Nu am auzit nimic. Mai încearcă o dată.",
  },
  en: {
    mic: "Speak",
    stopMic: "Stop recording",
    listening: "Listening… press again when you're done.",
    transcribing: "Transcribing…",
    play: "Listen to the answer",
    stopPlay: "Stop",
    autoOn: "Answers are read aloud",
    autoOff: "Read answers aloud",
    micDenied: "I can't access the microphone. Allow it in the browser bar.",
    voiceError: "Voice isn't working right now. You can type your message.",
    nothingHeard: "I didn't hear anything. Please try again.",
  },
  hu: {
    mic: "Beszéd",
    stopMic: "Felvétel leállítása",
    listening: "Hallgatlak… nyomd meg újra, ha befejezted.",
    transcribing: "Átírás…",
    play: "Válasz meghallgatása",
    stopPlay: "Leállítás",
    autoOn: "A válaszokat felolvassuk",
    autoOff: "Válaszok felolvasása",
    micDenied: "Nem érem el a mikrofont. Engedélyezd a böngésző sávjában.",
    voiceError: "A hang most nem működik. Írd be az üzenetet.",
    nothingHeard: "Nem hallottam semmit. Próbáld újra.",
  },
};

export function voiceText(key) {
  return (VOICE_TEXTS[getLanguage()] ?? VOICE_TEXTS.ro)[key];
}

export function useVoice() {
  const [enabled, setEnabled] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [speakingId, setSpeakingId] = useState(null); // which message is being read
  const [error, setError] = useState("");

  const recorder = useRef(null);
  const chunks = useRef([]);
  const audio = useRef(null);

  // Is ElevenLabs set up on the server, and can this browser record?
  useEffect(() => {
    const canRecord = typeof window !== "undefined" && !!navigator.mediaDevices?.getUserMedia && "MediaRecorder" in window;
    fetch("/api/voice")
      .then((r) => (r.ok ? r.json() : { enabled: false }))
      .then((d) => setEnabled(Boolean(d.enabled) && canRecord))
      .catch(() => setEnabled(false));
    return () => audio.current?.pause();
  }, []);

  function stopSpeaking() {
    audio.current?.pause();
    audio.current = null;
    setSpeakingId(null);
  }

  async function speak(text, id = "answer") {
    stopSpeaking();
    setError("");
    setSpeakingId(id);
    try {
      const response = await fetch("/api/voice/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!response.ok) throw new Error(`tts ${response.status}`);
      const url = URL.createObjectURL(await response.blob());
      const player = new Audio(url);
      audio.current = player;
      player.onended = () => {
        URL.revokeObjectURL(url);
        if (audio.current === player) stopSpeaking();
      };
      await player.play();
    } catch (e) {
      console.warn("Voice playback failed:", e);
      setError(voiceText("voiceError"));
      setSpeakingId(null);
    }
  }

  async function startRecording() {
    setError("");
    stopSpeaking();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunks.current = [];
      rec.ondataavailable = (e) => e.data.size > 0 && chunks.current.push(e.data);
      rec.start();
      recorder.current = rec;
      setRecording(true);
    } catch (e) {
      console.warn("Microphone not available:", e);
      setError(voiceText("micDenied"));
    }
  }

  // Stops recording and returns the transcript ("" if nothing was understood)
  function stopRecording() {
    const rec = recorder.current;
    if (!rec) return Promise.resolve("");
    return new Promise((resolve) => {
      rec.onstop = async () => {
        rec.stream.getTracks().forEach((t) => t.stop());
        recorder.current = null;
        setRecording(false);
        const blob = new Blob(chunks.current, { type: rec.mimeType || "audio/webm" });
        if (blob.size < 1000) {
          setError(voiceText("nothingHeard"));
          return resolve("");
        }
        setTranscribing(true);
        try {
          const response = await fetch("/api/voice/stt", {
            method: "POST",
            headers: { "Content-Type": blob.type },
            body: blob,
          });
          if (!response.ok) throw new Error(`stt ${response.status}`);
          const { text } = await response.json();
          if (!text) setError(voiceText("nothingHeard"));
          resolve(text || "");
        } catch (e) {
          console.warn("Transcription failed:", e);
          setError(voiceText("voiceError"));
          resolve("");
        } finally {
          setTranscribing(false);
        }
      };
      rec.stop();
    });
  }

  return { enabled, recording, transcribing, speakingId, error, speak, stopSpeaking, startRecording, stopRecording };
}
