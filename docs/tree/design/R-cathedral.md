# The Cathedral's rebuild (Zealot, strength and intelligence, angle -150)

The sixth and last region with a class start, on the approved skeleton (R-skeleton.md §7), after the Knife, the Spire,
the Bow, the Yard and the Wall. Positions are (radius, degrees off the Cathedral's angle of -150); negative is the Wall's
side (south-west, the border at 180), positive the Spire's (north-east, the border at -120). Steps are counted from the
Zealot's start. **Both borders are already built** by the neighbours: the Wall's north seam, border road and rim vertex
(`wall.home.seams.s`, `wall.resists.radW.a/b/m`, `wall.grit.ring.s0`), the Spire's west seam, border road and rim vertex
(`spire.home.seams.w`, `spire.well.radW.a/b/m`, `spire.rim.ring.w0`). The Cathedral builds no seam or border road.

## 1. Evaluation (the Cathedral as it stands)

Measured on today's tree (`region-map.ts zealot`, `walks.ts`, `offdef.ts zealot`; the reference sector by
`ref-sector.mjs 4`).

- **Size.** About 47 notables and 6 keystones (Idle Hands, Searing Avatar, Lone Vow, Living Ward, Volatile Servants,
  Sigil Warden). The reference's str/int sector holds 57 notables and 7 keystones.
