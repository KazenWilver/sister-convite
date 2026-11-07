"use client";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Seal } from "@/components/Seal";
import { EVENT } from "@/lib/config";
import type { PublicEvent, PublicGuest } from "@/lib/guests";
import * as sfx from "@/lib/sound";
import { CharacterSvg, createPuppet, IDLE, runPose } from "./Character";
import { burst, Confetti } from "./Confetti";
import { Rsvp } from "./Rsvp";
import "./invite.css";

gsap.registerPlugin(ScrollTrigger, SplitText);

const SWATCHES = [
  { name: "Baunilha", hex: "#d7bda6" },
  { name: "Caramelo", hex: "#ab7743" },
  { name: "Amêndoa", hex: "#b7957f" },
  { name: "Café", hex: "#6d3914" },
  { name: "Moca", hex: "#84593d" },
  { name: "Espresso", hex: "#4c2b08" },
];

const LEDGER = [
  { d: "Cafés (espresso, moca, caramelo…)", deb: "∞", cred: "" },
  { d: "Noites de estudo", deb: "muitas", cred: "" },
  { d: "Frequências e exames", deb: "todos", cred: "" },
  { d: "Apoio da família e dos amigos", deb: "", cred: "sempre" },
  { d: "Fé e persistência", deb: "", cred: "inabaláveis" },
];

function parseTime(t: string | null): { h: number; m: number } | null {
  const m = t?.match(/(\d{1,2})\s*[h:.]\s*(\d{2})?/i);
  if (!m) return null;
  const h = Number(m[1]);
  const mi = Number(m[2] ?? 0);
  return h < 24 && mi < 60 ? { h, m: mi } : null;
}

function useCountdown(target: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  const ms = Math.max(0, target - now);
  return { d: Math.floor(ms / 864e5), h: Math.floor((ms / 36e5) % 24), m: Math.floor((ms / 6e4) % 60), past: ms === 0 };
}

