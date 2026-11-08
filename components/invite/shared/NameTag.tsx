"use client";
// Etiqueta "Juceline" com uma seta desenhada à mão a apontar para a cabeça da personagem.
// Coordenadas locais da personagem: os pés em (0,0) e o topo do capelo em y ≈ -300.
// Aparece quando ela entra a correr e desaparece antes de tropeçar (ver nameTagIn / nameTagOut).
import gsap from "gsap";

export function NameTag({ color = "#0a1f44" }: { color?: string }) {
  return (
    <g data-nametag opacity={0} aria-hidden="true">
      {/* centrado por cima da cabeça: cabe em telemóveis estreitos */}
      <text data-nt-text x={-6} y={-396} textAnchor="middle" fill={color} fontSize={72} style={{ fontFamily: "var(--font-script), cursive" }}>
        Juceline
      </text>
      <path data-nt-arrow d="M72,-378 C82,-342 56,-312 20,-304" fill="none" stroke={color} strokeWidth={4} strokeLinecap="round" />
      <path data-nt-head d="M33,-317 L18,-304 L35,-297" fill="none" stroke={color} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

// aceita a própria etiqueta ou um elemento que a contenha
const pick = (el: Element | null) => (el?.matches("[data-nametag]") ? el : (el?.querySelector("[data-nametag]") ?? null));

/** Mostra a etiqueta: o nome sobe e a seta desenha-se até à cabeça. */
export function nameTagIn(el: Element | null) {
  const root = pick(el);
  if (!root) return;
  const arrow = root.querySelector<SVGPathElement>("[data-nt-arrow]");
  const len = arrow?.getTotalLength() ?? 100;
  const tl = gsap.timeline();
  tl.set(root, { opacity: 1 })
    .fromTo(root.querySelector("[data-nt-text]"), { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: "power3.out" }, 0)
    .fromTo(arrow, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 0.4, ease: "power2.inOut" }, 0.15)
    .fromTo(root.querySelector("[data-nt-head]"), { opacity: 0, scale: 0.4, svgOrigin: "18 -304" }, { opacity: 1, scale: 1, duration: 0.25, ease: "back.out(2.5)" }, 0.5);
  return tl;
}

/** Esconde a etiqueta, a subir ligeiramente. */
export function nameTagOut(el: Element | null) {
  const root = pick(el);
  if (!root) return;
  return gsap.to(root, { opacity: 0, y: -14, duration: 0.3, ease: "power2.in" });
}
