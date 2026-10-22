# G1b. The Mystic's growth brief (the Spire)

Written 2026-10-22 for phase G1b of [G-growth.md](../G-growth.md), from the ledger's Mystic rows
([G1-ledger.md](../G1-ledger.md) §3.1 MY-1 to MY-10, §3.2 MY-s1 to MY-s6, §3.3 MY-m1, MY-m2, MY-p1), the baseline
([G0-baseline.md](../G0-baseline.md), [G0/builds.txt](../G0/builds.txt), [G0/supply.md](../G0/supply.md)) and the map.
[CONSTRAINTS.md](../CONSTRAINTS.md) wins wherever this brief disagrees with it. No node is written here.

**Pictures** (folder [mystic/](mystic/)):

- `today.png`: the region as it is (`today-text.png` with every node's lines).
- `sketch.png`: the whole region with this brief drawn over it. Orange rings are new clusters, cyan lines new roads
  (open circles are their nodes), green lines new links, yellow discs moved notables, red crosses cut links.
- Close-ups: `sketch-belfry.png` (the top), `sketch-east.png` (the Scriptorium and the Gallery against the Shade),
  `sketch-west.png` (the Cloister and the Undercroft border), `sketch-nw.png` (the Lantern and the north-west rim).
- `sketch.json` is the source; `npm run passives:sketch -- docs/tree/design/G1/mystic/sketch.json out.png`.

Coordinates are tree units; the Mystic start is at (0, −1000), the top of the map (Fever Pitch) at (0, −4620), and the
circle through the farthest node has radius 4,725. "Steps" means nodes bought from the start on the cheapest path,
measured on today's network for existing nodes and estimated for new ones.

Baseline checks of today's region: `geometry.ts --region mystic` gives 0 crossings and 0 nodes drawn over each other;
`passives:audit -- mystic` gives 0 problems, 184 nodes (37 notables, 49 attribute nodes, 5 keystones).

---

## 1. The wants that need competition

### What the curves say

The Mystic is the start of five archetypes (builds.txt). All five run out of their main stats before 120 points:

| archetype           | flat main stats at 120 → 160 points (units)                                       | why, on the map                                                                                                                                                                                                                                        |
| ------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| caster-es (classic) | spell damage 21 → 23, ES 32 → 41 (ES climbs only by walking into the Zealot's ES) | The two wheels at 7 and 8 steps hand it Glass Skin, Warded Mind and Arcane Focus; the Cloister's Glass Skin, Quickening and Siphon are three steps apart. Plain spell damage in the whole Mystic is First Light, Arcane Focus and a line on Familiars. |
| caster-life         | spell damage 20 → 22, spell crit 6.9 → 6.9, life 35 → 39                          | Same spell damage; the Mystic's life is Warm Blood and Quiet Pulse only (9.9 units).                                                                                                                                                                   |
| summoner            | minions 21.5 → 21.5, ES 39 → 40                                                   | Familiars is the Mystic's only minion cluster; ES as above.                                                                                                                                                                                            |
| wand-attack         | wand 7.7 → 7.7, ES 26 → 26                                                        | Deft Wand (6) and Wand Volley (13) are the two wand-attack clusters; both are taken by 60 points.                                                                                                                                                      |
| channeller          | channelling and spell 17 → 19, ES 31 → 34                                         | One channelling notable (Steady Stream), and the spell damage above.                                                                                                                                                                                   |

The dagger caster and the curser (Shade starts) pass through the Mystic's east side for spell damage, spell crit and
Hexwright; both are flat on spell damage (23 → 23) and curses (11 → 11) for the same reasons.

So the Mystic's job is the one the ledger names: **more spell damage and more energy shield, each in several directions
with a different partner, so that taking it all costs the other things**; plus a second minion, two more wand clusters
and more life.

### A fault the ledger left alone: the east wheel

**Arcane Focus (spell damage) and Warded Mind (energy shield) are the two sides of one wheel, 7 and 8 steps from the
start.** That is the convergence the user's caster example names (spell damage with ES), and it is §8.3's rejected
pattern: two notables one build obviously wants both of, on opposite sides of a circle. Taking both costs two smalls.
Glass Skin, the other early ES notable, is also 7 steps out on the west wheel. Today a caster has its first three big
notables of both main stats within 8 steps, from both sides.

The fix (row MY-r1 below): **Warded Mind keeps its place and its chaos resistance and mana, and gives up its energy
shield.** The east wheel then becomes "spell damage or chaos resistance", and early energy shield lies west (Glass Skin)
and in the home (First Light's side node, First Light, Warm Blood). A caster still gets ES early from the home and one
wheel, but the east is now the offence side from its first notable.

### The ledger rows for the Mystic, judged on the map

| row   | ledger                                                                                             | verdict                                          | where and why                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ----- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MY-1  | spell damage + spell crit multi, "the Gallery road beside the Fever Pitch spur"                    | **agree on lead and partner; place differently** | The ledger's place is contradictory: the Fever Pitch spur hangs off the Belfry's top (23 steps), while its walkthrough puts MY-1 at about 13 on the east side. The empty patch between Wand Volley, Hexwright, Mist Walk and Lingering (about 700..1250, −2780..−3180) is the east's biggest gap and the natural next step east of Arcane Focus. MY-1 goes there (~17 steps), a bridge from the Wand Volley road to the Mist Walk road. The fork with Fever Pitch is given up: a keystone eight more steps away is not a fork.                                                                                                                                                                                                                                                                                                                        |
| MY-2  | spell damage + life, "a new west road from the Cloister toward the Lantern and the Undercroft"     | **agree; no new road**                           | A Cloister-to-Lantern road already exists (the junction, Quiet Pulse, Mana Tap, the Lantern stair), and further west the room is held by two keystone spurs (Mind Bulwark, the Zealot's Living Ward). The "road" MY-2 needs is the existing To the Undercroft road (Mana Tap to the Undercroft wheel, four attribute nodes with nothing branching off: filler by §7.3). MY-2 hangs off its second node toward the Zealot's crypt road (~20 steps; 4 from the Undercroft wheel), so the Zealot's life casters reach it too. Spell damage with life is the life caster's own pair, the analogue of the convergence rule: that is why it sits about 20 steps out, where the ledger says such pairs belong (rare and far), not near a home. Layout note for G3: Quickening's bridge may land on `toCrypt.r1` instead of `r2`, leaving `r2` to MY-2 alone. |
| MY-3  | spell damage + mana regeneration, "the north rim road at the end of a cast speed section"          | **agree**                                        | At the top right (660, −4570), between Fever Pitch's spur and Snare Line, on the north-east rim road (~24 steps). It is the far spell cluster. Its smalls are cast speed (MY-s5 folded in). It is deliberately not next to Steady Stream: channelling with cost beside spell damage with regeneration and cast speed would be a one-stop for the channeller.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| MY-4  | ES + all elemental resistances, "the north rim road, its other end"                                | **agree**                                        | At the top left (−540, −4500), off Steady Stream's notable (which becomes a bridge) and at the head of the north-west rim road (~24 steps). Going north for both MY-3 and MY-4 costs the walk across the top through Shatter. From inside the Mystic, a caster who does not channel pays Steady Stream's three nodes to reach it (a notable of a different kind, §5.5), or comes round by Cinder and the north-west road. A second entrance from `toShatter.r2` was left out on purpose: it would make the far ES two steps off the spine and take away the price.                                                                                                                                                                                                                                                                                    |
| MY-5  | wand attack + elemental attack damage, "the Lantern side, toward the Zealot's elemental attackers" | **agree on cluster; reject its crossing**        | In the empty triangle between the Lantern junction, the west join and the Prismatic link (−650, −3760; ~19 steps), a bridge parallel to Hoarfrost. The ledger's "MY-5's side to the Bell Tower" crossing cannot be built: the Bell Tower is at about (−3300, −1100), the far side of the Zealot.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| MY-6  | wand attack + crit multiplier with wands, "the Gallery side"                                       | **agree; re-partner Wand Volley**                | Wand Volley already sells wand attack with speed and crit chance, on the same east side, so a crit wand would take both: the same pairing twice. MY-6 becomes **the crit wand** (crit chance and multiplier with wands) at the north-east rim (1330, −4040; ~23 steps), between Overcharge and the rim road; Wand Volley drops its crit line and becomes **the fast wand** (row MY-r3). Four wand-attack clusters, four directions, four partners: accuracy (home), speed (east), elemental (north-west), crit (north-east).                                                                                                                                                                                                                                                                                                                          |
| MY-7  | minion damage + curse effect, "between the Lantern and the Belfry"                                 | **agree; place further out**                     | The Lantern–Belfry gap is taken by MY-5 and MY-11. MY-7 goes on the north-west rim road (−1330, −4440; ~25 steps), toward the Zealot's Undercroft (Volatile Servants, Tomb Dust, the ledger's ZE-2), six steps from Familiars. The summoner's two Mystic minion clusters are then Familiars (minion life, 18) and MY-7 (curses, 25), with the Zealot's between.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| MY-8  | ES + avoid stun, "the empty patch inside the Column's west side"                                   | **agree**                                        | In the room Quickening and Siphon leave (−540, −2500; ~14 steps), a bridge from Quiet Pulse's road to Broad Weave: it is the Cloister's way up to the Column once the Quickening–Siphon chain is gone (§3.5). It is not linked to the Deep Well wheel, so Glass Skin is six steps away.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| MY-9  | life + mana, "between the Scriptorium and the Gallery"                                             | **agree on cluster; place nearer**               | The Scriptorium–Gallery gap is MY-1's. MY-9 goes in the gap between the Column junction, Darting Bolts, Wand Volley and Frugal (400, −2560; ~12 steps), a bridge from the scriptorium stair to Wand Volley. West and east then offer life with different partners (Quiet Pulse regeneration and MY-2 spell damage west; mana east).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| MY-10 | dagger spell damage + cast speed, "the Gallery–Stair border"                                       | **agree**                                        | In the strip between Mist Walk and the Shade's crossing road (1350, −3100; ~21 steps from the Mystic, two from the Stair's road), a bridge from Mist Walk's notable to `knife.hex.toSpire.a`. Six steps from MY-1. Quiet Knife (Knife Gate) and Ritual Blade (the Rooftops' far end) are well over 6 away; Athame (the Knife's centre wheel) is for the Shade and joining agents to check.                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| MY-s1 | spell damage section, Broad Weave to the north rim road                                            | **fold into a new notable, MY-11**               | Broad Weave is spell area, not spell damage, and the "north rim road" is 1,500 units above it. Its supply becomes MY-11 (below).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| MY-s2 | spell damage section, Arcane Focus to MY-1                                                         | **fold into MY-1**                               | MY-1 carries four spell damage smalls (two each side of the bridge).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| MY-s3 | ES section, the Cloister to MY-8                                                                   | **fold into MY-8**                               | MY-8's three smalls are energy shield.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| MY-s4 | ES section, MY-4 to the Belfry                                                                     | **fold into MY-4**                               | MY-4's three smalls are energy shield.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| MY-s5 | cast speed section into MY-3                                                                       | **fold into MY-3**                               | MY-3's three smalls are cast speed, its notable spell damage, mana regeneration and a little cast speed: one theme, the sustained quick caster.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| MY-s6 | life section, the Spire gate's west pocket to the ring                                             | **move into MY-9**                               | Within four steps of the start, three life nodes would be cheap life for every Mystic (§13.8, and tension: the life caster's life is one of its flat stats). MY-9 carries four life smalls instead.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| MY-m1 | move Quickening to the west road, trim to 5 units                                                  | **agree**                                        | To a bridge between the Quiet Pulse road and the Undercroft road (−950, −2640; ~16 steps), six steps from MY-8 and nine from Glass Skin.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| MY-m2 | move Siphon to the Belfry                                                                          | **agree**                                        | To a bridge from the east join to the Belfry's junction (190, −3770; ~18 steps), beside Thunderhead (lightning with cast speed) and above it Shatter: the casters who hit often.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| MY-p1 | trim Warded Mind from 5.3 to 5 units                                                               | **superseded**                                   | Its re-line (MY-r1) reprices it.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |

### New beyond the ledger

- **MY-11: spell damage + elemental penetration**, in the Belfry's west triangle (−140, −3790; ~19 steps), a bridge
  from the road to Shatter to the Belfry's junction. It is where MY-s1's spell damage goes (the user asked for sections
  to become notable clusters), and it gives the column's spine a spell cluster: a caster walking north to Shatter or
  MY-4 passes it. It mirrors the moved Siphon across the spine. Constraint served: §1.1 (spell damage is the flattest
  stat of eight casters), §8.7.
- Three re-lines (MY-r1 to MY-r3 in §4).

---

## 2. Where each goes

**Fill the inside first.** The Mystic's inside has more room than the ledger counted (`G0/empty.png` and the close-ups):
the Belfry's two triangles either side of the spine, the triangle under the Prismatic link, the gap between the Column
and the Scriptorium, and the Scriptorium–Gallery gap. Seven of the eleven clusters fit inside (MY-1, MY-2, MY-5, MY-8, MY-9, MY-10,
MY-11). Two (MY-4 and MY-7) sit in the north-west rim band and two (MY-3 and MY-6) in the north-east band, **all inside today's circle** (the farthest
new node is about 4,650 from the centre against 4,725). The map does not grow.

**The north rim road, checked.** The ledger proposes one road over the Belfry that enlarges the map at the top. On the
map it is not needed and would be worse: it would have to pass over Fever Pitch (wrapping a keystone that must stay a
dead end at the rim, §9.1) and run 18 nodes for two clusters (filler, §7.3). Instead the top gets **two shorter rim roads
joined across the top by the road that already exists through Shatter and Harsh Weather**:

- **The north-west rim road** (4 attribute nodes): from MY-4 west over Prismatic Balance to the Undercroft's north rim.
  Off it: MY-4 at its head, MY-7, Cinder (a dead end today, now a bridge), and the Zealot at its foot.
- **The north-east rim road** (5 attribute nodes): from the road node under Harsh Weather (`spire.frost.toHarsh.a`)
  east under the rim to the Shade's Rooftops (`knife.roofs.ridge.y1`). Off it: MY-3, Snare Line (a dead end today, now a
  bridge), MY-6, and the Shade at its foot.

Fever Pitch stays where it is, a dead-end spur at the top, 23 steps out (above the working 8 to 18 of §16; flagged, not
changed here).

**The clusters, with rough places and their links** (each cluster: a notable and its smalls, laid out by §11.5 in G3):

| id         | lead + partner                                      | at             | links (in / out)                                                             | steps | nodes                     |
| ---------- | --------------------------------------------------- | -------------- | ---------------------------------------------------------------------------- | ----: | ------------------------- |
| MY-1       | spell damage + spell crit multiplier                | (1000, −2960)  | `spire.craft.toVolley.r2` / `spire.craft.toDev2.a`                           |   ~17 | 5 (4 spell damage smalls) |
| MY-2       | spell damage + life                                 | (−1300, −2960) | `spire.well.toCrypt.r2` / `cathedral.crypt.toSpire.b` (crossing)             |   ~20 | 4 (2 spell, 1 life)       |
| MY-3       | spell damage + mana regeneration (+ cast speed)     | (660, −4570)   | north-east rim road, its first two nodes (a pocket as a bridge)              |   ~24 | 4 (3 cast speed)          |
| MY-4       | energy shield + all elemental resistances           | (−540, −4500)  | `spire.frost.stream.n` / the north-west rim road (which lands on its smalls) |   ~24 | 4 (3 ES)                  |
| MY-5       | wand attack + elemental damage with attacks         | (−650, −3760)  | `spire.fire.jArm.a` / `spire.frost.jFire.a`                                  |   ~19 | 4 (3 wand attack)         |
| MY-6       | wand attack + crit chance and multiplier with wands | (1330, −4040)  | `spire.storm.overcharge.c` / north-east rim road junction (1520, −4170)      |   ~23 | 4 (3 wand attack)         |
| MY-7       | minion damage + curse effect                        | (−1330, −4440) | north-west rim road, two of its nodes (a pocket as a bridge)                 |   ~25 | 4 (3 minion damage)       |
| MY-8       | energy shield + avoid stun                          | (−540, −2500)  | `spire.well.toPulse.a` / `spire.column.broadWeave.a`                         |   ~14 | 4 (3 ES)                  |
| MY-9       | life + mana                                         | (400, −2560)   | `spire.craft.roadN.a` / `spire.craft.wandVolley.a`                           |   ~12 | 5 (4 life)                |
| MY-10      | dagger spell damage + cast speed                    | (1350, −3100)  | `spire.craft.mistWalk.n` / `knife.hex.toSpire.a` (crossing)                  |   ~21 | 4 (3 dagger spell)        |
| MY-11      | spell damage + elemental penetration                | (−140, −3790)  | `spire.frost.toShatter.r1` / `spire.frost.jArm.a`                            |   ~19 | 4 (3 spell damage)        |
| Quickening | (moved) ES recharge start and rate                  | (−950, −2640)  | `spire.well.toTap.a` / `spire.well.toCrypt.r2`                               |   ~16 | 3 (as today)              |
| Siphon     | (moved) ES on hit, ES leech, mana on kill           | (190, −3770)   | `spire.frost.jStorm.a` / `spire.frost.jArm.a`                                |   ~18 | 3 (one small more)        |

Nearest twins (all at or over the ledger's minimums, or argued): MY-1 is 8 from Arcane Focus, 6 from Flashpoint, 6 from
MY-10; MY-2 is 6 from Quiet Pulse and far from MY-1; MY-3 is about 10 from MY-4, far from Broad Weave and MY-1; MY-4 is
about 7 from the moved Siphon and far from Glass Skin; MY-5 is far from Deft Wand and about 9 from Wand Volley (the
ledger asked 12; the partners differ and the directions differ); MY-6 is far from both; MY-7 is 6 from Familiars and far
from Hexwright; MY-8 is 6 from Glass Skin and 5 from the moved Quickening; MY-9 is about 7 from Warm Blood and far from
Quiet Pulse; MY-11 is about 6 from MY-3 and far from Arcane Focus and MY-1.

Every new cluster is a bridge (two ways in) except where it hangs as a pocket between two nodes of one road, which is
still two ways in (§3.5, §3.6).

---

## 3. The skeleton changes

### New roads (attribute nodes, +7 intelligence; the last node before a neighbour +6/+6)

| road                | nodes | from → to                                                                                                                      | what branches off                      |
| ------------------- | ----: | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------- |
| north-west rim road |     4 | MY-4's smalls → (−850, −4500) → (−1120, −4390) → (−1380, −4150) → (−1470, −3870) → the Zealot                                  | MY-4, MY-7, Cinder, the Undercroft rim |
| north-east rim road |     5 | `spire.frost.toHarsh.a` → (520, −4330) → (850, −4470) → (1230, −4470) → (1520, −4170) → (1950, −3900) → `knife.roofs.ridge.y1` | MY-3, Snare Line, MY-6, the Rooftops   |
| the curse crossing  |     1 | `spire.craft.hexwright.n` → (1470, −2760) → `knife.hex.j4.a`                                                                   | (a crossing, below)                    |

No stretch of either rim road runs more than two nodes without a branch (§7.3). The rim roads land on smalls of
MY-4 and MY-3, never on their notables, so a player walking the road pays smalls, not a notable it does not want.

### Links cut

All four go with the two moves; none is cut for its own sake.

- `spire.well.deepWell.d – spire.well.recharge.a`, `spire.well.recharge.b – spire.well.siphon.a`,
  `spire.column.broadWeave.a – spire.well.siphon.n`, `spire.well.siphon.a – spire.well.toPulse.a`.

**Ways in after the cuts (§3.5):** the Deep Well wheel keeps four (the west highway, the Cloister junction, Spirit Ward,
Wandwork). The Column keeps its junction's three roads and Broad Weave gains MY-8 in place of Siphon. Quiet Pulse keeps
three (the junction, the road to Mana Tap, and `toPulse`, now MY-8's entrance). Nothing is left with a single way in.

### Crossings (my side → the node I would land on)

Today: Mystic–Zealot 4 links plus the ring, Mystic–Shade 4 plus the ring.

| border        | crossing                   | Mystic side                     | lands on                                                                                                                                                             | kind | the combination it serves                                                                                                                                              |
| ------------- | -------------------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mystic–Shade  | the dagger caster's bridge | MY-10 (from Mist Walk)          | `knife.hex.toSpire.a` (1480, −3000)                                                                                                                                  | near | The Shade's dagger caster reaches MY-10, Mist Walk's spell dodge and MY-1; the Mystic caster reaches the Stair (Rotting Word, SH-11, Spellslip's ES fork SH-1).        |
|               | the curse crossing         | Hexwright (one attribute node)  | `knife.hex.j4.a` (1600, −2720)                                                                                                                                       | near | The curser: Hexwright with the Shade's curse home (SH-8, Second Curse) from either start.                                                                              |
|               | the Rooftops road          | north-east rim road             | `knife.roofs.ridge.y1` (2020, −3540)                                                                                                                                 | dear | Traps and mines (Snare Line, Black Powder); cold for casters and attackers (Shatter, Sleet, SH-12); the crit wand (MY-6) for an int-dex Shade.                         |
|               | CE-1 on the ring           | (the centre's)                  |                                                                                                                                                                      | ring | chaos resistance and ailment avoidance.                                                                                                                                |
| Mystic–Zealot | the Undercroft bridge      | MY-2 (from the Undercroft road) | `cathedral.crypt.toSpire.b` (−1478, −3140)                                                                                                                           | near | Spell damage with life for the Zealot's life casters; the Undercroft's Homily, Glass Wall and ZE-10/ZE-11 for Mystic casters. It joins two crossing roads into a loop. |
|               | the far loop               | north-west rim road             | a road node the Zealot lays at the Undercroft's north rim (about −1550, −3700), joining the tips of Shattering Rite and Tomb Dust; fallback `cathedral.crypt.rite.n` | dear | The casters' far loop: MY-4, MY-7, Cinder and Steady Stream with ZE-3 (channelling), Tomb Dust and Volatile Servants (summoners).                                      |
|               | CE-4 on the ring           | (the centre's)                  |                                                                                                                                                                      | ring | mana and cost for casters of both homes.                                                                                                                               |

After this: Mystic–Shade about 7 links plus the ring and CE-1; Mystic–Zealot about 6 plus the ring and CE-4. That is
short of the reference's 10 to 13 on the Zealot side (see the open questions).

**Ledger crossings I do not propose, and why:**

- **"The Spire gate's east to the Knife Gate: SH-13 (ES with mana)."** Through the empty patch east of home, it would put
  the Shade's energy shield about 8 steps from the Mystic start: the near-home ES the Warded Mind re-line just removed.
- **"Cloister to Narthex: Hymn and Glass Skin."** It exists already (`spire.well.toCathedral.b → cathedral.home.hymn.b`).
- **"MY-5's side to the Bell Tower."** The Bell Tower is the far side of the Zealot.
- **"Lantern to Undercroft through ZE-3."** Merged with the far loop: the north-west rim road lands where ZE-3 would face
  the Lantern.
- **"Scriptorium to Stair through SH-3."** The Mystic side has no landing that is not already a crossing: the existing
  `devotion.b → knife.hex.wheel.n` link reaches the Stair's north, where the Shade can hang SH-3.

---

## 4. Existing clusters: moved, re-lined, re-partnered

| id       | change                                                                                                                                                               | reason for players                                                                                                                                                                                                                                         |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MY-m1    | **Move Quickening** to (−950, −2640), a bridge between the Quiet Pulse road and the Undercroft road; trim to 5 units.                                                | Breaks the Cloister one-stop (Glass Skin, Quickening, Siphon three steps apart). Recharge start now lies west, past life (Quiet Pulse).                                                                                                                    |
| MY-m2    | **Move Siphon** to (190, −3770), a bridge from the east join to the Belfry's junction; add one ES-on-hit small.                                                      | Recovery from hitting belongs where the quick casters go (Thunderhead's cast speed, the shock and freeze above).                                                                                                                                           |
| MY-r1    | **Re-line Warded Mind**: chaos resistance and mana, a little mana regeneration; no energy shield. Its wheel small `focus.d` becomes chaos resistance. About 4 units. | The east wheel stops handing the caster spell damage and ES on its two sides (§8.3, the convergence rule). It keeps its name's meaning. It also answers MY-p1.                                                                                             |
| MY-r2    | **Re-line Glass Skin**: energy shield and maximum mana instead of ES and recharge rate. About 4.5 units.                                                             | With Quickening moved, Glass Skin and Quickening would be the same pairing (ES with recharge) in one direction. Glass Skin becomes ES with mana on the mana wheel, beside both mana keystones (Mind Bulwark, Mana Bastion); Quickening keeps the recharge. |
| MY-r3    | **Re-line Wand Volley**: wand attack damage and attack speed with wands; drop crit chance with wands (the speed rises to keep 4.5 units).                            | MY-6 is the crit wand; two crit wands on one side would be one pairing twice.                                                                                                                                                                              |
| (bridge) | **Steady Stream, Snare Line, Cinder** become bridges (MY-4, the north-east road, the north-west road).                                                               | Three dead-end tips at the top are joined to the rim roads (§3.6). Keystone spurs (Prismatic Balance, Fever Pitch, Pain Conduit, Mind Bulwark, Mana Bastion) stay dead ends.                                                                               |
| (bridge) | **The To the Undercroft road** gains two clusters (Quickening, MY-2).                                                                                                | It is four attribute nodes with nothing branching off today (§7.3).                                                                                                                                                                                        |

**Kept as they are, looked at:** Deft Wand (a dead-end pocket at home, the near wand; fine), Draught (a dead end at the
Zealot border; its small already takes a crossing), Harsh Weather's chain, the Belfry's long links (the Prismatic link
from the west join and Fever Pitch's spur are long; G2's layout pass may shorten them, not this brief), Broad Weave and
Darting Bolts (area or projectile: a spell is one or the other), Familiars, Hexwright, Mist Walk, Devotion, Frugal, the
home loop and both highways. No removals: every notable here has a build that would take it.

---

## 5. The size it reaches

| kind                                     |  nodes |
| ---------------------------------------- | -----: |
| 11 new notables                          |     11 |
| their smalls                             |     35 |
| Siphon's extra small                     |      1 |
| rim roads (4 + 5) and the curse crossing |     10 |
| **total new**                            | **57** |

The Mystic goes from 184 to about **241** nodes (the ledger estimated 259). The difference is the folding of six small
sections into notable clusters (§0 of the ledger: the user's answer) and two rim roads of 9 nodes instead of one of 18.
Everything fits inside today's circle; nothing is crammed (the tightest spot, MY-8 beside Quiet Pulse, has 190 units
between notables).

**Room left for a second round**, if G3's measures show a Mystic build still takes all it wants: the north-west rim
between MY-7 and the Zealot landing, the south half of the north-east band (between MY-6 and Pain Conduit), and the
open triangle above Warm Blood (last, because anything there is 8 steps from the start; see §7).

---

## 6. The classic caster after this brief

Wants: spell damage, cold, energy shield, cast speed (plus resistances and mana). Steps are estimates.

**Near home (≤ 9 steps), both cheap:** First Light (2), Glass Skin, now ES with mana (7), Arcane Focus (8), Warm Blood (6;
life with a little ES). The east wheel's other side is chaos resistance now, so the near ES is west only.

**Four directions after that:**

- **West, the shield side:** MY-8 (ES with stun, 14), Quickening (ES recharge, 16), Hoarfrost (cold with ES, 17), and on
  past the border the Undercroft's ES (ZE-10, ZE-11) through MY-2 (spell with life, 20).
- **East, the offence side:** Frugal (10), MY-9 if it runs on life (12), MY-1 (spell with crit multiplier, 17), Flashpoint
  (fire with spell crit, 18), and the Stair through MY-10 (SH-11, Rotting Word).
- **North, up the spine:** Broad Weave or Darting Bolts (12), Prism Ward (12), Thunderhead (cast speed, 16), Siphon (ES on
  hit, 18), MY-11 (spell with penetration, 19), Shatter (cold, 20).
- **The top:** MY-4 (ES with resistances, 24, top left) and MY-3 (spell with regeneration and cast speed, 24, top right),
  joined across the top through Shatter.

**At 60 points** it has the home, both wheels, Warm Blood and one of: the spine to Shatter (Thunderhead, MY-11, Siphon),
or the west (MY-8, Quickening, Hoarfrost), or the east (MY-1, Flashpoint). The other two directions are what 40 more points
buy: notables of 3.5 to 5 units it wants (targets 2 and 3).

**At 120 points**, by hand count, everything it wants inside the Mystic costs about 80 points of nodes (wanted nodes plus
the roads between them). The neighbours' ES and spell clusters it would also take (ZE-10, ZE-11, SH-1, SH-13, SH-11,
the cold of Sleet and ZE-4) add another 35 to 45. So it cannot have both; it chooses:

- **(a) Mystic-deep:** both top clusters, the spine, west and east, and none of the neighbours' ES. It gives up the
  Undercroft's and the Stair's shields.
- **(b) ES-wide:** west, the Undercroft (MY-2, ZE-10, ZE-11) and MY-4 over the top, but not MY-1, MY-3 or Flashpoint:
  most of the ES, less of the spell damage.
- **(c) Offence-wide:** east, the Stair (MY-10's crossing, SH-11) and MY-3, with ES only from the home, Glass Skin and
  MY-8.

What 40 more points buy in each is the other plan's notables. Today the same 40 points buy 16% spell damage. This is a
hand count, not the allocator: G3 measures it (`npm run passives:builds -- --only caster-es,caster-life,summoner,wand-attack,channeller`).

**The other Mystic starts, briefly:** the wand attacker chooses between the fast wand (east, 13), the elemental wand
(north-west, 19) and the crit wand (north-east, 23), with ES now west only. The summoner chooses between Familiars
(north-west), MY-7 (the far north-west) and the Zealot's minions through the ring. The channeller's Steady Stream is now on
the way to MY-4 (ES), and its spell damage is MY-3 across the top or MY-11 below: one or the other, not both cheaply.

---

## 7. Tensions said out loud (CONSTRAINTS §13)

1. **Tension against early safety (§4.6, §6.2).** Re-lining Warded Mind takes ES off the east wheel. The east still sells
   a defence (chaos resistance), and the home still sells ES (First Light's side, First Light, Warm Blood), so a caster's
   first points are safe either way. Leaned to tension: two ES notables at 7 steps from both sides were the main reason
   the caster takes all its ES.
2. **Filling empty space against a generic start (§11.3, §13.8, G-growth §2 "fill the inside first").** Three patches
   near home stay open: above Warm Blood (about −250..250, −1800..−2450) and the two flanks of the home (about
   −750..−450 and 480..850, −1350..−1750). Anything there would be within 5 to 9 steps of the start and would hand every
   Mystic a cheap notable, the opposite of what this growth is for; the patches are a few hundred units across, not a
   moat. Leaned to tension and to an uncommitted start. A second round may use them for something no Mystic build
   mainly wants.
3. **Rim growth against the region's footprint (§11.3, §13.7).** The rim roads use the empty band inside today's circle;
   the map does not grow and no border moves.
4. **Highways against filler (§13.4).** Two short rim roads (4 and 5 nodes) each carry three or four branches, instead
   of one 18-node road with two.
5. **Bridges against dead ends (§13.5).** Steady Stream, Snare Line and Cinder become bridges; Deft Wand, Draught and
   Harsh Weather stay tips, and every keystone spur stays a dead end.
6. **Neighbours compete (§5.5) against the channeller.** MY-4 is three steps past Steady Stream, and the channeller wants
   ES. The alternative (MY-3 there) made a spell-and-channelling one-stop, which is worse; these two are different kinds.
7. **Connections against keystone spurs (§3.7 against §9.1).** The Zealot border reaches about 6 links plus two ring
   links, short of 10 to 13. The Mystic's west between the Cloister and the Undercroft is held by Mind Bulwark's spur and
   the Zealot's Living Ward; a crossing through them would make a keystone a through-route. The rest has to come from the
   Zealot's side (open question 4).
8. **Identity against spread (§13.2).** Wands stay concentrated in the Mystic (four wand-attack clusters and Wandwork),
   as the reference keeps its wands in one class; they sit in four directions with four partners.
9. **Uniform sections (§13.3).** Every new cluster's smalls are one stat per section; MY-1 and MY-2 are bridges with a
   section each side (MY-2's two sides differ on purpose: spell damage from the Mystic, life toward the Zealot).

---

## 8. Checklist against CONSTRAINTS.md

- **§1 What the tree is for.** Each Mystic main want (spell damage, ES, wand, minions, life) gains supply in a new
  direction with a new partner; the east wheel's give-both is fixed. Tension is weighed against the start and the looks
  (§7 above), never by itself. No build list placed a node.
- **§2 The reference.** Used its facts (twins 5+, 3 to 5 units, concentration per specialization, wands in one class,
  10 to 13 border links). Nothing copied; no names given (G3 names, §2.4).
- **§3 A network.** Every new cluster has two ways in; three tips become bridges; the cuts leave no single way in;
  crossings named for combinations; the Zealot side is short (open question).
- **§4 Regions and areas.** No build-named place; the Mystic keeps varied defences: ES, life (Warm Blood, Quiet Pulse,
  MY-9, MY-2), resistances (Prism Ward, MY-4, Warded Mind's chaos), spell block (Spirit Ward), dodge (Mist Walk), stun
  (MY-8). It sells mana, leech (Siphon, Mana Tap), crit, cast and attack speed, flasks, cost, duration and wand lines.
- **§5 Specializations.** Every new cluster names its partner and its nearest twin (§2); spell damage now lies in five
  directions with five partners; ES in five with five; wands in four with four; minions in two Mystic places with two.
  Weapons sit by their attribute (wands, int; the dagger caster's MY-10 on the int-int border).
- **§6 Starts.** The home is unchanged; no new cluster is nearer than 12 steps to the start (MY-9, life with mana);
  nothing near home names a weapon beyond today's Deft Wand.
- **§7 Roads and attributes.** New clusters hang off roads or bridge two; two rim roads carry branches all along; the To
  the Undercroft road stops being filler. More intelligence per walk: G5 re-checks the values.
- **§8 Clusters and smalls.** One stat per small; uniform sections; MY-1, MY-2 and MY-5 bridges have a section each
  side; notables priced 3 to 5 units (Quickening and Warded Mind brought down).
- **§9 Keystones.** All five stay where they are, dead ends; Fever Pitch's 23 steps flagged, not changed.
- **§10 Vocabulary.** New lines in use: elemental penetration, crit multiplier with wands, avoid stun, curse effect on a
  minion notable, dagger spell damage. All exist in `lines.ts`; no new engine line.
- **§11 Looks.** Clusters placed in real gaps with clean approach angles; no new node outside the circle; no link in the
  sketch crosses an existing one; area labels to move in G3: the Belfry's (MY-11 sits under it) and the Lantern's (MY-5).
- **§12 Size.** About 57 new, an outcome; the second-round room is named.
- **§13 Tensions.** Nine said out loud (§7).
- **§14 Rejected ideas.** No generation, no build list, no filler road, no step-count reach, no build-named area, no
  invented spacing rule.
- **§15 How the work is done.** Pictures before and after (`today.png`, `sketch*.png`); walks are hand counts here, the
  allocator in G3; questions below in plain words.
- **§16 Open.** Border link counts (Zealot side), Fever Pitch's distance, attribute values (G5).

---

## 9. Open questions for the user and the joining agent

1. **Warded Mind without energy shield** (MY-r1). It is the biggest change near the Mystic home: the east wheel becomes
   spell damage or chaos resistance, and early ES is west only. All right?
2. **Glass Skin trades its recharge for mana, and Wand Volley its crit for more speed** (MY-r2, MY-r3), so the moved
   Quickening and the new crit wand are not copies of them. All right?
3. **No north rim road over the Belfry.** Two shorter rim roads, joined across the top by the existing Shatter road, and
   the map does not grow. Agreed?
4. **(Joining agent)** The Zealot border reaches about 6 links plus ring links. The Zealot's ZE-3 and ZE-11 on the
   Undercroft's north rim are the natural places for one or two more (onto the north-west rim road or MY-7).
5. **(Joining agent)** The Shade places SH-13 (ES with mana); if it sits near the Knife Gate, it should not get a link
   toward the Mystic home (§3 above).
6. **(Joining agent)** The wedge between the two Undercroft crossing roads (MY-2's spot) is also where the Zealot might
   want ZE-3; MY-2 can move a node or two north-east if so.

Nothing in this work felt like it was losing intent. One thing to watch in G3: the hand count in §6 says the caster can
finish the Mystic itself at 120 and must choose against its neighbours. If the allocator shows it finishing the
neighbours too, the answer is more wanted supply in the named second-round room, not longer roads.
