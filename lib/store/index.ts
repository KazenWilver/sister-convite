import "server-only";
import type { Store } from "./types";
import { localStore } from "./local";
import { supabaseStore } from "./supabase";

export const usingSupabase = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

if (!usingSupabase && process.env.VERCEL) {
  throw new Error("Em produção é obrigatório configurar SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.");
}

export const store: Store = usingSupabase ? supabaseStore : localStore;
export * from "./types";
