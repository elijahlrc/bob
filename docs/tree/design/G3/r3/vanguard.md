# G3 round 3: the Vanguard (the Wall)

Done 2026-10-22 for phase G3 of [G-growth.md](../../G-growth.md), round 3 of three (the last round of new clusters),
from my round-2 report ([../r2/vanguard.md](../r2/vanguard.md), its "plan for round 3"), the user's decisions after round
2, the joined brief [G1-brief.md](../../G1-brief.md) and the region brief [G1/vanguard.md](../../G1/vanguard.md).
[CONSTRAINTS.md](../../CONSTRAINTS.md) wins over all of them. Files: `src/data/passives/wall/` only (home, resists,
grit, rampart). Nothing registered, baked or committed. Area labels ignored (the user, 2026-10-22).

**Nodes: 229 → 240** (start included): three new clusters (4, 3 and 4 nodes). No node removed, no id renamed.

**Pictures** (folder `vanguard/`): `before.png` and `before-text.png` (the region before the first edit), `after.png`,
and close-ups with every line written: `shield-ram.png`, `graven-posts.png`, `bellows.png` (Bellows with the three
spurs of the Barrows road).

## 1. What each flat specialization got, and why

The round-2 measure named five flat wants for the builds that start here. For each I asked whether the build had run
out of **supply** (it holds every cluster of the family within reach) or whether it was a matter of **value** (there is
more supply, but its partner is worth nothing to that build). Only supply calls for a new cluster.

| Flat want (round 2, 120 → 160)             | Supply or value?                                                                                                                                                                                                                                                                                     | What I did                                                                                                                                                                  |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Totems, warcry-totem (10.7 → 10.7)         | **Supply.** It held Standing Cairns and Long Watch by 120; the next totem clusters are the Strider's Sentry Post (V 20, bow side) and the Cathedral's Reliquary (V 25).                                                                                                                              | **Graven Posts**, a third Vanguard totem cluster, north-west (§2).                                                                                                          |
| Warcries, warcry-totem (12.8 → 12.8)       | Supply in the south, but a third Vanguard warcry would land where the build already is (War Drums and Iron Voice are both in the Barrows). Battle Hymn (warcry with aura) is untaken for its aura.                                                                                                   | **Nothing added.** Graven Posts pulls the build north, and its warcries now climb 11.8 → 13.8 (+17%) (§6).                                                                  |
| Mace, mace-shield (16.7 → 16.7)            | **Value.** It held the three plain maces (Weight of Iron, Sledge and Sinew, Hammer Rhythm) and Crushing Blow by 120; Hallowed Hammer (V 11, 4 units of mace) is untaken because its elemental half is worth nothing to it. Five mace clusters is already the most concentrated weapon in the region. | **Nothing added.** A sixth mace cluster would be padding. Its mace stays 16.7 → 16.7: the trade it makes (block and armour over an elemental mace) is a choice §8.3 allows. |
| Two-handed damage, two-hand-fire (13.5)    | **Value.** It holds Thunderstep, Greatweight, Headsman and the Reaver's Full Swing; Greatblade (V 22) is untaken for its sword lines. Six two-hander clusters in two regions with six partners (area, strength, stun, speed, sword, life).                                                           | **Nothing added.**                                                                                                                                                          |
| Fire attacks, two-hand-fire (16.4 → 16.4)  | **Supply.** Hot Iron is the strength side's only fire-attack cluster and the build took it at 60. Kindled Steel (the Cathedral, ignite) is V 25 and stays untaken after the Zealot laid ZE-8 this round.                                                                                             | **Bellows**, a second fire-attack direction, south (§2).                                                                                                                    |
| Armour, sceptre-fire (30.8 → 33.8, Zealot) | Rounds 1 and 2 spent their effort closing the Vanguard's armour back door. The Vanguard's own builds hold 25 to 35 units at 120 and it still climbs. The sceptre fighter's armour is the Zealot's (Verger, Consecrated Plate).                                                                       | **Nothing added.**                                                                                                                                                          |

Plus the brief's last Vanguard cluster, **VA-8 (Shield Ram)**, which round 2 deferred.

## 2. The clusters added

