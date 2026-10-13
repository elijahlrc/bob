/**
 * Patch notes: the style rules as checks, and the edit that files a day's notes into docs/PATCH-NOTES.md.
 * The command line is scripts/patch/patch.ts (`npm run patch`); the Patch notes screen shows the file as it is.
 */
import { IP_DENY_LIST } from '../../src/data/ipDenyList';

/** A bullet longer than this is not a concise note. */
export const MAX_LENGTH = 240;
/** More bullets than this in one release is a changelog, not patch notes. */
export const MAX_BULLETS = 12;

export interface Note {
  text: string;
  /** The plain heading it is filed under (a `### ` section of the day), or null for the day's own list. */
  section: string | null;
}

const RULES: { re: RegExp; why: string }[] = [
  {
    re: /\*\*|`|\[[^\]]*\]\([^)]*\)|(^|\s)_[^_\s][^_]*_(\s|$)/,
    why: 'plain text only: no bold, code, links or other markdown',
  },
  { re: /\b(I|I'm|I've|I'd|I'll|my|me|we|we've|we're)\b/, why: 'no first person' },
  {
    re: /\b(the dev|developers?|you asked|the user)\b/i,
    why: 'do not address or mention the developer',
  },
  {
    re: /\b[\w-]+\.(ts|tsx|js|md|json|css|sh)\b|\b(docs|src|scripts)\//,
    why: 'no file names or paths',
  },
  {
    re: /\b(npm|git|commit|milestone|ledger|audit|refactor|constants?|typescript|ci|pr|sim|simulation|bot runs?|unit tests?|tests?)\b/i,
    why: 'no internal process or tooling terms',
  },
  {
    re: /\b(unchanged|no change|not changed|stays? the same|remains? the same|as before)\b/i,
    why: 'list only what changed, never what did not',
  },
  {
    re: /\bpath of (exile|building)\b|\bpoe\b|\b3\.\d+(\.\d+)?\b/i,
    why: 'our own names only: no reference-game names or version numbers',
  },
];

const escape = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const PHRASES = IP_DENY_LIST.filter((e) => !e.startsWith('=') && /\s/.test(e.trim())).map((e) => ({
  e,
  re: new RegExp(`(^|[^a-z])${escape(e)}($|[^a-z])`, 'i'),
}));

/** What is wrong with one note, as short reasons (empty when it is fine). */
export function lintNote(text: string): string[] {
  const out: string[] = [];
  if (text.trim() === '') out.push('empty');
  if (text.length > MAX_LENGTH)
    out.push(`too long (${text.length} characters, at most ${MAX_LENGTH}): split it or cut it`);
  for (const r of RULES) if (r.re.test(text)) out.push(r.why);
  for (const p of PHRASES) if (p.re.test(text)) out.push(`reference-game name "${p.e}"`);
  return out;
}

/** The pending file: `- note` lines, and `# Heading` lines that file the notes after them under a plain heading. */
export function parsePending(src: string): Note[] {
  const notes: Note[] = [];
  let section: string | null = null;
  for (const raw of src.split(/\r?\n/)) {
    const line = raw.trim();
    if (line === '' || line.startsWith('//')) continue;
    if (line.startsWith('# ')) section = line.slice(2).trim();
    else if (line.startsWith('- ')) notes.push({ text: line.slice(2).trim(), section });
    else if (notes.length > 0) notes[notes.length - 1]!.text += ' ' + line;
    else notes.push({ text: line, section });
  }
  return notes;
}

/** Every problem in a set of notes, one line each. */
export function lintNotes(notes: readonly Note[]): string[] {
  const out: string[] = [];
  for (const n of notes) {
    const short = n.text.length > 60 ? n.text.slice(0, 57) + '...' : n.text;
    for (const why of lintNote(n.text)) out.push(`"${short}": ${why}`);
  }
  if (notes.length > MAX_BULLETS)
    out.push(
      `${notes.length} notes: keep a release to ${MAX_BULLETS} or fewer, the major changes only`,
    );
  return out;
}

/** A bullet wrapped to the width the notes file uses, continuation lines indented two spaces. */
export function bullet(text: string, width = 130): string {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = '-';
  for (const w of words) {
    if (cur.length + 1 + w.length > width && cur !== '-') {
      lines.push(cur);
      cur = '  ' + w;
    } else cur += ' ' + w;
  }
  lines.push(cur);
  return lines.join('\n');
}

/**
 * Files notes under the `## date` heading of the file (made at the top, newest first, if there is none). Plain notes go
 * at the end of the day's own list, before its first `###` section; sectioned notes go under their section, made at the
 * end of the day if needed.
 */
export function fileNotes(file: string, date: string, notes: readonly Note[]): string {
  const lines = file.replace(/\r\n/g, '\n').split('\n');
  const heading = `## ${date}`;
  let start = lines.findIndex((l) => l.trim() === heading);
  if (start < 0) {
    const first = lines.findIndex((l) => l.startsWith('## '));
    const at = first < 0 ? lines.length : first;
    lines.splice(at, 0, heading, '');
    start = at;
  }
  let end = lines.findIndex((l, i) => i > start && l.startsWith('## '));
  if (end < 0) end = lines.length;

  const plain = notes.filter((n) => n.section === null);
  if (plain.length > 0) {
    let at = lines.findIndex((l, i) => i > start && i < end && l.startsWith('### '));
    if (at < 0) at = end;
    while (at > start + 1 && lines[at - 1]!.trim() === '') at--;
    const add = [...(at === start + 1 ? [''] : []), ...plain.map((n) => bullet(n.text))];
    lines.splice(at, 0, ...add);
    end += add.length;
  }
  for (const name of [...new Set(notes.filter((n) => n.section !== null).map((n) => n.section!))]) {
    const own = notes.filter((n) => n.section === name);
    const add = own.map((n) => bullet(n.text));
    const h = lines.findIndex((l, i) => i > start && i < end && l.trim() === `### ${name}`);
    if (h >= 0) {
      let at = lines.findIndex((l, i) => i > h && i < end && l.startsWith('### '));
      if (at < 0) at = end;
      while (at > h + 1 && lines[at - 1]!.trim() === '') at--;
      lines.splice(at, 0, ...add);
      end += add.length;
    } else {
      let at = end;
      while (at > start + 1 && lines[at - 1]!.trim() === '') at--;
      lines.splice(at, 0, '', `### ${name}`, '', ...add);
      end += add.length + 3;
    }
  }
  // One blank line between blocks, and the file ends with a newline.
  const text = lines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\n*$/, '\n');
  // A heading directly after a list needs its blank line.
  return text.replace(/([^\n])\n(## |### )/g, '$1\n\n$2');
}

/** Today as `YYYY-MM-DD` in the machine's own time, which is the day the player's notes are headed with. */
export function today(d: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** The whole notes file, for the test that holds every entry to the style: the notes under each `## date`, as text. */
export function entriesOf(file: string): Note[] {
  const out: Note[] = [];
  let inDay = false;
  let section: string | null = null;
  for (const raw of file.split(/\r?\n/)) {
    if (raw.startsWith('## ')) {
      inDay = true;
      section = null;
    } else if (!inDay) continue;
    else if (raw.startsWith('### ')) section = raw.slice(4).trim();
    else if (raw.startsWith('- ')) out.push({ text: raw.slice(2).trim(), section });
    else if (raw.startsWith('  ') && out.length > 0) out[out.length - 1]!.text += ' ' + raw.trim();
    else if (raw.trim() !== '') out.push({ text: raw.trim(), section });
  }
  return out;
}

/** The style problems of notes already filed. Length and count are rules for a new release, not for what was filed before them. */
export function filedProblems(file: string): string[] {
  return lintNotes(entriesOf(file)).filter(
    (p) => !p.includes('too long') && !p.includes('notes: keep a release'),
  );
}
