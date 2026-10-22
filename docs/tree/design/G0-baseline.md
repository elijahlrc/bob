# G0. The baseline: how much tension the network gives today

Measured 2026-10-22 on the network as committed (1,009 live nodes), for phase G0 of [G-growth.md](G-growth.md). Nothing in
the network changed. This is user stop 1: the archetypes, the radius and the targets below are proposals for the user to
accept, change or strike.

## The tools

- **`scripts/passives/archetypes.ts`**: 22 archetypes. Each is a player's wish list: a weight for each line of the
  vocabulary (1 a main want, 0.5 a want, 0.25 to 0.4 a nice-to-have), the keystones it would take, the main stats
  reported one at a time and the pair reported together, and what its weapon's gear asks for. The weights steer the
  allocator. They never decide where a node goes (CONSTRAINTS §14).
- **`scripts/passives/builds.ts`**: the allocator and the report.
  `npx tsx scripts/passives/builds.ts [--only id,id] [--budgets 60,120] [--radius 18] [--json out.json] [--pics dir]`.
  The output of this run is in [G0/builds.txt](G0/builds.txt) and [G0/builds.json](G0/builds.json) (run prettier on the
  JSON after writing it, or `npm run check` fails), with a picture of each archetype's plans in [G0/builds/](G0/builds/).
  `npm run passives:builds` and `npm run passives:supply` run the two scripts.
- **`scripts/passives/supply.ts`**: the supply map.
  `npx tsx scripts/passives/supply.ts [--md out.md] [--pic empty.png]`. It writes [G0/supply.md](G0/supply.md) (units by
  stat family and region, nodes by area, every specialization's notables with their partners and nearest twin, and the
  empty space) and [G0/empty.png](G0/empty.png).

**How the allocator works.**

- A plan is a connected set of nodes from the class's start that never passes through another start. Every node costs
  one point, whatever its kind.
- A node is worth the sum of its lines' units (`Line.units`) times the archetype's weights. Attribute lines are worth
  nothing: they are the road's supply, reported beside each plan against the gear. Otherwise every attribute node would
  count as wanted and the tax would vanish.
- **Search.** It first takes greedy paths by value per point. Then it tries swaps: for each wanted notable it skipped,
  it frees points by pruning its least valuable leaves, reaches for that notable and refills.
- **Alternative plans.** It solves again with one or two of the best plan's top notables banned. If a banned search
  beats the best plan, the search restarts from it.
- **Checks.** The swaps and bans improved on the first greedy plan by 0 to 10%. After a restart, no ban found anything
  better.
- It is deterministic, so a later round means the same thing as this one.
- The 60-point plan is the best for 60 points, not the first 60 points of the 120-point plan. Even so, 14 of the 22
  60-point plans lie wholly inside their 120-point plan, and the rest at least three quarters (warcry-totem 75%, staff
  block 85%, block caster 89%, claw poison 90%, the others 97 to 98%).

**What it reports**, at 60 and 120 points:

- **Reach:** the share of the value within 18 steps of the start that the best plan takes. All the build's wants count,
  generic ones (resistances, mana) included, so this number is diluted. The main stats below are sharper.
- **Choice:** distinct plans within 5% of the best, where each takes at least three notables or keystones the others
  do not (two was tried first: with about thirty notables in a 120-point plan, swapping two is nearly free, and almost
  every build counted three or more).
- **Tax:** the share of points spent on nodes worth nothing to the build (mostly attribute roads).
- **Main stats, one at a time:** for each main stat family, the share of what lies within reach that the plan takes,
  plus the amount in the stat's own terms (spell damage 126%, energy shield 157% and +15).
- **Gave up:** the notables of its own kind within reach that it left, each with its worth and the points it would cost
  from the plan.
- **Attributes:** what the plan supplies.

There is never one power number for a build (the user, 2026-10-22).

## The headline: at 120 points, builds get nearly all of their main stats

The user's two examples, in their own terms:

- **The classic caster (Mystic; cold spells, energy shield).**
  - At 60 points it takes 65% of the spell damage within 18 steps and 46% of the energy shield.
  - At 120 points it takes **100% of the spell damage and 85% of the energy shield**: 126% spell damage, +30% with a
    wand and +12% spell area damage, plus 157% energy shield and +15.
  - **The whole network holds only 17 units (about 136%) of plain spell damage within its reach.** At 120 points it
    gives up nothing it wants: the best notables it leaves are worth 1.6 units or less.
