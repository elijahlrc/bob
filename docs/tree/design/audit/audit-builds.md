# Passive network audit: clusters, keystones, balance, walks

> Copied into the repo on 2026-10-20 from the session scratchpad. The renders (`all.png`, `<region>.png`, `net-box-*.png`), listings and scripts (`../net/*.ts`, `*.ts`) it refers to stayed in the scratchpad and are not in the repo. The network has changed since: see `../E-audit-pass.md`.

Audit date: 2026-10-20. The share audited is CONSTRAINTS §8 (clusters, notables, smalls), §9 items 2–3 (keystones as
trades, late-build decisions), §12 (size and balance) and §15 item 2 (walks). Read-only: nothing under `src/` or `docs/`
was changed.

**How it was done.** I read CONSTRAINTS.md in full, read every area listing (`scripts/passives/list.ts <region>`, saved
here as `list-<region>.md`), and looked at the renders `D-all.png`, `D-shade-text.png` and `D-strider-text.png`. The
scratch tools are in this directory:

- `smallcheck.ts` checks smalls for one stat at reference size, and checks sections and wheel sides.
- `notables.ts` gives each notable's units as authored and re-priced at the §8.1 reference sizes.
- `doors.ts` lists every wheel's outside links, which shows its route through.
- `reach.ts <class> K` lists the notables and keystones within K steps of a start.
- `pair.ts` gives distances between named nodes.
- `walk2.ts` is `walk.ts` plus per-node units, a running total and units per point at the budget.

The raw walk outputs are `walks-<class>.txt` (the 20-point walks) and `w120-<class>.txt` (the late builds).

**About the walk tool.** `walk2.ts` buys the shortest path to each target in order. When two paths tie it picks one
arbitrarily, so a notable the tool bought on a tied path is not "forced". Below, "forced" means the route check
(`doors.ts`) shows that every way through passes it, or passes some notable the build does not want. Where a way round
exists, I say "cheapest route" and give the cost of avoiding it.

Severity:

- **High** is structural: a main build with no trade-off, a build that cannot be made, a keystone with no trade, or
  off-theme smalls forced on every route.
- **Medium** is pricing, or a fake choice that has some substance.
- **Low** is cosmetic, or sits in the user's own Strider edit (§15.9: allowed to change, but not the priority).

---

## 0. The fifteen findings that matter most

| #   | Sev    | Finding                                                                                                                                                                                                                                                                                                                                                            | Ids                                                                                  |
| --- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| 1   | High   | The Knife's crit-dagger build finds everything on one line. Fine Point at 8 points, Barbed Point at 17 and Cruel Agony at 22 sit on the single blade spine. The route through each wheel can take the dagger side, so the build never gives anything up (§1.1).                                                                                                    | `knife.edge.wheel.w5`, `knife.venom.wheel.v3`, `knife.venom.cruelAgony`              |
| 2   | High   | The Cathedral's fire-sceptre build has the same problem. Gilded Rod at 12, Kindled Steel at 17 and Searing Avatar at 22 sit on one straight spine (nave, then rods, then pyre).                                                                                                                                                                                    | `cathedral.rods.wheel.r3`, `cathedral.pyre.wheel.f3`, `cathedral.pyre.searingAvatar` |
| 3   | High   | The Cathedral's summoner also finds everything in one place. Shepherd at 12 and Congregation at 17 are five steps apart on the choir-to-crypt spine, and Volatile Servants is five more.                                                                                                                                                                           | `cathedral.choir.wheel.c5`, `cathedral.crypt.wheel.m3`                               |
| 4   | High   | The Cathedral is thin, and §16 names only the Knife. It has 88 nodes and 17 notables, against 119–143 nodes and 28–33 notables in the four full regions. A 120-point Zealot spends 44 points at home and 40 in the Wall.                                                                                                                                           | `cathedral.*`                                                                        |
| 5   | High   | A spell-casting Zealot cannot be made in the Cathedral. Hearthfire, at 8 points, is the only node in the region with a spell or cast-speed line; the only other caster-usable lines are the generic elemental damage on Zeal and Gilded Rod. The next spell-damage notable is Arcane Focus, 14 points further on.                                                  | `cathedral.nave.wheel.n5`                                                            |
| 6   | High   | Pain Conduit is either a free lunch or unbuildable. Its only cost is "be on low life". The engine sets low life from 65% life reserved (only Blood Rite does that, and it is 43 steps away) or from life falling during a fight, which turns it into a free 30% more damage near death.                                                                            | `spire.storm.painConduit`, `wall.grit.bloodrite`                                     |
| 7   | High   | Volatile Servants has no cost at all, so it is a free lunch. Mind Bulwark has no cost line the sheet can show.                                                                                                                                                                                                                                                     | `cathedral.crypt.volatile`, `spire.well.mindBulwark`                                 |
| 8   | High   | The unit table and §8.1 disagree on the yardstick. `lines.ts` sets a unit at 3% attack speed, 20% crit and 12% evasion; §8.1 says 5%, 15% and 10%. As a result, every attack-speed road is counted at 1.67 units per small, the crit and evasion smalls are oversized by the reference, and every notable carrying those lines is mispriced.                       | `src/data/passives/lines.ts` `UNIT`                                                  |
| 9   | High   | Two wheels, the hex wheel and the shrine, have entry and exit smalls that belong to one side. The hex wheel's entry is poison and its exit is mines, and every route passes both. The shrine's entry is totems and its far node is brands.                                                                                                                         | `knife.hex.wheel.s` / `.n`, `cathedral.crypt.shrine.w` / `.e`                        |
| 10  | High   | The Mystic's wand attacker has one cluster, Wand Volley. Its onward link goes to Darting Bolts, whose damage lines are all spell-projectile, so a wand attack gets only its 10% projectile speed. The 20-point wand walk buys five notables, and one of them is for wands.                                                                                         | `spire.craft.wandVolley`, `spire.column.dartingBolts`                                |
| 11  | Medium | Brands have one cluster in the whole network, Runecarver. It is 19 steps from the nearest start, and Sigil Warden is 23 steps away.                                                                                                                                                                                                                                | `cathedral.crypt.shrine.s`, `cathedral.crypt.sigilWarden`                            |
| 12  | Medium | Wall and Yard wheels offer fake or forced choices. In Bulwark, the life notable Stone Heart carries 24% armour, so an armour build takes both notables. Steel Rim is the cheap way from the Yard's hub to the leech: 4 nodes, against 8 round by Four Winds. The cheapest route from Greatweight to Stagger passes Cleaver (axe), and avoiding it costs one point. | `wall.rampart.bulwark.n1`, `yard.shield.steelRim`, `wall.maces.cleaver`              |
| 13  | Medium | Notable pricing has outliers. Executioner is 6.5 units, Quickening 5.3 and Far Flight 5.3; Elemental Ward and Weathered are 2.5. The 3% block smalls are 1.5 units each (17 nodes).                                                                                                                                                                                | `yard.blades.executioner.n`, `spire.well.recharge.n`, `wall.resists.star.n`          |
| 14  | Medium | The dual-wield Reaver has one keystone of its own that fits, Crimson Pact. Its own Shieldwall and Wound Dance are for other builds, and the nearest other keystones (Strongarm, Plated Hide, Steady Draw) are for projectiles. Late-build keystone decisions are thin.                                                                                             | `yard.*`, `wall.slams.strongarm`                                                     |
| 15  | Low    | The Strider, which is the user's own edit, puts two notables a bow build wants on each ring, three times over: Longbow and Sure Shot, Far Flight and Split Volley, Barbed Arrows and Deep Cuts. That is the §8.3 example of a fake choice. Most multi-stat smalls are also there.                                                                                  | `bow.bows.wheel`, `bow.flight.wheel`, `bow.quiver.wheel`                             |

---

## §8. Clusters, notables and small nodes

### 8.1 A small node is one stat at the reference size

**Finding 8.1-A: the unit table contradicts §8.1 (high, §12 consequence).** `src/data/passives/lines.ts` `UNIT` sets
the reference small at 3% attack speed (`attackSpeed: 3`), 20% crit (`critChance: 20`) and 12% evasion
(`evasion: 12`). §8.1, derived from the user's Strider, says 5% attack speed, 15% crit and 10% evasion. The tree uses
both:

- **Attack speed smalls** come in 3%, 4% and 5%. The 3% one is `bow.home.sig.a`. The 4% ones are
  `wall.grit.heavyHands.a`/`b`/`c`, `yard.blades.keenEdge.c` and `yard.blades.lightBlades.c`. The 5% ones are
  `knife.home.roadB.a`/`b`/`c`, `yard.home.roadE.a`/`b`, `yard.home.sig.b`, `bow.string.aim.a` and `bow.string.speed.a`,
  which the table counts at 1.67 units each.
- **Crit smalls** come in 20% everywhere outside the Strider's bow wheel, which uses 15%
  (`bow.bows.wheel.c1`/`c2`, 0.75 units).
- **Evasion smalls** come in 12% everywhere, against 10% in the Strider (`bow.steel.wayfarer.a`/`b`,
  `bow.steel.added.n408`/`n409`, `bow.string.speed.b`, 0.83 units).

Re-pricing at the §8.1 sizes (`notables.ts`, second column) moves notables by up to ±0.9 units. For example:

| Notable       | Authored | At §8.1 sizes |
| ------------- | -------- | ------------- |
| Cleaver       | 4.0      | 3.2           |
| Steady Hands  | 3.67     | 3.0           |
| Twin Fangs    | 4.07     | 3.4           |
| Heavy Hands   | 4.17     | 3.1           |
| Light Hand    | 3.17     | 2.5           |
| Keen Instinct | 4.33     | 4.87          |
| Fencer's Eye  | 4.08     | 4.75          |

The attack-speed roads are the clearest case. The Knife's blade road and the Yard's second-hand road are booked at 5
units for three nodes when they give 3 by the reference.

- **Fix:** pick one yardstick. If §8.1 stands, set `UNIT.attackSpeed = 5`, `critChance = 15` and `evasion = 10`. Then
  resize the 20% crit smalls to 15%, the 12% evasion smalls to 10% and the 4% attack-speed smalls to 5%, and re-check
  every notable's units. If the table stands, correct §8.1.

**Finding 8.1-B: oversized and undersized smalls by the table's own units (medium).**

- **Block smalls at 3% are 1.5 units** (`shieldBlock(3)`, `dualBlock(3)`): `wall.rampart.bracing.a`/`b`,
  `yard.home.block.a`/`b`, `yard.dual.twinFangs.c`/`d`, `yard.shield.steelRim.a`/`b`, `yard.shield.shieldwall.a`/`b`/`c`,
  `cathedral.home.roadW.a`/`b` and `cathedral.nave.wheel.n2`. That is 17 nodes, and the Shieldwall spur alone is 4.5
  units before its keystone. Fix: 2% block smalls, or a block unit of 3 in the table.
- **Freeze smalls at 5% are 0.63 units:** `spire.frost.shatter.a`/`b`/`c`. Fix: 8%.
- **Elemental damage smalls at 8% are 0.8 units:** `spire.frost.prismatic.a`/`b`/`c` and `spire.frost.feverPitch.a`/`b`.
  Fix: 10%.
- **Wand spell damage at 10% is 1.25 units:** `spire.well.wandwork.a`. Fix: 8%.
- **Damage against bleeding at 10% is 1.25 units:** `yard.blades.executioner.a`. Fix: 8%.
- **Resist-star spokes are 1.25 units each** (+10% to one resistance against a unit of 8%). Stars are a §8.2 exception,
  but the size is still off. Low; fix with +8%.

