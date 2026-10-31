# The rework's skeleton (draft 2, 2026-10-30)

**Approved by the owner on 2026-10-30** after five revisions on the sketch: the roads between starts bow just past
the starts to seams on the borders; border radials run from the centre through each seam to the mid ring; a node on
every corner; two nodes from a start to its hub; spokes and rings thinned (about 380 road nodes). Next: the Knife.

The attrition rework (CONSTRAINTS.md §16) redraws the layout: the starts and the region skeletons first, then each
region refilled. This is the skeleton in words, region by region, for the owner's review with its sketch
(`R-skeleton.json`, drawn by `scripts/passives/sketch.ts`). Nothing in the network changes until it is approved.

Read with CONSTRAINTS.md (the one list) and PHILOSOPHY.md. Positions are polar: radius from the tree's centre in tree
units (today's tree reaches 4,725), angle in degrees as the data has it (the Spire at -90 is the top).

## 1. The frame every region shares

- **Starts at radius 1,450** (today 1,000), on their old angles. Neighbouring starts are then about 13 steps apart
  through the roads between them (the reference: 12). A start sits on the inner edge of its region's wedge, as in the
  reference: most of the region lies outward of it, and the ground inward of it is the centre's.
- **Two exits, each forking at step 2.** Each exit is one small (the two sides of the start: one leans offence, one
  defence, as today), then a hub of the class attribute at step 2. Each hub forks: a road along the region's inner edge
  toward the neighbour on that side, and a spoke outward into the region. The first steps then run 2, 4, 6 nodes, as
  in the reference, and each exit holds about half of what lies near the start.
- **No notable within 4 steps.** The first ring is the start's smalls, the two hubs and the first nodes of the four
  roads: general stats only. The home's notables move out to steps 5 to 8, off the spokes and off a cross-link that
  joins the two spokes (the home hub). Weapons and elements come after that (step 8 or more), keystones at 8 or more.
- **Side rooms.** Most clusters past the home are side rooms: a short stub off a road junction into a cluster that ends
  there, entered and left the same way. The roads keep the loops: two spokes per region, a cross-link between them, the
  mid ring and the rim ring.
- **Two ring roads cross every region**, the reference's polygon rings: the **mid ring** at radius about 2,900 and the
  **rim ring** at about 4,300. Where a ring meets a spoke is a junction with side rooms round it (a reference "star").
  Where a ring crosses a border is a crossing, with a seam cluster.
- **The roads between neighbouring starts bow outward** (the owner, 2026-10-30, after the reference): from each hub
  out into the ground just beyond the start, then back in to a seam cluster on the border at radius about 1,600, which
  each pair of neighbours shares (the near crossing). About five steps from a start to its seam, so about 12 between
  neighbouring starts. (A wider bow, out to 2,150, was tried and dropped.)
- **Border radials** (the owner's idea, 2026-10-30): a road runs from the centre out along each border, through the
  seam and on to the mid ring, so the ground between two regions beyond the starts is covered. Roads may take large
  jumps between nodes; these are thin.
- **The centre** (inside radius about 1,200) keeps today's eight generic notables and gains the six inner roads. It is
  the reference's middle: generic ground between all the starts, a few steps from each.
- **Roads are highways:** attribute nodes, few and far apart on the long straight runs (1 to 3 nodes between
  junctions), so roads stay near a fifth of the nodes. A script may lay the first pass of the roads and straighten
  them (CONSTRAINTS.md §14); what goes where is decided below.

## 2. The Knife (Shade, dexterity and intelligence, angle -30)

Neighbours: the Spire on the north side (-60), the Bow on the south side (0). The rework's first region.

- **Start sides:** north 10% energy shield (defence), south 15% crit chance (offence). Hubs +15/+15.
- **North exit, the caster's half.**
  - Inner road to the Spire seam: **chaos spells and curses** shared with the Spire (Hexwright's ground).
  - North spoke: **The Stair** (chaos spells, lightning, mines, life and evasion, Spellslip) as side rooms between the
    home and the mid ring; **The Rookery** (poison, energy shield, Second Curse, Shade Leech, Cruel Agony) at the mid
    ring junction; **the Rooftops' dagger-spell half** (Athame, Ritual Blade, Ill Wish, Salt in the Wound, Whetted Will)
    out toward the rim.
- **South exit, the attacker's half.**
  - Inner road to the Bow seam: **traps and evasion** shared with the Bow.
  - South spoke: **The Alleys** (claws, daggers, resistances, life, Nimble Gambit at a tip, 10 or more steps out);
    **The Docks** (traps, minions, dodge, dagger and claw crit, cold attacks) as side rooms off the mid ring; **the
    Rooftops' attack half** (Long Knives, Between Ribs, Carrion Claws) and **The Seawall** (insight, dual wielding,
    poison attacks) at the rim.
- **Home (steps 5 to 8, on the cross-link):** Keen Instinct, Spoils, Soft Step, Quick Wrists, Thick Blood, Snakeskin:
  crit, evasion, energy shield, flasks and mana, attack speed, life, resistances. No weapon.
- **The Shade's start (the TODO):** Talon and Raking Hand (claws) go to the south spoke past step 9, one with life on
  hit, one with attack speed, apart; Fine Point (daggers) past step 9 with dual wielding; Quiet Knife (dagger spells)
  to the north spoke past step 9. Nothing within 8 steps names a weapon.
- **Keystones:** Nimble Gambit (south, 10+), Shade Leech and Cruel Agony (north, mid ring, about 13), Spellslip (north,
  about 14). Hollow Vessel is removed.

## 3. The Spire (Mystic, intelligence, angle -90)

Neighbours: the Cathedral on the west (-120), the Knife on the east (-60).

- **Start sides:** west 11 maximum energy shield (defence), east 20% mana regeneration (offence for a caster). Hubs +20.
- **West exit, defence and mana.**
  - Inner road to the Cathedral seam: **auras and energy shield recharge** shared with the Cathedral (Vigil's ground).
  - West spoke: **The Cloister** (mana, energy shield, Mind Bulwark, Draught, Quiet Pulse, Living Verse, wand spells)
    between the home and the mid ring; **The Lantern** (fire, minions, cold, wand attacks with elements) at the rim.
- **East exit, spell offence.**
  - Inner road to the Knife seam: **chaos spells and curses** (the Knife's north road meets it).
  - East spoke: **The Scriptorium** (spell damage, insight, wand attacks, cost and reservation, Mana Bastion) between
    the home and the mid ring; **The Gallery** (lightning and fire penetration, Pain Conduit) and **The Eaves** (wand
    crit, minions with curses, spell damage and mana) toward the rim.
- **The axis:** **The Column** (spell area and projectiles, damage over time) at the mid ring between the spokes;
  **The Belfry** (cold, lightning, ailments, channelling, energy shield recharge, Prismatic Balance, Fever Pitch) at
  the rim.
- **Home:** First Light, Still Mind, Sharp Mind, Warm Blood (spell damage, mana, spell crit, life and energy shield).
  Deft Wand (wand attacks) moves out to the east spoke past step 8.
- **Keystones:** Mind Bulwark (west, mid ring), Mana Bastion (east, mid ring), Pain Conduit (Gallery), Prismatic
  Balance and Fever Pitch (rim, the farthest).

## 4. The Bow (Strider, dexterity, angle 30)

Neighbours: the Knife on the north (0), the Yard on the south (60). Today the most cluttered start (seven niche
clusters within 8 steps).

- **Start sides:** north 5% attack speed (offence), south 10% evasion (defence). Hubs +20.
- **North exit, ranged.**
  - Inner road to the Knife seam: **traps and evasion** (the Knife's south road meets it), Hedge Magic's spell-dexterity
    ground.
  - North spoke: **The Hedgerows** (bows, elemental fletching, swords, Steady Draw at a tip past step 8) between the home
    and the mid ring; **The Far Pasture** (bow crit, traps and mines, evasion) at the rim.
- **South exit, close and physical.**
  - Inner road to the Yard seam: **one-handed and dual wielding** (Light Hand; the Yard's Lists meet it).
  - South spoke: **The Ford** (physical attacks, leech, totems, axes, fire attacks, Plated Hide) between the home and
    the mid ring; **The Water Meadows** (poison bows, lightning attacks, Field Kit, Killing Eye) at the rim.
- **The axis:** **The Meadow** (evasion, attack and cast speed, movement, Arrow Weave) off the cross-link; **The High
  Moor** (projectiles, chain, bleed, Close Quarters) and **The Thicket** (Split Volley, pierce, bow speed, Quick Sip) at
  the mid ring.
- **Home:** Hawk's Eye, Vital Aim, Long Breath, Clear Head, Wayfarer, Hard Target (attacks, crit, life and
  regeneration, mana, evasion, resistances). Twin Fangs, Longbow, Fleet Blade, Tripwire, Fine Point, Raking Hand and
  Round Shield all leave the first 8 steps.
- **Keystones:** Steady Draw (north, past 8; today 7), Arrow Weave, Close Quarters (mid ring), Plated Hide (south).

## 5. The Yard (Reaver, strength and dexterity, angle 90)

Neighbours: the Bow on the east (60), the Wall on the west (120). Today lopsided: one exit holds 18 of its near
notables, the other 4.

- **Start sides:** east 5% attack speed, west 10% melee physical damage (both offence today; the west side becomes 12%
  armour so one side defends). Hubs +15/+15.
- **East exit, speed and blood.**
  - Inner road to the Bow seam: **dual wielding and evasion** (The Lists' edge, Iron Draw for the physical bow).
  - East spoke: **The Lists** (dual wielding, evasion, fervour, swords) between the home and the mid ring; **the Pits'
    east half** (leech, bleed, poison and bleed, Wound Dance) at the mid ring.
- **West exit, weapons and shields.**
  - Inner road to the Wall seam: **shields, block and stun** (The Muster's edge).
  - West spoke: **The Practice Ground** (swords, axes, one-handed, elemental attacks, armour and evasion) between the
    home and the mid ring; **The Muster** (shields, stun threshold, maximum resistances, Shieldwall) and **the Pits'
    west half** (two-handed, Spellsword, Crimson Pact) at the mid ring.
- **The rim:** **The Fosse** (lightning attacks, curses, channelling, sword leech).
- **Home:** Quickened Steel, Stout Heart, Fighting Breath, Field Dressing, Killing Pace (attack speed, physical, life
  and regeneration, mana on hit, flasks, on kill). Buckler (shields) and Drill Call (warcries) move past step 8.
- **Keystones:** Wound Dance and Crimson Pact (the Pits), Shieldwall (the Muster), all past step 10.

## 6. The Wall (Vanguard, strength, angle 150)

Neighbours: the Yard on the south-east (120), the Cathedral on the north (180). Today lopsided: one exit holds 25 of
its near notables, the other 11.

- **Start sides:** north 12% armour (defence), south 10% melee physical damage (offence). Hubs +20.
- **North exit, armour and the elements.**
  - Inner road to the Cathedral seam: **resistances, auras and totems** (The Battlements, Hallowed Hammer's mace and
    sceptre).
  - North spoke: **The Rampart** (armour, accuracy, stun, mana on hit, Unerring Discipline) between the home and the
    mid ring; **The Barbican** (maces, stun, two-handed, armour, curses, Rooted Stance) at the mid ring and out.
- **South exit, slams and the barrows.**
  - Inner road to the Yard seam: **slams, shields and block** (The Quarry's edge, Bracing).
  - South spoke: **The Quarry** (two-handed, area, totems, leech, regeneration, Strongarm) between the home and the mid
    ring; **The Barrows** (44 smalls today: grit, warcries, two-handed, axes, maces, minions, Blood Rite) split along the
    mid ring and the rim.
- **Home:** Oathbound, Quartermaster, Ringing Blows, Elemental Ward (life, physical, flasks, melee, resistances).
  Shield Ram (shields) moves past step 8.
- **Keystones:** Unerring Discipline (north, past 10), Strongarm (south, past 10), Rooted Stance and Blood Rite (far).

## 7. The Cathedral (Zealot, strength and intelligence, angle -150)

Neighbours: the Wall on the south-west (180), the Spire on the north-east (-120). Today it commits to an element at
step 4 (Hymn's lightning) and offers fire at 7.

- **Start sides:** north-east 10% elemental damage (offence), south-west 12% armour (defence). Hubs +15/+15.
- **North-east exit, spells and servants.**
  - Inner road to the Spire seam: **auras and energy shield recharge** (the Spire's west road meets it; Choirmaster).
  - North-east spoke: **The Choir** (auras, minions, Lone Vow) between the home and the mid ring; **The Undercroft**
    (spell damage, brands, totems, chaos and physical spells, spell block, Volatile Servants, Sigil Warden) at the mid
    ring; **The Lychway** (channelling, spell block, durations) at the rim.
- **South-west exit, the faithful at arms.**
  - Inner road to the Wall seam: **staves, sceptres and block** (The Vestry's edge, Twofold Guard).
  - South-west spoke: **The Nave** (shield block, armour, fire, energy shield recharge, minions, Lectern) between the home
    and the mid ring; **The Vestry** (sceptres, staves, cold, Idle Hands), **The Bell Tower** (cold attacks, auras,
    Searing Avatar) and **The Ambulatory** (fire and lightning, brands, warcries, minions, leech) at the mid ring;
    **The Churchyard** (sceptre fire, auras, spell block) at the rim.
- **Home:** Zeal, Ardour, Litany, Vigil (elemental damage, elemental attacks, resistances, regeneration and recharge).
  Hymn (lightning) and Hearthfire (fire) move past step 8, on different spokes; Iron Faith (shields) and Shepherd
  (minions) too.
- **Keystones:** Lone Vow (the Choir, past 10), Idle Hands, Searing Avatar, Volatile Servants, Sigil Warden (mid ring
  and out). Living Ward is removed.

## 8. The centre

Today's eight generic notables (Shelter, Quick March, Well Rounded, Provisions, Firm Footing, Hard Living, Sound Body,
Waste Not) sit on the six inner roads where they meet, a few steps from every start, as side rooms. Generic stats only:
resistances, movement, attributes, flasks, stun, life on hit and kill, chaos resistance and ailments, mana cost.

## 9. Open for the owner

- Whether the start sides stay as listed (the Yard's west side changes from physical damage to armour).
- Whether the centre should hold more than today's eight (it gains room).
- The seam themes between neighbours (section 1, the inner roads): each is a first guess.
