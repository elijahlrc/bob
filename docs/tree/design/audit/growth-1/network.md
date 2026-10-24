# G4 audit round 1: the network

Audited 2026-10-22 on the network as committed (3b2affe: 1,389 live nodes, 274 notables, 27 keystones, 340 road
nodes). Read-only: nothing in `src/`, `scripts/` or the plan docs changed. This audit covers CONSTRAINTS §3 (loops, ways
in, dead ends, crossings) and §7 (highways, roads against filler, attribute supply), with the whole of CONSTRAINTS at
hand. It includes the coordinator's note of 2026-10-22: the user decided that G4 adds about five **seam clusters** as
crossings, and decided against a Festering–Pitch Arrows link. Finding 2 proposes each seam cluster concretely.

**Evidence and tools.** `passives:audit` (0 problems), `geometry.ts --bends` (0 crossings, 0 drawn over, 83 bends, the
same as G3), `passives:supply`, and `passives:builds` over all 28 archetypes (the summary: typical main stat +23% from
120 to 160 points, 1 build with one plan at 120, 11 above a third tax). Scratch scripts in the session scratchpad
(`g4r1-network/`) measured the rest:

- cul-de-sacs: every part of the network that hangs off a single node;
- runs of bare road;
- crossing use: which archetype's plan walks each border link;
- plan composition by region;
- notables that lie nearer a neighbour's start than their own region's start;
- attribute sources per plan.

**Trial runs.** A copy of the allocator with trial links added or cut measured four changes; nothing was written to the
network.

**What "used" means.** "Used" and "unused" mean in the best plan of some archetype at 60, 80, 100, 120, 140 or 160 points.
The archetypes put no weight on movement, stun, flasks or chaos resistance. So for nodes that sell only those lines,
"unused" is a lower bound on interest. Every unused stretch named below sells something some archetype weights at 0.8
or more.

**Pictures** (`network/`): green means taken in a 60-point plan, light green by 120 points, yellow only at 140 to 160,
red by no archetype at any budget. Orange rings mark dead-end parts (keystone spurs left out), and cyan marks border
links.

- `usage-whole.png`: the whole network.
- `usage-southeast.png`: the Strider's south and the Fosse.
- `usage-west.png`: the Zealot's west and its border with the Vanguard.
- `usage-northeast.png`: the Shade's Rooftops, the Seawall and the trap fork.
- `usage-north.png`: the Mystic's rim and the far loop.
- `nw-top-ids.png`: High Veil and Cold Light, with ids.

---

## 1. Findings, most important first

### 1. The south-east outer band is a road nobody walks (must fix)

**Where:**

- **The Strider's outer road south of `bow.rim.road.j4`:** the road nodes `j5`, `m56a`, `m56b`, `j6`, `m67`, `j7`,
  `m78` and `j8`.
- **What hangs off it:**
  - `bow.rim.southSpoke.x/.s`;
  - Bright Shafts (`bow.south.brightShafts.*`) and Live Wire (`bow.south.liveWire.*`);
  - Field Kit's flask side (`fieldKit.f1/f2`).
- **The Fosse's east half (the Reaver's):** `yard.fosse.road.f2`, `f3` and `f4`, Stormstruck, Ceaseless Blades
  (`yard.fosse.flurry.*`) and Marked Prey.
- **Next to it:** the Quiver's Killing Eye–Quick Sip chain.

**What is wrong:**

- **No archetype takes any of these at any budget up to 160 points.** That is about 32 nodes, 13 of them road nodes. The
  only exceptions are Fouled Tips (bow-poison at 140) and Field Kit's evasion side (dual-wield at 120).
- **The Reaver–Strider dear crossing (Stormstruck–`j8`) is walked by no plan.**
- **The road runs 17 to 19 steps out, and what branches off it is either a dead end or bridges back to pockets builds
  already skip.** The road's dead ends are Bright Shafts and Live Wire at 23, and Ceaseless Blades and Marked Prey.
- **By §7.3's test** ("what the player can branch to along it"), it is a stretch with nothing anyone branches to. That
  is the filler of §14 and the "tension by distance" risk of G-growth §4.

**It is not just a matter of distance.**

- The elemental bow wants exactly what is here. Its weights put elemental attacks at 0.9 to 1, and its elemental attack
  damage is **flat at 10 units from 120 to 160 points**, so it already runs out.
