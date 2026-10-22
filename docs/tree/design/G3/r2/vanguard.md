# G3 round 2: the Vanguard (the Wall)

Done 2026-10-22 for phase G3 of [G-growth.md](../../G-growth.md), round 2 of about three, from my round-1 report
([../r1/vanguard.md](../r1/vanguard.md)), the user's decisions after round 1, the joined brief
[G1-brief.md](../../G1-brief.md) and the region brief [G1/vanguard.md](../../G1/vanguard.md).
[CONSTRAINTS.md](../../CONSTRAINTS.md) wins over all of them. Files: `src/data/passives/wall/` only (home, maces, slams,
grit). Nothing registered, baked or committed. Area labels were not touched (the user, 2026-10-22: ignore them).

**Nodes: 217 → 229** (start included): three new clusters of 4. No node removed. Three ids renamed (§5).

**Pictures** (folder `vanguard/`): `before.png` and `before-text.png` (the region before the first edit), `after.png`,
and close-ups with every line written: `home.png` (Ringing Blows), `west-tower.png` (Grim Oath, Hot Iron, Locked
Shields, Broad Back), `quarry-floor.png` (Sledge and Sinew), `barrows-middle.png` (Hammer Rhythm, Long Watch, Stone
Ward, Iron Voice, Tempered).

## 1. The hot-spot fixes and re-lines

| Node                               | Before                                                                  | After                                                                                           | Units     | Why                                                                                                                                 |
| ---------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Broad Back                         | life 12%, armour 16%                                                    | life 12%, **+16 strength**                                                                      | 3.7 → 3.5 | Option (b). The far life-and-armour hybrid every strength build bought at 60. The wheel is now hit or body, strength on both sides. |
| Grim Oath                          | curse effect 16%, armour 20%                                            | curse effect 16%, **cast speed 6%**                                                             | 3.7 → 3.5 | Option (a). The fire build bought it at 80 for the armour. Cast speed is a partner no other curse cluster has (a curse is a spell). |
| Locked Shields' four smalls        | armour 12% each                                                         | **15% defences from your shield** each                                                          | 4 → 4     | Added beyond (a) and (b): see below. The notable keeps armour 24% and shield block 5%.                                              |
| Tempered                           | max resistances +1%, all resistances 6%                                 | max resistances +1%, all resistances 4%, **armour 16%**                                         | 3.5 → 4.3 | Elemental Ward's armour, placed farther out as stop 3 asked (§2).                                                                   |
| `wall.home.unshakable` → `ringing` | Unshakable: stun threshold ×2, then threshold 16% and stun recovery 20% | **Ringing Blows**: melee damage 8% ×2, then melee damage 16% and 12% lower enemy stun threshold | 3.3 → 3.5 | The home check (§3).                                                                                                                |

Two-hand-fire still took Locked Shields at 60 after (a) and (b), for its four armour smalls alone: a two-hander gets
nothing from the block. With the smalls as shield defences, the pentagon is the shield wall's armour and nobody else's.
The section stays uniform and the notable is unchanged. VA-s1's armour, which the brief folded into VA-2, is shield
armour now.

Two Fists keeps its armour. The measured builds never took it, and dual wield with armour is the weapon-with-a-defence
kind of pair.

**What the allocator says** (`passives:builds`, indicative: the other regions are mid-edit). Armour in units, at
60 / 120 → 160 points:

| archetype     | G0           | round 1            | now                    |
| ------------- | ------------ | ------------------ | ---------------------- |
| two-hand-fire | 18 / 21 → 25 | 25.5 / 42.8 → 44.8 | **18.2 / 33.2 → 39.2** |
| mace-slam     | 14 / 21 → 22 | 17.5 / 31.2 → 35.2 | **12.2 / 29.2 → 38.5** |
| mace-shield   | 13 / 17 → 22 | 6 / 21.5 → 31.2    | 6 / 25.2 → 34.8        |
| sword-str     | 18 / 20 → 21 | 8.7 / 10.7 → 34.2  | 8.7 / 17.7 → 25.2      |

- **The west tower is no longer a one-stop.** At 60 points two-hand-fire is back at G0's armour (18.2). Mace-slam is
  below it (12.2). Neither takes Locked Shields any more.
