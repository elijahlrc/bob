---
name: patch-notes
description: Publish Bob. Write the patch notes from the commits since the last notes, add them to docs/PATCH-NOTES.md (the game's Patch notes screen), commit, then after a confirmation push to GitHub (which deploys the game) and upload the build to itch.io. "draft" writes and audits the notes and stops; running it again without "draft" submits that draft.
disable-model-invocation: true
---

# Patch notes: write, file, commit, publish

`/patch-notes` is the "put the changes in front of the public" command: write the notes, add them to the game, commit, push to
GitHub (which deploys the game) and upload the same build to itch.io. Do not ask before writing, filing or committing the
notes. **Do ask, once, before anything leaves the machine** (the push and the itch.io upload): step 7.

It is meant to be run in two passes:

1. `/patch-notes draft` writes the notes, audits them and leaves them in `docs/PATCH-NOTES.md` **uncommitted**, then stops. The
   user reads them and may edit the file or ask for changes.
2. `/patch-notes` (no `draft`) then **submits that draft**: it takes the uncommitted notes in the file as they are (hand edits
   included), audits them once more, checks, commits, asks, then pushes and uploads. It does not write them again.

Run with no draft waiting, `/patch-notes` does both passes in one go. Which case applies is decided in step 1.

`docs/PATCH-NOTES.md` is the single source: the Patch notes screen on the title menu (`src/ui/PatchNotes.tsx`) shows it as it
is, a push to `main` builds and deploys the game (`.github/workflows/pages.yml`), and the itch.io page is updated by the
upload in step 9. Nothing else needs editing.

The itch.io page has exactly one upload: the butler `html5` channel, ticked "This file will be played in the browser". Each
run replaces that upload's build in place, so the page always plays the latest. A file added through the itch.io web uploader
is a separate upload that butler never sees or updates (`butler status` lists only channels); if one appears, the user deletes
it on the page's Uploads list.

## 1. Find what changed

- `git fetch origin`, then `git status -sb` to see where `main` stands against `origin/main`.
- **Is a draft waiting?** `git diff HEAD -- docs/PATCH-NOTES.md` (and `git status --short docs/PATCH-NOTES.md`). Uncommitted
  changes to the notes file are a draft, written by an earlier `/patch-notes draft` (or by hand, or by another session).
  - **Draft waiting, no `draft` argument: submit it.** Do not rewrite it. Show its added lines to be sure they are notes (not
    something unrelated), check that no player-visible commit since the last notes is missing from it (the range below; if one
    is, add a bullet for it following steps 2 to 4), then go straight to step 5 (audit) and on to 6 to 9.
  - **Draft waiting, with `draft`: refine it.** Start from the draft rather than discarding it: add what the commits since then
    need, fix what no longer holds, then step 5 and stop.
  - **No draft:** write one as below.
- The range to cover is everything since the notes were last written: `base=$(git log -1 --format=%H -- docs/PATCH-NOTES.md)`,
  then `git log --format='%h %ad %an%n%s%n%b%n---' --date=short $base..HEAD`. Other sessions commit to the same branch, so cover
  every commit in the range, not only your own.
- Read `docs/PATCH-NOTES.md` as it stands. Other sessions sometimes add entries to it directly: do not repeat what is already
  there, and keep the same date heading if today's already exists.
- Other uncommitted work in the tree is not part of the release; leave it alone (see step 6).
- If there is no draft and nothing new, say so and stop.

## 2. Work out what a player sees

A commit message is a claim, not a fact. For every candidate note, check it against the code or the commit's own docs when the
message is vague (`git show --stat`, `git show <hash> -- <file>`, the relevant `docs/*.md`). Do not put anything in the notes
that you could not confirm; list the doubtful ones to the user in your reply, outside the notes.

Keep only changes a player of the previous version would notice: stronger or weaker skills, new or removed content, new
behaviour, new screens, fixes to things that were visibly wrong. Drop everything else: refactors, tests, tooling, docs,
performance work with no visible effect, balance of unreleased content.

## 3. Write the notes (the style rules)

- **Major changes only, as a short list.** Roughly 3 to 10 bullets for a release. That is a guide, not a hard limit: a big
  release may have more, and the audit must not fail a list for its length alone. One bullet is one line of at most 600
  characters; split a longer one or cut it. Merge related commits into one bullet (five tree iterations are one bullet
  about the tree). Name the effect, with a number only when it helps ("about three times the damage").
- **Plain text.** No bold, no backticks, no links, no tables. A dash bullet per note.
- **Public-facing, impersonal.** No "I", no "we", no "you asked", no mention of the developer, the user or a session. "Your
  character" and "you" for the player are fine.
- **Only what changed.** Never write "X is unchanged", "still the same" or anything about what was checked and left alone.
- **Our own names only** (Spirit Saw, Storm Rush, Rotting Stride, Searing Mantle...), never the Path of Exile names, and no
  mention of Path of Exile, Path of Building, the wiki, or version numbers like 3.9.
- **No internals.** No file names or paths, commands, commit hashes, milestones, audits, ledgers, tests, constants, "sim", "bot",
  "build matrix", "refactor". No "See docs/...".
- **Known issues are fine, written neutrally** ("new and still being balance-tested"), never as dev notes about what was not
  verified.
- **Balance moves say direction and size,** and who is affected: "Sap Bolt and Ruin Ritual get weaker, Creeping Plague
  stronger".
- Group under a `### Heading` (Skills, Monsters and combat, Items, Interface, Known issues) only when a release has more than a
  handful of bullets; otherwise a flat list under the date is better.
- Match the voice and density of the newest entries already in the file.

Earlier drafts were rewritten by the user for being dev-facing, for listing unchanged items, and for being too detailed. A short
list of major changes is what they want; when in doubt, cut.

## 4. File them

- Heading `## YYYY-MM-DD` with today's local date (`date +%F`). Newest first: a new date goes directly above the previous
  `## ` heading, below the intro lines. If today's heading exists, add the bullets to the end of its own bullet list (before
  its first `###`), or under the matching `###`.
