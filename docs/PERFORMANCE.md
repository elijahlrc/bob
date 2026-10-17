# The cost of the damage and defence calculation (2026-10-15)

The report: moving gems about in the Skills tab froze the page while it "recalculated". It was measured first, then cut.

## 1. What was slow

On a late run (vanguard, map 44, level 49: 67 gems in the inventory, 15 sockets worn) a gem move froze the page for **873 ms**
(one long task, in the real page, on a saved run). Almost all of it was one thing: the badges beside the gems in the list ("▲ 12% DPS").
`Skills.tsx` worked out, for every gem in the inventory, the sheet of the build with that gem in every socket, and it did so
again after every move, since a move replaces the build: 67 gems times 15 sockets is 1000 sheets, plus one sheet of the build as it
stands for each gem. A sheet is a whole `Character` and its rotation (about 1 ms on this machine).

| a late run, the Skills tab                       | before (the commit before this pass) | after                                                                                                                                                                                      |
| ------------------------------------------------ | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| freeze on a gem move, in the page                | 873 ms in one task                   | no task over 50 ms; the move itself blocks for about 70 ms, of which the calculation is about 15 (the map cards 5, the sheet and the Skills tab the rest) and the rest is drawing the page |
| the badges, 67 gems, 15 sockets                  | 1090 ms, all at once                 | 120 ms, in 8 ms slices after the page is drawn                                                                                                                                             |
| the badges, 48 gems, 11 sockets, no empty socket | 700 ms                               | 450 ms, in slices                                                                                                                                                                          |
| one sheet (`sheetOf`)                            | 1.5 ms                               | 1.0 ms                                                                                                                                                                                     |

(The sheet itself had become slower with the rotation work of docs/SHEET-AUDIT.md: a sheet on a built character took 0.6 ms before it
and 1.4 ms after, and the map cards, which price three offers against every monster variant, 2.6 ms and 5.8. This pass leaves the
sheet at 1.0 ms and the map cards at 3 to 4.)

## 2. What was done

**Fewer sheets** (`src/run/inventoryOps.ts`):

- the sheet of the build as it stands is worked out once for all the gems (`bestPlacements`), not once per gem;
- the badges only try the **empty sockets** when there are any (`emptiesFirst`): what a badge shows is the best place for the gem, and
  an empty socket is preferred over a full one whatever the numbers say (this was already the rule; the sheets of the full sockets
  were worked out and then thrown away);
- a **support in an empty socket of an item with no skill to support** changes nothing (supports link within an item), so it is
  zero without working a sheet out. A test compares it with the long way (`inventoryOps.test.ts`).
- `sheetOf` **remembers sheets by build** (`buildKey`, as the bot's score cache does, and the difficulty). Putting a gem back, or
  asking again, costs nothing: undoing a move recomputes no badge at all.

**Not in the way of the page** (`src/ui/Skills.tsx`): the badges are worked out after a pause (250 ms, so a run of moves does not
start the work each time), in slices of 8 ms that give the page its turn, and cancelled when the build changes again. The badges
already shown stay until their gem is redone.

**Cheaper sheets** (`src/calc/`), none of which changes a number (the sheets of three late builds and every placement of 40 gems
each hash the same before and after; 18 bot runs reach the same maps and levels):

- `ModDB.extend`: a skill's database (and a flask state's) is the character's with a few mods added; it was a copy of every mod,
  compiled again, for each skill of each character. It is now a layer on the one it extends (`modDb.test.ts` holds it to the flat
  one on every query).
- `planRotation` remembers the plans it has made (they depend only on a handful of numbers, and the builds the Skills tab tries
  mostly leave the rotation as it was).
- `utilityLoad`, `secondarySheets`, `triggerSheets` (against the reference monster), `minionDps` and `cloneDps` are remembered per
  character and fight: the sheet, the Skills tab and the main skill's mana each asked for the same thing.
- `resolveActive` remembers a gem at a level (the character copies the skill before it changes it).

## 3. Measuring

- `npm run perf -- --class vanguard --map 44 --seed 2 --save run.json` plays a bot to a late map under the easy difficulty and
  times one `Character`, one sheet, the Skills tab's badges as they were and as they are, the map cards and the Items tab's hints;
  `--load run.json` reuses the run. The numbers are the best of three rounds (the machine is rarely quiet).
- `node --import tsx --cpu-prof scripts/perf-calc.ts --load run.json --only sheet --reps 3000` writes a `.cpuprofile` of nothing but
  sheets (the loading of the modules would otherwise be half of it).
- In the page: seed a save into `localStorage['bob.save']`, open the Skills tab, and watch the gaps of a 5 ms timer while moving a
  gem (`requestAnimationFrame` is throttled in a hidden pane: do not time with it).

## 4. Open

