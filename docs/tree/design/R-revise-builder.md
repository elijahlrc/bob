# The builder's brief for the revision's first pass (2026-10-31)

One builder agent per region, one region at a time, in this order: the Knife, the Spire, the Bow, the Yard, the Wall,
the Cathedral, then the centre. Each builder revises its region for the owner's feedback and hands back. A reviewer
agent reviews the whole first pass afterwards.

## Read first

- `R-feedback.md`: the owner's four points and the measurements.
- `R-revise.md`: the approved plan. Its §7 holds the notes of the regions done before yours: read them, so your region
  does not copy their forms.
- `CONSTRAINTS.md` §16, items 14 to 20 above all; `D-method.md` (how area files are written); `PHILOSOPHY.md`.
- `R-skeleton.md`: your region's section, and §1 as `R-revise.md` §2 amends it.
- `R-reviewer.md` §3: the questions the reviewer will ask of your work.

## Region names

| Folder | Class (`--region` for the tools) | Start id |
| --- | --- | --- |
| knife | shade | start.shade |
| spire | mystic | start.mystic |
| bow | strider | start.strider |
| yard | reaver | start.reaver |
| wall | vanguard | start.vanguard |
| cathedral | zealot | start.zealot |
| centre | (none) | |

## The work

Revise your region's area files (`src/data/passives/<folder>/*.ts`) by hand for the four items:

1. **Every notable hung behind another notable gets a real place**, in a new cluster or in an existing cluster grown to
   make room for it. `revise-check.ts --list` names them. The test is the owner's reason: taking a cluster's notable must
   no longer force a point into the next. The same goes for a wheel entered only through its notable (Quick Wrists,
   Hard Target, Grit and Gravel).
2. **The start's V goes.** The generalist at its bottom leads somewhere: a way onward, not the end of a path. The start
   may change shape (three exits, a fork at another step), keeping about six directions by the third point and a strong
   first small that prescribes nothing. Dead-end notables near the start should become ways onward where that makes a
   better start.
3. **Your region's own small-scale forms.** Decide the forms that suit the region's identity, and name them in your
   note. Do not repeat what the regions before you did.
4. **Clusters connect to clusters**, inside the region and across its borders: a cluster grown off a related one, links
   between existing clusters. A route through clusters is slower than the road between the same two points, with more
   nodes but richer ones. A cluster link that comes out shorter than the road is a shortcut: avoid it.

The node count may rise. Thin a road a little where a cluster route now does its work. The notable count may grow a
little where a new cluster is better with its own notable of its own.

## Rules

- Every new node and link has a `why` (D-method). Keep the existing notables' lines, unless a moved notable has to
  change to fit its new cluster; give new smalls lines from the existing vocabulary (`src/data/passives/lines.ts`).
  Avoid new line kinds; if one is unavoidable, add it to `lines.ts`, `vocab.ts` and `src/data/statText.ts` and say so.
- A moved notable gets a new id when it changes cluster; fix every link into its old id (other regions' files
  included). Never change the id of a node that stays.
- Edit other regions' files only to fix a link into a node you moved, or to add a link across a border (a link is
  written in the file of its `from` node: you may write it in your own file).
- Keep about 12 steps between neighbouring starts.
- Do not run `passives:register` or `passives:bake`, and do not commit. Touch no file outside `src/data/passives/` and
  `docs/tree/design/`. Leave the other sessions' changes alone.
- Never name the reference game, its tools, its wiki or its proper nouns. `reference/` (local) may be studied, never
  copied.

## Checks before you hand back

Run each with Node on PATH (`export PATH="/c/Program Files/nodejs:$PATH"` in Bash):

- `npx tsx scripts/passives/geometry.ts --region <class>`: 0 crossings, 0 nodes drawn over.
- `npx tsx scripts/passives/rework/reach.ts <class>`: nothing unreachable, no road dead ends.
- `npx tsx scripts/passives/rework/revise-check.ts --list`: your region's hung count 0; its start distances about 12;
  no new shortcuts in its part of the list; its dead-end notables near the start.
- `npx tsx scripts/passives/rework/ref-names.ts`: no reference names.
- `npx tsx scripts/passives/pic.ts docs/tree/design/R2-<folder>.png --region <class> --no-areas`: look at it.
  Re-render after fixes.

## Hand back

- Your region's note appended to `R-revise.md` §7: what was done for each of the four items, the forms used, the
  node and notable count before and after, and anything left open.
- In your reply, the same in short, the numbers from the checks, and every file you changed outside your folder.
