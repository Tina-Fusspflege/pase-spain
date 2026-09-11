"use client";

import { useEffect, useRef, useState } from "react";

type AppLanguage = "es" | "ca" | "en" | "de";

type VoiceTicketOffer = {
  id?: string;
  home: string;
  away: string;
  date: string;
  stadium: string;
  city: string;
  price: string;
  details?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  language: AppLanguage;
  offers: VoiceTicketOffer[];
  onSearchTickets: (query: string) => void;
};

type AssistantStatus = "idle" | "connecting" | "listening" | "speaking" | "error";

const uiText = {
  de: {
    title: "Amelia",
    assistant: "Deine PaseSpain Assistentin",
    start: "Gespräch starten",
    stop: "Gespräch beenden",
    connecting: "Verbindung wird aufgebaut …",
    listening: "Ich höre dir zu …",
    speaking: "Amelia antwortet …",
    idle: "Sprich mit Amelia.",
    error: "Amelia konnte nicht gestartet werden.",
    mic: "Mikrofon wird nur während des Gesprächs verwendet.",
    close: "Schließen",
    you: "Du",
  },
  en: {
    title: "Amelia",
    assistant: "Your PaseSpain Assistant",
    start: "Start conversation",
    stop: "End conversation",
    connecting: "Connecting …",
    listening: "I’m listening …",
    speaking: "Amelia is answering …",
    idle: "Talk to Amelia.",
    error: "Amelia could not be started.",
    mic: "The microphone is only used during the conversation.",
    close: "Close",
    you: "You",
  },
  ca: {
    title: "Amelia",
    assistant: "La teva assistent de PaseSpain",
    start: "Començar conversa",
    stop: "Finalitzar conversa",
    connecting: "Connectant …",
    listening: "T’escolto …",
    speaking: "Amelia està responent …",
    idle: "Parla amb Amelia.",
    error: "No s’ha pogut iniciar Amelia.",
    mic: "El micròfon només s’utilitza durant la conversa.",
    close: "Tancar",
    you: "Tu",
  },
  es: {
    title: "Amelia",
    assistant: "Tu asistente de PaseSpain",
    start: "Iniciar conversación",
    stop: "Finalizar conversación",
    connecting: "Conectando …",
    listening: "Te escucho …",
    speaking: "Amelia está respondiendo …",
    idle: "Habla con Amelia.",
    error: "No se ha podido iniciar Amelia.",
    mic: "El micrófono solo se utiliza durante la conversación.",
    close: "Cerrar",
    you: "Tú",
  },
} as const;

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function filterOffers(offers: VoiceTicketOffer[], query: string) {
  const stopWords = new Set([
    "vs", "v", "gegen", "contra", "against",
    "ticket", "tickets", "entrada", "entradas", "billet", "billets", "biglietto", "biglietti",
    "angebot", "angebote", "angeboten", "offer", "offers", "oferta", "ofertas",
    "pasespain", "aktuell", "aktuelle", "aktuellen", "verfügbar", "verfugbar", "disponible", "available",
    "zeigen", "zeige", "such", "suche", "finden", "finde", "present", "präsentieren", "prasentieren",
    "welche", "was", "gibt", "es", "hast", "habt",
    "fur", "für", "para", "for", "el", "la", "los", "las",
    "der", "die", "das", "the", "un", "una", "und", "and", "y", "i", "e", "a", "in", "im", "en",
  ]);

  const terms = normalize(query)
    .split(" ")
    .filter(term => term && !stopWords.has(term) && term.length > 1 && !/^\d+$/.test(term));

  // Bei einer allgemeinen Frage nach PaseSpain-Tickets:
  // die aktuell geladenen Angebote direkt zurückgeben.
  if (!terms.length) return offers.slice(0, 5);

  const scored = offers
    .map(offer => {
      const haystack = normalize([
        offer.home,
        offer.away,
        offer.city,
        offer.stadium,
        offer.date,
        offer.details || "",
      ].join(" "));

      const score = terms.reduce(
        (total, term) => total + (haystack.includes(term) ? 1 : 0),
        0
      );

      return { offer, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(item => item.offer);

  return scored;
}

export default function PaseSpainVoiceAssistant({
  open,
  onClose,
  language,
  offers,
  onSearchTickets,
}: Props) {
  const [status, setStatus] = useState<AssistantStatus>("idle");
  const [lastUserText, setLastUserText] = useState("");
  const [lastAssistantText, setLastAssistantText] = useState("");
  const [errorText, setErrorText] = useState("");

  const peerRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const channelRef = useRef<RTCDataChannel | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speechAbortRef = useRef<AbortController | null>(null);
  const speechUrlRef = useRef<string | null>(null);
  const lastSpokenTextRef = useRef("");
  const isMalenaSpeakingRef = useRef(false);
  const handledResponseIdsRef = useRef<Set<string>>(new Set());
  const malenaStartedAtRef = useRef(0);
  const localTicketReplyUntilRef = useRef(0);

  const text = uiText[language];

  function sendEvent(payload: unknown) {
    const channel = channelRef.current;
    if (!channel || channel.readyState !== "open") return;
    channel.send(JSON.stringify(payload));
  }

  function setMicrophoneEnabled(enabled: boolean) {
    streamRef.current?.getAudioTracks().forEach(track => {
      track.enabled = enabled;
    });
  }

  async function speakWithMalena(value: string) {
    const spokenText = value.trim();
    const audio = audioRef.current;
    if (!spokenText || !audio) return;

    // Genau eine laufende Malena-Ausgabe. Keine zweite TTS-Antwort darf
    // eine bereits sprechende Amelia unterbrechen oder ersetzen.
    if (isMalenaSpeakingRef.current) return;

    speechAbortRef.current?.abort();
    const controller = new AbortController();
    speechAbortRef.current = controller;

    if (speechUrlRef.current) {
      URL.revokeObjectURL(speechUrlRef.current);
      speechUrlRef.current = null;
    }

    try {
      setStatus("speaking");

      const response = await fetch("/api/assistant/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: spokenText }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const message = await response.text().catch(() => "");
        throw new Error(message || `Speech ${response.status}`);
      }

      const blob = await response.blob();
      if (controller.signal.aborted || !audioRef.current) return;

      const url = URL.createObjectURL(blob);
      speechUrlRef.current = url;

      // Erst unmittelbar vor dem tatsächlichen Abspielen wird das Mikrofon
      // stummgeschaltet. So bleibt Amelia während der TTS-Erzeugung hörbereit
      // und Browser-Audio wird nicht unnötig blockiert.
      audio.src = url;
      audio.preload = "auto";

      audio.onplay = () => {
        isMalenaSpeakingRef.current = true;
        malenaStartedAtRef.current = Date.now();
        setMicrophoneEnabled(true);
      };

      audio.onended = () => {
        if (speechUrlRef.current === url) {
          URL.revokeObjectURL(url);
          speechUrlRef.current = null;
        }
        isMalenaSpeakingRef.current = false;
        setMicrophoneEnabled(true);
        setStatus("listening");
      };

      audio.onerror = () => {
        isMalenaSpeakingRef.current = false;
        setMicrophoneEnabled(true);
        setStatus("error");
        setErrorText("Amelias Sprachausgabe konnte nicht abgespielt werden.");
      };

      await audio.play();
    } catch (error) {
      isMalenaSpeakingRef.current = false;
      setMicrophoneEnabled(true);
      if (!controller.signal.aborted) {
        setErrorText(error instanceof Error ? error.message : text.error);
        setStatus("error");
      }
    } finally {
      if (speechAbortRef.current === controller) {
        speechAbortRef.current = null;
      }
    }
  }

  function looksLikeTicketSearch(value: string) {
    const normalized = normalize(value);

    const ticketWords = [
      "ticket", "tickets", "entrada", "entradas", "angebot", "angebote",
      "offer", "offers", "oferta", "ofertas", "pasespain", "spiel", "partido",
      "gegen", "contra", "vs", "verfugbar", "verfügbar", "disponible", "available",
    ];

    if (ticketWords.some(word => normalized.includes(normalize(word)))) {
      return true;
    }

    return offers.some(offer => {
      const candidates = [offer.home, offer.away, offer.city, offer.stadium]
        .map(normalize)
        .filter(Boolean);

      return candidates.some(candidate =>
        candidate.length >= 4 && normalized.includes(candidate)
      );
    });
  }

  function formatOfferDate(value: string) {
    const parsed = new Date(value);
    if (!Number.isFinite(parsed.getTime())) return value;

    const locale =
      language === "de" ? "de-CH" :
      language === "en" ? "en-GB" :
      language === "ca" ? "ca-ES" :
      "es-ES";

    return new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(parsed);
  }

  function buildTicketPresentation(matches: VoiceTicketOffer[]) {
    if (!matches.length) {
      if (language === "de") return "Ich finde aktuell kein passendes PaseSpain-Angebot für diese Suche.";
      if (language === "en") return "I cannot find a matching current PaseSpain ticket offer for that search.";
      if (language === "ca") return "Ara mateix no trobo cap oferta actual de PaseSpain que coincideixi amb aquesta cerca.";
      return "Ahora mismo no encuentro una oferta actual de PaseSpain que coincida con esa búsqueda.";
    }

    const intro =
      language === "de"
        ? `Ich habe ${matches.length} aktuelle${matches.length === 1 ? "s" : ""} PaseSpain-Angebot${matches.length === 1 ? "" : "e"} gefunden.`
        : language === "en"
          ? `I found ${matches.length} current PaseSpain ticket offer${matches.length === 1 ? "" : "s"}.`
          : language === "ca"
            ? `He trobat ${matches.length} oferta${matches.length === 1 ? "" : "es"} actual${matches.length === 1 ? "" : "s"} de PaseSpain.`
            : `He encontrado ${matches.length} oferta${matches.length === 1 ? "" : "s"} actual${matches.length === 1 ? "" : "es"} de PaseSpain.`;

    const details = matches.slice(0, 3).map((offer, index) => {
      const date = formatOfferDate(offer.date);

      if (language === "de") {
        return `${index + 1}: ${offer.home} gegen ${offer.away}, ${date}, ${offer.stadium} in ${offer.city}, Preis ${offer.price}.`;
      }
      if (language === "en") {
        return `${index + 1}: ${offer.home} against ${offer.away}, ${date}, ${offer.stadium} in ${offer.city}, price ${offer.price}.`;
      }
      if (language === "ca") {
        return `${index + 1}: ${offer.home} contra ${offer.away}, ${date}, ${offer.stadium}, ${offer.city}, preu ${offer.price}.`;
      }
      return `${index + 1}: ${offer.home} contra ${offer.away}, ${date}, ${offer.stadium}, ${offer.city}, precio ${offer.price}.`;
    });

    return [intro, ...details].join(" ");
  }

  async function presentPaseSpainTickets(query: string) {
    const matches = filterOffers(offers, query);
    localTicketReplyUntilRef.current = Date.now() + 12000;

    const presentation = buildTicketPresentation(matches);
    setLastAssistantText(presentation);
    lastSpokenTextRef.current = presentation;
    await speakWithMalena(presentation);
  }

  async function handleToolCall(event: any) {
    const name = String(event?.name || "");
    const callId = String(event?.call_id || "");
    if (!callId) return;

    let args: Record<string, unknown> = {};
    try {
      args = JSON.parse(String(event?.arguments || "{}"));
    } catch {
      args = {};
    }

    if (name === "search_pasespain_tickets") {
      const query = String(args.query || "").trim();
      const matches = filterOffers(offers, query);
      if (query) onSearchTickets(query);

      sendEvent({
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: callId,
          output: JSON.stringify({
            query,
            count: matches.length,
            offers: matches.map(offer => ({
              id: offer.id || null,
              home: offer.home,
              away: offer.away,
              date: offer.date,
              stadium: offer.stadium,
              city: offer.city,
              price: offer.price,
              details: offer.details || null,
            })),
          }),
        },
      });
      if (Date.now() > localTicketReplyUntilRef.current) {
        sendEvent({ type: "response.create" });
      }
      return;
    }

    if (name === "get_live_spain_info") {
      const question = String(args.question || "").trim();
      let output = "No live information available.";
      try {
        const response = await fetch("/api/assistant/research", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question, language }),
        });
        const data = await response.json().catch(() => null) as { answer?: string; error?: string } | null;
        output = response.ok && data?.answer ? data.answer : (data?.error || output);
      } catch {
        output = "Live information is temporarily unavailable.";
      }

      sendEvent({
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: callId,
          output,
        },
      });
      sendEvent({ type: "response.create" });
    }
  }

  function extractAssistantTranscript(event: any) {
    if (event?.type !== "response.done") return "";

    const responseId = String(event?.response?.id || "").trim();
    if (responseId) {
      if (handledResponseIdsRef.current.has(responseId)) return "";
      handledResponseIdsRef.current.add(responseId);
      // Die Menge klein halten; sie dient nur der Doppelereignis-Sperre.
      if (handledResponseIdsRef.current.size > 40) {
        const first = handledResponseIdsRef.current.values().next().value;
        if (first) handledResponseIdsRef.current.delete(first);
      }
    }

    const output = Array.isArray(event?.response?.output)
      ? event.response.output
      : [];

    for (const item of output) {
      const content = Array.isArray(item?.content) ? item.content : [];
      for (const part of content) {
        const transcript = String(part?.transcript || part?.text || "").trim();
        if (transcript) return transcript;
      }
    }

    return "";
  }

  function speakAssistantTranscript(transcript: string) {
    const clean = transcript.trim();
    if (!clean || clean === lastSpokenTextRef.current) return;
    if (isMalenaSpeakingRef.current) return;
    lastSpokenTextRef.current = clean;
    setLastAssistantText(clean);
    void speakWithMalena(clean);
  }

  function handleRealtimeEvent(raw: string) {
    let event: any;
    try {
      event = JSON.parse(raw);
    } catch {
      return;
    }

    if (event.type === "input_audio_buffer.speech_started") {
      // Kurzer Schutz gegen das eigene Lautsprecher-Echo direkt beim Start von Malena.
      const justStarted =
        isMalenaSpeakingRef.current &&
        Date.now() - malenaStartedAtRef.current < 650;

      if (!justStarted) {
        speechAbortRef.current?.abort();
        speechAbortRef.current = null;

        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.removeAttribute("src");
          audioRef.current.load();
        }

        isMalenaSpeakingRef.current = false;

        if (speechUrlRef.current) {
          URL.revokeObjectURL(speechUrlRef.current);
          speechUrlRef.current = null;
        }

        setStatus("listening");
      }
    }

    if (event.type === "conversation.item.input_audio_transcription.completed") {
      const transcript = String(event.transcript || "").trim();

      if (transcript) {
        setLastUserText(transcript);

        if (looksLikeTicketSearch(transcript)) {
          void presentPaseSpainTickets(transcript);
        } else {
          localTicketReplyUntilRef.current = 0;
        }
      }
    }

    // Bei text-only Realtime kommt der fertige Text zuverlässig als output_text.done.
    if (
      event.type === "response.output_text.done" &&
      Date.now() > localTicketReplyUntilRef.current
    ) {
      const transcript = String(event.text || "").trim();
      if (transcript) speakAssistantTranscript(transcript);
    }

    const assistantTranscript = extractAssistantTranscript(event);
    if (
      assistantTranscript &&
      Date.now() > localTicketReplyUntilRef.current
    ) {
      speakAssistantTranscript(assistantTranscript);
    }

    if (event.type === "response.function_call_arguments.done") {
      void handleToolCall(event);
    }

    if (event.type === "error") {
      const message = String(event?.error?.message || text.error);
      setErrorText(message);
      setStatus("error");
    }
  }

  function stopAssistant() {
    channelRef.current?.close();
    channelRef.current = null;

    peerRef.current?.close();
    peerRef.current = null;

    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;

    speechAbortRef.current?.abort();
    speechAbortRef.current = null;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.srcObject = null;
      audioRef.current.removeAttribute("src");
      audioRef.current.load();
    }

    if (speechUrlRef.current) {
      URL.revokeObjectURL(speechUrlRef.current);
      speechUrlRef.current = null;
    }

    lastSpokenTextRef.current = "";
    isMalenaSpeakingRef.current = false;
    malenaStartedAtRef.current = 0;
    localTicketReplyUntilRef.current = 0;
    handledResponseIdsRef.current.clear();
    setStatus("idle");
  }

  async function startAssistant() {
    stopAssistant();
    setErrorText("");
    setLastUserText("");
    setLastAssistantText("");
    lastSpokenTextRef.current = "";
    handledResponseIdsRef.current.clear();
    isMalenaSpeakingRef.current = false;
    setStatus("connecting");

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = mediaStream;

      const pc = new RTCPeerConnection();
      peerRef.current = pc;

      // OpenAI Realtime bleibt für Mikrofon, Transkription, Dialoglogik und Tools aktiv.
      // Die Realtime-Audiospur wird absichtlich NICHT abgespielt; Amelia spricht über Malena/ElevenLabs.
      pc.ontrack = () => undefined;

      mediaStream.getTracks().forEach(track => pc.addTrack(track, mediaStream));

      const channel = pc.createDataChannel("oai-events");
      channelRef.current = channel;
      channel.onmessage = message => handleRealtimeEvent(String(message.data));
      channel.onopen = () => {
        setStatus("listening");
        sendEvent({
          type: "response.create",
          response: {
            instructions:
              "Greet the visitor briefly in the current conversation language. Introduce yourself as Amelia, the PaseSpain assistant. You can help with PaseSpain, tickets, Spanish football, stadiums and match-day travel. Do not give a long introduction.",
          },
        });
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const response = await fetch("/api/assistant/realtime", {
        method: "POST",
        headers: { "Content-Type": "application/sdp" },
        body: offer.sdp || "",
      });

      if (!response.ok) {
        const message = await response.text().catch(() => "");
        throw new Error(message || `Realtime ${response.status}`);
      }

      const answerSdp = await response.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });
    } catch (error) {
      stopAssistant();
      setStatus("error");
      setErrorText(error instanceof Error ? error.message : text.error);
    }
  }

  useEffect(() => {
    if (!open) stopAssistant();
    return () => stopAssistant();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const statusLabel =
    status === "connecting" ? text.connecting :
    status === "listening" ? text.listening :
    status === "speaking" ? text.speaking :
    status === "error" ? text.error :
    text.idle;

  return (
    <div className="ps-voice-backdrop" role="dialog" aria-modal="true" aria-label={text.title}>
      <div className="ps-voice-panel">
        <button
          className="ps-voice-close"
          type="button"
          onClick={() => {
            stopAssistant();
            onClose();
          }}
          aria-label={text.close}
          title={text.close}
        >
          ×
        </button>

        <div className={`ps-amelia-wrap ${status}`} aria-hidden="true">
          <div className="ps-amelia-image-wrap">
            <img src="/amelia-assistant.png" alt="" className="ps-amelia-face" />
          </div>
          <div className="ps-amelia-light" />
          <i /><i /><i />
        </div>

        <h2>{text.title}</h2>
        <p className="ps-voice-assistant-title">{text.assistant}</p>
        <p className={`ps-voice-status status-${status}`}>{statusLabel}</p>

        {lastUserText && (
          <div className="ps-voice-line ps-voice-user">
            <small>{text.you}</small>
            <span>{lastUserText}</span>
          </div>
        )}

        {lastAssistantText && (
          <div className="ps-voice-line ps-voice-assistant">
            <small>Amelia</small>
            <span>{lastAssistantText}</span>
          </div>
        )}

        {errorText && <p className="ps-voice-error">{errorText}</p>}

        <button
          type="button"
          className={`ps-voice-primary ${status === "listening" || status === "speaking" ? "active" : ""}`}
          disabled={status === "connecting"}
          onClick={() => {
            if (status === "listening" || status === "speaking") stopAssistant();
            else void startAssistant();
          }}
        >
          <span className="ps-primary-mic" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <rect x="8" y="3" width="8" height="12" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3M8.5 21h7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
          {status === "listening" || status === "speaking" ? text.stop : text.start}
        </button>

        <p className="ps-voice-privacy">{text.mic}</p>
        <audio ref={audioRef} autoPlay playsInline />
      </div>

      <style jsx>{`
        .ps-voice-backdrop {
          position: fixed;
          inset: 0;
          z-index: 200000;
          display: grid;
          place-items: center;
          padding: 18px;
          background: rgba(4, 14, 35, .50);
          backdrop-filter: blur(20px) saturate(1.18);
          -webkit-backdrop-filter: blur(20px) saturate(1.18);
        }
        .ps-voice-panel {
          position: relative;
          width: min(440px, 100%);
          max-height: min(760px, calc(100vh - 36px));
          overflow: auto;
          padding: 20px 24px 22px;
          border: 1px solid rgba(255,255,255,.78);
          border-radius: 30px;
          background: linear-gradient(145deg, rgba(255,255,255,.92), rgba(222,239,255,.76));
          box-shadow: 0 38px 100px rgba(0,12,42,.42), 0 12px 30px rgba(7,47,104,.18), inset 0 2px 0 rgba(255,255,255,.98), inset 0 -1px 0 rgba(25,70,135,.13);
          color: #10254c;
          text-align: center;
        }
        .ps-voice-close {
          position: absolute;
          z-index: 20;
          top: 12px;
          right: 14px;
          width: 39px;
          height: 39px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(14,46,94,.16);
          border-radius: 14px;
          background: rgba(255,255,255,.76);
          color: #17345f;
          font-size: 26px;
          line-height: 1;
          cursor: pointer;
        }
        .ps-amelia-wrap {
          position: relative;
          width: 210px;
          height: 210px;
          margin: 0 auto 12px;
          border-radius: 50%;
          isolation: isolate;
        }
        .ps-amelia-image-wrap {
          position: absolute;
          z-index: 3;
          inset: 5px;
          overflow: hidden;
          border-radius: 50%;
          border: 4px solid rgba(255,255,255,.96);
          background: #dbeafb;
          box-shadow: 0 25px 55px rgba(25,77,151,.38), 0 9px 22px rgba(11,33,74,.24), inset 0 2px 2px rgba(255,255,255,.96);
        }
        .ps-amelia-face {
          position: absolute;
          width: 440%;
          height: 440%;
          max-width: none;
          left: -187%;
          top: -69%;
          object-fit: cover;
          display: block;
          pointer-events: none;
          user-select: none;
        }
        .ps-amelia-light {
          position: absolute;
          z-index: 4;
          inset: 9px;
          pointer-events: none;
          border-radius: 50%;
          background: linear-gradient(145deg, rgba(255,255,255,.25), transparent 44%);
        }
        .ps-amelia-wrap i {
          position: absolute;
          z-index: 1;
          inset: -5px;
          border: 1px solid rgba(89,177,255,.35);
          border-radius: 50%;
          opacity: 0;
        }
        .ps-amelia-wrap.listening i,
        .ps-amelia-wrap.speaking i { animation: ameliaRing 1.8s ease-out infinite; }
        .ps-amelia-wrap i:nth-of-type(2) { animation-delay: .45s !important; }
        .ps-amelia-wrap i:nth-of-type(3) { animation-delay: .9s !important; }
        .ps-voice-panel h2 { margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -.6px; color: #10254c; }
        .ps-voice-assistant-title { margin: 3px 0 10px; color: rgba(16,37,76,.68); font-size: 14px; font-weight: 700; }
        .ps-voice-status {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 34px;
          margin: 0 0 13px;
          padding: 7px 15px;
          border: 1px solid rgba(41,87,150,.12);
          border-radius: 999px;
          background: rgba(255,255,255,.52);
          color: rgba(16,37,76,.78);
          font-size: 13px;
        }
        .status-listening::before,
        .status-speaking::before,
        .status-connecting::before {
          content: "";
          width: 7px;
          height: 7px;
          margin-right: 7px;
          border-radius: 50%;
          background: #378deb;
        }
        .ps-voice-line {
          margin: 9px 0;
          padding: 11px 13px;
          border: 1px solid rgba(28,76,139,.11);
          border-radius: 17px;
          background: rgba(255,255,255,.62);
          text-align: left;
        }
        .ps-voice-line small { display: block; margin-bottom: 3px; color: rgba(16,37,76,.55); font-weight: 800; }
        .ps-voice-line span { font-size: 14px; line-height: 1.4; }
        .ps-voice-assistant { background: rgba(208,235,255,.70); }
        .ps-voice-error { margin: 12px 0; color: #9e1d2d; font-size: 13px; }
        .ps-voice-primary {
          width: 100%;
          min-height: 52px;
          margin-top: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          border: 1px solid rgba(17,69,146,.22);
          border-radius: 18px;
          background: linear-gradient(135deg, #2569d4, #2ba9dc);
          color: white;
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 16px 30px rgba(29,102,207,.29), inset 0 1px 1px rgba(255,255,255,.48);
        }
        .ps-voice-primary.active { background: linear-gradient(135deg, #244c8e, #3673aa); }
        .ps-voice-primary:disabled { opacity: .55; cursor: wait; }
        .ps-primary-mic { width: 23px; height: 23px; display: grid; place-items: center; }
        .ps-primary-mic svg { width: 22px; height: 22px; }
        .ps-voice-privacy { margin: 11px 4px 0; color: rgba(16,37,76,.52); font-size: 11px; line-height: 1.4; }
        @keyframes ameliaRing {
          0% { opacity: .65; transform: scale(.92); }
          100% { opacity: 0; transform: scale(1.28); }
        }
        @media (max-width: 520px) {
          .ps-voice-backdrop { padding: 12px; }
          .ps-voice-panel { width: 100%; padding: 18px; border-radius: 26px; }
          .ps-amelia-wrap { width: 185px; height: 185px; }
          .ps-voice-panel h2 { font-size: 30px; }
        }
      `}</style>
    </div>
  );
}