import { ACTIVE_GEMS, GRANTED_GEMS, type ActiveGemDef } from '../data/gems';
import { activeLook, deliveryOf, type Delivery } from './skillLook';

/**
 * What an area looks like where it goes off, by what the skill is (docs/VISUAL_LANGUAGE.md, "Areas"). The outline of the ground
 * it covers is the same for every area (`areaFx.ts`); inside it plays a motif that says what the skill does there: a slam cracks
 * the floor and throws rubble, a frost burst grows crystals, a plague rises as a cloud, spears burst from the ground. Lightning
 * is for skills that are lightning (a strike from the sky, a crackle that runs along the ground), not for every area.
 *
 * Plain data, shared by the renderer (`areaMotifs.ts` draws each), the Codex legend and the coverage test: every skill that puts
 * damage on ground has a motif, by name here or by what it is (its delivery and element).
 */

export const MOTIFS = [
  'quake',
  'quakeWave',
  'boneSpikes',
  'stoneSpikes',
  'iceSpikes',
  'frostBloom',
  'freeze',
  'iceShatter',
  'iceWaves',
  'iceNova',
  'whirlFrost',
  'flames',
  'geyser',
  'fireball',
  'fireNova',
  'flameLine',
  'lava',
  'splat',
  'strike',
  'storm',
  'pillar',
  'crackleNova',
  'crackleLine',
  'cloud',
  'ritual',
  'holy',
  'shrapnel',
  'jaws',
  'drain',
  'blades',
  'swingNova',
  'whirlBlades',
  'forceWave',
  'breath',
  'rain',
] as const;
export type Motif = (typeof MOTIFS)[number];

/** What each motif looks like, in words (the legend and docs/VISUAL_LANGUAGE.md). */
export const MOTIF_LOOK: Record<Motif, string> = {
  quake:
    'The floor cracks outward from the point of the blow, a ring of dust runs out, and rubble is thrown up and falls.',
  quakeWave: 'As a quake, with a wave of broken ground that runs out to the edge.',
  boneSpikes: 'Pale spears burst up out of the ground, one after another, and sink again.',
  stoneSpikes:
    'Spikes of rock heave up out of the ground in a rolling line, with dust at their feet.',
  iceSpikes: 'Spikes of ice shoot up out of the ground, one after another, and shatter away.',
  frostBloom:
    'A frosted disc spreads over the ground, ice crystals grow up from it, and a pale mist rises.',
  freeze:
    'A front of frost runs out over the ground and the air above it turns to mist and crystals.',
  iceShatter: 'A flash of cold and a burst of ice shards thrown out from the point of the blow.',
  iceWaves: 'Rings of frost run out one after another, each throwing up ice shards along its edge.',
  iceNova: 'A ring of ice shards runs out from the caster and leaves the ground frosted behind it.',
  whirlFrost: 'Arms of white wind turn round the spot, sweeping snow up with them.',
  flames:
    'Tongues of flame stand up round the edge and a column in the middle; embers rise; the ground is scorched.',
  geyser: 'A tall column of fire erupts from the spot and throws embers down about it.',
  fireball: 'A ball of fire swells and bursts with a ring of heat; sparks and smoke fly out.',
  fireNova:
    'A ring of flame runs out from the caster, tongues standing up along its edge, scorching the ground behind it.',
  flameLine: 'A line of flame tongues rolls along the band.',
  lava: 'The ground splits into glowing fissures that run out from the point of the blow, bubble, and cool.',
  splat: 'Blobs of molten metal are flung out, land, spread glowing and cool.',
  strike: 'A jagged bolt comes down from the sky onto the spot and arcs run out over the ground.',
  storm: 'Several bolts come down on the area one after another, with arcs between them.',
  pillar: 'A thin spire of lightning stands up from the spot and the ground about it crackles.',
  crackleNova: 'Arcs of lightning run out along the ground from the caster to the edge.',
  crackleLine: 'Arcs of lightning jump along the band.',
  cloud: 'A cloud of sickly green billows out over the area and drifts up.',
  ritual: 'A rune circle lights on the ground and a green cloud rises from it.',
  holy: 'A column of golden light stands on the spot, a ring runs out and rays spread over the ground.',
  shrapnel:
    'Fragments fly out from the point of the blow, trailing sparks, and stick in the ground.',
  jaws: 'Two rows of iron teeth close on the spot and hold.',
  drain: 'Motes are drawn in from the edge to the centre in curving trails.',
  blades: 'Blades of steel come down on the area and stand in the ground a moment.',
  swingNova: 'A bright crescent sweeps all the way round the caster and a ring of dust follows it.',
  whirlBlades: 'Blades turn round the caster in a ring, trailing light.',
  forceWave:
    'A front of force runs down the band, throwing dust up before it and flattening the ground behind.',
  breath: 'A drifting breath of sickly green runs down the band, thickening as it goes.',
  rain: 'The missiles themselves come down on the area, each splashing where it lands.',
};

