## The Bow gate (bow.home)

The kit is a bow, and the Strider's first gem is almost always a bow attack, so the chain is life and dexterity and the signature is projectile damage, evasion and dexterity (the brief's own words). Three porches at point five: the bows, the string, the physical end.

### The first steps (chain)

Life, then the attribute junction that joins the ring, then the signature.

- `a` 5% increased maximum Life (1.0 units) — The first point: life. A Strider is the class that dies to one hit on map 4; evasion does nothing against the first of them.
- `j` **attribute** +20 to Dexterity (1.3 units) — The junction: dexterity for the level-10 bow, and the way onto the ring toward the Shade or the Reaver.
- `s` **notable Hawk's Eye** 10% increased Damage with Projectiles; 12% increased Evasion Rating; +20 to Dexterity; 5% increased maximum Life (4.3 units) — The signature: projectile damage, evasion, dexterity and a little life. 4.3 units.

### Stave porch (porchB)

Bow damage, then bow speed: the way up to the bows.

- `a` 10% increased Damage with Bows; 10% increased Damage over Time from Attack Skills while wielding a Bow (1.0 units)
- `b` 8% increased Damage with Bows; 8% increased Damage over Time from Attack Skills while wielding a Bow; 2% increased Attack Speed with Bows (1.5 units)

### String porch (porchE)

Evasion, then evasion and speed: the string, the generic road a Strider of any build can take.

- `a` 12% increased Evasion Rating (1.0 units)
- `b` 12% increased Evasion Rating; 2% increased Attack Speed (1.7 units)

### Steel porch (porchP)

Physical attack damage, then physical and life: the way down to the physical end, for the Strider who found a sword or a heavy bow.

- `a` 10% increased Physical Damage with Attack Skills (1.0 units)
- `b` 8% increased Physical Damage with Attack Skills; 5% increased maximum Life (1.8 units)

Links:

- start.strider ↔ chain.a: The one way out of the start.
- chain.j ↔ centre.ring.road.r7: The junction joins the ring one node toward the Shade, clear of the start.
- chain.s ↔ porchB.a: First porch: the bows.
- chain.s ↔ porchE.a: Second porch: the string.
- chain.s ↔ porchP.a: Third porch: the physical end.

## Evasion and speed (bow.string)

What every Strider wants whatever it shoots: evasion and attack speed. Two clusters either side of a junction, nothing conditional, and the string's far end lands on the projectiles in the middle of the arc, so the string is the cheap way to the arc's middle.

### Junction (j1)

The first fork on the string: evasion north, speed south.

- `a` **attribute** +20 to Dexterity (1.3 units)

### Fleet Foot (fleetFoot)

Evasion and movement speed: the Strider that is not where the hit lands. Passed through from the junction to the string's far end.

- `a` 12% increased Evasion Rating (1.0 units) — The entrance, south-west.
- `b` 12% increased Evasion Rating (1.0 units)
- `n` **notable Fleet Foot** 24% increased Evasion Rating; 5% increased Movement Speed; +10 to Dexterity (3.9 units) — 2 + 1.25 + 0.7 units.
- `c` 8% increased Evasion Rating; 2% increased Movement Speed (1.2 units) — The east exit.

### Quick Hands (quickHands)

Attack speed and accuracy, generic: a sword Strider shops here as much as a bow one. Passed through; the Yard crossing leaves from its south.

- `a` 3% increased Attack Speed (1.0 units) — The entrance, north-west.
- `b` 3% increased Attack Speed (1.0 units)
- `n` **notable Quick Hands** 6% increased Attack Speed; 10% increased Accuracy Rating; +10 to Dexterity (3.7 units) — 2 + 1 + 0.7 units.
- `c` 2% increased Attack Speed; 5% increased Accuracy Rating (1.2 units)

### Junction (j2)

The string's far end: the projectiles ahead, the bows up, the speed and bleed down.

