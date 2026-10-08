import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { Character } from '../calc/character';
import { classDef } from '../data/classes';
import { affixText, mapAffixDef, rewardText } from '../data/mapAffixes';
import { mapTypeDef } from '../data/mapTypes';
import { themeDef } from '../data/themes';
import { offersFor, type Verdict } from '../run/preview';
import { xpToNext } from '../data/xpTable';
import { resistPenaltyForMap } from '../gen/mapPlan';
import type { Controller } from '../run/controller';
import { chalkAdd, chalkOptions, chalkRemove } from '../run/craft';
import { passivePoints, type RunState } from '../run/run';
import { useViewport } from './device';
import { infoProps } from './info';
import { Items } from './Items';
import { Reward } from './Reward';
import { Sheet } from './Sheet';
import { Workbench } from './Workbench';
import { Skills } from './Skills';
import { TreeView } from './TreeView';

const COUNTDOWN = 2;
const VERDICT_TEXT: Record<Verdict, string> = {
  comfortable: 'Comfortable',
  close: 'Close',
  dangerous: 'Dangerous',
};
type Tab = 'tree' | 'sheet' | 'skills' | 'items' | 'workbench' | 'next';

/** Wayfinder's Chalk on an offered map: add one of three affixes, or remove one (EXPANSION 8.2). */
function Chalk({ c, offer }: { c: Controller; offer: number }) {
  const run = c.run!;
  const have = run.offers[offer].affixes;
  const level = run.offers[offer].areaLevel;
  const chalk = run.currency.chalk ?? 0;
  return (
    <div class="chalk">
      <div class="muted">Wayfinder's Chalk × {chalk}</div>
      {chalkOptions(run, offer).map((id) => (
        <button
          key={id}
          class="btn small"
          title={`Add: ${affixText(mapAffixDef(id), level)} (${rewardText(mapAffixDef(id), level)})`}
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
            title={`Remove: ${affixText(mapAffixDef(id), level)} (costs 2)`}
            onClick={() => c.craft((r) => chalkRemove(r, offer, id))}
          >
            − {mapAffixDef(id).name}
          </button>
        ))}
    </div>
  );
}

/** What the character carries into the next map (docs/MAPS.md section 8). */
function Arriving({ run }: { run: RunState }) {
  const pct = (f: number) => `${Math.round(f * 100)}%`;
  const v = run.vitals;
  const flasks = run.build.flasks.filter((f) => f !== null);
  return (
    <div
      class="muted arriving"
      {...infoProps(
        'Camp restores what ten seconds of sitting still would. Flasks refill only by killing.',
      )}
    >
      Arriving with life {pct(v.life)} · mana {pct(v.mana)}
      {flasks.length > 0 && ` · flasks ${flasks.map((f) => pct(v.flasks[f!.uid] ?? 1)).join(' ')}`}
    </div>
  );
}

