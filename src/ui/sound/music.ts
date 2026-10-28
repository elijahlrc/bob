// Bob's music (docs/AUDIO.md, "Music"): one piece in layers, blended by an intensity from 0 (calm) through 1 (fight)
// to 2 (boss or low life). Every layer shares one tempo, key and harmony, so any mix of them fits, and a layer fades
// in or out over a bar. The harmony is a small set of hand-written progressions; what varies is their order, the
// voicings, the cello line, the rhythms and how full each stretch is. The owner approved it by ear on 2026-10-28 (the
// "Bob Music Sketch" artifact); change it only by ear. It works on an AudioContext or an OfflineAudioContext.

export const BPM = 96;
const BEAT = 60 / BPM;
export const BAR = BEAT * 4;
const STEP = BEAT / 4;
const CHORD_BARS = 2;
const PHRASE_BARS = 8;

const hzM = (m: number): number => 440 * Math.pow(2, (m - 69) / 12);
const rand = (a: number, b: number): number => a + Math.random() * (b - a);
const chance = (p: number): boolean => Math.random() < p;
const pick = <T>(a: readonly T[]): T => a[Math.floor(Math.random() * a.length)]!;
function wpick<T>(pairs: [T, number][]): T {
  let s = 0;
  for (const [, w] of pairs) s += w;
  let r = Math.random() * s;
  for (const [v, w] of pairs) if ((r -= w) <= 0) return v;
  return pairs[pairs.length - 1]![0];
}
const clamp = (x: number, a: number, b: number): number => Math.max(a, Math.min(b, x));
/** The pitch class of a midi note, counted from D. */
export const pcOf = (m: number): number => (((m - 62) % 12) + 12) % 12;

export interface Chord {
  pcs: readonly number[];
  name: string;
}
/** D minor's chords, as pitch classes from D, root first. */
export const CHORDS = {
  Dm: { pcs: [0, 3, 7], name: 'Dm' },
  Eb: { pcs: [1, 5, 8], name: 'E♭' },
  F: { pcs: [3, 7, 10], name: 'F' },
  Gm: { pcs: [5, 8, 0], name: 'Gm' },
  A: { pcs: [7, 11, 2], name: 'A' },
  Bb: { pcs: [8, 0, 3], name: 'B♭' },
  C: { pcs: [10, 2, 5], name: 'C' },
} satisfies Record<string, Chord>;
type ChordId = keyof typeof CHORDS;
const SCALE = [0, 2, 3, 5, 7, 8, 10];

interface Progression {
  id: string;
  chords: readonly ChordId[];
  /** How much it suits calm, fight and boss. */
  mood: readonly [number, number, number];
}
/** Hand-written progressions, two bars a chord. */
export const PROGRESSIONS: readonly Progression[] = [
  { id: 'Lament', chords: ['Dm', 'Bb', 'F', 'C'], mood: [1, 0.7, 0.2] },
  { id: 'Return', chords: ['Dm', 'Gm', 'Dm', 'A'], mood: [1, 1, 0.7] },
  { id: 'Dread', chords: ['Dm', 'Eb', 'Dm', 'Eb'], mood: [0.25, 0.8, 1.3] },
  { id: 'Descent', chords: ['Dm', 'C', 'Bb', 'A'], mood: [0.8, 1, 1] },
  { id: 'March', chords: ['Dm', 'Bb', 'Gm', 'A'], mood: [0.5, 1, 1] },
  { id: 'Turn', chords: ['Gm', 'Dm', 'Bb', 'A'], mood: [0.7, 0.8, 0.5] },
];

