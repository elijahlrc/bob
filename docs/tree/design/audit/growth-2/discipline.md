# G4 audit round 2: node discipline

Written 2026-10-23 on the network as committed at ed95ecf (G4 fix pass 1, baked; 1,398 live nodes: 747 smalls, 279
notables, 27 keystones, 339 attribute nodes, 6 starts; `passives:audit` problems 0; `edits.json` empty). The one later
commit that touches code (3f23d77, wand attacks) changes the engine and the wand bases, not `src/data/passives`, so
`G4/builds-fix1.txt` is still the allocator's reading of today's tree and was not re-run. Read-only: nothing in `src/`, `scripts/` or the plan documents
changed.

**Subset:** CONSTRAINTS §8 (clusters, notables and smalls), §10 (vocabulary, one theme per cluster, live lines), §2.4
(names), and whether each node's and link's `why` still says what it is. The rest of CONSTRAINTS was read in full; each
fix names the items it must not break.

**How it was measured.** A scratch dump of the built network (`buildAll`, every node with its lines, units, links and
reasons), then scripts for: smalls off one unit and smalls with more than one line; notables in units, with and without
attribute lines; sections (chains of two-link smalls between non-small nodes) that mix modifiers; junction smalls; runs
of smalls that touch no notable; line usage by kind and region; notables sharing a set of line kinds and pairs on three
or more notables; every notable, keystone, cluster and area name against the reference tree's names (exact and
multi-word partial); placeholder and missing reasons; reasons that name a notable that no longer exists; unit sums quoted
in reasons. The engine check for §10.3 followed each line the fix pass introduced or moved into the sheet
(`src/calc`) and the fight (`src/sim`). Pictures in `discipline/`: `crozier.png`, `wanderer.png`, `familiars.png`
(close-ups with every node's lines).

---

## 1. Findings, most important first

No must-fix finding. Round 1's two must-fixes (reference names, Hexwright's dead curse area) are fixed, and the lines
the fix pass introduced are all live in the fight.

### D1. Crozier still pairs a staff attack line with spell damage (should fix)

- **Where:** Crozier (`cathedral.ambulatory.crozier.n`, Zealot): `staffDamage(16), spellDamage(16), castSpeed(4)`; its
  two smalls `crozier.a`, `.b` are `staffDamage(12)`. Picture: `discipline/crozier.png`.
- **Breaks:** §10.2 (one theme per cluster; a pairing of two builds, the kind "poison damage and staff damage" names).
- **Evidence:** a weapon line reaches only attack uses with the weapon (the held weapon's tags join an attack's hand
  profile, `src/calc/skill.ts:396`). So the cluster's two smalls and a third of the notable are a staff attacker's, and
  the spell damage and cast speed a staff caster's: each build gets half. Round 1 (F10) found it; fix-1 §2.4 deferred it
  "until a staff-spell line exists" (§3 item 5), and that line was not added. It needs nothing new in the engine:
  `wieldingStaff` is a static weapon condition set exactly like `wieldingDagger` (`src/calc/staticConds.ts:13`), and
  `daggerSpellDamage` in `lines.ts` is the template. Quiet Knife's identical fault was fixed this way in K-4.
- **Fix:** add `staffSpellDamage(v)` to `lines.ts` (`damage(v, { tags: ['spell'], condition: { id: 'wieldingStaff' },
unit: 8, label: '…% spell damage with a staff' })`). Crozier → `staffSpellDamage(20), castSpeed(6)` (2.5 + 1.5 = 4
  units); `crozier.a`, `.b` → `staffSpellDamage(8)`. Rewrite the cluster `why` ("the staff in a caster's hand" becomes
  true). The staff's attack homes stay Quarterstaff (block, area) and Warding Staff (spell block).
- **Must not break:** §5.1 (Crozier's partner, cast speed, is the generic caster's; Warding Staff 13 steps away keeps
  spell block, Quarterstaff 10 keeps block; if the trade-offs auditor prefers a rarer partner, mana regeneration would
  copy Quiet Knife's dagger pairing, so cast speed is the better of the two), §4.6 (the Zealot still sells plain spell
  damage on Homily, Hymn, Lectern and Vespers), §8.6. Crozier is in 2 of the 28 plans today; the builds auditor should
  check that the staff-block archetype, which weighs staff attack damage, does not lose its reason to walk there.

