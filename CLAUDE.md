# Bob (repo: Auto) — notes for Claude

- The design spec is [docs/DESIGN.md](docs/DESIGN.md), and it is authoritative. Progress is tracked in
  `docs/PROGRESS.md`. Record any decision the spec doesn't cover in DESIGN.md Appendix A.
- **IP policy (DESIGN.md §3):**
  - Never copy or translate code or data from Path of Building, GGG exports, the PoE wiki or game files.
  - Every player-visible name in `src/` is our own.
  - No PoE art or audio.
- **Architecture boundaries (§14.2):**
  - `core`, `data`, `mods`, `calc`, `gen`, `sim` and `run` are headless: no Phaser, Preact or DOM.
  - No `Math.random`, `Date.now` or `performance.now` outside `render` and `ui`.
  - Use the seeded RNG in `src/core/rng.ts`.
- **Before every commit:** `npm run check` and `npm run build` must both be green. Never weaken tests to pass.
- **Git:** commit at milestone ends. Never push, and never add a remote.
- **Environment:**
  - Windows, Node 24.
  - In PowerShell, refresh PATH first:
    `$env:Path = [Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [Environment]::GetEnvironmentVariable("Path","User")`
  - Dev server: `npm run dev` on http://localhost:5173 (strict port).
- **Status:** M0–M7 of DESIGN.md are complete (see `docs/PROGRESS.md`). Further work is the stretch list
  or balance changes. Balance constants live in `src/data/constants.ts`; after changing them run
  `npm run sim -- --runs 10 --class all` and, if XP pacing moved, `--write-xp`.
- **Bash tool quirk:** in Bash, Node is not on PATH; use `export PATH="/c/Program Files/nodejs:$PATH"`.
  Backslash escapes in heredocs can be collapsed; write files with the Write tool instead.
