"use client";
// Versão 2D: ilustração plana (só cores chapadas, sem sombras nem profundidade).
// A Juceline atravessa a Marginal a correr; o canudo salta da mochila, quica três vezes e rola pela estrada.
import gsap from "gsap";
import { useLayoutEffect, useRef } from "react";
import * as sfx from "@/lib/sound";
import { Canudo } from "../../shared/Canudo";
import { Character, createPuppet, IDLE, JUMP, mixPose, runPose } from "../../shared/Character";
import { NameTag, nameTagIn, nameTagOut } from "../../shared/NameTag";
import { bounceTrack, rollEase } from "../../shared/tube";
import type { IntroProps } from "../types";
import "./intro2d.css";

const GROUND = 850; // linha onde pousam os pés e o canudo
const S = 1.05; // escala da personagem
const TUBE_S = 0.72; // escala do canudo no chão
const TUBE_R = 15 * TUBE_S; // raio do canudo (para rolar sem escorregar)
const ENTRY_PACE = 0.62; // entra mais devagar, para dar tempo de ler o nome
const TRIP_AT = 0.42; // tropeça a 42% da largura visível

function Skyline() {
  // Prédios da Marginal de Luanda, em silhueta plana
  const b = [
    [0, 140, 250], [130, 90, 330], [215, 120, 210], [330, 70, 400], [395, 110, 280], [500, 80, 360],
    [575, 130, 230], [700, 70, 300], [765, 120, 420], [880, 90, 260], [965, 110, 340],
  ];
  return (
    <g>
      {b.map(([x, w, h], i) => (
        <g key={i}>
          <rect x={x} y={760 - h} width={w} height={h} fill={i % 3 === 1 ? "#4f8fe6" : "#8dbcf2"} />
          {Array.from({ length: Math.floor(h / 46) }, (_, r) => (
            <rect key={r} x={x + 14} y={760 - h + 20 + r * 46} width={w - 28} height={8} fill="#d6e8fb" opacity={0.55} />
          ))}
        </g>
      ))}
    </g>
  );
}

function Palm({ x, s = 1 }: { x: number; s?: number }) {
  return (
    <g transform={`translate(${x} 762) scale(${s})`} fill="#1f5fbf">
      <path d="M-5,0 Q-2,-120 10,-210 L18,-208 Q8,-120 7,0 Z" />
      <path d="M13,-212 Q-40,-240 -86,-196 Q-36,-222 13,-204 Z M14,-212 Q70,-246 112,-190 Q62,-226 15,-204 Z M13,-214 Q-10,-268 -56,-280 Q-6,-256 10,-206 Z M15,-214 Q48,-270 92,-262 Q44,-252 17,-206 Z" />
    </g>
  );
}

