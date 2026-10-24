# G4 audit round 1: node discipline

Written 2026-10-22 on the network as committed at 3b2affe (1,389 live nodes: 742 smalls, 274 notables, 27 keystones,
340 attribute nodes; `passives:audit` problems 0; `edits.json` empty). Read-only: nothing in `src/`, `scripts/` or the
plan documents changed.

**Subset:** CONSTRAINTS §8 (clusters, notables and smalls), §10 (vocabulary, one theme per cluster, live lines), §2.4
(names), and whether each node's and link's `why` still says what it is. The rest of CONSTRAINTS was read in full; each
fix below names the items it must not break.

**How it was measured.** A scratch dump of the built network (every node with its lines, units, links and reasons),
then scripts for runs of linked smalls, per-cluster small modifiers, smalls off one unit, notables in units with and
without their attribute lines, identical line sets, line usage by region and kind, every distinct mod (stat, tags,
condition), unit sums quoted in reasons against the lines, and a name check against the reference tree's notable and
keystone names (exact and whole-word). The engine check for §10.3 traced how a mod matches (`src/mods/modDb.ts`), how a
skill use gets its tags (`src/calc/skill.ts:396` adds the held weapon's tags), and which conditions the sheet and the
fight set. Pictures are in this folder: `strider-home-added.png` (the Strider's editor nodes, with their lines),
`mystic-focus.png` (Arcane Focus and Warded Mind), `home-roads-shade.png` (the Shade's blade road).

---

## 1. Findings, most important first

### F1. Six notable names are reference notable names, letter for letter (must fix)

- **Where:** Thick Skin (`wall.maces.thickSkin`, Vanguard), Executioner (`yard.blades.executioner.n`, Reaver), Heavy Draw
  (`bow.steel.wheel.n2`, Strider; the cluster is named "Iron Tips and Heavy Draw"), Arcane Focus
  (`spire.craft.focus.n1`, Mystic), Devotion (`spire.craft.devotion`, Mystic), Overcharge (`spire.storm.overcharge`,
  Mystic).
- **Breaks:** §2.4 ("never a reference notable, gem or unique name"; check with the ip test and a grep of the
  reference tree).
- **Evidence:** a case-insensitive whole-name comparison of every notable, keystone and cluster name with the reference
  tree's notable and keystone names finds these six. All six have been in the network since the 1,009-node commit
  (6beca98). Every G3 round grepped only its new names, and `src/data/ip.test.ts` compares gems, uniques and the deny
  list, not tree names, so nothing has caught them. Whole-word partial matches (Weathered, Siphon, Sapper, Zeal) are
  plain words inside longer reference names; they are fine.
- **Fix:** rename the six (and the cluster name) to our own plain words, each grepped before use. Candidates, unchecked:
  Thick Skin → Callused; Executioner → Final Cut; Heavy Draw → Full Pull; Arcane Focus → Fixed Mind; Devotion →
  Offering; Overcharge → Surge. Heavy Draw may be a name the user chose in the Strider's hand edit: put that one to the
  user rather than decide it. Every `why` that names them changes with them (Thick Skin is named in
  `wall/home.ts`, `cathedral/ambulatory.ts`; Arcane Focus in `knife/roofs.ts`; Overcharge in `cathedral/ambulatory.ts`
  and `knife/hex.ts`; Heavy Draw in `bow/flight.ts`, `bow/steel.ts`). Labels and saves are unaffected (ids stay).
- **Must not break:** nothing else; names carry no layout.
- **Meta-fix (§15.4):** a test beside `ip.test.ts` that compares every notable, keystone, cluster and area name of
  `src/data/passives` with the reference tree's notable and keystone names, skipped when the local reference is absent,
  as the ip test already is (see §3).

### F2. Hexwright's curse area is a dead line (must fix)

- **Where:** Hexwright (`spire.craft`, Mystic): `curseEffect(12), curseArea(15), skillDuration(10)`.
- **Breaks:** §10.3 (every line read by the sheet and obeyed by the fight).
- **Evidence:** `curseArea` is `aoe` tagged `curse`. The fight casts a curse over the gem's raw radius
  (`src/sim/utility.ts:426`: `enemiesNear(..., u.radius)`), and only a standing curse aura reads a radius multiplier
  (`hexes.ts:84`). The sheet has no curse radius. The line is 1.9 of Hexwright's 4.0 units.
- **Fix:** either the engine applies `aoe` with the `curse` tag to a cast curse's radius (sim and sheet), or Hexwright
  is re-lined: curse area out, a live curse partner in (for example `curseEffect(20)` and `castSpeed(4)`, still about 4
  units). The re-line is the smaller change; `lines.ts` should then drop `curseArea` or say it is dead.
- **Must not break:** §5.1 (Hexwright's partner must stay different from Second Curse's, Grim Oath's, Marked Prey's,
  Ill Wish's, Long Grudge's and Bad Company's: today those are a curse limit, cast speed, damage against cursed,
  chaos damage over time, reservation and minions; area and duration were Hexwright's. Cast speed would copy Grim
  Oath's pairing, so a better partner is mana, or skill duration alone at a higher value once it is verified that skill duration lengthens a cast curse (the fight applies curses through `applyHex`, not checked here)).

### F3. Lines the fight obeys but the sheet never counts (should fix)

- **Where (lines and the nodes that carry them):**
  - Target and life conditions, never set on the player's sheet: `damageOnFullLife` and `critOnFullLife` (Unbloodied and
    its three smalls, Vanguard), `damageVsBleeding` (Executioner and `yard.blades.executioner.a`), `damageVsLowLife`
    (Killing Eye, Mercy Stroke), `damageVsPoisoned` (Carrion Claws), `damageVsShocked` (Sapper), `damageOnLowLife` (the
    two Pain Conduit spur smalls). `attackSpeedOnKill` (Killing Pace and its small) is on only for the bot.
  - No sheet reader at all: `fervourDuration` (Hot Blood's three smalls), `insightDuration` (Flashes of Insight's three
    smalls), `gritDuration` (Unbroken), `lifeOnKill` and `manaOnKill` (Hard Living, Unbloodied, Killing Pace, Waste
    Not, Spoils, Siphon), `knockback` and `cullingStrike` (Ground Shaker, Executioner), `warcryDuration` (War Drums
    and its three smalls; the sheet's warcry uptime ignores duration and is usually capped at 1 already).
  - Partial: `cooldownRecovery` (Quick March in the centre, Tripwire) scales only the 15 gems with a top-level cooldown,
    not warcries, guards, blinks, curses or buffs; `stunDamage` (Stagger) counts for attacks only.
- **Breaks:** §10.3 and §1.4 ("a number the character sheet shows and the fight simulation uses").
- **Evidence:** the sheet's conditions come from the run config, the held weapons, auras and `steadyMask`
  (`src/calc/character.ts:1200-1217, 1418-1435`); the player's sheet passes neither (`Camp.tsx:270`,
  `ItemCard.tsx:41`) and no toggle exists, so A2-vocabulary.md's "on the sheet as a toggle" is stale. The fight
  evaluates all of them (`src/sim/combat.ts:110-162`, `1137-1140`; `sim/charges.ts:83`).
- **What is worst:** 16 smalls whose whole worth the sheet hides (Unbloodied ×3, Executioner ×1, Pain Conduit ×2,
  Killing Pace ×1, Hot Blood ×3, Flashes of Insight ×3, War Drums ×3). A player tapping one sees a line, takes it, and
  the sheet does not move.
- **Fix:** one decision for the user, then a pass. Either (a) the sheet counts these lines under a stated assumption, as
  `steadyMask` already does for the bot (charges held, a kill recently, the target bleeding when the build bleeds), so
  they are "a number the sheet shows"; or (b) the tree keeps them only on notables, beside a line the sheet counts, and
  the 16 smalls are re-lined to the live half of their notable (Unbloodied's to `life` or melee damage, Hot Blood's to
  attack speed, Flashes of Insight's to spell crit, War Drums' to `warcryEffect`, Pain Conduit's spur to life, Killing
  Pace's and Executioner's to attack speed and bleed damage). (a) is an engine change outside the tree; (b) is in the
  tree's hands now. Quick March's cooldown recovery wants a check either way: it is the centre's speed notable beside
  three starts.
- **Must not break:** §10.1 (these lines are much of the tree's rarer vocabulary: conditional damage, charges, culling;
  re-lining all of them would narrow it), §5.1 (Executioner, Killing Eye and Mercy Stroke are partners in their twins'
  pairings). Prefer (a) for the notables and (b) for the smalls.

### F4. Smalls that are not one unit, and smalls with two lines (should fix)

- **Breaks:** §8.1 ("a small node is one stat at the reference's size", confirmed by the user 10-22, `UNIT` follows it).
- **Evidence:** 63 smalls are off one unit by more than a fifth, and three more (8% evasion) by exactly a fifth. It is systematic, by stat, not node by node:

  | stat                    | smalls                                                                                                                                                                                                | value and units |
  | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
  | attack speed            | `knife.home.roadB.a/b/c`, `yard.home.sig.b`, `bow.string.aim.a`, `bow.string.speed.a`                                                                                                                 | 8% = 1.6        |
  | bow attack speed        | `bow.bows.wheel.a1/a2`                                                                                                                                                                                | 8% = 1.6        |
  | two-handed attack speed | `wall.grit.heavyHands.a/b/c`                                                                                                                                                                          | 7% = 1.4        |
  | block with a shield     | `wall.slams.bracing.a/b`, `yard.home.block.a/b`, `yard.shield.steelRim.a/b`, `yard.shield.shieldwall.a–d`, `cathedral.nave.wheel.n2/n7` (12 smalls; the Strider's and the Zealot's newer ones are 2%) | 3% = 1.5        |
  | one-handed melee damage | `bow.home.added.n435`, `bow.flight.added.n434`                                                                                                                                                        | 15% = 1.5       |
  | one resistance          | the 28 resist-star and editor resistance smalls at 10%                                                                                                                                                | 10% = 1.25      |
  | mace and sceptre damage | Hallowed Hammer's three smalls                                                                                                                                                                        | 12% = 0.86      |
  | others                  | `spire.frost.shatter.a/b/c` (5% freeze, 0.63), `bow.string.speed.b` and `bow.steel.added.n408/n409` (8% evasion, 0.8), `spire.well.wandwork.a` (1.25), `yard.blades.executioner.a` (1.25)             | as shown        |

  The 805dca2 re-pricing kept each line's worth, so smalls that were already oversized (5% attack speed when a unit was
  3%) stayed oversized at 8%.

- **Two lines on one small:** `bow.flight.wheel.a` (8% projectile damage and 10% projectile speed, 1.8 units),
  `bow.steel.wheel.c2` (10% physical attack damage and 4% life, 1.8), `bow.quiver.wheel.e` (5% bleed chance and 6% bleed
  damage). And `bow.steel.added.n442` is a small carrying +20 dexterity: an attribute node in a small's clothes, at the
  hubs' size rather than a road's +7.
- **Fix, per stat:** attack speed smalls to `attackSpeed(5)`, bow speed to `bowSpeed(5)`, two-handed speed to
  `attackSpeed(5, ['twoHand'])`, the 15% one-handed smalls to 10%, Hallowed Hammer's smalls to `maceDamage(14)`, the
  three two-line smalls to their notable's first line (`projectileDamage(10)`, `physAttack(10)`, `bleedDamage(12)`),
  `n442` to an attribute node with `dex(7)` or to `resOne('fire', 8)` as the star's fifth spoke. The 12 block smalls to
  `shieldBlock(2)`: the reference tree's shield block smalls are 2% (ten of twelve; the rest 1%), which is `lines.ts`'s
  unit, and the Strider's and the Zealot's newer block smalls already use it. Single resistances are rare as smalls in
  the reference tree, so the star spokes are a judgement: `resOne(t, 8)` to match the unit, or `UNIT.resOne` 10 in
  `lines.ts` with no node changed. Say which in CONSTRAINTS §8.1.
- **Must not break:** §8.6 (if `UNIT.resOne` becomes 10, Warded Mind and Sound Body, the two notables with a single
  resistance, lose 0.4 units each: Warded Mind stays at 3.6, Sound Body falls to 2.6
  and would need its chaos resistance raised; the block notables are unaffected because the unit stays),
  §6.2 (the Shade's blade road, the Reaver's signature side and its block pocket are the first points: smaller smalls
  there make the first points weaker, which is the point), and G-growth §4 ("strength by the back door": shrinking
  oversized smalls only removes strength).
- **Meta-fix:** `passives:audit` lists notables in units but never a small off one unit; add that list (see §3).

### F5. The Strider's editor nodes still sit in six "Added in the editor" bags, with placeholder and stale reasons (should fix)

- **Where:** `bow.home.added`, `bow.string.added`, `bow.bows.added`, `bow.flight.added`, `bow.quiver.added`,
  `bow.steel.added` (picture: `strider-home-added.png`).
- **Breaks:** §10.2 (a cluster is one theme: `bow.flight.added` holds Light Hand, Wanderer and Round Shield;
  `bow.steel.added` holds Hatchet Work, Weathered and the Ford's evasion), §15.9 (the Strider needs no deference) and
  §11.5's last item (the user's hand edits are a starting point), D-method "Folding a patch back" (folded nodes are
  re-homed "with its reasons, once agreed"; that never happened). The per-cluster checks (one theme, uniform pockets)
  cannot run on a bag.
- **Evidence:** 23 node reasons and 47 link reasons are the literal "Added in the editor (2026-10-19)." Two cluster
  reasons no longer describe the wiring:
  - **Hard Target** ("evasion on the string side, life on the physical side, the notable in the middle"):
    `bow.string.hardTarget.a` (evasion) is not linked to Hard Target at all; it runs from Fleet Foot's evasion small to
    the projectile hub, and Hard Target links Fleet Foot directly.
  - **Quick Hands and Fleet Foot** ("a tight loop ... a mixed node at the bottom between the two notables"): it is not
    a loop, and `speed.m` (5% movement speed) sits on the chain from Quick Hands to True Aim, neither of which has
    movement speed; Fleet Foot, which has, is not linked to it.
  - Outside the Strider, Killing Pace's reason says "attack speed after a kill twice" and the cluster has one small.
- **Fix:**
  1. Re-line `bow.string.speed.m` to `attackSpeed(5)`: the Quick Hands–True Aim chain is then attack speed, which both
     notables carry, and the cluster's three smalls are each their notable's.
  2. Move `bow.string.hardTarget.a` into Fleet Foot's cluster (bookkeeping only).
  3. Re-home every editor node into a named cluster with its notable and a reason: Clear Head with `n402`/`n404`;
     Vital Aim's crit with `n413`/`n414`; Weathered's star with `n417–n424`, `n421/n422` and `n442` (see F4); Round
     Shield with `n429`, `n437`, `n438`; Light Hand with `n434`, `n435`; Wanderer with `n430`, `n431`, `n433`;
     Hatchet Work with `n405–n407`; the Ford's evasion `n408`/`n409` with Wayfarer; `n410`/`n411` with Elemental
     Fletching. A node's id is `area.cluster.node`, so re-homing gives each moved node a new id and number (the old
     number stays a retired hole). Two ways:
     - **Re-home and accept new ids (recommended).** The trade-off pass retired 123 ids the same way, and G-growth §0
       ships the expansion with one refund of everyone's passives, so saves are covered. The cost is stale ids quoted
       in G2/borders.md, the G3 reports and G-growth's state line (`bow.steel.added.n409`–`hub.t`); the fixer
       footnotes or updates them.
     - **Keep the ids** and change only what does not move them: cluster names and reasons, the 70 placeholder
       reasons, and items 1, 2 and 4. The bags then stay bags, and §10.2 is not fixed.
  4. `bow.home.added.n414` is a crit small hanging off `n413` as a one-node dead end: either it leads somewhere or it goes.
  5. Rewrite the two stale cluster reasons and Killing Pace's.
- **Must not break:** §11 (positions stay; this is bookkeeping and two re-lines), §6 (the Strider's first points: Clear
  Head and the crit chain are 2 to 5 steps from the start; nothing moves), the user's names (Wanderer, Round Shield,
  Light Hand stay).

