import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { MONSTER_TYPES, type MonsterTypeId } from '../../data/monsters';
import { buildFigure, poseFor, stanceFor, type AnimName, type FigureKind } from './figure';
import { sheetSvg } from './sheet';
import { iou, maskOf, pairScores, typeMasks } from './silhouette';

const TYPES = Object.keys(MONSTER_TYPES) as MonsterTypeId[];

describe('silhouettes (docs/ROSTER.md 4.5, 8)', () => {
  it('a mask has cells, and a figure overlaps itself completely', () => {
    const m = maskOf(buildFigure('warrior', poseFor('warrior', 'idle', 0)));
    expect(m.reduce((a, b) => a + b, 0)).toBeGreaterThan(40);
    expect(iou(m, m)).toBe(1);
  });

  it('a big body and a small one overlap little', () => {
    const [sentinel] = typeMasks('sentinel');
    const [gnawer] = typeMasks('gnawer');
    expect(iou(sentinel, gnawer)).toBeLessThan(0.1);
  });

  it('scores every pair of types, most alike first, and the figures are all inside the window', () => {
    const pairs = pairScores();
    expect(pairs.length).toBe((TYPES.length * (TYPES.length - 1)) / 2);
    for (let i = 1; i < pairs.length; i++)
      expect(pairs[i].sim).toBeLessThanOrEqual(pairs[i - 1].sim);
    // A figure drawn partly outside the window would be clipped and so look smaller than it is.
    for (const id of TYPES) {
      const body = MONSTER_TYPES[id].body;
      for (const [anim, t] of [
        ['idle', 0],
        ['walk', 0.25],
        ['attack', 0.5],
      ] as const)
        for (const p of buildFigure(body, poseFor(body, anim, t, stanceFor(id, body)), id, t)) {
          const xs =
            p.k === 'circ'
              ? [p.x - p.r, p.x + p.r]
              : p.k === 'cap'
                ? [p.x1, p.x2]
                : p.k === 'box'
                  ? [p.x]
                  : [p.pts[0], p.pts[2], p.pts[4]];
          for (const x of xs) expect(Math.abs(x), `${id} ${anim}`).toBeLessThan(48);
        }
    }
  });
});

describe('the contact sheet', () => {
  it('draws every type, in colour and in one flat colour, in several poses', () => {
    const colour = sheetSvg();
    for (const id of TYPES) expect(colour).toContain(MONSTER_TYPES[id].name);
    expect(colour.startsWith('<svg')).toBe(true);
    const mono = sheetSvg({
      mono: true,
      k: 0.6,
      poses: [
        ['idle', 0],
        ['walk', 0.25],
        ['attack', 0.5],
      ],
      types: ['warrior', 'hexer'],
    });
    expect(mono).toContain('#e4e0d8');
    expect(mono).toContain('Hexer');
    expect(mono).not.toContain('Gnawer');
  });
});

/**
 * Heroes and the Ossuary are drawn exactly as before the body styles of docs/ROSTER.md 4.1 (V1): the hash of every
 * primitive of every hero rig and every Ossuary type, in every animation, is pinned. A change that moves one is a decision,
 * not a refactor, and updates the snapshot on purpose.
 */
describe('heroes and the Ossuary are pinned', () => {
  const hash = (kind: FigureKind, anim: AnimName, t: number, type?: MonsterTypeId) =>
    createHash('sha1')
      .update(
        JSON.stringify(buildFigure(kind, poseFor(kind, anim, t, stanceFor(type, kind)), type, t)),
      )
      .digest('hex')
      .slice(0, 12);
  const ANIMS: AnimName[] = ['idle', 'walk', 'attack', 'stun', 'death'];
  const T = [0, 0.3, 0.6];

  it('hero rigs and the boss', () => {
    const out: Record<string, string> = {};
    for (const kind of [
      'hero_mace',
      'hero_sword',
      'hero_bow',
      'hero_wand',
      'hero_dagger',
      'boss',
    ] as const)
      for (const a of ANIMS) out[`${kind} ${a}`] = T.map((t) => hash(kind, a, t)).join(' ');
    expect(out).toMatchSnapshot();
  });

  it('the five Ossuary types and the bare bodies they are drawn on', () => {
    const out: Record<string, string> = {};
    for (const id of TYPES.filter((i) => MONSTER_TYPES[i].faction === 'ossuary'))
      for (const a of ANIMS)
        out[`${id} ${a}`] = T.map((t) => hash(MONSTER_TYPES[id].body, a, t, id)).join(' ');
    for (const kind of ['warrior', 'brute', 'archer', 'mage'] as const)
      for (const a of ANIMS) out[`bare ${kind} ${a}`] = T.map((t) => hash(kind, a, t)).join(' ');
    expect(out).toMatchSnapshot();
  });
});
