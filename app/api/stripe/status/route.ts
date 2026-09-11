import { NextRequest, NextResponse } from "next/server";
import { stripe } from "../../../lib/stripe";

export async function GET(request: NextRequest) {
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
    const supabaseServiceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

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

    const profileResponse = await fetch(
      `${supabaseUrl}/rest/v1/seller_profiles?user_id=eq.${encodeURIComponent(
        user.id
      )}&select=user_id,stripe_account_id&limit=1`,
      {
        headers: {
          apikey: supabaseServiceRoleKey,
          Authorization: `Bearer ${supabaseServiceRoleKey}`,
        },
        cache: "no-store",
      }
    );

    if (!profileResponse.ok) {
      return NextResponse.json(
        { error: "Verkäuferprofil konnte nicht geladen werden." },
        { status: 500 }
      );
    }

    const profiles = await profileResponse.json();
    const profile = profiles?.[0];

    if (!profile?.stripe_account_id) {
      return NextResponse.json({
        accountId: "",
        connected: false,
        payoutsEnabled: false,
        chargesEnabled: false,
        detailsSubmitted: false,
      });
    }

    const account = await stripe.accounts.retrieve(
      profile.stripe_account_id
    );

    if (
      account.metadata?.pasespain_user_id !== user.id
    ) {
      return NextResponse.json(
        { error: "Stripe-Konto konnte nicht verifiziert werden." },
        { status: 403 }
      );
    }

    return NextResponse.json({
      accountId: account.id,
      connected: true,
      payoutsEnabled: Boolean(account.payouts_enabled),
      chargesEnabled: Boolean(account.charges_enabled),
      detailsSubmitted: Boolean(account.details_submitted),
    });
  } catch (error) {
    console.error("Stripe Status Fehler:", error);

    return NextResponse.json(
      {
        error: "Stripe-Status konnte nicht geprüft werden.",
      },
      {
        status: 500,
      }
    );
  }
}