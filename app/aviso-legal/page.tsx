"use client";

import { useEffect, useState } from "react";

type Lang = "es" | "ca" | "en" | "de";

const content = {"es": [["Aviso Legal"], [["1. Operador", "PaseSpain<br/>Carrer el Palmeral 20<br/>12560 Benicàssim, Castelló, España"], ["2. Contacto", "Email: pasespain@hotmail.com<br/>Teléfono: +34624860990<br/>Web: www.pasespain.es"], ["3. Actividad", "PaseSpain opera una plataforma online para compra, venta o intermediación de entradas de fútbol."], ["4. Mercado online", "Salvo indicación expresa, el vendedor de una entrada de terceros es la parte contractual del comprador respecto de esa entrada."], ["5. Pagos", "Los pagos se procesan mediante Stripe."], ["6. Protección de datos", "La información está disponible en la Política de Privacidad."], ["7. Consumidores", "Antes de pagar se muestran el precio total y la información contractual esencial."], ["8. Reventa", "Solo pueden ofrecerse entradas cuya posesión, transmisión y reventa sean legales conforme a las reglas del organizador y la normativa aplicable."], ["9. Propiedad intelectual", "Los derechos de PaseSpain y de terceros permanecen reservados."], ["10. Contenido ilícito", "Denuncias sobre fraude o infracciones: daniel.leeman@hotmail.com."], ["11. Inteligencia artificial", "Algunos textos y elementos gráficos de este sitio web pueden haber sido creados o editados con ayuda de inteligencia artificial."]]], "ca": [["Avís Legal"], [["1. Operador", "PaseSpain<br/>Carrer el Palmeral 20<br/>12560 Benicàssim, Castelló, Espanya"], ["2. Contacte", "Email: pasespain@hotmail.com<br/>Telèfon: +34624860990<br/>Web: www.pasespain.es"], ["3. Activitat", "PaseSpain opera una plataforma en línia per a compra, venda o intermediació d'entrades de futbol."], ["4. Mercat online", "Excepte indicació expressa, el venedor és la part contractual del comprador respecte de l'entrada."], ["5. Pagaments", "Els pagaments es processen mitjançant Stripe."], ["6. Privacitat", "La informació està disponible a la Política de Privacitat."], ["7. Consumidors", "Abans de pagar es mostren el preu total i la informació essencial."], ["8. Revenda", "Només es poden oferir entrades legalment posseïdes i transferibles."], ["9. Propietat intel·lectual", "Els drets de PaseSpain i de tercers romanen reservats."], ["10. Contingut il·lícit", "Denúncies: daniel.leeman@hotmail.com."], ["11. Intel·ligència artificial", "Alguns textos i elements gràfics d’aquest lloc web poden haver estat creats o editats amb l’ajuda d’intel·ligència artificial."]]], "en": [["Legal Notice"], [["1. Operator", "PaseSpain<br/>Carrer el Palmeral 20<br/>12560 Benicàssim, Castelló, Spain"], ["2. Contact", "Email: pasespain@hotmail.com<br/>Phone: +34624860990<br/>Website: www.pasespain.es"], ["3. Activity", "PaseSpain operates an online platform for buying, selling or facilitating football tickets."], ["4. Marketplace", "Unless expressly stated otherwise, a third-party seller is the buyer's contractual counterparty for the ticket."], ["5. Payments", "Payments are processed by Stripe."], ["6. Privacy", "See the Privacy Policy for personal-data information."], ["7. Consumers", "The total price and key contractual information are shown before payment."], ["8. Resale", "Only lawfully held and transferable tickets may be listed."], ["9. Intellectual property", "PaseSpain and third-party rights remain reserved."], ["10. Illegal content", "Reports: daniel.leeman@hotmail.com."], ["11. Artificial intelligence", "Some texts and graphical elements on this website may have been created or edited with the assistance of artificial intelligence."]]], "de": [["Impressum / Aviso Legal"], [["1. Betreiber", "PaseSpain<br/>Carrer el Palmeral 20<br/>12560 Benicàssim, Castelló, Spanien"], ["2. Kontakt", "E-Mail: pasespain@hotmail.com<br/>Telefon: +34624860990<br/>Website: www.pasespain.es"], ["3. Tätigkeit", "PaseSpain betreibt eine Online-Plattform für Kauf, Verkauf bzw. Vermittlung von Fussballtickets."], ["4. Marktplatz", "Soweit nicht ausdrücklich anders angegeben, ist bei Drittangeboten der jeweilige Verkäufer Vertragspartner des Käufers hinsichtlich des Tickets."], ["5. Zahlungen", "Zahlungen werden über Stripe abgewickelt."], ["6. Datenschutz", "Informationen stehen in der Datenschutzerklärung."], ["7. Verbraucher", "Vor der Zahlung werden Gesamtpreis und wesentliche Vertragsinformationen angezeigt."], ["8. Weiterverkauf", "Es dürfen nur rechtmässig gehaltene und übertragbare Tickets angeboten werden."], ["9. Geistiges Eigentum", "Rechte von PaseSpain und Dritten bleiben vorbehalten."], ["10. Rechtswidrige Inhalte", "Meldungen: daniel.leeman@hotmail.com."], ["11. Künstliche Intelligenz", "Einzelne Texte und grafische Elemente dieser Website können mit Unterstützung künstlicher Intelligenz erstellt oder bearbeitet worden sein."]]]};

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