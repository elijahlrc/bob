/** Visual styles available for the map view and UI skin. */
export type StyleId = 'grim' | 'cel' | 'ink';

export const STYLE_IDS: StyleId[] = ['grim', 'cel', 'ink'];

export const STYLE_INFO: Record<StyleId, { name: string; tagline: string }> = {
  grim: { name: 'Grimdark', tagline: 'Crunchy pixel art, dynamic torchlight, gritty particles' },
  cel: {
    name: 'Cel Isometric',
    tagline: 'Bold outlines, flat colour, 2.5D camera, punchy effects',
  },
  ink: { name: 'Inkwell', tagline: 'A hand-inked tabletop map, wobbling line work, ink and wash' },
};
