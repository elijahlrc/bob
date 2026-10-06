import Phaser from 'phaser';

class BackdropScene extends Phaser.Scene {
  constructor() {
    super('backdrop');
  }
}

/** Create the Phaser game that renders maps. DOM screens are drawn over it by `ui`. */
export function createGame(parent: string): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: 960,
    height: 540,
    backgroundColor: '#0f1016',
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [BackdropScene],
  });
}
