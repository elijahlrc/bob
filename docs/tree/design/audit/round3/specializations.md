# Specialization audit, round 3: which specializations are thin

> **Status, after this report:** Carrion Claws moved to the Knife's Rooftops (the claws are now 17 apart), Hexwright
> traded places with Devotion (Hexwright to Second Curse is now 11), Black Flock moved to the Docks wheel, and Rotting
> Word's lines became chaos spell, damage over time and cast speed. See `../../E-round3.md`. Round 4 (`../../E-round4.md`) acted on the rest, except channelling, the Strider's
> fire-attack bow cluster and the optional claw cluster; some placements differ from those proposed here.

Audit of 2026-10-20. Read-only: nothing under `src/` was changed. The tree is as built by `buildAll({ allowNew: true })`:
187 notables (Mystic 35, Vanguard 36, Strider 32, Reaver 29, Zealot 27, Shade 24, centre 4).

The walk logs and helper scripts stayed in the session scratchpad and were not copied into the repo. That covers
`r3walks/` (`w1` to `w11`, `specs-now.txt`, `inv-now.txt`) and the scripts `specs.ts`, `walk.ts`, `dist.ts`, `near.ts`,
`gq.ts` (gem query), `wdem.ts` (weighted weapon demand), `eatk.ts` (elemental attacks by attribute) and `free.ts` (free
spots beside a road node). The point tables below carry what the walks found.

The principle audited is CONSTRAINTS §1.1 and §5.1–5.3. A specialization should sit in two or three notable clusters, at
least about five steps apart, each with a different partner. Supply should be proportionate to the number of skill gems
that want it.

---

## Summary

Ten specializations are thin. Ranked by severity, worst first:

| #   | Specialization                   | Gems                     | Clusters now                               | Kind of gap                                                             | Severity                          | Fix                                                                                |
| --- | -------------------------------- | ------------------------ | ------------------------------------------ | ----------------------------------------------------------------------- | --------------------------------- | ---------------------------------------------------------------------------------- |
| 1   | Curses                           | 14                       | 2 (Spire, Knife)                           | Too few. Both are on the int side, but 8 of the 14 gems are str or dex. | 14 × 2 = **28**                   | Two more: a str one in the Wall, a dex one in the Yard                             |
| 2   | Channelling                      | 13                       | 0                                          | No cluster, and no line                                                 | 13 × 2 = **26**                   | New line and two clusters. Your call (§14)                                         |
| 3   | Physical spells                  | 13                       | 0                                          | No cluster, and no line                                                 | 13 × 2 = **26**                   | New line `physSpell` and two clusters                                              |
| 4   | Elemental attacks for dex builds | 12 of 20                 | 0 within 20 steps of the Strider or Reaver | The two attack-specific element clusters are both in the Cathedral      | 12 × 2 = **24**                   | A lightning-attack cluster in the Yard; a fire-attack bow cluster for your Strider |
| 5   | Traps                            | 9, plus 1 support        | 2                                          | Too few, and both pair trap damage with throwing speed                  | 9 × 1 = **9**, plus the duplicate | Re-line Trapper; add a third cluster                                               |
| 6   | Daggers                          | 19 usable (4.8 weighted) | 2 (Knife)                                  | All in one region; the build has both by point 17                       | 4.8 × 1 ≈ **5**                   | One late cluster                                                                   |
| 6   | Claws                            | 19 usable (4.8 weighted) | 2 (Knife)                                  | All in one region; the build has both by point 19                       | ≈ **5**                           | One cluster on the Knife–Strider border                                            |
| 8   | Spell block                      | (a defence)              | 2 (Spire, Cathedral), both shield-only     | Nothing within 18 steps of a str or dex shield build                    | qualitative                       | One cluster in the Wall                                                            |
| 9   | Dual wield                       | (all one-handers)        | 3                                          | Two of the three pair it with crit; none on the str side                | qualitative                       | One cluster in the Wall                                                            |
| 10  | Staff                            | 17 usable (3.9 weighted) | 2, plus 5 two-handed                       | Thin, but the two-handed line covers it                                 | 3.9 × 1 ≈ **4**                   | Optional                                                                           |

How severity is computed:

- **Severity** is the gems served times the clusters missing.
- **Gems** are the active gems carrying the tag, from `src/data/gems.ts` and `gemsGen.ts`.
- **Weighted gems** (weapons only): a gem usable with _k_ weapons counts 1/_k_ for each. Raw counts make every melee weapon
  look thin, because most melee gems take five or six weapons.