**Finding 8.1-C: multi-stat smalls (low; all in the user's Strider edit).**

| Node                           | Lines                                 | Units    |
| ------------------------------ | ------------------------------------- | -------- |
| `bow.bows.wheel.e`             | bow speed 10% + crit 10%              | 3.8      |
| `bow.flight.wheel.a`           | projectile damage + projectile speed  | 1.8      |
| `bow.quiver.wheel.e`           | bleed chance 5% + bleed damage 6%     | —        |
| `bow.quiver.wheel.a2`          | bleed chance + physical attack damage | 1.6      |
| `bow.steel.wheel.c2`           | physical attack damage + life         | 1.8      |
| `bow.home.added.n437` / `n438` | shield block 4% + shield defences     | 2.7 each |

The editor-added smalls are also off size: `n435`/`n434` are 15% one-handed damage (1.5 units), `n431` is 10% shield
defences (0.67 units), and `n402`/`n404`/`n429`/`n430`/`n433` are 12% mana regeneration (1.2 units).

`bow.bows.wheel.e`, at 3.8 units, is a notable's worth sitting on a small. The description of `bow.string.speed.m`
calls it "a little of both", but it is movement only.

- **Fix:** when the user next edits the Strider, split these into single-stat smalls.

### 8.2 Within a section, every small carries the same modifier

Violations, excluding start loops and resist stars, which are allowed exceptions:

| Id                                        | Section          | Mix                                                                   | Sev           | Fix                                                      |
| ----------------------------------------- | ---------------- | --------------------------------------------------------------------- | ------------- | -------------------------------------------------------- |
| `wall.rampart.unerring.a` / `.b`          | Keystone spur    | accuracy, then 8% melee damage                                        | Medium        | Make `b` accuracy, which is what the keystone asks for.  |
| `yard.blades.keenEdge.a` / `.b` / `.c`    | Pocket (diamond) | sword damage ×2, sword speed ×1                                       | Medium        | Make `c` sword damage. The speed belongs on the notable. |
| `yard.blades.lightBlades.a` / `.b` / `.c` | Pocket (diamond) | one-handed damage ×2, one-handed speed ×1                             | Medium        | Same fix as Keen Edge.                                   |
| `bow.string.hardTarget.a` / `.c` / `.d`   | Pocket           | evasion, life, life                                                   | Low (Strider) | Pick one stat. The description admits the mix.           |
| `bow.string.speed`                        | Loop             | the Quick Hands side's `a` (attack speed) and `m` (movement)          | Low (Strider) | `m` should be its own section, or attack speed.          |
| `bow.steel.wheel`                         | Wheel            | `c2` is physical attack damage plus life while `e` and `c1` are plain | Low (Strider) |                                                          |
| `bow.quiver.wheel`                        | Wheel            | the chance side's `a2` and the shared `e` are mixed                   | Low (Strider) |                                                          |

Note on how `smallcheck.ts` reads wheels: it flags six-node wheels (Greatweight, Twin Fangs, Steel Rim, Deep Well,
Arcane Focus) as "MIXED SIDE". That is an artefact of the ring order `a-b-n1-c-d-n2-a`. Read by stat runs (`a`,`b` and
`c`,`d`), their sides are uniform. They are not §8.2 violations, so they are dealt with under §8.3 instead.

### 8.3 Micro choices must be real (wheels)

Each wheel's route is read from `doors.ts`: where it is entered, where it is left, and what each way round costs.

| Wheel                                                   | Sides                                        | Entered / left at                                                                                                                                                                        | Route through                                                                                                                                                                                           | Verdict                                                                                                                                                                                                                     | Sev                                                                                                                |
| ------------------------------------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `knife.edge.wheel` (Talon / Fine Point)                 | claw recovery / dagger crit                  | in at `w1` (blade road), out at `w4` (to venom); `w2` and `w6` are side doors                                                                                                            | `w1→w2→Talon→w4` or `w1→w6→Fine Point→w4`, 4 each                                                                                                                                                       | A real choice of variants (dagger or claw). The ends are crit, which both use. **But see 15.2:** the next wheel on the same line also has a dagger side.                                                                    | — (see §1.1)                                                                                                       |
| `knife.venom.wheel` (Barbed Point / Shroud)             | poison dagger / ES and evasion               | in at `v1`, out at `v4`; `v2` (dagger) is the door to `jN`                                                                                                                               | one side each way                                                                                                                                                                                       | Two unrelated things, with the route taking one side, so it passes the rule. Shroud's side gains nothing from the crit ends. The dagger build takes the dagger side for free again.                                         | Medium (§1.1)                                                                                                      |
| `knife.snares.wheel` (Trapper / Carrion Claws)          | traps / chaos claw                           | in at `t1`, out at `t4`                                                                                                                                                                  | one side each way                                                                                                                                                                                       | Passes the rule. The ends are cooldown recovery, which is a trap stat; Carrion Claws gets nothing from it.                                                                                                                  | Low. Fix: make the ends a stat both use (dex/int attribute nodes, or chaos/poison).                                |
| `knife.hex.wheel` (Festering / Sapper)                  | poison / mines                               | in at `s` (poison small), out at `n` (mine small, where Hexwright and the climb attach)                                                                                                  | `s→Festering→n` or `s→Sapper→n`: **every route buys one poison small and one mine small**                                                                                                               | Shared entry and exit belong to opposite themes.                                                                                                                                                                            | **High.** Fix: make `s` and `n` neutral, e.g. +15/+15 dex/int attribute nodes (the barb is a road anyway).         |
| `cathedral.crypt.shrine` (Reliquary / Runecarver)       | totems / brands                              | in at `w` (totem), out at `e` (brand; Sigil Warden leaves here)                                                                                                                          | both routes pass `w` and `e`                                                                                                                                                                            | The twin of the hex case.                                                                                                                                                                                                   | **High.** Fix: make `w` and `e` skill effect duration, which both notables already carry.                          |
| `cathedral.nave.wheel` (Iron Faith / Hearthfire)        | block and armour / fire spell                | in at `n1` (life) or `n2` (block road), `n6` (fire, from the transept); out at `n4`                                                                                                      | one side each way                                                                                                                                                                                       | A real choice of unrelated things. **But** every Zealot going past the nave buys one of them, including the summoner and the sceptre build.                                                                                 | Medium (see walks Z1 and Z1b)                                                                                      |
| `cathedral.rods.wheel` (Gilded Rod / Quarterstaff)      | sceptre / staff                              | in at `r1`, out at `r4`                                                                                                                                                                  | one side each way                                                                                                                                                                                       | Real variants. Good.                                                                                                                                                                                                        | —                                                                                                                  |
| `cathedral.pyre.wheel` (Kindled Steel / Benediction)    | fire attacks / aura                          | in at `f1`, out at `f4`; Benediction also joins `jF`                                                                                                                                     | one side each way                                                                                                                                                                                       | Passes the rule.                                                                                                                                                                                                            | —                                                                                                                  |
| `cathedral.choir.wheel` (Choirmaster / Shepherd)        | auras / minion life                          | in at `c1`, out at `c4`                                                                                                                                                                  | one side each way                                                                                                                                                                                       | Passes. But Shepherd carries reduced reservation, so an aura build gets some of it either way.                                                                                                                              | Low                                                                                                                |
| `cathedral.crypt.wheel` (Congregation / Glass Wall)     | minion damage / spell block                  | in at `m1`, out at `m4`; Glass Wall leaves to the Spire                                                                                                                                  | one side each way                                                                                                                                                                                       | Passes the rule. **But** the summoner just took Shepherd, five steps earlier on the same line (§1.1).                                                                                                                       | (see 0.3)                                                                                                          |
| `wall.rampart.bulwark` (Stone Heart / Mortar and Stone) | life / armour                                | in at `a` (life), out through Stone Heart to `j1`                                                                                                                                        | `a→b→Stone Heart` is 3; the armour side is a 4-node detour (`c`,`d`,Mortar,`e`)                                                                                                                         | Stone Heart carries 24% armour, so the armour build takes both: the two notables are five steps apart round one ring, and both carry armour. A fake choice.                                                                 | **Medium.** Fix: give Stone Heart life plus stun threshold or regeneration, with no armour.                        |
| `wall.maces.greatweight` (Greatweight / Broad Back)     | two-handed damage and stun / life            | in at `a` (from `j1`), out at `d` (to `j2`, Crushing Blow)                                                                                                                               | `a→Broad Back→d` is 3; `a→b→Greatweight→c→d` is 5                                                                                                                                                       | A real choice; the cheap way through takes the body. Good.                                                                                                                                                                  | —                                                                                                                  |
| `wall.grit.unbroken` (Unbroken / Tempered)              | grit / maximum resistances                   | in at `a` (grit), out at `b` (grit, to Heavy Hands)                                                                                                                                      | the through-route takes the grit side; Tempered is a 2-node detour                                                                                                                                      | Both doors carry grit duration. A build going to Blood Rite pays grit smalls.                                                                                                                                               | Low                                                                                                                |
| `yard.dual.twinFangs` (Twin Fangs / Mirror Guard)       | dual damage / dual block                     | in at `a`/`b` (home), out at `n1`/`c` (gate) and `d` (`j1`)                                                                                                                              | from home to the gate via Twin Fangs (`a,b,n1`) or Mirror Guard (`a,Mirror,d,c`)                                                                                                                        | Variants of one theme. Mirror Guard also carries 10% dual damage, which blurs it. A Strider enters at `j2→n1` and gets Twin Fangs at point 7 without the wheel.                                                             | Low. Fix: drop the damage line from Mirror Guard.                                                                  |
| `yard.shield.steelRim` (Steel Rim / Shield Catch)       | attack block / spell block                   | in at `a` (hub, star), out at `c` (`j1`, to the bleed and leech rim), `d` (`j2`), `n1` (leech)                                                                                           | from the hub to the leech (`redHarvest.a`): through Steel Rim is 4 nodes; round by `star.f`, Four Winds, `star.s`, `j2`, `d`, `c`, `j1` is 8 and passes no shield notable (only two spell-block smalls) | Both are halves of one shield, and a shield build wants both. It is also the **cheap gate to the leech rim**: the leech Vanguard (R3b) and the R2 order of the axe-bleed Reaver pay Steel Rim rather than four more points. | **Medium.** Fix: an attribute link from `yard.shield.hub` to `yard.shield.j1`, so the rim has a non-shield way in. |
| `spire.well.deepWell` (Deep Well / Glass Skin)          | mana / ES                                    | in at `a` (mana), out at `c` (ES, `j1`), `d` (ES, recharge), `n2` (Spirit Ward)                                                                                                          | one side each way                                                                                                                                                                                       | Passes. The entry small is mana, so the ES build pays one mana small.                                                                                                                                                       | Low                                                                                                                |
| `spire.craft.focus` (Arcane Focus / Warded Mind)        | spell damage and speed / ES and spell damage | in at `a`, out at `b` (column), `c` (`j1`), `n1` (Frugal); all doors are spell damage                                                                                                    | one side each way                                                                                                                                                                                       | Near-identical: Warded Mind carries 10% spell damage and every door is a spell-damage small. An ES caster wants both: they are three steps apart and both carry spell damage.                                               | **Medium.** Fix: drop spell damage from Warded Mind and make `a`/`c` neutral.                                      |
| `bow.bows.wheel` (Longbow / Sure Shot)                  | bow speed / bow crit                         | entry `e` only. The ring is **open**: Longbow and Sure Shot are dead-end tips. The description still says "closed ring of eight… the far node joins the two", but that node was retired. | both cost 7                                                                                                                                                                                             | **The §8.3 example itself:** two bow notables round one circle; buying both costs 7 points from the entry.                                                                                                                  | Low (Strider; the user flagged this kind)                                                                          |
| `bow.flight.wheel` (Far Flight / Split Volley)          | projectile damage and speed / +1 projectile  | entry `e`; the ring is open; Split Volley continues to Skewer                                                                                                                            | both cost 5                                                                                                                                                                                             | Every projectile build wants both. Fake.                                                                                                                                                                                    | Low (Strider)                                                                                                      |
| `bow.quiver.wheel` (Barbed Arrows / Deep Cuts)          | bleed chance / bleed damage                  | entry `e` and `a1` (from the steel wheel); the ring is open                                                                                                                              | —                                                                                                                                                                                                       | The description says a bleed bow "wants the chance side first", which means it wants both. Fake.                                                                                                                            | Low (Strider)                                                                                                      |

### 8.6 A notable is worth 3 to 5 units

Of the 158 notables (`notables.txt`), these fall outside 3–5 as authored:

| Notable        | Id                          | Units                                                               | Sev           | Fix                                                                              |
| -------------- | --------------------------- | ------------------------------------------------------------------- | ------------- | -------------------------------------------------------------------------------- |
| Executioner    | `yard.blades.executioner.n` | 6.5 (culling strike 3 + 20% against bleeding 2.5 + double damage 1) | Medium        | Drop the double damage, or bring damage against bleeding to 12% (about 4.5–5.5). |
| Quickening     | `spire.well.recharge.n`     | 5.33                                                                | Low           | 20% faster start (4.3).                                                          |
| Far Flight     | `bow.flight.wheel.n1`       | 5.33                                                                | Low (Strider) |                                                                                  |
| Longbow        | `bow.bows.wheel.n1`         | 5.27                                                                | Low (Strider) |                                                                                  |
| Elemental Ward | `wall.resists.star.n`       | 2.5                                                                 | Medium        | Add a line, e.g. +5% life, or match Snakeskin's and Litany's 3.5.                |
| Weathered      | `bow.steel.added.n416`      | 2.5                                                                 | Low (Strider) | Same as Elemental Ward.                                                          |

Light Hand (`bow.flight.added.n415`) is 3.17 as authored and 2.5 at §8.1 sizes, so under on the reference yardstick.

**The hand-valued lines carry the real pricing risk.** Their units are asserted, not measured:

- +1 projectile (Split Volley) at 4 units.
- Ricochet at 4.
- Pierce (Skewer) at 3.
- +1 curse (Second Curse) at 5.
- +1 charge (Hot Blood, Unbroken, Flashes of Insight) at 3.
- Culling strike at 3.

Split Volley in particular is worth "a fifth of the skill's damage" by its own comment, so on a multi-projectile bow it
is far more than four 10% projectile smalls. I flag it, without a measured verdict, as a candidate for over-strength.
That calls for one sim at the end (§12.4), not now.

**Notables nobody would take on purpose.** These are not unwanted by everyone; they are bought only because the route
forces them. Each comes from a walk:

- **Cleaver** (`wall.maces.cleaver.n`) is on the cheapest route from Greatweight to Stagger (V1 at point 15, V120 at
  15). Going round by the wheel's far side and the crit chain costs one more point (7 against 6). Crushing Blow does not
  need it: `greatweight.d → crushing.b` reaches it in 4.
- **Keen Edge** (`yard.blades.keenEdge.n`) is bought by the axe-bleed Reaver (R2 at point 8). Every route from the west
  road to Hewing passes at least two sword smalls (`keenEdge.a`, plus `b`+notable or `c`+`lightBlades.a`).
- **Steel Rim** (`yard.shield.steelRim.n1`) is bought by the axe-bleed Reaver (R2 at 17) and the leech Vanguard
  (R3b at 22). See 8.3.
- **Iron Faith or Hearthfire** (`cathedral.nave.wheel`): every Zealot past the nave buys one. The sceptre build (Z1)
  pays three 1.5-unit block smalls plus Iron Faith before reaching Gilded Rod.
- **Talon or Fine Point** (`knife.edge.wheel`): the trapper Shade (S2) buys Talon, a claw notable, on the way to
  Trapper at point 13. The only other way is the evasion road, through the dodge junction, star and Snakeskin.
- **Trapper or Carrion Claws** (`knife.snares.wheel`): a bow user going to the Knife's bow (Quiet Shot) through the
  Bow's dear road buys a trap or claw notable (T120 at point 67).
- **Spirit Ward** (`spire.well.spiritWard.n`): this is the column-to-well shortcut, and it needs a shield. A
  shieldless ES caster coming from the craft side buys it (M120 at point 15). The way round, through Broad Weave,
  Siphon and the recharge room, costs four more points, but every node on it is ES, so it is a fair alternative.
- **Hearthfire** was bought by the Vanguard on its way to Litany (V120 at point 98), but that is a tie: going through
  Iron Faith is also 5, and a shield Vanguard takes that way. Not forced.

§5.5 calls passing a different notable a fair price. That holds when it is occasional. For Steel Rim and the nave wheel
it is structural, because those are the only gates to half a region.

**Notables that are weak or muddled (low):**

- **Round Shield** (`bow.flight.added.n432`: mana regeneration, area, shield defences) has no build that wants all
  three. It is a Strider edit.
- **Hatchet Work** (`bow.steel.added.n407`: axe, bleed, melee area; 3.1 units) is an axe notable in the dex region, 9
  steps from the Strider start. It is a Strider edit.
- **Lingering** (`spire.column.lingering.n`, 3.27) only matters to cold damage-over-time casters. That is fine as a
  specific porch.

---

## §9. Keystones and the late game

### 9.2 A keystone is a trade the sheet can show

| Keystone              | Id                               | Trade on the sheet                                          | Who takes it                                                      | Verdict                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| --------------------- | -------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unerring Discipline   | `wall.rampart.unerring.k`        | never crit                                                  | a non-crit melee build                                            | OK                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Hollow Vessel         | `knife.venom.hollowVessel.k`     | life is 1                                                   | an ES Shade                                                       | OK                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Blood Rite            | `wall.grit.bloodrite.k`          | mana 0, costs paid in life                                  | a Vanguard; it is also Pain Conduit's only enabler, 43 steps away | OK                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Plated Hide           | `bow.steel.platedHide.k`         | dex gives no evasion                                        | an armour Strider or Reaver                                       | OK                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **Mind Bulwark**      | `spire.well.mindBulwark.k`       | **nothing goes down** (30% of damage taken from mana first) | every caster with spare mana                                      | **High: no sheet cost.** Fix: add a visible cost, e.g. "20% less mana regeneration" or "cannot leech mana".                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Searing Avatar        | `cathedral.pyre.searingAvatar.k` | unconverted damage is not dealt                             | a fire sceptre with physical base damage                          | OK. A no-op for pure-fire spells, which is honest.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Close Quarters        | `bow.flight.closeQuarters.k`     | less damage at range                                        | a hold-ground Strider (a Strategy-tab tie, allowed by §1.4)       | OK                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Crimson Pact          | `yard.blood.crimsonPact.k`       | no life regeneration                                        | a leech Reaver                                                    | OK                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Fever Pitch           | `spire.frost.feverPitch.k`       | crit multiplier fixed at 100%                               | a crit elemental caster                                           | OK, a real trade. Reaching it costs Thunderhead and Shatter (intended).                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **Pain Conduit**      | `spire.storm.painConduit.k`      | **nothing**                                                 | see 0.6                                                           | **High.** In the sim, low life also comes from taking damage (`combat.ts:112`), so any caster gets 30% more damage when nearly dead, for free. A deliberate low-life build needs ≥65% of life reserved; only Blood Rite gives that, 43 steps away, and Hollow Vessel and Living Ward never count as low life (1 ≤ LOW_LIFE × 1 is false for any threshold under 100%). Fix: give it a cost (e.g. "20% less maximum life", which also pushes toward low life), and put a life-reservation source in the Spire or Knife, or move the keystone. |
| Rooted Stance         | `wall.maces.rooted.k`            | cannot evade                                                | the Vanguard, who has almost no evasion                           | **Medium: the cost falls on a stat its natural taker lacks**, so it is a near-free lunch. Fix: a cost the Vanguard feels, e.g. "10% less armour" or "20% less movement speed".                                                                                                                                                                                                                                                                                                                                                               |
| Prismatic Balance     | `spire.frost.prismatic.k`        | +25% resistance to the hit's own elements                   | only a two-element rotation profits                               | **Medium: few will take it** in an autobattler with one main skill. Its approach smalls are undersized (8.1-B).                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Living Ward           | `cathedral.choir.livingWard.k`   | life is 1                                                   | a regeneration-ES Zealot                                          | OK                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Shade Leech           | `knife.venom.shadeLeech.k`       | 50% slower recharge                                         | a leech-ES Shade                                                  | OK                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Strongarm             | `wall.slams.strongarm.k`         | dex gives no evasion                                        | a strength thrower or bow totem                                   | Medium: the same issue as Rooted Stance (a Vanguard has little dex evasion).                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Wound Dance           | `yard.blood.woundDance.k`        | 50% less bleed damage per stack                             | a bleed Reaver                                                    | OK                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Cruel Agony           | `knife.venom.cruelAgony.k`       | 30% less crit hit damage                                    | a crit-poison Shade                                               | OK                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Mana Bastion          | `spire.craft.manaBastion.k`      | ES no longer protects life                                  | an ES caster                                                      | OK                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Arrow Weave           | `bow.string.arrowWeave.k`        | −30% evasion against melee                                  | a kiting Strider                                                  | OK                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Shieldwall            | `yard.shield.shieldwall.k`       | 30% less evasion                                            | a shield Reaver                                                   | OK                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Nimble Gambit         | `knife.edge.nimble.k`            | less armour, ES and block                                   | an evasion Shade                                                  | OK                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Spellslip             | `knife.hex.spellslip.k`          | 30% less ES                                                 | an evasion Shade or low-life Mystic                               | OK                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **Volatile Servants** | `cathedral.crypt.volatile.k`     | **nothing**                                                 | every summoner                                                    | **High: a free lunch.** Fix: e.g. "minions have 30% less life", or "minions deal 20% less damage".                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Idle Hands            | `cathedral.rods.idleHands.k`     | your own skills deal no damage                              | totem, trap, mine and minion builds                               | Low. A summoner loses nothing; the cost is real only for hybrids (PoE's equivalent works the same way).                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Sigil Warden          | `cathedral.crypt.sigilWarden.k`  | totems deal 40% less                                        | brand builds, which have no totems                                | **Medium: the cost misses its taker.** Fix: a brand-side cost (e.g. "brands have 30% less duration").                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Lone Vow              | `cathedral.choir.loneVow.k`      | only the first aura works                                   | a one-aura build                                                  | OK. Its approach (aura effect) is right.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Steady Draw           | `bow.bows.steadyDraw.k`          | 20% less bow attack speed                                   | a heavy bow                                                       | OK                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

