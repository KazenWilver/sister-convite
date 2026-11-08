"use client";
// O convite (partilhado pelas três versões). Composição desalinhada: cartões rodados, camadas sobrepostas,
// texto deslocado. Movimento: cada elemento entra e sai com o scroll, em direcções e velocidades diferentes.
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { UniqueSeal } from "../shared/UniqueSeal";
import { EVENT } from "@/lib/config";
import type { PublicEvent, PublicGuest } from "@/lib/guests";
import * as sfx from "@/lib/sound";
import { CharacterSvg, createPuppet, IDLE } from "../shared/Character";
import { burst, Confetti } from "../shared/Confetti";
import { blobPath, liveRadii } from "../shared/liquid";
import { DateReveal } from "./DateReveal";
import { InstallApp } from "./InstallApp";
import { Rsvp } from "./Rsvp";
import { VenueMap } from "./VenueMap";
import "./invitation.css";

gsap.registerPlugin(ScrollTrigger, SplitText);

// Cores do dress code da festa (informação do evento, não da paleta do convite).
const SWATCHES = [
  { name: "Baunilha", hex: "#d7bda6" },
  { name: "Caramelo", hex: "#ab7743" },
  { name: "Amêndoa", hex: "#b7957f" },
  { name: "Café", hex: "#6d3914" },
  { name: "Moca", hex: "#84593d" },
  { name: "Espresso", hex: "#4c2b08" },
];

// Direcções de entrada (x/y em fracções do ecrã, rotação em graus).
const FROM: Record<string, { x: number; y: number; r: number }> = {
  left: { x: -0.45, y: 0.05, r: -7 },
  right: { x: 0.45, y: 0.05, r: 7 },
  up: { x: 0, y: 0.35, r: 0 },
  down: { x: 0, y: -0.3, r: 0 },
  dl: { x: -0.35, y: 0.3, r: -10 },
  dr: { x: 0.35, y: 0.3, r: 10 },
};

function parseTime(t: string | null): { h: number; m: number } | null {
  const m = t?.match(/(\d{1,2})\s*[h:.]\s*(\d{2})?/i);
  if (!m) return null;
  const h = Number(m[1]);
  const mi = Number(m[2] ?? 0);
  return h < 24 && mi < 60 ? { h, m: mi } : null;
}

/** Contagem decrescente com segundos. Componente próprio: só ele volta a desenhar a cada segundo. */
function Countdown({ target }: { target: number }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const ms = Math.max(0, target - (now ?? target - 1));
  const d = Math.floor(ms / 864e5);
  const h = Math.floor((ms / 36e5) % 24);
  const m = Math.floor((ms / 6e4) % 60);
  const s = Math.floor((ms / 1e3) % 60);
  const pad = (n: number) => (now == null ? "--" : String(n).padStart(2, "0"));
  return (
    <div className="count" role="timer" aria-label={`Faltam ${d} dias`}>
      <div data-from="left">
        <strong>{now == null ? "--" : d}</strong>
        <span>dias</span>
      </div>
      <div data-from="up">
        <strong>{pad(h)}</strong>
        <span>horas</span>
      </div>
      <div data-from="down">
        <strong>{pad(m)}</strong>
        <span>min</span>
      </div>
      <div data-from="right" className="count-s">
        <strong key={s} aria-hidden="true">
          {pad(s)}
        </strong>
        <span>seg</span>
      </div>
    </div>
  );
}

/** Onda entre secções: a curva muda de forma com o scroll (transição líquida). */
function Wave({ fill, flip }: { fill: string; flip?: boolean }) {
  return (
    <svg className={flip ? "wave wave-top" : "wave"} viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true">
      <path data-wave fill={fill} d="M0,60 C360,20 1080,100 1440,60 L1440,120 L0,120 Z" />
    </svg>
  );
}

function wavePath(p: number) {
  const a = 34 * Math.sin(p * Math.PI * 2);
  const b = 26 * Math.cos(p * Math.PI * 3);
  return `M0,${60 + b * 0.4} C360,${60 - a - 20} 1080,${60 + a + 20} 1440,${60 - b * 0.4} L1440,120 L0,120 Z`;
}

