# Fourth round: the thin specializations, the open one-stop shops, and a centre for the dagger caster (2026-10-20)

What you asked for:

- Implement the round-3 audit's proposals (`audit/round3/`): the specializations without enough clusters, and the
  one-stop shops still open.
- Add a centre for "the dagger wielding magic user" in the dex/int part of the tree.
- On space: compact clusters (identical smalls clumped together read well), and do not hesitate to add highways or
  enlarge the map. On tools: placing and checking nodes with scripts is fine; the care goes into what each node is.

Then, from your answers to the four questions:

- channelling: add both clusters;
- your Strider: the fire-bow cluster, the same pairings and the projectile rim (not the Close Quarters spur);
- Grave Host: keep it far;
- the dagger caster: add a third cluster.

All are done (the last section).

Checks: audit 0 problems, 0 edge crossings, names test passing, `tsc` clean, 54 new ids registered. Single-access spots
5 (was 6). 955 to 1009 nodes, 187 to 201 notables. Nothing is committed.

Maps (redrawn): `D-all-nodes.png`, `D-all-nodes-text-north.png` and `D-all-nodes-text-south.png` (the south box now
reaches y 4750 for the new rim road), `D-<class>.png` and `D-<class>-text.png`. Some new notable names overlap others
on the maps (Athame and Long Knives); labels wait for the last pass.

---

## New lines

| Line                | What it is                                                          | Unit |
| ------------------- | ------------------------------------------------------------------- | ---- |
| `physSpell`         | physical damage with spells, the twin of `chaosSpell`               | 12%  |
| `damageVsCursed`    | damage against cursed enemies                                       | 8%   |
| `daggerSpellDamage` | spell damage while wielding a dagger, the twin of `wandSpellDamage` | 8%   |
| `daggerSpellCrit`   | spell crit chance while wielding a dagger                           | 15%  |

The sheet check (§10.3) was a throwaway test, built and deleted: a character with the line, against one without.

| Line                     | Result                                                                                                                                                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `physSpell` 100%         | Orbiting Blades and Judgement Tempest doubled. Physical increases follow the part of a spell that converts to an element: the engine keeps each converted chunk's physical ancestry. Sudden Frost (cold) unchanged. |
| `damageVsCursed` 100%    | +94% while the build casts Feeble Grip, nothing without it                                                                                                                                                          |
| `daggerSpellDamage` 100% | Doubled with a dagger, nothing with a sword                                                                                                                                                                         |
| `daggerSpellCrit` 100%   | Spell crit 7.8% to 13.8% with a dagger, unchanged with a sword                                                                                                                                                      |

In the fight, the conditions are the ones the old tree already used: `targetCursed` is per enemy (`sim/combat.ts`), and
`wieldingDagger` is static.

Channelling's line (`channelDamage`) came in the second half (the last section).

---

## The thin specializations

| Specialization    | New cluster         | Where                                           | Lines                                              | Steps from starts      | Its twins                                                    |
| ----------------- | ------------------- | ----------------------------------------------- | -------------------------------------------------- | ---------------------- | ------------------------------------------------------------ |
| Curses (str)      | **Grim Oath**       | the Wall, off the road to Battle Hymn           | curse effect, armour                               | Zealot 21, Vanguard 22 | Hexwright 39, Second Curse 39                                |
| Curses (dex)      | **Marked Prey**     | the Fosse, the Yard's new south road            | curse effect, damage against the cursed            | Strider 19, Reaver 23  | Second Curse 30, Hexwright 37, Grim Oath 40                  |
| Physical spells   | **Whetted Will**    | the Rooftops, off the seventh road node         | physical spells, duration                          | Shade 19               | Shattering Rite 33                                           |
| Physical spells   | **Shattering Rite** | the Crypt stair, beside Tomb Dust               | physical spells, elemental damage                  | Zealot 19, Mystic 22   |                                                              |
| Lightning attacks | **Stormstruck**     | the Fosse                                       | lightning attacks, attack speed                    | Strider 16, Reaver 20  | Static Edge, Overcharge (no lightning-attack cluster before) |
| Traps             | **Snare Line**      | the Spire's north-east rim                      | traps, duration                                    | Shade 24, Mystic 25    | Trapper 21, Tripwire 23                                      |
| Traps             | Trapper re-lined    | the Docks wheel                                 | traps, trap area (was traps, throwing speed, area) |                        | Tripwire keeps throwing speed                                |
| Daggers (attacks) | **Long Knives**     | the Athame wheel (below)                        | daggers, dagger speed, dagger accuracy             | Shade 17               | Fine Point 11                                                |
| Spell block       | **Stone Ward**      | the Barrows, under War Drums                    | spell block (any build), life on block             | Vanguard 17, Reaver 21 | Spirit Ward 34, Glass Wall 37                                |
| Dual wield (str)  | **Two Fists**       | the Barrows, between Greatweight and Long Reach | dual wield, armour                                 | Vanguard 18            | Twin Fangs 31, Crossed Blades 31                             |

