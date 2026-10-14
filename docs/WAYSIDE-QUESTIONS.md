# Wayside: questions met while building, and what was chosen

Written while implementing [WAYSIDE.md](WAYSIDE.md) (2026-10-13 onwards), for the author to read later. Each entry says the
question, what was done in its place, and why. Nothing here blocked the work; every choice is cheap to change. Newest last.

## 2026-10-13 — build order

**Q. Y0 (measure) is first in the plan. Build it first?**
Chosen: no. The user said a wrong first guess is cheap to fix, so Y1 to Y6 are built with the plan's guessed numbers and the
measurement (lethal hits per map, Dust income per level, the `stopper` bot bound) is done in Y7, when there is something to
tune. WAYSIDE.md section 11 says so.

**Q. `RunState.wayside` required or optional?**
Chosen: optional, read through `waysideOf(run)`, which fills every missing field with a default. Old saves, test fixtures that
build a `RunState` literal and the showcase/gallery runs then need no change, and a new field never needs another save version.
`SAVE_VERSION` is 19 anyway (the doc said so), with version 18 accepted unchanged.

**Q. Where does "the level is over, roll the next offers" live?**
Chosen: one `advanceLevel(run)` in `run.ts`, called by `finishMap`, `takeRespite` and (new) the stops. There were two copies;
a third would have drifted.

## Y1 — stops

**Q. May a stop and a Respite share a set?**
Chosen: yes. The plan said only "never in the slot a forced Respite takes". A set can then be [map, stop, Respite]. Moving the
stop to another level would need state (which window already has its stop), and the schedule is deliberately stateless. If it feels
thin, the fix is to let a Respite replace the stop's slot instead.

**Q. How do the three offers keep their old streams?**
Chosen: the stop's level, kind and slot come from their own RNG forks (`stopat`, `stopkind`, `stopslot`), so adding stops did not
move the themes, offsets, types or Respites of any set. A stop replaces a slot after those rolls were made, as a Respite does.

**Q. Is a stop's screen saved?**
Chosen: no. The Next map tab holds it in memory and `takeStop` applies the whole choice at once (and is final: it clears undo).
A reload mid-stop returns to camp with the stop still on offer. This also avoids a "screen: stop" save state.

**Q. Does the Awlsmith's free socket apply to any item?**
Chosen: any worn or carried item that is not sealed, has no fixed sockets and is below its socket limit. The limit follows the
item's own level, so the starting gear often has no room; the stop is then useless until better gear is found, and the bot does not
take it. (If that is too stingy, the stop could also raise the ceiling by one.)

**Q. What does the Gem Hoard lay out for a kind?**
Chosen: active gems carrying that tag, plus supports that list the tag among what they support (not the supports that fit
anything), drawn by drop weight. Tags with fewer than eight such gems lay out fewer. Gems arrive at level 1 like any gem.

**Q. Does auto-continue pause for a stop?**
Chosen: yes, whenever a stop is in the set ("The Awlsmith is on offer"), because auto-continue takes the anchor map and a player
who is not looking would never see it. The pause ends when the player takes the anchor by hand or takes the stop.

**Q. What does the default bot do at a stop?**
Chosen: it takes the Awlsmith when a worn item has room (a socket on the item that holds its gems), and never the Gem Hoard; a
`stopper` strategy takes every stop it can use. Both are first guesses; Y7 measures them.

## Y2 — the Market

**Q. When is the stock rolled?**
Chosen: the first time the camp shows a level (`ensureMarket`, called from the controller's `changed()`), then stored in the save with
the level it is for. Rolling it from `advanceLevel` would have made `run.ts` import the Market (a cycle), and the bot never needs a
stock it does not look at. The roll itself uses its own RNG fork of the run seed and the level, and negative uids for the items in it,
so it never moves the run's `nextUid` and a reload shows the same wares. One consequence: "a gem you have not found yet" is judged
by what the run holds when the camp first shows the level.

**Q. Which wares does a stock hold?**
Chosen: three rares of the level just played, one gem, one magic utility flask and one currency bundle (six). The plan's Provision
and Reprieve slots arrive in Y3 and Y4 and take the place of one gear slot and the bundle. Gear is not tuned to the build.

**Q. How does the bot shop?**
Chosen: it buys a rare if wearing it would raise its score by more than 3%, and nothing else. A first guess for Y7.

**Q. Where is the Market in the UI?**
Chosen: its own "Wares" tab, after the Workbench (which is still closed). The offers panel keeps the Satchel strip for Y3.

## Y3 — provisions

**Q. How is a provision carried out in the map without new machinery?**
Chosen: each provision is a hidden map affix (`provision.<id>`, `fixed` so it does not follow the level band, `chalkOnly` so it is
never rolled or offered by Chalk), registered in `MAP_AFFIXES` from `data/provisions.ts`. The affix system already gives a player's
mods, the monsters' mods (Rushing Tonic), pack and rare-pack changes, the reward fractions (Greedy Lantern's +30% quantity) and the
threat model's reading of all of them. `planFor` adds the burning provisions' affixes after the offer's own; the offer cards and the
bot's scoring add the armed ones (`affixesWithArmed`) to what they compute but never to the list of affixes the card shows.

**Q. Where is the burn?**
Chosen: `startProvisions(run)` in `controller.startMap` and at the top of `playOffer` (the bot and tests): armed goes to
`wayside.active`, the Pouch loses them, and `finishMap` clears `active` (also on death). A Respite or a stop burns nothing.
A reload mid-map restores the camp save, so they come back (the user accepted this).

**Q. Crawl?**
Chosen: the burning provisions apply to all three maps of a Crawl (they stay `active` until the whole Crawl is finished).

