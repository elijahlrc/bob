import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Rng } from '../core/rng';
import { UNIQUES } from '../data/uniques';
import { rollUnique } from '../gen/loot';
import type { Build } from '../data/types';
import { Controller } from '../run/controller';
import type { MySnapshot, Rival } from '../run/rivals';
import { newRun, SAVE_VERSION } from '../run/run';
import { postRun, resetPostKeeper } from '../rivals';
import { DuelResultView } from './DuelResult';
import { HighScoresView } from './HighScores';
import { DUEL_TITLE, Rivals } from './Rivals';
import { RivalsOptIn } from './RivalsOptIn';
import { Summary } from './Summary';

// The screens are plain functions of the controller and the saved preferences: hooks are stood in for by their first value, so that
// each one can be called and its tree read as text. There is no DOM here, so this is how the text of every screen was checked.
vi.mock('preact/hooks', () => ({
  useState: (v: unknown) => [typeof v === 'function' ? (v as () => unknown)() : v, () => undefined],
  useEffect: () => undefined,
}));

type V = { type: unknown; props: Record<string, unknown> };

/** Every host element of a tree, function components called as the renderer would. */
function visit(n: unknown, fn: (v: V) => void): void {
  if (n === null || n === undefined || typeof n === 'boolean' || typeof n !== 'object') return;
  if (Array.isArray(n)) {
    for (const x of n) visit(x, fn);
    return;
  }
  const v = n as V;
  if (typeof v.type === 'function') {
    visit((v.type as (p: Record<string, unknown>) => unknown)({ ...v.props }), fn);
    return;
  }
  fn(v);
  visit(v.props.children, fn);
}

/** The words of a tree, in order, as the page would show them. */
function text(n: unknown): string {
  if (n === null || n === undefined || typeof n === 'boolean') return '';
  if (typeof n === 'string' || typeof n === 'number') return String(n);
  if (Array.isArray(n)) return n.map(text).join('');
  const v = n as V;
  if (typeof v.type === 'function') {
    return text((v.type as (p: Record<string, unknown>) => unknown)({ ...v.props }));
  }
  return text(v.props.children);
}

const hosts = (tree: unknown, pred: (v: V) => boolean): V[] => {
  const out: V[] = [];
  visit(tree, (v) => pred(v) && out.push(v));
  return out;
};
const buttons = (tree: unknown): V[] => hosts(tree, (v) => v.type === 'button');
const labels = (tree: unknown): string[] => buttons(tree).map((b) => text(b.props.children));
/** The buttons that are not a rival's card. */
const controls = (tree: unknown): string[] =>
  buttons(tree)
    .filter((b) => b.props.class !== 'rival-card')
    .map((b) => text(b.props.children));
const button = (tree: unknown, label: string): V => {
  const b = buttons(tree).find((x) => text(x.props.children) === label);
  if (!b) throw new Error(`no button "${label}" among ${labels(tree).join(' | ')}`);
  return b;
};
const click = (b: V) => (b.props.onClick as () => void)();
const all = (tree: unknown): string => text(tree);

/** A browser that is just enough: a window with storage holding these preferences, and a fetch that takes whatever is posted. */
function browser(prefs: Record<string, unknown> = {}) {
  const store = new Map<string, string>(
    Object.entries(prefs).map(([k, v]) => [`bob.pref.${k}`, JSON.stringify(v)]),
  );
  vi.stubGlobal('window', {
    location: { hostname: 'bob.example.org' },
    localStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    },
  });
  const posted: { url: string; body: Record<string, unknown>[] }[] = [];
  vi.stubGlobal('fetch', async (url: string, init: { body: string }) => {
    posted.push({ url, body: JSON.parse(init.body) });
    return { ok: true, status: 201 };
  });
  return { store, posted };
}

beforeEach(() => resetPostKeeper());
afterEach(() => vi.unstubAllGlobals());

const starter = (cls: string, seed = 1): Build => newRun(cls, seed).build;

function rivalOf(id: number, over: Partial<Rival> = {}): Rival {
  const build = over.build ?? starter(['strider', 'mystic', 'reaver', 'zealot'][id % 4], id);
  return {
    id: String(id),
    name: `Rival ${id}`,
    classId: build.classId,
    level: build.level,
    map: 10,
    outcome: 'died',
    difficulty: { scaling: 9.99, base: 7.77, variance: 0.55 },
    saveVersion: SAVE_VERSION,
    gameVersion: 'abc1234',
    bot: false,
    rating: 540,
    fights: 12,
    wins: 7,
    build,
    ...over,
  };
}

