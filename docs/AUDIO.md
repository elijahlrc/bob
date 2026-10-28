# Audio: where sounds go

Where Bob makes a sound, from the player's side (2026-10-26/27), and how the first pass goes into the game. The sounds
are synthesised in the browser with Web Audio (noise grains, filters, resonances, booms, smooth saturation), no audio
files. The owner approved the twelve recipes by ear on 2026-10-27 (the "Bob Sound Set" artifact, version 13, holds them).

## First pass: twelve sounds

The owner asked for about half of the long list's Core items, with sounds reused freely (2026-10-27). Each sound below
serves every moment listed beside it; the letter-number codes point at the long list further down.

| #   | Sound    | Idea                                                                   | Plays when                                                                                            |
| --- | -------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 1   | Press    | Wooden button                                                          | Any enabled button, toggle or choice (A1, A7, A8, C2)                                                 |
| 2   | Denied   | Dull double knock                                                      | A refused action: can't afford, can't equip, no passive point, no skill to begin (A2, C7, D8, E5, F7) |
| 3   | Page     | Page turn                                                              | Camp tab switch (A3)                                                                                  |
| 4   | Begin    | Iron latch, a creaking hinge, then ku-chunk                            | Begin a run, begin a map (B7, C6)                                                                     |
| 5   | Equip    | Metal set in place: a slide, a click, a thunk and a light ring         | Equip an item, socket a gem, take a reward (D1, D10, K6)                                              |
| 6   | Dust     | Bone Dust pour, longer for more                                        | Buy at a stop, salvage, clean up old items (F6, D6, D7)                                               |
| 7   | Passive  | Ember flare; a fiery burst for a notable, a heavy blast for a keystone | Allocate a passive (E1, E2, E3)                                                                       |
| 8   | Level up | A drum roll and a rising fifth, landing on a warm, gritty major chord  | The character levels up (I11)                                                                         |
| 9   | Find     | A gritty glint; higher, with a crack and sparks, for a unique          | A rare or unique drops, or shows among the rewards (J11, J12, K5)                                     |
| 10  | Cleared  | War drums, then stone grinding                                         | The map is cleared, a boss dies (J15, J5)                                                             |
| 11  | Boss     | A sub-bass blow, a distorted swell, a roar                             | A boss appears (J3)                                                                                   |
| 12  | Death    | A short, almost vocal sigh                                             | The character dies (K7)                                                                               |

Everything here plays the same at every game speed: none of it is combat. Alongside the twelve, two pieces of plumbing
are needed: the **music** (a title theme, a quiet camp loop, a few map tracks rotated with silence between; M1 to M3)
and **settings** for music and effects volume with a remembered mute (N1).

Left out of the first pass, though Core in the long list: open and close slides (A4, A5), cards dealt for offers and
rewards (C1, K4), the map-start whoosh (H1), the low-life heartbeat (I7), the reprieve (G5), and a separate sting on the
map report (K1, covered by Cleared).

## Implementation plan (first pass)

### Where the code lives

- **`src/ui/sound/`**, browser-only like the rest of `ui` (the headless layers stay free of Web Audio):
  - `kit.ts`: the building blocks (noise bursts, resonances, booms, tones with formants, friction pulses, the stone
    room, the saturation), ported from the approved page as they are.
  - `recipes.ts`: the twelve sounds and their variants, unchanged by ear.
  - `engine.ts`: the AudioContext, the takes, the volume, and the rules below.
  - `hooks.ts`: what plays when (the wiring below). `sfx(id, variant?)` is the one call the rest of the UI makes.
- **Settings:** Sound, with Off, Quiet, Normal and Loud, beside the interface size wherever that is offered (title
  and camp), saved with `prefs.ts` (`SoundSettings.tsx`). Music gets its own setting when there is music.
- **The switch:** `SOUND_OPEN` in `src/data/constants.ts` shuts all of it when false, as it was while the first pass
  was built (the owner, 2026-10-28: half-done work had to be committable and silent). Shut, no AudioContext is made,
  nothing renders, nothing plays and the settings are hidden; `?sound` in the address opens it for one visit. Opened
  in the build on 2026-10-28 (the owner).

### How the engine behaves

