# G2. The Zealot (the Cathedral): the skeleton

Laid 2026-10-22 for phase G2 of [G-growth.md](../G-growth.md), from the joined brief [G1-brief.md](../G1-brief.md)
(which wins) and the region brief [G1/zealot.md](../G1/zealot.md), under [CONSTRAINTS.md](../CONSTRAINTS.md). Roads,
one cut and one re-hang inside the region only: no new cluster, no re-line, no link across a region line. Nothing is
registered or baked.

Pictures in [zealot/](zealot/): `before.png` (the region before the first edit), `after.png` (after),
`after-west.png` (the Churchyard's outer walk round the Bell Tower), `after-north.png` (the north walk round the
Undercroft), `after-aisle.png` (the aisle and Lone Vow).

**The region: 152 → 165 nodes** (13 new road nodes; no node removed; no id changed).

## 1. What was laid

| road                                      | file, cluster                                   | nodes | from → to                                                                               |
| ----------------------------------------- | ----------------------------------------------- | ----: | --------------------------------------------------------------------------------------- |
| **the aisle**                             | `nave.ts`, `cathedral.nave.aisle` (`a1`–`a3`)   |     3 | `nave.toChoir.a` → Consecrated Plate (`ambulatory.plate.n`)                             |
| **the outer walk** (area: The Churchyard) | `rim.ts`, `cathedral.rim.walk` (`o1`–`o4`)      |     4 | Censer (`ambulatory.censer.n`) → Thunder Peal (`ambulatory.peal.n`)                     |
| **the north walk**                        | `crypt.ts`, `cathedral.crypt.north` (`n1`–`n6`) |     6 | Kindled Steel (`ambulatory.kindled.n`) → its east end `n6` ← Tomb Dust (`crypt.tomb.n`) |

