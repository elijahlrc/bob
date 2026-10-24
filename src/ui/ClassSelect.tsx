import { CLASSES } from '../data/classes';
import { itemBase } from '../data/bases';
import type { Controller } from '../run/controller';

export function hex(c: number): string {
  return '#' + c.toString(16).padStart(6, '0');
}

/** A new run: each class an arched lapis niche, its name in the arch. */
export function ClassSelect({ c }: { c: Controller }) {
  const sep = <i class="pay-sep" data-paint="sep" />;
  return (
    <div class="screen class-select">
      <h2>Choose a class</h2>
      <div class="class-grid">
        {CLASSES.map((cls) => (
          <button
            key={cls.id}
            class="class-card"
            data-paint="panel"
            data-arch
            data-pearls
            data-foot
            onClick={() => c.beginRun(cls.id, Math.floor(Math.random() * 0x7fffffff))}
          >
            <div class="class-name">{cls.name}</div>
            <div class="class-style">{cls.style}</div>
            <div class="class-attrs">
              <span>
                Str <b>{cls.attrs.str}</b>
              </span>
              {sep}
              <span>
                Dex <b>{cls.attrs.dex}</b>
              </span>
              {sep}
              <span>
                Int <b>{cls.attrs.int}</b>
              </span>
            </div>
            <div class="class-skill">{itemBase(cls.startWeapons[0]).name}</div>
          </button>
        ))}
      </div>
      <button class="btn" onClick={() => c.goTo('title')}>
        Back
      </button>
    </div>
  );
}
