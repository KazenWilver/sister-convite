import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";
import { adminPasswordConfigured, createSession, verifyPassword } from "@/lib/crypto";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { store } from "@/lib/store";

const SESSION_DAYS = 30;
// O PIN é curto, por isso o limite é global e fica na base de dados:
// no máximo 10 tentativas erradas em 24 horas, venham de onde vierem.
const MAX_FAILS_PER_DAY = 10;

async function failsToday(): Promise<number> {
  try {
    return await store.countLoginFails(new Date(Date.now() - 864e5).toISOString());
  } catch (e) {
    console.error("Contagem de tentativas falhou:", e);
    return 0;
  }
}

export async function POST(req: Request) {
  if (!rateLimit(`login:${clientIp(req)}`, 5, 10 * 60_000)) {
    return NextResponse.json({ error: "Demasiadas tentativas. Espera 10 minutos." }, { status: 429 });
  }
  if (!adminPasswordConfigured()) {
    console.error("ADMIN_PASSWORD_HASH em falta ou mal formada.");
    return NextResponse.json(
      { error: "O PIN do painel ainda não está configurado no servidor (variável ADMIN_PASSWORD_HASH na Vercel)." },
      { status: 503 },
    );
  }
  if ((await failsToday()) >= MAX_FAILS_PER_DAY) {
    return NextResponse.json(
      { error: "Painel bloqueado por segurança depois de muitas tentativas erradas. Volta a tentar amanhã." },
      { status: 429 },
    );
  }
  const { password } = (await req.json().catch(() => ({}))) as { password?: string };
  await new Promise((r) => setTimeout(r, 400)); // abranda ataques de força bruta
  if (!password || !verifyPassword(password)) {
    await store.addLoginFail().catch((e) => console.error("Registo de tentativa falhou:", e));
    return NextResponse.json({ error: "PIN incorrecto." }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, createSession(SESSION_DAYS), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_DAYS * 86400,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
