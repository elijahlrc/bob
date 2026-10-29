import { afterEach, describe, expect, it } from 'vitest';
import { ask, askAgain, asksSkipped, confirmOpen, dismissAsk } from './Confirm';
import { savePref } from './prefs';

describe('the confirmation', () => {
  it('is open while a question waits, and a dismissal answers it with no', async () => {
    expect(confirmOpen()).toBe(false);
    const answer = ask({ title: 'Salvage?', confirm: 'Salvage' });
    expect(confirmOpen()).toBe(true);
    dismissAsk();
    expect(await answer).toBe(false);
    expect(confirmOpen()).toBe(false);
  });

  it('a second question answers the first with no', async () => {
    const first = ask({ title: 'One', confirm: 'Yes' });
    const second = ask({ title: 'Two', confirm: 'Yes' });
    expect(await first).toBe(false);
    dismissAsk();
    expect(await second).toBe(false);
  });

  describe("the 'Don't ask me again' box", () => {
    const g = globalThis as { window?: unknown };
    afterEach(() => {
      delete g.window;
    });
    const withStorage = () => {
      const m = new Map<string, string>();
      g.window = {
        localStorage: {
          getItem: (k: string) => m.get(k) ?? null,
          setItem: (k: string, v: string) => void m.set(k, v),
        },
      };
    };

    it('a question with a skipKey is still asked until the player asks not to be', async () => {
      withStorage();
      const answer = ask({ title: 'Enter?', confirm: 'Go', skipKey: 'confirm.test' });
      expect(confirmOpen()).toBe(true);
      dismissAsk();
      expect(await answer).toBe(false);
    });

    it('answers yes at once while the preference is saved, and asks again after it is cleared', async () => {
      withStorage();
      savePref('confirm.test', true);
      expect(asksSkipped('confirm.test')).toBe(true);
      expect(await ask({ title: 'Enter?', confirm: 'Go', skipKey: 'confirm.test' })).toBe(true);
      expect(confirmOpen()).toBe(false);
      askAgain('confirm.test');
      const answer = ask({ title: 'Enter?', confirm: 'Go', skipKey: 'confirm.test' });
      expect(confirmOpen()).toBe(true);
      dismissAsk();
      await answer;
    });

    it('a question with no skipKey is always asked', async () => {
      withStorage();
      savePref('confirm.test', true);
      const answer = ask({ title: 'Delete?', confirm: 'Delete' });
      expect(confirmOpen()).toBe(true);
      dismissAsk();
      expect(await answer).toBe(false);
    });
  });
});
