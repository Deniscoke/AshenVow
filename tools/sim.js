#!/usr/bin/env node
// Headless gameplay simulator — runs the real engine logic without a browser.
//   node tools/sim.js enemy <kind> [--verbose]   fight one creature in a test arena, report behaviour
//   node tools/sim.js boss <bossId> [--verbose]  fight a boss to the death, report phases / flags / aftermath
//   node tools/sim.js maps                        load every map, run 6 s, interact with every NPC/sign/corpse
//   node tools/sim.js dialogue [id] [--runs N]    fuzz dialogues: random choices under random flag states
//   node tools/sim.js all                         everything above (exit 1 on any failure)
'use strict';
const { loadGame } = require('./lib');

const argv = process.argv.slice(2);
const mode = argv[0] || 'all';
const target = argv[1] && !argv[1].startsWith('--') ? argv[1] : null;
const verbose = argv.includes('--verbose');
const runsArg = argv.indexOf('--runs');
const RUNS = runsArg >= 0 ? +argv[runsArg + 1] : 12;

const loaded = loadGame({ headless: true });
const { AV } = loaded;
for (const e of loaded.errors) console.error('LOAD ERROR ' + e.file + '\n' + e.message);
if (!AV || !AV.World) { console.error('engine failed to load'); process.exit(1); }

const S = AV.state, G = AV.game, I = AV.input;
const DT = 1 / 60;
const failures = [];
const fail = (m) => { failures.push(m); console.log('FAIL  ' + m); };
const ok = (m) => console.log('ok    ' + m);

// scripted input: tests can hold "virtual buttons"
const virt = new Set();
I.pressed = (a) => virt.has(a);
I.down = (a) => virt.has(a);
I.axis = () => ({ x: 0, y: 0 });
I.menuDir = () => null;
I.update = () => {};

function arenaMap() {
  const rows = [];
  const w = 34, h = 22;
  for (let y = 0; y < h; y++) {
    let r = '';
    for (let x = 0; x < w; x++) r += x === 0 || y === 0 || x === w - 1 || y === h - 1 ? '#' : '.';
    rows.push(r);
  }
  return { name: 'Test Arena', region: 'village', theme: 'interior', music: null, weather: 'none', ambient: 0.5,
    tiles: rows, spawns: { start: [17, 11, 'down'] }, entities: [] };
}

function freshWorld(mapId, extraEntities) {
  S.reset();
  S.set('intro_done', 1);
  G.killed = {};
  G.scene = 'play';
  AV.dlg.active = null;
  AV.script.clear();
  AV.combat.clear();
  AV.ui.menu = null;
  G.deathScreen = null; G.transitioning = false; G.hitstop = 0; G.slowmo = null;
  if (mapId === '__arena') AV.data.maps.__arena = Object.assign(arenaMap(), { entities: extraEntities || [] });
  const world = new AV.World(mapId);
  G.world = world;
  const P = new AV.Player(world);
  const sp = Object.values(AV.data.maps[mapId].spawns)[0];
  P.placeAt(sp[0] * 16 + 8, sp[1] * 16 + 14, 'down');
  G.player = P;
  world.add(P);
  return { world, P };
}

function step(world, n = 1) {
  for (let i = 0; i < n; i++) {
    G.time += DT;
    for (let k = G.timers.length - 1; k >= 0; k--) { const t = G.timers[k]; t.t -= DT; if (t.t <= 0) { G.timers.splice(k, 1); t.fn(); } }
    for (let k = G.tasks.length - 1; k >= 0; k--) { const t = G.tasks[k]; if (t.tick(DT)) { G.tasks.splice(k, 1); t.done && t.done(); } }
    AV.script.update(DT);
    if (AV.dlg.active) { autoDialogue(); AV.dlg.update(DT); continue; }
    if (G.hitstop > 0) { G.hitstop -= DT; continue; }
    world.update(DT);
    AV.combat.update(DT, world);
    AV.fx.update(DT, G.cam);
  }
}

