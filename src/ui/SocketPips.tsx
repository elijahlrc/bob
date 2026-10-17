import { gemDef } from '../data/gems';
import type { GemItem, Item } from '../data/types';
import type { SocketOutcome } from '../run/inventory';
import { socketNote, socketsMatter } from '../run/socketText';

type Gem = GemItem | null;

/** What a screen reader hears for a row of sockets: "4 sockets: Halo Sweep (primary), Slow Rot, empty, empty". */
function describe(sockets: Gem[], primary: number | undefined, out: GemItem[]): string {
  const parts = sockets.map((g) =>
    g ? gemDef(g.gemId).name + (g.uid === primary ? ' (primary)' : '') : 'empty',
  );
  const lost = out.map((g) => `${gemDef(g.gemId).name} (out)`);
  return `${sockets.length} socket${sockets.length === 1 ? '' : 's'}: ${[...parts, ...lost].join(', ')}`;
}

/**
 * One dot for each socket of an item, in socket order: filled with the gem's kind (a skill, a support, an aura), ringed when
 * empty, a star on the primary skill. Gems pushed out are crossed and come after the sockets. Display only: the tap targets
 * are the socket buttons of the Skills tab.
 */
export function SocketPips({
  sockets,
  primary,
  out = [],
  size = 'md',
}: {
  sockets: Gem[];
  primary?: number;
  out?: GemItem[];
  size?: 'sm' | 'md';
}) {
  if (sockets.length === 0 && out.length === 0) return null;
  return (
    <span class={'ix-pips ' + size} role="img" aria-label={describe(sockets, primary, out)}>
      {sockets.map((g, i) => (
        <span
          key={i}
          class={
            'ix-pip ' + (g ? gemDef(g.gemId).kind : 'empty') + (g && g.uid === primary ? ' pr' : '')
          }
        />
      ))}
      {out.map((g) => (
        <span key={g.uid} class="ix-pip out" />
      ))}
    </span>
  );
}

/** The gems of a swap by name, one chip each: the primary starred, the ones with no socket crossed. */
function GemChips({
  placed,
  out,
  primary,
}: {
  placed: Gem[];
  out: GemItem[];
  primary: number | undefined;
}) {
  const chip = (g: GemItem, cls: string) => (
    <span key={g.uid} class={`ix-gc ${gemDef(g.gemId).kind} ${cls}`}>
      {g.uid === primary ? '★ ' : ''}
      {gemDef(g.gemId).name}
    </span>
  );
  return (
    <div class="ix-gemchips">
      {placed.filter((g): g is GemItem => g !== null).map((g) => chip(g, ''))}
      {out.map((g) => chip(g, 'out'))}
    </div>
  );
}

/**
 * What a swap does to the gems (docs/EQUIP.md 3.3): the old item's sockets, an arrow, the new item's with the gems that moved,
 * the count, and one sentence when something comes out or stops working. Hidden when no gem is touched.
 */
export function SocketsRow({
  was,
  o,
  primary,
  names = false,
}: {
  was: Item | undefined;
  o: SocketOutcome;
  primary: number | undefined;
  /** Name the gems under the pips (the full view). */
  names?: boolean;
}) {
  if (!socketsMatter(o)) return null;
  const note = socketNote(o, primary);
  return (
    <div class="ix-sockets">
      <div class="ix-sk">
        <span class="ix-sk-lab">Sockets</span>
        {was?.sockets.length ? (
          <SocketPips sockets={was.sockets} primary={primary} />
        ) : (
          <span class="muted">none</span>
        )}
        <span class="ix-arrow" aria-hidden="true">
          →
        </span>
        <SocketPips sockets={o.placed} primary={primary} out={o.out} />
      </div>
      {names && <GemChips placed={o.placed} out={o.out} primary={primary} />}
      {note.text && (
        <div class={'ix-sk-note ' + note.severity} role="status">
          {note.severity === 'good' ? '' : '⚠ '}
          {note.text}
        </div>
      )}
    </div>
  );
}
