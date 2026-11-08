"use client";
import gsap from "gsap";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import * as sfx from "@/lib/sound";
import { Seal } from "@/components/Seal";
import { Canudo } from "../../shared/Canudo";
import { Character, createPuppet, IDLE, JUMP, mixPose, runPose } from "../../shared/Character";
import "./intro.css";

// ── Mundo (unidades SVG) ──────────────────────────────────────────────
const GROUND = 700;
const CX0 = 760; // posição de referência da câmara (parallax = 0)
const CY0 = 470;
const START_CY = -300;
const S = 0.92; // escala da personagem
const BOOKS_X = 2420;
const JUMP_AT = 2270;
const LAND_X = 2990;
const SPEED = 640;

function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

/** y "mundo" para que um elemento da camada f apareça em dy, com a câmara no início. */
const startY = (f: number, dy: number) => CY0 + (START_CY - CY0) * f + dy;

function Stars() {
  const r = rng(7);
  return (
    <g data-f="0.1" data-fy="0.1" data-fade="stars">
      {Array.from({ length: 70 }, (_, i) => (
        <circle
          key={i}
          cx={-300 + r() * 2400}
          cy={startY(0.1, -400 + r() * 420)}
          r={0.8 + r() * 1.8}
          fill="#f4e9dc"
          opacity={0.35 + r() * 0.6}
          className={i % 4 === 0 ? "twinkle" : undefined}
          style={{ animationDelay: `${(r() * 3).toFixed(2)}s` }}
        />
      ))}
    </g>
  );
}

function Skyline() {
  const r = rng(42);
  const out: React.ReactNode[] = [];
  let x = -700;
  let i = 0;
  while (x < 4300) {
    const w = 60 + r() * 95;
    const h = 110 + r() * 230;
    const base = 650;
    const fill = i % 3 === 0 ? "#c4a48c" : i % 3 === 1 ? "#b7957f" : "#aa8873";
    out.push(<rect key={`b${i}`} x={x} y={base - h} width={w} height={h} fill={fill} />);
    if (r() > 0.6) out.push(<rect key={`a${i}`} x={x + w * 0.4} y={base - h - 26} width={3} height={26} fill={fill} />);
    for (let k = 0; k < 6; k++) {
      const wx = x + 10 + r() * (w - 22);
      const wy = base - h + 16 + r() * (h - 40);
      const lit = r() > 0.55;
      out.push(<rect key={`w${i}-${k}`} x={wx} y={wy} width={6} height={9} fill={lit ? "#efd49b" : "#e3cdb6"} opacity={lit ? 0.85 : 0.45} />);
    }
    x += w + 6 + r() * 18;
    i++;
  }
  return <g data-f="0.3">{out}</g>;
}

function Baobab({ x, s = 1 }: { x: number; s?: number }) {
  return (
    <g transform={`translate(${x} 668) scale(${s})`}>
      <path d="M-26,0 Q-18,-60 -27,-118 Q-8,-128 2,-126 Q16,-128 29,-118 Q20,-60 26,0 Z" fill="#84593d" />
      <path d="M-18,-116 Q-40,-148 -62,-158 M-4,-124 Q-10,-168 -24,-190 M10,-124 Q20,-164 42,-180 M22,-116 Q50,-138 68,-138" stroke="#84593d" strokeWidth={10} strokeLinecap="round" fill="none" />
      {[
        [-62, -160, 26],
        [-24, -194, 24],
        [42, -184, 28],
        [70, -140, 20],
        [6, -170, 22],
      ].map(([cx, cy, rr], i) => (
        <ellipse key={i} cx={cx} cy={cy} rx={rr} ry={rr * 0.55} fill="#7a5036" />
      ))}
    </g>
  );
}

function Palm({ x, s = 1, flip }: { x: number; s?: number; flip?: boolean }) {
  return (
    <g transform={`translate(${x} 668) scale(${flip ? -s : s} ${s})`}>
      <path d="M0,0 Q8,-90 26,-190" stroke="#84593d" strokeWidth={9} strokeLinecap="round" fill="none" />
      {[
        "M26,-190 Q60,-210 92,-180",
        "M26,-190 Q50,-170 70,-130",
        "M26,-190 Q-4,-214 -40,-196",
        "M26,-190 Q4,-168 -14,-132",
        "M26,-190 Q34,-236 64,-246",
      ].map((d, i) => (
        <path key={i} d={d} stroke="#7a5036" strokeWidth={11} strokeLinecap="round" fill="none" />
      ))}
    </g>
  );
}