All road nodes are `attribute` nodes with `str(6), int(6)` (CONSTRAINTS §7.4, the region's hybrid road value), each
with a `why`; every new link has a `why`.

- **The aisle** is one straight line from the road node under Choirmaster to Consecrated Plate, and it carries on
  through Consecrated Plate and its first small to the Ambulatory's walk (`plate.a`, `walk.w4` lie on the same line), so
  it reads as one road from the Nave to the walk. Consecrated Plate becomes a crossroads (three links).
- **The outer walk** runs in three straight legs that turn at its two junctions: out from Censer along the rim to `o2`,
  along the rim outside the Searing Avatar keystone (about 300 units clear; the keystone keeps its one link) to `o4`,
  and in to Thunder Peal on the pocket's own line, so Thunder Peal's chain is straight from the walk's first node to the
  Churchyard. Censer and Thunder Peal become bridges; the Bell Tower has a loop round its back.
- **The north walk** carries Kindled Steel's chain straight out to the rim (`n1`), turns there, and follows the rim
  (radius about 4,570 to 4,430, bends of 5 to 10° per node) outside Sigil Warden and Volatile Servants to `n6` at
  (−1800,−4050), the joined brief's spot. Tomb Dust's chain is carried on to `n6`. Kindled Steel and Tomb Dust become
  bridges. The Mystic's north-west rim road already ends at (−1380,−4150); the far-loop link from `n6` leaves in the
  same line as the walk (a turn of about 10°), so the rim road reads as one road across the border.

**Cut:** `cathedral.choir.jC.a`–`cathedral.choir.loneVow.a` (both ends inside the region). The choir junction keeps
three links (the wheel, Living Ward, the Undercroft wheel).

**Moved:** Lone Vow's two smalls, re-hung off the aisle's middle node: `cathedral.choir.loneVow.a` to `P(1840,361)`
and `cathedral.choir.loneVow.b` to `P(1864,418)`, on the straight line from `nave.aisle.a2` to the keystone, which did
not move (80, 62 and 89 units apart, the spur sizes of §11.5). They stay in `choir.ts`: **no id changed and none was
removed.**

**New ids (13):** `cathedral.nave.aisle.a1`, `.a2`, `.a3`; `cathedral.rim.walk.o1`, `.o2`, `.o3`, `.o4`;
`cathedral.crypt.north.n1` … `.n6`.

**Area labels:** `rim.ts` became **The Churchyard** (the ground outside the church walls, where the outer walk runs),
its label moved from Ossuary to (−4960,−1290), outside the walk; it overlaps no other area name and no notable,
keystone or start. It is outside the loop on purpose (the inside holds Searing Avatar and, in G3, ZE-10 and ZE-6),
so it reaches about 850 units past the region's farthest node and stretches the whole-tree picture west; G3's label
pass may bring it in once the clusters are placed. The aisle and the north walk are clusters of existing areas (the Nave, the Undercroft), so no other
label moved.

## 2. Where the G3 clusters hang

| cluster (brief)               | hangs at                                                                                                                |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| ZE-1 spell + less reservation | `cathedral.nave.aisle.a3` (north) ↔ Brandwright `cathedral.ambulatory.brand.n`                                          |
| ZE-2 minion + life            | `cathedral.nave.aisle.a2` (south) ↔ `cathedral.rods.jR.a`                                                               |
| ZE-3 channelling + elemental  | `cathedral.crypt.north.n6` ↔ Shattering Rite `cathedral.crypt.rite.n` (ZE-3 a little east of the two, as the join asks) |
| ZE-4 cold + shield block      | `cathedral.nave.jN.a` ↔ `cathedral.rods.toWall.c` (existing nodes)                                                      |
| ZE-5 armour + sceptre         | `cathedral.nave.toWall.a` (existing); its west end is a border link (§3)                                                |
| ZE-6 sceptre + burning        | `cathedral.rim.walk.o4` (inward, between Thunder Peal and Searing Avatar)                                               |
| ZE-7 staff + spell block      | `cathedral.rods.toWall.a` ↔ `cathedral.rods.toWall.b` (existing)                                                        |
| ZE-8 life + aura effect       | `cathedral.ambulatory.censer.n`; its other end is a border link (§3)                                                    |
| ZE-9 spell + duration         | `cathedral.crypt.north.n4` (inward; `n5` is the alternative if G3 wants the clusters spread)                            |
| ZE-10 ES + life               | `cathedral.rim.walk.o2` (inward, the corner between Censer and Searing Avatar)                                          |
| ZE-11 ES + spell block        | `cathedral.crypt.north.n3` (inward, clear of Sigil Warden)                                                              |

Lone Vow (moved) hangs at `cathedral.nave.aisle.a2` (north), so the aisle's middle node is a cross: Lone Vow north,
ZE-2 south, about 67° off the road on each side.

## 3. Left for the border pass

Nothing crossing a region line was added, cut or re-aimed. The briefs want:

| link                            | Zealot end                                                                                                                 | other end                                                  | needs               |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ------------------- |
| the far loop (Mystic)           | `cathedral.crypt.north.n6` (−1800,−4050)                                                                                   | the Mystic's north-west rim road's last node (−1380,−4150) | now                 |
| the Undercroft bridge (Mystic)  | `cathedral.crypt.toSpire.b`                                                                                                | MY-2 (spell damage with life)                              | MY-2 (G3)           |
| the armoured sceptre (Vanguard) | ZE-5                                                                                                                       | `wall.resists.j.a`                                         | ZE-5 (G3)           |
| maces and sceptres (Vanguard)   | `cathedral.rods.toWall.a`                                                                                                  | Hallowed Hammer, moved to (−2540,−20)                      | the Vanguard's move |
| two-handed fire (Vanguard)      | ZE-8                                                                                                                       | Grim Oath `wall.maces.oath.n`                              | ZE-8 (G3)           |
| 1 to 2 more per border (stop 2) | candidates on the new roads: `rim.walk.o1`–`o2` faces the Vanguard's west rim road; `crypt.north.n2`–`n3` face nothing yet |                                                            | the pass            |

All of today's border links of the region are untouched (Hymn, Draught, the crypt road, Familiars, the Banner, the
Nave road, Scar Tissue, Stagger, Battle Hymn, the two ring links).

## 4. Changed from the brief, and why

