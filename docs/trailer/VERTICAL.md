# Vertical recut

A 9:16 version of the trailer for short-form feeds (YouTube Shorts, TikTok, Reels). Planned 2026-10-24. It is a recut, not
a new trailer: the shot list, the timings, the captions and the score stay as in [README.md](README.md); only the framing
changes, and the footage is re-filmed where the landscape frame cannot be cropped. One shot goes ("Three more builds", the
three phones side by side, which has no place in a vertical frame) and its two seconds are spread over other shots.

Output: `cut-vertical.mp4`, 1080×1920, 30 fps, 32 s, H.264 + AAC 320 kb/s, `+faststart`, well under 100 MB (not committed).

## Principles

1. **Same cut, one shot fewer.** The shots, their order and their captions stay. "Three more builds" is cut, and the 2 s
   it frees (four beats) go to other shots (Timing). Cuts stay on the 120 bpm grid. The vertical cut has its own times
   (`tv` beside `t` on each shot), so the landscape trailer is untouched.
2. **Film for the frame; don't crop the landscape footage.** A centre crop of a 16:9 frame to 9:16 keeps a third of the
   picture and loses the pack, the boss rings and the tree. The game already has a phone layout (docs/MOBILE.md), so the
   vertical cut films the game as a phone shows it.
3. **Safe zones.** Feed apps cover the bottom ~20 % (caption and buttons), the top ~10 %, and the right ~12 %. Captions and the
   level tag live between ~12 % and ~68 % of the height. The game's own bottom bar will be covered; that is accepted.
4. **Silent first.** Feeds autoplay muted, and the captions carry the pitch. Dropping the shot brings the first caption
   from 12.5 s to about 10.5 s; still late for a feed (see Decisions).

## Shot by shot

| Shot (time)                   | Landscape                       | Vertical treatment                                                                                                                                                                                       |
| ----------------------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Endgame (0–2)                 | `endgame`, 1280×720             | Re-film in the phone viewport; tighter zoom so the Skyfall columns and the pack fill the width.                                                                                                          |
| The tree (2–5)                | `tree3`                         | Re-film portrait. `treeCamera` already takes the view's W and H; the finished build is taller than wide, so it should fill the frame better than it does now. Level counter larger and in the safe zone. |
| Vanguard (5–6)                | `vanguard`                      | Re-film in the phone viewport.                                                                                                                                                                           |
| Shade (6–10.5)                | `skills`, `shade`, `equip`      | Re-film all three in the phone layout (the Skills and camp screens already have one). The `equip` crop goes: the phone camp screen is the frame.                                                         |
| Three more builds (10.5–12.5) | three phone panels side by side | **Cut.** `strider`, `reaver` and `zealot` are not filmed again.                                                                                                                                          |
| Level 1 to 100 (12.5–15)      | `climb1,2,4,5`                  | Re-film in the phone viewport, one scale for the four cuts. Level tag and caption in the safe zone.                                                                                                      |
| The fall (15–20)              | `fall`, `summary`               | Re-film. The Tollkeeper's six rings are wide: zoom out from `CLOSE` (3.2) until they fit the narrow view. The end screen is the phone layout of the summary.                                             |
| The duel (20–23.5)            | `duel`                          | Re-film; same zoom problem as the fall.                                                                                                                                                                  |
| The rating (23.5–24.5)        | `result`, cropped               | Re-film in the phone layout; no crop needed.                                                                                                                                                             |
| The board (24.5–26)           | `board`                         | Re-film in the phone layout (the board has one).                                                                                                                                                         |
| The genres (26–28)            | 2×2 grid of 16:9 cells          | Keep the 2×2, but the cells are portrait (540×960), which suits phone footage. Words stay one per beat.                                                                                                  |
| Title (28–31)                 | title over the dimmed grid      | Reuse. Title in the upper third, "Free on itch.io" above the bottom safe zone.                                                                                                                           |

## What it takes

**Filming.** The deterministic staging means the sim is the same in a narrower viewport: the same seed gives the same kills on
the same frames, so the cut-in frames (`IN` in `cut.html`) should carry over. What changes is what the camera sees, so each
clip needs a look to confirm the action is in frame at its cut-in. Clips are named with a `-v` suffix (`endgame-v`, ...)
and footage goes to `footage/` beside the landscape footage, so both cuts can be rendered from one checkout.

**Viewport.** 360×640 at `scale: 3` gives 1080×1920 with no resampling. The risk is that the phone layout was drawn for
taller screens (390×844 and up) and clips at 640 px high; the first task is to find out. The fallback is 390×693 at
`scale` 2.77, the same 9:16 shape.

**Cut.** `cut.html` gets a `?vertical` mode: a 180×320 stage drawn at 6× instead of 320×180 at 4×, and a `v(lt)` override on
each shot that draws the vertical version (a shot with no override is a bug). The shared helpers (`caption`, `levelTag`,
`glow`, `txt`, `pixWord`) stay shared. `render.ts` gets `--vertical`, which sets the page and the screenshot to 1080×1920 and
writes `cut-vertical.mp4` over `score-vertical.wav`.

