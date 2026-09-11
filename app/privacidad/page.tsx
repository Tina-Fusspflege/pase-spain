"use client";

import { useEffect, useState } from "react";

type Lang = "es" | "ca" | "en" | "de";

const content = {"es": [["Política de Privacidad"], [["1. Responsable", "PaseSpain, Carrer el Palmeral 20, 12560 Benicàssim, Castelló, España."], ["2. Datos tratados", "Nombre, correo, teléfono, tipo de cuenta, autenticación, perfil de vendedor, ofertas, pedidos, transacciones, reembolsos, reclamaciones, IP y registros técnicos."], ["3. Finalidades", "Gestión de cuentas, publicación y compra de entradas, pagos, soporte, prevención del fraude y obligaciones legales."], ["4. Bases jurídicas", "Ejecución del contrato, obligaciones legales, intereses legítimos y consentimiento cuando sea necesario."], ["5. Proveedores", "Supabase para autenticación/base de datos, Vercel para alojamiento y Stripe para pagos."], ["6. Transferencias internacionales", "Cuando haya tratamiento fuera del EEE se aplicará un mecanismo válido conforme al RGPD."], ["7. Conservación", "Los datos se conservan solo durante el tiempo necesario y los plazos legales aplicables."], ["8. Derechos", "Acceso, rectificación, supresión, limitación, portabilidad, oposición y retirada del consentimiento cuando proceda. Contacto: pasespain@hotmail.com."], ["9. Reclamaciones", "Puede reclamarse ante la autoridad competente, incluida la AEPD cuando corresponda."], ["10. Cookies", "Las cookies no esenciales de análisis, publicidad o seguimiento requieren una base legal válida, normalmente consentimiento."], ["11. Seguridad", "PaseSpain aplica medidas técnicas y organizativas razonables y no debe almacenar contraseñas en texto plano."]]], "ca": [["Política de Privacitat"], [["1. Responsable", "PaseSpain, Carrer el Palmeral 20, 12560 Benicàssim, Castelló, Espanya."], ["2. Dades", "Nom, correu, telèfon, compte, autenticació, perfil, ofertes, comandes, transaccions, reemborsaments, reclamacions, IP i registres tècnics."], ["3. Finalitats", "Comptes, entrades, pagaments, suport, prevenció del frau i obligacions legals."], ["4. Bases jurídiques", "Contracte, obligacions legals, interessos legítims i consentiment quan calgui."], ["5. Proveïdors", "Supabase, Vercel i Stripe."], ["6. Transferències", "Quan hi hagi tractament fora de l'EEE s'aplicarà un mecanisme vàlid del RGPD."], ["7. Conservació", "Només durant el temps necessari i els terminis legals."], ["8. Drets", "Accés, rectificació, supressió, limitació, portabilitat, oposició i retirada del consentiment. Contacte: pasespain@hotmail.com."], ["9. Reclamacions", "Es pot reclamar davant l'autoritat de protecció de dades competent."], ["10. Cookies", "Les cookies no essencials requereixen una base legal vàlida."], ["11. Seguretat", "PaseSpain aplica mesures tècniques i organitzatives raonables."]]], "en": [["Privacy Policy"], [["1. Controller", "PaseSpain, Carrer el Palmeral 20, 12560 Benicàssim, Castelló, Spain."], ["2. Data processed", "Name, email, phone, account type, authentication data, seller profile, listings, orders, transactions, refunds, complaints, IP and technical logs."], ["3. Purposes", "Account management, ticket listings and purchases, payments, support, fraud prevention and legal obligations."], ["4. Legal bases", "Contract performance, legal obligations, legitimate interests and consent where required."], ["5. Providers", "Supabase for authentication/database, Vercel for hosting and Stripe for payments."], ["6. International transfers", "A valid GDPR transfer mechanism will be used where processing occurs outside the EEA."], ["7. Retention", "Data is kept only as long as necessary and for applicable legal retention periods."], ["8. Rights", "Access, rectification, erasure, restriction, portability, objection and withdrawal of consent where applicable. Contact: pasespain@hotmail.com."], ["9. Complaints", "Data subjects may complain to the competent supervisory authority."], ["10. Cookies", "Non-essential analytics, advertising or tracking cookies require a valid legal basis, normally consent."], ["11. Security", "PaseSpain applies reasonable technical and organisational measures."]]], "de": [["Datenschutzerklärung"], [["1. Verantwortlicher", "PaseSpain, Carrer el Palmeral 20, 12560 Benicàssim, Castelló, Spanien."], ["2. Verarbeitete Daten", "Name, E-Mail, Telefon, Kontotyp, Authentifizierungsdaten, Verkäuferprofil, Ticketangebote, Bestellungen, Transaktionen, Rückerstattungen, Beschwerden, IP und technische Protokolle."], ["3. Zwecke", "Kontoverwaltung, Ticketangebote und Käufe, Zahlungen, Support, Betrugsprävention und gesetzliche Pflichten."], ["4. Rechtsgrundlagen", "Vertragserfüllung, gesetzliche Pflichten, berechtigte Interessen und gegebenenfalls Einwilligung."], ["5. Dienstleister", "Supabase für Authentifizierung/Datenbank, Vercel für Hosting und Stripe für Zahlungen."], ["6. Drittlandübermittlungen", "Bei Verarbeitung ausserhalb des EWR wird ein zulässiger DSGVO-Mechanismus eingesetzt."], ["7. Speicherdauer", "Nur solange erforderlich und entsprechend gesetzlicher Aufbewahrungsfristen."], ["8. Rechte", "Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit, Widerspruch und ggf. Widerruf. Kontakt: pasespain@hotmail.com."], ["9. Beschwerderecht", "Beschwerden können bei der zuständigen Datenschutzaufsichtsbehörde eingereicht werden."], ["10. Cookies", "Nicht notwendige Analyse-, Werbe- oder Tracking-Cookies benötigen eine gültige Rechtsgrundlage, grundsätzlich Einwilligung."], ["11. Sicherheit", "PaseSpain setzt angemessene technische und organisatorische Schutzmassnahmen ein."]]]};

