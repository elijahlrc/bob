/* Strategy tab (style study, Gold Leaf only): the level 42 Mystic's strategy as the live tab showed it. */
(function () {
  const ROLES = ['Main', 'Periodic', 'Opener', 'Emergency', 'Off'];
  const WHEN = ['Any fight', 'Packs', 'Few enemies', 'Rares and bosses', 'Bosses only'];
  const EVERY = ['Usual pause', '1.5 s', '3 s', '5 s', '8 s', '12 s'];
  const ORDER = [
    {
      name: 'Raise Husk',
      kind: 'utility',
      roles: ['Auto', 'Off'],
      role: 'Auto',
      note: 'Kept at full count',
    },
    {
      name: 'Pyre Burst',
      kind: 'damage',
      dps: '1,329',
      role: 'Periodic',
      every: true,
      note: 'Every 3.2 s',
    },
    {
      name: 'Guardian Cairn',
      kind: 'damage',
      dps: '1,257',
      role: 'Periodic',
      every: true,
      note: 'Every 3 s',
    },
    {
      name: 'Thunder Rebuke',
      kind: 'damage',
      dps: '2,782',
      role: 'Periodic',
      every: true,
      note: 'Every 3 s',
    },
    {
      name: 'Charged Blow',
      kind: 'damage',
      dps: '1,672',
      role: 'Periodic',
      every: true,
      note: 'Every 3 s',
    },
  ];
  const sel = (label, opts, v) =>
    `<label class="st-ctl"><span class="st-lbl">${label}</span><span class="sel" data-paint="panel" data-thin><select>${opts
      .map((o) => `<option${o === v ? ' selected' : ''}>${o}</option>`)
      .join('')}</select></span></label>`;
  const skill = (s, i, n) => `
    <div class="st-skill">
      <span class="medal st-n" data-field="gold,5" data-medal="plain">${i + 1}</span>
      <div class="st-main">
        <div class="st-name">${s.name}${s.dps ? ` <span class="st-dps">${s.dps} DPS</span>` : ` <span class="muted">${s.kind}</span>`}</div>
        <div class="st-ctls">
          ${sel('Role', s.roles ?? ROLES, s.role)}
          ${sel('When', WHEN, 'Any fight')}
          ${s.every ? sel('Every', EVERY, 'Usual pause') : ''}
        </div>
        <div class="st-note">${s.note}</div>
      </div>
      <div class="st-move">
        <button class="btn sq" data-paint="panel" data-thin ${i === 0 ? 'disabled' : ''} aria-label="Move up">▲</button>
        <button class="btn sq" data-paint="panel" data-thin ${i === n - 1 ? 'disabled' : ''} aria-label="Move down">▼</button>
      </div>
    </div>`;

  window.STUDY = window.STUDY || {};
  window.STUDY.strategy = {
    next: 'Next map ▸',
    html: () => `
    <div class="st">
      <div class="lf-medals">
        <div class="medal md-m" data-field="vermilion,4"><span>Against a pack</span><b>8,095</b><i class="lf-note" data-paint="panel" data-thin>DPS</i></div>
        <div class="medal md-m" data-field="porphyry,4"><span>Against a boss</span><b>8,095</b><i class="lf-note" data-paint="panel" data-thin>DPS</i></div>
      </div>
      <div class="st-cols">
        <section class="lf-panel st-order" data-paint="panel">
          <h4 class="lf-h">First, in this order</h4>
          <p class="lf-lead">The first one whose moment has come
            <span class="tip" tabindex="0" data-tip="Each decision, the character tries these from the top and uses the first whose moment has come and that it can use from where it stands.">is used</span>.</p>
          ${ORDER.map((s, i) => skill(s, i, ORDER.length)).join('')}
        </section>
        <div class="st-side">
          <section class="lf-panel" data-paint="panel">
            <h4 class="lf-h">Otherwise</h4>
            <p class="lf-lead">The first
              <span class="tip" tabindex="0" data-tip="When nothing above is called for, the first main skill that fits the fight. The character walks into its reach. With none it can use (a cooldown, no mana, an immune enemy), a ready periodic skill, then the weapon.">main skill</span> that fits the fight.</p>
            <div class="st-skill solo">
              <span class="medal st-n" data-field="vermilion,4" data-medal="plain">★</span>
              <div class="st-main">
                <div class="st-name">Slag Blow <span class="st-dps">8,798 DPS</span></div>
                <div class="st-ctls">${sel('Role', ROLES, 'Main')}${sel('When', WHEN, 'Any fight')}</div>
              </div>
            </div>
          </section>
          <section class="lf-panel" data-paint="panel">
            <h4 class="lf-h">How it fights</h4>
            <div class="st-ctls two">
              ${sel('Target', ['Nearest', 'Rares first', 'Weakest', 'Stick to target'], 'Nearest')}
              ${sel('Spacing', ['Hold at range', 'Close in', 'Kite'], 'Hold at range')}
              ${sel('Life flask below', ['35% life', '50% life', '65% life', '80% life'], '50% life')}
              ${sel('Utility flasks for', ['Rares and bosses', 'Packs and rares', 'Any fight'], 'Packs and rares')}
            </div>
            <ul class="st-says">
              <li>Fights the nearest enemy, switching as others come nearer; nests and pylons first.</li>
              <li>Stands at the full range of its skill.</li>
              <li>Drinks life flasks below 50% life, utility flasks with a rare near or 5 or more enemies.</li>
            </ul>
          </section>
        </div>
      </div>
    </div>`,
  };
})();
