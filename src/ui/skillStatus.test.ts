import { describe, expect, it } from 'vitest';
import { CLASSES } from '../data/classes';
import type { Build } from '../data/types';
import { makeGem, makeItem } from '../gen/items';
import { newRun } from '../run/run';
import { createDummyWorld } from '../sim/dummy';
import { DEPLOY_SECONDS } from '../sim/deploy';
import { summonMinions } from '../sim/minions';
import type { World } from '../sim/types';
import { stepWorld } from '../sim/world';
import { skillSlots } from './skillStatus';

let n = 130000;
const uid = () => n++;

function build(gems: string[], classId = 'mystic', main = 'wand_3'): Build {
  const b = newRun(classId, 1).build;
  b.level = 50;
  b.equipment.mainHand = makeItem(uid, main, 50, 1);
  delete b.equipment.offHand;
  const body = makeItem(uid, 'body_ar_1', 50, Math.max(1, gems.length));
  body.sockets = gems.map((g) => makeGem(uid, g));
  b.equipment.body = body;
  b.primaryGem = body.sockets[0]?.uid;
  b.flasks = [null, null, null, null, null];
  return b;
}

function arena(gems: string[], classId?: string, main?: string): World {
  const { world, dummy } = createDummyWorld(build(gems, classId, main), { distance: 3 });
  world.opts.freeResources = true;
  world.opts.godMode = true;
  // A big enemy, so that rallying skills want to be cast.
  dummy.rarity = 'boss';
  return world;
}

function run(w: World, seconds: number, until?: () => boolean): void {
  for (let i = 0; i < seconds * 60; i++) {
    stepWorld(w);
    if (until?.()) return;
  }
}

