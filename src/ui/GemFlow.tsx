import { useMemo } from 'preact/hooks';
import { Character } from '../calc/character';
import { gemDef } from '../data/gems';
import type { Controller } from '../run/controller';
import { ask } from './Confirm';
import { canQuickSocket, gemWhere, quickSocket, skillToSocket } from '../run/inventoryOps';
import { sfx } from './sound/engine';

/**
 * The camp's line about gems (docs/NEWPLAYER.md N7). With no skill the character can use while one waits in the bag: a
 * warning with the button that sockets it. Otherwise, what became of the gem just taken from a pick: socketed (the run's
 * first skill seats itself), or in the bag with one button that sockets it, so a new skill never waits unseen.
 */
export function CampGems({
  c,
  ch,
  taken,
  onSkills,
  box,
}: {
  c: Controller;
  ch: Character;
  taken: number | null;
  onSkills: () => void;
  /** A class for a wrapper drawn only when there is a line (the Items tab's band above the bag). */
  box?: string;
}) {
  const line = useCampGemLine(c, ch, taken, onSkills);
  return line && box ? <div class={box}>{line}</div> : line;
}

function useCampGemLine(c: Controller, ch: Character, taken: number | null, onSkills: () => void) {
  const run = c.run!;
  const missing = useMemo(() => skillToSocket(run, ch), [ch, run.inventory]);
  const where = taken === null ? null : gemWhere(run, taken);
  const free = useMemo(
    () => taken !== null && where?.at === 'bag' && canQuickSocket(run, taken),
    [run.build, run.inventory, taken],
  );
  if (missing)
    return (
      <div class="sk-warn gem-taken" data-paint="panel" data-field="vermilion" data-thin>
        <span>No usable skill socketed: your character will only use its weapon's attack.</span>
        <button
          class="btn small primary"
          onClick={() => sfx(c.act((r) => quickSocket(r, missing.uid)) ? 'equip' : 'denied')}
        >
          Socket {gemDef(missing.gemId).name}
        </button>
      </div>
    );
  if (taken === null || !where) return null;
  if (where.at === 'worn') {
    const g = where.item.sockets.find((x) => x?.uid === taken)!;
    return (
      <div class="notice gem-taken" data-paint="panel" data-thin>
        {gemDef(g.gemId).name} is socketed in your {where.item.name}.
      </div>
    );
  }
  return (
    <div class="notice gem-taken" data-paint="panel" data-thin>
      <span>{gemDef(where.gem.gemId).name} is in your bag.</span>
      {free ? (
        <button
          class="btn small primary"
          onClick={() => sfx(c.act((r) => quickSocket(r, taken)) ? 'equip' : 'denied')}
        >
          Socket it
        </button>
      ) : (
        <button class="btn small" onClick={onSkills}>
          Skills
        </button>
      )}
    </div>
  );
}

/**
 * Start the map of offer `i`, asking first when the character has no skill it can use and one waits in the bag (the path
 * around the Skills tab: the map choice, a reload that opens camp on it).
 */
export async function startGuarded(c: Controller, i: number): Promise<void> {
  const run = c.run;
  if (!run) return;
  const g = skillToSocket(run, new Character(run.build));
  if (g) {
    const ok = await ask({
      title: 'Start without a skill?',
      body: `No usable skill is socketed: your character will only use its weapon's attack. ${gemDef(g.gemId).name} is in your bag.`,
      confirm: 'Start anyway',
      // Cancel has the focus: starting this way is the choice to make on purpose.
      danger: true,
    });
    if (!ok || c.run !== run) return;
  }
  c.startMap(i);
}