Walks:

| Build                                                                       | Before                              | Now                                                                                                                                                                                                                                            |
| --------------------------------------------------------------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A Reaver with a lightning sword                                             | first lightning notable at point 69 | Stormstruck at 29                                                                                                                                                                                                                              |
| A Vanguard mace curser                                                      | nothing within 24 steps             | Weight of Iron 10, Grim Oath 24, Hallowed Hammer 27                                                                                                                                                                                            |
| A Strider who curses on hit                                                 | Second Curse at 15, then nothing    | Marked Prey 19, Second Curse 34                                                                                                                                                                                                                |
| A Shade trapper                                                             | done at 21                          | Trapper 12, Tripwire 17, Snare Line 35                                                                                                                                                                                                         |
| A late Reaver lightning dual-wielder (90 points, out of targets before 120) |                                     | Keen Edge 7, Elemental Edge 13, Stormstruck 29, Marked Prey 35, Light Blades 40, Twin Fangs 47, Crossed Blades 53, then a long walk to Static Edge (78), Overcharge (84) and Thunderhead (90). The late element trip is still a real decision. |

### Where this differs from the audit's proposals

- **The Fosse (a new road).** The audit hung the dex curse off the Muster's road to the Pits, and lightning attacks off
  the Pits junction, which already had five links. The Yard's south is full to the rim there: Wound Dance's spur, Shield
  Bash and Spellsword. So a new outer road runs round the Yard's south rim instead. It has seven attribute nodes from
  the Pits' east junction to Barrow Ward, with the two pockets off it. Barrow Ward becomes a way through, and the Yard and
  the Wall gain a road between them. The map grew about 500 units south.
- **Whetted Will is off the seventh Rooftops node, not the second,** so the physical caster's pocket is not one road
  node from the dagger caster's wheel (9 steps apart now).
- **The late dagger cluster is inside the dagger wheel,** not a separate pocket off the fifth Rooftops node (below).
- **No extra claw cluster.** It was optional once Carrion Claws went to the Rooftops.
- **Lingering is unchanged.** Rotting Word was already re-lined off duration in round 3.

---

## The dagger caster's centre

**Athame** is a wheel of six in the middle of the Knife, the empty ground inside the Rooftops loop, between the
Rookery's two keystone spurs. It is entered from the rooftop road at the top. At the bottom it leaves to the Rookery's
junction, so the Knife's centre is now a way through, not only a destination.

| Node                          | Lines                                                                                  |
| ----------------------------- | -------------------------------------------------------------------------------------- |
| The two ends                  | 20% crit chance, which every dagger build wants                                        |
| The west side, the caster's   | spell damage with a dagger, then **Athame**: spell damage and spell crit with a dagger |
| The east side, the attacker's | dagger damage, then **Long Knives**: daggers with speed and accuracy                   |

The route through takes one side. A dagger caster and a dagger attacker are different builds, so the sides are a real
choice (§8.3).

A first version had a spell-crit notable (Glint) on the east side. The walk bought Athame at point 20 and Glint at 21:
two notables one build wants, on the two sides of one circle, which is the pattern you struck. The attacker's side
replaced it.

| Build                              | Notables                                                                          |
| ---------------------------------- | --------------------------------------------------------------------------------- |
| Dagger caster with physical spells | Quiet Knife 7, Athame 20, Whetted Will 27, then the Crypt's Shattering Rite at 53 |
| Dagger attacker                    | Fine Point 7, Long Knives 18                                                      |

The dagger caster now has Quiet Knife near the start (with cast speed) and Athame in the centre (with crit), 16 apart.

