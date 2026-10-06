/** Visual styles available for the map view and UI skin. */
export type StyleId = 'grim' | 'gri' | 'cel' | 'ink';

export const STYLE_IDS: StyleId[] = ['grim', 'gri', 'cel', 'ink'];

export const STYLE_INFO: Record<StyleId, { name: string; tagline: string }> = {
  grim: { name: 'Grimdark', tagline: 'Crunchy pixel art, dynamic torchlight, gritty particles' },
  gri: {
    name: 'Grim Isometric',
    tagline: 'The crunchy dark pixel look from a diagonal camera, smaller pixels, wider view',
  },
  cel: {
    name: 'Cel Isometric',
    tagline: 'Bold outlines, flat colour, 2.5D camera, punchy effects',
  },
  ink: { name: 'Inkwell', tagline: 'A hand-inked tabletop map, wobbling line work, ink and wash' },
};
