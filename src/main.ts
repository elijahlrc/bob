import { h, render } from 'preact';
import { createGame } from './render/game';
import { Controller } from './run/controller';
import { App } from './ui/App';
import './ui/styles.css';
import './ui/skins.css';

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

const controller = new Controller(storage());
const game = createGame('app', controller.bus, controller.styleId);
document.documentElement.dataset.style = controller.styleId;
controller.bus.on('style', ({ id }) => (document.documentElement.dataset.style = id));
render(h(App, { c: controller }), document.getElementById('ui')!);

// Dev-only handle for debugging from the browser console.
if (import.meta.env.DEV) (window as unknown as { __bob: Controller }).__bob = controller;
if (import.meta.env.DEV) {
  (window as unknown as { __game: typeof game }).__game = game;
  void import('./dev').then((m) => m.installDevTools(controller, game));
}
