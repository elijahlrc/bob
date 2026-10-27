# New-player fixes (plan, 2026-10-20)

Two playthroughs as a first-time player (a Mystic to level 11 on the dev server, a Vanguard to map 9 on a frozen build of
99eafc4 at phone width) found the issues below. This plan fixes the large ones, plus empty flask slots never showing as
upgrades and the "SO"/"VO" skill bar labels. Out of scope for now: Bone Dust arriving after the first Quartermaster,
reward and Gem Hoard cards without a comparison, the "Quartermaster" notable name, and the length of the map 10 boss.

Milestones run in order. N1 and N2 are small and independent; N3 changes the early picks; N4 changes what the Skills tab
promises. Decisions the spec does not cover go in DESIGN.md Appendix A.

**Cut by the user (2026-10-20):** the Gem Hoard changes in N3, all of N5 (being short of mana early is a valid state),
all of N6, and the buff-uptime change in N4 (buffs stay counted as on, as the preview does today).

**Built (2026-10-20), N1 to N4:**

- N1: as planned. The new card test also found Void Curse's "+9 to damage.min against them" (its pair was rendered one mod
  at a time) and Mouldering Host's `damageTaken` dropping its damage type; both fixed. The weapon reason "needs a axe" had
  the same article bug.
- N2: as planned; the badge reads "▲ empty flask slot", and quick-equip already fills an empty slot first.
- N3: `weaponBar` (`src/data/weaponFit.ts`) is the one weapon rule for `Character` and the picks; `gemWeight` takes the
  hold. The new picks changed seed 7001's Strider campaign in `stall.test.ts`, which then stood 20 s on map 11 shooting
  a rare whose summoned minions took every arrow. Fixed in the AI rather than the test: a target its hits have not
  reached for 4 s while 3 land on other enemies is set aside for 4 s (`SCREENED_*`, docs/PLAYER-AI.md 2). A 3-run bot
  sample to map 30 (seed 11) looked the same before and after.
- N4: the headline is `sheetDps(sheetOf(run))` (what the badges compare), with the main skill's own DPS and the mana
  figure on the second line; the badge reads `mainSheet().sustain` like the header. `settlePrimary`
  (`src/run/primary.ts`) picks the strongest skill as primary while none is starred (`Build.primaryAuto`), after every
  camp action, a map and loading a save; a star from the player is kept. A placement over a gem carries `fromRemoval`,
  and a support that would act on nothing or a skill the rotation never casts carries `idle` (`Character.unusedWhy`).
  On the playtest Mystic, Creeping Plague and Rime Drift as primary rate within 0.3% of each other in total, so the auto
  pick can be either; the old headline (main skill only) was what made one look six times the other.

## N1. Card text and labels (small)

| Bug                                                                                                     | Cause                                                                                                                                                                     | Fix                                                                                                                                                                                                                                                                                                             |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Flask cards print `flask.maxCharges`, `flask.duration`, `flask.amount`, and would print `flask.instant` | No `STAT_TEXT` entries for the flask-local keys; `statName` falls back to the key (`src/mods/text.ts:46`, `:79`)                                                          | Add text for the four keys in `src/data/statText.ts`                                                                                                                                                                                                                                                            |
| Rimeplate shows "8% less damage taken from Hits while stationary" twice                                 | `statName` (`text.ts:35-47`) uses `damageTypes` only for `damage`/`minDamage`/`maxDamage`                                                                                 | Use `damageTypes` for `hitTakenType` too ("less physical damage taken…", "less fire damage taken…")                                                                                                                                                                                                             |
| Rot Touch says "Shouts at enemies" and "shared with the other warcries"                                 | Its data has `utility: { kind: 'shout' }` (`gemsGen.ts:3335`); the shout branch of `utilityLines` (`gemText.ts:129-147`) hard-codes warcry wording and ignores `u.policy` | Word the branch by skill type: a spell that is not a warcry gets "Curses…/Afflicts enemies within…" and no shared warcry cooldown; take the policy line from `u.policy`. Check whether `kind: 'shout'` also makes the sim share the warcry cooldown with real warcries, and fix that in the decision file if so |
| Skitter Flash shows "0% increased Projectile Speed" at level 1                                          | Zero-valued gem mods are kept (`gemMods`, `modsText` filters only empty strings)                                                                                          | Drop mods whose value at this level is 0 in the gem card (stats, supports, auras)                                                                                                                                                                                                                               |
| "needs a attack skill", and a "needs a an active skill skill" path                                      | `skillTypes.ts:71`, `:73`, `gemStatus.ts:73-74`                                                                                                                           | One helper that picks "a"/"an" and does not double "skill"                                                                                                                                                                                                                                                      |
| "up to 20) ; slows" and "(renewed by each application) passed on"                                       | `dotLine` (`src/ui/gemFx.ts:15-33`) joins parts with a space                                                                                                              | Join with "; " / ", " so each part reads on                                                                                                                                                                                                                                                                     |
| Skill bar "SO" (Standard of Dread), "VO" (Veil of Grace)                                                | `initialsOf` (`src/calc/skillLook.ts:105-110`) takes the first two words                                                                                                  | Skip short joining words (of, the, and, a, an, to) before taking initials: "SD", "VG"                                                                                                                                                                                                                           |