### D2. `UNIT.resOne` was decided at 10 and is still 8: 28 resistance smalls are 1.25 units (should fix)

- **Where:** `lines.ts` `UNIT.resOne: 8`. The 28 single-resistance smalls at 10% (the six resist stars: Elemental Ward,
  Four Winds, Prism Ward, Snakeskin, Litany, and Weathered's eight spoke smalls) are 1.25 units each; the two notables
  with a single resistance line are Warded Mind (`resOne('chaos', 16)`, 4.0 units) and Sound Body (`resOne('chaos', 16),
avoidAilments(10)`, exactly 3.0).
- **Breaks:** §8.1 (a small is one unit as `lines.ts` prices it).
- **Evidence:** fix-1 §1.2 item 10 settled it ("`UNIT.resOne` becomes 10 (coordinator, `lines.ts`), no node changes;
  Sound Body's chaos resistance is raised to keep it at 3 units or more") and §3 item 3 listed it; `git log` shows no
  change to `lines.ts` since 805dca2. This is a decided item not carried out, not a new judgement. The allocator prices
  a resistance small 25% above every other small, so every walk past a star overvalues it.
- **Fix:** `UNIT.resOne: 10`. Sound Body `resOne('chaos', 16)` → `resOne('chaos', 20)` (2.0 + 1.0 = 3.0 units after the
  change). Warded Mind falls to 3.6, in range. No node moves; re-bake.
- **Must not break:** §8.6 (Sound Body stays at 3; no other notable carries `resOne`), §4.5 (resistances stay where they
  are).

### D3. Four keystone-spur smalls at 0.8 units (should fix, cheap)

- **Where:** `spire.frost.prismatic.a/b` (Prismatic Balance's spur) and `spire.frost.feverPitch.a/b` (Fever Pitch's spur),
  each `eleDamageAll(8)`, 0.8 units.
- **Breaks:** §8.1.
- **Evidence:** with D2's 28, these are the only smalls in the network off one unit by more than a sixth (the next are
  Long Watch's three `totemSpeed(4)` smalls at 1.14, D4). The Mystic fixer left them on purpose for "the coordinator's
  off-unit list" (`G4/fix1/mystic.md`), and that list (fix-1 §3 item 2, `passives:audit` listing smalls off one unit) was
  not built.
- **Fix:** the four to `eleDamageAll(10)`.
- **Must not break:** §9.1 (both spurs stay dead ends; a re-line moves nothing).

### D4. Pricing and labels left in `lines.ts` (consider)

Round 1's F12 and fix-1 §3 item 3, re-read:

- **Withdraw the weapon-pricing item.** Round 1 said a 10% `weaponDamage('mace', 10)` small is dearer than a 12%
  `maceDamage(12)`. That compared two different lines: `maceDamage`, `axeDamage` and `twoHandDamage` are
  physical-only lines, and the reference tree's physical mace-and-sceptre smalls are mostly 14% (axes 12 to 15%), which
  is what `UNIT.mace` 14 and `UNIT.axe` 12 follow; `weaponDamage(w)` is all damage with the weapon, whose reference
  smalls are mostly 10%. So Sledge and Sinew's three 10% mace smalls, `cathedral.rods.wheel.r2/r7` (10% sceptre) and
  Hallowed Hammer's 14% smalls are each one unit, and fix-1 §3 item 3's "price `weaponDamage` by `UNIT` per weapon"
  should **not** be done.
- **`totemSpeed` is priced at v / 3.5,** so Long Watch's three 4% smalls are 1.14 units. Pricing it at `UNIT.castSpeed`
  (4) makes them one unit; Long Watch (`totemSpeed(8), totemDuration(20)`) goes from 3.6 to 3.3 and Sentry Post from 4.1
  to 4.0, both in range.
- **`allAttr` at v / 4** prices +8 all attributes (24 points) at 2 units, where three `+8` lines are 1.6. Only Well
  Rounded and Wanderer carry it (D6).
- **Labels still hide tags** (`critChance`, `critMulti`, `leechLife`, `lifeOnHit`, `manaOnHit`, `manaLeech`): Weak
  Spot's `critChance(22, ['melee'])` and its smalls, Crushing Blow's and Fencer's Eye's melee crit smalls print as plain
  "crit chance" in listings and in this audit's dumps. The game's text (`modsText`) is right.
- **`curseArea`** is no longer on any node (Hexwright was re-lined), but `lines.ts` still prices it as a live line and
  `scripts/passives/archetypes.ts:955,965` still weighs it for the curser. Remove it from both, or mark it dead, so the
  editor does not offer it again (§10.3).
- **Skill duration does reach a cast curse.** fix-1 §1.2 item 11 and §3 item 4 assumed `applyHex` takes no duration;
  it takes `hexSeconds(…) * act.profile.skillDuration` (`src/sim/utility.ts:434`), and the sheet's profile carries the
  same `skillDuration` (`src/calc/skill.ts:610`). Hexwright's `manaRegen(15)` partner is fine; `skillDuration(15)` is
  also open to it now. Mana regeneration is the partner on Hexwright, Quiet Knife and Bright Omen, three of the fix
  pass's notables, so the duration would widen the palette a little (§10.1). The trade-offs auditor's call.

### D5. Six notables pair spell damage with cast speed (consider)

- **Where:** Ready Wit (Mystic, `spellDamage(20), castSpeed(6)`), Hedge Magic (Strider, + intelligence), Spellsword
  (Reaver, + mana regeneration), Homily (Zealot, + elemental damage), Iron Liturgy (Vanguard, + armour), Crozier
  (Zealot, + staff damage). They are 14 to 34 steps apart.
- **Reading:** spell damage is a generic stat that §5.3 wants spread, and Hedge Magic and Spellsword are the off-class
  spell notables fix-1 kept on purpose (T8). But it is the most repeated pairing in the network (the next are four
  notables each), and G-growth §4 names sameness at scale as the growth's risk. D1 keeps the count at six (it makes
  Crozier's spell damage a staff's, a variant of the pairing); Homily and Iron Liturgy carry cast speed only as a
  one-unit third line.
- **Possible fix:** re-line Iron Liturgy's `castSpeed(4)` to `stunAvoid(20)` (the armoured caster who is not
  interrupted; live in both, `calc/defence.ts`) and leave the rest. Not a rule; the trade-offs auditor weighs it.

