import { CLASSES } from '../data/classes';
import { gemDef } from '../data/gems';
import type { Controller } from '../run/controller';

export function hex(c: number): string {
  return '#' + c.toString(16).padStart(6, '0');
}

export function ClassSelect({ c }: { c: Controller }) {
  return (
    <div class="screen">
      <h2>Choose a class</h2>
      <div class="class-grid">
        {CLASSES.map((cls) => (
          <button
            key={cls.id}
            class="class-card"
            style={{ borderColor: hex(cls.color) }}
            onClick={() => c.startRun(cls.id, Math.floor(Math.random() * 0x7fffffff))}
          >
            <div class="class-name" style={{ color: hex(cls.color) }}>
              {cls.name}
            </div>
            <div class="class-attrs">
              Str {cls.attrs.str} · Dex {cls.attrs.dex} · Int {cls.attrs.int}
            </div>
            <div class="class-skill">
              {gemDef(cls.startSkill).name} + {gemDef(cls.startSupport).name}
            </div>
          </button>
        ))}
      </div>
      <button class="btn" onClick={() => c.goTo('title')}>
        Back
      </button>
    </div>
  );
}