Tests:

- `statText.test.ts` also collects `FLASK_AFFIXES`, flask base buffs and unique mods.
- `gemText.test.ts` "never says the same thing twice" also checks `.effects`.
- A new test that no gem card line at levels 1 and 20 contains a `.`-separated stat key or a "0%" value.
- An `initialsOf` test for both names.

## N2. Empty flask slots count as upgrades (small)

`itemInfos` (`src/run/inventoryOps.ts:131-133`) never scores flasks, so `isUpgrade` is false for every flask, and the row
badges skip flasks (`ItemList.tsx:67`).

- A flask the character can use is an upgrade when a flask slot is empty. The ranking for "show the best" puts it
  after gear by giving it a fixed `scorePct` (it says nothing about damage).
- The row shows "▲ empty flask slot" instead of a DPS/EHP badge.
- Replacing a worn flask stays a choice the player makes. No score is invented for it here; `flaskTarget` already
  picks the slot.
- Test: a run with an empty flask slot and a flask in the bag reports one upgrade, and "show the best" selects it when
  no gear is better.

## N3. Early gem picks fit the character

The first four picks draw three gems from every active gem with no filter (`rollSkillRewards`, `src/run/run.ts:424`).
The Vanguard was offered three bow skills; the Mystic a sword skill and a mace skill. Drops are weighted by attribute
but not by weapon (`gemWeight`, `src/gen/loot.ts:423`), and the Gem Hoard can offer a "bow" kind to a mace user.

- **Picks (maps 1 to 4):** draw only gems the character can use with the weapon it holds now. Use the same check as
  `Character` (`requiresWeapon`, two-hand, dual-wield, shield; `character.ts:852-880`), factored into one exported
  helper (`gemUsableWith(def, build)`), so the pick and the Skills tab agree. Weight the draw with `gemWeight` (class
  attribute ×4 early) and leave out the "special" gems the drops already hold back early. At least one of the three is
  a damage skill of the class's main attribute.
- **Drops:** gems the character cannot use with its weapon get half the weight (×0.5; ×0.25 at first), not zero: a player may change
  weapons, and the bow gems are still found.
- ~~Gem Hoard filtering and support usability~~ (cut).
- Tests: for each class with its start weapon, 200 seeds of maps 1 to 4 give only usable picks.
- Record the rule in DESIGN.md Appendix A (it narrows §5.3's free pick).

## N4. The Skills tab says what will happen

The per-socket preview and the headline measure different things (`placementsFor`, `inventoryOps.ts:340-393`, uses
`sheetDps` with every buff on; the headline, `Skills.tsx:245`, is the main skill alone, buffs off, after the time and
mana other skills take). So utility gems preview "+2-3%" and then lower the headline, and adding a skill can make the
headline fall from 49 to 12.7.

1. **One number.** The headline becomes the whole rotation's DPS, computed exactly as the preview computes it (same
   function, same config), with the main skill's share as the second line ("Rime Drift 72 · Creeping Plague 13 every
   3.6 s"). Buffs stay counted as on (`steady`), as the preview does today; the headline adopts that config.
2. **Mana, one figure.** The badge (`gemStatus.ts:33-48`) passes `resourceTaken` like the header (`mainSheet`), so
   "pays for 0%" and "Mana-starved (8%)" cannot disagree.
3. **A replacement credits the right gem.** When the target socket holds a gem, the preview says what removing that
   gem does and what the new gem adds, separately: "+4% (from removing Withering Breath); Triple Shot: no effect,
   Rime Drift fires one skull". A support whose `supportLive` is false never shows a gain of its own.
