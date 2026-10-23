# Launch day (plan, 2026-10-23)

The public announcement of Battle of Builds: a video on YouTube, posts on Reddit, and the game's home moving from GitHub Pages
to itch.io (`elijahlrc/battle-of-builds`). The plan has four parts:

- the decisions it waits on;
- the gates before the day;
- the day, hour by hour;
- the two days after.

Times are Berkeley (Pacific). The launch date is not set yet; "L" is launch day.

## 0. Decisions for the owner

Answer here or in chat. Each one changes the work below.

1. **The date (L).** The gates in §1 take a few days at least, more if the trailer is cut from footage (D2).
2. **The video.** The animatic as it is, or a real cut from gameplay footage? `docs/trailer/storyboard.html` is the plan for the
   footage cut, which takes days and would set the date.
3. **Saves across the move.** Saves, the rivals token (which says "these characters are mine", and so the ratings),
   preferences and opt-ins live in the browser under the site's address. Players who move from the GitHub Pages address to
   itch.io start empty. The choices are:
   - **(a)** A paste-to-import on the title screen. The Copy button (`CopySave`, `exportSave`) already writes a run; nothing
     reads one back. This moves runs, not the token.
   - **(b)** Saves don't carry over, and the Pages site says so with a link to itch.io.
4. **"Switch from public GitHub hosting".** Does this mean only GitHub Pages stops serving the game, or also that the repository
   becomes private? A private repository is separate work: Actions minutes, and whether the source stays public.
5. **The rivals limits for launch.** The live table caps characters at 300 an hour overall and duel reports at 1,000 an hour
   (docs/rivals.sql §7d). A Reddit post that lands can pass that, and every refused post reads "Could not reach the rivals".
   The choices are:
   - **(a)** Raise both for the launch week (a migration on the live database, then lower them again).
   - **(b)** Keep them as they are and only fix the message (G3).
6. **Naming the reference game in posts.** The repository and the trailer never name it (CLAUDE.md). Whether a Reddit post or
   the video description may say "inspired by …" is a separate question, and your call.
7. **Where to post.** The subreddits in §2. Check each one's self-promotion rules the day before; some allow it only on a
   weekly thread.
8. **Open from yesterday.** Your own address is capped until about 9:00 on 2026-10-24 by the bot seeding. Either wait it out,
   or raise the address cap now. The game's wording is part of G3.

## 1. Gates before L

Work through these in order. Nothing is announced until every gate is green.

### G1. Polish (your list)

A slot for the remaining polish areas. Candidates already written down elsewhere, for you to pick from:

- `TODO.md`, the five writing items: class blurbs, the overwrought voice in headings and the death screen, unique flavour
  lines, monster advice, and reprieve card text. The class blurbs and the death screen are what a first-time player meets
  first.
- `docs/BUGS.md` #2: the Strider can be kept dodging a Spitter rare's pools for a minute. A new player may well meet it in the
  first maps.
- The real-device passes left open by docs/MOBILE.md §9 and docs/EQUIP.md §8: one real phone, start to a death.
- `docs/NEWPLAYER.md`'s out-of-scope list: Bone Dust arriving after the first Quartermaster, reward cards without a
  comparison, and the length of the map 10 boss.

### G2. Freeze

The last save-version bump happens before G5. A bump (`SAVE_VERSION`, `src/run/run.ts`) empties the rivals pool and the high
scores for players.

- After the last reseed, no change may move or retire passive nodes, or change the save format, until after L.
- If a polish item forces a bump, it goes before the reseed, and the reseed is at least 24 hours before L. Otherwise the
  address cap blocks your own test (G6).

### G3. Rivals: honest refusals

When the server refuses a character, the end screen says "Could not reach the rivals" whatever the reason
(`postRun` in `src/rivals.ts`, `src/ui/Summary.tsx`). Show what the server actually said, in the game's plain voice:

- "too many from this address today";
- "the pool is busy, try again later";
- "could not reach" only when the server really can't be reached.

This is a small code change, shipped with the polish.

### G4. Hosting switch (before L, not on it)

1. **Check that saves persist on itch.io.** itch.io runs HTML5 games in a frame served from another domain. Safari, and iOS
   browsers in general, partition or limit that frame's storage, so a save that survives in Chrome may not survive on an
   iPhone. Test on:
   - desktop Chrome;
   - Android Chrome;
   - iPhone Safari.

   On each one: start a run, close the tab, come back the next day, and check that the run, the rivals token and the
   preferences are still there. Then upload a second build with butler and check again: does the address the frame is served
   from stay the same between builds? If saves don't survive on iOS, the move isn't ready for a phone-friendly game, and we
   decide what to do before going further.

2. **Check that the reload nudge works on itch.io.** `src/update.ts` fetches `version.json` beside the game. Check that it
   resolves inside itch.io's frame and that the Reload button works there.