function MidLayer() {
  const items: React.ReactNode[] = [];
  for (let i = 0; i < 9; i++) {
    const x = -500 + i * 560;
    items.push(i % 2 === 0 ? <Baobab key={i} x={x} s={0.9 + (i % 3) * 0.18} /> : <Palm key={i} x={x} s={0.95} flip={i % 4 === 1} />);
  }
  return (
    <g data-f="0.55">
      {items}
      <rect x={-1500} y={664} width={7000} height={60} fill="#84593d" />
    </g>
  );
}

function NearLayer() {
  const lamps: React.ReactNode[] = [];
  for (let i = 0; i < 8; i++) {
    const x = -300 + i * 620;
    lamps.push(
      <g key={i}>
        <circle cx={x + 18} cy={452} r={46} fill="#efd49b" opacity={0.22} />
        <rect x={x - 3} y={448} width={6} height={240} fill="#6d3914" />
        <path d={`M${x},452 Q${x + 4},440 ${x + 18},444`} stroke="#6d3914" strokeWidth={5} fill="none" />
        <circle cx={x + 18} cy={452} r={7} fill="#f6dfa8" />
      </g>,
    );
  }
  return (
    <g data-f="0.82">
      <rect x={-1500} y={648} width={7000} height={44} fill="#9c7a62" />
      <rect x={-1500} y={642} width={7000} height={9} fill="#b7957f" />
      {Array.from({ length: 90 }, (_, i) => (
        <rect key={i} x={-1500 + i * 80} y={652} width={2} height={38} fill="#84593d" opacity={0.45} />
      ))}
      {lamps}
    </g>
  );
}

function Ground() {
  return (
    <g>
      <rect x={-1500} y={690} width={7000} height={86} fill="#d7bda6" />
      <rect x={-1500} y={690} width={7000} height={3} fill="#efe2cf" />
      {Array.from({ length: 110 }, (_, i) => (
        <rect key={i} x={-1500 + i * 64} y={693} width={1.6} height={66} fill="#b7957f" opacity={0.55} />
      ))}
      <rect x={-1500} y={760} width={7000} height={18} fill="#b7957f" />
      <rect x={-1500} y={778} width={7000} height={500} fill="#6d4a33" />
      {Array.from({ length: 60 }, (_, i) => (
        <rect key={i} x={-1500 + i * 130} y={872} width={60} height={6} rx={3} fill="#e3cdb6" opacity={0.7} />
      ))}
    </g>
  );
}

function Books() {
  return (
    <g transform={`translate(${BOOKS_X} ${GROUND})`}>
      <ellipse cx={0} cy={2} rx={56} ry={5} fill="#2a1705" opacity={0.16} />
      <rect x={-50} y={-18} width={100} height={18} rx={2} fill="#6d3914" />
      <rect x={44} y={-16} width={4} height={14} fill="#efe2cf" />
      <text x={-4} y={-5.5} textAnchor="middle" fontSize={8.5} letterSpacing={1.4} fill="#efe2cf" fontFamily="var(--font-body), sans-serif" fontWeight={700}>
        CONTABILIDADE
      </text>
      <g transform="rotate(-3 0 -27)">
        <rect x={-42} y={-36} width={84} height={18} rx={2} fill="#ab7743" />
        <rect x={36} y={-34} width={4} height={14} fill="#efe2cf" />
        <text x={-4} y={-23.5} textAnchor="middle" fontSize={8.5} letterSpacing={1.4} fill="#2a1705" fontFamily="var(--font-body), sans-serif" fontWeight={700}>
          FINANÇAS
        </text>
      </g>
      <g transform="rotate(4 0 -44)">
        <rect x={-38} y={-52} width={76} height={16} rx={2} fill="#3a2209" />
        <text x={-2} y={-40.5} textAnchor="middle" fontSize={8} letterSpacing={1.4} fill="#c9a35a" fontFamily="var(--font-body), sans-serif" fontWeight={700}>
          AUDITORIA
        </text>
      </g>
    </g>
  );
}

