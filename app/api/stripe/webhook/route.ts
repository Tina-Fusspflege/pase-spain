import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createHash } from "node:crypto";
import { getStripe } from "../../../lib/stripe";

const RESEND_API_URL = "https://api.resend.com/emails";

type TicketOffer = {
  id: string;
  seller_id: string;
  home: string;
  away: string;
  match_date: string;
  stadium: string;
  price_eur: number;
  quantity?: number | null;
  details?: string | null;
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
      event = getStripe().webhooks.constructEvent(
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

    if (event.type !== "checkout.session.completed" && event.type !== "checkout.session.async_payment_succeeded") {
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

    let mailFailed = false;
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

      // Existing orders must still resume unfinished notifications.
      const orderExists = Array.isArray(existingOrders) && existingOrders.length > 0;

      const offerResponse = await fetch(
        `${supabaseUrl}/rest/v1/ticket_offers?id=eq.${encodeURIComponent(
          offerId
        )}&select=id,seller_id,home,away,match_date,stadium,price_eur,quantity,details,status,reserved_by`,
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

      const completedPurchase = orderExists && offer.status === "sold" && offer.reserved_by === buyerId;
      if (!normalReservation && !recoverOldPaidPurchase && !completedPurchase) {
        throw new Error(
          `Ticket ${offerId} kann diesem Kauf nicht zugeordnet werden.`
        );
      }

      const ticketQuantity = Number(offer.details?.match(/Anzahl Tickets:\s*(\d+)/i)?.[1] || offer.quantity || 1);
      const ticketPrice = Number(offer.price_eur) * ticketQuantity;

      if (
        !Number.isFinite(ticketPrice) ||
        ticketPrice <= 0
      ) {
        throw new Error("Ungültiger Ticketpreis.");
      }

      const buyerTotal =
        Math.round(ticketPrice * 1.1 * 100) / 100;

      const buyerFee =
        Math.round((buyerTotal - ticketPrice) * 100) / 100;

      const sellerPayout =
        Math.round(ticketPrice * 0.9 * 100) / 100;

      const sellerFee =
        Math.round((ticketPrice - sellerPayout) * 100) / 100;

      // The database locks the offer and commits order + sold status together.
      const orderResponse = await fetch(
        `${supabaseUrl}/rest/v1/rpc/complete_ticket_order`,
        {
          method: "POST",
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            p_offer_id: offer.id,
            p_buyer_id: buyerId,
            p_session_id: session.id,
          }),
          cache: "no-store",
        }
      );
      if (!orderResponse.ok) throw new Error("Bestellung konnte nicht gespeichert werden.");
      const orderId = await orderResponse.json() as string;

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
        } else {
          throw new Error("Käuferprofil konnte nicht geladen werden.");
        }
      } catch (error) {
        throw new Error("Käuferprofil konnte nicht geladen werden; Benachrichtigung wird erneut versucht.", { cause: error });
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

      /*
       * Verkäufer benachrichtigen.
       * Ein Mailfehler darf einen bereits bezahlten Kauf
       * NICHT rückgängig machen.
       */
      if (resendApiKey && sellerEmail) {
        try {
          const emailResponse = await sendNotification(
            session.id, offerId, "seller",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${resendApiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: process.env.RESEND_FROM_EMAIL || "PaseSpain <tickets@pasespain.es>",
                to: [sellerEmail],
                subject: `Ticket verkauft: ${offer.home} – ${offer.away}`,
                html: `
                  <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;line-height:1.6;color:#111;">
                    <h2>Dein Ticket wurde verkauft</h2>

                    <p>
                      Ein Käufer hat dein Ticket auf PaseSpain
                      erfolgreich gekauft und bezahlt.
                    </p>

                    <p>Bestellnummer: ${escapeHtml(orderId)}</p>
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
                      PaseSpain Verkäufergebühr: € ${sellerFee.toFixed(2)}<br>
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
            mailFailed = true;
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
          mailFailed = true;
          console.error(
            "Verkäufer-Mail konnte nicht gesendet werden:",
            emailError
          );
        }
      } else {
        mailFailed = true;
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

      /*
       * Käufer über den erfolgreichen Kauf informieren.
       * Auch hier darf ein Mailfehler den Kauf NICHT rückgängig machen.
       */
      if (resendApiKey && buyerEmail) {
        try {
          const buyerEmailResponse = await sendNotification(
            session.id, offerId, "buyer",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${resendApiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: process.env.RESEND_FROM_EMAIL || "PaseSpain <tickets@pasespain.es>",
                to: [buyerEmail],
                subject: `Kauf bestätigt: ${offer.home} – ${offer.away}`,
                html: `
                  <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;line-height:1.6;color:#111;">
                    <h2>Dein Kauf ist bestätigt</h2>

                    <p>
                      Hallo ${escapeHtml(
                        buyerProfile.first_name?.trim() || ""
                      )},
                    </p>

                    <p>
                      deine Zahlung war erfolgreich.
                      Hier findest du die Zusammenfassung deines Kaufs.
                    </p>

                    <p>Bestellnummer: ${escapeHtml(orderId)}</p>
                    <h3>Dein Ticket</h3>

                    <p>
                      <strong>${escapeHtml(offer.home)} – ${escapeHtml(
                        offer.away
                      )}</strong><br>
                      ${escapeHtml(offer.match_date || "")}<br>
                      ${escapeHtml(offer.stadium || "")}
                    </p>

                    <h3>Zahlung</h3>

                    <p>
                      Ticketpreis: € ${ticketPrice.toFixed(2)}<br>
                      PaseSpain Käufergebühr: € ${buyerFee.toFixed(2)}<br>
                      <strong>Gesamt bezahlt: € ${buyerTotal.toFixed(
                        2
                      )}</strong>
                    </p>

                    <h3>Wie geht es weiter?</h3>

                    <p>
                      Du findest deinen Kauf in deinem Käuferkonto auf PaseSpain.
                      Der Verkäufer ist für die Bereitstellung des gekauften Tickets verantwortlich.
                    </p>

                    <p>
                      Bewahre diese E-Mail als Kaufbestätigung auf.
                    </p>

                    <p>
                      PaseSpain
                    </p>
                  </div>
                `,
              }),
            }
          );

          if (!buyerEmailResponse.ok) {
            mailFailed = true;
            console.error(
              "Resend Käufer-Mail fehlgeschlagen:",
              await buyerEmailResponse.text()
            );
          } else {
            console.log(
              `Käufer ${buyerEmail} wurde über den Kauf informiert.`
            );
          }
        } catch (emailError) {
          mailFailed = true;
          console.error(
            "Käufer-Mail konnte nicht gesendet werden:",
            emailError
          );
        }
      } else {
        mailFailed = true;
        console.error(
          `Keine Käufer-E-Mail für ${buyerId} gefunden.`
        );
      }
    }

    if (mailFailed) throw new Error("Kauf gespeichert; Benachrichtigung ausstehend. Stripe soll die Zustellung erneut versuchen.");
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

// Stripe metadata persists beyond Resend's 24-hour idempotency window.
// Store provider acceptance, not inbox delivery. No recipient data is stored.
async function sendNotification(sessionId: string, offerId: string, role: "seller" | "buyer", init: RequestInit) {
  const marker = `mail_${role}_${createHash("sha256").update(offerId).digest("hex").slice(0, 24)}`;
  const current = await getStripe().checkout.sessions.retrieve(sessionId);
  if (current.metadata?.[marker]) return new Response(null, { status: 200 });
  const response = await fetch(RESEND_API_URL, {
    ...init,
    headers: { ...init.headers, "Idempotency-Key": `${sessionId}/${offerId}/${role}` },
    signal: AbortSignal.timeout(10000),
  });
  if (response.ok) {
    const result = await response.clone().json() as { id?: string };
    if (!result.id) throw new Error("Mailanbieter hat keine Versand-ID bestätigt.");
    await getStripe().checkout.sessions.update(sessionId, { metadata: { [marker]: result.id } });
  }
  return response;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
