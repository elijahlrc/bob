# G4 audit round 1: builds

Auditor for the builds subset: G-growth §1 (the measure), the agreed targets of `G0-baseline.md` ("Stop 1"), and the
parts of CONSTRAINTS that the measure reads (§1.1, §5.1, §5.3, §7.4, §9.3, §12.3, §15.2). The network is commit
3b2affe: 1,389 live nodes, `edits.json` empty. This audit only reads. Nothing in `src/`, `scripts/` or the plan docs was
changed. Area labels are ignored, as the user asked.

**Runs and comparisons.**

- I ran `npm run passives:builds -- --json` on the whole tree, with 28 archetypes, spell-totem included. Every one of
  the 27 old archetypes comes out identical to `G3/r3/builds.txt`, number for number: 3b2affe touched no file in
  `src/data/passives/`. So `G3/r3/builds.txt` is this round's printout, plus spell-totem.
- The baseline is `G0/builds-base.json`. G3 round 1 (2a333a7) re-measured the G0 tree with the weapon weights, so the
  baseline uses today's unit prices. Two things changed after it:
  - Fervour weights were added to the attack bundle in round 2.
  - Three family key lists were changed: bow crit gained `weaponCrit:bow`, totems gained `totemSpeed`, and the maces
    gained `weaponDamage:mace`.
  - For those families, base-to-now is close but not exact.
- **Curves that dip from 100 to 120 are not regressions.** Examples are sword-str life (23.2 → 20.8 units), caster-es
  cast speed and trap-mine ES. The 60 → 100 columns grow the 60-point plan; the 120 column is a fresh best plan, and it
  can hold less of one stat.

**Pictures** ([builds/](builds/)): `block-caster.png`, `sceptre-fire.png`, `two-hand-fire.png`, `bow-elemental.png`,
`trap-mine.png` and `sword-str.png`, made by the tool's `--pics`. Yellow is the best 60-point plan, orange is what the
best 120-point plan adds, and red rings are what 40 more points would add.

**Scratch probes** (in the session scratchpad, not the repo):

- a walk printer: the plan in step order, with value, region and lines;
- a flat-stat classifier: the network's supply of each main family, the share the 120-point plan holds, and the
  nearest untaken notables that carry it;
