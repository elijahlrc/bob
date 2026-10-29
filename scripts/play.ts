/**
 * Play a run from a terminal, one command at a time (docs/ATTRITION.md: the playthrough agents). The run lives in a JSON
 * file; every command loads it, acts, prints what it did and the camp, and saves it. The maps play headless, as the bot's do.
 *
 *   npx tsx scripts/play.ts <file> help
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { Character } from '../src/calc/character';
import { bossAhead, BOSSES, bossForMap } from '../src/data/bosses';
import { blessingDef } from '../src/data/blessings';
import { flaskBase } from '../src/data/flasks';
import { gemDef } from '../src/data/gems';
import { affixText, mapAffixDef } from '../src/data/mapAffixes';
import { provisionDef } from '../src/data/provisions';
import { curseDef, REPRIEVES } from '../src/data/reprieves';
import { runRewardDef } from '../src/data/runRewards';
import { flaskRules, type UtilityFlaskUse } from '../src/data/strategy';
import { themeDef } from '../src/data/themes';
import { getTree } from '../src/data/tree';
import { EQUIP_SLOTS, type AnyItem, type EquipSlot, type Item } from '../src/data/types';
import { modText } from '../src/mods/text';
import { ModDB } from '../src/mods/modDb';
import { flaskSpec } from '../src/calc/flasks';
import { itemLines } from '../src/ui/ItemCard';
import { affixLabel } from '../src/run/affixText';
import {
  botAllocate,
  botArm,
  botCamp,
  botEquip,
  botFlasks,
  botRegem,
  sheetOf,
} from '../src/run/bot';
import { nextTier, salvage } from '../src/run/craft';
import { markSeen } from '../src/run/found';
import { equip, equipFlask, slotsFor, socketGem, unsocketGem } from '../src/run/inventory';
import { itemInfos, isUpgrade } from '../src/run/inventoryOps';
import { nextRespite, type MapOffer } from '../src/run/offers';
import { playOffer } from '../src/run/play';
import { armProvision, pouchLimit } from '../src/run/provisions';
import { standingEffects } from '../src/run/reprieves';
import {
  craftAtRespite,
  leaveRespite,
  respiteCraftCost,
  respiteItems,
  respiteVisit,
  restAtRespite,
  type RespiteCraft,
} from '../src/run/respite';
import { finishMap, newRun, passivePoints, takeReward, type RunState } from '../src/run/run';
import { setFlaskRule } from '../src/run/strategy';
import {
  hoardGems,
  hoardKinds,
  refillPrice,
  restockPrice,
  restockQuartermaster,
  saleStock,
  shrineBlessings,
  stopName,
  takeStop,
  type StopChoice,
} from '../src/run/stops';
import { pathTo, allocate } from '../src/run/tree';
import { waysideOf } from '../src/run/wayside';
import { stopDef } from '../src/data/stops';

const [, , file, cmd = 'status', ...args] = process.argv;
if (!file) {
  console.log('npx tsx scripts/play.ts <file> <command> [args]   (try "help")');
  process.exit(1);
}

const HELP = `Commands (the run is saved in ${file} after each):
  new <class> [seed]          start a run (vanguard, strider, mystic, reaver, zealot, shade)
  status                      the camp: map, vitals, flasks, pouch, effects, offers, a pending reward pick
  char                        the character sheet: pools, resistances, defences, damage
  gear | gems | bag           what is worn, the skill gems, the carried items (with uids)
  tree [all]                  passive points and the nodes you can reach next (all: notables within 6 steps)
  strategy                    the flask belt's settings
  look <offer>                what an offer holds (a map's affixes, a stop's choices, the Respite's crafts)
  go <offer>                  play the map offer (or rest, for a Respite offer)
  stop <offer> <json>         take a stop with a choice, e.g. stop 1 '{"stop":"shrine","blessing":"vigour"}'
                                gemHoard: {"stop":"gemHoard","tag":"fire","picks":["gemId",...]}
                                quartermaster: {"stop":"quartermaster","buy":["0","4"],"refill":true}
                                ferryman: {"stop":"ferryman","reprieve":"<id>"}
  restock <offer>             buy new wares at the Quartermaster (paid at once)
  craft <offer> <affix|tier|socket> <itemUid> [affixFamily]   craft at the Respite (first free, then Bone Dust)
  leave                       leave a Respite after crafting (the level passes, no refill)
  pick <n> | skip             take reward card n (from status), or none
  equip <uid> [slot]          wear an item (best slot if none given)
  flask <uid> <1-5>           put a flask in a belt slot
  socket <slot> <n> <gemUid>  put a carried gem in socket n (1-based) of the item in a slot
  unsocket <slot> <n>         take a gem out
  alloc <nodeId>              allocate a passive node (and the path to it)
  rule <1-5> <value>          a flask's setting: a life/mana threshold 0.1-0.9, or always|packs|rares|bosses
  arm <provisionId>           arm a provision for the next map
  salvage <uid> [uid...]      turn carried items into Bone Dust
  auto <gear|tree|flasks|all> let the bot do it (all: reward pick, arming, gear, gems, flasks, tree)`;

function load(): RunState {
  if (!existsSync(file)) throw new Error(`no run in ${file}: use "new <class>"`);
  return JSON.parse(readFileSync(file, 'utf8')) as RunState;
}
const save = (run: RunState) => writeFileSync(file, JSON.stringify(run));
const pct = (v: number) => `${Math.round(v * 100)}%`;

/** An item's lines as the game's item card shows them (uniques' mods and flat damage included). */
function lines(it: Item): string {
  return itemLines(it).join('; ');
}

