"use client";
// Efeitos sonoros discretos, sintetizados no próprio browser (sem ficheiros, sem serviços externos).
// Só tocam depois de o convidado tocar no ecrã (regra dos telemóveis) e podem ser desligados.

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = true;

export function unlockAudio() {
  if (typeof window === "undefined") return;
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.55;
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") void ctx.resume();
  } catch {
    ctx = null;
  }
}

export function setSoundEnabled(v: boolean) {
  enabled = v;
  if (master && ctx) master.gain.setTargetAtTime(v ? 0.55 : 0, ctx.currentTime, 0.05);
}

export function isSoundEnabled() {
  return enabled;
}

function ready() {
  return enabled && ctx && master && ctx.state === "running" ? { c: ctx, out: master } : null;
}

let noiseBuf: AudioBuffer | null = null;
function noise(c: AudioContext) {
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const s = c.createBufferSource();
  s.buffer = noiseBuf;
  return s;
}

function env(c: AudioContext, g: GainNode, t: number, a: number, peak: number, d: number) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
}

/** Sopro de ar (movimento de câmara, saltos). */
export function whoosh(dur = 0.6, vol = 0.35) {
  const r = ready();
  if (!r) return;
  const { c, out } = r;
  const t = c.currentTime;
  const n = noise(c);
  const f = c.createBiquadFilter();
  f.type = "bandpass";
  f.Q.value = 0.9;
  f.frequency.setValueAtTime(300, t);
  f.frequency.exponentialRampToValueAtTime(2200, t + dur * 0.55);
  f.frequency.exponentialRampToValueAtTime(500, t + dur);
  const g = c.createGain();
  env(c, g, t, dur * 0.45, vol, dur * 0.55);
  n.connect(f).connect(g).connect(out);
  n.start(t);
  n.stop(t + dur + 0.05);
}

/** Passo leve (corrida). */
export function step(vol = 0.12) {
  const r = ready();
  if (!r) return;
  const { c, out } = r;
  const t = c.currentTime;
  const n = noise(c);
  const f = c.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = 900 + Math.random() * 300;
  const g = c.createGain();
  env(c, g, t, 0.005, vol, 0.07);
  n.connect(f).connect(g).connect(out);
  n.start(t);
  n.stop(t + 0.1);
}

/** "Pop" redondo (o canudo a saltar da mochila). */
export function pop(freq = 520, vol = 0.32) {
  const r = ready();
  if (!r) return;
  const { c, out } = r;
  const t = c.currentTime;
  const o = c.createOscillator();
  o.type = "sine";
  o.frequency.setValueAtTime(freq, t);
  o.frequency.exponentialRampToValueAtTime(freq * 2.2, t + 0.09);
  const g = c.createGain();
  env(c, g, t, 0.006, vol, 0.16);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + 0.2);
}

/** Pancada surda (cair no chão, carimbo). */
export function thud(vol = 0.5, freq = 120) {
  const r = ready();
  if (!r) return;
  const { c, out } = r;
  const t = c.currentTime;
  const o = c.createOscillator();
  o.type = "sine";
  o.frequency.setValueAtTime(freq * 1.6, t);
  o.frequency.exponentialRampToValueAtTime(freq * 0.5, t + 0.18);
  const g = c.createGain();
  env(c, g, t, 0.004, vol, 0.22);
  o.connect(g).connect(out);
  const n = noise(c);
  const f = c.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = 700;
  const g2 = c.createGain();
  env(c, g2, t, 0.002, vol * 0.4, 0.06);
  n.connect(f).connect(g2).connect(out);
  o.start(t);
  o.stop(t + 0.3);
  n.start(t);
  n.stop(t + 0.1);
}

/** Restolhar de papel (fita, desenrolar). */
export function paper(dur = 0.5, vol = 0.22) {
  const r = ready();
  if (!r) return;
  const { c, out } = r;
  const t = c.currentTime;
  const n = noise(c);
  const f = c.createBiquadFilter();
  f.type = "highpass";
  f.frequency.value = 1800;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  // pequenas irregularidades para soar a papel
  for (let i = 0; i < 10; i++) {
    const tt = t + (dur * i) / 10;
    g.gain.linearRampToValueAtTime(vol * (0.35 + Math.random() * 0.65), tt + 0.01);
    g.gain.linearRampToValueAtTime(vol * 0.12, tt + dur / 12);
  }
  g.gain.linearRampToValueAtTime(0.0001, t + dur);
  n.connect(f).connect(g).connect(out);
  n.start(t);
  n.stop(t + dur + 0.05);
}

/** Pequeno brilho (acordes de duas notas). */
export function chime(base = 784, vol = 0.18) {
  const r = ready();
  if (!r) return;
  const { c, out } = r;
  const t = c.currentTime;
  [1, 1.5, 2].forEach((m, i) => {
    const o = c.createOscillator();
    o.type = "triangle";
    o.frequency.value = base * m;
    const g = c.createGain();
    env(c, g, t + i * 0.07, 0.01, vol / (i + 1), 0.9);
    o.connect(g).connect(out);
    o.start(t + i * 0.07);
    o.stop(t + i * 0.07 + 1);
  });
}

/** Tique (lançamentos do balancete, chocalhar). */
export function tick(freq = 1800, vol = 0.12) {
  const r = ready();
  if (!r) return;
  const { c, out } = r;
  const t = c.currentTime;
  const o = c.createOscillator();
  o.type = "square";
  o.frequency.value = freq;
  const f = c.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.value = freq;
  const g = c.createGain();
  env(c, g, t, 0.002, vol, 0.03);
  o.connect(f).connect(g).connect(out);
  o.start(t);
  o.stop(t + 0.05);
}
