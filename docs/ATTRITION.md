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
- The two automatic flask rules: decided 2026-10-29 (bracing with instant flasks only, cleansing kept; section 6); open to change.
- Baseline life recovery between maps (raised by a playtest, 2026-10-29): with no regeneration, life lost on one map
  carries into every map after it. Some base regeneration or out-of-combat recovery would be a departure from the
  reference game; for the owner to decide.

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
  - **Flask controls.** The Strategy tab lists the worn flasks in belt order, each with its own setting. Default
    thresholds by position: life 70%, 50%, 35%, 25%, 15%; mana 40%, 25%, 15%, 10%, 5%. A mana flask also drinks when
    the main skill can't be paid for at all (a present state, not a look-ahead). A life flask still running no longer
    stops the next one from drinking at its own threshold. A hybrid's setting is its life threshold. Utility
    conditions gained "bosses only". An old save's single life threshold becomes its first life flask's.
  - **Flask items, first pass.** Two new flask affixes: Thrifty (15-30% fewer charges a drink) and of Gleaning (the
    flask gains 0.2-0.4 charges a kill on its own). Brimming (30-60% more recovered), Lasting (40-80% longer) and of the
    Rampart (50-100% armour) roll higher. Every utility flask, unique ones included, lasts 1.5 times longer
    (`FLASK_UTILITY_DURATION_SCALE`). The weaker unique flasks got bigger numbers: Gambler's Tonic, Emberwell Urn,
    Hollow Oak Draught, Stonebrew Flask, Bellowing Draught, Hexfire Brew, Last Light Flask. The Brimming Cup's +100%
    charges gained is now +1 charge a kill while it runs, which suits it. Not yet re-thought one by one: the rest of
    the uniques' identities.
  - **Energy shield.** 25% less on every item base (`ENERGY_SHIELD_SCALE` in `data/bases.ts`, beside the weapon damage
    lever), so cards, the sheet and saved items agree. Affixes and the tree are untouched. Hollow Vessel and Living
    Ward are still in: removing them changes tree nodes, so they wait for the tree session with the owner.
  - **Emergencies, first pass.** Four map affixes, each on one way of lasting: Parched (50% less life regeneration),
    Smothering (energy shield recharges 50% slower and starts later), Souring (35% less from flasks), Taxing (skills
    cost 30% more mana); Draining, the broad one, never shares a map with them. Two monster mods: Withering (its hits
    stop life regeneration for 3 s) and Shield-breaking (its hits hold the recharge off 4 s longer); Bloodless (cannot be
    leeched from) already existed, and chaos damage already goes past energy shield. Not done yet: monster types and
    bosses built around these.
  - **The Respite: rest or craft.** Its card opens a screen like a stop's: Rest (refill everything, the level passes), or
    a craft. Crafts: add a random affix to a worn item; raise one of a worn item's affixes a tier, up to what the item's
    level or the level being played allows (an item's own level alone would leave early items nothing to raise); add a
    socket to a worn or carried item (the Awlsmith's rule). A craft is applied and shown at once, since its result is
    random. The first craft of a visit is free, the next cost 30, 90, then 270 Bone Dust. Once a craft is made, the
    visit is the level's: Leave passes it with camp's usual rest and no refill. The old "Rest at the Respite?" prompt
    is gone; the screen is the step.
  - **Bone Dust** shows at camp, beside the map number.
  - **Stops.** A random schedule from the seed (`stopSchedule`, `STOP_CHANCE` 0.32): about one level in five (19.6 a run
    over 400 seeds), from level 6, never on a fifth or tenth level, never two in a row, never the kind of the one
    before. The Awlsmith is no longer scheduled (weight 0; a save that holds one still works). The Shrine's blessing
    lasts five levels (`BLESSING_LEVELS`), no longer ends at the next stop, and a new Shrine replaces it; its numbers
    are unchanged, since lasting about twice as long is already the strengthening. The Gem Hoard lays out 10 gems and
    lets you take 4 (was 3 of 8). The Ferryman also refills every flask. The Quartermaster sells a refill of every flask
    (12 Bone Dust at the base, priced by level as wares are) and restocks (8 at the base, paid at once, new wares).
  - **The effects bar.** At the top of the Character tab, on porphyry: the blessing, each curse and each run reward,
    with the levels left (counting the next) or "for the run".
  - **Run rewards, a first list** (`data/runRewards.ts`): Deeper Pouch (one more provision held and armed; up to two),
    Keen Eye (one more choice on every reward pick), Waystation Cup (every stop refills the flasks), Thrifty Hands
    (Respite crafts cost half). The Quartermaster lays out one among its wares (now nine; a provision when none is left
    to buy). Considered and left for later: a fourth offer in every set (it changes the layout of every set and the
    offer code), foresight of upcoming Respites as a reward rather than for everyone. Where else run rewards come
    from (a stop of their own, bosses) is still open.
  - **Foresight.** Camp says when the next Respite comes ("Next Respite in 2 levels (map 23)"), looking up to twenty
    levels ahead; the sets follow from the seed alone, so it is exact. Upcoming stops are not shown (still open).
  - **Saves.** `SAVE_VERSION` 24; a version-23 run switches to the new rules on load with its passives handed back.
- **2026-10-29, playtests.** Three agents played one run each: a Vanguard (text harness, `scripts/play.ts`; four runs,
  the best to map 18), a Mystic (text harness, map 20) and a Strider (browser, map 10). All died to bosses or to a map
  after a bad one. What they found, sorted, and what became of it:
  - _The game, agreed by two or three of them:_
    1. One ordinary map can empty full flasks, so the Respite before a boss is not a choice. Lower default thresholds
       (the first life flask drank at 70%).
    2. Mana drained casters and the Strider alike: both mana flasks empty by map 8. Bigger mana flasks, lower mana
       thresholds, and the "main skill can't be paid" floor (my addition) removed.
    3. Rest always beat craft: a free craft gave +6 life. The Respite's added affix rolls at the best tier the level
       allows.
    4. A utility flask on "packs and rares" emptied in one map. The default becomes "bosses only".
    5. "Next Respite" skipped the Respite on offer. Camp says when one is on offer, and calls the one before a boss
       the last rest before it.
    6. Flask charges are shown nowhere as numbers: camp, the Flasks panel and the Respite screen show them.
    7. The Ferryman's price is not on its card. It is now.
    8. "Players gain fewer flask charges" (Dry) is nearly free now. It becomes "flasks use more charges a drink".
  - _The game, one report each:_ 9. One life flask in seventeen maps (Vanguard): the starting belt gets a second life flask. 10. Run rewards lost to resistance gear at 43–56 Bone Dust (one report had 74 Dust by map 12, another 9 by map
    9: mixed). Prices come down about a quarter. 11. A reward pick offered the same gem twice (pre-existing): a pick no longer repeats a gem. 12. "1 affixes" on the Respite screen; flask charges a drink shown with decimals. Fixed. 13. The Strategy tab leaves its left half empty at some widths, the Flasks panel squeezed (to look at).
  - _The harness, not the game:_ resistances read from the wrong slots in `char`; uniques printed as "no affixes";
    flasks marked "UPGRADE for null"; raw affix ids in the tier craft list; "1 levels"; a silent "Not possible" when
    equipping; the crafted item not shown; a worn flask's affixes left out of its charges; the Ferryman's price not in
    `look`. All fixed in `scripts/play.ts`. The 403 errors in the browser are the fonts failing through the
    worktree's linked packages, not telemetry.
  - _Not taken up:_ partial XP for stops and Respites, a Respite that also refills when you craft, mana refilling on
    kills (each reverses a decision of the owner's); baseline life recovery (in Open, for the owner); the bot's
    `auto` helpers undoing manual sockets and "Best place" choosing an idle socket (tools, not this plan); long
    early maps and a rare on a +2 map killing a level-3 character (balance before this plan); the Gem Hoard laying out
    few supports (its pool does include supports of the tag; left).
  - _Status:_ 1 to 12 done, with these first numbers: life thresholds 50/35/25/15/10%, mana 25/15/10/5/5%, utility
    "bosses only", mana flasks 2.75 times the reference charges (`FLASK_MANA_CAPACITY_SCALE`), a second Cracked Life
    Draught in the starting belt, Dry 30% more charges a drink, run rewards 30/35/40/25 Bone Dust at the base. 13: in
    two columns the Flasks panel now sits in the wider left one, under the rotation. The harness is fixed. Still heavy
    after the fixes: mana for a caster. In one harness check, a bot-geared Mystic drained a 129-charge mana flask to 3
    by map 9. The next levers, if play agrees, are mana regeneration and skill costs (not decided).
- **2026-10-29, the two automatic flask rules.** Bracing before an unavoidable blow now drinks only an instant life
  flask (Bursting): one that heals over seconds came too late and spent scarce charges. Cleansing is kept: a flask
  with a cleansing suffix exists to be drunk for its ailment.
