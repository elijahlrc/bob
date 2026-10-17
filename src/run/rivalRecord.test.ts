import { describe, expect, it } from 'vitest';
import { RECORD_KEY, RECORD_MAX, RivalBook } from './rivalRecord';
import { MemoryStore } from './save';

describe('the record of fights against rivals', () => {
  it('counts fights and wins for a pair, and remembers the last seed', () => {
    const book = new RivalBook(new MemoryStore());
    expect(book.get('41', '7')).toBeNull();
    expect(book.noteFight('41', '7', 100, true)).toEqual({
      fights: 1,
      wins: 1,
      lastSeed: 100,
      rated: false,
    });
    book.noteFight('41', '7', 101, false);
    book.noteFight('41', '7', 102, true);
    expect(book.get('41', '7')).toEqual({ fights: 3, wins: 2, lastSeed: 102, rated: false });
    // Another rival, and another character, are other pairs.
    expect(book.get('41', '8')).toBeNull();
    expect(book.get('42', '7')).toBeNull();
  });

  it('marks a pair rated only once the rated fight is in, and not a pair that has not fought', () => {
    const book = new RivalBook(new MemoryStore());
    book.noteRated('41', '7');
    expect(book.get('41', '7')).toBeNull();
    book.noteFight('41', '7', 100, false);
    expect(book.get('41', '7')!.rated).toBe(false);
    book.noteRated('41', '7');
    expect(book.get('41', '7')!.rated).toBe(true);
    book.noteFight('41', '7', 101, true);
    expect(book.get('41', '7')).toEqual({ fights: 2, wins: 1, lastSeed: 101, rated: true });
  });

  it('is kept by pair: the rival a character rated is a new rated fight for the next character', () => {
    const book = new RivalBook(new MemoryStore());
    book.noteFight('41', '7', 100, true);
    book.noteRated('41', '7');
    expect(book.get('41', '7')!.rated).toBe(true);
    expect(book.get('55', '7')).toBeNull();
  });

  it('tallies the set of one character: rivals fought and rivals beaten at least once', () => {
    const book = new RivalBook(new MemoryStore());
    expect(book.tally('41')).toEqual({ fought: 0, beaten: 0 });
    book.noteFight('41', '1', 1, true);
    book.noteFight('41', '2', 1, false);
    book.noteFight('41', '2', 2, false);
    book.noteFight('41', '3', 1, false);
    book.noteFight('41', '3', 2, true);
    book.noteFight('41', '4', 1, true);
    book.noteFight('41', '5', 1, false);
    // Another character's set is its own; so is one whose id starts with the same digits.
    book.noteFight('410', '1', 1, true);
    book.noteFight('4', '1', 1, true);
    expect(book.tally('41')).toEqual({ fought: 5, beaten: 3 });
    expect(book.tally('410')).toEqual({ fought: 1, beaten: 1 });
    expect(book.tally('4')).toEqual({ fought: 1, beaten: 1 });
    expect(book.tally('9')).toEqual({ fought: 0, beaten: 0 });
  });

  it('is written to the store under bob.rivals.record after every change, and read back by the next book', () => {
    const store = new MemoryStore();
    const book = new RivalBook(store);
    book.noteFight('41', '7', 100, true);
    expect(JSON.parse(store.getItem(RECORD_KEY)!)).toEqual({
      '41:7': { fights: 1, wins: 1, lastSeed: 100, rated: false },
    });
    book.noteRated('41', '7');
    book.noteFight('41', '8', 5, false);
    const later = new RivalBook(store);
    expect(later.get('41', '7')).toEqual({ fights: 1, wins: 1, lastSeed: 100, rated: true });
    expect(later.get('41', '8')).toEqual({ fights: 1, wins: 0, lastSeed: 5, rated: false });
    expect(later.tally('41')).toEqual({ fought: 2, beaten: 1 });
    // The one that read it goes on from there.
    later.noteFight('41', '7', 101, true);
    expect(new RivalBook(store).get('41', '7')).toMatchObject({ fights: 2, wins: 2 });
  });

  it('lives in memory with no store, and survives a store that throws', () => {
    const none = new RivalBook(null);
    none.noteFight('1', '2', 3, true);
    expect(none.get('1', '2')).toMatchObject({ fights: 1 });
    const broken = new RivalBook({
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('full');
      },
      removeItem: () => undefined,
    });
    expect(() => broken.noteFight('1', '2', 3, false)).not.toThrow();
    expect(broken.get('1', '2')).toMatchObject({ fights: 1, wins: 0 });
  });

  it('starts empty from a stored value that is not its shape, and keeps the entries that are', () => {
    for (const raw of ['not json', '[]', '"x"', 'null', '{"41:7":{"fights":"many"}}']) {
      const store = new MemoryStore();
      store.setItem(RECORD_KEY, raw);
      expect(new RivalBook(store).get('41', '7'), raw).toBeNull();
    }
    const store = new MemoryStore();
    store.setItem(
      RECORD_KEY,
      JSON.stringify({
        '41:7': { fights: 2, wins: 1, lastSeed: 9, rated: true },
        '41:8': { fights: -1, wins: 0, lastSeed: 9, rated: true },
        'x:9': { fights: 1, wins: 0, lastSeed: 9, rated: true },
      }),
    );
    const book = new RivalBook(store);
    expect(book.get('41', '7')).toEqual({ fights: 2, wins: 1, lastSeed: 9, rated: true });
    expect(book.get('41', '8')).toBeNull();
    expect(book.tally('41')).toEqual({ fought: 1, beaten: 1 });
  });

  it('keeps the most recently fought pairs when it grows past its cap', () => {
    const store = new MemoryStore();
    const book = new RivalBook(store);
    for (let i = 1; i <= RECORD_MAX + 20; i++) book.noteFight('1', String(i), i, true);
    // A pair fought again is the newest again.
    book.noteFight('1', '25', 999, false);
    book.noteFight('1', '9999', 1, true);
    expect(Object.keys(JSON.parse(store.getItem(RECORD_KEY)!))).toHaveLength(RECORD_MAX);
    expect(book.get('1', '1')).toBeNull();
    expect(book.get('1', '25')).toMatchObject({ fights: 2, lastSeed: 999 });
    expect(book.get('1', String(RECORD_MAX + 20))).not.toBeNull();
    expect(book.get('1', '9999')).not.toBeNull();
  });
});
