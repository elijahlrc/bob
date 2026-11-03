import {
  ABSTAINER_RES,
  ANVIL_LESS,
  ARROWS_MORE,
  ARROWS_RANGE,
  BLIND_FURY_LEECH,
  BULWARK_MORE,
  AGONY_LESS,
  ECHO_CHANCE,
  FLAYING_SPEED,
  FLEETFOOT_DIV,
  FLEETFOOT_LESS,
  MOUNTAIN_MAX_RES,
  MOUNTAIN_SHARE,
  LINGERING_MORE,
  MARKSMAN_ACCURACY,
  PLOUGHMAN_AOE,
  PLOUGHMAN_MOVE,
  SPLINTER_PROJECTILES,
  THROUGH_FLESH_SLOW,
  ROT_VEIL_SHARE,
  UNFLINCHING_LESS,
  type RunRewardId,
} from '../data/runRewards';
import type { Build } from '../data/types';
import { mod, type CondId, type Mod, type SkillTag } from '../mods/types';

/** How many of a relic a build holds (docs/ATTRITION.md). */
export const relicCount = (b: Pick<Build, 'relics'>, id: RunRewardId): number =>
  b.relics?.[id] ?? 0;
export const hasRelic = (b: Pick<Build, 'relics'>, id: RunRewardId): boolean =>
  relicCount(b, id) > 0;

const src = (id: string) => ({ source: { kind: 'relic' as const, id } });

/**
 * The mods a build's relics and the Surgeon's trades put on the character, always (docs/ATTRITION.md). What holds only on a boss
 * level is `bossRelicMods`; what a relic changes in the fight itself (a kill, a flask, a dodge) is the sim's.
 */
