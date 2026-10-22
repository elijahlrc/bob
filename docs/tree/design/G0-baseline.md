# G0. The baseline: how much tension the network gives today

Measured 2026-10-22 on the network as committed (1,009 live nodes), for phase G0 of [G-growth.md](G-growth.md). Nothing in
the network changed. This is user stop 1.

**Second version, same day.** The first version counted what lay "within reach" as a number of steps from the start.
The user rejected that as incoherent: a build may stay compact near its start or run long narrow branches out to
widely spread stats, and both are valid, so no step count says what a build can reach. That idea is now in
CONSTRAINTS §14. This version lets the allocator decide what is worth reaching, since it already pays every path's cost,
and measures tension as **what more points would still buy**.

## The tools

- **`scripts/passives/archetypes.ts`**: 27 archetypes.
  - Each is a player's wish list: a weight for each line of the vocabulary (1 a main want, 0.5 a want, 0.25 to 0.4 a
    nice-to-have), the keystones it would take, the main stats reported one at a time, and what its weapon's gear asks
    for.
  - The weights steer the allocator; they never decide where a node goes (CONSTRAINTS §14).
  - The user's two examples come first. The user made up the first set casually and left it to us to maintain, so
    five were added for builds it missed: a lightning and physical caster from the Zealot, a channeller, a sceptre fire
    attacker, a curse build and a dodging Shade.
- **`scripts/passives/builds.ts`** (`npm run passives:builds -- [--only id,id] [--json out.json] [--pics dir]`): the
  allocator and the report.
  - This run's output is [G0/builds.txt](G0/builds.txt) and [G0/builds.json](G0/builds.json). Run prettier on the
    JSON after writing it, or `npm run check` fails.
  - A picture of each archetype is in [G0/builds/](G0/builds/): yellow is the best 60-point plan, orange is what the
    best 120-point plan adds, and red rings are what 40 more points would add.
- **`scripts/passives/supply.ts`** (`npm run passives:supply -- [--md out.md] [--pic empty.png]`): the supply map.
  - It writes [G0/supply.md](G0/supply.md): units by stat family and region, nodes by area, and every specialization's
    notables with their partners and nearest twin.
  - It also writes the empty space as [G0/empty.png](G0/empty.png).

## How tension is measured

**The plans.**

- A plan is a connected set of nodes from the class's start that never passes through another start. Every node costs
  one point.
- A node is worth the sum of its lines' units (`Line.units`) times the archetype's weights.
- Attribute lines are worth nothing to the build. They are the road's supply, reported beside each plan against the
  gear. Otherwise every attribute node would count as wanted and the tax would vanish.
- **The search:**
  - It takes greedy paths by value per point, then tries swaps: for each wanted notable it skipped, it frees points by
    pruning its least valuable leaves, reaches for that notable and refills.
  - It solves again with one or two of the best plan's top notables banned. If a banned search beats the best, the
    search restarts from it.
  - Swaps and bans improved on the first greedy plan by 0 to 10%, and after the restarts nothing better turned up.
  - It is deterministic, so a later round means the same thing as this one.

**What is reported, at 60 points (mid-run) and 120 (a finished build):**

- **What more points would buy.** The best plan is grown by 20 and then 40 more points, keeping every node it has, as a
  player's build grows. 160 points is more than a run gives (123): it is a probe of what a finished build still wants,
  not a build anyone can have.
  - Each main stat is reported at 60, 80 and 100 points, and at 120, 140 and 160, in its own terms (126% spell damage)
    and in units (a unit is one small node of that stat).
  - A main stat that 40 more points barely raise is one the build already has all it wants of: **no tension there.**
  - A stat that keeps climbing is one the build had to leave behind.
- **Gave up:** the wanted notables and keystones that 40 more points would add, each with its worth in units to the
  build. This is the list of what the build chose against.
- **Choice:** distinct plans within 5% of the best, where each takes at least three notables or keystones the others
  do not. With two, almost every build counted three or more, since swapping two of thirty notables is nearly free.
- **Tax:** the share of points spent on nodes worth nothing to the build (mostly attribute roads).
- **Attributes:** what the plan supplies.

There is never one power number for a build (the user, 2026-10-22).

## The headline: most builds run out of what they want before 120 points

**The classic caster (Mystic; cold spells, energy shield).**

| points        |  60 |   80 |  100 |  120 |  140 |  160 |
| ------------- | --: | ---: | ---: | ---: | ---: | ---: |
| spell damage  | 78% |  78% | 126% | 126% | 126% | 142% |
| energy shield | 83% | 131% | 141% | 157% | 170% | 198% |
| cast speed    | 10% |  10% |  37% |  41% |  45% |  49% |

