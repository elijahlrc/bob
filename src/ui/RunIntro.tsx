import { seeIntro } from './intro';

/** One line for each camp tab, in the tab bar's order. */
const TABS: [string, string][] = [
  ['Character', 'your life, defences and damage.'],
  ['Passive tree', 'a point every level, spent on lasting bonuses.'],
  ['Items', 'the gear you found; ▲ marks an upgrade.'],
  ['Skills', "skill gems go in your gear's sockets; they are what your character uses."],
  ['Strategy', 'when your character uses each skill and flask.'],
  ['Last map', 'what you dealt and what hurt you.'],
  ['Next map', 'where you go next.'],
];

/**
 * After the first map of a player's first run, before the camp (docs/NEWPLAYER.md N10): how a run goes and what each tab
 * is for. Once per device.
 */
export function RunIntro({ onDone }: { onDone: () => void }) {
  const done = () => {
    seeIntro('run');
    onDone();
  };
  return (
    <div class="run-intro" role="dialog" aria-modal="true" aria-labelledby="run-intro-head">
      <div class="run-intro-card" data-paint="panel">
        <h2 id="run-intro-head" class="lf-h">
          The road through the hundred maps
        </h2>
        <p>Your character fights each map on its own. Between maps, you make it stronger.</p>
        <p>Clear 100 maps to win. If your character dies, the run is over.</p>
        <dl class="run-intro-tabs">
          {TABS.map(([tab, text]) => (
            <div key={tab}>
              <dt>{tab}</dt>
              <dd>{text}</dd>
            </div>
          ))}
        </dl>
        <button class="btn primary" onClick={done}>
          To camp
        </button>
      </div>
    </div>
  );
}
