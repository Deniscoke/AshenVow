#!/usr/bin/env node
// Validate every data file against the contracts in docs/API.md and docs/BIBLE.md.
//   node tools/check.js            full report
//   node tools/check.js village    only messages mentioning "village" (any substring filter)
//   node tools/check.js --strict   exit code 1 on warnings too
'use strict';
const { loadGame } = require('./lib');

const args = process.argv.slice(2);
const strict = args.includes('--strict');
const filter = args.filter((a) => !a.startsWith('--'))[0];

const { AV, errors: loadErrors, missing } = loadGame();
const errors = [];
const warns = [];
const E = (m) => errors.push(m);
const W = (m) => warns.push(m);

for (const e of loadErrors) E(`[load] ${e.file}: ${e.message}`);
for (const m of missing) W(`[load] file not present yet: ${m}`);
if (!AV) { console.error('AV namespace missing — core failed to load'); process.exit(1); }

const D = AV.data;
const L = AV.logic;

// ---------------------------------------------------------------- contracts
const CONTRACT_MAPS = {
  crypt: ['start', 'stairs'], chandlery: ['crypt_stairs', 'door'],
  village: ['chandlery_door', 'chapel_door', 'posy_door', 'north', 'east', 'west', 'south', 'well'],
  chapel: ['door'], posy_house: ['door'], well_cave: ['well', 'mere'],
  hushwood_edge: ['west', 'maud_door', 'east'], maud_cottage: ['door'],
  hushwood_deep: ['west', 'moth_door', 'barrow', 'cave'], moth_hollow: ['door'], hart_barrow: ['south'],
  hushwood_cave: ['entrance'],
  mere_shore: ['east', 'abbey', 'cave'], abbey_cloister: ['gate', 'scriptorium_door', 'belfry_door', 'undercroft_stairs'],
  abbey_scriptorium: ['door'], abbey_undercroft: ['stairs'], abbey_belfry: ['door'],
  greyharrow_field: ['north', 'ossuary_door', 'crypt'], ossuary: ['entrance', 'heart_door'], ossuary_heart: ['door'],
  greyharrow_crypt: ['entrance'],
  royal_road: ['south', 'gate'], upper_city: ['gate', 'tallow_door', 'palace_door', 'wickward'], tallow_house: ['door'],
  palace: ['door'], wickward: ['upper', 'infirmary_door', 'pyre'], wickward_infirmary: ['door'], pyre: ['entry'],
};
const CONTRACT_NPCS = ['linnet', 'mound', 'posy', 'snuffer', 'fenwick', 'hesk', 'anselm', 'mothwife', 'maud', 'queen',
  'ormund', 'agna', 'hound', 'odo'];
const CONTRACT_ITEMS = ['wren_tag', 'gate_key', 'hart_stone', 'bell_stone', 'shield_stone', 'abbey_key', 'hound_whistle',
  'wickward_key', 'anselm_letter', 'wickward_ledger', 'wren_bird', 'maud_ring', 'posy_ribbon', 'maud_thimble',
  'moth_lantern', 'hart_tear', 'bell_shard', 'odo_seal', 'hesk_flask', 'ashen_sigil', 'oath_ribbon', 'pilgrim_breath',
  'tallow_stub', 'grave_iron', 'tag_posy', 'tag_well', 'tag_edge', 'tag_moth', 'tag_bath', 'tag_shore', 'tag_field',
  'tag_crypt', 'tag_tallow', 'tag_ward', 'tag_ghost', 'tag_bett', 'stolen_ember'];
const CONTRACT_PROPS = ['prop_bier', 'prop_shroud', 'prop_candles', 'prop_candelabra', 'prop_brazier', 'prop_altar',
  'prop_shrine', 'prop_statue_saint', 'prop_statue_knight', 'prop_well', 'prop_fountain', 'prop_cart', 'prop_barrel',
  'prop_crate', 'prop_grave_fresh', 'prop_bird', 'prop_spade', 'prop_bell_fallen', 'prop_bell_great', 'prop_bookshelf',
  'prop_desk', 'prop_cot', 'prop_bed', 'prop_table_feast', 'prop_throne', 'prop_banner', 'prop_weapon_rack',
  'prop_bone_pile', 'prop_skull_niche', 'prop_tent', 'prop_campfire', 'prop_jar_shelf', 'prop_jar', 'prop_hollow_tree',
  'prop_stag_skull', 'prop_signpost', 'prop_gate_seventh', 'prop_pyre', 'prop_lamp_post', 'prop_corpse_knight',
  'prop_corpse_pilgrim', 'prop_corpse_soldier', 'prop_corpse_monk', 'prop_tag_chimes', 'prop_sluice_wheel', 'prop_bath',
  'prop_bell_rope', 'prop_toy_horse', 'prop_ash_pile', 'prop_lilies', 'prop_gate_bars', 'prop_door_wood',
  'prop_barricade', 'prop_drum', 'prop_pikes', 'prop_crow', 'prop_hand_mark', 'prop_rubble', 'prop_hearth', 'prop_loom',
  'prop_glint'];
