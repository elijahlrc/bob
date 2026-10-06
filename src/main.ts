import { h, render } from 'preact';
import { createGame } from './render/game';
import { Controller } from './run/controller';
import { App } from './ui/App';
import './ui/styles.css';

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

const controller = new Controller(storage());
createGame('app', controller.bus);
render(h(App, { c: controller }), document.getElementById('ui')!);

// Dev-only handle for debugging from the browser console.
if (import.meta.env.DEV) (window as unknown as { __bob: Controller }).__bob = controller;
