/**
 * The light frame of a compact control (docs/UI-FRAMES.md): a painted field with a worn one-pixel rim, for a control that
 * a full painted frame would make too tall. Off, a darker lapis in a gold rim, so it reads as a button on a lapis panel;
 * on, gold in an ink rim, so it never merges with the panel's own gold rim (its text is dark, `.on`).
 */
export function ringProps(on: boolean): Record<string, string> {
  return {
    'data-paint': 'panel',
    'data-ring': '',
    'data-field': on ? 'gold' : 'lapis,3',
    'data-rim': on ? 'ink' : 'gold',
  };
}
