# Flask nodes on the passive tree: a draft for review (2026-10-31)

This is a proposal, not a decision. Nothing on the tree has been changed yet. All numbers are starting guesses that
playtesting will adjust.

## Background: how flasks work on this branch

- A flask holds charges. Each drink spends a fixed number of charges. The first life flask holds 37 charges and spends 7
  per drink, so it gives five drinks when full.
- Killing monsters no longer refills flasks. Flasks are refilled at a Respite, when a boss dies, by a reprieve, at the
  Quartermaster or the Bloodletter, and by some relics and provisions. A character can also earn charges from kills
  again, but only by investing in it: passive nodes, flask affixes or uniques.
- Charges carry over from one map to the next, so every drink is spent from a supply that has to last until the next
  refill.
- The belt has five slots. Each slot drinks automatically when life (or mana) falls below its threshold: slot 1 at 85%,
  slot 2 at 70%, slot 3 at 50%, slot 4 at 30% and slot 5 at 15%.

## What the owner decided (docs/ATTRITION.md section 2)

- A life flask is mostly a supply to be rationed over the run. A build may also set aside one or two flasks as emergency
  flasks, kept for when things go badly wrong.
- Spending passive points on flasks should do two things: make a refill last longer, so the character needs fewer
  refill stops, and make each drink stronger.
- Flask nodes compete with the other ways to sustain life (regeneration, leech, energy shield). A build can take flask
  nodes as well as those, but it costs more points.
- Life flasks matter most, mana flasks second, utility flasks third. All three can be improved.
- Flask nodes are spread evenly over the six regions of the tree; no region is "the flask region".
- Flask nodes are judged by playing the game, not by the character sheet's numbers or by bot runs.

## 1. What the tree has now

27 nodes carry a flask stat. 9 of them are notables. 14 of the 27 are in the Strider's region, and the Zealot's region
has none.

Only the Strider's region sells flask charges gained on kill (seven lines, adding up to 109%). In the game's terms, 100%
means one charge for every flask per normal monster killed (magic, rare and unique monsters give more). So taking all
seven lines refills about one drink of the first life flask for every six normal kills.

Five of the six starting areas have almost the same flask notable 5 or 6 points from the start. Each mixes flask
recovery, flask effect and flask duration:

| Class (region) | Notable           | Points from start | What it gives                                                    |
| -------------- | ----------------- | ----------------- | ---------------------------------------------------------------- |
| Mystic         | Draught           | 5                 | 12% flask effect, 12% flask recovery, recover 2% of mana on kill |
| Shade          | Smuggler's Flasks | 5                 | 15% flask effect, 15% flask recovery, 15% flask duration         |
| Strider        | Quick Sip         | 5                 | 24% flask charges gained, 10% flask recovery                     |
| Reaver         | Field Dressing    | 6                 | 20% flask recovery, 20% flask duration                           |
| Vanguard       | Camp Stores       | 5                 | 20% flask recovery, 12% flask effect                             |

Further out, the Strider's region has five more flask notables (Hunter's Satchel, Spare Stock, Field Kit, Supply Line,
Field Poultice), and the centre has Provisions (flask effect, flask recovery and mana regeneration).

## 2. The kinds of flask stat the tree could offer

**Stats that make a refill last longer**

- **Flask charges gained on kill.** Already on the tree. Its text is wrong: the tree says "24% increased flask charges
  gained", but what it actually does is add 0.24 charges per kill, and items already describe it that way. The tree text
  should match. It is one of the strongest kinds of sustain in the game, so it becomes rare and far from the starts (see
  "Charges on kill" below), and mostly comes with a condition.
- **Reduced flask charges used per drink.** Already on the tree, unchanged.
- **Increased maximum flask charges.** New. Today only a flask's own affix can raise its maximum charges; a passive node
  cannot. This would need a small code change. It is the only one of these three that works without killing monsters.

**Stats that make each drink stronger**

- **Increased flask recovery** (life and mana flasks both). Already on the tree, unchanged.
- **Increased life recovery from flasks** (life flasks only). New on the tree; the game already supports the stat.
- **Increased mana recovery from flasks** (mana flasks only). New on the tree; the game already supports the stat.
- **Faster life flask recovery**: the same amount of life, delivered in less time. New on the tree; it already exists as
  an item affix. Useful for an emergency flask, which needs to heal quickly.
