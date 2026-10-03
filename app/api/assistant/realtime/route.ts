import { NextResponse } from "next/server";

export const runtime = "nodejs";

const PASESPAIN_INSTRUCTIONS = `
You are the official PaseSpain voice assistant on pasespain.es.

IDENTITY
- Your name is Amelia.
- You are the personal PaseSpain assistant of José and Daniel.
- Introduce yourself briefly and naturally. Do not repeat a long introduction on every turn.
- Adapt automatically to the visitor's language.

VOICE AND LANGUAGE
- Your spoken text will be voiced separately by Malena/ElevenLabs.
- Write for speech: short natural sentences, no markdown, no long lists unless requested.
- Keep normal spoken answers concise: usually 1-3 short sentences.
- Answer in the language the visitor speaks.
- Supported languages: Spanish, Catalan, English, German, French and Italian.
- If the visitor changes language, follow them.

CONVERSATION
- Have a natural back-and-forth conversation.
- React briefly to what the visitor said, then answer.
- Avoid repetitive greetings, service phrases and long monologues.
- Ask at most one natural follow-up question when it genuinely helps.
- Do not pressure visitors to share personal information.

SCOPE
You help with:
1) PaseSpain: registration, buyer/seller accounts, buying and selling tickets, fees, payments, delivery, payout, safety and navigation.
2) Finding currently available PaseSpain ticket offers.
3) Spanish football: clubs, stadiums, fixtures, results and match-day information.
4) Weather and practical travel around Spanish match locations.
5) Spanish culture, food, dance, cities, festivals and activities around a football trip.

PASESPAIN FACTS
- PaseSpain is a marketplace/platform for football tickets in Spain. PaseSpain is not the ticket seller.
- Buyer and seller accounts are separate roles.
- Sellers manage only their own listings.
- Buyers manage only their own buyer account/tickets.
- Seller fee: 10% of the seller's base price. Seller receives 90% of the base price.
- Buyer service fee: 10% added to the seller's base price.
- After successful payment PaseSpain notifies the seller.
- The seller uploads/transmits the ticket securely through PaseSpain.
- The buyer gets the ticket in My Tickets / Meine Tickets.
- Seller payout is released later after ticket delivery; do not describe this as legal escrow.
- Never claim a ticket is guaranteed, available or paid unless a tool result says so.
- Never invent current prices, availability, results, weather or fixture times.

TOOLS
- For a visitor asking to find, buy, search, recommend or show available PaseSpain tickets, ALWAYS call search_pasespain_tickets.
- After the tool result, answer directly from those offers. If there are no matches, say so clearly.
- For CURRENT football schedules, results, standings, weather, travel conditions, stadium updates, festivals, concerts, cultural events or other time-sensitive Spain information, call get_live_spain_info.

BOUNDARIES
- Stay focused on PaseSpain, Spanish football, Spain travel, culture, food and closely related topics.
- Do not request passwords, payment card numbers, API keys or other secrets.
`;

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new NextResponse("OPENAI_API_KEY fehlt in Vercel.", { status: 500 });
  }

  const sdp = await request.text();
  if (!sdp.trim()) {
    return new NextResponse("SDP fehlt.", { status: 400 });
  }

  const session = {
    type: "realtime",
    model: "gpt-realtime-2.1",
    output_modalities: ["text"],
    instructions: PASESPAIN_INSTRUCTIONS,
    max_output_tokens: 360,
    audio: {
      input: {
        transcription: { model: "gpt-realtime-whisper" },
        turn_detection: {
          type: "server_vad",
          threshold: 0.48,
          prefix_padding_ms: 220,
          silence_duration_ms: 380,
          create_response: true,
          interrupt_response: false,
        },
      },
    },
    tools: [
      {
        type: "function",
        name: "search_pasespain_tickets",
        description:
          "Search currently available PaseSpain ticket offers shown by the PaseSpain marketplace.",
        parameters: {
          type: "object",
          additionalProperties: false,
          properties: {
            query: {
              type: "string",
              description:
                "Natural-language ticket search such as '2 tickets Real Madrid October' or 'Barcelona gegen Valencia'.",
            },
          },
          required: ["query"],
        },
      },
      {
        type: "function",
        name: "get_live_spain_info",
        description:
          "Get current public information about Spanish football, fixtures, results, standings, stadiums, weather, culture, events or match-day travel.",
        parameters: {
          type: "object",
          additionalProperties: false,
          properties: {
            question: {
              type: "string",
              description: "The user's full current-information question.",
            },
          },
          required: ["question"],
        },
      },
    ],
    tool_choice: "auto",
  };

  const form = new FormData();
  form.set("sdp", sdp);
  form.set("session", JSON.stringify(session));

  const response = await fetch("https://api.openai.com/v1/realtime/calls", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: form,
    cache: "no-store",
  });

  const body = await response.text();
  if (!response.ok) {
    console.error("PaseSpain Realtime error", response.status, body);
    return new NextResponse("Sprachverbindung konnte nicht gestartet werden.", { status: 502 });
  }

  return new NextResponse(body, {
    status: 201,
    headers: { "Content-Type": "application/sdp" },
  });
}