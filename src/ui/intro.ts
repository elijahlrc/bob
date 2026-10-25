import { loadPref, savePref } from './prefs';

/**
 * What a new player is shown once on this device (docs/NEWPLAYER.md, second pass), unlike the per-run tips (`Tip.tsx`): a
 * second run starts without them. "Show the tips again" clears them all.
 */
export const INTRO_IDS = ['map', 'run', 'tree', 'support'] as const;
export type IntroId = (typeof INTRO_IDS)[number];

export const introSeen = (id: IntroId): boolean => loadPref<boolean>(`intro.${id}`, false);
export const seeIntro = (id: IntroId): void => savePref(`intro.${id}`, true);
/** Whether any of them has been seen (the title offers to show them again). */
export const anyIntroSeen = (): boolean =>
  INTRO_IDS.some(introSeen) || loadPref<boolean>('skills.hintSeen', false);
export function resetIntros(): void {
  for (const id of INTRO_IDS) savePref(`intro.${id}`, false);
  // The Skills tab's note on sockets shows itself once the same way.
  savePref('skills.hintSeen', false);
}
