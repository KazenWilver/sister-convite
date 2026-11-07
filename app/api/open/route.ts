import { NextResponse } from "next/server";
import { findGuestByToken } from "@/lib/guests";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { store } from "@/lib/store";

// Regista a abertura do convite. É chamado pelo browser (JavaScript) e não pela renderização
// do servidor, para que a pré-visualização do WhatsApp não conte como "aberto".
export async function POST(req: Request) {
  if (!rateLimit(`open:${clientIp(req)}`, 30, 60_000)) return NextResponse.json({ ok: false }, { status: 429 });
  const { token } = (await req.json().catch(() => ({}))) as { token?: string };
  const g = token ? await findGuestByToken(token) : null;
  if (!g) return NextResponse.json({ ok: false }, { status: 404 });
  const now = new Date().toISOString();
  await store.updateGuest(g.id, { firstOpenedAt: g.firstOpenedAt ?? now, lastOpenedAt: now, openCount: g.openCount + 1 });
  return NextResponse.json({ ok: true });
}
