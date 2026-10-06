import type { Controller } from './run/controller';

const KEY = 'bob.crashlog';
const MAX = 20;

type Entry = {
  at: string;
  message: string;
  stack: string;
  state: Record<string, unknown>;
};

/** A small snapshot of the game around the error, so a crash can be reproduced. */
function snapshot(c: Controller): Record<string, unknown> {
  const w = c.world;
  const out: Record<string, unknown> = {
    screen: c.screen,
    map: c.run?.map,
    classId: c.run?.classId,
    seed: c.run?.seed,
    speed: c.speed,
    paused: c.paused,
    ua: navigator.userAgent,
  };
  if (w) {
    out.tick = w.tick;
    out.status = w.status;
    out.player = { x: w.player.x, y: w.player.y, life: w.player.life, mana: w.player.mana };
    out.action = w.player.action
      ? {
          which: w.player.action.which,
          target: w.player.action.targetId,
          t: w.player.action.elapsed,
        }
      : null;
    out.projectiles = w.projectiles.length;
    out.actorsAlive = w.actors.filter((a) => a.alive).length;
    const t = w.player.action
      ? w.actors.find((a) => a.id === w.player.action!.targetId)
      : undefined;
    if (t)
      out.target = {
        id: t.id,
        name: t.name,
        rarity: t.rarity,
        mods: t.modIds,
        x: t.x,
        y: t.y,
        life: t.life,
        maxLife: t.def.maxLife,
      };
  }
  return out;
}

function load(): Entry[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as Entry[];
  } catch {
    return [];
  }
}

function show(e: Entry): void {
  let box = document.getElementById('crash-report');
  if (!box) {
    box = document.createElement('div');
    box.id = 'crash-report';
    box.style.cssText =
      'position:fixed;inset:0;z-index:99999;background:#000d;color:#fcc;font:12px monospace;padding:20px;overflow:auto;white-space:pre-wrap';
    document.body.appendChild(box);
  }
  const text = `Bob crashed.\n\n${e.message}\n\n${e.stack}\n\n${JSON.stringify(e.state, null, 2)}`;
  box.textContent = '';
  const head = document.createElement('div');
  head.style.cssText = 'font-size:16px;color:#fff;margin-bottom:10px';
  head.textContent = 'Something went wrong. Copy this report and send it along.';
  const copy = document.createElement('button');
  copy.textContent = 'Copy report';
  copy.onclick = () => void navigator.clipboard?.writeText(text);
  const close = document.createElement('button');
  close.textContent = 'Dismiss';
  close.onclick = () => box!.remove();
  const body = document.createElement('div');
  body.textContent = text;
  box.append(head, copy, ' ', close, body);
}

/**
 * Records uncaught errors (with a game-state snapshot) in localStorage under `bob.crashlog`
 * and shows a copyable report. Read earlier crashes with `JSON.parse(localStorage['bob.crashlog'])`.
 */
export function installCrashLog(c: Controller): void {
  const record = (message: string, stack: string) => {
    let state: Record<string, unknown>;
    try {
      state = snapshot(c);
    } catch (err) {
      state = { snapshotFailed: String(err) };
    }
    const e: Entry = { at: new Date().toISOString(), message, stack, state };
    try {
      localStorage.setItem(KEY, JSON.stringify([...load(), e].slice(-MAX)));
    } catch {
      /* storage unavailable */
    }
    console.error('[crash]', message, state);
    show(e);
  };
  window.addEventListener('error', (ev) => {
    record(ev.message, ev.error instanceof Error ? (ev.error.stack ?? '') : '');
  });
  window.addEventListener('unhandledrejection', (ev) => {
    const r = ev.reason as unknown;
    record(r instanceof Error ? r.message : String(r), r instanceof Error ? (r.stack ?? '') : '');
  });
}