- Even with 40 spare points, it never reaches Bright Shafts or Live Wire.
- A trial with a free link from Sentry Post to `j7` (`bow.steel.sentryPost.n`–`bow.rim.road.j7`) put `j7` at about 12
  steps and Live Wire at about 16. It **changed no plan** of bow-crit, bow-elemental, bow-poison, axe-bleed, dual-wield,
  sword-str or claw-poison.
- So an inner shortcut alone does not make the band wanted. Its clusters sit as dead-end tips at the end of a long road
  that leads nowhere else.

**Proposed fix**, best first. Weigh it with the specializations audit, because it moves supply.

1. **Bring the elemental bow's own supply in, and turn the band into a loop of bridges:**
   - Re-hang Bright Shafts as an arc between `m56a` and `m56b`, and Live Wire between `m67` and `j7`. Both of those
     road nodes are bare today (`m56b` and `j7` have degree 2). These are the pattern Long Chant, Pinpoint and Hardy
     Stock already follow: a pocket between two road nodes.
   - Then move one of the two elemental attack clusters about five steps inward, onto the Quiver's south side. A swap
     with Killing Eye's slot on `bow.quiver.wheel.c2` is one way. The elemental archer then has one cluster it can
     afford and one far cluster it gives up, which is §1.1's trade-off rather than a direction it never sees.
2. **If the band stays this far out, make it shorter.** Cut `m56b` and `j7`, re-home Live Wire as above, and keep the
   outer ring closed through Field Kit (`j6`) and Fouled Tips (`m78`–`j8`).
   - That is 2 fewer road nodes, and no plan changes, since none uses them.
   - The Fosse's tips get the same arc treatment as in finding 3: Ceaseless Blades between `f2` and `f3`, and Marked
     Prey between `f4` and `f5`.

**A fix must not break:**

- §3.5: the band keeps at least two ways in. Field Kit, Fouled Tips and the south spoke stay.
- §5.2: Live Wire stays at least five steps from Stormstruck (eight today).
- §11.5: every arc must be a regular shape facing its road.
- §12.1 (no node placed for a number): each moved cluster needs a player's reason. Here the reason is the elemental
  archer's flat main stat.

### 2. Borders: the count is right to grow, but only at the seams (must fix: the five seam clusters)

**What is there today:** 45 border links (6 to 9 per pair) plus the ring's 12. They sit unevenly:

- **Near the homes, the borders are saturated.** Finding 4 has the numbers. Each candidate for one more link there was
  rejected twice (G2, then `G3/borders.md`) for bringing a neighbour's notables 3 to 5 steps nearer a start.
- **Six links are walked by no archetype at any budget:**
  - the Spoils road (`knife.home.spoils.b`–`spire.craft.toKnife.b`);
  - the storm road (`knife.hex.toSpire.b`–`spire.storm.roadS.a`);
  - the slams junction (`wall.slams.j2.a`–`yard.blades.j1.a`);
  - Stagger (`cathedral.ambulatory.toWall.d`–`wall.rampart.stagger.n`);
  - the Battle Hymn link (`wall.maces.toHymn.r4`–`cathedral.ambulatory.hymn.b`);
  - Stormstruck–`j8`.
- **Eight of the ring's twelve links are walked by no archetype either.**
- **Meanwhile the far seams are empty.** The gaps of 800 to 1,000 units that `G3/borders.md` §1 lists are each held by
  "keep apart" ends.

**The user's decision:** a seam cluster on each of five seams, each a combination builds from both sides would want.
Each proposal below gives its place, what it pairs, the two nodes it joins, and its geometry. The geometry was checked
with a scratch segment test against today's links:

- every line is clean, with 0 crossings;
- only seam 1 passes within 60 units of a node.

Step counts are estimates for a three-node chain (small, notable, small) between the two ends. The partners suit
specializations the supply map shows as thin. **The specializations auditor should confirm each partner** (§5.1, §5.2,
§5.5).

