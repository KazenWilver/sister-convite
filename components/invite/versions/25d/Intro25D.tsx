"use client";
// Versão 2.5D: a mesma história da 2D, mas num palco em camadas.
// - Cada plano (céu, cidade ao longe, cidade perto, palmeiras, passeio, estrada, candeeiros à frente)
//   move-se a uma velocidade diferente quando a câmara acompanha a Juceline (paralaxe).
// - Os prédios têm frente, lado e telhado (volume), há neblina ao longe, sombras suaves e desfocadas,
//   e os candeeiros mais próximos passam à frente da câmara, escuros e rápidos (sem desfoque: poupa o telemóvel).
// - Depois da queda, a câmara abranda, centra o canudo e aproxima-se um pouco.
import gsap from "gsap";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as sfx from "@/lib/sound";
import { Canudo } from "../../shared/Canudo";
import { Character, createPuppet, IDLE, JUMP, mixPose, runPose } from "../../shared/Character";
import { NameTag, nameTagIn, nameTagOut } from "../../shared/NameTag";
import { bounceTrack, rollEase } from "../../shared/tube";
import type { IntroProps } from "../types";
import "./intro25d.css";

const GROUND = 860; // linha dos pés e do canudo
const WALL = 772; // topo do muro do passeio (horizonte da cidade)
const S = 1.05;
const TUBE_S = 0.72;
const TUBE_R = 15 * TUBE_S;
const ENTRY_PACE = 0.62;
const SPAN: [number, number] = [-1400, 3800]; // largura do mundo desenhado

// Velocidade de cada plano em relação à câmara (1 = estrada; <1 ao longe; >1 à frente)
const F = { sun: 0.04, clouds: 0.12, far: 0.24, mid: 0.5, palms: 0.78, road: 1, front: 1.45 };

function rng(seed: number) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

type Bld = { x: number; w: number; h: number };
function city(seed: number, minW: number, maxW: number, minH: number, maxH: number, gap: number): Bld[] {
  const r = rng(seed);
  const out: Bld[] = [];
  for (let x = SPAN[0]; x < SPAN[1]; ) {
    const w = minW + r() * (maxW - minW);
    out.push({ x, w, h: minH + r() * (maxH - minH) });
    x += w + gap * r();
  }
  return out;
}

/** Prédio com volume: frente, lado (mais escuro) e telhado (mais claro). */
function Block({ b, base, d, front, side, roof, windows }: { b: Bld; base: number; d: number; front: string; side: string; roof: string; windows?: string }) {
  const top = base - b.h;
  const dy = d * 0.55;
  return (
    <g>
      <path d={`M${b.x + b.w},${top} l${d},${-dy} V${base - dy} l${-d},${dy} Z`} fill={side} />
      <path d={`M${b.x},${top} l${d},${-dy} h${b.w} l${-d},${dy} Z`} fill={roof} />
      <rect x={b.x} y={top} width={b.w} height={b.h} fill={front} />
      {windows &&
        Array.from({ length: Math.floor((b.h - 30) / 38) }, (_, i) => (
          <rect key={i} x={b.x + 12} y={top + 22 + i * 38} width={b.w - 24} height={7} rx={2} fill={windows} opacity={0.55} />
        ))}
    </g>
  );
}

