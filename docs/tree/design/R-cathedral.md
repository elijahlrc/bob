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
