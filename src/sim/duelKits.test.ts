import { describe, expect, it } from 'vitest';
import { DT } from '../data/constants';
import { FLOOR } from '../gen/labyrinth';
import { ACTIVE_GEMS, GRANTED_GEMS } from '../data/gems';
import type { Build } from '../data/types';
import { newRun } from '../run/run';
import { useBanner } from './banners';
import { enemiesOf } from './actions';
import { hit, lifeCap } from './combat';
import { createDuelWorld, DUEL_GAP } from './duel';
import type { Field } from './fields';
import { activeGem, buildForActive, seedFor } from './gemKit';
import type { Ledger } from './ledger';
import { makeMinion, type Minion } from './minions';
import { launch } from './shots';
import { Grid } from './grid';
import { enemiesWithin, foeMinions, livingEnemiesOf, MONSTERS } from './side';
import type { Side } from './side';
import type { World } from './types';
import { spawnMonster, stepWorld } from './world';

/**
 * Every kit across sides (docs/DUEL.md F3): a kit is given to one side only, and its effect is looked for on the other. The
 * characters that must not fight are stunned (they stand and take it) and, where they are to be hurt, cannot die.
 */

const vanguard = (seed = 1): Build => newRun('vanguard', seed).build;

const run = (w: World, seconds: number): void => {
  for (let i = 0; i < Math.round(seconds / DT); i++) stepWorld(w);
};

/** What one named row of a ledger side has entered, and everything it has. */
const rowTotal = (rows: Ledger['dealt'], name: string): number =>
  Object.values(rows)
    .flatMap((m) => [...m.values()])
    .filter((r) => r.name === name)
    .reduce((n, r) => n + r.dmg.reduce((x, y) => x + y, 0), 0);
const total = (rows: Ledger['dealt']): number =>
  Object.values(rows)
    .flatMap((m) => [...m.values()])
    .reduce((n, r) => n + r.dmg.reduce((x, y) => x + y, 0), 0);

/** The character stands where it is and takes what comes (it cannot act); with `immortal` it cannot die either. */
const still = (s: Side, immortal = true): void => {
  s.player.stunT = 1e9;
  if (immortal) s.opts.godMode = true;
};

/** The build with extra mods on its body armour. */
const withMods = (b: Build, ...mods: { stat: string; kind: 'base'; value: number }[]): Build => {
  b.equipment.body!.uniqueMods = [...(b.equipment.body!.uniqueMods ?? []), ...mods];
  return b;
};

/** A minion of the gem `gem` standing at a spot, as the AI's summon would put it down. */
function minionOf(w: World, s: Side, gem: string, x: number, y: number): Minion {
  const c = s.char.utilities.find((u) => u.skill.id === gem)!;
  const u = c.skill.utility;
  if (u?.kind !== 'summon') throw new Error(`${gem} is no summon`);
  return makeMinion(w, s, c, s.char.profile(c, 0), u.minion, x, y);
}

/** A minion that stands where it is, with life enough to last. */
function standing(m: Minion): Minion {
  m.stunT = 1e9;
  m.life = m.def.maxLife;
  return m;
}

