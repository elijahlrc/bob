# Bob — The sustain pass

Status: planned and built 2026-11-02 on the `flask-scarcity` worktree branch; the lines that raise how much replenish
wins back and change its window (section 6) were approved and built 2026-11-03. It continues docs/ATTRITION.md (whose
section 6 logs it). Section 4 lists what is still open.

## 1. Why

The owner (2026-11-02): the run's difficulty should come much more from sustain. Self-recovery should be weak enough
that a character can't keep going without stopping to refill (the Respite, the reprieves and the other refills) more
often. Bigger life and mana pools make up for some of the lost difficulty, so a single fight is no harder; the run as a
whole is.

The 2026-11-01 pass cut the tree's regeneration, leech and life on hit by 40% (ATTRITION.md section 6). This pass goes
much further and reaches gear, uniques and gems as well.

## 2. Decided (the owner, 2026-11-02)

**Self-recovery that can heal to full is cut.** For gems and items the baseline is main; for the tree it is the reworked
tree before the 2026-11-01 cut (main never had this tree), whose numbers are restored.

| Where the line is          | Range given | Starting value | Lever                 |
| -------------------------- | ----------- | -------------- | --------------------- |
| Passive tree               | 80 to 90%   | 85%            | `TREE_RECOVERY_SCALE` |
| Gems (supports and skills) | 80 to 90%   | 85%            | `GEM_RECOVERY_SCALE`  |
| Items: affixes and uniques | about 75%   | 75%            | `ITEM_RECOVERY_SCALE` |

The lines cut: life regeneration (flat and % of life, and the conditional kinds, flat cut the same as %), life on block,
and the share of life recovered on a block, critical strike or evade. Mana regeneration is not cut. Life leech, life on
hit and life on kill (flat or a share) are replenish (below) and keep their numbers.

**Replenish** replaces life leech, so a character can win back much of the damage it just took but can't heal to full
unless it was full when that damage landed:

- It is gained like leech, from the damage the character's hits deal, and paid out over time at the leech speed (each
  leech 2% of maximum life a second, all of them 20%, at most 10% of maximum life from one hit).
- What it can recover is capped by a pool: a share of the life lost in the last 5 seconds, less what replenish has
  already won back in that time. With no life lost in the window it does nothing. What a hit leeches past the room left
  is lost, not saved for later damage.
- **Life on hit and life on kill**, flat or a share of life, draw on the same pool (life on kill: the owner, the same
  day, after the build).
- **What fills the pool:** life lost, including to the character's own costs and burning (life costs, Surge of Blood,
  self-burn, the Flaying relic, a sacrifice). Damage to energy shield does not, except under Shade Leech (and Leechrake,
  which grants it), where replenish restores energy shield and damage to it fills the pool.
- **How much of the lost life it can win back** starts at 50%, at most 95%. Lines that raise it add their number to it (+10% takes 50% to 60%).
- **The window** is 5 seconds, between 2 and 10. Lines change it by a percentage; a shorter window can be a unique's or
  a notable's price.
- **Leech speed** keeps its own stat and lines.
- **"While leeching"** bonuses (the tree's, Slaughter Pendant, Fangbound Gauntlets) hold while replenish is winning
  something back, and are 35% stronger.
- **Unchanged:** mana leech and energy shield leech stay plain leech. Instant leech (Blood Bargain, Thirsting Paw,
  Bloodquick Gauntlets, Sharpwit Gauntlets) pays out the pool at once. Blood of the Untouched stays (evasion builds
  still get hit). Monsters and minions keep plain leech.
- **Cut:** Ebbing Cincture no longer drops (its life leech to energy shield on full life can't work as replenish).

**Energy shield** ends at 40% of main (`ENERGY_SHIELD_SCALE` 0.4), in the same places the first cut was taken (item bases
and flat energy shield affixes). Its recharge is unchanged.

**Life** is doubled at the source (`LIFE_SCALE` 2): base life by level, every flat life line (tree, gear, uniques) and
the life from Strength. **Mana** gets 50% more the same way (`MANA_SCALE` 1.5), with the mana from Intelligence.

**Flasks** heal 20% more life (`FLASK_LIFE_SCALE`), a hybrid flask's life part included; mana recovery is unchanged.

**Items already owned keep what they rolled**; only new rolls follow the new numbers.

**Weak nodes stay.** A tree node whose regeneration is now small is kept as it is, just weak.

**Keystones:** the two life-is-1 keystones are already off the tree on this branch.

## 3. How it is built

- The levers are in `data/constants.ts`. `data/sustain.ts` applies them where the data is made: the tree's line helpers
  (`passives/lines.ts`, so a small node's name shows the new number), the affix tiers (`expandFamily`), the base
  implicits, the uniques, the unique flasks and the gems. Values round to whole numbers (flat life and mana, life on
  kill and on block), tenths (flat regeneration) or twentieths of a percent (shares), never to nothing.
- Replenish is `sim/replenish.ts`, fed by `applyDamage`, skill life costs and sacrifices, and drawn on by life leech and
  life on hit in `sim/combat.ts`. The share and window are `Defence.replenishShare` and `replenishWindow`.
- The text says "Replenished as Life"; the glossary and the Character tab (a Replenish Limit row) explain it.
- No node moved, so the tree needed a bake but no save version bump.

## 4. Open

- **The emergencies aimed at self-recovery** (Parched, Scarred, Bloodless, Smothering) now act on smaller numbers.
  Whether they need retuning is open.
- **Camp's 10 seconds of rest** come from regeneration, so they now give back less life.
- **Monster damage:** with twice the life and the same damage, a fight takes about half as much of the pool. The
  playtest decides whether monster damage moves.
- **Uniques' and the tree's energy shield** (beyond item bases and flat affixes), for the 40% target.
- **Energy shield regeneration and energy shield on hit:** not cut.
- **Minions and duels:** minions keep their own recovery and life. A duel's bonus life (the curve by the other side's
  level) is a third of what it was (`DUEL_LIFE_MULT_TOP` 1 + 9 × 0.33, the owner, the same day). Without that curve, a
  level 30 starter beats a level 1 one in 157 s with 54% of its life left, an even fight lasts 181 s (cap 200).
- **Left as they were:** the relics' flat life (Weakest Vein, the Marksman's Pulse) is not doubled; energy shield leech
  keeps the 2026-11-01 cut; the Character tab's sustain figure for a skill paid in life counts regeneration only (it is
  information, the DPS assumes full use).

