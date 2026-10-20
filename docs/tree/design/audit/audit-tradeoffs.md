# Audit: trade-offs (CONSTRAINTS §1, §4, §5, §10, §13 t2/t6)

> Copied into the repo on 2026-10-20 from the session scratchpad. The renders (`all.png`, `<region>.png`, `net-box-*.png`), listings and scripts (`../net/*.ts`, `*.ts`) it refers to stayed in the scratchpad and are not in the repo. The network has changed since: see `../E-audit-pass.md`.

Audited 2026-10-20 against `docs/tree/design/CONSTRAINTS.md`. Read-only. Network as built by `buildAll` (edits.json is empty,
so the area files are the whole network). Every node id below is `<area>.<cluster>.<node>`; the file is
`src/data/passives/<region-dir>/<area>.ts` (wall.maces → `wall/maces.ts`, bow.flight → `bow/flight.ts`, centre.inner →
`centre/clusters.ts`).

Evidence, all in this folder:

- `listing.md`: full node listing (`scripts/passives/list.ts`).
- `spec.ts` / `spec.txt`: per specialization, every notable that carries it, its partner lines and the steps to its nearest twin.
- `close.ts`: every pair of notables or keystones two steps apart or closer.
- `nb.ts`: the neighbours of each node, with its lines.
- Renders: `all.png` and `<region>.png`, fresh. All six regions and the whole map were viewed.
- Walks: the scratch `walk.ts`, quoted inline.

Strider items are marked **[user region]**: §15.9 makes that region the user's edit and not the priority. Nodes the user
placed in the editor (`*.added.*`) are flagged at low severity and only proposed.

Already open in §16 and confirmed here, not re-litigated:

- The Knife is thin.
- The road skeleton needs rebuilding.
- Cleaver (`wall.maces.cleaver`) sits far from dexterity.
- Staves have one cluster (`cathedral.rods.wheel.r5` Quarterstaff, nearest twin: none).

---

## Headline: one-stop shops still exist (§1.1, §13 t2)

The §1 test is whether a build gives something up to get what it wants. The cheapest-path walks show four places
where a build buys most of its specialization without passing anything else.

| Build                    | Walk (`walk.ts`)                                                                               | What it buys                                                                                                                                                                                                                                                                                                                                                                | Severity |
| ------------------------ | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Bow + projectile Strider | `strider 40 Longbow "Sure Shot" "Steady Draw" "Split Volley" "Far Flight" Skewer "Rapid Fire"` | **28 points:** 6 bow/projectile notables and the bow keystone. Every small on the way is bow speed, bow crit, projectile damage or dexterity. No notable of another kind is forced (the only off-theme buy is one flask small).                                                                                                                                             | **high** |
| Dual-wield Reaver        | `reaver 60 "Twin Fangs" "Mirror Guard" "Crossed Blades" "Hot Blood"`                           | **15 points:** every dual-wield notable in the game, plus the fervour charges. The only extra is Buckler, and that is optional.                                                                                                                                                                                                                                             | **high** |
| Two-handed mace Vanguard | The adjacency, not the walk: `close.ts` and the render                                         | The walk (29 points) does force Cleaver and Vampiric Strikes, so it is not a one-stop shop on points. The evidence is the Barbican knot: Cleaver↔Broad Back 1 step, Greatweight↔Ground Shaker 2, and Weight of Iron, Crushing Blow, Cleaver, Greatweight and Steady Hands drawn within about two steps of each other. Every melee weapon decision is made inside one tower. | medium   |

The bleed axe Reaver was checked and is **not** a one-stop shop. `reaver 60 Hewing Executioner "Open Veins" "Wound Dance"`
forces Keen Edge, Elemental Edge and Standard Bearer (three notables of other kinds) on the way: §5.5 is working.

**The bow case is the one §1.1 describes.**

- The Hedgerows' own `why` (`bow/bows.ts` area) reads: "Everything that is only for a bow". That makes it the Bows area
  in all but name.
- The High Moor's `why` (`bow/flight.ts`) reads: "What every projectile build wants … at the point of the region every
  road reaches".
- The projectile line sits along one rim (from `close.ts` and `spec.txt`):
  - `bow.flight.wheel.n2` Split Volley is 3 steps from `bow.quiver.skewer.n` Skewer.
  - Skewer is 2 steps from `bow.quiver.rapid.n` Rapid Fire.
  - Far Flight is 4 steps from Split Volley, on the same wheel.

**Fixes:**

- **Bow and projectiles [user region, so propose it to the user].**
  - Break the Hedgerows/High Moor arc into places with different partners. Each bow or projectile notable should sit
    with a non-projectile partner the build pays for.
  - Move Split Volley (the extra projectile) away from Skewer and Far Flight: at least 5 steps, and toward a different
    road. For example, put it beside Close Quarters or Ricochet on the Knife side, paired with poison or crit, so that
    extra projectile, pierce and chain are three places to choose between.
  - Take Sure Shot off the Longbow wheel (see §5).
  - Rewrite the two area `why`s so they stop describing a bow section.
- **Dual wield:** give it a second home, with a different partner, at least 5 steps from the Lists. Candidates:
  - a dual-wield-and-evasion or dual-wield-and-dodge cluster on the Knife's dagger side (Knife claws and daggers are
    dual-wielded too);
  - or dual wield with bleed or leech in the Pits.
  - Then make the Twin Fangs wheel's second side a non-dual variant (see §8.3 below).
