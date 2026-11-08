import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { encryptToken, hashToken, newToken } from "@/lib/crypto";
import { clampSeats } from "@/lib/guests";
import { store, type Guest } from "@/lib/store";
import { toAdmin } from "@/lib/admin";

type Ctx = { params: Promise<{ id: string }> };

const EDITABLE = ["displayName", "fullName", "phone", "groupName", "seats", "notes", "status", "stage1", "stage2", "attending", "message"] as const;

/** Editar campos, ou executar uma acção: regenerate | markSent | unmarkSent | resetResponses | replaceWith */
export async function PATCH(req: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  const g = await store.getGuest(id);
  if (!g) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const now = new Date().toISOString();
  let patch: Partial<Guest> = {};

  switch (body.action) {
    case "regenerate": {
      const t = newToken();
      patch = { tokenHash: hashToken(t), tokenEnc: encryptToken(t), sentAt: null };
      break;
    }
    case "markSent":
      patch = { sentAt: g.sentAt ?? now };
      if (!g.sentAt) await store.log(g.id, "sent", null);
      break;
    case "unmarkSent":
      patch = { sentAt: null };
      break;
    case "resetResponses":
      // usado depois dos testes: o convite volta a ficar como novo
      patch = { stage1: null, stage1At: null, stage2: null, stage2At: null, attending: 0, message: null, messageAt: null, checkedInAt: null, checkedInPeople: 0, devices: [] };
      break;
    case "replaceWith": {
      // Libertar o lugar deste convidado e activar outro (normalmente da lista de espera).
      const other = typeof body.otherId === "string" ? await store.getGuest(body.otherId) : null;
      if (!other || other.id === g.id) return NextResponse.json({ error: "Substituto inválido" }, { status: 400 });
      await store.updateGuest(other.id, { status: "active", replacesId: g.id });
      patch = { status: "replaced" };
      await store.log(g.id, "replaced", other.id);
      break;
    }
    default:
      for (const k of EDITABLE) if (k in body) (patch as Record<string, unknown>)[k] = body[k];
      if ("seats" in patch) patch.seats = clampSeats(patch.seats);
      if (typeof patch.displayName === "string") patch.displayName = patch.displayName.trim().slice(0, 120);
      if ("attending" in patch) patch.attending = Math.max(0, Math.min(patch.seats ?? g.seats, Number(patch.attending) || 0));
      if ("stage1" in patch && patch.stage1 !== g.stage1) patch.stage1At = patch.stage1 ? now : null;
      if ("stage2" in patch && patch.stage2 !== g.stage2) patch.stage2At = patch.stage2 ? now : null;
      if (patch.status && !["active", "waitlist", "replaced"].includes(patch.status)) delete patch.status;
  }

  const updated = await store.updateGuest(id, patch);
  return NextResponse.json({ guest: toAdmin(updated!) });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  await store.deleteGuest(id);
  return NextResponse.json({ ok: true });
}