---

## The one-stop shops

| Shop                                   | Fix                                                                                                                                   | Result                                                                                                                                                                                                                                                 |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| The two-handed mace in the Barbican    | Greatweight re-lined to two-handed damage with strength (was stun). The crit chain's link to the Greatweight wheel is cut.            | Greatweight to Crushing Blow 4 → 10, to Stagger 8 → 12. Stun now lives at Weight of Iron (mace) and Headsman (two-hander).                                                                                                                             |
| Sword and board in the Muster          | The Light Blades pocket's link to the blades junction is cut                                                                          | Keen Edge to Light Blades 3 → 8; no start distance changed                                                                                                                                                                                             |
| The Shieldwall spur                    | The keystone hung straight off the small that joins Elemental Edge and the Executioner chain. A dead-end small now sits between them. | The spur is a dead end again (§9.1). This is smaller than the audit's fix (a road node round the spur): that corner has seven nodes within 300 units. The leech route still crosses the shield block smalls, now as a fair price, not a keystone spur. |
| The Barrows' two-hander row            | Greatblade moved from the second road node to the seventh, where the road turns hybrid toward the Yard                                | Headsman to Greatblade 7 → 10, Heavy Hands to Greatblade 6 → 11                                                                                                                                                                                        |
| Mist Walk and Tumble (identical lines) | Tumble re-lined to dodge with stun avoidance (was dodge with movement)                                                                | Every other dodge notable sells movement speed                                                                                                                                                                                                         |

---

## Watch

- **Carrion Claws to Barbed Point went 14 → 11.** The Athame wheel is a new way through the Knife's centre. It is still
  over the twin distance, and the partner differs.
- **Two Fists is 6 from Greatweight.** Dual wield and a two-hander are different builds, so a build takes one.
- **Marked Prey is 23 from the Reaver start,** more than the audit's 18. The new road reaches it from the Pits, not the
  Muster.
- **Twin Fangs and Two Fists share the dual-wield line,** 31 apart with different partners.
- **The Knife now has 28 notables** (was 24).
- **Snare Line is 5 from Overcharge and from Harsh Weather.** The trapper walk passed Overcharge on the way (a fair
  price), but a lightning trapper gets both cheaply. This was the audit's weakest spot, placed as proposed.
- **The Fosse is not one attribute all the way:** strength and dexterity for five nodes, then strength alone for the two
  nearest the Wall, like the Barrows road it joins.
- **Greatweight's new partner is strength,** which every Wall road already sells. As a partner it is a weak identity
  (§5.1). Knockback or melee range, both unsold nearby, would be a sharper trade-off if you want one.
- **The Shieldwall fix is smaller than the audit's.** The keystone is a dead end, but the three shield-block smalls before
  it are still a way between Elemental Edge and the Executioner chain. The audit's road node could go in once the Yard
  re-lay (§16) frees that corner.

---

## Second half: your answers

### Channelling

New line `channelDamage` (damage with channelling skills, unit 10%). On the sheet, 100% doubled Blaze Stream and
Flurry of Edges and left Sudden Frost and Whirlwind Cleave alone. 50% attack speed with the channelling tag cut
Flurry's time per hit to two thirds.

| Notable              | Where                                          | Lines                                                       | Steps from starts     | Neighbours                                     |
| -------------------- | ---------------------------------------------- | ----------------------------------------------------------- | --------------------- | ---------------------------------------------- |
| **Steady Stream**    | the Spire, off the road to Shatter             | channelling damage, reduced mana cost                       | Mystic 21             | Shatter 5 (a fair price for a cold channeller) |
| **Ceaseless Blades** | the Fosse, between Stormstruck and Marked Prey | channelling damage, channelled attack speed, stun avoidance | Strider 17, Reaver 21 | Stormstruck 7, Marked Prey 8                   |

The audit put the attack cluster on the Rooftops. Those nodes went to Whetted Will and the Athame wheel, and the
channelled attacks (Flurry of Edges, Twister Blade, Storm Rush, Blight Hail) are dexterity skills, which the Fosse
serves.

### The third dagger-caster cluster

**Ritual Blade** (spells with a dagger, energy shield) hangs off a new four-node **ridge road** along the Knife's north
rim. The road runs from Black Powder, which was a leaf, to the rooftop road's second node. There was no free ground on
the Spire–Knife border inside the rim; the ridge is the nearest open ground.