describe('minions across sides', () => {
  it('a minion of B attacks A’s character, and the blows are B’s in both ledgers', () => {
    const b = buildForActive(activeGem('callBonewalkers'));
    const w = createDuelWorld(vanguard(1), b, 1);
    const [sa, sb] = w.sides;
    still(sa);
    still(sb);
    // B's skeletons stand beside it and are sent: they run at A.
    for (let i = 0; i < 3; i++)
      minionOf(w, sb, 'callBonewalkers', sb.player.x - 1, sb.player.y + i - 1);
    run(w, 6);
    expect(sa.player.life).toBeLessThan(lifeCap(sa.player));
    expect(rowTotal(sa.ledger.taken, 'Minion')).toBeGreaterThan(0);
    expect(rowTotal(sb.ledger.dealt, 'Minion')).toBeCloseTo(rowTotal(sa.ledger.taken, 'Minion'), 6);
    expect(sb.ledger.dealt.minion.get('Minion')!.hits).toBeGreaterThan(0);
    expect(sb.stats.damageDealt).toBeGreaterThan(0);
    // None of it is A's, and B's character took nothing.
    expect(total(sa.ledger.dealt)).toBe(0);
    expect(sa.stats.damageDealt).toBe(0);
    expect(sb.player.life).toBe(lifeCap(sb.player));
  });

  it('the minions of both sides go for each other', () => {
    const w = createDuelWorld(
      buildForActive(activeGem('callBonewalkers')),
      buildForActive(activeGem('callBonewalkers')),
      1,
    );
    const [sa, sb] = w.sides;
    still(sa);
    still(sb);
    const mine = [0, 1, 2].map((i) =>
      minionOf(w, sa, 'callBonewalkers', sa.player.x + 1, sa.player.y + i - 1),
    );
    const theirs = [0, 1, 2].map((i) =>
      minionOf(w, sb, 'callBonewalkers', sb.player.x - 1, sb.player.y + i - 1),
    );
    run(w, 8);
    // Nothing else hurts a minion: one that has been hurt (or has fallen) was hurt by the other side's.
    const hurt = (ms: Minion[]) => ms.some((m) => !m.alive || m.life < m.def.maxLife);
    expect(hurt(mine)).toBe(true);
    expect(hurt(theirs)).toBe(true);
    // Each side's blows are its own, dealt to minions that are no character's taken.
    expect(rowTotal(sa.ledger.dealt, 'Minion')).toBeGreaterThan(0);
    expect(rowTotal(sb.ledger.dealt, 'Minion')).toBeGreaterThan(0);
  });

  it('what a character can strike is the other side’s character and minions, and never its own', () => {
    const w = createDuelWorld(
      buildForActive(activeGem('callBonewalkers')),
      buildForActive(activeGem('callBonewalkers')),
      1,
    );
    const [sa, sb] = w.sides;
    const mine = minionOf(w, sa, 'callBonewalkers', sa.player.x + 1, sa.player.y);
    const theirs = minionOf(w, sb, 'callBonewalkers', sb.player.x - 1, sb.player.y);
    expect(enemiesOf(w, sa.player)).toEqual([sb.player, theirs]);
    expect(enemiesOf(w, sb.player)).toEqual([sa.player, mine]);
    // A minion's enemies are the same: the other side's.
    expect(enemiesOf(w, mine)).toEqual([sb.player, theirs]);
    expect(enemiesOf(w, theirs)).toEqual([sa.player, mine]);
    // A minion that has fallen is no enemy.
    theirs.alive = false;
    expect(enemiesOf(w, sa.player)).toEqual([sb.player]);
  });

  it('a hit of A’s on B’s minion is in A’s ledger, and in none of B’s; it feeds A’s charges', () => {
    const b = buildForActive(activeGem('callBonewalkers'));
    const a = withMods(vanguard(1), { stat: 'chargeOn.hit.fervour', kind: 'base', value: 100 });
    const w = createDuelWorld(a, b, 1);
    const [sa, sb] = w.sides;
    const m = standing(minionOf(w, sb, 'callBonewalkers', sa.player.x + 1, sa.player.y));
    const prof = sa.char.profile(sa.primary, 0);
    expect(sa.char.charges.fervour).toBe(0);
    for (let i = 0; i < 5; i++) hit(w, sa.player, m, prof, 0, 1);
    expect(m.life).toBeLessThan(m.def.maxLife);
    expect(total(sa.ledger.dealt)).toBeGreaterThan(0);
    expect(sa.stats.damageDealt).toBeGreaterThan(0);
    const rows = [...sa.ledger.dealt.skill.values()];
    expect(rows.reduce((n, r) => n + r.hits + r.misses, 0)).toBe(5);
    expect(sa.char.charges.fervour).toBeGreaterThan(0);
    expect(total(sb.ledger.taken)).toBe(0);
    expect(total(sb.ledger.dealt)).toBe(0);
    expect(sb.stats.damageDealt).toBe(0);
    expect(sb.char.charges.fervour).toBe(0);
  });

  /** A debuff of damage over time that kills `m` on the next tick, `by` a side (or nobody). */
  function burnDown(m: Minion, by: Side | undefined): void {
    m.life = 1;
    m.sdots.push({
      src: 'burn',
      dps: 1e6,
      raw: 1,
      type: 3,
      t: 2,
      layer: false,
      n: 1,
      spreadR: 0,
      carry: false,
      regen: 0,
      by,
    });
  }

  it('a kill of a minion by the other side’s damage gives a kill’s charges, and is no kill: no count, no experience', () => {
    const b = buildForActive(activeGem('callBonewalkers'));
    const a = withMods(vanguard(1), { stat: 'chargeOn.kill.grit', kind: 'base', value: 100 });
    const w = createDuelWorld(a, b, 1);
    const [sa, sb] = w.sides;
    still(sa);
    still(sb);
    const m = minionOf(w, sb, 'callBonewalkers', sb.player.x, sb.player.y + 3);
    sa.player.since.kill = 99;
    burnDown(m, sa);
    stepWorld(w);
    expect(m.alive).toBe(false);
    expect(sa.char.charges.grit).toBeGreaterThan(0);
    expect(sa.player.since.kill).toBeLessThan(1);
    expect(sa.stats.kills).toBe(0);
    expect(sa.xp).toBe(0);
    expect(sa.stats.damageDealt).toBeGreaterThan(0);
    // B gained nothing by losing it, nor did it deal anything.
    expect(sb.char.charges.grit).toBe(0);
    expect(sb.stats.damageDealt).toBe(0);
  });

  it('and a minion that falls of nobody’s damage, or of its own side’s, gives nothing to anyone', () => {
    for (const own of [false, true]) {
      const b = buildForActive(activeGem('callBonewalkers'));
      const a = withMods(vanguard(1), { stat: 'chargeOn.kill.grit', kind: 'base', value: 100 });
      const w = createDuelWorld(
        a,
        withMods(b, { stat: 'chargeOn.kill.grit', kind: 'base', value: 100 }),
        1,
      );
      const [sa, sb] = w.sides;
      still(sa);
      still(sb);
      const m = minionOf(w, sb, 'callBonewalkers', sb.player.x, sb.player.y + 3);
      sa.player.since.kill = 99;
      sb.player.since.kill = 99;
      burnDown(m, own ? sb : undefined);
      stepWorld(w);
      expect(m.alive).toBe(false);
      expect(sa.char.charges.grit).toBe(0);
      expect(sb.char.charges.grit).toBe(0);
      expect(sa.player.since.kill).toBeGreaterThan(90);
      expect(sb.player.since.kill).toBeGreaterThan(90);
    }
  });
});

