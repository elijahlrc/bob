---
name: patch-notes
description: Write Bob's patch notes from the commits since the last notes, add them to docs/PATCH-NOTES.md (the game's Patch notes screen), commit and push (which deploys the game). Pass "draft" to stop before committing.
disable-model-invocation: true
---

# Patch notes: write, file, commit, push

The user running `/patch-notes` is asking for all of it: write the notes, add them to the game, and push. Only `draft` (as an
argument or in the request) stops after showing the notes. Do not ask for confirmation before filing or pushing.

`docs/PATCH-NOTES.md` is the single source: the Patch notes screen on the title menu (`src/ui/PatchNotes.tsx`) shows it as it
is, and a push to `main` builds and deploys the game (`.github/workflows/pages.yml`). Nothing else needs editing.

## 1. Find what changed

- `git fetch origin`, then `git status -sb` to see where `main` stands against `origin/main`.
- The range to cover is everything since the notes were last written: `base=$(git log -1 --format=%H -- docs/PATCH-NOTES.md)`,
  then `git log --format='%h %ad %an%n%s%n%b%n---' --date=short $base..HEAD`. Other sessions commit to the same branch, so cover
  every commit in the range, not only your own.
- Read `docs/PATCH-NOTES.md` as it stands. Other sessions sometimes add entries to it directly: do not repeat what is already
  there, and keep the same date heading if today's already exists.
- Uncommitted work in the tree is not part of the release; leave it alone (see step 5).
- If there is nothing new, say so and stop.

## 2. Work out what a player sees

A commit message is a claim, not a fact. For every candidate note, check it against the code or the commit's own docs when the
message is vague (`git show --stat`, `git show <hash> -- <file>`, the relevant `docs/*.md`). Do not put anything in the notes
that you could not confirm; list the doubtful ones to the user in your reply, outside the notes.

Keep only changes a player of the previous version would notice: stronger or weaker skills, new or removed content, new
behaviour, new screens, fixes to things that were visibly wrong. Drop everything else: refactors, tests, tooling, docs,
performance work with no visible effect, balance of unreleased content.

## 3. Write the notes (the style rules)

- **Major changes only, as a short list.** Roughly 3 to 10 bullets for a release, never more than 12. One line each, 240
  characters at most; split a long one or cut it. Merge related commits into one bullet (five tree iterations are one bullet
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
  that is too long or detailed to be "a short list of major changes", an unexplained balance move (direction and who is
  affected).

Apply every FIX and CUT yourself (re-run prettier), unless you can show the auditor is wrong; then keep the bullet and note why
in the report. If more than a couple of bullets changed, run the audit once more on the result. Stop after two rounds: what is
left over goes to the user in the report, not into a third loop. Do not skip the audit for a short list.

If the user said `draft`: show the notes and stop here, with the file written but not committed.

## 6. Check and commit

- `npm run check` and `npm run build` must both be green (project rule). A flaky timing test (the speed check `x9`) that passes
  when run alone does not block; any other failure does: report it and stop without pushing. Do not weaken tests.
- Commit only the notes file, so other sessions' staged or unstaged work is left where it is:
  `git commit -m "Patch notes YYYY-MM-DD" -m "<attribution line from the session>" -- docs/PATCH-NOTES.md`.

## 7. Push (this deploys the game)

- Must be on `main`. `git fetch origin main`; if `origin/main` has commits `main` lacks (`git rev-list --count HEAD..origin/main`),
  stop and tell the user rather than merging or rebasing.
- `git push origin main`. This also pushes every other unpushed commit on local `main` (other sessions' included); say how many.
  Never force-push, never add a remote.
- GitHub Actions then runs check and build and deploys to Pages; give the user the Actions link
  (`https://github.com/<owner>/<repo>/actions` from `git remote get-url origin`). Do not poll CI.

## 8. Report

Show the notes as they were filed (plain text in a fenced block, so they can be copied), then in two or three lines: the commit
and push result (hash, how many commits went out), anything you could not confirm, what the audit changed or left standing, and anything left out on purpose.
