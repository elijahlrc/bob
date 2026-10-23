# Launch day (plan, 2026-10-23)

The public announcement of Battle of Builds, on **2026-10-24 at midday** (Pacific):

- a video on YouTube;
- posts on Reddit;
- the game's one home becomes itch.io (`elijahlrc/battle-of-builds`), and the repository goes private.

## 0. Decisions

**Taken (the owner, 2026-10-23):**

- **Date:** tomorrow, 2026-10-24, midday.
- **Video:** the real footage cut, which is done.
- **Repository:** goes private.
- **Rivals limits:** raised substantially.
- **Naming in posts:** the game is "inspired by ARPGs" in general. Players will recognise the reference game, but the posts and
  the video never name it or play off its name; the repository already never names it.

**Still open:**

- **Saves across the move (D3).**
  - Saves, the rivals token (and so a player's characters and rating), preferences and opt-ins live in the browser under the
    site's address. Players coming from the GitHub Pages address start empty on itch.io.
  - itch.io may also lose them at its own updates. Players report that it serves each new upload under a new folder or
    subdomain; if it changes the subdomain, the address changes and the browser treats it as a new site. To be checked (§1.2).
  - Recommended: a paste-to-import on the title screen, beside the existing Copy button. It is cheap, it rescues runs from
    either loss, and it ships in tonight's build.
- **Subreddits:** the candidates in §2.

## 1. Tonight and tomorrow morning (gates)

Nothing is announced until every gate is green.

1. **Rivals limits, raised.** A migration on the live database, waiting on your approval. The proposed values, per 24 hours
   unless stated:

   | Limit                    | Now        | Proposed    |
   | ------------------------ | ---------- | ----------- |
   | Characters per browser   | 20         | 40          |
   | Characters per address   | 60         | 300         |
   | Characters overall       | 300/hour   | 5,000/hour  |
   | Duel reports per browser | 50         | 200         |
   | Duel reports per address | 150        | 1,000       |
   | Duel reports overall     | 1,000/hour | 20,000/hour |

   The per-address limit matters at launch because phone carriers and campuses put many players behind one address. Raising it
   also frees your own address today. `docs/rivals.sql` §7d is updated to match once the migration is applied.

2. **Saves on itch.io.** The game is already on itch.io, so check now:
   - **Across builds:** open the itch.io page in a browser that played an earlier build. Is the run still there? Then repeat
     after tonight's upload.
   - **iPhone:** in Safari, start a run, close the tab, reopen it and check the run is there.

   If saves are lost at each upload, the import (D3) is what players are told to use, and the patch notes stay rare.

3. **Refusals say why.** Done (831b898): the end screen shows a daily limit, the busy pool or a refusal for what it is, and
   "Could not reach the rivals" only when nothing answered.
4. **Polish (your list).** Candidates written down elsewhere:
   - `TODO.md`'s writing items (the class blurbs and the death screen are what a newcomer meets first);
   - `docs/BUGS.md` #2 (the Strider kept dodging a Spitter rare's pools);
   - one start-to-death pass on a real phone (docs/MOBILE.md §9).
5. **Freeze.** No change that moves passive nodes or the save format until after launch. A save-version bump would empty the
   seeded rivals pool and the high scores overnight.
6. **Rivals pool.** Send the 3 leftover Zealot bots (scratchpad `rivals23/zealot-unsent.json`,
   `npx tsx scripts/postrivals.ts --post`), once the limits are raised or after about 9:00.
7. **The itch.io page** (yours; butler can't set these):
   - HTML kind, "played in the browser" on the html5 upload, embed size, fullscreen button, mobile-friendly flag;
   - the cover (`itch-cover/` v0 to v3) and the v2 screenshots (`itch-screenshots/`);
   - a short description in the game's voice with the Discord link;
   - tags, and "inspired by ARPGs", never the reference game's name.
8. **GitHub Pages goes away.**
   - A private repository on a free plan has no Pages at all. To keep a "moved to itch.io" page at the old address, either
     the plan needs Pages for private repositories (GitHub Pro), or the notice goes up and stays a few days before the
     repository goes private.
   - Recommended: tonight, publish the notice page from `pages.yml` (keeping its check-and-build job as the CI); make the
     repository private after launch week.
   - CI on a private repository uses the free Actions minutes; a check-and-build run every push is well within them.
9. **The docs say itch.io is the home**, for when a push no longer deploys:
   - the `/patch-notes` skill: the butler upload becomes the publish step;
   - CLAUDE.md's patch-notes bullet;
   - the comment at the top of `src/update.ts`;
   - DESIGN.md Appendix A.
10. **Your end-to-end run on itch.io**, from a fresh browser profile and then a phone: a new run to a death, the character
    posts, a duel, the rating moves, the high scores show it. This also proves the backend accepts the itch.io frame.
11. **Media.**
    - **The video:** uploaded unlisted, with the itch.io link first in the description, then the Discord; a thumbnail; an end
      screen.
    - **The posts:** one per subreddit, not the same text everywhere. Each has the itch.io link, one GIF or screenshot, a
      two-line pitch, the Discord, and says plainly that it's your own game. The pitch: "A new build every run: level 1 to 100
      in a sitting, then duel other players' builds. Inspired by ARPGs."
12. **Patch notes:** `/patch-notes draft` tonight, read in the morning.

## 2. Where to post

Candidates, best fit first. Read each one's self-promotion rules tonight; some allow it only on a weekly thread.

- r/ARPG
- r/autobattlers
- r/roguelites
- r/incremental_games (it may allow posts only on its feedback day)
- r/WebGames
- r/IndieGaming, r/indiegames
- r/playmygame

r/roguelikes is strict about what counts as a roguelike.

## 3. Tomorrow, 2026-10-24 (Pacific)

| Time     | Step                                                                                                                                              |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 9:00     | Your address is clear even without the migration. The end-to-end run (gate 10) and the 3 Zealot bots (gate 6).                                    |
| 10:00    | `/patch-notes`: the final build to itch.io. Check from a fresh browser and a phone: a run starts, there is no update nudge, the patch notes open. |
| 11:00    | The itch.io page goes public. The Pages "moved" notice is live.                                                                                   |
| 11:30    | The YouTube video goes public. Pin a comment with the itch.io and Discord links.                                                                  |
| 12:00    | The first Reddit post, to the best fit. Stay with it for an hour and answer every comment.                                                        |
| 13:30    | The second post. Check refusals by reason, the run statistics and the rivals pool.                                                                |
| 15:00 on | The rest, an hour or more apart.                                                                                                                  |
| All day  | Watch the Discord for crash reports. A crash a player can reproduce is fixed and shipped the same day, within the freeze. Anything else waits.    |
| Evening  | Take stock (players, runs, deaths by map and class, crashes, comments) and write it in docs/PROGRESS.md.                                          |

**Rollback:** keep the last good `bob-itch.zip`. Pushing it again to `elijahlrc/battle-of-builds:html5` restores it in minutes.

## 4. The two days after

- Answer comments for the first 48 hours.
- Gather the bugs into `docs/BUGS.md` and the requests into `TODO.md`. Ship fixes as one patch, not many: a deploy nudges every
  open tab to reload, and may cost itch.io saves (§1.2).
- Lower the rivals limits once traffic settles, if they turn out generous.
- Make the repository private, if it was kept public for the Pages notice.
- The four stop-4 questions about the passive tree (docs/tree/design/G4/stop4.md) waited for playtesting. Real players' run
  statistics are their first evidence.