describe('deployables across sides', () => {
  it('A’s totem shoots B, and the shots are A’s', () => {
    const def = activeGem('pyreTotem');
    const w = createDuelWorld(buildForActive(def), vanguard(2), 1);
    const [sa, sb] = w.sides;
    still(sb);
    let placed = 0;
    for (let i = 0; i < 10 * 60; i++) {
      stepWorld(w);
      for (const e of w.events) if (e.t === 'deploy' && !e.end) placed++;
    }
    expect(placed).toBeGreaterThan(0);
    expect(sb.player.life).toBeLessThan(lifeCap(sb.player));
    // The use of the skill places the totem and hits nothing: what B took was the totem's.
    expect(rowTotal(sb.ledger.taken, def.name)).toBeGreaterThan(0);
    expect(rowTotal(sa.ledger.dealt, def.name)).toBeCloseTo(rowTotal(sb.ledger.taken, def.name), 6);
    expect(sa.player.life).toBe(lifeCap(sa.player));
    expect(sb.stats.damageDealt).toBe(0);
  });

  it('A’s mines go off when B stands near them, and the blast is A’s', () => {
    const def = activeGem('icicleCharge');
    const w = createDuelWorld(buildForActive(def), vanguard(2), 1);
    const [sa, sb] = w.sides;
    still(sb);
    let placed = 0;
    let sprung = 0;
    for (let i = 0; i < 12 * 60; i++) {
      stepWorld(w);
      for (const e of w.events) {
        if (e.t === 'deploy' && !e.end) placed++;
        if (e.t === 'sprung') sprung++;
      }
    }
    expect(placed).toBeGreaterThan(0);
    expect(sprung).toBeGreaterThan(0);
    expect(rowTotal(sb.ledger.taken, def.name)).toBeGreaterThan(0);
    expect(rowTotal(sa.ledger.dealt, def.name)).toBeCloseTo(rowTotal(sb.ledger.taken, def.name), 6);
    expect(sb.stats.damageDealt).toBe(0);
  });
});