export function relicMods(b: Build): Mod[] {
  const out: Mod[] = [];
  if (hasRelic(b, 'abstainersVow')) {
    const empty = b.flasks.filter((f) => !f).length;
    if (empty)
      out.push(
        mod('resist.allEle', 'base', ABSTAINER_RES * empty, src('abstainersVow')),
        mod('resist.chaos', 'base', ABSTAINER_RES * empty, src('abstainersVow')),
      );
  }
  if (hasRelic(b, 'lingeringRot'))
    out.push(
      ...(['duration.ignite', 'duration.bleed', 'duration.poison'] as const).map((s) =>
        mod(s, 'more', LINGERING_MORE, src('lingeringRot')),
      ),
      mod('skillDuration', 'more', LINGERING_MORE, { tags: ['dot'], ...src('lingeringRot') }),
    );
  // Elemental only: damage taken by type is its own stat (`damageTaken` alone is every type).
  if (hasRelic(b, 'theUnflinching'))
    out.push(
      ...(['fire', 'cold', 'lightning'] as const).map((t) =>
        mod(`damageTaken.${t}`, 'more', -UNFLINCHING_LESS, src('theUnflinching')),
      ),
    );
  if (hasRelic(b, 'blindFury'))
    out.push(
      mod('leech.life', 'base', BLIND_FURY_LEECH, { tags: ['attack'], ...src('blindFury') }),
      mod('leech.mana', 'base', BLIND_FURY_LEECH, { tags: ['attack'], ...src('blindFury') }),
    );
  if (hasRelic(b, 'echoingWord'))
    out.push(
      mod('repeatChance', 'base', ECHO_CHANCE * 100, { tags: ['spell'], ...src('echoingWord') }),
    );
  // Life equal to the lowest attribute: 'minAttr' is the calc's (Character.statValue).
  if (hasRelic(b, 'weakestVein'))
    out.push(mod('life', 'base', 1, { per: { stat: 'minAttr', div: 1 }, ...src('weakestVein') }));
  // The attribute relics the sheet can see (the owner, 2026-10-30); the rest happen in the fight.
  if (hasRelic(b, 'marksmansPulse'))
    out.push(
      mod('life', 'base', 1, {
        per: { stat: 'accuracy', div: MARKSMAN_ACCURACY },
        ...src('marksmansPulse'),
      }),
    );
  // Two-handed melee weapons only (a bow is no two-handed weapon: the owner, 2026-10-30).
  if (hasRelic(b, 'flayingWrath'))
    out.push(
      mod('attackSpeed', 'inc', FLAYING_SPEED, {
        tags: ['twoHand', 'melee'],
        ...src('flayingWrath'),
      }),
    );
  if (hasRelic(b, 'anvilThirst'))
    out.push(
      mod('leechRecoveryLife', 'inc', 1, {
        per: { stat: 'incArmour', div: 1 },
        ...src('anvilThirst'),
      }),
      mod('armour', 'more', -ANVIL_LESS, src('anvilThirst')),
    );
  if (hasRelic(b, 'arrowsAtTheThroat'))
    out.push(
      mod('damage', 'more', ARROWS_MORE, { tags: ['projectile'], ...src('arrowsAtTheThroat') }),
      mod('projectileRangeCap', 'base', ARROWS_RANGE, src('arrowsAtTheThroat')),
    );
  if (hasRelic(b, 'rotVeil'))
    out.push(mod('chaosToEs', 'base', ROT_VEIL_SHARE * 100, src('rotVeil')));
  if (hasRelic(b, 'twoVessels')) out.push(mod('lifeRegenToMana', 'flag', 1, src('twoVessels')));
  // The second brainstorm's relics the sheet can see (the owner, 2026-10-30).
  if (hasRelic(b, 'burningThrough'))
    out.push(
      ...(['grit', 'fervour', 'insight'] as const).map((k) =>
        mod(`maxCharges.${k}`, 'base', 1, src('burningThrough')),
      ),
    );
  if (hasRelic(b, 'mountainsHide'))
    out.push(
      mod('armourVsEle', 'base', MOUNTAIN_SHARE * 100, src('mountainsHide')),
      mod('maxResist.allEle', 'base', -MOUNTAIN_MAX_RES, src('mountainsHide')),
    );
  if (hasRelic(b, 'fleetfootOath'))
    out.push(
      ...(['attackSpeed', 'castSpeed'] as const).map((s) =>
        // Movement speed as it is this moment, flasks and buffs included (the owner, 2026-10-30; modDb's `inc:`).
        mod(s, 'inc', 1, {
          per: { stat: 'inc:moveSpeed', div: FLEETFOOT_DIV },
          ...src('fleetfootOath'),
        }),
      ),
      mod('evasion', 'more', -FLEETFOOT_LESS, src('fleetfootOath')),
    );
  if (hasRelic(b, 'sharedAgony'))
    out.push(mod('minionLife', 'more', -AGONY_LESS, src('sharedAgony')));
  if (hasRelic(b, 'searingExcess'))
    out.push(
      ...(['fire', 'cold', 'lightning'] as const).map((t) =>
        mod('damage', 'more', 1, {
          damageTypes: [t],
          per: { stat: `overcap.${t}`, div: 1 },
          ...src('searingExcess'),
        }),
      ),
    );
  // The third brainstorm's relics (the owner, 2026-11-02). A ranged attack is an attack with projectiles; 999 is every enemy.
  if (hasRelic(b, 'splinteredRod'))
    out.push(
      // Wielding a wand, every attack is a wand attack (melee skills cannot be used with one).
      mod('projectiles', 'base', SPLINTER_PROJECTILES, {
        tags: ['attack'],
        condition: { id: 'wieldingWand' },
        ...src('splinteredRod'),
      }),
    );
  if (hasRelic(b, 'throughFlesh'))
    out.push(
      mod('pierce', 'base', 999, { tags: ['attack', 'projectile'], ...src('throughFlesh') }),
      mod('projectileSpeed', 'more', -THROUGH_FLESH_SLOW, {
        tags: ['attack', 'projectile'],
        ...src('throughFlesh'),
      }),
    );
  if (hasRelic(b, 'ploughmansWrath'))
    out.push(
      mod('aoe', 'inc', PLOUGHMAN_AOE, { tags: ['attack', 'melee'], ...src('ploughmansWrath') }),
      mod('moveSpeed', 'inc', -PLOUGHMAN_MOVE, src('ploughmansWrath')),
    );
  // The School of Every Blade's price: critical strikes do normal damage (skill.ts).
  if (hasRelic(b, 'everyBlade')) out.push(mod('critNoExtraDamage', 'flag', 1, src('everyBlade')));
  for (const m of b.grafts ?? []) out.push({ ...m, source: { kind: 'relic', id: 'surgeon' } });
  return out;
}

