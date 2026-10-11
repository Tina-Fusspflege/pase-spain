import { matchSlug } from "./match-url";

export type VerifiedFixture = {
  home: string; away: string; date: string; stadium: string; city: string;
  kickoff?: string; provisional?: boolean; source: string; checkedAt: string;
};
// Reviewed club-calendar snapshot. Seller dates and arbitrary kickoff times
// are not verification. Recheck the source before adding or updating an entry.
const source = "https://villarrealcf.es/val/calendario-primer-equipo/";
const checkedAt = "2026-10-11";
export const verifiedFixtures: VerifiedFixture[] = [
  { home: "Villarreal CF", away: "Napoli", date: "2026-10-13", kickoff: "21:00", stadium: "Estadio de la Cerámica", city: "Villarreal", source, checkedAt },
  { home: "Villarreal CF", away: "Elche CF", date: "2026-10-17", kickoff: "16:15", stadium: "Estadio de la Cerámica", city: "Villarreal", source, checkedAt },
  { home: "Valencia CF", away: "Villarreal CF", date: "2026-10-24", kickoff: "18:30", stadium: "Mestalla", city: "Valencia", source: "https://entradas.valenciacf.com/valenciacf_webservices/select/2964326?hl=en-US", checkedAt },
  { home: "Villarreal CF", away: "Paris Saint-Germain", date: "2026-11-03", kickoff: "21:00", stadium: "Estadio de la Cerámica", city: "Villarreal", source, checkedAt },
  { home: "Villarreal CF", away: "Sabah", date: "2026-12-08", kickoff: "18:45", stadium: "Estadio de la Cerámica", city: "Villarreal", source, checkedAt },
  { home: "Villarreal CF", away: "Manchester United", date: "2027-01-27", kickoff: "21:00", stadium: "Estadio de la Cerámica", city: "Villarreal", source, checkedAt },
  { home: "Villarreal CF", away: "FC Barcelona", date: "2027-02-14", provisional: true, stadium: "Estadio de la Cerámica", city: "Villarreal", source, checkedAt },
];
export const fixtureReviews: Record<string, { message: string; source?: string }> = {
  [matchSlug("Villarreal CF", "Real Madrid", "2027-03-14")]: {
    message: "La fecha del anuncio no coincide con el calendario del club: la jornada está prevista para el 7 de marzo de 2027, con horario pendiente. Consulta al vendedor antes de comprar.", source,
  },
  [matchSlug("Villarreal CF", "FC Barcelona", "2028-02-14")]: {
    message: "La fecha de 2028 indicada en el anuncio no ha podido verificarse. No debe confundirse con el partido previsto en febrero de 2027. Consulta al vendedor antes de comprar.", source,
  },
};