- `a` **attribute** +20 to Dexterity (1.3 units)

### To the Yard (toYard)

The near crossing to the Yard's dual wield and speed (C-brief §4: dual-wield evasion builds, sword Striders): two dexterity nodes from the steel porch's junction, the corner of the Bow nearest the Yard (a bridge from the string itself would cross the road to the physical end), and dexterity because a second sword asks for it.

- `a` **attribute** +30 to Dexterity (2.0 units)
- `b` **attribute** +30 to Dexterity (2.0 units)

Links:

- bow.home.porchE.b ↔ j1.a: The string porch to the first junction.
- j1.a ↔ fleetFoot.a: Junction to evasion.
- j1.a ↔ quickHands.a: Junction to speed.
- fleetFoot.c ↔ j2.a: Evasion to the far junction.
- quickHands.n ↔ j2.a: Speed to the far junction, through its notable: the shortcut costs the notable.
- bow.steel.jP.a ↔ toYard.a: Onto the Yard crossing from the steel porch's junction.
- toYard.b ↔ yard.dual.j2.a: The crossing lands on the dual-wield wheel's east junction.

## Bows (bow.bows)

The weapon. One wheel with two notables (damage and speed on one side, accuracy on the other) and the keystone that is the bow's own trade. Kept small: the bow's power is in the arrows (the projectiles area) as much as the stave.

### Longbow (longbow)

