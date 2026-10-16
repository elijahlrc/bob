import type { Side } from './side';

/** Whether the player can pay a skill's cost now (mana, mana plus ES for Mind Bastion, or life). */
export function canPay(s: Side, costsLife: boolean, cost: number): boolean {
  const p = s.player;
  if (cost <= 0) return true;
  const pool = costsLife ? p.life - 1 : p.def.esProtectsMana ? p.mana + p.es : p.mana;
  return pool >= cost;
}

/** Pay a skill's cost. Callers check `canPay` first. */
export function payCost(s: Side, costsLife: boolean, cost: number): void {
  const p = s.player;
  if (cost <= 0) return;
  if (costsLife) {
    p.life -= cost;
    return;
  }
  if (p.def.esProtectsMana && p.es > 0) {
    const a = Math.min(p.es, cost);
    p.es -= a;
    cost -= a;
  }
  p.mana -= cost;
}