### F6. Arcane Focus and Warded Mind mix their sides, four steps from the Mystic start (should fix)

- **Where:** `spire.craft.focus` (picture: `mystic-focus.png`). The square loop runs a (mana) – b (spell damage) –
  Arcane Focus – c (mana) – d (chaos resistance) – Warded Mind – a. Arcane Focus is flanked by spell damage and mana;
  Warded Mind by mana and chaos resistance.
- **Breaks:** §8.2 (a wheel's side is one modifier) and §8.3 (a two-notable loop is a choice between its sides).
  Arcane Focus has no mana line, so `c` belongs to neither of its neighbours' themes.
- **Fix:** re-line `spire.craft.focus.c` to `castSpeed(4)` (Arcane Focus's partner). Each notable's two smalls are then
  its own lines: Arcane Focus spell damage and cast speed, Warded Mind mana and chaos resistance.
- **Must not break:** G-growth's tension (spell damage near the Mystic start is what G3 kept scarce: hence cast speed,
  not a second spell small), §4.8 (the Cloister and the craft side near home stay mixed: this adds a little offence on
  the defence side), §5.5.

### F7. Bridge pockets that split their smalls between the notable's two stats: §8.2 needs a sentence (consider)

- **Where:** 17 one-notable clusters, nearly all G3: Living Verse, Raking Hand, Hoarded Breath, Smeared Edge, Grey
  Cloak, Cold Steel, Sea Legs, Wiry Frame, Shifting Ward, Ill Wish, Between Ribs, Salt in the Wound, Hardy Stock, Kill
  Shot, Tall Grass, Feint and Cut, Field Kit. Each is a bridge: a uniform chain of one of the notable's stats on one
  side, a uniform chain of its other stat on the other (Wiry Frame: three life, the notable, two evasion).
- **Reading:** every small carries the notable's keyword (§2.5's reference fact) and each chain is uniform, so the
  user's complaint of 10-20 (smalls mixing within a section) does not apply. But §8.2's list names "a pocket's smalls"
  as one section, which these break by the letter.