const mine = (id = 41, rating = 410): MySnapshot => ({
  id: String(id),
  createdAt: '2026-10-17T09:30:00+00:00',
  name: 'Wren',
  classId: 'vanguard',
  level: 1,
  map: 12,
  outcome: 'died',
  saveVersion: SAVE_VERSION,
  rating,
  fights: 0,
  wins: 0,
});

/** The run has ended in a death: the summary screen, with the rivals screen open and filled with `pool`. */
function onSummary(pool: Rival[] | null = null) {
  const c = new Controller(null);
  c.startRun('vanguard', 77);
  c.run!.phase = 'dead';
  c.run!.map = 12;
  c.goTo('summary');
  if (pool) {
    c.openRivals();
    c.fillRivals(mine(), pool);
  }
  return c;
}

function fightRival(c: Controller, rival: Rival) {
  c.setSpeed(8);
  expect(c.startRivalDuel(rival, '41', 'Wren')).toBe(true);
  for (let i = 0; i < 20000 && c.screen === 'map'; i++) c.bus.emit('frame', { dtMs: 100 });
  expect(c.screen).toBe('duelResult');
}

describe('the result of a duel', () => {
  it('is Again and Back for the Debug panel’s duel, with no word of a rating', () => {
    const c = new Controller(null);
    c.startRun('vanguard', 1);
    c.setSpeed(8);
    c.startDuel(c.run!.build, starter('strider', 2), 3);
    for (let i = 0; i < 20000 && c.screen === 'map'; i++) c.bus.emit('frame', { dtMs: 100 });
    const view = DuelResultView({ c });
    expect(labels(view)).toEqual(['Again', 'Back']);
    expect(all(view)).not.toMatch(/Rated|Practice|Unrated|Rating/);
    click(button(view, 'Back'));
    expect(c.screen).toBe('camp');
  });

  it('says in a line what a fight against a rival counted for', () => {
    const c = onSummary([rivalOf(1)]);
    fightRival(c, c.rivals!.shown[0]);
    const line = () =>
      text(hosts(DuelResultView({ c }), (v) => v.props.class === 'duel-standing')[0]);
    const rv = c.lastDuel!.rival!;
    expect(rv.report).toBe('failed');
    for (const [state, want] of [
      [{ report: 'sending' }, 'Rating…'],
      [{ report: 'rated', rating: { before: 240, after: 318 } }, 'Rated · 240 → 318'],
      [{ report: 'rated', rating: undefined }, 'Rated'],
      [{ report: 'already' }, 'Rated'],
      [
        { report: 'refused', message: 'a bot does not report its fights' },
        'Unrated: a bot does not report its fights',
      ],
      [{ report: 'refused', message: undefined }, 'Unrated: refused'],
      [{ report: 'failed' }, 'Unrated: offline'],
      [{ rated: false, report: null }, 'Practice'],
    ] as [Partial<typeof rv>, string][]) {
      Object.assign(rv, { rated: true, rating: undefined, message: undefined }, state);
      expect(line(), JSON.stringify(state)).toBe(want);
    }
  });

  it('offers Again, Another rival and Back: Again is practice, the cards come back, Back is the summary', () => {
    const c = onSummary([rivalOf(1), rivalOf(2)]);
    const rival = c.rivals!.shown[0];
    fightRival(c, rival);
    expect(labels(DuelResultView({ c }))).toEqual(['Again', 'Another rival', 'Back']);
    click(button(DuelResultView({ c }), 'Again'));
    expect(c.screen).toBe('map');
    expect(c.duel!.rival!.rated).toBe(false);
    for (let i = 0; i < 20000 && c.screen === 'map'; i++) c.bus.emit('frame', { dtMs: 100 });
    expect(text(hosts(DuelResultView({ c }), (v) => v.props.class === 'duel-standing')[0])).toBe(
      'Practice',
    );
    const shown = c.rivals!.shown.map((r) => r.id);
    click(button(DuelResultView({ c }), 'Another rival'));
    expect(c.screen).toBe('rivals');
    expect(c.rivals!.shown.map((r) => r.id)).toEqual(shown);
    // The card says what the player has done against that rival.
    const cards = hosts(Rivals({ c }), (v) => v.props.class === 'rival-card');
    expect(cards.map((card) => text(card.props.children)).join(' ')).toContain('you: ');
    fightRival(c, rival);
    click(button(DuelResultView({ c }), 'Back'));
    expect(c.screen).toBe('summary');
  });
});

