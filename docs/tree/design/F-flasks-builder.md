# The builder's brief for the flask-lines pass (2026-11-01)

One builder agent per region. Two waves of regions that do not touch: the Spire, the Bow and the Wall first, then the
Knife, the Yard and the Cathedral. The centre is done by the lead.

## Read first

- `F-flasks.md`: the approved plan. Section 3's table is your region's assignment; section 2 says what each line does.
- `docs/ATTRITION.md` section 2, "Flask lines on the tree": the owner's goals.
- `R-revise-builder.md`: the rules, the region names and the checks of the tree revision. They all still hold, except
  where this brief says otherwise.
- `src/data/passives/lines.ts`: the flask lines, old and new (search for `flask`). The new ones are
  `flaskChargesPerCharge(charge, v)`, `flaskChargesKilledBy(ailment, v)`, `flaskLifeRecovery`, `flaskManaRecovery`,
  `flaskLifeRate`, `flaskMaxCharges`, `flaskLastSlotRecovery` and `flaskLowLifeRecovery`. They are already in the
  engine and the editor's vocabulary: add no new line kinds.

## The work

Your region ends with about four flask nodes: three notables (near the start, further out, far out) and one or two small
nodes leading to them. Every other flask line in your region goes.

1. **Near the start** (the notable 5 or 6 points out today, or a new one where there is none): it gives your row's
   "near the start" lines and nothing else of flask. It stays a way onward, not a dead end.
2. **Further out** (about 8 to 12 points): a notable with your row's "further out" lines. Reuse an existing node where
   one fits; otherwise add one in a cluster that suits it.
3. **Far out:** the charges-on-kill notable, **at least 10 points from every start**, on a notable, never on small
   nodes. Use `flaskChargesKilledBy` (the Spire: `'ignite'`, the Knife: `'poison'`, the Yard: `'bleed'`) or
   `flaskChargesPerCharge` (the Bow: `'fervour'`, the Wall: `'grit'`, the Cathedral: `'insight'`). Put it where the
   builds that deal that ailment or hold those charges already go: beside the region's burning, poison, bleeding, fervour,
   grit or insight notables.
4. **No other sustain on a flask node:** a flask notable carries no regeneration, leech, life or mana on hit or kill,
   or "recover on" line. Where one has such a line today (Draught's mana on kill, Supply Line's life on kill), move that
   line to a nearby non-flask node or drop it, and say which.
5. **No charges on kill anywhere else:** the old `flaskCharges` line is gone from your region.

**The Bow only:** most of its 14 flask nodes go. The notables that lose their flask lines (Hunter's Satchel, Spare Stock,
Field Kit, Supply Line, Field Poultice, as fits) become non-flask notables for the region's own builds: moving against
standing still, Quickened and Elusive, evasion, projectiles. Give each a real reason in its `why`. Their small nodes take
lines of their new notable's theme.

**The Cathedral only:** it has no flask nodes today, so all three are new (new nodes, or existing notables re-lined
where that suits the region better). It is also where mana builds go: one small may carry `flaskManaRecovery`.

## Prices

The unit prices are in `lines.ts`. Price a flask notable at about what a regeneration notable of your region costs, and
like the notables around it. A far notable may carry its charges line alone. Write the price in the `why` as the other
nodes do.

## Rules

- Nodes may be added, moved and removed for this pass (the owner, 2026-10-31), but keep each change small and purposeful.
  Everything in `R-revise-builder.md` "Rules" holds: a `why` on every node and link, ids of nodes that stay never change,
  links into a moved node fixed, about 12 steps between neighbouring starts, no `passives:register`, no bake, no commit,
  no file outside `src/data/passives/` and `docs/tree/design/` (not even `F-flasks.md`), no reference names.
- Touch only your region's folder, except to fix a link into a node you moved.

## Checks before you hand back

The checks in `R-revise-builder.md`, for your region: geometry (0 crossings, 0 drawn over), reach (nothing unreachable,
no road dead ends), `revise-check.ts --list` (hung 0, start distances unchanged, no new shortcuts), `ref-names.ts`, and
a picture `docs/tree/design/F2-<folder>.png` that you look at. Then the flask census:
`npx tsx C:/Users/littl/AppData/Local/Temp/claude/E--Proj-Auto/9a7a432d-9f98-4063-ad15-630068c6a794/scratchpad/flasknodes.ts`
(every flask node with its region and distance from the nearest start): your region's rows should read as above.

## Hand back

In your reply, short: each flask node of your region (id, name, points from the start, lines, price), what lost its
flask lines and what it gives now, what moved, the node count before and after, the numbers from the checks, every file
changed outside your folder, and anything left open. Do not write to `F-flasks.md`; the lead records the notes.
