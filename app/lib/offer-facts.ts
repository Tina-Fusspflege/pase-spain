// Whitelist structured public seat information. Raw details may contain
// internal payout and service-fee lines and must not be rendered here.
export function offerFacts(details?: string | null) {
  const fields = new Map<string, string>();
  for (const line of (details ?? "").split(/\r?\n/)) {
    const colon = line.indexOf(":");
    if (colon < 0) continue;
    const label = line.slice(0, colon).trim().toLowerCase();
    const value = line.slice(colon + 1).trim();
    if (value) fields.set(label, value.slice(0, 160));
  }
  const read = (...labels: string[]) => labels.map(label => fields.get(label.toLowerCase())).find(Boolean);
  const count = read("Anzahl Tickets", "Número de entradas", "Cantidad", "Quantity");
  const quantity = count && /^\d+$/.test(count) && Number(count) > 0 ? Number(count) : undefined;
  const row = read("Reihe", "Fila", "Row");
  const adjacency = read("Zusammenhängend", "Zusammenhängende Plätze", "Nebeneinander", "Asientos juntos", "Adjacent seats", "Seats together");
  const value = adjacency?.toLowerCase();
  const adjacent = value && /^(ja|yes|sí|si|true)$/.test(value) ? "Sí"
    : value && /^(nein|no|false)$/.test(value) ? "No" : "No indicado";
  return { quantity,
    zone: read("Zone / Tribüne", "Tribuna", "Zona", "Tribüne", "Zone", "Stand"),
    sector: read("Sektor", "Sector", "Bloque", "Block"),
    row: row && /^[\p{L}\d ,/.-]+$/u.test(row) && row.length <= 20 ? row : undefined,
    seat: read("Platz", "Sitzplatz", "Asiento", "Seient", "Seat"), adjacent,
  };
}
