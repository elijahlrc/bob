import { DebugPanel } from './Debug';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { Character } from '../calc/character';
import { classDef } from '../data/classes';
import { affixText, mapAffixDef, rewardText } from '../data/mapAffixes';
import { flaskBase } from '../data/flasks';
import { mapTypeDef } from '../data/mapTypes';
import { themeDef } from '../data/themes';
import { offersFor, type Verdict } from '../run/preview';
import { xpToNext } from '../data/xpTable';
import { resistPenaltyForMap } from '../gen/mapPlan';
import type { Controller } from '../run/controller';
import { chalkAdd, chalkOptions, chalkRemove } from '../run/craft';
import { passivePoints, type RunState } from '../run/run';
import { unseenItems } from '../run/found';
import { ask, confirmOpen } from './Confirm';
import { useViewport } from './device';
import { infoProps } from './info';
import { Items } from './Items';
import { OfferInfo, OfferTable } from './OfferInfo';
import { Reward } from './Reward';
import { Sheet } from './Sheet';
import { Workbench } from './Workbench';
import { Skills } from './Skills';
import { Strategy } from './Strategy';
import { TreeView } from './TreeView';

const COUNTDOWN = 2;
const TIER_TEXT = { gentle: 'Gentle', even: 'Even', fierce: 'Fierce' } as const;
const VERDICT_TEXT: Record<Verdict, string> = {
  comfortable: 'Comfortable',
  close: 'Close',
  dangerous: 'Dangerous',
};
type Tab = 'tree' | 'sheet' | 'skills' | 'strategy' | 'items' | 'workbench' | 'next';

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
  const v = run.vitals;
  const flasks = run.build.flasks.filter((f) => f !== null);
  const pct = (f: number) => Math.round(Math.max(0, Math.min(1, f)) * 100);
  const gauge = (kind: 'life' | 'mana', label: string, f: number) => (
    <div class="bar arriving-bar" title={`${label} ${pct(f)}%`}>
      <div class={`bar-fill arriving-${kind}`} style={{ width: `${pct(f)}%` }} />
      <span class="bar-text">
        {label} {pct(f)}%
      </span>
    </div>
  );
  return (
    <div
      class="arriving"
      aria-label={`Arriving with life ${pct(v.life)}%, mana ${pct(v.mana)}%`}
      {...infoProps(
        'What you carry into the next map. Camp restores what ten seconds of sitting still would. Flasks refill only by killing.',
      )}
    >
      <div class="arriving-bars">
        {gauge('life', 'Life', v.life)}
        {gauge('mana', 'Mana', v.mana)}
      </div>
      {flasks.length > 0 && (
        <div class="arriving-flasks">
          {flasks.map((f) => {
            const fill = pct(v.flasks[f!.uid] ?? 1);
            return (
              <div key={f!.uid} class="flask" title={`${f!.name}: ${fill}%`}>
                <div class="flask-neck" />
                <div class="flask-body">
                  <div
                    class={'flask-fill ' + flaskBase(f!.baseId).kind}
                    style={{ height: `${fill}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function Camp({ c }: { c: Controller }) {
  const run = c.run;
  const [tab, setTab] = useState<Tab>('sheet');
  // An item the Items tab sends to the Workbench ("Craft…") and back ("Show in Items"); `n` makes a repeat count.
  const [focus, setFocus] = useState<{ uid: number; n: number; to: 'items' | 'workbench' } | null>(
    null,
  );
  const goTo = (to: 'items' | 'workbench', uid: number) => {
    setFocus((f) => ({ uid, n: (f?.n ?? 0) + 1, to }));
    setTab(to);
  };
  // The next map is a tab of its own at every width, with a bar at the bottom. On a narrow screen the offer cards also
  // fold their detail lines until asked for (docs/MOBILE.md 3.3).
  const narrow = useViewport().layout !== 'desktop';
  const tabsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    tabsRef.current
      ?.querySelector('.tab.on')
      ?.scrollIntoView({ inline: 'nearest', block: 'nearest' });
  }, [tab]);
  // On a narrow screen the types, rules and gate line of an offer card stay folded until asked for.
  const [opened, setOpened] = useState<Record<string, boolean>>({});
  const [left, setLeft] = useState<number | null>(null);
  const blocker = run ? c.autoBlocker() : null;
  const auto = !!run && run.autoContinue && blocker === null;
  useEffect(() => {
    if (!auto) {
      setLeft(null);
      return;
    }
    setLeft(COUNTDOWN);
    let start = performance.now();
    const id = setInterval(() => {
      // A question to answer holds the countdown: the map must not begin under it.
      if (confirmOpen()) {
        start = performance.now();
        setLeft(COUNTDOWN);
        return;
      }
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
            difficulty: run.difficulty,
            resistPenalty: resistPenaltyForMap(run.map),
          })
        : null,
    [run?.build, run?.difficulty],
  );
  if (!run || !ch) return null;
  const sheet = ch.sheet();
  const last = c.lastResult;
  const pts = passivePoints(run);
  const newCount = unseenItems(run).length;
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
                <OfferTable o={o} />
                <OfferInfo o={o} gate={run.map % 10 === 0} more={!narrow || !!opened[o.id]} />
                {o.tier && (
                  <div
                    class={`tier ${o.tier}`}
                    title="This map is drawn harder or easier than the average for its level (the variance setting). It is fixed for the run."
                  >
                    {TIER_TEXT[o.tier]}
                  </div>
                )}
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
              {narrow && (
                <button
                  class="btn small"
                  onClick={() => setOpened({ ...opened, [o.id]: !opened[o.id] })}
                >
                  {opened[o.id] ? 'Fewer details' : 'Details'}
                </button>
              )}
              {(run.currency.chalk ?? 0) > 0 && o.kind === 'map' && <Chalk c={c} offer={i} />}
            </div>
          );
        })}
      </div>
      <div class="camp-foot">
        <DebugPanel c={c} />
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
        <button
          class="btn danger"
          onClick={async () => {
            const ok = await ask({
              title: 'Abandon this run?',
              body: 'The run ends here and the character is lost.',
              confirm: 'Abandon the run',
              danger: true,
            });
            if (ok) c.abandon();
          }}
        >
          Abandon run
        </button>
      </div>
    </>
  );
  const shown: Tab = tab;
  return (
    <div class="screen camp tabbed">
      <div class="camp-main">
        <div class="tabs" ref={tabsRef}>
          <button class={'tab' + (shown === 'sheet' ? ' on' : '')} onClick={() => setTab('sheet')}>
            Character
          </button>
          <button class={'tab' + (shown === 'tree' ? ' on' : '')} onClick={() => setTab('tree')}>
            Passive tree{pts > 0 ? ` (${pts})` : ''}
          </button>
          <button class={'tab' + (shown === 'items' ? ' on' : '')} onClick={() => setTab('items')}>
            Items{newCount ? ` (${newCount} new)` : ''}
          </button>
          <button
            class={'tab' + (shown === 'skills' ? ' on' : '')}
            onClick={() => setTab('skills')}
          >
            Skills
          </button>
          <button
            class={'tab' + (shown === 'strategy' ? ' on' : '')}
            onClick={() => setTab('strategy')}
          >
            Strategy
          </button>
          <button
            class={'tab' + (shown === 'workbench' ? ' on' : '')}
            onClick={() => setTab('workbench')}
          >
            Workbench{run.pendingCraft ? ' (pick a result)' : ''}
          </button>
          <button class={'tab' + (shown === 'next' ? ' on' : '')} onClick={() => setTab('next')}>
            Next map{run.reward ? ' (reward)' : ''}
          </button>
        </div>
        <div class="tab-body">
          {shown === 'tree' && <TreeView c={c} />}
          {shown === 'sheet' && <Sheet s={sheet} />}
          {shown === 'skills' && <Skills c={c} ch={ch} />}
          {shown === 'strategy' && <Strategy c={c} ch={ch} />}
          {shown === 'items' && (
            <Items
              c={c}
              focus={focus?.to === 'items' ? focus : null}
              onCraft={(uid) => goTo('workbench', uid)}
            />
          )}
          {shown === 'workbench' && (
            <Workbench
              c={c}
              focus={focus?.to === 'workbench' ? focus : null}
              onShowInItems={(uid) => goTo('items', uid)}
            />
          )}
          {shown === 'next' && <div class="camp-next camp-side-body">{side}</div>}
        </div>
        <div class="camp-bar">
          <span class="camp-bar-who">
            {classDef(run.classId).name} · Level {run.build.level}
          </span>
          {run.pendingCraft && shown !== 'workbench' && (
            <button
              class="btn small"
              onClick={() => goTo('workbench', run.pendingCraft!.itemUid)}
              title="A reforge is waiting for you to pick a result."
            >
              Pick the reforge
            </button>
          )}
          {left !== null && shown !== 'next' && (
            <span class="muted">Auto-continue: next map in {left.toFixed(1)} s</span>
          )}
          <button class="btn small" disabled={!c.canUndo} onClick={() => c.undo()}>
            ↶ Undo
          </button>
          {shown !== 'next' && (
            <button class="btn small primary" onClick={() => setTab('next')}>
              Next map ▸
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
