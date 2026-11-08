// Física partilhada da queda do canudo (2D, 2.5D e 3D usam a mesma).
// Altura acima do chão em função do tempo: queda livre + ressaltos que perdem energia.
// As pancadas (impacts) dizem quando tocar o som e com que força, por isso o som fica sincronizado.

export type Impact = { t: number; strength: number; index: number };

export type BounceTrack = {
  /** altura acima do chão (mesma unidade que h0) no instante t (s) */
  heightAt: (t: number) => number;
  impacts: Impact[];
  /** instante em que deixa de saltar */
  settle: number;
};

export function bounceTrack({ h0, g = 2600, restitution = 0.48, minH = 3 }: { h0: number; g?: number; restitution?: number; minH?: number }): BounceTrack {
  // segmentos: [início, duração, altura máxima, fase] — o primeiro é só a descida
  const segs: { t0: number; dur: number; h: number; fall: boolean }[] = [];
  const impacts: Impact[] = [];
  let t = Math.sqrt((2 * h0) / g);
  segs.push({ t0: 0, dur: t, h: h0, fall: true });
  impacts.push({ t, strength: 1, index: 0 });
  let h = h0 * restitution * restitution;
  let i = 1;
  while (h > minH && i < 6) {
    const dur = 2 * Math.sqrt((2 * h) / g);
    segs.push({ t0: t, dur, h, fall: false });
    t += dur;
    impacts.push({ t, strength: Math.sqrt(h / h0), index: i });
    h *= restitution * restitution;
    i++;
  }
  const settle = t;
  const heightAt = (time: number) => {
    if (time >= settle) return 0;
    for (const s of segs) {
      if (time < s.t0 + s.dur) {
        const u = time - s.t0;
        if (s.fall) return Math.max(0, s.h - 0.5 * g * u * u);
        const v0 = Math.sqrt(2 * g * s.h);
        return Math.max(0, v0 * u - 0.5 * g * u * u);
      }
    }
    return 0;
  };
  return { heightAt, impacts, settle };
}

/** Desaceleração suave do rolar: posição 0→1 ao longo de `dur` (ease-out quadrático). */
export function rollEase(t: number, dur: number) {
  const u = Math.min(1, Math.max(0, t / dur));
  return 1 - (1 - u) * (1 - u);
}
