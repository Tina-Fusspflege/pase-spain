import type { MetadataRoute } from "next";
import { getMatches } from "./lib/matches";
import { SITE_URL } from "./lib/match-url";

export const revalidate = 60;
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const matches = await getMatches();
  return [
    {
      url: SITE_URL,
      changeFrequency: "daily",
      priority: 1,
    },
    { url: `${SITE_URL}/partidos`, changeFrequency: "daily", priority: 0.8 },
    ...matches.map(match => ({ url: `${SITE_URL}/partido/${match.slug}`, changeFrequency: "daily" as const, priority: 0.7 })),
  ];
}