// Drive the active dialogue forward: finish typing, pick choices (random or first)
let choicePolicy = 'random';
function autoDialogue() {
  const s = AV.dlg.active;
  if (!s) return;
  virt.delete('confirm');
  if (s.task && !s.task.done) return;
  if (s.choices) {
    const open = s.choices.map((c, i) => (c.locked ? -1 : i)).filter((i) => i >= 0);
    if (!open.length) { fail(`dialogue ${s.id}.${s.nodeId}: every choice is locked (soft-lock)`); AV.dlg.finish(s); return; }
    s.cursor = choicePolicy === 'first' ? open[0] : open[Math.floor(Math.random() * open.length)];
    s.choiceT = 1;
    virt.add('confirm');
    return;
  }
  s.shown = s.total; s.openT = 1; s.pauseT = 0;
  virt.add('confirm');
}

// ---------------------------------------------------------------- enemy test
function testEnemy(kind) {
  const errs = [];
  const { world, P } = freshWorld('__arena', [{ type: 'enemy', kind, x: 22, y: 11, id: 'e1' }]);
  const e = world.entities.find((x) => x.team === 'enemy');
  if (!e) return fail(`enemy ${kind}: did not spawn`);
  if (!AV.data.enemies[kind]) fail(`enemy ${kind}: not defined in AV.data.enemies`);
  let hpBefore = S.d.hp, playerHits = 0, enemyAttacks = 0;
  const states = new Set();
  const origAdd = AV.combat.add;
  AV.combat.add = function (h) { if (h.team === 'enemy') enemyAttacks++; return origAdd.call(this, h); };
  const origShoot = AV.combat.shoot;
  AV.combat.shoot = function (w, o) { if ((o.team || 'enemy') === 'enemy') enemyAttacks++; return origShoot.call(this, w, o); };
  const origHit = P.takeHit.bind(P);
  P.takeHit = (h) => { const r = origHit(h); if (r) { playerHits++; S.d.hp = S.maxHp(); P.state = 'idle'; } return r; };
  let died = false, t = 0, killT = null;
  try {
    // phase A: the player stands still near the creature
    for (let i = 0; i < 60 * 8; i++) {
      step(world); t += DT; states.add(e.state);
      if (P.state === 'dead') { P.state = 'idle'; S.d.hp = S.maxHp(); }
    }
    // phase B: the player attacks relentlessly
    for (let i = 0; i < 60 * 25 && !e.dead; i++) {
      if (i % 24 === 0) {
        const a = Math.atan2(e.y - P.y, e.x - P.x);
        const d = Math.hypot(e.x - P.x, e.y - P.y);
        if (d > 22) { P.x = e.x - Math.cos(a) * 18; P.y = e.y - Math.sin(a) * 18; }
        P.aim = a; P.state = 'idle'; P.sta = S.maxSta(); P.iframes = 0;
        if (e.passive) P.startAttack(); else P.startAttack();
      }
      step(world); t += DT; states.add(e.state);
      if (P.state === 'dead') { P.state = 'idle'; S.d.hp = S.maxHp(); }
    }
    died = e.dead;
    if (died) killT = t - 8;
    for (let i = 0; i < 120; i++) step(world);
  } catch (err) {
    errs.push(err.stack.split('\n').slice(0, 3).join(' | '));
  } finally {
    AV.combat.add = origAdd; AV.combat.shoot = origShoot;
  }
  const passive = AV.data.enemies[kind] && AV.data.enemies[kind].passive;
  const report = { kind, died, killTime: killT && +killT.toFixed(1), playerHits, enemyAttacks, states: [...states].join(','), maxHp: e.maxHp };
  if (errs.length) fail(`enemy ${kind}: exception ${errs[0]}`);
  else if (!died) fail(`enemy ${kind}: could not be killed in 25 s (${JSON.stringify(report)})`);
  else if (!passive && enemyAttacks === 0) fail(`enemy ${kind}: never attacked (${JSON.stringify(report)})`);
  else if (!passive && playerHits === 0) fail(`enemy ${kind}: attacked ${enemyAttacks}x but never hit a stationary player in 8 s`);
  else ok(`enemy ${kind}: ${JSON.stringify(report)}`);
}

