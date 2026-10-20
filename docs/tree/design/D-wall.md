## The gate (wall.home)

Two stat nodes off the start (armour north, melee damage south), the signature between them, two hubs one step out with a pocket each, and three roads: the rampart north-west, the tower west, the slams south.

### Oathbound (sig)

The loop the start opens onto: armour on the north side, melee physical damage on the south, the signature at the tip. Point one is a side; point two is the signature, a hub, or a road.

- `a` 12% increased Armour (1.0 units) — The north side: defence.
- `n` **notable Oathbound** 8% increased maximum Life; 10% increased Physical Damage with Melee; +20 to Strength (3.9 units) — The signature: life, the weapon's damage and strength. 3.9 units, at step two or three. The tower road leaves from here.
- `b` 10% increased Physical Damage with Melee (1.0 units) — The south side: offence.

### The hubs (hubs)

Strength, one step past each side node: the north hub joins the ring toward the Zealot and starts the rampart road; the south hub joins the ring toward the Reaver and starts the slam road.

- `n` **attribute** +20 to Strength (1.3 units)
- `s` **attribute** +20 to Strength (1.3 units)

### Unshakable (unshakable)

The north hub's pocket, a tight orbit: two stun threshold nodes and a notable with threshold and stun recovery. The Vanguard who stands in the hit, three points after the hub.

- `a` 8% increased Stun Threshold (1.0 units) — The entrance, facing the hub.
- `b` 8% increased Stun Threshold (1.0 units)
- `n` **notable Unshakable** 16% increased Stun Threshold; 20% reduced Stun Duration on you (3.3 units) — 2 + 1.3 units.

### Quartermaster (quartermaster)

The south hub's pocket, a tight orbit: two flask recovery nodes and a notable with flask effect and recovery. The early game is life flasks; this is the cheap way to make them matter, for any class that crosses here.

- `a` 10% increased Flask Recovery amount (1.0 units) — The entrance, facing the hub.
- `n` **notable Quartermaster** 8% increased effect of Flasks; 15% increased Flask Recovery amount; 5% increased maximum Life (4.1 units) — 1.6 + 1.5 + 1 units.
- `b` 10% increased Flask Recovery amount (1.0 units)

### The rampart road (roadR)

Armour twice: the road from the north hub to the Bulwark.

- `a` 12% increased Armour (1.0 units)
- `b` 12% increased Armour (1.0 units)

### The tower road (roadM)

Melee physical damage three times: the road west from the signature to the maces, which serves a one-hander and a two-hander alike.

- `a` 10% increased Physical Damage with Melee (1.0 units)
- `b` 10% increased Physical Damage with Melee (1.0 units)
- `c` 10% increased Physical Damage with Melee (1.0 units)

### The slam road (roadS)

Melee area twice: the road south from the south hub to the slams.

- `a` 8% increased Damage with Melee with Area Skills (1.0 units)
- `b` 8% increased Damage with Melee with Area Skills (1.0 units)

Links:

- start.vanguard ↔ sig.a: Point one, the north side.
- start.vanguard ↔ sig.b: Point one, the south side.
- sig.a ↔ hubs.n: The north side to the north hub.
- sig.b ↔ hubs.s: The south side to the south hub.
- hubs.n ↔ unshakable.a: The north hub's pocket.
- hubs.s ↔ quartermaster.a: The south hub's pocket.
- hubs.n ↔ centre.ring.road.r17: The north hub joins the ring one node toward the Zealot, clear of the start.
- hubs.s ↔ centre.ring.road.r15: The south hub joins the ring one node toward the Reaver, clear of the start.
- hubs.n ↔ roadR.a: The rampart road.
- sig.n ↔ roadM.a: The tower road.
- hubs.s ↔ roadS.a: The slam road.
- hubs.n ↔ wall.resists.banner.a: The reservation chain north, toward the Zealot.
- roadR.b ↔ wall.rampart.bulwark.a: The rampart road reaches the Bulwark.
- roadM.c ↔ wall.maces.weight.a: The tower road reaches the maces.
- roadS.b ↔ wall.slams.thunderstep.a: The slam road reaches the slams.
- unshakable.n ↔ roadR.a: The stun pocket is also a way onto the rampart road: a pocket as a bridge.
- quartermaster.n ↔ roadS.a: The flask pocket is also a way onto the slam road.
- quartermaster.n ↔ wall.slams.thunderstep.a: And straight on to the slams: the pocket is a loop with the slam road.
- unshakable.n ↔ wall.resists.banner.a: The stun pocket to the Banner chain: a loop with the north hub.