- **Clusters missing** is a target minus the clusters a build can use now.
- **The target** is at least two (§5.1), raised where the tree's usual density calls for more. That density is about one
  cluster per 3 to 7 gems: minions 3.4, auras 3.6, totems 3.3, cold 4.8, lightning 5.2, fire 6.8, melee 6.8. The
  reference was used as a cross-check at half its notable count, since Bob has 187 notables and the reference has 369.

All new clusters proposed below fit at once: no two share a spot or a hang node.

**Three new line functions are needed:**

| Line                | Built from                                                                                | Engine change needed                                                                                        |
| ------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `channelDamage(v)`  | `damage(v, { tags: ['channelling'] })`                                                    | None. `channelling` is in `SKILL_TAGS` and is a static skill type (`calc/reach.ts`).                        |
| `physSpell(v)`      | `damage(v, { tags: ['spell'], types: ['physical'], unit: 12 })`, the twin of `chaosSpell` | None                                                                                                        |
| `damageVsCursed(v)` | Like `damageVsShocked`, with the condition `targetCursed`                                 | None. The condition exists, and the sheet and the fight set it (`calc/character.ts` lines 980, 1163, 1414). |

Every other proposal uses existing lines.

"No engine change" covers only the plumbing. §10.3 still applies: each new line must be checked on the sheet and in the
fight, as A2 §1 requires, before a node carries it. Two things are unverified:

- **`physSpell` on the converting spells.** It is not checked whether physical increases follow the part converted to an
  element (`convertSkill.*` in `calc/skill.ts`). If they do not, the Cathedral cluster's case rests on Quake Totem and
  Open Wounds alone.
- **`attackSpeed(v, ['channelling'])`.** It relies on the tag test reaching a channelled attack's hit rate.

---

## 1. Curses: too few, and all on the int side

**Demand.** 14 curse gems:

- **int (6):** Void Curse, Tinder Curse, Static Curse, Ruin Ritual, Rime Curse, Brittle Doom
- **str (4):** Warlord Sigil, Penance, Feeble Grip, Open Wounds
- **dex (4):** Leaden Limbs, Hunt Sigil, Plenty Sigil, Ruin Sigil

Two supports widen this: Hexing Strikes (curse on hit, for attackers) and Standing Curse. The reference has 11 curse
notables.

**Supply.**

| Notable                                    | Lines                              | Steps from starts                                                  |
| ------------------------------------------ | ---------------------------------- | ------------------------------------------------------------------ |
| Hexwright (`spire.craft.hexwright.n`)      | curse effect, curse area, duration | Mystic 13, Shade 11, Strider 18, Zealot 21, Reaver 23, Vanguard 24 |
| Second Curse (`knife.venom.secondCurse.n`) | +1 curse                           | Mystic 16, Shade 10, Strider 15, Zealot 20, Reaver 22, Vanguard 23 |

They are 7 apart.

**Walk: a Mystic hexer.**

| Point | Notable      |
| ----- | ------------ |
| 2     | First Light  |
| 10    | Arcane Focus |
| 12    | Warm Blood   |
| 17    | Hexwright    |
| 23    | Second Curse |

After point 23 nothing in the tree is about curses. The other 90 points go to Devotion, Glass Skin, Prism Ward and other
generic spell, ES, mana and resist notables, ending at 113. A str or dex character who curses as a side skill finds
nothing within 15 to 24 steps.

**Gap:** too few clusters, all on the int side.

**Fix: two clusters, one for str and one for dex curse users.** Both are 27 to 37 steps from Hexwright and Second Curse,
and 33 apart from each other.

|                   | Str side (the Wall)                                                              | Dex side (the Yard)                                                                                                 |
| ----------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Hang off          | `wall.maces.toHymn.r4`, the bare road from the Wall's west towers to Battle Hymn | `yard.shield.toPits.r1`, the bare road from the Muster to the Pits                                                  |
| Position          | about (-4000, 100)                                                               | about (-750, 4050)                                                                                                  |
| `near.ts`         | Empty within 400                                                                 | `yard.shield.shieldBash.b` at 381 and the Wound Dance keystone at 398                                               |
| Steps from starts | about 20 from the Vanguard and the Zealot                                        | about 18 from the Reaver and the Strider                                                                            |
| Lines             | curse effect + armour, a defensive curser (`curseEffect`, `armour`)              | curse effect + damage against cursed enemies (`curseEffect`, new `damageVsCursed`). This pairs with Hexing Strikes. |
| Notes             | Five steps from Hallowed Hammer, a fair price (§5.5)                             | It must not link to the Wound Dance spur (§9.1)                                                                     |

