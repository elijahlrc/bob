/**
 * The east arm of the Spire (north-east, toward the Knife): Flashpoint (fire as the crit hit), Overcharge (lightning as
 * shock), and Pain Conduit at the tip (30% more spell damage on low life). Joined to the middle arm by the inter-arm
 * junction. Since 2026-10-20 the arm is a place, not the lightning arm (see `fire.ts`); the id `spire.storm` is kept.
 */
import { damageOnLowLife, eleDamage, int, penetration, shockEffect, spellCrit } from '../lines';
import type { AreaSpec } from '../types';

export const storm: AreaSpec = {
  id: 'spire.storm',
  region: 'mystic',
  name: 'The Gallery',
  why:
    'The arm toward the Knife, the sharp end of the Spire: fire for the crit caster, lightning for the shocker, and Pain Conduit for the ' +
    "caster who lives on low life. The Shade borrows its root; the dear crossing from the Knife's curses lands on the keystone spur.",
  at: [880, -3719], // Where the area's name is drawn: clear of every other area's name (label pass, round 4).
  clusters: [
    {
      id: 'flashpoint',
      name: 'Flashpoint',
      why: "Fire with spell crit and fire penetration: fire as the big crit hit, the first cluster of the east arm, beside the Spire's other crit (Sharp Mind below, Fever Pitch above). The other fire cluster (Cinder, west) sells the burn; a fire build picks the hit here or the burn there. Passed through from the fork to the arm's junction; its west side takes the join from the middle arm.",
      at: [650, -3420],
      shape: { kind: 'ring', r: 105, a0: 150 },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [eleDamage('fire', 10)],
          why: 'The entrance, from the fork.',
        },
        {
          id: 'c',
          kind: 'small',
          lines: [eleDamage('fire', 10)],
          why: 'The north-west side, to the east join.',
        },
        {
          id: 'n',
          kind: 'notable',
          name: 'Flashpoint',
          lines: [eleDamage('fire', 14), spellCrit(25), penetration('fire', 3)],
          why: '1.4 + 1.7 + 1.5 units.',
        },
        {
          id: 'b',
          kind: 'small',
          lines: [eleDamage('fire', 10)],
          why: "The east exit, to the arm's junction.",
        },
      ],
      links: [
        ['a', 'c'],
        ['c', 'n'],
        ['n', 'b'],
        ['b', 'a'],
      ],
    },
    {
      id: 'jArm',
      name: 'Junction',
      why: "The arm's junction: the shock room north, the Pain Conduit spur east, the craft's east road arriving from the south, and the dear crossing to the Knife's curses south-east.",
      at: [950, -3600],
      shape: { kind: 'hand' },
      nodes: [{ id: 'a', kind: 'attribute', lines: [int(7)], at: [950, -3600] }],
      links: [],
    },
    {
      id: 'overcharge',
      name: 'Overcharge',
      why: "Lightning damage, the effect of shock and lightning penetration: lightning as the shock that makes every later hit bigger, beside the low-life keystone. The other lightning cluster (Thunderhead, the middle arm) sells speed. The middle arm's ailment bridge arrives at its notable.",
      at: [960, -3900],
      shape: { kind: 'ring', r: 105, a0: 90 },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [shockEffect(10)],
          why: 'The entrance, south, facing the junction.',
        },
        {
          id: 'n',
          kind: 'notable',
          name: 'Overcharge',
          lines: [eleDamage('lightning', 12), shockEffect(20), penetration('lightning', 3)],
          why: '1.2 + 2 + 1.5 units. The west side, where the ailment bridge arrives.',
        },
        { id: 'b', kind: 'small', lines: [shockEffect(10)] },
        {
          id: 'c',
          kind: 'small',
          lines: [shockEffect(10)],
          why: 'The east side, to the keystone spur.',
        },
      ],
      links: [
        ['a', 'n'],
        ['n', 'b'],
        ['b', 'c'],
        ['c', 'a'],
      ],
    },
    {
      id: 'painConduit',
      name: 'Pain Conduit',
      why: 'Two nodes of damage on low life, then the keystone: 30% more spell damage on low life. The tip of the lightning arm; the approach says what the keystone asks (they were spell damage until 2026-10-19).',
      at: [1100, -3560],
      shape: { kind: 'line', heading: -15, gap: 150 },
      nodes: [
        { id: 'a', kind: 'small', lines: [damageOnLowLife(6)] },
        { id: 'b', kind: 'small', lines: [damageOnLowLife(6)] },
        { id: 'k', kind: 'keystone', name: 'Pain Conduit', lines: [] },
      ],
      links: [
        ['a', 'b'],
        ['b', 'k'],
      ],
    },
    {
      id: 'roadS',
      name: 'The gallery stair',
      why: 'Intelligence once, between the Gallery junction and Mist Walk.',
      at: [1070, -3410],
      shape: { kind: 'hand' },
      nodes: [{ id: 'a', kind: 'attribute', lines: [int(7)], at: [1070, -3410] }],
      links: [],
    },
  ],
  links: [
    { from: 'flashpoint.b', to: 'jArm.a', why: "Through the first cluster to the arm's junction." },
    { from: 'jArm.a', to: 'overcharge.a', why: 'Junction to the shock room.' },
    { from: 'jArm.a', to: 'painConduit.a', why: 'Junction to the keystone spur.' },
  ],
};