const ENEMY_KINDS = ['pilgrim', 'censer', 'hound', 'moth', 'briar', 'toller', 'novice', 'shieldbound', 'pikeman', 'unlit',
  'chandler', 'greyfolk', 'hound_big'];
const BOSS_IDS = ['boss_procession', 'boss_hart', 'boss_hollin', 'boss_odo', 'boss_final'];
const SHRINES = ['shrine_chandlery', 'shrine_well', 'shrine_hushwood', 'shrine_abbey', 'shrine_greyharrow', 'shrine_road',
  'shrine_city', 'shrine_wickward'];
const DERIVED = new Set(['deaths', 'hollow', 'hollow_stage', 'tags', 'pennies', 'kindles', 'chapter', 'map', 'true', 'false']);
const ENGINE_FLAG_PREFIX = ['seen_', 'visited_', 'open_', 'gone_', 'q_', 'boss_', 'lit_', 'picked_'];
const ENGINE_FLAGS = new Set(['cinder_unlocked', 'brand_risen']);
const SFX = 'swing swing2 hit hit_heavy block hurt roll step step_soft step_water heal kindle kindle_end death respawn enemy_die pickup key_item shrine rest door locked ui_move ui_select ui_back ui_open text boss_intro boss_die bell bell_big whoosh projectile slam roar growl moth splash snuff whisper quest chapter break_wall penny fire'.split(' ');
const MUSIC = 'title village hushwood abbey greyharrow city wickward pyre cave boss boss_final ending credits'.split(' ');

// ---------------------------------------------------------------- art
const sheetIds = new Set(Object.keys(AV.art.defs.sheet));
const portraitIds = new Set(Object.keys(AV.art.defs.portrait));
const iconIds = new Set(Object.keys(AV.art.defs.icon));
for (const id of sheetIds) {
  const def = AV.art.defs.sheet[id];
  if (!def.anims || !def.anims.idle && !Object.keys(def.anims).some((k) => k.startsWith('idle')))
    W(`[art] sheet ${id} has no idle anim`);
  const s = AV.art.buildSheet(id);
  for (const n in (def.anims || {})) {
    const spec = def.anims[n];
    if (spec.frames) spec.frames.forEach((f, i) => {
      if (Array.isArray(f)) {
        if (f.length !== s.h) W(`[art] ${id}.${n}[${i}] has ${f.length} rows, expected ${s.h}`);
        f.forEach((row, r) => { if (row.length !== s.w) W(`[art] ${id}.${n}[${i}] row ${r} has ${row.length} chars, expected ${s.w}`); });
      }
    });
  }
}
for (const id of portraitIds) AV.art.buildPortrait(id);
for (const id of iconIds) AV.art.buildIcon(id);
if (sheetIds.has('player')) {
  const need = 'idle_down idle_up idle_side walk_down walk_up walk_side attack_down attack_up attack_side roll_down roll_up roll_side hurt heal die kneel'.split(' ');
  for (const n of need) if (!AV.art.defs.sheet.player.anims[n]) E(`[art] player sheet missing anim ${n}`);
}
const hasArt = sheetIds.size > 0;
if (hasArt) {
  for (const p of CONTRACT_PROPS) if (!sheetIds.has(p)) W(`[art] prop sheet missing: ${p}`);
}