- **Unlocked by the first tap.** Browsers start audio only from a gesture, so the context is created and resumed on
  the first `pointerdown`. It is suspended while the page is hidden and resumed when it comes back.
- **Takes, rendered in the background.** Each sound keeps two pre-rendered takes and plays them in turn; after a take
  plays, a fresh one is rendered in idle time (one at a time, so a phone never stutters). Takes are rendered at 44.1 kHz,
  as approved, about 8 MB in all. Nothing renders before the first tap, and a sound with no take ready yet (the first
  seconds) stays quiet rather than late.
- **One sound per tap.** The Press is heard after a button's own handler has run, and not at all if that handler asked
  for a sound of its own since the tap began (a Begin, an Equip, a Denied).
- **Disabled buttons** get no click, so Denied for them comes from the pointer's release over a disabled button.
- **A cap per sound.** A sound that is already playing is not stacked: Find plays at most once a second (an 8× map
  can drop three rares in a breath), Level up and Cleared never overlap themselves, and Press at most every 40 ms.
- **Speed doesn't matter.** None of the twelve is combat, so they play the same at every speed; pausing does not stop
  a sound already playing.
- **Duels are quiet** for the first pass except Press and Page (a duel's two characters would double every sting).

### What plays when

| Sound    | Hook                                                                                                                  |
| -------- | --------------------------------------------------------------------------------------------------------------------- |
| Press    | One delegated listener on the document for enabled buttons; a button opts out or picks another sound with `data-sfx`  |
| Page     | `data-sfx="page"` on the camp tab buttons                                                                             |
| Begin    | `data-sfx="begin"` on Begin (run intro) and on beginning a map                                                        |
| Denied   | Called where the UI refuses: can't afford at a stop, can't equip, no passive point or out of reach, no skill to begin |
| Equip    | After an equip, a socketed gem or a reward taken succeeds                                                             |
| Dust     | After a purchase or a salvage; "many" for Clean up or more than one item                                              |
| Passive  | After an allocation, by node kind: small, notable, keystone                                                           |
| Level up | The sim's `levelUp` event for the character (side 0), read from the controller's `ticked` bus                         |
| Find     | The sim's `drop` event when the item is rare or unique; on the reward screen, once, for the best card                 |
| Cleared  | The sim's `cleared` event (a boss map clears when its boss dies, so that is covered)                                  |
| Boss     | The moment the boss arrives, where the renderer already starts its boss effects                                       |
| Death    | The sim's `playerDied` event for side 0                                                                               |

The pure parts (the event-to-sound mapping, the caps) get unit tests; the sounds themselves are judged by ear.

### Steps

1. **Engine and interface:** the kit, recipes, engine, settings, and Press, Page, Begin and Denied. Built 2026-10-28.
2. **Camp actions:** Equip, Dust and Passive. Built 2026-10-28.
3. **Map moments:** Level up, Find, Cleared, Boss and Death. Built 2026-10-28; Level up, Cleared, Denied, Equip, Press,
   Page and Begin were heard firing in the browser on a test address, and the switch shut was checked silent. The
   Boss arrival and an 8× map full of rares are checked by tests only so far.
4. **Real devices:** a phone pass (first-tap unlock, the iPhone silent switch, background tabs, performance on a
   modest phone) and a volume balance across the set.

Then the decision goes in DESIGN.md Appendix A, a line in CLAUDE.md, and the patch notes through `/patch-notes`.

## Music

Built 2026-10-28 from the "Bob Music Sketch" artifact the owner approved by ear (`src/ui/sound/music.ts`).

- **One piece in layers**, D minor at 96 BPM, two bars a chord, eight-bar phrases. Every layer shares the tempo and the
  harmony, so any mix fits, and the music moves between tiers at a bar line with no seam.
- **Three tiers by an intensity** from 0 to 2. Calm: a drone, bowed strings and a sparse low cello line, some stretches
  thin or sparse but never silent. Fight: adds a soft plucked bass pulse and frame drums. Boss: adds war drums with a
  fill each phrase, fast acoustic strings on a repeated-note ostinato, a low choir "aah" and a gritty low swell; the
  cello drops out. Fight and boss feel faster through busier rhythm, never a faster tempo.
- **What varies:** six hand-written progressions chosen by the mood of the moment, the voicings (moving as little as
  they can), the cello line, the bass and drum patterns, and how full a calm stretch is. The harmony itself is not
  generated: a generated progression was judged a poor bet (the owner, 2026-10-28).
- **When:** calm in camp, on the title and on a quiet stretch of a map; fight while a monster is within 8 tiles; boss
  for a boss in sight, below half life, or with every life flask short of a drink's charges (the owner, 2026-10-28;
  `musicIntensity` in `hooks.ts`). A rise is heard from the next beat (FALL_HOLD and `rise` in `music.ts`, 2026-10-28):
  the layers it brings in join part way through the bar and the chord, and every layer fades to its new level within
  a third of a second. A fall waits until the lower intensity has lasted 4 s (a skirmish at 8× does not flicker it),
  then goes the whole way at the next bar, fading over most of a bar. Measured offline: a boss trigger is heard within
  a beat, and the music is calm again about 8 s after the trigger ends. Showcase and the gallery stay calm; a duel
  is at least a fight. A death dips the music under its sigh for a few seconds.