function getLang(v: string | null): Lang {
  return v === "ca" || v === "en" || v === "de" ? v : "es";
}

export default function LegalPage() {
  const [lang, setLang] = useState<Lang>("es");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setLang(getLang(params.get("lang")));
  }, []);

  const title = content[lang][0][0];
  const sections = content[lang][1];

  const back =
    lang === "es" ? "Volver a PaseSpain" :
    lang === "ca" ? "Tornar a PaseSpain" :
    lang === "en" ? "Back to PaseSpain" :
    "Zurück zu PaseSpain";

  return (
    <main className="legal-shell">
      <div className="legal-card">
        <div className="legal-top">
          <a href="/">{back}</a>
          <div className="legal-lang">
            {(["es","ca","en","de"] as Lang[]).map((l) => (
              <a key={l} className={l === lang ? "active" : ""} href={`?lang=${l}`}>
                {l.toUpperCase()}
              </a>
            ))}
          </div>
        </div>

        <h1>{title}</h1>

        {sections.map((section) => {
          const heading = String(section[0]);
          const body = String(section[1]);

          return (
            <section key={heading}>
              <h2>{heading}</h2>
              <p dangerouslySetInnerHTML={{ __html: body }} />
            </section>
          );
        })}

        <div className="legal-note">
          PaseSpain · Stand 02.09.2026
        </div>
      </div>

      <style jsx>{`
        .legal-shell {
          min-height: 100vh;
          box-sizing: border-box;
          padding: 32px 18px 70px;
          color: #111827;
          background: #ffffff;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
        .legal-card {
          width: min(920px, 100%);
          box-sizing: border-box;
          margin: 0 auto;
          padding: 34px;
          background: #ffffff;
          border: 1px solid rgba(15,42,95,.16);
          border-radius: 26px;
          box-shadow: 0 18px 50px rgba(15,42,95,.08);
        }
        .legal-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 28px;
        }
        .legal-top a, .legal-lang a {
          color: #0F2A5F;
          text-decoration: none;
        }
        .legal-top > a { opacity: .82; }
        .legal-lang a { margin-left: 12px; opacity: .55; }
        .legal-lang a.active { opacity: 1; font-weight: 800; }
        h1 {
          margin: 0 0 28px;
          font-size: clamp(34px,5vw,58px);
          letter-spacing: -.04em;
        }
        h2 { margin: 24px 0 8px; font-size: 18px; }
        p { margin: 0; line-height: 1.62; color: #374151; }
        .legal-note {
          margin-top: 34px;
          padding-top: 20px;
          border-top: 1px solid rgba(15,42,95,.14);
          font-size: 13px;
          color: #6B7280;
        }
        @media (max-width:700px) {
          .legal-card { padding: 24px 20px; border-radius: 18px; }
          .legal-top { align-items: flex-start; flex-direction: column; }
          .legal-lang a { margin-left: 0; margin-right: 12px; }
        }
      `}</style>
    </main>
  );
}