- The 60-to-100 columns grow the best 60-point plan; the 120-to-160 columns grow the best 120-point plan.
- Throughout, it also has 30% spell damage with a wand, 12% spell area damage and +15 energy shield.
- From 100 points on, the spell damage stops: **40 points past 120 buy 16% more spell damage**, because there is no
  more within any sensible walk.
- What 40 more points would add are notables it barely wants: Crozier, Consecrated Plate, Ossuary, Vigil, Shattering
  Rite, worth 1.4 to 3 units each.
- Only its cold damage still climbs (+9 units), since the elemental lines are spread far from the Mystic.

**The strength sword build (Reaver; life, armour, sword damage).**

| points              |   60 |   80 |  100 |  120 |  140 |  160 |
| ------------------- | ---: | ---: | ---: | ---: | ---: | ---: |
| life                | 119% | 161% | 186% | 214% | 246% | 266% |
| armour              | 174% | 190% | 218% | 202% | 218% | 218% |
| sword damage, units |   14 |   16 |   16 |   29 |   31 |   32 |

- It reaches into the Vanguard for its armour, and by 60 points it already has most of it.
- At 120 points, 40 more points add **16% armour and 3 units of sword damage**. Life is the only main stat still
  climbing.
- What 40 more points would add is Broad Back (life) and minor notables: Thirsty Quiver, Weathered, Litany, Vigil.

**Across the 27 archetypes**, 23 have at least one main stat that 40 points past 120 raise by two units or less: two
small nodes' worth for a third of a run's points. The flat ones:

- **Spell damage, for every caster.** The casters that put it first hold 102 to 134% at 120 points. The whole network
  holds about 200% of plain spell damage (25 units), much of it in neighbours' regions.
- **The main weapon's own lines:** wand, claw, dagger, mace, sword, and two-handed for some builds.
- **Specializations a build can finish:** minions, dual wield, auras, block for the staff caster and for mace and
  shield, spell block, spell crit, chaos and damage over time.
- **Defences:** armour for the strength builds, evasion for the dexterity builds, energy shield for the summoner, the
  wand build and the curser.

What still climbs past 120 points, so the network already makes those builds choose:

- **Life**, for most builds, since it is spread over every region.
- **Elements spread across the map:** cold for the classic caster, fire for the burning and sceptre builds, lightning
  for the storm caster, elemental attacks for the bows.
- **A few specializations with far twins:** curses, crit for the bow, axe damage, block for the block caster, dodge.

