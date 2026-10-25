# Menu speed: every tab opens instantly

A plan (asked for 2026-10-24) to make pressing a tab or a menu button feel instant. Nothing here is built yet. The map
side of loading is planned in [PRELOAD.md](PRELOAD.md), which the owner parked: the menus come first.

## 1. What was measured (2026-10-24)

The level 42 Mystic save's camp in the dev server, desktop at 1280×800, each tab clicked once and then again. Long
tasks (over 50 ms) from the browser's own observer; the painter's share timed round its canvas work (the wear pass
between `getImageData` and `putImageData`, and `toDataURL`).

| Pressed                 | First visit: longest blocking | of which the Gold Leaf painter | paintings made | Second visit |
| ----------------------- | ----------------------------- | ------------------------------ | -------------- | ------------ |
| Continue (title → camp) | 254 ms                        | 215 ms                         | 38             | —            |
| Character               | 234 ms                        | 210 ms                         | 23             | under 50 ms  |
| Passive tree            | 182 ms (three tasks)          | 140 ms                         | 10             | under 50 ms  |
| Items                   | 121 ms                        | 101 ms                         | 38             | under 50 ms  |
| Skills                  | 114 ms                        | 95 ms                          | 40             | under 50 ms  |
| Strategy                | 141 ms                        | 116 ms                         | 44             | under 50 ms  |
| Next map                | under 50 ms                   | 0 (already painted)            | 0              | under 50 ms  |

**The first visit to each tab is the whole problem, and 80–90% of it is the painter.** Building the tab itself (Preact,
the calculation) is about 20–25 ms. A second visit is fast because the painter remembers its paintings, but only for
the session: every new session, and every window size, starts over.

One painting dominates. Repainting at a new window size took 169 ms for 9 paintings, and the **wall** (the worn gold
behind everything, 590×400 art pixels) was 97 ms of it. Next were the offer arches (178×191) at 11–26 ms each and
the bands across the screen (590×27, 590×33) at 6–9 ms. Small plaques and buttons cost 1–3 ms each, but there are
dozens of them.

The wall is painted again whenever its key changes. The key holds the screen's size and the places of the headings
that sit straight on the gold (`calmOf`, kept free of cracks). So a tab whose headings sit elsewhere, or whose
scrollbar changes the screen's width, pays about 100 ms for a new wall. M0 confirms which tabs pay it.

**Not measured yet:** phones (a phone's processor is several times slower, so these numbers would be several times
larger there), the dialogs and pickers inside tabs, and the title screen's own first paint.

## 2. Goal