- a fresh-solve probe (the allocator's own search at 160 points, not grown from the 120-point plan);
- a weights audit (lines and keystones no archetype weighs);
- a gear check;
- an in-memory trial of the re-line in finding 1. The trial is a yardstick test, not a placement.

## 0. Against the targets

| target (G0 Stop 1)                                             | G0 base           | G3 r3 = now (27)  | now, 28 with spell-totem                | verdict                           |
| -------------------------------------------------------------- | ----------------- | ----------------- | --------------------------------------- | --------------------------------- |
| 1. At 120, the typical main stat's gain from 40 more points    | 16%               | 23%               | **23%** (aim ~30%+)                     | fails, improving                  |
| 1. Main stats gaining 10% or less                              | 37%               | 24%               | **23%** (aim ~10%)                      | fails                             |
| 1. Archetypes whose every main stat gains 20% or more          | 1                 | 2                 | **2 of 28** (aim ~2 in 3)               | fails (see below)                 |
| 2. At 60, the typical main stat; flat ones                     | 45%; 20%          | 52%; 9%           | **52%; 8%**                             | holds                             |
| 3. At 120, notables worth 2.5+ that 40 more points add         | typ. 1, 8 at zero | typ. 3, 0 at zero | **typ. 3, 0 at zero**                   | holds                             |
| 4. At 120, choice                                              | 8 at 1, 12 at ≥3  | 1 at 1, 20 at ≥3  | **1 at 1 (block-caster), 21 at ≥3**     | holds with one exception          |
| 5. At 120, tax                                                 | 34%, 14 over ⅓    | 31%, 10 over ⅓    | **32%, 11 over ⅓**                      | holds with exceptions             |
| 6. One stat at a time (no target; the aim is roughly the same) | §3 below          |                   | spell damage ×1.7–2.3, ES and armour up | **the aim is missed** (finding 1) |

Target 1's third line looks worse than the shape it hides:

- 14 archetypes have exactly one main stat under +20%, and 2 have none. At G0, 4 had one and 1 had none.
- So the typical grown build has finished one specialization (its weapon or mechanic) by 120 and is still hungry
  for everything else.
- The archetypes with three flat main stats are caster-life, two-hand-fire and sceptre-fire.

Choice at 60 also improved: 7 builds have a single plan, against 11 at G0. Axe-bleed went the other way, from 3/5 to
1/2 at 60/120.

**Flat from 60 to 100** (target 2's 8%). Nine main stats gain 10% or less when the 60-point plan grows by 40:

- sword-str's attack speed (6.2 → 6.2). Its speed comes with the sword clusters it reaches later.
- warcry-totem's totems (5.7 → 5.7). The near totem supply is held at 60; Graven Posts is a later direction.
- bow-elemental's elemental attacks (6 → 6). Elemental Fletching only (finding 7).
- caster-life's spell crit (8.4 → 8.4). The spell crit near the Mystic start is held at 60.
- summoner's minions (19.7 → 21.7, +10%). The near minion clusters are held at 60.
- wand-attack's wand damage (12.7 → 12.7).
- staff-block's block (8.5 → 8.5).
- two-hand-fire's two-handed damage (9 → 9). Its generic line (finding 4).
- block-caster's spell block (5 → 5). Finding 2.

Most are the specializations that also finish by 120 (§2), reached earlier. Five are flat at both budgets:
bow-elemental's elemental attacks, caster-life's spell crit, staff-block's block, two-hand-fire's two-handed damage
and block-caster's spell block.

---

## 1. Findings, most important first

### 1. Three new spell clusters are every caster's, not a partner's: their smalls contradict their own reasons — **must fix**

**Why it is a must.** Picking Keen Verse, Piercing Word or Living Verse is not picking a partner (CONSTRAINTS §5.1).
Their smalls are plain spell damage, so every caster takes all three, whatever the cluster's stated partner. The
per-stat jump below is the evidence and the ledger's own trigger for a G4 trim. It is not the reason, since power is not
a target (G-growth §0).

**What.** At 120 points, the casters' plain spell damage went from 102–134% at G0 to 208–268%:

| build         |  G0 | now |
| ------------- | --: | --: |
| dagger-caster | 126 | 268 |
| curser        |   – | 264 |
| caster-life   | 118 | 250 |
| fire-burn     | 126 | 248 |
| block-caster  | 108 | 240 |
| channeller    | 102 | 234 |
| caster-es     | 126 | 218 |
| storm-caster  | 116 | 212 |
| staff-block   | 134 | 208 |
| aura-brand    |  76 | 136 |

Five of the ten builds that report spell damage still gain under 20% past 120. Plain `spellDamage` in the network grew
from about 25 units to 62, against a node count up by 38%.

This is G-growth §4's "strength by the back door". The ledger's §8.1 said: "If the per-stat report shows a jump, G4
trims prices; it does not remove choice."

**Where the jump came from.** Three G3 clusters that every caster takes, all in the Mystic:

| cluster                                   | lines                                                                         | steps from the Mystic start | caster plans that take it at 120 |
| ----------------------------------------- | ----------------------------------------------------------------------------- | --------------------------: | -------------------------------: |
| Keen Verse (`spire.craft.keenVerse.*`)    | notable spellDamage 20 + spellCritMulti 18; smalls `a`–`d` spellDamage 8 each |                          17 |                          9 of 11 |
| Piercing Word (`spire.frost.piercing.*`)  | notable spellDamage 20 + elePenetration 3; smalls `a`–`c` spellDamage 8 each  |                          19 |                          9 of 11 |
| Living Verse (`spire.well.livingVerse.*`) | notable spellDamage 20 + life 8; smalls `a`, `b` spellDamage 8 and `c` life 5 |     20 (18 from the Zealot) |                         10 of 11 |

- The three clusters hold 132% spell damage between them. That is more than the whole rise of any caster: +60 to
  +142 points.
- Arcane Focus, an older cluster 8 steps from the Mystic start, is in all 11 caster plans.
- On ES, Composure (`spire.well.composure.*`: notable es 15 + stunAvoid 20; smalls `a`–`c` es 5) is new. It is in all
  9 ES builds' plans. ES at 120 rose:

  | build        | G0      | now     |
  | ------------ | ------- | ------- |
  | caster-es    | 157 +15 | 212 +15 |
  | summoner     | 189 +15 | 249 +15 |
  | wand-attack  | 130     | 179     |
  | block-caster | 77 +15  | 148 +15 |

- The partner each cluster's own reason names is not what its smalls give:
  - Keen Verse's reason (`spire/craft.ts`) says "the crit caster's spell damage".
  - Living Verse's (`spire/well.ts`) says "the life caster's own pair".
  - In both, the smalls are plain spell damage. So every caster takes the cluster, and picking it is not picking a
    partner (CONSTRAINTS §5.1: "Picking the cluster is picking the partner"). The generic stat has become a
    destination (§5.3: generic stats are "lines on many notables, never as one destination").

**Fix.**

1. **Re-line the smalls to the partner each cluster's reason names.** Keep the notables and their units (§8.6) and
   keep every section uniform (§8.2):
   - `spire.craft.keenVerse.a`–`d` → `spellCritMulti(12)`: the crit caster's cluster, as its reason says.
   - `spire.frost.piercing.a`–`c` → `eleDamageAll(10)`: the elemental caster's.
   - `spire.well.livingVerse.a`, `b` → `life(5)`: the life caster's pair, as its reason says.
2. Re-measure. Composure is next only if ES still reads as a jump afterwards (its smalls could carry avoid stun, its
   partner). Don't trim it first: finding 4 shows the measure prices stun avoidance at zero.

**Trial** (in memory, the same allocator, eight casters). Re-line 1 brings spell damage at 120 back to 140–186%, from
208–268%.

The trial grows the 120-point plan to 160 in one 40-point step, where the tool grows it 20 points at a time. So its
before and after columns compare with each other, but not with the tool's printout: for caster-es, the tool's 160 is
294, against 338 here.

| build        | spell damage at 120 → 160, before | after     |
| ------------ | --------------------------------- | --------- |
| caster-es    | 218 → 338                         | 186 → 282 |
| caster-life  | 250 → 302                         | 178 → 230 |
| storm-caster | 212 → 312                         | 140 → 260 |

- Choice holds or rises: staff-block 4 → 7, storm-caster 5 → 6, caster-life 6 → 6. Caster-es falls 7 → 4.
- Spell crit and elemental damage rise where the partner is wanted: caster-life's spell crit goes 13.4 → 17.4 units.
- Block-caster does not recover (finding 2).

**A fix must not break:**

- §4.6: the Mystic still sells spell damage in Arcane Focus, First Light, Sharp Mind, Long Chant, Homily and Hedge
  Magic nearby.
- §8.2 and §8.6.
- §10.1: the vocabulary gets wider, not narrower.
- §14: no node moves. The reason for each re-line is the cluster's own stated partner, not the number.

**Consider, same family:** armour for the Vanguard builds rose too. At 120, mace-slam went 218 → 326%, mace-shield
162+40 → 278 and two-hand-fire 218 → 398. Iron Voice (`wall.grit.ironVoice.*`) and Mended Mail (`yard.blades.mail.*`),
both new with four and three armour smalls, are in 6 of the 7 armour builds' plans. The same treatment, smalls toward
the notable's partner (warcry effect, life regeneration), is the candidate if G5's per-stat check calls it a jump.

### 2. The shield caster stopped being one: block-caster has one plan and its block went 23 → 10.5 units — **should fix**

**What.** At G0, block-caster's 120-point plan went south-east for shields:

- It took Buckler, Steel Rim, Scarred Hide and the Shieldwall keystone.
- That gave 46% shield block, 23 units, and 31.5 units at 160.

Since G3 round 1, the plan goes north into the Mystic instead (walk A): 65 of its 120 points are there. Block is 10.5
units (shieldBlock 18%, blockAttack 3%), and it stays flat from 100 to 160. Spell block is 7.0, flat. Choice at 120
is 1, the only single-plan build. Its two identity stats, which lead its `main`, are the two it gives up.

**Why.**

- The Zealot's own attack block is used up by step 15: Iron Faith (6 steps from the start), Frozen Font's three block
  smalls (12) and Quarterstaff's 3% (14).
- Every other shield-block notable sits in another class's home, 14 to 22 steps from the Zealot start: Bracing 14,
  Buckler 16, Locked Shields 19, Steel Rim 20, Round Shield 22, and the Shieldwall keystone 22.
- Since round 1, the new spell clusters of finding 1 outbid that trip.
- The finding-1 trial alone does not bring the shields back (block stays 10.5), so this is geography.

**Fix.** A shield-block cluster for casters on the Zealot side of the Zealot–Vanguard seam:

- **Where:** beyond Frozen Font, about 15 or more steps from the Zealot start, in the Scar Tissue–Stagger gap that
  `G3/borders.md` §6 hands to G4 as a seam needing a cluster.
- **Partner:** one a caster weighs against its spell damage, such as shield block with cast speed, or shield block
  with mana on block. Not ES (Glass Wall and Rood Screen already pair spell block with ES), and not spell damage with
  ES (the convergence rule).
- **A fix must not break:**
  - §6: not within about 10 steps of either start. The empty disc the looks audit found at (−1505, −25) is 3 to 6
    steps from both starts, so it is the wrong spot.
  - §5.2: at least 5 steps from Iron Faith, Frozen Font, Glass Wall and Locked Shields.
  - §9.1: Idle Hands' spur stays a dead end.
  - §13.1: no new home-to-home shortcut.
- **Also re-check the weights:** block-caster weighs spell block at 0.6, through the SHIELD bundle, while staff-block
  weighs it at 1 (finding 4).

### 3. The allocator ignores gear, so hybrid plans at 120 cannot wield their weapon — **should fix (the measure)**

**What.** Attributes are worth nothing to the allocator, which is right for the tax. But nothing makes a plan meet its
gear. At 120 points:

| build        | supplied at 120 | gear asks |
| ------------ | --------------- | --------- |
| fire-burn    | str 28          | 100       |
| storm-caster | str 43          | 100       |
| block-caster | str 64          | 100       |
| spell-totem  | str 64          | 100       |
| staff-block  | str 100         | 120       |
| dagger-crit  | int 58          | 100       |
| dodge-blades | int 62          | 90        |
| claw-poison  | int 80          | 100       |
| sceptre-fire | int 88          | 100       |

Most of these were short at G0 too: fire-burn had 41 str, dodge-blades 56 int. So this is not a growth regression. But
it means the Zealot casters' measured plans, which take 12 to 16 Mystic notables (`G3/borders.md` §2.6), are plans a
player could not wield.

This bears on CONSTRAINTS §7.4: "a hybrid gets both attributes along every natural path". The Zealot caster's natural
path into the Mystic gives intelligence only. The measure cannot say whether that is a tree problem until plans have
to pay for strength.

**Fix (tool, `scripts/passives/builds.ts`).** Value an attribute line at a small weight per point of shortfall until
`gear` is met, then zero. Keep the tax counting those nodes as worth nothing, so target 5 does not change meaning.

- Then re-measure the Zealot casters and the Shade attackers.
- Their spell-damage numbers, their Mystic shopping and their choice will move. Finding 1 should be judged on the
  corrected numbers.
- **A fix must not break:** the archetypes stay a yardstick (§14). Valuing attributes inside gear is a player's
  necessity, not a placement reason.

### 4. Weights that misjudge clusters: whole line families are worth nothing to every archetype — **should fix (the yardstick)**

The weights audit lists 35 line keys in the network that no archetype weighs, and 30 notables worth under 1.5 units
to every archetype. The ones that bend findings:

- **Tagged crit lines.** trap-mine weighs `critChance` (0.5) but not `critChance:trap`, so Hair Trigger (`bow.rim.hairTrigger.n`) is
  priced at half. `critMulti:mine` is unweighted, so Shaped Charge is priced at half. `critChance:brand` is unweighted
  for aura-brand. The Strider's trap fork was placed as the trapper's late direction (G1 ST-6), and the measure sees
  half of it, which feeds trap-mine's flat trap damage (§2) and the borders pass's "unused by trap-mine".
- **Grit and insight** are the Vanguard's and the Mystic's charges: grit gives physical reduction and resistances,
  insight gives crit chance (`src/calc/charges.ts`). Their lines (`maxGrit`, `gritOnHitTaken`, `lifeRegenPerGrit`,
  `gritDuration`, `maxInsight`, `insightOnCrit`, `insightDuration`) are weighed by nobody, while fervour is weighed at
  0.3 in the attack bundle. As a result Unbroken (`wall.grit.unbroken.n1`), Scar Tissue (`wall.resists.scarTissue.n`)
  and Flashes of Insight (`spire.craft.insight.n`) are worth 0 to everyone, and Glint is priced at half.
- **Stun and recovery defences.** CONSTRAINTS §4.5 names stun among the varied defences, yet these lines are worth 0:
  `stunAvoid` (8 nodes, 8.3 units), `stunRecovery`, `shieldStunAvoid`, `avoidAilments`, `esOnHit` and `esLeech`.
  Composure and Shroud are part-priced, and Firm Footing (`centre.inner.firmFooting.n`) and Siphon (`spire.frost.siphon.n`)
  are worth 0.
- **Generic offence nobody weighs:**
  - `damageOnFullLife` and `critOnFullLife` (Unbloodied, worth 0);
  - `damageVsLowLife` (Killing Eye), `doubleDamage` (Telling Shot) and `cullingStrike` (Executioner);
  - `ailmentEffect` and `freezeDuration` (Harsh Weather, 0.3 at best);
  - `meleeRange` (Ground Shaker, Long Reach).
- **A matcher bug.** `fn:*` never matches an untagged line, because `weightOf` only tries the wildcard when the key has
  an argument. So the LEECH bundle's `lifeOnHit:*` misses Hard Living's untagged `lifeOnHit 8`, which is worth 0 to
  every leech build.
- **Dead keys.** The `weapon()` bundle adds `weaponDamage:<w>` for sword, axe, bow, dagger, claw, staff and wand, which
  the network never uses: it writes `swordDamage`, `bowDamage` and so on. Only `:sceptre` and `:mace` match. This is
  harmless, but it reads as if those weapons were weighed twice. `poisonDuration` (bow-poison, claw-poison) is absent
  from the network.
- **two-hand-fire weighs no weapon.** Its "two-handed damage" is the generic `twoHandDamage` line alone: 14.8 units in
  the whole network, 91% of it held at 120. A two-handed player swings a mace, an axe or a sword, so the flat stat is
  partly the yardstick's.

**Fix (`scripts/passives/archetypes.ts`):**

- Add `critChance:*` and `critMulti:*` beside the plain keys wherever crit is weighed (trap-mine, aura-brand, the
  crit builds).
- Add a grit set (about 0.3) to the strength defence builds and an insight set (about 0.3) to the crit casters and
  dagger-crit, as fervour is to attackers.
- Add a small defence bundle (`stunAvoid`, `stunRecovery`, `avoidAilments` at about 0.2–0.3) to every build, and ES
  recovery (`esOnHit`, `esLeech`) to the ES builds.
- Make `weightOf` try `fn:*` for untagged keys.
- Drop the dead keys.
- Give two-hand-fire one weapon's lines at about 0.6, or say in its `want` that it is weapon-agnostic.

**Consequence to say out loud:** a weights change moves every number. The base cannot be re-measured without the G0
tree. If the weights change between rounds, stop 4 compares G4-r1 with G4-end, and the base stays as context.

**A fix must not break:** §14 (the weights describe a player's wishes and never place a node) and G-growth §0 (no
power number).

### 5. Fifteen of the 27 keystones are weighed by no archetype, so second keystones are invisible — **should fix (the yardstick)**

These keystones have no archetype that would take them:

- Unerring Discipline, Plated Hide, Mind Bulwark, Close Quarters, Crimson Pact, Fever Pitch, Pain Conduit
- Prismatic Balance, Living Ward, Shade Leech, Strongarm, Cruel Agony, Mana Bastion, Arrow Weave, Blood Rite

None of them is in any plan at any budget. CONSTRAINTS §9.3 places the late game "in the crossings, in second
keystones and in neighbours' areas", and the measure only sees one keystone for most builds.

**Fix:** name, per archetype, the keystones a player of it would weigh, with a worth in units. Plausible pairs, for
the keystone texts in `src/data/tree/keystones.ts`:

- Crimson Pact for the leech melee builds (sword-str, axe-bleed);
- Mana Bastion and Mind Bulwark for the channeller and caster-life;
- Pain Conduit for caster-life;
- Arrow Weave for the bows;
- Unerring Discipline for mace-slam;
- Cruel Agony for the poison builds.

### 6. The specializations a build finishes by 120, and the fire attackers' life-only late game — **consider (for the user)**

The main stats flat past 120 are classified in §2. Five are **supply**: the build holds every cluster of the family.

- **sword-str's sword (90% of the network):** all seven sword clusters are in its 120-point plan, in three regions,
  9 to 30 steps out: Keen Edge, Light Blades, Darting Steel, Bloodied Edge, Sword and Board, Greatblade and Fleet
  Blade (`sword-str.png`).
- **axe-bleed's bleed (96%):** all six bleed clusters (Open Veins, Hewing, Executioner, Lasting Wounds, Deep Cuts,
  Barbed Arrows).
- **sceptre-fire's sceptre (64%):** Verger, Gilded Rod and Brazier, and the maces near its road.
- **caster-life's spell crit (73%):** only Glint is left, 16 steps from its plan.
- **two-hand-fire's generic two-handed line (91%):** see finding 4.

Each of these builds pays for it, and the walks show what with:

- sword-str holds 104% life at 120 and gains +82% by 160;
- sceptre-fire holds 112% and gains +75%;
- two-hand-fire holds 132% and gains +56%.

So no build takes all of the user's three (all the life, all the armour, all the weapon damage). But for sceptre-fire
and two-hand-fire, **40 more points buy only life:** fire attacks, sceptre and armour gain 0%, and two-handed damage
gains 0% (walks B and C). Between them they hold the strength side's fire-attack clusters:

- sceptre-fire takes Ardour, Hallowed Hammer, Hot Iron and Kindled Steel, and leaves Bellows, 18 steps from its plan;
- two-hand-fire takes Ardour, Hot Iron, Bellows and the Reaver's Elemental Edge, and leaves Hallowed Hammer (5, a
  mace notable) and Kindled Steel (13).

