> Research made before the work in docs/SUPPORTS-PLAN.md (2026-10-12), kept as the evidence behind it. Numbers and file references describe the code as it was then.

# PoE 3.9 support gems that multiply projectiles, areas and repeats

Research note for Bob. Scope: how Path of Exile (3.9 "Legion-era" ruleset, Dec 2019 - Mar 2020) handles supports that add
projectiles, area instances, trap/mine/totem copies and repeats; which skills accept which supports; and what the design
logic behind "interesting" vs "boring" supports is. No source code under `src` was touched.

## 0. Sources and method

| Tag | Source | Notes |
|---|---|---|
| PoB-3.9 | Path of Building repo, commit `0c3db4a2...` (2020-03-09, last commit before 3.10). Files `Data/3_0/Skills/{act_dex,sup_dex,sup_int,sup_str}.lua`, `Data/Global.lua`, `Data/3_0/SkillStatMap.lua`, `Modules/CalcOffence-3_0.lua`. | Facts only (numbers, skill-type lists). Exported from game data, so this is the closest thing to a 3.9 primary source. `manaMultiplier = N` means a cost multiplier of (100+N)%. |
| PoB-cur | Same repo, current `master` (`src/Data/Skills/*.lua`). | Used only to show what changed since 3.9. |
| Wiki | poewiki.net, via its MediaWiki API (`api.php?action=query&prop=revisions`), raw wikitext incl. version history tables. | The wiki is currently at ~3.29 so "current" numbers on it are NOT 3.9. Version-history rows were used to back-derive 3.9 values and cross-checked against PoB-3.9. |
| GGG-1 | "Skill Revamps - Part 3" (Apr 2018, pre-3.3.0), https://www.pathofexile.com/forum/view-thread/2133090 | GGG primary. Rain of Arrows / Blast Rain / Barrage design reasoning. |
| GGG-2 | "New Bow Support Gems in Conquerors of the Atlas" (3.9.0, Natalia_GGG), mirrored at https://devtrackers.gg/pathofexile/p/76515e91-new-bow-support-gems-in-path-of-exile-conquerors-of-the-atlas | GGG staff post, read via the mirror (the original forum URL was not located). Greater Volley / Barrage / Arrow Nova reasoning. |
| GGG-3 | "Development Manifesto - Game Balance in Path of Exile: Expedition" (3.15, Jul 2021), https://www.pathofexile.com/forum/view-post/24190927 | GGG primary. Post-3.9 (so a later philosophy statement), but the clearest statement of support-gem design intent. |

Wiki page URLs used: `https://www.poewiki.net/wiki/<Name>` for Rain_of_Arrows, Blast_Rain, Greater_Multiple_Projectiles_Support,
Lesser_Multiple_Projectiles_Support (now "Multiple Projectiles Support"), Volley_Support, Greater_Volley_Support, Fork_Support,
Chain_Support, Pierce_Support, Faster_Projectiles_Support, Slower_Projectiles_Support, Point_Blank_Support, Spell_Cascade_Support,
Spell_Echo_Support, Multistrike_Support, Mirage_Archer_Support, Cluster_Traps_Support, Multiple_Traps_Support,
Swift_Assembly_Support, Blastchain_Mine_Support, Charged_Mines_Support, Multiple_Totems_Support, Ballista_Totem_Support,
Barrage_Support, Arrow_Nova_Support, Support_gem, Projectile. (poewiki.net blocked the plain WebFetch tool with an Anubis
bot-check page; the MediaWiki API through curl worked. Nothing was taken from a source I could not open.)

Note on naming: in 3.9, "Lesser Multiple Projectiles" (LMP) and "Greater Multiple Projectiles" (GMP) were the names. LMP was
renamed "Multiple Projectiles" in 3.28. "Greater Spell Echo" did not exist as a gem in 3.9 (added as a gem in 3.28; before
that it was only a unique-item support effect). There is no "Lesser Spell Echo" gem at all (wiki page does not exist).
"Greater Volley" became a gem in 3.9.0 (before that it only came from the unique bow Reach of the Council).

---

## 1. Rain of Arrows (RoA) and the projectile supports

### 1.1 What the skill is

- Tags shown on the gem in 3.9: Attack, AoE, Projectile, Bow (the Projectile gem tag was added in 3.4.0, Wiki version history).
  Internally (PoB-3.9) RoA has skill types `Attack, ProjectileAttack, Area, ProjectileDamage, SkillCanMirageArcher,
  SkillCanTotem/Trap/Mine, Triggerable` plus the special `Type73`, and stats `base_is_projectile`, `is_area_damage`,
  `skill_can_fire_arrows`, `cannot_pierce`. It does NOT carry the generic `Projectile` skill type that Pierce/Fork/Chain
  require. PoB's own comment on `Type73` reads "Allows LMP/GMP on Rain of Arrows and Toxic Rain" (Data/Global.lua).