- **Proposal:** no change to the nodes; add to §8.2 that a bridge's two chains are two sections, each uniform and each
  one of its notable's own stats (§3). If the user reads them as mixed pockets instead, the fix is per cluster: the
  notable's lead stat on both chains.

### F8. Wheel entrances that carry a third stat (consider)

- **Where:** shared entrance smalls of octagon and four-node wheels that belong to neither notable: the Nave wheel
  (`cathedral.nave.wheel.n1/n4`, life, between Iron Faith and Hearthfire), the Snares wheel (`knife.snares.wheel.t1/t4`,
  life, between Trapper and Black Flock), the Pyre wheel (`cathedral.pyre.wheel.f1/f4`, elemental damage, between Rimed
  Steel's cold attacks and Benediction's auras), `yard.dual.twinFangs.a` (attack speed, shared by Twin Fangs and
  Weaving), and `wall.grit.unbroken.a/b` (life beside Unbroken, which sells grit charges only). The other wheels'
  entrances carry one of their notables' lines (crit at Talon and Fine Point, mana at Choirmaster, energy shield at
  Glass Wall, elemental damage at Gilded Rod).
- **Reading:** §11.5 lets a shared small be its own one-node section, so this is a judgement for the user: "life on the
  way" is a player's reason. The Pyre's elemental damage is the weakest: neither side's build wants generic elemental
  damage most.