The rest of the fire-attack supply is on the dexterity side, 11 to 21 steps from their plans:

- Elemental Fletching, 15 to 16;
- Pitch Arrows, 11 (two-hand-fire) to 20 (sceptre-fire);
- Bright Wand, 13 to 16;
- Bright Shafts, 21.

This is a judgement for the user, not a fix I can justify from the player's seat alone. Is a weapon specialization
finished at 120 acceptable when the build paid for it with life? The Reaver r3 report asked the same about bleed, dual
wield and the sword. A third or fourth cluster added only to lift the curve would be supply for the number's sake
(§14, G-growth §3).

If the user wants a late direction for the strength-side fire attacker, the place is the Zealot's far west, which
`G3/borders.md` §2.3 hands to G4 as an internal loop: Wake, Brazier, Buttress and Thunder Peal. The partner there
should be one the build must weigh against life, not a sceptre with life (that is the convergence rule).

### 7. The elemental bow is the crit bow with one elemental notable — **consider**

At 120, bow-elemental shares 97 of 121 nodes with bow-crit. It differs by Elemental Fletching, Cold Steel (Shade, 26
steps), Sea Legs, Buckler and Fighting Breath.

- Its identity stat, elemental attack damage, is 6 units flat from 60 to 100 and 10 units flat from 120 to 160. That
  is 17% of the network's 57.8 units.
