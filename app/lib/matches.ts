import "server-only";
import { cache } from "react";
import { matchSlug, teamName } from "./match-url";

export type PublicOffer = {
  id: string; home: string; away: string; match_date: string;
  stadium: string; city: string; price_eur: number; status: string;
};
export type Match = PublicOffer & { slug: string; offers: PublicOffer[] };

// Read only public fixture fields with the existing anonymous RLS policy.
// Include sold offers so fixture pages survive a sale; never expose seller data.
export const getMatches = cache(async (): Promise<Match[]> => {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !key) throw new Error("Public match data is not configured");
  const rows: PublicOffer[] = [];
  for (let offset = 0; ; offset += 1000) {
    const response = await fetch(`${base}/rest/v1/ticket_offers?select=id,home,away,match_date,stadium,city,price_eur,status&status=in.(available,sold)&order=id.asc&limit=1000&offset=${offset}`, {
      headers: { apikey: key }, next: { revalidate: 60 },
    });
    if (!response.ok) throw new Error(`Public match data unavailable (${response.status})`);
    const page = await response.json() as PublicOffer[];
    rows.push(...page);
    if (page.length < 1000) break;
  }
  const matches = new Map<string, Match>();
  for (const row of rows) {
    // 2099 is the existing application's placeholder for an unconfirmed date.
    if (!row.home?.trim() || !row.away?.trim() || !/^\d{4}-\d{2}-\d{2}T/.test(row.match_date) || row.match_date.startsWith("2099-") || Number.isNaN(Date.parse(row.match_date))) continue;
    const slug = matchSlug(row.home, row.away, row.match_date);
    let match = matches.get(slug);
    if (!match) {
      match = { ...row, home: teamName(row.home), away: teamName(row.away), slug, offers: [] };
      matches.set(slug, match);
    }
    if (row.status === "available") match.offers.push(row);
  }
  return [...matches.values()].sort((a, b) => a.match_date.localeCompare(b.match_date));
});