### D6. Wanderer now copies Well Rounded, and both carry attribute smalls (consider)

- **Where:** Wanderer (`bow.flight.wanderer.n`, Strider, 7 steps from its start): `allAttr(8), life(8)`, small
  `wanderer.a` `allAttr(4)`. Well Rounded (`centre.inner.wellRounded.n`): `allAttr(8), life(5)`, smalls `a`, `b`
  `allAttr(4)`. 12 steps apart. Picture: `discipline/wanderer.png`.
- **Reading:** S-3 took Wanderer's evasion away (T2's evasion near the Strider start), which left exactly Well
  Rounded's pairing. Round 1 excused both as attribute notables by design, and they are; but neither is in any of the 28
  plans at any budget even now that the allocator pays for its gear's attributes (`G4/builds-fix1.txt`), so to a build
  each is 1.0 to 1.6 units plus attributes. The three `allAttr(4)` smalls are attribute lines on smalls (§10.4 keeps
  attributes on attribute nodes; round 1's F4 converted `n442` for the same reason, these three were missed).
- **Possible fix:** a question for the builds and trade-offs auditors, not decided here. If Wanderer should differ from
  Well Rounded, its partner could be a traveller's line no near notable sells (flask duration, or stun recovery); if the
  three attribute smalls should read as roads, they become attribute nodes `str(4), dex(4), int(4)` (no change to what
  they give). Keep the user's name.

### D7. Copies of a pairing from G3, re-measured (consider)

- **Where:** Wake = Warm Blood (energy shield and life, 30 steps apart); Hoarded Breath = Glass Skin (energy shield and
  mana, 20); High Veil = Litany (energy shield and resistances, 19); Hardy Stock = Elemental Ward = Shelter (life and
  resistances); Long Breath = Second Wind (life and regeneration, 24); Wayfarer = Snakeskin (evasion and resistances,
  13). Round 1's F11; fix 1 changed only Hasty Words (now Thrown Voice) and deferred the rest to this round's measure
  (fix-1 §2.8, D11).
- **Reading:** every copy is a generic defence in two different regions, 13 to 30 steps apart, so no build is offered
  the same pairing twice within reach, and §5.3 asks for generic stats spread as lines on many notables. In
  `G4/builds-fix1.txt` (plans and gave-up lists together) Warm Blood is named 8 times, Hoarded Breath 6, Glass Skin and
  High Veil 5, Litany 2, Wake 0: they are wanted by different builds, not stacked by one. Not a fault alone; §10.1 is still met (D9's numbers).
- **Possible fix:** only if the trade-offs auditor sees the sameness in a walk: a third, rarer line in each copy's own
  voice, priced to stay 3 to 5 units (Wake: `esRechargeDelay(15)`; Hardy Stock: `stunRecovery(15)`).

### D8. Reasons that no longer describe their cluster (consider)

- **Familiars** (`spire.fire.familiars`, picture `discipline/familiars.png`): the cluster `why` says "the notable with
  minion damage, life and speed"; the notable is `minionDamage(24), minionLife(12), spellDamage(8)` (its own `why`, "the
  caster's minions", is right). Fix the cluster text. Re-lining to `minionSpeed(5)` would match the old text but copy
  Shepherd's three lines, so keep the spell damage.
- **Graven Posts** (`wall.resists.posts`): the cluster and notable reasons say the chain runs from Hallowed Hammer to
  Stagger; since seam 5 the notable also leads to Twofold Guard (`cathedral.rods.guard.b`), which neither names (the
  Zealot fixer flagged it; the Wall's file was not theirs).
- **Cinder** (`spire.fire.cinder`): the cluster `why` ends at "its far side leading on to the north-west rim road";
  the notable is now the Mystic end of seam 2 (Bright Omen).
- **Steady Hands** (`wall.rampart.steadyHands.n`): "1.7 of speed: 3.7"; it is 1.6 and 3.6.
- Every other reason checked holds: 0 links without a reason (1,703), 0 placeholder reasons (round 1 had 70), every
  "Added in the editor" left is history inside a fuller reason, and every mention of a renamed or removed notable (True
  Aim, Mercy Stroke, Stone Heart, Hasty Words and the six renamed in 8caa171) is written as history.

### D9. Notable names that are also names of Bob's own gems (consider)

- **Where:** Elemental Edge, Close Quarters (a keystone), Split Volley, Crushing Blow, Skewer, Ricochet.
- **Reading:** this is not §2.4, which is about the reference's names; all 458 tree names are clear of those. It is a
  reading question (§1.3, communicate clearly; §1.4, a phone player reads one node at a time): a player who taps
  "Ricochet" on the tree and has a gem called Ricochet may expect one to grant the other. The Shade fixer renamed Mercy
  Stroke partly for this reason. Close Quarters is a keystone name from `src/data/tree/keystones.ts` (§9.1) and the user's
  own example in §1.4: leave it. The other five are candidates for the label pass, not this round.

---

## 2. What is good (do not undo it)

- **Notable values (§8.6):** 279 of 279 notables are 3.0 to 5.0 units (median 4.0, quartiles 3.7 and 4.05). Every new or
  re-lined notable of the fix pass is in range (Needlework, Bright Omen, Clean Break 3.5; Hare's Pace, Twofold Guard,
  Killing Eye, Bright Shafts, Clear Head 4.0; Quick Wrists 3.0; Weak Spot 3.5; Greatweight 3.5, Broad Back 3.4, which no
  longer need their strength). Unit sums quoted in reasons match the lines (one cosmetic slip, D8).
- **Smalls (§8.1):** 0 smalls with two lines (round 1 had three), 0 attribute lines carried as a single-stat small except
  the three `allAttr(4)` (D6), and every small re-sized in the fix pass is one unit. Off one unit: only D2's 28 (a
  decided `UNIT` change) and D3's 4, plus Long Watch's three at 1.14.
- **Uniform sections (§8.2):** of 383 runs of smalls, the only sections that mix modifiers are three chains between two
  notables, each split half and half by whose stat it is (§11.5's judgement): Quick Hands' attack speed onto Weathered's
  chaos spoke, Vital Aim's crit onto Weathered's cold spoke, and the Bulwark wheel's end (armour, then Iron Lungs' mana on
  hit). Ready Wit and Warded Mind now each have their own two smalls (round 1's F6). Bridges carry one of their
  notable's stats on each chain (Hare's Pace, Killing Eye, Clean Break, Wiry Frame), each chain uniform.
- **Smalls belong to notables (§8.7):** only the Shieldwall run touches no notable (decided in G1), and the three home
  middle roads of life smalls (Vanguard, Reaver, Zealot) are kept by fix-1's decision as roads with a character. The
  Shade's blade road now has its notable (Quick Wrists).
- **Vocabulary (§10.1):** 177 of `lines.ts`'s 186 functions in use (unused: the `damage` and `flag` helpers,
  `accuracyFlat`, `armourFlat`, `evasionFlat`, `coldDot`, `poisonDuration`, `damageVsChilled`, `curseArea`); each region's
  notables use 56 to 70 different lines and its smalls 34 to 43 different modifiers; the largest share of any region's
  smalls is evasion in the Strider (15 of 123). Every example the user named in §10.1 is on notables and smalls in
  several regions.
- **One theme per cluster (§10.2):** the Strider's editor bags are gone (every node in a named cluster with its notable),
  Quiet Knife is the dagger caster's alone, and the fix pass's pairings are each one build's (attack speed with crit,
  physical attacks with crit multiplier, evasion with attack speed, block with spell block, spell crit with mana).
  Crozier (D1) is the one split left.