- The south's elemental clusters stay untaken at every budget: Pitch Arrows (12 steps from the start), Stormstruck
  (16), Elemental Edge (17), Live Wire and Bright Shafts (23).
- The fresh solve at 160 reaches only 15.4 units, so the plan's shape is not locking them out.
- The yardstick prices an elemental-attack small at 1 unit, the same as a 5% life small. The south costs 6 to 10
  points per cluster, against life and evasion within 3 to 9.

**Judgement:**

- This is a trade by the yardstick. The Strider r3 agent moved Bright Shafts a step nearer and nothing changed.
- From the player's seat, an elemental bow at 100 to 120 points would walk south for Bright Shafts and Live Wire
  before a ninth life notable.
- So the finding is about what the measure can say. Before any node moves, ask the user whether the identity stat of
  a build should be weighed above its defences. Weighing it higher would change many curves at once (finding 4's
  consequence).

### 8. One-stat jumps outside spells, and life for the strength builds — **consider (report for G5)**

**Life at 120 fell for the strength builds:**

| build         |  G0 | now |
| ------------- | --: | --: |
| sword-str     | 214 | 104 |
| two-hand-fire | 231 | 132 |
| sceptre-fire  | 191 | 112 |
| axe-bleed     | 188 | 131 |
| mace-slam     | 238 | 176 |

