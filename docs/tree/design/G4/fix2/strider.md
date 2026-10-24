# G4 fix pass 2: the Strider (`bow`)

2026-10-23. Work list: `G4/fix-2.md` §2.1 (S-1 to S-5). Files changed: `src/data/passives/bow/bows.ts`, `home.ts`,
`steel.ts`, `string.ts`. No ids added or retired, no node removed, no border link added, cut or re-aimed.
Pictures: `fix2/strider/before.png`, `before-home.png`, `after.png`, `after-home.png`, `after-hedge.png`,
`after-hardtarget.png`, `after-wayfarer.png`.

## For the coordinator and the user first: S-2 was not done

**S-2 (cut `bow.steel.hub.t`–`bow.steel.wayfarer.d`) is skipped, because it would undo the user's stop-3 answer.** That
link is the one the user chose at stop 3: "the Ford gets an inner Strider link (`bow.steel.added.n409`–`hub.t`), keeping
the east-gate cut, so it is one step farther than before" (G-growth.md, "Start here"). `wayfarer.d` is n409, and the
link's own `why` already says so.

The looks audit (L3) assumed that "Wayfarer's end small already crosses to `yard.dual.j2.a`", so the cut would carry
little. That no longer holds: G2 cut `j2.a`–`hub.t`, so the crossing no longer reaches the Ford. Measured from the
Strider start, `hub.t` is **6 steps with the link and 9 without**. Nine is the same regression the user was shown at
stop 3 (G2/borders.md §0: 5 → 9) and overruled. With it, everything past the corner (Plated Hide, the road to the Pits,
Pitch Arrows, Sentry Post) moves 3 steps out. Fixing it by positions alone does not work either: round 1 found that
moving Wayfarer gains under 80 units, and `hub.t` is pinned by four other links.

What did change: after S-1 the link joins two dexterity road nodes, so it now draws as a road leg, not a notable's small
flung 622 units. Its `why` records the decision. **The user's call at stop 4:** keep the link (Ford at 6 steps, one long
road leg in the home) or cut it for looks (Ford at 9).

## Item by item

| #   | status         | what was done                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| S-1 | done           | `bow.steel.wayfarer.c` and `.d` changed from `evasion(10)` smalls to `attribute` `dex(7)` road nodes, positions unchanged. Wayfarer keeps `a` and `b` (`evasion(10)`), so its section is uniform (§8.2). The near crossing `wayfarer.d`–`yard.dual.j2.a` stays (§3.7). The cluster `why`, `a`'s `why`, and both nodes' `why` were rewritten. The evasion bundle on Wayfarer's line goes from 6 units to 4.                                                                                                                                                                                                                                                   |
| S-2 | **skipped**    | See above: a stop-3 decision by the user. The cut would put the Ford corner at 9 steps from the start, up from 6.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| S-3 | done           | Hawk's Eye (`bow.home.sig.n`) is now `attackDamage(14), attackSpeed(5), dex(20)`: 3.7 units, down from 4.7. The start's south side `sig.b` still sells `evasion(10)` (§4.5). The node's `why`, the cluster's `why` and the file header were updated.                                                                                                                                                                                                                                                                                                                                                                                                         |
| S-4 | done           | `bow.string.hardTarget.a` moved to `P(1367, -31)`, about (2065, 1157), 70 units from Hard Target on its line toward `speed.b`. It keeps its links to Hard Target and to `speed.b` (now the 230-unit link between the two clusters). The link `hardTarget.a`–`bow.flight.hub.p` was re-aimed as `bow.string.speed.b`–`bow.flight.hub.p`. Measured: Hard Target to `hub.p` is 3 steps (was 2), Fleet Foot to `hub.p` is 2 (was 3). Hard Target keeps two ways in (`hardTarget.d` from `s2`, and `speed.b`), and so does Fleet Foot (`f2` from Wanderer, and `speed.b`). No notable-to-notable link came back. The `why` of four nodes and links was rewritten. |
| S-5 | done, measured | Cut `bow.home.hubs.n`–`bow.bows.hedgeMagic.a`. Hedge Magic is now a bridge between the Shade's `knife.home.toHedge.r1` and `bow.bows.toKnife.a`. Its three nodes were re-laid straight on the line between those two ends (§11.5; before the cut, `a` hung 170 units off that line and the chain bent by about 100°). `hubs.n` has four links (start side, ring, bows road, Long Breath), and each hub carries one pocket. Hedge Magic is **6 steps** from the Strider start, up from 4: two steps, not the one the brief expected.                                                                                                                          |

**S-5's measure, taken after the cut alone:** bow-crit's choice at 60 stays 3 and bow-elemental's stays 4. The 120
results, the per-stat tables and the gave-up lists are identical to the pre-edit run. While that run was going, the
Reaver agent's `yard/dual.ts` edit landed (git status showed only `bows.ts` modified at the start and `dual.ts` too at
the end). The output matching the baseline exactly, down to "Footwork (3.1)" in bow-elemental's gave-up list, shows the
run read the tree before that edit. The undo condition was not met, so the cut stays.

## Border links

None moved or cut. The Strider–Shade link `knife.home.toHedge.r1`–`bow.bows.hedgeMagic.a` (written in the Shade's
file) is unchanged; only Hedge Magic's own nodes moved along it.

