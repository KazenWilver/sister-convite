import "server-only";
import { guestLink, hasPass } from "./guests";
import type { Guest } from "./store/types";

export type AdminGuest = Omit<Guest, "tokenHash" | "tokenEnc"> & { link: string | null; hasPass: boolean };

export function toAdmin(g: Guest): AdminGuest {
  const { tokenHash: _h, tokenEnc: _e, ...rest } = g;
  return { ...rest, link: guestLink(g), hasPass: hasPass(g) };
}
