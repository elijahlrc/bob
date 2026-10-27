import type { ComponentChildren } from 'preact';
import { useState } from 'preact/hooks';
import notes from '../../docs/PATCH-NOTES.md?raw';
import type { Controller } from '../run/controller';

/** The notes file is the one source: this screen shows docs/PATCH-NOTES.md as written. */
type Block =
  | { kind: 'date'; text: string }
  | { kind: 'head'; text: string }
  | { kind: 'para'; text: string }
  | { kind: 'list'; items: string[] };

/** Reads the small subset of Markdown the notes use: ## dates, ### headings, bullets (which may wrap) and paragraphs. */
export function parseNotes(src: string): Block[] {
  const out: Block[] = [];
  let para: string[] = [];
  let list: string[] | null = null;
  const flush = () => {
    if (para.length) out.push({ kind: 'para', text: para.join(' ') });
    para = [];
    list = null;
  };
  let skipIntro = true;
  for (const raw of src.split(/\r?\n/)) {
    const line = raw.trimEnd();
    if (line.startsWith('# ')) continue;
    if (line.startsWith('## ')) {
      flush();
      skipIntro = false;
      out.push({ kind: 'date', text: line.slice(3) });
    } else if (skipIntro) {
      continue;
    } else if (line.startsWith('### ')) {
      flush();
      out.push({ kind: 'head', text: line.slice(4) });
    } else if (line.startsWith('- ')) {
      para = [];
      if (!list) {
        list = [];
        out.push({ kind: 'list', items: list });
      }
      list.push(line.slice(2));
    } else if (line.trim() === '') {
      flush();
    } else if (list && /^\s+/.test(line)) {
      list[list.length - 1] += ' ' + line.trim();
    } else {
      list = null;
      para.push(line.trim());
    }
  }
  flush();
  return out;
}

/** `code` and **bold** inside a line. */
function inline(text: string): ComponentChildren {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*)/).map((s, i) => {
    if (s.startsWith('`') && s.length > 1) return <code key={i}>{s.slice(1, -1)}</code>;
    if (s.startsWith('**') && s.length > 3) return <strong key={i}>{s.slice(2, -2)}</strong>;
    return s;
  });
}

const BLOCKS = parseNotes(notes);

/** The notes in releases: each date with what follows it, up to the next date. */
const RELEASES: { date: string; blocks: Block[] }[] = [];
for (const b of BLOCKS) {
  if (b.kind === 'date') RELEASES.push({ date: b.text, blocks: [] });
  else RELEASES[RELEASES.length - 1]?.blocks.push(b);
}

function body(b: Block, i: number) {
  switch (b.kind) {
    case 'date':
      return null;
    case 'head':
      return <h3 key={i}>{inline(b.text)}</h3>;
    case 'para':
      return <p key={i}>{inline(b.text)}</p>;
    case 'list':
      return (
        <ul key={i}>
          {b.items.map((t, j) => (
            <li key={j}>{inline(t)}</li>
          ))}
        </ul>
      );
  }
}

/** How many releases show at first, and how many more each press of Show older adds (each is a painted panel, so the cost is theirs). */
const PAGE = 4;

/** The notes, newest first, as kept in docs/PATCH-NOTES.md: a lapis panel for each release, a few at a time. */
export function PatchNotes({ c }: { c: Controller }) {
  const [shown, setShown] = useState(PAGE);
  const left = RELEASES.length - shown;
  return (
    <div class="screen patchnotes">
      <h1>Patch notes</h1>
      <div class="lf-back">
        <button class="btn" onClick={() => c.goTo('title')}>
          Back
        </button>
      </div>
      <div class="patch-list">
        {RELEASES.slice(0, shown).map((r, i) => (
          <section key={i} class="patch-release lf-panel" data-paint="panel">
            <h2 class="lf-h">{r.date}</h2>
            {r.blocks.map(body)}
          </section>
        ))}
        {left > 0 && (
          <button class="btn patch-more" onClick={() => setShown(shown + PAGE)}>
            Show older ({left} more)
          </button>
        )}
      </div>
    </div>
  );
}
