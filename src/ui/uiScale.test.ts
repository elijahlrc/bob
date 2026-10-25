import { describe, expect, it } from 'vitest';
import {
  fitZoom,
  layoutWidth,
  MAX_LAYOUT_WIDTH,
  MIN_LAYOUT_WIDTH,
  scalesFor,
  viewportContent,
} from './uiScale';

describe('interface size', () => {
  it('lays a scaled-up page out narrower and a scaled-down one wider', () => {
    expect(layoutWidth(390, 1.2)).toBe(325);
    expect(layoutWidth(390, 0.8)).toBe(488);
  });

  it('never offers a size that lays a phone out narrower than the floor', () => {
    for (const w of [320, 360, 375, 390, 412, 430]) {
      for (const s of scalesFor(w))
        expect(layoutWidth(w, s)).toBeGreaterThanOrEqual(s > 1 ? MIN_LAYOUT_WIDTH : 0);
    }
    expect(scalesFor(360)).toEqual([0.7, 0.8, 0.9, 1, 1.1, 1.2, 1.3]);
    expect(scalesFor(320)).toEqual([0.7, 0.8, 0.9, 1, 1.1]);
  });

  it('keeps the default tag at 100% and fixes the width otherwise', () => {
    expect(viewportContent(390, 1)).toBe(
      'width=device-width, initial-scale=1.0, viewport-fit=cover',
    );
    expect(viewportContent(390, 1.1)).toBe('width=355, viewport-fit=cover');
  });

  it('lays a large window out at most 1440 wide, and never shrinks a small one', () => {
    expect(fitZoom(1280, 720)).toBe(1);
    expect(fitZoom(1440, 900)).toBe(1);
    expect(2560 / fitZoom(2560, 1300)).toBeCloseTo(MAX_LAYOUT_WIDTH);
    expect(3840 / fitZoom(3840, 2000)).toBeCloseTo(MAX_LAYOUT_WIDTH);
    // An ultrawide keeps its height: 720 tall, wider than 1440.
    expect(1300 / fitZoom(3440, 1300)).toBeCloseTo(720);
  });
});
