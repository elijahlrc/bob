## The Spire gate (spire.home)

Two stat nodes off the start (shield west, spell damage east), the signature between them, two hubs one step out with a pocket each, and two roads: the well up the left, the craft up the right.

### First Light (sig)

The loop the start opens onto: energy shield on the west side, spell damage on the east, the signature at the tip. Point one is a side; point two is the signature, a hub, or a road.

- `a` 5% increased maximum Energy Shield (1.0 units) — The west side: defence.
- `n` **notable First Light** 10% increased Spell Damage; 10% increased maximum Mana; +20 to Intelligence; 4% increased maximum Energy Shield (4.6 units) — The signature: spell damage, mana, intelligence and a little shield. 4.6 units.
- `b` 8% increased Spell Damage (1.0 units) — The east side: offence.

### The hubs (hubs)

Intelligence, one step past each side node: the west hub joins the ring toward the Zealot and starts the well road; the east hub joins the ring toward the Shade and starts the craft road.

- `w` **attribute** +20 to Intelligence (1.3 units)
- `e` **attribute** +20 to Intelligence (1.3 units)

### Still Mind (stillMind)

The west hub's pocket, a tight orbit: two mana regeneration nodes and a notable with regeneration and flat mana. A caster's first worry is running dry; three points after the hub it stops being one.

- `a` 10% increased Mana Regeneration Rate (1.0 units) — The entrance, facing the hub.
- `b` 10% increased Mana Regeneration Rate (1.0 units)
- `n` **notable Still Mind** 20% increased Mana Regeneration Rate; +30 to maximum Mana (3.5 units) — 2 + 1.5 units.

### Sharp Mind (sharpMind)

The east hub's pocket, a tight orbit: two spell crit nodes and a notable with spell crit and spell crit multiplier. The crit caster's first three points after the hub, and the way the insight charges start paying.

- `a` 15% increased Critical Strike Chance with Spells (1.0 units) — The entrance, facing the hub.
- `n` **notable Sharp Mind** 30% increased Critical Strike Chance with Spells; +15% to Critical Strike Multiplier with Spells (3.3 units) — 2 + 1.25 units.
- `b` 15% increased Critical Strike Chance with Spells (1.0 units)

### The well road (roadW)

Shield three times: the road up the left from the west hub to the well's wheel.

- `a` 5% increased maximum Energy Shield (1.0 units)
- `b` 5% increased maximum Energy Shield (1.0 units)
- `c` 5% increased maximum Energy Shield (1.0 units)

### The craft road (roadE)

Spell damage three times: the road up the right from the east hub to the craft's wheel.

- `a` 8% increased Spell Damage (1.0 units)
- `b` 8% increased Spell Damage (1.0 units)
- `c` 8% increased Spell Damage (1.0 units)

Links:

- start.mystic ↔ sig.a: Point one, the west side.
- start.mystic ↔ sig.b: Point one, the east side.
- sig.a ↔ hubs.w: The west side to the west hub.
- sig.b ↔ hubs.e: The east side to the east hub.
- hubs.w ↔ stillMind.a: The west hub's pocket.
- hubs.e ↔ sharpMind.a: The east hub's pocket.
- hubs.w ↔ centre.ring.road.r23: The west hub joins the ring one node toward the Zealot, clear of the start.
- hubs.e ↔ centre.ring.road.r1: The east hub joins the ring one node toward the Shade, clear of the start.
- hubs.w ↔ roadW.a: The well road.
- hubs.e ↔ roadE.a: The craft road.
- roadW.c ↔ spire.well.deepWell.a: The well road reaches the wheel.
- roadE.c ↔ spire.craft.focus.a: The craft road reaches the wheel.
- stillMind.n ↔ roadW.a: The mana pocket is also a way onto the well road: a pocket as a bridge.
- sharpMind.n ↔ roadE.a: The crit pocket is also a way onto the craft road.

## Mana and shield (spire.well)

What keeps a caster alive and casting: the wheel gives both, the side rooms sell the rarer lines (recharge, shield leech, cost, reservation), and Mind Bulwark turns mana into a second life pool.

### Deep Well (deepWell)

The wheel: entered from the well road on the east, left to the junction on the west and to the column through the shield notable. Mana on the south side, shield on the north.

