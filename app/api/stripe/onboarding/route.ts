import { NextRequest, NextResponse } from "next/server";
import { stripe } from "../../../lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Nicht autorisiert." },
        { status: 401 }
      );
    }

    const accessToken = authHeader.replace("Bearer ", "").trim();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabasePublishableKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabasePublishableKey) {
      return NextResponse.json(
        { error: "Supabase-Konfiguration fehlt." },
        { status: 500 }
      );
    }

    const userResponse = await fetch(
      `${supabaseUrl}/auth/v1/user`,
      {
        method: "GET",
        headers: {
          apikey: supabasePublishableKey,
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      }
    );

    if (!userResponse.ok) {
      return NextResponse.json(
        { error: "Ungültige oder abgelaufene Anmeldung." },
        { status: 401 }
      );
    }

    const user = await userResponse.json();

    if (!user?.id) {
      return NextResponse.json(
        { error: "Benutzer konnte nicht verifiziert werden." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const accountId = String(body?.accountId || "").trim();

    if (!accountId) {
      return NextResponse.json(
        { error: "Keine Stripe Account-ID übergeben." },
        { status: 400 }
      );
    }

    const account = await stripe.accounts.retrieve(accountId);

    if (
      account.metadata?.pasespain_user_id !== user.id
    ) {
      return NextResponse.json(
        { error: "Dieses Stripe-Konto gehört nicht zu diesem Benutzer." },
        { status: 403 }
      );
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url:
        "https://www.pasespain.es/?stripe=refresh",
      return_url:
        "https://www.pasespain.es/?stripe=success",
      type: "account_onboarding",
    });

    return NextResponse.json({
      url: accountLink.url,
    });
  } catch (error) {
    console.error("Stripe Onboarding Fehler:", error);

    return NextResponse.json(
      {
        error: "Stripe Onboarding-Link konnte nicht erstellt werden.",
      },
      {
        status: 500,
      }
    );
  }
}