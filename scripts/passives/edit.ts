/**
 * Opens the tree editor on the hand-written tree (docs/tree/design/D-method.md, "Editing by hand"): first registers any
 * node ids that have no number yet (the editor's patch is keyed by those numbers, so they must be fixed before editing),
 * then starts the dev server on the first free port from 5173 and opens tree-editor.html. Save (Ctrl+S)
 * writes src/data/passives/edits.json; the listing, picture and audit tools apply it, and `npm run passives:bake` gives it
 * to the game.
 *
 *   npm run passives:edit
 */
import { spawnSync } from 'node:child_process';
import { createServer } from 'vite';

const r = spawnSync('npm', ['run', 'passives:register'], { stdio: 'inherit', shell: true });
if (r.status !== 0) process.exit(r.status ?? 1);

const server = await createServer({
  server: { port: 5173, strictPort: false, open: '/tree-editor.html' },
});
await server.listen();
server.printUrls();
console.log(
  'Tree editor (hand-written tree): add /tree-editor.html to the address above if it did not open. Ctrl+C stops.',
);
