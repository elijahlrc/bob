import type { MonsterTypeId } from './monsters';

/**
 * Phases and rhythms (docs/ROSTER.md 6.5). Champions have always had a script by life; any type may now list phases: a
 * thing it does once, when its life falls to a share. A type may also strike in a rhythm instead of at a steady pace. The
 * text here is what the inspect card says.
 */
export type PhaseSpec = {
  /** The share of its life at which it happens (0.5 is half). */
  at: number;
  do: 'enrage' | 'flee' | 'split';
  /** Flee: seconds it runs for. */
  seconds?: number;
  /** Split: what it breaks into, and how many. */
  into?: MonsterTypeId;
  count?: number;
};

export function phaseText(p: PhaseSpec): string {
  const at = Math.round(p.at * 100);
  switch (p.do) {
    case 'enrage':
      return `Enrages at ${at}% life: faster, harder-hitting and red.`;
    case 'flee':
      return `Runs from you for ${p.seconds ?? 4} s when its life falls to ${at}%.`;
    case 'split':
      return `Breaks into ${p.count ?? 3} ${p.into ?? 'smaller'} at ${at}% life.`;
  }
}

/** One sentence per phase a type has. */
export function phaseTexts(list: PhaseSpec[] | undefined): string[] {
  return (list ?? []).map(phaseText);
}

/** How a rhythm reads: the beats are multiples of its attack time, with a damage that follows them. */
export function patternText(pattern: number[] | undefined): string | null {
  if (!pattern || pattern.length < 2) return null;
  const word = (k: number) => (k < 0.8 ? 'quick' : k > 1.25 ? 'heavy' : 'steady');
  return `Strikes in a rhythm: ${pattern.map(word).join(', ')}, and again.`;
}

/** The enraged speed and damage multiples. */
export const ENRAGE_SPEED = 1.3;
export const ENRAGE_DAMAGE = 1.25;