## Lines needed that `lines.ts` lacks

None.

## Checks (at the end, other agents' edits in the tree)

- `npx tsc --noEmit -p .`: clean.
- `geometry.ts --region strider --bends`: 0 crossings, 0 drawn over, 12 bends over 20°. None of the bends is at a node
  this pass moved or re-linked; they are wheel and loop corners and `road.jt1`'s crossing bend, all unchanged.
- `passives:audit -- strider`: 0 problems. Every notable is 3.0 to 5.0 units (Hawk's Eye 3.7). Every cluster touched has
  two or more ways in: Hedge Magic (`toHedge.r1`, `toKnife.a`), Hard Target (`s2`, `speed.b`), Fleet Foot (Wanderer,
  `hub.p`, Hard Target's small), and Wayfarer (`hubs.s`, `j2.a`, `hub.t`).
- `vitest src/data/ip.test.ts src/data/passives/names.test.ts`: 6 passed. No new names.

## The allocator (indicative: the Reaver's Footwork R-1 and Sidestep R-2 and the Shade's K-1 and K-2 are in the "after")

Choice at 60 and 120, before → after:

| build         | choice 60 | choice 120 | main stats at 120 → 160 (units), before                        | after                                                      |
| ------------- | --------- | ---------- | -------------------------------------------------------------- | ---------------------------------------------------------- |
| bow-crit      | 3 → 2     | 4 → 4      | life 23→32, eva 32.5→36, bow 32→41.2, crit 11.5→19.4           | life 24→31, eva 26→34.9, bow 35→39.6, crit 8.5→17.4        |
| bow-elemental | 4 → 2     | 2 → 2      | life 20.4→27.4, eva 34→41, ele 10.4→15.4, bow 27.4→32          | life 19.4→29.4, eva 28.5→35.5, ele 10.4→17.4, bow same     |
| bow-poison    | 1 → 2     | 5 → 3      | life 32→33, poison 15→28, bow 13.2→19                          | life 31→49.4, poison 13.7→16.2, bow 14.2→16.8              |
| dual-wield    | 1 → 1     | 3 → 5      | life 23.2→34.6, dual 16→17, eva 30.5→38.3                      | life 23.2→33.6, dual 16→17, eva 25→32.8                    |
| dagger-crit   | 1 → 3     | 2 → 1      | life 24.4→31.4, crit 25.3→32.7, dagger 9.6→13.2, eva 36.7→40.2 | life 22.4→29.4, crit 27.3→33.7, dagger same, eva 31.2→34.7 |
| claw-poison   | 4 → 1     | 2 → 2      | life 29.4→40.2, poison 17.5→18.8, claw 8→11.6                  | life 28.4→39.2, poison 16.2→17.5, claw same                |
| dodge-blades  | 3 → 3     | 2 → 3      | dodge 19.3→26, eva 36.7→40.2, life 25→31.4, blade 15→24.8      | dodge same, eva 31.2→34.7, life 24→30.4, blade same        |
| sword-board   | 2 → 1     | 5 → 6      | block 19→21, eva 29.1→34.8, life 27.8→34.4, sword 23.3→28.3    | block same, eva 26.3→28.3, life 28.8→34.4, sword same      |

What T1 asked to re-measure (nodes in the 60-point plan by region, Strider/home):

- dagger-crit: was 28/23, now 27/33.
- claw-poison: was 30/24, now 28/32.
- dodge-blades: was 31/27, now 27/27 (plus 6 Reaver).
- dual-wield: was 32/28, now 30/30.

The audit's "before" counts are from its own run; the "now" counts are from `--json`, nodes per id prefix.

Evasion is no longer close to finished at 120. In what 40 more points add to evasion past 120, bow-crit went from +11%
to +34% and dagger-crit from +10% to +11%; for dual-wield it went from +26% to +31%.

**For the coordinator:**

- The bows' choice at 60 fell with everything combined (bow-crit 3 → 2, bow-elemental 4 → 2). The cut alone did not
  cause it (above). It comes from the combined changes, likely Footwork's evasion going (it was in bow-elemental's
  gave-up list and is now in neither bow plan) together with Wayfarer and Hawk's Eye giving less evasion: with less
  evasion near home, the bows' plans agree more on where to buy it.
- Claw-poison's choice at 60 fell 4 → 1 and dagger-crit's at 120 fell 2 → 1. Both are Shade builds whose notables the
  Shade agent re-lined at the same time. Read them in the whole-tree measure.

## Sections of CONSTRAINTS checked

§3.5 (ways in), §3.7 (border links kept), §4.5 and §4.8 (the home keeps evasion on `sig.b` and Wayfarer, plus life,
crit, mana and the signature's offence), §5.1 and §5.5 (no pairing duplicated, no notable-to-notable link added), §6.5
(the first notables are still 2 to 5 out: Hawk's Eye 2, Long Breath 4, Vital Aim 5, Wayfarer 5), §7.1 and §7.2 (the
Ford's border road is attribute nodes), §8.2 and §8.6 (uniform sections; 3 to 5 units), §10.3 (no dead lines), §11.2
and §11.5 (0 crossings, chains straight, Hard Target's small beside its notable, Hedge Magic on one line), §14 (no rules
proposed).
