"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { AdminGuest } from "@/lib/admin";
import type { Settings } from "@/lib/store/types";
import "./admin.css";

type Stats = {
  invites: number;
  people: number;
  sent: number;
  opened: number;
  stage1Yes: number;
  stage1YesPeople: number;
  stage1No: number;
  noAnswer: number;
  finalConfirmed: number;
  finalConfirmedPeople: number;
  finalDeclined: number;
  finalPending: number;
  waitlist: number;
  capacity: number | null;
  messages: number;
};

type Tab = "guests" | "messages" | "import" | "settings";
type Filter = "all" | "unsent" | "noanswer" | "yes" | "no" | "pending" | "confirmed" | "declined" | "waitlist" | "replaced";

const FILTERS: [Filter, string][] = [
  ["all", "Todos"],
  ["unsent", "Por enviar"],
  ["noanswer", "Sem resposta"],
  ["yes", "Intenção: sim"],
  ["no", "Intenção: não"],
  ["pending", "Falta confirmação final"],
  ["confirmed", "Confirmados"],
  ["declined", "Recusaram"],
  ["waitlist", "Lista de espera"],
  ["replaced", "Substituídos"],
];

function matches(g: AdminGuest, f: Filter): boolean {
  const active = g.status === "active";
  switch (f) {
    case "all":
      return g.status !== "replaced";
    case "unsent":
      return active && !g.sentAt;
    case "noanswer":
      return active && !g.stage1 && !g.stage2;
    case "yes":
      return active && g.stage1 === "yes";
    case "no":
      return active && g.stage1 === "no";
    case "pending":
      return active && g.stage1 === "yes" && !g.stage2;
    case "confirmed":
      return active && g.stage2 === "confirmed";
    case "declined":
      return active && (g.stage2 === "declined" || g.stage1 === "no");
    case "waitlist":
      return g.status === "waitlist";
    case "replaced":
      return g.status === "replaced";
  }
}

function waLink(g: AdminGuest, kind: "invite" | "reminder"): string | null {
  if (!g.link) return null;
  const p = g.seats > 1;
  const text =
    kind === "invite"
      ? `Olá, ${g.displayName}! 🎓\n\nA Juceline terminou a licenciatura em Contabilidade e Finanças e queremos muito celebrar ${p ? "convosco" : "contigo"}.\n\nO convite é pessoal ${g.seats === 2 ? "e é para os dois" : p ? "e é para todos" : ""} — abre aqui:\n${g.link}`
      : `Olá, ${g.displayName}! A festa da Juceline está a chegar 🎓\n\nFalta só a ${p ? "vossa" : "tua"} confirmação final — é rapidinho, aqui no convite:\n${g.link}`;
  let digits = (g.phone ?? "").replace(/\D/g, "");
  if (/^9\d{8}$/.test(digits)) digits = `244${digits}`; // número angolano sem indicativo
  return `https://wa.me/${digits}?text=${encodeURIComponent(text.replace(/ {2,}/g, " "))}`;
}

function fmt(d: string | null) {
  if (!d) return "";
  return new Date(d).toLocaleString("pt-PT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Luanda" });
}

async function api<T>(url: string, method = "GET", body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) {
    window.location.href = "/admin/entrar";
    throw new Error("Sessão terminada");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? "Erro");
  return data as T;
}

