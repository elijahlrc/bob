import { bossAhead, bossOfType, type BossDef } from '../data/bosses';
import type { MonsterTypeId } from '../data/monsters';

/** A boss's warning (docs/BOSSES.md 10): one to three lines that describe it and say nothing of how to fight it. */
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

/**
 * The next boss, at camp, from five maps before it (docs/BOSSES.md 10): its name, how far off it is and its warning.
 */
export function BossAhead({ map }: { map: number }) {
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
    </div>
  );
}