- **The strength sword build (Reaver; life, armour, sword damage).**
  - At 60 points it takes 85% of the armour within reach, 48% of the sword damage and 46% of the life.
  - At 120 points it takes **97% of the armour, 89% of the sword damage and 80% of the life** (202% armour, 214% life),
    reaching into the Vanguard for armour and into the Strider for attack speed.
  - What it leaves at 120 is minor: Shelter, Vampiric Strikes, Thirsty Quiver.

Across all 22 archetypes:

- At 120 points, **most main stats are at 80 to 100%** of what lies within reach, and 12 of the 22 archetypes have at
  least one main stat at 100%.
- Life is the exception: it is spread widely, and the life share at 120 is 37 to 80%.
- At 60 points, the main stats are mostly at 40 to 80%. A few are already full or nearly: wand damage, claw damage,
  two-handed damage, spell damage for the life caster (94%) and minions (91%).
- The weighted reach is 33 to 47% at 60 points and **55 to 72% at 120**, against the plan's first guess of "well under
  two thirds".

| archetype     | start    | reach 60 / 120 | choice 60 / 120 | tax 60 / 120 | main stats: share of what lies within reach, 60 / 120                                     |
| ------------- | -------- | -------------- | --------------- | ------------ | ----------------------------------------------------------------------------------------- |
| caster-es     | Mystic   | 38 / 68%       | 3 / 3           | 35 / 38%     | spell damage 65 / 100%; cold damage 67 / 67%; energy shield 46 / 85%; cast speed 26 / 83% |
| sword-str     | Reaver   | 42 / 72%       | 2 / 2           | 27 / 32%     | life 46 / 80%; armour 85 / 97%; sword damage 48 / 89%; attack speed 18 / 68%              |
| mace-slam     | Vanguard | 40 / 66%       | 2 / 2           | 30 / 32%     | life 45 / 72%; armour 57 / 85%; two-handed mace damage 81 / 96%                           |
| mace-shield   | Vanguard | 36 / 62%       | 2 / 3           | 27 / 29%     | life 37 / 59%; armour 53 / 69%; block 62 / 90%; mace damage 20 / 94%                      |
| warcry-totem  | Vanguard | 39 / 66%       | 1 / 3           | 30 / 38%     | life 36 / 72%; totem damage 0 / 75%; warcries 0 / 0%                                      |
| bow-crit      | Strider  | 38 / 64%       | 3 / 1           | 23 / 22%     | life 25 / 52%; evasion 39 / 75%; bow damage 64 / 84%; crit 21 / 55%                       |
| bow-elemental | Strider  | 39 / 63%       | 2 / 1           | 20 / 27%     | life 21 / 56%; evasion 44 / 77%; elemental attack damage 43 / 43%; bow damage 46 / 67%    |
| bow-poison    | Strider  | 41 / 69%       | 1 / 1           | 25 / 28%     | life 30 / 59%; poison 37 / 67%; bow damage 10 / 53%                                       |
| caster-life   | Mystic   | 34 / 65%       | 4 / 3           | 42 / 37%     | spell damage 94 / 94%; elemental damage 42 / 71%; life 16 / 68%; spell crit 100 / 100%    |
| summoner      | Mystic   | 44 / 63%       | 1 / 3           | 38 / 39%     | minions 91 / 100%; energy shield 63 / 93%; life 16 / 37%                                  |
| wand-attack   | Mystic   | 44 / 66%       | 1 / 2           | 38 / 32%     | wand damage 100 / 100%; energy shield 76 / 76%; attack speed 37 / 78%                     |
| axe-bleed     | Reaver   | 36 / 62%       | 3 / 5           | 32 / 34%     | life 45 / 66%; bleed 43 / 83%; axe damage 61 / 61%                                        |
| dual-wield    | Reaver   | 42 / 68%       | 1 / 2           | 22 / 28%     | life 42 / 56%; dual wield 75 / 100%; evasion 49 / 91%                                     |
| fire-burn     | Zealot   | 34 / 64%       | 4 / 6           | 37 / 39%     | fire damage 39 / 44%; spell damage 54 / 100%; life 27 / 59%                               |
| staff-block   | Zealot   | 41 / 68%       | 2 / 6           | 33 / 41%     | spell damage 28 / 87%; block 43 / 100%; life 43 / 57%                                     |
| aura-brand    | Zealot   | 33 / 64%       | 2 / 4           | 30 / 36%     | auras 24 / 90%; brand damage 25 / 41%; life 27 / 60%                                      |
| dagger-crit   | Shade    | 43 / 63%       | 1 / 2           | 18 / 27%     | life 29 / 46%; crit 43 / 73%; dagger damage 49 / 80%; evasion 61 / 84%                    |
| claw-poison   | Shade    | 47 / 69%       | 1 / 1           | 30 / 29%     | life 35 / 62%; poison 81 / 81%; claw damage 100 / 100%                                    |
| trap-mine     | Shade    | 40 / 66%       | 3 / 1           | 37 / 38%     | trap and mine damage 73 / 100%; energy shield 24 / 81%; evasion 75 / 75%                  |
| dagger-caster | Shade    | 47 / 68%       | 2 / 3           | 45 / 45%     | spell damage 76 / 100%; spell crit 28 / 100%; energy shield 77 / 88%                      |
| two-hand-fire | Vanguard | 37 / 69%       | 1 / 2           | 28 / 29%     | life 36 / 73%; armour 73 / 85%; fire attack damage 19 / 65%; two-handed damage 100 / 100% |
| block-caster  | Zealot   | 43 / 55%       | 1 / 2           | 32 / 40%     | block 26 / 47%; spell block 83 / 100%; spell damage 48 / 86%; energy shield 65 / 58%      |