A closer str spot would be `cathedral.rods.toWall.a`: 10 steps from the Zealot and 13 from the Vanguard. Today it sits
between two keystone spurs, Idle Hands and Unerring Discipline, with 8 nodes within 400. It becomes usable if the Vestry
is re-laid on roads (§16).

## 2. Channelling: no cluster and no line

**Demand.** 13 gems:

- **int spells (9):** Blaze Stream, Furnace Roar, Crackle Ring, Searing Lance, Judgement Tempest, Thunder Spiral,
  Hoarfrost Mote, Rot Touch, Withering Breath
- **dex attacks (4):** Flurry of Edges, Twister Blade, Storm Rush, Blight Hail

The reference has 4 channelling notables, so two clusters is proportionate.

**Supply.** None. `lines.ts` has no channelling line.

**Walk: a Mystic with Blaze Stream.**

| Point | Notable        |
| ----- | -------------- |
| 2     | First Light    |
| 10    | Arcane Focus   |
| 13    | Sharp Mind     |
| 18    | Broad Weave    |
| 25    | Flashpoint     |
| 36    | Thunderhead    |
| 42    | Overcharge     |
| 49    | Cinder         |
| 71    | Hearthfire     |
| 83    | Homily         |
| 98    | Searing Avatar |

The walk ends at 110. This is a fire caster's walk. Nothing is about channelling, so picking a channelling skill costs
nothing and buys nothing in the tree.

**Gap:** no cluster.

**Before deciding.** §14 lists "channelled" among the delivery categories that confused you as _section_ ideas. This
proposal is a line on two notables, not a section or an area, so whether it belongs is your call.

**Fix: the new `channelDamage` line on two clusters.** They are 23 steps apart and their partners differ (mana against
speed and stun).

|                   | Spells (the Spire)                                                           | Attacks (the Knife)                                                                                                              |
| ----------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Hang off          | `spire.frost.toShatter.r2`, the bare road from the frost junction to Shatter | `knife.roofs.walk.r7`, a bare node on the Rooftops road                                                                          |
| Position          | about (-500, -4450)                                                          | about (4000, -1100)                                                                                                              |
| `near.ts`         | Empty within 400. Prismatic Balance's spur is 540 away; do not link it.      | Only `r7` within 400                                                                                                             |
| Steps from starts | about 20 from the Mystic                                                     | about 18 from the Shade, 20 from the Strider                                                                                     |
| Lines             | channelling damage + reduced mana cost (`costReduction`)                     | channelling damage + attack speed with channelling skills (`attackSpeed` with tags `['channelling']`) + avoid stun (`stunAvoid`) |

## 3. Physical spells: no cluster and no line

**Demand.** 13 gems tag spell and physical.

- **Mostly physical (7):** Orbiting Blades, Rain of Steel, Ghost Blades, Jaws Trap and Rumble Trap are dex; Quake Totem
  and Open Wounds are str.
- **Partly elemental (6):** Judgement Tempest, Rime Spires, Cleansing Blaze, Thunder Spiral and Tide of Judgement are
  int; Shrapnel Trap is dex. Each also carries an element tag, and most convert part of their physical base to that
  element.

**Supply.** None. The physical lines are attack-only: `meleePhys` and `physAttack`. Every other damage type has a line
that reaches spells: untagged `eleDamage` for the elements, and `chaosSpell`, added in round 3.

**Walk: a Shade with Orbiting Blades and Rain of Steel.**

| Point | Notable       |
| ----- | ------------- |
| 2     | Keen Instinct |
| 8     | Quiet Knife   |
| 22    | Hedge Magic   |
| 30    | Sharp Mind    |
| 35    | Arcane Focus  |
| 40    | Darting Bolts |
| 42    | Broad Weave   |
| 45    | Lingering     |

After point 45 the walk buys crit, dodge, ES and resists, ending at 103. It also buys Rotting Word (91) and Withering
(94), which are chaos and damage over time and do nothing for this build. Nothing is physical. Points 8 to 45 cross
into the Mystic for generic spell notables.

**Gap:** no cluster, and no line.

**Fix: the new line `physSpell`, mirroring `chaosSpell`, on two clusters about 22 steps apart.**

An alternative is a global `physDamage` line, after the reference's ten "physical damage" notables. It would also reach
attackers, who already have `meleePhys` and `physAttack`, and would blur the attack/spell trade-off. I recommend
`physSpell`.

