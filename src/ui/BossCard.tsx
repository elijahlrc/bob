import type { Character } from '../calc/character';
import { bossAhead, bossOfType, type BossDef } from '../data/bosses';
import type { MonsterTypeId } from '../data/monsters';
import { bossReadiness } from '../run/bossInfo';

/** A boss's card (docs/BOSSES.md 10): what it takes to kill it, and what it takes to survive it. */
export function BossCard({ boss }: { boss: BossDef }) {
  return (
    <div class="boss-card">
      <div class="boss-card-test">{boss.test}</div>
      <div class="boss-card-head">
        <span>Deals {boss.deals}</span>
        <span>Resists {boss.resists}</span>
        <span>Weak to {boss.weak}</span>
      </div>
      <div class="boss-card-cols">
        <div>
          <div class="boss-card-title">To kill it</div>
          {boss.kill.map((t) => (
            <div key={t}>· {t}</div>
          ))}
        </div>
        <div>
          <div class="boss-card-title">To survive it</div>
          {boss.survive.map((t) => (
            <div key={t}>· {t}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** The card of a monster type, if it is a boss. */
export function BossCardOf({ type }: { type: MonsterTypeId }) {
  const b = bossOfType(type);
  return b ? <BossCard boss={b} /> : null;
}

/**
 * The next boss, at camp, from five maps before it (docs/BOSSES.md 10): its name, how far off it is, its card, and where the
 * build stands against it.
 */
export function BossAhead({ map, ch }: { map: number; ch: Character }) {
  const ahead = bossAhead(map);
  if (!ahead) return null;
  const { boss, maps } = ahead;
  const lines = bossReadiness(ch, boss.id);
  return (
    <div class="boss-ahead">
      <div class="boss-ahead-name">
        {boss.name[0].toUpperCase() + boss.name.slice(1)}{' '}
        <span class="muted">
          {maps === 0 ? 'ends this map' : `in ${maps} map${maps > 1 ? 's' : ''} (map ${boss.map})`}
        </span>
      </div>
      <BossCard boss={boss} />
      {lines.length > 0 && (
        <div class="boss-readiness">
          {lines.map((l) => (
            <div key={l.text} class={l.level}>
              {l.level === 'ok' ? '✓' : l.level === 'warn' ? '!' : '✗'} {l.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
