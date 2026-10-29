import type { ComponentChildren } from 'preact';
import type { Character, SkillChoice } from '../calc/character';
import { rolesFor, takesWhen, type RotationEntry } from '../calc/strategy';
import {
  ESCAPE_LIFE_CHOICES,
  EVERY_CHOICES,
  LIFE_CHOICES,
  FLASK_AT_CHOICES,
  flaskRules,
  ROLE_NAMES,
  SPACING_NAMES,
  STRATEGY_DEFAULTS,
  TARGET_NAMES,
  UTILITY_FLASK_NAMES,
  WHEN_NAMES,
  type SkillRole,
  type SkillWhen,
  type Spacing,
  type TargetPriority,
  type UtilityFlaskUse,
} from '../data/strategy';
import type { Controller } from '../run/controller';
import { flaskBase } from '../data/flasks';
import {
  moveSkill,
  resetStrategy,
  setFlaskRule,
  setStrategyOption,
  setTactic,
} from '../run/strategy';
import { DpsDetails } from './DpsDetails';
import { hoverInfo, infoProps } from './info';
import { entryNote, mainsWarning, usualPause } from './strategyText';

const f0 = (v: number) => Math.round(v).toLocaleString();
const pct = (v: number) => `${Math.round(v * 100)}%`;

const ROLE_HELP: Record<SkillRole, string> = {
  main: 'Used whenever no other skill is called for: the filler.',
  periodic: 'Used every so often: its own cooldown, or a pause you set.',
  keepUp: 'Kept going: a buff renewed as it ends, a curse or debuff kept on the target.',
  opener: 'Used once at the start of each fight, and once on each rare or boss.',
  emergency: 'Used when life falls below a threshold.',
  escape:
    'A way out: used when life falls below a threshold with an enemy near ("Low health"), or when 3 or more enemies are close ("Surrounded"); tick either or both. A blink goes to the safest spot, not toward the enemy.',
  auto: "The skill's own judgement (shown below).",
  off: 'Never used.',
};

/** A word with a tip: a dotted underline, the text on hover with a mouse and on a tap with a finger. */
function Tip({ text, children }: { text: string; children: ComponentChildren }) {
  return (
    <span class="st-tip" tabIndex={0} {...infoProps(text)}>
      {children}
    </span>
  );
}

/** A labelled menu: the label beside or above it, the menu on a painted plaque with a gold arrow. */
function Pick<T extends string | number>(p: {
  label: string;
  value: T;
  options: [T, string][];
  onChange: (v: T) => void;
  title?: string;
}) {
  return (
    <label class="st-ctl" {...hoverInfo(p.title)}>
      <span class="st-lbl">{p.label}</span>
      <span class="st-sel" data-paint="panel" data-thin>
        <select
          value={String(p.value)}
          onChange={(e) => {
            const raw = (e.target as HTMLSelectElement).value;
            const hit = p.options.find(([v]) => String(v) === raw);
            if (hit) p.onChange(hit[0]);
          }}
        >
          {p.options.map(([v, text]) => (
            <option key={String(v)} value={String(v)}>
              {text}
            </option>
          ))}
        </select>
      </span>
    </label>
  );
}

