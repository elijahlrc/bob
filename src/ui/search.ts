/**
 * The search boxes of the lists (gems, items, the codex, the workbench): terms are split by commas and a row has to hold
 * every one, so "area, attack" finds the gems with both tags. A term is matched whole, spaces and all, as part of the
 * row's text. The tree's own search splits on spaces too (treeSearch.ts).
 */
export function searchTerms(query: string): string[] {
  return query
    .toLowerCase()
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

/** Whether a lower-case `text` holds every term (any text, for no terms). */
export function matchesTerms(text: string, terms: readonly string[]): boolean {
  return terms.every((t) => text.includes(t));
}