- How it works (GGG-1 and Wiki): the skill fires many arrows into the air that land after a delay and each deals area
  damage where it lands. Half the arrows land at random inside the skill's area; the other half choose targets in a series
  of rings spreading out from the targeted location, which spreads them evenly. The arrows do not collide with enemies or
  terrain, so they cannot pierce, return, fork or chain (Wiki).
- Arrow count: it is one skill-use that spawns N arrows, so there is no "projectile count" decision per fire; N is a gem-level
  stat. Wiki skill data: "Fires 18 Arrows" at gem level 1, "Fires 22 Arrows" at level 20. PoB-3.9 stores 17 (L1) to 21 (L20)
  as `base_number_of_additional_arrows`, which is the same thing minus the base one. The wiki has no version row changing arrow
  counts between 3.3 and now (other than quality in 3.23), so 18-22 is very likely the 3.9 value (inferred, not directly
  quoted for 3.9).
- Damage per arrow: damage effectiveness 48% (L1) to 60% (L20) since 3.9.0 (was 40%-50%). Mana cost 7 (L1) to 11 (L20) in 3.9
  (6 to 10 since 3.25). Radius 24 (2.4 m) in PoB-3.9. Quality in 3.9: +0.5% area per 1% quality (3.23 changed quality to
  extra arrows: +0.2 arrows per 1% so +4 at 20%).
- One AoE, many regions: it is many small regions, not one big one. Each arrow's explosion is its own area. Against a boss
  the wiki estimates 2-5 hits per use; individual enemies can be hit several times, depending on area modifiers and enemy size.
- GGG-1 design intent: the old skill used one area, which could not keep up once other bow skills had pierce and extra
  projectiles; making the single area "absolutely massive" was rejected, so the rework turned it into many arrows each with its
  own area over a much larger total region.
- Attack speed affects both the animation and how fast arrows strike the ground; projectile speed shortens the delay before
  landing (Wiki, 0.9.5g note); Point Blank uses distance between the use location and the enemy hit (Wiki).

### 1.2 Does GMP work on RoA? What does it do there?

Yes it is allowed (PoB-3.9 `SupportGreaterMultipleProjectiles.requireSkillTypes` = `Projectile, Type54, Type56, Type73`; RoA has
`Type73`). It adds 4 arrows (L1 22 vs 18, L20 26 vs 22) and applies its "less projectile damage" to every arrow
(35% less at L1, 26% less at L20 in 3.9). GGG-1 states that additional arrows go on additional outer rings, widening the
total spread "without impacting damage to individual targets".

Consequence (my arithmetic from the verified numbers; assumes the extra arrows land away from a lone target, as GGG-1 says):

| Case | Total arrow damage | Damage to one boss in the centre |
|---|---|---|
| RoA L20 + GMP L20 | 26 x 0.74 / 22 = 0.87x | 0.74x (pure loss) |
| RoA L1 + GMP L1 | 22 x 0.65 / 18 = 0.79x | 0.65x |
| RoA L20 + LMP L20 (+2, 6% less) | 24 x 0.94 / 22 = 1.03x | 0.94x |

So on RoA, GMP is a coverage tool paid for with more cost (165%) and less damage per arrow. The wiki's editorial note says
the same ("likely unattractive", the extra count is additive to a large default count). The key design fact: the support is
legal, behaves consistently (each extra instance is another arrow), and its value is decided by the geometry of the skill, not
by a rule that blocks it.

### 1.3 Does the "Projectile" tag mean RoA "fires projectiles"?

No, not in the support-eligibility sense. Wiki-attributed rule (Wiki Support_gem page cites a Mark_GGG Reddit post of 3 Apr 2017; I did not open the Reddit post):
gem tags do not determine supportability. Eligibility is a per-support list of required and excluded skill types. RoA lies
in between: it counts for "projectile count / projectile damage / projectile speed" supports (the arrows are projectile
damage and have a count), but is excluded from "projectile behaviour" supports (pierce, fork, chain, return) because the
arrows never collide.

### 1.4 Per-support compatibility with RoA (PoB-3.9 skill-type lists + Wiki)

