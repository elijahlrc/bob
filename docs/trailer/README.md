# Trailer

The 30-second trailer, planned with the owner on 2026-10-21. Nothing here ships with the game.

- `storyboard.html`: the storyboard, shot by shot (timing, on-screen text, picture, sound, how to capture it from the
  game). Open it in a browser. It is the plan for the real trailer, cut from gameplay footage.
- `animatic.html`: the same cut in motion, drawn as sketches. Each shot is a `draw(lt)` function of its local time in the
  `SHOTS` list; `window.seek(t)` draws any moment. Opened with `?render` it shows the stage alone, for recording.
- `animatic.mp3`, `animatic.mp4`: the score and the rendered animatic (1280×720, 30 fps).
- `audio/chip_score.py`: writes the score and the sound effects (the game has no sound yet): one crunchy chiptune
  groove in D minor at 120 bpm, a pulsing bass on D, a noise kit and one quiet four-note phrase, with chip sound
  effects on their own layer. Cue times are in seconds and must match the animatic's shot times.

**Re-rendering:** `npm run trailer:render` (`scripts/trailer/render.ts`) runs the score script, renders every frame in
headless Chromium and joins them with ffmpeg. It needs Python 3 with numpy, ffmpeg on PATH and
`npm i --no-save playwright-core` (with `npx playwright install chromium`, or `CHROME_PATH` set). Output is
deterministic: an unchanged page and score give byte-identical files.

**Decisions so far (the owner):**

- Audience: ARPG and roguelike players who lack the hours for a full ARPG; the pitch is a new build every run, level 1
  to 100 in a sitting, then duels and the high scores. The reference game is never named, here or in the trailer.
- Text, in order: "New run. New build." / "Grind to level 100 in a sitting." / "Duel their builds." / "Take the top
  spot." / "Arcade. ARPG. Roguelike. Autobattler." / "Battle of Builds · Free on itch.io".
- Shots: endgame cold open; class pick; the Vanguard (tree) and the Shade (gem link, traps, a drop for the build);
  three more classes side by side in phone-shaped panels; the climb, ending at map 63; a boss's signature attack kills
  the character there, a pause, the end screen; the duel with Sin; the rating; the high scores (Sin first, as the first
  to beat the game; oostin and Eli are real players, the other names made up); the genre grid; the title over it.
- Music: rhythm first, simple, one groove that only stops for the fall; the melody quiet and under the bass and drums;
  crunchy. No silence before the duel's deciding blow, a restrained crash. The genre hits are set up by a drop-out and a
  tom fill, not a riser.
- Cuts land on the beat (120 bpm: a beat is 0.5 s, a bar 2 s); any timing change keeps to the grid.