// ---------------------------------------------------------------- boss test
function testBoss(id) {
  const bdef = AV.data.bosses[id];
  if (!bdef) return fail(`boss ${id}: not defined`);
  const { world, P } = freshWorld('__arena', [{ type: 'boss', boss: id, x: 17, y: 7, arena: { x: 1, y: 1, w: 32, h: 20 }, startOn: 'manual', onDefeat: ['set:__boss_after'] }]);
  const errs = [];
  let hits = 0, phases = new Set(), states = new Set();
  const origHit = P.takeHit.bind(P);
  P.takeHit = (h) => { const r = origHit(h); if (r) { hits++; S.d.hp = S.maxHp(); if (P.state === 'dead') P.state = 'idle'; } return r; };
  let t = 0, b = null;
  try {
    AV.bosses.startById(id);
    b = AV.bosses.active;
    if (!b) throw new Error('boss did not start');
    for (let i = 0; i < 60 * 150 && !(b.finished); i++) {
      if (!b.dead && i > 60 * 6 && i % 22 === 0) {
        const a = Math.atan2(b.y - P.y, b.x - P.x);
        const d = Math.hypot(b.x - P.x, b.y - P.y);
        const want = Math.max(18, b.hurtW / 2 + 12);
        if (d > want + 6) { P.x = b.x - Math.cos(a) * want; P.y = b.y - Math.sin(a) * want; }
        P.aim = a; P.state = 'idle'; P.sta = S.maxSta(); P.iframes = 0;
        P.startAttack();
      }
      step(world); t += DT;
      phases.add(b.phase); states.add(b.state);
      if (P.state === 'dead') { P.state = 'idle'; P.dead = false; S.d.hp = S.maxHp(); }
    }
    for (let i = 0; i < 60 * 3; i++) step(world);
  } catch (err) { errs.push(err.stack.split('\n').slice(0, 4).join(' | ')); }
  const r = { id, time: +t.toFixed(1), playerHits: hits, phases: [...phases].join(','), states: [...states].join(','), flag: S.get(id), after: S.get('__boss_after') };
  if (errs.length) fail(`boss ${id}: exception ${errs[0]}`);
  else if (!b || !b.finished) fail(`boss ${id}: not defeated within 150 s of attacks (${JSON.stringify(r)})`);
  else if (!S.get(id)) fail(`boss ${id}: flag not set on death`);
  else if (!S.get('__boss_after')) fail(`boss ${id}: onDefeat actions did not run`);
  else if (hits === 0) fail(`boss ${id}: never damaged the player (${JSON.stringify(r)})`);
  else ok(`boss ${id}: ${JSON.stringify(r)}`);
}

// ---------------------------------------------------------------- map test
function testMaps() {
  for (const mid of Object.keys(AV.data.maps)) {
    if (mid === '__arena') continue;
    let world, P;
    try {
      ({ world, P } = freshWorld(mid));
      S.set('cinder_unlocked', 1);
      step(world, 60 * 4);
      const kinds = {};
      for (const e of world.entities) kinds[e.constructor.name] = (kinds[e.constructor.name] || 0) + 1;
      // interact with everything interactable
      const targets = world.entities.filter((e) => e !== P && e.interactable && e.interactable() && !(e.team === 'enemy'));
      let talked = 0;
      for (const e of targets) {
        if (e.gone) continue;
        const guard = 60 * 60;
        e.interact(P);
        let n = 0;
        while ((AV.dlg.active || AV.script.blocking || AV.ui.menu) && n < guard) {
          if (AV.ui.menu) { AV.ui.closeAll(); }
          step(world); n++;
        }
        if (n >= guard) fail(`map ${mid}: interaction with ${e.constructor.name} ${e.npcId || e.def && e.def.id || ''} never finished`);
        talked++;
        if (G.scene !== 'play' || G.world !== world) break; // ending or teleport
      }
      ok(`map ${mid}: ${Object.entries(kinds).map(([k, v]) => k + ':' + v).join(' ')} | interacted ${talked}`);
    } catch (err) {
      fail(`map ${mid}: ${err.stack.split('\n').slice(0, 3).join(' | ')}`);
    }
  }
}

