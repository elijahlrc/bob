/* Items tab (style study, Gold Leaf only): the level 42 Mystic's gear and a bag of loot, copied from the live game
   (the cards and the comparisons are real; a comparison after a swap is the old one turned round). It works: pick
   an item in the bag, aim at a slot on the reliquary, wear it, undo. */
(function () {
  // ---- The worn gear, as the live Items tab showed it ----
  const I = (o) => o;
  const WORN0 = {
    main: I({
      id: 'foil',
      name: 'Stormtongue Foil',
      rar: 'unique',
      base: 'Toothed Foil · One-Handed Sword',
      props: ['12–29 physical · 2.02 APS · 5.5% crit', 'Adds 1–45 lightning'],
      req: 'Requires level 22, 77 Dex',
      ilvl: 30,
      sockets: 'brr',
      mods: [
        '+25% to Critical Strike Multiplier',
        '+25% to Critical Strike Multiplier',
        'Adds 1 to 45 Lightning Damage',
        '26% increased Attack Speed',
        'Gain 2 Life per Enemy Hit with Attacks',
        '17% chance to Shock',
        'Deal no Physical Damage',
      ],
      gems: ['Raise Husk', 'Guardian Cairn', 'Thunder Rebuke'],
      kind: 'weapon',
    }),
    off: I({
      id: 'wall',
      name: 'Spidersilk Wall',
      rar: 'unique',
      base: 'Ironbound Shield',
      props: ['194 armour · 30% block'],
      req: 'Requires level 11, 33 Str',
      ilvl: 39,
      sockets: 'rgr',
      mods: [
        '+15 to maximum Life',
        '+19 to maximum Life',
        '+141 to Armour',
        '+37 to maximum Life',
        '+4% Chance to Block',
        "Your hits can't be Evaded",
      ],
      gems: ['Charged Blow', 'Pyre Burst', 'Dune Stance'],
      kind: 'weapon',
    }),
    helmet: I({
      id: 'cowl',
      name: 'Frost Guard',
      rar: 'rare',
      base: 'Burnished Cowl',
      props: ['111 evasion'],
      req: 'Requires level 20, 46 Dex',
      ilvl: 23,
      sockets: 'g',
      mods: [
        '10% increased Evasion Rating',
        '6% increased Stun and Block Recovery',
        '+26 to maximum Life',
        'Reflects 1 Physical Damage to Melee Attackers',
        '+12% to Cold Resistance',
        '+11 to Intelligence',
        '+14% to Lightning Resistance',
      ],
      gems: ['Keen Halo'],
      kind: 'armour',
    }),
    body: I({
      id: 'thorn',
      name: 'Thornwall',
      rar: 'unique',
      base: 'Dented Plate',
      props: ['2019 armour'],
      req: 'Requires level 1, 12 Str',
      ilvl: 39,
      sockets: 'gg',
      mods: [
        'Adds 2 to 4 Physical Damage to Attacks',
        '+2000 to Armour',
        '+16 to maximum Life',
        '2 Physical Damage taken from Attack Hits',
        '40% of Melee Physical Damage taken is reflected to the Attacker',
      ],
      gems: ['Rime Herald', 'Quickening Halo'],
      kind: 'armour',
    }),
    gloves: I({
      id: 'mitts',
      name: 'Frostgrief Mitts',
      rar: 'unique',
      base: 'Stitched Grips',
      props: ['76 evasion'],
      req: 'Requires level 9, 17 Dex',
      ilvl: 20,
      sockets: 'ooo',
      mods: [
        '+21 to Strength',
        '+44 to Evasion Rating',
        '+27% to Cold Resistance',
        'Adds 7 to 14 Cold Damage',
        '50% of Physical Damage Converted to Cold Damage',
        'Reflects 10 Cold Damage to Melee Attackers',
      ],
      gems: [],
      kind: 'armour',
    }),
    boots: I({
      id: 'treads',
      name: 'Sinewed Raider Treads of Embers',
      rar: 'magic',
      base: 'Raider Treads',
      props: ['65 armour · 65 evasion'],
      req: 'Requires level 36, 35 Str, 35 Dex',
      ilvl: 37,
      sockets: 'rbbg',
      mods: ['+5 to maximum Life', '+14% to Fire Resistance'],
      gems: ['Slag Blow', 'Spark Seed', 'Dense Blast', 'Knife Range'],
      kind: 'armour',
    }),
    ring1: I({
      id: 'yoke',
      name: 'Yokemark Ring',
      rar: 'unique',
      base: 'Hollow Ring',
      props: [],
      req: 'Requires level 5',
      ilvl: 32,
      sockets: 'o',
      mods: ['Hexes Enemies you Hit with level 10 Brittle Doom'],
      gems: [],
      kind: 'jewel',
    }),
    amulet: I({
      id: 'idol',
      name: 'Charging Idol',
      rar: 'unique',
      base: 'Feather Charm',
      props: [],
      req: 'Requires level 5',
      ilvl: 36,
      sockets: '',
      mods: [
        '+25 to Dexterity',
        '+25 to Strength',
        '7% increased Attack Speed',
        '+100 to Accuracy Rating',
        '30% increased Damage with Projectiles',
        '30% increased Projectile Speed',
        '10% increased Movement Speed',
      ],
      kind: 'jewel',
    }),
    ring2: I({
      id: 'pact',
      name: 'Pact Ring',
      rar: 'unique',
      base: 'Glass Ring',
      props: [],
      req: 'Requires level 1',
      ilvl: 25,
      sockets: '',
      mods: [
        '+25 to maximum Mana',
        '+12% to Cold Resistance',
        '+15% to Lightning Resistance',
        '+18 to Intelligence',
        '24% increased Lightning Damage',
        '40% increased Mana Regeneration Rate',
        '40% of Lightning Damage Converted to Cold Damage',
        '100% chance to Shock with Spells against Frozen Enemies',
      ],
      kind: 'jewel',
    }),
    belt: I({
      id: 'cord',
      name: 'Iron Cord',
      rar: 'rare',
      base: 'Rope Sash',
      props: [],
      req: 'Requires level 8',
      ilvl: 31,
      sockets: '',
      mods: [
        '+33 to maximum Life',
        '+6% to Cold Resistance',
        '+56 to maximum Life',
        '+14% to Lightning Resistance',
      ],
      kind: 'jewel',
    }),
    f1: I({
      id: 'life1',
      name: 'Runed Life Draught',
      rar: 'normal',
      props: ['10/25 charges · 6 s'],
      req: 'Requires level 36',
      mods: ['Recovers 1200 life'],
      liquid: 'life',
      kind: 'flask',
    }),
    f2: I({
      id: 'life2',
      name: 'Runed Life Draught',
      rar: 'normal',
      props: ['10/25 charges · 6 s'],
      req: 'Requires level 36',
      mods: ['Recovers 1200 life'],
      liquid: 'life',
      kind: 'flask',
    }),
    f3: I({
      id: 'mana',
      name: 'Gilded Mana Draught',
      rar: 'normal',
      props: ['8/38 charges · 5 s'],
      req: 'Requires level 30',
      mods: ['Recovers 350 mana'],
      liquid: 'mana',
      kind: 'flask',
    }),
    f4: I({
      id: 'keen',
      name: 'Lasting Keen Draught of Earthing',
      rar: 'magic',
      props: ['20/40 charges · 4 s'],
      req: 'Requires level 27',
      mods: [
        'Your Critical Strike Chance is Lucky',
        '31% increased Duration',
        'Removes Shock on use; Immunity to Shock during Flask effect',
      ],
      liquid: 'util',
      kind: 'flask',
    }),
    f5: I({
      id: 'smoke',
      name: 'Lasting Smokeveil Draught of the Rampart',
      rar: 'magic',
      props: ['10/30 charges · 5 s'],
      req: 'Requires level 14',
      mods: ['100% increased Evasion Rating', '34% increased Duration', '51% increased Armour'],
      liquid: 'green',
      kind: 'flask',
    }),
  };
  // ---- The bag: items with their comparisons per slot (dps and ehp in %, then the other changes) ----
  const BAG0 = [
    I({
      id: 'jerkin',
      name: 'Burnished Jerkin',
      rar: 'normal',
      isNew: true,
      base: 'Burnished Jerkin',
      props: ['284 evasion'],
      req: 'Requires level 28, 81 Dex',
      ilvl: 44,
      sockets: 'oooo',
      mods: [],
      kind: 'armour',
      type: 'Body',
      cmp: {
        body: {
          dps: -1,
          ehp: 39,
          more: [['−23 life', -1]],
          gems: 'Rime Herald and Quickening Halo move over; 2 sockets to spare.',
        },
      },
    }),
    I({
      id: 'knife',
      name: 'Smouldering Etched Bone Knife of Feeding',
      rar: 'magic',
      isNew: true,
      base: 'Etched Bone Knife · Dagger',
      props: ['3–26 physical · 1.45 APS · 6.3% crit', 'Adds 20–35 fire'],
      req: 'Requires level 10, 18 Dex, 26 Int',
      ilvl: 44,
      sockets: 'ooo',
      mods: [
        '30% increased Critical Strike Chance',
        'Adds 20 to 35 Fire Damage',
        'Gain 3 Life per Enemy Hit with Attacks',
      ],
      kind: 'weapon',
      type: 'One-hand',
      best: 'off',
      cmp: {
        off: {
          dps: -3,
          ehp: -37,
          more: [['−104 life', -1]],
          gems: 'Charged Blow, Pyre Burst and Dune Stance move over.',
        },
        main: {
          dps: -85,
          ehp: 0,
          more: [],
          warn: 'Raise Husk would sit idle: it needs a staff or a sceptre.',
        },
      },
    }),
    I({
      id: 'spark',
      name: 'Spark Ring',
      rar: 'normal',
      isNew: true,
      base: 'Spark Ring',
      props: [],
      req: 'Requires level 12',
      ilvl: 44,
      sockets: '',
      mods: ['+25% to Lightning Resistance'],
      kind: 'jewel',
      type: 'Ring',
      best: 'ring1',
      cmp: {
        ring1: { dps: -22, ehp: 7, more: [['+16% lightning res', 1]] },
        ring2: {
          dps: -7,
          ehp: -1,
          more: [
            ['−37 mana', -1],
            ['−12% cold res', -1],
            ['+10% lightning res', 1],
          ],
        },
      },
    }),
    I({
      id: 'cleaver',
      name: 'Broad Cleaver',
      rar: 'normal',
      isNew: true,
      base: 'Broad Cleaver · Two-Handed Axe',
      props: ['16–33 physical · 1.3 APS · 5% crit'],
      req: 'Requires level 13, 36 Str, 17 Dex',
      ilvl: 44,
      sockets: 'oo',
      mods: [],
      kind: 'weapon',
      type: 'Two-hand',
      cmp: {
        main: {
          dps: -56,
          ehp: -46,
          more: [['−104 life', -1]],
          warn: 'Two hands: Spidersilk Wall goes to the bag too, with Charged Blow, Pyre Burst and Dune Stance.',
          also: 'off',
        },
      },
    }),
    I({
      id: 'crown',
      name: 'Blessed Consecrated Crown of Renewal',
      rar: 'magic',
      isNew: true,
      base: 'Consecrated Crown',
      props: ['81 armour · 17 energy shield'],
      req: 'Requires level 22, 27 Str, 27 Int',
      ilvl: 44,
      sockets: 'o',
      mods: ['Regenerate 7 Life per second', '32% increased Armour and Energy Shield'],
      kind: 'armour',
      type: 'Helmet',
      cmp: {
        helmet: {
          dps: 0,
          ehp: -27,
          more: [
            ['−38 life', -1],
            ['+28 energy shield', 1],
            ['−6 mana', -1],
            ['−12% cold res', -1],
            ['−14% lightning res', -1],
          ],
          gems: 'Keen Halo moves over.',
        },
      },
    }),
    I({
      id: 'soll',
      name: 'Votive Sollerets',
      rar: 'normal',
      isNew: true,
      base: 'Votive Sollerets',
      props: ['65 armour · 13 energy shield'],
      req: 'Requires level 36, 35 Str, 35 Int',
      ilvl: 44,
      sockets: 'oo',
      mods: [],
      kind: 'armour',
      type: 'Boots',
      cmp: {
        boots: {
          dps: -22,
          ehp: -14,
          more: [
            ['−7 life', -1],
            ['+21 energy shield', 1],
            ['−14% fire res', -1],
          ],
          warn: 'Two sockets only: Dense Blast and Knife Range go to the bag.',
        },
      },
    }),
    I({
      id: 'mire',
      name: 'Lasting Mire Draught of Thawing',
      rar: 'magic',
      isNew: true,
      props: ['30/60 charges · 3.5 s'],
      req: 'Requires level 18',
      mods: [
        '+35% to Chaos Resistance',
        '33% increased Duration',
        'Removes Freeze and Chill on use; Immunity to Freeze and Chill during Flask effect',
      ],
      liquid: 'teal',
      kind: 'flask',
      type: 'Flask',
      best: 'f5',
      cmp: {
        f5: { note: 'The usual pick: the utility flask it does most for.' },
        f4: {},
        f3: { warn: 'This replaces your mana flask with a utility one.' },
        f2: { warn: 'This replaces a life flask with a utility one.' },
        f1: { warn: 'This replaces a life flask with a utility one.' },
      },
    }),
    I({
      id: 'helm',
      name: 'Fluted Helm',
      rar: 'normal',
      isNew: true,
      base: 'Fluted Helm',
      props: ['174 armour'],
      req: 'Requires level 35, 75 Str',
      ilvl: 44,
      sockets: 'o',
      mods: [],
      kind: 'armour',
      type: 'Helmet',
      cant: 'Needs 75 Strength; you have 60.',
      cmp: { helmet: {} },
    }),
    I({
      id: 'eye',
      name: 'Keen Eye',
      rar: 'gem',
      isNew: true,
      kind: 'gem',
      type: 'Support gem',
      gem: 'dex',
    }),
    // In the list only (their cards were not copied).
    ...[
      ['Frost Husk', 'rare', 'armour', 'Gloves', -25, -18],
      ["Skinner's Knife", 'normal', 'weapon', 'One-hand', -16, -37, '2 gems out'],
      ['Tomb Bulwark', 'rare', 'armour', 'Gloves', -26, -12],
      ['Plank Shield', 'normal', 'weapon', 'Off hand', null, -17],
      ['Wardsteel Sword of the Boulder', 'magic', 'weapon', 'One-hand', 'cant'],
      ['Honed Flensing Greatsword of Fury', 'magic', 'weapon', 'Two-hand', 'cant'],
      ['Blight Spiral', 'rare', 'jewel', 'Ring', -4, -10],
      ['Embroidered Wraps of Haste', 'magic', 'armour', 'Gloves', -23, -21],
      ['Shadowed Footwraps', 'normal', 'armour', 'Boots', -10, -11, '1 gem out'],
      ['Rune Ward', 'normal', 'weapon', 'Off hand', null, -12],
      ['Charged Ember-Rime Ring of Reaping', 'magic', 'jewel', 'Ring', -4, null],
      ['Inkstone Charm', 'normal', 'jewel', 'Amulet', -32, -3],
      ['Static Wellspring Charm', 'magic', 'jewel', 'Amulet', -28, -3],
      ['Bastion Plate', 'normal', 'armour', 'Body', 'cant'],
      ['Silvered Mana Draught', 'normal', 'flask', 'Flask'],
      ['Scorch Wave', 'gem', 'gem', 'Skill gem'],
    ].map(([name, rar, kind, type, dps, ehp, warn], i) => ({
      id: 'x' + i,
      name,
      rar,
      kind,
      type,
      isNew: true,
      listOnly: true,
      row: { dps, ehp, warn },
    })),
  ];
  const SLOTS = {
    helmet: ['Helmet', 'helm', 3, 1],
    ring1: ['Ring 1', 'ring', 2, 2],
    amulet: ['Amulet', 'amulet', 3, 2],
    ring2: ['Ring 2', 'ring', 4, 2],
    main: ['Main hand', 'blade', 1, 3],
    body: ['Body', 'body', 3, 3],
    off: ['Off hand', 'shield', 5, 3],
    gloves: ['Gloves', 'gloves', 1, 4],
    belt: ['Belt', 'belt', 3, 4],
    boots: ['Boots', 'boots', 3, 5],
    f1: ['Flask 1'],
    f2: ['Flask 2'],
    f3: ['Flask 3'],
    f4: ['Flask 4'],
    f5: ['Flask 5'],
  };
  const FILTERS = [
    ['all', 'all', 'Everything'],
    ['weapon', 'blade', 'Weapons'],
    ['armour', 'helm', 'Armour'],
    ['jewel', 'ring', 'Jewellery'],
    ['flask', 'flask', 'Flasks'],
    ['gem', 'gem', 'Gems'],
  ];
  const VIEWS = [
    ['all', 'All'],
    ['new', 'New'],
    ['up', 'Upgrades'],
    ['fav', '★'],
    ['gone', 'Discarded'],
  ];

  // ---- State ----
  let worn, bag, sel, aim, status, history, filter, view, gearOpen;
  function reset() {
    worn = structuredClone(WORN0);
    bag = structuredClone(BAG0);
    sel = null;
    aim = null;
    status = null;
    history = [];
    filter = 'all';
    view = 'all';
    gearOpen = false;
  }
  reset();
  const phone = () => document.documentElement.dataset.width === 'phone';
  const byId = (id) => bag.find((b) => b.id === id);
  const slotsOf = (it) => Object.keys(it.cmp ?? {});
  /** The best slot for an item: the higher sum of its two changes. */
  const best = (it) =>
    it.best ?? slotsOf(it).sort((a, b) => score(it.cmp[b]) - score(it.cmp[a]))[0];
  const score = (c) => (c?.dps ?? 0) + (c?.ehp ?? 0);
  const isUp = (it) =>
    !it.cant &&
    slotsOf(it).some(
      (s) => score(it.cmp[s]) > 0 && (it.cmp[s].ehp ?? 0) > 0 && (it.cmp[s].dps ?? 0) > -5,
    );

  // ---- Small pieces ----
  const pct = (v, what) =>
    v == null || v === 0
      ? ''
      : `<span class="${v > 0 ? 'lf-up' : 'lf-down'}">${v > 0 ? '▲' : '▼'}${Math.abs(v)}% ${what}</span>`;
  const verdict = (c) => [pct(c?.dps, 'DPS'), pct(c?.ehp, 'EHP')].filter(Boolean).join(' ');
  const stones = (s, size = 'sm') =>
    s
      ? `<span class="ix-stones">${s
          .split('')
          .map(
            (g) =>
              `<span class="ix-stone ${size}" data-paint="gem" data-gem="${{ r: 'str', g: 'dex', b: 'int', o: 'empty' }[g]}" data-pk="${g}"></span>`,
          )
          .join('')}</span>`
      : '';
  const HEAD = { normal: 'plaster', magic: 'sky', rare: 'gold', unique: 'vermilion', gem: 'green' };

  /** An item card; `vs` marks the lines this card has and the other does not (gained on the new one, lost on the worn). */
  function card(it, { vs, side, label } = {}) {
    if (!it)
      return `<div class="ix-leaf ix-none" data-paint="panel"><div class="ix-label">${label}</div><p class="muted">Nothing worn here.</p></div>`;
    const other = new Set(vs?.mods ?? []);
    const mark = vs ? (side === 'new' ? 'gain' : 'lose') : '';
    return `<div class="ix-leaf" data-paint="panel">
      ${label ? `<div class="ix-label">${label}</div>` : ''}
      <div class="ix-cardhead r-${it.rar}" data-paint="panel" data-thin data-field="${HEAD[it.rar] ?? 'plaster'}" data-pk="${it.rar}">${it.name}</div>
      ${it.base ? `<div class="ix-base">${it.base}</div>` : ''}
      ${(it.props ?? []).map((p) => `<div class="ix-prop">${p}</div>`).join('')}
      <div class="ix-req${it.cant ? ' bad' : ''}">${it.req ?? ''}${it.ilvl ? ` · item level ${it.ilvl}` : ''}</div>
      ${it.sockets ? `<div class="ix-sockrow">${stones(it.sockets)}<span class="muted">${it.sockets.length > 1 ? 'linked' : ''}</span></div>` : ''}
      ${it.mods?.length ? `<ul class="ix-mods">${it.mods.map((m) => `<li class="${vs && !other.has(m) ? mark : ''}">${m}</li>`).join('')}</ul>` : ''}
    </div>`;
  }

  function gemCard(it) {
    return `<div class="ix-single">
      <div class="ix-leaf" data-paint="panel">
        <div class="ix-cardhead r-gem" data-paint="panel" data-thin data-field="green" data-pk="gem">${it.name}</div>
        <div class="ix-base">Support gem · Level 10</div>
        <div class="ix-prop">Supports attack skills</div>
        <ul class="ix-mods"><li>+10% mana cost of the supported skill</li><li>+152.6 to Accuracy Rating</li></ul>
        <div class="ix-req">Requires level 40, 61 Dex</div>
      </div>
      <div class="ix-side">
        <div class="ix-verdict" data-paint="panel" data-field="porphyry" data-thin><span class="ix-vlabel">Best socket</span><b class="lf-up">▲2%</b><span>DPS in Spidersilk Wall, instead of Charged Blow</span></div>
        <div class="ix-acts"><button class="btn primary" data-paint="panel" data-thin data-field="vermilion">Socket it…</button></div>
        <p class="muted ix-why">Gems are placed on the Skills tab; this opens it with Keen Eye picked.</p>
      </div>
    </div>`;
  }

  // ---- The stage: what is picked, compared with where it would go ----
  function stage() {
    const st = status
      ? `<div class="ix-status" data-paint="panel" data-thin><span>${status}</span><button class="btn small" data-paint="panel" data-thin data-act="undo">Undo</button></div>`
      : '';
    if (!sel) {
      const ups = bag.filter(isUp);
      return `${st}<div class="ix-guide">
        <div class="lf-medals">
          <div class="medal md-m" data-field="vermilion,4"><span>Damage per second</span><b>8,095</b></div>
          <div class="medal md-m" data-field="porphyry,4"><span>Effective HP</span><b>30,788</b></div>
        </div>
        <p class="ix-hint" data-paint="panel" data-thin>Pick something in the bag to see it beside what you wear.</p>
        ${ups.length ? `<button class="btn primary" data-paint="panel" data-thin data-field="vermilion" data-pick="${ups[0].id}">${ups.length} upgrade waiting: show it</button>` : ''}
      </div>`;
    }
    if (sel.where === 'worn') {
      const it = worn[sel.slot];
      return `${st}<div class="ix-single">${card(it, { label: `Worn: ${SLOTS[sel.slot][0]}` })}
        <div class="ix-side">
          ${it?.gems?.length ? `<p class="ix-gems">Its gems: ${it.gems.join(', ')}.</p>` : ''}
          <div class="ix-acts">${it ? '<button class="btn" data-paint="panel" data-thin data-act="off">Take off</button>' : ''}<button class="btn" data-paint="panel" data-thin data-act="close">Close</button></div>
        </div></div>`;
    }
    const it = byId(sel.id);
    if (!it) return st;
    if (it.kind === 'gem' && !it.listOnly) return st + gemCard(it);
    if (it.listOnly)
      return `${st}<div class="ix-single"><div class="ix-leaf" data-paint="panel"><div class="ix-cardhead r-${it.rar}" data-paint="panel" data-thin data-field="${HEAD[it.rar]}" data-pk="${it.rar}">${it.name}</div><p class="muted">This one's card was not copied into the mockup.</p></div></div>`;
    const slots = slotsOf(it);
    const s = aim && slots.includes(aim) ? aim : best(it);
    const c = it.cmp[s] ?? {};
    const w = worn[s];
    const tabs =
      slots.length > 1
        ? `<div class="ix-aims">${slots
            .map(
              (k) =>
                `<button class="ix-aim${k === s ? ' on' : ''}" data-paint="panel" data-thin data-field="${k === s ? 'gold' : 'lapis'}" data-pk="${k === s ? 'on' : 'off'}" data-aim="${k}"><b>${SLOTS[k][0]}</b><span>${verdict(it.cmp[k]) || (it.cmp[k].note ? 'usual pick' : '&nbsp;')}</span></button>`,
            )
            .join('')}</div>`
        : '';
    const big = (v, label) =>
      `<div class="ix-big"><b class="${v > 0 ? 'lf-up' : v < 0 ? 'lf-down' : ''}">${v > 0 ? '+' : v < 0 ? '−' : '±'}${Math.abs(v ?? 0)}%</b><span>${label}</span></div>`;
    const changes =
      c.dps != null || c.ehp != null
        ? `<div class="ix-verdict" data-paint="panel" data-field="porphyry" data-thin>${big(c.dps, 'damage')}${big(c.ehp, 'effective HP')}${(c.more ?? []).length ? `<div class="ix-more">${c.more.map(([t, v]) => `<span class="${v > 0 ? 'lf-up' : 'lf-down'}">${t}</span>`).join('')}</div>` : ''}</div>`
        : '';
    const goes = w ? `${w.name} goes to the bag.` : '';
    const action = it.cant
      ? `<div class="ix-warn" data-paint="panel" data-thin data-field="vermilion">${it.cant}</div>`
      : `<div class="ix-actbar" data-paint="panel" data-thin><div class="ix-acts"><button class="btn primary" data-paint="panel" data-thin data-field="vermilion" data-act="wear" data-slot="${s}">Wear ${it.kind === 'jewel' && /ring/.test(s) ? 'as' : 'in'} ${SLOTS[s][0]}</button>
         <button class="btn" data-paint="panel" data-thin data-act="fav">${it.fav ? '★' : '☆'} Favourite</button><button class="btn" data-paint="panel" data-thin data-act="discard">Discard</button></div>
         ${goes || c.gems ? `<p class="ix-goes">${goes}${c.also && worn[c.also] ? ` So does ${worn[c.also].name}.` : ''}${c.gems ? ` ${c.gems}` : ''}</p>` : ''}</div>`;
    const leaves = phone()
      ? `${card(it, { vs: w, side: 'new', label: it.justOff ? 'Just taken off' : 'New' })}${w ? `<details class="ix-worn-peek"><summary>Worn now: ${w.name}</summary>${card(w, { vs: it, side: 'worn' })}</details>` : ''}`
      : `<div class="ix-diptych">${card(it, { vs: w, side: 'new', label: it.justOff ? 'Just taken off' : 'New' })}<span class="ix-hinge"><i data-paint="chain"></i><i data-paint="chain"></i></span>${card(w, { vs: it, side: 'worn', label: `Worn: ${SLOTS[s][0]}` })}</div>`;
    return `${st}${tabs}${changes}
      ${c.warn ? `<div class="ix-warn" data-paint="panel" data-thin data-field="vermilion">${c.warn}</div>` : ''}
      ${c.note ? `<p class="ix-goes">${c.note}</p>` : ''}
      ${phone() ? action + leaves : leaves + action}`;
  }

  // ---- The reliquary: worn gear on the shadow of a soul, by body position; flasks at its foot ----
  function reliquary() {
    const it = sel?.where === 'bag' ? byId(sel.id) : null;
    const cand = it && !it.listOnly ? slotsOf(it) : [];
    const aimed =
      it && cand.length
        ? aim && cand.includes(aim)
          ? aim
          : best(it)
        : sel?.where === 'worn'
          ? sel.slot
          : null;
    const state = (k) => (k === aimed ? 'aim' : cand.includes(k) ? 'target' : '');
    const dim = (k) => (cand.length && !cand.includes(k) ? ' dim' : '');
    const slot = (k) => {
      const [label, glyph, col, row] = SLOTS[k];
      const w = worn[k];
      return `<button class="ix-slot${dim(k)}" style="grid-column:${col};grid-row:${row}" data-slot="${k}" data-paint="slot" data-rar="${w?.rar ?? 'empty'}" data-glyph="${glyph}" data-sockets="${w?.sockets ?? ''}" data-state="${state(k)}" data-pk="${w?.id ?? 'none'}${state(k)}" aria-label="${label}: ${w?.name ?? 'empty'}"><span class="ix-slottip">${label}: ${w?.name ?? 'empty'}</span></button>`;
    };
    const flask = (k) => {
      const w = worn[k];
      return `<button class="ix-flask${dim(k)}${state(k) ? ' ' + state(k) : ''}" data-slot="${k}" aria-label="${SLOTS[k][0]}: ${w?.name ?? 'empty'}"><i data-paint="bottle" data-liquid="${w?.liquid ?? 'util'}" data-pk="${w?.id}"></i><span class="ix-slottip">${w?.name ?? 'empty'}</span></button>`;
    };
    return `<div class="ix-reliq" data-paint="soul" data-rows="0.214,0.343,0.471,0.6,0.729" data-pk="s">
      <div class="ix-grid">${Object.keys(SLOTS)
        .filter((k) => SLOTS[k][1])
        .map(slot)
        .join('')}</div>
      <div class="ix-flasks">${['f1', 'f2', 'f3', 'f4', 'f5'].map(flask).join('')}</div>
    </div>`;
  }

  // ---- The bag ----
  function rowHtml(it) {
    const on = sel?.where === 'bag' && sel.id === it.id;
    let sub;
    if (it.listOnly) {
      const r = it.row;
      sub =
        r.dps === 'cant'
          ? '<span class="lf-down">can’t use</span>'
          : [
              pct(r.dps, 'DPS'),
              pct(r.ehp, 'EHP'),
              r.warn ? `<span class="ix-w">${r.warn}</span>` : '',
            ].join(' ');
    } else if (it.cant) sub = '<span class="lf-down">can’t use</span>';
    else if (it.kind === 'gem') sub = '<span class="lf-up">▲2% DPS</span> in Spidersilk Wall';
    else {
      const b = best(it);
      const c = it.cmp[b] ?? {};
      sub = `${slotsOf(it).length > 1 && it.kind !== 'flask' ? `→ ${SLOTS[b][0]} ` : ''}${verdict(c)}${c.warn ? ' <span class="ix-w">⚠</span>' : ''}`;
    }
    return `<button class="ix-row${on ? ' on' : ''}" data-pick="${it.id}" ${on ? 'data-paint="panel" data-thin data-field="lapis" data-pk="on"' : ''}>
      <span class="ix-rowname r-${it.rar}">${it.isNew ? '<i class="ix-new" title="New"></i>' : ''}${it.fav ? '<span class="ix-favmark">★</span> ' : ''}${it.name}</span>
      <span class="ix-rowsub"><span class="muted">${it.type ?? ''}</span> ${sub}</span>
    </button>`;
  }
  function bagPanel() {
    const list = bag.filter(
      (it) =>
        (filter === 'all' || it.kind === filter) &&
        (view === 'all' ||
          (view === 'new' && it.isNew) ||
          (view === 'up' && isUp(it)) ||
          (view === 'fav' && it.fav)) &&
        view !== 'gone',
    );
    const count = (v) =>
      v === 'new'
        ? bag.filter((b) => b.isNew).length
        : v === 'up'
          ? bag.filter(isUp).length
          : v === 'fav'
            ? bag.filter((b) => b.fav).length
            : '';
    return `<section class="ix-bag" data-paint="panel">
      <div class="ix-baghead"><h4>Bag</h4><span class="ix-cap"><i style="width:${(bag.length / 60) * 100}%"></i></span><span class="muted">${bag.length} / 60</span></div>
      <div class="ix-views">${VIEWS.map(([v, t]) => `<button class="ix-view${v === view ? ' on' : ''}" data-view="${v}" ${v === view ? 'data-paint="panel" data-thin data-field="gold" data-pk="on"' : ''}>${t}${count(v) ? ` <span>${count(v)}</span>` : ''}</button>`).join('')}</div>
      <div class="ix-kinds">${FILTERS.map(([f, g, t]) => `<button class="ix-kind${f === filter ? ' on' : ''} tip" data-tip="${t}" data-filter="${f}" ${f === filter ? 'data-paint="panel" data-thin data-field="gold" data-pk="on"' : 'data-paint="panel" data-thin data-pk="off"'}><i data-paint="glyph" data-glyph="${g}" data-pk="${g}${f === filter}"></i></button>`).join('')}</div>
      <div class="ix-tools"><span class="ix-search" data-paint="panel" data-thin data-field="lapis"><input placeholder="Search the bag" /></span>
        <span class="sel" data-paint="panel" data-thin><select><option>Newest</option><option>Best upgrade</option><option>Slot</option><option>Rarity</option><option>Name</option></select></span></div>
      <div class="ix-list">${list.map(rowHtml).join('') || '<p class="muted">Nothing here.</p>'}</div>
    </section>`;
  }

  const html = () => {
    if (phone())
      return `<div class="ix">
        <button class="ix-gearbar" data-paint="panel" data-thin data-act="gear"><span>Gear · 10 worn · 4 free sockets</span><span>${gearOpen ? '▴' : '▾'}</span></button>
        ${gearOpen ? reliquary() : ''}
        ${bagPanel()}
        ${sel ? `<div class="ix-sheet" data-paint="panel"><div class="ix-sheethead"><span>${sel.where === 'bag' ? byId(sel.id)?.name : (worn[sel.slot]?.name ?? SLOTS[sel.slot][0])}</span><button class="btn sq" data-paint="panel" data-thin data-act="close" aria-label="Close">×</button></div>${stage()}</div>` : status ? `<div class="ix-sheet" data-paint="panel">${stage()}</div>` : ''}
      </div>`;
    return `<div class="ix">${reliquary()}<div class="ix-stage">${stage()}</div>${bagPanel()}</div>`;
  };

  // ---- Acting ----
  function wear(id, s) {
    const it = byId(id);
    history.push(structuredClone({ worn, bag, sel, aim }));
    const old = worn[s];
    const c = it.cmp[s];
    bag = bag.filter((b) => b.id !== id);
    const { cmp, isNew, justOff, ...clean } = it;
    worn[s] = { ...clean, gems: old?.gems ?? [] };
    const back = [];
    if (old) back.push([old, s, c]);
    if (c.also && worn[c.also]) {
      back.push([worn[c.also], c.also, null]);
      worn[c.also] = null;
    }
    // What went back to the bag is compared with what took its place: the old comparison, turned round.
    for (const [o, slot, cc] of back) {
      const turned = cc
        ? {
            dps: -(cc.dps ?? 0),
            ehp: -(cc.ehp ?? 0),
            more: (cc.more ?? []).map(([t, v]) => [
              t.replace(/^[−+]/, (m) => (m === '−' ? '+' : '−')),
              -v,
            ]),
          }
        : {};
      bag.unshift({
        ...o,
        gems: undefined,
        justOff: true,
        type: SLOTS[slot][0],
        cmp: { [slot]: turned },
      });
    }
    status = `Wearing ${it.name} in ${SLOTS[s][0]}.${old ? ` ${old.name} went to the bag.` : ''}`;
    sel = old ? { where: 'bag', id: old.id } : null;
    aim = null;
  }

  function mount(frame) {
    const list = frame.querySelector('.ix-list');
    if (list) list.scrollTop = mount.scroll ?? 0;
    const go = () => {
      mount.scroll = frame.querySelector('.ix-list')?.scrollTop ?? 0;
      window.studyRender();
    };
    frame.querySelectorAll('[data-pick]').forEach(
      (b) =>
        (b.onclick = () => {
          const id = b.dataset.pick;
          sel = sel?.where === 'bag' && sel.id === id ? null : { where: 'bag', id };
          aim = null;
          const it = byId(id);
          if (it) it.isNew = false;
          go();
        }),
    );
    frame.querySelectorAll('[data-slot]:not([data-act])').forEach(
      (b) =>
        (b.onclick = () => {
          const k = b.dataset.slot;
          const it = sel?.where === 'bag' ? byId(sel.id) : null;
          // A lit slot is a place to put what is picked; any other slot shows what is worn there.
          if (it && slotsOf(it).includes(k)) aim = k;
          else {
            sel = sel?.where === 'worn' && sel.slot === k ? null : { where: 'worn', slot: k };
            aim = null;
          }
          status = null;
          go();
        }),
    );
    frame
      .querySelectorAll('[data-aim]')
      .forEach((b) => (b.onclick = () => ((aim = b.dataset.aim), go())));
    frame
      .querySelectorAll('[data-view]')
      .forEach((b) => (b.onclick = () => ((view = b.dataset.view), go())));
    frame
      .querySelectorAll('[data-filter]')
      .forEach((b) => (b.onclick = () => ((filter = b.dataset.filter), go())));
    frame.querySelectorAll('[data-act]').forEach(
      (b) =>
        (b.onclick = () => {
          const a = b.dataset.act;
          if (a === 'wear') wear(sel.id, b.dataset.slot);
          if (a === 'undo' && history.length) {
            ({ worn, bag, sel, aim } = history.pop());
            status = null;
          }
          if (a === 'close') ((sel = null), (status = null));
          if (a === 'gear') gearOpen = !gearOpen;
          if (a === 'fav') {
            const it = byId(sel.id);
            it.fav = !it.fav;
          }
          if (a === 'discard') {
            history.push(structuredClone({ worn, bag, sel, aim }));
            const it = byId(sel.id);
            bag = bag.filter((x) => x !== it);
            status = `${it.name} is in the discarded pile.`;
            sel = null;
          }
          if (a === 'off') {
            history.push(structuredClone({ worn, bag, sel, aim }));
            const it = worn[sel.slot];
            bag.unshift({
              ...it,
              gems: undefined,
              justOff: true,
              type: SLOTS[sel.slot][0],
              cmp: { [sel.slot]: {} },
            });
            worn[sel.slot] = null;
            status = `${it.name} went to the bag.`;
            sel = null;
          }
          go();
        }),
    );
  }

  window.STUDY = window.STUDY || {};
  window.STUDY.items = { html, mount, next: 'Next: Skills ▸', reset };
})();
