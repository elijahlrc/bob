import { describe, expect, it } from 'vitest';
import { layoutFor, PHONE_MAX, TABLET_MAX, viewport } from './device';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('device', () => {
  it('picks the layout from the width, with the limits inclusive', () => {
    expect(layoutFor(320)).toBe('phone');
    expect(layoutFor(PHONE_MAX)).toBe('phone');
    expect(layoutFor(PHONE_MAX + 1)).toBe('tablet');
    expect(layoutFor(TABLET_MAX)).toBe('tablet');
    expect(layoutFor(TABLET_MAX + 1)).toBe('desktop');
    expect(layoutFor(1920)).toBe('desktop');
  });

  it('has a desktop default when there is no window (tests, tools)', () => {
    const v = viewport();
    expect(v.layout).toBe('desktop');
    expect(v.coarse).toBe(false);
  });

  it('keeps the CSS breakpoints in step with the constants', () => {
    const css = readFileSync(resolve(import.meta.dirname, 'mobile.css'), 'utf8');
    expect(css).toContain(`(max-width: ${PHONE_MAX}px)`);
    expect(css).toContain(`(max-width: ${TABLET_MAX}px)`);
  });
});