function SkillRow(p: {
  c: Controller;
  ch: Character;
  e: RotationEntry<SkillChoice>;
  i: number;
  list: number[];
  /** The medallion: its number in the order, a star for a lone main skill, none for a skill switched off. */
  mark: 'n' | 'star' | 'none';
}) {
  const { c, ch, e, i, list } = p;
  const choice = e.choice;
  const uid = choice.gemUid!;
  const roles = rolesFor(choice.skill);
  const set = (patch: Parameters<typeof setTactic>[2]) => c.act((r) => setTactic(r, uid, patch));
  const ownCooldown = choice.skill.cooldown !== undefined;
  const starred = ch.build.primaryGem === uid;
  const note = entryNote(ch, e);
  return (
    <li class={'st-skill' + (e.role === 'off' ? ' off' : '') + (p.mark === 'none' ? ' bare' : '')}>
      {p.mark === 'n' && (
        <span class="st-n" data-paint="medal" data-field="gold,5" data-medal="plain">
          {i + 1}
        </span>
      )}
      {p.mark === 'star' && (
        <span class="st-n st-lone" data-paint="medal" data-field="vermilion,4" data-medal="plain">
          ★
        </span>
      )}
      <div class="st-main">
        <div class="st-name">
          {choice.skill.name}
          {starred && p.mark !== 'star' && <span class="st-star"> ★</span>}{' '}
          {choice.skill.utility ? (
            <span class="st-kind">utility</span>
          ) : (
            <span class="st-dps" {...infoProps('Used on its own, all the time, against one enemy')}>
              {f0(ch.skillSheet(choice).totalDps)} DPS
            </span>
          )}
        </div>
        <div class="st-ctls">
          <Pick<SkillRole>
            label="Role"
            value={e.role}
            title={ROLE_HELP[e.role]}
            options={roles.map((r) => [r, ROLE_NAMES[r]])}
            onChange={(role) => set({ role })}
          />
          {takesWhen(e.role) && (
            <Pick<SkillWhen>
              label="When"
              value={e.when}
              options={(Object.keys(WHEN_NAMES) as SkillWhen[]).map((w) => [w, WHEN_NAMES[w]])}
              onChange={(when) => set({ when: when === 'any' ? undefined : when })}
            />
          )}
          {e.role === 'periodic' && !ownCooldown && (
            <Pick<number>
              label="Every"
              value={e.every ?? 0}
              options={[
                [0, `Usual pause (${usualPause(ch, choice)})`],
                ...EVERY_CHOICES.map((s): [number, string] => [s, `${s} s`]),
              ]}
              onChange={(v) => set({ every: v === 0 ? undefined : v })}
            />
          )}
          {e.role === 'escape' && (
            <>
              <label
                class="st-check"
                {...hoverInfo('Goes when life is low with an enemy within 5 tiles.')}
              >
                <input
                  type="checkbox"
                  checked={e.lowLife}
                  onChange={(ev) =>
                    set({ lowLife: (ev.target as HTMLInputElement).checked ? undefined : false })
                  }
                />
                <span>Low health</span>
              </label>
              {e.lowLife && (
                <Pick<number>
                  label="Below"
                  value={e.life}
                  options={ESCAPE_LIFE_CHOICES.map((v): [number, string] => [v, `${pct(v)} life`])}
                  onChange={(v) => set({ life: v })}
                />
              )}
              <label
                class="st-check"
                {...hoverInfo('Goes when 3 or more enemies are within 4 tiles, however healthy.')}
              >
                <input
                  type="checkbox"
                  checked={e.surrounded}
                  onChange={(ev) =>
                    set({
                      surrounded: (ev.target as HTMLInputElement).checked ? undefined : false,
                    })
                  }
                />
                <span>Surrounded</span>
              </label>
            </>
          )}
          {e.role === 'emergency' && (
            <Pick<number>
              label="Below"
              value={e.life}
              options={LIFE_CHOICES.map((v): [number, string] => [v, `${pct(v)} life`])}
              onChange={(v) => set({ life: v })}
            />
          )}
          {!e.isDefault && (
            <button
              class="btn small st-reset"
              {...hoverInfo("Back to this skill's default role")}
              onClick={() =>
                set({
                  role: undefined,
                  when: undefined,
                  every: undefined,
                  life: undefined,
                  lowLife: undefined,
                  surrounded: undefined,
                })
              }
            >
              Default
            </button>
          )}
        </div>
        {note && <div class="st-note">{note}</div>}
      </div>
      {list.length > 1 && (
        <div class="st-move">
          <button
            class="btn sq"
            aria-label={`Move ${choice.skill.name} up`}
            disabled={i === 0}
            onClick={() => c.act((r) => moveSkill(r, list, uid, -1))}
          >
            ▲
          </button>
          <button
            class="btn sq"
            aria-label={`Move ${choice.skill.name} down`}
            disabled={i === list.length - 1}
            onClick={() => c.act((r) => moveSkill(r, list, uid, 1))}
          >
            ▼
          </button>
        </div>
      )}
    </li>
  );
}

