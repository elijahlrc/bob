import type { ActiveGemDef, GemDef } from '../data/gems';
import { ACTIVE_GEMS, GRANTED_GEMS } from '../data/gems';
import type { Build } from '../data/types';
import { makeGem, makeItem } from '../gen/items';
import { newRun } from '../run/run';
import { createDummyWorld } from './dummy';
import type { Actor, World } from './types';
import { stepWorld } from './world';

/**
 * Scenarios for running one gem in the sim (docs/SPIRIT.md 4.3): the smoke test of every gem and the effects check of the
 * spirit ledger both build a character around a gem, put a dummy in front of it and watch. Test support, not game code.
 */

const WEAPON_FOR: Record<string, string> = {
  bow: 'bow_3',
  dagger: 'dagger_3',
  claw: 'claw_3',
  sword: 'sword_3',
  axe: 'axe_3',
  mace: 'mace_3',
  sceptre: 'sceptre_3',
  wand: 'wand_3',
  staff: 'staff_3',
};
const CLASS_FOR = { str: 'vanguard', dex: 'strider', int: 'mystic' } as const;

/** The class whose attribute a gem draws on. */
export const classFor = (a: GemDef['attr']): string =>
  a === 'str' || a === 'strdex'
    ? CLASS_FOR.str
    : a === 'dex' || a === 'dexint'
      ? CLASS_FOR.dex
      : CLASS_FOR.int;

let n = 20000;
const uid = () => n++;

/** A weapon the gem can be used with. */
export function weaponFor(def: ActiveGemDef): string {
  const req = def.requiresWeapon?.find((t) => WEAPON_FOR[t]);
  if (req) return WEAPON_FOR[req];
  if (def.skillType === 'attack') return def.tags.includes('projectile') ? 'bow_3' : 'sword_3';
  return 'wand_3';
}

/** A level-50 character with `gems` socketed in the body armour, the first of them the primary skill. */
export function buildFor(
  gems: string[],
  main: string,
  classId: string,
  off: 'none' | 'dual' | 'shield' = 'none',
): Build {
  const run = newRun(classId, 1);
  const b = run.build;
  b.level = 50;
  b.equipment.mainHand = makeItem(uid, main, 50, 1);
  if (off === 'dual') b.equipment.offHand = makeItem(uid, main, 50, 1);
  else if (off === 'shield') b.equipment.offHand = makeItem(uid, 'shield_ar_3', 50, 1);
  else delete b.equipment.offHand;
  const body = makeItem(uid, 'body_ar_1', 50, Math.max(1, gems.length));
  body.sockets = gems.map((g) => makeGem(uid, g));
  b.equipment.body = body;
  b.primaryGem = body.sockets[0]?.uid;
  b.flasks = [null, null, null, null, null];
  return b;
}

/** The build the smoke test uses for an active (or item-granted) gem. */
export function buildForActive(def: ActiveGemDef): Build {
  const granted = GRANTED_GEMS.includes(def);
  const b = buildFor(
    granted
      ? def.utility
        ? ['crushingBlow']
        : []
      : def.utility
        ? ['crushingBlow', def.id]
        : [def.id],
    weaponFor(def),
    classFor(def.attr),
    def.needsShield ? 'shield' : def.needsDualWield || def.bothWeapons ? 'dual' : 'none',
  );
  // An item-granted utility skill comes with a damage skill to stand beside, and a mod that grants it.
  if (granted && def.utility)
    b.equipment.body!.uniqueMods = [{ stat: `grantSkill.${def.id}`, kind: 'base', value: 20 }];
  return b;
}

export const activeGem = (id: string): ActiveGemDef => {
  const d = [...ACTIVE_GEMS, ...GRANTED_GEMS].find((g) => g.id === id);
  if (!d) throw new Error(`no active gem ${id}`);
  return d;
};

export type GemRun = { world: World; dummy: Actor; effects: Set<string> };

/** The tags a sim step shows (the vocabulary of `effects` in docs/coverage/spirit.json). */
export function noteEffects(w: World, into: Set<string>): void {
  for (const e of w.events) {
    switch (e.t) {
      case 'hit':
        into.add('hit');
        break;
      case 'trigger':
        into.add(`trigger:${e.kind}`);
        break;
      case 'buff':
        into.add(`buff:${e.id}`);
        break;
      case 'hex':
        into.add(`hex:${e.hex}`);
        break;
      case 'ailment':
        into.add(`ailment:${e.kind}`);
        break;
      case 'deploy':
        into.add(`deploy:${e.kind}`);
        break;
      case 'charge':
        into.add(`charge:${e.kind}`);
        break;
      case 'blink':
      case 'explode':
      case 'beam':
      case 'swing':
      case 'thrust':
      case 'chain':
      case 'echo':
      case 'block':
      case 'death':
        into.add(e.t);
        break;
      case 'projectileSpawned':
        into.add('projectile');
        break;
      default:
        break;
    }
  }
  if (w.minions.length > 0) into.add('minion');
  if (w.zones.length > 0) into.add('zone');
}

/**
 * Run an active gem for `seconds` against the dummy, as the smoke test does, and report what happened. A utility gem is cast
 * by policy beside a damage skill, so the dummy is a boss (rallying skills wait for one) and a guard waits for low life.
 */
export function runGem(def: ActiveGemDef, seconds = 10): GemRun {
  const b = buildForActive(def);
  const { world, dummy } = createDummyWorld(b, { distance: def.utility ? 2 : 2.5 });
  world.opts.freeResources = true;
  world.opts.godMode = true;
  if (def.utility) {
    dummy.rarity = 'boss';
    const u = def.utility;
    if (u.kind === 'buff' && u.policy === 'guard')
      world.player.life = world.player.def.maxLife * 0.4;
  }
  const effects = new Set<string>();
  for (let i = 0; i < seconds * 60; i++) {
    stepWorld(world);
    noteEffects(world, effects);
  }
  return { world, dummy, effects };
}