// ---------------------------------------------------------------- dialogue fuzzing
function testDialogue(only) {
  const ids = Object.keys(AV.data.dialogue).filter((id) => !only || id === only);
  const flagsPool = new Set();
  for (const id of Object.keys(AV.data.dialogue)) {
    const d = AV.data.dialogue[id];
    for (const n of Object.values(d.nodes || {})) {
      for (const c of (n.choices || [])) collect(c.if), collect(c.lock);
      for (const b of (n.branch || [])) collect(b.if);
    }
  }
  function collect(cond) { if (!cond || typeof cond !== 'string') return; try { for (const r of AV.logic.compile(cond).refs) if (!r.startsWith('has:')) flagsPool.add(r); } catch (e) { /* reported by check */ } }
  const items = Object.keys(AV.data.items);
  const endingsReached = new Set();
  const origEnding = G.startEnding;
  G.startEnding = (id) => { endingsReached.add(id); AV.dlg.active = null; AV.script.clear(); };
  let total = 0;
  for (const id of ids) {
    for (let r = 0; r < RUNS; r++) {
      const { world } = freshWorld(Object.keys(AV.data.maps).find((m) => m !== '__arena') || '__arena');
      // random world state
      for (const f of flagsPool) if (Math.random() < 0.35) S.set(f, Math.random() < 0.8 ? 1 : Math.floor(Math.random() * 30));
      S.d.hollow = Math.floor(Math.random() * 26);
      S.d.deaths = Math.floor(Math.random() * 12);
      for (const it of items) if (Math.random() < 0.3) S.d.items[it] = 1;
      try {
        AV.dlg.start(id, {});
        let n = 0;
        while ((AV.dlg.active || AV.script.blocking) && n < 60 * 120) { step(world); n++; if (AV.ui.menu) AV.ui.closeAll(); }
        if (n >= 60 * 120) fail(`dialogue ${id}: did not finish (stuck) on run ${r}`);
        total++;
      } catch (err) {
        fail(`dialogue ${id}: ${err.stack.split('\n').slice(0, 3).join(' | ')}`);
        break;
      }
    }
  }
  G.startEnding = origEnding;
  ok(`dialogue fuzz: ${total} runs over ${ids.length} dialogues; endings triggered: ${[...endingsReached].join(', ') || 'none'}`);
}