describe('fields across sides', () => {
  /** A patch of caustic ground of B's acid on A's spot, and nobody to act. */
  function acidGround() {
    const def = activeGem('acidArrow');
    const w = createDuelWorld(vanguard(1), buildForActive(def), 1);
    const [sa, sb] = w.sides;
    still(sa);
    still(sb);
    const profile = sb.char.profile(sb.primary, 0);
    const field: Field = {
      id: w.nextId++,
      owner: sb.player.id,
      kind: 'caustic',
      x: sa.player.x,
      y: sa.player.y,
      r0: 3,
      grow: 1,
      radius: 3,
      t: 6,
      total: 6,
      profile,
      hand: 0,
      pulseT: 0,
      interval: 0.25,
      dps: 0,
      dtype: 4,
    };
    sb.fields.push(field);
    return { w, sa, sb, def };
  }

  it('B’s caustic ground burns A, and the burn is in B’s ledger', () => {
    const { w, sa, sb, def } = acidGround();
    run(w, 3);
    expect(sa.player.sdots.length).toBeGreaterThan(0);
    expect(sa.player.sdots[0].by).toBe(sb);
    expect(sa.player.life).toBeLessThan(lifeCap(sa.player));
    expect(rowTotal(sb.ledger.dealt, def.name)).toBeGreaterThan(0);
    expect(rowTotal(sa.ledger.taken, def.name)).toBeCloseTo(rowTotal(sb.ledger.dealt, def.name), 6);
    expect(sb.stats.damageDealt).toBeGreaterThan(0);
    expect(total(sa.ledger.dealt)).toBe(0);
    expect(sa.stats.damageDealt).toBe(0);
  });

  it('and spares B, whose ground it is', () => {
    const { w, sa, sb } = acidGround();
    // B stands in its own patch instead.
    sa.player.x = sb.player.x + 12;
    run(w, 3);
    expect(sb.player.sdots).toHaveLength(0);
    expect(sa.player.sdots).toHaveLength(0);
    expect(total(sb.ledger.taken)).toBe(0);
  });

  it('A’s creeping ground drifts toward B, and not toward A', () => {
    const def = activeGem('rimeDrift');
    const w = createDuelWorld(buildForActive(def), vanguard(2), 1);
    const [sa, sb] = w.sides;
    still(sa);
    still(sb);
    const f: Field = {
      id: w.nextId++,
      owner: sa.player.id,
      kind: 'chilling',
      x: sa.player.x + 2,
      y: sa.player.y,
      r0: 1,
      grow: 1,
      radius: 1,
      t: 30,
      total: 30,
      profile: sa.char.profile(sa.primary, 0),
      hand: 0,
      pulseT: 1e9,
      interval: 0.5,
      dps: 0,
      dtype: 2,
      creep: 1.5,
    };
    sa.fields.push(f);
    const x0 = f.x;
    run(w, 2);
    // B is 6 tiles beyond it, A 2 tiles behind: it went toward B.
    expect(f.x).toBeGreaterThan(x0 + 2);
    expect(f.x).toBeLessThan(sb.player.x);
  });

  /** B carries a banner (what its cast does): its aura is round B. A stands `gap` tiles from B. */
  function bannerWorld(gap: number) {
    const def = activeGem('standardOfValour');
    const w = createDuelWorld(vanguard(1), buildForActive(def), 1);
    const [sa, sb] = w.sides;
    still(sa);
    still(sb);
    const c = sb.char.utilities.find((u) => u.skill.id === def.id)!;
    useBanner(w, sb, c, sb.char.profile(c, 0));
    sa.player.x = sb.player.x - gap;
    sa.player.y = sb.player.y;
    return { w, sa, sb };
  }

  it('B’s banner puts its enemy status on A when A stands in its reach, and not on its own character', () => {
    const { w, sa, sb } = bannerWorld(3);
    run(w, 1);
    expect(sb.banner).not.toBeNull();
    expect(sa.player.fx.scarred).toBeDefined();
    expect(sb.player.fx.scarred).toBeUndefined();
  });

  it('and not when A stands beyond it', () => {
    const { w, sa } = bannerWorld(8);
    run(w, 1);
    expect(sa.player.fx.scarred).toBeUndefined();
  });
});

