// Selo único de cada convite: uma roseta "guilloché" (como nas notas de banco) desenhada a partir
// de uma semente própria do convidado. Dois convites nunca têm o mesmo desenho, por isso uma
// captura de ecrã de um convite não serve para outra pessoa.
import { useId } from "react";

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rosette(r0: number, amp: number, n: number, amp2: number, m: number, phase: number) {
  const pts: string[] = [];
  const steps = 360;
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const r = r0 + amp * Math.sin(n * t + phase) + amp2 * Math.cos(m * t - phase * 0.5);
    pts.push(`${(r * Math.cos(t)).toFixed(2)},${(r * Math.sin(t)).toFixed(2)}`);
  }
  return `M${pts.join("L")}Z`;
}

export function UniqueSeal({ seed, className, label = "JVD" }: { seed: number; className?: string; label?: string }) {
  const id = useId().replace(/:/g, "");
  const r = rng(seed);
  const n = 7 + Math.floor(r() * 9); // pétalas do anel de fora
  const m = 2 + Math.floor(r() * 4);
  const n2 = 5 + Math.floor(r() * 7); // pétalas do anel de dentro
  const lines = 7 + Math.floor(r() * 5);
  const spin = r() * 360;
  const a1 = 3 + r() * 3;
  const a2 = 1 + r() * 2;
  const outer = Array.from({ length: lines }, (_, i) => rosette(38, a1, n, a2, m, (i / lines) * ((Math.PI * 2) / n)));
  const inner = Array.from({ length: Math.max(5, lines - 2) }, (_, i) => rosette(27, 2.4, n2, 0.8, m + 1, (i / lines) * ((Math.PI * 2) / n2) + 0.4));

  return (
    <svg viewBox="-50 -50 100 100" className={className} aria-hidden="true">
      <defs>
        <radialGradient id={`g${id}`} cx="35%" cy="30%" r="80%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset=".45" stopColor="#8dbcf2" />
          <stop offset="1" stopColor="#1f5fbf" />
        </radialGradient>
      </defs>
      <circle r="47" fill={`url(#g${id})`} />
      <g transform={`rotate(${spin.toFixed(1)})`} fill="none" strokeLinejoin="round">
        {outer.map((d, i) => (
          <path key={`o${i}`} d={d} stroke="#0a1f44" strokeOpacity={0.5} strokeWidth={0.35} />
        ))}
        {inner.map((d, i) => (
          <path key={`i${i}`} d={d} stroke="#ffffff" strokeOpacity={0.85} strokeWidth={0.3} />
        ))}
      </g>
      <circle r="46.4" fill="none" stroke="#12336b" strokeOpacity=".6" strokeWidth="1" />
      <circle r="19" fill="#eef5fd" stroke="#12336b" strokeOpacity=".55" strokeWidth=".8" />
      <text y="5.6" textAnchor="middle" fontFamily="var(--font-display), serif" fontSize="15" fontWeight="700" fill="#0a1f44" style={{ letterSpacing: "0.6px" }}>
        {label}
      </text>
    </svg>
  );
}
