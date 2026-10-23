# G4 fix pass 2: the Shade (`knife`)

2026-10-23. Two items (fix-2.md §2.2), both re-lines. No node moved, added or removed. No link was added, cut or re-aimed,
so the border links are unchanged. Files: `src/data/passives/knife/edge.ts`, `src/data/passives/knife/snares.ts`.

## Items

### K-1 Thick Blood (`knife.edge.thickBlood.n`): done, with the optional swap

- Was `life(10), lifeFlat(20), es(5)` (4.0 units). Now **`life(10), resOne('chaos', 15)`** (2 + 1.5 = 3.5 units).
- The flat life is dropped, as the brief asked. The 5% energy shield is replaced by chaos resistance. Every partner was
  checked against the exclusions and the Shade's other life notables:
  - It is not evasion, energy shield or dodge.
  - The Shade's three life notables now have three different partners: Thick Blood with chaos resistance, Wiry Frame
    with evasion (9 steps away), and Sea Legs with dodge (14 steps away).
  - The yardstick weighs chaos resistance at 0.25 for every build (the RES bundle). The Shade's poison and curse builds
    (claw-poison, curser) and bow-poison weigh it at 0.5. Casters weighed energy shield at 1.0, so the line the passing
    casters valued is gone.
  - A life notable with a resistance stays on one theme (§10.2), and the name fits the line ("blood thick enough to
    shrug off a poison").
- The resist star Snakeskin (all resistances and evasion, with a chaos spoke) is 5 steps away. Its partner is different,
  and resistances are generic stats meant to be spread out (§5.3), so I left it.
- §4.5: the Shade keeps a life notable 7 steps from its start. §6.2: the first ten points are unchanged.
- Updated the `why` texts: the node's, the cluster's, and Sea Legs' mention of Thick Blood in `snares.ts`. Removed the
  `es` and `lifeFlat` imports from `edge.ts`, which nothing else there used.
- One `why` outside my folder is now stale: `spire/craft.ts` lines 305 and 542 call Thick Blood "the life Shade". It is
  still accurate, but it belongs to the Mystic's file, so it is for the coordinator if wanted.

### K-2 Wasp Sting → Cutpurse's Luck (`knife.snares.mercy.n`): done

- Was `critMulti(25), poisonDamage(16)` (3.4 units). Now **`critMulti(25), weaponCrit('dagger', 15), weaponCrit('claw', 15)`**
  (2.1 + 1 + 1 = 4.1 units). Its smalls `a` and `b` stay `critMulti(12)`, so the cluster is all crit. Ids are unchanged:
  the cluster is still `mercy`, and only its name changed.
- **New name: Cutpurse's Luck.** `grep -i` of `reference/tree/ref-tree.json` finds nothing, no other node in
  `src/data` has the name, and `ip.test.ts` plus `names.test.ts` pass (names.test reads the baked tree, so the grep is the
  real check).
- Different leads among the crit notables near it:
  - Fine Point (8 steps) leads with dagger damage, plus dagger crit and dual-wield crit.
  - Raking Hand (5 steps) is claw damage with claw speed.
  - Between Ribs (21 steps) is dagger damage with dagger crit multiplier.
  - Cold Steel (14 steps) is cold attacks with crit chance.
  - Barbed Point (9 steps) is poison with crit chance.
  - Venom Fletching (3 steps, across the border link) now shares no line with it.
- Same template as another region: the Reaver's sword-and-axe crit notable (`yard/shield.ts:178`, `critMulti(25)` plus
  crit chance for two weapons) has the same shape. Cutpurse's Luck is its dagger-and-claw mirror, on the other weapons'
  side of the map.
- Updated the `why` texts: the cluster's, the node's, the road link `toBow.b → mercy.a`, and the border link
  `mercy.n → bow.flight.venom.a`. I changed that link's reason only; the link itself stays. Two mentions of Wasp Sting
  elsewhere in my folder also changed: Raking Hand's link in `edge.ts` and Smeared Edge's cluster reason in `snares.ts`.

## Ids changed or removed; border links