describe('triggers and burst skills across sides', () => {
  it('A’s counter-attack fires when B hits A, and strikes B', () => {
    const def = activeGem('anvilDrop');
    const w = createDuelWorld(buildForActive(def), vanguard(2), 1);
    const [sa, sb] = w.sides;
    // A cannot act: only its trigger can answer B's blows.
    still(sa);
    let fired = 0;
    for (let i = 0; i < 40 * 60 && rowTotal(sa.ledger.dealt, def.name) === 0; i++) {
      stepWorld(w);
      for (const e of w.events) if (e.t === 'trigger') fired++;
    }
    expect(sa.stats.damageTaken).toBeGreaterThan(0);
    expect(fired).toBeGreaterThan(0);
    expect(rowTotal(sa.ledger.dealt, def.name)).toBeGreaterThan(0);
    expect(rowTotal(sb.ledger.taken, def.name)).toBeCloseTo(rowTotal(sa.ledger.dealt, def.name), 6);
    // B's side has no trigger of its own, and dealt no counter-attack.
    expect(Object.keys(sb.trig.cooldown)).toHaveLength(0);
    expect(rowTotal(sb.ledger.dealt, def.name)).toBe(0);
  });

  it('A’s Molten Shell goes off on B, and the burst is A’s', () => {
    const w = createDuelWorld(buildForActive(activeGem('slagCarapace')), vanguard(2), 1);
    const [sa, sb] = w.sides;
    still(sa);
    still(sb);
    // A's shell has taken a hit and its buff has run out: the burst goes to the enemies about it.
    sa.shell = {
      left: 1e9,
      taken: 1000,
      absorb: 0.5,
      reflect: 100,
      radius: DUEL_GAP + 2,
      buff: 'moltenGuard',
      profile: sa.char.profile(sa.primary, 0),
    };
    sa.buffT.moltenGuard = 0;
    stepWorld(w);
    expect(sa.shell).toBeNull();
    expect(sb.player.life).toBeLessThan(lifeCap(sb.player));
    expect(rowTotal(sa.ledger.dealt, 'Molten Shell')).toBeGreaterThan(0);
    expect(rowTotal(sb.ledger.taken, 'Molten Shell')).toBeCloseTo(
      rowTotal(sa.ledger.dealt, 'Molten Shell'),
      6,
    );
    expect(sa.stats.damageDealt).toBeGreaterThan(0);
    expect(sb.stats.damageDealt).toBe(0);
    expect(sa.player.life).toBe(lifeCap(sa.player));
  });
});

