import type { Metadata } from "next";
import Link from "next/link";
import MarketHome from "./MarketHome";
import { SITE_URL } from "./lib/match-url";

export const metadata: Metadata = { alternates: { canonical: SITE_URL } };
export default function Page() {
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify({"@context":"https://schema.org","@type":"WebSite",name:"PaseSpain",url:SITE_URL,inLanguage:["es","ca","en","de"]})}} /><MarketHome /><nav aria-label="Partidos de fútbol" style={{ background: "#f0f3f6", color: "#637184", padding: "20px", textAlign: "center" }}>
    <Link href="/partidos" style={{ color: "#96533f", textDecoration: "underline" }}>Ver todos los partidos y sus entradas</Link>
  </nav></>;
}
