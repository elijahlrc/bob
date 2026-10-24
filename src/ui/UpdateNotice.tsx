import { newBuild } from '../update';

/**
 * One line saying a newer build is out, with the reload (src/update.ts); nothing while the page is current. Shown on the title
 * screen and at camp only, where a reload loses nothing.
 */
export function UpdateNotice() {
  if (newBuild() === null) return null;
  return (
    <div class="notice update" data-paint="panel" data-thin>
      <span>A new version is out.</span>
      <button class="btn small" onClick={() => window.location.reload()}>
        Reload
      </button>
    </div>
  );
}