| Support | Works on RoA? | Why / what it does | Source |
|---|---|---|---|
| Greater Multiple Projectiles (+4) | Yes | `Type73` accepted; +4 arrows, 35..26% less proj. damage; 165% cost | PoB-3.9 |
| Lesser Multiple Projectiles (+2) | Yes | `Type73`; +2 arrows, 15..6% less; 140% cost | PoB-3.9 |
| Volley / Greater Volley | No | needs `SkillCanVolley`, RoA does not have it | PoB-3.9 |
| Fork, Chain, Pierce | No | require `Projectile`/`Type54`/`Type56`; RoA has none; arrows cannot collide | PoB-3.9, Wiki |
| Faster / Slower Projectiles | Yes | require `Projectile` or `ProjectileDamage`; speed changes landing delay. Wiki (0.9.5g): "made to work with RoA" | PoB-3.9, Wiki |
| Point Blank (gem) | Yes | needs `ProjectileAttack`; uses use-to-hit distance | PoB-3.9, Wiki |
| Barrage Support | Listed as allowed | requires (`Type73`) AND (`ProjectileAttack`); real in-game behaviour with RoA not verified | PoB-3.9 only |
| Arrow Nova | No | requires `SkillCanVolley` and excludes skills with secondary projectiles | PoB-3.9 |
| Mirage Archer | Yes | RoA has `SkillCanMirageArcher` | PoB-3.9 |
| Spell Echo / Spell Cascade | No | spells only | PoB-3.9 |
| Multistrike | No | melee only | PoB-3.9 |
| Trap / Mine (Blastchain) / Ballista | Yes | RoA has `SkillCanTrap/Mine/Totem`; Ballista needs `Attack` + `SkillCanTotem` | PoB-3.9 |

Which other skills share `Type73` (accept GMP/LMP though they are not "ordinary projectile" skills): Artillery Ballista,
Blast Rain, Rain of Arrows, Vaal Rain of Arrows, Toxic Rain (PoB-3.9 data; in current PoB the flag is renamed
`ProjectileNumber`, i.e. "skill's projectile count can be modified", which makes the design explicit: it is a per-skill
capability flag, not a tag).

Unverified: whether Barrage Support actually changes RoA arrow timing in game (data allows it). Exact quality effects of
unlisted supports. Whether Mirage Archer's copy of RoA lands its own arrow ring (it is "uses that skill", Wiki).

---

## 2. Area / trap / totem / mine / repeat multipliers

All numbers below are PoB-3.9 unless noted. "L1/L20" are gem levels. Cost multiplier = 100 + manaMultiplier.

### 2.1 Blast Rain (the "overlapping" counter-example to RoA)

- Wiki: fires arrows into the air that rain down over an area as a series of explosions, all overlapping within a 3-unit
  circle; radius 2.4 m. 100% physical converted to fire. In 3.9.0: damage effectiveness 30%-36% (was 40-48%), base 5 additional
  arrows at all levels (was 4) (so 6 explosions), and, as an explicit change, "Sources of additional projectiles now add
  additional explosions".
- PoB-3.9 treats it the opposite way to RoA: it has a "1 Projectile / All Projectiles" mode whose DPS multiplier equals
  the projectile count, i.e. every extra projectile is one more full-damage hit on the same target. Also `Type73`.
- Result with GMP (6 -> 10 explosions): L20 10 x 0.74 / 6 = 1.23x; L1 10 x 0.65 / 6 = 1.08x. With LMP (6 -> 8): L20
  8 x 0.94 / 6 = 1.25x, L1 8 x 0.85 / 6 = 1.13x (my arithmetic). Same support, opposite value from RoA, purely because of
  arrow placement.
- GGG-1 (pre-3.3) already said GGG was "considering Blast Rain's interactions with additional arrows", i.e. this was a deliberate
  redesign over several patches.

### 2.2 Trap / Mine / Totem multiplication (3.9 values)

