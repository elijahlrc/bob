import { useEffect, useState } from 'preact/hooks';

/**
 * How the UI adapts to the screen (docs/MOBILE.md 3.1). Layout follows the width, input follows the pointer: a
 * laptop with a touch screen gets the desktop layout with bigger targets, not the phone layout. The CSS media queries
 * in `mobile.css` repeat these numbers (CSS cannot read them), so change both together.
 */
export const PHONE_MAX = 600;
export const TABLET_MAX = 960;

export type Layout = 'phone' | 'tablet' | 'desktop';

/** The layout for a viewport width in CSS pixels. */
export function layoutFor(width: number): Layout {
  return width <= PHONE_MAX ? 'phone' : width <= TABLET_MAX ? 'tablet' : 'desktop';
}

export type Viewport = { width: number; height: number; layout: Layout; coarse: boolean };

function matches(query: string): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.(query).matches;
}

/** Whether the main pointer is imprecise (a finger): bigger targets, no hover. */
export const isCoarse = (): boolean => matches('(pointer: coarse)');

/** The current viewport. Reads the window once; use `useViewport` in components. */
export function viewport(): Viewport {
  const width = typeof window === 'undefined' ? 1280 : window.innerWidth;
  const height = typeof window === 'undefined' ? 800 : window.innerHeight;
  return { width, height, layout: layoutFor(width), coarse: isCoarse() };
}

/** The viewport, re-read when the window resizes or rotates. */
export function useViewport(): Viewport {
  const [v, setV] = useState<Viewport>(viewport);
  useEffect(() => {
    const on = () => setV(viewport());
    window.addEventListener('resize', on);
    window.addEventListener('orientationchange', on);
    return () => {
      window.removeEventListener('resize', on);
      window.removeEventListener('orientationchange', on);
    };
  }, []);
  return v;
}
