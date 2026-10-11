import type { Character } from '../calc/character';
import { bossAhead, bossOfType, type BossDef } from '../data/bosses';
import type { MonsterTypeId } from '../data/monsters';
import { bossReadiness } from '../run/bossInfo';

/** A boss's warning (docs/BOSSES.md 10): one to three lines, the broad strokes of what it does. */
export function BossCard({ boss }: { boss: BossDef }) {
  return (
    <div class="boss-card">
      {boss.brief.map((t) => (
        <div key={t}>{t}</div>
      ))}
    </div>
  );
}

/** The card of a monster type, if it is a boss. */
export function BossCardOf({ type }: { type: MonsterTypeId }) {
  const b = bossOfType(type);
  return b ? <BossCard boss={b} /> : null;
}

/** Where the build stands against a boss, a line each (docs/BOSSES.md 10). */
export function BossReadiness({ boss, ch }: { boss: BossDef; ch: Character }) {
  const lines = bossReadiness(ch, boss.id);
  if (!lines.length) return null;
  return (
    <div class="boss-readiness">
      {lines.map((l) => (
        <div key={l.text} class={l.level}>
          {l.level === 'ok' ? '✓' : l.level === 'warn' ? '!' : '✗'} {l.text}
        </div>
      ))}
    </div>
  );
}

/**
 * The next boss, at camp, from five maps before it (docs/BOSSES.md 10): its name, how far off it is, its warning, and where the
 * build stands against it.
 */
export function BossAhead({ map, ch }: { map: number; ch: Character }) {
  const ahead = bossAhead(map);
  // On the boss's own map, the offer itself is the boss (Camp's `BossOffer`).
  if (!ahead || ahead.maps === 0) return null;
  const { boss, maps } = ahead;
  return (
    <div class="boss-ahead">
      <div class="boss-ahead-name">
        {boss.name[0].toUpperCase() + boss.name.slice(1)}{' '}
        <span class="muted">
          in {maps} map{maps > 1 ? 's' : ''} (map {boss.map})
        </span>
      </div>
      <BossCard boss={boss} />
      <BossReadiness boss={boss} ch={ch} />
    </div>
  );
}