describe('projectiles across sides', () => {
  it('a projectile of A hits B’s minion and B’s character, and never A’s own minion', () => {
    const def = activeGem('callBonewalkers');
    const a = buildForActive(def);
    const b = buildForActive(def);
    const w = createDuelWorld(a, b, 1);
    const [sa, sb] = w.sides;
    still(sa);
    still(sb);
    const y = sa.player.y;
    // A's own minion in front of A, then B's, then B: all in one line, none acting.
    const own = standing(minionOf(w, sa, 'callBonewalkers', sa.player.x + 2, y));
    const foe = standing(minionOf(w, sb, 'callBonewalkers', sa.player.x + 4, y));
    const prof = { ...sa.char.profile(sa.primary, 0), pierce: 5 };
    launch(w, sa.player, prof, 0, sa.player.x + 0.5, y, 0, {
      hitIds: [],
      aimId: sb.player.id,
      range: 12,
    });
    const own0 = own.life;
    const me0 = sa.player.life;
    run(w, 1.5);
    expect(foe.life).toBeLessThan(foe.def.maxLife);
    expect(sb.player.life).toBeLessThan(lifeCap(sb.player));
    expect(own.life).toBe(own0);
    expect(sa.player.life).toBe(me0);
    // The hit on B's minion is A's dealt too, though no character took it: A dealt more than B took.
    expect(total(sb.ledger.taken)).toBeGreaterThan(0);
    expect(total(sa.ledger.dealt)).toBeGreaterThan(total(sb.ledger.taken));
    expect(total(sb.ledger.dealt)).toBe(0);
  });

  it('a projectile of A stops at B’s minion in its way, as it would at a monster', () => {
    const def = activeGem('callBonewalkers');
    const w = createDuelWorld(buildForActive(def), buildForActive(def), 1);
    const [sa, sb] = w.sides;
    still(sa);
    still(sb);
    const y = sa.player.y;
    const foe = standing(minionOf(w, sb, 'callBonewalkers', sa.player.x + 3, y));
    const prof = { ...sa.char.profile(sa.primary, 0), pierce: 0 };
    launch(w, sa.player, prof, 0, sa.player.x + 0.5, y, 0, {
      hitIds: [],
      aimId: sb.player.id,
      range: 12,
    });
    run(w, 1.5);
    expect(foe.life).toBeLessThan(foe.def.maxLife);
    expect(sb.player.life).toBe(lifeCap(sb.player));
  });
});

describe('monsters between two sides', () => {
  it('walk to the nearer character by the flow field, whichever side it is', () => {
    const w = createDuelWorld(vanguard(1), vanguard(2), 1);
    const [sa, sb] = w.sides;
    still(sa);
    still(sb);
    // 9.8 tiles from A (the nearer) and 11 from B: out of the straight dash, so the flow field leads it.
    const at = { x: sa.player.x + 2.5, y: sa.player.y + 9.5 };
    const m = spawnMonster(
      w,
      { type: 'warrior', variant: 'none', rarity: 'normal', level: 1, mods: [] },
      at.x,
      at.y,
      0,
      0,
      'Warrior',
    );
    m.state = 'chase';
    stepWorld(w);
    // The field is the distance to the nearer of the two, and it is nothing at either.
    expect(w.grid.flowAt(Math.floor(sa.player.x), Math.floor(sa.player.y))).toBe(0);
    expect(w.grid.flowAt(Math.floor(sb.player.x), Math.floor(sb.player.y))).toBe(0);
    const dA = Math.hypot(m.x - sa.player.x, m.y - sa.player.y);
    const dB = Math.hypot(m.x - sb.player.x, m.y - sb.player.y);
    expect(dA).toBeLessThan(dB);
    run(w, 1.5);
    // It went toward A (west), not toward B (east: where the last side's field led it).
    expect(m.x).toBeLessThan(at.x - 0.5);
    expect(Math.hypot(m.x - sa.player.x, m.y - sa.player.y)).toBeLessThan(dA - 1);
  });

  it('and to B when B is the nearer', () => {
    const w = createDuelWorld(vanguard(1), vanguard(2), 1);
    const [sa, sb] = w.sides;
    still(sa);
    still(sb);
    const at = { x: sb.player.x - 2.5, y: sb.player.y + 9.5 };
    const m = spawnMonster(
      w,
      { type: 'warrior', variant: 'none', rarity: 'normal', level: 1, mods: [] },
      at.x,
      at.y,
      0,
      0,
      'Warrior',
    );
    m.state = 'chase';
    const dB = Math.hypot(m.x - sb.player.x, m.y - sb.player.y);
    run(w, 1.5);
    expect(m.x).toBeGreaterThan(at.x + 0.5);
    expect(Math.hypot(m.x - sb.player.x, m.y - sb.player.y)).toBeLessThan(dB - 1);
  });
});

