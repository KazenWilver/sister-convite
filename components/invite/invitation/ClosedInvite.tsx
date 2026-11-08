"use client";
// O convite fechado: cartão em duas portas, preso por uma fita com laço.
// Nasce do canudo numa mancha líquida; o convidado agarra o laço e puxa-o para baixo (rato ou dedo).
// Se largar cedo, a fita volta ao sítio com mola; se puxar o suficiente, a fita cai e as portas abrem.
import gsap from "gsap";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { EVENT } from "@/lib/config";
import * as sfx from "@/lib/sound";
import { blobPath, liveRadii } from "../shared/liquid";
import "./closed.css";

function Bow() {
  return (
    <svg viewBox="-60 -40 120 90" className="bow-svg" aria-hidden="true">
      <path d="M-4,-2 L-30,46 L-18,42 L-12,52 L4,0 Z" fill="#12336b" />
      <path d="M4,-2 L28,46 L16,42 L10,52 L-4,0 Z" fill="#1b4fa0" />
      <path d="M0,-4 C-26,-40 -58,-26 -48,-4 C-40,12 -16,6 0,-4 Z" fill="#1f5fbf" />
      <path d="M0,-4 C26,-40 58,-26 48,-4 C40,12 16,6 0,-4 Z" fill="#1b4fa0" />
      <path d="M-6,-8 C-22,-28 -42,-22 -40,-8" stroke="#8dbcf2" strokeWidth={2.4} fill="none" strokeLinecap="round" />
      <path d="M6,-8 C22,-28 42,-22 40,-8" stroke="#4f8fe6" strokeWidth={2.4} fill="none" strokeLinecap="round" />
      <rect x={-9} y={-13} width={18} height={18} rx={6} fill="#12336b" />
      <rect x={-5} y={-10} width={4} height={12} rx={2} fill="#8dbcf2" opacity={0.7} />
    </svg>
  );
}

function Front({ guestName }: { guestName: string }) {
  return (
    <div className="ci-art">
      <p className="ci-for">Para</p>
      <p className="ci-guest">{guestName}</p>
      <p className="ci-name">{EVENT.firstName}</p>
      <p className="ci-date">28 · 11 · 2026</p>
    </div>
  );
}