## Life and armour (wall.rampart)

Every Vanguard build wants life and armour, so this is the cheapest area and the one with the most ways through it: into the tower by two loops, into the resistances by the star, out to the axes by the accuracy pocket.

### The Bulwark (bulwark)

The rampart's landmark: a wheel of seven with two notables, life on the north side and armour on the south. Entered from the rampart road on the east, left to the junction from the life notable on the north-west; the armour notable on the south-west opens the stun room.

- `a` 5% increased maximum Life (1.0 units) — The entrance.
- `c` 12% increased Armour (1.0 units)
- `d` 12% increased Armour (1.0 units)
- `n2` **notable Mortar and Stone** 30% increased Armour; 2% additional Physical Damage Reduction (4.5 units) — The armour notable: a flat 2% physical reduction on top, which armour alone never gives against a big hit. 4.5 units.
- `e` 12% increased Armour (1.0 units)
- `n1` **notable Stone Heart** 12% increased maximum Life; 24% increased Armour (4.4 units) — The life notable: 4.4 units, nothing conditional; the way out is through it.
- `b` 5% increased maximum Life (1.0 units)

### Second Wind (secondWind)

Life regeneration, off the wheel's north small, and the landing of the resist star's chaos spoke: a recovery decision that is also a way between the rampart and the resistances.

- `a` Regenerate 0.4% of Life per second (1.0 units)
- `b` Regenerate 0.4% of Life per second (1.0 units)
- `n` **notable Second Wind** Regenerate 1% of Life per second; 8% increased maximum Life (4.1 units) — 2.5 units of regeneration and a little life: 4.1 units.

### Thick Skin (thickSkin)

Armour and stun threshold together: the Vanguard who wants to stand in the hit. Off the armour notable, and on to the tower's first junction: the second loop between the rampart and the tower.

- `a` 12% increased Armour (1.0 units)
- `b` 12% increased Armour (1.0 units)
- `n` **notable Thick Skin** 20% increased Armour; 16% increased Stun Threshold (3.7 units) — Armour and twice the stun threshold of a small: 3.7 units.

### Junction (j1)

The rampart's junction, off the life notable: the keystone spur west, the accuracy pocket south-west, the resist star's fire spoke north.

- `a` **attribute** +20 to Strength (1.3 units)

### Unerring Discipline (unerring)

The spur to the first keystone: two nodes about hitting, then the trade (attacks always hit; never a critical strike). Dead-ended, off the junction, as the reference places its keystones.

- `a` 10% increased Accuracy Rating (1.0 units)
- `b` 8% increased Damage with Melee (1.0 units)
- `k` **keystone Unerring Discipline** Attacks always hit. Never deal critical strikes.

### Steady Hands (steadyHands)

Accuracy is a melee Vanguard's problem (strength gives none); this is the cheap answer beside the keystone that is the permanent one. Passed through, from the junction to the axes: the first loop that joins the rampart to the tower.

- `a` 10% increased Accuracy Rating (1.0 units) — The entrance from the junction.
- `n` **notable Steady Hands** 20% increased Accuracy Rating; 5% increased Attack Speed (3.7 units) — 2 units of accuracy and 1.7 of speed: 3.7.
- `b` 10% increased Accuracy Rating (1.0 units) — The exit to the axes.
- `c` 10% increased Accuracy Rating (1.0 units)

Links:

- bulwark.b ↔ secondWind.a: The recovery room opens off the wheel's north small.
- bulwark.n2 ↔ thickSkin.a: The stun room opens off the armour notable.
- thickSkin.n ↔ wall.maces.j1.a: Thick Skin on to the tower's junction: the rampart and the tower joined a second time, through armour.
- thickSkin.b ↔ wall.maces.weight.c: Thick Skin's second node to the mace wheel beside it: a third join.
- secondWind.b ↔ wall.home.roadR.b: Second Wind back to the rampart road: the recovery room is a loop with the Bulwark's entrance.
- bulwark.n1 ↔ j1.a: Out of the wheel through the life notable to the junction.
- j1.a ↔ unerring.a: Junction to the keystone spur.
- j1.a ↔ steadyHands.a: Junction to the accuracy pocket.
- steadyHands.b ↔ wall.maces.cleaver.c: The loop: through the accuracy pocket to the axes, so the rampart and the tower are never a dead choice against each other.

