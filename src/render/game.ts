import Phaser from 'phaser';
import type { Emitter } from '../core/events';
import type { BusEvents } from '../run/controller';
import { MapScene } from './MapScene';

/** Create the Phaser game that renders maps. DOM screens are drawn over it by `ui`. */
export function createGame(parent: string, bus: Emitter<BusEvents>): Phaser.Game {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#0f1016',
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.NO_CENTER,
    },
  });
  game.scene.add('map', MapScene, true, { bus });
  return game;
}