| seam                                                           | joins                                                                                                                                             | place (tree units)                                                                                                   | pairs                                                                                                                                                                                                                                                                                           | steps from the two starts                                                                  | notes for a fix                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Reaver–Strider** (Festering to Pitch Arrows)              | `yard.blood.festering.n` – seam – `bow.steel.pitch.n` (462 units, clean)                                                                          | notable about (1020,3240), one small toward each end                                                                 | **axe damage with attack crit chance**, the G1 brief's reserve "third axe cluster". Axes are strength and dexterity, the two attributes this border supplies. There are only 2 axe clusters today (Hewing, Cleaver), and axe-bleed's axe damage is flat.                                        | Strider about 14 (Pitch Arrows is 12), Reaver about 18 (Festering is 16)                   | The line passes **55 units from Crimson Pact's keystone** (925,3262). Pull the keystone about 100 units back along its spur toward `yard.blood.j2.a`; a keystone spur is a dead end and may move. Festering becomes a bridge again. Festering to Fouled Tips goes from 12 to about 6 steps, with an axe notable and Pitch Arrows' fire between: still at least 5, but say it to the specializations auditor. This is not the rejected Festering–Pitch Arrows link: it is a cluster of a third kind.                                                                                                                                                                                                                                                                                                                                                       |
| **2. Mystic–Zealot** (between the crypt road and the far loop) | `spire.fire.cinder.n` – seam – `cathedral.crypt.rite.n` (413 units, clean)                                                                        | notable about (-1360,-3700)                                                                                          | **staff damage with maximum mana**: a third staff cluster (only Quarterstaff and Crozier today, 10 apart, both deep in the Zealot). Staves are the caster weapon that strength and intelligence supply, so a Mystic caster with a staff walks west for it and a Zealot staff caster finds mana. | Zealot about 21, Mystic about 23                                                           | **Not spell damage, not energy shield:** this corner already holds Cinder, Shattering Rite, Plainsong, Tomb Dust and Cold Light, all spell notables, and finding 4 shows the Zealot's casters already living on the Mystic's west. Cinder to Shattering Rite drops from 8 to 4 steps with the staff notable between. `G3/borders.md` §2.6 rejected Cinder–Plainsong for pulling this corner together. Here a notable of another kind sits between (§5.5's fair price), Measured worst case, a bare trial link `cinder.n`–`rite.n` (no notable between): fire-burn's choice at 60 fell 3 to 2 but rose 7 to 8 at 120, with tax 38% to 34%; caster-life's choice at 120 fell 6 to 4; storm-caster's at 60 rose 4 to 5; the channeller was unchanged. Nothing collapses, so the cluster (one more step each way) should do less. Re-measure once it is laid. |
| **3. Mystic–Shade** (around Pinpoint and Black Powder)         | `spire.rim.pinpoint.n` – seam – `knife.hex.powder.n` (492 units, clean)                                                                           | notable about (1560,-3800), between Pain Conduit's keystone (1390,-3638) and Bad Company (1843,-3788), clear of both | **chaos spell damage with cast speed**: the int-dex caster's spell. Chaos has 3 clusters plus Rotting Word and Tomb Dust's chaos lines; the dagger caster and the curser both cross this border already.                                                                                        | Shade about 20 (by Black Powder, 18), Mystic about 22 (by the storm road and Black Powder) | Pinpoint gets no cheaper from the Shade (22 either way), so this pulls nothing near a start. Not curses: Bad Company (minions with curses) is 3 to 4 steps away. Check Rotting Word's distance (§5.2).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **4. Strider–Shade** (by the trap and mine fork)               | `bow.rim.hairTrigger.n` – seam – `knife.rim.wall.s6` (423 units, clean)                                                                           | notable about (4150,60)                                                                                              | **claw damage with crit chance**, the G1 brief's reserve "crit claw cluster". Claws are dexterity and intelligence; both regions supply dexterity, and the claw already has a Strider-border home (the fast claw rung). claw-poison's claw damage is flat (8 → 8 from 120 to 140).              | Strider about 20 (by the fork), Shade about 24 (by `s6` at 22)                             | Hair Trigger becomes a bridge and the fork stops being two dead ends: the rim highway (`j1`–`s6`) and the fork make a loop. **Geography stays:** the Shade's start reaches its own east rim only at about 20, so no seam here gives the Shade's trapper a cheap late trap direction (`G3/borders.md` §2.2). That needs a Shade trap cluster nearer the Docks, not a crossing. A claw notable 2 steps from Hair Trigger shares crit with it; claw and traps are different builds.                                                                                                                                                                                                                                                                                                                                                                          |
| **5. Zealot–Vanguard** (Idle Hands and Graven Posts)           | `wall.resists.posts.n` – seam – `cathedral.rods.warding.n` (392 units straight north, clean: the line the G3 border pass tested with a bare node) | notable about (-2750,-110), smalls at about (-2745,10) and (-2757,-200)                                              | **area damage with area of effect**: the second area cluster in the network (Ground Shaker is the only one). Slams (the mace slam build) and the Zealot's area spells and totems both want it.                                                                                                  | Zealot about 14 (Warding Staff is 12), Vanguard about 15 (Graven Posts is 13)              | **This is the fix for the trial the G3 border pass rejected.** A bare node there brought Graven Posts 16 → 14 from the Zealot and handed the spell totem its totems 20 points sooner. With a three-node cluster between, Graven Posts stays 16 from the Zealot and Warding Staff stays 13 from the Vanguard. The seam's own notable is the only new thing near both starts, in the middle distance G1 asked for (10 to 16). Watch spell-totem: Graven Posts (totems) and the area notable would sit 2 steps apart, both wanted. If the allocator shows a totem corner, pair it instead with armour and mana regeneration (a generic both sides lack there).                                                                                                                                                                                               |

**After the seams:** Mystic–Shade 8, Mystic–Zealot 7, Zealot–Vanguard 9, Vanguard–Reaver 9, Reaver–Strider 8,
Strider–Shade 9. That is 50 links, inside the user's 8 to 10 for all but Mystic–Zealot.

- **Mystic–Zealot stays at 7 on purpose.** It is the most porous border by every measure (finding 4). A second seam
  there would make it worse.
- **Re-aim unused links into seams rather than adding beside them.** The Stagger crossing (`cathedral.ambulatory.toWall.c`
  → `toWall.d` → Stagger) runs on two bare road nodes. It sits 300 units from the Battle Hymn link and 700 from
  Procession–Grim Oath: three crossings in one corner, two of them unused. If seam 5 lands, cutting the Stagger leg
  keeps Zealot–Vanguard at 8 and frees the corner (finding 6).

**A fix must not break:**

- §9.1: no keystone spur becomes a through-route. Idle Hands, Crimson Pact and Pain Conduit are only neighbours here.
- §6: no seam is within about 12 steps of a start.
- §11.2: zero crossings.
- §5.2: twins stay at least five steps apart.

### 3. The new rim roads are combs of dead ends (should fix)

**Where:** the rim roads that G2 and G3 added.

- **Network-wide, most pockets are bridges.** There are 48 dead-end pockets against about 260 clusters with notables,
  and every region keeps a majority of bridges.
- **The rim roads are the exception.** Of about 33 notables hanging from the six rim roads, **16 are dead ends**:
  - **The Churchyard (`cathedral.rim`):** Wake off `walk.o2`, Buttress off `o3`, Brazier off `o4`. Three of its four
    clusters.
  - **The Lychway (`cathedral.walk`):** Rood Screen off `road.n3`, Vespers off `n4`.
  - **The Seawall (`knife.rim`):** Glint off `wall.s1`, Long Grudge off `s2`, Rat Bite off `s5`.
  - **The Eaves (`spire.rim`):** Bad Company off `road.r5`.
  - **The Fosse (`yard.fosse`):** Ceaseless Blades off `road.f3`, Marked Prey off `f5`.
  - **The Strider's outer road:** Bright Shafts, Live Wire, Telling Shot, Hair Trigger and Shaped Charge.
- **Together these are the shape PHILOSOPHY §1 calls "a tree again":** long strands with rooms hanging off them. They are
  also where the use map is reddest.
  - The road between the hanging pockets is often bare: `m56b`, `j7`, `o1`, the Lychway's `n1` and `n2`, the Eaves' `r2`
    and `r3`, and the Fosse's `f2` to `f4`.
  - Many of those bare nodes are unused as well.

**Which constraints:**

- §3.6: most pockets are bridges, and dead ends are fine "just not too many".
- §13.5.
- §3.1: a network, not a tree.

**Proposed fix: hang rim pockets as arcs between two road nodes,** the way Long Chant (`r1`–`r2`), Pinpoint, Hardy Stock
and Kill Shot already do. This makes a pocket a bridge with no change in reach, gives the bare road node a branch, and
needs no new crossing. Concretely:

- **Churchyard:**
  - Wake between `o1` and `o2` (`o1` is bare today).
  - Buttress between `o2` and `o3`.
  - Brazier stays the one far tip.
  - Or Wake bridges to the Ambulatory: `cathedral.rim.wake.n` to `cathedral.ambulatory.tithe.c` is 674 units and clean,
    and needs one strength-and-intelligence road node.
- **Lychway:**
  - Rood Screen between `n2` and `n3`, so the bare run `n1`–`n2` gets a branch.
  - Vespers stays the far tip.
  - Not to Tomb Dust: `vespers.n` to `tomb.n` is clean, but it would put two spell notables 2 to 3 steps apart (§5.5).
  - Not to the Ambulatory's `walk.w7`: the line crosses Sigil Warden's spur.
- **Seawall:**
  - Glint as a bridge to `knife.roofs.walk.r4` (602 units, clean). `r4` is the bare road node the G3 Shade report flagged
    as having nothing off it.
  - Long Grudge between `s2` and `s3`.
  - Rat Bite stays the far tip.
- **Fosse:** Ceaseless Blades between `f2` and `f3`, and Marked Prey between `f4` and `f5`.
  - The other choice is joining the two tips through one road node into an outer loop (`flurry.n`–`marked.n` is 677
    units, clean).
- **Strider:**
  - Bright Shafts and Live Wire as in finding 1.
  - Hair Trigger by seam 4.
  - Telling Shot and Shaped Charge stay far tips.

**Result:** about 8 rim dead ends instead of 16, all of them deliberate far tips.

**A fix must not break:**

- §11.5: arcs are regular, face their road, and stay tight round their notable.
- §8.2: each arc's smalls stay one stat.
- §5.5: no arc may put two of one build's wants side by side. Check Long Grudge and Ill Wish.
- §9.1: keystone spurs stay dead ends.

### 4. Near the homes, the borders are porous (should fix, mostly outside this subset)

**What the measures show:**

- **49 notables lie nearer to a neighbour's start than to their own region's.**
  - **The Mystic:** 20 of them, 10 toward the Zealot and 10 toward the Shade. Examples:
    - Wandwork: 7 steps from the Zealot start, 10 from the Mystic's.
    - Draught: 9 against 13.
    - Flashes of Insight: 8 from the Shade start against 12.
    - Living Verse: 18 against 20.
    - Familiars: 16 against 18.
  - **The Reaver:** 12 nearer the Strider. Footwork is 7 against 12, Sidestep 7 against 9, Twin Fangs 6 against 7.
  - **The Vanguard:** 9 nearer the Reaver and 2 nearer the Zealot.
  - **The Shade:** 6 nearer the Strider.
- **The allocator agrees.** At 60 points, 9 of the 28 archetypes take more nodes in a neighbour's region than in their
  own:

  | archetype    | home     | home nodes at 60 | neighbour's nodes at 60 |
  | ------------ | -------- | ---------------: | ----------------------- |
  | spell-totem  | Zealot   |               30 | 31 Mystic               |
  | fire-burn    | Zealot   |               27 | 34 Mystic               |
  | block-caster | Zealot   |               29 | 32 Mystic               |
  | storm-caster | Zealot   |               28 | 33 Mystic               |
  | mace-shield  | Vanguard |               18 | 43 Reaver               |
  | sceptre-fire | Zealot   |               28 | 33 Vanguard             |
  | dual-wield   | Reaver   |               29 | 32 Strider              |
  | dagger-crit  | Shade    |               21 | 31 Strider              |
  | claw-poison  | Shade    |               23 | 30 Strider              |
  - At 120 points, storm-caster has 81 Mystic nodes against 20 of its own.

- **The busiest crossings:**
  - `cathedral.crypt.toSpire.b`, with Living Verse and Familiars both on it: 11 archetypes, most at 60 points.
  - `bow.steel.added.n409`–`yard.dual.j2.a`: 8.
  - `bow.bows.toKnife.a`–`knife.home.softStep.b`: 7.
  - Footwork's link: 6, five of them at 60 points.

**Why it matters for this subset:**

- **§3.7:** "it must not be so connected that ... it loses its trade-offs". Mixing at 120 points is what the user asked
  for (§3.3). A region whose own builds spend most of their first 60 points next door does not give its builds its own
  decisions.
- **§7.4:** "a hybrid gets both attributes along every natural path". The Zealot casters' natural path is the Mystic's
  intelligence roads. At 120 points they carry 28 to 64 strength against gear that asks 100 (fire-burn 28, storm-caster
  43, block-caster and spell-totem 64; the class adds 23).

**It is not a one-link fix (measured):**

- **Cutting Familiars' crossing** (`cathedral.crypt.toSpire.b`–`spire.fire.familiars.n`):
  - The Zealot casters' plans barely moved.
  - Block-caster's choice at 120 went 1 → 2, but the life caster's spell crit went flat.
- **Cutting the Hymn link** (`cathedral.home.hymn.b`–`spire.well.toCathedral.b`):
  - It halves the Mystic notables nearer the Zealot (10 → 5; Wandwork 7 → 12).
  - It changed plans little. Storm-caster moved most (5 fewer road nodes at 120 and 33 less intelligence, Homily off its gave-up list); its choice at 60 fell 4 to 3, and the channeller's at 120 fell 7 to 5.
- So the cause is the supply. The Mystic's west and east flanks sell what the neighbours' casters want, at their
  neighbours' distance.

**Proposed:**

- **No new near-home links on any border.** The seams in finding 2 are the growth.
- **For the specializations auditor:**
  - Give the Zealot's casters spell supply on the Zealot's own side of the Crypt, so the 60-point plan has a home
    choice. Today their nearest spell notables are Homily, Glass Wall and Tomb Dust, against the Mystic's Living Verse,
    Wandwork and Quiet Pulse.
  - Re-check Wandwork and Draught, which sit as the Zealot's notables in practice.
- **Footwork** (7 steps from the Strider's start) stays with the user's open question in `G3/borders.md` §6.3. This
  audit adds that it is the most-used single border notable at 60 points.
- **Must not break:**
  - §3.3, which asks for mixing.
  - §6.2, the start's first points.
  - §3.5: no cut may leave the Mystic's west with one way in.

### 5. Attribute supply against gear: still oversupplied for the pure classes, short for the Zealot's casters (should fix, in G5)

**At 120 points (plan attributes, class base not included):**

| who                          | supplies                          | gear asks                             | ratio                                       |
| ---------------------------- | --------------------------------- | ------------------------------------- | ------------------------------------------- |
| Strider builds (dexterity)   | 269 to 293                        | 180                                   | 1.5 to 1.6 (1.7 to 1.8 with the class's 32) |
| Vanguard builds (strength)   | 248 to 301                        | 120 to 180 (warcry-totem: 258 vs 120) | 1.4 to 2.1                                  |
| Mystic builds (intelligence) | 196 to 246                        | 120 to 150 (summoner: 242 vs 120)     | 1.3 to 2.0                                  |
| Zealot casters (strength)    | 28 to 64, plus a class base of 23 | 100                                   | under                                       |
| sceptre-fire (intelligence)  | 88                                | 100                                   | under                                       |

- About two thirds of a plan's main attribute comes from road nodes.
- Hubs add 20 to 70.
- Notables with attribute lines add up to 85. In the Strider's 120-point plans, 70 to 85 dexterity comes from notables.

**Why it matters beyond gear:** each attribute point is real power.

- Strength: 0.5 life and 0.2% melee physical damage.
- Dexterity: 0.2% evasion.
- Intelligence: 0.5 mana and 0.2% energy shield.
- So 300 dexterity is +60% evasion the allocator counts as "tax". That is G-growth §4's "strength by the back door".

**Proposed for G5** (§7.4 and §16 put attribute values there):

- Pure road nodes from +7 to +5. A 120-point plan loses about 40, so the Strider's best plan lands near 240 plus 32.
- Keep +6/+6 on hybrid roads, since the hybrids are not over.
- Look again at attribute lines on notables (Hedge Magic, Heavy Draw and the Strider's others).
- The Zealot's strength shortfall is finding 4's problem, not a value problem: raising hybrid roads would add more to
  every hybrid that is already fine.

**Must not break:** §7.4's "a late build should meet the heaviest requirement of its weapon without crossings". Check
mace-slam, two-hand-fire and the bows against 180 after the change.

### 6. A corner with three crossings, two unused, on bare roads (consider)

**Where:** the Zealot–Vanguard south-west corner.

- The Stagger crossing: `cathedral.ambulatory.toWall.c` → `toWall.d` (both bare) → Stagger.
- The Battle Hymn link: `wall.maces.toHymn.r4`–`cathedral.ambulatory.hymn.b`, at the end of a four-node road. Of that
  road, `toHymn.r1` and `r3` are bare.
- Procession–Grim Oath.

**What is wrong:**

- Three crossings sit within 700 units of each other.
- Tithe, Battle Hymn, Stagger, the whole Hymn road and `toWall.c`/`d` are used by no archetype (`usage-west.png`).
- §3.7 asks that each crossing be placed for a combination. Two parallel crossings 300 units apart on bare roads for
  warcries are one combination laid twice.

**Proposed:**

- With seam 5, cut the Stagger leg (`toWall.c` and `toWall.d`, 2 nodes, and their link to Stagger).
- Hang Battle Hymn as an arc between `toWall.b` and `toHymn.r4`, so it is the corner's one crossing and a bridge, not a
  dead end.
- Battle Hymn and War Drums are 23 apart, and warcries are flat for warcry-totem (0 → 7), so the corner then has a reason
  for that build to come.

**Must not break:** §3.5. Stagger keeps `stagger.a`'s three other links.

### 7. High Veil and Cold Light: a cul-de-sac of two clusters at the rim (consider; keep as a named exception)

**Where:** `spire.fire.rim.a/b`, Cold Light and High Veil all hang off `spire.fire.rim.c` (size 10, 23 to 28 steps out;
`nw-top-ids.png`). Apart from Longbow and Fleet Blade (finding 8), this is the network's only part of more than one
pocket with a single way in.

**Constraint:** §3.5 says only keystone spurs and single pockets are cul-de-sacs.

**Measured:**

- It is popular: 8 archetypes take High Veil, several from 60 to 80 points.
- The obvious bridge, Steady Stream's pocket on to High Veil (`spire.frost.stream.n`–`spire.frost.highVeil.c`), was
  trialled:
  - caster-es choice at 120 fell 7 → 5 and its tax fell 36% → 33%;
  - the channeller's choice at 120 fell 7 → 5;
  - wand-attack's choice at 60 fell 3 → 2;
  - spell damage got hungrier (42 → 47.5 units at 160).
- So making it a loop narrows three builds' choices.

**Proposed:** keep it, recorded as an exception to §3.5 (the Mystic report's round-3 call), and re-test after the seam
clusters land.

### 8. Longbow and Fleet Blade: a single-entry fork four steps from the Strider start (consider)

**Where:** `bow.bows.wheel.*` hangs off `bow.bows.hub.b`. The entrance small `wheel.e` splits into the bow side and the
sword side, and both tips are dead ends.

**Why it is acceptable:**

- It is one pocket with a real weapon choice (§8.3), and three bow builds take Longbow at 60 points.
- The reference's starts have pockets of three that dead-end off hubs (PHILOSOPHY §2).

**Proposed:** no change. Note it as the second named exception.

### 9. The ring and its arches are walked by no build (consider; a measuring caveat first)

**What the measures show:**

- 8 of the 12 ring links and 17 of the 24 ring road nodes are in no plan.
- No archetype uses the ring to go from its home to a neighbour's, because the near crossings are cheaper.
- Six of the eight arches are taken by none: Quick March, Well Rounded, Provisions, Firm Footing, Hard Living and Sound
  Body. They are 4 to 6 steps from two starts and sell movement, stun, flasks, chaos resistance, all attributes, and life
  on hit or kill. The archetypes weigh none of these lines.

**Proposed:**

- Before judging the centre, give the archetypes small weights for the generic lines every build wants (resistances,
  movement, flasks, stun), as tooling, not as design.
- As a crossing kind (§3.8), the ring is redundant with the near crossings. That is acceptable, since it is the generic
  layer (§4.7), not a reason to add links.

### 10. Stat smalls doing a junction's job (consider)

**What is wrong:** about a dozen small nodes are the three-way junction between clusters where an attribute node would
read as a road (§7.2). Examples:

- `wall.slams.thunderstep.b` (Bracing, Unhurried and the Yard link);
- `wall.maces.crushing.a` (toStagger, toHymn, Locked Shields);
- `wall.rampart.stagger.a` (four links);
- `spire.column.broadWeave.a`;
- `knife.snares.quietShot.a`;
- `spire.craft.mistWalk.a`.

**Why it is only a consider:** most of the 66 smalls of degree 3 or more are start nodes or a cluster's own entrance,
which is fine. These few are where a player would expect a road. The highways themselves are plain (§7.1 holds).

**Proposed:** when a layout or looks agent touches these spots, turn the junction into a bare attribute node with the
small one step past it.

---

## 2. What is good (keep it when fixing)

- **Highways are plain.** All 340 road nodes carry attributes and nothing else. They are +7 for a pure class and +6/+6
  for a hybrid, with the twelve hubs at +20 and +15/+15. There are no muddled connectors (§7.1, §14).
- **Roads, not filler, by form.** No run of bare road is longer than two nodes anywhere. There are 11 runs of two and
  82 single bare nodes. The filler in this network comes from finding 1's usage, not from long bare corridors (§7.3).
- **A network, not a tree.**
  - Cycles per region: Mystic 52, Vanguard 43, Reaver 41, Shade 36, Strider 29, Zealot 28, centre 17.
  - Mean degree is 2.33 to 2.50.
  - Every area has three or more links out.
  - Only two parts larger than a pocket have a single way in (findings 7 and 8).
  - All 27 keystone spurs are dead ends; none is a through-route (§3.1, §3.5, §9.1).
- **Most pockets are bridges.** Clusters with one link out per region: Vanguard 5 of 46, Reaver 2 of 38, Mystic 4 of
  47, Strider 7 of 37, Shade 7 of 39, Zealot 7 of 34 (§3.6).
- **Every border crossing has a written combination** (G1-brief §2), and the G3 border pass's rejections are sound. Each
  near-home candidate it rejected would have deepened finding 4.
- **The Zealot's west edge is no longer dead.** The Churchyard is in staff-block's and
  sceptre-fire's 120-point plans. The unused far west is now only the Lychway's `n1`–`n2` and the Tithe and Hymn
  corner (finding 6).
- **The Seawall–outer road rim highway** (`knife.rim.wall.s6`–`bow.rim.road.j1`) is walked by three bow builds at 100
  to 140 points. It is the one dear crossing that works.

## 3. Missing rules (proposed wording for CONSTRAINTS)

1. **§3.6, a sentence to add:** "On a rim road, a pocket hangs as an arc between two of the road's nodes, like Long Chant
   or Hardy Stock, unless it is a keystone spur or a deliberate far tip. A rim road whose clusters are mostly dead ends
   is a comb, the tree shape §3.1 rules out." The cause of finding 3 was that each rim road was laid first and its
   clusters hung outward one by one.
2. **§3.7, a sentence to add:** "Where a border's crossings sit matters as much as how many. Near the homes, a crossing is
   judged by what it brings nearer a neighbour's start. A neighbour's notable that is cheaper from your start than from
   its own, within about twelve steps, is a sign that stretch is already open enough. Far out, a seam needs a cluster
   designed for the crossing's combination (a seam cluster), not a bare link." This writes down what G2 and G3 learned
   twice, and the user's decision of 2026-10-22.
3. **§7.3, a test to add:** "A stretch that no archetype takes even with 40 points to spare past 120 is filler in
   practice, whatever hangs off it. Before keeping it, say whose build it is for and why that build cannot reach it."
   This test is not a rule that every node must be used. The archetypes are a yardstick (§14), and generic lines they do
   not weigh are exempt.

## 4. Checklist of the CONSTRAINTS items in this subset

| item                                             | verdict                                                                                                                         |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| §3.1 a network, not a tree                       | holds, with the exception of the rim roads (finding 3)                                                                          |
| §3.2 connect generously                          | holds inside regions; between regions, holds near the homes (too much, finding 4) and fails at the far seams (finding 2)        |
| §3.3 mix regions by paying for highways          | holds; over-holds at 60 points for 9 archetypes (finding 4)                                                                     |
| §3.4 clusters may connect directly               | holds                                                                                                                           |
| §3.5 several ways in                             | holds with exceptions: High Veil and Cold Light (finding 7); Longbow and Fleet Blade (finding 8)                                |
| §3.6 most pockets are bridges                    | holds network-wide; fails on the rim roads (finding 3)                                                                          |
| §3.7 crossings with intent, not too few or many  | holds for intent; fails for distribution: unused links (6) and empty seams (findings 2 and 6)                                   |
| §3.8 kinds of crossing                           | holds; the ring and the dear crossings are almost unwalked (findings 1, 2 and 9)                                                |
| §7.1 highways plain and readable                 | holds (a dozen junction smalls, finding 10)                                                                                     |
| §7.2 most clusters off attribute roads           | holds                                                                                                                           |
| §7.3 no long road without clusters coming off it | holds in form (runs of 2 or fewer); fails in use for the south-east band (finding 1) and the Zealot–Vanguard corner (finding 6) |
| §7.4 attribute values against gear               | fails: oversupplied for the pure classes, under for the Zealot's casters' strength (finding 5)                                  |
| §7.5 gear requirements stay                      | holds (no proposal touches gear)                                                                                                |

Nothing here felt like losing intent. The one place a number could have led was the border count: the proposals in
finding 2 come from the user's decision and each names its builds, and finding 4 argues for fewer near links, not more.