export function ClosedInvite({ guestName, plural, origin, reduced, onOpen }: { guestName: string; plural: boolean; origin: { x: number; y: number }; reduced: boolean; onOpen: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const blob = useRef<SVGPathElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const ribbon = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const api = useRef<{ drag: (dx: number, dy: number) => void; release: (dy: number, vy: number) => void; open: () => void; nudge: () => void } | null>(null);

  useLayoutEffect(() => {
    const el = root.current!;
    const q = gsap.utils.selector(el);
    const panels = q(".ci-panel");
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cover = Math.hypot(Math.max(origin.x, vw - origin.x), Math.max(origin.y, vh - origin.y)) * 1.15;
    const liq = { r: 0, wob: 1, t: 0 };
    const drawBlob = () => blob.current?.setAttribute("d", blobPath(origin.x, origin.y, liveRadii(liq.r, liq.wob, liq.t, 3, 9)));
    const liqTick = (_: number, dt: number) => {
      liq.t += dt / 1000;
      drawBlob();
    };

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ onComplete: () => setReady(true) });
      if (reduced) {
        liq.r = cover;
        drawBlob();
        tl.fromTo(card.current, { opacity: 0 }, { opacity: 1, duration: 0.4 });
        return;
      }
      gsap.ticker.add(liqTick);
      tl.to(liq, { r: cover, duration: 1.1, ease: "power3.inOut" }, 0)
        .to(liq, { wob: 0.15, duration: 1.4, ease: "power2.out" }, 0.4)
        .call(() => gsap.ticker.remove(liqTick), [], 1.5)
        .fromTo(card.current, { y: 140, rotate: -14, scale: 0.7, opacity: 0 }, { y: 0, rotate: -3, scale: 1, opacity: 1, duration: 1.3, ease: "elastic.out(1, 0.62)" }, 0.55)
        .fromTo(ribbon.current, { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: "power3.out" }, 0.95)
        .fromTo(q(".ci-bow"), { scale: 0, rotate: -40 }, { scale: 1, rotate: 0, duration: 0.8, ease: "back.out(2.4)" }, 1.15)
        .fromTo(q(".ci-art > *"), { y: 22, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.08, duration: 0.6, ease: "power3.out" }, 1.0)
        .fromTo(q(".ci-hint"), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5 }, 1.6)
        .call(() => sfx.unfold(0.22), [], 0.6).call(() => sfx.ribbon(0.25), [], 0.95);
    }, el);

    // movimento em repouso: o cartão respira e o laço dá um puxão de vez em quando
    const idle = reduced ? null : gsap.to(card.current, { rotate: -2, y: -4, duration: 2.6, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 2.6 });
    const nudgeLoop = reduced
      ? null
      : gsap.timeline({ repeat: -1, repeatDelay: 2.4, delay: 3 }).to(ribbon.current, { y: 16, duration: 0.35, ease: "power2.out" }).to(ribbon.current, { y: 0, duration: 0.9, ease: "elastic.out(1, 0.3)" });

    let opened = false;
    let pullMax = 0;
    const setPull = (y: number, rot: number) => {
      gsap.set(ribbon.current, { y, rotate: rot });
      const p = Math.min(1, Math.max(0, y) / pullMax);
      gsap.set(panels[0], { rotateY: -p * 16 });
      gsap.set(panels[1], { rotateY: p * 16 });
    };

    function open() {
      if (opened) return;
      opened = true;
      nudgeLoop?.kill();
      idle?.kill();
      sfx.ribbon(0.45);
      const t = gsap.timeline({ onComplete: onOpen });
      t.to(ribbon.current, { y: vh, rotate: 9, duration: reduced ? 0.2 : 0.75, ease: "power2.in" }, 0)
        .to(card.current, { rotate: 0, y: 0, duration: 0.6, ease: "power3.out" }, 0)
        .to(panels[0], { rotateY: -172, duration: reduced ? 0.3 : 1.25, ease: "power3.inOut" }, 0.15)
        .to(panels[1], { rotateY: 172, duration: reduced ? 0.3 : 1.25, ease: "power3.inOut" }, 0.25)
        .call(() => sfx.unfold(0.4), [], 0.2).call(() => sfx.toast(0.3), [], 0.75)
        .fromTo(q(".ci-inside > *"), { y: 30, opacity: 0, rotate: 4 }, { y: 0, opacity: 1, rotate: 0, stagger: 0.12, duration: 0.8, ease: "power3.out" }, 0.55)
        .to(card.current, { scale: reduced ? 1 : 4.2, opacity: 0, duration: reduced ? 0.3 : 0.9, ease: "power3.in" }, reduced ? 0.6 : 1.9)
        .to(el, { opacity: 0, duration: 0.45, ease: "power1.out" }, reduced ? 0.8 : 2.45);
    }

    api.current = {
      drag(dx, dy) {
        if (opened) return;
        nudgeLoop?.pause(0);
        pullMax = (card.current?.offsetHeight ?? 400) * 0.5;
        // elástico: cede depressa no início e cada vez menos à medida que se puxa
        const y = dy > 0 ? pullMax * 1.4 * (1 - Math.exp(-dy / (pullMax * 1.4))) : dy * 0.15;
        setPull(y, Math.max(-10, Math.min(10, dx * 0.06)));
      },
      release(dy, vy) {
        if (opened) return;
        const y = Number(gsap.getProperty(ribbon.current, "y"));
        if (y > pullMax * 0.42 || (vy > 0.9 && dy > 30)) {
          open();
          return;
        }
        gsap.to(ribbon.current, { y: 0, rotate: 0, duration: 1.1, ease: "elastic.out(1, 0.32)" });
        gsap.to(panels, { rotateY: 0, duration: 1.1, ease: "elastic.out(1, 0.4)" });
        nudgeLoop?.restart(true);
      },
      open,
      nudge() {
        gsap.timeline().to(ribbon.current, { y: 28, duration: 0.25, ease: "power2.out" }).to(ribbon.current, { y: 0, duration: 1, ease: "elastic.out(1, 0.3)" });
      },
    };

    return () => {
      gsap.ticker.remove(liqTick);
      ctx.revert();
      idle?.kill();
      nudgeLoop?.kill();
    };
  }, [origin.x, origin.y, reduced, onOpen]);

  // gesto: agarrar o laço e puxar para baixo
  const drag = useRef<{ x: number; y: number; t: number; vy: number; ly: number; lt: number; moved: boolean } | null>(null);
  const down = (e: React.PointerEvent) => {
    if (!ready) return;
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
    const now = performance.now();
    drag.current = { x: e.clientX, y: e.clientY, t: now, vy: 0, ly: e.clientY, lt: now, moved: false };
    sfx.unlockAudio();
  };
  const move = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const now = performance.now();
    d.vy = (e.clientY - d.ly) / Math.max(1, now - d.lt);
    d.ly = e.clientY;
    d.lt = now;
    if (Math.abs(e.clientY - d.y) > 4) d.moved = true;
    api.current?.drag(e.clientX - d.x, e.clientY - d.y);
  };
  const up = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (!d.moved) api.current?.nudge();
    else api.current?.release(e.clientY - d.y, d.vy);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (ready && (e.key === "Enter" || e.key === " ")) api.current?.open();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ready]);

  return (
    <div className="ci" ref={root}>
      <svg className="ci-liquid" aria-hidden="true">
        <path ref={blob} fill="var(--navy-900)" />
      </svg>
      <div className="ci-stage">
        <div className="ci-card" ref={card}>
          <div className="ci-inside">
            <p className="ci-in-kicker">{plural ? "Estão convidados" : "Estás convidado"}</p>
            <p className="ci-in-name">{EVENT.firstName}</p>
            <p className="ci-in-date">28 · 11 · 2026 · {EVENT.time}</p>
          </div>
          <div className="ci-panel ci-l">
            <div className="ci-face">
              <Front guestName={guestName} />
            </div>
            <div className="ci-back" />
          </div>
          <div className="ci-panel ci-r">
            <div className="ci-face">
              <Front guestName={guestName} />
            </div>
            <div className="ci-back" />
          </div>
          <div className="ci-ribbon" ref={ribbon}>
            <div className="ci-band" />
            <div className="ci-bow" role="button" tabIndex={0} aria-label="Puxa o laço para baixo para abrir o convite" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
              <Bow />
            </div>
          </div>
        </div>
        <p className="ci-hint" aria-live="polite">
          Agarra o laço e puxa-o para baixo
          <span className="ci-arrow" aria-hidden="true">
            ↓
          </span>
        </p>
      </div>
    </div>
  );
}
