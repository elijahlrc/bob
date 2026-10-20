/**
 * Launches the tree editor (docs/TREE-REDESIGN.md, "Hand editing"): first makes sure the baked tree is a fresh layout (a stale
 * bake is rebaked, unless hand edits are saved, because a rebake renumbers nodes and the patch would land on the wrong ones),
 * then starts the dev server on the first free port from 5173 and opens tree-editor.html?tree=old (the game loads the hand-written
 * tree now; `npm run passives:edit` edits that one).
 *
 *   npm run tree:edit
 */
import { spawnSync } from 'node:child_process';
import { createServer } from 'vite';
import { buildLayoutTree } from '../../src/data/tree/layout';
import edits from '../../src/data/tree/treeEdits.json';
import { BAKED_TREE } from '../../src/data/tree/treeBaked';

const t0 = Date.now();
const fresh = buildLayoutTree();
const same =
  JSON.stringify({ nodes: fresh.nodes, starts: fresh.starts }) === JSON.stringify(BAKED_TREE);
if (!same) {
  const hasEdits = Object.keys(edits).some((k) => k !== 'version');
  if (hasEdits) {
    console.error(
      'The baked tree is out of date with the layout code, and there are hand edits saved (src/data/tree/treeEdits.json).\n' +
        'A rebake renumbers the nodes, so the edits would land on the wrong ones. Opening the editor on the current bake instead.\n' +
        'To take the new layout: empty treeEdits.json to {"version":1}, then run this again.',
    );
  } else {
    console.log(`Baked tree is stale (checked in ${Date.now() - t0} ms): rebaking...`);
    const r = spawnSync('npm', ['run', 'tree:bake'], { stdio: 'inherit', shell: true });
    if (r.status !== 0) process.exit(r.status ?? 1);
  }
} else console.log('Baked tree is up to date.');

const server = await createServer({
  server: { port: 5173, strictPort: false, open: '/tree-editor.html?tree=old' },
});
await server.listen();
server.printUrls();
console.log(
  'Tree editor (the old generated tree): add /tree-editor.html?tree=old to the address above if it did not open. Ctrl+C stops.',
);
