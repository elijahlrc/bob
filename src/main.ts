import { h, render } from 'preact';
import { createGame } from './render/game';
import { Controller } from './run/controller';
import { App } from './ui/App';
import './ui/styles.css';

const controller = new Controller();
createGame('app', controller.bus);
render(h(App, { c: controller }), document.getElementById('ui')!);

// Dev-only handle for debugging from the browser console.
if (import.meta.env.DEV) (window as unknown as { __bob: Controller }).__bob = controller;
