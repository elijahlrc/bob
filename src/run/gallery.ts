import { activeLook, auraLook, DELIVERIES, type SkillLook } from '../calc/skillLook';
import { ACTIVE_GEMS, AURA_GEMS, GRANTED_GEMS } from '../data/gems';
import type { SkillTag } from '../mods/types';
import { makeGem, makeItem } from '../gen/items';
import { createDummyWorld, dummyDefence } from '../sim/dummy';
import type { World } from '../sim/types';
import { spawnMonster } from '../sim/world';
import { newRun, setMap, uidSource, type RunState } from './run';

/**
 * The skill gallery: a demo arena that puts one skill at a time in the hands of a character facing three training
 * dummies, so the look of every skill can be checked and compared (colour for damage type, shape for delivery).
 */

export type GalleryEntry = {
  id: string;
  name: string;
  look: SkillLook;
  /** Weapon base the skill needs, if any. */
  weapon: string;
  offHand?: string;
};

/** The weapon base that gives a weapon tag. */
const WEAPON_FOR: Partial<Record<SkillTag, string>> = {
  sword: 'sword_4',
  axe: 'axe_4',
  mace: 'mace_4',
  sceptre: 'sceptre_4',
  dagger: 'dagger_4',
  claw: 'claw_4',
  wand: 'wand_4',
  staff: 'staff_4',
  bow: 'bow_4',
  twoHand: 'sword2_4',
  oneHand: 'sword_4',
};

/** A blink that only a bow can use (Shadow Quiver). */
const bowBlink = (entry: GalleryEntry): boolean =>
  entry.look.delivery === 'blink' && entry.weapon === WEAPON_FOR.bow;

/** Every skill gem a character can use, in the order the language lists them: by delivery, then by name. */
export function galleryEntries(): GalleryEntry[] {
  const out: GalleryEntry[] = [];
  for (const g of [...ACTIVE_GEMS, ...GRANTED_GEMS]) {
    const look = activeLook(g);
    const need = g.requiresWeapon ?? [];
    const tag = need.find((t) => WEAPON_FOR[t]);
    // A blink stands beside a melee strike (galleryRun), so one that names no weapon is held with a sword.
    let weapon = tag
      ? (WEAPON_FOR[tag] as string)
      : g.skillType === 'attack' || look.delivery === 'blink'
        ? 'sword_4'
        : 'wand_4';
    let offHand: string | undefined;
    if (g.needsShield) offHand = 'shield_ar_4';
    if (g.needsDualWield || g.bothWeapons) {
      weapon = 'sword_4';
      offHand = 'sword_4';
    }
    out.push({ id: g.id, name: g.name, look, weapon, offHand });
  }
  for (const a of AURA_GEMS)
    out.push({ id: a.id, name: a.name, look: auraLook(a), weapon: 'wand_4' });
  const order = (e: GalleryEntry) => DELIVERIES.indexOf(e.look.delivery);
  return out.sort((x, y) => order(x) - order(y) || x.name.localeCompare(y.name));
}

/** A level 60 character holding the skill (with a plain spell as its main skill when the skill itself is not one). */
export function galleryRun(entry: GalleryEntry, seed: number): RunState {
  const run = newRun('mystic', seed);
  const uid = uidSource(run);
  const b = run.build;
  b.level = 60;
  setMap(run, 30);
  b.equipment.mainHand = makeItem(uid, entry.weapon, 60, 1);
  if (entry.offHand) b.equipment.offHand = makeItem(uid, entry.offHand, 60, 1);
  else delete b.equipment.offHand;
  const body = makeItem(uid, 'body_ar_1', 60, 2);
  const utility = entry.look.element < 0;
  // A utility skill needs a damaging skill beside it (a blink a strike, or a bow's volley; any other a spell); any other
  // skill stands alone in the first socket.
  const beside =
    entry.look.delivery !== 'blink'
      ? 'flameBolt'
      : bowBlink(entry)
        ? 'splitVolley'
        : 'crushingBlow';
  body.sockets = (utility ? [beside, entry.id] : [entry.id]).map((g) => makeGem(uid, g));
  b.equipment.body = body;
  b.primaryGem = body.sockets[0]?.uid;
  // A bow's volley reaches as far as the character engages, so a bow's blink never closes a gap: it is shown getting away.
  if (utility && bowBlink(entry))
    b.strategy = { skills: { [body.sockets[1]!.uid]: { role: 'escape' } } };
  b.flasks = [null, null, null, null, null];
  return run;
}

/** The arena: the character and three dummies spread out in front of it, and the player cannot die. */
export function galleryWorld(run: RunState, entry?: GalleryEntry): World {
  // A blink is cast to close a gap the main skill cannot, so its dummies stand as far as the player will go for them.
  const far = entry?.look.delivery === 'blink' && !bowBlink(entry);
  const { world } = createDummyWorld(run.build, { distance: far ? 8 : 4, maxTime: 3600 });
  world.sides[0].opts.godMode = true;
  world.sides[0].opts.freeResources = true;
  if (entry?.look.delivery === 'guard') {
    // A guard skill is cast when life runs low.
    world.sides[0].opts.freeResources = false;
    world.sides[0].player.life = world.sides[0].player.def.maxLife * 0.3;
  }
  // An escape is used when hurt with an enemy near.
  if (entry && bowBlink(entry))
    world.sides[0].player.life = world.sides[0].player.def.maxLife * 0.5;
  const start = world.plan.lab.start;
  for (const [dx, dy] of [
    [far ? 9.5 : 5.5, -2],
    [far ? 11.5 : 5.5, 2],
  ] as const) {
    const d = spawnMonster(
      world,
      { type: 'warrior', variant: 'none', rarity: 'normal', level: 1, mods: [] },
      start.x + dx,
      start.y + dy,
      0,
      0,
      'Training Dummy',
    );
    d.dummy = true;
    d.def = dummyDefence();
    d.life = d.def.maxLife;
    d.r = 0.5;
  }
  return world;
}
