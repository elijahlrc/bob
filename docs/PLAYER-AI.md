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

---

## 3. Dodging

If the character is standing in a **lasting ground zone**, a **blast about to land**, or a **monster's area attack
that is winding up** (the warnings drawn on the ground: circles, wedges, rings and lanes), it tries to step out.

- It checks 16 directions at 1.5, 2.5 and 3.5 tiles and takes the **shortest step** that lands outside every
  warning.
- The step has to keep its **current target in reach**, and in sight for a ranged skill. **It will not dodge out
  of the fight.**
- It won't step **through a monster's body**: the monster would push it along, and the warning would move with
  it.
- **If no step works, it stays where it is and takes the hit.**

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

| Role          | What it means                                                                                       | Default for              |
| ------------- | --------------------------------------------------------------------------------------------------- | ------------------------ |
| **Main**      | The filler: used whenever no other skill is called for.                                             | The ★ primary skill      |
| **Periodic**  | Used every so often: when its own cooldown allows, or after a pause.                                | Every other damage skill |
| **Keep up**   | Kept going: a buff renewed as it runs out, a curse or a damage-over-time debuff kept on the target. | —                        |
| **Opener**    | Used once at the start of each fight, and once on each rare, champion or boss.                      | —                        |
| **Emergency** | Used when life falls below a threshold you pick (30% to 70%).                                       | —                        |
| **Auto**      | A utility skill's own judgement (section 5).                                                        | Every utility skill      |
| **Off**       | Never used.                                                                                         | —                        |

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

A main skill that is a **renewable debuff** (like Contagion) also waits while it is on the target with more than
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

- **Running out of mana costs damage.** Watch your mana. The auto flask drinks when mana falls below two casts of
  the main skill (section 6).
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
- **Burning aura or circling blades** (Righteous Fire and Orbiting Blades analogs): the character walks in to
  about **2.2 tiles**, whatever its attack's range, so the aura reaches.
- **Arrows hitting walls:** if its shots hit walls **5 times within 3 seconds** (a wide fan in a narrow corridor),
  it closes to within **3.5 tiles** of the target for 3 seconds to get a clearer shot.

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

