/* Skills tab (style study, Gold Leaf only): the level 42 Mystic's gems as the live tab showed them. Tap a gem in the
   bag, then an empty socket to place it; tap a socketed gem to see what can be done with it. */
(function () {
  const G = (name, attr, level, o = {}) => ({ name, attr, level, ...o });
  const ITEMS = [
    [
      'Main hand',
      'Stormtongue Foil',
      'unique',
      [G('Raise Husk', 'int', 12), G('Guardian Cairn', 'str', 10), G('Thunder Rebuke', 'str', 11)],
    ],
    [
      'Off hand',
      'Spidersilk Wall',
      'unique',
      [
        G('Charged Blow', 'str', 8),
        G('Pyre Burst', 'dex', 6),
        G('Dune Stance', 'str', 10, { note: 'Reserves 50 mana' }),
      ],
    ],
    [
      'Boots',
      'Sinewed Raider Treads of Embers',
      'magic',
      [
        G('Slag Blow', 'str', 11, { main: true }),
        G('Spark Seed', 'int', 10, { support: true }),
        G('Dense Blast', 'int', 8, { support: true }),
        G('Knife Range', 'dex', 8, { support: true }),
      ],
    ],
    ['Helmet', 'Frost Guard', 'rare', [G('Keen Halo', 'dex', 10, { note: 'Reserves 175 mana' })]],
    [
      'Body',
      'Thornwall',
      'unique',
      [
        G('Rime Herald', 'dex', 8, { note: 'Reserves 125 mana' }),
        G('Quickening Halo', 'dex', 7, { note: 'Reserves 125 mana' }),
      ],
    ],
    ['Gloves', 'Frostgrief Mitts', 'unique', [null, null, null]],
    ['Ring', 'Yokemark Ring', 'unique', [null]],
  ];
  const BAG = [
    G('Ghost Blades', 'dex', 9, { says: '▼17% DPS', where: 'Gloves' }),
    G('Scorch Wave', 'int', 9, { says: '▼12% DPS', where: 'Gloves' }),
    G('Static Ring', 'int', 9, { says: '▼13% DPS', where: 'Gloves' }),
    G('Tide of Judgement', 'int', 9, { says: '▼13% DPS', where: 'Gloves' }),
    G('Venom Shower', 'dex', 9, { no: 'Needs a bow' }),
    G('Keen Eye', 'dex', 10, { support: true, no: 'Needs an attack skill in the same item' }),
  ];
  // What the player has picked: a bag gem (to place) or a socketed one (to act on).
  let pick = null;
  const RAR = { normal: '', magic: 'r-magic', rare: 'r-rare', unique: 'r-unique' };

  const gemArt = (g, state = '') =>
    `<span class="sk-stone" data-paint="gem" data-gem="${g ? g.attr : 'empty'}" data-shape="${g?.support ? 'support' : 'skill'}" data-state="${state}" data-pk="${g ? g.attr : 'e'}${g?.support ? 's' : ''}${state}"></span>`;

  function socketRow(g, slot, i, linked) {
    const placing = pick?.from === 'bag' && !g && !BAG[pick.i].no;
    const picked = pick?.from === 'sock' && pick.slot === slot && pick.i === i;
    const lvl = g ? `<span class="sk-lvl">${g.level}</span>` : '';
    const text = g
      ? `<div class="sk-name">${g.main ? '<span class="sk-star">★</span> ' : ''}${g.name}</div>${g.note ? `<div class="sk-sub">${g.note}</div>` : g.main ? '<div class="sk-sub">Main skill</div>' : ''}`
      : `<div class="sk-name sk-empty">${placing ? 'Place it here' : 'Empty'}</div>`;
    return `<button class="sk-sock${picked ? ' on' : ''}${placing ? ' aim' : ''}" data-slot="${slot}" data-i="${i}">
      <span class="sk-gemwrap">${gemArt(g, picked ? 'sel' : placing ? 'target' : '')}${lvl}</span>
      <span class="sk-text">${text}</span></button>${linked ? '<span class="sk-chain" data-paint="chain"></span>' : ''}`;
  }

  const card = ([slot, name, rar, gems]) => `
    <section class="sk-item" data-paint="panel">
      <h4 class="sk-head"><span class="${RAR[rar]}">${name}</span><span class="sk-slot">${slot}</span></h4>
      <div class="sk-socks">${gems.map((g, i) => socketRow(g, slot, i, i < gems.length - 1)).join('')}</div>
    </section>`;

  function pickBar() {
    if (!pick) return '';
    if (pick.from === 'bag') {
      const g = BAG[pick.i];
      return `<div class="sk-pick" data-paint="panel" data-thin><span><b>${g.name}</b>: tap an empty socket${g.says ? ` <span class="lf-down">(${g.says} in ${g.where})</span>` : ''}</span><button class="btn small" data-paint="panel" data-thin data-act="cancel">Cancel</button></div>`;
    }
    const g = ITEMS.find((it) => it[0] === pick.slot)[3][pick.i];
    return `<div class="sk-pick" data-paint="panel" data-thin><span><b>${g.name}</b></span><span class="sk-acts">${g.support ? '' : `<button class="btn small" data-paint="panel" data-thin data-act="main">${g.main ? '★ Main skill' : 'Make main'}</button>`}<button class="btn small" data-paint="panel" data-thin data-act="remove">Take out</button><button class="btn small" data-paint="panel" data-thin data-act="cancel">Done</button></span></div>`;
  }

  const bagRow = (g, i) => `
    <button class="sk-bagrow${pick?.from === 'bag' && pick.i === i ? ' on' : ''}${g.no ? ' no' : ''}" data-bag="${i}">
      <span class="sk-gemwrap">${gemArt(g, pick?.from === 'bag' && pick.i === i ? 'sel' : '')}<span class="sk-lvl">${g.level}</span></span>
      <span class="sk-text"><span class="sk-name">${g.name}</span>
      <span class="sk-sub">${g.no ? `<span class="lf-down">${g.no}</span>` : `<span class="lf-down">${g.says}</span> in ${g.where}`}</span></span>
    </button>`;

  const html = () => `
    <div class="sk">
      <div class="lf-medals">
        <div class="medal md-m" data-field="vermilion,4"><span>Damage per second</span><b>13,648</b>
          <i class="lf-note tip" tabindex="0" data-paint="panel" data-thin data-tip="Slag Blow alone: 5,228 DPS. Every few seconds also Pyre Burst, Guardian Cairn, Thunder Rebuke and Charged Blow.">★ Slag Blow</i></div>
        <div class="medal md-m" data-field="porphyry,4"><span>Effective HP</span><b>30,788</b></div>
      </div>
      <div class="sk-cols">
        <div class="sk-main">
          ${pickBar()}
          <div class="sk-grid">${ITEMS.map(card).join('')}</div>
        </div>
        <section class="lf-panel sk-bag" data-paint="panel">
          <h4 class="lf-h">Gems</h4>
          <div class="sk-filters">
            <label class="sk-check"><input type="checkbox" /> One of each</label>
            <label class="sk-check"><input type="checkbox" /> Usable with my weapons</label>
          </div>
          <h5 class="sk-sh">Skills</h5>
          ${BAG.map((g, i) => (g.support ? '' : bagRow(g, i))).join('')}
          <h5 class="sk-sh">Supports</h5>
          ${BAG.map((g, i) => (g.support ? bagRow(g, i) : '')).join('')}
        </section>
      </div>
    </div>`;

  function mount(frame) {
    const again = () => {
      window.studyRender();
    };
    frame.querySelectorAll('[data-bag]').forEach(
      (b) =>
        (b.onclick = () => {
          const i = +b.dataset.bag;
          pick = pick?.from === 'bag' && pick.i === i ? null : { from: 'bag', i };
          again();
        }),
    );
    frame.querySelectorAll('.sk-sock').forEach(
      (b) =>
        (b.onclick = () => {
          const it = ITEMS.find((x) => x[0] === b.dataset.slot);
          const i = +b.dataset.i;
          const g = it[3][i];
          if (pick?.from === 'bag' && !g) {
            const bg = BAG[pick.i];
            if (bg.no) return;
            it[3][i] = { ...bg };
            BAG.splice(pick.i, 1);
            pick = null;
          } else if (g)
            pick =
              pick?.from === 'sock' && pick.slot === it[0] && pick.i === i
                ? null
                : { from: 'sock', slot: it[0], i };
          again();
        }),
    );
    frame.querySelectorAll('[data-act]').forEach(
      (b) =>
        (b.onclick = () => {
          if (b.dataset.act === 'remove') {
            const it = ITEMS.find((x) => x[0] === pick.slot);
            BAG.unshift({ ...it[3][pick.i], says: '—', where: 'the bag', main: false });
            it[3][pick.i] = null;
          }
          if (b.dataset.act === 'main') {
            ITEMS.forEach((it) => it[3].forEach((g) => g && (g.main = false)));
            ITEMS.find((x) => x[0] === pick.slot)[3][pick.i].main = true;
          }
          pick = null;
          again();
        }),
    );
  }

  window.STUDY = window.STUDY || {};
  window.STUDY.skills = { html, mount, next: 'Next: Strategy ▸' };
})();