3. **Check that the backend accepts the itch.io origin.** Make sure the Supabase project has no list of allowed origins that
   would refuse the itch.io frame, by posting a character and a duel from the itch.io build (after G6's cap clears).
4. **Set up the itch.io page.** These are yours; butler can't set them:
   - kind HTML, "played in the browser" ticked on the html5 upload;
   - embed size, the fullscreen button, and the mobile-friendly flag with its orientation;
   - the cover, from `itch-cover/` v0 to v3;
   - screenshots, from the v2 set in `itch-screenshots/`;
   - a short description in the game's voice, with the Discord link (`DISCORD_URL`);
   - genre and tags;
   - visibility. Keep it restricted or a draft until L.
5. **Turn GitHub Pages into a pointer.** `.github/workflows/pages.yml` is also the CI (check and build on every push), so keep
   the build job. Replace what it deploys with a one-page "Battle of Builds has moved" notice and a link to itch.io. Depending
   on D3, it also offers the save copy for import, or says plainly that saves start fresh. Do this on L itself (step L-1), so
   Pages players aren't moved early.
6. **Update the docs for itch.io as the one home.**
   - The `/patch-notes` skill (`.claude/skills/patch-notes/SKILL.md`): today a push deploys the game and the question is "push
     and upload, push only, or stop". The butler upload becomes the publish step, and a push is only source.
   - CLAUDE.md's patch-notes bullet.
   - The comment at the top of `src/update.ts`.
   - Record the decision in DESIGN.md Appendix A.

### G5. The rivals pool for launch

Once the freeze holds:

- Send the 3 Zealot bots left over from the seeding: scratchpad `rivals23/zealot-unsent.json`, via
  `npx tsx scripts/postrivals.ts --post`. This needs the address cap clear.
- If G2 forced a bump, reseed as on 2026-10-23: 10 runs per class, half with the strong kit, at least 24 hours before L.
- Look at the high scores a newcomer will see first. They show only bots until real players arrive; decide whether that's fine
  for day one.

### G6. Your end-to-end run on the itch.io build

From a fresh browser profile, on the restricted itch.io page:

- a new run, through a death;
- the character posts to the rivals;
- a duel;
- the rating moves;
- the high scores show it.

Then the same on a phone. This also proves G4.3. Don't run it from this machine before the address cap clears (about 9:00 on
2026-10-24) unless D8 raised it.

### G7. Media ready

- **The video**, as decided in D2: uploaded to YouTube as unlisted, with title, description (the itch.io link first, then
  Discord), thumbnail (a frame of the cover) and end screen. Its closing line already says "Free on itch.io".
- **The Reddit posts**, drafted per subreddit (§2), each with the itch.io link, one GIF or image (the v2 screenshots or a cover
  GIF), a two-line pitch and an invitation to the Discord. The pitch, from the trailer README: "a new build every run, level 1
  to 100 in a sitting, then duel other players' builds." Use the same voice as the game: overwrought headline, plain body.
- **The patch notes**: the day before, `/patch-notes draft`, which writes them and leaves them uncommitted for you to read.
  The launch entry may want a short "Welcome" line on top; it goes through the skill like any other.

### G8. Watching

Have these ready before L:

- the Supabase logs (refusal counts by reason: address cap, browser cap, the hourly pool limit);
- the run statistics table filling at the new version;
- the rivals pool per version;
- the Discord, for crash reports (the game's crash report is copyable: `bob.crashlog`).
- **Rollback:** keep the last good `bob-itch.zip`; pushing it again to `elijahlrc/battle-of-builds:html5` restores it in
  minutes.

## 2. Where to post (candidates; check each sub's rules the day before)

Ordered by how well each fits the pitch:

- r/ARPG
- r/autobattlers
- r/roguelites
- r/incremental_games (check whether it allows posts only on its feedback day)
- r/WebGames
- r/IndieGaming, r/indiegames
- r/playmygame

r/roguelikes is strict about what counts as a roguelike; read its rules first. Space the posts out by an hour or more, so each
one gets answered. Don't post the same text everywhere, and say plainly that it's your own game.

## 3. The day

| Time (PT)   | Step                                                                                                                                                                                                                                                                                                |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| L-1 evening | Read the drafted patch notes. Check the itch.io page from a logged-out browser. Check the rules of every subreddit on the list.                                                                                                                                                                     |
| 7:00        | `/patch-notes` publishes the final build to itch.io (and pushes the source). Check from a fresh browser and a phone: a run starts, the title screen shows no update nudge, and the patch notes screen opens.                                                                                        |
| 7:30        | Deploy the "moved" page on GitHub Pages (G4.5). Make the itch.io page public.                                                                                                                                                                                                                       |
| 8:00        | Make the YouTube video public. Pin a comment with the itch.io and Discord links.                                                                                                                                                                                                                    |
| 8:30        | First Reddit post, to the best-fitting sub. Stay with it for the first hour and answer every comment.                                                                                                                                                                                               |
| 10:00       | Second post. Check the refusal counts and the run statistics.                                                                                                                                                                                                                                       |
| 12:00       | Third post, and the rest through the afternoon, an hour or more apart.                                                                                                                                                                                                                              |
| All day     | Watch the Discord for crash reports. A crash a player can reproduce is fixed and shipped the same day through `/patch-notes`, with no tree or save-format change (G2). Anything else waits for the notes from the day. If the hourly pool limit is hit, decide right then whether to raise it (D5). |
| Evening     | Take stock: players, runs, deaths by map and class, crash reports, and the posts' comments. Write a short note in docs/PROGRESS.md.                                                                                                                                                                 |

## 4. The two days after

- Answer comments on the posts and the video for the first 48 hours. That is when they are seen.
- Gather the bugs into `docs/BUGS.md` and the requests into `TODO.md`. Ship fixes as one patch, not many small ones: a deploy
  nudges every open tab to reload.
- If D5 raised the limits, put them back once traffic settles.
- The four stop-4 questions about the passive tree (docs/tree/design/G4/stop4.md) waited for playtesting. Real players' run
  statistics are the first evidence for them.
