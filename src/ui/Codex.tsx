import { useState } from 'preact/hooks';
import { itemBase } from '../data/bases';
import { ALL_GEMS } from '../data/gems';
import { triggerText, type TriggerDef } from '../data/triggers';
import { UNIQUES } from '../data/uniques';
import { UNIQUE_FLASKS } from '../data/uniqueFlasks';
import { modsText } from '../mods/text';
import type { Controller } from '../run/controller';
import { GemCard } from './GemCard';
import {
  activeLook,
  auraLook,
  DELIVERIES,
  DELIVERY_LOOK,
  DELIVERY_NAME,
  ELEMENT_COLOR,
  ELEMENT_NAME,
  UTILITY_COLOR,
} from '../calc/skillLook';
import { gemCardData } from './gemText';

type Tab = 'gems' | 'uniques' | 'look';

const css = (c: number) => '#' + c.toString(16).padStart(6, '0');

/** The colour of a skill gem on the map, for a chip beside its name. */
function gemChip(g: (typeof ALL_GEMS)[number]): string | null {
  if (g.kind === 'active') return css(activeLook(g).color);
  if (g.kind === 'aura') return css(auraLook(g).color);
  return null;
}

/** Every gem and unique in the game, searchable, with the ones this browser has found marked. */
export function Codex({ c }: { c: Controller }) {
  const [tab, setTab] = useState<Tab>('gems');
  const [q, setQ] = useState('');
  const [foundOnly, setFoundOnly] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const found = c.found();
  const needle = q.trim().toLowerCase();

  const gems = ALL_GEMS.filter((g) => {
    if (foundOnly && !found.has(g.id)) return false;
    if (!needle) return true;
    const d = gemCardData(g, 20);
    return `${g.name} ${d.type} ${d.tags.join(' ')} ${d.description}`
      .toLowerCase()
      .includes(needle);
  }).sort((a, b) => a.name.localeCompare(b.name));

  const uniques = [...UNIQUES, ...UNIQUE_FLASKS]
    .filter((u) => {
      if (foundOnly && !found.has(u.id)) return false;
      if (!needle) return true;
      return `${u.name} ${u.flavour}`.toLowerCase().includes(needle);
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const foundGems = ALL_GEMS.filter((g) => found.has(g.id)).length;
  const foundUniques = [...UNIQUES, ...UNIQUE_FLASKS].filter((u) => found.has(u.id)).length;

  return (
    <div class="screen codex">
      <h1>Codex</h1>
      <p class="muted">
        Gems {foundGems} / {ALL_GEMS.length} found · Uniques {foundUniques} /{' '}
        {UNIQUES.length + UNIQUE_FLASKS.length} found
      </p>
      <div class="menu row">
        <button class={tab === 'gems' ? 'btn primary' : 'btn'} onClick={() => setTab('gems')}>
          Gems
        </button>
        <button class={tab === 'uniques' ? 'btn primary' : 'btn'} onClick={() => setTab('uniques')}>
          Uniques
        </button>
        <button class={tab === 'look' ? 'btn primary' : 'btn'} onClick={() => setTab('look')}>
          Skill looks
        </button>
        <input
          class="search"
          type="text"
          placeholder="Search"
          value={q}
          onInput={(e) => setQ((e.target as HTMLInputElement).value)}
        />
        <label class="muted">
          <input
            type="checkbox"
            checked={foundOnly}
            onChange={(e) => setFoundOnly((e.target as HTMLInputElement).checked)}
          />{' '}
          found only
        </label>
        <button class="btn" onClick={() => c.goTo('title')}>
          Back
        </button>
      </div>
      {tab === 'look' && (
        <div class="codex-list look-legend">
          <p class="muted">
            On the map, colour says what a skill does to the enemy, and shape says how it gets
            there. Attacks are sharp (crescents, streaks); spells are round (runes, rings, orbs);
            areas grow as rings; lasting zones stay on the ground; upkeep skills use their own
            colours.
          </p>
          <h3>Damage type</h3>
          <div class="look-row">
            {ELEMENT_COLOR.map((c, i) => (
              <span key={i} class="look-swatch">
                <span class="look-chip" style={{ background: css(c) }} /> {ELEMENT_NAME[i]}
              </span>
            ))}
          </div>
          <h3>Upkeep skills</h3>
          <div class="look-row">
            {(Object.keys(UTILITY_COLOR) as (keyof typeof UTILITY_COLOR)[]).map((k) => (
              <span key={k} class="look-swatch">
                <span class="look-chip" style={{ background: css(UTILITY_COLOR[k]) }} />{' '}
                {DELIVERY_NAME[k]}
              </span>
            ))}
          </div>
          <h3>Shapes</h3>
          {DELIVERIES.map((d) => (
            <div key={d} class="codex-row">
              <div class="look-shape">
                <strong>{DELIVERY_NAME[d]}</strong>
                <div class="muted">{DELIVERY_LOOK[d]}</div>
              </div>
            </div>
          ))}
          <p class="muted">
            Title screen, Skill gallery: watch any skill against training dummies.
          </p>
        </div>
      )}
      <div class="codex-list">
        {tab === 'gems' &&
          gems.map((g) => (
            <div key={g.id} class="codex-row">
              <button class="codex-head" onClick={() => setOpen(open === g.id ? null : g.id)}>
                <span class={found.has(g.id) ? 'found' : 'muted'}>
                  {found.has(g.id) ? '✓' : '·'}
                </span>{' '}
                {gemChip(g) && (
                  <span class="look-chip" style={{ background: gemChip(g) as string }} />
                )}
                {g.name} <span class="muted">{gemCardData(g, 20).type}</span>
              </button>
              {open === g.id && <GemCard gemId={g.id} level={20} />}
            </div>
          ))}
        {tab === 'uniques' &&
          uniques.map((u) => {
            const isFlask = u.baseId.startsWith('flask_');
            return (
              <div key={u.id} class="codex-row">
                <button class="codex-head" onClick={() => setOpen(open === u.id ? null : u.id)}>
                  <span class={found.has(u.id) ? 'found' : 'muted'}>
                    {found.has(u.id) ? '✓' : '·'}
                  </span>{' '}
                  {u.name}{' '}
                  <span class="muted">
                    {isFlask ? 'Flask' : itemBase(u.baseId).name} · level {u.level}
                  </span>
                </button>
                {open === u.id && (
                  <div class="item-card rarity-unique">
                    <div class="ic-name">{u.name}</div>
                    {modsText(
                      u.mods.map((m) => ({
                        stat: m.stat,
                        kind: m.kind,
                        value: m.max,
                        tags: m.tags,
                        damageTypes: m.damageTypes,
                      })),
                    ).map((l, i) => (
                      <div key={i} class="ic-mod explicit">
                        {l}
                      </div>
                    ))}
                    {((u as { triggers?: TriggerDef[] }).triggers ?? []).map((t, i) => (
                      <div key={`t${i}`} class="ic-mod explicit">
                        {triggerText(t)}
                      </div>
                    ))}
                    <div class="ic-base">{u.flavour}</div>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