- None. No ids were added, retired or renamed. Only one display name changed (Wasp Sting → Cutpurse's Luck).
- No border link was moved or cut.

## Lines `lines.ts` lacks

- None. Every line used (`resOne`, `weaponCrit`) already exists.

## Checks

| Check                                | Result                                                                                                                              |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `npx tsc --noEmit -p .`              | clean                                                                                                                               |
| `geometry.ts --region shade --bends` | 0 crossings, 0 drawn over, 10 bends over 20°. No geometry changed, so these are the existing ones (wheel corners and `toHedge.r1`). |
| `passives:audit -- shade`            | problems 0. Thick Blood 3.5 units and Cutpurse's Luck 4.1, every Shade notable 3.0 to 5.0.                                          |
| Ways in                              | No area or cluster lost or gained a link.                                                                                           |
| `ip.test.ts`, `names.test.ts`        | pass (6 tests)                                                                                                                      |

Pictures are in `docs/tree/design/G4/fix2/shade/`:

- `before.png` and `after.png` (the region; identical apart from one label)
- `thick-blood.png` (close-up)
- `cutpurses-luck.png` (close-up)

## Allocator readings

The readings are indicative only. Four other agents were editing at the same time: `bow/`, `cathedral/`, `spire/` and
`yard/` all show changes in git, so some of the shifts below are theirs. Before is `G4/builds-r2start.json`; after is a
full 32-archetype run with `--json` (scratch).

**Thick Blood**

- 120-point plans: from 17 to 12 of 32. It is no longer the network's top notable. The top is now Zeal and Quiet Pulse
  at 13, then six notables at 12, Thick Blood among them.
- Builds that dropped it at 120: spell-totem, fire-burn, aura-brand, storm-caster and spellblade.
- Builds that still take it at 120:
  - the five Shade builds, dagger-caster and bow-poison
  - caster-es, summoner, wand-attack, bow-crit and bow-elemental
- storm-caster and spellblade now list it under "gave up at 120" at 2.4 units, so for them it is a choice now, not a
  default.

**Cutpurse's Luck** (was Wasp Sting)

- 120-point plans: from 4 (bow-poison, claw-poison, dagger-crit, dodge-blades) to 3 (dagger-crit, claw-poison,
  dodge-blades).
- 60-point plans: from 2 (bow-poison, claw-poison) to 0. The poison builds no longer collect it with Venom Fletching
  early. Venom Fletching itself is unchanged (bow-poison and claw-poison at 60 and 120).

| Build        | 60, before → after                                                       | 120, before → after                                                       | Choice at 60 / 120 |
| ------------ | ------------------------------------------------------------------------ | ------------------------------------------------------------------------- | ------------------ |
| dagger-crit  | life 13.6 → 12.6; crit 9.5 → 11.5; dagger 3.0 → 3.0; evasion 26.5 → 23.0 | life 24.4 → 22.4; crit 25.3 → 27.3; dagger 9.6 → 9.6; evasion 36.7 → 33.2 | 1→2 / 2→1          |
| claw-poison  | life 13.6 → 13.6; poison 7.3 → 6.0; claw 8 → 8                           | life 29.4 → 28.4; poison 17.5 → 16.2; claw 8 → 8                          | 4→2 / 2→2          |
| dodge-blades | dodge 4.0 → 6.7; life 13.6 → 11.0                                        | dodge 19.3 → 19.3; life 25.0 → 24.0                                       | 3→3 / 2→4          |
| trap-mine    | unchanged apart from energy shield −1 and evasion −2.5                   |                                                                           | 5→4 / 4→4          |
| curser       | energy shield 24.2 → 22.2                                                | curses 22.5 → 10.5; energy shield 26.6 → 37.8                             | 2→2 / 5→8          |
| caster-es    | energy shield 12.6 → 18.6                                                | spell damage 24.8 → 19.8; energy shield 41.6 → 39.6                       | 1→2 / 2→6          |
| storm-caster | life 19.4 → 24.4                                                         | life 35.8 → 24.4; lightning 24.1 → 21.5                                   | 3→4 / 5→6          |
| spellblade   | life 30.2 → 23.6                                                         | life 48.8 → 40.6                                                          | 3→3 / 1→7          |

The 160-point columns are in the scratch runs (`builds-before.txt` and `builds-after.txt`).

**What my edits did:**

- claw-poison loses about 1.3 units of poison at 60 and at 120. That is the 16% poison removed from Cutpurse's Luck, and
  it is intended.
- The Shade builds lose about 1 unit of life (the flat life).
- dagger-crit gains crit.

**What likely came from the other agents, not from my edits:** curser's curse drop (22.5 → 10.5 at 120) and caster-es's
spell damage drop. Neither build gained or lost a Shade line, and the Zealot cut a curse crossing (Z-3). Worth checking
in the coordinator's full measure.

## For the coordinator or the user

- Thick Blood is still in 12 plans at 120. That is level with the other generic defence notables, not above them. It is
  a life notable 7 steps from a start with three life smalls around it, and §4.5 wants it there. Going further would
  mean moving it, which the audit advised against ("Re-line, not move").
- The `spire/craft.ts` `why` texts that mention Thick Blood are accurate but in the Mystic's folder.

## Constraints checked

| Section            | What was checked                                                                                            |
| ------------------ | ----------------------------------------------------------------------------------------------------------- |
| §1.1               | Fewer builds take Thick Blood by default.                                                                   |
| §4.5               | The Shade keeps life near home, with varied defences.                                                       |
| §5.1 / §5.2 / §5.5 | Life partners differ: chaos, evasion, dodge. The knife crit leads differ. No poison pair three steps apart. |
| §6.2               | The first ten points are unchanged.                                                                         |
| §8.2               | Sections stay uniform.                                                                                      |
| §8.6               | 3.5 and 4.1 units.                                                                                          |
| §10.2              | Each notable keeps one theme.                                                                               |
| §10.3              | Every line is read by the sim (`resist.chaos`, tagged `critChance`, as used elsewhere).                     |
| §2.4               | The new name was checked against the reference.                                                             |
| §11                | No geometry changed.                                                                                        |
| §14                | No new rules.                                                                                               |
