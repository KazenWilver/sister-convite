"use client";
import { useEffect, useRef } from "react";
import { Canudo } from "@/components/invite/shared/Canudo";
import { Character, createPuppet, IDLE, JUMP, runPose } from "@/components/invite/shared/Character";

export function CharacterSheet() {
  const refs = useRef<(SVGGElement | null)[]>([]);
  const live = useRef<SVGGElement | null>(null);
  useEffect(() => {
    const poses = [IDLE, runPose(0.3), runPose(1.9), runPose(3.4), JUMP];
    refs.current.forEach((el, i) => el && createPuppet(el).set(poses[i]));
    const p = live.current ? createPuppet(live.current) : null;
    let raf = 0;
    const t0 = performance.now();
    const loop = (t: number) => {
      p?.set(runPose(((t - t0) / 1000) * Math.PI * 2 * 1.6));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <main style={{ background: "#e9d6c0", minHeight: "100dvh", padding: 20 }}>
      <svg viewBox="-80 -310 900 330" style={{ width: "100%", background: "#d7bda6" }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i} transform={`translate(${i * 165} 0)`}>
            <g ref={(el) => void (refs.current[i] = el)}>
              <Character />
            </g>
          </g>
        ))}
      </svg>
      <svg viewBox="-150 -310 600 330" style={{ width: "100%", background: "#ab7743", marginTop: 12 }}>
        <g ref={live} transform="translate(0 0) scale(1)">
          <Character />
        </g>
        <g transform="translate(260 -120) scale(1.2)">
          <Canudo id="dev" />
        </g>
      </svg>
    </main>
  );
}
