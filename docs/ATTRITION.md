# Bob — Flask scarcity and levels without a fight

Status: started 2026-10-28 on the `flask-scarcity` worktree branch. This plan is meant to change as we build: section 6
is a dated log of what we learn and decide along the way.

## 1. Why

The levels without a fight are low impact, low value and confusing. The Quartermaster is a good idea badly built: it
often has nothing worth buying, and Bone Dust is shown nowhere and spent almost nowhere. The Shrine is confusing (how
long does the blessing last, and which one did I pick ten levels ago?). The Respite is almost never worth taking.

The owner would like the run's balance to work more like Slay the Spire's: each level costs some of a lasting resource,
so a level that doesn't hurt you has real value and every dangerous route is a gamble. Life regeneration is everywhere
in this genre, so flask charges are the resource that can play that part.

This is the biggest departure from the reference game so far. Once the design settles, it gets noted in the READMEs so
that later design work starts from it.

## 2. Decided

**Flasks and life**

- Kills no longer give flask charges, for every kind of flask (life, mana, hybrid, utility).
- Charges can still be gained on kill through investment: tree nodes, flask affixes and uniques. Their "increased flask
  charges gained" mods become flat gains.
- Other ways to refill: the Respite, reprieves, a refill provision, a stop that sells refills (the Quartermaster), and a
  boss falling. How much each gives is open.
- Flasks are bigger, so the first maps don't kill: four or five drinks to a flask at the start.
- A newly found flask arrives full.
- Life and flask charges both carry over from level to level. Camp's 10 seconds of rest stay, as a lever.
- Every unique flask and flask affix gets re-thought: many won't make sense with rare use, or will need to be much
  stronger.
- Monster damage may need to come down; that waits for playtests.

**Flask controls**

- Flasks drink in belt order, with thresholds set by position (for example the first at 80%, the second at 60%), each
  editable. Life and mana flasks have separate orders. Each utility flask has a condition.
- No look-ahead rules in the default AI. The two automatic rules that exist (drink before an unavoidable lethal blow,
  drink a cleansing flask when it would clear something) are re-evaluated at the end.

**Builds**

- Self-sustaining builds meet emergencies: frequent, slightly different challenges to regeneration, leech and energy
  shield (less regeneration, chaos through the shield, monsters that can't be leeched...), from map affixes, monster
  affixes, monster types, bosses and maybe more, so builds have to be robust to all of them.
- Energy shield gets a moderate cut. The two keystones that set maximum life to 1 (Hollow Vessel and Living Ward) go.
- The passive tree is rebuilt: not from scratch, but with substantial changes in every region. Where the flask-charge
  nodes go is decided in that pass. The Shade's start (the TODO item) is reworked in the same pass.

**The Respite**

- About a quarter to a third of the sets hold one, and the level before every boss always does.
- Level generation never depends on the character's state.
- It is rest or craft. Rest refills everything. Craft adds a random affix to a worn item or raises one of its affixes a
  tier; the first craft of a visit is free and more cost Bone Dust.
- The Awlsmith folds into the Respite. The Workbench stays closed.

**Stops**

- A stop keeps costing the whole level.
- Stops come somewhat at random, about one in five levels, not counting Respites.
- The Shrine, the Gem Hoard and the Ferryman stay and get stronger. The Quartermaster is rebuilt, with a flask refill
  and a restock, both for Bone Dust.
- Rewards may be temporary or permanent, and temporary debuffs are possible too.
- An effects bar near the top of the Character tab, on its own purple ground, shows the character's buffs and debuffs and
  how long each lasts.
- Bone Dust is shown at camp. New ways to spend it come with this plan; new ways to earn it wait.

**Run rewards**

- Levels without a fight should offer things that can't be had any other way: things that belong to a roguelike
  auto-battler rather than the reference game, such as more pouch slots.
- The list of them comes first, made together; where they come from is decided after. The Quartermaster will probably
  carry them.

**Everything else**

- Duels use the new flask sizes. Duel lives already refill the flasks.
- Saved runs switch to the new rules on load, with a passive refund.

## 3. Open

- How much each refill source gives.
- The flask thresholds by position, and the utility conditions.
- How big the energy shield cut is, and where it's taken.
- What the emergencies are, one by one.
- Telling the player about upcoming Respites ("Respite in 2 levels"): the owner is interested; whether, and how far
  ahead, is open.
- How long a Shrine blessing lasts, now that stops come at random.
- What makes the Gem Hoard and the Ferryman stronger.
- The run rewards, where they come from, and whether a new stop is built around them.
- The two automatic flask rules (end of the plan).

## 4. Work, roughly in order

The order will change as we learn.

**Already built (2026-10-28)**

- Kills give no charges; every flask base holds 1.75 times its old charges (the first life flask: five drinks of 7 from
  37, not three from 21).
- A flask taken off keeps its charges. Before, putting a flask back on refilled it.
- The Respite is in 30% of the sets and always before a boss, drawn from the seed alone; the lean towards lower-level
  maps for a hurt character is gone.
- The default bot takes the Respite before a boss when its flasks are low.

**The attrition core**

- Refill sources, with the flat on-kill gains.
- Flask controls on the Strategy tab (and docs/PLAYER-AI.md).
- Flask uniques and affixes.
- The energy shield cut; the two keystones removed.
- The tree rebuild, region by region, pausing whenever it starts to lose intent.
- Emergencies.

**Levels without a fight**

- The Respite: rest or craft; Bone Dust at camp.
- Stops: the new schedule, the stronger Shrine, Gem Hoard and Ferryman, the rebuilt Quartermaster, the Awlsmith gone.
- The effects bar.
- Run rewards: the list first, then building them.

**Close-out**

- Re-evaluate the two automatic flask rules.
- Update the tests to the settled design.
- The save migration with a passive refund.
- Note the departure from the reference game in the READMEs (and DESIGN.md, CLAUDE.md).
- Merge to main.

## 5. How we work on it

- Everything stays in the worktree until the plan is done.
- The owner's playtests decide. A bot baseline is kept and re-run when the owner asks.
- No tests are written or rewritten for a mechanic still being designed; stale tests stay red until the close-out.

## 6. Log

- **2026-10-28.** Plan started; the first pieces built (section 4). On a first playtest the Mystic didn't feel very
  different; left to iterate on later.
- **2026-10-29.** The owner asked for the whole plan to be built without them, the open items decided as I go and
  logged here, and no tree rework (only small tree changes the game needs, recorded). Decisions, each a first version:
  - **Charges on kill.** "Increased flask charges gained" now adds to a base of zero instead of multiplying a base of one:
    +50% is half a charge a kill, weighed by the rarity of what fell as before (normal 1, magic 3.5, rare 6, unique 11),
    and a mark's bonus adds one a mark. Items read "+0.5 Flask Charges per kill". The data is unchanged, so every item,
    unique and the map affix that cut charges keep working. The tree has no charge-gain node yet (the tree pass).
  - **Tapper's Brine**, a staple provision from level 3: the flasks start the map full.
  - **A fallen boss** refills every flask.
