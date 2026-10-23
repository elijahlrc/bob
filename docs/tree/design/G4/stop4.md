# Stop 4: the grown network

2026-10-23. The growth's G4 is done: two audit rounds (`audit/growth-1/`, `audit/growth-2/`) and two fix passes
(`G4/fix-1.md`, `G4/fix-2.md`, reports in `G4/fix1/` and `G4/fix2/`). This is the state the user reviews before G5
(pricing, attributes, keystone distances, labels, one bot sim, docs).

**The network:** 1,396 live nodes (1,009 before the growth): 279 notables, 27 keystones, 745 smalls, 339 travel nodes.
0 crossing links, 0 nodes drawn over each other, 0 audit problems, every notable 3 to 5 units. 1,638 registered ids
(retired ones are holes).

**Pictures** (`G4/stop4/`): `before-overview.png` and `after-overview.png` (the whole network, no labels), and
`<region>-before.png` / `<region>-after.png` for the six regions. Full-detail renders with every node's lines (14,000 px)
were sent separately as a zip; they are too large for the repository.

## 1. The five targets (agreed at stop 1)

Measured with the allocator: the best plan at 60 and 120 points, grown by 20 and 40 more. "Before" is the pre-growth
tree measured with today's tool (`G0/builds-base2.txt`, 28 archetypes); "now" is `G4/builds-final.txt` (32 archetypes:
the four added in round 2 are a Reaver spellcaster, a cursing axe, a dexterity sword and shield, and a lightning striker).

| target                                                        | before | now      | goal                 |
| ------------------------------------------------------------- | ------ | -------- | -------------------- |
| 1. what 40 more points add to the typical main stat at 120    | 15%    | 23%      | about 30%+           |
| main stats gaining 10% or less past 120                       | 40%    | 24%      | about 10%            |
| 2. the typical main stat at 60                                | 50%    | 53%      | about 50%            |
| 3. notables worth 2.5+ that 40 more points add, at 120        | 1      | 2        | two or more for most |
| builds with none                                              | 7      | 1        |                      |
| 4. builds with a single plan at 120                           | 6      | 2        | none                 |
| builds with three or more plans                               | 15     | 28 of 32 | about half           |
| 5. typical tax at 120 (points on nodes the build values at 0) | 34%    | 31%      | a third or less      |
| builds above a third                                          | 15     | 9        |                      |

Targets 2 to 5 are met or close; target 1 moved about half way. Main stats at 120 against the pre-growth tree: median
1.05x (of 95 stat pairs, 26 are above 1.3x and 27 below 0.9x). Power moved between stats rather than up: spell and
elemental damage, weapon damage and energy shield rose; **life fell for almost every build** (the trade the growth asked
for: more wanted nodes than points).

Nearly every notable is in some build's plan at some budget. The most-taken at 120 are in 12 or 13 of 32 plans (Zeal,
Glass Skin, Ready Wit, Composure, Thick Blood, Hawk's Eye, Long Breath, Hard Target); before the growth the top four were
in 18 to 20 of 28.

## 2. Every archetype at 120 (before → now, and what 40 more points add)

From `G4/builds-final.txt`; units are small-node units of each stat. `–` is an archetype the pre-growth measure lacked.
The gave-up lists (what 40 more points would buy) are under each archetype in that file.

