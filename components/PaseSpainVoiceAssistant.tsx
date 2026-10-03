"use client";

import { useEffect, useRef, useState } from "react";
import { ConversationProvider, useConversation, useConversationClientTool } from "@elevenlabs/react";

type AppLanguage = "es" | "ca" | "en" | "de";

type VoiceTicketOffer = {
  id?: string;
  home: string;
  away: string;
  date: string;
  stadium: string;
  city: string;
  price: string;
  unitPrice?: number;
  ticketCount?: number;
  childTickets?: number;
  details?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  language: AppLanguage;
  offers: VoiceTicketOffer[];
  onSearchTickets: (query: string) => void;
  onAddToCart: (offer: VoiceTicketOffer) => { added: boolean; message: string };
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

const AMELIA_AGENT_ID = "agent_3801m2ht749zewtazawfm5tg66xd";

export default function PaseSpainVoiceAssistant(props: Props) {
  return (
    <ConversationProvider>
      <PaseSpainVoiceAssistantInner {...props} />
    </ConversationProvider>
  );
}

function PaseSpainVoiceAssistantInner({
  open,
  onClose,
  language,
  offers,
  onSearchTickets,
  onAddToCart,
}: Props) {
  const [lastUserText, setLastUserText] = useState("");
  const [lastAssistantText, setLastAssistantText] = useState("");
  const [errorText, setErrorText] = useState("");

  const text = uiText[language];

  const conversation = useConversation({
    onMessage: (message: any) => {
      const source = String(message?.source || "").toLowerCase();
      const value = String(message?.message || "").trim();
      if (!value) return;

      if (source === "user") {
        setLastUserText(value);
      } else if (source === "ai" || source === "agent") {
        setLastAssistantText(value);
      }
    },
    onError: (error: any) => {
      const message =
        typeof error === "string"
          ? error
          : error instanceof Error
            ? error.message
            : String(error?.message || text.error);

      setErrorText(message);
    },
  });

  useConversationClientTool(
    "search_pasespain_tickets",
    (parameters: Record<string, unknown>) => {
      const query = String(parameters.query || "");
      const cleanQuery = String(query || "").trim();
      const matches = filterOffers(offers, cleanQuery);

      if (cleanQuery) {
        onSearchTickets(cleanQuery);
      }

      return JSON.stringify({
        query: cleanQuery,
        count: matches.length,
        offers: matches.map(offer => ({
          id: offer.id || null,
          home: offer.home,
          away: offer.away,
          date: offer.date,
          stadium: offer.stadium,
          city: offer.city,
          price: offer.price,
          unitPrice: offer.unitPrice ?? null,
          ticketCount: offer.ticketCount ?? null,
          childTickets: offer.childTickets ?? null,
          details: offer.details || null,
        })),
      });
    }
  );

  useConversationClientTool(
    "add_pasespain_ticket_to_cart",
    (parameters: Record<string, unknown>) => {
      const offerId = String(parameters.offerId || parameters.id || "").trim();
      const home = String(parameters.home || "").trim();
      const away = String(parameters.away || "").trim();

      const offer = offers.find(item =>
        (offerId && item.id === offerId) ||
        (home && away && normalize(item.home) === normalize(home) && normalize(item.away) === normalize(away))
      );

      if (!offer) {
        return JSON.stringify({
          added: false,
          message: "Das gewünschte Ticket wurde nicht gefunden. Bitte zuerst die PaseSpain-Tickets suchen."
        });
      }

      const result = onAddToCart(offer);
      return JSON.stringify(result);
    }
  );

  useConversationClientTool(
    "get_live_spain_info",
    async (parameters: Record<string, unknown>) => {
      const question = String(parameters.question || "");
      const cleanQuestion = String(question || "").trim();
      if (!cleanQuestion) return "No question provided.";

      try {
        const response = await fetch("/api/assistant/research", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: cleanQuestion, language }),
        });

        const data = await response.json().catch(() => null) as {
          answer?: string;
          error?: string;
        } | null;

        if (response.ok && data?.answer) return data.answer;
        return data?.error || "Live information is temporarily unavailable.";
      } catch {
        return "Live information is temporarily unavailable.";
      }
    }
  );

  const status: AssistantStatus =
    conversation.status === "connecting"
      ? "connecting"
      : conversation.status === "connected"
        ? conversation.isSpeaking
          ? "speaking"
          : "listening"
        : errorText
          ? "error"
          : "idle";

  async function stopAssistant() {
    try {
      if (conversation.status !== "disconnected") {
        await conversation.endSession();
      }
    } catch {
      // Beim Schließen soll ein bereits beendetes Gespräch keinen Folgefehler erzeugen.
    }
  }

  async function startAssistant() {
    setErrorText("");
    setLastUserText("");
    setLastAssistantText("");

    try {
      // Muss direkt aus dem Nutzer-Klick erfolgen, damit Browser/Mobilgeräte
      // die Mikrofonfreigabe sauber an die ElevenAgents-Sitzung binden.
      const permissionStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      permissionStream.getTracks().forEach(track => track.stop());

      await conversation.startSession({
        agentId: AMELIA_AGENT_ID,
      });
    } catch (error) {
      const message =
        error instanceof DOMException && error.name === "NotAllowedError"
          ? "Der Zugriff auf das Mikrofon wurde nicht erlaubt."
          : error instanceof Error
            ? error.message
            : text.error;

      setErrorText(message);
    }
  }

  useEffect(() => {
    if (!open && conversation.status !== "disconnected") {
      void conversation.endSession();
    }

    return () => {
      if (conversation.status !== "disconnected") {
        void conversation.endSession();
      }
    };
    // Die Session soll ausschließlich auf Öffnen/Schließen des Amelia-Fensters reagieren.
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