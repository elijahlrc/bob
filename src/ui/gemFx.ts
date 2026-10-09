import { levelValue } from '../calc/gems';
import type { ActiveGemDef, AuraGemDef, DotSpec, UtilityDef } from '../data/gems';
import { BUFFS } from '../data/buffs';

/**
 * The lines a gem card (and the inspect panel) show for what a skill does of its own (docs/SPIRIT.md): a channel's stages, the
 * ground it leaves, the debuff it inflicts, a wave, an element for each use, a buff of stacks, and the rest. Every field of a gem
 * that the sim reads has a line here, so a card never claims less (or more) than the skill does.
 */

const num = (v: number) => String(Math.round(v * 10) / 10);
const CHARGE = { grit: 'Endurance', fervour: 'Frenzy', insight: 'Power' } as const;
const lv = levelValue;

function dotLine(d: DotSpec, level: number): string {
  const how =
    d.stack === 'layers'
      ? `each application adds a layer, up to ${d.cap ?? 20}`
      : d.stack === 'stages'
        ? `each application adds a stage, up to ${d.cap ?? 8}`
        : 'renewed by each application';
  const parts = [
    `${d.hitless ? 'Inflicts' : 'Hits also inflict'} ${num(lv(d.dps, level))} ${d.type} damage a second for ${num(d.seconds)} s (${how})`,
  ];
  if (d.ground) parts.push('from the ground it leaves');
  if (d.carried) parts.push(`on everything within ${num(d.carried)} of it as it flies`);
  if (d.maxTargets) parts.push(`on the ${d.maxTargets} nearest enemies`);
  if (d.splash) parts.push(`and on enemies within ${num(d.splash)} of the target`);
  if (d.spread) parts.push('passed on when the enemy dies');
  if (d.regen) parts.push(`; you mend ${num(d.regen)}% of it for each enemy that carries it`);
  if (d.hinder) parts.push(`; slows them by ${num(d.hinder.v)}%`);
  return parts.join(' ');
}

