import { createContext } from 'preact';
import { useContext } from 'preact/hooks';

/**
 * True inside a hidden copy of a tab that is rendered only to be painted ahead (docs/MENU-SPEED.md 3.3, Camp.tsx). Such
 * a copy is never seen or touched, so it must change nothing: a component skips its side effects (saving a preference,
 * marking something seen, long calculations) when this is set.
 */
export const Rehearsal = createContext(false);
export const useRehearsal = () => useContext(Rehearsal);
