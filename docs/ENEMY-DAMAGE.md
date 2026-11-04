# Enemy damage: types and delivery

Plan, 2026-11-04, built the same day as a first pass (10). The decisions are in 9; the numbers have not been seen by the owner.

## 1. The ask

The owner, 2026-11-04: move the monsters' damage to about **50% elemental and 20% chaos** (so about 30% physical), the chaos
concentrated on some types as a challenge to pure energy shield builds; and add projectile, beam and area attacks until
**melee is about 40% of the damage**. Make the types more distinct on the way, each by its theme and by the build it tests.

## 2. Where it stands

`npx tsx scripts/damage-mix.ts --types` adds up each monster's raw damage a second (before the character's defences) over
every map offered at every level, 20 runs, weighted by how many of each spawn. Bosses and the monsters they summon are left
out. Melee and the warned area attacks are flattered, because it counts every monster as attacking all the time.

| Maps | Physical | Lightning | Cold | Fire | Chaos | Melee | Projectile | Area | Beam |
| ---- | -------- | --------- | ---- | ---- | ----- | ----- | ---------- | ---- | ---- |
| all  | 63%      | 5%        | 10%  | 15%  | 8%    | 55%   | 9%         | 30%  | 6%   |

The deaths (telemetry, 1,104 deaths) agree. 65–73% of the damage that kills is physical, which is the raw mix seen through
the defences players have when they die: about 30% elemental resistance, 0% chaos resistance, little armour.

Why it is so physical:

- **Only the Ossuary rolls elements.** Every other faction's types are `innate`: they never roll a variant. Their only
  elemental damage is the 2–4% from magic and rare mods.
- **A few physical heavy hitters carry the middle and late game.** Sentinel 13% of all damage (95% physical), Flagellant
  12% (88%), Gilded Guard 5% (87%), Kennel Hound 5% (86%).
- **Elemental damage is a handful of types.** Slag Brute, Cinderling and Slagworm (fire), Wailer (cold), Core Golem, and the
  skeleton variants.
- **Lightning is 4–5%** from map 11 on.

## 3. The shape of the proposal

**Every faction gets a damage identity** that matches its theme, and one or two types that break it. A theme on an offer
then says what it mostly threatens, while a pack can still hold a surprise.

| Faction   | Identity                                  | Off-identity types                                                              |
| --------- | ----------------------------------------- | ------------------------------------------------------------------------------- |
| Ossuary   | bone, with the crypts' three elements     | Skeleton Mage (an element and chaos), Charnel Heap (chaos)                      |
| Rot       | **chaos** (the energy shield test)        | Bloater: its gas ignites (fire)                                                 |
| Swarm     | bites (physical), and venom (chaos)       | Silkspinner: chilling webs (cold)                                               |
| Hollow    | cold and chaos, cast                      | Mana Wisp (lightning)                                                           |
| Choir     | burning zeal (fire), the bell's lightning | Hexer: curses (chaos)                                                           |
| Reliquary | lightning, the relics' charge             | Arbalest (physical), Core Golem (every element)                                 |
| Kennel    | **physical** (the armour test)            | Kennel Hound: breeds of frost and fire                                          |
| Gilded    | steel (physical)                          | Bursar: the tithe (chaos); Gilt Slinger: molten gilt (fire)                     |
| Drowned   | cold, and drowning (chaos)                | Tidecaller: the storm (lightning)                                               |
| Emberborn | fire                                      | Slagworm: molten stone (part physical); Pyre Priest: burning souls (part chaos) |

**Chaos is concentrated, not sprinkled.** It sits in the Rot, the Drowned's Leech and Wrack, the Hollow's Gloomstalker and
Watcher, the Hexer, the Bursar, the Bat and the Nest. An energy shield build meets it on particular offers, where it can see
the threat and choose.

**Chaos grows as energy shield builds do, by who turns up, not by a type changing with the level** (the owner, 2026-11-04).
A type deals the same split on every map. What rises:

- **The Rot comes in force later.** Rot-led themes are offered about half as often as now before map 20, and more often from
  map 40: a weight by map, as the Ossuary's themes already have (`themeWeight`). The projection takes the Rot at ×0.5 on
  maps 1–10, ×0.6 on 11–20, ×1 on 21–40, ×1.6, ×1.8 and ×2 after.
- **Blighted skeletons from map 41:** a fourth skeleton variant beside burning, frozen and storm, converting to chaos. The
  Ossuary is 15% of every theme, so it reaches all of them.
