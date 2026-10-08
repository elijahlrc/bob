import { useEffect, useMemo, useState } from 'preact/hooks';
import { Character } from '../calc/character';
import { classDef } from '../data/classes';
import { mapAffixDef, rewardText } from '../data/mapAffixes';
import { themeDef } from '../data/themes';
import { offersFor } from '../run/preview';
import { xpToNext } from '../data/xpTable';
import { resistPenaltyForMap } from '../gen/mapPlan';
import type { Controller } from '../run/controller';
import { chalkAdd, chalkOptions, chalkRemove } from '../run/craft';
import { passivePoints } from '../run/run';
import { Items } from './Items';
import { Reward } from './Reward';
import { Sheet } from './Sheet';
import { Workbench } from './Workbench';
import { Skills } from './Skills';
import { TreeView } from './TreeView';

const COUNTDOWN = 2;
type Tab = 'tree' | 'sheet' | 'skills' | 'items' | 'workbench';

/** Wayfinder's Chalk on an offered map: add one of three affixes, or remove one (EXPANSION 8.2). */
function Chalk({ c, offer }: { c: Controller; offer: number }) {
  const run = c.run!;
  const have = run.offers[offer].affixes;
  const chalk = run.currency.chalk ?? 0;
  return (
    <div class="chalk">
      <div class="muted">Wayfinder's Chalk × {chalk}</div>
      {chalkOptions(run, offer).map((id) => (
        <button
          key={id}
          class="btn small"
          title={`Add: ${mapAffixDef(id).text} (${rewardText(mapAffixDef(id))})`}
          onClick={() => c.craft((r) => chalkAdd(r, offer, id))}
        >
          + {mapAffixDef(id).name}
        </button>
      ))}
      {chalk >= 2 &&
        have.map((id) => (
          <button
            key={id}
            class="btn small danger"
            title={`Remove: ${mapAffixDef(id).text} (costs 2)`}
            onClick={() => c.craft((r) => chalkRemove(r, offer, id))}
          >
            − {mapAffixDef(id).name}
          </button>
        ))}
    </div>
  );
}

export function Camp({ c }: { c: Controller }) {
  const run = c.run;
  const [tab, setTab] = useState<Tab>('sheet');
  const [left, setLeft] = useState<number | null>(null);
  const blocker = run ? c.autoBlocker() : null;
  const auto = !!run && run.autoContinue && blocker === null;
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
  // Ctrl+Z undoes the last camp change (equip, socket, passive point, reward pick ...).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key.toLowerCase() === 'z' &&
        tag !== 'INPUT' &&
        tag !== 'SELECT'
      ) {
        e.preventDefault();
        c.undo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [c]);
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
          <button class={'tab' + (tab === 'items' ? ' on' : '')} onClick={() => setTab('items')}>
            Items{run.newLoot.length ? ` (${run.newLoot.length} new)` : ''}
          </button>
          <button class={'tab' + (tab === 'skills' ? ' on' : '')} onClick={() => setTab('skills')}>
            Skills
          </button>
          <button
            class={'tab' + (tab === 'workbench' ? ' on' : '')}
            onClick={() => setTab('workbench')}
          >
            Workbench{run.pendingCraft ? ' (pick a result)' : ''}
          </button>
        </div>
        <div class="tab-body">
          {tab === 'tree' && <TreeView c={c} />}
          {tab === 'sheet' && <Sheet s={sheet} />}
          {tab === 'skills' && <Skills c={c} ch={ch} />}
          {tab === 'items' && <Items c={c} />}
          {tab === 'workbench' && <Workbench c={c} />}
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
        {run.reward && <Reward c={c} />}
        {pts > 0 && (
          <div class="notice">
            You have {pts} unspent passive point{pts > 1 ? 's' : ''}.
          </div>
        )}
        <div class="theme-choice">
          {offersFor(run).map((o, i) => {
            const t = themeDef(o.themeId);
            return (
              <div key={o.id} class="theme-wrap">
                <button class="btn theme" onClick={() => c.startMap(i)}>
                  <div class="theme-name">{t.name}</div>
                  <div class="muted">{t.bonusText}</div>
                  {o.affixes.map((id) => {
                    const a = mapAffixDef(id);
                    return (
                      <div key={id} class="affix">
                        {a.text} <span class="muted">({rewardText(a)})</span>
                      </div>
                    );
                  })}
                  <div class="threat">
                    For you: DPS ×{o.dps.toFixed(2)} · effective HP ×{o.ehp.toFixed(2)}
                  </div>
                </button>
                {(run.currency.chalk ?? 0) > 0 && <Chalk c={c} offer={i} />}
              </div>
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
          {left !== null && ` — ${themeDef(run.offers[0].themeId).name} in ${left.toFixed(1)} s`}
          {run.autoContinue && blocker && <div class="warn">Paused: {blocker}</div>}
        </label>
        <button class="btn" onClick={() => c.quit()}>
          Save and quit
        </button>
        <button class="btn danger" onClick={() => confirm('Abandon this run?') && c.abandon()}>
          Abandon run
        </button>
      </div>
    </div>
  );
}