- **How it plays:** synthesised live on the sound's AudioContext, a bar scheduled 0.4 s ahead every tenth of
  a second; nothing is scheduled while the music is off or the page is hidden, and a page that stalled skips the
  bars it missed. A Music setting (Off, Quiet, Normal, Loud) sits under Sound. It is shut with the rest by
  `SOUND_OPEN`.
- **Mix:** levels were set from renders measured through a 150 Hz high-pass and checked on spectrograms: the tiers
  step up about 4 dB each (calm −28, fight −24, boss −20), nothing below 30 Hz, a limiter and a soft clip last.
- **Open:** the boss tier makes many voices at once and may stutter on a modest phone; if it does, render bars ahead
  in idle time as the sound effects do.

## The long list

The first, deliberately long list of every place Bob could make a sound, kept for later passes.

### Ground rules this list assumes

- **Sound follows the interface and the run, not the fight.** Camp, stops and the moments of a map (cleared, level up,
  death) sound the same at every speed. Combat sounds thin out as the speed rises and are off at 8x, except a few that
  matter (marked "always").
- **Nothing piles up.** Each sound has a cap on how often it plays (a kill sound at most a few times a second, however
  many die), and a big moment ducks the small ones under it.
- **Silent when hidden.** Sound stops when the tab or app goes to the background, and starts on the first tap.
- **Separate volumes** for music and effects, with a mute that is remembered.

Priority: **Core** for the first pass, **Good** for a second pass, **Maybe** for ideas that may not earn their place.
The 8x column, in the map sections only, says what a sound does at the top speed: **always**, **rare** (only for rare
or bigger cases), or **off**.

### A. Everywhere (shared controls)

| #   | Moment                                                | Sound idea                 | Priority |
| --- | ----------------------------------------------------- | -------------------------- | -------- |
| A1  | Any button                                            | Wooden button press        | Core     |
| A2  | A disabled button tapped (can't afford, can't equip)  | Dull double knock          | Core     |
| A3  | Camp tab switch                                       | Page turn                  | Core     |
| A4  | A sheet, popup or card opens                          | Soft paper slide           | Core     |
| A5  | Close, back, dismiss                                  | Paper slide, lower         | Core     |
| A6  | A confirm dialog appears                              | Low wooden knock           | Good     |
| A7  | Confirm accepted / cancelled                          | Firm press / soft knock    | Core     |
| A8  | A switch, checkbox or filter chip on / off            | Brass toggle (two pitches) | Core     |
| A9  | A slider dragged (volume, UI scale, flask thresholds) | Faint ratchet ticks        | Maybe    |
| A10 | An info popup or tooltip (gem popup, glossary word)   | Very soft tick             | Good     |
| A11 | A tip appears (first-time screens, per-run tips)      | Quiet chime                | Good     |
| A12 | "A new version is ready" notice                       | Quiet bell                 | Maybe    |
| A13 | Copy to clipboard (crash report, share)               | Tick                       | Maybe    |

### B. Title and starting a run

