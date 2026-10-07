# Authoring unique decisions

How to turn reference uniques into Bob's own (docs/COVERAGE.md, plan C3). A decision file is a JSON array in
`docs/coverage/uniques/`; `npm run coverage:emit` turns all of them into `src/data/uniquesGen.ts`.

## One decision

```json
{
  "ref": "Reference Name",
  "name": "Our Own Name",
  "flavour": "One short line of our own.",
  "note": "What it does and why it counts: the defining mechanic, and what was dropped.",
  "drop": ["substring of a reference line to leave out"],
  "mods": [{ "stat": "damage", "kind": "inc", "min": 20, "max": 30, "tags": ["spell"] }]
}
```

- `ref` is the reference unique's exact name. See its lines with `npx tsx scripts/coverage/translate.ts "Reference Name"`:
  each line is `ok` (the translator maps it), `skip` (ignored, never matters) or `???` (open).
- Every open line must be either **dropped** (`drop`: a substring of the line; say so in `note`), or written by hand in
  `mods` / `triggers`, or the unique is **skipped** (no decision at all).
- `name` and `flavour` are yours. **Never** use a reference name, never copy or paraphrase reference flavour text, and
  keep names in the same register as the existing ones (see `docs/coverage/uniques/c3-001.json`): two or three words, no
  apostrophe-genitives of the reference owner. The name must be unique.
- `status` defaults to `covered`. Only write decisions whose **defining mechanic survives** (COVERAGE.md section 2):
  secondary lines may be simplified or dropped, but the reason the item exists must stay. If the defining mechanic cannot
  be expressed with what exists, skip the unique and record why (below). Do not write `partial` decisions.
- Hand-written `mods` use Bob's stat ids: any key of `STAT_TEXT` in `src/data/statText.ts`, plus the family prefixes
  there (`convertSkill.<from>.<to>`, `gain.<from>.<to>`, `chargeOn.<event>.<kind>`, `buffOn.<event>.<buff>`,
  `penetration` with `damageTypes`, ...). Fields: `stat`, `kind` (`base|inc|more|flag|override`), `min`, `max`,
  optional `damageTypes`, `tags` (skill tags, `SKILL_TAGS` in `src/mods/types.ts`), `condition` `{ id, not? }` (ids in
  `CONDITIONS` there), `per` `{ stat, div }`, `local`. Look at `src/data/uniquesGen.ts` (generated, hence the exact
  forms the translator gives) and `scripts/coverage/modDict.ts` for how reference
  phrases map: reuse the same stats for the same meaning. Percent values are numbers (20 = 20%).
- `triggers` are `TriggerDef` literals (`src/data/triggers.ts`); only use ones whose effect kind already exists.
- Flat defences are scaled by the translator (armour and evasion 0.6, energy shield 0.45); hand-written flat
  defences should apply the same ratio. Do not change numbers otherwise: they are the 3.9 values.

## What to skip, and what to drop

Skip (and say which engine system it needs) when the defining line is one of: minions, spectres, totems, traps, mines,
brands, curses beyond what exists, auras/heralds/banners/warcries (unless the stat exists), skill-granting
(`Grants Level N ... Skill`, `Socketed Gems are Supported by ...`, triggers with no matching `TriggerEffect`), vaal
skills, corpse mechanics, ground effects, map/atlas/sextant/league mechanics, flask-charge systems that do not exist,
or anything whose stat does not exist in `STAT_TEXT`. Drop (with a word in `note`) when the open line is secondary:
life/mana on kill variants, duration/rarity/knockback/flee, `Cannot be Frozen` family if the stat does not exist, etc.

If a stat is used by three or more skipped uniques, report it as a proposed verb.

## Checking

```
npx tsx scripts/coverage/emit-uniques.ts --check docs/coverage/uniques/<your file>.json
```

It builds every decision (reporting open lines), checks the stats, conditions, names and ids, and writes nothing. Fix
every problem. **Do not run `coverage:emit`, and do not edit `src/` or any other file**: the maintainer emits all files
together.