- **Barbican:** pull Crushing Blow (the crit mace) out of the tower. Leave the stun mace (Weight of Iron) there, and
  move the crit mace toward the rampart or crit side, at least 7 steps from Greatweight. That way a two-handed mace
  build picks stun-and-tower or crit-and-elsewhere.

---

## §4 Regions and areas

### §4.2 Area names: no violation (all 37 pass)

- **The labels:** The ring, The inner ring, Gate, Rampart, Battlements, Barbican, Quarry, Barrows, Yard Gate, Practice
  Ground, Lists, Muster, Pits, Bow Gate, Meadow, Hedgerows, High Moor, Thicket, Ford, Spire gate, Cloister, Scriptorium,
  Column, Lantern, Belfry, Gallery, Knife Gate, Alleys, Rookery, Docks, Stair, Cathedral Gate, Nave, Vestry, Bell Tower,
  Choir, Undercroft. None names a build, weapon, element, mechanic or stat. They are place names.
- **Low.** The letter of the rule is met but the spirit leaks through cluster names and `why` text. Examples:
  - "The bows road" (`bow.bows.road`)
  - "The bows hub"
  - "The projectiles hub" (`bow.flight.hub`)
  - "The bleed road" and "The bleed hub" (`bow.quiver`)
  - "The physical road" and "The physical corner" (`bow.steel`)
  - "curse junction" and "curse barb" (`knife.hex.jH`, which holds no curse notable)

  The editor and listings show these. **Fix:** rename road and hub clusters by place ("the north road", "the corner"),
  as the other regions do.

- **Out of my scope, noted for the §11 agent.** On the fresh `all.png`:
  - "The Battlements" label is drawn on top of "The Vestry", in the Cathedral.
  - "The Lists" label sits about 400 units east of its clusters.
  - "The Muster" label sits on the Yard Gate.

### §4.5 Varied defences per region

Counts are lines per region from `usage.ts`.

| Region     | Life                     | Resists    | Class defence                | Block               | Dodge     | Stun              | Recovery                       | Max res                |
| ---------- | ------------------------ | ---------- | ---------------------------- | ------------------- | --------- | ----------------- | ------------------------------ | ---------------------- |
| Wall       | 11                       | yes        | armour 11                    | Bracing             | –         | yes               | regen, leech, flasks           | Tempered               |
| Yard       | 12                       | yes        | armour 3, **evasion 1**      | yes (lots)          | Sidestep  | Guarded           | regen, leech, flasks           | Four Winds             |
| Bow [user] | 9                        | yes        | evasion 14                   | 2 smalls            | **none**  | Hard Target (10%) | regen, leech, flasks           | **none**               |
| Spire      | **3** (Quiet Pulse only) | Prism Ward | ES 15                        | Spirit Ward (spell) | Mist Walk | **none**          | ES recharge and leech, regen 1 | **none**               |
| Knife      | **2** (Thick Blood only) | Snakeskin  | ES 10, evasion 8             | **none**            | yes       | **none**          | Talon on hit, Spoils flask     | **none**               |
| Cathedral  | 6                        | Litany     | ES 8, **armour 1 + flat 60** | yes                 | –         | **none**          | regen, flasks; **no leech**    | Hearthfire (fire only) |

Findings:

- **Medium.** The Reaver's evasion half is one line, on `yard.dual.sidestep.n`.
  - The Reaver is a strength-and-dexterity class, but its region sells evasion only on Sidestep.
  - **Fix:** put an evasion-and-armour notable in the Yard (for example the Lists' Iron Draw side, or a new pocket by
    the east gate `yard.dual.j2`).
  - Better still, re-line Guarded (`yard.blades.guarded.n`) to armour and evasion. It is already on the border with the
    Wall's armour, so armour alone repeats Thick Skin 4 steps away; see §5.
- **Medium.** The Zealot's armour half is thin.
  - Its armour is the start side `cathedral.home.sig.a`, Zeal's global defences, and Iron Faith's flat 60.
  - No Cathedral notable sells percent armour or armour with energy shield.
  - **Fix:** give Vigil (`cathedral.nave.vigil.n`) or the block road a global-defences or armour line, so the
    two-pool class has an armour place that is not block.
- **Medium.** The Knife has no block, stun, regeneration, maximum resistance or leech notable.
  - This is beyond the known "thin" item. The specific missing defences are recovery (no regen or leech notable; the
    Shade Leech smalls only lead to a keystone) and any stun answer.
  - **Fix:** when the Knife grows, include one recovery notable and one stun-avoidance line. For example: evasion with
    `stunAvoid`, or leech with `esLeech` for the dagger Shade.
- **Low to medium.** The Spire sells life only at `spire.well.quietPulse` (13 steps from the nearest other life
  notable), and sells no stun line.
  - A life-based Mystic (not CI or ES) has one place to go.
  - **Fix:** add life with energy shield, or life with mana, on the craft side so life has two homes in the region.
- **Low [user region].** The Bow has no dodge and no maximum resistance.
  - Dodge exists only across the Yard border (Sidestep, 2 to 3 steps past `yard.dual.j2`).
  - **Fix:** fine as a near crossing, but say so in the Ford's `why`. Optionally re-line one Weathered spoke
    (`bow.steel.added.n416`) to include max resistance.

