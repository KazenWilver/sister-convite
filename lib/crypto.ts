import "server-only";
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Variável de ambiente em falta: ${name} (ver .env.example)`);
  return v;
}

/** Token de convite: 128 bits aleatórios, 22 caracteres base64url. */
export function newToken(): string {
  return randomBytes(16).toString("base64url");
}

export function isTokenShape(t: string): boolean {
  return /^[A-Za-z0-9_-]{22}$/.test(t);
}

/** Na base de dados só se guarda o hash — um token roubado da BD não abre nada. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function encKey(): Buffer {
  const key = Buffer.from(requireEnv("TOKEN_ENC_KEY"), "base64");
  if (key.length !== 32) throw new Error("TOKEN_ENC_KEY tem de ter 32 bytes (base64)");
  return key;
}

/** Cópia cifrada (AES-256-GCM) para o admin poder voltar a copiar o link. */
export function encryptToken(token: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encKey(), iv);
  const ct = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  return [iv, ct, cipher.getAuthTag()].map((b) => b.toString("base64url")).join(".");
}

export function decryptToken(blob: string): string | null {
  try {
    const [iv, ct, tag] = blob.split(".").map((p) => Buffer.from(p, "base64url"));
    const d = createDecipheriv("aes-256-gcm", encKey(), iv);
    d.setAuthTag(tag);
    return Buffer.concat([d.update(ct), d.final()]).toString("utf8");
  } catch {
    return null;
  }
}

/** Semente do selo único (32 bits), também derivada do id. */
export function sealSeed(guestId: string): number {
  return createHmac("sha256", requireEnv("SESSION_SECRET")).update(`selo:${guestId}`).digest().readUInt32BE(0);
}

/** Identificador anónimo de um dispositivo (o browser guarda um número aleatório; aqui só fica o hash curto). */
export function deviceTag(raw: string): string {
  return createHash("sha256").update(`disp:${raw}`).digest("hex").slice(0, 10);
}

/** Lê ADMIN_PASSWORD_HASH tolerando enganos comuns ao colar na Vercel (nome à frente, aspas, espaços). */
function storedPasswordHash(): string | null {
  const raw = process.env.ADMIN_PASSWORD_HASH;
  if (!raw) return null;
  const v = raw
    .trim()
    .replace(/^ADMIN_PASSWORD_HASH\s*=\s*/, "")
    .replace(/^["']|["']$/g, "")
    .trim();
  return /^scrypt:[0-9a-f]{16,}:[0-9a-f]{64,}$/i.test(v) ? v : null;
}

export function adminPasswordConfigured(): boolean {
  return storedPasswordHash() !== null;
}

export function verifyPassword(password: string): boolean {
  const stored = storedPasswordHash();
  if (!stored) return false;
  const [, salt, hash] = stored.split(":");
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password.trim(), salt, expected.length);
  return timingSafeEqual(expected, actual);
}

function sign(data: string): string {
  return createHmac("sha256", requireEnv("SESSION_SECRET")).update(data).digest("base64url");
}

export function createSession(days = 7): string {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + days * 864e5, n: randomBytes(8).toString("hex") })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifySession(value: string | undefined): boolean {
  if (!value) return false;
  const [payload, sig] = value.split(".");
  if (!payload || !sig) return false;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(payload, "base64url").toString());
    return typeof exp === "number" && exp > Date.now();
  } catch {
    return false;
  }
}
