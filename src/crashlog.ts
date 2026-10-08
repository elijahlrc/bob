import { copyText } from './clipboard';
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

function toast(e: Entry): void {
  const box = document.createElement('div');
  box.style.cssText =
    'position:fixed;right:12px;bottom:90px;z-index:99998;max-width:360px;background:#200c;color:#fdd;border:1px solid #a44;padding:8px 10px;font:12px sans-serif';
  box.textContent = `${e.message}. A diagnostic was saved; `;
  const copy = document.createElement('button');
  copy.textContent = 'Copy report';
  copy.onclick = () =>
    void copyText(`${e.message}
${JSON.stringify(e.state, null, 2)}`).then((ok) => {
      copy.textContent = ok ? 'Copied' : 'Could not copy';
    });
  box.append(copy);
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 20000);
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
  copy.onclick = () =>
    void copyText(text).then((ok) => {
      copy.textContent = ok ? 'Copied' : 'Could not copy: select the text below by hand';
    });
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
  const record = (
    message: string,
    stack: string,
    extra?: Record<string, unknown>,
    fatal = true,
  ) => {
    let state: Record<string, unknown>;
    try {
      state = { ...snapshot(c), ...extra };
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
    if (fatal) show(e);
    else toast(e);
  };
  installStallWatch(c, record);
  window.addEventListener('error', (ev) => {
    record(ev.message, ev.error instanceof Error ? (ev.error.stack ?? '') : '');
  });
  window.addEventListener('unhandledrejection', (ev) => {
    const r = ev.reason as unknown;
    record(r instanceof Error ? r.message : String(r), r instanceof Error ? (r.stack ?? '') : '');
  });
}

/** A rolling window of combat events, so a stall report can say how the last stretch of shooting went. */
export function installStallWatch(
  c: Controller,
  record: (m: string, s: string, x: Record<string, unknown>, f: boolean) => void,
): void {
  const recent: { t: number; kind: string; mine: boolean; theirs: boolean }[] = [];
  const arrows: { t: number; aim: number; fate: number; closest: number; lastHit: number }[] = [];
  const onTarget: Record<number, { hit: number; miss: number }> = {};
  c.bus.on('ticked', ({ world: w, events }) => {
    for (const e of events) {
      if (e.t === 'hit' || e.t === 'miss' || e.t === 'block')
        recent.push({
          t: w.t,
          kind: e.t,
          mine: e.t !== 'hit' ? e.src === w.player.id : e.src === w.player.id,
          theirs: e.dst === w.player.id,
        });
      if (e.t === 'projectileEnd' && e.owner === w.player.id)
        arrows.push({ t: w.t, aim: e.aim, fate: e.fate, closest: e.closest, lastHit: e.lastHit });
      if ((e.t === 'hit' || e.t === 'miss') && e.src === w.player.id) {
        const o = (onTarget[e.dst] ??= { hit: 0, miss: 0 });
        if (e.t === 'hit') o.hit++;
        else o.miss++;
      }
      if (e.t === 'stall') {
        const a = w.actors.find((x) => x.id === e.id);
        const win = recent.filter((r) => w.t - r.t <= 25);
        const count = (kind: string, f: (r: (typeof win)[number]) => boolean) =>
          win.filter((r) => r.kind === kind && f(r)).length;
        record(
          `Stall: the player could not damage ${a?.name ?? 'a target'}`,
          '',
          {
            stall: {
              target: a && {
                name: a.name,
                rarity: a.rarity,
                state: a.state,
                mods: a.modIds,
                life: a.life,
                maxLife: a.def.maxLife,
                evasion: a.def.evasion,
                armour: a.def.armour,
                x: a.x,
                y: a.y,
                dist: Math.hypot(a.x - w.player.x, a.y - w.player.y),
                los: w.grid.los(w.player.x, w.player.y, a.x, a.y),
              },
              last25s: {
                playerHits: count('hit', (r) => r.mine),
                playerMisses: count('miss', (r) => r.mine),
                enemyHitsOnPlayer: count('hit', (r) => r.theirs),
                enemyMissesOnPlayer: count('miss', (r) => r.theirs),
                playerBlocks: count('block', (r) => r.theirs),
              },
              // Arrows aimed at the stuck target over the last 25 s: where they ended up.
              arrowsAimedAtTarget: (() => {
                const mine = arrows.filter((r) => w.t - r.t <= 25 && r.aim === e.id);
                const closest = mine
                  .map((r) => r.closest)
                  .filter((x) => x >= 0)
                  .sort((a, b) => a - b);
                return {
                  total: mine.length,
                  hitWall: mine.filter((r) => r.fate === 0).length,
                  outOfRange: mine.filter((r) => r.fate === 1).length,
                  spentOnTarget: mine.filter((r) => r.fate === 2 && r.lastHit === e.id).length,
                  spentOnOtherEnemy: mine.filter((r) => r.fate === 2 && r.lastHit !== e.id).length,
                  exploded: mine.filter((r) => r.fate === 3).length,
                  closestApproach: {
                    min: closest[0],
                    median: closest[Math.floor(closest.length / 2)],
                    p90: closest[Math.floor(closest.length * 0.9)],
                  },
                };
              })(),
              hitsAndMissesOnTarget: onTarget[e.id],
              targetSpeedHint: a && { moving: a.moving, action: a.action?.which ?? null },
              projectileCountPerUse: w.player.action?.profile.hands.length,
              skill: w.primary.gemUid,
              time: w.t,
            },
          },
          false,
        );
      }
    }
    if (recent.length > 800) recent.splice(0, 400);
    if (arrows.length > 600) arrows.splice(0, 300);
  });
}