|                   | The Knife                                                                                       | The Cathedral                                                                                                         |
| ----------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Hang off          | `knife.roofs.walk.r2`, a bare node on the Rooftops road                                         | `cathedral.crypt.toSpire.b`, the crypt stair                                                                          |
| Position          | about (2600, -3050)                                                                             | about (-1600, -3800)                                                                                                  |
| `near.ts`         | Empty within 400                                                                                | Cinder at 359 and Tomb Dust at 362, so keep the cluster tight                                                         |
| Steps from starts | about 19 from the Shade                                                                         | about 18 from the Zealot, 21 from the Mystic                                                                          |
| Lines             | physical spell damage + skill duration. Five of the seven mostly-physical spells have duration. | physical spell damage + elemental damage (`eleDamageAll`), for the converting int spells, Quake Totem and Open Wounds |
| Notes             |                                                                                                 | Glass Wall is 2 steps away and Tomb Dust 4: off-type notables on the way, a fair price                                |

## 4. Elemental attacks: nothing for dex builds

**Demand.** 20 single-element attack gems:

- **By element:** fire 10, cold 6, lightning 8. Primal Strike and Prime Splash count in all three.
- **By attribute:** 12 are dex, 7 of them bows. 8 are str.

The reference has 3 fire-attack, 2 cold-attack and 2 lightning-attack notables.

**Supply.**

- **Attack-specific:** only Rimed Steel (cold, on the Bell Tower wheel) and Kindled Steel (fire, at the far end of the
  Ambulatory). Both are in the Cathedral. Lightning attacks have none.
- **Untagged `eleDamage`:** these lines reach attacks too, but they sit in int regions. Steps from the attack starts:

|                                          | Reaver              | Vanguard          | Strider                 | Shade                    |
| ---------------------------------------- | ------------------- | ----------------- | ----------------------- | ------------------------ |
| Nearest lightning notable                | 28 (Static Edge)    | 24 (Thunder Peal) | 21 (Static Edge)        | 16 (Static Edge)         |
| Kindled Steel                            | 34                  | 27                | 37                      | 35                       |
| Rimed Steel                              | 25                  | 18                | 28                      | 27                       |
| Nearest generic elemental-attack notable | 13 (Elemental Edge) | 8 (Zeal)          | 6 (Elemental Fletching) | 10 (Elemental Fletching) |

**Walk 1: a Reaver with a sword and Bolt Cleave.**

| Point | Notable                                                                                               |
| ----- | ----------------------------------------------------------------------------------------------------- |
| 9     | Keen Edge                                                                                             |
| 15    | Elemental Edge                                                                                        |
| 17    | Light Blades                                                                                          |
| 24    | Fencer's Eye                                                                                          |
| 39    | Elemental Fletching                                                                                   |
| 51    | Zeal                                                                                                  |
| 69    | **Static Edge, the first lightning notable**, after a 17-point road through the Strider and the Knife |
| 75    | Overcharge                                                                                            |

**Walk 2: a Vanguard with a mace and Magma Crack.**

| Point | Notable                                  |
| ----- | ---------------------------------------- |
| 11    | Zeal                                     |
| 25    | Hearthfire (fire, with a caster partner) |
| 42    | Hallowed Hammer                          |
| 59    | Searing Avatar                           |
| 64    | Censer                                   |
| 73    | Kindled Steel                            |

The str side is served, if late.

**Gap.** Lightning attacks have no cluster. The attack-specific element clusters are all in one region, and dex attack
builds have none within 20 steps.

**Fix.**

- **(a) A lightning-attack cluster in the Yard.**
  - **Where:** a short road south from `yard.blood.j2.a`, to about (400, 3800).
  - **`near.ts`:** empty within 400. Spellsword's and Festering's smalls are 400 to 450 to the north.
  - **Lines:** lightning damage with attacks + attack speed, using the existing `eleAttackOne('lightning', v)`.
  - **Steps:** about 13 from the Strider and 17 from the Reaver; 13 from Elemental Edge and 30 from Static Edge.
  - **Partners:** they differ from Static Edge (crit and shock), Overcharge (shock effect) and Thunder Peal (shock
    duration).
  - **Hang node:** `j2.a` already has degree 5. If that is too busy, `bow.steel.toBlood.e` (degree 2) is next to it, but
    it is in your Strider file. `j2.a` is also in the Yard centre that §16 lists for re-laying; if the re-lay moves the
    Pits junction, hang this cluster off whatever road replaces it.
- **(b) For you, in the Strider: a fire-attack bow cluster.** Four of the ten fire-attack gems are bows: Ember Downpour,
  Torch Arrow, Fuse Arrow and Mortar Bow.
  - **Lines:** fire damage with attacks + area damage. Three of those four bows are area skills. This keeps it apart from
    Kindled Steel's ignite.
  - **Where:** the free space south of Sentry Post, about (1450, 3050) off `bow.steel.toBlood.c`. Empty within 400; 8
    steps from the Strider.