| archetype     | start    | choice 60 / 120 | tax 60 / 120 | main stats in units: 60 → 100 points · 120 → 160 points                                                                  |
| ------------- | -------- | --------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------ |
| caster-es     | Mystic   | 3 / 3           | 35 / 38%     | spell damage 15 → 21 · 21 → 23; cold damage 9 → 9 · 9 → 18; energy shield 18 → 29 · 32 → 41; cast speed 4 → 11 · 12 → 14 |
| sword-str     | Reaver   | 2 / 2           | 27 / 32%     | life 24 → 37 · 43 → 53; armour 18 → 21 · 20 → 21; sword damage 14 → 16 · 29 → 32; attack speed 5 → 6 · 19 → 21           |
| mace-slam     | Vanguard | 2 / 2           | 30 / 32%     | life 28 → 38 · 48 → 51; armour 14 → 21 · 21 → 22; two-handed mace damage 19 → 19 · 23 → 27                               |
| mace-shield   | Vanguard | 2 / 3           | 27 / 29%     | life 23 → 37 · 40 → 54; armour 13 → 20 · 17 → 22; block 22 → 28 · 32 → 32; mace damage 3 → 10 · 14 → 14                  |
| warcry-totem  | Vanguard | 1 / 3           | 30 / 38%     | life 23 → 31 · 46 → 54; totem damage 0 → 0 · 9 → 9; warcries 0 → 7 · 0 → 7                                               |
| bow-crit      | Strider  | 3 / 1           | 23 / 22%     | life 14 → 26 · 29 → 34; evasion 14 → 21 · 26 → 30; bow damage 23 → 30 · 30 → 32; crit 6 → 8 · 14 → 25                    |
| bow-elemental | Strider  | 2 / 1           | 20 / 27%     | life 12 → 27 · 31 → 34; evasion 15 → 26 · 27 → 31; elemental attack damage 6 → 6 · 10 → 14; bow damage 12 → 18 · 18 → 25 |
| bow-poison    | Strider  | 1 / 1           | 25 / 28%     | life 17 → 29 · 33 → 42; poison 6 → 11 · 11 → 15; bow damage 3 → 7 · 14 → 21                                              |
| caster-life   | Mystic   | 4 / 3           | 42 / 37%     | spell damage 16 → 16 · 20 → 22; elemental damage 10 → 15 · 17 → 24; life 8 → 29 · 35 → 39; spell crit 7 → 7 · 7 → 7      |
| summoner      | Mystic   | 1 / 3           | 38 / 39%     | minions 13 → 22 · 22 → 22; energy shield 21 → 34 · 39 → 40; life 8 → 14 · 20 → 34                                        |
| wand-attack   | Mystic   | 1 / 2           | 38 / 32%     | wand damage 8 → 8 · 8 → 8; energy shield 24 → 24 · 26 → 26; attack speed 7 → 17 · 18 → 21                                |
| axe-bleed     | Reaver   | 3 / 5           | 32 / 34%     | life 23 → 36 · 38 → 49; bleed 12 → 12 · 22 → 25; axe damage 7 → 13 · 12 → 16                                             |
| dual-wield    | Reaver   | 1 / 2           | 22 / 28%     | life 23 → 28 · 33 → 47; dual wield 14 → 17 · 18 → 18; evasion 15 → 25 · 27 → 27                                          |
| fire-burn     | Zealot   | 4 / 6           | 37 / 39%     | fire damage 14 → 24 · 16 → 27; spell damage 8 → 10 · 16 → 16; life 13 → 22 · 34 → 40                                     |
| staff-block   | Zealot   | 2 / 6           | 33 / 41%     | spell damage 7 → 17 · 23 → 25; block 2 → 4 · 4 → 4; life 21 → 25 · 33 → 40                                               |
| aura-brand    | Zealot   | 2 / 4           | 30 / 36%     | auras 4 → 11 · 19 → 19; brand damage 13 → 20 · 17 → 25; life 13 → 25 · 30 → 36                                           |
| dagger-crit   | Shade    | 1 / 2           | 18 / 27%     | life 13 → 25 · 25 → 31; crit 12 → 18 · 25 → 30; dagger damage 4 → 4 · 7 → 7; evasion 20 → 26 · 28 → 31                   |
| claw-poison   | Shade    | 1 / 1           | 30 / 29%     | life 16 → 26 · 32 → 39; poison 11 → 15 · 15 → 17; claw damage 4 → 4 · 4 → 8                                              |
| trap-mine     | Shade    | 3 / 1           | 37 / 38%     | trap and mine damage 10 → 14 · 14 → 18; energy shield 7 → 21 · 26 → 28; evasion 25 → 25 · 25 → 26                        |
| dagger-caster | Shade    | 2 / 3           | 45 / 45%     | spell damage 10 → 22 · 23 → 23; spell crit 2 → 2 · 9 → 9; energy shield 24 → 28 · 33 → 37                                |
| two-hand-fire | Vanguard | 1 / 2           | 28 / 29%     | life 23 → 38 · 46 → 51; armour 18 → 21 · 21 → 25; fire attack damage 3 → 8 · 10 → 14; two-handed damage 6 → 6 · 6 → 10   |
| block-caster  | Zealot   | 1 / 2           | 32 / 40%     | block 5 → 6 · 23 → 32; spell block 5 → 6 · 6 → 6; spell damage 8 → 9 · 14 → 15; energy shield 18 → 22 · 16 → 21          |
| storm-caster  | Zealot   | 5 / 7           | 35 / 41%     | spell damage 4 → 13 · 18 → 19; lightning damage 7 → 12 · 13 → 18; life 21 → 21 · 33 → 39; cast speed 4 → 6 · 9 → 12      |
| channeller    | Mystic   | 2 / 3           | 33 / 32%     | channelling and spell damage 13 → 13 · 17 → 19; mana sustain 21 → 32 · 36 → 43; energy shield 17 → 25 · 31 → 34          |
| sceptre-fire  | Zealot   | 2 / 2           | 25 / 32%     | life 23 → 23 · 38 → 48; fire attack damage 4 → 12 · 10 → 20; sceptre damage 9 → 12 · 13 → 18; armour 15 → 20 · 26 → 26   |
| curser        | Shade    | 1 / 1           | 45 / 39%     | curses 11 → 11 · 11 → 17; chaos and damage over time 7 → 12 · 12 → 12; energy shield 20 → 30 · 32 → 32                   |
| dodge-blades  | Shade    | 1 / 2           | 18 / 25%     | dodge 6 → 10 · 10 → 17; evasion 22 → 26 · 29 → 29; life 13 → 26 · 30 → 31; blade damage 6 → 8 · 8 → 14                   |