| Kind                                             | When the character casts it                                                                                                                                                                                                                  |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Buff** (general)                               | Any enemy within 7 tiles, and the buff is off or about to run out.                                                                                                                                                                           |
| **Guard** (e.g. a Steelskin analog)              | Life **below 60%** and no guard up. All guards share one timer, and a guard's cooldown starts only after it ends.                                                                                                                            |
| **Rally-type buff**                              | 3+ enemies within 7 tiles, **or** the target is rare, a champion or a boss.                                                                                                                                                                  |
| **Berserk-type buff**                            | Only when you have enough rage to start it.                                                                                                                                                                                                  |
| **Self-damaging buff** (a Blood Rage analog)     | Not started below 60% life.                                                                                                                                                                                                                  |
| **Run buff** (Phase Run, Withering Step analogs) | Life below 70% with an enemy within 5 tiles, **or** 3+ enemies within 4 tiles. **It makes no attacks while the run lasts**, since attacking would end it.                                                                                    |
| **Warcry**                                       | 3+ enemies near (in the cry's radius + 2), **or** a rare, champion or boss target in that radius. All warcries share a 4 s timer.                                                                                                            |
| **Standing channel** (Wither analog)             | Any enemy in its radius.                                                                                                                                                                                                                     |
| **Curse**                                        | Target within 9 tiles and in sight. Not recast while the curse has more than about 0.5 s left. Not cast if the target already has as many curses as your limit allows. Skipped on a lone, normal enemy below half life (not worth the cast). |
| **Offering**                                     | When it can work (you have minions for it), a corpse is within 11 tiles, and the last offering has less than 1.5 s left.                                                                                                                     |
| **Minions**                                      | In the first fight, and again whenever you have fewer than your maximum. Spectres need a corpse within 9 tiles.                                                                                                                              |
| **Decoy totem**                                  | 3+ enemies within 7 tiles, a rare, champion or boss target, or life below 70%.                                                                                                                                                               |
| **Gap-closer blink**                             | The target is more than 2 tiles beyond your primary's reach, but within blink distance and in sight.                                                                                                                                         |
| **Blink with a blast where it leaves**           | 3+ enemies around you.                                                                                                                                                                                                                       |
| **Blink with a blast where it lands**            | Closing a gap to a target with 2+ enemies near it.                                                                                                                                                                                           |
| **Escape blink**                                 | Life below 70% with an enemy within 5 tiles, or 3+ enemies within 4 tiles.                                                                                                                                                                   |
| **Bodyswap**                                     | A corpse within reach with 2+ enemies around it.                                                                                                                                                                                             |

_Strategy:_

- **Order matters.** Only one skill goes out per decision, and the first one whose rule is met wins. Put the
  most important one first.
- **Other roles** replace these rules. **Keep up** casts a buff whenever an enemy is within 7 tiles and the buff is
  running out, keeps a curse on any target (not only packs and rares), and uses a warcry whenever an enemy is in its
  radius. **Opener** does the same once a fight and once on each rare. **Emergency** waits for life below its
  threshold, which is also how to make a guard, a decoy or an escape blink wait longer or fire sooner. A banner,
  an offering, a minion summon and a gap-closing blink only have Auto or Off.
- **Curses mostly go on packs and big enemies.** A lone, normal enemy below half life won't be cursed.
- **Guards react to damage.** A guard goes up after you've already fallen below 60%. Big single hits can kill
  you first, so don't rely on a guard against burst damage.
- **Run buffs pause your damage.** They are for getting out or through, not for fighting.

---

## 6. Flasks

Flasks are drunk automatically, on top of whatever else the character is doing:

- **Life** (or hybrid): when life is below **50% of your unreserved life**, and no life flask is already working.
  Only one per tick. The Strategy tab sets the threshold: 35%, 50%, 65% or 80%.
- **Mana** (or hybrid): when mana is below **two casts of your primary**.
- **Utility:** when a **rare, champion or boss is within 8 tiles**, **or 5+ enemies are within 8 tiles**. On the
  Strategy tab you can save them for **rares and bosses** only, or drink them in **any fight**.
- **Life-to-energy-shield flask** (one that leaves you at 1 life for two seconds): only at **90%+ life**, with
  the nearest enemy **6 to 16 tiles away**, and only if your energy shield is at least 70% of your life. The
  character drinks it before a fight, not in one.
- **Burning aura** (Righteous Fire analog): it is **switched off below 40% life** and back on at **75%**, the way
  a player would click it off.

_Strategy:_ Life flasks wait until 50% by default, which is late against hard hitters; raise the threshold if you
have the charges. Instant or fast recovery, flask
charge gain and other defences matter more than they do when you play by hand. A utility flask holds its charges
for the fights that count.

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
  character's 9, so monsters usually see you first. **Phase Run halves this distance**, so you can slip past
  packs. **Ambushes** wake at 4.5 tiles, walls or not. A waking monster wakes its pack-mates within about 6 tiles.
- **Leash:** a monster that loses sight of you for 6 seconds walks home and **heals to full**. Bosses and some
  hunters never give up. Combined with the stall breaker (section 2), this means an enemy you can't damage can
  come back at full life.
- **Ranged monsters** back off in short bursts when you're within 2 tiles. Kiters (Slingers, Handlers) back off
  at 4.5 tiles, faster and more often. A melee character chases them around.
- **Minions are walls.** Monsters can't walk through your minions. A melee monster that is blocked for about a
  third of a second hits the minion in its way. A ranged monster keeps walking toward **you** and only shoots a
  minion after being blocked for 1.5 seconds. Some monster types go for minions first. A **decoy totem** draws
  every monster within its reach.
- **Under Phase Run** you walk through monsters instead of being blocked by them.

---

## 10. Quick strategy summary

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