// ---------------------------------------------------------------- story walkthrough
// Plays the spine of the game headlessly: every contract dialogue runs, every boss is started by its map and killed,
// chapters advance, and each ending is reachable from the final choice.
function testStory() {
  const need = (cond, msg) => { if (!cond) fail('story: ' + msg); return !!cond; };
  choicePolicy = 'first';
  const run = (id, ctx) => {
    if (!AV.data.dialogue[id]) return need(false, `dialogue ${id} missing`);
    AV.dlg.start(id, ctx || {});
    let n = 0;
    while ((AV.dlg.active || AV.script.blocking) && n < 60 * 90) { step(G.world); n++; if (AV.ui.menu) AV.ui.closeAll(); }
    return need(n < 60 * 90, `dialogue ${id} did not finish`);
  };
  const go = (mapId) => {
    const w = new AV.World(mapId);
    G.world = w; G.player.world = w; w.add(G.player);
    const sp = Object.values(AV.data.maps[mapId].spawns)[0];
    G.player.placeAt(sp[0] * 16 + 8, sp[1] * 16 + 14, 'down');
    return w;
  };
  const killBoss = (mapId, bossId) => {
    const w = go(mapId);
    const marker = w.entities.find((e) => e instanceof AV.ents.BossMarker && e.bossId === bossId);
    if (!need(marker, `${mapId} has no ${bossId} marker`)) return;
    if (!AV.data.bosses[bossId]) { need(false, `${bossId} not defined`); S.set(bossId, 1); return; }
    marker.start();
    const b = AV.bosses.active;
    if (!need(b, `${bossId} did not start`)) return;
    step(w, 60 * 3);
    b.hp = 0; b.die({});
    let n = 0;
    while (!b.finished && n < 60 * 20) { step(w); n++; }
    // onDefeat usually opens an aftermath dialogue after ~1 s
    step(w, 90);
    n = 0;
    while ((AV.dlg.active || AV.script.blocking) && n < 60 * 90) { step(w); n++; if (AV.ui.menu) AV.ui.closeAll(); }
    need(S.get(bossId), `${bossId} flag not set`);
  };
  try {
    freshWorld('crypt');
    S.unset('intro_done');
    run('intro');
    need(S.get('intro_done'), 'intro did not set intro_done');
    need(S.get('chapter') === 1, 'intro did not start chapter 1');
    killBoss('chapel', 'boss_procession');
    need(S.get('cinder_unlocked'), 'procession aftermath did not unlock the Cinder');
    go('chandlery');
    const lin = G.world.findNpc('linnet');
    if (need(lin, 'linnet missing from chandlery')) { AV.dlg.startNpc(lin); let n = 0; while ((AV.dlg.active || AV.script.blocking) && n < 5400) { step(G.world); n++; } }
    need(S.has('gate_key'), 'Linnet did not give the gate key');
    need(S.get('chapter') === 2, 'chapter 2 not reached after the Procession');
    killBoss('hart_barrow', 'boss_hart'); need(S.has('hart_stone'), 'no hart_stone after the Hart');
    killBoss('abbey_belfry', 'boss_hollin'); need(S.has('bell_stone'), 'no bell_stone after Hollin');
    // Odo talks first
    const w = go('ossuary_heart');
    const odo = w.findNpc('odo');
    if (need(odo, 'odo NPC missing')) { AV.dlg.startNpc(odo); let n = 0; while ((AV.dlg.active || AV.script.blocking) && n < 5400) { step(w); n++; } }
    if (!AV.bosses.active) need(false, 'talking to Odo did not start the fight');
    else { const b = AV.bosses.active; step(w, 60); b.hp = 0; b.die({}); let n = 0; while (!b.finished && n < 1200) { step(w); n++; } step(w, 90); n = 0; while ((AV.dlg.active || AV.script.blocking) && n < 5400) { step(w); n++; } }
    need(S.has('shield_stone'), 'no shield_stone after Odo');
    ok(`story: three stones held (${['hart_stone', 'bell_stone', 'shield_stone'].filter((s) => S.has(s)).length}/3), chapter ${S.get('chapter')}`);
    // endings reachable from pyre_choice
    for (const [ending, re, setup] of [
      ['last_name', /walk into the fire/i, null], ['ember_crown', /take the fire/i, null], ['long_vigil', /take up the walk/i, null],
      ['weight_of_days', /speak their names/i, () => { S.set('told_linnet', 1); S.d.hollow = 0; for (const t of ['tag_posy', 'tag_well', 'tag_edge', 'tag_moth', 'tag_bath', 'tag_shore', 'tag_field', 'tag_crypt']) S.d.items[t] = 1; }],
      ['quiet', /shall i|snuff|yes/i, null]]) {
      const snap = JSON.stringify(S.d);
      if (setup) setup();
      let reached = null;
      const orig = G.startEnding;
      G.startEnding = (id) => { reached = id; AV.dlg.active = null; AV.script.clear(); };
      const prevPolicy = choicePolicy;
      choicePolicy = 'match';
      matchRe = re;
      run('pyre_choice');
      choicePolicy = prevPolicy;
      G.startEnding = orig;
      need(reached === ending, `pyre_choice could not reach ending ${ending} (got ${reached})`);
      if (!AV.data.endings[ending]) need(false, `ending ${ending} not defined`);
      S.load(JSON.parse(snap));
    }
    ok('story: walkthrough complete');
  } catch (err) { fail('story: ' + err.stack.split('\n').slice(0, 4).join(' | ')); }
}
let matchRe = null;
const _autoDialogue = autoDialogue;
autoDialogue = function () {
  const s = AV.dlg.active;
  if (s && s.choices && choicePolicy === 'match' && matchRe) {
    virt.delete('confirm');
    if (s.task && !s.task.done) return;
    const idx = s.choices.findIndex((c) => !c.locked && matchRe.test(AV.font.strip(c.c.text)));
    const open = s.choices.map((c, i) => (c.locked ? -1 : i)).filter((i) => i >= 0);
    s.cursor = idx >= 0 ? idx : open[0];
    s.choiceT = 1;
    virt.add('confirm');
    return;
  }
  return _autoDialogue();
};