Proposed budgets (the owner's to confirm): pressing any tab or menu button blocks the page for **under 50 ms** and the
new screen appears complete on the next frame. That should hold on a first visit, on a phone, and in a new session.

## 3. What to do, in order of value

### 3.1 Paint the wall once per size

The wall is the largest single cost and is repainted for reasons unrelated to its look. Paint it once per screen size
with no calm areas, and make the calm areas a second painting of the same size, clean gold with the same mottle but no
flakes or cracks. Behind each heading on the gold, a small element shows that calm painting at the matching offset
(`background-position`), with a dithered pixel edge (a CSS mask), so it blends into the worn wall. Moving a heading
then costs nothing, and the two paintings per size are cached like any other. Painting the wall at the screen's
largest size, not its size without a scrollbar, stops a scrollbar from repainting it.

### 3.2 Keep paintings between sessions

Paintings are deterministic: the same key and size always give the same pixels. Store them in IndexedDB as PNG blobs
under their cache key, plus a painter version, and load them into the in-memory cache when the game starts (while the title screen shows; how long reading a few hundred small blobs takes is measured in M2). After the first session,
nothing is painted again unless the window size or the painter changes. The painter version is a hash of the painter's
source files (`src/ui/leaf/*.ts`), worked out at build time, so a deploy that does not touch the painter keeps
everyone's cache. Old entries are dropped when the version changes, and the cache is capped (by count and bytes) so a
player who resizes the window a lot does not fill their storage.

### 3.3 Paint the other tabs ahead, while the player reads

When camp opens, the tabs the player has not opened yet are painted in idle time: each is rendered once, out of sight
at the screen's width (so the painter sees the same elements, keys and sizes it will see when the tab is opened), then
unmounted. Only its paintings are kept. This work is sliced so the page never blocks: one painting per idle callback
(`requestIdleCallback`, or a short timeout where a browser lacks it). With 3.1 the largest remaining painting is about
26 ms, under the budget. Order: the tab the player opens most (from the session's history; Items first by default),
then the rest. It stops the moment the player clicks anything, and resumes when idle again.

### 3.4 Encode without blocking

`toDataURL` encodes each painting to PNG on the main thread, about 10% of the painter's time. `canvas.toBlob` does it off
the main thread and gives a blob for 3.2. Paintings shown as object URLs (`URL.createObjectURL`), revoked when they
leave the cache.

### 3.5 Paint in a background thread (only if still needed)

The wear pass (`age`) works on pixels only, so the whole painter can run in a worker with an `OffscreenCanvas`
(supported in current browsers, Safari since 16.4). Then no painting ever blocks the page. This is a larger change, and
after 3.1 to 3.3 almost every painting is already cached when it is needed, so it is done only if M0's phone numbers ask
for it. The question it raises: what a tab shows for the frame or two before its paintings arrive (flat colours, or
waiting up to ~50 ms before showing the tab). Decision C.

### 3.6 Fewer, cheaper paintings

- Thin plaques and buttons come in many sizes, each painted separately. Rounding their painted size to a step (say 4
  art pixels) and letting the element clip it would share paintings between near sizes, at the cost of a rim that may
  sit a pixel or two inside the element. Decision B.
- The wear pass on the biggest panels (the arches) can be profiled and cut like the floor painter's (PRELOAD.md M1).

### 3.7 The rest of a first visit

The 20–25 ms of building a tab is within budget on a desktop, but four or five times that on a phone is not. The
heavier tabs' calculations (the Items tab's hints, the Skills tab's badges, already sliced after the tab opens,
PERFORMANCE.md 2) can be worked out in camp idle time before the tab is opened, cached by build, so the tab renders from
the cache. Only if M0 on a phone shows the need.

## 4. Decisions for the owner

- **A. Budgets:** under 50 ms blocking and complete on the next frame, for every tab and menu button, including a first
  visit and a phone.
- **B. Rounding small paintings' sizes** (3.6): share paintings between near sizes, a rim possibly a pixel or two
  inside its element.
- **C. If painting moves to a background thread** (3.5): show a tab with flat colours for a frame or two, or hold it
  back up to ~50 ms until its paintings arrive.
- **D. Storage:** the painting cache's cap (proposed: 20 MB).

## 5. Milestones

| #   | What                                                                                                                                          | Check                                                                           |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| M0  | A dev-only harness (`?perf`): the long-task observer, and the painter's own count and time per painting, per press, printed as a short report | the table of section 1, which tabs repaint the wall, and a phone run            |
| M1  | The wall painted once per size, calm areas as overlays (3.1)                                                                                  | the wall painted once per size across all tabs; headings on the gold still calm |
| M2  | Paintings kept between sessions (3.2), encoded with `toBlob` (3.4)                                                                            | a second session paints nothing at an unchanged size                            |
| M3  | The other tabs painted ahead in idle time (3.3)                                                                                               | a first visit to any tab paints nothing; no long task while it works            |
| —   | **The owner's stop:** before and after numbers, desktop and phone                                                                             |                                                                                 |
| M4  | If still needed: the background thread (3.5), rounded sizes (3.6), calculations ahead (3.7)                                                   | the budget on a phone                                                           |

## 6. Risks

- An out-of-sight render of a tab must not change anything (no state changes on mount, such as marking items seen or the
  Items tab's first-visit view); M3 needs a check of every tab's mount effects.
- The wall's calm overlays must line up with the wall to the pixel at every size and scroll position.
- IndexedDB can be unavailable (private windows, blocked storage): the cache then lives in memory as it does today.

## 7. Progress

- **3.1, 3.2 and 3.3 built (2026-10-24; the owner chose these three, with no measuring harness).**
  - The wall (`paintWall`, `painter.ts`) is painted once per size; its calm boxes are cut from a clean twin made in the
    same pass (`age`'s `twin`, same mottle pixel for pixel) and laid over it as extra background layers of the same
    element. When a screen has a scrollbar, the wall for the width without one is made in the next idle moment (the
    title screen prepares the camp's).
  - Paintings are kept in IndexedDB (`store.ts`) under a painter version hashed from `src/ui/leaf/*.ts` and the ramps
    at build time (`__LEAF_VERSION__`, `vite.config.ts`), capped at 20 MB; in the dev server only with `?leafcache`.
  - Camp paints the tabs not open yet ahead (`Ahead`, `Camp.tsx`): a hidden, inert copy in the tab body, as wide as the
    tab will be (a scrollbar narrower when it will scroll), its paintings made in idle moments within the time the
    browser offers; the painter's keys count within each tab (`data-paint-scope`), so the copy and the real tab share
    paintings. A hidden copy changes nothing (`rehearsal.ts`: the Skills tab skips its hint flag and its badge work).
  - Checked in the browser on the level 42 save: a second session opened the camp and every tab with no task over
    50 ms and 5 new paintings in all; the first ever camp entry went from 254 to 205 ms; every tab looked as before at
    desktop and phone width. The wear of panels inside tabs was re-rolled once by the new keys.
