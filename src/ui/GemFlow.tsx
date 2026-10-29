import { useMemo } from 'preact/hooks';
import { Character } from '../calc/character';
import { BOSSES, bossForMap } from '../data/bosses';
import { gemDef } from '../data/gems';
import { affixText, mapAffixDef } from '../data/mapAffixes';
import { mapTypeDef } from '../data/mapTypes';
import { themeDef } from '../data/themes';
import type { Controller } from '../run/controller';
import { offersFor } from '../run/preview';
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
  onDismiss,
  box,
}: {
  c: Controller;
  ch: Character;
  taken: number | null;
  onSkills: () => void;
  /** Put the reminder about the gem just taken away. */
  onDismiss: () => void;
  /** A class for a wrapper drawn only when there is a line (the Items tab's band above the bag). */
  box?: string;
}) {
  const line = useCampGemLine(c, ch, taken, onSkills, onDismiss);
  return line && box ? <div class={box}>{line}</div> : line;
}

function useCampGemLine(
  c: Controller,
  ch: Character,
  taken: number | null,
  onSkills: () => void,
  onDismiss: () => void,
) {
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
  // Once the gem is socketed the reminder has done its work: nothing is left to say (the owner, 2026-10-28).
  if (taken === null || !where || where.at === 'worn') return null;
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
      <button class="btn small" aria-label="Dismiss" title="Dismiss" onClick={onDismiss}>
        ×
      </button>
    </div>
  );
}

/**
 * Start the map of offer `i` once the player has confirmed it, which says where it leads. With no skill the character can
 * use while one waits in the bag, that question is the confirmation (the path around the Skills tab: the map choice, a
 * reload that opens camp on it).
 */
export async function startGuarded(c: Controller, i: number): Promise<void> {
  const run = c.run;
  if (!run) return;
  const g = skillToSocket(run, new Character(run.build));
  const o = offersFor(run)[i];
  const boss = run.offers.length === 1 ? bossForMap(run.map) : null;
  const ok = await ask(
    g
      ? {
          title: 'Start without a skill?',
          body: `No usable skill is socketed: your character will only use its weapon's attack. ${gemDef(g.gemId).name} is in your bag.`,
          confirm: 'Start anyway',
          // Cancel has the focus: starting this way is the choice to make on purpose.
          danger: true,
        }
      : {
          title: boss ? `Face ${BOSSES[boss].name}?` : `Enter ${themeDef(o.themeId).name}?`,
          facts: [
            `Level ${o.areaLevel}`,
            ...(o.type !== 'plain' ? [mapTypeDef(o.type).name] : []),
            ...o.affixes.map((id) => affixText(mapAffixDef(id), o.areaLevel)),
          ],
          confirm: boss ? 'Face the boss' : 'Begin map',
        },
  );
  if (!ok || c.run !== run) return;
  c.startMap(i);
}

/** Take the Respite of offer `i` once the player has confirmed it. */
export async function restGuarded(c: Controller, i: number): Promise<void> {
  const run = c.run;
  if (!run) return;
  const ok = await ask({
    title: 'Rest at the Respite?',
    body: 'Refills life, mana, shield and flasks. The level passes.',
    confirm: 'Rest',
  });
  if (!ok || c.run !== run) return;
  c.startMap(i);
}