/** Rounded the way a player reads it: whole charges, a drink to one decimal. */
const one = (v: number) => String(Math.round(v * 10) / 10);

function desc(it: AnyItem | { kind: 'pouch'; id: string }, db?: ModDB): string {
  if (it.kind === 'pouch')
    return `${provisionDef(it.id as never).name} (provision: ${provisionDef(it.id as never).text})`;
  if (it.kind === 'gem') {
    const g = gemDef(it.gemId);
    return `${g.name} (${g.kind} gem)`;
  }
  if (it.kind === 'flask') {
    const b = flaskBase(it.baseId);
    // With the flask's own affixes (Deep, Thrifty) and the character's flask mods, as it would be worn.
    const s = flaskSpec(it, db ?? new ModDB([]));
    const aff = it.affixes.flatMap((a) => a.mods.map((m) => modText(m))).join('; ');
    return `${it.name} (${b.kind} flask, needs level ${b.level}, ${s.maxCharges} charges, ${one(s.perUse)} a drink${aff ? '; ' + aff : ''})`;
  }
  if (it.kind === 'item')
    return `${it.name} [${it.rarity}] ilvl ${it.ilvl}: ${lines(it) || 'no affixes'}`;
  return `${it.count} × ${it.id}`;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

function flaskLine(run: RunState): string {
  const specs = new Character(run.build).flasks;
  const rules = flaskRules(
    run.build.flasks.map((f) => (f ? flaskBase(f.baseId).kind : null)),
    run.build.strategy,
  );
  return run.build.flasks
    .map((f, i) => {
      if (!f) return `${i + 1}: empty`;
      const s = specs.find((x) => x.uid === f.uid);
      const max = s?.maxCharges ?? flaskBase(f.baseId).maxCharges;
      const have = Math.round(max * (run.vitals.flasks[f.uid] ?? 1));
      const r = rules[i];
      const when = r.use
        ? r.use
        : r.life !== undefined
          ? `below ${pct(r.life)} life`
          : `below ${pct(r.mana!)} mana`;
      return `${i + 1}: ${f.name} ${have}/${max} (${s ? one(s.perUse) : '?'} a drink, ${when})`;
    })
    .join('\n       ');
}

function offerLine(o: MapOffer, i: number): string {
  if (o.kind === 'respite')
    return `${i}) Respite (level ${o.areaLevel}): rest and refill everything, or craft on an item`;
  if (o.kind === 'stop')
    return `${i}) Stop: ${stopName(o.stop!)} (level ${o.areaLevel}): ${stopDef(o.stop!).text}`;
  const aff = o.affixes.map((id) => affixText(mapAffixDef(id), o.areaLevel)).join('; ');
  const t = themeDef(o.themeId);
  return `${i}) Map level ${o.areaLevel}${o.offset ? ` (${o.offset > 0 ? '+' : ''}${o.offset})` : ''} · ${t.name}${o.type !== 'plain' ? ` · ${o.type}` : ''}${aff ? ` · ${aff}` : ''}`;
}

function status(run: RunState): void {
  if (run.phase === 'dead') {
    console.log(`DEAD on map ${run.map}. The run is over.`);
    return;
  }
  if (run.phase === 'victory') {
    console.log('VICTORY: map 100 cleared.');
    return;
  }
  const w = waysideOf(run);
  const v = run.vitals;
  console.log(
    `Map ${run.map} of 100 · ${run.classId} level ${run.build.level} · Bone Dust ${run.dust} · unspent passives ${passivePoints(run)}`,
  );
  console.log(`Vitals: life ${pct(v.life)} · mana ${pct(v.mana)} · energy shield ${pct(v.es)}`);
  console.log(`Flasks: ${flaskLine(run)}`);
  const pouch = Object.entries(w.pouch)
    .map(([id, n]) => `${provisionDef(id as never).name} [${id}] ×${n}`)
    .join(', ');
  console.log(
    `Pouch (${pouchLimit(run)} max): ${pouch || 'empty'}${w.armed.length ? ` · armed: ${w.armed.join(', ')}` : ''}`,
  );
  const eff = standingEffects(run);
  if (eff.length)
    console.log(
      `Effects: ${eff.map((e) => `${e.name} (${e.text}; ${e.left === null ? 'for the run' : `${plural(e.left, 'level')} left`})`).join(' · ')}`,
    );
  const boss = bossAhead(run.map);
  if (boss && boss.maps > 0)
    console.log(
      `Boss ahead: ${boss.boss.name} in ${plural(boss.maps, 'map')} (map ${boss.boss.map})`,
    );
  // As camp says it: the Respite on offer counts first.
  const nr = nextRespite(run.seed, run.map);
  if (run.offers.some((o) => o.kind === 'respite'))
    console.log(
      bossForMap(run.map + 1)
        ? `The last rest before ${BOSSES[bossForMap(run.map + 1)!].name}: a Respite is on offer.`
        : 'A Respite is on offer.',
    );
  else if (nr) console.log(`Next Respite in ${plural(nr - run.map, 'level')} (map ${nr})`);
  if (run.reward) {
    console.log('REWARD PICK waiting (pick <n> / skip):');
    run.reward.forEach((c, i) => console.log(`  ${i + 1}) ${desc(c as never)}`));
  }
  const visit = respiteVisit(run);
  if (visit)
    console.log(
      `At a Respite (offer ${visit.slot}): ${visit.crafts} crafts made; craft more or "leave".`,
    );
  console.log('Offers:');
  run.offers.forEach((o, i) => console.log('  ' + offerLine(o, i)));
}

function char(run: RunState): void {
  const s = sheetOf(run);
  // Resistances are kept by damage type: 1 lightning, 2 cold, 3 fire, 4 chaos (0 is physical).
  const res = (
    [
      ['fire', 3],
      ['cold', 2],
      ['lightning', 1],
      ['chaos', 4],
    ] as const
  )
    .map(([n, i]) => `${n} ${s.res[i]}/${s.maxRes[i]}`)
    .join(', ');
  console.log(
    `Level ${s.level} · life ${Math.round(s.life)} · energy shield ${Math.round(s.es)} · mana ${Math.round(s.mana)}`,
  );
  console.log(`Resistances: ${res}`);
  console.log(
    `Armour ${Math.round(s.armour)} · evasion ${Math.round(s.evasion)} · block ${pct(s.blockAttack)}/${pct(s.blockSpell)} · life regen ${s.lifeRegen.toFixed(1)}/s · effective HP ${Math.round(s.ehp)}`,
  );
  console.log(`Main skill: ${s.skill.name ?? '?'} · DPS ${Math.round(s.skill.totalDps)}`);
}

function gear(run: RunState): void {
  for (const slot of EQUIP_SLOTS) {
    const it = run.build.equipment[slot];
    if (!it) continue;
    const gems = it.sockets.map((g) => (g ? gemDef(g.gemId).name : '·')).join(', ');
    console.log(`${slot}: ${desc(it)}${it.sockets.length ? ` · sockets: [${gems}]` : ''}`);
  }
}

function gems(run: RunState): void {
  for (const slot of EQUIP_SLOTS) {
    const it = run.build.equipment[slot];
    if (!it?.sockets.length) continue;
    console.log(
      `${slot}: ${it.sockets.map((g, n) => `${n + 1}) ${g ? `${gemDef(g.gemId).name} [uid ${g.uid}]` : 'empty'}`).join(' · ')}`,
    );
  }
  const bag = run.inventory.filter((x) => x.kind === 'gem');
  console.log(`Carried gems: ${bag.map((g) => `${desc(g)} [uid ${g.uid}]`).join(' · ') || 'none'}`);
}