- **At 120 the two-handers still hold more armour than in G0, but from four or five directions**: Mortar and Stone
  (north-west, V 9), Thick Skin (the far west rim), Iron Voice and Tempered (south-west), the neighbours' Verger and
  Mended Mail. It now climbs with more points (+6 and +9 units for 40 more), so it is a want they chase, not one they
  finished. Life plus armour for two-hand-fire is 63.6 units at 120 (G0 67): substitution, not strength.
- I did not touch Mortar and Stone (V 9). It is the class's own armour notable at home. The guidance was about armour
  that piles up in one place, and it now stands alone in the north-west.

## 2. Elemental Ward's armour (stop 3, confirmed after round 1)

It goes on **Tempered** (the grit wheel's resistance side), not on a new cluster:

- It keeps the pairing stop 3 sent away: armour with resistances. Tempered was already the resistance notable.
- It is far: V 20, R 21, Z 28 (Elemental Ward is V 7).
- It costs another want. A strength build that walks to the south-west grit wheel for it leaves the west tower behind.
  It is a side of a wheel whose other side is Unbroken's grit charge. Two-hand-fire now takes it at 120.
- A new armour cluster was the other option, but the measure says these builds already have plenty of armour. A line
  on a far notable adds 1.3 units, which is what Elemental Ward was to carry.

## 3. The home: is any area near the start all defence or all offence? (CONSTRAINTS §4.8)

The centre agent and the coordinator flagged the same thing. **Before**, the start's own notables within 10 steps were:

- Oathbound (2, life and melee)
- Unshakable (4, stun threshold)
- Quartermaster (4, flasks)
- Warlord's Banner (5, auras)
- Bracing (6, block)
- Thunderstep (7, two-handed slam)
- Elemental Ward (7, resistances)
- Iron Lungs (7, mana)
- Unhurried (8, movement and stun threshold)
- Stone Heart (8, life and stun threshold)
- Mortar and Stone (9, armour)
- Weight of Iron, Standing Cairns, Unbloodied and Scar Tissue (all 10)

The north and west quarter is the corridor the user remembers. The north hub led to stun threshold, then resistances,
mana and armour. The tower road was life three times into Stone Heart's life. No offence came before Steady Hands and
Hallowed Hammer at 11. The south was already mixed: Thunderstep at 7, Standing Cairns and Unbloodied at 10.

**What I did:** the north hub's pocket is now **Ringing Blows** (melee damage, and lower enemy stun threshold). It is in
the same place, with the same links and the same price. Within six steps of the start the Vanguard now offers:

| Kind                | Notables (steps)                                                                                |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| Offence             | Ringing Blows (4), for any melee weapon                                                         |
| Defence             | Quartermaster (4), Bracing (6), the ring's Provisions (5) and Sound Body (6)                    |
| Aura                | the Banner (5)                                                                                  |
| Mix (the signature) | Oathbound (2)                                                                                   |
| Just beyond         | Thunderstep at 7 (two-handed offence) and Elemental Ward, Iron Lungs at 7 (defence and sustain) |

- **Why this notable.** Unshakable's stun threshold is sold three more times (Stone Heart with life at 8, Thick Skin
  with armour, Bracing and Unhurried as lines), and stun recovery is on the centre arch and in the Cathedral.
- **Why this line.** Melee damage names no weapon (§6.3 holds) and suits every Vanguard melee build before its first
  gem. The stun line is the Vanguard's offensive voice. Its twins sell stun with a mace (Weight of Iron, 9 steps away),
  with a two-hander (Headsman), or with duration (Stagger, Hot Iron).
- **What the allocator does with it:** two-hand-fire takes it at 60, and the mace builds and the sword build list it as
  given up. It is a real early option, not a free one.
- **Watch:** it is Z 6 and R 11, as Unshakable was. A Zealot or Reaver melee build can reach it through the Banner.

**What I did not do:** pull VA-8 (shield attacks, space B, V 6) into this round. It is shield-only, so it would not mix
the first points for most builds, and the re-line covers the guidance. VA-8 stays for round 3, where its stun-duration
partner should be weighed against Ringing Blows two steps away.

## 4. The clusters added (3 of the 4 left)