/** The lines for the special behaviours of an active skill. */
export function fxLines(def: ActiveGemDef, level: number): string[] {
  const out: string[] = [];
  const b = def.behaviour;
  if (b.kind === 'projectile' && b.meleeUnless)
    out.push(`A shot with a ${b.meleeUnless}, a stab with any other weapon`);
  if (def.cooldown !== undefined && !def.utility)
    out.push(
      `${num(lv(def.cooldown, level))} s cooldown${def.cooldownUses && def.cooldownUses > 1 ? `, ${def.cooldownUses} uses stored` : ''}${
        def.bypass
          ? `; spend ${def.bypass.n} ${CHARGE[def.bypass.charge]} charge${def.bypass.n === 1 ? '' : 's'} to use it again at once`
          : ''
      }`,
    );
  if (def.recoverNear)
    out.push(
      `The cooldown recovers faster for each enemy within ${num(def.recoverNear.radius)}: ${num(lv(def.recoverNear.normal, level))}% for a normal one, ${num(lv(def.recoverNear.rare, level))}% for a rare`,
    );
  if (def.pausedBy) out.push(`The cooldown does not run while ${BUFFS[def.pausedBy].name} lasts`);
  if (def.consumeCharges)
    out.push(
      `Spends every charge you hold (at least ${def.consumeCharges.min}); the damage grew with them`,
    );
  const ch = def.channel;
  if (ch) {
    out.push(
      `Channelled: each use builds a stage, up to ${ch.cap}${ch.tick ? ', and hits as it goes' : ''}${ch.perStage ? `, ${num(ch.perStage)}% more damage for each stage` : ''}; let go at the cap or when nothing is left to hit`,
    );
    if (ch.first !== undefined) out.push(`The first use deals ${num(ch.first)}% of the damage`);
    if (ch.tickMult !== undefined && ch.tickMult !== 100)
      out.push(`Each use hits for ${num(ch.tickMult)}% of the damage`);
    if (ch.tickRadiusPerStage) out.push(`${num(ch.tickRadiusPerStage)}% more area for each stage`);
    if (ch.crowdStage)
      out.push(
        `${ch.crowdStage.min} enemies within ${num(ch.crowdStage.radius)} build an extra stage`,
      );
    if (ch.stunImmune) out.push('You cannot be stunned while channelling');
    const r = ch.release;
    if (r)
      out.push(
        r.repeat
          ? 'When it ends, one more strike for each stage built, each at the full bonus'
          : `When it ends, one release with ${num(r.perStage)}% more damage for each stage${r.radiusPerStage ? ` and ${num(r.radiusPerStage)}% more area` : ''}`,
      );
  }
  if (def.stacks)
    out.push(
      `Each use that hits builds a stage, up to ${def.stacks.cap}, each ${num(def.stacks.areaPer)}% more area; they fade after ${num(def.stacks.fadeAfter)} s without a hit`,
    );
  if (def.chargedSlam)
    out.push(
      `${num(def.chargedSlam.chance)}% chance to spend a ${CHARGE[def.chargedSlam.charge]} charge: ${num(def.chargedSlam.more)}% more damage and ${num(def.chargedSlam.radius)}% more area`,
    );
  if (def.aftershock)
    out.push(
      `${num(def.aftershock.delay)} s later the ground erupts again: ${num(def.aftershock.more)}% more damage over ${num(def.aftershock.radius)}% more area`,
    );
  const a = def.afterHit;
  if (a)
    out.push(
      a.kind === 'bolts'
        ? `A hit sends ${num(lv(a.count, level))} bolts from the weapon at ${a.mult}% of the damage`
        : a.kind === 'blades'
          ? `A hit sends ${num(lv(a.count, level))} blades from behind the enemy at ${a.mult}% of the damage`
          : a.kind === 'balls'
            ? `A hit throws ${num(lv(a.count, level))} balls that land and burst, at ${a.mult}% of the damage`
            : a.kind === 'area'
              ? `A hit also strikes the enemies about the target (not the target) for ${a.mult}% of the damage${a.ailmentRadius ? `; ${a.ailmentRadius}% larger about an enemy suffering the use's ailment` : ''}`
              : `After a hit: fire, an explosion about the target; cold, ${num(lv(a.count, level))} icy projectiles through everything ahead; lightning, a bolt that chains ${num(lv(a.chains ?? 4, level))} times`,
    );
  if (def.cone)
    out.push(
      `Each shot also bursts in a ${def.cone.angle}° cone ${num(def.cone.length)} long for ${def.cone.mult}% of the damage`,
    );
  if (def.element)
    out.push(
      `Each use picks fire, cold or lightning at random${def.element.noRepeat ? ' (never the same twice running)' : ''}`,
    );
  if (def.hitBuff)
    out.push(
      `A hit gives you ${BUFFS[def.hitBuff.buff].name} for ${num(BUFFS[def.hitBuff.buff].seconds)} s`,
    );
  if (def.wave) {
    const w = def.wave;
    out.push(
      `Sends a wave ${num(w.length)} long along the ground; ${w.burst ? `a burst of radius ${num(w.burst)} at the target; ` : ''}then a shockwave of radius ${num(w.shockRadius)} ${w.shockAt === 'hit' ? 'about each enemy the wave struck' : 'about the target'} for ${num(w.shockMult)}% of the damage, to the enemies it did not strike`,
    );
  }
  if (def.beams) {
    const m = def.beams;
    out.push(
      `A hit gives a stack of a ${num(m.seconds)} s buff (up to ${m.max}); while it lasts, beams strike up to ${num(lv(m.count, level))} enemies within ${num(m.radius)} every ${num(m.interval)} s, ${m.perStack}% faster for each stack, for ${num(lv(m.lessStill, level))}% less damage standing still and ${num(lv(m.lessMoving, level))}% less moving`,
    );
  }
  if (def.charge) {
    const c = def.charge;
    out.push(
      `Each hit puts a charge on the enemy (up to ${c.max}, ${num(c.seconds)} s); at the most, when they run out, or when it dies, they burst in a radius of ${num(c.radius)} for ${c.perCharge}% of the hit each; an enemy that dies with one bursts as fire for ${c.deathPct}% of its life`,
    );
  }
  if (def.shield)
    out.push(
      `Throws a shield that does not pierce; where it ends it shatters into ${num(lv(def.shield.shards, level))} shards (one more for each extra projectile) that fly all round, pierce, and deal ${def.shield.less}% less damage`,
    );
  if (def.castOn)
    out.push(
      `Cast on up to ${def.castOn.max} of your ${def.castOn.skill} projectiles instead of you, with ${def.castOn.areaLess}% less area`,
    );
  if (def.mirror)
    out.push(
      `The arrow flies to the target place and leaves a clone of you there for ${num(def.mirror.seconds)} s; it fires with your bow for ${def.mirror.more}% more damage`,
    );
  if (def.pulse)
    out.push(
      `A slow orb: every ${num(def.pulse.interval)} s it hurts every enemy within ${num(def.pulse.radius)} of it, and does not stop on any`,
    );
  if (def.wander) out.push('The projectiles move at random and bounce off walls');
  if (def.travelThrough) out.push('Dashes through the target, hitting everything on the way');
  if (def.mineAura?.taken)
    out.push(
      `Enemies near its mines take ${num(def.mineAura.taken)}% more damage from each, up to ${num(def.mineAura.takenCap ?? 0)}%`,
    );
  if (def.homing) out.push('The projectile turns toward the enemies ahead of it');
  if (def.vortex) {
    const v = def.vortex;
    out.push(
      `Each cast adds a blade that circles you for ${num(v.seconds)} s (up to ${v.max}); every ${num(v.spin)} s, ${v.hitRate}% sooner for each blade, everything within ${num(v.radius)} is hit together, for ${v.more}% more damage and ${v.crit}% more critical chance for each blade; while blades circle you, you walk in among the enemies`,
    );
  }
  if (def.markers)
    out.push(
      `Sets a marker; ${num(def.markers.delay)} s later it is struck in a radius of ${num(def.markers.radius)}, and every other marker with it`,
    );
  if (def.stormOrb) {
    const o = def.stormOrb;
    out.push(
      `Puts an orb by you for ${num(o.seconds)} s, in place of the last; every ${num(lv(o.interval, level))} s it strikes the nearest enemy within ${num(o.radius)} with a bolt that splits to ${num(lv(o.split, level))} more; casting a lightning skill inside it makes it strike once more`,
    );
  }
  if (def.bounces)
    out.push(
      `After bursting, the orb bounces on the same way ${num(lv(def.bounces.chains, level))} time${lv(def.bounces.chains, level) >= 1.5 ? 's' : ''}, bursting again each time`,
    );
  if (def.fuse) {
    const f = def.fuse;
    out.push(
      `The arrow sticks in the enemy and explodes after ${num(f.seconds)} s; arrows stuck in the same enemy join that explosion, which widens by ${num(f.radiusPer)} for each (up to ${num(lv(f.maxExtra, level))}) and makes the ignite ${f.ignitePer}% stronger for each`,
    );
  }
  if (def.sporePods)
    out.push(
      `The released arrow leaves a pod for each stage along its way; each blooms into ${def.sporePods.arrows} thorns for ${def.sporePods.less}% less damage`,
    );
  if (def.siphon)
    out.push(
      `While enemies carry the beams you regain ${num(lv(def.siphon.life, level))} life and ${num(lv(def.siphon.mana, level))} mana a second, and ${num(lv(def.siphon.lifeEach, level))} life and ${num(lv(def.siphon.manaEach, level))} mana more for each`,
    );
  if (def.dot) out.push(dotLine(def.dot, level));
  if (def.burning)
    out.push(
      `An ignite also leaves a burning debuff worth ${num(lv(def.burning.pct, level))}% of its damage, up to ${def.burning.cap} at once, for ${num(def.burning.seconds)} s`,
    );
  if (def.pods)
    out.push(
      `Arrows fall about the target and each leaves a pod for ${num(def.pods.seconds)} s that afflicts and slows (${num(def.pods.slow)}% each, at most ${num(def.pods.slowMax)}%), then bursts`,
    );
  if (def.leaves)
    out.push(
      def.leaves.kind === 'consecrated'
        ? `Leaves consecrated ground of radius ${num(def.leaves.radius)} for ${num(def.leaves.seconds)} s: you mend there, and hits against what stands on it crit more often`
        : def.leaves.kind === 'chilling'
          ? `Leaves chilling ground of radius ${num(def.leaves.radius)} for ${num(def.leaves.seconds)} s${def.leaves.dps ? ' that burns with cold' : ''}${def.leaves.killCharge ? `; a kill on it may give a ${CHARGE[def.leaves.killCharge.kind]} charge` : ''}`
          : `Leaves caustic ground of radius ${num(def.leaves.radius)} for ${num(def.leaves.seconds)} s that poisons what stands on it`,
    );
  if (def.crystal)
    out.push(
      `Leaves a crystal for ${num(def.crystal.seconds)} s that exposes enemies near it to cold and slows their regeneration, then bursts`,
    );
  if (def.wall)
    out.push(
      `Raises a wall ${num(def.wall.length)} long for ${num(def.wall.seconds)} s that holds the way shut and pushes back what stands there`,
    );
  if (def.geyser)
    out.push(
      `Turns a corpse into a geyser for ${num(def.geyser.seconds)} s that fires projectiles about it, after exploding for ${def.geyser.explodePct}% of the corpse's life`,
    );
  if (def.needsCorpse) out.push('Needs a corpse');
  if (def.bladestorm)
    out.push(
      `Leaves a storm for ${num(def.bladestorm.seconds)} s that hits what is in it; you gain a buff in it that depends on your stance`,
    );
  if (def.form)
    out.push(
      `After ${num(def.form.after)} tiles the projectile changes: faster, through everything, with ${def.form.critMore}% more critical chance`,
    );
  if (def.orb)
    out.push(
      def.orb.kind === 'frost'
        ? `An orb over you pelts the ground with explosions for ${num(def.orb.seconds)} s; stages built lengthen and quicken it`
        : def.orb.kind === 'illusion'
          ? 'An illusion runs ahead while you channel, sending waves along its path; you join it at the end'
          : 'An orb for each use jumps about the target place, exploding after each jump; the rest explode harder when the channel ends',
    );
  if (def.returnMore)
    out.push(
      `The projectile turns back at the end of its way, ${def.returnMore}% more damage on the way back`,
    );
  if (def.catches) out.push(`Catches up to ${def.catches} returning projectiles`);
  if (def.releasesCaught) out.push('Sends out the projectiles that were caught');
  if (def.detonation) out.push(`Mines go ${num(def.detonation)} s after being set off`);
  if (def.deploySeconds) out.push(`What it puts down stands for ${num(def.deploySeconds)} s`);
  return out;
}