function bag(run: RunState): void {
  const infos = itemInfos(run);
  const db = new Character(run.build).db;
  for (const it of run.inventory) {
    if (it.kind === 'gem') continue;
    // An upgrade is judged for gear only (a flask has no slot of its own in that comparison).
    const info = it.kind === 'item' ? infos.get(it.uid) : undefined;
    const up =
      info && info.slot && isUpgrade(info)
        ? ` · UPGRADE for ${info.slot} (dps ${info.dpsPct.toFixed(0)}%, ehp ${info.ehpPct.toFixed(0)}%)`
        : info && !info.equippable && info.reason
          ? ` · can't wear: ${info.reason}`
          : '';
    console.log(`[uid ${it.uid}] ${desc(it, db)}${up}`);
  }
}

function tree(run: RunState, all: boolean): void {
  const t = getTree();
  const have = new Set(run.build.allocated);
  const start = t.starts[run.classId];
  console.log(`Unspent passive points: ${passivePoints(run)} · allocated ${have.size}`);
  const text = (id: number) => {
    const n = t.nodes[id];
    return `[${id}] ${n.kind} ${n.name}: ${n.mods.map((m) => modText(m)).join('; ')}`;
  };
  const frontier = new Set<number>();
  for (const id of [start, ...have])
    for (const m of t.nodes[id].links)
      if (!have.has(m) && t.nodes[m].kind !== 'start' && !t.nodes[m].retired) frontier.add(m);
  console.log('Reachable now:');
  for (const id of frontier) console.log('  ' + text(id));
  if (all) {
    console.log('Notables and keystones within 6 steps:');
    for (const n of t.nodes) {
      if ((n.kind !== 'notable' && n.kind !== 'keystone') || have.has(n.id) || n.retired) continue;
      const p = pathTo(run.build.allocated, run.classId, n.id);
      if (p && p.length <= 6) console.log(`  ${p.length} steps: ${text(n.id)}`);
    }
  }
}