It rose for the bows and two Zealot builds: bow-poison 161 → 198, aura-brand 145 → 170, fire-burn 167 → 179.

**Evasion** is roughly level for the bows and up for the Shade builds (dagger-crit 268 → 332, dodge-blades 256 → 343).

The strength builds now trade life for their weapon and armour, which is the tension the user asked for. The armour
jump is in finding 1's note. Nothing else to fix here: this is target 6's report.

### 9. Notables no archetype reaches at any budget, and builds the set lacks — **consider**

47 notables and keystones are in no plan at any budget. Fifteen of them are the unweighed keystones (finding 5), and
seventeen are worth less than 1.5 to everyone (finding 4). The rest are valued at 2 or more by some archetype, but they lie
far from it:

- Spellsword (`yard.blood.spellsword.n`, 4.1 to channeller)
- Marked Prey (`yard.fosse.marked.n`, 4.0 to curser)
- Bright Shafts and Stormstruck
- Round Shield (2.5 to mace-shield, 7 steps from the Strider start)
- Ceaseless Blades, Fencer's Eye
- Hair Trigger, Shaped Charge and Snare Line
- Whetted Will, Killing Eye, Rimed Steel, Live Wire, Battle Hymn

Several were built for hybrids the set does not hold: a Reaver spellblade (Spellsword), a curse attacker (Marked Prey),
a channelled attacker (Ceaseless Blades), a dexterity sword and shield (Round Shield, Fencer's Eye). The user left the
set to be maintained, and G0 and the borders pass each added builds it missed.

**Consider** two or three more archetypes, chosen to judge those clusters:

- a Reaver or Strider spellblade;
- a curse attacker;
- a dexterity sword and board.

This does not enumerate builds as a design basis (§14). It only lets the yardstick see clusters that were placed for a
reason.

### 10. Mid-run: Footwork in six 60-point plans — **consider (for the starts and trade-offs auditors)**

Footwork (`yard.dual.footwork.n`, Reaver, 7 steps from the Strider start) is in the 60-point plans of six builds: the
three bows, dual-wield, dagger-crit and claw-poison. Four of those six have a single plan at 60. This is
`G3/borders.md` §6 item 3, still open. I note it so the subset that owns §6 and §5.5 can weigh it; I do not propose a
move from the builds data alone.

---

## 2. Main stats flat past 120 (gain of 10% or less from 120 to 160), and why

Columns:

- **share** is the share of the network's supply of the family that the 120-point plan holds.
- **nearest untaken** is the nearest notables that carry the family, by steps from the 120-point plan, with their
  worth to the build.
- **supply** means the build holds the family's clusters.
- **trade** means wanted supply lies within reach, and the build buys something else.
- **geography** means the rest lies 12 or more steps away in another class's area.
- **yardstick** means the measure misprices it (finding 4).

| archetype     | stat (units at 120 → 160)     | share | nearest untaken (steps from plan, worth)                                       | verdict                                                |
| ------------- | ----------------------------- | ----: | ------------------------------------------------------------------------------ | ------------------------------------------------------ |
| sword-str     | sword damage 46.1 → 48.1      |   90% | none that is a sword notable                                                   | supply; pays with life (finding 6)                     |
| axe-bleed     | bleed 29.3 → 29.3             |   96% | Festering 4 (1.3, a poison notable)                                            | supply                                                 |
| sceptre-fire  | sceptre damage 16.7 → 16.7    |   64% | Light Blades 13, Light Hand 17 (one-handed)                                    | supply (the three sceptre clusters held)               |
| caster-life   | spell crit 13.4 → 13.4        |   73% | Glint 16 (2.0)                                                                 | supply                                                 |
| two-hand-fire | two-handed damage 13.5 → 13.5 |   91% | Greatblade 5 (1.3: its sword half is unweighed)                                | supply of the generic line; yardstick                  |
| block-caster  | block 10.5 → 10.5             |   24% | Locked Shields 12, Bracing 14, Buckler 16, Steel Rim 20                        | geography (finding 2)                                  |
| block-caster  | spell block 7.0 → 7.0         |   32% | Warding Staff 5 (1.2, staff), Buttress 13, Stone Ward 24                       | geography; yardstick (weight 0.6)                      |
| sceptre-fire  | fire attack 20.0 → 20.0       |   39% | Bright Wand 13, Elemental Edge 15, Bellows 18                                  | geography (the strength side mostly held)              |
| two-hand-fire | fire attack 21.4 → 21.4       |   42% | Hallowed Hammer 5 (2.0), Pitch Arrows 11, Kindled Steel 13                     | geography (a trade for Hallowed Hammer)                |
| bow-elemental | elemental attack 10 → 10      |   17% | Pitch Arrows 6, Elemental Edge 7, Stormstruck 9, Bright Shafts 10              | trade by the yardstick (finding 7)                     |
| trap-mine     | trap and mine 13.7 → 13.7     |   53% | Snare Line 5 (2.0), Hair Trigger 13, Shaped Charge 13                          | trade for ES; yardstick (the tagged crit is unweighed) |
| mace-shield   | mace damage 16.7 → 16.7       |   66% | Hallowed Hammer 6 (1.4: fire mace)                                             | trade (partner not wanted; Vanguard r3 §1)             |
| bow-elemental | bow damage 20.2 → 22.2        |   52% | Quiet Shot 8, Bright Shafts 10, Telling Shot 12                                | trade                                                  |
| caster-life   | elemental damage 21.6 → 23.2  |   55% | Shattering Rite 3, Gilded Rod 4, Static Edge 7 (their leads are other builds') | trade                                                  |
| wand-attack   | attack speed 17.0 → 17.0      |   44% | Light Hand 3, Quickened Steel 9, Hot Pursuit 12                                | trade                                                  |
| dual-wield    | dual wield 17.0 → 18.0        |   57% | Paired Steel 8 (3.0), Feint and Cut 11                                         | trade                                                  |
| staff-block   | block 13.5 → 13.5             |   69% | Rood Screen 11 (3.4), Stone Ward 24                                            | trade                                                  |
| aura-brand    | auras 22.0 → 22.0             |   62% | Battle Hymn 7, Procession 9 (4.0)                                              | trade                                                  |
| dagger-crit   | crit 26.3 → 27.3              |   64% | Crossed Blades 5, Killing Eye 6, Fencer's Eye 10 (other weapons)               | trade                                                  |
| trap-mine     | evasion 33.3 → 33.3           |   63% | Field Kit 10, Guarded 12                                                       | trade for ES                                           |
| two-hand-fire | armour 35.2 → 38.8            |   74% | Iron Liturgy 4, Locked Shields 4, Consecrated Plate 6                          | trade (already 398%)                                   |
| sceptre-fire  | armour 24.2 → 24.2            |   51% | Iron Liturgy 5, Two Fists 6, Guarded 9                                         | trade for life                                         |
| dodge-blades  | blade damage 15.0 → 15.0      |   57% | Long Knives 8 (2.6), Between Ribs 13                                           | trade                                                  |

Near-flat (11–15%), not in the table:

- curser's chaos and damage over time (90% of the network; supply);
- summoner's minions (75%; supply in effect, with Bad Company 2.6 the last);
- the spell damage of caster-life, channeller, dagger-caster and spell-totem (finding 1);
- storm-caster's lightning.

**The fresh-solve check.** A fresh 160-point solve differs little from the grown one for block-caster, trap-mine and
two-hand-fire, so their flat stats are not the 120-point plan's shape locking a direction out. Sceptre-fire is a little
locked: a fresh 160 reaches fire attack 28.4, sceptre 23.4 and armour 30.8. bow-elemental's fresh 160 reaches 15.4.

## 3. One stat at a time across the builds that share it (120 points, the stat's own terms)

| stat           | G0 base                                                                                           | now                                                                                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| spell damage   | 76–134% (aura-brand 76)                                                                           | **136–268%** (aura-brand 136, spell-totem 188, the rest 208–268)                                                                                          |
| energy shield  | 77–189% (+15 flat for most)                                                                       | **148–249%** (summoner 249, caster-es 212, curser 190, wand 179, dagger-caster 177)                                                                       |
| armour         | 162–266%                                                                                          | sword-str 176, axe-bleed 188, sceptre-fire 266, mace-shield 278, mace-slam 326, warcry 336, two-hand-fire **398**                                         |
| life, strength | 188–238%                                                                                          | **104–176%** (finding 8)                                                                                                                                  |
| life, others   | 97–172% (+20 flat for most)                                                                       | 67–198% (summoner 67, caster-life 117, bow-poison 198)                                                                                                    |
| evasion        | 247–271%                                                                                          | 252–363% (Shade builds up 60–90 points)                                                                                                                   |
| shield block   | mace-shield 63, block-caster 46                                                                   | mace-shield 50, block-caster **18** (finding 2)                                                                                                           |
| attributes     | strength builds 230–280 str (gear 120–180); dexterity builds 255–300 dex (180); int 230–260 (150) | Vanguard str 248–301, Strider dex 269–293, Mystic int 196–246. Oversupply as at G0, a G5 item (§7.4). The hybrids' second attribute is short (finding 3). |

## 4. Walks by hand (§15.2): the five whose numbers look worst, at 120 points

These are the allocator's best 120-point plans, read node by node with the walk printer.

### A. block-caster (Zealot start): choice 1, block and spell block flat

**Path** (`block-caster.png`):

1. Zeal, then the Nave's life road.
2. The Iron Faith wheel: two shield smalls, Iron Faith and Hearthfire. Then Vigil and Litany.
3. North through the Choir. Choirmaster is worth 0 to this build, a fair toll (§5.5).
4. Frozen Font's three block smalls, and Quarterstaff.
5. The Crypt wheel: Homily and Glass Wall.
6. Over the crypt road into the Mystic's Well: Living Verse, Quickening, Quiet Pulse, Composure, Deep Well, Glass
   Skin and Spirit Ward.
7. The Mystic's craft and frost: Arcane Focus, Hale Scribe, Keen Verse, Darting Bolts, Thunderhead, Flashpoint and
   Piercing Word.
8. The Zealot's north walk (Tomb Dust, Plainsong, Vespers, Rood Screen), and High Veil.

That is 55 points in the Zealot and 65 in the Mystic, with 33 points of tax.

**Chose:** spell damage 240%, ES 148% + 15, and three spell-block notables (Glass Wall, Spirit Ward, Rood Screen).

**Gave up:**

- Every shield notable outside the Zealot: Bracing, Locked Shields, Buckler, Steel Rim and Round Shield.
- The Shieldwall keystone, which it took at G0.
- Forty more points go to the Shade's spell and ES (Hasty Words, Shifting Ward, Shroud, Thick Blood) and to Warm
  Blood, with no block.

**Stretch with no choice:** none in the strict sense. The north walk `cathedral.walk.road.n6`–`n3` is four road nodes,
but Plainsong, Vespers and Rood Screen branch off it. (`n5` is bare; the network auditor owns that.)

**Notables nobody would take:** none taken. Choirmaster and Frozen Font are tolls with a use (Frozen Font's smalls are
block).

**Verdict:** the build the archetype names does not exist at 120 (finding 2).

### B. sceptre-fire (Zealot start): three of four main stats flat; 40 more points buy only life

**Path** (`sceptre-fire.png`):

1. The Zealot home: Zeal, Hearthfire, Ardour, Verger and Gilded Rod.
2. Over Elemental Ward into the Vanguard home for 60 of its 120 points: Ringing Blows, Oathbound, Iron Lungs (worth 0),
   Mortar and Stone, Steady Hands, Hallowed Hammer, Stone Heart, Weight of Iron, Locked Shields, Thick Skin, Broad Back
   and Hot Iron.
3. West in the Zealot: Sexton, Consecrated Plate, Thunder Peal (worth 0, on the way), Searing Avatar, Kindled Steel and
   Brazier.

That is 38 road nodes and 38 points of tax.

**Chose:** every sceptre cluster, the strength side's fire attacks except Bellows (Ardour, Hallowed Hammer, Hot Iron,
Kindled Steel), Searing Avatar and 266% armour.

**Gave up:** life, at 112%, the lowest of the strength builds. Forty more points buy only life, in the Mystic's home
(Warm Blood, Quiet Pulse, Hale Scribe, Glass Skin) and Procession.

**Stretch with no choice:** none. The Vanguard rampart roads branch at every node.

**Notables nobody would take:** Iron Lungs and Thunder Peal are taken as tolls only.

**Verdict:** a fair early and mid game, and a late game that is life alone (finding 6). The Zealot sceptre fighter
also lives half in the Vanguard home. That is §3.3's mix and match, and Elemental Ward is the Stop 3 hinge.

### C. two-hand-fire (Vanguard start): three of four flat; 40 more points buy only life

**Chose:**

- Armour, 398%: Mortar and Stone, Guarded, Verger, Mended Mail, Thick Skin, Iron Voice and Tempered.
- The two-handers: Thunderstep, Greatweight, Headsman, Full Swing and Heavy Hands.
- Fire attacks: Ardour, Hearthfire, Elemental Edge, Hot Iron and Bellows.

That is 75 Vanguard, 24 Reaver and 21 Zealot points.

**Gave up:**

- Life, at 132%.
- Searing Avatar (13 steps from the plan) and Kindled Steel.
- Forty more points buy Stout Heart, Scarred Hide, Second Wind, Barrow Ward and Quickened Steel: life +56%, armour
  +10%, fire and two-handed 0%.

**Stretch with no choice:** the Reaver's west road (`yard.blades.west.w1`, `j1.a`, `w2`, `w3`,
`toHeadsman.r1`–`r3`) is seven road nodes. Each has a branch (Guarded, Hewing, Elemental Edge, Sword and Board,
Thirsting Blade), so it is a road that earns its length (§7.3).