## Resistances (wall.resists)

Resistances are the stat every build needs by map 20 and no build enjoys buying; here they are the connector between the rampart, the recovery room, the maximum-resistance room and the Cathedral, so that buying them is also going somewhere.

### Elemental Ward (star)

The resist star: all resistances in the notable, one single-node spoke per element, each landing somewhere else. Fire south to the rampart's junction, chaos east to Second Wind, cold west to Tempered, lightning north to the crossing junction.

- `n` **notable Elemental Ward** +10% to all Elemental Resistances (2.5 units) — 2.5 units of resistance, which is the whole point.
- `f` +10% to Fire Resistance (1.3 units) — The fire spoke, to the rampart's junction.
- `c` +10% to Chaos Resistance (1.3 units) — The chaos spoke, to Second Wind.
- `w` +10% to Cold Resistance (1.3 units) — The cold spoke, to Tempered.
- `l` +10% to Lightning Resistance (1.3 units) — The lightning spoke, to the crossing junction.

### Junction (j)

The crossing junction: the near crossing to the Cathedral's block and shields (north) when the Cathedral is written, Tempered west, the star south, the Banner chain east.

- `a` **attribute** +20 to Strength (1.3 units)

### Tempered (tempered)

A point of maximum resistance is the rarest defensive stat in the game; it sits at the end of a short chain so that it is a destination, beside the dear crossing to the fire tower, and the star's cold spoke reaches it too.

- `a` +4% to all Elemental Resistances (1.0 units)
- `n` **notable Tempered** +1% to maximum Elemental Resistances; +6% to all Elemental Resistances (3.5 units) — +1% to maximum resistances (2 units by the table, more in play) and 1.5 units of resistance.

### Warlord's Banner (banner)

Reduced mana reservation twice, then the notable with reservation, aura effect and mana: the Vanguard's standards and heralds, as a chain from the north hub toward the Zealot. The Wall's only reservation lines, and the Cathedral's way in when it is written.

- `a` 3% reduced Mana Reserved (1.0 units)
- `b` 3% reduced Mana Reserved (1.0 units)
- `n` **notable Warlord's Banner** 5% reduced Mana Reserved; 8% increased effect of Auras on you; +30 to maximum Mana (4.5 units) — 1.7 + 1.3 + 1.5 units.

Links:

- star.f ↔ wall.rampart.j1.a: The fire spoke lands on the rampart's junction.
- star.c ↔ wall.rampart.secondWind.n: The chaos spoke lands on Second Wind: the recovery room has two doors.
- star.w ↔ tempered.a: The cold spoke lands on Tempered.
- star.l ↔ j.a: The lightning spoke lands on the crossing junction.
- j.a ↔ tempered.a: Junction to the maximum-resistance room: its second door.

## Maces, axes and two-handers (wall.maces)

The Vanguard's offence. The fork inside the area, maces or axes, is chosen by what dropped; two-handed lines serve both; crit for both runs between them. Reached from the home by the tower road, from the rampart by two loops.

### Weight of Iron (weight)

Maces first, because the kit is one. Mace lines also reach sceptres, so a Zealot who crosses here is served too. Passed through to the junction, and on to the slams through the notable.

- `a` 14% increased Physical Damage with Maces; 14% increased Damage over Time from Attack Skills while wielding a Mace; 14% increased Physical Damage with Sceptres; 14% increased Damage over Time from Attack Skills while wielding a Sceptre (1.0 units)
- `b` 14% increased Physical Damage with Maces; 14% increased Damage over Time from Attack Skills while wielding a Mace; 14% increased Physical Damage with Sceptres; 14% increased Damage over Time from Attack Skills while wielding a Sceptre (1.0 units)
- `n` **notable Weight of Iron** 24% increased Physical Damage with Maces; 24% increased Damage over Time from Attack Skills while wielding a Mace; 24% increased Physical Damage with Sceptres; 24% increased Damage over Time from Attack Skills while wielding a Sceptre; 20% increased Stun Duration on Enemies; 8% reduced Enemy Stun Threshold (4.0 units) — Mace damage with the stun a mace is for: 1.7 + 1.3 + 1 units.
- `c` 14% increased Physical Damage with Maces; 14% increased Damage over Time from Attack Skills while wielding a Mace; 14% increased Physical Damage with Sceptres; 14% increased Damage over Time from Attack Skills while wielding a Sceptre (1.0 units)