| Support | Effect | L1 | L20 | Cost mult | Notes |
|---|---|---|---|---|---|
| Multiple Traps | throw 3 traps total (2 extra, in a line); +3 max traps | 50% less dmg | 31% less | 140% | Wiki: 3.9 numbers still apply (3.17 later raised the penalty to 58%..52%) |
| Cluster Traps | 3 traps thrown at once randomly within 20 units of target; +5 max traps | 55% less | 36% less | 150% | With Multiple Traps: 5 traps in the random spread. 3.17 later: 61..55% less |
| Swift Assembly | chance to throw +1/+2/+3 extra traps or mines | 9 / 6 / 3 % | 18 / 12 / 6 % | 120% | mean +0.6 trap at L20 (Wiki). Mines take 10% more time per extra mine |
| Trap and Mine Damage | pure damage: more damage for trap & mine skills | +30% more | +49% more | 130% | -10% (reduced) trap & mine throw speed |
| Charged Mines | 20->30% chance to gain frenzy/power charge on detonation; +10% mine laying speed per frenzy charge; +25% mine crit chance per power charge | | | 130% | utility |
| Minefield (PoB only) | +4 mines per throw (5 total); mine laying speed 65%..60% less; +4 max remote mines | | | 120% | not read on the wiki |
| Blastchain Mine | spell/bow-wand attack is thrown as a mine; mines detonate in a chain 0.25 s apart; each prior mine in the sequence adds 5% more damage; mine lasts 5 s | 35% less | 25% less | 30% | cost multiplier is BELOW 100% (PoB `manaMultiplier = -70`); wiki 3.15 row confirms 30% before 3.15, 50% after, 65% since 3.29 |
| Multiple Totems | summon 2 totems per cast, +2 max totems | 40% less | 21% less | 150% | Wiki: a single-totem skill gets 2.4x total damage in the best case |
| Ballista Totem | converts bow/wand attack into a ballista; +2 max ballistas | 50% less dmg | 41% less | 120% | also 50% less attack speed; 3.9.0 rework (Wiki) |

Totals if all copies hit one target (my arithmetic): Multiple Traps L20 3 x 0.69 = 2.07x; Cluster L20 3 x 0.64 = 1.92x; both
(5 traps) 5 x 0.69 x 0.64 = 2.2x; Multiple Totems L20 2 x 0.79 = 1.58x. At L1: Multiple Traps 1.5x, Cluster 1.35x, Multiple
Totems 1.2x. Wiki (Multiple Traps page): traps thrown in a line are used to overlay area skills like Ice Nova, and
Swift Assembly mimics the Cluster pattern; i.e. the placement geometry is part of the identity of each support.

### 2.3 Repeats

| Support | Applies to | Effect (3.9) | Cost | Notes |
|---|---|---|---|---|
| Spell Echo | non-instant, non-triggered, non-totem/trap/mine, non-reserving, non-Vaal spells (`SpellCanRepeat`) | repeats once (2 casts total); +51% (L1) to +70% (L20) more cast speed; 10% less damage | 140% | A repeat is part of the original cast: no extra cost, no extra cooldown, same crit roll, no new "on cast" triggers (Wiki, citing Mark_GGG). The tooltip does not show repeats: total time is 2x. |
| Greater Spell Echo | (3.28+ gem; 3.9 only via a unique) | repeats twice; more cast speed; increased AoE and more spell damage per repeat | n/a in 3.9 | Not a 3.9 gem. |
| Awakened Spell Echo | | 1 repeat; +71..84% cast speed; 15% less damage; 15..29% chance for double damage on final repeat | 140% | Level req 72 |
| Multistrike | melee attacks (`AttackCanRepeat`, not Vaal) | repeats twice; repeat targets a random nearby enemy; +35..44% more melee attack speed; 20..10% less damage; PoB-3.9 game-data export: first repeat 22% more, second 44% more, flat at L1 and L20 (use these as the 3.9 numbers) | 160% | The wiki's 3.7.0 row claims 40..50% and 80..99% scaling with level; it is the outlier versus the data export and probably superseded by a later change that the version table does not list. Time between uses is 3x attack time. |
| Mirage Archer | bow attacks (not totem/trap/mine/minion/Vaal) | when you hit with the skill, a Mirage Archer is summoned above you for 4 s and uses the skill; 40..31% less damage and 60% less attack speed | 140% | L20 yields 27.6% extra DPS (Wiki: 0.69 x 0.40). Targeting range lowered to 70 units in 3.9.0. |

### 2.4 Spell Cascade (also section 3)

See section 3. It is the "lateral instance" support: extra copies of the same area, one in front and one behind, never extra
damage on the same enemy unless the areas overlap.

### 2.5 Greater Volley, Barrage, Arrow Nova (3.9 bow supports)

GGG-2 (3.9.0 announcement): introduced Arrow Nova, Greater Volley and Barrage Support together as "targeted improvements to
bows". Quotes in spirit: Arrow Nova turns a forward-firing arrow skill into an upward payload arrow that bursts into a nova of
the skill's projectiles on landing (it spreads arrow effects over an area); Greater Volley was an existing unique-item effect
promoted to a gem, with a slightly lower damage multiplier than GMP "given that the damage shape is less desirable"; LMP and
Volley had been abandoned for GMP at endgame, so their damage penalties were lowered so they stay attractive for levelling and
as endgame choices; Barrage Support makes projectiles fire sequentially, each adding some attack time so it stays reasonable
on skills that already have many projectiles (Split Arrow, Power Siphon), and you can cancel out of a barrage.