- Bullets start with `- `, wrapped by prettier; blank line between blocks; the file ends with a newline.
- `npx prettier --write docs/PATCH-NOTES.md`.
- Re-read the new bullets once against the rules in step 3 before going on (search them for `**`, backticks, `docs/`, `I`,
  `3.9`, `unchanged`, `.ts`).

## 5. Audit (Opus)

Before anything is committed, have a fresh reviewer read the new notes. Launch one agent with the Agent tool, `model: "opus"`,
`subagent_type: "general-purpose"`, `run_in_background: false`, and a prompt that contains, verbatim: the new bullets (and
their `###` headings), the full text of step 3 above (the style rules), and the commit range from step 1 (it may read the
commits and code to confirm a claim). Tell it to change nothing and to answer with one verdict per bullet:

- **PASS**, or **FIX** with the specific rule it breaks and a replacement wording;
- **CUT** for a bullet a player would not notice, that duplicates another, or that is not true of the commits;
- anything that makes the list unfit for public consumption as a whole: dev or process language, anything that reads as
  internal, spoilers of unreleased content, tone that blames or apologises, unclear wording a player could not follow, a list
  that is padded with minor changes (its length alone is not a fault), an unexplained balance move (direction and who is
  affected).

Apply every FIX and CUT yourself (re-run prettier), unless you can show the auditor is wrong; then keep the bullet and note why
in the report. If more than a couple of bullets changed, run the audit once more on the result. Stop after two rounds: what is
left over goes to the user in the report, not into a third loop. Do not skip the audit for a short list.

If the user said `draft`: show the notes and stop here, with the file written but **not committed**, and tell the user that
`/patch-notes` with no argument will submit them (hand edits to the file are kept; the audit runs once more on them).

## 6. Check and commit

- `npm run check` and `npm run build` must both be green (project rule). A flaky timing test (the speed check `x9`) that passes
  when run alone does not block; any other failure does: report it and stop without pushing. Do not weaken tests.
- Commit only the notes file, so other sessions' staged or unstaged work is left where it is:
  `git commit -m "Patch notes YYYY-MM-DD" -m "<attribution line from the session>" -- docs/PATCH-NOTES.md`.

## 7. Confirm before publishing

The notes commit stays local until the user says yes. Work out and show what would go out:

- `git rev-list --count origin/main..HEAD` and `git log --oneline origin/main..HEAD` (this includes other sessions' unpushed
  commits; summarise a long list), and that `HEAD..origin/main` is 0 (if `origin/main` has commits `main` lacks, stop and tell
  the user rather than merging or rebasing).
- The notes as filed (fenced plain text).
- That the push deploys the game on GitHub Pages and that the same commit is then built and uploaded to itch.io
  (`elijahlrc/battle-of-builds:html5`).

Ask with AskUserQuestion (or in chat if it is unavailable), and wait for the answer. Options: **Push and upload to itch.io**,
**Push only (skip itch.io)**, **Stop here** (the commit stays local). Anything but a clear choice means stop. This answer covers
this run only.

## 8. Push (this deploys the game)

- Must be on `main`. `git push origin main`. Never force-push, never add a remote. Say how many commits went out.
- GitHub Actions then runs check and build and deploys to Pages; give the user the Actions link
  (`https://github.com/<owner>/<repo>/actions` from `git remote get-url origin`). Do not poll CI.

## 9. Upload to itch.io

Skip if the user chose to push only or stop. The build must be of the pushed commit, not of the working tree (other sessions'
uncommitted work may be in it), so build from an export of `HEAD`:

1. Make an empty directory in the scratchpad, `git archive HEAD | tar -x -C <dir>`, and give it the repo's dependencies
   (`cmd //c mklink /J <dir>/node_modules E:\Proj\Auto\node_modules`, or `npm ci` there if the link fails).
2. In it, with Node on PATH (see CLAUDE.md): `GITHUB_SHA=$(git rev-parse HEAD) npm run build` (the build id on the game's
   statistics is the commit, as on Pages).
3. Zip the `dist` folder with the script beside this file, never with `tar` (itch.io refused that zip):
   `pwsh -File .claude/skills/patch-notes/itch-zip.ps1 -Dist <dir>/dist -Out E:\Proj\Auto\bob-itch.zip`. Check that
   `index.html` is at the top level of the listing. `bob-itch.zip` is git-ignored.
4. `C:\Users\littl\butler\butler.exe push bob-itch.zip elijahlrc/battle-of-builds:html5`, then one
   `butler.exe status elijahlrc/battle-of-builds:html5` after a short wait to see that the build has processed. Do not poll.
5. Remove the temporary directory (remove the `node_modules` junction with `rmdir` first, so the real folder is not deleted).

If butler is missing, not logged in (`butler login`, which needs the user), or the push fails, say so and carry on to the
report: the GitHub push has already happened and is not undone. One-time settings on the itch.io page that butler cannot set
(project kind HTML, "played in the browser" on the upload, embed size, cover image) are the user's.

## 10. Report

Show the notes as they were filed (plain text in a fenced block, so they can be copied), then in two or three lines: the commit
and push result (hash, how many commits went out), the itch.io upload (build number and whether it processed, or why it was
skipped), anything you could not confirm, what the audit changed or left standing, and anything left out on purpose.
