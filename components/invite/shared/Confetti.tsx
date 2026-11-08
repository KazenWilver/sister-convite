"use client";
import { useEffect, useRef } from "react";

// Confettis em canvas (um só, fixo, por cima de tudo). Chamar burst(x, y) em coordenadas do ecrã.
type P = { x: number; y: number; vx: number; vy: number; r: number; vr: number; s: number; c: string; k: number; life: number };
const COLORS = ["#ffffff", "#d6e8fb", "#8dbcf2", "#4f8fe6", "#1f5fbf", "#12336b", "#0b1220"];
let emit: ((x: number, y: number, n?: number, spread?: number) => void) | null = null;

export function burst(x: number, y: number, n = 90, spread = 1) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  emit?.(x, y, n, spread);
}

export function Confetti() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current!;
    const ctx = cv.getContext("2d")!;
    let parts: P[] = [];
    let raf = 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const size = () => {
      cv.width = innerWidth * dpr;
      cv.height = innerHeight * dpr;
    };
    size();
    window.addEventListener("resize", size);
    const loop = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      parts = parts.filter((p) => p.life > 0 && p.y < innerHeight + 40);
      for (const p of parts) {
        p.vy += 0.16;
        p.vx *= 0.985;
        p.vy *= 0.985;
        p.x += p.vx;
        p.y += p.vy;
        p.r += p.vr;
        p.life -= 1;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.globalAlpha = Math.min(1, p.life / 40);
        ctx.fillStyle = p.c;
        if (p.k === 0) ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
        else {
          ctx.beginPath();
          ctx.arc(0, 0, p.s / 3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      raf = parts.length ? requestAnimationFrame(loop) : 0;
    };
    emit = (x, y, n = 90, spread = 1) => {
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1 * spread;
        const v = 5 + Math.random() * 9;
        parts.push({
          x,
          y,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v,
          r: Math.random() * 6,
          vr: (Math.random() - 0.5) * 0.3,
          s: 6 + Math.random() * 8,
          c: COLORS[(Math.random() * COLORS.length) | 0],
          k: Math.random() > 0.35 ? 0 : 1,
          life: 140 + Math.random() * 80,
        });
      }
      if (!raf) raf = requestAnimationFrame(loop);
    };
    return () => {
      emit = null;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", size);
    };
  }, []);
  return <canvas ref={ref} className="confetti" aria-hidden="true" />;
}
