import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getMatches } from "../../lib/matches";
import { matchDate, SITE_URL } from "../../lib/match-url";
import { offerFacts } from "../../lib/offer-facts";

export const revalidate = 60;
type Props = { params: Promise<{ slug: string }> };
const euro = (price: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(price);
function startingPrice(offers: Awaited<ReturnType<typeof getMatches>>[number]["offers"]) {
  const prices = offers.map(offer => offer.price_eur).filter(price => Number.isFinite(price) && price > 0);
  return prices.length ? Math.min(...prices) : null;
}
async function fixture(params: Props["params"]) {
  const { slug } = await params;
  const match = (await getMatches()).find(match => match.slug === slug);
  if (!match) notFound();
  return match;
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const match = await fixture(params);
  const title = `Entradas ${match.home} – ${match.away} · ${matchDate(match.match_date)} | PaseSpain`;
  const price = match.offersUnavailable ? null : startingPrice(match.offers);
  const description = `Entradas para ${match.home} contra ${match.away}, el ${matchDate(match.match_date)} en ${match.stadium}.${price !== null ? ` Anuncios desde ${euro(price)} por entrada.` : " Consulta la disponibilidad actual."} Compara zonas y detalles en PaseSpain.`;
  const url = `${SITE_URL}/partido/${match.slug}`;
  return { title, description, alternates: { canonical: url },
    robots: { index: Boolean(match.verification), follow: true },
    openGraph: { title, description, url, type: "website", siteName: "PaseSpain" },
  };
}
export default async function MatchPage({ params }: Props) {
  const match = await fixture(params);
  const price = match.offersUnavailable ? null : startingPrice(match.offers);
  return <main className="fixture-page">
    <nav aria-label="Navegación"><Link href="/">PaseSpain</Link> / <Link href="/partidos">Partidos</Link></nav>
    <h1>Entradas {match.home} – {match.away}</h1>
    <p><time dateTime={match.match_date.slice(0, 10)}>{matchDate(match.match_date)}</time> · {match.stadium} · {match.city}</p>
    {match.verification ? <>
      <p>{match.verification.provisional ? "Fecha prevista; día y horario definitivos pendientes de confirmación." : `Hora local del estadio: ${match.verification.kickoff}.`}</p>
      <p><a href={match.verification.source} target="_blank" rel="noopener noreferrer">Consultar calendario del club</a> · Comprobado el {matchDate(match.verification.checkedAt)}. Revisa posibles cambios antes de viajar.</p>
    </> : <p className="fixture-notice">{match.review?.message ?? "La fecha y el estadio proceden del anuncio y todavía no han sido verificados. Confirma los datos con el vendedor antes de comprar."} {match.review?.source && <a href={match.review.source} target="_blank" rel="noopener noreferrer">Calendario del club</a>}</p>}
    <h2>Entradas disponibles</h2>
    {price !== null && <p><strong>Anuncios desde {euro(price)} por entrada.</strong> {match.offers.length} {match.offers.length === 1 ? "anuncio disponible" : "anuncios disponibles"}. El precio total se muestra en el carrito antes del pago.</p>}
    {match.offersUnavailable ? <p role="status">No se pudo consultar la disponibilidad de entradas. Vuelve a intentarlo más tarde o <Link href="/">consulta los anuncios en PaseSpain</Link>.</p> : match.offers.length ? <ul>{match.offers.map(offer => {
      const facts = offerFacts(offer.details);
      const differs = match.verification && (offer.stadium !== match.stadium ||
        Boolean(match.verification.kickoff && offer.match_date.slice(11, 16) !== match.verification.kickoff));
      return <li key={offer.id}>
      <p>Entrada en {offer.stadium} · {euro(offer.price_eur)} por entrada</p>
      <dl className="fixture-facts">
        <div><dt>Entradas anunciadas</dt><dd>{facts.quantity ?? "No indicada"}</dd></div>
        <div><dt>Tribuna / zona</dt><dd>{facts.zone ?? "No indicada"}</dd></div>
        <div><dt>Sector / bloque</dt><dd>{facts.sector ?? "No indicado"}</dd></div>
        <div><dt>Fila</dt><dd>{facts.row ?? "No indicada"}</dd></div>
        <div><dt>Asiento</dt><dd>{facts.seat ?? "No indicado"}</dd></div>
        <div><dt>Asientos juntos</dt><dd>{facts.adjacent}</dd></div>
      </dl>
      {differs && <p className="fixture-notice">El horario o estadio del anuncio difiere del calendario del club. Confirma los datos con el vendedor.</p>}
      <Link href={`/?offer=${encodeURIComponent(offer.id)}`}>Ver anuncio y comprar</Link>
    </li>;
    })}</ul> : <p>Actualmente no hay entradas disponibles para este partido. Puedes consultar otros partidos o volver más adelante.</p>}
    <p>Revisa los detalles, la cantidad de entradas y el precio total en el carrito antes del pago.</p>
    <section aria-labelledby="ticket-questions">
      <h2 id="ticket-questions">Comprar entradas para {match.home} – {match.away}</h2>
      <h3>¿Cómo consulto y compro una entrada?</h3>
      <p>Elige «Ver anuncio y comprar» para abrir el anuncio en PaseSpain. Revisa sus detalles y el precio total en el carrito antes de continuar con el pago.</p>
      <h3>¿Puedo encontrar entradas juntas?</h3>
      <p>Consulta «Asientos juntos» en cada anuncio. Si no está indicado, no se ha confirmado que las localidades estén juntas. Comprueba también la zona, fila y cantidad anunciada antes de comprar.</p>
      <h3>¿El precio y la disponibilidad pueden cambiar?</h3>
      <p>Sí. Esta página se actualiza periódicamente; confirma la disponibilidad y el precio total al abrir el anuncio y antes del pago. El precio mostrado aquí es por entrada.</p>
      <h3>¿Dónde confirmo el horario del partido?</h3>
      <p>{match.verification ? <><a href={match.verification.source} target="_blank" rel="noopener noreferrer">Consulta el calendario del club</a> para comprobar posibles cambios de fecha u horario.</> : "Confirma la fecha y el horario con el vendedor y el calendario oficial del club antes de comprar."}</p>
    </section>
    <Link href="/partidos">Ver todos los partidos</Link>
  </main>;
}