describe('the monsters’ flow field', () => {
  /** A 24 by 16 room with a wall across the middle that has a gap near the top. */
  function room(): Grid {
    const w = 24;
    const h = 16;
    const tiles = new Uint8Array(w * h);
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) tiles[y * w + x] = FLOOR;
    for (let y = 4; y < h - 1; y++) tiles[y * w + 12] = 0;
    return new Grid(w, h, tiles);
  }

  /** The search as it was before it took several origins: from one tile, up to `max` steps, four ways. */
  function reference(g: Grid, ox: number, oy: number, max = 30): Map<number, number> {
    const dist = new Map<number, number>([[oy * g.w + ox, 0]]);
    const q = [oy * g.w + ox];
    for (let head = 0; head < q.length; head++) {
      const n = q[head];
      const d = dist.get(n)!;
      if (d >= max) continue;
      const nx = n % g.w;
      const ny = (n - nx) / g.w;
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        if (!g.isFloor(nx + dx, ny + dy)) continue;
        const m = (ny + dy) * g.w + nx + dx;
        if (dist.has(m)) continue;
        dist.set(m, d + 1);
        q.push(m);
      }
    }
    return dist;
  }

  const at = (g: Grid, field: Map<number, number>, x: number, y: number) =>
    g.isFloor(x, y) ? (field.get(y * g.w + x) ?? -1) : -1;

  it('from one point it is the single-origin field, tile for tile', () => {
    const g = room();
    g.buildFlow([{ x: 3.5, y: 9.5 }]);
    const ref = reference(g, 3, 9);
    for (let y = 0; y < g.h; y++)
      for (let x = 0; x < g.w; x++) expect(g.flowAt(x, y)).toBe(at(g, ref, x, y));
    // The far side of the wall is reached by the gap, not through it.
    expect(g.flowAt(20, 9)).toBeGreaterThan(17);
  });

  it('from two points each tile has the path distance to the nearer', () => {
    const g = room();
    g.buildFlow([
      { x: 3.5, y: 9.5 },
      { x: 20.5, y: 9.5 },
    ]);
    const a = reference(g, 3, 9);
    const b = reference(g, 20, 9);
    for (let y = 0; y < g.h; y++)
      for (let x = 0; x < g.w; x++) {
        const da = at(g, a, x, y);
        const db = at(g, b, x, y);
        const near = da < 0 ? db : db < 0 ? da : Math.min(da, db);
        expect(g.flowAt(x, y)).toBe(near);
      }
    expect(g.flowAt(3, 9)).toBe(0);
    expect(g.flowAt(20, 9)).toBe(0);
    // Downhill from a tile beside the wall on each side leads to the character on that side.
    expect(g.flowDir(10.5, 9.5)!.x).toBeLessThan(0);
    expect(g.flowDir(14.5, 9.5)!.x).toBeGreaterThan(0);
  });

  it('is kept while the points stand on the same tiles, and built again when they do not', () => {
    const g = room();
    const p = [{ x: 3.5, y: 9.5 }];
    g.buildFlow(p);
    expect(g.flowAt(5, 9)).toBe(2);
    // A wall that goes up on the way: the same tile asked again keeps the field it has.
    g.tiles[9 * g.w + 4] = 0;
    g.buildFlow([{ x: 3.9, y: 9.1 }]);
    expect(g.flowAt(5, 9)).toBe(2);
    // Another tile is another field; so is another number of points.
    g.buildFlow([{ x: 3.5, y: 8.5 }]);
    expect(g.flowAt(5, 9)).toBe(3);
    g.buildFlow([
      { x: 3.5, y: 8.5 },
      { x: 20.5, y: 9.5 },
    ]);
    expect(g.flowAt(20, 9)).toBe(0);
  });
});

