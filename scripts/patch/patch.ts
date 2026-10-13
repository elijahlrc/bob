/**
 * Patch notes in one command: write them, file them into docs/PATCH-NOTES.md (which the Patch notes screen shows), check,
 * commit and push. A push to main is what updates the game (.github/workflows/pages.yml builds and deploys it).
 *
 *   npm run patch -- add "Text of one note." [--section "Heading"]   queue a note (checked against the style rules)
 *   npm run patch -- list                                           show the queue and the notes it would make
 *   npm run patch -- check                                          check the queue and every entry already filed
 *   npm run patch -- release [-m "note"]... [--dry-run] [--no-push] [--skip-checks] [--date YYYY-MM-DD]
 *
 * The queue is docs/patch-pending.txt (not tracked). `release` files it under today's date, runs `npm run check` and the
 * build, commits only the notes file, and pushes. If anything fails the file and the queue are put back as they were.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { filedProblems, fileNotes, lintNotes, parsePending, today, type Note } from './lib';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const NOTES = resolve(root, 'docs/PATCH-NOTES.md');
const PENDING = resolve(root, 'docs/patch-pending.txt');

const args = process.argv.slice(2);
const cmd = args.shift() ?? 'list';

function flag(name: string): boolean {
  const i = args.indexOf(name);
  if (i < 0) return false;
  args.splice(i, 1);
  return true;
}
function option(name: string): string | null {
  const i = args.indexOf(name);
  if (i < 0) return null;
  const v = args[i + 1] ?? null;
  args.splice(i, 2);
  return v;
}
function options(name: string): string[] {
  const out: string[] = [];
  for (let v = option(name); v !== null; v = option(name)) out.push(v);
  return out;
}

const read = (p: string): string => (existsSync(p) ? readFileSync(p, 'utf8') : '');
const git = (...a: string[]): string =>
  execFileSync('git', a, { cwd: root, encoding: 'utf8' }).trim();
function run(what: string, command: string, a: string[]): void {
  console.log(`\n> ${what}`);
  const r = spawnSync(command, a, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (r.status !== 0) throw new Error(`${what} failed`);
}
function fail(msg: string): never {
  console.error(msg);
  process.exit(1);
}
function show(notes: readonly Note[]): void {
  let section: string | null | undefined;
  for (const n of notes) {
    if (n.section !== section) {
      section = n.section;
      if (section) console.log(`\n  ${section}`);
    }
    console.log(`  - ${n.text}`);
  }
}

function queue(extra: Note[] = []): Note[] {
  return [...parsePending(read(PENDING)), ...extra];
}

function add(): void {
  const section = option('--section');
  const text = args.join(' ').trim();
  if (!text)
    fail('Nothing to add. Usage: npm run patch -- add "Text of one note." [--section "Heading"]');
  const note: Note = { text, section };
  const problems = lintNotes([note]);
  if (problems.length) fail('Not added:\n  ' + problems.join('\n  '));
  const cur = read(PENDING);
  const last = parsePending(cur).at(-1);
  const head = section && last?.section !== section ? `# ${section}\n` : '';
  writeFileSync(PENDING, (cur && !cur.endsWith('\n') ? cur + '\n' : cur) + head + `- ${text}\n`);
  console.log(`Queued (${queue().length} in the queue).`);
}

function check(): void {
  const problems = [
    ...lintNotes(queue()).map((p) => `queue: ${p}`),
    ...filedProblems(read(NOTES)).map((p) => `docs/PATCH-NOTES.md: ${p}`),
  ];
  if (problems.length) fail(problems.join('\n'));
  console.log('The queue and every filed entry fit the style rules.');
}

function release(): void {
  const dry = flag('--dry-run');
  const noPush = flag('--no-push');
  const skipChecks = flag('--skip-checks');
  const date = option('--date') ?? today();
  const inline = options('-m').map((text): Note => ({ text, section: null }));
  const notes = queue(inline);
  if (notes.length === 0)
    fail('Nothing to release. Queue notes with `npm run patch -- add "..."` or pass -m "...".');
  const problems = lintNotes(notes);
  if (problems.length) fail('The notes do not fit the style rules:\n  ' + problems.join('\n  '));

  const before = read(NOTES);
  const after = fileNotes(before, date, notes);
  console.log(`Notes for ${date}:`);
  show(notes);
  if (dry) return void console.log('\nDry run: nothing written.');

  if (!noPush) {
    if (git('rev-parse', '--abbrev-ref', 'HEAD') !== 'main')
      fail('Not on main: a push from another branch does not update the game.');
    git('fetch', 'origin', 'main');
    if (git('rev-list', '--count', 'HEAD..origin/main') !== '0')
      fail(
        'origin/main has commits this checkout does not. Pull them first (git pull --rebase), then release again.',
      );
  }

  const pending = read(PENDING);
  writeFileSync(NOTES, after);
  try {
    run('prettier', 'npx', ['prettier', '--write', 'docs/PATCH-NOTES.md']);
    if (!skipChecks) {
      run('npm run check', 'npm', ['run', 'check']);
      run('npm run build', 'npm', ['run', 'build']);
    }
    // Only the notes file: other work in the tree, staged or not, stays where it is.
    run('commit', 'git', [
      'commit',
      '-m',
      `Patch notes ${date}`,
      '-m',
      'Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>',
      '--',
      'docs/PATCH-NOTES.md',
    ]);
  } catch (e) {
    writeFileSync(NOTES, before);
    if (pending) writeFileSync(PENDING, pending);
    fail(`${(e as Error).message}. The notes file is back as it was and the queue is kept.`);
  }
  if (existsSync(PENDING)) unlinkSync(PENDING);

  if (noPush)
    return void console.log(
      '\nCommitted, not pushed (--no-push). `git push origin main` updates the game.',
    );
  run('push', 'git', ['push', 'origin', 'main']);
  const repo = git('remote', 'get-url', 'origin')
    .replace(/\.git$/, '')
    .replace(/^git@github\.com:/, 'https://github.com/');
  console.log(`\nPushed. GitHub builds and deploys the game now: ${repo}/actions`);
}

switch (cmd) {
  case 'add':
    add();
    break;
  case 'list': {
    const q = queue();
    if (q.length === 0) console.log('The queue is empty.');
    else show(q);
    break;
  }
  case 'check':
    check();
    break;
  case 'release':
    release();
    break;
  default:
    fail(
      `Unknown command "${cmd}". Use add, list, check or release (see the top of scripts/patch/patch.ts).`,
    );
}
