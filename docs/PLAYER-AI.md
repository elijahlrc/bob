# How your character thinks

Bob plays itself. You choose the build: gems, gear, tree, flasks and map. The character then makes every move on
its own. This page explains how it decides what to do, so you can build around its habits instead of fighting them.

Much of this can be changed on the **Strategy tab** in camp: what each skill is for, when it is used and in what
order, whom the character fights first, how a ranged character keeps its distance, and when flasks are drunk. Each
section below gives the default and says what the tab changes. You never have to touch the tab: the defaults play
sensibly.

Distances are in **tiles**. Unless noted, every rule below comes straight from the game code (`src/sim/ai.ts`,
`src/sim/utility.ts`, `src/sim/flaskPolicy.ts`).

---

## 1. The decision loop

Every tick, the character goes down this list and does the **first** thing that applies:

1. **Busy?** If it is stunned, frozen or partway through an action, it does nothing new. An attack in progress
   is never cut short.
2. **Standing in danger?** If so, it steps out (section 3).
3. **Enemy in range?** If so, it fights (sections 2, 4 and 5).
4. **Loot nearby?** If so, it picks it up (section 7).
5. **Otherwise** it walks the route, and at the end it heads for the exit (section 8).

Flasks are drunk separately, on their own rules (section 6), and never cost a turn.

By default the character **never retreats or kites**. Dodging (step 2) is its only defensive movement. Once it
decides to fight, it walks toward the target until the target is in reach, then stands and attacks. Your defences
have to handle everything that reaches it. A ranged character can be set to **kite** instead (section 4.4).

---

## 2. Choosing a target

- **It notices enemies within 9 tiles** that it can see. Walls block its sight. Burrowed enemies and veiled ones
  that are still out of range don't count.
- **It goes for the nearest one.** On a tie, it picks the one with less life.
- **Nests and pylons come first.** For targeting, they count as 4 tiles closer than they really are, so the
  character breaks off to kill them. It goes for a **pylon even through a wall**: everything a pylon protects is
  untouchable until it falls. A nest it must still see.
- **What a pylon protects is never a target.** A monster inside a pylon's ward is passed over when the character picks a
  target, and dropped the moment the ward covers it (a blow already under way still lands). The ward drops for one second
  in every six, and in that second those monsters are fair game.
- **So do a boss's creatures** (docs/BOSSES.md): the Magistrate's Witnesses, which it must see, and the Unmaker's
  shards, which it goes for even through a wall, since a shard holds a piece of your build until it breaks.
- **It doesn't stick to a target.** It looks again about ten times a second and always switches to whatever is
  now nearest. In a crowd it hits whichever enemy is closest, and will not focus a rare at the back of the pack.
  _Area damage, chaining and pierce suit this habit._
- **The Strategy tab's Target setting** changes this:
  - **Rares first:** rare, champion and boss enemies count as 4 tiles nearer, so the character breaks off for them.
  - **Weakest:** the enemy with the smallest share of its life left goes first.
  - **Stick to target:** it keeps its target until it dies, gets more than 12 tiles away or is dropped by the stall
    breaker, whatever comes nearer.
- **It lets go** of a target that dies or moves more than 12 tiles away.
- **Stall breaker:** if it deals no damage to its target for **20 seconds**, it ignores that enemy for **30
  seconds** and moves on. If the enemy is chasing, it will come back to the character later. This stops a run from
  hanging on an enemy it can't hurt, but you lose time and may arrive at the next pack with an enemy following.
- **Screened targets:** if its hits have not reached its target for **4 seconds** while at least 3 of them landed on
  other enemies (minions summoned in front of it, a pack in the way), it sets that target aside for **4 seconds** and
  fights what is in the way. This is not counted as a stall.

---

## 3. Dodging

