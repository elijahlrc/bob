# G4 fix pass 1: the Vanguard (`wall`)

Carried out 2026-10-22 from [fix-1.md](../fix-1.md) §2.5, with the user's answers to the brief (U1 a non-issue, U2
accepted, U4 no move, C1–C15 not adopted, area labels ignored). Only `src/data/passives/wall/*.ts` were edited. No ids
were added, removed or registered; nothing was baked or committed. The Vanguard owns no seam cluster; seam 5's end at
Graven Posts (`wall.resists.posts.n`) is the Zealot's to write (Z-9), and the node was left where it is.

## Item by item

| id  | status                     | what was done                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| --- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V-1 | **done**                   | Stone Heart's pocket (`wall.rampart.stoneHeart.a/.b/.n`, ids kept) is now **Weak Spot**: notable `meleePhys(20), critChance(22, ['melee'])` (3.5 units), smalls `critChance(15, ['melee'])`. Name checked: not in `ref-tree.json`, not elsewhere in the tree ("Telling Blow" was avoided: Telling Shot is the Strider's). Every `why` in the folder that cited Stone Heart (Ringing Blows, Broad Back, Ox Hide, the Rampart header and area) now says what changed.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| V-2 | **done**                   | Banner's smalls compacted on the line toward `hubs.n`: `banner.b` (-1219,-167), `banner.a` (-1194,-118). Ringing Blows turned from a ring shape into a straight chain at about 207° from `hubs.n`: `ringing.a` (-1109,200), `ringing.b` (-1158,175), notable (-1220,143) (smalls 55 and 70 apart, §11.5). The hub's three west links are now 170° / 207° / 243°, about 36° apart; at `banner.a` the two links down (to the hub and to Ringing Blows) are 33° apart. The sliver became a plain triangle, so `ringing.n`–`banner.a` was **kept** (not cut).                                                                                                                                                                                                                                                                                                                                                                                                                             |
| V-3 | **done**                   | Quartermaster swung west into the south hub's empty sector, a straight chain: notable (-1300,880), `b` (-1236,851), `a` (-1186,829). Links unchanged. The rung to `roadS.a` runs nearly level and the link to `thunderstep.a` straight down (40° from `roadS.b`). Clear of `roadM.a/b`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| V-4 | **done, with a flag**      | Greatblade's two smalls `swordDamage(10)` → `twoHandDamage(12)` (sword stays on the notable). Greatweight `str(16)` → `stunDuration(15)` (3.5 units); Broad Back `str(16)` → `stunRecovery(15)` (3.4; `stunDurationOnSelf` is read by `calc/defence.ts`, a live line). **Flag for the coordinator:** round 4 (E-round4.md, "The one-stop shops") took stun _off_ Greatweight on purpose, and Headsman already pairs two-handed damage with stun. Greatweight now carries stun only as a one-unit partner, and Headsman is 19 steps away (§5.2 clear by far), so the brief was followed; but the allocator now has two-hand-fire taking both Greatweight and Headsman at 120 and mace-slam taking Greatweight beside Weight of Iron (6 steps). If audit round 2 reads that as stun piling up, the D13 alternative is a line no small sells nearby (knockback, melee range or double damage). Strength: mace-slam 213, two-hand-fire 290, mace-shield 247 at 120, all above 180 (§7.4). |
| V-5 | **done**                   | Iron Voice's four armour smalls → `warcryEffect(10)`; armour stays on the notable (`armour(24), warcryEffect(20)`). The middle road now passes four warcry smalls. Armour is still sold in the west tower (Mortar and Stone, Locked Shields, Ox Hide) and south (Tempered, Grave Host, Two Fists, Iron Liturgy).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| V-6 | **done, extended**         | `wall.maces.toHymn.r1` moved to (-3444,522) as the brief says, and `r2`, `r3` re-laid on the straight line from `r1` to `r4` ((-3481,324), (-3517,125)), so the move costs no bend at `r1` (the auditor's price): the road leaves `crushing.a` at about 240° and runs straight. No relink, no Stagger–Battle Hymn shortcut. Done without waiting for Z-6 (positions are independent of the Zealot's cut; at the time of the after-pictures `cathedral.ambulatory.toWall.c/.d` were still present). `wall.maces.toStagger.a` still bends 42° (pre-existing, left: straightening it narrows its gap to the Hymn road to about 39°).                                                                                                                                                                                                                                                                                                                                                     |
| V-7 | **done, a little further** | `wall.rampart.toThickSkin.a` to (-1665,740), and the whole pocket laid on the same 185° bearing from `wall.home.roadM.b`: `a` (-1805,728), `b` (-1860,723), Weak Spot (-1929,717). The branch leaves the road 40° off its line and the chain is straight from the road (no bend at the road node, which keeping the notable in place would have cost).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| V-8 | **done**                   | `wall.slams.bracing.a/b` `shieldBlock(3)` → `shieldBlock(2)`; `wall.grit.heavyHands.a/b/c` `attackSpeed(7, ['twoHand'])` → `attackSpeed(5, ['twoHand'])`; Hallowed Hammer's three smalls `maceDamage(12)` → `maceDamage(14)`. Notables unchanged.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

Skipped: none. Not touched (brief: only if the spot is touched): the junction smalls `wall.slams.thunderstep.b`,
`wall.maces.crushing.a`, `wall.rampart.stagger.a` (N10) and L10's mild bends.

## Ids

- **Added:** none. **Removed:** none.
- **Re-lined:** `wall.rampart.stoneHeart.a/.b/.n` (renamed Weak Spot), `wall.maces.greatweight.n1`, `.n2`,
  `wall.grit.greatblade.a/.b`, `wall.grit.ironVoice.a/.b/.c/.d`, `wall.slams.bracing.a/.b`,
  `wall.grit.heavyHands.a/.b/.c`, `wall.resists.hammer.a/.b/.c`.
- **Moved:** `wall.home.ringing.a/.b/.n` (ring → hand shape), `wall.home.quartermaster.a/.b/.n` (ring → hand),
  `wall.resists.banner.a/.b`, `wall.rampart.toThickSkin.a`, `wall.rampart.stoneHeart.a/.b/.n`,
  `wall.maces.toHymn.r1/.r2/.r3`.
- **Border links laid:** none (none on the Vanguard's list). No border link was added, cut or re-aimed; the nodes other
  regions land on (`banner.n`, `bracing.b`, `posts.n`, `stagger.a`, `hammer.c`, `toHymn.r4`, …) keep their ids and,
  except `banner.n`'s neighbours, their positions.

## Lines `lines.ts` lacks

None needed. Every line used exists (`critChance` with the melee tag, `meleePhys`, `stunRecovery`, `warcryEffect`,
`twoHandDamage`, `shieldBlock`, `maceDamage`, `attackSpeed` with the two-hand tag).

## Checks

- `npx tsc --noEmit -p .`: clean. `prettier --check` on the folder: clean (after `--write` on two files).
- `geometry.ts --region vanguard --bends`: **0 crossings, 0 drawn over**; bends 22 → 21 (`toHymn.r1`'s 32° is gone; no
  new bend). The rest are pre-existing ring and diamond corners and four mild road bends.
- `npm run passives:audit -- vanguard`: **0 problems**; every notable 3.0 to 5.0 units (Weak Spot 3.5, Greatweight 3.5,
  Broad Back 3.4). Areas touched keep their links in and out (the Gate 13, the Rampart 11, the Battlements 11, the
  Barbican 8, the Quarry 10, the Barrows 8). Weak Spot is a dead-end pocket with one way in, as Stone Heart was (the
  brief: "changes no route"); Greatblade (re-lined by V-4) is likewise a pre-existing dead-end pocket off `east.e7`, no
  route changed. Every other cluster touched has two or more ways in. Start distances: Oathbound 2, Quartermaster 4, Ringing Blows 4, Banner 5, Weak Spot 8.
- `npx vitest run src/data/ip.test.ts src/data/passives/names.test.ts`: passed. `grep -i "weak spot"
reference/tree/ref-tree.json`: nothing.
- Pictures (`docs/tree/design/G4/fix1/vanguard/`): `before.png` / `after.png` (the region), and close-ups with ids,
  before and after: `*-north-hub.png` (V-2), `*-south-hub.png` (V-3), `*-crushing.png` (V-6), `*-stoneheart.png`
  (V-1, V-7).

## Allocator readings (indicative: five other regions were editing at the same time)

`npm run passives:builds -- --only mace-slam,mace-shield,warcry-totem,two-hand-fire`, before my first edit and after
my last. Main stats at 120 → 160, and choice at 120:

| build         | stat                   | before 120 → 160 | after 120 → 160 | choice at 120 (60) before → after |
| ------------- | ---------------------- | ---------------- | --------------- | --------------------------------- |
| mace-slam     | life                   | 169 → 189        | 141 → 156       | 3 (3) → 3 (3)                     |
|               | armour                 | 326 → 386        | 242 → 302       |                                   |
|               | two-handed mace, units | 29.7 → 35.7      | 30 → 40.1       |                                   |
| mace-shield   | life                   | 159 → 199        | 140 → 156       | 3 (1) → 7 (2)                     |
|               | armour                 | 278 → 394        | 206 → 298       |                                   |
|               | block, units           | 25 → 30          | 25 → 29         |                                   |
|               | mace, units            | 14.7 → 16.7      | 14.1 → 21.1     |                                   |
| warcry-totem  | life                   | 145 → 186        | 118 → 163       | 3 (2) → 3 (2)                     |
|               | totem, units           | 5.7 → 16.7       | 10.7 → 16.7     |                                   |
|               | warcries, units        | 11.8 → 13.8      | 12.8 → 17.8     |                                   |
| two-hand-fire | life                   | 132 → 193        | 125 → 143       | 2 (3) → **1 (1)**                 |
|               | armour                 | 378 → 434        | 290 → 346       |                                   |
|               | fire attack, units     | 22.4 → 23.4      | 23.4 → 29.4     |                                   |
|               | two-handed, units      | 12.2 → 13.5      | 13.5 → 16.8     |                                   |

Targets for these four: typical gain past 120 20% → 32%; main stats gaining 10% or less 7% → 0%; notables of 2.5+
units that 40 more points add 2 → 3; one-plan builds 0 → 1 (two-hand-fire).

- Armour at 120 fell toward the brief's estimate (mace-slam 326 → 242, mace-shield 278 → 206, two-hand-fire 378 →
  290), still at or above G0 (218, 162, 234), and it now keeps climbing past 120.
- Weak Spot is taken by mace-slam at 60 and 120 and by mace-shield at 120: melee crit near the start is wanted and
  costs those builds life, which is the trade asked for (§4.8).
- **two-hand-fire fell to one plan at 60 and 120.** Its plans now take Greatweight and Headsman together (see V-4) and
  the Zealot's Nave (Hearthfire, Litany, Verger); part of the change is other regions' edits. Worth a look at audit
  round 2 before any further Vanguard change.

## For the coordinator or the user

1. **V-4's stun reversal** (above): followed the brief; the D13 alternative is ready if round 2 shows stun piling up.
2. **Stale names outside the Vanguard:** none found (`grep "Stone Heart"` outside `wall/` is empty), but the audit and
   G-reports quote Stone Heart by name; the id is unchanged.
3. **Scarred Hide (Reaver)** is now the only life-with-stun-threshold notable; T9 is closed from the Vanguard side.
4. The Vanguard's flasks: Quartermaster unchanged in lines; the centre's Provisions is still 5 steps from the start.

## Sections checked

CONSTRAINTS §3.5–3.6 (no area lost a way in; Weak Spot stays the dead-end pocket it was), §4.5 (life, armour, block,
stun and resistances all still sold), §4.6 (melee crit now near home), §4.8 (the home's west is life then offence),
§5.1–5.2 (Weak Spot's partners differ from Crushing Blow, Unbloodied and the seam-1 crit multiplier; Greatweight vs
Headsman flagged), §6.5 (first notables 2–4 out, unchanged), §7.4 (strength above the heaviest gear after V-4), §8.1–2
(every small one unit, sections uniform), §8.6 (all notables 3–5), §9.1 (no keystone spur touched), §10.3 (every line
live in the sim), §11.5 (straight chains, even fans, no crossings, no new bends), §14 (no node placed for a number).