describe('the Rivals screen', () => {
  it('has the feature’s name for a heading, and Back, whatever it found', () => {
    const c = onSummary();
    c.openRivals();
    for (const [status, line] of [
      ['loading', 'Looking for rivals…'],
      ['offline', 'Could not reach the rivals'],
      ['empty', 'No rivals near this map'],
    ] as const) {
      if (status !== 'loading') c.failRivals(status);
      const view = Rivals({ c });
      expect(text(hosts(view, (v) => v.type === 'h2')[0])).toBe(DUEL_TITLE);
      expect(DUEL_TITLE).toBe("Duel for your damned soul's fate");
      expect(all(view)).toContain(line);
      expect(labels(view)).toEqual(['Back']);
    }
    c.failRivals('unsent', 'name');
    expect(all(Rivals({ c }))).toContain('That name is not allowed');
    c.failRivals('unsent', 'unreachable');
    expect(all(Rivals({ c }))).toContain('Your character could not be sent');
    click(button(Rivals({ c }), 'Back'));
    expect(c.screen).toBe('summary');
  });

  it('offers one retry for a character that did not get there only when the post failed, never for a refused name', async () => {
    browser({ rivals: true, rivalName: 'Wren' });
    const c = onSummary();
    c.openRivals();
    c.failRivals('unsent', 'unreachable');
    // No post failed (none was made): nothing to retry.
    expect(labels(Rivals({ c }))).toEqual(['Back']);
    vi.stubGlobal('fetch', async () => ({ ok: false, status: 503 }));
    await postRun(c.run!, null);
    expect(labels(Rivals({ c }))).toEqual(['Try again', 'Back']);
    c.failRivals('unsent', 'name');
    expect(labels(Rivals({ c }))).toEqual(['Back']);
  });

  it('is five cards with who, what they reached, where they stand, what they built and what you did, and never the difficulty', () => {
    const withUnique = starter('reaver', 5);
    withUnique.equipment.amulet = rollUnique(
      new Rng(1),
      (() => {
        let n = 900;
        return () => n++;
      })(),
      UNIQUES[0],
      40,
    );
    const pool = [
      rivalOf(1, {
        build: withUnique,
        classId: 'reaver',
        name: 'Ash Walker',
        rating: 570,
        fights: 12,
        wins: 7,
      }),
      rivalOf(2, { bot: true, outcome: 'won', map: 100, name: 'Cinder' }),
      rivalOf(3),
      rivalOf(4),
      rivalOf(5),
      rivalOf(6),
      rivalOf(7),
    ];
    const c = onSummary(pool);
    // A record against the first of the pool.
    c.book.noteFight('41', '1', 10, true);
    c.book.noteFight('41', '1', 11, false);
    c.book.noteFight('41', '1', 12, true);
    c.rivals!.shown = pool.slice(0, 5);
    const view = Rivals({ c });
    const cards = hosts(view, (v) => v.props.class === 'rival-card');
    expect(cards).toHaveLength(5);
    const words = cards.map((card) => text(card.props.children));
    expect(words[0]).toContain('Ash Walker');
    expect(words[0]).toContain('Reaver · level 1');
    expect(words[0]).toContain('map 10, died');
    expect(words[0]).toContain('rating 570 · 7 of 12 won');
    expect(words[0]).toContain(UNIQUES[0].name);
    expect(words[0]).toContain('you: 2 of 3');
    expect(words[0]).not.toContain('bot');
    expect(words[1]).toContain('map 100, won');
    expect(words[1]).toContain('bot');
    expect(words[1]).not.toContain('you:');
    expect(all(view)).not.toMatch(/difficulty|scaling|9\.99|7\.77|0\.55/i);
    // Show others: only when the pool has more than the cards.
    expect(controls(view)).toEqual(['Show others', 'Back']);
    const before = c.rivals!.shown.map((r) => r.id);
    click(button(view, 'Show others'));
    expect(c.rivals!.shown.map((r) => r.id)).not.toEqual(before);
    const small = onSummary(pool.slice(0, 5));
    expect(controls(Rivals({ c: small }))).toEqual(['Back']);
  });

  it('starts the duel when a card is pressed, and drops a card whose snapshot will not start, with no message', () => {
    // A snapshot that passed the checks of the wire and will not make a world: its card is drawn, and pressing it drops the card.
    const bad = rivalOf(9, {
      classId: 'strider',
      build: { ...starter('strider', 9), classId: 'nonesuch' },
    });
    const c = onSummary([bad, rivalOf(1), rivalOf(2), rivalOf(3), rivalOf(4), rivalOf(5)]);
    c.rivals!.shown = [bad, ...c.rivals!.pool.slice(1, 5)];
    const view = Rivals({ c });
    const cards = hosts(view, (v) => v.props.class === 'rival-card');
    expect(text(cards[0].props.children)).toContain('Rival 9');
    click(cards[0] as V);
    expect(c.screen).toBe('rivals');
    expect(c.duel).toBeNull();
    const after = Rivals({ c });
    expect(all(after)).not.toContain('Rival 9');
    expect(hosts(after, (v) => v.props.class === 'rival-card')).toHaveLength(5);
    // Not a word of it on the screen.
    expect(all(after)).not.toMatch(/could not|failed|error/i);
    click(hosts(after, (v) => v.props.class === 'rival-card')[0]);
    expect(c.screen).toBe('map');
    expect(c.duel!.rival!.rated).toBe(true);
    expect(c.duel!.names[0]).toBe('Wren');
  });
});

