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
- Life and flask charges both carry over from level to level. Camp's 10 seconds of rest stay, as a lever. No other
  recovery between maps for now (2026-10-29).
- Every unique flask and flask affix gets re-thought: many won't make sense with rare use, or will need to be much
  stronger.
- Monster damage may need to come down; that waits for playtests.

**Flask controls**

- Each belt slot has its own threshold, the same for life and mana: 85%, 70%, 50%, 30%, 15% from slot 1 to 5 (slot 1 drinks first) (2026-10-29,
  replacing editable thresholds by position). A life flask drinks below its slot's share of life, a mana flask below
  its share of mana, a hybrid below either. The Strategy tab shows each slot with its number; only a utility flask has a
  control, its condition.
- No look-ahead rules in the default AI. The two automatic rules that exist (drink before an unavoidable lethal blow,
  drink a cleansing flask when it would clear something) are re-evaluated at the end.

**Builds**

- Self-sustaining builds meet emergencies: frequent, slightly different challenges to regeneration, leech and energy
  shield (less regeneration, chaos through the shield, monsters that can't be leeched...), from map affixes, monster
  affixes, monster types, bosses and maybe more, so builds have to be robust to all of them.
- Spread over the armies (2026-10-29): Scarred, a status that stops life regeneration for a few seconds, from the hits
  of heavy hitters and some monsters of most armies (and the Withering mod); the Hollow cannot be leeched from; venom,
  disease and grave magic deal part chaos (Silkspinner, Carrion Bat, Brine Leech, Skeleton Mage). The Rot's chaos comes
  down to about half its damage. Siphoning and Flask-taker, too punishing early, wait for level 40.
- Magic packs are whole packs of magic monsters sharing one set of mods, and more of them: about a third of the rooms
  early (2026-10-29), so a build meets the mods it fears in numbers.
- Energy shield gets a moderate cut, the same share on item bases and on affixes, set by one constant that will be tuned
  again (2026-10-29). The two keystones that set maximum life to 1 (Hollow Vessel and Living Ward) go.
- The passive tree is rebuilt: not from scratch, but with substantial changes in every region. Where the flask-charge
  nodes go is decided in that pass. The Shade's start (the TODO item) is reworked in the same pass.
- The tree audit (2026-10-30, section 6): a design philosophy for the rework comes before any rebuilding. Percent energy
  shield nodes stay as they are; flat ones are cut by the same quarter as items. The other keystones stay. Names that
  clash with the stops and the relics are fixed in a naming pass at the end of the tree rework.

**The Respite**

- About a quarter to a third of the sets hold one, and the level before every boss always does.
- Level generation never depends on the character's state.
- It heals and offers crafts (2026-10-29; it was rest or craft). Rest refills everything. Craft adds a random affix to a
  worn item or raises one of its affixes a tier; the first craft of a visit is free and more cost Bone Dust, scaling with
  the item's level. Some other choice may be offered there too; what it is, is open.
- The Awlsmith folds into the Respite. The Workbench stays closed. A socket costs more the more sockets the item has: a
  fifth and a sixth are always expensive, even as a visit's free craft (2026-10-29).
- The Next map screen says when the next Respite comes, as built in the playtest fixes (kept as it is, 2026-10-29).

**Stops**

- A stop keeps costing the whole level.
- Stops come somewhat at random, about one in five levels, not counting Respites.
- The Shrine, the Gem Hoard and the Bloodletter (the Ferryman until 2026-10-29) stay and get stronger. The Shrine needs a rework; until then its blessing
  lasts ten levels, and the Shrine says so, and its blessings are twice as strong (2026-10-29). The Quartermaster is
  rebuilt, with a flask refill
  and a restock, both for Bone Dust.
- Rewards may be temporary or permanent, and temporary debuffs are possible too.
- New stops build the setting: a dark afterlife tied to no religion, whose people are supernatural or lost souls trying
  to escape. Each must compete with a combat level's experience and drops. Kept from the brainstorm (the owner,
  2026-10-30), all four built the same day (section 6 has what was decided on the way):
  - **The Surgeon** (the brainstorm's Stitcher): permanent body trades, such as 10% maximum life for 15% maximum mana,
    or a point of one attribute for two of another. Up to three trades a visit, each a little worse than the last.
  - **The Envious Dead**, a duel with another player's shade (the brainstorm's Mirror, which fought a copy of yourself and was boring):
    the shade of another player who died around your level, from the rivals database. A loss spends the level only:
    the fight's damage is not kept, so life and flasks are as before. A win pays the choice of one of its items, and a
    relic on top.
  - **The Knucklebone Man**, a gambler: rolls the mods of one of your items, adding or removing affixes, raising or lowering tiers, or
    replacing the implicit with another base's implicit. Each roll costs Bone Dust by the item's level, more with each
    roll; roll as long as you can pay.
  - **Another's Remains** (the brainstorm's Your Own Remains): the choice of any one item of another player's dead build,
    from the rivals database.
  - The two database stops, when the database can't be reached (offline, rivals switched off, or no dead run near the
    level): the card is shown but closed, saying it needs the rivals list; the level can still go to a map. The duel's and the gambler's names are the owner's (2026-10-30).
