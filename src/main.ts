import { h, render } from 'preact';
import { createGame } from './render/game';
import { installCrashLog } from './crashlog';
import { installRivals } from './rivals';
import { installTelemetry } from './telemetry';
import { installUpdateCheck } from './update';
import { Controller } from './run/controller';
import { App } from './ui/App';
import { monsterPortrait } from './render/styles/grim/portrait';
import './ui/styles.css';
import './ui/skins.css';
import './ui/tree.css';
import './ui/mobile.css';
import './ui/items.css';
import './ui/workbench.css';
import './ui/strategy.css';
import './ui/report.css';
import './ui/rivals.css';
import './ui/wayside.css';

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

const controller = new Controller(storage());
controller.portrait = monsterPortrait;
installCrashLog(controller);
installTelemetry(controller);
installRivals(controller);
installUpdateCheck(controller);
const game = createGame('app', controller.bus);
render(h(App, { c: controller }), document.getElementById('ui')!);

// Dev-only handle for debugging from the browser console.
if (import.meta.env.DEV) (window as unknown as { __bob: Controller }).__bob = controller;
if (import.meta.env.DEV) {
  (window as unknown as { __game: typeof game }).__game = game;
  void import('./dev').then((m) => m.installDevTools(controller, game));
}
