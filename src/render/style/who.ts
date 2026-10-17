import { itemBase } from '../../data/bases';
import { classDef } from '../../data/classes';
import type { Side } from '../../sim/side';
import type { Actor, World } from '../../sim/types';
import { heroFigure, monsterFigure, type FigureKind } from './figure';

/**
 * Who an actor is, for the scene (no Phaser here, so that a test can read it). A map has one character; a duel has two, and the
 * scene draws each as the character of its own side: its class, its weapon, its colour.
 */

/**
 * Whether an actor is the viewer's own character: side 0's, the one the HUD, the first light and the screen shake are for. A
 * duel's rival is a character of another side and is drawn as an enemy would be (its blood without the shake, its damage in the
 * colour of the type, its marks and a ring). An actor with no side counts as side 0's.
 */
export function isViewer(a: Actor): boolean {
  return a.isPlayer && (a.side?.id ?? 0) === 0;
}

/** The side a character belongs to (the first, for one that names none). */
function sideOf(w: World, a: Actor): Side {
  return a.side ?? w.sides[0];
}

/** What an actor is drawn as: a character as its own class, with the weapon of its own side's build, a monster as its type. */
export function figureOf(w: World, a: Actor): FigureKind {
  if (a.isPlayer) {
    const mh = sideOf(w, a).build.equipment.mainHand;
    return heroFigure(mh ? itemBase(mh.baseId).itemClass : undefined);
  }
  return monsterFigure(a.mon!.spec.type, a.mon!.spec.rarity);
}

/** The colour of a character's class: the rival in a duel is drawn in its own. */
export function heroColor(w: World, a: Actor): number {
  return classDef(sideOf(w, a).build.classId).color;
}
