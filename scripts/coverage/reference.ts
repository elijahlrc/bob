import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Reference } from './fetch-reference';

export const COVERAGE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../../docs/coverage');

export function loadReference(): Reference {
  return JSON.parse(
    readFileSync(resolve(COVERAGE_DIR, 'reference-3.9.0.json'), 'utf8'),
  ) as Reference;
}

/** Normalises a name for comparison: case, diacritics, curly quotes and spacing do not matter. */
export function norm(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Like `norm`, and also ignores a leading "The" (the wiki lists some uniques that way). Exact otherwise: the active
 * gem "Barrage" and "Barrage Support" are different gems.
 */
export function key(s: string): string {
  return norm(s).replace(/^the /, '');
}

/** For the IP scan only: a support gem's name with and without its " Support" suffix are the same name. */
export function bare(s: string): string {
  return key(s).replace(/ support$/, '');
}

/** Names from the 3.9-era Path of Building data: some gems and uniques have been renamed since, so deny both. */
export function loadPobNames(): { gems: string[]; uniques: string[] } {
  const skills = JSON.parse(readFileSync(resolve(COVERAGE_DIR, 'pob-skills.json'), 'utf8')) as {
    skills: { name: string }[];
  };
  const uniques = JSON.parse(readFileSync(resolve(COVERAGE_DIR, 'pob-uniques.json'), 'utf8')) as {
    uniques: { name: string }[];
  };
  return { gems: skills.skills.map((s) => s.name), uniques: uniques.uniques.map((u) => u.name) };
}
