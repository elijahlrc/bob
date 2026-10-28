// The first pass of Bob's sounds (docs/AUDIO.md, "First pass: twelve sounds"), as the owner approved them by ear on
// 2026-10-27. Change one only by ear: the comments say what was asked for and why a part is the way it is.
import { hz, jit, logRand, rand, type Kit, type Recipe } from './kit';

const press: Recipe = (K) => {
  K.noise(0, { f: jit(2400, 0.05), Q: 1.2, g: 0.8, tau: 0.0012 });
  K.mode(0, jit(600, 0.03), 0.01, 0.5);
  K.mode(0, jit(1400, 0.03), 0.007, 0.3);
  K.mode(0, 2700, 0.004, 0.15);
};

const denied: Recipe = (K) => {
  for (const [t, k] of [
    [0, 1],
    [0.085 + rand(-0.006, 0.006), 0.86],
  ] as const) {
    K.noise(t, { type: 'lowpass', f: 900 * k, Q: 0.8, g: 0.9, tau: 0.004 });
    K.thump(t, 220 * k, 150 * k, 0.015, 0.6);
    K.mode(t, 330 * k, 0.02, 0.3);
  }
};

const page: Recipe = (K) => {
  K.noise(0.01, {
    f: [
      [0, 700],
      [0.14, 2600],
      [0.25, 1000],
    ],
    Q: 0.6,
    g: 0.25,
    a: 0.1,
    hold: 0.06,
    tau: 0.03,
  });
  for (let i = 0; i < 45; i++)
    K.noise(0.02 + (0.22 * (Math.random() + Math.random())) / 2, {
      f: logRand(1500, 7000),
      Q: rand(2, 5),
      g: rand(0.2, 0.6),
      tau: rand(0.002, 0.005),
    });
  // The page settles with a soft paper pat, no thump (the owner: too much of a clunk at the end).
  K.noise(0.25 + rand(-0.015, 0.015), { f: 1800, Q: 0.6, g: 0.28, a: 0.004, tau: 0.012 });
};

// A latch is a short, dull metal clack, not a ring: wide bands that die in a few ms (narrow resonant bands read as a
// bell), a slide of the bolt between lift and drop, and a low knock.
const clack = (K: Kit, t: number, v: number, k: number): void => {
  K.noise(t, { f: 900 * k, Q: 1.2, g: 0.6 * v, a: 0.001, tau: 0.006 });
  for (const [f, Q, tau, g] of [
    [1400, 4, 0.008, 0.9],
    [2300, 4, 0.006, 0.7],
    [3600, 3, 0.004, 0.5],
  ] as const)
    K.noise(t, { f: f * k * rand(0.95, 1.05), Q, g: g * v, a: 0.0006, tau, send: 0.15 });
};
const latch = (K: Kit, t0: number, v: number): void => {
  const k = rand(0.95, 1.05);
  clack(K, t0, 0.4 * v, k * 1.1); // lifted
  K.noise(t0 + 0.02, {
    f: [
      [0, 1800],
      [0.07, 2600],
    ],
    Q: 2,
    g: 0.12 * v,
    a: 0.03,
    tau: 0.02,
  }); // the bolt slides
  const t = t0 + 0.1 + rand(-0.01, 0.01);
  clack(K, t, v, k); // dropped back
  K.noise(t, { type: 'lowpass', f: 500, g: 0.4 * v, a: 0.001, tau: 0.012 });
};