describe('skill bar slots', () => {
  it('never throws on a character with no skills, and shows the basic attack alone', () => {
    const w = arena([]);
    const slots = skillSlots(w);
    expect(slots).toHaveLength(1);
    expect(slots[0].role).toBe('Basic attack');
    expect(slots[0].detail).toContain('Basic attack');
  });

  it('works for every fresh class, with unique keys, and for a few seconds of play', () => {
    for (const c of CLASSES) {
      const b = newRun(c.id, 1).build;
      const { world } = createDummyWorld(b, { distance: 3 });
      world.opts.godMode = true;
      for (let i = 0; i < 4; i++) {
        run(world, 1);
        const slots = skillSlots(world);
        expect(slots.length).toBeGreaterThan(0);
        expect(new Set(slots.map((s) => s.key)).size).toBe(slots.length);
        for (const s of slots) {
          expect(s.remaining).toBeGreaterThanOrEqual(0);
          expect(s.total).toBeGreaterThanOrEqual(0);
          expect(s.detail.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('lists the primary first, and the basic attack only when there is no primary skill', () => {
    const w = arena(['flameBolt', 'frostLance']);
    const slots = skillSlots(w);
    expect(slots[0].role).toBe('Primary');
    expect(slots[0].name).toBe(w.char.primary.skill.name);
    expect(slots.some((s) => s.role === 'Basic attack')).toBe(false);
    // The tooltip names the skill, its role, delivery, element, cost, cooldown and state.
    expect(slots[0].detail).toContain('Primary');
    expect(slots[0].detail).toContain('Projectile spell');
    expect(slots[0].detail).toContain('Fire');
    expect(slots[0].detail).toContain('Cost');
    expect(slots[0].detail).toContain('cooldown');
    expect(slots[0].detail).toContain('Ready');
  });

  it('shows a skill being used as casting, with the time left in the cast', () => {
    const w = arena(['flameBolt']);
    run(w, 3, () => w.player.action?.which === 'primary');
    expect(w.player.action?.which).toBe('primary');
    const s = skillSlots(w)[0];
    expect(s.state).toBe('casting');
    expect(s.total).toBeCloseTo(w.player.action!.duration, 6);
    expect(s.remaining).toBeGreaterThan(0);
    expect(s.remaining).toBeLessThanOrEqual(s.total);
  });

  it('a secondary cools down right after it is cast, and is ready again later', () => {
    const w = arena(['flameBolt', 'frostLance']);
    const second = w.char.secondaries[0];
    expect(second).toBeDefined();
    const slotOf = () => skillSlots(w).find((s) => s.key === second.key)!;
    expect(slotOf().role).toBe('Secondary');
    expect(slotOf().state).toBe('ready');
    run(w, 5, () => (w.secondaryReady[second.key] ?? 0) > w.t);
    expect((w.secondaryReady[second.key] ?? 0) > w.t).toBe(true);
    // Let the cast itself finish, so the cooldown is what shows.
    run(
      w,
      2,
      () => w.player.action === null || w.player.action.profile.skill.id !== second.skill.id,
    );
    const cooling = slotOf();
    expect(cooling.state).toBe('cooling');
    expect(cooling.remaining).toBeGreaterThan(0);
    expect(cooling.total).toBeGreaterThanOrEqual(cooling.remaining);
    expect(cooling.detail).toContain('Cooling down');
    // Time passes: the remaining time is what is left of the ready time.
    const before = cooling.remaining;
    run(w, 0.5);
    const later = slotOf();
    if (later.state === 'cooling') expect(later.remaining).toBeLessThan(before);
    w.secondaryReady[second.key] = w.t;
    w.player.action = null;
    expect(slotOf().state).toBe('ready');
    expect(slotOf().remaining).toBe(0);
  });

  it('a summon shows how many minions stand against how many it keeps', () => {
    const w = arena(['flameBolt', 'raiseHusk']);
    const c = w.char.utilities[0];
    const slotOf = () => skillSlots(w).find((s) => s.key === c.key)!;
    const want = slotOf().badge!;
    expect(slotOf().role).toBe('Utility');
    expect(want).toMatch(/^0\/\d+$/);
    const keep = Number(want.split('/')[1]);
    summonMinions(w, c, w.char.profile(c, 0, 0));
    expect(slotOf().badge).toBe(`${keep}/${keep}`);
    expect(slotOf().state).toBe('active');
    // One falls: the skill wants to cast again.
    const m = w.minions.find((x) => x.key === c.key)!;
    m.alive = false;
    expect(slotOf().badge).toBe(`${keep - 1}/${keep}`);
    expect(slotOf().state).toBe('ready');
  });

  it('a buff that is up shows as active with its seconds left', () => {
    const w = arena(['crushingBlow', 'steadfastBellow'], 'vanguard', 'sword_3');
    const c = w.char.utilities[0];
    const u = c.skill.utility!;
    expect(u.kind).toBe('buff');
    if (u.kind !== 'buff') return;
    const slotOf = () => skillSlots(w).find((s) => s.key === c.key)!;
    run(w, 20, () => w.buffT[u.buff] > 0);
    expect(w.buffT[u.buff]).toBeGreaterThan(0);
    // Past the cast itself.
    run(w, 1);
    const s = slotOf();
    expect(s.state).toBe('active');
    expect(s.remaining).toBeCloseTo(w.buffT[u.buff], 6);
    expect(s.total).toBeGreaterThanOrEqual(s.remaining);
    expect(s.detail).toContain('Active');
    // When it runs out it is no longer active.
    w.buffT[u.buff] = 0;
    expect(slotOf().state).not.toBe('active');
  });

  it('counts standing totems and traps in the badge', () => {
    const t = arena(['flameBolt', 'standingCast']);
    expect(t.char.primary.deploy).toBe('totem');
    expect(skillSlots(t)[0].badge).toMatch(/^0\/\d+$/);
    run(t, 6, () => t.deployables.length > 0);
    expect(t.deployables.length).toBeGreaterThan(0);
    run(t, 1);
    const [cur, cap] = skillSlots(t)[0].badge!.split('/').map(Number);
    expect(cur).toBe(t.deployables.filter((d) => d.key === t.char.primary.key).length);
    expect(cap).toBeGreaterThanOrEqual(cur);
    if (cur >= cap) {
      const s = skillSlots(t)[0];
      expect(s.state).toBe('active');
      expect(s.total).toBe(DEPLOY_SECONDS.totem);
      expect(s.remaining).toBeGreaterThan(0);
    }

    const r = arena(['frostTrap']);
    expect(r.char.primary.deploy).toBe('trap');
    run(r, 10, () => r.deployables.length > 0);
    expect(r.deployables.length).toBeGreaterThan(0);
    const trap = skillSlots(r)[0];
    expect(trap.badge).toBe(`${r.deployables.length}/${trap.badge!.split('/')[1]}`);
  });

  it('shows an aura as always on', () => {
    const w = arena(['crushingBlow', 'kindlingHalo'], 'vanguard', 'sword_3');
    const aura = skillSlots(w).find((s) => s.role === 'Aura');
    expect(aura).toBeDefined();
    expect(aura!.state).toBe('passive');
    expect(aura!.detail).toContain('Aura');
    // The order is primary, secondaries, utilities, auras.
    const roles = skillSlots(w).map((s) => s.role);
    expect(roles.indexOf('Aura')).toBeGreaterThan(roles.indexOf('Primary'));
  });

  it('marks a skill the character cannot pay for', () => {
    const w = arena(['flameBolt']);
    w.opts.freeResources = false;
    expect(w.char.profile(w.char.primary, 0, 0).cost).toBeGreaterThan(0);
    w.player.mana = 0;
    const s = skillSlots(w)[0];
    expect(s.state).toBe('nopay');
    expect(s.detail).toContain('Not enough mana');
  });
});
