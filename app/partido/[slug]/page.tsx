import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getMatches } from "../../lib/matches";
import { matchDate, SITE_URL } from "../../lib/match-url";

export const revalidate = 60;
type Props = { params: Promise<{ slug: string }> };
async function fixture(params: Props["params"]) {
  const { slug } = await params;
  const match = (await getMatches()).find(match => match.slug === slug);
  if (!match) notFound();
  return match;
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const match = await fixture(params);
  const title = `Entradas ${match.home} – ${match.away} · ${matchDate(match.match_date)} | PaseSpain`;
  const description = `Consulta entradas para ${match.home} contra ${match.away}, el ${matchDate(match.match_date)} en ${match.stadium}, ${match.city}. Compara los anuncios disponibles en PaseSpain.`;
  const url = `${SITE_URL}/partido/${match.slug}`;
  return { title, description, alternates: { canonical: url },
    openGraph: { title, description, url, type: "website", siteName: "PaseSpain" },
  };
}
export default async function MatchPage({ params }: Props) {
  const match = await fixture(params);
  return <main className="fixture-page">
    <nav aria-label="Navegación"><Link href="/">PaseSpain</Link> / <Link href="/partidos">Partidos</Link></nav>
    <h1>Entradas {match.home} – {match.away}</h1>
    <p><time dateTime={match.match_date.slice(0, 10)}>{matchDate(match.match_date)}</time> · {match.stadium} · {match.city}</p>
    <p>Consulta los anuncios de entradas para {match.home} contra {match.away} en {match.stadium}. Las fechas y horarios proceden de los anuncios; confirma el calendario con el organizador antes de viajar.</p>
    <h2>Entradas disponibles</h2>
    {match.offers.length ? <ul>{match.offers.map(offer => <li key={offer.id}>
      <p>Entrada en {offer.stadium} · {new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(offer.price_eur)} por entrada</p>
      <Link href={`/?offer=${encodeURIComponent(offer.id)}`}>Ver anuncio y comprar</Link>
    </li>)}</ul> : <p>Actualmente no hay entradas disponibles para este partido. Puedes consultar otros partidos o volver más adelante.</p>}
    <p>Revisa los detalles, la cantidad de entradas y el precio total en el carrito antes del pago.</p>
    <Link href="/partidos">Ver todos los partidos</Link>
  </main>;
}
