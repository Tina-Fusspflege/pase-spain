import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ELEVENLABS_API_URL =
  "https://api.elevenlabs.io/v1/text-to-speech/p7AwDmKvTdoHTBuueGvP";

const MODEL_ID = "eleven_flash_v2_5";

const VOICE_SETTINGS = {
  stability: 0.86,
  similarity_boost: 0.94,
  style: 0.0,
  use_speaker_boost: true,
};

const TEST_TEXT =
  "Hola, soy Amelia de PaseSpain. Qué bien que estés aquí. " +
  "Dime, ¿vienes a España por un partido o también por el sol, la comida y la aventura?";

async function createSpeech(text: string) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY fehlt.");

  const cleanText = text.trim();
  if (!cleanText) throw new Error("Kein Text zum Sprechen vorhanden.");

  const speechText = cleanText.slice(0, 1400);

  const response = await fetch(
    `${ELEVENLABS_API_URL}?output_format=mp3_44100_64&optimize_streaming_latency=4`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: speechText,
        model_id: MODEL_ID,
        voice_settings: VOICE_SETTINGS,
        seed: 271828,
      }),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("ElevenLabs TTS Fehler:", {
      status: response.status,
      statusText: response.statusText,
      body: errorText,
    });
    throw new Error(`ElevenLabs TTS fehlgeschlagen (${response.status}): ${errorText}`);
  }

  return response.arrayBuffer();
}

function audioResponse(audio: ArrayBuffer) {
  return new NextResponse(audio, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Content-Length": String(audio.byteLength),
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Content-Disposition": 'inline; filename="amelia-malena.mp3"',
    },
  });
}

export async function GET() {
  try {
    return audioResponse(await createSpeech(TEST_TEXT));
  } catch (error) {
    console.error("GET /api/assistant/speech:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unbekannter Fehler bei ElevenLabs." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const text = body && typeof body.text === "string" ? body.text : "";
    return audioResponse(await createSpeech(text));
  } catch (error) {
    console.error("POST /api/assistant/speech:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unbekannter Fehler bei ElevenLabs." },
      { status: 500 }
    );
  }
}