export function Intro2D({ reduced, onRest }: IntroProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const charPos = useRef<SVGGElement>(null);
  const charRef = useRef<SVGGElement>(null);
  const tubeRef = useRef<SVGGElement>(null);
  const tubeShadow = useRef<SVGEllipseElement>(null);
  const puffs = useRef<SVGGElement>(null);
  const tag = useRef<SVGGElement>(null);

  useLayoutEffect(() => {
    const svg = svgRef.current!;
    const puppet = createPuppet(charRef.current!);
    const pack = charRef.current!.querySelector<SVGGElement>('[data-p="packScroll"]');
    const tube = tubeRef.current!;

    // janela visível em unidades do mundo (viewBox 1000×1000, "slice" alinhado em baixo)
    const view = () => {
      const w = svg.clientWidth || 1;
      const h = svg.clientHeight || 1;
      const k = Math.max(w / 1000, h / 1000);
      const vw = w / k;
      return { L: 500 - vw / 2, W: vw };
    };
    const v = view();
    const speed = Math.max(300, v.W * 0.55);

    const st = { x: v.L - 140, y: 0, phi: 0, running: false, jump: 0, tripped: false, tubeOn: false, t0: 0, tx0: 0, tx1: 0, tubeS: TUBE_S, sq: 1, rested: false };
    const track = bounceTrack({ h0: 232 * S - TUBE_R, g: 2600, restitution: 0.5, minH: 4 });
    const rollDur = track.settle + 1.1;
    let nextImpact = 0;
    let tubeClock = 0;
    let tagShown = false;

    function puff(x: number, n = 5, size = 1) {
      const els = Array.from(puffs.current!.children) as SVGCircleElement[];
      for (let i = 0; i < n; i++) {
        const el = els[(puffI++) % els.length];
        const dir = i % 2 ? 1 : -1;
        gsap.killTweensOf(el);
        gsap.fromTo(el, { attr: { cx: x, cy: GROUND - 4, r: 5 * size }, opacity: 0.9 }, { attr: { cx: x + dir * (20 + Math.random() * 40) * size, cy: GROUND - 10 - Math.random() * 26 * size, r: 0.5 }, opacity: 0, duration: 0.55, ease: "power2.out" });
      }
    }
    let puffI = 0;

    function trip() {
      st.tripped = true;
      nameTagOut(tag.current);
      sfx.whoosh(0.18);
      gsap.timeline()
        .to(st, { jump: 1, duration: 0.12, ease: "power2.out" }, 0)
        .to(st, { y: -70, duration: 0.24, ease: "power2.out" }, 0)
        .to(st, { y: 0, duration: 0.24, ease: "power2.in" }, 0.24)
        .to(st, { jump: 0, duration: 0.16, ease: "power2.in" }, 0.34)
        ;
      // o canudo sai da mochila
      if (pack) pack.style.opacity = "0";
      sfx.ribbon(0.3); // o canudo escorrega da mochila
      st.tubeOn = true;
      st.tx0 = st.x - 58 * S;
      st.tx1 = st.tx0 + Math.max(110, v.L + v.W * 0.5 - st.tx0); // pára perto do centro
      tubeClock = 0;
      gsap.fromTo(st, { tubeS: TUBE_S * 0.5 }, { tubeS: TUBE_S, duration: 0.35, ease: "back.out(2)" });
    }

    function impact(strength: number, index: number, x: number) {
      sfx.tubeHit(strength, index);
      puff(x, Math.round(3 + strength * 5), 0.6 + strength);
      gsap.fromTo(st, { sq: 1 - 0.22 * strength }, { sq: 1, duration: 0.28, ease: "elastic.out(1, 0.4)" });
    }

    function render() {
      charPos.current!.setAttribute("transform", `translate(${st.x.toFixed(1)} ${(GROUND + st.y).toFixed(1)}) scale(${S})`);
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
        sh.setAttribute("rx", (70 * TUBE_S * (1 - Math.min(0.6, hgt / 400))).toFixed(1));
        sh.style.opacity = String(0.35 * (1 - Math.min(0.8, hgt / 300)));
      }
    }

    const tick = (_t: number, dtMs: number) => {
      const dt = Math.min(0.05, dtMs / 1000);
      if (st.running) {
        st.phi += dt * Math.PI * 2 * 1.7;
        if (st.jump === 0) st.x += speed * (st.tripped ? 1 : ENTRY_PACE) * dt;
        if (!tagShown && st.x > v.L - 30) {
          tagShown = true;
          nameTagIn(tag.current);
        }
        if (!st.tripped && st.x > v.L + v.W * TRIP_AT) trip();
        if (st.x > v.L + v.W + 200) st.running = false;
      }
      if (st.tubeOn && !st.rested) {
        tubeClock += dt;
        while (nextImpact < track.impacts.length && tubeClock >= track.impacts[nextImpact].t) {
          const im = track.impacts[nextImpact++];
          impact(im.strength, im.index, st.tx0 + (st.tx1 - st.tx0) * rollEase(im.t, rollDur));
        }
        if (tubeClock >= rollDur) {
          st.rested = true;
          gsap.delayedCall(0.35, rest);
        }
      }
      render();
    };

    function rest() {
      const r = tube.getBoundingClientRect();
      onRest({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
    }

    if (reduced) {
      st.x = v.L + v.W + 400;
      st.tubeOn = true;
      st.tx0 = st.tx1 = v.L + v.W * 0.5;
      tubeClock = rollDur;
      st.rested = true;
      if (pack) pack.style.opacity = "0";
      render();
      const id = window.setTimeout(rest, 300);
      return () => window.clearTimeout(id);
    }

    gsap.ticker.add(tick);
    render();
    const go = gsap.delayedCall(0.8, () => (st.running = true)); // espera que o portão abra
    return () => {
      go.kill();
      gsap.ticker.remove(tick);
    };
  }, [reduced, onRest]);

  return (
    <div className="i2d">
      <svg ref={svgRef} className="i2d-svg" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        <rect x={-2000} y={-500} width={5000} height={1600} fill="#d6e8fb" />
        <circle cx={720} cy={360} r={120} fill="#ffffff" />
        <g className="i2d-clouds" fill="#ffffff">
          <rect x={80} y={250} width={180} height={34} rx={17} />
          <rect x={130} y={226} width={90} height={40} rx={20} />
          <rect x={560} y={190} width={150} height={30} rx={15} />
          <rect x={860} y={290} width={170} height={32} rx={16} />
        </g>
        <Skyline />
        <Palm x={120} s={1.05} />
        <Palm x={610} s={0.85} />
        <Palm x={930} s={1.15} />
        {/* passeio e estrada */}
        <rect x={-2000} y={760} width={5000} height={30} fill="#1f5fbf" />
        <rect x={-2000} y={786} width={5000} height={6} fill="#ffffff" />
        <rect x={-2000} y={792} width={5000} height={600} fill="#0a1f44" />
        {Array.from({ length: 30 }, (_, i) => (
          <rect key={i} x={-1000 + i * 120} y={925} width={64} height={8} fill="#ffffff" opacity={0.85} />
        ))}
        <ellipse ref={tubeShadow} cx={-999} cy={GROUND + 2} rx={50} ry={5} fill="#050d1f" opacity={0} />
        <g ref={puffs}>
          {Array.from({ length: 16 }, (_, i) => (
            <circle key={i} cx={0} cy={0} r={0} fill="#ffffff" />
          ))}
        </g>
        <g ref={tubeRef}>
          <Canudo id="i2d" flat />
        </g>
        <g ref={charPos}>
          <g ref={charRef}>
            <Character label="Juceline a correr" flat />
          </g>
          <g ref={tag}>
            <NameTag />
          </g>
        </g>
      </svg>
    </div>
  );
}
