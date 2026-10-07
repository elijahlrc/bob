import { useState } from 'preact/hooks';
import { itemBase } from '../data/bases';
import { ALL_GEMS } from '../data/gems';
import { triggerText, type TriggerDef } from '../data/triggers';
import { UNIQUES } from '../data/uniques';
import { UNIQUE_FLASKS } from '../data/uniqueFlasks';
import { modsText } from '../mods/text';
import type { Controller } from '../run/controller';
import { loadFound } from '../run/codex';
import { GemCard } from './GemCard';
import { gemCardData } from './gemText';

type Tab = 'gems' | 'uniques';

/** Every gem and unique in the game, searchable, with the ones this browser has found marked. */
export function Codex({ c }: { c: Controller }) {
  const [tab, setTab] = useState<Tab>('gems');
  const [q, setQ] = useState('');
  const [foundOnly, setFoundOnly] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const found = loadFound();
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
      <div class="codex-list">
        {tab === 'gems' &&
          gems.map((g) => (
            <div key={g.id} class="codex-row">
              <button class="codex-head" onClick={() => setOpen(open === g.id ? null : g.id)}>
                <span class={found.has(g.id) ? 'found' : 'muted'}>
                  {found.has(g.id) ? '✓' : '·'}
                </span>{' '}
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
