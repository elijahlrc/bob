# The tree rework: the final report (2026-10-31)

For the owner, after the unattended run. This report makes no changes to the tree. The full log, region by region, is
`R-report.md`; the handoff is `R-state.md`.

## Summary

- **Done:** all five remaining regions (the Spire, the Bow, the Yard, the Wall, the Cathedral) and the centre, rebuilt
  on the approved skeleton. Each one went through plan, structure, notables, build and final review with a reviewer
  agent. Then a joins pass reviewed the borders and fixed eight problems. Then a fresh reviewer did a final review of
  the whole tree.
- **Commits** (local, not pushed): `3835be3` Spire, `ed542d7` Bow, `b52303a` Yard, `70ae190` Wall, `d803ae3` Cathedral,
  `35da117` centre, `e0738f0` joins.
- **Not baked.** The game still loads the old tree. Everything here is in the area files and the generators.
- **The final reviewer's verdict:** the design is ready to bake. The numbers, and the tools that measure them, are not
  yet. Bake after two decisions of yours (loops, border roads), the tidy, naming and flask-stats passes, the save bump
  and the stale tests.

## The regions in a line each

| Region | Class | Notables / keystones | What it is |
| --- | --- | --- | --- |
| The Knife | Shade | 65 / 4 | The opportunist: kill and crit tempo, evasion and dodge, trap and mine counts, dagger spells or attacks, poison, curses. |
| The Spire | Mystic | 64 / 5 | Mana as power: spell and minion damage per 100 mana, mana as energy shield, auras on life, recharge on a kill, element ladders. |
| The Bow | Strider | 57 / 4 | Moving against standing still: Quickened and Elusive gained on events and paid off; flask charges as the attrition lever. |
| The Yard | Reaver | 52 / 3 | The duel up close: block feeds Quickened and fervour, the parrying sword, the stun loop, impale, bleed. |
| The Wall | Vanguard | 49 / 4 | Standing ground: the grit loop, gained on block, stun, kill, mace hits, warcries, hits taken; spent on block, damage, speed, regeneration. |
| The Cathedral | Zealot | 54 / 5 | Consecrated ground: what the Zealot plants works for it (one more brand, regeneration and damage per aura, payoffs while a minion or a totem stands); faith turned to fire and lightning. |
| The centre | none | 8 / 0 | Neutral ground: a junction notable for each pair of neighbours (10-11 steps from both), two at the middle (12 from every start). |

## Whole-tree measures

1,383 live nodes (1,396 before), 349 notables, 25 keystones. 0 crossings, 0 nodes drawn over, 0 unreachable, 0 build
problems. No reference names (`ref-names.ts`); `ip.test.ts` green.

| Class | Notables | Own within 8 / 14 | Any within 14 | Keystones within 14 | Offence / defence / utility (reference) | Sustain lines |
| --- | --- | --- | --- | --- | --- | --- |
| Shade | 65 | 12 / 63 | 97 | 6 | 62/22/17 (61/22/17) | 20 |
| Mystic | 64 | 11 / 61 | 98 | 7 | 59/25/16 (55/23/22) | 25 |
| Strider | 57 | 10 / 54 | 94 | 6 | 58/23/18 (55/24/21) | 27 |
| Reaver | 52 | 9 / 51 | 85 | 5 | 50/35/15 (56/27/17) | 19 |
| Vanguard | 49 | 10 / 46 | 75 | 7 | 45/35/20 (53/33/14) | 11 |
| Zealot | 54 | 9 / 52 | 91 | 8 | 52/28/19 (53/26/21) | 13 |

- **Starts:** neighbours 12 apart everywhere (the reference 12); two apart 18 (22); opposite 20 (26). Every class reaches
  its first own notable at step 5. No weapon pick within 8 steps. Every path to a seam is two nodes and runs through a
  home cluster.
- **Shape:** about a third of the reference's loops (within 15 steps: 29-44 against 90-111); a thin band at steps 9-12
  and a heavy one at 17-20. This follows from the skeleton's side rooms.
- **The Vanguard is the thinnest class** (75 notables within 14 steps against the Mystic's 98; the reference leans the
  same way, less so).

