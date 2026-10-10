import type { Character, SkillChoice } from '../calc/character';
import { rolesFor, takesWhen, type RotationEntry } from '../calc/strategy';
import {
  EVERY_CHOICES,
  LIFE_CHOICES,
  LIFE_FLASK_CHOICES,
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
import { moveSkill, resetStrategy, setStrategyOption, setTactic } from '../run/strategy';
import { describeEntry, mainsWarning } from './strategyText';

const f0 = (v: number) => Math.round(v).toLocaleString();
const pct = (v: number) => `${Math.round(v * 100)}%`;

const ROLE_HELP: Record<SkillRole, string> = {
  main: 'Used whenever no other skill is called for: the filler.',
  periodic: 'Used every so often: its own cooldown, or a pause you set.',
  keepUp: 'Kept going: a buff renewed as it ends, a curse or debuff kept on the target.',
  opener: 'Used once at the start of each fight, and once on each rare or boss.',
  emergency: 'Used when life falls below a threshold.',
  auto: "The skill's own judgement (shown below).",
  off: 'Never used.',
};

function Pick<T extends string | number>(p: {
  label: string;
  value: T;
  options: [T, string][];
  onChange: (v: T) => void;
  title?: string;
}) {
  return (
    <label class="sx-pick" title={p.title}>
      <span class="muted">{p.label}</span>
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
    </label>
  );
}

function SkillRow(p: {
  c: Controller;
  ch: Character;
  e: RotationEntry<SkillChoice>;
  i: number;
  list: number[];
}) {
  const { c, ch, e, i, list } = p;
  const choice = e.choice;
  const uid = choice.gemUid!;
  const roles = rolesFor(choice.skill);
  const set = (patch: Parameters<typeof setTactic>[2]) => c.act((r) => setTactic(r, uid, patch));
  const ownCooldown = choice.skill.cooldown !== undefined;
  const starred = ch.build.primaryGem === uid;
  return (
    <li class={'sx-skill' + (e.role === 'off' ? ' off' : '')}>
      <div class="sx-head">
        {list.length > 1 && <span class="sx-n">{i + 1}</span>}
        <b>{choice.skill.name}</b>
        <span class="muted sx-kind">
          {choice.skill.utility ? 'utility' : 'damage'}
          {starred ? ' · ★' : ''}
        </span>
        {list.length > 1 && (
          <span class="sx-move">
            <button
              class="btn small"
              aria-label={`Move ${choice.skill.name} up`}
              disabled={i === 0}
              onClick={() => c.act((r) => moveSkill(r, list, uid, -1))}
            >
              ▲
            </button>
            <button
              class="btn small"
              aria-label={`Move ${choice.skill.name} down`}
              disabled={i === list.length - 1}
              onClick={() => c.act((r) => moveSkill(r, list, uid, 1))}
            >
              ▼
            </button>
          </span>
        )}
      </div>
      <div class="sx-picks">
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
              [0, 'Usual pause'],
              ...EVERY_CHOICES.map((s): [number, string] => [s, `${s} s`]),
            ]}
            onChange={(v) => set({ every: v === 0 ? undefined : v })}
          />
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
            class="btn small sx-reset"
            title="Back to this skill's default role"
            onClick={() =>
              set({ role: undefined, when: undefined, every: undefined, life: undefined })
            }
          >
            Default
          </button>
        )}
      </div>
      <div class="muted sx-says">{describeEntry(ch, e)}</div>
    </li>
  );
}

function Group(p: {
  c: Controller;
  ch: Character;
  title: string;
  hint: string;
  entries: RotationEntry<SkillChoice>[];
  ordered: boolean;
}) {
  if (!p.entries.length) return null;
  const list = p.entries.map((e) => e.choice.gemUid!);
  return (
    <section class="sx-group">
      <h3>{p.title}</h3>
      <p class="muted hint">{p.hint}</p>
      <ol class="sx-list">
        {p.entries.map((e, i) => (
          <SkillRow key={e.choice.key} c={p.c} ch={p.ch} e={e} i={i} list={p.ordered ? list : []} />
        ))}
      </ol>
    </section>
  );
}

