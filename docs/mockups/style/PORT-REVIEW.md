# Gold Leaf in the game: notes for the owner's review (2026-10-24)

The style study is now the game's interface: every screen, mocked or not, two passes (a build, then three reviewers
and the fixes they found). Everything is committed on `main`, nothing pushed. The rules and the painter API are in
[STYLE-GUIDE.md](STYLE-GUIDE.md) (sections 8 to 10).

## What changed in behaviour, not only in look

Your decisions from the mockup, carried into the game:

- **Next map:** what a map pays is four fixed rows, empty values dimmed; the armies on one line; no weakness box, enemy
  types or "hard to / soft to" line; a faction's rule is in its tip; map type and density are names with tips; the
  narrow-screen "Details" fold is gone (it hid only the boss line); stop niches carry an emblem (sockets, gems, a starry
  roundel, bottles, coins).
- **Items:** the soul's reliquary; a lit slot aims, Wear puts it there ("Wear in Off hand", "Wear as Ring 1", "Carry as
  Flask 3"); the result plaque and the Wear row sit above the diptych; the slot cards are short and signed; a status
  line with Undo that disappears once anything else is done or undone; the swapped-out item's leaf says "Just taken
  off"; a Favourites sort instead of the keep-on-top switch; no capacity bar; the housekeeping always at the bag's
  foot; on a phone the full view shows both cards. Cut: the "vs" line, the two-hands and flask-kind notes, "usual
  pick", "linked", item level and affix lines in rows, the socket badges' "(… from taking out X)".
- **Skills:** stones, chains, a picked gem's actions on a plaque ("Make main", "Take out"), "primary" now reads "main".
- **Strategy:** the frequency in the Every menu; intros shortened to one line with the rest in a tip.
- **Passive tree:** tap to look and tap again to take on a desktop too; the Colours legend is gone, search also finds a
  colour group ("minions"); more passives taken than points shows "Too many 9 / Refund 9".
- **Tips** are the Gold Leaf popover everywhere, on hover with a mouse too (they used to be the browser's tooltip; the
  phone popover also opened in the corner because of a pixel-unit bug, now fixed).
- **Elsewhere:** Back sits at the top left on Codex, High scores, patch notes and Rivals; a tab opens at its top; the
  run summary names a killer's mods ("Elusive, Fire-warded") instead of their ids.

## Improvements I would suggest (need your call)

**Items**

1. The middle column is empty gold until something is picked. The study put the DPS and effective HP medallions there.
2. Picking a gem lights nothing on the soul; lighting the items with a fitting socket would match the gear flow. Its
   bag row could say where it helps most ("▲2% DPS in Spidersilk Wall") instead of "Gem".
3. A two-hander's lost off hand shows only in the sockets warning: the off-hand slot could dim on the soul.
4. On a phone every worn slot shows a × (take off, one tap, no confirm): cluttered and easy to hit.
5. After Undo the selection clears, so you lose the item you were comparing; it could be picked again.
6. The bag keeps "Last map" and nine sorts (the study had four); the views wrap to two lines on a desktop.

**Passive tree** 7. Notable names appear from medium zoom; one step earlier still would name a whole cluster in view. 8. A save more than its points over with no refund points is a dead end (this dev save: 9 over, 0 refunds). Either a
save migration hands back refunds for that state, or the plaque needs a working action. 9. On a phone the class starts are unlabelled at the opening zoom.

**Camp and screens** 10. Pearls are on every niche (offers, class cards, stops), against "pearls sparingly": plain arches might suit the
class cards. 11. The class colour no longer appears on class select (names are gold on lapis); a small medallion per class would
need ramps for the class colours. 12. Gems with two attributes take the first attribute's colour; a pearl or split stone may be better. 13. The HUD's energy shield film makes a full life orb read pale pink; a ring or arc might be clearer. The status line
takes three lines on a phone (the biome or factions could go). Orbs are 120 px without wreaths (a wreath needs
about 144 px). 14. The duel result's two reports side by side will scroll sideways at 17 px (a container query would fix it). 15. Wording to consider: Strategy's Emergency line repeats its Below menu; "Take The Quartermaster" reads oddly ("Visit"
or "Done"); the Quartermaster's cart line ("In the cart: 1 · 34 of 0 Bone Dust"); Ferry Token's "Does nothing on a
boss level" is a "does not" line. 16. The large porphyry stop screen shows a lot of mottling; it could be calmer.

**Clean-up for later** 17. The old stylesheets (`styles.css`, `items.css`, `mobile.css`, `skins.css`) are still loaded under the Gold Leaf
overrides; folding them together would remove a lot of dead rules and specificity fights. `items.css` still holds
someone else's uncommitted edit, which I left alone. 18. The style study (`docs/mockups/style/`) can stay as the reference or be retired.

## Things to know

- The two online checkboxes on the title screen were already ticked in this browser before the work began; nothing
  changed them. One reviewer's test character died on map 43 with telemetry on, so one anonymous run may have been sent.
- Your saves were backed up before the agents started and restored at the end (the level 42 Mystic is as it was;
  test runs are deleted).
- The trailer clips film the live UI, so the next render will be in Gold Leaf (you said you would re-render).