function look(run: RunState, i: number): void {
  const o = run.offers[i];
  if (!o) return void console.log('No such offer');
  console.log(offerLine(o, i));
  if (o.kind === 'respite') {
    console.log(
      `Rest: "go ${i}". Craft: the next costs ${respiteCraftCost(run)} Bone Dust (you have ${run.dust}).`,
    );
    for (const k of ['affix', 'tier', 'socket'] as const) {
      const items = respiteItems(run, k);
      console.log(
        `  ${k}: ${items.map((it) => `${it.name} [uid ${it.uid}]`).join(', ') || 'nothing'}`,
      );
      if (k === 'tier')
        for (const it of items)
          console.log(
            `    ${it.name}: ${it.affixes
              .filter((a) => nextTier(it, a.family, run.map))
              .map((a) => `${affixLabel(a.family)} [family ${a.family}] (tier ${a.tier})`)
              .join(', ')}`,
          );
    }
    return;
  }
  if (o.kind !== 'stop') return;
  switch (o.stop) {
    case 'gemHoard':
      for (const k of hoardKinds(run, o))
        console.log(
          `  ${k.tag}: ${hoardGems(run, o, k.tag)
            .map((g) => `${gemDef(g).name} [${g}]`)
            .join(', ')}`,
        );
      break;
    case 'shrine':
      for (const b of shrineBlessings(run, o))
        console.log(`  ${b}: ${blessingDef(b).name}, ${blessingDef(b).text}`);
      break;
    case 'quartermaster':
      console.log(
        `  refill every flask: ${refillPrice(run)} Bone Dust · restock: ${restockPrice(run)} · you have ${run.dust}`,
      );
      for (const w of saleStock(run, o)) {
        const what = w.item
          ? desc(w.item)
          : w.kind === 'reward'
            ? `${runRewardDef(w.ref!).name}: ${runRewardDef(w.ref!).text}`
            : w.ref
              ? `${provisionDef(w.ref as never)?.name ?? w.ref}`
              : w.kind;
        console.log(`  ware "${w.id}" (${w.kind}, ${w.price} Bone Dust): ${what}`);
      }
      break;
    case 'ferryman':
      console.log(
        `  Price: ${curseDef('bargain').text} for five levels. Your flasks are refilled.`,
      );
      for (const r of REPRIEVES.filter((x) => x.from <= run.map))
        console.log(`  ${r.id}: ${r.name}, ${r.text}`);
      break;
    case 'awlsmith':
      console.log('  (the Awlsmith is no longer scheduled)');
  }
}

