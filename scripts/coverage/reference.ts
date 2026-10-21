import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Reference } from './fetch-reference';

/**
 * The reference data lives outside the repository, in a git-ignored `reference/` folder at its root (the owner's machine
 * only). The tools read it from there; the tests that need it skip when it is not there (CI, a fresh clone).
 */
export const REFERENCE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../../reference');
export const COVERAGE_DIR = resolve(REFERENCE_DIR, 'coverage');

/** Whether the local reference data is here. */
export const hasReference = (): boolean => existsSync(resolve(COVERAGE_DIR, 'ref-list.json'));

/** The proper nouns no player-visible name may use (DESIGN.md §3), from the local reference data. */
export function loadDenyList(): string[] {
  return JSON.parse(readFileSync(resolve(REFERENCE_DIR, 'ip-deny-list.json'), 'utf8')) as string[];
}

/**
 * Where the reference data comes from (`reference/sources.json`): the reference version, the reference wiki's API and the
 * filters of the list, and the reference data's release and file layout. Only the extract and fetch scripts read it.
 */
export type Sources = {
  version: { line: string; full: string };
  wiki: {
    api: string;
    defaultDate: string;
    listNote: string;
    gemFilter: string;
    /** A Cargo field that, when '1', keeps a gem out of the list; `gemFlagLabel` counts it. */
    gemFlagField: string;
    gemFlagLabel: string;
    gemPrefixExcluded: { prefix: string; label: string };
    /** Regular expressions (source, flags) of gem names kept out of the list. */
    gemNamesExcluded: { patterns: [string, string][]; label: string };
    /** Item classes that are not in the unique denominator (COVERAGE C-6), with the reason. */
    uniqueClassesExcluded: Record<string, string>;
  };
  data: {
    repo: string;
    tag: string;
    commit: string;
    date: string;
    note: string;
    download: string;
    /** The extension of the data files. */
    ext: string;
    /** Paths inside the data folder. */
    gems: string;
    skills: string;
    uniques: string;
    uniquesSkipped: string[];
    bases: string;
    /** Which file of the release the tree extract reads. */
    tree: string;
    treeSource: string;
    /** The names of the class start nodes, in sector order, and other names some of them go by. */
    treeStarts: string[];
    treeStartAliases: Record<string, string>;
  };
};

export function loadSources(): Sources {
  return JSON.parse(readFileSync(resolve(REFERENCE_DIR, 'sources.json'), 'utf8')) as Sources;
}

export function loadReference(): Reference {
  return JSON.parse(readFileSync(resolve(COVERAGE_DIR, 'ref-list.json'), 'utf8')) as Reference;
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
 * Like `norm`, and also ignores a leading "The" (the reference wiki lists some uniques that way). Exact otherwise: the active
 * gem "Barrage" and "Barrage Support" are different gems.
 */
export function key(s: string): string {
  return norm(s).replace(/^the /, '');
}

/** For the IP scan only: a support gem's name with and without its " Support" suffix are the same name. */
export function bare(s: string): string {
  return key(s).replace(/ support$/, '');
}

/** Names from the older reference data: some gems and uniques have been renamed since, so deny both. */
export function loadRefNames(): { gems: string[]; uniques: string[] } {
  const skills = JSON.parse(readFileSync(resolve(COVERAGE_DIR, 'ref-skills.json'), 'utf8')) as {
    skills: { name: string }[];
  };
  const uniques = JSON.parse(readFileSync(resolve(COVERAGE_DIR, 'ref-uniques.json'), 'utf8')) as {
    uniques: { name: string }[];
  };
  return { gems: skills.skills.map((s) => s.name), uniques: uniques.uniques.map((u) => u.name) };
}