### 9.3 Good late-build decisions

Summary of the six 120-point walks (full walks in §15.2):

| Class                                        | Points used for the coherent build | Points at home | Where the rest went                | Keystones that fit                   | Late decision quality                                                                                                                                                                                                                                                    |
| -------------------------------------------- | ---------------------------------- | -------------- | ---------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Shade (crit-poison dagger, life and evasion) | 98                                 | Knife 41       | Bow 27, Yard 19, centre 11         | Cruel Agony, Nimble Gambit           | The home runs out at about 45 points; every Knife notable a dagger build can use is bought by point 34. After that it goes to the Strider's crit, evasion and life and the Yard's dual wield. The crossings work, but nothing inside the Knife competes for late points. |
| Zealot (fire sceptre with auras and armour)  | 103                                | Cathedral 44   | Wall 40, Spire 14, centre 5        | Searing Avatar, Lone Vow             | Exhausted at about 55. **The Wall is effectively the Zealot's second home** (Banner at point 4, then Weight of Iron, Stone Heart, Mortar and Stone, Bracing, Elemental Ward, Tempered, Unbroken, Second Wind).                                                           |
| Mystic (crit lightning with ES)              | 113                                | Spire 66       | Knife 24, Cathedral 12, centre 11  | Fever Pitch, Mana Bastion, Spellslip | Healthy: the Spire alone carries it to about 66. Late points go to the Knife's Spellslip and Keen Instinct and the Cathedral's Hymn, Litany and Vigil. The Cathedral crossing also bought Hearthfire, a fire spell notable, on the way to Litany.                        |
| Vanguard (two-handed mace stun with armour)  | 111                                | Wall 70        | Yard 18, Cathedral 10, centre 13   | Rooted Stance, Blood Rite            | The Wall supplies about 70 points. The late game is all defence borrowed from the Yard (Guarded, Stout Heart, Four Winds, Red Harvest via forced Steel Rim) and the Cathedral (Zeal, Litany via forced Hearthfire). No offensive crossing exists for a two-handed mace.  |
| Reaver (dual sword crit with leech)          | 109                                | Yard 57        | Bow 26, Wall 16, centre 8, Knife 2 | Crimson Pact only                    | **Thin keystone choice.** The Reaver's own Shieldwall and Wound Dance are for other builds. The nearest others (Strongarm and Plated Hide at 12, Steady Draw at 13) are for projectiles or a different defence.                                                          |
| Strider (crit projectile bow)                | 110                                | Bow 76         | Knife 12, centre 15, Yard 7        | Steady Draw, Arrow Weave             | The home carries it to about 76. Quiet Shot (the Knife's bow) costs Trapper on the dear road.                                                                                                                                                                            |

**Findings:**

- **9.3-A (high).** The Zealot's late game _is_ the Wall, and the Shade's late game is the Strider plus the Yard. That
  matches §9.3's "late game lives in neighbours". But it happens because both homes are short: 17 and 15 notables, run
  out by about point 50. In the other four regions it happens because the home is finished at 70–80. The Cathedral
  needs new clusters as much as the Knife does.
- **9.3-B (medium).** The Reaver has no second keystone for its main build. Fix: a keystone or second keystone spur
  for dual wield or one-handers near the Lists or Practice Ground, or move one of the 27 there.
- **9.3-C (low).** The Vanguard's late offence has nowhere to go. Every crossing is defence. Weight of Iron
  carries sceptre lines but Gilded Rod carries no mace line, so a mace build gets nothing at the Cathedral.

---

## §12. Size and balance

**12-A: units per point by walk.** The 20-point walks fall between 1.63 and 2.21 units per point, so the main builds
are comparable on paper. The table counts keystones as 0 units, and it inherits finding 8.1-A.

| Walk                       | Units per point |
| -------------------------- | --------------- |
| S1 Shade, crit dagger      | 1.92            |
| Z1 Zealot, fire sceptre    | 2.02            |
| M1 Mystic, ES cold         | 2.02            |
| M1b Mystic, crit lightning | 1.71            |
| V1 Vanguard, mace stun     | 1.82            |
| R1 Reaver, dual swords     | 1.95            |
| T1 Strider, crit bow       | 2.04            |

The off-builds and neighbours are lower, as they should be:

| Walk                   | Units per point | Why                   |
| ---------------------- | --------------- | --------------------- |
| V2 Strongarm totem     | 1.38            | includes the keystone |
| V3 Reaver to Cleaver   | 1.63            |                       |
| R3b Vanguard leech     | 1.63            |                       |
| T3 Reaver into the Bow | 1.63            |                       |

The 120-point builds all land at 1.92–2.08.

The Shade's S1 is flattered by its 5% attack-speed road (three nodes counted at 5 units). At §8.1 sizes it drops to
about 1.80.

**12-B (high): region size is lopsided.**

| Region   | Nodes | Notables | Keystones |
| -------- | ----- | -------- | --------- |
| Strider  | 143   | 32       | 4         |
| Mystic   | 139   | 33       | 5         |
| Vanguard | 121   | 29       | 4         |
| Reaver   | 119   | 28       | 3         |
| Zealot   | 88    | 17       | 6         |
| Shade    | 80    | 15       | 5         |

§16 names only the Knife. The walks show the Cathedral has the same problem: the Zealot's sceptre, aura and summoner
builds each find their whole home within 17–24 points (Z1, Z1b, Z2), and the caster has one cluster.

- **Fix:** new Cathedral clusters (§12.2 allows them), specifically:
  - a spell-damage cluster for the sceptre caster;
  - a second fire-attack or mace-and-sceptre cluster off the spine;
  - a second minion cluster away from the choir-to-crypt line.

**12-C (medium): reach is uneven for the same kind of build.**

| Build kind | Cluster                                     | Steps from the nearest start |
| ---------- | ------------------------------------------- | ---------------------------- |
| Totems     | Standing Cairns (Vanguard)                  | 9                            |
|            | Sentry Post (Strider)                       | 10                           |
|            | Reliquary (Zealot)                          | 19                           |
| Brands     | Runecarver, the only brand cluster (Zealot) | 19                           |
| Minions    | Shepherd (Zealot)                           | 12                           |
|            | Familiars (Mystic)                          | 17–19                        |
| Traps      | Tripwire (Strider)                          | 8                            |
|            | Trapper (Shade)                             | 12                           |

A brand build spends about 19 points before its first brand line.

- **Fix:** a second brand cluster in the Spire craft or the Cathedral nave.

**12-D: the start's first four points are comparable.** The signature notables are 3.9 (Oathbound) to 4.9 (Quickened
Steel). The first hub pockets are at four points for every class. No action needed. The Zealot's first non-signature
notable is the Wall's Warlord's Banner, at three points (`cathedral.home.hubs.w ↔ wall.resists.banner.n`); that is
intended by its `why`.

