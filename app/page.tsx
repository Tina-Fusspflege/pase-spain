"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import PaseSpainVoiceAssistant from "../components/PaseSpainVoiceAssistant";

type Language = "es" | "ca" | "en" | "de";
type UserRole = "seller" | "buyer";

type TicketOffer = {
  id?: string;
  sellerId?: string;
  home: string;
  away: string
  date: string;
  stadium: string;
  city: string;
  price: string;
  unitPrice?: number;
  ticketCount?: number;
  childTickets?: number;
  section?: string;
rowNumber?: string;
seatNumber?: string;
quantity?: number;
adjacentSeats?: boolean;
  details?: string;
};

type WeatherType =
  | "sun"
  | "cloud"
  | "rain";

type WeatherData = {
  city: string;
  temperature: number;
  type: WeatherType;
  rain: number;
  wind: number;
  isDay?: boolean;

  forecast: {
    day:
      | "today"
      | "sat"
      | "sun";

    temp: number;

    type:
      | WeatherType
      | "partly";
  }[];
};

type SportsDbTeam = {
  idTeam?: string | null;
  strTeam?: string | null;
  strTeamAlternate?: string | null;
  strSport?: string | null;
  strCountry?: string | null;
  strLeague?: string | null;
  strBadge?: string | null;
};

type SportsDbResponse = {
  teams?: SportsDbTeam[] | null;
};

type LaLigaEvent = {
  idEvent?: string | null;
  strHomeTeam?: string | null;
  strAwayTeam?: string | null;
  dateEvent?: string | null;
  strTime?: string | null;
};

type LaLigaDayResponse = {
  events?: LaLigaEvent[] | null;
};

type SellerOrder = {
  id: string;
  offer_id: string | null;
  home: string;
  away: string;
  match_date: string;
  stadium: string;
  quantity: number;
  ticket_price_eur: number;
  seller_payout_eur: number;
  status: string;
  created_at: string;
};

type BuyerOrder = {
  id: string;
  home: string;
  away: string;
  match_date: string;
  stadium: string;
  quantity: number;
  ticket_price_eur: number;
  buyer_total_eur: number;
  status: string;
  ticket_available: boolean;
  created_at: string;
};

type SupabaseSession = {
  access_token: string;
  refresh_token?: string;
  user: {
    id: string;
    email?: string | null;
    user_metadata?: {
      role?: UserRole;
    } | null;
  };
};

type SupabaseAuthResponse = {
  access_token?: string;
  refresh_token?: string;
  user?: SupabaseSession["user"] | null;
  session?: {
    access_token?: string;
    refresh_token?: string;
  } | null;
  error_description?: string;
  msg?: string;
  message?: string;
};

type TicketOfferRow = {
  id: string;
  seller_id: string;
  home: string;
  away: string;
  match_date: string;
  stadium: string;
  city: string;
  price_eur: number;
  details?: string | null;
  created_at?: string;
};

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

const PASESPAIN_SESSION_KEY =
  "pasespain-supabase-session";

function HeartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="9" cy="20" r="1" />
      <circle cx="19" cy="20" r="1" />

      <path d="M3 4h2l2.4 10.2a2 2 0 0 0 2 1.5h7.7a2 2 0 0 0 2-1.6L21 7H6" />
    </svg>
  );
}

const translations = {
  es: {
    hero1:
      "VIVE EL FÚTBOL.",

    hero2:
      "SIÉNTELO",

    live:
      "EN DIRECTO.",

    categories: [
      [
        "La Liga",
        "Grandes partidos",
      ],

      [
        "Copa del Rey",
        "Partidos especiales",
      ],

      [
        "Entradas infantiles",
        "Para los pequeños aficionados",
      ],

      [
        "Estadios",
        "Todos los estadios",
      ],

      [
        "Entradas VIP",
        "Experiencias exclusivas",
      ],
    ],

    aiTitle:
      "Búsqueda de entradas con IA",

    aiText:
      "Dinos simplemente lo que buscas.",

    aiPlaceholder:
      "Ej. Barcelona contra Real Madrid, 2 adultos, 1 niño, presupuesto 500 €",

    search:
      "Buscar",

    mapTitle:
      "Descubre estadios",

    mapText:
      "Encuentra partidos por ciudad y estadio.",

    recommendations:
      "TICKETS",

    searchResults:
      "TICKETS",

    showAll:
      "Ver todas",

    resetSearch:
      "Restablecer búsqueda",

    found:
      "ofertas encontradas",

    from:
      "desde",

    weatherTitle:
      "TIEMPO EN EL LUGAR DEL PARTIDO",

    rain:
      "Lluvia",

    wind:
      "Viento",

    sunny:
      "Soleado",

    cloudy:
      "Nublado",

    rainy:
      "Lluvia",

    partlyCloudy:
      "Parcialmente nublado",

    today:
      "Hoy",

    sat:
      "Sáb",

    sun:
      "Dom",

    may:
      "mayo",

    block:
      "Sector",

    row:
      "Fila",

    twoTicketsTogether:
      "2 entradas · Asientos juntos",

    verifiedSeller:
      "2 entradas · Vendedor verificado",

    immediatelyAvailable:
      "2 entradas · Disponibles inmediatamente",

    seller:
      "Vendedor",

    buyer:
      "Comprador",

    cart:
      "Carrito",

    windowTitle:
      "¡La ventana!",
  },

  ca: {
    hero1:
      "VIU EL FUTBOL.",

    hero2:
      "SENT-LO",

    live:
      "EN DIRECTE.",

    categories: [
      [
        "La Liga",
        "Grans partits",
      ],

      [
        "Copa del Rei",
        "Partits especials",
      ],

      [
        "Entrades infantils",
        "Per als petits aficionats",
      ],

      [
        "Estadis",
        "Tots els estadis",
      ],

      [
        "Entrades VIP",
        "Experiències exclusives",
      ],
    ],

    aiTitle:
      "Cerca d'entrades amb IA",

    aiText:
      "Digues-nos simplement què busques.",

    aiPlaceholder:
      "Ex. Barcelona contra Real Madrid, 2 adults, 1 nen, pressupost 500 €",

    search:
      "Cercar",

    mapTitle:
      "Descobreix estadis",

    mapText:
      "Troba partits per ciutat i estadi.",

    recommendations:
      "TICKETS",

    searchResults:
      "TICKETS",

    showAll:
      "Veure totes",

    resetSearch:
      "Restablir cerca",

    found:
      "ofertes trobades",

    from:
      "des de",

    weatherTitle:
      "TEMPS AL LLOC DEL PARTIT",

    rain:
      "Pluja",

    wind:
      "Vent",

    sunny:
      "Assolellat",

    cloudy:
      "Ennuvolat",

    rainy:
      "Pluja",

    partlyCloudy:
      "Parcialment ennuvolat",

    today:
      "Avui",

    sat:
      "Ds",

    sun:
      "Dg",

    may:
      "maig",

    block:
      "Sector",

    row:
      "Fila",

    twoTicketsTogether:
      "2 entrades · Seients junts",

    verifiedSeller:
      "2 entrades · Venedor verificat",

    immediatelyAvailable:
      "2 entrades · Disponibles immediatament",

    seller:
      "Venedor",

    buyer:
      "Comprador",

    cart:
      "Cistella",

    windowTitle:
      "La finestra!",
  },

  en: {
    hero1:
      "EXPERIENCE FOOTBALL.",

    hero2:
      "FEEL IT",

    live:
      "LIVE.",

    categories: [
      [
        "La Liga",
        "Top matches",
      ],

      [
        "Copa del Rey",
        "Special matches",
      ],

      [
        "Kids tickets",
        "For our young fans",
      ],

      [
        "Stadiums",
        "All arenas",
      ],

      [
        "VIP tickets",
        "Exclusive experiences",
      ],
    ],

    aiTitle:
      "AI Ticket Search",

    aiText:
      "Simply tell us what you're looking for.",

    aiPlaceholder:
      "e.g. Barcelona vs Real Madrid, 2 adults, 1 child, budget €500",

    search:
      "Search",

    mapTitle:
      "Discover stadiums",

    mapText:
      "Find matches by city and stadium.",

    recommendations:
      "TICKETS",

    searchResults:
      "TICKETS",

    showAll:
      "Show all",

    resetSearch:
      "Reset search",

    found:
      "matching offers found",

    from:
      "from",

    weatherTitle:
      "WEATHER AT MATCH LOCATION",

    rain:
      "Rain",

    wind:
      "Wind",

    sunny:
      "Sunny",

    cloudy:
      "Cloudy",

    rainy:
      "Rain",

    partlyCloudy:
      "Partly cloudy",

    today:
      "Today",

    sat:
      "Sat",

    sun:
      "Sun",

    may:
      "May",

    block:
      "Block",

    row:
      "Row",

    twoTicketsTogether:
      "2 tickets · Seats together",

    verifiedSeller:
      "2 tickets · Verified seller",

    immediatelyAvailable:
      "2 tickets · Available immediately",

    seller:
      "Seller",

    buyer:
      "Buyer",

    cart:
      "Cart",

    windowTitle:
      "The Window!",
  },

  de: {
    hero1:
      "ERLEBE FUSSBALL.",

    hero2:
      "SPÜRE IHN",

    live:
      "LIVE.",

    categories: [
      [
        "La Liga",
        "Topspiele",
      ],

      [
        "Copa del Rey",
        "Besondere Spiele",
      ],

      [
        "Kindertickets",
        "Für unsere kleinen Fans",
      ],

      [
        "Stadien",
        "Alle Arenen",
      ],

      [
        "VIP-Tickets",
        "Exklusive Erlebnisse",
      ],
    ],

    aiTitle:
      "KI-Ticketsuche",

    aiText:
      "Sag uns einfach, was du suchst.",

    aiPlaceholder:
      "z. B. Barcelona gegen Real Madrid, 2 Erwachsene, 1 Kind, Budget 500 €",

    search:
      "Suchen",

    mapTitle:
      "Stadien entdecken",

    mapText:
      "Spiele nach Ort und Stadion finden.",

    recommendations:
      "TICKETS",

    searchResults:
      "TICKETS",

    showAll:
      "Alle anzeigen",

    resetSearch:
      "Suche zurücksetzen",

    found:
      "passende Angebote gefunden",

    from:
      "ab",

    weatherTitle:
      "WETTER AM SPIELORT",

    rain:
      "Regen",

    wind:
      "Wind",

    sunny:
      "Sonnig",

    cloudy:
      "Bewölkt",

    rainy:
      "Regen",

    partlyCloudy:
      "Leicht bewölkt",

    today:
      "Heute",

    sat:
      "Sa",

    sun:
      "So",

    may:
      "Mai",

    block:
      "Block",

    row:
      "Reihe",

    twoTicketsTogether:
      "2 Tickets · Plätze nebeneinander",

    verifiedSeller:
      "2 Tickets · Verkäufer geprüft",

    immediatelyAvailable:
      "2 Tickets · Sofort verfügbar",

    seller:
      "Verkäufer",

    buyer:
      "Käufer",

    cart:
      "Warenkorb",

    windowTitle:
      "Das Fenster!",
  },
} as const;

const weatherByCity:
  Record<
    string,
    WeatherData
  > = {
  Barcelona: {
    city:
      "Barcelona",

    temperature:
      22,

    type:
      "sun",

    rain:
      10,

    wind:
      12,

    forecast: [
      {
        day:
          "today",

        temp:
          22,

        type:
          "sun",
      },

      {
        day:
          "sat",

        temp:
          23,

        type:
          "sun",
      },

      {
        day:
          "sun",

        temp:
          21,

        type:
          "partly",
      },
    ],
  },

  Madrid: {
    city:
      "Madrid",

    temperature:
      25,

    type:
      "sun",

    rain:
      5,

    wind:
      9,

    forecast: [
      {
        day:
          "today",

        temp:
          25,

        type:
          "sun",
      },

      {
        day:
          "sat",

        temp:
          27,

        type:
          "sun",
      },

      {
        day:
          "sun",

        temp:
          24,

        type:
          "cloud",
      },
    ],
  },

  Sevilla: {
    city:
      "Sevilla",

    temperature:
      29,

    type:
      "sun",

    rain:
      0,

    wind:
      8,

    forecast: [
      {
        day:
          "today",

        temp:
          29,

        type:
          "sun",
      },

      {
        day:
          "sat",

        temp:
          31,

        type:
          "sun",
      },

      {
        day:
          "sun",

        temp:
          30,

        type:
          "sun",
      },
    ],
  },
};

/*
  TheSportsDB sucht manche Vereine
  unter leicht anderen Namen.

  Diese Zuordnung betrifft NUR
  die automatische Wappensuche.
*/

const sellerTeamLocations: Record<string, { stadium: string; city: string }> = {
  "FC Barcelona": { stadium: "Spotify Camp Nou", city: "Barcelona" },
  "Real Madrid": { stadium: "Santiago Bernabéu", city: "Madrid" },
  "Atlético de Madrid": { stadium: "Riyadh Air Metropolitano", city: "Madrid" },
  "Athletic Club": { stadium: "San Mamés", city: "Bilbao" },
  "Real Betis": { stadium: "Benito Villamarín", city: "Sevilla" },
  "Sevilla FC": { stadium: "Ramón Sánchez-Pizjuán", city: "Sevilla" },
  "Valencia CF": { stadium: "Mestalla", city: "Valencia" },
  "Villarreal CF": { stadium: "Estadio de la Cerámica", city: "Villarreal" },
  "Real Sociedad": { stadium: "Reale Arena", city: "San Sebastián" },
  "RC Celta": { stadium: "Abanca Balaídos", city: "Vigo" },
  "RCD Espanyol": { stadium: "RCDE Stadium", city: "Cornellà de Llobregat" },
  "CA Osasuna": { stadium: "El Sadar", city: "Pamplona" },
  "Getafe CF": { stadium: "Coliseum", city: "Getafe" },
  "Deportivo Alavés": { stadium: "Mendizorrotza", city: "Vitoria-Gasteiz" },
  "Elche CF": { stadium: "Martínez Valero", city: "Elche" },
  "Levante UD": { stadium: "Ciutat de València", city: "Valencia" },
  "Málaga CF": { stadium: "La Rosaleda", city: "Málaga" },
  "R. Racing Club": { stadium: "El Sardinero", city: "Santander" },
  "Rayo Vallecano": { stadium: "Estadio de Vallecas", city: "Madrid" },
  "RC Deportivo": { stadium: "Riazor", city: "A Coruña" },

  // Weitere spanische Vereine bleiben als Schreibhilfe erhalten.
  "RCD Mallorca": { stadium: "Estadi Mallorca Son Moix", city: "Palma" },
  "Girona FC": { stadium: "Montilivi", city: "Girona" },

  // Internationale Vereine als Schreibhilfe für Champions League / UEFA.
  // Die Eingabefelder bleiben FREI: Jeder andere Verein kann trotzdem eingetippt werden.
  "Paris Saint-Germain": { stadium: "Parc des Princes", city: "Paris" },
  "Bayern München": { stadium: "Allianz Arena", city: "München" },
  "Borussia Dortmund": { stadium: "Signal Iduna Park", city: "Dortmund" },
  "Manchester City": { stadium: "Etihad Stadium", city: "Manchester" },
  "Liverpool FC": { stadium: "Anfield", city: "Liverpool" },
  "Arsenal FC": { stadium: "Emirates Stadium", city: "London" },
  "Chelsea FC": { stadium: "Stamford Bridge", city: "London" },
  "Inter": { stadium: "San Siro", city: "Milano" },
  "AC Milan": { stadium: "San Siro", city: "Milano" },
  "Juventus": { stadium: "Allianz Stadium", city: "Torino" },
  "SSC Napoli": { stadium: "Stadio Diego Armando Maradona", city: "Napoli" },
  "AS Roma": { stadium: "Stadio Olimpico", city: "Roma" },
  "Benfica": { stadium: "Estádio da Luz", city: "Lisboa" },
  "Sporting CP": { stadium: "Estádio José Alvalade", city: "Lisboa" },
  "FC Porto": { stadium: "Estádio do Dragão", city: "Porto" },
  "Ajax": { stadium: "Johan Cruijff ArenA", city: "Amsterdam" },
  "PSV Eindhoven": { stadium: "Philips Stadion", city: "Eindhoven" },
};

const sellerTeamSuggestions = Object.keys(sellerTeamLocations);

const laLigaTeamSuggestions = [
  "Athletic Club",
  "Atlético de Madrid",
  "CA Osasuna",
  "RC Celta",
  "Deportivo Alavés",
  "Elche CF",
  "FC Barcelona",
  "Getafe CF",
  "Levante UD",
  "Málaga CF",
  "R. Racing Club",
  "Rayo Vallecano",
  "RC Deportivo",
  "RCD Espanyol",
  "Real Betis",
  "Real Madrid",
  "Real Sociedad",
  "Sevilla FC",
  "Valencia CF",
  "Villarreal CF",
];

const championsLeagueTeamSuggestions = [
  "AEK Athens",
  "Arsenal",
  "Aston Villa",
  "Atlético de Madrid",
  "FC Barcelona",
  "Bayern München",
  "Bodø/Glimt",
  "Borussia Dortmund",
  "Club Brugge",
  "Como",
  "Fenerbahçe",
  "Feyenoord",
  "Galatasaray",
  "Inter",
  "LASK",
  "RB Leipzig",
  "Lens",
  "Lille",
  "Liverpool",
  "Manchester City",
  "Manchester United",
  "Napoli",
  "Paris Saint-Germain",
  "FC Porto",
  "PSV Eindhoven",
  "Real Betis",
  "Real Madrid",
  "AS Roma",
  "Sabah",
  "Shakhtar Donetsk",
  "Slavia Praha",
  "Slovan Bratislava",
  "Sporting CP",
  "VfB Stuttgart",
  "Viking",
  "Villarreal CF",
];

const sellerStadiumSuggestions = Array.from(
  new Set(Object.values(sellerTeamLocations).map((entry) => entry.stadium))
).sort((a, b) => a.localeCompare(b));
const sellerCitySuggestions = Array.from(
  new Set(Object.values(sellerTeamLocations).map((entry) => entry.city))
).sort((a, b) => a.localeCompare(b));

const teamSearchNames:
  Record<
    string,
    string
  > = {
  "FC Barcelona":
    "Barcelona",

  "Real Madrid":
    "Real Madrid",

  "Atlético de Madrid":
    "Atletico Madrid",

  "Sevilla FC":
    "Sevilla",

  "Real Betis":
    "Real Betis",

  "Valencia CF":
    "Valencia",
};

/*
  Einfacher Cache außerhalb der Komponente.

  Dadurch wird ein Vereinswappen während
  derselben Sitzung nicht ständig neu
  von der API abgefragt.
*/

const teamBadgeCache:
  Record<
    string,
    string | null
  > = {};

async function loadTeamBadge(
  teamName: string
): Promise<string | null> {
  if (
    Object.prototype.hasOwnProperty.call(
      teamBadgeCache,
      teamName
    )
  ) {
    return teamBadgeCache[
      teamName
    ];
  }

  const searchName =
    teamSearchNames[
      teamName
    ] ?? teamName;

  try {
    const response =
      await fetch(
        `https://www.thesportsdb.com/api/v1/json/123/searchteams.php?t=${encodeURIComponent(
          searchName
        )}`
      );

    if (
      !response.ok
    ) {
      teamBadgeCache[
        teamName
      ] = null;

      return null;
    }

    const data:
      SportsDbResponse =
      await response.json();

    const teams =
      Array.isArray(
        data.teams
      )
        ? data.teams
        : [];

    /*
      Wenn mehrere Treffer kommen,
      bevorzugen wir Fußball/Soccer.
    */

    const footballTeam =
      teams.find(
        (team) =>
          team.strSport
            ?.toLowerCase()
            .includes(
              "soccer"
            )
      ) ??
      teams[0];

    const badge =
      footballTeam
        ?.strBadge ??
      null;

    teamBadgeCache[
      teamName
    ] = badge;

    return badge;
  } catch (
    error
  ) {
    console.error(
      `Wappen für ${teamName} konnte nicht geladen werden:`,
      error
    );

    teamBadgeCache[
      teamName
    ] = null;

    return null;
  }
}

export default function Home() {
  const [
    language,
    setLanguage,
  ] =
    useState<Language>(
      "es"
    );

  const [
    searchText,
    setSearchText,
  ] =
    useState("");

  const [
    searchActive,
    setSearchActive,
  ] =
    useState(false);

  const [
    voiceAssistantOpen,
    setVoiceAssistantOpen,
  ] = useState(false);

  const [
    fairplayOpen,
    setFairplayOpen,
  ] = useState(false);

  const [
    sellerFairplayAccepted,
    setSellerFairplayAccepted,
  ] = useState(false);

  const [
    selectedCity,
    setSelectedCity,
  ] =
    useState(
      "Barcelona"
    );

  const [
    liveWeather,
    setLiveWeather,
  ] = useState<WeatherData | null>(null);

  const [
    teamBadges,
    setTeamBadges,
  ] =
    useState<
      Record<
        string,
        string | null
      >
    >({});

  const [
    activeAuthRole,
    setActiveAuthRole,
  ] = useState<UserRole>("buyer");

  const [
    authRoleChosen,
    setAuthRoleChosen,
  ] = useState(false);

  const [
    authMode,
    setAuthMode,
  ] = useState<"login" | "register">("login");

  const [
    authModalOpen,
    setAuthModalOpen,
  ] = useState(false);

  const [
    accountManageOpen,
    setAccountManageOpen,
  ] = useState(false);

  const [
    accountDeleteLoading,
    setAccountDeleteLoading,
  ] = useState(false);

  const [
    accountDeleteError,
    setAccountDeleteError,
  ] = useState("");

  const [
    loggedInRole,
    setLoggedInRole,
  ] = useState<UserRole | null>(null);

  const [
    supabaseSession,
    setSupabaseSession,
  ] = useState<SupabaseSession | null>(null);

  const [
    authLoading,
    setAuthLoading,
  ] = useState(false);

  const [
    sellerPublishError,
    setSellerPublishError,
  ] = useState("");

  const [
    sellerPublishing,
    setSellerPublishing,
  ] = useState(false);

  const [
    stripeOnboardingLoading,
    setStripeOnboardingLoading,
  ] = useState(false);

  const [
    stripeOnboardingError,
    setStripeOnboardingError,
  ] = useState("");

  const [
    stripeAccountId,
    setStripeAccountId,
  ] = useState("");

  const [
    stripePayoutsEnabled,
    setStripePayoutsEnabled,
  ] = useState(false);

  const [
    stripeDetailsSubmitted,
    setStripeDetailsSubmitted,
  ] = useState(false);

  const [
    stripeStatusLoading,
    setStripeStatusLoading,
  ] = useState(false);

  const [
    sellerPriceEditId,
    setSellerPriceEditId,
  ] = useState<string | null>(null);

  const [
    sellerPriceEditValue,
    setSellerPriceEditValue,
  ] = useState("");

  const [
    sellerPriceUpdating,
    setSellerPriceUpdating,
  ] = useState(false);

  const [
    sellerPriceEditError,
    setSellerPriceEditError,
  ] = useState("");

  const [
    sellerOfferEditId,
    setSellerOfferEditId,
  ] = useState<string | null>(null);

  const [
    sellerOfferDeletingId,
    setSellerOfferDeletingId,
  ] = useState<string | null>(null);

  const [
    authEmail,
    setAuthEmail,
  ] = useState("");

  const [
    authPassword,
    setAuthPassword,
  ] = useState("");

  const [
    authPasswordVisible,
    setAuthPasswordVisible,
  ] = useState(false);

  const [
    passwordResetLoading,
    setPasswordResetLoading,
  ] = useState(false);

  const [
    passwordRecoveryToken,
    setPasswordRecoveryToken,
  ] = useState("");

  const [
    passwordRecoveryLoading,
    setPasswordRecoveryLoading,
  ] = useState(false);

  const [
    sellerFirstName,
    setSellerFirstName,
  ] = useState("");

  const [
    sellerLastName,
    setSellerLastName,
  ] = useState("");

  const [
    sellerStreet,
    setSellerStreet,
  ] = useState("");

  const [
    sellerHouseNumber,
    setSellerHouseNumber,
  ] = useState("");

  const [
    sellerPostalCode,
    setSellerPostalCode,
  ] = useState("");

  const [
    sellerProfileCity,
    setSellerProfileCity,
  ] = useState("");

  const [
    sellerCountry,
    setSellerCountry,
  ] = useState("España");

  const [
    sellerPhone,
    setSellerPhone,
  ] = useState("");

  const [
    sellerBirthDate,
    setSellerBirthDate,
  ] = useState("");

  const [
    sellerTermsAccepted,
    setSellerTermsAccepted,
  ] = useState(false);

  const [
    authError,
    setAuthError,
  ] = useState("");

  const [
    sellerModalOpen,
    setSellerModalOpen,
  ] = useState(false);

  const [
    cartOpen,
    setCartOpen,
  ] = useState(false);

  const [
    mobilePage,
    setMobilePage,
  ] = useState<"home" | "tickets" | "sell" | "more">("home");

  const [
    mobileExpandedOfferId,
    setMobileExpandedOfferId,
  ] = useState<string | null>(null);

  const [
    laLigaMatches,
    setLaLigaMatches,
  ] = useState<LaLigaEvent[]>([]);

  const [
    sellerUpcomingMatches,
    setSellerUpcomingMatches,
  ] = useState<LaLigaEvent[]>([]);

  const [
    sellerMatchSelection,
    setSellerMatchSelection,
  ] = useState("");

  const [
    laLigaLoading,
    setLaLigaLoading,
  ] = useState(true);

  const [
    sellerOffers,
    setSellerOffers,
  ] = useState<TicketOffer[]>([]);

  const [liveBoardIndex, setLiveBoardIndex] = useState(0);

  const liveBoardOffers = sellerOffers.filter(
    (offer, index, offers) =>
      offers.findIndex(
        (item) =>
          item.home === offer.home &&
          item.away === offer.away
      ) === index
  );

  useEffect(() => {
    if (liveBoardOffers.length < 2) {
      setLiveBoardIndex(0);
      return;
    }

    const timer = window.setInterval(() => {
      setLiveBoardIndex((current) =>
        (current + 1) % liveBoardOffers.length
      );
    }, 180000);

    return () => window.clearInterval(timer);
  }, [liveBoardOffers.length]);

  const liveBoardOffer =
    liveBoardOffers[liveBoardIndex] ??
    liveBoardOffers[0] ??
    null;

  const renderFlapChars = (value: string, maxChars = 16) => {
    const text = value
      .toUpperCase()
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, maxChars);

    return Array.from(text).map((char, index) => (
      <span
        className={`pases-char-flap${char === " " ? " pases-char-space" : ""}`}
        key={`${char}-${index}`}
      >
        {char === " " ? "\u00A0" : char}
      </span>
    ));
  };

  const [
    cartItems,
    setCartItems,
  ] = useState<TicketOffer[]>([]);

  const [
    checkoutLoading,
    setCheckoutLoading,
  ] = useState(false);

  const [
    checkoutError,
    setCheckoutError,
  ] = useState("");

  const [
    sellerOrders,
    setSellerOrders,
  ] = useState<SellerOrder[]>([]);

  const [
    sellerOrdersLoading,
    setSellerOrdersLoading,
  ] = useState(false);

  const [
    ticketUploadOrderId,
    setTicketUploadOrderId,
  ] = useState<string | null>(null);

  const [
    ticketUploadError,
    setTicketUploadError,
  ] = useState("");

  const [
    buyerOrders,
    setBuyerOrders,
  ] = useState<BuyerOrder[]>([]);

  const [
    buyerOrdersLoading,
    setBuyerOrdersLoading,
  ] = useState(false);

  const [
    buyerOrdersError,
    setBuyerOrdersError,
  ] = useState("");

  const [
    buyerTicketOpeningId,
    setBuyerTicketOpeningId,
  ] = useState<string | null>(null);


  const [
    sellerCompetition,
    setSellerCompetition,
  ] = useState("LaLiga");

  const [
    sellerHome,
    setSellerHome,
  ] = useState("");

  const [
    sellerAway,
    setSellerAway,
  ] = useState("");

  const [
    sellerDate,
    setSellerDate,
  ] = useState("");

  const [
    sellerDateOpen,
    setSellerDateOpen,
  ] = useState(false);

  const [
    sellerStadium,
    setSellerStadium,
  ] = useState("");

  const [
    sellerZone,
    setSellerZone,
  ] = useState("");

  const [
    sellerSector,
    setSellerSector,
  ] = useState("");
  const [sellerRow, setSellerRow] = useState("");

  const [
    sellerCity,
    setSellerCity,
  ] = useState("");

  const [
    sellerPrice,
    setSellerPrice,
  ] = useState("");

  const [
    sellerTicketCount,
    setSellerTicketCount,
  ] = useState("");

  const [
    sellerChildTickets,
    setSellerChildTickets,
  ] = useState("");

  const [
    sellerChildTicketDescription,
    setSellerChildTicketDescription,
  ] = useState("");

  const [
    sellerDescription,
    setSellerDescription,
  ] = useState("");

  const t =
    translations[
      language
    ];

  const standardOffers:
    TicketOffer[] = [
    {
      home:
        "FC Barcelona",

      away:
        "Real Madrid",

      date:
        `26 ${t.may} 2026 · 21:00`,

      stadium:
        "Camp Nou",

      city:
        "Barcelona",

      price:
        "89€",
    },

    {
      home:
        "Atlético de Madrid",

      away:
        "Sevilla FC",

      date:
        `27 ${t.may} 2026 · 19:00`,

      stadium:
        "Cívitas Metropolitano",

      city:
        "Madrid",

      price:
        "59€",
    },

    {
      home:
        "Real Betis",

      away:
        "Valencia CF",

      date:
        `28 ${t.may} 2026 · 18:30`,

      stadium:
        "Benito Villamarín",

      city:
        "Sevilla",

      price:
        "45€",
    },
  ];

  function ticketDateValue(value: string) {
    const text = value.trim();

    const isoMatch =
      text.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      return new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        23,
        59,
        59
      ).getTime();
    }

    const europeanMatch =
      text.match(/(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})/);

    if (europeanMatch) {
      const [, day, month, year] = europeanMatch;
      return new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        23,
        59,
        59
      ).getTime();
    }

    const parsed =
      Date.parse(text);

    return Number.isFinite(parsed)
      ? parsed
      : Number.POSITIVE_INFINITY;
  }

  const currentPaseSpainOffers =
    sellerOffers
      .filter(
        offer =>
          ticketDateValue(offer.date) >=
          new Date().setHours(0, 0, 0, 0)
      )
      .sort(
        (a, b) =>
          ticketDateValue(a.date) -
          ticketDateValue(b.date)
      );

  const aiSearchStopWords =
    new Set([
      "vs",
      "v",
      "gegen",
      "contra",
      "against",
      "ticket",
      "tickets",
      "entrada",
      "entradas",
      "eintritt",
      "eintrittskarte",
      "eintrittskarten",
      "adult",
      "adults",
      "adulto",
      "adultos",
      "erwachsene",
      "kind",
      "kinder",
      "child",
      "children",
      "nen",
      "nens",
      "presupuesto",
      "budget",
      "eur",
      "euro",
    ]);

  const aiSearchTerms =
    searchText
      .toLowerCase()
      .replace(/[^a-z0-9à-ÿäöüßñç\s]/gi, " ")
      .split(/\s+/)
      .map(term => term.trim())
      .filter(
        term =>
          Boolean(term) &&
          !aiSearchStopWords.has(term) &&
          !/^\d+$/.test(term)
      );

  const paseSpainSearchOffers =
    currentPaseSpainOffers.filter(
      offer => {
        if (!aiSearchTerms.length) {
          return true;
        }

        const searchableText = [
          offer.home,
          offer.away,
          offer.city,
          offer.stadium,
          offer.date,
          offer.details ?? "",
        ]
          .join(" ")
          .toLowerCase();

        return aiSearchTerms.every(
          term =>
            searchableText.includes(term)
        );
      }
    );

  const recommendedOffers =
    currentPaseSpainOffers;

  const sellerOwnOffers =
    sellerOffers.filter(
      offer =>
        Boolean(offer.id) &&
        Boolean(offer.sellerId) &&
        offer.sellerId ===
          supabaseSession?.user?.id
    );

  const visibleOffers =
    searchActive
      ? paseSpainSearchOffers
      : recommendedOffers;

  /*
    Alle aktuell sichtbaren Vereine
    automatisch erfassen.
  */

  const visibleTeamNames =
    useMemo(
      () => {
        const names =
          new Set<string>();

        visibleOffers.forEach(
          (
            offer
          ) => {
            names.add(
              offer.home
            );

            names.add(
              offer.away
            );
          }
        );

        return Array.from(
          names
        );
      },
      [
        searchActive,
        language,
        sellerOffers,
      ]
    );

  /*
    Die Wappen automatisch laden.
  */

  useEffect(
    () => {
      let cancelled =
        false;

      async function loadBadges() {
        const results =
          await Promise.all(
            visibleTeamNames.map(
              async (
                teamName
              ) => {
                const badge =
                  await loadTeamBadge(
                    teamName
                  );

                return [
                  teamName,
                  badge,
                ] as const;
              }
            )
          );

        if (
          cancelled
        ) {
          return;
        }

        setTeamBadges(
          (
            current
          ) => {
            const next = {
              ...current,
            };

            results.forEach(
              ([
                teamName,
                badge,
              ]) => {
                next[
                  teamName
                ] =
                  badge;
              }
            );

            return next;
          }
        );
      }

      loadBadges();

      return () => {
        cancelled =
          true;
      };
    },
    [
      visibleTeamNames,
    ]
  );

  useEffect(() => {
    let cancelled = false;

    const apiDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    async function loadUpcomingLaLigaMatches() {
      setLaLigaLoading(true);

      try {
        const found: LaLigaEvent[] = [];
        const today = new Date();

        for (let offset = 0; offset < 21; offset += 1) {
          const date = new Date(today);
          date.setDate(today.getDate() + offset);

          const response = await fetch(
            `https://www.thesportsdb.com/api/v1/json/123/eventsday.php?d=${apiDate(date)}&s=Soccer`,
            { cache: "no-store" }
          );

          if (!response.ok) {
            continue;
          }

          const data: LaLigaDayResponse = await response.json();
          const events = Array.isArray(data.events) ? data.events : [];

          const spanishTeams = [
            "Athletic Club",
            "Athletic Bilbao",
            "Atlético de Madrid",
            "Atletico Madrid",
            "CA Osasuna",
            "Celta Vigo",
            "RC Celta",
            "Deportivo Alavés",
            "Deportivo Alaves",
            "Elche CF",
            "FC Barcelona",
            "Barcelona",
            "Getafe CF",
            "Levante UD",
            "Málaga CF",
            "Malaga CF",
            "Racing Santander",
            "R. Racing Club",
            "Rayo Vallecano",
            "RC Deportivo",
            "Deportivo de La Coruña",
            "RCD Espanyol",
            "Espanyol",
            "Real Betis",
            "Real Madrid",
            "Real Sociedad",
            "Sevilla FC",
            "Valencia CF",
            "Villarreal CF",
            "RCD Mallorca",
            "Girona FC",
          ].map((team) => team.toLowerCase());

          events.forEach((event) => {
            const home = event.strHomeTeam?.toLowerCase() ?? "";
            const away = event.strAwayTeam?.toLowerCase() ?? "";
            const hasSpanishTeam = spanishTeams.some(
              (team) =>
                home === team ||
                away === team ||
                home.includes(team) ||
                away.includes(team) ||
                team.includes(home) ||
                team.includes(away)
            );

            if (
              hasSpanishTeam &&
              event.strHomeTeam &&
              event.strAwayTeam &&
              !found.some((item) => item.idEvent === event.idEvent)
            ) {
              found.push(event);
            }
          });
        }

        if (!cancelled) {
          setLaLigaMatches(found.slice(0, 3));
          setSellerUpcomingMatches(found);
        }
      } catch {
        if (!cancelled) {
          setLaLigaMatches([]);
        }
      } finally {
        if (!cancelled) {
          setLaLigaLoading(false);
        }
      }
    }

    loadUpcomingLaLigaMatches();

    const refreshTimer = window.setInterval(
      loadUpcomingLaLigaMatches,
      30 * 60 * 1000
    );

    return () => {
      cancelled = true;
      window.clearInterval(refreshTimer);
    };
  }, []);

  function formatLaLigaDate(event: LaLigaEvent) {
    if (!event.dateEvent) {
      return "";
    }

    const [year, month, day] = event.dateEvent.split("-");
    const time = event.strTime?.slice(0, 5) || "";

    return time
      ? `${day}.${month}.${year} · ${time}`
      : `${day}.${month}.${year}`;
  }

  function weatherTypeFromCode(
    code: number
  ): WeatherType {
    if (
      code >= 51 &&
      code <= 82
    ) {
      return "rain";
    }

    if (
      code >= 95
    ) {
      return "rain";
    }

    if (
      code >= 2 &&
      code <= 48
    ) {
      return "cloud";
    }

    return "sun";
  }

  useEffect(() => {
    let cancelled = false;

    async function loadWeatherForSelectedCity() {
      const city =
        selectedCity.trim();

      if (!city) {
        return;
      }

      try {
        const geoResponse =
          await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=de&format=json`,
            {
              cache: "no-store",
            }
          );

        if (!geoResponse.ok) {
          throw new Error(
            "Ort konnte nicht gefunden werden."
          );
        }

        const geoData =
          (await geoResponse.json()) as {
            results?: {
              latitude: number;
              longitude: number;
              name: string;
            }[];
          };

        const place =
          geoData.results?.[0];

        if (!place) {
          throw new Error(
            "Ort konnte nicht gefunden werden."
          );
        }

        const weatherResponse =
          await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,precipitation_probability,weather_code,wind_speed_10m,is_day&daily=weather_code,temperature_2m_max&forecast_days=3&timezone=auto`,
            {
              cache: "no-store",
            }
          );

        if (!weatherResponse.ok) {
          throw new Error(
            "Wetter konnte nicht geladen werden."
          );
        }

        const data =
          (await weatherResponse.json()) as {
            current?: {
              temperature_2m?: number;
              precipitation_probability?: number;
              weather_code?: number;
              wind_speed_10m?: number;
              is_day?: number;
            };
            daily?: {
              weather_code?: number[];
              temperature_2m_max?: number[];
            };
          };

        if (
          cancelled ||
          !data.current
        ) {
          return;
        }

        const dailyCodes =
          data.daily?.weather_code ?? [];
        const dailyTemps =
          data.daily?.temperature_2m_max ?? [];

        const forecastDays:
          WeatherData["forecast"] = [
          "today",
          "sat",
          "sun",
        ].map(
          (
            day,
            index
          ) => ({
            day:
              day as
                | "today"
                | "sat"
                | "sun",
            temp:
              Math.round(
                dailyTemps[index] ??
                  data.current
                    ?.temperature_2m ??
                  0
              ),
            type:
              weatherTypeFromCode(
                dailyCodes[index] ??
                  data.current
                    ?.weather_code ??
                  0
              ),
          })
        );

        setLiveWeather({
          city,
          temperature:
            Math.round(
              data.current
                .temperature_2m ??
                0
            ),
          type:
            weatherTypeFromCode(
              data.current
                .weather_code ??
                0
            ),
          rain:
            Math.round(
              data.current
                .precipitation_probability ??
                0
            ),
          wind:
            Math.round(
              data.current
                .wind_speed_10m ??
                0
            ),
          isDay:
            data.current.is_day !== 0,
          forecast:
            forecastDays,
        });
      } catch {
        if (!cancelled) {
          setLiveWeather(
            weatherByCity[
              city
            ] ??
              weatherByCity
                .Barcelona
          );
        }
      }
    }

    setLiveWeather(null);
    void loadWeatherForSelectedCity();

    return () => {
      cancelled = true;
    };
  }, [selectedCity]);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      window.innerWidth > 760
    ) {
      return;
    }

    const cards =
      Array.from(
        document.querySelectorAll<HTMLElement>(
          ".match-card[data-ticket-city]"
        )
      );

    if (!cards.length) {
      return;
    }

    const observer =
      new IntersectionObserver(
        entries => {
          const visible =
            entries
              .filter(
                entry =>
                  entry.isIntersecting
              )
              .sort(
                (
                  a,
                  b
                ) =>
                  b.intersectionRatio -
                  a.intersectionRatio
              )[0];

          if (
            visible?.target instanceof
            HTMLElement
          ) {
            const city =
              visible.target.dataset
                .ticketCity;

            if (city) {
              setSelectedCity(
                city
              );
            }
          }
        },
        {
          threshold: [
            0.55,
            0.7,
            0.85,
          ],
        }
      );

    cards.forEach(
      card =>
        observer.observe(card)
    );

    return () => {
      observer.disconnect();
    };
  }, [visibleOffers.length]);

  const weather =
    liveWeather ??
    weatherByCity[
      selectedCity
    ] ??
    weatherByCity
      .Barcelona;

  const weatherClass =
    weather.type === "rain"
      ? "weather-rain"
      : weather.type === "cloud"
        ? "weather-cloud"
        : weather.isDay === false
          ? "weather-night"
          : "weather-sun";

  function weatherText(
    type:
      | WeatherType
      | "partly"
  ) {
    if (
      type ===
      "sun"
    ) {
      return t.sunny;
    }

    if (
      type ===
      "cloud"
    ) {
      return t.cloudy;
    }

    if (
      type ===
      "rain"
    ) {
      return t.rainy;
    }

    return t.partlyCloudy;
  }

  function forecastDay(
    day:
      | "today"
      | "sat"
      | "sun"
  ) {
    if (
      day ===
      "today"
    ) {
      return t.today;
    }

    if (
      day ===
      "sat"
    ) {
      return t.sat;
    }

    return t.sun;
  }

  const languageLabels:
    Record<
      Language,
      string
    > = {
    es:
      "Español",

    ca:
      "Català",

    en:
      "English",

    de:
      "Deutsch",
  };

  function handleSearch() {
    if (
      !searchText.trim()
    ) {
      return;
    }

    setSearchActive(
      true
    );

    setSelectedCity(
      "Barcelona"
    );
  }

  function handleResetSearch() {
    setSearchText("");

    setSearchActive(
      false
    );
  }

  useEffect(() => {
    void loadPublishedOffers();

    if (typeof window === "undefined") {
      return;
    }

    const recoveryParams = new URLSearchParams(
      window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : window.location.hash
    );
    const recoveryToken = recoveryParams.get("access_token");
    const recoveryType = recoveryParams.get("type");

    if (recoveryType === "recovery" && recoveryToken) {
      setPasswordRecoveryToken(recoveryToken);
      setAuthPassword("");
      setAuthMode("login");
      setAuthModalOpen(true);
      setAuthError(
        language === "de"
          ? "Bitte neues Passwort eingeben."
          : language === "en"
            ? "Please enter a new password."
            : language === "ca"
              ? "Introdueix una contrasenya nova."
              : "Introduce una contraseña nueva."
      );
      return;
    }

    const stored = window.localStorage.getItem(PASESPAIN_SESSION_KEY);

    if (!stored) {
      return;
    }

    const storedSession = stored;
    let cancelled = false;

    async function restoreSession() {
      try {
        const session = JSON.parse(storedSession) as SupabaseSession;

        if (!session.access_token || !session.user?.id) {
          clearSupabaseSession();
          return;
        }

        const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
          headers: {
            apikey: SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${session.access_token}`,
          },
          cache: "no-store",
        });

        if (!response.ok) {
          if (!cancelled) {
            clearSupabaseSession();
            setAccountManageOpen(false);
          }
          return;
        }

        if (cancelled) {
          return;
        }

        setSupabaseSession(session);

        const role = session.user.user_metadata?.role;
        if (role === "seller" || role === "buyer") {
          setLoggedInRole(role);
        } else {
          clearSupabaseSession();
          setAccountManageOpen(false);
          return;
        }
      } catch {
        if (!cancelled) {
          clearSupabaseSession();
          setAccountManageOpen(false);
        }
      }
    }

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  function supabaseReady() {
    return Boolean(
      SUPABASE_URL &&
      SUPABASE_PUBLISHABLE_KEY
    );
  }

  function storeSupabaseSession(
    session: SupabaseSession
  ) {
    setSupabaseSession(
      session
    );

    if (
      typeof window !== "undefined"
    ) {
      window.localStorage.setItem(
        PASESPAIN_SESSION_KEY,
        JSON.stringify(session)
      );
    }
  }

  function clearSupabaseSession() {
    setSupabaseSession(null);
    setLoggedInRole(null);

    if (
      typeof window !== "undefined"
    ) {
      window.localStorage.removeItem(
        PASESPAIN_SESSION_KEY
      );
    }
  }

  async function handleDeleteAccount() {
    if (!supabaseSession?.access_token) {
      setAccountDeleteError(
        language === "de"
          ? "Bitte melde dich erneut an."
          : language === "en"
            ? "Please sign in again."
            : language === "ca"
              ? "Torna a iniciar sessió."
              : "Vuelve a iniciar sesión."
      );
      return;
    }

    const confirmed =
      typeof window !== "undefined" &&
      window.confirm(
        language === "de"
          ? "Konto wirklich dauerhaft löschen? Aktive Ticketangebote werden entfernt. Gesetzlich aufzubewahrende Daten können nur so lange gespeichert bleiben, wie dies erforderlich ist."
          : language === "en"
            ? "Permanently delete this account? Active ticket listings will be removed. Data that must legally be retained may only remain for as long as required."
            : language === "ca"
              ? "Vols eliminar definitivament el compte? Les ofertes d’entrades actives s’eliminaran. Les dades que s’hagin de conservar legalment només es mantindran durant el temps necessari."
              : "¿Eliminar definitivamente la cuenta? Se eliminarán las ofertas de entradas activas. Los datos que deban conservarse legalmente solo se mantendrán durante el tiempo necesario."
      );

    if (!confirmed) {
      return;
    }

    setAccountDeleteLoading(true);
    setAccountDeleteError("");

    try {
      const response = await fetch(
        "/api/account/delete",
        {
          method: "DELETE",
          headers: {
            Authorization:
              `Bearer ${supabaseSession.access_token}`,
          },
        }
      );

      if (!response.ok) {
        const data =
          await response
            .json()
            .catch(() => null);

        throw new Error(
          data?.error ||
          "Account deletion failed."
        );
      }

      if (
        typeof window !== "undefined" &&
        supabaseSession?.user?.id
      ) {
        window.localStorage.removeItem(
          `pasespain-stripe-account-${supabaseSession.user.id}`
        );
      }

      clearSupabaseSession();
      setAccountManageOpen(false);
      setSellerModalOpen(false);
      setAuthModalOpen(false);
    } catch (error) {
      setAccountDeleteError(
        error instanceof Error
          ? error.message
          : language === "de"
            ? "Konto konnte nicht gelöscht werden."
            : language === "en"
              ? "Account could not be deleted."
              : language === "ca"
                ? "No s'ha pogut eliminar el compte."
                : "No se pudo eliminar la cuenta."
      );
    } finally {
      setAccountDeleteLoading(false);
    }
  }

  function rowToTicketOffer(
    row: TicketOfferRow
  ): TicketOffer {
    const price =
      Number.isFinite(
        Number(row.price_eur)
      )
        ? `${Number(row.price_eur)}€`
        : `${row.price_eur}€`;

    const details =
      row.details || "";

    // Interne Preis-/Gebührenzeilen dürfen nie auf der öffentlichen Ticketkarte erscheinen.
    const publicDetails = details
      .split("\n")
      .filter(line => {
        const value = line.trim().toLowerCase();
        return !([
          "gewünschte auszahlung",
          "verkäufer-auszahlung",
          "pasespain verkäufer-service",
          "pasespain käufer-service",
          "käufer-gesamtpreis",
        ].some(marker => value.includes(marker)));
      })
      .join("\n")
      .trim();

    const ticketCountMatch =
      details.match(/Anzahl Tickets:\s*(\d+)/i);

    const childTicketsMatch =
      details.match(/Kindertickets:\s*(\d+)/i);

    const ticketCount =
      ticketCountMatch
        ? Math.max(
            1,
            Number(ticketCountMatch[1]) || 1
          )
        : 1;

    const childTickets =
      childTicketsMatch
        ? Math.max(
            0,
            Number(childTicketsMatch[1]) || 0
          )
        : 0;

    return {
      id: row.id,
      sellerId: row.seller_id,
      home: row.home,
      away: row.away,
      date: row.match_date,
      stadium: row.stadium,
      city: row.city,
      price,
      unitPrice:
        Number(row.price_eur) || 0,
      ticketCount,
      childTickets,
      details:
        publicDetails ||
        undefined,
    };
  }

  async function loadPublishedOffers() {
    if (!supabaseReady()) {
      return;
    }

    try {
      const response =
        await fetch(
          `${SUPABASE_URL}/rest/v1/ticket_offers?select=id,seller_id,home,away,match_date,stadium,city,price_eur,details,created_at&status=eq.available&order=created_at.desc&limit=50`,
          {
            headers: {
              apikey:
                SUPABASE_PUBLISHABLE_KEY,
            },
            cache: "no-store",
          }
        );

      if (!response.ok) {
        return;
      }

      const rows =
        (await response.json()) as TicketOfferRow[];

      setSellerOffers(
        rows.map(
          rowToTicketOffer
        )
      );
    } catch {
      // Seite bleibt benutzbar, auch wenn Supabase kurz nicht erreichbar ist.
    }
  }

  function openBuyerAuth(
    mode: "login" | "register"
  ) {
    setActiveAuthRole("buyer");
    setAuthMode(mode);
    setAuthError("");
    setAuthModalOpen(true);
  }

  function openRoleArea(
    role: UserRole
  ) {
    if (loggedInRole) {
      if (loggedInRole !== role) {
        setAuthError(
          language === "de"
            ? role === "seller"
              ? "Du bist als Käufer angemeldet. Dieses Konto hat keinen Zugriff auf den Verkäuferbereich."
              : "Du bist als Verkäufer angemeldet. Dieses Konto hat keinen Zugriff auf den Käuferbereich."
            : language === "en"
              ? role === "seller"
                ? "You are signed in as a buyer. This account cannot access the seller area."
                : "You are signed in as a seller. This account cannot access the buyer area."
              : language === "ca"
                ? role === "seller"
                  ? "Has iniciat sessió com a comprador. Aquest compte no pot accedir a l'àrea de venedor."
                  : "Has iniciat sessió com a venedor. Aquest compte no pot accedir a l'àrea de comprador."
                : role === "seller"
                  ? "Has iniciado sesión como comprador. Esta cuenta no puede acceder al área de vendedor."
                  : "Has iniciado sesión como vendedor. Esta cuenta no puede acceder al área de comprador."
        );
        setActiveAuthRole(role);
        setAuthMode("login");
        setAuthModalOpen(true);
        return;
      }

      if (role === "seller") {
        setSellerPublishError("");
        setSellerModalOpen(true);
      }

      return;
    }

    setActiveAuthRole(role);
    setAuthMode("login");
    setAuthError("");
    setAuthModalOpen(true);
  }

  async function handleForgotPassword() {
    if (!authEmail.trim()) {
      setAuthError(
        language === "de"
          ? "Bitte zuerst deine E-Mail-Adresse eingeben."
          : language === "en"
            ? "Please enter your email address first."
            : language === "ca"
              ? "Introdueix primer el teu correu electrònic."
              : "Introduce primero tu correo electrónico."
      );
      return;
    }

    if (!supabaseReady()) {
      setAuthError("Supabase ist noch nicht verbunden.");
      return;
    }

    setPasswordResetLoading(true);
    setAuthError("");

    try {
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}${window.location.pathname}`
          : "";

      const response = await fetch(
        `${SUPABASE_URL}/auth/v1/recover?redirect_to=${encodeURIComponent(redirectTo)}`,
        {
        method: "POST",
        headers: {
          apikey: SUPABASE_PUBLISHABLE_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: authEmail.trim(),
        }),
      }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.msg || data?.error_description || data?.error || "Reset failed");
      }

      setAuthError(
        language === "de"
          ? "E-Mail zum Zurücksetzen des Passworts wurde gesendet."
          : language === "en"
            ? "Password reset email has been sent."
            : language === "ca"
              ? "S'ha enviat el correu per restablir la contrasenya."
              : "Se ha enviado el correo para restablecer la contraseña."
      );
    } catch (error) {
      setAuthError(
        error instanceof Error
          ? error.message
          : "Passwort konnte nicht zurückgesetzt werden."
      );
    } finally {
      setPasswordResetLoading(false);
    }
  }

  async function handlePasswordRecovery(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!passwordRecoveryToken) {
      setAuthError("Reset-Link ist ungültig oder abgelaufen.");
      return;
    }

    if (authPassword.trim().length < 6) {
      setAuthError(
        language === "de"
          ? "Das neue Passwort muss mindestens 6 Zeichen haben."
          : language === "en"
            ? "The new password must be at least 6 characters."
            : language === "ca"
              ? "La contrasenya nova ha de tenir almenys 6 caràcters."
              : "La nueva contraseña debe tener al menos 6 caracteres."
      );
      return;
    }

    setPasswordRecoveryLoading(true);
    setAuthError("");

    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        method: "PUT",
        headers: {
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${passwordRecoveryToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: authPassword }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(
          data?.msg ||
          data?.error_description ||
          data?.error ||
          "Passwort konnte nicht geändert werden."
        );
      }

      setPasswordRecoveryToken("");
      setAuthPassword("");
      if (typeof window !== "undefined") {
        window.history.replaceState(
          {},
          document.title,
          `${window.location.pathname}${window.location.search}`
        );
      }
      setAuthError(
        language === "de"
          ? "Passwort geändert. Du kannst dich jetzt anmelden."
          : language === "en"
            ? "Password changed. You can now sign in."
            : language === "ca"
              ? "Contrasenya canviada. Ja pots iniciar sessió."
              : "Contraseña cambiada. Ya puedes iniciar sesión."
      );
    } catch (error) {
      setAuthError(
        error instanceof Error
          ? error.message
          : "Passwort konnte nicht geändert werden."
      );
    } finally {
      setPasswordRecoveryLoading(false);
    }
  }

  async function handleLogin(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!authRoleChosen) {
      setAuthError(
        language === "de"
          ? "Bitte zuerst Käufer oder Verkäufer auswählen."
          : language === "en"
            ? "Please choose Buyer or Seller first."
            : language === "ca"
              ? "Tria primer Comprador o Venedor."
              : "Elige primero Comprador o Vendedor."
      );
      return;
    }

    if (
      !authEmail.trim() ||
      !authPassword.trim()
    ) {
      setAuthError(
        language === "de"
          ? "Bitte E-Mail und Passwort eingeben."
          : language === "en"
            ? "Please enter email and password."
            : language === "ca"
              ? "Introdueix el correu i la contrasenya."
              : "Introduce correo y contraseña."
      );

      return;
    }

    if (
      authMode === "register" &&
      authPassword.trim().length < 8
    ) {
      setAuthError(
        language === "de"
          ? "Das Passwort muss mindestens 8 Zeichen haben."
          : language === "en"
            ? "The password must contain at least 8 characters."
            : language === "ca"
              ? "La contrasenya ha de tenir almenys 8 caràcters."
              : "La contraseña debe tener al menos 8 caracteres."
      );

      return;
    }

    if (
      authMode === "register" &&
      (
        !sellerFirstName.trim() ||
        !sellerLastName.trim() ||
        !sellerStreet.trim() ||
        !sellerHouseNumber.trim() ||
        !sellerPostalCode.trim() ||
        !sellerProfileCity.trim() ||
        !sellerCountry.trim() ||
        !sellerPhone.trim() ||
        !sellerBirthDate.trim()
      )
    ) {
      setAuthError(
        language === "de"
          ? "Bitte alle Personalien vollständig ausfüllen."
          : language === "en"
            ? "Please complete all personal details."
            : language === "ca"
              ? "Completa totes les dades personals."
              : "Completa todos los datos personales."
      );

      return;
    }

    if (
      authMode === "register" &&
      !sellerTermsAccepted
    ) {
      setAuthError(
        language === "de"
          ? "Bitte AGB und Datenschutz akzeptieren."
          : language === "en"
            ? "Please accept the terms and privacy policy."
            : language === "ca"
              ? "Accepta els termes i la política de privacitat."
              : "Acepta los términos y la política de privacidad."
      );

      return;
    }

    if (!supabaseReady()) {
      setAuthError(
        language === "de"
          ? "Supabase ist noch nicht verbunden. URL und Anon-Key fehlen."
          : language === "en"
            ? "Supabase is not connected yet. URL and anon key are missing."
            : language === "ca"
              ? "Supabase encara no està connectat. Falten l'URL i la clau anon."
              : "Supabase todavía no está conectado. Faltan la URL y la clave anon."
      );
      return;
    }

    setAuthLoading(true);
    setAuthError("");

    try {
      const endpoint =
        authMode === "register"
          ? `${SUPABASE_URL}/auth/v1/signup`
          : `${SUPABASE_URL}/auth/v1/token?grant_type=password`;

      const body =
        authMode === "register"
          ? {
              email:
                authEmail.trim(),
              password:
                authPassword,
              data: {
                role:
                  activeAuthRole,
                first_name:
                  sellerFirstName.trim(),
                last_name:
                  sellerLastName.trim(),
                street:
                  sellerStreet.trim(),
                house_number:
                  sellerHouseNumber.trim(),
                postal_code:
                  sellerPostalCode.trim(),
                city:
                  sellerProfileCity.trim(),
                country:
                  sellerCountry.trim(),
                phone:
                  sellerPhone.trim(),
                birth_date:
                  sellerBirthDate,
                terms_accepted:
                  true,
                privacy_accepted:
                  true,
              },
            }
          : {
              email:
                authEmail.trim(),
              password:
                authPassword,
            };

      const response =
        await fetch(
          endpoint,
          {
            method: "POST",
            headers: {
              apikey:
                SUPABASE_PUBLISHABLE_KEY,
              "Content-Type":
                "application/json",
            },
            body:
              JSON.stringify(
                body
              ),
          }
        );

      const data =
        (await response.json()) as SupabaseAuthResponse;

      if (!response.ok) {
        throw new Error(
          data.error_description ||
          data.msg ||
          data.message ||
          "Authentication failed"
        );
      }

      const accessToken =
        data.access_token ||
        data.session
          ?.access_token;

      const refreshToken =
        data.refresh_token ||
        data.session
          ?.refresh_token;

      if (
        !accessToken ||
        !data.user
      ) {
        setAuthError(
          language === "de"
            ? "Registrierung erstellt. Bitte bestätige zuerst die E-Mail und melde dich danach an."
            : language === "en"
              ? "Registration created. Please confirm your email first and then sign in."
              : language === "ca"
                ? "Registre creat. Confirma primer el correu i després inicia sessió."
                : "Registro creado. Confirma primero el correo y después inicia sesión."
        );
        setAuthMode(
          "login"
        );
        return;
      }

      let actualRole =
        data.user.user_metadata?.role as UserRole | undefined;

      // Bestehende Konten aus der früheren Version hatten teilweise
      // noch keine Rolle in user_metadata. In diesem Fall prüfen wir
      // serverseitig über das persönliche Käufer-/Verkäuferprofil.
      if (actualRole !== "buyer" && actualRole !== "seller") {
        const selectedProfileTable =
          activeAuthRole === "seller" ? "seller_profiles" : "buyer_profiles";

        const profileCheck = await fetch(
          `${SUPABASE_URL}/rest/v1/${selectedProfileTable}?user_id=eq.${encodeURIComponent(data.user.id)}&select=user_id&limit=1`,
          {
            headers: {
              apikey: SUPABASE_PUBLISHABLE_KEY,
              Authorization: `Bearer ${accessToken}`,
            },
            cache: "no-store",
          }
        );

        if (profileCheck.ok) {
          const rows = (await profileCheck.json()) as Array<{ user_id?: string }>;
          if (rows.length > 0) {
            actualRole = activeAuthRole;
          }
        }
      }

      if (actualRole !== "buyer" && actualRole !== "seller") {
        throw new Error(
          language === "de"
            ? "Für dieses Konto wurde kein Käufer- oder Verkäuferprofil gefunden."
            : language === "en"
              ? "No buyer or seller profile was found for this account."
              : language === "ca"
                ? "No s'ha trobat cap perfil de comprador o venedor per a aquest compte."
                : "No se encontró un perfil de comprador o vendedor para esta cuenta."
        );
      }

      

      const session: SupabaseSession = {
        access_token:
          accessToken,
        refresh_token:
          refreshToken,
        user:
          data.user,
      };

      storeSupabaseSession(
        session
      );

      if (
        authMode === "register"
      ) {
        const profileTable =
          activeAuthRole === "seller"
            ? "seller_profiles"
            : "buyer_profiles";

        const profileResponse =
          await fetch(
            `${SUPABASE_URL}/rest/v1/${profileTable}`,
            {
              method: "POST",
              headers: {
                apikey:
                  SUPABASE_PUBLISHABLE_KEY,
                Authorization:
                  `Bearer ${session.access_token}`,
                "Content-Type":
                  "application/json",
                Prefer:
                  "resolution=merge-duplicates,return=minimal",
              },
              body:
                JSON.stringify({
                  user_id:
                    session.user.id,
                  first_name:
                    sellerFirstName.trim(),
                  last_name:
                    sellerLastName.trim(),
                  street:
                    sellerStreet.trim(),
                  house_number:
                    sellerHouseNumber.trim(),
                  postal_code:
                    sellerPostalCode.trim(),
                  city:
                    sellerProfileCity.trim(),
                  country:
                    sellerCountry.trim(),
                  phone:
                    sellerPhone.trim(),
                  birth_date:
                    sellerBirthDate,
                  terms_accepted:
                    true,
                  privacy_accepted:
                    true,
                }),
            }
          );

        if (
          !profileResponse.ok
        ) {
          const profileError =
            await profileResponse.text();

          throw new Error(
            profileError ||
            (activeAuthRole === "seller"
              ? "Verkäuferprofil konnte nicht gespeichert werden."
              : "Käuferprofil konnte nicht gespeichert werden.")
          );
        }
      }

      setLoggedInRole(
        activeAuthRole
      );
      setAuthError("");
      setAuthModalOpen(
        false
      );
      setAuthPassword("");

      if (
        activeAuthRole ===
        "seller"
      ) {
        setSellerPublishError("");
        setSellerModalOpen(
          true
        );
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Authentication failed";

      setAuthError(
        message
      );
    } finally {
      setAuthLoading(
        false
      );
    }
  }

  function sellerDetailValue(
    details: string | undefined,
    label: string
  ) {
    if (!details) return "";

    const line = details
      .split("\n")
      .find(item =>
        item.toLowerCase().startsWith(`${label.toLowerCase()}:`)
      );

    return line
      ? line.slice(line.indexOf(":") + 1).trim()
      : "";
  }

  function translatedOfferDetails(details: string | undefined) {
    if (!details) return "";

    const labels: Record<Language, Record<string, string>> = {
      de: { "Wettbewerb": "Wettbewerb", "Termin": "Termin", "Anzahl Tickets": "Anzahl Tickets", "Zone / Tribüne": "Zone / Tribüne", "Sektor": "Sektor", "Reihe": "Reihe", "Kindertickets": "Kindertickets", "Kindertickets Beschreibung": "Kindertickets Beschreibung" },
      en: { "Wettbewerb": "Competition", "Termin": "Date", "Anzahl Tickets": "Number of tickets", "Zone / Tribüne": "Stand / Zone", "Sektor": "Sector", "Reihe": "Row", "Kindertickets": "Child tickets", "Kindertickets Beschreibung": "Child ticket details" },
      ca: { "Wettbewerb": "Competició", "Termin": "Data", "Anzahl Tickets": "Nombre d’entrades", "Zone / Tribüne": "Tribuna / Zona", "Sektor": "Sector", "Reihe": "Fila", "Kindertickets": "Entrades infantils", "Kindertickets Beschreibung": "Detalls de les entrades infantils" },
      es: { "Wettbewerb": "Competición", "Termin": "Fecha", "Anzahl Tickets": "Número de entradas", "Zone / Tribüne": "Tribuna / Zona", "Sektor": "Sector", "Reihe": "Fila", "Kindertickets": "Entradas infantiles", "Kindertickets Beschreibung": "Detalles de entradas infantiles" },
    };

    return details.split("\n").map((line) => {
      const separator = line.indexOf(":");
      if (separator < 0) return line;
      const rawLabel = line.slice(0, separator).trim();
      let value = line.slice(separator + 1).trim();
      const translatedLabel = labels[language][rawLabel];
      if (!translatedLabel) return line;

      if (rawLabel === "Termin") {
        const lower = value.toLowerCase();
        if (lower.includes("noch nicht bestätigt")) {
          value = language === "de" ? "Noch nicht bestätigt" : language === "en" ? "Not confirmed yet" : language === "ca" ? "Encara no confirmada" : "Aún no confirmada";
        } else if (lower.includes("bestätigt")) {
          value = language === "de" ? "Bestätigt" : language === "en" ? "Confirmed" : language === "ca" ? "Confirmada" : "Confirmada";
        }
      }

      return `${translatedLabel}: ${value}`;
    }).join("\n");
  }

  function startSellerOfferEdit(
    offer: TicketOffer
  ) {
    if (!offer.id) return;

    const details = offer.details || "";
    const dateStatus = sellerDetailValue(details, "Termin");
    const dateIsOpen =
      dateStatus.toLowerCase().includes("noch nicht bestätigt") ||
      offer.date.startsWith("2099-12-31");

    const structuredPrefixes = [
      "Wettbewerb:",
      "Termin:",
      "Anzahl Tickets:",
      "Zone / Tribüne:",
      "Sektor:",
      "Kindertickets:",
      "Kindertickets Beschreibung:",
    ];

    const freeDescription = details
      .split("\n")
      .filter(line =>
        line.trim() &&
        !structuredPrefixes.some(prefix =>
          line.trim().startsWith(prefix)
        )
      )
      .join("\n");

    setSellerOfferEditId(offer.id);
    setSellerCompetition(
      sellerDetailValue(details, "Wettbewerb") || "LaLiga"
    );
    setSellerHome(offer.home);
    setSellerAway(offer.away);
    setSellerDate(dateIsOpen ? "" : offer.date.slice(0, 16));
    setSellerDateOpen(dateIsOpen);
    setSellerStadium(offer.stadium);
    setSellerZone(sellerDetailValue(details, "Zone / Tribüne"));
    setSellerSector(sellerDetailValue(details, "Reihe") || sellerDetailValue(details, "Sektor"));
    setSellerCity(offer.city || "");
    setSellerRow(offer.rowNumber || "");
    setSellerPrice(offer.price.replace("€", "").trim());
    setSellerTicketCount(
      sellerDetailValue(details, "Anzahl Tickets") ||
      String(offer.ticketCount || 1)
    );
    setSellerChildTickets(
      sellerDetailValue(details, "Kindertickets") ||
      String(offer.childTickets || 0)
    );
    setSellerChildTicketDescription(
      sellerDetailValue(details, "Kindertickets Beschreibung")
    );
    setSellerDescription(freeDescription);
    setSellerFairplayAccepted(true);
    setSellerPublishError("");
    setMobilePage("sell");
    setSellerModalOpen(true);
  }

  function cancelSellerOfferEdit() {
    setSellerOfferEditId(null);
    setSellerMatchSelection("");
    setSellerCompetition("LaLiga");
    setSellerHome("");
    setSellerAway("");
    setSellerDate("");
    setSellerDateOpen(false);
    setSellerStadium("");
    setSellerZone("");
    setSellerSector("");
    setSellerRow("");
    setSellerCity("");
    setSellerPrice("");
    setSellerTicketCount("");
    setSellerChildTickets("");
    setSellerChildTicketDescription("");
    setSellerDescription("");
    setSellerFairplayAccepted(false);
    setSellerPublishError("");
  }

  async function handleSellerOfferDelete(
    offer: TicketOffer
  ) {
    if (
      loggedInRole !== "seller" ||
      !offer.id ||
      !supabaseSession?.access_token ||
      !supabaseSession.user?.id ||
      offer.sellerId !== supabaseSession.user.id
    ) {
      setSellerPriceEditError(
        language === "de"
          ? "Dieses Ticket kann nicht gelöscht werden."
          : language === "en"
            ? "This ticket cannot be deleted."
            : language === "ca"
              ? "Aquesta entrada no es pot eliminar."
              : "Esta entrada no se puede eliminar."
      );
      return;
    }

    const confirmed = window.confirm(
      language === "de"
        ? `Ticket ${offer.home} – ${offer.away} wirklich löschen?`
        : language === "en"
          ? `Really delete ${offer.home} – ${offer.away}?`
          : language === "ca"
            ? `Vols eliminar realment ${offer.home} – ${offer.away}?`
            : `¿Eliminar realmente ${offer.home} – ${offer.away}?`
    );

    if (!confirmed) return;

    setSellerOfferDeletingId(offer.id);
    setSellerPriceEditError("");

    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/ticket_offers?id=eq.${encodeURIComponent(
          offer.id
        )}&seller_id=eq.${encodeURIComponent(
          supabaseSession.user.id
        )}`,
        {
          method: "DELETE",
          headers: {
            apikey: SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${supabaseSession.access_token}`,
          },
        }
      );

      if (!response.ok) {
        const deleteError = await response.text();
        throw new Error(
          deleteError ||
          (language === "de"
            ? "Ticket konnte nicht gelöscht werden."
            : "Ticket could not be deleted.")
        );
      }

      setSellerOffers(current =>
        current.filter(item => item.id !== offer.id)
      );

      if (sellerOfferEditId === offer.id) {
        cancelSellerOfferEdit();
      }
    } catch (error) {
      setSellerPriceEditError(
        error instanceof Error
          ? error.message
          : "Ticket konnte nicht gelöscht werden."
      );
    } finally {
      setSellerOfferDeletingId(null);
    }
  }

  async function handleSellerPriceUpdate(
    offer: TicketOffer
  ) {
    if (
      loggedInRole !== "seller" ||
      !offer.id ||
      !supabaseSession?.access_token ||
      !supabaseSession.user?.id ||
      offer.sellerId !== supabaseSession.user.id
    ) {
      setSellerPriceEditError(
        language === "de"
          ? "Bitte zuerst als Verkäufer anmelden."
          : language === "en"
            ? "Please sign in as a seller first."
            : language === "ca"
              ? "Inicia sessió primer com a venedor."
              : "Inicia sesión primero como vendedor."
      );
      return;
    }

    if (
      !stripeAccountId ||
      !stripePayoutsEnabled ||
      !stripeDetailsSubmitted
    ) {
      setSellerPriceEditError(
        language === "de"
          ? "Bitte zuerst dein Auszahlungskonto über Stripe vollständig einrichten."
          : language === "en"
            ? "Please complete your Stripe payout setup first."
            : language === "ca"
              ? "Completa primer la configuració de pagaments de Stripe."
              : "Completa primero la configuración de pagos de Stripe."
      );
      return;
    }

    const numericPrice =
      Number(
        sellerPriceEditValue
          .trim()
          .replace(",", ".")
      );

    if (
      !Number.isFinite(numericPrice) ||
      numericPrice <= 0
    ) {
      setSellerPriceEditError(
        language === "de"
          ? "Bitte einen gültigen Verkaufspreis eingeben."
          : language === "en"
            ? "Please enter a valid price."
            : language === "ca"
              ? "Introdueix un preu vàlid."
              : "Introduce un precio válido."
      );
      return;
    }

    setSellerPriceUpdating(true);
    setSellerPriceEditError("");

    try {
      const response =
        await fetch(
          `${SUPABASE_URL}/rest/v1/ticket_offers?id=eq.${encodeURIComponent(
            offer.id
          )}&seller_id=eq.${encodeURIComponent(
            supabaseSession.user.id
          )}`,
          {
            method: "PATCH",
            headers: {
              apikey:
                SUPABASE_PUBLISHABLE_KEY,
              Authorization:
                `Bearer ${supabaseSession.access_token}`,
              "Content-Type":
                "application/json",
              Prefer:
                "return=representation",
            },
            body:
              JSON.stringify({
                price_eur:
                  numericPrice,
              }),
          }
        );

      if (!response.ok) {
        const updateError =
          await response.text();

        throw new Error(
          updateError ||
          "Preis konnte nicht geändert werden."
        );
      }

      const rows =
        (await response.json()) as TicketOfferRow[];

      if (rows[0]) {
        const updatedOffer =
          rowToTicketOffer(
            rows[0]
          );

        setSellerOffers(
          current =>
            current.map(
              item =>
                item.id ===
                updatedOffer.id
                  ? updatedOffer
                  : item
            )
        );
      } else {
        await loadPublishedOffers();
      }

      setSellerPriceEditId(null);
      setSellerPriceEditValue("");
      setSellerPriceEditError("");
    } catch (error) {
      setSellerPriceEditError(
        error instanceof Error
          ? error.message
          : "Preis konnte nicht geändert werden."
      );
    } finally {
      setSellerPriceUpdating(false);
    }
  }

  async function loadStripeStatus() {
    if (
      loggedInRole !== "seller" ||
      !supabaseSession?.access_token
    ) {
      setStripeAccountId("");
      setStripePayoutsEnabled(false);
      setStripeDetailsSubmitted(false);
      return;
    }

    setStripeStatusLoading(true);

    try {
      const response = await fetch(
        "/api/stripe/status",
        {
          method: "GET",
          headers: {
            Authorization:
              `Bearer ${supabaseSession.access_token}`,
          },
          cache: "no-store",
        }
      );

      const data =
        (await response.json()) as {
          accountId?: string;
          connected?: boolean;
          payoutsEnabled?: boolean;
          chargesEnabled?: boolean;
          detailsSubmitted?: boolean;
          error?: string;
        };

      if (!response.ok) {
        throw new Error(
          data.error ||
          "Stripe-Status konnte nicht geprüft werden."
        );
      }

      setStripeAccountId(
        data.connected && data.accountId
          ? data.accountId
          : ""
      );

      setStripePayoutsEnabled(
        Boolean(data.payoutsEnabled)
      );

      setStripeDetailsSubmitted(
        Boolean(data.detailsSubmitted)
      );

      setStripeOnboardingError("");
    } catch (error) {
      setStripeOnboardingError(
        error instanceof Error
          ? error.message
          : "Stripe-Status konnte nicht geprüft werden."
      );
    } finally {
      setStripeStatusLoading(false);
    }
  }

  async function handleStripeOnboarding() {
    if (
      loggedInRole !== "seller" ||
      !supabaseSession?.user?.id
    ) {
      setStripeOnboardingError(
        language === "de"
          ? "Bitte zuerst als Verkäufer anmelden."
          : language === "en"
            ? "Please sign in as a seller first."
            : language === "ca"
              ? "Inicia sessió primer com a venedor."
              : "Inicia sesión primero como vendedor."
      );
      return;
    }

    setStripeOnboardingLoading(true);
    setStripeOnboardingError("");

    try {
      const connectResponse =
        await fetch(
          "/api/stripe/connect",
          {
            method: "POST",
            headers: {
              Authorization:
                `Bearer ${supabaseSession.access_token}`,
            },
          }
        );

      const connectData =
        (await connectResponse.json()) as {
          accountId?: string;
          error?: string;
        };

      if (
        !connectResponse.ok ||
        !connectData.accountId
      ) {
        throw new Error(
          connectData.error ||
          "Stripe Connect Konto konnte nicht geladen werden."
        );
      }

      const accountId =
        connectData.accountId;

      setStripeAccountId(
        accountId
      );

      const onboardingResponse =
        await fetch(
          "/api/stripe/onboarding",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Authorization:
                `Bearer ${supabaseSession.access_token}`,
            },
            body:
              JSON.stringify({
                accountId,
              }),
          }
        );

      const onboardingData =
        (await onboardingResponse.json()) as {
          url?: string;
          error?: string;
        };

      if (
        !onboardingResponse.ok ||
        !onboardingData.url
      ) {
        throw new Error(
          onboardingData.error ||
          "Stripe Onboarding-Link konnte nicht erstellt werden."
        );
      }

      window.location.href =
        onboardingData.url;
    } catch (error) {
      setStripeOnboardingError(
        error instanceof Error
          ? error.message
          : "Stripe konnte nicht geöffnet werden."
      );
    } finally {
      setStripeOnboardingLoading(false);
    }
  }

  async function handleSellerSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!sellerFairplayAccepted) {
      setSellerPublishError(
        language === "de"
          ? "Bitte bestätige zuerst die PaseSpain-Fairplay-Regeln."
          : language === "en"
            ? "Please accept the PaseSpain Fairplay rules first."
            : language === "ca"
              ? "Confirma primer les regles de Fairplay de PaseSpain."
              : "Confirma primero las reglas Fairplay de PaseSpain."
      );
      return;
    }

    if (
      !sellerCompetition.trim() ||
      !sellerHome.trim() ||
      !sellerAway.trim() ||
      (!sellerDateOpen && !sellerDate.trim()) ||
      !sellerStadium.trim() ||
      (!sellerOfferEditId && !sellerZone.trim()) ||
      (!sellerOfferEditId && !sellerSector.trim()) ||
      !sellerPrice.trim() ||
      !sellerTicketCount.trim()
    ) {
      setSellerPublishError(
        language === "de"
          ? "Bitte alle Pflichtfelder ausfüllen."
          : language === "en"
            ? "Please complete all required fields."
            : language === "ca"
              ? "Omple tots els camps obligatoris."
              : "Completa todos los campos obligatorios."
      );
      return;
    }

    if (
      loggedInRole !== "seller" ||
      !supabaseSession?.access_token ||
      !supabaseSession.user?.id
    ) {
      setSellerPublishError(
        language === "de"
          ? "Bitte zuerst als Verkäufer anmelden."
          : language === "en"
            ? "Please sign in as a seller first."
            : language === "ca"
              ? "Inicia sessió primer com a venedor."
              : "Inicia sesión primero como vendedor."
      );
      setSellerModalOpen(false);
      setActiveAuthRole("seller");
      setAuthMode("login");
      setAuthModalOpen(true);
      return;
    }

    const numericPrice =
      Number(
        sellerPrice
          .trim()
          .replace(
            ",",
            "."
          )
          .replace(
            "€",
            ""
          )
      );

    if (
      !Number.isFinite(
        numericPrice
      ) ||
      numericPrice <= 0
    ) {
      setSellerPublishError(
        language === "de"
          ? "Bitte eine gültige gewünschte Auszahlung eingeben."
          : language === "en"
            ? "Please enter a valid price."
            : language === "ca"
              ? "Introdueix un preu vàlid."
              : "Introduce un precio válido."
      );
      return;
    }

    const numericTicketCount =
      Number(sellerTicketCount.trim());

    const numericChildTickets =
      sellerChildTickets.trim()
        ? Number(sellerChildTickets.trim())
        : 0;

    if (
      !Number.isInteger(numericTicketCount) ||
      numericTicketCount < 1
    ) {
      setSellerPublishError(
        language === "de"
          ? "Bitte eine gültige Anzahl Tickets eingeben."
          : language === "en"
            ? "Please enter a valid number of tickets."
            : language === "ca"
              ? "Introdueix un nombre vàlid d'entrades."
              : "Introduce una cantidad válida de entradas."
      );
      return;
    }

    if (
      !Number.isInteger(numericChildTickets) ||
      numericChildTickets < 0 ||
      numericChildTickets > numericTicketCount
    ) {
      setSellerPublishError(
        language === "de"
          ? "Kindertickets müssen zwischen 0 und der Gesamtzahl der Tickets liegen."
          : language === "en"
            ? "Child tickets must be between 0 and the total number of tickets."
            : language === "ca"
              ? "Les entrades infantils han d'estar entre 0 i el total d'entrades."
              : "Las entradas infantiles deben estar entre 0 y el total de entradas."
      );
      return;
    }

    setSellerPublishing(true);
    setSellerPublishError("");

    try {
      if (!sellerDateOpen) {
        const verifyResponse = await fetch("/api/verify-match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            competition: sellerCompetition.trim(),
            home: sellerHome.trim(),
            away: sellerAway.trim(),
            date: sellerDate.trim(),
            stadium: sellerStadium.trim(),
          }),
        });

        const verification = (await verifyResponse.json().catch(() => null)) as
          | { verified?: boolean; message?: string }
          | null;

        if (!verifyResponse.ok || !verification?.verified) {
          throw new Error(
            verification?.message ||
              (language === "de"
                ? "Spielangaben konnten nicht bestätigt werden. Bitte Teams, Datum und Stadion prüfen."
                : language === "en"
                  ? "Match details could not be verified. Please check teams, date and stadium."
                  : language === "ca"
                    ? "No s'han pogut verificar les dades del partit. Revisa els equips, la data i l'estadi."
                    : "No se han podido verificar los datos del partido. Revisa equipos, fecha y estadio.")
          );
        }
      }

      const response =
        await fetch(
          sellerOfferEditId
            ? `${SUPABASE_URL}/rest/v1/ticket_offers?id=eq.${encodeURIComponent(
                sellerOfferEditId
              )}&seller_id=eq.${encodeURIComponent(
                supabaseSession.user.id
              )}`
            : `${SUPABASE_URL}/rest/v1/ticket_offers`,
          {
            method: sellerOfferEditId ? "PATCH" : "POST",
            headers: {
              apikey:
                SUPABASE_PUBLISHABLE_KEY,
              Authorization:
                `Bearer ${supabaseSession.access_token}`,
              "Content-Type":
                "application/json",
              Prefer:
                "return=representation",
            },
            body:
              JSON.stringify({
                seller_id:
                  supabaseSession.user.id,
                home:
                  sellerHome.trim(),
                away:
                  sellerAway.trim(),
                match_date:
                  sellerDateOpen
                    ? "2099-12-31T23:59"
                    : sellerDate.trim(),
                stadium:
                  sellerStadium.trim(),
                city:
                  sellerCity.trim(),
                price_eur:
                  numericPrice,
                details:
                  [
                    `Wettbewerb: ${sellerCompetition.trim()}`,
                    sellerDateOpen
                      ? "Termin: Noch nicht bestätigt"
                      : "Termin: Bestätigt",
                    `Anzahl Tickets: ${numericTicketCount}`,
                    `Zone / Tribüne: ${sellerZone.trim()}`,
                    `Reihe: ${sellerRow.trim()}`,
                    `Kindertickets: ${numericChildTickets}`,
                    sellerChildTicketDescription.trim()
                      ? `Kindertickets Beschreibung: ${sellerChildTicketDescription.trim()}`
                      : "",
                    sellerDescription.trim(),
                  ]
                    .filter(Boolean)
                    .join("\n"),
              }),
          }
        );

      const bodyText =
        await response.text();

      if (!response.ok) {
        throw new Error(
          bodyText ||
          "Ticket konnte nicht veröffentlicht werden."
        );
      }

      const rows =
        bodyText
          ? (JSON.parse(
              bodyText
            ) as TicketOfferRow[])
          : [];

      if (rows[0]) {
        const savedOffer = rowToTicketOffer(rows[0]);

        setSellerOffers(current =>
          sellerOfferEditId
            ? current.map(offer =>
                offer.id === savedOffer.id
                  ? savedOffer
                  : offer
              )
            : [
                savedOffer,
                ...current.filter(
                  offer =>
                    !(
                      offer.home === rows[0].home &&
                      offer.away === rows[0].away &&
                      offer.date === rows[0].match_date
                    )
                ),
              ]
        );
      } else {
        await loadPublishedOffers();
      }

      setSellerOfferEditId(null);
      setSellerMatchSelection("");
      setSellerCompetition("LaLiga");
      setSellerHome("");
      setSellerAway("");
      setSellerDate("");
      setSellerDateOpen(false);
      setSellerStadium("");
      setSellerZone("");
      setSellerSector("");
      setSellerCity("");
      setSellerPrice("");
      setSellerTicketCount("");
      setSellerChildTickets("");
      setSellerChildTicketDescription("");
      setSellerDescription("");
      setSellerFairplayAccepted(false);
      setSellerModalOpen(
        false
      );
    } catch (error) {
      setSellerPublishError(
        error instanceof Error
          ? error.message
          : "Ticket konnte nicht veröffentlicht werden."
      );
    } finally {
      setSellerPublishing(
        false
      );
    }
  }

  function addToCart(
    offer: TicketOffer
  ) {
    if (loggedInRole !== "buyer") {
      setActiveAuthRole("buyer");
      setAuthMode("login");
      setAuthError(
        loggedInRole === "seller"
          ? language === "de"
            ? "Du bist als Verkäufer angemeldet. Verkäuferkonten können nicht als Käufer einkaufen."
            : language === "en"
              ? "You are signed in as a seller. Seller accounts cannot buy as buyers."
              : language === "ca"
                ? "Has iniciat sessió com a venedor. Els comptes de venedor no poden comprar com a comprador."
                : "Has iniciado sesión como vendedor. Las cuentas de vendedor no pueden comprar como comprador."
          : ""
      );
      setAuthModalOpen(true);
      return;
    }

    setCartItems(
      (
        current
      ) => [
        ...current,
        offer,
      ]
    );
  }

  function removeFromCart(
    indexToRemove: number
  ) {
    setCartItems(
      (
        current
      ) =>
        current.filter(
          (
            _,
            index
          ) =>
            index !==
            indexToRemove
        )
    );
  }

  async function handleCheckout() {
    if (loggedInRole !== "buyer" || !supabaseSession?.access_token) {
      setActiveAuthRole("buyer");
      setAuthMode("login");
      setAuthModalOpen(true);
      return;
    }

    const offerIds = cartItems
      .map(item => item.id)
      .filter((id): id is string => Boolean(id));

    if (!offerIds.length) {
      setCheckoutError(language === "de" ? "Keine gültigen Tickets im Warenkorb." : "No valid tickets in cart.");
      return;
    }

    setCheckoutLoading(true);
    setCheckoutError("");

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseSession.access_token}`,
        },
        body: JSON.stringify({ offerIds }),
      });

      const data = await response.json().catch(() => null) as { url?: string; error?: string } | null;
      if (!response.ok || !data?.url) {
        throw new Error(data?.error || "Stripe Checkout konnte nicht gestartet werden.");
      }

      window.location.href = data.url;
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "Stripe Checkout konnte nicht gestartet werden.");
    } finally {
      setCheckoutLoading(false);
    }
  }

  async function loadSellerOrders() {
    if (loggedInRole !== "seller" || !supabaseSession?.access_token) return;

    setSellerOrdersLoading(true);
    try {
      const response = await fetch("/api/orders/seller", {
        headers: { Authorization: `Bearer ${supabaseSession.access_token}` },
        cache: "no-store",
      });
      const data = await response.json().catch(() => null) as { orders?: SellerOrder[] } | null;
      if (response.ok && Array.isArray(data?.orders)) setSellerOrders(data.orders);
    } finally {
      setSellerOrdersLoading(false);
    }
  }

  async function uploadTicketForOrder(orderId: string, file: File | null) {
    if (!file || loggedInRole !== "seller" || !supabaseSession?.access_token) return;

    setTicketUploadOrderId(orderId);
    setTicketUploadError("");

    try {
      const formData = new FormData();
      formData.append("orderId", orderId);
      formData.append("ticket", file);

      const response = await fetch("/api/orders/ticket-upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${supabaseSession.access_token}` },
        body: formData,
      });

      const data = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(data?.error || "Ticket konnte nicht hochgeladen werden.");
      }

      await loadSellerOrders();
    } catch (error) {
      setTicketUploadError(error instanceof Error ? error.message : "Ticket konnte nicht hochgeladen werden.");
    } finally {
      setTicketUploadOrderId(null);
    }
  }

  async function loadBuyerOrders() {
    if (loggedInRole !== "buyer" || !supabaseSession?.access_token) return;

    setBuyerOrdersLoading(true);
    setBuyerOrdersError("");
    try {
      const response = await fetch("/api/orders/buyer", {
        headers: { Authorization: `Bearer ${supabaseSession.access_token}` },
        cache: "no-store",
      });
      const data = await response.json().catch(() => null) as { orders?: BuyerOrder[]; error?: string } | null;
      if (!response.ok) {
        throw new Error(data?.error || "Tickets konnten nicht geladen werden.");
      }
      setBuyerOrders(Array.isArray(data?.orders) ? data.orders : []);
    } catch (error) {
      setBuyerOrdersError(error instanceof Error ? error.message : "Tickets konnten nicht geladen werden.");
    } finally {
      setBuyerOrdersLoading(false);
    }
  }

  async function openBuyerTicket(orderId: string) {
    if (loggedInRole !== "buyer" || !supabaseSession?.access_token) return;

    setBuyerTicketOpeningId(orderId);
    setBuyerOrdersError("");
    try {
      const response = await fetch("/api/orders/ticket-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseSession.access_token}`,
        },
        body: JSON.stringify({ orderId }),
      });
      const data = await response.json().catch(() => null) as { url?: string; error?: string } | null;
      if (!response.ok || !data?.url) {
        throw new Error(data?.error || "Ticket konnte nicht geöffnet werden.");
      }
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      setBuyerOrdersError(error instanceof Error ? error.message : "Ticket konnte nicht geöffnet werden.");
    } finally {
      setBuyerTicketOpeningId(null);
    }
  }

  useEffect(() => {
    if (sellerModalOpen && loggedInRole === "seller") {
      void loadSellerOrders();
    }
  }, [sellerModalOpen, loggedInRole]);

  useEffect(() => {
    if (
      loggedInRole !== "seller" ||
      !supabaseSession?.access_token
    ) {
      setStripeAccountId("");
      setStripePayoutsEnabled(false);
      setStripeDetailsSubmitted(false);
      return;
    }

    void loadStripeStatus();

    const refreshStripeStatus = () => {
      void loadStripeStatus();
    };

    window.addEventListener(
      "focus",
      refreshStripeStatus
    );

    window.addEventListener(
      "pageshow",
      refreshStripeStatus
    );

    return () => {
      window.removeEventListener(
        "focus",
        refreshStripeStatus
      );

      window.removeEventListener(
        "pageshow",
        refreshStripeStatus
      );
    };
  }, [
    loggedInRole,
    supabaseSession?.access_token,
  ]);

  useEffect(() => {
    if (accountManageOpen && loggedInRole === "buyer") {
      void loadBuyerOrders();
    }
  }, [accountManageOpen, loggedInRole]);

  const sellerUnitPriceNumber =
    Number(
      sellerPrice
        .trim()
        .replace(",", ".")
        .replace("€", "")
    ) || 0;

  const sellerTicketCountNumber =
    Number(sellerTicketCount.trim()) || 0;

  // PaseSpain Gebührenmodell:
  // Verkäufer legt den Ticket-Verkaufspreis fest.
  // Davon werden 10 % Verkäufer-Service abgezogen.
  // Der Käufer bezahlt beim Checkout zusätzlich 10 % Käufer-Service.
  const PASESPAIN_SELLER_FEE_RATE = 0.10;
  const PASESPAIN_BUYER_FEE_RATE = 0.10;

  const sellerOfferTotal =
    sellerUnitPriceNumber *
    sellerTicketCountNumber;

  const sellerServiceFee =
    sellerOfferTotal *
    PASESPAIN_SELLER_FEE_RATE;

  const sellerPayoutTotal =
    sellerOfferTotal -
    sellerServiceFee;

  const cartTicketSubtotal =
    cartItems.reduce(
      (
        total,
        item
      ) => {
        const value =
          item.unitPrice ||
          Number(
            item.price
              .replace(
                /[^0-9.,]/g,
                ""
              )
              .replace(
                ",",
                "."
              )
          ) ||
          0;

        const quantity =
          item.ticketCount &&
          item.ticketCount > 0
            ? item.ticketCount
            : 1;

        return total + value * quantity;
      },
      0
    );

  const cartBuyerServiceFee =
    cartTicketSubtotal *
    PASESPAIN_BUYER_FEE_RATE;

  const cartTotal =
    cartTicketSubtotal +
    cartBuyerServiceFee;

  return (
    <main className="site">
      <div className="stadium-bg" />

      {/* Nur KI- und Maps-Kacheln schmaler: Platz für eine dritte Kachel */}
      <style>{`
        @media (min-width: 901px) {
          .smart-grid {
            grid-template-columns: minmax(0, 1.26fr) minmax(0, .94fr) minmax(0, .90fr) minmax(0, .90fr) !important;
          }
        }

        @media (min-width: 761px) {
          .stadium-bg {
            filter: saturate(1.75) contrast(1.14) brightness(1.05);
          }
        }


        .spain-schedule-card {
          display: flex;
          flex-direction: column;
          gap: 10px;
          position: relative;
          overflow: hidden;
        }

        @media (min-width: 761px) {
          .pases-scoreboard {
            min-height: 280px;
            height: 280px;
            padding: 20px 18px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 12px;
            overflow: hidden;
            background: rgba(255,255,255,.10) !important;
            backdrop-filter: blur(14px) saturate(1.12);
            -webkit-backdrop-filter: blur(14px) saturate(1.12);
            color: rgba(255,255,255,.96);
          }

          .pases-scoreboard-top {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            font-size: 20px;
            font-weight: 950;
            letter-spacing: .08em;
            color: #fff;
            text-shadow: 0 2px 8px rgba(0,0,0,.72);
          }

          .pases-live-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #ff3b30;
            box-shadow: 0 0 10px rgba(255,59,48,.72);
          }

          .pases-brand-gradient {
            background: linear-gradient(90deg, #4f8cff 0%, #49d6a5 100%);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            -webkit-text-fill-color: transparent;
          }

          .pases-live-word {
            color: #ff4b45;
            -webkit-text-fill-color: #ff4b45;
          }

          .spain-ad-card {
            position: relative;
            overflow: hidden;
          }

          .spain-ad-card::before {
            content: "";
            position: absolute;
            inset: 10px;
            background: url("/pasespain-logo-transparent.png") center / 88% auto no-repeat;
            opacity: .38;
            pointer-events: none;
            z-index: 0;
          }

          .spain-ad-card > * {
            position: relative;
            z-index: 1;
          }

          .pases-scoreboard-kicker {
            text-align: center;
            font-size: 12px;
            font-weight: 850;
            letter-spacing: .14em;
            color: #fff;
            text-shadow: 0 2px 7px rgba(0,0,0,.72);
          }

          .pases-scoreboard-match {
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            align-items: center;
            gap: 10px;
            text-align: center;
            font-size: 20px;
            line-height: 1.15;
            font-weight: 950;
            color: #fff;
            text-shadow: 0 2px 8px rgba(0,0,0,.78);
          }

          .pases-scoreboard-match b {
            font-size: 12px;
            color: #fff;
          }

          .pases-scoreboard-price,
          .pases-scoreboard-message {
            text-align: center;
            font-size: 18px;
            font-weight: 950;
            letter-spacing: .06em;
            color: #fff;
            text-shadow: 0 2px 8px rgba(0,0,0,.78);
          }

          .pases-flap-changing {
            width: 100%;
            padding: 10px 8px 9px;
            border: 1px solid rgba(255,255,255,.11);
            border-radius: 5px;
            background: linear-gradient(180deg,#111315 0%,#050607 100%);
            box-shadow:
              inset 0 1px 0 rgba(255,255,255,.07),
              inset 0 -10px 22px rgba(0,0,0,.42),
              0 7px 16px rgba(0,0,0,.34);
          }

          .pases-flap-changing .pases-scoreboard-kicker {
            margin: 0 0 7px;
            padding-bottom: 6px;
            border-bottom: 1px solid rgba(255,255,255,.11);
            font-size: 9px;
            letter-spacing: .15em;
          }

          .pases-char-line {
            display: flex;
            justify-content: center;
            gap: 2px;
            min-width: 0;
            margin: 3px 0;
            overflow: hidden;
          }

          .pases-char-flap {
            position: relative;
            flex: 0 1 16px;
            min-width: 10px;
            max-width: 16px;
            height: 28px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            border: 1px solid #020203;
            border-radius: 2px;
            background:
              linear-gradient(180deg,
                #292c30 0%,
                #17191c 47%,
                #050607 48%,
                #050607 52%,
                #15171a 53%,
                #090a0b 100%);
            box-shadow:
              inset 0 1px 0 rgba(255,255,255,.12),
              inset 0 -1px 0 rgba(0,0,0,.95),
              0 1px 2px rgba(0,0,0,.75);
            color: #ffffff !important;
            -webkit-text-fill-color: #ffffff !important;
            font-family: "Courier New", monospace;
            font-size: 13px;
            line-height: 1;
            font-weight: 900;
            text-align: center;
            text-shadow:
              0 1px 0 #000,
              0 0 4px rgba(255,255,255,.38);
          }

          .pases-char-flap::after {
            content: "";
            position: absolute;
            left: 0;
            right: 0;
            top: 50%;
            height: 1px;
            background: #000;
            box-shadow: 0 1px 0 rgba(255,255,255,.07);
          }

          .pases-char-space {
            opacity: .38;
          }

          .pases-board-vs {
            margin: 2px 0;
            text-align: center;
            color: rgba(255,255,255,.72);
            font-family: "Courier New", monospace;
            font-size: 9px;
            font-weight: 900;
            letter-spacing: .18em;
          }

          .pases-price-line {
            margin-top: 6px;
            padding-top: 6px;
            border-top: 1px solid rgba(255,255,255,.10);
          }

          .pases-price-line .pases-char-flap {
            flex-basis: 18px;
            max-width: 18px;
            height: 30px;
            font-size: 14px;
          }

          @keyframes pasesBoardChange {
            0% { transform: perspective(520px) rotateX(0deg); opacity: 1; }
            44% { transform: perspective(520px) rotateX(-12deg); opacity: .72; }
            55% { transform: perspective(520px) rotateX(10deg); opacity: .78; }
            100% { transform: perspective(520px) rotateX(0deg); opacity: 1; }
          }

          @media (prefers-reduced-motion: reduce) {
            .pases-flap-changing { animation: none; }
          }

          .spain-ad-card-large {
            min-height: 235px !important;
          }
        }

        @media (min-width: 761px) {
          .spain-side-column {
            display: flex;
            flex-direction: column;
            gap: 14px;
            align-self: start;
          }

          .spain-side-column .spain-schedule-card {
            min-height: 0;
            height: auto;
            padding-bottom: 14px;
          }

          .spain-ad-card {
            min-height: 150px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            gap: 7px;
            padding: 18px;
          }

          .spain-ad-label {
            font-size: 9px;
            font-weight: 800;
            letter-spacing: .12em;
            text-transform: uppercase;
            opacity: .62;
          }

          .spain-ad-title {
            font-size: 15px;
            line-height: 1.25;
            font-weight: 850;
          }

          .spain-ad-text {
            font-size: 11px;
            line-height: 1.35;
            font-weight: 650;
            opacity: .76;
          }

          .spain-sell-ad::before {
            opacity: .16;
            background-size: 82% auto;
          }

          .spain-sell-ad {
            gap: 9px;
            padding: 20px 18px;
          }

          .spain-sell-ad .spain-ad-label {
            color: rgba(255,255,255,.88);
            opacity: 1;
            font-size: 10px;
            font-weight: 900;
            letter-spacing: .16em;
            text-shadow: 0 2px 8px rgba(0,0,0,.55);
          }

          .spain-sell-ad-title {
            color: #fff;
            font-size: 19px;
            line-height: 1.15;
            font-weight: 950;
            text-shadow: 0 2px 10px rgba(0,0,0,.68);
          }

          .spain-sell-ad-copy {
            max-width: 250px;
            color: rgba(255,255,255,.96);
            opacity: 1;
            font-size: 12px;
            line-height: 1.45;
            font-weight: 700;
            text-shadow: 0 2px 8px rgba(0,0,0,.72);
          }

          .spain-sell-ad-trust {
            color: #fff;
            font-size: 11px;
            line-height: 1.2;
            font-weight: 900;
            text-shadow: 0 2px 8px rgba(0,0,0,.72);
          }

          .spain-sell-ad-button {
            margin-top: 2px;
            border: 1px solid rgba(255,255,255,.55);
            border-radius: 999px;
            padding: 9px 15px;
            background: rgba(255,255,255,.18);
            box-shadow: inset 0 1px 0 rgba(255,255,255,.25), 0 6px 18px rgba(0,0,0,.18);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            color: #fff;
            font: inherit;
            font-size: 10px;
            font-weight: 950;
            letter-spacing: .08em;
            cursor: pointer;
            text-shadow: 0 1px 5px rgba(0,0,0,.55);
          }

          .spain-sell-ad-button:hover {
            background: rgba(255,255,255,.28);
            transform: translateY(-1px);
          }
        }

        @media (max-width: 760px) {
          .spain-side-column {
            display: none !important;
          }
        }

        .spain-schedule-card::before {
          content: "";
          position: absolute;
          inset: 8% 4% 6% 22%;
          background:
            url("/pasespain-logo-transparent.png")
            center / contain
            no-repeat;
          opacity: .34;
          pointer-events: none;
          z-index: 0;
        }

        .spain-schedule-card > * {
          position: relative;
          z-index: 1;
        }

        .weather-visual {
          position: absolute;
          right: 12px;
          top: 28px;
          width: 118px;
          height: 88px;
          pointer-events: none;
          z-index: 1;
          opacity: .68;
          filter:
            drop-shadow(0 8px 20px rgba(7,24,52,.10))
            saturate(.96);
        }

        .weather-heading {
          position: relative;
          z-index: 3 !important;
        }

        .weather-visual-sun {
          position: absolute;
          width: 44px;
          height: 44px;
          right: 4px;
          left: auto;
          top: 3px;
          border-radius: 50%;
          background:
            radial-gradient(circle at 34% 30%, rgba(255,255,255,.96) 0 7%, rgba(255,248,188,.92) 18%, transparent 30%),
            radial-gradient(circle at 50% 52%, #fff4a6 0 20%, #ffd55b 47%, #f7a928 73%, #e88416 100%);
          box-shadow:
            0 0 8px rgba(255,229,120,.48),
            0 0 22px rgba(255,183,45,.34),
            0 0 42px rgba(255,157,24,.16);
          opacity: 0;
          filter: saturate(.96);
          transform: scale(.94);
        }

        .weather-visual-sun::before,
        .weather-visual-sun::after {
          content: "";
          position: absolute;
          inset: -12px;
          border-radius: 50%;
          background:
            repeating-conic-gradient(
              from 0deg,
              rgba(255,190,58,.34) 0deg 2deg,
              transparent 2deg 16deg
            );
          -webkit-mask: radial-gradient(circle, transparent 0 53%, #000 55% 100%);
          mask: radial-gradient(circle, transparent 0 53%, #000 55% 100%);
          opacity: .55;
        }

        .weather-visual-sun::after {
          inset: -18px;
          opacity: .22;
          transform: rotate(8deg);
        }

        .weather-visual-cloud {
          position: absolute;
          left: 21px;
          top: 31px;
          width: 62px;
          height: 29px;
          border-radius: 30px;
          background:
            linear-gradient(180deg, rgba(255,255,255,.58) 0%, rgba(234,244,252,.42) 48%, rgba(182,204,224,.30) 100%);
          border: 1px solid rgba(255,255,255,.34);
          box-shadow:
            inset 0 2px 5px rgba(255,255,255,.48),
            inset 0 -4px 10px rgba(87,111,140,.07),
            0 7px 18px rgba(20,42,72,.08);
          backdrop-filter: blur(5px);
          -webkit-backdrop-filter: blur(5px);
          opacity: 0;
        }

        .weather-visual-cloud::before,
        .weather-visual-cloud::after {
          content: "";
          position: absolute;
          border-radius: 50%;
          background: inherit;
          box-shadow: inherit;
        }

        .weather-visual-cloud::before {
          width: 34px;
          height: 34px;
          left: 8px;
          top: -16px;
        }

        .weather-visual-cloud::after {
          width: 43px;
          height: 43px;
          right: 5px;
          top: -22px;
        }

        .weather-cloud-two {
          left: 42px;
          top: 37px;
          width: 44px;
          height: 23px;
          opacity: 0;
          filter: brightness(.94);
        }

        .weather-rain-lines {
          position: absolute;
          left: 32px;
          top: 59px;
          width: 52px;
          display: flex;
          justify-content: space-between;
          opacity: 0;
        }

        .weather-rain-lines i {
          width: 2px;
          height: 11px;
          border-radius: 2px;
          background: linear-gradient(180deg, rgba(76,157,220,.35), rgba(24,112,184,.92));
          transform: rotate(15deg);
          box-shadow: 0 2px 4px rgba(37,109,166,.15);
        }

        .weather-sun .weather-visual-sun {
          opacity: 1;
          transform: scale(1);
        }

        .weather-night .weather-visual-sun {
          opacity: 0;
        }

        .weather-sun .weather-cloud-one {
          opacity: .54;
          transform: translate(17px, 7px) scale(.72);
        }

        .weather-cloud .weather-cloud-one {
          opacity: 1;
        }

        .weather-cloud .weather-cloud-two {
          opacity: .82;
        }

        .weather-rain .weather-cloud-one {
          opacity: 1;
          filter: brightness(.90) saturate(.86);
        }

        .weather-rain .weather-cloud-two {
          opacity: .92;
          filter: brightness(.84) saturate(.82);
        }

        .weather-rain .weather-rain-lines {
          opacity: 1;
        }

        .spain-schedule-online {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: -2px;
          font-size: 10px;
          font-weight: 760;
          color: rgba(3,15,40,.72);
        }

        .spain-schedule-online::before {
          content: "";
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #1aa260;
          box-shadow: 0 0 0 3px rgba(26,162,96,.12);
        }

        .spain-schedule-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .spain-schedule-head strong {
          color: rgba(3,15,40,1);
          font-size: 13px;
          font-weight: 850;
          letter-spacing: .04em;
          text-shadow: 0 1px 0 rgba(255,255,255,.42);
        }

        .spain-schedule-head span {
          color: rgba(3,15,40,.82);
          font-size: 10px;
          font-weight: 760;
          text-shadow: 0 1px 0 rgba(255,255,255,.34);
        }

        .spain-schedule-league-link {
          color: rgba(3,15,40,.82);
          font-size: 10px;
          font-weight: 760;
          text-shadow: 0 1px 0 rgba(255,255,255,.34);
          text-decoration: none;
        }

        .spain-schedule-league-link:hover {
          text-decoration: underline;
        }

        .spain-schedule-list {
          display: grid;
          gap: 7px;
        }

        .spain-schedule-match {
          display: grid;
          gap: 2px;
          padding: 8px 9px;
          border: 1px solid rgba(255,255,255,.26);
          border-radius: 12px;
          background: rgba(255,255,255,.08);
        }

        .spain-schedule-teams {
          color: rgba(3,15,40,1);
          font-size: 11px;
          line-height: 1.25;
          font-weight: 820;
          text-shadow: 0 1px 0 rgba(255,255,255,.34);
        }

        .spain-schedule-meta {
          color: rgba(3,15,40,.80);
          font-size: 9px;
          line-height: 1.25;
          font-weight: 700;
          text-shadow: 0 1px 0 rgba(255,255,255,.28);
        }

        .spain-schedule-status {
          color: rgba(3,15,40,.72);
          font-size: 11px;
          line-height: 1.35;
          font-weight: 650;
        }

        .spain-schedule-link {
          margin-top: auto;
          color: rgba(3,15,40,1);
          font-size: 11px;
          font-weight: 820;
          text-decoration: none;
          text-shadow: 0 1px 0 rgba(255,255,255,.30);
        }

        .legal-footer {
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 12px;
          padding: 28px 16px 12px;
          text-align: center;
          color: rgba(3,15,40,.92);
          font-size: 12px;
          font-weight: 780;
          text-shadow: 0 1px 0 rgba(255,255,255,.38);
        }

        .legal-footer a {
          color: inherit;
          text-decoration: none;
        }

        .legal-footer a:hover {
          color: rgba(3,15,40,1);
        }

        /* Lesbarkeit in allen Kacheln erhöhen – nur Typografie */
        .category-card h3,
        .smart-head h2,
        .panel-heading h2,
        .teams strong,
        .offer-details,
        .weather-panel strong,
        .spain-schedule-head strong,
        .spain-schedule-teams {
          color: rgba(3,15,40,1) !important;
          font-weight: 820 !important;
          text-shadow: 0 1px 0 rgba(255,255,255,.38);
        }

        .category-card p,
        .smart-head p,
        .match-info,
        .result-count,
        .from,
        .weather-panel p,
        .spain-schedule-head span,
        .spain-schedule-meta {
          color: rgba(3,15,40,.84) !important;
          font-weight: 680 !important;
          text-shadow: 0 1px 0 rgba(255,255,255,.28);
        }

        .ai-search-box textarea,
        .ai-search-box textarea::placeholder {
          color: rgba(3,15,40,.92) !important;
          font-weight: 650 !important;
        }

        .panel-heading button,
        .spain-schedule-link {
          font-weight: 800 !important;
        }

        /* Typografie-Feinschliff für Glas: kräftiger, aber nicht dominant */
        .category-card h3,
        .smart-head h2,
        .panel-heading h2,
        .teams strong,
        .offer-details,
        .weather-panel strong,
        .spain-schedule-head strong,
        .spain-schedule-teams {
          color: rgba(3,15,40,.98) !important;
          font-weight: 780 !important;
          letter-spacing: .005em;
          text-shadow:
            0 1px 0 rgba(255,255,255,.34),
            0 0 8px rgba(255,255,255,.08);
        }

        .category-card p,
        .smart-head p,
        .match-info,
        .result-count,
        .from,
        .weather-panel p,
        .spain-schedule-head span,
        .spain-schedule-meta {
          color: rgba(3,15,40,.86) !important;
          font-weight: 650 !important;
          text-shadow:
            0 1px 0 rgba(255,255,255,.24),
            0 0 6px rgba(255,255,255,.06);
        }

        .ai-search-box textarea,
        .ai-search-box textarea::placeholder {
          color: rgba(3,15,40,.94) !important;
          font-weight: 650 !important;
          text-shadow: 0 1px 0 rgba(255,255,255,.20);
        }

        .panel-heading button,
        .spain-schedule-link {
          font-weight: 780 !important;
        }

        /* Footer unten: AGB · Datenschutz · Impressum deutlicher sichtbar */
        .legal-footer {
          font-size: 14px !important;
          font-weight: 780 !important;
          gap: 14px !important;
          color: rgba(3,15,40,.94) !important;
          text-shadow:
            0 1px 0 rgba(255,255,255,.40),
            0 0 8px rgba(255,255,255,.08);
        }

        /* Lesbarkeit nochmals erhöhen – klar, kräftig, aber weiterhin ruhig */
        .category-card h3,
        .smart-head h2,
        .panel-heading h2,
        .teams strong,
        .offer-details,
        .weather-panel strong,
        .spain-schedule-head strong,
        .spain-schedule-teams {
          color: rgba(2,10,28,1) !important;
          font-weight: 850 !important;
          text-shadow:
            0 1px 0 rgba(255,255,255,.52),
            0 0 10px rgba(255,255,255,.12);
        }

        .category-card p,
        .smart-head p,
        .match-info,
        .result-count,
        .from,
        .weather-panel p,
        .spain-schedule-head span,
        .spain-schedule-meta {
          color: rgba(2,10,28,.94) !important;
          font-weight: 720 !important;
          text-shadow:
            0 1px 0 rgba(255,255,255,.42),
            0 0 8px rgba(255,255,255,.10);
        }

        .ai-search-box textarea,
        .ai-search-box textarea::placeholder {
          color: rgba(2,10,28,.98) !important;
          font-weight: 720 !important;
          text-shadow: 0 1px 0 rgba(255,255,255,.34);
        }

        .panel-heading button,
        .spain-schedule-link {
          color: rgba(2,10,28,.98) !important;
          font-weight: 840 !important;
        }

        .legal-footer {
          font-size: 15px !important;
          font-weight: 850 !important;
          color: rgba(2,10,28,.98) !important;
          text-shadow:
            0 1px 0 rgba(255,255,255,.52),
            0 0 10px rgba(255,255,255,.12);
        }

        /* Hoher Kontrast für alle Texte in Glaskacheln */
        .category-card,
        .smart-card,
        .ticket-card,
        .weather-panel,
        .matches-panel {
          color: #07111f !important;
          text-rendering: optimizeLegibility;
          -webkit-font-smoothing: antialiased;
        }

        .category-card h3,
        .smart-card h2,
        .smart-card h3,
        .ticket-card strong,
        .ticket-card h3,
        .weather-panel strong,
        .weather-panel h2,
        .weather-panel h3,
        .matches-panel h2,
        .matches-panel h3,
        .spain-schedule-head strong,
        .spain-schedule-teams {
          color: #07111f !important;
          font-weight: 900 !important;
          opacity: 1 !important;
          text-shadow:
            0 1px 0 rgba(255,255,255,.78),
            0 0 3px rgba(255,255,255,.62);
        }

        .category-card p,
        .smart-card p,
        .smart-card small,
        .ticket-card p,
        .ticket-card small,
        .ticket-card span,
        .weather-panel p,
        .weather-panel small,
        .weather-panel span,
        .matches-panel p,
        .matches-panel small,
        .match-info,
        .result-count,
        .from,
        .versus,
        .spain-schedule-head span,
        .spain-schedule-meta {
          color: #172033 !important;
          font-weight: 750 !important;
          opacity: 1 !important;
          text-shadow:
            0 1px 0 rgba(255,255,255,.70),
            0 0 2px rgba(255,255,255,.50);
        }

        .ai-search-box textarea,
        .ai-search-box textarea::placeholder {
          color: #101827 !important;
          font-weight: 760 !important;
          opacity: 1 !important;
          text-shadow: 0 1px 0 rgba(255,255,255,.62);
        }

        .panel-heading button,
        .spain-schedule-link,
        .legal-footer,
        .legal-footer a {
          color: #07111f !important;
          font-weight: 900 !important;
          opacity: 1 !important;
          text-shadow:
            0 1px 0 rgba(255,255,255,.78),
            0 0 3px rgba(255,255,255,.55);
        }

        .legal-footer {
          font-size: 16px !important;
        }

        /* PaseSpain oben links: handschriftlicher Zusatz */
        .brand-area {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          line-height: 1;
        }

        .brand-handwriting {
          margin-top: 4px;
          margin-left: 4px;
          font-family: "Segoe Script", "Brush Script MT", "Lucida Handwriting", cursive;
          font-size: 15px;
          font-weight: 600;
          letter-spacing: .01em;
          color: rgba(7,17,31,.78);
          text-shadow: 0 1px 0 rgba(255,255,255,.48);
          transform: rotate(-0.7deg);
        }

        /* Drei Icon-Kacheln: Spanien-Farben rot · gelb · rot */
        .header-action-red {
          background:
            linear-gradient(
              145deg,
              rgba(214,39,40,.13),
              rgba(255,255,255,.12)
            ) !important;
          border-color: rgba(214,39,40,.26) !important;
        }

        .header-action-yellow {
          background:
            linear-gradient(
              145deg,
              rgba(255,196,0,.15),
              rgba(255,255,255,.12)
            ) !important;
          border-color: rgba(226,164,0,.28) !important;
        }

        /* Fünf Kategorie-Kacheln: ganz feine Spanien-Streifen rot · gelb · rot */
        .category-card {
          background:
            linear-gradient(
              to bottom,
              rgba(198, 31, 43, .11) 0%,
              rgba(198, 31, 43, .11) 31%,
              rgba(255, 196, 0, .11) 31%,
              rgba(255, 196, 0, .11) 69%,
              rgba(198, 31, 43, .11) 69%,
              rgba(198, 31, 43, .11) 100%
            ),
            rgba(255,255,255,.045) !important;
        }


        /* Empfohlene Angebote: farbigen Hintergrund entfernen, Glas bleibt */
        .matches-panel,
        .offers-panel {
          background: rgba(255,255,255,.055) !important;
        }

        .offers-empty-state {
          grid-column: 1 / -1;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 150px;
          padding: 24px;
          border: 0 !important;
          border-radius: 0 !important;
          background: transparent !important;
          box-shadow: none !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          color: #101a28;
          font-size: 14px;
          font-weight: 760;
          text-align: center;
          text-shadow: 0 1px 0 rgba(255,255,255,.55);
        }

        .brand-handwriting {
          font-family: "Segoe Script", "Brush Script MT", "Lucida Handwriting", cursive !important;
          font-style: italic;
          font-weight: 600 !important;
          letter-spacing: .01em;
        }

        /* Header: Verkäufer · Käufer · Warenkorb */
        .seller-action,
        .buyer-action {
          position: relative;
        }

        .seller-ticket-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 21px;
          height: 21px;
          border: 1.6px solid currentColor;
          border-radius: 5px;
          font-size: 13px;
          line-height: 1;
          font-weight: 850;
          transform: rotate(-4deg);
        }

        .seller-action::after,
        .buyer-action::after {
          position: absolute;
          top: calc(100% + 6px);
          left: 50%;
          transform: translateX(-50%);
          padding: 4px 7px;
          border-radius: 8px;
          background: rgba(255,255,255,.78);
          border: 1px solid rgba(255,255,255,.60);
          box-shadow: 0 5px 16px rgba(6,22,45,.10);
          color: rgba(7,17,31,.94);
          font-size: 9px;
          font-weight: 760;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: opacity .16s ease;
          z-index: 30;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }

        .seller-action::after {
          content: "Verkäufer";
        }

        .buyer-action::after {
          content: "Käufer";
        }

        .seller-action:hover::after,
        .buyer-action:hover::after {
          opacity: 1;
        }

        /* Deutlich bessere Lesbarkeit auf dem unruhigen Stadion-Hintergrund */
        .category-card h3,
        .smart-card h2,
        .smart-card h3,
        .panel-heading h2,
        .ticket-card strong,
        .ticket-card h3,
        .teams strong,
        .weather-panel h2,
        .weather-panel h3,
        .weather-panel strong,
        .spain-schedule-head strong,
        .spain-schedule-teams {
          color: #020914 !important;
          font-weight: 950 !important;
          opacity: 1 !important;
          text-shadow:
            0 1px 0 rgba(255,255,255,.95),
            0 0 2px rgba(255,255,255,.95),
            0 0 6px rgba(255,255,255,.70),
            0 1px 2px rgba(0,0,0,.16) !important;
          -webkit-text-stroke: .18px rgba(255,255,255,.42);
        }

        .category-card p,
        .smart-card p,
        .smart-card small,
        .ticket-card p,
        .ticket-card small,
        .ticket-card span,
        .match-info,
        .from,
        .versus,
        .weather-panel p,
        .weather-panel small,
        .weather-panel span,
        .weather-condition,
        .weather-label,
        .spain-schedule-head span,
        .spain-schedule-meta {
          color: #091425 !important;
          font-weight: 820 !important;
          opacity: 1 !important;
          text-shadow:
            0 1px 0 rgba(255,255,255,.92),
            0 0 2px rgba(255,255,255,.90),
            0 0 5px rgba(255,255,255,.60) !important;
        }

        .ai-search-box textarea,
        .ai-search-box textarea::placeholder {
          color: #06101f !important;
          font-weight: 820 !important;
          opacity: 1 !important;
          text-shadow:
            0 1px 0 rgba(255,255,255,.90),
            0 0 3px rgba(255,255,255,.72) !important;
        }

        .panel-heading button,
        .spain-schedule-link,
        .legal-footer,
        .legal-footer a {
          color: #020914 !important;
          font-weight: 950 !important;
          opacity: 1 !important;
          text-shadow:
            0 1px 0 rgba(255,255,255,.96),
            0 0 3px rgba(255,255,255,.90),
            0 0 6px rgba(255,255,255,.65) !important;
        }

        .legal-footer {
          font-size: 17px !important;
        }

        /* Schrift insgesamt etwas größer – ohne Layout zu verändern */
        .category-card h3,
        .smart-card h2,
        .smart-card h3,
        .panel-heading h2,
        .ticket-card strong,
        .ticket-card h3,
        .teams strong,
        .weather-panel h2,
        .weather-panel h3,
        .spain-schedule-head strong,
        .spain-schedule-teams {
          font-size: calc(1em + 1px) !important;
        }

        .category-card p,
        .smart-card p,
        .smart-card small,
        .ticket-card p,
        .ticket-card small,
        .ticket-card span,
        .match-info,
        .from,
        .versus,
        .weather-panel p,
        .weather-panel small,
        .weather-panel span,
        .weather-condition,
        .weather-label,
        .spain-schedule-head span,
        .spain-schedule-meta,
        .ai-search-box textarea,
        .ai-search-box textarea::placeholder {
          font-size: calc(1em + .8px) !important;
        }

        .panel-heading button,
        .spain-schedule-link {
          font-size: calc(1em + 1px) !important;
        }

        .legal-footer {
          font-size: 18px !important;
        }

        /* Typografie wieder ruhiger: gut lesbar, aber weniger dominant */
        .category-card h3,
        .smart-card h2,
        .smart-card h3,
        .panel-heading h2,
        .ticket-card strong,
        .ticket-card h3,
        .teams strong,
        .weather-panel h2,
        .weather-panel h3,
        .weather-panel strong,
        .spain-schedule-head strong,
        .spain-schedule-teams {
          color: #0b1422 !important;
          font-weight: 800 !important;
          text-shadow:
            0 1px 0 rgba(255,255,255,.66),
            0 0 3px rgba(255,255,255,.38) !important;
          -webkit-text-stroke: 0 !important;
        }

        .category-card p,
        .smart-card p,
        .smart-card small,
        .ticket-card p,
        .ticket-card small,
        .ticket-card span,
        .match-info,
        .from,
        .versus,
        .weather-panel p,
        .weather-panel small,
        .weather-panel span,
        .weather-condition,
        .weather-label,
        .spain-schedule-head span,
        .spain-schedule-meta {
          color: #1a2433 !important;
          font-weight: 650 !important;
          text-shadow: 0 1px 0 rgba(255,255,255,.48) !important;
        }

        .ai-search-box textarea,
        .ai-search-box textarea::placeholder {
          color: #111b2a !important;
          font-weight: 650 !important;
          text-shadow: 0 1px 0 rgba(255,255,255,.42) !important;
        }

        .panel-heading button,
        .spain-schedule-link,
        .legal-footer,
        .legal-footer a {
          color: #0b1422 !important;
          font-weight: 760 !important;
          text-shadow: 0 1px 0 rgba(255,255,255,.52) !important;
        }

        .legal-footer {
          font-size: 16px !important;
        }

        /* Feinere Typografie: gut lesbar, aber deutlich weniger dominant */
        .category-card h3,
        .smart-card h2,
        .smart-card h3,
        .panel-heading h2,
        .ticket-card strong,
        .ticket-card h3,
        .teams strong,
        .weather-panel h2,
        .weather-panel h3,
        .weather-panel strong,
        .spain-schedule-head strong,
        .spain-schedule-teams {
          color: #101a28 !important;
          font-weight: 730 !important;
          text-shadow:
            0 1px 0 rgba(255,255,255,.42),
            0 0 2px rgba(255,255,255,.22) !important;
          -webkit-text-stroke: 0 !important;
        }

        .category-card p,
        .smart-card p,
        .smart-card small,
        .ticket-card p,
        .ticket-card small,
        .ticket-card span,
        .match-info,
        .from,
        .versus,
        .weather-panel p,
        .weather-panel small,
        .weather-panel span,
        .weather-condition,
        .weather-label,
        .spain-schedule-head span,
        .spain-schedule-meta {
          color: #253041 !important;
          font-weight: 610 !important;
          text-shadow: 0 1px 0 rgba(255,255,255,.28) !important;
        }

        .ai-search-box textarea,
        .ai-search-box textarea::placeholder {
          color: #1b2636 !important;
          font-weight: 620 !important;
          text-shadow: 0 1px 0 rgba(255,255,255,.24) !important;
        }

        .panel-heading button,
        .spain-schedule-link,
        .legal-footer,
        .legal-footer a {
          color: #111b2a !important;
          font-weight: 700 !important;
          text-shadow: 0 1px 0 rgba(255,255,255,.30) !important;
        }

        .legal-footer {
          font-size: 16px !important;
        }

        /* Fußball-Animation deaktiviert – sonst nichts geändert */
        .pasespain-football-fx {
          display: none !important;
        }


        /* Konto / Verkäufer / Warenkorb – zusätzliche Funktionsfenster */
        .market-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 5000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(4,14,34,.36);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }

        .market-modal {
          width: min(560px, 100%);
          max-height: min(88vh, 760px);
          overflow: auto;
          padding: 24px;
          border: 1px solid rgba(255,255,255,.92);
          border-radius: 26px;
          background:
            linear-gradient(135deg, rgba(255,255,255,.74), rgba(238,247,255,.58));
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.98),
            0 24px 70px rgba(6,24,55,.28);
          color: #071633;
        }

        .market-modal-wide {
          width: min(760px, 100%);
        }

        .market-modal-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 18px;
        }

        .market-modal-head h2 {
          margin: 0;
          font-size: 22px;
          font-weight: 780;
        }

        .market-modal-close {
          width: 38px;
          height: 38px;
          border: 1px solid rgba(255,255,255,.8);
          border-radius: 12px;
          background: rgba(255,255,255,.38);
          color: #071633;
          font-size: 22px;
          line-height: 1;
        }

        .market-form {
          display: grid;
          gap: 13px;
        }

        .market-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 13px;
        }

        .market-field {
          display: grid;
          gap: 6px;
        }

        .market-field label {
          font-size: 12px;
          font-weight: 700;
        }

        .market-field input,
        .market-field textarea,
        .market-field select {
          width: 100%;
          min-height: 45px;
          padding: 11px 13px;
          border: 1px solid rgba(255,255,255,.92);
          border-radius: 14px;
          outline: none;
          background: rgba(255,255,255,.42);
          color: #071633;
        }

        .market-field textarea {
          min-height: 105px;
          resize: vertical;
        }

        .market-primary-button {
          min-height: 46px;
          padding: 0 18px;
          border: 1px solid rgba(255,255,255,.68);
          border-radius: 14px;
          color: white;
          font-weight: 760;
          background: linear-gradient(100deg,#1557ef 0%,#248eea 48%,#24bda4 100%);
        }

        .market-error {
          margin: 0;
          color: #a31526;
          font-size: 12px;
          font-weight: 700;
        }

        .market-note {
          margin: 0 0 15px;
          color: rgba(7,22,51,.72);
          font-size: 12px;
          line-height: 1.45;
        }

        .cart-line {
          display: grid;
          grid-template-columns: 1fr auto auto;
          align-items: center;
          gap: 12px;
          padding: 13px 0;
          border-bottom: 1px solid rgba(7,22,51,.10);
        }

        .cart-line strong,
        .cart-line span {
          display: block;
        }

        .cart-line span {
          margin-top: 3px;
          font-size: 11px;
          color: rgba(7,22,51,.68);
        }

        .cart-remove {
          border: 0;
          background: transparent;
          color: #a31526;
          font-size: 18px;
        }

        .cart-total {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 18px 0 4px;
          font-size: 18px;
          font-weight: 800;
        }

        .account-active {
          box-shadow:
            0 0 0 2px rgba(255,255,255,.88),
            0 0 0 4px rgba(23,104,255,.20) !important;
        }

        .cart-add-button {
          position: relative;
          z-index: 10;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          pointer-events: auto !important;
          cursor: pointer;
          touch-action: manipulation;
        }

        .cart-add-button svg {
          width: 18px;
          height: 18px;
        }

        


        /* Untere Angebotskacheln: Warenkorbbuttons leicht rötlich und exakt ausgerichtet */
        .match-card {
          display: flex;
          flex-direction: column;
        }

        .ticket-watermark-card {
          position: relative;
          overflow: hidden;
          isolation: isolate;
        }

        .team-watermark {
          position: absolute;
          z-index: 0;
          bottom: 12px;
          width: 92px;
          height: 92px;
          object-fit: contain;
          opacity: .34;
          filter: saturate(.9);
          pointer-events: none;
          user-select: none;
        }

        .team-watermark-left {
          left: 18px;
        }

        .team-watermark-right {
          right: 18px;
        }

        .ticket-watermark-card .ticket-card-content {
          position: relative;
          z-index: 2;
        }

        .ticket-card-content {
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .match-bottom {
          margin-top: auto !important;
          padding-top: 20px;
        }

        .cart-add-button {
          width: 47px;
          min-width: 47px;
          height: 47px;
          min-height: 47px;
          padding: 0 !important;
          border-radius: 50% !important;
          background:
            linear-gradient(
              145deg,
              rgba(198,31,43,.14),
              rgba(255,255,255,.11)
            ) !important;
          border-color: rgba(198,31,43,.26) !important;
        }

        .cart-add-button svg {
          width: 18px;
          height: 18px;
        }

        /* KI: gleiches rundes Button-Prinzip, ohne Schrift "Suchen" */
        .ai-search-round {
          width: 42px;
          min-width: 42px;
          height: 42px;
          min-height: 42px;
          padding: 0 !important;
          border-radius: 50% !important;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .ai-search-round svg {
          width: 18px;
          height: 18px;
        }


        .design-credit {
          position: absolute;
          right: 24px;
          bottom: 24px;
          z-index: 3;
          color: rgba(7,22,51,.86);
          font-family:
            "Segoe Script",
            "Bradley Hand",
            "Brush Script MT",
            cursive;
          font-size: 17px;
          font-weight: 600;
          letter-spacing: .02em;
          transform: rotate(0deg);
          text-shadow: 0 1px 0 rgba(255,255,255,.42);
          pointer-events: none;
          white-space: nowrap;
        }

        


        .header-action-whatsapp {
          background:
            linear-gradient(
              100deg,
              rgba(21,87,239,.76) 0%,
              rgba(36,142,234,.76) 48%,
              rgba(36,189,164,.76) 100%
            ) !important;
          border-color:
            rgba(255,255,255,.68) !important;
          color: #ffffff !important;
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.30),
            0 6px 16px rgba(21,87,239,.18) !important;
        }

        .header-action-whatsapp svg {
          width: 38px;
          height: 38px;
          display: block;
        }


        .social-card {
          display: flex;
          flex-direction: column;
        }

        .social-apps {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding-top: 0;
          transform: translateY(-6px);
        }

        .social-app-button {
          position: relative;
          z-index: 50;
          pointer-events: auto !important;
          cursor: pointer;
          text-decoration: none;
          width: 50px;
          height: 50px;
          border: 1px solid rgba(255,255,255,.82);
          border-radius: 18px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.35),
            0 8px 18px rgba(7,24,52,.12);
        }

        .social-facebook {
          background: rgba(24,119,242,.52);
          color: #fff;
          font-family: Arial, sans-serif;
          font-size: 36px;
          font-weight: 800;
          line-height: 1;
        }

        .social-facebook span {
          transform: translateY(2px);
        }

        .social-instagram {
          color: #fff;
          background:
            radial-gradient(
              circle at 30% 107%,
              rgba(253,244,151,.52) 0%,
              rgba(253,244,151,.52) 5%,
              rgba(253,89,73,.52) 45%,
              rgba(214,36,159,.52) 60%,
              rgba(40,90,235,.52) 90%
            );
        }

        .social-instagram svg {
          width: 30px;
          height: 30px;
        }

        .social-tiktok {
          background: rgba(17,17,17,.52);
          color: #ffffff;
        }

        .social-tiktok svg {
          width: 30px;
          height: 30px;
          display: block;
        }

        .social-threads {
          background: rgba(17,17,17,.52);
          color: #ffffff;
        }

        .social-threads svg {
          width: 30px;
          height: 30px;
          display: block;
        }

        .social-whatsapp {
          background: rgba(37,211,102,.52);
          color: #fff;
        }

        .social-whatsapp svg {
          width: 32px;
          height: 32px;
          display: block;
        }

        .social-ai {
          appearance: none;
          -webkit-appearance: none;
          background: linear-gradient(145deg, rgba(61,126,255,.72), rgba(48,202,201,.60));
          color: #fff;
          font: inherit;
        }

        .social-ai svg {
          width: 29px;
          height: 29px;
          display: block;
        }

        


        /* Social-App-Buttons: dezenter 3D-Effekt nur außen */
        .social-app-button {
          outline: 1px solid rgba(255,255,255,.28);
          outline-offset: 1px;
          box-shadow:
            inset 1px 1px 0 rgba(255,255,255,.28),
            inset -1px -1px 0 rgba(7,24,52,.10),
            0 5px 10px rgba(7,24,52,.12),
            0 10px 18px rgba(7,24,52,.07);
        }


        /* Amelia prominent in social-media card */
        .social-apps-amelia-layout {
          display: grid !important;
          grid-template-columns: 104px minmax(132px, 1fr) !important;
          align-items: stretch !important;
          justify-content: center !important;
          gap: 10px !important;
          transform: translateY(-4px) !important;
          padding: 0 4px !important;
        }

        .social-links-grid {
          display: grid;
          grid-template-columns: repeat(2, 44px);
          grid-auto-rows: 44px;
          gap: 7px;
          align-content: center;
          justify-content: center;
        }

        .social-links-grid .social-app-button {
          width: 44px !important;
          height: 44px !important;
          border-radius: 15px !important;
        }

        .social-links-grid .social-facebook {
          font-size: 31px !important;
        }

        .social-links-grid .social-app-button svg {
          width: 26px !important;
          height: 26px !important;
        }

        .social-amelia-card {
          position: relative;
          isolation: isolate;
          min-width: 0;
          min-height: 96px;
          border: 1px solid rgba(255,255,255,.88);
          border-radius: 20px;
          overflow: hidden;
          padding: 0;
          cursor: pointer;
          appearance: none;
          -webkit-appearance: none;
          background: rgba(255,255,255,.18);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.42),
            0 8px 20px rgba(7,24,52,.16);
          transition: transform .16s ease, box-shadow .16s ease;
        }

        .social-amelia-card:hover {
          transform: translateY(-2px) scale(1.015);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.5),
            0 11px 24px rgba(7,24,52,.22);
        }

        .social-amelia-image {
          object-fit: cover;
          object-position: 62% 28%;
          z-index: -3;
        }

        .social-amelia-shade {
          position: absolute;
          inset: 0;
          z-index: -2;
          background:
            linear-gradient(180deg, rgba(4,18,45,.03) 30%, rgba(4,18,45,.82) 100%),
            linear-gradient(90deg, rgba(17,70,164,.10), transparent 58%);
        }

        .social-amelia-mic {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 35px;
          height: 35px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          color: #fff;
          background: linear-gradient(145deg, #2f75ff, #18b9d1);
          border: 1px solid rgba(255,255,255,.9);
          box-shadow: 0 5px 14px rgba(34,99,224,.28);
        }

        .social-amelia-mic svg {
          width: 19px;
          height: 19px;
        }

        .social-amelia-copy {
          position: absolute;
          left: 10px;
          right: 8px;
          bottom: 8px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          color: #fff;
          text-align: left;
          text-shadow: 0 1px 5px rgba(0,0,0,.55);
        }

        .social-amelia-copy strong {
          font-size: 19px;
          line-height: 1;
          font-weight: 850;
          letter-spacing: -.02em;
        }

        .social-amelia-copy small {
          margin-top: 3px;
          font-size: 11px;
          line-height: 1.1;
          font-weight: 720;
        }

        @media (max-width: 767px) and (hover: none) and (pointer: coarse) {
          .social-apps-amelia-layout {
            grid-template-columns: 1fr !important;
            gap: 9px !important;
          }

          .social-links-grid {
            grid-template-columns: repeat(5, 39px);
            grid-auto-rows: 39px;
            gap: 6px;
          }

          .social-links-grid .social-app-button {
            width: 39px !important;
            height: 39px !important;
            border-radius: 13px !important;
          }

          .social-amelia-card {
            min-height: 104px;
          }
        }

        .social-site-link {
          margin-top: 14px;
          text-align: center;
          align-self: center;
          width: 100%;
          transform: translateX(-4px);
          font-size: 20px;
          font-weight: 760;
          letter-spacing: -.02em;
          color: #071633;
          text-shadow: 0 1px 0 rgba(255,255,255,.34);
        }

        .social-site-pase {
          background:
            linear-gradient(
              90deg,
              #2467fb,
              #2c9ed1
            );
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .social-site-spain {
          background:
            linear-gradient(
              90deg,
              #2c9ed1,
              #25bd87
            );
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }


        .social-languages {
          margin-top: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          flex-wrap: wrap;
        }

        .social-languages-label {
          color: rgba(7,22,51,.72);
          font-size: 12px;
          font-weight: 680;
        }

        .social-language-flags {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
        }

        .social-language-flag {
          width: 30px;
          height: 21px;
          display: inline-block;
          border-radius: 6px;
          border: 1px solid rgba(255,255,255,.76);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.42),
            0 3px 8px rgba(7,24,52,.08);
          overflow: hidden;
          opacity: .54;
          filter:
            saturate(.62)
            brightness(1.06);
        }

        .flag-es {
          background:
            linear-gradient(
              to bottom,
              #aa151b 0 25%,
              #f1bf00 25% 75%,
              #aa151b 75% 100%
            );
        }

        .flag-fr {
          background:
            linear-gradient(
              to right,
              #0055a4 0 33.33%,
              #ffffff 33.33% 66.66%,
              #ef4135 66.66% 100%
            );
        }

        .flag-it {
          background:
            linear-gradient(
              to right,
              #009246 0 33.33%,
              #ffffff 33.33% 66.66%,
              #ce2b37 66.66% 100%
            );
        }

        .flag-en {
          background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAALQAAABwCAIAAAA41s3HAAA3G0lEQVR42u19d5RUZfJ2Vb33dk4zoKIg5pwD65oVyTkHARFURMkICIoKgiJBEBQUUXLOkoNxzRkTJhQVRUGH6Zzufau+P7oH3f3W3WkkLb+pMwc4nJme7nvrPvVU1fNW4SWXXVbjkkvFygIRFGIIkEhm3/tw++df/ujxOk1Dac1wOBki2paucelp5599XFYjR36z162nZFYIC36hbFZOqW7WqqtEUmm96YWPw9E4KQUih9VHJkVa60QsfeKJx/69xsmhgFsAQASY0e1hYuuN1+CzL9AGKbsGaBiQSMBlF5k1LoesJQBOp3Pbtm1btmwxznCb44ff4658HNs2EgKW10VEhAh/K0lMm/Xq1FmbS2PxoN8jAiyCh8mVIkzG0506d7i189UskP3m08T776ifomAahd1UpcSO4GUX+ydPIYCSPalvb5r46bYdLpdD+LBwDhFARFKYiKc8htmj17W9utWqdlyQRUAYkYDI+umb5CMP8/adZPjAgSAihAgk0SgfXezs38PTpitqrUUMw5gxY8bbb79t6Jdfj7doTqNGOq+sDQDAXE4IQUQAqFzJN6R//bo3nPPQ2JUvvf6J4TSdTsfhAiECIAIgAEAIhIQAtE+vxAAEQIgIgADCjMIoIocHchiKLMuKRzOXX3zavQNaXHPlabmPT8CgDAadWjA9O+Jh/OIH5Q8AEgqAMiSVZk5j0+v9w4c7zq0BIqAUMeeefAAgcDrh7a3JRm0iIwfbyQgQidYiDFJe/NDMF19Qfcns3qMf6HRMkT8SiSMCEeZuziGOLJDHCAEQkLJ/FPwF//SPwyiUICIRRCJxr8PxwIDWK+ffdc2Vp2lmtjUgAKnMVx9F2jbPdL4TvyuBomJBFEJG1OFSXTVoPDnGv2y149wawnkM/KO7EwiDz6PY1A9MiDVukH73FVQKgYB1Od+cImIWIrjt5mtWLxzUvumVmVQ2nU4rQwEc+giD/xMvuU+mFFlWNhVPN6l96cr5A+/qVdftNrStlQAZSlvJ2BOjE7Ub4LLNhi+ELgcyo2FCKsNWHLu28G7e6O/SS4kCZqQcLP5zXEZEYBECChXjPz5KNmoZG/8giwVKgdbljM1EKAJa84knVJo6scv0SXecWv240j1RASFFUGEHgE4hQjgcP7Zy0ROjb5k7rft5Zx+ntRZtK0OBotR7r0SbNrT73KdK0hAMCmsABAHZUyJnHOecPy04bb7zxDNAa0D5MyJBkrXA1kgKtcaAj1JoD3o42rJx+uO3QSkABObyQQgoRSwiwk0aXLBm4YC7bm9kCMTjSaXw//fKCtvXOAJKUTKZ0hn71htrrlk0qH3ry0SEtVYIqAw78mvswbtTDVrg8+9QqBhMA1lEKYknNGZocHfv5k3eJjciCzDnb/GfuSBeeI5U9klpGEgBCyikYBGs/keyftP4lLEMFhCB1uX1aERE0lpXruwdfm+LhdP7Xn7R6ZFwwrZtVQEh+yOOMHO4NHbx2SfPm9Z7wqgbj68a0pqBmZQSUsmNK6P169rDH1NpAr9PtAYisFnCpXLlue4VCwIPT3QcVQ20BoL/mnmQecllnucWQ4uaOroHtAYi0TYGgypqW32GRls1y3z+AeQSeuZyfwaVI6pXXnbK8rl9Rw5pF/J5Y9E4ESBVQMi+Ek+FsWjcZRhD+7daMb//DdeeycysbYWISlk/fx/t2y3d+ib1/jcUKhaFwICkJBrVPjQeGhRYu959XQPQnMtKysOcCFIp1/mX+ZeuNMcP0y6BWByVAazBUOQvhudeStRpFH/qUUbOJTLl/zCKiJndLqN391qrFw5sUe+yRCyVzWSUqnCQggEja1nxSLL2NReumDvg7r71/T6H1ppESBlCmJg/LVarNk+apcgFXjdoDaQga3GsFBpd7dm0xj94hPKEQGtQBOUO8SRIOpUmMP29h3jWrYBrLuLIHmAWQmCNwaAqzWZ73xtt3zL79SeoFDBLuSGEiEREaz79lKOmP3nbU492O/G4oyPhmKAQEYAAcMW9/w+FghzxjETix1YKjh9x04Jne1x4XjWtWbStlAKlst9ujd7cNntLH9r+KxUV5zNtRImEuYrf8eSYwJKVrvP+ls8tlCpnSY1zdQ6HqRwuU2sW23Zdeo1/7Xo1aog2GGJxUAqYwVTkK5LFG+M31I3PeUqIsBAWgohKEbOISNsWNdYsGtS9c13JcjKRVIoQK4jIf7puqVQ6m8p2bnXtusWDu3a62jCANeeIJ3M29uS4+A11eO4qcgXA5QDWoAxMZXQ6hjc19T2/wXtrHzJceeJZPsBgZkRwuxwiQp9s/Wnnz1GlSIjYtpXTFxg4zL1mqVx1AUdKQechhEIhVZK2ug+I3npj9sdvQCngAlgIESKi1nzM0b4xD7aZ93TPi845KRZJaM2kEEAqvOGfLpdCZh0pjZ9z6vGzJvd4fFynalWDWrNoTYqAKP3hm9Hmje2+Q9XuFAZDIhoAgFEipXz6cc45TwamL3CcdFYeMMpX8mYWZjZNM5OVV177MpW26P2Pv23e6bHn1m4hIjIMrbVo7b68ZmDdBjW8nzY1xBOglGgNTpMcPpmxPH5DncSSmUJYEAvJxU4RYeaa1561esGAe/u3cplGPJbMuU6FT+wlnvFo0qnUoF7NVi8c0KDueSLCmhUKKsNOhqMPD0nWbQxrXyVfCBwGskZlQCKlIY29bvK9sNnbqjMJFAQYWjMREtHrb21r1vHxOYtfczlNcrkd3+zYfUufqd36zNj+XYlSChVpy1Yuf+DeUZ41S6TG2RIpzVcGRWNRkdpRmul8Z7T7TdlfvsMCIQQRiUhr9njNgb3rrZ4/sO41F8SjKcuyKnJdpci2rXgkef3l5y6ffdfQgY2DQZfWGphJEZBKvbwu1qC+vn+8SiMEA6A1EIIWDu+RS053rZgfmDDVrFwVtAbE8gOGiChFu3+ND35gcaubx7/70TaX2wkAxCwul8PpcSx87vUGbUZPm/kP2wZlGtq2xdauy2/wb9yohvZinZRkEpQBtgaXQzkD8sySeM3aiZVzcxACBUMIaM3nnVN1wfQekx7uUqU4GA7H4PemzP/FimckHK8U8D06vNOS2b0vvrA6M4vWigiVsn79KTLgjlSTdvjWZxQsAkXIAqQkGtMuUcP7+zdt8tRsiMwFEc8cYCDi0pXvN2o7dsqMjaDQ4/WIMIhQjoOISDDoLYnFBw6b3fbmxz/Y8oMyDDSUtmzDG/IPG+taOkfOP1nCexAQAEQYQiG1/ddMx+7Rnl2tXT/k2Wu5u5T5iioLItx04xVrFg68qdW1krWTqbRS6v9OlCkjnhk7bbVresXaRYNv6XyNYYDWTCKoFCMmls+N16rFj81Q5EKPRzQDEVg2x8JS93LPuuWBoaMMX3GuTFVu4im5W/Dl17tu6z29+13Tvv1pV7DYj0h7m+plyCOgtZiG6Qt6X3jjk2Ydxz00dnU0mlGmwVqLbXvqNvdv2oT9b9GclGQKlAJbg9ulTJ9MmR+rXSe5ZpHk3pnW5e9j54kqc/XqxZMfvWn2kz3PO616pDTGrJU64v1DSCGLDpfGzjjpuOlP3Pn0pK4nnVisNYtmpQiUym7fGr25baZjN/zqZwoWAYAAA6GEw/oojzlpRGDlGtel1xSYqUoOMDIZPXnaiw3bjl286g2n1+FyOrXN8Ac5Dv3Lj7EWv99rCY9+fEXzDuM3v/gZKUWGYVuWETo6MHaKc8F0Pvt4Kd2TlwUJY1ERff1Lut0t0Xv72uHdoBQWAiEAkOvrMnPtmmevnN+//51NHESxWIoUHakQgoikKB5LmkK9bm3w3Pz+Deuex8zMrEBQKdaZ+Iwp8boNYc5zyukHtxO0BsOAtCWpKLSt59201nfHQKVcwLog4pnDqrfe/bZ150n3jpwfT6f8Qa8w8P8nXKI/Ia4ULAps+Xx7h9sf73P3vB9/ihimKcxi256Grf2bNlLfmzkbk1Q617xFt0sZXn5kSqxundRL6/JluEJYSI4qa+aikHvY4KYr5gy44YpzY3ubMkeWhyhFtm3Hwolr/3b2sln9H76/5VGVfVprFCYiUCrz8VuRFo2tbv3VziiEQiIMgIAoe0rk5KMcs6YE5y93nnY+aA0gQKqccYSZlaI9pcl7Ryxv2XnCq+9+7g95lTL4T8RZ9B+oitvrNl3mjIUvNW43Zu6iNwGJDENns2blqoHxU11zp/Hpx3LpnjJWLBiqhFu+TbXoEL3/LjtWAkrlK/mFQEgO9C6+sPrCGT1H3de+2O+NhmOEQHQk5DJERITRSLzI53n43vZL5/SpcemJzCysFQAqQ6ejsUcfTNRvhuteo0ARmAYwgzIgkdQ6hT06+jau97bpgoVkqnuJJxE9t/bDJu3GTZq2Vgi8Po/WOTEbFuAceV/TLALBkO+n3aW9Bs9o13Xylo9/VA4HgIilPc1v9G/aSHd20KkopLNgKNA2eD2KTT3yiWiD+qlX1u8DhJRVVNk06c5ba65eMLBds6syiZx66H8XQiQHGOl0JhXPtG58xaoFA3t0u8E0SWtGESQlSqVe2RCtX9ce9JCK2hAIgLaBEFgkXMKXnOZaPDPw+LNm1VMKzFQ5Rzy/2f7b7X1mdO391Off7gwV+RGR/5ua8z//AgRArdl0ml6/e8PLH7bsPH785E2plCZTaStrHFM98MR0xzMT9XEBKS0FUiAMBFRcid7+PNWsfXTEYDsRztXQCpJbEuVz3VNPOWrqxC5TJ9x2crVjIntiIPK/CCGkFACHS2OnnVBl6vjbnnm86+mnHq2ZhTnXU7X3/Bwb0jvVvD2+/imFisFQyALKkFicDa2G9gms3+ip1wK1LhNhlIt4MjMRZbM8Y86rTdqPXbDydbfX6XY7teby3I1yXWhhYeZAwJfIZoeNWdT0xkdffu0rZToQgC3b1+E23wuboEMjSYQxawMpsG3wexQ79LAJsQZ1068/j7nslLkQCIG9TZkWTS5Zs2hg71vriy2JREr9zxBVyQFhIp5Chj63Nli9YECrZpeIMDMrYSQSwuTqRbFatfXoqUqb4POWiTA0R/ZIrRqe9SsCw8cawcqgNShVTsDIEU8ieveD71t2eqzffbN/jcSCIR+LcPmbHuW/WVqzIhUI+d/7ZHv7WycOvG/Rr78llGmwZZsnnB6YvcTx9Hh9jE+iEVCEDEBARcX45mfJpm1jY4dpO5WvlRUGIfmmzNFH+Ube32rh9D6XXXhqpDSmtX1457oCIKRIazsSjl92wSmLnu038v6WlSt7tWYQICRQhrVjW/T2Tpn2t9DWH6moGAhABIkkEtZFTmP8sMDK1a6/XfsHEUYBxDMay4wYs6p1jngGvaZhas0gWH4NbGEQnSvyezwuNGjq7E0NWo9e+tz7ZBoIIDZ7O9/pe2EjtKqjY2GwchCiwe9TWbLveSTapGH6o7fyHIoL69Tvbcpce8VpK+b2G3lPe7/bFY0kiJAOS3EIERFRLJr0uVyj7m2/Yl7/qy4/hXNxBASJGHVi5hPxG+rwM0vQ9ILHmRdhZLI6EYY2db2b1vh7D1EOH3B5RRh/JJ5rN3zcqM2YsU+sTLPl83u05n04RbEv8ZuZATAY8m//6dc77prWteez2779VRkKtG2cdFZgwRLHk2O5klsiESACFlFIgSLc/E6yYdP444+wTu8DhOSbMsxut9G7e62V8wc2rn1JMpbKZLJK0eFwDGIvTVOKMplsIppsWqdGjni63YbWTCCYy1Q//yDapnmm+yD6sZRCRZi/byjhUjm+2PHMY4H5y5xnXlTWUy0vYACKUrRjR2nPAbNv7jXls20/BooCihTrfbwy+07utGany+HwmEtXv9GozZgpz7xkMREAaOW9pZdn8zppfj0nImhrIAVaY8BPEdvqPyzSrHHms/f2EULKiOo5Z1SZO+2Opx699fhjKkXCcUA8HGTuRCQIkdLYCcdWfmp8t9lTu519RhWtc8QTgJTOJGKPjkzUbgjLn1fugLgcuUwVUxmtE3hbW++Lm3ydupOo8pe2copMIhTGmfNer99m9Jwlrzhcptvt4kKq1fvTOXJEVRiCIX9pIjlkxPzWnSe9/e52UoTA5unnB5asNMbdrz0AsSgoJTnpYaAI17+RqNc4NnU8c3afIOR3otqmxd/WLBx4y401ddpKJtJK0SHiqYIIpDCRTIKlu3WqtWbhwLYtauRCYS6OAFH6nVeiTRrYg0aoiIXBoIgGBGCW0hJ99vGuhdMDT81y5DPV8gJGvuJJ9MnWne26PtFv6MxdpdFAyC+CzPIXj9j89acNtWbDMAIhzytvb21506NDRy4vKUkTALLh7TXEs3mt1L6MI3tAM5ICrSHoV6VZu9c90ZZNytTLUCiE7CWqxx0XnDDqxgXP9Ln47BMj4bhmPvitf6VIax0LJy4555RF0/uOe6h9lSoBrcsam0rZ4d3Re/om6zXDl96nUBEYKp+RRhPasOneHv7Nmz0N2yAzCJdT/Zv3PEXRWOahsaubth+76ZUtXr/bYZr76zjq/rmOIqK1eH1urXDStHWN249bu/ETIiQAx/mX+ZevMkYNERdINJbrvIipyBeC1a8m6jSKPztpH3RD/0JUa1575nML7rq7dzO3MmLRxMFSDwkSEmE0mvSYjqH9W65a0P/qK077I/EUouSGZbF6dXn0k0obfzguoCUa5qvPd69cFBgx3iyuIloDUjkPsu/NVJ9/+YumN44f/fjKpGX5A94coO63KLkfLxVrIaRgyPfl9p0395h8R7+Z335fQgCG0+cdOMy9brlcf4mO7BEtQATMGAyo0qx1x6DozW2y331RqG7oX4iq1+u4965GK+cOqHX1+clYyrIsZVAZR9zPlLOstEXZbDYZTzepfcmqBQMH9qnv8ZiamXKnzJXK7vgqeufN6Vadact2DBXnDgYiGRKN6oBhjB4aWL/ZfXWdnNQBlSrPO83pK5SiH38K97tnQYduEz/+4vtgkV8ppbXs3w+7nxFYRLS23W6nw+OYt/zVxm3HzJr/utZMAI5Lr/GvWWc+OJBNXaZe1mAq8oVk9qpEnQaJxTP3QTf0T00Z5gvOr7ZkVq+xw2+qHPRHSvce6d7PFQwiBIRoOHFc5eLHHu4y5+nu5559nNYswkoEiAQlvmh6vHZ9eWqhMr3gceXFFhmLY3ug0TWejav9/YcaTm/5RRhlmSoB4PwlbzdoM+bZ+S8YTqOs4rn/k7UDEZ6Jy4jqb5F4nyEz23ed8uFHOwjAcHg994x0r10qV53P4T0gIITAjEVFuLM006l79NYO2R3f5Dt2hUNIrvWPKLfcdNXaxYM6trwmk7ZSaeuPDY79gBwIyVSGs7pzm+vWLRl0U7u/iwizKBBEAqUyX34Ybd8i27kH7SjFoqL8GAhECZdytaD55NjA8lWuc2sUJMLQOt8i+XTrzva3TO456NlfSsLBoK+MeB4YLmW4KrsCJ+MB6GiJiFLK6TI/3/bjyjXv2ZZceN4JTodS1U4yW7XSZla/8TamLHS5QGswFDlc8taHmXWr+Ngi85wLMdexK3TeECIAaubiIm+DOhecclLVoyoHTj/1GATQpb9a8+ZTLAOFMlYiyGTw3NOcLdogQCyW3vLxjw8Matmre62A35UP/8CglLZTiacmpG/vA299Sr4gGITMoAxJpkSnsGNT74wZ7usbICiQAjLV3OCMVNqe/NTmfkPnfPzF936/h5Q6MG4hSGY2+QtaO9EVOjNUtRYeyHZnTr6QiKdqXHDakH5Nal1/NgBogMwLqzND74d3tpI/JATAjMqAVJrBos4t3ffe76h2CmgGQiicXeZkcHlaygxEmW8+SzRotI+TfaIRbNcgMGcpilg2M4PTqUREREgYlAEA6bdeSg0fDs+/RS6fOExgG4hQC8cictHprqFD3M1uRICCxHxa55OvF1/+YvSkVW++95XH5zJN4wCOxxEmwxP/7UNMvHcAkeMPvs9E6HY7f/jp11Xr39/5c+ycM6uGAm7z5DNUq+bajvI772NWg9OJWoNpouHg19/Nbl7PVSubZ523zxCCiMyCiLmxSPsLOZQiwyBmIRAEAWXY8dL4mAczfQfT1u8pEAJEFAZSEE+yyUaPm71PTXVdfCWy5ONIOTwjhwpEtGt3bOSY5+4fvfj7nb8Fgh5E4gM7a+p35DhIJQER0Fo8XjeaatqczY3bjZuz8E3Q7Agd4xs7xblstpx7IoT3ACKACGsqrqS27cq0uyU64A6rdFdObyZS8ONygDovecAgElLJTStjdWvrB8arDGLAnxdhaOHSPXLFee7Vi/3jJpuVq0r5DrbnrxXnReGLlr/XoPXoyTM3okle715tzsEq+B6shgPmnwaBUJHvp917eg+e3rH701u/+FkBeOo296xfj70762xckmnMH4BwksPHE2bE69ZNvrgGlEIs77yhg/B5QCnr1x+jfbulW3bC976iUHGukQSkJBLVHjAeHuxfs859dV3QGoSxfKWtvDaH6POvdnXqNvXOgdO+/6UkVOQHIeaDfa5YGa7K7sDJB3OUkQgYpnK4HJ9+/sOq9e/bWbjgnOPdoSKzXmO44HT9yYfww050ugEFgNHjwx27rRUrrdKdVONS5fbls5iCWMh+DSsAKCjJRTOTt94Oa18htx+cDtAalYKsxek4NLzGM+1Jb+vO5HCJ1qjKVdrKMxiidMp+YtoLA++b8/6n33h9bsMw+KAO4Ps9rCjTVdkVPBkI84/3QfnKtVBdHmcyY73wj09ef+ebU6ofc0K1Ysfp5xitmtqJEv32e6QRDRO1BqeDtOKXXs++sglPP8k48dSC+el+dQ5mKza4jz1ohApn0B8AZhRBQIlG+Vi/Y8ww36hxjuNOzon5kKh8D57kSNKb727vMXDm7MUv2ygejztfvsCDeXcElZlN7kLrZ4M167QFgAd/3qoGQESv03zzrc9ad9jWptXVvbvXOemkqv7Hn01ec032gYdwxy9gGiICCqDYDx9sjbdolenaydN/sHl0tYLxYz9VOTgZtV9/FQ3FPiV2Kn9NmVWHxr7773ecem4+PypfAQPKBvh990PJxCkbFi/5RzyT9fncnOVsJn0IWojAhmFwVhOAUfOqs++9r6+hTBY5VNI7RaS1LgknDYcBwijga93Zuvp63vE9GObvT79SaLOES5EUIB6a6cEiyhP0z5gnsRgoQsmnY2AY5vmXElA+sSost0JEMBTVrnluuxaXkVJ86KiV1trpcK1cuXDK5C1GlWMCV15+xuEzPhG0RhCxbLNKdahS/T98G2C5R7/kDln9RUInkqtpIpHj9PP+3VtiEAuQCq/tAjAcX63o+GpFh8lN+HJrFQQxLFBZQBNADrWDSC53UgoA8L9CcrlBe+83o8+3j3iTo0imif/5lyr6i9kfHwbPqAYggDQagmToHd+m1iy2lXEIw8oBNxY0Tf3z95DOyj7ogUTQMHjnzuQLqySThSP6kLfW7PO4rfffACuDbQ010eFyHh5ue+AwCQAQCZVzn3QeAoDCtugsHOmmAUKIT1nZ+7NZA8ggh5fgCJ95gLlJavvIYREAkExUjiPeOSQ3TJYTAJYBICBHMGr8E3j81deQ/yNTZfLzcyqG+VXYn1qFc1RYhXNUWIVzVFiFc1RYhXNUWIVzVFiFc1RYhXNUWIVzVFiFc1RYhXNUWIVVOEeFVThHhVU4R4UdSDNyM7aOeD0HAAAI/JXTQeWeKP0/b/lPigZkLMiWCuCRLPgREBBUBF4vIO7LqXFEsbKSSCLCkf0g5c5QCVsIYuAZJ1PNq4kI5MiVCgogEUfDvOlVTFhQ6OlqRLAsOfk4dd2VoPnIBllhEVPRp1/I6+8Y5hVXB6ZMPxyOJhxoy+7aHn+nFkXDoAo8oIAk6TReep5/0tNHfPTVAArANX8efrTVAMuCdBpMM3eg9FDGOUT4q5MnBJj/9dQy5oe3SDQOvE/PPQIgYNYCrUHKfQZz79yYPwFvwH8eQ46wD1N7D4B3aFAKkikQMRAJDRMOgynz6bTlcpl/BRBBEExT/r87m2dYf5FO5ph7uR8hsS1QCIbxZ/72L0OLmDmbtV1O89DeBUQCQlQKQIwX//FZyxsnIOIhEVYjACrKpDKWJc2aXn7nrdch7lOAYwYiQEi/9WJ6wmOYsQEJEDmTcvbr7anV5Pfn9WDEbQHE7DefJUaNoJ9+Q7//d0hAFFvDUUXugYOcZ16Ym84rSIgQiaQfenTNB+9/6fO5DNNgzYdG6s5sOj3ffPUqMxi/lERfef+rg804BACAFLHWiVjqrFOrDenfrHmTS39/qgq4EYwCQKTjpYnxo/QT0/G3hCgCEVCGZOO6bYtDECJFnGdcgHffnxwxXC9YQWCAww1cFpW0nXj+FWtQH0/33qRcqLUgFhV5Bvdt8NR01+RnN5SEY76AByQ37v5gM1JU7kx4l1PAME3D63XjQX0LjEhIlIwnPW5371sa9O1Rrzjk3rcAiUoJQuqFVZn7HoR3PiWPD4qKAAQUQdYWSaLf/0csP3j+AeA46wJz/vJUxyWZ4SNhy9fkD+SnryKqkrTV/4HImnXukSNdl1yFAKJ15cq+oYOatGp22cPjV61//n0ylcvlZOaDelxGmAwPpEywRBmuyk7/SSD5yTIHwYgoa1mJSOKKS8+cNPrmzu2vcLvM3KKQwuKIACiy9/ySeODu7KDhtKMEAwFAQBEAkHCUQw7HiHs8LTuS4difk33KT9uZEcA8/RyjZXNtxfiDDzCeBocT2AalwOHCL7ZnV66ws2F10SXK5RHNzProowLNG11SrcpRH33y3c+79jgcBmJ+qfhBMQY0ssmfD97AuLKLjEgQjcSLvJ5R93VYNqfPlZedsneXemGMOrcAa+X82A21ePyzCpzo9aDWSAosixMRaHqd5/l1/l5DlC94yNhd2RZms7iKf+wTrlWL+bJzOFIqWoQAmTEQUHG27xsXa1Avty9RGQZblojc2OaydYvv7tLuerZ0MpVWCg/+5rKD5Bz4+27EdNO6f1s1f8Cdt9V0uYy9Y/MKAQwBpayft0du75Tp0A0/34HBUD5iEEk4rCu7jSdGBZY95zr7ErZsOQDJIYsUMO9RKRBGze6r6/g3bFDD+7MbIRoDUsAsBmGoCN/Zmm7SNjq4l73nFzJNFNG2XfW44MTRHeY+1evCM0+IhuN7Z5IeUc5BhAISDsdPqnbM1PHdZk/tdvppx+QWFKryp5e52SlEgpCY+3S8Zh15Zgk5fOhxg9aiFKQznIpgpya+F5/339YXWWnLItPA/dwQQc1MiESoy59QIIEi0NrwhAL3PuxZv1LqX8nxMFhWfta7x03olkefiV1/fXL5XKEchNis+Ybrznxu/l339mvlNlUsliB18BDkwDpHbjdiMpEGm3vcXHftooGtm12anxRe0OIc5lyZIfvNp5HObbO39Mbvf8VQCHKTSZGkdA+fUMkxc7J/5iLHyWfprIWEyjRfee3rV9/cBvtpGqkAAELpnuSo8eu3ffurUoQABUKIgNaui68MrFhjThqpK3kgHAHKFZkEAyH8amem0+3R2zpkv/+STIOItG35/c5Bfesvm33XDVedl4imspZ9cCDkAP4OpdDWOlIa+9sFpy54pu8jw1sffZSvbFEIFgAYtg1EzNn40xMSdRrA3NXkDYHLmV90lUxpK0E9Ovo2b/K27QqatW0rhxmJZh6ZsLbVTeO2fPwDQH52135yeVq84vWGrR95dtarWkMeQsqZUeQqaayVcvq63+V7cSN0aMSpKKSzYuQXv5PDL9OXxWvXj8+cosFShim2rbW++ILjl8zsPWFE5ypFgUjkgCyEOBjOkV9RE0n43c77B7RePrfftVedlruCBbm85FYvG0b643eibZtnewymXQkMhfJAIsilJXzW8c45UwOPP2tWO1lnLVKkDGPTi1ub3/joqIkrtIjH49i/qSyCFAW9u0ujdw2b3eHWyR9+vCO351aXn9yQyi0fcZxyTmD2Ese0CXxCJdmzp+zlGYqK6KewdVu/aPtWmS8/QsNQSrFtE8HNHa9cvXBg26ZXZlKZdCqj1AEcrUIHADDIyljJeKpJnRqr5g0c0Luex2PktmsVEC1FcjUMOxOPPfZQqkFTWPGS8heJaQBrMAyIJxkyNKCbb/Mmb/MObNnCWjnMH3aU9hwwu1P3xz/68odyLuXeB/ewNRumEQh6N7y8pVmHcY9MWBeNZRRRblNOuSMuAWti8XW83ff8JrrzRi0ZSKZAGaA1OE3yF+HSzYla9eOPP6KzCTIMsLW27RNPqDRtYpfpk+4865Sq4dKYCB+g5Yf780VzK+vC4dixlUNPjL5lztO3n31mlYKJZy5TRQSlUm+/FGva0O4/jKIWBoPAnBs5zyW/So0z3MvnB8Y8YVY+TmezyjSQ1NyFbzZpN3bW4lcMl+F2u3KrBfb7YyV57xVm8QW8GeaHJyxr0v7RF//xJRHlNs+VL4QhkAJC0NqsenLgiRnO+c/oc6pzaQlKvgmHwaAKZ61+D0SbNEi/9w8wlDIMti1mbtLgglULB/Tr1oi0JPJEFQ9H58jtiUkm0mLpO26qs3bxoBtbX8bCBRPP3EBIpexYSXTE4FSjVvjSB1RUWRTl/l9icXaKGjHAv269u2ZDtmwAUQ7Hhx/t6HDLlJ5DZuwsKQ0V+YXh4EwKZ82KKFjk++SL7zvcNqnf4Pk7f44qRSIFElVm1Oxt2DqwebO6p4fGbNkyKxaDMFCEL7yXbNAy+uDddmQ3GSYJaNsuCrkfHNp8yYz+V//t7Hg0adv7majSfokjmjlcGrv4nJPnTe01ZkTbalVDWjMhFUQ88wyDKPXK+lij+nrYBJVR6POKtoFIcrvdr73A/dyiwNBRKlCZLUuZRiJhj31sfYubHl3zwoc+v9thOrTmgzvKXbQWt8eNDnpm/guN241duPQd3JvrltNDqCzXLa7iHznevWohXHUBh0ty2TsyY8Cv0qCHTYg1qJ98cbUoUoYhtq2Zr/j7ycvm9Bl9X4cirzsSiRPliKocYudARFIUjSXcpjm0X8uV8/rXvO5MZuZCK56S34Bnl/4cGdQz1aw9vvU5hopBYW4PAURj2q+M0UMDaze4L6+psxYCkGm++I8vG7cbN3LCspRtB4JeZmE5VL1MBsBQsf+HX367Y+AznW+fuvWLX3KoWWiui1q7r67nX7veGH0v+xRGYqBUbrE3FlXC979Ot+gY7dvN2r0DDUMBats2Tby963WrFw5q1eDvqXg6k8mo8m11OVDOoRRaWSsRjte79sJV8wbc3a+Bz+fQzERUUCABrQFJiJLrlkRr1+Fx05Q40OtFrYEQLJtjpdLwKu/G1f677kOHX7StHOYvu6L9hizocNukLZ9/Fwj5FJHWh1omI6Bt7XA6vH73yo3vNmk/ZtJTz2czmggLIqr5XNcd8A94wLNpLTe8kqOlYtlABNpGr0eBix+fHbuhVnLpbCFUhiG21lqfdurR06fc+vSE20+qekykNIa/E1U+eM5BREgQjSSqVAo+PuaWBc/2OO+cqvlMtSDimW+eKeuX7yJ3dkm37UKf7cCiYsm5FiqJRnUlt2PK6MCy51zn/U1nLUJAZcxb/HbDtmOfnf88Osjjcem/tpR7/yYywsIsgaAvlsk88Miixu0ffe3NbX8gqgXkuqC189xLA8tXmVNG81FuiESQVG4mKhaFaNuudOc7Ire0z27/Ag1DEbFti0jLppesWjjgji51RUsykVQKEekgOEduKTelkulsMntT6+vWLRnUse3lRPnVyIVmqkAkiIkls2LX14KpC5XygNuZHyyfznAqDG3qeV/Y4LutL4AThJXD/OKrXR27PdXz7md/+Pm3YMi/F8/hMDOt2VDKG/S889G2tl0fGzJ8acmeZNmK5IIghJVy+W7r49u8AW5sxIkIpDNACmwNbqdy+GHGynid+vHZUxg1GQYya1tXOdo/enib+U/3vvick/9KU6b8PyNKETPHSmPnn1V99pQej4/tWK1qkdYsgFQYYGiAXC38s8hNbTI391Df/Yahor08RqJRXb3Y8ezE4LylzlPPZctSChMpPWHypsbtx67Z/J7X73I6HVozCB62smgRYC1er5sVTJ6+vlGbMcue+2BfiKoIaO049dzA7MXmrMn6lGM4vAdzC3KEsSikdkayt/WPtm6W+fRdUEoZim3NzNddffrKef0fGNjG6zRzTZlCJ3tT+ZwYSVEslnSSGtCz2eoFA+rXOW/vamQs6IJpDaQY7fj0J+K16sK81crhA3eZxCGV0ekYdm7hf+l5b4dubAMAkGm+9ta2pjdOeGDM4lgy5Qt4mYH5f2NeLDMTqkDI//UPv9zW96nbes/Y/n1JGVHlgiCEWHztuvo2b8Tu7ZlTkEiCUsA2OEzlDcGKFxN1G8UmPqyzCTIUiWhb+3yO/j3rrpo/qO41F8YjiUzWUorK/zT9d+dQiizLSkRT1/39nOWz77pvUGOfz5FbjVxY1aWseZbZ+n60VVPrzkFqd7KseYYiwOE9clY156LpwWfmGseeJLatDNr1a3zIsCVtuzz2wafbgiGvMgzW/1tjhFFEWLPL5fL4XUtWvd6ozZhpM17JZpmINOvyElWiXLnMUeWE4OSZzmVz+OJTOVIKXLa4ORhUUdse+GC0ft3UWy/mIERsW2s+56xjFzzbY9LDXasdXRwJx3Ks8a86Ry7tiITjlUP+CSM7L53V++KLqmsuuEWSL20RaTsZmzQqUbshPPcSeQLgMPPNs0SCOUX9bvE/v9nbpB3bGgHQMJat+qBR2zGTZ2wQhR6PO7cPHP43jZmZwR/0/haNDRg+p9VNkz7Y8oMiVQhRzUMIMntqN/Vvfl7d01MrG6KxsnKZQn8IX92Satgy+sBAO7IbDUMhstao5KYbr1i/dFCXttfbGTuVTJWHI9KfIJkohal02kpnO7a8eu2iQTd3uNIwiVlUoYBRVtpKv/NytHFD+67hKmpjICisBUEYOFLKF5/uXj4/MG4KFR8L2laG+uLLXV17PNOt79Tvdu4OFvkBc0u58X/94JXWYhimP+h79Z2tLW4a/9C4NZFIOkfmyhsoyyDE8BUHHhznXrNUrr+Eo3vE1jlpCPp9yjb1yMdj9eolN60UQlIKbK21rnJMYOKYjnOe7HneGdWj4bhmTf/xRAr92zjCLOHS+JknHffspDumjO980gmVchyqsB5xWS1cJ0qjIwcnG7XC599BfxAMlV8+HY+zYdPQ3v5Nm9y1GrNtE4DFavLTLzRqP2bZ2rdcPpfD4dQ2wxE0kD4XZbw+T0bbj0xa0bj9oxs2f0ZEOaJaAISIgGb3FTcE1m5Uj9zDQQeEo0AKWICAQkX44bZ0i47R3rdYu37I57paM3PdG85evWjgwF5NHUjxWJL+HELoXzJVpSgeSzpI3XVH49ULBzSuf0HOqQtrkZQBhhClXt0UbdJI3z9eZQgDfmAGQtDMkRK57hLPmqWBYWPIVwmAlWG8+c63LTs9du/DC2PpdCDoExbhI3NRATMTUajI/9nXOzrd8XjvQXO+31FaluuWn6gSaK1Md+CuBzzrVkKTayQRBssWUqA1ej3K9PLkufE6dRPL5ggiKYXCWrPf5xg6oPGy2f1rXn5uPBK3bVsZ9J+cg5SybTsajl9V46xls/oPG9KsuMiT+wwFAgbnm2fhXdHBvVONW+FrH6uiSkACLKQMiUS1F9XY+wKr1zovrym2TQi/lqTueXBZ687jX313qy/gNZRx6CueBz7X1ZrdbqfD7Zi56OVGbcfMnP8GIhJRAbluHkJs1/l/CyxfbU4dp4/yQrgUkEAARDBUjF/9nOnQLdqlbeabragMpUi0ZuYaF5+4ZHbvscM6VQr4wqUxpH+NDJQjnkQYC8cq+b2j7uuwZFavSy8+IVfxLKyA8cda+NolsXr1eMxUBS70eVjbudKNjpRCg6s8a1cG+t0Hpg8ByDBWrt3StP24x59Zxwp9Pk8BxeYjAUJERIIh/649kf73zmzXdcrHn/6Yw2ldAIQYwJrA9N3c0/fCBuzSgtMxSKXzua7bqdxBmb0qUade7OkJWmdQKRLRWisFt9187eqFA29semU2mU2nM8pQZSECiYjS6Uw6kWnX7KrVi+6+89brXS6jLI4UmKkygFLZn7+L9r413bYLfvgNFRXnfAZJSTiii5zGpBGBlaudF18BWivCb7b/1r3vzFt6P/nV9p9DRX5E0vr/ilv88fZqzaZpevzu9S990Lzjo2MeW59IWHn1UHmJqgIU0Npx8tmBZ+Y75j3FZ1Xl0hLMNSOEMVSkfolbPQdHWzRJf/w2KKWUEs1a8yknVZ46qeu0id1PrV6ldE+URQgJACidypxevcrTE7pNndjllJMqa61FpEBxYr4WzgSJJTPjdevL43PI9ILXLbkj22mLkxFo38C7aY3vzoEgJgJYjFOnv9y43dgFK19zeZ0ut7MAJeaRGWWEWQIBbyJrjZywtHnH8S/l1EO0D7mueFt08m3cqPp00VCmLmNbHAb5i3Dta8n6TWPjHrSTEVRKgeSIarOGF65eOLDPrQ1JSyqdQUK65PyTl8/t06LJxcw5UbgqGDAEQans919Fb26X6XSH2vYLFlfKD8BAlNJSfXzIfOaxwNyl5pkXITApeueD71t1mnj38Lkl0Vgg6JP/nYrnQch1lVLBkP+9T75pf+vEu4Yu3P1rXCkSKTjXNY+qFpgw1b1ivlx8GodLhAWJUDMGAyqm9aCRsYb1U69tAqUoH2X4qMrehx5otWRG7/PPqp7N2nTu2VWrHBPQzAWrmcuaZwxWfNaTiRvqwNxV5AmCywk6XwvnbAJubu7btMHT8XbQTAAle9IPjl7V5uYJr7yz1RfyGsaRTzz3AUK0Zo/HTU5j2pzNDduMXbz8PUQqrCmjFAiDZvf1Df3rNxgP9GNTSywBygBmUIRFlfD1T1JN20YfGGCHd4FSCkE0W5b19xrVb+9yPRGRZdmWpVWhJ384L/PMfPVRtHVT67Z++EsUgyFkzq/JC5fy6ce65k8LTF9gnHA6gZBSazd83KjduHGTn8vYts/vLX/t+P+gMQsKBEP+7Tt33zHg6c63T9v27W8FEtUydVnwKP/9j3g2PCc31ODS38DWQCjaRp83Xy6rXTu5cbkQoSIUZmYAcTgUIRYoTBUBzUCKs4nYlLGJOg3huZfJFwLTzGWwkEyzTlHPTv7nN7ubticWAtjxU6TngNldez/19Xc7g0X+3PCFCg/4b1QOtGaX03T5XCs3vt2k3Zgnn3kpnbYLk7nvPUl16dWB5c8Z4+7noCnRKJACECDEUBF+8l26bZdor67Wz9vJ4SSkXBJVYKaaBwxKf/RmpEkju89Q9VsKA0HJjVNi4dI9cuHJ7pXz/BOnqaOqIYBmmD7ntXqtHpmz5BXDabhczjJsxIrbX15SxxAI+kpiiSEj5jXvOOGNt78pTD2ECEoJa+X2+/sP9bywHppeL4kIZLJCmDuMqcDFk+fHr68dn/s0IKDLDczlP6rKOcDQqWh01P3Juk3wxXfJXwymkQeMeFIbthp8h3/DRucNTRCEALZ8/GPbLk/0v2/Wr+FoIOQrTJNdYf9EVNkwDH/I9/aHX7fuMuH+h1bsKU0V1JTBveqyMy4MLFlpPv2orhqCSARRIQCgUHEx/VCS6dJL9+xibf8CHE6jvLVwpUBB6h8b0vcPg9c+VG6/+L2ibVQGWLbEw3LVJZ5RDzn+fn2uORaLZx+f+vzUmZsi8aQv6BGGgywKP0KJqni8bs36safXbH7548F9mjZtdGHOdco1rGCvNARNX+c7szXrpEY+yLOXopjo9YBtg8uhHA54enHGjfJvK+r/BjCUssO7o0P7pZq1xzc+w2AxGAoZgJREo9otxkODA+s2OP5+PQEgwOYXP2/WfvyoicszrP2BHPGUCs/YX0Q1rx76fudtfZ+6vd/Mb7bniCoWkOvmymXHnxqYOts5/2k+qxqH90A+1Av6A5QFKI3QfwEMJFGU3LQiWreOHjVZaRN8XtA2EIGlJRaGepd7NjznHTTccAcIYMePpb0GzunQbeKWL7aHig4PUfgRWS7T7HI5TY9jwfJXG7cbO33Oq7bNhcjccyyEkcXTvKN/0ybq21VDBuKpHIEVQviz6YvCDCyglLV7R7R/93SbzmrLdgpVAgIABlISiehKLuOxEb4Vax0XXUkAIDBv0VtN2o+bteRl0+1wu926IlM98EQ1GPKXROP9h85q13XyBx/9UBBRRSIgAK3No6oGHn3SvXweX3omh0skN5oR2PjjNKjfk1UiBkgunZV5cBR9uh0DQfFiHkhSKbaS1LyuZ8QIx5kX5Zzr409/fOSxVeuf/8B0GsGg73AqhP/+2fJ/7mtWCXtfQXKlnL1fh5aoasNQZsjz/Gsfvfvhtts71+5zRx2v11HA9SfKjTl012xk1Lg8NmGMnjhNIjHwew2llMPhAIDf6QyifP9VeuSDMm+FCxxQXAxa54ezWmk55VjHkP6ODt1y3xuNWtNmvTJ5xsaScCwQCuTykX0+KLF/DREBDcN05Kiaw2FauXeGhXsYABLl+pVOh4MME9EENA7R+NZ/wwwDgWDWth95YvVLr31+V89G9WqdVciVUrm/TX+l4vtHQ5PmZv+78LOvjdLS0tdee42I8r7GjG53Yv6z+pl5FKoEIJBNA4IAgm3Lhac5e/Z0nVuDX3udULb/UDpt9itvvPel1+d2mkYqVnpYTVBHRCuT/eqrj957l9I22D9+nU5lUGxgwUKATYAAGXbt9r71phIJR9KRPd9lU7tBm4dR4BRAAreD3njn9Xe7vN2++eUtm1zq9ZiFnQ8V0Vr7j6nyyw316JMv/x/uihTmX5cFYgAAAABJRU5ErkJggg==");
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }

        .flag-de {
          background:
            linear-gradient(
              to bottom,
              #000 0 33.33%,
              #dd0000 33.33% 66.66%,
              #ffce00 66.66% 100%
            );
        }


        /* Schrift etwas klarer auf Glas – nur Kontrast/Gewicht, keine Größenänderung */
        .category-card h3,
        .smart-head h2,
        .panel-heading h2,
        .teams strong,
        .ticket-card strong,
        .weather-panel h2,
        .weather-panel strong,
        .spain-schedule-head strong,
        .spain-schedule-teams,
        .social-card h2 {
          color: rgba(3,15,40,.98) !important;
          font-weight: 790 !important;
          text-shadow:
            0 1px 0 rgba(255,255,255,.40),
            0 0 1px rgba(255,255,255,.18) !important;
        }

        .category-card p,
        .smart-card p,
        .smart-card small,
        .ticket-card p,
        .ticket-card small,
        .ticket-card span,
        .match-info,
        .from,
        .versus,
        .weather-panel p,
        .weather-panel small,
        .weather-panel span,
        .weather-condition,
        .weather-label,
        .spain-schedule-head span,
        .spain-schedule-meta,
        .social-languages-label {
          color: rgba(7,22,51,.88) !important;
          font-weight: 650 !important;
          text-shadow: 0 1px 0 rgba(255,255,255,.30) !important;
        }


        /* Social-Media-Kachel: nur Fenster-Wasserzeichen + Handschrift */
        .social-card {
          position: relative;
          overflow: hidden;
        }

        .social-card::before {
          content: "";
          position: absolute;
          left: 50%;
          top: 54%;
          width: 285px;
          height: 205px;
          transform: translate(-50%, -50%);
          border: 7px solid rgba(255,255,255,.16);
          border-radius: 18px;
          background:
            linear-gradient(
              to right,
              transparent 48%,
              rgba(255,255,255,.16) 48%,
              rgba(255,255,255,.16) 52%,
              transparent 52%
            ),
            linear-gradient(
              to bottom,
              transparent 48%,
              rgba(255,255,255,.16) 48%,
              rgba(255,255,255,.16) 52%,
              transparent 52%
            );
          box-shadow:
            inset 0 0 0 1px rgba(7,22,51,.035),
            0 0 20px rgba(255,255,255,.035);
          opacity: .68;
          pointer-events: none;
          z-index: 0;
        }

        .social-card > * {
          position: relative;
          z-index: 1;
        }

        .social-window-title {
          margin: 0 0 4px;
          font-family:
            "Segoe Script",
            "Bradley Hand",
            "Brush Script MT",
            cursive;
          font-size: 24px;
          font-weight: 650;
          line-height: 1;
          color: rgba(7,22,51,.86);
          text-shadow: 0 1px 0 rgba(255,255,255,.42);
        }


        /* KI-Innenkachel exakt auf Größe und Position von Google Maps bringen */
        .smart-grid > .smart-card:nth-child(1) .smart-head-clean,
        .smart-grid > .smart-card:nth-child(2) .smart-head-clean {
          min-height: 64px !important;
          height: 64px !important;
        }

        .smart-grid > .smart-card:nth-child(1) .ai-search-box {
          width: 100% !important;
          height: 154px !important;
          margin-top: 17px !important;
        }

        .smart-grid > .smart-card:nth-child(2) .map-preview {
          width: 100% !important;
          height: 205px !important;
          margin-top: 7px !important;
        }

        .smart-grid > .smart-card:nth-child(1) .ai-search-box textarea {
          width: 100% !important;
          height: 154px !important;
          min-height: 154px !important;
        }


        /* Header-Aktionsbuttons: größer und direkt beschriftet */
        .header-actions .seller-action,
        .header-actions .buyer-action,
        .header-actions .cart {
          width: auto !important;
          min-width: 94px !important;
          height: 46px !important;
          padding: 0 16px !important;
          border-radius: 15px !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 8px !important;
        }

        .header-actions .cart {
          min-width: 112px !important;
        }

        .header-action-label {
          font-size: 13px;
          font-weight: 800;
          letter-spacing: .01em;
          color: rgba(7,17,31,.95);
          white-space: nowrap;
          text-shadow: 0 1px 0 rgba(255,255,255,.42);
        }

        .seller-action::after,
        .buyer-action::after {
          display: none !important;
        }

        .header-actions .cart .cart-count {
          position: static !important;
          transform: none !important;
          flex: 0 0 auto;
        }


        .header-actions .seller-action,
        .header-actions .buyer-action,
        .header-actions .cart {
          background:
            linear-gradient(
              100deg,
              rgba(36,103,251,.18) 0%,
              rgba(44,158,209,.18) 52%,
              rgba(37,189,135,.18) 100%
            ) !important;
          border-color: rgba(44,158,209,.28) !important;
        }


        /* =========================================================
           MOBILE – Struktur wie eine ruhige App,
           aber vollständig im bestehenden PaseSpain-Desktop-Stil
           Desktop bleibt unverändert
           ========================================================= */
        .mobile-bottom-nav {
          display: none;
        }

        


        /* Mobile Feinschliff: nur Handy, Desktop unverändert */

        /* =========================================================
           PASESPAIN MOBILE APP – EINZIGE MOBILE REGELN
           Desktop bleibt vollständig unverändert.
           ========================================================= */
        @media (max-width: 760px) and (hover: none) and (pointer: coarse) {
          html, body {
            width: 100%;
            max-width: 100%;
            overflow-x: hidden;
          }

          .site {
            min-height: 100dvh;
            padding: 0 0 92px !important;
          }

          .page-shell {
            width: 100% !important;
            max-width: 430px !important;
            margin: 0 auto !important;
            padding: 0 12px !important;
            border-radius: 0 !important;
            overflow: visible !important;
          }

          /* Kopfbereich kompakt */
          .header {
            padding: 10px 0 4px !important;
            gap: 8px !important;
            background: transparent !important;
          }

          .brand-area {
            align-items: flex-start !important;
          }

          .brand-text {
            font-size: 24px !important;
          }

          .brand-handwriting {
            display: none !important;
          }

          .header-right {
            width: 100% !important;
          }

          .language-switch {
            justify-content: flex-end !important;
            gap: 5px !important;
          }

          .language-flag {
            width: 27px !important;
            height: 19px !important;
            border-radius: 5px !important;
          }

          /* Verkäufer / Käufer / Warenkorb = echte App-Kacheln */
          .header-actions {
            display: grid !important;
            grid-template-columns: repeat(3, 64px) !important;
            justify-content: center !important;
            gap: 16px !important;
            width: 100% !important;
            margin-top: 6px !important;
          }

          .header-actions .seller-action,
          .header-actions .buyer-action,
          .header-actions .cart {
            width: 64px !important;
            min-width: 64px !important;
            max-width: 64px !important;
            height: 58px !important;
            padding: 0 5px !important;
            border-radius: 19px !important;
            justify-self: center !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            box-shadow:
              inset 0 1px 0 rgba(255,255,255,.28),
              0 6px 14px rgba(7,24,52,.06) !important;
          }

          .header-action-label {
            font-size: 8.7px !important;
            line-height: 1.05 !important;
            text-align: center !important;
            white-space: normal !important;
          }

          .header-actions .cart {
            position: relative !important;
          }

          .header-actions .cart .cart-count {
            position: absolute !important;
            top: 5px !important;
            right: 5px !important;
            width: 16px !important;
            min-width: 16px !important;
            height: 16px !important;
            margin: 0 !important;
            font-size: 8px !important;
          }

          /* Keine 5 Desktop-Kategorien auf Mobile */
          .category-grid {
            display: none !important;
          }

          /* Start: Logo frei im Himmel, klar getrennt von Social */
          .hero-category-zone {
            padding: 0 !important;
            min-height: 0 !important;
          }

          .hero {
            height: 118px !important;
            min-height: 118px !important;
            max-height: 118px !important;
            margin: -6px 0 18px !important;
            padding: 0 !important;
            display: flex !important;
            align-items: flex-start !important;
            justify-content: center !important;
            background: transparent !important;
            border: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            overflow: visible !important;
          }

          .hero-copy {
            display: none !important;
          }

          .hero-art {
            position: static !important;
            width: 132px !important;
            min-width: 132px !important;
            max-width: 132px !important;
            margin: -18px auto 0 !important;
            opacity: .96 !important;
            transform: none !important;
          }

          .hero-logo {
            width: 132px !important;
            min-width: 132px !important;
            max-width: 132px !important;
            height: auto !important;
            object-fit: contain !important;
          }

          /* Startseite: ausschließlich Social Media unter dem Logo */
          body:has(.mobile-page-home.mobile-page-active) .mobile-page-ai {
            display: block !important;
            margin: 0 18px !important;
          }

          body:has(.mobile-page-home.mobile-page-active) .mobile-page-ai > .smart-card {
            display: none !important;
          }

          body:has(.mobile-page-home.mobile-page-active) .mobile-page-ai > .social-card {
            display: flex !important;
          }

          body:has(.mobile-page-home.mobile-page-active) .mobile-page-tickets {
            display: none !important;
          }

          .social-card {
            width: auto !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 13px 12px 12px !important;
            border-radius: 20px !important;
            overflow: hidden !important;
          }

          .social-window-title {
            font-size: 20px !important;
            line-height: 1 !important;
            margin: 0 0 2px !important;
            text-align: center !important;
          }

          .social-card .smart-head {
            display: block !important;
            text-align: center !important;
            margin: 0 0 9px !important;
          }

          .social-card .smart-head h2 {
            font-size: 12px !important;
            line-height: 1.2 !important;
            margin: 0 !important;
          }

          .social-apps {
            display: grid !important;
            grid-template-columns: repeat(5, 42px) !important;
            justify-content: center !important;
            gap: 8px !important;
            padding: 0 !important;
            margin: 0 !important;
            transform: none !important;
          }

          .social-app-button {
            width: 42px !important;
            height: 42px !important;
            min-width: 42px !important;
            min-height: 42px !important;
            border-radius: 13px !important;
          }

          .social-site-link {
            margin-top: 9px !important;
            font-size: 15px !important;
            transform: none !important;
          }

          .social-languages {
            margin-top: 7px !important;
            gap: 6px !important;
            flex-wrap: nowrap !important;
          }

          .social-languages-label {
            font-size: 9.5px !important;
            white-space: nowrap !important;
          }

          .social-language-flags {
            gap: 5px !important;
          }

          .social-language-flag {
            width: 24px !important;
            height: 17px !important;
            border-radius: 5px !important;
          }

          /* Tickets-Seite: KI-Suche + Angebote */
          body:has(.mobile-page-tickets.mobile-page-active) .hero-category-zone {
            display: none !important;
          }

          body:has(.mobile-page-tickets.mobile-page-active) .mobile-page-ai {
            display: block !important;
            margin: 10px 0 0 !important;
          }

          body:has(.mobile-page-tickets.mobile-page-active) .mobile-page-ai > .smart-card {
            display: none !important;
          }

          body:has(.mobile-page-tickets.mobile-page-active) .mobile-page-ai > .smart-card:first-child {
            display: block !important;
          }

          body:has(.mobile-page-tickets.mobile-page-active) .mobile-page-tickets {
            display: block !important;
            margin: 10px 0 0 !important;
          }

          body:has(.mobile-page-tickets.mobile-page-active) .spain-schedule-card {
            display: none !important;
          }

          /* Untere Navigation: 4 kompakte App-Kacheln */
          .mobile-bottom-nav {
            position: fixed !important;
            left: 50% !important;
            bottom: 10px !important;
            transform: translateX(-50%) !important;
            width: min(calc(100% - 30px), 350px) !important;
            height: 66px !important;
            padding: 4px 6px !important;
            display: grid !important;
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 10px !important;
            z-index: 1000 !important;
            background: transparent !important;
            border: 0 !important;
            box-shadow: none !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
          }

          .mobile-bottom-nav button {
            width: 58px !important;
            min-width: 58px !important;
            max-width: 58px !important;
            height: 58px !important;
            justify-self: center !important;
            padding: 0 4px !important;
            border-radius: 18px !important;
            border: 1px solid rgba(255,255,255,.34) !important;
            color: rgba(7,17,31,.90) !important;
            font-size: 9px !important;
            font-weight: 780 !important;
            line-height: 1.05 !important;
            background:
              linear-gradient(
                to bottom,
                rgba(198,31,43,.055) 0 30%,
                rgba(255,196,0,.065) 30% 70%,
                rgba(198,31,43,.055) 70% 100%
              ) !important;
            backdrop-filter: blur(18px) saturate(1.08) !important;
            -webkit-backdrop-filter: blur(18px) saturate(1.08) !important;
            box-shadow:
              inset 0 1px 0 rgba(255,255,255,.24),
              0 5px 12px rgba(7,24,52,.05) !important;
          }

          .mobile-bottom-nav .mobile-nav-active {
            background:
              linear-gradient(
                to bottom,
                rgba(198,31,43,.085) 0 30%,
                rgba(255,196,0,.095) 30% 70%,
                rgba(198,31,43,.085) 70% 100%
              ) !important;
            border-color: rgba(255,255,255,.44) !important;
          }

          .legal-footer,
          .design-credit {
            display: none !important;
          }

          nextjs-portal {
            display: none !important;
          }
        }

        @media (max-width: 390px) and (hover: none) and (pointer: coarse) {
          .page-shell {
            padding-left: 10px !important;
            padding-right: 10px !important;
          }

          .header-actions {
            grid-template-columns: repeat(3, 60px) !important;
            gap: 11px !important;
          }

          .header-actions .seller-action,
          .header-actions .buyer-action,
          .header-actions .cart {
            width: 60px !important;
            min-width: 60px !important;
            max-width: 60px !important;
            height: 56px !important;
          }

          .hero-art,
          .hero-logo {
            width: 120px !important;
            min-width: 120px !important;
            max-width: 120px !important;
          }

          body:has(.mobile-page-home.mobile-page-active) .mobile-page-ai {
            margin-left: 12px !important;
            margin-right: 12px !important;
          }

          .social-apps {
            grid-template-columns: repeat(5, 39px) !important;
            gap: 6px !important;
          }

          .social-app-button {
            width: 39px !important;
            height: 39px !important;
            min-width: 39px !important;
            min-height: 39px !important;
          }

          .mobile-bottom-nav {
            width: calc(100% - 20px) !important;
            gap: 7px !important;
          }

          .mobile-bottom-nav button {
            width: 54px !important;
            min-width: 54px !important;
            max-width: 54px !important;
            height: 54px !important;
            border-radius: 17px !important;
          }
        }


        @media (max-width: 760px) and (hover: none) and (pointer: coarse) {
          /* NUR MOBILE – Logo klar oberhalb der Social-Media-Kachel und etwas größer */
          .hero {
            height: 150px !important;
            min-height: 150px !important;
            max-height: 150px !important;
            margin: -8px 0 22px !important;
            align-items: flex-start !important;
          }

          .hero-art {
            width: 154px !important;
            min-width: 154px !important;
            max-width: 154px !important;
            margin: -14px auto 0 !important;
          }

          .hero-logo {
            width: 154px !important;
            min-width: 154px !important;
            max-width: 154px !important;
          }

          body:has(.mobile-page-home.mobile-page-active) .mobile-page-ai {
            margin-top: 0 !important;
          }

          .social-card {
            margin-top: 0 !important;
          }
        }

        @media (max-width: 390px) and (hover: none) and (pointer: coarse) {
          .hero {
            height: 140px !important;
            min-height: 140px !important;
            max-height: 140px !important;
            margin-bottom: 20px !important;
          }

          .hero-art,
          .hero-logo {
            width: 144px !important;
            min-width: 144px !important;
            max-width: 144px !important;
          }
        }


        @media (max-width: 760px) and (hover: none) and (pointer: coarse) {
          /* NUR MOBILE – Logo weiter nach oben und etwas größer,
             Social-Media-Kachel etwas nach unten */
          .hero {
            height: 156px !important;
            min-height: 156px !important;
            max-height: 156px !important;
            margin: -18px 0 30px !important;
          }

          .hero-art {
            width: 166px !important;
            min-width: 166px !important;
            max-width: 166px !important;
            margin: -24px auto 0 !important;
          }

          .hero-logo {
            width: 166px !important;
            min-width: 166px !important;
            max-width: 166px !important;
          }

          body:has(.mobile-page-home.mobile-page-active) .mobile-page-ai {
            margin-top: 14px !important;
          }

          .social-card {
            margin-top: 0 !important;
          }
        }

        @media (max-width: 390px) and (hover: none) and (pointer: coarse) {
          .hero {
            height: 146px !important;
            min-height: 146px !important;
            max-height: 146px !important;
            margin: -16px 0 26px !important;
          }

          .hero-art,
          .hero-logo {
            width: 154px !important;
            min-width: 154px !important;
            max-width: 154px !important;
          }

          body:has(.mobile-page-home.mobile-page-active) .mobile-page-ai {
            margin-top: 12px !important;
          }
        }


        @media (max-width: 760px) and (hover: none) and (pointer: coarse) {
          /* NUR MOBILE – mehr Glas + 3D für obere und untere App-Buttons */

          .header-actions .seller-action,
          .header-actions .buyer-action,
          .header-actions .cart {
            background:
              linear-gradient(
                145deg,
                rgba(255,255,255,.24) 0%,
                rgba(255,255,255,.10) 42%,
                rgba(255,255,255,.04) 100%
              ) !important;
            border: 1px solid rgba(255,255,255,.34) !important;
            backdrop-filter: blur(20px) saturate(1.18) !important;
            -webkit-backdrop-filter: blur(20px) saturate(1.18) !important;
            box-shadow:
              inset 0 1px 0 rgba(255,255,255,.46),
              inset 0 -1px 0 rgba(255,255,255,.10),
              0 8px 18px rgba(4,18,38,.14),
              0 2px 5px rgba(255,255,255,.08) !important;
          }

          .mobile-bottom-nav button {
            background:
              linear-gradient(
                145deg,
                rgba(255,255,255,.22) 0%,
                rgba(255,255,255,.09) 38%,
                rgba(198,31,43,.055) 38% 48%,
                rgba(255,196,0,.065) 48% 72%,
                rgba(198,31,43,.055) 72% 82%,
                rgba(255,255,255,.05) 82% 100%
              ) !important;
            border: 1px solid rgba(255,255,255,.36) !important;
            backdrop-filter: blur(20px) saturate(1.18) !important;
            -webkit-backdrop-filter: blur(20px) saturate(1.18) !important;
            box-shadow:
              inset 0 1px 0 rgba(255,255,255,.48),
              inset 0 -1px 0 rgba(255,255,255,.10),
              0 8px 18px rgba(4,18,38,.14),
              0 2px 5px rgba(255,255,255,.08) !important;
          }

          .mobile-bottom-nav .mobile-nav-active {
            background:
              linear-gradient(
                145deg,
                rgba(255,255,255,.28) 0%,
                rgba(255,255,255,.11) 34%,
                rgba(198,31,43,.085) 34% 47%,
                rgba(255,196,0,.095) 47% 73%,
                rgba(198,31,43,.085) 73% 86%,
                rgba(255,255,255,.06) 86% 100%
              ) !important;
            border-color: rgba(255,255,255,.46) !important;
            box-shadow:
              inset 0 1px 0 rgba(255,255,255,.58),
              inset 0 -1px 0 rgba(255,255,255,.12),
              0 10px 22px rgba(4,18,38,.16),
              0 2px 5px rgba(255,255,255,.10) !important;
          }
        }


        @media (max-width: 760px) and (hover: none) and (pointer: coarse) {
          /* Mobile-Kopf sauber: Marke + Sprachen oben, 3 App-Kacheln darunter */
          .header {
            display: grid !important;
            grid-template-columns: auto 1fr !important;
            grid-template-rows: auto auto !important;
            align-items: center !important;
            width: 100% !important;
            padding: 10px 10px 4px !important;
            column-gap: 10px !important;
            row-gap: 8px !important;
            box-sizing: border-box !important;
          }

          .brand-area {
            grid-column: 1 !important;
            grid-row: 1 !important;
            width: auto !important;
            min-width: 0 !important;
          }

          .header-right {
            display: contents !important;
          }

          .language-switch {
            grid-column: 2 !important;
            grid-row: 1 !important;
            justify-self: end !important;
            width: auto !important;
            margin: 0 !important;
          }

          .header-actions {
            grid-column: 1 / -1 !important;
            grid-row: 2 !important;
            display: grid !important;
            grid-template-columns: repeat(3, 64px) !important;
            justify-content: center !important;
            gap: 16px !important;
            width: 100% !important;
            margin: 0 !important;
          }

          .header-actions .seller-action,
          .header-actions .buyer-action,
          .header-actions .cart {
            width: 64px !important;
            min-width: 64px !important;
            max-width: 64px !important;
            height: 58px !important;
          }

          /* Logo klar oberhalb der Social-Media-Kachel */
          .hero {
            height: 170px !important;
            min-height: 170px !important;
            max-height: 170px !important;
            margin: -8px 0 26px !important;
          }

          .hero-art {
            width: 168px !important;
            min-width: 168px !important;
            max-width: 168px !important;
            margin: -20px auto 0 !important;
          }

          .hero-logo {
            width: 168px !important;
            min-width: 168px !important;
            max-width: 168px !important;
          }

          body:has(.mobile-page-home.mobile-page-active) .mobile-page-ai {
            margin-top: 10px !important;
          }
        }

        @media (max-width: 390px) and (hover: none) and (pointer: coarse) {
          .header-actions {
            grid-template-columns: repeat(3, 60px) !important;
            gap: 12px !important;
          }

          .header-actions .seller-action,
          .header-actions .buyer-action,
          .header-actions .cart {
            width: 60px !important;
            min-width: 60px !important;
            max-width: 60px !important;
            height: 56px !important;
          }

          .hero {
            height: 158px !important;
            min-height: 158px !important;
            max-height: 158px !important;
          }

          .hero-art,
          .hero-logo {
            width: 156px !important;
            min-width: 156px !important;
            max-width: 156px !important;
          }
        }


        @media (max-width: 760px) and (hover: none) and (pointer: coarse) {
          /* NUR MOBILE – Logo größer, Social-Kachel weiter nach unten */
          .hero {
            height: 186px !important;
            min-height: 186px !important;
            max-height: 186px !important;
            margin: -10px 0 34px !important;
          }

          .hero-art {
            width: 184px !important;
            min-width: 184px !important;
            max-width: 184px !important;
            margin: -24px auto 0 !important;
          }

          .hero-logo {
            width: 184px !important;
            min-width: 184px !important;
            max-width: 184px !important;
          }

          body:has(.mobile-page-home.mobile-page-active) .mobile-page-ai {
            margin-top: 22px !important;
          }
        }

        @media (max-width: 390px) and (hover: none) and (pointer: coarse) {
          .hero {
            height: 174px !important;
            min-height: 174px !important;
            max-height: 174px !important;
            margin-bottom: 30px !important;
          }

          .hero-art,
          .hero-logo {
            width: 172px !important;
            min-width: 172px !important;
            max-width: 172px !important;
          }

          body:has(.mobile-page-home.mobile-page-active) .mobile-page-ai {
            margin-top: 20px !important;
          }
        }


        @media (max-width: 760px) and (hover: none) and (pointer: coarse) {
          /* NUR MOBILE – mehr Abstand zwischen Logo und Social-Kachel */
          .hero {
            margin-bottom: 42px !important;
          }

          body:has(.mobile-page-home.mobile-page-active) .mobile-page-ai {
            margin-top: 26px !important;
          }

          /* Untere Navigation: dunkleres Glas, klarer 3D-Effekt, keine Spanien-Streifen */
          .mobile-bottom-nav {
            background: transparent !important;
            box-shadow: none !important;
            border: 0 !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
          }

          .mobile-bottom-nav button {
            background:
              linear-gradient(
                145deg,
                rgba(255,255,255,.16) 0%,
                rgba(255,255,255,.07) 35%,
                rgba(10,18,30,.26) 100%
              ) !important;
            border: 1px solid rgba(255,255,255,.30) !important;
            color: rgba(255,255,255,.90) !important;
            text-shadow: 0 1px 2px rgba(0,0,0,.26) !important;
            backdrop-filter: blur(22px) saturate(1.20) !important;
            -webkit-backdrop-filter: blur(22px) saturate(1.20) !important;
            box-shadow:
              inset 0 1px 0 rgba(255,255,255,.42),
              inset 0 -1px 0 rgba(255,255,255,.08),
              0 8px 18px rgba(3,12,24,.24),
              0 2px 4px rgba(255,255,255,.06) !important;
          }

          .mobile-bottom-nav .mobile-nav-active {
            background:
              linear-gradient(
                145deg,
                rgba(255,255,255,.24) 0%,
                rgba(255,255,255,.10) 34%,
                rgba(12,24,42,.34) 100%
              ) !important;
            border-color: rgba(255,255,255,.46) !important;
            box-shadow:
              inset 0 1px 0 rgba(255,255,255,.58),
              inset 0 -1px 0 rgba(255,255,255,.10),
              0 10px 22px rgba(3,12,24,.30),
              0 2px 5px rgba(255,255,255,.08) !important;
            transform: translateY(-1px) !important;
          }
        }

        @media (max-width: 390px) and (hover: none) and (pointer: coarse) {
          .hero {
            margin-bottom: 38px !important;
          }

          body:has(.mobile-page-home.mobile-page-active) .mobile-page-ai {
            margin-top: 24px !important;
          }
        }


        @media (max-width: 760px) and (hover: none) and (pointer: coarse) {
          /* NUR MOBILE – untere Buttons deutlich transparenteres Glas */
          .mobile-bottom-nav button {
            background:
              linear-gradient(
                145deg,
                rgba(255,255,255,.105) 0%,
                rgba(255,255,255,.035) 42%,
                rgba(10,18,30,.085) 100%
              ) !important;
            border: 1px solid rgba(255,255,255,.24) !important;
            color: rgba(255,255,255,.92) !important;
            backdrop-filter: blur(18px) saturate(1.10) !important;
            -webkit-backdrop-filter: blur(18px) saturate(1.10) !important;
            box-shadow:
              inset 0 1px 0 rgba(255,255,255,.34),
              inset 0 -1px 0 rgba(255,255,255,.045),
              0 7px 15px rgba(3,12,24,.12) !important;
          }

          .mobile-bottom-nav .mobile-nav-active {
            background:
              linear-gradient(
                145deg,
                rgba(255,255,255,.15) 0%,
                rgba(255,255,255,.05) 42%,
                rgba(10,18,30,.11) 100%
              ) !important;
            border-color: rgba(255,255,255,.34) !important;
            box-shadow:
              inset 0 1px 0 rgba(255,255,255,.44),
              inset 0 -1px 0 rgba(255,255,255,.055),
              0 8px 18px rgba(3,12,24,.15) !important;
          }
        }


        /* =========================================================
           PaseSpain MOBILE V2 — einzige Mobile-Oberfläche.
           Desktop bleibt unangetastet.
           ========================================================= */

        .psv2-app {
          display: none;
        }

        @media (max-width: 760px) and (hover: none) and (pointer: coarse) {
          /* Alte Mobile-/Desktop-Oberfläche vollständig ausblenden */
          .page-shell.glass-shell,
          .mobile-bottom-nav,
          .design-credit {
            display: none !important;
          }

          .page-shell.glass-shell.seller-modal-active {
            display: block !important;
            position: fixed !important;
            inset: 0 !important;
            z-index: 2147483000 !important;
            width: 100% !important;
            max-width: none !important;
            height: 100dvh !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            background: transparent !important;
          }

          .page-shell.glass-shell.seller-modal-active > *:not(.market-modal-backdrop) {
            display: none !important;
          }

          .page-shell.glass-shell.seller-modal-active > .market-modal-backdrop {
            display: flex !important;
          }

          .site {
            min-height: 100dvh !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: hidden !important;
            background: #050b12 !important;
          }

          .stadium-bg {
            display: none !important;
          }

          /* Variante 2 wird als komplette Mobile-App-Fläche verwendet */
          .psv2-app {
            position: fixed !important;
            inset: 0 !important;
            z-index: 9999 !important;
            display: block !important;
            width: 100vw !important;
            height: 100dvh !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            background: #050b12 !important;
          }

          .psv2-mobile-stage {
            position: absolute;
            pointer-events: none !important;
            inset: 0;
            width: 100%;
            height: 100%;
            background:
              #050b12
              url("/pasespain-mobile-bg.png")
              center center / cover
              no-repeat;
          }

          .psv2-mobile-language {
            position: absolute;
            z-index: 2147483002;
            pointer-events: auto !important;
            z-index: 10002;
            top: 16px;
            right: 18px;
            display: grid;
            grid-template-columns: repeat(4, 36px);
            gap: 6px;
            align-items: center;
            justify-content: center;
            padding: 6px 8px;
            border: 1px solid rgba(255,255,255,.55);
            border-radius: 21px;
            background: rgba(18,29,44,.30);
            box-shadow:
              inset 0 1px 0 rgba(255,255,255,.42),
              0 5px 16px rgba(0,0,0,.18);
            backdrop-filter: blur(14px) saturate(1.12);
            -webkit-backdrop-filter: blur(14px) saturate(1.12);
          }

          .psv2-mobile-language button {
            display: grid;
            place-items: center;
            width: 36px;
            height: 28px;
            padding: 0;
            border: 0;
            border-radius: 8px;
            background: transparent;
            cursor: pointer;
          }

          .psv2-flag {
            position: relative;
            display: block;
            width: 28px;
            height: 18px;
            overflow: hidden;
            border-radius: 5px;
            box-shadow:
              inset 0 0 0 1px rgba(255,255,255,.25),
              0 1px 3px rgba(0,0,0,.28);
          }

          .psv2-flag-es {
            background:
              linear-gradient(
                to bottom,
                #aa151b 0 25%,
                #f1bf00 25% 75%,
                #aa151b 75% 100%
              );
          }

          .psv2-flag-ca {
            background:
              repeating-linear-gradient(
                to bottom,
                #f7c800 0 2px,
                #d71f26 2px 4px
              );
          }

          .psv2-flag-de {
            background:
              linear-gradient(
                to bottom,
                #000 0 33.33%,
                #dd0000 33.33% 66.66%,
                #ffce00 66.66% 100%
              );
          }

          .psv2-flag-gb-svg {
            display: block;
            width: 28px;
            height: 18px;
            border-radius: 5px;
            overflow: hidden;
            box-shadow:
              inset 0 0 0 1px rgba(255,255,255,.25),
              0 1px 3px rgba(0,0,0,.28);
          }

          .psv2-flag-gb::before {
            background:
              linear-gradient(33deg, transparent 42%, #fff 42% 48%, #c8102e 48% 52%, #fff 52% 58%, transparent 58%),
              linear-gradient(-33deg, transparent 42%, #fff 42% 48%, #c8102e 48% 52%, #fff 52% 58%, transparent 58%);
          }

          .psv2-flag-gb::after {
            background:
              linear-gradient(to right, transparent 39%, #fff 39% 61%, transparent 61%),
              linear-gradient(to bottom, transparent 34%, #fff 34% 66%, transparent 66%),
              linear-gradient(to right, transparent 44%, #c8102e 44% 56%, transparent 56%),
              linear-gradient(to bottom, transparent 41%, #c8102e 41% 59%, transparent 59%);
          }

          .psv2-mobile-logo {
            position: absolute;
            pointer-events: none !important;
            z-index: 10001;
            top: 86px;
            left: 50%;
            transform: translateX(-50%);
            width: min(58vw, 240px);
            height: auto;
            object-fit: contain;
            pointer-events: none;
          }

          .psv2-mobile-subtitle {
            position: absolute;
            pointer-events: none !important;
            z-index: 10001;
            top: 300px;
            left: 50%;
            transform: translateX(-50%);
            width: 88%;
            text-align: center;
            font-family: "Inter", "Segoe UI", Arial, sans-serif;
            font-size: 17px;
            line-height: 1.15;
            font-weight: 760;
            letter-spacing: .35px;
            background: linear-gradient(
              90deg,
              #0b2a63 0%,
              #1c79d8 42%,
              #29b9d2 72%,
              #18b7a0 100%
            );
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            -webkit-text-fill-color: transparent;
            text-shadow:
              0 0 7px rgba(41,185,210,.16);
            pointer-events: none;
          }

          .psv2-more-page {
            position: absolute;
            pointer-events: auto;
            z-index: 10001;
            top: 286px;
            left: 14px;
            right: 14px;
            bottom: 158px;
            overflow-x: hidden;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }

          .psv2-more-page::-webkit-scrollbar {
            display: none;
          }

          .psv2-more-glass {
            position: relative;
            width: 100%;
            padding: 16px 14px 14px;
            overflow: hidden;
            border: 1.4px solid rgba(255,255,255,.72);
            border-radius: 26px;
            background:
              linear-gradient(
                180deg,
                rgba(255,255,255,.12) 0%,
                rgba(255,255,255,.045) 48%,
                rgba(255,255,255,.018) 100%
              );
            box-shadow:
              inset 0 1.5px 0 rgba(255,255,255,.88),
              inset 1px 0 0 rgba(255,255,255,.18),
              inset -1px 0 0 rgba(255,255,255,.10),
              inset 0 -2px 4px rgba(0,0,0,.08),
              0 10px 22px rgba(0,0,0,.16);
            backdrop-filter: blur(10px) saturate(1.18);
            -webkit-backdrop-filter: blur(10px) saturate(1.18);
          }

          .psv2-more-glass::before {
            content: "";
            position: absolute;
            top: 5px;
            left: 6%;
            right: 6%;
            height: 34%;
            border-radius: 20px 20px 14px 14px;
            background:
              linear-gradient(
                180deg,
                rgba(255,255,255,.24) 0%,
                rgba(255,255,255,.06) 72%,
                rgba(255,255,255,0) 100%
              );
            pointer-events: none;
          }

          .psv2-more-head,
          .psv2-social-grid,
          .psv2-spoken-languages {
            position: relative;
            z-index: 1;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            margin-top: 16px;
            padding: 12px 0 2px;
            border-top: 1px solid rgba(255,255,255,.16);
          }

          .psv2-spoken-languages strong {
            color: rgba(255,255,255,.90);
            font-family: "Inter", "Segoe UI", Arial, sans-serif;
            font-size: 12px;
            font-weight: 750;
            white-space: nowrap;
          }

          .psv2-spoken-flags {
            display: flex;
            align-items: center;
            gap: 7px;
            flex-wrap: nowrap;
          }

          .psv2-spoken-flag {
            display: block;
            width: 28px;
            height: 18px;
            overflow: hidden;
            border-radius: 5px;
            box-shadow:
              inset 0 0 0 1px rgba(255,255,255,.25),
              0 1px 3px rgba(0,0,0,.24);
          }

          .psv2-spoken-flag.flag-es {
            background:
              linear-gradient(
                to bottom,
                #aa151b 0 25%,
                #f1bf00 25% 75%,
                #aa151b 75% 100%
              );
          }

          .psv2-spoken-flag.flag-fr {
            background:
              linear-gradient(
                to right,
                #0055a4 0 33.33%,
                #ffffff 33.33% 66.66%,
                #ef4135 66.66% 100%
              );
          }

          .psv2-spoken-flag.flag-it {
            background:
              linear-gradient(
                to right,
                #009246 0 33.33%,
                #ffffff 33.33% 66.66%,
                #ce2b37 66.66% 100%
              );
          }

          .psv2-spoken-flag.flag-de {
            background:
              linear-gradient(
                to bottom,
                #000000 0 33.33%,
                #dd0000 33.33% 66.66%,
                #ffce00 66.66% 100%
              );
          }

          .psv2-spoken-flag-gb-svg {
            display: block;
            width: 28px;
            height: 18px;
            flex: 0 0 28px;
            border-radius: 5px;
            overflow: hidden;
            box-shadow:
              inset 0 0 0 1px rgba(255,255,255,.25),
              0 1px 3px rgba(0,0,0,.24);
          }

          .psv2-legal-links {
            position: relative;
            z-index: 1;
          }

          .psv2-more-head {
            display: flex;
            align-items: center;
            gap: 12px;
            color: #fff;
          }

          .psv2-more-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 5px;
            flex: 0 0 46px;
            width: 46px;
            height: 46px;
            border: 1px solid rgba(255,255,255,.55);
            border-radius: 15px;
            background: rgba(255,255,255,.07);
            color: #c46cff;
            box-shadow:
              inset 0 1px 0 rgba(255,255,255,.55),
              0 5px 12px rgba(0,0,0,.12);
          }

          .psv2-more-icon i {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: currentColor;
            box-shadow: 0 0 7px currentColor;
          }

          .psv2-more-head > div {
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .psv2-more-head strong {
            font-family: "Inter", "Segoe UI", Arial, sans-serif;
            font-size: 19px;
            line-height: 1.05;
            font-weight: 800;
          }

          .psv2-more-head small {
            font-family: "Inter", "Segoe UI", Arial, sans-serif;
            font-size: 12px;
            line-height: 1.3;
            color: rgba(255,255,255,.82);
          }

          .psv2-social-grid {
            display: grid;
            grid-template-columns: repeat(6, minmax(0, 1fr));
            gap: 8px;
            margin-top: 16px;
          }

          .psv2-social-card {
            position: relative;
            z-index: 5;
            pointer-events: auto;
            cursor: pointer;
            display: flex;
            min-width: 0;
            height: 76px;
            padding: 9px 4px 8px;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 6px;
            border: 1px solid rgba(255,255,255,.48);
            border-radius: 17px;
            background: rgba(255,255,255,.055);
            color: #fff;
            text-decoration: none;
            box-shadow:
              inset 0 1px 0 rgba(255,255,255,.48),
              0 5px 12px rgba(0,0,0,.11);
            backdrop-filter: blur(9px);
            -webkit-backdrop-filter: blur(9px);
          }

          .psv2-social-card > span {
            display: grid;
            place-items: center;
            width: 32px;
            height: 32px;
            border-radius: 11px;
            font-size: 20px;
            line-height: 1;
            font-weight: 900;
            background: rgba(255,255,255,.06);
            box-shadow: inset 0 1px 0 rgba(255,255,255,.28);
          }

          .psv2-social-card small {
            max-width: 100%;
            overflow: hidden;
            font-size: 8px;
            line-height: 1;
            text-overflow: ellipsis;
            white-space: nowrap;
            color: rgba(255,255,255,.88);
          }

          .psv2-social-card.facebook > span {
            color: #4da3ff;
          }

          .psv2-social-card.instagram > span {
            color: #ff6ca8;
          }

          .psv2-social-card.tiktok > span {
            color: #ffffff;
          }

          .psv2-social-card.threads > span {
            color: #ffffff;
          }

          .psv2-social-card.whatsapp > span {
            color: #55e58a;
          }


          button.psv2-social-card {
            appearance: none;
            -webkit-appearance: none;
            font: inherit;
          }

          .psv2-social-card.ai > span {
            color: #8ddcff;
            background: linear-gradient(145deg, rgba(60,126,255,.24), rgba(38,207,192,.18));
          }

          .psv2-whatsapp-handset svg {
            width: 21px;
            height: 21px;
            fill: currentColor;
            stroke: none;
          }

          .psv2-legal-links {
            display: flex;
            align-items: center;
            justify-content: center;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 14px;
            padding-top: 12px;
            border-top: 1px solid rgba(255,255,255,.16);
            font-family: "Inter", "Segoe UI", Arial, sans-serif;
            font-size: 12px;
            font-weight: 650;
          }

          .psv2-legal-links a,
          .psv2-legal-links span {
            color: rgba(255,255,255,.76);
            text-decoration: none;
          }

          .psv2-seller-page {
            position: absolute;
            pointer-events: auto;
            z-index: 10001;
            top: 286px;
            left: 14px;
            right: 14px;
            bottom: 158px;
            display: flex;
            align-items: flex-start;
            justify-content: center;
          }

          .psv2-seller-glass {
            position: relative;
            width: 100%;
            padding: 16px 14px 15px;
            overflow: hidden;
            border: 1.4px solid rgba(255,255,255,.72);
            border-radius: 26px;
            background:
              linear-gradient(
                180deg,
                rgba(255,255,255,.12) 0%,
                rgba(255,255,255,.045) 48%,
                rgba(255,255,255,.018) 100%
              );
            box-shadow:
              inset 0 1.5px 0 rgba(255,255,255,.88),
              inset 1px 0 0 rgba(255,255,255,.18),
              inset -1px 0 0 rgba(255,255,255,.10),
              inset 0 -2px 4px rgba(0,0,0,.08),
              0 10px 22px rgba(0,0,0,.16);
            backdrop-filter: blur(10px) saturate(1.18);
            -webkit-backdrop-filter: blur(10px) saturate(1.18);
          }

          .psv2-seller-glass::before {
            content: "";
            position: absolute;
            top: 5px;
            left: 6%;
            right: 6%;
            height: 42%;
            border-radius: 20px 20px 14px 14px;
            background:
              linear-gradient(
                180deg,
                rgba(255,255,255,.24) 0%,
                rgba(255,255,255,.06) 72%,
                rgba(255,255,255,0) 100%
              );
            pointer-events: none;
          }

          .psv2-seller-head,
          .psv2-seller-login-button {
            position: relative;
            z-index: 1;
          }

          .psv2-seller-head {
            display: flex;
            align-items: center;
            gap: 12px;
            color: #fff;
          }

          .psv2-seller-icon {
            display: grid;
            place-items: center;
            flex: 0 0 46px;
            width: 46px;
            height: 46px;
            border: 1px solid rgba(255,255,255,.55);
            border-radius: 15px;
            background: rgba(255,255,255,.07);
            color: #82e354;
            box-shadow:
              inset 0 1px 0 rgba(255,255,255,.55),
              0 5px 12px rgba(0,0,0,.12);
          }

          .psv2-seller-icon svg {
            width: 27px;
            height: 27px;
            fill: none;
            stroke: currentColor;
            stroke-width: 2.2;
            stroke-linecap: round;
            stroke-linejoin: round;
          }

          .psv2-seller-head > div {
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .psv2-seller-head strong {
            font-family: "Inter", "Segoe UI", Arial, sans-serif;
            font-size: 19px;
            line-height: 1.05;
            font-weight: 800;
          }

          .psv2-seller-head small {
            font-family: "Inter", "Segoe UI", Arial, sans-serif;
            font-size: 10px;
            line-height: 1.25;
            color: rgba(255,255,255,.74);
          }

          .psv2-seller-actions {
            position: relative;
            z-index: 1;
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px;
            margin-top: 12px;
          }

          .psv2-seller-actions button {
            height: 40px;
            padding: 0 8px;
            border: 1px solid rgba(255,255,255,.48);
            border-radius: 14px;
            background: rgba(255,255,255,.055);
            color: #fff;
            font-family: "Inter", "Segoe UI", Arial, sans-serif;
            font-size: 11px;
            font-weight: 750;
            box-shadow:
              inset 0 1px 0 rgba(255,255,255,.48),
              0 5px 12px rgba(0,0,0,.11);
            backdrop-filter: blur(9px);
            -webkit-backdrop-filter: blur(9px);
            cursor: pointer;
          }

          .psv2-ticket-page {
            position: absolute;
            pointer-events: auto;
            z-index: 10001;
            top: 286px;
            left: 14px;
            right: 14px;
            bottom: 158px;
            overflow-x: hidden;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }

          .psv2-ticket-page::-webkit-scrollbar {
            display: none;
          }

          .psv2-ticket-glass,
          .psv2-ticket-results {
            border: 1.4px solid rgba(255,255,255,.72);
            border-radius: 26px;
            background:
              linear-gradient(
                180deg,
                rgba(255,255,255,.12) 0%,
                rgba(255,255,255,.045) 48%,
                rgba(255,255,255,.018) 100%
              );
            box-shadow:
              inset 0 1.5px 0 rgba(255,255,255,.88),
              inset 1px 0 0 rgba(255,255,255,.18),
              inset -1px 0 0 rgba(255,255,255,.10),
              inset 0 -2px 4px rgba(0,0,0,.08),
              0 10px 22px rgba(0,0,0,.16);
            backdrop-filter: blur(10px) saturate(1.18);
            -webkit-backdrop-filter: blur(10px) saturate(1.18);
          }

          .psv2-ticket-glass {
            position: relative;
            padding: 15px 14px 14px;
            overflow: hidden;
          }

          .psv2-ticket-glass::before {
            content: "";
            position: absolute;
            top: 5px;
            left: 6%;
            right: 6%;
            height: 34%;
            border-radius: 20px 20px 14px 14px;
            background:
              linear-gradient(
                180deg,
                rgba(255,255,255,.24) 0%,
                rgba(255,255,255,.06) 72%,
                rgba(255,255,255,0) 100%
              );
            pointer-events: none;
          }

          .psv2-ticket-head,
          .psv2-ticket-search,
          .psv2-buyer-actions {
            position: relative;
            z-index: 1;
          }

          .psv2-ticket-head {
            display: flex;
            align-items: center;
            gap: 11px;
            margin-bottom: 14px;
            color: #fff;
          }

          .psv2-ticket-ai-icon {
            display: grid;
            place-items: center;
            flex: 0 0 40px;
            width: 40px;
            height: 40px;
            border: 1px solid rgba(255,255,255,.55);
            border-radius: 14px;
            background: rgba(255,255,255,.07);
            color: #43a9ff;
            font-size: 23px;
            box-shadow:
              inset 0 1px 0 rgba(255,255,255,.55),
              0 5px 12px rgba(0,0,0,.12);
          }

          .psv2-ticket-head > div {
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .psv2-ticket-head strong {
            font-family: "Inter", "Segoe UI", Arial, sans-serif;
            font-size: 18px;
            line-height: 1.05;
            font-weight: 800;
          }

          .psv2-ticket-head small {
            font-family: "Inter", "Segoe UI", Arial, sans-serif;
            font-size: 10px;
            line-height: 1.2;
            color: rgba(255,255,255,.74);
          }

          .psv2-ticket-search {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 48px;
            gap: 8px;
          }

          .psv2-ticket-search input {
            min-width: 0;
            height: 48px;
            padding: 0 13px;
            border: 1px solid rgba(255,255,255,.42);
            border-radius: 16px;
            outline: 0;
            background: rgba(255,255,255,.055);
            color: #fff;
            font-family: "Inter", "Segoe UI", Arial, sans-serif;
            font-size: 12px;
            box-shadow: inset 0 1px 0 rgba(255,255,255,.24);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
          }

          .psv2-ticket-search input::placeholder {
            color: rgba(255,255,255,.62);
          }

          .psv2-ticket-search-button {
            display: grid;
            place-items: center;
            width: 48px;
            height: 48px;
            padding: 0;
            border: 1px solid rgba(255,255,255,.58);
            border-radius: 16px;
            background: rgba(255,255,255,.07);
            color: #43a9ff;
            box-shadow:
              inset 0 1px 0 rgba(255,255,255,.58),
              0 6px 14px rgba(0,0,0,.14);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
          }

          .psv2-ticket-page button,
          .psv2-ticket-page input,
          .psv2-ticket-page textarea,
          .psv2-seller-page button,
          .psv2-more-page a,
          .psv2-mobile-language button {
            position: relative;
            z-index: 5;
            pointer-events: auto !important;
            touch-action: manipulation;
          }

          .psv2-ticket-search-button svg {
            width: 22px;
            height: 22px;
            fill: none;
            stroke: currentColor;
            stroke-width: 2;
            stroke-linecap: round;
          }

          .psv2-buyer-actions {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px;
            margin-top: 12px;
          }

          .psv2-buyer-actions button {
            height: 40px;
            padding: 0 8px;
            border: 1px solid rgba(255,255,255,.48);
            border-radius: 14px;
            background: rgba(255,255,255,.055);
            color: #fff;
            font-family: "Inter", "Segoe UI", Arial, sans-serif;
            font-size: 11px;
            font-weight: 750;
            box-shadow:
              inset 0 1px 0 rgba(255,255,255,.48),
              0 5px 12px rgba(0,0,0,.11);
            backdrop-filter: blur(9px);
            -webkit-backdrop-filter: blur(9px);
          }

          .psv2-ticket-results {
            display: grid;
            gap: 12px;
            margin-top: 10px;
            padding: 10px;
          }

          .psv2-ticket-result {
            position: relative;
            display: block;
            padding: 0;
            border: 0;
            border-radius: 18px;
            background: transparent;
            cursor: pointer;
            touch-action: manipulation;
            transition: transform .18s ease, filter .18s ease;
          }

          .psv2-ticket-result:hover {
            transform: translateY(-2px);
            filter: drop-shadow(0 10px 14px rgba(0,0,0,.16));
          }

          .psv2-real-ticket {
            position: relative;
            display: grid;
            grid-template-columns: minmax(0,1fr) 82px;
            min-height: 205px;
            overflow: hidden;
            border: 1px solid rgba(255,255,255,.82);
            border-radius: 18px;
            background: linear-gradient(145deg, rgba(255,255,255,.94), rgba(239,247,255,.84));
            color: #071633;
            box-shadow: inset 0 1px 0 rgba(255,255,255,.98), 0 8px 20px rgba(0,0,0,.15);
            backdrop-filter: blur(14px) saturate(1.12);
            -webkit-backdrop-filter: blur(14px) saturate(1.12);
          }

          .psv2-real-ticket::before,
          .psv2-real-ticket::after {
            content: "";
            position: absolute;
            z-index: 4;
            right: 70px;
            width: 22px;
            height: 22px;
            border-radius: 50%;
            background: rgba(15,32,55,.92);
            pointer-events: none;
          }
          .psv2-real-ticket::before { top: -11px; }
          .psv2-real-ticket::after { bottom: -11px; }

          .psv2-real-ticket-body {
            min-width: 0;
            padding: 14px 12px 12px;
          }

          .psv2-ticket-match {
            display: grid;
            grid-template-columns: minmax(0,1fr) 26px minmax(0,1fr);
            align-items: center;
            gap: 6px;
          }

          .psv2-ticket-team {
            min-width: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 5px;
            text-align: center;
          }

          .psv2-ticket-team img,
          .psv2-ticket-badge-fallback {
            width: 42px;
            height: 42px;
            object-fit: contain;
          }

          .psv2-ticket-team strong {
            width: 100%;
            overflow: hidden;
            color: #071633;
            font-size: 10px;
            line-height: 1.15;
            font-weight: 850;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .psv2-ticket-vs {
            margin: 0 !important;
            color: rgba(7,22,51,.48) !important;
            font-size: 10px !important;
            font-weight: 900;
            text-align: center;
          }

          .psv2-ticket-competition {
            margin-top: 9px;
            color: #1768ff;
            font-size: 8px;
            font-weight: 900;
            letter-spacing: .08em;
            text-align: center;
            text-transform: uppercase;
          }

          .psv2-ticket-date {
            margin-top: 5px;
            color: #071633;
            font-size: 10px;
            font-weight: 850;
            text-align: center;
          }

          .psv2-ticket-stadium {
            margin-top: 3px;
            overflow: hidden;
            color: rgba(7,22,51,.62);
            font-size: 8px;
            text-align: center;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .psv2-ticket-facts-grid {
            display: grid;
            grid-template-columns: repeat(3,minmax(0,1fr));
            gap: 7px;
            margin-top: 12px;
            padding-top: 9px;
            border-top: 1px solid rgba(7,22,51,.10);
          }

          .psv2-ticket-facts-grid div { min-width: 0; }
          .psv2-ticket-facts-grid span {
            display: block;
            margin: 0;
            color: rgba(7,22,51,.46);
            font-size: 6.5px;
            font-weight: 900;
            letter-spacing: .06em;
          }
          .psv2-ticket-facts-grid b {
            display: block;
            margin-top: 2px;
            overflow: hidden;
            color: #071633;
            font-size: 8.5px;
            line-height: 1.15;
            font-weight: 820;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .psv2-ticket-detail-hint {
            display: inline-flex;
            width: fit-content;
            margin-top: 10px !important;
            color: rgba(7,22,51,.62) !important;
            font-size: 8px !important;
            line-height: 1.2 !important;
            font-weight: 800 !important;
          }

          .psv2-ticket-stub {
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            padding: 13px 8px 12px;
            border-left: 1px dashed rgba(7,22,51,.28);
            background: linear-gradient(180deg, rgba(23,104,255,.08), rgba(25,190,142,.08));
          }

          .psv2-ticket-stub-brand {
            margin: 0 !important;
            color: #1768ff !important;
            font-size: 8px !important;
            font-weight: 950;
            letter-spacing: .08em;
            writing-mode: vertical-rl;
            transform: rotate(180deg);
          }

          .psv2-ticket-barcode {
            display: flex;
            align-items: stretch;
            justify-content: center;
            gap: 1px;
            width: 46px;
            height: 66px;
            overflow: hidden;
          }
          .psv2-ticket-barcode i {
            display: block;
            width: 1px;
            background: #071633;
          }
          .psv2-ticket-barcode i:nth-child(3n) { width: 2px; }
          .psv2-ticket-barcode i:nth-child(4n) { opacity: .42; }

          .psv2-ticket-stub strong {
            color: #071633;
            font-size: 13px;
            font-weight: 950;
            white-space: nowrap;
          }

          .psv2-ticket-result-expanded .psv2-real-ticket {
            box-shadow: inset 0 1px 0 rgba(255,255,255,.98), 0 10px 24px rgba(0,0,0,.20);
          }

          .psv2-ticket-expanded {
            display: grid;
            gap: 6px;
            width: calc(100% - 10px);
            margin: 7px auto 0;
            padding: 10px;
            border: 1px solid rgba(255,255,255,.24);
            border-radius: 0 0 14px 14px;
            background: rgba(5,15,28,.34);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
          }

          .psv2-ticket-expanded div {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            color: rgba(255,255,255,.76);
            font-size: 10px;
            line-height: 1.2;
          }
          .psv2-ticket-expanded b {
            color: #fff;
            text-align: right;
            font-weight: 780;
          }

          .psv2-ticket-buy-button {
            width: 100%;
            min-height: 42px;
            margin-top: 4px;
            border: 1px solid rgba(255,255,255,.62);
            border-radius: 12px;
            background: linear-gradient(135deg, rgba(23,104,255,.88), rgba(25,190,142,.78));
            color: #fff;
            font-size: 11px;
            font-weight: 900;
            letter-spacing: .03em;
          }

          .psv2-mobile-nav {
            position: absolute;
            z-index: 2147483000;
            pointer-events: auto !important;
            touch-action: manipulation;
            left: 12px;
            right: 12px;
            bottom: 18px;
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 8px;
          }

          .psv2-mobile-nav button {
            position: relative;
            z-index: 2147483001;
            pointer-events: auto !important;
            touch-action: manipulation;
            cursor: pointer;
            display: flex;
            min-width: 0;
            height: 112px;
            padding: 15px 4px 12px;
            overflow: hidden;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            gap: 9px;
            border: 1.4px solid rgba(255,255,255,.72);
            border-radius: 25px;
            background:
              linear-gradient(
                180deg,
                rgba(255,255,255,.12) 0%,
                rgba(255,255,255,.045) 46%,
                rgba(255,255,255,.018) 100%
              );
            color: #fff;
            font-family: "Inter", "Segoe UI", Arial, sans-serif;
            box-shadow:
              inset 0 1.5px 0 rgba(255,255,255,.88),
              inset 1px 0 0 rgba(255,255,255,.20),
              inset -1px 0 0 rgba(255,255,255,.12),
              inset 0 -2px 4px rgba(0,0,0,.08),
              0 10px 22px rgba(0,0,0,.16);
            backdrop-filter: blur(9px) saturate(1.18);
            -webkit-backdrop-filter: blur(9px) saturate(1.18);
            cursor: pointer;
          }

          .psv2-mobile-nav button::before {
            content: "";
            position: absolute;
            z-index: 0;
            top: 5px;
            left: 9%;
            right: 9%;
            height: 36%;
            border-radius: 20px 20px 13px 13px;
            background:
              linear-gradient(
                180deg,
                rgba(255,255,255,.24) 0%,
                rgba(255,255,255,.075) 72%,
                rgba(255,255,255,0) 100%
              );
            pointer-events: none;
          }

          .psv2-mobile-nav-icon,
          .psv2-mobile-nav-text,
          .psv2-mobile-nav-line {
            position: relative;
            z-index: 1;
          }

          .psv2-mobile-nav-icon {
            display: grid;
            place-items: center;
            width: 38px;
            height: 38px;
            margin-top: 1px;
          }

          .psv2-mobile-nav-icon svg {
            width: 34px;
            height: 34px;
            fill: none;
            stroke: currentColor;
            stroke-width: 2.2;
            stroke-linecap: round;
            stroke-linejoin: round;
            filter: drop-shadow(0 2px 5px currentColor);
          }

          .psv2-mobile-nav-text {
            margin-top: 1px;
            font-size: 11px;
            line-height: 1;
            font-weight: 800;
            text-align: center;
            white-space: nowrap;
            text-shadow: 0 1px 3px rgba(0,0,0,.55);
          }

          .psv2-mobile-nav-line {
            position: absolute;
            left: 32%;
            right: 32%;
            bottom: 8px;
            height: 3px;
            border-radius: 10px;
            background: currentColor;
            box-shadow: 0 0 7px currentColor;
            opacity: .95;
          }

          .psv2-mobile-nav .nav-home {
            color: #43a9ff;
          }

          .psv2-mobile-nav .nav-tickets {
            color: #ffd34a;
          }

          .psv2-mobile-nav .nav-sell {
            color: #82e354;
          }

          .psv2-mobile-nav .nav-more {
            color: #c46cff;
          }

          .psv2-mobile-nav .psv2-mobile-nav-text {
            color: #fff;
          }

          .psv2-mobile-nav-more {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 5px;
          }

          .psv2-mobile-nav-more i {
            display: block;
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: currentColor;
            box-shadow: 0 0 7px currentColor;
          }

          .psv2-mobile-nav button.is-active {
            border-color: rgba(255,255,255,.90);
            box-shadow:
              inset 0 1.5px 0 rgba(255,255,255,.95),
              inset 0 0 18px rgba(255,255,255,.06),
              0 12px 24px rgba(0,0,0,.18),
              0 0 12px color-mix(in srgb, currentColor 35%, transparent);
          }

          .psv2-mobile-nav button:active {
            transform: translateY(1px) scale(.985);
          }

          .psv2-nav,
          .psv2-language-hit,
          .psv2-overlay-panel,
          .psv2-home-subtitle {
            display: none !important;
          }

          /* Navigation: unsichtbare Hit-Areas über den vier bereits im Bild vorhandenen Kacheln */
          .psv2-nav {
            position: absolute;
            z-index: 10003;
            left: 4.0%;
            right: 4.0%;
            bottom: 5.1%;
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 2.1%;
            height: 15.3%;
            margin: 0;
            padding: 0;
          }

          .psv2-nav button {
            position: relative;
            width: 100%;
            height: 100%;
            padding: 0;
            border: 0;
            border-radius: 24px;
            background: transparent;
          }

          .psv2-nav-label {
            position: absolute;
            left: 4%;
            right: 4%;
            bottom: 3.5%;
            z-index: 3;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 27px;
            padding: 0 2px;
            border: 0;
            background: transparent;
            color: #fff;
            font-size: 11px;
            line-height: 1;
            font-weight: 800;
            text-align: center;
            white-space: nowrap;
            text-shadow: 0 1px 3px rgba(0,0,0,.8);
            box-shadow: none;
            backdrop-filter: none;
            -webkit-backdrop-filter: none;
            pointer-events: none;
          }

          .psv2-nav-label::before {
            content: "";
            position: absolute;
            z-index: -1;
            left: -2px;
            right: -2px;
            top: 2px;
            bottom: 2px;
            border-radius: 8px;
            background: rgba(255,255,255,.08);
            border: 0;
            box-shadow: none;
            backdrop-filter: blur(14px) saturate(1.15);
            -webkit-backdrop-filter: blur(14px) saturate(1.15);
          }

          .psv2-nav button.is-active {
            box-shadow: none;
          }

          /* Tickets / Verkaufen / Mehr: Glas-Panels auf derselben V2-Hintergrundwelt */
          .psv2-overlay-panel {
            position: absolute;
            z-index: 10001;
            top: 17%;
            left: 6%;
            right: 6%;
            max-height: 60%;
            overflow: auto;
            padding: 18px;
            border: 1px solid rgba(255,255,255,.34);
            border-radius: 24px;
            background: rgba(255,255,255,.01);
            color: #fff;
            box-shadow:
              inset 0 1px 0 rgba(255,255,255,.34),
              inset 0 -1px 0 rgba(255,255,255,.04),
              0 12px 24px rgba(0,0,0,.14);
            backdrop-filter: blur(8px) saturate(1.05);
            -webkit-backdrop-filter: blur(8px) saturate(1.05);
          }

          .psv2-overlay-head {
            display: flex;
            flex-direction: column;
            margin-bottom: 14px;
            text-shadow: 0 2px 9px rgba(0,0,0,.45);
          }

          .psv2-overlay-head strong {
            font-size: 24px;
            line-height: 1;
            font-weight: 900;
          }

          .psv2-overlay-head span {
            margin-top: 5px;
            font-size: 11px;
            color: rgba(255,255,255,.82);
          }

          .psv2-search {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 48px;
            gap: 8px;
          }

          .psv2-search input {
            min-width: 0;
            height: 46px;
            padding: 0 12px;
            border: 1px solid rgba(255,255,255,.28);
            border-radius: 15px;
            outline: 0;
            background: rgba(255,255,255,.09);
            color: #fff;
            font: inherit;
            font-size: 12px;
          }

          .psv2-search input::placeholder {
            color: rgba(255,255,255,.66);
          }

          .psv2-search button,
          .psv2-offer button,
          .psv2-primary,
          .psv2-social-row button,
          .psv2-social-row a {
            border: 1px solid rgba(255,255,255,.34);
            background: rgba(255,255,255,.10);
            color: #fff;
            box-shadow:
              inset 0 1px 0 rgba(255,255,255,.40),
              0 8px 18px rgba(0,0,0,.14);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
          }

          .psv2-search button {
            width: 48px;
            height: 46px;
            border-radius: 15px;
            font-weight: 900;
          }

          .psv2-offers {
            display: grid;
            gap: 9px;
            margin-top: 12px;
          }

          .psv2-offer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            padding: 12px;
            border: 1px solid rgba(255,255,255,.25);
            border-radius: 17px;
            background: rgba(255,255,255,.075);
          }

          .psv2-offer > div {
            display: flex;
            min-width: 0;
            flex-direction: column;
          }

          .psv2-offer strong {
            overflow: hidden;
            font-size: 12px;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .psv2-offer span,
          .psv2-offer small {
            margin-top: 3px;
            font-size: 9.5px;
            color: rgba(255,255,255,.76);
          }

          .psv2-offer button {
            flex: 0 0 auto;
            min-width: 64px;
            height: 38px;
            border-radius: 13px;
            font-weight: 900;
          }

          .psv2-overlay-center {
            text-align: center;
          }

          .psv2-primary {
            width: 100%;
            min-height: 56px;
            border-radius: 18px;
            font-weight: 900;
          }

          .psv2-buyer-login {
            margin-top: 12px;
            margin-bottom: 12px;
          }

          .psv2-social {
            text-align: center;
          }

          .psv2-social-row {
            display: grid;
            grid-template-columns: repeat(5, 44px);
            justify-content: center;
            gap: 7px;
            margin: 15px 0 12px;
          }

          .psv2-social-row button {
            display: grid;
            place-items: center;
            width: 44px;
            height: 44px;
            padding: 0;
            border-radius: 14px;
            font-size: 18px;
            font-weight: 900;
          }

          .psv2-social-row button svg,
          .psv2-social-row a svg {
            width: 23px;
            height: 23px;
            display: block;
          }

          .psv2-social-row a {
            text-decoration: none;
            cursor: pointer;
          }

          .psv2-social-facebook svg,
          .psv2-social-tiktok svg,
          .psv2-social-threads svg,
          .psv2-social-whatsapp svg {
            fill: currentColor;
            stroke: none;
          }

          .psv2-social-instagram svg {
            fill: none;
            stroke: currentColor;
            stroke-width: 1.8;
          }

          .psv2-social-facebook {
            color: #1877f2 !important;
          }

          .psv2-social-instagram {
            color: #e4405f !important;
          }

          .psv2-social-tiktok {
            color: #ffffff !important;
          }

          .psv2-social-threads {
            color: #ffffff !important;
          }

          .psv2-social-whatsapp {
            color: #25d366 !important;
          }

          .psv2-domain {
            display: block;
            font-size: 13px;
            font-weight: 850;
            color: rgba(255,255,255,.90);
          }

          .market-modal-backdrop {
            z-index: 12000 !important;
          }
        }


        /* =========================================================
           FINAL RESPONSIVE MOBILE LAYOUT
           - keine festen Seitenhoehen
           - Inhalt bleibt immer oberhalb der Bottom-Navigation
           - kurze und hohe Handys passen sich automatisch an
           ========================================================= */
        @media (max-width: 760px) and (hover: none) and (pointer: coarse) {
          .psv2-app {
            --safe-top: env(safe-area-inset-top, 0px);
            --safe-bottom: env(safe-area-inset-bottom, 0px);
            --nav-bottom: max(10px, var(--safe-bottom));
            --nav-height: clamp(82px, 13.5dvh, 106px);
            --content-top: clamp(210px, 32dvh, 282px);
          }

          .psv2-mobile-stage {
            pointer-events: none !important;
          }

          .psv2-mobile-language {
            top: calc(10px + var(--safe-top)) !important;
            right: 12px !important;
            z-index: 2147483002 !important;
            pointer-events: auto !important;
          }

          .psv2-mobile-logo {
            top: calc(66px + var(--safe-top)) !important;
            width: clamp(170px, 50vw, 225px) !important;
            max-height: clamp(105px, 18dvh, 155px) !important;
            object-fit: contain !important;
            pointer-events: none !important;
          }

          .psv2-mobile-subtitle {
            top: var(--content-top) !important;
            width: min(90vw, 420px) !important;
            font-size: clamp(13px, 4vw, 17px) !important;
            pointer-events: none !important;
          }

          .psv2-ticket-page,
          .psv2-seller-page,
          .psv2-more-page {
            top: var(--content-top) !important;
            left: 12px !important;
            right: 12px !important;
            bottom: calc(
              var(--nav-height) + var(--nav-bottom) + 16px
            ) !important;
            max-height: none !important;
            min-height: 0 !important;
            overflow-x: hidden !important;
            overflow-y: auto !important;
            overscroll-behavior: contain;
            -webkit-overflow-scrolling: touch;
            padding-bottom: 4px !important;
            pointer-events: auto !important;
          }

          .psv2-seller-page {
            display: block !important;
          }

          .psv2-ticket-glass,
          .psv2-seller-glass,
          .psv2-more-glass {
            width: 100% !important;
            max-width: none !important;
            box-sizing: border-box !important;
          }

          .psv2-ticket-glass {
            padding: 14px !important;
          }

          .psv2-seller-glass,
          .psv2-more-glass {
            padding: 15px 14px !important;
          }

          .psv2-ticket-head strong,
          .psv2-seller-head strong,
          .psv2-more-head strong {
            font-size: clamp(16px, 4.6vw, 19px) !important;
          }

          .psv2-ticket-head small,
          .psv2-seller-head small,
          .psv2-more-head small {
            font-size: clamp(10px, 2.8vw, 12px) !important;
          }

          .psv2-social-grid {
            grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
            gap: 6px !important;
          }

          .psv2-social-card {
            height: clamp(58px, 9dvh, 74px) !important;
            border-radius: 15px !important;
          }

          .psv2-spoken-languages {
            gap: 8px !important;
          }

          .psv2-spoken-flags {
            gap: 5px !important;
          }

          .psv2-mobile-nav {
            position: absolute !important;
            z-index: 2147483000 !important;
            left: 8px !important;
            right: 8px !important;
            bottom: var(--nav-bottom) !important;
            height: var(--nav-height) !important;
            display: grid !important;
            grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
            gap: 6px !important;
            pointer-events: auto !important;
            touch-action: manipulation;
          }

          .psv2-mobile-nav button {
            z-index: 2147483001 !important;
            width: 100% !important;
            height: 100% !important;
            min-height: 0 !important;
            padding: clamp(8px, 1.8dvh, 13px) 3px 9px !important;
            gap: clamp(4px, 1dvh, 8px) !important;
            border-radius: clamp(18px, 5.5vw, 24px) !important;
            justify-content: flex-start !important;
            pointer-events: auto !important;
            touch-action: manipulation;
          }

          .psv2-mobile-nav-icon {
            width: clamp(29px, 8vw, 37px) !important;
            height: clamp(29px, 8vw, 37px) !important;
          }

          .psv2-mobile-nav-icon svg {
            width: clamp(27px, 7.5vw, 33px) !important;
            height: clamp(27px, 7.5vw, 33px) !important;
          }

          .psv2-mobile-nav-text {
            font-size: clamp(9px, 2.8vw, 11px) !important;
          }

          .psv2-mobile-nav-line {
            bottom: 6px !important;
          }

          .psv2-ticket-page button,
          .psv2-ticket-page input,
          .psv2-seller-page button,
          .psv2-more-page a,
          .psv2-mobile-language button {
            pointer-events: auto !important;
            touch-action: manipulation;
          }
        }

        /* sehr kurze Handys: Header kompakter, Inhalt gewinnt Hoehe */
        @media (max-width: 760px) and (max-height: 700px) and (hover: none) and (pointer: coarse) {
          .psv2-app {
            --nav-height: 78px;
            --content-top: 198px;
          }

          .psv2-mobile-logo {
            top: calc(58px + var(--safe-top)) !important;
            width: min(44vw, 190px) !important;
            max-height: 118px !important;
          }

          .psv2-mobile-language {
            transform: scale(.90);
            transform-origin: top right;
          }

          .psv2-social-card {
            height: 56px !important;
          }

          .psv2-spoken-languages,
          .psv2-legal-links {
            margin-top: 9px !important;
            padding-top: 8px !important;
          }
        }

        /* schmale Handys: Texte/Abstaende bleiben innerhalb des Screens */
        @media (max-width: 380px) and (hover: none) and (pointer: coarse) {
          .psv2-mobile-language {
            transform: scale(.88);
            transform-origin: top right;
          }

          .psv2-social-grid {
            gap: 4px !important;
          }

          .psv2-social-card small {
            font-size: 7px !important;
          }

          .psv2-spoken-flag,
          .psv2-spoken-flag-gb-svg {
            width: 24px !important;
            height: 15px !important;
          }
        }


        @media (max-width: 760px) and (hover: none) and (pointer: coarse) {
          .psv2-mobile-subtitle {
            padding: 9px 14px !important;
            border-radius: 16px !important;
            background: rgba(0, 0, 0, .26) !important;
            box-shadow:
              inset 0 1px 0 rgba(255,255,255,.16),
              0 5px 14px rgba(0,0,0,.16) !important;
            backdrop-filter: blur(7px) saturate(1.05) !important;
            -webkit-backdrop-filter: blur(7px) saturate(1.05) !important;
            text-shadow:
              0 1px 2px rgba(0,0,0,.95),
              0 2px 8px rgba(0,0,0,.75) !important;
          }

          .psv2-ticket-head strong,
          .psv2-ticket-head small,
          .psv2-seller-head strong,
          .psv2-seller-head small,
          .psv2-more-head strong,
          .psv2-more-head small,
          .psv2-spoken-languages strong,
          .psv2-legal-links a {
            text-shadow:
              0 1px 2px rgba(0,0,0,.95),
              0 2px 6px rgba(0,0,0,.70) !important;
          }

          .psv2-mobile-nav-text {
            text-shadow:
              0 1px 2px rgba(0,0,0,.95),
              0 2px 5px rgba(0,0,0,.75) !important;
          }
        }


        @media (max-width: 760px) and (hover: none) and (pointer: coarse) {
          .psv2-mobile-subtitle {
            top: calc(var(--content-top) - 18px) !important;
            width: min(88vw, 390px) !important;
            padding: 10px 16px !important;
            font-size: clamp(15px, 4.4vw, 18px) !important;
            font-weight: 800 !important;
            color: #ffffff !important;
            background: rgba(0, 0, 0, .38) !important;
            border: 1px solid rgba(255,255,255,.24) !important;
            text-shadow:
              0 1px 2px rgba(0,0,0,1),
              0 2px 8px rgba(0,0,0,.9) !important;
            box-shadow:
              inset 0 1px 0 rgba(255,255,255,.20),
              0 6px 16px rgba(0,0,0,.22) !important;
          }
        }


        @media (max-width: 760px) and (hover: none) and (pointer: coarse) {
          /* Logo auf dem Handy deutlich praesenter */
          .psv2-mobile-logo {
            top: calc(58px + var(--safe-top)) !important;
            width: clamp(210px, 58vw, 255px) !important;
            max-height: clamp(125px, 21dvh, 170px) !important;
          }

          /* Untertitel direkt unter das Logo, ohne dunkle Kachel */
          .psv2-mobile-subtitle {
            top: calc(190px + var(--safe-top)) !important;
            width: min(90vw, 410px) !important;
            padding: 0 10px !important;
            border: 0 !important;
            border-radius: 0 !important;
            background: transparent !important;
            box-shadow: none !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
            font-size: clamp(15px, 4.3vw, 18px) !important;
            line-height: 1.18 !important;
            font-weight: 800 !important;
            color: #ffffff !important;
            text-align: center !important;
            text-shadow:
              0 2px 3px rgba(0,0,0,1),
              0 4px 12px rgba(0,0,0,.95) !important;
          }

          /* Seiten 2-4: grosse Glas-Kacheln weniger transparent */
          .psv2-ticket-glass,
          .psv2-seller-glass,
          .psv2-more-glass,
          .psv2-ticket-results {
            background:
              linear-gradient(
                180deg,
                rgba(9,18,30,.78) 0%,
                rgba(8,17,28,.70) 48%,
                rgba(7,15,25,.66) 100%
              ) !important;
            border: 1.4px solid rgba(255,255,255,.70) !important;
            box-shadow:
              inset 0 1.5px 0 rgba(255,255,255,.42),
              inset 1px 0 0 rgba(255,255,255,.15),
              inset -1px 0 0 rgba(255,255,255,.08),
              0 12px 26px rgba(0,0,0,.30) !important;
            backdrop-filter: blur(12px) saturate(1.05) !important;
            -webkit-backdrop-filter: blur(12px) saturate(1.05) !important;
          }

          .psv2-ticket-glass::before,
          .psv2-seller-glass::before,
          .psv2-more-glass::before {
            opacity: .45 !important;
          }

          .psv2-ticket-head strong,
          .psv2-ticket-head small,
          .psv2-seller-head strong,
          .psv2-seller-head small,
          .psv2-more-head strong,
          .psv2-more-head small,
          .psv2-spoken-languages strong,
          .psv2-legal-links a {
            color: #ffffff !important;
            text-shadow:
              0 1px 2px rgba(0,0,0,1),
              0 2px 7px rgba(0,0,0,.9) !important;
          }
        }


        @media (max-width: 760px) and (hover: none) and (pointer: coarse) {
          .psv2-mobile-logo {
            width: clamp(220px, 62vw, 270px) !important;
          }

          .psv2-mobile-subtitle {
            top: calc(202px + var(--safe-top)) !important;
            width: min(92vw, 420px) !important;
            padding: 0 10px !important;
            background: transparent !important;
            border: 0 !important;
            box-shadow: none !important;
            color: #ffffff !important;
            font-size: clamp(16px, 4.5vw, 19px) !important;
            font-weight: 850 !important;
            line-height: 1.18 !important;
            letter-spacing: .01em !important;
            text-align: center !important;
            text-shadow:
              0 2px 3px rgba(0,0,0,1),
              0 4px 12px rgba(0,0,0,.95) !important;
          }

          .psv2-info-card {
            position: relative;
            z-index: 1;
            display: flex;
            align-items: center;
            gap: 11px;
            margin-top: 14px;
            padding: 12px;
            border: 1px solid rgba(255,255,255,.48);
            border-radius: 17px;
            background: rgba(8,17,28,.64);
            box-shadow:
              inset 0 1px 0 rgba(255,255,255,.30),
              0 6px 14px rgba(0,0,0,.18);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
          }

          .psv2-info-card-icon {
            display: grid;
            place-items: center;
            flex: 0 0 38px;
            width: 38px;
            height: 38px;
            border: 1px solid rgba(255,255,255,.44);
            border-radius: 13px;
            background: rgba(255,255,255,.07);
            color: #ffffff;
            font-size: 20px;
            font-weight: 900;
          }

          .psv2-info-card-copy {
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 3px;
          }

          .psv2-info-card-copy strong {
            color: #ffffff;
            font-size: 13px;
            line-height: 1.1;
            font-weight: 800;
            text-shadow: 0 2px 6px rgba(0,0,0,.85);
          }

          .psv2-info-card-copy small {
            color: rgba(255,255,255,.82);
            font-size: 10px;
            line-height: 1.25;
            text-shadow: 0 1px 4px rgba(0,0,0,.75);
          }
        }


        @media (max-width: 760px) and (hover: none) and (pointer: coarse) {
          .psv2-more-page {
            top: calc(var(--content-top) - 24px) !important;
          }
        }


        @media (max-width: 760px) and (hover: none) and (pointer: coarse) {
          .psv2-mobile-subtitle {
            top: calc(198px + var(--safe-top)) !important;
            width: min(92vw, 430px) !important;
            padding: 0 10px !important;
            border: 0 !important;
            background: transparent !important;
            box-shadow: none !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
            font-family: "Inter", "Segoe UI", Arial, sans-serif !important;
            font-size: clamp(17px, 4.8vw, 20px) !important;
            line-height: 1.08 !important;
            font-weight: 900 !important;
            text-align: center !important;
            color: transparent !important;
            background-image: linear-gradient(
              90deg,
              #173b7a 0%,
              #2876d8 36%,
              #42b9f4 68%,
              #74cf67 100%
            ) !important;
            -webkit-background-clip: text !important;
            background-clip: text !important;
            -webkit-text-fill-color: transparent !important;
            filter:
              drop-shadow(0 2px 2px rgba(0,0,0,.9))
              drop-shadow(0 4px 8px rgba(0,0,0,.7)) !important;
          }
        }


        @media (min-width: 761px) {
          .header-actions .cart {
            position: relative !important;
            z-index: 100 !important;
            pointer-events: auto !important;
            cursor: pointer !important;
          }

          .header-actions .cart * {
            pointer-events: none !important;
          }
        }


        .market-auth-switch {
          width: 100%;
          margin-top: 10px;
          padding: 8px 10px;
          border: 0;
          background: transparent;
          color: inherit;
          font: inherit;
          font-size: 13px;
          font-weight: 700;
          text-decoration: underline;
          text-underline-offset: 3px;
          cursor: pointer;
        }


        .market-form-two {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 10px;
        }

        .seller-terms-check {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          font-size: 12px;
          line-height: 1.4;
          cursor: pointer;
        }

        .seller-terms-check input {
          width: 16px;
          height: 16px;
          margin-top: 1px;
          flex: 0 0 auto;
        }

        @media (max-width: 760px) and (hover: none) and (pointer: coarse) {
          .market-form-two {
            grid-template-columns: 1fr;
          }
        }


        /* Login-Status Verkäufer/Käufer:
           ausgeloggt = rot, eingeloggt = grün */
        .header-actions .account-status-offline {
          background:
            linear-gradient(
              145deg,
              rgba(205, 44, 56, .34),
              rgba(255,255,255,.13)
            ) !important;
          border-color: rgba(176, 25, 38, .48) !important;
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.42),
            0 7px 18px rgba(112, 20, 31, .12) !important;
        }

        .header-actions .account-status-online {
          background:
            linear-gradient(
              145deg,
              rgba(42, 176, 92, .38),
              rgba(255,255,255,.14)
            ) !important;
          border-color: rgba(27, 139, 69, .52) !important;
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.48),
            0 0 0 2px rgba(255,255,255,.58),
            0 7px 18px rgba(21, 115, 57, .14) !important;
        }

        .header-actions .account-status-online .header-action-label,
        .header-actions .account-status-offline .header-action-label {
          color: rgba(7,17,31,.95) !important;
        }


        .account-role-choice {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin: 0 0 12px;
        }

        .account-role-button {
          min-height: 40px;
          border: 1px solid rgba(255,255,255,.38);
          border-radius: 12px;
          background: rgba(255,255,255,.10);
          color: #07111f;
          font: inherit;
          font-size: 13px;
          font-weight: 850;
          cursor: pointer;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.42);
        }

        .account-role-button.active {
          color: #fff;
          border-color: rgba(255,255,255,.86);
          background:
            linear-gradient(
              100deg,
              #1557ef 0%,
              #248eea 48%,
              #24bda4 100%
            );
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.52),
            0 7px 18px rgba(20,83,180,.24);
        }

        .brand-text {
          display: flex;
          align-items: baseline;
          flex-wrap: nowrap;
        }

        .brand-window-handwriting {
          display: inline-block;
          margin-left: 12px;
          font-family: "Segoe Script", "Brush Script MT", "Lucida Handwriting", cursive;
          font-size: inherit;
          font-weight: 600;
          font-style: italic;
          line-height: 1;
          letter-spacing: .01em;
          color: rgba(7,17,31,.82);
          white-space: nowrap;
          transform: rotate(-1deg);
        }


        /* Konto-Button exakt in Größe/Form an Warenkorb angleichen */
        .header-actions .account-action {
          min-width: 0 !important;
          width: auto !important;
          height: auto !important;
          padding: 0 !important;
          border-radius: inherit !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
        }

        .header-actions .account-action {
          padding-left: 16px !important;
          padding-right: 16px !important;
          min-height: 44px !important;
          border-radius: 14px !important;
        }

        .header-actions .account-action .header-action-label {
          font-size: inherit !important;
          font-weight: inherit !important;
          line-height: inherit !important;
          white-space: nowrap !important;
        }


        @media (max-width: 760px) and (hover: none) and (pointer: coarse) {
          .psv2-mobile-subtitle {
            top: calc(230px + var(--safe-top)) !important;
            margin-top: 0 !important;
            padding-top: 0 !important;
            transform: translateX(-50%) !important;
            font-family: "Segoe UI", Arial, Helvetica, sans-serif !important;
            font-size: 19px !important;
            font-style: normal !important;
            font-weight: 600 !important;
            line-height: 1.05 !important;
            letter-spacing: 0 !important;
            opacity: 1 !important;
            visibility: visible !important;
          }
        }


        /* Social-Media-Kachel: Fenster-Wasserzeichen entfernen */
        .social-window-watermark,
        .social-watermark,
        .social-card-watermark {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          background: none !important;
        }

        /* Desktop-Hintergrund etwas kräftiger, Mobile unverändert */
        @media (min-width: 761px) {
          .stadium-bg {
            filter:
              saturate(2.05)
              contrast(1.18)
              brightness(1.06) !important;
          }
        }


        /* KORREKTUR: Das Fenster-Wasserzeichen ist ein ::before-Pseudoelement */
        .social-card::before {
          content: none !important;
          display: none !important;
          background: none !important;
          border: 0 !important;
          box-shadow: none !important;
          opacity: 0 !important;
        }

        /* Desktop: tatsächliches Hintergrundbild deutlich farbkräftiger */
        @media (min-width: 761px) {
          .stadium-bg {
            opacity: 1 !important;
            filter:
              saturate(2.75)
              contrast(1.28)
              brightness(1.08) !important;
          }
        }


        /* Desktop-Hintergrund: Bild selbst direkt setzen und deutlich kräftiger darstellen */
        @media (min-width: 761px) {
          .stadium-bg {
            display: block !important;
            opacity: 1 !important;
            background-image: url("/stadium-bg.jpg") !important;
            background-size: cover !important;
            background-position: center center !important;
            background-repeat: no-repeat !important;
            filter:
              saturate(4)
              contrast(1.38)
              brightness(1.08) !important;
          }
        }


        /* Desktop: www.pasespain.es in der Social-Media-Kachel etwas höher */
        @media (min-width: 761px) {
          .social-site-link {
            transform: translateY(-10px) !important;
          }
        }


        .psv2-mobile-account {
          display: none;
        }

        .psv2-account-hint {
          margin: 11px 0 0;
          padding: 9px 11px;
          border: 1px solid rgba(255,255,255,.26);
          border-radius: 13px;
          background: rgba(0,0,0,.20);
          color: rgba(255,255,255,.92);
          font-size: 12px;
          line-height: 1.3;
          text-align: center;
        }

        .account-role-note {
          margin: -4px 0 12px;
          font-size: 12px;
          line-height: 1.4;
          color: rgba(7,22,51,.72);
        }

        @media (max-width: 760px) and (hover: none) and (pointer: coarse) {
          .psv2-mobile-account {
            display: inline-flex !important;
            position: absolute;
            top: calc(14px + var(--safe-top));
            left: 12px;
            z-index: 10020;
            min-width: 78px;
            height: 36px;
            align-items: center;
            justify-content: center;
            padding: 0 12px;
            border: 1px solid rgba(255,255,255,.48);
            border-radius: 13px;
            color: #fff;
            font-size: 12px;
            font-weight: 800;
            box-shadow:
              inset 0 1px 0 rgba(255,255,255,.28),
              0 5px 14px rgba(0,0,0,.20);
            backdrop-filter: blur(9px);
            -webkit-backdrop-filter: blur(9px);
            pointer-events: auto !important;
            touch-action: manipulation;
          }

          .psv2-mobile-account.account-status-offline {
            background:
              linear-gradient(
                145deg,
                rgba(188,42,53,.92),
                rgba(126,22,33,.92)
              );
          }

          .psv2-mobile-account.account-status-online {
            background:
              linear-gradient(
                145deg,
                rgba(25,145,92,.94),
                rgba(12,104,68,.94)
              );
          }
        }

        .account-auth-mode-choice {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin: 0 0 14px;
        }

        .account-auth-mode-choice button {
          min-height: 42px;
          border: 1px solid rgba(255,255,255,.80);
          border-radius: 13px;
          background: rgba(255,255,255,.32);
          color: #071633;
          font-weight: 760;
          cursor: pointer;
        }

        .account-auth-mode-choice button.active {
          color: #fff;
          background:
            linear-gradient(
              100deg,
              #1557ef 0%,
              #248eea 48%,
              #24bda4 100%
            );
        }

        .seller-own-offers {
          display: grid;
          gap: 9px;
          margin: 8px 0 18px;
        }

        .seller-own-offers-title {
          margin: 0;
          font-size: 14px;
          font-weight: 800;
          color: #071633;
        }

        .seller-own-offer {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: center;
          gap: 10px;
          padding: 11px 12px;
          border: 1px solid rgba(255,255,255,.72);
          border-radius: 15px;
          background: rgba(255,255,255,.30);
        }

        .seller-own-offer strong,
        .seller-own-offer small {
          display: block;
        }

        .seller-own-offer small {
          margin-top: 3px;
          color: rgba(7,22,51,.68);
          font-size: 11px;
        }

        .seller-price-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 7px;
          flex-wrap: wrap;
        }

        .seller-current-price {
          font-weight: 850;
          white-space: nowrap;
          color: #071633;
        }

        .seller-price-edit-button,
        .seller-price-save-button,
        .seller-price-cancel-button {
          min-height: 34px;
          padding: 0 10px;
          border-radius: 11px;
          border: 1px solid rgba(255,255,255,.78);
          font-weight: 760;
          cursor: pointer;
        }

        .seller-price-edit-button,
        .seller-price-cancel-button {
          background: rgba(255,255,255,.42);
          color: #071633;
        }

        .seller-price-save-button {
          background: linear-gradient(100deg,#1557ef 0%,#248eea 48%,#24bda4 100%);
          color: #fff;
        }

        .seller-price-input {
          width: 88px;
          min-height: 34px;
          padding: 6px 9px;
          border: 1px solid rgba(255,255,255,.90);
          border-radius: 10px;
          background: rgba(255,255,255,.60);
          color: #071633;
          font-size: 16px;
        }

        .seller-offer-edit-button,
        .seller-offer-delete-button {
          min-height: 34px;
          padding: 0 10px;
          border-radius: 11px;
          border: 1px solid rgba(255,255,255,.78);
          font-weight: 760;
          cursor: pointer;
        }

        .seller-offer-edit-button {
          background: rgba(255,255,255,.48);
          color: #071633;
        }

        .seller-offer-delete-button {
          background: rgba(255,255,255,.34);
          color: #a11d2c;
          border-color: rgba(161,29,44,.18);
        }

        .seller-offer-delete-button:disabled {
          opacity: .55;
          cursor: wait;
        }

        .seller-edit-mode {
          margin: 12px 0 2px;
          padding: 10px 12px;
          border: 1px solid rgba(255,255,255,.72);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          background: rgba(255,255,255,.32);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.72);
        }

        .seller-edit-mode button {
          min-height: 32px;
          padding: 0 10px;
          border: 1px solid rgba(255,255,255,.78);
          border-radius: 10px;
          background: rgba(255,255,255,.52);
          color: #071633;
          font-weight: 740;
          cursor: pointer;
        }

        @media (max-width: 760px) and (hover: none) and (pointer: coarse) {
          .market-modal-backdrop {
            z-index: 20000 !important;
            align-items: flex-start !important;
            justify-content: center !important;
            padding:
              calc(10px + env(safe-area-inset-top))
              10px
              calc(10px + env(safe-area-inset-bottom)) !important;
            overflow-y: auto !important;
            pointer-events: auto !important;
          }

          .market-modal,
          .market-modal-wide {
            width: 100% !important;
            max-width: 100% !important;
            max-height:
              calc(
                100dvh -
                20px -
                env(safe-area-inset-top) -
                env(safe-area-inset-bottom)
              ) !important;
            margin: 0 !important;
            padding: 16px !important;
            border-radius: 20px !important;
            overflow-y: auto !important;
            -webkit-overflow-scrolling: touch;
            pointer-events: auto !important;
          }

          .account-auth-mode-choice {
            position: sticky;
            top: 0;
            z-index: 3;
            padding: 2px 0 8px;
            margin-bottom: 10px;
          }

          .account-auth-mode-choice button {
            min-height: 44px;
            font-size: 15px;
            pointer-events: auto !important;
            touch-action: manipulation;
          }

          .market-form-grid,
          .market-form-two {
            grid-template-columns: 1fr !important;
          }

          .market-field input,
          .market-field textarea,
          .market-field select {
            font-size: 16px !important;
            pointer-events: auto !important;
          }

          .market-modal button,
          .market-modal input,
          .market-modal textarea,
          .market-modal select {
            pointer-events: auto !important;
            touch-action: manipulation;
          }

          .psv2-seller-logged-in {
            margin-top: 12px;
            display: grid;
            gap: 10px;
          }

          .psv2-seller-logged-in > button {
            min-height: 42px;
            border: 1px solid rgba(255,255,255,.55);
            border-radius: 14px;
            color: #fff;
            font-weight: 800;
            background:
              linear-gradient(
                100deg,
                rgba(21,87,239,.90),
                rgba(36,189,164,.90)
              );
          }

          .psv2-seller-own-list {
            display: grid;
            gap: 8px;
          }

          .psv2-seller-own-ticket {
            padding: 10px;
            border: 1px solid rgba(255,255,255,.24);
            border-radius: 14px;
            background: rgba(0,0,0,.22);
            color: #fff;
          }

          .psv2-seller-own-ticket strong,
          .psv2-seller-own-ticket small {
            display: block;
          }

          .psv2-seller-own-ticket small {
            margin-top: 3px;
            opacity: .78;
          }

          .psv2-seller-own-ticket .seller-current-price {
            color: #fff;
          }

          .seller-own-offer {
            grid-template-columns: 1fr !important;
          }

          .seller-price-actions {
            justify-content: flex-start;
            flex-wrap: wrap;
            gap: 7px;
          }

          .psv2-seller-own-ticket .seller-offer-edit-button,
          .psv2-seller-own-ticket .seller-offer-delete-button,
          .psv2-seller-own-ticket .seller-price-edit-button,
          .psv2-seller-own-ticket .seller-price-save-button,
          .psv2-seller-own-ticket .seller-price-cancel-button {
            pointer-events: auto !important;
            touch-action: manipulation !important;
          }

          .psv2-seller-own-ticket .seller-offer-edit-button,
          .psv2-seller-own-ticket .seller-offer-delete-button {
            min-height: 38px;
            padding: 0 12px;
          }
        }


        /* =========================================================
           MOBILE FINAL FIX
           Nur Handy:
           1) Untertitel klar sichtbar
           2) Konto/Registrieren-Fenster sicher klickbar
           ========================================================= */
        @media (max-width: 760px) and (hover: none) and (pointer: coarse) {
          .psv2-mobile-subtitle {
            top: calc(220px + var(--safe-top)) !important;
            width: min(92vw, 420px) !important;
            padding: 0 10px !important;
            border: 0 !important;
            border-radius: 0 !important;
            background: none !important;
            background-image: none !important;
            box-shadow: none !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
            color: #ffffff !important;
            -webkit-text-fill-color: #ffffff !important;
            -webkit-background-clip: border-box !important;
            background-clip: border-box !important;
            font-family: "Segoe UI", Arial, Helvetica, sans-serif !important;
            font-size: 18px !important;
            font-style: normal !important;
            font-weight: 600 !important;
            line-height: 1.15 !important;
            letter-spacing: 0 !important;
            text-align: center !important;
            opacity: 1 !important;
            visibility: visible !important;
            text-shadow: 0 2px 5px rgba(0,0,0,.95) !important;
            pointer-events: none !important;
          }

          .market-modal-backdrop {
            z-index: 2147483646 !important;
            pointer-events: auto !important;
          }

          .market-modal {
            position: relative !important;
            z-index: 2147483647 !important;
            pointer-events: auto !important;
          }

          .account-role-choice,
          .account-auth-mode-choice,
          .account-auth-mode-choice button,
          .account-role-button,
          .market-modal button,
          .market-modal form,
          .market-modal input,
          .market-modal textarea,
          .market-modal select {
            position: relative;
            z-index: 2147483647 !important;
            pointer-events: auto !important;
            touch-action: manipulation !important;
          }
        }


        /* =========================================================
           DESKTOP – obere 5 + mittlere 4 Kacheln kompakter
           Unten und Mobile bleiben unverändert.
           ========================================================= */
        @media (min-width: 761px) {
          .category-grid {
            gap: 10px !important;
          }

          .category-card {
            min-height: 68px !important;
            padding: 10px 16px !important;
            border-radius: 18px !important;
          }

          .category-card h3 {
            margin: 0 0 3px !important;
            font-size: 13px !important;
            line-height: 1.15 !important;
          }

          .category-card p {
            margin: 0 !important;
            font-size: 11px !important;
            line-height: 1.2 !important;
          }

          .smart-grid {
            gap: 12px !important;
          }

          .smart-card {
            padding: 13px 16px !important;
            border-radius: 18px !important;
          }

          .smart-card h2,
          .smart-card h3 {
            margin-top: 0 !important;
            margin-bottom: 5px !important;
            font-size: 13px !important;
            line-height: 1.2 !important;
          }

          .smart-card p,
          .smart-card small {
            font-size: 11px !important;
            line-height: 1.25 !important;
          }
        }


        /* =========================================================
           DESKTOP – mittlere 4 Kacheln nochmals ca. 12 % kleiner
           Obere 5, unterer Bereich und Mobile unverändert.
           ========================================================= */
        @media (min-width: 761px) {
          .smart-grid {
            gap: 10px !important;
          }

          .smart-card {
            min-height: 0 !important;
            padding: 11px 14px !important;
            border-radius: 17px !important;
          }

          .smart-card h2,
          .smart-card h3 {
            margin-top: 0 !important;
            margin-bottom: 4px !important;
            font-size: 12px !important;
            line-height: 1.15 !important;
          }

          .smart-card p,
          .smart-card small,
          .smart-card label {
            font-size: 10px !important;
            line-height: 1.2 !important;
          }

          .smart-card input,
          .smart-card textarea,
          .smart-card select,
          .smart-card button {
            font-size: 12px !important;
          }
        }


        /* Ticket-Zusatzinfos: exakt gleiche Typografie wie die übrigen Ticketdaten */
        .match-info .offer-details {
          color: inherit !important;
          font-family: inherit !important;
          font-size: inherit !important;
          font-style: inherit !important;
          font-weight: inherit !important;
          line-height: inherit !important;
          letter-spacing: inherit !important;
          text-shadow: inherit !important;
          white-space: pre-line;
        }

        .account-manage-logout,
        .account-delete-button {
          width: 100%;
          min-height: 46px;
          border-radius: 14px;
          font: inherit;
          font-weight: 800;
          cursor: pointer;
        }

        .account-manage-logout {
          border: 1px solid rgba(255,255,255,.28);
          background: rgba(255,255,255,.14);
          color: inherit;
          margin-top: 8px;
        }

        .account-delete-box {
          margin-top: 18px;
          padding: 16px;
          border-radius: 16px;
          border: 1px solid rgba(190,30,45,.38);
          background: rgba(190,30,45,.08);
        }

        .account-delete-box strong {
          display: block;
          margin-bottom: 7px;
        }

        .account-delete-box p {
          margin: 0 0 12px;
          line-height: 1.45;
        }

        .account-delete-button {
          width: auto;
          min-height: 36px;
          padding: 7px 12px;
          border: 1px solid rgba(210,35,50,.68);
          border-radius: 11px;
          background: rgba(185,25,40,.88);
          color: #fff;
          font-size: 12px;
          font-weight: 750;
        }

        .account-delete-button:disabled {
          cursor: wait;
          opacity: .65;
        }



        /* =========================================================
           PaseSpain 3D-GLAS – nur Optik, keine Funktionsänderungen
           ========================================================= */
        .category-card,
        .smart-card,
        .weather-panel,
        .matches-panel,
        .match-card,
        .spain-schedule-card,
        .social-card,
        .offers-empty-state,
        .neutral-glass {
          border-color: rgba(255,255,255,.62) !important;
          box-shadow:
            0 22px 46px rgba(2,15,38,.22),
            0 8px 18px rgba(2,15,38,.14),
            inset 0 2px 0 rgba(255,255,255,.82),
            inset 0 -2px 0 rgba(7,24,52,.10),
            inset 1px 0 0 rgba(255,255,255,.28),
            inset -1px 0 0 rgba(7,24,52,.06) !important;
          backdrop-filter: blur(18px) saturate(1.22) !important;
          -webkit-backdrop-filter: blur(18px) saturate(1.22) !important;
          transform: translateZ(0);
        }

        .category-card,
        .smart-card,
        .weather-panel,
        .matches-panel,
        .spain-schedule-card,
        .social-card {
          position: relative;
          isolation: isolate;
        }

        .category-card::after,
        .smart-card::after,
        .weather-panel::after,
        .matches-panel::after,
        .spain-schedule-card::after,
        .social-card::after {
          content: "";
          position: absolute;
          z-index: 0;
          pointer-events: none;
          left: 8px;
          right: 8px;
          top: 4px;
          height: 42%;
          border-radius: inherit;
          background: linear-gradient(
            180deg,
            rgba(255,255,255,.20) 0%,
            rgba(255,255,255,.07) 46%,
            rgba(255,255,255,0) 100%
          );
          opacity: .82;
        }

        .category-card > *,
        .smart-card > *,
        .weather-panel > *,
        .matches-panel > *,
        .spain-schedule-card > *,
        .social-card > * {
          position: relative;
          z-index: 1;
        }

        .match-card,
        .offers-empty-state {
          box-shadow:
            0 14px 28px rgba(2,15,38,.18),
            0 5px 12px rgba(2,15,38,.12),
            inset 0 2px 0 rgba(255,255,255,.72),
            inset 0 -2px 0 rgba(7,24,52,.08) !important;
        }

        .header-actions .icon-button,
        .round-button,
        .social-app,
        .social-amelia-card {
          box-shadow:
            0 12px 24px rgba(2,15,38,.20),
            0 4px 9px rgba(2,15,38,.13),
            inset 0 2px 0 rgba(255,255,255,.76),
            inset 0 -2px 0 rgba(7,24,52,.10) !important;
        }

        .social-amelia-card {
          border-color: rgba(255,255,255,.72) !important;
          transform: translateZ(0);
        }

        @media (min-width: 761px) and (hover: hover) {
          .category-card,
          .smart-card,
          .weather-panel,
          .matches-panel,
          .match-card,
          .spain-schedule-card,
          .social-card,
          .header-actions .icon-button,
          .round-button,
          .social-app,
          .social-amelia-card {
            transition:
              transform .18s ease,
              box-shadow .18s ease,
              border-color .18s ease;
          }

          .category-card:hover,
          .smart-card:hover,
          .match-card:hover,
          .spain-schedule-card:hover,
          .social-card:hover {
            transform: translateY(-3px) translateZ(0);
            border-color: rgba(255,255,255,.78) !important;
            box-shadow:
              0 28px 58px rgba(2,15,38,.27),
              0 10px 22px rgba(2,15,38,.16),
              inset 0 2px 0 rgba(255,255,255,.90),
              inset 0 -2px 0 rgba(7,24,52,.10) !important;
          }
        }

        /* Mobile-App-Kacheln ebenfalls plastischer */
        .psv2-ticket-glass,
        .psv2-seller-glass,
        .psv2-more-glass,
        .psv2-social-card {
          border-color: rgba(255,255,255,.60) !important;
          box-shadow:
            0 18px 38px rgba(2,15,38,.22),
            0 6px 14px rgba(2,15,38,.13),
            inset 0 2px 0 rgba(255,255,255,.78),
            inset 0 -2px 0 rgba(7,24,52,.09) !important;
          backdrop-filter: blur(18px) saturate(1.20) !important;
          -webkit-backdrop-filter: blur(18px) saturate(1.20) !important;
        }

        .psv2-social-card > span {
          box-shadow:
            0 10px 20px rgba(2,15,38,.18),
            inset 0 1px 0 rgba(255,255,255,.72) !important;
        }


        /* Untere Hauptkacheln – gleiche 3D-Tiefe wie oben */
        .matches-panel,
        .spain-schedule-card {
          border-color: rgba(255,255,255,.74) !important;
          box-shadow:
            0 30px 64px rgba(2,15,38,.29),
            0 12px 24px rgba(2,15,38,.18),
            inset 0 3px 0 rgba(255,255,255,.90),
            inset 0 -3px 0 rgba(7,24,52,.13),
            inset 2px 0 0 rgba(255,255,255,.26),
            inset -2px 0 0 rgba(7,24,52,.08) !important;
          background-image: linear-gradient(145deg, rgba(255,255,255,.10), rgba(255,255,255,.025)) !important;
        }

        .matches-panel::before {
          content: "";
          position: absolute;
          z-index: 0;
          pointer-events: none;
          left: 14px;
          right: 14px;
          bottom: 7px;
          height: 24%;
          border-radius: inherit;
          background: linear-gradient(0deg, rgba(4,18,43,.10), transparent 90%);
        }

        .spain-schedule-card::before {
          content: "";
          position: absolute;
          z-index: 0;
          pointer-events: none;
          inset: 18% 8% 12% 8%;
          border-radius: inherit;
          background:
            url("/pasespain-logo-transparent.png") center / 86% auto no-repeat;
          opacity: .20;
        }

        .matches-panel > *,
        .spain-schedule-card > * {
          position: relative;
          z-index: 1;
        }

        .offers-empty-state {
          border: 0 !important;
          border-radius: 0 !important;
          background: transparent !important;
          box-shadow: none !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
        }

        .matches-panel .match-card {
          border-color: rgba(255,255,255,.68) !important;
          box-shadow:
            0 18px 34px rgba(2,15,38,.22),
            0 7px 14px rgba(2,15,38,.14),
            inset 0 2px 0 rgba(255,255,255,.82),
            inset 0 -2px 0 rgba(7,24,52,.10) !important;
        }
      
        .seller-date-open-toggle {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 9px;
          margin-top: 9px;
          width: fit-content;
          cursor: pointer;
          user-select: none;
          font-size: 13px;
          font-weight: 750;
          line-height: 1.2;
        }

        .seller-date-open-toggle > input {
          position: absolute;
          opacity: 0;
          pointer-events: none;
        }

        .seller-date-open-check {
          width: 22px;
          height: 22px;
          flex: 0 0 22px;
          display: grid;
          place-items: center;
          border-radius: 7px;
          border: 1px solid rgba(255,255,255,.58);
          background: rgba(255,255,255,.24);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.7),
            0 3px 10px rgba(15,23,42,.08);
          font-size: 14px;
          font-weight: 900;
        }

        .seller-date-open-toggle > input:checked + .seller-date-open-check {
          background: rgba(255,255,255,.58);
          border-color: rgba(255,255,255,.88);
        }

        .seller-payout-setup-button {
          width: auto !important;
          min-width: 220px;
          padding: 10px 18px !important;
          margin: 0 auto;
          display: block;
        }

        @media (min-width: 761px) {
          .social-fairplay-stack {
            height: 100%;
          }

          .social-fairplay-stack > .social-card,
          .social-fairplay-stack > .fairplay-tile {
            width: 100%;
            box-sizing: border-box;
            border-radius: 22px;
            border: 1px solid rgba(255,255,255,.76);
            background:
              linear-gradient(
                145deg,
                rgba(255,255,255,.28),
                rgba(214,232,255,.12)
              );
            box-shadow:
              inset 0 1px 0 rgba(255,255,255,.90),
              0 14px 30px rgba(7,24,52,.12);
          }

          .social-fairplay-stack > .social-card {
            flex: 1 1 0;
          }

          .social-fairplay-stack > .fairplay-tile {
            flex: 1 1 0;
            margin-top: 0;
          }
        }

        @media (max-width: 760px) {
          .seller-date-open-toggle {
            width: 100%;
          }

          .seller-payout-setup-button {
            width: 100% !important;
            min-width: 0;
          }
        }


        /* PaseSpain Fairplay: Desktop Social-Kachel kompakter, Fairplay separat darunter */
        .social-fairplay-stack {
          min-width: 0;
          display: flex;
          flex-direction: column;
          align-items: stretch;
          gap: 10px;
        }

        .fairplay-tile {
          position: relative;
          align-self: stretch;
          margin-top: 14px;
          min-height: 132px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,.76);
          border-radius: 22px;
          background:
            linear-gradient(
              145deg,
              rgba(255,255,255,.28),
              rgba(214,232,255,.12)
            );
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.90),
            0 14px 30px rgba(7,24,52,.12);
          backdrop-filter: blur(16px) saturate(1.10);
          -webkit-backdrop-filter: blur(16px) saturate(1.10);
        }

        .fairplay-tile-watermark {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
        }

        .fairplay-watermark-card {
          position: absolute;
          top: 14px;
          width: 62px;
          height: 94px;
          border-radius: 12px;
          opacity: .20;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.32);
        }

        .fairplay-watermark-red {
          right: 58px;
          transform: rotate(-11deg);
          background: linear-gradient(
            160deg,
            rgba(218,38,52,.98),
            rgba(165,19,31,.82)
          );
        }

        .fairplay-watermark-yellow {
          right: 18px;
          transform: rotate(9deg);
          background: linear-gradient(
            160deg,
            rgba(255,218,54,.98),
            rgba(224,174,14,.84)
          );
        }

        .fairplay-tile-content {
          position: relative;
          z-index: 1;
          min-height: 132px;
          padding: 18px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
        }

        .fairplay-tile-title {
          font-size: 24px;
          line-height: 1;
          font-weight: 850;
          letter-spacing: .045em;
          background: linear-gradient(
            90deg,
            #2467fb 0%,
            #2c9ed1 52%,
            #25bd87 100%
          );
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          text-shadow: 0 1px 0 rgba(255,255,255,.30);
        }

        .fairplay-football-button {
          appearance: none;
          -webkit-appearance: none;
          width: 58px;
          height: 58px;
          flex: 0 0 58px;
          padding: 0;
          border: 0;
          border-radius: 0;
          display: grid;
          place-items: center;
          cursor: pointer;
          background: transparent;
          box-shadow: none;
          backdrop-filter: none;
          -webkit-backdrop-filter: none;
          transition: transform .16s ease, opacity .16s ease;
        }

        .fairplay-football-button:hover {
          transform: translateY(-2px) scale(1.04);
          opacity: .88;
        }

        .fairplay-football-button span {
          font-size: 40px;
          line-height: 1;
          filter: grayscale(1) saturate(0) contrast(1.30);
        }

        @media (min-width: 761px) {
          .social-fairplay-stack .social-card {
            min-height: 0 !important;
            padding-top: 14px !important;
            padding-bottom: 12px !important;
          }

          .social-fairplay-stack .social-card .smart-head {
            margin-bottom: 6px !important;
          }

          .social-fairplay-stack .social-apps {
            flex: 0 0 auto !important;
            transform: translateY(-2px) !important;
          }

          .social-fairplay-stack .social-site-link {
            margin-top: 8px !important;
            transform: none !important;
            font-size: 17px !important;
          }

          .social-fairplay-stack .social-languages {
            margin-top: 7px !important;
          }
        }

        .fairplay-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 20000;
          display: grid;
          place-items: center;
          padding: 18px;
          background: rgba(2,10,24,.56);
          backdrop-filter: blur(11px);
          -webkit-backdrop-filter: blur(11px);
        }

        .fairplay-modal {
          position: relative;
          width: min(760px, calc(100vw - 28px));
          max-height: min(84vh, 760px);
          border: 1px solid rgba(255,255,255,.68);
          border-radius: 30px;
          overflow: hidden;
          color: #071633;
          background:
            linear-gradient(145deg, rgba(255,255,255,.94), rgba(226,239,255,.86));
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.95),
            0 30px 90px rgba(0,0,0,.34);
        }

        .fairplay-modal-close {
          position: absolute;
          top: 13px;
          right: 14px;
          z-index: 4;
          width: 36px;
          height: 36px;
          border: 1px solid rgba(7,24,52,.12);
          border-radius: 50%;
          display: grid;
          place-items: center;
          cursor: pointer;
          font-size: 25px;
          line-height: 1;
          color: #071633;
          background: rgba(255,255,255,.68);
        }

        .fairplay-modal-head {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 22px 58px 17px 22px;
          border-bottom: 1px solid rgba(7,24,52,.09);
          background:
            radial-gradient(circle at 15% 10%, rgba(255,205,64,.22), transparent 32%),
            radial-gradient(circle at 85% 12%, rgba(226,31,38,.16), transparent 30%);
        }

        .fairplay-modal-head img {
          width: 74px;
          height: 74px;
          object-fit: contain;
        }

        .fairplay-modal-head span {
          font-size: 12px;
          font-weight: 800;
          letter-spacing: .08em;
          text-transform: uppercase;
          opacity: .58;
        }

        .fairplay-modal-head h2 {
          margin: 1px 0 2px;
          font-size: 28px;
          line-height: 1;
          letter-spacing: -.03em;
        }

        .fairplay-modal-head p {
          margin: 5px 0 0;
          font-size: 13px;
          font-weight: 720;
          opacity: .72;
        }

        .fairplay-modal-scroll {
          max-height: calc(min(84vh, 760px) - 116px);
          overflow-y: auto;
          padding: 18px 22px 22px;
        }

        .fairplay-modal-scroll section {
          margin: 0 0 12px;
          padding: 14px 15px;
          border: 1px solid rgba(7,24,52,.09);
          border-radius: 18px;
          background: rgba(255,255,255,.54);
        }

        .fairplay-modal-scroll h3 {
          margin: 0 0 6px;
          font-size: 14px;
          line-height: 1.2;
        }

        .fairplay-modal-scroll p {
          margin: 0;
          font-size: 12.5px;
          line-height: 1.55;
          color: rgba(7,22,51,.78);
        }

        .fairplay-card-rule.yellow {
          border-left: 5px solid #f0c400;
        }

        .fairplay-card-rule.red {
          border-left: 5px solid #d81f2a;
        }

        .fairplay-example {
          margin-top: 8px !important;
          font-size: 11.5px !important;
          opacity: .84;
        }

        .fairplay-official-links {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 14px;
        }

        .fairplay-official-links a {
          padding: 8px 10px;
          border: 1px solid rgba(7,24,52,.12);
          border-radius: 12px;
          color: #0e56aa;
          font-size: 11px;
          font-weight: 760;
          text-decoration: none;
          background: rgba(255,255,255,.62);
        }

        .fairplay-legal-note {
          margin: 14px 2px 0 !important;
          font-size: 10.5px !important;
          line-height: 1.45 !important;
          opacity: .62;
        }

        .seller-fairplay-confirm {
          margin: 14px 0 4px;
          padding: 13px 14px;
          border: 1px solid rgba(255,255,255,.52);
          border-radius: 17px;
          background: rgba(255,255,255,.20);
        }

        .seller-fairplay-confirm label {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          cursor: pointer;
        }

        .seller-fairplay-confirm input {
          width: 18px;
          height: 18px;
          margin-top: 2px;
          flex: 0 0 auto;
        }

        .seller-fairplay-confirm span {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .seller-fairplay-confirm strong {
          font-size: 12px;
        }

        .seller-fairplay-confirm small {
          font-size: 11px;
          line-height: 1.4;
          opacity: .76;
        }

        .seller-fairplay-info {
          margin: 8px 0 0 28px;
          padding: 0;
          border: 0;
          cursor: pointer;
          color: #0e62b7;
          font-size: 10.5px;
          font-weight: 760;
          text-decoration: underline;
          background: transparent;
        }

        @media (max-width: 760px) and (hover: none) and (pointer: coarse) {
          .social-fairplay-stack {
            display: contents;
          }

          .fairplay-seal-button {
            display: none;
          }

          .fairplay-modal-head {
            padding: 18px 50px 14px 16px;
            gap: 11px;
          }

          .fairplay-modal-head img {
            width: 58px;
            height: 58px;
          }

          .fairplay-modal-head h2 {
            font-size: 23px;
          }

          .fairplay-modal-scroll {
            padding: 14px;
          }
        }


        .map-site-link {
          margin-top: 18px !important;
          transform: none !important;
        }

`}</style>


      <section className="psv2-app" aria-label="PaseSpain Mobile App">
        <div className="psv2-mobile-stage" aria-hidden="true" />

        <button
          className={`psv2-mobile-account ${
            loggedInRole
              ? "account-status-online"
              : "account-status-offline"
          }`}
          type="button"
          aria-label={
            loggedInRole
              ? language === "de"
                ? "Konto"
                : language === "en"
                  ? "Account"
                  : language === "ca"
                    ? "Compte"
                    : "Cuenta"
              : language === "de"
                ? "Konto"
                : language === "en"
                  ? "Account"
                  : language === "ca"
                    ? "Compte"
                    : "Cuenta"
          }
          onClick={() => {
            if (loggedInRole) {
              setAccountDeleteError("");
              setAccountManageOpen(true);
              return;
            }

            setActiveAuthRole("buyer");
            setAuthMode("login");
            setAuthError("");
            setAuthModalOpen(true);
          }}
        >
          {loggedInRole
            ? language === "de"
              ? "Konto"
              : language === "en"
                ? "Account"
                : language === "ca"
                  ? "Compte"
                  : "Cuenta"
            : language === "de"
              ? "Konto"
              : language === "en"
                ? "Account"
                : language === "ca"
                  ? "Compte"
                  : "Cuenta"}
        </button>

        <div className="psv2-mobile-language" aria-label="Sprachen">
          <button type="button" onClick={() => setLanguage("es")} aria-label="Español">
            <span className="psv2-flag psv2-flag-es" aria-hidden="true" />
          </button>
          <button type="button" onClick={() => setLanguage("ca")} aria-label="Català">
            <span className="psv2-flag psv2-flag-ca" aria-hidden="true" />
          </button>
          <button type="button" onClick={() => setLanguage("en")} aria-label="English">
            <svg
              className="psv2-flag psv2-flag-gb-svg"
              viewBox="0 0 60 36"
              aria-hidden="true"
            >
              <rect width="60" height="36" fill="#012169" />

              {/* white diagonals */}
              <path d="M0 0 L60 36 M60 0 L0 36" stroke="#FFFFFF" strokeWidth="7.2" />

              {/* asymmetric red diagonals of the Union Flag */}
              <path d="M0 0 L25 15" stroke="#C8102E" strokeWidth="3.6" />
              <path d="M60 36 L35 21" stroke="#C8102E" strokeWidth="3.6" />
              <path d="M60 0 L35 15" stroke="#C8102E" strokeWidth="3.6" />
              <path d="M0 36 L25 21" stroke="#C8102E" strokeWidth="3.6" />

              {/* white central cross */}
              <rect x="25" y="0" width="10" height="36" fill="#FFFFFF" />
              <rect x="0" y="13" width="60" height="10" fill="#FFFFFF" />

              {/* red central cross */}
              <rect x="27" y="0" width="6" height="36" fill="#C8102E" />
              <rect x="0" y="15" width="60" height="6" fill="#C8102E" />
            </svg>
          </button>
          <button type="button" onClick={() => setLanguage("de")} aria-label="Deutsch">
            <span className="psv2-flag psv2-flag-de" aria-hidden="true" />
          </button>
        </div>


        <style jsx global>{`
          /* ======================================================
             FINAL DEVICE OVERRIDE
             - echte Handys: stabile Abstände, keine dvh/top-Kaskade
             - iPad/Tablet: eigene App-Oberfläche bis 1180px
             - Desktop >1180px bleibt unverändert
             ====================================================== */

          @media (max-width: 767px) and (hover: none) and (pointer: coarse) {
            .psv2-app {
              --safe-top-final: env(safe-area-inset-top, 0px);
              --safe-bottom-final: env(safe-area-inset-bottom, 0px);
              position: fixed !important;
              inset: 0 !important;
              width: 100% !important;
              height: 100dvh !important;
              overflow: hidden !important;
            }

            .psv2-mobile-logo {
              top: calc(58px + var(--safe-top-final)) !important;
              width: clamp(205px, 56vw, 240px) !important;
              max-height: 150px !important;
            }

            .psv2-mobile-subtitle {
              top: calc(242px + var(--safe-top-final)) !important;
              width: calc(100% - 56px) !important;
              max-width: 390px !important;
              padding: 7px 12px !important;
              border: 1px solid rgba(255,255,255,.28) !important;
              border-radius: 16px !important;
              background: rgba(4,12,22,.34) !important;
              color: #fff !important;
              -webkit-text-fill-color: #fff !important;
              background-clip: border-box !important;
              -webkit-background-clip: border-box !important;
              font-size: 15px !important;
              line-height: 1.15 !important;
              font-weight: 760 !important;
              text-shadow: 0 2px 7px rgba(0,0,0,.75) !important;
              backdrop-filter: blur(9px) !important;
              -webkit-backdrop-filter: blur(9px) !important;
            }

            .psv2-ticket-page,
            .psv2-seller-page,
            .psv2-more-page {
              top: calc(284px + var(--safe-top-final)) !important;
              left: 12px !important;
              right: 12px !important;
              bottom: calc(102px + var(--safe-bottom-final)) !important;
              max-height: none !important;
              overflow-y: auto !important;
              -webkit-overflow-scrolling: touch !important;
            }

            .psv2-ticket-glass {
              min-height: 0 !important;
              padding: 14px !important;
            }

            .psv2-ticket-head {
              display: flex !important;
              margin: 0 0 12px !important;
            }

            .psv2-ticket-search {
              display: grid !important;
              grid-template-columns: minmax(0, 1fr) 48px !important;
              gap: 8px !important;
              width: 100% !important;
            }

            .psv2-ticket-search input {
              display: block !important;
              width: 100% !important;
              min-width: 0 !important;
              height: 48px !important;
              opacity: 1 !important;
              visibility: visible !important;
            }

            .psv2-ticket-search-button {
              display: grid !important;
              width: 48px !important;
              height: 48px !important;
              opacity: 1 !important;
              visibility: visible !important;
            }

            .psv2-mobile-nav {
              bottom: max(8px, var(--safe-bottom-final)) !important;
            }
          }

          @media (min-width: 768px) and (max-width: 1180px) and (hover: none) and (pointer: coarse) {
            /*
              TABLET / iPAD
              Kein erzwungenes Handy-Layout mehr.
              Die normale responsive PaseSpain-Seite bleibt sichtbar und bedienbar.
            */
            .page-shell.glass-shell {
              display: block !important;
              width: min(1180px, calc(100% - 28px)) !important;
              max-width: 1180px !important;
              margin: 14px auto !important;
            }

            .design-credit {
              display: block !important;
            }

            .mobile-bottom-nav {
              display: none !important;
            }

            .site {
              min-height: 100dvh !important;
              height: auto !important;
              padding: 14px 0 28px !important;
              margin: 0 !important;
              overflow-x: hidden !important;
              overflow-y: auto !important;
              background: initial !important;
            }

            .stadium-bg {
              display: block !important;
            }

            /* Die separate Handy-App wird auf dem iPad bewusst nicht verwendet. */
            .psv2-app {
              display: none !important;
            }

            /* Dialoge und Verkäuferfunktionen bleiben auf Touch-Geräten bedienbar. */
            .market-modal-backdrop {
              z-index: 2147483000 !important;
              align-items: flex-start !important;
              padding:
                calc(18px + env(safe-area-inset-top, 0px))
                18px
                calc(18px + env(safe-area-inset-bottom, 0px)) !important;
              overflow-y: auto !important;
              pointer-events: auto !important;
            }

            .market-modal,
            .market-modal-wide {
              width: min(760px, 100%) !important;
              max-width: 760px !important;
              max-height: none !important;
              margin: 0 auto !important;
              pointer-events: auto !important;
            }

            .market-modal button,
            .market-modal input,
            .market-modal textarea,
            .market-modal select,
            .market-modal form {
              pointer-events: auto !important;
              touch-action: manipulation !important;
            }

            .seller-price-actions {
              flex-wrap: wrap !important;
            }
          }
  

        /* PaseSpain: sichtbare Desktop-Angebote als echte Tickets */
        .pases-ticket-card {
          padding: 0 !important;
          border: 0 !important;
          background: transparent !important;
          box-shadow: none !important;
          overflow: visible !important;
          cursor: pointer;
        }
        .pases-ticket-paper {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 64px;
          min-height: 218px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,.78);
          border-radius: 18px;
          background: rgba(255,255,255,.93);
          box-shadow: 0 14px 34px rgba(0,0,0,.22), inset 0 1px 0 rgba(255,255,255,1);
          color: #071633;
          transition: transform .18s ease, box-shadow .18s ease;
        }
        .pases-ticket-card:hover .pases-ticket-paper,
        .pases-ticket-card:focus-visible .pases-ticket-paper {
          transform: translateY(-4px);
          box-shadow: 0 18px 40px rgba(0,0,0,.28), inset 0 1px 0 #fff;
        }
        .pases-ticket-main { padding: 17px 15px 14px; min-width: 0; }
        .pases-ticket-clubs { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 8px; }
        .pases-ticket-club { display: flex; flex-direction: column; align-items: center; gap: 6px; min-width: 0; text-align: center; }
        .pases-ticket-club img { width: 50px; height: 50px; object-fit: contain; }
        .pases-ticket-club strong { font-size: 14px; line-height: 1.15; font-weight: 900; }
        .pases-ticket-vs { font-size: 11px; font-weight: 950; color: rgba(7,22,51,.42); }
        .pases-ticket-meta { display: grid; gap: 3px; margin-top: 12px; text-align: center; }
        .pases-ticket-meta b { color: #1768ff; font-size: 11px; letter-spacing: .05em; text-transform: uppercase; }
        .pases-ticket-meta span { font-size: 12px; line-height: 1.25; font-weight: 720; }
        .pases-ticket-facts { display: grid; grid-template-columns: 1.5fr 1fr .75fr; gap: 6px; margin-top: 12px; }
        .pases-ticket-facts div { min-width: 0; padding-top: 7px; border-top: 1px solid rgba(7,22,51,.12); }
        .pases-ticket-facts small { display: block; color: rgba(7,22,51,.52); font-size: 8px; font-weight: 900; letter-spacing: .04em; }
        .pases-ticket-facts b { display: block; margin-top: 3px; overflow: hidden; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
        .pases-ticket-hint { display: block; margin-top: 10px; color: rgba(7,22,51,.52); font-size: 9px; font-weight: 750; }
        .pases-ticket-stub-new { display: flex; flex-direction: column; align-items: center; justify-content: space-between; gap: 10px; padding: 14px 8px; border-left: 1px dashed rgba(7,22,51,.28); background: linear-gradient(180deg, rgba(23,104,255,.09), rgba(25,190,142,.10)); }
        .pases-ticket-stub-new > span { color: #1768ff; font-size: 8px; font-weight: 950; letter-spacing: .08em; writing-mode: vertical-rl; transform: rotate(180deg); }
        .pases-ticket-stub-new strong { font-size: 13px; font-weight: 950; white-space: nowrap; }
        .pases-ticket-stub-new small { font-size: 7px; font-weight: 850; line-height: 1; white-space: nowrap; opacity: .72; }
        .pases-ticket-barcode-new {
          width: 38px;
          height: 58px;
          background: linear-gradient(90deg,
            #071633 0 2px, transparent 2px 4px,
            #071633 4px 5px, transparent 5px 7px,
            #071633 7px 10px, transparent 10px 11px,
            #071633 11px 13px, transparent 13px 16px,
            #071633 16px 17px, transparent 17px 19px,
            #071633 19px 23px, transparent 23px 25px,
            #071633 25px 27px, transparent 27px 30px,
            #071633 30px 31px, transparent 31px 33px,
            #071633 33px 37px, transparent 37px 38px);
          opacity: .92;
        }
        .pases-ticket-details { display: grid; gap: 10px; margin: 7px 7px 0; padding: 11px; border: 1px solid rgba(255,255,255,.32); border-radius: 0 0 14px 14px; background: rgba(5,15,28,.48); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); color: #fff; }
        .pases-ticket-description { white-space: pre-line; font-size: 12px; line-height: 1.5; }
        .pases-ticket-buy { display: flex; align-items: center; justify-content: center; gap: 8px; min-height: 40px; border: 1px solid rgba(255,255,255,.64); border-radius: 12px; background: linear-gradient(135deg, rgba(23,104,255,.92), rgba(25,190,142,.84)); color: #fff; font-weight: 900; cursor: pointer; }
        .pases-ticket-buy svg { width: 17px; height: 17px; }
        @media (max-width: 760px) {
          .pases-ticket-paper { grid-template-columns: minmax(0, 1fr) 58px; min-height: 200px; }
          .pases-ticket-main { padding: 14px 12px 12px; }
          .pases-ticket-club img { width: 40px; height: 40px; }
        }
      `}</style>

        <img
          className="psv2-mobile-logo"
          src="/pasespain-logo-transparent.png"
          alt="PaseSpain"
        />

        {mobilePage === "home" && (
  <div
    className="psv2-mobile-subtitle"
    style={{
      position: "absolute",
      left: "50%",
      top: "220px",
      transform: "translateX(-50%)",
      width: "92%",
      textAlign: "center",
      color: "#ffffff",
      WebkitTextFillColor: "#ffffff",
      background: "none",
      fontFamily: '"Segoe UI", Arial, Helvetica, sans-serif',
      fontSize: "18px",
      fontWeight: 600,
      lineHeight: 1.15,
      textShadow: "0 2px 5px rgba(0,0,0,.95)",
      zIndex: 20,
      pointerEvents: "none",
    }}
  >
    {language === "es"
      ? "Entradas de fútbol en España"
      : language === "ca"
        ? "Entrades de futbol a Espanya"
        : language === "en"
          ? "Football tickets in Spain"
          : "Eintrittstickets für Fussballspiele"}
  </div>
)}


        <style jsx global>{`
          @media (max-width: 760px) and (hover: none) and (pointer: coarse) {
            .psv2-mobile-subtitle {
              top: calc(
                66px +
                var(--safe-top, 0px) +
                clamp(105px, 18dvh, 155px) +
                38px
              ) !important;
            }
          }
        `}</style>


        <style jsx global>{`
          @media (max-width: 760px) and (hover: none) and (pointer: coarse) {
            /* Startseite: Text kompakter und höher, damit er nicht auf dem Ball sitzt */
            .psv2-mobile-subtitle {
              top: 262px !important;
              width: auto !important;
              max-width: calc(100% - 54px) !important;
              padding: 7px 14px !important;
              border: 1px solid rgba(255,255,255,.34) !important;
              border-radius: 18px !important;
              background: rgba(7,17,31,.28) !important;
              -webkit-background-clip: border-box !important;
              background-clip: border-box !important;
              color: #ffffff !important;
              -webkit-text-fill-color: #ffffff !important;
              font-size: 15px !important;
              line-height: 1.1 !important;
              font-weight: 760 !important;
              letter-spacing: .15px !important;
              text-shadow: 0 2px 8px rgba(0,0,0,.55) !important;
              backdrop-filter: blur(10px) saturate(1.08) !important;
              -webkit-backdrop-filter: blur(10px) saturate(1.08) !important;
            }

            /* Tickets: KI-Suche vollständig unter dem Logo sichtbar */
            .psv2-ticket-page {
              top: 305px !important;
            }

            .psv2-ticket-glass {
              min-height: 132px !important;
              padding: 15px 14px 14px !important;
            }

            .psv2-ticket-head {
              display: flex !important;
              margin-bottom: 12px !important;
            }

            .psv2-ticket-search {
              display: grid !important;
              grid-template-columns: minmax(0, 1fr) 48px !important;
              gap: 8px !important;
            }

            .psv2-ticket-search input {
              display: block !important;
              width: 100% !important;
              min-width: 0 !important;
              height: 48px !important;
              padding: 0 13px !important;
              opacity: 1 !important;
              visibility: visible !important;
              pointer-events: auto !important;
            }

            .psv2-ticket-search-button {
              display: grid !important;
              place-items: center !important;
              width: 48px !important;
              height: 48px !important;
              opacity: 1 !important;
              visibility: visible !important;
              pointer-events: auto !important;
            }

            .psv2-ticket-empty {
              display: block !important;
              margin-top: 10px !important;
              padding: 16px !important;
              text-align: center !important;
              color: #fff !important;
            }
          }
        `}</style>

        {mobilePage === "tickets" && (
          <section className="psv2-ticket-page" aria-label="Tickets">
            <div className="psv2-ticket-glass">
              <div className="psv2-ticket-head">
                <span className="psv2-ticket-ai-icon" aria-hidden="true">✦</span>
                <div>
                  <strong>
                    {language === "es"
                      ? "Buscar entradas con IA"
                      : language === "ca"
                        ? "Cercar entrades amb IA"
                        : language === "en"
                          ? "Find tickets with AI"
                          : "Tickets mit KI suchen"}
                  </strong>
                  <small>
                    {language === "es"
                      ? "Equipo, ciudad o partido"
                      : language === "ca"
                        ? "Equip, ciutat o partit"
                        : language === "en"
                          ? "Team, city or match"
                          : "Team, Stadt oder Spiel"}
                  </small>
                </div>
              </div>

              <div className="psv2-ticket-search">
                <input
                  type="text"
                  value={searchText}
                  onChange={(event) => {
                    setSearchText(event.target.value);
                    if (searchActive) {
                      setSearchActive(false);
                    }
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleSearch();
                    }
                  }}
                  placeholder={
                    language === "es"
                      ? "Ej. Barcelona vs Real Madrid"
                      : language === "ca"
                        ? "Ex. Barcelona vs Real Madrid"
                        : language === "en"
                          ? "e.g. Barcelona vs Real Madrid"
                          : "z. B. Barcelona vs Real Madrid"
                  }
                />
                <button
                  type="button"
                  className="psv2-ticket-search-button"
                  onClick={handleSearch}
                  aria-label={
                    language === "de"
                      ? "Suchen"
                      : language === "en"
                        ? "Search"
                        : language === "ca"
                          ? "Cercar"
                          : "Buscar"
                  }
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="11" cy="11" r="6.5" />
                    <path d="m16 16 4 4" />
                  </svg>
                </button>
              </div>
            </div>

            {visibleOffers.length > 0 ? (
              <div className="psv2-ticket-results">
                {visibleOffers.map((offer, index) => {
                  const offerKey =
                    offer.id || `${offer.home}-${offer.away}-${offer.date}-${index}`;

                  const homeBadge = teamBadges[offer.home];
                  const awayBadge = teamBadges[offer.away];

                  const ticketCount =
                    sellerDetailValue(offer.details || "", "Anzahl Tickets") ||
                    (offer.ticketCount ? String(offer.ticketCount) : "");

                  const numericTicketCount = Math.max(1, Number(ticketCount) || offer.ticketCount || 1);
                  const numericUnitPrice =
                    offer.unitPrice ||
                    Number(offer.price.replace(/[^0-9.,]/g, "").replace(",", ".")) ||
                    0;
                  const unitPriceLabel = `${numericUnitPrice.toFixed(2)}€`;

                  const combinedZone =
                    sellerDetailValue(offer.details || "", "Zone / Tribüne");
                  const tribune =
                    sellerDetailValue(offer.details || "", "Tribüne") ||
                    sellerDetailValue(offer.details || "", "Tribuna") ||
                    combinedZone;
                  const zone =
                    sellerDetailValue(offer.details || "", "Zone") ||
                    sellerDetailValue(offer.details || "", "Zona") ||
                    combinedZone;
                  const sector =
                    sellerDetailValue(offer.details || "", "Sektor") ||
                    sellerDetailValue(offer.details || "", "Sector");
                  const row =
                    sellerDetailValue(offer.details || "", "Reihe") ||
                    sellerDetailValue(offer.details || "", "Fila");
                  const seat =
                    sellerDetailValue(offer.details || "", "Platz") ||
                    sellerDetailValue(offer.details || "", "Sitzplatz") ||
                    sellerDetailValue(offer.details || "", "Asiento") ||
                    sellerDetailValue(offer.details || "", "Seient");

                  const childTickets =
                    sellerDetailValue(offer.details || "", "Kindertickets") ||
                    (offer.childTickets ? String(offer.childTickets) : "");
                  const childDescription = sellerDetailValue(
                    offer.details || "",
                    "Kindertickets Beschreibung"
                  );
                  const competition =
                    sellerDetailValue(offer.details || "", "Wettbewerb");
                  const dateStatus =
                    sellerDetailValue(offer.details || "", "Termin");
                  const dateOpen =
                    dateStatus.toLowerCase().includes("noch nicht bestätigt") ||
                    offer.date.startsWith("2099-12-31");
                  const isExpanded = mobileExpandedOfferId === offerKey;

                  const labels =
                    language === "de"
                      ? { tribune: "TRIBÜNE", zone: "ZONE", sector: "SEKTOR", row: "REIHE", seat: "SITZPLATZ", quantity: "ANZAHL", details: "Mehr Infos", less: "Weniger", buy: "KAUFEN", competition: "Wettbewerb", city: "Ort", children: "Kindertickets", dateOpen: "Termin noch nicht bestätigt" }
                      : language === "en"
                        ? { tribune: "STAND", zone: "ZONE", sector: "SECTOR", row: "ROW", seat: "SEAT", quantity: "QUANTITY", details: "More info", less: "Show less", buy: "BUY", competition: "Competition", city: "City", children: "Child tickets", dateOpen: "Date not confirmed yet" }
                        : language === "ca"
                          ? { tribune: "TRIBUNA", zone: "ZONA", sector: "SECTOR", row: "FILA", seat: "SEIENT", quantity: "QUANTITAT", details: "Més informació", less: "Mostra menys", buy: "COMPRAR", competition: "Competició", city: "Ciutat", children: "Entrades infantils", dateOpen: "Data encara no confirmada" }
                          : { tribune: "TRIBUNA", zone: "ZONA", sector: "SECTOR", row: "FILA", seat: "ASIENTO", quantity: "CANTIDAD", details: "Más información", less: "Mostrar menos", buy: "COMPRAR", competition: "Competición", city: "Ciudad", children: "Entradas infantiles", dateOpen: "Fecha aún no confirmada" };

                  return (
                    <article
                      className={`psv2-ticket-result${isExpanded ? " psv2-ticket-result-expanded" : ""}`}
                      key={offerKey}
                      role="button"
                      tabIndex={0}
                      aria-expanded={isExpanded}
                      onClick={() =>
                        setMobileExpandedOfferId(isExpanded ? null : offerKey)
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setMobileExpandedOfferId(isExpanded ? null : offerKey);
                        }
                      }}
                    >
                      <div className="psv2-real-ticket">
                        <div className="psv2-real-ticket-body">
                          <div className="psv2-ticket-match">
                            <div className="psv2-ticket-team">
                              {homeBadge ? <img src={homeBadge} alt="" aria-hidden="true" /> : <span className="psv2-ticket-badge-fallback">⚽</span>}
                              <strong>{offer.home}</strong>
                            </div>
                            <span className="psv2-ticket-vs">VS</span>
                            <div className="psv2-ticket-team">
                              {awayBadge ? <img src={awayBadge} alt="" aria-hidden="true" /> : <span className="psv2-ticket-badge-fallback">⚽</span>}
                              <strong>{offer.away}</strong>
                            </div>
                          </div>

                          {competition && <div className="psv2-ticket-competition">{competition}</div>}
                          <div className="psv2-ticket-date">{dateOpen ? labels.dateOpen : offer.date}</div>
                          <div className="psv2-ticket-stadium">{offer.stadium}{offer.city ? ` · ${offer.city}` : ""}</div>

                          <div className="psv2-ticket-facts-grid">
                            {tribune && <div><span>{labels.tribune}</span><b>{tribune}</b></div>}
                            {zone && zone !== tribune && <div><span>{labels.zone}</span><b>{zone}</b></div>}
                            {sector && <div><span>{labels.sector}</span><b>{sector}</b></div>}
                            {row && <div><span>{labels.row}</span><b>{row}</b></div>}
                            {seat && <div><span>{labels.seat}</span><b>{seat}</b></div>}
                            {ticketCount && <div><span>{labels.quantity}</span><b>{ticketCount}</b></div>}
                          </div>

                          <span className="psv2-ticket-detail-hint">
                            {isExpanded ? `${labels.less} ▲` : `${labels.details} ▼`}
                          </span>
                        </div>

                        <div className="psv2-ticket-stub" aria-hidden="true">
                          <span className="psv2-ticket-stub-brand">PASESPAIN</span>
                          <div className="psv2-ticket-barcode">
                            {Array.from({ length: 24 }, (_, barIndex) => <i key={barIndex} />)}
                          </div>
                          <strong>{unitPriceLabel}</strong>
                          <small>pro Ticket</small>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="psv2-ticket-expanded" onClick={(event) => event.stopPropagation()}>
                          {competition && <div><span>{labels.competition}</span><b>{competition}</b></div>}
                          {tribune && <div><span>{labels.tribune}</span><b>{tribune}</b></div>}
                          {zone && zone !== tribune && <div><span>{labels.zone}</span><b>{zone}</b></div>}
                          {sector && <div><span>{labels.sector}</span><b>{sector}</b></div>}
                          {row && <div><span>{labels.row}</span><b>{row}</b></div>}
                          {seat && <div><span>{labels.seat}</span><b>{seat}</b></div>}
                          {ticketCount && <div><span>{labels.quantity}</span><b>{ticketCount}</b></div>}
                          {childTickets && Number(childTickets) > 0 && <div><span>{labels.children}</span><b>{childTickets}{childDescription ? ` · ${childDescription}` : ""}</b></div>}
                          {offer.city && <div><span>{labels.city}</span><b>{offer.city}</b></div>}
                          <button
                            className="psv2-ticket-buy-button"
                            type="button"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              addToCart(offer);
                              setCartOpen(true);
                            }}
                          >
                            {labels.buy} · {unitPriceLabel}
                          </button>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="psv2-ticket-results psv2-ticket-empty">
                {language === "de"
                  ? "Aktuell sind keine PaseSpain-Tickets verfügbar."
                  : language === "en"
                    ? "There are currently no PaseSpain tickets available."
                    : language === "ca"
                      ? "Actualment no hi ha entrades de PaseSpain disponibles."
                      : "Actualmente no hay entradas de PaseSpain disponibles."}
              </div>
            )}
          </section>
        )}

        {mobilePage === "sell" && (
          <section className="psv2-seller-page" aria-label="Verkaufen">
            <div className="psv2-seller-glass">
              <div className="psv2-seller-head">
                <span className="psv2-seller-icon" aria-hidden="true">
                  <svg viewBox="0 0 32 32">
                    <path d="M6 7h12l8 8-11 11L6 17Z" />
                    <circle cx="11" cy="12" r="2.1" />
                  </svg>
                </span>

                <div>
                  <strong>
                    {language === "es"
                      ? "Vender entrada"
                      : language === "ca"
                        ? "Vendre entrada"
                        : language === "en"
                          ? "Sell ticket": "Ticket verkaufen"}
                  </strong>
                  <small>
                    {language === "es"
                      ? "Inicia sesión o regístrate para publicar tu entrada"
                      : language === "ca"
                        ? "Inicia sessió o registra't per publicar la teva entrada"
                        : language === "en"
                          ? "Log in or register to list your ticket"
                          : "Anmelden oder registrieren, um ein Ticket anzubieten"}
                  </small>
                </div>
              </div>

              {loggedInRole === "seller" ? (
                <div className="psv2-seller-logged-in">
                  <button
                    type="button"
                    onClick={() => {
                      setSellerPublishError("");
                      setSellerModalOpen(true);
                    }}
                  >
                    {language === "de"
                      ? "Neues Ticket anbieten"
                      : language === "en"
                        ? "List a new ticket"
                        : language === "ca"
                          ? "Publicar una entrada nova"
                          : "Publicar una entrada nueva"}
                  </button>

                  {sellerOwnOffers.length > 0 && (
                    <div className="psv2-seller-own-list">
                      {sellerOwnOffers.map(offer => (
                        <div
                          className="psv2-seller-own-ticket"
                          key={offer.id}
                        >
                          <strong>{offer.home} – {offer.away}</strong>
                          <small>{offer.date} · {offer.stadium}</small>

                          <div className="psv2-seller-ticket-facts">
                            {sellerDetailValue(offer.details || "", "Anzahl Tickets") && (
                              <span>
                                {sellerDetailValue(offer.details || "", "Anzahl Tickets")} Tickets
                              </span>
                            )}
                            {sellerDetailValue(offer.details || "", "Zone / Tribüne") && (
                              <span>
                                {sellerDetailValue(offer.details || "", "Zone / Tribüne")}
                              </span>
                            )}
                            {(sellerDetailValue(offer.details || "", "Reihe") ||
                              sellerDetailValue(offer.details || "", "Sektor")) && (
                              <span>
                                {language === "de" ? "Reihe" : language === "en" ? "Row" : "Fila"}{" "}
                                {sellerDetailValue(offer.details || "", "Reihe") ||
                                  sellerDetailValue(offer.details || "", "Sektor")}
                              </span>
                            )}
                          </div>

                          <div className="seller-price-actions">
                            {sellerPriceEditId === offer.id ? (
                              <>
                                <input
                                  className="seller-price-input"
                                  inputMode="decimal"
                                  value={sellerPriceEditValue}
                                  onChange={event =>
                                    setSellerPriceEditValue(event.target.value)
                                  }
                                />
                                <button
                                  className="seller-price-save-button"
                                  type="button"
                                  disabled={sellerPriceUpdating}
                                  onClick={() => handleSellerPriceUpdate(offer)}
                                >
                                  {language === "de"
                                    ? "Speichern"
                                    : language === "en"
                                      ? "Save"
                                      : language === "ca"
                                        ? "Desar"
                                        : "Guardar"}
                                </button>
                                <button
                                  className="seller-price-cancel-button"
                                  type="button"
                                  onClick={() => {
                                    setSellerPriceEditId(null);
                                    setSellerPriceEditValue("");
                                    setSellerPriceEditError("");
                                  }}
                                >
                                  ×
                                </button>
                              </>
                            ) : (
                              <>
                                <span className="seller-current-price">
                                  {offer.price}
                                </span>
                                <button
                                  className="seller-price-edit-button"
                                  type="button"
                                  onClick={() => {
                                    setSellerPriceEditId(offer.id || null);
                                    setSellerPriceEditValue(offer.price.replace("€", ""));
                                    setSellerPriceEditError("");
                                  }}
                                >
                                  {language === "de"
                                    ? "Preis ändern"
                                    : language === "en"
                                      ? "Change price"
                                      : language === "ca"
                                        ? "Canviar preu"
                                        : "Cambiar precio"}
                                </button>
                              </>
                            )}

                            <button
                              className="seller-offer-edit-button"
                              type="button"
                              onClick={() => startSellerOfferEdit(offer)}
                            >
                              {language === "de"
                                ? "Bearbeiten"
                                : language === "en"
                                  ? "Edit"
                                  : "Editar"}
                            </button>

                            <button
                              className="seller-offer-delete-button"
                              type="button"
                              disabled={sellerOfferDeletingId === offer.id}
                              onClick={() => handleSellerOfferDelete(offer)}
                            >
                              {sellerOfferDeletingId === offer.id
                                ? language === "de"
                                  ? "Löschen …"
                                  : language === "en"
                                    ? "Deleting …"
                                    : "Eliminando …"
                                : language === "de"
                                  ? "Löschen"
                                  : language === "en"
                                    ? "Delete"
                                    : "Eliminar"}
                            </button>
                          </div>
                        </div>
                      ))}

                      {sellerPriceEditError && (
                        <p className="market-error">
                          {sellerPriceEditError}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="psv2-account-hint psv2-account-hint-seller">
                  {language === "de"
                    ? "Als Verkäufer über Konto anmelden oder registrieren."
                    : language === "en"
                      ? "Sign in or register as a seller via Account."
                      : language === "ca"
                        ? "Inicia sessió o registra't com a venedor des de Compte."
                        : "Inicia sesión o regístrate como vendedor desde Cuenta."}
                </div>
              )}
            </div>
          </section>
        )}

        {mobilePage === "more" && (
          <section className="psv2-more-page" aria-label="Mehr">
            <div className="psv2-more-glass">
              <div className="psv2-more-head">
                <span className="psv2-more-icon" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>

                <div>
                  <strong>
                    {language === "es"
                      ? "Más"
                      : language === "ca"
                        ? "Més"
                        : language === "en"
                          ? "More"
                          : "Mehr"}
                  </strong>
                  <small>
                    {language === "es"
                      ? "Síguenos o contáctanos"
                      : language === "ca"
                        ? "Segueix-nos o contacta'ns"
                        : language === "en"
                          ? "Follow or contact us"
                          : "Folgen oder kontaktieren Sie uns"}
                  </small>
                </div>
              </div>

              <div className="psv2-social-grid">
                <a
                  href="https://www.facebook.com/"
                  onClick={(event) => {
                    event.preventDefault();
                    window.open("https://www.facebook.com/", "_blank", "noopener,noreferrer");
                  }}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="psv2-social-card facebook"
                >
                  <span>f</span>
                  <small>Facebook</small>
                </a>

                <a
                  href="https://www.instagram.com/pasespain/"
                  onClick={(event) => {
                    event.preventDefault();
                    window.open("https://www.instagram.com/pasespain/", "_blank", "noopener,noreferrer");
                  }}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="psv2-social-card instagram"
                >
                  <span>◎</span>
                  <small>Instagram</small>
                </a>

                <a
                  href="https://www.tiktok.com/"
                  onClick={(event) => {
                    event.preventDefault();
                    window.open("https://www.tiktok.com/", "_blank", "noopener,noreferrer");
                  }}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="TikTok"
                  className="psv2-social-card tiktok"
                >
                  <span>♪</span>
                  <small>TikTok</small>
                </a>

                <a
                  href="https://www.threads.com/@pasespain"
                  onClick={(event) => {
                    event.preventDefault();
                    window.open("https://www.threads.com/@pasespain", "_blank", "noopener,noreferrer");
                  }}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Threads"
                  className="psv2-social-card threads"
                >
                  <span>@</span>
                  <small>Threads</small>
                </a>

                <a
                  href="https://wa.me/34624860990"
                  onClick={(event) => {
                    event.preventDefault();
                    window.open("https://wa.me/34624860990", "_blank", "noopener,noreferrer");
                  }}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="psv2-social-card whatsapp"
                >
                  <span className="psv2-whatsapp-handset" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <path d="M6.6 2.8 9.2 7c.3.5.2 1.1-.2 1.5l-1.4 1.4c1.1 2.3 2.9 4.1 5.2 5.2l1.4-1.4c.4-.4 1-.5 1.5-.2l4.2 2.6c.5.3.7.9.5 1.5l-.8 2.4c-.2.7-.9 1.1-1.6 1.1C9.8 21.1 2.9 14.2 2.9 5.9c0-.7.4-1.4 1.1-1.6l2.4-.8c.5-.2 1.1 0 1.5.5Z" />
                    </svg>
                  </span>
                  <small>WhatsApp</small>
                </a>


              </div>

              <div className="psv2-spoken-languages">
                <strong>
                  {language === "es"
                    ? "Hablamos"
                    : language === "ca"
                      ? "Parlem"
                      : language === "en"
                        ? "We speak"
                        : "Wir sprechen"}
                </strong>

                <div className="psv2-spoken-flags" aria-label="Wir sprechen">
                  <span className="psv2-spoken-flag flag-es" aria-label="Spanisch" />
                  <span className="psv2-spoken-flag flag-fr" aria-label="Französisch" />
                  <span className="psv2-spoken-flag flag-it" aria-label="Italienisch" />
                  <svg
                    className="psv2-spoken-flag psv2-spoken-flag-gb-svg"
                    viewBox="0 0 60 36"
                    aria-label="Englisch"
                    role="img"
                  >
                    <rect width="60" height="36" fill="#012169" />
                    <path d="M0 0 L60 36 M60 0 L0 36" stroke="#FFFFFF" strokeWidth="7.2" />
                    <path d="M0 0 L25 15" stroke="#C8102E" strokeWidth="3.6" />
                    <path d="M60 36 L35 21" stroke="#C8102E" strokeWidth="3.6" />
                    <path d="M60 0 L35 15" stroke="#C8102E" strokeWidth="3.6" />
                    <path d="M0 36 L25 21" stroke="#C8102E" strokeWidth="3.6" />
                    <rect x="25" y="0" width="10" height="36" fill="#FFFFFF" />
                    <rect x="0" y="13" width="60" height="10" fill="#FFFFFF" />
                    <rect x="27" y="0" width="6" height="36" fill="#C8102E" />
                    <rect x="0" y="15" width="60" height="6" fill="#C8102E" />
                  </svg>
                  <span className="psv2-spoken-flag flag-de" aria-label="Deutsch" />
                </div>
              </div>

              <button
                type="button"
                className="psv2-info-card psv2-amelia-help"
                onClick={() => setVoiceAssistantOpen(true)}
                aria-label={language === "de" ? "Mit Amelia sprechen" : language === "en" ? "Talk to Amelia" : language === "ca" ? "Parla amb Amelia" : "Hablar con Amelia"}
              >
                <div className="psv2-info-card-icon psv2-info-card-mic" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <rect x="8" y="3" width="8" height="12" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
                    <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3M8.5 21h7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="psv2-info-card-copy">
                  <strong>
                    {language === "es"
                      ? "Información y ayuda"
                      : language === "ca"
                        ? "Informació i ajuda"
                        : language === "en"
                          ? "Information & help"
                          : "Information & Hilfe"}
                  </strong>
                  <small>
                    {language === "es"
                      ? "Preguntas sobre entradas, compra o venta"
                      : language === "ca"
                        ? "Preguntes sobre entrades, compra o venda"
                        : language === "en"
                          ? "Questions about tickets, buying or selling"
                          : "Fragen zu Tickets, Kauf oder Verkauf"}
                  </small>
                </div>
              </button>

              <div className="psv2-legal-links">
                <a href={`/terminos?lang=${language}`}>
                  {language === "de"
                    ? "AGB"
                    : language === "en"
                      ? "Terms"
                      : language === "ca"
                        ? "Condicions"
                        : "Términos"}
                </a>
                <span>·</span>
                <a href={`/privacidad?lang=${language}`}>
                  {language === "de"
                    ? "Datenschutz"
                    : language === "en"
                      ? "Privacy"
                      : language === "ca"
                        ? "Privacitat"
                        : "Privacidad"}
                </a>
                <span>·</span>
                <a href={`/aviso-legal?lang=${language}`}>
                  {language === "de"
                    ? "Impressum"
                    : language === "en"
                      ? "Legal notice"
                      : language === "ca"
                        ? "Avís legal"
                        : "Aviso legal"}
                </a>
              </div>
            </div>
          </section>
        )}

        <nav className="psv2-mobile-nav" aria-label="Mobile Navigation">
          <button
            type="button"
            className={mobilePage === "home" ? "is-active nav-home" : "nav-home"}
            onClick={() => setMobilePage("home")}
          >
            <span className="psv2-mobile-nav-icon" aria-hidden="true">
              <svg viewBox="0 0 32 32">
                <path d="M5 15.5 16 6l11 9.5V27a2 2 0 0 1-2 2h-6v-8h-6v8H7a2 2 0 0 1-2-2Z" />
              </svg>
            </span>
            <span className="psv2-mobile-nav-text">
              {language === "es"
                ? "Inicio"
                : language === "ca"
                  ? "Inici"
                  : language === "en"
                    ? "Home"
                    : "Start"}
            </span>
            <span className="psv2-mobile-nav-line" aria-hidden="true" />
          </button>

          <button
            type="button"
            className={mobilePage === "tickets" ? "is-active nav-tickets" : "nav-tickets"}
            onClick={() => setMobilePage("tickets")}
          >
            <span className="psv2-mobile-nav-icon" aria-hidden="true">
              <svg viewBox="0 0 32 32">
                <path d="M7 8h18a2 2 0 0 1 2 2v4a3 3 0 0 0 0 6v4a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-4a3 3 0 0 0 0-6v-4a2 2 0 0 1 2-2Z" />
                <circle cx="16" cy="17" r="2.2" />
              </svg>
            </span>
            <span className="psv2-mobile-nav-text">Tickets</span>
            <span className="psv2-mobile-nav-line" aria-hidden="true" />
          </button>

          <button
            type="button"
            className={mobilePage === "sell" ? "is-active nav-sell" : "nav-sell"}
            onClick={() => setMobilePage("sell")}
          >
            <span className="psv2-mobile-nav-icon" aria-hidden="true">
              <svg viewBox="0 0 32 32">
                <path d="M6 7h12l8 8-11 11L6 17Z" />
                <circle cx="11" cy="12" r="2.1" />
              </svg>
            </span>
            <span className="psv2-mobile-nav-text">
              {language === "es"
                ? "Vender"
                : language === "ca"
                  ? "Vendre"
                  : language === "en"
                    ? "Sell"
                    : "Verkaufen"}
            </span>
            <span className="psv2-mobile-nav-line" aria-hidden="true" />
          </button>

          <button
            type="button"
            className={mobilePage === "more" ? "is-active nav-more" : "nav-more"}
            onClick={() => setMobilePage("more")}
          >
            <span className="psv2-mobile-nav-icon psv2-mobile-nav-more" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span className="psv2-mobile-nav-text">
              {language === "es"
                ? "Más"
                : language === "ca"
                  ? "Més"
                  : language === "en"
                    ? "More"
                    : "Mehr"}
            </span>
            <span className="psv2-mobile-nav-line" aria-hidden="true" />
          </button>
        </nav>
      </section>

      <div className={`page-shell glass-shell${sellerModalOpen ? " seller-modal-active" : ""}`}>
        <header className="header" id="mobile-start">
          <div className="brand-area">
            <div className="brand-text">
              <span className="brand-pase">
                Pase
              </span>

              <span className="brand-spain">
                Spain
              </span>

              <span className="brand-window-handwriting">
                {t.windowTitle}
              </span>
            </div>

          </div>

          <div className="header-right">
            <div className="language-switch">
              <button
                className={`language-flag language-es ${
                  language ===
                  "es"
                    ? "language-active"
                    : ""
                }`}
                onClick={() =>
                  setLanguage(
                    "es"
                  )
                }
                type="button"
                aria-label={
                  languageLabels
                    .es
                }
                title={
                  languageLabels
                    .es
                }
              />

              <button
                className={`language-flag language-ca ${
                  language ===
                  "ca"
                    ? "language-active"
                    : ""
                }`}
                onClick={() =>
                  setLanguage(
                    "ca"
                  )
                }
                type="button"
                aria-label={
                  languageLabels
                    .ca
                }
                title={
                  languageLabels
                    .ca
                }
              />

              <button
                className={`language-flag language-en ${
                  language ===
                  "en"
                    ? "language-active"
                    : ""
                }`}
                onClick={() =>
                  setLanguage(
                    "en"
                  )
                }
                type="button"
                aria-label={
                  languageLabels
                    .en
                }
                title={
                  languageLabels
                    .en
                }
              />

              <button
                className={`language-flag language-de ${
                  language ===
                  "de"
                    ? "language-active"
                    : ""
                }`}
                onClick={() =>
                  setLanguage(
                    "de"
                  )
                }
                type="button"
                aria-label={
                  languageLabels
                    .de
                }
                title={
                  languageLabels
                    .de
                }
              />
            </div>

            <div className="header-actions">

              <button
                className={`icon-button neutral-glass modern-icon-button account-action ${
                  loggedInRole
                    ? "account-status-online"
                    : "account-status-offline"
                }`}
                aria-label={
                  loggedInRole
                    ? language === "de"
                      ? "Konto"
                      : language === "en"
                        ? "Account"
                        : language === "ca"
                          ? "Compte"
                          : "Cuenta"
                    : language === "de"
                      ? "Konto"
                      : language === "en"
                        ? "Account"
                        : language === "ca"
                          ? "Compte"
                          : "Cuenta"
                }
                title={
                  loggedInRole
                    ? language === "de"
                      ? "Konto"
                      : language === "en"
                        ? "Account"
                        : language === "ca"
                          ? "Compte"
                          : "Cuenta"
                    : language === "de"
                      ? "Anmelden / Registrieren"
                      : language === "en"
                        ? "Sign in / Register"
                        : language === "ca"
                          ? "Iniciar sessió / Registrar-se"
                          : "Iniciar sesión / Registrarse"
                }
                type="button"
                onClick={() => {
                  if (loggedInRole) {
                    setAccountDeleteError("");
                    setAccountManageOpen(true);
                    return;
                  }

                  setActiveAuthRole("buyer");
                  setAuthMode("login");
                  setAuthError("");
                  setAuthModalOpen(true);
                }}
              >
                <span className="header-action-label">
                  {
                    loggedInRole
                      ? language === "de"
                        ? "Konto"
                        : language === "en"
                          ? "Account"
                          : language === "ca"
                            ? "Compte"
                            : "Cuenta"
                      : language === "de"
                        ? "Konto"
                        : language === "en"
                          ? "Account"
                          : language === "ca"
                            ? "Compte"
                            : "Cuenta"
                  }
                </span>
              </button>

              <button
                className="icon-button neutral-glass modern-icon-button cart header-action-red"
                aria-label={t.cart}
                type="button"
                onClick={() =>
                  setCartOpen(
                    true
                  )
                }
              >
                <span className="header-action-label">{t.cart}</span>

                <span className="cart-count">
                  {
                    cartItems.length
                  }
                </span>
              </button>
            </div>
          </div>
        </header>

        <div className="hero-category-zone">
          <section className="hero">
            <div className="hero-copy">
              <h1>
                {
                  t.hero1
                }

                <br />

                {
                  t.hero2
                }{" "}

                <span className="gradient-text">
                  {
                    t.live
                  }
                </span>
              </h1>
            </div>

            <div className="hero-art">
              <Image
                src="/pasespain-logo-transparent.png"
                alt="PaseSpain"
                width={700}
                height={700}
                priority
                className="hero-logo"
              />
            </div>
          </section>

          <section className="category-grid" id="mobile-tickets">
            {
              t.categories.map(
                ([
                  title,
                  text,
                ]) => (
                  <article
                    className="category-card neutral-glass"
                    key={
                      title
                    }
                  >
                    <div>
                      <h3>
                        {
                          title
                        }
                      </h3>

                      <p>
                        {
                          text
                        }
                      </p>
                    </div>
                  </article>
                )
              )
            }
          </section>
        </div>

        <section className={`smart-grid mobile-page-ai ${mobilePage === "tickets" ? "mobile-page-active" : ""}`} id="mobile-ai">
          <article className="smart-card neutral-glass amelia-home-card">
            <button
              type="button"
              className="amelia-home-button"
              onClick={() => setVoiceAssistantOpen(true)}
              aria-label={language === "de" ? "Mit Amelia sprechen" : language === "en" ? "Talk to Amelia" : language === "ca" ? "Parla amb Amelia" : "Hablar con Amelia"}
              title={language === "de" ? "Mit Amelia sprechen" : language === "en" ? "Talk to Amelia" : language === "ca" ? "Parla amb Amelia" : "Hablar con Amelia"}
            >
              <span className="amelia-home-portrait" aria-hidden="true">
                <Image
                  src="/amelia-kachel.png"
                  alt=""
                  fill
                  sizes="320px"
                  className="amelia-home-image"
                />
              </span>
              <span className="amelia-home-copy">
                <strong className="amelia-signature">Amelia</strong>
                <span className="amelia-home-cta">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="8" y="3" width="8" height="12" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
                    <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3M8.5 21h7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  {language === "de" ? "Mit Amelia sprechen" : language === "en" ? "Talk to Amelia" : language === "ca" ? "Parla amb Amelia" : "Hablar con Amelia"}
                </span>
              </span>
            </button>
          </article>

          <article className="smart-card neutral-glass">
            <div className="smart-head smart-head-clean">
              <div>
                <h2>
                  {
                    t.mapTitle
                  }
                </h2>

                <p>
                  {
                    t.mapText
                  }
                </p>
              </div>
            </div>

            <a
              className="map-preview google-map-preview"
              href="https://www.google.com/maps/search/football+stadiums+Spain"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={
                t.mapTitle
              }
            >
              <iframe
                src="https://www.google.com/maps?q=40.2,-3.7&z=5&output=embed"
                title="Google Maps"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="google-map-frame"
              />

              <span className="map-click-layer" />
            </a>

            <div className="social-site-link map-site-link" aria-label="www.pasespain.es">
              <span>www.</span>
              <span className="social-site-pase">pase</span>
              <span className="social-site-spain">spain</span>
              <span>.es</span>
            </div>
          </article>

          <aside
            className={`smart-card weather-panel neutral-glass ${weatherClass}`}
          >
            <div
              className="weather-visual"
              aria-hidden="true"
            >
              <span className="weather-visual-sun" />

              <span className="weather-visual-cloud weather-cloud-one" />

              <span className="weather-visual-cloud weather-cloud-two" />

              <span className="weather-rain-lines">
                <i />
                <i />
                <i />
                <i />
                <i />
              </span>
            </div>

            <div className="weather-heading">
              <div>
                <span className="weather-label">
                  {
                    t.weatherTitle
                  }
                </span>

                <h2>
                  {
                    weather.city
                  }
                </h2>
              </div>

              <strong className="weather-temp">
                {
                  weather.temperature
                }
                °
              </strong>
            </div>

            <div className="weather-condition">
              {
                weatherText(
                  weather.type
                )
              }
            </div>

            <div className="weather-meta">
              <div>
                <span>
                  {
                    t.rain
                  }
                </span>

                <strong>
                  {
                    weather.rain
                  }
                  %
                </strong>
              </div>

              <div>
                <span>
                  {
                    t.wind
                  }
                </span>

                <strong>
                  {
                    weather.wind
                  }{" "}
                  km/h
                </strong>
              </div>
            </div>

            <div className="weather-forecast">
              {
                weather.forecast.map(
                  (
                    item,
                    index
                  ) => (
                    <div
                      className="forecast-item"
                      key={`${item.day}-${index}`}
                    >
                      <span>
                        {
                          forecastDay(
                            item.day
                          )
                        }
                      </span>

                      <strong>
                        {
                          item.temp
                        }
                        °
                      </strong>

                      <small>
                        {
                          weatherText(
                            item.type
                          )
                        }
                      </small>
                    </div>
                  )
                )
              }
            </div>
          </aside>

          <div className="social-fairplay-stack">
          <article className={`smart-card neutral-glass social-card mobile-page-home ${mobilePage === "home" ? "mobile-page-active" : ""}`} id="mobile-more">
            <div className="smart-head smart-head-clean">
              <div>
                <h2>
                  {
                    language === "de"
                      ? "Folge oder kontaktiere uns"
                      : language === "en"
                        ? "Follow or contact us"
                        : language === "ca"
                          ? "Segueix-nos o contacta'ns"
                          : "Síguenos o contáctanos"
                  }
                </h2>
              </div>
            </div>

            <div className="social-apps social-apps-only">
              <div className="social-links-grid">
              <a
                className="social-app-button social-facebook"
                href="https://www.facebook.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                title="Facebook"
              >
                <span aria-hidden="true">f</span>
              </a>

              <a
                className="social-app-button social-instagram"
                href="https://www.instagram.com/pasespain/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                title="Instagram"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect
                    x="3"
                    y="3"
                    width="18"
                    height="18"
                    rx="5"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="4"
                  />
                  <circle
                    cx="17.4"
                    cy="6.6"
                    r="1"
                    fill="currentColor"
                    stroke="none"
                  />
                </svg>
              </a>

              <a
                className="social-app-button social-tiktok"
                href="https://www.tiktok.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                title="TikTok"
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fill="currentColor"
                    d="M15.1 3.6c.6 1.5 1.7 2.6 3.2 3.2v3.1a8.6 8.6 0 0 1-3.2-.8v5.6a5.6 5.6 0 1 1-4.8-5.5v3.2a2.5 2.5 0 1 0 1.7 2.4V3.6h3.1Z"
                  />
                </svg>
              </a>

              <a
                className="social-app-button social-threads"
                href="https://www.threads.com/@pasespain"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Threads"
                title="Threads"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 3.2c5.2 0 8.8 3.7 8.8 9.2 0 4.7-2.6 8.4-7.5 8.4-3.7 0-6.2-2.1-6.2-5.1 0-2.7 2-4.5 5-4.5 2.1 0 3.9.7 5.1 2" />
                  <path d="M17.2 13.3c-.4 3.4-2.2 5-4.7 5-1.8 0-3-.9-3-2.4 0-1.4 1.1-2.3 2.9-2.3 2.3 0 4.1.8 5.6 2.1" />
                  <path d="M7.3 7.9c1.2-1.5 2.8-2.2 4.8-2.2 3 0 5.2 1.8 5.2 4.9" />
                </svg>
              </a>

              <a
                className="social-app-button social-whatsapp"
                href="https://wa.me/34624860990"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                title="WhatsApp"
              >
                <svg
                  viewBox="0 0 32 32"
                  aria-hidden="true"
                >
                  <path
                    fill="#ffffff"
                    d="M16 4.2c-6.3 0-11.4 4.8-11.4 10.8 0 2.1.6 4.2 1.8 5.9L4.8 27l6.3-1.6c1.5.7 3.1 1.1 4.9 1.1 6.3 0 11.4-4.8 11.4-10.8S22.3 4.2 16 4.2Zm0 19.8c-1.5 0-3-.4-4.3-1.1l-.4-.2-3.8 1 1-3.6-.2-.4c-.9-1.4-1.4-3-1.4-4.7 0-4.8 4.1-8.7 9.1-8.7s9.1 3.9 9.1 8.7-4.1 9-9.1 9Z"
                  />
                  <path
                    fill="#ffffff"
                    d="M21.4 17.7c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.4.2-.7.1-1.8-.8-3-1.7-4.2-3.7-.3-.5.3-.5.8-1.6.1-.2.1-.5 0-.7l-.9-2.1c-.2-.5-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1.1 1-1.1 2.5s1.1 2.9 1.2 3.1c.2.2 2.2 3.3 5.3 4.6.7.3 1.3.5 1.8.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.6.2-1.2.2-1.3-.1-.2-.3-.3-.6-.5Z"
                  />
                </svg>
              </a>
              </div>

            </div>

            <div className="social-languages">
              <span className="social-languages-label">
                {
                  language === "de"
                    ? "Wir sprechen:"
                    : language === "en"
                      ? "We speak:"
                      : language === "ca"
                        ? "Parlem:"
                        : "Hablamos:"
                }
              </span>

              <div className="social-language-flags" aria-label="Sprachen">
                <span className="social-language-flag flag-es" title="Español" />
                <span className="social-language-flag flag-fr" title="Français" />
                <span className="social-language-flag flag-it" title="Italiano" />
                <span className="social-language-flag flag-en" title="English" />
                <span className="social-language-flag flag-de" title="Deutsch" />
              </div>
            </div>
          </article>

          <div className="fairplay-tile" aria-label="PaseSpain Fairplay">
            <div className="fairplay-tile-watermark" aria-hidden="true">
              <span className="fairplay-watermark-card fairplay-watermark-red" />
              <span className="fairplay-watermark-card fairplay-watermark-yellow" />
            </div>

            <div className="fairplay-tile-content">
              <span className="fairplay-tile-title">FAIRPLAY</span>

              <button
                type="button"
                className="fairplay-football-button"
                onClick={() => setFairplayOpen(true)}
                aria-label="PaseSpain Fairplay öffnen"
                title="PaseSpain Fairplay"
              >
                <span aria-hidden="true">⚽</span>
              </button>
            </div>
          </div>
          </div>
        </section>

        <section className={`content-grid mobile-page-tickets ${mobilePage === "tickets" ? "mobile-page-active" : ""}`} id="mobile-offers">
          <div className="matches-panel neutral-glass">
            <div className="panel-heading">
              <div>
                <h2>
                  {
                    searchActive
                      ? t.searchResults
                      : t.recommendations
                  }
                </h2>

                {
                  searchActive && (
                    <span className="result-count">
                      {
                        visibleOffers
                          .length
                      }{" "}

                      {
                        t.found
                      }
                    </span>
                  )
                }
              </div>

              {
                searchActive
                  ? (
                    <button
                      type="button"
                      onClick={
                        handleResetSearch
                      }
                    >
                      {
                        t.resetSearch
                      }{" "}
                      ×
                    </button>
                  )
                  : (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchText("");
                        setSearchActive(false);
                      }}
                    >
                      {
                        t.showAll
                      }{" "}
                      →
                    </button>
                  )
              }
            </div>

            <div className="match-grid">
              {
                !searchActive && visibleOffers.length === 0 ? (
                  <div className="offers-empty-state">
                    {language === "de"
                      ? "Aktuell sind noch keine Tickets im Verkauf."
                      : language === "en"
                        ? "There are currently no tickets for sale."
                        : language === "ca"
                          ? "Actualment no hi ha entrades a la venda."
                          : "Actualmente no hay entradas a la venta."}
                  </div>
                ) : visibleOffers.map(
                  (
                    offer,
                    index
                  ) => {
                    const homeBadge =
                      teamBadges[
                        offer.home
                      ];

                    const awayBadge =
                      teamBadges[
                        offer.away
                      ];

                    return (
                      <article
                        className={`match-card pases-ticket-card${mobileExpandedOfferId === (offer.id || `${offer.home}-${offer.away}-${offer.date}-${index}`) ? " pases-ticket-card-open" : ""}`}
                        key={`${offer.home}-${offer.away}-${index}`}
                        data-ticket-city={offer.city}
                        tabIndex={0}
                        role="button"
                        aria-expanded={mobileExpandedOfferId === (offer.id || `${offer.home}-${offer.away}-${offer.date}-${index}`)}
                        onMouseEnter={() => setSelectedCity(offer.city)}
                        onFocus={() => setSelectedCity(offer.city)}
                        onClick={() => {
                          setSelectedCity(offer.city);
                          const ticketKey = offer.id || `${offer.home}-${offer.away}-${offer.date}-${index}`;
                          setMobileExpandedOfferId(mobileExpandedOfferId === ticketKey ? null : ticketKey);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            const ticketKey = offer.id || `${offer.home}-${offer.away}-${offer.date}-${index}`;
                            setMobileExpandedOfferId(mobileExpandedOfferId === ticketKey ? null : ticketKey);
                          }
                        }}
                      >
                        <div className="pases-ticket-paper">
                          <div className="pases-ticket-main">
                            <div className="pases-ticket-clubs">
                              <div className="pases-ticket-club">
                                {homeBadge && <img src={homeBadge} alt="" aria-hidden="true" />}
                                <strong>{offer.home}</strong>
                              </div>
                              <span className="pases-ticket-vs">VS</span>
                              <div className="pases-ticket-club">
                                {awayBadge && <img src={awayBadge} alt="" aria-hidden="true" />}
                                <strong>{offer.away}</strong>
                              </div>
                            </div>

                            <div className="pases-ticket-meta">
                              {sellerDetailValue(offer.details, "Wettbewerb") && (
                                <b>{sellerDetailValue(offer.details, "Wettbewerb")}</b>
                              )}
                              <span>{offer.date}</span>
                              <span>{offer.stadium}</span>
                            </div>

                            <div className="pases-ticket-facts">
                              <div><small>{language === "de" ? "TRIBÜNE / ZONE" : language === "en" ? "STAND / ZONE" : language === "ca" ? "TRIBUNA / ZONA" : "TRIBUNA / ZONA"}</small><b>{sellerDetailValue(offer.details, "Zone / Tribüne") || "—"}</b></div>
                              <div><small>{language === "de" ? "REIHE" : language === "en" ? "ROW" : "FILA"}</small><b>{sellerDetailValue(offer.details, "Reihe") || sellerDetailValue(offer.details, "Sektor") || "—"}</b></div>
                              <div><small>{language === "de" ? "TICKETS" : language === "ca" ? "ENTRADES" : language === "es" ? "ENTRADAS" : "TICKETS"}</small><b>{sellerDetailValue(offer.details, "Anzahl Tickets") || offer.ticketCount || "—"}</b></div>
                            </div>

                            <span className="pases-ticket-hint">
                              {language === "de" ? "Ticket anklicken für Details" : language === "en" ? "Click ticket for details" : language === "ca" ? "Clica l’entrada per veure els detalls" : "Haz clic en la entrada para ver detalles"}
                            </span>
                          </div>

                          <div className="pases-ticket-stub-new">
                            <span>PASESPAIN</span>
                            <div className="pases-ticket-barcode-new" aria-hidden="true" />
                            <strong>{offer.price}</strong>
                            <small>pro Ticket</small>
                          </div>
                        </div>

                        {mobileExpandedOfferId === (offer.id || `${offer.home}-${offer.away}-${offer.date}-${index}`) && (
                          <div className="pases-ticket-details" onClick={(event) => event.stopPropagation()}>
                            {offer.details && <div className="pases-ticket-description">{translatedOfferDetails(offer.details)}</div>}
                            <button
                              className="pases-ticket-buy"
                              type="button"
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                addToCart(offer);
                                setCartOpen(true);
                              }}
                            >
                              <CartIcon />
                              <span>{language === "de" ? "In den Warenkorb" : language === "en" ? "Add to cart" : language === "ca" ? "Afegir al carret" : "Añadir al carrito"}</span>
                            </button>
                          </div>
                        )}
                      </article>
                    );
                  }
                )
              }
            </div>
          </div>

          <div className="spain-side-column">
            <aside className="weather-panel neutral-glass pases-scoreboard">
              <div className="pases-scoreboard-top">
                <span className="pases-live-dot" />
                <strong><span className="pases-brand-gradient">PASESPAIN</span> <span className="pases-live-word">LIVE</span></strong>
              </div>

              {liveBoardOffer ? (
                <div key={`${liveBoardOffer.home}-${liveBoardOffer.away}-${liveBoardIndex}`} className="pases-flap-changing">
                  <div className="pases-scoreboard-kicker">
                    {language === "de"
                      ? "TICKETS VERFÜGBAR"
                      : language === "en"
                        ? "TICKETS AVAILABLE"
                        : language === "ca"
                          ? "ENTRADES DISPONIBLES"
                          : "ENTRADAS DISPONIBLES"}
                  </div>
                  <div className="pases-char-line">
                    {renderFlapChars(liveBoardOffer.home)}
                  </div>
                  <div className="pases-board-vs">VS</div>
                  <div className="pases-char-line">
                    {renderFlapChars(liveBoardOffer.away)}
                  </div>
                  <div className="pases-char-line pases-price-line">
                    {renderFlapChars(
                      `${language === "de"
                        ? "AB"
                        : language === "en"
                          ? "FROM"
                          : language === "ca"
                            ? "DES DE"
                            : "DESDE"} ${liveBoardOffer.price}`,
                      16
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="pases-scoreboard-kicker">PASESPAIN</div>
                  <div className="pases-scoreboard-message">
                    COMPRA · VENDE · DISFRUTA
                  </div>
                  <div className="pases-scoreboard-price">PASESPAIN.ES</div>
                </>
              )}
            </aside>

            <aside className="weather-panel neutral-glass spain-ad-card spain-ad-card-large spain-sell-ad">
              <div className="spain-ad-label">
                {language === "de"
                  ? "DU HAST TICKETS"
                  : language === "en"
                    ? "HAVE TICKETS"
                    : language === "ca"
                      ? "TENS ENTRADES"
                      : "TIENES ENTRADAS"}
              </div>

              <div className="spain-ad-title spain-sell-ad-title">
                {language === "de"
                  ? "Verkaufe sie auf PaseSpain"
                  : language === "en"
                    ? "Sell them on PaseSpain"
                    : language === "ca"
                      ? "Ven-les a PaseSpain"
                      : "Véndelas en PaseSpain"}
              </div>

              <div className="spain-ad-text spain-sell-ad-copy">
                {language === "de"
                  ? "Veröffentliche deine Tickets einfach und erreiche Fußballfans in ganz Spanien."
                  : language === "en"
                    ? "List your tickets easily and reach football fans across Spain."
                    : language === "ca"
                      ? "Publica les teves entrades fàcilment i arriba a aficionats de tot Espanya."
                      : "Publica tus entradas de forma sencilla y llega a aficionados de toda España."}
              </div>

              <button
                type="button"
                className="spain-sell-ad-button"
                onClick={() => {
                  setActiveAuthRole("seller");
                  setAuthRoleChosen(true);
                  setSellerPublishError("");
                  if (supabaseSession) {
                    setLoggedInRole("seller");
                    setSellerModalOpen(true);
                  } else {
                    setAuthMode("login");
                    setAuthModalOpen(true);
                  }
                }}
              >
                {language === "de"
                  ? "TICKETS VERKAUFEN →"
                  : language === "en"
                    ? "SELL TICKETS →"
                    : language === "ca"
                      ? "VENDRE ENTRADES →"
                      : "VENDER ENTRADAS →"}
              </button>
            </aside>

            <aside className="weather-panel neutral-glass spain-ad-card spain-ad-card-large">
              <div className="spain-ad-label">Publicidad</div>
              <div className="spain-ad-title">
                {language === "de"
                  ? "Werbeplatz verfügbar"
                  : language === "en"
                    ? "Advertising space available"
                    : language === "ca"
                      ? "Espai publicitari disponible"
                      : "Espacio publicitario disponible"}
              </div>
              <div className="spain-ad-text">PaseSpain.es</div>
            </aside>
            {/* Copa del Rey */}
<aside
  className="weather-panel neutral-glass spain-ad-card spain-ad-card-large"
  style={{
    background:
      "linear-gradient(145deg, rgba(92,20,28,.94), rgba(42,14,20,.96))",
    border: "1px solid rgba(255,255,255,.22)",
    boxShadow: "0 16px 38px rgba(0,0,0,.25)",
    color: "#ffffff",
  }}
>
  <div
    className="spain-ad-label"
    style={{
      color: "#f5d98b",
      textShadow: "0 1px 3px rgba(0,0,0,.5)",
    }}
  >
    🏆 COPA DEL REY
  </div>

  <div
    className="spain-ad-title"
    style={{
      color: "#ffffff",
      textShadow: "0 2px 5px rgba(0,0,0,.55)",
    }}
  >
    HOY ES EL SORTEO
  </div>

  <div
    className="spain-ad-text"
    style={{ color: "rgba(255,255,255,.88)" }}
  >
    Sorteo de la primera ronda
  </div>

  <a
    href="https://rfef.es/es/competiciones/copa-del-rey"
    target="_blank"
    rel="noopener noreferrer"
    className="spain-sell-ad-button"
    style={{
      display: "inline-flex",
      marginTop: "16px",
      textDecoration: "none",
      color: "#ffffff",
    }}
  >
    VER SORTEO OFICIAL →
  </a>
</aside>

{/* Champions League */}
<aside
  className="weather-panel neutral-glass spain-ad-card spain-ad-card-large"
  style={{
    background:
      "linear-gradient(145deg, rgba(20,35,82,.94), rgba(10,18,48,.96))",
    border: "1px solid rgba(255,255,255,.22)",
    boxShadow: "0 16px 38px rgba(0,0,0,.25)",
    color: "#ffffff",
  }}
>
  <div
    className="spain-ad-label"
    style={{
      color: "#dce5ff",
      textShadow: "0 1px 3px rgba(0,0,0,.5)",
    }}
  >
    ★ CHAMPIONS LEAGUE
  </div>

  <div
    className="spain-ad-title"
    style={{
      color: "#ffffff",
      textShadow: "0 2px 5px rgba(0,0,0,.55)",
    }}
  >
    LA EMOCIÓN CONTINÚA
  </div>

  <div
    className="spain-ad-text"
    style={{ color: "rgba(255,255,255,.88)" }}
  >
    Encuentra entradas para los grandes partidos
  </div>

  <button
    type="button"
    className="spain-sell-ad-button"
    style={{
      marginTop: "16px",
      color: "#ffffff",
    }}
    onClick={() => {
      setSearchText("Champions League");
      setSearchActive(true);
    }}
  >
    VER ENTRADAS →
  </button>
</aside>
          </div>
        </section>
      </div>

        {
          accountManageOpen && loggedInRole && (
            <div
              className="market-modal-backdrop"
              role="presentation"
              onMouseDown={() =>
                setAccountManageOpen(false)
              }
            >
              <div
                className="market-modal"
                role="dialog"
                aria-modal="true"
                aria-label={
                  language === "de"
                    ? "Konto verwalten"
                    : language === "en"
                      ? "Manage account"
                      : language === "ca"
                        ? "Gestionar el compte"
                        : "Gestionar cuenta"
                }
                onMouseDown={event =>
                  event.stopPropagation()
                }
              >
                <div className="market-modal-head">
                  <h2>
                    {language === "de"
                      ? "Konto"
                      : language === "en"
                        ? "Account"
                        : language === "ca"
                          ? "Compte"
                          : "Cuenta"}
                  </h2>

                  <button
                    className="market-modal-close"
                    type="button"
                    aria-label="Schließen"
                    onClick={() =>
                      setAccountManageOpen(false)
                    }
                  >
                    ×
                  </button>
                </div>

                <p className="market-note">
                  {language === "de"
                    ? "Du kannst dich abmelden oder dein Konto dauerhaft löschen."
                    : language === "en"
                      ? "You can sign out or permanently delete your account."
                      : language === "ca"
                        ? "Pots tancar la sessió o eliminar definitivament el compte."
                        : "Puedes cerrar sesión o eliminar definitivamente tu cuenta."}
                </p>

{loggedInRole === "seller" && (
                <button
                  type="button"
                  className="account-manage-logout"
                  onClick={() => {
                    setAccountManageOpen(false);
                    setSellerPublishError("");
                    setSellerModalOpen(true);
                  }}
                >
                  {language === "de"
                    ? "Ticket verkaufen"
                    : language === "en"
                      ? "Sell ticket"
                      : language === "ca"
                        ? "Vendre entrada"
                        : "Vender entrada"}
                </button>
                )}

                {loggedInRole === "buyer" && (
                  <div className="market-field" style={{ marginBottom: "16px", padding: "16px", borderRadius: "18px", border: "1px solid rgba(255,255,255,.22)", background: "rgba(255,255,255,.08)" }}>
                    <strong style={{ display: "block", marginBottom: "10px" }}>
                      {language === "de" ? "Meine Tickets" : language === "en" ? "My tickets" : language === "ca" ? "Les meves entrades" : "Mis entradas"}
                    </strong>

                    {buyerOrdersLoading ? (
                      <div style={{ opacity: .75 }}>{language === "de" ? "Wird geladen …" : "Loading …"}</div>
                    ) : buyerOrders.length === 0 ? (
                      <div style={{ opacity: .75 }}>{language === "de" ? "Noch keine gekauften Tickets." : language === "en" ? "No purchased tickets yet." : language === "ca" ? "Encara no hi ha entrades comprades." : "Aún no hay entradas compradas."}</div>
                    ) : (
                      <div style={{ display: "grid", gap: "10px" }}>
                        {buyerOrders.map(order => (
                          <div key={order.id} style={{ padding: "12px", borderRadius: "14px", background: "rgba(255,255,255,.08)" }}>
                            <strong>{order.home} – {order.away}</strong>
                            <div style={{ fontSize: "13px", opacity: .8, marginTop: "4px" }}>{order.match_date} · {order.stadium}</div>
                            <div style={{ fontSize: "13px", marginTop: "5px" }}>
                              {order.ticket_available
                                ? (language === "de" ? "Ticket verfügbar ✓" : language === "en" ? "Ticket available ✓" : language === "ca" ? "Entrada disponible ✓" : "Entrada disponible ✓")
                                : order.status === "paid_waiting_ticket"
                                  ? (language === "de" ? "Bezahlt – Verkäufer übermittelt das Ticket" : language === "en" ? "Paid – seller is sending the ticket" : language === "ca" ? "Pagat – el venedor enviarà l'entrada" : "Pagado – el vendedor enviará la entrada")
                                  : order.status}
                            </div>
                            {order.ticket_available && (
                              <button
                                type="button"
                                className="market-primary-button"
                                style={{ marginTop: "10px" }}
                                disabled={buyerTicketOpeningId === order.id}
                                onClick={() => void openBuyerTicket(order.id)}
                              >
                                {buyerTicketOpeningId === order.id
                                  ? (language === "de" ? "Öffnen …" : "Opening …")
                                  : (language === "de" ? "Ticket anzeigen / herunterladen" : language === "en" ? "View / download ticket" : language === "ca" ? "Veure / descarregar entrada" : "Ver / descargar entrada")}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {buyerOrdersError && <p className="market-error">{buyerOrdersError}</p>}
                  </div>
                )}

                <button
                  type="button"
                  className="account-manage-logout"
                  onClick={() => {
                    clearSupabaseSession();
                    setAccountManageOpen(false);
                  }}
                >
                  {language === "de"
                    ? "Abmelden"
                    : language === "en"
                      ? "Sign out"
                      : language === "ca"
                        ? "Tancar sessió"
                        : "Cerrar sesión"}
                </button>

                <div className="account-delete-box">
                  <strong>
                    {language === "de"
                      ? "Konto dauerhaft löschen"
                      : language === "en"
                        ? "Permanently delete account"
                        : language === "ca"
                          ? "Eliminar definitivament el compte"
                          : "Eliminar cuenta definitivamente"}
                  </strong>

                  <p>
                    {language === "de"
                      ? "Dein Zugang und dein Profil werden gelöscht. Aktive Ticketangebote werden entfernt. Daten, die PaseSpain aus gesetzlichen Gründen aufbewahren muss, werden nur so lange wie erforderlich gespeichert und danach gelöscht oder anonymisiert."
                      : language === "en"
                        ? "Your login and profile will be deleted. Active ticket listings will be removed. Data PaseSpain must retain for legal reasons will only be kept as long as required and then deleted or anonymised."
                        : language === "ca"
                          ? "S'eliminaran l'accés i el perfil. Les ofertes d'entrades actives s'eliminaran. Les dades que PaseSpain hagi de conservar per motius legals només es mantindran durant el temps necessari i després s'eliminaran o anonimitzaran."
                          : "Se eliminarán tu acceso y tu perfil. Las ofertas de entradas activas se retirarán. Los datos que PaseSpain deba conservar por motivos legales solo se mantendrán durante el tiempo necesario y después se eliminarán o anonimizarán."}
                  </p>

                  <button
                    type="button"
                    className="account-delete-button"
                    disabled={accountDeleteLoading}
                    onClick={handleDeleteAccount}
                  >
                    {accountDeleteLoading
                      ? language === "de"
                        ? "Konto wird gelöscht …"
                        : language === "en"
                          ? "Deleting account …"
                          : language === "ca"
                            ? "Eliminant el compte …"
                            : "Eliminando cuenta …"
                      : language === "de"
                        ? "Konto endgültig löschen"
                        : language === "en"
                          ? "Delete account permanently"
                          : language === "ca"
                            ? "Eliminar el compte definitivament"
                            : "Eliminar cuenta definitivamente"}
                  </button>

                  {accountDeleteError && (
                    <p className="market-error">
                      {accountDeleteError}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        }

        {
          authModalOpen && (
            <div
              className="market-modal-backdrop"
              role="presentation"
              onMouseDown={() =>
                setAuthModalOpen(
                  false
                )
              }
            >
              <div
                className="market-modal"
                role="dialog"
                aria-modal="true"
                aria-label={
                  activeAuthRole === "seller"
                    ? "Verkäufer Login"
                    : "Käufer Login"
                }
                onMouseDown={(
                  event
                ) =>
                  event.stopPropagation()
                }
              >
                <div className="market-modal-head">
                  <h2>
                    {authMode === "register"
                      ? language === "de"
                        ? activeAuthRole === "seller" ? "Verkäuferkonto erstellen" : "Käuferkonto erstellen"
                        : language === "en"
                          ? activeAuthRole === "seller" ? "Create seller account" : "Create buyer account"
                          : language === "ca"
                            ? activeAuthRole === "seller" ? "Crear compte de venedor" : "Crear compte de comprador"
                            : "Crear cuenta de PaseSpain"
                      : language === "de"
                        ? activeAuthRole === "seller" ? "Als Verkäufer anmelden" : "Als Käufer anmelden"
                        : language === "en"
                          ? activeAuthRole === "seller" ? "Sign in as seller" : "Sign in as buyer"
                          : language === "ca"
                            ? activeAuthRole === "seller" ? "Iniciar sessió com a venedor" : "Iniciar sessió com a comprador"
                            : "Iniciar sesión en PaseSpain"}
                  </h2>

                  <button
                    className="market-modal-close"
                    type="button"
                    aria-label="Schließen"
                    onClick={() =>
                      setAuthModalOpen(
                        false
                      )
                    }
                  >
                    ×
                  </button>
                </div>

                <p className="market-note">
                  {language === "de"
                    ? "Käufer- und Verkäuferkonten sind strikt getrennt. Wähle den Kontotyp, den du verwenden möchtest."
                    : language === "en"
                      ? "Buyer and seller accounts are strictly separate. Choose the account type you want to use."
                      : language === "ca"
                        ? "Els comptes de comprador i venedor estan estrictament separats. Tria el tipus de compte que vols utilitzar."
                        : "Las cuentas de comprador y vendedor están estrictamente separadas. Elige el tipo de cuenta que quieres utilizar."}
                </p>

                <div className="account-role-choice">
                  <button
                    type="button"
                    className={`account-role-button ${
                      authRoleChosen && activeAuthRole === "buyer"
                        ? "active"
                        : ""
                    }`}
                    onClick={() => {
                      setActiveAuthRole("buyer");
                      setAuthRoleChosen(true);
                      setAuthError("");
                    }}
                  >
                    {
                      language === "de"
                        ? "Käufer"
                        : language === "en"
                          ? "Buyer"
                          : language === "ca"
                            ? "Comprador"
                            : "Comprador"
                    }
                  </button>

                  <button
                    type="button"
                    className={`account-role-button ${
                      authRoleChosen && activeAuthRole === "seller"
                        ? "active"
                        : ""
                    }`}
                    onClick={() => {
                      setActiveAuthRole("seller");
                      setAuthRoleChosen(true);
                      setAuthError("");
                    }}
                  >
                    {
                      language === "de"
                        ? "Verkäufer"
                        : language === "en"
                          ? "Seller"
                          : language === "ca"
                            ? "Venedor"
                            : "Vendedor"
                    }
                  </button>
                </div>

                <p className="account-role-note">
                  {!authRoleChosen
                    ? language === "de"
                      ? "Bitte zuerst Käufer oder Verkäufer auswählen."
                      : language === "en"
                        ? "Please choose Buyer or Seller first."
                        : language === "ca"
                          ? "Tria primer Comprador o Venedor."
                          : "Elige primero Comprador o Vendedor."
                    : activeAuthRole === "seller"
                    ? language === "de"
                      ? "Verkäufer: Personalien erfassen, Tickets anbieten und später den Preis ändern."
                      : language === "en"
                        ? "Seller: personal details, list tickets and change the price later."
                        : language === "ca"
                          ? "Venedor: dades personals, publicar entrades i canviar-ne el preu."
                          : "Vendedor: datos personales, publicar entradas y cambiar el precio."
                    : language === "de"
                      ? "Käufer: Personalien für das Käuferkonto erfassen."
                      : language === "en"
                        ? "Buyer: enter personal details for the buyer account."
                        : language === "ca"
                          ? "Comprador: introdueix les dades personals del compte."
                          : "Comprador: introduce los datos personales de la cuenta."}
                </p>

                <div className="account-auth-mode-choice">
                  <button
                    type="button"
                    className={authMode === "login" ? "active" : ""}
                    onClick={() => {
                      setAuthMode("login");
                      setAuthError("");
                      setAuthPassword("");
                    }}
                  >
                    {language === "de"
                      ? "Anmelden"
                      : language === "en"
                        ? "Sign in"
                        : language === "ca"
                          ? "Iniciar sessió"
                          : "Iniciar sesión"}
                  </button>

                  <button
                    type="button"
                    className={authMode === "register" ? "active" : ""}
                    onClick={() => {
                      setAuthMode("register");
                      setAuthError("");
                      setAuthPassword("");
                    }}
                  >
                    {language === "de"
                      ? "Registrieren"
                      : language === "en"
                        ? "Register"
                        : language === "ca"
                          ? "Registrar-se"
                          : "Registrarse"}
                  </button>
                </div>

                <form
                  className="market-form"
                  onSubmit={
                    passwordRecoveryToken
                      ? handlePasswordRecovery
                      : handleLogin
                  }
                >
                  {
                    authMode === "register" && (
                      <>
                        <div className="market-form-two">
                          <div className="market-field">
                            <label>
                              {language === "de"
                                ? "Vorname"
                                : language === "en"
                                  ? "First name"
                                  : language === "ca"
                                    ? "Nom"
                                    : "Nombre"}
                            </label>
                            <input
                              type="text"
                              value={sellerFirstName}
                              onChange={event =>
                                setSellerFirstName(
                                  event.target.value
                                )
                              }
                              autoComplete="given-name"
                            />
                          </div>

                          <div className="market-field">
                            <label>
                              {language === "de"
                                ? "Nachname"
                                : language === "en"
                                  ? "Last name"
                                  : language === "ca"
                                    ? "Cognoms"
                                    : "Apellidos"}
                            </label>
                            <input
                              type="text"
                              value={sellerLastName}
                              onChange={event =>
                                setSellerLastName(
                                  event.target.value
                                )
                              }
                              autoComplete="family-name"
                            />
                          </div>
                        </div>

                        <div className="market-form-two">
                          <div className="market-field">
                            <label>
                              {language === "de"
                                ? "Strasse"
                                : language === "en"
                                  ? "Street"
                                  : language === "ca"
                                    ? "Carrer"
                                    : "Calle"}
                            </label>
                            <input
                              type="text"
                              value={sellerStreet}
                              onChange={event =>
                                setSellerStreet(
                                  event.target.value
                                )
                              }
                              autoComplete="street-address"
                            />
                          </div>

                          <div className="market-field">
                            <label>
                              {language === "de"
                                ? "Hausnummer"
                                : language === "en"
                                  ? "No."
                                  : language === "ca"
                                    ? "Núm."
                                    : "N.º"}
                            </label>
                            <input
                              type="text"
                              value={sellerHouseNumber}
                              onChange={event =>
                                setSellerHouseNumber(
                                  event.target.value
                                )
                              }
                            />
                          </div>
                        </div>

                        <div className="market-form-two">
                          <div className="market-field">
                            <label>
                              {language === "de"
                                ? "PLZ"
                                : language === "en"
                                  ? "Postal code"
                                  : language === "ca"
                                    ? "Codi postal"
                                    : "Código postal"}
                            </label>
                            <input
                              type="text"
                              value={sellerPostalCode}
                              onChange={event =>
                                setSellerPostalCode(
                                  event.target.value
                                )
                              }
                              autoComplete="postal-code"
                            />
                          </div>

                          <div className="market-field">
                            <label>
                              {language === "de"
                                ? "Ort"
                                : language === "en"
                                  ? "City"
                                  : language === "ca"
                                    ? "Ciutat"
                                    : "Ciudad"}
                            </label>
                            <input
                              type="text"
                              value={sellerProfileCity}
                              onChange={event =>
                                setSellerProfileCity(
                                  event.target.value
                                )
                              }
                              autoComplete="address-level2"
                            />
                          </div>
                        </div>

                        <div className="market-form-two">
                          <div className="market-field">
                            <label>
                              {language === "de"
                                ? "Land"
                                : language === "en"
                                  ? "Country"
                                  : language === "ca"
                                    ? "País"
                                    : "País"}
                            </label>
                            <input
                              type="text"
                              value={sellerCountry}
                              onChange={event =>
                                setSellerCountry(
                                  event.target.value
                                )
                              }
                              autoComplete="country-name"
                            />
                          </div>

                          <div className="market-field">
                            <label>
                              {language === "de"
                                ? "Telefon"
                                : language === "en"
                                  ? "Phone"
                                  : language === "ca"
                                    ? "Telèfon"
                                    : "Teléfono"}
                            </label>
                            <input
                              type="tel"
                              value={sellerPhone}
                              onChange={event =>
                                setSellerPhone(
                                  event.target.value
                                )
                              }
                              autoComplete="tel"
                            />
                          </div>
                        </div>

                        <div className="market-field">
                          <label>
                            {language === "de"
                              ? "Geburtsdatum"
                              : language === "en"
                                ? "Date of birth"
                                : language === "ca"
                                  ? "Data de naixement"
                                  : "Fecha de nacimiento"}
                          </label>
                          <input
                            type="date"
                            value={sellerBirthDate}
                            onChange={event =>
                              setSellerBirthDate(
                                event.target.value
                              )
                            }
                            autoComplete="bday"
                          />
                        </div>
                      </>
                    )
                  }

                  <div className="market-field">
                    <label>
                      E-Mail
                    </label>
                    <input
                      type="email"
                      value={
                        authEmail
                      }
                      onChange={(
                        event
                      ) =>
                        setAuthEmail(
                          event.target.value
                        )
                      }
                      autoComplete="email"
                    />
                  </div>

                  <div className="market-field">
                    <label>
                      {passwordRecoveryToken
                        ? (language === "de"
                            ? "Neues Passwort"
                            : language === "en"
                              ? "New password"
                              : language === "ca"
                                ? "Contrasenya nova"
                                : "Nueva contraseña")
                        : "Passwort"}
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={authPasswordVisible ? "text" : "password"}
                        value={authPassword}
                        onChange={event => setAuthPassword(event.target.value)}
                        autoComplete={authMode === "register" ? "new-password" : "current-password"}
                        style={{ width: "100%", paddingRight: 52 }}
                      />
                      <button
                        type="button"
                        aria-label={authPasswordVisible ? "Passwort verbergen" : "Passwort anzeigen"}
                        title={authPasswordVisible ? "Passwort verbergen" : "Passwort anzeigen"}
                        onClick={() => setAuthPasswordVisible(value => !value)}
                        style={{
                          position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                          border: 0, background: "transparent", cursor: "pointer", fontSize: 18, padding: 6
                        }}
                      >
                        {authPasswordVisible ? "🙈" : "👁️"}
                      </button>
                    </div>
                    {authMode === "login" && !passwordRecoveryToken && (
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        disabled={passwordResetLoading}
                        style={{
                          marginTop: 7, padding: 0, border: 0, background: "transparent",
                          color: "#071633", textDecoration: "underline", cursor: "pointer", fontWeight: 700
                        }}
                      >
                        {passwordResetLoading
                          ? (language === "de" ? "Wird gesendet …" : "…")
                          : (language === "de" ? "Passwort vergessen?" : language === "en" ? "Forgot password?" : language === "ca" ? "Has oblidat la contrasenya?" : "¿Has olvidado la contraseña?")}
                      </button>
                    )}
                  </div>

                  {
                    authMode === "register" && (
                      <label className="seller-terms-check">
                        <input
                          type="checkbox"
                          checked={sellerTermsAccepted}
                          onChange={event =>
                            setSellerTermsAccepted(
                              event.target.checked
                            )
                          }
                        />
                        <span>
                          {language === "de"
                            ? "Ich akzeptiere AGB und Datenschutz."
                            : language === "en"
                              ? "I accept the terms and privacy policy."
                              : language === "ca"
                                ? "Accepto els termes i la política de privacitat."
                                : "Acepto los términos y la política de privacidad."}
                        </span>
                      </label>
                    )
                  }

                  {
                    authError && (
                      <p className="market-error">
                        {
                          authError
                        }
                      </p>
                    )
                  }

                  <button
                    className="market-primary-button"
                    type="submit"
                    disabled={passwordRecoveryToken ? passwordRecoveryLoading : authLoading}
                  >
                    {
                      authLoading
                        ? language === "de"
                          ? "Bitte warten …"
                          : language === "en"
                            ? "Please wait …"
                            : language === "ca"
                              ? "Espera …"
                              : "Espera …"
                        : authMode === "register"
                        ? language === "de"
                          ? "Registrieren"
                          : language === "en"
                            ? "Register"
                            : language === "ca"
                              ? "Registrar-se"
                              : "Registrarse"
                        : language === "de"
                          ? "Anmelden"
                          : language === "en"
                            ? "Sign in"
                            : language === "ca"
                              ? "Entrar"
                              : "Entrar"
                    }
                  </button>

                  <button
                    className="market-auth-switch"
                    type="button"
                    onClick={() => {
                      setAuthMode(
                        authMode === "login"
                          ? "register"
                          : "login"
                      );
                      setAuthError("");
                      setAuthPassword("");
                    }}
                  >
                    {
                      authMode === "login"
                        ? activeAuthRole === "seller"
                          ? language === "de"
                            ? "Noch kein Konto? Verkäufer registrieren"
                            : language === "en"
                              ? "No account yet? Register as seller"
                              : language === "ca"
                                ? "Encara no tens compte? Registra't com a venedor"
                                : "¿Aún no tienes cuenta? Regístrate como vendedor"
                          : language === "de"
                            ? "Noch kein Konto? Käufer registrieren"
                            : language === "en"
                              ? "No account yet? Register as buyer"
                              : language === "ca"
                                ? "Encara no tens compte? Registra't com a comprador"
                                : "¿Aún no tienes cuenta? Regístrate como comprador"
                        : language === "de"
                          ? "Bereits registriert? Anmelden"
                          : language === "en"
                            ? "Already registered? Sign in"
                            : language === "ca"
                              ? "Ja tens compte? Inicia sessió"
                              : "¿Ya tienes cuenta? Inicia sesión"
                    }
                  </button>
                </form>
              </div>
            </div>
          )
        }

        {
          sellerModalOpen && loggedInRole === "seller" && (
            <div
              className="market-modal-backdrop"
              role="presentation"
              onMouseDown={() =>
                setSellerModalOpen(
                  false
                )
              }
            >
              <div
                className="market-modal market-modal-wide"
                role="dialog"
                aria-modal="true"
                aria-label="Ticket verkaufen"
                onMouseDown={(
                  event
                ) =>
                  event.stopPropagation()
                }
              >
                <div className="market-modal-head">
                  <h2>
                    {
                      language === "de"
                        ? "Ticket verkaufen"
                        : language === "en"
                          ? "Sell a ticket"
                          : language === "ca"
                            ? "Vendre una entrada"
                            : "Vender una entrada"
                    }
                  </h2>

                  <button
                    className="market-modal-close"
                    type="button"
                    aria-label="Schließen"
                    onClick={() =>
                      setSellerModalOpen(
                        false
                      )
                    }
                  >
                    ×
                  </button>
                </div>

                {loggedInRole === "seller" && sellerOwnOffers.length > 0 && (
                  <div className="seller-own-offers">
                    <p className="seller-own-offers-title">
                      {language === "de"
                        ? "Meine angebotenen Tickets"
                        : language === "en"
                          ? "My listed tickets"
                          : language === "ca"
                            ? "Les meves entrades"
                            : "Mis entradas publicadas"}
                    </p>

                    {sellerOwnOffers.map(offer => (
                      <div className="seller-own-offer" key={offer.id}>
                        <div>
                          <strong>{offer.home} – {offer.away}</strong>
                          <small>{offer.date} · {offer.stadium}</small>
                        </div>

                        <div className="seller-price-actions">
                          {sellerPriceEditId === offer.id ? (
                            <>
                              <input
                                className="seller-price-input"
                                inputMode="decimal"
                                value={sellerPriceEditValue}
                                onChange={event =>
                                  setSellerPriceEditValue(event.target.value)
                                }
                              />
                              <button
                                className="seller-price-save-button"
                                type="button"
                                disabled={sellerPriceUpdating}
                                onClick={() => handleSellerPriceUpdate(offer)}
                              >
                                {language === "de"
                                  ? "Speichern"
                                  : language === "en"
                                    ? "Save"
                                    : language === "ca"
                                      ? "Desar"
                                      : "Guardar"}
                              </button>
                              <button
                                className="seller-price-cancel-button"
                                type="button"
                                onClick={() => {
                                  setSellerPriceEditId(null);
                                  setSellerPriceEditValue("");
                                  setSellerPriceEditError("");
                                }}
                              >
                                ×
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="seller-current-price">
                                {offer.price}
                              </span>
                              <button
                                className="seller-price-edit-button"
                                type="button"
                                onClick={() => {
                                  setSellerPriceEditId(offer.id || null);
                                  setSellerPriceEditValue(offer.price.replace("€", ""));
                                  setSellerPriceEditError("");
                                }}
                              >
                                {language === "de"
                                  ? "Preis ändern"
                                  : language === "en"
                                    ? "Change price"
                                    : language === "ca"
                                      ? "Canviar preu"
                                      : "Cambiar precio"}
                              </button>
                            </>
                          )}

                          <button
                            className="seller-offer-edit-button"
                            type="button"
                            onClick={() => startSellerOfferEdit(offer)}
                          >
                            {language === "de"
                              ? "Bearbeiten"
                              : language === "en"
                                ? "Edit"
                                : "Editar"}
                          </button>

                          <button
                            className="seller-offer-delete-button"
                            type="button"
                            disabled={sellerOfferDeletingId === offer.id}
                            onClick={() => handleSellerOfferDelete(offer)}
                          >
                            {sellerOfferDeletingId === offer.id
                              ? language === "de"
                                ? "Löschen …"
                                : language === "en"
                                  ? "Deleting …"
                                  : "Eliminando …"
                              : language === "de"
                                ? "Löschen"
                                : language === "en"
                                  ? "Delete"
                                  : "Eliminar"}
                          </button>
                        </div>
                      </div>
                    ))}

                    {sellerPriceEditError && (
                      <p className="market-error">
                        {sellerPriceEditError}
                      </p>
                    )}
                  </div>
                )}

                <div className="market-field" style={{ marginBottom: "16px", padding: "16px", borderRadius: "18px", border: "1px solid rgba(255,255,255,.22)", background: "rgba(255,255,255,.08)" }}>
                  <label style={{ display: "block", fontWeight: 800, marginBottom: "8px" }}>
                    {language === "de" ? "Verkäufe" : language === "en" ? "Sales" : language === "ca" ? "Vendes" : "Ventas"}
                  </label>
                  {sellerOrdersLoading ? (
                    <div style={{ opacity: .75 }}>Wird geladen …</div>
                  ) : sellerOrders.length === 0 ? (
                    <div style={{ opacity: .75 }}>{language === "de" ? "Noch keine Verkäufe." : "No sales yet."}</div>
                  ) : (
                    <div style={{ display: "grid", gap: "10px" }}>
                      {sellerOrders.map(order => (
                        <div key={order.id} style={{ padding: "12px", borderRadius: "14px", background: "rgba(255,255,255,.08)" }}>
                          <strong>{order.home} – {order.away}</strong>
                          <div style={{ fontSize: "13px", opacity: .8, marginTop: "4px" }}>{order.match_date} · {order.stadium}</div>
                          <div style={{ fontSize: "13px", marginTop: "5px" }}>
                            {order.status === "paid_waiting_ticket"
                              ? (language === "de" ? "Bezahlt – Ticket jetzt übermitteln" : "Paid – send ticket now")
                              : order.status === "ticket_sent"
                                ? (language === "de" ? "Ticket übermittelt – Auszahlung wird vorbereitet" : "Ticket sent – payout pending")
                                : order.status === "paid_out"
                                  ? (language === "de" ? "Ausbezahlt ✓" : "Paid out ✓")
                                  : order.status}
                          </div>
                          {order.status === "paid_waiting_ticket" && (
                            <label className="market-primary-button" style={{ marginTop: "10px", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: ticketUploadOrderId === order.id ? "wait" : "pointer" }}>
                              {ticketUploadOrderId === order.id
                                ? (language === "de" ? "Ticket wird hochgeladen …" : "Uploading ticket …")
                                : (language === "de" ? "Ticket hochladen" : language === "en" ? "Upload ticket" : language === "ca" ? "Pujar entrada" : "Subir entrada")}
                              <input
                                type="file"
                                accept="application/pdf,image/jpeg,image/png,application/vnd.apple.pkpass,.pdf,.jpg,.jpeg,.png,.pkpass"
                                style={{ display: "none" }}
                                disabled={ticketUploadOrderId !== null}
                                onChange={event => {
                                  const file = event.currentTarget.files?.[0] || null;
                                  void uploadTicketForOrder(order.id, file);
                                  event.currentTarget.value = "";
                                }}
                              />
                            </label>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {ticketUploadError && (
                  <p className="market-error" style={{ marginTop: "-8px", marginBottom: "14px" }}>
                    {ticketUploadError}
                  </p>
                )}

                <div
                  className="market-field"
                  style={{
                    marginBottom: "14px",
                    padding: "14px 16px",
                    borderRadius: "18px",
                    border: "1px solid rgba(255,255,255,.22)",
                    background: "rgba(255,255,255,.08)",
                  }}
                >
                  <label
                    style={{
                      display: "block",
                      fontWeight: 800,
                      marginBottom: "6px",
                    }}
                  >
                    {language === "de"
                      ? "Auszahlungen"
                      : language === "en"
                        ? "Payouts"
                        : language === "ca"
                          ? "Pagaments"
                          : "Pagos"}
                  </label>

                  <div
                    style={{
                      fontSize: "14px",
                      opacity: .78,
                      marginBottom: "12px",
                    }}
                  >
                    {stripeStatusLoading
                      ? language === "de"
                        ? "Stripe-Status wird geprüft …"
                        : language === "en"
                          ? "Checking Stripe status …"
                          : language === "ca"
                            ? "Comprovant l'estat de Stripe …"
                            : "Comprobando el estado de Stripe …"
                      : stripePayoutsEnabled && stripeDetailsSubmitted
                        ? language === "de"
                          ? "Auszahlung eingerichtet ✓"
                          : language === "en"
                            ? "Payouts set up ✓"
                            : language === "ca"
                              ? "Pagaments configurats ✓"
                              : "Pagos configurados ✓"
                        : stripeAccountId
                          ? language === "de"
                            ? "Stripe-Konto angelegt – Einrichtung fortsetzen"
                            : language === "en"
                              ? "Stripe account created – continue setup"
                              : language === "ca"
                                ? "Compte Stripe creat – continua la configuració"
                                : "Cuenta de Stripe creada – continuar configuración"
                          : language === "de"
                            ? "Auszahlung noch nicht eingerichtet"
                            : language === "en"
                              ? "Payouts are not set up yet"
                              : language === "ca"
                                ? "Els pagaments encara no estan configurats"
                                : "Los pagos aún no están configurados"}
                  </div>

                  <button
                    type="button"
                    className="seller-payout-setup-button"
                    disabled={
                      stripeOnboardingLoading ||
                      stripeStatusLoading
                    }
                    onClick={handleStripeOnboarding}
                    title={
                      language === "de"
                        ? "Stripe Connect öffnen"
                        : language === "en"
                          ? "Open Stripe Connect"
                          : language === "ca"
                            ? "Obrir Stripe Connect"
                            : "Abrir Stripe Connect"
                    }
                    style={{
                      width: "100%",
                      minHeight: "44px",
                      borderRadius: "14px",
                      border: "1px solid rgba(255,255,255,.28)",
                      background: "rgba(255,255,255,.16)",
                      color: "inherit",
                      fontWeight: 800,
                      cursor:
                        stripeOnboardingLoading
                          ? "wait"
                          : "pointer",
                      opacity:
                        stripeOnboardingLoading
                          ? .68
                          : 1,
                    }}
                  >
                    {stripeOnboardingLoading
                      ? language === "de"
                        ? "Stripe wird geöffnet …"
                        : language === "en"
                          ? "Opening Stripe …"
                          : language === "ca"
                            ? "Obrint Stripe …"
                            : "Abriendo Stripe …"
                      : language === "de"
                        ? "Auszahlung einrichten"
                        : language === "en"
                          ? "Set up payouts"
                          : language === "ca"
                            ? "Configurar pagaments"
                            : "Configurar pagos"}
                  </button>

                  {stripeOnboardingError && (
                    <p
                      className="market-error"
                      style={{
                        marginTop: "10px",
                        marginBottom: 0,
                      }}
                    >
                      {stripeOnboardingError}
                    </p>
                  )}
                </div>

                <form
                  className="market-form"
                  onSubmit={
                    handleSellerSubmit
                  }
                >
                  <div className="market-form-grid">
                    <div className="market-field">
                      <label>
                        {language === "de"
                          ? "Wettbewerb"
                          : language === "en"
                            ? "Competition"
                            : language === "ca"
                              ? "Competició"
                              : "Competición"}
                      </label>
                      <select
                        value={sellerCompetition}
                        onChange={(event) => {
                          setSellerCompetition(event.target.value);
                          setSellerMatchSelection("");
                        }}
                        required
                      >
                        <option value="LaLiga">LaLiga</option>
                        <option value="UEFA Champions League">UEFA Champions League</option>
                        <option value="Copa del Rey">Copa del Rey</option>
                        <option value="UEFA Europa League">UEFA Europa League</option>
                        <option value="UEFA Conference League">UEFA Conference League</option>
                        <option value="Supercopa de España">Supercopa de España</option>
                        <option value="Freundschaftsspiel">
                          {language === "de"
                            ? "Freundschaftsspiel"
                            : language === "en"
                              ? "Friendly"
                              : language === "ca"
                                ? "Amistós"
                                : "Amistoso"}
                        </option>
                        <option value="Anderer Wettbewerb">
                          {language === "de"
                            ? "Anderer Wettbewerb"
                            : language === "en"
                              ? "Other competition"
                              : language === "ca"
                                ? "Una altra competició"
                                : "Otra competición"}
                        </option>
                      </select>
                    </div>

                    <div className="market-field">
                      <label>{language === "de" ? "Heimteam" : language === "en" ? "Home team" : language === "ca" ? "Equip local" : "Equipo local"}</label>

                      {sellerCompetition === "UEFA Champions League" ? (
                        <select
                          value={sellerHome}
                          onChange={(event) => {
                            const value = event.target.value;
                            setSellerHome(value);
                            setSellerMatchSelection("");
                            const location = sellerTeamLocations[value.trim()];
                            if (location) {
                              setSellerStadium(location.stadium);
                              setSellerCity(location.city);
                            }
                          }}
                          required
                        >
                          <option value="">
                            {language === "de" ? "Verein auswählen" : language === "en" ? "Choose club" : language === "ca" ? "Tria un club" : "Selecciona un club"}
                          </option>
                          {championsLeagueTeamSuggestions.map((team) => (
                            <option key={team} value={team}>{team}</option>
                          ))}
                        </select>
                      ) : (
                        <>
                          <input
                            type="text"
                            value={sellerHome}
                            onChange={(event) => {
                              const value = event.target.value;
                              setSellerHome(value);
                              setSellerMatchSelection("");
                              const location = sellerTeamLocations[value.trim()];
                              if (location) {
                                setSellerStadium(location.stadium);
                                setSellerCity(location.city);
                              }
                            }}
                            list={
                              sellerCompetition === "LaLiga"
                                ? "seller-home-teams-laliga"
                                : "seller-home-teams-all"
                            }
                            placeholder={
                              language === "de"
                                ? "Verein wählen oder frei eingeben"
                                : language === "en"
                                  ? "Choose a club or type any club"
                                  : language === "ca"
                                    ? "Tria un club o escriu-ne qualsevol"
                                    : "Elige un club o escribe cualquier club"
                            }
                            required
                          />
                          <datalist id="seller-home-teams-laliga">
                            {laLigaTeamSuggestions.map((team) => (
                              <option key={team} value={team} />
                            ))}
                          </datalist>
                          <datalist id="seller-home-teams-all">
                            {sellerTeamSuggestions.map((team) => (
                              <option key={team} value={team} />
                            ))}
                          </datalist>
                        </>
                      )}
                    </div>

                    <div className="market-field">
                      <label>{language === "de" ? "Auswärtsteam" : language === "en" ? "Away team" : language === "ca" ? "Equip visitant" : "Equipo visitante"}</label>

                      {sellerCompetition === "UEFA Champions League" ? (
                        <select
                          value={sellerAway}
                          onChange={(event) => {
                            setSellerAway(event.target.value);
                            setSellerMatchSelection("");
                          }}
                          required
                        >
                          <option value="">
                            {language === "de" ? "Verein auswählen" : language === "en" ? "Choose club" : language === "ca" ? "Tria un club" : "Selecciona un club"}
                          </option>
                          {championsLeagueTeamSuggestions.map((team) => (
                            <option key={team} value={team}>{team}</option>
                          ))}
                        </select>
                      ) : (
                        <>
                          <input
                            type="text"
                            value={sellerAway}
                            onChange={(event) => {
                              setSellerAway(event.target.value);
                              setSellerMatchSelection("");
                            }}
                            list={
                              sellerCompetition === "LaLiga"
                                ? "seller-away-teams-laliga"
                                : "seller-away-teams-all"
                            }
                            placeholder={
                              language === "de"
                                ? "Verein wählen oder frei eingeben"
                                : language === "en"
                                  ? "Choose a club or type any club"
                                  : language === "ca"
                                    ? "Tria un club o escriu-ne qualsevol"
                                    : "Elige un club o escribe cualquier club"
                            }
                            required
                          />
                          <datalist id="seller-away-teams-laliga">
                            {laLigaTeamSuggestions.map((team) => (
                              <option key={team} value={team} />
                            ))}
                          </datalist>
                          <datalist id="seller-away-teams-all">
                            {sellerTeamSuggestions.map((team) => (
                              <option key={team} value={team} />
                            ))}
                          </datalist>
                        </>
                      )}
                    </div>

                    <div className="market-field">
                      <label>{language === "de" ? "Datum / Anstoßzeit" : language === "en" ? "Date / kick-off" : language === "ca" ? "Data / hora d’inici" : "Fecha / hora de inicio"}</label>
                      <input
                        type="datetime-local"
                        value={sellerDate}
                        onChange={(event) => {
                          setSellerDate(event.target.value);
                          setSellerMatchSelection("");
                        }}
                        disabled={sellerDateOpen}
                        required={!sellerDateOpen}
                      />
                      <label className="seller-date-open-toggle">
                        <input
                          type="checkbox"
                          checked={sellerDateOpen}
                          onChange={(event) => {
                            const open = event.target.checked;
                            setSellerDateOpen(open);
                            setSellerMatchSelection("");
                            if (open) setSellerDate("");
                          }}
                        />
                        <span className="seller-date-open-check" aria-hidden="true">
                          {sellerDateOpen ? "✓" : ""}
                        </span>
                        <span>
                          {language === "de"
                            ? "Termin noch nicht bestätigt"
                            : language === "en"
                              ? "Date not yet confirmed"
                              : language === "ca"
                                ? "Data encara no confirmada"
                                : "Fecha aún no confirmada"}
                        </span>
                      </label>
                    </div>

                    <div className="market-field">
                      <label>{language === "de" ? "Stadionname" : language === "en" ? "Stadium" : language === "ca" ? "Estadi" : "Estadio"}</label>
                      <input
                        type="text"
                        value={sellerStadium}
                        onChange={(event) => {
                          const value = event.target.value;
                          setSellerStadium(value);
                          const match = Object.values(sellerTeamLocations).find(
                            (entry) => entry.stadium.toLowerCase() === value.trim().toLowerCase()
                          );
                          if (match) {
                            setSellerCity(match.city);
                          }
                        }}
                        list="seller-stadiums"
                        placeholder={language === "de" ? "z. B. Estadio de la Cerámica" : language === "en" ? "e.g. Estadio de la Cerámica" : language === "ca" ? "p. ex. Estadio de la Cerámica" : "p. ej. Estadio de la Cerámica"}
                        required
                      />
                      <datalist id="seller-stadiums">
                        {sellerStadiumSuggestions.map((stadium) => (
                          <option key={stadium} value={stadium} />
                        ))}
                      </datalist>
                    </div>

                    <div className="market-field">
                      <label>{language === "de" ? "Ort" : language === "en" ? "City" : language === "ca" ? "Localitat" : "Localidad"}</label>
                      <input
                        type="text"
                        value={sellerCity}
                        onChange={(event) => setSellerCity(event.target.value)}
                        list="seller-cities"
                        placeholder={language === "de" ? "z. B. Villarreal" : language === "en" ? "e.g. Villarreal" : language === "ca" ? "p. ex. Villarreal" : "p. ej. Villarreal"}
                        required
                      />
                      <datalist id="seller-cities">
                        {sellerCitySuggestions.map((city) => (
                          <option key={city} value={city} />
                        ))}
                      </datalist>
                    </div>

                                        <div className="market-field">
                      <label>{language === "de" ? "Zone / Tribüne" : language === "en" ? "Zone / stand" : language === "ca" ? "Zona / graderia" : "Zona / grada"}</label>
                      <input
                        type="text"
                        value={sellerZone}
                        onChange={(event) => setSellerZone(event.target.value)}
                        placeholder={
                          language === "de"
                            ? "Bezeichnung wie auf dem Ticket, z. B. Tribuna Preferente Central"
                            : language === "en"
                              ? "Name exactly as shown on the ticket, e.g. Tribuna Preferente Central"
                              : language === "ca"
                                ? "Nom tal com apareix a l'entrada, p. ex. Tribuna Preferente Central"
                                : "Nombre tal como aparece en la entrada, p. ej. Tribuna Preferente Central"
                        }
                        required
                      />
                    </div>

                    <div className="market-field">
                      <label>{language === "de" ? "Reihe" : language === "en" ? "Row" : language === "ca" ? "Fila" : "Fila"}</label>
                      <select
                      value={sellerRow}
                      onChange={(event) => setSellerRow(event.target.value)}
                        required={!sellerOfferEditId}
                      >
                        <option value="">{language === "de" ? "Bitte auswählen" : language === "en" ? "Please select" : language === "ca" ? "Selecciona" : "Selecciona"}</option>
                        {Array.from({ length: 100 }, (_, index) => index + 1).map(sector => (
                          <option key={sector} value={String(sector)}>
                            {sector}
                          </option>
                        ))}
                        <option value="Andere / nicht aufgeführt">{language === "de" ? "Andere / nicht aufgeführt" : language === "en" ? "Other / not listed" : language === "ca" ? "Altres / no consta" : "Otro / no aparece"}</option>
                      </select>
                    </div>

                    <div className="market-field">
                      <label>
                        {language === "de"
                          ? "Verkaufspreis pro Ticket in €"
                          : language === "en"
                            ? "Sale price per ticket in €"
                            : language === "ca"
                              ? "Preu de venda per entrada en €"
                              : "Precio de venta por entrada en €"}
                      </label>
                      <input
                        inputMode="decimal"
                        value={
                          sellerPrice
                        }
                        onChange={(
                          event
                        ) =>
                          setSellerPrice(
                            event.target.value
                          )
                        }
                        placeholder=""
                        required
                      />
                    </div>

                    <div className="market-field">
                      <label>{language === "de" ? "Anzahl Tickets" : language === "en" ? "Number of tickets" : language === "ca" ? "Nombre d’entrades" : "Número de entradas"}</label>
                      <input
                        inputMode="numeric"
                        type="number"
                        min="1"
                        step="1"
                        value={
                          sellerTicketCount
                        }
                        onChange={(
                          event
                        ) =>
                          setSellerTicketCount(
                            event.target.value
                          )
                        }
                        placeholder={language === "de" ? "z. B. 2" : language === "en" ? "e.g. 2" : language === "ca" ? "p. ex. 2" : "p. ej. 2"}
                        required
                      />
                    </div>

                    <div className="market-field">
                      <label>{language === "de" ? "Kindertickets" : language === "en" ? "Child tickets" : language === "ca" ? "Entrades infantils" : "Entradas infantiles"}</label>
                      <input
                        inputMode="numeric"
                        type="number"
                        min="0"
                        step="1"
                        value={
                          sellerChildTickets
                        }
                        onChange={(
                          event
                        ) =>
                          setSellerChildTickets(
                            event.target.value
                          )
                        }
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div
                    className="market-field"
                    style={{
                      fontWeight: 700,
                      fontSize: "16px",
                    }}
                  >
                    <label>
                      {language === "de"
                        ? "Preisübersicht"
                        : language === "en"
                          ? "Price overview"
                          : language === "ca"
                            ? "Resum del preu"
                            : "Resumen del precio"}
                    </label>

                    <div style={{ display: "grid", gap: "6px", marginTop: "8px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "16px" }}>
                        <span>
                          {language === "de"
                            ? "Ticketpreis"
                            : language === "en"
                              ? "Ticket price"
                              : language === "ca"
                                ? "Preu de l'entrada"
                                : "Precio de la entrada"}
                        </span>
                        <strong>{sellerOfferTotal.toFixed(2)} €</strong>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", opacity: .8 }}>
                        <span>
                          {language === "de"
                            ? "PaseSpain Verkäufer-Service 10 %"
                            : language === "en"
                              ? "PaseSpain seller service 10%"
                              : language === "ca"
                                ? "Servei PaseSpain venedor 10 %"
                                : "Servicio PaseSpain vendedor 10 %"}
                        </span>
                        <span>- {sellerServiceFee.toFixed(2)} €</span>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", paddingTop: "6px", borderTop: "1px solid rgba(255,255,255,.18)" }}>
                        <span>
                          {language === "de"
                            ? "Deine Auszahlung"
                            : language === "en"
                              ? "Your payout"
                              : language === "ca"
                                ? "El teu pagament"
                                : "Tu cobro"}
                        </span>
                        <strong>{sellerPayoutTotal.toFixed(2)} €</strong>
                      </div>
                    </div>
                  </div>

                  <div className="market-field">
                    <label>{language === "de" ? "Kindertickets – Beschreibung" : language === "en" ? "Child tickets – description" : language === "ca" ? "Entrades infantils – descripció" : "Entradas infantiles – descripción"}</label>
                    <input
                      value={
                        sellerChildTicketDescription
                      }
                      onChange={(
                        event
                      ) =>
                        setSellerChildTicketDescription(
                          event.target.value
                        )
                      }
                      placeholder={language === "de" ? "z. B. gültig bis 14 Jahre" : language === "en" ? "e.g. valid up to age 14" : language === "ca" ? "p. ex. vàlida fins als 14 anys" : "p. ej. válida hasta los 14 años"}
                    />
                  </div>

                  <div className="market-field">
                    <label>{language === "de" ? "Beschreibung" : language === "en" ? "Description" : language === "ca" ? "Descripció" : "Descripción"}</label>
                    <textarea
                      value={
                        sellerDescription
                      }
                      onChange={(
                        event
                      ) =>
                        setSellerDescription(
                          event.target.value
                        )
                      }
                      placeholder={language === "de" ? "Block, Reihe, Sitzplatz, Anzahl Tickets, Besonderheiten …" : language === "en" ? "Block, row, seat, number of tickets, special notes …" : language === "ca" ? "Bloc, fila, seient, nombre d’entrades, observacions …" : "Bloque, fila, asiento, número de entradas, observaciones …"}
                    />
                  </div>

                  <div className="seller-fairplay-confirm">
                    <label>
                      <input
                        type="checkbox"
                        checked={sellerFairplayAccepted}
                        onChange={(event) =>
                          setSellerFairplayAccepted(event.target.checked)
                        }
                      />
                      <span>
                        <strong>⚽ PaseSpain Fairplay</strong>
                        <small>
                          {language === "de"
                            ? "Ich spiele fair und bestätige, dass dieses Ticket echt ist und rechtmässig angeboten und übertragen werden darf."
                            : language === "en"
                              ? "I play fair and confirm that this ticket is genuine and may legally be offered and transferred."
                              : language === "ca"
                                ? "Jugo net i confirmo que aquesta entrada és autèntica i es pot oferir i transferir legalment."
                                : "Juego limpio y confirmo que esta entrada es auténtica y puede ofrecerse y transferirse legalmente."}
                        </small>
                      </span>
                    </label>

                    <button
                      type="button"
                      className="seller-fairplay-info"
                      onClick={() => setFairplayOpen(true)}
                    >
                      {language === "de"
                        ? "Fairplay-Regeln ansehen"
                        : language === "en"
                          ? "View Fairplay rules"
                          : language === "ca"
                            ? "Veure les regles Fairplay"
                            : "Ver reglas Fairplay"}
                    </button>
                  </div>

                  {sellerOfferEditId && (
                    <div className="seller-edit-mode">
                      <strong>
                        {language === "de"
                          ? "Ticket wird bearbeitet"
                          : language === "en"
                            ? "Editing ticket"
                            : "Editando entrada"}
                      </strong>
                      <button
                        type="button"
                        onClick={cancelSellerOfferEdit}
                      >
                        {language === "de"
                          ? "Abbrechen"
                          : language === "en"
                            ? "Cancel"
                            : "Cancelar"}
                      </button>
                    </div>
                  )}

                  {
                    sellerPublishError && (
                      <p className="market-error">
                        {sellerPublishError}
                      </p>
                    )
                  }

                  <button
                    className="market-primary-button"
                    type="submit"
                    disabled={sellerPublishing}
                  >
                    {
                      sellerPublishing
                        ? sellerOfferEditId
                          ? language === "de"
                            ? "Änderungen werden gespeichert …"
                            : language === "en"
                              ? "Saving changes …"
                              : "Guardando cambios …"
                          : language === "de"
                            ? "Wird veröffentlicht …"
                            : language === "en"
                              ? "Publishing …"
                              : language === "ca"
                                ? "Publicant …"
                                : "Publicando …"
                        : sellerOfferEditId
                          ? language === "de"
                            ? "Änderungen speichern"
                            : language === "en"
                              ? "Save changes"
                              : "Guardar cambios"
                          : language === "de"
                            ? "Angebot veröffentlichen"
                            : language === "en"
                              ? "Publish offer"
                              : language === "ca"
                                ? "Publicar oferta"
                                : "Publicar oferta"
                    }
                  </button>
                </form>
              </div>
            </div>
          )
        }

        {
          fairplayOpen && (
            <div
              className="fairplay-modal-backdrop"
              role="presentation"
              onMouseDown={() => setFairplayOpen(false)}
            >
              <div
                className="fairplay-modal"
                role="dialog"
                aria-modal="true"
                aria-label="PaseSpain Fairplay"
                onMouseDown={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  className="fairplay-modal-close"
                  onClick={() => setFairplayOpen(false)}
                  aria-label="Schließen"
                >
                  ×
                </button>

                <div className="fairplay-modal-head">
                  <div>
                    <span>PaseSpain</span>
                    <h2>Fairplay</h2>
                    <p>
                      {language === "de"
                        ? "Fairplay beginnt beim Kaufen und Verkaufen."
                        : language === "en"
                          ? "Fair play starts when buying and selling."
                          : language === "ca"
                            ? "El fairplay comença en comprar i vendre."
                            : "El fairplay empieza al comprar y vender."}
                    </p>
                  </div>
                </div>

                <div className="fairplay-modal-scroll">
                  <section>
                    <h3>⚽ {language === "de" ? "Unsere Fairplay-Regeln" : language === "en" ? "Our Fairplay rules" : language === "ca" ? "Les nostres regles Fairplay" : "Nuestras reglas Fairplay"}</h3>
                    <p>
                      {language === "de"
                        ? "Nur echte Tickets mit vollständigen und wahrheitsgemäßen Angaben dürfen angeboten werden. Kein Doppelverkauf, keine Fälschungen und keine absichtliche Täuschung."
                        : language === "en"
                          ? "Only genuine tickets with complete and truthful information may be listed. No duplicate sales, counterfeits, or deliberate deception."
                          : language === "ca"
                            ? "Només es poden oferir entrades autèntiques amb informació completa i veraç. No es permet la venda duplicada, la falsificació ni l'engany deliberat."
                            : "Solo se pueden ofrecer entradas auténticas con información completa y veraz. No se permiten ventas duplicadas, falsificaciones ni engaños deliberados."}
                    </p>
                  </section>

                  <section className="fairplay-card-rule yellow">
                    <h3>🟨 {language === "de" ? "Gelbe Karte" : language === "en" ? "Yellow card" : language === "ca" ? "Targeta groga" : "Tarjeta amarilla"}</h3>
                    <p>
                      {language === "de"
                        ? "Bei unklaren oder falschen Angaben, fehlenden Nachweisen oder einem ersten Regelverstoss kann ein Angebot geprüft, korrigiert oder vorübergehend gesperrt werden."
                        : language === "en"
                          ? "Unclear or false information, missing proof, or a first rule violation may lead to review, correction, or temporary suspension of a listing."
                          : language === "ca"
                            ? "La informació poc clara o falsa, la manca de proves o una primera infracció poden comportar la revisió, correcció o suspensió temporal d'una oferta."
                            : "Los datos poco claros o falsos, la falta de pruebas o una primera infracción pueden provocar la revisión, corrección o suspensión temporal de una oferta."}
                    </p>
                  </section>

                  <section className="fairplay-card-rule red">
                    <h3>🟥 {language === "de" ? "Rote Karte" : language === "en" ? "Red card" : language === "ca" ? "Targeta vermella" : "Tarjeta roja"}</h3>
                    <p>
                      {language === "de"
                        ? "Bei Betrug, Fälschungen, Doppelverkauf oder schweren bzw. wiederholten Verstössen kann PaseSpain Angebote entfernen und Verkäuferkonten sperren."
                        : language === "en"
                          ? "Fraud, counterfeit tickets, duplicate sales, or serious/repeated violations may lead PaseSpain to remove listings and suspend seller accounts."
                          : language === "ca"
                            ? "El frau, les falsificacions, la venda duplicada o les infraccions greus o repetides poden comportar la retirada d'ofertes i el bloqueig del compte."
                            : "El fraude, las falsificaciones, la venta duplicada o las infracciones graves o repetidas pueden llevar a PaseSpain a retirar ofertas y bloquear cuentas."}
                    </p>
                  </section>

                  <section>
                    <h3>🏟️ {language === "de" ? "Regeln der Clubs und Veranstalter" : language === "en" ? "Club and organizer rules" : language === "ca" ? "Regles dels clubs i organitzadors" : "Reglas de clubes y organizadores"}</h3>
                    <p>
                      {language === "de"
                        ? "Ein Ticket darf nur angeboten werden, wenn seine Weitergabe nach den Bedingungen des Clubs bzw. Veranstalters zulässig ist. Personalisierte oder ausdrücklich nicht übertragbare Tickets dürfen nicht eingestellt werden. Manche Clubs oder einzelne Spiele haben strengere Regeln."
                        : language === "en"
                          ? "A ticket may only be listed if transfer is permitted by the club or organizer. Personalized or expressly non-transferable tickets may not be listed. Some clubs or individual matches apply stricter rules."
                          : language === "ca"
                            ? "Una entrada només es pot oferir si el club o l'organitzador en permet la transferència. No es poden publicar entrades personalitzades o expressament no transferibles. Alguns clubs o partits apliquen normes més estrictes."
                            : "Una entrada solo puede ofrecerse si el club o el organizador permite su transferencia. No se pueden publicar entradas personalizadas o expresamente no transferibles. Algunos clubes o partidos aplican normas más estrictas."}
                    </p>
                    <p className="fairplay-example">
                      {language === "de"
                        ? "Beispiel: Real Madrid weist bei bestimmten Tickets ausdrücklich auf persönliche und nicht übertragbare Tickets hin. FC Barcelona kann bei bestimmten Spielen die Übertragung untersagen und Tickets bei unerlaubtem Weiterverkauf annullieren."
                        : language === "en"
                          ? "Example: Real Madrid expressly identifies certain tickets as personal and non-transferable. FC Barcelona may prohibit transfers for specific matches and cancel tickets offered through unauthorized resale."
                          : language === "ca"
                            ? "Exemple: el Real Madrid identifica determinades entrades com a personals i no transferibles. El FC Barcelona pot prohibir transferències en partits concrets i anul·lar entrades revendudes sense autorització."
                            : "Ejemplo: el Real Madrid identifica determinadas entradas como personales e intransferibles. El FC Barcelona puede prohibir transferencias en partidos concretos y anular entradas revendidas sin autorización."}
                    </p>
                  </section>

                  <section>
                    <h3>⚖️ {language === "de" ? "Rechtslage in Spanien" : language === "en" ? "Legal situation in Spain" : language === "ca" ? "Situació legal a Espanya" : "Situación legal en España"}</h3>
                    <p>
                      {language === "de"
                        ? "Die Rechtslage ist nicht in allen autonomen Gemeinschaften identisch. Regionale Vorschriften können den Weiterverkauf einschränken oder verbieten. Das spanische Europäische Verbraucherzentrum weist ausdrücklich darauf hin, dass mehrere autonome Gemeinschaften Verbote vorsehen; Galicien verbietet beispielsweise ausdrücklich die telematische Weiterveräußerung."
                        : language === "en"
                          ? "The legal situation is not identical in every autonomous community. Regional rules may restrict or prohibit resale. Spain's European Consumer Centre expressly notes that several autonomous communities provide resale prohibitions; Galicia, for example, expressly prohibits online resale."
                          : language === "ca"
                            ? "La situació legal no és idèntica a totes les comunitats autònomes. Les normes regionals poden limitar o prohibir la revenda. El Centre Europeu del Consumidor d'Espanya assenyala expressament que diverses comunitats preveuen prohibicions; Galícia, per exemple, prohibeix expressament la revenda telemàtica."
                            : "La situación legal no es idéntica en todas las comunidades autónomas. Las normas regionales pueden limitar o prohibir la reventa. El Centro Europeo del Consumidor en España señala expresamente que varias comunidades contemplan prohibiciones; Galicia, por ejemplo, prohíbe expresamente la reventa telemática."}
                    </p>
                  </section>

                  <section>
                    <h3>🔎 {language === "de" ? "Vor dem Einstellen prüfen" : language === "en" ? "Check before listing" : language === "ca" ? "Comprova abans de publicar" : "Comprueba antes de publicar"}</h3>
                    <p>
                      {language === "de"
                        ? "Der Verkäufer muss vor jeder Veröffentlichung die Bedingungen des konkreten Tickets, des Clubs, des Veranstalters und die am Veranstaltungsort geltenden regionalen Vorschriften prüfen."
                        : language === "en"
                          ? "Before every listing, the seller must check the conditions of the specific ticket, the club and organizer rules, and the regional rules applicable at the event location."
                          : language === "ca"
                            ? "Abans de cada publicació, el venedor ha de comprovar les condicions de l'entrada concreta, les normes del club i organitzador i la normativa regional aplicable al lloc de l'esdeveniment."
                            : "Antes de cada publicación, el vendedor debe comprobar las condiciones de la entrada concreta, las reglas del club y organizador y la normativa regional aplicable en el lugar del evento."}
                    </p>
                  </section>

                  <div className="fairplay-official-links">
                    <a
                      href="https://portal-cec.consumo.gob.es/es/informacion-general/compras-online/reventa-de-entradas"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {language === "de" ? "Offizielle Verbraucherinformation Spanien ↗" : language === "en" ? "Official Spanish consumer information ↗" : language === "ca" ? "Informació oficial de consum a Espanya ↗" : "Información oficial de consumo en España ↗"}
                    </a>
                    <a
                      href="https://www.realmadrid.com/en-US/tickets"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Real Madrid – Tickets ↗
                    </a>
                    <a
                      href="https://www.fcbarcelona.com/en/tickets/football"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      FC Barcelona – Tickets ↗
                    </a>
                  </div>

                  <p className="fairplay-legal-note">
                    {language === "de"
                      ? "Hinweis: Diese Fairplay-Information ersetzt keine individuelle Rechtsberatung. Maßgeblich sind immer die Bedingungen des konkreten Tickets sowie die jeweils geltenden Vorschriften."
                      : language === "en"
                        ? "Note: This Fairplay information does not replace individual legal advice. The specific ticket terms and applicable law always prevail."
                        : language === "ca"
                          ? "Avís: aquesta informació de Fairplay no substitueix l'assessorament jurídic individual. Sempre prevalen les condicions de l'entrada concreta i la normativa aplicable."
                          : "Aviso: esta información Fairplay no sustituye el asesoramiento jurídico individual. Siempre prevalecen las condiciones de la entrada concreta y la normativa aplicable."}
                  </p>
                </div>
              </div>
            </div>
          )
        }

        {
          cartOpen && (
            <div
              className="market-modal-backdrop"
              role="presentation"
              onMouseDown={() =>
                setCartOpen(
                  false
                )
              }
            >
              <div
                className="market-modal"
                role="dialog"
                aria-modal="true"
                aria-label="Warenkorb"
                onMouseDown={(
                  event
                ) =>
                  event.stopPropagation()
                }
              >
                <div className="market-modal-head">
                  <h2>
                    {
                      language === "de"
                        ? "Warenkorb"
                        : language === "en"
                          ? "Cart"
                          : language === "ca"
                            ? "Carret"
                            : "Carrito"
                    }
                  </h2>

                  <button
                    className="market-modal-close"
                    type="button"
                    aria-label="Schließen"
                    onClick={() =>
                      setCartOpen(
                        false
                      )
                    }
                  >
                    ×
                  </button>
                </div>

                {
                  cartItems.length ===
                  0
                    ? (
                      <p className="market-note">
                        {
                          language === "de"
                            ? "Der Warenkorb ist leer."
                            : language === "en"
                              ? "Your cart is empty."
                              : language === "ca"
                                ? "El carret és buit."
                                : "El carrito está vacío."
                        }
                      </p>
                    )
                    : (
                      <>
                        {
                          cartItems.map(
                            (
                              item,
                              index
                            ) => (
                              <div
                                className="cart-line"
                                key={`${item.home}-${item.away}-${index}`}
                              >
                                <div>
                                  <strong>
                                    {
                                      item.home
                                    }{" "}
                                    vs{" "}
                                    {
                                      item.away
                                    }
                                  </strong>
                                  <span>
                                    {
                                      item.date
                                    } ·{" "}
                                    {
                                      item.stadium
                                    }
                                  </span>
                                  <span>
                                    {
                                      item.ticketCount || 1
                                    }{" "}
                                    Ticket{
                                      (item.ticketCount || 1) === 1
                                        ? ""
                                        : "s"
                                    } · Einzelpreis{" "}
                                    {
                                      item.price
                                    }
                                    {
                                      (item.childTickets || 0) > 0
                                        ? ` · Kindertickets: ${item.childTickets}`
                                        : ""
                                    }
                                  </span>
                                </div>

                                <strong>
                                  {
                                    (
                                      (item.unitPrice ||
                                        Number(
                                          item.price
                                            .replace(
                                              /[^0-9.,]/g,
                                              ""
                                            )
                                            .replace(
                                              ",",
                                              "."
                                            )
                                        ) ||
                                        0) *
                                      (item.ticketCount || 1)
                                    ).toFixed(2)
                                  }€
                                </strong>

                                <button
                                  className="cart-remove"
                                  type="button"
                                  aria-label="Entfernen"
                                  onClick={() =>
                                    removeFromCart(
                                      index
                                    )
                                  }
                                >
                                  ×
                                </button>
                              </div>
                            )
                          )
                        }

                        <div style={{ display: "grid", gap: "7px", marginTop: "14px", paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,.18)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: "16px" }}>
                            <span>
                              {language === "de"
                                ? "Tickets"
                                : language === "en"
                                  ? "Tickets"
                                  : language === "ca"
                                    ? "Entrades"
                                    : "Entradas"}
                            </span>
                            <span>{cartTicketSubtotal.toFixed(2)}€</span>
                          </div>

                          <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", opacity: .8 }}>
                            <span>
                              {language === "de"
                                ? "PaseSpain Käufer-Service 10 %"
                                : language === "en"
                                  ? "PaseSpain buyer service 10%"
                                  : language === "ca"
                                    ? "Servei PaseSpain comprador 10 %"
                                    : "Servicio PaseSpain comprador 10 %"}
                            </span>
                            <span>{cartBuyerServiceFee.toFixed(2)}€</span>
                          </div>
                        </div>

                        <div className="cart-total">
                          <span>
                            {language === "de"
                              ? "Zu bezahlen"
                              : language === "en"
                                ? "Total to pay"
                                : language === "ca"
                                  ? "Total a pagar"
                                  : "Total a pagar"}
                          </span>

                          <strong>{cartTotal.toFixed(2)}€</strong>
                        </div>

                        <button
                          className="market-primary-button"
                          type="button"
                          disabled={checkoutLoading}
                          onClick={handleCheckout}
                        >
                          {
                            checkoutLoading
                              ? (language === "de" ? "Stripe wird geöffnet …" : "Opening Stripe …")
                              : language === "de"
                              ? "Zur Zahlung"
                              : language === "en"
                                ? "Checkout"
                                : language === "ca"
                                  ? "Pagar"
                                  : "Pagar"
                          }
                        </button>
                        {checkoutError && (
                          <p className="market-error" style={{ marginTop: "10px" }}>
                            {checkoutError}
                          </p>
                        )}
                      </>
                    )
                }
              </div>
            </div>
          )
        }

        <footer
          className="legal-footer"
          aria-label={language === "es" ? "Información legal" : language === "ca" ? "Informació legal" : language === "en" ? "Legal information" : "Rechtliche Hinweise"}
        >
          <a href={`/terminos?lang=${language}`}>
            {language === "de" ? "AGB" : language === "en" ? "Terms & Conditions" : language === "ca" ? "Termes i Condicions" : "Términos y Condiciones"}
          </a>
          <span aria-hidden="true">·</span>
          <a href={`/privacidad?lang=${language}`}>
            {language === "de" ? "Datenschutz" : language === "en" ? "Privacy Policy" : language === "ca" ? "Política de Privacitat" : "Política de Privacidad"}
          </a>
          <span aria-hidden="true">·</span>
          <a href={`/aviso-legal?lang=${language}`}>
            {language === "de" ? "Impressum" : language === "en" ? "Legal Notice" : language === "ca" ? "Avís Legal" : "Aviso Legal"}
          </a>
        </footer>

        <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
          <button
            type="button"
            className={mobilePage === "home" ? "mobile-nav-active" : ""}
            onClick={() => {
              setMobilePage("home");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            Start
          </button>

          <button
            type="button"
            className={mobilePage === "tickets" ? "mobile-nav-active" : ""}
            onClick={() => {
              setMobilePage("tickets");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            Tickets
          </button>

          <button
            type="button"
            onClick={() => openRoleArea("seller")}
          >
            Verkaufen
          </button>

          <button
            type="button"
            onClick={() => setCartOpen(true)}
            aria-label={t.cart}
          >
            {t.cart}{cartItems.length > 0 ? ` (${cartItems.length})` : ""}
          </button>
        </nav>

        <div
          className="design-credit"
          aria-label="Design by Lisa und Daniel"
        >
          design by Lisa &amp; Daniel
        </div>

      <style>{`
        .match-card .match-info > span {
          font-family: inherit !important;
          font-size: 15px !important;
          font-style: normal !important;
          font-weight: 610 !important;
          line-height: 1.28 !important;
          letter-spacing: 0 !important;
          color: #253041 !important;
          opacity: 1 !important;
          text-shadow: 0 1px 0 rgba(255,255,255,.28) !important;
        }
      `}</style>

      <style>{`
        @media (max-width: 767px) and (hover: none) and (pointer: coarse) {
          .psv2-mobile-subtitle {
            top: calc(170px + env(safe-area-inset-top, 0px)) !important;
            width: min(94vw, 440px) !important;
            padding: 0 10px !important;
            border: 0 !important;
            border-radius: 0 !important;
            background: transparent !important;
            box-shadow: none !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
            font-family: "Inter", "Segoe UI", Arial, sans-serif !important;
            font-size: clamp(20px, 5.5vw, 23px) !important;
            font-weight: 820 !important;
            line-height: 1.1 !important;
            letter-spacing: .1px !important;
            text-shadow: 0 1px 2px rgba(255,255,255,.28) !important;
            background-image: linear-gradient(90deg, #173a8f 0%, #19b873 100%) !important;
            -webkit-background-clip: text !important;
            background-clip: text !important;
            color: transparent !important;
            -webkit-text-fill-color: transparent !important;
          }

          .psv2-legal-links {
            position: relative !important;
            z-index: 10020 !important;
            pointer-events: auto !important;
          }

          .psv2-legal-links a {
            position: relative !important;
            z-index: 10021 !important;
            pointer-events: auto !important;
            touch-action: manipulation !important;
          }
        }

      `}</style>



      <PaseSpainVoiceAssistant
        open={voiceAssistantOpen}
        onClose={() => setVoiceAssistantOpen(false)}
        language={language}
        offers={currentPaseSpainOffers}
        onAddToCart={(offer) => {
          const canAdd = loggedInRole === "buyer";
          addToCart(offer);

          return canAdd
            ? {
                added: true,
                message:
                  language === "de"
                    ? "Das Ticket ist im Warenkorb. Bitte öffne den Warenkorb und schliesse den Kauf über den Checkout ab."
                    : language === "en"
                      ? "The ticket is in your cart. Please open the cart and complete the purchase through checkout."
                      : language === "ca"
                        ? "L'entrada és al carret. Obre el carret i completa la compra mitjançant el checkout."
                        : "La entrada está en el carrito. Abre el carrito y completa la compra mediante el checkout.",
              }
            : {
                added: false,
                message:
                  language === "de"
                    ? "Bitte melde dich zuerst als Käufer an. Danach kann das Ticket in den Warenkorb gelegt werden."
                    : language === "en"
                      ? "Please sign in as a buyer first. The ticket can then be added to the cart."
                      : language === "ca"
                        ? "Inicia sessió primer com a comprador. Després podràs afegir l'entrada al carret."
                        : "Inicia sesión primero como comprador. Después podrás añadir la entrada al carrito.",
              };
        }}
        onSearchTickets={() => {
          // Amelia durchsucht ihre bereits geladenen PaseSpain-Angebote selbst.
          // Die Hauptseite wird dabei absichtlich nicht verändert.
        }}
      />

      <style>{`
        @media (max-width: 767px) and (hover: none) and (pointer: coarse) {
          .psv2-mobile-logo {
            width: clamp(270px, 75vw, 320px) !important;
            max-width: 320px !important;
          }

          .psv2-mobile-subtitle {
            top: calc(225px + env(safe-area-inset-top, 0px)) !important;
            font-weight: 500 !important;
            background-image: linear-gradient(90deg, #173a8f 0%, #19b873 100%) !important;
            -webkit-background-clip: text !important;
            background-clip: text !important;
            color: transparent !important;
            -webkit-text-fill-color: transparent !important;
            opacity: 1 !important;
            visibility: visible !important;
          }
        }

      

        /* Amelia links, Social Media rechts, Google Maps farbiger */
        .amelia-home-card { overflow: hidden !important; padding: 0 !important; min-height: 300px; box-shadow: 0 24px 54px rgba(3,18,46,.28), 0 8px 20px rgba(14,66,128,.16), inset 0 1px 0 rgba(255,255,255,.86) !important; }
        .amelia-home-button { position: relative; width: 100%; height: 100%; min-height: 300px; padding: 0; border: 0; border-radius: inherit; overflow: hidden; cursor: pointer; background: transparent; color: inherit; text-align: left; }
        .amelia-home-portrait { position: absolute; inset: 0; overflow: hidden; }
        .amelia-home-portrait::after { content: ""; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(4,18,45,.00) 48%, rgba(4,18,45,.10) 68%, rgba(4,18,45,.64) 100%); pointer-events: none; }
        .amelia-home-image { object-fit: contain; object-position: 70% 50%; transform: scale(1.12); }
        .amelia-home-copy { position: absolute; z-index: 2; left: 16px; right: 16px; bottom: 14px; display: flex; flex-direction: column; align-items: flex-start; color: #fff; text-shadow: 0 2px 8px rgba(0,0,0,.62); }
        .amelia-home-copy strong { font-size: 30px; line-height: 1; font-weight: 900; letter-spacing: -.03em; }
        .amelia-signature { font-family: "Segoe Script", "Bradley Hand", "Brush Script MT", cursive; font-size: 40px !important; font-weight: 700 !important; letter-spacing: .01em !important; transform: rotate(-4deg); transform-origin: left center; margin: 0 0 8px 2px; }
        .amelia-home-cta { position: relative; overflow: hidden; margin-top: 12px; min-height: 42px; padding: 0 15px; display: inline-flex; align-items: center; gap: 8px; border: 1px solid rgba(255,255,255,.78); border-radius: 999px; background: linear-gradient(135deg, rgba(35,104,222,.72) 0%, rgba(24,160,205,.66) 54%, rgba(25,186,148,.62) 100%); -webkit-backdrop-filter: blur(16px) saturate(155%); backdrop-filter: blur(16px) saturate(155%); box-shadow: 0 12px 28px rgba(8,69,143,.28), 0 3px 10px rgba(20,174,158,.16), inset 0 1px 0 rgba(255,255,255,.72), inset 0 -1px 0 rgba(4,68,118,.14); font-size: 13px; font-weight: 850; text-shadow: 0 1px 2px rgba(0,42,85,.18); }
        .amelia-home-cta::before { content: ""; position: absolute; left: 8%; right: 8%; top: 3px; height: 42%; border-radius: 999px; background: linear-gradient(180deg, rgba(255,255,255,.55), rgba(255,255,255,.06)); opacity: .72; pointer-events: none; }
        .amelia-home-cta::after { content: ""; position: absolute; width: 42px; height: 72px; left: -16px; top: -17px; transform: rotate(22deg); background: linear-gradient(90deg, rgba(255,255,255,.00), rgba(255,255,255,.34), rgba(255,255,255,.00)); filter: blur(1px); pointer-events: none; }
        .amelia-home-cta > * { position: relative; z-index: 1; }
        .amelia-home-cta svg { width: 19px; height: 19px; filter: drop-shadow(0 1px 2px rgba(0,45,88,.22)); }
        .amelia-home-button:hover .amelia-home-cta { background: linear-gradient(135deg, rgba(46,119,235,.78) 0%, rgba(31,174,212,.72) 52%, rgba(31,198,155,.68) 100%); box-shadow: 0 14px 30px rgba(8,69,143,.31), 0 4px 12px rgba(20,174,158,.20), inset 0 1px 0 rgba(255,255,255,.82); }
        .social-apps-only { display: flex !important; align-items: center !important; justify-content: center !important; width: 100%; padding: 8px 0 2px !important; transform: none !important; }
        .social-apps-only .social-links-grid { grid-template-columns: repeat(5, 48px) !important; grid-auto-rows: 48px !important; gap: 9px !important; }
        .social-apps-only .social-app-button { width: 48px !important; height: 48px !important; }
        .google-map-preview { border: 1px solid rgba(255,255,255,.78) !important; box-shadow: 0 16px 34px rgba(2,15,38,.20), inset 0 1px 0 rgba(255,255,255,.76) !important; background: rgba(255,255,255,.12) !important; }
        .google-map-frame { filter: saturate(.82) contrast(.96) brightness(1.04) !important; opacity: .91 !important; }
        .psv2-amelia-help { width: 100%; color: inherit; text-align: left; cursor: pointer; font-family: inherit; }
        .psv2-info-card-mic { background: linear-gradient(145deg, rgba(49,123,255,.92), rgba(26,175,210,.86)) !important; color: #fff !important; box-shadow: 0 8px 18px rgba(26,91,190,.32), inset 0 1px 0 rgba(255,255,255,.48); }
        .psv2-info-card-mic svg { width: 23px; height: 23px; }
        @media (max-width: 760px) and (hover: none) and (pointer: coarse) {
          .amelia-home-card, .amelia-home-button { min-height: 255px; }
          .social-apps-only .social-links-grid { grid-template-columns: repeat(5, 39px) !important; grid-auto-rows: 39px !important; gap: 7px !important; }
        }
`}</style>

    </main>
  );
}