// The parts overlap so they read as one door: the hinge starts as the latch lifts, and the door lands while the hinge
// is still going, all in one room.
const begin: Recipe = (K) => {
  latch(K, 0, 0.8);
  const t0 = 0.07,
    t1 = 0.72;
  // The hinge: stick-slip fast enough to be heard as a squeal that rises and sags.
  const times: [number, number][] = [];
  for (let t = t0; t < t1;) {
    const u = (t - t0) / (t1 - t0);
    times.push([
      t,
      (0.7 + 0.3 * Math.random()) *
        Math.sin(Math.PI * Math.min(1, u * 1.1)) *
        (u > 0.85 ? (1 - u) / 0.15 : 1),
    ]);
    t += (1 / (45 + 110 * Math.sin(Math.PI * Math.pow(u, 0.8)))) * rand(0.92, 1.1);
  }
  K.creak(
    0,
    times,
    [
      [680, 7, 1],
      [1350, 6, 0.6],
      [2150, 5, 0.2],
      [230, 3, 0.45],
    ],
    20,
    0.25,
  );
  // The door's swing through the air carries the parts into each other.
  K.noise(0.03, {
    type: 'lowpass',
    f: [
      [0, 300],
      [0.4, 700],
      [0.68, 400],
    ],
    Q: 0.5,
    g: 0.1,
    a: 0.3,
    hold: 0.3,
    tau: 0.04,
    send: 0.2,
  });
  // The door shuts, "ku-chunk": "ku" is the door meeting the frame, a dry wooden thud with pitch (a wash of noise
  // sounded like a muffled cymbal); "chunk" is the bolt snapping home.
  const s = t1 - 0.05;
  K.noise(s - 0.045, {
    type: 'lowpass',
    f: [
      [0, 300],
      [0.045, 900],
    ],
    g: 0.2,
    a: 0.04,
    tau: 0.01,
  });
  K.boom(s, { f0: 150, f1: 85, tau: 0.035, g: 0.9, dirt: 0.35, send: 0.15 });
  K.mode(s, 230 * rand(0.97, 1.03), 0.02, 0.25, 0.1);
  K.noise(s, { type: 'lowpass', f: 600, Q: 0.7, g: 0.6, a: 0.002, tau: 0.012, send: 0.15 });
  const ch = s + 0.06 + rand(-0.008, 0.008);
  clack(K, ch, 0.9, 0.85);
  K.noise(ch, { f: 500, Q: 1.5, g: 0.5, a: 0.001, tau: 0.01 });
  K.boom(ch, { f0: 180, f1: 110, tau: 0.015, g: 0.35 });
};

const equip: Recipe = (K) => {
  K.noise(0, {
    f: [
      [0, 2500],
      [0.06, 5200],
    ],
    Q: 2,
    g: 0.22,
    a: 0.02,
    hold: 0.03,
    tau: 0.01,
  });
  const t = 0.075 + rand(-0.008, 0.008);
  const k = rand(0.97, 1.03);
  K.noise(t, { f: 3500, Q: 0.9, g: 0.9, tau: 0.001 });
  K.boom(t, { f0: 220, f1: 110, tau: 0.015, g: 0.45, dirt: 0.4 });
  // A light ring suits equipping (the owner), kept quiet and short.
  for (const [f, tau, g] of [
    [1720, 0.034, 0.14],
    [3150, 0.026, 0.095],
    [4880, 0.017, 0.06],
  ] as const)
    K.mode(t, f * k, tau, g, 0.08);
};

const dust =
  (many: boolean): Recipe =>
  (K) => {
    const len = many ? 1.0 : 0.4;
    K.noise(0.02, { f: 6000, Q: 0.5, g: 0.06, a: 0.08, hold: len * 0.6, tau: len * 0.15 });
    const n = Math.round(len * 320);
    for (let i = 0; i < n; i++)
      K.noise(0.03 + len * Math.pow(Math.random(), 1.6), {
        f: logRand(3000, 9000),
        Q: rand(3, 8),
        g: rand(0.1, 0.35),
        tau: rand(0.0008, 0.002),
      });
    for (let i = 0; i < n / 13; i++)
      K.noise(0.03 + len * 0.85 * Math.random(), {
        f: logRand(1500, 2500),
        Q: 6,
        g: 0.4,
        tau: 0.003,
      });
    if (many) K.thump(len + 0.05, 150, 90, 0.03, 0.1);
  };

// The stings are built from noise, impacts and low, dirty tones rather than bells and chimes (the owner: "too melodic
// and bell like"; the noisier, crunchier, bassier ones were better).

/** Short bright grains: embers, grit, debris. */
const crackle = (
  K: Kit,
  t0: number,
  t1: number,
  n: number,
  lo: number,
  hi: number,
  g: number,
): void => {
  for (let i = 0; i < n; i++)
    K.noise(rand(t0, t1), {
      f: logRand(lo, hi),
      Q: rand(2, 5),
      g: rand(0.5, 1) * g,
      tau: rand(0.0015, 0.004),
    });
};
/** A whoosh that rises into what follows. */
const riser = (K: Kit, t: number, len: number, f0: number, f1: number, g: number, dirt = 0): void =>
  K.noise(t, {
    f: [
      [0, f0],
      [len, f1],
    ],
    Q: 1.3,
    g,
    a: len * 0.9,
    tau: 0.03,
    send: 0.2,
    dirt,
  });