function Palm({ x, s = 1 }: { x: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${WALL - 2}) scale(${s})`}>
      <path d="M-5,0 Q-2,-120 10,-210 L18,-208 Q8,-120 7,0 Z" fill="#12336b" />
      <path d="M13,-212 Q-40,-240 -86,-196 Q-36,-222 13,-204 Z M14,-212 Q70,-246 112,-190 Q62,-226 15,-204 Z M13,-214 Q-10,-268 -56,-280 Q-6,-256 10,-206 Z M15,-214 Q48,-270 92,-262 Q44,-252 17,-206 Z" fill="#1b4fa0" />
      <path d="M14,-212 Q70,-246 112,-190 Q62,-226 15,-204 Z M15,-214 Q48,-270 92,-262 Q44,-252 17,-206 Z" fill="#12336b" />
    </g>
  );
}

function Lamp({ x }: { x: number }) {
  return (
    <g data-lamp={x} transform={`translate(${x} 0)`} fill="#050d1f">
      <rect x={-9} y={330} width={18} height={720} rx={6} />
      <path d="M0,340 Q0,290 60,286 L64,300 Q14,304 14,340 Z" />
      <rect x={52} y={292} width={44} height={16} rx={8} />
    </g>
  );
}

export function Intro25D({ reduced, onRest }: IntroProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const scene = useRef<SVGGElement>(null);
  const layers = useRef<Record<keyof typeof F, SVGGElement | null>>({ sun: null, clouds: null, far: null, mid: null, palms: null, road: null, front: null });
  const charPos = useRef<SVGGElement>(null);
  const charRef = useRef<SVGGElement>(null);
  const charShadow = useRef<SVGEllipseElement>(null);
  const tubeRef = useRef<SVGGElement>(null);
  const tubeShadow = useRef<SVGEllipseElement>(null);
  const puffs = useRef<SVGGElement>(null);
  const tag = useRef<SVGGElement>(null);

  const world = useMemo(
    () => ({
      far: city(11, 60, 120, 110, 250, 14),
      mid: city(29, 80, 150, 170, 380, 40),
      palms: Array.from({ length: 14 }, (_, i) => ({ x: SPAN[0] + 160 + i * 380 + ((i * 97) % 120), s: 0.85 + ((i * 37) % 30) / 100 })),
      lamps: Array.from({ length: 12 }, (_, i) => SPAN[0] + 300 + i * 560),
    }),
    [],
  );

  useLayoutEffect(() => {
    const svg = svgRef.current!;
    const puppet = createPuppet(charRef.current!);
    const pack = charRef.current!.querySelector<SVGGElement>('[data-p="packScroll"]');
    const ownShadow = charRef.current!.querySelector<SVGElement>('[data-p="shadow"]');
    if (ownShadow) ownShadow.style.display = "none"; // usamos a sombra desfocada do palco
    const tube = tubeRef.current!;

    const w = svg.clientWidth || 1;
    const h = svg.clientHeight || 1;
    // Ao alto mostra-se a altura toda (1000). Em ecrãs largos (telemóvel deitado, computador)
    // mostram-se pelo menos 760 unidades de altura, para a cabeça e o nome nunca ficarem cortados;
    // o mundo é largo o suficiente para preencher os lados.
    const k = Math.min(Math.max(w / 1000, h / 1000), h / 760);
    const W = w / k;
    const H = h / k;
    svg.setAttribute("viewBox", `${(500 - W / 2).toFixed(1)} ${(1000 - H).toFixed(1)} ${W.toFixed(1)} ${H.toFixed(1)}`);
    const L = 500 - W / 2;
    const speed = Math.max(300, W * 0.55);

    const st = { x: L - 140, y: 0, phi: 0, running: false, jump: 0, tripped: false, tubeOn: false, tx0: 0, tx1: 0, tubeS: TUBE_S, sq: 1, rested: false, cx: 0, zoom: 1 };
    const followAt = L + W * 0.4; // a câmara começa a seguir quando ela chega aqui
    const tripX = followAt + speed * ENTRY_PACE * 1.1; // e ela tropeça cerca de 1 s depois
    const track = bounceTrack({ h0: 232 * S - TUBE_R, g: 2600, restitution: 0.5, minH: 4 });
    const rollDur = track.settle + 1.1;
    let nextImpact = 0;
    let tubeClock = 0;
    let tagShown = false;
    let puffI = 0;

    function puff(x: number, n = 5, size = 1) {
      const els = Array.from(puffs.current!.children) as SVGCircleElement[];
      for (let i = 0; i < n; i++) {
        const el = els[puffI++ % els.length];
        const dir = i % 2 ? 1 : -1;
        gsap.killTweensOf(el);
        gsap.fromTo(el, { attr: { cx: x, cy: GROUND - 4, r: 6 * size }, opacity: 0.8 }, { attr: { cx: x + dir * (24 + Math.random() * 44) * size, cy: GROUND - 12 - Math.random() * 30 * size, r: 1 }, opacity: 0, duration: 0.7, ease: "power2.out" });
      }
    }

    function trip() {
      st.tripped = true;
      nameTagOut(tag.current);
      sfx.whoosh(0.18);
      gsap
        .timeline()
        .to(st, { jump: 1, duration: 0.12, ease: "power2.out" }, 0)
        .to(st, { y: -70, duration: 0.24, ease: "power2.out" }, 0)
        .to(st, { y: 0, duration: 0.24, ease: "power2.in" }, 0.24)
        .to(st, { jump: 0, duration: 0.16, ease: "power2.in" }, 0.34);
      if (pack) pack.style.opacity = "0";
      sfx.ribbon(0.3);
      st.tubeOn = true;
      st.tx0 = st.x - 58 * S;
      st.tx1 = st.tx0 + 240;
      tubeClock = 0;
      gsap.fromTo(st, { tubeS: TUBE_S * 0.5 }, { tubeS: TUBE_S, duration: 0.35, ease: "back.out(2)" });
      // nenhum candeeiro do primeiro plano pode ficar à frente do canudo parado (ecrã x = 500)
      const endCx = st.tx1 - 500;
      layers.current.front?.querySelectorAll<SVGGElement>("[data-lamp]").forEach((el) => {
        const sx = Number(el.dataset.lamp) - endCx * F.front;
        if (sx > 330 && sx < 640) gsap.to(el, { opacity: 0, duration: 0.8, ease: "power1.out" });
      });
      // a câmara aproxima-se devagar do canudo
      gsap.to(st, { zoom: 1.14, duration: rollDur + 0.4, ease: "power2.inOut" });
    }

    function impact(strength: number, index: number, x: number) {
      sfx.tubeHit(strength, index);
      puff(x, Math.round(3 + strength * 5), 0.6 + strength);
      gsap.fromTo(st, { sq: 1 - 0.22 * strength }, { sq: 1, duration: 0.28, ease: "elastic.out(1, 0.4)" });
    }

    function render() {
      // câmara: cada plano desloca-se à sua velocidade
      for (const key of Object.keys(F) as (keyof typeof F)[]) layers.current[key]?.setAttribute("transform", `translate(${(-st.cx * F[key]).toFixed(1)} 0)`);
      scene.current!.setAttribute("transform", `translate(500 ${GROUND}) scale(${st.zoom.toFixed(4)}) translate(-500 ${-GROUND})`);

      charPos.current!.setAttribute("transform", `translate(${st.x.toFixed(1)} ${(GROUND + st.y).toFixed(1)}) scale(${S})`);
      const lift = Math.min(1, -st.y / 120);
      charShadow.current!.setAttribute("cx", (st.x + 4).toFixed(1));
      charShadow.current!.setAttribute("rx", (48 * (1 - lift * 0.4)).toFixed(1));
      charShadow.current!.style.opacity = String(0.42 * (1 - lift * 0.6));
      let pose = st.running ? runPose(st.phi) : IDLE;
      if (st.jump > 0) pose = mixPose(pose, JUMP, st.jump);
      puppet.set(pose);

      if (st.tubeOn) {
        const x = st.tx0 + (st.tx1 - st.tx0) * rollEase(tubeClock, rollDur);
        const hgt = track.heightAt(tubeClock);
        const rot = ((x - st.tx0) / TUBE_R) * (180 / Math.PI) - 30 * Math.max(0, 1 - tubeClock * 3);
        const y = GROUND - TUBE_R - hgt;
        tube.setAttribute("transform", `translate(${x.toFixed(1)} ${(y + (1 - st.sq) * TUBE_R).toFixed(1)}) scale(${(st.tubeS * (2 - st.sq)).toFixed(3)} ${(st.tubeS * st.sq).toFixed(3)}) rotate(${rot.toFixed(1)})`);
        const sh = tubeShadow.current!;
        sh.setAttribute("cx", x.toFixed(1));
        sh.setAttribute("rx", (78 * TUBE_S * (1 - Math.min(0.6, hgt / 400))).toFixed(1));
        sh.style.opacity = String(0.5 * (1 - Math.min(0.8, hgt / 300)));
      }
    }

    const tick = (_t: number, dtMs: number) => {
      const dt = Math.min(0.05, dtMs / 1000);
      if (st.running) {
        st.phi += dt * Math.PI * 2 * 1.7;
        if (st.jump === 0) st.x += speed * (st.tripped ? 1 : ENTRY_PACE) * dt;
        if (!tagShown && st.x > L - 30) {
          tagShown = true;
          nameTagIn(tag.current);
        }
        if (!st.tripped && st.x > tripX) trip();
        if (st.x - st.cx > L + W + 260) st.running = false;
      }
      // a câmara segue-a e, depois da queda, procura o sítio onde o canudo vai parar
      const target = st.tripped ? st.tx1 - 500 : Math.max(st.cx, st.x - followAt);
      st.cx += (target - st.cx) * Math.min(1, dt * (st.tripped ? 1.6 : 9));

      if (st.tubeOn && !st.rested) {
        tubeClock += dt;
        while (nextImpact < track.impacts.length && tubeClock >= track.impacts[nextImpact].t) {
          const im = track.impacts[nextImpact++];
          impact(im.strength, im.index, st.tx0 + (st.tx1 - st.tx0) * rollEase(im.t, rollDur));
        }
        if (tubeClock >= rollDur) {
          st.rested = true;
          gsap.delayedCall(0.5, rest);
        }
      }
      render();
    };

    function rest() {
      const r = tube.getBoundingClientRect();
      onRest({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
    }

    if (reduced) {
      st.x = L + W + 600;
      st.tubeOn = true;
      st.tx0 = st.tx1 = 500;
      tubeClock = rollDur;
      st.rested = true;
      if (pack) pack.style.opacity = "0";
      render();
      const id = window.setTimeout(rest, 300);
      return () => window.clearTimeout(id);
    }

    gsap.ticker.add(tick);
    render();
    const go = gsap.delayedCall(0.8, () => (st.running = true));
    return () => {
      go.kill();
      gsap.ticker.remove(tick);
    };
  }, [reduced, onRest]);

  const L = (key: keyof typeof F) => (el: SVGGElement | null) => {
    layers.current[key] = el;
  };

  return (
    <div className="i25">
      <svg ref={svgRef} className="i25-svg" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        <defs>
          <linearGradient id="i25-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#4f8fe6" />
            <stop offset=".55" stopColor="#a9cdf5" />
            <stop offset=".78" stopColor="#eef5fd" />
          </linearGradient>
          <radialGradient id="i25-sun">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset=".35" stopColor="#ffffff" stopOpacity=".9" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="i25-haze" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#eef5fd" stopOpacity="0" />
            <stop offset="1" stopColor="#eef5fd" stopOpacity=".85" />
          </linearGradient>
          <linearGradient id="i25-road" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#12336b" />
            <stop offset=".35" stopColor="#0a1f44" />
            <stop offset="1" stopColor="#050d1f" />
          </linearGradient>
          <filter id="i25-soft" x="-50%" y="-200%" width="200%" height="500%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        <g ref={scene}>
          <rect x={-3000} y={-600} width={8000} height={1500} fill="url(#i25-sky)" />
          <g ref={L("sun")}>
            <circle cx={760} cy={330} r={230} fill="url(#i25-sun)" />
            <circle cx={760} cy={330} r={86} fill="#ffffff" />
          </g>
          <g ref={L("clouds")} fill="#ffffff" opacity={0.85}>
            {[-600, -80, 420, 980, 1500, 2100].map((x, i) => (
              <g key={x} transform={`translate(${x} ${230 + (i % 3) * 50})`}>
                <rect x={0} y={0} width={190} height={34} rx={17} />
                <rect x={50} y={-22} width={96} height={40} rx={20} />
              </g>
            ))}
          </g>
          <g ref={L("far")}>
            {world.far.map((b, i) => (
              <Block key={i} b={b} base={WALL - 60} d={10} front="#b9d6f7" side="#9cc4f2" roof="#d6e8fb" />
            ))}
            <rect x={-3000} y={WALL - 330} width={9000} height={290} fill="url(#i25-haze)" />
          </g>
          <g ref={L("mid")}>
            {world.mid.map((b, i) => (
              <Block key={i} b={b} base={WALL} d={24} front={i % 3 === 1 ? "#4f8fe6" : "#6aa2ec"} side="#1f5fbf" roof="#a9cdf5" windows="#eef5fd" />
            ))}
            <rect x={-3000} y={WALL - 160} width={9000} height={160} fill="url(#i25-haze)" opacity={0.45} />
          </g>
          <g ref={L("palms")}>
            {world.palms.map((p) => (
              <Palm key={p.x} x={p.x} s={p.s} />
            ))}
          </g>
          <g ref={L("road")}>
            {/* muro do passeio, com aresta iluminada e face de cima */}
            <rect x={-3000} y={WALL} width={9000} height={10} fill="#8dbcf2" />
            <rect x={-3000} y={WALL + 10} width={9000} height={26} fill="#1b4fa0" />
            <rect x={-3000} y={WALL + 36} width={9000} height={5} fill="#ffffff" opacity={0.85} />
            <rect x={-3000} y={WALL + 41} width={9000} height={700} fill="url(#i25-road)" />
            {Array.from({ length: 50 }, (_, i) => (
              <rect key={i} x={SPAN[0] + i * 120} y={948} width={68} height={9} rx={2} fill="#ffffff" opacity={0.75} />
            ))}
            <ellipse ref={charShadow} cx={-999} cy={GROUND + 4} rx={48} ry={8} fill="#050d1f" opacity={0} filter="url(#i25-soft)" />
            <ellipse ref={tubeShadow} cx={-999} cy={GROUND + 3} rx={50} ry={6} fill="#050d1f" opacity={0} filter="url(#i25-soft)" />
            <g ref={puffs}>
              {Array.from({ length: 16 }, (_, i) => (
                <circle key={i} cx={0} cy={0} r={0} fill="#eef5fd" />
              ))}
            </g>
            <g ref={tubeRef}>
              <Canudo id="i25" />
            </g>
            <g ref={charPos}>
              <g ref={charRef}>
                <Character label="Juceline a correr" />
              </g>
              <g ref={tag}>
                <NameTag />
              </g>
            </g>
          </g>
          <g ref={L("front")} opacity={0.88}>
            {world.lamps.map((x) => (
              <Lamp key={x} x={x} />
            ))}
          </g>
        </g>
      </svg>
    </div>
  );
}