function play(run: RunState, i: number): void {
  const o = run.offers[i];
  if (!o) return void console.log('No such offer');
  if (o.kind === 'stop') return void console.log('That is a stop: use "look" and "stop".');
  if (o.kind === 'respite') {
    console.log(
      restAtRespite(run)
        ? 'Rested: everything refilled, the level passes.'
        : 'You crafted here: "leave" instead.',
    );
    return;
  }
  const before = run.map;
  const res = playOffer(run, o);
  finishMap(run, res);
  markSeen(run, 'all');
  const v = res.vitals;
  console.log(
    `Map ${before}: ${res.status.toUpperCase()} in ${res.time.toFixed(0)} s · ${res.kills} kills · +${Math.round(res.xpGained)} xp (level ${res.level}) · leaving with life ${pct(v.life)}, energy shield ${pct(v.es)}`,
  );
  if (res.reprieves?.length) console.log(`Reprieves fired: ${res.reprieves.join(', ')}`);
  const notable = res.picked.filter(
    (p) =>
      p.kind !== 'currency' && (p.kind !== 'item' || p.rarity === 'rare' || p.rarity === 'unique'),
  );
  console.log(
    `Picked up ${res.picked.length} things${
      notable.length
        ? `, among them: ${notable
            .map((p) => desc(p))
            .slice(0, 6)
            .join(' | ')}`
        : ''
    }`,
  );
  if (res.recap) {
    const r = res.recap;
    console.log(
      `Killed by ${r.killer} (${r.killerRarity}${r.killerMods.length ? ', ' + r.killerMods.join(', ') : ''}). Last 5 s: ${r.lines
        .slice(0, 4)
        .map((l) => `${l.name} ${Math.round(l.amount)}`)
        .join(
          ', ',
        )}. Resistances fire ${r.res.fire}, cold ${r.res.cold}, lightning ${r.res.lightning}, chaos ${r.res.chaos}.`,
    );
  }
}

