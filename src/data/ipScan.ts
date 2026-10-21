function escape(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Multi-word entries match anywhere as whole words. Single words match only when they are the
 * entire string (a gem or class *named* exactly like the reference) so ordinary words in our own
 * names ("Veil of Grace", "Haste flask") don't trip the scan. Entries prefixed with `=` are
 * descriptive phrases that only count as a slip when used as a whole name.
 */
export function ipViolations(strings: readonly string[], denyList: readonly string[]): string[] {
  const bad: string[] = [];
  for (const entry of denyList) {
    const exact = entry.startsWith('=');
    const phrase = exact ? entry.slice(1) : entry;
    const multi = !exact && /\s/.test(phrase.trim());
    const re = multi
      ? new RegExp(`(^|[^a-z])${escape(phrase)}($|[^a-z])`, 'i')
      : new RegExp(`^\\s*${escape(phrase)}\\s*$`, 'i');
    for (const s of strings) if (re.test(s)) bad.push(`"${s}" matches "${entry}"`);
  }
  return bad;
}