/** The lines for the special behaviours of an aura. */
export function auraFxLines(def: AuraGemDef, level: number): string[] {
  const out: string[] = [];
  if (def.mods.some((m) => m.stat === 'auraBurn'))
    out.push(
      'You walk in among the enemies so that the fire reaches them, whatever the range of your attacks; it switches off below 40% of your life and on again from 75%',
    );
  if (def.frost)
    out.push(
      `Enemies that hit you are chilled for ${num(def.frost.seconds)} s (${def.frost.slow}% slower); while you move you leave chilled ground for ${num(lv(def.frost.trail, level))} s`,
    );
  if (def.agony)
    out.push(
      `Each poison you put on an enemy gives a point of Virulence (up to ${def.agony.max}, lost faster the more you hold) and calls a crawler that cannot be hurt; it deals ${num(lv(def.agony.dmgPer, level))}% more damage and attacks ${num(lv(def.agony.atkPer, level))}% faster for each point, and is gone when you have none`,
    );
  return out;
}

/** Extra lines for the utility skills' newer behaviours (decoys, bots, escapes, shells, second buffs). */
export function utilityFxLines(u: UtilityDef, level: number): string[] {
  const out: string[] = [];
  if (u.kind === 'summon') {
    if (u.corpseCost) out.push('Uses up a corpse near you for each cast');
    if (u.relic)
      out.push(
        `When you hit with an attack the relic sets off a nova of radius ${num(u.relic.radius)} (once in ${num(u.relic.cooldown)} s); you regenerate ${num(lv(u.relic.regen, level))} life a second and your minions ${num(lv(u.relic.minionRegen, level))}`,
      );
    if (u.taunt) out.push(`Enemies within ${num(u.taunt)} go for it instead of you`);
    if (u.skitter)
      out.push(
        `Holds ${u.skitter.reserve}% of your mana; one mote chills (${num(lv(u.skitter.chill, level))}% slower) and one shocks (${num(lv(u.skitter.shock, level))}% more damage taken) the enemies within ${num(u.skitter.radius)}; they set off your traps and mines (each once in 3 s), and mines arm again`,
      );
  }
  if (u.kind === 'blink' && u.escape)
    out.push(
      `Goes to the safest spot within ${num(u.distance)} when you are hurt or a pack closes in; smoke at both ends blinds what stands in it for ${num(u.escape.smoke.seconds)} s; the blink skills share a cooldown`,
    );
  if (u.kind === 'blink' && u.elusive)
    out.push(
      'Landing among a pack, you run on through it without attacking until Elusive is over; the first skill you use ends it; not begun for a lone enemy',
    );
  if (u.kind === 'buff' && u.shell)
    out.push(
      `${u.shell.absorb}% of the damage from hits goes into a pool of ${u.shell.capPct}% of your armour (at most ${u.shell.capMax}); when the buff ends or the pool is spent, ${num(lv(u.shell.reflect, level))}% of what it took goes out as fire around you`,
    );
  if (u.kind === 'buff' && u.second)
    out.push(
      `The first skill you use ends the first effect; ${BUFFS[u.second.buff].name} stays ${num(u.second.keep)} s more; you run on without attacking until it is over`,
    );
  return out;
}
