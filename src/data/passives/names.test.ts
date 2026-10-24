import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { REFERENCE_DIR, bare } from '../../../scripts/coverage/reference';
import { PASSIVE_TREE } from './baked';

const REF_TREE = resolve(REFERENCE_DIR, 'tree/ref-tree.json');

/**
 * No notable or keystone of the passive network is named like a notable or keystone of the reference tree (CLAUDE.md,
 * IP policy; CONSTRAINTS §2.4). The reference tree is local to the owner's machine: without it this skips. G4 audit
 * round 1 found six such names that every earlier check had missed, because each round grepped only its new names.
 */
describe.skipIf(!existsSync(REF_TREE))('passive names against the reference tree', () => {
  it('no notable or keystone carries a reference notable or keystone name', () => {
    const ref = JSON.parse(readFileSync(REF_TREE, 'utf8')) as {
      nodes: { name?: string; kind?: string }[];
    };
    const denied = new Set(
      ref.nodes
        .filter((n) => n.name && (n.kind === 'notable' || n.kind === 'keystone'))
        .map((n) => bare(n.name!)),
    );
    expect(denied.size).toBeGreaterThan(100);
    const bad = PASSIVE_TREE.nodes
      .filter((n) => (n.kind === 'notable' || n.kind === 'keystone') && denied.has(bare(n.name)))
      .map((n) => n.name);
    expect(bad).toEqual([]);
  });
});
