"use client";
// Tutorial guiado do painel: balões que apontam para cada opção, um passo de cada vez.
// Aparece sozinho na primeira entrada; depois pode ser revisto no botão "Tutorial".
import { useCallback, useEffect, useLayoutEffect, useState } from "react";

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
    const t = window.setTimeout(() => {
      const el = step.target ? document.querySelector<HTMLElement>(step.target) : null;
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
      window.setTimeout(measure, 380);
    }, 60);
    return () => window.clearTimeout(t);
  }, [step, measure]);

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
  let pos: React.CSSProperties = { left: (vw - W) / 2, top: vh / 2 - 120, width: W };
  let arrow: "up" | "down" | null = null;
  if (rect) {
    const left = Math.max(16, Math.min(vw - W - 16, rect.left + rect.width / 2 - W / 2));
    const below = rect.bottom + 16 + 200 < vh || rect.top < vh / 2;
    pos = below ? { left, top: rect.bottom + pad + 14, width: W } : { left, bottom: vh - rect.top + pad + 14, width: W };
    arrow = below ? "up" : "down";
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
      <div className={`tour-tip ${arrow ?? "center"}`} style={pos} key={i}>
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
