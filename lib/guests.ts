import "server-only";
import { randomUUID } from "node:crypto";
import { decryptToken, encryptToken, hashToken, isTokenShape, newToken } from "./crypto";
import { inviteUrl } from "./config";
import { store, type Guest, type Settings, type Stage1, type Stage2 } from "./store";

export function newGuest(input: Partial<Guest> & { displayName: string }, sortOrder: number): { guest: Guest; token: string } {
  const token = newToken();
  const now = new Date().toISOString();
  return {
    token,
    guest: {
      id: randomUUID(),
      sortOrder,
      displayName: input.displayName.trim(),
      fullName: input.fullName ?? null,
      phone: input.phone ?? null,
      groupName: input.groupName ?? null,
      seats: clampSeats(input.seats ?? 1),
      notes: input.notes ?? null,
      tokenHash: hashToken(token),
      tokenEnc: encryptToken(token),
      status: input.status ?? "active",
      replacesId: input.replacesId ?? null,
      sentAt: null,
      firstOpenedAt: null,
      lastOpenedAt: null,
      openCount: 0,
      stage1: null,
      stage1At: null,
      stage2: null,
      stage2At: null,
      attending: 0,
      message: null,
      messageAt: null,
      createdAt: now,
      updatedAt: now,
    },
  };
}

export function clampSeats(n: unknown): number {
  const v = Math.round(Number(n));
  return Number.isFinite(v) ? Math.min(10, Math.max(1, v)) : 1;
}

/** Lê a linha de uma lista ("Lóide e Taviano Muxito (casados)") e devolve o convite. */
export function parseGuestLine(raw: string) {
  let line = raw.replace(/^\s*\d+\s*[.)\-–]\s+/, "").replace(/\s+/g, " ").trim();
  if (!line) return null;
  let notes: string | null = null;
  let couple = false;
  const paren = line.match(/\(([^)]*)\)/);
  if (paren) {
    const inner = paren[1].trim();
    if (/^casa/i.test(inner)) couple = true;
    else notes = inner;
    line = line.replace(paren[0], "").replace(/\s+/g, " ").trim();
  }
  const two = /\s(e|&)\s/i.test(line);
  return { displayName: line, fullName: raw.trim(), notes, seats: couple || two ? 2 : 1 };
}

export async function findGuestByToken(token: string): Promise<Guest | null> {
  if (!isTokenShape(token)) return null;
  return store.getGuestByTokenHash(hashToken(token));
}

export function guestLink(g: Guest): string | null {
  const t = decryptToken(g.tokenEnc);
  return t ? inviteUrl(t) : null;
}

export function finalLocked(s: Settings): boolean {
  if (!s.finalDeadline) return false;
  // Fecha às 23:59 de Luanda (UTC+1) do dia limite.
  return Date.now() > new Date(`${s.finalDeadline}T23:59:59+01:00`).getTime();
}

/** O que o convidado pode ver de si próprio. Nunca dados de outros convidados. */
export interface PublicGuest {
  name: string;
  seats: number;
  plural: boolean;
  stage1: Stage1;
  stage2: Stage2;
  attending: number;
  message: string | null;
  finalOpen: boolean;
  finalLocked: boolean;
  finalDeadline: string | null;
}

export function toPublic(g: Guest, s: Settings): PublicGuest {
  return {
    name: g.displayName,
    seats: g.seats,
    plural: g.seats > 1,
    stage1: g.stage1,
    stage2: g.stage2,
    attending: g.attending,
    message: g.message,
    finalOpen: s.finalOpen,
    finalLocked: finalLocked(s),
    finalDeadline: s.finalDeadline,
  };
}

export interface PublicEvent {
  time: string | null;
  venueName: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  dressCode: boolean;
  dressCodeNote: string | null;
}

export function toPublicEvent(s: Settings): PublicEvent {
  return {
    time: s.eventTime,
    venueName: s.venueName,
    address: s.address,
    lat: s.lat,
    lng: s.lng,
    dressCode: s.dressCode,
    dressCodeNote: s.dressCodeNote,
  };
}

export function computeStats(guests: Guest[], s: Settings) {
  const active = guests.filter((g) => g.status === "active");
  const sum = (list: Guest[], f: (g: Guest) => number) => list.reduce((a, g) => a + f(g), 0);
  const yes1 = active.filter((g) => g.stage1 === "yes");
  const confirmed = active.filter((g) => g.stage2 === "confirmed");
  return {
    invites: active.length,
    people: sum(active, (g) => g.seats),
    sent: active.filter((g) => g.sentAt).length,
    opened: active.filter((g) => g.firstOpenedAt).length,
    stage1Yes: yes1.length,
    stage1YesPeople: sum(yes1, (g) => g.attending),
    stage1No: active.filter((g) => g.stage1 === "no").length,
    noAnswer: active.filter((g) => !g.stage1 && !g.stage2).length,
    finalConfirmed: confirmed.length,
    finalConfirmedPeople: sum(confirmed, (g) => g.attending),
    finalDeclined: active.filter((g) => g.stage2 === "declined").length,
    finalPending: yes1.filter((g) => !g.stage2).length,
    waitlist: guests.filter((g) => g.status === "waitlist").length,
    capacity: s.capacity,
    messages: guests.filter((g) => g.message).length,
  };
}
