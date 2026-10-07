import { hex } from '../data/monsterMarks';
import type { World } from '../sim/types';
import { skillSlots, type SkillSlot } from './skillStatus';

/** Seconds as small text: one decimal under ten seconds, whole seconds above. */
function secondsText(x: number): string {
  return x >= 10 ? String(Math.ceil(x)) : x.toFixed(1);
}

function Slot({ s }: { s: SkillSlot }) {
  // The dark sweep covers the share of the icon that is still to come (clockwise from the top).
  const cd = s.total > 0 ? Math.max(0, Math.min(100, (s.remaining / s.total) * 100)) : 0;
  const timed = (s.state === 'cooling' || s.state === 'active') && s.remaining > 0;
  return (
    <div
      class={`skill ${s.state} d-${s.look.delivery}`}
      style={{ '--c': hex(s.look.color), '--cd': cd.toFixed(1) }}
      title={s.detail}
    >
      <span class="skill-init">{s.look.initials}</span>
      {cd > 0 && <span class="skill-sweep" />}
      {timed && <span class="skill-time">{secondsText(s.remaining)}</span>}
      {s.badge && <span class="skill-badge">{s.badge}</span>}
    </div>
  );
}

/** Every equipped skill with its use and cooldown state (see skillStatus.ts for what each state means). */
export function SkillBar({ w }: { w: World }) {
  const slots = skillSlots(w);
  if (slots.length === 0) return null;
  return (
    <div class="skillbar">
      {slots.map((s) => (
        <Slot key={s.key} s={s} />
      ))}
    </div>
  );
}