// ---------------------------------------------------------------- progression guarantees
// Critical scenes must ALWAYS hand over what the main path needs, whatever the player chooses.
function testGuarantees() {
  const cases = [
    ['linnet_after_procession', () => S.has('gate_key'), { boss_procession: 1, intro_done: 1 }],
    ['h_hart_after', () => S.has('hart_stone'), { boss_hart: 1 }],
    ['a_hollin_after', () => S.has('bell_stone'), { boss_hollin: 1 }],
    ['g_odo_after', () => S.has('shield_stone'), { boss_odo: 1 }],
  ];
  // the Queen and Agna are found by the npc talk lists
  const npcDialogue = (npc) => { const nd = AV.data.npcs[npc]; return nd && nd.talk && nd.talk.map((t) => t.dialogue).filter(Boolean); };
  (npcDialogue('queen') || []).forEach((d) => cases.push([d, () => S.has('wickward_key') || !AV.data.dialogue[d], {}, 'queen']));
  (npcDialogue('agna') || []).forEach((d) => cases.push([d, () => S.get('knows_wren'), {}, 'agna']));
  const passedBy = {};
  for (const [id, pred, flags, group] of cases) {
    if (!AV.data.dialogue[id]) { fail(`guarantee: dialogue ${id} missing`); continue; }
    let okRuns = 0;
    for (let r = 0; r < 25; r++) {
      const { world } = freshWorld(Object.keys(AV.data.maps).find((m) => m !== '__arena'));
      for (const f in flags) S.set(f, flags[f]);
      choicePolicy = 'random';
      // NPC scenes may be walked away from; the player can always talk again (up to 4 times here)
      for (let talk = 0; talk < (group ? 8 : 1) && !pred(); talk++) {
        const nd = group && AV.data.npcs[group];
        const pick = nd ? nd.talk.find((t) => !t.if || S.test(t.if)) : null;
        AV.dlg.start(pick ? pick.dialogue : id, {});
        let n = 0;
        while ((AV.dlg.active || AV.script.blocking) && n < 60 * 120) { step(world); n++; if (AV.ui.menu) AV.ui.closeAll(); }
      }
      if (pred()) okRuns++;
    }
    if (group) { passedBy[group] = Math.max(passedBy[group] || 0, okRuns); continue; }
    if (okRuns < 25) fail(`guarantee: ${id} delivered its progression in only ${okRuns}/25 random playthroughs`);
    else ok(`guarantee: ${id} always delivers`);
  }
  for (const g in passedBy) {
    // for NPCs with several talk entries, at least the entry the player meets first must always deliver
    if (passedBy[g] < 25) fail(`guarantee: no ${g} dialogue always delivers (best ${passedBy[g]}/25)`);
    else ok(`guarantee: ${g} always delivers`);
  }
}

// ---------------------------------------------------------------- main
const kinds = Object.keys(AV.data.enemies);
const bosses = Object.keys(AV.data.bosses);
switch (mode) {
  case 'enemy': (target ? [target] : kinds).forEach(testEnemy); break;
  case 'boss': (target ? [target] : bosses).forEach(testBoss); break;
  case 'maps': testMaps(); break;
  case 'dialogue': testDialogue(target); break;
  case 'story': testStory(); break;
  case 'guarantees': testGuarantees(); break;
  case 'all':
    kinds.forEach(testEnemy);
    bosses.forEach(testBoss);
    testMaps();
    testDialogue();
    testStory();
    testGuarantees();
    break;
  default: console.log('usage: node tools/sim.js enemy|boss|maps|dialogue|all [id]');
}
console.log(`\n${failures.length} failure(s)`);
process.exit(failures.length ? 1 : 0);