1. **The outer walk is laid as straight legs, not the sketch's arc.** The sketch's four points made a smooth arc with a
   20–26° turn at every node and a 30° turn into Thunder Peal. CONSTRAINTS §11.5 asks for straight runs that turn at
   junctions, so the turns now sit at `o2` and `o4`, the two nodes where ZE-10 and ZE-6 hang, and the last leg is
   Thunder Peal's own line. Same four nodes, same two hang points, about the same ground (the corners are within 60
   and 180 units of the sketch's).
2. **The north walk has six nodes, not five.** Kindled Steel's chain runs straight out; the sketch turned 60° at Kindled
   Steel and 48° at the next node to reach the rim. Carrying the chain straight on to a corner `n1` on the rim gives one
   clean corner instead of two bends, and the extra node keeps the links on the rim at about 420 units (the sketch's
   were about 450). It is the one node beyond the brief's count (§12.1: added for §11.5).
3. **Which file each road went in.** One new area file existed. It holds the outer walk, the road the joined brief
   (§6, D1) calls the Zealot's "outer road round the Bell Tower", as **The Churchyard**. The north walk went into the
   Undercroft (`crypt.ts`), whose back it runs round and whose two pockets (Tomb Dust, Shattering Rite) it serves; the
   aisle into the Nave. **Flag for G3:** the north walk will hold three clusters (ZE-11, ZE-9, ZE-3) in a band no area
   name covers today; it probably deserves its own area and label then (a new area file, not created here).

## 5. Checks

- **Geometry** (`geometry.ts --region zealot --bends`): **crossings 0, drawn over 0.** Bends over 20° at two-link
  nodes: 21. Seventeen were there before and are untouched: fifteen corners of the five wheels (the Nave, the Choir,
  the Undercroft, the Vestry, the Bell Tower) and Litany's two spokes (`star.s` 25°, `star.e` 24°). The four new ones,
  each with its layout reason:
  - `crypt.north.n6` 107°: the east end; Tomb Dust arrives from inside, and the far loop (border pass) continues the
    walk's line, so it becomes a junction of four (with ZE-3 in G3).
  - `crypt.north.n1` 104°: the corner where Kindled Steel's straight line meets the rim. The one two-link corner with
    no junction planned; the alternative was two bends.
  - `rim.walk.o4` 94° and `rim.walk.o2` 72°: the outer walk's corners, where ZE-6 and ZE-10 hang in G3.
  - Not flagged (the tool skips notables): the outer walk leaves Censer about 24° off its chain (the chain runs at
    −17° in the frame, the first leg at +6°). Censer becomes a junction of three with ZE-8 in G3, and a leg straight
    on from the chain would have run the walk south into ZE-8's and Grim Oath's ground. Thunder Peal, Kindled Steel and
    Tomb Dust are straight or within 6°.
  - Not flagged but worth saying: the aisle leaves `nave.toChoir.a` at 64° from the chaos spoke and 116° from
    Choirmaster, not an even fan. That node sits on the straight line from Litany's spoke to Choirmaster, and no point
    on that line lets a straight aisle to Consecrated Plate leave at a right angle; moving it would bend that road
    instead. Left as is.
- **Problems** (`buildAll`): 0 for `cathedral.`; the audit prints 0 for the region.
- **Ways in** (`passives:audit -- zealot` and by eye): The Churchyard has two (Censer, Thunder Peal); the north walk two
  now (Kindled Steel, Tomb Dust), three once the far loop is in and four with ZE-3; the aisle two ends (the Nave, the
  Ambulatory) and Lone Vow's spur, a keystone dead end as before. The only cut removes a keystone spur's link and
  re-hangs the spur, so nothing has fewer ways in than before; the choir junction keeps three.
- **Labels** (scratch check): The Churchyard overlaps no area name and covers no notable, keystone or start. Older,
  not from this pass: the Nave's name touches Vigil and Litany, the Bell Tower's Rimed Steel and Benediction, the
  Choir's Shepherd (the layout pass tightened those wheels under their names); G3's label pass should move them.
