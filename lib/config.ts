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
  timezone: "Africa/Luanda", // WAT, UTC+1
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
