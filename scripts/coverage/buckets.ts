/**
 * Buckets (COVERAGE section 4): each reference entry belongs to the first *new system* Bob needs before it can be
 * covered. This is a keyword pass over wiki tags and text, not a judgement. Per-entry corrections go in
 * docs/coverage/bucket-overrides.json ({"Entry name": "bucket"}); C3 and later batches refine them as they review.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { RefGem, RefUnique } from './fetch-reference';
import { COVERAGE_DIR, norm } from './reference';

export const BUCKETS = [
  'plain',
  'dot',
  'charges',
  'triggers',
  'channelling',
  'auras',
  'curses',
  'movement',
  'warcries',
  'deployables',
  'minions',
] as const;
export type Bucket = (typeof BUCKETS)[number];

export const BUCKET_LABEL: Record<Bucket, string> = {
  plain: 'No new system ("plain")',
  dot: 'Damage over time and ailments',
  charges: 'Charges and flasks',
  triggers: 'Triggers',
  channelling: 'Channelling',
  auras: 'Auras, heralds, guards and buffs',
  curses: 'Curses and marks',
  movement: 'Movement',
  warcries: 'Warcries and banners',
  deployables: 'Totems, traps, mines and brands',
  minions: 'Minions',
};

/** The milestone that brings each bucket in (COVERAGE section 8). */
export const BUCKET_MILESTONE: Record<Bucket, string> = {
  plain: 'C3',
  dot: 'C3',
  charges: 'C3',
  triggers: 'C3',
  channelling: 'C3',
  auras: 'C4',
  curses: 'C4',
  movement: 'C4',
  warcries: 'C4',
  deployables: 'C5',
  minions: 'C6',
};

export const MILESTONES = ['C3', 'C4', 'C5', 'C6'] as const;

const BUFF_SPELLS = new Set([
  'blood rage',
  'berserk',
  'arctic armour',
  'tempest shield',
  'righteous fire',
  'vaal',
]);

const DOT_WORDS =
  /\b(ignite|ignited|bleed|bleeding|poison|poisoned|ailment|ailments|damage over time|shock|shocked|chill|chilled|freeze|frozen|burning|scorch|brittle|sap)\b/i;

export function gemBucket(g: RefGem): Bucket {
  const tags = new Set(g.tags.map((t) => t.toLowerCase()));
  const name = norm(g.name.replace(/ Support$/, ''));
  if (g.kind === 'support') {
    if (/\b(trap|mine|totem|ballista|minefield|cluster|blastchain)\b/.test(name))
      return 'deployables';
    if (
      /\b(minion|elemental army|infernal legion|meat shield|summon phantasm|feeding frenzy|predator|spectre)\b/.test(
        name,
      )
    )
      return 'minions';
    if (/\b(blasphemy|hextouch|curse)\b/.test(name)) return 'curses';
    if (/^cast |\btrigger/.test(name)) return 'triggers';
    if (/channelling/.test(name)) return 'channelling';
    if (/charge/.test(name)) return 'charges';
    if (
      /\b(bleed|poison|ignite|burning|combustion|decay|ailment|affliction|toxin|toxins|bonechill|hypothermia|unbound|vile|withering|brutality|swift affliction|deadly|critical strike affliction)\b/.test(
        name,
      )
    )
      return 'dot';
    return 'plain';
  }
  if (tags.has('minion') && !tags.has('herald')) return 'minions';
  if (tags.has('totem') || tags.has('trap') || tags.has('mine') || tags.has('brand'))
    return 'deployables';
  if (tags.has('curse') || tags.has('hex') || tags.has('mark')) return 'curses';
  if (tags.has('warcry') || /banner/.test(name)) return 'warcries';
  if (tags.has('movement') || tags.has('travel') || tags.has('blink')) return 'movement';
  if (
    tags.has('aura') ||
    tags.has('herald') ||
    tags.has('guard') ||
    tags.has('stance') ||
    BUFF_SPELLS.has(name)
  )
    return 'auras';
  if (tags.has('channelling')) return 'channelling';
  if (tags.has('trigger')) return 'triggers';
  if (
    /\b(bleed|poison|ignite|contagion|caustic|toxic|wither|blight|essence drain|venom|viper|cobra|pestilent|scorching|decay)\b/.test(
      name,
    )
  )
    return 'dot';
  return 'plain';
}

export function uniqueBucket(u: RefUnique): Bucket {
  const text = `${u.implicit}\n${u.explicit}`.toLowerCase();
  if (/flask$/i.test(u.class)) return 'charges';
  if (
    /\b(minion|minions|spectre|spectres|zombie|zombies|skeleton|skeletons|golem|golems|raise|animated|animate)\b/.test(
      text,
    )
  )
    return 'minions';
  if (/\b(totem|totems|trap|traps|mine|mines|brand|brands)\b/.test(text)) return 'deployables';
  if (/\b(curse|curses|cursed|hex|hexes|mark of|marked)\b/.test(text)) return 'curses';
  if (/\b(warcry|warcries|banner|banners|rallying)\b/.test(text)) return 'warcries';
  if (/\b(movement skill|movement skills|dash|leap|blink|travel skill)\b/.test(text))
    return 'movement';
  if (/\b(aura|auras|herald|heralds|guard skill|guard skills|reserv)/.test(text)) return 'auras';
  if (/\b(channelling|channeling)\b/.test(text)) return 'channelling';
  if (/\bcharges?\b/.test(text)) return 'charges';
  if (
    /\b(trigger|triggered|socketed spell|socketed gems? (?:are|is) (?:cast|triggered)|cast on|when you)/.test(
      text,
    )
  )
    return 'triggers';
  if (DOT_WORDS.test(text)) return 'dot';
  return 'plain';
}

export function loadOverrides(): Record<string, Bucket> {
  try {
    const raw = JSON.parse(
      readFileSync(resolve(COVERAGE_DIR, 'bucket-overrides.json'), 'utf8'),
    ) as Record<string, string>;
    const out: Record<string, Bucket> = {};
    for (const [k, v] of Object.entries(raw)) {
      if (!(BUCKETS as readonly string[]).includes(v))
        throw new Error(`bucket-overrides: "${k}" has unknown bucket ${v}`);
      out[norm(k)] = v as Bucket;
    }
    return out;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return {};
    throw e;
  }
}