/** Something heavy landing: a boom, a crunchy burst and a rumble that settles. */
const impact = (K: Kit, t: number, size: number): void => {
  K.boom(t, { f0: 110 / size, f1: 34, tau: 0.08 * size, g: 1, send: 0.35 * size, dirt: 0.6 });
  K.noise(t, {
    type: 'lowpass',
    f: [
      [0, 2600],
      [0.15 * size, 280],
    ],
    Q: 0.7,
    g: 0.9,
    a: 0.002,
    tau: 0.04 * size,
    send: 0.45,
    dirt: 0.9,
  });
  K.noise(t, {
    type: 'lowpass',
    f: 160,
    Q: 0.7,
    g: 0.6 * size,
    a: 0.01,
    hold: 0.05 * size,
    tau: 0.22 * size,
    send: 0.35,
    dirt: 0.3,
  });
};
/** A low, distorted, detuned saw swell: weight with only a hint of pitch. */
const braam = (K: Kit, t: number, notes: number[], len: number, g: number): void => {
  for (const f of notes)
    K.tone(t, {
      type: 'sawtooth',
      f,
      uni: [-14, 0, 11],
      a: 0.04,
      hold: len,
      tau: len * 0.7,
      g,
      lp: {
        f: [
          [0, 140],
          [0.25 + len * 0.3, 1000],
          [0.4 + len * 1.4, 160],
        ],
        Q: 2.5,
      },
      send: 0.35,
      dirt: 1,
    });
};

const flare = (K: Kit, len: number, g: number): void => {
  K.noise(0, {
    f: [
      [0, 400],
      [len, 3200],
    ],
    Q: 1.2,
    g: 0.5 * g,
    a: len * 0.4,
    hold: len * 0.2,
    tau: len * 0.3,
    dirt: 0.2,
  });
  crackle(K, 0.02, len * 1.3, Math.round(20 * g), 2000, 6500, 0.3);
};
const passive =
  (kind: 'small' | 'notable' | 'keystone'): Recipe =>
  (K) => {
    if (kind === 'small') {
      flare(K, 0.1, 1);
      K.boom(0.06, { f0: 160, f1: 85, tau: 0.025, g: 0.35, dirt: 0.3 });
    } else if (kind === 'notable') {
      riser(K, 0, 0.12, 400, 2600, 0.4, 0.2);
      const t = 0.12;
      K.boom(t, { f0: 125, f1: 45, tau: 0.06, g: 0.8, send: 0.3, dirt: 0.6 });
      K.noise(t, {
        type: 'lowpass',
        f: [
          [0, 3200],
          [0.12, 500],
        ],
        g: 0.7,
        a: 0.002,
        tau: 0.05,
        send: 0.3,
        dirt: 0.7,
      });
      crackle(K, t, 0.65, 26, 1500, 6000, 0.35);
    } else {
      riser(K, 0, 0.35, 300, 4200, 0.5, 0.3);
      impact(K, 0.35, 1.3);
      braam(K, 0.35, [hz('D1'), hz('D2')], 0.3, 0.22);
      crackle(K, 0.35, 1.5, 55, 1500, 6500, 0.32);
    }
  };

// Long and lifting: a drum roll and a rising fifth build for a second and a half, then land on a warm, gritty major
// chord with embers drifting off.
const levelUp: Recipe = (K) => {
  const top = 1.6;
  riser(K, 0, top, 200, 6000, 0.38, 0.2);
  K.noise(0.3, {
    type: 'highpass',
    f: [
      [0, 3000],
      [top - 0.3, 9500],
    ],
    g: 0.1,
    a: top - 0.35,
    tau: 0.04,
    send: 0.3,
  });
  for (const [a, b] of [
    ['D2', 'D3'],
    ['A2', 'A3'],
  ] as const)
    K.tone(0, {
      type: 'sawtooth',
      f: hz(a),
      f2: hz(b),
      glide: top,
      uni: [-12, 0, 12],
      a: top * 0.8,
      hold: top * 0.2,
      tau: 0.05,
      g: 0.16,
      lp: {
        f: [
          [0, 200],
          [top, 2600],
        ],
      },
      send: 0.25,
      dirt: 0.5,
    });
  // The roll: low tom hits closing in on the landing, growing louder.
  for (let t = 0.35, gap = 0.2; t < top - 0.03; t += gap, gap *= 0.84) {
    const u = t / top;
    K.boom(t, { f0: 115, f1: 65, tau: 0.03, g: 0.15 + 0.45 * u, dirt: 0.3, send: 0.2 });
    K.noise(t, { type: 'lowpass', f: 700, g: 0.12 + 0.3 * u, tau: 0.012, dirt: 0.4 });
  }
  // The landing.
  K.boom(top, { f0: 120, f1: 45, tau: 0.09, g: 0.9, send: 0.35, dirt: 0.5 });
  K.noise(top, {
    type: 'lowpass',
    f: [
      [0, 3500],
      [0.2, 400],
    ],
    g: 0.75,
    a: 0.002,
    tau: 0.05,
    send: 0.4,
    dirt: 0.7,
  });
  for (const [n, g] of [
    ['D3', 0.13],
    ['F#3', 0.11],
    ['A3', 0.11],
    ['D4', 0.09],
  ] as const)
    K.tone(top, {
      type: 'sawtooth',
      f: hz(n),
      uni: [-9, 0, 9],
      a: 0.02,
      hold: 0.55,
      tau: 0.5,
      g,
      lp: {
        f: [
          [0, 900],
          [0.3, 2400],
          [1.4, 350],
        ],
      },
      send: 0.3,
      dirt: 0.18,
    });
  crackle(K, top, top + 1.8, 60, 2000, 7500, 0.25);
};