/** Relic 15: what holds on a boss level only (the sim adds it to the character when the map has a boss). */
export function bossRelicMods(b: Build): Mod[] {
  if (!hasRelic(b, 'bulwarkBeforeTheThrone')) return [];
  return (['armour', 'evasion', 'es'] as const).map((s) =>
    mod(s, 'more', BULWARK_MORE, src('bulwarkBeforeTheThrone')),
  );
}

/** The one-handed weapon kinds The School of Every Blade joins, and the condition that names each. */
const SCHOOL: readonly SkillTag[] = ['sword', 'axe', 'mace', 'claw', 'dagger'];
const WIELDING: Partial<Record<SkillTag, CondId>> = {
  sword: 'wieldingSword',
  axe: 'wieldingAxe',
  mace: 'wieldingMace',
  claw: 'wieldingClaw',
  dagger: 'wieldingDagger',
};
const schoolOf = (c: CondId): SkillTag | undefined => SCHOOL.find((t) => WIELDING[t] === c);

/**
 * Relics that make lines of one kind count for another (the owner, 2026-11-02): copies of the character's own mods with a tag or
 * a condition swapped, made once the static mods are gathered. A copy keeps its value and conditions, so it is shown, summed
 * and scaled like the line it comes from.
 */
export function relicBorrows(
  b: Build,
  mods: readonly Mod[],
  weaponTags: ReadonlySet<SkillTag>,
): Mod[] {
  const out: Mod[] = [];
  const swapTag = (m: Mod, from: SkillTag, to: SkillTag): SkillTag[] =>
    (m.tags ?? []).map((t) => (t === from ? to : t));
  // The Whispered Edge: spell critical strike lines count for attacks while a dagger is held (lines already for daggers aside).
  if (hasRelic(b, 'whisperedEdge') && weaponTags.has('dagger'))
    for (const m of mods)
      if (
        (m.stat === 'critChance' || m.stat === 'critMulti') &&
        m.tags?.includes('spell') &&
        !m.condition
      )
        out.push({
          ...m,
          tags: swapTag(m, 'spell', 'attack'),
          condition: { id: 'wieldingDagger' },
          ...src('whisperedEdge'),
        });
  // The Lone Grip: two-handed lines count for a one-handed weapon held alone.
  if (hasRelic(b, 'loneGrip') && weaponTags.has('oneHand') && !b.equipment.offHand)
    for (const m of mods) {
      const tagged = m.tags?.includes('twoHand');
      const cond = m.condition?.id === 'wieldingTwoHand' && !m.condition.not;
      if (!tagged && !cond) continue;
      out.push({
        ...m,
        tags: tagged ? swapTag(m, 'twoHand', 'oneHand') : m.tags,
        condition: cond ? { id: 'wieldingOneHand' } : m.condition,
        ...src('loneGrip'),
      });
    }
  // The School of Every Blade: every kind's lines count for the one-handed kinds held. A line for one two-handed weapon stays so.
  const held = SCHOOL.filter((t) => weaponTags.has(t));
  if (hasRelic(b, 'everyBlade') && weaponTags.has('oneHand') && held.length)
    for (const m of mods) {
      if (m.tags?.includes('twoHand')) continue;
      const other = (m.tags ?? []).find((t) => SCHOOL.includes(t) && !held.includes(t));
      if (other && !(m.tags ?? []).some((t) => held.includes(t)))
        for (const t of held) out.push({ ...m, tags: swapTag(m, other, t), ...src('everyBlade') });
      const kind = m.condition && !m.condition.not ? schoolOf(m.condition.id) : undefined;
      // One copy for a condition: a second would count twice for a character holding two kinds.
      if (kind && !held.includes(kind))
        out.push({ ...m, condition: { id: WIELDING[held[0]]! }, ...src('everyBlade') });
    }
  return out;
}