- `a` 8% increased maximum Mana (1.0 units) — The entrance, east.
- `b` 8% increased maximum Mana (1.0 units)
- `n1` **notable Deep Well** 20% increased maximum Mana; 20% increased Mana Regeneration Rate (4.5 units) — Mana and its regeneration: 2.5 + 2 units. The Frugal chain leaves here.
- `c` 5% increased maximum Energy Shield (1.0 units) — The west exit, to the junction.
- `d` 5% increased maximum Energy Shield (1.0 units) — Where the recharge room opens.
- `n2` **notable Glass Skin** 16% increased maximum Energy Shield; 20% increased Energy Shield Recharge Rate (4.5 units) — Shield and its recharge: 3.2 + 1.3 units. The north exit, to the column.

### Quickening (recharge)

Recharge rate and a faster start of recharge: the energy-shield build's decision, off the wheel's shield small, and the foot of the Siphon chain.

- `a` 15% increased Energy Shield Recharge Rate (1.0 units)
- `n` **notable Quickening** 30% increased faster start of Energy Shield Recharge; 20% increased Energy Shield Recharge Rate; 5% increased maximum Energy Shield (5.3 units) — 3 + 1.3 + 1 units; the faster start is the half the sheet shows least and the fight feels most.
- `b` 15% increased Energy Shield Recharge Rate (1.0 units) — Where the Siphon chain leaves.

### Siphon (siphon)

Energy shield on hit, then the notable with shield leech, shield on hit and mana on kill: the caster's recovery from hitting, which no other Spire node sells, as a chain from the recharge room up to the column's area cluster. The well's own way up, without the wheel's notable.

- `a` Gain 4 Energy Shield per Enemy Hit (1.0 units)
- `n` **notable Siphon** +0.8% to of damage leeched as Energy Shield; Gain 6 Energy Shield per Enemy Hit; Gain 10 Mana per Enemy Killed (4.5 units) — 2 + 1.5 + 1 units.

### Frugal (frugal)

Reduced mana cost, then the notable with cost reduction and regeneration: a chain from the mana notable west to the Devotion chain. The caster who casts without stopping.

- `a` 4% reduced Mana Cost of Skills (1.0 units)
- `n` **notable Frugal** 8% reduced Mana Cost of Skills; 10% increased Mana Regeneration Rate (3.0 units) — 2 + 1 units.

### Devotion (devotion)

Reduced reservation twice, then the notable with reservation and aura effect: the aura caster's chain, from the junction west toward the Cathedral, a stub until the Cathedral is written and lands on it. Reached from the junction and from the Frugal chain.

- `a` 3% reduced Mana Reserved (1.0 units)
- `b` 3% reduced Mana Reserved (1.0 units)
- `n` **notable Devotion** 5% reduced Mana Reserved; 10% increased effect of Auras on you (3.3 units) — 1.7 + 1.7 units.

### Junction (j1)

The well's junction, west of the wheel: the Mind Bulwark spur north-west, the Devotion chain west, the near crossing to the Cathedral's auras when it is written.

- `a` **attribute** +20 to Intelligence (1.3 units)

### Mind Bulwark (mindBulwark)

Two nodes of mana, then the keystone: 30% of damage is taken from mana before life. The first keystone of the Spire; a caster's mana is the only pool a caster already has plenty of.

- `a` 8% increased maximum Mana (1.0 units)
- `b` 8% increased maximum Mana (1.0 units)
- `k` **keystone Mind Bulwark** 30% of damage is taken from mana before life.

Links:

- deepWell.d ↔ recharge.a: The recharge room opens off the wheel's shield small.
- recharge.b ↔ siphon.a: The recharge room onto the Siphon chain.
- siphon.n ↔ spire.column.broadWeave.a: The Siphon chain lands on the column's area cluster.
- deepWell.n1 ↔ frugal.a: The mana notable onto the Frugal chain.
- frugal.n ↔ devotion.a: The Frugal chain lands on the Devotion chain.
- frugal.n ↔ j1.a: And on the junction: the Frugal chain is a loop with the wheel's west side.
- deepWell.c ↔ j1.a: The wheel's west side to the junction.
- j1.a ↔ devotion.a: Junction to the Devotion chain.
- j1.a ↔ mindBulwark.a: Junction to the keystone spur.
- deepWell.n2 ↔ spire.column.j1.a: Up the column through the shield notable: the shortcut costs the notable.

