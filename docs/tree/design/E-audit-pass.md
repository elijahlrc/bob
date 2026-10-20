# The constraints audit and the pass after it (2026-10-20)

Four steps, in order:

1. I finished what the trade-off pass had left half-done.
2. Three agents audited the whole network against `CONSTRAINTS.md`. Their full reports are in `audit/`:
   - `audit-tradeoffs.md` covers §1, §4, §5 and §10.
   - `audit-network.md` covers §3, §6, §7, §9 and §11.
   - `audit-builds.md` covers §8, §9, §12, and 24 walks, the first ever for the Shade and the Zealot.
3. I made one pass over the network using those reports.
4. This summary.

Nothing is committed. The checks all pass: audit 0 problems, 0 edge crossings, names test passing, `tsc` clean, ids
registered. The renders `D-all.png` and `D-<class>-text.png` are fresh.

---

## Decisions I took that you should check

Each of these was a judgment call. Each is easy to reverse.

1. **Attribute supply.** The audit found that +20 attribute nodes, a 13.6% attribute share and +3 per point cannot all
   hold once real roads exist. Your Strider, the one region with attribute roads, supplies about 10 dexterity per
   point. I kept +20 nodes, built roads with them, and treated your Strider as the yardstick.
   - Supply near home is now 6 to 10 per point in most regions, against about 3 before.
   - The Spire's attribute share is now 20%.
   - If you want it lower, the options are +10 nodes on roads with +20 at junctions, or a different target. Either is a
     search and replace.
   - CONSTRAINTS §7 item 4 and §16 say this.
2. **The signature notable stays at 2 points,** although §6 asks for first notables at 3 or 4. The pattern comes from
   your Strider, so I wrote it into §6 item 5 as the exception.
3. **Each home's two hub roads are now attribute highways.** Before, they were stat roads: the Spire's energy shield
   and cast speed, the Wall's armour and melee area, the Yard's crit and attack speed, the Knife's shield and evasion,
   and the Cathedral's block and shield.
   - The start now opens onto two highways plus the small-node paths of the signature and the pockets. That is your
     "two small node paths and two highways".
   - The cost is a few early stat smalls.
   - The road leaving each signature is still a stat road.
4. **Barbed Point lost its dagger line.** It is now poison with crit, so the crit-dagger Shade no longer gets two dagger
   notables in a row. To keep daggers in two places, I added a dagger caster pocket (Quiet Knife).
5. **One change in the Strider:** Sure Shot is now Fleet Blade, a dexterity sword. The Longbow fork was your own
   rejected example from §8.3, two bow notables on one circle. The fork is now bow or sword.
   - It also gives dexterity-only swords the home the audit found missing.
   - Nothing else in the Strider changed. The audit's proposals for it are listed under "Not done" below.
6. **The 1,490-unit link from the Yard to the Wall is gone.** It cut diagonally across the map with nothing branching
   off it. The Yard still reaches the Wall by its three near crossings.
7. **"The Cathedral Gate" is now "The Narthex".** It is shorter, still a place, and still a church's entrance.

---

## What changed

### Wheels and clusters with one theme (§8.3, §10.2)

| Where                                            | Before                                                                                        | Now                                                                                              |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| The Stair's wheel (Festering / Sapper)           | Entered through a poison small and left through a mine small, so every route paid both themes | Both ends are attribute nodes, and the Stair is an attribute road with the wheel as a fork on it |
| The Docks' wheel (Trapper / Carrion Claws)       | Cooldown recovery at the ends, a trap stat that the claw side paid for                        | Life at the ends                                                                                 |
| The Rookery's wheel (Barbed Point / Shroud)      | Crit at the ends, which the shield side paid for                                              | Attribute nodes at the ends                                                                      |
| The Undercroft's shrine (Reliquary / Runecarver) | Entered through a totem small and left through a brand small                                  | Skill duration at both ends, which both sides use                                                |
| The Vestry's rods wheel                          | Elemental attack at the ends taxed the spell-sceptre player                                   | Elemental damage at the ends                                                                     |
| The grit wheel (Unbroken / Tempered)             | Tempered (max resistances) was reachable only through grit smalls                             | Life at the ends                                                                                 |
| Arcane Focus / Warded Mind                       | Both sides carried spell damage, so a fake choice                                             | Warded Mind is shield, recharge and mana; mana at the ends                                       |
| Twin Fangs / Mirror Guard                        | Both sides were dual wield                                                                    | Twin Fangs (dual damage, speed and block) or Weaving (evasion and life)                          |
| Lingering                                        | Skill duration paired with cold damage over time                                              | Duration with damage over time                                                                   |
| Unerring Discipline's spur                       | Accuracy then melee damage                                                                    | Accuracy twice                                                                                   |
| Keen Edge and Light Blades                       | A speed small in each damage pocket                                                           | Damage smalls throughout                                                                         |

### Copies of one pairing, given different partners (§5.1)