- An effects bar near the top of the Character tab, on its own purple ground, shows the character's buffs and debuffs and
  how long each lasts.
- Bone Dust is shown at camp. New ways to spend it come with this plan; new ways to earn it wait.

**Relics** (called run rewards until 2026-10-29)

- Levels without a fight should offer things that can't be had any other way: things that belong to a roguelike
  auto-battler rather than the reference game, such as more pouch slots.
- The list of them comes first, made together; where they come from is decided after. The Quartermaster will probably
  carry them.
- They are called **relics** (the owner, 2026-10-29). Four exist (Deeper Pouch, Keen Eye, Waystation Cup, Thrifty Hands).
- Where they come from (the owner, 2026-10-30): the Quartermaster sells them, every boss that falls offers a pick of
  relics, and a win against the Envious Dead pays one. They carry provisional names until the owner names them.
- **The owner's list, 2026-10-29.** Approved from the brainstorm, numbered as the owner numbered them; built on
  2026-10-30 with provisional names (section 6 has the names and what was decided on the way):
  1. +2 provision slots. It replaces Deeper Pouch.
     1. Armed provisions apply twice their effect.
     2. Each level gives a provision.
  2. Rares pay a bounty of 20 Bone Dust.
  3. The flask in slot 1 (the slot that triggers first: the slot order was flipped for it, so slot 1 drinks at 85%)
     gains 0.5 charges per enemy killed.
  4. Every flask refills halfway at the start of each boss level.
  5. Flask overhealing becomes energy shield (temporary if the character has no energy shield gear).
  6. +15% to all resistances for each flask slot left empty.
  7. Up to three refunds that can refund nodes without breaking the connections that pass through them.
  8. Take one notable anywhere on the tree.
  9. Burn a node (refund it, and it can never be taken again) to get a connection to any node within a third of the
     tree's radius of it.
  10. Choose a basic stat node on the tree: it can be built off, at the cost of 10% resistances for each node extended
      from it.
  11. Choose a cluster with at least two small nodes: its small nodes burn, and its notable has three times its effect.
  12. Nodes can be added from another class's starting point.
  13. Other classes' start nodes can be taken as ordinary notables: +8% to all resistances, +10% attack and cast speed,
      +10% life and mana.
  14. +2 levels to the primary skill.
  15. 15% more global defences on boss levels.
  16. 50% more damage over time duration.
  17. 20% less elemental damage taken; the character no longer dodges area attacks.
  18. The kinds of enemy attacks are used against can no longer be set (both the target priority and the attack skills'
      conditions are locked); attacks leech 0.5% of damage as life and mana.
  19. 50% less Bone Dust; spells cast have a 50% chance to be cast again at no cost or cooldown.
  20. One affix from the monster affix pool, which changes at random every minute.
  21. Maximum life equal to the lowest attribute.