## Spellcraft (spire.craft)

How a spell hits, whatever its element: damage, cast speed, crit, the insight charges that are the Mystic's crit engine, and the curses on the Knife border. Generic on purpose so that the Zealot's sceptre caster and the Shade's crit caster shop here through the crossings.

### Arcane Focus (focus)

The wheel: entered from the craft road on the west, left to the junction on the east and the column from its north-west small. Damage on the south side, crit on the north.

- `a` 8% increased Spell Damage (1.0 units) — The entrance, west.
- `b` 8% increased Spell Damage (1.0 units)
- `n1` **notable Arcane Focus** 20% increased Spell Damage; 6% increased Cast Speed (4.0 units) — 2.5 + 1.5 units.
- `c` 8% increased Spell Damage (1.0 units) — The east exit, to the junction.
- `d` 15% increased Critical Strike Chance with Spells (1.0 units) — Where the wand room opens.
- `n2` **notable Keen Mind** 30% increased Critical Strike Chance with Spells; +15% to Critical Strike Multiplier; 6% increased Spell Damage (4.0 units) — 2 + 1.25 + 0.75 units. The north exit, to the column.

### Wandwork (wandwork)

The wand: spell damage and cast speed while wielding one. The kit is a wand, so this is cheap and near; a side room off the wheel.

- `a` 10% increased Spell Damage while wielding a Wand (1.3 units)
- `n` **notable Wandwork** 20% increased Spell Damage while wielding a Wand; 8% increased Cast Speed while wielding a Wand (4.5 units) — 2.5 + 2 units, both behind the wand in hand.
- `b` 10% increased Spell Damage while wielding a Wand (1.3 units)

### Junction (j1)

The craft's junction, east of the wheel: the insight room south-east, the Mana Bastion spur north-east, the Hexwright chain east toward the Knife.

- `a` **attribute** +20 to Intelligence (1.3 units)

### Flashes of Insight (insight)

Insight charges (40% crit chance each): a charge more, charges on crit, longer charges. The crit caster's commitment, a side room.

- `a` 15% increased Insight Charge Duration (1.0 units)
- `b` 15% increased Insight Charge Duration (1.0 units)
- `n` **notable Flashes of Insight** 1 to Maximum Insight Charges; 10% chance to gain an Insight Charge on Critical Strike (4.0 units) — A fourth insight charge (3 units by the table) and a way to gain them: 4.
- `c` 15% increased Insight Charge Duration (1.0 units)

### Hexwright (hexwright)

Curse effect twice, then the notable with curse effect, curse area and skill duration: the curse caster's chain from the junction east toward the Knife, a stub until the Knife is written and its curse barb lands on it.

- `a` 8% increased effect of your Hexes (1.0 units)
- `b` 8% increased effect of your Hexes (1.0 units)
- `n` **notable Hexwright** 12% increased effect of your Hexes; 15% increased Area of Effect with Curses; 10% increased Skill Effect Duration (4.0 units) — 1.5 + 1.5 + 1 units.

### Mana Bastion (manaBastion)

Two nodes of shield and mana, then the keystone: energy shield protects mana, and costs are paid from energy shield first. The mirror of Mind Bulwark across the column: the two keystones are one decision from either side.

- `a` 5% increased maximum Energy Shield (1.0 units)
- `b` 5% increased maximum Energy Shield (1.0 units)
- `k` **keystone Mana Bastion** Energy shield protects mana instead of life. Skill costs are paid from energy shield first.

Links:

- focus.n1 ↔ wandwork.a: The wand room opens off the damage notable.
- wandwork.b ↔ manaBastion.a: The wand room's far node to the Mana Bastion spur: the keystone has two ways in.
- insight.n ↔ hexwright.a: Flashes of Insight to the curse chain: the crit caster and the curse caster share a step.
- hexwright.b ↔ manaBastion.b: The curse chain to the Mana Bastion spur: a loop around the junction.
- focus.c ↔ j1.a: The wheel's east side to the junction.
- j1.a ↔ insight.a: Junction to the insight room.
- j1.a ↔ hexwright.a: Junction to the curse chain.
- j1.a ↔ manaBastion.a: Junction to the keystone spur.
- focus.b ↔ spire.column.j1.a: Up the column from the wheel's north-west small.

## The column (spire.column)

