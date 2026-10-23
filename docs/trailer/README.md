# Trailer

The trailer, 31 seconds, planned with the owner on 2026-10-21. Nothing here ships with the game.

- `storyboard.html`: the storyboard, shot by shot (timing, on-screen text, picture, sound, how to capture it from the
  game). Open it in a browser. It is the plan for the real trailer, cut from gameplay footage.
- `animatic.html`: the same cut in motion, drawn as sketches. Each shot is a `draw(lt)` function of its local time in the
  `SHOTS` list; `window.seek(t)` draws any moment. Opened with `?render` it shows the stage alone, for recording.
- `animatic.mp3`, `animatic.mp4`: the score and the rendered animatic (1280×720, 30 fps).
- `audio/chip_score.py`: writes the score and the sound effects (the game has no sound yet): one crunchy chiptune
  groove in D minor at 120 bpm, a pulsing bass on D, a noise kit and one quiet four-note phrase, with chip sound
  effects on their own layer. Cue times are in seconds and must match the cut's shot times (the animatic is 30 s and
  older than the cut: it no longer lines up with the score after 15 s).

- `cut.html`, `cut.mp4`: the first cut with real footage: the animatic's timing, captions and score over clips filmed from the
  game. Each clip is staged by `src/trailer/stage.ts` (a dev-only module the game never imports: a character with chosen gems,
  a theme, a biome, a boss) and filmed frame by frame by `scripts/trailer/capture.ts` from the clip list in
  `scripts/trailer/clips.ts`. The frames go to `footage/` (git-ignored); `cut.html` picks which frames each shot uses (its `IN`
  table; `npx tsx scripts/trailer/events.ts` shows where the kills fall in each clip).

**Filming the footage:**

1. Once: `npm i --no-save playwright-core`, then `npx playwright install chromium`.
2. In one terminal, `npm run dev`.
3. In another, `npm run trailer:capture` films every clip; name clips to film only those, e.g.
   `npm run trailer:capture -- climb2 duel`. Don't edit `src/` while it runs: the dev server reloads the page and the clip
   fails.
4. `npm run trailer:render -- --cut` writes `cut.mp4` from the footage and the score. Add `--from 14 --to 20.5` to render
   that part alone, to `cut-section.mp4` (to look at one section while it is worked on).

Every frame is stepped by hand with the game's loop stopped, so a clip is the same on every run. On a GPU the whole set takes
minutes. `TRAILER_SOFTWARE_GL=1` draws on the CPU, for a machine with no GPU (about a second a frame, half an hour for the
set). If headless Chromium gets no GPU, `TRAILER_HEADED=1` films in a visible window (PowerShell: `$env:TRAILER_HEADED=1`).

**1440p:** `TRAILER_SCALE=2 npm run trailer:capture` films every clip at twice the pixels (2560×1440, the same layout; the
end screen at 3× that), and `TRAILER_SCALE=2 npm run trailer:render -- --cut` writes `cut-1440p.mp4` (about 40 MB, not
committed). Each clip's footage is at the scale it was last filmed at, so before a render re-film every clip whose scale
differs from it.

**Re-rendering:** `npm run trailer:render` (`scripts/trailer/render.ts`) runs the score script, renders every frame in
headless Chromium and joins them with ffmpeg. It needs Python 3 with numpy, ffmpeg on PATH and
`npm i --no-save playwright-core` (with `npx playwright install chromium`, or `CHROME_PATH` set). Output is
deterministic: an unchanged page and score give byte-identical files.

**Decisions so far (the owner):**

- Audience: ARPG and roguelike players who lack the hours for a full ARPG; the pitch is a new build every run, level 1
  to 100 in a sitting, then duels and the high scores. The reference game is never named, here or in the trailer.
- Text, in order: "Grind to level 100 in a sitting." / "Duel other slain builds." / "Take the top
  spot." / "Arcade. ARPG. Roguelike. Autobattler." / "Battle of Builds · Free on itch.io".
- Shots: endgame cold open (a Skyfall in a mixed pack; the strike on the crash, 1.5 s, falls on the pack round the
  Mystic and kills it); the tree, one build growing from level 1 to 100: the two-handed mace Vanguard the build
  allocator plans at 60 points and grows to 100, in the order a player takes it (`scripts/trailer/treeBuild.ts` writes
  `tree-build.json`; run it again after the tree changes), the camera opening zoomed in and zooming out as it grows,
  following what is lit until the whole build is in frame (no class screen, no text); the Vanguard's slam on 5 s and the
  Shade (gem link, traps; a trap thrown at a Slag Brute, which falls on 8.5 s, and the amulet alone on the ground for a
  second, the Shade standing still; then the card and Swap);
  three more classes side by side in phone-shaped panels; the climb, four cuts on the beat (the first a beat long, the others half a second); then level 72 is one shot of a
  boss fight, the Shade (two daggers, no skill, no damage numbers: the bell is what moves) against the Tollkeeper on map
  63, his fourth toll: the shot opens on his bell already rising over his head (the tell, the game's own animation, added for this), held
  while the six rings show, and brought down as the first ring strikes and kills the Shade on 17.5 s (the screen's edge goes red as it lands); a pause; the end screen,
  "Slain on level 63" down to "Killed by the Tollkeeper", held from 18.35 s; the duel with Sin; the rating; the high scores (Sin first, as the first
  to beat the game; oostin and Eli are real players, the other names made up); the genre grid; the title over it.
- Music: rhythm first, simple, one groove that stops dead when the toll's rings show, the bell and an impact as it comes down, and back for the duel; a heavy bass (a clean sine and its saturated
  harmonics under the gritty triangle, about 8 dB up from the first score) and a melody crushed hard (a very low sample
  rate, hard clipping, wavefolding, 2 and 3 bits, a short metallic comb). No silence before the duel's deciding blow, a
  restrained crash. The genre hits are set up by a drop-out and a tom fill, not a riser. The mix is cut at 14 kHz and
  peaks at -3 dB, and the video's audio is 320 kb/s AAC: a crushed, clipped signal otherwise rings in the encoder and
  clips on playback.
- Captions sit just above the flasks, clear of the screen's own UI.
- Type: the game's own faces (`cut.html` links them from `node_modules/@fontsource`): Jacquard 24 for the captions, the level
  and place tags, the title and the genre words; Grenze for any other text.
- Cuts land on the beat (120 bpm: a beat is 0.5 s, a bar 2 s); any timing change keeps to the grid.