| #   | Moment                                       | Sound idea                                                     | Priority |
| --- | -------------------------------------------- | -------------------------------------------------------------- | -------- |
| B1  | Title screen shows                           | Title music starts (see M)                                     | Core     |
| B2  | Continue a run / pick a save slot            | Heavy book opening                                             | Good     |
| B3  | Delete a save                                | Paper torn, or a book slammed shut                             | Good     |
| B4  | New run                                      | Book opening on a fresh page                                   | Good     |
| B5  | Picking a class                              | A signature sound per class (blade ring, staff hum, bowstring) | Good     |
| B6  | Choosing difficulty                          | Toggle, heavier as it rises                                    | Maybe    |
| B7  | Run intro, "Begin"                           | Deep gong or iron door                                         | Core     |
| B8  | Showcase mode                                | Map sounds as in play                                          | Maybe    |
| B9  | Patch notes, Codex, High scores, Leaderboard | Page turn                                                      | Good     |
| B10 | Codex: a newly found entry                   | Small chime                                                    | Maybe    |
| B11 | Rivals opt-in accepted                       | Wax seal stamped                                               | Good     |

### C. Camp: choosing the next map

| #   | Moment                             | Sound idea                                        | Priority |
| --- | ---------------------------------- | ------------------------------------------------- | -------- |
| C1  | The three offers are laid out      | Three cards dealt, one after another              | Core     |
| C2  | An offer is selected               | Card lifted                                       | Core     |
| C3  | A stop offer (as opposed to a map) | Its own mark: a bell, or the stop's sound (see F) | Good     |
| C4  | A Respite offer                    | A breath, or a soft chord                         | Maybe    |
| C5  | Boss warning card shows            | Low ominous swell                                 | Good     |
| C6  | Begin map                          | Iron latch, then a heavy door or a portal whoosh  | Core     |
| C7  | Begin refused (no skill gem set)   | Denied knock (A2)                                 | Core     |
| C8  | Abandon a run                      | Low, final thud                                   | Good     |

### D. Camp: items and gems

| #   | Moment                                     | Sound idea                                                             | Priority |
| --- | ------------------------------------------ | ---------------------------------------------------------------------- | -------- |
| D1  | Equip an item                              | By kind: blade scrape, armour buckle, ring clink, flask glass, leather | Core     |
| D2  | Unequip an item                            | Same kind, softer                                                      | Good     |
| D3  | Open the bag / inventory                   | Pouch opening                                                          | Good     |
| D4  | Compare view opens                         | Paper slide (A4)                                                       | Maybe    |
| D5  | Favourite on / off                         | Small stamp / lift                                                     | Good     |
| D6  | Salvage one item                           | Crunch, then a short Bone Dust pour                                    | Core     |
| D7  | Clean up old items (many at once)          | A longer pour, louder with more items                                  | Core     |
| D8  | Can't equip (requirements)                 | Denied knock (A2)                                                      | Core     |
| D9  | An upgrade is waiting in the list          | Faint glint on opening the tab                                         | Maybe    |
| D10 | Socket a gem                               | Stone set into metal: click and ring                                   | Core     |
| D11 | Unsocket a gem                             | The click reversed, a small pry                                        | Good     |
| D12 | The first skill gem seats itself           | The socket click with a warm chord                                     | Good     |
| D13 | A support gem links to a skill             | Two clicks that ring together                                          | Good     |
| D14 | A gem swap that replaces another (the ask) | Low knock with the confirm (A6)                                        | Maybe    |
| D15 | Sort, filter, search in the bag            | Tick (A8)                                                              | Maybe    |

### E. Camp: passives, strategy, character

| #   | Moment                                               | Sound idea                            | Priority |
| --- | ---------------------------------------------------- | ------------------------------------- | -------- |
| E1  | Allocate a small passive                             | Short ember flare                     | Core     |
| E2  | Allocate a notable                                   | Bigger flare with a ringing tone      | Core     |
| E3  | Allocate a keystone                                  | A deep bell, the biggest of the three | Core     |
| E4  | Refund a passive                                     | The flare sucked back                 | Good     |
| E5  | Node out of reach or no points left                  | Denied knock (A2)                     | Core     |
| E6  | Passive points handed back after an update           | A pour of tokens                      | Maybe    |
| E7  | Strategy: a skill's role, order or condition changes | Toggle or ratchet tick                | Good     |
| E8  | Character tab: nothing                               | (left silent)                         | n/a      |

