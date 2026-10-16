import { gemDef } from '../data/gems';
import type { GemItem } from '../data/types';
import type { SocketOutcome } from './inventory';

/** How much a swap's effect on the gems matters: shown by colour and always by words. */
export type SocketSeverity = 'none' | 'good' | 'warn' | 'bad';

export type SocketNote = { severity: SocketSeverity; text: string };

const gemName = (g: GemItem): string => gemDef(g.gemId).name;

/** "A", "A and B", "A, B and C". */
export function joinNames(xs: string[]): string {
  return xs.length < 2 ? (xs[0] ?? '') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`;
}

/** Whether the swap touches the gems at all: gems on either side, or sockets the character will have to fill. */
export function socketsMatter(o: SocketOutcome): boolean {
  return o.before.filled > 0 || o.after.filled > 0 || o.out.length > 0;
}

/**
 * The one sentence a swap's socket outcome comes to (docs/EQUIP.md 3.3), or none when the gems are not touched. The reasons
 * behind it (what stays linked, what the numbers count) are not on the line.
 */
export function socketNote(o: SocketOutcome, primaryUid?: number): SocketNote {
  const overflow = o.out.filter((g) => !o.fromOffHand.some((x) => x.uid === g.uid));
  const parts: string[] = [];
  if (overflow.length) {
    const lostPrimary = overflow.some((g) => g.uid === primaryUid);
    const names = joinNames(overflow.map(gemName));
    parts.push(
      overflow.length === 1
        ? `No socket for ${names}, ${lostPrimary ? 'your primary skill, ' : ''}it will be unequipped`
        : `No socket for ${names}${lostPrimary ? ', including your primary skill' : ''}, they will be unequipped`,
    );
  }
  if (o.fromOffHand.length)
    parts.push(`Off hand goes to the bag with ${joinNames(o.fromOffHand.map(gemName))}`);
  if (o.idle.length) {
    const first = o.idle[0];
    parts.push(
      `${gemName(first.gem)} ${first.why}` +
        (o.idle.length > 1 ? ` (+${o.idle.length - 1} more idle)` : ''),
    );
  }
  if (parts.length) return { severity: o.lostPrimary ? 'bad' : 'warn', text: parts.join('. ') };
  const freeBefore = o.before.sockets - o.before.filled;
  if (o.freeAfter > freeBefore)
    return {
      severity: 'good',
      text: `${o.freeAfter} free socket${o.freeAfter === 1 ? '' : 's'}`,
    };
  return { severity: 'none', text: '' };
}
