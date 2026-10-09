import { useEffect, useRef, useState } from 'preact/hooks';

/**
 * One confirmation for everything that cannot be taken back (docs/ITEMS.md 3.6), in place of the browser's own
 * `confirm()`: a dialog on a desktop, a sheet on a phone, with the consequence in words and the numbers that matter.
 * `ask()` resolves to what the player chose; the `ConfirmHost` mounted once in App draws it.
 */
export type ConfirmOptions = {
  title: string;
  /** What will happen, in a sentence or two. */
  body?: string;
  /** Short lines of fact: "8 items", "41 Bone Dust", odds. */
  facts?: string[];
  confirm: string;
  /** Styled as a loss; Cancel has the focus. */
  danger?: boolean;
};

type Open = ConfirmOptions & { resolve: (ok: boolean) => void };

let current: Open | null = null;
const listeners = new Set<(o: Open | null) => void>();
const set = (o: Open | null) => {
  current = o;
  listeners.forEach((l) => l(o));
};

/** Whether a question is waiting for an answer (auto-continue holds off while one is). */
export const confirmOpen = (): boolean => current !== null;

/** Answer the open question with no, when what it was about has gone (the map began, the screen changed). */
export function dismissAsk(): void {
  const o = current;
  if (!o) return;
  set(null);
  o.resolve(false);
}

export function ask(options: ConfirmOptions): Promise<boolean> {
  // A second question while one is open answers the first with no.
  current?.resolve(false);
  return new Promise((resolve) => set({ ...options, resolve }));
}

export function ConfirmHost() {
  const [o, setO] = useState<Open | null>(current);
  const cancel = useRef<HTMLButtonElement>(null);
  const ok = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    listeners.add(setO);
    return () => void listeners.delete(setO);
  }, []);
  const answer = (v: boolean) => {
    const r = o;
    set(null);
    r?.resolve(v);
  };
  useEffect(() => {
    if (!o) return;
    (o.danger ? cancel : ok).current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        answer(false);
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [o]);
  if (!o) return null;
  return (
    <div class="modal confirm" onClick={() => answer(false)}>
      <div
        class="modal-card confirm-card"
        role="alertdialog"
        aria-label={o.title}
        onClick={(e) => e.stopPropagation()}
      >
        <h3>{o.title}</h3>
        {o.body && <div>{o.body}</div>}
        {o.facts && o.facts.length > 0 && (
          <ul class="confirm-facts">
            {o.facts.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        )}
        <div class="item-actions">
          <button
            ref={ok}
            class={'btn ' + (o.danger ? 'danger' : 'primary')}
            onClick={() => answer(true)}
          >
            {o.confirm}
          </button>
          <button ref={cancel} class="btn" onClick={() => answer(false)}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