**Timing.** The freed 2 s are given in whole beats (0.5 s) to the moments that are short for what they show (the owner,
2026-10-24): the end screen before the duel button (+1.0 s, the one most in need), the gem going into its socket (+0.5 s)
and the amulet (+0.5 s). They are inside shots, not whole shots, so each is an insertion point: the picture holds or slows
there, and everything after it, in the shot and beyond, moves later. The end screen is already held on its first frame until
the button is pressed on 19.25, so its time is a longer hold before the press. The gem and the amulet are filmed again
slowed at that moment (the sim's own step, not a frozen frame, so the socket light and the number's climb keep moving),
or held on the best frame if the footage has no slack. A first guess at the places: the end screen from its first frame to
the press, the gem from the socket click (7.0) through the number's climb, the amulet from where it lands (8.5) to the
card. The Endgame, Vanguard, rating and board get nothing unless the re-framed shots turn out to need it. Half-beat (0.25
s) nudges are possible, but the cut then falls off the beat, so they are the exception.

**Audio.** The score is two kinds of material, and they take a new timeline differently. (a) The _groove_ (`bar()` in
`chip_score.py`) is a bar repeated, so it can be cut and lengthened freely: it is rebuilt on the new timeline in segments
between fixed points (the stop for the bell, the drop-out before the genres, the title), each segment filled with whole bars
and ended with a short bar (`bar(..., steps=n)` already does this at 16.0) and the existing snare roll as the seam, so a
changed length never leaves a gap or a jump. The one-bar phrase (`motif`) and the bass lift are keyed to bar numbers, so
they follow the rebuilt bars. (b) The _sound effects_ are placed against shots; each goes through `T(t)`, a function that
adds the length of every insertion before it (a cue inside a lengthened moment is placed with its moment). The fixed points
(the bell on the fall, the deciding blow, the four word hits, the title) are cued to the picture the same way, so they stay
in step. The landscape score is untouched: the script takes `--vertical` and writes a second file, `score-vertical.wav`.
Dropping the three-phones shot removes its cues (the arrows, sweeps and totem bell, 10.65–12.4) with it and takes exactly
one bar out of the groove; the bar before and the bar after are kept, so there is no seam to hear.

**Mix.** Phone speakers drop the bass, and the score's weight is in the bass; the harmonics under it should
carry, but the mix needs listening to on a phone before it is called done. Loudness target about -14 LUFS (peaks stay at
-3 dB as in the README).

## Milestones

- **V0, spike (half an hour).** Film `endgame-v` at 360×640 ×3. Check the layout, that the HUD isn't clipped, and where the
  safe zones fall on the picture (draw them as an overlay in the cut page). Settles the viewport.
- **V1, film.** Add the `-v` clips to `scripts/trailer/clips.ts` (reusing the `mapClip` helper and the loadouts), film them
  with `npm run trailer:capture -- <names>`, and check each cut-in. The slow ones are the tree and the fall (zoom).
- **V2, compose.** `?vertical` mode (with `tv` times that drop the three-phones shot and give its beats out) and the per-shot `v()` overrides in `cut.html`; `--vertical` in `render.ts`. Look at a
  section at a time with `--from/--to`.
- **V2b, score.** `--vertical` in `chip_score.py`: the `T(t)` map, the rebuilt groove segments, the dropped cues. Listen to the
  seams (the cut at 10.5 and each lengthened shot) before the render.
- **V3, render and review.** Full render; watch it on a phone, muted and with sound. Fix the framing of any shot where the
  action leaves the frame or the caption collides with a platform's UI.
- **V4, ship files.** The mp4 and a cover frame (the Skyfall frame at 1.5 s, or the title). The link goes in the video
  description, since a burned-in URL can't be clicked.

Nothing here touches `src/` except the dev-only staging module if a clip needs a new hook.

## Decisions for the owner

1. **A hook in the first seconds?** Feeds judge a video in about two seconds, and the first caption lands on 12.5 s. Options:
   leave as is (strict recut), or move or repeat a short caption early ("Grind to level 100 in a sitting." over the cold open
   and the tree). It changes no shot timing, only when the text shows.
2. **Where the freed 2 s go:** chosen (end screen +1.0, gem +0.5, amulet +0.5); "locket" is read as the amulet. The 31 s stays.
3. **Length:** the full 31 s (default). A shorter 15–20 s feed cut would be a different pacing, so not part of this plan.

## Built (2026-10-24)

First pass rendered by `npm run trailer:render -- --vertical` (`docs/trailer/cut-vertical.html`, the `-v` clips in `scripts/trailer/clips.ts`,
`TRAILER_VERTICAL=1` in `audio/chip_score.py`). Every shot is filmed in the phone layout at 360×640 ×3. As built, the three phones are
replaced by a longer gem (+0.5 s), amulet (+0.5 s) and equip shot (+1.0 s), which fills their 2 s exactly, so from 12.5 s to the end
screen the cut and the score are the landscape cut's; the end screen is held 1 s longer, and the cut is 32 s. The score maps sound effects
(`T`) and music (`TM`) separately: the groove runs on unbroken. Open: the equip scene's UX on a phone (waits for the UI work), and the
`cut-vertical.html` helpers are a copy of `cut.html`'s.