| Ledger | Notable (area file)                                 | Lines and units                                                         | Smalls                                  | Where it hangs                                                                                                                                                                                                              | V / R / Z    |
| ------ | --------------------------------------------------- | ----------------------------------------------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| VA-5   | **Sledge and Sinew** (`slams.ts`, the Quarry floor) | `weaponDamage('mace', 20)`, `life(8)`: 2 + 1.6 = **3.6**                | three, `weaponDamage('mace', 10)`       | Its smalls are on the straight Quarry floor road, `floor.a` → a → b → c → `floor.b`. The notable is the apex of a triangle (b, c, n; sides 75) north of the road, so it is a one-step detour. The floor's stubs are closed. | 11 / 15 / 19 |
| VA-4   | **Hammer Rhythm** (`grit.ts`)                       | `weaponDamage('mace', 20)`, `weaponSpeed('mace', 8)`: 2 + 1.6 = **3.6** | three, `weaponSpeed('mace', 5)`         | A square (r 55) bridging `north.a` and `southWest.b` on one straight east–west line, continued by Long Reach's chain. Doors are east and west, the notable is the south corner. `north.a` becomes a clean cross.            | 16 / 20 / 24 |
| VA-7   | **Long Watch** (`grit.ts`)                          | `totemSpeed(8)`, `totemDuration(20)`: 2.3 + 1.3 = **3.6**               | three, `totemSpeed(4)` (1.1 units each) | A diamond (r 55) on the straight line from `west.c` (the west road at Iron Liturgy) to `reach.a`. Doors are north and south, the notable is the west corner. Long Reach stops being a dead end.                             | 18 / 23 / 24 |

Space E (Long Watch) and the stair (Hammer Rhythm) have no area of their own, so both are kept in the Barrows' file,
the nearest. Space A (the Quarry floor) is the Quarry's.

**Twins and steps.**

- **Sledge and Sinew** is 9 from Weight of Iron (mace and stun). Hammer Rhythm, Crushing Blow and Hallowed Hammer are
  all more than 10 away. Its nearest notables are Ground Shaker 4, Vampiric Strikes 5 and Thunderstep 6.
- **Hammer Rhythm** is 8 from Heavy Hands (attack speed with a two-hander, a different weapon). Every other mace
  cluster is more than 8 away. It is 5 from Long Watch, Stone Ward and War Drums, which are different kinds.
- **Long Watch** is more than 10 from Standing Cairns (totem damage and area), its twin. The Strider's Sentry Post and
  the Cathedral's Reliquary are far.
- **The Vanguard's plain maces now come from three directions:**
  - west: Weight of Iron (V 10, stun)
  - south: Sledge and Sinew (V 11, life)
  - south-west: Hammer Rhythm (V 16, speed)

  Hallowed Hammer (elemental) and Crushing Blow (crit) are the other two maces.

- **Convergence rule:** no cluster pairs life with armour or spell damage with energy shield. Mace with life is the
  weapon-with-a-defence kind of pair the ledger allows, at V 11, off the home's roads.
- **Names:** "Ringing Blows", "Sledge and Sinew", "Hammer Rhythm" and "Long Watch" are in neither
  `reference/tree/ref-tree.json` nor `ref-phrases.json`. `npx vitest run src/data/ip.test.ts` passes.

## 5. Tolls taken off the roads (the Stone Ward fix, and the same pattern elsewhere)

Stone Ward was a toll because G2 left gaps in roads and the clusters that filled them put their notable in the road's
line. So everyone on the road bought it. That pattern was in four places. I fixed all four, because §15.4 says to fix
the cause too. In every case the road now passes through smalls, and the notable is a one-step detour.

| Cluster              | What changed                                                                                                                                                                                                                                                                |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Stone Ward**       | The middle road crosses its chain at the second small (`ward.b`, on the straight line `middle.a` → `middle.b`). The chain runs on from `north.a` straight across the road to the notable, which is east of the road. The chain is still a bridge.                           |
| **Iron Voice**       | The four armour smalls lie on the middle road's line. The notable is the apex of a triangle east of it (linked to b and c, sides 75). The middle road from Second Wind to the Barrows road now buys a strength node, a spell block small and armour smalls, but no notable. |
| **Hot Iron**         | The west rim road runs through the two north smalls (a and b). The notable is the apex outside the rim. The door from the Battle Hymn road (c) lands on small a, on a straight line. Before this, the 120-point walk paid for Hot Iron to reach Thick Skin from the tower.  |
| **Sledge and Sinew** | Laid this way from the start.                                                                                                                                                                                                                                               |

