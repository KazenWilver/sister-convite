import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { guestLink, newGuest, parseGuestLine } from "@/lib/guests";
import { store, usingSupabase } from "@/lib/store";

// SÓ desenvolvimento: carrega a lista local (fora do repositório) na base local e devolve 1 link de teste.
export async function GET() {
  if (process.env.NODE_ENV === "production" || usingSupabase) return new NextResponse("Not found", { status: 404 });
  const existing = await store.listGuests();
  if (existing.length === 0) {
    const file = path.join(process.cwd(), "..", "documentos_detalhes", "ListaDeConvidados.txt");
    const text = await fs.readFile(file, "utf8");
    const made = text
      .split(/\r?\n/)
      .map(parseGuestLine)
      .filter((p): p is NonNullable<typeof p> => !!p)
      .map((p, i) => newGuest(p, i + 1));
    await store.insertGuests(made.map((m) => m.guest));
  }
  const all = await store.listGuests();
  const links = [all[0], all[2], all[9]].filter(Boolean).map((g) => ({ name: g.displayName, seats: g.seats, url: guestLink(g) }));
  return NextResponse.json({ guests: all.length, people: all.reduce((a, g) => a + g.seats, 0), links });
}