**Notables nobody would take:** Quartermaster, Litany and Ringing Blows are tolls.

**Verdict:** as B. The build is coherent, and its late points are life only.

### D. caster-life (Mystic start): spell damage, elemental damage and spell crit all at or under 12%

**Path:**

1. The Mystic's east: First Light, Sharp Mind, Warm Blood, Arcane Focus, Hale Scribe and Darting Bolts.
2. The crit and lightning ring: Thunderhead, Keen Verse, Flashpoint, Piercing Word, Overcharge and Cold Light.
3. The Well: Living Verse and Quiet Pulse.
4. Then across into the Zealot as far as its home: Homily, Plainsong, Vespers, Choirmaster (worth 0.3), Vigil, Litany,
   Hearthfire and Zeal, 44 steps out by the plan.

That is 83 Mystic and 37 Zealot points, with 38 points of tax.

**Chose:** spell damage 250%, all the spell crit within reach (Sharp Mind, Keen Verse, Flashpoint, Cold Light), and
fire and lightning.

**Gave up:** life (117%: Thick Blood 7 steps from the plan, Long Breath, Stout Heart) and the far spell notables (Long
Chant, Hedge Magic, Hasty Words, Quiet Knife, Crozier). Forty more points take Hedge Magic and Long Chant (+12% spell)
and life (+38%).

