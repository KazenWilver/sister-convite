import { NextResponse } from "next/server";
import { findGuestByToken } from "@/lib/guests";

// Manifesto da "aplicação" de cada convidado: abre directamente no seu próprio convite.
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const g = await findGuestByToken(token);
  if (!g || g.status !== "active") return new NextResponse("Not found", { status: 404 });
  const start = `/c/${token}`;
  return NextResponse.json(
    {
      id: start,
      name: "Convite da Juceline",
      short_name: "Juceline 🎓",
      description: "Licenciatura da Juceline · 28 de Novembro de 2026",
      start_url: start,
      scope: start,
      display: "standalone",
      orientation: "portrait",
      background_color: "#0a1f44",
      theme_color: "#0a1f44",
      lang: "pt",
      icons: [
        { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
        { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
        { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
    },
    { headers: { "Content-Type": "application/manifest+json", "Cache-Control": "private, no-store" } },
  );
}