interface LayerDef {
  /** Level by intensity, as [intensity, level] points, linear between. */
  curve: readonly [number, number][];
  mix: number;
  verb: number;
  dirt: number;
}
/** The layers: their level by intensity, their mix level and their sends to the hall and the grit. */
export const LAYERS = {
  drone: {
    curve: [
      [0, 1],
      [2, 0.85],
    ],
    mix: 0.085,
    verb: 0.35,
    dirt: 0.15,
  },
  pad: {
    curve: [
      [0, 1],
      [1, 0.75],
      [2, 0.5],
    ],
    mix: 0.24,
    verb: 0.55,
    dirt: 0,
  },
  line: {
    curve: [
      [0, 1],
      [0.8, 0.4],
      [1.3, 0],
    ],
    mix: 0.35,
    verb: 0.5,
    dirt: 0,
  },
  pulse: {
    curve: [
      [0.35, 0],
      [1, 1],
      [2, 1],
    ],
    mix: 0.2,
    verb: 0.12,
    dirt: 0.3,
  },
  perc: {
    curve: [
      [0.45, 0],
      [1, 1],
      [2, 0.75],
    ],
    mix: 1,
    verb: 0.25,
    dirt: 0.2,
  },
  heavy: {
    curve: [
      [1.15, 0],
      [1.8, 1],
    ],
    mix: 0.5,
    verb: 0.4,
    dirt: 0.35,
  },
  ost: {
    curve: [
      [1.25, 0],
      [1.9, 1],
    ],
    mix: 2.6,
    verb: 0.25,
    dirt: 0.25,
  },
  choir: {
    curve: [
      [1.25, 0],
      [2, 1],
    ],
    mix: 1.04,
    verb: 0.6,
    dirt: 0.05,
  },
  braam: {
    curve: [
      [1.3, 0],
      [2, 1],
    ],
    mix: 0.3,
    verb: 0.4,
    dirt: 0.9,
  },
} satisfies Record<string, LayerDef>;
type LayerId = keyof typeof LAYERS;
const LAYER_IDS = Object.keys(LAYERS) as LayerId[];

export function curveAt(pts: readonly [number, number][], x: number): number {
  if (x <= pts[0]![0]) return pts[0]![1];
  for (let i = 1; i < pts.length; i++)
    if (x <= pts[i]![0]) {
      const [x0, y0] = pts[i - 1]!;
      const [x1, y1] = pts[i]!;
      return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
    }
  return pts[pts.length - 1]![1];
}

type Density = 'full' | 'thin' | 'sparse';
/** How full a calm stretch is: it never goes silent, but some stretches are only the drone and a little more. */
const DENSITY: Record<Density, { pad: number; line: number }> = {
  full: { pad: 1, line: 0.8 },
  thin: { pad: 0.7, line: 0.5 },
  sparse: { pad: 0.45, line: 0.3 },
};

/** The four pad voices for a chord, moving as little as they can from the last ones. */
export function voicing(chord: Chord, prev: readonly number[] | null): number[] {
  const opts: number[] = [];
  for (let m = 48; m <= 67; m++) if (chord.pcs.includes(pcOf(m))) opts.push(m);
  let best: number[] = [];
  let bestCost = Infinity;
  for (let a = 0; a < opts.length; a++)
    for (let b = a + 1; b < opts.length; b++)
      for (let c = b + 1; c < opts.length; c++)
        for (let d = c + 1; d < opts.length; d++) {
          const v = [opts[a]!, opts[b]!, opts[c]!, opts[d]!];
          if (!chord.pcs.every((p) => v.some((m) => pcOf(m) === p))) continue;
          if (v[1]! - v[0]! > 10 || v[2]! - v[1]! > 9 || v[3]! - v[2]! > 9) continue;
          const cost = prev
            ? v.reduce((s, m, i) => s + Math.abs(m - prev[i]!), 0)
            : v.reduce((s, m) => s + Math.abs(m - 57), 0);
          const k = cost + Math.random() * 0.5;
          if (k < bestCost) {
            bestCost = k;
            best = v;
          }
        }
  return best;
}
/** The midi note of pitch class `pc` nearest `target` within [lo, hi]. */
export function near(pc: number, target: number, lo: number, hi: number): number {
  let best = lo;
  let found = false;
  for (let m = lo; m <= hi; m++)
    if (pcOf(m) === pc && (!found || Math.abs(m - target) < Math.abs(best - target))) {
      best = m;
      found = true;
    }
  return best;
}
/** A step along the scale from `m`, up or down by `n` degrees. */
export function scaleStep(m: number, n: number): number {
  let x = m;
  const dir = Math.sign(n);
  for (let k = 0; k < Math.abs(n); k++) {
    do x += dir;
    while (!SCALE.includes(pcOf(x)));
  }
  return x;
}

interface NoiseOpts {
  type?: BiquadFilterType;
  f: number;
  f2?: number;
  ft?: number;
  Q?: number;
  g: number;
  a?: number;
  hold?: number;
  r?: number;
  pan?: number;
}
interface StringOpts {
  a: number;
  r: number;
  lp: number;
  vib: number;
  uni: number[];
  pan?: number;
}

