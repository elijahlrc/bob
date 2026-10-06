import type { Controller } from '../run/controller';
import { Camp } from './Camp';
import { ClassSelect } from './ClassSelect';
import { Hud } from './Hud';
import { useControllerState } from './hooks';
import { Summary } from './Summary';
import { Title } from './Title';

export function App({ c }: { c: Controller }) {
  useControllerState(c);
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
