import { NextResponse } from "next/server";
import { clampSeats, findGuestByToken, finalLocked, toPublic } from "@/lib/guests";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { store, type Guest } from "@/lib/store";

type Body =
  | { token: string; action: "stage1"; value: "yes" | "no"; seats?: number }
  | { token: string; action: "stage2"; value: "confirmed" | "declined"; seats?: number }
  | { token: string; action: "message"; message: string };

const err = (msg: string, status = 400) => NextResponse.json({ error: msg }, { status });

export async function POST(req: Request) {
  if (!rateLimit(`rsvp:${clientIp(req)}`, 20, 60_000)) return err("Demasiados pedidos. Tenta daqui a um minuto.", 429);
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body || typeof body.token !== "string") return err("Pedido inválido");

  const g = await findGuestByToken(body.token);
  if (!g || g.status !== "active") return err("Convite não encontrado", 404);
  const s = await store.getSettings();
  const now = new Date().toISOString();
  let patch: Partial<Guest> = {};

  if (body.action === "stage1") {
    if (body.value !== "yes" && body.value !== "no") return err("Resposta inválida");
    if (g.stage2 && (!s.finalOpen || finalLocked(s))) return err("A confirmação final já foi registada.");
    const seats = body.value === "yes" ? Math.min(g.seats, clampSeats(body.seats ?? g.seats)) : 0;
    patch = { stage1: body.value, stage1At: now, attending: seats };
    // Quem muda a intenção depois de uma confirmação final volta a ter de confirmar.
    if (g.stage2) patch = { ...patch, stage2: body.value === "no" ? "declined" : null, stage2At: body.value === "no" ? now : null };
    await store.log(g.id, "stage1", `${body.value}:${seats}`);
  } else if (body.action === "stage2") {
    if (!s.finalOpen) return err("A confirmação final ainda não está aberta.");
    if (finalLocked(s)) return err("O prazo da confirmação final terminou. Fala directamente com a família.");
    if (body.value !== "confirmed" && body.value !== "declined") return err("Resposta inválida");
    const seats = body.value === "confirmed" ? Math.min(g.seats, clampSeats(body.seats ?? (g.attending || g.seats))) : 0;
    patch = { stage2: body.value, stage2At: now, attending: seats };
    if (!g.stage1 || (g.stage1 === "no" && body.value === "confirmed")) patch = { ...patch, stage1: "yes", stage1At: now };
    await store.log(g.id, "stage2", `${body.value}:${seats}`);
  } else if (body.action === "message") {
    const message = String(body.message ?? "").trim().slice(0, 600);
    if (!message) return err("Escreve uma mensagem.");
    patch = { message, messageAt: now };
    await store.log(g.id, "message", null);
  } else {
    return err("Acção desconhecida");
  }

  const updated = await store.updateGuest(g.id, patch);
  return NextResponse.json({ guest: toPublic(updated!, s) });
}