The bow wheel: entered from the west (the porch, and the Knife's near crossing when it is written), left to the east junction. Damage and speed on the north side, accuracy on the south. No road node before it: the bows are the Strider's own thing.

- `a` 10% increased Damage with Bows; 10% increased Damage over Time from Attack Skills while wielding a Bow (1.0 units) — The entrance, west.
- `b` 10% increased Damage with Bows; 10% increased Damage over Time from Attack Skills while wielding a Bow (1.0 units)
- `n1` **notable Longbow** 24% increased Damage with Bows; 24% increased Damage over Time from Attack Skills while wielding a Bow; 5% increased Attack Speed with Bows (4.1 units) — 2.4 + 1.7 units.
- `c` 8% increased Damage with Bows; 8% increased Damage over Time from Attack Skills while wielding a Bow; 2% increased Attack Speed with Bows (1.5 units) — The east exit.
- `d` 10% increased Damage with Bows; 10% increased Damage over Time from Attack Skills while wielding a Bow (1.0 units)
- `n2` **notable Sure Shot** 20% increased Accuracy Rating; 12% increased Damage with Bows; 12% increased Damage over Time from Attack Skills while wielding a Bow; 3% increased Attack Speed with Bows (4.2 units) — Accuracy first: 2 + 1.2 + 1 units.

### Junction (j2)

The wheel's east junction: the keystone spur north, the projectiles south-east.

- `a` **attribute** +30 to Dexterity (2.0 units)

### Steady Draw (steadyDraw)

Three nodes of bow and projectile damage, then the trade: bows deal 35% more damage and attack 20% slower. The first keystone of the Bow, 14 steps out.

- `a` 10% increased Damage with Bows; 10% increased Damage over Time from Attack Skills while wielding a Bow (1.0 units)
- `b` 10% increased Damage with Projectiles (1.0 units)
- `c` 8% increased Damage with Bows; 8% increased Damage over Time from Attack Skills while wielding a Bow; +5 to Dexterity (1.1 units)
- `k` **keystone Steady Draw** Bow attacks deal 35% more damage with 20% less attack speed.

Links:

- bow.home.porchB.b ↔ longbow.a: The stave porch straight onto the wheel.
- longbow.c ↔ j2.a: The wheel's east side to the east junction.
- j2.a ↔ steadyDraw.a: Junction to the keystone spur.
- j2.a ↔ bow.flight.farFlight.a: Down the arc from the bows to the projectiles.

## Projectiles (bow.flight)

The arrows. Generic projectile lines, not bow lines, so that a wand Mystic or a dagger-throwing Shade who crosses here is served too. The extra projectile is the prize of the area and the only line of its notable.

### Far Flight (farFlight)

Projectile damage and speed: the plain cluster of the area, passed through from the bows (north) and the string (west) to the junction (east).

- `a` 10% increased Damage with Projectiles (1.0 units) — The north entrance, from the bows.
- `b` 10% increased Damage with Projectiles (1.0 units) — The east exit.
- `n` **notable Far Flight** 20% increased Damage with Projectiles; 20% increased Projectile Speed (4.0 units) — 2 + 2 units.
- `c` 10% increased Projectile Speed (1.0 units) — The west entrance, from the string.

### Junction (j1)

The fork east of the plain cluster: the extra projectile north-east, the keystone spur east, the speed and bleed south.

- `a` **attribute** +30 to Dexterity (2.0 units)

### Split Volley (splitVolley)

The extra projectile, a side room with one door: three smalls of projectile damage, then +1 projectile and nothing else, because it needs nothing else.

- `a` 10% increased Damage with Projectiles (1.0 units)
- `b` 10% increased Damage with Projectiles (1.0 units)
- `n` **notable Split Volley** 1 additional Projectiles (4.0 units) — Hand-valued at 4 units: a fifth to a whole skill's damage, by the skill.

### Close Quarters (closeQuarters)

Three nodes of projectile damage and accuracy, then the trade: projectile attacks deal up to 50% more damage to near targets and 50% less to far ones. The Strategy tab's spacing is the player's hand on it, and its card says so.

- `a` 10% increased Damage with Projectiles (1.0 units)
- `b` 10% increased Accuracy Rating (1.0 units)
- `c` 8% increased Damage with Projectiles; 5% increased Accuracy Rating (1.3 units)
- `d` 10% increased Damage with Projectiles (1.0 units) — A fourth small: the rim keystones of the Bow are meant to be a step farther than its first one.
- `k` **keystone Close Quarters** Projectile attack damage: up to 50% more at close range, falling to 50% less at long range.

Links:

- bow.string.j2.a ↔ farFlight.c: The string lands on the projectiles' west side.
- farFlight.b ↔ j1.a: Through the plain cluster to the junction.
- j1.a ↔ splitVolley.a: Junction to the extra projectile.
- j1.a ↔ closeQuarters.a: Junction to the keystone spur.
- j1.a ↔ bow.quiver.rapidFire.a: Down the arc to the speed and bleed.

## Attack speed and bleed (bow.quiver)

Many arrows, and arrows that keep hurting. Attack speed here is generic (the string has the other speed cluster, so a Strider has two ways to it); bleed is the Bow's damage over time, cheaper from the Yard's side but present here for the bleed bow.

### Rapid Fire (rapidFire)

Attack speed and accuracy, passed through from the projectiles (north) to the junction (south-west) and on to the physical end.

- `a` 3% increased Attack Speed (1.0 units) — The north entrance.
- `b` 3% increased Attack Speed (1.0 units)
- `n` **notable Rapid Fire** 8% increased Attack Speed; 10% increased Accuracy Rating; +5 to Dexterity (4.0 units) — 2.7 + 1 + 0.3 units.
- `c` 2% increased Attack Speed; 5% increased Accuracy Rating (1.2 units) — The west exit, to the physical end.

### Junction (j1)

The fork below the speed cluster: bleed south-east, the Arrow Weave spur east.

- `a` **attribute** +30 to Dexterity (2.0 units)

### Barbed Arrows (barbed)

Bleeding on attacks: chance, damage, speed. A side room; the bleed bow's destination.

- `a` 8% chance to cause Bleeding with Attacks (0.8 units)
- `n` **notable Barbed Arrows** 15% chance to cause Bleeding with Attacks; 24% increased Damage with Bleeding; 10% increased speed at which Bleeding deals its damage (4.5 units) — 1.5 + 2 + 1 units.
- `b` 12% increased Damage with Bleeding (1.0 units)
- `c` 12% increased Damage with Bleeding (1.0 units)

### Arrow Weave (arrowWeave)

Three nodes of evasion, then the trade: +40% chance to evade projectiles, 30% less chance to evade melee. The archer who stands off: the rim of the Bow.

- `a` 12% increased Evasion Rating (1.0 units)
- `b` 12% increased Evasion Rating (1.0 units)
- `c` 8% increased Evasion Rating; +5 to Dexterity (1.0 units)
- `d` 12% increased Evasion Rating (1.0 units) — A fourth small: the rim keystones of the Bow are meant to be a step farther than its first one.
- `k` **keystone Arrow Weave** +40% chance to evade projectile attacks; −30% chance to evade melee attacks.

Links:

- rapidFire.n ↔ j1.a: Through the speed notable to the junction below.
- j1.a ↔ barbed.a: Junction to the bleed.
- j1.a ↔ arrowWeave.a: Junction to the keystone spur.
- rapidFire.c ↔ bow.steel.ironTips.a: The arc continues from the speed cluster to the physical end.

## Physical attacks (bow.steel)

The Strider who hits hard rather than often: physical attack damage with no weapon in the line, so a sword, a claw or a heavy bow all count. Reached from the home by its own porch (12 steps to the notable) and from the arc above; the Yard is a walk beyond.

### Junction (jP)

One dexterity node between the porch and the cluster, and the fork to the near Yard crossing: the physical end is meant to be a step farther than the string, because it is the less usual Strider.

- `a` **attribute** +20 to Dexterity (1.3 units)

### Iron Tips (ironTips)

Physical attack damage, accuracy, a little speed. Entered from the porch (north-west) and the arc (east), left south to the junction.

- `a` 10% increased Physical Damage with Attack Skills (1.0 units) — The north-west entrance, from the porch.
- `d` 10% increased Physical Damage with Attack Skills (1.0 units) — The east entrance, from the arc.
- `n` **notable Iron Tips** 24% increased Physical Damage with Attack Skills; 10% increased Accuracy Rating; 3% increased Attack Speed (4.4 units) — 2.4 + 1 + 1 units.
- `b` 8% increased Physical Damage with Attack Skills; 5% increased maximum Life (1.8 units) — The south exit.

### Junction (j1)

The fork below the cluster: the Plated Hide spur south, the dear crossing to the Yard south-west.

- `a` **attribute** +30 to Dexterity (2.0 units)

### Plated Hide (platedHide)

Three nodes of evasion and armour, then the trade: evasion becomes armour, dexterity gives no evasion. The armoured archer: the rim of the Bow's south.

- `a` 12% increased Evasion Rating (1.0 units)
- `b` 12% increased Armour (1.0 units)
- `c` 6% increased Evasion Rating; 6% increased Armour (1.0 units)
- `k` **keystone Plated Hide** Evasion rating is converted to armour. Dexterity gives no evasion bonus.

### To the Yard (toYard)

The dear crossing to the Yard's bleed and leech (C-brief §4: bleed and sword Striders; leech): two dexterity nodes on a long walk, because it is meant to be long.

- `a` **attribute** +30 to Dexterity (2.0 units)
- `b` **attribute** +30 to Dexterity (2.0 units)

Links:

- bow.home.porchP.b ↔ jP.a: The steel porch to the junction.
- jP.a ↔ ironTips.a: Junction to the cluster.
- ironTips.b ↔ j1.a: Through the cluster to the junction below.
- j1.a ↔ platedHide.a: Junction to the keystone spur.
- j1.a ↔ toYard.a: Junction onto the Yard crossing.
- toYard.b ↔ yard.blood.j2.a: The crossing lands on the Yard's east rim junction, beside Crimson Pact.