export function AdminApp({ localMode }: { localMode: boolean }) {
  const [tab, setTab] = useState<Tab>("guests");
  const [guests, setGuests] = useState<AdminGuest[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<AdminGuest | "new" | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    const d = await api<{ guests: AdminGuest[]; stats: Stats; settings: Settings }>("/api/admin/guests");
    setGuests(d.guests);
    setStats(d.stats);
    setSettings(d.settings);
  }, []);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  const notify = (m: string) => {
    setToast(m);
    window.setTimeout(() => setToast(null), 2600);
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return guests.filter((g) => matches(g, filter) && (!q || `${g.displayName} ${g.fullName ?? ""} ${g.groupName ?? ""}`.toLowerCase().includes(q)));
  }, [guests, filter, query]);

  async function act(g: AdminGuest, body: Record<string, unknown>, msg?: string) {
    await api(`/api/admin/guests/${g.id}`, "PATCH", body);
    await load();
    if (msg) notify(msg);
  }

  async function copy(g: AdminGuest) {
    if (!g.link) return;
    await navigator.clipboard.writeText(g.link);
    notify("Link copiado");
  }

  async function sendWa(g: AdminGuest, kind: "invite" | "reminder") {
    const url = waLink(g, kind);
    if (!url) return;
    window.open(url, "_blank", "noopener");
    if (!g.sentAt) await act(g, { action: "markSent" });
  }

  async function logout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    window.location.href = "/admin/entrar";
  }

  return (
    <div className="adm">
      <header className="adm-head">
        <div>
          <p className="adm-kicker">Licenciatura da Juceline · 28 Nov 2026</p>
          <h1>Convidados</h1>
        </div>
        <div className="adm-head-actions">
          <a className="adm-btn adm-btn-ghost" href="/api/admin/export">
            Exportar CSV
          </a>
          <button className="adm-btn adm-btn-ghost" onClick={logout}>
            Sair
          </button>
        </div>
      </header>

      {localMode && (
        <p className="adm-banner">
          Modo local de testes — os dados estão em <code>.data/db.json</code>. Em produção usa o Supabase.
        </p>
      )}

      {stats && <StatsBar s={stats} />}

      <nav className="adm-tabs" role="tablist">
        {(
          [
            ["guests", "Lista"],
            ["messages", `Mensagens${stats?.messages ? ` (${stats.messages})` : ""}`],
            ["import", "Importar"],
            ["settings", "Definições"],
          ] as [Tab, string][]
        ).map(([k, label]) => (
          <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>
            {label}
          </button>
        ))}
      </nav>

      {tab === "guests" && (
        <section>
          <div className="adm-tools">
            <input className="adm-search" placeholder="Procurar nome ou grupo…" value={query} onChange={(e) => setQuery(e.target.value)} />
            <button className="adm-btn adm-btn-primary" onClick={() => setEditing("new")}>
              + Convidado
            </button>
          </div>
          <div className="adm-filters">
            {FILTERS.map(([k, label]) => (
              <button key={k} className={filter === k ? "on" : ""} onClick={() => setFilter(k)}>
                {label} <span>{guests.filter((g) => matches(g, k)).length}</span>
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <div className="adm-empty">
              {guests.length === 0 ? (
                <>
                  <p>Ainda não há convidados.</p>
                  <button className="adm-btn adm-btn-primary" onClick={() => setTab("import")}>
                    Importar a lista
                  </button>
                </>
              ) : (
                <p>Nenhum convidado neste filtro.</p>
              )}
            </div>
          ) : (
            <ul className="adm-list">
              {visible.map((g) => (
                <li key={g.id} className="adm-row">
                  <div className="adm-row-main">
                    <button className="adm-name" onClick={() => setEditing(g)}>
                      {g.displayName}
                    </button>
                    <div className="adm-meta">
                      <span>
                        {g.seats} {g.seats > 1 ? "lugares" : "lugar"}
                      </span>
                      {g.groupName && <span>{g.groupName}</span>}
                      {g.notes && <span className="adm-note">{g.notes}</span>}
                    </div>
                  </div>
                  <div className="adm-chips">
                    <Chip tone={g.status === "waitlist" ? "warn" : g.status === "replaced" ? "mute" : g.sentAt ? "ok" : "mute"}>
                      {g.status === "waitlist" ? "Lista de espera" : g.status === "replaced" ? "Substituído" : g.sentAt ? "Enviado" : "Por enviar"}
                    </Chip>
                    {g.firstOpenedAt && <Chip tone="ok" title={`Última visita: ${fmt(g.lastOpenedAt)}`}>Aberto ×{g.openCount}</Chip>}
                    <Chip tone={g.stage1 === "yes" ? "ok" : g.stage1 === "no" ? "bad" : "mute"}>
                      1 · {g.stage1 === "yes" ? `Sim (${g.attending})` : g.stage1 === "no" ? "Não" : "—"}
                    </Chip>
                    <Chip tone={g.stage2 === "confirmed" ? "gold" : g.stage2 === "declined" ? "bad" : "mute"}>
                      2 · {g.stage2 === "confirmed" ? `Confirmado (${g.attending})` : g.stage2 === "declined" ? "Recusou" : "—"}
                    </Chip>
                  </div>
                  <div className="adm-row-actions">
                    <button className="adm-btn adm-btn-wa" onClick={() => sendWa(g, g.stage1 === "yes" && !g.stage2 && settings?.finalOpen ? "reminder" : "invite")} disabled={!g.link}>
                      {g.stage1 === "yes" && !g.stage2 && settings?.finalOpen ? "Lembrar" : "WhatsApp"}
                    </button>
                    <button className="adm-btn adm-btn-ghost" onClick={() => copy(g)} disabled={!g.link}>
                      Copiar link
                    </button>
                    <a className="adm-btn adm-btn-ghost" href={g.link ?? "#"} target="_blank" rel="noopener noreferrer">
                      Ver
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === "messages" && <Messages guests={guests} />}
      {tab === "import" && <ImportPanel onDone={async (n) => (await load(), notify(`${n} convites importados`), setTab("guests"))} />}
      {tab === "settings" && settings && <SettingsPanel initial={settings} onSaved={async () => (await load(), notify("Definições guardadas"))} />}

      {editing && (
        <GuestEditor
          guest={editing === "new" ? null : editing}
          waitlist={guests.filter((g) => g.status === "waitlist")}
          onClose={() => setEditing(null)}
          onSaved={async (m) => {
            setEditing(null);
            await load();
            notify(m);
          }}
          act={act}
        />
      )}

      {toast && (
        <div className="adm-toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}

function Chip({ children, tone, title }: { children: React.ReactNode; tone: "ok" | "bad" | "mute" | "warn" | "gold"; title?: string }) {
  return (
    <span className={`adm-chip ${tone}`} title={title}>
      {children}
    </span>
  );
}

function StatsBar({ s }: { s: Stats }) {
  const tiles: [string, string | number, string?][] = [
    ["Convites", s.invites, `${s.people} pessoas`],
    ["Enviados", s.sent, `${s.opened} abertos`],
    ["Intenção sim", s.stage1Yes, `${s.stage1YesPeople} pessoas`],
    ["Sem resposta", s.noAnswer],
    ["Confirmação final", s.finalConfirmed, `${s.finalPending} por confirmar`],
    ["Recusaram", s.stage1No + s.finalDeclined],
  ];
  return (
    <div className="adm-stats">
      <div className="adm-hero-stat">
        <span>Presenças confirmadas</span>
        <strong>{s.finalConfirmedPeople}</strong>
        <em>{s.capacity ? `de ${s.capacity} lugares` : `pessoas · ${s.stage1YesPeople} com intenção de ir`}</em>
      </div>
      {tiles.map(([label, value, sub]) => (
        <div key={label} className="adm-stat">
          <span>{label}</span>
          <strong>{value}</strong>
          {sub && <em>{sub}</em>}
        </div>
      ))}
    </div>
  );
}

function Messages({ guests }: { guests: AdminGuest[] }) {
  const list = guests.filter((g) => g.message).sort((a, b) => (b.messageAt ?? "").localeCompare(a.messageAt ?? ""));
  if (!list.length) return <div className="adm-empty"><p>Ainda não há mensagens para a Juceline.</p></div>;
  return (
    <ul className="adm-messages">
      {list.map((g) => (
        <li key={g.id}>
          <p>“{g.message}”</p>
          <span>
            — {g.displayName} · {fmt(g.messageAt)}
          </span>
        </li>
      ))}
    </ul>
  );
}

type Preview = { displayName: string; seats: number; notes: string | null; duplicate: boolean };

function ImportPanel({ onDone }: { onDone: (n: number) => void }) {
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<Preview[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(dryRun: boolean) {
    setBusy(true);
    setError(null);
    try {
      const d = await api<{ preview?: Preview[]; imported?: number }>("/api/admin/guests", "POST", { importText: text, dryRun });
      if (dryRun) setPreview(d.preview ?? []);
      else onDone(d.imported ?? 0);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const fresh = preview?.filter((p) => !p.duplicate) ?? [];
  return (
    <section className="adm-panel">
      <h2>Importar lista</h2>
      <p className="adm-help">
        Cola um convite por linha. Linhas com dois nomes («Ana e Paulo», «X &amp; Y») ou «(casados)» ficam com 2 lugares. Texto entre parênteses que não seja
        «casados» fica como nota. Nomes já existentes são ignorados.
      </p>
      <textarea rows={10} value={text} onChange={(e) => (setText(e.target.value), setPreview(null))} placeholder={"Ana e Paulo Mendes (casados)\nCarlos Mateus\n…"} />
      <div className="adm-tools">
        <button className="adm-btn adm-btn-ghost" disabled={!text.trim() || busy} onClick={() => run(true)}>
          Pré-visualizar
        </button>
        {preview && (
          <button className="adm-btn adm-btn-primary" disabled={!fresh.length || busy} onClick={() => run(false)}>
            Importar {fresh.length} convites ({fresh.reduce((a, p) => a + p.seats, 0)} pessoas)
          </button>
        )}
      </div>
      {error && <p className="adm-error">{error}</p>}
      {preview && (
        <ol className="adm-preview">
          {preview.map((p, i) => (
            <li key={i} className={p.duplicate ? "dup" : ""}>
              <strong>{p.displayName}</strong> · {p.seats} {p.seats > 1 ? "lugares" : "lugar"}
              {p.notes && <em> · nota: {p.notes}</em>}
              {p.duplicate && <em> · já existe</em>}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function SettingsPanel({ initial, onSaved }: { initial: Settings; onSaved: () => void }) {
  const [s, setS] = useState<Settings>(initial);
  const [coords, setCoords] = useState("");
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS((p) => ({ ...p, [k]: v }));

  function applyCoords(v: string) {
    setCoords(v);
    const m = v.match(/(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/);
    if (m) setS((p) => ({ ...p, lat: Number(m[1]), lng: Number(m[2]) }));
  }

  async function save() {
    setBusy(true);
    try {
      await api("/api/admin/settings", "PUT", s);
      onSaved();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="adm-panel">
      <h2>Definições da festa</h2>

      <fieldset>
        <legend>Confirmação final</legend>
        <label className="adm-switch">
          <input type="checkbox" checked={s.finalOpen} onChange={(e) => set("finalOpen", e.target.checked)} />
          <span>
            <strong>Pedir a confirmação final</strong>
            <em>Quando activares, quem disse «sim» vê no convite o pedido para confirmar definitivamente. Depois usa o botão «Lembrar».</em>
          </span>
        </label>
        <label>
          <span>Prazo da confirmação final (opcional)</span>
          <input type="date" value={s.finalDeadline ?? ""} onChange={(e) => set("finalDeadline", e.target.value || null)} />
        </label>
        <label>
          <span>Capacidade (lugares disponíveis)</span>
          <input type="number" inputMode="numeric" min={0} value={s.capacity ?? ""} onChange={(e) => set("capacity", e.target.value ? Number(e.target.value) : null)} />
        </label>
      </fieldset>

      <fieldset>
        <legend>Hora e local</legend>
        <label>
          <span>Hora</span>
          <input placeholder="ex.: 18h00" value={s.eventTime ?? ""} onChange={(e) => set("eventTime", e.target.value)} />
        </label>
        <label>
          <span>Nome do local</span>
          <input placeholder="ex.: Casa da família Vieira Dias" value={s.venueName ?? ""} onChange={(e) => set("venueName", e.target.value)} />
        </label>
        <label>
          <span>Morada</span>
          <input value={s.address ?? ""} onChange={(e) => set("address", e.target.value)} />
        </label>
        <label>
          <span>Coordenadas (cola do Google Maps)</span>
          <input placeholder="-8.8383, 13.2344" value={coords} onChange={(e) => applyCoords(e.target.value)} />
        </label>
        <p className="adm-help">
          No Google Maps, mantém o dedo no local da festa até aparecer um pin; os números (ex.: -8.83, 13.23) aparecem em cima — copia e cola aqui. Actual:{" "}
          {s.lat != null && s.lng != null ? `${s.lat}, ${s.lng}` : "não definido"}. Só quem tem um convite válido vê o local.
        </p>
      </fieldset>

      <fieldset>
        <legend>Dress code</legend>
        <label className="adm-switch">
          <input type="checkbox" checked={s.dressCode} onChange={(e) => set("dressCode", e.target.checked)} />
          <span>
            <strong>Mostrar a secção de dress code</strong>
          </span>
        </label>
        <label>
          <span>Texto</span>
          <input value={s.dressCodeNote ?? ""} onChange={(e) => set("dressCodeNote", e.target.value)} />
        </label>
      </fieldset>

      <button className="adm-btn adm-btn-primary" disabled={busy} onClick={save}>
        Guardar definições
      </button>
    </section>
  );
}

function GuestEditor({
  guest,
  waitlist,
  onClose,
  onSaved,
  act,
}: {
  guest: AdminGuest | null;
  waitlist: AdminGuest[];
  onClose: () => void;
  onSaved: (msg: string) => void;
  act: (g: AdminGuest, body: Record<string, unknown>, msg?: string) => Promise<void>;
}) {
  const [f, setF] = useState({
    displayName: guest?.displayName ?? "",
    groupName: guest?.groupName ?? "",
    phone: guest?.phone ?? "",
    seats: guest?.seats ?? 1,
    notes: guest?.notes ?? "",
    status: guest?.status ?? "active",
    stage1: guest?.stage1 ?? "",
    stage2: guest?.stage2 ?? "",
    attending: guest?.attending ?? 0,
  });
  const [replaceId, setReplaceId] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof f, v: string | number) => setF((p) => ({ ...p, [k]: v }));

  async function save() {
    setError(null);
    const body = {
      displayName: f.displayName,
      groupName: f.groupName || null,
      phone: f.phone || null,
      seats: Number(f.seats),
      notes: f.notes || null,
      status: f.status,
      ...(guest ? { stage1: f.stage1 || null, stage2: f.stage2 || null, attending: Number(f.attending) } : {}),
    };
    try {
      if (guest) await api(`/api/admin/guests/${guest.id}`, "PATCH", body);
      else await api("/api/admin/guests", "POST", { guest: body });
      onSaved(guest ? "Guardado" : "Convidado adicionado");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="adm-drawer-wrap" onClick={onClose}>
      <aside className="adm-drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={guest ? "Editar convidado" : "Novo convidado"}>
        <header>
          <h2>{guest ? "Editar convite" : "Novo convite"}</h2>
          <button className="adm-x" onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </header>
        <label>
          <span>Nome no convite</span>
          <input value={f.displayName} onChange={(e) => set("displayName", e.target.value)} placeholder="ex.: Ana e Paulo Mendes" autoFocus={!guest} />
        </label>
        <div className="adm-grid2">
          <label>
            <span>Lugares</span>
            <input type="number" inputMode="numeric" min={1} max={10} value={f.seats} onChange={(e) => set("seats", e.target.value)} />
          </label>
          <label>
            <span>Grupo</span>
            <input value={f.groupName} onChange={(e) => set("groupName", e.target.value)} placeholder="Família, Amigos…" />
          </label>
        </div>
        <label>
          <span>Telefone (WhatsApp)</span>
          <input type="tel" inputMode="tel" value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="9xx xxx xxx" />
        </label>
        <label>
          <span>Notas privadas</span>
          <input value={f.notes} onChange={(e) => set("notes", e.target.value)} />
        </label>
        <label>
          <span>Estado</span>
          <select value={f.status} onChange={(e) => set("status", e.target.value)}>
            <option value="active">Activo</option>
            <option value="waitlist">Lista de espera</option>
            <option value="replaced">Substituído</option>
          </select>
        </label>

        {guest && (
          <>
            <h3>Respostas (podes registar respostas dadas por telefone)</h3>
            <div className="adm-grid2">
              <label>
                <span>Etapa 1 · intenção</span>
                <select value={f.stage1} onChange={(e) => set("stage1", e.target.value)}>
                  <option value="">Sem resposta</option>
                  <option value="yes">Sim</option>
                  <option value="no">Não</option>
                </select>
              </label>
              <label>
                <span>Etapa 2 · final</span>
                <select value={f.stage2} onChange={(e) => set("stage2", e.target.value)}>
                  <option value="">Sem resposta</option>
                  <option value="confirmed">Confirmado</option>
                  <option value="declined">Recusou</option>
                </select>
              </label>
            </div>
            <label>
              <span>Pessoas que vêm</span>
              <input type="number" inputMode="numeric" min={0} max={f.seats} value={f.attending} onChange={(e) => set("attending", e.target.value)} />
            </label>
            {guest.message && <blockquote className="adm-quote">“{guest.message}”</blockquote>}
          </>
        )}

        {error && <p className="adm-error">{error}</p>}
        <button className="adm-btn adm-btn-primary adm-wide" onClick={save}>
          {guest ? "Guardar" : "Adicionar"}
        </button>

        {guest && (
          <div className="adm-danger">
            {guest.status === "active" && waitlist.length > 0 && (
              <div className="adm-replace">
                <span>Substituir por alguém da lista de espera</span>
                <div className="adm-tools">
                  <select value={replaceId} onChange={(e) => setReplaceId(e.target.value)}>
                    <option value="">Escolher…</option>
                    {waitlist.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.displayName} ({w.seats})
                      </option>
                    ))}
                  </select>
                  <button
                    className="adm-btn adm-btn-ghost"
                    disabled={!replaceId}
                    onClick={async () => {
                      await act(guest, { action: "replaceWith", otherId: replaceId });
                      onSaved("Substituição feita — envia o convite ao novo convidado");
                    }}
                  >
                    Substituir
                  </button>
                </div>
              </div>
            )}
            <button className="adm-btn adm-btn-ghost" onClick={async () => (await act(guest, { action: guest.sentAt ? "unmarkSent" : "markSent" }), onSaved(guest.sentAt ? "Marcado como por enviar" : "Marcado como enviado"))}>
              {guest.sentAt ? "Marcar como não enviado" : "Marcar como enviado"}
            </button>
            <button className="adm-btn adm-btn-ghost" onClick={async () => (await act(guest, { action: "resetResponses" }), onSaved("Respostas apagadas"))}>
              Apagar respostas
            </button>
            <button
              className="adm-btn adm-btn-ghost"
              onClick={async () => (await act(guest, { action: "regenerate" }), onSaved("Novo link criado — o antigo deixou de funcionar"))}
            >
              Gerar novo link (anula o antigo)
            </button>
            {confirmDelete ? (
              <button
                className="adm-btn adm-btn-bad"
                onClick={async () => {
                  await api(`/api/admin/guests/${guest.id}`, "DELETE");
                  onSaved("Convidado removido");
                }}
              >
                Confirmar: remover {guest.displayName}
              </button>
            ) : (
              <button className="adm-btn adm-btn-bad-ghost" onClick={() => setConfirmDelete(true)}>
                Remover convidado
              </button>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