const find =
  (unique: boolean): Recipe =>
  (K) => {
    if (!unique) {
      // The rare sits an octave below the unique: a warmer, lower glint.
      K.noise(0, {
        f: [
          [0, 700],
          [0.06, 3400],
        ],
        Q: 1.8,
        g: 0.55,
        a: 0.045,
        tau: 0.02,
        dirt: 0.35,
      });
      const t = 0.06;
      K.boom(t, { f0: 120, f1: 50, tau: 0.03, g: 0.6, send: 0.2, dirt: 0.45 });
      K.noise(t, { f: 1800, Q: 1.2, g: 0.6, tau: 0.003 });
      crackle(K, t, 0.4, 20, 1400, 4200, 0.32);
      return;
    }
    // Short, sharp and exciting: a snap of a rush, a hard crack, a burst of sparks, and a pitched zip upward.
    K.noise(0, {
      f: [
        [0, 1800],
        [0.07, 9000],
      ],
      Q: 2,
      g: 0.5,
      a: 0.06,
      tau: 0.01,
      dirt: 0.3,
    });
    const t = 0.07;
    K.noise(t, { type: 'highpass', f: 4000, g: 1, tau: 0.003, dirt: 0.5 });
    K.boom(t, { f0: 200, f1: 70, tau: 0.045, g: 0.9, send: 0.12, dirt: 0.7 });
    K.noise(t, {
      type: 'lowpass',
      f: [
        [0, 4200],
        [0.08, 400],
      ],
      g: 0.7,
      a: 0.001,
      tau: 0.03,
      dirt: 0.8,
    });
    crackle(K, t + 0.01, t + 0.4, 70, 5500, 12000, 0.35);
    K.noise(t + 0.01, { type: 'highpass', f: 7000, g: 0.25, a: 0.005, tau: 0.08, send: 0.12 });
    K.noise(t + 0.1, {
      f: [
        [0, 3000],
        [0.15, 11000],
      ],
      Q: 4,
      g: 0.3,
      a: 0.13,
      tau: 0.02,
      send: 0.12,
    });
  };

const drum = (K: Kit, t: number, big: boolean): void => {
  K.boom(t, { f0: 125, f1: 50, tau: big ? 0.15 : 0.07, g: 0.95, send: 0.4, dirt: 0.45 });
  K.noise(t, {
    type: 'lowpass',
    f: 750,
    Q: 0.8,
    g: 0.55,
    tau: big ? 0.04 : 0.02,
    send: 0.35,
    dirt: 0.6,
  });
};
// War drums, dun, dun, DUNN, then the gate's stone grinding open.
const cleared: Recipe = (K) => {
  drum(K, 0, false);
  drum(K, 0.22, false);
  drum(K, 0.5, true);
  impact(K, 0.5, 1.1);
  crackle(K, 0.6, 1.6, 45, 300, 1600, 0.45);
  K.noise(0.55, {
    type: 'lowpass',
    f: 130,
    g: 0.5,
    a: 0.15,
    hold: 0.6,
    tau: 0.3,
    send: 0.4,
    dirt: 0.4,
  });
};