- **Possible fix:** the Pyre's entrances to `eleAttackOne('cold', 12)` or `auraEffect(6)` by the side they open onto;
  leave the life entrances.

### F9. Roads made of smalls (consider: §8.7 and §7.1 pull against each other here)

- **Where:** three home middle roads of three identical smalls straight out of the signature notable: the Shade's
  blade road (`knife.home.roadB.a–c`, 8% attack speed, picture `home-roads-shade.png`), the Reaver's middle road
  (`yard.home.roadS.a–c`, life), the Zealot's middle road (`cathedral.home.roadM.a–c`, life, then a fourth life node at
  the Nave wheel's entrance). Also `knife.hex.road.a`, one energy shield small between two attribute junctions, and the
  Shieldwall run (`yard.shield.shieldwall.a–c`, block), the one notable-less run the G1 brief kept as a block bridge.
- **Reading:** §8.7 allows a run with no notable "for a road's character", and §6.2 asks the first points to carry
  coherent stats, which these do. But §7.1 and §8.7's last sentence say road nodes are attributes. Only the Shade's road
  has an extra fault (its smalls are 1.6 units, F4). `knife.hex.road.a` has no reason beyond being "the one road node of
  the barb": an attribute node (`dex(6), int(6)`) there would read as the road it is.
- **Fix:** F4's re-size of the blade road; `knife.hex.road.a` to an attribute node; ask the user whether the home middle
  roads stay as stat roads.