## Strengths

- Intent is legible: each region has a mechanic that changes how you fight, carried by its notables.
- The starts are fixed: generalists at step 5, even distances, every seam path through a cluster.
- Offence, defence and utility within a few points of the reference sector in four regions; the Yard's and the Wall's
  defence lean was argued as identity and accepted.
- No archetype in one place only; shared archetypes have a home on each side of a border.
- Attrition has a voice everywhere: flask charges (the Bow), recovery on events (the Spire, the Knife, the Bow), leech
  and block (the Yard), grit regeneration (the Wall), auras, totems and minions (the Cathedral).

## Risks, ranked

1. **The sheet cannot see many of the new notables.** Its steady-state conditions never assume standing still,
   leeching, energy shield full, blocked or hit recently, channelling, a minion or totem standing, low mana, or any target
   condition. About 19 notables are partly invisible. "While moving" reads as always on and "standing still" as never on,
   so the Bow's axis is inverted. Per-charge lines assume full charges (1-2 grit is the estimate in play). Event buffs
   count as always up. Bot sims and `passives:builds` inherit all of it. Decide before the flask-stats pass: teach the
   sheet (`steadyMask`), or judge those notables by play only.
2. **Sustain inflation.** Sustain lines on notables rose about 45% (mostly flask charges and the new recovery-on-event
   lines), against CONSTRAINTS §16.2 ("about as much as before, probably somewhat less"). The flask-stats pass must cut.
3. **Railing through side rooms.** A third of the reference's loops and a thin middle band could bring back the
   railroading the rework set out to remove. Cross-links between side rooms are cheap to add.
4. **Orphans and thin archetypes:**
   - insight 17 steps and staves 16 from the Mystic;
   - no curses, cold or lightning within 15 of a strength class;
   - claws: two homes;
   - lightning attacks: two homes 29 apart; cold attacks: three homes 32 apart;
   - minions: 10 notables, 6 of them round the Zealot-Mystic border.
5. **The Yard's Fosse rim is overcrowded:** 16 notables over warcries, shields, axes, impale, stun, bleed, auras and
   elemental melee. It is the tree's likeliest spot to read as a filled grid.
6. **Small mechanics:**
   - "+1 trap or mine out at a time" really adds one per throw, roughly doubling a one-trap skill for 4 units.
   - The per-aura lines (Chorus, Choir of Wrath) have no cap: 48-60% damage at four or five auras.
   - A duel kill of a rival's minion rolls no kill gains.
   - Three line kinds are unused.

## What remains before baking

- **Your decisions on loops and border roads** (questions 1 and 2): both move nodes, and the bake fixes node ids into
  saves.
- **Tidy pass:** about 27 label overlaps from the joins pass plus each region's list; worst at the Yard's Fosse rim, the
  Spire's Column, the Knife's Snares and Venom corner. Content tidies:
  - the Yard's repeated melee physical line;
  - about 13 Yard notables of two flat lines;
  - Lingering Momentum's place;
  - three centre side rooms close beside a road.
- **Naming pass:** 14 tree names repeat other names in the game: gems, uniques, bases and monsters, some from before the
  rework. Also:
  - names that clash with stops, relics and provisions (Provisions, Draught, Siphon, Bloodletter);
  - word families (Iron ×9, Ward ×7) and the three Hymns and three Litanies;
  - Withering and Withering Word, Blood Rite and Blood Bargain;
  - Rooted Stance, Blood Rite and Searing Avatar, each sharing a word with a reference keystone of the same mechanic.
- **Flask-stats pass:** every regeneration, leech and flask number is provisional. Also:
  - five near-identical flask notables at steps 5-6;
  - leech on the first node of three neighbouring border roads;
  - the +45% sustain count.
- **Save bump:** `SAVE_VERSION` 24 to 25 with a `migrate` case calling `resetTree` (it also clears the tree relics'
  records); the rivals pool empties for the new version.
