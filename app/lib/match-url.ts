export const SITE_URL = "https://www.pasespain.es";

export function teamName(value: string) {
  const aliases: Record<string, string> = {
    "villarreal": "Villarreal CF", "villareal": "Villarreal CF", "villarreal cf": "Villarreal CF",
    "valencia": "Valencia CF", "valencia cf": "Valencia CF",
  };
  return aliases[value.trim().toLowerCase()] ?? value.trim();
}

function slug(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// One URL per fixture, independent of offer ID, price, availability and kickoff time.
export function matchSlug(home: string, away: string, date: string) {
  return `${slug(teamName(home))}-${slug(teamName(away))}-${date.slice(0, 10)}`;
}

export function matchPath(home: string, away: string, date: string) {
  return `/partido/${matchSlug(home, away, date)}`;
}

export function matchDate(date: string) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  }).format(new Date(`${date.slice(0, 10)}T12:00:00Z`));
}
