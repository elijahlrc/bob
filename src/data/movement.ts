import type { MonsterTypeId } from './monsters';

/**
 * Movement styles and senses (docs/ROSTER.md 6.3 and 6.4). Every monster used to walk at the character by the same code,
 * notice it at the same distance, alert its pack to the same radius, give up after the same six seconds and go for the same
 * target. A type now lists a movement style (`sim/movement.ts` runs it: it picks where to steer and how fast, on top of the
 * pathing that stays as it was) and may set its senses. The text here is what the inspect card says.
 */
export type MovementId =
  | 'lurch'
  | 'hop'
  | 'momentum'
  | 'skitter'
  | 'swoop'
  | 'orbit'
  | 'tether'
  | 'follow'
  | 'kamikaze'
  | 'phase'
  | 'cover'
  | 'burrow';

export type MoveSpec = {
  id: MovementId;
  /** Lurch and hop: seconds moving, and the speed while it does (a multiple); seconds still. */
  go?: number;
  pace?: number;
  stop?: number;
  /** Momentum: the speed it starts at and tops out at (multiples of its speed), and seconds to get there. */
  from?: number;
  to?: number;
  seconds?: number;
  /** Skitter: the angle it zig-zags by, in degrees, and the seconds between turns. */
  angle?: number;
  every?: number;
  /** Swoop: tiles it withdraws after a blow. Cover: tiles it looks for shelter within. */
  back?: number;
  /** Burrow: seconds between dives (the `every` of a skitter's turns is a different thing: this one is `dive`). */
  dive?: number;
  /** Orbit: the radius of its circle, in tiles, and the seconds it circles before it closes in. */
  ring?: number;
  /** Tether and follow: the types it keeps to (the nearest of them), and the tiles it stays within of them. */
  anchors?: MonsterTypeId[];
  radius?: number;
};

export type MovementInfo = { name: string; text: (m: MoveSpec) => string };

export const MOVEMENT_INFO: Record<MovementId, MovementInfo> = {
  lurch: {
    name: 'Lurch',
    text: (m) =>
      `Moves in lunges of ${m.go ?? 1} s and stands still for ${m.stop ?? 0.8} s between them.`,
  },
  hop: {
    name: 'Hop',
    text: (m) => `Hops: ${m.go ?? 0.8} s on the move, ${m.stop ?? 0.5} s crouched between hops.`,
  },
  momentum: {
    name: 'Gathering speed',
    text: () =>
      'Starts slow and gathers speed the longer it runs; a stun or a slow brings it to a halt.',
  },
  skitter: {
    name: 'Skitter',
    text: () => 'Runs in a zig-zag, so that it is hard to line up.',
  },
  swoop: {
    name: 'Swoop',
    text: (m) => `Strikes and withdraws ${m.back ?? 3} tiles before coming in again.`,
  },
  orbit: {
    name: 'Circle',
    text: (m) => `Circles at ${m.ring ?? 3.5} tiles for ${m.seconds ?? 1.6} s, then closes in.`,
  },
  tether: {
    name: 'Tether',
    text: (m) =>
      `Keeps within ${m.radius ?? 6} tiles of its pack${m.anchors ? ' (' + m.anchors.join(', ') + ')' : ''}; leave and it holds its ground for a few seconds, then comes out.`,
  },
  follow: {
    name: 'Follow',
    text: () => 'Stays a little behind the front of its pack.',
  },
  kamikaze: {
    name: 'Rush',
    text: () => 'Runs straight at you, faster than it walks.',
  },
  phase: {
    name: 'Phase',
    text: () => 'Passes through walls: a chokepoint is no answer.',
  },
  burrow: {
    name: 'Burrow',
    text: (m) =>
      `Every ${m.dive ?? 8} s it sinks out of sight and comes up under you, untouchable on the way.`,
  },
  cover: {
    name: 'Cover',
    text: () => 'Steps behind a wall after it attacks, and leans out to attack again.',
  },
};

/** What a type notices, and whom it goes for. Anything not set is as it always was (docs/ROSTER.md 6.4). */
export type Senses = {
  /** Tiles at which it notices the character (default 10). */
  aggro?: number;
  /** Tiles within which it wakes its sleeping pack when it notices (default 6). */
  alert?: number;
  /** Seconds without sight before it gives up (default 6); 0 is never. */
  leash?: number;
  /** Whom it attacks: the character (the default), or whatever of the character's minions is nearest first. */
  target?: 'character' | 'minions';
  /** A veiled monster is not seen until it is within this many tiles, or has just struck or been struck. */
  veil?: number;
};

export function senseText(s: Senses | undefined): string[] {
  const out: string[] = [];
  if (!s) return out;
  if (s.veil)
    out.push(
      `Veiled: you do not see it until it is within ${s.veil} tiles, or has just struck or been hit.`,
    );
  if (s.target === 'minions') out.push('Hunts your minions before it hunts you.');
  if (s.leash === 0) out.push('Never gives up the chase.');
  else if (s.leash !== undefined && s.leash < 6)
    out.push(`Loses interest ${6 - s.leash} s sooner than most.`);
  if (s.aggro !== undefined && s.aggro >= 12) out.push(`Notices you from ${s.aggro} tiles.`);
  else if (s.aggro !== undefined && s.aggro <= 7)
    out.push('Short-sighted: notices you only from close by.');
  if (s.alert !== undefined && s.alert >= 10)
    out.push('Wakes its whole pack the moment it sees you.');
  return out;
}

/** One sentence per movement style a type has. */
export function movementTexts(list: MoveSpec[] | undefined): string[] {
  return (list ?? []).map((m) => `${MOVEMENT_INFO[m.id].name}: ${MOVEMENT_INFO[m.id].text(m)}`);
}