- **Tests:**
  - five tree tests fail until the bake (`baked.test.ts`, and four in `keystones.test.ts` that find keystones by their old
    names);
  - "all 21 keystones are in the tree" is stale either way (27 defined, 25 placed; Hollow Vessel and Living Ward are
    still defined);
  - the stale Respite and stop tests keep `npm run check` red, as before;
  - tests for the new engine pieces once the design settles.

## Engine additions (all wired; none covered by a test yet)

- **The Spire:**
  - maximum mana as a per stat;
  - auras reserving life;
  - a `killIgnited` event;
  - energy shield recharge on a kill;
  - chilled enemies dealing less damage.
- **The Bow:**
  - `evade` and `blink` events (escape blinks too);
  - the far-shot distance rule;
  - lines for flask charges, Quickened and Elusive on events, and moving or standing payoffs.
- **The Yard:**
  - event gains asked under the fight's conditions (before, a conditional gain never applied);
  - armour against elemental hits;
  - lines on existing events and conditions.
- **The Wall:**
  - a `warcry` charge event;
  - grit lines;
  - totems on the deploy count;
  - strikes on extra targets.
- **The Cathedral:**
  - conditions `channelling`, `minionsOut` and `totemOut`;
  - an `auras` per stat;
  - `recoverOn` on block;
  - minion regeneration and resistances;
  - one more brand;
  - physical gained as fire for every hit;
  - physical spells converted to lightning.
- **The joins:** minion damage per 100 maximum mana.

## Your questions, with the decision taken in your absence

Ranked by how much each shapes the tree.

1. **Loops against side rooms.** The tree has a third of the reference's loops. *Taken:* the skeleton's side rooms, as
   built. Decide before the bake.
2. **Border roads inward of the mid ring: seam themes, or generic notables only?** The first five regions used the
   skeleton's seam themes; the Cathedral was held to generic only. *Taken:* seam themes stand; Honed Mind and Standing
   Cairns were not moved. Switching would move about 16 placements and 4 keystones.
3. **Insight for casters.** *Taken:* insight lives in the Knife and the Cathedral (staff block, warcry), 17 steps from the
   Mystic; no engine work.
4. **Minion homes.** *Taken:* the Spire's west faces the Cathedral; the Cathedral is one minion partner among three, not
   "the main minion region"; Grave Host stays every summoner's farthest notable (your ruling of 2026-10-20).
5. **The centre.** *Taken:*
   - notables per pair of classes, not all eight equally far;
   - the hexagon and three spokes kept (beyond the skeleton's six inner roads);
   - eight notables;
   - CONSTRAINTS §3 item 8 not yet amended, though the old centre ring is gone.
6. **The strength classes' reach** (warcries 13-14, curses 15+, cold and lightning 16+). *Taken:* left as is.
7. **Two-handers and elemental melee in the Yard.** *Taken:* both kept (a fork between paired steel and full swing;
   Elemental Edge only with a melee hook).
8. **Axes.** *Taken:* a second home, the Wall's Headsman (axes otherwise only on the Yard's rim).
9. **Start sides that differ from the skeleton.** *Taken:* as built: the Yard's west gives global defences with life,
   and the Cathedral's give mana regeneration with life and damage with life.
10. **Cold arrows in the Bow.** *Taken:* kept.
11. **The Mystic's spell block with a shield.** *Taken:* sent to the Cathedral's shields.
12. **The sustain split.** *Taken:* the Yard leans on leech and block; kill recovery goes to the Bow and the Knife.
    Settle in the flask-stats pass.
13. **The Wall at 45/35/20 and the Yard at 50/35/15.** *Taken:* accepted as identity (candidates to shave: Four Winds,
    Scarred Hide).
14. **Unbowed Arm (renamed from a reference keystone's name), and a fifth Wall keystone.** *Taken:* kept, four
    keystones.
15. **4 to 6 links between regions per border** (7-9 before, the reference 10-13). *Taken:* left as is.
16. **One small taken from each of the Knife's, the Wall's and the Cathedral's paths to their seams** (to make every
    neighbouring pair 12 apart). *Taken:* done, reversible.
17. **Copies left in place:** Light Hand against Light Blades, the Bow's shields against the Yard's, Ember Litany against
    Warm Hearth (18 steps apart). *Taken:* left as is.