**Ids:**

- **Renamed:** `wall.home.unshakable.{a,b,n}` → `wall.home.ringing.{a,b,n}`. The old numbers retire. No file outside
  `home.ts` referenced them.
- **New, to register:** `wall.home.ringing.{a,b,n}`, `wall.slams.sledge.{a,b,c,n}`, `wall.grit.rhythm.{a,b,c,n}` and
  `wall.grit.watch.{a,b,c,n}`.
- **Moved, ids kept:** `wall.grit.ward.*`, `wall.grit.ironVoice.*`, `wall.maces.hotIron.*` and
  `wall.slams.floor.{a,b}`. The floor's two nodes were nudged so the road does not bend at them.

## 6. Deferred border links

**None land on a cluster I added.** The three on the Vanguard's borders (G2/borders.md §4) all land their new-cluster
end in a neighbour's file, and I did not write them. The audit shows two of them already laid by those agents:

- ZE-5 ↔ `wall.resists.j.a` (as `cathedral.nave.verger.c ↔ j.a`)
- RE-2 ↔ `wall.grit.east.e6` (as `yard.blades.board.c ↔ east.e6`)

ZE-8 ↔ `wall.maces.oath.n` is the Zealot's to lay. No other border link was added, cut or re-aimed.

## 7. Checks

- **Geometry** (`geometry.ts --region vanguard --bends`): 0 crossings and 0 drawn over, for the region and for the
  whole tree.
  - There are 20 bends over 20°, against 18 in round 1.
  - The two new ones are square corners of the new clusters: `watch.b` and `rhythm.b`, at 90°.
  - The rest are the same ring corners and road turns as before.
  - `floor.a` and `floor.b` were nudged, so no new two-link node bends.
  - Every new chain is straight: Sledge's line, Hot Iron's c on the line a → `toHymn.r2`, and Stone Ward's chain from
    `north.a`.
- **Problems:** `buildAll` reports none. `npx tsc --noEmit -p .` is clean, and prettier is clean on the six files.
- **Audit** (`passives:audit -- vanguard`): 0 problems. There are 229 nodes: travel 62, small 117, notable 45,
  keystone 4.
  - **Notables in units:** all 45 are between 3.0 and 5.0. The lowest are Unhurried and Standing Cairns (3.0); the
    highest is Ground Shaker (5.0). The new and re-lined ones are 3.5 to 4.3.
- **Ways in:**
  - Hammer Rhythm and Long Watch are bridges with two doors each.
  - Sledge and Sinew is on a road with two ends.
  - Long Reach has two ways in now (it was a dead end).
  - Stone Ward keeps two (`north.a` and the road).
  - Hot Iron keeps three doors, Iron Voice two.
  - Every area has three or more links in and out.
- **Home steps:** no existing notable came nearer to any start. Two moved one step farther from the Vanguard start
  because their notables left the road's line: Hot Iron 19 → 20 and Stone Ward 15 → 16. Iron Voice (19) and Thick
  Skin (18) are unchanged, and Ringing Blows is where Unshakable was (V 4, Z 6, R 11).
- **Keystones:** all four keep one link. Distances are unchanged: Unerring 11, Strongarm 15, Rooted Stance 18, Blood
  Rite 24.

## 8. The allocator (indicative)

Main stats in units at 120 → 160 points (`--only mace-slam,mace-shield,warcry-totem,two-hand-fire,sword-str`):