| Ledger              | Notable (file)                      | Lines and units                                            | Smalls                            | Where it hangs                                                                                                                                                                                                                                                                                | V / R / Z    |
| ------------------- | ----------------------------------- | ---------------------------------------------------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| VA-8                | **Shield Ram** (`home.ts`, space B) | `shieldAttack(20)`, `stunDuration(25)`: 2 + 1.7 = **3.7**  | three, `shieldAttack(10)`         | A closed diamond (r 55), a pocket off `roadR.b` (the rampart road's second node), its entrance the north corner facing the road and the notable the west corner, two steps from the entrance either way round. **Not the brief's bridge to the tower road** (§3).                             | 6 / 13 / 10  |
| new (supply; §12.1) | **Graven Posts** (`resists.ts`)     | `totemDamage(24)`, `resAll(6)`: 2 + 1.5 = **3.5**          | two, `totemDamage(12)`            | A straight chain from Hallowed Hammer's middle small (`hammer.b`, now a T junction) west to Stagger's first small (`stagger.a`), on the line between the two. A bridge, not a dead end.                                                                                                       | 13 / 20 / 16 |
| new (supply; §12.1) | **Bellows** (`grit.ts`, space G)    | `eleAttackOne('fire', 24)`, `meleeArea(16)`: 2 + 2 = **4** | three, `eleAttackOne('fire', 12)` | Its smalls lie on the straight line from the Barrows road's `e3` down to Grave Host's second small (`host.b`); the notable is the apex of a triangle south-east of it. `e3` is a cross (Headsman north, Bellows south, nearly in one line, about 12° off). Grave Host stops being a dead end. | 23 / 17 / 27 |

**Partners, and why these.**

- **Shield Ram** keeps the brief's partner. Its twin, the Yard's Shield Bash, is shield attacks with shield speed and
  life on block, so shield speed was ruled out (§5.1). Bracing has block recovery, and Iron Faith has stun avoidance
  with a shield. Stun duration is a different line from Ringing Blows' lower enemy stun threshold (4 steps away). A
  build that wants both stuns may take both (§8.3).
- **Graven Posts.** Area is Standing Cairns' partner, speed and duration are Long Watch's, spell damage is the
  Reliquary's, and armour would reopen the hot spot that rounds 1 and 2 closed. Resistances suit the totem player, who
  stands back while the posts fight.
- **Bellows.** Stun is Hot Iron's partner, ignite is Kindled Steel's and accuracy is Elemental Edge's. Melee area
  serves the fire slam and the fire cleave alike.

**Twins and steps** (nodes between notables):

- **Shield Ram:** Shield Bash 23, Bracing 10 (block, a different want), Ringing Blows 4 (melee and enemy stun
  threshold, a different kind), Weight of Iron 8.
- **Graven Posts:** Long Watch 16, Standing Cairns 21, the Cathedral's Idle Hands keystone 10 (its first totem small
  8).
- **The Vanguard's totems now come from three directions:**
  - south-east: Standing Cairns (V 10, area)
  - west-south-west: Long Watch (V 18, speed and duration)
  - north-west: Graven Posts (V 13, resistances)

  The way from the home to Graven Posts passes Iron Lungs or Elemental Ward, notables of other kinds (§5.5). The
  warcry-totem build's 60-point plan never goes there (it goes to Mortar and Stone, the west tower and the Barrows).

