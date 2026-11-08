import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_SETTINGS, type Guest, type Settings, type Store } from "./types";

// Só o servidor fala com o Supabase, com a chave de serviço (nunca exposta ao browser).
// Todas as tabelas têm RLS activo e nenhuma política pública (ver supabase/migrations).

let client: SupabaseClient | null = null;
function db(): SupabaseClient {
  if (!client) {
    client = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

const guestMap: Record<keyof Guest, string> = {
  id: "id",
  sortOrder: "sort_order",
  displayName: "display_name",
  fullName: "full_name",
  phone: "phone",
  groupName: "group_name",
  seats: "seats",
  notes: "notes",
  tokenHash: "token_hash",
  tokenEnc: "token_enc",
  status: "status",
  replacesId: "replaces_id",
  sentAt: "sent_at",
  firstOpenedAt: "first_opened_at",
  lastOpenedAt: "last_opened_at",
  openCount: "open_count",
  devices: "devices",
  checkedInAt: "checked_in_at",
  checkedInPeople: "checked_in_people",
  stage1: "stage1",
  stage1At: "stage1_at",
  stage2: "stage2",
  stage2At: "stage2_at",
  attending: "attending",
  message: "message",
  messageAt: "message_at",
  createdAt: "created_at",
  updatedAt: "updated_at",
};

const settingsMap: Record<keyof Settings, string> = {
  eventTime: "event_time",
  venueName: "venue_name",
  address: "address",
  lat: "lat",
  lng: "lng",
  capacity: "capacity",
  finalOpen: "final_open",
  finalDeadline: "final_deadline",
  dressCode: "dress_code",
  dressCodeNote: "dress_code_note",
};

function toRow<T extends object>(obj: Partial<T>, map: Record<string, string>) {
  const row: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) if (k in map && v !== undefined) row[map[k]] = v;
  return row;
}

function fromRow<T>(row: Record<string, unknown>, map: Record<string, string>): T {
  const obj: Record<string, unknown> = {};
  for (const [k, col] of Object.entries(map)) obj[k] = row[col] ?? null;
  if ("devices" in obj && !Array.isArray(obj.devices)) obj.devices = [];
  if ("checkedInPeople" in obj && obj.checkedInPeople == null) obj.checkedInPeople = 0;
  return obj as T;
}

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(`Supabase: ${res.error.message}`);
  return res.data;
}

export const supabaseStore: Store = {
  async listGuests() {
    const rows = check(await db().from("guests").select("*").order("sort_order"));
    return (rows ?? []).map((r) => fromRow<Guest>(r, guestMap));
  },
  async getGuest(id) {
    const row = check(await db().from("guests").select("*").eq("id", id).maybeSingle());
    return row ? fromRow<Guest>(row, guestMap) : null;
  },
  async getGuestByTokenHash(hash) {
    const row = check(await db().from("guests").select("*").eq("token_hash", hash).maybeSingle());
    return row ? fromRow<Guest>(row, guestMap) : null;
  },
  async insertGuests(guests) {
    if (!guests.length) return;
    check(await db().from("guests").insert(guests.map((g) => toRow(g, guestMap))));
  },
  async updateGuest(id, patch) {
    const row = check(
      await db()
        .from("guests")
        .update({ ...toRow(patch, guestMap), updated_at: new Date().toISOString() })
        .eq("id", id)
        .select("*")
        .maybeSingle(),
    );
    return row ? fromRow<Guest>(row, guestMap) : null;
  },
  async deleteGuest(id) {
    check(await db().from("guests").delete().eq("id", id));
  },
  async getSettings() {
    const row = check(await db().from("event_settings").select("*").eq("id", 1).maybeSingle());
    return row ? { ...DEFAULT_SETTINGS, ...fromRow<Settings>(row, settingsMap) } : { ...DEFAULT_SETTINGS };
  },
  async updateSettings(patch) {
    const row = check(
      await db()
        .from("event_settings")
        .upsert({ id: 1, ...toRow(patch, settingsMap), updated_at: new Date().toISOString() })
        .select("*")
        .single(),
    );
    return { ...DEFAULT_SETTINGS, ...fromRow<Settings>(row, settingsMap) };
  },
  async listLog(limit) {
    const rows = check(await db().from("rsvp_log").select("guest_id, action, value, at").order("at", { ascending: false }).limit(limit));
    return (rows ?? []).map((r) => ({ guestId: r.guest_id as string, action: r.action as string, value: (r.value as string | null) ?? null, at: r.at as string }));
  },
  async log(guestId, action, value) {
    check(await db().from("rsvp_log").insert({ guest_id: guestId, action, value }));
  },
  async countLoginFails(sinceIso) {
    const res = await db().from("admin_login_fails").select("id", { count: "exact", head: true }).gte("at", sinceIso);
    if (res.error) throw new Error(`Supabase: ${res.error.message}`);
    return res.count ?? 0;
  },
  async addLoginFail() {
    check(await db().from("admin_login_fails").insert({}));
    await db().from("admin_login_fails").delete().lt("at", new Date(Date.now() - 2 * 864e5).toISOString());
  },
};