export function Camp({ c }: { c: Controller }) {
  const run = c.run;
  const [tab, setTab] = useState<Tab>('sheet');
  // Below the desktop width the side column becomes a tab, with a bar at the bottom (docs/MOBILE.md 3.3).
  const compact = useViewport().layout !== 'desktop';
  const tabsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    tabsRef.current
      ?.querySelector('.tab.on')
      ?.scrollIntoView({ inline: 'nearest', block: 'nearest' });
  }, [tab, compact]);
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
  const side = (
    <>
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
      <Arriving run={run} />
      {last && (last.status === 'cleared' || last.status === 'abandoned') && (
        <div class="muted">
          Last map{last.status === 'abandoned' ? ' (abandoned, no clear rewards)' : ''}:{' '}
          {last.time.toFixed(0)} s · {last.kills} kills
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
          if (o.kind === 'respite')
            return (
              <div key={o.id} class="theme-wrap">
                <button
                  class="btn theme respite"
                  title="No map is played: the level passes with no loot, XP or clear rewards."
                  onClick={() => c.startMap(i)}
                >
                  <div class="theme-name">Respite</div>
                  <div class="muted">Level {o.areaLevel} passes</div>
                  <div class="affix">Life, mana, energy shield and flasks are made full again.</div>
                  <div class="threat">No loot, no XP, no clear rewards.</div>
                </button>
              </div>
            );
          const t = themeDef(o.themeId);
          return (
            <div key={o.id} class="theme-wrap">
              <button class="btn theme" onClick={() => c.startMap(i)}>
                <div class="theme-name">{t.name}</div>
                <div class="muted">
                  Level {o.areaLevel}
                  {o.offset !== 0 && ` (${o.offset > 0 ? '+' : '−'}${Math.abs(o.offset)})`}
                </div>
                {o.type !== 'plain' && (
                  <div class="affix" title={mapTypeDef(o.type).text}>
                    <strong>{mapTypeDef(o.type).name}</strong>: {mapTypeDef(o.type).text}
                  </div>
                )}
                <div class="muted">{t.bonusText}</div>
                {o.affixes.map((id) => {
                  const a = mapAffixDef(id);
                  return (
                    <div key={id} class="affix">
                      {affixText(a, o.areaLevel)}{' '}
                      <span class="muted">({rewardText(a, o.areaLevel)})</span>
                    </div>
                  );
                })}
                <div class="threat">
                  For you: DPS ×{o.dps.toFixed(2)} · effective HP ×{o.ehp.toFixed(2)}
                </div>
                {o.verdict && (
                  <div
                    class={`verdict ${o.verdict}`}
                    title={`How you would fare here next to a plain map at its level, counting the life you arrive with (${Math.round((o.ratio ?? 0) * 100)}%). A rough guide, not a promise.`}
                  >
                    {VERDICT_TEXT[o.verdict]}
                  </div>
                )}
              </button>
              {(run.currency.chalk ?? 0) > 0 && o.kind === 'map' && <Chalk c={c} offer={i} />}
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
    </>
  );
  const shown: Tab = compact || tab !== 'next' ? tab : 'sheet';
  return (
    <div class={'screen camp' + (compact ? ' compact' : '')}>
      <div class="camp-main">
        <div class="tabs" ref={tabsRef}>
          <button class={'tab' + (shown === 'sheet' ? ' on' : '')} onClick={() => setTab('sheet')}>
            Character
          </button>
          <button class={'tab' + (shown === 'tree' ? ' on' : '')} onClick={() => setTab('tree')}>
            Passive tree{pts > 0 ? ` (${pts})` : ''}
          </button>
          <button class={'tab' + (shown === 'items' ? ' on' : '')} onClick={() => setTab('items')}>
            Items{run.newLoot.length ? ` (${run.newLoot.length} new)` : ''}
          </button>
          <button
            class={'tab' + (shown === 'skills' ? ' on' : '')}
            onClick={() => setTab('skills')}
          >
            Skills
          </button>
          <button
            class={'tab' + (shown === 'workbench' ? ' on' : '')}
            onClick={() => setTab('workbench')}
          >
            Workbench{run.pendingCraft ? ' (pick a result)' : ''}
          </button>
          {compact && (
            <button class={'tab' + (shown === 'next' ? ' on' : '')} onClick={() => setTab('next')}>
              Next map{run.reward ? ' (reward)' : ''}
            </button>
          )}
        </div>
        <div class="tab-body">
          {shown === 'tree' && <TreeView c={c} />}
          {shown === 'sheet' && <Sheet s={sheet} />}
          {shown === 'skills' && <Skills c={c} ch={ch} />}
          {shown === 'items' && <Items c={c} />}
          {shown === 'workbench' && <Workbench c={c} />}
          {shown === 'next' && <div class="camp-next camp-side-body">{side}</div>}
        </div>
        {compact && (
          <div class="camp-bar">
            <span class="camp-bar-who">
              {classDef(run.classId).name} · Level {run.build.level}
            </span>
            <button class="btn small" disabled={!c.canUndo} onClick={() => c.undo()}>
              ↶ Undo
            </button>
            {shown !== 'next' && (
              <button class="btn small primary" onClick={() => setTab('next')}>
                Next map ▸
              </button>
            )}
          </div>
        )}
      </div>
      {!compact && <div class="camp-side">{side}</div>}
    </div>
  );
}
