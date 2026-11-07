import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";
import { createSession, verifyPassword } from "@/lib/crypto";
import { clientIp, rateLimit } from "@/lib/ratelimit";

export async function POST(req: Request) {
  if (!rateLimit(`login:${clientIp(req)}`, 5, 10 * 60_000)) {
    return NextResponse.json({ error: "Demasiadas tentativas. Espera 10 minutos." }, { status: 429 });
  }
  const { password } = (await req.json().catch(() => ({}))) as { password?: string };
  await new Promise((r) => setTimeout(r, 400)); // abranda ataques de força bruta
  if (!password || !verifyPassword(password)) {
    return NextResponse.json({ error: "Palavra-passe incorrecta." }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, createSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 7 * 86400,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
