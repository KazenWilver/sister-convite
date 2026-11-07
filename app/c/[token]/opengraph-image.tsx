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

const font = (f: string) => fs.readFile(path.join(process.cwd(), "node_modules", f));

export default async function Image({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const g = await findGuestByToken(token);
  const name = g && g.status === "active" ? g.displayName : null;
  const [fr600, fr600i, cav] = await Promise.all([
    font("@fontsource/fraunces/files/fraunces-latin-700-normal.woff"),
    font("@fontsource/fraunces/files/fraunces-latin-400-italic.woff"),
    font("@fontsource/caveat/files/caveat-latin-700-normal.woff"),
  ]);

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#1d1006", padding: 34 }}>
        <div
          style={{
            flex: 1,
            display: "flex",
            borderRadius: 18,
            background: "linear-gradient(160deg, #f4e9dc 0%, #ecdcc9 60%, #e2cbb2 100%)",
            border: "2px solid #c9a35a",
            padding: "46px 64px",
            position: "relative",
          }}
        >
          <div style={{ position: "absolute", top: 12, left: 12, right: 12, bottom: 12, border: "1px solid rgba(171,119,67,0.45)", borderRadius: 10, display: "flex" }} />
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1 }}>
            <div style={{ fontSize: 22, letterSpacing: 7, color: "#ab7743", fontWeight: 700, fontFamily: "Fraunces" }}>DIPLOMA DE CONVITE</div>
            <div style={{ fontSize: 34, color: "#6d3914", fontFamily: "Fraunces Italic", fontStyle: "italic", marginTop: 26 }}>{name ? "Para" : "Um convite para"}</div>
            {name && <div style={{ fontSize: name.length > 26 ? 60 : 74, color: "#6d3914", fontFamily: "Caveat", lineHeight: 1, marginTop: 4, maxWidth: 720 }}>{name}</div>}
            <div style={{ fontSize: 30, color: "#4c2b08", fontFamily: "Fraunces Italic", fontStyle: "italic", marginTop: 26 }}>{name ? "um convite para celebrar a licenciatura de" : "celebrar a licenciatura de"}</div>
            <div style={{ fontSize: 96, color: "#4c2b08", fontFamily: "Fraunces", lineHeight: 0.95, letterSpacing: -2, marginTop: 4 }}>Juceline Vieira Dias</div>
            <div style={{ display: "flex", alignItems: "center", marginTop: 26, fontSize: 24, color: "#6d3914", fontFamily: "Fraunces", letterSpacing: 2 }}>
              <span>CONTABILIDADE E FINANÇAS</span>
              <span style={{ width: 8, height: 8, background: "#c9a35a", margin: "0 18px", transform: "rotate(45deg)" }} />
              <span>28 · 11 · 2026</span>
            </div>
          </div>
          <div style={{ position: "absolute", right: 64, top: 52, width: 120, height: 120, borderRadius: 60, background: "radial-gradient(circle at 35% 30%, #efd7a0, #c9a35a 45%, #8a6428)", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b4716", fontSize: 38, fontFamily: "Fraunces" }}>
            JVD
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Fraunces", data: fr600, weight: 700, style: "normal" },
        { name: "Fraunces Italic", data: fr600i, weight: 400, style: "italic" },
        { name: "Caveat", data: cav, weight: 700, style: "normal" },
      ],
      headers: { "Cache-Control": "public, max-age=86400" },
    },
  );
}