- **Names:** "The Churchyard" and the cluster names are plain words; no hit in the reference tree or phrase list.
- **The home check.** Steps from the Zealot start (scratch BFS, never through another start) to every notable the six
  home archetypes take at 60 points: **none grew from these edits.** Lone Vow stays 14. What came nearer: Consecrated
  Plate 18 → 13, Brandwright 23 → 19, Kindled Steel 24 → 20, Ossuary 22 → 18, Crozier 21 → 19, Thunder Peal 21 → 20,
  Sigil Warden 23 → 22 (the brief's estimates: 13, 18, about 20, and 22). Two Mystic notables in the took lists moved
  out, Quickening 12 → 14 and Siphon 14 → 22: the Mystic agent's moves in the same tree (the Mystic brief moves both),
  not these edits, which only add links inside the Zealot and cut a dead-end spur's link.
- **The allocator** (`passives:builds --only` the six; the tree held the other agents' edits too, so the numbers are
  not this region's alone): fire-burn and staff-block unchanged; aura-brand's 60-point tax 30% → 25%; block-caster's
  120-point choice 2 → 3; storm-caster's 60-point choice 5 → 4; sceptre-fire's 120-point choice 2 → 1 (its 120-point
  plan is mostly the Vanguard's, which is being rewired). Roads without their clusters were expected to raise tax; they
  did not. To re-read after the border pass and G3.

## 6. CONSTRAINTS checklist

- **§1 What the tree is for.** The roads are where the brief's tension clusters hang; none of them adds a stat a build
  wants, so no build got stronger here. Tension is untouched until G3.
- **§2 The reference.** Nothing copied; names our own plain words; the reference game not named.
- **§3 A network.** Three new loops (the aisle between the Nave and the walk, the Churchyard round the Bell Tower, the
  north walk between Kindled Steel and Tomb Dust); five pockets became bridges (Censer, Thunder Peal, Kindled Steel,
  Tomb Dust, and Consecrated Plate a crossroads). One cut, of a keystone spur's link, nothing left with one way in.
  No crossing touched; the far loop and the other border links are listed for the pass.
- **§4 Regions and areas.** The new area has a place name; no build-named label.
- **§5 Specializations.** No cluster added or moved; the hang points are the brief's, so its twin distances stand.
- **§6 Starts.** The home is unchanged; nothing new within 8 steps (the nearest new node, `nave.aisle.a1`, is 10).
- **§7 Roads and attributes.** 13 attribute nodes at +6/+6. Stretches with nothing off them yet: `aisle.a1`, the
  Churchyard's `o1` and `o3`, the north walk's `n1`, `n2` and `n5`; each sits between two hang points one step apart,
  and the north walk's `n1`–`n2` (the corner and the node outside Sigil Warden) is the longest, two nodes before ZE-11.
  If G3's allocator shows nobody walking the north walk, it is the first stretch to reconsider (the brief's own
  warning, its §7.3).
- **§8 Clusters and smalls.** No small added; Lone Vow's spur keeps its two aura-effect smalls.
- **§9 Keystones.** All six keep exactly one link; Lone Vow's spur is still a dead end at 14 steps; Sigil Warden 22,
  Searing Avatar 20, Volatile Servants 20; the walks pass outside three keystones without touching them.
- **§10 Vocabulary.** No lines added or changed.
- **§11 Looks.** Crossings 0, drawn over 0; roads straight between junctions; the four new bends are corners with
  reasons (§5). The north walk's Tomb Dust link is long (about 590 units, as the brief drew it); the crypt road's
  Volatile Servants link is about as long.
- **§12 Size.** 152 → 165; one node beyond the brief, for §11.5.
- **§13 Tensions.** Connections against trade-offs: the aisle and the two walks make the far west cheaper (Consecrated
  Plate −5, Brandwright −4, Kindled Steel −4, Ossuary −4), as the brief weighed in its §7.2; the outer walk joins the
  Ambulatory only at its two ends.
- **§14 Rejected ideas.** No generation (coordinates from the brief, straightened by hand); no filler stretch longer
  than two nodes; no new rule.
- **§15 How the work is done.** CONSTRAINTS read first; before and after pictures; checks after the batch; only this
  region's folder edited.
- **§16 Open.** The north walk's own area (§4.3 above); labels over wheels; the far loop.

Nothing here felt like it was losing intent. The one thing to watch is the north walk: six road nodes at 20 to 24 steps
whose worth depends entirely on G3's three clusters and the far loop.
