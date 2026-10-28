import { gemDef } from '../data/gems';
import type { GemItem } from '../data/types';

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
