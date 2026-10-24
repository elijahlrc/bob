/**
 * The west arm of the Spire (north-west, toward the Cathedral). Since 2026-10-20 the arms are places, not elements: each
 * element appears twice in the Spire, in two different arms and with a different partner, so an element build picks
 * which partner it wants and pays to cross for the other. Here: cold with energy shield (Hoarfrost), the minion chain
 * from the well, and fire as burning (Cinder) at the arm's end beside the two-element keystone. The other fire cluster
 * (Flashpoint, fire with crit) is in the east arm; the other cold one (Shatter) is at the top. Since G3: the elemental wand
 * (Bright Wand), the north-west rim road with High Veil at its tip, and Cold Light (spell crit with cold, round 3) on it.
 * The id `spire.fire` predates the change and is kept (ids are stable).
 */
import {
  burnDamage,
  chillEffect,
  eleDamage,
  es,
  igniteChance,
  igniteFaster,
  int,
  minionDamage,
  minionLife,
  spellCrit,
  spellDamage,
  eleAttack,
  str,
  wandAttack,
} from '../lines';
import type { AreaSpec } from '../types';

export const fire: AreaSpec = {
  id: 'spire.fire',
  region: 'mystic',
  name: 'The Lantern',
  why:
    "The arm toward the Cathedral: a careful cold caster's shield, the elemental wand, the Spire's minions, and the slow fire of the burn. " +
    "The dear crossing from the Cathedral's crypt lands on the minion notable.",
  at: [-950, -3530], // Where the area's name is drawn: clear of every other area's name (label pass, round 4); moved 100 down in G3 round 1 off Bright Wand.
  clusters: [
    {
      id: 'hoarfrost',
      name: 'Hoarfrost',
      why: "Cold with energy shield: the careful cold caster's cluster, who wants the chill to keep things off and a shield for what gets through. The other cold cluster (Shatter, at the top) sells freeze and penetration instead, so a cold build picks safety here or the big hit up there, and both costs a crossing.",
      at: [-650, -3420],
      shape: { kind: 'ring', r: 56, a0: 30 },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [eleDamage('cold', 10)],
          why: 'The entrance, from the fork.',
        },
        {
          id: 'n',
          kind: 'notable',
          name: 'Hoarfrost',
          lines: [eleDamage('cold', 16), chillEffect(15), es(8)],
          why: '1.6 + 1.5 + 1.6 units.',
        },
        {
          id: 'b',
          kind: 'small',
          lines: [eleDamage('cold', 10)],
          why: "The west exit, to the arm's junction.",
        },
        {
          id: 'c',
          kind: 'small',
          lines: [eleDamage('cold', 10)],
          why: 'The north exit, to the inter-arm junction.',
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
      id: 'jArm',
      name: 'Junction',
      why: "The arm's junction: the ignite room north-west, the dear crossing from the Cathedral's minions west, and the well's west road arriving from the south.",
      at: [-950, -3600],
      shape: { kind: 'hand' },
      nodes: [{ id: 'a', kind: 'attribute', lines: [int(7)], at: [-950, -3600] }],
      links: [],
    },
    {
      id: 'familiars',
      name: 'Familiars',
      why: "Minions in the Spire (2026-10-19, the user's review: the Mystic can pick a summon like any other gem and the region sold nothing for one). Minion damage twice, then the notable with minion damage, minion life and spell damage (the summoning caster's), as a chain from the west road's mana-leech pocket to the arm's junction: the Spire's half of the dear crossing to the Cathedral's minion tower, which lands on its notable, so a minion Mystic and a fire Zealot pass each other here.",
      at: [-1120, -3300],
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [minionDamage(12)],
          at: [-1126, -3256],
          why: 'The entrance, from Mana Tap.',
        },
        {
          id: 'n',
          kind: 'notable',
          name: 'Familiars',
          lines: [minionDamage(24), minionLife(12), spellDamage(8)],
          at: [-1180, -3300],
          why: "The caster's minions: 2 + 1 + 1 units. The Cathedral's minion tower arrives here.",
        },
        {
          id: 'b',
          kind: 'small',
          lines: [minionDamage(12)],
          at: [-1137, -3356],
          why: "The exit, to the arm's junction.",
        },
      ],
      links: [
        ['a', 'n'],
        ['n', 'b'],
      ],
    },
    {
      id: 'cinder',
      name: 'Cinder',
      why: "Ignite: chance, burning damage, faster burning. Fire as a burn, at the arm's end beside the two-element keystone; the fire caster who wants the hit instead goes east to Flashpoint. The arm's end: a dead end since 2026-10-20, when its link to the Prismatic spur went so the keystone sits on a spur; a bridge again since G2 (2026-10-22), its far side leading on to the north-west rim road. Since G4 fix 1 (2026-10-22) it is also the Mystic end of seam 2: the Zealot's Bright Omen (spell crit with mana regeneration) lands on its notable, so Cinder is a junction of the Lantern arm, the rim road and the far crossing.",
      at: [-1150, -3850],
      shape: { kind: 'ring', r: 56, a0: 60 },
      nodes: [
        { id: 'a', kind: 'small', lines: [burnDamage(12)] },
        {
          id: 'n',
          kind: 'notable',
          name: 'Cinder',
          lines: [igniteChance(15), burnDamage(30), igniteFaster(10)],
          why: '1.5 + 2.5 + 1 units.',
        },
        { id: 'b', kind: 'small', lines: [burnDamage(12)] },
        { id: 'c', kind: 'small', lines: [burnDamage(12)] },
      ],
      links: [
        ['a', 'n'],
        ['n', 'b'],
        ['b', 'c'],
        ['c', 'a'],
      ],
    },
    {
      id: 'rim',
      name: 'The north-west rim road',
      why: "Three attribute nodes on one straight run along the Spire's north-west rim (G2, 2026-10-22; G1/mystic.md §3 as joined in G1-brief.md §2.2): from High Veil (the shield and resistance ring, G3, G1/mystic.md MY-4), past Cold Light's pocket (spell crit with cold, G3 round 3) to the corner over Cinder, where the road turns onto the Zealot's north walk (the far loop). Cinder stops being a dead end. From G3 round 2 to G4 fix 2 the road was a spur with a far tip; since G4 fix 2 (2026-10-23) Steady Stream leads onto High Veil again, so the road is one side of a loop from the climb to Shatter round to Cinder. The north-east rim road is the Eaves (`rim.ts`).",
      at: [-1115, -4325],
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'a',
          kind: 'attribute',
          lines: [int(7)],
          at: [-932, -4446],
          why: 'The head of the road: High Veil (G3) lands here on a small, on the straight line of the road. Moved in G3 from (-850,-4500) to the middle of the run, clear of the ring.',
        },
        {
          id: 'b',
          kind: 'attribute',
          lines: [int(7)],
          at: [-1115, -4325],
          why: "Halfway; the end of Cold Light's short leg (G3 round 3).",
        },
        {
          id: 'c',
          kind: 'attribute',
          lines: [str(6), int(6)],
          at: [-1380, -4150],
          why: "The corner over Cinder, the last node before the Zealot, so half strength: the far loop leaves here for the Zealot's north walk, and Cold Light's longer leg leaves here.",
        },
      ],
      links: [
        ['a', 'b'],
        ['b', 'c'],
      ],
    },
    {
      id: 'coldLight',
      name: 'Cold Light',
      why: "Spell crit with cold damage (G3 round 3, 2026-10-22; new beyond the brief, CONSTRAINTS §1.1 and §5.1): the cold caster's crit, the Spire's fourth spell crit cluster and its first away from the east. Spell crit had three homes, all on the east side and all near (Sharp Mind at home, Flashpoint, Keen Verse), so a crit caster had all of it by 60 points and 40 more points bought none (G3 round 2: the life caster's spell crit 8.4 units from 60 to 160). Here it is far and in the other direction, and its partner is cold: the fire and lightning caster pays for a cold line it does not use, the cold caster for crit it half wants. Cold's third cluster too, each with its own partner (the shield at Hoarfrost, freeze and penetration at Shatter, crit here), nine steps from Hoarfrost through Cinder. Laid where round 3 first put the minion-and-curse cluster (moved to the Eaves: it made the north-west a summoner's one-stop beside High Veil and Familiars). A V pocket outward of the north-west rim road, the notable at the tip under the rim: two crit smalls on the corner's side, where a caster arrives from Cinder or the Zealot's north walk, one on the side toward High Veil. Walking the road costs none of it.",
      at: [-1402, -4471],
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [spellCrit(15)],
          at: [-1393, -4346],
          why: 'The entrance from the corner over Cinder, on the straight line to the notable.',
        },
        {
          id: 'b',
          kind: 'small',
          lines: [spellCrit(15)],
          at: [-1397, -4401],
          why: 'Beside the notable, on the same leg.',
        },
        {
          id: 'n',
          kind: 'notable',
          name: 'Cold Light',
          lines: [spellCrit(30), eleDamage('cold', 16)],
          at: [-1402, -4471],
          why: '2 + 1.6 units. The tip of the V.',
        },
        {
          id: 'c',
          kind: 'small',
          lines: [spellCrit(15)],
          at: [-1340, -4439],
          why: "The exit to the road's middle node, on the straight line from the notable.",
        },
      ],
      links: [
        ['a', 'b'],
        ['b', 'n'],
        ['n', 'c'],
      ],
    },
    {
      id: 'roadS',
      name: 'The lantern stair',
      why: 'Intelligence twice: the road down from the Lantern junction to the well.',
      at: [-884, -3413],
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'attribute', lines: [int(7)], at: [-884, -3413] },
        { id: 'b', kind: 'attribute', lines: [int(7)], at: [-817, -3227] },
      ],
      links: [['a', 'b']],
    },
    {
      id: 'brightWand',
      name: 'Bright Wand',
      why: "Wand attacks with elemental damage with attacks (G3 round 1, 2026-10-22; G1/mystic.md MY-5): the elemental wand, the third of four wand-attack clusters, each with its own partner and direction (accuracy at home, speed on the east, elements here, crit on the Eaves later). Brought into the first round because the wand attacker was flat at every point count and Wand Volley's re-line (crit to speed) took supply from it (CONSTRAINTS §5.7, §1.1). A four-node ring in the triangle between the Lantern junction, the west join and the Prismatic spur, a bridge parallel to Hoarfrost, so the Lantern and the Belfry's west join are joined twice: through the cold or through the wand. It arrives at the west join from due west, between Hoarfrost's link and the Prismatic spur. 18 steps from the Mystic start, 10 from Wand Volley.",
      at: [-639, -3647],
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [wandAttack(12)],
          at: [-695, -3647],
          why: "The west side, from the Lantern's junction.",
        },
        {
          id: 'n',
          kind: 'notable',
          name: 'Bright Wand',
          lines: [wandAttack(24), eleAttack(20)],
          at: [-639, -3703],
          why: '2 + 2 units. The north side of the ring.',
        },
        {
          id: 'b',
          kind: 'small',
          lines: [wandAttack(12)],
          at: [-583, -3647],
          why: 'The east side, to the west join.',
        },
        {
          id: 'c',
          kind: 'small',
          lines: [wandAttack(12)],
          at: [-639, -3591],
          why: 'The south side.',
        },
      ],
      links: [
        ['a', 'n'],
        ['n', 'b'],
        ['b', 'c'],
        ['c', 'a'],
      ],
    },
  ],
  links: [
    {
      from: 'jArm.a',
      to: 'brightWand.a',
      why: 'The Lantern junction onto Bright Wand (MY-5), east, into the gap between the cold cluster and the ignite room.',
    },
    {
      from: 'brightWand.b',
      to: 'spire.frost.jFire.a',
      why: "Bright Wand onto the Belfry's west join, arriving from due west: a second link between the Lantern and the Belfry beside Hoarfrost's.",
    },
    { from: 'hoarfrost.b', to: 'jArm.a', why: "Through the cold cluster to the arm's junction." },
    { from: 'jArm.a', to: 'cinder.a', why: 'Junction to the ignite room.' },
    {
      from: 'cinder.b',
      to: 'rim.c',
      why: "The ignite room's far side onto the north-west rim road: Cinder is a bridge from the Lantern to the rim, not the arm's dead end.",
    },
    {
      from: 'rim.c',
      to: 'coldLight.a',
      why: "The corner over Cinder onto Cold Light's longer leg, up into the open side between the Zealot's road and the rim road (the corner becomes a four-way: Cinder, the Zealot, the road, the pocket).",
    },
    {
      from: 'coldLight.c',
      to: 'rim.b',
      why: "Cold Light's short leg onto the road's middle node: the pocket is a bridge, two ways in.",
    },
    {
      from: 'spire.well.manaTap.b',
      to: 'familiars.a',
      why: "The mana-leech pocket's far node onto the minion chain: a second way from the well to the arm, beside the one through Mana Tap's notable.",
    },
    { from: 'familiars.b', to: 'jArm.a', why: "The minion chain lands on the arm's junction." },
    { from: 'hoarfrost.c', to: 'spire.frost.jFire.a', why: 'The inter-arm link to the top arm.' },
  ],
};
