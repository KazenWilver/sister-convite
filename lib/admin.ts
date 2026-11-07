import "server-only";
import { guestLink } from "./guests";
import type { Guest } from "./store/types";

export type AdminGuest = Omit<Guest, "tokenHash" | "tokenEnc"> & { link: string | null };

export function toAdmin(g: Guest): AdminGuest {
  const { tokenHash: _h, tokenEnc: _e, ...rest } = g;
  return { ...rest, link: guestLink(g) };
}
