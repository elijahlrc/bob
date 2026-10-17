import { useEffect, useState } from 'preact/hooks';
import { classDef } from '../data/classes';
import { DEFAULT, difficultyText, sameDifficulty } from '../data/difficulty';
import { DAMAGE_TYPES } from '../mods/types';
import type { Controller } from '../run/controller';
import type { RunState } from '../run/run';
import {
  postRun,
  postStatus,
  rivalsConfigured,
  rivalsOn,
  sendName,
  setRivals,
  watchPost,
} from '../rivals';
import type { DeathRecap } from '../sim/types';
import { FACTION_NAMES, MONSTER_TYPES, type MonsterTypeId } from '../data/monsters';
import { TYPE_BLURBS } from '../data/monsterInfo';
import { themeDef } from '../data/themes';
import { themeInfo } from '../run/themeInfo';
import type { MapTypeId } from '../data/mapTypes';
import { MapReportView } from './MapReport';
import { DUEL_TITLE } from './Rivals';
import { RivalsOptIn } from './RivalsOptIn';

const f0 = (v: number) => Math.round(v).toLocaleString();
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const MIX_NAME = ['physical', 'lightning', 'cold', 'fire', 'chaos'];

/** The damage mix of the last seconds against the one the camp card gave (docs/ENEMIES.md 5.3). */
function MixLine({ r, total }: { r: DeathRecap; total: number }) {
  if (!r.themeId || total <= 0) return null;
  const taken = [0, 0, 0, 0, 0];
  for (const l of r.lines) taken[l.dtype] += l.amount / total;
  const expected = themeInfo(
    themeDef(r.themeId),
    r.affixes ?? [],
    (r.mapType ?? 'plain') as MapTypeId,
    r.areaLevel ?? 1,
  ).mix;
  const top = taken.indexOf(Math.max(...taken));
  const text = (m: number[]) =>
    m
      .map((x, i) => (x >= 0.05 ? `${MIX_NAME[i]} ${Math.round(x * 100)}%` : ''))
      .filter(Boolean)
      .join(', ');
  return (
    <div class="muted">
      Damage by type: {text(taken)}. The map's card said: {text(expected)}.
      {expected[top] >= 0.3 && ` The ${MIX_NAME[top]} damage that killed you was on the card.`}
    </div>
  );
}

