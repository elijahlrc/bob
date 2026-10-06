# Bugs to return to

Collected during visual-style exploration; to be worked after an aesthetic is chosen.
Add new entries at the bottom. Mark fixed ones instead of deleting them.

## 1. Ranged standoff that never ends (open)

**Symptom.** The player and a ranged enemy (archer or mage) stand and shoot each other indefinitely.
Neither side lands a killing blow, so the map never progresses.

**Reported by.** User, during play (not reproduced yet).

**Suspected causes (unverified).**

- The player's shots keep missing the target (projectile misses, evasion, or aim/leading errors).
- Enemy life regeneration (Regenerating affix, leech, or the player's own regen) outpaces damage dealt,
  so neither side dies.
- Both sides keep a preferred range and the retreat/kite logic (`retreatT`, `retreatCd`) holds them apart.

**Ideas to investigate.**

- Reproduce headlessly with the bot (`npm run sim`) on seeds with ranged packs; log a "no damage dealt in
  N seconds while both alive" condition.
- Check the hit-chance and projectile collision paths for a ranged player attacking a ranged enemy.
- Consider a stalemate breaker: enemies close in (or the player advances) when no damage has been dealt
  for several seconds, and/or a map time limit that fails the map cleanly.
