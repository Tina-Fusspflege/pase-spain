# PaseSpain – aktueller Abschlussstand

Stand: 11. Oktober 2026
Projekt: C:\Users\danie\Documents\Codex\2026-10-11\referenced-chatgpt-conversation-this-is-an\work\pase-spain
GitHub: https://github.com/Tina-Fusspflege/pase-spain, Produktionsbranch master
Vercel: Team tina-fussplfege, Projekt pasespain-glass, Domain https://pasespain.es
Supabase: pasespain, dexahynxtxtheigremlm

## Erledigt
- Supabase-Migrationen 202610110001_orders.sql, 202610110002_order_links.sql und die Validierung aus 202610110003_validate_order_links.sql im richtigen Projekt ausgeführt.
- Die fünf bestehenden Bestellungen bleiben erhalten. Die Verknüpfungen zu Käufer, Verkäufer und Ticket sind für bestehende und neue Bestellungen validiert.
- RLS ist aktiv. Anonyme Nutzer haben keinen Lesezugriff. Angemeldete Nutzer können keine Bestellungen anlegen und den Kaufabschluss nicht aufrufen. Teilnehmer können ihre eigenen Bestellungen lesen; Verkäufer dürfen nur ticket_available ändern.
- Datenbanktest bestanden: zwei Tickets, korrekte Gebühren, Reservierungskonflikt, atomare Speicherung von Bestellung und verkauftem Angebot, wiederholter Abschluss ohne Doppelbestellung, Käufer-/Verkäuferzugriff und Isolation anderer Nutzer. Die Testdatensätze wurden zurückgerollt.
- Checkout und Mailzusammenfassung berücksichtigen die tatsächliche Ticketanzahl.
- Verkäuferkonto bietet Ticketupload bei bezahlten, noch nicht gelieferten Bestellungen und zeigt den Lieferstatus an.
- Smartphone-Preisübersicht und Eingabefehler korrigiert; Mengenfeld startet mit 1.
- Produktionsbuild bestanden (next build --webpack). Geist-Schriften liegen lokal mit Lizenz bei. Build-Verzeichnis .next-pasespain verhindert den ursprünglichen Dateizugriffskonflikt.
- TypeScript, ESLint der geänderten API-Routen/Font-Integration und simulierte Checkout-/Webhook-Tests bestanden.
- Vercel enthält die erforderlichen Produktionsvariablen RESEND_API_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET sowie die drei Supabase-Variablen bereits. Keine Schlüssel wurden ersetzt. Ihre Gültigkeit ist ohne Dienstzugriff noch nicht bestätigt.

## Noch offen
- Aktuellen lokalen Code in GitHub veröffentlichen und Vercel-Build abwarten. Bisherige Produktion ist weiterhin der Commit bd4d157.
- Resend-Absenderdomain pasespain.es und Absender tickets@pasespain.es prüfen. RESEND_API_KEY ist der benötigte geheime Mailprovider-Schlüssel. RESEND_FROM_EMAIL kann optional gesetzt werden; Standard: PaseSpain <tickets@pasespain.es>.
- Stripe-Endpunkt https://pasespain.es/api/stripe/webhook und die Ereignisse checkout.session.completed sowie checkout.session.async_payment_succeeded prüfen. STRIPE_WEBHOOK_SECRET muss genau zu diesem Endpunkt und derselben Test-/Live-Umgebung gehören.
- NEXT_PUBLIC_SITE_URL empfohlen: https://pasespain.es. Ohne diese Variable nutzt Checkout bereits diese Produktionsadresse.
- Vollständiger Testkauf inklusive echter Provider-Mail und Browserprüfung auf Desktop/Handy/iPad nach der Veröffentlichung. Der lokale Stripe-Schlüssel gehört zum Testmodus. Keine echte Zahlung oder Mail ausgelöst.

## Aktuelle Zugriffsgrenzen
Terminalzugriffe auf externe Dienste scheitern an DNS/Netzwerk. Supabase und Vercel konnten stattdessen über den angemeldeten Browser geprüft werden. Browserzugriff auf localhost funktioniert in dieser Umgebung nicht; auch der lokale API-Aufruf wurde von der Netzwerkumgebung blockiert. Daher ist keine visuelle oder echte Zahlungs-/Mailprüfung abgeschlossen.

Die automatische Freigabeprüfung hat das Öffnen des GitHub-Webeditors auf vscode.dev abgelehnt, weil diese zusätzliche Website nicht ausdrücklich freigegeben war. Für diesen Veröffentlichungspfad ist die bereits angefragte ausdrückliche Benutzerfreigabe noch ausstehend. Resend und Stripe stehen ebenfalls noch auf der Anmeldung.

## Geänderte Dateien und Quellen
Kauf: app/api/stripe/checkout/route.ts, app/api/stripe/webhook/route.ts, app/Home.tsx.
Datenbank: supabase/migrations/202610110001_orders.sql, 202610110002_order_links.sql, 202610110003_validate_order_links.sql, supabase/tests/orders_rls.sql.
Build: app/layout.tsx, app/fonts/*, package.json, next.config.ts, tsconfig.json, .gitignore.
Tests: tests/orders-checkout.cjs, tests/orders-webhook.cjs.
Die bereits vorhandenen lokalen Änderungen an Spielseiten, CSS und SEO bleiben enthalten; sie wurden nicht rückgängig gemacht.

Schriftquelle und Lizenz: https://github.com/vercel/geist-font/blob/main/LICENSE.txt
Provider-Referenzen: https://resend.com/changelog/idempotency-keys und https://docs.stripe.com/api/events/list