**Stretch with no choice:** the Choir between the Crypt and the Zealot home. Choirmaster, Vigil and Litany are worth 1
or less, and they are passed to reach Hearthfire and Zeal. That is a long toll, but a choice: the build could stop at
Homily.

**Notables nobody would take:** none. Cinder (burning, 0.4) is taken on the ring as a toll.

**Verdict:** finding 1 in miniature. Its flat spell damage is a full tank, not a shortage.

### E. bow-elemental (Strider start): its identity stat flat at both budgets

**Chose:**

- The bow set: Longbow, Split Volley, Far Flight, Rapid Fire, Iron Draw, Heavy Draw and Kill Shot.
- Elemental Fletching (6 steps), and Cold Steel late (Shade, 26).
- Evasion and life over three regions: Footwork, Weaving, Soft Step, Keen Instinct, Buckler, Thick Blood, Sea Legs,
  Hardy Stock and Scarred Hide.

That is 70 Strider, 26 Reaver and 24 Shade points.

**Gave up:** the south's elemental direction (Pitch Arrows, Stormstruck, Live Wire, Bright Shafts) and Elemental Edge.
Forty more points buy defence only: Wiry Frame, Stout Heart, Tall Grass, Wanderer and Grey Cloak.

**Stretch with no choice:** none.