---

## §15.2 Walks

Each walk below lists the notables in the order bought, with the point at which each was bought. Smalls and roads are
in the raw files. In the walks:

- **Chose** is what the build picked.
- **Gave up** is what it did not take.
- **No choice** is a stretch with no fork.
- **Forced** is a node every route passes.
- **Nobody** is a notable nobody would take on purpose.

### The Shade (knife), never walked before

#### S1. Main build: crit dagger (Shade start, 17 points to four notables)

Keen Instinct @2, Fine Point @8, Soft Step @12, Barbed Point @17. Probes: Cruel Agony 5 more (22), Snakeskin 2 more.

- **Chose:** the blade road (5% attack speed ×3), then the edge wheel's dagger side, then the venom wheel's dagger side.
- **Gave up:** nothing. Both dagger notables (5 steps apart) and the crit keystone are on the one spine
  `roadB → edge.wheel → j2 → venom.wheel → j5 → cruelAgony`. The claw side and Shroud are the alternatives, but a
  dagger build never wants them.
- **No choice:** `roadB.a`/`b`/`c`, then `wheel.w1`, then `j2`, then `v1` is a single line from the signature to the
  venom wheel.
- **Verdict:** **High, §1.1: everything in one place.** Twin distance 5 is legal (§5.2), but the twins are in series on
  the only road, so taking both costs nothing extra.