describe('the living enemies of a team', () => {
  it('are the other teams’ actors, then the minions of the other sides, and none of a fallen side’s', () => {
    const def = activeGem('callBonewalkers');
    const w = createDuelWorld(buildForActive(def), buildForActive(def), 1);
    const [sa, sb] = w.sides;
    const mine = minionOf(w, sa, 'callBonewalkers', sa.player.x + 1, sa.player.y);
    const theirs = minionOf(w, sb, 'callBonewalkers', sb.player.x - 1, sb.player.y);
    const m = spawnMonster(
      w,
      { type: 'warrior', variant: 'none', rarity: 'normal', level: 1, mods: [] },
      sa.player.x + 3,
      sa.player.y + 5,
      0,
      0,
      'Warrior',
    );
    // A's enemies: the actors in the order of `w.actors` (B's character, the monster), then B's minion.
    expect(livingEnemiesOf(w, sa.team)).toEqual([sb.player, m, theirs]);
    // The monsters' enemies: both characters, then both sides' minions, side by side.
    expect(livingEnemiesOf(w, MONSTERS)).toEqual([sa.player, sb.player, mine, theirs]);
    // The ones within a radius of a point, by their edge.
    expect(enemiesWithin(w, sa.team, theirs.x, theirs.y, 0.1, true)).toEqual([theirs]);
    expect(enemiesWithin(w, sa.team, theirs.x, theirs.y, 0.1, false)).toEqual([theirs]);
    // The minions of a side whose character has fallen are not listed; the ones that fell themselves neither.
    theirs.alive = false;
    expect(livingEnemiesOf(w, sa.team)).toEqual([sb.player, m]);
    theirs.alive = true;
    sb.player.alive = false;
    expect(livingEnemiesOf(w, sa.team)).toEqual([m]);
    // The projectiles' list is the minions standing for the other teams, with no allocation for one side's.
    expect(foeMinions(w, sa.team)).toBe(sb.minions);
    expect(foeMinions(w, MONSTERS)).toEqual([mine, theirs]);
  });
});

describe('every active gem duels', () => {
  const finite = (x: number) => Number.isFinite(x);
  for (const def of [...ACTIVE_GEMS, ...GRANTED_GEMS]) {
    it(`${def.id}: ten seconds against a class starter, without error`, () => {
      const granted = GRANTED_GEMS.includes(def);
      const w = createDuelWorld(buildForActive(def), vanguard(2), 1);
      const [sa, sb] = w.sides;
      sa.opts.freeResources = true;
      sa.opts.godMode = true;
      // B cannot die either: most of these fights would be over in two seconds, and the point is ten seconds of the kit at work.
      sb.opts.godMode = true;
      seedFor(def, w, sb.player);
      const u = def.utility;
      if (u?.kind === 'buff' && (u.policy === 'guard' || u.second))
        sa.player.life = sa.player.def.maxLife * 0.4;
      if (u?.kind === 'buff' && u.rage) sa.rage = 30;
      let lowest = Infinity;
      for (let i = 0; i < 10 * 60; i++) {
        stepWorld(w);
        lowest = Math.min(lowest, sb.player.alive ? sb.player.life : 0);
      }
      expect(finite(sa.player.life)).toBe(true);
      expect(finite(sb.player.life)).toBe(true);
      expect(sa.player.alive).toBe(true);
      const dealsDamage = !!def.baseMult || !!def.spellDamage?.length || def.skillType === 'attack';
      // A damage gem hurts B (B's life fell below its cap at some point of the ten seconds).
      if (dealsDamage && !def.utility && !def.selfTrigger && !granted)
        expect(lowest).toBeLessThan(lifeCap(sb.player));
    });
  }
});
