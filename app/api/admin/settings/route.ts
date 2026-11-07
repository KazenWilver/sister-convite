import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { store, type Settings } from "@/lib/store";

export async function PUT(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const b = (await req.json().catch(() => ({}))) as Partial<Record<keyof Settings, unknown>>;
  const str = (v: unknown, max = 300) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);
  const num = (v: unknown) => (v === "" || v === null || v === undefined || !Number.isFinite(Number(v)) ? null : Number(v));
  const patch: Partial<Settings> = {};
  if ("eventTime" in b) patch.eventTime = str(b.eventTime, 40);
  if ("venueName" in b) patch.venueName = str(b.venueName, 120);
  if ("address" in b) patch.address = str(b.address, 300);
  if ("lat" in b) patch.lat = num(b.lat);
  if ("lng" in b) patch.lng = num(b.lng);
  if ("capacity" in b) patch.capacity = num(b.capacity);
  if ("finalOpen" in b) patch.finalOpen = Boolean(b.finalOpen);
  if ("finalDeadline" in b) patch.finalDeadline = typeof b.finalDeadline === "string" && /^\d{4}-\d{2}-\d{2}$/.test(b.finalDeadline) ? b.finalDeadline : null;
  if ("dressCode" in b) patch.dressCode = Boolean(b.dressCode);
  if ("dressCodeNote" in b) patch.dressCodeNote = str(b.dressCodeNote, 200);
  return NextResponse.json({ settings: await store.updateSettings(patch) });
}
