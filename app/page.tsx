import type { Metadata } from "next";
import Link from "next/link";
import Home from "./Home";
import { SITE_URL } from "./lib/match-url";

export const metadata: Metadata = { alternates: { canonical: SITE_URL } };
export default function Page() {
  return <><Home /><nav aria-label="Partidos de fútbol" style={{ background: "#081832", color: "white", padding: "20px", textAlign: "center" }}>
    <Link href="/partidos" style={{ color: "#a6d7ff", textDecoration: "underline" }}>Ver todos los partidos y sus entradas</Link>
  </nav></>;
}
