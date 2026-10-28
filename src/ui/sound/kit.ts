// The building blocks of Bob's sounds (docs/AUDIO.md), synthesised with Web Audio in an OfflineAudioContext: filtered
// noise, ringing partials, booms, friction pulses, pitched voices with filters or vowel formants, a dark stone room and a
// smooth saturation. Every render draws fresh random grains and small shifts, so no two takes are alike.

export const SR = 44100;

/** A frequency, or a ramp of [seconds from the start, frequency] points (exponential between them). */
export type Freq = number | [number, number][];

export interface NoiseOpts {
  /** Filter type; band-pass by default. */
  type?: BiquadFilterType;
  f: Freq;
  Q?: number;
  /** Peak gain, attack, hold and decay time constant (seconds). */
  g?: number;
  a?: number;
  hold?: number;
  tau?: number;
  /** Shares sent to the room and to the saturation. */
  send?: number;
  dirt?: number;
}

export interface ToneOpts {
  type?: OscillatorType;
  f: number;
  /** Glide to `f2` over `glide` seconds, starting after `glideAt`. */
  f2?: number;
  glide?: number;
  glideAt?: number;
  /** Unison voices, detuned in cents. */
  uni?: number[];
  /** Vibrato: rate in Hz, depth in cents. */
  vib?: [number, number];
  a?: number;
  hold?: number;
  tau?: number;
  g?: number;
  /** A low-pass sweep, or vowel formants ([frequency, Q, gain, frequency it glides to]). */
  lp?: { f: [number, number][]; Q?: number };
  formants?: [number, number, number, number?][];
  send?: number;
  dirt?: number;
}

export interface BoomOpts {
  f0: number;
  f1: number;
  tau?: number;
  hold?: number;
  g?: number;
  send?: number;
  dirt?: number;
}

export interface Kit {
  noise(t: number, o: NoiseOpts): void;
  mode(t: number, f: number, tau: number, gain: number, send?: number): void;
  thump(t: number, f0: number, f1: number, tau: number, gain: number, send?: number): void;
  creak(
    t: number,
    times: [number, number][],
    filters: [number, number, number][],
    gain: number,
    send?: number,
  ): void;
  tone(t: number, o: ToneOpts): void;
  boom(t: number, o: BoomOpts): void;
}

export type Recipe = (k: Kit) => void;

const SEMI: Record<string, number> = {
  C: -9,
  'C#': -8,
  D: -7,
  'D#': -6,
  Eb: -6,
  E: -5,
  F: -4,
  'F#': -3,
  G: -2,
  'G#': -1,
  A: 0,
  Bb: 1,
  B: 2,
};

