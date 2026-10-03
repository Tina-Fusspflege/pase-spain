import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type TicketOfferRow = {
  id: string;
  home: string;
  away: string;
  match_date: string;
  stadium: string;
  city: string;
  price_eur: number;
  details?: string | null;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "";

async function getTicket(id: string): Promise<TicketOfferRow | null> {
  if (!SUPABASE_URL || !SUPABASE_KEY || !id) return null;

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/ticket_offers?id=eq.${encodeURIComponent(
      id
    )}&select=id,home,away,match_date,stadium,city,price_eur,details&limit=1`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      next: { revalidate: 60 },
    }
  );

  if (!response.ok) return null;

  const rows = (await response.json()) as TicketOfferRow[];
  return rows[0] ?? null;
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("de-CH", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

type TicketPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: TicketPageProps): Promise<Metadata> {
  const { id } = await params;
  const ticket = await getTicket(id);

  if (!ticket) {
    return {
      title: "PaseSpain – Fussballtickets in Spanien",
      description:
        "Tickets, Transparenz, Sicherheit und Vertrauen auf PaseSpain.",
    };
  }

  const title = `${ticket.home} – ${ticket.away} | PaseSpain`;
  const description = [
    formatDate(ticket.match_date),
    ticket.stadium,
    formatPrice(ticket.price_eur),
  ]
    .filter(Boolean)
    .join(" · ");

  const url = `https://www.pasespain.es/ticket/${encodeURIComponent(ticket.id)}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "website",
      url,
      siteName: "PaseSpain",
      title,
      description,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function TicketPage({ params }: TicketPageProps) {
  const { id } = await params;
  const ticket = await getTicket(id);

  if (!ticket) notFound();

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
        background:
          "linear-gradient(145deg, rgb(8, 24, 50), rgb(18, 55, 89))",
        color: "white",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <article
        style={{
          width: "min(560px, 100%)",
          padding: "28px",
          border: "1px solid rgba(255,255,255,.35)",
          borderRadius: "28px",
          background: "rgba(255,255,255,.10)",
          boxShadow: "0 24px 70px rgba(0,0,0,.24)",
          backdropFilter: "blur(18px)",
        }}
      >
        <div style={{ opacity: 0.76, marginBottom: "10px" }}>PaseSpain</div>

        <h1 style={{ margin: "0 0 18px", fontSize: "30px" }}>
          {ticket.home} – {ticket.away}
        </h1>

        <p style={{ margin: "8px 0" }}>{formatDate(ticket.match_date)}</p>
        <p style={{ margin: "8px 0" }}>{ticket.stadium}</p>
        <p style={{ margin: "8px 0" }}>{ticket.city}</p>

        <strong
          style={{
            display: "block",
            marginTop: "22px",
            fontSize: "28px",
          }}
        >
          {formatPrice(ticket.price_eur)}
        </strong>

        {ticket.details ? (
          <p style={{ marginTop: "18px", opacity: 0.82 }}>{ticket.details}</p>
        ) : null}

        <Link
          href="/"
          style={{
            display: "inline-block",
            marginTop: "26px",
            padding: "12px 18px",
            borderRadius: "14px",
            background: "rgba(255,255,255,.15)",
            border: "1px solid rgba(255,255,255,.32)",
            color: "white",
            textDecoration: "none",
            fontWeight: 700,
          }}
        >
          Zu PaseSpain
        </Link>
      </article>
    </main>
  );
}