- **Live lines (§10.3):** every line on a node is read by the fight. Checked for the lines the fix pass placed:
  `stunRecovery` (`stunDurationOnSelf`, `calc/defence.ts:138`, used by `sim/afflict.ts:125`), `avoidAilments`
  (`calc/defence.ts:42`), `dodgeAttack`, `dualBlock`, `reducedReservation`, `warcryEffect`, `spellBlock`,
  `shieldSpellBlock`, `auraEffect`, `damageVsLowLife` (`sim/combat.ts:159`), melee- and two-hand-tagged lines (the
  weapon base's tags), and the conditional lines (`sim/combat.ts:110-162`). Also confirmed: `doubleDamage`
  (`calc/combat.ts:452`), `cullingStrike` (`sim/combat.ts:614`), `enemyStunThreshold` (`calc/combat.ts:385`), skill
  duration on a cast curse (`sim/utility.ts:434`). The sheet need not count every line (§10.3, the user).
- **Names (§2.4):** all 458 notable, keystone, cluster and area names are clear of the reference tree's names, exact and
  multi-word partial; `names.test.ts` now guards notables and keystones; `ip.test.ts` and `names.test.ts` pass. No two
  nodes share a name.
- **Reasons:** see D8's last item.

## 3. Round 1 follow-up

| round 1                                      | status                                                                                                                                                                                                                                     |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| F1 reference names (must)                    | **fixed** (8caa171; 458 names clean; `names.test.ts` added)                                                                                                                                                                                |
| F2 Hexwright's dead curse area (must)        | **fixed** (`curseEffect(20), manaRegen(15)`); the duration question is answered (D4): skill duration does reach a cast curse                                                                                                               |
| F3 lines the sheet does not count (should)   | **closed by the user** (U1, CONSTRAINTS §10.3: "a non issue"); every one of them is live in the fight                                                                                                                                      |
| F4 smalls off one unit, two-line smalls      | **partly**: the two-line smalls, `n442`, attack speed, bow speed, two-hand speed, block, one-handed, mace, freeze, evasion, wand and Finishing Cut re-sizes are done; left: `UNIT.resOne` ×28 (D2), two spurs ×4 (D3), totem speed ×3 (D4) |
| F5 the Strider's editor bags (should)        | **fixed**: bags re-homed, 70 placeholder reasons replaced, Hard Target's and Quick Hands' reasons rewritten, `n414` laid on the line                                                                                                       |
| F6 Arcane Focus / Warded Mind sides (should) | **fixed** (`focus.c` cast speed)                                                                                                                                                                                                           |
| F7 bridge pockets (consider)                 | no change, as intended; read as two uniform sections (§2 above)                                                                                                                                                                            |
| F8 wheel entrances of a third stat           | **partly**: the Pyre's fixed; the life entrances (Nave, Snares, Unbroken) kept by decision                                                                                                                                                 |
| F9 roads made of smalls                      | **fixed** for the blade road (Quick Wrists) and `knife.hex.road.a`; the three home life roads kept by decision                                                                                                                             |
| F10 Quiet Knife, Crozier                     | **partly**: Quiet Knife fixed; Crozier open (D1)                                                                                                                                                                                           |
| F11 G3 copies of pairings                    | Hasty Words changed; the rest re-measured and left (D7)                                                                                                                                                                                    |
| F12 `lines.ts` pricing and labels            | **not done**; the weapon-pricing part is withdrawn (D4)                                                                                                                                                                                    |
| F13 Greatweight, Broad Back                  | **fixed** (stun duration, stun recovery)                                                                                                                                                                                                   |

Fix-1's tool items in my subset were not done: `passives:audit` listing smalls off one unit (§3 item 2), the `lines.ts`
changes (§3 item 3: `UNIT.resOne`, `allAttr`, labels, `curseArea`), the staff-spell line (§3 item 5). D1 to D4 carry the
ones still worth doing.

## 4. Checklist

| item                                                    | verdict                                                                                                                |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| §2.4 names our own plain words                          | **holds** (458 names clean; gem-name overlaps are a reading question, D9)                                              |
| §8.1 a small is one stat at the reference size          | holds with exceptions: 28 resistance smalls at 1.25 (D2), 4 spur smalls at 0.8 (D3), 3 totem speed smalls at 1.14 (D4) |
| §8.2 every small in a section carries the same modifier | **holds**; three two-notable chains split by whose stat it is; wheel life entrances kept by decision                   |
| §8.3 micro choices are real                             | holds in my subset (Ready Wit / Warded Mind fixed); the rest is the trade-offs audit's                                 |
| §8.4–8.5 shapes and forks                               | holds                                                                                                                  |
| §8.6 notables worth 3 to 5 units                        | **holds** (279 of 279); Wanderer and Well Rounded are attribute notables by design (D6)                                |
| §8.7 almost every small belongs to a notable            | holds with the decided exceptions (Shieldwall; three home life roads)                                                  |
| §10.1 wide vocabulary                                   | **holds**; spell damage with cast speed six times (D5), G3 copies spread far apart (D7)                                |
| §10.2 one theme per cluster                             | holds with one exception: Crozier (D1)                                                                                 |
| §10.3 every line obeyed by the fight                    | **holds**: no node carries a dead line; `curseArea` lingers in the vocabulary and the curser's weights (D4)            |
| §10.4–10.5 node kinds, the editor                       | holds, except three `allAttr(4)` smalls (D6)                                                                           |
| every node and link has a `why` that still matches      | holds with four small exceptions (D8); §14 rejects reasons as a rule, so this ranks last                               |

Sections of CONSTRAINTS weighed for the fixes: §1.1 and §14 (no node placed for a number; every fix is a re-line, a
price or a text), §4.5–4.6 (D1, D2), §5.1–5.3 (D1, D5, D6, D7), §8, §9.1 (D3), §10, §2.4.