describe('the run summary’s rivals block', () => {
  const duelButton = (view: unknown) =>
    buttons(view).find((b) => text(b.props.children) === DUEL_TITLE);
  const checkbox = (view: unknown) =>
    hosts(view, (v) => v.type === 'input' && v.props.type === 'checkbox')[0];
  const nameField = (view: unknown) =>
    hosts(view, (v) => v.type === 'input' && v.props.type === 'text')[0];
  const denied = () =>
    vi.stubGlobal('fetch', async () => ({
      ok: false,
      status: 400,
      json: async () => ({ code: '23514', message: 'that name is not allowed' }),
    }));

  it('is always the button, with the opt-in under it; pressed with the box off or no valid name it asks and goes nowhere', () => {
    const { store, posted } = browser({ rivals: false });
    const c = onSummary();
    let view = Summary({ c });
    expect(all(view)).toContain(
      'Add my characters to the rivals and high scores other players see',
    );
    expect(checkbox(view)).toBeDefined();
    expect(nameField(view)).toBeUndefined();
    expect(duelButton(view)).toBeDefined();
    // Pressed with the box off: the box goes on, a name is asked for, nothing is posted and the screen stays.
    click(duelButton(view)!);
    expect(c.screen).toBe('summary');
    expect(store.get('bob.pref.rivals')).toBe('true');
    expect(posted).toHaveLength(0);
    vi.unstubAllGlobals();
    browser({});
    view = Summary({ c });
    // On by default: the name field is there with its hint, and so is the button.
    expect(nameField(view)).toBeDefined();
    expect(all(view)).toContain('A name is needed to duel');
    expect(all(view)).not.toContain('Leave blank');
    expect(duelButton(view)).toBeDefined();
    vi.unstubAllGlobals();
    const typo = browser({ rivals: true, rivalName: 'x' });
    view = Summary({ c });
    expect(all(view)).toContain('3 to 16 letters');
    expect(duelButton(view)).toBeDefined();
    click(duelButton(view)!);
    expect(c.screen).toBe('summary');
    expect(typo.posted).toHaveLength(0);
  });

  it('shows the button, with the field still there, once the box is on and the name is valid and nothing is sent yet', () => {
    browser({ rivals: true, rivalName: 'Wren' });
    const c = onSummary();
    const view = Summary({ c });
    expect(nameField(view)).toBeDefined();
    expect(duelButton(view)).toBeDefined();
    expect(duelButton(view)!.props.disabled).toBe(false);
  });

  it('is only the button once the character is sent, and it goes to the Rivals screen', async () => {
    browser({ rivals: true, rivalName: 'Wren' });
    const c = onSummary();
    await postRun(c.run!, null);
    const view = Summary({ c });
    expect(checkbox(view)).toBeUndefined();
    expect(nameField(view)).toBeUndefined();
    click(duelButton(view)!);
    await vi.waitFor(() => expect(c.screen).toBe('rivals'));
    expect(c.rivals!.status).toBe('loading');
  });

  it('posts the character when the button is pressed with a name just typed, and goes on only when it is in', async () => {
    const { posted } = browser({ rivals: true, rivalName: 'Wren' });
    const c = onSummary();
    click(duelButton(Summary({ c }))!);
    await vi.waitFor(() => expect(c.screen).toBe('rivals'));
    expect(posted.filter((p) => p.url.endsWith('/rivals'))).toHaveLength(1);
    expect(posted[0].body[0]).toMatchObject({
      name: 'Wren',
      class_id: 'vanguard',
      outcome: 'died',
    });
    // Pressed again, it posts nothing more.
    c.goTo('summary');
    click(duelButton(Summary({ c }))!);
    await vi.waitFor(() => expect(c.screen).toBe('rivals'));
    expect(posted.filter((p) => p.url.endsWith('/rivals'))).toHaveLength(1);
  });

  it('posts the run that just ended when the box is ticked with a valid name there, and never a name still being typed', async () => {
    const { posted, store } = browser({ rivalName: 'Wren' });
    const c = onSummary();
    const view = Summary({ c });
    (checkbox(view).props.onChange as (e: unknown) => void)({ currentTarget: { checked: true } });
    await vi.waitFor(() => expect(posted).toHaveLength(1));
    expect(store.get('bob.pref.rivals')).toBe('true');
    expect(posted[0].body[0]).toMatchObject({ name: 'Wren', outcome: 'died', map: 12 });
    // Once it is in, the opt-in is gone from the summary and the duel button is there.
    await vi.waitFor(() => expect(checkbox(Summary({ c }))).toBeUndefined());
    expect(duelButton(Summary({ c }))).toBeDefined();
    expect(posted).toHaveLength(1);
    // A name typed letter by letter, with the box ticked, posts nothing.
    resetPostKeeper();
    vi.unstubAllGlobals();
    const typing = browser({ rivals: true });
    const d = onSummary();
    d.run!.seed = 5;
    const field = nameField(Summary({ c: d }));
    for (const typed of ['Wre', 'Wren']) {
      (field.props.onInput as (e: unknown) => void)({ currentTarget: { value: typed } });
    }
    await new Promise((r) => setTimeout(r, 20));
    expect(typing.posted).toHaveLength(0);
  });

  it('shows the field again with "That name is not allowed" when the table refused the name, and the button waits for another', async () => {
    browser({ rivals: true, rivalName: 'Wren' });
    const c = onSummary();
    denied();
    click(duelButton(Summary({ c }))!);
    await vi.waitFor(() => expect(all(Summary({ c }))).toContain('That name is not allowed'));
    expect(c.screen).toBe('summary');
    const view = Summary({ c });
    expect(nameField(view)).toBeDefined();
    expect(duelButton(view)!.props.disabled).toBe(true);
    // Another name, and the button is there again.
    window.localStorage.setItem('bob.pref.rivalName', JSON.stringify('Wren2'));
    expect(duelButton(Summary({ c }))!.props.disabled).toBe(false);
  });

  it('says "Could not reach the rivals" with a retry when the sink is out of reach, and the retry posts again', async () => {
    const { posted } = browser({ rivals: true, rivalName: 'Wren' });
    const c = onSummary();
    vi.stubGlobal('fetch', async () => {
      throw new Error('offline');
    });
    click(duelButton(Summary({ c }))!);
    await vi.waitFor(() => expect(all(Summary({ c }))).toContain('Could not reach the rivals'));
    const view = Summary({ c });
    // The button stays and is the retry.
    expect(duelButton(view)).toBeDefined();
    expect(duelButton(view)!.props.disabled).toBe(false);
    expect(labels(view)).not.toContain('Try again');
    expect(all(view)).not.toContain('not allowed');
    vi.stubGlobal('fetch', async (url: string, init: { body: string }) => {
      posted.push({ url, body: JSON.parse(init.body) });
      return { ok: true, status: 201 };
    });
    click(duelButton(view)!);
    await vi.waitFor(() => expect(posted).toHaveLength(1));
    await vi.waitFor(() => expect(c.screen).toBe('rivals'));
    c.goTo('summary');
    expect(checkbox(Summary({ c }))).toBeUndefined();
    expect(all(Summary({ c }))).not.toContain('Could not reach');
  });

  it('has no opt-in block at all for a character that is sent, and says after a set how many rivals were beaten, with the rating', async () => {
    browser({ rivals: true, rivalName: 'Wren' });
    const c = onSummary([rivalOf(1), rivalOf(2), rivalOf(3)]);
    await postRun(c.run!, null);
    c.goTo('summary');
    expect(all(Summary({ c }))).not.toContain('You beat');
    c.book.noteFight('41', '1', 1, true);
    c.book.noteFight('41', '2', 1, false);
    c.book.noteFight('41', '2', 2, true);
    c.book.noteFight('41', '3', 1, false);
    expect(all(Summary({ c }))).toContain('You beat 2 of 3 rivals · Your rating 410');
    c.setMine(mine(41, 318));
    expect(all(Summary({ c }))).toContain('Your rating 318');
    const one = onSummary([rivalOf(1)]);
    one.book.noteFight('41', '1', 1, true);
    expect(all(Summary({ c: one }))).toContain('You beat 1 of 1 rival');
    expect(all(Summary({ c: one }))).not.toContain('1 of 1 rivals');
  });
});