If the character is standing in a **lasting ground zone**, a **blast about to land**, or a **monster's area attack
that is winding up** (the warnings drawn on the ground: circles, wedges, rings and lanes), it tries to step out.
**A boss is never dropped**: its shield or its regrowth can
hold its life up for a while, and there is nothing to move on to.

- It checks 16 directions at 1.5, 2.5 and 3.5 tiles and takes the **shortest step** that lands outside every
  warning.
- The step has to keep its **current target in reach**, and in sight for a ranged skill. **It will not dodge out
  of the fight.**
- It won't step **through a monster's body**: the monster would push it along, and the warning would move with
  it.
- **A blow that follows it cannot be stepped out of** (the Magistrate's Sentence): the character does not try,
  and keeps attacking. Only defences answer it.
- **If no step works, it stays where it is and takes the hit.**
- **It never dodges for long.** After 10 seconds of dodging it stops for 5 seconds, stands in whatever is on the ground and
  fights. The 10 seconds is a budget: every second it does not dodge gives back half a second, so many short dodges
  count as one long one.

_Strategy:_

- Long range gives the character more safe spots. A ranged build can step away from a slam and keep shooting,
  while a melee build may have nowhere to go and stay in the warning.
- A melee character in a crowd is often boxed in by bodies. Build defences to take telegraphed hits, or kill
  packs before they set up.
- Dodging is the character's top priority after being busy. A boss that keeps a warning under the character keeps
  it from attacking, so faster attacks (shorter use time) mean more damage between dodges.

---

## 4. Which skill it uses

Every active skill you socket has a **role**, and the skills that aren't main skills have an **order**. Both are
on the Strategy tab.

| Role          | What it means                                                                                                                                                                                                                                                                              | Default for              |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------ |
| **Main**      | The filler: used whenever no other skill is called for.                                                                                                                                                                                                                                    | The ★ primary skill      |
| **Periodic**  | Used every so often: when its own cooldown allows, or after a pause.                                                                                                                                                                                                                       | Every other damage skill |
| **Keep up**   | Kept going: a buff renewed as it runs out, a curse or a damage-over-time debuff kept on the target, a Tempest Mote's orb cast again as it runs low or once the target is out of its reach, Pyre Burst's three geysers and Orbiting Blades' ten blades each renewed as one runs low.        | —                        |
| **Opener**    | Used once at the start of each fight, and once on each rare, champion or boss.                                                                                                                                                                                                             | —                        |
| **Emergency** | Used when life falls below a threshold you pick (30% to 70%).                                                                                                                                                                                                                              | —                        |
| **Escape**    | A way out: a blink or a run. Two boxes, both ticked by default: **Low health** (life below a threshold, 10% to 80%, with an enemy within 5 tiles) and **Surrounded** (3 or more enemies within 4 tiles, however healthy). A blink goes to the safest spot in reach, away from the enemies. | —                        |
| **Auto**      | A utility skill's own judgement (section 5).                                                                                                                                                                                                                                               | Every utility skill      |
| **Off**       | Never used.                                                                                                                                                                                                                                                                                | —                        |

Every role can also have a **condition**: any fight, **packs** (3 or more enemies within 7 tiles of the character),
**few enemies** (fewer than that), **rares and bosses** (the target is rare, a champion or a boss) or **bosses
only** (a champion or a boss). A skill whose condition doesn't hold is skipped.

A fight starts when the character finds a target after 2 seconds without one.

### 4.1 Each decision

Each time it is free to act and has a target, the character goes down this list:

1. **The non-main skills, in their order.** It uses the first whose role calls for it now, whose condition holds,
   and that it can use **from where it stands** (the target is in its reach, and in sight for a ranged skill). A
   utility skill follows its own rules (section 5). By default the order is: emergency skills, utility skills, other
   damage skills, then periodic skills with the longest pause first.
2. **The main skills, in their order.** It uses the first whose condition holds and that it can use, and walks
   into its reach if it has to.
3. **A periodic skill that is ready early.** If no main skill can be used, for example because it is on cooldown or
   unaffordable, a periodic skill that is in reach and off its own cooldown is used, ignoring its pause.
4. **The weapon.** Otherwise it uses its **default weapon attack** (a bow shot with a bow, a basic strike
   otherwise). This attack costs nothing, so the character never stops attacking because it ran out of mana. It
   just hits much weaker until the mana returns.

Any skill is skipped when:

- it has a **cooldown of its own** and no use is ready (it isn't holding a use and can't spend charges to bypass
  the cooldown), or it spends charges and you don't hold enough,
- the target is **immune** to every damage type the skill deals,
- you **can't pay** the cost (mana, or life for a skill paid with life),
- the skill puts down totems, traps or mines and **all of them are out**,
- the skill **needs a corpse** and none is near the target (within 6 tiles of it and in the character's reach).

A main skill that is a **renewable debuff** (like Creeping Plague) also waits while it is on the target with more than
0.8 s left, so the next main skill or the weapon is used meanwhile.

### 4.2 Periodic skills

- A periodic skill with a **cooldown of its own** is used whenever a use (or a charge that stands in for one) is
  ready.
- One **without** a cooldown waits a pause after each use: by default **6 of its own use times, and at least 3
  seconds**. On the Strategy tab you can set the pause to 1.5, 3, 5, 8 or 12 seconds.
- A periodic skill can have **less reach than the main skill**. It is then used whenever an enemy happens to be
  within its reach, for example a melee skill on a bow character when something closes in. The character won't walk
  in for it, and the sheet doesn't count its damage.

_Strategy:_

- **Running out of mana costs damage.** Watch your mana. A mana flask drinks only below its threshold (section 6), and
  kills don't refill it: between drinks, regeneration pays for the skills.
- **A main skill with a cooldown of its own** leaves gaps. They are filled by a ready periodic skill if you have
  one, or by the weapon if you don't.
- **Every other skill takes time from the main one.** Each cast uses its own cast time, which the main skill doesn't
  get.
- **Immune enemies** are hit with your other skills or your weapon. A build with a single element can still hurt
  them if a second skill or the weapon deals another damage type.
- **Two main skills with conditions** give you a pack skill and a single-target skill: set one to Packs and the other
  to Few enemies (or Rares and bosses). Give the last main skill the condition Any fight, or in some fights none of
  them fits and the character uses its weapon. The tab warns you when that can happen.

The Character sheet and the Strategy tab show the DPS of your rotation **against a pack** and **against a boss**.
Item, gem and craft comparisons weigh the two 70% to 30%.

The sheet gets there by playing out the same choices as above (section 4.1) over a few minutes: which skill is used, how often, and
what fills the gaps a main skill with a cooldown leaves (another main skill, then a periodic skill that is ready, then the
weapon). So the **weapon appears on the sheet as its own line, Default Attack, only when something leaves it time**: a main skill
on a cooldown, totems that stand while you wait. A character whose main skill is always ready never swings it, and its weapon's
damage does not move the figure. It counts one target, with free mana (docs/SHEET-AUDIT.md).

### 4.3 Where it stands

- **Melee:** walks up until the target is within the skill's reach plus both body sizes.
- **Ranged and spells:** stop as soon as the target is in range **and in sight**, then stand still. The Strategy
  tab's **Spacing** setting changes this:
  - **Hold at range** (default): they don't back away when enemies close in.
  - **Close in:** they stand within **3.5 tiles** of the target, which suits skills that fan out or burst near the
    character.
  - **Kite:** when an enemy that can move comes within **3 tiles**, the character steps back 2.5 to 3.5 tiles for
    up to 0.6 s, then fights on. It waits 1.5 s before stepping back again. It only steps to a spot outside every
    warning, not through a monster, from which its target is still in reach and in sight, and only if the step gains
    at least 1.5 tiles. Skills with less than 5 tiles of reach don't kite.
- **Burning aura or circling blades** (Searing Mantle and Orbiting Blades): the character walks in until the aura
  or the ring reaches (about **2.2 tiles** for the aura; the ring widens with every blade), whatever its attack's range.
- **Orbiting Blades** is cast on the move: the character keeps walking while it casts (at 90% of its speed) but starts
  nothing else until the cast is done. While fewer than half the blades circle it, it casts them from up to
  **6 tiles** off and walks in as it casts.
- **Arrows hitting walls:** if its shots hit walls **5 times within 3 seconds** (a wide fan in a narrow corridor),
  it closes to within **3.5 tiles** of the target for 3 seconds to get a clearer shot. Shots from totems, traps and
  mines don't count: walking closer doesn't change where they shoot from.

### 4.4 Cast time

Every skill use is an **action** that takes the skill's **use time**:

- **Attacks:** 1 ÷ (the weapon's attacks per second × your attack speed). Dual wielding adds 10% more attack speed,
  and the character alternates hands, each with its own speed.
- **Spells:** the gem's cast time ÷ your cast speed.

During an action:

- **Cost and cooldown are paid when it starts.**
- **The character is committed.** It can't move, dodge, start a new skill or cast a utility until the action ends.
- **The hit lands at 60% of the use time.** The remaining 40% is recovery. Until the hit lands the character
  keeps turning to follow its target. Repeats (an Echoing Cast analog) land a little later in the same action,
  with no new cost.
- **Chill** slows the action down. **Freeze** pauses it, and it picks up where it left off.
- **Stun cancels it.** If the hit hadn't landed yet, the use is lost and the cost stays spent.
- Back-to-back actions lose no time: anything left over from one tick carries into the next action.

_Strategy:_ Slow skills are a risk. A long use time means more time standing in a warning without being able to
dodge, and a bigger loss when you're stunned before the hit. Faster attack or cast speed gives more damage and
also lets the character react sooner. Stun avoidance helps slow skills the most.

---

## 5. Utility skills (curses, buffs, warcries, blinks, minions)

Utility skills deal no damage of their own. The character casts **at most one per decision**, and only while it
has a target. By default they come **before** its damage skills in the order (section 4.1), in the order they sit in
your build. With the role **Auto**, the default, each follows these rules:

| Kind                                          | When the character casts it                                                                                                                                                                                                                  |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Buff** (general)                            | Any enemy within 7 tiles, and the buff is off or about to run out.                                                                                                                                                                           |
| **Guard** (e.g. Iron Hide)                    | Life **below 60%** and no guard up. All guards share one timer, and a guard's cooldown starts only after it ends.                                                                                                                            |
| **Rally-type buff**                           | 3+ enemies within 7 tiles, **or** the target is rare, a champion or a boss.                                                                                                                                                                  |
| **Rage buff** (e.g. Rampage Call)             | Only when you have enough rage to start it.                                                                                                                                                                                                  |
| **Self-damaging buff** (e.g. Surge of Blood)  | Not started below 60% life.                                                                                                                                                                                                                  |
| **Run buff** (Slipstream Run, Rotting Stride) | Life below 70% with an enemy within 5 tiles, **or** 3+ enemies within 4 tiles. **It makes no attacks while the run lasts**, since attacking would end it.                                                                                    |
| **Warcry**                                    | 3+ enemies near (in the cry's radius + 2), **or** a rare, champion or boss target in that radius. All warcries share a 4 s timer.                                                                                                            |
| **Standing channel** (e.g. Rot Touch)         | Any enemy in its radius.                                                                                                                                                                                                                     |
| **Curse**                                     | Target within 9 tiles and in sight. Not recast while the curse has more than about 0.5 s left. Not cast if the target already has as many curses as your limit allows. Skipped on a lone, normal enemy below half life (not worth the cast). |
| **Offering**                                  | When it can work (you have minions for it), a corpse is within 11 tiles, and the last offering has less than 1.5 s left.                                                                                                                     |
| **Minions**                                   | In the first fight, and again whenever you have fewer than your maximum. Spectres need a corpse within 9 tiles.                                                                                                                              |
| **Lure totem**                                | 3+ enemies within 7 tiles, a rare, champion or boss target, or life below 70%.                                                                                                                                                               |
| **Gap-closer blink**                          | The target is more than 2 tiles beyond your primary's reach, but within blink distance and in sight.                                                                                                                                         |
| **Blink with a blast where it leaves**        | 3+ enemies around you.                                                                                                                                                                                                                       |
| **Blink with a blast where it lands**         | Closing a gap to a target with 2+ enemies near it.                                                                                                                                                                                           |
| **Escape blink**                              | Life below 70% with an enemy within 5 tiles, or 3+ enemies within 4 tiles.                                                                                                                                                                   |
| **Shadow Swap**                               | A corpse within reach with 2+ enemies around it.                                                                                                                                                                                             |

_Strategy:_

- **Order matters.** Only one skill goes out per decision, and the first one whose rule is met wins. Put the
  most important one first.
- **Other roles** replace these rules. **Keep up** casts a buff whenever an enemy is within 7 tiles and the buff is
  running out, keeps a curse on any target (not only packs and rares), and uses a warcry whenever an enemy is in its
  radius. **Opener** does the same once a fight and once on each rare. **Emergency** waits for life below its
  threshold, which is how to make a guard or a decoy wait longer or fire sooner. **Escape** is for blinks and runs: it uses the
  blink to get away (to the safest spot, not toward the enemy) when hurt with an enemy near (**Low health**) or when boxed in (**Surrounded**), as far as each box is ticked, instead of the
  blink closing a gap. A banner,
  an offering, a minion summon and a gap-closing blink only have Auto or Off. A summon that adds a minion or two with each cast,
  each for a short while (Call Furies, Pack of Hounds, Brood of Spiders), is cast like a damage skill instead: Main, Periodic or
  Off, Main when no damage skill is socketed and Periodic beside one.
- **Curses mostly go on packs and big enemies.** A lone, normal enemy below half life won't be cursed.
- **Guards react to damage.** A guard goes up after you've already fallen below 60%. Big single hits can kill
  you first, so don't rely on a guard against burst damage.
- **Run buffs pause your damage.** They are for getting out or through, not for fighting.

---

## 6. Flasks

Flasks are drunk automatically, on top of whatever else the character is doing. Kills don't refill them unless gear or
passives say so (docs/ATTRITION.md), so every drink counts. **Each belt slot has a number**, shown on the Strategy tab:
85%, 70%, 50%, 30% and 15% from slot 1 to slot 5. Where you wear a flask decides when it is drunk:

- **Life:** drunk when life is below its slot's number. A flask in slot 1 is drunk early, one in slot 5 is kept for the
  worst moment; put a slow flask in an early slot and an instant one in a late one. A flask that is already working isn't drunk again, but
  another can be. Only one life flask per tick.
- **Mana:** drunk when mana is below its slot's number. A **hybrid** flask is drunk below its slot's number of life or
  of mana.
- **Utility:** each utility flask has a condition: **bosses only** (the default), **rares and bosses** (a rare,
  champion or boss within 8 tiles), **packs and rares** (also 5+ enemies within 8 tiles) or **any fight**.
- **Life-to-energy-shield flask** (one that leaves you at 1 life for two seconds): only at **90%+ life**, with
  the nearest enemy **6 to 16 tiles away**, and only if your energy shield is at least 70% of your life. The
  character drinks it before a fight, not in one.
- **Cleansing flasks** (a suffix that removes an ailment and keeps it off while the flask runs): drunk as soon as
  that ailment is on the character, whatever the life threshold.
- **Before a blow it cannot dodge**: when a Sentence is about to land and would take more than the character's life and
  energy shield, an instant life flask (Bursting) is drunk at once, whatever the threshold. A slow flask is not: it would
  heal too late and waste the charges.
- **Stolen flasks**: while the Unmaker holds them (docs/BOSSES.md 9), none can be drunk.
- **Burning aura** (Searing Mantle): it is **switched off below 40% life** and back on at **75%**, the way
  a player would click it off.

_Strategy:_ Charges are scarce: a Respite, a fallen boss, a reprieve or Tapper's Brine refills them, and charge gain on
gear or passives tops them up as you kill. A late slot saves charges; an early one keeps you safer against hard hitters. A utility flask set to bosses only keeps its charges for the fights that count.

---

## 7. Loot

When **no enemy is in range**, the character walks to the **nearest drop or closed chest within 6 tiles**. It
picks things up on contact. It gives up on any one item or chest it hasn't reached after **20 seconds**.

It loots **between** fights, never during one. Drops more than 6 tiles from where it ends up are left behind.

---

## 8. The route through a map

- The character walks the **main path, room by room**. At each side branch it goes **out and back**, so it
  visits every room on the map. It fights whatever it meets on the way.
- **Stuck guard:** if it moves less than one tile in 20 seconds while walking the route, it is moved to the next
  waypoint.
- **End room:** after the last room, if the exit is still shut, it **hunts the nearest enemy in the end room** at
  any distance and wakes it up if it is asleep. In a **Quarry**, the champions count wherever they stand.
- When the end room is clear (every champion too, in a Quarry), the exit opens and the character walks out.
  **Holdout** maps open the exit only after every wave.

---

## 9. How monsters react to it

Most of how a fight goes depends on monsters. Here is what is useful to know:

- **Noticing:** a sleeping monster wakes when you are within **10 tiles** and in its sight. That is just over the
  character's 9, so monsters usually see you first. **Slipstream Run halves this distance**, so you can slip past
  packs. **Ambushes** wake at 4.5 tiles, walls or not. A waking monster wakes its pack-mates within about 6 tiles.
- **Leash:** a monster that loses sight of you for 6 seconds walks home and **heals to full**. Bosses and some
  hunters never give up. Combined with the stall breaker (section 2), this means an enemy you can't damage can
  come back at full life.
- **Ranged monsters** back off in short bursts when you're within 2 tiles. Kiters (Slingers, Handlers) back off
  at 4.5 tiles, faster and more often. A melee character chases them around.
- **Minions are walls.** Monsters can't walk through your minions. A melee monster that is blocked for about a
  third of a second hits the minion in its way. A ranged monster keeps walking toward **you** and only shoots a
  minion after being blocked for 1.5 seconds. Some monster types go for minions first. A **lure totem** draws
  every monster within its reach.
- **Under Slipstream Run** you walk through monsters instead of being blocked by them.

---

## 10. Provisions and the reprieve

These are decided in camp, not by the character, but the character is what they act on.

- **Provisions** (a pouch of three; a cleared map sometimes leaves one) armed before a map change the character for that one map and are used up when it starts, whether the map
  is cleared, left or lost. Armed provisions count in the numbers on the map cards (DPS, effective HP, rewards).
- **A reprieve** in the pouch is always ready (nothing to arm). It fires by itself, the moment damage would kill the character, once.
  You cannot hold it back and the character does not wait for a better moment. With several carried they go in order, a revive
  before a retreat. Every one refills all your flasks, so the character has something to drink at what comes next.
  - A **Retreat** (the Ferry Token) ends the map as if you had left it: you keep what you picked up, the level counts as
    played, and you arrive in camp with a quarter of your life and full flasks. It does nothing on a boss level (every tenth
    map), where a revive carried with it is used instead.
  - A **Revive** (Last Spark, Bargain Coin) stands the character up where it fell, at a share of its life, and nothing can
    hurt it for a few seconds. Mana and the monsters are as they were. If the character was losing the fight, it is still
    losing it, only later and with full flasks; Last Spark also throws the monsters nearby back and stuns them, which is what
    buys the time.

- **Relics** (kept for the run) can change what the character does, not only its numbers:
  - **The Unflinching** never steps out of a warning on the ground (section 3 does not apply).
  - **Blind Fury** fights the nearest enemy whatever the Target setting says, and its attacks ignore their condition (any
    fight); the Strategy tab shows both locked.
  - **The Echoing Word** gives every spell a 50% chance to land again a moment later, free, as a repeat does.
  - **The Thirsting Cup** puts half a charge into the slot 1 flask for every kill; **Draught Before the Throne** starts a
    boss map with every flask at least half full; **The Brimming Ward** turns flask healing past full life into energy
    shield (section 6 still decides when a flask is drunk).
  - **Arrows at the Throat** makes projectiles fall after 2 tiles, so a projectile skill's reach is 2 tiles: the character
    walks in that close before it shoots, and such a skill never kites.
  - **Mantle of the Fiend** carries one monster affix, in its version for the player, changed every minute of a map.
  - Against the **Envious Dead** (a stop) the character fights a fallen player's shade as in a duel (section 11), once; a
    loss or a draw costs only the level.

---

## 11. Duels

A duel (docs/DUEL.md) is a fight against another character in an arena with nothing else in it. The same character plays it,
from the same Strategy tab, so everything above holds except this:

- **It engages from anywhere.** The 9 tiles of section 2 do not apply: it goes for the nearest enemy at any distance. The two
  characters start 10 tiles apart.
- **Its enemies are the other character and its minions.** It picks among them as the Target setting says, and the other character
  counts as a boss: **Rares first** goes for it before a screen of minions that stands up to 4 tiles nearer. A melee character
  kills the minions in its way to reach it.
- **It never gives up on a target.** There is no stall breaker (section 2).
- **It never loots, leaves or walks the route.** With nothing it can hit (the other character is out of reach, or it is itself
  running in Slipstream Run) it walks toward the other character.
- **Nothing of the run comes along.** No provisions, no reprieves and no map penalty to the resistances; each character is at its own
  level with full life, mana, energy shield and flasks.
- **A duel ends** when a character dies (the other wins; both in one moment is a draw), after **90 seconds**, or when **15 seconds**
  pass in which neither character took damage (a stall). The last two are draws.
- **Who acts first is a coin toss every tick.** When both characters act in the same moment, one goes first, and which one is drawn
  anew each tick (the same for the same seed), so neither has the first blow by where it stands or by its speed.
- **Damage is scaled to ×0.3** for both characters: hits, bursts, damage over time and what a self-damaging buff (such as Surge of Blood)
  costs. A minion takes full damage;
  ailments and stuns are as strong as on a map (their damage is scaled like any other). Regeneration, leech and flasks work as on a
  map, so a duel is long, and it favours builds that recover well.
- **A kill of a minion by the other character** gives flask charges only through charge gain on gear or passives, and life
  and mana on kill, as a monster's kill does. Each life lost refills the flasks. The other character's death ends the fight.

---

## 12. Quick strategy summary

- **Range is safety.** Range gives the character room to dodge and keeps it out of melee. The Kite spacing helps
  a ranged character more.
- **Plan for being swarmed.** By default it fights the nearest enemy and walks into packs, so area damage and
  defences that hold up against many hits do well. Rares first or Stick to target change that.
- **Supports and nests die first.** You don't need to plan for them.
- **Keep the mana going.** Once it runs out, the character falls back to its free weapon attack.
- **A pack skill and a boss skill** can share the work: two main skills with conditions.
- **A skill with less reach than the main one** only fires when an enemy comes close.
- **The order of skills matters.** The first one whose moment has come wins.
- **Flasks and guards wait until you're hurt.** Bring defences that work before you get hurt: armour, evasion,
  block, resistances and maximum life.