- **Attribute relics, the owner's list of 2026-10-30.** Offered by the character's attributes when the relic is drawn: a
  character with 200 strength and 20 of the others should see strength relics 5 to 10 times as often. A stop's relics are
  drawn once, so changing gear cannot draw them again. Strong, but none should break the game alone. Built the same day
  (section 6):
  - Dexterity: dodging (evading) an attack gives a stacking buff, 1% life leech on attacks for 5 seconds, with no cap on
    stacks (the leech caps limit it). Flat life equal to a quarter of accuracy.
  - Intelligence: energy shield takes half of chaos damage. A minion that dies heals for 5% of its total life; one whose
    time runs out also heals, at a reduced rate.
  - Strength: 75% increased attack speed with two-handed weapons, and damage to oneself equal to 1% of attack damage, as if
    every enemy reflected 1% (on every target hit: the build needs defences against its own damage types and life
    regeneration). Life leech increased by the increased armour percentage, and 50% less armour.
  - Dexterity and intelligence: critical strikes give a stacking 3% attack speed buff that decays over 5 seconds, to at
    most 60% increased. Evading an attack starts energy shield recharge at once.
  - Dexterity and strength: +100% projectile damage, and projectiles fly only a very short way, about a melee reach.
    Blocking an attack stuns the attacker, for the block stagger (0.35 s), half on bosses, with a short cooldown per
    monster.
  - Strength and intelligence: elemental damage of one element lowers the target's resistances to the other two by 30
    for 3 seconds. Life regeneration also regenerates the same share of mana.