// ---------------------------------------------------------------- flags bookkeeping
const flagsSet = new Set();
const flagsRead = new Map(); // flag -> where
function noteCond(cond, where) {
  if (cond == null || cond === '' || typeof cond === 'function') return;
  try {
    const fn = L.compile(cond);
    for (const r of fn.refs) {
      if (r.startsWith('has:')) {
        const item = r.slice(4);
        if (!D.items[item]) E(`[ref] ${where}: condition uses has:${item} but item is not defined`);
        continue;
      }
      if (!flagsRead.has(r)) flagsRead.set(r, where);
    }
  } catch (e) { E(`[cond] ${where}: ${e.message}`); }
}
function noteActions(list, where) {
  if (!list) return;
  if (!Array.isArray(list)) { E(`[action] ${where}: 'do' must be an array`); return; }
  for (const a of list) {
    if (typeof a === 'function') continue;
    const { verb, args, rest } = L.parseAction(a);
    if (!L.VERBS.includes(verb)) { E(`[action] ${where}: unknown verb '${verb}' in "${a}"`); continue; }
    const arg0 = (args[0] || '').split('=')[0].split('*')[0];
    switch (verb) {
      case 'set': case 'unset': case 'add': flagsSet.add(arg0); break;
      case 'give': case 'take': case 'read': if (!D.items[arg0]) E(`[ref] ${where}: ${verb} unknown item '${arg0}'`); break;
      case 'quest': if (!D.quests[arg0]) E(`[ref] ${where}: unknown quest '${arg0}'`); else {
        const st = (rest.split('=')[1] || '').trim();
        if (st && !D.quests[arg0].stages[st]) W(`[ref] ${where}: quest ${arg0} has no stage ${st}`);
      } break;
      case 'dialogue': if (!D.dialogue[arg0]) E(`[ref] ${where}: unknown dialogue '${arg0}'`); break;
      case 'shop': if (!D.shops[arg0]) E(`[ref] ${where}: unknown shop '${arg0}'`); break;
      case 'ending': if (!D.endings[arg0]) W(`[ref] ${where}: ending '${arg0}' not defined (yet)`); break;
      case 'teleport': if (!D.maps[args[0]]) W(`[ref] ${where}: teleport to unknown map '${args[0]}'`);
        else if (!(D.maps[args[0]].spawns || {})[args[1]]) E(`[ref] ${where}: teleport spawn '${args[1]}' missing in ${args[0]}`); break;
      case 'sfx': if (!SFX.includes(arg0)) W(`[ref] ${where}: sfx '${arg0}' not in audio list`); break;
      case 'music': if (arg0 !== 'stop' && !MUSIC.includes(arg0)) W(`[ref] ${where}: music '${arg0}' not in audio list`); break;
      case 'boss': if (!BOSS_IDS.includes(arg0)) E(`[ref] ${where}: unknown boss '${arg0}'`); break;
      case 'spawn': if (!ENEMY_KINDS.includes(arg0)) E(`[ref] ${where}: unknown enemy kind '${arg0}'`); break;
      case 'remove': case 'snuff': case 'kill': if (arg0 !== 'self' && !D.npcs[arg0]) E(`[ref] ${where}: ${verb} unknown npc '${arg0}'`); break;
      case 'companion': if (arg0 !== 'none' && !D.npcs[arg0]) E(`[ref] ${where}: companion unknown npc '${arg0}'`); break;
      case 'chapter': if (!/^[1-5]$|^99$/.test(arg0)) W(`[ref] ${where}: chapter '${arg0}'`); break;
      default: break;
    }
  }
}

// ---------------------------------------------------------------- items / quests / speakers
for (const id of CONTRACT_ITEMS) if (!D.items[id]) W(`[contract] item not defined yet: ${id}`);
for (const id in D.items) {
  const it = D.items[id];
  if (!it.name) E(`[item] ${id} has no name`);
  if (!['key', 'relic', 'upgrade', 'tag', 'lore', 'consumable'].includes(it.kind)) E(`[item] ${id} bad kind '${it.kind}'`);
  if (it.icon && iconIds.size && !iconIds.has(it.icon)) W(`[item] ${id} icon '${it.icon}' not drawn`);
  if (Array.isArray(it.desc)) it.desc.forEach((d, i) => noteCond(d.if, `item ${id}.desc[${i}]`));
  noteActions(it.onRead, `item ${id}.onRead`);
}
for (const id in D.quests) {
  const q = D.quests[id];
  if (!q.title) E(`[quest] ${id} has no title`);
  if (!q.stages || !Object.keys(q.stages).length) E(`[quest] ${id} has no stages`);
}
for (const id in D.speakers) {
  const s = D.speakers[id];
  if (Array.isArray(s.name)) s.name.forEach((n, i) => noteCond(n.if, `speaker ${id}.name[${i}]`));
  if (s.portrait && portraitIds.size && !portraitIds.has(s.portrait)) W(`[speaker] ${id} portrait '${s.portrait}' not drawn`);
}

