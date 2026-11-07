import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { toAdmin } from "@/lib/admin";
import { computeStats, newGuest, parseGuestLine } from "@/lib/guests";
import { store, type Guest } from "@/lib/store";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const [guests, settings] = await Promise.all([store.listGuests(), store.getSettings()]);
  return NextResponse.json({ guests: guests.map(toAdmin), stats: computeStats(guests, settings), settings });
}

/** Criar um convidado ({guest}) ou importar uma lista ({importText, dryRun}). */
export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = (await req.json().catch(() => ({}))) as {
    guest?: Partial<Guest> & { displayName?: string };
    importText?: string;
    dryRun?: boolean;
  };
  const existing = await store.listGuests();
  let order = existing.reduce((m, g) => Math.max(m, g.sortOrder), 0);

  if (typeof body.importText === "string") {
    const known = new Set(existing.map((g) => (g.fullName ?? g.displayName).toLowerCase()));
    const parsed = body.importText
      .split(/\r?\n/)
      .map(parseGuestLine)
      .filter((p): p is NonNullable<typeof p> => !!p)
      .map((p) => ({ ...p, duplicate: known.has(p.fullName.toLowerCase()) }));
    if (body.dryRun) return NextResponse.json({ preview: parsed });
    const fresh = parsed.filter((p) => !p.duplicate).map((p) => newGuest(p, ++order).guest);
    await store.insertGuests(fresh);
    return NextResponse.json({ imported: fresh.length, skipped: parsed.length - fresh.length });
  }

  const name = body.guest?.displayName?.trim();
  if (!name) return NextResponse.json({ error: "O nome é obrigatório." }, { status: 400 });
  const { guest } = newGuest({ ...body.guest, displayName: name.slice(0, 120) }, ++order);
  await store.insertGuests([guest]);
  return NextResponse.json({ guest: toAdmin(guest) });
}
