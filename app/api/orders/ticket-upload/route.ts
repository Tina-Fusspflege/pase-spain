import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
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
        { error: "Verkäufer konnte nicht bestätigt werden." },
        { status: 401 }
      );
    }

    const user = await userResponse.json();

    const formData = await request.formData();
    const orderId = String(formData.get("orderId") ?? "");
    const file = formData.get("file");

    if (!orderId || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Bestellung oder Ticket fehlt." },
        { status: 400 }
      );
    }

    // Prüfen, ob diese Bestellung wirklich diesem Verkäufer gehört
    const orderResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/orders?id=eq.${encodeURIComponent(
        orderId
      )}&seller_id=eq.${encodeURIComponent(user.id)}&select=id`,
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
        { error: "Bestellung nicht gefunden." },
        { status: 404 }
      );
    }

    const extension = file.name.split(".").pop() || "pdf";
    const filePath = `${orderId}/ticket.${extension}`;

    // Ticket in Supabase Storage hochladen
    const uploadResponse = await fetch(
      `${SUPABASE_URL}/storage/v1/object/tickets/${filePath}`,
      {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": file.type || "application/octet-stream",
          "x-upsert": "true",
        },
        body: await file.arrayBuffer(),
      }
    );

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text();
      return NextResponse.json(
        { error: error || "Ticket konnte nicht hochgeladen werden." },
        { status: 500 }
      );
    }

    // Bestellung als Ticket verfügbar markieren
    const updateResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}`,
      {
        method: "PATCH",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          ticket_available: true,
        }),
      }
    );

    if (!updateResponse.ok) {
      const error = await updateResponse.text();
      return NextResponse.json(
        { error: error || "Ticketstatus konnte nicht gespeichert werden." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      ticketAvailable: true,
    });
  } catch (error) {
    console.error("Ticket Upload Fehler:", error);

    return NextResponse.json(
      { error: "Ticket konnte nicht hochgeladen werden." },
      { status: 500 }
    );
  }
}