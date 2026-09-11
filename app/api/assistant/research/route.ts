import { NextResponse } from "next/server";

export const runtime = "nodejs";

type RequestBody = {
  question?: string;
  language?: "es" | "ca" | "en" | "de";
};

const languageNames = {
  es: "Spanish",
  ca: "Catalan",
  en: "English",
  de: "German",
} as const;

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY fehlt in Vercel." }, { status: 500 });
  }

  const body = await request.json().catch(() => null) as RequestBody | null;
  const question = String(body?.question || "").trim();
  const language = body?.language && languageNames[body.language] ? body.language : "es";

  if (!question) {
    return NextResponse.json({ error: "Frage fehlt." }, { status: 400 });
  }

  if (question.length > 800) {
    return NextResponse.json({ error: "Frage ist zu lang." }, { status: 400 });
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-5.6-luna",
      tools: [{ type: "web_search" }],
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text:
                `You provide live background information to the PaseSpain voice assistant. ` +
                `Only answer questions about Spanish football, Spanish stadiums, match-day travel or weather in Spain. ` +
                `Use web search for current facts. Give a concise factual answer in ${languageNames[language]}. ` +
                `If the information is uncertain or not current enough, say so. Never invent fixture times, results or weather.`,
            },
          ],
        },
        {
          role: "user",
          content: [{ type: "input_text", text: question }],
        },
      ],
      max_output_tokens: 450,
    }),
    cache: "no-store",
  });

  const data = await response.json().catch(() => null) as any;
  if (!response.ok) {
    console.error("PaseSpain assistant research error", response.status, data);
    return NextResponse.json({ error: "Aktuelle Informationen sind vorübergehend nicht verfügbar." }, { status: 502 });
  }

  const answer = String(
    data?.output_text ||
    data?.output
      ?.flatMap((item: any) => Array.isArray(item?.content) ? item.content : [])
      ?.map((part: any) => part?.text || part?.output_text || "")
      ?.filter(Boolean)
      ?.join("\n") ||
    ""
  ).trim();
  if (!answer) {
    return NextResponse.json({ error: "Keine aktuelle Information gefunden." }, { status: 404 });
  }

  return NextResponse.json({ answer });
}
