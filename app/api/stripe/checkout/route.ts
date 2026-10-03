import { NextRequest, NextResponse } from "next/server";
import { stripe } from "../../../lib/stripe";

type TicketOffer = {
  id: string;
  seller_id: string;
  home: string;
  away: string;
  match_date: string;
  stadium: string;
  city: string;
  price_eur: number;
  details: string | null;
  status: string;
  reserved_by: string | null;
  reserved_until: string | null;
};

export async function POST(request: NextRequest) {
  const reservedOfferIds: string[] = [];
  let supabaseUrl = "";
  let supabaseServiceRoleKey = "";
  let buyerId = "";

  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Nicht autorisiert." },
        { status: 401 }
      );
    }

    const accessToken = authHeader.replace("Bearer ", "").trim();

    supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const supabasePublishableKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
    supabaseServiceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

    if (
      !supabaseUrl ||
      !supabasePublishableKey ||
      !supabaseServiceRoleKey
    ) {
      return NextResponse.json(
        { error: "Server-Konfiguration fehlt." },
        { status: 500 }
      );
    }

    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      method: "GET",
      headers: {
        apikey: supabasePublishableKey,
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    if (!userResponse.ok) {
      return NextResponse.json(
        { error: "Ungültige oder abgelaufene Anmeldung." },
        { status: 401 }
      );
    }

    const user = await userResponse.json();

    if (!user?.id) {
      return NextResponse.json(
        { error: "Käufer konnte nicht verifiziert werden." },
        { status: 401 }
      );
    }

    buyerId = String(user.id);

    const buyerEmail =
      typeof user.email === "string"
        ? user.email.trim()
        : "";

    if (!buyerEmail) {
      return NextResponse.json(
        { error: "E-Mail-Adresse des Käufers fehlt." },
        { status: 400 }
      );
    }

    const body: unknown = await request.json().catch(() => null);

    const rawOfferIds: unknown[] =
      typeof body === "object" &&
      body !== null &&
      "offerIds" in body &&
      Array.isArray((body as { offerIds?: unknown }).offerIds)
        ? (body as { offerIds: unknown[] }).offerIds
        : [];

    const offerIds: string[] = Array.from(
      new Set(
        rawOfferIds
          .filter(
            (id): id is string =>
              typeof id === "string" && id.trim().length > 0
          )
          .map(id => id.trim())
      )
    );

    if (!offerIds.length) {
      return NextResponse.json(
        { error: "Keine gültigen Tickets ausgewählt." },
        { status: 400 }
      );
    }

    for (const offerId of offerIds) {
      const reserveResponse = await fetch(
        `${supabaseUrl}/rest/v1/rpc/reserve_ticket_offer`,
        {
          method: "POST",
          headers: {
            apikey: supabaseServiceRoleKey,
            Authorization: `Bearer ${supabaseServiceRoleKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            p_offer_id: offerId,
            p_buyer_id: buyerId,
            p_minutes: 30,
          }),
          cache: "no-store",
        }
      );

      if (!reserveResponse.ok) {
        throw new Error("Ticket konnte nicht reserviert werden.");
      }

      const reserved: unknown = await reserveResponse.json();

      if (reserved !== true) {
        await releaseReservations(
          supabaseUrl,
          supabaseServiceRoleKey,
          reservedOfferIds,
          buyerId
        );

        reservedOfferIds.length = 0;

        return NextResponse.json(
          {
            error:
              "Mindestens ein Ticket wurde gerade von einem anderen Käufer reserviert oder bereits verkauft.",
          },
          { status: 409 }
        );
      }

      reservedOfferIds.push(offerId);
    }

    const encodedIds = reservedOfferIds
      .map(id => `"${id}"`)
      .join(",");

    const offersResponse = await fetch(
      `${supabaseUrl}/rest/v1/ticket_offers?id=in.(${encodeURIComponent(
        encodedIds
      )})&select=id,seller_id,home,away,match_date,stadium,city,price_eur,details,status,reserved_by,reserved_until`,
      {
        headers: {
          apikey: supabaseServiceRoleKey,
          Authorization: `Bearer ${supabaseServiceRoleKey}`,
        },
        cache: "no-store",
      }
    );

    if (!offersResponse.ok) {
      throw new Error("Tickets konnten nicht geladen werden.");
    }

    const offers = (await offersResponse.json()) as TicketOffer[];

    if (offers.length !== reservedOfferIds.length) {
      throw new Error("Nicht alle Tickets konnten geladen werden.");
    }

    for (const offer of offers) {
      if (
        offer.status !== "reserved" ||
        offer.reserved_by !== buyerId
      ) {
        throw new Error("Ticketreservierung ist ungültig.");
      }

      const price = Number(offer.price_eur);

      if (!Number.isFinite(price) || price <= 0) {
        throw new Error("Ungültiger Ticketpreis.");
      }
    }

    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://pasespain.es";

    const ticketSubtotal = offers.reduce(
      (sum, offer) => sum + Number(offer.price_eur),
      0
    );

    const buyerServiceFee =
      Math.round(ticketSubtotal * 0.1 * 100);

    const ticketLineItems = offers.map(offer => ({
      quantity: 1,
      price_data: {
        currency: "eur",
        unit_amount: Math.round(
          Number(offer.price_eur) * 100
        ),
        product_data: {
          name: `${offer.home} – ${offer.away}`,
          description: [
            offer.match_date,
            offer.stadium,
            offer.city,
          ]
            .filter(Boolean)
            .join(" · "),
        },
      },
    }));

    const session = await stripe.checkout.sessions.create({
      mode: "payment",

      customer_email: buyerEmail,

      line_items: [
        ...ticketLineItems,
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: buyerServiceFee,
            product_data: {
              name: "PaseSpain Käufer-Service 10 %",
            },
          },
        },
      ],

      success_url:
        `${origin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,

      cancel_url:
        `${origin}/?checkout=cancelled`,

      metadata: {
        pasespain_buyer_id: buyerId,
        pasespain_buyer_email: buyerEmail,
        pasespain_offer_ids: reservedOfferIds.join(","),
      },

      payment_intent_data: {
        metadata: {
          pasespain_buyer_id: buyerId,
          pasespain_buyer_email: buyerEmail,
          pasespain_offer_ids: reservedOfferIds.join(","),
        },
      },

      expires_at:
        Math.floor(Date.now() / 1000) + 30 * 60,
    });

    if (!session.url) {
      throw new Error("Stripe Checkout URL fehlt.");
    }

    return NextResponse.json({
      url: session.url,
    });
  } catch (error) {
    if (
      supabaseUrl &&
      supabaseServiceRoleKey &&
      buyerId &&
      reservedOfferIds.length > 0
    ) {
      try {
        await releaseReservations(
          supabaseUrl,
          supabaseServiceRoleKey,
          reservedOfferIds,
          buyerId
        );
      } catch (releaseError) {
        console.error(
          "Reservierungen konnten nach Checkout-Fehler nicht freigegeben werden:",
          releaseError
        );
      }
    }

    console.error("Stripe Checkout Fehler:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Stripe Checkout konnte nicht gestartet werden.",
      },
      { status: 500 }
    );
  }
}

async function releaseReservations(
  supabaseUrl: string,
  serviceRoleKey: string,
  offerIds: string[],
  buyerId: string
) {
  for (const offerId of offerIds) {
    const releaseResponse = await fetch(
      `${supabaseUrl}/rest/v1/ticket_offers?id=eq.${encodeURIComponent(
        offerId
      )}&reserved_by=eq.${encodeURIComponent(
        buyerId
      )}&status=eq.reserved`,
      {
        method: "PATCH",
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          status: "available",
          reserved_by: null,
          reserved_until: null,
        }),
        cache: "no-store",
      }
    );

    if (!releaseResponse.ok) {
      const errorText = await releaseResponse.text();

      throw new Error(
        `Reservierung ${offerId} konnte nicht freigegeben werden: ${errorText}`
      );
    }
  }
}