### §4.6 What most builds want, in each region's voice

Gaps are zero lines in the region, from `usage.ts`.

| Region     | Missing                                                                                                                |
| ---------- | ---------------------------------------------------------------------------------------------------------------------- |
| Wall       | spell damage and cast speed (only totem cast speed); cost reduction                                                    |
| Yard       | cost reduction                                                                                                         |
| Bow [user] | **reduced reservation and aura effect (none at all)**; cost reduction                                                  |
| Spire      | attack speed outside wands (acceptable)                                                                                |
| Knife      | **spell damage, cast speed (only trap and mine speed), skill duration**, cost reduction; reservation only 4% on Shroud |
| Cathedral  | **movement speed, leech, attack speed (only totem)**, generic crit (only sceptre crit), cost reduction                 |

Findings:

- **Medium (§13 t6).** The Knife sells nothing for a spell, yet the Shade is half intelligence and borders the Spire.
  - The Yard and the Bow were each given a spell chain for this exact reason: Spellsword, and Hedge Magic with its
    "a Strider picks a spell as often as anyone" note. The Knife and the Wall were not.
  - **Fix:** in the Knife, add a spell chain in its own voice. For example spell damage with crit chance, or cast speed
    with chaos damage, on the Stair toward the Spire.
  - In the Wall, add a small spell or cast-speed chain near the Battlements (the Cathedral side), partnered with armour
    or life.
- **Medium.** The Bow has no reservation.
  - Every other region has at least one reservation notable: Banner, Standard Bearer, Devotion, Shroud, Choirmaster
    and Benediction.
  - **Fix:** put reservation with evasion or with attack speed somewhere on the Bow's Knife side.
- **Medium.** The Cathedral has no movement speed and no leech.
  - **Fix:** re-line Alms (`cathedral.home.alms.n`) from regeneration to movement, or give the Choir junction a pace
    pocket. Put leech (or `lifeOnHit` with attacks) on the sceptre or staff wheel for the melee Zealot.
- **Low to medium.** Cost reduction exists only at `spire.craft.frugal`; five regions sell none.
  - **Fix:** put a `costReduction` line on one notable per region, in its voice. Candidates:
    - Iron Lungs (Wall)
    - Fighting Breath (Yard)
    - Clear Head (Bow)
    - Spoils (Knife)
    - Hymn (Cathedral)

---

## §5 Specializations and trade-offs

### §5.1 and §5.2: destinations, partners and twin distance

Steps are notable to notable (`spec.txt`).