- **Cold attacks:** 6 gems and one cluster. Low; no change proposed.

## 5. Traps: too few, and the same pairing twice

**Demand.** 9 trap gems, all dex, plus Set Snare, a support that turns a spell into a trap. The reference has 9 trap
notables.

**Supply.**

| Notable                           | Lines                                         |
| --------------------------------- | --------------------------------------------- |
| Tripwire (`bow.bows.tripwire.n`)  | trap damage 24, throwing speed 8, cooldown 10 |
| Trapper (`knife.snares.wheel.t3`) | trap damage 24, throwing speed 4, trap area 8 |

They are 8 apart. The core of both is trap damage with throwing speed.

**Walk: a Shade with elemental traps.**

| Point | Notable       |
| ----- | ------------- |
| 2     | Keen Instinct |
| 8     | Thick Blood   |
| 14    | Trapper       |
| 16    | Snakeskin     |
| 21    | Tripwire      |

After point 21 there is nothing for traps. The walk goes on to mines (Sapper 39, Black Powder 44, a different
specialization), then generic lightning and spell notables, ending at 96.

**Gap:** too few clusters, and duplicate partners.

**Fix.**

- **(a) Re-line Trapper,** which is in the Knife, not your region. Drop its throwing speed for more trap area. The two
  then read "trap + speed + cooldown" and "trap + area".
- **(b) Add a third cluster.**
  - **Where:** off `spire.frost.toOvercharge.r1`, the bare road on the Spire's north-east rim toward the Knife, at about
    (1150, -4400).
  - **`near.ts`:** empty within 400.
  - **Lines:** trap damage + skill duration (`trapDamage`, `skillDuration`). Six of the nine traps have duration.
  - **Steps:** about 23 from the Shade and the Mystic, 18 to 20 from the other two trap clusters.
  - **This is the weakest placement in the report.** The Spire rim is int-side; the Knife (dex/int) is the natural
    trapper's region, and 23 steps is what that trapper pays. A spot in the Knife would be better once the Knife grows
    (§16).

## 6. Daggers and claws: all near the Shade start, done early

**Demand.** 19 gems take daggers and 19 take claws, but nearly all of them also take swords. Only Viper Lash and Venom
Strike are dagger-and-claw only.

Weighted demand is 4.8 each. For comparison: sword 8.4, axe 7.7, mace 5.3, staff 3.9. Per cluster that is 2.4, against
2.1 for swords, so the amount is about right. The problem is where the clusters are.

**Supply.**

| Notable                                 | Weapon | Lines                                                 |
| --------------------------------------- | ------ | ----------------------------------------------------- |
| Fine Point (`knife.edge.wheel.w5`)      | dagger | dagger + crit + dual crit                             |
| Quiet Knife (`knife.home.quietKnife.n`) | dagger | dagger + spell damage + cast speed                    |
| Talon (`knife.edge.wheel.w3`)           | claw   | claw + life and mana on hit                           |
| Carrion Claws (`knife.snares.wheel.t5`) | claw   | claw + chaos attack + damage against poisoned enemies |

All four are in the Knife, 4 to 12 apart. Fine Point and Talon are the two sides of one wheel.

Weapon lines reach attacks only (`lines.ts` `weaponLine`). So for a dagger attacker, Quiet Knife's spell half is dead
weight, and the dagger has one and a half attack notables. The reference splits daggers and claws between two sectors,
with twins 10 to 14 apart.

**Walks.**

| Build  | Weapon notables              | Then                    |
| ------ | ---------------------------- | ----------------------- |
| Dagger | Fine Point 8, Quiet Knife 17 | Done with daggers at 17 |
| Claw   | Talon 7, Carrion Claws 19    | Done with claws at 19   |

After that, both builds walk to the Strider and the Yard for one-handed and dual-wield notables: Light Hand 31, Twin
Fangs 41, Crossed Blades 48, Light Blades 57. Then crit, dodge and leech.

**Gap:** all in one region, near the start, with no late decision.

**Fix.**

- **(a) A late dagger cluster.**
  - **Where:** off `knife.roofs.walk.r5`, about (3750, -2300).
  - **`near.ts`:** empty within 400.
  - **Lines:** dagger damage + attack speed with daggers + accuracy with daggers (`daggerDamage`,
    `weaponSpeed('dagger')`, `weaponAccuracy('dagger')`).
  - **Steps:** about 20 from the Shade; 13 from Fine Point and 18 from Quiet Knife.
