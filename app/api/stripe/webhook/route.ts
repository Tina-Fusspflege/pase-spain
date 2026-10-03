import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "../../../lib/stripe";

const RESEND_API_URL = "https://api.resend.com/emails";

type TicketOffer = {
  id: string;
  seller_id: string;
  home: string;
  away: string;
  match_date: string;
  stadium: string;
  price_eur: number;
  status: string;
  reserved_by: string | null;
};

type BuyerProfile = {
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
};

export async function POST(request: NextRequest) {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!webhookSecret || !supabaseUrl || !serviceKey) {
      throw new Error("Server-Konfiguration fehlt.");
    }

    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Stripe-Signatur fehlt." },
        { status: 400 }
      );
    }

    const rawBody = await request.text();

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret
      );
    } catch {
      return NextResponse.json(
        { error: "Ungültige Stripe-Signatur." },
        { status: 400 }
      );
    }

    if (event.type !== "checkout.session.completed") {
      return NextResponse.json({ received: true });
    }

    const session = event.data.object as Stripe.Checkout.Session;

    if (session.payment_status !== "paid") {
      return NextResponse.json({ received: true });
    }

    const buyerId =
      session.metadata?.pasespain_buyer_id?.trim();

    const buyerEmail =
      session.metadata?.pasespain_buyer_email?.trim() ||
      session.customer_details?.email?.trim() ||
      "";

    const offerIds =
      session.metadata?.pasespain_offer_ids
        ?.split(",")
        .map((id) => id.trim())
        .filter(Boolean) ?? [];

    if (!buyerId || offerIds.length === 0) {
      return NextResponse.json(
        { error: "Checkout-Metadaten fehlen." },
        { status: 400 }
      );
    }

    for (const offerId of offerIds) {
      const existingResponse = await fetch(
        `${supabaseUrl}/rest/v1/orders?offer_id=eq.${encodeURIComponent(
          offerId
        )}&buyer_id=eq.${encodeURIComponent(
          buyerId
        )}&select=id&limit=1`,
        {
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
          },
          cache: "no-store",
        }
      );

      if (!existingResponse.ok) {
        throw new Error(
          "Bestellung konnte nicht geprüft werden."
        );
      }

      const existingOrders = await existingResponse.json();

      // Stripe kann Webhooks mehrfach senden.
      if (
        Array.isArray(existingOrders) &&
        existingOrders.length > 0
      ) {
        continue;
      }

      const offerResponse = await fetch(
        `${supabaseUrl}/rest/v1/ticket_offers?id=eq.${encodeURIComponent(
          offerId
        )}&select=id,seller_id,home,away,match_date,stadium,price_eur,status,reserved_by`,
        {
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
          },
          cache: "no-store",
        }
      );

      if (!offerResponse.ok) {
        throw new Error(
          "Ticketdaten konnten nicht geladen werden."
        );
      }

      const offers =
        (await offerResponse.json()) as TicketOffer[];

      const offer = offers[0];

      if (!offer) {
        throw new Error(
          `Ticket ${offerId} wurde nicht gefunden.`
        );
      }

      const normalReservation =
        offer.status === "reserved" &&
        offer.reserved_by === buyerId;

      const recoverOldPaidPurchase =
        offer.status === "available" &&
        offer.reserved_by === null;

      if (!normalReservation && !recoverOldPaidPurchase) {
        throw new Error(
          `Ticket ${offerId} kann diesem Kauf nicht zugeordnet werden.`
        );
      }

      const ticketPrice = Number(offer.price_eur);

      if (
        !Number.isFinite(ticketPrice) ||
        ticketPrice <= 0
      ) {
        throw new Error("Ungültiger Ticketpreis.");
      }

      const buyerTotal =
        Math.round(ticketPrice * 1.1 * 100) / 100;

      const sellerPayout =
        Math.round(ticketPrice * 0.9 * 100) / 100;

      // Bestellung speichern
      const orderResponse = await fetch(
        `${supabaseUrl}/rest/v1/orders`,
        {
          method: "POST",
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify({
            buyer_id: buyerId,
            seller_id: offer.seller_id,
            offer_id: offer.id,
            home: offer.home,
            away: offer.away,
            match_date: offer.match_date,
            stadium: offer.stadium,
            quantity: 1,
            ticket_price_eur: ticketPrice,
            buyer_total_eur: buyerTotal,
            seller_payout_eur: sellerPayout,
            status: "paid",
            ticket_available: false,
          }),
          cache: "no-store",
        }
      );

      if (!orderResponse.ok) {
        const errorText = await orderResponse.text();
        console.error("Order-Fehler:", errorText);

        throw new Error(
          "Bestellung konnte nicht gespeichert werden."
        );
      }

      // Ticket als verkauft markieren
      const soldResponse = await fetch(
        `${supabaseUrl}/rest/v1/ticket_offers?id=eq.${encodeURIComponent(
          offerId
        )}`,
        {
          method: "PATCH",
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify({
            status: "sold",
            reserved_by: buyerId,
            reserved_until: null,
          }),
          cache: "no-store",
        }
      );

      if (!soldResponse.ok) {
        throw new Error(
          "Ticket konnte nicht als verkauft gespeichert werden."
        );
      }

      /*
       * Käuferdaten laden
       */
      let buyerProfile: BuyerProfile = {};

      try {
        const buyerProfileResponse = await fetch(
          `${supabaseUrl}/rest/v1/buyer_profiles?user_id=eq.${encodeURIComponent(
            buyerId
          )}&select=first_name,last_name,phone&limit=1`,
          {
            headers: {
              apikey: serviceKey,
              Authorization: `Bearer ${serviceKey}`,
            },
            cache: "no-store",
          }
        );

        if (buyerProfileResponse.ok) {
          const profiles =
            (await buyerProfileResponse.json()) as BuyerProfile[];

          buyerProfile = profiles[0] ?? {};
        }
      } catch (error) {
        console.error(
          "Käuferprofil konnte nicht geladen werden:",
          error
        );
      }

      /*
       * Verkäufer-E-Mail über Supabase Auth laden
       */
      let sellerEmail = "";

      try {
        const sellerAuthResponse = await fetch(
          `${supabaseUrl}/auth/v1/admin/users/${encodeURIComponent(
            offer.seller_id
          )}`,
          {
            headers: {
              apikey: serviceKey,
              Authorization: `Bearer ${serviceKey}`,
            },
            cache: "no-store",
          }
        );

        if (sellerAuthResponse.ok) {
          const sellerUser =
            await sellerAuthResponse.json();

          if (typeof sellerUser?.email === "string") {
            sellerEmail = sellerUser.email.trim();
          }
        } else {
          console.error(
            "Verkäufer-E-Mail konnte nicht geladen werden:",
            await sellerAuthResponse.text()
          );
        }
      } catch (error) {
        console.error(
          "Fehler beim Laden der Verkäufer-E-Mail:",
          error
        );
      }

      /*
       * Verkäufer benachrichtigen.
       * Ein Mailfehler darf einen bereits bezahlten Kauf
       * NICHT rückgängig machen.
       */
      if (resendApiKey && sellerEmail) {
        try {
          const buyerName = [
            buyerProfile.first_name,
            buyerProfile.last_name,
          ]
            .filter(Boolean)
            .join(" ")
            .trim();

          const buyerPhone =
            buyerProfile.phone?.trim() || "Nicht angegeben";

          const safeBuyerName =
            buyerName || "Nicht angegeben";

          const safeBuyerEmail =
            buyerEmail || "Nicht angegeben";

          const emailResponse = await fetch(
            RESEND_API_URL,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${resendApiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: "PaseSpain <tickets@pasespain.es>",
                to: [sellerEmail],
                subject: `Ticket verkauft: ${offer.home} – ${offer.away}`,
                html: `
                  <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;line-height:1.6;color:#111;">
                    <h2>Dein Ticket wurde verkauft</h2>

                    <p>
                      Ein Käufer hat dein Ticket auf PaseSpain
                      erfolgreich gekauft und bezahlt.
                    </p>

                    <h3>Spiel</h3>

                    <p>
                      <strong>${escapeHtml(offer.home)} – ${escapeHtml(
                        offer.away
                      )}</strong><br>
                      ${escapeHtml(offer.match_date || "")}<br>
                      ${escapeHtml(offer.stadium || "")}
                    </p>

                    <h3>Käufer</h3>

                    <p>
                      Name: <strong>${escapeHtml(
                        safeBuyerName
                      )}</strong><br>
                      E-Mail: ${escapeHtml(safeBuyerEmail)}<br>
                      Telefon: ${escapeHtml(buyerPhone)}
                    </p>

                    <h3>Verkauf</h3>

                    <p>
                      Ticketpreis: € ${ticketPrice.toFixed(2)}<br>
                      Deine Auszahlung: <strong>€ ${sellerPayout.toFixed(
                        2
                      )}</strong>
                    </p>

                    <p>
                      Bitte stelle dem Käufer das gekaufte Ticket
                      entsprechend der PaseSpain-Abwicklung zur Verfügung.
                    </p>

                    <p>
                      PaseSpain
                    </p>
                  </div>
                `,
              }),
            }
          );

          if (!emailResponse.ok) {
            console.error(
              "Resend Verkäufer-Mail fehlgeschlagen:",
              await emailResponse.text()
            );
          } else {
            console.log(
              `Verkäufer ${sellerEmail} wurde über den Kauf informiert.`
            );
          }
        } catch (emailError) {
          console.error(
            "Verkäufer-Mail konnte nicht gesendet werden:",
            emailError
          );
        }
      } else {
        if (!resendApiKey) {
          console.error(
            "RESEND_API_KEY fehlt – Verkäufer-Mail nicht gesendet."
          );
        }

        if (!sellerEmail) {
          console.error(
            `Keine Verkäufer-E-Mail für ${offer.seller_id} gefunden.`
          );
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(
      "PaseSpain Stripe Webhook Fehler:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Webhook konnte nicht verarbeitet werden.",
      },
      { status: 500 }
    );
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}