/** The frequency of a note name such as 'D3' or 'F#4'. */
export function hz(n: string): number {
  const m = /^([A-G][#b]?)(-?\d)$/.exec(n);
  if (!m) throw new Error(`not a note: ${n}`);
  return 440 * Math.pow(2, (SEMI[m[1]!]! + (Number(m[2]) - 4) * 12) / 12);
}
export const rand = (a: number, b: number): number => a + Math.random() * (b - a);
export const logRand = (a: number, b: number): number => a * Math.pow(b / a, Math.random());
export const jit = (x: number, p: number): number => x * rand(1 - p, 1 + p);

/** Builds a sound of at most `dur` seconds in an offline context and renders it. */
export async function build(dur: number, recipe: Recipe): Promise<Float32Array> {
  const c = new OfflineAudioContext(1, Math.ceil(dur * SR), SR);
  const dry = c.createGain();
  dry.connect(c.destination);

  // A dark stone room: a convolver fed with decaying, low-passed noise. Nothing below 160 Hz goes in, so it never booms.
  const verb = c.createConvolver();
  const irLen = Math.floor(2.4 * SR);
  const ir = c.createBuffer(1, irLen, SR);
  const d = ir.getChannelData(0);
  let lp = 0;
  for (let i = 0; i < irLen; i++) {
    lp += 0.22 * (Math.random() * 2 - 1 - lp);
    d[i] = lp * Math.exp(-i / (0.36 * SR)) * (i < 0.012 * SR ? i / (0.012 * SR) : 1);
  }
  verb.buffer = ir;
  const verbIn = c.createBiquadFilter();
  verbIn.type = 'highpass';
  verbIn.frequency.value = 160;
  verbIn.connect(verb);
  const wet = c.createGain();
  wet.gain.value = 0.7;
  verb.connect(wet);
  wet.connect(c.destination);

  const nb = c.createBuffer(1, SR, SR);
  const nd = nb.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;

  // Dirt: a smooth saturating waveshaper. It makes noise crunchy and gives bass the overtones that let a phone speaker
  // (which plays almost nothing below 150 Hz) carry it. A stepped curve turned quiet tails into square-wave buzz.
  const shaper = c.createWaveShaper();
  const curve = new Float32Array(2048);
  for (let i = 0; i < curve.length; i++) {
    const x = (i / (curve.length - 1)) * 2 - 1;
    curve[i] = Math.tanh(4 * x) / Math.tanh(4);
  }
  shaper.curve = curve;
  shaper.oversample = '2x';
  const dirtIn = c.createGain();
  const dirtLp = c.createBiquadFilter();
  dirtLp.type = 'lowpass';
  dirtLp.frequency.value = 5500;
  dirtIn.connect(shaper);
  shaper.connect(dirtLp);
  const dirtOut = c.createGain();
  dirtOut.gain.value = 0.55;
  dirtLp.connect(dirtOut);
  dirtOut.connect(dry);
  const dirtVerb = c.createGain();
  dirtVerb.gain.value = 0.15;
  dirtOut.connect(dirtVerb);
  dirtVerb.connect(verbIn);

  const route = (node: AudioNode, send = 0, dirt = 0): void => {
    node.connect(dry);
    if (send > 0) {
      const s = c.createGain();
      s.gain.value = send;
      node.connect(s);
      s.connect(verbIn);
    }
    if (dirt > 0) {
      const s = c.createGain();
      s.gain.value = dirt;
      node.connect(s);
      s.connect(dirtIn);
    }
  };
  const env = (
    g: GainNode,
    t: number,
    peak: number,
    a: number,
    hold: number,
    tau: number,
  ): void => {
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.setValueAtTime(peak, t + a + hold);
    g.gain.setTargetAtTime(0, t + a + hold, tau);
  };
  const end = (a: number, hold: number, tau: number): number => a + hold + tau * 8 + 0.02;
  const ramp = (param: AudioParam, t: number, pts: [number, number][]): void => {
    param.setValueAtTime(pts[0]![1], t);
    for (const [dt, v] of pts.slice(1)) param.exponentialRampToValueAtTime(v, t + dt);
  };

  const K: Kit = {
    noise(t, o) {
      const a = o.a ?? 0.0005,
        hold = o.hold ?? 0,
        tau = o.tau ?? 0.003;
      const s = c.createBufferSource();
      s.buffer = nb;
      s.loop = true;
      const f = c.createBiquadFilter();
      f.type = o.type ?? 'bandpass';
      f.Q.value = o.Q ?? 1;
      if (Array.isArray(o.f)) ramp(f.frequency, t, o.f);
      else f.frequency.value = o.f;
      const g = c.createGain();
      env(g, t, o.g ?? 1, a, hold, tau);
      s.connect(f);
      f.connect(g);
      route(g, o.send, o.dirt);
      s.start(t, Math.random() * 0.9);
      s.stop(t + end(a, hold, tau));
    },
    mode(t, f, tau, gain, send) {
      const o = c.createOscillator();
      o.frequency.value = f;
      const g = c.createGain();
      env(g, t, gain, 0.0003, 0, tau);
      o.connect(g);
      route(g, send);
      o.start(t);
      o.stop(t + end(0, 0, tau));
    },
    thump(t, f0, f1, tau, gain, send) {
      const o = c.createOscillator();
      ramp(o.frequency, t, [
        [0, f0],
        [tau * 4, f1],
      ]);
      const g = c.createGain();
      env(g, t, gain, 0.001, 0, tau);
      o.connect(g);
      route(g, send);
      o.start(t);
      o.stop(t + end(0, 0, tau));
    },
    creak(t, times, filters, gain, send) {
      const b = c.createBuffer(1, Math.ceil((times[times.length - 1]![0] + 0.02) * SR), SR);
      const bd = b.getChannelData(0);
      for (const [tt, amp] of times) bd[Math.floor(tt * SR)] = amp;
      const s = c.createBufferSource();
      s.buffer = b;
      const g = c.createGain();
      g.gain.value = gain;
      for (const [fr, Q, fg] of filters) {
        const f = c.createBiquadFilter();
        f.type = 'bandpass';
        f.frequency.value = fr;
        f.Q.value = Q;
        const fgN = c.createGain();
        fgN.gain.value = fg;
        s.connect(f);
        f.connect(fgN);
        fgN.connect(g);
      }
      route(g, send);
      s.start(t);
    },
    tone(t, o) {
      const a = o.a ?? 0.005,
        hold = o.hold ?? 0,
        tau = o.tau ?? 0.2;
      const g = c.createGain();
      env(g, t, o.g ?? 0.3, a, hold, tau);
      let head: AudioNode = g;
      if (o.lp) {
        const f = c.createBiquadFilter();
        f.type = 'lowpass';
        f.Q.value = o.lp.Q ?? 0.7;
        ramp(f.frequency, t, o.lp.f);
        f.connect(g);
        head = f;
      } else if (o.formants) {
        // Vowel formants: parallel band-passes that make a buzzy source sing "aah".
        head = c.createGain();
        for (const [ff, Q, fg, ff2] of o.formants) {
          const f = c.createBiquadFilter();
          f.type = 'bandpass';
          if (ff2)
            ramp(f.frequency, t, [
              [0, ff],
              [a + hold + tau * 2, ff2],
            ]);
          else f.frequency.value = ff;
          f.Q.value = Q;
          const fgN = c.createGain();
          fgN.gain.value = fg;
          head.connect(f);
          f.connect(fgN);
          fgN.connect(g);
        }
      }
      const uni = o.uni ?? [0];
      let depth: GainNode | null = null;
      if (o.vib) {
        const lfo = c.createOscillator();
        lfo.frequency.value = o.vib[0];
        depth = c.createGain();
        depth.gain.value = o.vib[1];
        lfo.connect(depth);
        lfo.start(t);
        lfo.stop(t + end(a, hold, tau));
      }
      for (const cents of uni) {
        const osc = c.createOscillator();
        osc.type = o.type ?? 'sine';
        osc.detune.value = cents;
        if (o.f2) {
          const glide = o.glide ?? 0.3;
          ramp(
            osc.frequency,
            t,
            o.glideAt
              ? [
                  [0, o.f],
                  [o.glideAt, o.f],
                  [o.glideAt + glide, o.f2],
                ]
              : [
                  [0, o.f],
                  [glide, o.f2],
                ],
          );
        } else osc.frequency.value = o.f;
        if (depth) depth.connect(osc.detune);
        const vg = c.createGain();
        vg.gain.value = 1 / uni.length;
        osc.connect(vg);
        vg.connect(head);
        osc.start(t);
        osc.stop(t + end(a, hold, tau));
      }
      route(g, o.send, o.dirt);
    },
    boom(t, o) {
      const tau = o.tau ?? 0.08;
      const g = c.createGain();
      env(g, t, o.g ?? 1, 0.001, o.hold ?? 0, tau);
      for (const [mul, vg] of [
        [1, 1],
        [2, 0.35],
      ] as const) {
        const osc = c.createOscillator();
        ramp(osc.frequency, t, [
          [0, o.f0 * mul],
          [tau * 4, o.f1 * mul],
        ]);
        const v = c.createGain();
        v.gain.value = vg;
        osc.connect(v);
        v.connect(g);
        osc.start(t);
        osc.stop(t + end(0, o.hold ?? 0, tau));
      }
      route(g, o.send, o.dirt);
    },
  };

  recipe(K);
  const buf = await c.startRendering();
  return buf.getChannelData(0).slice();
}

/**
 * Scales a render to a loudness (RMS over its loud part, in dBFS), caps the peak and trims the silent tail. Loudness is
 * measured through a 150 Hz high-pass, roughly how the ear (and a phone speaker) weighs deep bass.
 */
export function level(data: Float32Array, db: number): Float32Array {
  let peak = 0;
  for (const v of data) peak = Math.max(peak, Math.abs(v));
  let last = data.length;
  while (last > 0 && Math.abs(data[last - 1]!) < peak * 0.001) last--;
  const hp = new Float32Array(last);
  const k = Math.exp((-2 * Math.PI * 150) / SR);
  for (let i = 1, y = 0; i < last; i++) hp[i] = y = k * (y + data[i]! - data[i - 1]!);
  const win = Math.round(SR / 100);
  const w: number[] = [];
  for (let i = 0; i + win <= last; i += win) {
    let s = 0;
    for (let j = i; j < i + win; j++) s += hp[j]! * hp[j]!;
    w.push(Math.sqrt(s / win));
  }
  const top = Math.max(...w, 1e-9);
  const loud = w.filter((x) => x > top / 10);
  const rms = Math.sqrt(loud.reduce((a, x) => a + x * x, 0) / Math.max(1, loud.length)) || 1e-9;
  let g = Math.pow(10, db / 20) / rms;
  if (peak * g > 0.9) g = 0.9 / peak;
  const n = Math.min(data.length, last + win);
  const out = new Float32Array(n);
  const fade = Math.min(n, win);
  for (let i = 0; i < n; i++) out[i] = data[i]! * g * (i > n - fade ? (n - i) / fade : 1);
  return out;
}
