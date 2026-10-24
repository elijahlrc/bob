# G4 audit round 2: the network

Audited 2026-10-23 on the network as committed after G4 fix pass 1 (ed95ecf, baked; nothing in `src/data/passives` or
`scripts/passives` has changed since): 1,398 live nodes, 279 notables, 27 keystones, 339 road nodes. Read-only: nothing in
`src/`, `scripts/` or the plan docs was changed. This audit covers CONSTRAINTS §3 (loops, ways in, dead ends, crossings)
and §7 (highways, roads against filler, attribute supply), with the whole of CONSTRAINTS at hand. It is the final audit
round; one fix pass follows.

**Evidence and tools.** `passives:audit` (0 problems), `geometry.ts --bends` (0 crossings, 0 drawn over, 82 bends, was
83), `passives:builds` over the 28 archetypes, re-run for this audit and identical to `G4/builds-fix1.txt`. Scratch
scripts in the session scratchpad (`g4r2-network/`): cul-de-sacs (parts that hang off one node), runs of bare road,
crossing use (which archetype's plan walks each border link), plan composition by region, notables nearer a
neighbour's start than their own, connected patches of nodes no plan uses, attribute sources. **Trials:** a copy of the
current allocator (`builds.ts` with a link added or cut in memory) measured five changes; nothing was written to the
network.

**"Used" means** in the best plan of some archetype at 60, 80, 100, 120, 140 or 160 points.

**A measuring caveat that applies to several findings.** The fix brief (§3 item 6) asked for more archetypes before this
round (a Reaver or Strider spellblade, a curse attacker, a dexterity sword and board) so the yardstick could see
Spellsword, Marked Prey, Round Shield and Fencer's Eye. `scripts/passives/archetypes.ts` still has the same 28. Those
four notables are all on the unused list below, as are Ceaseless Blades (no archetype attacks with a channelled skill)
and Clean Break's crit multiplier (no Reaver archetype weighs generic crit multiplier). For them, "unused" is a gap in
the yardstick first, and a finding only if it survives the missing archetypes. Procession (movement is weighed by one
archetype at 0.4), Spoils (mana sustain) and the centre's arches are in the same position, more weakly.

**Pictures** (`network/`). Green: in a 60-point plan; light green: by 120; yellow: only at 140 to 160; red: no archetype
at any budget. Orange rings mark dead-end parts (keystone spurs left out); cyan lines are border links.

- `usage-whole.png`: the whole network.
- `usage-south.png`: the Strider's outer road south of `j4`, the Fosse, the Pits (findings 1, 2).
- `usage-west.png`: the Zealot–Vanguard west corner (finding 4).
- `usage-northwest.png`: High Veil, Cold Light, Steady Stream and the seam-2 corner (finding 3).

---

## 1. Findings, most important first

### 1. The south band is still a patch nobody walks; distance is not the cause (must fix: partly fixed in round 1)

**Where (`usage-south.png`).** One connected patch of 34 nodes, 15 of them road nodes, that no archetype takes at any
budget up to 160:

- **The Strider's outer road** `bow.rim.road.m56b`, `j6`, `m67`, `j7`, `m78`, `j8`, with Live Wire (`bow.south.liveWire.*`)
  and Field Kit's flask side (`bow.south.fieldKit.f1/f2`).
- **The Reaver–Strider dear crossing** `yard.fosse.storm.n` (Stormstruck)–`bow.rim.road.j8`: walked by no plan, two
  rounds running.
- **The Fosse's east half:** `yard.fosse.road.f2`, `f3`, `f4`, Stormstruck, Ceaseless Blades (`yard.fosse.flurry.*`) and
  Marked Prey (`yard.fosse.marked.*`). The Fosse is 12 of 20 nodes unused.
- **The Pits lattice** (finding 2): `yard.blood.rim.p1`, `p2`, `p3`, `yard.blood.spine.s1`, `s2`, `yard.blood.toHarvest.a`,
  and Spellsword.

**What round 1's fix did.** The patch shrank from 46 nodes (19 road) to 34 (15 road). Bright Shafts came in to 12 steps
and the elemental archer takes it; `j4`, `j5`, `m56a` and the south spoke are now walked (Killing Eye by bow-crit at
120); Live Wire, Killing Eye, Ceaseless Blades and Marked Prey are now arcs, not tips. The elemental archer's identity
stat is no longer flat (10.4 → 14.4 units from 120 to 160, through Cold Steel).

**What is still wrong.**

- **§7.3** ("what the player can branch to along it"): from `m56b` to `j8` the road offers Live Wire, Field Kit's flasks
  and Fouled Tips' far end; from `f2` to `f4` it offers Stormstruck, Ceaseless Blades and Marked Prey. No archetype
  branches to any of them. **§3.7**: the Stormstruck crossing carries no combination anyone walks.
- **It is not distance, measured twice.** Round 1 linked Sentry Post to `j7` and no plan changed. This round a trial
  cut Sentry Post–Field Kit and linked Sentry Post to `liveWire.s1`, putting Live Wire at 13 steps from the Strider start
  (it is 21). **No plan of bow-elemental, bow-crit, bow-poison, dual-wield, claw-poison or axe-bleed changed.** Live Wire
  (three lightning-attack smalls, a notable with shock chance) is worth about 4.5 units to the elemental archer over 4
  points, which loses to everything else it can buy, even at 13 steps. Stormstruck and Live Wire are the network's two
  lightning-attack clusters and they sit 6 steps apart in the same unwalked corner.
- **Half of it is the yardstick's blind spot** (the caveat above): Ceaseless Blades, Marked Prey and Spellsword have no
  archetype at all.

**Proposed fix**, in this order (weigh it with the specializations auditor, since it is supply):

1. **First, the coordinator adds the missing archetypes** of the fix brief's §3 item 6, plus a melee lightning or
   elemental attacker (the Reaver side of Stormstruck), and re-runs the allocator. Anything that is then walked stops
   being a finding. This costs no node.
2. **The Pits lattice** goes whatever the measure says (finding 2).
3. **If Live Wire and Stormstruck are still in no plan:** the lightning-attack supply is placed for no player who goes
   there. Give one of the two a partner an archer or a Reaver weighs (attack speed or crit on Live Wire, as Stormstruck
   has attack speed: the specializations auditor's call), rather than moving it in: the trial shows moving it in buys
   nothing. If the specializations auditor would rather not re-line, the honest network fix is to shorten the band:
   remove `bow.rim.road.m67` and link `j6`–`j7` directly (about 610 units, on the road's own line; check crossings with `geometry.ts`; re-hang Live Wire's `s1` side on `j6`), one
   bare road node fewer, no route lost.

**A fix must not break:** §3.5 (the band keeps Field Kit, Fouled Tips, the south spoke and Killing Eye as ways in);
§3.7 (Reaver–Strider stays at 8: keep the Stormstruck crossing unless a measured reason says otherwise, since the user
asked for more crossings, not fewer); §5.2 (Live Wire 5+ from Stormstruck, 6 today); §11.5 (any re-hung arc regular);
§14 (no node moved to satisfy the allocator: the reason must be a player who wants it).

### 2. The Pits: a lattice of six bare road nodes that parallels a road 120 units away (should fix)

**Where** (the Reaver, `yard.blood`; `usage-south.png`, left of centre). Two rows join the two Pits hubs `yard.blood.j3.a`
(-420,3100) and `j2.a` (420,3100):

- the north row: `j3.a` – Open Veins – `toHarvest.a` (0,2980) – Red Harvest – `j2.a`, walked by sword-str, axe-bleed and
  dual-wield from 60 points;
- the south row: `j3.a` – `rim.p1` (-200,3190) – `rim.p2` (0,3220) – `rim.p3` (210,3190) – `j2.a`, 90 to 240 units south of
  the first, plus a cross-link `toHarvest.a`–`rim.p2` and the spine `rim.p2`–`spine.s1`–`spine.s2`–Fosse `f4`.

**What is wrong.** The south row is a second road beside the first; the only thing branching off it is Spellsword (via
`spine.s1`), which also has its own link to `f1`. All six road nodes are in no plan. This is the lattice §16 names ("The
Yard's centre is still a lattice") and the filler of §7.3 and §14 in form: `rim.p1` and `rim.p3` are bare (degree 2) with
nothing coming off them.

**Proposed fix.** Remove `yard.blood.rim.p1` and `rim.p3` (2 road nodes, ids retired) and their links. Keep `rim.p2` as
the one node between `toHarvest.a` and `spine.s1` (it then has two links, a straight north–south run). A direct
`toHarvest.a`–`spine.s1` link was checked and passes over `rim.p2` (24 units) and crosses `p1`–`p2`, so `p2` stays.
Nothing loses a way in: `j3.a` keeps four links, `j2.a` four, Spellsword keeps `spine.s1` and `f1`, the Fosse keeps `f1`,
the spine, `lasting`, `leg` and the Wall's `f7`.

**Must not break:** §3.5 (Open Veins and Red Harvest keep their two diamond entrances); §7.2 (the Pits' clusters still
hang off attribute roads); §11.5 (the spine stays a straight run).

### 3. High Veil and Cold Light: the round-1 exception should now be reversed (should fix)

**Where:** `spire.fire.rim.a/b/c`, Cold Light and High Veil hang off `spire.fire.rim.c` (10 nodes, 23 to 28 steps out); Steady
Stream (`spire.frost.stream.*`) is a dead-end pocket off `spire.frost.toShatter.r2` (`usage-northwest.png`). Round 1 kept
the cul-de-sac as an exception because a loop narrowed three builds' choices; the fix brief said re-test after the seams.

**Re-tested.** With Quickening moved to the west climb and the seams in, the same trial link
`spire.frost.stream.n`–High Veil now **widens** choice:

| build                  | choice at 60, today → trial | choice at 120, today → trial | tax at 120 |
| ---------------------- | --------------------------- | ---------------------------- | ---------- |
| caster-es              | 2 → **1**                   | 4 → 6                        | 33% → 33%  |
| wand-attack            | 2 → 3                       | 3 → 3                        | 43% → 40%  |
| channeller             | 3 → 4                       | 4 → 5                        | 29% → 28%  |
| block-caster           | 4 → 4                       | 3 → 8                        | 28% → 28%  |
| summoner               | 3 → 3                       | 3 → 4                        | 40% → 40%  |
| caster-life, fire-burn | unchanged                   | unchanged                    | unchanged  |

The one cost is caster-es's 60-point choice (2 → 1).

**Proposed fix.** Link `spire.frost.stream.n` (Steady Stream) to `spire.frost.highVeil.a`: 328 units, 0 crossings, nothing
within 60 units (checked). Two dead ends become one loop at once: Steady Stream is a bridge, and the network's only
multi-cluster cul-de-sac goes. High Veil comes to about 22 steps from the Mystic start (27 today, 24 from the Zealot's),
so it stops being a Mystic notable that is nearer the Zealot.

**Must not break:** §3.5 and §3.6 (it removes an exception); §5.5 (Steady Stream, channelling, and High Veil, energy shield
with resistances, are different kinds: no shop); §11.5 (the High Veil triangle keeps its shape; the link leaves its
lower-right corner toward Steady Stream).

### 4. The Zealot–Vanguard west corner: still two crossings, both unwalked (should fix: round 1's finding 6, partly fixed)

**Where (`usage-west.png`).** A patch of 16 nodes (6 road) used by no plan: Battle Hymn (`cathedral.ambulatory.hymn.*`),
`cathedral.ambulatory.toWall.b`, Procession (`cathedral.rim.procession.*`), Grim Oath (`wall.maces.oath.*`),
`wall.maces.toHymn.r1`–`r4`, `wall.maces.rim.a`.

**What round 1's fix did.** The Stagger leg was cut and Battle Hymn is a straight bridge. But the corner keeps two
crossings 660 units apart, Battle Hymn–`toHymn.r4` and Procession–Grim Oath, both landing on Grim Oath's side, and
neither is walked at any budget. Warcry-totem's warcries do climb past 120 (12.8 → 17.8 units at 160), but through War
Drums and the Vanguard's own warcry smalls, not here; Battle Hymn (3.2 units at 17 to 18 steps from both starts) is in
no gave-up list. The cut also left Stagger (`wall.rampart.stagger.n`) a one-door pocket, which is allowed (§3.6).

**Which constraints:** §3.7 (each crossing for a combination a build wants; two parallel crossings for warcries and
auras in one corner are one combination laid twice, and nobody takes it); §7.3 (`toHymn.r1`–`r4` and `rim.a`: 5 road
nodes with Hot Iron the only thing walked off them).

**Proposed fix** (pick one; the second keeps the border count):

1. **Cut Procession–Grim Oath** (`cathedral.rim.procession.c`–`wall.maces.oath.n`). Procession becomes Censer's far tip,
   Grim Oath keeps `oath.a` (to `toHymn.r4`) and `rim.a`; Battle Hymn is the corner's one crossing. Zealot–Vanguard goes
   8 → 7.
2. **Keep both, but give the corner a combination someone takes:** that is a re-line (the specializations auditor's).
   Aura-brand weighs auras and gives up Benediction and Warm Blood; nothing here is near its path.

Re-measure after the archetype gap is filled (Procession's movement is barely weighed). If the corner is still unwalked,
option 1.

**Must not break:** §3.5 (Grim Oath, Procession and Battle Hymn each keep at least one way in, Grim Oath two); §9.1 (no
keystone spur nearby).

### 5. Seam 1, Clean Break: a crossing nobody walks (should fix, after the archetype gap)

**Where:** `yard.blood.cleanBreak.*` between Festering and Pitch Arrows; the border link `cleanBreak.b`–`bow.steel.pitch.n`.

**What is wrong.** The other four seams are walked: Hare's Pace by seven archetypes at 80 to 120 (both sides), Twofold Guard
by mace-shield at 60 (and in block-caster's 60-point gave-up list), Needlework by trap-mine at 100 (dagger-crit's 120
gave-up list), Bright Omen by caster-life at 120 and dagger-caster at 160. **Clean Break is in one plan, bow-poison's at
160, and in no gave-up list.** The fix brief chose it as "wanted on both sides"; on the Reaver side that fails, because
the Reaver archetypes weigh weapon crit multiplier, not the generic line on its smalls. §3.7: a crossing placed for a
combination nobody takes.

**Proposed fix.** Do not re-line the smalls only so the allocator bites (§14). First add a crit Reaver archetype (the
fix brief's §3 item 6 family) and re-measure. If a sword or axe crit build still passes it by, then the Reaver fixer's
own fallback (its smalls to `physAttack(10)`, the notable's lead) is the change, checked by the discipline auditor
(§8.2: the section stays one stat).

### 6. Near the homes, the borders are still porous; the fix is supply, not links (should fix, mostly outside this subset)

**Measured.** 50 notables are nearer a neighbour's start than their own (round 1: 49): Mystic 20 (11 toward the Shade, 9
toward the Zealot), Reaver 13 toward the Strider, Vanguard 11 (9 Reaver, 2 Zealot), Shade 6 toward the Strider. At 60
points, plan composition (nodes in own region / in the neighbour's):

| archetype                                          | round 1            | now                                          |
| -------------------------------------------------- | ------------------ | -------------------------------------------- |
| mace-shield, sceptre-fire, spell-totem             | neighbour-majority | **home-majority** (39/18, 44/17, 42/19)      |
| fire-burn, staff-block, block-caster, storm-caster | Mystic-majority    | still (23/38, 22/39, 26/35, 11/50)           |
| summoner (Mystic)                                  | home               | **now Zealot-majority** (29/32)              |
| dual-wield, dagger-crit, claw-poison, dodge-blades | Strider-majority   | still, narrowly (29/32, 24/28, 25/30, 28/31) |

**Trials (both rejected as fixes):**

- **Cut the Hymn crossing** (`cathedral.home.hymn.b`–`spire.well.toCathedral.b`): Mystic notables nearer the Zealot fall 9 →
  5 and the Zealot casters come home at 60 (staff-block 61 home / 0 Mystic, storm-caster 32/29, fire-burn 38/23), and
  their strength shortfall at 60 shrinks. But storm-caster's 60-point choice falls 3 → 1, spell-totem's 6 → 3,
  block-caster's 120 choice 3 → 2. Hymn is now the Zealot caster's own first spell notable and its one-node bridge into
  the Mystic is what makes Wandwork 7 steps from the Zealot.
- **Cut Footwork's link to the Strider hub** (`yard.dual.footwork.c`–`bow.steel.hub.t`, the user's U4): Footwork is still
  every dexterity build's first stop at 60 (six of them), but the cut narrows the bows (bow-poison 60 choice 2 → 1 and
  120 5 → 3, bow-crit 3 → 2) and does not bring the Shade attackers home (dagger-crit 29 Strider / 24 Shade). The cause
  is four evasion notables 5 to 7 steps from the Strider start (Wayfarer 5, Twin Fangs 6, Weaving 6, Footwork 7), all
  taken at 60 by every dexterity build.

**Proposed:** no link change here. For the specializations, starts and trade-offs auditors: the Zealot caster's own
spell supply between the Crypt and Hymn (its 60-point plans still leave for Wandwork, Draught, Quiet Pulse, Living Verse),
and the Ford corner's evasion (U4: re-partner Footwork away from evasion, as the user asked to decide this round; Quick
Wrists did not re-home the Shade attackers). Must not break §3.3 (mixing is wanted) and §6.2.

### 7. Attribute supply against gear: unchanged, deferred to G5 (should fix, in G5)

At 120 points, plan attributes without the class's own: Strider builds 245 to 263 dexterity against 180 (with the class's
32, 1.5 to 1.6 times); Vanguard 213 to 290 strength against 120 to 180 (warcry-totem 262 against 120); Mystic 206 to 262
intelligence against 120 to 150 (summoner 262 against 120; the curser 285 against 140). Hybrids walking a pure neighbour
are **short at 60** (the allocator now pays for gear, so this is real): staff-block strength 48, storm-caster 40,
block-caster 28 (and intelligence 12), fire-burn 22; dagger-crit intelligence 46, claw-poison 35, dodge-blades 7. At 120
only storm-caster is short (4). §7.4's "a hybrid gets both attributes along every natural path" fails at 60 exactly where
finding 6's geography sends a hybrid through a pure neighbour. Proposed (G5, as round 1): pure road nodes +7 → +5, hybrid
roads kept; the 60-point hybrid shortfall is finding 6's, not a value problem. Must not break §7.4's "heaviest weapon
requirement without crossings" (mace-slam is at 213 against 180 today; check it after the change).

### 8. Unwalked near crossings and bare runs (consider)

- **The Spoils road** (`knife.home.spoils.b`–`spire.craft.toKnife.b`, through the bare `toKnife.a/b`): walked by no plan,
  two rounds running; Spoils itself is in no plan. Cutting the link (trial) takes Mystic notables nearer the Shade from 11
  to 9 and changes no plan. On the most porous Mystic flank (finding 6) one fewer near link is the right direction;
  Mystic–Shade would go 8 → 7. Wait for the archetype gap first (mana sustain is lightly weighed).
- **Bare runs nobody walks inside the Mystic:** `spire.column.roadW.a/b`, `spire.fire.roadS.a/b`, `spire.craft.toFlashpoint.r1`,
  `spire.craft.toVolley.r1`. Each joins two walked places; leave unless a layout pass touches them.
- **The Lychway elbow** `cathedral.walk.road.n1` (104° bend, nothing off it, unused) and `n2`: left by the fixer (L10).
  `spire.rim.road.r2` and `knife.rim.wall.s3` (Sleet and Whetted Will, both bridges onto the Seawall, are unused) are the
  rim roads' only other unwalked road nodes.

### 9. Dead ends created by fix pass 1 (consider)

- **Clear Head** (`bow.home.clearHead.*`): a one-door pocket at 6 steps since S-7, in no plan. Allowed (§3.6); if it should
  be wanted, the second door belongs to the starts auditor.
- **Stagger** (`wall.rampart.stagger.n`): one door since Z-6; allowed.
- **Litany's cold spoke** (`cathedral.nave.star.w`): a single resistance small that now lands nowhere, the one star point
  that leads nowhere (§11.5 a star's spokes land somewhere). Either remove it (the star keeps three spokes) or give it a
  road node; removal is simpler.

### 10. The ring and the centre's arches (consider; unchanged)

16 of 24 ring road nodes and 7 of 12 ring links are in no plan; Quick March, Provisions, Firm Footing, Hard Living and Sound
Body are in none, even with flasks and stun now weighed. The ring is walked as a crossing by dual-wield (Reaver to
Vanguard, `r13`–`r15`) and by caster-life and the channeller (Zealot to Mystic, `r21`–`r23`). It is the generic layer
(§4.7), redundant as a crossing with the near links; not a reason to add or cut links. The user's call if the arches
should sell something archetypes weigh.

---

## 2. What is good (keep it when fixing)

- **Geometry:** 0 crossings, 0 nodes drawn over, bends 83 → 82.
- **Highways are plain:** all 339 road nodes are attributes only (+7 pure, +6/+6 hybrid, the twelve hubs +20 and
  +15/+15). No run of bare road is longer than two nodes (9 runs of two, 81 single).
- **Rim roads are no longer combs:** rim dead ends fell from 16 to 8 (Brazier, Vespers, Rat Bite, Telling Shot, Shaped
  Charge, Bad Company, Thrown Voice, and Ritual Blade on the ridge), all deliberate far tips; network-wide dead-end
  pockets fell from 48 to 38. The arcs (Wake, Buttress, Rood Screen, Glint, Long Grudge, Ceaseless Blades, Marked Prey,
  Killing Eye, Live Wire) are bridges. The Seawall, the Eaves, the Churchyard and the Lychway are walked: their unused
  road nodes are now `knife.rim.wall.s3`, `spire.rim.road.r2`, `cathedral.walk.road.n1/n2` and nothing on the Churchyard.
- **A network:** cycles per region Mystic 52, Reaver 43, Vanguard 43, Shade 38, Zealot 30, Strider 28, centre 17; mean
  degree 2.33 to 2.52; every area has three or more links out; all 27 keystone spurs are dead ends.
- **Borders:** 49 links (Mystic–Shade 8, Mystic–Zealot 7 on purpose, Zealot–Vanguard 8, Vanguard–Reaver 9, Reaver–Strider
  8, Strider–Shade 9), each seam one designed cluster. **Hare's Pace is the model seam:** seven archetypes from both
  sides walk it at 80 to 120, it made Hair Trigger a bridge and the trap fork a loop with the rim highway, and the
  rim highway `j1`–`s6` now carries six builds.
- **Mace-shield, sceptre-fire and spell-totem now spend their first 60 points at home.**
- **The Strider's middle outer road works:** Kill Shot, Hot Pursuit, Tall Grass, Telling Shot and Hardy Stock are taken
  by bow-crit and bow-elemental from 100 to 160.

## 3. Round 1 follow-up

| round 1                             | status    | one line                                                                                                                   |
| ----------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------- |
| 1 south-east band (must)            | partly    | 46 → 34 unused nodes; Bright Shafts in; `m56b`–`j8`, the Fosse east and Stormstruck's crossing still unwalked (F1).        |
| 2 five seam clusters (must)         | fixed     | laid, 49 border links; four of five walked, Clean Break not (F5).                                                          |
| 3 rim combs (should)                | fixed     | rim dead ends 16 → 8, all deliberate tips.                                                                                 |
| 4 porous near-home borders (should) | partly    | three archetypes came home; four Zealot casters and four dexterity attackers did not; 50 notables nearer a neighbour (F6). |
| 5 attribute supply (should, G5)     | not (G5)  | unchanged; hybrids short at 60 (F7).                                                                                       |
| 6 Zealot–Vanguard corner (consider) | partly    | Stagger leg cut, Battle Hymn a bridge; the corner still has two unwalked crossings (F4).                                   |
| 7 High Veil / Cold Light (consider) | reverse   | re-tested: the loop now widens choice; make it (F3).                                                                       |
| 8 Longbow / Fleet Blade (consider)  | kept      | still a one-entry weapon fork at 4 steps; fine.                                                                            |
| 9 ring unwalked (consider)          | unchanged | F10.                                                                                                                       |
| 10 junction smalls (consider)       | not       | untouched as allowed; 65 smalls join two or more clusters, most of them entrances or start nodes.                          |

## 4. Checklist of the CONSTRAINTS items in this subset

| item                                             | verdict                                                                                                                                            |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| §3.1 a network, not a tree                       | holds                                                                                                                                              |
| §3.2 connect generously                          | holds; near the homes more than enough (F6)                                                                                                        |
| §3.3 mix regions by paying for highways          | holds; over-holds at 60 for seven archetypes (F6)                                                                                                  |
| §3.4 clusters may connect directly               | holds                                                                                                                                              |
| §3.5 several ways in                             | holds with exceptions: High Veil and Cold Light (F3, should go), Longbow and Fleet Blade (kept)                                                    |
| §3.6 most pockets are bridges                    | holds (38 dead-end pockets of about 270 clusters; rim fixed)                                                                                       |
| §3.7 crossings with intent, not too few or many  | holds for count and intent; fails in use for Clean Break, Stormstruck–`j8`, the Spoils road, Battle Hymn and Procession–Grim Oath (F1, F4, F5, F8) |
| §3.8 kinds of crossing                           | holds; the ring is walked by three builds, the dear crossings by the rim highway and Hare's Pace                                                   |
| §7.1 highways plain and readable                 | holds                                                                                                                                              |
| §7.2 most clusters off attribute roads           | holds                                                                                                                                              |
| §7.3 no long road without clusters coming off it | holds in form; fails in use for the south band (F1), the Pits lattice (F2, also in form) and the west corner (F4)                                  |
| §7.4 attribute values against gear               | fails: pure classes oversupplied, hybrids short at 60 (F7, G5)                                                                                     |
| §7.5 gear requirements stay                      | holds                                                                                                                                              |

No new rules are proposed. Nothing here felt like losing intent; the one place a number could lead is finding 1, and
its proposal puts the missing archetypes first so that a cluster is judged by a player who wants it, not moved for the
allocator.
