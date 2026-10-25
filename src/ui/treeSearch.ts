/**
 * The search of the tree screen (docs/TREE-REDESIGN.md, T6.2): every word has to be in the text of a node, in any order and as
 * part of a word, so "spell crit" (or "spell, crit", as in the other lists) finds "Critical Strike Chance with Spells".
 * Players search with the words of other games.
 */
export function searchWords(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[\s,]+/)
    .filter(Boolean);
}

/** The indexes of the texts that contain every word of the query (none for an empty query). `texts` are lower case. */
export function searchMatches(
  query: string,
  texts: readonly string[],
  skip?: (i: number) => boolean,
): number[] {
  const words = searchWords(query);
  if (!words.length) return [];
  const out: number[] = [];
  texts.forEach((t, i) => {
    if (skip?.(i)) return;
    if (words.every((w) => t.includes(w))) out.push(i);
  });
  return out;
}
