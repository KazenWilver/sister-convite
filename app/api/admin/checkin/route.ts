import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { toAdmin } from "@/lib/admin";
import { store } from "@/lib/store";

// Entrada na festa: regista (uma vez) ou anula a entrada de um convite.
export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = (await req.json().catch(() => ({}))) as { id?: string; action?: "checkin" | "undo"; people?: number };
  const g = typeof body.id === "string" ? await store.getGuest(body.id) : null;
  if (!g) return NextResponse.json({ error: "Convidado não encontrado." }, { status: 404 });

  if (body.action === "undo") {
    const u = await store.updateGuest(g.id, { checkedInAt: null, checkedInPeople: 0 });
    await store.log(g.id, "checkin-undo", null);
    return NextResponse.json({ guest: toAdmin(u!) });
  }
  if (g.checkedInAt) return NextResponse.json({ guest: toAdmin(g), already: true });
  const max = Math.max(1, g.attending || g.seats);
  const people = Math.min(g.seats, Math.max(1, Math.round(Number(body.people ?? max))));
  const u = await store.updateGuest(g.id, { checkedInAt: new Date().toISOString(), checkedInPeople: people });
  await store.log(g.id, "checkin", String(people));
  return NextResponse.json({ guest: toAdmin(u!) });
}