- **Fix:** the venom wheel's offensive side is a second weapon side behind a weapon wheel. A plain swap with Carrion
  Claws would only move the problem to claws (Talon and Carrion Claws in series). Instead, make the venom wheel's north
  side poison without a weapon: drop `daggerDamage` from Barbed Point and keep its poison chance and poison damage
  plus one partner line. Then both weapons choose once, at the edge wheel, and poison is a separate decision.
  Festering becomes its poison twin, 7 steps away with a different partner (crit and ES against mines), which passes
  §5.1–5.2.

#### S2. Off-build: trapper (Shade, 15 points)

Keen Instinct @2, Talon @7 (nobody), Trapper @13, Spoils @15. Probes: Tripwire 5 more, Sapper 4 more.

- **Chose:** the shield road to the claw side, then the venom junction, then the trap junction.
- **Gave up:** Soft Step and the dodge side.
- **Cheapest route:** Talon, a claw notable, or Fine Point. The only alternative is the evasion road, dodge junction,
  `nimble.a`, star and Snakeskin, with the same cost through a resist star.
- **Notes:** traps arrive at point 12–13. The Strider's Tripwire, 8 steps from the Strider, is closer to its own start
  than Trapper is to the Shade's. Medium.

#### S2b. Off-build: ES Shade heading for Hollow Vessel (14 points)

Spoils @4, Thick Blood @9, Shroud @14. Hollow Vessel is 5 more (19).

- Fine. Thick Blood carries life, which Hollow Vessel then throws away. That is a small anti-synergy, acceptable as a
  porch.

#### S3. Neighbour in: Mystic curse and mine caster (17 points)

First Light @2, Arcane Focus @10, Hexwright @15, Sapper @17. Second Curse is 4 more; Festering 1 more.

- **Chose:** the craft road (cast speed), then the craft wheel's damage side, then Hexwright.
- **Forced:** Arcane Focus or Warded Mind; both suit a caster.
- **Notes:** the near crossing works: Hexwright lands on the hex wheel's north node. Then the hex wheel's poison entry
  small (`s`) and mine exit small (`n`) problem bites from this side too.

#### S3b. Neighbour in: Strider with a dagger (11 points)

Hawk's Eye @2, Soft Step @7, Fine Point @11. Barbed Point is 5 more.

- The near crossing is good: `bow.bows.toKnife` to `softStep.b`.

#### S120. Late build: crit-poison dagger, life and evasion (98 points used; `w120-shade.txt`)

Knife, in order:

- Keen Instinct @2, Fine Point @8, Soft Step @12, Snakeskin @14, Barbed Point @19, Thick Blood @21.
- Cruel Agony (keystone) @26, Festering @30, Spoils @33, Second Curse @34.
- Nimble Gambit (keystone) @37.

Neighbours:

- **Bow (dear road `knife.snares.toBow`, 4 attribute nodes):** Venom Fletching @45.
- **Centre:** Quick March @48, Shelter @53.
- **Strider:** Vital Aim @60, Wayfarer @63.
- **Yard, through `bow.steel.road.jt1` to `yard.dual.j2`:** Twin Fangs @66, Crossed Blades @73, Hot Blood @74,
  Sidestep @75.
- **Strider:** Wanderer @77, Fleet Foot @80, Hard Target @81, Long Breath @85, Light Hand @86, Quick Hands @90.
- **Yard:** Mirror Guard @91, Iron Draw @93 (passed, not wanted), Light Blades @98.

What the walk shows:

- **The home is exhausted by point about 34.** Of the Knife's 15 notables, the dagger build takes 9. The rest are
  claw, trap, mine, ES or Shroud.
- **Late points go to neighbours.** The crossings work: Bow by the dear road, the Strider by the ring, and the Yard's
  dual wield through `yard.dual.j2`. They are genuine late decisions (dual wield or Strider defences), which §9.3 wants.
- **No dual-wield or claw-and-dagger crit line exists in the Knife.** The dual-dagger Shade's crit multiplier comes from
  the Yard's Crossed Blades or the Strider's Vital Aim and Killing Eye.

### The Zealot (cathedral), never walked before

#### Z1. Main build: fire sceptre (17 points)

Zeal @2, Iron Faith @7 (cheapest route, see below), Gilded Rod @12, Kindled Steel @17. Searing Avatar is 5 more (22).

- **Chose:** the block road. The middle road (life ×3) ties.
- **Gave up:** Hearthfire, or Iron Faith if it went the other way.
- **Cheapest route:** the nave wheel. Every short route from home to `jN` passes Iron Faith or Hearthfire; the only alternative is the
  choir, star and Litany. A sceptre attacker wants neither.
- **No choice after that:** `jN`, rods wheel, `jR`, pyre wheel, `jF`, Searing Avatar is one straight line.
- **Verdict:** **High, §1.1.** Sceptre damage, fire attacks and the conversion keystone are in series on one line.
- **Fix:** move Kindled Steel, or the whole fire-attack side, off the spine. One option: give the pyre wheel a non-fire
  side and put fire-with-attacks on the Wall dear road (`cathedral.rods.toWall`), beside Idle Hands. Then the fire
  sceptre picks the tower (sceptre plus keystone) or the crossing (fire attacks).

#### Z1b. Off-build: auras (24 points)

Zeal @2, Warlord's Banner @4 (the Wall's, by design), Hymn @8, Choirmaster @14, Litany @16, Quarterstaff @19 (passed),
Benediction @24. Lone Vow is 5 more.

- **Chose:** the Banner pocket, the mana pocket, then the choir's aura side.
- **Gave up:** Shepherd.
- **Notes:** the second aura cluster, Benediction, is the far twin, and the walk to it passes a weapon notable
  (Quarterstaff or Gilded Rod). That is a fair §5.5 price.
- Banner, Hymn, Choirmaster and the keystone are all within 13 points: the aura start is generous. Devotion (the
  Spire's aura) is 21 steps from Choirmaster: a good spread.

#### Z2. Off-build: summoner (17 points)

Zeal @2, Hymn @6, Shepherd @12, Congregation @17. Familiars is 5 more (dear road to the Spire); Volatile Servants 5
more.

- **Gave up:** nothing. **High, §1.1:** both minion notables, five steps apart on the transept-to-choir-to-crypt line,
  and the keystone too. The route through the choir wheel takes either side, so the summoner simply takes the minion
  side twice.
- **Fix:** make the crypt wheel's minion side something else (e.g. a brand or totem variant, moving the shrine's split
  onto it), and let Familiars, 8 steps from Shepherd across the dear road, be the second minion cluster.

#### Z2b. Off-build: fire caster (8 points)

Zeal @2, Hearthfire @8. Then nothing:

| Next spell notable | Points beyond Hearthfire |
| ------------------ | ------------------------ |
| Arcane Focus       | 14                       |
| Cinder             | 16                       |
| Flashpoint         | 19                       |

- **High: a build that can't be made.** The Cathedral sells no other spell damage, cast speed or spell crit; only the generic elemental damage on Zeal and Gilded Rod helps. A Zealot
  caster is a Mystic tourist from point 8.
- **Fix:** add a Cathedral spell cluster, e.g. elemental spell damage with block for the sceptre caster, about 5 or
  more steps from Hearthfire.

#### Z3. Neighbour in: Vanguard with a shield (14 points)

Oathbound @2, Bracing @5, then 4 attribute nodes round the ring, then Iron Faith @14.

- **Notes:** the walk used the ring, not the near crossing `wall.resists.j` to `cathedral.nave.toWall`, which was
  longer from this start. The shield Vanguard gets both block notables by 14 points (13 steps apart, different
  partners). Good.

#### Z3b. Neighbour in: Mystic summoner (19 points)

First Light @2, Still Mind @5, Deep Well @10, Quiet Pulse @15, Familiars @19. Shepherd is 4 more (Draught to Shepherd);
Congregation 5 more.

- **Forced:** the walk goes through the well. Deep Well (mana) and Quiet Pulse (life) are a fair price, but the
  Mystic's own minion cluster is about 17–19 points from its start. Medium.

#### Z120. Late build: fire sceptre with auras and armour (103 points; `w120-zealot.txt`)

Cathedral:

