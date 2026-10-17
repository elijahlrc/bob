import Phaser from 'phaser';
import type { Emitter } from '../core/events';
import type { BusEvents } from '../run/controller';
import { MapScene } from './MapScene';
import { fixStrokes } from './strokeFix';

/** Create the Phaser game that renders maps. DOM screens are drawn over it by `ui`. */
export function createGame(parent: string, bus: Emitter<BusEvents>): Phaser.Game {
  fixStrokes();
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#0f1016',
    render: { maxLights: 32 },
    // The game has no sound. Without this Phaser opens a Web Audio context anyway, and iOS
    // Safari rejects its resume() ("Failed to start the audio device") when the audio
    // session is busy, e.g. during a call or with another app playing.
    audio: { noAudio: true },
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.NO_CENTER,
    },
  });
  game.scene.add('map', MapScene, true, { bus });
  return game;
}
