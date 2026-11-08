"use client";
// Efeitos sonoros discretos. O canudo a bater no chão usa gravações reais (public/sounds/tube-hit-*.mp3);
// os outros efeitos também são gravações reais (ver SAMPLES). Se faltarem ficheiros, o canudo é sintetizado e os outros calam-se.
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
    void loadTubeHits(ctx);
    void loadSamples(ctx);
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

/* ── Gravações reais (CC0, Freesound) ─────────────────────────────
   Sons de objectos verdadeiros, discretos, nada de "bips" de jogo:
   whoosh = ar a passar · ribbon = tecido/fita · unfold = papel grosso a desdobrar
   stamp = carimbo na mesa · tick = lápis a fazer um visto · toast = brinde de copos */
const SAMPLES = {
  whoosh: "/sounds/whoosh.mp3",
  ribbon: "/sounds/ribbon.mp3",
  unfold: "/sounds/unfold.mp3",
  stamp: "/sounds/stamp.mp3",
  tick: "/sounds/tick.mp3",
  toast: "/sounds/toast.mp3",
} as const;
type Sample = keyof typeof SAMPLES;
const bufs: Partial<Record<Sample, AudioBuffer>> = {};
let samplesLoading = false;

async function loadSamples(c: AudioContext) {
  if (samplesLoading) return;
  samplesLoading = true;
  await Promise.all(
    (Object.keys(SAMPLES) as Sample[]).map(async (k) => {
      try {
        const r = await fetch(SAMPLES[k]);
        if (r.ok) bufs[k] = await c.decodeAudioData(await r.arrayBuffer());
      } catch {}
    }),
  );
}

function play(name: Sample, vol: number, rate = 1) {
  const r = ready();
  const buf = bufs[name];
  if (!r || !buf) return;
  const { c, out } = r;
  const src = c.createBufferSource();
  src.buffer = buf;
  src.playbackRate.value = rate * (0.97 + Math.random() * 0.06); // nunca exactamente igual
  const g = c.createGain();
  g.gain.value = vol;
  src.connect(g).connect(out);
  src.start();
}

/** Ar a passar (saltos, o capelo atirado). */
export const whoosh = (vol = 0.3) => play("whoosh", vol);
/** Tecido: a fita, o canudo a sair da mochila, o vestido a mudar de cor. */
export const ribbon = (vol = 0.35) => play("ribbon", vol);
/** Papel grosso a desdobrar: o cartão a chegar e as portas a abrir. */
export const unfold = (vol = 0.35) => play("unfold", vol);
/** Carimbo na mesa. */
export const stamp = (vol = 0.5) => play("stamp", vol);
/** Lápis a fazer um visto (lançamentos, copiar). */
export const tick = (vol = 0.3) => play("tick", vol);
/** Dois copos a brindar: os momentos de festa. */
export const toast = (vol = 0.3) => play("toast", vol);
/** A data encaixa: um carimbo muito baixo e mais grave. */
export const settle = () => play("stamp", 0.16, 0.8);

// Nomes antigos (usados pela base da versão 2.5D): apontam para as gravações.
export const step = (_vol?: number) => {};
export const pop = (_f?: number, vol = 0.3) => ribbon(vol);
export const thud = (vol = 0.5, _f?: number) => stamp(vol);
export const paper = (_d?: number, vol = 0.3) => unfold(vol);
export const chime = (_f?: number, vol = 0.2) => toast(vol * 1.6);

/* ── Canudo de cartão a bater no chão ─────────────────────────────── */
// Para trocar o som: substitui public/sounds/tube-hit-1.mp3 (1.ª pancada, a mais forte)
// e tube-hit-2/3.mp3 (ressaltos). Qualquer duração curta (< 1 s) serve.
const TUBE_FILES = ["/sounds/tube-hit-1.mp3", "/sounds/tube-hit-2.mp3", "/sounds/tube-hit-3.mp3"];
let tubeBufs: (AudioBuffer | null)[] | null = null;
let tubeLoading = false;

async function loadTubeHits(c: AudioContext) {
  if (tubeBufs || tubeLoading) return;
  tubeLoading = true;
  tubeBufs = await Promise.all(
    TUBE_FILES.map(async (u) => {
      try {
        const r = await fetch(u);
        if (!r.ok) return null;
        return await c.decodeAudioData(await r.arrayBuffer());
      } catch {
        return null;
      }
    }),
  );
}

/** Síntese de reserva: tubo oco = ressonâncias curtas + pancada grave. */
function tubeSynth(c: AudioContext, out: AudioNode, t: number, vol: number, pitch: number) {
  for (const [f, q, a] of [
    [190 * pitch, 9, 1],
    [430 * pitch, 7, 0.55],
    [910 * pitch, 5, 0.25],
  ]) {
    const n = noise(c);
    const bp = c.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = f;
    bp.Q.value = q;
    const g = c.createGain();
    env(c, g, t, 0.002, vol * a * 2.2, 0.16);
    n.connect(bp).connect(g).connect(out);
    n.start(t);
    n.stop(t + 0.25);
  }
  const o = c.createOscillator();
  o.frequency.setValueAtTime(140 * pitch, t);
  o.frequency.exponentialRampToValueAtTime(70 * pitch, t + 0.12);
  const g = c.createGain();
  env(c, g, t, 0.003, vol * 0.7, 0.14);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + 0.2);
}

/**
 * Uma pancada do canudo. `strength` 0–1 (1 = primeira queda), `index` = n.º do ressalto.
 * Cada ressalto fica mais fraco, mais curto e um pouco mais agudo.
 */
export function tubeHit(strength = 1, index = 0) {
  const r = ready();
  if (!r) return;
  const { c, out } = r;
  const t = c.currentTime;
  const s = Math.max(0.05, Math.min(1, strength));
  const vol = 0.95 * Math.pow(s, 0.8);
  const pitch = 1 + (1 - s) * 0.12;
  const buf = tubeBufs?.[Math.min(index, TUBE_FILES.length - 1)] ?? tubeBufs?.[0] ?? null;
  if (!buf) {
    tubeSynth(c, out, t, vol * 0.5, pitch);
    return;
  }
  const src = c.createBufferSource();
  src.buffer = buf;
  src.playbackRate.value = pitch * (0.97 + Math.random() * 0.06);
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 2500 + 6000 * s; // os ressaltos fracos perdem brilho
  const g = c.createGain();
  g.gain.value = vol;
  src.connect(lp).connect(g).connect(out);
  src.start(t);
}
