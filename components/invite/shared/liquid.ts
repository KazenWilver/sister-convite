// Formas líquidas em SVG: um "blob" fechado e suave cujo contorno ondula com o tempo.
// Mesmo número de pontos em todas as formas, por isso podem transformar-se umas nas outras sem saltos.

const TAU = Math.PI * 2;

/** Caminho fechado e suave (Catmull-Rom → Bézier) por pontos em volta de (cx, cy). */
export function blobPath(cx: number, cy: number, radii: number[], rot = 0): string {
  const n = radii.length;
  const pts = radii.map((r, i) => {
    const a = rot + (i / n) * TAU;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  });
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d + "Z";
}

/** Raios de um blob "vivo": base r, ondulação `wob` (0–1), tempo t (s), semente seed. */
export function liveRadii(r: number, wob: number, t: number, seed = 0, n = 8): number[] {
  return Array.from({ length: n }, (_, i) => {
    const k = seed * 1.7 + i * 2.39;
    return r * (1 + wob * (0.11 * Math.sin(t * 0.9 + k) + 0.07 * Math.sin(t * 1.7 + k * 1.3)));
  });
}
