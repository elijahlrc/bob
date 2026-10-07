import { describe, expect, it } from 'vitest';
import { makeItem } from '../gen/items';
import { mod } from '../mods/types';
import { canEquip, equip } from './inventory';
import { newRun } from './run';

describe('item rule: no other ring (EXPANSION 5.3)', () => {
  const setup = () => {
    const run = newRun('reaver', 1);
    run.build.level = 10;
    const uid = () => run.nextUid++;
    const lone = makeItem(uid, 'ring_fire', 1, 0, 'unique');
    lone.name = 'Test Lone Ring';
    lone.uniqueMods = [mod('rule.noOtherRing', 'flag', 1)];
    const plain = makeItem(uid, 'ring_mana', 1);
    return { run, lone, plain };
  };

  it('allows the ring when the other slot is empty', () => {
    const { run, lone } = setup();
    expect(canEquip(run, lone, 'ring1').ok).toBe(true);
    expect(canEquip(run, lone, 'ring2').ok).toBe(true);
  });

  it('refuses it when another ring is worn', () => {
    const { run, lone, plain } = setup();
    run.inventory.push(plain);
    expect(equip(run, plain.uid, 'ring2').ok).toBe(true);
    const res = canEquip(run, lone, 'ring1');
    expect(res.ok).toBe(false);
    expect(res.reason).toMatch(/another ring/);
  });

  it('refuses another ring while it is worn', () => {
    const { run, lone, plain } = setup();
    run.inventory.push(lone);
    expect(equip(run, lone.uid, 'ring1').ok).toBe(true);
    const res = canEquip(run, plain, 'ring2');
    expect(res.ok).toBe(false);
    expect(res.reason).toMatch(/Test Lone Ring/);
  });

  it('lets the ring replace itself in its own slot', () => {
    const { run, lone, plain } = setup();
    run.inventory.push(lone);
    expect(equip(run, lone.uid, 'ring1').ok).toBe(true);
    // Another ring takes the same slot only if the other slot is empty: it is, but a lone ring in the
    // other slot would block it. Here the plain ring replaces the lone ring in ring1.
    expect(canEquip(run, plain, 'ring1').ok).toBe(true);
  });
});