- **Bellows:** Hot Iron 27, Kindled Steel 45, Headsman 6 and Heavy Hands 6 (the two-hander's south, a different want),
  Iron Voice 7.
  - Fire attacks on the strength side are now west (Hot Iron, by the Cathedral's burning) and south (Bellows).
  - A build that wants both crosses the region.
- **Convergence rule:** no cluster pairs life with armour or spell damage with energy shield. Resistances with totems
  and melee area with fire are not life or armour.
- **Names:**
  - "Shield Ram", "Graven Posts" and "Bellows" are in neither `reference/tree/ref-tree.json` nor
    `reference/coverage/ref-phrases.json`.
  - `npx vitest run src/data/ip.test.ts` passes (5 of 5).

## 3. Other changes

| Change                                           | Before → after                                                                                                                                                  | Why                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Shield Ram: a pocket, not the brief's bridge** | The brief (and my first version) linked the diamond's south corner to the tower road (`roadM.b`). That link is cut; the diamond moved 60 units nearer its road. | With the bridge, the allocator's mace-and-shield plan at 120 points left out `hubs.n` and `roadR.a` and reached the rampart highway from the tower road through Shield Ram's notable and two smalls: three stat nodes standing in for the highway beside the start (§7.1, §14 "connector nodes"), and the reason one plan beat all others (choice 4 → 1; §6). As a pocket, choice is back to 3. The tower road and the rampart road stay joined through the hub and the signature, as before. |
| The Unerring Discipline spur (positions only)    | `a` (−2680, 230) → (−2688, 257), `b` (−2760, 205) → (−2765, 248), keystone (−2860, 175) → (−2870, 235); same links, same steps (V 11)                           | Graven Posts' link to Stagger passed 69 units above the keystone. It now passes about 130 above, and the keystone stands about 360 from Idle Hands (was 321). The spur stays straight from the junction.                                                                                                                                                                                                                                                                                      |
| `why` texts                                      | the headers of `home.ts`, `resists.ts` and `grit.ts`; Grave Host (now a loop); `stagger.a` (Graven Posts lands on it); the Unerring spur                        | They name what is new.                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |

No line on an existing node changed. No id was renamed or retired. **New ids to register:** `wall.home.ram.{a,b,c,n}`,
`wall.resists.posts.{a,b,n}` and `wall.grit.bellows.{a,b,c,n}`.

## 4. The three spurs off the Barrows road (the brief's layout call)

**Left as they are.** Barrow Ward (from `e5`) and Cleaver (from `e6`) both end on the Yard's `fosse.road.f7`:

- The Fosse lands on Barrow Ward's notable.
- Cleaver's far small is the "axes by the Fosse" crossing.

So the two are a V converging on one Yard node, not two parallel pickets. Both ends are border links, which are not
mine to re-aim this round.

Greatblade (from `e7`) is the only free spur. Tilting it east would put it on the Reaver's Full Swing (175 units from
its notable). Tilting it west would put it on Cleaver.

What changed the "picket fence" is west of them: Bellows and Grave Host now fill space G as a loop. The south of the
Barrows road reads as a loop, the V and one spur (`bellows.png`). The only fault left is text: Cleaver's far small's
lines touch Greatblade's first small's lines in the `--text` render, and the nodes are clear.

## 5. Deferred border links

**None land on a cluster I added.** The three on the Vanguard's borders (G2/borders.md §4) land their new-cluster end
in a neighbour's file, and all three are now laid by those agents:

| Link | Laid as                                          | By                     |
| ---- | ------------------------------------------------ | ---------------------- |
| ZE-5 | `cathedral.nave.verger.c ↔ wall.resists.j.a`     | the Zealot, earlier    |
| RE-2 | `yard.blades.board.c ↔ wall.grit.east.e6`        | the Reaver, earlier    |
| ZE-8 | `cathedral.rim.procession.c ↔ wall.maces.oath.n` | the Zealot, this round |

I added, cut and re-aimed no border link. Graven Posts faces the Cathedral's Idle Hands spur, but it has no link to it.

## 6. The allocator (indicative: the other regions are mid-edit)

`npm run passives:builds -- --only mace-slam,mace-shield,warcry-totem,two-hand-fire,sceptre-fire,sword-str`. Main
stats in units at 120 → 160 points:

| archetype     | G0 (120 → 160)                                         | round 2 (my run before this round's edits)                                 | now                                                                                                                              | choice 60 / 120        | tax 60 / 120 |
| ------------- | ------------------------------------------------------ | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ------------ |
| mace-slam     | life 48 → 51; armour 21 → 22; 2h mace 23 → 27          | life 35.2 → 41.2; armour 29.2 → 38.5; 2h mace 31.7 → 35.7                  | the same (no new cluster on its routes)                                                                                          | 3 / 4                  | 28 / 28%     |
| mace-shield   | life 40 → 54; armour 17 → 22; block 31.5; mace 14 → 14 | life 31.8 → 39.8; armour 25.2 → 34.8; block 25 → 30; **mace 16.7 → 16.7**  | the same as round 2 (Shield Ram as a pocket is not on its routes; §1 says why mace stays)                                        | 1 / 3 (round 2: 1 / 4) | 22 / 27%     |
| warcry-totem  | life 46 → 54; totems 9 → 9; warcries 0 → 7             | life 32.2 → 43.2; **totems 10.7 → 10.7**; **warcries 12.8 → 12.8**         | life 34.2 → 41.2; **totems 10.7 → 14.7**; **warcries 11.8 → 13.8**                                                               | 3 / 3                  | 40 / 34%     |
| two-hand-fire | life 46 → 51; armour 21 → 25; fire 10 → 14; 2h 6 → 10  | life 30.4 → 41.2; armour 33.2 → 39.2; **fire 16.4 → 16.4**; 2h 13.5 → 13.5 | life 26.4 → 41.2; armour 35.2 → 38.8; **fire 21.4 → 21.4**; 2h 13.5 → 13.5                                                       | 2 / 2 (round 2: 1 / 4) | 30 / 28%     |
| sceptre-fire  | (Zealot)                                               | armour 30.8 → 33.8; fire 21.4 → 24.4                                       | armour 24.2 → 24.2; fire 20 → 20 (it moves with the Zealot's round 3 from run to run; none of my three clusters is in its plans) | 3 / 2                  | 25 / 32%     |
| sword-str     | life 43 → 53; armour 20 → 21; sword 29 → 32            | (not re-run)                                                               | life 20.8 → 37.8; armour 16.7 → 26.2; sword 46.1 → 48.1 (Mortar and Stone in its gave-up list)                                   | 3 / 3                  | 32 / 33%     |

What it says:

- **Totems climb.** At 120 warcry-totem gives up Graven Posts (2.6), Mortar and Stone (4.5) and Barrow Ward (3.6). With
  40 more points it takes Graven Posts, so totems go 10.7 → 14.7 (+37%).
  - Its warcries climb too (+17%): the pull north leaves a warcry behind at 120.
  - That is why no third warcry cluster was needed.
  - Its 60-point plan is unchanged: Graven Posts is not cheap from where it goes early.
- **The two-handed fire build now chooses at 60.** It takes either:
  - the north-west (Mortar and Stone, Verger, Elemental Ward and Hot Iron, as before), or
  - the south: Thunderstep, Headsman, Heavy Hands, Iron Voice, Tempered, Full Swing and Bellows.

  It takes the south, and Mortar and Stone (4.5), Verger and Elemental Ward are on its gave-up list at 60. Choice at
  60 went 1 → 2.
  - By 120 it holds both fire clusters, so fire is flat again, at 21.4 instead of 16.4. That is the supply rising, and
    the remaining fire (Kindled Steel, V 25, ignite) is far.
  - **Strength by the back door:** fire at 60 went down (10 → 8.4). At 120 it went up 5 units, about the one new
    cluster.
  - Its two-handed damage is flat at 13.5 for the reason in §1 (value, not supply).
  - Its choice at 120 went 4 → 2 when Bellows landed: the two directions above. Still on target (two or more).
  - No Reaver archetype takes Bellows at 60 or 120, although it is R 17 against V 23 (the 27-archetype run).

- **Shield Ram: the bridge was cut, by measure** (§3). With the brief's bridge to the tower road, mace-and-shield took
  Shield Ram at 120 and its mace climbed 8.7 → 16.7. But its choice at 120 fell 4 → 1.
  - Its 120-point plan held `roadR.b` and the diamond but not `hubs.n` or `roadR.a`. It reached the rampart highway
    from the tower road through Shield Ram's smalls and notable, a stat connector standing in for the highway beside
    the start.
  - As a pocket, choice is 3 at 120 and no plan uses it as a road.
  - No archetype takes it at 160. The archetype set has no shield-attack build (mace-shield weighs `shieldAttack` at
    0.6), so that says more about the yardstick than about players (§14).
- **The sword build** has Mortar and Stone (4.5) and Stone Heart in its gave-up list at 120, so the Vanguard's armour
  is still a far want for it.
- **Over all 27 archetypes** (one run at the end, others mid-edit):
  - What 40 more points add to the typical main stat at 120 is 23% (19% after round 2).
  - 24% of main stats gain 10% or less (32% after round 2).
  - One build has a single plan at 120, and 20 have three or more.
  - Typical tax at 120 is 31%.

## 7. Checks

- **Geometry** (`geometry.ts --region vanguard --bends`): 0 crossings and 0 drawn over, for the region and the whole
  tree.
  - There are 22 bends over 20° (20 in round 2). The two new ones are `ram.b` and `ram.c` at 90°, corners of the
    closed diamond.
  - The rest are the same ring corners and road turns.
  - Every new chain is straight:
    - Graven Posts lies on the line `hammer.b` → `stagger.a`.
    - Bellows' smalls lie on the line `e3` → `host.b`, about 12° off the line of Headsman's chain through `e3`.
    - Shield Ram's entrance faces its road.
  - `hammer.b` became a T (the new link leaves near a right angle to the mace chain), and `e3` a cross.
- **Problems:** `buildAll` reports none with a `wall.` id. `npx tsc --noEmit -p .` shows no error in `wall/` (the
  errors it prints are unused imports in other regions' files). Prettier is clean on all six files.
- **Audit** (`passives:audit -- vanguard`): 0 problems. There are 240 nodes: travel 62, small 125, notable 48,
  keystone 4.
  - **Notables in units:** all 48 are between 3.0 and 5.0. The new ones are Graven Posts 3.5, Shield Ram 3.7 and
    Bellows 4.0. The lowest are Unhurried and Standing Cairns (3.0), the highest Ground Shaker (5.0).
- **Ways in:**
  - Graven Posts and Bellows are bridges with two doors each. Shield Ram is a closed pocket off one road node (§3.6:
    some dead ends are fine).
  - Grave Host gained a second way in (it was a dead end).
  - Every area keeps three or more links in and out (the audit's list).
- **Home steps** (every notable and keystone, from all six starts, before my first edit and after): **none came
  nearer** to any start. The only changes in the diff are another region's new nodes. Shield Ram (V 6) sits where the
  brief put VA-8.
- **Keystones:** all four keep one link. Unerring 11, Strongarm 15, Rooted Stance 18, Blood Rite 24 (unchanged).

## 8. Walks (by hand on the map, with a scratch path script)

**20 points, the main build (mace and shield).**

- **The path:** Oathbound (2), Ringing Blows (5), Shield Ram (8), Bracing (14). Then the fork, with 6 points left:
  - Sledge and Sinew (21, south)
  - Stone Heart (west by the tower road, back through the signature) toward Weight of Iron
- **Chose:** the first blow, the shield's offence, then the shield's block. The other order is as good: Oathbound (2),
  Shield Ram (7), Stone Heart (13), Weight of Iron (19). That one takes the mace before the block.
- **Gave up:** the mace until after 20, the flasks and the Banner.
- **No-choice stretch:** none. Every 3 to 6 points there was a fork.
- **Nobody takes:** Unhurried at this budget.

**20 points, an off-build (warcries and totems).**

- **The south path** (as round 2): Oathbound (2), Quartermaster (6), Standing Cairns (12), Unbloodied (15), Second Wind
  (18), Stone Ward (21).
- **The north path:** Oathbound (2), Iron Lungs (8), Hallowed Hammer's two smalls, Graven Posts (15), Elemental Ward
  (17).
- **The choice is real:**
  - The south is the near totem with sustain, and the warcries come next (War Drums 5 more).
  - The north is the far totem with resistances, the resist star and the totem keystone across the border.
  - From the south, Graven Posts costs 12 more. From the north, War Drums is about 20 away.
- **Gave up:** the other side.
- **No-choice stretch:** none.

**20 points, neighbours coming in.**

- **The Zealot (shield and sceptre):** Warlord's Banner (3), Ringing Blows (6), Shield Ram (10), Elemental Ward (13),
  Hallowed Hammer (19).
  - Shield Ram is a fourth step out of the Banner chain, an optional porch.
  - Graven Posts is 3 past Hallowed Hammer (22).
- **The Reaver (sword and armour):** Guarded (9), Bracing (13), then Shield Ram at 24 through Oathbound and the north
  hub.
  - Shield Ram is far for the Reaver (R 13): the Reaver's own shield offence is Shield Bash.
  - Mortar and Stone is still a far destination for it.

**20 points, the two-handed fire build going south** (the allocator's new 60-point direction): Oathbound (2),
Quartermaster (6), Thunderstep (9), Headsman (22), Bellows (27), Heavy Hands (31). It is not a 20-point walk. It shows
that Bellows is a mid-run destination (V 23), not a near-home pick.

**120 points, mace and shield** (by hand, points in order):

| Notable          | Points | Notable        | Points | Notable         | Points |
| ---------------- | -----: | -------------- | -----: | --------------- | -----: |
| Oathbound        |      2 | Locked Shields |     46 | Second Wind     |     83 |
| Ringing Blows    |      5 | Steady Hands   |     49 | Stone Ward      |     86 |
| Shield Ram       |      8 | Field Dressing |     52 | Hammer Rhythm   |     90 |
| Bracing          |     14 | Stout Heart    |     54 | Iron Voice      |     94 |
| Sledge and Sinew |     21 | Buckler        |     62 | Elemental Ward  |     97 |
| Stone Heart      |     27 | Steel Rim      |     69 | Hallowed Hammer |    101 |
| Weight of Iron   |     33 | Shieldwall     |     77 | Shield Bash     |    105 |
| Mortar and Stone |     38 | Unbloodied     |     80 | Thick Skin      |    113 |
| Iron Lungs       |     40 |                |        |                 |        |

The last 7 points go on Crushing Blow (3 from Locked Shields) or Graven Posts (3 from Hallowed Hammer).

- **Chose:**
  - both shield directions near home (Shield Ram north-west, Bracing south-east)
  - three plain maces
  - the Reaver's Muster for block
  - the north-west armour
- **Gave up:**
  - Bellows, Hot Iron and Grim Oath
  - the totems (Graven Posts, Long Watch, Standing Cairns)
  - the two-hander wheel and Headsman
  - Tempered
- **The fork mid-build:** from 50 to 90 points it is a real choice. On one side are the Reaver's shield wall (Buckler,
  Steel Rim, Shieldwall: 23 points). On the other are the south-west (Second Wind, Stone Ward, Hammer Rhythm, Iron
  Voice: 17 points) and the north (Elemental Ward, Hallowed Hammer, Shield Bash).
- **No-choice stretch:** Buckler's 8 points cross the Reaver home loop, as in rounds 1 and 2.
- **Nobody would take:** Crushing Blow for this build (crit mace). Graven Posts, though 3 points from Hallowed Hammer,
  is worth nothing to it.

## 9. What is left after G3 (for the audit rounds)

1. **The south-west rim is empty.** From Rooted Stance (−4065, 1619) to Blood Rite (−2833, 3781), west of Two Fists and
   Long Reach, there is a band of about 1,000 by 2,000 units with no node.
   - CONSTRAINTS §11.3 wants the network dense to the rim.
   - I left it because nothing I could weigh this round wanted to go there:
     - the totems would be beside Long Watch
     - the two-handers beside Greatweight and Heavy Hands
     - the fire beside Hot Iron's rim
   - A rim road there (Rooted Stance's junction → Two Fists' tip → Blood Rite's approach) would be filler without
     clusters a build weighs.
   - It is the region's reserve if an audit finds a want with no home.
2. **Mace-shield's mace is flat at 16.7** (value: Hallowed Hammer's elemental half). If the audit wants it to climb,
   re-partner a mace cluster (Hallowed Hammer or Crushing Blow) rather than add a sixth.
3. **Fire for two-hand-fire is flat again at a higher level** (21.4). The rest of the supply is Kindled Steel (V 25).
   Whether the Cathedral's fire should be nearer is the Zealot's call.
4. **Two-handed damage** stays flat for this archetype (value, not supply). If the audit wants it to climb, the lever
   is the archetype's narrow wants or Greatblade's sword half, not a seventh cluster.
5. **Mace smalls priced below mace-and-sceptre smalls.** Still open from rounds 1 and 2: `weaponDamage('mace', 10)` is
   10% a small, and `maceDamage(14)` is 14%. `lines.ts` is untouched.
6. **The three spurs' text overlap** in the `--text` render (§4).

## 10. Open questions

1. **Shield Ram is a pocket, not the brief's bridge** (§3, §6).
   - As a bridge from the rampart road to the tower road, its smalls replaced the north hub as the way onto the
     rampart highway (a stat connector beside the start), and mace-shield's choice at 120 fell 4 → 1.
   - As a pocket, choice is 3, but no archetype takes it. There is no shield-attack archetype.
   - Is a pocket right for the shield porch, or should it bridge somewhere that is not a road shortcut?
2. **Graven Posts and Bellows are beyond the brief.** I added them under CONSTRAINTS §12.1, because two
   specializations ran out of supply:
   - totems: both Vanguard clusters held by 120
   - fire attacks: the strength side's one cluster held by 60

   The flat mace, two-handed damage and warcries got nothing, for the reasons in §1.

3. **Graven Posts faces the Cathedral's Idle Hands keystone** (10 steps by the network, about 370 units by the map). A
   later border pass could join them. I did not, because border links are revisited after G3.

Nothing here felt like it was losing intent. The call I am least sure of is Shield Ram as a pocket (question 1).

## 11. Checklist against CONSTRAINTS.md

- **§1 What the tree is for.**
  - Two specializations that ran out of supply got a far direction with a partner the build must weigh.
  - The allocator shows the trade:
    - warcry-totem gives up Graven Posts and Mortar and Stone at 120
    - two-hand-fire picks south or north-west at 60
  - The other flat wants were judged value, not supply, and got nothing, so no padding (§1.1 "one constraint among
    all").
- **§2 The reference.** The twins are 6 or more steps apart. The three names are plain words, checked by the test and
  the greps. The reference game is not named.
- **§3 A network.**
  - Graven Posts and Bellows are bridges. Shield Ram is a pocket, because as a bridge it was a shortcut that stood in
    for the home's highway (§13.1, connections against trade-offs, measured).
  - Grave Host stopped being a dead end.
  - The north-west gained a loop (Hallowed Hammer, Graven Posts, Stagger, Steady Hands, the junction).
  - No border link was touched.
- **§4 Regions and areas.**
  - §4.8: the home now offers offence at 4 (Ringing Blows) and 6 (Shield Ram), beside defence at 4 to 6.
  - Defences stay varied: life, armour, resistances (now on a totem notable too), block, spell block, stun, recovery.
- **§5 Specializations.**
  - Totems are in three Vanguard directions with three partners.
  - Fire attacks are in two Vanguard directions (plus the Cathedral).
  - Shield attacks are in two regions with different partners.
  - Weapons sit by their attributes (§5.4): a shield porch near the strength home, fire with any weapon.
  - Neighbours compete (§5.5): Graven Posts is reached past Iron Lungs or Elemental Ward, and Bellows is 6 from
    Headsman.
- **§6 Starts.** Nothing within three steps names a weapon. Shield Ram is an optional porch at 6, and no notable came
  nearer any start.
- **§7 Roads and attributes.** No road node was added. `e3` and `hammer.b` became junctions. Attribute supply is
  unchanged.
- **§8 Clusters and smalls.** Every new small belongs to its notable and carries its lead (§8.2, §8.7). The new
  notables are 3.5 to 4.0 units (§8.6). Shield Ram's sides are a door each, not a wheel choice.
- **§9 Keystones.** All four keep one link. Unerring moved a little; its distance is unchanged.
- **§10 Vocabulary.** New in the Wall: `shieldAttack`, `totemDamage` with `resAll`, and `eleAttackOne('fire')` with
  `meleeArea`. Every line is live and from `lines.ts` as it is.
- **§11 Looks.**
  - 0 crossings and 0 drawn over.
  - Every new chain is straight, and the diamond is regular.
  - Unerring was lowered to clear the new link.
  - Labels were ignored (the user's instruction).
- **§12 Size.** 229 → 240, an outcome. Two clusters were added beyond the brief, with the reason (§12.1). No bot
  simulation was run (the allocator is static).
- **§13 Tensions.** Weighed:
  - connections against trade-offs (the Shield Ram bridge cut, question 1)
  - identity against spread (no sixth mace)
  - a generic start against early direction (a shield porch, not a weapon)
  - bridges against dead ends (two new bridges; Shield Ram a pocket, for the reason above)
- **§14 Rejected ideas.** No generation: positions were computed from each cluster's two ends and looked at. No filler
  (the empty south-west rim was left empty rather than filled with nothing a build weighs). No step-count reach. No
  build list as the basis.
- **§15 How the work is done.**
  - Read first: CONSTRAINTS, the briefs and rounds 1 and 2.
  - Pictures before and after, with close-ups.
  - Geometry after each cluster.
  - Own folder only. No register, bake, commit or stash.
