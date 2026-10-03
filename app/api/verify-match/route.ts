import { NextResponse } from "next/server";

type FootballDataMatch = {
  utcDate?: string;
  venue?: string | null;
  homeTeam?: { name?: string; shortName?: string; tla?: string };
  awayTeam?: { name?: string; shortName?: string; tla?: string };
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\b(fc|cf|rcd|rc|ca|club de futbol|futbol club)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function teamMatches(input: string, team?: FootballDataMatch["homeTeam"]) {
  const wanted = normalize(input);
  if (!wanted || !team) return false;
  return [team.name, team.shortName, team.tla]
    .filter(Boolean)
    .some((name) => {
      const candidate = normalize(String(name));
      return candidate === wanted || candidate.includes(wanted) || wanted.includes(candidate);
    });
}

function parseDate(value: string) {
  const iso = value.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const eu = value.match(/(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})/);
  if (!eu) return null;
  return `${eu[3]}-${eu[2].padStart(2, "0")}-${eu[1].padStart(2, "0")}`;
}

export async function POST(request: Request) {
  const token = process.env.FOOTBALL_DATA_API_TOKEN;
  if (!token) {
    return NextResponse.json({ verified: false, message: "Spielprüfung ist noch nicht konfiguriert." }, { status: 500 });
  }

  const body = (await request.json()) as { competition?: string; home?: string; away?: string; date?: string; stadium?: string };
  const home = body.home?.trim() || "";
  const away = body.away?.trim() || "";
  const date = parseDate(body.date || "");
  if (!home || !away || !date) {
    return NextResponse.json({ verified: false, message: "Teams oder Spieldatum sind ungültig." }, { status: 400 });
  }

  const competitionText = normalize(body.competition || "");
  const codes = competitionText.includes("champions") ? ["CL"] : competitionText.includes("copa") ? ["CDR"] : ["PD"];
  const day = new Date(`${date}T12:00:00Z`);
  const from = new Date(day); from.setUTCDate(from.getUTCDate() - 1);
  const to = new Date(day); to.setUTCDate(to.getUTCDate() + 1);
  const ymd = (d: Date) => d.toISOString().slice(0, 10);

  try {
    for (const code of codes) {
      const response = await fetch(`https://api.football-data.org/v4/competitions/${code}/matches?dateFrom=${ymd(from)}&dateTo=${ymd(to)}`, {
        headers: { "X-Auth-Token": token },
        cache: "no-store",
      });
      if (!response.ok) {
        if (response.status === 403) continue;
        return NextResponse.json({ verified: false, message: "Spielprüfung ist momentan nicht erreichbar." }, { status: 502 });
      }
      const data = (await response.json()) as { matches?: FootballDataMatch[] };
      const match = (data.matches || []).find((item) => teamMatches(home, item.homeTeam) && teamMatches(away, item.awayTeam));
      if (!match) continue;

      const enteredStadium = normalize(body.stadium || "");
      const apiVenue = normalize(match.venue || "");
      const stadiumConfirmed = !enteredStadium || !apiVenue || enteredStadium === apiVenue || enteredStadium.includes(apiVenue) || apiVenue.includes(enteredStadium);
      if (!stadiumConfirmed) {
        return NextResponse.json({ verified: false, message: `Das Spiel existiert, aber das Stadion stimmt nicht. Offiziell: ${match.venue}.` }, { status: 409 });
      }
      return NextResponse.json({ verified: true, match: { home: match.homeTeam?.name, away: match.awayTeam?.name, utcDate: match.utcDate, venue: match.venue } });
    }

    return NextResponse.json({ verified: false, message: "Diese Begegnung wurde für das angegebene Datum nicht gefunden. Bitte Angaben prüfen." }, { status: 409 });
  } catch {
    return NextResponse.json({ verified: false, message: "Spielprüfung ist momentan nicht erreichbar." }, { status: 502 });
  }
}