import { DebugPanel } from './Debug';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { Character } from '../calc/character';
import { classDef } from '../data/classes';
import type { EquipSlot } from '../data/types';
import { affixText, mapAffixDef, rewardText } from '../data/mapAffixes';
import { flaskBase } from '../data/flasks';
import { densityDef, densityFor, type DensityId } from '../data/density';
import { mapTypeDef } from '../data/mapTypes';
import { themeDef } from '../data/themes';
import { offersFor } from '../run/preview';
import { xpToNext } from '../data/xpTable';
import { resistPenaltyForMap } from '../gen/mapPlan';
import type { Controller } from '../run/controller';
import { chalkAdd, chalkOptions, chalkRemove } from '../run/craft';
import { passivePoints, type RunState } from '../run/run';
import { markSeen, unseenItems } from '../run/found';
import { ask } from './Confirm';
import { infoProps } from './info';
import { Items } from './Items';
import { MapReportView } from './MapReport';
import { OfferInfo, OfferTable } from './OfferInfo';
import { BossAhead, BossCard } from './BossCard';
import { BOSSES, bossForMap } from '../data/bosses';
import type { OfferPreview } from '../run/preview';
import { Reward } from './Reward';
import { Sheet } from './Sheet';
import { CRAFTING_OPEN } from '../data/constants';
import { Workbench } from './Workbench';
import { Skills } from './Skills';
import { Strategy } from './Strategy';
import { StopEmblem, StopScreen } from './Stop';
import { reprieveDef } from '../data/reprieves';
import { Satchel } from './Satchel';
import { Tip } from './Tip';
import { stopDef } from '../data/stops';
import { TreeView } from './TreeView';
import { UpdateNotice } from './UpdateNotice';
import { UiScalePicker } from './UiScalePicker';

type Tab = 'tree' | 'sheet' | 'skills' | 'strategy' | 'items' | 'workbench' | 'report' | 'next';

/**
 * The walk through the camp after a map (docs/STREAMLINE.md S3): the Next button steps through these, so a player who
 * changes nothing can review the new items, the skills and any passive points, and reach the map choice, by clicking in
 * one place. A tab off the walk goes straight to the map choice.
 */
const WALK: Tab[] = ['items', 'skills', 'tree', 'next'];
const WALK_NAME: Partial<Record<Tab, string>> = {
  items: 'Items',
  skills: 'Skills',
  tree: 'Passive tree',
};

/** The step after `tab` on the walk. The passive tree is a step only while there are points to spend. */
function nextStep(tab: Tab, points: number): Tab {
  const at = WALK.indexOf(tab);
  if (at < 0) return 'next';
  return WALK.slice(at + 1).find((t) => t !== 'tree' || points > 0) ?? 'next';
}

/**
 * A boss map's offer (docs/BOSSES.md 10): the one way on, presented as a level apart from all the others: a wide arched
 * niche with a vermilion plaque hung over its arch, the boss's name and portrait, a short description, then the map that
 * leads to it.
 */
function BossOffer({ c, o }: { c: Controller; o: OfferPreview }) {
  const run = c.run!;
  const id = bossForMap(run.map)!;
  const boss = BOSSES[id];
  const name = boss.name[0].toUpperCase() + boss.name.slice(1);
  const t = themeDef(o.themeId);
  return (
    <div class="boss-offer-wrap">
      <div class="boss-offer" data-paint="panel" data-arch data-pearls data-foot>
        <div class="boss-offer-banner" data-paint="panel" data-thin data-field="vermilion">
          Boss · map {run.map}
          {id === 'unmaker' ? ' · the last' : ''}
        </div>
        <div class="boss-offer-name">{name}</div>
        {c.portrait && <img class="boss-portrait" src={c.portrait(boss.type)} alt={name} />}
        <BossCard boss={boss} />
        <div
          class="boss-offer-way"
          {...infoProps(`${name} waits alone in an arena past its last room.`)}
        >
          <strong>{t.name}</strong>, level {o.areaLevel}
        </div>
        <OfferTable o={o} />
        {o.affixes.map((aid) => {
          const a = mapAffixDef(aid);
          return (
            <div key={aid} class="affix">
              {affixText(a, o.areaLevel)} <span class="muted">({rewardText(a, o.areaLevel)})</span>
            </div>
          );
        })}
        <button class="btn primary boss-go" onClick={() => c.startMap(0)}>
          Face {boss.name}
        </button>
      </div>
      {(run.currency.chalk ?? 0) > 0 && <Chalk c={c} offer={0} />}
    </div>
  );
}