## 5. Work

1. The levers, life, mana and flasks. Built.
2. Energy shield to 0.4. Built.
3. The recovery cut: tree (restored, then cut, and baked), gems, items. Built.
4. Replenish: the pool, leech and life on hit on it, the share and window stats, "while leeching" 35% stronger, the
   text, Ebbing Cincture out of the drop pool. Built.
5. A playtest by the owner.
6. The lines that raise how much replenish wins back and change its window (section 6). Built 2026-11-03.
7. Tests are left red while the numbers move (ATTRITION.md section 5).

## 6. Lines that raise how much replenish can win back, and that change how far back it looks (the owner approved, 2026-11-03)

Replenish wins back at most 50% of the life lost in the last 5 seconds. Two stats change that. On a card they read:

- "+X% of recent Life lost can be Replenished": X is added to the 50%, up to 95%. +10% makes it 60%.
- "X% longer Replenish window" (or shorter): how far back replenish looks, as a percentage of the 5 seconds (2 to 10
  seconds). 20% longer is 6 seconds, 50% longer 7.5, 30% shorter 3.5, 40% shorter 3.

Every line below is added to a node or item that already has replenish on it; no node moves, so no save version bump.
"Replenishes" below means the existing lines that turn a share of damage dealt into life ("1.2% of Attack Damage
Replenished as Life").

**Passive tree.** All together, +68% of recent life lost; Red Harvest, Crimson Reaping and the small nodes between them
give 24 of it.

| Node                       | What it has now                                         | Adds                                               |
| -------------------------- | ------------------------------------------------------- | -------------------------------------------------- |
| Red Harvest (notable)      | replenishes 1.2% of attack damage, 10% faster           | +10% of recent life lost can be replenished        |
| Crimson Reaping (notable)  | replenishes 0.8% of damage, 20% faster                  | +8% of recent life lost, and a 20% longer window   |
| Red Harvest's three smalls | replenish 0.4% of attack damage each                    | two of them change to +3% of recent life lost each |
| Red Thirst (notable)       | 41% more damage while replenishing, replenishes 0.5%    | a 20% longer window                                |
| Vampiric Strikes (notable) | replenishes 0.8% of melee damage, 6 life on melee hit   | +8% of recent life lost                            |
| Thirsty Quiver (notable)   | replenishes 0.8% of attack damage, 4 life on hit        | +8% of recent life lost                            |
| Alms (notable)             | replenishes 1% of attack damage, 6 life on hit          | +8% of recent life lost                            |
| Bloodletter (notable)      | replenishes 1%, 11% attack and cast speed while it does | +15% of recent life lost, and a 30% shorter window |
| Hard Living (notable)      | 10 life on hit, 20 life on kill                         | +5% of recent life lost                            |

Bloodletter is the trade: it raises the most of any node, but looks back only 3.5 seconds, so it suits a build that
replenishes fast.

**Weapon affix**: a new suffix on weapons only, "+X% of recent Life lost can be Replenished": +4%, +7% and +10% at item
levels 30, 50 and 70 (two-handed weapons +6%, +10% and +15%), as common as the weapon life leech prefix. Names of our
own, for example "of Mending", "of Stitching", "of the Suture".

**Uniques**:

| Unique            | What it has now                                                | Adds                                               |
| ----------------- | -------------------------------------------------------------- | -------------------------------------------------- |
| Slaughter Pendant | replenishes 1.2–2% of damage, 41–54% more damage while it does | +15% of recent life lost                           |
| Bloodtithe Claw   | replenishes 3% of damage, 19 life on hit                       | +10% of recent life lost                           |
| Gorge Mallet      | replenishes 1% of damage, 3% against bleeding enemies          | +10% of recent life lost                           |
| Leechrake         | grants Shade Leech                                             | +10% of recent life lost                           |
| Thirsting Paw     | replenishes at once                                            | +10% of recent life lost, and a 40% shorter window |
| Flensing Hatchet  | replenishes 2% of damage at half speed                         | a 50% longer window                                |
| Bent Hourglass    | replenishes faster (+30% twice)                                | a 50% longer window                                |
| Gilded Malice     | replenishes 100% faster                                        | a 30% longer window                                |

A longer window suits slow replenishing: it gives the slow payout time to win the damage back before it drops out.

**A build that goes all in** reaches the 95% limit: Red Harvest, Crimson Reaping and two of Red Harvest's smalls (+24%),
Vampiric Strikes (+8%), a top weapon affix (+10%) and Slaughter Pendant (+15%) make 50% + 57%, held at 95%. One notable
and one affix give about 65%; a build that takes none stays at 50%.

**How it is built**: two line helpers in `passives/lines.ts` (`replenishShare`, `replenishWindow`, also in the
editor's `vocab.ts`) and the lines above in the area files, baked; the weapon families `replenishShare` (one-handed)
and `replenishShare2h` in `data/affixes.ts`; the eight uniques through their decision files
(`reference/coverage/uniques/`, then `npm run coverage:emit`). Owned items keep what they rolled. The decision files sit
in the local `reference/` folder, which this worktree shares with the main checkout: an emit on main before this branch
is merged would pick up these lines and the "replenish" gem text.

## 7. After the leaderboard recovery audit (the owner, 2026-11-05)

**What was measured.** The top 15 characters on the save-version-25 high scores were played headless through the same
four level-100 maps (the map-99 layout, which ends on a rare; no affixes; default difficulty) from 60% life, with every
point of life recovered traced to its source; then the nine that survive a level-100 map played two chains of five maps,
carrying life, shield and flask charges with the camp's rest between maps. What it showed:

- Life regeneration is at most 0.5% of maximum life a second and under 10% of the healing for 14 of the 15.
- The Mystics heal mostly from flasks (69 to 89% of their healing) but are hit little; their shield soaks about half of
  what reaches them on hard maps.
- The melee builds heal mostly from replenish (leech, life on hit); one got half its healing from consecrated ground at
  6% of maximum life a second and hardly drank.
- Flask charges run down over three to five maps and do not come back on their own, but about two full life flasks (3.3
  flasks in all) dropped a map at level 100, so a drained flask could be swapped for a fresh one.

**Decided.**

| What                       | Was        | Now                 | Lever                                 |
| -------------------------- | ---------- | ------------------- | ------------------------------------- |
| Flasks among item drops    | 15%        | 3.75%               | `FLASK_DROP_CHANCE`                   |
| A dropped flask's charges  | full       | even, empty to full | `FlaskItem.fill`                      |
| Consecrated ground         | 6% life/s  | 0.5% life/s         | `REGEN_CONSECRATED` (`sim/fields.ts`) |
| Replenish share            | 50%        | 45%                 | `REPLENISH_SHARE`                     |
| Flat energy shield (items) | 0.4        | 0.3                 | `ENERGY_SHIELD_SCALE`                 |
| Energy shield on the tree  | 4 clusters | replaced            | the area files (below)                |

The four shield clusters replaced on the tree: the Cloister's recharge cluster becomes wand crit, the Lantern's High
Veil cluster fire penetration and burning, the Cathedral Gate's Wake cluster spell crit, and the Stair's Shifting Ward
cluster chaos spell crit. Reward picks and the Quartermaster's flasks still arrive full.

**Refund.** Every run in progress gets its whole tree back as unspent points when it next loads, through a tree revision
kept apart from the save version (`TREE_REVISION`, `refundOldTree` in `src/run/save.ts`). The save version stays at 25, so
the high scores and the rivals are untouched; a rival's build keeps its nodes, which now carry the new lines.

## 8. All life won back in a fight is replenish (the owner, 2026-11-06)

Life on block, life won back on any event, curses that give life, skills that mend the character and triggered heals on
uniques now draw on the replenish pool too, and every life line that does says "Replenish". Flasks, regeneration and the
Tithe of the Servants do not; energy shield gains are unchanged. With more drawing on it, the replenish share goes back
from 45% to 50% (`REPLENISH_SHARE`). What is covered, and the plan to show the limit to the
player (a band on the life orb, a map report line, a sheet section), is docs/REPLENISH.md.

**Measured again** (the same nine builds, the same two chains): about 1.2 flasks dropped a map at level 100, 0.4 of them
life or hybrid, each partly full, against 3.3 and 2.0 full before. The build that healed from consecrated ground drank more
and died at the end of its second chain with an empty belt; the Mystic that lost its shield nodes died on a map it had
cleared; the rest changed little. Deaths went from 6 to 7 over the eighteen chains. The bot does not swap flasks, so the
chains do not show the drop change itself.
