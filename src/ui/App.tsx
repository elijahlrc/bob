import { useEffect } from 'preact/hooks';
import type { Controller } from '../run/controller';
import { Camp } from './Camp';
import { ClassSelect } from './ClassSelect';
import { Codex } from './Codex';
import { Hud } from './Hud';
import { useControllerState } from './hooks';
import { Summary } from './Summary';
import { Title } from './Title';

export function App({ c }: { c: Controller }) {
  useControllerState(c);
  // N advances the showcase.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (e.ctrlKey || e.metaKey || e.altKey || tag === 'INPUT' || tag === 'SELECT') return;
      if (e.key.toLowerCase() === 'n' && c.showcase) c.nextShowcaseClass();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [c]);
  switch (c.screen) {
    case 'title':
      return <Title c={c} />;
    case 'codex':
      return <Codex c={c} />;
    case 'classSelect':
      return <ClassSelect c={c} />;
    case 'camp':
      return <Camp c={c} />;
    case 'map':
      return <Hud c={c} />;
    case 'summary':
    case 'victory':
      return <Summary c={c} />;
  }
}