function mapLinks(lat: number, lng: number, name: string) {
  const ll = `${lat},${lng}`;
  const q = encodeURIComponent(name);
  // Se o local é o da configuração, o Google abre a ficha do sítio com nome (link partilhado do Google Maps)
  const isConfigVenue = Math.abs(lat - EVENT.lat) < 1e-5 && Math.abs(lng - EVENT.lng) < 1e-5;
  return {
    google: isConfigVenue ? EVENT.venueMaps : `https://www.google.com/maps/search/?api=1&query=${ll}`,
    waze: `https://waze.com/ul?ll=${ll}&navigate=yes`,
    apple: `https://maps.apple.com/?ll=${ll}&q=${q}&daddr=${ll}&dirflg=d`,
    // Android: abre a aplicação de mapas que estiver definida no telemóvel
    phone: `geo:${ll}?q=${ll}(${q})`,
  };
}

export function InviteBody({ token, guest, event, active }: { token: string; guest: PublicGuest; event: PublicEvent; active: boolean }) {
  const root = useRef<HTMLElement>(null);
  const [gown, setGown] = useState(SWATCHES[3]);
  const [copied, setCopied] = useState(false);
  const [os, setOs] = useState<"ios" | "android" | "other">("other");
  const P = guest.plural;

  const timeStr = event.time ?? EVENT.time;
  const time = parseTime(timeStr);
  const target = useMemo(() => {
    const hh = String(time?.h ?? 18).padStart(2, "0");
    const mm = String(time?.m ?? 0).padStart(2, "0");
    return new Date(`${EVENT.dateISO}T${hh}:${mm}:00+01:00`).getTime();
  }, [time?.h, time?.m]);
  const [past, setPast] = useState(false);
  useEffect(() => setPast(Date.now() >= target), [target]);

  useEffect(() => {
    const ua = navigator.userAgent;
    setOs(/Android/i.test(ua) ? "android" : /iPhone|iPad|iPod|Macintosh/.test(ua) && "ontouchend" in document ? "ios" : "other");
  }, []);

  const gcal = useMemo(() => {
    const s = new Date(target);
    const e = new Date(target + 5 * 36e5);
    const f = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const q = new URLSearchParams({
      action: "TEMPLATE",
      text: `Festa de licenciatura da ${EVENT.firstName}`,
      dates: `${f(s)}/${f(e)}`,
      details: `Celebração da licenciatura de ${EVENT.graduate} em ${EVENT.course}. Início às ${EVENT.timeLabel}.
Localização: ${EVENT.venueMaps}`,
      ...(event.address ? { location: event.address } : event.venueName ? { location: `${event.venueName}, ${EVENT.city}` } : {}),
    });
    return `https://calendar.google.com/calendar/render?${q}`;
  }, [target, event.address, event.venueName]);

  // ── movimento (só depois da abertura) ──
  useLayoutEffect(() => {
    if (!active || !root.current) return;
    if (process.env.NODE_ENV !== "production") (window as unknown as { __gsap: typeof gsap }).__gsap = gsap; // testes
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    ScrollTrigger.config({ ignoreMobileResize: true });
    let splits: SplitText[] = [];
    const ticks: ((t: number, d: number) => void)[] = [];
    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(root);
      const vw = () => window.innerWidth;
      const vh = () => window.innerHeight;

      // Capa: entrada coreografada (não depende do scroll)
      const hero = gsap.timeline({ delay: 0.1 });
      hero
        .fromTo(q(".hero-kicker"), { x: -60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.8, ease: "power3.out" }, 0)
        .fromTo(q(".hero-card"), { x: 120, y: 30, rotate: 16, opacity: 0 }, { x: 0, y: 0, rotate: 0, opacity: 1, duration: 1.3, ease: "elastic.out(1, 0.7)" }, 0.15)
        .fromTo(q(".hero-for"), { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: "power3.out" }, 0.55)
        // a máscara sai bem para lá da caixa: o laço e a perna do J ficam inteiros
        .fromTo(q(".hero-name"), { clipPath: "inset(-40% 140% -60% -40%)", y: 20 }, { clipPath: "inset(-40% -20% -60% -40%)", y: 0, duration: 1.6, ease: "power2.inOut" }, 0.7)
        .fromTo(q(".hero-last .ch"), { yPercent: 120, rotate: 12, opacity: 0 }, { yPercent: 0, rotate: 0, opacity: 1, stagger: 0.035, duration: 0.8, ease: "back.out(1.8)" }, 1.4)
        .fromTo(q(".hero-seal"), { scale: 2.6, rotate: -70, opacity: 0 }, { scale: 1, rotate: 0, opacity: 1, duration: 0.6, ease: "power4.in", onComplete: () => sfx.stamp(0.3) }, 1.8)
        .fromTo(q(".scroll-cue"), { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.6 }, 2.4);

      // manchas líquidas da capa (ondulam devagar enquanto a capa está visível)
      const blobs = q(".hero-blob path") as unknown as SVGPathElement[];
      const heroEl = q(".hero")[0] as HTMLElement;
      let heroOn = true;
      const bt = { t: 0 };
      const drawHero = () => {
        const w = heroEl.clientWidth;
        const h = heroEl.clientHeight;
        blobs[0]?.setAttribute("d", blobPath(w * 0.95, h * 0.18, liveRadii(Math.min(w, h) * 0.42, reduced ? 0.6 : 1, bt.t, 1, 9)));
        blobs[1]?.setAttribute("d", blobPath(w * 0.05, h * 0.86, liveRadii(Math.min(w, h) * 0.36, reduced ? 0.6 : 1, bt.t * 1.2, 7, 9)));
      };
      drawHero();
      if (reduced) return;
      const heroTick = (_: number, d: number) => {
        if (!heroOn) return;
        bt.t += d / 1000;
        drawHero();
      };
      gsap.ticker.add(heroTick);
      ticks.push(heroTick);
      ScrollTrigger.create({ trigger: heroEl, start: "top bottom", end: "bottom top", onToggle: (self) => (heroOn = self.isActive) });

      // A capa sai em camadas: o nome sobe mais depressa do que o cartão, o selo roda
      gsap.to(q(".hero-name"), { yPercent: -60, ease: "none", scrollTrigger: { trigger: heroEl, start: "top top", end: "bottom top", scrub: true } });
      gsap.to(q(".hero-card"), { y: -40, rotate: -8, ease: "none", scrollTrigger: { trigger: heroEl, start: "top top", end: "bottom top", scrub: true } });
      gsap.to(q(".hero-seal"), { y: 120, rotate: 140, ease: "none", scrollTrigger: { trigger: heroEl, start: "top top", end: "bottom top", scrub: true } });

      // Entradas e saídas com o scroll, em várias direcções
      q("[data-from]").forEach((el) => {
        const f = FROM[(el as HTMLElement).dataset.from ?? "up"] ?? FROM.up;
        const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 98%", end: "bottom 2%", scrub: 0.8, invalidateOnRefresh: true } });
        tl.fromTo(el, { x: () => f.x * vw(), y: () => f.y * vh(), rotate: f.r, opacity: 0 }, { x: 0, y: 0, rotate: 0, opacity: 1, duration: 0.36, ease: "power3.out" })
          .to(el, { duration: 0.44 })
          .to(el, { x: () => -f.x * vw() * 0.12, y: -28, rotate: -f.r * 0.25, opacity: 0.55, duration: 0.2, ease: "power1.in" });
      });

      // Paralaxe: camadas a velocidades diferentes
      q("[data-speed]").forEach((el) => {
        const sp = Number((el as HTMLElement).dataset.speed);
        gsap.fromTo(el, { y: () => vh() * 0.25 * sp }, { y: () => -vh() * 0.25 * sp, ease: "none", scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true, invalidateOnRefresh: true } });
      });

      // Títulos: tipografia cinética (letras que sobem, rodam ou deslizam)
      q("[data-kin]").forEach((el, i) => {
        const s = new SplitText(el, { type: "words,chars", charsClass: "kc", wordsClass: "kw" });
        splits.push(s);
        const mode = (el as HTMLElement).dataset.kin;
        const from =
          mode === "left"
            ? { xPercent: -140, opacity: 0, rotate: -20 }
            : mode === "right"
              ? { xPercent: 140, opacity: 0, rotate: 20 }
              : mode === "spin"
                ? { rotateX: -90, yPercent: 40, opacity: 0, transformOrigin: "50% 100%" }
                : { yPercent: 120, rotate: i % 2 ? 14 : -14, opacity: 0 };
        gsap.fromTo(s.chars, from, {
          xPercent: 0,
          yPercent: 0,
          rotate: 0,
          rotateX: 0,
          opacity: 1,
          stagger: { each: 0.028, from: mode === "right" ? "end" : "start" },
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 88%", toggleActions: "play none none reverse" },
        });
      });

      // Ondas entre secções: mudam de forma enquanto passam
      q("[data-wave]").forEach((p) => {
        ScrollTrigger.create({ trigger: p.closest("svg"), start: "top bottom", end: "bottom top", scrub: true, onUpdate: (self) => p.setAttribute("d", wavePath(self.progress)) });
      });

      // Personagens a respirar (movimento em repouso)
      for (const sel of [".dress-girl", ".final-girl"]) {
        const g = q(`${sel} [data-root]`)[0] as unknown as SVGGElement | undefined;
        if (!g) continue;
        const p = createPuppet(g);
        const o = { t: 0 };
        gsap.to(o, {
          t: 1,
          duration: 3.2,
          repeat: -1,
          ease: "none",
          onUpdate: () => p.set({ ...IDLE, bob: Math.sin(o.t * Math.PI * 2) * 1.3, head: Math.sin(o.t * Math.PI * 2) * 2, armF: 4 + Math.sin(o.t * Math.PI * 2) * 3, blink: o.t > 0.95 ? 1 : 0, tassel: Math.sin(o.t * Math.PI * 4) * 4 }),
        });
      }
    }, root);

    // os gatilhos foram criados fora da ordem da página (a data cria o seu pin primeiro): ordenar e recalcular
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
    document.fonts?.ready.then(() => {
      ScrollTrigger.sort();
      ScrollTrigger.refresh();
    });
    return () => {
      ticks.forEach((t) => gsap.ticker.remove(t));
      splits.forEach((s) => s.revert());
      splits = [];
      ctx.revert();
    };
  }, [active]);

  const tossCap = () => {
    const cap = document.querySelector<SVGGElement>('.final-girl [data-p="cap"]');
    if (!cap || gsap.isTweening(cap)) return;
    sfx.whoosh(0.35);
    const r = cap.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top, 120, 1.2);
    gsap
      .timeline()
      .to(cap, { y: -260, rotation: 540, duration: 0.75, ease: "power2.out", transformOrigin: "50% 50%" })
      .to(cap, { y: 0, rotation: 720, duration: 0.7, ease: "bounce.out" })
      .call(() => sfx.ribbon(0.3))
      .set(cap, { rotation: 0 });
  };
  const swipe = useRef<number | null>(null);

  const venue = event.venueName ?? EVENT.venueName;
  const links = event.lat != null && event.lng != null ? mapLinks(event.lat, event.lng, venue) : null;
  // iPhone: Apple Maps primeiro. Android: o mapa do telemóvel em vez do Apple Maps.
  const apps = links
    ? os === "ios"
      ? [
          { k: "apple", label: "Apple Maps", href: links.apple },
          { k: "google", label: "Google Maps", href: links.google },
          { k: "waze", label: "Waze", href: links.waze },
        ]
      : [
          { k: "google", label: "Google Maps", href: links.google },
          { k: "waze", label: "Waze", href: links.waze },
          os === "android" ? { k: "phone", label: "Mapa do telemóvel", href: links.phone } : { k: "apple", label: "Apple Maps", href: links.apple },
        ]
    : [];
  // Nome do local numa linha e o link do mapa noutra: colado no WhatsApp, o link fica clicável e mostra o mapa.
  const mapLink = event.lat != null && event.lng != null ? `https://maps.google.com/?q=${event.lat},${event.lng}` : "";
  const copyText = [`${venue}, ${event.address || EVENT.city}`, mapLink].filter(Boolean).join("\n");
  // Táxis (Yango, Heetch): nenhum dos dois publica um link que abra a app já com o destino.
  // Android: abre a app se estiver instalada (senão, a Play Store). iPhone: abre a página da App Store,
  // onde aparece «Abrir» se já estiver instalada. Ao tocar, o nome do local fica copiado para colar em «Para onde?».
  const rideStore = (pkg: string, ios: string) =>
    os === "android"
      ? `intent://#Intent;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;package=${pkg};S.browser_fallback_url=${encodeURIComponent(`https://play.google.com/store/apps/details?id=${pkg}`)};end`
      : os === "ios"
        ? `https://apps.apple.com/app/${ios}`
        : `https://play.google.com/store/apps/details?id=${pkg}`;
  const rides = [
    { k: "yango", label: "Yango", href: rideStore("com.yandex.yango", "id1437157286") },
    { k: "heetch", label: "Heetch", href: rideStore("com.heetch", "id693137280") },
  ];
  const [rideCopied, setRideCopied] = useState(false);
  const copyForRide = () => {
    navigator.clipboard?.writeText(`${venue}, ${event.address || EVENT.city}`).then(
      () => setRideCopied(true),
      () => undefined,
    );
  };

  return (
    <main className="invite" ref={root} aria-hidden={!active}>
      <Confetti />

      {/* 1 · Capa */}
      <section className="hero">
        <svg className="hero-blob" aria-hidden="true">
          <path fill="var(--blue-700)" />
          <path fill="var(--navy-800)" />
        </svg>
        <p className="hero-kicker">Convite · Licenciatura 2026</p>
        <div className="hero-card">
          <p>Com muito carinho, convidamos</p>
          <p className="guest-name">{guest.name}</p>
        </div>
        <p className="hero-for">para celebrar a licenciatura de</p>
        <h1 className="hero-title">
          <span className="hero-name">{EVENT.firstName}</span>
          <span className="hero-last" aria-label={EVENT.lastNames}>
            {EVENT.lastNames.split("").map((c, i) => (
              <span key={i} className="ch" aria-hidden="true">
                {c === " " ? " " : c}
              </span>
            ))}
          </span>
        </h1>
        <div className="hero-seal">
          <UniqueSeal seed={guest.seed} />
          <svg viewBox="-60 -60 120 120" className="hero-seal-ring" aria-hidden="true">
            <defs>
              <path id="ringPath" d="M0,-50 a50,50 0 1,1 -0.1,0" />
            </defs>
            <text fontSize="9" letterSpacing="2.6">
              <textPath href="#ringPath">LUANDA · 28 · 11 · 2026 · {EVENT.time} · LICENCIATURA · </textPath>
            </text>
          </svg>
        </div>
        {/* No telemóvel o dedo sobe: mostramos o gesto (ponto a subir), não uma seta para baixo */}
        <p className="scroll-cue">
          <span className="cue-touch">
            <span className="cue-swipe" aria-hidden="true">
              <i />
            </span>
            Desliza para cima
          </span>
          <span className="cue-mouse">
            Continua <span className="cue-arrow" aria-hidden="true">↓</span>
          </span>
        </p>
        <Wave fill="var(--navy-900)" />
      </section>

      {/* 2 · A data (revelação com o scroll) */}
      <section className="when">
        <DateReveal active={active} />
        <div className="when-after">
          {!past && <Countdown target={target} />}
          <div className="cal-actions" data-from="up">
            <a className="btn btn-light" href={gcal} target="_blank" rel="noopener noreferrer">
              Google Calendar
            </a>
            <a className="btn btn-outline-light" href={`/c/${token}/calendario`}>
              Calendário do telemóvel
            </a>
          </div>
        </div>
        <Wave fill="var(--white)" />
      </section>

      {/* 3 · Dress code */}
      {event.dressCode && (
        <section className="dress">
          <span className="shape shape-c" data-speed="1.2" aria-hidden="true" />
          <p className="kicker" data-from="right">
            Dress code obrigatório
          </p>
          <h2 className="sec-title" data-kin="right">
            Só tons de café
          </h2>
          <div className="dress-rule" data-from="left">
            <p className="dress-rule-big">
              Na festa, só se pode vir vestido com <b>estas cores</b>.
            </p>
            <p className="dress-rule-small">
              {P ? "Escolham" : "Escolhe"} uma delas ou {P ? "combinem" : "combina"} várias: baunilha, caramelo, amêndoa, café, moca ou espresso.
              {" "}Outras cores ficam para outra ocasião.
            </p>
          </div>
          <div className="dress-stage">
            <div data-from="dl">
              <CharacterSvg className="dress-girl" gown={gown.hex} />
            </div>
            <div className="swatches" role="radiogroup" aria-label="Cores do dress code" data-from="dr">
              {SWATCHES.map((s, i) => (
                <button
                  key={s.hex}
                  role="radio"
                  aria-checked={gown.hex === s.hex}
                  className={gown.hex === s.hex ? "sw on" : "sw"}
                  style={{ "--c": s.hex, "--i": i } as React.CSSProperties}
                  onClick={() => (setGown(s), sfx.ribbon(0.22))}
                >
                  <span className="sw-chip" />
                  <span className="sw-name">{s.name}</span>
                  <span className="sw-hex">{s.hex.toUpperCase()}</span>
                </button>
              ))}
            </div>
          </div>
          <p className="dress-tip" data-from="up">
            Toca numa cor para ver a Juceline vestida com ela.
          </p>
          <Wave fill="var(--blue-700)" />
        </section>
      )}

      {/* 4 · Local */}
      <section className="where">
        <span className="shape shape-d" data-speed="-1" aria-hidden="true" />
        <p className="kicker" data-from="left">
          Onde · {EVENT.city}
        </p>
        <h2 className="sec-title" data-kin="spin">
          Local da festa
        </h2>
        <p className="where-venue" data-from="right">
          {venue}
        </p>
        {links ? (
          <>
            <div data-from="dl">
              <VenueMap lat={event.lat!} lng={event.lng!} name={venue} area={EVENT.city} />
            </div>
            <div className="where-info">
              {event.address && <p className="where-addr">{event.address}</p>}
              <p className="where-lead">Escolhe a tua aplicação: o percurso começa onde estiveres.</p>
              <div className="apps">
                {apps.map((a) => (
                  <a key={a.k} className={`app app-${a.k}`} href={a.href} {...(a.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                    {a.k === "phone" ? (
                      <span className="app-ico" aria-hidden="true" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="app-logo" src={`/maps/${a.k}.png`} alt="" width={30} height={30} aria-hidden="true" />
                    )}
                    {a.label}
                  </a>
                ))}
              </div>
              <p className="where-help">Se a aplicação não estiver instalada, abre a versão no browser.</p>
              <p className="where-lead where-ride">Ou pede um carro:</p>
              <div className="apps apps-ride">
                {rides.map((a) => (
                  <a key={a.k} className={`app app-${a.k}`} href={a.href} onClick={copyForRide} {...(a.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="app-logo" src={`/maps/${a.k}.png`} alt="" width={30} height={30} aria-hidden="true" />
                    {a.label}
                  </a>
                ))}
              </div>
              <p className="where-help" aria-live="polite">
                {rideCopied ? (
                  <>
                    <b>Nome do local copiado.</b> Na aplicação, cola-o em «Para onde?».
                  </>
                ) : (
                  "Ao tocar, o nome do local fica copiado para colares no destino."
                )}
              </p>
              <button
                className={copied ? "cta-nudge light done" : "cta-nudge light"}
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(copyText);
                    setCopied(true);
                    sfx.tick(0.3);
                  } catch {}
                }}
              >
                <span className="cta-ring" aria-hidden="true" />
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  {copied ? (
                    <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                  ) : (
                    <path d="M9 9h10v10H9zM5 15V5h10" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
                  )}
                </svg>
                {copied ? "Morada copiada" : "Copiar morada"}
              </button>
            </div>
          </>
        ) : (
          <p className="where-lead">A localização vai aparecer aqui em breve.</p>
        )}
        <Wave fill="var(--blue-50)" />
      </section>

      {/* 5 · RSVP */}
      <section className="reply">
        <span className="shape shape-e" data-speed="0.9" aria-hidden="true" />
        <p className="kicker" data-from="right">
          Confirmação de presença
        </p>
        <h2 className="sec-title" data-kin="left">
          {P ? "Vêm celebrar connosco?" : "Vens celebrar connosco?"}
        </h2>
        <div className="reply-card" data-from="up">
          <Rsvp token={token} initial={guest} />
        </div>
        <Wave fill="var(--navy-950)" />
      </section>

      {/* 6 · Final */}
      <section
        className="final"
        onPointerDown={(e) => (swipe.current = e.clientY)}
        onPointerUp={(e) => {
          if (swipe.current != null && swipe.current - e.clientY > 50) tossCap();
          swipe.current = null;
        }}
      >
        <h2 className="sec-title" data-kin="spin">
          {P ? "Contamos convosco!" : "Contamos contigo!"}
        </h2>
        <p className="final-when" data-from="up">
          Sábado, 28 de Novembro · {EVENT.timeLabel}
        </p>
        <div className="final-stage" data-from="up">
          <CharacterSvg className="final-girl" />
        </div>
        <button className="btn btn-light" onClick={tossCap}>
          Atira o capelo ao ar
        </button>
        <p className="final-tip">ou desliza o dedo para cima</p>
        <InstallApp plural={P} />
        <p className="sign">
          Com carinho, <span className="sign-name">{EVENT.firstName}</span> e família
        </p>
        <footer className="foot">
          <p>Convite pessoal para {guest.name}. Por favor, não partilhes este link.</p>
          <p className="credit">
            Feito por <span>Willfredy Vieira Dias</span>
          </p>
        </footer>
      </section>
    </main>
  );
}
