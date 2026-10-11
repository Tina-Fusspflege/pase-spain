import type { MetadataRoute } from "next";
import { verifiedFixtures } from "./lib/verified-fixtures";
import { matchPath, SITE_URL } from "./lib/match-url";

// Crawler access must not depend on the inventory database being online.
// New fixture URLs enter this sitemap after their calendar details are reviewed.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      changeFrequency: "daily",
      priority: 1,
    },
    { url: `${SITE_URL}/partidos`, changeFrequency: "daily", priority: 0.8 },
    ...verifiedFixtures.map(match => ({ url: `${SITE_URL}${matchPath(match.home, match.away, match.date)}`, lastModified: match.checkedAt, changeFrequency: "daily" as const, priority: 0.7 })),
  ];
}