// ---------------------------------------------------------------- npcs
for (const id of CONTRACT_NPCS) if (!D.npcs[id]) W(`[contract] npc not defined yet: ${id}`);
for (const id in D.npcs) {
  const n = D.npcs[id];
  if (n.sprite && hasArt && !sheetIds.has(n.sprite)) W(`[npc] ${id} sprite '${n.sprite}' not drawn`);
  (n.talk || []).forEach((t, i) => {
    noteCond(t.if, `npc ${id}.talk[${i}]`);
    if (t.dialogue && !D.dialogue[t.dialogue]) E(`[npc] ${id}.talk[${i}] dialogue '${t.dialogue}' missing`);
  });
  (n.barks || []).forEach((b, i) => noteCond(b.if, `npc ${id}.barks[${i}]`));
  if (!D.speakers[id]) W(`[npc] ${id} has no speaker entry (AV.data.speakers.${id})`);
}

// ---------------------------------------------------------------- dialogue
for (const id in D.dialogue) {
  const d = D.dialogue[id];
  const where = `dialogue ${id}`;
  if (!d.nodes) { E(`[dlg] ${id} has no nodes`); continue; }
  const start = d.start || 'start';
  if (!d.nodes[start]) E(`[dlg] ${id} start node '${start}' missing`);
  for (const nid in d.nodes) {
    const n = d.nodes[nid];
    const w = `${where}.${nid}`;
    if (n.who && n.who !== 'narrator' && n.who !== 'brand' && !D.speakers[n.who]) W(`[dlg] ${w}: unknown speaker '${n.who}'`);
    if (n.next && !d.nodes[n.next]) E(`[dlg] ${w}: next '${n.next}' missing`);
    noteActions(n.do, w);
    if (n.choices) {
      if (n.choices.length > 4) W(`[dlg] ${w}: ${n.choices.length} choices (max 4 fit)`);
      n.choices.forEach((c, i) => {
        if (c.next && !d.nodes[c.next]) E(`[dlg] ${w}.choice${i}: next '${c.next}' missing`);
        noteCond(c.if, `${w}.choice${i}`); noteCond(c.lock, `${w}.choice${i}.lock`); noteActions(c.do, `${w}.choice${i}`);
        if (c.text && c.text.length > 56) W(`[dlg] ${w}.choice${i}: choice text long (${c.text.length})`);
      });
    }
    if (n.branch) n.branch.forEach((b, i) => {
      noteCond(b.if, `${w}.branch${i}`);
      if (b.next && !d.nodes[b.next]) E(`[dlg] ${w}.branch${i}: next '${b.next}' missing`);
    });
    const texts = n.text == null ? [] : Array.isArray(n.text) ? n.text : [n.text];
    texts.forEach((t, i) => {
      if (typeof t !== 'string') E(`[dlg] ${w}: text[${i}] is not a string`);
      else if (t.length > 190) W(`[dlg] ${w}: text[${i}] is ${t.length} chars (keep pages ≤ ~160)`);
      if (typeof t === 'string' && /TODO|lorem|placeholder/i.test(t)) E(`[dlg] ${w}: placeholder text`);
    });
    if (!n.text && !n.choices && !n.branch && !n.do && !n.end && !n.next) W(`[dlg] ${w}: empty node`);
  }
}