### F10. Notables that pair a weapon's attack line with spell damage (consider)

- **Where:** Quiet Knife (`knife.home`, `daggerDamage(16), spellDamage(16), castSpeed(4)`), Crozier (Zealot,
  `staffDamage(16), spellDamage(16), castSpeed(4)`).
- **Breaks, possibly:** §10.2. Dagger and staff damage lines reach attacks with the weapon (the weapon's tag joins only
  attack uses, `skill.ts:396`); spell damage reaches spells. A dagger caster gets half the notable, a dagger attacker
  the other half: a pairing of two builds, the kind §10.2 rules out ("poison damage and staff damage").
- **Fix:** Quiet Knife's dagger damage to `daggerSpellDamage(16)` (a dagger caster's notable at the Shade's door), or its
  spell damage to dagger attack speed (a dagger attacker's). Crozier has no staff-spell line to use; its staff damage
  to `blockAttack` or spell block would make it the staff caster's ("staff damage and block" is the user's own good
  pairing).
- **Must not break:** §5.1–2 (the dagger caster already has Sharp Tongue, Ritual Blade and Athame; Quiet Knife as a
  fourth must keep a different partner and its distance; that is the specializations auditor's call).

### F11. Copies of existing pairings among G3's new notables (consider; cross-reference for the specializations audit)

- **Where:** G3 added Wiry Frame (life and evasion, as Weaving), Wake (energy shield and life, as Warm Blood), Hoarded
  Breath (energy shield and mana, as Glass Skin), Hasty Words (spell damage and cast speed, as Arcane Focus), High Veil
  (energy shield and resistances, as Litany), Hardy Stock (life and resistances, a third after Shelter and Elemental
  Ward). Older copies: Sidestep and Soft Step, Killing Eye and Mercy Stroke, Wayfarer and Snakeskin, Stone Heart and
  Scarred Hide, Second Wind and Long Breath.
- **Reading:** generic defence spread over regions is what §5.3 asks for, so none is a fault alone. But G-growth §4
  names "sameness at scale" as the growth's risk and §10.1 asks for a wide vocabulary across clusters. Six of the
  growth's new notables are two-line copies of a pairing the tree already sells.
- **Fix:** give two or three of the G3 copies a third, rarer line in their own voice (Wake: energy shield recharge or
  life on block; Hardy Stock: stun recovery; Hasty Words: spell crit), priced to keep 3 to 5 units. Six lines of
  `lines.ts` are unused (`accuracyFlat`, `armourFlat`, `evasionFlat`, `coldDot`, `poisonDuration`, `damageVsChilled`);
  the last would be sheet-invisible (F3), and `coldDot` needs a cold damage-over-time skill to be live (check first).

### F12. `lines.ts` prices the same stat two ways, and its labels hide tags (consider)

- `weaponDamage(w)` prices every weapon at 10% a unit; `maceDamage` is 14, `axeDamage` and `staffDamage` 12,
  `wandAttack` 12. So a mace-only 10% small (`weaponDamage('mace', 10)`) is worth more than a mace-and-sceptre 12%
  (`maceDamage(12)`, 0.86), the narrower line priced higher (the Vanguard's open question in G3 r1 and r2). Notables
  built from the two lines are priced inconsistently under §8.6.
- `allAttr` prices +8 all attributes at 2 units where three +8 lines would be 1.6.
- The authoring labels of `critChance`, `critMulti`, `leechLife`, `lifeOnHit`, `manaOnHit` and `manaLeech` drop their
  tags: Brandwright's brand-only crit and Hair Trigger's trap-only crit print as "30% crit chance", Mana Tap's spell-only
  leech as "0.8% mana leech". The game's text (`modsText`) is right; the audit, the supply map and agents' reading are
  not.
- **Fix:** one unit per stat (use `UNIT` in `weaponDamage` by weapon), tags in every label. `lines.ts` only.

### F13. Two notables reach three units only through strength (consider)

- Greatweight (30% two-handed damage, +16 strength: 2.5 units without the strength) and Broad Back (12% life, +16
  strength: 2.4) on the Vanguard's two-hander wheel. Attribute lines are worth nothing to the allocator, so each reads
  as a 2.5-unit notable to a build. The signature notables, Wanderer and Well Rounded are attribute notables by design
  and are not counted here.
- **Fix:** swap the strength for a small partner line in theme (Greatweight: two-handed accuracy or stun duration;
  Broad Back: stun threshold), or raise the lead line half a unit.
- **Must not break:** §7.4 (the strength these give is part of the west tower's supply; check the two-hander's strength
  against its gear after).

---

## 2. What is good (do not undo it)

- **Notable values (§8.6):** all 274 notables are 3.0 to 5.0 units (median 4.0, quartiles 3.7 and 4.1). Every unit sum
  quoted in a notable's reason (253 of them) matches its lines.
- **Smalls belong to notables (§8.7):** only four smalls sit in runs that touch no notable or keystone (the Shieldwall
  bridge and `knife.hex.road.a`). G1's choice to fold the ledger's small sections into notable clusters held.
- **Uniform sections (§8.2):** no road, keystone spur or one-notable chain mixes modifiers except the cases above; the
  G3 clusters' chains are uniform, and every two-notable wheel the growth touched (Greatweight and Broad Back, Steel Rim and
  Scarred Hide, Full Swing and Paired Steel, Deep Well and Glass Skin, Barbed Point and Shroud) has one stat per side.
- **Vocabulary (§10.1):** 178 of the 186 line functions of `lines.ts` in use (two of the unused are the `damage` and `flag` helpers); each region's notables use 54 to 69 different lines and
  its smalls 28 to 40 different modifiers; no region is one-note (the largest share of any region's smalls is life in
  the Vanguard, 11 of 125). The user's named examples (weapon lines, shield and dual wield, mana leech and mana on hit,
  crit with a weapon, reduced reservation, poison) are all on notables and smalls in several regions.