### F. Stops (Wayside)

| #   | Moment                                     | Sound idea                     | Priority |
| --- | ------------------------------------------ | ------------------------------ | -------- |
| F1  | Arrive at the Awlsmith                     | Hammer taps on an anvil        | Good     |
| F2  | Arrive at the Gem Hoard                    | Gems rattling in a dish        | Good     |
| F3  | Arrive at a Shrine                         | Low bell and a breath of choir | Good     |
| F4  | Arrive at the Quartermaster                | Crates shifting, a latch       | Good     |
| F5  | Arrive at the Ferryman                     | Water lapping, an oar creak    | Good     |
| F6  | Buy something                              | Bone Dust pour, short          | Core     |
| F7  | Can't afford it                            | Denied knock (A2)              | Core     |
| F8  | A blessing taken at a Shrine               | Rising chime                   | Good     |
| F9  | A service done (Awlsmith work, gem traded) | The stop's own sound, once     | Good     |
| F10 | Leave the stop                             | Door, or footsteps on gravel   | Maybe    |

### G. Provisions and reprieves

| #   | Moment                                    | Sound idea                                           | Priority      |
| --- | ----------------------------------------- | ---------------------------------------------------- | ------------- |
| G1  | Arm a provision in camp                   | Cork in a bottle, or a strap tightened               | Good          |
| G2  | Disarm it                                 | The reverse                                          | Maybe         |
| G3  | Provisions burn as a map starts           | Short flare per provision                            | Good          |
| G4  | Pouch full                                | Denied knock (A2)                                    | Good          |
| G5  | A reprieve saves the character (in a map) | Sharp intake of breath, a bright snap, flasks refill | Core (always) |
| G6  | A cleared map leaves a provision (forage) | Small pouch thump                                    | Good          |

### H. Starting a map

| #   | Moment                          | Sound idea                                               | Priority |
| --- | ------------------------------- | -------------------------------------------------------- | -------- |
| H1  | The map opens, biome name shows | A whoosh, then the biome's ambience fades in             | Core     |
| H2  | Biome ambience                  | A quiet loop per biome kind (drips, wind, embers, water) | Maybe    |
| H3  | Music switches to the map track | (see M)                                                  | Core     |

### I. In a map: the character

| #   | Moment                                    | Sound idea                                    | Priority | At 8x  |
| --- | ----------------------------------------- | --------------------------------------------- | -------- | ------ |
| I1  | A melee swing or thrust                   | Whoosh, by weapon weight                      | Good     | off    |
| I2  | A spell cast                              | Short hum or crackle, by element              | Good     | off    |
| I3  | A projectile or beam fired                | Twang or zap, by kind                         | Good     | off    |
| I4  | A hit lands                               | Thud, by element; one per pack, not per enemy | Good     | off    |
| I5  | A critical hit                            | Sharper crack                                 | Good     | rare   |
| I6  | The character takes a big hit             | Grunt-like thump                              | Good     | rare   |
| I7  | Life low (below a third)                  | A slow heartbeat while it lasts               | Core     | always |
| I8  | A flask drunk                             | Glass and a gulp                              | Good     | off    |
| I9  | Energy shield breaks / starts to recharge | Glass crack / rising shimmer                  | Good     | rare   |
| I10 | Block, evade, a miss                      | Clank / swish / nothing                       | Maybe    | off    |
| I11 | Character level up                        | The level-up sting                            | Core     | always |
| I12 | A gem levels up                           | Smaller gem chime                             | Good     | always |
| I13 | A movement skill (blink, rush, warp)      | Whoosh or pop                                 | Maybe    | off    |
| I14 | A buff, aura or warcry                    | Warcry: a shout-like swell; auras silent      | Maybe    | off    |
| I15 | A minion summoned / falls                 | Bone rattle up / down                         | Maybe    | off    |
| I16 | A trap, mine or totem set / set off       | Click / snap                                  | Maybe    | off    |

### J. In a map: monsters and the world

