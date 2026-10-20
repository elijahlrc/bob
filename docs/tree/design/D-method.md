# D. How the tree is written

Phase D of [PASSIVE-TREE.md](../../PASSIVE-TREE.md), decided 2026-10-19 after the user's review of the brief. The brief's
one rule above the others ("thousands of small decisions made with care") picks the method: **the tree is written by hand,
node by node and link by link, in files a reviewer can read; tools place coordinates, draw pictures and run the checks,
and never invent a node or a link.** This replaces generation (TREE-REDESIGN's eight iterations) outright.

## The files

`src/data/passives/` (a new folder; the old `src/data/tree/` stays until the swap in Phase F):

| File                 | What it is                                                                                                                                                                                                                                                                                                                                                               |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `types.ts`           | The authoring types below.                                                                                                                                                                                                                                                                                                                                               |
| `lines.ts`           | The vocabulary of node lines: one function per line a node may carry (`life(6)`, `meleePhys(10)`, `maceDamage(14)`...), each building the engine's `Mod`s. The _unit_ of each stat (the value of its small node) lives here, so a notable's strength in units is computable. A line the vocabulary lacks is added here first, with the stat it reads checked against A2. |
| `<region>/<area>.ts` | One file per area (and one `home.ts` per region, one `centre.ts`): the area's clusters, every node with its lines, every link, and the reasons.                                                                                                                                                                                                                          |
| `ids.json`           | The registry of stable ids: `"wall.rampart.bulwark.n": 412`. Append-only; a removed id keeps its number. Saves and rivals carry numbers, so renaming or reordering never breaks them.                                                                                                                                                                                    |
| `layout.ts`          | Places nodes: each cluster has a hand-set anchor and a shape (`ring`, `line`, `fan`, `spur`); a node may also be placed by hand. No automatic layout beyond that.                                                                                                                                                                                                        |
| `bake.ts` (scripts)  | Writes the game's `Tree` (`nodes`, `starts`) to `passivesBaked.ts`.                                                                                                                                                                                                                                                                                                      |

## What an area file says

```ts
export const rampart: Area = {
  id: 'wall.rampart',
  region: 'vanguard',
  name: 'Life and armour',
  at: [-1850, 700],
  why: "The Vanguard's base: every Vanguard build wants life and armour, so this is the first area and the cheapest...",
  clusters: [
    {
      id: 'bulwark',
      name: 'Bulwark',
      shape: 'ring',
      at: [-1700, 600],
      why: 'The first life cluster out of the home; a pass-through so the road to the maces runs through it.',
      nodes: [
        { id: 'a', kind: 'small', lines: [life(6)] },
        { id: 'b', kind: 'small', lines: [life(6)] },
        {
          id: 'n',
          kind: 'notable',
          name: 'Bulwark',
          lines: [life(12), armour(20), str(10)],
          why: 'Three units of life plus the armour the area is named by.',
        },
      ],
      links: [
        ['a', 'b'],
        ['b', 'n'],
      ],
      entrances: ['a', 'n'],
    },
  ],
  links: [
    { from: 'wall.home.porchA.b', to: 'bulwark.a', why: 'The rampart porch leads here.' },
    {
      from: 'bulwark.n',
      to: 'wall.maces.weight.a',
      why: 'Through the notable, not round it: the shortcut costs the notable (a pass-through wheel).',
    },
  ],
};
```

- **Every node has its lines spelled out**; a cluster's small nodes may differ from one another (two life, one life-and-armour)
  when there is a reason, and the reason is written.
- **Every link is a decision** with a `why`; a link without one is a bug the audit prints.
- **A `why` on every cluster and area**, and on any node whose line is not the obvious one for its cluster.
- **Attribute nodes** are nodes of kind `attribute` with a `str(20)` (or `str(10), dex(10)`) line; they are the only road nodes
  (brief §4).
- **Keystones** keep their existing engine flags (`src/data/tree/keystones.ts` is the source of their mods and text).

## What the tools print for a reviewer

- `npm run passives:list -- vanguard out.md` → a markdown page per region: each area, its clusters, every node's text
  (through `modsText`), its strength in units, and the reasons. This is what the user reads on a phone.
- `npm run passives:pic -- out.png --region vanguard [--ids]` → the region drawn with its area names, notable names and
  keystones (`--ids` labels every node); the whole tree without `--region`.
- `npm run passives:audit` → the brief's checks: the first fifteen steps from each start; keystone distances; attribute
  supply per attribute at 20/40/60 points beside the gear requirements; road share and the longest run with its reason;
  crossings with their costs; notable strength (weakest list); cluster coherence; decisions per 20 points; the supply grid
  with real steps; links without a reason; unreachable nodes.
- `npm run passives:bake` → the baked tree the game loads (`TREE=next` in the tools and the dev build until Phase F swaps
  it in).

## Editing by hand (2026-10-19)

`npm run passives:edit` opens the tree editor on the hand-written tree (`tree-editor.html?tree=next`; the editor is the
old tree's, `src/treeEditor/`, in a second mode). It first runs `npm run passives:register`, which gives every node id a
number in `ids.json` (append-only: a node keeps its number for as long as it keeps its id, so the patch below survives any
rewrite of the area files). Move nodes, change their type, add and remove nodes, make and cut links; Save (Ctrl+S) writes
`src/data/passives/edits.json`, a patch keyed by those numbers (the old tree's patch format, `src/data/tree/edits.ts`).
`buildAll` applies it, so `passives:list`, `passives:pic` and `passives:audit` show the edited tree; the listing still
reads the area files, so a node added in the editor (`edit.<number>`, no lines, no reason) shows in the picture and the
audit but not the listing. The patch is a scratch layer: what was moved, cut or joined in the editor is folded back into
the area files, with its reasons, once agreed, and the patch emptied to `{ "version": 1 }`. Zoomed in far enough, the
editor writes every node's stat lines under it ("stats" box; names and stats once they fit between nodes). A selected
node's lines are editable in the vocabulary of `lines.ts` (function and arguments; `Line.spec` records them, and the
patch's `lines` field carries them).

**Folding a patch back** (`npx tsx scripts/passives/fold.ts <region>`): rewrites the region's area files from the
patched tree, every cluster hand-placed, keeping the files' reasons, putting nodes added in the editor into an `added`
cluster of the area they join with their provisional names and a dated reason on every editor-made link. Then empty
`edits.json`, run `passives:register`, and check the picture. **Do this before registering any other region's new
nodes**: the patch's added nodes carry editor numbers from the end of the registry, and the next registered id would
take the same number and be silently replaced by the patch. The method the user's first patch taught is in
`D-network.md`.

## Order of work

1. The scaffolding above, with the vocabulary seeded from the stats the engine reads (A2) at the values the current tree's
   small nodes use (they are already the reference's magnitudes).
2. **The Wall (Vanguard) as the model region**, home to rim, with its share of the centre: the first draft the user sees in
   Phase D, and the test of the method itself. A pure class with the simplest brief (broad base, two towers).
3. The other five regions, one at a time, each sent as a draft; the centre; the crossings.
4. The tree screen's work (brief §10): region backgrounds in their own shapes, theme names, area labels, a phone legend.
5. Phase E's instruments (the audit above, the shopper bot, the simulated players), then Phase F.