4. **The default primary is the best skill.** With no `primaryGem` set, the primary is the usable active with the
   highest sheet DPS, not the first in slot order (`character.ts:938-942`). Socketing a new skill never takes the
   star from a skill the player starred.
5. **"No change" says why.** A periodic skill that reaches less than the main skill is never cast
   (`character.ts:1996-2010`); its badge says "never used: shorter reach than Rime Drift" instead of "no change". A gem
   the weapon cannot use says so (it already has a reason; show it on the badge). Cinder Bond's "no change" is to be
   checked at run time first (the calc does not model its beams; it may be a real small gain under the 0.5% badge
   threshold).

- Tests: for every utility gem in a fixed build, the preview's sign matches the headline's change after socketing; the
  badge and header sustain agree; socketing a second skill keeps the higher-DPS one as primary.

## ~~N5. Early mana~~ (cut by the user: a valid state to be in)

Both classes were short of mana from level 1: Rupture Line costs 8 on a 47-mana pool regenerating 0.82/s ("pays for
8% of its casts"), and the basic attack did 14% of the Mystic's boss damage and 31% of the Vanguard's map 8 damage. The
rotation plan does not model mana at all (`planRotation`), so the sheet shows full-rate casting the sim never reaches.

1. **Measure.** Add to the bot report, per class and map band (1-5, 6-10, 11-20), the share of damage dealt by the
   default attack and the share of time spent unable to pay. This is the target to move.
2. **Choose a lever** (user decision): lower the level-1 costs of the starter-tier skills toward their reference
   values; raise base mana regen early (a flat bonus that fades by level 10); give every class a mana flask that refills
   faster; or make the plan model mana so the sheet at least tells the truth. Recommendation: make the plan model mana
   (the sheet then shows the real number), then pick one lever by the measurement, not several.
3. Rerun the sim; keep XP pacing and deaths per map band within today's range.

## ~~N6. Camp warns before a risky map~~ (cut by the user)

The Vanguard died 19 s into a map two levels up, starting at 83% life with its life flask at 14% charges and three flask
slots empty; camp shows life and flask fill only as small gauges (`Arriving`, `src/ui/Camp.tsx:147-191`) and leaves
empty slots out.

- One line under the gauges when it applies, in the voice of the existing warnings: "Your life flask is nearly empty",
  "3 flask slots are empty", "Life 62%: Respite refills it". Thresholds reuse `isHurt` / `HURT_BELOW`
  (`src/run/offers.ts:75-77`).
- A map card above the character's level adds "Monsters are 2 levels above you" when life or flasks are low.
- Text follows the concise-text rule; no line when nothing is wrong.

# Second pass: a player who knows one older action RPG (plan, 2026-10-25)

Two fresh Vanguard runs (desktop, maps 1 to 10) were played as someone who played the popular click-to-move action RPG of
a decade ago and nothing since. Run 1 took every reward gem and never found the Skills tab: Default Attack all the way,
dead on map 3 at level 2. Run 2 socketed and equipped what the game suggested: dead to the Tollkeeper after 382 s with
0% lightning resistance, no support gem, and the Default Attack doing 30% of the boss damage. The owner's notes on the
title screen and the first map are folded in.

**Left alone by the owner:** life carrying over between maps, mana as a thing to manage (only the orb flash in N12),
the Gem Hoard offering skills for other weapons.

Order: N7 and N8 first (the gem flow is the priority), then the small fixes (N12), the first-run guidance (N9 to N11)
and the vocabulary (N13). What a player sees once is remembered per device in prefs (`bob.pref.intro.*`), not per run
like the existing `Tip` (`src/ui/Tip.tsx`), so a second run starts clean. Decisions go in DESIGN.md Appendix A; text
follows the concise-text rule and the voice rule (plain rules text, overwrought headings allowed).

**Built (2026-10-25):**

- N7: as planned. Every socket of an item is linked in Bob, so the explainer and the chain's hover text say "the same
  item". The map-5 support follows the rule that pick already has (the class's own attributes) and takes the first card
  the Wayside left. The bag line and the no-skill warning are one line in camp (`CampGems`, `src/ui/GemFlow.tsx`); the
  warning takes its place when it applies. The first-support note sits in the Skills tab, once per device
  (`src/ui/intro.ts`). The map-5 support measured with `npm run sim -- --runs 12 --class all --maps 1-20 --seed 7`
  against the same code without it: deaths before map 20 14 (16 without), deaths on the map-20 boss 40 (36, the runs
  that got further), the same pacing; within the noise of 12 runs a class.
- N8: `dryEquip` leaves `idle` empty (it needs a `Character`); `swapSockets` adds it for the question before a swap, and
  the bag rows work it out for weapon and off-hand slots only, the ones that change which skills can be used.
- N12: as planned. The Tollkeeper's camp card also said a toll every ten seconds; it is twelve (`TOLL_EVERY`). The
  boss fight mixes are measured (DESIGN.md Appendix A, 2026-10-25); the Rotwife reads almost all physical because her
  ailments are damage over time, which no card counts. The tab arrows are sticky ends inside the scrolling band
  (`.tabs-arrow`). The title board: New Run on a line of its own, each saved run as its class, level and map with a
  Continue button and small Copy and Delete, and the tagline on a green plaque with a pale rim (every button's is gold).
- N9: as planned (`src/ui/FirstMap.tsx`). The tags are measured against the orbs and the speed buttons, so they hold at
  every layout: above each orb, the speed tag beside a row of speed buttons when there is room and to the left of the
  phone's column of them (the card then sits below the column). The biome banner waits until it is gone. On a mouse
  the words are "Hover over icons", on a touch screen "Tap icons".
- N10: as planned (`src/ui/RunIntro.tsx`), headed "The road through the hundred maps". On a phone a tab's name and its
  line run on one line. "Show the tips again" on the title brings back N9 to N11, the first-support note and the Skills
  tab's note.
- N11: the rings are drawn in the tree's word layer, so they pan and zoom with it; the words are a plaque at the foot of
  the view (on the tree they covered one of the nodes).
- N13: `src/data/glossary.ts` (`GLOSSARY`, `glossFor` by stat id, `TAG_GLOSSARY` for gem tags). Every Character tab
  row, medallion, the estimates and four section headings explain themselves on hover or tap (a dotted underline marks
  a row that does), with one line over the columns on what ×1.10 means. Item cards explain their weapon line, defences
  and item level; gem cards their common tags. The HUD's status pills already had their lines.

## N7. Gem socketing flow (priority)

Today a reward gem goes to the bag. The Next button walks Items → Skills, where the red "No usable active skill" line and
"Socket in the best place" are, but the Next map tab, a reload (Continue opens on Next map) and the map screen never warn,
and the skill icon only says "Default Attack · … · Ready".

1. **The first skill gem socketed for you.** The map-1 pick only, and only when no active skill is socketed: taking it
   puts it in its best place (`bestPlacement`, `src/run/inventoryOps.ts`), inside `takeReward` (`src/run/run.ts`) so the
   bot and the game agree. The pick's result says where it went ("Thunder Rebuke is in your Dented Plate"). Every
   later gem pick stays in the bag. Test: map-1 pick socketed; a map-2 pick not; a run that already has a skill
   socketed not.
2. **A later gem pick offers to socket it.** Taking a gem leaves a line in its place: "Rime Mallet is in your bag",
   with **Socket it** (best place, the same action as the Skills tab) and nothing else to read.
3. **Leaving camp without a skill is guarded.** When no usable active skill is socketed and a usable one is in the bag,
   the Next map tab shows the vermilion line with a **Socket it** button, and starting a map asks once (`Confirm.tsx`).
4. **The map says why.** The skill icon's tooltip adds "No skill gem socketed" when that is the reason for the Default
   Attack.
5. **The Skills tab explains itself once.** The "?" hint (which names a ★ before any skill has one) becomes a first-open
   note: skill gems are your character's skills and go in your gear's sockets; a support works on a skill in a socket
   linked to it. The chain mark between sockets gets hover text saying the same.
6. **The first support.** A one-time note when the first support gem arrives (what linking means, which of your skills
   it would work with), and the map-5 pick always holds a support that works with the main skill. Check with
   `npm run sim` that deaths and pacing by map band stay where they are.

## N8. A swap that drops or idles a skill asks first

The warning exists but is quiet: `SocketOutcome` (`src/run/inventory.ts`) carries `out` and `idle`; the compare tab shows
"⚠ a gem idles" or "⚠ 2 gems out", the detail has a line, and the bag row shows "⚠ N gems out" (`gemsOut`) but not idle
gems. Nothing asks before the swap. In run 2, following ▲ swapped a mace for a sceptre and a socketed Rime Splinter
stopped working.

- **Wear** and **Carry** (and quick-equip, `quickEquip`) ask first (`Confirm.tsx`) when a socketed active skill goes to
  the bag or stops working, naming it; the primary skill in vermilion. A support that idles gets the line only, so
  confirms stay rare.
- The bag row's warning also counts skills that would idle ("⚠ Rime Splinter stops").
- Test: a sceptre over a mace with a mace-only skill socketed reports the skill as idle; the row shows it.

## N9. The first map

First map of the device's first run:

- A headline: your character fights on its own; between maps you make it stronger.
- An arrow to the life and mana orbs: "Tap icons for more information" ("Click" with a mouse).
- An arrow to the pause and speed buttons, labelled.
- The map starts paused under it; any tap, or **Begin**, dismisses it and starts the map.
- The orbs, flasks and skill icons already answer a tap (and a hover) with their info (`infoProps`, `src/ui/info.tsx`).

## N10. After map 1: how a run goes

Once per device, after map 1 clears and before the camp opens (which then opens on Items as now), one screen. A draft,
to be cut down:

- Your character fights each map on its own. Between maps, you make it stronger.
- Clear 100 maps to win. If your character dies, the run is over.
- One line per tab:
  - **Character:** your life, defences and damage.
  - **Passive tree:** a point every level, spent on lasting bonuses.
  - **Items:** the gear you found; ▲ marks an upgrade.
  - **Skills:** skill gems go in your gear's sockets; they are what your character uses.
  - **Strategy:** when your character uses each skill and flask.
  - **Last map:** what you dealt and what hurt you.
  - **Next map:** where you go next.

A "Show the tips again" button on the title screen clears the `intro.*` prefs (also what testing needs).

## N11. The passive tree, the first time

The first time the tree opens with a point to spend, the nodes linked to the class start pulse, with a label: "Pick one of
these to start." It goes once a node is taken.

## N12. Small fixes

- **Boss text:** remove "Stun it in the swing to stop the toll." (`src/data/monsterInfo.ts`): the player cannot do it.
  Check every boss and mini-boss line for counterplay the player has no way to do.
- **A boss map's damage mix includes the boss.** The card's mix comes from the theme's types and the affixes only
  (`themeInfo`, `src/run/themeInfo.ts`), so the Tollkeeper's map read "physical 64%, chaos 29%" while the Toll did 85% of
  the last 5 s. Blend the boss's own mix in by its share of the damage taken on its map, measured with the bot. Test:
  the Tollkeeper's card shows lightning.
- **The mana orb flashes** while the main skill cannot be paid (the state that turns its icon red), after about a
  second, until it can.
- **Tab bar arrows:** ◂ and ▸ at the ends of the camp tabs when they overflow; a click scrolls; an arrow hides at its end
  and both hide when the tabs fit.
- **Title screen:**
  - New Run is the large primary button.
  - The saves read as a list of your runs, each with its own **Continue**; Copy and Delete are smaller.
  - The tagline gets a green field and a plaque outline instead of a button's bezel.
  - Judged by screenshots at desktop and phone width.

## N13. Words a newcomer does not know

_Revised 2026-10-26: the Character tab's tips keep these plain lines and add the formula with the character's numbers (`src/ui/sheetMath.ts`; DESIGN.md Appendix A)._

- `src/data/glossary.ts`: one plain line per term, in our own words. The terms:
  - Armour, evasion, energy shield, block.
  - Resistances and their 75% cap.
  - Stun, critical strike, the ailments (ignite, chill, freeze, shock, poison, bleed).
  - "increased" against "more".
  - DPS, effective HP.
  - Attributes and requirements.
  - Mana cost and reservation, reach, area, projectile.
  - Magic, rare and unique.
  - Item level, quantity, rarity.
  - A faction's share on a map card.
- **Character tab:** every row and section header answers a hover or tap with its line (none has one today).
- The same lines on the HUD status pills, the defence lines of item cards and the tag line of gem cards.
- Test: every Character tab row has a glossary entry.

## Verifying

- Each milestone: `npm run check` and `npm run build`.
- Then a browser pass on a fresh origin (`http://newplayer.localhost:5173`, its telemetry pref set off first), at desktop
  and phone width.
- Patch notes only through `/patch-notes`.