- **(b) A claw cluster on the Knife–Strider border.** This follows the reference's two-sector split.
  - **Where:** off `knife.snares.toRicochet.r4`, about (3400, 350).
  - **`near.ts`:** empty within 400.
  - **Lines:** claw damage + attack speed with claws + movement speed.
  - **Steps:** about 17 from the Shade and 14 from the Strider; about 7 from Carrion Claws and 12 from Talon.
  - **Poison-claw core.** §16 already logs it. This cluster's partner is speed, not poison, so it gives the poison claw a
    choice rather than another stop. If you want it further from that core, the Rooftops road beyond `r7` has room.

## 7. Spell block: nothing on the str or dex side

**Supply.**

| Notable                                 | Lines                              | Steps from starts                             |
| --------------------------------------- | ---------------------------------- | --------------------------------------------- |
| Spirit Ward (`spire.well.spiritWard.n`) | shield spell block + mana on block | Mystic 9, Vanguard 18, Strider 20, Reaver 23  |
| Glass Wall (`cathedral.crypt.wheel.m5`) | shield spell block + ES            | Zealot 14, Vanguard 21, Reaver 26, Strider 27 |

Glass Wall's side of the wheel also has `spellBlock(2)` smalls. Both notables are shield-only, both are on the int side,
and they are 15 apart. The reference has 9 spell-block notables, several on the str side.

**Gap.** The shield builds of the Wall (Bracing) and the Yard (Steel Rim, Buckler) have no spell block within 18 steps.

**Fix.**

- **Where:** off `wall.grit.north.a`, about (-1800, 2300).
- **`near.ts`:** `wall.grit.drums.a` at 389 and `wall.grit.north.b` at 396.
- **Lines:** spell block + life on block (`spellBlock` or `shieldSpellBlock`, `lifeOnBlock`).
- **Steps:** about 16 from the Vanguard and 20 from the Reaver; 12 from Bracing, 31 or more from the two existing ones.

## 8. Dual wield: the same partner twice, none for str

**Supply.**

| Notable                                      | Lines                                  |
| -------------------------------------------- | -------------------------------------- |
| Twin Fangs (`yard.dual.twinFangs.n1`)        | dual damage, speed and block           |
| Crossed Blades (`yard.dual.crossedBlades.n`) | dual crit + accuracy + crit multiplier |
| Fine Point                                   | dagger + dual crit                     |

Two of the three pair dual wield with crit. All three sit in the Yard and the Knife, yet two-axe and two-mace builds are
str. The reference has 11 notables with dual-wield lines.

**Fix.**

- **Where:** off `wall.grit.west.b`, about (-3300, 1900).
- **`near.ts`:** only `west.b` itself, at 400.
- **Lines:** dual-wield damage + armour.
- **Steps:** about 17 from the Vanguard; 28 or more from the other dual-wield clusters.
- **Neighbour:** it is 6 steps from the spell-block spot in item 7. That is fine, since a build takes one or the other.

## 9. Staff: thin, but covered by two-handed

**Supply.** Quarterstaff (`cathedral.rods.wheel.r5`: staff + block + area) and Crozier (`cathedral.ambulatory.crozier.n`:
staff + spell). The two-handed line also reaches staves: Thunderstep, Greatweight, Headsman, Heavy Hands and Greatblade.

**Walk: a Zealot warstaff.**

| Point | Notable                              |
| ----- | ------------------------------------ |
| 13    | Quarterstaff                         |
| 27    | Crozier (its spell half goes unused) |
| 46    | Thunderstep                          |
| 62    | Greatweight                          |
| 88    | Headsman                             |
| 89    | Heavy Hands                          |

It never runs out of staff or two-handed notables.

Crozier, like Quiet Knife, is half a notable for either build: the staff line is attack-only and the spell line serves
any weapon.

**Verdict:** adequate for now. If you want a second staff-attack home, the Wall–Cathedral west road has room, beside the
curse spot in item 1.

---

## Checked and adequately supplied

