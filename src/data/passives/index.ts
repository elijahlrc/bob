/**
 * The hand-written passive tree (docs/tree/design/D-method.md): every area, every start, and the builder that turns them
 * into the game's `Tree`. Until Phase F swaps it in, the game still loads `src/data/tree`; the tools read this.
 */
import { buildPassives, type Built, type Registry } from './build';
import { applyPassiveEdits, type TreeEdits } from './edits';
import edits from './edits.json';
import registry from './ids.json';
import { clusters as inner } from './centre/clusters';
import { ring } from './centre/ring';
import { grit } from './wall/grit';
import { home as wallHome, START as VANGUARD } from './wall/home';
import { maces } from './wall/maces';
import { rampart } from './wall/rampart';
import { resists } from './wall/resists';
import { slams } from './wall/slams';
import { blades } from './yard/blades';
import { blood } from './yard/blood';
import { fosse } from './yard/fosse';
import { dual } from './yard/dual';
import { home as yardHome, START as REAVER } from './yard/home';
import { shield } from './yard/shield';
import { bows } from './bow/bows';
import { flight } from './bow/flight';
import { home as bowHome, START as STRIDER } from './bow/home';
import { quiver } from './bow/quiver';
import { steel } from './bow/steel';
import { string as bowString } from './bow/string';
import { column } from './spire/column';
import { craft } from './spire/craft';
import { fire } from './spire/fire';
import { frost } from './spire/frost';
import { home as spireHome, START as MYSTIC } from './spire/home';
import { storm } from './spire/storm';
import { well } from './spire/well';
import { edge } from './knife/edge';
import { hex } from './knife/hex';
import { home as knifeHome, START as SHADE } from './knife/home';
import { snares } from './knife/snares';
import { venom } from './knife/venom';
import { roofs } from './knife/roofs';
import { choir } from './cathedral/choir';
import { crypt } from './cathedral/crypt';
import { home as cathedralHome, START as ZEALOT } from './cathedral/home';
import { nave } from './cathedral/nave';
import { pyre } from './cathedral/pyre';
import { rods } from './cathedral/rods';
import { ambulatory } from './cathedral/ambulatory';
import type { AreaSpec, StartSpec } from './types';

export const AREAS: AreaSpec[] = [
  ring,
  inner,
  wallHome,
  rampart,
  resists,
  maces,
  slams,
  grit,
  yardHome,
  blades,
  dual,
  shield,
  blood,
  fosse,
  bowHome,
  bowString,
  bows,
  flight,
  quiver,
  steel,
  spireHome,
  well,
  craft,
  column,
  fire,
  frost,
  storm,
  knifeHome,
  edge,
  venom,
  snares,
  hex,
  roofs,
  cathedralHome,
  nave,
  rods,
  pyre,
  choir,
  crypt,
  ambulatory,
];

export const STARTS: StartSpec[] = [MYSTIC, SHADE, STRIDER, REAVER, VANGUARD, ZEALOT];

/**
 * The whole tree. `allowNew` lets ids that `ids.json` has not numbered yet through (the tools; `passives:register` writes
 * them); `edits: false` leaves out the hand edits of `edits.json` (the editor wants the base to diff against).
 */
export function buildAll(
  opts: { allowNew: boolean; edits?: boolean } = { allowNew: false },
): Built {
  const built = buildPassives(AREAS, STARTS, registry as Registry, opts);
  return opts.edits === false ? built : applyPassiveEdits(built, edits as unknown as TreeEdits);
}