- **More relics, the owner's picks of 2026-10-30** from a brainstorm of 18 (most were underwhelming). Built the same day
  (section 6):
  - +1 to the maximum of every kind of charge; maybe with no downside (a lean: the brainstorm's was charges lasting half
    as long).
  - Strength: armour also reduces elemental hits, at a quarter of its strength, at a cost in resistances (not the
    brainstorm's "cannot evade", which the tree already has and is dull).
  - Dexterity: half of increased movement speed also applies to attack and cast speed, for 20% less evasion. Critical
    strike chance that grows, maybe 30% a second, and starts again at -30% after a critical strike, so a build without
    critical strikes still lands the odd one.
  - Intelligence: minions take 25% of the damage taken, split among them, for 50% less minion life. A cursed enemy that
    dies passes its curses to the nearest enemy (nothing in the game did).
  - Strength and intelligence: 1% more damage of an element for each 1% of its resistance above the cap.
  - Dropped: poison and bleeding passing on death, since poison already does (Venom Strike's Venomed) and ignite and
    shock pass on kill from four uniques.

**Everything else**

- Duels use the new flask sizes. Duel lives already refill the flasks.
- Saved runs switch to the new rules on load, with a passive refund.

## 3. Open

- How much each refill source gives.
- The utility conditions.
- How big the energy shield cut is, and where it's taken.
- What the emergencies are, one by one.
- The Shrine's rework.
- A further choice at the Respite, beside healing and crafting.
- What makes the Gem Hoard and the Bloodletter stronger.
- Relics: their names (provisional since 2026-10-30), and a longer list (the owner, 2026-10-29: four is not nearly
  enough; the 21 are a start). The choices made while building them (section 6, 2026-10-30) are open to change.
- Crafting at levels without a fight: more powerful, less linear, never free (the owner, 2026-10-29: the Awlsmith was
  weak, linear and free). Ideas, none chosen: an affix moved from a bag item at the cost of that item, lock and reroll,
  temper, imbue, a crafter whose menu differs from visit to visit, a final craft with a random outcome, recipes found on
  maps.
- The two automatic flask rules: decided 2026-10-29 (bracing with instant flasks only, cleansing kept; section 6); open to change.
- What the flask stats are (on items and the tree), and whether the tree sells charges on kill or fewer charges a drink.
- The design philosophy of the tree rework.

## 4. Work, roughly in order

The order will change as we learn. Status on 2026-10-29 at the end of each line; section 6 has the detail, including
the changes after three playtests.

**Already built (2026-10-28)**

- Kills give no charges; every flask base holds 1.75 times its old charges (the first life flask: five drinks of 7 from
  37, not three from 21).
- A flask taken off keeps its charges. Before, putting a flask back on refilled it.
- The Respite is in 30% of the sets and always before a boss, drawn from the seed alone; the lean towards lower-level
  maps for a hurt character is gone.
- The default bot takes the Respite before a boss when its flasks are low.

**The attrition core**

- Refill sources, with the flat on-kill gains. Built.
- Flask controls on the Strategy tab (and docs/PLAYER-AI.md). Built.
- Flask uniques and affixes. A first pass built; the uniques not yet re-thought one by one.
- The energy shield cut; the two keystones removed. The cut is built (item bases); the keystones wait for the tree pass.
- The tree rebuild, region by region, pausing whenever it starts to lose intent. Waits for the owner.
- Emergencies. Map affixes, monster mods, magic packs, the armies' Scarred, chaos and no-leech, and a probe in every boss
  fight (docs/BOSSES.md 21). Built.

**Levels without a fight**

- The Respite: crafts, then rest (rest or craft until the owner's review); Bone Dust at camp. Built.
- Stops: the new schedule, the stronger Shrine, Gem Hoard and Bloodletter, the rebuilt Quartermaster, the Awlsmith gone.
  Built.
- The effects bar. Built.
- Relics (were run rewards): the owner's 21 built with provisional names, sold by the Quartermaster, picked after a
  boss falls and won from the Envious Dead (2026-10-30). Built.
- The four new stops: the Surgeon, the Knucklebone Man, the Envious Dead and Another's Remains (2026-10-30). Built; the
  two rivals stops were tried only with a stand-in shade, never against the live rivals table.

**Close-out**

- Re-evaluate the two automatic flask rules. Done.
- Update the tests to the settled design. Waits for the design to settle.
- The save migration with a passive refund. Built (`SAVE_VERSION` 24).
- Note the departure from the reference game in the READMEs (and DESIGN.md, CLAUDE.md). Waits for the design to settle.
- Merge to main. The owner's call.

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
- **2026-10-29, the owner's review of the log.** Five answers, built the same day:
  - **Hybrid flasks** have both thresholds on the Strategy tab and drink below either (`flasks.manaAt` beside `at`). The
    mana one defaults by position in the mana order, as before.
  - **Respite craft costs** scale with the item's level as the Quartermaster's wares do (`priceAt`): the bases come down to
    20, 60 and 180 (about 22/66/198 Bone Dust at item level 5, 44/132/396 at 60). The first craft stays free. Each item in
    the list shows its price.
  - **The Shrine** blessing lasts ten levels (`BLESSING_LEVELS`), and its card and screen say so. Its rework is open.
  - **The Respite heals and crafts.** Craft as often as the Dust allows, then "Rest and leave" refills everything and
    passes the level; Back is there only until a craft is made. The other choice it may offer is open.
  - **Energy shield affixes** take the same cut as the bases: one constant, `ENERGY_SHIELD_SCALE` in `data/constants.ts`
    (moved from `data/bases.ts`), scales the bases and the flat energy shield of every affix tier when the families are
    built. Percent increases are untouched (cutting them too would cut twice). Rolls are stored, so items found before a
    change to the constant keep theirs; the bases follow it at once. Unique items' energy shield is untouched.
- **2026-10-29, the owner's next pass.**
  - **Flask thresholds by slot.** Slot 1 to 5 drink at 15%, 30%, 50%, 70% and 85% (flipped the same day: 85% for slot 1 down to 15% for slot 5) of life (life flasks), mana (mana
    flasks) or either (hybrid). The Strategy tab lists the five slots with their numbers; only a utility flask keeps a
    control. Settings older saves made for life and mana flasks are ignored. On the way: the sim matched a flask to its
    slot by worn order, so after an empty slot every flask took the wrong slot's setting (utility conditions included).
  - **No recovery between maps** for now; the Respite line on the Next map screen stays as built.
  - **Emergencies across the armies.** Scarred (`scar`, 3 s, no life regeneration) comes from the hits of the Skeleton
    Brute, Bone Crawler, Wrack and Slag Brute (the owner's picks) and the Gorger, Flagellant, Gnawer, Sentinel and
    Rend-boar (spread over the armies; the Hollow and the Gilded have their own); the Withering mod applies it too. The
    gem status that was also called Scarred is now Gashed. The Hollow cannot be leeched from (a faction mod). Part chaos:
    Skeleton Mage and Silkspinner 50%, Carrion Bat and Brine Leech 40%. The Rot's Spitter and Carrion Hag go from all
    chaos to half (their clouds stay chaos). The map card shows Scarring and Bloodless as threat tags.
  - **Siphoning and Flask-taker** from level 40 (were 15 and 20).
  - **Magic packs** are whole packs, every monster magic with one shared set of mods; about a third of the rooms early,
    40% by map 100 (were 22% to 30%, two or three magic among normals).
  - **No faction-only mods.** Festering, Putrid (once the Rot's), Brood (the Swarm's) and Zealous (the Choir's) roll on
    any monster.
  - **Bosses probe the ways of lasting**, one each, by a summon or a phase, never a hard counter (docs/BOSSES.md 21). The
    Veiled Duellist's veil now also takes 60% off what he takes.
  - **Sockets cost by count.** A socket craft at the Respite pays the visit's craft price and its own on top, by the socket
    it adds: nothing for the first three, then 40, 150 and 400 Bone Dust before the item's level (`RESPITE_SOCKET_DUST`),
    free first craft or not. A fifth socket on a level-40 item is 270 more, a sixth 720.
  - **Relics.** The run rewards are called relics; the owner's list of 21 is in section 2 (unnamed, unbuilt). For relic 3
    the slot order flipped: slot 1 drinks at 85%, then 70%, 50%, 30%, 15%. A new character's belt is empty in slots 1 and
    2, life flasks in 3 and 4 (50%, 30%) and the mana flask in 5 (15%).
  - **The Ferryman is now the Bloodletter** (the owner: the effect is good, the name did not fit it). Its bargain is
    Bled White; its emblem a bottle of life nearly drained. The stop's id stays `ferryman` (saves keep it).
  - **Shrine blessings doubled:** +44% life, +30% damage, +52% resistances, +36% movement speed, +72% armour and evasion,
    +36% item quantity, +30% attack and cast speed. (Resistances lowered to +40% by the owner, 2026-10-30: too high.)
  - **More monsters early.** Room packs grow 1.7 times through map 10, easing out by map 40: a whole map gains about
    40% (map 1) to 60% (map 10), as the end room's pack does not grow (`npm run mapstats`).
  - **Early picks.** Map 1's pick is three skill gems, map 2's three flasks of different kinds, map 3's three supports,
    map 4's one of each (DESIGN.md Appendix A).
- **2026-10-30, relics and the four stops, built while the owner was away.** The owner's answers first: relics come
  from the Quartermaster, from a pick after each boss that falls (after its usual pick) and from a win against the
  Envious Dead; they carry provisional names; the duel is the Envious Dead, the gambler the Knucklebone Man. Everything
  else below is mine, to revisit:
  - **Where relics live.** On the build (`Build.relics`), so the sheet, the sim, duels and rivals see them; a save moves
    the old ones there on load (one Gravewarden's Satchel for any Deeper Pouches). What the tree's relics did is on the
    build too (`Build.treeRelics`); a relic's uses left are worked out from it, never stored.
  - **The 21, as built**, by the owner's numbers:
    1. Gravewarden's Satchel: two more held and two more armed. 1.1 Twice-Steeped Dregs and 1.2 The Gleaner's Hook were
       first offered only to a run that held it; the owner lifted that the same day, so each is offered on its own. 1.1 lists each armed provision's hidden affix twice, so all it does counts
       twice (on the character, on the monsters, on the rewards). 1.2 adds a provision whenever a level passes (a map, a
       stop or a Respite), drawn as foraging is; nothing when the pouch is full.
    2. Headsman's Tally: 20 Bone Dust a rare, paid when the map ends, abandoned maps too.
    3. The Thirsting Cup: half a charge to the flask in slot 1 for every kill, whatever its rarity.
    4. Draught Before the Throne: every flask at least half full as a boss map starts.
    5. The Brimming Ward: flask healing past full life goes to energy shield, up to its maximum. With no energy shield
       of its own the character gets a separate shield, at most its maximum life, that fades by 10% (and 1) a second and
       takes hits after energy shield.
    6. The Abstainer's Vow: +15% to elemental and chaos resistances for each empty belt slot.
    7. Hollowed Paths: three uses. A hollowed passive gives its point back, still carries the paths through it, and can
       be taken again (the use stays spent). It costs no refund point.
    8. A Star Torn Loose: the notable costs a passive point; refunded as any other (a refund point), it gives the use back.
    9. Brand of the Burnt Road: burn a held passive (its point back, never taken again, it still carries paths), then
       link it to any passive within a third of the tree's radius (about 1,575 of the tree's units).
    10. The Grafted Root: a small or attribute passive becomes a root (taken for a point if not held; never refunded);
        −10% elemental and chaos resistances for each held passive that hangs from it alone.
    11. Pyre of the Lesser: a cluster with one notable and two or more small passives. The small ones burn (refunded if
        held; they still carry paths), the notable's numbers are tripled.
    12. A Stranger's Threshold: another class's start becomes a root.
    13. Crowns of the Fallen: other classes' starts can be taken on a path, like notables, for +8% to elemental and chaos
        resistances, +10% attack and cast speed and +10% life and mana each.
    14. Litany of the Chosen: +2 to the primary skill gem's level.
    15. Bulwark Before the Throne: 15% more armour, evasion and energy shield on boss maps.
    16. The Lingering Rot: 50% more duration of ignite, bleeding and poison, and of skills that deal damage over time.
    17. The Unflinching: 20% less elemental damage taken; the character never steps out of warnings on the ground.
    18. Blind Fury: 0.5% of attack damage leeched as life and as mana; the Strategy tab's target and the attacks'
        conditions are locked (the nearest enemy, any fight).
    19. The Echoing Word: a spell has a 50% chance to fire again for free (an Echoing Cast repeat); 50% less Bone Dust
        from salvage and bounties.
    20. Mantle of the Fiend: one monster affix in its Trophy Cord version for the player, drawn when a map starts and
        every minute after.
    21. The Weakest Vein: maximum life plus the lowest attribute.
  - Keen Eye, Waystation Cup and Thrifty Hands stay. Prices are 25 to 60 Bone Dust before the level factor, all from
    level 6. A boss offers three relics the run can still take; a run holds one of each.
  - **The Surgeon**: four trades a visit from fourteen (the owner's two, six attribute trades of 10 for 20, speed for
    defences and back, resistances for life and back, damage for life, energy shield for life). A trade may be taken
    again; each after the first gives 15% less of its gain, the price whole. Trades are permanent mods on the build.
  - **The Knucklebone Man**: a throw costs 15 Bone Dust, 1.6 times more for each throw of the visit, raised by the item's
    level as wares are. Among the throws an item allows: add an affix 3, take one away 2, a tier up 3, a tier down 2,
    another base's implicit 1. Not on uniques or sealed items. After a throw the level is spent, as at the Respite.
  - **The Envious Dead**: the shade is the fallen run nearest in character level among the rivals near the map, a
    player's before a bot's. One fight on a seed fixed by the offer, both at full life with the duel's usual lives; a
    draw, or leaving the fight, is a loss; the run's own life and flasks are untouched. A win: one of its worn items and
    one of three relics.
  - **Another's Remains**: the same kind of shade; one of its worn items (the rivals table holds no bag or flasks).
  - An item taken from a shade is rebuilt within what it could roll (affixes clamped to their tier, a unique rolled
    afresh, an unknown implicit replaced by its base's), since the rivals table limits a build's size, not its content.
  - **Tried:** relic and tree rules by temporary tests; every stop, the relic pick and the tree's relic mode in the
    browser. The rivals stops only with `?shades` (a dev build stands the character's own build in), never against the
    live table, which is the owner's to check; with rivals off their cards say so and stay closed.
  - **New network use:** a rivals stop on offer reads the rivals table from camp (the first read during a run), only
    with rivals switched on (the default) and never making a token; the owner's to confirm. The duel keeps the duel's
    four lives a side (I had guessed one life when asking).
  - **Left:** the bots use no tree relic and never meet the rivals stops; the HUD does not show the Brimming Ward's
    fading shield; no tests written (the stop schedule changed with four new stops, so schedule-pinned tests will fail).
- **2026-10-30, the owner's review of the stops.** Decided: a stop leaves the character stronger on net, by about what a
  combat level gives (a level, and one item swapped for a better one). The Surgeon's trades were close to even and the
  second and third barely worth taking. Mine, a first pass: priced in small passives (`UNIT` in
  `src/data/passives/lines.ts`), each trade now gains about three and costs about one, so with the 15% fade on gains the
  three trades net about 2, 1.6 and 1.2, about five in all (a level is about four). The attribute trades are 45 for 15,
  no longer the owner's one point for two. Blessing of Warding: +40% resistances (the owner).
  - The Knucklebone Man was too random and did not lean good (the owner): a gamble should give a real chance at a big
    upgrade. Mine, a first pass: a throw falls on a ladder whose odds his screen shows (`KNUCKLE_ODDS`): 50% one affix up
    a tier, 22% the one with the most room up to the best tier the level allows, 8% every affix there and one added if
    there is room, 20% one a tier down. Where nothing can rise, the good throws add an affix. Removing an affix and
    swapping the implicit are gone. The prices stay.
  - The Envious Dead's shade: with none within five levels, one below the character is drawn before any above (the
    owner: dominating the player with a character 20 levels higher is no fun). Mine: within five, the nearest as before;
    then players before bots in each band; Another's Remains keeps the nearest, as it is no fight.
  - The Envious Dead says the duel cannot kill (the owner): "Win or lose, you live" on its card, on its screen before the
    fight, and after a lost duel on the result and the stop.
- **2026-10-30, the attribute relics, built.** The owner's list is in section 2. Mine, to revisit:
  - **Names** (provisional): Blood of the Untouched, The Marksman's Pulse, Veil Against the Rot, Tithe of the Servants,
    Wrath That Flays Its Bearer, Thirst of the Anvil, Quickening Cruelty, The Unseen Ward, Arrows at the Throat, The
    Shield's Rebuke, Elements at War, One Blood, Two Vessels.
  - **Weights.** An attribute relic weighs the character's attribute, a pair the mean of its two, every other relic the
    mean of all three (`relicWeight`). No relic is closed to anyone; an off-attribute one is only rarer. At 200/20/20 a
    strength relic comes 10 times as often as a dexterity one, a strength pair 5.5 times, any other 4 times. The boss
    pick is drawn as the boss falls; the Quartermaster's relic and the Envious Dead's three the first time they are
    shown, then kept for the level (`keptRelics`).
  - **Accuracy to life** is base life, so it is raised by increased life like any flat life: 1,000 accuracy is +250.
  - **Timed minions** heal 1.25%, a quarter of 5%: twenty Call Furies spirits run out about 2 to 4 a second, so at 5% they
    would heal 3 to 12% of life a second (by minion life) and at a quarter about 1 to 3%, a strong regeneration.
  - **Stacks.** Each stack holds its own 5 seconds, so the buff ebbs one stack at a time. Cruelty adds a stack for each
    critical strike on each target; at 20 stacks (60%) a new one replaces the oldest. Untouched adds a stack for each
    evaded attack, its extra leech straight on the attack's damage (life leech increases do not raise it).
  - **The reflect** is the attack's damage dealt, 1% in each of its types, on every target hit, through the character's
    resistances and armour (two-handed melee only, below).
  - **Projectiles** fly 2 tiles; the AI closes in to that range (and no longer kites with such a skill). Spell
    projectiles are cut too; a chain still jumps its usual distance.
  - **The Rebuke** stuns a monster again only after 2 seconds; a boss or a miniboss for half as long (0.18 s).
  - **Elements at War** works from hits; its statuses (Torn by the Flame, the Frost, the Storm) are not exposure, so the two
    add up.
  - **The sheet** sees accuracy to life, two-handed speed, the leech increase and the armour lost, the projectile damage,
    the chaos share and the mana regeneration. It sees the gains of Arrows at the Throat and Wrath That Flays Its Bearer
    but not their costs (the short range, the reflect), so the bot takes them whenever offered; the evade, crit, block and
    minion effects happen only in the fight, so the bot and the sheet undervalue those.
- **2026-10-30, the second brainstorm's relics, built.** The owner's picks are in section 2. Mine, to revisit:
  - **Names** (provisional): Burning Through, The Mountain's Hide, The Fleetfoot Oath, The Ripening Wound, Shared Agony,
    The Spreading Hex, Searing Excess. Burning Through belongs to no attribute; the others as listed.
  - **Burning Through** has no downside (the owner's lean).
  - **The Mountain's Hide** costs 5% maximum elemental resistances, which overcapping cannot buy back. The armour meets an
    elemental hit before the resistance does. On the sheet, 4,000 armour at level 50 takes the defences from 6,514 to
    10,735 (65% more): strong, and the quarter is the lever.
  - **The Fleetfoot Oath** counts increased movement speed as it is that moment, a flask's or a buff's included (the owner,
    the same day; first built on lasting speed only), and a net slow gives nothing. The calc reads it as `inc:moveSpeed`, a
    `per` that sums the stat in the database being queried (`modDb.ts`).
  - **The Ripening Wound** adds 30 points of critical strike chance a second, from -30 after any critical strike on an
    enemy, and from 0 as a map starts. Over the first maps it took the bots' critical strike rate from about 4% to 30% for
    slow hitters and from 5% to 18% for a fast one.
  - **Shared Agony** takes its share after a shell, splits it evenly over the standing minions and takes it from their life
    as it is (no second mitigation); what a minion cannot hold is lost with it.
  - **The Spreading Hex** passes curses within 6 tiles, for the time they had left (at least a second), when the kill is
    the character's.
  - **Searing Excess** counts the resistance above the cap from gear, tree and lasting effects (not flasks), after the
    map's resistance penalty.
  - **Two-handed** means two-handed melee, as on the tree (the owner, the same day): the Wrath's speed and its reflect are
    both two-handed melee attacks' only. Then across the game: a bow is no longer a two-handed weapon to a skill, a passive
    or a relic (DESIGN.md Appendix A), so none of the tree's two-handed nodes helps a bow, even under a melee skill such as
    Twin Cut, which a bow allows.
- **2026-10-30, the tree audit.** A read of the tree against this branch, findings in chat; the owner's answers:
  - Close Quarters gives what its text says, up to 50% more close and 50% less far (it gave 30% more); the Close Quarters
    support shares the rule.
  - The two flat energy shield nodes give 11, not 15 (the item cut); percent nodes stay.
  - Any tree reset clears the relic records that name passives (`resetTree`, `data/tree/rules.ts`, used by every save
    migration), so the relics' uses come back; another class's start is kept.
  - Pyre of the Lesser can take 219 of the 279 notables; the rest share a cluster or have one small node.
  - Waiting: the flask stats, charge gain on the tree, and the design philosophy before any rebuild.