function run(): void {
  if (cmd === 'help') return void console.log(HELP);
  if (cmd === 'new') {
    const r = newRun(args[0] ?? 'vanguard', Number(args[1] ?? Math.floor(Math.random() * 1e6)));
    save(r);
    status(r);
    return;
  }
  const r = load();
  const n = (k: number) => Number(args[k]);
  switch (cmd) {
    case 'status':
      break;
    case 'char':
      char(r);
      return save(r);
    case 'gear':
      gear(r);
      return;
    case 'gems':
      gems(r);
      return;
    case 'bag':
      bag(r);
      return;
    case 'tree':
      tree(r, args[0] === 'all');
      return;
    case 'strategy':
      console.log(`Flasks: ${flaskLine(r)}`);
      return;
    case 'look':
      look(r, n(0));
      return;
    case 'go':
      play(r, n(0));
      break;
    case 'stop': {
      const res = takeStop(r, n(0), JSON.parse(args[1] ?? '{}') as StopChoice);
      console.log(res.ok ? 'Done; the level passes.' : `Not possible: ${res.reason}`);
      break;
    }
    case 'restock': {
      const res = restockQuartermaster(r, n(0));
      console.log(res.ok ? 'Restocked.' : `Not possible: ${res.reason}`);
      look(r, n(0));
      break;
    }
    case 'craft': {
      const kind = args[1] as RespiteCraft['kind'];
      const craft = (
        kind === 'tier' ? { kind, itemUid: n(2), family: args[3] } : { kind, itemUid: n(2) }
      ) as RespiteCraft;
      const res = craftAtRespite(r, n(0), craft);
      console.log(res.ok ? 'Crafted.' : `Not possible: ${res.reason}`);
      if (res.ok) {
        const it = [...Object.values(r.build.equipment), ...r.inventory].find(
          (x): x is Item => x?.kind === 'item' && x.uid === craft.itemUid,
        );
        if (it) console.log(`Now: ${desc(it)}`);
      }
      break;
    }
    case 'leave':
      leaveRespite(r);
      break;
    case 'pick': {
      const card = r.reward?.[n(0) - 1];
      console.log(card && takeReward(r, card.uid) ? `Took ${desc(card as never)}` : 'No such card');
      break;
    }
    case 'skip':
      takeReward(r, null);
      break;
    case 'equip': {
      const it = r.inventory.find((x) => x.uid === n(0));
      if (it?.kind === 'flask') {
        console.log('That is a flask: use "flask <uid> <1-5>".');
        break;
      }
      if (!it || it.kind !== 'item') {
        console.log('No such carried item (a gem goes in with "socket")');
        break;
      }
      const info = itemInfos(r).get(it.uid);
      const slot = (args[1] as EquipSlot) ?? info?.slot ?? slotsFor(it)[0];
      if (!slot) {
        console.log(`Not possible: ${info?.reason ?? 'no slot takes it'}`);
        break;
      }
      const res = equip(r, it.uid, slot);
      console.log(
        res.ok ? `Equipped in ${slot}` : `Not possible: ${res.reason ?? info?.reason ?? ''}`,
      );
      break;
    }
    case 'flask': {
      const f = r.inventory.find((x) => x.uid === n(0));
      const need = f?.kind === 'flask' ? flaskBase(f.baseId).level : 0;
      const why =
        f?.kind !== 'flask'
          ? 'no such carried flask'
          : !(n(1) >= 1 && n(1) <= 5)
            ? 'the belt has slots 1 to 5'
            : need > r.build.level
              ? `it needs character level ${need}`
              : null;
      if (why) console.log(`Not possible: ${why}`);
      else console.log(equipFlask(r, n(0), n(1) - 1) ? 'Done' : 'Not possible');
      break;
    }
    case 'socket': {
      const ok = socketGem(r, args[0] as EquipSlot, n(1) - 1, n(2));
      console.log(
        ok
          ? 'Done'
          : 'Not possible: check the slot name (see "gear"), the socket number (1-based, empty or not) and that the gem is carried (see "gems")',
      );
      break;
    }
    case 'unsocket':
      unsocketGem(r, args[0] as EquipSlot, n(1) - 1);
      break;
    case 'alloc': {
      const path = allocate(r, n(0));
      console.log(
        path.length ? `Allocated ${path.join(', ')}` : 'Not possible (no points, or not reachable)',
      );
      break;
    }
    case 'rule': {
      const v = args[1];
      const slot = n(0) - 1;
      if (['always', 'packs', 'rares', 'bosses'].includes(v))
        setFlaskRule(r, slot, { use: v as UtilityFlaskUse });
      else setFlaskRule(r, slot, { at: Number(v) });
      console.log(`Flasks: ${flaskLine(r)}`);
      return save(r);
    }
    case 'arm': {
      const res = armProvision(r, args[0] as never);
      console.log(res.ok ? 'Armed.' : `Not possible: ${res.reason}`);
      break;
    }
    case 'salvage':
      for (const a of args) {
        const res = salvage(r, Number(a));
        console.log(res.ok ? `Salvaged ${a}` : `${a}: ${res.reason}`);
      }
      console.log(`Bone Dust: ${r.dust}`);
      return save(r);
    case 'auto':
      if (args[0] === 'gear') {
        botEquip(r);
        botRegem(r);
      } else if (args[0] === 'tree') botAllocate(r);
      else if (args[0] === 'flasks') botFlasks(r);
      else if (args[0] === 'all') {
        botCamp(r, 'none', true);
        botArm(r);
      }
      console.log(`auto ${args[0]} done`);
      break;
    default:
      console.log(HELP);
      return;
  }
  save(r);
  status(r);
}

run();
