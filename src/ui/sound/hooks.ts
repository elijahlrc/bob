// What plays when (docs/AUDIO.md, "What plays when"). The interface's buttons are heard through one listener on the
// document; the moments of a run come from the controller's bus. Actions with a sound of their own call sfx() where
// they succeed or are refused, and that sound answers the tap in place of Press.
import { getTree, type TreeNode } from '../../data/tree';
import type { Controller } from '../../run/controller';
import type { RewardCard } from '../../run/run';
import type { SimEvent, World } from '../../sim/types';
import {
  duckMusic,
  installSoundEngine,
  setMusicIntensity,
  sfx,
  soundOpen,
  soundSince,
} from './engine';
import { SOUNDS, type SoundId } from './recipes';

/** A sound to play, with its variant. */
export type Cue = { id: SoundId; variant?: string };

/** How near (tiles) the boss of a boss map must come for its arrival to be heard. */
export const BOSS_NEAR = 9;

/**
 * The sounds a frame of a map makes (docs/AUDIO.md): the character levelling up or dying, a rare or unique dropping,
 * the map cleared, and the boss of a boss map coming near, once (`seen` remembers it for the map).
 */
export function mapCues(world: World, events: readonly SimEvent[], seen: { boss: boolean }): Cue[] {
  const me = world.sides[0]?.player;
  const cues: Cue[] = [];
  for (const e of events) {
    if (e.t === 'levelUp' && e.src === me?.id) cues.push({ id: 'levelUp' });
    else if (e.t === 'playerDied' && e.src === me?.id) cues.push({ id: 'death' });
    else if (e.t === 'cleared') cues.push({ id: 'cleared' });
    else if (e.t === 'drop') {
      const it = world.drops.find((d) => d.id === e.id)?.item;
      if (it?.kind === 'item' && (it.rarity === 'rare' || it.rarity === 'unique'))
        cues.push({ id: 'find', variant: it.rarity });
    }
  }
  if (!seen.boss && me && world.plan.endKind === 'boss') {
    const near = world.actors.some(
      (a) => a.alive && a.rarity === 'boss' && Math.hypot(a.x - me.x, a.y - me.y) <= BOSS_NEAR,
    );
    if (near) {
      seen.boss = true;
      cues.push({ id: 'boss' });
    }
  }
  return cues;
}

/** How near (tiles) a monster must be for the music to count it as a fight. */
export const FIGHT_NEAR = 8;

/**
 * The music's intensity for a frame of a map (the owner, 2026-10-28): 2 (boss) for a boss in sight, below half life, or
 * with every life flask short of a drink's charges; 1 (fight) while a monster is near; 0 (calm) on a quiet stretch.
 * The music itself rises at once and falls slowly, so this can change every frame.
 */
export function musicIntensity(world: World): number {
  const side = world.sides[0];
  const me = side?.player;
  if (!side || !me || !me.alive) return 0;
  let fight = false;
  for (const a of world.actors) {
    if (!a.alive || a.isPlayer || a.dummy || a.team === me.team) continue;
    const d = Math.hypot(a.x - me.x, a.y - me.y);
    if (a.rarity === 'boss' && d <= BOSS_NEAR) return 2;
    if (d <= FIGHT_NEAR) fight = true;
  }
  if (me.life < 0.5 * me.def.maxLife) return 2;
  const life = side.flasks.filter((x) => x.spec.life > 0);
  if (life.length && life.every((x) => x.charges < x.spec.perUse)) return 2;
  return fight ? 1 : 0;
}

let nodes: Map<number, TreeNode> | null = null;
/** The Passive sound's variant for an allocation: the biggest kind of node it took. */
export function passiveVariant(ids: readonly number[]): 'small' | 'notable' | 'keystone' {
  nodes ??= new Map(getTree().nodes.map((n) => [n.id, n]));
  const kinds = ids.map((id) => nodes!.get(id)?.kind);
  return kinds.includes('keystone') ? 'keystone' : kinds.includes('notable') ? 'notable' : 'small';
}

const announced = new WeakSet<object>();
/** The reward screen's best card is heard once (a Find for a rare or a unique), however often the screen is shown. */
export function rewardSound(offers: readonly RewardCard[]): void {
  if (!offers.length || announced.has(offers)) return;
  announced.add(offers);
  const has = (r: string) => offers.some((o) => o.kind === 'item' && o.rarity === r);
  if (has('unique')) sfx('find', 'unique');
  else if (has('rare')) sfx('find', 'rare');
}

/** Plays a passive allocation's sound, or Denied when nothing was taken. */
export function passiveSound(took: readonly number[] | undefined): void {
  if (took && took.length) sfx('passive', passiveVariant(took));
  else sfx('denied');
}

/** Showcase, the skill gallery and duels make no sound of their own in the first pass. */
const quiet = (c: Controller): boolean => !!(c.showcase || c.gallery || c.duel);

/**
 * A tapped button sounds after its own handler has run (this listens on the way back up), so an action that played
 * its own sound is not doubled by a Press. `data-sfx` on a button picks another sound, or "none" for silence.
 */
function onClick(e: MouseEvent): void {
  const el = (e.target as Element | null)?.closest?.(
    'button, [role="button"], [role="tab"]',
  ) as HTMLElement | null;
  if (!el || (el as HTMLButtonElement).disabled || el.getAttribute('aria-disabled') === 'true')
    return;
  const pick = el.dataset.sfx;
  // Asked for since the tap began: the action's own sound (a Begin, an Equip, a Denied) answered it.
  if (pick === 'none' || soundSince(e.timeStamp)) return;
  if (pick && pick in SOUNDS) sfx(pick as SoundId);
  else sfx(el.matches('.tabs .tab') ? 'page' : 'press');
}

/**
 * Most refusals in the game are disabled buttons (Take at a stop without the Bone Dust, Wear when the requirements are
 * not met, Take on a passive with too few points), and a disabled button gets no click. Where the browser reports
 * the pointer at all, the button under it is looked up and the refusal is heard.
 */
function onRelease(e: PointerEvent): void {
  const hit = document.elementFromPoint(e.clientX, e.clientY)?.closest('button');
  if (hit?.disabled && hit.dataset.sfx !== 'none') sfx('denied');
}

let installed = false;
export function installSound(c: Controller): void {
  if (installed || !soundOpen()) return;
  installed = true;
  installSoundEngine();
  document.addEventListener('click', onClick);
  window.addEventListener('pointerup', onRelease, true);
  const seen = { boss: false };
  c.bus.on('mapStart', () => {
    seen.boss = false;
    if (!quiet(c)) sfx('begin');
  });
  c.bus.on('ticked', ({ world, events }) => {
    // Showcase and the gallery stay calm; a duel is a fight, by the same rule as a map.
    const x = musicIntensity(world);
    setMusicIntensity(c.showcase || c.gallery ? 0 : c.duel ? Math.max(1, x) : x);
    if (quiet(c)) return;
    for (const q of mapCues(world, events, seen)) {
      sfx(q.id, q.variant as never);
      // A death dips the music under its sigh.
      if (q.id === 'death') duckMusic(4);
    }
  });
  c.bus.on('mapEnd', () => setMusicIntensity(0));
}