const boss: Recipe = (K) => {
  K.boom(0, { f0: 70, f1: 24, tau: 0.35, g: 1, send: 0.6, dirt: 0.7 });
  K.noise(0, {
    type: 'lowpass',
    f: [
      [0, 1600],
      [0.5, 150],
    ],
    g: 1,
    a: 0.002,
    tau: 0.12,
    send: 0.5,
    dirt: 1,
  });
  braam(K, 0.05, [hz('D1'), hz('A1'), hz('D2')], 0.9, 0.26);
  // The roar: dark noise that swells, and a growling low saw.
  K.noise(0.3, {
    type: 'lowpass',
    f: [
      [0, 180],
      [0.45, 800],
      [1.3, 220],
    ],
    Q: 1.5,
    g: 0.6,
    a: 0.3,
    hold: 0.35,
    tau: 0.35,
    send: 0.5,
    dirt: 0.7,
  });
  K.tone(0.3, {
    type: 'sawtooth',
    f: 55,
    f2: 46,
    glide: 1.2,
    uni: [-15, 0, 12],
    vib: [7, 60],
    a: 0.3,
    hold: 0.4,
    tau: 0.35,
    g: 0.3,
    lp: {
      f: [
        [0, 250],
        [0.4, 700],
        [1.3, 200],
      ],
      Q: 2,
    },
    send: 0.4,
    dirt: 0.9,
  });
};

// Death is one short, almost vocal sigh (a many-part scene didn't work): a breath of "h", then a voiced "aah" that
// falls about a fifth while the vowel closes toward "oh" and fades, over a dull low thud.
const death: Recipe = (K) => {
  const k = rand(0.97, 1.03);
  K.boom(0, { f0: 90, f1: 45, tau: 0.05, g: 0.18, dirt: 0.2, send: 0.15 });
  const VOWEL: [number, number, number, number][] = [
    [720, 5, 1, 480],
    [1150, 6, 0.5, 820],
    [2550, 9, 0.12, 2350],
  ];
  // The breath leads the voice and stays under it.
  for (const [f, Q, g, f2] of VOWEL)
    K.noise(0, {
      f: [
        [0, f * k],
        [1.9, f2 * k],
      ],
      Q: Q * 0.6,
      g: g * 0.3,
      a: 0.1,
      hold: 0.6,
      tau: 0.45,
      send: 0.3,
    });
  // Mostly a triangle, softer than a saw (the owner: less buzzy), with a little saw so the vowel keeps the upper
  // harmonics it needs to sound like a voice.
  for (const [type, g] of [
    ['triangle', 0.4],
    ['sawtooth', 0.09],
  ] as const)
    K.tone(0.07, {
      type,
      f: hz('E3') * k,
      f2: hz('A2') * k,
      glideAt: 0.15,
      glide: 1.6,
      uni: [-5, 4],
      vib: [5, 14],
      a: 0.15,
      hold: 0.6,
      tau: 0.5,
      g,
      formants: VOWEL.map(([f, Q, gg, f2]) => [f * k, Q, gg, f2 * k]),
      send: 0.3,
    });
};

/** One version of a sound: how long it may run, how loud it is levelled, and its recipe. */
export interface Variant {
  dur: number;
  db: number;
  fn: Recipe;
}

/** The twelve sounds, by id and variant. Interface sounds are levelled quietest, the big moments loudest. */
export const SOUNDS = {
  press: { one: { dur: 0.15, db: -27, fn: press } },
  denied: { one: { dur: 0.25, db: -25, fn: denied } },
  page: { one: { dur: 0.4, db: -26, fn: page } },
  begin: { one: { dur: 3.2, db: -21, fn: begin } },
  equip: { one: { dur: 0.6, db: -24, fn: equip } },
  dust: {
    one: { dur: 0.6, db: -24, fn: dust(false) },
    many: { dur: 1.3, db: -22, fn: dust(true) },
  },
  passive: {
    small: { dur: 0.5, db: -25, fn: passive('small') },
    notable: { dur: 1.6, db: -22, fn: passive('notable') },
    keystone: { dur: 3.6, db: -20, fn: passive('keystone') },
  },
  levelUp: { one: { dur: 4.8, db: -20, fn: levelUp } },
  find: {
    rare: { dur: 1.0, db: -21, fn: find(false) },
    unique: { dur: 1.4, db: -19, fn: find(true) },
  },
  cleared: { one: { dur: 3.0, db: -19, fn: cleared } },
  boss: { one: { dur: 4.5, db: -19, fn: boss } },
  death: { one: { dur: 3.6, db: -20, fn: death } },
} satisfies Record<string, Record<string, Variant>>;

export type SoundId = keyof typeof SOUNDS;
/** The variants of a sound, e.g. VariantOf<'find'> is 'rare' | 'unique'. */
export type VariantOf<S extends SoundId> = keyof (typeof SOUNDS)[S] & string;
