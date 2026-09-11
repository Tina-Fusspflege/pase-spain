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

    // 1. Eingeloggten Benutzer sicher über Supabase prüfen
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

    // 2. Verkäuferprofil serverseitig laden
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

    if (!profile?.user_id) {
      return NextResponse.json(
        { error: "Kein Verkäuferprofil gefunden." },
        { status: 403 }
      );
    }

    // 3. Bereits vorhandenes Stripe-Konto wiederverwenden
    if (profile.stripe_account_id) {
      const existingAccount = await stripe.accounts.retrieve(
        profile.stripe_account_id
      );

      if (
        existingAccount.metadata?.pasespain_user_id !== user.id
      ) {
        return NextResponse.json(
          { error: "Stripe-Konto konnte nicht verifiziert werden." },
          { status: 403 }
        );
      }

      return NextResponse.json({
        accountId: profile.stripe_account_id,
      });
    }

    // 4. Noch kein Stripe-Konto vorhanden -> neu erstellen
    const account = await stripe.accounts.create({
      country: "ES",

      controller: {
        stripe_dashboard: {
          type: "express",
        },
        fees: {
          payer: "application",
        },
        losses: {
          payments: "application",
        },
        requirement_collection: "stripe",
      },

      capabilities: {
        card_payments: {
          requested: true,
        },
        transfers: {
          requested: true,
        },
      },

      metadata: {
        pasespain_user_id: user.id,
      },
    });

    // 5. Stripe Account-ID sicher im Verkäuferprofil speichern
    const updateResponse = await fetch(
      `${supabaseUrl}/rest/v1/seller_profiles?user_id=eq.${encodeURIComponent(
        user.id
      )}`,
      {
        method: "PATCH",
        headers: {
          apikey: supabaseServiceRoleKey,
          Authorization: `Bearer ${supabaseServiceRoleKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          stripe_account_id: account.id,
        }),
      }
    );

    if (!updateResponse.ok) {
      console.error(
        "Stripe Account-ID konnte nicht in Supabase gespeichert werden."
      );

      return NextResponse.json(
        {
          error:
            "Stripe-Konto wurde erstellt, konnte aber nicht gespeichert werden.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      accountId: account.id,
    });
  } catch (error) {
    console.error("Stripe Connect Fehler:", error);

    return NextResponse.json(
      {
        error: "Stripe Connect Konto konnte nicht erstellt werden.",
      },
      {
        status: 500,
      }
    );
  }
}