Every spell is an area or a projectile; the column sells the shape before the fork sells the element, and the resist star up its middle is the plain way through for a caster who wants neither yet.

### Junction (j1)

Where the well and the craft meet above the base: a loop, so neither road is a dead choice. Forks to the two shape clusters and to the star.

- `a` **attribute** +20 to Intelligence (1.3 units)

### Prism Ward (star)

The resist star: all resistances and ailment avoidance in the notable, one single-node spoke per element, each landing somewhere else: south on the junction, west on the area cluster, east on the projectile cluster, north on the fork. The column's spine: a caster who wants resistances walks straight up it.

- `n` **notable Prism Ward** +8% to all Elemental Resistances; 20% chance to Avoid Elemental Ailments (4.0 units) — 2 + 2 units.
- `s` +10% to Fire Resistance (1.3 units) — The fire spoke, to the junction.
- `w` +10% to Cold Resistance (1.3 units) — The cold spoke, to the area cluster.
- `e` +10% to Lightning Resistance (1.3 units) — The lightning spoke, to the projectile cluster.
- `f` +10% to Chaos Resistance (1.3 units) — The chaos spoke, to the fork.

### Broad Weave (broadWeave)

Spell area: radius and area damage, tagged spell so the Wall's slams do not shop here. West of the column, reached from the junction, the star's cold spoke and the Siphon chain; passed through to the fork and onto the Withering chain.

- `a` 8% increased Area of Effect with Spells (1.0 units) — The entrance, south-east, where the Siphon chain and the star's spoke also arrive.
- `n` **notable Broad Weave** 16% increased Area of Effect with Spells; 12% increased Damage with Spells with Area Skills; +10 to Intelligence (4.2 units) — 2 + 1.5 + 0.7 units.
- `b` 8% increased Area of Effect with Spells (1.0 units) — Where the Withering chain leaves.
- `c` 8% increased Area of Effect with Spells (1.0 units) — The north exit, to the fork.

### Darting Bolts (dartingBolts)

Spell projectiles: damage, speed, cast speed. East of the column, reached from the junction and the star's lightning spoke; passed through to the fork and onto the Lingering chain.

- `a` 10% increased Damage with Spells with Projectiles (1.0 units) — The entrance, south, where the star's spoke also arrives.
- `n` **notable Darting Bolts** 20% increased Damage with Spells with Projectiles; 10% increased Projectile Speed; 4% increased Cast Speed (4.0 units) — 2 + 1 + 1 units.
- `b` 10% increased Damage with Spells with Projectiles (1.0 units) — Where the Lingering chain leaves.
- `c` 10% increased Damage with Spells with Projectiles (1.0 units) — The east side.

### Withering (withering)

Damage over time, then the notable with damage over time, chaos damage over time multiplier and chaos damage: for the Mystic's chaos and plague spells, as a chain from the area cluster to the fire arm's first cluster. A second way into the fire arm, and the Spire's only chaos lines.

- `a` 10% increased Damage over Time (1.0 units)
- `n` **notable Withering** 20% increased Damage over Time; 8% to the Chaos Damage over Time Multiplier; 10% increased Chaos Damage (4.3 units) — 2 + 1.3 + 1 units.

### Lingering (lingering)

Skill effect duration, then the notable with duration and cast speed: for the Mystic's ground and duration spells, as a chain from the projectile cluster to the lightning arm's first cluster. A second way into the lightning arm.

- `a` 10% increased Skill Effect Duration (1.0 units)
- `n` **notable Lingering** 20% increased Skill Effect Duration; 5% increased Cast Speed (3.3 units) — 2 + 1.25 units.

### The parting (fork)

The element decision: fire north-west, cold north, lightning north-east. An attribute node; the arms are joined again a few steps up (brief §2), and the bridges from the shape clusters reach the outer arms without it, so the choice is a cost, not a wall.

- `a` **attribute** +20 to Intelligence (1.3 units)

Links:

