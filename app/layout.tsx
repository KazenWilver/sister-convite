import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope, Pinyon_Script } from "next/font/google";
import { siteUrl } from "@/lib/config";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});
// Títulos e nomes: Fraunces (serifa com eixo óptico). Detalhes: Manrope. Só o nome da Juceline: Pinyon Script.
const body = Manrope({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const script = Pinyon_Script({ subsets: ["latin"], weight: "400", variable: "--font-script", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: "Um convite especial",
  description: "Convite privado.",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  referrer: "no-referrer",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0a1f44",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt" className={`${display.variable} ${body.variable} ${script.variable}`}>
      {/* suppressHydrationWarning: extensões como o Grammarly acrescentam atributos ao <body> */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