/** Wayfinder's Chalk on an offered map: add one of three affixes, or remove one (EXPANSION 8.2). */
function Chalk({ c, offer }: { c: Controller; offer: number }) {
  const run = c.run!;
  const have = run.offers[offer].affixes;
  const level = run.offers[offer].areaLevel;
  const chalk = run.currency.chalk ?? 0;
  return (
    <div class="chalk">
      <div class="chalk-count">Wayfinder's Chalk × {chalk}</div>
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
      {...infoProps('What you carry into the next map. Camp restores a little life and mana.')}
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
              // The bottle the map's HUD shows, its glass emptied to the charges carried over.
              <div key={f!.uid} class="flask" data-st="ready" title={`${f!.name}: ${fill}%`}>
                <div
                  class="flask-bottle"
                  data-paint="bottle"
                  data-liquid={flaskBase(f!.baseId).kind}
                  data-fill="1"
                />
                {fill < 100 && (
                  <div class="flask-glass" data-nopaint>
                    <div class="flask-empty" style={{ height: `${100 - fill}%` }} />
                  </div>
                )}
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
  // Back from a map, the camp opens on what the map dropped (with the reward pick on top), or on the next step of the
  // walk when it dropped nothing. A camp entered from the title opens on the map choice (docs/STREAMLINE.md S2).
  const fromMap = !!run && c.lastResult !== null;
  const [hasDrops] = useState(() => {
    const drops = new Set(run?.lastDrops ?? []);
    return fromMap && run!.inventory.some((x) => drops.has(x.uid));
  });
  const [tab, setTabState] = useState<Tab>(() => {
    if (!run || !fromMap) return 'next';
    if (run.reward || hasDrops) return 'items';
    return nextStep('items', passivePoints(run));
  });
  // The Items tab shows the last map's drops the first time it is opened after a map (when it dropped anything), then
  // the player's own view again.
  const [showDrops, setShowDrops] = useState(hasDrops);
  // The slot whose sockets the Skills tab scrolls to (the Items tab's "Edit gems"), for that visit only.
  const [gemSlot, setGemSlot] = useState<EquipSlot | null>(null);
  const setTab = (t: Tab) => {
    if (tab === 'items' && t !== 'items') setShowDrops(false);
    if (tab === 'skills' && t !== 'skills') setGemSlot(null);
    setTabState(t);
  };
  // An item the Items tab sends to the Workbench ("Craft…") and back ("Show in Items"); `n` makes a repeat count.
  const [focus, setFocus] = useState<{ uid: number; n: number; to: 'items' | 'workbench' } | null>(
    null,
  );
  const goTo = (to: 'items' | 'workbench', uid: number) => {
    if (to === 'workbench' && !CRAFTING_OPEN) return;
    setFocus((f) => ({ uid, n: (f?.n ?? 0) + 1, to }));
    setTab(to);
  };
  // The next map is a tab of its own at every width, with a bar at the bottom.
  const tabsRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    tabsRef.current
      ?.querySelector('.tab.on')
      ?.scrollIntoView({ inline: 'nearest', block: 'nearest' });
    // A tab opens at its top, not where the last one was scrolled to.
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
  }, [tab]);
  // The stop whose screen is open in the Next map tab (docs/WAYSIDE.md 5); nothing of it is saved until it is taken.
  const [stopSlot, setStopSlot] = useState<number | null>(null);
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
  // New gems are counted on the Skills tab until it has been opened (docs/STREAMLINE.md S4).
  const newGems = run ? unseenItems(run).filter((x) => x.kind === 'gem') : [];
  useEffect(() => {
    if (tab === 'skills' && newGems.length)
      c.act((r) =>
        markSeen(
          r,
          newGems.map((x) => x.uid),
        ),
      );
  }, [tab, newGems.length]);
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
      <UpdateNotice />
      <div class="camp-head">
        <h2>Camp</h2>
        <div class="camp-who">
          {classDef(run.classId).name} · Level {run.build.level}
        </div>
        <div class="xp">
          <div
            class="xp-fill"
            style={{ width: `${Math.min(100, (run.xp / xpToNext(run.build.level)) * 100)}%` }}
          />
        </div>
        <div class="nextmap" data-paint="panel" data-thin>
          Next: map {run.map} of 100
        </div>
      </div>
      <Arriving run={run} />
      {run.offers.some((o) => o.kind === 'stop') && <Tip c={c} id="stop" />}
      <Satchel c={c} />
      <BossAhead map={run.map} />
      {last && (last.status === 'cleared' || last.status === 'abandoned') && (
        <div class="camp-last" data-paint="panel" data-thin>
          Last map{last.status === 'abandoned' ? ' (abandoned)' : ''}: {last.time.toFixed(0)} s ·{' '}
          {last.kills} kills
          {(last.reprieves ?? []).map(
            (id) =>
              ` · ${reprieveDef(id).name} ${reprieveDef(id).family === 'retreat' ? 'pulled you out' : 'saved you'}`,
          )}
        </div>
      )}
      {run.reward && <Reward c={c} />}
      {pts > 0 && (
        <div class="notice" data-paint="panel" data-thin>
          You have {pts} unspent passive point{pts > 1 ? 's' : ''}.
        </div>
      )}
      {bossForMap(run.map) && run.offers.length === 1 ? (
        <BossOffer c={c} o={offersFor(run)[0]} />
      ) : (
        <div class="theme-choice">
          {offersFor(run).map((o, i) => {
            if (o.kind === 'respite')
              return (
                <div key={o.id} class="theme-wrap">
                  <button
                    class="btn theme respite"
                    data-paint="panel"
                    data-field="green"
                    data-arch
                    data-pearls
                    data-foot
                    onClick={() => c.startMap(i)}
                  >
                    <div class="theme-name">Respite</div>
                    <div class="muted">Level {o.areaLevel}</div>
                    <div class="affix">Life, mana, shield and flasks refilled.</div>
                  </button>
                </div>
              );
            if (o.kind === 'stop') {
              const d = stopDef(o.stop!);
              return (
                <div key={o.id} class="theme-wrap">
                  <button
                    class="btn theme stop-card"
                    data-paint="panel"
                    data-field="porphyry"
                    data-arch
                    data-pearls
                    data-foot
                    onClick={() => setStopSlot(i)}
                  >
                    <div class="theme-name">{d.name}</div>
                    <div class="muted">Level {o.areaLevel}</div>
                    <StopEmblem stop={o.stop!} />
                    <div class="affix">{d.text}</div>
                  </button>
                </div>
              );
            }
            const t = themeDef(o.themeId);
            return (
              <div key={o.id} class="theme-wrap">
                <button
                  class="btn theme"
                  data-paint="panel"
                  data-arch
                  data-pearls
                  data-foot
                  onClick={() => c.startMap(i)}
                >
                  <div class="theme-name">{t.name}</div>
                  <div class="muted">
                    Level {o.areaLevel}
                    {o.offset !== 0 && ` (${o.offset > 0 ? '+' : '−'}${Math.abs(o.offset)})`}
                  </div>
                  {o.type !== 'plain' && (
                    <div class="affix kind">
                      <strong {...infoProps(mapTypeDef(o.type).text)}>
                        {mapTypeDef(o.type).name}
                      </strong>
                    </div>
                  )}
                  <Density d={densityFor(run.seed, o.id, run.map, o.type)} />
                  <OfferTable o={o} />
                  <OfferInfo o={o} boss={bossForMap(run.map) ?? undefined} more />
                  {o.affixes.map((id) => {
                    const a = mapAffixDef(id);
                    return (
                      <div key={id} class="affix">
                        {affixText(a, o.areaLevel)}{' '}
                        <span class="muted">({rewardText(a, o.areaLevel)})</span>
                      </div>
                    );
                  })}
                </button>
                {(run.currency.chalk ?? 0) > 0 && o.kind === 'map' && <Chalk c={c} offer={i} />}
              </div>
            );
          })}
        </div>
      )}
      <div class="camp-foot">
        <DebugPanel c={c} />
        {c.saveFailed && (
          <div class="warn">
            The browser has no room to save this run. Delete an old save on the title screen to make
            room.
          </div>
        )}
        <UiScalePicker />
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
  const after = nextStep(shown, pts);
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
            Skills{newGems.length ? ` (${newGems.length} new)` : ''}
          </button>
          <button
            class={'tab' + (shown === 'strategy' ? ' on' : '')}
            onClick={() => setTab('strategy')}
          >
            Strategy
          </button>
          {CRAFTING_OPEN && (
            <button
              class={'tab' + (shown === 'workbench' ? ' on' : '')}
              onClick={() => setTab('workbench')}
            >
              Workbench{run.pendingCraft ? ' (pick a result)' : ''}
            </button>
          )}
          {last?.report && (
            <button
              class={'tab' + (shown === 'report' ? ' on' : '')}
              onClick={() => setTab('report')}
              title="What each skill dealt and what hurt you on the map you just played."
            >
              Last map
            </button>
          )}
          <button class={'tab' + (shown === 'next' ? ' on' : '')} onClick={() => setTab('next')}>
            Next map{run.reward ? ' (reward)' : ''}
          </button>
        </div>
        <div class="tabs-trim" aria-hidden="true" />
        <div class="tab-body" ref={bodyRef}>
          {shown === 'tree' && <TreeView c={c} />}
          {shown === 'sheet' && <Sheet s={sheet} ch={ch} />}
          {shown === 'skills' && <Skills c={c} ch={ch} focusSlot={gemSlot} />}
          {shown === 'strategy' && <Strategy c={c} ch={ch} />}
          {shown === 'items' && run.reward && (
            <div class="items-reward">
              <Reward c={c} />
            </div>
          )}
          {shown === 'items' && (
            <Items
              c={c}
              focus={focus?.to === 'items' ? focus : null}
              onCraft={(uid) => goTo('workbench', uid)}
              onEditGems={(slot) => {
                setGemSlot(slot);
                setTab('skills');
              }}
              startView={showDrops ? 'last' : undefined}
            />
          )}
          {shown === 'workbench' && CRAFTING_OPEN && (
            <Workbench
              c={c}
              focus={focus?.to === 'workbench' ? focus : null}
              onShowInItems={(uid) => goTo('items', uid)}
            />
          )}
          {shown === 'report' && last?.report && (
            <MapReportView
              r={last.report}
              title={`Map ${run.history[run.history.length - 1]?.map ?? ''} · ${last.status}`}
            />
          )}
          {shown === 'next' && (
            <div class="camp-next camp-side-body">
              {stopSlot !== null && run.offers[stopSlot]?.kind === 'stop' ? (
                <StopScreen c={c} slot={stopSlot} onBack={() => setStopSlot(null)} />
              ) : (
                side
              )}
            </div>
          )}
        </div>
        <div class="camp-bar">
          <span class="camp-bar-who">
            {classDef(run.classId).name} · Level {run.build.level}
          </span>
          {CRAFTING_OPEN && run.pendingCraft && shown !== 'workbench' && (
            <button
              class="btn small"
              onClick={() => goTo('workbench', run.pendingCraft!.itemUid)}
              title="A reforge is waiting for you to pick a result."
            >
              Pick the reforge
            </button>
          )}
          <button class="btn small" disabled={!c.canUndo} onClick={() => c.undo()}>
            ↶ Undo
          </button>
          {shown !== 'next' && (
            <button class="btn small primary" onClick={() => setTab(after)}>
              {after === 'next' ? 'Next map' : `Next: ${WALK_NAME[after]}`} ▸
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** The style of a map's monsters, when it is not the usual one (docs/MAP-VARIETY.md 3.3). */
function Density({ d }: { d: DensityId }) {
  if (d === 'standard') return null;
  const def = densityDef(d);
  return (
    <div class="affix kind">
      <strong {...infoProps(def.text)}>{def.name}</strong>
    </div>
  );
}
