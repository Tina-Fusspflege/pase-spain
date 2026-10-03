import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

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

    const ordersResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/orders?seller_id=eq.${encodeURIComponent(
        user.id
      )}&select=*&order=created_at.desc`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      }
    );

    if (!ordersResponse.ok) {
      const error = await ordersResponse.text();

      return NextResponse.json(
        { error: error || "Verkäufe konnten nicht geladen werden." },
        { status: ordersResponse.status }
      );
    }

    const orders = await ordersResponse.json();

    return NextResponse.json({
      orders: Array.isArray(orders) ? orders : [],
    });
  } catch (error) {
    console.error("Seller Orders Fehler:", error);

    return NextResponse.json(
      { error: "Verkäufe konnten nicht geladen werden." },
      { status: 500 }
    );
  }
}