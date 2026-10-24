/**
 * The projectiles: the middle of the arc and the far end of the string, where the bows road from the north and the
 * bleed road from the south meet. The road from the bows comes straight out along the top of the region and turns
 * down at three junctions to the hub; the region's landmark wheel (projectile damage and speed up to Far Flight on one
 * side, bleed chance up to Barbed Arrows on the other; Split Volley sat there until round 4 and is now on the bleed
 * wheel's north arm, so the extra projectile, pierce and chain are three places)
 * hangs off the hub facing outward; Close Quarters one node off the second junction; the stub for the Knife's dear
 * crossing off the first.
 */
import {
  allAttr,
  attackSpeed,
  bleedChance,
  bleedDamage,
  bleedFaster,
  chain,
  chaosAttack,
  dex,
  life,
  oneHandMelee,
  poisonChance,
  poisonDamage,
  projectileDamage,
  projectileSpeed,
  shieldBlock,
  shieldStunAvoid,
} from '../lines';
import type { AreaSpec } from '../types';
import { P } from './frame';

export const flight: AreaSpec = {
  id: 'bow.flight',
  region: 'strider',
  name: 'The High Moor',
  why: 'What every projectile build wants, bow or thrown or totem, at the point of the region every road reaches: the string, the bows road and the bleed road all end here.',
  at: [2457, 970], // Where the area's name is drawn: clear of every other area's name (label pass, round 4).
  clusters: [
    {
      id: 'road',
      name: 'From the bows',
      why: "Three junctions turning the top road down to the hub; the Knife's dear crossing leaves the first, Close Quarters the second.",
      at: P(1474, -508),
      shape: { kind: 'hand' },
      nodes: [
        { id: 'jp1', kind: 'attribute', lines: [dex(7)], at: P(1263, -660) },
        { id: 'jp2', kind: 'attribute', lines: [dex(7)], at: P(1481, -543) },
        { id: 'jp3', kind: 'attribute', lines: [dex(7)], at: P(1678, -322) },
      ],
      links: [
        ['jp1', 'jp2'],
        ['jp2', 'jp3'],
      ],
    },
    {
      id: 'hub',
      name: 'The projectiles hub',
      why: 'Where the three roads meet; the wheel hangs off it, outward.',
      at: P(1800, 0),
      shape: { kind: 'hand' },
      nodes: [{ id: 'p', kind: 'attribute', lines: [dex(7)], at: P(1800, 0) }],
      links: [],
    },
    {
      id: 'wheel',
      name: 'Far Flight and Barbed Arrows',
      why: 'The landmark: an open ring off the hub (a hexagon missing its far side, facing outward). Clockwise from the entrance, projectile damage and speed up to Far Flight; anticlockwise, bleed chance up to Barbed Arrows. The projectile bow and the bleeding bow each take their side. Round 4 (2026-10-20): Split Volley was the anticlockwise notable, which put the extra projectile four steps from Far Flight and three from Skewer; it traded places with Barbed Arrows, on the bleed wheel.',
      at: P(2127, -184),
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'e',
          kind: 'small',
          lines: [projectileDamage(10)],
          at: P(1982, -175),
          why: 'The entrance, facing the hub.',
        },
        {
          id: 'a',
          kind: 'small',
          lines: [projectileDamage(10)],
          at: P(1964, -248),
          why: "Far Flight's second small; G4 fix 1 (D4): 8% projectile damage and 10% projectile speed → one line, the notable's first, at one unit.",
        },
        {
          id: 'n1',
          kind: 'notable',
          name: 'Far Flight',
          lines: [projectileDamage(20), projectileSpeed(20), dex(15)],
          at: P(2017, -300),
          why: "2 + 2 + 1 units. G3 round 1 (2026-10-22): dexterity 20 → 15, so the notable is 5 units, not 5.3 (CONSTRAINTS §8.6; the brief's ST-p2).",
        },
        {
          id: 'n2',
          kind: 'notable',
          name: 'Barbed Arrows',
          lines: [bleedChance(20), bleedDamage(24), bleedFaster(10)],
          at: P(2108, -207),
          why: '2 + 2 + 1 units.',
        },
        { id: 'b', kind: 'small', lines: [bleedChance(10)], at: P(2054, -155) },
      ],
      links: [
        ['e', 'a'],
        ['e', 'b'],
        ['a', 'n1'],
        ['n2', 'b'],
      ],
    },
    {
      id: 'closeQuarters',
      name: 'Close Quarters',
      why: "One projectile damage node off the second junction, then the keystone (projectile attacks: more damage close, less far): the Strider who holds ground instead of kiting, at the region's outer edge.",
      at: P(1669, -837),
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'small', lines: [projectileDamage(10)], at: P(1693, -864) },
        { id: 'k', kind: 'keystone', name: 'Close Quarters', lines: [], at: P(1740, -935) },
      ],
      links: [['a', 'k']],
    },
    {
      id: 'toKnife',
      name: 'To the Knife',
      why: "The dear crossing to the Knife's poison and chaos (brief §4), for the chaos bows, leaves from the first junction, north, and lands on the south barb of the Knife.",
      at: P(1256, -1030),
      shape: { kind: 'hand' },
      nodes: [{ id: 'a', kind: 'attribute', lines: [dex(7)], at: P(1256, -1030) }],
      links: [],
    },
    {
      id: 'venom',
      name: 'Venom Fletching',
      why: 'Chaos damage with attacks twice, then the notable with chaos damage, poison chance and poison damage: the chaos bows and the poisoned steel, which the Knife will sell in full. A tight orbit off the dear Knife stub, passed through back into the region at the Close Quarters small, so the stub is no longer a dead end and the poison Strider has a first pocket at home.',
      at: P(1450, -990),
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [chaosAttack(12)],
          at: P(1416, -991),
          why: 'The entrance, facing the Knife stub.',
        },
        { id: 'b', kind: 'small', lines: [chaosAttack(12)], at: P(1473, -977) },
        {
          id: 'n',
          kind: 'notable',
          name: 'Venom Fletching',
          lines: [chaosAttack(24), poisonChance(10), poisonDamage(12)],
          at: P(1540, -960),
          why: '2 + 1 + 1 units. The exit, to the Close Quarters small.',
        },
      ],
      links: [
        ['a', 'b'],
        ['b', 'n'],
      ],
    },
    {
      id: 'ricochet',
      name: 'Ricochet',
      why: "Projectile damage twice, then the notable that makes projectiles chain once more: the projectile line no small node gives, beside pierce at Skewer. A chain from the poison pocket's far node round the outside of Close Quarters to Deep Pull, so the rim between the Knife side and the physical row is a road. New cluster only (2026-10-19). Since G2 (2026-10-22) its exit reaches Deep Pull through the north spoke's first road node.",
      at: [2960, 360],
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [projectileDamage(10)],
          at: P(1704, -1158),
          why: "The entrance, from Venom Fletching's far node.",
        },
        {
          id: 'n',
          kind: 'notable',
          name: 'Ricochet',
          lines: [chain(1), projectileSpeed(5)],
          at: P(1759, -1201),
          why: '4 + 0.5 units: a chain is worth a notable on its own.',
        },
        {
          id: 'b',
          kind: 'small',
          lines: [projectileDamage(10)],
          at: P(1790, -1138),
          why: 'The exit, to the north spoke and Deep Pull.',
        },
      ],
      links: [
        ['a', 'n'],
        ['n', 'b'],
      ],
    },
    {
      id: 'lightHand',
      name: 'Light Hand',
      why: "One-handed melee damage with attack speed, the dexterity blade's notable: a bridge from the road from the bows (jp1) to Round Shield's small, two one-handed smalls on the way. The user's editor nodes (2026-10-19, OneHandFast), re-homed in G4 fix 1, when its long spoke from Long Breath's small went and its chain was laid toward Round Shield instead (the looks audit, L1 item 4): the blade and the shield, four steps apart.",
      at: P(1104, -476),
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'n',
          kind: 'notable',
          name: 'Light Hand',
          lines: [oneHandMelee(15), attackSpeed(8)],
          at: P(1104, -476),
          why: '1.5 + 1.6 units. Added in the editor (2026-10-19) as OneHandFast; named 2026-10-19, lines theirs.',
        },
        {
          id: 'a',
          kind: 'small',
          lines: [oneHandMelee(10)],
          at: P(1088, -408),
          why: "Beside the notable, on the line to Round Shield (the editor's n434); 15% → 10%, one unit (G4 fix 1, D4).",
        },
        {
          id: 'b',
          kind: 'small',
          lines: [oneHandMelee(10)],
          at: P(1076, -351),
          why: "The far door, toward Round Shield's small (the editor's n435, which hung off Long Breath's small until G4 fix 1); 15% → 10%.",
        },
      ],
      links: [
        ['n', 'a'],
        ['a', 'b'],
      ],
    },
    {
      id: 'wanderer',
      name: 'Wanderer',
      why: "All attributes with life, the traveller's notable, for a build whose gear asks for what its home does not sell. On the road from the bows (jp1), with Fleet Foot's movement chain on one side and Round Shield's shield chain on the other, through its own attribute small. The user's editor nodes (2026-10-19), re-homed in G4 fix 1.",
      at: P(1286, -361),
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'n',
          kind: 'notable',
          name: 'Wanderer',
          lines: [allAttr(8), life(8)],
          at: P(1286, -361),
          why: '2 + 1.6 units. Added in the editor (2026-10-19) unnamed, named by the user. G4 fix 1 (2026-10-22): its 8% evasion went (and all attributes 10 → 8), so it is no longer a third evasion-with-life notable seven steps from the Strider start beside Hard Target and Weaving (the trade-offs audit, F2).',
        },
        {
          id: 'a',
          kind: 'small',
          lines: [allAttr(4)],
          at: P(1227, -323),
          why: "Wanderer's own small, beside it on the line to Round Shield (the editor's n433; G3 round 1 made it attributes; G4 fix 1 moved it from beside Round Shield, the looks audit L2).",
        },
      ],
      links: [['n', 'a']],
    },
    {
      id: 'roundShield',
      name: 'Round Shield',
      why: "Block with a shield and avoiding stun behind it, the dexterity side's sword-and-board pull: a chain of two block smalls from Long Breath's small, the notable, then one more block small where Light Hand's chain and Wanderer's small meet it. The user's editor nodes (2026-10-19, re-lined in G3 round 1), re-homed in G4 fix 1.",
      at: P(984, -164),
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'n',
          kind: 'notable',
          name: 'Round Shield',
          lines: [shieldBlock(5), shieldStunAvoid(30)],
          at: P(984, -164),
          why: "2.5 + 1.5 units. Added in the editor (2026-10-19) as Sheild power; named 2026-10-19. G3 round 1 (2026-10-22, the brief's ST-r1, approved at stop 2): one theme, the shield, where it carried mana regeneration, area and shield defences.",
        },
        {
          id: 'a',
          kind: 'small',
          lines: [shieldBlock(2)],
          at: P(1042, -202),
          why: "The east small, a junction where Light Hand's chain and Wanderer's small arrive (the editor's n429; G3 round 1: mana regeneration → shield block).",
        },
        {
          id: 'b',
          kind: 'small',
          lines: [shieldBlock(2)],
          at: P(914, -163),
          why: "The west chain beside the notable (the editor's n438; G3 round 2: +2% block with a shield).",
        },
        {
          id: 'c',
          kind: 'small',
          lines: [shieldBlock(2)],
          at: P(856, -162),
          why: "The west chain's door, toward Long Breath's small (the editor's n437; G3 round 2: +4% block and 10% shield defences → +2% block with a shield, one section).",
        },
      ],
      links: [
        ['a', 'n'],
        ['n', 'b'],
        ['b', 'c'],
      ],
    },
  ],
  links: [
    {
      from: 'venom.b',
      to: 'ricochet.a',
      why: "The poison pocket's far node onto the chain pocket.",
    },
    {
      from: 'roundShield.a',
      to: 'wanderer.a',
      why: "Round Shield's east small onto Wanderer's: the shield and the traveller, a pass-through (the user's editor link).",
    },
    {
      from: 'lightHand.b',
      to: 'roundShield.a',
      why: "Light Hand's chain lands on Round Shield's small (G4 fix 1, 2026-10-22): the one-handed blade and the shield, a pair a sword-and-board Strider walks between, four steps apart. It replaces Light Hand's long spoke from Long Breath's small, which drew a second near-parallel line across the home (the looks audit, L1 item 4).",
    },
    { from: 'road.jp1', to: 'toKnife.a', why: 'The first step of the dear Knife crossing.' },
    {
      from: 'road.jp1',
      to: 'wanderer.n',
      why: "The road from the bows onto Wanderer (the user's editor link).",
    },
    {
      from: 'road.jp1',
      to: 'lightHand.n',
      why: "The road from the bows onto Light Hand (the user's editor link).",
    },
    { from: 'road.jp2', to: 'closeQuarters.a', why: 'The keystone, one node off the junction.' },
    { from: 'toKnife.a', to: 'venom.a', why: 'The dear Knife stub onto the poison pocket.' },
    {
      from: 'venom.n',
      to: 'closeQuarters.a',
      why: 'The poison pocket lands on the Close Quarters small: a loop round the first two junctions of the road from the bows.',
    },
    { from: 'road.jp3', to: 'hub.p', why: 'The road from the bows reaches the hub.' },
    {
      from: 'road.jp3',
      to: 'bow.steel.wheel.e',
      why: "The road's third junction onto the physical chain's entrance, up to Deep Pull (the user's editor link).",
    },
    { from: 'hub.p', to: 'wheel.e', why: 'The wheel hangs off the hub.' },
    { from: 'hub.p', to: 'bow.quiver.road.jq3', why: 'The arc continues south to the bleed road.' },
  ],
};
