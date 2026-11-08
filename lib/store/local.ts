import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { DEFAULT_SETTINGS, type Guest, type LogEntry, type Settings, type Store } from "./types";

// Base de dados LOCAL só para desenvolvimento (ficheiro .data/db.json, fora do Git).
interface Db {
  guests: Guest[];
  settings: Settings;
  log: LogEntry[];
  loginFails?: string[];
}

const FILE = path.join(process.cwd(), ".data", "db.json");
let queue: Promise<unknown> = Promise.resolve();

async function read(): Promise<Db> {
  try {
    const db = JSON.parse(await fs.readFile(FILE, "utf8")) as Db;
    db.settings = { ...DEFAULT_SETTINGS, ...db.settings };
    // convites criados antes destes campos existirem
    for (const g of db.guests) {
      g.devices ??= [];
      g.checkedInAt ??= null;
      g.checkedInPeople ??= 0;
    }
    return db;
  } catch {
    return { guests: [], settings: { ...DEFAULT_SETTINGS }, log: [] };
  }
}

async function write(db: Db) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(db, null, 2));
}

function tx<T>(fn: (db: Db) => T | Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const db = await read();
    const out = await fn(db);
    await write(db);
    return out;
  });
  queue = run.catch(() => undefined);
  return run;
}

export const localStore: Store = {
  async listGuests() {
    return (await read()).guests.sort((a, b) => a.sortOrder - b.sortOrder);
  },
  async getGuest(id) {
    return (await read()).guests.find((g) => g.id === id) ?? null;
  },
  async getGuestByTokenHash(hash) {
    return (await read()).guests.find((g) => g.tokenHash === hash) ?? null;
  },
  insertGuests(guests) {
    return tx((db) => {
      db.guests.push(...guests);
    });
  },
  updateGuest(id, patch) {
    return tx((db) => {
      const g = db.guests.find((x) => x.id === id);
      if (!g) return null;
      Object.assign(g, patch, { updatedAt: new Date().toISOString() });
      return { ...g };
    });
  },
  deleteGuest(id) {
    return tx((db) => {
      db.guests = db.guests.filter((g) => g.id !== id);
      db.guests.forEach((g) => {
        if (g.replacesId === id) g.replacesId = null;
      });
    });
  },
  async getSettings() {
    return (await read()).settings;
  },
  updateSettings(patch) {
    return tx((db) => {
      db.settings = { ...db.settings, ...patch };
      return db.settings;
    });
  },
  async listLog(limit) {
    return (await read()).log.slice(-limit).reverse();
  },
  log(guestId, action, value) {
    return tx((db) => {
      db.log.push({ guestId, action, value, at: new Date().toISOString() });
    });
  },
  async countLoginFails(sinceIso) {
    return ((await read()).loginFails ?? []).filter((at) => at >= sinceIso).length;
  },
  addLoginFail() {
    return tx((db) => {
      const old = new Date(Date.now() - 2 * 864e5).toISOString();
      db.loginFails = [...(db.loginFails ?? []).filter((at) => at >= old), new Date().toISOString()];
    });
  },
};
