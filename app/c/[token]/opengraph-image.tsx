import { promises as fs } from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";
import { findGuestByToken } from "@/lib/guests";

// Imagem da pré-visualização no WhatsApp (1200×630), personalizada com o nome do convidado.
// Não mostra a morada nem outros dados.
export const runtime = "nodejs";
export const alt = "Convite para a licenciatura da Juceline Vieira Dias";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// As letras vivem em assets/fonts (incluídas no servidor pelo next.config); node_modules não vai para a Vercel.
const font = (f: string) => fs.readFile(path.join(process.cwd(), "assets", "fonts", f));

export default async function Image({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const g = await findGuestByToken(token);
  const name = g && g.status === "active" ? g.displayName : null;
  const [fr600, fr600i] = await Promise.all([
    font("fraunces-latin-700-normal.woff"),
    font("fraunces-latin-400-italic.woff"),
  ]);

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "linear-gradient(160deg, #12336b 0%, #0a1f44 55%, #050d1f 100%)", padding: 40, position: "relative" }}>
        <div style={{ position: "absolute", right: -120, top: -160, width: 520, height: 520, borderRadius: 260, background: "rgba(79,143,230,0.35)", display: "flex" }} />
        <div style={{ position: "absolute", left: -140, bottom: -220, width: 520, height: 520, borderRadius: 260, background: "rgba(31,95,191,0.45)", display: "flex" }} />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1, paddingLeft: 40 }}>
          <div style={{ fontSize: 22, letterSpacing: 8, color: "#8dbcf2", fontFamily: "Fraunces" }}>CONVITE · LICENCIATURA 2026</div>
          {name && (
            <div style={{ display: "flex", marginTop: 28, background: "#ffffff", padding: "18px 28px", borderRadius: 6, transform: "rotate(-2deg)", maxWidth: 760, flexDirection: "column" }}>
              <div style={{ fontSize: 24, color: "#1f5fbf", fontFamily: "Fraunces" }}>Com muito carinho, convidamos</div>
              <div style={{ fontSize: name.length > 26 ? 44 : 54, color: "#0a1f44", fontFamily: "Fraunces", lineHeight: 1.05, marginTop: 4 }}>{name}</div>
            </div>
          )}
          <div style={{ fontSize: 30, color: "#d6e8fb", fontFamily: "Fraunces Italic", fontStyle: "italic", marginTop: 30 }}>para celebrar a licenciatura de</div>
          <div style={{ fontSize: 120, color: "#ffffff", fontFamily: "Fraunces Italic", fontStyle: "italic", lineHeight: 1, marginTop: 2 }}>Juceline</div>
          <div style={{ display: "flex", alignItems: "center", marginTop: 18, fontSize: 24, color: "#8dbcf2", fontFamily: "Fraunces", letterSpacing: 3 }}>
            <span>CONTABILIDADE E FINANÇAS</span>
            <span style={{ width: 8, height: 8, background: "#4f8fe6", margin: "0 18px", transform: "rotate(45deg)" }} />
            <span>28 · 11 · 2026</span>
          </div>
        </div>
        <div style={{ position: "absolute", right: 70, bottom: 64, width: 150, height: 150, borderRadius: 75, background: "radial-gradient(circle at 35% 30%, #ffffff, #8dbcf2 45%, #1f5fbf)", display: "flex", alignItems: "center", justifyContent: "center", color: "#0a1f44", fontSize: 44, fontFamily: "Fraunces", border: "3px solid rgba(255,255,255,0.5)" }}>
          JVD
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Fraunces", data: fr600, weight: 700, style: "normal" },
        { name: "Fraunces Italic", data: fr600i, weight: 400, style: "italic" },
      ],
      headers: { "Cache-Control": "public, max-age=86400" },
    },
  );
}