| archetype     | G0 (120 → 160)                                                | round 1                                                            | now                                                                        | choice 120 | tax 60 / 120 |
| ------------- | ------------------------------------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------- | ---------- | ------------ |
| mace-slam     | life 48 → 51; armour 21 → 22; 2h mace 23 → 27                 | life 34.6 → 51; armour 31.2 → 35.2; 2h mace 22.2 → 26.5            | life 35.2 → 41.2; armour 29.2 → 38.5; **2h mace 31.7 → 35.7**              | 4          | 28 / 28%     |
| mace-shield   | life 40 → 54; armour 17 → 22; block 31.5 → 31.5; mace 14 → 14 | life 37.6 → 49.6; armour 21.5 → 31.2; block 32.5; mace 13.2 → 14.2 | life 31.8 → 39.8; armour 25.2 → 34.8; block 25 → 30; **mace 16.7 → 16.7**  | 4          | 22 / 27%     |
| warcry-totem  | life 46 → 54; totems 9 → 9; warcries 0 → 7                    | life 32.8 → 44.2; totems 5 → 5; warcries 7.8 → 8.8                 | life 32.2 → 43.2; totems 5 → 5; **warcries 12.8 → 12.8**                   | 3          | 40 / 33%     |
| two-hand-fire | life 46 → 51; armour 21 → 25; fire attacks 10 → 14; 2h 6 → 10 | life 28.4 → 40.6; armour 42.8 → 44.8; fire 13.4 → 17.4; 2h 9.5     | life 30.4 → 41.2; **armour 33.2 → 39.2**; fire 16.4 → 16.4; 2h 13.5 → 13.5 | 4          | 28 / 30%     |
| sword-str     | life 43 → 53; armour 20 → 21; sword 29 → 32                   | life 36.2 → 42.6; armour 10.7 → 34.2; sword 39.5                   | life 25.8 → 38.8; armour 17.7 → 25.2; sword 42.1 → 48.1                    | 3          | 32 / 33%     |

**What it says:**

- **The armour hot spot is fixed** (§1). Armour climbs with more points for every strength build: +6 to +10 units for
  40 more.
- **Mace is measurable now and no longer flat at 14:**
  - Mace-slam holds Weight of Iron and Sledge and Sinew at 60. Its 2h mace climbs 24 → 31.7 by 100, and Hammer Rhythm
    (3.4) is on its gave-up list at 120.
  - Mace-shield holds all three plain maces by 120, so its mace is 16.7 and flat after that. What is left for it is
    Hallowed Hammer and Crushing Blow, which it values low (elemental, crit).
  - This is the advisor's "mace at V 10 and V 11" risk, but at a higher level and only by 120, not 60.
- **Strength by the back door:**
  - Mace-slam's mace at 60 is 24 units (G0 19), because Sledge and Sinew is at V 11.
  - Ringing Blows adds early melee damage to builds that took Unshakable's defence before.
  - Life at 120 is down for every Vanguard build (35, 32, 32, 30 units against G0's 40 to 48), because new wants
    compete for the points. It climbs again with more points.
- **Totems stay flat at 5**, but only on paper. The build takes Long Watch at 60, and the archetype's reported "totem
  damage" family counts only `totemDamage`, not totem speed (question 3).
- **Warcries** rose (7.8 → 12.8) and are flat after 120. Iron Voice and War Drums are both taken.
- **Warcry-totem's tax at 60 is 40%** (28% in round 1). Its 60-point plan now walks to the south-west (Long Watch,
  Iron Voice, Tempered, War Drums). At 120 it is 33%.
- **Two-hand-fire's fire attacks (16.4) and two-handed damage (13.5) are flat at 120 → 160.** Both are round-3 items.
- **Gave-up lists** carry wanted notables for each build:
  - Mortar and Stone (4.5) for the sword build
  - Hammer Rhythm (3.4) and Barrow Ward for mace-slam
  - Shield Bash and Iron Faith for mace-shield
  - Barrow Ward and Mended Mail for warcry-totem
  - Barrow Ward and Second Wind for two-hand-fire

## 9. Walks (by hand on the map, with a scratch path script)

**20 points, the main build (mace and shield).**

