/**
 * The spirit ledger (docs/SPIRIT.md 4.1): one row per mapped gem saying whether it keeps the reason to use it in the reference
 * game, what is missing, and which milestone of the plan finishes it. Rows start from the audit (docs/AUDIT-GEMS.md); a
 * milestone updates the rows of the gems it repairs.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { COVERAGE_DIR } from '../coverage/reference';

export type Verdict = 'faithful' | 'drifted' | 'gutted';
export const MILESTONES = [
  'S1',
  'S2',
  'S3',
  'S4',
  'S5',
  'S6',
  'S7',
  'S8',
  'S9',
  'S10',
  'S11',
  'S12',
  'S13',
] as const;
export type Milestone = (typeof MILESTONES)[number];

export type Spec = {
  /** The wiki page read at its 2020-03-12 revision, or null. */
  page: string | null;
  /** confirmed: the audit's account held; corrected: it changed; not-in-3.9: the gem came later; unverified: no source read. */
  status: 'confirmed' | 'corrected' | 'not-in-3.9' | 'unverified';
  /** What the 3.9 gem does, mechanic by mechanic, each line tagged [wiki], [pob] or [memory]. */
  lines: string[];
  /** What the check changed, in a sentence or two. */
  check: string;
  /** A question for the user, if Bob cannot sensibly do what the gem does. */
  decision?: string;
};

export type LedgerRow = {
  /** The reference gem this is an analog of. */
  ref: string;
  name: string;
  kind: 'active' | 'support' | 'aura' | 'hex';
  verdict: Verdict;
  confidence: 'high' | 'medium' | 'low';
  /** The part of the plan that finishes the gem (null when it is faithful). */
  milestone: Milestone | null;
  /** The engine primitives still missing (empty when faithful). */
  missing: string[];
  /** The audit's account, for continuity. */
  audit: { poe: string; bob: string; repair: string };
  spec?: Spec;
  /** A person or a test has checked the verdict. */
  verified: boolean;
  /** A documented adaptation or divergence that the user has accepted: the gem is not a gap. */
  accepted?: string;
  /** What a run of the gem must visibly do (docs/SPIRIT.md 4.3), checked by the parity smoke. */
  effects?: string[];
};

export type Ledger = { version: 1; gems: Record<string, LedgerRow> };

export const LEDGER_PATH = resolve(COVERAGE_DIR, 'spirit.json');

export function loadLedger(): Ledger {
  return JSON.parse(readFileSync(LEDGER_PATH, 'utf8')) as Ledger;
}

export function saveLedger(l: Ledger): void {
  const gems: Record<string, LedgerRow> = {};
  for (const id of Object.keys(l.gems).sort()) gems[id] = l.gems[id];
  writeFileSync(LEDGER_PATH, JSON.stringify({ version: 1, gems }, null, 1) + '\n');
}

/** Problems with a ledger against the mapped gems; an empty list means it is sound. */
export function validateLedger(l: Ledger, mapped: string[]): string[] {
  const problems: string[] = [];
  const ids = new Set(Object.keys(l.gems));
  for (const id of mapped) if (!ids.has(id)) problems.push(`${id}: mapped gem has no ledger row`);
  for (const id of ids)
    if (!mapped.includes(id)) problems.push(`${id}: ledger row for an unmapped gem`);
  for (const [id, r] of Object.entries(l.gems)) {
    if (r.verdict === 'faithful' && r.missing.length > 0)
      problems.push(`${id}: faithful but lists missing primitives`);
    if (r.verdict !== 'faithful' && r.milestone === null && r.accepted === undefined)
      problems.push(`${id}: ${r.verdict} with no milestone and no accepted divergence`);
    if (r.verdict === 'faithful' && r.milestone !== null)
      problems.push(`${id}: faithful but assigned to ${r.milestone}`);
  }
  return problems;
}

/** Counts by verdict, and by milestone for the gems still to do. */
export function summarise(l: Ledger): {
  byVerdict: Record<Verdict, number>;
  byMilestone: Record<string, { open: number; gutted: number }>;
} {
  const byVerdict: Record<Verdict, number> = { faithful: 0, drifted: 0, gutted: 0 };
  const byMilestone: Record<string, { open: number; gutted: number }> = {};
  for (const r of Object.values(l.gems)) {
    byVerdict[r.verdict]++;
    if (r.verdict === 'faithful' || r.accepted !== undefined) continue;
    const m = (byMilestone[r.milestone ?? '-'] ??= { open: 0, gutted: 0 });
    m.open++;
    if (r.verdict === 'gutted') m.gutted++;
  }
  return { byVerdict, byMilestone };
}