describe('the opt-in', () => {
  it('says what it asks, and that the name is needed to duel', () => {
    browser({});
    const view = RivalsOptIn({});
    expect(all(view)).toContain(
      'Add my characters to the rivals and high scores other players see',
    );
    expect(text(hosts(view, (v) => v.type === 'label')[0].props.title)).toContain(
      'A name is needed to duel',
    );
  });
});

describe('the high scores', () => {
  const row = (id: number, rating: number) => ({
    id: String(id),
    name: `Rival ${id}`,
    classId: 'strider',
    level: 30,
    map: 20,
    outcome: 'died' as const,
    rating,
    fights: 3,
    wins: 2,
    gameVersion: 'abc1234',
    postedOn: '2026-10-17',
  });
  const back = vi.fn();

  it('says it is looking, that the rivals are out of reach, and that there are no duels yet, each in a line', () => {
    expect(all(HighScoresView({ got: null, onBack: back }))).toContain('Looking for rivals…');
    const offline = HighScoresView({ got: { scores: null, mine: new Set() }, onBack: back });
    expect(all(offline)).toContain('Could not reach the rivals');
    const none = HighScoresView({ got: { scores: [], mine: new Set() }, onBack: back });
    expect(all(none)).toContain('No duels yet.');
    expect(hosts(none, (v) => v.type === 'table')).toHaveLength(0);
    for (const v of [offline, none]) expect(labels(v)).toEqual(['Back']);
  });

  it('is a table by rating with the rank, name, class, level, rating, fights, wins and the day, and the player’s own rows marked', () => {
    const view = HighScoresView({
      got: { scores: [row(7, 900), row(8, 800), row(9, 700)], mine: new Set(['8']) },
      onBack: back,
    });
    const rows = hosts(view, (v) => v.type === 'tr' && v.props.class !== undefined);
    expect(rows.map((r) => r.props.class)).toEqual(['', 'hs-me', '']);
    const first = hosts(view, (v) => v.type === 'tbody')[0];
    const cells = hosts(first, (v) => v.type === 'td').map((c) => text(c.props.children));
    expect(cells.slice(0, 8)).toEqual([
      '1',
      'Rival 7',
      'Strider',
      '30',
      '900',
      '3',
      '2',
      '2026-10-17',
    ]);
    const heads = hosts(view, (v) => v.type === 'th').map((h) => text(h.props.children));
    expect(heads).toEqual(['#', 'Name', 'Class', 'Level', 'Rating', 'Fights', 'Won', 'Posted']);
    // What goes on a phone: the rank, name, class and rating stay; the rest are marked to collapse.
    const extra = hosts(view, (v) => v.type === 'th' && String(v.props.class).includes('hs-x')).map(
      (h) => text(h.props.children),
    );
    expect(extra).toEqual(['Level', 'Fights', 'Won', 'Posted']);
    click(button(view, 'Back'));
    expect(back).toHaveBeenCalled();
  });
});