function Group(p: {
  c: Controller;
  ch: Character;
  title: string;
  lead: ComponentChildren;
  entries: RotationEntry<SkillChoice>[];
  ordered: boolean;
  /** A lone main skill wears a star instead of a number. */
  star?: boolean;
  children?: ComponentChildren;
}) {
  if (!p.entries.length) return null;
  const list = p.entries.map((e) => e.choice.gemUid!);
  const mark = !p.ordered ? 'none' : p.star && list.length === 1 ? 'star' : 'n';
  return (
    <section class="lf-panel st-group" data-paint="panel">
      <h4 class="lf-h">{p.title}</h4>
      <p class="st-lead">{p.lead}</p>
      <ol class="st-list">
        {p.entries.map((e, i) => (
          <SkillRow
            key={e.choice.key}
            c={p.c}
            ch={p.ch}
            e={e}
            i={i}
            list={p.ordered ? list : []}
            mark={mark}
          />
        ))}
      </ol>
      {p.children}
    </section>
  );
}

/**
 * The Strategy tab (DESIGN.md Appendix A, 2026-10-09): how the character mixes its skills and fights. Every skill has a role and a
 * condition with sensible defaults; the order says which skill is tried first. docs/PLAYER-AI.md explains the whole logic.
 * In Gold Leaf (docs/mockups/style/STYLE-GUIDE.md): the pack and boss DPS as medallions, each group a lapis panel, the
 * skills numbered in small gold medallions, the menus on plaques.
 */
export function Strategy({ c, ch }: { c: Controller; ch: Character }) {
  const run = c.run!;
  const s = run.build.strategy ?? {};
  const sheet = ch.sheet();
  const sc = sheet.scenarios;
  const warning = mainsWarning(ch);
  const opt = (patch: Parameters<typeof setStrategyOption>[1]) =>
    c.act((r) => setStrategyOption(r, patch));
  const target = s.target ?? STRATEGY_DEFAULTS.target;
  const spacing = s.spacing ?? STRATEGY_DEFAULTS.spacing;
  const empty = ch.mains.length + ch.rotation.length + ch.unused.length === 0;
  const first = (
    <Group
      c={c}
      ch={ch}
      title="First, in this order"
      lead={
        <>
          The first one whose moment has come{' '}
          <Tip text="Each decision, the character tries these from the top and uses the first whose moment has come and that it can use from where it stands.">
            is used
          </Tip>
          .
        </>
      }
      entries={ch.rotation}
      ordered
    />
  );
  return (
    <div class="st">
      <div class="st-top">
        {sc && (
          <div class="st-medals">
            <div class="st-medal" data-paint="medal" data-field="vermilion,4">
              <span>Against a pack</span>
              <b>{f0(sc.pack)}</b>
              <i class="st-plaque" data-paint="panel" data-thin>
                DPS
              </i>
            </div>
            <div class="st-medal" data-paint="medal" data-field="porphyry,4">
              <span>Against a boss</span>
              <b>{f0(sc.boss)}</b>
              <i class="st-plaque" data-paint="panel" data-thin>
                DPS
              </i>
            </div>
          </div>
        )}
        {run.build.strategy && (
          <button class="btn small st-resetall" onClick={() => c.act((r) => resetStrategy(r))}>
            Reset to defaults
          </button>
        )}
      </div>
      {empty && (
        <p class="st-empty" data-paint="panel" data-thin>
          No active skills socketed: the character fights with its weapon.
        </p>
      )}
      <div class={'st-cols' + (ch.rotation.length ? '' : ' one')}>
        {ch.rotation.length > 0 && (
          <div class="st-first">
            {first}
            {/* In two columns the belt fills the wider left one, under the rotation (the playtests found it squeezed). */}
            <FlaskBelt c={c} ch={ch} />
          </div>
        )}
        <div class="st-side">
          <Group
            c={c}
            ch={ch}
            title="Otherwise"
            lead={
              <>
                The first{' '}
                <Tip text="When nothing above is called for, the first main skill that fits the fight. The character walks into its reach. With none it can use (a cooldown, no mana, an immune enemy), a ready periodic skill, then the weapon.">
                  main skill
                </Tip>{' '}
                that fits the fight.
              </>
            }
            entries={ch.mains}
            ordered
            star
          />
          {warning && !empty && (
            <div class="st-warn" data-paint="panel" data-field="vermilion" data-thin>
              {warning}
            </div>
          )}
          <Group
            c={c}
            ch={ch}
            title="Not used"
            lead="Give a skill a role to bring it back."
            entries={ch.unused}
            ordered={false}
          />
          <section class="lf-panel st-group" data-paint="panel">
            <h4 class="lf-h">How it fights</h4>
            <div class="st-ctls two">
              <Pick<TargetPriority>
                label="Target"
                value={target}
                options={(Object.keys(TARGET_NAMES) as TargetPriority[]).map((k) => [
                  k,
                  TARGET_NAMES[k],
                ])}
                onChange={(v) => opt({ target: v === STRATEGY_DEFAULTS.target ? undefined : v })}
              />
              <Pick<Spacing>
                label="Spacing"
                value={spacing}
                options={(Object.keys(SPACING_NAMES) as Spacing[]).map((k) => [
                  k,
                  SPACING_NAMES[k],
                ])}
                onChange={(v) => opt({ spacing: v === STRATEGY_DEFAULTS.spacing ? undefined : v })}
              />
            </div>
            <ul class="st-says">
              <li>{TARGET_TEXT[target]}</li>
              <li>{SPACING_TEXT[spacing]}</li>
            </ul>
          </section>
          {ch.rotation.length === 0 && <FlaskBelt c={c} ch={ch} />}
        </div>
      </div>
      {!empty && <DpsDetails ch={ch} />}
    </div>
  );
}

