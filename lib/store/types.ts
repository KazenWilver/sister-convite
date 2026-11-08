export type GuestStatus = "active" | "waitlist" | "replaced";
export type Stage1 = "yes" | "no" | null;
export type Stage2 = "confirmed" | "declined" | null;

export interface Guest {
  id: string;
  sortOrder: number;
  displayName: string; // nome que aparece no convite
  fullName: string | null; // linha original / nome completo
  phone: string | null;
  groupName: string | null;
  seats: number;
  notes: string | null;
  tokenHash: string;
  tokenEnc: string;
  status: GuestStatus;
  replacesId: string | null;
  sentAt: string | null;
  firstOpenedAt: string | null;
  lastOpenedAt: string | null;
  openCount: number;
  devices: string[]; // hashes curtos dos dispositivos que abriram o convite (máx. 12)
  checkedInAt: string | null; // entrada registada à porta
  checkedInPeople: number;
  stage1: Stage1;
  stage1At: string | null;
  stage2: Stage2;
  stage2At: string | null;
  attending: number; // pessoas que vêm (segundo a última resposta)
  message: string | null;
  messageAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  eventTime: string | null; // "18:00"
  venueName: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  capacity: number | null;
  finalOpen: boolean; // a confirmação final está aberta?
  finalDeadline: string | null; // "2026-11-20" (opcional)
  dressCode: boolean;
  dressCodeNote: string | null;
}

export const DEFAULT_SETTINGS: Settings = {
  eventTime: null,
  venueName: null,
  address: null,
  lat: null,
  lng: null,
  capacity: null,
  finalOpen: false,
  finalDeadline: null,
  dressCode: true,
  dressCodeNote: "Da baunilha ao espresso, qualquer tom serve.",
};

export interface LogEntry {
  guestId: string;
  action: string;
  value: string | null;
  at: string;
}

export interface Store {
  listGuests(): Promise<Guest[]>;
  getGuest(id: string): Promise<Guest | null>;
  getGuestByTokenHash(hash: string): Promise<Guest | null>;
  insertGuests(guests: Guest[]): Promise<void>;
  updateGuest(id: string, patch: Partial<Guest>): Promise<Guest | null>;
  deleteGuest(id: string): Promise<void>;
  getSettings(): Promise<Settings>;
  updateSettings(patch: Partial<Settings>): Promise<Settings>;
  log(guestId: string, action: string, value: string | null): Promise<void>;
  listLog(limit: number): Promise<LogEntry[]>;
  /** Tentativas erradas de entrar no painel desde a data indicada (todas as origens). */
  countLoginFails(sinceIso: string): Promise<number>;
  addLoginFail(): Promise<void>;
}
