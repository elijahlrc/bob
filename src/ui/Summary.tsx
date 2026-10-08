import { classDef } from '../data/classes';
import { DEFAULT, difficultyText, sameDifficulty } from '../data/difficulty';
import { DAMAGE_TYPES } from '../mods/types';
import type { Controller } from '../run/controller';
import type { DeathRecap } from '../sim/types';
import { FACTION_NAMES, MONSTER_TYPES, type MonsterTypeId } from '../data/monsters';
import { TYPE_BLURBS } from '../data/monsterInfo';
import { themeDef } from '../data/themes';
import { themeInfo } from '../run/themeInfo';
import type { MapTypeId } from '../data/mapTypes';

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
      <p>
        {won ? 'The Ossuary Regent has fallen.' : `Fell on map ${last?.map ?? run.map}${reason}.`}
      </p>
      <p class="muted">
        Maps cleared: {run.history.filter((h) => h.status === 'cleared').length}
        {run.history.some((h) => h.status === 'abandoned') &&
          ` · abandoned: ${run.history.filter((h) => h.status === 'abandoned').length}`}{' '}
        · Kills: {kills}
      </p>
      {!sameDifficulty(run.difficulty, DEFAULT) && (
        <p class="muted">Difficulty: {difficultyText(run.difficulty)}</p>
      )}
      {!won && run.lastRecap && <Recap r={run.lastRecap} />}
      <button class="btn primary" onClick={() => c.quit()}>
        Back to title
      </button>
    </div>
  );
}
