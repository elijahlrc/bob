/**
 * A side of a map (docs/DUEL.md section 3): one character and everything of theirs. `World` is the arena; `World.sides` holds
 * the sides, and side 0 is the local player's. Monsters belong to no side (`Actor.side` is null).
 *
 * The type grows one group of fields at a time, as they move out of `World` (DUEL.md 3.3).
 */
export type Side = {
  id: number;
  /** Actors of different teams are enemies. The monsters are team 1, side 0 is team 0, a second side is team 2. */
  team: number;
};
