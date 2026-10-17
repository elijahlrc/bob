import type { KeyValueStore } from './save';

/**
 * What this browser's characters have done against the rivals they fought (docs/DUEL.md 6.5), kept in the same store as the saves
 * under `bob.rivals.record`. It is the player's own and is never sent: the database holds the rated fights and nothing else.
 *
 * An entry is a pair, **one of the player's snapshots against one rival**, not a rival alone: the rated fight is the pair's (the
 * database allows one report for each ordered pair), and every run posts a new snapshot, so a rival that was rated by the last
 * character is a rated fight again for this one.
 */

export const RECORD_KEY = 'bob.rivals.record';
/** How many pairs are kept: the oldest go first. A character lasts one run, so the older pairs are no longer read. */
export const RECORD_MAX = 300;

export type PairRecord = {
  /** Fights fought, rated and practice. */
  fights: number;
  wins: number;
  /** The seed of the last fight, so that the next practice fight is on a new one. */
  lastSeed: number;
  /** Whether the rated fight is done: the server took the report, or had it already. */
  rated: boolean;
};

const keyOf = (myId: string, rivalId: string): string => `${myId}:${rivalId}`;

const isCount = (x: unknown): x is number =>
  typeof x === 'number' && Number.isInteger(x) && x >= 0 && x <= 1e9;

/** The entries in a stored value, each one checked: a value that is not the record's shape is an empty record. */
function readEntries(store: KeyValueStore | null): Record<string, PairRecord> {
  const out: Record<string, PairRecord> = {};
  try {
    const raw = store?.getItem(RECORD_KEY);
    if (!raw) return out;
    const data: unknown = JSON.parse(raw);
    if (typeof data !== 'object' || data === null || Array.isArray(data)) return out;
    for (const [k, v] of Object.entries(data)) {
      const e = v as Partial<PairRecord> | null;
      if (
        /^\d+:\d+$/.test(k) &&
        e &&
        isCount(e.fights) &&
        isCount(e.wins) &&
        isCount(e.lastSeed) &&
        typeof e.rated === 'boolean'
      )
        out[k] = { fights: e.fights, wins: e.wins, lastSeed: e.lastSeed, rated: e.rated };
    }
  } catch {
    // An unreadable record is an empty one.
  }
  return out;
}

/** The record of fights, read from a store and written back after every change (or kept in memory with no store). */
export class RivalBook {
  private readonly store: KeyValueStore | null;
  private entries: Record<string, PairRecord>;

  constructor(store: KeyValueStore | null) {
    this.store = store;
    this.entries = readEntries(store);
  }

  /** What `myId` has done against `rivalId`, or null when they have not met. */
  get(myId: string, rivalId: string): PairRecord | null {
    const e = this.entries[keyOf(myId, rivalId)];
    return e ? { ...e } : null;
  }

  /** A fight of the pair has ended with this seed; `won` is whether the player won it. */
  noteFight(myId: string, rivalId: string, seed: number, won: boolean): PairRecord {
    const k = keyOf(myId, rivalId);
    const e = this.entries[k] ?? { fights: 0, wins: 0, lastSeed: seed, rated: false };
    // Written again last, so that the pairs fought most recently are the ones the cap keeps.
    delete this.entries[k];
    this.entries[k] = {
      fights: e.fights + 1,
      wins: e.wins + (won ? 1 : 0),
      lastSeed: seed,
      rated: e.rated,
    };
    this.trim();
    this.save();
    return { ...this.entries[k] };
  }

  /** The server has the rated fight of the pair (it took the report or had it already). */
  noteRated(myId: string, rivalId: string): void {
    const e = this.entries[keyOf(myId, rivalId)];
    if (!e || e.rated) return;
    e.rated = true;
    this.save();
  }

  /** The set of one run's character: how many rivals it fought and how many it beat at least once. */
  tally(myId: string): { fought: number; beaten: number } {
    let fought = 0;
    let beaten = 0;
    for (const [k, e] of Object.entries(this.entries)) {
      if (!k.startsWith(`${myId}:`) || e.fights === 0) continue;
      fought++;
      if (e.wins > 0) beaten++;
    }
    return { fought, beaten };
  }

  private trim(): void {
    const keys = Object.keys(this.entries);
    for (const k of keys.slice(0, Math.max(0, keys.length - RECORD_MAX))) delete this.entries[k];
  }

  private save(): void {
    try {
      this.store?.setItem(RECORD_KEY, JSON.stringify(this.entries));
    } catch {
      // The record is a convenience: a full store loses it, never a fight.
    }
  }
}