### Junction (j1)

The fork between the axes and the two-hander wheel; Thick Skin arrives here from the rampart.

- `a` **attribute** +20 to Strength (1.3 units)

### Crushing Blow (crushing)

Melee crit twice around the notable with mace crit multiplier, axe crit and double damage: a chain from the axes' far side to the two-hander wheel's far side. The crit Vanguard's pocket, and the loop between the axes and the big wheel.

- `a` 20% increased Critical Strike Chance with Melee (1.0 units)
- `n` **notable Crushing Blow** +20% to Critical Strike Multiplier with Maces; 20% increased Critical Strike Chance with Axes; 5% chance to deal Double Damage (3.7 units) — 1.7 + 1 + 1 units.
- `b` 20% increased Critical Strike Chance with Melee (1.0 units)

### Cleaver (cleaver)

Axes have no class kit, so their home must be reachable early from a start: here, off the first junction of the tower, from the rampart by the accuracy loop, and from the two-hander wheel by the crit chain.

- `a` 12% increased Physical Damage with Axes; 12% increased Damage over Time from Attack Skills while wielding an Axe (1.0 units)
- `n` **notable Cleaver** 24% increased Physical Damage with Axes; 24% increased Damage over Time from Attack Skills while wielding an Axe; 6% increased Attack Speed with Axes (4.0 units) — Axe damage and axe speed: 2 + 2 units.
- `b` 12% increased Physical Damage with Axes; 12% increased Damage over Time from Attack Skills while wielding an Axe (1.0 units)
- `c` 12% increased Physical Damage with Axes; 12% increased Damage over Time from Attack Skills while wielding an Axe (1.0 units) — Where the accuracy loop from the rampart arrives.

### Greatweight (greatweight)

The tower's landmark: a wheel of six with two notables, damage on one side and speed on the other, for any two-hander (mace, axe, staff or sword). Passed through toward the keystone.

- `a` 12% increased Physical Damage with Two Handed Weapons with Melee; 12% increased Damage over Time from Attack Skills while wielding a Two Handed Weapon (1.0 units)
- `b` 12% increased Physical Damage with Two Handed Weapons with Melee; 12% increased Damage over Time from Attack Skills while wielding a Two Handed Weapon (1.0 units)
- `n1` **notable Greatweight** 30% increased Physical Damage with Two Handed Weapons with Melee; 30% increased Damage over Time from Attack Skills while wielding a Two Handed Weapon; 20% increased Stun Duration on Enemies (3.8 units) — 2.5 units of two-handed damage and the stun: 3.8.
- `c` 12% increased Physical Damage with Two Handed Weapons with Melee; 12% increased Damage over Time from Attack Skills while wielding a Two Handed Weapon (1.0 units)
- `d` 12% increased Physical Damage with Two Handed Weapons with Melee; 12% increased Damage over Time from Attack Skills while wielding a Two Handed Weapon (1.0 units)
- `n2` **notable Heavy Hands** 8% increased Attack Speed with Two Handed Weapons with Melee; 15% increased Accuracy Rating (4.2 units) — Speed and accuracy with a two-hander: the other half of swinging a big weapon. 2.7 + 1.5 units.

### Junction (j2)

The fork at the tower's tip: the keystone spur.

- `a` **attribute** +20 to Strength (1.3 units)

### Rooted Stance (rooted)

Two nodes about not being moved, then the trade: cannot be stunned, cannot evade. The far keystone of the tower.

- `a` 8% increased Stun Threshold (1.0 units)
- `b` 8% increased Stun Threshold (1.0 units)
- `k` **keystone Rooted Stance** Cannot be stunned. Cannot evade enemy attacks.

Links:

- weight.c ↔ j1.a: Through the maces to the first junction.
- cleaver.b ↔ crushing.a: The axes' far side onto the crit chain.
- crushing.b ↔ greatweight.d: The crit chain lands on the two-hander wheel's far side.
- j1.a ↔ cleaver.a: Junction to the axes.
- j1.a ↔ greatweight.a: Junction to the two-hander wheel.
- greatweight.d ↔ j2.a: The wheel's far side leads to the tip junction.
- j2.a ↔ rooted.a: Junction to the keystone spur.
- weight.b ↔ wall.slams.thunderstep.c: Maces to slams directly from the wheel's south small: the two offensive areas touch, so a slam build with a mace never walks back through the home.
- greatweight.n2 ↔ cleaver.n: Heavy Hands to Cleaver: the two-hander wheel and the axes touch at their notables too.

## Stun and slams (wall.slams)

What a Vanguard does to a pack (slams: melee area) and to a rare (stun), with the pace, the leech and the totems around them. Every cluster here has two doors.

### Thunderstep (thunderstep)

Melee area first: the slam build's first stop, three steps below the south hub. Passed through to the junction; the maces arrive at its far side, the pace chain leaves from its radius node.

- `a` 8% increased Damage with Melee with Area Skills (1.0 units) — The entrance, from the slam road.
- `b` 8% increased Damage with Melee with Area Skills (1.0 units) — The pace chain leaves here, and the Yard's crit pocket arrives.
- `n` **notable Thunderstep** 20% increased Damage with Melee with Area Skills; 10% increased Area of Effect with Melee; 15% increased Stun Damage (4.8 units) — 2.5 + 1.25 + 1 units: area damage, radius and the stun a slam lands.
- `c` 8% increased Damage with Melee with Area Skills (1.0 units) — The exit to the junction, and where the maces arrive.

### Junction (j1)

The fork between stun and the totems.

- `a` **attribute** +20 to Strength (1.3 units)

### Unhurried (unhurried)