**Notables nobody would take:** Fighting Breath (mana on attack hit, worth 1.0) is a toll.

**Verdict:** finding 7. 97 of its 121 nodes are bow-crit's.

**Also read, trap-mine** (`trap-mine.png`):

- It takes Tripwire, Trapper, Sapper and Black Powder.
- Then it spends its late points on ES in the Mystic: Glass Skin, Composure, Quickening, and High Veil at 160.
- It leaves Snare Line, 5 steps from its plan.
- Hair Trigger and Shaped Charge are priced at half (finding 4).
- Its tax is the highest of the attackers, 37%, with 44 road nodes across four regions.

## 5. What is good (keep it)

- **Targets 2, 3 and 4 hold.**
  - A mid-run build keeps its appetite: 52%, with 8% flat.
  - Every build's gave-up list at 120 holds at least one notable worth 2.5 or more that it wants, typically three (G0: eight builds had none).
  - Only one build has a single plan at 120, down from eight. Choice at 60 went 11 → 7 single plans.
- **The user's two examples now make choices.**
  - The classic caster is the only archetype besides claw-poison whose every main stat gains 20% or more past 120:
    spell damage +29%, cold +71%, ES +22%, cast speed +77%.
  - The strength sword build gives up life (104% at 120, +82% by 160) for every sword cluster and its armour.
  - Neither takes everything.
- **Tax fell where it was worst:**
  - dagger-caster 45 → 37%
  - staff-block 41 → 30%
  - block-caster 40 → 28%
  - storm-caster 41 → 35%
  - aura-brand 36 → 28%
  - Road nodes per 120-point plan fell for 14 builds and rose for 11 (most: two-hand-fire 23 → 32, summoner 29 → 36). That is the place to watch for target 5's guard.
- **Far twins work.** Bleed, poison, curses, dodge, minions and wands now spread over two or three regions, and
  builds cross for them (axe-bleed's Deep Cuts and Barbed Arrows in the Strider; claw-poison's Carrion Claws). The flat
  specializations are flat because they were reached, not because a twin sits beside a twin.
- **The G3 agents' refusals to pad** (Reaver r3 §10.1, Vanguard r3 §1) read correctly against this data. Most flat
  stats are trades. A fix for this round's findings should not undo those refusals.

## 6. Missing rules (§15.4)

1. **A cluster's smalls carry its partner when the generic is everyone's.** Finding 1 shows a meta-level gap.
   CONSTRAINTS §5.3 says generic stats are "lines on many notables, never as one destination". It does not say what
   a cluster's smalls should carry when the notable pairs a generic with a partner. Proposed addition to §5.3:

   > A cluster built for a partner carries the partner on its smalls; the generic stat (spell damage, energy shield,
   > life, armour, evasion) sits on its notable. A cluster whose smalls are a generic stat is taken by every build that
   > wants the stat, so it is a destination, and is placed only where that is the intent, then checked in the per-stat
   > report.

2. **The measure pays for gear** (finding 3). A G-growth §1 addition, not a CONSTRAINTS item:

   > A plan meets its archetype's gear before it is judged; attributes count toward value only up to the gear's need,
   > and never toward value beyond it.

3. **The yardstick is audited with the network.** Each audit round lists the line keys and keystones no archetype
   weighs (finding 4, finding 5) before reading "nobody would take" from the numbers. This is a process note for
   G-growth §2 (G4), not a constraint.

## 7. Checklist of the CONSTRAINTS items in this subset

- **§1.1, tension as what more points would still buy:** holds with exceptions.
  - Target 1 fails: 23% typical gain, 23% of main stats flat, 2 of 28 builds with every stat at +20%.
  - Most builds have finished one specialization, which they pay for elsewhere (§2).
  - Sceptre-fire and two-hand-fire have a life-only late game (finding 6).
- **§1.1, "one constraint among all the others":** holds. No finding asks for filler or a road, and the fixes keep
  §4.6, §5.2, §6, §8.2, §8.6 and §9.1.
- **§5.1 and §5.3, partners and generics:** fails for Keen Verse, Piercing Word and Living Verse (finding 1). Holds
  elsewhere in what the measure shows.
- **§7.4, attribute supply against gear:** fails for the hybrids' second attribute in the measured plans, partly a
  tool gap (finding 3). The main attribute is oversupplied, as at G0 (G5).
- **§9.3, good late-build decisions and second keystones:** holds with exceptions. Late points buy only life for
  sceptre-fire and two-hand-fire. Second keystones are unmeasured (finding 5).
- **§12.3, balance as supply priced in units:** holds with exceptions. The spell, ES and armour per-stat jump (findings
  1 and 8) is the ledger's own §8.1 trigger.
- **§12.4, no incremental bot simulations:** holds. Only the static allocator and scratch probes were run.
- **§14, no node placed for a number:** holds for this report. Every proposed change is argued from a cluster's stated
  partner or a player's want. The finding-1 trial is a yardstick check of that change, not its reason.
- **§15.2, walks:** done for five archetypes at 120 points, plus trap-mine read.
- **G-growth §0 (no power number) and §1 (one stat or a pair at a time):** holds. No total is given for any build.
