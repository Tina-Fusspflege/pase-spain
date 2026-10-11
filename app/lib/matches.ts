import "server-only";
import { cache } from "react";
import { matchSlug, teamName } from "./match-url";
import { fixtureReviews, verifiedFixtures, type VerifiedFixture } from "./verified-fixtures";

export type PublicOffer = {
  id: string; home: string; away: string; match_date: string;
  stadium: string; city: string; price_eur: number; status: string;
  details?: string | null;
};
export type Match = {
  home: string; away: string; match_date: string; stadium: string; city: string;
  slug: string; offers: PublicOffer[]; verification?: VerifiedFixture;
  review?: { message: string; source?: string }; offersUnavailable?: boolean;
};

// Read only public fixture fields with the existing anonymous RLS policy.
// Include sold offers so fixture pages survive a sale; never expose seller data.
export const getMatches = cache(async (): Promise<Match[]> => {
  // Reviewed fixture content survives sales, deletion and inventory outages.
  const matches = new Map<string, Match>(verifiedFixtures.map(fixture => {
    const slug = matchSlug(fixture.home, fixture.away, fixture.date);
    return [slug, { home: fixture.home, away: fixture.away,
      match_date: `${fixture.date}T${fixture.kickoff ?? "12:00"}`,
      stadium: fixture.stadium, city: fixture.city, slug, offers: [], verification: fixture }];
  }));
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  try {
    if (!base || !key) throw new Error("Public match data is not configured");
    const rows: PublicOffer[] = [];
    for (let offset = 0; ; offset += 1000) {
      const response = await fetch(`${base}/rest/v1/ticket_offers?select=id,home,away,match_date,stadium,city,price_eur,status,details&status=in.(available,sold)&order=id.asc&limit=1000&offset=${offset}`, {
        headers: { apikey: key }, next: { revalidate: 60 }, signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) throw new Error(`Public match data unavailable (${response.status})`);
      const page = await response.json() as PublicOffer[];
      rows.push(...page);
      if (page.length < 1000) break;
    }
    for (const row of rows) {
      // 2099 is the existing application's placeholder for an unconfirmed date.
      if (!row.home?.trim() || !row.away?.trim() || !/^\d{4}-\d{2}-\d{2}T/.test(row.match_date) || row.match_date.startsWith("2099-") || Number.isNaN(Date.parse(row.match_date))) continue;
      const slug = matchSlug(row.home, row.away, row.match_date);
      let match = matches.get(slug);
      if (!match) {
        match = { home: teamName(row.home), away: teamName(row.away), match_date: row.match_date,
          stadium: row.stadium, city: row.city, slug, offers: [], review: fixtureReviews[slug] };
        matches.set(slug, match);
      }
      if (row.status === "available") match.offers.push(row);
    }
  } catch {
    for (const match of matches.values()) match.offersUnavailable = true;
    console.error("Public fixture inventory unavailable; serving reviewed fixture content");
  }
  return [...matches.values()].sort((a, b) => a.match_date.localeCompare(b.match_date));
});
