import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export async function GET(request: Request) {
  try {
    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Nicht angemeldet." },
        { status: 401 }
      );
    }

    const accessToken = authorization.slice(7);

    // Angemeldeten Benutzer bestimmen
    const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    if (!userResponse.ok) {
      return NextResponse.json(
        { error: "Benutzer konnte nicht bestätigt werden." },
        { status: 401 }
      );
    }

    const user = await userResponse.json();

    if (!user?.id) {
      return NextResponse.json(
        { error: "Benutzer-ID fehlt." },
        { status: 401 }
      );
    }

    // Bestellungen ausschließlich für diesen Käufer laden
    const ordersResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/orders?buyer_id=eq.${encodeURIComponent(
        user.id
      )}&select=*&order=created_at.desc`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        cache: "no-store",
      }
    );

    if (!ordersResponse.ok) {
      const error = await ordersResponse.text();

      return NextResponse.json(
        { error: error || "Tickets konnten nicht geladen werden." },
        { status: ordersResponse.status }
      );
    }

    const orders = await ordersResponse.json();

    return NextResponse.json({
      orders: Array.isArray(orders) ? orders : [],
    });
  } catch (error) {
    console.error("Buyer Orders Fehler:", error);

    return NextResponse.json(
      { error: "Tickets konnten nicht geladen werden." },
      { status: 500 }
    );
  }
}