import { requireAdmin } from "@/lib/auth";
import { guestLink } from "@/lib/guests";
import { store } from "@/lib/store";

const S1: Record<string, string> = { yes: "Sim", no: "Não" };
const S2: Record<string, string> = { confirmed: "Confirmado", declined: "Recusado" };
const ST: Record<string, string> = { active: "Activo", waitlist: "Lista de espera", replaced: "Substituído" };

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const guests = await store.listGuests();
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const head = ["Nome", "Grupo", "Telefone", "Lugares", "Estado", "Enviado", "Aberto", "Intenção", "Final", "Pessoas", "Mensagem", "Link"];
  const rows = guests.map((g) =>
    [g.displayName, g.groupName, g.phone, g.seats, ST[g.status], g.sentAt ? "Sim" : "", g.firstOpenedAt ? "Sim" : "", S1[g.stage1 ?? ""] ?? "", S2[g.stage2 ?? ""] ?? "", g.attending, g.message, guestLink(g)]
      .map(esc)
      .join(";"),
  );
  const csv = "﻿" + [head.map(esc).join(";"), ...rows].join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="convidados-juceline.csv"',
    },
  });
}