- **Increased flask effect.** Already on the tree. It raises how much a flask recovers and also strengthens utility
  flask buffs, so this is the stat that helps utility flasks.
- **Increased flask duration.** Already on the tree. Utility flasks last longer, and life and mana flasks recover more
  over the longer time.

**Charges on kill, with a condition** (new; the owner, 2026-10-31)

Charges on kill should be rare on the tree and placed far out, so that stacking them costs a lot of points. Each line
counts only enemies killed _by_ something (the owner, 2026-11-01): the killing blow must come from that source, not
merely land while the enemy is burning or bleeding. That is much harder to arrange, so it is a real build choice. Ideas,
one for each region's character:

| Class    | Line                                                                               |
| -------- | ---------------------------------------------------------------------------------- |
| Mystic   | flask charges when an enemy is killed by burning                                   |
| Shade    | flask charges when an enemy is killed by poison                                    |
| Reaver   | flask charges when an enemy is killed by bleeding                                  |
| Strider  | flask charges on kill for each fervour charge you have (a small amount per charge) |
| Vanguard | flask charges on kill for each grit charge you have (a small amount per charge)    |
| Zealot   | flask charges on kill for each insight charge you have (a small amount per charge) |

The Strider, the Vanguard and the Zealot use a different form (the owner, 2026-11-01): an amount per charge held,
fervour (the dexterity charge, already used in the Strider's region) for the Strider, grit for the Vanguard and insight
(the intelligence charge) for the Zealot, because kills by minions or by long-range projectiles would be too easy.

Code needed: today the game remembers that damage over time killed an enemy, but not which kind (burning, poison and
bleeding are dealt together in one tick), so it must record the kind that dealt the blow. A stat per charge held
already works on kill, so the fervour, grit and insight lines need little code.
At most one charges-on-kill notable per region, at least about 10 points from any start, on a notable rather than small
nodes.

**Stats for an emergency flask** (new; both options need new code; both are wanted, in different regions)

- **Option A, by belt slot:** stats that improve only the flask in slot 5 (the one that drinks at 15% life), for example
  more recovery, or recovering all at once instead of over time. The player decides which flask is the emergency flask
  by putting it in slot 5.
- **Option B, by life when drinking:** "life flasks drunk while below 30% life recover more". Slots 4 and 5 (which
  drink at 30% and 15%) automatically become the emergency slots.

## 3. How the flask nodes would be placed

- **Spread evenly.** Each of the six regions gets about the same amount: one flask notable near its start, one further
  out, and a few small nodes. The centre keeps Provisions. That comes to about 24 nodes, slightly fewer than the 27 now,
  because total sustain on the tree should stay about the same or come down a little. The Strider's region would go
  from 14 flask nodes to about 4, and the Zealot's would gain about 4.
- **Every starting area different.** Each start's nearby flask notable gives a different kind of stat, chosen to suit
  that region. No charges on kill near any start:

  | Class    | Near the start                                                  | Further out                                | Far out (about 10+ points)         |
  | -------- | --------------------------------------------------------------- | ------------------------------------------ | ---------------------------------- |
  | Mystic   | mana flask recovery, fewer charges per drink                    | flask effect (for utility flasks)          | charges for kills by burning       |
  | Shade    | faster life flask recovery                                      | emergency flask, option A (slot 5)         | charges for kills by poison        |
  | Strider  | fewer charges per drink, flask effect                           | flask duration (utility)                   | charges on kill per fervour charge |
  | Reaver   | life flask recovery, flask duration                             | emergency flask, option B (below 30% life) | charges for kills by bleeding      |
  | Vanguard | more maximum charges                                            | life flask recovery                        | charges on kill per grit charge    |
  | Zealot   | flask effect and duration (the region is about auras and buffs) | more maximum charges                       | charges on kill per insight charge |

- **Flask nodes compete with other sustain.** A flask node gives no regeneration, leech or "recover on kill". Three
  notables have one today (Draught, Supply Line and Provisions); it would move to another node. A build that wants
  flasks and regeneration has to pay points for each.
- **Life first.** Most flask stats help life flasks. Mana-only flask stats go where mana builds live (the Mystic's and
  the Zealot's regions). Utility flasks gain through flask effect and flask duration.
- **Nodes may be added and moved** (the owner, 2026-10-31). The Strider's region loses most of its flask notables, so it
  needs new non-flask notables in their place, designed for the region's own builds (moving against standing still,
  Quickened and Elusive). Other regions get new nodes or clusters where their flask share needs room. The checks from
  the tree revision must still pass afterwards (no notable hung behind another, start distances, no crossings).

## 4. Still to decide

- Which conditions the charges-on-kill notables use (the table in section 2 is a first set of ideas).
- The total number of flask nodes: about 24, or another number.
- Whether the table of regions above is right.
- Whether to add "increased maximum flask charges" to the tree.
- First prices. The point costs of the flask stats were set before flasks became scarce. The proposal is to start each
  flask notable at about the value of a regeneration notable in the same region, then adjust by play.
- Names that clash with the stops and provisions (Provisions, Draught, Camp Stores) are left to the naming pass.

## 5. As built (2026-11-01)

Built from sections 2 and 3 by one builder per region, the centre by the lead. Engine and lines in commit 401e2f8: the
global `flaskMaxCharges`, `flaskChargesKilledBy` (the kind of damage over time that dealt the killing blow,
`dotKind` in `src/sim/combat.ts`), `flaskChargesPerCharge` (the live charges held), and the two emergency lines
(`src/sim/flaskDrink.ts`). 30 flask nodes (19 notables, 11 smalls), against 27 (9 notables) before and the draft's "about 24"; the tree has 1,375 nodes.
Every flask notable is priced at about 4 to 4.5 units, near its region's regeneration notable, and carries no other
sustain. No flat charges on kill is left anywhere.

| Class    | Near the start                                                                     | Further out                                                       | Far out                                                              |
| -------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------- |
| Mystic   | Draught (5): 30% mana flask recovery, 8% fewer charges a drink                     | Distilled Grace (9, new): 20% flask effect                        | Ember Tithe (12, new): +0.5 charges for a kill by burning            |
| Shade    | Smuggler's Flasks (5): 45% faster life flask recovery                              | Hidden Vial (10, new): 60% life from the last belt slot's flask   | Slow Harvest (12, new): +0.5 charges for a kill by poison            |
| Strider  | Quick Sip (5): 10% fewer charges a drink, 10% flask effect                         | Slow Measure (10, was Spare Stock): 40% flask duration            | Heat of the Chase (11, new): +0.12 charges a kill per fervour charge |
| Reaver   | Field Dressing (6): 24% life flask recovery, 20% flask duration                    | Bitter Dregs (10, new): 50% life from flasks drunk below 30% life | Bled Dry (10, new): +0.5 charges for a kill by bleeding              |
| Vanguard | Camp Stores (5): 24% maximum flask charges                                         | Stout Measure (9, new): 48% life flask recovery                   | Hard-Won Rations (12, new): +0.12 charges a kill per grit charge     |
| Zealot   | Anointing (5, new): 12% flask effect, 20% flask duration                           | Sacristy (11, new): 18% maximum charges, 20% mana flask recovery  | Cup of Revelation (13, new): +0.12 charges a kill per insight charge |
| Centre   | Provisions (12): 12% flask effect, 20% flask recovery (its mana regeneration went) |                                                                   |                                                                      |

Each notable has one or two flask smalls before it. The Strider's other flask notables became notables of its own builds:
Slip the Pack (was Hunter's Satchel: Elusive on kill, movement speed), Reedwalker (was Field Kit: evasion, Elusive when
you evade), Hound's Blood (was Field Poultice: Quickened on crit, critical strike chance); Supply Line went, and its life
on kill with it. Draught's mana on kill was dropped (the Spire has it on Siphon).

Left open: prices (the Shade's regeneration notables cost about 5, more than the common scale); the Strider's new
notables use event buffs the Skills and Items comparisons count as always up (R-final risk 1; the Character tab now has checkboxes, "Count as true", to see the numbers with and without each situation); Stout Measure and the far notables are dead
ends past 8 steps; labels crowd at Ember Tithe, Hard-Won Rations, Bitter Dregs, Heat of the Chase and Anointing (label
pass); every new name waits for the naming pass; the new nodes are not registered and the tree is not baked. A drink queued behind a running flask now asks the emergency lines when it starts.
