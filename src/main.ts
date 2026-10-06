import { render, h } from 'preact';
import { createGame } from './render/game';
import { App } from './ui/App';
import './ui/styles.css';

createGame('app');
render(h(App, {}), document.getElementById('ui')!);
