# D. The network pass: the user's method, applied to the other regions

2026-10-19. The user edited the rebuilt Strider in the tree editor ("this is a network, not a tree") and asked for the same
method on the Wall, the Yard and the Spire, after widening the vocabulary ("a far smaller vocabulary of node types than
the reference"). Their patch was folded into the Strider's files first (`scripts/passives/fold.ts`), node for node.

## The method, read from the patch

What the user's edit of the Strider did, and what each region now follows:

1. **The start touches two stat nodes**, not attributes: the two sides of the signature loop (attack speed and evasion
   for the Strider; melee damage and attack speed for the Reaver; armour and melee damage for the Vanguard; shield and
   spell damage for the Mystic). The hubs sit one step out, with a pocket each and the ring link.
2. **Attribute corridors longer than one node are cut.** The Strider's five-node string became two; the Yard, the Wall
   and the Spire lost their one-node junction corridors. Attribute nodes went from 31% of the Strider to 19%, and the
   other regions sit at 8 to 12%.
3. **Smalls are one stat at the reference's size** (5% attack speed, 10% evasion, 15% crit); mixed lines live on
   notables only.
4. **Pockets are bridges.** A chain of two or three nodes hangs between two places rather than dead-ending off one:
   the accuracy chain reaches the projectiles hub, the evasion chain too, the elements pocket is passed through. Every
   notable cluster in the four regions can now be reached from two directions, except the keystone spurs (still dead
   ends, as the reference's are) and the stubs that wait for the Knife and the Cathedral.
5. **A resist star** in each region: a notable with four single-node spokes, one per element with chaos, each landing
   somewhere else, so buying resistances is also travelling.
6. **Off-theme families inside the region**, where a neighbour's build would cross for them: mana and shields in the
   Strider (the user's), reservation and auras in all four, melee leech and mana leech, weapon crit, dodge, flasks,
   cost reduction, curses, chaos damage over time, movement and cooldowns.

What the edit did not do, and the regions do not either: it did not make everything a loop (the Strider's dead ends
went from 14 to 20, because pockets have tips). "Every area two ways in, and more families" is the lesson.

## The wider vocabulary (`src/data/passives/lines.ts`, 186 lines now)

All of it reads stats the engine already has (A2 §1); nothing needed engine work. Grouped:

| Group                                                      | Lines                                                                                                                                                                                                                                                                                                       |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Recovery and pools                                         | `lifeFlat`, `manaFlat`, `esFlat`, `manaLeech`, `esLeech`, `manaOnHit`, `manaOnKill`, `esOnHit`, `manaOnBlock`, `reducedReservation`, `auraEffect`                                                                                                                                                           |
| Poison and chaos                                           | `poisonChance`, `poisonDamage`, `poisonFaster`, `poisonDuration`, `chaosAttack`, `chaosSpell` (round 3), `physSpell` (round 4), `chaosDot`, `dotDamage`                                                                                                                                                     |
| Ailments                                                   | `bleedDuration`, `igniteDuration`, `shockDuration`, `freezeDuration`, `ailmentEffect`, `avoidAilments`                                                                                                                                                                                                      |
| Weapons by kind                                            | `daggerDamage`, `clawDamage`, `staffDamage`, `wandAttack`, `weaponDamage(w, v)`, `weaponCrit(w, v)`, `weaponCritMulti(w, v)`, `weaponSpeed(w, v)`, `weaponAccuracy(w, v)`, `daggerSpellDamage` and `daggerSpellCrit` (round 4)                                                                              |
| Shields, dual wield, block, dodge                          | `shieldAttack`, `shieldSpeed`, `dualCrit`, `dualAccuracy`, `spellBlock`, `blockRecovery`, `dodgeAttack`, `dodgeSpell`                                                                                                                                                                                       |
| Defence                                                    | `globalDefences`, `stunRecovery`, `maxResOne(t, v)`, `armourFlat`, `evasionFlat`                                                                                                                                                                                                                            |
| Offence, the rarer lines                                   | `pierce`, `chain`, `doubleDamage`, `cullingStrike`, `meleeRange`, `areaDamage`, `spellCritMulti`, `damageVsLowLife`, `damageVsBleeding`, `damageVsPoisoned`, `damageVsChilled`, `damageVsShocked`, `damageVsCursed` (round 4), `damageOnFullLife`, `damageOnLowLife`, `attackSpeedOnKill`, `critOnFullLife` |
| Curses, minions, deployables, cooldowns, durations, flasks | `curseEffect`, `hexLimit`, `curseArea`, `minionDamage`, `minionLife`, `minionSpeed`, `trapDamage`, `mineDamage`, `brandDamage`, `trapSpeed`, `mineSpeed`, `cooldownRecovery`, `skillDuration`, `channelDamage` (round 4), `flaskEffect`, `flaskRecovery`, `flaskDuration`                                   |

Each line records which function made it (`Line.spec`), so the editor can show and change a node's lines in this
vocabulary and a patch can be folded back into the files. Left out on purpose: stats that only a hand would feel
(dodge timing, manual flask use), the `damage` and `flag` builders (an options object is not a dropdown), and
`damageTaken` (a "less damage taken" line is a balance lever, not a node).

## The four regions, measured

| Region                            | Nodes | Edges | Cycles | Attribute share | Stat families | Keystones from the start |
| --------------------------------- | ----- | ----- | ------ | --------------- | ------------- | ------------------------ |
| Strider (the user's edit, folded) | 120   | 134   | 15     | 19%             | 47            | 8, 9, 10, 10             |
| Reaver (Yard)                     | 103   | 125   | 23     | 12%             | 60            | 14, 19, 19               |
| Vanguard (Wall)                   | 111   | 133   | 23     | 8%              | 63            | 11, 13, 15, 18           |
| Mystic (Spire)                    | 117   | 141   | 25     | 9%              | 52            | 13, 13, 17, 18, 22       |

The Strider before the user's edit: 105 nodes, 10 cycles, 31% attributes, 31 families.

After the vocabulary pass (2026-10-19, later the same day; see "The vocabulary pass" below):

| Region          | Nodes | Edges | Cycles | Attribute share | Stat families | Every notable and keystone bought                        |
| --------------- | ----- | ----- | ------ | --------------- | ------------- | -------------------------------------------------------- |
| Strider         | 135   | 154   | 20     | 17%             | 59            | 97 points                                                |
| Reaver (Yard)   | 112   | 144   | 33     | 11%             | 63            | 96 points (with four Wall notables and two Strider ones) |
| Vanguard (Wall) | 117   | 147   | 31     | 8%              | 66            | 92 points (with four Yard notables)                      |
| Mystic (Spire)  | 131   | 165   | 35     | 8%              | 64            | 79 points                                                |

The last column is the 120-point walk's lesson: a region is exhausted at 80 to 100 points, so a late build's last 20
to 40 points are crossings by construction. The Reaver's and Vanguard's walks already spend them in each other's
region; the Mystic's and Strider's cannot until the Cathedral and the Knife exist.

Attribute supply at 60 points (the audit's greedy notable-collector): Strider +250 dex, Mystic +240 int, Vanguard
+120 str, Reaver +110 str and +100 dex. The pure classes with cut corridors are near the brief's +3 a point; the Strider
is high because its roads are the user's. If any is too low, the fix is the node value, not the layout.

## New pockets by region

- **Yard:** Stout Heart (life), Buckler (block), Fencer's Eye (sword and axe crit), Executioner (damage against
  bleeding, culling, double damage), Four Winds (resist star), Sidestep (dodge), Standard Bearer (reservation, aura
  effect), Thirsting Blade (mana leech, mana on hit). The east gate `yard.dual.j2` is designed around the four Strider
  links that land on it.
- **Wall:** Unshakable (stun threshold and recovery), Quartermaster (flasks), Warlord's Banner (reservation, aura,
  mana; a stub toward the Zealot), Elemental Ward as a star, Crushing Blow (mace and axe crit, double damage),
  Unhurried (movement, cooldown recovery), Vampiric Strikes (melee leech, mana leech). Thick Skin now opens onto the
  tower's junction; Endurance loops back to the grit junction.
- **Spire:** Still Mind (mana), Sharp Mind (spell crit), Siphon (shield leech and on hit), Frugal (cost), Devotion
  (reservation, toward the Cathedral), Hexwright (curses, toward the Knife), Prism Ward as the column's star,
  Withering (damage over time, chaos: a bridge into the fire arm), Lingering (duration, cast speed: a bridge into the
  lightning arm).

## Provisional, from the user's patch

Names the user left as placeholders in the Strider's files were given names in the vocabulary pass (lines untouched;
each node's `why` records the old name): BigMana is Clear Head, axe dam is Hatchet Work, OneHandFast is Light Hand,
Sheild power is Round Shield, the unnamed "+10 all attributes, 8% life, 10% evasion" is Wanderer, the second Vital
Aim is Killing Eye, Resist Star is Weathered. Two line changes still worth a second look: Rapid Fire carries sword
damage (was projectile attack damage) and Wayfarer's smalls lost their resistances. The patch is the user's and the
files say so on every added node.

## The vocabulary pass (2026-10-19, after the philosophy document)

The user's review: the new lines were only in notables, once each, and the smalls were still the old ten stats (Yard
block ×14, Strider evasion ×14 and crit ×12, Wall armour ×11 and regeneration ×9, Spire element ×13 and spell damage
×12); 61 of 180 lines were used nowhere. The pass, region by region, each addition a bridge unless it says otherwise:

- **Spire** (rule 1 was broken worst: above the column, three strands each ending in a dead-end room, and Fever
  Pitch eight single-stat nodes in a row). The top is a lattice now: Cinder's far side reaches the Prismatic spur,
  which swings toward it; Harsh Weather (ailment effect, freeze and shock duration) bridges the shatter room to
  Overcharge, which moved nearer the column; Fever Pitch has two smalls. Two new roads flank the column: west, from
  the well's junction to the fire arm's junction, Quiet Pulse (life: the region had none) and Mana Tap (mana leech
  with spells, mana on hit); east, from Hexwright to the lightning arm's junction, Draught (flasks, movement) and
  Mist Walk (spell dodge, attack dodge, movement). The craft road is cast speed, so the two roads out of the home
  differ in kind.
- **Wall**: Bracing (block, block recovery, shield defences) between the Bulwark's south small and the tower road, a
  third rampart-tower loop; Iron Lungs (mana on hit with melee, mana leech, mana) between the slam road and the slam
  wheel's east small; the two-hander wheel's speed side is two-handed attack speed on its smalls; Blood Rite's
  approach is life, not a fifth regeneration small.
- **Yard**: the road from the signature to the hub is life (it was block, the generic way down for a two-sword
  Reaver); the shield wheel's west side is spell block up to Shield Catch; the dual wheel's block side is all block;
  the sword and one-hand diamonds carry a speed small on their speed side. Fighting Breath (mana on hit, mana leech,
  life) bridges the middle road and the second-hand road above the wheel; Field Dressing (flasks, life) bridges
  Stout Heart to Fencer's Eye along the Wall border and is a near crossing to the Wall's Iron Lungs; Crossed Blades
  (dual crit, dual accuracy, multiplier) runs from Hot Blood's far small to the leech and Steel Rim, so the charges
  are no longer a dead-end room.
- **Strider** (the user's edit; new named clusters only, no link of theirs removed and no node of theirs moved
  except Wayfarer's entrance, which sat 81 units from the crit pocket's; new links land on three of their nodes:
  Split Volley, which was an open wheel's tip and is now passed through to Skewer, Killing Eye, which takes Quick
  Sip's exit, and the bleed wheel's `c2`, which takes Thirsty Quiver): Thirsty Quiver (attack leech, life on hit, mana leech) from
  the physical row's first junction to the bleed wheel's damage side; Tripwire (traps) from the fourth bows junction
  to the dear Knife stub, and Venom Fletching (chaos attack, poison) from that stub back to the Close Quarters small,
  so the stub is on a loop; Skewer (pierce) off Split Volley and Quick Sip (flasks, movement) after it, landing on
  Killing Eye and joined to Rapid Fire: the south-east rim is a road.
- **Labels**: every area label sat on nodes; they are placed clear of nodes and edges now (a scratch search over a
  grid; the render draws them at 1.5× the node font instead of 2×), and the crossing check counts label overlaps.

Still unused after the pass (45 lines): the flat-value lines, the per-weapon lines for weapons no written region
holds (dagger, claw, staff, wand attack), minions, brands, mines, hex limit, the conditional damage lines, chain,
knockback, melee range, global defences, life on kill, mana on block. Most belong to the Knife and the Cathedral.
