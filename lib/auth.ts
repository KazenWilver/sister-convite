import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifySession } from "./crypto";

export const SESSION_COOKIE = "jvd_admin";

export async function isAdmin(): Promise<boolean> {
  const jar = await cookies();
  return verifySession(jar.get(SESSION_COOKIE)?.value);
}

/** Devolve uma resposta 401 se não houver sessão de admin válida. */
export async function requireAdmin(): Promise<NextResponse | null> {
  return (await isAdmin()) ? null : NextResponse.json({ error: "Não autorizado" }, { status: 401 });
}
