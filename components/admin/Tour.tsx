"use client";
// Tutorial guiado do painel: balões que apontam para cada opção, um passo de cada vez.
// Aparece sozinho na primeira entrada; depois pode ser revisto no botão "Tutorial".
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

export type TourStep = { target?: string; title: string; text: string; before?: () => void };

const KEY = "jvd:admin-tutorial";

export function tourSeen(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return true;
  }
}

export function Tour({ steps, onClose }: { steps: TourStep[]; onClose: () => void }) {
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const step = steps[i];

  const finish = useCallback(() => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {}
    onClose();
  }, [onClose]);

  const measure = useCallback(() => {
    const el = step.target ? document.querySelector<HTMLElement>(step.target) : null;
    setRect(el ? el.getBoundingClientRect() : null);
  }, [step]);

  useLayoutEffect(() => {
    step.before?.();
    // espera que a página mude (separadores) antes de medir
    let t2 = 0;
    const t = window.setTimeout(() => {
      const el = step.target ? document.querySelector<HTMLElement>(step.target) : null;
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
      t2 = window.setTimeout(() => {
        // se o deslizar suave não aconteceu (alguns telemóveis), salta de uma vez
        const r = el?.getBoundingClientRect();
        if (el && r && (r.bottom < 0 || r.top > window.innerHeight)) el.scrollIntoView({ block: "center" });
        measure();
      }, 420);
    }, 60);
    return () => {
      window.clearTimeout(t);
      window.clearTimeout(t2);
    };
  }, [step, measure]);

  // altura real do balão, para nunca o pôr fora do ecrã (telemóvel deitado)
  const tipRef = useRef<HTMLDivElement>(null);
  const [tipH, setTipH] = useState(260);
  useLayoutEffect(() => {
    const h = tipRef.current?.offsetHeight;
    if (h && Math.abs(h - tipH) > 2) setTipH(h);
  });

  useEffect(() => {
    const on = () => measure();
    window.addEventListener("resize", on);
    window.addEventListener("scroll", on, { passive: true });
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
      if (e.key === "ArrowRight") setI((v) => Math.min(steps.length - 1, v + 1));
      if (e.key === "ArrowLeft") setI((v) => Math.max(0, v - 1));
    };
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("resize", on);
      window.removeEventListener("scroll", on);
      window.removeEventListener("keydown", key);
    };
  }, [measure, finish, steps.length]);

  const pad = 8;
  const vw = typeof window !== "undefined" ? window.innerWidth : 400;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const W = Math.min(340, vw - 32);
  const gap = pad + 14;
  const edge = 12;
  let pos: React.CSSProperties = { left: (vw - W) / 2, top: Math.max(edge, (vh - tipH) / 2), width: W };
  let arrow: "up" | "down" | null = null;
  if (rect) {
    const left = Math.max(16, Math.min(vw - W - 16, rect.left + rect.width / 2 - W / 2));
    const roomBelow = vh - rect.bottom - gap - edge;
    const roomAbove = rect.top - gap - edge;
    if (roomBelow >= tipH || (roomBelow >= roomAbove && roomAbove < tipH)) {
      // por baixo do alvo; se não couber, encosta ao fundo do ecrã (por cima do alvo)
      const top = Math.max(edge, Math.min(rect.bottom + gap, vh - tipH - edge));
      pos = { left, top, width: W };
      arrow = top === rect.bottom + gap ? "up" : null;
    } else {
      const top = Math.max(edge, rect.top - gap - tipH);
      pos = { left, top, width: W };
      arrow = top === rect.top - gap - tipH ? "down" : null;
    }
  }
  const arrowX = rect ? Math.max(20, Math.min(W - 20, rect.left + rect.width / 2 - (pos.left as number))) : 0;
  const last = i === steps.length - 1;

  return (
    <div className="tour" role="dialog" aria-modal="true" aria-labelledby="tour-t">
      {rect ? (
        <div className="tour-spot" style={{ left: rect.left - pad, top: rect.top - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }} />
      ) : (
        <div className="tour-dim" />
      )}
      <div ref={tipRef} className={`tour-tip ${arrow ?? "center"}`} style={pos} key={i}>
        {arrow && <span className="tour-arrow" style={{ left: arrowX }} aria-hidden="true" />}
        <p className="tour-count">
          {i + 1} de {steps.length}
        </p>
        <h3 id="tour-t">{step.title}</h3>
        <p className="tour-text">{step.text}</p>
        <div className="tour-actions">
          <button className="tour-skip" onClick={finish}>
            {last ? "" : "Saltar"}
          </button>
          <div>
            {i > 0 && (
              <button className="adm-btn adm-btn-ghost" onClick={() => setI(i - 1)}>
                Anterior
              </button>
            )}
            <button className="adm-btn adm-btn-primary" onClick={() => (last ? finish() : setI(i + 1))}>
              {last ? "Começar" : "Seguinte"}
            </button>
          </div>
        </div>
        <div className="tour-dots" aria-hidden="true">
          {steps.map((_, k) => (
            <span key={k} className={k === i ? "on" : k < i ? "done" : ""} />
          ))}
        </div>
      </div>
    </div>
  );
}