How to read a cell: for the classic caster, "spell damage 15 → 21 · 21 → 23" means 15 units at its best 60 points and
21 after 40 more, then 21 units at its best 120 points and 23 after 40 more.

**Choice** is 1 to 7 and mostly 1 to 3: most builds have one clearly best plan and a near-equal second at most.

## One stat at a time, across the builds that share it (120 points)

- **Life.**
  - The strength builds take about 190 to 240%: mace slam 238%, two-handed fire 231%, warcry and totems 229%, sword
    214%, mace and shield 199%, sceptre fire 191%, axe bleed 188%.
  - The others take about 120 to 170%, most with +20 flat besides. They range from the dagger crit build's 119% to the
    life caster's 172%.
  - The summoner, which only half wants life, takes 97% and +20.
- **Energy shield.** Seven builds take 128 to 189%: the summoner 189%, the dagger caster 160%, the classic caster 157%,
  the curser 156%, the channeller 148%, the wand build 130% and traps 128%. The block caster takes 77%.
- **Spell damage.** The casters that put it first land on 102 to 134%. The aura and brand build, which puts it second,
  takes 76%.
- **Armour.** Five builds take 162 to 266%. Armour is 35 units in the whole network, 23 of them in the Vanguard.
- **Evasion.** Six builds take 298 to 350%.

## Why: the supply ([G0/supply.md](G0/supply.md))

- **The supply is small.**
  - The whole network holds 76 units of spell lines, 57 of energy shield, 35 of armour and 35 of evasion.
  - Each weapon has 21 units or fewer.
  - A build's main stat is a few clusters, and a mid-run build reaches all of them.
- **Twins sit close.** For example, the Cloister's energy shield notables are 3 steps apart, and so are the Rooftops'
  dagger notables (2 steps). The supply map marks every pair under five steps.
- **Some specializations have one home, or one twin far away:** sceptre, area damage, staff, brands, claws, mines, and
  channelling (whose two notables are 45 steps apart).

## Tax, attributes and room

- **Tax.** 18 to 45% of points go to nodes worth nothing to the build.
  - The casters pay most (32 to 45%); the bow, dagger and dodge builds pay least (18 to 28%).
  - Growth should bring this down by putting wanted nodes along the roads, not by adding more road.
- **Attributes are oversupplied** (CONSTRAINTS §16 asks for this check at the end). At 120 points a plan collects:
  - about 230 to 280 strength for the Vanguard and Reaver builds, against gear asking 120 to 180;
  - about 255 to 300 dexterity for the Strider and Shade attackers, against 140 to 180;
  - about 230 to 260 intelligence for the Mystic casters, against 150.

  More roads per walk will add more, so G5 has to look at road values again.

- **Room.** Cells of 100 × 100 tree units with no node within 170 units ([G0/empty.png](G0/empty.png)).

  | region   | cells inside the outline | empty inside | share | empty at the rim |
  | -------- | -----------------------: | -----------: | ----: | ---------------: |
  | Strider  |                      598 |           90 |   15% |              553 |
  | Shade    |                      939 |          304 |   32% |              263 |
  | Mystic   |                      884 |          179 |   20% |               77 |
  | Zealot   |                      821 |          234 |   29% |              221 |
  | Vanguard |                     1069 |          312 |   29% |              236 |
  | Reaver   |                      679 |          147 |   22% |              144 |
  | centre   |                      254 |           99 |   39% |                0 |
  - **Inside** means within the network's own outline: room to fill without growing. **The rim** is the band between
    that outline and the circle through the farthest node: room to grow outward.
  - The Shade, the Vanguard and the Zealot have the most room inside.
  - The Strider is compact, with its room at the rim to the south-east.
  - The Mystic is the densest.
  - The centre's empty cells are the inside of the ring, which by design holds no nodes.

## The question for stop 1

**Does "what more points would still buy" capture the tension the user means?** If yes, targets come next: for
example, that 40 points past 120 should still buy a fair share of every main stat for most builds, and that the
gave-up lists should name notables the build really wanted. No target is proposed until the measure is agreed.

## What was checked

- CONSTRAINTS §1 item 1 (tension), §5.1–2 (twins and partners, in the supply map), §7.4 (attributes) and §12.3–4
  (balance is supply; this is a static tool, not a bot simulation).
- §14: the archetypes are a yardstick and never place a node; a step-count radius is now listed as rejected.
- No power number for a build anywhere (G-growth §0).
