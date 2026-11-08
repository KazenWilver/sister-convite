"use client";
// A data revela-se com o scroll: algarismos enormes entram de lados diferentes
// (o 28 da esquerda, o 11 da direita, o 2026 na diagonal, as letras de "Sábado" a cair),
// atravessam o ecrã e encaixam na data final. No fim fica tudo parado e legível, com a hora 18:00.
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useLayoutEffect, useRef } from "react";
import { EVENT } from "@/lib/config";
import * as sfx from "@/lib/sound";
import { blobPath, liveRadii } from "../shared/liquid";

gsap.registerPlugin(ScrollTrigger, SplitText);

export function DateReveal({ active }: { active: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const blob = useRef<SVGPathElement>(null);

  useLayoutEffect(() => {
    if (!active || !root.current) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = root.current;
    const q = gsap.utils.selector(el);
    const drawBlob = (p: number) => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      blob.current?.setAttribute("d", blobPath(w * (0.15 + 0.55 * p), h * (0.62 - 0.2 * p), liveRadii(Math.min(w, h) * (0.25 + 0.35 * p), 1.4 - p, p * 9, 5, 9)));
    };
    if (reduced) {
      drawBlob(1);
      return;
    }
    let split: SplitText | null = null;
    const ctx = gsap.context(() => {
      split = new SplitText(q(".d-week"), { type: "chars", charsClass: "d-ch" });
      const vw = () => window.innerWidth;
      const vh = () => window.innerHeight;
      let locked = false;
      const lock = gsap
        .timeline({ paused: true })
        .fromTo(q(".d-rule"), { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: "power3.out" }, 0)
        .fromTo(q(".d-time"), { scale: 0.4, rotate: -24, opacity: 0 }, { scale: 1, rotate: -4, opacity: 1, duration: 0.9, ease: "elastic.out(1, 0.55)" }, 0.1)
        .fromTo(q(".d-stage"), { scale: 1.035 }, { scale: 1, duration: 0.6, ease: "elastic.out(1, 0.4)" }, 0);

      // A secção fica presa enquanto a data encaixa…
      ScrollTrigger.create({
        trigger: el,
        start: "top top",
        end: () => `+=${Math.round(vh() * 1.2)}`,
        pin: true,
        pinSpacing: true, // o pai é flex: sem isto o GSAP não reserva o espaço
        invalidateOnRefresh: true,
      });
      // …mas a animação começa antes: logo que a secção espreita por baixo do balancete
      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        scrollTrigger: {
          trigger: el,
          start: "top 92%",
          end: () => `top+=${Math.round(vh() * 1.2)} top`,
          scrub: 0.7,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            drawBlob(self.progress);
            if (self.progress > 0.78 && !locked) {
              locked = true;
              lock.play(0);
              sfx.settle();
            } else if (self.progress < 0.6 && locked) {
              locked = false;
              lock.reverse();
            }
          },
        },
      });
      tl.from(q(".d-day"), { x: () => -vw() * 1.2, rotate: -28, scale: 1.7, duration: 0.45 }, 0)
        .from(q(".d-month"), { x: () => vw() * 1.2, rotate: 24, scale: 1.7, duration: 0.45 }, 0.1)
        .from(q(".d-year"), { x: () => -vw() * 0.7, y: () => vh() * 0.7, rotate: -16, duration: 0.45 }, 0.22)
        .from(q(".d-mname"), { x: () => vw() * 0.8, y: () => -vh() * 0.5, rotate: 12, duration: 0.42 }, 0.28)
        .from(split!.chars, { y: () => -vh() * 0.7, rotate: () => gsap.utils.random(-70, 70), opacity: 0, stagger: 0.03, duration: 0.35 }, 0.32)
        .from(q(".d-kicker"), { x: () => -vw() * 0.4, opacity: 0, duration: 0.3 }, 0)
        .to({}, { duration: 0.25 }); // pausa final: a data fica parada e legível
    }, el);
    return () => {
      split?.revert();
      ctx.revert();
    };
  }, [active]);

  return (
    <div className="d-wrap" ref={root}>
      <svg className="d-liquid" aria-hidden="true">
        <path ref={blob} fill="var(--blue-700)" />
      </svg>
      <p className="d-kicker">Guarda a data</p>
      <h2 className="sr-only">
        {EVENT.dateLabel}, às {EVENT.timeLabel}
      </h2>
      <div className="d-stage" aria-hidden="true">
        <span className="d-week">Sábado</span>
        <span className="d-day">28</span>
        <span className="d-month">11</span>
        <span className="d-mname">Novembro</span>
        <span className="d-year">2026</span>
        <span className="d-rule" />
        <span className="d-time">
          <strong>{EVENT.time}</strong>
          <small>6:00 PM · início da festa</small>
        </span>
      </div>
    </div>
  );
}