- **The start** commits to an element at step 4 (Hymn's lightning) and offers fire at 7 (the skeleton); Zeal is a
  notable at step 2. The Vanguard reaches Verger (sceptres) at step 6 and Iron Faith (shields) at 7 through the Wall's
  north seam (the Wall's reviewer): both must move past 8.
- **Offence, defence and utility:** notables 53/33/14% against the reference's 53/26/21%: defence heavy, utility light.
- **Archetypes and their homes.**
  - Elements: lightning (Hymn, Thunder Peal), fire (Hearthfire, Kindled Steel, Censer, Brazier), cold (Rimed Steel,
    Frozen Font); elements in general (Zeal, Ardour, Homily, Shattering Rite, Plainsong).
  - Spells: Homily, Lectern, Vespers, Bright Omen (spell crit), Tomb Dust (chaos spells), Shattering Rite (physical
    spells), Crozier (staff spells).
  - Minions: Shepherd, Sexton, Ossuary; Volatile Servants. (The Spire's Familiars and Bad Company and the Wall's Grave
    Host are partners.)
  - Auras: Choirmaster, Benediction, Battle Hymn, Procession; Lone Vow.
  - Shields and block: Iron Faith, Glass Wall (spell block with a shield), Twofold Guard, Rood Screen and Buttress (spell
    block). Spell block with a shield came here from the Spire (its Spirit Ward was replaced).
  - Staves: Quarterstaff, Warding Staff, Crozier; Idle Hands. Sceptres: Gilded Rod, Verger, Brazier.
  - Totems and brands: Reliquary, Runecarver, Brandwright; Sigil Warden. Channelling: Plainsong.
  - Energy shield: Vigil, Wake, Rood Screen, Benediction. Armour: Consecrated Plate, Verger. Leech: Tithe. Warcries:
    Battle Hymn. Fire's keystone: Searing Avatar.
- **Names:** Tithe clashes with a relic; Living Ward is removed (the skeleton).
- **What the neighbours put at the shared borders (do not copy):**
  - The Spire's west border: auras reserving life (Kept Vows), energy shield recharge (Quickening, Ward Renewed), low
    life (Pain Conduit), spell minions (Familiars, Bound Host).
  - The Wall's north border: auras (Warlord's Banner), mana from melee (Iron Lungs), grit and resistances (Unbroken,
    Tempered, Bulwark Spirit), totems with resistances (Graven Posts), elemental maces (Hallowed Hammer).
- **What the reference sector has that the Cathedral lacks:** a channelling defence; staff crit and block with a payoff;
  minion sustain and minion area; an aura that pays per aura; a brand count rule; an elemental "gain as extra" for spells
  and attacks; rule-bending notables.

## 2. What the Cathedral is for

The holy warrior and the priest: elements gained from faith (spell and attack alike), servants, auras and spell block.
Its identity is **the consecrated ground**: what the Zealot plants (brands, totems, servants, auras) works for it while
it fights, and its faith turns damage into an element. Side roads:

- **Servants**: minions on the north-east spoke, the tree's main minion region (Spire and Wall partners).
- **The staff and the shield**: block and spell block, south-west (staves) and the axis (shields), not at the Wall border.
- **Brands and totems**: the north-east border and spoke (the Spire's border holds none; the Wall's totems are at its
  north border, so the Cathedral's totems sit north-east).
- **Elemental faith**: fire south-west, lightning north-east, cold on the axis, each a direction.

## 3. The frame

- **Start** at radius 1,450 (today 1,000), exits at (1,530, ±6), hubs +15 strength and +15 intelligence at (1,690, ±5),
  paths to each seam, spokes through (2,050, ±11.7), the mid ring (2,900, ±13), the rim ring (4,300, ±13), cross roads to
  the home hub.
- **Both seams are the neighbours':** each path runs through a cluster to its seam (so the starts sit 10 to 12 apart);
  the mid ring ends at `wall.resists.radW.m` (south-west) and `spire.well.radW.m` (north-east); the rim ring runs from
  `wall.grit.ring.s0` to `spire.rim.ring.w0`. Side rooms hang from both border roads. The temporary links in the Wall's
  and the Spire's files into old Cathedral nodes are replaced.

## 4. The start and the home

- **North-east side:** damage with life (`12% damage, 5% life`: spell and attack alike, as the Zealot is both). **South-west
  side:** mana regeneration with life (`15% mana regeneration, 5% life`), the reference's str/int opener. Path nodes:
  damage north-east, life and mana south-west.
- **Home (steps 5 to 8):** Zeal at the home hub (elemental damage, defences, both attributes). North-east: Homily (spell
  damage) on the path to the Spire seam, run through; Lectern (spells, reservation) toward the centre; Vigil (regeneration
  and recharge) off the spoke junction. South-west: Litany (resistances) on the path to the Wall seam, run through;
  Consecrated Plate (armour) toward the centre; Ardour (elemental attacks) off the spoke junction.
- No weapon, element or mechanic within 8 steps: Hymn, Hearthfire, Iron Faith, Verger, Shepherd move out.

## 5. Where every cluster goes

| Cluster (notables) | Area | Road | Step | Why there |
| --- | --- | --- | --- | --- |
| Zeal | Gate | the home hub | 5 | The generalist. |
| Homily (from the Undercroft wheel) | Gate | NE path, run through | 5 | Spells near home. |
| Lectern | Gate | NE path, toward the centre | 5 | Spells and reservation. |
| Vigil | Gate | NE spoke junction | 7 | Regeneration and recharge. |
| Litany | Gate | SW path, run through | 5 | Resistances. |
| Consecrated Plate | Gate | SW path, toward the centre | 5 | Armour. |
| Ardour | Gate | SW spoke junction | 7 | Elemental attacks. |
| Reliquary / Runecarver | Undercroft | the Spire's border road | 9-10 | Totems or brands (the Spire's border holds neither). |
| Brandwright | Undercroft | where the Spire's border road meets the mid ring | 11 | Brand crit. |
| Sigil Warden (K) | Undercroft | a spur from the Spire's border road | 12 | The brand keystone. |
| Choirmaster / Shepherd wheel | Choir | NE spoke, outer | 9-10 | Auras or minions: a choice. |
| Sexton | Choir | NE spoke, outer | 9 | Minions with life. |
| Lone Vow (K) | Choir | NE spoke at the mid ring, a spur | 10 | The aura keystone. |
| Hymn | Choir | the mid ring's NE stretch | 10 | Lightning's first home. |
| Thunder Peal | Lychway | NE spoke past the mid ring | 12 | Lightning's second home. |
| Ossuary | Lychway | the rim ring's NE stretch | 13 | Minions with energy shield. |
| Volatile Servants (K) | Lychway | out from the rim ring, NE | 15 | The minion keystone. |
| Tomb Dust | Lychway | out from the rim ring | 14 | Chaos spells. |
| Bright Omen | Lychway | the rim ring | 13 | Spell crit. |
| Vespers / Plainsong | Lychway | the rim ring at the axis | 13 | Duration; channelling. |
| Rood Screen | Lychway | the rim ring | 13 | Spell block and energy shield. |
| Iron Faith / Hearthfire wheel | Nave | in from the mid ring at the axis | 9-10 | Shields or fire: a choice (Iron Faith past 8 from the Vanguard). |
| Glass Wall | Nave | the axis, the mid ring | 11 | Spell block with a shield. |
| Twofold Guard | Nave | out from the mid ring at the axis | 11 | Both blocks with a shield. |
| Shattering Rite | Bell Tower | the mid ring at the axis | 11 | Physical and elemental spells. |
| Rimed Steel / Benediction wheel | Bell Tower | the rim ring at the axis | 13 | Cold attacks or auras. |
| Frozen Font | Bell Tower | out from the rim ring | 14 | Cold's second home. |
| Searing Avatar (K) | Bell Tower | a tip past the rim ring | 15 | Fire's keystone. |
| Quarterstaff / Gilded Rod wheel | Vestry | SW spoke, outer | 9-10 | Staves or sceptres: a choice. |
| Warding Staff | Vestry | SW spoke, outer | 9 | Staves with spell block. |
| Idle Hands (K) | Vestry | SW spoke at the mid ring, a spur | 10 | The staff keystone. |
| Crozier | Vestry | the mid ring's SW stretch | 11 | Staff spells. |
| Verger | Ambulatory | the Wall's border road | 10 | Sceptres with armour, past 8 from the Vanguard. |
| Kindled Steel | Ambulatory | the Wall's border road | 10 | Fire attacks. |
| Tithe (renamed) | Ambulatory | where the Wall's border road meets the mid ring | 11 | Leech. |
| Battle Hymn | Ambulatory | SW spoke past the mid ring | 12 | Warcries and auras. |
| Censer | Churchyard | the rim ring's SW stretch | 13 | Burning. |
| Brazier | Churchyard | out from the rim ring | 14 | Sceptre fire. |
| Procession | Churchyard | the rim ring | 13 | Auras (its movement line goes). |
| Buttress | Churchyard | the rim ring | 13 | Spell block and resistances. |
| Wake | Churchyard | out from the rim ring by the Wall border | 14 | Energy shield and life. |
| Living Ward (K) | cut | | | Removed (the skeleton). |
| new: fire's rule | Churchyard | out from the rim ring | 14 | Faith turned to fire (gain as extra fire for spells and attacks). |
| new: lightning's rule | Lychway | out from the rim ring | 14 | Faith turned to lightning. |
| new: a brand count | Undercroft | NE, the mid ring | 12 | One more brand (the deploy count brands use). |
| new: minion sustain | Choir | NE, the mid ring | 11 | Minions that recover (life on kill for minions, or regeneration). |
| new: a channelling defence | Lychway | the rim ring | 13 | Damage reduction while channelling. |
| new: staff crit with a payoff | Vestry | SW, past the mid ring | 12 | Staff crit and block. |
| new: aura per aura | Choir | NE, the rim ring | 13 | Something for every aura held. |

## 6. Size

About 54 notables: 46 kept (Living Ward cut), 7 new named above, a few hooked second notables in the notables pass. Node
count about level.

## 7. Keystones

Lone Vow (NE spoke, about 10), Idle Hands (SW spoke, about 10), Sigil Warden (NE border, about 12), Searing Avatar and
Volatile Servants (the rim, about 15). All at 8 or more.

## 8. Sustain (attrition)

The Cathedral's voice: regeneration (Vigil), energy shield (Wake, Rood Screen, Benediction), leech (Tithe), minion
sustain (new), block recovery; the flask layer near home is the centre's and the neighbours' (none at the Cathedral's
home today).

## 9. Open

- The start's sides (damage with life, mana regeneration with life) are a proposal.
- Totems: the Wall's are at its north border; the Cathedral's Reliquary sits at the north-east border, far from them.

## 10. Revision 1 and the structure (after the reviewer's round 1)

The structure is built (`cathedral-gen.ts`, render `R-cathedral-structure.png`); lines are still the old ones, rewritten in
the notables pass. What changed against §4 and §5:

- **(a) The border roads.** Inward of the mid ring, both border roads are the neighbours' near ground: only generic notables
  hang there. On the Wall's road: Tithe (leech, Vanguard 7) and Consecrated Plate (armour, Vanguard 8). On the Spire's road:
  Rood Screen (energy shield and spell block, Mystic 8). Verger (sceptres) moved out past the Wall's mid ring junction
  (Vanguard 10); Iron Faith (shields) sits on the axis (Vanguard 14, Zealot 11). Reliquary and Runecarver (Mystic 9) are
  outward of the mid ring on the Spire's side.
- **Steps from the neighbours** (`walks.ts`): the Vanguard reaches Vigil 5, Tithe 7, Consecrated Plate 8, Litany 9, Verger 10,
  every weapon 11 or more. The Mystic reaches Bright Omen 6, Rood Screen 8, Reliquary and Runecarver 9, Hymn 10, every
  minion and aura node 11 or more. **Start distances:** Zealot to Vanguard 10, to Mystic 11 (the rule's about 12 goes to the
  joins pass).
- **(b) The look-alikes, replaced in the notables pass:** Litany (now resistances, like the Wall's Tempered) becomes armour,
  energy shield and regeneration; Bright Omen (spell crit, like the Spire's Sharp Mind) becomes damage for spells, attacks and
  minions alike; Vigil (regeneration and recharge, like the Spire's Quickening) becomes regeneration only; Lectern
  (reservation, like Kept Vows) becomes spells with duration. Homily left home for the staff side (step 11).
- **(c) Own notables within 8:** 9 (Zeal, Vigil, Bright Omen, Litany, Ardour, Lectern, Wake, Buttress, Shattering Rite),
  spread over steps 5 to 8; no weapon or mechanic before 9. Within 10: 18; within 14: 48.
- **(d) Archetypes spread, each in two or three places with different partners:** staves (Quarterstaff with sceptres on the
  south-west spoke; Warding Staff with shields on the axis; Staff of Judgement, new, with spells), brands (Runecarver with
  totems on the Spire's road; Brandwright with fire on the Wall's road; Many Sigils, new, on the axis), shields (Iron Faith
  on the axis; Glass Wall with staves; Frozen Font's block), minions (Shepherd and Sexton on the north-east spoke; Shepherd's
  Crook, new; Ossuary at the rim), fire (Kindled Steel south-west, Hearthfire on the axis, Faith Aflame at the rim) and cold
  (Frozen Font, cold's first rung, on the north-east spoke at step 9; Rimed Steel at the rim).
- **New clusters, placeholder lines:** Faith Aflame, Faith Unleashed, Many Sigils, Shepherd's Crook, Staff of Judgement,
  Chorus. Five links between neighbouring clusters (a sixth, Kindled Steel to Brandwright, crossed the spoke and was dropped).
- **Measures:** no unreachable nodes, no road dead ends, no crossings. Sustain as before (regeneration 4/5 notables/smalls,
  leech 1/2). Offence, defence, utility 54/32/14%: utility to be raised in the notables pass.

## 11. The notables (after the structure review)

The chart is `R-cathedral-chart.md` (step, before, now, units, hook). What changed, by the reviewer's musts:

- **Layout (F1, F2):** Lectern, Reliquary and Runecarver, Hymn, Verger, Homily and Glass Wall moved inward, away from the
  neighbours' notables (each now 390 or more units from the nearest, steps unchanged but for Hymn, Mystic 12). Staff of
  Judgement is a second notable hooked on Crozier at the north-east rim (the staff's third home). Labels clear but for
  Choirmaster and Shepherd on one wheel (tidy pass). Two dead links in the Wall (into nodes the Wall's rebuild removed)
  were dropped.
- **N1, armour near the Vanguard:** one armour line, Litany's (armour, energy shield and regeneration). Consecrated Plate
  became Kneeling Stone (stun avoidance, life, regeneration); Verger lost its armour (sceptre damage, mana on hit,
  elemental damage).
- **N2:** Rood Screen leans to spell block (6%, with 6% energy shield).
- **N3:** Shepherd's Crook is recovery: minions regenerate 1% a second and resist the elements.
- **N4, the placeholders and the minion partners:** Faith Aflame (every hit gains 8% of physical as fire: the holy
  warrior's road to Searing Avatar) and Faith Unleashed (physical spells converted to lightning, damage against shocked:
  the priest's road from Shattering Rite) are two mechanisms, not one template. Many Sigils is one more brand. Chorus
  regenerates life for every aura standing. Staff of Judgement is staff crit and crit multiplier. Sexton (the summoner
  regenerates while a servant stands) and Ossuary (the Zealot deals more damage while a servant stands) differ from
  Shepherd (minion life) and sit with other partners (the axis, the south-west rim).
- **The consecrated ground, in rules:** Many Sigils (brands), Chorus (auras), Sexton and Ossuary (servants), Shepherd's Crook,
  Plainsong (channelling defence), Faith Aflame and Faith Unleashed.
- **N5, counts:** offence, defence, utility 53/28/19% (the reference sector 53/26/21); sustain notables before/now:
  regeneration 4/5, leech 1/1, on hit 1/2; prices 3.2 to 6.0 units (Chorus 3.2 at one aura, Plainsong 6.0 with its
  channelling defence); `ref-names.ts` no matches; `ip.test.ts` green. Searing Avatar is left for the naming pass.
- **Engine additions:** conditions `channelling` and `minionsOut` (`src/sim/combat.ts`, `src/mods/types.ts`, player text);
  the calc's `auras` per stat (active auras, `src/calc/character.ts`); lines `minionRegen`, `minionRes`, `brandLimit`,
  `physGainFire`, `spellPhysToLightning`, `damageWithMinion`, `regenWithMinion`, `channelGuard`, `regenPerAura`.

## 12. Revision 2 of the notables (the reviewer's R1 to R6)

- **R1, count:** 54 notables (48 + six hooked second notables): Whirling Ward (on Warding Staff), Steadfast Faith (on Iron
  Faith), Hallowed Ground (on Reliquary), Choir of Wrath (on Benediction), Hymn of War (on Battle Hymn), Ember Litany (on
  Kindled Steel).
- **R2, the threads' rules:** staves: Whirling Ward, a staff block may give an insight charge (crit for the staff
  fighter; `chargeOn.block.insight` under `wieldingStaff`). Block: Steadfast Faith recovers 2% of life on block (`recoverOn`
  gained a `block` event; the block event already rolled gains). Totems: Reliquary regenerates the Zealot while a totem
  stands, Hallowed Ground gives damage and defences while one stands (a new `totemOut` condition).
- **R3:** Kneeling Stone became Pilgrim's Mantle (ailment avoidance and life): the Wall sells armour, stun and grit there.
- **R4:** aura effect on three notables only (Choirmaster, Benediction, Battle Hymn). Chorus: regeneration per aura and
  cheaper auras; Choir of Wrath: damage per aura; Procession: cheaper auras and mana (its movement line went).
- **R5:** one mana line near home (Vigil's). Wake, Gilded Rod, Choirmaster and Hymn lost theirs.
- **R6:** every notable 3.9 units or more; the per-aura lines priced at two auras.
- **Counts:** 52/29/19% offence/defence/utility. Sustain: regeneration notables 3 by the tally (which does not count the
  conditional regeneration of Reliquary, Sexton and Chorus: 6 with them), recovery on block 1, on kill 1, leech 1, on hit 2:
  more than before. 9 own notables within 8, 18 within 10, 52 within 14.
- **Engine:** the `totemOut` condition; lines `insightOnStaffBlock`, `insightOnWarcry`, `regenWithTotem`, `damageWithTotem`,
  `damagePerAura`; `recoverOn` takes `block`.