- **One theme per cluster (§10.2):** apart from F10 and the Strider's bags, notables pair things one build wants
  together (cold with a shield at Frozen Font, minions with curses at Bad Company, armour with warcries at Iron Voice).
- **Live lines (§10.3):** every stat in the network is read somewhere; tagged lines resolve as intended (weapon tags
  join attack uses, `skill.ts:396`; channelling, totem, trap and mine speeds and the `per: charges.grit` regeneration
  are live in both). The known dead lines of §10.3 are gone.
- **Names (§2.4):** the ip test passes, and every name G3 added is clear of the reference tree.
- **Reasons:** all 721 written links have a reason, and outside the Strider's editor nodes they describe the link
  (18 name a notable more than five steps away, all as history or the road's destination).

## 3. Missing rules (proposed wording)

1. **§2.4, a check that runs:** "`src/data/passives` names (notables, keystones, clusters, areas) are tested against the
   reference tree's notable and keystone names, whole name, ignoring case; the test skips without the local reference."
   The grep of new names in each round never looked at the old ones (F1).
2. **§8.1, smalls checked:** "A small is one unit of its line as `lines.ts` prices it, within a tenth; `passives:audit`
   lists every small that is not. A stat whose reference small differs from `UNIT` changes `UNIT`, not the node." (F4)
3. **§8.2, bridges:** "A bridge pocket's two chains are two sections: each is uniform and carries one of its notable's
   own stats." (F7, if the user agrees.)
4. **§10.3, conditions:** "A line whose stat depends on a condition (the target bleeding, a kill recently, full life,
   charges held) is read by the sheet only if the sheet takes the condition as given; otherwise it is written only on a
   notable beside a line the sheet counts." (F3, whichever way the user decides.)