---

## 3. Spell Cascade specifics

PoB-3.9 `SupportSpellCascade` and Wiki:

- Tags: AoE, Spell, Support. Requires skill type `SpellCanCascade` (a hand-curated per-skill flag, not the AoE tag).
- Excludes: totems, traps, mines, skills that reserve mana, Vaal skills, and minion skills (it cannot modify minions'
  skills). It can support triggered spells (since 3.6.2) and supports minion-summoning skills' casts (3.15). It cannot
  support attacks: the requirement is spell-only.
- Skills with `SpellCanCascade` in 3.9 (PoB data): Bladefall, Cremation, Desecrate, Detonate Dead, Volatile Dead, Bone/Flesh/Spirit
  Offering, Cold Snap, Contagion, Firestorm, Frost Bomb, Frost Wall, Icestorm, Storm Call, and the curses/marks (Poacher's Mark,
  Projectile Weakness, Temporal Chains, Assassin's Mark, Bane, Conductivity, Despair, Elemental Weakness, Enfeeble,
  Flammability, Frostbite, Punishment, Vulnerability, Warlord's Mark). (Wiki's modern list also mentions Blade Blast, Flame Wall,
  Absolution, Reap and others added since.)
- Number of areas: `support_spell_cascade_number_of_cascades_per_side = 1`: one extra area on each of the front and back
  sides relative to the target position, 3 areas total. The in-game text: "also affect areas in front of and behind the
  targeted area". Awakened version adds side areas too (left/right; 5 total, per Wiki "each side of the target area").
- Numbers (3.9): area of effect 25% less (L1) to 16% less (L20); damage 40% less (L1) to 21% less (L20) (Wiki: 3.6.0 changed
  from 50/31 to 40/21; 3.15 changed to 40..31 less); cost multiplier 140% (130% since 3.15.0d); quality: +0.5% area per 1%
  (3.9) .
- Awakened (3.9): area 18%..8% less, damage 25%..13% less, level req 72.
- Delay between cascades: NOT verified. Neither the wiki text nor PoB data gives a number (PoB does not model it). The
  support's examples are screenshots only.
