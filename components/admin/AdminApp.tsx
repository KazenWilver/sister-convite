"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AdminGuest } from "@/lib/admin";
import type { LogEntry, Settings } from "@/lib/store/types";
import { Tour, tourSeen, type TourStep } from "./Tour";
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

type Tab = "guests" | "activity" | "messages" | "door" | "import" | "settings";
type Filter = "all" | "unsent" | "unopened" | "opened" | "noanswer" | "yes" | "no" | "pending" | "confirmed" | "declined" | "waitlist" | "replaced";

const FILTERS: [Filter, string][] = [
  ["all", "Todos"],
  ["unsent", "Por enviar"],
  ["unopened", "Enviados, por abrir"],
  ["opened", "Já abriram"],
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
    case "unopened":
      return active && !!g.sentAt && !g.firstOpenedAt;
    case "opened":
      return active && !!g.firstOpenedAt;
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
  const [log, setLog] = useState<LogEntry[]>([]);
  const [tour, setTour] = useState(false);
  const lastSeen = useRef<string | null>(null);

  const load = useCallback(async () => {
    const d = await api<{ guests: AdminGuest[]; stats: Stats; settings: Settings; log: LogEntry[] }>("/api/admin/guests");
    setGuests(d.guests);
    setStats(d.stats);
    setSettings(d.settings);
    setLog(d.log);
    // novidades desde a última actualização (respostas, mensagens, aberturas)
    const top = d.log[0]?.at ?? null;
    if (lastSeen.current && top && top > lastSeen.current) {
      const fresh = d.log.filter((e) => e.at > lastSeen.current! && e.action !== "sent");
      const g = fresh[0] && d.guests.find((x) => x.id === fresh[0].guestId);
      if (g) {
        setToast(`${g.displayName} ${describe(fresh[0]).text}${fresh.length > 1 ? ` (+${fresh.length - 1})` : ""}`);
        window.setTimeout(() => setToast(null), 4200);
      }
    }
    if (top) lastSeen.current = top;
  }, []);

  useEffect(() => {
    load().catch(() => undefined);
    // actualiza sozinho a cada 30 s (e quando se volta ao separador)
    const t = window.setInterval(() => document.visibilityState === "visible" && load().catch(() => undefined), 30_000);
    const vis = () => document.visibilityState === "visible" && load().catch(() => undefined);
    document.addEventListener("visibilitychange", vis);
    if (!tourSeen()) window.setTimeout(() => setTour(true), 900);
    return () => {
      window.clearInterval(t);
      document.removeEventListener("visibilitychange", vis);
    };
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

  async function remove(g: AdminGuest) {
    const answered = g.stage1 || g.stage2 ? " As respostas dele também desaparecem." : "";
    if (!window.confirm(`Excluir ${g.displayName}?

O link deixa de funcionar.${answered} Não dá para desfazer.`)) return;
    await api(`/api/admin/guests/${g.id}`, "DELETE");
    if (editing && editing !== "new" && editing.id === g.id) setEditing(null);
    await load();
    notify(`${g.displayName} foi excluído`);
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
        <div className="adm-head-text">
          <p className="adm-kicker">Licenciatura · 28 · 11 · 2026</p>
          <h1>
            Painel da <span className="adm-script">Juceline</span>
          </h1>
          <p className="adm-countdown">{countdown()}</p>
        </div>
        <div className="adm-head-actions">
          <button className="adm-btn adm-btn-ghost" onClick={() => setTour(true)} data-tour="help">
            Tutorial
          </button>
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

      <nav className="adm-tabs" role="tablist" data-tour="tabs">
        {(
          [
            ["guests", "Convidados"],
            ["activity", "Actividade"],
            ["messages", `Mensagens${stats?.messages ? ` (${stats.messages})` : ""}`],
            ["door", "Entrada"],
            ["import", "Importar"],
            ["settings", "Definições"],
          ] as [Tab, string][]
        ).map(([k, label]) => (
          <button key={k} role="tab" data-tour={`tab-${k}`} aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>
            {label}
          </button>
        ))}
      </nav>

      {tab === "guests" && (
        <section>
          <div className="adm-tools" data-tour="tools">
            <input className="adm-search" placeholder="Procurar nome ou grupo…" value={query} onChange={(e) => setQuery(e.target.value)} />
            <button className="adm-btn adm-btn-primary" onClick={() => setEditing("new")}>
              + Convidado
            </button>
          </div>
          <div className="adm-filters" data-tour="filters">
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
              {visible.map((g, i) => (
                <li key={g.id} className="adm-row" style={{ "--i": Math.min(i, 12) } as React.CSSProperties} data-tour={i === 0 ? "row" : undefined}>
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
                  <div className="adm-chips" data-tour-chips>
                    <Chip tone={g.status === "waitlist" ? "warn" : g.status === "replaced" ? "mute" : g.sentAt ? "ok" : "mute"}>
                      {g.status === "waitlist" ? "Lista de espera" : g.status === "replaced" ? "Substituído" : g.sentAt ? "Enviado" : "Por enviar"}
                    </Chip>
                    {g.firstOpenedAt && (
                      <Chip tone="ok" title={`Última visita: ${fmt(g.lastOpenedAt)}`}>
                        Aberto ×{g.openCount}
                      </Chip>
                    )}
                    {g.devices.length > Math.max(2, g.seats + 1) && (
                      <Chip tone="warn" title="O link foi aberto em mais telemóveis do que o normal: pode ter sido reencaminhado.">
                        ⚠ {g.devices.length} dispositivos
                      </Chip>
                    )}
                    {g.checkedInAt && <Chip tone="gold">Entrou {fmt(g.checkedInAt).slice(-5)}</Chip>}
                    <Chip tone={g.stage1 === "yes" ? "ok" : g.stage1 === "no" ? "bad" : "mute"}>
                      1 · {g.stage1 === "yes" ? `Sim (${g.attending})` : g.stage1 === "no" ? "Não" : "—"}
                    </Chip>
                    <Chip tone={g.stage2 === "confirmed" ? "gold" : g.stage2 === "declined" ? "bad" : "mute"}>
                      2 · {g.stage2 === "confirmed" ? `Confirmado (${g.attending})` : g.stage2 === "declined" ? "Recusou" : "—"}
                    </Chip>
                  </div>
                  <div className="adm-row-actions" data-tour-actions>
                    <button className="adm-btn adm-btn-wa" onClick={() => sendWa(g, g.stage1 === "yes" && !g.stage2 && settings?.finalOpen ? "reminder" : "invite")} disabled={!g.link}>
                      {g.stage1 === "yes" && !g.stage2 && settings?.finalOpen ? "Lembrar" : "WhatsApp"}
                    </button>
                    <button className="adm-btn adm-btn-ghost" onClick={() => copy(g)} disabled={!g.link}>
                      Copiar link
                    </button>
                    <a className="adm-btn adm-btn-ghost" href={g.link ? `${g.link}?preview=1` : "#"} target="_blank" rel="noopener noreferrer" title="Abre o convite sem contar como visita do convidado">
                      Ver
                    </a>
                    <button className="adm-btn adm-btn-bad-ghost" onClick={() => remove(g)}>
                      Excluir
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === "activity" && <Activity log={log} guests={guests} />}
      {tab === "door" && <Door guests={guests} onChange={load} />}
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

      {tour && <Tour steps={tourSteps(setTab, setFilter)} onClose={() => (setTour(false), setTab("guests"))} />}

      {toast && (
        <div className="adm-toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}

function countdown(): string {
  const d = Math.ceil((new Date("2026-11-28T18:00:00+01:00").getTime() - Date.now()) / 864e5);
  if (d > 1) return `Faltam ${d} dias para a festa`;
  if (d === 1) return "A festa é amanhã!";
  if (d === 0) return "É hoje!";
  return "A festa já aconteceu. Obrigado!";
}

/** Frase e tom de cada acontecimento do registo. */
function describe(e: LogEntry): { text: string; tone: "ok" | "bad" | "info" | "gold" | "mute" } {
  const [v, n] = (e.value ?? "").split(":");
  const people = Number(n) > 1 ? ` (${n} pessoas)` : "";
  switch (e.action) {
    case "open":
      return { text: "abriu o convite pela primeira vez", tone: "info" };
    case "sent":
      return { text: "recebeu o convite por WhatsApp", tone: "mute" };
    case "stage1":
      return v === "yes" ? { text: `disse que vem${people}`, tone: "ok" } : { text: "disse que não pode ir", tone: "bad" };
    case "stage2":
      return v === "confirmed" ? { text: `confirmou a presença${people}`, tone: "gold" } : { text: "desconfirmou: afinal não vem", tone: "bad" };
    case "message":
      return { text: "deixou uma mensagem para a Juceline", tone: "info" };
    case "checkin":
      return { text: `entrou na festa${Number(e.value) > 1 ? ` (${e.value} pessoas)` : ""}`, tone: "gold" };
    case "checkin-undo":
      return { text: "teve a entrada anulada", tone: "mute" };
    case "replaced":
      return { text: "foi substituído por outro convidado", tone: "mute" };
    default:
      return { text: e.action, tone: "mute" };
  }
}

function Activity({ log, guests }: { log: LogEntry[]; guests: AdminGuest[] }) {
  const [only, setOnly] = useState<"all" | "answers">("all");
  const byId = useMemo(() => new Map(guests.map((g) => [g.id, g])), [guests]);
  const list = log.filter((e) => byId.has(e.guestId) && (only === "all" || ["stage1", "stage2", "message", "checkin"].includes(e.action)));
  if (!log.length)
    return (
      <div className="adm-empty">
        <p>Ainda não aconteceu nada. Quando alguém abrir o convite ou responder, aparece aqui.</p>
      </div>
    );
  let day = "";
  return (
    <section className="adm-activity">
      <div className="adm-filters">
        <button className={only === "all" ? "on" : ""} onClick={() => setOnly("all")}>
          Tudo
        </button>
        <button className={only === "answers" ? "on" : ""} onClick={() => setOnly("answers")}>
          Só respostas e mensagens
        </button>
      </div>
      <ol className="adm-feed">
        {list.map((e, i) => {
          const g = byId.get(e.guestId)!;
          const d = describe(e);
          const label = new Date(e.at).toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long", timeZone: "Africa/Luanda" });
          const head = label !== day ? ((day = label), label) : null;
          return (
            <li key={`${e.at}-${i}`} style={{ "--i": Math.min(i, 14) } as React.CSSProperties}>
              {head && <p className="adm-feed-day">{head}</p>}
              <div className={`adm-feed-item ${d.tone}`}>
                <span className="adm-feed-dot" aria-hidden="true" />
                <p>
                  <strong>{g.displayName}</strong> {d.text}
                </p>
                <time>{new Date(e.at).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Luanda" })}</time>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function tourSteps(setTab: (t: Tab) => void, setFilter: (f: Filter) => void): TourStep[] {
  const list = () => (setTab("guests"), setFilter("all"));
  return [
    { title: "Olá! Bem-vinda ao painel", text: "Daqui controlas tudo sobre os convites da festa: enviar, ver quem abriu, quem confirmou e ler as mensagens. São só alguns passos e podes rever este tutorial quando quiseres.", before: list },
    { target: ".adm-stats", title: "Os números da festa", text: "O número grande é quantas pessoas já confirmaram. Ao lado: convites enviados e abertos, quem disse sim, quem ainda não respondeu e quem recusou. Actualiza sozinho a cada 30 segundos.", before: list },
    { target: '[data-tour="tabs"]', title: "As páginas do painel", text: "«Convidados» é a lista. «Actividade» mostra tudo o que acontece, pela ordem. «Mensagens» são os recados para a Juceline. «Entrada» serve no dia da festa, à porta.", before: list },
    { target: '[data-tour="tools"]', title: "Procurar e acrescentar", text: "Escreve um nome para o encontrar. Para convidar alguém novo, toca em «+ Convidado»: o convite e o link ficam prontos na hora.", before: list },
    { target: '[data-tour="filters"]', title: "Filtros", text: "Mostra só quem precisas: quem falta enviar, quem recebeu e ainda não abriu, quem disse sim, quem falta confirmar, quem recusou.", before: list },
    { target: '[data-tour="row"] [data-tour-actions]', title: "Enviar o convite", text: "«WhatsApp» abre a conversa com a mensagem e o link já escritos: só tens de carregar em enviar, e o convite fica marcado como enviado. «Ver» mostra o convite tal como o convidado o vê. «Excluir» apaga o convidado (pede confirmação antes).", before: list },
    { target: '[data-tour="row"] [data-tour-chips]', title: "O estado de cada convite", text: "As etiquetas dizem tudo: enviado, aberto (e quantas vezes), a resposta (1 · Sim / Não) e a confirmação final (2). Se aparecer «⚠ dispositivos», o link foi aberto em muitos telemóveis e pode ter sido reencaminhado.", before: list },
    { target: '[data-tour="row"] .adm-name', title: "Editar um convidado", text: "Toca no nome para mudar lugares, telefone ou grupo, registar uma resposta dada por telefone, ver quando abriu o convite, gerar um link novo ou apagar respostas de teste.", before: list },
    { target: '[data-tour="tab-activity"]', title: "Actividade", text: "Aqui vês, por ordem, quem abriu o convite, quem disse que vem, quem confirmou, quem desconfirmou e quem deixou mensagem. Quando chega algo novo, aparece um aviso em baixo.", before: list },
    { target: '[data-tour="tab-door"]', title: "No dia da festa: Entrada", text: "À porta, escreve o nome de quem chega e carrega em «Registar entrada». Vês logo se a pessoa confirmou e, se o mesmo convite entrar duas vezes, o painel avisa.", before: list },
    { target: '[data-tour="tab-settings"]', title: "Definições", text: "Hora, local, mapa e dress code. Mais perto da data, liga «Pedir a confirmação final» e usa o botão «Lembrar» em cada convidado.", before: list },
    { target: '[data-tour="help"]', title: "Pronto!", text: "Já sabes o essencial. Se te esqueceres de alguma coisa, toca em «Tutorial» e vemos tudo outra vez.", before: list },
  ];
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
    <div className="adm-stats" data-tour="stats">
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

/** À porta: procurar o convidado pelo nome e registar a entrada (só uma vez). */
function Door({ guests, onChange }: { guests: AdminGuest[]; onChange: () => Promise<void> }) {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [flash, setFlash] = useState<{ id: string; ok: boolean; text: string } | null>(null);
  const inside = guests.filter((g) => g.checkedInAt);
  const people = inside.reduce((a, g) => a + g.checkedInPeople, 0);
  const term = q.trim().toLowerCase();
  const list = guests
    .filter((g) => g.status === "active" && (!term || `${g.displayName} ${g.fullName ?? ""} ${g.groupName ?? ""}`.toLowerCase().includes(term)))
    .sort((a, b) => Number(b.hasPass) - Number(a.hasPass) || a.displayName.localeCompare(b.displayName))
    .slice(0, term ? 20 : 40);

  async function run(g: AdminGuest, action: "checkin" | "undo") {
    setBusy(g.id);
    try {
      const d = await api<{ guest: AdminGuest; already?: boolean }>("/api/admin/checkin", "POST", { id: g.id, action });
      setFlash(
        action === "undo"
          ? { id: g.id, ok: true, text: "Entrada anulada." }
          : d.already
            ? { id: g.id, ok: false, text: `⚠ Já tinha entrado às ${fmt(d.guest.checkedInAt).slice(-5)}.` }
            : { id: g.id, ok: true, text: "✓ Entrada registada. Boa festa!" },
      );
      await onChange();
    } catch (e) {
      setFlash({ id: g.id, ok: false, text: (e as Error).message });
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="adm-door">
      <p className="adm-door-count">
        Já entraram <strong>{people}</strong> {people === 1 ? "pessoa" : "pessoas"} ({inside.length} {inside.length === 1 ? "convite" : "convites"})
      </p>
      <label className="adm-door-label" htmlFor="door-q">
        Quem está a chegar?
      </label>
      <input id="door-q" className="adm-search" placeholder="Escreve o nome…" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
      <ul className="adm-door-list">
        {list.map((g) => {
          const n = g.attending || g.seats;
          return (
            <li key={g.id} className={`adm-door-card ${g.checkedInAt ? "in" : ""} ${flash?.id === g.id ? (flash.ok ? "ok" : "already") : ""}`}>
              <div>
                <p className="adm-door-name">{g.displayName}</p>
                <p className="adm-door-meta">
                  {n} {n > 1 ? "pessoas" : "pessoa"}
                  {g.hasPass ? " · confirmou" : " · não confirmou"}
                  {g.checkedInAt ? ` · entrou às ${fmt(g.checkedInAt).slice(-5)}` : ""}
                </p>
                {flash?.id === g.id && <p className={`adm-door-msg ${flash.ok ? "ok" : "bad"}`}>{flash.text}</p>}
              </div>
              {g.checkedInAt ? (
                <button className="adm-btn adm-btn-ghost" disabled={busy === g.id} onClick={() => run(g, "undo")}>
                  Anular
                </button>
              ) : (
                <button className="adm-btn adm-btn-primary" disabled={busy === g.id} onClick={() => run(g, "checkin")}>
                  Registar entrada
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
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
            <h3>Convite único</h3>
            <dl className="adm-facts">
              <div>
                <dt>Número</dt>
                <dd>N.º {String(guest.sortOrder).padStart(3, "0")}</dd>
              </div>
              <div>
                <dt>Enviado</dt>
                <dd>{guest.sentAt ? fmt(guest.sentAt) : "ainda não"}</dd>
              </div>
              <div>
                <dt>Aberto</dt>
                <dd>{guest.firstOpenedAt ? `${guest.openCount}× · última ${fmt(guest.lastOpenedAt)}` : "ainda não"}</dd>
              </div>
              <div>
                <dt>Telemóveis</dt>
                <dd>{guest.devices.length || "—"}</dd>
              </div>
              <div>
                <dt>Entrada</dt>
                <dd>{guest.checkedInAt ? `${fmt(guest.checkedInAt)} · ${guest.checkedInPeople} pessoa(s)` : "—"}</dd>
              </div>
            </dl>
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
                  onSaved("Convidado excluído");
                }}
              >
                Confirmar: excluir {guest.displayName}
              </button>
            ) : (
              <button className="adm-btn adm-btn-bad-ghost" onClick={() => setConfirmDelete(true)}>
                Excluir convidado
              </button>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