- **The path:** Oathbound (2), Ringing Blows (5), Bracing (11).
- **Then the fork,** with 9 points left:
  - Weight of Iron (19, west by the tower road's life smalls)
  - Sledge and Sinew (from Bracing through Thunderstep's small: 18)
  - Mortar and Stone (north-west)
- **Chose:** the first blow and the shield first, the mace after.
- **Gave up:** the Quarry's totems and the Banner.
- **No-choice stretch:** none. The first offence is now at 4, before the shield at 6.
- **Nobody takes:** Unhurried at this budget.

**20 points, an off-build (warcries and totems).**

- **The path:** Oathbound (2), Quartermaster (6), Standing Cairns (12), Unbloodied (15), Second Wind (18), then Stone
  Ward (21) and Iron Voice (25) by the middle road.
- **The middle road is a choice now.** It crosses Stone Ward at a small and passes Iron Voice's notable, so "Stone Ward
  (21)" is a step's detour, not the price of going south. Iron Voice is reached by its armour smalls.
- **The west alternative:** Long Watch (the far totem) is 30 by the west (through Weight of Iron).
- **Chose:** the near totem and the Quarry's sustain.
- **Gave up:** the north.
- **No-choice stretch:** none.

**20 points, a neighbour coming in.**

- **The Zealot (melee):** Ringing Blows is at 6 through Warlord's Banner, then Elemental Ward at 11 and Hallowed
  Hammer at 17 by Iron Lungs. A Zealot passes a notable of a different kind (the Banner) to reach the Vanguard's first
  offence.
- **The Reaver (sword and armour):** Guarded (9), Bracing (13), Oathbound (19), Ringing Blows (23), Mortar and Stone
  (29). Armour is again a far destination for the sword build: its 120-point plan leaves Mortar and Stone in the
  gave-up list.

**120 points, mace and shield** (by hand, points in order):

| Notable          | Points | Notable        | Points | Notable         | Points |
| ---------------- | -----: | -------------- | -----: | --------------- | -----: |
| Oathbound        |      2 | Field Dressing |     41 | Hammer Rhythm   |     79 |
| Ringing Blows    |      5 | Stout Heart    |     43 | Iron Voice      |     83 |
| Bracing          |     11 | Buckler        |     51 | Elemental Ward  |     86 |
| Sledge and Sinew |     18 | Steel Rim      |     58 | Hallowed Hammer |     90 |
| Mortar and Stone |     24 | Shieldwall     |     66 | Crushing Blow   |     93 |
| Weight of Iron   |     29 | Unbloodied     |     69 | Thick Skin      |    100 |
| Iron Lungs       |     31 | Second Wind    |     72 | Tempered        |    106 |
| Locked Shields   |     35 | Stone Ward     |     75 | Shield Bash     |    110 |
| Steady Hands     |     38 |                |        |                 |        |

The last 10 points go on Stagger or Greatweight's side.

- **Chose:** three mace directions, the shield wall (Bracing, Locked Shields, the Reaver's Muster) and the north-west
  armour.
- **Gave up:**
  - the two-hander wheel (Greatweight, Broad Back)
  - Hot Iron and Grim Oath
  - Long Watch and the totems
  - Headsman and the Barrows road's spurs
- **The fork mid-build:** the 50 to 80 point stretch is a real choice between the Reaver's shield wall (Buckler,
  Steel Rim, Shieldwall, 23 points) and the south-west (Second Wind, Stone Ward, Hammer Rhythm, Iron Voice).
- **No-choice stretch:** Buckler's 8 points cross the Reaver home loop, as in round 1.
- **The west tower is a choice, not a free bundle.** Locked Shields (35) is now only for a shield, and Thick Skin is 7
  points away by the rim. The rim road no longer buys Hot Iron.
- **Nobody would take:** Crushing Blow for this build (crit mace). It is bought at 93 only because it is 3 points from
  Locked Shields.

## 10. Plan for round 3

1. **VA-8** (shield attacks and stun, the diamond in space B, V 6). Before placing it, weigh its stun-duration partner
   against Ringing Blows (enemy stun threshold) two steps away. Shield speed or block recovery may be the better
   partner.
2. **The layout call on the three spurs** off the Barrows road (Barrow Ward, Cleaver, Greatblade), from the brief.
3. **Flat main stats from this round's measure:**
   - two-hand-fire's fire attacks (16.4) and two-handed damage (13.5)
   - mace-shield's mace (16.7)
   - warcry-totem's warcries (12.8)

   The reserve (space C, space G) is where a fourth direction could go, if the round-3 measure still shows them flat.

## 11. Open questions

1. **Ringing Blows replaced Unshakable** (§3), as the near-home offence the user's guidance and the centre agent asked
   for. Is the trade right? The alternatives were VA-8 (shield-only) or re-lining Quartermaster or Stone Heart.
2. **Locked Shields' smalls are shield defences now**, not armour (§1). This is a change to a round-1 cluster, beyond
   the two options the user named. I made it because the allocator showed the two-handers still taking the pentagon
   for its armour.
3. **The warcry-totem archetype's "totem damage" family** counts `totemDamage` only, so Long Watch's totem speed never
   shows in its main stats. Should the family be "totems: damage and speed"? `scripts/passives/archetypes.ts` is not
   mine to edit.
4. **Still open from round 1:** a mace-only small (`weaponDamage('mace', 10)`, 10%) is smaller than a mace-and-sceptre
   small (`maceDamage(14)`). The new mace clusters use the 10% line at its unit; `lines.ts` is untouched.
5. **Armour at 120** for the two-handers is still about 1.5 times G0's, but it is spread over four or five directions,
   it climbs with more points, and life plus armour is at G0's level. I left it there rather than cut Mortar and Stone
   (the home's armour).

Nothing here felt like it was losing intent. The judgement call I am least sure of is Ringing Blows: it changes a
home notable the user has seen.

## 12. Checklist against CONSTRAINTS.md

- **§1 What the tree is for.**
  - The west tower's armour is no longer one bundle. Armour climbs with more points for every strength build, and
    maces come in three plain directions.
  - Tension was weighed against the rest: life fell at 120 because wants compete, and nothing near home got more
    valuable than what it replaced.
- **§2 The reference.** Twins are 8 or more steps apart. The four names are plain words, checked by the test and the
  greps. The reference game is not named.
- **§3 A network.**
  - Long Reach became a bridge. Hammer Rhythm and Long Watch are bridges.
  - The middle road and the rim road became real choices, not tolls.
  - Every new cluster has two ways in, and no border link was touched.
- **§4 Regions and areas.**
  - §4.8: the home's north offers offence at 4 steps. The north-west is no longer all defence before step 11.
  - Defences stay varied: armour, life, stun threshold, block, spell block, resistances, regeneration, leech and shield
    defences.
- **§5 Specializations.**
  - Mace has three plain directions with three partners (stun, life, speed).
  - Totems have a second Vanguard home with a different partner.
  - Armour with resistances is far now.
  - Neighbours compete: Hammer Rhythm sits beside Stone Ward, Long Watch and War Drums, all of different kinds.
- **§6 Starts.** Nothing within three steps names a weapon. The first notables are at 2 and 4, with offence and
  defence on both sides.
- **§7 Roads and attributes.** No new road nodes. Broad Back gained +16 strength, a small rise in supply for G5 to
  check.
- **§8 Clusters and smalls.** Every new small belongs to its notable and carries one line per section (Locked Shields'
  section is uniform again). Notables are 3.5 to 4.3 units.
- **§9 Keystones.** Unchanged, one link each.
- **§10 Vocabulary.** These lines are now used in the Wall:
  - `weaponDamage('mace')` and `weaponSpeed('mace')` (first uses in the tree)
  - `totemSpeed` and `totemDuration`
  - `shieldDef`
  - `castSpeed` on a curse notable
  - `meleeDamage` and `enemyStunThreshold` at home

  Every line is live.

- **§11 Looks.**
  - 0 crossings and 0 drawn over.
  - Chains are straight; the new clusters are a square, a diamond and two triangles at even spacing.
  - The floor road's bends were removed.
  - Labels were not touched (the user's instruction).
- **§12 Size.** 217 → 229, an outcome. The allocator is static; no bot simulation was run.
- **§13 Tensions.** Weighed:
  - a generic start against early direction (Ringing Blows names no weapon)
  - identity against spread (maces concentrated, three directions)
  - connections against trade-offs (the tolls removed, no new shortcut near home)
- **§14 Rejected ideas.**
  - No generation: positions were computed by hand from each cluster's two ends and checked on the pictures.
  - No filler road, no build-named area, no step-count reach.
- **§15 How the work is done.**
  - Read first: CONSTRAINTS, the briefs and round 1.
  - Pictures before and after, with close-ups. Geometry after each batch.
  - The meta-level problem fixed: road gaps filled by notables.
  - Own folder only. No register, bake, commit or stash.