How to read a row: the strength sword build at 120 points takes 97% of all the armour that lies within 18 steps of
the Reaver's start.

## One stat at a time, across the builds that share it (120 points)

- **Life.** Strength builds take about 190 to 240%: mace slam 238%, two-handed fire 231%, warcry-totem 229%, sword
  214%, mace and shield 199%, axe bleed 188%. The others take about 120 to 170%, most with +20 flat besides (dagger
  crit 119%, bow crit 141%, aura and brand 145%, bow poison and dual wield 161%, staff block 162%, fire burn 167%,
  caster on life 172%). The summoner, which only half wants life, takes 97% and +20.
- **Energy shield.** Five builds take 128 to 189% (summoner 189%, dagger caster 160%, classic caster 157%, wand 130%,
  traps 128%). The block caster takes only 77%, since block pulls it elsewhere.
- **Spell damage.** Every caster that puts it first lands on 108 to 134% (the aura and brand build, which puts it
  second, takes 76%), because about 136% is all there is within reach. The supply is
  the cap, not the build's choices.
- **Armour.** The four strength builds take 162 to 218%. Armour is 35 units in the whole network, 23 of them in the
  Vanguard.
- **Evasion.** The five evasion builds take 298 to 336%.

## Where tension is missing first

These stats are taken at 90% or more at 120 points, so a build gives up none of them:

- **Spell damage** (every caster).
- **Energy shield** (the summoner, the dagger caster).
- **Armour** (the sword build).
- **Weapons and mechanics:**
  - the main weapon's own lines: wand, claw, mace, two-handed;
  - minions, traps and mines, dual wield, spell crit;
  - block (the staff caster, mace and shield), spell block, auras.

Three reasons stand out in the supply map ([G0/supply.md](G0/supply.md)):

- **The supply is small.** The whole network holds:
  - 76 units of spell lines, 57 of energy shield, 35 of armour and 35 of evasion;
  - 21 or fewer units of each weapon.

  A build's main stat is a few clusters, and 120 points reach all of them.

- **Twins sit close.** For example, the Cloister's energy shield notables are 3 steps apart, and so are the Rooftops'
  dagger notables (2 steps). The supply map marks every pair under five steps.
- **Some specializations have one home or one twin**: sceptre, area damage, staff, brands, claws, mines, channelling
  (whose two notables are 45 steps apart).

What already works: life is spread over every region, fire spells are spread (Cinder, Flashpoint, Hearthfire, Censer
11 to 16 steps apart), and the elemental bow cannot reach most elemental attack lines.

## Tax, attributes and depth

- **Tax.** 18 to 45% of points go to nodes worth nothing to the build. The casters pay most (37 to 45%), the bow and
  dagger builds least (18 to 28%). Nine archetypes are above a third at 120 points. Growth should bring this down by
  putting wanted nodes along the roads, not by adding more road.
