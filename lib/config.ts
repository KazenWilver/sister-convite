// Dados fixos da celebração (verificados — ver docs/PLANO.md §1).
export const EVENT = {
  graduate: "Juceline Vieira Dias",
  firstName: "Juceline",
  lastNames: "Vieira Dias",
  monogram: "JVD",
  course: "Contabilidade e Finanças",
  institution: "ISAF — Academia BAI",
  institutionLong: "Instituto Superior de Administração e Finanças",
  city: "Luanda",
  dateISO: "2026-11-28",
  dateLabel: "Sábado, 28 de Novembro de 2026",
  time: "18:00",
  timeLabel: "18:00 (6:00 PM)",
  timezone: "Africa/Luanda", // WAT, UTC+1
  venueName: "Residência Mateus Neto",
  venueMaps: "https://maps.app.goo.gl/3RNEu6oC7nJmWgs76", // o local com nome no Google Maps
  lat: -8.9872197,
  lng: 13.1737619,
  hosts: "Juceline e família",
} as const;

export function siteUrl(): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}

export function inviteUrl(token: string): string {
  return `${siteUrl()}/c/${token}`;
}
