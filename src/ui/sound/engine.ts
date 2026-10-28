// Plays Bob's sounds (docs/AUDIO.md, "How the engine behaves"). Nothing here runs unless sound is open (SOUND_OPEN, or
// ?sound in the address for testing): with it shut no AudioContext is made, nothing renders and nothing plays.
import { SOUND_OPEN } from '../../data/constants';
import { loadPref, savePref } from '../prefs';
import { build, level, SR } from './kit';
import { SOUNDS, type SoundId, type Variant, type VariantOf } from './recipes';

/** Whether the game makes any sound at all: the switch in constants.ts, or ?sound in the address to try it. */
export function soundOpen(): boolean {
  if (SOUND_OPEN) return true;
  try {
    return new URLSearchParams(window.location.search).has('sound');
  } catch {
    return false;
  }
}

/** The volume steps the settings offer; 0 is off. */
export const VOLUMES = [0, 0.4, 0.7, 1] as const;
const VOLUME_PREF = 'sound.volume';
let volume = loadPref<number>(VOLUME_PREF, 0.7);

export function soundVolume(): number {
  return volume;
}
export function setSoundVolume(v: number): void {
  volume = Math.max(0, Math.min(1, v));
  savePref(VOLUME_PREF, volume);
  if (out) out.gain.value = volume;
}

/** How often a sound may start again (seconds): a tap that lands twice, or an 8x map dropping three rares at once. */
const GAP: Partial<Record<SoundId, number>> = {
  press: 0.04,
  page: 0.08,
  denied: 0.15,
  equip: 0.1,
  dust: 0.15,
  passive: 0.08,
  find: 1,
};
/** Sounds that never stack on themselves: a new one waits until the last has finished, or is dropped. */
const ALONE = new Set<SoundId>(['begin', 'levelUp', 'cleared', 'boss', 'death']);
/** Ready takes kept per variant: a play uses one, and a fresh one is rendered in idle time. */
const TAKES = 2;

let ctx: AudioContext | null = null;
let out: GainNode | null = null;
const takes = new Map<string, AudioBuffer[]>();
const queue: string[] = [];
let rendering = false;
const lastAt = new Map<SoundId, number>();
const busyUntil = new Map<SoundId, number>();
let lastSoundAt = -Infinity;

const variantOf = (key: string): Variant => {
  const [id, v] = key.split('.') as [SoundId, string];
  return (SOUNDS[id] as Record<string, Variant>)[v]!;
};

/** Renders the queued takes one at a time in idle moments, so a phone never stutters. */
function pump(): void {
  if (rendering || !ctx || queue.length === 0) return;
  rendering = true;
  const key = queue.shift()!;
  const idle = (fn: () => void): void => {
    const ric = (
      window as { requestIdleCallback?: (f: () => void, o?: { timeout: number }) => number }
    ).requestIdleCallback;
    if (ric) ric(fn, { timeout: 500 });
    else setTimeout(fn, 30);
  };
  idle(() => {
    const v = variantOf(key);
    build(v.dur, v.fn)
      .then((d) => {
        if (!ctx) return;
        const data = level(d, v.db);
        const b = ctx.createBuffer(1, data.length, SR);
        b.getChannelData(0).set(data);
        const list = takes.get(key) ?? [];
        list.push(b);
        takes.set(key, list);
      })
      .catch(() => {
        // A browser that cannot render a sound plays nothing for it.
      })
      .finally(() => {
        rendering = false;
        pump();
      });
  });
}

function want(key: string): void {
  queue.push(key);
  pump();
}

/** The interface sounds are rendered first: they are the ones heard straight away. */
const ORDER: SoundId[] = [
  'press',
  'page',
  'denied',
  'begin',
  'equip',
  'dust',
  'passive',
  'find',
  'levelUp',
  'cleared',
  'boss',
  'death',
];

function unlock(): void {
  if (!soundOpen()) return;
  if (!ctx) {
    const AC =
      window.AudioContext ??
      (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    out = ctx.createGain();
    out.gain.value = volume;
    out.connect(ctx.destination);
    for (let n = 0; n < TAKES; n++)
      for (const id of ORDER) for (const v of Object.keys(SOUNDS[id])) want(`${id}.${v}`);
  }
  if (ctx.state === 'suspended' && !document.hidden) void ctx.resume();
}

let installed = false;
/** Starts audio on the first tap (browsers allow nothing sooner) and pauses it while the page is hidden. */
export function installSoundEngine(): void {
  if (installed || !soundOpen()) return;
  installed = true;
  window.addEventListener('pointerdown', unlock, true);
  window.addEventListener('keydown', unlock, true);
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) void ctx.suspend();
    else void ctx.resume();
  });
}

/** Whether any sound was asked for since time t (a performance.now() time, such as an event's timeStamp). */
export function soundSince(t: number): boolean {
  return lastSoundAt >= t;
}

/** Plays a sound (and its variant), if sound is open and on, and its caps allow it. */
export function sfx<S extends SoundId>(id: S, variant?: VariantOf<S>): void {
  if (!soundOpen() || volume <= 0) return;
  const now = performance.now();
  lastSoundAt = now;
  if (!ctx || ctx.state !== 'running') return;
  const gap = GAP[id];
  if (gap && now - (lastAt.get(id) ?? -Infinity) < gap * 1000) return;
  if (ALONE.has(id) && ctx.currentTime < (busyUntil.get(id) ?? 0)) return;
  const key = `${id}.${variant ?? Object.keys(SOUNDS[id])[0]!}`;
  const buf = takes.get(key)?.shift();
  // No take ready yet (only in the first seconds after the first tap): stay quiet rather than late.
  if (!buf) return;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.connect(out!);
  src.start();
  lastAt.set(id, now);
  if (ALONE.has(id)) busyUntil.set(id, ctx.currentTime + buf.duration);
  want(key);
}