| The dagger caster's clusters | Lines                               | Steps from the Shade start |
| ---------------------------- | ----------------------------------- | -------------------------- |
| Quiet Knife                  | dagger, spells, cast speed          | 7                          |
| Athame                       | spells and spell crit with a dagger | 17                         |
| Ritual Blade                 | spells with a dagger, energy shield | 23                         |

Pairwise: Quiet Knife–Athame 16, Athame–Ritual Blade 10, Quiet Knife–Ritual Blade 22. Walk: Quiet Knife at point 7,
Athame at 20, Ritual Blade at 30.

### Your Strider

- **The projectile rim: Split Volley and Barbed Arrows traded places,** smalls included. The landmark wheel is now
  projectile damage up to Far Flight on one side, bleed chance up to Barbed Arrows on the other. Split Volley is on the
  bleed wheel's north arm, with projectile smalls.
- **Rapid Fire's link to the flask pocket is cut.** Rapid Fire is a pocket off its junction.

| Steps between           | Before | After |
| ----------------------- | ------ | ----- |
| Far Flight–Split Volley | 4      | 8     |
| Split Volley–Skewer     | 3      | 11    |
| Rapid Fire–Skewer       | 2      | 10    |
| Split Volley–Ricochet   | 10     | 8     |

Extra projectile, pierce and chain are now three places. The projectile walk takes Far Flight, Split Volley, Skewer and
Rapid Fire at points 13, 18, 23 and 27 (was 13 to 20), passing Barbed Arrows. Skewer is 15 from the start (was 13).
It is still a dense build: eight notables by point 36, with Killing Eye 4 from Skewer.

**Same pairings, re-partnered:**

| Notable      | Was                                                                | Now                                              |
| ------------ | ------------------------------------------------------------------ | ------------------------------------------------ |
| Quick Hands  | attack speed, accuracy, dexterity (True Aim's lines, 2 steps away) | attack speed, cast speed                         |
| Killing Eye  | crit multiplier, crit chance (Vital Aim's lines)                   | crit multiplier, damage against low-life enemies |
| Hatchet Work | axe, bleed chance, melee area (Hewing sells axe with bleed)        | axe, melee area, accuracy                        |

**Pitch Arrows** (fire attacks with area damage) hangs off the road to the Pits under Sentry Post, 11 from the Strider
start. It is 44 from Kindled Steel, the other fire-attack cluster.

Close Quarters' spur is still a road, as you chose.

---

## The label pass

You asked for the final label pass, suggesting that area names show when zoomed out and fade as you zoom in.

**How names are drawn now:**

- **Size.** Area names are set in tree units behind the nodes, like place names on a map, 150 units tall. Zoomed out
  they shrink with the tree; zoomed in they would grow over everything, so they fade.
- **Fade.** Full strength up to the zoom where keystone names appear (0.14), then a smooth fade, gone by 0.32, before
  notable names appear at 0.4. Places hand over to nodes.
- **Shared code.** One size and one fade function (`AREA_LABEL`, `areaLabelAlpha` in `src/ui/treeStyle.ts`, with a
  test), used by the game's tree screen, the editor and the renders.

| Where                                        | What it does now                                                                                                                                                                                                                                            |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The editor (`tree-editor.html?tree=next`)    | Draws the names, with an "areas" checkbox. Checked in the browser: all names at whole-tree zoom, faded at middle zoom as keystone names appear, gone when notable names show.                                                                               |
| The game's tree screen                       | Draws the names when the tree carries them (`Tree.areas`, filled by the hand-written tree's builder). The game still loads the old tree, which has none, so nothing changes in the game until the new network goes in; checked by types and the tests only. |
| The renders (`D-all.png`, `D-all-large.png`) | Draw the names at the same width. The renders show every name at once, which no zoom in the game does.                                                                                                                                                      |

**Placement.** A script placed each name near the middle of its own area's nodes. The hard rule was that no name
overlaps another. Covering nodes cost a little, notables more, and another area's nodes more still. Result: 0
name-on-name overlaps, and no name over a notable, keystone or start. Small nodes and links under a name are accepted, as
you said. Names moved 80 to 840 units; each area file's `at` notes it.