function Foreground() {
  const r = rng(3);
  return (
    <g data-f="1.3" data-fy="1.3">
      {Array.from({ length: 14 }, (_, i) => {
        const x = -400 + i * 420 + r() * 120;
        return (
          <g key={i} transform={`translate(${x} 905)`} opacity={0.9}>
            <path d="M0,0 Q-10,-60 -30,-92 Q-2,-62 6,0 Z M8,0 Q14,-70 40,-104 Q22,-60 18,0 Z M-12,0 Q-34,-40 -58,-50 Q-30,-30 -4,0 Z" fill="#2a1705" />
          </g>
        );
      })}
    </g>
  );
}

// ─────────────────────────────────────────────────────────────────────
type Phase = "gate" | "playing" | "waiting" | "opening";

export function IntroScene({ guestName, plural, onDone }: { guestName: string; plural: boolean; onDone: () => void }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const charRef = useRef<SVGGElement>(null);
  const charPosRef = useRef<SVGGElement>(null);
  const canRef = useRef<SVGGElement>(null);
  const labelRef = useRef<SVGGElement>(null);
  const bubbleRef = useRef<SVGGElement>(null);
  const bubbleTextRef = useRef<SVGTextElement>(null);
  const dustRef = useRef<SVGGElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const rollRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>("gate");
  const [gateOut, setGateOut] = useState(false);
  const api = useRef<{ start: () => void; open: (fast?: boolean) => void; drag: (p: number) => void; release: (p: number) => void; skip: () => void } | null>(null);

  useLayoutEffect(() => {
    const svg = svgRef.current!;
    const puppet = createPuppet(charRef.current!);
    const packScroll = charRef.current!.querySelector<SVGGElement>('[data-p="packScroll"]');
    const layers = Array.from(svg.querySelectorAll<SVGGElement>("[data-f]")).map((el) => ({ el, f: Number(el.dataset.f), fy: el.dataset.fy ? Number(el.dataset.fy) : 1 }));
    const can = canRef.current!;
    const c = (n: string) => can.querySelector<SVGElement>(`[data-c="${n}"]`)!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const aspect = () => Math.max(0.3, svg.clientWidth / Math.max(1, svg.clientHeight));
    const baseH = () => (aspect() < 0.8 ? 760 : 820);

    const st = {
      cx: CX0,
      cy: START_CY,
      h: baseH(),
      zoom: 1,
      mode: "fixed" as "fixed" | "char" | "canudo",
      charX: -9999,
      charY: 0,
      phi: 0,
      running: false,
      jump: 0,
      jumped: false,
      wave: 0,
      canX: 0,
      canY: 0,
      canR: 0,
      canS: 1,
      canOn: false,
      wob: 0,
      wobY: 0,
      labelX: 0,
      labelY: 0,
      labelR: 0,
      labelO: 0,
      bubbleO: 0,
      shake: 0,
      exitDone: false,
    };

    const width = () => st.h * st.zoom * aspect();

    function render() {
      const h = st.h * st.zoom;
      const w = h * aspect();
      const sx = st.shake ? (Math.random() - 0.5) * st.shake : 0;
      const sy = st.shake ? (Math.random() - 0.5) * st.shake : 0;
      svg.setAttribute("viewBox", `${(st.cx - w / 2 + sx).toFixed(2)} ${(st.cy - h / 2 + sy).toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)}`);
      for (const { el, f, fy } of layers) el.setAttribute("transform", `translate(${((st.cx - CX0) * (1 - f)).toFixed(2)} ${((st.cy - CY0) * (1 - fy)).toFixed(2)})`);
      charPosRef.current!.setAttribute("transform", `translate(${st.charX.toFixed(2)} ${(GROUND + st.charY).toFixed(2)}) scale(${S})`);
      let pose = st.running ? runPose(st.phi) : IDLE;
      if (st.jump > 0) pose = mixPose(pose, JUMP, st.jump);
      if (st.wave > 0) pose = { ...pose, armF: pose.armF + (-150 + 14 * Math.sin(performance.now() / 60) - pose.armF) * st.wave };
      puppet.set(pose);
      can.setAttribute("transform", `translate(${st.canX.toFixed(2)} ${(st.canY + st.wobY).toFixed(2)}) rotate(${(st.canR + st.wob).toFixed(2)}) scale(${st.canS.toFixed(3)})`);
      can.style.opacity = st.canOn ? "1" : "0";
      labelRef.current!.setAttribute("transform", `translate(${st.labelX.toFixed(2)} ${st.labelY.toFixed(2)}) rotate(${st.labelR.toFixed(2)})`);
      labelRef.current!.style.opacity = String(st.labelO);
      bubbleRef.current!.setAttribute("transform", `translate(${(st.charX + 40 * S).toFixed(2)} ${(GROUND + st.charY - 252 * S).toFixed(2)}) scale(${(0.6 + 0.4 * st.bubbleO).toFixed(3)})`);
      bubbleRef.current!.style.opacity = String(st.bubbleO);
    }

    // poeira dourada atrás da personagem
    const dust = Array.from(dustRef.current!.children) as SVGCircleElement[];
    let dustI = 0;
    let dustT = 0;
    function spawnDust(x: number, y: number, spread = 1) {
      const el = dust[dustI++ % dust.length];
      gsap.killTweensOf(el);
      gsap.fromTo(
        el,
        { attr: { cx: x, cy: y, r: 2 + Math.random() * 2.5 }, opacity: 0.95 },
        { attr: { cx: x - (30 + Math.random() * 80) * spread, cy: y - (10 + Math.random() * 60) * spread, r: 0.3 }, opacity: 0, duration: 0.7 + Math.random() * 0.5, ease: "power1.out" },
      );
    }

    let lastStep = 0;
    const tick = (_t: number, dtMs: number) => {
      const dt = Math.min(0.05, dtMs / 1000);
      if (st.running) {
        st.phi += dt * Math.PI * 2 * 1.65;
        const stepN = Math.floor(st.phi / Math.PI);
        if (stepN !== lastStep && st.jump === 0) {
          lastStep = stepN;
          sfx.step();
        }
        if (!st.jumped && st.charX >= JUMP_AT) jump();
        if (st.jump === 0) st.charX += SPEED * dt;
        dustT += dt;
        if (dustT > 0.06) {
          dustT = 0;
          spawnDust(st.charX - 44 * S, GROUND + st.charY - (120 + Math.random() * 90) * S);
        }
        if (st.charX > CX0 + 3200 && !st.exitDone) {
          st.exitDone = true;
          st.running = false;
        }
      }
      // câmara
      const w = width();
      const k = 1 - Math.exp(-dt * 3.2);
      if (st.mode === "char") {
        // alvo à frente da personagem, compensando o atraso da suavização (v/k)
        const target = Math.max(CX0, st.charX - w * 0.08 + SPEED / 3.2);
        st.cx += (target - st.cx) * k;
      } else if (st.mode === "canudo") {
        st.cx += (st.canX - st.cx) * k;
        const ty = st.canY - st.h * st.zoom * 0.1;
        st.cy += (ty - st.cy) * k * 0.9;
      }
      // etiqueta "Juceline" segue com atraso natural
      const tx = st.charX + 4 * S + (st.running ? SPEED / 12 : 0);
      const ty = GROUND + st.charY - 330 * S;
      const kl = 1 - Math.exp(-dt * 12);
      const vx = (tx - st.labelX) * kl;
      st.labelX += vx;
      st.labelY += (ty - st.labelY) * kl;
      st.labelR = Math.max(-16, Math.min(16, -vx * 0.9)) + Math.sin(performance.now() / 180) * 2.5;
      if (st.shake > 0) st.shake = Math.max(0, st.shake - dt * 40);
      render();
    };

    const tl = gsap.timeline({ paused: true });

    function jump() {
      st.jumped = true;
      sfx.whoosh(0.28);
      const j = gsap.timeline();
      j.to(st, { jump: 1, duration: 0.14, ease: "power2.out" }, 0)
        .to(st, { charX: st.charX + 300, duration: 0.56, ease: "none" }, 0)
        .to(st, { charY: -130, duration: 0.28, ease: "power2.out" }, 0)
        .to(st, { charY: 0, duration: 0.28, ease: "power2.in" }, 0.28)
        .to(st, { jump: 0, duration: 0.18, ease: "power2.in" }, 0.42)
        .call(popCanudo, [], 0.2)
        .call(() => sfx.step(0.2), [], 0.56);
    }

    function popCanudo() {
      st.canX = st.charX - 60 * S;
      st.canY = GROUND + st.charY - 232 * S;
      st.canR = -30;
      st.canS = 0.42;
      st.canOn = true;
      if (packScroll) packScroll.style.opacity = "0";
      sfx.pop(480, 0.36);
      st.mode = "canudo";
      for (let i = 0; i < 10; i++) spawnDust(st.canX, st.canY, 0.6);
      const p = gsap.timeline({ onComplete: settle });
      p.to(st, { canX: LAND_X, duration: 1.3, ease: "power1.out" }, 0)
        .to(st, { canS: 1, duration: 0.9, ease: "power2.out" }, 0)
        .to(st, { canR: 720, duration: 1.3, ease: "power1.out" }, 0)
        .to(st, { canY: 290, duration: 0.5, ease: "power2.out" }, 0)
        .to(st, { canY: GROUND - 16, duration: 0.8, ease: "power2.in" }, 0.5)
        .call(
          () => {
            sfx.thud(0.5);
            st.shake = 10;
            for (let i = 0; i < 12; i++) spawnDust(st.canX + (Math.random() - 0.5) * 160, GROUND - 4, 0.5);
          },
          [],
          1.3,
        )
        .to(st, { canY: GROUND - 52, duration: 0.18, ease: "power2.out" }, 1.3)
        .to(st, { canY: GROUND - 16, duration: 0.18, ease: "power2.in" }, 1.48)
        .call(() => sfx.thud(0.2, 160), [], 1.66)
        .to(st, { canY: GROUND - 26, duration: 0.09, ease: "power2.out" }, 1.66)
        .to(st, { canY: GROUND - 16, duration: 0.1, ease: "power2.in" }, 1.75)
        .to(st, { zoom: 0.66, duration: 2, ease: "power2.inOut" }, 0)
        .to(st, { labelO: 0, duration: 0.6 }, 0.8);
    }

    let wobble: gsap.core.Timeline | null = null;
    function settle() {
      st.canR = 0;
      setPhase("waiting");
      const glint = c("glint");
      wobble = gsap
        .timeline({ repeat: -1, repeatDelay: 1.6, delay: 0.6 })
        .call(() => sfx.tick(0.12))
        .to(st, { wobY: -9, duration: 0.12, ease: "power2.out" })
        .to(st, { wob: -7, duration: 0.07 }, "<")
        .to(st, { wob: 6, duration: 0.09 })
        .call(() => sfx.tick(0.1))
        .to(st, { wob: -4, duration: 0.08 })
        .to(st, { wob: 2, duration: 0.08 })
        .to(st, { wob: 0, wobY: 0, duration: 0.14, ease: "power2.in" })
        .fromTo(glint, { attr: { x: -160 } }, { attr: { x: 180 }, duration: 0.9, ease: "power2.inOut" }, "-=0.2");
    }

    // desatar a fita (controlado pelo dedo)
    const untie = gsap
      .timeline({ paused: true })
      .to(c("bowL"), { rotation: -40, x: -26, y: -8, scale: 0.4, opacity: 0, transformOrigin: "100% 100%", duration: 0.5, ease: "power2.in" }, 0)
      .to(c("bowR"), { rotation: 40, x: 26, y: -8, scale: 0.4, opacity: 0, transformOrigin: "0% 100%", duration: 0.5, ease: "power2.in" }, 0)
      .to(c("tailL"), { y: 70, rotation: -50, opacity: 0, transformOrigin: "50% 0%", duration: 0.6, ease: "power2.in" }, 0.1)
      .to(c("tailR"), { y: 70, rotation: 45, opacity: 0, transformOrigin: "50% 0%", duration: 0.6, ease: "power2.in" }, 0.12)
      .to(c("band"), { scaleY: 0, opacity: 0, transformOrigin: "50% 50%", duration: 0.35 }, 0.3)
      .addLabel("crack", 0.62)
      .to(c("sealL"), { x: -36, y: -22, rotation: -50, opacity: 0, duration: 0.55, ease: "power2.out" }, "crack")
      .to(c("sealR"), { x: 36, y: -18, rotation: 50, opacity: 0, duration: 0.55, ease: "power2.out" }, "crack")
      .to(c("sealText"), { opacity: 0, duration: 0.15 }, "crack");
    const crackAt = untie.labels.crack / untie.duration();

    let opened = false;
    function open(fast = false) {
      if (opened) return;
      opened = true;
      wobble?.kill();
      gsap.to(st, { wob: 0, wobY: 0, duration: 0.2 });
      setPhase("opening");
      sfx.paper(0.45, 0.18);
      untie.timeScale(fast ? 2 : 1);
      untie.eventCallback("onComplete", unroll);
      gsap.delayedCall((crackAt * untie.duration() - untie.time()) / untie.timeScale(), () => {
        sfx.thud(0.3, 340);
        sfx.chime(880, 0.14);
      });
      untie.play();
    }

    function unroll() {
      const body = c("body").getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const paper = paperRef.current!;
      const roll = rollRef.current!;
      const midY = body.top + body.height / 2;
      const left = Math.max(8, body.left);
      const right = Math.max(8, vw - body.right);
      const st2 = { y: midY, top: midY, l: left, r: right };
      const apply = () => {
        paper.style.clipPath = `inset(${st2.top}px ${st2.r}px ${Math.max(0, vh - st2.y)}px ${st2.l}px)`;
        roll.style.transform = `translate3d(${st2.l}px, ${st2.y - body.height / 2}px, 0)`;
        roll.style.width = `${vw - st2.l - st2.r}px`;
      };
      roll.style.height = `${body.height}px`;
      paper.style.visibility = "visible";
      roll.style.visibility = "visible";
      st.canOn = false;
      apply();
      sfx.paper(1.1, 0.2);
      gsap
        .timeline({ onUpdate: apply, onComplete: () => onDone() })
        .to(st, { zoom: 0.5, duration: 1.6, ease: "power2.inOut" }, 0)
        .to(st2, { y: vh + body.height, duration: 1.05, ease: "power2.inOut" }, 0)
        .to(st2, { top: 0, l: 0, r: 0, duration: 0.75, ease: "power3.inOut" }, 0.75)
        .to(svg, { opacity: 0, duration: 0.5 }, 0.9)
        .call(() => sfx.chime(660, 0.14), [], 1.2);
    }

    // ── sequência principal ──
    tl.fromTo(svg.querySelectorAll('[data-fade="title"] text'), { opacity: 0, y: 14 }, { opacity: (i: number) => (i ? 0.75 : 1), y: 0, stagger: 0.35, duration: 0.9, ease: "power2.out" }, 0.35)
      .call(() => sfx.whoosh(0.22), [], 1.75)
      .to(st, { cy: CY0, duration: 2.8, ease: "power2.inOut" }, 1.6)
      .to(svg.querySelectorAll('[data-fade="stars"], [data-fade="title"]'), { opacity: 0, duration: 1.4, ease: "power1.in" }, 2.1)
      .call(
        () => {
          st.charX = st.cx - width() / 2 - 140;
          st.labelX = st.charX;
          st.labelY = GROUND - 330 * S;
          st.running = true;
          st.mode = "char";
        },
        [],
        3.3,
      )
      .to(st, { labelO: 1, duration: 0.4 }, 3.6)
      .to(st, { bubbleO: 1, duration: 0.35, ease: "back.out(2)" }, 3.85)
      .to(st, { bubbleO: 0, duration: 0.25 }, 5.5);

    if (reduced) {
      // Sem corrida: o canudo já está no chão, pronto a abrir.
      st.cy = CY0;
      st.zoom = 0.66;
      st.canX = CX0;
      st.cx = CX0;
      st.canY = GROUND - 16;
      st.canOn = true;
      st.mode = "fixed";
      if (packScroll) packScroll.style.opacity = "0";
      svg.querySelectorAll<SVGElement>('[data-fade="stars"], [data-fade="title"]').forEach((e) => (e.style.opacity = "0"));
    }

    gsap.ticker.add(tick);
    render();
    if (process.env.NODE_ENV !== "production") (window as unknown as { __gsap: typeof gsap }).__gsap = gsap;

    // tocar na personagem: acena
    const onChar = () => {
      if (!st.running) return;
      const ts = bubbleTextRef.current?.querySelectorAll("tspan");
      if (ts && ts.length === 2) {
        ts[0].textContent = "Já vou,";
        ts[1].textContent = "já vou!";
      }
      sfx.pop(700, 0.2);
      gsap.timeline().to(st, { wave: 1, bubbleO: 1, duration: 0.2 }).to(st, { wave: 0, bubbleO: 0, duration: 0.3, delay: 0.9 });
    };
    charRef.current!.addEventListener("pointerdown", onChar);

    api.current = {
      start() {
        setGateOut(true);
        window.setTimeout(() => setPhase((p) => (p === "gate" ? "playing" : p)), 750);
        if (reduced) {
          settle();
          return;
        }
        tl.play();
      },
      open,
      drag(p: number) {
        if (opened) return;
        untie.progress(Math.min(crackAt * 0.95, p * crackAt));
      },
      release(p: number) {
        if (opened) return;
        if (p > 0.4) open(true);
        else gsap.to(untie, { progress: 0, duration: 0.3, ease: "power2.out" });
      },
      skip() {
        tl.kill();
        wobble?.kill();
        gsap.to(stageRef.current, { opacity: 0, duration: 0.45, onComplete: onDone });
      },
    };

    const onResize = () => {
      st.h = baseH();
      render();
    };
    window.addEventListener("resize", onResize);
    return () => {
      gsap.ticker.remove(tick);
      tl.kill();
      wobble?.kill();
      untie.kill();
      window.removeEventListener("resize", onResize);
      charRef.current?.removeEventListener("pointerdown", onChar);
    };
  }, [onDone]);

  // gesto: puxar a fita
  const drag = useRef<{ x: number; y: number; t: number; p: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    if (phase !== "waiting") return;
    drag.current = { x: e.clientX, y: e.clientY, t: performance.now(), p: 0 };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dist = Math.hypot(e.clientX - d.x, e.clientY - d.y);
    d.p = Math.min(1, dist / 150);
    if (dist > 6) api.current?.drag(d.p);
  };
  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (d.p < 0.06) api.current?.open(); // toque simples
    else api.current?.release(d.p);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "Enter" || e.key === " ") && phase === "waiting") api.current?.open();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  const first = guestName;

  return (
    <div className={phase === "waiting" || phase === "opening" ? "intro spot" : "intro"} ref={stageRef}>
      <svg ref={svgRef} className="intro-svg" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <linearGradient id="sky" x1="0" y1="-1300" x2="0" y2="700" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#1d1006" />
            <stop offset=".32" stopColor="#4c2b08" />
            <stop offset=".6" stopColor="#84593d" />
            <stop offset=".8" stopColor="#ab7743" />
            <stop offset=".95" stopColor="#dcc0a2" />
          </linearGradient>
          <radialGradient id="sunGlow">
            <stop offset="0" stopColor="#f6e2bd" stopOpacity=".55" />
            <stop offset="1" stopColor="#f6e2bd" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect x={-3000} y={-1300} width={10000} height={2100} fill="url(#sky)" />
        <Stars />
        <g data-f="0.12" data-fy="0.12">
          <circle cx={1120} cy={470} r={330} fill="url(#sunGlow)" />
          <circle cx={1120} cy={470} r={118} fill="#f3dcb6" />
        </g>
        <g data-f="0.2" data-fy="0.5">
          {[
            [300, 180, 1],
            [1300, 120, 1.3],
            [2300, 210, 0.9],
            [3300, 150, 1.2],
          ].map(([x, y, s], i) => (
            <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
              <path d="M-90,20 Q-92,-6 -62,-8 Q-56,-36 -24,-30 Q-6,-56 26,-38 Q58,-46 64,-14 Q94,-10 92,20 Z" fill="#e7cfb3" />
              <path d="M-90,20 L92,20 L88,28 L-86,28 Z" fill="#c4a48c" />
            </g>
          ))}
        </g>
        <g data-f="0.45" data-fy="0.45" data-fade="title" className="intro-title">
          <text x={CX0} y={startY(0.45, -70)} textAnchor="middle" fontSize={40}>
            Luanda, fim de tarde…
          </text>
          <text x={CX0} y={startY(0.45, -22)} textAnchor="middle" fontSize={27} opacity={0.75}>
            e alguém vai atrasada.
          </text>
        </g>
        <Skyline />
        <MidLayer />
        <NearLayer />
        <Ground />
        <Books />
        <g ref={dustRef}>
          {Array.from({ length: 28 }, (_, i) => (
            <circle key={i} r={0} fill="#e6c98a" />
          ))}
        </g>
        <g ref={canRef} className={phase === "waiting" ? "can can-live" : "can"}>
          <Canudo id="intro" />
        </g>
        <g ref={charPosRef}>
          <g ref={charRef} className="char-hit">
            <Character label="Juceline" />
          </g>
        </g>
        <g ref={labelRef} className="label">
          <path d="M-60,-46 h104 a10,10 0 0 1 10,10 v18 a10,10 0 0 1 -10,10 h-104 l-12,-19 Z" fill="#f4e9dc" />
          <circle cx={-56} cy={-27} r={3} fill="#ab7743" />
          <text x={-4} y={-17} textAnchor="middle" fontSize={26} className="hand" fill="#4c2b08">
            Juceline
          </text>
          <path d="M-6,-4 C-12,8 6,14 -2,30" stroke="#f4e9dc" strokeWidth={2.6} fill="none" strokeLinecap="round" />
          <path d="M-9,22 L-2,32 L5,22" stroke="#f4e9dc" strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        <g ref={bubbleRef} className="bubble">
          <path d="M14,-76 h96 a14,14 0 0 1 14,14 v40 a14,14 0 0 1 -14,14 h-78 l-24,14 l8,-16 a14,14 0 0 1 -10,-12 v-40 a14,14 0 0 1 14,-14 Z" fill="#fffaf3" />
          <text ref={bubbleTextRef} x={62} y={-50} textAnchor="middle" fontSize={21} className="hand" fill="#4c2b08">
            <tspan x={62}>Estou</tspan>
            <tspan x={62} dy={21}>
              atrasadaaa!
            </tspan>
          </text>
        </g>
        <Foreground />
      </svg>

      {/* desenrolar do diploma */}
      <div className="unroll-paper paper-grain" ref={paperRef} />
      <div className="unroll-roll" ref={rollRef} />

      {phase === "waiting" && (
        <div className="catch" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
          <div className="hint" aria-live="polite">
            <p>Abre, abre e vê o que tem dentro!</p>
            <svg viewBox="0 0 80 110" className="hint-arrow" aria-hidden="true">
              <path d="M18,6 C54,20 70,46 46,96" />
              <path d="M34,84 L46,98 L58,84" />
            </svg>
          </div>
          <button className="hint-btn" onClick={() => api.current?.open()}>
            <span className="finger" aria-hidden="true" />
            Puxa a fita ou toca no canudo
          </button>
        </div>
      )}

      {phase === "gate" && (
        <div className={gateOut ? "gate gate-out paper-grain" : "gate paper-grain"}>
          <div className="gate-inner">
            <Seal className="gate-seal" />
            <p className="gate-for">Para</p>
            <p className="gate-name">{first}</p>
            <p className="gate-sub">{plural ? "Há uma coisa à vossa espera." : "Há uma coisa à tua espera."}</p>
            <button className="gate-btn" onClick={() => (sfx.unlockAudio(), sfx.chime(784, 0.16), api.current?.start())}>
              <span>Começar</span>
            </button>
            <p className="gate-sound">Liga o som para a melhor experiência</p>
          </div>
        </div>
      )}

      {(phase === "playing" || phase === "waiting") && (
        <button className="skip" onClick={() => api.current?.skip()}>
          Saltar introdução
        </button>
      )}
    </div>
  );
}
