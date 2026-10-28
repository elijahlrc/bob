import { h, render } from 'preact';
import { createGame } from './render/game';
import { installCrashLog } from './crashlog';
import { installRivals } from './rivals';
import { installTelemetry } from './telemetry';
import { installUpdateCheck } from './update';
import { Controller } from './run/controller';
import { App } from './ui/App';
import { installUiScale } from './ui/uiScale';
import { installSound } from './ui/sound/hooks';
import { monsterPortrait } from './render/styles/grim/portrait';
// The interface faces, shipped with the game (SIL Open Font License): Grenze for text, Jacquard 24 for headings.
import '@fontsource/grenze/400.css';
import '@fontsource/grenze/400-italic.css';
import '@fontsource/grenze/600.css';
import '@fontsource/jacquard-24/400.css';
import './ui/styles.css';
import './ui/fonts.css';
import './ui/tree.css';
import './ui/mobile.css';
import './ui/items.css';
import './ui/workbench.css';
import './ui/strategy.css';
import './ui/sheet.css';
import './ui/report.css';
import './ui/rivals.css';
import './ui/wayside.css';
// Gold Leaf, the interface's look, after everything it restyles (docs/mockups/style/STYLE-GUIDE.md).
import './ui/leaf/leaf.css';
import './ui/leaf/camp.css';
import './ui/leaf/camp-extra.css';
import './ui/leaf/items.css';
import './ui/leaf/skills.css';
import './ui/leaf/screens.css';
import './ui/leaf/hud.css';
import { startPainter } from './ui/leaf/painter';

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

installUiScale();
const controller = new Controller(storage());
controller.portrait = monsterPortrait;
installCrashLog(controller);
installTelemetry(controller);
installRivals(controller);
installUpdateCheck(controller);
installSound(controller);
const game = createGame('app', controller.bus);
render(h(App, { c: controller }), document.getElementById('ui')!);
document.documentElement.classList.add('leaf');
startPainter();

// Dev-only handle for debugging from the browser console.
if (import.meta.env.DEV) (window as unknown as { __bob: Controller }).__bob = controller;
if (import.meta.env.DEV) {
  (window as unknown as { __game: typeof game }).__game = game;
  void import('./dev').then((m) => m.installDevTools(controller, game));
}
