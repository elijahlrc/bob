import { describe, expect, it } from 'vitest';
import { ask, confirmOpen, dismissAsk } from './Confirm';

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
});