- Zeal @2, Banner @4, Hymn @8, Iron Faith @12, Gilded Rod @17, Kindled Steel @22, Benediction @24.
- Searing Avatar (keystone) @28, Litany @30, Choirmaster @32, Lone Vow (keystone) @37, Vigil @39, Alms @40.

Then the Wall, by the Banner pocket to its north hub:

- Oathbound @45 (the Vanguard's signature, passed), Weight of Iron @51 (mace and sceptre lines), Stone Heart @56,
  Elemental Ward @59, Mortar and Stone @61, Bracing @62, Quartermaster @65.

Then the Spire, by the crypt and `toSpire`:

- Glass Wall @68, Familiars @71 (passed), Hoarfrost @75 (passed), Mist Walk @81 (passed), Devotion @84.
  Devotion is better reached by the ring; the tool took the tied path.

Then the centre and the Wall again:

- Shelter @89, War Drums @94, Tempered @98, Second Wind @100, Unbroken @101, Steady Hands @103.

What the walk shows:

- **The Cathedral is finished at about point 40.** Everything after is Wall.
- **Two keystones fit.** Lone Vow and the Banner's, Choirmaster's and Devotion's reduced reservation are anti-synergy:
  with Lone Vow, reservation lines do nothing. The walk bought three reservation notables and the keystone that
  nullifies them, which is a real late decision.
- **Weight of Iron is the Zealot's best weapon crossing** (sceptre lines are on it). The Cathedral sells no stun or
  crit second sceptre cluster.

### The Mystic (spire)

#### M1. Main build: ES cold (19 points)

First Light @2, Glass Skin @8, Quickening @11, Siphon @14 (passed), Hoarfrost @19. Prism Ward is 2 more; Shatter 7
more; Mind Bulwark 5 more.

- **Chose:** the well road (ES ×3), the wheel's ES side, the recharge room, Siphon, the spell-area smalls, the fork,
  then Hoarfrost.
- **Gave up:** Deep Well, Arcane Focus and the craft.
- **Notes:** the ES caster's west side is consistent: every step is ES, and Hoarfrost is cold with ES. Shatter, 7 more,
  is the honest alternative. Medium-low concern: no trade between ES and cold until Shatter.

#### M1b. Main build: crit lightning (18 points)

First Light @2, Sharp Mind @6, Arcane Focus @11, Thunderhead @18. Flashes of Insight is 4 more; Overcharge 5 more;
Fever Pitch 7 more (via Shatter).

- **Gave up:** Warded Mind and the well.
- **Units:** 1.71 per point, the lowest main-build figure: many plain 1-unit smalls, and the fork and junctions.
- **Notes:** Fever Pitch costs both Thunderhead and Shatter (cold), as designed. Good tension.

#### M2. Off-build: wand attacker (17 points)

First Light @2, Arcane Focus @10 (forced, and nobody: spell damage), Frugal @12, Wand Volley @14, Darting Bolts @17
(nobody: its damage is spell projectile only).

- **High: a build that can't be made beyond one cluster.** Wand Volley is the Spire's only wand-attack notable.
  Wandwork is wand _spell_ damage, 12 steps away. Darting Bolts' damage lines are tagged `spell`; only its projectile speed is generic.
- **Fix:** a second wand-attack cluster with a different partner (e.g. wand plus mana leech by Mana Tap, or wand plus
  crit by Sharp Mind). Or make Darting Bolts' notable carry projectile damage that is not spell-only, since its own
  `why` claims the two share a wheel.

#### M3. Neighbour in: Shade crit caster (14 points)

Keen Instinct @2, then 3 ring nodes, Sharp Mind @9, Arcane Focus @14. Flashpoint is 7 more; Flashes of Insight 4
more. Good.

#### M3b. Neighbour in: Zealot frost caster (15 points)

Zeal @2, Hymn @6, then 3 ring nodes, Glass Skin @15. Hoarfrost is 9 more. Fine.

#### M120. Late build: crit lightning with ES (113 points; `w120-mystic.txt`)

Spire:

- First Light @2, Sharp Mind @6, Arcane Focus @11, Warded Mind @12, Spirit Ward @15 (cheapest route from the column to the
  well; needs a shield), Glass Skin @17, Quickening @20, Prism Ward @22.
- Thunderhead @27, Flashes of Insight @31, Overcharge @36, Shatter @40 (forced for Fever Pitch).
- Fever Pitch (keystone) @43, Harsh Weather @44, Mana Bastion (keystone) @47.
- Frugal @49, Darting Bolts @50, Lingering @51.

Centre: Shelter @54.

Spire again: Hexwright @56, Devotion @59, Mist Walk @60, Deep Well @62, Still Mind @65.

Knife and others:

- Spellslip (keystone) @71, by the hex climb.
- Keen Instinct @76, by the ring.
- Quiet Pulse @79, Siphon @80.
- Cathedral by the ring: Hymn @86, Hearthfire @91 (on the tool's path to Litany), Litany @93, Vigil @95.
- Knife and centre again: Spoils @97, Festering @98, Thick Blood @102, Soft Step @106, Quick March @109,
  Snakeskin @113.

What the walk shows:

- **The healthiest late game.** Two or three keystones fit, and the home lasts to about 66 points.
- **The weak spot:** after about 80 points the crossings offer generic defence only.

### The Vanguard (wall)

#### V1. Main build: two-handed mace stun (19 points)

Oathbound @2, Weight of Iron @8, Greatweight @13, Cleaver @15 (cheapest route; avoiding it costs one point; nobody: axe), Stagger @19. Crushing Blow is 1
more; Rooted Stance 6 more.

- **Chose:** the tower road (melee physical ×3), then maces, then the two-hander wheel's damage side.
- **Gave up:** Broad Back, the rampart and the slams.
- **Verdict: high, §1.1-adjacent.** Three stun notables (Weight of Iron, Greatweight, Stagger), the mace crit (Crushing
  Blow) and Rooted Stance all sit inside the Barbican and the rampart's top, within about 26 points. Weight of Iron and
  Crushing Blow are 7 apart, so their spread is legal, but stun is offered three times within 6 steps.
- **Fix:** move Stagger (generic stun, "for any weapon") away from the mace tower. It would serve a sword or axe stun
  build from the Yard border, e.g. near the slams or the Practice Ground crossing. Fixing Cleaver's place (§16) also
  takes the axe notable off the cheapest route.

#### V1b. Off-build: mace and shield with armour (18 points)

Oathbound @2, Mortar and Stone @9, Stone Heart @11 (both targeted; the two carry armour, which is the fake choice in 8.3), Bracing @14, Weight
of Iron @18. Crushing Blow is 6 more.

#### V2. Off-build: totem with Strongarm (16 points)

Thunderstep @7 (tie with Unhurried; a two-handed slam notable, nobody for a bow totem), Standing Cairns @11, Strongarm
(keystone) @16.

- **Units:** 1.38 per point.
- **Notes:** the bow-totem Vanguard is buildable. The Strider's Sentry Post is 37 steps from Reliquary and
  `wall.slams.cairns` is far from both, so totem clusters are well spread.

#### V2b. Off-build: warcries and grit (19 points)

Oathbound @2, Unbloodied @12 (forced to War Drums: `unbloodied.c → drums.a`, or Vampiric Strikes), War Drums @15,
Unbroken @19. Blood Rite is 6 more.

#### V3. Neighbour in: Reaver with an axe (22 points; over budget)

Quickened Steel @2, Keen Edge @8 (nobody: sword), Hewing @11.

- After Hewing it crosses through Guarded's smalls, then three slam smalls, then three mace smalls, then `j1`, and
  reaches Cleaver @22.
- **Confirms §16:** Cleaver is unreachable within 20 points from the Yard. The road to it passes 8 smalls of three
  unrelated themes.

#### V3b. Neighbour in: Zealot with shield and armour (17 points)

Zeal @2, Banner @4, Oathbound @9 (the Vanguard's signature, passed), Bracing @12, Stone Heart @17.

- **Notes:** the Banner pocket makes the Zealot and Vanguard homes 7 steps apart. That is a strong, intended near
  crossing, but the Zealot buys the Vanguard's signature on the way in.

#### V120. Late build: two-handed mace stun with armour (111 points; `w120-vanguard.txt`)

Wall:

- Oathbound @2, Weight of Iron @8, Greatweight @13, Broad Back @14, Cleaver @15 (cheapest route), Stagger @19,
  Crushing Blow @20.
- Rooted Stance (keystone) @25.
- Stone Heart @29, Mortar and Stone @31, Thunderstep @33, Ground Shaker @35, Vampiric Strikes @37, War Drums @40,
  Unbroken @43, Tempered @44, Heavy Hands @46, Elemental Ward @48, Second Wind @50, Quartermaster @52,
  Thick Skin @55, Iron Lungs @56, Steady Hands @57, Unshakable @60, Unbloodied @62, Scar Tissue @65.

Yard:

- Guarded @67, Stout Heart @70.
- Blood Rite (keystone, back in the Wall) @74.
- Killing Pace @78, Four Winds @81, Steel Rim @84 (cheapest route; 4 more round by Four Winds), Red Harvest @86.

Cathedral and centre:

- By the ring: Zeal @92.
- By the near crossing: Hearthfire @98 (a tie with Iron Faith), Litany @100.
- Shelter @106, Well Rounded @110, Provisions @111.

What the walk shows:

- **The Wall alone carries 70 points**, and almost every Wall notable is bought. That is good depth.
- **Late crossings are defence only.** The near crossings (Yard by Thick Skin and Guarded, Cathedral by `toWall`) work.

### The Reaver (yard)

#### R1. Main build: dual swords (21 points)

Quickened Steel @2, Buckler @6 (tie; nobody for a dual-wielder), Twin Fangs @8, Keen Edge @14, Crossed Blades @21. Hot
Blood is 1 more; Light Blades 3 more; Fencer's Eye 7 more.

- **Chose:** dual damage, sword damage, dual crit.
- **Gave up:** block, shields, the axe.
- **Forced:** Twin Fangs' block smalls `c` and `d` (3 units of dual block) on the way to Crossed Blades, by way of
  `j1` and Hot Blood's smalls.
- **Verdict:** acceptable. The sword (west) and dual-wield (east) halves are 6–7 apart, so the build does cross the
  region.

#### R2. Off-build: axe bleed (22 points with Executioner first)

Quickened Steel @2, Keen Edge @8 (nobody), Hewing @11, Elemental Edge @14 (forced on the chain), Executioner @17 (6.5
units), Standard Bearer @18 (on the chain), then Open Veins @22. Wound Dance is 4 more.

- The other order (R2) goes Keen Edge, Hewing, Killing Pace, then Steel Rim (cheapest route, nobody), then Open Veins @21 and
  Executioner @26.
- **Notes:** the chain is complete, but it passes Keen Edge (sword) and one of Elemental Edge or Steel Rim. The
  executioner chain is the axe-bleed build's whole west side. Medium.

#### R2b. Off-build: sword and shield (21 points)

Quickened Steel @2, Buckler @6, Steel Rim @13, then leech and bleed smalls, then Shield Bash @21. Shieldwall is 5 more.

- **Notes:** Shield Bash, the shield-attack notable, is at the rim. The path there passes 2 leech and 2 bleed smalls.
  Medium-low.

#### R3. Neighbour in: Strider dual wield (15 points)

Hawk's Eye @2, Twin Fangs @7 (from `yard.dual.j2` straight onto the notable), Hot Blood @12, Crossed Blades @15.

- **Notes:** by shortest distance (`reach.ts`) the Strider reaches the Reaver's dual notable in 5 steps, against the Reaver's own 6. Medium: the
  `j2 ↔ twinFangs.n1` link hands the notable to the neighbour without the wheel. Fix: drop `j2 ↔ n1` and keep
  `j2 ↔ c`.

#### R3b. Neighbour in: Vanguard with leech (24 points)

Oathbound @2, Thick Skin @8, Guarded @12, Killing Pace @18, Steel Rim @22 (cheapest route; 4 more to avoid), Red Harvest @24. Crimson Pact is 6
more.

#### R120. Late build: dual sword crit with leech (109 points; `w120-reaver.txt`)

Yard:

- Quickened Steel @2, Buckler @6, Twin Fangs @8, Keen Edge @14, Light Blades @17, Crossed Blades @24, Hot Blood @25,
  Four Winds @28, Fencer's Eye @32, Red Harvest @35.
- Crimson Pact (keystone) @41.
- Thirsting Blade @42, Stout Heart @43, Fighting Breath @45, Sidestep @46, Killing Pace @48, Field Dressing @51,
  Guarded @52, Elemental Edge @55.

Strider, through `j2`:

- Vital Aim @59, Wayfarer @62, Hawk's Eye @66 (the Strider's signature, passed), Hard Target @71, Quick Hands @73,
  True Aim @75.

Wall:

- Thick Skin @77.

Centre and Yard:

- Well Rounded @80, Mirror Guard @81.

Strider:

- Long Breath @83, Fleet Foot @84.

Wall, through the slams:

- Vampiric Strikes @92, Unbloodied @93, Second Wind @103.

Knife:

- Soft Step @109.

What the walk shows:

- **One keystone.** See 9.3-B.
- **The late game spreads well:** the Strider's accuracy and speed, the Wall's leech and full-life damage.

### The Strider (bow), the user's edit

#### T1. Main build: crit bow (20 points)

Hawk's Eye @2, Vital Aim @7, Sure Shot @14, Elemental Fletching @17, Longbow @20. Steady Draw is 3 more; Split Volley 8
more.

- **Gave up:** nothing.
- **Verdict:** both bow-wheel notables (targeted, and both are bow lines), the elemental pocket and the crit pocket all
  fit within 20 points in the Hedgerows.
  **§1.1 and §8.3 (the bow example).** Low here only because this is the user's edit.

#### T2. Off-build: bleed bow (23 points)

Hawk's Eye @2, then 7 dex road nodes in a row (points 3–9), Barbed Arrows @13, Deep Cuts @20, Rapid Fire @23.

- **No choice:** points 3–9 are a stretch of dex road. Clusters do hang off it (Steady Draw, Tripwire, Close Quarters,
  Venom Fletching), so it passes §7.3.
- **Notes:** both bleed notables are on one ring, so this is a fake choice.

#### T2b. Off-build: bow totem (13 points)

Hawk's Eye @2, Thirsty Quiver @11, Sentry Post @13. Fine.

#### T3. Neighbour in: Reaver bow (27 points)

Quickened Steel @2, Iron Draw @9.

- Then Twin Fangs' block smalls `c` and `d` (forced from `j1` to `j2`), then 6 dex road nodes to Heavy Draw @24 and
  Split Volley @27.
- **Notes:** within 20 points the Reaver bow has Iron Draw only. That is acceptable for a neighbour.

#### T3b. Neighbour in: Shade poison bow (26 points)

Keen Instinct @2, Soft Step @6, then 6 dex nodes, Venom Fletching @15, then the dear road (4 nodes), Trapper @23
(forced), Quiet Shot @26.

- **Notes:** Quiet Shot, the Knife's bow, is reachable from the Bow only through the trap wheel. From the Knife it
  hangs off `venom.j5` (3 from Barbed Point).

#### T120. Late build: crit projectile bow (110 points; `w120-strider.txt`)

Bow:

- Hawk's Eye @2, Vital Aim @7, Sure Shot @14, Longbow @17, Elemental Fletching @20.
- Steady Draw (keystone) @23.
- Far Flight @30, Split Volley @32, Skewer @35, Ricochet @40, True Aim @42, Quick Hands @44, Fleet Foot @47,
  Hard Target @48, Long Breath @50, Wayfarer @53, Quick Sip @56, Killing Eye @57, Rapid Fire @58.
- Arrow Weave (keystone) @60.

Knife, by the dear road:

- Trapper @67 (forced), Quiet Shot @70, Soft Step @73.

Bow and centre:

- Clear Head @75, Weathered @78, Quick March @81, Shelter @88, Thirsty Quiver @94, Heavy Draw @96.

Yard:

- Iron Draw @103, Wanderer @104 (Bow), Sidestep @105, Well Rounded @110.

What the walk shows:

- **The bow build's whole offence is bought by point about 40.** Everything after is defence, speed and crossings.

---

## Things confirmed from §16 (already known)

- **The Knife is thin** (15 notables). S120 runs out of home at about point 34.
- **Cleaver is far from dex.** V3 cannot reach it in 20 points from the Yard, and it sits on V1's cheapest route to Stagger.
- **One staff cluster.** Quarterstaff (`cathedral.rods.wheel.r5`) is the only staff line in the network. A staff build
  shares the Zealot spine with the sceptre build and has no twin.
- **The road skeleton.** The walks show long dex runs (T2, T3) that pass §7.3, because clusters hang off them. The
  Knife and the Cathedral are cluster-to-cluster chains with almost no road; that matches §16.
