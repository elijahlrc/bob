/**
 * Text in, shorter text out, for the saves: a browser keeps about five million characters for the whole page, and a save is
 * mostly the same few key names and mod shapes over and over. LZW over the UTF-8 bytes with 15-bit codes, one code to a
 * character (offset past the control characters, below the surrogates), so a save takes a fifth of its length or less.
 * Headless and exact: `unpack(pack(s)) === s` for any string.
 */

const BASE = 256;
const LIMIT = 1 << 15;
/** A code is stored as `code + OFFSET`, which stays between U+0100 and U+80FF. */
const OFFSET = 0x100;

export function pack(text: string): string {
  const bytes = new TextEncoder().encode(text);
  if (bytes.length === 0) return '';
  const dict = new Map<number, number>();
  let next = BASE;
  const out: string[] = [];
  let chunk: number[] = [];
  const emit = (code: number): void => {
    chunk.push(code + OFFSET);
    if (chunk.length === 4096) {
      out.push(String.fromCharCode(...chunk));
      chunk = [];
    }
  };
  let w = bytes[0];
  for (let i = 1; i < bytes.length; i++) {
    const c = bytes[i];
    const key = w * BASE + c;
    const hit = dict.get(key);
    if (hit !== undefined) {
      w = hit;
      continue;
    }
    emit(w);
    dict.set(key, next++);
    // A full dictionary starts over; the reader does the same when it adds the same entry.
    if (next === LIMIT) {
      dict.clear();
      next = BASE;
    }
    w = c;
  }
  emit(w);
  out.push(String.fromCharCode(...chunk));
  return out.join('');
}

/** The text `pack` made this from; throws on a string that `pack` did not make. */
export function unpack(packed: string): string {
  const n = packed.length;
  if (n === 0) return '';
  const parent = new Int32Array(LIMIT);
  const suffix = new Uint8Array(LIMIT);
  const first = new Uint8Array(LIMIT);
  const length = new Int32Array(LIMIT);
  for (let i = 0; i < BASE; i++) {
    parent[i] = -1;
    suffix[i] = i;
    first[i] = i;
    length[i] = 1;
  }
  let out = new Uint8Array(Math.max(1024, n * 4));
  let pos = 0;
  let next = BASE;
  let prev = -1;
  for (let i = 0; i < n; i++) {
    const code = packed.charCodeAt(i) - OFFSET;
    if (code < 0 || code >= LIMIT) throw new Error('not a packed save');
    // The entry the writer added after the previous code: that code's text and the first byte of this one's.
    let firstByte: number;
    if (code < next) firstByte = first[code];
    else if (code === next && prev >= 0) firstByte = first[prev];
    else throw new Error('not a packed save');
    if (prev >= 0) {
      parent[next] = prev;
      suffix[next] = firstByte;
      first[next] = first[prev];
      length[next] = length[prev] + 1;
      next++;
    }
    const len = length[code];
    if (pos + len > out.length) {
      const bigger = new Uint8Array(Math.max(out.length * 2, pos + len));
      bigger.set(out);
      out = bigger;
    }
    let at = pos + len;
    for (let k = code; k >= 0; k = parent[k]) out[--at] = suffix[k];
    pos += len;
    // The writer started over right after adding this entry; the code just read was written with the new dictionary.
    if (next === LIMIT) next = BASE;
    prev = code;
  }
  return new TextDecoder('utf-8', { fatal: true }).decode(out.subarray(0, pos));
}