- j1.a ↔ star.s: Junction to the star's fire spoke: the spine.
- star.w ↔ broadWeave.a: The star's cold spoke to the area cluster.
- star.e ↔ dartingBolts.a: The star's lightning spoke to the projectile cluster.
- star.f ↔ fork.a: The star's chaos spoke to the fork: the spine reaches the arms.
- j1.a ↔ broadWeave.a: Junction to the area cluster.
- j1.a ↔ dartingBolts.a: Junction to the projectile cluster.
- broadWeave.c ↔ fork.a: The area cluster to the fork.
- dartingBolts.n ↔ fork.a: The projectile cluster to the fork, from its notable.
- broadWeave.b ↔ withering.a: The area cluster onto the Withering chain.
- withering.n ↔ spire.fire.kindling.a: The Withering chain lands on the fire arm.
- dartingBolts.b ↔ lingering.a: The projectile cluster onto the Lingering chain.
- lingering.n ↔ spire.storm.static.a: The Lingering chain lands on the lightning arm.
- fork.a ↔ spire.fire.kindling.a: The fire arm.
- fork.a ↔ spire.frost.rime.a: The cold arm.
- fork.a ↔ spire.storm.static.a: The lightning arm.

## Fire (spire.fire)

Fire: the big hit and the burn after it. Two clusters, the second a side room, and the end junction where the Cathedral's fire caster arrives. The Zealot borrows this arm's root (brief §2): the dear crossing from the minions lands here.

### Kindling (kindling)

Fire damage with fire penetration in the notable: the first cluster of the arm, passed through from the fork to the arm's junction.

- `a` 10% increased Fire Damage (1.0 units) — The entrance, from the fork.
- `n` **notable Kindling** 24% increased Fire Damage; Damage Penetrates 4% of Enemy Fire Resistance (4.4 units) — 2.4 + 2 units: penetration is the line a fire caster cannot get from a small node.
- `b` 10% increased Fire Damage (1.0 units) — The west exit, to the arm's junction.
- `c` 10% increased Fire Damage (1.0 units) — The north exit, to the inter-arm junction and the cold arm.

### Junction (jArm)

The arm's junction: the ignite room north-west, and the dear crossing from the Cathedral's minions west.

- `a` **attribute** +20 to Intelligence (1.3 units)

### Cinder (cinder)

Ignite: chance, burning damage, faster burning. The fire caster's second decision, a side room at the arm's end.

- `a` 12% increased Fire Damage over Time (1.0 units)
- `n` **notable Cinder** 15% chance to Ignite; 30% increased Fire Damage over Time; 10% increased speed at which Ignites deal their damage (5.0 units) — 1.5 + 2.5 + 1 units.
- `b` 12% increased Fire Damage over Time (1.0 units)
- `c` 12% increased Fire Damage over Time (1.0 units)

Links:

- kindling.b ↔ jArm.a: Through the fire cluster to the arm's junction.
- jArm.a ↔ cinder.a: Junction to the ignite room.
- kindling.c ↔ spire.frost.jFire.a: The inter-arm link to the cold arm: a second element four to six points past the first (brief §2).

## Cold (spire.frost)

Cold: the hit that slows, then the hit that stops. The middle arm, so it is the one both other arms are joined to; the keystone that rewards two elements sits on the fire-side join, where a fire-and-cold caster passes anyway.

### Rime (rime)

Cold damage with the effect of chill in the notable: the first cluster of the arm, passed through from the fork up to the arm's junction, with the two inter-arm junctions off its sides.

- `a` 10% increased Cold Damage (1.0 units) — The entrance, from the fork.
- `w` 10% increased Cold Damage (1.0 units) — The west side, to the fire join.
- `n` **notable Rime** 24% increased Cold Damage; 20% increased Effect of Chill (4.4 units) — 2.4 + 2 units. The north exit.
- `e` 10% increased Cold Damage (1.0 units) — The east side, to the lightning join.

### Join to fire (jFire)

The inter-arm junction between cold and fire, and the foot of the Prismatic Balance spur: the two-element caster's crossing.

- `a` **attribute** +20 to Intelligence (1.3 units)

### Join to lightning (jStorm)

The inter-arm junction between cold and lightning.

- `a` **attribute** +20 to Intelligence (1.3 units)

### Prismatic Balance (prismatic)

Three nodes of elemental damage, then the trade: hits give +25% to the hit's elements and -50% to the others for 5 s. Only a two-element rotation profits, which is why it sits on the join between two arms.

- `a` 8% increased Elemental Damage (0.8 units)
- `b` 8% increased Elemental Damage (0.8 units)
- `c` 8% increased Elemental Damage (0.8 units)
- `k` **keystone Prismatic Balance** Your hits give the target +25% resistance to the hit's elements and −50% to the others for 5 s.