- Damage effect: the damage penalty applies to the skill as a whole, so a single enemy that is hit by only one of the three areas
  takes only a loss; the benefit is covering more ground or hitting a pack. The damage penalty is a "less" modifier on the
  full skill damage (so Bob's "damage x 0.6" matches in form).

---

## 4. Design philosophy for support gems (verified material only)

### 4.1 What GGG says

1. Supports are applied by physical link groups; since 0.9.3 support cost is a flat multiplier (not exponential in gem level),
   and the changelog states supports are balanced so only a few are needed to make a skill feel powerful (Wiki Support_gem,
   version 0.9.3 row).
2. Opportunity cost (GGG-3, 3.15): GGG's stated worry was the power gap between supports; some give big multiplicative
   damage, others give utility, and the correct build choice was to take all the multiplicative bonuses and ignore
   interesting utility supports because the opportunity cost was too high. The fix was to cut damage multipliers
   on the clearly "damage only" supports and give them drawbacks (e.g. Controlled Destruction now penalises crit
   multiplicatively; Melee Physical Damage gained less attack speed; Minion Damage gave minions less life), reducing a
   fully-supported six-link by roughly 20-40%, and not buffing the utility supports.
3. Standardisation rule (GGG-3): supports with a useful side benefit usually top out under 25% more damage at L20;
   damage-only (or only mildly restricted) ones give about 30-35%; those with real downsides give 38-48%.
4. Reference points that GGG left untouched in that pass because they are "more interesting projectile support effects":
   Barrage, Greater Multiple Projectiles, Chain, and the trap supports (Trap, Cluster Traps, Multiple Traps, Charged Traps,
   Swift Assembly). GGG noted the consequence: those builds lost less damage, so bow and trap builds got stronger
   relative to others, and that this was fine.
5. Awakened gems (GGG-3): they were too strong (up to ~50% more six-link damage vs normal supports), so their quality was
   made equal to the base gem. Mechanically they are "one more step": +1 projectile (GMP 5 vs 4), +1 chain (3 vs 2),
   +1 fork, +2 side cascades, an extra Multistrike repeat, a chance of double damage on final Echo repeat.
6. Poison builds were described as having a dull support pool because most supports gave an unconditional
   more-damage multiplier; GGG reworked Poison Support into Critical Strike Affliction (a conditional one) (GGG-3).
7. Wiki-attributed (cites Mark_GGG on Reddit, Apr 2017; Reddit post not opened): tags do not determine supportability.
8. Exceptional supports (3.28+, Wiki): Greater versions that replace the base gem, "enhancing their effects in interesting
   ways" - listed as design intent on the wiki, not a quote I could verify from GGG directly.
9. Barrage / extra projectile balance (GGG-1): extra projectiles gave 25% more damage for each extra projectile on
   Barrage, which was too much; instead of cutting damage outright, GGG raised the base projectile count to 5 so the
   per-projectile gain falls to 20%. Takeaway: a flat "+N projectiles" has relative value N/base; GGG tunes the base count
   to tune the support's value.
10. 3.9 (GGG-2): do not leave lower tiers dead. When GMP outcompeted LMP and Volley at endgame, GGG cut those penalties
    and gave Greater Volley a lower damage multiplier than GMP because its shape (parallel lines) is worse for most skills.
11. Dead/no-op combos: the wiki (Support_gem) states plainly that many support-skill pairs are invalid and that an invalid pair
    leaves the skill unchanged. Eligibility is expressed with required and excluded skill types plus special per-skill flags
    (`SkillCanVolley`, `SpellCanCascade`, `AttackCanRepeat`, `Type73`/`ProjectileNumber`, ...). Skills without the matching
    flag do not get the support's benefit; they are not given a no-op effect. The one verified UI fact: since 2.3.0, hovering a socketed support makes the skill gems it affects glow, and vice versa (Wiki Support_gem version row); the wiki notes this does not handle supports that enable or disable other supports. Greying of invalid links is my recollection, not verified.

### 4.2 "Not interesting" vs "interesting"

Not interesting (pure multipliers; my classification, consistent with GGG-3): Added Fire Damage (3.9: 25..44% of physical
as extra fire, 120% cost), Trap and Mine Damage (+30..49% more, minus throw speed), Increased Critical Damage, Brutality,
Controlled Destruction, Melee Physical Damage and the like. These are interchangeable "slot fillers"; their cost is only
the opportunity of a slot. Awakened Added Fire Damage adds +1 physical level, which is a number bump, not a behaviour.

Interesting (they change what the skill does): Chain, Fork, Pierce (behaviour of projectiles on hit), GMP / LMP / Volley /
Barrage (how many and in what shape), Mirage Archer (a second entity), Spell Echo / Multistrike (time vs repeat),
Spell Cascade (space), Cluster/Multiple Traps, Swift Assembly, Blastchain Mine (timing chain), Unleash (seal-based
reoccurrence with cast time penalty), Trauma (stacking risk/reward: more added damage per stack but self-damage), Arrow Nova
(changes aim into a landing nova).

What makes them interesting (verified patterns, interpreted):
- A real trade-off, not a flat penalty: Barrage costs attack time per projectile; Multiple Totems and traps cost damage per copy;
  Multistrike/Echo trade damage for speed; Unleash penalises cast time; Trauma hurts you; Slower Projectiles trades speed for damage.
- Positional / geometric identity: Volley fires parallel lines from points beside you; GMP fans out; Fork spreads at 60 degrees; Cluster
  places traps randomly within 20 units; Multiple Traps lines them up. The same count has a different value on different skills
  (Blast Rain gains up to ~1.25x from +2; RoA gains ~1.03x).
- Timing: Echo repeats are part of the cast; Blastchain's detonation order and delay are the skill; Unleash seals need time to
  recharge; Mirage lasts 4 s.
- Build-defining synergy: Barrage + Volley/GMP, Ballista + Multiple Totems, Cluster + Hair Trigger area, Spell Echo + Cascade...
- A clear, listed set of skills it works on (a curated flag), so it never silently misfires.

---

## 5. 3.9 projectile-count-related supports (stats at L1 / L20)

All "less/more" are multiplicative (PoB: `Damage MORE`). Cost multiplier is as of 3.9 (PoB-3.9, confirmed by wiki 3.15
rows). Level requirement in parentheses.

| Support (req lv) | Projectiles | Damage multiplier | Other | Cost |
|---|---|---|---|---|
| Lesser Multiple Projectiles (8) | +2, fan | 15% less -> 6% less projectile dmg | spread arc controlled by cursor | 140% |
| Greater Multiple Projectiles (38) | +4, fan, wider minimum spread | 35% less -> 26% less | mutually exclusive with LMP | 165% |
| Awakened GMP (72) | +5 | 30% less -> 18% less (L1..L20) | +250% terrain attachment chance reduction (technical) | 165% |
| Volley (4) | +2 via side points (max 2 points per side, projectiles divided among them), parallel (80 units apart) | 12% less -> 3% less | needs `SkillCanVolley`; excludes secondary projectiles | 140% |
| Greater Volley (38) | +4 via side points (max 4 points per side, so 2 per side at +4) | 30% less -> 21% less | as above; lower multiplier than GMP "given the shape" (GGG-2) | 165% (wiki 3.15 row: 165% before 3.15) |
| Fork (31) | projectiles fork once on first hit (not pierced) into two | 10% less (L1) -> 9% more (L20) | | 130% |
| Awakened Fork (72) | fork twice | 0% -> 24% more | | 130% |
| Chain (38) | +2 chains | 30% less -> 11% less (hits only) | works on non-projectile chain skills too (Arc) | 150% |
| Awakened Chain (72) | +3 chains | 19% less -> 5% more | | 150% |
| Pierce (1) | +2 pierces (L1) -> +4 (L20) | 0% -> 19% more projectile damage | | 110% |
| Faster Projectiles (31) | none | +50 -> 69% projectile speed; +20 -> 29% increased projectile damage | excludes `Type51` skills | 110% |
| Slower Projectiles (31) | none | 30 -> 49% less speed; 20 -> 29% more projectile damage | traded for hit count on slow-moving AoE (Ball Lightning) | 140% |
| Point Blank (gem, 18) | none | 0 -> 38% increased projectile damage; keystone behaviour: up to 30% more damage at start of the flight, falls off with distance (3.9.0, from 50%) | `ProjectileAttack` only | 120% |
| Barrage Support (38) | +3, sequential | 68% less -> 62% less; +5% attack time per projectile | bow & wand only, cannot support triggered/channelled | 150% |
| Arrow Nova (8) | +4 as a nova on landing | 40% less -> 26% less | bow arrows only; cannot support skills that already fire arrows into the air | 140% |
| Spell Cascade (4) | +2 areas (front, back) | AoE 25 -> 16% less; damage 40 -> 21% less | | 140% |
| Spell Echo (38) | +1 repeat | 10% less; +51 -> 70% more cast speed | | 140% |

Versions that changed since 3.9 (so the player-visible values you read on the wiki today differ): GMP cost 165% -> 160% (3.15) -> 150%
(3.15.0d); GMP/LMP quality changed to projectile damage (3.15); LMP renamed Multiple Projectiles (3.28); Greater supports became
mutually exclusive with the base gem (3.28); Spell Cascade 40-31% less (3.15); Chain 140% cost (3.28); Barrage Support 4
extra projectiles / 10% attack time per projectile / 200% cost (3.29); Multiple Traps 58-52% less and Cluster 61-55% less
(3.17); Blastchain Mine damage penalty raised (3.17, 3.29); Multistrike 30-20% less (3.15).

Mapping to Bob's renamed gems (from the brief): Twin Salvo ~ Volley/LMP (+2 parallel, mild penalty, 1.4x), Wide Salvo ~
Greater Volley (+4 parallel, 1.65x), Triple Shot ~ LMP, Rolling Volleys/Barrage-ish, Split Shot ~ Fork. The 3.9 values above
are therefore the reference: LMP cost 1.40, Volley 1.40, GMP/GV 1.65, penalties: LMP 15..6 less, Volley 12..3 less,
GMP 35..26, Greater Volley 30..21.

---

## 6. Verified vs. unverified

Verified (read directly in a primary source at the time of research):
- RoA fires many arrows, half random / half ring-targeted, additional arrows widen the spread and do not raise damage to one
  target (GGG-1 forum thread + wiki).
- RoA 18 arrows (L1) / 22 arrows (L20) on the current wiki; 17..21 "additional arrows" in PoB-3.9 data; damage 48..60% in 3.9
  (wiki 3.9.0 row + PoB-3.9).
- GMP and LMP are allowed on RoA, Blast Rain, Toxic Rain via the special `Type73` flag; Pierce/Fork/Chain/Volley are not (PoB-3.9
  `Data/3_0/Skills/sup_dex.lua`, `Data/Global.lua`).
- Blast Rain: 3.9.0 made extra projectiles add extra explosions (wiki version history).
- 3.9 numbers for GMP, LMP, Volley, Greater Volley, Fork, Chain, Pierce, Faster/Slower Projectiles, Point Blank, Barrage,
  Arrow Nova, Spell Cascade, Spell Echo, Mirage Archer, Cluster/Multiple Traps, Swift Assembly, Trap and Mine Damage, Charged Mines,
  Multiple Totems, Ballista, Blastchain (PoB-3.9 levels 1 and 20; most cross-checked with wiki version-history rows).
- Spell Cascade: front/back areas, -25..-16% area, -40..-21% damage in 3.9 (PoB-3.9, wiki rows), cannot support totem/trap/mine/
  minion/Vaal/reservation skills, spell-only.
- GGG design statements in GGG-1, GGG-2, GGG-3 (paraphrased above).

Unverified or inferred:
- Spell Cascade delay between cascades and exact positional offsets (no source gave a number).
- The exact 3.9 RoA arrow counts (derived from the current wiki and PoB additional-arrow stats, not a 3.9 page).
- How exactly the arrow rings place the extra arrows relative to a single boss (GGG-1 says extra arrows go to outer rings).
- Real in-game Barrage Support + RoA behaviour.
- Multistrike 3.9 repeat bonuses: PoB-3.9 export says 22/44% more, flat; wiki 3.7 row disagrees (treated as the outlier, not resolved).
- LMP's 3.9 penalty (15..6% less) is PoB-only plus GGG-2's statement that it was lowered; the wiki LMP page has no 3.9.0 row.
- Blastchain Mine's 3.9 cost multiplier is 30% (PoB -70, wiki rows agree), medium confidence on how the in-game display rounds it.
- Quality effects in 3.9 for most supports (PoB lists them; not individually cross-checked); Vaal/Awakened/Exceptional versions only
  sampled.
- UI greying of invalid supports (recollection).
- Any quote from Chris Wilson or Mark_GGG not appearing in the three GGG pages above; the wiki's description of exceptional
  support intent is wiki editorial.
- poewiki.net could not be read with the WebFetch tool (bot check); everything wiki-sourced came through the public MediaWiki API.

---

## 7. Implications for Bob (my inferences, not PoE facts)

1. Treat "extra instances" as a skill-geometry question. PoE keeps the support rules uniform (+N, less damage, cost) and lets
   the skill decide the payoff: RoA spreads extra arrows on outer rings (about 1.03x for LMP, a loss for GMP on one target),
   Blast Rain stacks extra arrows on the same spot (1.1-1.25x), a normal projectile fan hits different lanes. Bob's Arrow
   Shower currently folds the whole rain into one radius-3 pulse (AUDIT-GEMS), so +N supports have nothing to attach to.
   Making the rain N separate small areas (or scattering N impacts) is the prerequisite for any projectile-count support
   to mean something there.
2. Give every skill an explicit capability flag instead of relying on tags: PoE uses `SkillCanVolley`, `SpellCanCascade`,
   `AttackCanRepeat`, `Type73`/`ProjectileNumber` and so on, so dead combos are rejected by data, and the same tag can
   behave differently per skill. This is the main mechanism that keeps supports from being no-ops.
3. Spell Cascade's identity is "lateral area copies, at an area and damage cost", not a repeat. Bob's Flanking Cast currently
   repeats on the same point (AUDIT-GEMS), which behaves like Spell Echo with less damage. PoE's version: 3 areas (target
   plus one in front and one behind), area 25..16% less, damage 40..21% less, 140% cost, spells that place an effect at a
   target only, no totem/trap/mine/minion/reservation skills. Single-target damage never rises; covering more ground does.
4. Pair every count bonus with a different cost axis: damage (GMP, traps, totems), speed (Barrage, Ballista, Minefield,
   Multistrike), time (Unleash), safety (Trauma), or spatial reliability (Cluster). Avoid supports that only add a number.
5. Calibrate with GGG-3's bands: side-benefit supports under about 25% more damage at max level, damage-only about 30-35%,
   supports with real downsides 38-48%. The 3.9 numbers above (GMP 26% less at L20 with 4 extra) are consistent with
   "the multiplier is the price, the mechanic is the product".
6. Keep tiers distinct (LMP vs GMP vs Volley): PoE had to cut LMP/Volley penalties in 3.9 because GMP dominated. If Bob has
   Twin/Wide Salvo and Triple Shot, make sure the cheaper one wins on small-count skills and on cost, and the bigger one
   wins on high-count skills.
7. Trap-style copy supports (Multiple, Cluster) are worth studying for placement: they differ from each other in geometry (line vs
   random disc) and from Swift Assembly (stochastic count), a good model for Bob's "interesting supports" list.