Movement speed, then a notable with movement and cooldown recovery (the guard skills' cooldown): a chain from the slams' radius node to the totems, a second way between them that skips the junction. The Vanguard is the slow class; this is where it buys pace.

- `a` 4% increased Movement Speed (1.0 units)
- `n` **notable Unhurried** 8% increased Movement Speed; 10% increased Cooldown Recovery Speed (3.0 units) — 2 + 1 units.

### Stagger (stagger)

Stun as its own diamond: duration, threshold and stun damage. Passed through toward the warcries; the leech chain leaves from its notable.

- `a` 15% increased Stun Duration on Enemies (1.0 units) — The entrance, from the junction.
- `b` 15% increased Stun Duration on Enemies (1.0 units)
- `n` **notable Stagger** 30% increased Stun Duration on Enemies; 12% reduced Enemy Stun Threshold; 15% increased Stun Damage (4.5 units) — Everything stun: 2 + 1.5 + 1 units. The node a mace build builds toward.
- `c` 15% increased Stun Duration on Enemies (1.0 units) — The exit, to the warcries.

### Vampiric Strikes (vampiric)

Melee life leech, then the notable with leech, life on hit and mana leech: the melee attacker's recovery, which no other Wall node sells, as a chain from the stun notable to the far side of the warcries. A second way from the slams into the grit.

- `a` 0.4% of Damage Leeched as Life with Melee (1.0 units)
- `n` **notable Vampiric Strikes** 0.8% of Damage Leeched as Life with Melee; Gain 6 Life per Enemy Hit with Melee; 0.4% of Damage Leeched as Mana (4.5 units) — 2 + 1.5 + 1 units.

### Standing Cairns (cairns)

Totems: damage, speed (a totem skill's speed is both how fast it is placed and how fast it fires), duration. Reached from the junction and from the pace chain.

- `a` 12% increased Damage with Totem Skills (1.0 units) — The entrance, top.
- `n` **notable Standing Cairns** 24% increased Damage with Totem Skills; 8% increased Attack Speed with Totem Skills; 8% increased Cast Speed with Totem Skills (4.3 units) — Damage and speed: 2 + 2.3 units.
- `b` 12% increased Damage with Totem Skills (1.0 units) — The exit, to the tip junction.
- `c` 12% increased Damage with Totem Skills (1.0 units) — The west side.

### Junction (j2)

The fork between the Strongarm spur and the near crossing to the Yard's swords and axes.

- `a` **attribute** +20 to Strength (1.3 units)

### Strongarm (strongarm)

Two nodes of projectile attack damage, then the trade: strength's melee bonus applies to projectile attacks, dexterity gives no evasion. For the bow-totem Vanguard and the thrower.

- `a` 10% increased Damage with Projectiles with Attacks (1.0 units)
- `b` 10% increased Damage with Projectiles with Attacks (1.0 units)
- `k` **keystone Strongarm** Strength's melee damage bonus also applies to projectile attacks. Dexterity gives no evasion bonus.

Links:

- thunderstep.c ↔ j1.a: Through the slams to the junction.
- thunderstep.b ↔ unhurried.a: The slams' radius node onto the pace chain.
- unhurried.n ↔ cairns.a: The pace chain lands on the totems.
- j1.a ↔ stagger.a: Junction to stun.
- j1.a ↔ cairns.a: Junction to the totems.
- stagger.n ↔ vampiric.a: The stun notable onto the leech chain.
- vampiric.n ↔ wall.grit.drums.c: The leech chain lands on the warcries' far side: the grit's second door.
- cairns.b ↔ j2.a: Through the totems to the tip junction.
- stagger.b ↔ vampiric.a: The stun diamond's second node onto the leech chain too: two doors.
- j2.a ↔ strongarm.a: Junction to the keystone spur.

## Grit and warcries (wall.grit)

The Vanguard's second commitment: the shouting, charge-holding, slow-to-die build. Far enough out to be a choice against the tower, with two doors from the slams, and the keystone at its end is the biggest trade in the region.

### War Drums (drums)

Warcries: duration and buff effect. Entered from the stun diamond on the north-east, or from the leech chain on the north-west; passed through to the junction.

- `a` 15% increased Skill Effect Duration with Warcries (1.0 units) — The entrance from the stun diamond.
- `n` **notable War Drums** 25% increased effect of your Warcries; 20% increased Skill Effect Duration with Warcries (3.8 units) — Louder and longer: 2.5 + 1.3 units.
- `b` 15% increased Skill Effect Duration with Warcries (1.0 units) — The exit to the junction.
- `c` 15% increased Skill Effect Duration with Warcries (1.0 units) — The far side, where the leech chain arrives.

### Junction (j1)

The fork between the grit wheel and the dear crossing from the Yard's bleed and leech.

- `a` **attribute** +20 to Strength (1.3 units)

### Unbroken (unbroken)

The grit wheel: a charge more, charges when hit, and life from the charges. The area's landmark, passed through.

- `a` 15% increased Grit Charge Duration (1.0 units)
- `n1` **notable Unbroken** 1 to Maximum Grit Charges; 20% increased Grit Charge Duration (4.3 units) — A fourth grit charge: 3 units by the table and the node the whole area is for.
- `b` 15% increased Grit Charge Duration (1.0 units)
- `c` 15% increased Grit Charge Duration (1.0 units)
- `n2` **notable Scar Tissue** 20% chance to gain a Grit Charge when you are Hit; Regenerate 0.2% of Life per second per 1 Grit Charge (3.5 units) — Charges from being hit, and regeneration per charge: the build that is hit a lot and shrugs. 2 + 1.5 units.

### Endurance (endurance)

Life and regeneration before the keystone that makes life the only pool: the approach says what the keystone will ask.

- `a` Regenerate 0.4% of Life per second (1.0 units)
- `b` Regenerate 0.4% of Life per second (1.0 units)
- `n` **notable Endurance** 10% increased maximum Life; Regenerate 0.8% of Life per second (4.0 units) — 2 + 2 units.
- `c` Regenerate 0.4% of Life per second (1.0 units)

### Blood Rite (bloodrite)

Two nodes of life and regeneration, then the trade: skills cost life, mana is 0, auras reserve life. The rim of the Wall.

- `a` Regenerate 0.4% of Life per second (1.0 units)
- `b` Regenerate 0.4% of Life per second (1.0 units)
- `k` **keystone Blood Rite** Skills cost life instead of mana. Maximum mana is 0. Auras reserve life.

Links:

- wall.slams.stagger.c ↔ drums.a: Stun leads to the warcries: the Stagger notable is on the way, which is the slam-and-shout build's road anyway.
- drums.b ↔ j1.a: Through the drums to the junction.
- j1.a ↔ unbroken.a: Junction to the grit wheel.
- unbroken.b ↔ endurance.a: The wheel's far side leads to endurance.
- endurance.c ↔ bloodrite.a: Endurance to the keystone spur.
- endurance.b ↔ j1.a: Endurance back to the junction: the grit wheel and its approach are a loop, and the keystone has two ways in.