### Junction (jArm)

The arm's junction above the first cluster: the shatter room, and the top spur.

- `a` **attribute** +20 to Intelligence (1.3 units)

### Shatter (shatter)

Freeze chance, cold penetration, cold damage over time: the cold caster's second decision. Passed through, up to the top spur.

- `a` 5% chance to Freeze (0.6 units) — The entrance, south.
- `b` 5% chance to Freeze (0.6 units)
- `n` **notable Shatter** 10% chance to Freeze; Damage Penetrates 4% of Enemy Cold Resistance; 6% to the Cold Damage over Time Multiplier (4.3 units) — 1.25 + 2 + 1 units. The north exit.
- `c` 5% chance to Freeze (0.6 units)

### Fever Pitch (feverPitch)

Three nodes of elemental damage, then the trade: critical strike multiplier fixed at 100%, and 40% more elemental damage for 8 s after a critical strike. The top of the Spire, the farthest keystone of the region.

- `a` 8% increased Elemental Damage (0.8 units)
- `b` 8% increased Elemental Damage (0.8 units)
- `c` 8% increased Elemental Damage (0.8 units) — A third small: the top is meant to be far.
- `k` **keystone Fever Pitch** After a critical strike, 40% more elemental damage for 8 s. Critical strike multiplier is 100%.

Links:

- rime.w ↔ jFire.a: The cold cluster's west side to the fire join.
- rime.e ↔ jStorm.a: The cold cluster's east side to the lightning join.
- jFire.a ↔ prismatic.a: The fire join to the Prismatic Balance spur.
- jStorm.a ↔ spire.storm.static.c: The inter-arm link to the lightning arm (brief §2).
- rime.n ↔ jArm.a: Up through the cold notable to the arm's junction.
- jArm.a ↔ shatter.a: Junction to the shatter room.
- shatter.n ↔ feverPitch.a: Through the shatter notable to the top spur: the top costs both notables.

## Lightning (spire.storm)

Lightning: the hit that is sometimes huge, and the shock that makes the next one huger. The Shade borrows this arm's root (brief §2); the dear crossing to the Knife's curses leaves from the arm's junction. Pain Conduit at the tip is the low-life caster's keystone, reached by reservation or by being hurt.

### Static (static)

Lightning damage with shock chance in the notable: the first cluster of the arm, passed through from the fork to the arm's junction; its west side takes the join from the cold arm.

- `a` 10% increased Lightning Damage (1.0 units) — The entrance, from the fork.
- `c` 10% increased Lightning Damage (1.0 units) — The north-west side, to the cold join.
- `n` **notable Static** 24% increased Lightning Damage; 10% chance to Shock (3.4 units) — 2.4 + 1 units; a chance to shock without a crit is what the plain lightning caster lacks.
- `b` 10% increased Lightning Damage (1.0 units) — The east exit, to the arm's junction.

### Junction (jArm)

The arm's junction: the shock room north-east, the Pain Conduit spur east, and the dear crossing to the Knife's curses south-east.

- `a` **attribute** +20 to Intelligence (1.3 units)

### Overcharge (overcharge)

The effect of shock, lightning penetration: the lightning caster's second decision, a side room.

- `a` 10% increased Effect of Shock (1.0 units)
- `n` **notable Overcharge** 20% increased Effect of Shock; Damage Penetrates 4% of Enemy Lightning Resistance (4.0 units) — 2 + 2 units.
- `b` 10% increased Effect of Shock (1.0 units)
- `c` 10% increased Effect of Shock (1.0 units)

### Pain Conduit (painConduit)

Two nodes of spell and lightning damage, then the keystone: 30% more spell damage on low life. The tip of the lightning arm.

- `a` 8% increased Spell Damage (1.0 units)
- `b` 8% increased Spell Damage (1.0 units)
- `k` **keystone Pain Conduit** 30% more spell damage while on low life.

Links:

- static.b ↔ jArm.a: Through the lightning cluster to the arm's junction.
- jArm.a ↔ overcharge.a: Junction to the shock room.
- jArm.a ↔ painConduit.a: Junction to the keystone spur.
- overcharge.c ↔ painConduit.b: The shock room's far side to the keystone spur's second node: two ways to Pain Conduit.
