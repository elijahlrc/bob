import { describe, expect, it } from 'vitest';
import { generateName } from '../src/run/rivals';
import { newRun, type RunState } from '../src/run/run';
import type { MapResult } from '../src/sim/runMap';
import { RivalLog } from './rivallog';

const res = { status: 'dead', areaLevel: 12, type: 'crescendo', level: 12 } as MapResult;
const sink = { url: 'https://abc.supabase.co', key: 'k' };

function ended(cls: string, seed: number): RunState {
  const run = newRun(cls, seed);
  run.phase = 'dead';
  run.map = 9;
  return run;
}

describe('the bot’s characters posted as rivals (npm run sim -- --rivals)', () => {
  it('posts one bot row to a request for each run, with a made-up name and a token of its own', async () => {
    const bodies: { url: string; row: Record<string, unknown> }[] = [];
    const log = new RivalLog(
      'abc1234+',
      async (url, init) => {
        bodies.push({ url, row: JSON.parse(init.body as string)[0] });
        return { ok: true };
      },
      sink,
    );
    log.add(ended('vanguard', 1001), res);
    log.add(ended('mystic', 1001), res);
    log.add(ended('vanguard', 1002), res);
    expect(bodies).toHaveLength(0);
    expect(await log.flush()).toBe('rivals: sent 3 of 3 bot characters (version abc1234+)');
    expect(bodies.map((b) => b.url)).toEqual(
      Array(3).fill('https://abc.supabase.co/rest/v1/rivals'),
    );
    const rows = bodies.map((b) => b.row);
    for (const r of rows) {
      expect(r).toMatchObject({ bot: true, outcome: 'died', map: 9, game_version: 'abc1234+' });
      expect(r.token_hash).toMatch(/^[0-9a-f]{64}$/);
    }
    expect(rows[0].name).toBe(generateName(1001));
    // A token for each class and seed, so the table's daily cap counts per run.
    expect(new Set(rows.map((r) => r.token_hash)).size).toBe(3);
  });

  it('goes on past a row the table refuses, and says how many it took', async () => {
    let n = 0;
    const log = new RivalLog('v', async () => ({ ok: n++ !== 0 }), sink);
    log.add(ended('vanguard', 1), res);
    log.add(ended('vanguard', 2), res);
    expect(await log.flush()).toBe('rivals: sent 1 of 2 bot characters (version v)');
  });

  it('says when nothing was taken, and never throws when offline', async () => {
    const log = new RivalLog(
      'v',
      async () => {
        throw new Error('offline');
      },
      sink,
    );
    log.add(ended('vanguard', 1), res);
    expect(await log.flush()).toContain('sent 0 of 1');
    expect(await new RivalLog('v', async () => ({ ok: true }), sink).flush()).toBe(
      'rivals: sent 0 of 0 bot characters (version v)',
    );
  });
});