- **Minions:** Familiars and Congregation had identical lines.
  - Familiars is now minions with spell damage, for the caster-summoner.
  - Shepherd is pure minion. It lost its reservation line, which had given the aura build part of the minion side.
  - The Cathedral crypt's minion notable became **Homily**, a spell notable, for two reasons:
    - The summoner now passes a non-minion notable on the way to Volatile Servants.
    - The Zealot gains a caster notable past the nave. Before, Hearthfire was its only spell node.
- **Totems:** Sentry Post and Reliquary had identical lines.
  - Standing Cairns is now a slam totem, with area damage.
  - Reliquary is now a casting totem, with spell damage.
  - Sentry Post is unchanged.
- **Auras:** four notables carried reduced reservation with aura effect.
  - Warlord's Banner: reservation with armour.
  - Standard Bearer: reservation with attack speed.
  - Devotion: reservation with energy shield.
  - Choirmaster keeps the pure aura.
  - Shroud dropped its reservation for stun avoidance.
- **Shield block:** four notables were block with shield defences.
  - Bracing now has stun threshold.
  - Buckler now has evasion.
  - Steel Rim and Iron Faith are unchanged.
- **Armour:**
  - Stone Heart is now life with stun threshold, so the armour sits on Mortar and Stone alone.
  - Guarded is now armour with evasion, so it no longer copies Thick Skin across the border.
- **Generic copies:** Draught is now the caster's flask (mana regeneration in place of movement). Unhurried is now
  movement with stun threshold.

### One-stop shops broken up (§1.1)

- **The crit-dagger Shade:** Fine Point and Barbed Point no longer both sell daggers.
  - Fine Point is dagger crit plus crit while dual wielding. It is the second home for dual wield, which before lived
    only in the Yard's Lists.
  - Barbed Point is crit poison.
  - Quiet Knife (new) is the dagger caster.
- **The Zealot summoner:** it now passes Homily or Glass Wall on its way to Volatile Servants. The walk confirms it.
- **The dual-wield Reaver:** Twin Fangs and Mirror Guard are no longer two dual notables on one wheel, and dual wield has a
  second home in the Knife.
- **Two-handers:** the Yard had none. Hewing is now a two-handed axe that bleeds.
- **The Strider's fork:** bow or sword (decision 5).

### Gaps a region could not fill (§4.5, §4.6)

| Region    | Was missing                                    | Now                                                          |
| --------- | ---------------------------------------------- | ------------------------------------------------------------ |
| The Spire | Life (Quiet Pulse only)                        | Warm Blood, a new bridge across the empty gate band          |
| The Knife | Lightning (cold and lightning were Spire-only) | Static Edge, lightning with crit, a new pocket off the Stair |
| The Knife | Spells                                         | Quiet Knife, the dagger caster                               |
| The Knife | Life                                           | Life at the ends of the Docks wheel                          |
| The Yard  | Evasion (Sidestep only)                        | Weaving, Guarded, Buckler                                    |
| The Wall  | Life on its home roads                         | The tower road is now life                                   |

### Roads and the network (§3, §7, §9.1)

- **Highways out of every home:** each home's two hub roads are attribute roads (decision 3). Each hub also reaches the
  ring through one more attribute node, so:
  - the nine 530-unit spokes back to the ring are now roads;
  - the first off-attribute node sits one step further from a pure start.
- **The Spire's spokes became roads.** Five long links from the column fork and the arm junctions now carry 1 or 2
  intelligence nodes each:
  - the fork to the Lantern;
  - the fork to the Gallery;
  - the Lantern to the well;
  - the column to the craft;
  - the Gallery to Mist Walk.

  The Wall's two long links to Greatweight and Heavy Hands each gained a strength node.

- **Near crossings for the Mystic.** Before, the Mystic had none near home: without the ring, it was 26 steps from the
  Shade's start and 22 from the Zealot's. Two new two-node bridges:
  - the Scriptorium's insight pocket to the Knife Gate's Spoils;
  - Wandwork to the Narthex's Hymn.
- **Links dropped:**
  - the 1,490-unit Yard–Wall link;
  - the 583-unit blank diagonal in the Wall, from Weight of Iron to Thunderstep;
  - Harsh Weather's link to Overcharge. Those two were notable to notable, and a shock caster wanted both.
- **Keystone spurs that were through-routes:** Crimson Pact, Prismatic Balance, Mana Bastion and Nimble Gambit now sit
  on real spurs. Pain Conduit lost one of its two through-links.
  - Frugal and the Snakeskin star's cold spoke were re-pointed onto nearby junctions.
  - Thirsting Blade, Cinder and Harsh Weather became dead-end pockets. The audit found almost no dead ends, which §14
    rejects as an absolute.

### Starts (§6.2)

- **The Mystic:** its offence side small is crit in place of spell damage, so the wand attacker and the summoner are not
  committed to spells at point one.
