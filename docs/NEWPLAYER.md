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
