# G4 audit round 1: starts, homes and the late game

Auditor's subset: CONSTRAINTS §4.5–8, §6, §9 (with the whole document at hand). Measured 2026-10-22 on the network as
committed at 3b2affe (1,389 live nodes). Nothing in the network was changed.

**Tools used:** `npm run passives:audit` (first steps, keystone distances), `npm run passives:builds` (the allocator, 28
archetypes), `npm run passives:supply`, `passives:list`, `passives:pic`, and scratch scripts (outside the repo) that
dump every node within ten steps of each start, sort its lines into offence / defence / utility by `lines.ts` family,
walk each keystone's spur, and split each 120-point plan into what its last 40 points bought.

**Pictures** (this folder, `starts/`):

- `home-<class>.png`: each home, 2,600 tree units square, names only.
- `strip-vanguard-reaver.png`: the ground between the Vanguard and Reaver starts, with every node's lines.
- `vanguard-near-text.png`: the Vanguard's home with every node's lines.

Steps are points bought from the start, never through another start (the audit's measure). "O / D / U" is offence,
defence and utility (mana, flasks, movement, cost, reservation), by units.

---

## 1. Findings, most important first

### F1. The Zealot's casters have no spell direction near their start, so every one of them opens the same way: must fix

**Where:** the Zealot home (`cathedral/home.ts`), the nave (`cathedral/nave.ts`).

**What is wrong.** From `start.zealot` the first notable with spell damage of any kind is Hearthfire
(`cathedral.nave.wheel.n5`, fire and cast speed) at 7 steps; the first plain spell-damage notables are Homily
(`cathedral.crypt.wheel.m3`) at 14 and Lectern (`cathedral.nave.lectern.n`) at 15. Every other start that hosts casters
has one within 6 (the Mystic: First Light at 2, Arcane Focus at 8 with an 8% spell small at 7; the Shade: Hedge Magic
at 6, Quiet Knife at 7). The Zealot's offence within 6 steps is Zeal's 10% elemental damage, Ardour (elemental
attacks) and the Vanguard's Ringing Blows; steps 1–4 are 15% offence, 54% utility (`mix.ts`).

**Evidence that it decides for the player (§6.2 "a real choice", §13.8).**

- **Six kinds of Zealot build walk one road.** The spell totem, burning, staff block, aura and brand, block caster
  and storm archetypes all have Zeal, Hearthfire, Vigil and Choirmaster among their first six notables at 60 points,
  and five of the six have Litany too. Only the sceptre striker differs. Other homes converge on generic picks as
  well (the three Strider bows share five of their first seven; all four Vanguard builds take Oathbound and Stone
  Heart), but those are one kind of build each. The Zealot's six are six different kinds, and the five Mystic
  archetypes, by contrast, open five different ways.
- The **lightning** caster's first spell notable is Hearthfire, a fire notable, because it is the only cast speed and
  spell line within reach.
- The casters then leave: the storm caster's 120-point plan holds 20 Zealot nodes against 81 Mystic ones, the burning
  caster's 26 against 58 Mystic and 24 Shade. Their late 40 points are 0–5% Zealot.
- This is the evidence behind the Zealot round-3 open question 1 ("the burning caster's west"). It is not an argument
  that the Zealot's casters must stay home; it says the home offers them one road.

**Proposed fix.** Give the caster a second direction from the east hub, 4–6 steps out, by re-lining rather than
adding (adding near a start is strength by the back door, G-growth §4):

1. **Re-line Hymn** (`cathedral.home.hymn.n`, the east hub's pocket, 4 steps): from mana, regeneration and shield to
   **spell damage with mana regeneration** (about 16% spell damage and 15% regeneration, 4 units). Keep `hymn.a` and
   `hymn.b` as its mana smalls: the casting Zealot's first point is spell damage with the mana to keep chanting. Then
   points 3–5 offer a real fork for a caster (Hymn east, the fire wheel through `cathedral.home.jT.a`, Ardour west for
   the striker), and the auras still come from the Banner at 3.
2. **Twins to check** (§5.1): First Light (spell damage, maximum mana, shield) is 10 steps from Hymn and Homily (spell,
   elemental, cast speed) 13. The partner proposed here, regeneration, differs from both; the fixer may prefer
   another Zealot partner (lightning, to give the storm caster a first line of its own, or reduced cost), as long as it
   is not fire (Hearthfire) and not maximum mana with shield (First Light).
3. **Alternative**, if Hymn should stay the mana pocket (the channeller gives it up at 120 for 2.8 units): re-line one
   of the two fire smalls on the nave wheel's east side (`cathedral.nave.wheel.n6`, `.n8`) to plain spell damage. This
   is weaker: the wheel's sides must stay a real choice (§8.3), and the route is the same as today.

**A fix must not break:** §4.7 (do not solve it in the centre), §6.3–4 (one optional porch, not a home of casters),
§8.3 (the nave wheel's sides stay a choice), §5.1 (above). Check afterwards that the Zealot's 60-point openings
differ for at least the storm and staff casters.

### F2. Between the Vanguard and Reaver starts lies a band of only defence and flasks: should fix

**Where:** the Vanguard's home and slams (`wall/home.ts`, `wall/slams.ts`, `wall/rampart.ts`) and the Reaver's west
home (`yard/home.ts`, `yard/blades.ts`). Picture: `strip-vanguard-reaver.png`, `vanguard-near-text.png`.

**What is wrong (§4.8, the user's own example: "only health and armor and maybe a bit of es or flask recharge near one
of the starts").**

- Five notables lie 3 to 7 steps apart, each within 4 to 10 steps of both strength starts:
  - Quartermaster (`wall.home.quartermaster.n`, flasks and life, Va4)
  - Bracing (`wall.slams.bracing.n`, block and stun threshold, Va6)
  - Field Dressing (`yard.home.fieldDressing.n`, flasks and life, Re7)
  - Stout Heart (`yard.home.life.n`, life and regeneration, Re4)
  - Guarded (`yard.blades.guarded.n`, armour and evasion, Re9)
- Their smalls are flask recovery ×4, block ×2, life ×2 and armour ×3.
- The near bridge between the two homes (`wall.slams.bracing.b` → `yard.home.fieldDressing.b`/`.a` → Stout Heart)
  carries only defence.
- West of the Vanguard start, the middle road from Oathbound is three life smalls (`wall.home.roadM.a/b/c`).
  Its branch `wall.rampart.toThickSkin.a` leads to Stone Heart (`wall.rampart.stoneHeart`: two more life smalls, then
  12% life and stun threshold) at Va8.
- **Bands.** The Vanguard's steps 5–8 are 23% offence, the lowest of any start (51% defence at 7–8). The Reaver's steps
  7–8 are 59% defence.
- **Flasks.** Three flask notables sit within 5 to 13 steps of one another: Quartermaster, Field Dressing, and the
  centre's Provisions at Va5. Quartermaster and Provisions are nearly the same pairing (flask effect with recovery),
  8 steps apart, both within 5 of the Vanguard start.
- **What the allocator takes.** All four Vanguard archetypes take Stone Heart in their first seven notables, three take
  Quartermaster, and two each take Field Dressing and Guarded.
- The Vanguard's own offence within 8 steps: Oathbound (part), Ringing Blows (4), Shield Ram (6), Thunderstep (7). Its
  class weapon, the mace, starts at 10 (Weight of Iron) and 11 (Sledge and Sinew, Hallowed Hammer).

**Proposed fix (one or two of these, not all):**

1. **Re-line Stone Heart's pocket** to offence. It is a dead end at Va8 off the life road, so moving it changes no route.
   - The Vanguard sells almost no crit (2 units in the region), and §4.6 names crit, so one option is two
     crit-multiplier smalls and a notable with **melee physical damage and critical strike multiplier**.
   - That partner differs from Vital Aim (crit chance with multiplier), Oathbound (life), Ringing Blows (enemy stun)
     and Unbloodied (conditional crit).
   - Stone Heart's life with stun threshold can go to the far rampart or the Barrows, where the Vanguard builds' life
     still climbs late. Or drop it: the Vanguard holds 33 units of life, the most of any region.
2. **Or re-line Quartermaster's pocket** (`wall.home.quartermaster.a/.b/.n`, the south hub's pocket, Va3–4) to an
   offence pocket that names no weapon.
   - One option is **warcry effect with melee physical damage**: the warcry-and-totem build is the one whose warcries
     stay flat, and Drill Call, the other warcry notable near a start, pairs warcries with attack speed and is 13 steps
     away.
   - The Vanguard would then sell flasks only through the centre's Provisions, one step off its ring. Say that out
     loud against §4.6, or keep one flask line on the new notable's far small.
3. **Make the strip a mixed road.** Field Dressing's `why` still says "the exit, to Fencer's Eye", but that link is
   gone and it is a dead end.
   - Either relay it as a bridge onward to an offence cluster (the Reaver's blades), or trade its place with an offence
     pocket farther out on the Reaver's west, so that a player walking from Stout Heart toward the Wall meets a choice
     of kinds.
   - Fencer's Eye (sword crit, Re12) and Killing Pace (Re5, already offence) are the candidates.

**A fix must not break:** §4.5 (both regions keep life, armour, block and stun protection; the Reaver keeps a flask
line), §5.1/§13 (Bracing sits here on purpose, 14 from Weight of Iron, to break the mace-and-shield one-stop; leave
Bracing), §3.5–6 (no cluster left with one way in), §11.5 (re-lining changes no position). Re-lining is preferred to
adding: a new offence cluster here would add supply near two starts.

### F3. The Strider's start hangs two rich pockets off its own start nodes: should fix

**Where:** `bow/home.ts`. Picture: `home-strider.png`.

**What is wrong.**

- **The start's sides.** Every other start's two side smalls have three links: the start, the signature and a hub. The
  Strider's also link a pocket each: `bow.home.sig.a` to `bow.home.life.b` (Long Breath, `bow.home.life.n`, 4.0 units)
  and `bow.home.sig.b` to `bow.home.added.n404` (Clear Head, `bow.home.added.n400`, 4.6 units). Both notables are 3
  steps out.
- **How much sits near it.** The Strider has six notables of its own within 5 steps, and twelve within 6 counting the
  centre and the Shade's and Reaver's edges. The Mystic, the Shade and the Zealot have three or four of their own.
- **How rich it is.** Its home notables are among the richest in the network: Hawk's Eye 4.7, Clear Head 4.6, Hedge
  Magic 4.2, Long Breath and Wayfarer 4.0. Summing by hand what lies within six steps (a description of the supply
  around the start, not a reach measure), the Strider has about 92 units, against 43 to 64 for the others.
- **Effects:**
  - The bow builds pay little tax (22 to 29% at 120 points; only the Shade's attackers pay less), against 30 to 42% for
    the casters. That is partly the dexterity side's shape, so it is supporting evidence only.
  - The Strider's start notables are what other builds most often walk over to take late (F6). Long Breath alone is in
    seven other archetypes' late or "gave up" lists, and Hedge Magic in four.
  - §12.1: "high-value nodes packed too densely" is the failure the user leans to.
- **Not a rule break.** §6.5 holds to the letter (3 is "three or four"). The reference start's nearest notables are
  four out (§2.5).

**Proposed fix.**

- Cut `bow.home.sig.a`–`bow.home.life.b` and `bow.home.sig.b`–`bow.home.added.n404`.
- Re-hang `bow.home.life.b` on `bow.home.hubs.n` and `bow.home.added.n404` on `bow.home.hubs.s`, so each hub has its
  pocket, as the §6.3 pattern describes. Long Breath and Clear Head move to 4 steps.
- `hubs.s` already has five links. If a sixth crowds it, leave `n404` as Clear Head's own end small; Clear Head is then
  reached from `bow.string.added.n402`, 6 steps out.
- Optionally trim Clear Head to about 4 units (it is the mana pocket, and F4 proposes giving it the Strider's first
  reservation line).

**A fix must not break:**

- §3.5: Long Breath keeps `life.a` and `elements.a`; Clear Head keeps `n402`.
- §6.5: the start still fans to the signature, two hubs and their roads.
- §11.5: run `geometry.ts --region strider --bends`.
- §15.9: this is the user's hand edit, and it may be reshaped.

### F4. Three regions miss a line "most builds want" (§4.6): should fix

**Evidence** (`passives:supply`, and a grep of the area files for the lines):

| region           | missing or thin                                                            |
| ---------------- | -------------------------------------------------------------------------- |
| Zealot           | no flask line, no movement line, one plain attack-speed line (Ardour's 5%) |
| Strider          | no reservation or aura line at all                                         |
| Vanguard         | crit 2 units (fixed if F2's first option is taken)                         |
| Vanguard, Reaver | no duration or cooldown line (minor: few of their builds want one)         |

**Proposed fixes.**

- **Strider reservation:** re-line Clear Head (`bow.home.added.n400`, now 25% maximum mana and 15% regeneration) to
  maximum mana with about 6% reduced reservation. The dexterity class's aura carrier then gets a first line at home,
  and Clear Head's 4.6 units come down (F3).
- **Zealot movement:** put a movement line on Procession (`cathedral` Procession, aura-led since round 3), in place of
  its life; a procession walks. Or put it on Ardour, the striker's notable. This answers the round-3 open question on
  Procession's lead at the same time.
- **Zealot flasks:** two options. Accept the centre's Provisions (6 steps, on the Zealot's ring) as the Zealot's flask
  source and say so (see the missing rule, §3 below). Or put one flask line on the Vigil chain (`cathedral.nave.vigil`,
  recovery: regeneration and shield recharge). The round-3 agent declined the latter for three themes, so I lean to
  the first.

**A fix must not break:** §10.2 (one theme per cluster), §8.6 (3 to 5 units).

### F5. Keystones: a third sit outside the working distances, and the fire keystone is out of reach for two fire builds: consider

All 27 are dead ends (degree 1). Their distances from their own region's start, and the nearest start:

| region   | keystone (own start / nearest start)                                                                                               |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Strider  | Steady Draw **7**/7, Close Quarters 9/9, Plated Hide 10/10, Arrow Weave 11/11                                                      |
| Shade    | Nimble Gambit 8/8, Shade Leech 13/13, Spellslip 16/16, Cruel Agony 18/18, Hollow Vessel 18/18                                      |
| Reaver   | Shieldwall 12/12, Wound Dance 15/15, Crimson Pact 15/14                                                                            |
| Vanguard | Unerring Discipline 11/11, Strongarm 15/10, Rooted Stance 18/18, Blood Rite **24/22**                                              |
| Mystic   | Mind Bulwark 13/11, Mana Bastion 13/12, Prismatic Balance **20**/20, Pain Conduit **21/20**, Fever Pitch **23**/23                 |
| Zealot   | Idle Hands 14/14, Lone Vow 14/14, Living Ward 14/14, Searing Avatar **20**/20, Volatile Servants **20**/20, Sigil Warden **22**/22 |

- **Against the working values.** Seven keystones are beyond 18 steps from every start, and one (Steady Draw) is under 8. §16 calls 8 to 18 a working value, so this is "holds with exceptions", not a failure.
- **The player's problem is uneven distance:**
  - The Strider's four keystones are all 7 to 11 from its start; the Mystic's three elemental ones are 20 to 23.
  - Searing Avatar (`cathedral.pyre`, Ze20, Va21) is listed by three fire archetypes. Only the sceptre striker, who
    lives in the Zealot's west, takes it. The burning caster and the two-handed fire build do not reach it by 160
    points.
  - That is the round-3 "burning caster's west" question again, from the keystone's side.
- **Proposed:**
  - Shorten Prismatic Balance's spur from three smalls to two (`spire.frost`, off `spire.frost.jFire.a`); see F8.
  - Consider pulling Fever Pitch and Searing Avatar two or three steps nearer, or giving the fire caster a cheaper way
    west (the round-3 question).
  - Re-hang Steady Draw (`bow.bows.steadyDraw`) one road node farther, off `bow.bows.road.jb5` if there is one or the
    next junction, rather than adding a spur small, which would add bow supply.
- **Second keystones (§9.3).** Only 14 of the 28 archetypes list a keystone in their wishes, so the allocator cannot
  say whether builds take second keystones. Of those 14, eleven take at least one of theirs and only one build takes two. The three that miss are the burning
  caster and the two-handed fire build (Searing Avatar) and the block caster (Shieldwall). This needs
  walks, not the yardstick.

### F6. The late game's most wanted nodes are other classes' start notables: consider

**What the 120-point plans' last 40 points buy** (the 120 plan less the 80 plan grown from 60):

- **Mostly crossings and far clusters, as §9.3 asks.** In 24 of 28 builds, a third or more of the late nodes are in a
  neighbour's region; the median late node is 12 to 22 steps out for most (10 for the warcry-and-totem and two-handed
  fire builds).
  - The classic caster's late game is the Shade (Shroud, Hoarded Breath, and Hollow Vessel as its keystone), the
    Zealot's far north walk (Tomb Dust, Rood Screen, Vespers) and its own far tips (High Veil, Cold Light).
  - That is the late game the constraints describe.
- **But in 14 of 28 builds the late points themselves take another class's signature or near-start notable, and the
  "gave up at 120" lists of seven more name one:**
  - Hawk's Eye, Quickened Steel, Oathbound, Keen Instinct and Zeal
  - Long Breath, Clear Head, Hedge Magic, Stout Heart, Buckler, Warm Blood and Hymn
  - Warm Blood alone is in five builds' gave-up lists.
- **The cause.** The start notables are the richest generic notables in the network: Quickened Steel 4.9, Buckler 4.8,
  Hawk's Eye 4.7, First Light 4.6, Clear Head 4.6, Warlord's Banner 4.5. Each sits one or two ring steps from the
  next home. So "walk to the neighbour's start and collect its kit" is a common last decision. It is the same decision
  for many builds, which is the opposite of "good late-build decisions".
- **Proposed:**
  - Bring the start notables above about 4.4 units down toward 4. For example, drop Quickened Steel's 6% life (its
    middle road sells life), Buckler's 5% life and Clear Head's regeneration (F3, F4).
  - Keep each one coherent and generic (§6.2).
  - No positions change.
- **Must not break:** §6.2 (the first points stay worth taking), §8.6.

### F7. The Mystic caster's spell damage stops between First Light and Arcane Focus: consider

- From `start.mystic`, after First Light (2), the next spell-damage line is the 8% small `spire.craft.focus.b` at 7 and
  Arcane Focus at 8.
- Steps 5–6 are 57% defence (Warm Blood, Shelter, Firm Footing, plus Waste Not), and steps 7–8 are shield and mana.
- All five Mystic archetypes take two or three of Glass Skin, Deep Well and Warm Blood in their first seven.
- The allocator still reports four to seven near-equal plans for the Mystic builds, and its first 10 points have a
  real fork (spell crit east, mana west, a wand porch), so this is a lean, not a lock.
- **If the fixer wants it:** the focus wheel's entrance small `spire.craft.focus.a` (mana) and its exit
  `spire.craft.focus.c` (mana) make Arcane Focus's side half mana. Making the east road's wheel read spell first and
  the west road's (Deep Well) read shield and mana first would sharpen the fork without adding anything. That is also a
  §8.2 question (mixed smalls on one wheel) for the node-discipline auditor.

### F8. Keystone spur shapes (§9.1): consider

- **Prismatic Balance** (`spire.frost`): its spur is three elemental-damage smalls. Make it two (also F5).
- **Close Quarters** (`bow.flight.closeQuarters.k`): no spur; it hangs off a small on a road. This is the user's choice
  (§16), so it is not a fault.
- **Blood Rite and Sigil Warden** hang from a small that is a junction (`wall.grit.heavyHands.c`,
  `cathedral.crypt.shrine.e`) rather than from a road node. This is acceptable, but note it if those clusters are
  re-laid.
- **Cruel Agony and Hollow Vessel** share one junction (`knife.venom.j5.a`, six links), both 18 from the Shade. A player
  there faces two keystones side by side. This may be intended, as a fork of two Shade trades, but the reference keeps
  keystones apart. Leave it unless the Shade's venom area is re-laid.

### F9. Small notes for other auditors (not counted)

- **Field Dressing.** `yard.home.fieldDressing.n`'s `why` names an exit to Fencer's Eye that no longer exists; it is a
  dead end (F2).
- **The Shade's attack-speed road.** `knife.home.roadB` is four attack-speed smalls from Keen Instinct with no notable
  until the Talon and Fine Point wheel (§8.7, node discipline).
- **The Reaver's start loop.** Both of its sides are offence (melee physical damage and attack speed); its defence comes
  at 3–4 (the life road and two hub pockets). That is the §6.3 pattern not followed, which §6.3 allows. The opening is
  still mixed by step 4, so no action.

---

## 2. The first ten points, walked by hand

**Mystic** (`home-mystic.png`). Point 1 is shield or crit; point 2 is First Light (spell damage, mana, shield) or a hub.
At 3–4:

- **West hub:** Still Mind's mana pocket, the ring toward Waste Not, or the west road (Deft Wand's wand porch at 4–6,
  Warm Blood at 6).
- **East hub:** Sharp Mind's spell-crit pocket, the ring toward Shelter and Firm Footing, or the east road (Warm Blood,
  Arcane Focus at 8).

A caster's 10 points (side, First Light, side, east hub, three roads, two wheel smalls, Arcane Focus) buy two spell
notables. The alternatives are a sustain build (Still Mind, Deep Well, Glass Skin) or a wand attacker (Deft Wand at 6).

- **Chose:** a direction. **Gave up:** the other hub's pocket.
- **No-choice stretch:** the three attribute nodes of each hub road (only the first two have pockets).
- **Nobody skips:** First Light.

Verdict: real choice, coherent, not committing. Spell damage is thin between 2 and 8 (F7).

**Shade** (`home-shade.png`). The sides are evasion and crit; Keen Instinct (crit, evasion, shield) is at 2.

- **North hub:** Spoils (mana, flasks) at 4, and the north road to Quiet Knife (dagger with spells) at 7.
- **South hub:** Soft Step (evasion, movement, dodge) at 4, the ring to the Strider's Hedge Magic (6) and Quick March,
  and the south road to Snakeskin (7) and Nimble Gambit (8).
- **Keen Instinct:** four attack-speed smalls to the Talon and Fine Point wheel (claw or dagger, 6–7).

10 points buy Keen Instinct plus one of: a weapon wheel, the dagger-spell porch, Hedge Magic, or Soft Step with
Snakeskin. Real choice, mixed. The one bare stretch is the attack-speed road (F9).

**Strider** (`home-strider.png`). The sides are attack speed and evasion, and each side already touches a pocket.
Notables by step:

- 2: Hawk's Eye
- 3: Long Breath (life, regeneration), Clear Head (mana)
- 4: Hedge Magic
- 5: Vital Aim (crit), Wayfarer (evasion, resistances), Quick March, Hard Living

10 points buy four notables (Hawk's Eye, Long Breath, Vital Aim and Wayfarer, or Hedge Magic). By 7 a bow build can be
holding Steady Draw.

- **Chose:** little. Each direction is so cheap that the first ten points take most of what is near.
- **Gave up:** almost nothing.

Verdict: real choice exists, but the density blunts it (F3).

**Reaver** (`home-reaver.png`). Both sides are offence; Quickened Steel (attack speed, melee, life) is at 2.

- **West hub:** Stout Heart (life) at 4, and the west road to Killing Pace (5) and Keen Edge (swords, 7).
- **East hub:** Buckler (light shield) at 4, and the second-hand road to Twin Fangs (7) and Fighting Breath (5).
- **Middle road:** three life smalls to Drill Call (warcries, attack speed) at 5.

10 points: Quickened Steel, Stout Heart or Buckler, then a weapon direction (sword, dual wield) or the warcry. Real
choice, coherent, mixed by step 4. The west beyond Stout Heart becomes the defence band of F2.

**Vanguard** (`home-vanguard.png`, `vanguard-near-text.png`). The sides are armour and melee physical damage; Oathbound
(life, melee) is at 2.

- **North hub:** Ringing Blows (melee, enemy stun) at 4, the Banner at 5, and the rampart road (Shield Ram 6, Iron Lungs
  and Elemental Ward 7).
- **South hub:** Quartermaster (flasks) at 4, and the slams road (Bracing 6, Thunderstep 7).
- **Middle road:** three life smalls, then Stone Heart (life) at 8 or the road to the maces (10).

10 points for a mace slammer: Oathbound, Ringing Blows or Quartermaster, then Thunderstep, or the life road to Stone
Heart. Every Vanguard archetype's 60-point plan takes Stone Heart.

- **No-choice stretch:** the middle road, life ×3 and then life again.
- **Kind:** the first ten points are mostly defence and flasks, unless the player turns north for Ringing Blows and
  Shield Ram (F2).

**Zealot** (`home-zealot.png`). The sides are armour and elemental damage; Zeal (elemental, defences, life) is at 2.

- **West hub:** the Vanguard's Warlord's Banner (a deliberate near crossing, `cathedral/home.ts`) at 3, and the west
  road to Ardour (elemental attacks) at 5.
- **East hub:** Hymn (mana) at 4, and the east road to the junction `cathedral.home.jT.a` (5), then Hearthfire (fire,
  cast speed) at 7 or Choirmaster and Shepherd (8).
- **Middle road:** three life smalls to the nave wheel (Iron Faith, shield, at 6).

10 points for a striker: Zeal, Ardour, the Banner. There is a real choice of fire attack, shield or aura.

10 points for a lightning caster: Zeal, Hymn or Hearthfire, then Vigil. No spell notable that is not fire, and no
choice between spell directions.

Verdict: the striker and the aura carrier are served; the caster is not (F1).

---

## 3. What is good (keep it when fixing)

- **Every start fans out.** Each start reaches a signature notable and two hubs at step 2, and each hub has three or
  four exits (a pocket, the ring, one or two roads). No start is a single chain (§6.5).
- **First notables.** Apart from the signatures at 2 (allowed by §6.3), the first notables are at 3–4 everywhere
  (§6.5).
- **No weapon is named within three steps of any start.** The nearest are wand smalls at 4 (Mystic), a claw small at 5
  (Shade), a one-handed and a shield small at 5 (Strider) and a sword small at 5 (Reaver). The exception is the
  Reaver's Buckler shield-block small at 3, an optional pocket (§6.3–4).
- **The Shade's and the Strider's first eight steps mix offence and defence well:** 47% and 45% offence by units over
  steps 1–8 (§4.8).
- **The centre holds generic sustain and utility only (§4.7).** It has eight arches of 3.0 to 3.6 units: resistances,
  stun protection, movement, life on hit, all attributes, chaos resistance, flasks and mana cost. Each bridges two
  ring nodes and is 5 or 6 steps from its two homes. None is offence, so none narrows a start.
- **The four new arches** (Firm Footing, Hard Living, Sound Body, Waste Not) each sell something both their homes lack
  near the start.
- **Varied defences (§4.5).** Every region sells life, resistances, its class's own defence and at least two of block,
  dodge, stun protection, recovery and maximum resistances (supply table).
- **The late game lives where §9.3 says it should, for most builds.** See F6's first point. Two examples are the
  classic caster and the curser.
  - Four builds' late points stay mostly at home: mace and shield (39 of 40 nodes, median 14 steps out), dagger crit
    (92%), the channeller and the sceptre striker (83%).
  - That is because the grown regions no longer run out by 120. Mace and shield's armour and life still climb past
    120, so its home is not a finish line.
- **Keystones.** Every one is a dead end, and 23 of 27 hang off a road junction one or two smalls out. Most builds that
  list a keystone take it (11 of 14).

## 4. Missing rules (proposed wording)

1. **§6, a convergence check** (from F1): "When most of a class's natural builds open with the same notables (the
   allocator's 60-point lists are the check), the home has made the choice for them. Each home offers each kind of
   build that starts there at least two directions within its first eight or so points." A check that says where to
   look, not a placement rule; the user decides whether it belongs.
2. **§4.6, a clarification** (from F4): "A centre arch on a home's ring counts toward that home's supply of the generic
   lines it sells." Without it, the Zealot's flasks and the Vanguard's after F2 read as missing when the Provisions arch
   is 5–6 steps away; with it, a region may lean on its ring.
3. **§9.1, an idea, not a rule:** a region's keystones should not all sit at one distance. Some near for an early
   identity and some far as second keystones, rather than one region's four at 7–11 and another's at 20–23. Offered
   for the user to accept or strike (§14 warns against restrictive inventions).

## 5. Checklist

| item                                                                                    | verdict                                                                                                                                                                                                       |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| §4.5 varied defences in every region                                                    | holds                                                                                                                                                                                                         |
| §4.6 every region sells what most builds want                                           | holds with exceptions: the Zealot (flasks, movement, attack speed), the Strider (reservation), the Vanguard (crit) (F4)                                                                                       |
| §4.7 the centre holds generic nodes only                                                | holds                                                                                                                                                                                                         |
| §4.8 no large all-defence or all-offence stretch near a start                           | holds with exceptions: the Vanguard–Reaver band and the Vanguard's life road (F2); the Zealot's first steps lean to utility (F1); the Mystic's 5–6 band leans to defence (F7)                                 |
| §6.2 the first points give a real choice, are coherent, commit to nothing               | holds with exceptions: the Zealot's casters (F1); the Strider's density blunts its choice (F3)                                                                                                                |
| §6.3 starts interesting and not prescriptive (the pattern)                              | holds; the Reaver's loop is offence on both sides (allowed); the Strider's sides carry pockets (F3)                                                                                                           |
| §6.4 specific porches optional                                                          | holds: Deft Wand, Buckler, Quiet Knife, the Banner                                                                                                                                                            |
| §6.5 first notables 3–4 out, fanning out before then                                    | holds (signatures at 2 by §6.3); the Strider's at 3 are within the letter (F3)                                                                                                                                |
| §9.1 27 keystones, spurs of one or two smalls off a junction, dead ends; distances 8–18 | holds with exceptions: Prismatic Balance has three smalls; Close Quarters has none (the user's choice); seven keystones lie beyond 18 and Steady Draw is at 7 (F5, F8)                                        |
| §9.2 a keystone is a trade the sheet shows                                              | not re-checked (the keystones without a cost are already listed in §16)                                                                                                                                       |
| §9.3 good late-build decisions                                                          | holds with exceptions: the late game is mostly crossings and far clusters, but half the builds' late wants include neighbours' start notables (F6); second keystones cannot be measured by the allocator (F5) |
