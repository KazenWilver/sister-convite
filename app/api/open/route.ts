import { NextResponse } from "next/server";
import { deviceTag } from "@/lib/crypto";
import { findGuestByToken } from "@/lib/guests";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { store } from "@/lib/store";

// Regista a abertura do convite. É chamado pelo browser (JavaScript) e não pela renderização
// do servidor, para que a pré-visualização do WhatsApp não conte como "aberto".
// Guarda também um hash curto do dispositivo: no admin vê-se em quantos telemóveis o convite
// foi aberto, o que denuncia um link reencaminhado.
export async function POST(req: Request) {
  if (!rateLimit(`open:${clientIp(req)}`, 30, 60_000)) return NextResponse.json({ ok: false }, { status: 429 });
  const { token, device } = (await req.json().catch(() => ({}))) as { token?: string; device?: string };
  const g = token ? await findGuestByToken(token) : null;
  if (!g) return NextResponse.json({ ok: false }, { status: 404 });
  const now = new Date().toISOString();
  const devices = [...(g.devices ?? [])];
  if (typeof device === "string" && /^[a-z0-9]{16,40}$/i.test(device)) {
    const tag = deviceTag(device);
    if (!devices.includes(tag) && devices.length < 12) devices.push(tag);
  }
  if (!g.firstOpenedAt) await store.log(g.id, "open", null);
  await store.updateGuest(g.id, { firstOpenedAt: g.firstOpenedAt ?? now, lastOpenedAt: now, openCount: g.openCount + 1, devices });
  return NextResponse.json({ ok: true });
}