/**
 * The Strategy tab (DESIGN.md Appendix A, 2026-10-09): how the character mixes its skills and fights. Every skill has a role and a
 * condition with sensible defaults; the order says which skill is tried first. docs/PLAYER-AI.md explains the whole logic.
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
  const lifeFlask = s.lifeFlask ?? STRATEGY_DEFAULTS.lifeFlask;
  const utilityFlask = s.utilityFlask ?? STRATEGY_DEFAULTS.utilityFlask;
  const empty = ch.mains.length + ch.rotation.length + ch.unused.length === 0;
  return (
    <div class="sx">
      <div class="sx-top">
        {sc && (
          <div class="sx-dps">
            <span>
              Against a pack <b>{f0(sc.pack)}</b> DPS
            </span>
            <span>
              Against a boss <b>{f0(sc.boss)}</b> DPS
            </span>
          </div>
        )}
        {run.build.strategy && (
          <button class="btn small" onClick={() => c.act((r) => resetStrategy(r))}>
            Reset to defaults
          </button>
        )}
      </div>
      {empty && (
        <p class="muted">No active skills socketed: the character fights with its weapon.</p>
      )}
      <Group
        c={c}
        ch={ch}
        title="First, in this order"
        hint="Each decision, the character tries these from the top and uses the first whose moment has come and that it can use from where it stands."
        entries={ch.rotation}
        ordered
      />
      <Group
        c={c}
        ch={ch}
        title="Otherwise, the main skills"
        hint="When nothing above is called for, the first main skill that fits the fight. The character walks into its reach. With none it can use (a cooldown, no mana, an immune enemy), a ready periodic skill, then the weapon."
        entries={ch.mains}
        ordered
      />
      {warning && !empty && <div class="warn">{warning}</div>}
      <Group
        c={c}
        ch={ch}
        title="Not used"
        hint="Switched off. Give a skill a role to bring it back."
        entries={ch.unused}
        ordered={false}
      />
      <section class="sx-group">
        <h3>How it fights</h3>
        <div class="sx-options">
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
            options={(Object.keys(SPACING_NAMES) as Spacing[]).map((k) => [k, SPACING_NAMES[k]])}
            onChange={(v) => opt({ spacing: v === STRATEGY_DEFAULTS.spacing ? undefined : v })}
          />
          <Pick<number>
            label="Life flask below"
            value={lifeFlask}
            options={LIFE_FLASK_CHOICES.map((v): [number, string] => [v, `${pct(v)} life`])}
            onChange={(v) => opt({ lifeFlask: v === STRATEGY_DEFAULTS.lifeFlask ? undefined : v })}
          />
          <Pick<UtilityFlaskUse>
            label="Utility flasks for"
            value={utilityFlask}
            options={(Object.keys(UTILITY_FLASK_NAMES) as UtilityFlaskUse[]).map((k) => [
              k,
              UTILITY_FLASK_NAMES[k],
            ])}
            onChange={(v) =>
              opt({ utilityFlask: v === STRATEGY_DEFAULTS.utilityFlask ? undefined : v })
            }
          />
        </div>
        <ul class="muted sx-notes">
          <li>{TARGET_TEXT[target]}</li>
          <li>{SPACING_TEXT[spacing]}</li>
          <li>
            Life flasks are drunk below {pct(lifeFlask)} life; utility flasks{' '}
            {UTILITY_FLASK_TEXT[utilityFlask]}.
          </li>
        </ul>
      </section>
    </div>
  );
}

const TARGET_TEXT: Record<TargetPriority, string> = {
  nearest: 'Fights the nearest enemy, switching as others come nearer; nests and pylons first.',
  rares: 'Rares, champions and bosses count as 4 tiles nearer: it breaks off for them.',
  lowest: 'Finishes the enemy with the least of its life left first.',
  stick: 'Keeps its target until it falls or gets away, whatever comes nearer.',
};

const SPACING_TEXT: Record<Spacing, string> = {
  hold: 'A ranged character stands at the full range of its skill.',
  close:
    'A ranged character closes to 3.5 tiles: more hits for skills that fan out or burst near it.',
  kite: 'A ranged character stands at full range and steps back when an enemy comes within 3 tiles, if its target stays in reach.',
};

const UTILITY_FLASK_TEXT: Record<UtilityFlaskUse, string> = {
  rares: 'only with a rare or a boss near',
  packs: 'with a rare near or 5 or more enemies',
  always: 'in any fight',
};