- **Attributes are oversupplied** (CONSTRAINTS §16 says to check this at the end). At 120 points a plan collects:
  - about 230 to 280 strength (Vanguard and Reaver builds), against gear asking 120 to 180;
  - about 255 to 300 dexterity (Strider and Shade attack builds), against 140 to 180;
  - about 230 to 260 intelligence (Mystic casters), against 150.

  More roads per walk will add more, so G5 has to look at road values again.

- **Depth.** The 120-point plans reach a median of 22 steps from the start at their deepest. Ninety per cent of their
  nodes lie within 12 to 24 steps, with a median of 18.

## The empty space

Measured in cells of 100 × 100 tree units with no node within 170 units ([G0/empty.png](G0/empty.png)):

| region   | cells inside the outline | empty inside | share | empty at the rim |
| -------- | -----------------------: | -----------: | ----: | ---------------: |
| Strider  |                      598 |           90 |   15% |              553 |
| Shade    |                      939 |          304 |   32% |              263 |
| Mystic   |                      884 |          179 |   20% |               77 |
| Zealot   |                      821 |          234 |   29% |              221 |
| Vanguard |                     1069 |          312 |   29% |              236 |
| Reaver   |                      679 |          147 |   22% |              144 |
| centre   |                      254 |           99 |   39% |                0 |

- **Inside** means within the network's own outline: room to fill without growing. **The rim** is the band between that
  outline and the circle through the farthest node: room to grow outward.
- The Shade, the Vanguard and the Zealot have the most room inside.
- The Strider is compact: little room inside, the most at the rim (south-east).
- The Mystic is the densest and has little room either way.
- The centre's empty cells are the inside of the ring, which by design holds no nodes.

As a rough guide, a cluster of a notable and three smalls with room round it takes four to six cells, and roads take
more. So the inside could hold a few hundred new nodes. The Strider and a growth of 500 to 900 nodes would need the rim.
Whether the map grows is G1's question, not this one's.

## Proposals for stop 1

1. **The radius: 18 steps.** It is the median depth of the 120-point plans: 90% of their nodes lie within 12 to 24
   steps. Once agreed, it is fixed for every later round.
2. **Targets, all measured at the end of G4 against this baseline:**
   - **Main stats at 120 points.** For most archetypes, no main stat above about two thirds of what lies within reach,
     and never both stats of the pair above two thirds. Today most are at 80 to 100%.
   - **Main stats at 60 points.** No main stat above about half (today 20 to 100%). The radius is the same 18 steps,
     so part of what a 60-point build leaves is simply too far for 60 points; this number matters less than the one
     at 120.
   - **Weighted reach at 120:** under about 55% for most (today 55 to 72%).
   - **Choice:** at least 3 at 120 points for most and at least 2 at 60 for most. Today it is 1 to 6 at 120 (ten
     archetypes at 3 or more) and 1 to 4 at 60 (thirteen at 2 or more, nine at 1).
   - **Tax:** at or under about a third at 120 for most (today 22 to 45%), so the new tension comes from wanted nodes,
     not from distance.
   - **One stat at a time:** shown before and after, with no target, since the absolute numbers are balance (the user,
     2026-10-22). One example: a caster's spell damage at 120 points should come out roughly where it is (about 110 to
     135%) while being a smaller share of what it could reach.
3. **The archetype set:** the 22 in `archetypes.ts`, starting with the user's two. See the questions below.

## Questions for the user

- **The strength sword build starts as the Reaver,** since swords and the Reaver's starting kit are there. Should it be
  a Vanguard starting with a sword instead, or both?
- **Archetypes to add or strike.** Missing today:
  - a lightning or physical spell caster from the Zealot;
  - a channelling build;
  - a sceptre fire attacker;
  - a curse build;
  - a dodge or spell-dodge Shade.
- **Are the targets right?** For example, is two thirds at 120 points the right amount of tension, or should it be
  tighter?

## What was checked

- CONSTRAINTS §1 item 1 (tension), §5.1–2 (twins and partners, in the supply map), §7.4 (attributes) and §12.3–4
  (balance is supply; this is a static tool, not a bot simulation).
- §14 (the archetypes are a yardstick and never place a node).
- No power number for a build anywhere, per G-growth §0.