| #   | Moment                                          | Sound idea                                                   | Priority | At 8x  |
| --- | ----------------------------------------------- | ------------------------------------------------------------ | -------- | ------ |
| J1  | A monster dies                                  | By body: bone crunch, splash, ember hiss, flesh thud; capped | Good     | off    |
| J2  | A rare or unique monster dies                   | Heavier death and a small sting                              | Good     | always |
| J3  | A boss appears                                  | Low roar or bell, music shifts                               | Core     | always |
| J4  | A boss changes phase                            | Swell or crack                                               | Good     | always |
| J5  | A boss dies                                     | The victory sting                                            | Core     | always |
| J6  | A warning shape on the ground                   | Faint rising whine before it lands                           | Maybe    | off    |
| J7  | An explosion                                    | Boom, capped                                                 | Good     | rare   |
| J8  | An ailment applied (burn, chill, shock, poison) | Hiss, crackle, zap, bubble; capped                           | Maybe    | off    |
| J9  | Warden Pylon ward drops / returns               | A hum that cuts out / back                                   | Maybe    | off    |
| J10 | A chest opened                                  | Iron latch and lid                                           | Good     | always |
| J11 | A rare item drops                               | Rare find sting                                              | Core     | always |
| J12 | A unique item drops                             | Unique find sting, the biggest                               | Core     | always |
| J13 | Plain and magic drops                           | (left silent)                                                | n/a      | n/a    |
| J14 | Bone Dust picked up                             | Tiny pour, capped                                            | Maybe    | off    |
| J15 | The exit opens / the map is cleared             | A rumble and a door grinding open                            | Core     | always |
| J16 | Abandon started / cancelled / done              | Heartbeat-like ticking / release / door slam                 | Good     | always |

### K. After a map

| #   | Moment                                     | Sound idea                                       | Priority |
| --- | ------------------------------------------ | ------------------------------------------------ | -------- |
| K1  | Map report screen                          | Map-cleared sting                                | Core     |
| K2  | Numbers counting up (kills, XP, Bone Dust) | Fast ticks while they run                        | Good     |
| K3  | XP bar fills                               | Rising tone, the level-up sting if it rolls over | Good     |
| K4  | Reward cards laid out                      | Cards dealt (as C1)                              | Core     |
| K5  | A rare or unique among the rewards         | Its find sting as the card shows                 | Core     |
| K6  | A reward picked                            | Card taken, then the item's equip-kind sound     | Core     |
| K7  | Death                                      | The death sting, the music cut                   | Core     |
| K8  | Why you died screen                        | Silence, or a low drone                          | Maybe    |
| K9  | Run summary / a new high score             | Slow toll / a bright sting                       | Good     |

### L. Duels

| #   | Moment                                             | Sound idea                           | Priority |
| --- | -------------------------------------------------- | ------------------------------------ | -------- |
| L1  | A duel begins ("Duel for your damned soul's fate") | Gong and a choir swell               | Good     |
| L2  | Duel won / lost                                    | Victory sting / death sting, lighter | Good     |
| L3  | Rating going up / down                             | Ticks rising / falling               | Maybe    |

### M. Music

| #   | Where                       | Idea                                                   | Priority |
| --- | --------------------------- | ------------------------------------------------------ | -------- |
| M1  | Title                       | One slow, dark theme                                   | Core     |
| M2  | Camp (all tabs, stops)      | Quiet, low-fatigue loop; or the title theme, softer    | Core     |
| M3  | Maps                        | Three or four tracks rotated with silence between them | Core     |
| M4  | Boss fights                 | A heavier layer or track that comes in with the boss   | Good     |
| M5  | Duels                       | Its own track, or the boss one                         | Maybe    |
| M6  | Death, victory, map cleared | Stings that interrupt the music (K1, K7, J5)           | Core     |

Music never speeds up with the game.

### N. Settings

| #   | What                                                                 | Priority |
| --- | -------------------------------------------------------------------- | -------- |
| N1  | Music volume, effects volume, mute (remembered)                      | Core     |
| N2  | Combat sounds on or off                                              | Good     |
| N3  | The speed control: a click when changed; pause stills the map sounds | Good     |
