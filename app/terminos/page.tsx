"use client";

import { useEffect, useState } from "react";

type Lang = "es" | "ca" | "en" | "de";

const content = {"es": [["Términos y Condiciones"], [["1. Operador", "PaseSpain, Carrer el Palmeral 20, 12560 Benicàssim, Castelló, España. Email: pasespain@hotmail.com. Web: www.pasespain.es."], ["2. Función de PaseSpain", "PaseSpain funciona como mercado online de entradas de fútbol. Salvo indicación expresa, el vendedor del ticket es la parte contractual frente al comprador."], ["3. Registro", "Los usuarios deben facilitar datos veraces y proteger sus credenciales. Los vendedores deben ser mayores de edad y tener capacidad jurídica."], ["4. Entradas ofrecidas", "Solo pueden anunciarse entradas legítimas y transferibles conforme a la ley aplicable y a las condiciones del club, organizador o competición."], ["5. Información obligatoria", "El anuncio debe indicar correctamente partido, fecha, estadio, zona/sector, cantidad, precio unitario, precio total y restricciones relevantes."], ["6. Pago", "Antes de confirmar se muestra el precio total y las comisiones. El pago se procesa mediante Stripe."], ["7. Entrega", "La entrada se entrega por el método indicado en la oferta y permitido por el organizador."], ["8. Fraude y doble venta", "PaseSpain puede bloquear pagos, retirar anuncios o suspender cuentas ante indicios de fraude, falsificación o doble venta."], ["9. Cancelación o cambio", "Los derechos del comprador dependen de las condiciones del organizador, el tipo de vendedor y la normativa aplicable."], ["10. Desistimiento", "Para eventos de ocio con fecha concreta normalmente no existe un derecho general de desistimiento de 14 días."], ["11. Vendedor privado o profesional", "PaseSpain indicará, cuando corresponda legalmente, si el vendedor actúa como particular o profesional."], ["12. Protección de datos", "El tratamiento de datos personales se regula en la Política de Privacidad."], ["13. Reclamaciones", "Las reclamaciones pueden enviarse a daniel.leeman@hotmail.com. Los derechos imperativos del consumidor permanecen intactos."]]], "ca": [["Termes i Condicions"], [["1. Operador", "PaseSpain, Carrer el Palmeral 20, 12560 Benicàssim, Castelló, Espanya. Email: pasespain@hotmail.com. Web: www.pasespain.es."], ["2. Funció de PaseSpain", "PaseSpain funciona com a mercat en línia d'entrades de futbol. Excepte indicació expressa, el venedor és la part contractual davant del comprador."], ["3. Registre", "Els usuaris han de facilitar dades veraces i protegir les credencials. Els venedors han de ser majors d'edat."], ["4. Entrades", "Només es poden oferir entrades legítimes i transferibles segons la normativa i les condicions de l'organitzador."], ["5. Informació", "Cal indicar partit, data, estadi, zona, quantitat, preu unitari, preu total i restriccions."], ["6. Pagament", "Abans de confirmar es mostra el preu total i les comissions. El pagament es processa mitjançant Stripe."], ["7. Lliurament", "L'entrada es lliura pel mètode indicat a l'oferta."], ["8. Frau", "PaseSpain pot bloquejar pagaments, retirar anuncis o suspendre comptes davant d'indicis de frau o doble venda."], ["9. Cancel·lacions", "Els drets depenen de l'organitzador, del tipus de venedor i de la normativa aplicable."], ["10. Desistiment", "Per a esdeveniments amb data concreta normalment no s'aplica el dret general de desistiment de 14 dies."], ["11. Venedor", "S'indicarà quan calgui si el venedor és particular o professional."], ["12. Privacitat", "El tractament de dades es regula a la Política de Privacitat."], ["13. Reclamacions", "Les reclamacions es poden enviar a daniel.leeman@hotmail.com."]]], "en": [["Terms & Conditions"], [["1. Operator", "PaseSpain, Carrer el Palmeral 20, 12560 Benicàssim, Castelló, Spain. Email: pasespain@hotmail.com. Website: www.pasespain.es."], ["2. Role of PaseSpain", "PaseSpain operates as an online football-ticket marketplace. Unless expressly stated otherwise, the ticket seller is the buyer's contractual counterparty."], ["3. Registration", "Users must provide accurate data and protect login credentials. Sellers must be adults with legal capacity."], ["4. Tickets", "Only lawful and transferable tickets may be listed in accordance with applicable law and organizer rules."], ["5. Listing information", "Listings must correctly state event, date, stadium, section, quantity, unit price, total price and relevant restrictions."], ["6. Payment", "The total price and fees are shown before purchase. Payment is processed by Stripe."], ["7. Delivery", "Tickets are delivered using the method stated in the listing."], ["8. Fraud", "PaseSpain may stop payments, remove listings or suspend accounts where there are indications of fraud or duplicate sale."], ["9. Cancellation or changes", "Buyer rights depend on organizer rules, seller status and applicable law."], ["10. Withdrawal", "For leisure events tied to a specific date, the general 14-day withdrawal right normally does not apply."], ["11. Seller status", "Where legally required, PaseSpain will identify whether a seller is private or professional."], ["12. Privacy", "Personal data is handled under the Privacy Policy."], ["13. Complaints", "Complaints may be sent to daniel.leeman@hotmail.com. Mandatory consumer rights remain unaffected."]]], "de": [["Allgemeine Geschäftsbedingungen (AGB)"], [["1. Betreiber", "PaseSpain, Carrer el Palmeral 20, 12560 Benicàssim, Castelló, Spanien. E-Mail: pasespain@hotmail.com. Website: www.pasespain.es."], ["2. Rolle von PaseSpain", "PaseSpain ist ein Online-Marktplatz für Fussballtickets. Soweit nicht ausdrücklich anders angegeben, ist der jeweilige Verkäufer Vertragspartner des Käufers hinsichtlich des Tickets."], ["3. Registrierung", "Nutzer müssen korrekte Daten angeben und Zugangsdaten schützen. Verkäufer müssen volljährig und geschäftsfähig sein."], ["4. Tickets", "Es dürfen nur rechtmässige und übertragbare Tickets angeboten werden."], ["5. Angebotsangaben", "Spiel, Datum, Stadion, Bereich, Anzahl, Einzelpreis, Gesamtpreis und relevante Einschränkungen müssen korrekt angegeben werden."], ["6. Zahlung", "Gesamtpreis und Gebühren werden vor dem Kauf angezeigt. Zahlung über Stripe."], ["7. Übertragung", "Das Ticket wird über die im Angebot genannte zulässige Methode übertragen."], ["8. Betrug", "PaseSpain kann Zahlungen stoppen, Angebote entfernen oder Konten sperren, wenn Betrugs- oder Doppelverkaufsverdacht besteht."], ["9. Absage/Verschiebung", "Ansprüche richten sich nach Veranstalterbedingungen, Verkäuferstatus und anwendbarem Recht."], ["10. Widerruf", "Bei Freizeitveranstaltungen mit festem Termin besteht normalerweise kein allgemeines 14-tägiges Widerrufsrecht."], ["11. Verkäuferstatus", "PaseSpain kennzeichnet, soweit erforderlich, private und gewerbliche Verkäufer."], ["12. Datenschutz", "Die Verarbeitung personenbezogener Daten richtet sich nach der Datenschutzerklärung."], ["13. Beschwerden", "Beschwerden an daniel.leeman@hotmail.com. Zwingende Verbraucherrechte bleiben unberührt."]]]};

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
          PaseSpain · Stand 01.09.2026 · Betreiber-, Kontakt-, Register- und Zahlungsangaben vor dem öffentlichen Launch vervollständigen.
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