const TARGET_TEXT: Record<TargetPriority, string> = {
  nearest: 'Fights the nearest enemy, switching as others come nearer; nests and pylons first.',
  rares: 'Rares, champions and bosses count as 4 tiles nearer: it breaks off for them.',
  lowest:
    'Goes for the enemy with the least life left, so small fry fall before a boss; nests and pylons first.',
  stick: 'Keeps its target until it falls or gets away, whatever comes nearer.',
};

const SPACING_TEXT: Record<Spacing, string> = {
  hold: 'A ranged character stands at the full range of its skill.',
  close:
    'A ranged character closes to 3.5 tiles: more hits for skills that fan out or burst near it.',
  kite: 'A ranged character stands at full range and steps back when an enemy comes within 3 tiles, if its target stays in reach.',
};

/** The belt's own settings (docs/ATTRITION.md): every worn flask in belt order, with what it is drunk for. */
function FlaskBelt({ c, ch }: { c: Controller; ch: Character }) {
  const run = c.run!;
  const belt = run.build.flasks;
  const kinds = belt.map((f) => (f ? flaskBase(f.baseId).kind : null));
  const rules = flaskRules(kinds, run.build.strategy);
  if (!belt.some(Boolean)) return null;
  return (
    <section class="lf-panel st-group" data-paint="panel">
      <h4 class="lf-h">Flasks</h4>
      <div class="st-ctls two">
        {belt.map((f, slot) => {
          if (!f) return null;
          const spec = ch.flasks.find((s) => s.uid === f.uid);
          const max = spec?.maxCharges ?? 0;
          const have = Math.floor(max * (run.vitals.flasks[f.uid] ?? 1));
          const label = `${slot + 1}. ${f.name} · ${have}/${max}`;
          const rule = rules[slot];
          if (kinds[slot] === 'utility')
            return (
              <Pick<UtilityFlaskUse>
                key={slot}
                label={label}
                value={rule.use!}
                options={(Object.keys(UTILITY_FLASK_NAMES) as UtilityFlaskUse[]).map((k) => [
                  k,
                  UTILITY_FLASK_NAMES[k],
                ])}
                onChange={(v) => c.act((r) => setFlaskRule(r, slot, { use: v }))}
              />
            );
          const mana = kinds[slot] === 'mana';
          const at = (mana ? rule.mana : rule.life)!;
          const choices = [...new Set([...FLASK_AT_CHOICES, at])].sort((a, b) => a - b);
          return (
            <Pick<number>
              key={slot}
              label={label}
              value={at}
              options={choices.map((v): [number, string] => [
                v,
                `Below ${pct(v)} ${mana ? 'mana' : 'life'}`,
              ])}
              onChange={(v) => c.act((r) => setFlaskRule(r, slot, { at: v }))}
            />
          );
        })}
      </div>
      <ul class="st-says">
        <li>
          Life and mana flasks drink in belt order: the first earliest, the last kept for the worst
          moment.
        </li>
      </ul>
    </section>
  );
}