```
caster-es [mystic] choice 6, tax 31%: spell damage 21.0→19.8 (+66%); cold damage 9.2→16.4 (+6%); energy shield 32.4→39.6 (+17%); cast speed 11.3→10.8 (+28%)
sword-str [reaver] choice 5, tax 31%: life 38.8→23.2 (+28%); armour 19.8→20.2 (+33%); sword damage 27.9→33.8 (+4%); attack speed 18.6→7.2 (+36%)
mace-slam [vanguard] choice 3, tax 24%: life 46.6→28.2 (+11%); armour 21.2→21.5 (+42%); two-handed mace damage 19.0→30.0 (+26%)
mace-shield [vanguard] choice 5, tax 26%: life 41.8→29.0 (+22%); armour 17.2→15.2 (+7%); block 27.5→29.5 (+0%); mace damage 14.2→13.2 (+53%)
warcry-totem [vanguard] choice 3, tax 38%: life 44.8→20.6 (+76%); totem damage 10.1→16.7 (+0%); warcries –→11.8 (+8%)
spell-totem [zealot] choice 4, tax 31%: totem damage 4.0→2.0 (+300%); spell damage 20.8→31.8 (+0%); life 26.4→25.4 (+39%)
bow-crit [strider] choice 4, tax 24%: life 27.2→24.0 (+46%); evasion 25.6→26.0 (+21%); bow damage 29.8→35.0 (+13%); crit 14.5→8.5 (+105%)
bow-elemental [strider] choice 2, tax 23%: life 31.2→19.4 (+52%); evasion 25.6→28.5 (+25%); elemental attack damage 10.4→10.4 (+67%); bow damage 17.6→27.4 (+17%)
bow-poison [strider] choice 3, tax 27%: life 32.2→31.0 (+59%); poison 11.0→13.7 (+18%); bow damage 15.6→14.2 (+18%)
caster-life [mystic] choice 5, tax 31%: spell damage 13.8→24.3 (+16%); elemental damage 16.2→24.4 (+35%); life 34.4→25.4 (+41%); spell crit 6.9→19.4 (+21%)
summoner [mystic] choice 4, tax 36%: minions 21.5→26.5 (+0%); energy shield 37.8→45.6 (+14%); life 20.4→16.0 (+111%)
wand-attack [mystic] choice 3, tax 38%: wand damage 7.7→17.3 (+0%); energy shield 26.0→39.0 (+15%); attack speed 16.2→8.4 (+71%)
axe-bleed [reaver] choice 4, tax 35%: life 36.6→24.2 (+48%); bleed 22.3→28.0 (+0%); axe damage 12.7→14.0 (+14%)
dual-wield [reaver] choice 3, tax 28%: life 33.2→23.2 (+45%); dual wield 18.0→16.0 (+6%); evasion 27.1→25.0 (+31%)
fire-burn [zealot] choice 8, tax 35%: fire damage 16.5→32.5 (+15%); spell damage 14.5→13.5 (+109%); life 39.0→27.4 (+7%)
staff-block [zealot] choice 6, tax 30%: spell damage 20.8→32.6 (+28%); block 3.5→15.5 (+13%); life 38.0→25.0 (+18%)
aura-brand [zealot] choice 5, tax 32%: auras 18.7→23.0 (+0%); brand damage 17.2→26.3 (+23%); life 30.0→31.8 (+27%)
dagger-crit [shade] choice 1, tax 19%: life 25.8→22.4 (+31%); crit 23.3→27.3 (+24%); dagger damage 6.6→9.6 (+38%); evasion 26.8→31.2 (+11%)
claw-poison [shade] choice 1, tax 24%: life 29.8→28.4 (+44%); poison 16.7→16.2 (+8%); claw damage 7.6→8.0 (+45%)
trap-mine [shade] choice 6, tax 32%: trap and mine damage 13.7→17.7 (+23%); energy shield 23.8→20.8 (+65%); evasion 24.7→34.7 (+0%)
dagger-caster [shade] choice 9, tax 35%: spell damage 23.3→29.0 (+41%); spell crit 8.9→8.7 (+121%); energy shield 31.4→38.2 (+3%)
two-hand-fire [vanguard] choice 6, tax 24%: life 42.2→29.6 (+20%); armour 24.5→24.2 (+23%); fire attack damage 4.0→18.4 (+27%); two-handed damage 9.5→9.0 (+87%)
block-caster [zealot] choice 6, tax 31%: block 22.0→12.0 (+13%); spell block 6.0→10.0 (+0%); spell damage 8.8→20.8 (+12%); energy shield 19.0→23.6 (+44%)
storm-caster [zealot] choice 4, tax 32%: spell damage 17.8→30.7 (+4%); lightning damage 10.0→21.5 (+21%); life 38.0→24.4 (+16%); cast speed 9.3→11.8 (+0%)
channeller [mystic] choice 4, tax 28%: channelling and spell damage 16.8→31.3 (+14%); mana sustain 32.3→25.0 (+49%); energy shield 31.2→30.2 (+5%)
sceptre-fire [zealot] choice 4, tax 32%: life 38.2→22.0 (+70%); fire attack damage 10.0→20.0 (+0%); sceptre damage 12.7→17.1 (+0%); armour 25.8→22.2 (+9%)
curser [shade] choice 8, tax 41%: curses 11.0→10.5 (+114%); chaos and damage over time 12.3→12.3 (+33%); energy shield 32.2→37.8 (+15%)
dodge-blades [shade] choice 3, tax 18%: dodge 10.3→19.3 (+34%); evasion 25.6→31.2 (+11%); life 26.8→24.0 (+27%); blade damage 10.6→15.0 (+65%)
spellblade [reaver] choice 5, tax 39%: spell damage –→14.0 (+29%); cast speed –→10.0 (+20%); life –→42.6 (+27%); armour –→8.7 (+102%)
curse-attacker [reaver] choice 2, tax 38%: curses –→6.0 (+67%); life –→30.6 (+27%); axe damage –→14.7 (+0%)
sword-board [strider] choice 6, tax 24%: block –→19.0 (+11%); evasion –→26.3 (+8%); life –→28.8 (+9%); sword damage –→23.3 (+21%)
storm-blade [reaver] choice 5, tax 33%: lightning attack damage –→23.8 (+15%); attack speed –→13.0 (+38%); life –→28.8 (+36%)
```

## 3. For the user

1. **The inner Ford link.** The final looks audit asked to cut `bow.steel.hub.t`–`bow.steel.wayfarer.d`, the Strider
   home's longest link (622 units). It is the inner Ford link the user chose at stop 3; without it the Ford corner is 9
   steps from the Strider start instead of 6. The Strider fixer kept it. Keep or cut?
2. **The wand attacker** finishes the network's wand supply by 120 and spends its last points on attack speed and roads
   (tax 38%). Read as the same trade as U2 (a weapon finished by 120); no fifth wand cluster was added.
3. **Life.** Every strength build ends with less life at 120 than before the growth (sword 39 to 23 units, maces 42 to 47
   down to 28 to 30, sceptre 38 to 22, warcry totems 45 to 21), now about level with the Zealot casters (24 to 32). This
   is what "not all the life, all the armour and all the sword damage" costs; whether strength classes should end level
   with casters in life is the user's call.
4. **Two Zealot casters still open in the Mystic.** Fire (34 Mystic nodes of 60) and storm (40 of 60) go to the Cloister
   for spell damage and lightning; the staff, shield, totem and aura casters now open at home. A Vigil re-line was tried
   and changed nothing, so it was left.
5. **What G5 holds:** node prices, attribute supply against gear (oversupplied; roads +7 to +5 proposed), keystone
   distances (the bow's keystones are early picks), area labels, the save-version bump with one refund at ship, one bot
   sim, docs; patch notes through `/patch-notes` only.
