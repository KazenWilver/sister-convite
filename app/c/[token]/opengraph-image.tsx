import { promises as fs } from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";
import { findGuestByToken } from "@/lib/guests";

// Imagem da pré-visualização no WhatsApp (1200×630), personalizada com o nome do convidado.
// O WhatsApp muitas vezes mostra só um QUADRADO recortado ao centro (x 285–915): por isso tudo
// o que importa está centrado e cabe numa coluna de 560 px; os lados são só decoração.
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
  const [bold, italic] = await Promise.all([font("fraunces-latin-700-normal.woff"), font("fraunces-latin-400-italic.woff")]);
  // o nome tem de caber em ~500 px: encolhe nos nomes compridos
  const nameSize = name ? Math.round(Math.min(40, 500 / (name.length * 0.56))) : 40;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          background: "radial-gradient(circle at 50% 42%, #1f5fbf 0%, #12336b 38%, #0a1f44 70%, #050d1f 100%)",
        }}
      >
        {/* decoração nos lados (fora do quadrado central) */}
        <div style={{ position: "absolute", left: -170, top: -150, width: 460, height: 460, borderRadius: 230, background: "rgba(79,143,230,0.28)", display: "flex" }} />
        <div style={{ position: "absolute", right: -160, bottom: -190, width: 480, height: 480, borderRadius: 240, background: "rgba(31,95,191,0.42)", display: "flex" }} />
        <div style={{ position: "absolute", left: 96, bottom: 70, width: 120, height: 120, borderRadius: 60, border: "2px solid rgba(141,188,242,0.35)", display: "flex" }} />
        <div style={{ position: "absolute", right: 110, top: 80, width: 70, height: 70, borderRadius: 35, border: "2px solid rgba(141,188,242,0.35)", display: "flex" }} />

        {/* coluna central: tudo o que se lê */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 560 }}>
          <div style={{ display: "flex", fontSize: 20, letterSpacing: 7, color: "#8dbcf2", fontFamily: "Fraunces" }}>CONVITE · LICENCIATURA</div>
          <div style={{ display: "flex", fontSize: 144, color: "#ffffff", fontFamily: "Fraunces Italic", fontStyle: "italic", lineHeight: 1, marginTop: 6 }}>Juceline</div>
          <div style={{ display: "flex", fontSize: 24, letterSpacing: 4, color: "#d6e8fb", fontFamily: "Fraunces", marginTop: 6 }}>CONTABILIDADE E FINANÇAS</div>
          {name && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                marginTop: 30,
                padding: "14px 30px 16px",
                maxWidth: 560,
                background: "#ffffff",
                borderRadius: 10,
                boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
              }}
            >
              <div style={{ display: "flex", fontSize: 18, letterSpacing: 4, color: "#1f5fbf", fontFamily: "Fraunces" }}>PARA</div>
              <div style={{ display: "flex", textAlign: "center", fontSize: nameSize, color: "#0a1f44", fontFamily: "Fraunces", lineHeight: 1.1, marginTop: 2 }}>{name}</div>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", marginTop: 28, fontSize: 28, letterSpacing: 6, color: "#ffffff", fontFamily: "Fraunces" }}>
            <span style={{ width: 40, height: 2, background: "#4f8fe6", marginRight: 18 }} />
            28 · 11 · 2026
            <span style={{ width: 40, height: 2, background: "#4f8fe6", marginLeft: 18 }} />
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Fraunces", data: bold, weight: 700, style: "normal" },
        { name: "Fraunces Italic", data: italic, weight: 400, style: "italic" },
      ],
      headers: { "Cache-Control": "public, max-age=86400" },
    },
  );
}