5. **§15.9 or D-method, folded nodes:** "Nodes added in the editor are folded into named clusters with their reasons
   before the next growth round; an `added` cluster is a temporary holding place, never a cluster." (F5)

## 4. Checklist of the items in this subset

| item                                                    | verdict                                                                                                                                                                      |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| §2.4 names our own plain words                          | **fails**: six exact reference notable names (F1)                                                                                                                            |
| §8.1 a small is one stat at the reference size          | holds with exceptions: 63 smalls off one unit by stat, three smalls with two lines, one attribute small (F4)                                                                 |
| §8.2 every small in a section carries the same modifier | holds with exceptions: Arcane Focus and Warded Mind (F6), the Strider's editor chains (F5), wheel entrances (F8), bridge pockets (F7)                                        |
| §8.3 micro choices are real                             | holds with exceptions: the Quick Hands chain and Arcane Focus loop (F5, F6); the rest is the specializations audit's                                                         |
| §8.4–8.5 shapes and forks                               | holds                                                                                                                                                                        |
| §8.6 notables worth 3 to 5 units                        | holds (all 274); Greatweight and Broad Back only with their strength (F13); pricing inconsistent between weapon lines (F12)                                                  |
| §8.7 almost every small belongs to a notable            | holds with exceptions: Shieldwall bridge (decided), `knife.hex.road.a`, three home roads of smalls (F9)                                                                      |
| §10.1 wide vocabulary                                   | holds; six G3 notables copy existing pairings (F11)                                                                                                                          |
| §10.2 one theme per cluster                             | holds with exceptions: the Strider's editor bags (F5), Quiet Knife and Crozier (F10)                                                                                         |
| §10.3 every line live in the sheet and the fight        | **fails**: Hexwright's curse area dead in both (F2); about twenty lines the fight obeys and the sheet does not count (F3)                                                    |
| §10.4–10.5 node kinds, the editor                       | holds, except `bow.steel.added.n442` (an attribute carried as a small, F4)                                                                                                   |
| every node and link has a `why` that still matches      | holds with exceptions: 70 placeholder reasons and two stale cluster reasons in the Strider, Killing Pace's (F5); §14 rejects reasons as a rule, so this ranks below the rest |
