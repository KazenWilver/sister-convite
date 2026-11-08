import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Experience } from "@/components/invite/Experience";
import { EVENT } from "@/lib/config";
import { findGuestByToken, toPublic, toPublicEvent } from "@/lib/guests";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const g = await findGuestByToken(token);
  if (!g || g.status !== "active") return { title: "Convite" };
  const title = `${g.displayName}, ${g.seats > 1 ? "estão convidados" : "tens um convite"} 🎓`;
  const description = `Licenciatura de ${EVENT.graduate} · ${EVENT.course} · 28 de Novembro de 2026. Abre o convite.`;
  return {
    title,
    description,
    manifest: `/c/${token}/manifest.webmanifest`,
    appleWebApp: { capable: true, title: "Juceline 🎓", statusBarStyle: "black-translucent" },
    icons: { icon: "/icons/icon-128.png", apple: "/icons/apple-touch-icon.png" },
    openGraph: { title, description, type: "website", locale: "pt_AO", siteName: "Convite da Juceline" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function InvitePage({ params }: Props) {
  const { token } = await params;
  const g = await findGuestByToken(token);
  if (!g || g.status !== "active") notFound();
  const settings = await store.getSettings();
  return <Experience token={token} guest={toPublic(g, settings)} event={toPublicEvent(settings)} />;
}