- A sheet is about 1 ms: a `Character` is 0.5 ms (its mods, compiled, are the largest part) and the sheet 0.5. The rest of the cost
  is spread thin (`ModDB.sum`, building each skill's profile, `steadyMask`); a character that shares its compiled static mods with
  the hypothetical ones that differ from it in one item would be the next large step.
- The Items tab (`itemInfos`, `compareSlots`) tries every inventory item in every slot on each change: about 1.2 ms an item, 14 ms
  for the 12 the bot keeps, more for a full bag. It was not what was reported, and is the same shape of problem.
- The badges of the Skills tab still do the full work for a build with no empty socket (450 ms in slices on one of the three runs).
  A cheaper test of where a gem could matter (an active skill needs no supports, a support needs an active in its item) would
  prune most of those.

## 5. The sim's actors: 88 properties, and the limit of 128 (2026-10-16)

**The limit.** An object made from a literal of 128 or more properties is built much more slowly by V8 than one of 127 (the fast,
struct-like layout is kept below that size), and every actor was made from such a literal. `newActor` (`src/sim/actor.ts`) made every actor, so that the sim's hot
loops read one shape, from one literal of **127 properties** (128 with `side`). Adding `side` inside the literal (in any position) made
the sim about 15% slower (twelve bot runs to map 10: 17.7 s with 127 properties, 20.5 s with 128), and a small benchmark showed the
same cliff (creation and reads of an object of 128 properties several times slower than of 127). The same property set **after** the
literal cost nothing (17.9 s), which is how `Actor.side` was added, with an `Omit` and a comment. What the cliff comes from inside V8
was not looked into. Being one field from it was a trap for everyone who touched `Actor`.

**What was done.** `Actor` is smaller: fields that are one thing are one sub-object each, made in `newActor` by one small literal each
and never shared between actors (`MonsterStats` in `mon` is cached and shared, so nothing mutable goes there). About 40 properties
fewer, 128 to 88 (measured with `Object.keys`: an actor 128 to 88, a monster from `spawnMonster` 128 to 88, a minion from `makeMinion`
131 to 91, a `Side` 74 and unchanged):

| Group      | Holds                                                                                                                          |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `since`    | seconds since: `kill`, `crit`, `hit`, `flask`, `stunEnemy`, `block`, `beenHit`, `overload`, `damaged`                          |
| `leech`    | the leech queues: `life`, `es`, `mana`                                                                                         |
| `resShift` | `v` (resistance shift per damage type) and `t` (its time left)                                                                 |
| `home`     | `x`, `y`                                                                                                                       |
| `chase`    | the chase and patrol-walk bookkeeping: `blockT`, `prevX`, `prevY`, `tryTick`, `pathT`, `nextX`, `nextY`                        |
| `patrol`   | `points` and `i`; the whole field is `null` for a monster that does not patrol                                                 |
| `dash`     | `t`, `windT`, `v`, `x`, `y`                                                                                                    |
| `mark`     | `x`, `y`                                                                                                                       |
| `retreat`  | `t`, `cd`                                                                                                                      |
| `mirror`   | `id`, `t`                                                                                                                      |
| `theft`    | `fleeT`, `stolen`, `stolenFlask`                                                                                               |
| `choir`    | `buffT`, `zealT`, `fervour`, `fervourT` (the Choir's aura, boost and stacks; `Side` has its own `buffT` and `chargeT.fervour`) |
| `rhythm`   | `beat`, `restT`, `patMult`, `enraged`                                                                                          |
| `hex`      | the totals of the hexes: `res`, `vuln`, `vulnAll`, `dmg`, `speed`, `more`, `cd` (`hexes`, the list, stays flat)                |

The hot fields stay flat (`x`, `y`, `life`, `es`, `mana`, `def`, `action`, `ail`, `mv`, `fx`, the single timers). `since.damaged` is read
for every actor every tick (`tickActor`, the energy shield recharge); one indirection cost nothing that the fence could see.
With `Actor` at 88, `side` is now in the literal and the `Omit` is gone.

**The test.** `src/sim/actor.test.ts` keeps `Object.keys` of an actor, a monster and a minion at 100 or fewer, and of a `Side` at 94
or fewer (74 when measured), with the reason for 128 in a comment. An actor is 40 properties from the cliff and 12 from the test, so
the test fires long before the cliff; a side has 20 to spare. When it fails, group the new field with the ones it belongs with, or start
a group, rather than raise the limit.

**What a group costs the code that copies actors.** A group is one object, so a copy that shares it shares what is in it. `standIn`
(`actor.ts`) is the `Object.create(character)` that a deployable fires as: what it sets on itself used to stay on it, so it now owns a
copy of `since` (the one group a hit writes on its source). A test that copies an actor with a spread (`shapes.test.ts`) copies the
groups. New code that clones an actor does the same; the compiler cannot see it.

**Measured** (the wall time of the default `npm run fence`, 12 bot runs to map 10; `npm run perf` times the calculation only). On the
unchanged tree (after F1): 22.2, 22.3, 22.4 s (cpu 32.7 to 33.0 s). After the `since` row alone: 21.8, 22.3, 22.0 s. Moving `side`
into the literal, three runs before and three after: 21.0, 21.7, 23.1 s and 21.7, 22.0, 23.4 s, which is noise (a 2 s spread), so the
two forms were run alternately, four times each: old 22.6, 21.9, 27.5 (a loaded machine), 21.5 s; new 21.5, 22.1, 22.3, 21.7 s, and
the same cpu time. The finished tree: 21.4, 21.8, 21.4 s (cpu 30.8 to 31.4 s), no slower than before and probably about 3% faster, which
is what the extraction of the sides (F1) cost.

- After the whole extraction (F1) the fence took about 3% longer than before it (21.2 to 21.7 s on main, 21.4 to 23.0 s on the
  branch). The profile has no one cause: the per-side loops of `stepWorld` and the `a.side` reads are spread thin. Indexed loops in
  place of `for...of` were inside the noise.
- The measure for a change to the sim's structure is the wall time of `npm run fence`, and its hashes are the proof that no number
  moved (docs/DUEL.md 8.1): the groups were made one commit at a time, each with the default and the `--deep` fence identical.