- **The Vanguard:** its tower road is life in place of melee physical damage.
- **The Zealot:** the shield smalls three steps from its start are gone, because that road is now a highway.

### Pricing (§8.6)

- **Executioner** dropped double damage and now has less damage against bleeding: 6.5 units became 5.
- **Elemental Ward** gained 5% life: 2.5 units became 3.5.

### Descriptions and labels

- **Descriptions:** every description that named a removed link or an old side was rewritten. Stale "when the Knife is
  written" notes were removed.
- **Labels:** most area labels were moved nearer their own nodes, and the two labels that overlapped at the centre were
  pulled apart. As you asked, final label placement waits until the end.

---

## Measured before and after

The audit's own scripts, re-run (`scratchpad/net/`). A cluster counts as on a road when it touches a run of two or more
attribute nodes.

|                                       | Mystic   | Vanguard | Reaver    | Shade    | Zealot  | Strider  |
| ------------------------------------- | -------- | -------- | --------- | -------- | ------- | -------- |
| Notable clusters on a road, before    | 1 of 31  | 2 of 26  | 4 of 26   | 7 of 11  | 2 of 11 | 20 of 25 |
| Notable clusters on a road, after     | 21 of 32 | 16 of 26 | 11 of 26  | 13 of 13 | 7 of 11 | 20 of 25 |
| Attribute per point near home, before | 2.9      | 3.3      | 3.1 / 3.0 | 3.8      | 3.8     | 7.5      |
| Attribute per point near home, after  | 10.0     | 8.6      | 5.7 / 5.0 | 6.4      | 7.5     | 7.5      |
| Notables, after                       | 34       | 29       | 28        | 17       | 17      | 32       |

The Vanguard's road count flatters it. Its clusters now touch the home highways and the two inserted road nodes, but the
west towers and the south are still not joined by roads (see below).

- **Network:** 764 nodes, up from 732. Loops per 100 nodes fell from 26.4 to 24.7. Non-keystone dead ends rose from 7
  to 11.
- **Specialization spread:**
  - Daggers, claws, dual wield, two-handers, minions, lightning and totems each have two or more homes with different
    partners.
  - Cold is still only in the Spire, 4 steps between twins.

---

## Not done, and why

These are in CONSTRAINTS §16.

- **The road skeleton for the Wall, the Yard and the Cathedral.** I tested every junction-to-junction road the audit
  proposed. Only one could be added without crossings, and it grazed a pocket. Those regions join their areas cluster to
  cluster, so a real skeleton means re-laying them, not patching. That is the next iteration's biggest job.
- **The Zealot's fire sceptre line.** Gilded Rod, then Kindled Steel, then Searing Avatar still sit in a row. It needs
  the Cathedral re-laid. Doing it together with the Cathedral's new clusters makes sense, since it is thin at 17
  notables.
- **The Knife's growth.** It has 17 notables now, against 28 to 34 elsewhere. The audit's voids say where new clusters
  fit.
- **Single homes:** mines, brands, fervour, insight, warcries, wand attacks and staves. Cold has no home outside the
  Spire. Each needs a new cluster rather than re-lining.
- **Keystone costs.** Pain Conduit and Volatile Servants cost nothing, and Mind Bulwark has no cost the sheet shows.
  These are engine effects in `src/data/tree/keystones.ts`, which has other uncommitted work, so I left it alone.
- **The unit table against §8.1.** `UNIT` prices a reference small at 3% attack speed, 20% crit and 12% evasion; §8.1
  says 5%, 15% and 10%. Both come from your Strider, so the choice is yours.
- **The rest of the Strider.** The projectile notables sit 2 to 4 steps apart along one rim, and the Far Flight / Split
  Volley fork is fake. The audit's proposals are in `audit/audit-tradeoffs.md`.
- **Keystones still on through-routes:** Shieldwall, Wound Dance and, partly, Pain Conduit. Each fix needed a link that
  crossed or ran 580 units.
- **The Steel Rim gate in the Yard,** and the Wall–Yard near crossings bunched together. Both are part of re-laying the
  Yard.
- **The per-region `D-*.md` write-ups** still describe older states.

---

## Files

- **Changed:**
  - `src/data/passives/`: every region, plus `centre/ring.ts` and `centre/clusters.ts` for the label positions.
  - `src/data/passives/ids.json`: 33 new ids (20 road nodes, 13 in new clusters). Retired ids went from 123 to 124.
- **New:**
  - `docs/tree/design/audit/`: the three audit reports.
  - `docs/tree/design/E-audit-pass.md`: this file.
- **Updated:**
  - `CONSTRAINTS.md`: §6 item 5, §7 item 4, §16.
  - `PHILOSOPHY.md`: §3 item 7 and the §7 state log.
  - The renders: `D-all-large.png` (whole map, 6000px), `D-<class>.png` (one region each), `D-<class>-text.png` and
    `D-all-text.png` (with every node's lines), and `D-all.png` (small overview).