| Specialization                             | Why it is adequate                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sword                                      | 4 clusters in 3 regions (Keen Edge, Fencer's Eye, Fleet Blade, Greatblade); weighted demand 8.4                                                                                                                                                                                                                                                                                                                                     |
| Axe                                        | 4 clusters (Hewing, Cleaver, Fencer's Eye, Hatchet Work). Cleaver's distance from dex is already in §16.                                                                                                                                                                                                                                                                                                                            |
| Mace                                       | 3 clusters, all in the Wall (its §5.4 home), 6 to 8 apart, with partners stun, crit and elemental. 1.8 weighted gems per cluster, the same as sword and axe.                                                                                                                                                                                                                                                                        |
| Sceptre                                    | 3 clusters: `maceDamage` reaches sceptres (Weight of Iron, Hallowed Hammer), plus Gilded Rod                                                                                                                                                                                                                                                                                                                                        |
| Bow                                        | 4 clusters plus 8 projectile clusters (your region)                                                                                                                                                                                                                                                                                                                                                                                 |
| Wand attacks                               | 2 clusters (Deft Wand, Wand Volley), 14 apart, for 4 gems                                                                                                                                                                                                                                                                                                                                                                           |
| Wand spells                                | Wandwork is spell damage while holding a wand. It reaches all 105 spells, so it is a weapon choice for casters, not a skill specialization, and needs no twin. The reference has no wand-spell notable. It is 7 steps from the Zealot start and 10 from the Mystic start.                                                                                                                                                           |
| One-handed                                 | Light Blades and Light Hand, 19 apart, plus 3 dual-wield and 8 shield clusters                                                                                                                                                                                                                                                                                                                                                      |
| Two-handed                                 | 5 clusters, all in the Wall. The Reaver reaches Thunderstep in 9 steps and Headsman in 18. Walk (Reaver, two-handed axe): Thunderstep 17, Headsman 41, Heavy Hands 47, Greatweight 65. Greatweight and Headsman share the two-handed + stun pairing; add Headsman to §16's Weight of Iron / Greatweight note.                                                                                                                       |
| Stun (dealing)                             | 4 clusters, all in the Wall by design (§5.3). The repeated pairing is as above.                                                                                                                                                                                                                                                                                                                                                     |
| Spell projectile                           | Darting Bolts and Sleet, 21 apart, plus the Strider's untagged projectile lines. Walk (Mystic, cold projectiles): Darting Bolts 18, Sleet 57, Ricochet 68, Far Flight 78, Split Volley 80. The reference has no spell-projectile notable. Sleet is cold, so a fire or chaos projectile caster has Darting Bolts and the Strider rim.                                                                                                |
| Spell crit                                 | Sharp Mind and Flashpoint, plus untagged crit in the Knife (Keen Instinct, Static Edge, Mercy Stroke, Bloodletter), 10 from the Mystic start                                                                                                                                                                                                                                                                                        |
| Totems                                     | 3 clusters (Standing Cairns, Sentry Post, Reliquary), 19 to 40 apart, with partners area, speed and spell, for 10 gems plus 2 supports                                                                                                                                                                                                                                                                                              |
| Mines                                      | 2 clusters, 8 apart, for 4 gems plus 2 supports                                                                                                                                                                                                                                                                                                                                                                                     |
| Brands, warcries                           | 2 clusters each, for 2 and 4 gems                                                                                                                                                                                                                                                                                                                                                                                                   |
| Minions                                    | 5 clusters in 4 regions for 17 gems, with partners spell, speed, ES, movement and armour                                                                                                                                                                                                                                                                                                                                            |
| Auras                                      | 7 clusters for 25 gems                                                                                                                                                                                                                                                                                                                                                                                                              |
| Chaos spells                               | Rotting Word and Tomb Dust, 25 apart, for 10 gems, plus Withering (damage over time with chaos)                                                                                                                                                                                                                                                                                                                                     |
| Chaos attacks                              | Venom Fletching and Carrion Claws, plus the poison clusters, for 6 gems                                                                                                                                                                                                                                                                                                                                                             |
| Fire, cold, lightning spells               | 3 to 5 clusters each, in 2 or 3 regions, since round 3's late clusters                                                                                                                                                                                                                                                                                                                                                              |
| Physical attacks                           | Oathbound, Quickened Steel, Iron Draw, Deep Cuts, Heavy Draw                                                                                                                                                                                                                                                                                                                                                                        |
| Ailments and damage over time              | Bleed 6 clusters, poison 4, ignite 3, freeze and chill 4, shock 6, damage over time 3                                                                                                                                                                                                                                                                                                                                               |
| Slam, strike, nova, guard, movement skills | Not specializations under §14, so no new lines. Slams are served by `meleeArea`, `areaDamage`, two-handed, mace, Thunderstep, Long Reach and Ground Shaker. Strikes are served by the weapon and melee lines and Long Reach's range. Novas are served by spell area (Broad Weave, Tomb Dust). Guard skills are served by duration and cooldown. Movement skills are utilities whose damage scales through their weapon and element. |

Already logged in §16 and not re-derived here:

- the poison-claw core
- the Bulwark wheel
- Weight of Iron and Greatweight
- single homes for fervour and insight charges

---

## Corrections to the coverage table (`specs.ts`)

Its predicates are heuristics. These misread the tree:

- **`physical`** matches `physReduction`, which is defence (Mortar and Stone, Scarred Hide, Barrow Ward). Physical
  offence is 5 clusters, all attack-side.
- **`fire spell`, `cold spell`, `lightning spell`** count `eleDamage`, which has no spell tag and also serves attacks.
  Static Edge, Overcharge and Thunder Peal are lightning notables for attackers as much as for casters.
- **`spell projectile` and `crit (spell)`** miss the untagged generic lines that also reach spells: `projectileDamage`,
  `pierce` and `chain` on the Strider rim, `critChance` and `critMulti` in the Knife. (`block (spell)` is correct: it
  matches the untagged `spellBlock` smalls.)
- **`curse`** counts Second Curse, a one-line notable (+1 curse).
- **Weapon gem counts** count a gem once for every weapon it takes. Use the weighted count from `wdem.ts`.
- **`wand spell` and `cooldown`** have no demand predicate.
- **The hard-coded zeros** (`channelling`, `physical spell`, `slam`, `strike`, `nova`, `guard`, `movement skill`) are
  right only for channelling and physical spells, which have no line. The others are served by existing lines (see
  above).

## Proposals in your Strider region

- **A fire-attack bow cluster** (item 4b), about (1450, 3050) off `bow.steel.toBlood.c`.
- **Possibly hanging the Yard's lightning-attack cluster off `bow.steel.toBlood.e`**, if `yard.blood.j2.a` (degree 5) is
  too busy (item 4a).
- **The trap duplicate** is fixed on the Knife side (re-lining Trapper), so Tripwire needs no change.

## Every proposed cluster at a glance

| Specialization             | Hang off                      | Position       | Free within | Nearest start (steps)         | Nearest twin (steps)     | New line         |
| -------------------------- | ----------------------------- | -------------- | ----------- | ----------------------------- | ------------------------ | ---------------- |
| Curse (str)                | `wall.maces.toHymn.r4`        | (-4000, 100)   | 400         | about 20, Vanguard and Zealot | about 37                 | —                |
| Curse (dex)                | `yard.shield.toPits.r1`       | (-750, 4050)   | 380         | about 18, Reaver and Strider  | about 29                 | `damageVsCursed` |
| Channelling (spells)       | `spire.frost.toShatter.r2`    | (-500, -4450)  | 400         | about 20, Mystic              | about 25                 | `channelDamage`  |
| Channelling (attacks)      | `knife.roofs.walk.r7`         | (4000, -1100)  | 400         | about 18, Shade               | about 25                 | `channelDamage`  |
| Physical spells (dex)      | `knife.roofs.walk.r2`         | (2600, -3050)  | 400         | about 19, Shade               | about 24                 | `physSpell`      |
| Physical spells (int/str)  | `cathedral.crypt.toSpire.b`   | (-1600, -3800) | 359         | about 18, Zealot              | about 24                 | `physSpell`      |
| Lightning attacks          | `yard.blood.j2.a`             | (400, 3800)    | 400         | about 13, Strider; 17, Reaver | about 30 (Static Edge)   | —                |
| Fire attacks, bows (yours) | `bow.steel.toBlood.c`         | (1450, 3050)   | 400         | about 10, Strider             | about 43 (Kindled Steel) | —                |
| Traps                      | `spire.frost.toOvercharge.r1` | (1150, -4400)  | 400         | about 23, Shade and Mystic    | about 20                 | —                |
| Daggers                    | `knife.roofs.walk.r5`         | (3750, -2300)  | 400         | about 20, Shade               | about 15                 | —                |
| Claws                      | `knife.snares.toRicochet.r4`  | (3400, 350)    | 400         | about 14, Strider; 17, Shade  | about 7                  | —                |
| Spell block                | `wall.grit.north.a`           | (-1800, 2300)  | 389         | about 16, Vanguard            | about 33                 | —                |
| Dual wield                 | `wall.grit.west.b`            | (-3300, 1900)  | 400         | about 17, Vanguard            | about 30                 | —                |

None of these links to a keystone spur. Item 1 and item 6b each name a spur within 400 units that must stay a dead end.
The Knife gets four new clusters on its Rooftops road (`r2`, `r5`, `r7`, and the Ricochet road). That road now branches
at only `r3` and `r6`, and the Knife is still the thinnest region (§16).