**Q. Reward picks and provisions?**
The plan lists reward picks as a source. Not done: a pick is a list of items, gems, flasks or currency, and a provision is none of
them; adding a fifth kind touches the pick screen, the bot's pick and the save. Provisions come from the Market and (Y5) the
Quartermaster only for now. If wanted, a pick could hand out currency-like "pouch items".

**Q. A damage provision does a little more than its number.**
Whetted Powder (+12% more damage) lifts the early sheet's DPS by about 16%, and Glass Draught (+60%) by about 85%, because hits are
rounded to whole numbers at low damage. The numbers are first guesses and Y7 tunes the bonus down if the bot shows it matters.

**Q. What does the bot do with provisions?**
Chosen: it buys a staple when it costs under 40% of its Dust, then arms the staples it holds before choosing a map (so the map
scoring includes them). It never buys or arms a bet. Specialists do not exist yet (Y6).

**Q. Does the Character sheet show armed provisions?**
Chosen: no. Only the offer cards (and the bot's scoring of offers) count them; the sheet shows the build alone, so comparing gear is
not clouded by a buff that burns at the next map.

## Y4 — Reprieves

**Q. Do all the ways to die go through the one hook?**
Checked in the code: the player's life falls only in `applyDamage` (hits, ailments and ground effects all call it); the one other
place that lowers it, paying a life cost for a skill, cannot kill (`canPay` leaves 1 life). The Reprieve fires at the end of
`applyDamage`, before `killActor`, so the renderer's `death` and `playerDied` events never fire for a saved character. The plan's
"not verified: degeneration and the Collapse front" is now verified for the first two; the Collapse front uses the same damage call.

**Q. Boss levels?**
Chosen (the plan's 14.2 default): a Retreat item does nothing on any tenth map (a mini-boss, a boss, and map 100) and the character
dies as before; a Revive works everywhere, including map 100. Nothing in MAPS.md is reversed.

**Q. The `ReprievePolicy` seam?**
Not built. The plan named a policy "like `FlaskPolicy` and `AbandonPolicy`", but with the Recall Cord cut the only trigger is
"damage would kill", so a policy would have one possible answer. The hook is `reprieveFires(w)` in `sim/reprieve.ts`; a policy can
wrap it later if a second trigger appears.

**Q. How long is the safety after a Revive?**
Chosen: Last Spark 3 s (and throws back and stuns the monsters within 6 tiles for 1.5 s), Bargain Coin 1.5 s with no pulse. The plan
said the Coin had no invulnerability at all, but a Revive without a moment of safety is usually the same death again; 1.5 s is the
smallest grace. Both are guesses for Y7.

**Q. When does the Bargain Coin's curse start?**
Chosen: when it fires (the plan's table), for the next five levels, as the hidden affix `curse.bargain` (15% less maximum life) on
every map after it. A Ferryman's curse (Y5) is the same affix started when that stop is taken. Curses show in the Satchel strip and
count in the offer cards like an armed provision.

**Q. What happens in a Crawl?**
A Reprieve that fires in one of its three maps is spent at once (before the next map is built), so a Revive cannot save the
character twice; a Retreat ends the Crawl as an abandon and `combineCrawl` carries the Reprieve's id to the result.

**Q. How do Reprieves come to the player?**
The Market's last slot sells one on about one level in five from level 20 (never two in a row); a boss level's reward pick holds
one as one of its three cards 60% of the time (not on the picks of uniques after maps 25, 50 and 75); the Ferryman (Y5) gives one.
Provisions are also a possible card on a fifth map's pick (30%, never when the Pouch is full). To keep the old picks unchanged the
cards for the Wayside are decided with a stream of their own and replace one card.

**Q. What if a card no longer fits when it is taken?**
`takeReward` now returns whether it took: a card for the Wayside that does not fit (the Pouch filled, or a Reprieve was bought
since the pick appeared) leaves the pick open and says why. The bot passes on it.

**Q. The reward-pick type.**
`run.reward` is now `RewardCard[]` (an item, a gem, a flask, currency or a `PouchCard`), a new type in `run.ts`. Drops and `AnyItem`
are unchanged, so nothing else in the game sees a Pouch card.

## Y5 — the Shrine, the Quartermaster and the Ferryman

**Q. How long does a blessing last?**
Chosen: until any stop is taken (the plan's "until the next stop"); a Shrine then gives its own. So a blessing lasts about eight
levels. Seven blessings (life, damage, resistances, movement, armour and evasion, item quantity, attack and cast speed), three
offered per Shrine from the offer's own seed. Each is a hidden affix like a provision; the Shrine's "haste" had to be renamed
"swift" because the reference-game deny list matches the word.

**Q. The Quartermaster is bought in one go.**
The stop screen builds a cart and "Take the Quartermaster" pays for all of it, passes the level and rolls the next offers. Leaving
the screen buys nothing, so there is no free shopping trip. The stock is rolled from the offer's id (not stored), so it is the same
every time it is looked at; a cart is checked as a whole (Dust, Pouch room, one Reprieve) and refused whole.

**Q. What does the Ferryman take?**
Chosen: the Bargain curse (15% less maximum life) for five levels from the moment the stop is taken, whichever Reprieve is chosen.
The Bargain Coin also curses when it fires, so taking it free from the Ferryman and spending it can curse twice in a row (one
curse at a time: a second replaces the first's end date).

**Q. Swapping?**
The Ferryman may swap the Reprieve held for another (a checkbox on his screen); a swap counts toward the cap of three, as every
Reprieve taken does.

**Q. What does the default bot do?**
It takes the Ferryman (when it holds no Reprieve) and the Quartermaster when its cart holds a Reprieve; the Shrine and the Gem Hoard
only under the `stopper` strategy; the Awlsmith as before. Y7 measures all of it.