export interface Music {
  /**
   * The intensity to move toward: 0 calm, 1 fight, 2 boss or low life. Given the context's time, a rise is heard from
   * the next beat; without it (an offline render) changes wait for the next bar.
   */
  setIntensity(x: number, now?: number): void;
  /** Starts the first bar at time `t`. */
  start(t: number): void;
  /** Schedules every bar that begins before `tEnd`; bars already in the past (a stalled page) are skipped. */
  scheduleUntil(tEnd: number, now?: number): void;
  /** The music's own gain, for a duck under a moment (a death). */
  readonly out: GainNode;
}

/** How long a lower intensity must last before the music comes down (seconds): a skirmish at 8x does not flicker it. */
export const FALL_HOLD = 4;

interface BarRecord {
  t: number;
  barInPhrase: number;
  newChord: boolean;
  /** The chord the bar belongs to: when it started and ends, and its voicing and bass. */
  chordStart: number;
  chordEnd: number;
  chord: Chord;
  voices: number[];
  bass: number;
}

export function createMusic(ctx: BaseAudioContext, dest: AudioNode): Music {
  const st = {
    bar: 0,
    nextBarTime: 0,
    intensity: 0,
    target: 0,
    prog: PROGRESSIONS[0]!,
    lastProg: null as Progression | null,
    chord: CHORDS.Dm as Chord,
    voices: null as number[] | null,
    bass: 38,
    line: 57,
    density: 'full' as Density,
    /** When the intensity asked for fell below the playing one (null while it hasn't). */
    lowSince: null as number | null,
    /** The bars scheduled and not yet over, so a rise can join them part way. */
    bars: [] as BarRecord[],
  };

  // Master: the layers, the hall and the grit meet in a gentle compressor; no sub below 30 Hz (phones can't play it,
  // and it drove the compressor); a limiter and a soft clip last, so the loudest boss bar never clips.
  const master = ctx.createGain();
  master.gain.value = 0.55;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -20;
  comp.ratio.value = 3;
  comp.attack.value = 0.02;
  comp.release.value = 0.3;
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 30;
  master.connect(hp);
  hp.connect(comp);
  const lim = ctx.createDynamicsCompressor();
  lim.threshold.value = -4;
  lim.knee.value = 0;
  lim.ratio.value = 20;
  lim.attack.value = 0.003;
  lim.release.value = 0.15;
  comp.connect(lim);
  // The soft clip: linear to 0.7, then rounding off toward 1; its input is halved so the curve covers twice full scale.
  const pre = ctx.createGain();
  pre.gain.value = 0.5;
  const clip = ctx.createWaveShaper();
  const cc = new Float32Array(4096);
  for (let i = 0; i < cc.length; i++) {
    const x = ((i / (cc.length - 1)) * 2 - 1) * 2;
    const a = Math.abs(x);
    cc[i] = Math.sign(x) * (a < 0.7 ? a : 0.7 + 0.3 * Math.tanh((a - 0.7) / 0.3));
  }
  clip.curve = cc;
  const out = ctx.createGain();
  lim.connect(pre);
  pre.connect(clip);
  clip.connect(out);
  out.connect(dest);

  // A dark hall, wide: an independent decaying noise per channel.
  const verb = ctx.createConvolver();
  const irLen = Math.floor(3.4 * ctx.sampleRate);
  const ir = ctx.createBuffer(2, irLen, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < irLen; i++) {
      lp += 0.18 * (Math.random() * 2 - 1 - lp);
      d[i] =
        lp *
        Math.exp(-i / (0.62 * ctx.sampleRate)) *
        (i < 0.02 * ctx.sampleRate ? i / (0.02 * ctx.sampleRate) : 1);
    }
  }
  verb.buffer = ir;
  const verbIn = ctx.createBiquadFilter();
  verbIn.type = 'highpass';
  verbIn.frequency.value = 140;
  verbIn.connect(verb);
  const wet = ctx.createGain();
  wet.gain.value = 0.55;
  verb.connect(wet);
  wet.connect(master);

  // Grit: smooth saturation, so bass carries on small speakers.
  const shaper = ctx.createWaveShaper();
  const curve = new Float32Array(2048);
  for (let i = 0; i < curve.length; i++) {
    const x = (i / (curve.length - 1)) * 2 - 1;
    curve[i] = Math.tanh(3.5 * x) / Math.tanh(3.5);
  }
  shaper.curve = curve;
  shaper.oversample = '2x';
  const dirtIn = ctx.createGain();
  const dirtLp = ctx.createBiquadFilter();
  dirtLp.type = 'lowpass';
  dirtLp.frequency.value = 4500;
  const dirtOut = ctx.createGain();
  dirtOut.gain.value = 0.5;
  dirtIn.connect(shaper);
  shaper.connect(dirtLp);
  dirtLp.connect(dirtOut);
  dirtOut.connect(master);

  const nb = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const nd = nb.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;

  // One gain per layer, with its sends.
  const L = {} as Record<LayerId, { node: GainNode; level: number }>;
  for (const name of LAYER_IDS) {
    const def: LayerDef = LAYERS[name];
    const g = ctx.createGain();
    g.gain.value = 0;
    g.connect(master);
    const sv = ctx.createGain();
    sv.gain.value = def.verb;
    g.connect(sv);
    sv.connect(verbIn);
    if (def.dirt > 0) {
      const sd = ctx.createGain();
      sd.gain.value = def.dirt;
      g.connect(sd);
      sd.connect(dirtIn);
    }
    L[name] = { node: g, level: 0 };
  }

  // ---- Instruments ------------------------------------------------------------------------------------------------
  const envGain = (t: number, peak: number, a: number, hold: number, r: number): GainNode => {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.setValueAtTime(peak, t + a + hold);
    g.gain.setTargetAtTime(0, t + a + hold, r / 3);
    return g;
  };
  const panned = (node: AudioNode, pan?: number): AudioNode => {
    if (!pan) return node;
    const p = ctx.createStereoPanner();
    p.pan.value = pan;
    node.connect(p);
    return p;
  };
  /** A bowed string section voice: detuned saws drifting like players, a body resonance, vibrato that grows in. */
  function strings(
    layer: LayerId,
    t: number,
    m: number,
    dur: number,
    g: number,
    o: StringOpts,
  ): void {
    const out = envGain(t, g, o.a, Math.max(0, dur - o.a), o.r);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = o.lp;
    lp.Q.value = 0.4;
    const body = ctx.createBiquadFilter();
    body.type = 'peaking';
    body.frequency.value = 420;
    body.Q.value = 1;
    body.gain.value = 5;
    lp.connect(body);
    body.connect(out);
    panned(out, o.pan).connect(L[layer].node);
    const end = t + dur + o.r * 3;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = rand(4.6, 5.4);
    const depth = ctx.createGain();
    depth.gain.setValueAtTime(0, t);
    depth.gain.linearRampToValueAtTime(o.vib, t + Math.min(dur, 0.6));
    lfo.connect(depth);
    lfo.start(t);
    lfo.stop(end);
    for (const det of o.uni) {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = hzM(m);
      osc.detune.value = det + rand(-3, 3);
      const drift = ctx.createOscillator();
      drift.frequency.value = rand(0.15, 0.45);
      const dg = ctx.createGain();
      dg.gain.value = rand(3, 6);
      drift.connect(dg);
      dg.connect(osc.detune);
      drift.start(t);
      drift.stop(end);
      depth.connect(osc.detune);
      osc.connect(lp);
      osc.start(t);
      osc.stop(end);
    }
    // A breath of bow noise on the attack keeps it from sounding like a synth.
    const n = ctx.createBufferSource();
    n.buffer = nb;
    const nf = ctx.createBiquadFilter();
    nf.type = 'bandpass';
    nf.frequency.value = Math.min(4000, hzM(m) * 6);
    nf.Q.value = 1.2;
    const ng = envGain(t, g * 0.12, 0.05, 0.05, 0.3);
    n.connect(nf);
    nf.connect(ng);
    ng.connect(out);
    n.start(t, Math.random());
    n.stop(t + 1);
  }
  function drone(t: number, dur: number): void {
    const out = envGain(t, 0.5, 1.6, Math.max(0, dur - 1.6), 2.2);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 2;
    lp.frequency.setValueAtTime(170, t);
    lp.frequency.linearRampToValueAtTime(rand(260, 340), t + dur * 0.5);
    lp.frequency.linearRampToValueAtTime(180, t + dur + 1);
    lp.connect(out);
    out.connect(L.drone.node);
    const end = t + dur + 7;
    for (const [m, det] of [
      [26, -7],
      [38, 5],
      [38, -4],
    ] as const) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = hzM(m);
      o.detune.value = det;
      o.connect(lp);
      o.start(t);
      o.stop(end);
    }
    const sub = ctx.createOscillator();
    sub.frequency.value = hzM(26);
    const sg = ctx.createGain();
    sg.gain.value = 0.3;
    sub.connect(sg);
    sg.connect(out);
    sub.start(t);
    sub.stop(end);
  }
  function boom(layer: LayerId, t: number, f0: number, f1: number, tau: number, g: number): void {
    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f1, t + tau * 4);
    const out = envGain(t, g, 0.002, 0, tau * 3);
    o.connect(out);
    out.connect(L[layer].node);
    o.start(t);
    o.stop(t + tau * 10);
  }
  function noise(layer: LayerId, t: number, o: NoiseOpts): void {
    const s = ctx.createBufferSource();
    s.buffer = nb;
    const f = ctx.createBiquadFilter();
    f.type = o.type ?? 'bandpass';
    f.Q.value = o.Q ?? 1;
    if (o.f2) {
      f.frequency.setValueAtTime(o.f, t);
      f.frequency.exponentialRampToValueAtTime(o.f2, t + (o.ft ?? 0.1));
    } else f.frequency.value = o.f;
    const a = o.a ?? 0.002,
      hold = o.hold ?? 0,
      r = o.r ?? 0.03;
    const out = envGain(t, o.g, a, hold, r);
    s.connect(f);
    f.connect(out);
    panned(out, o.pan).connect(L[layer].node);
    s.start(t, Math.random() * 1.5);
    s.stop(t + a + hold + r * 3 + 0.05);
  }
  /** The bass pulse: a plucked, rounded low note with no resonant zap, so it sits under the drums. */
  function pluckBass(t: number, m: number, g: number, open: number): void {
    const out = envGain(t, g, 0.006, 0.05, 0.1);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 0.8;
    lp.frequency.setValueAtTime(150, t);
    lp.frequency.exponentialRampToValueAtTime(320 + 260 * open, t + 0.015);
    lp.frequency.exponentialRampToValueAtTime(170, t + 0.14);
    lp.connect(out);
    out.connect(L.pulse.node);
    for (const det of [-5, 5]) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = hzM(m);
      o.detune.value = det;
      o.connect(lp);
      o.start(t);
      o.stop(t + 0.45);
    }
  }
  /** A bar's worth of the fast strings' body: the resonances of a viola or cello's wooden box. */
  function stringBody(pan: number): AudioNode {
    const chain = (
      [
        [260, 1.3, 5],
        [880, 1.8, 3],
        [2300, 2.2, 4],
      ] as const
    ).map(([fr, Q, gain]) => {
      const p = ctx.createBiquadFilter();
      p.type = 'peaking';
      p.frequency.value = fr * rand(0.96, 1.04);
      p.Q.value = Q;
      p.gain.value = gain;
      return p;
    });
    for (let i = 1; i < chain.length; i++) chain[i - 1]!.connect(chain[i]!);
    const top = ctx.createBiquadFilter();
    top.type = 'lowpass';
    top.frequency.value = 5000;
    chain[chain.length - 1]!.connect(top);
    panned(top, pan).connect(L.ost.node);
    return chain[0]!;
  }
  /**
   * One short bowed note by a small section: each player a little late or early, a little sharp or flat, scooping up
   * into the pitch, bright at the bite and darkening as it dies, with the bow's scrape on top.
   */
  function spiccato(t: number, m: number, g: number, body: AudioNode): void {
    const f = hzM(m);
    for (let p = 0; p < 3; p++) {
      const t0 = t + rand(0, 0.014);
      const amp = envGain(t0, (g / 3) * rand(0.8, 1.1), rand(0.008, 0.016), 0.02, rand(0.06, 0.09));
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.Q.value = 0.6;
      lp.frequency.setValueAtTime(3600, t0);
      lp.frequency.exponentialRampToValueAtTime(1100, t0 + 0.14);
      lp.connect(amp);
      amp.connect(body);
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      const cents = rand(-9, 9);
      o.frequency.setValueAtTime(f * Math.pow(2, (cents - 25) / 1200), t0);
      o.frequency.exponentialRampToValueAtTime(f * Math.pow(2, cents / 1200), t0 + 0.03);
      o.connect(lp);
      o.start(t0);
      o.stop(t0 + 0.4);
    }
    noise('ost', t, { f: rand(2600, 3600), Q: 0.9, g: g * 0.35, a: 0.003, r: 0.02 });
  }
  /** A low choir "aah": a buzzy source shaped by vowel formants. */
  function choirVoice(t: number, m: number, dur: number, g: number, pan: number): void {
    const out = envGain(t, g, 1.1, Math.max(0, dur - 1.1), 1.6);
    panned(out, pan).connect(L.choir.node);
    const voice = ctx.createGain();
    for (const [f, Q, fg] of [
      [700, 5, 1],
      [1150, 6, 0.5],
      [2550, 9, 0.15],
    ] as const) {
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = f * rand(0.97, 1.03);
      bp.Q.value = Q;
      const fgN = ctx.createGain();
      fgN.gain.value = fg;
      voice.connect(bp);
      bp.connect(fgN);
      fgN.connect(out);
    }
    const end = t + dur + 6;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = rand(4.8, 5.6);
    const depth = ctx.createGain();
    depth.gain.value = 12;
    lfo.connect(depth);
    lfo.start(t);
    lfo.stop(end);
    for (const det of [-9, -2, 6, 12]) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = hzM(m);
      o.detune.value = det;
      depth.connect(o.detune);
      o.connect(voice);
      o.start(t);
      o.stop(end);
    }
  }
  /** The low swell in the boss tier: gritty detuned saws whose filter opens and closes over the chord. */
  function braam(t: number): void {
    for (const m of [st.bass - 12, st.bass, st.bass + 7]) {
      const out = envGain(t, 0.22, 0.06, BAR * 0.9, 1.4);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.Q.value = 2.5;
      lp.frequency.setValueAtTime(160, t);
      lp.frequency.exponentialRampToValueAtTime(1300, t + 0.7);
      lp.frequency.exponentialRampToValueAtTime(220, t + BAR * 1.6);
      lp.connect(out);
      out.connect(L.braam.node);
      for (const det of [-14, 0, 11]) {
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = hzM(m);
        o.detune.value = det;
        o.connect(lp);
        o.start(t);
        o.stop(t + BAR * 2 + 4);
      }
    }
  }

  // ---- The score --------------------------------------------------------------------------------------------------
  const levelOf = (name: LayerId, x: number): number => {
    const d = DENSITY[st.density];
    const dens = name === 'pad' ? d.pad : name === 'line' ? d.line : 1;
    // Density only thins the calm: by the fight every layer plays as written.
    const calm = clamp(1 - x, 0, 1);
    return LAYERS[name].mix * curveAt(LAYERS[name].curve, x) * (1 - calm + calm * dens);
  };

  function newPhrase(): void {
    const x = st.intensity;
    const w = (p: Progression): number =>
      x <= 1
        ? p.mood[0] + (p.mood[1] - p.mood[0]) * x
        : p.mood[1] + (p.mood[2] - p.mood[1]) * (x - 1);
    st.lastProg = st.prog;
    st.prog = wpick(PROGRESSIONS.filter((p) => p !== st.lastProg).map((p) => [p, w(p)]));
    st.density = wpick<Density>([
      ['full', 0.45],
      ['thin', 0.35],
      ['sparse', 0.2],
    ]);
  }

  function chordNotes(t: number, on: Record<LayerId, boolean>, dur = BAR * CHORD_BARS): void {
    const voices = st.voices!;
    if (on.drone) drone(t, dur + 0.4);
    if (on.pad)
      voices.forEach((m, i) =>
        strings('pad', t, m, dur - 0.2, 0.11, {
          a: 1.3,
          r: 1.8,
          lp: 1250,
          vib: 6,
          uni: [-11, -3, 4, 10],
          pan: [-0.45, -0.15, 0.15, 0.45][i],
        }),
      );
    if (on.braam) braam(t);
    if (on.choir)
      voices
        .slice(1)
        .forEach((m, i) =>
          choirVoice(t, m - 12 + (i === 2 ? 12 : 0), dur - 0.3, 0.09, [-0.3, 0.3, 0][i]!),
        );
    if (on.line) lineNotes(t);
  }

  /** The low cello line: sparse, mostly stepwise, landing on chord tones. */
  function lineNotes(t: number): void {
    const chord = st.chord;
    if (!chance(0.35 + 0.6 * DENSITY[st.density].line)) return;
    const rhythm = pick<[number, number][]>([
      [[0, 6]],
      [
        [0, 3],
        [4, 3],
      ],
      [[2, 5]],
      [
        [0, 3],
        [3, 1],
        [4, 4],
      ],
      [
        [1, 2],
        [3, 2],
        [5, 3],
      ],
    ]);
    let m = near(pick(chord.pcs.slice(1).concat(chord.pcs)), st.line, 50, 66);
    rhythm.forEach(([beat, len], i) => {
      if (i > 0) {
        m = clamp(scaleStep(m, pick([-1, -1, -2, 1, 1, 2])), 50, 66);
        if (i === rhythm.length - 1) m = near(pick(chord.pcs), m, 50, 66);
      }
      strings('line', t + beat * BEAT, m, len * BEAT - 0.1, 0.16, {
        a: 0.18,
        r: 0.7,
        lp: 1100,
        vib: 11,
        uni: [-5, 4],
        pan: -0.25,
      });
      st.line = m;
    });
  }

  const KICKS = [
    [0, 8],
    [0, 6, 8],
    [0, 3, 8, 11],
    [0, 8, 10],
  ];
  const TAIKO = [
    [0, 3, 8, 11],
    [0, 6, 8, 14],
    [0, 2, 8, 10, 12],
  ];
  function barNotes(t: number, on: Record<LayerId, boolean>, barInPhrase: number, from = 0): void {
    const root = st.chord.pcs[0]!;
    if (on.pulse) {
      const pattern = pick([
        [0, 2, 4, 6, 8, 10, 12, 14],
        [0, 3, 4, 6, 8, 11, 12, 14],
        [0, 2, 3, 4, 6, 8, 10, 11, 12, 14],
      ]);
      for (const s of pattern) {
        if (s < from) continue;
        const up = s === 6 && chance(0.25) ? 12 : s === 14 && chance(0.3) ? 7 : 0;
        pluckBass(t + s * STEP, st.bass + up, s % 8 === 0 ? 0.34 : 0.24, s % 8 === 0 ? 1 : 0.5);
      }
    }
    if (on.perc) {
      for (const s of pick(KICKS).filter((x) => x >= from)) {
        boom('perc', t + s * STEP, 95, 48, 0.07, 0.7);
        noise('perc', t + s * STEP, { type: 'lowpass', f: 320, g: 0.35, r: 0.04 });
      }
      for (const s of [4, 12].filter((x) => x >= from)) {
        noise('perc', t + s * STEP, { f: 1800, Q: 2, g: 0.28, r: 0.03, pan: 0.15 });
        boom('perc', t + s * STEP, 380, 300, 0.015, 0.12);
      }
      for (let s = from + (from % 2); s < 16; s += 2)
        noise('perc', t + s * STEP + rand(0, 0.006), {
          type: 'highpass',
          f: 6000,
          g: s % 4 === 0 ? 0.13 : 0.08,
          r: 0.05,
          pan: 0.3,
        });
    }
    if (on.heavy) {
      for (const s of pick(TAIKO).filter((x) => x >= from)) {
        boom('heavy', t + s * STEP, 82, 40, 0.11, 0.8);
        noise('heavy', t + s * STEP, { f: 700, f2: 260, ft: 0.08, Q: 0.8, g: 0.75, r: 0.07 });
      }
      for (const s of [4, 12].filter((x) => x >= from)) {
        noise('heavy', t + s * STEP, { f: 1500, Q: 0.8, g: 0.5, r: 0.09 });
        boom('heavy', t + s * STEP, 200, 150, 0.03, 0.3);
      }
      // A tom fill closing every phrase.
      if (barInPhrase === PHRASE_BARS - 1)
        for (let s = Math.max(8, from); s < 16; s++)
          boom('heavy', t + s * STEP, 170 - s * 6, 90 - s * 3, 0.05, 0.35 + s * 0.03);
    }
    if (on.ost) {
      // A repeated note driven by accents, as a string section plays an action ostinato, with a turn now and then.
      const base = near(root, 45, 38, 49);
      const turn = pick<[number, number] | null>([null, null, [12, 7], [7, 7], [12, 12]]);
      const accents = pick([
        [0, 4, 8, 12],
        [0, 3, 6, 8, 11, 14],
        [0, 4, 6, 8, 12, 14],
      ]);
      const body = stringBody(0.35);
      for (let s = from; s < 16; s++) {
        const m = turn && s >= 12 ? base + turn[s % 2]! : base;
        spiccato(t + s * STEP + rand(0, 0.006), m, accents.includes(s) ? 0.2 : 0.11, body);
      }
    }
  }

  function scheduleBar(t: number): void {
    if (st.target > st.intensity) st.intensity = st.target;
    else if (st.target < st.intensity && st.lowSince !== null && t - st.lowSince >= FALL_HOLD)
      st.intensity = st.target;
    const barInPhrase = st.bar % PHRASE_BARS;
    if (barInPhrase === 0) newPhrase();
    const newChord = barInPhrase % CHORD_BARS === 0;
    if (newChord) {
      st.chord = CHORDS[st.prog.chords[Math.floor(barInPhrase / CHORD_BARS)]!];
      st.voices = voicing(st.chord, st.voices);
      st.bass = near(st.chord.pcs[0]!, st.bass, 33, 45);
    }
    const on = {} as Record<LayerId, boolean>;
    for (const name of LAYER_IDS) {
      const now = levelOf(name, st.intensity);
      const prev = L[name].level;
      on[name] = now > 0.001 || prev > 0.001;
      const g = L[name].node.gain;
      g.setValueAtTime(prev, t);
      g.linearRampToValueAtTime(now, t + BAR * 0.9);
      L[name].level = now;
    }
    // Chord-long layers start with the chord; one fading in starts now so it can grow.
    if (newChord) chordNotes(t, on);
    barNotes(t, on, barInPhrase);
    const prevRec = st.bars[st.bars.length - 1];
    const chordStart = newChord || !prevRec ? t : prevRec.chordStart;
    st.bars.push({
      t,
      barInPhrase,
      newChord,
      chordStart,
      chordEnd: chordStart + BAR * CHORD_BARS,
      chord: st.chord,
      voices: st.voices!,
      bass: st.bass,
    });
    if (st.bars.length > 4) st.bars.shift();
  }

  /** Runs `fn` with a scheduled bar's chord, voicing and bass in place (the state has moved on to later bars). */
  function asOf(b: BarRecord, fn: () => void): void {
    const keep = { chord: st.chord, voices: st.voices, bass: st.bass };
    st.chord = b.chord;
    st.voices = b.voices;
    st.bass = b.bass;
    fn();
    st.chord = keep.chord;
    st.voices = keep.voices;
    st.bass = keep.bass;
  }

  /**
   * A rise, heard from the next beat: every layer fades to its new level within a third of a second, and the layers
   * it brings in are scheduled for what is left of the bars already scheduled and of the chord.
   */
  function rise(x: number, now: number): void {
    const before = {} as Record<LayerId, number>;
    for (const name of LAYER_IDS) before[name] = L[name].level;
    st.intensity = x;
    const live = st.bars.filter((b) => b.t + BAR > now);
    const first = live[0];
    if (!first) return;
    const tb = first.t + Math.ceil(Math.max(0, now + 0.06 - first.t) / BEAT) * BEAT;
    const on = {} as Record<LayerId, boolean>;
    for (const name of LAYER_IDS) {
      const lv = levelOf(name, x);
      const g = L[name].node.gain;
      g.cancelScheduledValues(now);
      g.setValueAtTime(g.value, now);
      g.linearRampToValueAtTime(lv, tb + 0.3);
      on[name] = before[name] <= 0.001 && lv > 0.001;
      L[name].level = lv;
    }
    if (!LAYER_IDS.some((n) => on[n])) return;
    for (const b of live) {
      const from = Math.round((Math.max(b.t, tb) - b.t) / STEP);
      if (from < 16) asOf(b, () => barNotes(b.t, on, b.barInPhrase, from));
      // A chord starting in a bar already scheduled gets the new layers in full; the chord under way, for its rest.
      if (b.newChord && b.t >= tb) asOf(b, () => chordNotes(b.t, on));
      else if (
        b.chordStart < tb &&
        tb < b.chordEnd - 0.8 &&
        b === live.find((x) => x.chordStart === b.chordStart)
      )
        asOf(b, () => chordNotes(tb, on, b.chordEnd - tb));
    }
  }

  return {
    out,
    setIntensity(x, now) {
      st.target = clamp(x, 0, 2);
      if (st.target > st.intensity + 0.01) {
        st.lowSince = null;
        if (now !== undefined) rise(st.target, now);
      } else if (st.target < st.intensity - 0.01) st.lowSince ??= now ?? -Infinity;
      else st.lowSince = null;
    },
    start(t) {
      st.nextBarTime = t;
    },
    scheduleUntil(tEnd, now) {
      // A page that stalled (a background tab) skips the bars it missed rather than playing them all at once.
      if (now !== undefined && st.nextBarTime < now - 0.05)
        st.nextBarTime += Math.ceil((now - st.nextBarTime) / BAR) * BAR;
      while (st.nextBarTime < tEnd) {
        scheduleBar(st.nextBarTime);
        st.nextBarTime += BAR;
        st.bar++;
      }
    },
  };
}