- **A blight breed of Kennel Hound from map 41,** beside frost and fire.

**Spells are the evasion test.** Evasion only stops attacks. The Hollow's, the Choir's and the Drowned's casters, and the
lightning moved onto the Sentinel's nova, can't be evaded.

**Mostly no new machinery.** Most changes are levers a type already has:

- a conversion mod on the type (`convert.physical.<type>`);
- dropping `innate` so the type rolls element variants, or the variant's conversion (60%) and chance (`ELEMENT_WEIGHTS`);
- the sidearm's `every`, `minLevel` and `convert`;
- the attack `shape`;
- an existing ability: a Bloater's `burst`, given to the Cinderling.

New: a weight by map for the Rot's themes, the chaos variant and breed (a variant that only appears from a level), and the
slowing curse of 5.

## 4. Type by type

The damage split is physical / lightning / cold / fire / chaos, and delivery is melee / projectile / area / beam, in
percent. Types not listed keep what they have. The share is of all monster damage today. The file
`scripts/damage-mix-proposal.json` holds the same numbers.

| Type                                | Share | Now: damage      | Proposed                                   | Now: delivery | Proposed   | How                                                                                        | It tests                              |
| ----------------------------------- | ----- | ---------------- | ------------------------------------------ | ------------- | ---------- | ------------------------------------------------------------------------------------------ | ------------------------------------- |
| **Ossuary**                         |       |                  |                                            |               |            |                                                                                            |                                       |
| Skeleton Warrior                    | 5.0%  | 61/12/11/12/4    | 40/18/18/18/6; 30/13/13/14/30 from map 41  | 85/15/0/0     | 60/40/0/0  | more variants, stronger conversion, blighted from map 41; Bone spear sooner and more often | resistances, early                    |
| Skeleton Brute                      | 2.1%  | 61/12/11/12/4    | 45/15/15/15/10; 35/12/12/11/30 from map 41 | 76/0/24/0     | 55/0/45/0  | the same; Stamp from early maps                                                            | not standing in melee                 |
| Skeleton Archer                     | 0.9%  | 63/11/12/11/3    | 40/18/18/18/6; 30/13/13/14/30 from map 41  | projectile    | unchanged  | more variants                                                                              | evasion, block                        |
| Shieldbearer                        | 0.5%  | 63/10/11/12/3    | 65/10/10/10/5                              | melee         | unchanged  | stays a physical wall                                                                      | armour                                |
| Charnel Heap                        | 0.7%  | 62/11/11/12/4    | 35/0/0/0/65                                | area          | unchanged  | a heap of rot: chaos conversion                                                            | energy shield                         |
| **Rot** (met ×0.5 early to ×2 late) |       |                  |                                            |               |            |                                                                                            |                                       |
| Shambler                            | 4.9%  | 57/3/4/3/34      | 40/0/0/0/60                                | 92/0/8/0      | 55/0/45/0  | conversion 30%→60%; Bile retch more often                                                  | chaos resistance                      |
| Gorger                              | 2.0%  | 73/3/4/3/18      | 20/0/0/0/80                                | 83/17/0/0     | 65/25/10/0 | chaos conversion; Gobbet more often                                                        | energy shield                         |
| Spitter, Carrion Hag                | 1.2%  | 44/2/3/2/48      | 15/0/0/0/85                                | area          | unchanged  | conversion 50%→85%; the Spitter's bile slows (5)                                           | ground avoidance, chaos, being slowed |
| Bloater                             | 0.3%  | 86/3/4/3/4       | 20/0/0/70/10                               | melee (burst) | area       | its burst becomes a gas that ignites                                                       | killing it at range, fire             |
| **Swarm**                           |       |                  |                                            |               |            |                                                                                            |                                       |
| Carrion Bat                         | 1.3%  | 54/3/3/2/39      | 45/0/0/0/55                                | melee         | unchanged  | conversion 40%→55%                                                                         | energy shield                         |
| Nest                                | 0.1%  | 27/3/3/3/64      | 10/0/0/0/90                                | —             | unchanged  | conversion                                                                                 | reach                                 |
| Silkspinner                         | 0.0%  | 44/2/3/2/48      | 10/0/60/0/30                               | area          | unchanged  | cold webs that slow (5)                                                                    | cold, being slowed                    |
| **Hollow**                          |       |                  |                                            |               |            |                                                                                            |                                       |
| Gloomstalker                        | 3.9%  | 56/11/19/10/4    | 15/0/25/0/60                               | 93/7/0/0      | 70/30/0/0  | a shadow blade: chaos and cold; Shade more often                                           | a life buffer against a burst         |
| Mana Wisp                           | 2.3%  | 60/11/15/11/3    | 10/75/5/5/5                                | 87/13/0/0     | 40/20/40/0 | lightning conversion; its pop counts as area                                               | lightning resistance                  |
| Hollow Watcher                      | 0.8%  | 89/3/3/3/3       | 10/0/20/0/70                               | beam          | unchanged  | a chaos gaze                                                                               | energy shield, line of sight          |
| **Choir**                           |       |                  |                                            |               |            |                                                                                            |                                       |
| Flagellant                          | 11.7% | 88/3/2/3/4       | 30/5/0/60/5                                | 67/0/0/33     | 45/0/0/55  | burning zeal: fire conversion; Lash more often                                             | fire resistance; sidestepping a line  |
| Hexer                               | 1.3%  | 89/2/2/3/4       | 10/0/0/0/90                                | projectile    | unchanged  | its bolts become chaos curses                                                              | energy shield                         |
| Censer-bearer                       | 0.3%  | 81/3/2/10/4      | 30/0/0/70/0                                | 92/0/8/0      | 60/0/40/0  | fire chain; Coals more often                                                               | fire, ground                          |
| Choirmaster, Tolling Bell           | 0.2%  | ~88 physical     | 10/80/0/10/0                               | —             | unchanged  | lightning (the Tollkeeper's bell is lightning already)                                     | lightning resistance                  |
| **Reliquary**                       |       |                  |                                            |               |            |                                                                                            |                                       |
| Sentinel                            | 13.0% | 95/1/1/1/2       | 30/65/0/0/5                                | area          | unchanged  | its nova discharges lightning; the slam stays physical                                     | lightning; spells can't be evaded     |
| Arbalest                            | 1.7%  | 89/2/3/3/3       | 60/35/0/0/5                                | beam          | unchanged  | a charged bolt                                                                             | block, line of sight                  |
| Core Golem                          | 4.9%  | 35/19/18/24/4    | 30/22/22/22/4                              | 78/22/0/0     | 40/20/40/0 | its blow becomes a slam                                                                    | stepping out of a warning             |
| Warden Pylon                        | 0.0%  | none (no attack) | 10/85/0/0/5                                | —             | area       | gains a warned pulse that slows (5)                                                        | being slowed near what it shields     |
| **Kennel**                          |       |                  |                                            |               |            |                                                                                            |                                       |
| Kennel Hound                        | 4.6%  | 86/3/4/3/5       | 40/10/20/25/5; 35/5/20/20/20 from map 41   | melee         | unchanged  | breeds: it rolls element variants, frost and fire most, blight from map 41                 | resistances on a fast chaser          |
| **Gilded**                          |       |                  |                                            |               |            |                                                                                            |                                       |
| Gilded Guard                        | 5.3%  | 87/3/3/3/4       | 65/10/10/15/0                              | 87/13/0/0     | 65/35/0/0  | Weighted chain more often                                                                  | armour, not meleeing its counter      |
| Gilt Slinger                        | 1.2%  | 88/3/3/3/3       | 35/0/0/60/5                                | projectile    | unchanged  | molten gilt: fire conversion                                                               | fire, evasion                         |
| **Drowned**                         |       |                  |                                            |               |            |                                                                                            |                                       |
| Brine Leech                         | 2.8%  | 53/3/3/3/38      | 20/0/0/0/80                                | melee         | unchanged  | conversion 40%→80%; its bite slows (5) in place of its chill                               | energy shield, being slowed           |
| Wrack                               | 2.1%  | 71/4/19/2/4      | 20/0/35/0/45                               | 81/18/0/0     | 55/45/0/0  | cold and drowning; Brine clot more often                                                   | cold, energy shield                   |
| Drowner                             | 1.7%  | 87/3/3/4/3       | 25/0/70/0/5                                | area          | unchanged  | cold conversion                                                                            | cold resistance                       |
| Tidecaller                          | 0.2%  | 87/3/4/3/3       | 10/75/5/0/10                               | beam          | unchanged  | the storm: lightning conversion                                                            | lightning, being held                 |
| **Emberborn**                       |       |                  |                                            |               |            |                                                                                            |                                       |
| Cinderling                          | 3.8%  | 0/2/3/92/4       | 0/0/0/95/5                                 | melee         | 40/0/60/0  | the Bloater's burst: it bursts on contact                                                  | killing it at range                   |
| Slagworm                            | 1.5%  | 0/3/4/90/4       | 45/0/0/55/0                                | area          | unchanged  | molten stone: part of the fire stays physical                                              | armour against fire's faction         |
| Pyre Priest                         | 0.3%  | 0/2/3/90/4       | 0/0/0/60/40                                | area          | unchanged  | burning souls: part chaos                                                                  | energy shield                         |

## 5. Slows

Chill is a weak slow (at most 30%, and anything that keeps chill off keeps it off). The owner, 2026-11-04: add stronger
slows that are not chill, to attacks where they fit the theme; a curse is fine.

**A slowing curse.** Monsters already curse the character (the Hexer's four hexes, `HEX_IDS`): one more hex, a heavy
movement slow for a few seconds, put on by the attacks below. Being a curse, it has the curse answers: reduced effect of
curses on you, the Unbinding flask, the hex ward. Its strength, length and name are to choose.

The character carries one monster curse at a time (`BASE_HEX_LIMIT` 1), so the slow and a Hexer's curse push each other off.

| Type         | What slows                                                       |
| ------------ | ---------------------------------------------------------------- |
| Spitter      | its bile: a hit, or standing in the pool it leaves               |
| Silkspinner  | its web: the shot, or standing in the web (the web's chill goes) |
| Warden Pylon | a new attack: a warned pulse around it every few seconds         |
| Brine Leech  | its bite (in place of the chill it has now)                      |

Others that slow by chill today and could move to the curse: the Kennel Handler's net, the Cutpurse's burrs, the Wrack's
blow.

## 6. What it adds up to

`npx tsx scripts/damage-mix.ts --proposal scripts/damage-mix-proposal.json` applies the table above to today's roster (the
same damage per type, split the new way, the Rot met as often as 3 says):

| Maps   | Physical | Lightning | Cold | Fire | Chaos | Melee | Projectile | Area | Beam |
| ------ | -------- | --------- | ---- | ---- | ----- | ----- | ---------- | ---- | ---- |
| 1-10   | 42%      | 12%       | 12%  | 13%  | 21%   | 54%   | 28%        | 18%  | 0%   |
| 11-20  | 35%      | 10%       | 18%  | 15%  | 21%   | 53%   | 20%        | 21%  | 6%   |
| 21-40  | 33%      | 14%       | 13%  | 21%  | 19%   | 44%   | 15%        | 33%  | 9%   |
| 41-60  | 31%      | 15%       | 11%  | 20%  | 22%   | 42%   | 12%        | 37%  | 9%   |
| 61-80  | 31%      | 14%       | 11%  | 20%  | 24%   | 42%   | 13%        | 37%  | 8%   |
| 81-100 | 30%      | 15%       | 11%  | 21%  | 24%   | 41%   | 12%        | 39%  | 8%   |
| all    | 31%      | 14%       | 11%  | 21%  | 23%   | 41%   | 12%        | 38%  | 8%   |

Today maps 1–10 are 60% physical, 26% elemental and 13% chaos. Their chaos now comes from the Skeleton Mage, the Bat and the
little Rot there is; the chaos from map 41 on comes from the Rot in force and the blighted skeletons and hounds.

## 7. What it does to difficulty

The raw damage stays the same; what reaches the character changes.

- **A character with resistances takes less.** At the defences players die with (30% elemental, 0% chaos, little armour), the
  same raw damage lands about 7% lighter. At 75% elemental it lands about 20% lighter.
- **Energy shield builds take more**, because chaos goes past energy shield to life, and chaos goes from 8% to about 23%, most of it late.
- **Armour matters less**, with half the physical it faces today.

No damage is added back (9): resistances count for more instead.

## 8. Measuring

- **Before building:** `scripts/damage-mix.ts` with the proposal file, as in 6.
- **After building:** `scripts/damage-mix.ts` without it, to read the real mix.
- **Deaths:** the telemetry, after a week of play. A death record names a hit by its largest type, so mixed hits read
  more physical than they are. Recording each hit's split would make the comparison exact.

## 9. Decisions and open questions

Decided by the owner, 2026-11-04:

- Melee is measured as a share of damage.
- No damage added back for resistances; resistances count for more.
- Maps 1–10: the first draft's mix was close, with too much chaos.
- The faction identities stand, with more fire, and one or two types in each faction that deal another type.

- More chaos later, as energy shield builds grow; by who turns up (the Rot in force later), never by a type dealing a
  different split as the level rises.
- Stronger slows that are not chill, on the Spitter, the Silkspinner, the Warden Pylon and the Brine Leech; a curse is fine.

Open:

- Bosses are not the focus (the owner): where it was easy, they join. Their soldiers now roll variants like their kind.
- The Mire's strength, length and name are a first pass; whether the Handler's net, the Cutpurse's burrs and the Wrack join.
- The Plague variant (skeletons, hounds and guards from map 41) is a new kind that appears from a level, not existing
  monsters changing: is that within the rule above?
- Melee stays above the target (10).

## 10. Built (2026-11-04)

What was built, and what `npx tsx scripts/damage-mix.ts` measures now (20 runs, every map offered, bosses left out):

| Maps   | Physical | Lightning | Cold | Fire | Chaos | Melee | Projectile | Area | Beam |
| ------ | -------- | --------- | ---- | ---- | ----- | ----- | ---------- | ---- | ---- |
| 1-10   | 47%      | 11%       | 12%  | 14%  | 17%   | 66%   | 18%        | 16%  | 0%   |
| 11-20  | 40%      | 10%       | 19%  | 16%  | 15%   | 62%   | 15%        | 16%  | 7%   |
| 21-40  | 37%      | 12%       | 15%  | 22%  | 14%   | 48%   | 13%        | 32%  | 8%   |
| 41-60  | 33%      | 12%       | 13%  | 24%  | 17%   | 42%   | 10%        | 39%  | 9%   |
| 61-80  | 32%      | 12%       | 13%  | 22%  | 21%   | 47%   | 11%        | 35%  | 7%   |
| 81-100 | 33%      | 12%       | 12%  | 23%  | 20%   | 46%   | 10%        | 36%  | 8%   |
| all    | 33%      | 12%       | 13%  | 23%  | 20%   | 47%   | 10%        | 36%  | 7%   |

The damage types land on the targets. Where it differs from section 4:

- **Conversions** as in 4, by mods on the types. The Sentinel's nova turns 90% to lightning and its slam stays physical,
  so it is 58% physical in all (the slam is a big part of what it deals).
- **Variants:** skeletons, Kennel Hounds and Gilded Guards roll them; 35 plain in 95 (was 55 in 100), converting 75% (was
  60%). **Plague**, the chaos variant, rolls from area level 41 (weight 25; `CHAOS_VARIANT_FROM`).
- **The Rot later:** its themes weigh 0.5 until map 20, 1 by map 40, 2 by map 80, in proportion to the Rot's share of the
  theme (`themeWeight`). The Rot is in nearly every offer set from map 4 anyway (an offer set prefers three leading
  factions, and there are few that early), so this moves less than projected; the Shambler converts 40% to chaos, not the
  60% of 4, to keep the early chaos down. Chaos rises from 15–17% on maps 1–40 to 20–21% from map 61.
- **Delivery:** Bone spear, Stamp (from map 4), Bile retch, Gobbet, Shade, Coals, Lash, Weighted chain and Brine clot come
  more often; the Brine Leech spits (Brine spit); the Core Golem slams; the Bloater's gas ignites and the Cinderling bursts
  into flame on contact (`BURSTS`); more archers, mages and spitters, fewer warriors and shamblers (`TYPE_WEIGHTS`).
  **Melee stays at 47%, 66% on maps 1–10:** a sidearm every few seconds cannot outweigh a blow every second, so the early
  skeleton brawlers stay mostly melee. What would move it further is the open question of 9.
- **The Mire** (`mire` in `HEXES`, not in `HEX_IDS`): 40% to 50% less movement speed by area level, 3 s, renewed by a pool
  as it runs low. From the Spitter's and the Silkspinner's hits and pools (the web no longer chills), the Brine Leech's bite
  (in place of its chill) and the Warden Pylon's Stasis pulse (every 5 s, 4 tiles, warned).
- **Bosses:** the Siege Marshal's regiments roll variants like their kind (a boss's own pieces, the Magistrate's witnesses
  and the Unmaker's shard, do not); his card's mix is 30% physical now.
