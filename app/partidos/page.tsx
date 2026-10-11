import type { Metadata } from "next";
import Link from "next/link";
import { getMatches } from "../lib/matches";
import { matchDate, SITE_URL } from "../lib/match-url";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Partidos de fútbol y entradas en España | PaseSpain",
  description: "Consulta los partidos con anuncios en PaseSpain. Encuentra entradas por equipo, fecha y estadio y revisa las ofertas disponibles.",
  alternates: { canonical: `${SITE_URL}/partidos` },
};
export default async function MatchesPage() {
  const matches = await getMatches();
  return <main className="fixture-page">
    <Link href="/">PaseSpain</Link>
    <h1>Partidos de fútbol en España</h1>
    <p>Consulta los partidos anunciados y sus entradas disponibles.</p>
    <ul>{matches.map(match => <li key={match.slug}>
      <h2><Link href={`/partido/${match.slug}`}>{match.home} – {match.away}</Link></h2>
      <p>{matchDate(match.match_date)} · {match.stadium} · {match.city}</p>
      <p>{match.offers.length ? `${match.offers.length} anuncios disponibles` : "Sin entradas disponibles"}</p>
    </li>)}</ul>
  </main>;
}