/** Skills that have a motif of their own, by id (the description each one answers to is the gem's). */
export const SKILL_MOTIF: Readonly<Record<string, Motif>> = {
  // Slams: cracks and rubble.
  quakeBlow: 'quakeWave',
  faultline: 'quake',
  skyfallLeap: 'quake',
  warchiefTotem: 'quake',
  ruptureLine: 'quakeWave',
  anvilDrop: 'quake',
  quakeTotem: 'quakeWave',
  // Things that rise out of the ground.
  spearBurst: 'boneSpikes',
  rumbleTrap: 'stoneSpikes',
  rimeSpires: 'iceSpikes',
  glacierWall: 'iceSpikes',
  // Cold.
  suddenFrost: 'frostBloom',
  rimeCore: 'frostBloom',
  rimeDrift: 'frostBloom',
  frostTrap: 'freeze',
  frostSunder: 'iceWaves',
  frostRing: 'iceNova',
  blizzardRing: 'whirlFrost',
  hoarfrostMote: 'iceShatter',
  frostQuill: 'iceShatter',
  rimeStep: 'iceShatter',
  drainTrap: 'drain',
  // Fire.
  flameBolt: 'fireball',
  cinderBlow: 'fireball',
  primalStrike: 'fireball',
  primeSplash: 'fireball',
  fuseArrow: 'fireball',
  mortarCharge: 'fireball',
  mortarBow: 'fireball',
  emberBurst: 'flames',
  blazeTrap: 'flames',
  doomSigil: 'flames',
  emberHail: 'rain',
  emberDownpour: 'rain',
  cinderStep: 'flames',
  shadowSwap: 'flames',
  pyreBurst: 'geyser',
  furnaceRoar: 'fireNova',
  chargeRelease: 'fireNova',
  fireBreathTrap: 'flameLine',
  magmaCrack: 'lava',
  slagLob: 'splat',
  slagBlow: 'splat',
  slagCarapace: 'splat',
  // Lightning: from the sky, or along the ground.
  skyfall: 'strike',
  thunderRebuke: 'strike',
  stormRush: 'strike',
  stormCharge: 'storm',
  spireTrap: 'pillar',
  driftingStorm: 'crackleNova',
  crackleRing: 'crackleNova',
  staticRing: 'crackleNova',
  tempestMote: 'crackleNova',
  judgementTempest: 'crackleNova',
  brimstoneStorm: 'crackleNova',
  boltStep: 'strike',
  // Chaos.
  creepingPlague: 'cloud',
  acidArrow: 'cloud',
  venomShower: 'rain',
  ruinRitual: 'ritual',
  // Holy ground and fire.
  cleansingBlaze: 'holy',
  blessedTrail: 'holy',
  hallowedRelic: 'holy',
  // Steel, shards and teeth.
  rainOfSteel: 'blades',
  arrowShower: 'rain',
  shrapnelTrap: 'shrapnel',
  scatterBolt: 'shrapnel',
  splinterVolley: 'shrapnel',
  jawsTrap: 'jaws',
  // Spins and sweeps.
  haloSweep: 'swingNova',
  whirlwindCleave: 'whirlBlades',
  twisterBlade: 'whirlBlades',
  orbitingBlades: 'whirlBlades',
};

/**
 * What the band of a beam or a stream looks like, by skill, or by element when the skill has no entry: lightning keeps the jagged
 * bolt (drawn by the host), the others are what they are made of.
 */
export const BEAM_MOTIF: Readonly<Record<string, Motif>> = {
  ruptureLine: 'stoneSpikes',
  cleansingBlaze: 'flameLine',
  scorchWave: 'flameLine',
  blazeStream: 'flameLine',
  witheringBreath: 'breath',
  tideOfJudgement: 'forceWave',
};

/** The motif of the band of a beam: its skill's, else its element's (null for lightning, which the host draws as a bolt). */
export function beamMotifOf(id: string, dtype: number): Motif | null {
  const own = BEAM_MOTIF[id];
  if (own) return own;
  return ['forceWave', null, 'iceSpikes', 'flameLine', 'breath'][dtype] as Motif | null;
}

/** What an area of this delivery and element looks like when its skill has no motif of its own. */
const BY_ELEMENT: Record<'blast' | 'nova' | 'wall', readonly Motif[]> = {
  // physical, lightning, cold, fire, chaos
  blast: ['quake', 'strike', 'frostBloom', 'flames', 'cloud'],
  nova: ['swingNova', 'crackleNova', 'iceNova', 'fireNova', 'cloud'],
  wall: ['stoneSpikes', 'crackleLine', 'iceSpikes', 'flameLine', 'cloud'],
};

/** The motif of an area by what the skill is: a delivery that is a field or a strip is a blast or a wall. */
export function fallbackMotif(delivery: Delivery, element: number): Motif {
  const kind = delivery === 'nova' ? 'nova' : delivery === 'wall' ? 'wall' : 'blast';
  return BY_ELEMENT[kind][element] ?? BY_ELEMENT[kind][0];
}

const DEFS = new Map<string, ActiveGemDef>([...ACTIVE_GEMS, ...GRANTED_GEMS].map((g) => [g.id, g]));

/**
 * The motif of an area that skill `id` made, in the element `dtype`: its own, else the one its delivery and element give. An
 * area that has a `strip` is a band (a wall or a stream) whatever the skill.
 */
export function motifOf(id: string, dtype: number, strip = false): Motif {
  const own = SKILL_MOTIF[id];
  if (own) return own;
  const def = DEFS.get(id);
  const delivery: Delivery = strip
    ? 'wall'
    : def
      ? deliveryOf(def.behaviour, def.skillType, def.tags, def.utility)
      : 'blast';
  return fallbackMotif(
    delivery,
    dtype >= 0 && dtype <= 4 ? dtype : def ? activeLook(def).element : 0,
  );
}
