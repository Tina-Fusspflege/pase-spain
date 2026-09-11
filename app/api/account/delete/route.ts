import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

function jsonError(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    { status }
  );
}

export async function DELETE(request: NextRequest) {
  if (
    !SUPABASE_URL ||
    !SUPABASE_PUBLISHABLE_KEY ||
    !SUPABASE_SERVICE_ROLE_KEY
  ) {
    return jsonError(
      "Kontolöschung ist serverseitig noch nicht vollständig konfiguriert.",
      500
    );
  }

  const authorization =
    request.headers.get("authorization") ?? "";

  if (!authorization.startsWith("Bearer ")) {
    return jsonError(
      "Nicht angemeldet.",
      401
    );
  }

  const accessToken =
    authorization.slice(7).trim();

  if (!accessToken) {
    return jsonError(
      "Nicht angemeldet.",
      401
    );
  }

  try {
    // 1. Das Supabase-Access-Token selbst prüfen.
    //    Die User-ID wird niemals aus dem Browser-Body übernommen.
    const userResponse =
      await fetch(
        `${SUPABASE_URL}/auth/v1/user`,
        {
          headers: {
            apikey:
              SUPABASE_PUBLISHABLE_KEY,
            Authorization:
              `Bearer ${accessToken}`,
          },
          cache: "no-store",
        }
      );

    if (!userResponse.ok) {
      return jsonError(
        "Sitzung ungültig oder abgelaufen. Bitte erneut anmelden.",
        401
      );
    }

    const user =
      await userResponse.json() as {
        id?: string;
      };

    if (!user.id) {
      return jsonError(
        "Benutzerkonto konnte nicht eindeutig bestimmt werden.",
        401
      );
    }

    const userId =
      encodeURIComponent(user.id);

    const adminHeaders = {
      apikey:
        SUPABASE_SERVICE_ROLE_KEY,
      Authorization:
        `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    };

    // 2. Aktive Verkäuferangebote entfernen.
    const offersResponse =
      await fetch(
        `${SUPABASE_URL}/rest/v1/ticket_offers?seller_id=eq.${userId}`,
        {
          method: "DELETE",
          headers: {
            ...adminHeaders,
            Prefer: "return=minimal",
          },
        }
      );

    if (!offersResponse.ok) {
      throw new Error(
        "Ticketangebote konnten nicht entfernt werden."
      );
    }

    // 3. Käufer- und Verkäuferprofil entfernen.
    for (
      const table of [
        "buyer_profiles",
        "seller_profiles",
      ]
    ) {
      const profileResponse =
        await fetch(
          `${SUPABASE_URL}/rest/v1/${table}?user_id=eq.${userId}`,
          {
            method: "DELETE",
            headers: {
              ...adminHeaders,
              Prefer: "return=minimal",
            },
          }
        );

      if (!profileResponse.ok) {
        throw new Error(
          "Profildaten konnten nicht vollständig entfernt werden."
        );
      }
    }

    // 4. Erst am Schluss das Auth-Konto löschen.
    const authDeleteResponse =
      await fetch(
        `${SUPABASE_URL}/auth/v1/admin/users/${userId}`,
        {
          method: "DELETE",
          headers: {
            ...adminHeaders,
            "Content-Type":
              "application/json",
          },
        }
      );

    if (!authDeleteResponse.ok) {
      throw new Error(
        "Supabase-Login konnte nicht gelöscht werden."
      );
    }

    return NextResponse.json({
      deleted: true,
    });
  } catch (error) {
    console.error(
      "PaseSpain Account Delete Fehler:",
      error
    );

    return jsonError(
      "Konto konnte nicht vollständig gelöscht werden. Bitte den Support kontaktieren.",
      500
    );
  }
}