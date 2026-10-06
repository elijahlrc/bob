import { useEffect, useMemo, useState } from 'preact/hooks';
import { Character } from '../calc/character';
import { classDef } from '../data/classes';
import { themeDef } from '../data/themes';
import { xpToNext } from '../data/xpTable';
import { resistPenaltyForMap } from '../gen/mapPlan';
import type { Controller } from '../run/controller';
import { passivePoints } from '../run/run';
import { Sheet } from './Sheet';
import { Skills } from './Skills';
import { TreeView } from './TreeView';

const COUNTDOWN = 2;
type Tab = 'tree' | 'sheet' | 'skills';

export function Camp({ c }: { c: Controller }) {
  const run = c.run;
  const [tab, setTab] = useState<Tab>('sheet');
  const [left, setLeft] = useState<number | null>(null);
  const auto = !!run && run.autoContinue && c.canAutoContinue();
  useEffect(() => {
    if (!auto) {
      setLeft(null);
      return;
    }
    setLeft(COUNTDOWN);
    const start = performance.now();
    const id = setInterval(() => {
      const remain = COUNTDOWN - (performance.now() - start) / 1000;
      if (remain <= 0) {
        clearInterval(id);
        c.startMap(0);
      } else setLeft(remain);
    }, 100);
    return () => clearInterval(id);
  }, [auto, run?.map]);
  const ch = useMemo(
    () =>
      run
        ? new Character(run.build, {
            areaLevel: run.map,
            resistPenalty: resistPenaltyForMap(run.map),
          })
        : null,
    [run?.build],
  );
  if (!run || !ch) return null;
  const sheet = ch.sheet();
  const last = c.lastResult;
  const pts = passivePoints(run);
  return (
    <div class="screen camp">
      <div class="camp-main">
        <div class="tabs">
          <button class={'tab' + (tab === 'sheet' ? ' on' : '')} onClick={() => setTab('sheet')}>
            Character
          </button>
          <button class={'tab' + (tab === 'tree' ? ' on' : '')} onClick={() => setTab('tree')}>
            Passive tree{pts > 0 ? ` (${pts})` : ''}
          </button>
          <button class={'tab' + (tab === 'skills' ? ' on' : '')} onClick={() => setTab('skills')}>
            Skills
          </button>
        </div>
        <div class="tab-body">
          {tab === 'tree' && <TreeView c={c} />}
          {tab === 'sheet' && <Sheet s={sheet} />}
          {tab === 'skills' && <Skills c={c} ch={ch} />}
        </div>
      </div>
      <div class="camp-side">
        <h2>Camp</h2>
        <div>
          {classDef(run.classId).name} · Level {run.build.level}
        </div>
        <div class="xp">
          <div
            class="xp-fill"
            style={{ width: `${Math.min(100, (run.xp / xpToNext(run.build.level)) * 100)}%` }}
          />
        </div>
        <div class="muted">Next: map {run.map} of 100</div>
        {last && last.status === 'cleared' && (
          <div class="muted">
            Last map: {last.time.toFixed(0)} s · {last.kills} kills
          </div>
        )}
        {pts > 0 && (
          <div class="notice">
            You have {pts} unspent passive point{pts > 1 ? 's' : ''}.
          </div>
        )}
        <div class="theme-choice">
          {run.nextThemes.map((id, i) => {
            const t = themeDef(id);
            return (
              <button key={id} class="btn theme" onClick={() => c.startMap(i)}>
                <div class="theme-name">{t.name}</div>
                <div class="muted">{t.bonusText}</div>
              </button>
            );
          })}
        </div>
        <label class="muted">
          <input
            type="checkbox"
            checked={run.autoContinue}
            onChange={(e) => c.setAutoContinue((e.target as HTMLInputElement).checked)}
          />{' '}
          Auto-continue
          {left !== null && ` — ${themeDef(run.nextThemes[0]).name} in ${left.toFixed(1)} s`}
        </label>
        <button class="btn" onClick={() => c.quit()}>
          Abandon run
        </button>
      </div>
    </div>
  );
}
