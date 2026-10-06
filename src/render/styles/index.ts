import type Phaser from 'phaser';
import type { MapStyle, StyleId } from '../style/types';
import { CelStyle } from './cel';
import { GrimIsoStyle, GrimStyle } from './grim';
import { InkStyle } from './ink';

/** Create the map renderer for a style. */
export function makeStyle(id: StyleId, scene: Phaser.Scene): MapStyle {
  switch (id) {
    case 'cel':
      return new CelStyle(scene);
    case 'gri':
      return new GrimIsoStyle(scene);
    case 'ink':
      return new InkStyle(scene);
    case 'grim':
    default:
      return new GrimStyle(scene);
  }
}
