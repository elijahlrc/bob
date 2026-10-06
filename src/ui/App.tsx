import { useEffect } from 'preact/hooks';
import { STYLE_IDS } from '../data/styles';
import type { Controller } from '../run/controller';
import { Camp } from './Camp';
import { ClassSelect } from './ClassSelect';
import { Hud } from './Hud';
import { useControllerState } from './hooks';
import { Summary } from './Summary';
import { Title } from './Title';

export function App({ c }: { c: Controller }) {
  useControllerState(c);
  // Keys 1/2/3 switch the visual style; N advances the showcase.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (e.ctrlKey || e.metaKey || e.altKey || tag === 'INPUT' || tag === 'SELECT') return;
      const i = ['1', '2', '3'].indexOf(e.key);
      if (i >= 0 && (c.screen === 'map' || c.screen === 'title')) c.setStyle(STYLE_IDS[i]);
      if (e.key.toLowerCase() === 'n' && c.showcase) c.nextShowcaseClass();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [c]);
  switch (c.screen) {
    case 'title':
      return <Title c={c} />;
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