// ---------------------------------------------------------------- maps
const shrineSeen = new Map();
const idSeen = new Map();
for (const mid of Object.keys(CONTRACT_MAPS)) if (!D.maps[mid]) W(`[contract] map not defined yet: ${mid}`);
for (const mid in D.maps) {
  const m = D.maps[mid];
  const where = `map ${mid}`;
  if (!m.tiles || !m.tiles.length) { E(`[map] ${mid} has no tiles`); continue; }
  const w0 = m.tiles[0].length;
  m.tiles.forEach((r, i) => { if (r.length !== w0) E(`[map] ${mid} row ${i} length ${r.length} != ${w0}`); });
  const legend = Object.assign({}, AV.tiles.legend, m.legend || {});
  const badChars = new Set();
  m.tiles.forEach((r) => { for (const ch of r) if (!legend[ch]) badChars.add(ch); });
  if (badChars.size) E(`[map] ${mid} uses undefined tile chars: ${[...badChars].join(' ')}`);
  const grid = AV.tiles.resolve(m);
  const solidAt = (x, y) => x < 0 || y < 0 || x >= grid.w || y >= grid.h || AV.tiles.isSolid(grid.ids[y * grid.w + x]);
  const inB = (x, y) => x >= 0 && y >= 0 && x < grid.w && y < grid.h;
  if (!m.name) W(`[map] ${mid} has no name`);
  if (!m.theme) W(`[map] ${mid} has no theme`);
  if (m.music && !MUSIC.includes(m.music)) W(`[map] ${mid} music '${m.music}' unknown`);
  const need = CONTRACT_MAPS[mid] || [];
  for (const s of need) if (!(m.spawns || {})[s]) E(`[map] ${mid} missing contract spawn '${s}'`);
  for (const s in m.spawns || {}) {
    const [sx, sy] = m.spawns[s];
    if (!inB(sx, sy)) E(`[map] ${mid} spawn '${s}' out of bounds`);
    else if (solidAt(Math.floor(sx), Math.floor(sy))) E(`[map] ${mid} spawn '${s}' is on a solid tile (${grid.ids[Math.floor(sy) * grid.w + Math.floor(sx)]})`);
  }
  noteActions(m.onEnter, `${where}.onEnter`);
  (m.entities || []).forEach((e, i) => {
    const w = `${where} entity#${i}(${e.type}${e.id ? ' ' + e.id : ''})`;
    noteCond(e.if, w); noteCond(e.lockIf, w + '.lockIf');
    if (e.type !== 'trigger') { noteActions(e.do, w + '.do'); }
    noteActions(e.onDeath, w + '.onDeath'); noteActions(e.onDefeat, w + '.onDefeat');
    if (Array.isArray(e.anim)) e.anim.forEach((a, k) => noteCond(a.if, w + '.anim' + k));
    if (e.x == null || e.y == null) { E(`[map] ${w}: missing x/y`); return; }
    if (!inB(Math.floor(e.x), Math.floor(e.y))) E(`[map] ${w}: out of bounds`);
    if (e.id) {
      if (idSeen.has(e.id)) E(`[map] ${w}: duplicate id '${e.id}' (also in ${idSeen.get(e.id)})`);
      idSeen.set(e.id, mid);
    }
    const spriteCheck = (sid) => { if (sid && hasArt && !sheetIds.has(sid)) W(`[map] ${w}: sprite '${sid}' not drawn`); };
    switch (e.type) {
      case 'exit': case 'door': {
        const tm = D.maps[e.to];
        if (!e.to) E(`[map] ${w}: no 'to'`);
        else if (!tm) W(`[map] ${w}: target map '${e.to}' not defined (yet)`);
        else if (!(tm.spawns || {})[e.spawn]) E(`[map] ${w}: target spawn '${e.spawn}' missing in ${e.to}`);
        if (e.lock && !D.items[e.lock]) E(`[map] ${w}: lock item '${e.lock}' undefined`);
        spriteCheck(e.sprite);
        break;
      }
      case 'barrier': if (!e.id) E(`[map] ${w}: barrier needs an id`);
        if (e.lock && !D.items[e.lock]) E(`[map] ${w}: lock item '${e.lock}' undefined`); spriteCheck(e.sprite); break;
      case 'npc': if (!D.npcs[e.npc]) E(`[map] ${w}: unknown npc '${e.npc}'`);
        if (solidAt(Math.floor(e.x), Math.floor(e.y))) W(`[map] ${w}: npc placed on solid tile`); break;
      case 'item': case 'corpse':
        if (!e.id) E(`[map] ${w}: needs a unique id`);
        if (e.item && !D.items[e.item]) E(`[map] ${w}: unknown item '${e.item}'`);
        spriteCheck(e.sprite);
        if (e.type === 'item' && solidAt(Math.floor(e.x), Math.floor(e.y))) W(`[map] ${w}: item on solid tile`);
        break;
      case 'sign': if (e.dialogue && !D.dialogue[e.dialogue]) E(`[map] ${w}: dialogue '${e.dialogue}' missing`);
        if (!e.dialogue && !e.text) E(`[map] ${w}: sign without text`); spriteCheck(e.sprite); break;
      case 'prop': case 'decal': if (!e.sprite) E(`[map] ${w}: no sprite`); spriteCheck(e.sprite); break;
      case 'shrine': if (!SHRINES.includes(e.id)) W(`[map] ${w}: shrine id '${e.id}' not in contract list`);
        if (shrineSeen.has(e.id)) E(`[map] ${w}: duplicate shrine id`); shrineSeen.set(e.id, mid); break;
      case 'enemy': if (!ENEMY_KINDS.includes(e.kind)) E(`[map] ${w}: unknown enemy kind '${e.kind}'`);
        if (solidAt(Math.floor(e.x), Math.floor(e.y))) W(`[map] ${w}: enemy on solid tile`); break;
      case 'boss': if (!BOSS_IDS.includes(e.boss)) E(`[map] ${w}: unknown boss '${e.boss}'`);
        if (!e.arena) E(`[map] ${w}: boss needs an arena rect`); break;
      case 'trigger': if (e.dialogue && !D.dialogue[e.dialogue]) E(`[map] ${w}: dialogue '${e.dialogue}' missing`);
        noteActions(e.do, w); if (e.once !== false && !e.id) E(`[map] ${w}: once-trigger needs an id`); break;
      case 'light': case 'emitter': break;
      default: E(`[map] ${w}: unknown entity type '${e.type}'`);
    }
  });
  // reachability: flood-fill walkable tiles from every spawn (cracked walls & barriers count as passable)
  {
    const pass = (x, y) => inB(x, y) && (!solidAt(x, y) || grid.ids[y * grid.w + x] === 'wall_cracked');
    const seen = new Uint8Array(grid.w * grid.h);
    const stack = [];
    for (const s in m.spawns || {}) { const [sx, sy] = m.spawns[s]; stack.push([Math.floor(sx), Math.floor(sy)]); }
    for (const e of m.entities || []) if (e.type === 'barrier') for (let j = 0; j < (e.h || 1); j++) for (let i = 0; i < (e.w || 1); i++) {
      /* barriers are opened by play; treat their tiles as walkable */ if (inB(e.x + i, e.y + j)) seen[(e.y + j) * grid.w + e.x + i] = 2;
    }
    while (stack.length) {
      const [x, y] = stack.pop();
      if (!inB(x, y)) continue;
      const k = y * grid.w + x;
      if (seen[k] === 1) continue;
      if (seen[k] !== 2 && !pass(x, y)) continue;
      seen[k] = 1;
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
    const reach = (x, y) => [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => inB(x + dx, y + dy) && seen[(y + dy) * grid.w + x + dx] === 1);
    (m.entities || []).forEach((e, i) => {
      if (!['exit', 'door', 'npc', 'item', 'corpse', 'shrine', 'sign', 'barrier', 'trigger'].includes(e.type)) return;
      if (e.x == null) return;
      let ok = false;
      for (let j = 0; j < (e.h || 1) && !ok; j++) for (let k2 = 0; k2 < (e.w || 1) && !ok; k2++) ok = reach(Math.floor(e.x) + k2, Math.floor(e.y) + j);
      if (!ok) W(`[reach] map ${mid} entity#${i}(${e.type}${e.id ? ' ' + e.id : ''}${e.to ? ' →' + e.to : ''}) at ${e.x},${e.y} is not reachable from any spawn`);
    });
  }
  // lighting sanity
  const lights = (m.entities || []).filter((e) => e.type === 'light' || (e.type === 'prop' && e.light) || e.type === 'shrine').length
    + AV.tiles.lights(grid).length;
  if (lights === 0 && (m.ambient || 0) > 0.4) W(`[map] ${mid} has no light sources at all`);
}
for (const s of SHRINES) if (Object.keys(D.maps).length > 20 && !shrineSeen.has(s)) W(`[contract] shrine not placed: ${s}`);

// ---------------------------------------------------------------- endings / strings
for (const id in D.endings) {
  const en = D.endings[id];
  (en.slides || []).forEach((s, i) => noteCond(s.if, `ending ${id}.slide${i}`));
}

// ---------------------------------------------------------------- flags read but never set
for (const [f, where] of flagsRead) {
  if (DERIVED.has(f) || ENGINE_FLAGS.has(f) || flagsSet.has(f)) continue;
  if (ENGINE_FLAG_PREFIX.some((p) => f.startsWith(p))) continue;
  W(`[flag] '${f}' is read (${where}) but never set by any action`);
}

// ---------------------------------------------------------------- report
const show = (list) => list.filter((m) => !filter || m.includes(filter));
const es = show(errors), ws = show(warns);
for (const m of ws) console.log('WARN  ' + m);
for (const m of es) console.log('ERROR ' + m);
console.log(`\n${es.length} error(s), ${ws.length} warning(s)` + (filter ? ` matching "${filter}"` : '') +
  ` | maps ${Object.keys(D.maps).length}, npcs ${Object.keys(D.npcs).length}, dialogues ${Object.keys(D.dialogue).length}, items ${Object.keys(D.items).length}, sheets ${sheetIds.size}, portraits ${portraitIds.size}, icons ${iconIds.size}`);
process.exit(es.length || (strict && ws.length) ? 1 : 0);
