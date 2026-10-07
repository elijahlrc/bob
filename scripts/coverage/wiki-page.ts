/**
 * Prints the wikitext of a PoE wiki page as it stood at a date (default: the end of the 3.9 era, just before 3.10
 * launched on 2020-03-13). The audit (docs/AUDIT-3.9.md) uses it to read 3.9's rules from a revision of the period
 * rather than from today's page.
 *
 *   npm run coverage:wiki -- "Evasion"            print to the terminal
 *   npm run coverage:wiki -- "Evasion" 2019-12-20 an earlier date
 *   npm run coverage:wiki -- --search "freeze"     list page titles that contain the text
 */
import { pathToFileURL } from 'node:url';

const API = 'https://www.poewiki.net/w/api.php';
const AGENT = 'bob-coverage/0.1 (personal hobby project; mechanics audit)';
export const DEFAULT_DATE = '2020-03-12T00:00:00Z';

async function get(params: Record<string, string>): Promise<unknown> {
  const res = await fetch(`${API}?${new URLSearchParams({ format: 'json', ...params })}`, {
    headers: { 'User-Agent': AGENT },
  });
  return res.json();
}

export async function pageAt(
  title: string,
  date = DEFAULT_DATE,
): Promise<{ text: string; revision: string } | null> {
  const d = (await get({
    action: 'query',
    prop: 'revisions',
    titles: title,
    rvlimit: '1',
    rvstart: date.length === 10 ? `${date}T23:59:59Z` : date,
    rvdir: 'older',
    rvprop: 'content|timestamp|ids',
    rvslots: 'main',
    redirects: '1',
  })) as {
    query?: {
      pages?: Record<
        string,
        { revisions?: { revid: number; timestamp: string; slots: { main: { '*': string } } }[] }
      >;
    };
  };
  const page = Object.values(d.query?.pages ?? {})[0];
  const rev = page?.revisions?.[0];
  if (!rev) return null;
  return { text: rev.slots.main['*'], revision: `rev ${rev.revid} of ${rev.timestamp}` };
}

export async function search(text: string): Promise<string[]> {
  const d = (await get({
    action: 'query',
    list: 'search',
    srsearch: text,
    srlimit: '30',
    srnamespace: '0',
  })) as {
    query?: { search?: { title: string }[] };
  };
  return (d.query?.search ?? []).map((s) => s.title);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args[0] === '--search') {
    console.log((await search(args.slice(1).join(' '))).join('\n'));
    return;
  }
  const [title, date] = args;
  if (!title) throw new Error('usage: coverage:wiki -- "Page title" [YYYY-MM-DD]');
  const p = await pageAt(title, date);
  if (!p) throw new Error(`no revision of "${title}" at that date`);
  console.log(`<!-- ${title}: ${p.revision} -->\n${p.text}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) void main();