| Specialization                | Notables (where)                                                                                                                                                                                          | Partners                                                                                        | Nearest twin                                                                    | Verdict                                                                                         |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Bow                           | Iron Draw (Yard), Longbow + Sure Shot (Bow, same fork), Rapid Fire (Bow), Quiet Shot (Knife)                                                                                                              | phys+life / speed / crit / projectile+move / crit multi                                         | 6 (Longbow–Sure Shot), others 12–17                                             | Spread is good; **Longbow/Sure Shot is the §8.3 fake-choice example** (below)                   |
| Projectile                    | Far Flight + Split Volley (same fork), Skewer, Rapid Fire, Ricochet, Darting Bolts (spell), Quiet Shot                                                                                                    | –                                                                                               | **2–4** (Rapid Fire–Skewer 2, Split Volley–Skewer 3, Far Flight–Split Volley 4) | **high**: all in one rim                                                                        |
| Wand                          | Wandwork (spell), Wand Volley (attack)                                                                                                                                                                    | 12 apart                                                                                        |                                                                                 | Each sub-specialization (wand spell, wand attack) has **one** home. medium                      |
| Staff                         | Quarterstaff only                                                                                                                                                                                         |                                                                                                 |                                                                                 | known (§16)                                                                                     |
| Dagger                        | Fine Point (crit), Barbed Point (poison)                                                                                                                                                                  | different                                                                                       | 5                                                                               | ok, at the floor                                                                                |
| Claw                          | Talon (on hit), Carrion Claws (chaos)                                                                                                                                                                     | different                                                                                       | 6                                                                               | ok                                                                                              |
| Mace                          | Weight of Iron (stun), Crushing Blow (crit); sceptre lines also on Weight of Iron                                                                                                                         | different                                                                                       | 7, both in one area                                                             | see headline                                                                                    |
| Sceptre                       | Gilded Rod, Weight of Iron                                                                                                                                                                                |                                                                                                 | 17                                                                              | ok                                                                                              |
| Axe                           | Cleaver, Hewing (bleed), Fencer's Eye (crit, shared with swords), Hatchet Work [user added]                                                                                                               | different                                                                                       | 6                                                                               | ok; Cleaver known                                                                               |
| **Sword**                     | Keen Edge (damage); Fencer's Eye (crit only)                                                                                                                                                              |                                                                                                 | 9                                                                               | **one sword-damage home.** medium-low                                                           |
| Two-hander                    | Greatweight (stun), Thunderstep (slam), Heavy Hands (speed)                                                                                                                                               | different                                                                                       | 8–9                                                                             | partners good; **all in the strength-only Wall** (§5.4)                                         |
| One-handed                    | Light Blades, Light Hand [user]                                                                                                                                                                           |                                                                                                 | 19                                                                              | ok                                                                                              |
| Dual wield                    | Twin Fangs + Mirror Guard (one wheel), Crossed Blades                                                                                                                                                     |                                                                                                 | **3** (wheel), 6                                                                | **high**: one area                                                                              |
| Shield block                  | Bracing, Buckler, Steel Rim, Iron Faith                                                                                                                                                                   | **all block + shield defences or block recovery**                                               | 9–11                                                                            | **same pairing four times.** medium                                                             |
| Spell block                   | Shield Catch, Spirit Ward, Glass Wall                                                                                                                                                                     | Spirit Ward ≈ Glass Wall (spell block + shield defences + a little mana or ES)                  | 13                                                                              | low                                                                                             |
| Minion                        | Familiars, Shepherd, Congregation                                                                                                                                                                         | **Familiars = Congregation exactly** (minion damage 24, life 12, speed 5)                       | **5, 5, 5**                                                                     | **high**                                                                                        |
| Curse                         | Hexwright, Second Curse                                                                                                                                                                                   | different                                                                                       | 6                                                                               | ok, but see the hex wheel                                                                       |
| Trap                          | Tripwire, Trapper                                                                                                                                                                                         | cooldown recovery vs trap area                                                                  | 8                                                                               | ok                                                                                              |
| **Mine**                      | **Sapper only**                                                                                                                                                                                           |                                                                                                 | –                                                                               | **one home, and on a poison wheel.** high                                                       |
| Totem                         | Standing Cairns (Wall), Sentry Post (Bow), Reliquary (Cathedral)                                                                                                                                          | **all three: totem damage + totem speed (+ duration); Sentry Post and Reliquary are identical** | 19–30                                                                           | spread good; **partners copied.** medium-high                                                   |
| **Brand**                     | **Runecarver only**                                                                                                                                                                                       |                                                                                                 | –                                                                               | one home. medium                                                                                |
| Poison                        | Venom Fletching, Barbed Point, Carrion Claws, Festering                                                                                                                                                   | chaos bow / dagger / claw / pure                                                                | 6–10                                                                            | ok                                                                                              |
| Bleed                         | Hewing, Executioner, Open Veins, Barbed Arrows, Deep Cuts, Hatchet Work                                                                                                                                   |                                                                                                 | 5–11                                                                            | ok; the walk forces other notables between them. Low: Open Veins is the only pure-bleed notable |
| Fire                          | Cinder (burn), Flashpoint (crit spell), Hearthfire (spell + max res), Kindled Steel (attack ignite)                                                                                                       | all different                                                                                   | 9–10                                                                            | **good**: the model to copy                                                                     |
| Cold                          | Hoarfrost, Shatter, Lingering, Harsh Weather                                                                                                                                                              | different                                                                                       | **4, 4, 4, 4**                                                                  | **under 5 everywhere; all in the Spire.** medium                                                |
| Lightning                     | Thunderhead, Overcharge (+ Harsh Weather, + Sapper's damage against shocked)                                                                                                                              |                                                                                                 | **Overcharge–Harsh Weather 1** (notable to notable)                             | **high** (neighbours compete); **all in the Spire**                                             |
| Elemental attack              | Elemental Edge (Yard), Elemental Fletching (Bow), Kindled Steel (fire only)                                                                                                                               | accuracy / penetration / ignite                                                                 | 23–31                                                                           | ok; **no cold or lightning attack cluster anywhere**                                            |
| Aura and reservation          | Banner, Standard Bearer, Devotion, Choirmaster, Benediction, Shroud, Shepherd                                                                                                                             | **Banner ≈ Standard Bearer ≈ Devotion ≈ Choirmaster** (reservation + aura effect)               | 10–21                                                                           | spread good; **four copies of one pairing.** medium                                             |
| Charges                       | Grit: Unbroken, Scar Tissue. Fervour: Hot Blood only. Insight: Flashes of Insight only                                                                                                                    |                                                                                                 |                                                                                 | fervour and insight **one home each.** low-medium                                               |
| Warcry                        | War Drums only                                                                                                                                                                                            |                                                                                                 |                                                                                 | low-medium                                                                                      |
| Spell dodge                   | Mist Walk (notable), Spellslip (keystone spur)                                                                                                                                                            |                                                                                                 | 19                                                                              | ok                                                                                              |
| Energy shield                 | 15 notables; Glass Skin and Quickening are 3 apart, both ES + recharge                                                                                                                                    |                                                                                                 | 3                                                                               | low-medium                                                                                      |
| Armour                        | Stone Heart and Mortar and Stone (one wheel, **both armour**); Thick Skin ≈ Guarded (armour + stun, 4 apart across the border)                                                                            |                                                                                                 | 2 and 4                                                                         | medium                                                                                          |
| Flasks, movement, mana on hit | Draught = Quick Sip exactly; Unhurried = Quick March exactly; Quartermaster ≈ Provisions ≈ Field Dressing (within 5–6); Iron Lungs ≈ Fighting Breath ≈ Thirsting Blade; Vampiric Strikes ≈ Thirsty Quiver |                                                                                                 |                                                                                 | generics, so spreading is right (§5.3), but **none speaks in its region's voice.** low          |
| Crit (generic)                | Vital Aim = Killing Eye exactly [user added], 10 apart                                                                                                                                                    |                                                                                                 |                                                                                 | low                                                                                             |
| Evasion [user region]         | Hard Target ↔ Fleet Foot **1 step**; True Aim ≈ Quick Hands (accuracy + attack speed + dexterity) **2 steps**                                                                                             |                                                                                                 |                                                                                 | medium-low                                                                                      |

#### §5 findings, with fixes

1. **High: Minions are three copies, 5 steps apart.**
   - Nodes:
     - `spire.fire.familiars.n` Familiars (`spire/fire.ts`)
     - `cathedral.crypt.wheel.m3` Congregation (`cathedral/crypt.ts`)
     - `cathedral.choir.wheel.c5` Shepherd (`cathedral/choir.ts`)
   - Familiars and Congregation carry the same three lines at the same values.
   - The walk `zealot 60 Shepherd Congregation "Volatile Servants" Familiars` costs 22 points for all three notables and
     the minion keystone.
   - **Fix:** keep three homes, but give each a non-minion partner the build pays for. For example:
     - Familiars: minions with spell damage or mana (the caster-summoner).
     - Congregation: minions with fire (Volatile Servants' burst is fire) or with the Zealot's armour.
     - Shepherd: minions with reservation (as now).
   - Push one of them at least 7 steps from the other two. For example, move Familiars off the dear crossing's landing
     and further up the Lantern arm.
2. **High: Mines have one home, and it shares a wheel with poison.**
   - Node: `knife.hex.wheel.n2` Sapper (`knife/hex.ts`). Details under §10 below.
   - **Fix:** split the wheel. Make it poison or traps (two variants of one theme), or mines or traps (§8.3's own
     example). Give mines a second cluster at least 5 steps away with a different partner, for example mines with
     lightning near `knife.hex.toSpire` toward the lightning arm.
3. **High: Lightning.**
   - `spire.frost.harshWeather.n` Harsh Weather links notable-to-notable onto `spire.storm.overcharge.n` Overcharge
     (`spire/frost.ts` links).
   - A shock caster wants both (shock duration and ailment effect, plus shock effect and penetration). They are one
     step apart: neighbours that should compete (§5.5) do not.
   - Lightning and cold have no notable outside the Spire. A lightning Strider, Shade or Reaver has only generic
     elemental attack.
   - **Fix:** end Harsh Weather on Overcharge's entrance small through a node of another kind, or move it so it
     bridges Shatter to a non-elemental cluster.
   - Add one lightning cluster with a different partner in the Knife. For example lightning with crit, or lightning
     with traps, on the Stair or the Docks: the Stair's dear road already exists for "the lightning Shade and the
     lightning trapper", but sells no lightning.
4. **Medium: Cold is four Spire notables, each 4 steps from the next.**
   - Nodes:
     - `spire.fire.hoarfrost.n`
     - `spire.frost.shatter.n`
     - `spire.column.lingering.n`
     - `spire.frost.harshWeather.n`
   - Lingering's `coldDot` is 4 from Hoarfrost, and Shatter is 4 from Harsh Weather. Partners differ (ES, freeze and
     penetration, duration, ailments), but the twin floor of about 5 is missed everywhere.
   - **Fix:** move Lingering's cold DoT multiplier elsewhere (it is the odd one; see §10). Give cold one
     attack-or-evasion home outside the Spire, for example cold attack with evasion on the Bow's Knife side.
     Elemental Fletching's neighbourhood already serves elemental bows.
5. **Medium-high: Totems.**
   - Nodes:
     - `wall.slams.cairns.n`
     - `bow.steel.sentryPost.n`
     - `cathedral.crypt.shrine.n` Reliquary
   - All three are totem damage + totem speed (+ totem duration). Sentry Post and Reliquary are identical.
   - **Fix:** keep the three regions but re-partner them:
     - Cairns: totems with melee area or `areaDamage` (slam totems).
     - Sentry Post: totems with `bowDamage` or `projectileDamage` (the bow totem it claims to be).
     - Reliquary: totems with `spellDamage` or `eleDamageAll` (spell totems), dropping speed.
6. **Medium: Auras.**
   - Nodes:
     - `wall.resists.banner.n`
     - `yard.shield.standard.n`
     - `spire.craft.devotion.n`
     - `cathedral.choir.wheel.c3`
   - All four are reduced reservation + aura effect (Banner adds flat mana, Choirmaster adds mana).
   - **Fix:** give each its region's voice:
     - Banner: reservation with armour, or with `warcryEffect`.
     - Standard Bearer: reservation with attack speed.
     - Devotion: reservation with ES or `manaRegen`.
     - Choirmaster: pure aura.
7. **Medium: Four shield-block notables carry one pairing.**
   - Nodes:
     - `wall.rampart.bracing.n` (block, block recovery, shield defences)
     - `cathedral.nave.wheel.n3` Iron Faith (block, block recovery, flat armour)
     - `yard.shield.steelRim.n1` (block, shield defences)
     - `yard.home.block.n` Buckler (block, shield defences, life)
   - **Fix:** Bracing becomes block with stun threshold or with armour (the Wall's voice). Buckler becomes block with
     attack speed, or with evasion (the Yard's dex half). Steel Rim keeps shield defences.
8. **Medium: Two-handers live only in the strength-only Wall** (§5.4; not in §16).
   - The table assigns two-handed axes and two-handed swords (strength and dexterity) to the Yard, yet the Yard has
     zero `twoHandDamage` lines (`usage.ts`).
   - Thunderstep is on the Yard border (`yard.blades.guarded.b ↔ wall.slams.thunderstep.b`). Greatweight is in the
     far west tower and Heavy Hands on the south rim, so both have the same problem as Cleaver.
   - **Fix:** move Heavy Hands (two-handed speed, a dexterity-flavoured line) into the Yard: the Pits, or the Practice
     Ground beside Hewing. Or add a two-handed sword-or-axe cluster in the Yard with a different partner, for example
     two-hander with crit, or two-hander with bleed.
9. **Medium-low: Swords have one damage home.**
   - Node: `yard.blades.keenEdge.n`.
   - Half of one-handed swords ask dexterity only (Bow, Yard), but the Bow has no sword line.
   - **Fix:** a sword cluster on the Bow/Yard border near `yard.dual.j2` / `bow.steel.hub.t`, partnered with evasion
     or attack speed (the dexterity sword).
10. **Medium: Each wand specialization has a single home.**
    - `spire.well.wandwork.n` (wand spell) and `spire.craft.wandVolley.n` (wand attack) are 12 apart, but each is the
      only one of its kind.
    - **Fix:** add a second wand-attack home with a different partner, for example wand with elemental attack, or wand
      with projectile speed, in the Lantern or the Cloister.
11. **Medium: Brands, fervour, insight and warcries each have one home.**
    - Nodes:
      - `cathedral.crypt.shrine.s` Runecarver
      - `yard.dual.hotBlood.n`
      - `spire.craft.insight.n`
      - `wall.grit.drums.n`
    - §5.1 asks two or three. These are class mechanics, so §13 t2 lets them stay in the class region, but not as one
      destination.
    - **Fix:** add one more cluster each, in the same region at least 5 to 7 steps away, with a different partner. For
      example:
      - fervour with movement in the Pits;
      - insight with spell damage in the Gallery;
      - warcry with stun in the Rampart.
12. **Medium: Armour.**
    - Mortar and Stone and Stone Heart share one wheel (`wall.rampart.bulwark`) and both carry armour (30 and 24), so an
      armour build takes both.
    - Thick Skin (`wall.slams.thickSkin.n`) and Guarded (`yard.blades.guarded.n`) are both armour with stun, 4 steps
      apart across the border.
    - **Fix:** make Stone Heart life with regeneration or stun recovery (no armour). Re-line Guarded to armour with
      evasion (also fixes the Yard's evasion gap in §4.5).
13. **Low: Identical generic copies.**
    - `spire.well.draught.n` = `bow.quiver.quickSip.n`
    - `wall.slams.unhurried.n` = `centre.inner.quickMarch.n`
    - `bow.home.crit.n` Vital Aim = `bow.quiver.added.n440` Killing Eye [user added]
    - **Fix:** one line in each copy changed to the region's voice. For example, Draught takes a mana line (caster
      flasks), and Unhurried takes stun threshold.
14. **Medium-low [user region].** Neighbour twins:
    - `bow.string.aim.n` True Aim and `bow.string.speed.qh` Quick Hands are 2 apart with the same pairing (accuracy,
      attack speed, +20 dexterity).
    - `bow.string.hardTarget.n` and `bow.string.speed.ff` are 1 apart, both evasion.
    - **Fix (propose to the user):** re-line Quick Hands to attack speed with movement or crit, so the loop's two
      notables and True Aim are three different things.

### §5.4 Weapon clusters against attributes

| Weapon                           | Clusters                                                                                                                                                                                                 | Region supplies                           | Verdict                                                                                                                                                            |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Mace, two-handed mace            | Weight of Iron, Crushing Blow (Wall)                                                                                                                                                                     | strength                                  | ok                                                                                                                                                                 |
| Sceptre                          | Gilded Rod (Cathedral); sceptre lines on Weight of Iron (Wall)                                                                                                                                           | strength and intelligence / strength only | ok. Weight of Iron is in the west tower, far from the Cathedral crossing (`wall.resists.j`), so a sceptre Zealot reaches it only by a long walk. Low; leave as is. |
| Bow                              | Bow ×3; Iron Draw (Yard: dexterity ✓); Quiet Shot (Knife: dexterity ✓)                                                                                                                                   |                                           | ok                                                                                                                                                                 |
| Wand                             | Spire ×2                                                                                                                                                                                                 | intelligence                              | ok                                                                                                                                                                 |
| Axe (one- and two-handed)        | Hewing, Fencer's Eye (Yard ✓); Cleaver (Wall: strength only, far side, **known**); Hatchet Work (Bow: dexterity only, 2 steps from the Yard's east gate, **acceptable by §5.4's last paragraph**) [user] |                                           | ok except the known item                                                                                                                                           |
| Two-handed axe, two-handed sword | **only Wall clusters**                                                                                                                                                                                   | strength only                             | **medium-high: see §5 finding 8**                                                                                                                                  |
| Sword                            | Keen Edge, Fencer's Eye (Yard ✓)                                                                                                                                                                         |                                           | ok; no dexterity-only sword home (finding 9)                                                                                                                       |
| Dagger, claw                     | Knife ×4 ✓                                                                                                                                                                                               |                                           | ok                                                                                                                                                                 |
| Staff                            | Quarterstaff (Cathedral ✓)                                                                                                                                                                               |                                           | known single                                                                                                                                                       |
| Shields                          | armour shields: Wall, Yard, Cathedral; ES shields: Spire, Cathedral; evasion shields: Bow (Round Shield)                                                                                                 |                                           | ok. **No shield cluster in the Knife** (evasion and ES shields both match it). Low.                                                                                |

---

## §10.2 One theme within a cluster, and §8.3 wheel sides

Wheels with two notables, judged by the test of whether one build would take both notables and whether the shared smalls
belong to only one side.

1. **High: `knife.hex.wheel` Festering / Sapper** (`knife/hex.ts`).
   - The wheel is a ring of four: `s` (poison chance) – `n1` Festering – `n` (mine damage) – `n2` Sapper – `s`.
   - Every way through pays both shared smalls:
     - The only entry from the barb road is `s`, a poison small.
     - Every onward exit goes through `n`, a mine small: the Spire's Hexwright crossing (`spire.craft.hexwright.n ↔
wheel.n`) lands there, and the climb to Spellslip leaves from it.
   - So a mine player buys a poison small; a poison player going on to Spellslip buys a mine small.
   - A curse caster crossing from the Spire to Second Curse must buy the mine small, one of the two notables (poison or
     mines) and the poison small. Second Curse is reached only by `n → n1|n2 → s → road → jH`.
   - The "curse barb" holds no curse notable.
   - Poison and mines are unrelated (§10.2), and the shared smalls are side-themed, so neither of §8.3's conditions holds.
   - **Fix:**
     - Make `s` and `n` neutral: ES or life (the barb road is ES), or Dex/Int attribute junctions.
     - Better, make the wheel two variants of one theme: mines or traps, with traps moved here from the Docks; or
       poison on both sides, as chance and damage.
     - Put the curse content the area's name promises on the barb, for example by moving Second Curse to `jH`'s side.
2. **Medium: `knife.snares.wheel` Trapper / Carrion Claws** (`knife/snares.ts`).
   - The ends `t1` and `t4` are cooldown recovery. That belongs to the trap side: traps have cooldowns, claws do not.
   - A claw player passing from `jT` to Quiet Shot or the point pays two trap smalls.
   - The two sides (traps, chaos claw) are unrelated, which is allowed only because the route takes one side. It does,
     but the shared ends break it.
   - **Fix:** make the ends crit chance or attack speed (both sides use them), or Dex/Int attributes.
3. **Medium: `knife.venom.wheel` Barbed Point / Shroud.**
   - The ends `v1` and `v4` are crit chance, which belongs to the offence side.
   - The shield side (Shroud: ES, evasion, reservation) is the Hollow Vessel and ES Shade's side, and it pays 2 crit
     smalls to reach the point.
   - **Fix:** make the ends evasion or attributes, or swap Shroud for a dagger variant so the wheel is "poison dagger or
     crit dagger".
4. **Medium: `wall.grit.unbroken` Unbroken / Tempered** (`wall/grit.ts`).
   - The entry `a` and the exit `b` are both grit-duration smalls. Tempered (+1% maximum resistance, which most builds
     want) can be reached only through a grit small: the max-res player pays 1 to 2 grit smalls.
   - Grit and maximum resistance are unrelated.
   - **Fix:** make the entry and exit life or resistance smalls, or give Tempered its own pocket off `wall.grit.j1`.
5. **Medium-high: `yard.dual.twinFangs` Twin Fangs / Mirror Guard** (`yard/dual.ts`).
   - Both notables are dual wield, and Mirror Guard carries `dualDamage(10)`, so a dual build takes both: §8.3's fake
     choice.
   - The sides are not sections either. Each notable sits between a damage small and a block small (`sides.ts`): Twin
     Fangs takes b = damage and c = block; Mirror Guard takes a = damage and d = block.
   - Both exits (`c` to the gate, `d` to the junction) are block smalls.
   - **Fix:** make the wheel a real fork: dual wield or shield, the §8.3 example (Buckler already sits 2 steps away).
     Or keep dual damage only on one side, and move dual block to a different place (Crossed Blades' pocket).
6. **Medium: `yard.shield.steelRim` Steel Rim / Shield Catch.**
   - Both are shield notables (attack block vs spell block plus life on block). A shield build takes both.
   - The sides are mixed in the same way as Twin Fangs.
   - **Fix:** pair the shield notable with a non-shield variant on the other side (for example one-handed damage), and
     move spell block to the Muster's junction.
7. **High: `bow.bows.wheel` Longbow / Sure Shot [user region]** (`bow/bows.ts`).
   - These are §8.3's exact rejected example ("Two bow notables on opposite sides of one circle"), restated in §14.
   - The fork from `e` shares an entry small that carries both sides' lines (bow speed 10 + crit 10, 3.8 units).
   - The `why` still says "a closed ring of eight"; the ring is open (n1 and n2 are not joined).
   - **Fix (propose to the user):** keep Longbow; move bow crit to the Knife side (Quiet Shot already sells bow crit
     multiplier, so make one of them bow crit with dodge or poison). Replace Sure Shot on the fork with a non-bow
     variant, for example a trap or one-handed side.
8. **Medium-high: `bow.flight.wheel` Far Flight / Split Volley [user region].**
   - Every projectile build takes both: 3 points for one, 5 for both.
   - **Fix:** as in the headline; move Split Volley away.
9. **Low: `bow.quiver.wheel` [user region].** It is no longer a wheel.
   - Barbed Arrows (`n1`, with `a1` and `a2`) is detached and placed 11 steps from Deep Cuts.
   - The `why` ("closed ring of eight … the far node joins them") is stale.
   - `bow.steel.wheel`'s `why` names "Iron Tips", which no longer exists.
   - **Fix:** rewrite both `why`s. (The detachment is an improvement under §5.2.)
10. **Medium-low: `wall.rampart.bulwark` Stone Heart / Mortar and Stone.** Both carry armour; see §5 finding 12.
11. **Low to medium: `spire.well.deepWell` Deep Well / Glass Skin and `spire.craft.focus` Arcane Focus / Warded Mind.**
    - The sides are mixed (each notable flanked by one small of each side).
    - Warded Mind also carries `spellDamage(10)`, so a spell build takes both Focus notables.
    - **Fix:** order the rings so that each side's two smalls match its notable, and drop spell damage from Warded Mind.
12. **Low-medium: `cathedral.crypt.shrine` Reliquary / Runecarver.**
    - The entry is a totem small (`w`), and the far node toward Sigil Warden is a brand small (`e`).
    - A brand build buys a totem small to reach the keystone that penalises totems.
    - **Fix:** make the entry a Str/Int junction or an ES small.
13. **Low: the Cathedral's six-wheels pair unrelated sides.**
    - The pairs: block or fire spell (`cathedral.nave.wheel`), fire attack or aura (`cathedral.pyre.wheel`), aura or
      minion (`cathedral.choir.wheel`), minion or spell block (`cathedral.crypt.wheel`).
    - Each passes §8.3 (the route from entrance to exit takes one side). But taking the other side costs only 2 points,
      and Shepherd (minion side) carries reduced reservation, which aura builds want. So the aura-summoner, a very common
      Zealot, barely chooses.
    - The `eleAttack` ends of `cathedral.rods.wheel` tax a spell-sceptre player.
    - **Fix:** drop reservation from Shepherd (give it `minionSpeed`). Make the rods ends `eleDamageAll`.
14. **§10.2 notables or sections pairing unrelated things:**
    - **Medium [user added]:** `bow.flight.added.n432` Round Shield is mana regeneration + area of effect + shield
      defences: three unrelated lines. Its approach mixes a mana-regeneration chain (`n429`, `n433`) with shield-block
      smalls (`bow.home.added.n437`/`n438`). `bow.flight.added.n428` Wanderer is flanked by mana-regeneration smalls
      (`n430`, `n433`). **Propose:** Round Shield becomes block with evasion and shield defences (the evasion shield),
      and the mana-regeneration smalls feed Clear Head instead.
    - **Low-medium:** `spire.column.lingering.n` pairs generic skill duration with the cold DoT multiplier, so a
      duration caster (curses, auras, brands) buys a cold line. Make it duration with `dotDamage`, and move `coldDot`
      onto Hoarfrost or Shatter's neighbour.
    - **Low:** the unrelated pairings below each need one line changed or the section made uniform.
      - `knife.venom.wheel.v5` Shroud: defence + reservation.
      - `knife.home.spoils.n`: mana + flask recovery.
      - `centre.inner.provisions.n`: flasks + mana regeneration.
      - `wall.rampart.unerring`: the keystone spur's smalls are accuracy then melee damage, a mixed section.
      - `knife.hex.climb.a`: curse area on the mine-to-Spellslip climb; a Spellslip player buys a curse small.

---

## §13 tensions

### t2: Identity against spread

The specializations that give a class identity have, in several cases, become one destination:

- dual wield (Lists)
- mines (Sapper)
- brands (Runecarver)
- fervour (Hot Blood)
- insight (Flashes)
- warcry (War Drums)
- wand attack (Wand Volley)
- staff (known)

Cold and lightning are wholly in the Spire. Fire shows the right pattern: two homes in the Spire and two in the
Cathedral, all with different partners. Bows are spread across four regions (good), but the Strider's own bow and
projectile content is one arc (headline).

### t6: Region identity against many builds

The exclusions in §4.6 are absences, not proportions:

- Knife and Wall: no spells.
- Cathedral: no movement or leech.
- Bow: no reservation.
- Five regions: no cost reduction.

The Yard and the Bow show that adding a spell chain in a region's voice works (Spellsword at the rim, Hedge Magic on the
Knife border). The same treatment is owed to the Knife and the Wall.

---

## Things checked and found sound

- **Fire:** 4 homes, 4 partners, 9 to 10 apart.
- **Poison:** 4 homes, 6 to 10 apart, different partners.
- **Claws and daggers:** the edge wheel is "dagger or claw", which §8.3 blesses.
- **Traps:** two homes 8 apart.
- **The nave and choir wheels** pass §8.3's route rule.
- **Weapons and attributes:** every weapon cluster sits in a region supplying at least one of its attributes.
- **Area labels:** none name a build, weapon, element, mechanic or stat.
- **Spire builds the user named as missing (§5.7):** Familiars (minions), Spirit Ward (spirit shield) and Wand Volley
  (wand attacks) are present, but each is a single cluster (see above).