/** Why you died: the killer, the last seconds of damage, and the defences you had (EXPANSION section 9). */
function Recap({ r }: { r: DeathRecap }) {
  const total = r.lines.reduce((s, l) => s + l.amount, 0);
  const mods = r.killerMods.length ? `: ${r.killerMods.join(', ')}` : '';
  const resLine = (['fire', 'cold', 'lightning', 'chaos'] as const).map((k) => {
    const below = r.res[k] < r.maxRes[k];
    return (
      <span key={k} class={below ? 'warn' : ''}>
        {cap(k)} {r.res[k]}% / {r.maxRes[k]}%{k === 'chaos' ? '' : ' · '}
      </span>
    );
  });
  return (
    <div class="recap">
      <h3>What happened</h3>
      <p>
        Killed by <b>{r.killer}</b> ({r.killerRarity}
        {mods}), {r.time.toFixed(0)} s into the map.
      </p>
      {r.killerType && MONSTER_TYPES[r.killerType as MonsterTypeId] && (
        <div class="muted">
          {MONSTER_TYPES[r.killerType as MonsterTypeId].name} of{' '}
          {FACTION_NAMES[MONSTER_TYPES[r.killerType as MonsterTypeId].faction]}:{' '}
          {TYPE_BLURBS[r.killerType as MonsterTypeId]}
        </div>
      )}
      <div class="muted">Damage taken in the last 5 seconds: {f0(total)}</div>
      <MixLine r={r} total={total} />
      <table>
        <tbody>
          {r.lines.slice(0, 6).map((l) => (
            <tr key={`${l.name}${l.dtype}`}>
              <td>{f0(l.amount)}</td>
              <td>{DAMAGE_TYPES[l.dtype]}</td>
              <td>{l.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div class="muted">Your resistances (current / maximum): {resLine}</div>
      <div class="muted">
        Life {f0(r.maxLife)} · Energy shield {f0(r.maxEs)}
        {r.ailments.length > 0 && ` · You were ${r.ailments.join(', ')}`}
      </div>
    </div>
  );
}

/**
 * What the player does with the character that just ended (docs/DUEL.md 6.5): add it to the rivals (the opt-in, until it is sent,
 * and a name is needed), then duel. The character is posted when the box is ticked with a valid name already there, or when the
 * button is pressed with the name just typed (a name typed letter by letter is never posted half-typed); a post that failed says
 * why (a name the table refused shows the field again) and can be tried again. After a set, the tally and the player's rating.
 */
function RivalsBlock({ c, run }: { c: Controller; run: RunState }) {
  const [, setTick] = useState(0);
  const [busy, setBusy] = useState(false);
  // The duel button was pressed before the box was on or a name typed: the opt-in says what is missing and takes focus.
  const [nudged, setNudged] = useState(false);
  const refresh = () => setTick((v) => v + 1);
  useEffect(() => watchPost(refresh), []);
  if (!rivalsConfigured()) return null;
  const post = postStatus(run);
  const sent = post.status === 'posted' || post.status === 'sending';
  const failed = post.status === 'failed' ? post : null;
  const refused = failed?.reason === 'name' ? (failed.name ?? null) : null;
  const ready = rivalsOn() && sendName() !== null;
  const mine = c.rivals?.mine ?? null;
  const set = mine ? c.book.tally(mine.id) : null;
  const send = () => void postRun(run, c.lastResult);
  const duel = async () => {
    if (!ready) {
      // The box is on by default, so what is missing is almost always the name: ask for it and put the cursor there.
      if (!rivalsOn()) setRivals(true);
      setNudged(true);
      refresh();
      if (typeof document !== 'undefined')
        setTimeout(
          () => document.querySelector<HTMLInputElement>('.rivals-opt input[type=text]')?.focus(),
          0,
        );
      return;
    }
    setBusy(true);
    const st = await postRun(run, c.lastResult);
    setBusy(false);
    if (st.status === 'posted') c.openRivals();
  };
  return (
    <div class="rivals-block">
      <button
        class="btn primary duel-cta"
        disabled={busy || (refused !== null && refused === sendName())}
        onClick={() => void duel()}
      >
        {DUEL_TITLE}
      </button>
      {!sent && (
        <RivalsOptIn
          refused={refused}
          nudged={nudged && !ready}
          onChange={(what) => {
            if (what === 'box' && rivalsOn() && sendName() !== null) send();
            refresh();
          }}
        />
      )}
      {failed?.reason === 'unreachable' && (
        <p class="warn">Could not reach the rivals. Press the button to try again.</p>
      )}
      {set && set.fought > 0 && (
        <p class="muted">
          You beat {set.beaten} of {set.fought} rival{set.fought === 1 ? '' : 's'}
          {mine && ` · Your rating ${mine.rating}`}
        </p>
      )}
    </div>
  );
}

export function Summary({ c }: { c: Controller }) {
  const run = c.run;
  if (!run) return null;
  const won = c.screen === 'victory';
  const last = run.history[run.history.length - 1];
  const kills = run.history.reduce((s, h) => s + h.kills, 0);
  const reason = last?.status === 'timeout' ? ' (timed out)' : '';
  return (
    <div class="screen summary">
      <h2>{won ? 'Victory!' : 'Your run has ended'}</h2>
      <p>
        {classDef(run.classId).name} · Level {run.build.level}
      </p>
      <p>{won ? 'The Unmaker has fallen.' : `Fell on map ${last?.map ?? run.map}${reason}.`}</p>
      <p class="muted">
        Maps cleared: {run.history.filter((h) => h.status === 'cleared').length}
        {run.history.some((h) => h.status === 'abandoned') &&
          ` · abandoned: ${run.history.filter((h) => h.status === 'abandoned').length}`}
        {run.history.some((h) => h.status === 'stop') &&
          ` · stops: ${run.history.filter((h) => h.status === 'stop').length}`}{' '}
        · Kills: {kills}
      </p>
      {!sameDifficulty(run.difficulty, DEFAULT) && (
        <p class="muted">Difficulty: {difficultyText(run.difficulty)}</p>
      )}
      <RivalsBlock c={c} run={run} />
      {!won && run.lastRecap && <Recap r={run.lastRecap} />}
      {c.lastResult?.report && <MapReportView r={c.lastResult.report} title="The last map" />}
      <div class="menu">
        <button
          class="btn primary"
          onClick={() => c.beginRun(run.classId, Math.floor(Math.random() * 0x7fffffff))}
        >
          New run as {classDef(run.classId).name}
        </button>
        <button class="btn" onClick={() => c.quit()}>
          Back to title
        </button>
      </div>
    </div>
  );
}