/* ── Calendário de arrancar ─────────────────────────────────────── */
function TearCalendar({ time }: { time: string | null }) {
  const sheet = useRef<HTMLDivElement>(null);
  const [torn, setTorn] = useState(false);
  const drag = useRef<{ y: number; dy: number } | null>(null);

  const tear = () => {
    if (torn || !sheet.current) return;
    setTorn(true);
    sfx.paper(0.4, 0.25);
    gsap.to(sheet.current, { y: 260, x: 60, rotation: 24, opacity: 0, duration: 0.9, ease: "power2.in", transformOrigin: "10% 0%" });
    gsap.fromTo(".cal-day", { scale: 0.7, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.7, delay: 0.25, ease: "back.out(2)" });
  };

  return (
    <div className="cal" aria-label={`${EVENT.dateLabel}${time ? `, ${time}` : ""}`}>
      <div className="cal-rings" aria-hidden="true">
        {Array.from({ length: 6 }, (_, i) => (
          <span key={i} />
        ))}
      </div>
      <div className="cal-page">
        <p className="cal-month">Novembro · 2026</p>
        <p className="cal-day">28</p>
        <p className="cal-week">Sábado</p>
        <p className="cal-time">{time ? `às ${time}` : "Hora a anunciar"}</p>
      </div>
      {!torn && (
        <div
          ref={sheet}
          className="cal-sheet paper-grain"
          role="button"
          tabIndex={0}
          aria-label="Arrancar a folha do calendário"
          onClick={tear}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && tear()}
          onPointerDown={(e) => (drag.current = { y: e.clientY, dy: 0 })}
          onPointerMove={(e) => {
            if (!drag.current || !sheet.current) return;
            drag.current.dy = Math.max(0, e.clientY - drag.current.y);
            gsap.set(sheet.current, { rotation: drag.current.dy * 0.08, y: drag.current.dy * 0.35, transformOrigin: "10% 0%" });
            if (drag.current.dy > 70) {
              drag.current = null;
              tear();
            }
          }}
          onPointerUp={() => {
            if (drag.current && sheet.current) gsap.to(sheet.current, { rotation: 0, y: 0, duration: 0.3 });
            drag.current = null;
          }}
        >
          <p className="cal-month">Novembro · 2026</p>
          <p className="cal-q">?</p>
          <p className="cal-hint">Arranca a folha</p>
          <span className="cal-perf" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}

/* ── Mapa dobrado ───────────────────────────────────────────────── */
function FoldMap({ open, onOpen }: { open: boolean; onOpen: () => void }) {
  return (
    <button className={open ? "map open" : "map"} onClick={onOpen} aria-label={open ? "Mapa aberto" : "Abrir o mapa"} aria-expanded={open}>
      <span className="map-panel map-l">
        <span className="map-face map-front paper-grain">
          <span className="map-art map-art-l" />
        </span>
        <span className="map-face map-back paper-grain">
          <em>Abre</em>
        </span>
      </span>
      <span className="map-panel map-c paper-grain">
        <span className="map-art map-art-c" />
        <svg className="map-pin" viewBox="0 0 40 52" aria-hidden="true">
          <path d="M20 51C20 51 4 31 4 19a16 16 0 0 1 32 0c0 12-16 32-16 32z" fill="#4c2b08" />
          <circle cx="20" cy="19" r="7" fill="#c9a35a" />
        </svg>
      </span>
      <span className="map-panel map-r">
        <span className="map-face map-front paper-grain">
          <span className="map-art map-art-r" />
        </span>
        <span className="map-face map-back paper-grain">
          <em>o mapa</em>
        </span>
      </span>
    </button>
  );
}

function mapLinks(lat: number, lng: number) {
  const ll = `${lat},${lng}`;
  return {
    google: `https://www.google.com/maps/dir/?api=1&destination=${ll}&travelmode=driving`,
    waze: `https://waze.com/ul?ll=${ll}&navigate=yes`,
    apple: `https://maps.apple.com/?daddr=${ll}&dirflg=d`,
  };
}

export function InviteBody({ token, guest, event, active }: { token: string; guest: PublicGuest; event: PublicEvent; active: boolean }) {
  const root = useRef<HTMLElement>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [posted, setPosted] = useState<boolean[]>(() => LEDGER.map(() => false));
  const [gown, setGown] = useState(SWATCHES[3]);
  const [copied, setCopied] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const P = guest.plural;

  const time = parseTime(event.time);
  const target = useMemo(() => {
    const hh = String(time?.h ?? 0).padStart(2, "0");
    const mm = String(time?.m ?? 0).padStart(2, "0");
    return new Date(`${EVENT.dateISO}T${hh}:${mm}:00+01:00`).getTime();
  }, [time?.h, time?.m]);
  const cd = useCountdown(target);

  useEffect(() => setIsIOS(/iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent) && "ontouchend" in document), []);

  const gcal = useMemo(() => {
    const day = EVENT.dateISO.replace(/-/g, "");
    const dates = time
      ? (() => {
          const s = new Date(target);
          const e = new Date(target + 5 * 36e5);
          const f = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
          return `${f(s)}/${f(e)}`;
        })()
      : `${day}/20261129`;
    const q = new URLSearchParams({
      action: "TEMPLATE",
      text: `Festa de licenciatura da ${EVENT.firstName}`,
      dates,
      details: `Celebração da licenciatura de ${EVENT.graduate} em ${EVENT.course}.`,
      ...(event.address ? { location: event.address } : {}),
    });
    return `https://calendar.google.com/calendar/render?${q}`;
  }, [time, target, event.address]);

  // ── animações (só depois da abertura) ──
  useLayoutEffect(() => {
    if (!active || !root.current) return;
    if (process.env.NODE_ENV !== "production") (window as unknown as { __gsap: typeof gsap }).__gsap = gsap;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    ScrollTrigger.config({ ignoreMobileResize: true });
    let splits: SplitText[] = [];
    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(root);

      // Hero: o nome revela-se letra a letra, o lacre "carimba"
      const hero = gsap.timeline({ delay: 0.15 });
      const first = new SplitText(q(".grad-first"), { type: "chars", charsClass: "ch" });
      splits.push(first);
      hero
        .fromTo(q(".hero [data-in]"), { opacity: 0, y: 18 }, { opacity: 1, y: 0, stagger: 0.12, duration: 0.8, ease: "power3.out" }, 0)
        .fromTo(q(".guest-name"), { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 1.2, ease: "power2.inOut" }, 0.35)
        .fromTo(first.chars, { yPercent: 110, rotate: 8, opacity: 0 }, { yPercent: 0, rotate: 0, opacity: 1, stagger: 0.05, duration: 0.9, ease: "back.out(1.6)" }, 0.8)
        .fromTo(q(".grad-last"), { opacity: 0, letterSpacing: "0.5em" }, { opacity: 1, letterSpacing: "0.18em", duration: 1.1, ease: "power3.out" }, 1.1)
        .fromTo(q(".hero-seal"), { scale: 2.4, rotate: -50, opacity: 0 }, { scale: 1, rotate: 0, opacity: 1, duration: 0.55, ease: "power4.in", onComplete: () => sfx.thud(0.45, 140) }, 1.5)
        .fromTo(q(".scroll-cue"), { opacity: 0 }, { opacity: 1, duration: 0.6 }, 2.2);

      if (reduced) return;

      // Revelações genéricas
      q("[data-reveal]").forEach((el) => {
        gsap.fromTo(el, { opacity: 0, y: 36 }, { opacity: 1, y: 0, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%" } });
      });

      // Títulos de secção: palavras que sobem
      q(".sec-title").forEach((el) => {
        const s = new SplitText(el, { type: "words,lines", linesClass: "ln", wordsClass: "wd" });
        splits.push(s);
        gsap.fromTo(s.words, { yPercent: 105 }, { yPercent: 0, stagger: 0.06, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 86%" } });
      });

      // Parallax suave do lacre do herói
      gsap.to(q(".hero-seal"), { y: -60, rotate: 40, ease: "none", scrollTrigger: { trigger: q(".hero")[0], start: "top top", end: "bottom top", scrub: true } });

      // Conquista: travelling horizontal com a mini-Juceline a caminhar
      const track = q(".achieve-track")[0] as HTMLElement;
      const walker = q(".walker [data-root]")[0] as unknown as SVGGElement | undefined;
      const puppet = walker ? createPuppet(walker) : null;
      puppet?.set(IDLE);
      const dist = () => track.scrollWidth - window.innerWidth;
      gsap.to(track, {
        x: () => -dist(),
        ease: "none",
        scrollTrigger: {
          trigger: q(".achieve")[0],
          start: "top top",
          end: () => `+=${dist()}`,
          pin: true,
          scrub: 0.6,
          invalidateOnRefresh: true,
          onUpdate: (self) => puppet?.set(runPose(self.progress * Math.PI * 2 * 7, 0.55)),
        },
      });
      q(".achieve-word").forEach((el) => {
        gsap.fromTo(el, { xPercent: 18 }, { xPercent: -8, ease: "none", scrollTrigger: { trigger: q(".achieve")[0], start: "top top", end: () => `+=${dist()}`, scrub: true } });
      });

      // Mini-Juceline do dress code respira
      const dressG = q(".dress-girl [data-root]")[0] as unknown as SVGGElement | undefined;
      if (dressG) {
        const p = createPuppet(dressG);
        const o = { t: 0 };
        gsap.to(o, {
          t: 1,
          duration: 3,
          repeat: -1,
          ease: "none",
          onUpdate: () => p.set({ ...IDLE, bob: Math.sin(o.t * Math.PI * 2) * 1.2, armF: 4 + Math.sin(o.t * Math.PI * 2) * 3, blink: o.t > 0.96 ? 1 : 0, tassel: Math.sin(o.t * Math.PI * 4) * 4 }),
        });
      }

      // Final: personagem a respirar
      const finG = q(".final-girl [data-root]")[0] as unknown as SVGGElement | undefined;
      if (finG) {
        const p = createPuppet(finG);
        const o = { t: 0 };
        gsap.to(o, {
          t: 1,
          duration: 3.4,
          repeat: -1,
          ease: "none",
          onUpdate: () => p.set({ ...IDLE, bob: Math.sin(o.t * Math.PI * 2) * 1.4, head: Math.sin(o.t * Math.PI * 2) * 2, blink: o.t > 0.95 ? 1 : 0 }),
        });
      }

      // Fundo muda de ambiente ao entrar nas secções escuras
      q("[data-tone]").forEach((el) => {
        ScrollTrigger.create({ trigger: el, start: "top 60%", end: "bottom 40%", toggleClass: { targets: el, className: "lit" } });
      });
    }, root);

    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    return () => {
      splits.forEach((s) => s.revert());
      splits = [];
      ctx.revert();
    };
  }, [active]);

  const allPosted = posted.every(Boolean);
  const post = (i: number) => {
    if (posted[i]) return;
    sfx.tick(1500 + i * 120, 0.14);
    setPosted((p) => p.map((v, k) => (k === i ? true : v)));
  };
  useEffect(() => {
    if (allPosted) {
      sfx.thud(0.5, 130);
      const el = document.querySelector(".ledger-result");
      const r = el?.getBoundingClientRect();
      if (r) burst(r.left + r.width / 2, r.top + 20, 70);
    }
  }, [allPosted]);

  const tossCap = () => {
    const cap = document.querySelector<SVGGElement>('.final-girl [data-p="cap"]');
    if (!cap || gsap.isTweening(cap)) return;
    sfx.whoosh(0.5, 0.3);
    const r = cap.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top, 120, 1.2);
    gsap
      .timeline()
      .to(cap, { y: -260, rotation: 540, duration: 0.75, ease: "power2.out", transformOrigin: "50% 50%" })
      .to(cap, { y: 0, rotation: 720, duration: 0.7, ease: "bounce.out" })
      .call(() => sfx.thud(0.25, 220))
      .set(cap, { rotation: 0 });
  };
  const swipe = useRef<number | null>(null);

  const links = event.lat != null && event.lng != null ? mapLinks(event.lat, event.lng) : null;
  const apps = links
    ? [
        { k: "google", label: "Google Maps", href: links.google },
        { k: "waze", label: "Waze", href: links.waze },
        { k: "apple", label: "Apple Maps", href: links.apple },
      ].sort((a, b) => (isIOS ? (a.k === "apple" ? -1 : b.k === "apple" ? 1 : 0) : 0))
    : [];

  return (
    <main className="invite paper-grain" ref={root} aria-hidden={!active}>
      <div className="frame" aria-hidden="true" />
      <Confetti />

      {/* 1 · Diploma */}
      <section className="hero">
        <p className="eyebrow" data-in>
          Diploma de Convite
        </p>
        <span className="rule" data-in aria-hidden="true">
          <i />
        </span>
        <p className="lead" data-in>
          Com muito carinho, convidamos
        </p>
        <p className="guest-name">{guest.name}</p>
        <p className="lead" data-in>
          para celebrar a licenciatura de
        </p>
        <h1 className="grad">
          <span className="grad-first">{EVENT.firstName}</span>
          <span className="grad-last">{EVENT.lastNames}</span>
        </h1>
        <div className="hero-seal">
          <Seal />
          <svg viewBox="-60 -60 120 120" className="hero-seal-ring" aria-hidden="true">
            <defs>
              <path id="ringPath" d="M0,-50 a50,50 0 1,1 -0.1,0" />
            </defs>
            <text fontSize="9.5" letterSpacing="3.2">
              <textPath href="#ringPath">LUANDA · 28 · 11 · 2026 · LICENCIATURA · </textPath>
            </text>
          </svg>
        </div>
        <p className="scroll-cue">
          Desliza <span aria-hidden="true">↓</span>
        </p>
      </section>

      {/* 2 · A conquista (travelling horizontal) */}
      <section className="achieve" data-tone>
        <div className="achieve-track">
          <div className="achieve-panel">
            <p className="kicker">Licenciada em</p>
            <p className="achieve-word">Contabilidade</p>
          </div>
          <div className="achieve-panel">
            <p className="achieve-word amp">&amp; Finanças</p>
            <p className="achieve-note">Muitos números, balanços e dedicação — e um diploma no fim.</p>
          </div>
          <div className="achieve-panel">
            <p className="kicker">Pelo</p>
            <p className="achieve-inst">{EVENT.institution}</p>
            <p className="achieve-note">
              {EVENT.institutionLong}
              <br />
              {EVENT.city}, Angola
            </p>
          </div>
        </div>
        <div className="ledger-line" aria-hidden="true" />
        <CharacterSvg className="walker" />
      </section>

      {/* 3 · Balancete */}
      <section className="sheet">
        <p className="kicker" data-reveal>
          Contas feitas
        </p>
        <h2 className="sec-title">Balancete da licenciatura</h2>
        <p className="sec-sub" data-reveal>
          Toca em cada linha para fazer o lançamento.
        </p>
        <div className="ledger" data-reveal role="table" aria-label="Balancete">
          <div className="ledger-head" role="row">
            <span role="columnheader">Descrição</span>
            <span role="columnheader">Débito</span>
            <span role="columnheader">Crédito</span>
          </div>
          {LEDGER.map((r, i) => (
            <button key={r.d} role="row" className={posted[i] ? "ledger-row on" : "ledger-row"} onClick={() => post(i)} aria-pressed={posted[i]}>
              <span role="cell">{r.d}</span>
              <span role="cell" className="num">
                {posted[i] ? r.deb : r.deb ? "·" : ""}
              </span>
              <span role="cell" className="num">
                {posted[i] ? r.cred : r.cred ? "·" : ""}
              </span>
            </button>
          ))}
          <div className={allPosted ? "ledger-result on" : "ledger-result"} role="row">
            <span role="cell">Resultado do exercício</span>
            <strong role="cell">{allPosted ? "Licenciada" : "…"}</strong>
          </div>
        </div>
        {!allPosted && (
          <button className="link" onClick={() => LEDGER.forEach((_, i) => setTimeout(() => post(i), i * 160))}>
            Lançar tudo
          </button>
        )}
      </section>

      {/* 4 · A data */}
      <section className="when" data-tone>
        <p className="kicker" data-reveal>
          Guarda a data
        </p>
        <h2 className="sec-title">Vamos celebrar</h2>
        <div data-reveal>
          <TearCalendar time={event.time} />
        </div>
        {!cd.past && (
          <div className="count" data-reveal aria-label={`Faltam ${cd.d} dias`}>
            <div>
              <strong>{cd.d}</strong>
              <span>dias</span>
            </div>
            <div>
              <strong>{String(cd.h).padStart(2, "0")}</strong>
              <span>horas</span>
            </div>
            <div>
              <strong>{String(cd.m).padStart(2, "0")}</strong>
              <span>min</span>
            </div>
          </div>
        )}
        <div className="cal-actions" data-reveal>
          <a className="btn btn-light" href={gcal} target="_blank" rel="noopener noreferrer">
            Google Calendar
          </a>
          <a className="btn btn-outline-light" href={`/c/${token}/calendario`}>
            Calendário do telemóvel
          </a>
        </div>
      </section>

      {/* 5 · Dress code */}
      {event.dressCode && (
        <section className="dress">
          <p className="kicker" data-reveal>
            Dress code
          </p>
          <h2 className="sec-title">Tons de café</h2>
          {event.dressCodeNote && (
            <p className="sec-sub" data-reveal>
              {event.dressCodeNote}
            </p>
          )}
          <div className="dress-stage" data-reveal>
            <CharacterSvg className="dress-girl" gown={gown.hex} />
            <div className="swatches" role="radiogroup" aria-label="Cores do dress code">
              {SWATCHES.map((s, i) => (
                <button
                  key={s.hex}
                  role="radio"
                  aria-checked={gown.hex === s.hex}
                  className={gown.hex === s.hex ? "sw on" : "sw"}
                  style={{ "--c": s.hex, "--i": i } as React.CSSProperties}
                  onClick={() => (setGown(s), sfx.pop(520 + i * 60, 0.18))}
                >
                  <span className="sw-chip" />
                  <span className="sw-name">{s.name}</span>
                  <span className="sw-hex">{s.hex.toUpperCase()}</span>
                </button>
              ))}
            </div>
          </div>
          <p className="dress-tip" data-reveal>
            Toca numa cor para a Juceline a experimentar.
          </p>
        </section>
      )}

      {/* 6 · Local */}
      <section className="where" data-tone>
        <p className="kicker" data-reveal>
          Onde
        </p>
        <h2 className="sec-title">{event.venueName ?? "O local da festa"}</h2>
        <div data-reveal>
          <FoldMap
            open={mapOpen}
            onOpen={() => {
              if (!mapOpen) sfx.paper(0.6, 0.22);
              setMapOpen(true);
            }}
          />
        </div>
        {links ? (
          <div className={mapOpen ? "where-info show" : "where-info"}>
            {event.address && <p className="where-addr">{event.address}</p>}
            <p className="where-lead">Consulta a localização e escolhe a tua aplicação de mapas.</p>
            <div className="apps">
              {apps.map((a) => (
                <a key={a.k} className={`app app-${a.k}`} href={a.href} target="_blank" rel="noopener noreferrer">
                  <span className="app-ico" aria-hidden="true" />
                  {a.label}
                </a>
              ))}
            </div>
            <p className="where-help">O percurso começa onde estiveres. Se a aplicação não estiver instalada, abre a versão no browser.</p>
            {event.address && (
              <button
                className="link light"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(event.address!);
                    setCopied(true);
                  } catch {}
                }}
              >
                {copied ? "Morada copiada ✓" : "Copiar morada"}
              </button>
            )}
          </div>
        ) : (
          <p className="where-lead show" data-reveal>
            A localização vai aparecer aqui em breve.
          </p>
        )}
      </section>

      {/* 7 · RSVP */}
      <section className="reply">
        <p className="kicker" data-reveal>
          Confirmação de presença
        </p>
        <h2 className="sec-title">{P ? "Vêm celebrar connosco?" : "Vens celebrar connosco?"}</h2>
        <div data-reveal>
          <Rsvp token={token} initial={guest} />
        </div>
      </section>

      {/* 8 · Final */}
      <section
        className="final"
        data-tone
        onPointerDown={(e) => (swipe.current = e.clientY)}
        onPointerUp={(e) => {
          if (swipe.current != null && swipe.current - e.clientY > 50) tossCap();
          swipe.current = null;
        }}
      >
        <h2 className="sec-title">{P ? "Contamos convosco!" : "Contamos contigo!"}</h2>
        <div className="final-stage">
          <CharacterSvg className="final-girl" />
        </div>
        <button className="btn btn-gold" onClick={tossCap}>
          Atira o capelo ao ar
        </button>
        <p className="final-tip">ou desliza o dedo para cima</p>
        <p className="sign">Com carinho, {EVENT.hosts}</p>
        <footer className="foot">
          Convite pessoal para {guest.name}. Por favor, não partilhes este link.
        </footer>
      </section>
    </main>
  );
}
