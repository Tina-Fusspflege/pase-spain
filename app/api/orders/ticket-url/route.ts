import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Nicht angemeldet." },
        { status: 401 }
      );
    }

    const accessToken = authorization.slice(7);

    const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    if (!userResponse.ok) {
      return NextResponse.json(
        { error: "Käufer konnte nicht bestätigt werden." },
        { status: 401 }
      );
    }

    const user = await userResponse.json();

    const body = await request.json();
    const orderId = String(body?.orderId ?? "");

    if (!orderId) {
      return NextResponse.json(
        { error: "Bestellung fehlt." },
        { status: 400 }
      );
    }

    // Prüfen, ob diese Bestellung dem Käufer gehört
    const orderResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/orders?id=eq.${encodeURIComponent(
        orderId
      )}&buyer_id=eq.${encodeURIComponent(
        user.id
      )}&ticket_available=eq.true&select=id`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      }
    );

    const orders = await orderResponse.json();

    if (!orderResponse.ok || !Array.isArray(orders) || orders.length === 0) {
      return NextResponse.json(
        { error: "Ticket ist noch nicht verfügbar." },
        { status: 404 }
      );
    }

    // Dateien für diese Bestellung suchen
    const listResponse = await fetch(
      `${SUPABASE_URL}/storage/v1/object/list/tickets`,
      {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prefix: orderId,
          limit: 10,
          offset: 0,
        }),
      }
    );

    if (!listResponse.ok) {
      return NextResponse.json(
        { error: "Ticketdatei wurde nicht gefunden." },
        { status: 404 }
      );
    }

    const files = await listResponse.json();

    if (!Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { error: "Ticketdatei wurde nicht gefunden." },
        { status: 404 }
      );
    }

    const fileName = files[0]?.name;

    if (!fileName) {
      return NextResponse.json(
        { error: "Ticketdatei wurde nicht gefunden." },
        { status: 404 }
      );
    }

    const filePath = `${orderId}/${fileName}`;

    // Zeitlich begrenzten Download-Link erstellen
    const signedResponse = await fetch(
      `${SUPABASE_URL}/storage/v1/object/sign/tickets/${filePath}`,
      {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          expiresIn: 300,
        }),
      }
    );

    const signed = await signedResponse.json();

    if (!signedResponse.ok || !signed?.signedURL) {
      return NextResponse.json(
        { error: "Ticket konnte nicht geöffnet werden." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: `${SUPABASE_URL}/storage/v1${signed.signedURL}`,
    });
  } catch (error) {
    console.error("Ticket URL Fehler:", error);

    return NextResponse.json(
      { error: "Ticket konnte nicht geöffnet werden." },
      { status: 500 }
    );
  }
}